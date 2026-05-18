export interface IBasicTextHeaderCreationalComponent {
    type: "HEADER" ;
    format: 'TEXT';
    text: string;
}
export interface IHeaderTextWithParameterCreationalComponent extends IBasicTextHeaderCreationalComponent {
    example: {
        header_text_named_params: Array<{
            param_name: string;
            example: string;
        }>;
    }
}
export interface IHeaderTextWithParameterPositionalCreationalComponent extends IBasicTextHeaderCreationalComponent {
    example: {
        header_text: string[];
    }
}

export interface IHeaderMediaCreationalComponent {
    type: "HEADER";
    format: 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'GIF';
    example?: {
        header_handle: string[];
    }
}

export interface IHeaderLocationCreationalComponent {
    type: "HEADER",
    format: "LOCATION"
}

export type IHeaderCreationalComponent = IHeaderTextWithParameterCreationalComponent 
    | IBasicTextHeaderCreationalComponent
    | IHeaderTextWithParameterPositionalCreationalComponent 
    | IHeaderMediaCreationalComponent 
    | IHeaderLocationCreationalComponent;