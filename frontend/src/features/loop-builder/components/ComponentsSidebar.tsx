import React, { useState } from 'react';
import { ChevronDown, Search, Sparkles } from 'lucide-react';
import { AVAILABLE_MODULES } from '../utils/constants';

interface ComponentsSidebarProps {
  openDropdown: string | null;
  onDropdownToggle: (dropdown: string | null) => void;
  onAddNode: (type: keyof typeof AVAILABLE_MODULES, template: any) => void;
}

export const ComponentsSidebar: React.FC<ComponentsSidebarProps> = ({
  openDropdown,
  onDropdownToggle,
  onAddNode
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter modules based on search
  const filteredModules = Object.entries(AVAILABLE_MODULES).reduce((acc, [type, templates]) => {
    if (searchTerm) {
      const filtered = templates.filter(template =>
        template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
      if (filtered.length > 0) {
        acc[type] = filtered;
      }
    } else {
      acc[type] = templates;
    }
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-foreground mb-2 flex items-center">
          <Sparkles className="w-5 h-5 mr-2 text-primary" />
          Components
        </h2>
        <p className="text-sm text-muted-foreground">
          Drag components to build your loop
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search components..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm text-foreground placeholder:text-muted-foreground"
        />
      </div>
      
      {Object.entries(filteredModules).map(([type, templates]) => (
        <div key={type} className="mb-4 dropdown-container">
          <button
            onClick={() => onDropdownToggle(openDropdown === type ? null : type)}
            className="w-full flex items-center justify-between p-3 bg-muted/50 hover:bg-muted rounded-lg transition-all duration-200 group"
          >
            <span className="font-medium text-foreground capitalize flex items-center">
              {type}s
              <span className="ml-2 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                {templates.length}
              </span>
            </span>
            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${openDropdown === type ? 'rotate-180' : ''}`} />
          </button>
          
          {openDropdown === type && (
            <div className="mt-2 space-y-1 pl-2 animate-in slide-in-from-top-2 duration-200">
              <div className="bg-background border border-border rounded-lg overflow-hidden">
                {templates.map((template, index) => (
                  <button
                    key={index}
                    onClick={() => onAddNode(type as keyof typeof AVAILABLE_MODULES, template)}
                    className="w-full p-3 text-left hover:bg-muted rounded-lg transition-all duration-200 flex items-center space-x-3 group border-b border-border last:border-b-0"
                  >
                    <div className={`
                      w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200
                      ${type === 'trigger' ? 'bg-primary/20 group-hover:bg-primary/30' : 
                        'bg-blue-500/20 group-hover:bg-blue-500/30'}
                    `}>
                      <template.icon className={`
                        w-5 h-5 transition-all duration-200
                        ${type === 'trigger' ? 'text-primary' : 'text-blue-500'}
                      `} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                        {template.title}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {template.description}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}

      {Object.keys(filteredModules).length === 0 && (
        <div className="text-center py-8">
          <Search className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="text-sm text-muted-foreground">No components found</p>
          <p className="text-xs text-muted-foreground mt-1">Try a different search term</p>
        </div>
      )}
    </>
  );
};
