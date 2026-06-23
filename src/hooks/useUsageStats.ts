import { useCallback } from 'react';
import { api } from '../lib/api';

export function useUsageStats(userId: string | undefined) {
  const logEvent = useCallback(async (eventType: string, metadata?: any) => {
    if (!userId) return;
    try {
      await api.stats.log(eventType, metadata);
    } catch (err) {
      // Silent fail - stats are non-critical
      console.error('Failed to log stats:', err);
    }
  }, [userId]);

  return { logEvent };
}
