import React, { useState, useEffect } from 'react';
import { X, Award, Loader } from 'lucide-react';
import { leaguesService, type League } from '../../../../services/leaguesService';

export interface PointsIncentiveConfigData {
  name: string;
  description?: string;
  checkpoint_name?: string;
  points_amount: number;
  league: string; // League ID
}

interface PointsIncentiveConfigModalProps {
  onClose: () => void;
  onSubmit: (data: PointsIncentiveConfigData) => void;
  initialData?: Partial<PointsIncentiveConfigData>;
}

const PointsIncentiveConfigModal: React.FC<PointsIncentiveConfigModalProps> = ({ 
  onClose, 
  onSubmit, 
  initialData 
}) => {
  const [form, setForm] = useState<PointsIncentiveConfigData>({
    name: initialData?.name || '',
    description: initialData?.description || '',
    checkpoint_name: initialData?.checkpoint_name || '',
    points_amount: initialData?.points_amount || 0,
    league: initialData?.league || ''
  });

  const [leagues, setLeagues] = useState<League[]>([]);
  const [loadingLeagues, setLoadingLeagues] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLeagues();
  }, []);

  const fetchLeagues = async () => {
    try {
      setLoadingLeagues(true);
      setError(null);
      const response = await leaguesService.getLeagues();
      setLeagues(response.leagues || []);
    } catch (err) {
      console.error('Error fetching leagues:', err);
      setError('Failed to load leagues');
      setLeagues([]);
    } finally {
      setLoadingLeagues(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as any;
    
    if (type === 'number') {
      setForm(prev => ({
        ...prev,
        [name]: parseInt(value) || 0
      }));
    } else {
      setForm(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.name.trim()) {
      alert('Incentive name is required');
      return;
    }
    
    if (form.points_amount <= 0) {
      alert('Points amount must be greater than 0');
      return;
    }

    if (!form.league) {
      alert('League is required');
      return;
    }

    onSubmit(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white border border-gray-200 rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <Award className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-foreground">Points Incentive Configuration</h3>
              <p className="text-muted-foreground text-sm">Configure points reward for users</p>
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
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Incentive Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g., Quiz Completion Bonus"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-foreground"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Description (Optional)
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Describe the purpose of this incentive..."
              rows={2}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-foreground resize-none"
            />
          </div>

          {/* Points Amount */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Points Amount <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="points_amount"
              value={form.points_amount}
              onChange={handleChange}
              placeholder="e.g., 100"
              min="1"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-foreground"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              Enter the number of points to award
            </p>
          </div>

          {/* League Selection */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              League <span className="text-red-500">*</span>
            </label>
            
            {loadingLeagues ? (
              <div className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-gray-500">
                <Loader className="w-4 h-4 animate-spin" />
                <span className="text-sm">Loading leagues...</span>
              </div>
            ) : error ? (
              <div className="px-4 py-2 border border-red-200 rounded-lg bg-red-50 text-red-600 text-sm">
                {error}
                <button
                  type="button"
                  onClick={fetchLeagues}
                  className="ml-2 text-red-700 underline hover:no-underline"
                >
                  Retry
                </button>
              </div>
            ) : (
              <select
                name="league"
                value={form.league}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-foreground"
                required
              >
                <option value="">Select a league...</option>
                {leagues.map(league => (
                  <option key={league.id} value={league.id}>
                    {league.name}
                  </option>
                ))}
              </select>
            )}

            {!loadingLeagues && leagues.length === 0 && !error && (
              <p className="text-xs text-amber-600 mt-1">
                No leagues available. Please create a league first.
              </p>
            )}
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              Save Incentive
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PointsIncentiveConfigModal;
