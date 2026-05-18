import { IElement } from './elementInterface'

export interface ITriggerOnArrivalElement extends IElement {
    sub_type: 'onArrival';
    command: string;
    command_type: 'contains' | 'equals' | 'starts_with' | 'ends_with' | 'regex';
}

export type ITriggerElement = ITriggerOnArrivalElement;