# AI Real-time Visual Copilot (AI 实时视觉副驾)

基于 **Google Gemini Live API** (Gemini 3.1 Flash Live Preview) 构建的实时多模态 AI 助手。它能够“看”到你的屏幕，“听”到你的声音，并以极低的延迟通过语音与你进行自然对话，成为你全天候的专属视觉副驾。

无论你是在敲代码、做设计、写材料，还是在玩游戏，它都能根据你当前的屏幕上下文，提供最精准的实时解答与陪伴。

## 🌟 核心理念与应用场景 (More Than Just Gaming)

本项目不仅仅是一个“游戏陪玩”，更是一个释放大模型多模态潜力的**全场景视觉副驾**。它的应用场景包括但不限于：

- 💻 **结对编程与 Debug：** 屏幕共享你的 IDE（如 VS Code/Cursor），遇到报错时，只需一句话提问，AI 即可读取屏幕上的代码与日志，直接用语音教你如何修改。
- 📚 **在线学习与辅导：** 共享你的阅读材料或网课画面。遇到不懂的公式、文章，直接指着屏幕问它，它能像身边的私教一样为你答疑解惑。
- 🎨 **设计与创意反馈：** 共享你的 Figma 或画板，让 AI 评估你的 UI 布局、配色搭配，或者为你提供实时的修改灵感。
- 📊 **办公与数据分析：** 面对满屏的 Excel 表格或数据看板，让 AI 帮你快速总结核心指标，或者指导你写出复杂的函数公式。
- 🎮 **游戏实时陪玩与攻略：** 共享你的游戏画面，AI 能够识别你的关卡进度、血量和敌人，提供精准的通关策略、连招提示或剧情科普。

## ✨ 核心特性

- **真正的实时多模态交互：** 结合 WebRTC 屏幕采集与 PCM 音频流，以 WebSocket 与 Gemini Live 建立全双工连接。
- **智能“防打断”机制 (客户端 VAD)：** 内置自适应噪音门限（Noise Gate），配有可视化的“收音阈值”调节滑块。完美过滤键盘敲击声、风扇声等背景噪音，彻底解决由于环境噪音导致 AI 语音频繁被打断的痛点。
- **安全可靠的用户体系：** 深度集成 Firebase Phone Authentication，支持使用手机号接收短信验证码注册登录，结合 Invisible reCAPTCHA 防止滥用，用户数据安全存储在 Firestore。
- **平滑的音频系统：** 纯前端实现的 AudioWorklet 录音与自定义 PCMPlayer，处理底层音频采集和播放重采样。
- **现代化 UI：** 使用 Tailwind CSS 构建，极致的暗黑风格界面，包含实时的系统日志控制面板和语音活动波形反馈。

## 🛠 技术栈

- **前端框架：** React 19 + TypeScript + Vite
- **UI & 样式：** Tailwind CSS + Lucide React (图标)
- **AI 模型集成：** `@google/genai` (基于 `gemini-3.1-flash-live-preview`)
- **后端 / 身份认证：** Firebase (Auth + Firestore)
- **多媒体处理：** Web Audio API (`AudioContext`, `AudioWorklet`) + MediaDevices API

## 🚀 本地开发与运行指南

### 1. 克隆代码与安装依赖

```bash
git clone https://github.com/yourusername/AI-Real-time-Visual-Copilot.git
cd AI-Real-time-Visual-Copilot
npm install
```

### 2. 配置环境变量

在项目根目录创建一个 `.env` 文件，并填入以下参数。你需要准备一个有权限的 Google Gemini API Key，以及一个 Firebase Web 项目的配置：

```env
# Gemini API Key (推荐使用具有 Live API 权限的模型)
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# Firebase 配置
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIRESTORE_DATABASE_ID=(default)
```

*(注意：由于 Firebase 电话认证的要求，请确保在 Firebase 控制台内开启了 Phone Auth，允许了你所在的国家短信区号，并在 Authorized domains 中添加了本地环境 `localhost` 开发域名)*

### 3. 启动开发服务器

```bash
npm run dev
```

打开浏览器访问输出的本地地址（默认 `http://localhost:3000`）。

## 💡 使用说明

1. **登录：** 输入手机号并获取验证码登录（第一次使用将会自动注册）。
2. **连接 AI副驾：** 点击界面上的“连接 AI 副驾”按钮。当接收到 AI 的主动语音问候（“你好！...”）后，代表 WebSocket 通道已打通。
3. **开启全视界：** 点击“开启屏幕共享”，选择你要共享的桌面、窗口或浏览器标签页。
4. **语音对话：** 点击“开启麦克风”。请注意观察麦克风界面的绿色音量跳动。
    - **进阶：调校收音阈值。** 如果你未说话时绿条也会跳动（说明有底噪），请微微调大下方的“收音阈值”进度条，直到环境噪音被过滤。这样 AI 就不会被键盘声打断了。
5. **开始享受：** 一边操作你的软件/游戏，一边自然地向麦克风提问，让 AI 成为你的最强辅助！

## ⚠️ 注意事项与系统限制

- **麦克风权限：** 请在浏览器弹出权限许可时允许使用麦克风与屏幕录制。
- **iOS/iPadOS 限制：** 出于 Apple 底层的隐私限制，iPad/iPhone 的 Safari 系统原生不支持跨应用网页屏幕共享（`getDisplayMedia`）。当前视觉功能主要面向 PC (Windows/Mac) 端的浏览器（推荐使用 Chrome/Edge）。
- **音频回声：** 建议戴上耳机使用，以防止电脑扬声器播放出来的 AI 声音被麦克风重新录入（虽然浏览器底层带有 `echoCancellation` 但在部分设备仍可能偶现）。
