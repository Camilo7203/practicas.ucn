import React, { useState, useEffect } from 'react';
import { X, Store as StoreIcon } from 'lucide-react';
import type { StoreItem } from '@/services/gamificationService';
import { getStoreItems } from '@/services/gamificationService';

interface CreateStoreModalProps {
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    description: string;
    currency: string;
    store_items: string[];
  }) => void;
  initialData?: {
    name: string;
    description: string;
    currency: string;
    store_items: string[];
  };
}

const CreateStoreModal: React.FC<CreateStoreModalProps> = ({ onClose, onSubmit, initialData }) => {
  const [form, setForm] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    currency: initialData?.currency || '',
    store_items: initialData?.store_items || [] as string[]
  });
  const [availableItems, setAvailableItems] = useState<StoreItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStoreItems();
  }, []);

  const fetchStoreItems = async () => {
    try {
      const result = await getStoreItems();
      setAvailableItems(result.items.filter(item => item.is_active));
    } catch (error) {
      console.error('Error fetching store items:', error);
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

  const handleItemToggle = (itemId: string) => {
    setForm(prev => ({
      ...prev,
      store_items: prev.store_items.includes(itemId)
        ? prev.store_items.filter(id => id !== itemId)
        : [...prev.store_items, itemId]
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-surface border border-border rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
              <StoreIcon className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-textPrimary">
                {initialData ? 'Editar Tienda' : 'Nueva Tienda'}
              </h3>
              <p className="text-textMuted text-sm">Configura tu tienda de recompensas</p>
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
              Nombre de la Tienda
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-green-500/50"
              placeholder="Ej: Tienda de Recompensas"
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
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-green-500/50"
              placeholder="Describe tu tienda..."
              rows={3}
            />
          </div>

          <div>
            <label className="block text-foreground text-sm font-medium mb-2">
              Moneda
            </label>
            <input
              type="text"
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value })}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-green-500/50"
              placeholder="Ej: Monedas, Tokens, Créditos"
              required
            />
          </div>

          <div>
            <label className="block text-foreground text-sm font-medium mb-2">
              Artículos Disponibles
            </label>
            <div className="grid grid-cols-1 gap-3 max-h-64 overflow-y-auto">
              {availableItems.map((item) => (
                <label
                  key={item.id}
                  className={`
                    flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all
                    ${form.store_items.includes(item.id)
                      ? 'border-green-500 bg-green-50'
                      : 'border-border hover:border-green-300'
                    }
                  `}
                >
                  <div className="flex items-center space-x-3 flex-1">
                    <input
                      type="checkbox"
                      checked={form.store_items.includes(item.id)}
                      onChange={() => handleItemToggle(item.id)}
                      className="rounded text-green-500 focus:ring-green-500"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-sm text-foreground">{item.name}</div>
                      {item.description && (
                        <div className="text-xs text-muted-foreground">{item.description}</div>
                      )}
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-green-600">
                    {item.price} pts
                  </div>
                </label>
              ))}
            </div>
            {availableItems.length === 0 && (
              <p className="text-muted-foreground text-sm mt-2">
                No hay artículos disponibles. Crea artículos primero.
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
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors duration-200 disabled:opacity-50"
            >
              {loading ? 'Guardando...' : initialData ? 'Actualizar' : 'Crear Tienda'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateStoreModal;
