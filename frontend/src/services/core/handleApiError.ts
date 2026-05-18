import { IAPIResponse } from '@/interfaces/whatsappTemplates/apiResponseInterface'
export function handleAPIError(error: unknown): IAPIResponse {
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as any;
    
    return {
      success: false,
      error: axiosError.response?.data?.error 
        || axiosError.response?.data?.message
        || axiosError.message
        || 'Error desconocido en la API',
    };
  }

  return {
    success: false,
    error: error instanceof Error ? error.message : 'Error desconocido',
  };
}