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
    second: '2-digit',
    hour12: false,
  });
}

export default function SubtitleDisplay({ subtitles }: SubtitleDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    if (endRef.current) {
      endRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [subtitles]);

  // 仅显示最近 30 条
  const recentSubtitles = subtitles.slice(-30);

  return (
    <div className="flex-1 bg-zinc-900/50 border border-white/10 rounded-2xl p-4 backdrop-blur-sm flex flex-col overflow-hidden min-h-[200px]">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-emerald-400" />
          实时字幕
        </h2>
        {subtitles.length > 0 && (
          <span className="text-xs text-zinc-600 font-mono">
            {subtitles.length} 条记录
          </span>
        )}
      </div>

      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar"
      >
        {recentSubtitles.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-zinc-600">
            <MessageSquare className="w-8 h-8 mb-2 opacity-40" />
            <p className="text-sm italic">等待对话开始...</p>
          </div>
        ) : (
          recentSubtitles.map((entry) => {
            const isUser = entry.role === 'user';
            return (
              <div
                key={entry.id}
                className={`flex flex-col gap-1 ${
                  isUser ? 'items-start' : 'items-end'
                }`}
              >
                {/* 角色标签 + 时间戳 */}
                <div
                  className={`flex items-center gap-1.5 text-xs ${
                    isUser ? 'text-emerald-400/70' : 'text-indigo-400/70'
                  }`}
                >
                  {isUser ? (
                    <User className="w-3 h-3" />
                  ) : (
                    <Bot className="w-3 h-3" />
                  )}
                  <span className="font-medium">
                    {isUser ? '用户' : 'AI'}
                  </span>
                  <span className="text-zinc-600 font-mono">
                    {formatTime(entry.timestamp)}
                  </span>
                </div>

                {/* 消息气泡 */}
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-xl text-sm leading-relaxed break-words ${
                    isUser
                      ? 'bg-emerald-500/10 text-emerald-100 border border-emerald-500/15 rounded-tl-sm'
                      : 'bg-indigo-500/10 text-indigo-100 border border-indigo-500/15 rounded-tr-sm'
                  }`}
                  style={{ fontFamily: "'Geist Variable', 'SF Mono', monospace" }}
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
