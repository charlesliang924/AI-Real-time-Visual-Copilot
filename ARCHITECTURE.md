# AI 实时视觉副驾 - 架构升级方案 (OpenClaw / Hermes 参考)

基于您的要求，我们将把系统升级为一个支持 **多角色配置 (Personas/Knowledge Bases)**、**长期记忆 (Memory)** 和 **工具/技能生态 (Skills/Tools)** 的全功能 Agent 架构。同时，将底层的身份认证与数据存储完全迁移至 **Cloudflare (Pages + D1 + R2)** 生态。

由于您要求“先做好架构，确定后再开始写代码”，以下是详细的架构设计与实施路线图：

---

## 一、 系统基础架构 (Cloudflare 迁移)

放弃 Firebase，全面拥抱 Cloudflare 生态，实现更高的自定义自由度与性能。

### 1. 部署与环境
- **前端部署：** Cloudflare Pages (直接通过 GitHub 仓库集成，构建 Vite 项目并发布)。
- **后端 API：** Cloudflare Pages Functions (或使用 Hono.js 搭建 API，部署到 Cloudflare Workers)。
- **数据库 (D1)：** 存储用户（Username/Password）、角色设定、长期记忆、知识库索引。
- **对象存储 (R2)：** 存储用户上传的知识库文档、屏幕截图、工具所需的静态资源。

### 2. 身份认证模块
- **废弃** Firebase Phone Auth。
- **新增** 基于 JWT 的用户名/密码注册与登录系统。加密存储密码哈希在 D1 数据库中。

---

## 二、 Agent 核心能力架构 (参考 OpenClaw)

我们将把应用抽象为一个拥有“大脑”、“记忆”和“双手”的 Agent 框架。

### 1. 角色系统 (Personas & Knowledge Base)
支持用户在前端创建和切换不同的“陪伴陪伴卡”：
- **Schema 定义 (D1)：** `id`, `user_id`, `name` (如：游戏攻略大师, 初中代数辅导员), `system_prompt`, `voice_name`, `linked_knowledge_base_id`。
- **知识库接入：** 若该角色挂载了知识库，系统启动时将知识库的摘要/检索索引作为上下文 (Context) 注入。

### 2. 长短期记忆机制 (Memory)
参考 Hermes Agent 的状态管理，解决 Live API 目前没有持久化记忆的短板。
- **工作区 (Working Context)：** 当前连接中的对话流。
- **持久化短期记忆 (Session Memory)：** 用户断开/重连时，立刻通过 `systemInstruction` 的形式将“上一次聊到哪里”告诉模型。
- **长期记忆提取 (Long-term DB)：** AI 具备 `saveMemory()` 和 `queryMemory()` 的内部工具（Skill），它可以主动将用户的关键偏好（例如“用户容易在三角函数出错”）写入 D1 数据表，供未来会话自动回放。

### 3. 工具与技能生态 (Skills & Tools)
结合 `@google/genai` Live API 对 Function Calling 的原生支持，构建本地的 Skill Hub。
- **架构设计：** 在前端 (或 Cloudflare Worker) 维护一个 `ToolRegistry`。
- **与 Live API 对接：** 建立连接时，将注册的技能合集转换为 `functionDeclarations` 传递给 Gemini 模型。
- **事件拦截：** 在 WebSocket 的 `onmessage` 中拦截 `toolCall` 事件，执行对应逻辑后，使用 `session.sendToolResponse` 将结果传回给模型。

#### 预置核心 Skills 蓝图：
*   **📚 文档检索 (Context_Retrieval)：** 在上传的知识库文档 (或 R2 静态资源) 中搜索指定内容。（游戏维基/复习资料查询）
*   **🧠 记忆管理 (Memory_Read_Write)：** 允许大模型主动记录用户的喜好或进度。
*   **⚙️ UI 动作控制 (Browser_Action)：** 大模型通过工具调用直接在网页上画图、弹出提示框、或者翻页（后续甚至可以在页面内嵌的白板上直接解题）。
*   **🌐 实时网络搜索 (Google_Search)：** 调用官方内置 `googleSearch` 工具应对知识库以外的新知识。

---

## 三、 演进步骤路线图

如果该架构符合您的预期，我们将按照以下三步进行代码实现：

1.  **Phase 1: Cloudflare 迁移 & 账号系统重构**
    - 移除 Firebase，搭建 SQLite/D1 数据库结构，手写 用户注册/登录 (Username + Password) 及其前端 UI。
2.  **Phase 2: Agent 核心引入与 UI 改造**
    - 开发“角色管理”面板（添加、编辑 Personas 和 System Prompts）。
    - 绑定角色到 Gemini Live API 连接模块，并实现基于 D1 功能的自动记忆上下文注入。
3.  **Phase 3: 工具生态 (Skills) 开发**
    - 建立前端 Function Calling 的分发中心。
    - 实现记忆记忆工具、天气搜索或外部接口等测试技能。

请您评估此架构。如果您同意，请回复 **“确认，开始 Phase 1”** ，我将立即开始移除 Firebase 并编写 Cloudflare D1 的账号系统和基于密码登录的代码！
