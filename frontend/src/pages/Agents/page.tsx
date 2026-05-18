import React, { useState, useEffect } from 'react';
import { 
  Bot,  
  Search, 
  Trash2, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Settings,
  Users
} from 'lucide-react';
import { AgentService } from '../../services/agentService';

interface Agent {
  id: string;
  name: string;
  description?: string;
  provider?: string;
  provider_id?: string;
  is_active: boolean;
  organization?: string;
  outbound_message_limit?: number;
  message_window_start?: number;
  conversation_sent_counter?: number;
  created_at?: string;
  updated_at?: string;
  model?: {
    provider?: string;
    model?: string;
    temperature?: number;
    top_p?: number;
  };
  settings?: {
    agent_name?: string;
    has_emojies?: boolean;
    gender?: string;
    language?: string;
    energy?: string;
    mind?: string;
    nature?: string;
    tactics?: string;
    identity?: string;
  };
}

const AgentsPage: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const agentService = new AgentService();

  // Cargar agentes
  const fetchAgents = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await agentService.getAgents();
      const agentsList = (response.data as any).agents || [];
      setAgents(agentsList);
    } catch (error) {
      console.error('Error fetching agents:', error);
      setError('Error al cargar los agentes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  // Filtrar agentes por término de búsqueda
  const filteredAgents = agents.filter(agent =>
    agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (agent.description && agent.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (agent.provider && agent.provider.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Componente para mostrar el estado del agente
  const AgentStatus: React.FC<{ isActive: boolean }> = ({ isActive }) => {
    if (isActive) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Activo
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
        <XCircle className="w-3 h-3 mr-1" />
        Inactivo
      </span>
    );
  };

  // Manejar eliminación de agente
  const handleDeleteAgent = async () => {
    if (!selectedAgent) return;
    
    try {
      await agentService.deleteAgent(selectedAgent.id);
      await fetchAgents();
      setShowDeleteModal(false);
      setSelectedAgent(null);
    } catch (error) {
      console.error('Error deleting agent:', error);
      setError('Error al eliminar el agente');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-surface border-b border-border">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-accent/10 p-3 rounded-xl">
                <Bot className="w-6 h-6 text-accent" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-textPrimary">Agentes de IA</h1>
                <p className="text-textMuted">Gestiona los agentes conversacionales de tu organización</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={fetchAgents} 
                disabled={loading} 
                className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-muted/30 disabled:opacity-50 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Actualizar
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-surface rounded-xl p-6 border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-textMuted text-sm">Total Agentes</p>
                <p className="text-2xl font-bold text-textPrimary">{agents.length}</p>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <Bot className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-surface rounded-xl p-6 border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-textMuted text-sm">Agentes Activos</p>
                <p className="text-2xl font-bold text-textPrimary">
                  {agents.filter(agent => agent.is_active).length}
                </p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-surface rounded-xl p-6 border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-textMuted text-sm">Agentes Inactivos</p>
                <p className="text-2xl font-bold text-textPrimary">
                  {agents.filter(agent => !agent.is_active).length}
                </p>
              </div>
              <div className="bg-red-50 p-3 rounded-lg">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </div>
          <div className="bg-surface rounded-xl p-6 border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-textMuted text-sm">Conversaciones Total</p>
                <p className="text-2xl font-bold text-textPrimary">
                  {agents.reduce((sum, agent) => sum + (agent.conversation_sent_counter || 0), 0)}
                </p>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Barra de búsqueda */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-textMuted w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar agentes por nombre, descripción o proveedor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-border rounded-lg bg-background text-textPrimary focus:ring-2 focus:ring-accent focus:border-accent transition-all"
            />
          </div>
        </div>

        {/* Lista de agentes */}
        <div className="bg-surface rounded-xl border border-border overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center p-12">
              <RefreshCw className="w-6 h-6 animate-spin text-textMuted" />
              <span className="ml-2 text-textMuted">Cargando agentes...</span>
            </div>
          ) : filteredAgents.length === 0 ? (
            <div className="text-center p-12">
              <Bot className="w-16 h-16 text-muted mx-auto mb-4" />
              <h3 className="text-lg font-medium text-textPrimary mb-2">
                {searchTerm ? 'No se encontraron agentes' : 'No hay agentes'}
              </h3>
              <p className="text-textMuted mb-4">
                {searchTerm 
                  ? 'Intenta con otros términos de búsqueda' 
                  : 'No hay agentes configurados en tu organización'
                }
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredAgents.map((agent) => (
                <div key={agent.id} className="p-6 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="bg-accent/10 p-2 rounded-lg">
                        <Bot className="w-5 h-5 text-accent" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-medium text-textPrimary">{agent.name}</h3>
                          <AgentStatus isActive={agent.is_active} />
                        </div>
                        {agent.description && (
                          <p className="text-textMuted text-sm mb-2">{agent.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-textMuted">
                          <span className="flex items-center gap-1">
                            <Settings className="w-3 h-3" />
                            {agent.provider || 'Sin proveedor'}
                          </span>
                          {agent.model?.model && (
                            <span className="flex items-center gap-1">
                              <Bot className="w-3 h-3" />
                              {agent.model.model}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {agent.conversation_sent_counter || 0} conversaciones
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedAgent(agent);
                          setShowDeleteModal(true);
                        }}
                        className="p-2 text-textMuted hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar agente"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal de confirmación de eliminación */}
      {showDeleteModal && selectedAgent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface rounded-xl p-6 max-w-md w-full mx-4 border border-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-red-50 p-2 rounded-lg">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-textPrimary">Eliminar Agente</h3>
            </div>
            <p className="text-textMuted mb-6">
              ¿Estás seguro de que quieres eliminar el agente <strong>{selectedAgent.name}</strong>? 
              Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedAgent(null);
                }}
                className="px-4 py-2 border border-border rounded-lg hover:bg-muted/30 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteAgent}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentsPage;