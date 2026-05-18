import React, { useState } from 'react';
import Navbar from '@/components/Navbar/page';
import LoopBuilder from '@/pages/LoopBuilder/page';
import AIAgents from '@/pages/AIAgents/page';
import Login from '@/pages/Login/page';
import FinishScreen from '@/pages/FinishScreen/page';
import SessionExpiryNotification from '@/components/SessionExpiryNotification';
import { useAuthContext } from '@/contexts/AuthContext';
import { useSessionExpiry } from '@/hooks/useSessionExpiry';
import LoginForm from '@/pages/Login/LoginForm';
import RegisterForm from '@/pages/Login/RegisterForm';
import UserActivation from '@/pages/Activation/UserActivation';
import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [showFinishScreen, setShowFinishScreen] = useState(false);
  const [showExpiryWarning, setShowExpiryWarning] = useState(false);
  const [currentView, setCurrentView] = useState('login');
  const { user, is_authenticated, isLoading, logout } = useAuthContext();

  // Configurar manejo de expiración de sesión
  useSessionExpiry({
    warningTime: 5 * 60, // Advertir 5 minutos antes
    onWarning: () => {
      setShowExpiryWarning(true);
    },
    onExpiry: () => {
      setShowExpiryWarning(false);
      // El logout se maneja automáticamente en el hook
    }
  });

  const handleLogin = () => {
    setShowFinishScreen(true);
    // Hide finish screen after 3 seconds
    setTimeout(() => {
      setShowFinishScreen(false);
    }, 3000);
  };

  const handleLogout = () => {
    logout();
    setCurrentPage('dashboard');
    setShowFinishScreen(false);
  };

  const renderCurrentPage = () => {
    if (showFinishScreen) {
      return <FinishScreen />;
    }

    switch (currentPage) {
      case 'create-loop':
        return <LoopBuilder />;
      case 'ai-agents':
        return <AIAgents />;
      default:
        return <AIAgents />;
    }
  };

  // Detectar la ruta actual
  React.useEffect(() => {
    const path = window.location.pathname;
    if (path.includes('/activate')) {
        setCurrentView('activate');
    } else if (path.includes('/register')) {
        setCurrentView('register');
    } else {
        setCurrentView('login');
    }
}, []);

  const renderCurrentView = () => {
    switch (currentView) {
      case 'register':
        return <RegisterForm onLogin={handleLogin} onSwitchToLogin={() => setCurrentView('login')} />;
      case 'dashboard':
        return <AIAgents />;
      case 'activate':
        return <UserActivation />;
      default:
        return <LoginForm onLogin={handleLogin} onSwitchToRegister={() => setCurrentView('register')} />;
    }
  };

  // Mostrar loading mientras verifica la sesión
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-backgroundAlt to-surface flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-textSecondary">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!is_authenticated) {
    return <Login onLogin={handleLogin} />;
  }

  // Convertir user a formato esperado por Navbar
  const navbarUser = user ? {
    userId: user.userId,
    username: user.name,
    email: user.email,
  } : null;

  return (
    <div >
      {/* Notificación de expiración de sesión */}
      <SessionExpiryNotification 
        show={showExpiryWarning}
        onClose={() => setShowExpiryWarning(false)}
        onExtend={() => setShowExpiryWarning(false)}
      />
      
      {!showFinishScreen && (
        <Navbar 
          currentPage={currentPage} 
          onPageChange={setCurrentPage}
          user={navbarUser}
          onLogout={handleLogout}
        />
      )}
      {renderCurrentPage()}
      {renderCurrentView()}
    </div>
  );
}

export default App;