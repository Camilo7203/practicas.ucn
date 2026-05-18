import { ITemplateComponent } from '@/interfaces/templates/templateInterface';
import { IMetaComponent, IMetaButton } from '@/interfaces/whatsappTemplates/metaTemplateInterface';
import { extractVariables } from './extractVariables';
import {
    IButtonCreationalComponent,
    IButtonsCreationalComponent,
    ICopyCodeButtonCreationalComponent,
    IUrlButtonCreationalComponent,
} from '@/interfaces/whatsappTemplates/buttonsComponentsInterface';
import { IBasicTextFooterCreationalComponent } from '@/interfaces/whatsappTemplates/footerComponentsInterface';

import {
    IHeaderCreationalComponent,
    IHeaderMediaCreationalComponent,
    IHeaderTextWithParameterCreationalComponent,
    IHeaderTextWithParameterPositionalCreationalComponent,
} from '@/interfaces/whatsappTemplates/headersComponentsInterface';

import { IBodyCreationalComponent,
    IBodyTextWithParameterPositionalCreationalComponent, 
    IBodyTextWithParameterCreationalComponent 
} from '@/interfaces/whatsappTemplates/bodyComponentsInterface';


export function convertComponent(
    component: ITemplateComponent,
    parameterFormat?: 'named' | 'positional'
): IMetaComponent | null {
    switch (component.type) {
        case 'HEADER':
            return convertHeaderComponent(component, parameterFormat);

        case "BODY":
            return convertBodyComponent(component, parameterFormat);

        case "FOOTER":
            return convertFooterComponent(component);

        case "BUTTONS":
            console.log('Convirtiendo componente de botones:', component);
            return convertButtonsComponent(component);

        default:
            return null;
    }
}

/**
 * Convierte el componente HEADER
 */
function convertHeaderComponent(
    component: IHeaderCreationalComponent,
    parameterFormat?: 'named' | 'positional'
): IHeaderCreationalComponent {
    const format = component.format || 'TEXT';

    if (format === 'TEXT') {
        const text = (component as IHeaderTextWithParameterCreationalComponent).text || '';
        const variables = extractVariables(text);
        const uniqueVariables = Array.from(new Set(variables));

        if (uniqueVariables.length > 0) {
            if (parameterFormat != 'positional') {
                const namedExamplesFromPayload =
                    (component as IHeaderTextWithParameterCreationalComponent).example?.header_text_named_params;
                const namedExamples = namedExamplesFromPayload && namedExamplesFromPayload.length > 0
                    ? namedExamplesFromPayload
                    : uniqueVariables.map((variable, index) => ({
                        param_name: variable,
                        example: (component as IHeaderTextWithParameterPositionalCreationalComponent).example?.header_text?.[index] || `Ejemplo ${index + 1}`,
                    }));

                return {
                    type: 'HEADER',
                    format: 'TEXT',
                    text,
                    example: {
                        header_text_named_params: namedExamples,
                    },
                };
            }

            return {
                type: 'HEADER',
                format: 'TEXT',
                text,
                example: {
                    header_text: (component as IHeaderTextWithParameterPositionalCreationalComponent).example?.header_text || [],
                },
            };
        }

        return {
            type: 'HEADER',
            format: 'TEXT',
            text,
        };
    }

    if (format === 'IMAGE' || format === 'VIDEO' || format === 'DOCUMENT') {
        const mediaComponent = component as IHeaderMediaCreationalComponent;

        if (mediaComponent.example?.header_handle) {
            return {
                type: 'HEADER',
                format,
                example: {
                    header_handle: mediaComponent.example.header_handle,
                },
            };
        }

        return {
            type: 'HEADER',
            format,
        };
    }

    return {
        type: 'HEADER',
        format: 'LOCATION',
    };
}

/**
 * Convierte el componente BODY
 */
function convertBodyComponent(
    component: IBodyCreationalComponent,
    parameterFormat?: 'named' | 'positional'): IBodyCreationalComponent {
    const variables = extractVariables(component.text);
    const uniqueVariables = Array.from(new Set(variables));
    if (uniqueVariables.length > 0) {
        if (parameterFormat != 'positional') {
            const namedExamplesFromPayload = 
            (component as IBodyTextWithParameterCreationalComponent).example?.body_text_named_params;
            const namedExamples = namedExamplesFromPayload && namedExamplesFromPayload.length > 0
                ? namedExamplesFromPayload
                : uniqueVariables.map((variable, index) => ({
                    param_name: variable,
                    example: (component as IBodyTextWithParameterPositionalCreationalComponent).example?.body_text?.[0]?.[index] || `Ejemplo ${index + 1}`,
                }));
            return {
                type: "BODY",
                text: component.text,
                example: {
                    body_text_named_params: namedExamples,
                },
            };
        }
        return {
            type: "BODY",
            text: component.text,
            example: {
                body_text: (component as IBodyTextWithParameterPositionalCreationalComponent).example?.body_text || []
            }
        }
    }
    return {
        type: "BODY",
        text: component.text,
    }
}

/**
 * Convierte el componente FOOTER
 */
function convertFooterComponent(component: IBasicTextFooterCreationalComponent): IMetaComponent {
    return {
        type: "FOOTER",
        text: component.text || '',
    };
}

/**
 * Convierte el componente BUTTONS
 */
function convertButtonsComponent(component: IButtonsCreationalComponent): IMetaComponent | null {
    console.log('Convirtiendo componente de botones:', component);
    if (!component.buttons || component.buttons.length === 0) {
        return null;
    }

    const metaButtons: IMetaButton[] = component.buttons.map(convertButton);
    console.log('Botones convertidos:', metaButtons);
    return {
        type: 'BUTTONS',
        buttons: metaButtons,
    };
}

function convertButton(button: IButtonCreationalComponent): IMetaButton {
    switch (button.type) {
        case 'PHONE_NUMBER':
            return {
                type: 'PHONE_NUMBER',
                text: button.text,
                ...(button.phone_number && { phone_number: button.phone_number }),
            };

        case 'URL': {
            const url = button.url || '';
            const hasVariables = extractVariables(url).length > 0;
            const examples = (button as IUrlButtonCreationalComponent).example;

            return {
                type: 'URL',
                text: button.text,
                ...(button.url && { url: button.url }),
                ...(hasVariables && {
                    example: examples && examples.length > 0 ? examples : ['Ejemplo 1'],
                }),
            };
        }

        case 'COPY_CODE': {
            const copyCodeExample = (button as ICopyCodeButtonCreationalComponent).example;
            const normalizedExample = Array.isArray(copyCodeExample)
                ? copyCodeExample[0]
                : copyCodeExample;

            return {
                type: 'COPY_CODE',
                ...(button.text && { text: button.text }),
                ...(normalizedExample && { example: normalizedExample }),
            };
        }

        case 'QUICK_REPLY':
            return {
                type: 'QUICK_REPLY',
                text: button.text,
            };
    }
}