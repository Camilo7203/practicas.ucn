

import axios from 'axios';
import { API_CONFIG } from '../config';
import type { TriggerRegisterPayload } from '../interfaces/triggers/triggerInterface';
import type { LoopRegisterPayload, LoopData } from '../interfaces/loops/loopInterface';

// Create an axios instance with default headers
const campaignsAxios = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include JWT token
campaignsAxios.interceptors.request.use(
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
campaignsAxios.interceptors.response.use(
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
          return campaignsAxios.request(error.config);
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

// Define types for each registration payload
export interface SurveyRegisterPayload {
  // Add fields as needed, e.g. title: string;
  [key: string]: any;
}

export interface PointIncentiveRegisterPayload {
  [key: string]: any;
}
export interface PointsSystemRegisterPayload {
  [key: string]: any;
}

export class CampaignsService {
  public async registerSurvey(data: SurveyRegisterPayload) {
    return campaignsAxios.post('/campaigns/task/register', data);
  }

  public async registerTrigger(data: TriggerRegisterPayload) {
    return campaignsAxios.post('/campaigns/trigger/register', data);
  }

  public async registerPointIncentive(data: PointIncentiveRegisterPayload) {
    return campaignsAxios.post('/campaigns/point-incentive/register', data);
  }

  public async registerPointsSystem(data: PointsSystemRegisterPayload) {
    return campaignsAxios.post('/campaigns/points-system/register', data);
  }

  public async registerLoop(data: LoopRegisterPayload) {
    return campaignsAxios.post('/campaigns/loop/register', data);
  }

  public async getLoops() {
    return campaignsAxios.get('/campaigns/loops');
  }

  public async getLoop(loopId: string) {
    return campaignsAxios.get(`/campaigns/loop/${loopId}`);
  }

  public async updateLoop(loopId: string, data: Partial<LoopData>) {
    return campaignsAxios.put(`/campaigns/loop/${loopId}`, data);
  }

  public async deleteLoop(loopId: string) {
    return campaignsAxios.delete(`/campaigns/loop/${loopId}`);
  }
}
