import React, { useState } from 'react';
import { Settings, Plus, LayoutGrid, Pencil, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { defaultPersonas, type Persona } from '../hooks/usePersonas';

// 重新导出类型与默认数据，保持向后兼容
export type { Persona };
export { defaultPersonas };

export interface PersonaSelectorProps {
  currentPersonaId: string;
  personas: Persona[];
  onSelect: (id: string, prompt: string) => void;
  onCreate: (data: { name: string; avatarIcon?: string; systemPrompt: string }) => void;
  onUpdate: (id: string, data: { name: string; avatarIcon?: string; systemPrompt: string }) => void;
  onDelete: (id: string) => void;
}

export function PersonaSelector({
  currentPersonaId,
  personas,
  onSelect,
  onCreate,
  onUpdate,
  onDelete,
}: PersonaSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Persona>>({});

  const handleSelect = (p: Persona) => {
    if (isEditing) return;
    onSelect(p.id, p.systemPrompt);
    setIsOpen(false);
  };

  const handleStartCreate = () => {
    setEditForm({ name: '', avatarIcon: '✨', systemPrompt: '' });
    setIsEditing(true);
  };

  const handleStartEdit = (p: Persona) => {
    setEditForm(p);
    setIsEditing(true);
  };

  const handleSave = () => {
    if (!editForm.name || !editForm.systemPrompt) return;

    const data = {
      name: editForm.name,
      avatarIcon: editForm.avatarIcon || '✨',
      systemPrompt: editForm.systemPrompt,
    };

    if (editForm.id) {
      onUpdate(editForm.id, data);
    } else {
      onCreate(data);
    }

    setIsEditing(false);
    setEditForm({});
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    onDelete(id);
    // 如果删除的是当前选中的角色，回退到默认角色
    if (currentPersonaId === id) {
      onSelect(defaultPersonas[0].id, defaultPersonas[0].systemPrompt);
    }
  };

  const currentPersona = personas.find((p) => p.id === currentPersonaId) || defaultPersonas[0];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700/50 rounded-xl text-sm font-medium transition-all group">
          <span className="text-base">{currentPersona.avatarIcon || '🤖'}</span>
          <span className="text-zinc-200">{currentPersona.name}</span>
          <Settings className="w-3 h-3 text-zinc-500 group-hover:text-zinc-300 ml-1" />
        </button>
      </DialogTrigger>

      <DialogContent className="bg-zinc-900 border-zinc-800 text-white sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg flex items-center gap-2">
            <LayoutGrid className="w-5 h-5 text-indigo-400" />
            {isEditing ? '自定义角色' : '切换陪伴角色'}
          </DialogTitle>
        </DialogHeader>

        {isEditing ? (
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">名称</label>
              <input
                type="text"
                value={editForm.name || ''}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="w-full bg-zinc-800 border-zinc-700 rounded-md px-3 py-2 text-white outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="例如：面试官"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">图标 (Emoji)</label>
              <input
                type="text"
                value={editForm.avatarIcon || ''}
                onChange={(e) => setEditForm({ ...editForm, avatarIcon: e.target.value })}
                className="w-full bg-zinc-800 border-zinc-700 rounded-md px-3 py-2 text-white outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">System Prompt (系统指令)</label>
              <textarea
                value={editForm.systemPrompt || ''}
                onChange={(e) => setEditForm({ ...editForm, systemPrompt: e.target.value })}
                className="w-full bg-zinc-800 border-zinc-700 rounded-md px-3 py-2 text-white outline-none focus:ring-2 focus:ring-indigo-500 h-32 resize-none"
                placeholder="描述这个角色的性格、语气和任务..."
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1 border-zinc-700 bg-transparent hover:bg-zinc-800 text-white hover:text-white"
                onClick={() => setIsEditing(false)}
              >
                取消
              </Button>
              <Button
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white"
                onClick={handleSave}
              >
                保存
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 py-4">
            {personas.map((p) => (
              <div
                key={p.id}
                onClick={() => handleSelect(p)}
                className={`p-4 rounded-xl border relative cursor-pointer transition-all flex flex-col group ${
                  currentPersonaId === p.id
                    ? 'bg-indigo-500/10 border-indigo-500/50'
                    : 'bg-zinc-800/40 border-white/5 hover:border-zinc-500 hover:bg-zinc-800'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{p.avatarIcon}</span>
                    <p className="font-medium text-white">{p.name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {p.isCustom && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartEdit(p);
                          }}
                          className="p-1.5 text-zinc-500 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-md transition-colors"
                          title="编辑角色"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(e, p.id)}
                          className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
                          title="删除角色"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    {currentPersonaId === p.id && (
                      <div className="w-2 h-2 rounded-full bg-indigo-400 ml-2" />
                    )}
                  </div>
                </div>
                <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                  {p.systemPrompt}
                </p>
              </div>
            ))}

            <Button
              variant="outline"
              onClick={handleStartCreate}
              className="w-full mt-2 border-dashed border-zinc-700 text-zinc-400 hover:text-white bg-transparent hover:bg-zinc-800/50"
            >
              <Plus className="w-4 h-4 mr-2" />
              自定义新角色...
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default PersonaSelector;
