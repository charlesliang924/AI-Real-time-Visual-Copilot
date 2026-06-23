# AI Real-time Visual Copilot (AI 实时视觉副驾)

基于 **Google Gemini Live API** 构建的实时多模态 AI 助手。它能够"看"到你的屏幕，"听"到你的声音，并以极低的延迟通过语音与你进行自然对话，成为你全天候的专属视觉副驾。

## 🌟 核心理念与应用场景

本项目不仅仅是一个"游戏陪玩"，更是一个释放大模型多模态潜力的**全场景视觉副驾**。它的应用场景包括但不限于：

- 💻 **结对编程与 Debug：** 屏幕共享你的 IDE，遇到报错时，只需一句话提问，AI 即可读取屏幕上的代码与日志，直接用语音教你如何修改。
- 📚 **在线学习与辅导：** 共享你的阅读材料或网课画面。遇到不懂的公式、文章，直接指着屏幕问它。
- 🎨 **设计与创意反馈：** 共享你的 Figma 或画板，让 AI 评估你的 UI 布局、配色搭配。
- 📊 **办公与数据分析：** 面对满屏的 Excel 表格或数据看板，让 AI 帮你快速总结核心指标。
- 🎮 **游戏实时陪玩与攻略：** 共享你的游戏画面，AI 能够识别你的关卡进度、血量和敌人，提供精准的通关策略。

## ✨ 核心特性

- **真正的实时多模态交互：** 结合 WebRTC 屏幕采集与 PCM 音频流，以 WebSocket 与 Gemini Live 建立全双工连接。

- **智能"防打断"机制 (客户端 VAD)：** 内置自适应噪音门限，配有可视化的"收音阈值"调节滑块，完美过滤背景噪音。

- **自定义 AI 角色 (Persona)：** 支持云端同步的自定义角色系统，在不同场景下随时切换 AI 扮演的角色。

- **持久化上下文记忆 (Memory)：** AI 能够通过调用内部 Skill 记住对话中提及的关键事实与偏好信息，持久化存储到数据库，跨会话保留。

- **动态技能中心 (Skill Hub)：** 内置标准工具调用外，还允许在界面上随时添加配置第三方 webhook，技能配置云端同步。

- **实时字幕显示：** AI 语音回复时实时展示文字转写，支持用户输入和 AI 输出双向字幕。

- **自动重连与错误恢复：** WebSocket 断开后自动指数退避重连，最多 5 次尝试，确保连接稳定性。

- **一键场景切换：** 预设编程 Debug、游戏攻略、学习辅导、设计反馈、办公助手 5 大场景，一键切换。

- **新手引导流程：** 首次使用时展示分步引导，帮助新用户快速上手。

- **用户认证与后台审核：** 完善的 JWT 身份认证体系，内置用户审核机制和使用数据统计面板。

- **API Key 安全加固：** API Key 仅存储在后端环境变量中，通过认证接口按需下发，访问审计日志记录。

- **平滑的音频系统：** 纯前端实现的 AudioWorklet 录音与自定义 PCMPlayer，处理底层音频采集和播放。

- **现代化 UI：** 使用 Tailwind CSS 构建，极致的暗黑风格界面，包含产品落地页、实时字幕、系统日志和语音活动波形反馈。

## 🛠 技术栈

- **前端框架：** React 19 + TypeScript + Vite
- **UI & 样式：** Tailwind CSS + Lucide React (图标) + Motion (动画)
- **后端 API：** Hono.js + Cloudflare D1 (生产环境) / better-sqlite3 (本地环境)
- **安全体系：** JWT (jose) + bcryptjs
- **AI 模型集成：** `@google/genai` (基于 `gemini-3.1-flash-live-preview`)
- **部署环境：** Cloudflare Pages 全栈部署

## 📁 项目架构

```
src/
├── api/                    # 后端 API (Hono.js)
│   ├── index.ts           # 路由入口
│   ├── auth.ts            # 认证 (注册/登录)
│   ├── auth-utils.ts      # JWT 安全工具
│   ├── admin.ts           # 管理后台 + 统计
│   ├── memories.ts        # 持久化记忆 CRUD
│   ├── conversations.ts   # 对话历史 CRUD
│   ├── personas.ts        # 角色管理 CRUD
│   ├── skills.ts          # 技能管理 CRUD
│   ├── stats.ts           # 使用统计
│   └── db.ts              # 数据库抽象层 (D1/SQLite)
├── hooks/                  # React Hooks
│   ├── useGeminiSession.ts # Gemini 连接管理 (自动重连/字幕/思考状态)
│   ├── useScreenShare.ts   # 屏幕共享 (自适应帧率)
│   ├── useAudioRecorder.ts # 音频录制 (VAD 噪音门限)
│   ├── useMemories.ts      # 记忆管理
│   ├── useConversations.ts # 对话历史
│   ├── usePersonas.ts      # 角色管理 (云端同步)
│   ├── useSkills.ts        # 技能管理 (云端同步)
│   └── useUsageStats.ts    # 使用统计
├── components/             # React 组件
│   ├── LandingPage.tsx     # 产品落地页
│   ├── ControlPanel.tsx    # 控制面板
│   ├── VideoPreview.tsx    # 视频预览
│   ├── SubtitleDisplay.tsx # 实时字幕
│   ├── LogPanel.tsx        # 系统日志
│   ├── MemoryPanel.tsx     # 记忆与技能面板
│   ├── SkillModal.tsx      # 添加技能弹窗
│   ├── OnboardingGuide.tsx # 新手引导
│   ├── ScenePresets.tsx    # 场景预设
│   ├── PersonaSelector.tsx # 角色选择器
│   ├── AdminPanel.tsx      # 管理后台
│   └── Auth.tsx            # 登录/注册
├── lib/
│   ├── audio.ts            # 音频录制与播放
│   └── api.ts              # 前端 API 客户端
├── App.tsx                 # 主应用编排
├── index.css               # 全局样式
└── main.tsx                # 入口
```

## 🚀 本地开发与运行指南

### 1. 克隆代码与安装依赖

```bash
git clone https://github.com/charlesliang924/AI-Real-time-Visual-Copilot.git
cd AI-Real-time-Visual-Copilot
npm install
```

### 2. 配置环境变量

在项目根目录创建一个 `.env` 文件：

```bash
# Gemini API Key (后端专用，不要加 VITE_ 前缀)
GEMINI_API_KEY=your_gemini_api_key_here
# JWT Secret Key (必填)
JWT_SECRET=your_super_secret_jwt_key
```

### 3. 启动开发服务器

```bash
npm run dev
```

打开浏览器访问 `http://localhost:3000`。首次运行后注册一个账号，若你需要成为管理员，用户名请固定使用 `admin` 注册。

### 4. 部署至 Cloudflare Pages

```bash
npm run build
npx wrangler pages deploy dist --project-name=ai-visual-copilot
```

## 💡 使用说明

1. **访问落地页：** 首次访问会看到产品介绍页，点击"立即体验"进入登录。
2. **连接 AI 副驾：** 点击"连接 AI 副驾"按钮，等待 AI 语音问候。
3. **切换场景：** 使用顶部场景预设按钮一键切换编程、游戏、学习等模式。
4. **开启屏幕共享：** 点击"开启屏幕共享"，选择要共享的窗口或标签页。
5. **语音对话：** 点击"开启麦克风"，观察音量跳动，调节收音阈值过滤噪音。
6. **查看字幕：** AI 回复时，下方实时显示文字字幕。
7. **体验记忆与技能：** 对 AI 说"记住我是前端开发"，或添加自定义 webhook 技能。

## ⚠️ 注意事项

- **麦克风权限：** 请在浏览器弹出权限许可时允许使用麦克风与屏幕录制。
- **iOS/iPadOS 限制：** 视觉功能主要面向 PC 端浏览器（推荐 Chrome/Edge）。
- **音频回声：** 建议戴上耳机使用。
- **API Key 安全：** API Key 仅通过后端认证接口下发，不会暴露在前端代码中。

## 🏆 TRAE AI 创造力大赛

本项目参加 [TRAE AI 创造力大赛](https://www.trae.cn/ai-creativity)，旨在探索 AI 多模态交互的更多可能性。
