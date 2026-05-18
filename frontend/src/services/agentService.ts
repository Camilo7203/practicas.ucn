import axios from 'axios';
import { API_CONFIG } from '../config';

// Create an axios instance with default headers
const agentsAxios = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include JWT token
agentsAxios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle token refresh
agentsAxios.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          // Try to refresh token
          const refreshResponse = await axios.post(`${API_CONFIG.BASE_URL}/token/refresh/`, {
            refresh: refreshToken,
          });
          
          const newToken = (refreshResponse.data as any).access;
          localStorage.setItem('access_token', newToken);
          
          // Retry the original request with new token
          if (error.config.headers) {
            error.config.headers.Authorization = `Bearer ${newToken}`;
          }
          return agentsAxios.request(error.config);
        } catch (refreshError) {
          // Refresh failed, redirect to login
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
        }
      } else {
        // No refresh token, redirect to login
        localStorage.removeItem('access_token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Define types for agent payloads
export interface AgentRegisterPayload {
  name: string;
  description?: string;
  type?: string;
  configuration?: any;
  [key: string]: any;
}

export interface AgentUpdatePayload {
  name?: string;
  description?: string;
  type?: string;
  configuration?: any;
  status?: string;
  [key: string]: any;
}

export interface AgentData {
  id: string;
  name: string;
  description?: string;
  type?: string;
  configuration?: any;
  status?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

export class AgentService {
  public async registerAgent(data: AgentRegisterPayload) {
    try {
      return agentsAxios.post('/agents/register', data);
    } catch (error) {
      console.error('Error registering agent:', error);
      throw error;
    }
  }

  public async getAgents() {
    return agentsAxios.get('/agents/list');
  }

  public async getAgent(agentId: string) {
    return agentsAxios.get(`/agents/${agentId}`);
  }

  public async updateAgent(agentId: string, data: Partial<AgentUpdatePayload>) {
    return agentsAxios.put(`/agents/${agentId}/update`, data);
  }

  public async deleteAgent(agentId: string) {
    return agentsAxios.delete(`/agents/${agentId}/delete`);
  }

  // Additional agent-specific methods
  public async startAgent(agentId: string) {
    return agentsAxios.post(`/agents/${agentId}/start`);
  }

  public async stopAgent(agentId: string) {
    return agentsAxios.post(`/agents/${agentId}/stop`);
  }

  public async getAgentStatus(agentId: string) {
    return agentsAxios.get(`/agents/${agentId}/status`);
  }

  public async getAgentLogs(agentId: string, limit?: number) {
    const params = limit ? { limit } : {};
    return agentsAxios.get(`/agents/${agentId}/logs`, { params });
  }

  public async executeAgent(agentId: string, payload?: any) {
    return agentsAxios.post(`/agents/${agentId}/execute`, payload || {});
  }

  public async getAgentMessages(agentId: string, sessionId?: string, limit?: number, offset?: number) {
    const params: any = {};
    if (sessionId) params.session_id = sessionId;
    if (limit) params.limit = limit;
    if (offset) params.offset = offset;
    
    return agentsAxios.get(`/agents/${agentId}/messages`, { params });
  }
}

export default new AgentService();