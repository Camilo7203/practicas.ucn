import type { ITemplate } from '@/interfaces/templates/templateInterface';
import { extractVariables } from './extractVariables';
import { detectTemplateParameterFormat } from './detectTemplateParameter';

type TranslateFn = (key: string, options?: Record<string, unknown>) => string;

export function validateTemplateForAPI(template: ITemplate, t?: TranslateFn): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const parameterFormat = detectTemplateParameterFormat(template);

  const tr = (key: string, options?: Record<string, unknown>, fallback?: string) => {
    if (t) return t(key, options);
    return fallback || key;
  };

  // Validar nombre
  if (!template.name || template.name.trim() === '') {
    errors.push(tr('shipments.validation.nameRequired', undefined, 'El nombre de la plantilla es requerido'));
  }
  
  // Validar que el nombre solo contenga caracteres permitidos
  if (!/^[a-z0-9_]+$/.test(template.name)) {
    errors.push(tr('shipments.validation.namePattern', undefined, 'El nombre solo puede contener letras minúsculas, números y guiones bajos'));
  }

  // Validar longitud del nombre (máximo 512 caracteres)
  if (template.name.length > 512) {
    errors.push(tr('shipments.validation.nameMaxLength', { max: 512 }, 'El nombre no puede exceder 512 caracteres'));
  }

  // Validar que exista al menos un componente BODY
  const hasBody = template.components.some(c => c.type === "BODY");
  if (!hasBody) {
    errors.push(tr('shipments.validation.bodyRequiredComponent', undefined, 'La plantilla debe tener al menos un componente BODY'));
  }

  // Validar componentes
  template.components.forEach((component, index) => {
    if (component.type === 'HEADER' && component.format === 'TEXT') {
      if (!component.text) {
        errors.push(tr('shipments.validation.headerTextRequired', { index: index + 1 }, `El componente HEADER ${index + 1} requiere texto`));
      }
      if (component.text && component.text.length > 60) {
        errors.push(tr('shipments.validation.headerTextMaxLength', { index: index + 1, max: 60 }, `El texto del HEADER ${index + 1} no puede exceder 60 caracteres`));
      }
      
      // Validar ejemplos de variables
      const variables = extractVariables(component.text || '');
      if (variables.length > 0 && (!(component as any).example?.header_text || (component as any).example.header_text.length !== variables.length)) {
        errors.push(tr('shipments.validation.headerExamplesRequired', { index: index + 1 }, `El componente HEADER ${index + 1} requiere ejemplos para todas las variables`));
      }
    }

    if (component.type === "BODY") {
      if (!component.text || component.text.trim() === '') {
        errors.push(tr('shipments.validation.bodyTextRequired', { index: index + 1 }, `El componente BODY ${index + 1} requiere texto`));
      }
      if (component.text && component.text.length > 1024) {
        errors.push(tr('shipments.validation.bodyTextMaxLength', { index: index + 1, max: 1024 }, `El texto del BODY ${index + 1} no puede exceder 1024 caracteres`));
      }
      
      // Validar ejemplos de variables
      const variables = extractVariables(component.text || '');
      const uniqueVariables = Array.from(new Set(variables));

      if (parameterFormat === 'named') {
        const invalidNamedVars = uniqueVariables.filter(variable => !/^[a-z_]+$/.test(variable));
        if (invalidNamedVars.length > 0) {
          errors.push(tr('shipments.validation.bodyNamedVarsInvalid', { index: index + 1, vars: invalidNamedVars.join(', ') }, `El componente BODY ${index + 1} tiene variables named inválidas (${invalidNamedVars.join(', ')}). Usa solo minúsculas y guion bajo`));
        }

        const namedExamples = (component as any).example?.body_text_named_params;
        const positionalExamples = (component as any).example?.body_text?.[0] || [];
        const hasNamedExamples = !!namedExamples && namedExamples.length === uniqueVariables.length;
        const hasPositionalExamples = positionalExamples.length === uniqueVariables.length;

        if (uniqueVariables.length > 0 && !hasNamedExamples && !hasPositionalExamples) {
          errors.push(tr('shipments.validation.bodyNamedExamplesRequired', { index: index + 1 }, `El componente BODY ${index + 1} requiere ejemplos para todas las variables named`));
        }
      } else if (parameterFormat === 'positional') {
        const positionalVars = uniqueVariables.map(variable => Number(variable)).filter(num => !Number.isNaN(num));
        const hasOnlyNumbers = uniqueVariables.every(variable => /^\d+$/.test(variable));
        const sorted = [...positionalVars].sort((a, b) => a - b);
        const hasValidSequence = sorted.every((value, idx) => value === idx + 1);

        if (uniqueVariables.length > 0 && (!hasOnlyNumbers || !hasValidSequence)) {
          errors.push(tr('shipments.validation.bodyPositionalSequenceInvalid', { index: index + 1 }, `El componente BODY ${index + 1} debe usar variables posicionales consecutivas ({{1}}, {{2}}, ... )`));
        }

        if (uniqueVariables.length > 0 && (!(component as any).example?.body_text || !(component as any).example.body_text[0] || (component as any).example.body_text[0].length !== uniqueVariables.length)) {
          errors.push(tr('shipments.validation.bodyExamplesRequired', { index: index + 1 }, `El componente BODY ${index + 1} requiere ejemplos para todas las variables`));
        }
      } else if (uniqueVariables.length > 0 && (!(component as any).example?.body_text || !(component as any).example.body_text[0] || (component as any).example.body_text[0].length !== uniqueVariables.length)) {
        errors.push(tr('shipments.validation.bodyExamplesRequired', { index: index + 1 }, `El componente BODY ${index + 1} requiere ejemplos para todas las variables`));
      }
    }

    if (component.type === "FOOTER") {
      if (component.text && component.text.length > 60) {
        errors.push(tr('shipments.validation.footerTextMaxLength', { index: index + 1, max: 60 }, `El texto del FOOTER ${index + 1} no puede exceder 60 caracteres`));
      }
    }

    if (component.type === "BUTTONS") {
      if (!component.buttons || component.buttons.length === 0) {
        errors.push(tr('shipments.validation.buttonsRequired', { index: index + 1 }, `El componente BUTTONS ${index + 1} requiere al menos un botón`));
      }
      if (component.buttons && component.buttons.length > 3) {
        errors.push(tr('shipments.validation.buttonsMaxCount', { index: index + 1, max: 3 }, `El componente BUTTONS ${index + 1} no puede tener más de 3 botones`));
      }

      // Validar botones individuales
      component.buttons?.forEach((button, btnIndex) => {
        if (!button.text || button.text.trim() === '') {
          errors.push(tr('shipments.validation.buttonTextRequired', { buttonIndex: btnIndex + 1, index: index + 1 }, `El botón ${btnIndex + 1} del componente BUTTONS ${index + 1} requiere texto`));
        }

        if (button.text && button.type === 'COPY_CODE' && button.text.length > 15) {
          errors.push(tr('shipments.validation.buttonTextMaxLengthCopyCode', { buttonIndex: btnIndex + 1, index: index + 1, max: 15 }, `El texto del botón ${btnIndex + 1} de tipo COPY_CODE no puede exceder 15 caracteres`));
        }

        if (button.text && button.type === 'PHONE_NUMBER' && button.text.length > 25) {
          errors.push(tr('shipments.validation.buttonTextMaxLengthPhone', { buttonIndex: btnIndex + 1, index: index + 1, max: 25 }, `El texto del botón ${btnIndex + 1} de tipo PHONE_NUMBER no puede exceder 25 caracteres`));
        }

        if (button.text && button.type === 'QUICK_REPLY' && button.text.length > 25) {
          errors.push(tr('shipments.validation.buttonTextMaxLengthQuickReply', { buttonIndex: btnIndex + 1, index: index + 1, max: 25 }, `El texto del botón ${btnIndex + 1} de tipo QUICK_REPLY no puede exceder 25 caracteres`));
        }

        if (button.text && button.type === 'URL' && button.text.length > 25) {
          errors.push(tr('shipments.validation.buttonTextMaxLengthUrl', { buttonIndex: btnIndex + 1, index: index + 1, max: 25 }, `El texto del botón ${btnIndex + 1} de tipo URL no puede exceder 25 caracteres`));
        }

        if (button.type === 'PHONE_NUMBER' && !button.phone_number) {
          errors.push(tr('shipments.validation.buttonPhoneRequired', { buttonIndex: btnIndex + 1 }, `El botón ${btnIndex + 1} de tipo PHONE_NUMBER requiere un número de teléfono`));
        }

        if (button.type === 'URL' && !button.url) {
          errors.push(tr('shipments.validation.buttonUrlRequired', { buttonIndex: btnIndex + 1 }, `El botón ${btnIndex + 1} de tipo URL requiere una URL`));
        }

        if (button.type === 'COPY_CODE' && (!button.example || button.example.length === 0)) {
          errors.push(tr('shipments.validation.buttonCopyCodeExampleRequired', { buttonIndex: btnIndex + 1 }, `El botón ${btnIndex + 1} de tipo COPY_CODE requiere un ejemplo`));
        }
      });
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}