import React, { useState, useEffect } from 'react';
import { User, LogOut, Menu, X, FolderOpen } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import SessionStatus from '../../components/SessionStatus';
import LanguageSelector from '../../components/LanguageSelector';
import OrganizationService from '../../services/organizationService';
import { useAuthContext } from '../../contexts/AuthContext';
import { NAVIGATION_ITEMS } from '@/config/navigation';
interface NavbarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  user?: {
    userId: string;
    username: string;
    email: string;
  } | null;
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ currentPage, onPageChange, user, onLogout }) => {
  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [organization, setOrganization] = useState<{
    name: string;
    logo?: string;
  } | null>(null);
  const [isLoadingOrganization, setIsLoadingOrganization] = useState(false);
  const { is_authenticated } = useAuthContext();

  // Función para consultar las organizaciones del usuario
  const fetchUserOrganizations = async () => {
    setIsLoadingOrganization(true);
    try {
      const response = await OrganizationService.getOrganization();
      
      if (response.data && typeof response.data === 'object') {
        const orgData = response.data as any;
        
        if (orgData.organization.name) {
          setOrganization({
            name: orgData.organization.name,
            logo: orgData.organization.logo
          });
        } else {
          // Establecer una organización por defecto para mostrar el ícono
          setOrganization({
            name: t('navbar.noOrganization'),
            logo: undefined
          });
        }
      } else {
        // Establecer una organización por defecto para mostrar el ícono
        setOrganization({
          name: t('navbar.noOrganization'),
          logo: undefined
        });
      }
    } catch (error) {
      console.error('Error al obtener las organizaciones:', error);
      // Establecer una organización por defecto para mostrar el ícono
      setOrganization({
        name: t('navbar.noOrganization'),
        logo: undefined
      });
    } finally {
      setIsLoadingOrganization(false);
    }
  };

  // useEffect para consultar las organizaciones cuando el componente se monte
  useEffect(() => {
    if (user) { // Solo consultar si hay un usuario logueado
      fetchUserOrganizations();
    }
  }, [user]);

  const mobileNavItems = NAVIGATION_ITEMS.filter((item) => item.mobileVisible);

  const handleLogout = () => {
    setIsProfileOpen(false);
    onLogout();
  };

  return (
    <nav className="bg-primary border-b border-accent/20 px-4 py-3 sticky top-0 z-50 backdrop-blur-sm">
      <div className="w-full flex justify-end items-center">
        <div className="flex items-center space-x-2">
          <div className="md:hidden text-white text-sm font-medium mr-2">Loophack</div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-white/5 transition-colors duration-200"
          >
            {isMenuOpen ? (
              <X className="w-6 h-6 text-white" />
            ) : (
              <Menu className="w-6 h-6 text-white" />
            )}
          </button>

          {/* Language Selector */}
          <LanguageSelector />

          {/* Session Status */}
          {is_authenticated && <SessionStatus />}

          {/* Organization Logo */}
          {user && (isLoadingOrganization ? (
            <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center border border-white/20">
              <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            </div>
          ) : organization ? (
            <button
              onClick={() => onPageChange('organization')}
              className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center overflow-hidden border border-white/20 hover:bg-white/20 transition-colors duration-200"
              title={t('navbar.viewProfile', { name: organization.name })}
            >
              {organization.logo ? (
                <img
                  src={organization.logo}
                  alt={`${organization.name} logo`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <FolderOpen className="w-4 h-4 text-white/70" />
              )}
            </button>
          ) : (
            <button
              onClick={() => onPageChange('organization')}
              className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center border border-white/20 hover:bg-white/20 transition-colors duration-200"
              title={t('navbar.viewOrganization')}
            >
              <FolderOpen className="w-4 h-4 text-white/70" />
            </button>
          ))}

          <div className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center space-x-2 p-2 rounded-lg hover:bg-white/5 transition-colors duration-200"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-highlight to-accent rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <span className="text-white text-sm hidden md:block">
                {user?.username || t('auth.username')}
              </span>
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-primary border border-accent/20 rounded-lg shadow-xl backdrop-blur-sm">
                <div className="py-2">
                  {user && (
                    <div className="px-4 py-2 border-b border-accent/20">
                      <p className="text-white text-sm font-medium">{user.username}</p>
                      <p className="text-white/60 text-xs">{user.email}</p>
                    </div>
                  )}
                  <button
                    onClick={() => {
                      onPageChange('profile');
                      setIsProfileOpen(false);
                    }}
                    className="w-full px-4 py-2 text-left text-white/70 hover:text-white hover:bg-white/5 transition-colors duration-200 flex items-center space-x-2"
                  >
                    <User className="w-4 h-4" />
                    <span>{t('navbar.profile')}</span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-left text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors duration-200 flex items-center space-x-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>{t('auth.logout')}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden mt-4 pb-4 border-t border-accent/20">
          <div className="flex flex-col space-y-2 mt-4">
            {mobileNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onPageChange(item.page);
                    setIsMenuOpen(false);
                  }}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                    currentPage === item.page
                      ? 'bg-accent/20 text-accent shadow-lg shadow-accent/20'
                      : 'text-white/70 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium">{t(item.labelKey)}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;