import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { NavigationPage } from '@/types';
import { NAVIGATION_ITEMS } from '@/config/navigation';

interface NavigationContextType {
  currentPage: NavigationPage;
  setCurrentPage: (page: NavigationPage) => void;
  navigate: (path: string) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};

interface NavigationProviderProps {
  children: React.ReactNode;
}

export const NavigationProvider: React.FC<NavigationProviderProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const navigationRouteMap = NAVIGATION_ITEMS.reduce<Record<NavigationPage, string>>((acc, item) => {
    acc[item.page] = item.route;
    return acc;
  }, {
    dashboard: '/app/campaigns',
    'loop-builder': '/app/loop-builder',
    profile: '/app/profile',
    organization: '/app/organization',
    tags: '/app/tags',
    gamification: '/app/gamification',
    shipments: '/app/shipments',
    conversations: '/app/conversations',
    'ai-agents': '/app/ai-agents',
  } as Record<NavigationPage, string>);
  
  
  const getCurrentPageFromPath = (path: string): NavigationPage => {
    if (path.includes('/loop-builder')) return 'loop-builder';
    if (path.includes('/profile')) return 'profile';
    if (path.includes('/organization')) return 'organization';

    const matchedItem = NAVIGATION_ITEMS.find((item) => path.includes(item.route));
    if (matchedItem) {
      return matchedItem.page;
    }

    return 'campaigns';
  };

  const [currentPage, setCurrentPage] = useState<NavigationPage>(() => {
    return getCurrentPageFromPath(location.pathname);
  });

  // Update current page when location changes
  useEffect(() => {
    const newPage = getCurrentPageFromPath(location.pathname);
    setCurrentPage(newPage);
  }, [location.pathname]);

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  const handlePageChange = (page: NavigationPage) => {
    const route = navigationRouteMap[page];
    if (route) {
      navigate(route);
    }
  };

  const value = {
    currentPage,
    setCurrentPage: handlePageChange,
    navigate: handleNavigate,
  };

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
};
