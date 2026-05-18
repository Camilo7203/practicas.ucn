import React, { useState, useEffect } from 'react';
import { Clock, Shield, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuthContext } from '../contexts/AuthContext';

interface SessionStatusProps {
  className?: string;
}

const SessionStatus: React.FC<SessionStatusProps> = ({ className = '' }) => {
  const { t } = useTranslation();
  const { user, is_authenticated } = useAuthContext();
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [showStatus, setShowStatus] = useState(false);

  useEffect(() => {
    if (!is_authenticated) return;

    const updateTimeRemaining = () => {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Date.now() / 1000;
        const remaining = Math.max(0, payload.exp - currentTime);
        setTimeRemaining(remaining);
      } catch (error) {
        console.error('Error calculando tiempo restante:', error);
      }
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 60000); // Actualizar cada minuto

    return () => clearInterval(interval);
  }, [is_authenticated]);

  if (!is_authenticated) return null;

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getStatusColor = () => {
    const minutes = timeRemaining / 60;
    if (minutes < 10) return 'text-red-400';
    if (minutes < 30) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getStatusIcon = () => {
    const minutes = timeRemaining / 60;
    if (minutes < 10) return <AlertTriangle className="w-4 h-4" />;
    if (minutes < 30) return <Clock className="w-4 h-4" />;
    return <Shield className="w-4 h-4" />;
  };

  const isRemembered = localStorage.getItem('remember_me') === 'true';

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setShowStatus(!showStatus)}
        className={`flex items-center space-x-1 p-2 rounded-lg hover:bg-white/5 transition-colors duration-200 ${getStatusColor()}`}
        title={t('common.sessionStatus')}
      >
        {getStatusIcon()}
        <span className="text-xs hidden lg:block">
          {formatTime(timeRemaining)}
        </span>
      </button>

      {showStatus && (
        <div className="absolute right-0 mt-2 w-64 bg-[#340349] border border-[#f490f8]/20 rounded-lg shadow-xl backdrop-blur-sm z-50">
          <div className="p-4">
            <h3 className="text-white font-medium mb-3 flex items-center space-x-2">
              <Shield className="w-4 h-4" />
              <span>{t('common.sessionStatusTitle')}</span>
            </h3>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-white/70">{t('common.userLabel')}:</span>
                <span className="text-white">{user?.email}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-white/70">{t('common.timeRemaining')}:</span>
                <span className={getStatusColor()}>{formatTime(timeRemaining)}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-white/70">{t('common.persistent')}:</span>
                <span className={isRemembered ? 'text-green-400' : 'text-white/70'}>
                  {isRemembered ? t('common.yes') : t('common.no')}
                </span>
              </div>
              
              {timeRemaining < 600 && ( // Menos de 10 minutos
                <div className="mt-3 p-2 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
                  <div className="flex items-center space-x-2 text-yellow-400">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-xs">{t('common.sessionExpiringWarning')}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionStatus;
