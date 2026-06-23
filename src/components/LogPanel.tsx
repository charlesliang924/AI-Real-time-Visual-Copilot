import React, { useEffect, useRef } from 'react';
import { Terminal } from 'lucide-react';

export interface LogPanelProps {
  logs: string[];
}

export default function LogPanel({ logs }: LogPanelProps) {
  const endRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    if (endRef.current) {
      endRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  /**
   * 解析日志行，格式为 "[时间戳] 消息内容"
   * 返回 [时间戳部分, 消息部分]
   */
  const parseLog = (log: string): [string, string] => {
    const match = log.match(/^\[([^\]]+)\]\s*(.*)$/);
    if (match) {
      return [`[${match[1]}]`, match[2]];
    }
    return ['', log];
  };

  return (
    <div className="flex-1 bg-zinc-900/50 border border-white/10 rounded-2xl p-4 backdrop-blur-sm flex flex-col overflow-hidden min-h-[200px]">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
          <Terminal className="w-4 h-4 text-purple-400" />
          系统日志
        </h2>
        {logs.length > 0 && (
          <span className="text-xs text-zinc-600 font-mono">
            {logs.length} 条
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto font-mono text-xs space-y-2 pr-2 custom-scrollbar">
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-zinc-600">
            <Terminal className="w-8 h-8 mb-2 opacity-40" />
            <p className="italic">等待系统初始化...</p>
          </div>
        ) : (
          logs.map((log, i) => {
            const [timestamp, message] = parseLog(log);
            return (
              <div
                key={i}
                className="text-zinc-300 break-words leading-relaxed flex gap-2"
              >
                {timestamp && (
                  <span className="text-indigo-400 shrink-0">
                    {timestamp}
                  </span>
                )}
                <span className="text-zinc-300">{message}</span>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>
    </div>
  );
}
