import { IElement } from './elementInterface'

export interface IIncentiveElement extends IElement {
    sub_type: 'points';
    points_amount: number;
    League: string;
}
