import { useState, useCallback } from 'react';
import { authService } from '../services/authService';
import type { LoginRequest, RegisterRequest } from '../services/authService';

interface ExtendedLoginRequest extends LoginRequest {
  rememberMe?: boolean;
}

export const useAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (credentials: ExtendedLoginRequest) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await authService.login(credentials);
      return response;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterRequest) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await authService.register(userData);
      return response;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = useCallback(() => {
    authService.logout();
  }, []);

  const is_authenticated = useCallback(() => {
    return authService.is_authenticated();
  }, []);

  const getUser = useCallback(() => {
    return authService.getUser();
  }, []);

  const refreshToken = async () => {
    try {
      return await authService.refreshToken();
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const hasRememberMe = useCallback(() => {
    return authService.hasRememberMe();
  }, []);

  const getTokenTimeRemaining = useCallback(() => {
    return authService.getTokenTimeRemaining();
  }, []);

  return {
    login,
    register,
    logout,
    is_authenticated,
    getUser,
    refreshToken,
    hasRememberMe,
    getTokenTimeRemaining,
    isLoading,
    error,
    setError
  };
};
