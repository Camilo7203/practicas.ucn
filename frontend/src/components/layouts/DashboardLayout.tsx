import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar, Sidebar } from '@/components';
import { useAuthContext } from '@/contexts/AuthContext';
import { useNavigation } from '@/contexts/NavigationContext';
import type { NavigationPage } from '@/types';

const DashboardLayout: React.FC = () => {
  const { user, logout } = useAuthContext();
  const { currentPage, setCurrentPage } = useNavigation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Convert user to format expected by Navbar
  const navbarUser = user ? {
    userId: user.userId,
    username: user.name,
    email: user.email,
  } : null;

  const handlePageChange = (page: string) => {
    setCurrentPage(page as NavigationPage);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex min-h-screen">
        <Sidebar
          currentPage={currentPage}
          onPageChange={handlePageChange}
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen((prev) => !prev)}
        />
        <div
          className={`flex-1 min-w-0 transition-all duration-200 ${
            isSidebarOpen ? 'md:ml-72' : 'md:ml-16'
          }`}
        >
          <Navbar
            currentPage={currentPage}
            onPageChange={handlePageChange}
            user={navbarUser}
            onLogout={logout}
          />
          <main>
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
