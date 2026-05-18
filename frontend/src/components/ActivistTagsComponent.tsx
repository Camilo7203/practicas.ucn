import React, { useState, useEffect } from 'react';
import { Tag, Plus, X, Loader } from 'lucide-react';
import { tagService } from '@/services/tagService';
import type { ITag as TagType } from '@/interfaces/tags';
import AssignTagModal from '@/pages/Tags/modals/AssignTagModal';

interface ActivistTagsComponentProps {
  activistId: string;
  compact?: boolean;
}

/**
 * Componente para mostrar y gestionar tags de un activista
 * Puede usarse en vistas de detalle de activista, listas, etc.
 */
const ActivistTagsComponent: React.FC<ActivistTagsComponentProps> = ({ 
  activistId, 
  compact = false 
}) => {
  const [tags, setTags] = useState<TagType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    fetchTags();
  }, [activistId]);

  const fetchTags = async () => {
    setLoading(true);
    try {
      const response = await tagService.getActivistTags(activistId);
      setTags(response.tags);
    } catch (error) {
      console.error('Error fetching activist tags:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveTag = async (tagId: string, tagName: string) => {
    if (!confirm(`¿Eliminar tag "${tagName}"?`)) return;
    
    setRemoving(tagId);
    try {
      await tagService.deleteTag(tagId);
      await fetchTags();
    } catch (error) {
      console.error('Error removing tag:', error);
    } finally {
      setRemoving(null);
    }
  };

  const handleAssignSuccess = async () => {
    await fetchTags();
    setShowAssignModal(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader className="w-5 h-5 animate-spin text-accent" />
      </div>
    );
  }

  if (compact) {
    // Vista compacta para listas
    return (
      <div className="flex flex-wrap items-center gap-1">
        {tags.length === 0 ? (
          <span className="text-xs text-textMuted italic">Sin tags</span>
        ) : (
          tags.map((tag) => (
            <span
              key={tag.id}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-accent/10 text-accent rounded-full text-xs"
            >
              <Tag className="w-3 h-3" />
              <span>{tag.tag}</span>
            </span>
          ))
        )}
      </div>
    );
  }

  // Vista completa para detalles
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-textPrimary flex items-center gap-2">
          <Tag className="w-4 h-4 text-accent" />
          Tags del Activista
        </h3>
        <button
          onClick={() => setShowAssignModal(true)}
          className="p-1.5 hover:bg-muted rounded-lg transition-colors group"
          title="Asignar nuevo tag"
        >
          <Plus className="w-4 h-4 text-accent group-hover:scale-110 transition-transform" />
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {tags.length === 0 ? (
          <div className="text-center py-6 w-full">
            <Tag className="w-8 h-8 text-textMuted mx-auto mb-2 opacity-50" />
            <p className="text-sm text-textMuted mb-3">No hay tags asignados</p>
            <button
              onClick={() => setShowAssignModal(true)}
              className="px-3 py-1.5 bg-accent/10 text-accent rounded-lg hover:bg-accent/20 transition-colors text-sm inline-flex items-center gap-2"
            >
              <Plus className="w-3 h-3" />
              <span>Asignar primer tag</span>
            </button>
          </div>
        ) : (
          tags.map((tag) => (
            <div
              key={tag.id}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-surface border border-border rounded-lg hover:border-accent/50 transition-all group"
            >
              <Tag className="w-3.5 h-3.5 text-accent" />
              <span className="text-sm text-textPrimary">{tag.tag}</span>
              <button
                onClick={() => handleRemoveTag(tag.id, tag.tag)}
                disabled={removing === tag.id}
                className="p-0.5 hover:bg-red-500/10 rounded transition-colors ml-1 disabled:opacity-50"
                title="Eliminar tag"
              >
                {removing === tag.id ? (
                  <Loader className="w-3 h-3 text-red-500 animate-spin" />
                ) : (
                  <X className="w-3 h-3 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </button>
            </div>
          ))
        )}
      </div>

      <div className="text-xs text-textMuted">
        Total: {tags.length} {tags.length === 1 ? 'tag' : 'tags'}
      </div>

      {showAssignModal && (
        <AssignTagModal
          activistId={activistId}
          onClose={() => setShowAssignModal(false)}
          onSuccess={handleAssignSuccess}
        />
      )}
    </div>
  );
};

export default ActivistTagsComponent;
