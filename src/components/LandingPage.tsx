import { motion } from 'motion/react';
import {
  Eye,
  Mic,
  Brain,
  Terminal,
  Shield,
  Zap,
  Code,
  BookOpen,
  Palette,
  BarChart3,
  Gamepad2,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

interface LandingPageProps {
  onEnter: () => void;
}

interface Feature {
  icon: typeof Eye;
  title: string;
  description: string;
  accent: string;
}

interface Scenario {
  icon: typeof Code;
  title: string;
  description: string;
}

interface TechBadge {
  name: string;
  description: string;
}

const features: Feature[] = [
  {
    icon: Eye,
    title: '实时多模态交互',
    description: '同时融合屏幕画面、语音输入与上下文理解，毫秒级响应你的每一个动作与意图。',
    accent: 'text-indigo-400',
  },
  {
    icon: Zap,
    title: '智能防打断',
    description: '内置客户端 VAD 噪音门限，精准区分人声与背景噪音，告别误触发与无意义打断。',
    accent: 'text-amber-400',
  },
  {
    icon: Brain,
    title: '自定义 AI 角色',
    description: '一键切换编程大师、数学家教等预设角色，或创建专属人格，适配任何场景。',
    accent: 'text-purple-400',
  },
  {
    icon: Terminal,
    title: '上下文记忆',
    description: 'AI 自动提取并持久化你的关键偏好与事实，跨会话保持连贯的个性化体验。',
    accent: 'text-emerald-400',
  },
  {
    icon: Sparkles,
    title: '动态技能中心',
    description: '支持挂载外部 API 与 MCP 插件，让 AI 实时调用工具，能力无限扩展。',
    accent: 'text-pink-400',
  },
  {
    icon: Shield,
    title: '用户认证安全',
    description: '基于 JWT 的账号体系与管理员审核机制，API Key 安全注入，隐私无忧。',
    accent: 'text-sky-400',
  },
];

const scenarios: Scenario[] = [
  {
    icon: Code,
    title: '结对编程',
    description: '实时观察你的 IDE，指出 Bug 并给出重构建议',
  },
  {
    icon: BookOpen,
    title: '在线学习',
    description: '像私人家教一样引导你一步步解题，而非直接给答案',
  },
  {
    icon: Palette,
    title: '设计反馈',
    description: '审视你的设计稿，从配色到布局给出专业建议',
  },
  {
    icon: BarChart3,
    title: '办公数据',
    description: '解读表格与报表，帮你快速洞察关键数据趋势',
  },
  {
    icon: Gamepad2,
    title: '游戏陪玩',
    description: '看着你的游戏画面，实时提供攻略与通关技巧',
  },
];

const techStack: TechBadge[] = [
  { name: 'React 19', description: '前端框架' },
  { name: 'Gemini Live API', description: '实时多模态模型' },
  { name: 'Cloudflare', description: '边缘部署' },
  { name: 'Hono.js', description: '超轻量后端' },
];

export default function LandingPage({ onEnter }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-100 font-sans overflow-x-hidden selection:bg-indigo-500/30">
      {/* 背景光效 */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-indigo-600/10 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 -left-40 w-[500px] h-[500px] bg-sky-600/5 rounded-full blur-[100px]" />
      </div>

      {/* 导航栏 */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 flex items-center justify-between px-6 py-5 max-w-7xl mx-auto"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Eye className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold text-white">AI 实时视觉副驾</span>
        </div>
        <button
          onClick={onEnter}
          className="px-5 py-2 text-sm font-medium text-zinc-300 hover:text-white border border-white/10 hover:border-white/20 rounded-xl bg-white/5 hover:bg-white/10 transition-all"
        >
          登录 / 注册
        </button>
      </motion.nav>

      {/* Hero 区域 */}
      <section className="relative z-10 flex flex-col items-center justify-center text-center px-6 pt-20 pb-24 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm font-medium"
        >
          <Sparkles className="w-4 h-4" />
          基于 Gemini Live API 的实时多模态 AI
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-5xl md:text-7xl font-bold text-white leading-tight tracking-tight"
        >
          AI 实时视觉副驾
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.35 }}
          className="mt-6 text-lg md:text-xl text-zinc-400 max-w-2xl leading-relaxed"
        >
          看得见你屏幕、听得懂你语音的智能伙伴。
          <br className="hidden md:block" />
          无论是编程、学习还是游戏，它都坐在你旁边，实时为你出谋划策。
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="mt-10 flex flex-col sm:flex-row items-center gap-4"
        >
          <button
            onClick={onEnter}
            className="group flex items-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white text-base font-semibold rounded-2xl shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-105 transition-all duration-200"
          >
            立即体验
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <div className="flex -space-x-2">
              <div className="w-7 h-7 rounded-full bg-indigo-500/30 border-2 border-[#0a0a0a] flex items-center justify-center">
                <Code className="w-3.5 h-3.5 text-indigo-300" />
              </div>
              <div className="w-7 h-7 rounded-full bg-purple-500/30 border-2 border-[#0a0a0a] flex items-center justify-center">
                <Gamepad2 className="w-3.5 h-3.5 text-purple-300" />
              </div>
              <div className="w-7 h-7 rounded-full bg-emerald-500/30 border-2 border-[#0a0a0a] flex items-center justify-center">
                <BookOpen className="w-3.5 h-3.5 text-emerald-300" />
              </div>
            </div>
            <span>5 大场景 · 即开即用</span>
          </div>
        </motion.div>
      </section>

      {/* 核心功能网格 */}
      <section className="relative z-10 px-6 py-20 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white">核心能力</h2>
          <p className="mt-3 text-zinc-400">六大核心能力，构建完整的实时 AI 陪伴体验</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                whileHover={{ y: -6 }}
                className="group relative bg-zinc-900/50 border border-white/10 rounded-2xl p-6 backdrop-blur-sm hover:border-white/20 transition-colors overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative">
                  <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                    <Icon className={`w-6 h-6 ${feature.accent}`} />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">{feature.description}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* 应用场景 */}
      <section className="relative z-10 px-6 py-20 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white">应用场景</h2>
          <p className="mt-3 text-zinc-400">一个 AI 副驾，覆盖你工作与生活的方方面面</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {scenarios.map((scenario, index) => {
            const Icon = scenario.icon;
            return (
              <motion.div
                key={scenario.title}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="group flex flex-col items-center text-center bg-zinc-900/50 border border-white/10 rounded-2xl p-6 hover:bg-zinc-900/80 hover:border-indigo-500/30 transition-all"
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/10 border border-white/10 flex items-center justify-center mb-4 group-hover:from-indigo-500/30 group-hover:to-purple-500/20 transition-all">
                  <Icon className="w-7 h-7 text-indigo-300" />
                </div>
                <h3 className="text-base font-semibold text-white mb-1.5">{scenario.title}</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">{scenario.description}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* 技术栈 */}
      <section className="relative z-10 px-6 py-20 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white">技术栈</h2>
          <p className="mt-3 text-zinc-400">采用前沿技术构建，追求极致性能与开发体验</p>
        </motion.div>

        <div className="flex flex-wrap items-center justify-center gap-4">
          {techStack.map((tech, index) => (
            <motion.div
              key={tech.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="flex items-center gap-3 px-6 py-4 bg-zinc-900/50 border border-white/10 rounded-2xl hover:border-indigo-500/30 transition-colors"
            >
              <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
              <div>
                <p className="text-base font-semibold text-white">{tech.name}</p>
                <p className="text-xs text-zinc-500">{tech.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA 区域 */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.6 }}
        className="relative z-10 px-6 py-20 max-w-4xl mx-auto"
      >
        <div className="relative bg-gradient-to-br from-indigo-600/20 via-purple-600/10 to-transparent border border-indigo-500/20 rounded-3xl p-12 text-center overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.08),transparent_70%)]" />
          <div className="relative">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              准备好让你的 AI 副驾上线了吗？
            </h2>
            <p className="text-zinc-400 mb-8 max-w-xl mx-auto">
              共享屏幕、开启麦克风，几秒钟内即可与你的专属 AI 开始实时对话。
            </p>
            <button
              onClick={onEnter}
              className="group inline-flex items-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white text-base font-semibold rounded-2xl shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-105 transition-all duration-200"
            >
              立即体验
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </motion.section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 mt-10">
        <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Eye className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm text-zinc-400">AI 实时视觉副驾</span>
          </div>
          <p className="text-sm text-zinc-500">
            参赛作品 · TRAE AI 创造力大赛
          </p>
          <p className="text-xs text-zinc-600">
            基于 React 19 · Gemini Live API · Cloudflare · Hono.js 构建
          </p>
        </div>
      </footer>
    </div>
  );
}
