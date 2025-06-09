figma.showUI(__html__, { width: 400, height: 340 });

figma.ui.onmessage = async (msg) => {
  if (msg.type === 'save-api-key') {
    const keyName = msg.apiType === 'gemini' ? 'gemini_api_key' : 'openai_api_key';
    await figma.clientStorage.setAsync(keyName, msg.apiKey);
  }

  if (msg.type === 'get-api-key') {
    const keyName = msg.apiType === 'gemini' ? 'gemini_api_key' : 'openai_api_key';
    const apiKey = await figma.clientStorage.getAsync(keyName);
    figma.ui.postMessage({ apiKey });
  }

  if (msg.type === 'generate-icon') {
    const apiType = msg.apiType || 'openai';
    const keyName = apiType === 'gemini' ? 'gemini_api_key' : 'openai_api_key';
    const apiKey = await figma.clientStorage.getAsync(keyName);
    if (!apiKey) {
      figma.notify(`${apiType.toUpperCase()} API 키를 입력하고 저장하세요.`);
      figma.ui.postMessage({ generationDone: true });
      return;
    }

    const userPrompt = msg.prompt;

    const systemPrompt = `You are an icon designer who strictly follows the design guidelines below to create SVG icons.\n\nDesign System Rules:\n1. Outline Icon Type이어야 한다.\n2. Path로 그려내고 그 결과값은 Stroke 1.5px이어야 한다.\n3. Fill으로 그려내지 않는다.\n4. All strokes are 1.5px wide.\n5. Frame size is 24x24 pixels.\n6. Corner smoothing is 60%.\n7. All icons are placed on a 24px grid, with 2px padding (design within a 20x20 area).\n8. Separate elements by at least 1.5px.\n9. Exception: Bottom-right elements can be separated by up to 2px.\n10. Use radius:\n  - Large (4px): For outer frames or big rectangular shapes.\n  - Medium (3px): For medium-sized supporting shapes.\n  - Small (1px): For fine details or acute corners.\n11. Do not include text in icons unless absolutely necessary.\n12. Output only the clean, minimal SVG without extra metadata. No background, no fill color unless specified. Center the design inside the 24x24 frame.\n13. Ensure all elements are geometrically centered and do not overlap. Keep proportions between parts (e.g., icon arms, boxes) consistent. Maintain symmetry where applicable. Avoid unnecessary path complexity.\n\nWhen generating icons, strictly adhere to these constraints.`;

    let svg = '';
    let errorMsg = '';
    if (apiType === 'openai') {
      // OpenAI API 호출
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Create an icon that represents: ${userPrompt}` }
          ],
          temperature: 0.4
        })
      });
      const data = await response.json();
      if (!response.ok) {
        errorMsg = response.statusText;
        if (data.error && data.error.message) errorMsg = data.error.message;
        figma.notify('OpenAI API 요청 실패: ' + errorMsg);
        figma.ui.postMessage({ generationDone: true });
        return;
      }
      if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
        figma.notify('OpenAI 응답이 올바르지 않습니다.');
        figma.ui.postMessage({ generationDone: true });
        return;
      }
      svg = data.choices[0].message.content;
    } else if (apiType === 'gemini') {
      // Gemini API 호출 (systemPrompt + SVG 예시 포함)
      const exampleSVGs = `
Example 1:
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path fill-rule="evenodd" clip-rule="evenodd" d="M14.4965 15.8073C13.2036 16.8652 11.5509 17.5 9.75 17.5C5.60787 17.5 2.25 14.1421 2.25 10C2.25 5.85786 5.60787 2.5 9.75 2.5C13.8921 2.5 17.25 5.85786 17.25 10C17.25 11.801 16.6152 13.4537 15.5572 14.7466L20.5303 19.7197C20.8232 20.0125 20.8232 20.4874 20.5303 20.7803C20.2375 21.0732 19.7626 21.0732 19.4697 20.7803L14.4965 15.8073ZM15.75 10C15.75 13.3137 13.0637 16 9.75 16C6.43629 16 3.75 13.3137 3.75 10C3.75 6.68629 6.43629 4 9.75 4C13.0637 4 15.75 6.68629 15.75 10Z" fill="#747B8B"/>
</svg>
Example 2:
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M21 5.75C21 6.16421 20.6642 6.5 20.25 6.5L3.75 6.5C3.33579 6.5 3 6.16421 3 5.75C3 5.33579 3.33579 5 3.75 5H20.25C20.6642 5 21 5.33579 21 5.75Z" fill="#747B8B"/>
<path d="M21 12C21 12.4142 20.6642 12.75 20.25 12.75L3.75 12.75C3.33579 12.75 3 12.4142 3 12C3 11.5858 3.33579 11.25 3.75 11.25L20.25 11.25C20.6642 11.25 21 11.5858 21 12Z" fill="#747B8B"/>
<path d="M20.25 19C20.6642 19 21 18.6642 21 18.25C21 17.8358 20.6642 17.5 20.25 17.5L3.75 17.5C3.33579 17.5 3 17.8358 3 18.25C3 18.6642 3.33579 19 3.75 19L20.25 19Z" fill="#747B8B"/>
</svg>
Example 3:
<svg viewBox="64 64 896 896" focusable="false" xmlns="http://www.w3.org/2000/svg"><path d="M909.6 854.5L649.9 594.8C690.2 542.7 712 479 712 412c0-80.2-31.3-155.4-87.9-212.1-56.6-56.7-132-87.9-212.1-87.9s-155.5 31.3-212.1 87.9C143.2 256.5 112 331.8 112 412c0 80.1 31.3 155.5 87.9 212.1C256.5 680.8 331.8 712 412 712c67 0 130.6-21.8 182.7-62l259.7 259.6a8.2 8.2 0 0011.6 0l43.6-43.5a8.2 8.2 0 000-11.6zM570.4 570.4C528 612.7 471.8 636 412 636s-116-23.3-158.4-65.6C211.3 528 188 471.8 188 412s23.3-116.1 65.6-158.4C296 211.3 352.2 188 412 188s116.1 23.2 158.4 65.6S636 352.2 636 412s-23.3 116.1-65.6 158.4z" /></svg>
Example 4:
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path fill-rule="evenodd" clip-rule="evenodd" d="M18.5303 8.96982C18.8232 9.26272 18.8232 9.73759 18.5303 10.0305L12.5303 16.0305C12.2374 16.3234 11.7626 16.3234 11.4697 16.0305L5.46967 10.0305C5.17678 9.73759 5.17678 9.26272 5.46967 8.96982C5.76256 8.67693 6.23744 8.67693 6.53033 8.96982L12 14.4395L17.4697 8.96982C17.7626 8.67693 18.2374 8.67693 18.5303 8.96982Z" fill="#747B8B"/>
</svg>
`;
      const promptText = `You MUST use only SVG <path> elements (as if using the Pen tool in a vector editor) to create the icon.\nDo NOT use <rect>, <circle>, <ellipse>, or <line> elements.\n\n${systemPrompt}\n\nHere are some example SVG icons that follow these rules:\n${exampleSVGs}\n\nNow, create an SVG icon that represents: ${userPrompt}\nOutput only the SVG code, in the same style as the examples above.`;
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-pro:generateContent?key=' + apiKey, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            { parts: [ { text: promptText } ] }
          ],
          generationConfig: { temperature: 0.3 }
        })
      });
      const data = await response.json();
      if (!response.ok) {
        errorMsg = response.statusText;
        if (data.error && data.error.message) errorMsg = data.error.message;
        figma.notify('Gemini API 요청 실패: ' + errorMsg);
        figma.ui.postMessage({ generationDone: true });
        return;
      }
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts || !data.candidates[0].content.parts[0].text) {
        figma.notify('Gemini 응답이 올바르지 않습니다.');
        figma.ui.postMessage({ generationDone: true });
        return;
      }
      svg = data.candidates[0].content.parts[0].text;
      console.log('Gemini 응답:', svg);
    } else {
      figma.notify('지원하지 않는 API 타입입니다.');
      figma.ui.postMessage({ generationDone: true });
      return;
    }

    // 마크다운 코드 블록 제거 (```xml, ```svg, ```)
    svg = svg.replace(/```(xml|svg)?|```/g, '').trim();

    // SVG 태그만 추출 (혹시 설명이 붙어있을 경우)
    const svgMatch = svg.match(/<svg[\s\S]*?<\/svg>/i);
    if (svgMatch) {
      svg = svgMatch[0];
    }

    function isValidSVG(svg) {
      const trimmed = svg.trim();
      if (!trimmed.startsWith('<svg')) return false;
      if (/<script[\s>]/i.test(trimmed) || /on\w+=/i.test(trimmed)) return false;
      if (!trimmed.endsWith('</svg>')) return false;
      return true;
    }

    if (!isValidSVG(svg)) {
      figma.notify('생성된 SVG가 유효하지 않습니다.');
      figma.ui.postMessage({ generationDone: true });
      return;
    }

    try {
      const svgNode = figma.createNodeFromSvg(svg);
      figma.currentPage.appendChild(svgNode);
      svgNode.x = figma.viewport.center.x;
      svgNode.y = figma.viewport.center.y;
    } catch (e) {
      figma.notify('SVG 삽입 중 오류가 발생했습니다.');
      figma.ui.postMessage({ generationDone: true });
      return;
    }
    figma.ui.postMessage({ generationDone: true });
  }

  if (msg.type === 'save-api-type') {
    await figma.clientStorage.setAsync('last_api_type', msg.apiType);
  }

  if (msg.type === 'get-api-type') {
    const apiType = await figma.clientStorage.getAsync('last_api_type') || 'openai';
    figma.ui.postMessage({ apiType });
  }
};
