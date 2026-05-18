import { useState, useEffect, useCallback } from 'react';
import type { 
  ConversationsListResponse, 
  ActivistConversationsResponse, 
  ConversationDetail,
  ConversationsFilters 
} from '../services/conversationsService';
import { conversationsService } from '../services/conversationsService';

interface UseConversationsState {
  conversations: ConversationsListResponse | null;
  loading: boolean;
  error: string | null;
}

interface UseActivistsState {
  activists: ActivistConversationsResponse | null;
  loading: boolean;
  error: string | null;
}

interface UseConversationDetailState {
  conversation: ConversationDetail | null;
  loading: boolean;
  error: string | null;
}

// Hook para lista de conversaciones con filtros
export const useConversations = (initialFilters?: ConversationsFilters) => {
  const [state, setState] = useState<UseConversationsState>({
    conversations: null,
    loading: false,
    error: null,
  });

  const [filters, setFilters] = useState<ConversationsFilters>(initialFilters || {});

  const fetchConversations = useCallback(async (newFilters?: ConversationsFilters) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const filtersToUse = newFilters || filters;
      const conversations = await conversationsService.getConversations(filtersToUse);
      setState({
        conversations,
        loading: false,
        error: null,
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      }));
    }
  }, [filters]);

  const updateFilters = useCallback((newFilters: Partial<ConversationsFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    fetchConversations(updatedFilters);
  }, [filters, fetchConversations]);

  const resetFilters = useCallback(() => {
    const emptyFilters = {};
    setFilters(emptyFilters);
    fetchConversations(emptyFilters);
  }, [fetchConversations]);

  useEffect(() => {
    fetchConversations();
  }, []); // Solo cargar una vez al montar

  return {
    ...state,
    filters,
    fetchConversations,
    updateFilters,
    resetFilters,
    refetch: () => fetchConversations(filters),
  };
};

// Hook para lista de activistas con conversaciones
export const useActivistsConversations = () => {
  const [state, setState] = useState<UseActivistsState>({
    activists: null,
    loading: false,
    error: null,
  });

  const fetchActivists = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const activists = await conversationsService.getActivistsWithConversations();
      setState({
        activists,
        loading: false,
        error: null,
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      }));
    }
  }, []);

  useEffect(() => {
    fetchActivists();
  }, [fetchActivists]);

  return {
    ...state,
    refetch: fetchActivists,
  };
};

// Hook para detalle de conversación específica
export const useConversationDetail = (conversationId: string | null) => {
  const [state, setState] = useState<UseConversationDetailState>({
    conversation: null,
    loading: false,
    error: null,
  });

  const fetchConversationDetail = useCallback(async (id: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const conversation = await conversationsService.getConversationDetail(id);
      setState({
        conversation,
        loading: false,
        error: null,
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      }));
    }
  }, []);

  useEffect(() => {
    if (conversationId) {
      fetchConversationDetail(conversationId);
    } else {
      setState({
        conversation: null,
        loading: false,
        error: null,
      });
    }
  }, [conversationId, fetchConversationDetail]);

  return {
    ...state,
    refetch: conversationId ? () => fetchConversationDetail(conversationId) : undefined,
  };
};

// Hook combinado para manejar múltiples estados de conversaciones
export const useConversationsManager = () => {
  const conversations = useConversations();
  const activists = useActivistsConversations();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const conversationDetail = useConversationDetail(selectedConversationId);

  const selectConversation = useCallback((conversationId: string | null) => {
    setSelectedConversationId(conversationId);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedConversationId(null);
  }, []);

  const refreshAll = useCallback(() => {
    conversations.refetch();
    activists.refetch();
    if (conversationDetail.refetch) {
      conversationDetail.refetch();
    }
  }, [conversations, activists, conversationDetail]);

  return {
    conversations,
    activists,
    conversationDetail,
    selectedConversationId,
    selectConversation,
    clearSelection,
    refreshAll,
    isLoading: conversations.loading || activists.loading || conversationDetail.loading,
  };
};