import { useState, useCallback, useEffect } from 'react';
import { agentsService } from '../services/agentsService';
import type { AgentData, AgentCreatePayload } from '../services/agentsService';

export const useAgents = () => {
  const [agents, setAgents] = useState<AgentData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAgents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await agentsService.getAgents();
      setAgents(response.data.agents || []);
    } catch (err: any) {
      setError(err.message || 'Error fetching agents');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createAgent = useCallback(async (payload: AgentCreatePayload) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await agentsService.createAgent(payload);
      // Refresh the agents list
      await fetchAgents();
      return response.data;
    } catch (err: any) {
      setError(err.message || 'Error creating agent');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [fetchAgents]);

  const updateAgent = useCallback(async (agentId: string, data: Partial<AgentCreatePayload>) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await agentsService.updateAgent(agentId, data);
      // Refresh the agents list to get updated data
      await fetchAgents();
      return response.data;
    } catch (err: any) {
      setError(err.message || 'Error updating agent');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [fetchAgents]);

  const deleteAgent = useCallback(async (agentId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await agentsService.deleteAgent(agentId);
      // Remove from local state
      setAgents(prevAgents => prevAgents.filter(agent => agent.id !== agentId));
    } catch (err: any) {
      setError(err.message || 'Error deleting agent');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const toggleAgentStatus = useCallback(async (agentId: string, isActive: boolean) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await agentsService.toggleAgentStatus(agentId, isActive);
      // Update the local state
      setAgents(prevAgents => 
        prevAgents.map(agent => 
          agent.id === agentId ? { ...agent, is_active: isActive } : agent
        )
      );
      return response.data;
    } catch (err: any) {
      setError(err.message || 'Error toggling agent status');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getAgent = useCallback(async (agentId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await agentsService.getAgent(agentId);
      return response.data.agent;
    } catch (err: any) {
      setError(err.message || 'Error fetching agent');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getAgentStats = useCallback(() => {
    const total = agents.length;
    const active = agents.filter(agent => agent.is_active).length;
    const inactive = total - active;
    
    const by_provider: Record<string, number> = {};
    const by_model: Record<string, number> = {};
    
    agents.forEach(agent => {
      by_provider[agent.provider] = (by_provider[agent.provider] || 0) + 1;
      by_model[agent.model.model] = (by_model[agent.model.model] || 0) + 1;
    });
    
    return {
      total,
      active,
      inactive,
      by_provider,
      by_model,
    };
  }, [agents]);

  // Auto-fetch agents when component mounts
  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  return {
    agents,
    isLoading,
    error,
    fetchAgents,
    createAgent,
    updateAgent,
    deleteAgent,
    toggleAgentStatus,
    getAgent,
    getAgentStats,
    setError,
  };
};