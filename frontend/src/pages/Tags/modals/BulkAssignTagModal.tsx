import React, { useState } from 'react';
import { X, Users, Tag, AlertCircle, CheckCircle } from 'lucide-react';
import { tagService } from '@/services/tagService';

interface BulkAssignTagModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const BulkAssignTagModal: React.FC<BulkAssignTagModalProps> = ({ onClose, onSuccess }) => {
  const [form, setForm] = useState({
    activist_ids: '',
    tag: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ created: number; skipped: number; errors: string[] } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Convertir string de IDs separados por coma/salto de línea a array
      const idsArray = form.activist_ids
        .split(/[,\n]/)
        .map(id => id.trim())
        .filter(id => id.length > 0);

      if (idsArray.length === 0) {
        setError('Debes ingresar al menos un ID de activista');
        setLoading(false);
        return;
      }

      const response = await tagService.bulkAssignTag({
        activist_ids: idsArray,
        tag: form.tag
      });

      setResult(response);

      // Si no hubo errores, cerrar automáticamente después de 2 segundos
      if (response.errors.length === 0) {
        setTimeout(() => {
          onSuccess();
        }, 2000);
      }
    } catch (err: any) {
      console.error('Error bulk assigning tags:', err);
      setError(err.message || 'Error en la asignación masiva');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-surface border border-border rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-textPrimary">
                Asignación Masiva de Tags
              </h3>
              <p className="text-textMuted text-sm">Asigna un tag a múltiples activistas</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-textMuted" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-500">{error}</p>
          </div>
        )}

        {result && (
          <div className="mb-4 space-y-2">
            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
              <div className="text-sm">
                <p className="text-green-500 font-medium">Asignación completada</p>
                <p className="text-textMuted">
                  Creados: {result.created} | Omitidos: {result.skipped}
                </p>
              </div>
            </div>
            {result.errors.length > 0 && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-sm text-red-500 font-medium mb-2">Errores ({result.errors.length}):</p>
                <ul className="text-xs text-red-500 space-y-1 max-h-32 overflow-y-auto">
                  {result.errors.map((err, idx) => (
                    <li key={idx}>• {err}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-textPrimary text-sm font-medium mb-2">
              IDs de Activistas
            </label>
            <textarea
              value={form.activist_ids}
              onChange={(e) => setForm({ ...form, activist_ids: e.target.value })}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-textPrimary focus:outline-none focus:ring-2 focus:ring-accent/50 font-mono text-sm"
              placeholder="Ingresa IDs separados por comas o saltos de línea&#10;Ejemplo:&#10;507f1f77bcf86cd799439011&#10;507f191e810c19729de860ea&#10;507f1f77bcf86cd799439012"
              rows={8}
              required
            />
            <p className="text-xs text-textMuted mt-1">
              Puedes pegar una lista de IDs separados por comas o uno por línea
            </p>
          </div>

          <div>
            <label className="block text-textPrimary text-sm font-medium mb-2">
              Nombre del Tag
            </label>
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-textMuted" />
              <input
                type="text"
                value={form.tag}
                onChange={(e) => setForm({ ...form, tag: e.target.value })}
                className="w-full pl-10 pr-3 py-2 bg-background border border-border rounded-lg text-textPrimary focus:outline-none focus:ring-2 focus:ring-accent/50"
                placeholder="Ej: campaña_2024, nuevo_usuario"
                required
              />
            </div>
            <p className="text-xs text-textMuted mt-1">
              Este tag será asignado a todos los activistas de la lista
            </p>
          </div>

          <div className="bg-muted/50 border border-border rounded-lg p-3">
            <p className="text-xs text-textMuted">
              <strong>Nota:</strong> Los tags duplicados serán omitidos automáticamente. 
              Solo se crearán nuevas asignaciones para activistas que no tengan este tag.
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-muted text-textPrimary rounded-lg hover:bg-muted/80 transition-colors"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              disabled={loading}
            >
              <Users className="w-4 h-4" />
              <span>{loading ? 'Asignando...' : 'Asignar a Todos'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BulkAssignTagModal;
