import { useState, useCallback } from 'react';
import type { Node, Edge, NodeChange, EdgeChange, Connection } from '@xyflow/react';
import { applyNodeChanges, applyEdgeChanges } from '@xyflow/react';
import type { NodeData } from '../types';

export const useLoopBuilder = () => {
  const [nodes, setNodes] = useState<Node<NodeData>[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // React Flow handlers
  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds) as Node<NodeData>[]),
    []
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onConnect = useCallback(
    (params: Connection) => {
      const edge = {
        ...params,
        id: `${params.source}-${params.target}`,
        animated: true,
        style: { strokeWidth: 2, opacity: 0.95 },
      };
      setEdges((eds) => [...eds, edge]);
    },
    []
  );

  const onNodeClick = useCallback((_event: any, node: Node) => {
    setSelectedNode(node.id);
  }, []);

  const addNode = useCallback((type: string, template: any) => {
    const newNode: Node<NodeData> = {
      id: `${type}-${Date.now()}`,
      type,
      position: { x: Math.random() * 300, y: Math.random() * 300 },
      data: {
        ...template,
        category: type,
        configData: undefined // Inicializar sin configuración
      }
    };
    
    console.log('➕ Adding new node:', {
      id: newNode.id,
      type,
      category: newNode.data.category,
      title: newNode.data.title
    });
    
    setNodes((nds) => [...nds, newNode]);
  }, []);

  const deleteNode = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter(n => n.id !== nodeId));
    setEdges((eds) => eds.filter(e => e.source !== nodeId && e.target !== nodeId));
    if (selectedNode === nodeId) {
      setSelectedNode(null);
    }
  }, [selectedNode]);

  const updateNodeData = useCallback((nodeId: string, data: any) => {
    console.log('🔄 Updating node data:', { nodeId, newData: data });
    
    setNodes((nds) => {
      const updatedNodes = nds.map((node) => {
        if (node.id === nodeId) {
          const updatedNode = { 
            ...node, 
            data: { 
              ...node.data, 
              ...data 
            } 
          };
          console.log('✅ Node updated:', {
            nodeId: node.id,
            oldData: node.data,
            newData: data,
            finalData: updatedNode.data
          });
          return updatedNode;
        }
        return node;
      });
      
      console.log('📊 All nodes after update:', updatedNodes.map(n => ({
        id: n.id,
        category: n.data?.category,
        hasConfigData: !!n.data?.configData
      })));
      
      return updatedNodes;
    });
  }, []);

  return {
    // State
    nodes,
    edges,
    selectedNode,
    openDropdown,
    // Setters (para cargar loops existentes)
    setNodes,
    setEdges,
    // Actions
    setSelectedNode,
    setOpenDropdown,
    addNode,
    deleteNode,
    updateNodeData,
    // React Flow handlers
    onNodesChange,
    onEdgesChange,
    onConnect,
    onNodeClick
  };
};
