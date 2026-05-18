import React, { useState, useEffect } from 'react';
import {  Edit3, Trash2, Plus, Search, Calendar, User, Target, Settings, Users, MoreVertical, Activity } from 'lucide-react';
import { useLoops } from '../../hooks/useLoops';
import { useNavigation } from '../../contexts/NavigationContext';
import { useTranslation } from '../../hooks/useTranslation';

const Campaigns: React.FC = () => {
  const { t } = useTranslation();
  const { navigate } = useNavigation();
  const { loops, isLoading, error, deleteLoop } = useLoops();
  
  // Estados locales
  const [searchTerm, setSearchTerm] = useState('');
  const [filterObjective, setFilterObjective] = useState('all');
  // const [filterStatus, setFilterStatus] = useState('all');
  const [filteredLoops, setFilteredLoops] = useState(loops);
  
  const [showDropdown, setShowDropdown] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  

  // Filtrar loops
  useEffect(() => {
    filterLoops();
  }, [loops, searchTerm, filterObjective]);

  const filterLoops = () => {
    let filtered = loops;

    if (searchTerm) {
      filtered = filtered.filter(loop =>
        loop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loop.objective.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterObjective !== 'all') {
      filtered = filtered.filter(loop => loop.objective === filterObjective);
    }

    setFilteredLoops(filtered);
  };

  const handleDeleteLoop = async (loopId: string) => {
    setIsProcessing(loopId);
    try {
      await deleteLoop(loopId);
      showNotification(t('campaigns.loopDeletedSuccess'), 'success');
    } catch (error) {
      console.error('Error al eliminar loop:', error);
      showNotification(t('campaigns.loopDeletedError'), 'error');
    } finally {
      setIsProcessing(null);
      setShowDeleteConfirm(null);
      setShowDropdown(null);
    }
  };

  const showNotification = (_message: string, _type: 'success' | 'error') => {
    // Notification handling can be implemented here
  };

  const getObjectiveIcon = (objective: string) => {
    switch (objective) {
      case 'engagement': return Target;
      case 'retention': return Users;
      case 'conversion': return Calendar;
      case 'education': return Settings;
      case 'feedback': return Activity;
      default: return Settings;
    }
  };

  const getObjectiveBadgeColor = (objective: string) => {
    switch (objective) {
      case 'engagement': return 'bg-blue-50 text-blue-600';
      case 'retention': return 'bg-green-50 text-green-600';
      case 'conversion': return 'bg-purple-50 text-purple-600';
      case 'education': return 'bg-yellow-50 text-yellow-600';
      case 'feedback': return 'bg-orange-50 text-orange-600';
      default: return 'bg-gray-50 text-gray-600';
    }
  };

  // Componente de estadísticas
  const StatsCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div className="bg-surface rounded-xl p-4 border border-border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-textMuted text-sm">{t('campaigns.totalLoops')}</p>
            <p className="text-2xl font-bold text-textPrimary">
              {loops.length}
            </p>
          </div>
          <div className="bg-accent/10 p-3 rounded-lg">
            <Target className="w-5 h-5 text-accent" />
          </div>
        </div>
      </div>

      <div className="bg-surface rounded-xl p-4 border border-border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-textMuted text-sm">{t('campaigns.activeLoops')}</p>
            <p className="text-2xl font-bold text-green-600">
              {loops.filter(l => l.status === 'active').length}
            </p>
          </div>
          <div className="bg-green-50 p-3 rounded-lg">
            <Activity className="w-5 h-5 text-green-600" />
          </div>
        </div>
      </div>

      <div className="bg-surface rounded-xl p-4 border border-border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-textMuted text-sm">{t('campaigns.uniqueObjectives')}</p>
            <p className="text-2xl font-bold text-textPrimary">
              {new Set(loops.map(l => l.objective)).size}
            </p>
          </div>
          <div className="bg-accent/10 p-3 rounded-lg">
            <User className="w-5 h-5 text-accent" />
          </div>
        </div>
      </div>
    </div>
  );

  // Vista en Grilla
  const GridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {filteredLoops.map((loop) => {
        const ObjectiveIcon = getObjectiveIcon(loop.objective);
        
        return (
          <div 
            key={loop.id} 
            className="group bg-surface rounded-xl p-6 border border-border hover:shadow-elegant-lg hover:border-accent/20 transition-all duration-300 hover:-translate-y-1 relative"
          >
            {/* Loading overlay */}
            {isProcessing === loop.id && (
              <div className="absolute inset-0 bg-surface/80 rounded-xl flex items-center justify-center z-10">
                <div className="flex flex-col items-center space-y-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
                  <span className="text-sm text-textMuted">{t('campaigns.processing')}</span>
                </div>
              </div>
            )}

            {/* Header con dropdown */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="bg-accent/10 p-2 rounded-lg">
                  <ObjectiveIcon className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-textPrimary truncate">{loop.name}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getObjectiveBadgeColor(loop.objective)}`}>
                    {loop.objective}
                  </span>
                </div>
              </div>

              {/* Dropdown de acciones */}
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(showDropdown === loop.id ? null : loop.id)}
                  className="p-2 rounded-lg hover:bg-muted transition-colors opacity-0 group-hover:opacity-100"
                >
                  <MoreVertical className="w-4 h-4 text-textMuted" />
                </button>

                {showDropdown === loop.id && (
                  <div className="absolute right-0 top-10 bg-surface border border-border rounded-lg shadow-lg py-1 z-20 min-w-[160px]">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/app/loop-builder/${loop.id}`);
                        setShowDropdown(null);
                      }}
                      className="w-full text-left px-4 py-2 text-textSecondary hover:bg-muted hover:text-textPrimary flex items-center space-x-2 transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                      <span>{t('campaigns.editLoop')}</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDeleteConfirm(loop.id);
                        setShowDropdown(null);
                      }}
                      className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 flex items-center space-x-2 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>{t('campaigns.deleteLoop')}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Información del loop */}
            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-textMuted">{t('campaigns.agent')}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="font-medium text-accent truncate">{loop.agent?.name || 'N/A'}</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-textMuted">{t('campaigns.status')}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  loop.status === 'active' ? 'bg-green-100 text-green-800' :
                  loop.status === 'inactive' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {loop.status}
                </span>
              </div>
            </div>

            {/* Fecha de creación */}
            {loop.created_at && (
              <div className="border-t border-border pt-4">
                <div className="flex items-center space-x-2 text-sm text-textMuted">
                  <Calendar className="w-4 h-4" />
                  <span>{t('campaigns.created')} {new Date(loop.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto"></div>
          <p className="text-textMuted mt-4">{t('campaigns.loadingLoops')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Target className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-textPrimary mb-2">{t('campaigns.errorLoadingLoops')}</h3>
          <p className="text-textMuted mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-accent text-white px-6 py-3 rounded-lg hover:bg-highlight transition-colors"
          >
            {t('campaigns.retry')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header mejorado */}
      <div className="bg-surface border-b border-border">
        <div className="container mx-auto px-6 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-center space-x-4">
              <div className="bg-accent/10 p-3 rounded-xl">
                <Target className="w-6 h-6 text-accent" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-textPrimary">{t('campaigns.title')}</h1>
                <p className="text-textMuted">{t('campaigns.subtitle')}</p>
              </div>
            </div>

            {/* Controles */}
            <div className="flex items-center space-x-4">
              {/* Búsqueda */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-textMuted w-4 h-4" />
                <input
                  type="text"
                  placeholder={t('campaigns.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-accent focus:border-accent transition-all w-64"
                />
              </div>

              {/* Filtros */}
              <select
                value={filterObjective}
                onChange={(e) => setFilterObjective(e.target.value)}
                className="px-3 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-accent focus:border-accent transition-all"
              >
                <option value="all">{t('campaigns.allObjectives')}</option>
                <option value="engagement">{t('campaigns.engagement')}</option>
                <option value="retention">{t('campaigns.retention')}</option>
                <option value="conversion">{t('campaigns.conversion')}</option>
                <option value="education">{t('campaigns.education')}</option>
                <option value="feedback">{t('campaigns.feedback')}</option>
              </select>

              {/* Botón crear loop */}
              <button 
                onClick={() => navigate('/app/loop-builder')}
                className="bg-accent text-white px-6 py-2 rounded-lg hover:bg-highlight transition-colors flex items-center space-x-2 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>{t('campaigns.newLoop')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="container mx-auto px-6 py-8">
        <StatsCards />

        {filteredLoops.length === 0 ? (
          <div className="text-center py-12">
            <Target className="w-16 h-16 text-textMuted mx-auto mb-4" />
            <h3 className="text-lg font-medium text-textPrimary mb-2">
              {loops.length === 0 ? t('campaigns.noLoopsConfigured') : t('campaigns.noLoopsFound')}
            </h3>
            <p className="text-textMuted mb-6">
              {loops.length === 0 
                ? t('campaigns.createFirstLoop')
                : t('campaigns.adjustSearchFilters')
              }
            </p>
            {loops.length === 0 && (
              <button 
                onClick={() => navigate('/app/loop-builder')}
                className="bg-accent text-white px-6 py-3 rounded-lg hover:bg-highlight transition-colors shadow-sm"
              >
                {t('campaigns.createFirstLoopButton')}
              </button>
            )}
          </div>
        ) : (
          <div>
            <GridView />
          </div>
        )}
      </div>

      {/* Modal de confirmación de eliminación */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-border rounded-xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-textPrimary mb-2">{t('campaigns.confirmDeleteTitle')}</h3>
              <p className="text-textMuted mb-6">
                {t('campaigns.confirmDeleteMessage')}
              </p>
              <div className="flex justify-center space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="px-4 py-2 bg-muted border border-border text-foreground rounded-lg hover:bg-muted/80 transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={() => handleDeleteLoop(showDeleteConfirm)}
                  disabled={isProcessing === showDeleteConfirm}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {isProcessing === showDeleteConfirm ? t('campaigns.deleting') : t('common.delete')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Campaigns;
