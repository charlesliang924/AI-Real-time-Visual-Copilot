import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Play,
  MonitorUp,
  Mic,
  MessageCircle,
  X,
  Check,
} from 'lucide-react';

interface OnboardingGuideProps {
  onComplete: () => void;
}

interface OnboardingStep {
  icon: typeof Play;
  title: string;
  description: string;
  tip: string;
  accent: string;
  iconBg: string;
}

const steps: OnboardingStep[] = [
  {
    icon: Play,
    title: '连接 AI 副驾',
    description: '点击界面上的「连接 AI 副驾」按钮，建立与 Gemini Live API 的实时 WebSocket 连接。',
    tip: '连接成功后，AI 会主动和你打招呼，确认已就绪。',
    accent: 'text-indigo-400',
    iconBg: 'from-indigo-500/20 to-indigo-500/5',
  },
  {
    icon: MonitorUp,
    title: '开启屏幕共享',
    description: '点击「开启屏幕共享」，选择你要共享的窗口或整个屏幕，让 AI 看到你的实时画面。',
    tip: 'AI 会以每秒一帧的速度分析你的屏幕内容。',
    accent: 'text-sky-400',
    iconBg: 'from-sky-500/20 to-sky-500/5',
  },
  {
    icon: Mic,
    title: '开启麦克风',
    description: '点击「开启麦克风」，授权浏览器使用你的麦克风，即可用语音与 AI 自然对话。',
    tip: '可拖动收音阈值滑块，过滤背景噪音防止误打断。',
    accent: 'text-emerald-400',
    iconBg: 'from-emerald-500/20 to-emerald-500/5',
  },
  {
    icon: MessageCircle,
    title: '开始对话',
    description: '一切就绪！现在你可以像和朋友聊天一样，对着麦克风说话，AI 会实时看到你的屏幕并语音回复。',
    tip: '试试说：「我正在写代码，帮我看看这里有什么问题」。',
    accent: 'text-purple-400',
    iconBg: 'from-purple-500/20 to-purple-500/5',
  },
];

export default function OnboardingGuide({ onComplete }: OnboardingGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(1);

  const isLastStep = currentStep === steps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setDirection(1);
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const step = steps[currentStep];
  const StepIcon = step.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="relative w-full max-w-lg bg-zinc-900/90 border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
      >
        {/* 顶部装饰光效 */}
        <div className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-64 bg-indigo-600/15 rounded-full blur-[80px]" />

        {/* 关闭按钮 */}
        <button
          onClick={handleSkip}
          className="absolute top-5 right-5 z-10 w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-white hover:bg-white/10 transition-colors"
          title="跳过引导"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 进度指示 */}
        <div className="relative flex items-center justify-center gap-2 pt-8 pb-2">
          {steps.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setDirection(index > currentStep ? 1 : -1);
                setCurrentStep(index);
              }}
              className="group p-1"
              title={`第 ${index + 1} 步`}
            >
              <motion.div
                animate={{
                  width: index === currentStep ? 28 : 8,
                  backgroundColor:
                    index === currentStep
                      ? 'rgb(129 140 248)'
                      : index < currentStep
                        ? 'rgb(63 81 181 / 0.6)'
                        : 'rgb(255 255 255 / 0.15)',
                }}
                transition={{ duration: 0.3 }}
                className="h-2 rounded-full"
              />
            </button>
          ))}
        </div>

        {/* 步骤内容 */}
        <div className="relative px-8 pt-6 pb-8 min-h-[320px] flex flex-col items-center text-center">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              initial={{ opacity: 0, x: direction > 0 ? 40 : -40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction > 0 ? -40 : 40 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="flex flex-col items-center w-full"
            >
              {/* 步骤编号 */}
              <span className="text-xs font-medium text-zinc-500 uppercase tracking-widest mb-5">
                步骤 {currentStep + 1} / {steps.length}
              </span>

              {/* 图标 */}
              <div
                className={`relative w-20 h-20 rounded-2xl bg-gradient-to-br ${step.iconBg} border border-white/10 flex items-center justify-center mb-6`}
              >
                <StepIcon className={`w-10 h-10 ${step.accent}`} />
                {currentStep > 0 && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                    <Check className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
              </div>

              {/* 标题 */}
              <h2 className="text-2xl font-bold text-white mb-3">{step.title}</h2>

              {/* 描述 */}
              <p className="text-sm text-zinc-400 leading-relaxed max-w-sm mb-5">
                {step.description}
              </p>

              {/* 提示 */}
              <div className="flex items-start gap-2 px-4 py-3 bg-indigo-500/5 border border-indigo-500/15 rounded-xl max-w-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0 animate-pulse" />
                <p className="text-xs text-indigo-300/80 text-left leading-relaxed">
                  {step.tip}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* 底部操作栏 */}
        <div className="relative flex items-center justify-between px-8 py-5 border-t border-white/5 bg-black/20">
          <button
            onClick={handleSkip}
            className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            跳过引导
          </button>

          <div className="flex items-center gap-3">
            {currentStep > 0 && (
              <button
                onClick={() => {
                  setDirection(-1);
                  setCurrentStep((prev) => prev - 1);
                }}
                className="px-4 py-2.5 text-sm font-medium text-zinc-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors"
              >
                上一步
              </button>
            )}
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={handleNext}
              className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-500/20 transition-colors"
            >
              {isLastStep ? (
                <>
                  <Check className="w-4 h-4" />
                  开始使用
                </>
              ) : (
                <>
                  下一步
                </>
              )}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
