import React from 'react';
import { Bot, User, Settings, Clock, Shield } from 'lucide-react';
import type { MessageData } from '../../services/conversationsService';

interface MessageBubbleProps {
  message: MessageData;
  isLast?: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const formatTimestamp = (timestamp: string | null) => {
    if (!timestamp) return '';
    try {
      return new Date(timestamp).toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '';
    }
  };

  const formatText = (text: string) => {
    if (!text) return '';
    
    // Formatear texto con modificadores de WhatsApp
    let formattedText = text
      // Negrita *texto*
      .replace(/\*([^*]+)\*/g, '<strong>$1</strong>')
      // Cursiva _texto_
      .replace(/_([^_]+)_/g, '<em>$1</em>')
      // Tachado ~texto~
      .replace(/~([^~]+)~/g, '<del>$1</del>')
      // Monospace ```texto```
      .replace(/```([^`]+)```/g, '<code class="bg-gray-100 px-1 rounded">$1</code>')
      // Saltos de línea
      .replace(/\n/g, '<br>');
    
    return formattedText;
  };

  // Diferentes estilos según el tipo de mensaje
  const getMessageStyle = () => {
    switch (message.sender_type) {
      case 'system':
        return {
          container: 'mx-auto max-w-md',
          bubble: 'bg-gray-100 border border-gray-200 text-gray-700 text-center rounded-lg px-4 py-3',
          icon: <Settings className="w-4 h-4 text-gray-500" />,
          iconBg: 'bg-gray-200',
          textColor: 'text-gray-700'
        };
      case 'agent':
        return {
          container: 'flex justify-start',
          bubble: 'bg-blue-500 text-white rounded-lg rounded-bl-sm px-4 py-3 shadow-sm break-words inline-block',
          icon: <Bot className="w-4 h-4 text-blue-600" />,
          iconBg: 'bg-blue-100',
          textColor: 'text-white'
        };
      case 'activist':
        return {
          container: 'flex justify-end',
          bubble: 'bg-green-500 text-white rounded-lg rounded-br-sm px-4 py-3 shadow-sm break-words inline-block',
          icon: <User className="w-4 h-4 text-green-600" />,
          iconBg: 'bg-green-100',
          textColor: 'text-white'
        };
      default:
        return {
          container: 'flex justify-center',
          bubble: 'bg-gray-100 text-gray-700 rounded-lg px-4 py-3 break-words inline-block',
          icon: <Shield className="w-4 h-4 text-gray-500" />,
          iconBg: 'bg-gray-200',
          textColor: 'text-gray-700'
        };
    }
  };

  const style = getMessageStyle();

  // Para mensajes del sistema, mostrar formato especial
  if (message.sender_type === 'system') {
    return (
      <div className={style.container}>
        <div className={style.bubble}>
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className={`p-1 rounded-full ${style.iconBg}`}>
              {style.icon}
            </div>
            <span className="text-sm font-medium">Configuración del Sistema</span>
          </div>
          <div className="text-xs opacity-75 border-t border-gray-300 pt-2 mt-2">
            <p className="mb-1"><strong>Prompt del Agente:</strong></p>
            <div 
              className="text-left bg-gray-50 p-2 rounded text-xs whitespace-pre-wrap overflow-wrap-anywhere"
              dangerouslySetInnerHTML={{ __html: formatText(message.text) }}
            />
          </div>
          {message.timestamp && (
            <div className="text-xs opacity-50 mt-2 flex items-center justify-center gap-1">
              <Clock className="w-3 h-3" />
              {formatTimestamp(message.timestamp)}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Para mensajes normales (usuario y bot)
  return (
    <div className={style.container}>
      <div className="flex items-start gap-2 w-full">
        {message.sender_type === 'agent' && (
          <div className={`p-2 rounded-full ${style.iconBg} flex-shrink-0`}>
            {style.icon}
          </div>
        )}
        
        <div className="flex flex-col flex-1 min-w-0">
          {/* Nombre del remitente */}
          {message.sender_name && (
            <div className={`text-xs mb-1 ${
              message.sender_type === 'activist' ? 'text-right text-gray-600' : 'text-left text-gray-600'
            }`}>
              {message.sender_name}
            </div>
          )}
          
          {/* Burbuja del mensaje */}
          <div className={`${style.bubble} ${message.sender_type === 'activist' ? 'ml-auto' : 'mr-auto'}`}
               style={{ maxWidth: '75%' }}>
            <div 
              className={`${style.textColor} whitespace-pre-wrap break-words leading-relaxed`}
              style={{ 
                wordBreak: 'break-word',
                overflowWrap: 'anywhere',
                hyphens: 'auto'
              }}
              dangerouslySetInnerHTML={{ __html: formatText(message.text) }}
            />
            
            {/* Timestamp */}
            {message.timestamp && (
              <div className={`text-xs mt-2 flex items-center gap-1 ${
                message.sender_type === 'activist' ? 'justify-end opacity-70' : 'justify-start opacity-70'
              }`}>
                <Clock className="w-3 h-3" />
                {formatTimestamp(message.timestamp)}
              </div>
            )}
          </div>
        </div>

        {message.sender_type === 'activist' && (
          <div className={`p-2 rounded-full ${style.iconBg} flex-shrink-0`}>
            {style.icon}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;