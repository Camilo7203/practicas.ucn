export interface IBasicTextBodyCreationalComponent {
	type: "BODY";
	text: string;
}

export interface IBodyTextWithParameterCreationalComponent extends IBasicTextBodyCreationalComponent {
	example: {
		body_text_named_params: Array<{
			param_name: string;
			example: string;
		}>;
	}
}

export interface IBodyTextWithParameterPositionalCreationalComponent extends IBasicTextBodyCreationalComponent {
	example: {
		body_text: string[];
	}
}

export interface IBodySendComponent {
	type: "BODY" | "BUTTONS" | "FOOTER" | "HEADER";
	parameters: IBodySendComponentWithParameterNamed[] | IBodySendComponentWithParameterPositional[];
}

export interface IBodySendComponentWithParameterNamed {
	type:"text",
	parameter_name: string;
	text: string;
}

export interface IBodySendComponentWithParameterPositional {
	type:"text",
	text: string;
}
export type IBodyCreationalComponent = IBasicTextBodyCreationalComponent 
    | IBodyTextWithParameterCreationalComponent 
    | IBodyTextWithParameterPositionalCreationalComponent;