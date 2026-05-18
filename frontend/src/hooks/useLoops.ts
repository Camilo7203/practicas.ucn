import { useState, useCallback, useEffect } from 'react';
import { loopsService } from '../services/loopsService';
import type { LoopData, LoopRegisterPayload } from '../services/loopsService';

export const useLoops = () => {
  const [loops, setLoops] = useState<LoopData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLoops = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await loopsService.getLoops();
      setLoops(response.data.loops || []);
    } catch (err: any) {
      setError(err.message || 'Error fetching loops');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createLoop = useCallback(async (payload: LoopRegisterPayload) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await loopsService.createLoop(payload);
      // Refresh the loops list
      await fetchLoops();
      return response.data;
    } catch (err: any) {
      setError(err.message || 'Error creating loop');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [fetchLoops]);

  const updateLoop = useCallback(async (loopId: string, data: Partial<LoopRegisterPayload>) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await loopsService.updateLoop(loopId, data);
      // Refresh the loops list to get the updated data with proper types
      await fetchLoops();
      return response.data;
    } catch (err: any) {
      setError(err.message || 'Error updating loop');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [fetchLoops]);

  const deleteLoop = useCallback(async (loopId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await loopsService.deleteLoop(loopId);
      // Remove from local state
      setLoops(prevLoops => prevLoops.filter(loop => loop.id !== loopId));
    } catch (err: any) {
      setError(err.message || 'Error deleting loop');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getLoop = useCallback(async (loopId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await loopsService.getLoop(loopId);
      return response.data.loop;
    } catch (err: any) {
      setError(err.message || 'Error fetching loop');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getLoopStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await loopsService.getLoopStats();
      return response.data;
    } catch (err: any) {
      setError(err.message || 'Error fetching loop stats');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Auto-fetch loops when component mounts
  useEffect(() => {
    fetchLoops();
  }, [fetchLoops]);

  return {
    loops,
    isLoading,
    error,
    fetchLoops,
    createLoop,
    updateLoop,
    deleteLoop,
    getLoop,
    getLoopStats,
    setError,
  };
};
