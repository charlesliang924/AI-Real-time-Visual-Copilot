import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';

export interface CustomSkill {
  id: string;
  name: string;
  description: string;
  endpoint: string;
}

export function useSkills(userId: string | undefined) {
  const [skills, setSkills] = useState<CustomSkill[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSkills = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await api.skills.list();
      setSkills(data.skills || []);
    } catch (err) {
      console.error('Failed to load skills from cloud, trying local:', err);
      const saved = localStorage.getItem('customSkills');
      if (saved) {
        setSkills(JSON.parse(saved));
      }
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadSkills();
  }, [loadSkills]);

  const createSkill = useCallback(async (data: { name: string; description: string; endpoint: string }) => {
    try {
      const result = await api.skills.create(data);
      setSkills(prev => [...prev, result]);
      return result;
    } catch (err) {
      console.error('Failed to create skill on cloud, using local:', err);
      const local: CustomSkill = { ...data, id: Date.now().toString() };
      const saved = localStorage.getItem('customSkills');
      const localSkills = saved ? JSON.parse(saved) : [];
      localSkills.push(local);
      localStorage.setItem('customSkills', JSON.stringify(localSkills));
      setSkills(prev => [...prev, local]);
      return local;
    }
  }, []);

  const deleteSkill = useCallback(async (id: string) => {
    setSkills(prev => prev.filter(s => s.id !== id));
    try {
      await api.skills.delete(id);
    } catch (err) {
      console.error('Failed to delete skill on cloud:', err);
    }
  }, []);

  return { skills, loading, createSkill, deleteSkill, reload: loadSkills };
}
