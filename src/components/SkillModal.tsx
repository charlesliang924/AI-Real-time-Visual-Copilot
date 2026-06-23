import React, { useState, useEffect } from 'react';
import { Sparkles, X, Link2, FileText, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SkillModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (skill: { name: string; description: string; endpoint: string }) => void;
}

export default function SkillModal({ isOpen, onClose, onSave }: SkillModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [endpoint, setEndpoint] = useState('');
  const [errors, setErrors] = useState<{ name?: string; description?: string; endpoint?: string }>({});

  // 每次打开时重置表单
  useEffect(() => {
    if (isOpen) {
      setName('');
      setDescription('');
      setEndpoint('');
      setErrors({});
    }
  }, [isOpen]);

  // ESC 键关闭
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const validate = (): boolean => {
    const newErrors: { name?: string; description?: string; endpoint?: string } = {};

    if (!name.trim()) {
      newErrors.name = '请输入技能名称';
    } else if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(name.trim())) {
      newErrors.name = '仅允许英文字母、数字和下划线，且必须以字母开头';
    }

    if (!description.trim()) {
      newErrors.description = '请输入技能描述';
    }

    if (!endpoint.trim()) {
      newErrors.endpoint = '请输入 API Endpoint';
    } else {
      try {
        new URL(endpoint.trim());
      } catch {
        newErrors.endpoint = '请输入有效的 URL 地址';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave({
      name: name.trim(),
      description: description.trim(),
      endpoint: endpoint.trim(),
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="flex items-start justify-between mb-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white leading-tight">
                添加自定义大模型技能
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                连接任何支持 MCP 或标准 webhook 回调的接口
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300 transition-colors p-1 -mr-1 -mt-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 表单 */}
        <div className="space-y-4 mt-6">
          {/* 技能名称 */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-zinc-300 mb-1.5">
              <Tag className="w-3.5 h-3.5 text-zinc-500" />
              技能名称
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all font-mono placeholder:text-zinc-600"
              placeholder="my_custom_skill"
              autoFocus
            />
            {errors.name ? (
              <p className="text-xs text-red-400 mt-1">{errors.name}</p>
            ) : (
              <p className="text-[11px] text-zinc-600 mt-1">
                仅允许英文字母、数字和下划线，以字母开头
              </p>
            )}
          </div>

          {/* 技能描述 */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-zinc-300 mb-1.5">
              <FileText className="w-3.5 h-3.5 text-zinc-500" />
              技能描述
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all h-24 resize-none placeholder:text-zinc-600"
              placeholder="描述这个技能的功能和用途，例如：调用外部天气 API 获取实时天气信息..."
            />
            {errors.description && (
              <p className="text-xs text-red-400 mt-1">{errors.description}</p>
            )}
          </div>

          {/* API Endpoint */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-zinc-300 mb-1.5">
              <Link2 className="w-3.5 h-3.5 text-zinc-500" />
              API Endpoint
            </label>
            <input
              type="url"
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all font-mono placeholder:text-zinc-600"
              placeholder="https://api.example.com/v1/chat"
            />
            {errors.endpoint && (
              <p className="text-xs text-red-400 mt-1">{errors.endpoint}</p>
            )}
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-2 mt-6">
          <Button
            variant="outline"
            className="flex-1 border-zinc-700 bg-transparent hover:bg-zinc-800 text-white hover:text-white"
            onClick={onClose}
          >
            取消
          </Button>
          <Button
            className="flex-1 bg-purple-600 hover:bg-purple-500 text-white border-transparent"
            onClick={handleSave}
          >
            保存技能
          </Button>
        </div>
      </div>
    </div>
  );
}
