import React, { useState } from 'react';
import { X, Award } from 'lucide-react';

interface CreateDivisionModalProps {
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    description: string;
    max_points: number;
    order: number;
    icon: string;
  }) => void;
  initialData?: {
    name: string;
    description: string;
    max_points: number;
    order: number;
    icon: string;
  };
  nextOrder?: number;
}

const CreateDivisionModal: React.FC<CreateDivisionModalProps> = ({ 
  onClose, 
  onSubmit, 
  initialData,
  nextOrder = 1
}) => {
  const [form, setForm] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    max_points: initialData?.max_points || 1000,
    order: initialData?.order || nextOrder,
    icon: initialData?.icon || '🏆'
  });
  const [loading, setLoading] = useState(false);

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

  const iconOptions = ['🏆', '🥇', '🥈', '🥉', '⭐', '💎', '👑', '🎖️', '🏅', '🎯'];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-surface border border-border rounded-xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
              <Award className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-textPrimary">
                {initialData ? 'Editar División' : 'Nueva División'}
              </h3>
              <p className="text-textMuted text-sm">Configura los niveles de tu liga</p>
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
            <label className="block text-textPrimary text-sm font-medium mb-2">
              Nombre de la División
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-textPrimary focus:outline-none focus:ring-2 focus:ring-accent/50"
              placeholder="Ej: Bronce, Plata, Oro"
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
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              placeholder="Describe esta división..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-foreground text-sm font-medium mb-2">
                Puntos Máximos
              </label>
              <input
                type="number"
                value={form.max_points}
                onChange={(e) => setForm({ ...form, max_points: parseInt(e.target.value) })}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                min="0"
                required
              />
            </div>

            <div>
              <label className="block text-foreground text-sm font-medium mb-2">
                Orden
              </label>
              <input
                type="number"
                value={form.order}
                onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) })}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                min="1"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-foreground text-sm font-medium mb-2">
              Icono
            </label>
            <div className="grid grid-cols-5 gap-2">
              {iconOptions.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setForm({ ...form, icon })}
                  className={`
                    text-2xl p-3 border rounded-lg transition-all hover:scale-110
                    ${form.icon === icon
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-border hover:border-blue-300'
                    }
                  `}
                >
                  {icon}
                </button>
              ))}
            </div>
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
              className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors duration-200 disabled:opacity-50"
            >
              {loading ? 'Guardando...' : initialData ? 'Actualizar' : 'Crear División'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateDivisionModal;
