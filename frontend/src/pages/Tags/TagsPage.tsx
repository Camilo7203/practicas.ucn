import React, { useState, useEffect } from 'react';
import { Plus, Tag as TagIcon, Users, Search, Trash2, X } from 'lucide-react';
import { tagService } from '@/services/tagService';
import type { ITag } from '@/interfaces/tags';
import AssignTagModal from './modals/AssignTagModal';
import BulkAssignTagModal from './modals/BulkAssignTagModal';

const TagsPage: React.FC = () => {
  const [tags, setTags] = useState<ITag[]>([]);
  const [uniqueTags, setUniqueTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showBulkAssignModal, setShowBulkAssignModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTagFilter, setSelectedTagFilter] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tagsResult, uniqueTagsResult] = await Promise.all([
        tagService.getTags(),
        tagService.getUniqueTags()
      ]);
      setTags(tagsResult.tags);
      setUniqueTags(uniqueTagsResult.tags);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTag = async (tagId: string) => {
    if (!confirm('¿Estás seguro de eliminar este tag?')) return;
    try {
      await tagService.deleteTag(tagId);
      await fetchData();
    } catch (error) {
      console.error('Error deleting tag:', error);
    }
  };

  const handleAssignSuccess = async () => {
    await fetchData();
    setShowAssignModal(false);
  };

  const handleBulkAssignSuccess = async () => {
    await fetchData();
    setShowBulkAssignModal(false);
  };

  // Agrupar tags por nombre de tag
  const tagGroups = uniqueTags.map(tagName => {
    const tagInstances = tags.filter(t => t.tag === tagName);
    return {
      name: tagName,
      count: tagInstances.length,
      tags: tagInstances
    };
  });

  // Filtrar por búsqueda
  const filteredGroups = tagGroups.filter(group =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filtrar por tag seleccionado
  const displayedGroups = selectedTagFilter
    ? filteredGroups.filter(g => g.name === selectedTagFilter)
    : filteredGroups;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-textPrimary mb-2">Gestión de Tags</h1>
          <p className="text-textMuted">
            Administra las etiquetas de tus activistas para mejor segmentación
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-surface border border-border rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-textMuted text-sm">Total Tags Únicos</p>
                <p className="text-3xl font-bold text-textPrimary mt-1">{uniqueTags.length}</p>
              </div>
              <TagIcon className="w-12 h-12 text-accent opacity-20" />
            </div>
          </div>
          <div className="bg-surface border border-border rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-textMuted text-sm">Total Asignaciones</p>
                <p className="text-3xl font-bold text-textPrimary mt-1">{tags.length}</p>
              </div>
              <Users className="w-12 h-12 text-accent opacity-20" />
            </div>
          </div>
          <div className="bg-surface border border-border rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-textMuted text-sm">Promedio por Tag</p>
                <p className="text-3xl font-bold text-textPrimary mt-1">
                  {uniqueTags.length > 0 ? Math.round(tags.length / uniqueTags.length) : 0}
                </p>
              </div>
              <TagIcon className="w-12 h-12 text-accent opacity-20" />
            </div>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div className="relative flex-1 max-w-md w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-textMuted" />
            <input
              type="text"
              placeholder="Buscar tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-surface border border-border rounded-lg text-textPrimary focus:outline-none focus:ring-2 focus:ring-accent/50"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowBulkAssignModal(true)}
              className="px-4 py-2 bg-surface border border-accent text-accent rounded-lg hover:bg-accent/10 transition-colors flex items-center space-x-2"
            >
              <Users className="w-4 h-4" />
              <span>Asignación Masiva</span>
            </button>
            <button
              onClick={() => setShowAssignModal(true)}
              className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Asignar Tag</span>
            </button>
          </div>
        </div>

        {/* Filter by selected tag */}
        {selectedTagFilter && (
          <div className="mb-4 flex items-center gap-2">
            <span className="text-sm text-textMuted">Filtrando por:</span>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent/10 text-accent rounded-full text-sm">
              <TagIcon className="w-3 h-3" />
              <span>{selectedTagFilter}</span>
              <button
                onClick={() => setSelectedTagFilter(null)}
                className="hover:bg-accent/20 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        {/* Tags Grid */}
        {displayedGroups.length === 0 ? (
          <div className="text-center py-12">
            <TagIcon className="w-16 h-16 text-textMuted mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold text-textPrimary mb-2">
              No hay tags
            </h3>
            <p className="text-textMuted mb-6">
              Comienza asignando tags a tus activistas
            </p>
            <button
              onClick={() => setShowAssignModal(true)}
              className="px-6 py-3 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors inline-flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Asignar Primer Tag</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayedGroups.map((group) => (
              <div
                key={group.name}
                className="bg-surface border border-border rounded-xl p-6 hover:shadow-elegant-lg hover:border-accent/20 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="p-2 bg-accent/10 rounded-lg">
                      <TagIcon className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-textPrimary text-lg">{group.name}</h3>
                      <p className="text-xs text-textMuted">
                        {group.count} {group.count === 1 ? 'activista' : 'activistas'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <button
                      onClick={() => setSelectedTagFilter(group.name)}
                      className="text-accent hover:underline"
                    >
                      Ver detalles
                    </button>
                  </div>
                </div>

                {/* Show first few assignments */}
                {selectedTagFilter === group.name && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-xs text-textMuted mb-2">Asignaciones:</p>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {group.tags.map((tag) => (
                        <div
                          key={tag.id}
                          className="flex items-center justify-between py-1 px-2 bg-muted rounded text-xs"
                        >
                          <span className="text-textMuted">ID: {tag.activist.slice(0, 8)}...</span>
                          <button
                            onClick={() => handleDeleteTag(tag.id)}
                            className="p-1 hover:bg-surface rounded transition-colors"
                          >
                            <Trash2 className="w-3 h-3 text-red-500" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showAssignModal && (
        <AssignTagModal
          onClose={() => setShowAssignModal(false)}
          onSuccess={handleAssignSuccess}
        />
      )}

      {showBulkAssignModal && (
        <BulkAssignTagModal
          onClose={() => setShowBulkAssignModal(false)}
          onSuccess={handleBulkAssignSuccess}
        />
      )}
    </div>
  );
};

export default TagsPage;
