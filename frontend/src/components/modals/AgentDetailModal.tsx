import React from 'react';
import { X, Bot, Calendar, Activity, Settings, ExternalLink } from 'lucide-react';

interface Agent {
    id: string;
    name: string;
    provider: string;
    model: string;
    provider_id: string;
    description: string;
    is_active: boolean;
    organization: string;
    outbound_message_limit: number;
    message_window_start: number;
    conversation_sent_counter: number;
    config: any;
    created_at: string;
    updated_at: string;
}

interface AgentDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    agent: Agent;
}

const AgentDetailModal: React.FC<AgentDetailModalProps> = ({ isOpen, onClose, agent }) => {
    if (!isOpen) return null;

    const getProviderIcon = (provider: string) => {
        const icons: Record<string, string> = {
            whatsapp: '📱',
            telegram: '✈️',
            email: '📧',
            instagram: '📷'
        };
        return icons[provider] || '🤖';
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('es-ES');
    };

    const getTimeWindowText = (seconds: number) => {
        const hours = seconds / 3600;
        if (hours === 1) return '1 hora';
        if (hours < 24) return `${hours} horas`;
        return `${hours / 24} días`;
    };

    const handleOpenWhatsApp = () => {
        if (agent.provider === 'whatsapp' && agent.provider_id) {
            const phoneNumber = agent.provider_id.replace(/[^\d]/g, '');
            const whatsappUrl = `https://wa.me/${phoneNumber}`;
            window.open(whatsappUrl, '_blank');
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                        <div className="bg-primary/10 p-2 rounded-lg">
                            <Bot className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-foreground">Detalles del Agente</h2>
                            <p className="text-sm text-muted-foreground">Información completa del agente</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-6">
                    {/* Información Básica */}
                    <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                                <span className="text-2xl">{getProviderIcon(agent.provider)}</span>
                                <div>
                                    <h3 className="text-lg font-semibold text-foreground">{agent.name}</h3>
                                    <p className="text-sm text-muted-foreground capitalize">
                                        {agent.provider} • {agent.model}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <div className={`w-3 h-3 rounded-full ${agent.is_active ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                <span className="text-sm font-medium">
                                    {agent.is_active ? 'Activo' : 'Inactivo'}
                                </span>
                            </div>
                        </div>

                        {agent.description && (
                            <p className="text-gray-700">{agent.description}</p>
                        )}
                    </div>

                    {/* Provider Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="border rounded-lg p-4">
                            <h4 className="font-medium text-foreground mb-2">Configuración del Proveedor</h4>
                            <div className="space-y-2">
                                <div>
                                    <p className="text-sm text-muted-foreground">Provider ID:</p>
                                    <div className="flex items-center space-x-2">
                                        <p className="font-mono text-sm">{agent.provider_id}</p>
                                        {agent.provider === 'whatsapp' && (
                                            <button
                                                onClick={handleOpenWhatsApp}
                                                className="p-1 bg-green-50 text-green-600 rounded hover:bg-green-100 transition-colors"
                                                title="Abrir en WhatsApp"
                                            >
                                                <ExternalLink className="w-3 h-3" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Plataforma:</p>
                                    <p className="text-sm font-medium capitalize">{agent.provider}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Modelo IA:</p>
                                    <p className="text-sm font-medium">{agent.model}</p>
                                </div>
                            </div>
                        </div>

                        <div className="border rounded-lg p-4">
                            <h4 className="font-medium text-foreground mb-2 flex items-center space-x-2">
                                <Activity className="w-4 h-4" />
                                <span>Estadísticas</span>
                            </h4>
                            <div className="space-y-2">
                                <div>
                                    <p className="text-sm text-muted-foreground">Mensajes enviados:</p>
                                    <p className="text-lg font-semibold text-primary">{agent.conversation_sent_counter}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Límite de mensajes:</p>
                                    <p className="text-sm">{agent.outbound_message_limit} por ventana</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Ventana de tiempo:</p>
                                    <p className="text-sm">{getTimeWindowText(agent.message_window_start)}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Configuración Técnica */}
                    {agent.config && Object.keys(agent.config).length > 0 && (
                        <div className="border rounded-lg p-4">
                            <h4 className="font-medium text-foreground mb-2 flex items-center space-x-2">
                                <Settings className="w-4 h-4" />
                                <span>Configuración Técnica</span>
                            </h4>
                            <div className="bg-gray-50 rounded p-3 font-mono text-sm max-h-32 overflow-y-auto">
                                <pre>{JSON.stringify(agent.config, null, 2)}</pre>
                            </div>
                        </div>
                    )}

                    {/* Fechas */}
                    <div className="border rounded-lg p-4">
                        <h4 className="font-medium text-foreground mb-2 flex items-center space-x-2">
                            <Calendar className="w-4 h-4" />
                            <span>Fechas</span>
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-muted-foreground">Creado:</p>
                                <p>{formatDate(agent.created_at)}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Actualizado:</p>
                                <p>{formatDate(agent.updated_at)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-4 border-t mt-6">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AgentDetailModal;