export interface IQuickReplyButtonCreationalComponent {
	type: 'QUICK_REPLY';
	text: string;
}

export interface IPhoneNumberButtonCreationalComponent {
	type: 'PHONE_NUMBER';
	text: string;
	phone_number?: string;
}

export interface IUrlButtonCreationalComponent {
	type: 'URL';
	text: string;
	url?: string;
	example?: string[];
}

export interface ICopyCodeButtonCreationalComponent {
	type: 'COPY_CODE';
	text?: string;
	example?: string | string[];
}

export type IButtonCreationalComponent =
	| IQuickReplyButtonCreationalComponent
	| IPhoneNumberButtonCreationalComponent
	| IUrlButtonCreationalComponent
	| ICopyCodeButtonCreationalComponent;

export interface IButtonsCreationalComponent {
	type: "BUTTONS"|'BUTTONS';
	buttons: IButtonCreationalComponent[];
}
