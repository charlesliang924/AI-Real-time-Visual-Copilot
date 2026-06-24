import { motion } from 'motion/react';
import { Code, Gamepad2, BookOpen, Palette, BarChart3, Zap } from 'lucide-react';

interface ScenePresetsProps {
  currentScene: string;
  onSelectScene: (sceneId: string, systemPrompt: string) => void;
}

interface ScenePreset {
  id: string;
  label: string;
  description: string;
  icon: typeof Code;
  activeBg: string;
  activeBorder: string;
  activeText: string;
  iconBg: string;
  systemPrompt: string;
}

const BASE_PROMPT = "当你需要给用户提供任何 URL 链接（网页或图片）时，必须调用 show_link 技能展示，不要在语音中口述 URL。界面会自动识别图片 URL 并内联显示。你可以调用 remember_fact 技能记住用户的关键信息，调用 get_current_time 技能获取当前时间。";

const scenePresets: ScenePreset[] = [
  {
    id: 'coding',
    label: '编程 Debug',
    description: '结对编程 · 实时排错',
    icon: Code,
    activeBg: 'bg-blue-500/15',
    activeBorder: 'border-blue-500/40',
    activeText: 'text-blue-300',
    iconBg: 'bg-blue-500/20',
    systemPrompt: `你是一位资深的全栈工程师，也是我的结对编程伙伴。请观察我的 IDE 和终端日志。如果你看到明显的 Error，请直接指出并告诉我解决方案。如果你看到不优雅的代码，请提出重构建议。要用简洁、极客的语气。当你需要分享文档链接或代码示例时，请调用 show_link 技能。${BASE_PROMPT}`,
  },
  {
    id: 'gaming',
    label: '游戏攻略',
    description: '实时通关指导',
    icon: Gamepad2,
    activeBg: 'bg-purple-500/15',
    activeBorder: 'border-purple-500/40',
    activeText: 'text-purple-300',
    iconBg: 'bg-purple-500/20',
    systemPrompt: `你现在是我的专属游戏视觉副驾。你可以看到我共享的实时游戏画面。请根据我当前的关卡进度、血量、敌人位置等，提供精准、简短、直接的语音通关指导和反馈。说话请保持自然、幽默、口语化，像坐在我旁边的好朋友一样。当你需要分享攻略链接时，请调用 show_link 技能。${BASE_PROMPT}`,
  },
  {
    id: 'study',
    label: '学习辅导',
    description: '私人家教 · 引导解题',
    icon: BookOpen,
    activeBg: 'bg-emerald-500/15',
    activeBorder: 'border-emerald-500/40',
    activeText: 'text-emerald-300',
    iconBg: 'bg-emerald-500/20',
    systemPrompt: `你是一位耐心、亲切的私人家教。你的任务是辅导我学习，而不是直接给出答案。看我的屏幕画面，请引导我一步步推理，在我卡壳时提供关键提示，并在我犯错时温柔地纠正。请用鼓励的语气对话。当你需要推荐学习资源链接时，请调用 show_link 技能。${BASE_PROMPT}`,
  },
  {
    id: 'design',
    label: '设计反馈',
    description: '配色布局 · 专业建议',
    icon: Palette,
    activeBg: 'bg-pink-500/15',
    activeBorder: 'border-pink-500/40',
    activeText: 'text-pink-300',
    iconBg: 'bg-pink-500/20',
    systemPrompt: `你是一位资深 UI/UX 设计师。请观察我共享的设计画面（Figma、画板等），评估我的布局、配色、间距、字体选择等，提供专业的修改建议和灵感。说话请保持专业但友好。当你需要分享设计参考链接或灵感图片时，请调用 show_link 技能。${BASE_PROMPT}`,
  },
  {
    id: 'office',
    label: '办公助手',
    description: '数据洞察 · 报表解读',
    icon: BarChart3,
    activeBg: 'bg-amber-500/15',
    activeBorder: 'border-amber-500/40',
    activeText: 'text-amber-300',
    iconBg: 'bg-amber-500/20',
    systemPrompt: `你是一位高效的办公助手。请观察我共享的 Excel、数据看板或文档画面，帮我快速总结核心指标、解读数据趋势、或者指导我写出复杂的函数公式。说话请简洁、精准、有条理。当你需要分享相关模板或文档链接时，请调用 show_link 技能。${BASE_PROMPT}`,
  },
];

// 导出默认场景的 system prompt 供 App 初始化使用
export const DEFAULT_SCENE_PROMPT = scenePresets[0].systemPrompt;

export default function ScenePresets({ currentScene, onSelectScene }: ScenePresetsProps) {
  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-2">
        <Zap className="w-3.5 h-3.5 text-indigo-400" />
        <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
          场景模式
        </h3>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1.5 custom-scrollbar">
        {scenePresets.map((scene) => {
          const Icon = scene.icon;
          const isActive = currentScene === scene.id;

          return (
            <motion.button
              key={scene.id}
              onClick={() => onSelectScene(scene.id, scene.systemPrompt)}
              whileTap={{ scale: 0.95 }}
              whileHover={{ y: -2 }}
              className={`group relative flex items-center gap-2 px-3 py-2 rounded-lg border whitespace-nowrap transition-all duration-200 shrink-0 ${
                isActive
                  ? `${scene.activeBg} ${scene.activeBorder} ${scene.activeText}`
                  : 'bg-zinc-900/50 border-white/10 text-zinc-400 hover:bg-zinc-800/60 hover:border-white/20 hover:text-zinc-200'
              }`}
            >
              <span
                className={`flex items-center justify-center w-6 h-6 rounded-md transition-colors ${
                  isActive ? scene.iconBg : 'bg-white/5 group-hover:bg-white/10'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
              </span>
              <span className="text-sm font-medium">{scene.label}</span>

              {isActive && (
                <motion.span
                  layoutId="scene-active-indicator"
                  className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-current"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
