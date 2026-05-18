import type { IBodyCreationalComponent, IBodySendComponent } from '@/interfaces/whatsappTemplates/bodyComponentsInterface';
import type { IButtonCreationalComponent, IButtonsCreationalComponent } from '@/interfaces/whatsappTemplates/buttonsComponentsInterface';
import type { IBasicTextFooterCreationalComponent } from '@/interfaces/whatsappTemplates/footerComponentsInterface';
import type { IHeaderCreationalComponent } from '@/interfaces/whatsappTemplates/headersComponentsInterface';
export interface ITemplate {
  name: string;
  category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
  language: string;
  status?: 'APPROVED' | 'REJECTED' | 'PENDING';
  parameter_format?: 'named' | 'positional';
  components: ITemplateComponent[];
  createdAt: string;
  agent_id?: string;
  agent?: string;
  agent_name?: string;
  organization_id?: string;
  variable_count?: number;
}

export interface ITemplateToSend {
  name: string;
  language: {
    code: string;
  };
  components: ITemplateComponentToSend[];
}


export type ITemplateComponent =
  | IHeaderCreationalComponent
  | IBodyCreationalComponent
  | IBasicTextFooterCreationalComponent
  | IButtonsCreationalComponent;


  export type ITemplateComponentToSend = IBodySendComponent
  
export type ITemplateButton = IButtonCreationalComponent;
