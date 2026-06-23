import { motion } from 'motion/react';
import { Code, Gamepad2, BookOpen, Palette, BarChart3, Zap } from 'lucide-react';

interface ScenePresetsProps {
  currentPersonaId: string;
  onSelectScene: (sceneId: string) => void;
}

interface ScenePreset {
  id: string;
  label: string;
  description: string;
  icon: typeof Code;
  color: string;
  activeBg: string;
  activeBorder: string;
  activeText: string;
  iconBg: string;
}

const scenePresets: ScenePreset[] = [
  {
    id: 'coding',
    label: '编程 Debug',
    description: '结对编程 · 实时排错',
    icon: Code,
    color: 'blue',
    activeBg: 'bg-blue-500/15',
    activeBorder: 'border-blue-500/40',
    activeText: 'text-blue-300',
    iconBg: 'bg-blue-500/20',
  },
  {
    id: 'gaming',
    label: '游戏攻略',
    description: '实时通关指导',
    icon: Gamepad2,
    color: 'purple',
    activeBg: 'bg-purple-500/15',
    activeBorder: 'border-purple-500/40',
    activeText: 'text-purple-300',
    iconBg: 'bg-purple-500/20',
  },
  {
    id: 'study',
    label: '学习辅导',
    description: '私人家教 · 引导解题',
    icon: BookOpen,
    color: 'green',
    activeBg: 'bg-emerald-500/15',
    activeBorder: 'border-emerald-500/40',
    activeText: 'text-emerald-300',
    iconBg: 'bg-emerald-500/20',
  },
  {
    id: 'design',
    label: '设计反馈',
    description: '配色布局 · 专业建议',
    icon: Palette,
    color: 'pink',
    activeBg: 'bg-pink-500/15',
    activeBorder: 'border-pink-500/40',
    activeText: 'text-pink-300',
    iconBg: 'bg-pink-500/20',
  },
  {
    id: 'office',
    label: '办公助手',
    description: '数据洞察 · 报表解读',
    icon: BarChart3,
    color: 'amber',
    activeBg: 'bg-amber-500/15',
    activeBorder: 'border-amber-500/40',
    activeText: 'text-amber-300',
    iconBg: 'bg-amber-500/20',
  },
];

export default function ScenePresets({ currentPersonaId, onSelectScene }: ScenePresetsProps) {
  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-3">
        <Zap className="w-4 h-4 text-indigo-400" />
        <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">
          一键场景切换
        </h3>
      </div>

      <div className="flex items-center gap-2.5 overflow-x-auto pb-2 custom-scrollbar">
        {scenePresets.map((scene) => {
          const Icon = scene.icon;
          const isActive = currentPersonaId === scene.id;

          return (
            <motion.button
              key={scene.id}
              onClick={() => onSelectScene(scene.id)}
              whileTap={{ scale: 0.95 }}
              whileHover={{ y: -2 }}
              className={`group relative flex items-center gap-2.5 px-4 py-2.5 rounded-xl border whitespace-nowrap transition-all duration-200 shrink-0 ${
                isActive
                  ? `${scene.activeBg} ${scene.activeBorder} ${scene.activeText}`
                  : 'bg-zinc-900/50 border-white/10 text-zinc-400 hover:bg-zinc-800/60 hover:border-white/20 hover:text-zinc-200'
              }`}
            >
              <span
                className={`flex items-center justify-center w-7 h-7 rounded-lg transition-colors ${
                  isActive ? scene.iconBg : 'bg-white/5 group-hover:bg-white/10'
                }`}
              >
                <Icon className="w-4 h-4" />
              </span>
              <span className="flex flex-col items-start leading-tight">
                <span className="text-sm font-medium">{scene.label}</span>
                <span
                  className={`text-[10px] ${
                    isActive ? 'opacity-70' : 'text-zinc-500'
                  }`}
                >
                  {scene.description}
                </span>
              </span>

              {isActive && (
                <motion.span
                  layoutId="scene-active-indicator"
                  className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-current"
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
