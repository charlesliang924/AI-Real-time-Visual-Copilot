import React from 'react';
import { MonitorOff, Loader2, Activity } from 'lucide-react';

export interface VideoPreviewProps {
  isScreenSharing: boolean;
  isAiSpeaking: boolean;
  isThinking: boolean;
  videoRef: React.RefObject<HTMLVideoElement | null>;
}

export default function VideoPreview({
  isScreenSharing,
  isAiSpeaking,
  isThinking,
  videoRef,
}: VideoPreviewProps) {
  return (
    <div className="relative flex-1 bg-black rounded-2xl border border-white/10 overflow-hidden flex items-center justify-center shadow-2xl min-h-[300px]">
      {/* 占位提示：未开启屏幕共享 */}
      {!isScreenSharing && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-500">
          <MonitorOff className="w-16 h-16 mb-4 opacity-50" />
          <p className="text-lg font-medium">屏幕共享未开启</p>
          <p className="text-sm mt-2 opacity-70">
            点击下方按钮共享你的游戏或工作画面
          </p>
        </div>
      )}

      {/* 视频元素 */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`w-full h-full object-contain ${
          isScreenSharing ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* 扫描线效果 */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] opacity-20" />

      {/* AI 正在说话 - 脉冲边框 */}
      {isAiSpeaking && (
        <div className="pointer-events-none absolute inset-0 rounded-2xl border-2 border-indigo-400/60 animate-pulse" />
      )}

      {/* AI 思考中 - 遮罩指示器 */}
      {isThinking && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-zinc-900/80 border border-indigo-500/20 shadow-2xl">
            <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
            <span className="text-base font-medium text-indigo-200">
              AI 思考中...
            </span>
          </div>
        </div>
      )}

      {/* 右上角状态角标 */}
      {isScreenSharing && (
        <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-black/60 text-emerald-400 border border-emerald-500/20 backdrop-blur-sm">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          直播中
        </div>
      )}

      {/* 左下角 AI 状态角标 */}
      {isAiSpeaking && (
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-black/60 text-indigo-400 border border-indigo-500/20 backdrop-blur-sm">
          <Activity className="w-3 h-3 animate-pulse" />
          AI 语音输出中
        </div>
      )}
    </div>
  );
}
