import React, { useState, useEffect, useRef } from 'react';
import { X, MessageSquare, User, Bot, Settings, Eye, EyeOff, Clock, Hash } from 'lucide-react';
import AgentService from '../../services/agentService';
import type { ChatMessage, ChatSession } from '../../types';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  agentId: string;
  agentName: string;
}

const ChatModal: React.FC<ChatModalProps> = ({ isOpen, onClose, agentId, agentName }) => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSystemMessages, setShowSystemMessages] = useState(false);
  const [view, setView] = useState<'sessions' | 'chat'>('sessions');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      loadSessions();
    }
  }, [isOpen, agentId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const response = await AgentService.getAgentMessages(agentId);
      const data = response.data as any;
      if (data?.sessions) {
        setSessions(data.sessions);
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (sessionId: string) => {
    setLoading(true);
    try {
      const response = await AgentService.getAgentMessages(agentId, sessionId);
      const data = response.data as any;
      if (data?.messages) {
        setMessages(data.messages);
        setCurrentSession(sessionId);
        setView('chat');
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp: string | Date) => {
    const date = new Date(timestamp);
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFilteredMessages = () => {
    if (showSystemMessages) {
      return messages;
    }
    return messages.filter(msg => msg.type !== 'System');
  };

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'Human':
        return <User className="w-4 h-4" />;
      case 'AI':
        return <Bot className="w-4 h-4" />;
      case 'System':
        return <Settings className="w-4 h-4" />;
      default:
        return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getMessageStyle = (type: string) => {
    switch (type) {
      case 'Human':
        return 'bg-blue-50 border-blue-200 text-blue-900';
      case 'AI':
        return 'bg-purple-50 border-purple-200 text-purple-900';
      case 'System':
        return 'bg-gray-50 border-gray-200 text-gray-700';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-700';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <MessageSquare className="w-6 h-6 text-purple-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {view === 'sessions' ? 'Conversaciones' : 'Chat'}
              </h2>
              <p className="text-gray-600 text-sm">
                {view === 'sessions' ? `Agente: ${agentName}` : `Sesión: ${currentSession}`}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {view === 'chat' && (
              <>
                <button
                  onClick={() => setShowSystemMessages(!showSystemMessages)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium flex items-center space-x-1 transition-colors ${
                    showSystemMessages 
                      ? 'bg-purple-100 text-purple-700' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {showSystemMessages ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  <span>System</span>
                </button>
                <button
                  onClick={() => {
                    setView('sessions');
                    setCurrentSession(null);
                    setMessages([]);
                  }}
                  className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                >
                  Volver
                </button>
              </>
            )}
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {view === 'sessions' ? (
            <div className="p-6 h-full overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                </div>
              ) : sessions.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No hay conversaciones disponibles</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <h3 className="font-medium text-gray-900 mb-4">
                    Selecciona una conversación ({sessions.length})
                  </h3>
                  {sessions.map((session) => (
                    <div
                      key={session.sessionID}
                      onClick={() => loadMessages(session.sessionID)}
                      className="p-4 border border-gray-200 rounded-lg hover:bg-purple-50 hover:border-purple-300 cursor-pointer transition-all duration-200"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Hash className="w-4 h-4 text-gray-400" />
                            <span className="font-medium text-gray-900 text-sm">
                              {session.sessionID}
                            </span>
                          </div>
                          <p className="text-gray-600 text-sm line-clamp-2">
                            {session.lastMessage}
                          </p>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            <span className="flex items-center space-x-1">
                              <MessageSquare className="w-3 h-3" />
                              <span>{session.messageCount} mensajes</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Clock className="w-3 h-3" />
                              <span>{formatTimestamp(session.lastActivity)}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col h-full">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                  </div>
                ) : getFilteredMessages().length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <div className="text-center">
                      <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No hay mensajes en esta conversación</p>
                    </div>
                  </div>
                ) : (
                  getFilteredMessages().map((message) => (
                    <div
                      key={message.id}
                      className={`p-4 rounded-lg border ${getMessageStyle(message.type)} ${
                        message.type === 'System' ? (showSystemMessages ? 'block' : 'hidden') : 'block'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          {getMessageIcon(message.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-sm">
                              {message.type}
                            </span>
                            <span className="text-xs opacity-70">
                              {formatTimestamp(message.timestamp)}
                            </span>
                          </div>
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">
                            {message.content}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatModal;