import React from 'react';
import { Settings, Zap, Bell, Inbox } from 'lucide-react';
import { Handle, Position } from '@xyflow/react';
import type { NodeData } from '../types';

interface NodeProps {
  data: NodeData & { onConfigure?: () => void };
  selected: boolean;
}

// Mapa de iconos por tipo de trigger
const TRIGGER_ICONS: Record<string, React.ComponentType<any>> = {
  'onArrival': Bell,
  'onClick': Zap,
  'scheduled': Inbox,
};

export const TriggerNode: React.FC<NodeProps> = ({ data, selected }) => {
  // Usar el icono proporcionado o buscar uno basado en el tipo
  const Icon = data.icon || (data.type ? TRIGGER_ICONS[data.type] : undefined) || Bell;
  
  return (
    <div className={`
      min-w-[280px] bg-white
      border-2 ${selected ? 'border-primary shadow-xl shadow-primary/20' : 'border-border'} 
      rounded-xl p-4 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 
      hover:scale-105 cursor-pointer
    `}>
      <div className="flex items-center space-x-3 mb-3">
        <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center">
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-foreground text-sm">{data.title}</h3>
          <p className="text-xs text-muted-foreground">{data.description}</p>
        </div>
      </div>

      <div className="flex justify-between items-center gap-2">
        <div className="flex items-center space-x-2 text-xs">
          <Settings className="w-3 h-3 text-primary" />
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
            className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200"
          >
            Configure
          </button>
        )}

        <div className="bg-primary/10 border border-primary/20 rounded-lg p-2">
          <span className="text-primary text-xs font-medium uppercase">Trigger</span>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="w-5 h-5 bg-primary border-2 border-white"
      />
    </div>
  );
};
