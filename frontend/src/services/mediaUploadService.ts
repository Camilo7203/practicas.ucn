/**
 * Servicio para subir media (imágenes y videos) a WhatsApp Business API
 * para usar en headers de plantillas
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api-app.loophack.ai/api';

export interface MediaUploadResponse {
  success: boolean;
  mediaId?: string;
  handle?: string;
  error?: string;
  url?: string;
}

export interface MediaInfo {
  id: string;
  url: string;
  mime_type: string;
  sha256: string;
  file_size: number;
}

// Tipos de archivo soportados por WhatsApp
export const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];
export const SUPPORTED_VIDEO_TYPES = ['video/mp4', 'video/3gpp'];
export const SUPPORTED_DOCUMENT_TYPES = ['application/pdf'];

// Límites de tamaño
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
export const MAX_VIDEO_SIZE = 16 * 1024 * 1024; // 16MB
export const MAX_DOCUMENT_SIZE = 100 * 1024 * 1024; // 100MB

/**
 * Valida un archivo antes de subirlo
 */
export function validateMediaFile(file: File, type: 'IMAGE' | 'VIDEO' | 'DOCUMENT'): { valid: boolean; error?: string } {
  let supportedTypes: string[];
  let maxSize: number;

  switch (type) {
    case 'IMAGE':
      supportedTypes = SUPPORTED_IMAGE_TYPES;
      maxSize = MAX_IMAGE_SIZE;
      break;
    case 'VIDEO':
      supportedTypes = SUPPORTED_VIDEO_TYPES;
      maxSize = MAX_VIDEO_SIZE;
      break;
    case 'DOCUMENT':
      supportedTypes = SUPPORTED_DOCUMENT_TYPES;
      maxSize = MAX_DOCUMENT_SIZE;
      break;
  }

  // Validar tipo
  if (!supportedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Tipo de archivo no soportado. Tipos permitidos: ${supportedTypes.join(', ')}`,
    };
  }

  // Validar tamaño
  if (file.size > maxSize) {
    const maxSizeMB = maxSize / (1024 * 1024);
    return {
      valid: false,
      error: `El archivo es muy grande. Tamaño máximo: ${maxSizeMB}MB`,
    };
  }

  return { valid: true };
}

/**
 * Sube un archivo de media a WhatsApp (método simple)
 * Este método es más fácil y se usa directamente para obtener un media ID
 */
export async function uploadMediaSimple(file: File): Promise<MediaUploadResponse> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', file.type);
    formData.append('messaging_product', 'whatsapp');

    const response = await axios.post<MediaUploadResponse>(
      `${API_BASE_URL}/media/upload/`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${getAuthToken()}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    return handleError(error);
  }
}

/**
 * Sube un archivo usando Resumable Upload API (para archivos grandes)
 * Retorna un handle que se usa en las plantillas
 */
export async function uploadMediaResumable(
  file: File,
  _onProgress?: (progress: number) => void
): Promise<MediaUploadResponse> {
  try {
    // Paso 1: Iniciar sesión de upload
    const sessionResponse = await axios.post<{ sessionId: string }>(
      `${API_BASE_URL}/media/resumable/start/`,
      {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
      },
      {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
        },
      }
    );

    const sessionId = sessionResponse.data.sessionId;

    // Paso 2: Subir el archivo
    const formData = new FormData();
    formData.append('file', file);
    formData.append('sessionId', sessionId);

    const uploadResponse = await axios.post<MediaUploadResponse>(
      `${API_BASE_URL}/media/resumable/upload/`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${getAuthToken()}`,
        }
      }
    );

    return uploadResponse.data;
  } catch (error) {
    return handleError(error);
  }
}

/**
 * Obtiene información de un media subido
 */
export async function getMediaInfo(mediaId: string): Promise<MediaInfo | null> {
  try {
    const response = await axios.get<{ success: boolean; data: MediaInfo }>(
      `${API_BASE_URL}/media/${mediaId}/`,
      {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
        },
      }
    );

    return response.data.data;
  } catch (error) {
    console.error('Error getting media info:', error);
    return null;
  }
}

/**
 * Elimina un media subido
 */
export async function deleteMedia(mediaId: string): Promise<boolean> {
  try {
    const response = await axios.delete<{ success: boolean }>(
      `${API_BASE_URL}/media/${mediaId}/`,
      {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
        },
      }
    );

    return response.data.success;
  } catch (error) {
    console.error('Error deleting media:', error);
    return false;
  }
}

/**
 * Descarga un media (retorna la URL temporal)
 */
export async function getMediaDownloadUrl(mediaId: string): Promise<string | null> {
  try {
    const response = await axios.get<{ success: boolean; url: string }>(
      `${API_BASE_URL}/media/${mediaId}/download/`,
      {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
        },
      }
    );

    return response.data.url;
  } catch (error) {
    console.error('Error getting download URL:', error);
    return null;
  }
}

/**
 * Obtiene el token de autenticación
 */
function getAuthToken(): string {
  const token = localStorage.getItem('access_token') || localStorage.getItem('token');
  if (!token) {
    throw new Error('No se encontró token de autenticación');
  }
  return token;
}

/**
 * Maneja errores de la API
 */
function handleError(error: unknown): MediaUploadResponse {
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as any;
    return {
      success: false,
      error: axiosError.response?.data?.error 
        || axiosError.response?.data?.message
        || axiosError.message
        || 'Error al subir el archivo',
    };
  }

  return {
    success: false,
    error: error instanceof Error ? error.message : 'Error desconocido',
  };
}

/**
 * Convierte un File a base64 (útil para preview)
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}

/**
 * Formatea el tamaño de archivo para mostrar
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Obtiene el tipo de formato basado en el tipo MIME
 */
export function getFormatFromMimeType(mimeType: string): 'IMAGE' | 'VIDEO' | 'DOCUMENT' | null {
  if (SUPPORTED_IMAGE_TYPES.includes(mimeType)) return 'IMAGE';
  if (SUPPORTED_VIDEO_TYPES.includes(mimeType)) return 'VIDEO';
  if (SUPPORTED_DOCUMENT_TYPES.includes(mimeType)) return 'DOCUMENT';
  return null;
}
