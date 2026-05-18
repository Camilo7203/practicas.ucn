import React, { useState } from 'react';
import { X, Bot, MessageSquare, Settings } from 'lucide-react';

export interface AgentConfigData {
  name: string;
  provider: 'whatsapp' | 'telegram' | 'email' | 'instagram';
  model: 'gpt-3.5-turbo' | 'gpt-4' | 'claude-2' | 'gemini-1.5';
  provider_id: string;
  description: string;
  is_active: boolean;
  outbound_message_limit: number;
  message_window_start: number;
  config: Record<string, any>;
}

interface AgentConfigModalProps {
  onClose: () => void;
  onSubmit: (data: AgentConfigData) => void;
  initialData?: Partial<AgentConfigData>;
}

const AgentConfigModal: React.FC<AgentConfigModalProps> = ({ 
  onClose, 
  onSubmit, 
  initialData 
}) => {
  const [form, setForm] = useState<AgentConfigData>({
    name: initialData?.name || '',
    provider: initialData?.provider || 'whatsapp',
    model: initialData?.model || 'gpt-3.5-turbo',
    provider_id: initialData?.provider_id || '',
    description: initialData?.description || '',
    is_active: initialData?.is_active !== undefined ? initialData.is_active : true,
    outbound_message_limit: initialData?.outbound_message_limit || 100,
    message_window_start: initialData?.message_window_start || 3600,
    config: initialData?.config || {},
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const target = e.target as HTMLInputElement;
      setForm(prev => ({
        ...prev,
        [name]: target.checked
      }));
    } else {
      setForm(prev => ({
        ...prev,
        [name]: type === 'number' ? Number(value) : value
      }));
    }
  };

  const handleConfigChange = (key: string, value: string) => {
    setForm(prev => ({
      ...prev,
      config: {
        ...prev.config,
        [key]: value
      }
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'whatsapp': return '💬';
      case 'telegram': return '✈️';
      case 'email': return '📧';
      case 'instagram': return '📸';
      default: return '🤖';
    }
  };

  const getProviderIdPlaceholder = (provider: string) => {
    switch (provider) {
      case 'whatsapp': return '+1234567890';
      case 'telegram': return '@botusername';
      case 'email': return 'bot@example.com';
      case 'instagram': return '@instagram_handle';
      default: return 'Provider ID';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white border border-gray-200 rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <Bot className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-foreground">AI Agent Configuration</h3>
              <p className="text-muted-foreground text-sm">Configure your AI agent for cross-platform interactions</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-foreground text-sm font-medium mb-2">
                Agent Name
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                placeholder="My AI Assistant"
                required
              />
            </div>

            <div>
              <label className="block text-foreground text-sm font-medium mb-2">
                Provider Platform
              </label>
              <select
                name="provider"
                value={form.provider}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                required
              >
                <option value="whatsapp">WhatsApp {getProviderIcon('whatsapp')}</option>
                <option value="telegram">Telegram {getProviderIcon('telegram')}</option>
                <option value="email">Email {getProviderIcon('email')}</option>
                <option value="instagram">Instagram {getProviderIcon('instagram')}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-foreground text-sm font-medium mb-2">
                AI Model
              </label>
              <select
                name="model"
                value={form.model}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                required
              >
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                <option value="gpt-4">GPT-4</option>
                <option value="claude-2">Claude 2</option>
                <option value="gemini-1.5">Gemini 1.5</option>
              </select>
            </div>

            <div>
              <label className="block text-foreground text-sm font-medium mb-2">
                Provider ID
              </label>
              <input
                type="text"
                name="provider_id"
                value={form.provider_id}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                placeholder={getProviderIdPlaceholder(form.provider)}
                required
              />
              <p className="text-muted-foreground text-xs mt-1">
                {form.provider === 'whatsapp' && 'Phone number with country code'}
                {form.provider === 'telegram' && 'Bot username or token'}
                {form.provider === 'email' && 'Email address for the bot'}
                {form.provider === 'instagram' && 'Instagram account handle'}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-foreground text-sm font-medium mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/50 min-h-[80px] resize-none"
              placeholder="Describe what this agent does and how it behaves..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-foreground text-sm font-medium mb-2">
                Message Limit
              </label>
              <input
                type="number"
                name="outbound_message_limit"
                value={form.outbound_message_limit}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                min={1}
                required
              />
              <p className="text-muted-foreground text-xs mt-1">
                Maximum outbound messages per time window
              </p>
            </div>

            <div>
              <label className="block text-foreground text-sm font-medium mb-2">
                Time Window (seconds)
              </label>
              <input
                type="number"
                name="message_window_start"
                value={form.message_window_start}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                min={1}
                required
              />
              <p className="text-muted-foreground text-xs mt-1">
                Time window for message rate limiting (3600 = 1 hour)
              </p>
            </div>
          </div>

          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="is_active"
                checked={form.is_active}
                onChange={handleChange}
                className="w-4 h-4 text-purple-500 border-border rounded focus:ring-purple-500/50"
              />
              <span className="text-foreground text-sm">Agent is active</span>
            </label>
            <p className="text-muted-foreground text-xs mt-1 ml-6">
              Inactive agents won't respond to messages or triggers
            </p>
          </div>

          {/* Advanced Configuration */}
          <div className="border-t pt-6">
            <div className="flex items-center space-x-2 mb-4">
              <Settings className="w-4 h-4 text-purple-500" />
              <h4 className="text-foreground font-medium">Advanced Configuration</h4>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-foreground text-sm font-medium mb-2">
                  System Prompt
                </label>
                <textarea
                  value={form.config.systemPrompt || ''}
                  onChange={(e) => handleConfigChange('systemPrompt', e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/50 min-h-[80px] resize-none"
                  placeholder="You are a helpful assistant..."
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-foreground text-sm font-medium mb-2">
                  Temperature (0-1)
                </label>
                <input
                  type="number"
                  value={form.config.temperature || 0.7}
                  onChange={(e) => handleConfigChange('temperature', e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  min={0}
                  max={1}
                  step={0.1}
                />
                <p className="text-muted-foreground text-xs mt-1">
                  Higher values make responses more creative
                </p>
              </div>
            </div>
          </div>

          {/* Agent Preview */}
          <div className="border border-border rounded-lg p-4 bg-purple-50/50">
            <div className="flex items-center space-x-2 mb-2">
              <MessageSquare className="w-4 h-4 text-purple-500" />
              <span className="text-foreground font-medium text-sm">Agent Preview</span>
            </div>
            <div className="text-foreground">
              <div className="font-medium">
                {form.name || 'Unnamed Agent'} {getProviderIcon(form.provider)}
              </div>
              <div className="text-sm text-muted-foreground">
                {form.description || 'No description provided'}
              </div>
              <div className="text-xs text-purple-600 mt-2">
                Platform: {form.provider} • Model: {form.model} • 
                {form.is_active ? ' Active' : ' Inactive'}
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-background border border-border text-foreground rounded-lg hover:bg-muted transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors duration-200"
            >
              Save Agent
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AgentConfigModal;
