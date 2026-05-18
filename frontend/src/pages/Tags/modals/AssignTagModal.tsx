import React, { useState } from 'react';
import { X, Tag, AlertCircle, Search, Loader } from 'lucide-react';
import { tagService } from '@/services/tagService';

interface AssignTagModalProps {
  onClose: () => void;
  onSuccess: () => void;
  activistId?: string; // Si se proporciona, pre-llena el campo
}

const AssignTagModal: React.FC<AssignTagModalProps> = ({ onClose, onSuccess, activistId }) => {
  const [form, setForm] = useState({
    activist_id: activistId || '',
    tag: ''
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResult, setSearchResult] = useState<{ id: string; first_name: string; last_name: string; phone: string } | null>(null);
  const [inputMode, setInputMode] = useState<'id' | 'search'>('id'); // 'id' o 'search'

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearching(true);
    setError(null);
    setSearchResult(null);

    try {
      const result = await tagService.searchActivist(searchQuery);
      setSearchResult(result.activist);
      setForm({
        ...form,
        activist_id: result.activist.id
      });
    } catch (err: any) {
      console.error('Error searching activist:', err);
      setError(err.message || 'Activista no encontrado');
    } finally {
      setSearching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await tagService.assignTag({
        activist_id: form.activist_id,
        tag: form.tag
      });
      onSuccess();
    } catch (err: any) {
      console.error('Error assigning tag:', err);
      setError(err.message || 'Error al asignar el tag');
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResult(null);
    setForm({ ...form, activist_id: '' });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-surface border border-border rounded-xl p-6 w-full max-w-lg mx-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
              <Tag className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-textPrimary">
                Asignar Tag a Activista
              </h3>
              <p className="text-textMuted text-sm">Asigna una etiqueta a un activista específico</p>
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

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tabs para cambiar modo de entrada */}
          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={() => {
                setInputMode('search');
                clearSearch();
              }}
              className={`flex-1 py-2 px-3 rounded-lg font-medium transition-colors text-sm ${
                inputMode === 'search'
                  ? 'bg-accent text-white'
                  : 'bg-muted text-textPrimary hover:bg-muted/80'
              }`}
            >
              <Search className="w-4 h-4 inline mr-2" />
              Buscar
            </button>
            <button
              type="button"
              onClick={() => {
                setInputMode('id');
                clearSearch();
              }}
              className={`flex-1 py-2 px-3 rounded-lg font-medium transition-colors text-sm ${
                inputMode === 'id'
                  ? 'bg-accent text-white'
                  : 'bg-muted text-textPrimary hover:bg-muted/80'
              }`}
            >
              Ingresar ID
            </button>
          </div>

          {inputMode === 'search' ? (
            <>
              {/* Modo búsqueda por teléfono */}
              <div>
                <label className="block text-textPrimary text-sm font-medium mb-2">
                  Número de Teléfono o ID
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-textMuted" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 bg-background border border-border rounded-lg text-textPrimary focus:outline-none focus:ring-2 focus:ring-accent/50"
                      placeholder="Ej: +1234567890 o 507f191e810c19729de860ea"
                      disabled={searching}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSearch}
                    className="px-4 py-2 bg-accent/20 text-accent rounded-lg hover:bg-accent/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={searching || !searchQuery.trim()}
                  >
                    {searching ? <Loader className="w-4 h-4 animate-spin" /> : 'Buscar'}
                  </button>
                </div>
                <p className="text-xs text-textMuted mt-1">
                  Busca por número de teléfono o ID del activista
                </p>
              </div>

              {/* Resultado de búsqueda */}
              {searchResult && (
                <div className="p-3 bg-accent/10 border border-accent/20 rounded-lg">
                  <p className="text-sm text-textMuted mb-1">Activista encontrado:</p>
                  <p className="font-medium text-textPrimary">
                    {searchResult.first_name} {searchResult.last_name}
                  </p>
                  {searchResult.phone && (
                    <p className="text-sm text-textMuted">{searchResult.phone}</p>
                  )}
                </div>
              )}
            </>
          ) : (
            <>
              {/* Modo ingreso directo de ID */}
              <div>
                <label className="block text-textPrimary text-sm font-medium mb-2">
                  ID del Activista
                </label>
                <input
                  type="text"
                  value={form.activist_id}
                  onChange={(e) => setForm({ ...form, activist_id: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-textPrimary focus:outline-none focus:ring-2 focus:ring-accent/50"
                  placeholder="Ingresa el ID del activista"
                  disabled={!!activistId}
                />
                <p className="text-xs text-textMuted mt-1">
                  ID único del activista al que deseas asignar el tag
                </p>
              </div>
            </>
          )}

          <div>
            <label className="block text-textPrimary text-sm font-medium mb-2">
              Nombre del Tag
            </label>
            <input
              type="text"
              value={form.tag}
              onChange={(e) => setForm({ ...form, tag: e.target.value })}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-textPrimary focus:outline-none focus:ring-2 focus:ring-accent/50"
              placeholder="Ej: interesado_en_clima, voluntario, premium"
              required
            />
            <p className="text-xs text-textMuted mt-1">
              Se recomienda usar minúsculas y guiones bajos
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
              className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading || !form.activist_id || !form.tag}
            >
              {loading ? 'Asignando...' : 'Asignar Tag'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssignTagModal;
