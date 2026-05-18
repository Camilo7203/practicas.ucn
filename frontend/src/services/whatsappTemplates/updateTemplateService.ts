import { IAPIResponse } from '@/interfaces/whatsappTemplates/apiResponseInterface'
import { handleAPIError } from '../core/handleApiError';
import { ITemplate } from '@/interfaces/templates/templateInterface';

export async function updateWhatsAppTemplate(
    templateName: string,
    updatedTemplate: ITemplate
): Promise<IAPIResponse> {
  try {
    
    const response = await axios.put<IAPIResponse>(
      `${import.meta.env.VITE_API_AGENT_URL}templates/${templateName}/`,
      updatedTemplate,
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