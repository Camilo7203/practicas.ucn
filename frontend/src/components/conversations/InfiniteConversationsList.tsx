import React, { useState, useEffect } from 'react';
import { 
  MessageCircle, 
  Search, 
  Clock,
  User,
  Bot,
  Phone,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { useInfiniteConversations } from '../../hooks/useInfiniteConversations';
import { conversationsService } from '../../services/conversationsService';
import type { ConversationsFilters, ConversationDetail } from '../../services/conversationsService';

interface InfiniteConversationsListProps {
  onConversationSelect?: (conversationId: string) => void;
  selectedAgentId?: string;
}

const InfiniteConversationsList: React.FC<InfiniteConversationsListProps> = ({
  onConversationSelect,
  selectedAgentId
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<ConversationsFilters>({});

  const {
    conversations,
    loading,
    loadingMore,
    error,
    hasNextPage,
    updateSearchTerm,
    updateFilters,
    refresh,
    intersectionObserverRef
  } = useInfiniteConversations({
    pageSize: 10,
    searchTerm,
    initialFilters: filters
  });

  // Actualizar filtros cuando cambie el agente seleccionado
  useEffect(() => {
    if (selectedAgentId) {
      const newFilters = { ...filters, agent_id: selectedAgentId };
      setFilters(newFilters);
      updateFilters(newFilters);
    }
  }, [selectedAgentId]);

  // Componente para mostrar el estado de la conversación
  const ConversationStatus: React.FC<{ isActive: boolean; endedAt?: string | null }> = ({ isActive, endedAt }) => {
    if (endedAt) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <XCircle className="w-3 h-3 mr-1" />
          Finalizada
        </span>
      );
    }
    if (isActive) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Activa
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        <AlertCircle className="w-3 h-3 mr-1" />
        Inactiva
      </span>
    );
  };

  // Componente para mostrar una conversación
  const ConversationCard: React.FC<{ conversation: ConversationDetail }> = ({ conversation }) => (
    <div 
      key={conversation.id}
      className="bg-surface border border-border rounded-xl hover:shadow-elegant-lg hover:border-accent/20 transition-all duration-300 hover:-translate-y-1 cursor-pointer"
      onClick={() => onConversationSelect?.(conversation.id)}
    >
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="bg-accent/10 p-2 rounded-lg">
              <User className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h3 className="font-semibold text-textPrimary">
                {conversation.activist.first_name} {conversation.activist.last_name}
              </h3>
              <div className="flex items-center gap-4 text-sm text-textMuted">
                <span className="flex items-center gap-1">
                  <Phone className="w-4 h-4" />
                  {conversation.activist.phone}
                </span>
                <span className="flex items-center gap-1">
                  <Bot className="w-4 h-4" />
                  {conversation.agent.name}
                </span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <ConversationStatus 
              isActive={conversation.is_active} 
              endedAt={conversation.ended_at} 
            />
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <span className="text-textMuted">
              <strong className="text-textPrimary">{conversation.message_count}</strong> mensajes
            </span>
            {conversation.campaign && (
              <span className="text-textMuted">
                Campaña: <strong className="text-textPrimary">{conversation.campaign.name}</strong>
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-textMuted">
            <Clock className="w-4 h-4" />
            <span>
              {conversationsService.formatLastActivity(conversation.last_message_at)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      {/* Búsqueda simple */}
      <div className="p-4 border-b border-border flex-shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-textMuted w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar conversaciones..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              updateSearchTerm(e.target.value);
            }}
            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-accent focus:border-accent transition-all"
          />
        </div>
      </div>

      {/* Lista con scroll */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-2 space-y-2">
          {/* Estados de carga y error */}
          {loading && conversations.length === 0 ? (
            <div className="flex justify-center items-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-textMuted" />
              <span className="ml-2 text-textMuted">Cargando conversaciones...</span>
            </div>
          ) : error ? (
            <div className="bg-surface rounded-lg border border-border p-6 text-center">
              <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600">{error}</p>
              <button 
                onClick={refresh}
                className="mt-4 px-4 py-2 bg-accent text-white rounded-lg hover:bg-highlight transition-colors"
              >
                Reintentar
              </button>
            </div>
          ) : conversations.length === 0 ? (
            <div className="bg-surface rounded-lg border border-border p-6 text-center">
              <MessageCircle className="w-12 h-12 text-textMuted mx-auto mb-4" />
              <p className="text-textMuted">No se encontraron conversaciones</p>
            </div>
          ) : (
            <>
              {/* Lista de conversaciones */}
              {conversations.map((conversation) => (
                <ConversationCard 
                  key={conversation.id} 
                  conversation={conversation}
                />
              ))}
              
              {/* Trigger para infinite scroll */}
              <div ref={intersectionObserverRef} className="py-4">
                {loadingMore && (
                  <div className="flex justify-center items-center">
                    <Loader2 className="w-6 h-6 animate-spin text-accent" />
                    <span className="ml-2 text-textMuted">Cargando más...</span>
                  </div>
                )}
                {!hasNextPage && conversations.length > 0 && (
                  <div className="text-center text-textMuted text-sm py-2">
                    No hay más conversaciones
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default InfiniteConversationsList;