import React from 'react';
import { X, User, Phone, ExternalLink, Copy } from 'lucide-react';

interface WhatsAppTemplate {
  id?: string;
  name: string;
  category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
  language: string;
  status?: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED';
  components: {
    header?: {
      type: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'LOCATION';
      text?: string;
      format?: string;
      example?: any;
    };
    body: {
      text: string;
      example?: any;
    };
    footer?: {
      text: string;
    };
    buttons?: Array<{
      type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER' | 'COPY_CODE';
      text: string;
      url?: string;
      phone_number?: string;
      example?: string[];
    }>;
  };
}

interface TemplatePreviewProps {
  template: WhatsAppTemplate;
  onClose: () => void;
}

const TemplatePreview: React.FC<TemplatePreviewProps> = ({ template, onClose }) => {
  const renderHeaderPreview = () => {
    if (!template.components.header) return null;

    const { header } = template.components;

    switch (header.type) {
      case 'TEXT':
        return (
          <div className="font-semibold text-sm text-gray-800 mb-3">
            {header.text?.replace(/\{\{(\d+)\}\}/g, '[Variable $1]') || '[Texto del encabezado]'}
          </div>
        );
      case 'IMAGE':
        return (
          <div className="bg-gray-200 h-40 rounded-lg mb-3 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-300 rounded-lg mx-auto mb-2 flex items-center justify-center">
                <span className="text-2xl">🖼️</span>
              </div>
              <span className="text-gray-500 text-sm">Imagen</span>
            </div>
          </div>
        );
      case 'VIDEO':
        return (
          <div className="bg-gray-200 h-40 rounded-lg mb-3 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-300 rounded-lg mx-auto mb-2 flex items-center justify-center">
                <span className="text-2xl">🎥</span>
              </div>
              <span className="text-gray-500 text-sm">Video</span>
            </div>
          </div>
        );
      case 'DOCUMENT':
        return (
          <div className="bg-gray-100 border border-gray-300 rounded-lg p-3 mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-500 rounded flex items-center justify-center">
                <span className="text-white text-sm font-bold">PDF</span>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-800">Documento.pdf</div>
                <div className="text-xs text-gray-500">PDF • 1.2 MB</div>
              </div>
            </div>
          </div>
        );
      case 'LOCATION':
        return (
          <div className="bg-gray-200 h-32 rounded-lg mb-3 flex items-center justify-center relative">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-500 rounded-full mx-auto mb-2 flex items-center justify-center">
                <span className="text-white text-lg">📍</span>
              </div>
              <span className="text-gray-600 text-sm font-medium">Ubicación</span>
            </div>
            <div className="absolute top-2 right-2 bg-white rounded px-2 py-1">
              <span className="text-xs text-gray-500">Ver en Maps</span>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const renderButtonIcon = (type: string) => {
    switch (type) {
      case 'URL':
        return <ExternalLink className="w-4 h-4" />;
      case 'PHONE_NUMBER':
        return <Phone className="w-4 h-4" />;
      case 'COPY_CODE':
        return <Copy className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getButtonColor = (type: string) => {
    switch (type) {
      case 'URL':
        return 'bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100';
      case 'PHONE_NUMBER':
        return 'bg-green-50 border-green-200 text-green-600 hover:bg-green-100';
      case 'COPY_CODE':
        return 'bg-purple-50 border-purple-200 text-purple-600 hover:bg-purple-100';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-primary border border-accent/20 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-accent/20">
          <div>
            <h2 className="text-xl font-semibold text-white">
              Vista previa: {template.name}
            </h2>
            <p className="text-white/70 text-sm">
              Así se verá tu plantilla en WhatsApp
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Mobile Preview */}
            <div className="lg:order-2">
              <h3 className="text-white font-medium mb-4">Vista móvil</h3>
              <div className="mx-auto" style={{ width: '280px' }}>
                {/* Phone Frame */}
                <div className="bg-gray-900 rounded-3xl p-2">
                  <div className="bg-white rounded-2xl overflow-hidden">
                    {/* WhatsApp Header */}
                    <div className="bg-[#075e54] text-white p-3 flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <div className="font-medium text-sm">Tu Empresa</div>
                        <div className="text-xs opacity-75">en línea</div>
                      </div>
                    </div>

                    {/* Chat Area */}
                    <div className="bg-[#e5ddd5] p-4 min-h-[400px]">
                      {/* Message Bubble */}
                      <div className="max-w-[85%] ml-auto">
                        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                          {/* Header */}
                          {renderHeaderPreview()}

                          {/* Body */}
                          <div className="px-3 py-2">
                            <div className="text-sm text-gray-800 leading-relaxed">
                              {template.components.body.text.replace(/\{\{(\d+)\}\}/g, '[Variable $1]') || 'Texto del mensaje...'}
                            </div>
                          </div>

                          {/* Footer */}
                          {template.components.footer && template.components.footer.text && (
                            <div className="px-3 pb-2">
                              <div className="text-xs text-gray-500">
                                {template.components.footer.text}
                              </div>
                            </div>
                          )}

                          {/* Buttons */}
                          {template.components.buttons && template.components.buttons.length > 0 && (
                            <div className="border-t border-gray-100">
                              <div className="p-2 space-y-1">
                                {template.components.buttons.map((button, index) => (
                                  <div
                                    key={index}
                                    className={`border rounded-lg p-2 text-center text-sm cursor-pointer transition-colors flex items-center justify-center space-x-2 ${getButtonColor(button.type)}`}
                                  >
                                    {renderButtonIcon(button.type)}
                                    <span>{button.text || `Botón ${index + 1}`}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Message Info */}
                          <div className="px-3 pb-2 flex justify-end">
                            <div className="text-xs text-gray-400">
                              12:34 ✓✓
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Template Info */}
            <div className="lg:order-1 space-y-6">
              <div>
                <h3 className="text-white font-medium mb-4">Información de la plantilla</h3>
                <div className="bg-white/5 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-white/70">Nombre:</span>
                    <span className="text-white">{template.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70">Categoría:</span>
                    <span className="text-white">{template.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70">Idioma:</span>
                    <span className="text-white">{template.language}</span>
                  </div>
                  {template.status && (
                    <div className="flex justify-between">
                      <span className="text-white/70">Estado:</span>
                      <span className={`text-sm px-2 py-1 rounded ${
                        template.status === 'APPROVED' ? 'bg-green-400/10 text-green-400' :
                        template.status === 'PENDING' ? 'bg-yellow-400/10 text-yellow-400' :
                        template.status === 'REJECTED' ? 'bg-red-400/10 text-red-400' :
                        'bg-gray-400/10 text-gray-400'
                      }`}>
                        {template.status}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-white font-medium mb-4">Componentes</h3>
                <div className="space-y-3">
                  {template.components.header && (
                    <div className="bg-white/5 rounded-lg p-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-white/70 text-sm">Encabezado</span>
                        <span className="text-accent text-xs">{template.components.header.type}</span>
                      </div>
                      {template.components.header.type === 'TEXT' && template.components.header.text && (
                        <div className="text-white text-sm">
                          {template.components.header.text}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="text-white/70 text-sm mb-2">Cuerpo</div>
                    <div className="text-white text-sm">
                      {template.components.body.text}
                    </div>
                  </div>

                  {template.components.footer && (
                    <div className="bg-white/5 rounded-lg p-3">
                      <div className="text-white/70 text-sm mb-2">Pie de página</div>
                      <div className="text-white text-sm">
                        {template.components.footer.text}
                      </div>
                    </div>
                  )}

                  {template.components.buttons && template.components.buttons.length > 0 && (
                    <div className="bg-white/5 rounded-lg p-3">
                      <div className="text-white/70 text-sm mb-2">
                        Botones ({template.components.buttons.length})
                      </div>
                      <div className="space-y-2">
                        {template.components.buttons.map((button, index) => (
                          <div key={index} className="flex justify-between items-center text-sm">
                            <span className="text-white">{button.text}</span>
                            <span className="text-accent text-xs">{button.type}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-white font-medium mb-4">Variables detectadas</h3>
                <div className="bg-white/5 rounded-lg p-4">
                  {(() => {
                    const allText = [
                      template.components.header?.text || '',
                      template.components.body.text,
                      template.components.footer?.text || ''
                    ].join(' ');
                    
                    const variables = Array.from(new Set(
                      allText.match(/\{\{(\d+)\}\}/g) || []
                    )).sort();

                    if (variables.length === 0) {
                      return (
                        <p className="text-white/60 text-sm">
                          No se detectaron variables en esta plantilla
                        </p>
                      );
                    }

                    return (
                      <div className="space-y-2">
                        <p className="text-white/70 text-sm mb-3">
                          Esta plantilla usa las siguientes variables:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {variables.map((variable, index) => (
                            <span
                              key={index}
                              className="bg-accent/20 text-accent px-2 py-1 rounded text-sm"
                            >
                              {variable}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplatePreview;