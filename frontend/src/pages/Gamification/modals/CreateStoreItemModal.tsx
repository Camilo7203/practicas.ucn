import React, { useState } from 'react';
import { X, Package } from 'lucide-react';

interface CreateStoreItemModalProps {
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    description: string;
    price: number;
    image: string;
  }) => void;
  initialData?: {
    name: string;
    description: string;
    price: number;
    image: string;
  };
}

const CreateStoreItemModal: React.FC<CreateStoreItemModalProps> = ({ onClose, onSubmit, initialData }) => {
  const [form, setForm] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    price: initialData?.price || 100,
    image: initialData?.image || ''
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

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-surface border border-border rounded-xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-textPrimary">
                {initialData ? 'Editar Artículo' : 'Nuevo Artículo'}
              </h3>
              <p className="text-textMuted text-sm">Crea un artículo para tu tienda</p>
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
              Nombre del Artículo
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-textPrimary focus:outline-none focus:ring-2 focus:ring-accent/50"
              placeholder="Ej: Descuento 10%, Café Gratis"
              required
            />
          </div>

          <div>
            <label className="block text-textPrimary text-sm font-medium mb-2">
              Descripción
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-textPrimary focus:outline-none focus:ring-2 focus:ring-accent/50"
              placeholder="Describe el artículo..."
              rows={3}
            />
          </div>

          <div>
            <label className="block text-foreground text-sm font-medium mb-2">
              Precio (en puntos)
            </label>
            <input
              type="number"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: parseInt(e.target.value) })}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-orange-500/50"
              min="0"
              required
            />
          </div>

          <div>
            <label className="block text-foreground text-sm font-medium mb-2">
              URL de Imagen (opcional)
            </label>
            <input
              type="text"
              value={form.image}
              onChange={(e) => setForm({ ...form, image: e.target.value })}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-orange-500/50"
              placeholder="https://ejemplo.com/imagen.jpg"
            />
            {form.image && (
              <div className="mt-3">
                <img 
                  src={form.image} 
                  alt="Preview" 
                  className="w-32 h-32 object-cover rounded-lg border border-border"
                  onError={(e) => {
                    e.currentTarget.src = 'https://via.placeholder.com/150?text=No+Image';
                  }}
                />
              </div>
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
              className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors duration-200 disabled:opacity-50"
            >
              {loading ? 'Guardando...' : initialData ? 'Actualizar' : 'Crear Artículo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateStoreItemModal;
