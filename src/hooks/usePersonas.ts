import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';

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

export function usePersonas(userId: string | undefined) {
  const [personas, setPersonas] = useState<Persona[]>(defaultPersonas);
  const [loading, setLoading] = useState(true);

  const loadPersonas = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await api.personas.list();
      const cloudPersonas: Persona[] = (data.personas || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        avatarIcon: p.avatar_icon,
        systemPrompt: p.system_prompt,
        isCustom: true,
      }));
      setPersonas([...defaultPersonas, ...cloudPersonas]);
    } catch (err) {
      console.error('Failed to load personas from cloud, trying local:', err);
      // Fallback to localStorage
      const saved = localStorage.getItem('custom_personas');
      if (saved) {
        const local = JSON.parse(saved);
        setPersonas([...defaultPersonas, ...local]);
      }
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadPersonas();
  }, [loadPersonas]);

  const createPersona = useCallback(async (data: { name: string; avatarIcon?: string; systemPrompt: string }) => {
    try {
      const result = await api.personas.create({
        name: data.name,
        avatar_icon: data.avatarIcon || '✨',
        system_prompt: data.systemPrompt,
      });
      const newPersona: Persona = {
        id: result.id,
        name: result.name,
        avatarIcon: result.avatar_icon,
        systemPrompt: result.system_prompt,
        isCustom: true,
      };
      setPersonas(prev => [...prev, newPersona]);
      return newPersona;
    } catch (err) {
      console.error('Failed to create persona on cloud, using local:', err);
      const local: Persona = {
        id: `custom_${Date.now()}`,
        name: data.name,
        avatarIcon: data.avatarIcon || '✨',
        systemPrompt: data.systemPrompt,
        isCustom: true,
      };
      // Save to localStorage as fallback
      const saved = localStorage.getItem('custom_personas');
      const localPersonas = saved ? JSON.parse(saved) : [];
      localPersonas.push(local);
      localStorage.setItem('custom_personas', JSON.stringify(localPersonas));
      setPersonas(prev => [...prev, local]);
      return local;
    }
  }, []);

  const updatePersona = useCallback(async (id: string, data: { name: string; avatarIcon?: string; systemPrompt: string }) => {
    try {
      await api.personas.update(id, {
        name: data.name,
        avatar_icon: data.avatarIcon || '✨',
        system_prompt: data.systemPrompt,
      });
    } catch (err) {
      console.error('Failed to update persona on cloud:', err);
    }
    setPersonas(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
  }, []);

  const deletePersona = useCallback(async (id: string) => {
    try {
      await api.personas.delete(id);
    } catch (err) {
      console.error('Failed to delete persona on cloud:', err);
    }
    setPersonas(prev => prev.filter(p => p.id !== id));
  }, []);

  return { personas, loading, createPersona, updatePersona, deletePersona, reload: loadPersonas };
}
