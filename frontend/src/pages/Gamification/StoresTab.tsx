import React, { useState, useEffect } from 'react';
import { Plus, Store as StoreIcon, Package, Edit, Trash2, Search, Coins } from 'lucide-react';
import type { Store, StoreItem } from '@/services/gamificationService';
import { 
  getStores,
  getStoreItems,
  createStore,
  updateStore,
  deleteStore,
  createStoreItem,
  updateStoreItem,
  deleteStoreItem
} from '@/services/gamificationService';
import CreateStoreModal from './modals/CreateStoreModal';
import CreateStoreItemModal from './modals/CreateStoreItemModal';

const StoresTab: React.FC = () => {
  const [stores, setStores] = useState<Store[]>([]);
  const [storeItems, setStoreItems] = useState<StoreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showStoreModal, setShowStoreModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [editingItem, setEditingItem] = useState<StoreItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [storesResult, itemsResult] = await Promise.all([
        getStores(),
        getStoreItems()
      ]);
      setStores(storesResult.stores);
      setStoreItems(itemsResult.items);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStore = async (data: any) => {
    try {
      await createStore(data);
      await fetchData();
      setShowStoreModal(false);
    } catch (error) {
      console.error('Error creating store:', error);
      throw error;
    }
  };

  const handleUpdateStore = async (data: any) => {
    if (!editingStore) return;
    try {
      await updateStore(editingStore.id, data);
      await fetchData();
      setEditingStore(null);
      setShowStoreModal(false);
    } catch (error) {
      console.error('Error updating store:', error);
      throw error;
    }
  };

  const handleDeleteStore = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta tienda?')) return;
    try {
      await deleteStore(id);
      await fetchData();
    } catch (error) {
      console.error('Error deleting store:', error);
    }
  };

  const handleCreateItem = async (data: any) => {
    try {
      await createStoreItem(data);
      await fetchData();
      setShowItemModal(false);
    } catch (error) {
      console.error('Error creating item:', error);
      throw error;
    }
  };

  const handleUpdateItem = async (data: any) => {
    if (!editingItem) return;
    try {
      await updateStoreItem(editingItem.id, data);
      await fetchData();
      setEditingItem(null);
      setShowItemModal(false);
    } catch (error) {
      console.error('Error updating item:', error);
      throw error;
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este artículo?')) return;
    try {
      await deleteStoreItem(id);
      await fetchData();
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const filteredStores = stores.filter(store =>
    store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    store.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredItems = storeItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
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
            placeholder="Buscar tiendas o artículos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-surface border border-border rounded-lg text-textPrimary focus:outline-none focus:ring-2 focus:ring-accent/50"
          />
        </div>
      </div>

      {/* Store Items Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-textPrimary flex items-center space-x-2">
              <Package className="w-6 h-6 text-accent" />
              <span>Artículos</span>
            </h2>
            <p className="text-textMuted text-sm mt-1">
              Crea artículos para agregar a tus tiendas
            </p>
          </div>
          <button
            onClick={() => {
              setEditingItem(null);
              setShowItemModal(true);
            }}
            className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Artículo</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="bg-surface border border-border rounded-xl overflow-hidden hover:shadow-elegant-lg hover:border-accent/20 transition-all duration-300 hover:-translate-y-1"
            >
              {item.image ? (
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-32 object-cover"
                  onError={(e) => {
                    e.currentTarget.src = 'https://via.placeholder.com/150?text=No+Image';
                  }}
                />
              ) : (
                <div className="w-full h-32 bg-gradient-to-br from-accent/10 to-accent/20 flex items-center justify-center">
                  <Package className="w-12 h-12 text-accent" />
                </div>
              )}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-textPrimary">{item.name}</h3>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => {
                        setEditingItem(item);
                        setShowItemModal(true);
                      }}
                      className="p-2 hover:bg-muted rounded-lg transition-colors"
                    >
                      <Edit className="w-3 h-3 text-accent" />
                    </button>
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-2 hover:bg-muted rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3 h-3 text-red-500" />
                    </button>
                  </div>
                </div>
                {item.description && (
                  <p className="text-xs text-textMuted mb-3 line-clamp-2">{item.description}</p>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1 text-accent font-semibold">
                    <Coins className="w-4 h-4" />
                    <span>{item.price}</span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${item.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                    {item.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stores Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-textPrimary flex items-center space-x-2">
              <StoreIcon className="w-6 h-6 text-accent" />
              <span>Tiendas</span>
            </h2>
            <p className="text-textMuted text-sm mt-1">
              Gestiona tus tiendas de recompensas
            </p>
          </div>
          <button
            onClick={() => {
              setEditingStore(null);
              setShowStoreModal(true);
            }}
            className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Tienda</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredStores.map((store) => (
            <div
              key={store.id}
              className="bg-surface border border-border rounded-xl p-6 hover:shadow-elegant-lg hover:border-accent/20 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-textPrimary">{store.name}</h3>
                  <p className="text-sm text-textMuted mt-1">{store.description}</p>
                  <div className="mt-2 inline-flex items-center px-2 py-1 bg-accent/10 text-accent rounded text-xs font-medium">
                    Moneda: {store.currency}
                  </div>
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => {
                      setEditingStore(store);
                      setShowStoreModal(true);
                    }}
                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4 text-accent" />
                  </button>
                  <button
                    onClick={() => handleDeleteStore(store.id)}
                    className="p-2 hover:bg-gray-100 rounded"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>

              {store.store_items_detail.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    ARTÍCULOS ({store.store_items_detail.length}):
                  </p>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {store.store_items_detail.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200"
                      >
                        <span className="text-sm font-medium">{item.name}</span>
                        <span className="text-sm text-green-600 font-semibold flex items-center space-x-1">
                          <Coins className="w-3 h-3" />
                          <span>{item.price}</span>
                        </span>
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
      {showStoreModal && (
        <CreateStoreModal
          onClose={() => {
            setShowStoreModal(false);
            setEditingStore(null);
          }}
          onSubmit={editingStore ? handleUpdateStore : handleCreateStore}
          initialData={editingStore ? {
            name: editingStore.name,
            description: editingStore.description,
            currency: editingStore.currency,
            store_items: editingStore.store_items
          } : undefined}
        />
      )}

      {showItemModal && (
        <CreateStoreItemModal
          onClose={() => {
            setShowItemModal(false);
            setEditingItem(null);
          }}
          onSubmit={editingItem ? handleUpdateItem : handleCreateItem}
          initialData={editingItem ? {
            name: editingItem.name,
            description: editingItem.description,
            price: editingItem.price,
            image: editingItem.image
          } : undefined}
        />
      )}
    </div>
  );
};

export default StoresTab;
