import React, { useState, useEffect } from 'react';
import { Plus, Search, Eye, Trash2, FileText, RefreshCw, User } from 'lucide-react';
import TemplateCreator from './TemplateCreator';
import TemplatePreview from './TemplatePreview';
import { listApprovedTemplates } from '@/services/whatsappTemplates';
import { useOrganization } from '../../hooks/useOrganization';
import { agentsService, type AgentData } from '../../services/agentsService';
import { useTranslation } from '../../hooks/useTranslation';
import { ITemplate } from '@/interfaces/templates/templateInterface'
const TemplatesTab: React.FC = () => {
  const { t } = useTranslation();
  const [templates, setTemplates] = useState<ITemplate[]>([]);
  const [showCreator, setShowCreator] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ITemplate | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados para agentes
  const [agents, setAgents] = useState<AgentData[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');

  // Obtener organización del usuario autenticado
  const { organizationId } = useOrganization();

  const getAgentIdentifier = (agent: AgentData): string => agent.id || agent._id;

  // Cargar agentes al montar el componente
  useEffect(() => {
    const loadAgents = async () => {
      try {
        const response = await agentsService.getAgents();
        if (response.data && response.data.agents) {
          const loadedAgents = response.data.agents;
          setAgents(loadedAgents);
          setSelectedAgentId((previousSelectedAgentId) => {
            if (
              previousSelectedAgentId &&
              loadedAgents.some((agent) => getAgentIdentifier(agent) === previousSelectedAgentId)
            ) {
              return previousSelectedAgentId;
            }

            if (loadedAgents.length === 1) {
              return getAgentIdentifier(loadedAgents[0]);
            }

            return '';
          });
        }
      } catch (error) {
        console.error('Error cargando agentes:', error);
      }
    };

    loadAgents();
  }, []);

  // Función para obtener el nombre del agente por ID
  const getAgentName = (agentId: string | undefined): string => {
    if (!agentId) return 'Sin agente asignado';
    const agent = agents.find((a) => {
      const currentAgentId = getAgentIdentifier(a);
      return currentAgentId === agentId || a.provider_id === agentId;
    });
    return agent ? agent.name : `Agente ${agentId.substring(0, 8)}...`;
  };

  const getTemplateAgentName = (template: ITemplate): string => {
    if (template.agent_name) {
      return template.agent_name;
    }

    const templateAgentId = template.agent_id || (template as any).agent;
    if (templateAgentId) {
      return getAgentName(templateAgentId);
    }

    if (selectedAgentId) {
      return getAgentName(selectedAgentId);
    }

    return 'Sin agente asignado';
  };

  // Cargar plantillas al montar el componente y cuando se obtenga el organization ID
  useEffect(() => {
    if (organizationId) {
      loadTemplates();
    }
  }, [organizationId, selectedAgentId]);

  const loadTemplates = async (agentIdOverride?: string) => {
    // Solo cargar si tenemos organization ID
    if (!organizationId) {
      setError('No se pudo obtener la organización del usuario');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const agentIdToUse = agentIdOverride ?? selectedAgentId;
      const response = await listApprovedTemplates(organizationId, agentIdToUse || undefined);
      
      if (response.success && response.data) {
        setTemplates(response.data);
      } else {
        setError(response.error || 'Error al cargar plantillas');
      }
    } catch (err) {
      setError('Error de conexión al cargar plantillas');
      console.error('Error loading templates:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = (template: ITemplate) => {
    setTemplates([...templates, template]);
    setShowCreator(false);
    // Recargar plantillas después de crear una nueva
    loadTemplates();
  };

  const handleDeleteTemplate = async (name: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta plantilla?')) {
      // Aquí iría la lógica para eliminar de la base de datos
      // Por ahora solo removemos del estado local
      setTemplates(templates.filter(t => t.name !== name));
    }
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || template.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

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

  if (showCreator) {
    return (
      <TemplateCreator
        onSave={handleCreateTemplate}
        onCancel={() => setShowCreator(false)}
      />
    );
  }

  if (selectedTemplate) {
    return (
      <TemplatePreview
        template={selectedTemplate}
        onClose={() => setSelectedTemplate(null)}
        onEdit={() => {
          setShowCreator(true);
          setSelectedTemplate(null);
        }}
      />
    );
  }

  return (
    <div>
      {/* Controles */}
      <div className="bg-surface rounded-xl border border-border p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-textMuted" />
            <input
              type="text"
              placeholder={t('shipments.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50 bg-background text-textPrimary"
            />
          </div>
          <select
            value={selectedAgentId}
            onChange={(e) => setSelectedAgentId(e.target.value)}
            className="px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50 bg-background text-textPrimary"
          >
            <option value="">{t('shipments.allAgents')}</option>
            {agents.map((agent) => {
              const currentAgentId = getAgentIdentifier(agent);
              return (
                <option key={currentAgentId} value={currentAgentId}>
                  {agent.name}
                </option>
              );
            })}
          </select>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50 bg-background text-textPrimary"
          >
            <option value="all">{t('shipments.allCategories')}</option>
            <option value="MARKETING">{t('shipments.marketing')}</option>
            <option value="UTILITY">{t('shipments.utility')}</option>
            <option value="AUTHENTICATION">{t('shipments.authentication')}</option>
          </select>
          <button
            onClick={() => loadTemplates()}
            disabled={loading}
            className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors flex items-center space-x-2 shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>{t('shipments.refresh')}</span>
          </button>
          <button
            onClick={() => setShowCreator(true)}
            className="bg-accent text-white px-6 py-2 rounded-lg hover:bg-highlight transition-colors flex items-center space-x-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>{t('shipments.newTemplate')}</span>
          </button>
        </div>
        
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}
      </div>

      {/* Lista de plantillas */}
      {loading ? (
        <div className="text-center py-12 bg-surface rounded-xl border border-border">
          <RefreshCw className="w-8 h-8 text-textMuted mx-auto mb-4 animate-spin" />
          <p className="text-textMuted">{t('shipments.loadingTemplates')}</p>
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="text-center py-12 bg-surface rounded-xl border border-border">
          <FileText className="w-16 h-16 text-textMuted mx-auto mb-4" />
          <h3 className="text-lg font-medium text-textPrimary mb-2">
            {templates.length === 0 ? t('shipments.noTemplatesCreated') : t('shipments.noTemplatesFound')}
          </h3>
          <p className="text-textMuted mb-6">
            {templates.length === 0
              ? t('shipments.createFirstTemplate')
              : t('shipments.adjustFilters')}
          </p>
          {templates.length === 0 && (
            <button
              onClick={() => setShowCreator(true)}
              className="bg-accent text-white px-6 py-3 rounded-lg hover:bg-highlight transition-colors shadow-sm"
            >
              {t('shipments.createFirstTemplateButton')}
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <div
              key={template.name}
              className="bg-surface rounded-xl border border-border p-6 hover:shadow-lg transition-shadow group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-textPrimary mb-2">{template.name}</h3>
                  <div className="flex flex-wrap gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryBadgeColor(template.category)}`}>
                      {template.category}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor((template as any).status)}`}>
                      {(template as any).status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-textMuted">{t('shipments.language')}</span>
                  <span className="font-medium text-textPrimary">{template.language}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-textMuted">{t('shipments.components')}</span>
                  <span className="font-medium text-textPrimary">{template.components.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-textMuted">{t('shipments.variables')}</span>
                  <span className="font-medium text-textPrimary">{template.variable_count || 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-textMuted">{t('shipments.agent')}</span>
                  <div className="flex items-center space-x-1">
                    <User className="w-3 h-3 text-textMuted" />
                    <span className="font-medium text-textPrimary text-xs">
                      {getTemplateAgentName(template)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border">
                <span className="text-xs text-textMuted">
                  {template.createdAt ? new Date(template.createdAt).toLocaleDateString() : t('shipments.dateNotAvailable')}
                </span>
                <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setSelectedTemplate(template)}
                    className="p-2 rounded-lg bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
                    title={t('shipments.viewDetails')}
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteTemplate(template.name)}
                    className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                    title={t('shipments.delete')}
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
  );
};

export default TemplatesTab;
