import { API_CONFIG } from '../config';
import { ITag, ITagsResponse, ITagAssignRequest, IBulkTagAssignRequest, IBulkTagAssignResponse, IActivistTagsResponse, IUniqueTagsResponse, ISearchActivistResponse } from '@/interfaces/tags';


class TagService {
  private baseUrl = API_CONFIG.BASE_URL;

  private getAuthHeaders() {
    const token = localStorage.getItem('access_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  /**
   * Obtiene todos los tags de la organización
   */
  async getTags(): Promise<ITagsResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/gamification/tags`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch tags');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching tags:', error);
      throw error;
    }
  }

  /**
   * Obtiene un tag específico por ID
   */
  async getTagById(tagId: string): Promise<{ tag: ITag }> {
    try {
      const response = await fetch(`${this.baseUrl}/gamification/tags/${tagId}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch tag');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching tag:', error);
      throw error;
    }
  }

  /**
   * Asigna un tag a un activista
   */
  async assignTag(data: ITagAssignRequest): Promise<{ message: string; tag: ITag }> {
    try {
      const response = await fetch(`${this.baseUrl}/gamification/tags/create`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to assign tag');
      }

      return await response.json();
    } catch (error) {
      console.error('Error assigning tag:', error);
      throw error;
    }
  }

  /**
   * Asigna un tag a múltiples activistas
   */
  async bulkAssignTag(data: IBulkTagAssignRequest): Promise<IBulkTagAssignResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/gamification/tags/bulk-assign`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to bulk assign tags');
      }

      return await response.json();
    } catch (error) {
      console.error('Error bulk assigning tags:', error);
      throw error;
    }
  }

  /**
   * Elimina un tag (soft delete)
   */
  async deleteTag(tagId: string): Promise<{ message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/gamification/tags/${tagId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete tag');
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting tag:', error);
      throw error;
    }
  }

  /**
   * Obtiene todos los tags de un activista específico
   */
  async getActivistTags(activistId: string, includeInactive: boolean = false): Promise<IActivistTagsResponse> {
    try {
      const url = new URL(`${this.baseUrl}/gamification/activists/${activistId}/tags`);
      if (includeInactive) {
        url.searchParams.append('include_inactive', 'true');
      }

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch activist tags');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching activist tags:', error);
      throw error;
    }
  }

  /**
   * Obtiene lista de nombres únicos de tags en la organización
   */
  async getUniqueTags(): Promise<IUniqueTagsResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/gamification/tags/unique`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch unique tags');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching unique tags:', error);
      throw error;
    }
  }

  /**
   * Remueve un tag específico de un activista
   */
  async removeTagFromActivist(activistId: string, tagName: string): Promise<void> {
    try {
      // Primero obtener todos los tags del activista
      const { tags } = await this.getActivistTags(activistId);
      
      // Buscar el tag específico
      const tag = tags.find(t => t.tag === tagName && t.is_active);
      
      if (!tag) {
        throw new Error('Tag not found for this activist');
      }

      // Eliminar el tag
      await this.deleteTag(tag.id);
    } catch (error) {
      console.error('Error removing tag from activist:', error);
      throw error;
    }
  }

  /**
   * Busca un activista por ID o número de teléfono
   */
  async searchActivist(query: string): Promise<ISearchActivistResponse> {
    try {
      const url = new URL(`${this.baseUrl}/gamification/activists/search`);
      url.searchParams.append('q', query);

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to search activist');
      }

      return await response.json();
    } catch (error) {
      console.error('Error searching activist:', error);
      throw error;
    }
  }
}

export const tagService = new TagService();
