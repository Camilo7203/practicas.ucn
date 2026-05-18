import API from '@/services/core/apiCore';
import { handleAPIError } from '../core/handleApiError';
import { IAPIResponse, IBlackList, ICreateBlackListPayload, IUpdateBlackListPayload } from '@/interfaces/whatsappTemplates';

const getAuthHeaders = () => {
  const token = localStorage.getItem('access_token');
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export async function listBlackLists(
  agentId?: string,
  activeOnly: boolean = true
): Promise<IAPIResponse<IBlackList[]>> {
  try {
    const params = new URLSearchParams();
    if (agentId) params.append('agent_id', agentId);
    params.append('active_only', activeOnly.toString());
    params.append('provider', 'whatsapp');

    const response = await API.get<IAPIResponse<IBlackList[]>>(
      `${import.meta.env.VITE_API_URL}/campaigns/blacklist?${params.toString()}`,
      {
        headers: getAuthHeaders(),
      }
    );

    return response.data;
  } catch (error) {
    return handleAPIError(error);
  }
}

export async function createBlackList(
  payload: ICreateBlackListPayload
): Promise<IAPIResponse<IBlackList>> {
  try {
    const response = await API.post<IAPIResponse<IBlackList>>(
      `${import.meta.env.VITE_API_URL}/campaigns/blacklist`,
      payload,
      {
        headers: getAuthHeaders(),
      }
    );

    return response.data;
  } catch (error) {
    return handleAPIError(error);
  }
}

export async function updateBlackList(
  blacklistId: string,
  payload: IUpdateBlackListPayload
): Promise<IAPIResponse<IBlackList>> {
  try {
    const response = await API.put<IAPIResponse<IBlackList>>(
      `${import.meta.env.VITE_API_URL}/campaigns/blacklist/${blacklistId}`,
      payload,
      {
        headers: getAuthHeaders(),
      }
    );

    return response.data;
  } catch (error) {
    return handleAPIError(error);
  }
}

export async function deleteBlackList(blacklistId: string): Promise<IAPIResponse> {
  try {
    const response = await API.delete<IAPIResponse>(
      `${import.meta.env.VITE_API_URL}/campaigns/blacklist/${blacklistId}`,
      {
        headers: getAuthHeaders(),
      }
    );

    return response.data;
  } catch (error) {
    return handleAPIError(error);
  }
}
