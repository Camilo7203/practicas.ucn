import { useState, useCallback } from 'react';
import { CampaignsService } from '../services/campaignsService';
import type { LoopRegisterPayload } from '../interfaces/loops/loopInterface';

export const useRegisterLoop = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const registerLoop = useCallback(async (payload: LoopRegisterPayload) => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await new CampaignsService().registerLoop(payload);
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
    registerLoop,
    isLoading,
    error,
    result,
    setError,
  };
};
