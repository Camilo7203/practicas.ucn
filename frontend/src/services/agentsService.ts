import { API_CONFIG } from '@/config';

// Interfaces for agent data structures based on MongoDB collection
export interface AgentModel {
  provider: string;
  model: string;
  api_key: string;
  temperature: number;
  top_p: number;
}

export interface AgentSettings {
  agent_name: string;
  has_emojies: boolean;
  gender: string;
  language: string;
  energy: string;
  mind: string;
  nature: string;
  tactics: string;
  identity: string;
}

export interface AgentConfig {
  _cls: string;
  api_key: string;
  phone_number?: string;
  business_name?: string;
  whatsapp_business_account_id?: string;
  number_id?: string;
}

export interface AgentData {
  _id: string;
  id?: string; // For compatibility with frontend
  name: string;
  description: string;
  provider: string;
  provider_id: string;
  model: AgentModel;
  settings: AgentSettings;
  config: AgentConfig;
  is_active: boolean;
  organization: string;
  outbound_message_limit: number;
  message_window_start: number;
  conversation_sent_counter: number;
  created_at: string;
  updated_at: string;
}

export interface AgentCreatePayload {
  name: string;
  description: string;
  provider: string;
  provider_id?: string;
  model: {
    provider: string;
    model: string;
    api_key: string;
    temperature: number;
    top_p: number;
  };
  settings: {
    agent_name: string;
    has_emojies: boolean;
    gender: string;
    language: string;
    energy: string;
    mind: string;
    nature: string;
    tactics: string;
    identity: string;
  };
  config: {
    _cls: string;
    api_key: string;
    phone_number?: string;
    business_name?: string;
    whatsapp_business_account_id?: string;
    number_id?: string;
  };
  is_active?: boolean;
  outbound_message_limit?: number;
  message_window_start?: number;
}

export interface AgentsListResponse {
  agents: AgentData[];
}

export interface AgentResponse {
  agent: AgentData;
}

export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  error?: string;
}

class AgentsService {
  private baseUrl = API_CONFIG.BASE_URL;

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const token = localStorage.getItem('access_token');
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return { data };
  }

  /**
   * Get all agents for the current user/organization
   */
  public async getAgents(): Promise<ApiResponse<AgentsListResponse>> {
    return this.makeRequest<AgentsListResponse>('/agents/list');
  }

  /**
   * Get a specific agent by ID
   */
  public async getAgent(agentId: string): Promise<ApiResponse<AgentResponse>> {
    return this.makeRequest<AgentResponse>(`/agents/${agentId}`);
  }

  /**
   * Create a new agent
   */
  public async createAgent(payload: AgentCreatePayload): Promise<ApiResponse<AgentData>> {
    return this.makeRequest<AgentData>('/agents/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  /**
   * Update an existing agent
   */
  public async updateAgent(
    agentId: string, 
    data: Partial<AgentCreatePayload>
  ): Promise<ApiResponse<AgentData>> {
    return this.makeRequest<AgentData>(`/agents/${agentId}/update`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * Delete an agent
   */
  public async deleteAgent(agentId: string): Promise<ApiResponse<{ message: string }>> {
    return this.makeRequest<{ message: string }>(`/agents/${agentId}/delete`, {
      method: 'DELETE',
    });
  }

  /**
   * Toggle agent active status
   */
  public async toggleAgentStatus(agentId: string, isActive: boolean): Promise<ApiResponse<AgentData>> {
    return this.makeRequest<AgentData>(`/agents/${agentId}/update`, {
      method: 'PUT',
      body: JSON.stringify({ is_active: isActive }),
    });
  }

}

export const agentsService = new AgentsService();
export default AgentsService;