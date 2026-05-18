import { IQuestion } from "./questionsInterface";
import { IElement } from './elementInterface'

export interface ISurveyElement extends IElement {
    sub_type: 'survey';
    questions: IQuestion[];
}

export interface IInfoElement extends IElement {
    sub_type: 'info';
    info_text: string;
    definition_of_done: string;
}

export type ITaskElement = ISurveyElement | IInfoElement;