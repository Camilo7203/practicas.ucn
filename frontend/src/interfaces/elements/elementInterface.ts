import { IQuestion } from './questionsInterface';

export interface IElement {
  id: string;
  name: string;
  description: string;
  type: 'trigger' | 'task' | 'incentive';
  checkpoint_name: string;
  created_at: string;
  updated_at: string;
  organization: string;
  configuration: Record<string, any>;
  default_next_element_id?: string;
}

export interface ICreateElementData {
  name: string;
  description: string;
  type: 'trigger' | 'task' | 'incentive';
  sub_type: 'onArrival' | 'survey' | 'info' | 'quiz' | 'points';
  checkpoint_name: string;
  configuration?: Record<string, any>;
  default_next_element_id?: string;
  // Para triggers onArrival
  command?: string;
  command_type?: 'contains' | 'equals' | 'starts_with' | 'ends_with' | 'regex';
  // Para tasks survey y quiz
  questions?: IQuestion[];
  // Para task info
  info_text?: string;
  definition_of_done?: string;
  // Para task quiz
  options?: Record<string, any>;
  // Para incentive points
  points_amount?: number;
  league?: string;
}

export interface IElementsResponse {
  elements: IElement[];
  triggers: IElement[];
  tasks: IElement[];
  total: number;
}