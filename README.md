# AI Icon Generator for Figma

This is a Figma plugin that automatically generates SVG icons from text prompts using OpenAI.  
It strictly follows a design system guideline, allowing anyone to quickly and consistently create icons.

---

## ✨ Features

- Generate SVG icons from natural language prompts
- Automatic application of design system (stroke, frame, corner radius, etc.)
- Per-user OpenAI API key input, secure local storage, and security validation
- SVG security validation (blocks scripts/event attributes)
- Clean and intuitive UI

---

## 🚀 Installation & Usage

1. **Download the project**

   ```bash
   git clone https://github.com/your-username/ai-icon-generator-plugin.git
   cd ai-icon-generator-plugin
   ```

2. **Register the plugin in Figma**

   - In Figma, go to `Plugins > Development > New Plugin from Manifest...`
   - Select this folder

3. **Run the plugin**
   - Launch the plugin in Figma
   - Enter your OpenAI API key in the UI, type your icon description, and click "Generate Icon"

---

## 🔑 Getting and Entering Your OpenAI API Key

1. Get your API key from the [OpenAI dashboard](https://platform.openai.com/api-keys).
2. Paste it into the "OpenAI API Key" field in the plugin UI and click "Save Key".
3. **Your API key is stored only locally and is never included in the code or repository.**

---

## 🛡️ Security Notice

- **Never hardcode your API key or commit it to the repository.**
- This plugin stores the key only in your local Figma environment, not on any server.
- If you accidentally commit your key, immediately revoke it in the OpenAI dashboard.
- All SVGs are filtered for malicious code and event attributes before insertion.

---

## 🖌️ Design System Guidelines

- All strokes are 1.5px
- Frame: 24x24px, 2px padding (20x20 working area)
- Corner smoothing: 60%
- Minimum spacing between elements: 1.5px (bottom-right exception: 2px)
- Radius: Large (4px), Medium (3px), Small (1px)
- Minimize text usage, English/numbers (Nunito), Korean (NanumSquare Round)
- No unnecessary metadata/background/fill, center the design

---

## 🛠️ Project Structure

- `code.ts` : Main plugin logic
- `ui.html` : Plugin UI
- `style.css` : UI styles
- `manifest.json` : Figma plugin manifest

### Build/Deploy

- If developing in TypeScript, always compile to JavaScript before deploying.
- Make sure your API key is never included in the code.

---

## 📄 License

MIT License

---

## 🙋 Contact / Contributing

- Author: Hyein Kim
