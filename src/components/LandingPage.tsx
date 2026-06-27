import { motion } from 'motion/react';
import {
  Eye,
  Brain,
  Terminal,
  Shield,
  ShieldCheck,
  Zap,
  Code,
  BookOpen,
  Palette,
  BarChart3,
  Gamepad2,
  ArrowRight,
  MessageSquare,
  Link2,
  RefreshCw,
  Heart,
  Gift,
  Users,
} from 'lucide-react';

interface LandingPageProps {
  onEnter: () => void;
}

interface Feature {
  icon: typeof Eye;
  title: string;
  description: string;
  accent: string;
  bg: string;
}

interface Scenario {
  icon: typeof Code;
  title: string;
  description: string;
  color: string;
}

const features: Feature[] = [
  {
    icon: Eye,
    title: '实时多模态交互',
    description: '同时融合屏幕画面、语音输入与上下文理解，毫秒级响应你的每一个动作与意图。',
    accent: 'text-indigo-400',
    bg: 'bg-indigo-500/10',
  },
  {
    icon: MessageSquare,
    title: '实时字幕与富内容',
    description: 'AI 回复实时转写为字幕，支持链接卡片展示、图片内联显示与点击放大，对话更直观。',
    accent: 'text-sky-400',
    bg: 'bg-sky-500/10',
  },
  {
    icon: Zap,
    title: '一键场景切换',
    description: '编程 Debug、游戏攻略、学习辅导、设计反馈、办公助手，五大场景即开即用。',
    accent: 'text-amber-400',
    bg: 'bg-amber-500/10',
  },
  {
    icon: Brain,
    title: '持久化记忆',
    description: 'AI 自动提取并持久化你的关键偏好与事实，跨会话保持连贯的个性化体验。',
    accent: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
  },
  {
    icon: Terminal,
    title: '动态技能中心',
    description: '支持挂载外部 Webhook 与自定义工具，让 AI 实时调用接口，能力无限扩展。',
    accent: 'text-purple-400',
    bg: 'bg-purple-500/10',
  },
  {
    icon: RefreshCw,
    title: '自动重连与恢复',
    description: 'WebSocket 断开后指数退避自动重连，短命连接智能识别，确保对话不中断。',
    accent: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
  },
  {
    icon: Link2,
    title: '智能链接展示',
    description: 'AI 通过工具调用展示可点击的链接卡片，图片 URL 自动识别并内联显示。',
    accent: 'text-pink-400',
    bg: 'bg-pink-500/10',
  },
  {
    icon: Shield,
    title: '安全认证体系',
    description: 'JWT 身份认证、管理员审核机制、API Key 后端安全注入，隐私无忧。',
    accent: 'text-rose-400',
    bg: 'bg-rose-500/10',
  },
];

const scenarios: Scenario[] = [
  {
    icon: Code,
    title: '编程 Debug',
    description: '实时观察你的 IDE，指出 Bug 并给出重构建议',
    color: 'from-blue-500/20 to-blue-600/5',
  },
  {
    icon: Gamepad2,
    title: '游戏攻略',
    description: '看着你的游戏画面，实时提供通关技巧',
    color: 'from-purple-500/20 to-purple-600/5',
  },
  {
    icon: BookOpen,
    title: '学习辅导',
    description: '像私人家教一样引导你一步步解题',
    color: 'from-emerald-500/20 to-emerald-600/5',
  },
  {
    icon: Palette,
    title: '设计反馈',
    description: '审视你的设计稿，从配色到布局给出建议',
    color: 'from-pink-500/20 to-pink-600/5',
  },
  {
    icon: BarChart3,
    title: '办公助手',
    description: '解读表格与报表，快速洞察关键数据',
    color: 'from-amber-500/20 to-amber-600/5',
  },
];

const techStack = [
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
          <span className="text-lg font-bold text-white tracking-tight">见你，懂你</span>
        </div>
        <button
          onClick={onEnter}
          className="px-5 py-2 text-sm font-medium text-zinc-300 hover:text-white border border-white/10 hover:border-white/20 rounded-xl bg-white/5 hover:bg-white/10 transition-all"
        >
          登录 / 注册
        </button>
      </motion.nav>

      {/* Hero 区域 */}
      <section className="relative z-10 flex flex-col items-center justify-center text-center px-6 pt-16 pb-20 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm font-medium"
        >
          <Heart className="w-4 h-4" />
          公益项目 · 审核通过即可免费使用
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-5xl md:text-7xl font-bold text-white leading-tight tracking-tight"
        >
          见你，懂你
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.35 }}
          className="mt-4 text-xl md:text-2xl text-indigo-300/80 font-medium"
        >
          AI 智能屏幕
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.45 }}
          className="mt-6 text-base md:text-lg text-zinc-400 max-w-2xl leading-relaxed"
        >
          看见你的屏幕，听懂你的声音。无论是编程 Debug、学习解题还是游戏通关，
          它都坐在你旁边，实时看屏、实时对话、实时出谋划策。
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.6 }}
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
              <div className="w-7 h-7 rounded-full bg-blue-500/30 border-2 border-[#0a0a0a] flex items-center justify-center">
                <Code className="w-3.5 h-3.5 text-blue-300" />
              </div>
              <div className="w-7 h-7 rounded-full bg-purple-500/30 border-2 border-[#0a0a0a] flex items-center justify-center">
                <Gamepad2 className="w-3.5 h-3.5 text-purple-300" />
              </div>
              <div className="w-7 h-7 rounded-full bg-emerald-500/30 border-2 border-[#0a0a0a] flex items-center justify-center">
                <BookOpen className="w-3.5 h-3.5 text-emerald-300" />
              </div>
              <div className="w-7 h-7 rounded-full bg-pink-500/30 border-2 border-[#0a0a0a] flex items-center justify-center">
                <Palette className="w-3.5 h-3.5 text-pink-300" />
              </div>
              <div className="w-7 h-7 rounded-full bg-amber-500/30 border-2 border-[#0a0a0a] flex items-center justify-center">
                <BarChart3 className="w-3.5 h-3.5 text-amber-300" />
              </div>
            </div>
            <span>5 大场景 · 即开即用</span>
          </div>
        </motion.div>
      </section>

      {/* 核心能力网格 */}
      <section className="relative z-10 px-6 py-16 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white">核心能力</h2>
          <p className="mt-3 text-zinc-400">八大核心能力，构建完整的实时 AI 陪伴体验</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.5, delay: index * 0.06 }}
                whileHover={{ y: -6 }}
                className="group relative bg-zinc-900/50 border border-white/10 rounded-2xl p-5 backdrop-blur-sm hover:border-white/20 transition-colors overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative">
                  <div className={`w-11 h-11 rounded-xl ${feature.bg} border border-white/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-5 h-5 ${feature.accent}`} />
                  </div>
                  <h3 className="text-base font-semibold text-white mb-1.5">{feature.title}</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">{feature.description}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* 应用场景 */}
      <section className="relative z-10 px-6 py-16 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white">应用场景</h2>
          <p className="mt-3 text-zinc-400">一个 AI 伙伴，覆盖你工作与生活的方方面面</p>
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
                className={`group flex flex-col items-center text-center bg-gradient-to-br ${scenario.color} border border-white/10 rounded-2xl p-6 hover:border-indigo-500/30 transition-all`}
              >
                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Icon className="w-7 h-7 text-white/80" />
                </div>
                <h3 className="text-base font-semibold text-white mb-1.5">{scenario.title}</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">{scenario.description}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* 公益初心 */}
      <section className="relative z-10 px-6 py-16 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-4 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm font-medium">
            <Heart className="w-4 h-4" />
            科技普惠 · 教育公平
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white">为什么免费？</h2>
          <p className="mt-3 text-zinc-400">好的教育资源不该只属于付费的人</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6"
          >
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-white/10 flex items-center justify-center mb-4">
              <Gift className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="text-base font-semibold text-white mb-2">完全免费</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              无论是编程 Debug、学习解题还是设计反馈，所有功能对审核通过的用户完全免费开放。
              科技应该普惠，而不是只有付费才能享受。
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6"
          >
            <div className="w-11 h-11 rounded-xl bg-sky-500/10 border border-white/10 flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5 text-sky-400" />
            </div>
            <h3 className="text-base font-semibold text-white mb-2">审核制保障</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              AI 接口有真实成本，审核制是为了把有限资源优先分配给真正有学习需求的人，
              而非被滥用或闲置。这不是限制，是对资源的负责。
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6"
          >
            <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-white/10 flex items-center justify-center mb-4">
              <Users className="w-5 h-5 text-amber-400" />
            </div>
            <h3 className="text-base font-semibold text-white mb-2">谁适合用</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              自学编程的新人、需要辅导的学生、请不起家教的家庭、缺少指导的创作者。
              只要你有真实的学习或创作需求，都欢迎申请。
            </p>
          </motion.div>
        </div>
      </section>

      {/* 技术栈 */}
      <section className="relative z-10 px-6 py-16 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
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
        className="relative z-10 px-6 py-16 max-w-4xl mx-auto"
      >
        <div className="relative bg-gradient-to-br from-indigo-600/20 via-purple-600/10 to-transparent border border-indigo-500/20 rounded-3xl p-12 text-center overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.08),transparent_70%)]" />
          <div className="relative">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              有学习需求？欢迎申请
            </h2>
            <p className="text-zinc-400 mb-8 max-w-xl mx-auto">
              注册后提交审核，通过即可免费使用全部功能。共享屏幕、开启麦克风，几秒钟内开始实时对话。
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
            <span className="text-sm text-zinc-400">见你，懂你</span>
          </div>
          <p className="text-sm text-zinc-500">
            公益项目 · TRAE AI 创造力大赛
          </p>
          <p className="text-xs text-zinc-600">
            基于 React 19 · Gemini Live API · Cloudflare · Hono.js 构建
          </p>
        </div>
      </footer>
    </div>
  );
}
