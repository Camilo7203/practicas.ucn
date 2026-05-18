import React, { useState, useEffect } from 'react';
import { 
  MessageCircle, 
  Users, 
  User,
  Bot,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  MessageSquare,
  Activity,
  X,
  Eye,
  EyeOff,
  ChevronDown
} from 'lucide-react';
import { useConversationsManager } from '../../hooks/useConversations';
import InfiniteConversationsList from '../../components/conversations/InfiniteConversationsList';
import MessageBubble from '../../components/conversations/MessageBubble';
import ActivistTagsComponent from '../../components/ActivistTagsComponent';
import agentService from '../../services/agentService';
import { useTranslation } from '../../hooks/useTranslation';

interface Agent {
  id: string;
  name: string;
  description?: string;
  provider?: string;
  status?: string;
}

const ConversationsPage: React.FC = () => {
  const { t } = useTranslation();
  const {
    activists,
    conversationDetail,
    selectedConversationId,
    selectConversation,
    clearSelection,
    refreshAll,
    isLoading
  } = useConversationsManager();

  const [showSystemMessages, setShowSystemMessages] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [loadingAgents, setLoadingAgents] = useState(false);

  // Cargar agentes al montar el componente
  useEffect(() => {
    const fetchAgents = async () => {
      setLoadingAgents(true);
      try {
        const response = await agentService.getAgents();
        const agentsList = (response.data as any).agents || [];
        setAgents(agentsList);
        
        // Si hay agentes, seleccionar el primero por defecto
        if (agentsList.length > 0) {
          setSelectedAgentId(agentsList[0].id);
        }
      } catch (error) {
        console.error('Error fetching agents:', error);
      } finally {
        setLoadingAgents(false);
      }
    };

    fetchAgents();
  }, []);

  // Componente para mostrar el estado de la conversación
  const ConversationStatus: React.FC<{ isActive: boolean; endedAt?: string | null }> = ({ isActive, endedAt }) => {
    if (endedAt) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <XCircle className="w-3 h-3 mr-1" />
          {t('conversations.statusFinished')}
        </span>
      );
    }
    if (isActive) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          {t('conversations.statusActive')}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        <AlertCircle className="w-3 h-3 mr-1" />
        {t('conversations.statusInactive')}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-surface border-b border-border sticky top-0 z-10">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-accent/10 p-2 rounded-lg">
                <MessageCircle className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-textPrimary">{t('conversations.title')}</h1>
                <p className="text-textMuted text-xs">{t('conversations.subtitle')}</p>
              </div>
            </div>
            <button 
              onClick={refreshAll} 
              disabled={isLoading} 
              className="flex items-center gap-2 px-3 py-1.5 bg-accent text-white rounded-lg hover:bg-highlight disabled:opacity-50 transition-colors text-sm"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              {t('conversations.refresh')}
            </button>
          </div>

          {/* Estadísticas compactas */}
          {activists.activists && (
            <div className="grid grid-cols-4 gap-2 mt-3">
              <div className="bg-background rounded-lg p-2 flex items-center justify-between">
                <div>
                  <p className="text-textMuted text-xs">{t('conversations.activists')}</p>
                  <p className="text-lg font-bold text-textPrimary">{activists.activists.summary.total_activists_with_conversations}</p>
                </div>
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <div className="bg-background rounded-lg p-2 flex items-center justify-between">
                <div>
                  <p className="text-textMuted text-xs">{t('conversations.totalConversations')}</p>
                  <p className="text-lg font-bold text-textPrimary">{activists.activists.summary.total_conversations}</p>
                </div>
                <MessageCircle className="w-4 h-4 text-green-600" />
              </div>
              <div className="bg-background rounded-lg p-2 flex items-center justify-between">
                <div>
                  <p className="text-textMuted text-xs">{t('conversations.activeConversations')}</p>
                  <p className="text-lg font-bold text-textPrimary">{activists.activists.summary.active_conversations}</p>
                </div>
                <Activity className="w-4 h-4 text-orange-600" />
              </div>
              <div className="bg-background rounded-lg p-2 flex items-center justify-between">
                <div>
                  <p className="text-textMuted text-xs">{t('conversations.averagePerActivist')}</p>
                  <p className="text-lg font-bold text-textPrimary">
                    {activists.activists.summary.total_activists_with_conversations > 0 
                      ? Math.round(activists.activists.summary.total_conversations / activists.activists.summary.total_activists_with_conversations * 10) / 10
                      : 0
                    }
                  </p>
                </div>
                <MessageSquare className="w-4 h-4 text-purple-600" />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-3 flex gap-4 h-[calc(100vh-200px)]">
        {/* Sidebar izquierdo - Lista de conversaciones (w-80) */}
        <div className="w-120 bg-surface rounded-xl border border-border overflow-hidden flex flex-col flex-shrink-0">
          {/* Selector de Agente */}
          <div className="p-3 border-b border-border flex-shrink-0">
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-accent/10 p-1 rounded-lg">
                <Bot className="w-4 h-4 text-accent" />
              </div>
              <h3 className="text-xs font-semibold text-textPrimary">{t('conversations.selectAgent')}</h3>
            </div>
            
            {loadingAgents ? (
              <div className="flex items-center gap-2 text-textMuted text-xs">
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>{t('conversations.loadingAgents')}</span>
              </div>
            ) : agents.length > 0 ? (
              <div className="relative">
                <select
                  value={selectedAgentId}
                  onChange={(e) => setSelectedAgentId(e.target.value)}
                  className="w-full p-1.5 border border-border rounded-lg bg-background text-textPrimary focus:ring-2 focus:ring-accent focus:border-accent transition-all appearance-none cursor-pointer text-xs"
                >
                  <option value="">{t('conversations.selectAgentPlaceholder')}</option>
                  {agents.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-textMuted pointer-events-none" />
              </div>
            ) : (
              <p className="text-textMuted text-xs">{t('conversations.noAgentsAvailable')}</p>
            )}
          </div>

          {/* Lista de conversaciones */}
          <div className="flex-1 overflow-y-auto">
            {selectedAgentId ? (
              <InfiniteConversationsList 
                onConversationSelect={selectConversation}
                selectedAgentId={selectedAgentId}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <Bot className="w-10 h-10 text-muted mb-2" />
                <p className="text-xs text-textMuted">{t('conversations.selectAgentToViewConversations')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Panel principal derecho - Chat (flex-1) */}
        <div className="flex-1 bg-surface rounded-xl border border-border overflow-hidden flex flex-col">
          {selectedConversationId && conversationDetail.conversation ? (
            <>
              {/* Header de la conversación */}
              <div className="p-3 border-b border-border flex-shrink-0 bg-gradient-to-r from-surface to-background">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-4 flex-1">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="bg-accent/10 p-2 rounded-lg">
                          <User className="w-5 h-5 text-accent" />
                        </div>
                        <div>
                          <p className="font-semibold text-textPrimary">
                            {conversationDetail.conversation.activist.first_name} {conversationDetail.conversation.activist.last_name}
                          </p>
                          <p className="text-xs text-textMuted">{conversationDetail.conversation.activist.phone}</p>
                        </div>
                      </div>
                      {/* Tags del activista */}
                      <div className="mt-2 ml-10">
                        <ActivistTagsComponent 
                          activistId={conversationDetail.conversation.activist.id} 
                          compact 
                        />
                      </div>
                    </div>
                    <div className="w-px h-12 bg-border" />
                    <div className="flex items-center gap-2">
                      <div className="bg-accent/10 p-2 rounded-lg">
                        <Bot className="w-5 h-5 text-accent" />
                      </div>
                      <div>
                        <p className="font-semibold text-textPrimary">{conversationDetail.conversation.agent.name}</p>
                        <p className="text-xs text-textMuted">{conversationDetail.conversation.agent.provider}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <ConversationStatus 
                      isActive={conversationDetail.conversation.is_active}
                      endedAt={conversationDetail.conversation.ended_at}
                    />
                    <button
                      onClick={() => setShowSystemMessages(!showSystemMessages)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                        showSystemMessages 
                          ? 'bg-accent text-white' 
                          : 'bg-muted text-textMuted hover:bg-muted/80'
                      }`}
                    >
                      {showSystemMessages ? <EyeOff className="w-4 h-4 inline mr-1" /> : <Eye className="w-4 h-4 inline mr-1" />}
                      {t('conversations.system')}
                    </button>
                    <button
                      onClick={clearSelection}
                      className="text-textMuted hover:text-textSecondary transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Estadísticas de mensajes */}
              <div className="grid grid-cols-3 gap-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-border">
                <div className="text-center">
                  <p className="text-3xl font-bold text-blue-600">
                    {conversationDetail.conversation.message_summary.total_messages}
                  </p>
                  <p className="text-xs text-textMuted mt-1">{t('conversations.messages')}</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-600">
                    {conversationDetail.conversation.message_summary.activist_messages}
                  </p>
                  <p className="text-xs text-textMuted mt-1">{t('conversations.activists')}</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-purple-600">
                    {conversationDetail.conversation.message_summary.agent_messages}
                  </p>
                  <p className="text-xs text-textMuted mt-1">{t('conversations.agent')}</p>
                </div>
              </div>

              {/* Área de mensajes */}
              <div className="flex-1 overflow-y-auto p-4 bg-background">
                {conversationDetail.loading ? (
                  <div className="flex justify-center items-center h-full">
                    <RefreshCw className="w-6 h-6 animate-spin text-textMuted" />
                  </div>
                ) : conversationDetail.error ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <XCircle className="w-12 h-12 text-red-500 mb-4" />
                    <p className="text-red-600">{conversationDetail.error}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {conversationDetail.conversation.messages
                      .filter(message => showSystemMessages || message.sender_type !== 'system')
                      .map((message) => (
                        <MessageBubble 
                          key={message.id} 
                          message={message}
                          isLast={false}
                        />
                      ))}
                  </div>
                )}
              </div>

              {/* Input de mensaje */}
              <div className="border-t border-border bg-surface p-4 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    placeholder={t('conversations.typeMessage')}
                    className="flex-1 px-4 py-3 border border-border rounded-xl bg-background text-textPrimary placeholder-textMuted focus:ring-2 focus:ring-accent focus:border-accent transition-all text-sm"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        // TODO: Implementar envío de mensaje
                      }
                    }}
                  />
                  <button 
                    className="p-3 bg-accent text-white rounded-xl hover:bg-highlight transition-colors"
                    onClick={() => {
                      // TODO: Implementar envío de mensaje
                    }}
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M2 21l21-9L2 3v7l15 2-15 2v7z"/>
                    </svg>
                  </button>
                </div>
                <p className="text-xs text-textMuted mt-2 text-center">{t('conversations.messagingComingSoon')}</p>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <MessageCircle className="w-20 h-20 text-muted mb-4 opacity-50" />
              <h3 className="text-lg font-semibold text-textPrimary mb-2">{t('conversations.selectConversation')}</h3>
              <p className="text-textMuted text-sm max-w-xs">{t('conversations.selectConversationPrompt')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConversationsPage;