import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Star, Search, ChevronUp, ChevronDown } from 'lucide-react';
import type { League } from '@/services/gamificationService';
import { getLeagues } from '@/services/gamificationService';
import { leaguesService } from '@/services/leaguesService';

interface ActivistRanking {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  points: number;
  division?: string;
  position: number;
  trend?: 'up' | 'down' | 'stable';
}

interface LeagueRanking {
  league: League;
  activists: ActivistRanking[];
}

const RankingTab: React.FC = () => {
  const [rankings, setRankings] = useState<LeagueRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLeague, setSelectedLeague] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'points' | 'name'>('points');
  const [leagues, setLeagues] = useState<League[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const leaguesResult = await getLeagues();
      setLeagues(leaguesResult.leagues);
      
      if (leaguesResult.leagues.length > 0) {
        setSelectedLeague(leaguesResult.leagues[0].id);
        await fetchRankingForLeague(leaguesResult.leagues[0].id);
      }
    } catch (error) {
      console.error('Error fetching leagues:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRankingForLeague = async (leagueId: string) => {
    try {
      const response = await leaguesService.getLeagueRanking(leagueId);
      const leagueData = leagues.find(l => l.id === leagueId);
      
      if (leagueData && response.activists) {
        const rankingData: ActivistRanking[] = response.activists.map((activist: any, index: number) => ({
          id: activist.id,
          first_name: activist.first_name,
          last_name: activist.last_name,
          phone: activist.phone,
          points: activist.points || 0,
          division: activist.division?.name,
          position: index + 1,
          trend: 'stable' as const
        }));

        setRankings([{
          league: leagueData,
          activists: rankingData
        }]);
      }
    } catch (error) {
      console.error('Error fetching ranking:', error);
    }
  };

  const handleLeagueChange = async (leagueId: string) => {
    setSelectedLeague(leagueId);
    await fetchRankingForLeague(leagueId);
  };

  const filteredRankings = rankings.map(ranking => ({
    ...ranking,
    activists: ranking.activists
      .filter(activist => 
        activist.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activist.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activist.phone.includes(searchTerm)
      )
      .sort((a, b) => {
        if (sortBy === 'points') {
          return b.points - a.points;
        }
        return `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`);
      })
      .map((activist, index) => ({
        ...activist,
        position: index + 1
      }))
  }));

  const getMedalIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Medal className="w-5 h-5 text-orange-600" />;
      default:
        return <Star className="w-5 h-5 text-muted" />;
    }
  };

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'up':
        return <ChevronUp className="w-4 h-4 text-green-500" />;
      case 'down':
        return <ChevronDown className="w-4 h-4 text-red-500" />;
      default:
        return <div className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Trophy className="w-12 h-12 text-muted mx-auto mb-4" />
          <p className="text-textMuted">Cargando ranking...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-6">
      {/* Filtros */}
      <div className="bg-surface border border-border rounded-xl p-4 sticky top-20 z-40">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Selector de Liga */}
          <div>
            <label className="block text-sm font-medium text-textPrimary mb-2">
              Liga
            </label>
            <select
              value={selectedLeague}
              onChange={(e) => handleLeagueChange(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-textPrimary focus:outline-none focus:ring-2 focus:ring-accent transition-all"
            >
              {leagues.map(league => (
                <option key={league.id} value={league.id}>
                  {league.name}
                </option>
              ))}
            </select>
          </div>

          {/* Búsqueda */}
          <div>
            <label className="block text-sm font-medium text-textPrimary mb-2">
              Buscar
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-textMuted" />
              <input
                type="text"
                placeholder="Nombre o teléfono..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 bg-background border border-border rounded-lg text-textPrimary placeholder-textMuted focus:outline-none focus:ring-2 focus:ring-accent transition-all"
              />
            </div>
          </div>

          {/* Ordenar por */}
          <div>
            <label className="block text-sm font-medium text-textPrimary mb-2">
              Ordenar por
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'points' | 'name')}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-textPrimary focus:outline-none focus:ring-2 focus:ring-accent transition-all"
            >
              <option value="points">Puntos (Mayor a Menor)</option>
              <option value="name">Nombre (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Rankings */}
      {filteredRankings.map(ranking => (
        <div key={ranking.league.id} className="space-y-4">
          {/* Header de Liga */}
          <div className="bg-gradient-to-r from-accent/10 to-highlight/10 border border-accent/20 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <Trophy className="w-6 h-6 text-accent" />
              <div>
                <h2 className="text-xl font-bold text-textPrimary">{ranking.league.name}</h2>
                {ranking.league.description && (
                  <p className="text-sm text-textMuted">{ranking.league.description}</p>
                )}
              </div>
            </div>
          </div>

          {/* Tabla de Ranking */}
          <div className="bg-surface border border-border rounded-xl overflow-hidden">
            {ranking.activists.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-background border-b border-border">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-textPrimary">Posición</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-textPrimary">Activista</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-textPrimary">Teléfono</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-textPrimary">División</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-textPrimary">{ranking.league.point_name}</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-textPrimary">Tendencia</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ranking.activists.map((activist, index) => (
                      <tr 
                        key={activist.id}
                        className={`border-b border-border transition-colors ${
                          index % 2 === 0 ? 'bg-background' : 'bg-background/50'
                        } hover:bg-accent/5`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {getMedalIcon(activist.position)}
                            <span className="font-semibold text-textPrimary w-8">{activist.position}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-textPrimary font-medium">
                            {activist.first_name} {activist.last_name}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-textMuted text-sm">{activist.phone}</span>
                        </td>
                        <td className="px-4 py-3">
                          {activist.division ? (
                            <span className="inline-block px-2 py-1 bg-accent/10 text-accent text-xs font-medium rounded">
                              {activist.division}
                            </span>
                          ) : (
                            <span className="text-textMuted text-sm">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-bold text-accent">
                            {activist.points}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {getTrendIcon(activist.trend)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Trophy className="w-12 h-12 text-muted mb-4" />
                <p className="text-textMuted">No hay activistas en esta liga</p>
              </div>
            )}
          </div>

          {/* Estadísticas */}
          {ranking.activists.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-surface border border-border rounded-xl p-4">
                <p className="text-textMuted text-sm mb-2">Total de Activistas</p>
                <p className="text-2xl font-bold text-textPrimary">{ranking.activists.length}</p>
              </div>
              <div className="bg-surface border border-border rounded-xl p-4">
                <p className="text-textMuted text-sm mb-2">Puntos Promedio</p>
                <p className="text-2xl font-bold text-textPrimary">
                  {Math.round(ranking.activists.reduce((sum, a) => sum + a.points, 0) / ranking.activists.length)}
                </p>
              </div>
              <div className="bg-surface border border-border rounded-xl p-4">
                <p className="text-textMuted text-sm mb-2">Puntos Totales</p>
                <p className="text-2xl font-bold text-accent">
                  {ranking.activists.reduce((sum, a) => sum + a.points, 0)}
                </p>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default RankingTab;
