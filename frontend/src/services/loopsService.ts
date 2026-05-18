import { API_CONFIG } from '@/config';

// Interface definitions for Loops
export interface LoopAgent {
  id: string;
  name: string;
  description?: string;
}

export interface LoopTrigger {
  id: string;
  type: string;
  name: string;
}

export interface LoopCreatedBy {
  id: string;
  name: string;
  email?: string;
}

export interface LoopElement {
  id: string;
  name: string;
  description: string;
  type: 'task' | 'incentive' | 'function' | 'trigger';
  sub_type: string;
  checkpoint_name: string;
  trigger_type?: string; // Only for trigger elements
}

// Node structure for ReactFlow
export interface LoopNode {
  id?: string;
  type?: string;
  position?: { x: number; y: number };
  data?: {
    element?: LoopElement;
    elementId?: string;
  };
  elementId?: string; // Para compatibilidad con backend
  settings?: any; // Para el formato que enviamos al backend
  style?: Record<string, any>;
  selected?: boolean;
}

// Edge structure for ReactFlow (compatible con Edge de @xyflow/react)
export interface LoopEdge {
  id?: string;
  source?: string;
  target?: string;
  source_element_id?: string; // Para formato backend
  target_element_id?: string; // Para formato backend
  settings?: any; // Para formato backend
  animated?: boolean;
  type?: string;
  style?: any;
  label?: any; // ReactNode en ReactFlow
  labelStyle?: any;
  markerEnd?: any; // EdgeMarkerType from ReactFlow
  markerStart?: any; // EdgeMarkerType from ReactFlow
  [key: string]: any; // Permitir propiedades adicionales
}

export interface LoopData {
  id: string;
  name: string;
  default_loop: boolean;
  agent: LoopAgent;
  objective: 'engagement' | 'retention' | 'conversion' | 'education' | 'feedback';
  trigger_type: 'onClick' | 'scheduled' | 'webhook' | 'onArrival' | 'idle' | 'onTag';
  trigger: LoopTrigger;
  created_by: LoopCreatedBy;
  elements: LoopElement[]; // Mantener para retrocompatibilidad
  nodes: LoopNode[]; // Nodes del grafo
  edges: LoopEdge[]; // Edges del grafo
  created_at: string;
  updated_at: string;
  status: 'active' | 'inactive' | 'draft';
  tasks_count: number;
  incentives_count: number;
}

export interface LoopRegisterPayload {
  name: string;
  default_loop?: boolean;
  agent: string;
  objective: string;
  trigger: string;
  created_by: string;
  nodes?: LoopNode[];
  edges?: LoopEdge[];
}

export interface LoopsListResponse {
  loops: LoopData[];
  total: number;
}

export interface LoopResponse {
  loop: LoopData;
}

export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  error?: string;
}

class LoopsService {
  private baseUrl = API_CONFIG.BASE_URL;

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const token = localStorage.getItem('access_token');
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return { data };
  }

  /**
   * Get all loops for the current user/organization
   */
  public async getLoops(): Promise<ApiResponse<LoopsListResponse>> {
    return this.makeRequest<LoopsListResponse>('/campaigns/loops');
  }

  /**
   * Get a specific loop by ID
   */
  public async getLoop(loopId: string): Promise<ApiResponse<LoopResponse>> {
    return this.makeRequest<LoopResponse>(`/campaigns/loop/${loopId}`);
  }

  /**
   * Create a new loop
   */
  public async createLoop(payload: LoopRegisterPayload): Promise<ApiResponse<LoopData>> {
    console.log('🚀 Sending loop creation request with:', {
      name: payload.name,
      nodes: payload.nodes?.length || 0,
      edges: payload.edges?.length || 0,
      agent: payload.agent,
      trigger: payload.trigger
    });
    
    return this.makeRequest<LoopData>('/campaigns/loop/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  /**
   * Update an existing loop (incluye nodes y edges)
   */
  public async updateLoop(
    loopId: string, 
    data: Partial<LoopRegisterPayload>
  ): Promise<ApiResponse<LoopData>> {
    // Asegurar que nodes y edges se envíen si están presentes
    const payload = {
      ...data,
      ...(data.nodes && { nodes: data.nodes }),
      ...(data.edges && { edges: data.edges })
    };
    
    return this.makeRequest<LoopData>(`/campaigns/loop/${loopId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  /**
   * Delete a loop
   */
  public async deleteLoop(loopId: string): Promise<ApiResponse<{ message: string }>> {
    return this.makeRequest<{ message: string }>(`/campaigns/loop/${loopId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Get loop statistics for dashboard
   */
  public async getLoopStats(): Promise<ApiResponse<{
    total: number;
    active: number;
    inactive: number;
    by_objective: Record<string, number>;
    by_trigger_type: Record<string, number>;
  }>> {
    // For now, we'll calculate this from the loops list
    // In the future, this could be a dedicated endpoint
    const { data } = await this.getLoops();
    const loops = data.loops;

    const stats = {
      total: loops.length,
      active: loops.filter(loop => loop.status === 'active').length,
      inactive: loops.filter(loop => loop.status === 'inactive').length,
      by_objective: loops.reduce((acc, loop) => {
        acc[loop.objective] = (acc[loop.objective] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      by_trigger_type: loops.reduce((acc, loop) => {
        acc[loop.trigger_type] = (acc[loop.trigger_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };

    return { data: stats };
  }
}

export const loopsService = new LoopsService();
export default LoopsService;