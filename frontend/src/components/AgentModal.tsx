import React, { useState, useEffect } from 'react';
import { X, Bot, Settings, Type, MessageSquare } from 'lucide-react';
import type { AgentData, AgentCreatePayload } from '../services/agentsService';

interface AgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: AgentCreatePayload) => Promise<void>;
  agent?: AgentData | null;
  mode: 'create' | 'edit';
}

const AgentModal: React.FC<AgentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  agent,
  mode
}) => {
  const [formData, setFormData] = useState<AgentCreatePayload>({
    name: '',
    description: '',
    provider: 'whatsapp',
    provider_id: '',
    model: {
      provider: 'ChatOpenAI',
      model: 'gpt-3.5-turbo',
      api_key: '',
      temperature: 0.5,
      top_p: 0.5,
    },
    settings: {
      agent_name: '',
      has_emojies: true,
      gender: 'Male',
      language: 'Spanish',
      energy: 'Extraverted',
      mind: 'Observant',
      nature: 'Thinking',
      tactics: 'Judging',
      identity: 'Assertive',
    },
    config: {
      _cls: 'WhatsAppConfig',
      api_key: '',
      phone_number: '',
      business_name: '',
      whatsapp_business_account_id: '',
      number_id: '',
    },
    is_active: true,
    outbound_message_limit: 10000,
    message_window_start: 86400,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when modal opens/closes or agent changes
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && agent) {
        setFormData({
          name: agent.name,
          description: agent.description,
          provider: agent.provider,
          provider_id: agent.provider_id,
          model: {
            provider: agent.model.provider,
            model: agent.model.model,
            api_key: '', // Don't show existing API key for security
            temperature: agent.model.temperature,
            top_p: agent.model.top_p,
          },
          settings: { ...agent.settings },
          config: {
            ...agent.config,
            api_key: '', // Don't show existing API key for security
          },
          is_active: agent.is_active,
          outbound_message_limit: agent.outbound_message_limit,
          message_window_start: agent.message_window_start,
        });
      } else {
        setFormData({
          name: '',
          description: '',
          provider: 'whatsapp',
          provider_id: '',
          model: {
            provider: 'ChatOpenAI',
            model: 'gpt-3.5-turbo',
            api_key: '',
            temperature: 0.5,
            top_p: 0.5,
          },
          settings: {
            agent_name: '',
            has_emojies: true,
            gender: 'Male',
            language: 'Spanish',
            energy: 'Extraverted',
            mind: 'Observant',
            nature: 'Thinking',
            tactics: 'Judging',
            identity: 'Assertive',
          },
          config: {
            _cls: 'WhatsAppConfig',
            api_key: '',
            phone_number: '',
            business_name: '',
            whatsapp_business_account_id: '',
            number_id: '',
          },
          is_active: true,
          outbound_message_limit: 10000,
          message_window_start: 86400,
        });
      }
      setErrors({});
    }
  }, [isOpen, mode, agent]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'La descripción es requerida';
    }

    if (!formData.settings.agent_name.trim()) {
      newErrors.agent_name = 'El nombre del agente es requerido';
    }

    if (!formData.model.api_key.trim() && mode === 'create') {
      newErrors.model_api_key = 'La API key del modelo es requerida';
    }

    if (!formData.config.api_key.trim() && mode === 'create') {
      newErrors.config_api_key = 'La API key de configuración es requerida';
    }

    if (formData.model.temperature < 0 || formData.model.temperature > 2) {
      newErrors.temperature = 'La temperatura debe estar entre 0 y 2';
    }

    if (formData.model.top_p < 0 || formData.model.top_p > 1) {
      newErrors.top_p = 'El top_p debe estar entre 0 y 1';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving agent:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormField = (path: string, value: any) => {
    setFormData(prev => {
      const newData = { ...prev };
      const keys = path.split('.');
      let current: any = newData;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newData;
    });

    // Clear error when user starts typing
    if (errors[path]) {
      setErrors(prev => ({ ...prev, [path]: '' }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="bg-accent/10 p-2 rounded-lg">
              <Bot className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-textPrimary">
                {mode === 'create' ? 'Crear Agente' : 'Editar Agente'}
              </h3>
              <p className="text-textMuted text-sm">
                {mode === 'create' 
                  ? 'Configure un nuevo agente de IA' 
                  : 'Modifique la configuración del agente'
                }
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-background rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-textMuted" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* Basic Information */}
          <div className="space-y-4">
            <h4 className="font-medium text-textPrimary flex items-center gap-2">
              <Type className="w-4 h-4" />
              Información Básica
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-textPrimary mb-2">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => updateFormField('name', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg bg-background text-textPrimary placeholder-textMuted focus:outline-none focus:ring-2 focus:ring-accent ${
                    errors.name ? 'border-red-500' : 'border-border'
                  }`}
                  placeholder="Luis Carlos Reyes Bot"
                />
                {errors.name && (
                  <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-textPrimary mb-2">
                  Nombre del Agente *
                </label>
                <input
                  type="text"
                  value={formData.settings.agent_name}
                  onChange={(e) => updateFormField('settings.agent_name', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg bg-background text-textPrimary placeholder-textMuted focus:outline-none focus:ring-2 focus:ring-accent ${
                    errors.agent_name ? 'border-red-500' : 'border-border'
                  }`}
                  placeholder="MrTaxesBot"
                />
                {errors.agent_name && (
                  <p className="text-red-500 text-xs mt-1">{errors.agent_name}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-textPrimary mb-2">
                Descripción *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => updateFormField('description', e.target.value)}
                rows={3}
                className={`w-full px-3 py-2 border rounded-lg bg-background text-textPrimary placeholder-textMuted focus:outline-none focus:ring-2 focus:ring-accent resize-none ${
                  errors.description ? 'border-red-500' : 'border-border'
                }`}
                placeholder="Describe el propósito y capacidades de este agente..."
              />
              {errors.description && (
                <p className="text-red-500 text-xs mt-1">{errors.description}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-textPrimary mb-2">
                  Proveedor
                </label>
                <select
                  value={formData.provider}
                  onChange={(e) => updateFormField('provider', e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-textPrimary focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="whatsapp">WhatsApp</option>
                  <option value="telegram">Telegram</option>
                  <option value="web">Web</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-textPrimary mb-2">
                  Estado
                </label>
                <select
                  value={formData.is_active?.toString()}
                  onChange={(e) => updateFormField('is_active', e.target.value === 'true')}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-textPrimary focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="true">Activo</option>
                  <option value="false">Inactivo</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-textPrimary mb-2">
                  Límite de Mensajes
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.outbound_message_limit}
                  onChange={(e) => updateFormField('outbound_message_limit', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-textPrimary focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>
          </div>

          {/* Model Configuration */}
          <div className="space-y-4">
            <h4 className="font-medium text-textPrimary flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Configuración del Modelo
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-textPrimary mb-2">
                  Modelo
                </label>
                <select
                  value={formData.model.model}
                  onChange={(e) => updateFormField('model.model', e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-textPrimary focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                  <option value="gpt-4">GPT-4</option>
                  <option value="gpt-4-turbo">GPT-4 Turbo</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-textPrimary mb-2">
                  API Key del Modelo {mode === 'create' ? '*' : '(opcional)'}
                </label>
                <input
                  type="password"
                  value={formData.model.api_key}
                  onChange={(e) => updateFormField('model.api_key', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg bg-background text-textPrimary placeholder-textMuted focus:outline-none focus:ring-2 focus:ring-accent ${
                    errors.model_api_key ? 'border-red-500' : 'border-border'
                  }`}
                  placeholder={mode === 'edit' ? 'Deja vacío para mantener la actual' : 'sk-...'}
                />
                {errors.model_api_key && (
                  <p className="text-red-500 text-xs mt-1">{errors.model_api_key}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-textPrimary mb-2">
                  Temperatura
                </label>
                <input
                  type="number"
                  min="0"
                  max="2"
                  step="0.1"
                  value={formData.model.temperature}
                  onChange={(e) => updateFormField('model.temperature', parseFloat(e.target.value))}
                  className={`w-full px-3 py-2 border rounded-lg bg-background text-textPrimary focus:outline-none focus:ring-2 focus:ring-accent ${
                    errors.temperature ? 'border-red-500' : 'border-border'
                  }`}
                />
                {errors.temperature && (
                  <p className="text-red-500 text-xs mt-1">{errors.temperature}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-textPrimary mb-2">
                  Top P
                </label>
                <input
                  type="number"
                  min="0"
                  max="1"
                  step="0.1"
                  value={formData.model.top_p}
                  onChange={(e) => updateFormField('model.top_p', parseFloat(e.target.value))}
                  className={`w-full px-3 py-2 border rounded-lg bg-background text-textPrimary focus:outline-none focus:ring-2 focus:ring-accent ${
                    errors.top_p ? 'border-red-500' : 'border-border'
                  }`}
                />
                {errors.top_p && (
                  <p className="text-red-500 text-xs mt-1">{errors.top_p}</p>
                )}
              </div>
            </div>
          </div>

          {/* Agent Settings */}
          <div className="space-y-4">
            <h4 className="font-medium text-textPrimary flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Configuración del Agente
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-textPrimary mb-2">
                  Género
                </label>
                <select
                  value={formData.settings.gender}
                  onChange={(e) => updateFormField('settings.gender', e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-textPrimary focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="Male">Masculino</option>
                  <option value="Female">Femenino</option>
                  <option value="Neutral">Neutral</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-textPrimary mb-2">
                  Idioma
                </label>
                <select
                  value={formData.settings.language}
                  onChange={(e) => updateFormField('settings.language', e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-textPrimary focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="Spanish">Español</option>
                  <option value="English">Inglés</option>
                  <option value="Portuguese">Portugués</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="has_emojies"
                checked={formData.settings.has_emojies}
                onChange={(e) => updateFormField('settings.has_emojies', e.target.checked)}
                className="w-4 h-4 text-accent border-border rounded focus:ring-accent"
              />
              <label htmlFor="has_emojies" className="text-sm font-medium text-textPrimary">
                Usar emojis en las respuestas
              </label>
            </div>
          </div>

          {/* Configuration */}
          {formData.provider === 'whatsapp' && (
            <div className="space-y-4">
              <h4 className="font-medium text-textPrimary">
                Configuración de WhatsApp
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-textPrimary mb-2">
                    API Key de WhatsApp {mode === 'create' ? '*' : '(opcional)'}
                  </label>
                  <input
                    type="password"
                    value={formData.config.api_key}
                    onChange={(e) => updateFormField('config.api_key', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg bg-background text-textPrimary placeholder-textMuted focus:outline-none focus:ring-2 focus:ring-accent ${
                      errors.config_api_key ? 'border-red-500' : 'border-border'
                    }`}
                    placeholder={mode === 'edit' ? 'Deja vacío para mantener la actual' : 'EAAS...'}
                  />
                  {errors.config_api_key && (
                    <p className="text-red-500 text-xs mt-1">{errors.config_api_key}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-textPrimary mb-2">
                    Número de Teléfono
                  </label>
                  <input
                    type="text"
                    value={formData.config.phone_number}
                    onChange={(e) => updateFormField('config.phone_number', e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-textPrimary placeholder-textMuted focus:outline-none focus:ring-2 focus:ring-accent"
                    placeholder="573224408090"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-textPrimary mb-2">
                    Nombre del Negocio
                  </label>
                  <input
                    type="text"
                    value={formData.config.business_name}
                    onChange={(e) => updateFormField('config.business_name', e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-textPrimary placeholder-textMuted focus:outline-none focus:ring-2 focus:ring-accent"
                    placeholder="Luis Carlos Reyes"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-textPrimary mb-2">
                    WhatsApp Business Account ID
                  </label>
                  <input
                    type="text"
                    value={formData.config.whatsapp_business_account_id}
                    onChange={(e) => updateFormField('config.whatsapp_business_account_id', e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-textPrimary placeholder-textMuted focus:outline-none focus:ring-2 focus:ring-accent"
                    placeholder="642527748605671"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-border rounded-lg text-textPrimary hover:bg-background transition-colors"
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Guardando...' : mode === 'create' ? 'Crear Agente' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AgentModal;