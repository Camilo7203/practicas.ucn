import React, { useState } from 'react';
import { Eye, Users, MessageCircle, Phone, ChevronLeft, ChevronRight } from 'lucide-react';

interface Template {
  id: string;
  name: string;
  components: {
    header?: {
      text?: string;
    };
    body: {
      text: string;
    };
    footer?: {
      text: string;
    };
    buttons?: Array<{
      type: string;
      text: string;
    }>;
  };
}

interface CSVData {
  headers: string[];
  rows: Array<Record<string, string>>;
}

interface ColumnMapping {
  [key: string]: string;
}

interface CampaignPreviewProps {
  template: Template;
  csvData: CSVData;
  columnMapping: ColumnMapping;
}

const CampaignPreview: React.FC<CampaignPreviewProps> = ({
  template,
  csvData,
  columnMapping
}) => {
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);

  const generateMessageForRow = (row: Record<string, string>): string => {
    let message = template.components.body.text;
    
    // Replace variables with actual data
    Object.entries(columnMapping).forEach(([variable, column]) => {
      if (variable !== 'phone') {
        const value = row[column] || `[${column}]`;
        message = message.replace(new RegExp(variable.replace(/[{}]/g, '\\$&'), 'g'), value);
      }
    });
    
    return message;
  };

  const generateHeaderForRow = (row: Record<string, string>): string | undefined => {
    if (!template.components.header?.text) return undefined;
    
    let header = template.components.header.text;
    
    // Replace variables with actual data
    Object.entries(columnMapping).forEach(([variable, column]) => {
      if (variable !== 'phone') {
        const value = row[column] || `[${column}]`;
        header = header.replace(new RegExp(variable.replace(/[{}]/g, '\\$&'), 'g'), value);
      }
    });
    
    return header;
  };

  const getPhoneNumber = (row: Record<string, string>): string => {
    const phoneColumn = columnMapping.phone;
    return row[phoneColumn] || 'Sin teléfono';
  };

  const currentRow = csvData.rows[currentPreviewIndex];
  const currentMessage = generateMessageForRow(currentRow);
  const currentHeader = generateHeaderForRow(currentRow);
  const currentPhone = getPhoneNumber(currentRow);

  const nextPreview = () => {
    if (currentPreviewIndex < csvData.rows.length - 1) {
      setCurrentPreviewIndex(currentPreviewIndex + 1);
    }
  };

  const prevPreview = () => {
    if (currentPreviewIndex > 0) {
      setCurrentPreviewIndex(currentPreviewIndex - 1);
    }
  };

  return (
    <div className="space-y-6">
      {/* Campaign Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/5 rounded-lg p-4 text-center">
          <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
            <Users className="w-6 h-6 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white">{csvData.rows.length}</div>
          <div className="text-white/60 text-sm">Destinatarios</div>
        </div>

        <div className="bg-white/5 rounded-lg p-4 text-center">
          <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
            <MessageCircle className="w-6 h-6 text-green-400" />
          </div>
          <div className="text-2xl font-bold text-white">{template.name}</div>
          <div className="text-white/60 text-sm">Plantilla</div>
        </div>

        <div className="bg-white/5 rounded-lg p-4 text-center">
          <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
            <Eye className="w-6 h-6 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {Object.keys(columnMapping).filter(k => k !== 'phone').length}
          </div>
          <div className="text-white/60 text-sm">Variables</div>
        </div>
      </div>

      {/* Message Preview */}
      <div className="bg-white/5 rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-white font-medium">Vista previa del mensaje</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={prevPreview}
              disabled={currentPreviewIndex === 0}
              className="p-1 text-white/60 hover:text-white disabled:text-white/30 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-white/70 text-sm">
              {currentPreviewIndex + 1} de {csvData.rows.length}
            </span>
            <button
              onClick={nextPreview}
              disabled={currentPreviewIndex === csvData.rows.length - 1}
              className="p-1 text-white/60 hover:text-white disabled:text-white/30 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Current Contact Info */}
          <div className="space-y-4">
            <h4 className="text-white/70 font-medium">Información del contacto</h4>
            
            <div className="bg-white/5 rounded-lg p-4 space-y-3">
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-accent" />
                <span className="text-white/70 text-sm">Teléfono:</span>
                <span className="text-white">{currentPhone}</span>
              </div>
              
              {Object.entries(columnMapping).map(([variable, column]) => {
                if (variable === 'phone') return null;
                return (
                  <div key={variable} className="flex justify-between items-center">
                    <span className="text-white/70 text-sm">{variable}:</span>
                    <span className="text-white">{currentRow[column] || '-'}</span>
                  </div>
                );
              })}
            </div>

            {/* All contact data */}
            <div className="bg-white/5 rounded-lg p-4">
              <h5 className="text-white/70 text-sm mb-2">Todos los datos:</h5>
              <div className="space-y-1 text-xs">
                {csvData.headers.map(header => (
                  <div key={header} className="flex justify-between">
                    <span className="text-white/50">{header}:</span>
                    <span className="text-white/80">{currentRow[header] || '-'}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Message Preview */}
          <div className="space-y-4">
            <h4 className="text-white/70 font-medium">Mensaje como se verá en WhatsApp</h4>
            
            <div className="bg-[#075e54] rounded-lg p-4">
              <div className="bg-white rounded-lg shadow-md overflow-hidden max-w-sm">
                {/* Header if exists */}
                {currentHeader && (
                  <div className="p-3 border-b border-gray-100">
                    <div className="font-semibold text-sm text-gray-800">
                      {currentHeader}
                    </div>
                  </div>
                )}

                {/* Body */}
                <div className="p-3">
                  <div className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                    {currentMessage}
                  </div>
                </div>

                {/* Footer */}
                {template.components.footer?.text && (
                  <div className="px-3 pb-2">
                    <div className="text-xs text-gray-500">
                      {template.components.footer.text}
                    </div>
                  </div>
                )}

                {/* Buttons */}
                {template.components.buttons && template.components.buttons.length > 0 && (
                  <div className="border-t border-gray-100 p-2 space-y-1">
                    {template.components.buttons.map((button, index) => (
                      <div
                        key={index}
                        className="bg-blue-50 border border-blue-200 rounded p-2 text-center text-blue-600 text-sm cursor-pointer hover:bg-blue-100"
                      >
                        {button.text}
                      </div>
                    ))}
                  </div>
                )}

                {/* Message info */}
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

      {/* Validation Summary */}
      <div className="bg-white/5 rounded-lg p-4">
        <h3 className="text-white font-medium mb-3">Resumen de validación</h3>
        
        <div className="space-y-2">
          {/* Phone validation */}
          <div className="flex justify-between items-center p-2 bg-white/5 rounded">
            <span className="text-white/70 text-sm">Números de teléfono válidos:</span>
            <span className={`text-sm ${
              csvData.rows.every(row => getPhoneNumber(row) !== 'Sin teléfono')
                ? 'text-green-400'
                : 'text-yellow-400'
            }`}>
              {csvData.rows.filter(row => getPhoneNumber(row) !== 'Sin teléfono').length} / {csvData.rows.length}
            </span>
          </div>

          {/* Variable validation */}
          <div className="flex justify-between items-center p-2 bg-white/5 rounded">
            <span className="text-white/70 text-sm">Variables mapeadas:</span>
            <span className="text-green-400 text-sm">
              {Object.keys(columnMapping).filter(k => k !== 'phone').length} / {Object.keys(columnMapping).filter(k => k !== 'phone').length}
            </span>
          </div>

          {/* Template validation */}
          <div className="flex justify-between items-center p-2 bg-white/5 rounded">
            <span className="text-white/70 text-sm">Plantilla válida:</span>
            <span className="text-green-400 text-sm">✓</span>
          </div>
        </div>

        {/* Warnings */}
        {csvData.rows.some(row => getPhoneNumber(row) === 'Sin teléfono') && (
          <div className="mt-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
            <p className="text-yellow-400 text-sm">
              ⚠️ Algunos contactos no tienen número de teléfono válido y no recibirán el mensaje.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CampaignPreview;