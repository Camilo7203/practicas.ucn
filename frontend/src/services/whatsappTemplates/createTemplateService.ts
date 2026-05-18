import API from '@/services/core/apiCore';
import { handleAPIError } from '../core/handleApiError';
import { IAPIResponse } from '@/interfaces/whatsappTemplates/apiResponseInterface'

export async function createWhatsAppTemplate(template: any): Promise<IAPIResponse> {
  try {
    console.log('Enviando plantilla al webhook:', template);
    const response = await API.post<IAPIResponse>(
        import.meta.env.VITE_API_AGENT_URL + '/api/whatsapp/create-template',
        template,
        {
            headers: {
            'Content-Type': 'application/json',
            },
        }
    );
    return response.data;
  } catch (error) {
    return handleAPIError(error);
  }
}