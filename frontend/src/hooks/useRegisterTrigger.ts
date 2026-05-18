import { useState, useCallback } from 'react';
import { CampaignsService } from '../services/campaignsService';
import type { TriggerRegisterPayload } from '../interfaces/triggers/triggerInterface';

export const useRegisterTrigger = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const registerTrigger = useCallback(async (payload: TriggerRegisterPayload) => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await new CampaignsService().registerTrigger(payload);
      setResult(response.data);
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Unknown error');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    registerTrigger,
    isLoading,
    error,
    result,
    setError,
  };
};
