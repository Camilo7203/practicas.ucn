import React, { useState } from 'react';
import { 
  MessageCircle, 
  Users, 
  Search, 
  User,
  Bot,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  MessageSquare,
  Activity
} from 'lucide-react';
import { useConversationsManager } from '../hooks/useConversations';
import { conversationsService } from '../services/conversationsService';
import type { MessageData } from '../services/conversationsService';

const ConversationsPage: React.FC = () => {
  const {
    conversations,
    activists,
    conversationDetail,
    selectedConversationId,
    selectConversation,
    refreshAll,
    isLoading
  } = useConversationsManager();

  const [activeTab, setActiveTab] = useState<'conversations' | 'activists'>('activists');
  const [searchTerm, setSearchTerm] = useState('');

  // Filtrar activistas por término de búsqueda
  const filteredActivists = activists.activists?.activists.filter(activist => {
    const searchLower = searchTerm.toLowerCase();
    return (
      activist.activist.first_name.toLowerCase().includes(searchLower) ||
      activist.activist.last_name.toLowerCase().includes(searchLower) ||
      activist.activist.phone.includes(searchTerm) ||
      activist.agents_talked_to.some(agent => agent.toLowerCase().includes(searchLower))
    );
  }) || [];

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

  // Componente para mostrar mensaje
  const MessageBubble: React.FC<{ message: MessageData; isLast: boolean }> = ({ message, isLast }) => {
    const isAgent = message.sender_type === 'agent';
    
    return (
      <div className={`flex ${isAgent ? 'justify-start' : 'justify-end'} mb-3 ${isLast ? 'mb-0' : ''}`}>
        <div className={`max-w-[80%] ${isAgent ? 'order-2' : 'order-1'}`}>
          <div className={`rounded-lg px-4 py-2 ${
            isAgent 
              ? 'bg-gray-100 text-gray-900' 
              : 'bg-blue-500 text-white'
          }`}>
            <p className="text-sm whitespace-pre-wrap">{message.text}</p>
          </div>
          <div className={`text-xs text-gray-500 mt-1 ${isAgent ? 'text-left' : 'text-right'}`}>
            <span className="font-medium">{message.sender_name}</span>
            <span className="mx-2">•</span>
            <span>{conversationsService.formatMessageTimestamp(message.timestamp)}</span>
          </div>
        </div>
        <div className={`flex items-center ${isAgent ? 'order-1 mr-2' : 'order-2 ml-2'}`}>
          {isAgent ? (
            <Bot className="w-6 h-6 text-gray-400" />
          ) : (
            <User className="w-6 h-6 text-blue-400" />
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header global */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Conversaciones</h1>
            <p className="text-gray-600 mt-1">
              Gestiona las conversaciones entre activistas y bots
            </p>
          </div>
          <button 
            onClick={refreshAll} 
            disabled={isLoading} 
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>

        {/* Estadísticas en mini cards */}
        {activists.activists && (
          <div className="grid grid-cols-4 gap-4 mt-6">
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600">Activistas</p>
                  <p className="text-xl font-bold text-blue-600">{activists.activists.summary.total_activists_with_conversations}</p>
                </div>
                <Users className="w-5 h-5 text-blue-400" />
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600">Total Conv</p>
                  <p className="text-xl font-bold text-green-600">{activists.activists.summary.total_conversations}</p>
                </div>
                <MessageCircle className="w-5 h-5 text-green-400" />
              </div>
            </div>
            <div className="bg-orange-50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600">Activas</p>
                  <p className="text-xl font-bold text-orange-600">{activists.activists.summary.active_conversations}</p>
                </div>
                <Activity className="w-5 h-5 text-orange-400" />
              </div>
            </div>
            <div className="bg-purple-50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600">Promedio</p>
                  <p className="text-xl font-bold text-purple-600">
                    {activists.activists.summary.total_activists_with_conversations > 0 
                      ? Math.round(activists.activists.summary.total_conversations / activists.activists.summary.total_activists_with_conversations * 10) / 10
                      : 0
                    }
                  </p>
                </div>
                <MessageSquare className="w-5 h-5 text-purple-400" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Layout principal: Sidebar + Chat */}
      <div className="flex flex-1 gap-4 px-6 pb-6">
        {/* Sidebar izquierdo - Lista de conversaciones */}
        <div className="w-96 bg-white rounded-lg shadow overflow-hidden flex flex-col">
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex px-4">
              <button
                onClick={() => setActiveTab('activists')}
                className={`py-3 px-4 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'activists'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Activistas
              </button>
              <button
                onClick={() => setActiveTab('conversations')}
                className={`py-3 px-4 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'conversations'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Todas
              </button>
            </nav>
          </div>

          {/* Búsqueda */}
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder={activeTab === 'activists' ? 'Buscar activista...' : 'Buscar conversación...'}
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
          </div>

          {/* Contenido del sidebar - Activistas */}
          {activeTab === 'activists' && (
            <div className="flex-1 overflow-y-auto">
              {activists.loading ? (
                <div className="flex justify-center items-center py-8">
                  <RefreshCw className="w-5 h-5 animate-spin text-gray-400" />
                </div>
              ) : activists.error ? (
                <div className="p-4 text-center text-red-600 text-sm">{activists.error}</div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredActivists.map((activist) => (
                    <div key={activist.activist.id} className="p-3 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3 mb-2">
                        <User className="w-8 h-8 text-gray-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {activist.activist.first_name} {activist.activist.last_name}
                          </p>
                          <p className="text-xs text-gray-500 truncate">{activist.activist.phone}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 ${
                          activist.activist.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {activist.total_conversations}
                        </span>
                      </div>
                      
                      {/* Conversaciones recientes del activista */}
                      <div className="space-y-1 ml-11">
                        {activist.conversations.slice(0, 2).map((conv) => (
                          <button
                            key={conv.id}
                            onClick={() => selectConversation(conv.id)}
                            className={`w-full text-left p-2 rounded text-xs transition-colors ${
                              selectedConversationId === conv.id
                                ? 'bg-blue-100 text-blue-900'
                                : 'hover:bg-gray-100 text-gray-700'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="truncate font-medium">{conv.agent_name}</span>
                              <span className="text-gray-500 flex-shrink-0">{conv.message_count}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Contenido del sidebar - Todas las conversaciones */}
          {activeTab === 'conversations' && (
            <div className="flex-1 overflow-y-auto">
              {conversations.loading ? (
                <div className="flex justify-center items-center py-8">
                  <RefreshCw className="w-5 h-5 animate-spin text-gray-400" />
                </div>
              ) : conversations.error ? (
                <div className="p-4 text-center text-red-600 text-sm">{conversations.error}</div>
              ) : conversations.conversations ? (
                <div className="divide-y divide-gray-200">
                  {conversations.conversations.conversations.map((conversation) => (
                    <button
                      key={conversation.id}
                      onClick={() => selectConversation(conversation.id)}
                      className={`w-full text-left p-3 transition-colors border-l-4 ${
                        selectedConversationId === conversation.id
                          ? 'bg-blue-50 border-l-blue-500'
                          : 'hover:bg-gray-50 border-l-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">
                          {conversation.activist.first_name} {conversation.activist.last_name}
                        </span>
                        <Bot className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-600">{conversation.agent.name}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">{conversation.message_count} mensajes</span>
                        <ConversationStatus isActive={conversation.is_active} endedAt={conversation.ended_at} />
                      </div>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Panel derecho - Detalle de la conversación */}
        <div className="flex-1 bg-white rounded-lg shadow overflow-hidden flex flex-col">
          {selectedConversationId && conversationDetail.conversation ? (
            <>
              {/* Header de la conversación */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <User className="w-6 h-6 text-gray-400" />
                    <div>
                      <p className="font-semibold text-sm">
                        {conversationDetail.conversation.activist.first_name} {conversationDetail.conversation.activist.last_name}
                      </p>
                      <p className="text-xs text-gray-600">{conversationDetail.conversation.activist.phone}</p>
                    </div>
                  </div>
                  <div className="w-px h-8 bg-gray-300" />
                  <div className="flex items-center gap-2">
                    <Bot className="w-6 h-6 text-gray-400" />
                    <div>
                      <p className="font-semibold text-sm">{conversationDetail.conversation.agent.name}</p>
                      <p className="text-xs text-gray-600">{conversationDetail.conversation.agent.provider}</p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <ConversationStatus 
                    isActive={conversationDetail.conversation.is_active}
                    endedAt={conversationDetail.conversation.ended_at}
                  />
                </div>
              </div>

              {/* Estadísticas de mensajes */}
              <div className="grid grid-cols-3 gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
                <div className="text-center">
                  <p className="text-3xl font-bold text-blue-600">
                    {conversationDetail.conversation.message_summary.total_messages}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">Mensajes</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-600">
                    {conversationDetail.conversation.message_summary.activist_messages}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">Activista</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-purple-600">
                    {conversationDetail.conversation.message_summary.agent_messages}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">Bot</p>
                </div>
              </div>

              {/* Área de mensajes */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {conversationDetail.loading ? (
                  <div className="flex justify-center items-center h-full">
                    <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
                  </div>
                ) : conversationDetail.error ? (
                  <div className="flex justify-center items-center h-full text-red-600">
                    <p>{conversationDetail.error}</p>
                  </div>
                ) : (
                  conversationDetail.conversation.messages.map((message, index) => (
                    <MessageBubble 
                      key={message.id} 
                      message={message}
                      isLast={index === conversationDetail.conversation!.messages.length - 1}
                    />
                  ))
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="font-medium">Selecciona una conversación para ver los detalles</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConversationsPage;