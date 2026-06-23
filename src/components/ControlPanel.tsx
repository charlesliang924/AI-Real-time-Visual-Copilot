import React from 'react';
import {
  Mic,
  MicOff,
  MonitorUp,
  MonitorOff,
  Play,
  Square,
  Loader2,
  Activity,
  WifiOff,
  Volume2,
} from 'lucide-react';

export interface ControlPanelProps {
  isConnected: boolean;
  isScreenSharing: boolean;
  isMicActive: boolean;
  isAiSpeaking: boolean;
  isThinking: boolean;
  isReconnecting: boolean;
  reconnectAttempt: number;
  micVolume: number;
  noiseThreshold: number;
  onToggleScreenShare: () => void;
  onToggleMic: () => void;
  onToggleConnection: () => void;
  onNoiseThresholdChange: (value: number) => void;
}

export default function ControlPanel({
  isConnected,
  isScreenSharing,
  isMicActive,
  isAiSpeaking,
  isThinking,
  isReconnecting,
  reconnectAttempt,
  micVolume,
  noiseThreshold,
  onToggleScreenShare,
  onToggleMic,
  onToggleConnection,
  onNoiseThresholdChange,
}: ControlPanelProps) {
  return (
    <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">控制台</h2>
        {isAiSpeaking && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Activity className="w-3 h-3 animate-pulse" />
            AI 正在说话
          </div>
        )}
      </div>

      <div className="space-y-4">
        {/* 屏幕共享按钮 */}
        <button
          onClick={onToggleScreenShare}
          className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all duration-200 ${
            isScreenSharing
              ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20'
              : 'bg-zinc-800 text-white hover:bg-zinc-700 border border-white/5'
          }`}
        >
          {isScreenSharing ? (
            <MonitorOff className="w-5 h-5" />
          ) : (
            <MonitorUp className="w-5 h-5" />
          )}
          {isScreenSharing ? '关闭屏幕共享' : '开启屏幕共享'}
        </button>

        {/* 麦克风按钮 + 音量指示 */}
        <div className="flex flex-col gap-2">
          <button
            onClick={onToggleMic}
            className={`relative w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all duration-200 ${
              isMicActive
                ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20'
                : 'bg-zinc-800 text-white hover:bg-zinc-700 border border-white/5'
            }`}
          >
            {isMicActive ? (
              <Mic className="w-5 h-5" />
            ) : (
              <MicOff className="w-5 h-5" />
            )}
            {isMicActive ? '关闭麦克风' : '开启麦克风'}

            {/* 音量指示条 */}
            {isMicActive && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-end gap-0.5 h-6">
                {[0, 1, 2, 3, 4].map((i) => {
                  const barHeight = Math.max(
                    4,
                    Math.min(24, micVolume * 500) - i * 3
                  );
                  const active = micVolume * 500 > i * 8;
                  return (
                    <div
                      key={i}
                      className={`w-1 rounded-full transition-all duration-75 ${
                        active ? 'bg-emerald-400' : 'bg-emerald-400/20'
                      }`}
                      style={{ height: `${active ? barHeight : 4}px` }}
                    />
                  );
                })}
              </div>
            )}
          </button>

          {/* 噪音阈值滑块 */}
          <div className="flex items-center gap-3 px-3 py-2 bg-black/20 rounded-xl border border-white/5">
            <Volume2 className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
            <span className="text-xs text-zinc-400 whitespace-nowrap">
              收音阈值
            </span>
            <input
              type="range"
              min="0.001"
              max="0.05"
              step="0.001"
              value={noiseThreshold}
              onChange={(e) => onNoiseThresholdChange(parseFloat(e.target.value))}
              className="flex-1 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              title="调高可过滤背景噪音，防止打断 AI"
            />
            <span className="text-xs text-zinc-400 font-mono w-10 text-right">
              {noiseThreshold.toFixed(3)}
            </span>
          </div>
        </div>

        <div className="h-px bg-white/10 my-2" />

        {/* 连接 / 断开 AI 按钮 */}
        <button
          onClick={onToggleConnection}
          disabled={isReconnecting}
          className={`w-full flex items-center justify-center gap-2 py-4 px-4 rounded-xl font-bold transition-all duration-200 shadow-lg disabled:opacity-60 disabled:cursor-not-allowed ${
            isConnected
              ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/20'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20'
          }`}
        >
          {isConnected ? (
            <Square className="w-5 h-5 fill-current" />
          ) : (
            <Play className="w-5 h-5 fill-current" />
          )}
          {isConnected ? '断开 AI 连接' : '连接 AI 副驾'}
        </button>

        {/* AI 思考中指示器 */}
        {isThinking && (
          <div className="flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10">
            <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
            <span className="text-sm text-indigo-300">AI 思考中...</span>
          </div>
        )}

        {/* 重连中指示器 */}
        {isReconnecting && (
          <div className="flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-amber-500/5 border border-amber-500/10">
            <WifiOff className="w-4 h-4 text-amber-400 animate-pulse" />
            <span className="text-sm text-amber-300">
              正在重连... 第 {reconnectAttempt} 次
            </span>
          </div>
        )}

        <p className="text-xs text-zinc-500 text-center mt-2">
          API Key 已通过环境变量安全注入，无需手动输入。
        </p>
      </div>
    </div>
  );
}
