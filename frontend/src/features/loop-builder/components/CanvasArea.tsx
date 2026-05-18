import React from 'react';
import {
  ReactFlow,
  ConnectionMode,
  Controls,
  Background,
  BackgroundVariant,
  MiniMap,
  ConnectionLineType,
  MarkerType
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { Node, Edge, NodeTypes } from '@xyflow/react';
import { Plus, Zap } from 'lucide-react';
import { TriggerNode } from './TriggerNode';
import { TaskNode } from './TaskNode';
import { IncentiveNode } from './IncentiveNode';

interface CanvasAreaProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: (changes: any) => void;
  onEdgesChange: (changes: any) => void;
  onConnect: (params: any) => void;
  onNodeClick: (event: any, node: Node) => void;
  onPaneClick: () => void;
  onConfigure?: (node: Node) => void;
}

export const CanvasArea: React.FC<CanvasAreaProps> = ({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodeClick,
  onPaneClick,
  onConfigure
}) => {
  // Ensure nodes have onConfigure callback in their data
  const nodesWithCallbacks = nodes.map(node => ({
    ...node,
    data: {
      ...node.data,
      onConfigure: onConfigure ? () => onConfigure(node) : undefined
    }
  }));

  // Ensure edges have proper styling
  const edgesWithStyles = edges.map(edge => ({
    ...edge,
    style: edge.style || { 
      opacity: 1,
      background:"red"
    },
    animated: true,
    type: 'default',
    markerEnd: edge.markerEnd || {
      type: MarkerType.ArrowClosed,
      width: 16,
      height: 16,
      color: '#393c3f'
    }
  }));

  const nodeTypes: NodeTypes = {
    trigger: TriggerNode,
    task: TaskNode,
    incentive: IncentiveNode
  };

  // Default edge options for n8n-like appearance
  const defaultEdgeOptions = {
    animated: true,
    style: { 
      opacity: 0.95
    },
    type: 'default',
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 16,
      height: 16,
      color: '#393c3f'
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden relative h-full">
      <ReactFlow
        nodes={nodesWithCallbacks}
        edges={edgesWithStyles}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Strict}
        connectionLineType={ConnectionLineType.SmoothStep}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView
        fitViewOptions={{
          padding: 0.2,
          includeHiddenNodes: false
        }}
        attributionPosition="bottom-left"
        onPaneClick={onPaneClick}
        snapToGrid={true}
        snapGrid={[15, 15]}
        minZoom={0.2}
        maxZoom={4}
      >
        <Controls position="top-left" showInteractive={false} />
        <MiniMap 
          position="top-right"
          nodeStrokeWidth={3}
          pannable
          zoomable
        />
        <Background 
          variant={BackgroundVariant.Dots} 
          gap={16} 
          size={1}
          color="hsl(var(--muted-foreground) / 0.2)"
        />
      </ReactFlow>
      
      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Zap className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-3">
              Build Your Growth Loop
            </h3>
            <p className="text-muted-foreground mb-2">
              Add components from the sidebar to create your sends flow
            </p>
            <p className="text-sm text-muted-foreground">
              Start with a <span className="font-semibold text-primary">Trigger</span> to define when your loop starts
            </p>
            <div className="mt-6 flex items-center justify-center space-x-2 text-xs text-muted-foreground">
              <Plus className="w-4 h-4" />
              <span>Drag and drop • Connect nodes • Configure • Deploy</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
