import React from 'react';
import { Settings, Trash2, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import type { Node } from '@xyflow/react';
import type { NodeData } from '../types';

interface PropertiesSidebarProps {
  selectedNode: string | null;
  nodes: Node<NodeData>[];
  onDeleteNode: (nodeId: string) => void;
  onConfigureNode: (node: Node<NodeData>) => void;
}

export const PropertiesSidebar: React.FC<PropertiesSidebarProps> = ({
  selectedNode,
  nodes,
  onDeleteNode,
  onConfigureNode
}) => {
  const selectedNodeData = nodes.find(n => n.id === selectedNode);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'trigger':
        return 'primary';
      case 'task':
        return 'blue-500';
      default:
        return 'gray-500';
    }
  };

  return (
    <div className="xl:col-span-1 bg-card border border-border rounded-xl p-6 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-foreground flex items-center">
          <Info className="w-5 h-5 mr-2 text-primary" />
          Properties
        </h2>
        {selectedNode && (
          <button
            onClick={() => onDeleteNode(selectedNode)}
            className="p-2 text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
            title="Delete component"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {selectedNodeData ? (
        <div className="space-y-4">
          {/* Component Info Card */}
          <div className="p-4 bg-gradient-to-br from-muted/30 to-background border border-border rounded-xl">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-1">
                  {String(selectedNodeData.data?.title || 'Component')}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {String(selectedNodeData.data?.description || 'No description')}
                </p>
              </div>
              {selectedNodeData.data?.icon && (
                <div className={`
                  w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ml-3
                  bg-${getCategoryColor(selectedNodeData.data.category || '')}/20
                `}>
                  <selectedNodeData.data.icon className={`
                    w-5 h-5 text-${getCategoryColor(selectedNodeData.data.category || '')}
                  `} />
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-between">
              <span className={`
                inline-block px-3 py-1 rounded-lg text-xs font-semibold uppercase
                bg-${getCategoryColor(selectedNodeData.data?.category || '')}/20
                text-${getCategoryColor(selectedNodeData.data?.category || '')}
              `}>
                {selectedNodeData.data?.category || selectedNodeData.type}
              </span>
              
              <span className="text-xs text-muted-foreground">
                ID: {selectedNode?.slice(-8) || 'N/A'}
              </span>
            </div>
          </div>

          {/* Configuration Status */}
          <div className={`
            p-4 border rounded-xl
            ${selectedNodeData.data?.configData 
              ? 'bg-green-500/5 border-green-500/20' 
              : 'bg-amber-500/5 border-amber-500/20'}
          `}>
            <div className="flex items-start space-x-3">
              {selectedNodeData.data?.configData ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-green-500 mb-1">
                      Component Configured
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      This component is ready to use in your loop
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-amber-500 mb-1">
                      Configuration Required
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Configure this component to complete your loop
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Configure Button */}
          <button
            onClick={() => onConfigureNode(selectedNodeData)}
            className="text-white w-full flex items-center justify-center space-x-2 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl hover:scale-[1.02]"
          >
            <Settings className="w-4 h-4" />
            <span className="font-medium">Configure Component</span>
          </button>

          {/* Configuration Preview */}
          {selectedNodeData.data?.configData && (
            <div className="p-4 bg-background border border-border rounded-xl">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-3">
                Configuration Preview
              </h4>
              <div className="space-y-2 text-xs">
                {Object.entries(selectedNodeData.data.configData).slice(0, 3).map(([key, value]) => (
                  <div key={key} className="flex justify-between items-center p-2 bg-muted/30 rounded">
                    <span className="text-muted-foreground capitalize">
                      {key.replace(/_/g, ' ')}:
                    </span>
                    <span className="text-foreground font-medium truncate ml-2 max-w-[150px]">
                      {String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Help Text */}
          <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg">
            <p className="text-xs text-muted-foreground">
              💡 <span className="font-medium">Tip:</span> Connect this component to others by dragging from the connection points
            </p>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Settings className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="font-medium text-foreground mb-2">No Component Selected</h3>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            Click on any component in the canvas to view and edit its properties
          </p>
        </div>
      )}
    </div>
  );
};
