figma.showUI(__html__, { width: 400, height: 340 });

figma.ui.onmessage = async (msg) => {
  if (msg.type === "save-api-key") {
    const keyName =
      msg.apiType === "gemini" ? "gemini_api_key" : "openai_api_key";
    await figma.clientStorage.setAsync(keyName, msg.apiKey);
  }

  if (msg.type === "get-api-key") {
    const keyName =
      msg.apiType === "gemini" ? "gemini_api_key" : "openai_api_key";
    const apiKey = await figma.clientStorage.getAsync(keyName);
    figma.ui.postMessage({ apiKey });
  }

  if (msg.type === "generate-icon") {
    const apiType = msg.apiType || "openai";
    const keyName = apiType === "gemini" ? "gemini_api_key" : "openai_api_key";
    const apiKey = await figma.clientStorage.getAsync(keyName);
    if (!apiKey) {
      figma.notify(`${apiType.toUpperCase()} API 키를 입력하고 저장하세요.`);
      figma.ui.postMessage({ generationDone: true });
      return;
    }

    const userPrompt = msg.prompt;

    const systemPrompt = `You are an icon designer who strictly follows the design guidelines below to create SVG icons.\n\nDesign System Rules:\n1. Outline Icon Type이어야 한다.\n2. Path로 그려내고 그 결과값은 Stroke 1.5px이어야 한다.\n3. Fill으로 그려내지 않는다.\n4. All strokes are 1.5px wide.\n5. Frame size is 24x24 pixels.\n6. Corner smoothing is 60%.\n7. All icons are placed on a 24px grid, with 2px padding (design within a 20x20 area).\n8. Separate elements by at least 1.5px.\n9. Exception: Bottom-right elements can be separated by up to 2px.\n10. Use radius:\n  - Large (4px): For outer frames or big rectangular shapes.\n  - Medium (3px): For medium-sized supporting shapes.\n  - Small (1px): For fine details or acute corners.\n11. Do not include text in icons unless absolutely necessary.\n12. Output only the clean, minimal SVG without extra metadata. No background, no fill color unless specified. Center the design inside the 24x24 frame.\n13. Ensure all elements are geometrically centered and do not overlap. Keep proportions between parts (e.g., icon arms, boxes) consistent. Maintain symmetry where applicable. Avoid unnecessary path complexity.\n\nWhen generating icons, strictly adhere to these constraints.`;

    let svg = "";
    let errorMsg = "";
    if (apiType === "openai") {
      // OpenAI API 호출
      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o",
            messages: [
              { role: "system", content: systemPrompt },
              {
                role: "user",
                content: `Create an icon that represents: ${userPrompt}`,
              },
            ],
            temperature: 0.4,
          }),
        }
      );
      const data = await response.json();
      if (!response.ok) {
        errorMsg = response.statusText;
        if (data.error && data.error.message) errorMsg = data.error.message;
        figma.notify("OpenAI API 요청 실패: " + errorMsg);
        figma.ui.postMessage({ generationDone: true });
        return;
      }
      if (
        !data.choices ||
        !data.choices[0] ||
        !data.choices[0].message ||
        !data.choices[0].message.content
      ) {
        figma.notify("OpenAI 응답이 올바르지 않습니다.");
        figma.ui.postMessage({ generationDone: true });
        return;
      }
      svg = data.choices[0].message.content;
    } else if (apiType === "gemini") {
      const response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-pro:generateContent?key=" +
          apiKey,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `${systemPrompt}\n\nCreate an icon that represents: ${userPrompt}`,
                  },
                ],
              },
            ],
            generationConfig: { temperature: 0.3 },
          }),
        }
      );
      const data = await response.json();
      if (!response.ok) {
        errorMsg = response.statusText;
        if (data.error && data.error.message) errorMsg = data.error.message;
        figma.notify("Gemini API 요청 실패: " + errorMsg);
        figma.ui.postMessage({ generationDone: true });
        return;
      }
      if (
        !data.candidates ||
        !data.candidates[0] ||
        !data.candidates[0].content ||
        !data.candidates[0].content.parts ||
        !data.candidates[0].content.parts[0].text
      ) {
        figma.notify("Gemini 응답이 올바르지 않습니다.");
        figma.ui.postMessage({ generationDone: true });
        return;
      }
      svg = data.candidates[0].content.parts[0].text;
      console.log("Gemini 응답:", svg);
    } else {
      figma.notify("지원하지 않는 API 타입입니다.");
      figma.ui.postMessage({ generationDone: true });
      return;
    }

    // 마크다운 코드 블록 제거 (```xml, ```svg, ```)
    svg = svg.replace(/```(xml|svg)?|```/g, "").trim();

    // SVG 태그만 추출 (혹시 설명이 붙어있을 경우)
    const svgMatch = svg.match(/<svg[\s\S]*?<\/svg>/i);
    if (svgMatch) {
      svg = svgMatch[0];
    }

    function isValidSVG(svg) {
      const trimmed = svg.trim();
      if (!trimmed.startsWith("<svg")) return false;
      if (/<script[\s>]/i.test(trimmed) || /on\w+=/i.test(trimmed))
        return false;
      if (!trimmed.endsWith("</svg>")) return false;
      return true;
    }

    if (!isValidSVG(svg)) {
      figma.notify("생성된 SVG가 유효하지 않습니다.");
      figma.ui.postMessage({ generationDone: true });
      return;
    }

    try {
      const svgNode = figma.createNodeFromSvg(svg);
      figma.currentPage.appendChild(svgNode);
      svgNode.x = figma.viewport.center.x;
      svgNode.y = figma.viewport.center.y;
    } catch (e) {
      figma.notify("SVG 삽입 중 오류가 발생했습니다.");
      figma.ui.postMessage({ generationDone: true });
      return;
    }
    figma.ui.postMessage({ generationDone: true });
  }

  if (msg.type === "save-api-type") {
    await figma.clientStorage.setAsync("last_api_type", msg.apiType);
  }

  if (msg.type === "get-api-type") {
    const apiType =
      (await figma.clientStorage.getAsync("last_api_type")) || "openai";
    figma.ui.postMessage({ apiType });
  }
};
