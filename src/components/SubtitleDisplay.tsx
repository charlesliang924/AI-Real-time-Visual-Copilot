import React, { useEffect, useRef } from 'react';
import { MessageSquare, User, Bot } from 'lucide-react';

export interface SubtitleEntry {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
}

export interface SubtitleDisplayProps {
  subtitles: SubtitleEntry[];
}

function formatTime(ts: number): string {
  const date = new Date(ts);
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export default function SubtitleDisplay({ subtitles }: SubtitleDisplayProps) {
  const endRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    if (endRef.current) {
      endRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [subtitles]);

  // 仅显示最近 20 条
  const recentSubtitles = subtitles.slice(-20);

  return (
    <div className="flex-1 flex flex-col overflow-hidden min-h-0">
      <div
        className="flex-1 overflow-y-auto space-y-2.5 pr-1 custom-scrollbar"
      >
        {recentSubtitles.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-zinc-600 py-6">
            <MessageSquare className="w-6 h-6 mb-1.5 opacity-40" />
            <p className="text-xs italic">等待对话开始...</p>
          </div>
        ) : (
          recentSubtitles.map((entry, idx) => {
            const isUser = entry.role === 'user';
            const prevEntry = idx > 0 ? recentSubtitles[idx - 1] : null;
            // 同一角色连续消息只显示一次角色标签
            const showLabel = !prevEntry || prevEntry.role !== entry.role ||
              (entry.timestamp - prevEntry.timestamp > 60000);

            return (
              <div
                key={entry.id}
                className={`flex flex-col gap-0.5 ${isUser ? 'items-start' : 'items-end'}`}
              >
                {showLabel && (
                  <div
                    className={`flex items-center gap-1 text-[10px] uppercase tracking-wide ${
                      isUser ? 'text-emerald-400/60' : 'text-indigo-400/60'
                    }`}
                  >
                    {isUser ? (
                      <User className="w-2.5 h-2.5" />
                    ) : (
                      <Bot className="w-2.5 h-2.5" />
                    )}
                    <span className="font-semibold">{isUser ? '你' : 'AI'}</span>
                    <span className="text-zinc-700 font-mono">{formatTime(entry.timestamp)}</span>
                  </div>
                )}
                {/* 消息气泡 */}
                <div
                  className={`max-w-[90%] px-3 py-1.5 rounded-2xl text-sm leading-snug break-words ${
                    isUser
                      ? 'bg-emerald-500/10 text-emerald-50 border border-emerald-500/10 rounded-tl-md'
                      : 'bg-indigo-500/10 text-indigo-50 border border-indigo-500/10 rounded-tr-md'
                  }`}
                >
                  {entry.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>
    </div>
  );
}
