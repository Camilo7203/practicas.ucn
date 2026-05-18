import React, { useState, useEffect } from 'react';
import { X, Trophy } from 'lucide-react';
import type { Division } from '@/services/gamificationService';
import { getDivisions } from '@/services/gamificationService';

interface CreateLeagueModalProps {
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    description: string;
    point_name: string;
    divisions: string[];
  }) => void;
  initialData?: {
    name: string;
    description: string;
    point_name: string;
    divisions: string[];
  };
}

const CreateLeagueModal: React.FC<CreateLeagueModalProps> = ({ onClose, onSubmit, initialData }) => {
  const [form, setForm] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    point_name: initialData?.point_name || '',
    divisions: initialData?.divisions || [] as string[]
  });
  const [availableDivisions, setAvailableDivisions] = useState<Division[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDivisions();
  }, []);

  const fetchDivisions = async () => {
    try {
      const result = await getDivisions();
      setAvailableDivisions(result.divisions.filter(d => d.is_active));
    } catch (error) {
      console.error('Error fetching divisions:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(form);
      onClose();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDivisionToggle = (divisionId: string) => {
    setForm(prev => ({
      ...prev,
      divisions: prev.divisions.includes(divisionId)
        ? prev.divisions.filter(id => id !== divisionId)
        : [...prev.divisions, divisionId]
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-surface border border-border rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
              <Trophy className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-textPrimary">
                {initialData ? 'Editar Liga' : 'Nueva Liga'}
              </h3>
              <p className="text-textMuted text-sm">Configura tu sistema de ligas</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-textMuted" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-foreground text-sm font-medium mb-2">
              Nombre de la Liga
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              placeholder="Ej: Liga de Activismo"
              required
            />
          </div>

          <div>
            <label className="block text-foreground text-sm font-medium mb-2">
              Descripción
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              placeholder="Describe tu liga..."
              rows={3}
            />
          </div>

          <div>
            <label className="block text-foreground text-sm font-medium mb-2">
              Nombre de los Puntos
            </label>
            <input
              type="text"
              value={form.point_name}
              onChange={(e) => setForm({ ...form, point_name: e.target.value })}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              placeholder="Ej: Estrellas, Puntos, Karma"
              required
            />
          </div>

          <div>
            <label className="block text-foreground text-sm font-medium mb-2">
              Divisiones
            </label>
            <div className="grid grid-cols-2 gap-3">
              {availableDivisions.map((division) => (
                <label
                  key={division.id}
                  className={`
                    flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-all
                    ${form.divisions.includes(division.id)
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-border hover:border-purple-300'
                    }
                  `}
                >
                  <input
                    type="checkbox"
                    checked={form.divisions.includes(division.id)}
                    onChange={() => handleDivisionToggle(division.id)}
                    className="rounded text-purple-500 focus:ring-purple-500"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-sm text-foreground">{division.name}</div>
                    <div className="text-xs text-muted-foreground">
                      Máx: {division.max_points} pts
                    </div>
                  </div>
                </label>
              ))}
            </div>
            {availableDivisions.length === 0 && (
              <p className="text-muted-foreground text-sm mt-2">
                No hay divisiones disponibles. Crea divisiones primero.
              </p>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-background border border-border text-foreground rounded-lg hover:bg-muted transition-colors duration-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors duration-200 disabled:opacity-50"
            >
              {loading ? 'Guardando...' : initialData ? 'Actualizar' : 'Crear Liga'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateLeagueModal;
