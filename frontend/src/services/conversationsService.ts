import axios from 'axios';
import { API_CONFIG } from '../config/index';

// Interfaces para las conversaciones
export interface MessageData {
  id: string;
  sender_type: 'activist' | 'agent' | 'system';
  sender_id: string;
  sender_name: string;
  text: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  message: Record<string, unknown>;
  source?: 'message_records' | 'messageHistory';
}

export interface ConversationSummary {
  id: string;
  agent_name: string;
  agent_provider: string;
  started_at: string | null;
  last_message_at: string | null;
  is_active: boolean;
  conversation_status?: string; // Nuevo campo del backend
  message_count: number;
}

export interface ActivistInfo {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  date_joined: string | null;
  is_active: boolean;
}

export interface AgentInfo {
  id: string;
  name: string;
  provider: string;
  is_active: boolean;
}

export interface CampaignInfo {
  id: string;
  name: string;
}

export interface LoopInfo {
  id: string;
  name: string;
}

export interface ConversationDetail {
  id: string;
  activist: ActivistInfo;
  agent: AgentInfo;
  started_at: string | null;
  ended_at: string | null;
  last_message_at: string | null;
  is_active: boolean;
  conversation_status?: string; // Nuevo campo del backend
  current_counter: number;
  campaign: CampaignInfo | null;
  current_loop: LoopInfo | null;
  messages: MessageData[];
  message_count: number;
  message_summary: {
    total_messages: number;
    activist_messages: number;
    agent_messages: number;
  };
}

export interface ActivistWithConversations {
  activist: ActivistInfo;
  conversations: ConversationSummary[];
  total_conversations: number;
  active_conversations: number;
  last_conversation_at: string | null;
  agents_talked_to: string[];
  unique_agents_count: number;
}

export interface ConversationsListResponse {
  conversations: ConversationDetail[];
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

export interface ActivistConversationsResponse {
  activists: ActivistWithConversations[];
  total_activists: number;
  summary: {
    total_activists_with_conversations: number;
    total_conversations: number;
    active_conversations: number;
  };
}

// Parámetros de filtros para conversaciones
export interface ConversationsFilters {
  activist_id?: string;
  agent_id?: string;
  is_active?: boolean;
  date_from?: string;
  date_to?: string;
  page?: number;
  page_size?: number;
  include_messages?: boolean;
}

class ConversationsService {
  private baseURL = `${API_CONFIG.BASE_URL}/agents`;

  /**
   * Get authorization headers with JWT token
   */
  private getAuthHeaders() {
    const token = localStorage.getItem('access_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  /**
   * Obtener lista de conversaciones con filtros opcionales
   */
  async getConversations(filters?: ConversationsFilters): Promise<ConversationsListResponse> {
    try {
      const params = new URLSearchParams();
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params.append(key, value.toString());
          }
        });
      }

      const response = await axios.get<ConversationsListResponse>(
        `${this.baseURL}/conversations/`,
        { 
          params,
          headers: this.getAuthHeaders()
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error al obtener conversaciones:', error);
      throw new Error('Error al cargar las conversaciones');
    }
  }

  /**
   * Obtener todos los activistas que han tenido conversaciones
   */
  async getActivistsWithConversations(): Promise<ActivistConversationsResponse> {
    try {
      const response = await axios.get<ActivistConversationsResponse>(
        `${this.baseURL}/activists-conversations/`,
        {
          headers: this.getAuthHeaders()
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error al obtener activistas con conversaciones:', error);
      throw new Error('Error al cargar los activistas con conversaciones');
    }
  }

  /**
   * Obtener el detalle completo de una conversación específica
   */
  async getConversationDetail(conversationId: string): Promise<ConversationDetail> {
    try {
      const response = await axios.get<ConversationDetail>(
        `${this.baseURL}/conversations/${conversationId}/`,
        {
          headers: this.getAuthHeaders()
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error al obtener detalle de conversación:', error);
      throw new Error('Error al cargar el detalle de la conversación');
    }
  }

  /**
   * Utilidades para formatear datos
   */
  formatMessageTimestamp(timestamp: string): string {
    return new Date(timestamp).toLocaleString();
  }

  formatLastActivity(timestamp: string | null): string {
    if (!timestamp) return 'Sin actividad';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return `Hoy a las ${date.toLocaleTimeString()}`;
    } else if (diffDays === 1) {
      return `Ayer a las ${date.toLocaleTimeString()}`;
    } else if (diffDays < 7) {
      return `Hace ${diffDays} días`;
    } else {
      return date.toLocaleDateString();
    }
  }

  getConversationStatus(conversation: ConversationDetail | ConversationSummary): 'active' | 'inactive' | 'ended' {
    // Si el backend ya proporciona el estado calculado, usarlo
    if ('conversation_status' in conversation && conversation.conversation_status) {
      switch (conversation.conversation_status) {
        case 'activa':
          return 'active';
        case 'inactiva':
          return 'inactive';
        case 'finalizada':
          return 'ended';
        default:
          break; // Continuar con el cálculo manual
      }
    }

    // Fallback al cálculo manual basado en tiempo (para compatibilidad)
    if ('ended_at' in conversation && conversation.ended_at) {
      return 'ended';
    }

    // Calcular basado en last_message_at si no hay conversation_status
    if (conversation.last_message_at) {
      const lastMessageTime = new Date(conversation.last_message_at);
      const now = new Date();
      const diffMs = now.getTime() - lastMessageTime.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);

      if (diffHours < 2) {
        return 'active';
      } else if (diffHours < 24) {
        return 'inactive';
      } else {
        return 'ended';
      }
    }

    return conversation.is_active ? 'active' : 'inactive';
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'active':
        return 'text-green-600';
      case 'inactive':
        return 'text-yellow-600';
      case 'ended':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'active':
        return 'Activa';
      case 'inactive':
        return 'Inactiva';
      case 'ended':
        return 'Finalizada';
      default:
        return 'Desconocido';
    }
  }

  /**
   * Obtener el texto descriptivo del estado basado en tiempo
   */
  getStatusDescription(conversation: ConversationDetail | ConversationSummary): string {
    if (!conversation.last_message_at) {
      return 'Sin actividad reciente';
    }

    const lastMessageTime = new Date(conversation.last_message_at);
    const now = new Date();
    const diffMs = now.getTime() - lastMessageTime.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < 1) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `Última actividad hace ${diffMinutes} minuto${diffMinutes !== 1 ? 's' : ''}`;
    } else if (diffHours < 2) {
      return 'Última actividad hace menos de 2 horas (Activa)';
    } else if (diffHours < 24) {
      const hours = Math.floor(diffHours);
      return `Última actividad hace ${hours} hora${hours !== 1 ? 's' : ''} (Inactiva)`;
    } else {
      const days = Math.floor(diffHours / 24);
      return `Última actividad hace ${days} día${days !== 1 ? 's' : ''} (Finalizada)`;
    }
  }
}

export const conversationsService = new ConversationsService();