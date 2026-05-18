import type { ComponentType } from 'react';

export interface ModuleData extends Record<string, unknown> {
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  category: 'trigger' | 'task' | 'incentive';
  type?: string;
  configData?: any;
}

export interface NodeData extends ModuleData {
  configData?: any;
}

export interface LoopBuilderState {
  nodes: any[];
  edges: any[];
  selectedNode: string | null;
  openDropdown: string | null;
}

export interface ModalsState {
  showTriggerModal: boolean;
  showSurveyModal: boolean;
  showInfoModal: boolean;
  currentTriggerType: string | null;
}

export interface ConfigData {
  triggerConfig?: any;
  surveyConfig?: any;
}
