import { API_CONFIG } from '../config';

export interface League {
  id: string;
  name: string;
  description: string;
  organization: string;
  created_at: string;
  updated_at: string;
}

export interface LeaguesResponse {
  leagues: League[];
  total: number;
}

class LeaguesService {
  private baseUrl = API_CONFIG.BASE_URL;

  private getAuthHeaders() {
    const token = localStorage.getItem('access_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  async getLeagues(): Promise<LeaguesResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/gamification/leagues`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch leagues');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching leagues:', error);
      throw error;
    }
  }

  async getLeagueById(leagueId: string): Promise<{ league: League }> {
    try {
      const response = await fetch(`${this.baseUrl}/gamification/leagues/${leagueId}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch league');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching league:', error);
      throw error;
    }
  }

  async getLeagueRanking(leagueId: string): Promise<{ activists: any[] }> {
    try {
      const response = await fetch(`${this.baseUrl}/gamification/leagues/${leagueId}/ranking`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch ranking');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching ranking:', error);
      // Return empty list if endpoint doesn't exist yet
      return { activists: [] };
    }
  }
}

export const leaguesService = new LeaguesService();
