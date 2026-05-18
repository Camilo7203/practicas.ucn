import type { IBodyCreationalComponent } from './bodyComponentsInterface';
import type { IButtonCreationalComponent, IButtonsCreationalComponent } from './buttonsComponentsInterface';
import type { IBasicTextFooterCreationalComponent } from './footerComponentsInterface';
import type { IHeaderCreationalComponent } from './headersComponentsInterface';
import type { IBodySendComponent } from './bodyComponentsInterface';
export interface IMetaTemplatePayload {
  name: string;
  category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
  language: string;
  parameter_format?: 'named' | 'positional';
  components: IMetaComponent[];
}

export type IMetaComponent =
  | IHeaderCreationalComponent
  | IBodyCreationalComponent
  | IBasicTextFooterCreationalComponent
  | IButtonsCreationalComponent;

export type IMetaTemplateToSend = IBodySendComponent

export type IMetaButton = IButtonCreationalComponent;
