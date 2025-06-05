figma.showUI(__html__, { width: 400, height: 340 });

figma.ui.onmessage = async (msg) => {
  if (msg.type === 'save-api-key') {
    await figma.clientStorage.setAsync('openai_api_key', msg.apiKey);
  }

  if (msg.type === 'get-api-key') {
    const apiKey = await figma.clientStorage.getAsync('openai_api_key');
    figma.ui.postMessage({ apiKey });
  }

  if (msg.type === 'generate-icon') {
    const apiKey = await figma.clientStorage.getAsync('openai_api_key');
    if (!apiKey) {
      figma.notify('먼저 OpenAI API 키를 입력하고 저장하세요.');
      return;
    }

    const userPrompt = msg.prompt;

    const systemPrompt = `You are an icon designer who strictly follows the design guidelines below to create SVG icons.

      Design System Rules:
      1. All strokes are 1.5px wide.
      2. Frame size is 24x24 pixels.
      3. Corner smoothing is 60%.
      4. All icons are placed on a 24px grid, with 2px padding (design within a 20x20 area).
      5. Separate elements by at least 1.5px.
      6. Exception: Bottom-right elements can be separated by up to 2px.
      7. Use radius:
        - Large (4px): For outer frames or big rectangular shapes.
        - Medium (3px): For medium-sized supporting shapes.
        - Small (1px): For fine details or acute corners.
      8. Use text only when absolutely necessary:
        - English and numbers → Nunito font
        - Korean → 나눔스퀘어 라운드 (NanumSquare Round)
      9. Output only the clean, minimal SVG without extra metadata. No background, no fill color unless specified. Center the design inside the 24x24 frame.

      When generating icons, strictly adhere to these constraints.`;

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
      var errorMsg = response.statusText;
      if (data.error && data.error.message) errorMsg = data.error.message;
      figma.notify('OpenAI API 요청 실패: ' + errorMsg);
      return;
    }

    if (
      !data.choices ||
      !data.choices[0] ||
      !data.choices[0].message ||
      !data.choices[0].message.content
    ) {
      figma.notify('OpenAI 응답이 올바르지 않습니다.');
      return;
    }

    let svg = data.choices[0].message.content;
    console.log('OpenAI 응답:', svg);

    // 마크다운 코드 블록 제거
    svg = svg.replace(/```svg|```/g, '').trim();

    function isValidSVG(svg) {
      const trimmed = svg.trim();
      if (!trimmed.startsWith('<svg')) return false;
      if (/<script[\s>]/i.test(trimmed) || /on\w+=/i.test(trimmed)) return false;
      if (!trimmed.endsWith('</svg>')) return false;
      return true;
    }

    if (!isValidSVG(svg)) {
      figma.notify('생성된 SVG가 유효하지 않습니다.');
      return;
    }

    try {
      const svgNode = figma.createNodeFromSvg(svg);
      figma.currentPage.appendChild(svgNode);
      svgNode.x = figma.viewport.center.x;
      svgNode.y = figma.viewport.center.y;
    } catch (e) {
      figma.notify('SVG 삽입 중 오류가 발생했습니다.');
    }
    figma.closePlugin();
  }
};
