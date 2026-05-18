import type { Node } from '@xyflow/react';
import { useParams } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import { loopsService } from '../../services/loopsService';
import { useAuthContext } from '../../contexts/AuthContext';
import { agentsService } from '../../services/agentsService';
import { useNavigation } from '../../contexts/NavigationContext';
import type { NodeData } from '../../features/loop-builder/types';
import { ITriggerElement, ITaskElement, IIncentiveElement } from '@/interfaces/elements';
import { Toolbar } from '../../features/loop-builder/components/Toolbar';
import { elementsService } from '../../services/elements/elementsService';
import { CanvasArea } from '../../features/loop-builder/components/CanvasArea';
import { AVAILABLE_MODULES } from '../../features/loop-builder/utils/constants';
import { useLoopBuilder } from '../../features/loop-builder/hooks/useLoopBuilder';
import { SaveLoopModal } from '../../features/loop-builder/components/SaveLoopModal';
import { useLoopBuilderModals } from '../../features/loop-builder/hooks/useLoopBuilderModals';
import { ComponentsSidebar } from '../../features/loop-builder/components/ComponentsSidebar';
import { PropertiesSidebar } from '../../features/loop-builder/components/PropertiesSidebar';
// Import modals for configuration
import InfoConfigModal from '../../features/loop-builder/components/modals/InfoConfigModal';
import SurveyConfigModal from '../../features/loop-builder/components/modals/SurveyConfigModal';
import OnArrivalConfigModal from '../../features/loop-builder/components/modals/OnArrivalConfigModal';
import PointsIncentiveConfigModal from '../../features/loop-builder/components/modals/PointsIncentiveConfigModal';

export const LoopBuilderPage: React.FC = () => {
  const { user } = useAuthContext();
  const { navigate } = useNavigation();
  const { loopId } = useParams<{ loopId?: string }>();
  
  // UI State
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Loop builder state
  const {
    nodes,
    edges,
    selectedNode,
    openDropdown,
    setNodes,
    setEdges,
    setSelectedNode,
    setOpenDropdown,
    addNode,
    deleteNode,
    updateNodeData,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onNodeClick
  } = useLoopBuilder();

  // Modals state
  const {
    showTriggerModal,
    showSurveyModal,
    showInfoModal,
    // currentTriggerType, // Not used with OnArrivalConfigModal
    openTriggerModal,
    closeTriggerModal,
    openSurveyModal,
    closeSurveyModal,
    openInfoModal,
    closeInfoModal
  } = useLoopBuilderModals();

  // Additional state
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showPointsIncentiveModal, setShowPointsIncentiveModal] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  // const [elements, setElements] = useState<any[]>([]); // Not currently used
  const [agents, setAgents] = useState<any[]>([]);
  // const [loadingElements, setLoadingElements] = useState(false); // Not currently used
  const [editingLoopId, setEditingLoopId] = useState<string | null>(null);

  // Load elements and agents on mount
  useEffect(() => {
    // loadElements(); // Not currently used
    loadAgents();
    loadLoopIfFromUrl();
  }, [loopId]); // Recargar cuando cambia loopId en la URL

  // Track changes
  useEffect(() => {
    if (nodes.length > 0 || edges.length > 0) {
      setHasUnsavedChanges(true);
    }
  }, [nodes, edges]);

  const loadLoopIfFromUrl = () => {
    // Si hay un loopId en la URL (path parameter), cargar ese loop
    if (loopId && loopId.length > 0) {
      console.log('📍 Loading loop from URL path parameter:', loopId);
      setEditingLoopId(loopId);
      loadLoopForEdit(loopId);
    }
    // También mantener compatibilidad con query parameter para retrocompatibilidad
    else {
      const urlParams = new URLSearchParams(window.location.search);
      const editId = urlParams.get('edit');
      if (editId) {
        console.log('📍 Loading loop from query parameter:', editId);
        setEditingLoopId(editId);
        loadLoopForEdit(editId);
      }
    }
  };

  const loadAgents = async () => {
    try {
      const response = await agentsService.getAgents();
      setAgents(response.data.agents || []);
    } catch (error) {
      console.error('Error loading agents:', error);
    }
  };

  const loadLoopForEdit = async (loopId: string) => {
    try {
      console.log('📡 Fetching loop with ID:', loopId);
      const response = await loopsService.getLoop(loopId);
      const loop = response.data.loop;
      
      console.log('🔄 Loop loaded for editing:', loop);
      console.log('📊 Backend nodes data:', loop.nodes);
      console.log('🔗 Backend edges data:', loop.edges);

      // Verificar si hay datos
      if (!loop.nodes || loop.nodes.length === 0) {
        console.warn('⚠️ No nodes found in loop! Loop data:', loop);
        alert('This loop has no nodes. It may be empty or corrupted.');
        return;
      }

      // Reconstruir nodes desde loop.nodes
      if (loop.nodes && Array.isArray(loop.nodes)) {
        const reconstructedNodes = loop.nodes.map((nodeData: any, index: number) => {
          console.log(`🔍 Processing node ${index}:`, {
            rawNodeData: nodeData,
            id: nodeData.id,
            type: nodeData.type,
            category: nodeData.data?.category,
            dataType: nodeData.data?.type,
            hasConfigData: !!nodeData.data?.configData,
            configDataPreview: nodeData.data?.configData ? JSON.stringify(nodeData.data.configData).substring(0, 100) : 'none'
          });

          // Determinar el tipo de nodo para ReactFlow
          // Prioridad: nodeData.data.category > nodeData.type
          const nodeType = nodeData.data?.category || nodeData.type || 'default';

          const reconstructedNode = {
            id: nodeData.id,
          type: nodeType, // Este es el tipo de ReactFlow (trigger, task)
          position: nodeData.position || { x: 100, y: 100 },
          data: {
            category: nodeData.data?.category,
            title: nodeData.data?.title,
            description: nodeData.data?.description,
            type: nodeData.data?.type, // Este es el sub-tipo (onArrival, survey, info)
              configData: nodeData.data?.configData,
              elementId: nodeData.data?.elementId,
              // También preservar el objeto element si existe
              element: nodeData.data?.element
            }
          };

          console.log(`✅ Reconstructed node ${index}:`, reconstructedNode);
          return reconstructedNode;
        });

        // Reconstruir edges desde loop.edges
        const reconstructedEdges = (loop.edges || []).map((edgeData: any, index: number) => {
          console.log(`🔗 Processing edge ${index}:`, edgeData);
          
          return {
            id: edgeData.id,
            source: edgeData.source,
            target: edgeData.target,
            animated: edgeData.animated !== undefined ? edgeData.animated : true,
            type: edgeData.type || 'smoothstep',
            style: edgeData.style || { strokeWidth: 2, opacity: 0.95 },
            markerEnd: edgeData.markerEnd
          };
        });

        // ✅ Actualizar el estado con los nodos y edges reconstruidos
        console.log('✅ Final reconstructed nodes:', reconstructedNodes);
        console.log('✅ Final reconstructed edges:', reconstructedEdges);
        console.log('📋 Nodes config summary:', reconstructedNodes.map(n => ({
          id: n.id,
          type: n.type,
          category: n.data.category,
          dataType: n.data.type,
          hasConfigData: !!n.data.configData,
          configKeys: n.data.configData ? Object.keys(n.data.configData) : []
        })));
        
        setNodes(reconstructedNodes as any);
        setEdges(reconstructedEdges);
        
        console.log('🎉 Loop loaded successfully with', reconstructedNodes.length, 'nodes and', reconstructedEdges.length, 'edges');
      } else {
        console.warn('⚠️ No nodes found in loop data');
      }
    } catch (error) {
      console.error('❌ Error loading loop:', error);
      alert('Failed to load loop for editing: ' + (error as any).message);
    }
  };

  const validateLoopGraph = (): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // 1. Verificar que existe al menos un trigger
    const triggerNodes = nodes.filter(n => n.data?.category === 'trigger');
    if (triggerNodes.length === 0) {
      errors.push('Your loop must have at least one trigger component');
    } else if (triggerNodes.length > 1) {
      errors.push('Your loop can only have one trigger component');
    }

    // 2. Verificar que todos los nodos tienen configData completo
    for (const node of nodes) {
      const category = node.data?.category;
      const type = node.data?.type;
      const configData = node.data?.configData;

      if (!configData) {
        errors.push(`Node "${node.data?.title || 'Unnamed'}" needs to be configured`);
        continue;
      }

      // Validaciones específicas por tipo
      if (category === 'trigger' && type === 'onArrival') {
        if (!configData.name || !configData.command) {
          errors.push(`Trigger "${node.data?.title || 'Unnamed'}" is missing required fields (name, command)`);
        }
      } else if (category === 'task') {
        if (type === 'info') {
          if (!configData.name || !configData.info_text) {
            errors.push(`Info task "${node.data?.title || 'Unnamed'}" is missing required fields (name, info_text)`);
          }
        } else if (type === 'survey') {
          if (!configData.name || !configData.questions || configData.questions.length === 0) {
            errors.push(`Survey "${node.data?.title || 'Unnamed'}" is missing required fields (name, questions)`);
          }
        }
      } else if (category === 'incentive') {
        if (type === 'points') {
          if (!configData.name || !configData.points_amount || !configData.league) {
            errors.push(`Points Incentive "${node.data?.title || 'Unnamed'}" is missing required fields (name, points_amount, league)`);
          }
        }
      }
    }

    // 3. Verificar que todos los nodos están conectados (excepto el trigger que solo debe tener salidas)
    const connectedNodeIds = new Set<string>();
    
    edges.forEach(edge => {
      connectedNodeIds.add(edge.source);
      connectedNodeIds.add(edge.target);
    });

    const triggerNode = nodes.find(n => n.data?.category === 'trigger');
    for (const node of nodes) {
      // El trigger solo debe tener conexiones salientes
      if (node.id === triggerNode?.id) {
        const hasOutgoing = edges.some(e => e.source === node.id);
        if (!hasOutgoing) {
          errors.push(`Trigger must be connected to at least one component`);
        }
      } else {
        // Los demás nodos deben estar conectados de alguna forma
        if (!connectedNodeIds.has(node.id)) {
          errors.push(`Node "${node.data?.title || 'Unnamed'}" is not connected to the loop`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  };

  const createAllElements = async (): Promise<Map<string, string>> => {
    const elementIdMap = new Map<string, string>(); // tempId -> realId
    const createdElementIds: string[] = []; // Para rollback en caso de error

    try {
      // Crear elementos en el orden correcto: triggers primero, luego tasks, luego incentives
      const triggerNodes = nodes.filter(n => n.data?.category === 'trigger');
      const taskNodes = nodes.filter(n => n.data?.category === 'task');
      const incentiveNodes = nodes.filter(n => n.data?.category === 'incentive');
      console.log('🔄 Creating elements:', {
        triggerCount: triggerNodes.length,
        taskCount: taskNodes.length,
        incentiveCount: incentiveNodes.length,
      });

      // Función auxiliar para crear un elemento
      const createElement = async (node: Node<NodeData>) => {
        const configData = node.data?.configData;
        const category = node.data?.category;
        const type = node.data?.type;

        if (!configData) {
          throw new Error(`Node "${node.data?.title || 'Unnamed'}" has no configuration data`);
        }
        switch (category) {
          case 'trigger':
            if (type === 'onArrival') {
              const triggerPayload: ITriggerElement = {
                id: '', // El backend asignará el ID real
                organization: '', // El backend asignará la organización basada en el token
                name: configData.name,
                description: configData.description || '',
                type: 'trigger',
                sub_type: 'onArrival',
                checkpoint_name: configData.checkpoint_name || '',
                command: configData.command,
                command_type: configData.command_type,
                configuration: configData.configuration || {},
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              };
              const response = await elementsService.createTrigger(triggerPayload);
              const elementId = response?.element.id;
              if (!elementId) {
                throw new Error(`Failed to create trigger element for node "${node.data?.title || 'Unnamed'}"`);
              }
              elementIdMap.set(node.id, elementId);
              createdElementIds.push(elementId);
              return elementId;
            }
            break;
          case 'task':
            if (type === 'info') {
              const infoPayload: ITaskElement = {
                id: '', // El backend asignará el ID real
                organization: '', // El backend asignará la organización basada en el token
                name: configData.name,
                description: configData.description || '',
                type: 'task',
                sub_type: 'info',
                checkpoint_name: configData.checkpoint_name || '',
                info_text: configData.info_text || '',
                definition_of_done: configData.definition_of_done || '',
                configuration: configData.configuration || {},
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              };
              const response = await elementsService.createInfo(infoPayload);
              const elementId = response?.element.id;
              if (!elementId) {
                throw new Error(`Failed to create info task element for node "${node.data?.title || 'Unnamed'}"`);
              }
              elementIdMap.set(node.id, elementId);
              createdElementIds.push(elementId);
              return elementId;
            } else if (type === 'survey') {
              const surveyPayload: ITaskElement = {
                id: '', // El backend asignará el ID real
                organization: '', // El backend asignará la organización basada en el token
                name: configData.name,
                description: configData.description || '',
                type: 'task',
                sub_type: 'survey',
                checkpoint_name: configData.checkpoint_name || '',
                questions: configData.questions || [],
                configuration: configData.configuration || {},
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              };
              const response = await elementsService.createSurvey(surveyPayload);
              const elementId = response?.element.id;
              if (!elementId) {
                throw new Error(`Failed to create survey task element for node "${node.data?.title || 'Unnamed'}"`);
              }
              elementIdMap.set(node.id, elementId);
              createdElementIds.push(elementId);
              return elementId;
            }
            break;
          case 'incentive':
            if (type === 'points') {
              const incentivePayload: IIncentiveElement = {
                id: '', // El backend asignará el ID real
                organization: '', //
                name: configData.name,
                description: configData.description || '',
                type: 'incentive',
                sub_type: 'points',
                checkpoint_name: configData.checkpoint_name || '',
                points_amount: configData.points_amount,
                League: configData.league,
                configuration: configData.configuration || {},
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              };
              const response = await elementsService.createIncentive(incentivePayload);
              const elementId = response?.element.id;
              if (!elementId) {
                throw new Error(`Failed to create points incentive element for node "${node.data?.title || 'Unnamed'}"`);
              }
              elementIdMap.set(node.id, elementId);
              createdElementIds.push(elementId);
              return elementId;
            }
            break;
          default:
            throw new Error(`Unknown category "${category}" for node "${node.data?.title || 'Unnamed'}"`);
          }
      };

      // Crear triggers
      for (const node of triggerNodes) {
        await createElement(node);
      }

      // Crear tasks
      for (const node of taskNodes) {
        await createElement(node);
      }
      
      for (const node of incentiveNodes) {
        await createElement(node);
      }



      console.log('✨ All elements created successfully:', Array.from(elementIdMap.entries()));
      return elementIdMap;

    } catch (error) {
      // Rollback: intentar eliminar elementos creados
      console.error('❌ Error creating elements, attempting rollback:', error);
      
      for (const elementId of createdElementIds) {
        try {
          // TODO: Implementar método deleteElement en elementsService si no existe
          await fetch(`${elementsService['baseUrl']}/campaigns/elements/${elementId}`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            }
          });
        } catch (deleteError) {
          console.error(`Failed to delete element ${elementId} during rollback:`, deleteError);
        }
      }

      throw error;
    }
  };

  const handleAddNode = (type: keyof typeof AVAILABLE_MODULES, template: any) => {
    addNode(type, template);
    setOpenDropdown(null);
  };

  const handleDeleteNode = (nodeId: string) => {
    if (confirm('Are you sure you want to delete this component?')) {
      deleteNode(nodeId);
    }
  };

  const handleConfigureNode = (node: Node) => {
    // ✅ CRÍTICO: Establecer el nodo seleccionado ANTES de abrir el modal
    console.log('⚙️ Configuring node:', {
      id: node.id,
      category: node.data?.category,
      title: node.data?.title,
      currentConfigData: node.data?.configData
    });
    
    console.log('📋 Current state of all nodes:', nodes.map(n => ({
      id: n.id,
      category: n.data?.category,
      hasConfigData: !!n.data?.configData
    })));
    
    setSelectedNode(node.id);
    
    const category = node.data?.category as string;
    const nodeType = node.data?.type as string;

    if (category === 'trigger') {
      openTriggerModal(nodeType || '');
    } else if (category === 'task') {
      if (nodeType === 'survey') {
        openSurveyModal();
      } else if (nodeType === 'info') {
        openInfoModal();
      }
    } else if (category === 'incentive') {
      if (nodeType === 'points') {
        setShowPointsIncentiveModal(true);
      }
    }
  };

  const handleSaveConfig = (configData: any) => {
    console.log('💾 Saving config for node:', selectedNode);
    console.log('📝 Config data to save:', configData);
    
    if (selectedNode) {
      // Verificar que el nodo existe
      const node = nodes.find(n => n.id === selectedNode);
      if (node) {
        console.log('✅ Node found:', {
          id: node.id,
          category: node.data?.category,
          currentConfigData: node.data?.configData
        });
        
        updateNodeData(selectedNode, { configData });
      } else {
        console.error('❌ Node not found with id:', selectedNode);
      }
    } else {
      console.error('❌ No node selected when trying to save config');
    }
    
    closeTriggerModal();
    closeSurveyModal();
    closeInfoModal();
    setShowPointsIncentiveModal(false);
  };

  const handleSave = () => {
    setShowSaveModal(true);
  };

  const handlePreview = () => {
    console.log('Preview loop:', { nodes, edges });
    alert('Preview functionality coming soon!');
  };

  const handleDeploy = async () => {
    if (nodes.length === 0) {
      alert('Please add at least one component to your loop before deploying.');
      return;
    }

    const triggerNode = nodes.find(n => n.data?.category === 'trigger');
    if (!triggerNode) {
      alert('Your loop must have a trigger component to start the flow.');
      return;
    }

    handleSave();
  };

  const handleSaveLoop = async (loopData: {
    name: string;
    agent: string;
    objective: string;
  }) => {
    try {
      // 1. Validar el grafo antes de continuar
      const validation = validateLoopGraph();
      if (!validation.valid) {
        throw new Error(`Validation failed:\n${validation.errors.join('\n')}`);
      }

      // 2. Crear todos los elementos en el backend
      const elementIdMap = await createAllElements();

      // 3. Encontrar el trigger node y obtener su ID real
      const triggerNode = nodes.find(n => n.data?.category === 'trigger');
      if (!triggerNode) {
        throw new Error('Loop must have a trigger');
      }
      const triggerElementId = elementIdMap.get(triggerNode.id);
      if (!triggerElementId) {
        throw new Error('Failed to create trigger element');
      }

      // 4. Transformar nodos al formato del backend usando IDs reales
      console.log('🔍 All nodes before mapping:', nodes.map(n => ({
        id: n.id,
        category: n.data?.category,
        type: n.type,
        title: n.data?.title,
        hasElementId: elementIdMap.has(n.id)
      })));

      console.log('🗺️ Element ID Map:', Array.from(elementIdMap.entries()));

      const preparedNodes = nodes.map(node => {
        const realElementId = elementIdMap.get(node.id);
        if (!realElementId) {
          console.error(`❌ Missing element ID for node:`, {
            nodeId: node.id,
            category: node.data?.category,
            title: node.data?.title
          });
          throw new Error(`Failed to get element ID for node ${node.id}`);
        }

        const nodeSettings = {
          nodeId: node.id,
          position: node.position,
          type: node.type || 'default', // Tipo de ReactFlow (trigger, task, incentive)
          category: node.data?.category, // Categoría del nodo
          title: node.data?.title,
          description: node.data?.description,
          dataType: node.data?.type, // Sub-tipo específico (onArrival, survey, info, points)
          configData: node.data?.configData // ⭐ CONFIGURACIÓN COMPLETA DEL NODO
        };

        console.log(`📦 Preparing node ${node.id} for save:`, {
          category: node.data?.category,
          reactFlowType: node.type,
          dataType: node.data?.type,
          realElementId,
          hasConfigData: !!node.data?.configData,
          configDataKeys: node.data?.configData ? Object.keys(node.data.configData) : []
        });

        return {
          elementId: realElementId,
          settings: nodeSettings
        };
      });

      console.log('✅ Prepared nodes for backend:', preparedNodes.map(n => ({
        elementId: n.elementId,
        category: n.settings.category,
        dataType: n.settings.dataType
      })));

      // 5. Transformar edges al formato del backend usando IDs reales
      const preparedEdges = edges.map(edge => {
        const sourceNode = nodes.find(n => n.id === edge.source);
        const targetNode = nodes.find(n => n.id === edge.target);
        
        const sourceElementId = sourceNode ? elementIdMap.get(sourceNode.id) : null;
        const targetElementId = targetNode ? elementIdMap.get(targetNode.id) : null;

        if (!sourceElementId || !targetElementId) {
          throw new Error(`Failed to get element IDs for edge ${edge.id}`);
        }
        
        return {
          source_element_id: sourceElementId,
          target_element_id: targetElementId,
          settings: {
            edgeId: edge.id,
            sourceNodeId: edge.source,
            targetNodeId: edge.target,
            animated: edge.animated,
            type: edge.type,
            style: edge.style,
            markerEnd: edge.markerEnd
          }
        };
      });

      // 6. Crear o actualizar el loop
      const payload = {
        name: loopData.name,
        default_loop: false,
        agent: loopData.agent,
        objective: loopData.objective,
        trigger: triggerElementId,
        created_by: user?.mongoId || user?.id || '',
        nodes: preparedNodes,
        edges: preparedEdges
      };

      if (editingLoopId) {
        await loopsService.updateLoop(editingLoopId, {
          name: loopData.name,
          nodes: preparedNodes,
          edges: preparedEdges
        });
        console.log('📝 Loop updated successfully');
      } else {
        await loopsService.createLoop(payload);
        console.log('✅ Loop created successfully with payload:', payload);
      }

      setHasUnsavedChanges(false);
      setShowSaveModal(false);
      
      alert('Loop saved successfully!');
      navigate('/app/campaigns');
    } catch (error: any) {
      console.error('❌ Error saving loop:', error);
      alert(`Error saving loop: ${error.message || String(error)}`);
      throw error;
    }
  };

  const handlePaneClick = () => {
    setSelectedNode(null);
  };

  return (
    <div className="min-h-screen bg-background p-4 xl:p-6">
      <div className="max-w-[2000px] mx-auto space-y-6">
        <Toolbar
          onSave={handleSave}
          onPreview={handlePreview}
          onDeploy={handleDeploy}
          hasUnsavedChanges={hasUnsavedChanges}
        />

        <div className="flex gap-6 h-[calc(100vh-200px)]">
          {/* Left Sidebar - Collapsible Components */}
          <div
            className={`bg-card border border-border rounded-xl overflow-hidden transition-all duration-300 ease-in-out ${
              sidebarOpen ? 'w-80' : 'w-16'
            }`}
          >
            {/* Sidebar Toggle Button */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              {sidebarOpen && (
                <h2 className="text-lg font-semibold text-foreground">Components</h2>
              )}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-1.5 hover:bg-muted rounded-lg transition-colors duration-200"
              >
                {sidebarOpen ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </button>
            </div>

            {/* Sidebar Content */}
            <div className={`overflow-y-auto h-full ${sidebarOpen ? 'p-6' : 'p-3'}`}>
              {sidebarOpen && (
                <ComponentsSidebar
                  openDropdown={openDropdown}
                  onDropdownToggle={setOpenDropdown}
                  onAddNode={handleAddNode}
                />
              )}
            </div>
          </div>

          {/* Canvas Area - Flexible */}
          <div className="flex-1">
            <CanvasArea
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={onNodeClick}
              onPaneClick={handlePaneClick}
              onConfigure={handleConfigureNode}
            />
          </div>

          {/* Right Sidebar - Properties */}
          <div className="w-80 bg-card border border-border rounded-xl overflow-y-auto">
            <PropertiesSidebar
              selectedNode={selectedNode}
              nodes={nodes}
              onDeleteNode={handleDeleteNode}
              onConfigureNode={handleConfigureNode}
            />
          </div>
        </div>
      </div>

      {/* Configuration Modals */}
      {showTriggerModal && (
        <OnArrivalConfigModal
          onClose={closeTriggerModal}
          onSubmit={handleSaveConfig}
          initialData={selectedNode ? nodes.find(n => n.id === selectedNode)?.data?.configData : undefined}
        />
      )}

      {showSurveyModal && (
        <SurveyConfigModal
          onClose={closeSurveyModal}
          onSubmit={handleSaveConfig}
          initialData={selectedNode ? nodes.find(n => n.id === selectedNode)?.data?.configData : undefined}
        />
      )}

      {showInfoModal && (
        <InfoConfigModal
          onClose={closeInfoModal}
          onSubmit={handleSaveConfig}
          initialData={selectedNode ? nodes.find(n => n.id === selectedNode)?.data?.configData : undefined}
        />
      )}

      {showPointsIncentiveModal && (
        <PointsIncentiveConfigModal
          onClose={() => setShowPointsIncentiveModal(false)}
          onSubmit={handleSaveConfig}
          initialData={selectedNode ? nodes.find(n => n.id === selectedNode)?.data?.configData : undefined}
        />
      )}

      {/* Save Loop Modal */}
      {showSaveModal && (
        <SaveLoopModal
          isOpen={showSaveModal}
          onClose={() => setShowSaveModal(false)}
          onSave={handleSaveLoop}
          agents={agents}
          editingLoopId={editingLoopId}
        />
      )}
    </div>
  );
};

export default LoopBuilderPage;
