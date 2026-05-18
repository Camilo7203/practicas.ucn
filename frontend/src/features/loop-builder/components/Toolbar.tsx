import React from 'react';
import { Save, Eye, Play, AlertCircle } from 'lucide-react';

interface ToolbarProps {
  onSave: () => void;
  onPreview: () => void;
  onDeploy: () => void;
  hasUnsavedChanges?: boolean;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  onSave,
  onPreview,
  onDeploy,
  hasUnsavedChanges = false
}) => {
  return (
    <div className="bg-card border border-border rounded-xl p-6 mb-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">Loop Builder</h1>
          <p className="text-muted-foreground">Create and configure your sends loops</p>
        </div>

        <div className="flex items-center space-x-3">
          {hasUnsavedChanges && (
            <div className="flex items-center space-x-2 text-amber-500">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">Unsaved changes</span>
            </div>
          )}
          
          <button 
            onClick={onSave}
            className="flex items-center space-x-2 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Save</span>
          </button>
          
          <button 
            onClick={onPreview}
            className="flex items-center space-x-2 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
          >
            <Eye className="w-4 h-4" />
            <span>Preview</span>
          </button>
          
          <button 
            onClick={onDeploy}
            className="flex items-center space-x-2 px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-white"
          >
            <Play className="w-4 h-4" />
            <span>Deploy Loop</span>
          </button>
        </div>
      </div>
    </div>
  );
};
