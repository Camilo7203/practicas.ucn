import React, { useState } from 'react';
import { X, Bot, Save } from 'lucide-react';
import AgentService from '../../services/agentService';

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

interface EditAgentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAgentUpdated: () => void;
    agent: Agent;
}

const EditAgentModal: React.FC<EditAgentModalProps> = ({ isOpen, onClose, onAgentUpdated, agent }) => {
    const [form, setForm] = useState({
        name: agent.name,
        provider_id: agent.provider_id,
        description: agent.description,
        is_active: agent.is_active,
        outbound_message_limit: agent.outbound_message_limit,
        message_window_start: agent.message_window_start,
        model: agent.model
    });
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!form.name.trim()) {
            setError('El nombre del agente es requerido');
            return;
        }

        if (!form.provider_id.trim()) {
            setError('El ID del proveedor es requerido');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await AgentService.updateAgent(agent.id, form);
            onAgentUpdated();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al actualizar el agente');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (!loading) {
            onClose();
            setError(null);
        }
    };

    const getProviderLabel = (provider: string) => {
        const labels: Record<string, string> = {
            whatsapp: 'Número de WhatsApp',
            telegram: 'Username de Telegram',
            email: 'Dirección de Email',
            instagram: 'Username de Instagram'
        };
        return labels[provider] || 'ID del Proveedor';
    };

    const getProviderPlaceholder = (provider: string) => {
        const placeholders: Record<string, string> = {
            whatsapp: '+1234567890',
            telegram: '@mi_bot',
            email: 'agente@empresa.com',
            instagram: '@mi_cuenta_instagram'
        };
        return placeholders[provider] || 'ID del proveedor';
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                        <div className="bg-primary/10 p-2 rounded-lg">
                            <Bot className="w-5 h-5 text-primary" />
                        </div>
                        <h2 className="text-xl font-semibold text-foreground">Editar Agente</h2>
                    </div>
                    <button
                        onClick={handleClose}
                        disabled={loading}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <p className="text-red-600 text-sm">{error}</p>
                        </div>
                    )}

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
                                Modelo de IA *
                            </label>
                            <select
                                value={form.model}
                                onChange={(e) => setForm({ ...form, model: e.target.value })}
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
                            {getProviderLabel(agent.provider)} *
                        </label>
                        <input
                            type="text"
                            value={form.provider_id}
                            onChange={(e) => setForm({ ...form, provider_id: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder={getProviderPlaceholder(agent.provider)}
                            disabled={loading}
                        />
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
                                Agente activo
                            </label>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            Los agentes inactivos no procesarán mensajes entrantes
                        </p>
                    </div>

                    <div className="flex space-x-3 pt-4">
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
                            disabled={loading || !form.name.trim() || !form.provider_id.trim()}
                            className="flex-1 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                        >
                            {loading ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    <span>Guardar Cambios</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditAgentModal;