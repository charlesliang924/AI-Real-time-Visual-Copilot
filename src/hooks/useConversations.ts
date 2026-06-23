import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';

export interface ConversationEntry {
  id: string;
  role: string;
  content: string;
  created_at: number;
}

export function useConversations(userId: string | undefined) {
  const [conversations, setConversations] = useState<ConversationEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const loadConversations = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await api.conversations.list(200, 0);
      setConversations(data.conversations || []);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const addConversation = useCallback(async (role: string, content: string) => {
    const local: ConversationEntry = {
      id: Date.now().toString() + Math.random().toString(36).substring(2),
      role,
      content,
      created_at: Date.now(),
    };
    setConversations(prev => [...prev, local]);
    try {
      await api.conversations.create(role, content);
    } catch (err) {
      console.error('Failed to save conversation:', err);
    }
  }, []);

  const clearConversations = useCallback(async () => {
    setConversations([]);
    try {
      await api.conversations.clear();
    } catch (err) {
      console.error('Failed to clear conversations:', err);
    }
  }, []);

  return { conversations, loading, addConversation, clearConversations, reload: loadConversations };
}
