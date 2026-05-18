import React from 'react';
import { Smartphone } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { IMetaComponent } from '@/interfaces/whatsappTemplates';
interface WhatsAppPreviewProps {
  components: IMetaComponent[];
}

const WhatsAppPreview: React.FC<WhatsAppPreviewProps> = ({ components }) => {
  const { t } = useTranslation();
  // Ordenar componentes en el orden correcto para el preview
  const sortComponents = (comps: IMetaComponent[]): IMetaComponent[] => {
    const order = { 'HEADER': 0, "BODY": 1, "FOOTER": 2, "BUTTONS": 3 , "buttons": 3};
    return [...comps].sort((a, b) => (order[a.type as keyof typeof order] || 0) - (order[b.type as keyof typeof order] || 0));
  };

  // Función para reemplazar variables con ejemplos
  const replaceVariablesWithExamples = (text: string, component: IMetaComponent): string => {
    if (!text) return text;
    
    let replacedText = text;
    
    // Reemplazar variables del HEADER
    if ((component as any).type === 'HEADER' && (component as any).example?.header_text) {
      (component as any).example.header_text.forEach((example: string, index: number) => {
        // Reemplazar variables por posición: {{1}}, {{2}}, etc.
        replacedText = replacedText.replace(new RegExp(`\\{\\{${index + 1}\\}\\}`, 'g'), example);
      });
    }
    
    // Reemplazar variables del BODY
    if ((component as any).type === "BODY" && (component as any).example?.body_text?.[0]) {
      (component as any).example.body_text[0].forEach((example: string, index: number) => {
        // Reemplazar variables por posición: {{1}}, {{2}}, etc.
        replacedText = replacedText.replace(new RegExp(`\\{\\{${index + 1}\\}\\}`, 'g'), example);
      });
      
      // También intentar reemplazar variables por nombre si coinciden
      const matches = text.match(/\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}/g);
      if (matches) {
        matches.forEach((match, index) => {
          const varName = match.replace(/[{}]/g, '');
          if (!/^\d+$/.test(varName) && (component as any).example?.body_text?.[0]?.[index]) {
            replacedText = replacedText.replace(new RegExp(`\\{\\{${varName}\\}\\}`, 'g'), (component as any).example.body_text[0][index]);
          }
        });
      }
    }
    
    return replacedText;
  };

  // Función para aplicar formato de WhatsApp (negrita, cursiva, tachado, monoespaciado)
  const applyWhatsAppFormatting = (text: string): React.ReactNode => {
    if (!text) return text;

    // Dividir el texto en segmentos y aplicar formato
    const segments: React.ReactNode[] = [];
    let currentIndex = 0;
    let segmentKey = 0;

    // Patrones de formato de WhatsApp en orden de prioridad
    const formatPatterns = [
      { regex: /\*([^*]+)\*/g, tag: 'bold' },           // *negrita*
      { regex: /_([^_]+)_/g, tag: 'italic' },           // _cursiva_
      { regex: /~([^~]+)~/g, tag: 'strikethrough' },    // ~tachado~
      { regex: /```([^`]+)```/g, tag: 'code-block' },   // ```código```
      { regex: /`([^`]+)`/g, tag: 'code' },             // `monoespaciado`
    ];

    // Crear un array con todas las coincidencias y sus posiciones
    const matches: Array<{
      start: number;
      end: number;
      text: string;
      tag: string;
      content: string;
    }> = [];

    formatPatterns.forEach(({ regex, tag }) => {
      const localRegex = new RegExp(regex.source, regex.flags);
      let match;
      while ((match = localRegex.exec(text)) !== null) {
        matches.push({
          start: match.index,
          end: match.index + match[0].length,
          text: match[0],
          tag,
          content: match[1],
        });
      }
    });

    // Ordenar matches por posición de inicio
    matches.sort((a, b) => a.start - b.start);

    // Procesar el texto con los matches
    matches.forEach((match) => {
      // Agregar texto antes del match
      if (currentIndex < match.start) {
        segments.push(
          <span key={`text-${segmentKey++}`}>
            {text.substring(currentIndex, match.start)}
          </span>
        );
      }

      // Agregar el texto formateado
      switch (match.tag) {
        case 'bold':
          segments.push(
            <strong key={`format-${segmentKey++}`} className="font-bold">
              {match.content}
            </strong>
          );
          break;
        case 'italic':
          segments.push(
            <em key={`format-${segmentKey++}`} className="italic">
              {match.content}
            </em>
          );
          break;
        case 'strikethrough':
          segments.push(
            <span key={`format-${segmentKey++}`} className="line-through">
              {match.content}
            </span>
          );
          break;
        case 'code':
          segments.push(
            <code key={`format-${segmentKey++}`} className="px-1 py-0.5 bg-gray-200 rounded text-xs font-mono">
              {match.content}
            </code>
          );
          break;
        case 'code-block':
          segments.push(
            <code key={`format-${segmentKey++}`} className="block px-2 py-1 bg-gray-200 rounded text-xs font-mono my-1">
              {match.content}
            </code>
          );
          break;
        default:
          segments.push(<span key={`format-${segmentKey++}`}>{match.content}</span>);
      }

      currentIndex = match.end;
    });

    // Agregar el texto restante
    if (currentIndex < text.length) {
      segments.push(
        <span key={`text-${segmentKey++}`}>
          {text.substring(currentIndex)}
        </span>
      );
    }

    return segments.length > 0 ? <>{segments}</> : text;
  };

  const sortedComponents = sortComponents(components);

  const renderComponent = (component: IMetaComponent, index: number) => {
    switch (component.type) {
      case 'HEADER':
        if (component.format === 'TEXT' && component.text) {
          const displayText = replaceVariablesWithExamples(component.text, component);
          const formattedText = applyWhatsAppFormatting(displayText);
          return (
            <div key={index} className="font-bold text-sm text-gray-800 mb-2">
              {formattedText}
            </div>
          );
        } else if (component.format === 'IMAGE') {
          // Si hay un media_url en el ejemplo, mostrar la imagen real
          const imageUrl = (component as any).example?.media_url;
          if (imageUrl) {
            return (
              <div key={index} className="w-full mb-2 rounded-lg overflow-hidden">
                <img 
                  src={imageUrl} 
                  alt="Header image" 
                  className="w-full h-auto object-cover max-h-64"
                  onError={(e) => {
                    // Fallback si la imagen no carga
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement!.innerHTML = `
                      <div class="w-full h-32 bg-gray-200 rounded-lg flex items-center justify-center">
                        <span class="text-xs text-gray-500">📷 Imagen de encabezado</span>
                      </div>
                    `;
                  }}
                />
              </div>
            );
          }
          // Placeholder si no hay imagen cargada
          return (
            <div key={index} className="w-full h-32 bg-gray-200 rounded-lg mb-2 flex items-center justify-center">
              <span className="text-xs text-gray-500">📷 {t('shipments.headerImage')}</span>
            </div>
          );
        } else if (component.format === 'VIDEO') {
          // Si hay un media_url en el ejemplo, mostrar el video real
          const videoUrl = (component as any).example?.media_url;
          if (videoUrl) {
            return (
              <div key={index} className="w-full mb-2 rounded-lg overflow-hidden bg-black">
                <video 
                  controls 
                  className="w-full h-auto max-h-64"
                  onError={(e) => {
                    // Fallback si el video no carga
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement!.innerHTML = `
                      <div class="w-full h-32 bg-gray-200 rounded-lg flex items-center justify-center">
                        <span class="text-xs text-gray-500">🎥 Video de encabezado</span>
                      </div>
                    `;
                  }}
                >
                  <source src={videoUrl} type="video/mp4" />
                  Tu navegador no soporta la reproducción de video.
                </video>
              </div>
            );
          }
          // Placeholder si no hay video cargado
          return (
            <div key={index} className="w-full h-32 bg-gray-200 rounded-lg mb-2 flex items-center justify-center">
              <span className="text-xs text-gray-500">🎥 {t('shipments.headerVideo')}</span>
            </div>
          );
        } else if (component.format === 'DOCUMENT') {
          // Si hay un media_url, mostrar info del documento
          const docUrl = (component as any).example?.media_url;
          const fileName = (component as any).example?.file_name || 'documento.pdf';
          
          if (docUrl) {
            return (
              <div key={index} className="w-full p-3 bg-gray-100 rounded-lg mb-2">
                <a 
                  href={docUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center space-x-3 hover:bg-gray-200 p-2 rounded transition-colors"
                >
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-red-100 rounded flex items-center justify-center">
                      <span className="text-xl">📄</span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-700 truncate">{fileName}</p>
                    <p className="text-xs text-gray-500">{t('shipments.pdfDocument')}</p>
                  </div>
                  <div className="flex-shrink-0">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </div>
                </a>
              </div>
            );
          }
          // Placeholder si no hay documento
          return (
            <div key={index} className="w-full p-3 bg-gray-100 rounded-lg mb-2 flex items-center justify-center">
              <span className="text-xs text-gray-600">📄 {t('shipments.attachedDocument')}</span>
            </div>
          );
        } else if (component.format === 'LOCATION') {
          return (
            <div key={index} className="w-full p-3 bg-gray-100 rounded-lg mb-2">
              <div className="flex items-start space-x-2">
                <span className="text-lg">📍</span>
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-700">{t('shipments.sharedLocation')}</p>
                  <p className="text-xs text-gray-500 mt-1">{t('shipments.nameAndAddress')}</p>
                </div>
              </div>
            </div>
          );
        }
        return null;

      case "BODY":
        const bodyText = component.text ? replaceVariablesWithExamples(component.text, component) : 'Escribe el cuerpo del mensaje...';
        const formattedBodyText = component.text ? applyWhatsAppFormatting(bodyText) : bodyText;
        return (
          <div key={index} className="text-sm text-gray-700 mb-2 whitespace-pre-wrap">
            {formattedBodyText}
          </div>
        );

      case "FOOTER":
        const formattedFooter = component.text ? applyWhatsAppFormatting(component.text) : '';
        return (
          <div key={index} className="text-xs text-gray-500 mt-2">
            {formattedFooter}
          </div>
        );

      case 'BUTTONS':
        return (
          <div key={index} className="mt-3 space-y-1">
            {component.buttons?.map((button:any, btnIndex:any) => (
              <button
                key={btnIndex}
                className="w-full py-2 text-sm text-blue-600 font-medium border-t border-gray-200 hover:bg-gray-50 transition-colors"
              >
                {button.type === 'PHONE_NUMBER' && '📞 '}
                {button.type === 'URL' && '🔗 '}
                {button.type === 'COPY_CODE' && '📋 '}
                {button.type === 'QUICK_REPLY' && '⚡ '}
                {button.text || 'Botón'}
              </button>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-surface rounded-xl border border-border p-6">
      <div className="flex items-center space-x-2 mb-4">
        <Smartphone className="w-5 h-5 text-accent" />
        <h3 className="font-semibold text-textPrimary">{t('shipments.whatsappPreview')}</h3>
      </div>

      {/* Simulación de WhatsApp */}
      <div className="relative">
        {/* Marco del teléfono */}
        <div className="mx-auto w-full max-w-sm">
          {/* Barra superior de WhatsApp */}
          <div className="bg-[#075E54] text-white p-3 rounded-t-2xl flex items-center space-x-3">
            <div className="w-8 h-8 bg-white/20 rounded-full"></div>
            <div className="flex-1">
              <p className="text-sm font-medium">{t('shipments.whatsappPreview')}</p>
              <p className="text-xs opacity-80">{t('shipments.whatsappBusiness')}</p>
            </div>
          </div>

          {/* Área de chat */}
          <div className="bg-[#ECE5DD] p-4 min-h-[400px] rounded-b-2xl" 
               style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 0h100v100H0z\' fill=\'%23ECE5DD\'/%3E%3Cpath d=\'M10 10h5v5h-5zm10 0h5v5h-5zm10 0h5v5h-5zm10 0h5v5h-5zm10 0h5v5h-5zm10 0h5v5h-5zm10 0h5v5h-5zm10 0h5v5h-5zm10 0h5v5h-5z\' fill=\'%23D5CCC3\' fill-opacity=\'.1\'/%3E%3C/svg%3E")' }}>
            
            {/* Burbuja del mensaje */}
            <div className="flex justify-end">
              <div className="bg-white rounded-lg shadow-sm max-w-xs relative">
                {/* Triángulo de la burbuja */}
                <div className="absolute -right-2 top-0 w-0 h-0 border-t-8 border-t-white border-l-8 border-l-transparent"></div>
                
                {/* Contenido de la plantilla */}
                <div className="p-3">
                  {sortedComponents.length === 0 ? (
                    <div className="text-sm text-gray-500">
                      Agrega componentes para ver la vista previa
                    </div>
                  ) : (
                    sortedComponents.map((component, index) => renderComponent(component, index))
                  )}
                </div>

                {/* Timestamp */}
                <div className="px-3 pb-2 flex items-center justify-end space-x-1">
                  <span className="text-xs text-gray-500">
                    {new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="text-blue-500 text-xs">✓✓</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notas informativas */}
      <div className="mt-4 p-3 bg-muted rounded-lg">
        <p className="text-xs text-textMuted">
          <strong>Nota:</strong> Esta es una vista previa aproximada. El diseño final puede variar según el dispositivo y la versión de WhatsApp.
        </p>
      </div>
    </div>
  );
};

export default WhatsAppPreview;
