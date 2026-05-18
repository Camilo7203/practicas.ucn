import API from '@/services/core/apiCore';
import { handleAPIError } from '../core/handleApiError';
import { ITemplate } from '@/interfaces/templates/templateInterface';
import { ITemplateStatusResponse } from '@/interfaces/whatsappTemplates';
import { IAPIResponse } from '@/interfaces/whatsappTemplates/apiResponseInterface'

export async function getTemplateStatus(templateId: string): Promise<IAPIResponse<ITemplateStatusResponse>> {
  try {
    const response = await API.get<IAPIResponse<ITemplateStatusResponse>>(
      `${import.meta.env.VITE_API_AGENT_URL}/templates/${templateId}/status/`,
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
export async function getTemplateDetails(templateId: string): Promise<IAPIResponse<ITemplate>> {
  try {
    const response = await API.get<IAPIResponse<ITemplate>>(
      `${import.meta.env.VITE_API_AGENT_URL}/campaigns/templates/${templateId}`,
      {
        headers: {},
      }
    );

    return response.data;
  } catch (error) {
    return handleAPIError(error);
  }
}
export async function listTemplatesFromMongo(
  organizationId?: string,
  agentId?: string,
  activeOnly: boolean = true
): Promise<IAPIResponse<ITemplate[]>> {
  try {
    const params = new URLSearchParams();
    
    if (organizationId) params.append('organization_id', organizationId);
    if (agentId) params.append('agent_id', agentId);
    params.append('active_only', activeOnly.toString());
    params.append('provider', 'whatsapp');
    
    const response = await API.get<IAPIResponse<ITemplate[]>>(
      `${import.meta.env.VITE_API_URL}/campaigns/templates?${params.toString()}`,
      {
        headers: {},
      }
    );

    return response.data;
  } catch (error) {
    return handleAPIError(error);
  }
}
export async function listApprovedTemplates(
  organizationId?: string,
  agentId?: string
): Promise<IAPIResponse<ITemplate[]>> {
  try {
    const params = new URLSearchParams();
    console.log('listApprovedTemplates - organizationId:', organizationId, 'agentId:', agentId);
    if (organizationId) params.append('organization_id', organizationId);
    if (agentId) params.append('agent_id', agentId);
    const response = await API.get<IAPIResponse<ITemplate[]>>(
      `${import.meta.env.VITE_API_URL}/campaigns/templates/approved?${params.toString()}`,
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