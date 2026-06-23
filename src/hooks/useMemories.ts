import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';

export interface Memory {
  id: string;
  fact: string;
  created_at: number;
}

export function useMemories(userId: string | undefined) {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMemories = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await api.memories.list();
      setMemories(data.memories || []);
    } catch (err) {
      console.error('Failed to load memories:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadMemories();
  }, [loadMemories]);

  const addMemory = useCallback(async (fact: string) => {
    try {
      const result = await api.memories.create(fact);
      if (!result.duplicate) {
        setMemories(prev => [result, ...prev]);
      }
      return result;
    } catch (err) {
      console.error('Failed to add memory:', err);
      // Fallback to local state
      const local: Memory = { id: Date.now().toString(), fact, created_at: Date.now() };
      setMemories(prev => [local, ...prev]);
      return local;
    }
  }, []);

  const deleteMemory = useCallback(async (id: string) => {
    setMemories(prev => prev.filter(m => m.id !== id));
    try {
      await api.memories.delete(id);
    } catch (err) {
      console.error('Failed to delete memory:', err);
    }
  }, []);

  return { memories, loading, addMemory, deleteMemory, reload: loadMemories };
}
