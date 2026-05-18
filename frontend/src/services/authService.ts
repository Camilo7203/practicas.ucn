// API Authentication Service
import { API_CONFIG } from '../config';

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  name: string; // Cambiado de username a name
  email: string;
  password: string;
  organization_id?: string;
  role?: 'admin' | 'member' | 'viewer';
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user: {
    userId: string;
    name: string; // Cambiado de username a name
    email: string;
    role: string;
    organization?: string;
    is_active: boolean;
  };
}

export interface UpdateProfileRequest {
  name?: string;
  email?: string;
  role?: 'admin' | 'member' | 'viewer';
  is_active?: boolean;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export interface ApiError {
  error: string;
  details?: any;
}

class AuthService {
  private getHeaders(requireApiKey: boolean = false) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // En desarrollo, agregar API key si es requerida
    if (requireApiKey && import.meta.env.DEV) {
      headers['X-API-Key'] = 'dev-api-key';
    }

    return headers;
  }

  private async makeAuthenticatedRequest(url: string, options: RequestInit = {}) {
    const token = localStorage.getItem('access_token');
    
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    let response = await fetch(url, {
      ...options,
      headers,
    });

    // Si el token ha expirado (401), intentar renovarlo
    if (response.status === 401 && token) {
      try {
        await this.refreshToken();
        const newToken = localStorage.getItem('access_token');
        
        // Reintentar la petición con el nuevo token
        response = await fetch(url, {
          ...options,
          headers: {
            ...headers,
            Authorization: `Bearer ${newToken}`,
          },
        });
      } catch (error) {
        console.error('Error renovando token:', error);
        this.logout();
        throw new Error('Sesión expirada');
      }
    }

    return response;
  }

  async login(credentials: LoginRequest): Promise<AuthResponse> {
    console.log('API Base URL:', API_CONFIG.BASE_URL);
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.LOGIN}`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error en el inicio de sesión');
      }

      // Guardar tokens en localStorage
      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Guardar preferencia "recordarme" si está activada
      if (credentials.rememberMe) {
        localStorage.setItem('remember_me', 'true');
      }

      return data;
    } catch (error) {
      console.error('Error en login:', error);
      throw error;
    }
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.REGISTER}`, {
        method: 'POST',
        headers: this.getHeaders(true), // Registro requiere API key
        body: JSON.stringify({
          name: userData.name,
          email: userData.email,
          password: userData.password,
          organization_id: userData.organization_id,
          role: userData.role || 'member'
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error en el registro');
      }

      // Guardar tokens en localStorage
      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);
      localStorage.setItem('user', JSON.stringify(data.user));

      return data;
    } catch (error) {
      console.error('Error en registro:', error);
      throw error;
    }
  }

  async refreshToken(): Promise<AuthResponse> {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      
      if (!refreshToken) {
        throw new Error('No hay token de refresh disponible');
      }

      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.REFRESH}`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          refresh: refreshToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error renovando token');
      }

      // Actualizar tokens
      localStorage.setItem('access_token', data.access);
      if (data.refresh) {
        localStorage.setItem('refresh_token', data.refresh);
      }

      return data;
    } catch (error) {
      console.error('Error en refresh token:', error);
      this.logout();
      throw error;
    }
  }

  async getProfile(): Promise<any> {
    try {
      const response = await this.makeAuthenticatedRequest(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.PROFILE}`, {
        method: 'GET',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al obtener el perfil');
      }

      // Actualizar datos del usuario en localStorage
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
      }

      return data;
    } catch (error) {
      console.error('Error en perfil:', error);
      throw error;
    }
  }

  async updateProfile(profileData: UpdateProfileRequest): Promise<any> {
    try {
      const response = await this.makeAuthenticatedRequest(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.UPDATE_PROFILE}`, {
        method: 'PATCH',
        body: JSON.stringify(profileData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al actualizar el perfil');
      }

      // Actualizar datos del usuario en localStorage
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
      }

      return data;
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      throw error;
    }
  }

  async changePassword(passwordData: ChangePasswordRequest): Promise<any> {
    try {
      const response = await this.makeAuthenticatedRequest(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.CHANGE_PASSWORD}`, {
        method: 'POST',
        body: JSON.stringify(passwordData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw data;
      }

      return data;
    } catch (error) {
      console.error('Error al cambiar contraseña:', error);
      throw error;
    }
  }

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    localStorage.removeItem('remember_me');
    
    // Opcional: Notificar al servidor sobre el logout
    try {
      fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.LOGOUT}`, {
        method: 'POST',
        headers: this.getHeaders(),
      });
    } catch (error) {
      console.error('Error notificando logout al servidor:', error);
    }
  }

  is_authenticated(): boolean {
    const token = localStorage.getItem('access_token');
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp > currentTime;
    } catch (error) {
      return false;
    }
  }

  getUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  hasRememberMe(): boolean {
    return localStorage.getItem('remember_me') === 'true';
  }

  getTokenTimeRemaining(): number {
    const token = localStorage.getItem('access_token');
    if (!token) return 0;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return Math.max(0, payload.exp - currentTime);
    } catch (error) {
      return 0;
    }
  }
}

export const authService = new AuthService();
