import React, { useState, useEffect } from 'react';
import { Settings, Plus, LayoutGrid, X, Pencil, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export interface Persona {
  id: string;
  name: string;
  avatarIcon?: string;
  systemPrompt: string;
  isCustom?: boolean;
}

export const defaultPersonas: Persona[] = [
  {
    id: 'default',
    name: '视觉副驾',
    avatarIcon: '🎮',
    systemPrompt: "你现在是我的专属智能视觉副驾。你可以看到我共享的实时屏幕画面，并听到我的语音指令。请根据我当前的画面进度，提供精准、简短、直接的语音指导和反馈。说话请保持自然、幽默、口语化，像坐在我旁边的好朋友一样。"
  },
  {
    id: 'math',
    name: '代数家教',
    avatarIcon: '📐',
    systemPrompt: "你是一位耐心、亲切的初中数学家教。你的任务是辅导我解题，而不是直接给出答案。看我的屏幕画面，请引导我一步步推理，在我卡壳时提供关键提示，并在我犯错时温柔地纠正。请用鼓励的语气对话。"
  },
  {
    id: 'coder',
    name: 'Debug 大师',
    avatarIcon: '💻',
    systemPrompt: "你是一位资深的全栈工程师，也是我的结值得编程伙伴。请观察我的 IDE 和终端日志。如果你看到明显的 Error，请直接指出并告诉我解决方案。如果你看到不优雅的代码，请提出重构建议。要用简洁、极客的语气。"
  }
];

export function PersonaSelector({ currentPersonaId, onSelect }: { currentPersonaId: string, onSelect: (id: string, prompt: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Persona>>({});

  useEffect(() => {
    loadPersonas();
  }, []);

  const loadPersonas = () => {
    const saved = localStorage.getItem('custom_personas');
    if (saved) {
      setPersonas([...defaultPersonas, ...JSON.parse(saved)]);
    } else {
      setPersonas(defaultPersonas);
    }
  };

  const saveCustomPersonas = (newCustomPersonas: Persona[]) => {
    localStorage.setItem('custom_personas', JSON.stringify(newCustomPersonas));
    setPersonas([...defaultPersonas, ...newCustomPersonas]);
  };

  const handleSelect = (p: Persona) => {
    if (isEditing) return;
    onSelect(p.id, p.systemPrompt);
    setIsOpen(false);
  };

  const handleStartCreate = () => {
    setEditForm({ name: '', avatarIcon: '✨', systemPrompt: '' });
    setIsEditing(true);
  };

  const handleSave = () => {
    if (!editForm.name || !editForm.systemPrompt) return;
    
    const customPersonas = personas.filter(p => p.isCustom);
    const newPersona: Persona = {
      id: editForm.id || `custom_${Date.now()}`,
      name: editForm.name,
      avatarIcon: editForm.avatarIcon || '✨',
      systemPrompt: editForm.systemPrompt,
      isCustom: true
    };

    if (editForm.id) {
      const index = customPersonas.findIndex(p => p.id === editForm.id);
      if (index >= 0) customPersonas[index] = newPersona;
    } else {
      customPersonas.push(newPersona);
    }

    saveCustomPersonas(customPersonas);
    setIsEditing(false);
    setEditForm({});
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const customPersonas = personas.filter(p => p.isCustom && p.id !== id);
    saveCustomPersonas(customPersonas);
    if (currentPersonaId === id) {
      onSelect(defaultPersonas[0].id, defaultPersonas[0].systemPrompt);
    }
  };

  const currentPersona = personas.find(p => p.id === currentPersonaId) || defaultPersonas[0];

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
                onChange={e => setEditForm({...editForm, name: e.target.value})}
                className="w-full bg-zinc-800 border-zinc-700 rounded-md px-3 py-2 text-white outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="例如：面试官"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">图标 (Emoji)</label>
              <input 
                type="text" 
                value={editForm.avatarIcon || ''} 
                onChange={e => setEditForm({...editForm, avatarIcon: e.target.value})}
                className="w-full bg-zinc-800 border-zinc-700 rounded-md px-3 py-2 text-white outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">System Prompt (系统指令)</label>
              <textarea 
                value={editForm.systemPrompt || ''} 
                onChange={e => setEditForm({...editForm, systemPrompt: e.target.value})}
                className="w-full bg-zinc-800 border-zinc-700 rounded-md px-3 py-2 text-white outline-none focus:ring-2 focus:ring-indigo-500 h-32 resize-none"
                placeholder="描述这个角色的性格、语气和任务..."
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1 border-zinc-700 bg-transparent hover:bg-zinc-800 text-white hover:text-white" onClick={() => setIsEditing(false)}>取消</Button>
              <Button className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white" onClick={handleSave}>保存</Button>
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
                          onClick={(e) => { e.stopPropagation(); setEditForm(p); setIsEditing(true); }}
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
            
            <Button variant="outline" onClick={handleStartCreate} className="w-full mt-2 border-dashed border-zinc-700 text-zinc-400 hover:text-white bg-transparent hover:bg-zinc-800/50">
              <Plus className="w-4 h-4 mr-2" />
              自定义新角色...
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
