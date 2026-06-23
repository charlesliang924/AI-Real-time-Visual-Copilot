import { useCallback } from 'react';
import { api } from '../lib/api';

export function useUsageStats(userId: string | undefined) {
  const logEvent = useCallback(async (eventType: string, metadata?: any) => {
    if (!userId) return;
    try {
      await api.stats.log(eventType, metadata);
    } catch {
      // Silent fail - stats are non-critical, don't log to console
    }
  }, [userId]);

  return { logEvent };
}
