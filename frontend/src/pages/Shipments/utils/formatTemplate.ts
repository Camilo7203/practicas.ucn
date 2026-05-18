import { ITemplate } from '@/interfaces/templates/';
import { ITemplateToSend } from '@/interfaces/templates/templateInterface';
import { IMetaTemplatePayload, IMetaComponent } from '@/interfaces/whatsappTemplates/metaTemplateInterface';
import {
  IBodySendComponentWithParameterNamed,
  IBodySendComponentWithParameterPositional,
} from '@/interfaces/whatsappTemplates/bodyComponentsInterface';
import { normalizeTemplateLanguage } from './normalizeTemplateLanguage';
import { detectTemplateParameterFormat } from './detectTemplateParameter';
import { convertComponent } from './convertComponent';
import { extractVariables } from './extractVariables';

interface IComponentVariablesPayload {
  type: 'named' | 'positional';
  variables: string[];
  count: number;
  examples: Record<string, string>;
}

export interface ITemplateVariablesPayload {
  HEADER?: IComponentVariablesPayload;
  BODY?: IComponentVariablesPayload;
}

export function formatTemplateForMetaAPI(template: ITemplate): IMetaTemplatePayload {
    console.log('Formateando plantilla para Meta API:', template);
  const parameterFormat = detectTemplateParameterFormat(template);
  const metaComponents: IMetaComponent[] = [];
  template.components.forEach((component) => {
    console.log('Convirtiendo componente:', component);
    const metaComponent = convertComponent(component, parameterFormat);
    if (metaComponent) {
      metaComponents.push(metaComponent);
    }
  });

  return {
    name: template.name,
    category: template.category,
    language: normalizeTemplateLanguage(template.language),
    ...(parameterFormat && { parameter_format: parameterFormat }),
    components: metaComponents,
  };
}


export function formatTemplateForSend(template: ITemplate): ITemplateToSend {
    console.log('Formateando payload de envío para Meta API:', template);
  const parameterFormat = detectTemplateParameterFormat(template);
  const components = template.components
    .filter((component) => component.type === 'BODY')
    .map((component) => {
      const bodyComponent = component as any;
      const variables = extractVariables(bodyComponent.text || '');
      const uniqueVariables = Array.from(new Set(variables));

      if (uniqueVariables.length === 0) {
        return null;
      }

      if (parameterFormat === 'named') {
        const namedExamples = bodyComponent?.example?.body_text_named_params || [];
        const positionalExamples = bodyComponent?.example?.body_text?.[0] || [];

        const parameters: IBodySendComponentWithParameterNamed[] = uniqueVariables.map((variable, index) => {
          const namedExample = namedExamples.find((example: any) => example?.param_name === variable);

          return {
            type: 'text',
            parameter_name: variable,
            text: namedExample?.example || positionalExamples[index] || '',
          };
        });

        return {
          type: 'BODY' as const,
          parameters,
        };
      }

      const positionalExamples = bodyComponent?.example?.body_text?.[0] || [];
      const parameters: IBodySendComponentWithParameterPositional[] = uniqueVariables.map((_variable, index) => ({
        type: 'text',
        text: positionalExamples[index] || '',
      }));

      return {
        type: 'BODY' as const,
        parameters,
      };
    })
    .filter(Boolean);

  return {
    name: template.name,
    language: {
      code: normalizeTemplateLanguage(template.language),
    },
    components: components as ITemplateToSend['components'],
  };
}

export function buildTemplateVariablesPayload(template: ITemplate): ITemplateVariablesPayload {
  const parameterFormat = detectTemplateParameterFormat(template);
  const variablesPayload: ITemplateVariablesPayload = {};

  const buildComponentVariables = (
    component: any,
    componentType: 'HEADER' | 'BODY',
  ): IComponentVariablesPayload | null => {
    if (!component?.text) {
      return null;
    }

    const variables = extractVariables(component.text || '');
    const uniqueVariables = Array.from(new Set(variables));

    if (uniqueVariables.length === 0) {
      return null;
    }

    const examples: Record<string, string> = {};

    if (parameterFormat === 'named') {
      const namedExamples = componentType === 'BODY'
        ? component?.example?.body_text_named_params || []
        : component?.example?.header_text_named_params || [];

      const positionalExamples = componentType === 'BODY'
        ? component?.example?.body_text?.[0] || []
        : component?.example?.header_text || [];

      uniqueVariables.forEach((variable: string, index: number) => {
        const namedExample = namedExamples.find((example: any) => example?.param_name === variable);
        const exampleValue = namedExample?.example || positionalExamples[index] || '';
        if (exampleValue) {
          examples[variable] = exampleValue;
        }
      });
    } else {
      const positionalExamples = componentType === 'BODY'
        ? component?.example?.body_text?.[0] || []
        : component?.example?.header_text || [];

      uniqueVariables.forEach((variable: string, index: number) => {
        const exampleValue = positionalExamples[index] || '';
        if (exampleValue) {
          examples[variable] = exampleValue;
        }
      });
    }

    return {
      type: parameterFormat === 'named' ? 'named' : 'positional',
      variables: uniqueVariables,
      count: uniqueVariables.length,
      examples,
    };
  };

  const headerComponent = template.components.find((component) => component.type === 'HEADER') as any;
  const bodyComponent = template.components.find((component) => component.type === 'BODY') as any;

  const headerVariables = buildComponentVariables(headerComponent, 'HEADER');
  const bodyVariables = buildComponentVariables(bodyComponent, 'BODY');

  if (headerVariables) {
    variablesPayload.HEADER = headerVariables;
  }

  if (bodyVariables) {
    variablesPayload.BODY = bodyVariables;
  }

  return variablesPayload;
}