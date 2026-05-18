import React from 'react';
import { Settings, Gift, Star, Zap } from 'lucide-react';
import { Handle, Position } from '@xyflow/react';
import type { NodeData } from '../types';

interface NodeProps {
  data: NodeData & { onConfigure?: () => void };
  selected: boolean;
}

// Mapa de iconos por tipo de incentivo
const INCENTIVE_ICONS: Record<string, React.ComponentType<any>> = {
  'points': Gift,
  'badge': Star,
  'reward': Zap,
};

export const IncentiveNode: React.FC<NodeProps> = ({ data, selected }) => {
  // Usar el icono proporcionado o buscar uno basado en el tipo
  const Icon = data.icon || (data.type ? INCENTIVE_ICONS[data.type] : undefined) || Gift;
  
  return (
    <div className={`
      min-w-[280px] bg-white
      border-2 ${selected ? 'border-green-500 shadow-xl shadow-green-500/20' : 'border-border'} 
      rounded-xl p-4 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/10 
      hover:scale-105 cursor-pointer
    `}>
      <div className="flex items-center space-x-3 mb-3">
        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-foreground text-sm">{data.title}</h3>
          <p className="text-xs text-muted-foreground">{data.description}</p>
        </div>
      </div>

      <div className="flex justify-between items-center gap-2">
        <div className="flex items-center space-x-2 text-xs">
          <Settings className="w-3 h-3 text-green-500" />
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
            className="bg-gradient-to-r from-green-500 to-green-500/80 hover:from-green-600 hover:to-green-600/80 text-white px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200"
          >
            Configure
          </button>
        )}

        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-2">
          <span className="text-green-500 text-xs font-medium uppercase">Incentive</span>
        </div>
      </div>

      <Handle
        type="target"
        position={Position.Left}
        className="w-5 h-5 bg-green-500 border-2 border-white"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-5 h-5 bg-green-500 border-2 border-white"
      />
    </div>
  );
};
