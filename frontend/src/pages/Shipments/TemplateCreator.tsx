import React, { useState, useEffect } from 'react';
import { Trash2, Image, Video, FileText, ArrowLeft, MapPin, CheckCircle } from 'lucide-react';
import WhatsAppPreview from './WhatsAppPreview';
import VariableModal from './VariableModal';
import MediaUploader from './MediaUploader';
import { buildTemplateVariablesPayload, detectTemplateParameterFormat, formatTemplateForMetaAPI, formatTemplateForSend, validateTemplateForAPI } from '@/pages/Shipments/utils';
import { createWhatsAppTemplate } from '@/services/whatsappTemplates/createTemplateService';
import { useOrganization } from '../../hooks/useOrganization';
import { agentsService, type AgentData } from '../../services/agentsService';
import { useTranslation } from 'react-i18next';
import { ITemplate, ITemplateComponent, ITemplateButton   } from '@/interfaces/templates';
import {IBodyCreationalComponent} from '@/interfaces/whatsappTemplates/bodyComponentsInterface';
import { buildTemplateToCreate } from './utils';
interface TemplateCreatorProps {
  onSave: (template: ITemplate) => void;
  onCancel: () => void;
}

const TemplateCreator: React.FC<TemplateCreatorProps> = ({ onSave, onCancel }) => {
  const { t } = useTranslation();
  const getButtonTextMaxLength = (buttonType: ITemplateButton['type']) => {
    if (buttonType === 'COPY_CODE') return 15;
    if (buttonType === 'PHONE_NUMBER' || buttonType === 'QUICK_REPLY' || buttonType === 'URL') return 25;
    return undefined;
  };

  const [name, setName] = useState('');
  const [category, setCategory] = useState<'MARKETING' | 'UTILITY' | 'AUTHENTICATION'>('MARKETING');
  const [language, setLanguage] = useState('es');
  const [components, setComponents] = useState<ITemplateComponent[]>([
    { type: "BODY", text: '', example: { body_text: [[]] } } as IBodyCreationalComponent,
  ]);
  const [variableType, setVariableType] = useState<'position' | 'name'>('position');
  const [showVariableModal, setShowVariableModal] = useState(false);
  const [currentComponentIndex, setCurrentComponentIndex] = useState<number | null>(null);

  const [agents, setAgents] = useState<AgentData[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [loadingAgents, setLoadingAgents] = useState(false);

  const getFormatLabel = (format: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'LOCATION') => {
    if (format === 'TEXT') return t('shipments.text');
    if (format === 'IMAGE') return t('shipments.image');
    if (format === 'VIDEO') return t('shipments.video');
    if (format === 'DOCUMENT') return t('shipments.document');
    return t('shipments.location');
  };

  const { organizationId } = useOrganization();

  useEffect(() => {
    const loadAgents = async () => {
      setLoadingAgents(true);
      try {
        const response = await agentsService.getAgents();
        if (response.data && response.data.agents) {
          setAgents(response.data.agents);
          // Seleccionar el primer agente por defecto si hay agentes disponibles
          if (response.data.agents.length > 0) {
            setSelectedAgentId(response.data.agents[0].id || response.data.agents[0]._id);
          }
        }
      } catch (error) {
        console.error('Error cargando agentes:', error);
      } finally {
        setLoadingAgents(false);
      }
    };

    loadAgents();
  }, []);

  const sortComponents = (comps: ITemplateComponent[]): ITemplateComponent[] => {
    const order = { 'HEADER': 0, "BODY": 1, "FOOTER": 2, "BUTTONS": 3 };
    return [...comps].sort((a, b) => (order[a.type as keyof typeof order] || 0) - (order[b.type as keyof typeof order] || 0));
  };

  const addComponent = (type: ITemplateComponent['type']) => {
    let newComponent: ITemplateComponent;
    console.log('Agregando componente de tipo:', type);
    if (type === 'HEADER') {
      newComponent = {
        type: 'HEADER',
        text: '',
        format: 'TEXT',
        example: { header_text: [] },
      } as ITemplateComponent;
    } else if (type === "BODY") {
      newComponent = {
        type: "BODY",
        text: '',
        example: { body_text: [] },
      } as ITemplateComponent;
    } else if (type === "FOOTER") {
      newComponent = {
        type: "FOOTER",
        text: '',
      } as ITemplateComponent;
    } else if (type === "BUTTONS") {
      console.log('Creando nuevo componente de botones');
      newComponent = {
        type: "BUTTONS",
        buttons: [],
      } as ITemplateComponent;
      console.log('Nuevo componente de botones creado:', newComponent);
    } else {
      return;
    }
    
    const sortedComponents = sortComponents([...components, newComponent]);
    setComponents(sortedComponents);
  };

  const removeComponent = (index: number) => {
    const filtered = components.filter((_, i) => i !== index);
    setComponents(sortComponents(filtered));
  };

  const updateComponent = (index: number, updates: Partial<ITemplateComponent>) => {
    const newComponents = [...components];
    newComponents[index] = { ...newComponents[index], ...updates } as ITemplateComponent;
    setComponents(sortComponents(newComponents));
  };

  const addButton = (componentIndex: number) => {
    const newComponents = [...components];
    console.log('Agregando botón al componente de índice:', componentIndex);
    console.log('Componente antes de agregar botón:', newComponents[componentIndex]);
    const component = newComponents[componentIndex];
    console.log('Tipo de componente:', component.type);
    if (component.type === "BUTTONS") {
      component.buttons = component.buttons || [];
      component.buttons.push({ type: 'QUICK_REPLY', text: '' });
      setComponents(newComponents);
    }
    console.log('Componente después de agregar botón:', components);
  };

  const updateButton = (componentIndex: number, buttonIndex: number, updates: Partial<ITemplateButton>) => {
    const newComponents = [...components];
    const component = newComponents[componentIndex];
    if (component.type === "BUTTONS" && component.buttons) {
      component.buttons[buttonIndex] = { ...component.buttons[buttonIndex], ...updates } as ITemplateButton;
      setComponents(newComponents);
    }
  };

  const removeButton = (componentIndex: number, buttonIndex: number) => {
    const newComponents = [...components];
    const component = newComponents[componentIndex];
    if (component.type === "BUTTONS" && component.buttons) {
      component.buttons = component.buttons.filter((_, i) => i !== buttonIndex);
      setComponents(newComponents);
    }
  };

  const handleInsertVariable = (componentIndex: number) => {
    if (variableType === 'position') {
      insertVariable(componentIndex);
    } else {
      setCurrentComponentIndex(componentIndex);
      setShowVariableModal(true);
    }
  };

  const insertVariable = (componentIndex: number, varName?: string) => {
    const newComponents = [...components];
    const component = newComponents[componentIndex];
    
    if ((component as any).text !== undefined) {
      if (variableType === 'position') {
        // Variables por posición: {{1}}, {{2}}, etc.
        const currentVars = ((component as any).text.match(/\{\{\d+\}\}/g) || []).length;
        (component as any).text += `{{${currentVars + 1}}}`;
      } else {
        // Variables por nombre: {{nombre}}, {{apellido}}, etc.
        const varToInsert = varName || 'variable';
        (component as any).text += `{{${varToInsert}}}`;
      }
      setComponents(sortComponents(newComponents));
    }
  };

  const handleConfirmVariable = (varName: string) => {
    if (currentComponentIndex !== null) {
      insertVariable(currentComponentIndex, varName);
      setCurrentComponentIndex(null);
    }
  };

  const extractVariables = (text: string): string[] => {
    const matches = text.match(/\{\{([^}]+)\}\}/g);
    if (!matches) return [];
    return matches.map(m => m.replace(/[{}]/g, '').trim());
  };

  const updateVariableExample = (componentIndex: number, variableIndex: number, value: string) => {
    const newComponents = [...components];
    const component = newComponents[componentIndex];
    
    if (component.type === 'HEADER' && (component as any).example) {
      if (!(component as any).example.header_text) {
        (component as any).example.header_text = [];
      }
      (component as any).example.header_text[variableIndex] = value;
    } else if (component.type === "BODY" && (component as any).example) {
      if (!(component as any).example.body_text) {
        (component as any).example.body_text = [[]];
      }
      if (!(component as any).example.body_text[0]) {
        (component as any).example.body_text[0] = [];
      }
      (component as any).example.body_text[0][variableIndex] = value;
    }
    
    setComponents(newComponents);
  };

  const handleSave = async () => {
    const template: ITemplate = {
      name: name.trim(),
      category,
      language,
      status: 'PENDING',
      components: components.filter(c => {
        if (c.type === "BUTTONS") {
          return (c as any).buttons && (c as any).buttons.length > 0;
        }
        return (c as any).text && (c as any).text.trim();
      }),
      createdAt: new Date().toISOString(),
    };
    const validation = validateTemplateForAPI(template, t);
    if (!validation.valid) {
      const errorMessages = validation.errors.join('\n• ');
      alert(`${t('shipments.validationTemplateHasErrors')}\n\n• ${errorMessages}\n\n${t('shipments.validationPleaseFixBeforeSaving')}`);
      return;
    }
    try {
      if (!organizationId) {
        alert(t('shipments.errorOrganizationNotFound'));
        return;
      }
      if (!selectedAgentId) {
        alert(t('shipments.errorSelectAgentForTemplate'));
        return;
      }
      const parameterFormat = detectTemplateParameterFormat(template);
      const metaCreatePayload = formatTemplateForMetaAPI(template);
      const templateToCreate = buildTemplateToCreate(
        metaCreatePayload.name,
        metaCreatePayload.language,
        metaCreatePayload.components,
        metaCreatePayload.category,
        parameterFormat,
      );
      const templateToSend = formatTemplateForSend(template);
      const templateVariables = buildTemplateVariablesPayload(template);

      const payloadForWebhook = {
        organization_id: organizationId,
        agent_id: selectedAgentId,
        template_to_create: templateToCreate,
        template_to_send: templateToSend,
        variables: templateVariables,
      };
      console.log('Payload que se enviará al webhook:', payloadForWebhook);
      const webhookResponse = await createWhatsAppTemplate(payloadForWebhook);  

      if (webhookResponse.success) {
        alert(`${t('shipments.templateSentWebhookSuccess')}\n\n${t('shipments.templateCreatedProcessing')}`);
        onSave(template);
      } else {
        alert(`${t('shipments.errorSendingWebhook')}: ${webhookResponse.error}`);
        console.error('Error del webhook:', webhookResponse);
      }
    } catch (error) {
      console.error('Error al conectar con el webhook:', error);
      alert(t('shipments.errorConnectingServer'));
    }
  };

  const hasComponent = (type: string) => components.some(c => c.type === type);

  return (
    <>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Editor */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={onCancel}
            className="flex items-center space-x-2 text-textSecondary hover:text-textPrimary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('shipments.back')}</span>
          </button>
          <h2 className="text-xl font-bold text-textPrimary">{t('shipments.createTemplateTitle')}</h2>
        </div>

        {/* Información básica */}
        <div className="bg-surface rounded-xl border border-border p-6 space-y-4">
          <h3 className="font-semibold text-textPrimary mb-4">{t('shipments.basicInfo')}</h3>
          
          <div>
            <label className="block text-sm font-medium text-textPrimary mb-2">
              {t('shipments.templateNameLabel')}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('shipments.templateNamePlaceholder')}
              maxLength={512}
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50 bg-background text-textPrimary"
            />
            <p className="text-xs text-textMuted mt-1">{t('shipments.templateNameHint')}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-textPrimary mb-2">
                {t('shipments.categoryLabel')}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50 bg-background text-textPrimary"
              >
                <option value="MARKETING">{t('shipments.marketing')}</option>
                <option value="UTILITY">{t('shipments.utility')}</option>
                <option value="AUTHENTICATION">{t('shipments.authentication')}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-textPrimary mb-2">
                {t('shipments.languageLabel')}
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50 bg-background text-textPrimary"
              >
                <option value="es">{t('shipments.languageSpanish')}</option>
                <option value="en">{t('shipments.languageEnglish')}</option>
                <option value="pt">{t('shipments.languagePortuguese')}</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-textPrimary mb-2">
              {t('shipments.organizationAgentLabel')}
            </label>
            {loadingAgents ? (
              <div className="flex items-center space-x-2 px-4 py-2 border border-border rounded-lg bg-background text-textSecondary">
                <div className="animate-spin h-4 w-4 border-2 border-accent border-t-transparent rounded-full"></div>
                <span>{t('shipments.loadingAgents')}</span>
              </div>
            ) : agents.length > 0 ? (
              <select
                value={selectedAgentId}
                onChange={(e) => setSelectedAgentId(e.target.value)}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50 bg-background text-textPrimary"
              >
                {agents.map((agent) => (
                  <option key={agent.id || agent._id} value={agent.id || agent._id}>
                    {agent.name} ({agent.provider}) - {agent.provider_id}
                  </option>
                ))}
              </select>
            ) : (
              <div className="px-4 py-2 border border-border rounded-lg bg-muted/50 text-textSecondary">
                {t('shipments.noAgentsAvailable')}
              </div>
            )}
            <p className="text-xs text-textMuted mt-1">
              {t('shipments.organizationAgentHint')}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-textPrimary mb-2">
              {t('shipments.variableTypeLabel')}
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  value="position"
                  checked={variableType === 'position'}
                  onChange={(e) => setVariableType(e.target.value as any)}
                  className="text-accent focus:ring-accent"
                />
                <span className="text-sm text-textSecondary">{t('shipments.variableTypeByPosition')}</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  value="name"
                  checked={variableType === 'name'}
                  onChange={(e) => setVariableType(e.target.value as any)}
                  className="text-accent focus:ring-accent"
                />
                <span className="text-sm text-textSecondary">{t('shipments.variableTypeByName')}</span>
              </label>
            </div>
          </div>
        </div>

        {/* Componentes */}
        <div className="bg-surface rounded-xl border border-border p-6 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-textPrimary">{t('shipments.componentsLabel')}</h3>
            <div className="flex items-center space-x-2">
              {!hasComponent('HEADER') && (
                <button
                  onClick={() => addComponent('HEADER')}
                  className="text-xs px-3 py-1 bg-muted text-textSecondary rounded-lg hover:bg-muted/80 transition-colors"
                >
                  + {t('shipments.HEADER')}
                </button>
              )}
              {!hasComponent("FOOTER") && (
                <button
                  onClick={() => addComponent("FOOTER")}
                  className="text-xs px-3 py-1 bg-muted text-textSecondary rounded-lg hover:bg-muted/80 transition-colors"
                >
                  + {t('shipments.FOOTER')}
                </button>
              )}
              {!hasComponent("BUTTONS") && (
                <button
                  onClick={() => addComponent("BUTTONS")}
                  className="text-xs px-3 py-1 bg-muted text-textSecondary rounded-lg hover:bg-muted/80 transition-colors"
                >
                  + {t('shipments.buttons')}
                </button>
              )}
            </div>
          </div>
          {components.map((component, index) => (
            <div key={index} className="border border-border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-textPrimary">
                  {component.type === 'HEADER' && t('shipments.HEADER')}
                  {component.type === "BODY" && `${t('shipments.BODY')} *`}
                  {component.type === "FOOTER" && t('shipments.FOOTER')}
                  {component.type === "BUTTONS" && t('shipments.buttons')}
                </h4>
                {component.type !== "BODY" && (
                  <button
                    onClick={() => removeComponent(index)}
                    className="text-red-600 hover:text-red-700 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {component.type === 'HEADER' && (
                <div>
                  <label className="block text-xs font-medium text-textMuted mb-2">{t('shipments.formatLabel')}</label>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {(['TEXT', 'IMAGE', 'VIDEO', 'DOCUMENT', 'LOCATION'] as const).map((format) => (
                        <button
                        key={format}
                        onClick={() => updateComponent(index, { format })}
                        disabled={format !== 'TEXT'}
                        title={format !== 'TEXT' ? t('shipments.availableSoon') : ''}
                        className={`px-3 py-2 text-xs rounded-lg transition-colors flex items-center justify-center ${
                          component.format === format
                          ? 'bg-accent text-white'
                          : format !== 'TEXT'
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-50'
                          : 'bg-muted text-textSecondary hover:bg-muted/80'
                        }`}
                        >
                        {format === 'TEXT' && <FileText className="w-3 h-3 mr-1" />}
                        {format === 'IMAGE' && <Image className="w-3 h-3 mr-1" />}
                        {format === 'VIDEO' && <Video className="w-3 h-3 mr-1" />}
                        {format === 'DOCUMENT' && <FileText className="w-3 h-3 mr-1" />}
                        {format === 'LOCATION' && <MapPin className="w-3 h-3 mr-1" />}
                        <span>{getFormatLabel(format)}</span>
                        {format !== 'TEXT' && <span className="ml-1 text-xs">🔒 {t('shipments.availableSoon')}</span>}
                        </button>
                    ))}
                  </div>
                  {/* Media Uploader para IMAGE, VIDEO y DOCUMENT */}
                  {component.format && (component.format === 'IMAGE' || component.format === 'VIDEO' || component.format === 'DOCUMENT') && (
                    <div className="space-y-3">
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800">
                        <p className="mb-1">
                          <strong>
                            {component.format === 'IMAGE' && t('shipments.headerUploadImage')}
                            {component.format === 'VIDEO' && t('shipments.headerUploadVideo')}
                            {component.format === 'DOCUMENT' && t('shipments.headerUploadDocument')}
                          </strong>
                        </p>
                        <p>
                          {component.format === 'IMAGE' && t('shipments.headerUploadImageFormats')}
                          {component.format === 'VIDEO' && t('shipments.headerUploadVideoFormats')}
                          {component.format === 'DOCUMENT' && t('shipments.headerUploadDocumentFormats')}
                        </p>
                      </div>
                      
                      <MediaUploader
                        type={component.format}
                        onUploadComplete={(_mediaId, fileUrl, fileName) => {
                          updateComponent(index, {
                            example: {
                              header_text: [],
                              media_url: fileUrl,
                              file_name: fileName,
                            } as any,
                          });
                        }}
                        currentMediaId={(component as any).example?.media_url}
                        onRemove={() => {
                          updateComponent(index, {
                            example: {
                              header_text: [],
                            } as any,
                          });
                        }}
                      />
                    </div>
                  )}

                  {/* Info para LOCATION */}
                  {component.format === 'LOCATION' && (
                    <div className="p-3 bg-muted/50 rounded-lg border border-border text-xs text-textSecondary">
                      <p className="mb-1">
                        <strong>{t('shipments.locationInfoTitle')}</strong>
                      </p>
                      <p className="text-textMuted">
                        {t('shipments.locationInfoDescription')}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {(component.type === 'HEADER' && component.format === 'TEXT') || component.type === "BODY" || component.type === "FOOTER" ? (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-medium text-textMuted">{t('shipments.textLabel')}</label>
                    {(component.type === 'HEADER' || component.type === "BODY") && (
                      <button
                        onClick={() => handleInsertVariable(index)}
                        className="text-xs text-accent hover:text-highlight transition-colors"
                      >
                        + {t('shipments.addVariable')}
                      </button>
                    )}
                  </div>
                  <textarea
                    value={component.text || ''}
                    onChange={(e) => updateComponent(index, { text: e.target.value })}
                    maxLength={component.type === 'HEADER' ? 60 : component.type === "BODY" ? 1024 : component.type === "FOOTER" ? 60 : undefined}
                    placeholder={
                      component.type === 'HEADER' ? t('shipments.headerTextPlaceholder') :
                      component.type === "BODY" ? t('shipments.bodyTextPlaceholder') :
                      t('shipments.footerTextPlaceholder')
                    }
                    rows={component.type === "BODY" ? 4 : 2}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50 bg-background text-textPrimary text-sm"
                  />
                  <p className="text-xs text-textMuted mt-1">
                    {component.type === 'HEADER' && t('shipments.headerLimitHint')}
                    {component.type === "BODY" && t('shipments.bodyLimitHint')}
                    {component.type === "FOOTER" && t('shipments.footerLimitHint')}
                  </p>

                  {/* Ayuda de formato de WhatsApp */}
                  {component.type === "BODY" && (
                    <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-xs font-medium text-blue-800 mb-1">
                        {t('shipments.whatsappFormatsTitle')}
                      </p>
                      <div className="text-xs text-blue-700 space-y-0.5">
                        <div><code className="px-1 bg-white rounded">*texto*</code> {t('shipments.whatsappFormatBold')}</div>
                        <div><code className="px-1 bg-white rounded">_texto_</code> {t('shipments.whatsappFormatItalic')}</div>
                        <div><code className="px-1 bg-white rounded">~texto~</code> {t('shipments.whatsappFormatStrikethrough')}</div>
                        <div><code className="px-1 bg-white rounded">`texto`</code> {t('shipments.whatsappFormatMonospace')}</div>
                      </div>
                    </div>
                  )}

                  {/* Ejemplos de variables para Meta */}
                  {(component.type === 'HEADER' || component.type === "BODY") && component.text && (() => {
                    const variables = extractVariables(component.text || '');
                    if (variables.length === 0) return null;

                    return (
                      <div className="mt-3 p-3 bg-muted/50 rounded-lg border border-border">
                        <p className="text-xs font-medium text-textPrimary mb-2">
                          {t('shipments.metaExamplesTitle')}
                        </p>
                        <p className="text-xs text-textMuted mb-3">
                          {t('shipments.metaExamplesDescription')}
                        </p>
                        <div className="space-y-2">
                          {variables.map((variable, varIndex) => (
                            <div key={varIndex}>
                              <label className="block text-xs text-textSecondary mb-1">
                                {t('shipments.variableLabel')} <code className="px-1 py-0.5 bg-white rounded text-accent">{`{{${variable}}}`}</code>
                              </label>
                              <input
                                type="text"
                                value={
                                  component.type === 'HEADER'
                                    ? ((component as any).example?.header_text?.[varIndex] || '')
                                    : ((component as any).example?.body_text?.[0]?.[varIndex] || '')
                                }
                                onChange={(e) => updateVariableExample(index, varIndex, e.target.value)}
                                placeholder={t('shipments.variableExamplePlaceholder', {
                                  value: variable === '1' ? t('shipments.variableExampleValueOne') : variable === '2' ? t('shipments.variableExampleValueTwo') : variable,
                                })}
                                className="w-full px-2 py-1 text-xs border border-border rounded bg-white text-textPrimary focus:outline-none focus:ring-1 focus:ring-accent/50"
                              />
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-textMuted mt-2">
                          {t('shipments.metaExamplesFooter')}
                        </p>
                      </div>
                    );
                  })()}
                </div>
              ) : null}

              {component.type === "BUTTONS" && (
                <div className="space-y-3">
                  {component.buttons?.map((button, btnIndex) => (
                    <div key={btnIndex} className="border border-border rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <select
                          value={button.type}
                          onChange={(e) => updateButton(index, btnIndex, { type: e.target.value as any })}
                          className="text-xs px-2 py-1 border border-border rounded bg-background text-textPrimary"
                        >
                          <option value="QUICK_REPLY">⚡ {t('shipments.quickReply')}</option>
                          <option value="PHONE_NUMBER">📞 {t('shipments.callButton')}</option>
                          <option value="URL">🔗 {t('shipments.visitWebsiteButton')}</option>
                          <option value="COPY_CODE">📋 {t('shipments.copyCodeButton')}</option>
                        </select>
                        <button
                          onClick={() => removeButton(index, btnIndex)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                      <input
                        type="text"
                        value={button.text}
                        onChange={(e) => updateButton(index, btnIndex, { text: e.target.value })}
                        maxLength={getButtonTextMaxLength(button.type)}
                        placeholder={
                          button.type === 'QUICK_REPLY' ? t('shipments.buttonPlaceholderQuickReply') :
                          button.type === 'PHONE_NUMBER' ? t('shipments.buttonPlaceholderPhone') :
                          button.type === 'URL' ? t('shipments.buttonPlaceholderUrl') :
                          t('shipments.buttonPlaceholderCopyCode')
                        }
                        className="w-full px-3 py-1 text-sm border border-border rounded bg-background text-textPrimary focus:outline-none focus:ring-2 focus:ring-accent/50"
                      />
                      <p className="text-xs text-textMuted">
                        {button.type === 'COPY_CODE' && t('shipments.buttonCopyCodeLimitHint')}
                        {button.type === 'PHONE_NUMBER' && t('shipments.buttonPhoneLimitHint')}
                        {button.type === 'QUICK_REPLY' && t('shipments.buttonQuickReplyLimitHint')}
                        {button.type === 'URL' && t('shipments.buttonUrlLimitHint')}
                      </p>
                      {button.type === 'PHONE_NUMBER' && (
                        <input
                          type="text"
                          value={button.phone_number || ''}
                          onChange={(e) => updateButton(index, btnIndex, { phone_number: e.target.value })}
                          placeholder="+1234567890"
                          className="w-full px-3 py-1 text-sm border border-border rounded bg-background text-textPrimary focus:outline-none focus:ring-2 focus:ring-accent/50"
                        />
                      )}
                      {button.type === 'URL' && (
                        <input
                          type="text"
                          value={button.url || ''}
                          onChange={(e) => updateButton(index, btnIndex, { url: e.target.value })}
                          placeholder="https://example.com"
                          className="w-full px-3 py-1 text-sm border border-border rounded bg-background text-textPrimary focus:outline-none focus:ring-2 focus:ring-accent/50"
                        />
                      )}
                      {button.type === 'COPY_CODE' && (
                        <div className="p-2 bg-muted/50 rounded text-xs text-textSecondary">
                          {t('shipments.copyCodeHint')}
                        </div>
                      )}
                    </div>
                  ))}
                  {(!component.buttons || component.buttons.length < 3) && (
                    <button
                      onClick={() => addButton(index)}
                      className="w-full py-2 text-sm text-accent hover:text-highlight transition-colors border border-dashed border-accent/30 rounded-lg hover:border-accent/50"
                    >
                      + {t('shipments.addButtonLabel')}
                    </button>
                  )}
                  <div className="p-3 bg-muted/50 rounded-lg border border-border text-xs text-textSecondary">
                    <p><strong>{t('shipments.availableButtonTypesTitle')}</strong></p>
                    <ul className="mt-2 space-y-1 ml-4 list-disc">
                      <li><strong>{t('shipments.quickReply')}:</strong> {t('shipments.quickReplyDescription')}</li>
                      <li><strong>{t('shipments.callButton')}:</strong> {t('shipments.callButtonDescription')}</li>
                      <li><strong>{t('shipments.visitWebsiteButton')}:</strong> {t('shipments.visitWebsiteDescription')}</li>
                      <li><strong>{t('shipments.copyCodeButton')}:</strong> {t('shipments.copyCodeDescription')}</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Botones de acción */}
        <div className="space-y-3">
          {/* Botón de validación */}
          <button
            onClick={() => {
              const template: ITemplate = {
                name: name.trim(),
                category,
                language,
                status: 'PENDING',
                components: components.filter(c => {
                  if (c.type === "BUTTONS") {
                    return c.buttons && c.buttons.length > 0;
                  }
                  return (c as any).text && (c as any).text.trim();
                }),
                createdAt: new Date().toISOString(),
              };

              const validation = validateTemplateForAPI(template, t);
              
              if (validation.valid) {
                alert(`${t('shipments.templateValidTitle')}\n\n${t('shipments.templateValidMessage')}`);
              } else {
                const errorMessages = validation.errors.join('\n• ');
                alert(`${t('shipments.templateInvalidTitle')}\n\n• ${errorMessages}`);
              }
            }}
            className="w-full flex items-center justify-center space-x-2 px-6 py-2 border-2 border-blue-500 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium"
          >
            <CheckCircle className="w-4 h-4" />
            <span>{t('shipments.validateTemplateButton')}</span>
          </button>

          {/* Botones principales */}
          <div className="flex items-center space-x-4">
            <button
              onClick={handleSave}
              className="flex-1 bg-accent text-white px-6 py-3 rounded-lg hover:bg-highlight transition-colors shadow-sm font-medium"
            >
              {t('shipments.saveTemplateButton')}
            </button>
            <button
              onClick={onCancel}
              className="px-6 py-3 border border-border rounded-lg text-textSecondary hover:bg-muted transition-colors"
            >
              {t('shipments.cancel')}
            </button>
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="lg:sticky lg:top-6">
        <WhatsAppPreview components={components} />
      </div>
    </div>

    {/* Modal de Variables */}
    <VariableModal
      isOpen={showVariableModal}
      onClose={() => {
        setShowVariableModal(false);
        setCurrentComponentIndex(null);
      }}
      onConfirm={handleConfirmVariable}
    />
    </>
  );
};

export default TemplateCreator;
