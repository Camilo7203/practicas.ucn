import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock, X, RefreshCw } from 'lucide-react';
import { useAuthContext } from '../contexts/AuthContext';

interface SessionExpiryNotificationProps {
  show: boolean;
  onClose: () => void;
  onExtend?: () => void;
}

const SessionExpiryNotification: React.FC<SessionExpiryNotificationProps> = ({ 
  show, 
  onClose, 
  onExtend 
}) => {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isExtending, setIsExtending] = useState(false);
  const { refreshUserData } = useAuthContext();

  useEffect(() => {
    if (!show) return;

    const updateTimeRemaining = () => {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Date.now() / 1000;
        const remaining = Math.max(0, payload.exp - currentTime);
        setTimeRemaining(remaining);

        // Auto cerrar si el tiempo se agotó
        if (remaining <= 0) {
          onClose();
        }
      } catch (error) {
        console.error('Error calculando tiempo restante:', error);
      }
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 1000); // Actualizar cada segundo

    return () => clearInterval(interval);
  }, [show, onClose]);

  const handleExtendSession = async () => {
    setIsExtending(true);
    try {
      await refreshUserData();
      onExtend?.();
      onClose();
    } catch (error) {
      console.error('Error extendiendo sesión:', error);
    } finally {
      setIsExtending(false);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  if (!show) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] max-w-sm bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg shadow-2xl border border-yellow-300/20 animate-pulse">
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-yellow-200" />
            <h3 className="font-semibold text-sm">Sesión por expirar</h3>
          </div>
          <button 
            onClick={onClose}
            className="text-yellow-200 hover:text-white transition-colors duration-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mb-4">
          <p className="text-sm text-yellow-100 mb-2">
            Su sesión expirará en:
          </p>
          <div className="flex items-center space-x-2 bg-black/20 rounded-lg p-2">
            <Clock className="w-4 h-4 text-yellow-200" />
            <span className="font-mono text-lg font-bold">
              {formatTime(timeRemaining)}
            </span>
          </div>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={handleExtendSession}
            disabled={isExtending}
            className="flex-1 bg-white text-orange-600 px-3 py-2 rounded-lg font-medium hover:bg-yellow-50 transition-colors duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center space-x-1 text-sm"
          >
            {isExtending ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Extendiendo...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                <span>Extender sesión</span>
              </>
            )}
          </button>
          <button
            onClick={onClose}
            className="px-3 py-2 border border-yellow-200/30 rounded-lg hover:bg-black/10 transition-colors duration-200 text-sm"
          >
            Cerrar
          </button>
        </div>

        <p className="text-xs text-yellow-200 mt-2 text-center">
          La sesión se cerrará automáticamente si no se extiende
        </p>
      </div>
    </div>
  );
};

export default SessionExpiryNotification;
