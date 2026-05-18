export interface LoopRegisterPayload {
  name: string;
  default_loop?: boolean;
  agent: string;
  objective: 'engagement' | 'retention' | 'conversion' | 'education' | 'feedback';
  trigger: string;
  tasks: string[];
  incentives?: string[];
  functions?: string[];
  created_by: string;
}

export interface LoopData {
  id: string;
  name: string;
  default_loop: boolean;
  agent: string;
  objective: 'engagement' | 'retention' | 'conversion' | 'education' | 'feedback';
  trigger: string;
  tasks: string[];
  incentives: string[];
  functions: string[];
  created_by: string;
  created_at?: string;
  updated_at?: string;
}

export interface LoopSaveData {
  name: string;
  nodes: any[];
  edges: any[];
  configuration: {
    triggers: any[];
    tasks: any[];
    incentives: any[];
    pointsSystems: any[];
  };
}

export interface SavedLoop extends LoopData {
  // Datos adicionales específicos para loops guardados
  isActive?: boolean;
  lastModified?: string;
}
