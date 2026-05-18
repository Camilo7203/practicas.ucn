export interface IBlackList {
  id: string;
  name: string;
  organization_id: string;
  agent_id: string;
  active: boolean;
  provider: 'whatsapp';
  numbers: string[];
  reason: string;
  created_at: string;
  updated_at: string;
}

export interface ICreateBlackListPayload {
  name: string;
  agent_id: string;
  numbers: string[];
  reason?: string;
  active?: boolean;
  provider?: 'whatsapp';
}

export interface IUpdateBlackListPayload {
  name?: string;
  agent_id?: string;
  numbers?: string[];
  reason?: string;
  active?: boolean;
  provider?: 'whatsapp';
}
