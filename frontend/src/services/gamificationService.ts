import { API_CONFIG } from '@/config';

// Interfaces
export interface Division {
  id: string;
  name: string;
  description: string;
  max_points: number;
  is_active: boolean;
  order: number;
  icon: string;
  created_at: string;
  updated_at: string;
}

export interface League {
  id: string;
  name: string;
  description: string;
  point_name: string;
  is_active: boolean;
  organization: string;
  divisions: string[];
  divisions_detail: Division[];
  created_at: string;
  updated_at: string;
}

export interface StoreItem {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  price: number;
  image: string;
  created_at: string;
  updated_at: string;
}

export interface Store {
  id: string;
  name: string;
  description: string;
  currency: string;
  is_active: boolean;
  organization: string;
  store_items: string[];
  store_items_detail: StoreItem[];
  created_at: string;
  updated_at: string;
}

// Create Payloads
export interface CreateLeaguePayload {
  name: string;
  description?: string;
  point_name: string;
  is_active?: boolean;
  divisions?: string[];
}

export interface CreateDivisionPayload {
  name: string;
  description?: string;
  max_points: number;
  is_active?: boolean;
  order: number;
  icon?: string;
}

export interface CreateStorePayload {
  name: string;
  description?: string;
  currency: string;
  is_active?: boolean;
  store_items?: string[];
}

export interface CreateStoreItemPayload {
  name: string;
  description?: string;
  price: number;
  is_active?: boolean;
  image?: string;
}

// Response Interfaces
export interface LeagueListResponse {
  leagues: League[];
  total: number;
}

export interface DivisionListResponse {
  divisions: Division[];
  total: number;
}

export interface StoreListResponse {
  stores: Store[];
  total: number;
}

export interface StoreItemListResponse {
  items: StoreItem[];
  total: number;
}

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('access_token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

// League API Functions
export const getLeagues = async (): Promise<LeagueListResponse> => {
  const response = await fetch(`${API_CONFIG.BASE_URL}/gamification/leagues`, {
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error('Failed to fetch leagues');
  return response.json();
};

export const getLeague = async (id: string): Promise<{ league: League }> => {
  const response = await fetch(`${API_CONFIG.BASE_URL}/gamification/leagues/${id}`, {
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error('Failed to fetch league');
  return response.json();
};

export const createLeague = async (data: CreateLeaguePayload): Promise<{ message: string; league: League }> => {
  const response = await fetch(`${API_CONFIG.BASE_URL}/gamification/leagues/create`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error('Failed to create league');
  return response.json();
};

export const updateLeague = async (id: string, data: Partial<CreateLeaguePayload>): Promise<{ message: string; league: League }> => {
  const response = await fetch(`${API_CONFIG.BASE_URL}/gamification/leagues/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error('Failed to update league');
  return response.json();
};

export const deleteLeague = async (id: string): Promise<{ message: string }> => {
  const response = await fetch(`${API_CONFIG.BASE_URL}/gamification/leagues/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error('Failed to delete league');
  return response.json();
};

// Division API Functions
export const getDivisions = async (): Promise<DivisionListResponse> => {
  const response = await fetch(`${API_CONFIG.BASE_URL}/gamification/divisions`, {
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error('Failed to fetch divisions');
  return response.json();
};

export const getDivision = async (id: string): Promise<{ division: Division }> => {
  const response = await fetch(`${API_CONFIG.BASE_URL}/gamification/divisions/${id}`, {
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error('Failed to fetch division');
  return response.json();
};

export const createDivision = async (data: CreateDivisionPayload): Promise<{ message: string; division: Division }> => {
  const response = await fetch(`${API_CONFIG.BASE_URL}/gamification/divisions/create`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error('Failed to create division');
  return response.json();
};

export const updateDivision = async (id: string, data: Partial<CreateDivisionPayload>): Promise<{ message: string; division: Division }> => {
  const response = await fetch(`${API_CONFIG.BASE_URL}/gamification/divisions/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error('Failed to update division');
  return response.json();
};

export const deleteDivision = async (id: string): Promise<{ message: string }> => {
  const response = await fetch(`${API_CONFIG.BASE_URL}/gamification/divisions/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error('Failed to delete division');
  return response.json();
};

// Store API Functions
export const getStores = async (): Promise<StoreListResponse> => {
  const response = await fetch(`${API_CONFIG.BASE_URL}/gamification/stores`, {
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error('Failed to fetch stores');
  return response.json();
};

export const getStore = async (id: string): Promise<{ store: Store }> => {
  const response = await fetch(`${API_CONFIG.BASE_URL}/gamification/stores/${id}`, {
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error('Failed to fetch store');
  return response.json();
};

export const createStore = async (data: CreateStorePayload): Promise<{ message: string; store: Store }> => {
  const response = await fetch(`${API_CONFIG.BASE_URL}/gamification/stores/create`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error('Failed to create store');
  return response.json();
};

export const updateStore = async (id: string, data: Partial<CreateStorePayload>): Promise<{ message: string; store: Store }> => {
  const response = await fetch(`${API_CONFIG.BASE_URL}/gamification/stores/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error('Failed to update store');
  return response.json();
};

export const deleteStore = async (id: string): Promise<{ message: string }> => {
  const response = await fetch(`${API_CONFIG.BASE_URL}/gamification/stores/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error('Failed to delete store');
  return response.json();
};

// Store Item API Functions
export const getStoreItems = async (): Promise<StoreItemListResponse> => {
  const response = await fetch(`${API_CONFIG.BASE_URL}/gamification/store-items`, {
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error('Failed to fetch store items');
  return response.json();
};

export const getStoreItem = async (id: string): Promise<{ item: StoreItem }> => {
  const response = await fetch(`${API_CONFIG.BASE_URL}/gamification/store-items/${id}`, {
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error('Failed to fetch store item');
  return response.json();
};

export const createStoreItem = async (data: CreateStoreItemPayload): Promise<{ message: string; item: StoreItem }> => {
  const response = await fetch(`${API_CONFIG.BASE_URL}/gamification/store-items/create`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error('Failed to create store item');
  return response.json();
};

export const updateStoreItem = async (id: string, data: Partial<CreateStoreItemPayload>): Promise<{ message: string; item: StoreItem }> => {
  const response = await fetch(`${API_CONFIG.BASE_URL}/gamification/store-items/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error('Failed to update store item');
  return response.json();
};

export const deleteStoreItem = async (id: string): Promise<{ message: string }> => {
  const response = await fetch(`${API_CONFIG.BASE_URL}/gamification/store-items/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error('Failed to delete store item');
  return response.json();
};
