import React from 'react';
import { Activity, Terminal, Trash2, Plus, Brain, Sparkles } from 'lucide-react';

interface MemoryPanelProps {
  memories: Array<{ id: string; fact: string; created_at: number }>;
  skills: Array<{ id: string; name: string; description: string; endpoint: string }>;
  onDeleteMemory: (id: string) => void;
  onDeleteSkill: (id: string) => void;
  onAddSkill: () => void;
}

export default function MemoryPanel({
  memories,
  skills,
  onDeleteMemory,
  onDeleteSkill,
  onAddSkill,
}: MemoryPanelProps) {
  return (
    <div className="space-y-5">
      {/* ===================== 上下文记忆 (Memory) ===================== */}
      <div>
        <div className="flex items-center gap-2 mb-2.5 px-1">
          <Activity className="w-3.5 h-3.5 text-emerald-400" />
          <h3 className="text-xs font-semibold text-zinc-300 tracking-wide">
            上下文记忆 (Memory)
          </h3>
          {memories.length > 0 && (
            <span className="ml-auto text-[10px] text-zinc-600 font-mono">
              {memories.length} 条
            </span>
          )}
        </div>

        <div className="space-y-1.5">
          {memories.length === 0 ? (
            <div className="bg-black/30 rounded-lg p-3 text-xs text-zinc-500 leading-relaxed border border-white/5">
              在这个对话中你还没有专属记忆。你可以对 AI 说："记住我现在正在学前端"
            </div>
          ) : (
            memories.map((m) => (
              <div
                key={m.id}
                className="group flex items-start gap-2 bg-black/30 rounded-lg p-2.5 border border-white/5 hover:border-emerald-500/20 transition-colors"
              >
                <Brain className="w-3 h-3 text-emerald-400/60 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-zinc-300 leading-relaxed">{m.fact}</p>
                  <p className="text-[10px] text-zinc-600 mt-1 font-mono">
                    {new Date(m.created_at).toLocaleString('zh-CN', {
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <button
                  onClick={() => onDeleteMemory(m.id)}
                  className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 transition-all shrink-0 p-0.5"
                  title="删除记忆"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ===================== 动态技能中心 (Skill Hub) ===================== */}
      <div>
        <div className="flex items-center justify-between mb-2.5 px-1">
          <div className="flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-purple-400" />
            <h3 className="text-xs font-semibold text-zinc-300 tracking-wide">
              动态技能中心 (Skill Hub)
            </h3>
            {skills.length > 0 && (
              <span className="text-[10px] text-zinc-600 font-mono">
                {skills.length} 个
              </span>
            )}
          </div>
          <button
            onClick={onAddSkill}
            className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 transition-colors font-medium"
          >
            <Plus className="w-3 h-3" />
            添加技能
          </button>
        </div>

        <div className="space-y-1.5">
          {skills.length === 0 ? (
            <div className="bg-black/30 rounded-lg p-3 text-xs text-zinc-500 leading-relaxed border border-white/5">
              还没有自定义技能。点击"添加技能"连接你的大模型接口。
            </div>
          ) : (
            skills.map((s) => (
              <div
                key={s.id}
                className="group bg-black/30 rounded-lg p-2.5 border border-white/5 hover:border-purple-500/20 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-purple-400/70 shrink-0" />
                      <p className="text-xs font-medium text-zinc-200 truncate">
                        {s.name}
                      </p>
                    </div>
                    {s.description && (
                      <p className="text-xs text-zinc-500 mt-1 leading-relaxed line-clamp-2">
                        {s.description}
                      </p>
                    )}
                    <p className="text-[10px] text-zinc-600 mt-1 font-mono truncate">
                      {s.endpoint}
                    </p>
                  </div>
                  <button
                    onClick={() => onDeleteSkill(s.id)}
                    className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 transition-all shrink-0 p-0.5"
                    title="删除技能"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
