import axios from 'axios';
import { API_CONFIG } from '../config';

// Create an axios instance with default headers
const agentsAxios = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include JWT token
agentsAxios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle token refresh
agentsAxios.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          // Try to refresh token
          const refreshResponse = await axios.post(`${API_CONFIG.BASE_URL}/token/refresh/`, {
            refresh: refreshToken,
          });
          
          const newToken = (refreshResponse.data as any).access;
          localStorage.setItem('access_token', newToken);
          
          // Retry the original request with new token
          if (error.config.headers) {
            error.config.headers.Authorization = `Bearer ${newToken}`;
          }
          return agentsAxios.request(error.config);
        } catch (refreshError) {
          // Refresh failed, redirect to login
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
        }
      } else {
        // No refresh token, redirect to login
        localStorage.removeItem('access_token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export interface Organization {
  _id?: string;
  name: string;
  alias: string;
  description?: string;
  logo?: string;
  segments: string[];
  plan: 'free' | 'basic' | 'premium';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrganizationRegisterPayload {
  name: string;
  alias: string;
  description?: string;
  logo?: string;
  segments?: string[];
  plan?: 'free' | 'basic' | 'premium';
}

export interface OrganizationUpdatePayload {
  name?: string;
  description?: string;
  logo?: string;
}

export interface InvitationPayload {
  email?: string; // Email opcional
  role: 'admin' | 'member' | 'viewer';
  code?: string;
}

export interface OrganizationMember {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: 'admin' | 'member' | 'viewer';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export class OrganizationService {
  public async registerOrganization(data: OrganizationRegisterPayload) {
    try {
      return agentsAxios.post('/users/organization/register/', data);
    } catch (error) {
      console.error('Error registering organization:', error);
      throw error;
    }
  }

  public async getOrganizations() {
    return agentsAxios.get('/users/organizations/');
  }

  public async getOrganization() {
    return agentsAxios.get('/users/organization/');
  }

  public async updateOrganization(data: OrganizationUpdatePayload) {
    try {
      return agentsAxios.put('/users/organization/', data);
    } catch (error) {
      console.error('Error updating organization:', error);
      throw error;
    }
  }

  public async getOrganizationUsers() {
    try {
      return agentsAxios.get('/users/organization/users/');
    } catch (error) {
      console.error('Error fetching organization users:', error);
      throw error;
    }
  }

  public async updateOrganizationUserRole(userId: string, role: 'admin' | 'member' | 'viewer') {
    try {
      return agentsAxios.patch(`/users/organization/users/${userId}/`, { role });
    } catch (error) {
      console.error('Error updating organization user role:', error);
      throw error;
    }
  }

  public async removeOrganizationUser(userId: string) {
    try {
      return agentsAxios.delete(`/users/organization/users/${userId}/`);
    } catch (error) {
      console.error('Error removing organization user:', error);
      throw error;
    }
  }

  public async createInvitation(data: InvitationPayload) {
    try {
      return agentsAxios.post('/users/invite/', data);
    } catch (error) {
      console.error('Error creating invitation:', error);
      throw error;
    }
  }

  public async getInviteDetails(code: string) {
    try {
      return agentsAxios.get(`/users/invite/${code}/`, {
        headers: {
          'X-API-KEY': import.meta.env.VITE_API_KEY,
        },
      });
    } catch (error) {
      console.error('Error getting invite details:', error);
      throw error;
    }
  }

  public async acceptInvitation(code: string, userData?: { name: string; email: string; password: string }) {
    try {
      if (userData) {
        // Call with user registration data for new users
        return agentsAxios.post(`/users/invite/${code}/accept/`, userData, {
          headers: {
            'X-API-KEY': import.meta.env.VITE_API_KEY,
          },
        });
      } else {
        // Call for existing authenticated users
        return agentsAxios.post(`/users/invite/${code}/accept/`, {}, {
          headers: {
            'X-API-KEY': import.meta.env.VITE_API_KEY,
          },
        });
      }
    } catch (error) {
      console.error('Error accepting invitation:', error);
      throw error;
    }
  }

  public async getInvitations() {
    try {
      return agentsAxios.get('/users/invite/');
    } catch (error) {
      console.error('Error getting invitations:', error);
      throw error;
    }
  }

  public async deleteInvitation(code: string) {
    try {
      return agentsAxios.delete(`/users/invite/${code}/delete/`);
    } catch (error) {
      console.error('Error deleting invitation:', error);
      throw error;
    }
  }
}

export default new OrganizationService();