import React, { useState, useEffect } from 'react';
import { Plus, Trophy, Award, Edit, Trash2, Search } from 'lucide-react';
import type { League, Division } from '@/services/gamificationService';
import { 
  getLeagues, 
  getDivisions,
  createLeague,
  updateLeague,
  deleteLeague,
  createDivision,
  updateDivision,
  deleteDivision
} from '@/services/gamificationService';
import CreateLeagueModal from './modals/CreateLeagueModal';
import CreateDivisionModal from './modals/CreateDivisionModal';

const LeaguesTab: React.FC = () => {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLeagueModal, setShowLeagueModal] = useState(false);
  const [showDivisionModal, setShowDivisionModal] = useState(false);
  const [editingLeague, setEditingLeague] = useState<League | null>(null);
  const [editingDivision, setEditingDivision] = useState<Division | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [leaguesResult, divisionsResult] = await Promise.all([
        getLeagues(),
        getDivisions()
      ]);
      setLeagues(leaguesResult.leagues);
      setDivisions(divisionsResult.divisions);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLeague = async (data: any) => {
    try {
      await createLeague(data);
      await fetchData();
      setShowLeagueModal(false);
    } catch (error) {
      console.error('Error creating league:', error);
      throw error;
    }
  };

  const handleUpdateLeague = async (data: any) => {
    if (!editingLeague) return;
    try {
      await updateLeague(editingLeague.id, data);
      await fetchData();
      setEditingLeague(null);
      setShowLeagueModal(false);
    } catch (error) {
      console.error('Error updating league:', error);
      throw error;
    }
  };

  const handleDeleteLeague = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta liga?')) return;
    try {
      await deleteLeague(id);
      await fetchData();
    } catch (error) {
      console.error('Error deleting league:', error);
    }
  };

  const handleCreateDivision = async (data: any) => {
    try {
      await createDivision(data);
      await fetchData();
      setShowDivisionModal(false);
    } catch (error) {
      console.error('Error creating division:', error);
      throw error;
    }
  };

  const handleUpdateDivision = async (data: any) => {
    if (!editingDivision) return;
    try {
      await updateDivision(editingDivision.id, data);
      await fetchData();
      setEditingDivision(null);
      setShowDivisionModal(false);
    } catch (error) {
      console.error('Error updating division:', error);
      throw error;
    }
  };

  const handleDeleteDivision = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta división?')) return;
    try {
      await deleteDivision(id);
      await fetchData();
    } catch (error) {
      console.error('Error deleting division:', error);
    }
  };

  const filteredLeagues = leagues.filter(league =>
    league.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    league.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredDivisions = divisions.filter(div =>
    div.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header with Search */}
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-textMuted" />
          <input
            type="text"
            placeholder="Buscar ligas o divisiones..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-surface border border-border rounded-lg text-textPrimary focus:outline-none focus:ring-2 focus:ring-accent/50"
          />
        </div>
      </div>

      {/* Divisions Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-textPrimary flex items-center space-x-2">
              <Award className="w-6 h-6 text-accent" />
              <span>Divisiones</span>
            </h2>
            <p className="text-textMuted text-sm mt-1">
              Crea y gestiona las divisiones para tus ligas
            </p>
          </div>
          <button
            onClick={() => {
              setEditingDivision(null);
              setShowDivisionModal(true);
            }}
            className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva División</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDivisions.map((division) => (
            <div
              key={division.id}
              className="bg-surface border border-border rounded-xl p-4 hover:shadow-elegant-lg hover:border-accent/20 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <span className="text-3xl">{division.icon || '🏆'}</span>
                  <div>
                    <h3 className="font-semibold text-textPrimary">{division.name}</h3>
                    <p className="text-xs text-textMuted">Orden: {division.order}</p>
                  </div>
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => {
                      setEditingDivision(division);
                      setShowDivisionModal(true);
                    }}
                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4 text-accent" />
                  </button>
                  <button
                    onClick={() => handleDeleteDivision(division.id)}
                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
              {division.description && (
                <p className="text-sm text-muted-foreground mb-3">{division.description}</p>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Puntos máx:</span>
                <span className="font-semibold text-blue-600">{division.max_points}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Leagues Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-textPrimary flex items-center space-x-2">
              <Trophy className="w-6 h-6 text-accent" />
              <span>Ligas</span>
            </h2>
            <p className="text-textMuted text-sm mt-1">
              Gestiona tus ligas y asigna divisiones
            </p>
          </div>
          <button
            onClick={() => {
              setEditingLeague(null);
              setShowLeagueModal(true);
            }}
            className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Liga</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredLeagues.map((league) => (
            <div
              key={league.id}
              className="bg-surface border border-border rounded-xl p-6 hover:shadow-elegant-lg hover:border-accent/20 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-textPrimary">{league.name}</h3>
                  <p className="text-sm text-textMuted mt-1">{league.description}</p>
                  <div className="mt-2 inline-flex items-center px-2 py-1 bg-accent/10 text-accent rounded text-xs font-medium">
                    Puntos: {league.point_name}
                  </div>
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => {
                      setEditingLeague(league);
                      setShowLeagueModal(true);
                    }}
                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4 text-accent" />
                  </button>
                  <button
                    onClick={() => handleDeleteLeague(league.id)}
                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>

              {league.divisions_detail.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-medium text-textMuted mb-2">DIVISIONES:</p>
                  <div className="flex flex-wrap gap-2">
                    {league.divisions_detail.sort((a, b) => a.order - b.order).map((div) => (
                      <div
                        key={div.id}
                        className="flex items-center space-x-1 px-2 py-1 bg-accent/5 border border-accent/20 rounded text-xs"
                      >
                        <span>{div.icon}</span>
                        <span className="font-medium">{div.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Modals */}
      {showLeagueModal && (
        <CreateLeagueModal
          onClose={() => {
            setShowLeagueModal(false);
            setEditingLeague(null);
          }}
          onSubmit={editingLeague ? handleUpdateLeague : handleCreateLeague}
          initialData={editingLeague ? {
            name: editingLeague.name,
            description: editingLeague.description,
            point_name: editingLeague.point_name,
            divisions: editingLeague.divisions
          } : undefined}
        />
      )}

      {showDivisionModal && (
        <CreateDivisionModal
          onClose={() => {
            setShowDivisionModal(false);
            setEditingDivision(null);
          }}
          onSubmit={editingDivision ? handleUpdateDivision : handleCreateDivision}
          initialData={editingDivision ? {
            name: editingDivision.name,
            description: editingDivision.description,
            max_points: editingDivision.max_points,
            order: editingDivision.order,
            icon: editingDivision.icon
          } : undefined}
          nextOrder={divisions.length > 0 ? Math.max(...divisions.map(d => d.order)) + 1 : 1}
        />
      )}
    </div>
  );
};

export default LeaguesTab;
