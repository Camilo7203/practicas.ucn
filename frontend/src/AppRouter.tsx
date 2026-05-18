import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { NavigationProvider } from '@/contexts/NavigationContext';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { 
  Login, 
  AIAgents, 
  Conversations,
  UserActivation,
  Campaigns,
  Profile,
  Organization,
  Invite,
  Shipments,
  Gamification,
  Tags
} from '@/pages';
import LoopBuilderPage from '@/pages/LoopBuilder/page';
import { useAuthContext } from '@/contexts/AuthContext';
import { ROUTES } from '@/lib/constants';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { is_authenticated, isLoading } = useAuthContext();
  
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
    return <Navigate to={ROUTES.LOGIN} replace />;
  }
  
  return <NavigationProvider>{children}</NavigationProvider>;
};

// Public Route Component (redirect if authenticated)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { is_authenticated, isLoading } = useAuthContext();
  
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
  
  if (is_authenticated) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }
  
  return <>{children}</>;
};

const AppRouter: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <div>
          <Routes>
            {/* Public Routes */}
            <Route path={ROUTES.LOGIN} element={
              <PublicRoute>
                <Login onLogin={() => {}} />
              </PublicRoute>
            } />
            
            <Route path={ROUTES.ACTIVATE} element={
              <PublicRoute>
                <UserActivation />
              </PublicRoute>
            } />
            
            {/* Invite Route - accessible by both authenticated and unauthenticated users */}
            <Route path="/invite/:code" element={<Invite />} />
            
            {/* Protected Routes with Layout */}
            <Route path="/app" element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              <Route path="ai-agents" element={<AIAgents />} />
              <Route path="conversations" element={<Conversations />} />
              <Route path="loop-builder/:loopId?" element={<LoopBuilderPage />} />
              <Route path="campaigns" element={<Campaigns />} />
              <Route path="shipments" element={<Shipments />} />
              <Route path="gamification" element={<Gamification />} />
              <Route path="tags" element={<Tags />} />
              <Route path="profile" element={<Profile />} />
              <Route path="organization" element={<Organization />} />
            </Route>
            
            {/* Default redirects */}
            <Route path={ROUTES.AI_AGENTS} element={<Navigate to="/app/ai-agents" replace />} />
            <Route path={ROUTES.CONVERSATIONS} element={<Navigate to="/app/conversations" replace />} />
            <Route path={ROUTES.CAMPAIGNS} element={<Navigate to="/app/campaigns" replace />} />
            <Route path={ROUTES.PROFILE} element={<Navigate to="/app/profile" replace />} />
            <Route path="*" element={<Navigate to="/app/campaigns" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
};

export default AppRouter;
