import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { authService } from '../services/authService';
import type { LoginRequest, RegisterRequest } from '../services/authService';

interface User {
  id?: string; // MongoDB ObjectId (opcional por compatibilidad con sesiones antiguas)
  mongoId?: string; // MongoDB ObjectId explícito
  userId: string; // UUID
  name: string; // Cambiado de username a name
  email: string;
  role: string;
  organization?: string;
  is_active: boolean;
}

interface AuthContextType {
  user: User | null;
  is_authenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => void;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [is_authenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Función para actualizar los datos del usuario
  const refreshUserData = async () => {
    try {
      const profileData = await authService.getProfile();
      if (profileData.user) {
        setUser(profileData.user);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Error actualizando datos del usuario:', error);
      logout();
    }
  };

  // Configurar auto-refresh del token
  useEffect(() => {
    let refreshInterval: ReturnType<typeof setInterval> | null = null;

    if (is_authenticated) {
      // Verificar y renovar el token cada 12 horas (antes de las 24h de expiración)
      refreshInterval = setInterval(async () => {
        try {
          await authService.refreshToken();
          console.log('Token renovado automáticamente');
        } catch (error) {
          console.error('Error en auto-refresh:', error);
          logout();
        }
      }, 12 * 60 * 60 * 1000); // 12 horas
    }

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [is_authenticated]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        
        // Verificar si hay tokens almacenados
        const hasTokens = localStorage.getItem('access_token') && localStorage.getItem('refresh_token');
        
        if (hasTokens) {
          // Verificar si el token es válido
          if (authService.is_authenticated()) {
            const userData = authService.getUser();
            if (userData) {
              setUser(userData);
              setIsAuthenticated(true);
            }
          } else {
            // Intentar renovar el token si existe un refresh token
            try {
              await authService.refreshToken();
              const userData = authService.getUser();
              if (userData) {
                setUser(userData);
                setIsAuthenticated(true);
              }
            } catch (refreshError) {
              console.error('Error renovando token en startup:', refreshError);
              authService.logout();
            }
          }
        }
      } catch (error) {
        console.error('Error verificando autenticación:', error);
        authService.logout();
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (credentials: LoginRequest) => {
    try {
      const response = await authService.login(credentials);
      setUser(response.user);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Error en login:', error);
      throw error;
    }
  };

  const register = async (userData: RegisterRequest) => {
    try {
      const response = await authService.register(userData);
      setUser(response.user);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Error en registro:', error);
      throw error;
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  const value: AuthContextType = {
    user,
    is_authenticated,
    isLoading,
    login,
    register,
    logout,
    refreshUserData,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};
