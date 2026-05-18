import type { ITemplate} from '@/interfaces/templates/templateInterface';
import { extractVariables } from './extractVariables';


export function detectTemplateParameterFormat(template: ITemplate): 'named' | 'positional' {
  let hasNamed = false;
  let hasPositional = false;

  template.components.forEach((component) => {
    if (!(component as any).text) {
      return;
    }

    const variables = extractVariables((component as any).text);
    variables.forEach((variable) => {
      if (/^\d+$/.test(variable)) {
        hasPositional = true;
      } else {
        hasNamed = true;
      }
    });
  });
  if (hasNamed) {
    return 'named';
  }
  if (hasPositional) {
    return 'positional';
  }
  return 'positional';
}
