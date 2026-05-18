import { ITemplateComponent } from '@/interfaces/templates';
import { ITemplateComponentToSend } from '@/interfaces/templates/templateInterface';

export const buildTemplateToCreate = (
    templateName: string,
    templateLanguage: string,
    templateComponents: ITemplateComponent[],
    category:string,
    parameterFormat: string,
  ) => {
    return {
      name: templateName,
      language: templateLanguage,
      category: category,
      components: templateComponents,
      parameter_format: parameterFormat,
    };
  };

export const buildJsonToSend = (
    templateName: string,
    templateLanguage: string,
    templateComponents: ITemplateComponentToSend[],
  ) => {
    return {
      name: templateName,
      Language:{
        code: templateLanguage,
      },
      components: templateComponents
    }
  };