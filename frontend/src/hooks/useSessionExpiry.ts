import { useEffect, useCallback } from 'react';
import { useAuthContext } from '../contexts/AuthContext';

interface UseSessionExpiryOptions {
  warningTime?: number; // Tiempo en segundos antes de mostrar advertencia (antes de las 24h)
  onWarning?: () => void; // Callback cuando queda poco tiempo
  onExpiry?: () => void; // Callback cuando expira la sesión
}

export const useSessionExpiry = (options: UseSessionExpiryOptions = {}) => {
  const {
    warningTime = 30 * 60, // 30 minutos por defecto (antes de las 24 horas)
    onWarning,
    onExpiry
  } = options;

  const { is_authenticated, logout } = useAuthContext();

  const checkTokenExpiry = useCallback(() => {
    if (!is_authenticated) return;

    const token = localStorage.getItem('access_token');
    if (!token) return;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      const timeRemaining = payload.exp - currentTime;

      // Solo cerrar sesión si el token YA expiró (timeRemaining <= 0)
      if (timeRemaining <= 0) {
        console.log('Token expirado, cerrando sesión');
        onExpiry?.();
        logout();
        return;
      }

      // Si queda menos tiempo que el warning time, mostrar advertencia
      if (timeRemaining <= warningTime && timeRemaining > 0) {
        onWarning?.();
      }
    } catch (error) {
      console.error('Error verificando expiración del token:', error);
    }
  }, [is_authenticated, warningTime, onWarning, onExpiry, logout]);

  useEffect(() => {
    if (!is_authenticated) return;

    // Verificar inmediatamente
    checkTokenExpiry();

    // Verificar cada 30 segundos
    const interval = setInterval(checkTokenExpiry, 30000);

    return () => clearInterval(interval);
  }, [is_authenticated, checkTokenExpiry]);

  return {
    checkTokenExpiry
  };
};
