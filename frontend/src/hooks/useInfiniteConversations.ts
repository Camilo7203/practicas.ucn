import { useState, useEffect, useCallback, useRef } from 'react';
import type { 
  ConversationDetail,
  ConversationsFilters 
} from '../services/conversationsService';
import { conversationsService } from '../services/conversationsService';

interface UseInfiniteConversationsState {
  conversations: ConversationDetail[];
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  hasNextPage: boolean;
  totalCount: number;
}

interface UseInfiniteConversationsParams {
  pageSize?: number;
  initialFilters?: ConversationsFilters;
  searchTerm?: string;
}

export const useInfiniteConversations = ({
  pageSize = 10,
  initialFilters = {},
  searchTerm = ''
}: UseInfiniteConversationsParams = {}) => {
  const [state, setState] = useState<UseInfiniteConversationsState>({
    conversations: [],
    loading: false,
    loadingMore: false,
    error: null,
    hasNextPage: true,
    totalCount: 0,
  });

  const [filters, setFilters] = useState<ConversationsFilters>(initialFilters);
  const [currentSearchTerm, setCurrentSearchTerm] = useState(searchTerm);
  const currentPage = useRef(0);
  const abortController = useRef<AbortController | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Función para cargar más conversaciones
  const loadConversations = useCallback(async (
    page: number, 
    reset: boolean = false,
    searchQuery: string = currentSearchTerm
  ) => {
    // Cancelar cualquier request anterior
    if (abortController.current) {
      abortController.current.abort();
    }
    
    abortController.current = new AbortController();

    setState(prev => ({
      ...prev,
      loading: reset ? true : prev.loading,
      loadingMore: !reset && page > 0,
      error: null,
    }));

    try {
      // Preparar filtros con búsqueda
      const searchFilters: ConversationsFilters = {
        ...filters,
        page_size: pageSize,
        page: page + 1, // Backend espera página basada en 1
        include_messages: true, // Incluir mensajes para poder hacer búsqueda de texto
      };

      const response = await conversationsService.getConversations(searchFilters);
      
      // Filtrar localmente por término de búsqueda si existe
      let filteredConversations = response.conversations;
      if (searchQuery.trim()) {
        const searchLower = searchQuery.toLowerCase();
        filteredConversations = response.conversations.filter(conv => {
          // Buscar en nombre del activista
          const activistName = `${conv.activist.first_name} ${conv.activist.last_name}`.toLowerCase();
          const activistPhone = conv.activist.phone;
          const agentName = conv.agent.name.toLowerCase();
          
          // Buscar en mensajes si están incluidos
          const messageMatch = conv.messages?.some(msg => 
            msg.text.toLowerCase().includes(searchLower)
          ) || false;

          return activistName.includes(searchLower) ||
                 activistPhone.includes(searchQuery) ||
                 agentName.includes(searchLower) ||
                 messageMatch;
        });
      }

      setState(prev => ({
        ...prev,
        conversations: reset ? filteredConversations : [...prev.conversations, ...filteredConversations],
        loading: false,
        loadingMore: false,
        hasNextPage: filteredConversations.length === pageSize,
        totalCount: reset ? filteredConversations.length : prev.totalCount + filteredConversations.length,
      }));

      return filteredConversations;
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        setState(prev => ({
          ...prev,
          loading: false,
          loadingMore: false,
          error: error instanceof Error ? error.message : 'Error desconocido',
        }));
      }
      return [];
    }
  }, [filters, pageSize, currentSearchTerm]);

  // Cargar primera página
  const loadInitialConversations = useCallback(() => {
    currentPage.current = 0;
    return loadConversations(0, true);
  }, [loadConversations]);

  // Cargar siguiente página
  const loadNextPage = useCallback(() => {
    if (state.hasNextPage && !state.loadingMore) {
      currentPage.current += 1;
      return loadConversations(currentPage.current);
    }
    return Promise.resolve([]);
  }, [loadConversations, state.hasNextPage, state.loadingMore]);

  // Actualizar filtros
  const updateFilters = useCallback((newFilters: Partial<ConversationsFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Actualizar término de búsqueda
  const updateSearchTerm = useCallback((term: string) => {
    setCurrentSearchTerm(term);
  }, []);

  // Resetear todo
  const reset = useCallback(() => {
    currentPage.current = 0;
    setState({
      conversations: [],
      loading: false,
      loadingMore: false,
      error: null,
      hasNextPage: true,
      totalCount: 0,
    });
  }, []);

  // Hook para scroll infinito
  const intersectionObserverRef = useCallback((node: HTMLDivElement | null) => {
    if (state.loadingMore) return;
    
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && state.hasNextPage && !state.loading) {
        loadNextPage();
      }
    });

    if (node) {
      observerRef.current.observe(node);
    }
  }, [state.loadingMore, state.hasNextPage, state.loading, loadNextPage]);

  // Efectos
  useEffect(() => {
    loadInitialConversations();
  }, [filters]); // Solo cuando cambian los filtros

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      loadInitialConversations();
    }, 300); // Debounce de 300ms para búsqueda

    return () => clearTimeout(delayedSearch);
  }, [currentSearchTerm]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (abortController.current) {
        abortController.current.abort();
      }
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return {
    ...state,
    filters,
    searchTerm: currentSearchTerm,
    loadNextPage,
    updateFilters,
    updateSearchTerm,
    reset,
    refresh: loadInitialConversations,
    intersectionObserverRef,
  };
};