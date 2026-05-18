import React from 'react';
import { ArrowLeft, Edit3, Calendar } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { IMetaTemplatePayload } from '@/interfaces/whatsappTemplates';
import WhatsAppPreview from './WhatsAppPreview';

interface TemplatePreviewProps {
  template: IMetaTemplatePayload;
  onClose: () => void;
  onEdit: () => void;
}

const TemplatePreview: React.FC<TemplatePreviewProps> = ({ template, onClose, onEdit }) => {
  const { t } = useTranslation();
  const getCategoryBadgeColor = (category: string) => {
    switch (category) {
      case 'MARKETING': return 'bg-blue-50 text-blue-600';
      case 'UTILITY': return 'bg-green-50 text-green-600';
      case 'AUTHENTICATION': return 'bg-purple-50 text-purple-600';
      default: return 'bg-gray-50 text-gray-600';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onClose}
          className="flex items-center space-x-2 text-textSecondary hover:text-textPrimary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('shipments.backButton')}</span>
        </button>
        <button
          onClick={onEdit}
          className="flex items-center space-x-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-highlight transition-colors"
        >
          <Edit3 className="w-4 h-4" />
          <span>{t('shipments.editButton')}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Información de la plantilla */}
        <div className="space-y-6">
          <div className="bg-surface rounded-xl border border-border p-6">
            <h2 className="text-xl font-bold text-textPrimary mb-4">{template.name}</h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-textMuted block mb-2">{t('shipments.status')}</label>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor((template as any).status)}`}>
                  {(template as any).status}
                </span>
              </div>

              <div>
                <label className="text-sm font-medium text-textMuted block mb-2">{t('shipments.category')}</label>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getCategoryBadgeColor((template as any).category)}`}>
                  {(template as any).category}
                </span>
              </div>

              <div>
                <label className="text-sm font-medium text-textMuted block mb-2">{t('shipments.language')}</label>
                <p className="text-textPrimary">{(template as any).language}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-textMuted block mb-2">{t('shipments.creationDate')}</label>
                <div className="flex items-center space-x-2 text-textSecondary">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date((template as any).createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Componentes */}
          <div className="bg-surface rounded-xl border border-border p-6">
            <h3 className="font-semibold text-textPrimary mb-4">{t('shipments.components')}</h3>
            <div className="space-y-4">
              {template.components.sort((a, b) => {
                const order = { 'HEADER': 0, "BODY": 1, "FOOTER": 2, "BUTTONS": 3};
                return order[a.type] - order[b.type];
              }).map((component, index) => (
                <div key={index} className="border border-border rounded-lg p-4">
                  <h4 className="text-sm font-medium text-textPrimary mb-2">
                    {component.type === 'HEADER' && t('shipments.componentHeader', { format: (component as any).format })}
                    {component.type === "BODY" && t('shipments.componentBody')}
                    {component.type === "FOOTER" && t('shipments.componentFooter')}
                    {component.type === "BUTTONS" && t('shipments.componentButtons', { count: (component as any).buttons?.length || 0 })}
                  </h4>
                  {(component as any).text && (
                    <p className="text-sm text-textSecondary whitespace-pre-wrap">{(component as any).text}</p>
                  )}
                  
                  {/* Mostrar ejemplos de variables si existen */}
                  {(component as any).example && ((component as any).type === 'HEADER' || (component as any).type === "BODY") && (
                    <div className="mt-3 p-2 bg-muted/30 rounded">
                      <p className="text-xs font-medium text-textMuted mb-1">{t('shipments.variableExamples')}</p>
                      {(component as any).type === 'HEADER' && (component as any).example.header_text && (component as any).example.header_text.length > 0 && (
                        <div className="space-y-1">
                          {(component as any).example.header_text.map((example: string, idx: number) => (
                            <div key={idx} className="text-xs text-textSecondary">
                              <code className="px-1 bg-white rounded">{`{{${idx + 1}}}`}</code> = {example}
                            </div>
                          ))}
                        </div>
                      )}
                      {(component as any).type === "BODY" && (component as any).example.body_text && (component as any).example.body_text[0] && (component as any).example.body_text[0].length > 0 && (
                        <div className="space-y-1">
                          {((component as any).example.body_text[0] as string[]).map((example: string, idx: number) => (
                          <div key={idx} className="text-xs text-textSecondary">
                            <code className="px-1 bg-white rounded">{`{{${idx + 1}}}`}</code> = {example}
                          </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {(component as any).buttons && (component as any).buttons.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {(component as any).buttons.map((button: any, btnIndex: number) => (
                        <div key={btnIndex} className="text-xs text-textMuted flex items-center space-x-2">
                          <span className="px-2 py-1 bg-muted rounded">
                            {button.type}
                          </span>
                          <span>{button.text}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="lg:sticky lg:top-6">
          <WhatsAppPreview components={template.components} />
        </div>
      </div>
    </div>
  );
};

export default TemplatePreview;
