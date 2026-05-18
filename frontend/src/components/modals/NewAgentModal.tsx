import React, { useState } from 'react';
import { X, Bot, Save, ChevronLeft, ChevronRight } from 'lucide-react';
import AgentService from '../../services/agentService';
import { useAuthContext } from '../../contexts/AuthContext';

interface NewAgentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAgentCreated: () => void;
}

interface WhatsAppConfig {
    _cls: 'WhatsAppConfig';
    api_key: string;
    phone_number: string;
    business_name: string;
    whatsapp_business_account_id: string;
    number_id: string;
}

interface TelegramConfig {
    _cls: 'TelegramConfig';
    bot_token: string;
    chat_id?: string;
    webhook_url?: string;
}

interface EmailConfig {
    _cls: 'EmailConfig';
    smtp_server: string;
    smtp_port: number;
    smtp_username: string;
    smtp_password: string;
    use_tls?: boolean;
    use_ssl?: boolean;
}

interface InstagramConfig {
    _cls: 'InstagramConfig';
    access_token: string;
    app_id?: string;
    app_secret?: string;
    webhook_url?: string;
}

type ProviderConfig = WhatsAppConfig | TelegramConfig | EmailConfig | InstagramConfig;

interface NewAgentForm {
    name: string;
    provider: 'whatsapp' | 'telegram' | 'email' | 'instagram';
    model: 'gpt-3.5-turbo' | 'gpt-4' | 'claude-2' | 'gemini-1.5';
    provider_id: string;
    description: string;
    is_active: boolean;
    outbound_message_limit: number;
    message_window_start: number;
    organization: string;
    config: ProviderConfig;
}

const NewAgentModal: React.FC<NewAgentModalProps> = ({ isOpen, onClose, onAgentCreated }) => {
    const { user } = useAuthContext();
    const [step, setStep] = useState(1);
    
    const [form, setForm] = useState<NewAgentForm>({
        name: '',
        provider: 'whatsapp',
        model: 'gpt-3.5-turbo',
        provider_id: '',
        description: '',
        is_active: true,
        outbound_message_limit: 100,
        message_window_start: 3600,
        organization: user?.organization || '',
        config: {
            _cls: 'WhatsAppConfig',
            api_key: '',
            phone_number: '',
            business_name: '',
            whatsapp_business_account_id: '',
            number_id: ''
        } as WhatsAppConfig
    });
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const initializeConfig = (provider: string): ProviderConfig => {
        switch (provider) {
            case 'whatsapp':
                return {
                    _cls: 'WhatsAppConfig',
                    api_key: '',
                    phone_number: '',
                    business_name: '',
                    whatsapp_business_account_id: '',
                    number_id: ''
                } as WhatsAppConfig;
            case 'telegram':
                return {
                    _cls: 'TelegramConfig',
                    bot_token: '',
                    chat_id: '',
                    webhook_url: ''
                } as TelegramConfig;
            case 'email':
                return {
                    _cls: 'EmailConfig',
                    smtp_server: '',
                    smtp_port: 587,
                    smtp_username: '',
                    smtp_password: '',
                    use_tls: true,
                    use_ssl: false
                } as EmailConfig;
            case 'instagram':
                return {
                    _cls: 'InstagramConfig',
                    access_token: '',
                    app_id: '',
                    app_secret: '',
                    webhook_url: ''
                } as InstagramConfig;
            default:
                return {
                    _cls: 'WhatsAppConfig',
                    api_key: '',
                    phone_number: '',
                    business_name: '',
                    whatsapp_business_account_id: '',
                    number_id: ''
                } as WhatsAppConfig;
        }
    };

    const handleProviderChange = (provider: string) => {
        setForm(prev => ({
            ...prev,
            provider: provider as any,
            config: initializeConfig(provider)
        }));
    };

    const handleConfigChange = (key: string, value: string | number | boolean) => {
        setForm(prev => ({
            ...prev,
            config: {
                ...prev.config,
                [key]: value
            }
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (step === 1) {
            // Validar paso 1
            if (!form.name.trim()) {
                setError('El nombre del agente es requerido');
                return;
            }
            if (!form.provider_id.trim()) {
                setError('El ID del proveedor es requerido');
                return;
            }
            if (!form.organization) {
                setError('No se pudo obtener la organización del usuario');
                return;
            }
            // Ir al paso 2
            setError(null);
            setStep(2);
            return;
        }

        // Paso 2 - Validar configuración y crear agente
        if (step === 2) {
            // Validaciones específicas por proveedor
            if (form.provider === 'whatsapp') {
                const config = form.config as WhatsAppConfig;
                if (!config.api_key || !config.phone_number || !config.business_name || !config.whatsapp_business_account_id || !config.number_id) {
                    setError('Todos los campos de configuración de WhatsApp son requeridos');
                    return;
                }
            } else if (form.provider === 'telegram') {
                const config = form.config as TelegramConfig;
                if (!config.bot_token) {
                    setError('El token del bot de Telegram es requerido');
                    return;
                }
            } else if (form.provider === 'email') {
                const config = form.config as EmailConfig;
                if (!config.smtp_server || !config.smtp_username || !config.smtp_password) {
                    setError('Los campos básicos de configuración SMTP son requeridos');
                    return;
                }
            } else if (form.provider === 'instagram') {
                const config = form.config as InstagramConfig;
                if (!config.access_token) {
                    setError('El token de acceso de Instagram es requerido');
                    return;
                }
            }

            setLoading(true);
            setError(null);

            try {
                const agentData = {
                    ...form,
                    organization: form.organization
                };
                
                await AgentService.registerAgent(agentData);
                onAgentCreated();
                onClose();
                // Reset form
                setForm({
                    name: '',
                    provider: 'whatsapp',
                    model: 'gpt-3.5-turbo',
                    provider_id: '',
                    description: '',
                    is_active: true,
                    outbound_message_limit: 100,
                    message_window_start: 3600,
                    organization: user?.organization || '',
                    config: initializeConfig('whatsapp')
                });
                setStep(1);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Error al crear el agente');
            } finally {
                setLoading(false);
            }
        }
    };

    const handleClose = () => {
        if (!loading) {
            onClose();
            setError(null);
            setStep(1);
        }
    };

    const handleBack = () => {
        setError(null);
        setStep(1);
    };

    const getProviderPlaceholder = (provider: string) => {
        const placeholders = {
            whatsapp: '+1234567890',
            telegram: '@mi_bot',
            email: 'agente@empresa.com',
            instagram: '@mi_cuenta_instagram'
        };
        return placeholders[provider as keyof typeof placeholders] || 'ID del proveedor';
    };

    const getProviderLabel = (provider: 'whatsapp' | 'telegram' | 'email' | 'instagram') => {
        const labels = {
            whatsapp: 'Número de WhatsApp',
            telegram: 'Username de Telegram',
            email: 'Dirección de Email',
            instagram: 'Username de Instagram'
        };
        return labels[provider] || 'ID del Proveedor';
    };

    const renderStep1 = () => (
        <div className="space-y-6">
            {/* Información Básica */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nombre del Agente *
                    </label>
                    <input
                        type="text"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="Ej: Asistente de Ventas"
                        disabled={loading}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Plataforma *
                    </label>
                    <select
                        value={form.provider}
                        onChange={(e) => handleProviderChange(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        disabled={loading}
                    >
                        <option value="whatsapp">📱 WhatsApp</option>
                        <option value="telegram">✈️ Telegram</option>
                        <option value="email">📧 Email</option>
                        <option value="instagram">📷 Instagram</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        {getProviderLabel(form.provider)} *
                    </label>
                    <input
                        type="text"
                        value={form.provider_id}
                        onChange={(e) => setForm({ ...form, provider_id: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder={getProviderPlaceholder(form.provider)}
                        disabled={loading}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Modelo de IA *
                    </label>
                    <select
                        value={form.model}
                        onChange={(e) => setForm({ ...form, model: e.target.value as any })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        disabled={loading}
                    >
                        <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                        <option value="gpt-4">GPT-4</option>
                        <option value="claude-2">Claude-2</option>
                        <option value="gemini-1.5">Gemini 1.5</option>
                    </select>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción
                </label>
                <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Describe la función de este agente..."
                    rows={3}
                    disabled={loading}
                />
            </div>

            {/* Configuración de Límites */}
            <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Configuración de Límites</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Límite de Mensajes Salientes
                        </label>
                        <input
                            type="number"
                            min="1"
                            max="10000"
                            value={form.outbound_message_limit}
                            onChange={(e) => setForm({ ...form, outbound_message_limit: parseInt(e.target.value) || 100 })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            disabled={loading}
                        />
                        <p className="text-xs text-gray-500 mt-1">Número máximo de mensajes por ventana de tiempo</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Ventana de Tiempo (segundos)
                        </label>
                        <select
                            value={form.message_window_start}
                            onChange={(e) => setForm({ ...form, message_window_start: parseInt(e.target.value) })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            disabled={loading}
                        >
                            <option value={3600}>1 Hora (3600s)</option>
                            <option value={7200}>2 Horas (7200s)</option>
                            <option value={21600}>6 Horas (21600s)</option>
                            <option value={43200}>12 Horas (43200s)</option>
                            <option value={86400}>24 Horas (86400s)</option>
                        </select>
                        <p className="text-xs text-gray-500 mt-1">Período de tiempo para el límite de mensajes</p>
                    </div>
                </div>
            </div>

            {/* Estado del Agente */}
            <div className="border-t pt-6">
                <div className="flex items-center">
                    <input
                        type="checkbox"
                        id="is_active"
                        checked={form.is_active}
                        onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                        className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary focus:ring-2"
                        disabled={loading}
                    />
                    <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
                        Activar agente inmediatamente
                    </label>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                    Los agentes inactivos no procesarán mensajes entrantes
                </p>
            </div>
        </div>
    );

    const renderStep2WhatsApp = () => {
        const config = form.config as WhatsAppConfig;
        return (
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        API Key *
                    </label>
                    <input
                        type="password"
                        value={config.api_key}
                        onChange={(e) => handleConfigChange('api_key', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="Tu API key de WhatsApp Business"
                    />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Número de Teléfono *
                        </label>
                        <input
                            type="text"
                            value={config.phone_number}
                            onChange={(e) => handleConfigChange('phone_number', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="573046770184"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nombre del Negocio *
                        </label>
                        <input
                            type="text"
                            value={config.business_name}
                            onChange={(e) => handleConfigChange('business_name', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="Mi Negocio"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            WhatsApp Business Account ID *
                        </label>
                        <input
                            type="text"
                            value={config.whatsapp_business_account_id}
                            onChange={(e) => handleConfigChange('whatsapp_business_account_id', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="690324733869742"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Number ID *
                        </label>
                        <input
                            type="text"
                            value={config.number_id}
                            onChange={(e) => handleConfigChange('number_id', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="749230141597204"
                        />
                    </div>
                </div>
            </div>
        );
    };

    const renderStep2Telegram = () => {
        const config = form.config as TelegramConfig;
        return (
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bot Token *
                    </label>
                    <input
                        type="password"
                        value={config.bot_token}
                        onChange={(e) => handleConfigChange('bot_token', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="Token del bot de Telegram"
                    />
                    <p className="text-xs text-gray-500 mt-1">Obtén este token de @BotFather en Telegram</p>
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Chat ID
                    </label>
                    <input
                        type="text"
                        value={config.chat_id || ''}
                        onChange={(e) => handleConfigChange('chat_id', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="ID del chat (opcional)"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Webhook URL
                    </label>
                    <input
                        type="url"
                        value={config.webhook_url || ''}
                        onChange={(e) => handleConfigChange('webhook_url', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="https://tu-webhook.com/telegram"
                    />
                </div>
            </div>
        );
    };

    const renderStep2Email = () => {
        const config = form.config as EmailConfig;
        return (
            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Servidor SMTP *
                        </label>
                        <input
                            type="text"
                            value={config.smtp_server}
                            onChange={(e) => handleConfigChange('smtp_server', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="smtp.gmail.com"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Puerto SMTP *
                        </label>
                        <input
                            type="number"
                            value={config.smtp_port}
                            onChange={(e) => handleConfigChange('smtp_port', parseInt(e.target.value) || 587)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="587"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Usuario SMTP *
                        </label>
                        <input
                            type="email"
                            value={config.smtp_username}
                            onChange={(e) => handleConfigChange('smtp_username', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="tu-email@gmail.com"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Contraseña SMTP *
                        </label>
                        <input
                            type="password"
                            value={config.smtp_password}
                            onChange={(e) => handleConfigChange('smtp_password', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="Contraseña o App Password"
                        />
                    </div>
                </div>

                <div className="flex space-x-4">
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="use_tls"
                            checked={config.use_tls || false}
                            onChange={(e) => handleConfigChange('use_tls', e.target.checked)}
                            className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary focus:ring-2"
                        />
                        <label htmlFor="use_tls" className="ml-2 text-sm text-gray-700">
                            Usar TLS
                        </label>
                    </div>
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="use_ssl"
                            checked={config.use_ssl || false}
                            onChange={(e) => handleConfigChange('use_ssl', e.target.checked)}
                            className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary focus:ring-2"
                        />
                        <label htmlFor="use_ssl" className="ml-2 text-sm text-gray-700">
                            Usar SSL
                        </label>
                    </div>
                </div>
            </div>
        );
    };

    const renderStep2Instagram = () => {
        const config = form.config as InstagramConfig;
        return (
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Access Token *
                    </label>
                    <input
                        type="password"
                        value={config.access_token}
                        onChange={(e) => handleConfigChange('access_token', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="Token de acceso de Instagram"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            App ID
                        </label>
                        <input
                            type="text"
                            value={config.app_id || ''}
                            onChange={(e) => handleConfigChange('app_id', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="ID de la aplicación"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            App Secret
                        </label>
                        <input
                            type="password"
                            value={config.app_secret || ''}
                            onChange={(e) => handleConfigChange('app_secret', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="Secret de la aplicación"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Webhook URL
                    </label>
                    <input
                        type="url"
                        value={config.webhook_url || ''}
                        onChange={(e) => handleConfigChange('webhook_url', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="https://tu-webhook.com/instagram"
                    />
                </div>
            </div>
        );
    };

    const renderStep2 = () => {
        const configComponents = {
            whatsapp: renderStep2WhatsApp,
            telegram: renderStep2Telegram,
            email: renderStep2Email,
            instagram: renderStep2Instagram
        };

        return (
            <div className="space-y-6">
                <div className="text-center mb-6">
                    <h3 className="text-lg font-medium text-gray-900">
                        Configuración de {form.provider.charAt(0).toUpperCase() + form.provider.slice(1)}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                        Configura los parámetros específicos para la plataforma seleccionada
                    </p>
                </div>
                {configComponents[form.provider]()}
            </div>
        );
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                        <div className="bg-primary/10 p-2 rounded-lg">
                            <Bot className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-foreground">Nuevo Agente</h2>
                            <div className="flex items-center space-x-2 mt-1">
                                <div className={`w-2 h-2 rounded-full ${step >= 1 ? 'bg-primary' : 'bg-gray-300'}`}></div>
                                <div className={`w-2 h-2 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-gray-300'}`}></div>
                                <span className="text-sm text-gray-500 ml-2">
                                    Paso {step} de 2
                                </span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        disabled={loading}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
                            <p className="text-red-600 text-sm">{error}</p>
                        </div>
                    )}

                    {step === 1 ? renderStep1() : renderStep2()}

                    <div className="flex space-x-3 pt-6 border-t mt-6">
                        {step === 2 && (
                            <button
                                type="button"
                                onClick={handleBack}
                                disabled={loading}
                                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                <span>Anterior</span>
                            </button>
                        )}
                        
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={loading}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                        >
                            Cancelar
                        </button>

                        <button
                            type="submit"
                            disabled={loading || (step === 1 && (!form.name.trim() || !form.provider_id.trim()))}
                            className="flex-1 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                        >
                            {loading ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            ) : step === 1 ? (
                                <>
                                    <span>Siguiente</span>
                                    <ChevronRight className="w-4 h-4" />
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    <span>Crear Agente</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default NewAgentModal;