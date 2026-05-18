import { ITemplateComponentToSend } from '@/interfaces/templates/templateInterface';

import { 
    IBodySendComponentWithParameterNamed,
    IBodySendComponentWithParameterPositional,
    IBodySendComponent,
} from '@/interfaces/whatsappTemplates/bodyComponentsInterface';


export function convertComponentToSend(
    component: ITemplateComponentToSend,
    parameterFormat?: 'named' | 'positional'
): IBodySendComponent | null {
    switch (component.type) {
        case "BODY":
            return convertBodyComponent(component, parameterFormat);
        default:
            return null;
    }
}

/**
 * Convierte el componente BODY
 */
function convertBodyComponent(
    component: IBodySendComponent,
    parameterFormat?: 'named' | 'positional',
): IBodySendComponent {
    const parameters = component.parameters || [];

    if (parameters.length === 0) {
        return {
            type: 'BODY',
            parameters: [],
        };
    }


    if (parameterFormat !== 'positional') {
        const namedParams = parameters as IBodySendComponentWithParameterNamed[];

        if (namedParams.every((parameter) => 'parameter_name' in parameter)) {
            return {
                type: 'BODY',
                parameters: namedParams.map((parameter) => ({
                    type: 'text',
                    parameter_name: parameter.parameter_name,
                    text: parameter.text,
                })),
            };
        }
    }

    return {
        type: 'BODY',
        parameters: parameters.map((parameter) => ({
            type: 'text',
            text: parameter.text,
        })) as IBodySendComponentWithParameterPositional[],
    }
}