import React, { useState } from 'react';
import { Trophy, Store as StoreIcon, TrendingUp } from 'lucide-react';
import LeaguesTab from './LeaguesTab';
import StoresTab from './StoresTab';
import RankingTab from './RankingTab';

type Tab = 'leagues' | 'stores' | 'ranking';

const Gamification: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('leagues');

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-textPrimary mb-2">Gamificación</h1>
          <p className="text-textMuted">Gestiona ligas, divisiones, tiendas, recompensas y ranking de activistas</p>
        </div>

        {/* Tabs */}
        <div className="border-b border-border">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('leagues')}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${activeTab === 'leagues'
                  ? 'border-accent text-accent'
                  : 'border-transparent text-textMuted hover:text-textPrimary hover:border-border'
                }
              `}
            >
              <div className="flex items-center space-x-2">
                <Trophy className="w-5 h-5" />
                <span>Ligas y Divisiones</span>
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab('stores')}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${activeTab === 'stores'
                  ? 'border-accent text-accent'
                  : 'border-transparent text-textMuted hover:text-textPrimary hover:border-border'
                }
              `}
            >
              <div className="flex items-center space-x-2">
                <StoreIcon className="w-5 h-5" />
                <span>Tiendas y Artículos</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('ranking')}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${activeTab === 'ranking'
                  ? 'border-accent text-accent'
                  : 'border-transparent text-textMuted hover:text-textPrimary hover:border-border'
                }
              `}
            >
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5" />
                <span>Ranking de Activistas</span>
              </div>
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {activeTab === 'leagues' && <LeaguesTab />}
        {activeTab === 'stores' && <StoresTab />}
        {activeTab === 'ranking' && <RankingTab />}
      </div>
    </div>
  );
};

export default Gamification;
