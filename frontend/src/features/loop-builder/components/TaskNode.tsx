import React from 'react';
import { Settings, CheckSquare, HelpCircle, List } from 'lucide-react';
import { Handle, Position } from '@xyflow/react';
import type { NodeData } from '../types';

interface NodeProps {
  data: NodeData & { onConfigure?: () => void };
  selected: boolean;
}

// Mapa de iconos por tipo de tarea
const TASK_ICONS: Record<string, React.ComponentType<any>> = {
  'survey': HelpCircle,
  'info': List,
  'form': CheckSquare,
};

export const TaskNode: React.FC<NodeProps> = ({ data, selected }) => {
  // Usar el icono proporcionado o buscar uno basado en el tipo
  const Icon = data.icon || (data.type ? TASK_ICONS[data.type] : undefined) || CheckSquare;
  
  return (
    <div className={`
      min-w-[280px] bg-white
      border-2 ${selected ? 'border-blue-500 shadow-xl shadow-blue-500/20' : 'border-border'} 
      rounded-xl p-4 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10 
      hover:scale-105 cursor-pointer
    `}>
      <div className="flex items-center space-x-3 mb-3">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-foreground text-sm">{data.title}</h3>
          <p className="text-xs text-muted-foreground">{data.description}</p>
        </div>
      </div>

      <div className="flex justify-between items-center gap-2">
        <div className="flex items-center space-x-2 text-xs">
          <Settings className="w-3 h-3 text-blue-500" />
          <span className="text-muted-foreground">
            {data.configData ? 'Configured' : 'Click to configure'}
          </span>
        </div>

        {data.onConfigure && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              data.onConfigure?.();
            }}
            className="bg-gradient-to-r from-blue-500 to-blue-500/80 hover:from-blue-600 hover:to-blue-600/80 text-white px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200"
          >
            Configure
          </button>
        )}

        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-2">
          <span className="text-blue-500 text-xs font-medium uppercase">Task</span>
        </div>
      </div>

      <Handle
        type="target"
        position={Position.Left}
        className="w-5 h-5 bg-blue-500 border-2 border-white"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-5 h-5 bg-blue-500 border-2 border-white"
      />
    </div>
  );
};
