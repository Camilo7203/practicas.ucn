import React, { useState } from 'react';
import { X, Send, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { IMetaTemplatePayload } from '@/interfaces/whatsappTemplates';
import type { CSVColumn } from './SendTab';
import WhatsAppPreview from './WhatsAppPreview';
import { useTranslation } from 'react-i18next';

interface CampaignPreviewProps {
  template: IMetaTemplatePayload;
  csvColumns: CSVColumn[];
  variableMappings: { [key: string]: string };
  onClose: () => void;
  onSend: () => void;
  isSending?: boolean;
}

const CampaignPreview: React.FC<CampaignPreviewProps> = ({
  template,
  csvColumns,
  variableMappings,
  onClose,
  onSend,
  isSending = false,
}) => {
  const { t } = useTranslation();
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);

  // Obtener el número de filas para la previsualización
  const maxRows = Math.max(...csvColumns.map(col => col.sampleData.length));

  // Generar vista previa para una fila específica
  const generatePreviewForRow = (rowIndex: number) => {
    const previewComponents = template.components.map(component => {
      if ((component as any).text) {
        let text = (component as any).text;
        
        // Reemplazar variables
        Object.entries(variableMappings).forEach(([variable, columnName]) => {
          const column = csvColumns.find(col => col.name === columnName);
          const value = column?.sampleData[rowIndex] || `{{${variable}}}`;
          text = text.replace(new RegExp(`\\{\\{${variable}\\}\\}`, 'g'), value);
        });

        return { ...component, text };
      }
      return component;
    });

    return previewComponents;
  };

  const handlePrevious = () => {
    setCurrentPreviewIndex(Math.max(0, currentPreviewIndex - 1));
  };

  const handleNext = () => {
    setCurrentPreviewIndex(Math.min(maxRows - 1, currentPreviewIndex + 1));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-accent text-white p-6 flex items-center justify-between">
          <h2 className="text-xl font-bold">{t('shipments.campaignPreviewTitle')}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Información */}
            <div className="space-y-4">
              <div className="bg-muted rounded-lg p-4">
                <h3 className="font-semibold text-textPrimary mb-3">{t('shipments.sendInfo')}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-textMuted">{t('shipments.template')}:</span>
                    <span className="font-medium text-textPrimary">{template.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-textMuted">{t('shipments.recipients')}:</span>
                    <span className="font-medium text-textPrimary">{maxRows}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-textMuted">{t('shipments.status')}:</span>
                    <span className="font-medium text-green-600">{(template as any).status}</span>
                  </div>
                </div>
              </div>

              <div className="bg-muted rounded-lg p-4">
                <h3 className="font-semibold text-textPrimary mb-3">{t('shipments.variableMapping')}</h3>
                <div className="space-y-2">
                  {Object.entries(variableMappings).map(([variable, column]) => (
                    <div key={variable} className="flex items-center justify-between text-sm">
                      <code className="px-2 py-1 bg-white rounded text-accent text-xs">
                        {`{{${variable}}}`}
                      </code>
                      <span className="text-textMuted">→</span>
                      <span className="font-medium text-textPrimary">{column}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Navegación de ejemplos */}
              <div className="bg-muted rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-textPrimary">
                    {t('shipments.exampleCount', { current: currentPreviewIndex + 1, total: maxRows })}
                  </h3>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handlePrevious}
                      disabled={currentPreviewIndex === 0}
                      className="p-1 rounded bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent hover:text-white transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleNext}
                      disabled={currentPreviewIndex === maxRows - 1}
                      className="p-1 rounded bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent hover:text-white transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="space-y-1 text-sm">
                  {csvColumns.map((column) => (
                    <div key={column.name} className="flex items-center justify-between">
                      <span className="text-textMuted">{column.name}:</span>
                      <span className="font-medium text-textPrimary">
                        {column.sampleData[currentPreviewIndex] || '-'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Vista previa del mensaje */}
            <div>
              <WhatsAppPreview components={generatePreviewForRow(currentPreviewIndex)} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border p-6 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-border rounded-lg text-textSecondary hover:bg-muted transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              onSend();
              onClose();
            }}
            disabled={isSending}
            className="bg-accent text-white px-6 py-2 rounded-lg hover:bg-highlight transition-colors flex items-center space-x-2 shadow-sm font-medium disabled:opacity-50"
          >
            {isSending ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Enviando...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Enviar Campaña</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CampaignPreview;
