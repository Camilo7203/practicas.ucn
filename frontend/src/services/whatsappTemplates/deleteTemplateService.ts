import API from '@/services/core/apiCore';
import { handleAPIError } from '../core/handleApiError';
import { IAPIResponse } from '@/interfaces/whatsappTemplates/apiResponseInterface'

export async function deleteWhatsAppTemplate(templateName: string): Promise<IAPIResponse> {
  try {
    const response = await API.delete<IAPIResponse>(
      `${import.meta.env.VITE_API_AGENT_URL}/templates/${templateName}/`,
      {
        headers: {
        },
      }
    );

    return response.data;
  } catch (error) {
    return handleAPIError(error);
  }
}
