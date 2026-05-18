import React from 'react';
import { useTranslation } from 'react-i18next';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import loopHack from '@/assets/loophack.png';
import { NAVIGATION_GROUPS, NAVIGATION_ITEMS } from '@/config/navigation';
import type { NavigationPage } from '@/types';

interface SidebarProps {
  currentPage: NavigationPage;
  onPageChange: (page: NavigationPage) => void;
  isOpen?: boolean;
  onToggle?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onPageChange,
  isOpen = true,
  onToggle,
}) => {
  const { t } = useTranslation();

  const groups = Object.entries(NAVIGATION_GROUPS) as Array<[
    keyof typeof NAVIGATION_GROUPS,
    string,
  ]>;

  return (
    <aside
      className={`hidden md:flex bg-primary/95 backdrop-blur-sm flex-col fixed top-0 left-0 h-screen z-30 transition-all duration-200 overflow-hidden ${
        isOpen ? 'w-72 border-r border-accent/20' : 'w-16 border-r border-accent/20'
      }`}
      aria-hidden={!isOpen}
    >
      <div className={`py-4 border-b border-accent/20 ${isOpen ? 'px-6' : 'px-2'}`}>
        <div className={`flex items-center ${isOpen ? 'justify-between' : 'justify-center'}`}>
          {isOpen && (
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-accent to-highlight rounded-xl p-2 shadow-lg">
                <img
                  src={loopHack}
                  alt="Loophack Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <p className="text-white text-sm font-semibold">Loophack</p>
              </div>
            </div>
          )}

          {onToggle && (
            <button
              onClick={onToggle}
              className="p-2 rounded-lg hover:bg-white/5 transition-colors duration-200"
              title={isOpen ? 'Ocultar barra lateral' : 'Mostrar barra lateral'}
            >
              {isOpen ? (
                <PanelLeftClose className="w-5 h-5 text-white" />
              ) : (
                <PanelLeftOpen className="w-5 h-5 text-white" />
              )}
            </button>
          )}
        </div>
      </div>

      {isOpen && (
        <nav className="p-4 space-y-6 flex-1 overflow-y-auto">
          {groups.map(([groupId, labelKey]) => {
            const groupItems = NAVIGATION_ITEMS.filter((item) => item.group === groupId);

            if (groupItems.length === 0) {
              return null;
            }

            return (
              <div key={groupId} className="space-y-2">
                <p className="px-3 text-xs uppercase tracking-wide text-white/50 font-medium">
                  {t(labelKey)}
                </p>
                <div className="space-y-1">
                  {groupItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentPage === item.page;

                    return (
                      <button
                        key={item.id}
                        onClick={() => onPageChange(item.page)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                          isActive
                            ? 'bg-accent/20 text-accent shadow-lg shadow-accent/20'
                            : 'text-white/70 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="font-medium text-sm">{t(item.labelKey)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>
      )}
    </aside>
  );
};

export default Sidebar;
