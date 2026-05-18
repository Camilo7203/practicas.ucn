import {createCorsConfig} from '../core/corsConfig';
import {handleAPIError} from '../core/handleApiError';
import {IAPIResponse} from '../../interfaces/whatsappTemplates/apiResponseInterface';
import API from '@/services/core/apiCore';

export interface BulkCampaignProgress {
  sent: number;
  total: number;
  errors: string[];
  skipped: number;
}

export interface BulkCampaignResponse {
  success: boolean;
  results: {
    sent: number;
    failed: number;
    skipped: number;
    total: number;
    errors: string[];
    successfulSends: any[];
    skippedRows: Array<{row: number; phone: string; reason: string}>;
    recipientDetails: BulkCampaignRecipientDetail[];
  };
}

export type BulkCampaignRecipientStatus = 'sent' | 'failed' | 'skipped';

export interface BulkCampaignRecipientDetail {
  row: number;
  name: string;
  phone: string;
  status: BulkCampaignRecipientStatus;
  errorReason?: string;
  messageId?: string;
  templateVariables: Record<string, string>;
}

function extractTemplateVariables(payload: any): Record<string, string> {
  const variables: Record<string, string> = {};
  const components = payload?.meta_body?.template?.components;

  if (!Array.isArray(components)) {
    return variables;
  }

  components.forEach((component: any) => {
    if (!Array.isArray(component?.parameters)) {
      return;
    }

    component.parameters.forEach((param: any, index: number) => {
      if (param?.type !== 'text') {
        return;
      }

      const key =
        (typeof param.parameter_name === 'string' && param.parameter_name.trim()) ||
        `${(component?.type || 'component').toLowerCase()}_${index + 1}`;

      variables[key] = String(param.text ?? '');
    });
  });

  return variables;
}

function getRecipientName(recipientData: Record<string, string>): string {
  const nameFields = [
    'nombre',
    'name',
    'full_name',
    'nombres',
    'first_name',
    'cliente',
    'contacto',
  ];

  for (const field of nameFields) {
    const value = recipientData[field];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  const firstKey = Object.keys(recipientData).find((key) => {
    const normalized = key.toLowerCase();
    return !['telefono', 'phone', 'celular', 'movil', 'numero', 'whatsapp'].includes(
      normalized
    );
  });

  if (firstKey) {
    const value = recipientData[firstKey];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return '';
}

export async function sendTemplateMessage(payload: any): Promise<IAPIResponse> {
  try {
    console.log('Enviando payload al backend:', payload);
    const response = await API.post<IAPIResponse>(
      import.meta.env.VITE_API_AGENT_URL + '/api/whatsapp/send-template',
      payload,
      createCorsConfig()
    );

    return response.data;
  } catch (error: any) {
    console.error('Error al enviar template:', error);
    
    // Manejo específico de errores CORS
    if (error.code === 'ERR_NETWORK' || error.message?.includes('CORS')) {
      return {
        success: false,
        error: `Error de CORS: ${error.message}. Verifica la configuración del servidor de destino.`,
      };
    }
    
    if (error.response?.status === 0) {
      return {
        success: false,
        error: 'Error de conexión: No se pudo conectar con el servidor. Verifique la conectividad de red.',
      };
    }
    
    return handleAPIError(error);
  }
}

export async function sendBulkCampaign(
  template: any,
  csvData: any[],
  agentProviderId: string,
  organizationId: string,
  variableMappings?: { [key: string]: string },
  phoneColumnMapping?: string,
  onProgress?: (progress: BulkCampaignProgress) => void,
  blacklistNumbers: string[] = []
): Promise<BulkCampaignResponse> {
  const blacklistSet = new Set(blacklistNumbers.map(number => number.replace(/\D/g, '')));

  const results = {
    sent: 0,
    failed: 0,
    skipped: 0,
    total: csvData.length,
    errors: [] as string[],
    successfulSends: [] as any[],
    skippedRows: [] as Array<{row: number; phone: string; reason: string}>,
    recipientDetails: [] as BulkCampaignRecipientDetail[],
  };

  for (const [index, row] of csvData.entries()) {
    try {
      // Mapear los datos del CSV usando los mappings de variables
      const recipientData: { [key: string]: string } = {};
      
      // Copiar todos los datos del CSV
      Object.keys(row).forEach(key => {
        recipientData[key] = row[key];
      });

      // Construir el payload para este destinatario
      const payload = buildTemplatePayload(
        template,
        recipientData,
        agentProviderId,
        organizationId,
        variableMappings,
        phoneColumnMapping
      );

      const normalizedPhone = (payload.phone || '').replace(/\D/g, '');
      const rowDetailBase = {
        row: index + 1,
        phone: payload.phone || '',
        name: getRecipientName(recipientData),
        templateVariables: extractTemplateVariables(payload),
      };

      if (normalizedPhone && blacklistSet.has(normalizedPhone)) {
        results.skipped++;
        results.skippedRows.push({
          row: index + 1,
          phone: payload.phone,
          reason: 'Número en blacklist'
        });
        results.recipientDetails.push({
          ...rowDetailBase,
          status: 'skipped',
          errorReason: 'Número en blacklist',
        });

        if (onProgress) {
          onProgress({
            sent: results.sent,
            total: results.total,
            errors: results.errors,
            skipped: results.skipped,
          });
        }

        continue;
      }

      // Enviar el mensaje
      const response = await sendTemplateMessage(payload);

      if (response.success) {
        results.sent++;
        results.successfulSends.push({
          phone: payload.phone,
          originalData: recipientData,
          payload: payload,
          response: response
        });
        const messageId =
          (response as any)?.data?.messages?.[0]?.id ||
          (response as any)?.data?.message_id ||
          (response as any)?.message_id;

        results.recipientDetails.push({
          ...rowDetailBase,
          status: 'sent',
          messageId: messageId ? String(messageId) : undefined,
        });
      } else {
        results.failed++;
        const errorReason = response.error || 'Error desconocido';
        results.errors.push(`Fila ${index + 1}: ${errorReason}`);
        results.recipientDetails.push({
          ...rowDetailBase,
          status: 'failed',
          errorReason,
        });
      }

      // Llamar callback de progreso
      if (onProgress) {
        onProgress({
          sent: results.sent,
          total: results.total,
          errors: results.errors,
          skipped: results.skipped,
        });
      }

      // Pequeña pausa entre envíos para evitar rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (error) {
      results.failed++;
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      results.errors.push(`Fila ${index + 1}: ${errorMessage}`);

      const fallbackPhone =
        (row?.telefono ||
          row?.phone ||
          row?.celular ||
          row?.movil ||
          row?.numero ||
          row?.whatsapp ||
          '') as string;

      results.recipientDetails.push({
        row: index + 1,
        phone: String(fallbackPhone || ''),
        name: getRecipientName(row || {}),
        status: 'failed',
        errorReason: errorMessage,
        templateVariables: {},
      });
      
      if (onProgress) {
        onProgress({
          sent: results.sent,
          total: results.total,
          errors: results.errors,
          skipped: results.skipped,
        });
      }
    }
  }

  return {
    success: results.failed === 0,
    results
  };
}

export function buildTemplatePayload(
  template: any,
  recipientData: { [key: string]: string },
  agentProviderId: string,
  organizationId: string,
  variableMappings?: { [key: string]: string },
  phoneColumnMapping?: string
): any {
  // Buscar el número de teléfono
  let phone = '';
  const phoneFields = ['telefono', 'phone', 'celular', 'movil', 'numero', 'whatsapp'];
  
  // Si se especificó una columna de teléfono específica, usarla primero
  if (phoneColumnMapping && recipientData[phoneColumnMapping]) {
    phone = recipientData[phoneColumnMapping].trim();
  } else {
    // Buscar en campos específicos por defecto
    for (const field of phoneFields) {
      const value = recipientData[field] || recipientData[field.toLowerCase()] || recipientData[field.toUpperCase()];
      if (value && typeof value === 'string' && value.trim().length >= 10) {
        phone = value.trim();
        break;
      }
    }
    
    // Si no encontró en campos específicos, buscar en todos los campos
    if (!phone) {
      for (const [, value] of Object.entries(recipientData)) {
        if (typeof value === 'string') {
          const cleanValue = value.replace(/\D/g, ''); // Solo números
          if (cleanValue.length >= 10 && cleanValue.length <= 15) {
            phone = value.trim();
            break;
          }
        }
      }
    }
  }
  
  if (!phone || phone.length < 10) {
    throw new Error(`Número de teléfono es OBLIGATORIO y debe tener al menos 10 dígitos. Datos disponibles: ${Object.keys(recipientData).join(', ')}. Valores: ${JSON.stringify(recipientData)}`);
  }

  // Limpiar el número de teléfono (solo números)
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Validar que tenga al menos 10 dígitos
  if (cleanPhone.length < 10) {
    throw new Error(`El número de teléfono '${phone}' no es válido. Debe tener al menos 10 dígitos.`);
  }
  
  // Agregar código de país si no lo tiene (Colombia por defecto)
  let finalPhone = cleanPhone;
  if (!cleanPhone.startsWith('57') && cleanPhone.length === 10) {
    finalPhone = '57' + cleanPhone;
  }

  const getTemplateVariableMode = (): 'none' | 'positional' | 'named' => {
    const detected = new Set<'positional' | 'named'>();

    const registerVariable = (variable: string) => {
      const normalized = (variable || '').trim();
      if (!normalized) {
        return;
      }

      if (/^\d+$/.test(normalized)) {
        detected.add('positional');
      } else {
        detected.add('named');
      }
    };

    if (template.variables) {
      if (Array.isArray(template.variables)) {
        template.variables.forEach((variable: string) => registerVariable(variable));
      } else {
        Object.keys(template.variables).forEach((componentType) => {
          const componentVars = template.variables[componentType];
          if (componentVars?.variables && Array.isArray(componentVars.variables)) {
            componentVars.variables.forEach((variable: string) => registerVariable(variable));
          }
        });
      }
    }

    if (template.variables_detail && typeof template.variables_detail === 'object') {
      Object.keys(template.variables_detail).forEach((componentType) => {
        const componentVars = template.variables_detail[componentType];
        if (componentVars?.variables && Array.isArray(componentVars.variables)) {
          componentVars.variables.forEach((variable: string) => registerVariable(variable));
        }
      });
    }

    if (variableMappings) {
      Object.keys(variableMappings).forEach((mappingKey) => registerVariable(mappingKey));
    }

    const templateComponents = template.json_to_send?.components || template.components || [];
    if (Array.isArray(templateComponents)) {
      templateComponents.forEach((component: any) => {
        if (component?.text && typeof component.text === 'string') {
          const matches = component.text.match(/\{\{([^}]+)\}\}/g) || [];
          matches.forEach((match: string) => registerVariable(match.replace(/[{}]/g, '')));
        }

        if (Array.isArray(component?.parameters)) {
          component.parameters.forEach((param: any) => {
            if (param?.parameter_name && typeof param.parameter_name === 'string') {
              registerVariable(param.parameter_name);
            }
          });
        }
      });
    }

    if (detected.size === 0) {
      return 'none';
    }

    return detected.has('named') ? 'named' : 'positional';
  };

  const variableMode = getTemplateVariableMode();

  const getNamedVariableKeys = (): string[] => {
    const keys = new Set<string>();

    if (variableMappings) {
      Object.keys(variableMappings).forEach((mappingKey) => {
        if (!/^\d+$/.test(mappingKey)) {
          keys.add(mappingKey);
        }
      });
    }
    if (template.variables_detail && typeof template.variables_detail === 'object') {
      Object.keys(template.variables_detail).forEach((componentType) => {
        const componentVars = template.variables_detail[componentType];
        if (componentVars?.variables && Array.isArray(componentVars.variables)) {
          componentVars.variables.forEach((variableKey: string) => {
            if (!/^\d+$/.test(variableKey)) {
              keys.add(variableKey);
            }
          });
        }
      });
    }
    if (Array.isArray(template.variables)) {
      template.variables.forEach((variableKey: string) => {
        if (!/^\d+$/.test(variableKey)) {
          keys.add(variableKey);
        }
      });
    }
    return Array.from(keys);
  };

  const namedVariableKeys = getNamedVariableKeys();

  // Usar el json_to_send de la plantilla de MongoDB como base
  const templateJson = template.json_to_send || {
    name: template.name,
    language: { code: template.language || 'es' },
    components: []
  };

  // Construir componentes dinámicamente
  const components: any[] = [];

  // Verificar si la template tiene variables
  const hasVariables = template.variables && Object.keys(template.variables).some(componentType => {
    const componentVars = template.variables[componentType];
    return componentVars && componentVars.variables && componentVars.variables.length > 0;
  });

  // Si la template no tiene variables, usar estructura simple
  if (!hasVariables && (!templateJson.components || templateJson.components.length === 0)) {
    components.push({
      type: "BODY",
      parameters: []
    });
  } else if (templateJson.components && templateJson.components.length > 0) {
    templateJson.components.forEach((component: any) => {
      if (component.type === "BODY" && component.parameters) {
        const bodyParameters = Array.isArray(component.parameters) ? component.parameters : [];

        // Actualizar parámetros del body con datos reales
        let updatedParameters = bodyParameters.map((param: any, index: number) => {
          if (param.type === 'text') {
            if (variableMode === 'named') {
              const parameterName = (param.parameter_name || '').trim();
              if (parameterName) {
                const mappedColumn = variableMappings?.[parameterName];
                let value = '';

                if (mappedColumn) {
                  value = recipientData[mappedColumn] || '';
                } else {
                  value = recipientData[parameterName] || recipientData[parameterName.toLowerCase()] || '';
                }

                return {
                  type: 'text',
                  parameter_name: parameterName,
                  text: value
                };
              }

              return null;
            }

            // Buscar el valor en los datos del destinatario (posicional)
            let value = param.text; // Valor por defecto

            // Intentar encontrar el valor en los datos del destinatario
            const dataKeys = Object.keys(recipientData).filter(key =>
              !phoneFields.includes(key.toLowerCase()) // Excluir campos de teléfono
            );
            if (index < dataKeys.length) {
              value = recipientData[dataKeys[index]] || param.text;
            }
            
            return {
              ...param,
              text: value
            };
          }
          return param;
        }).filter(Boolean);

        if (variableMode === 'named') {
          const hasParameterNames = bodyParameters.some((param: any) => !!param?.parameter_name);
          if (!hasParameterNames && namedVariableKeys.length > 0) {
            updatedParameters = namedVariableKeys.map((variableKey: string) => {
              const mappedColumn = variableMappings?.[variableKey];
              const value = mappedColumn
                ? (recipientData[mappedColumn] || '')
                : (recipientData[variableKey] || recipientData[variableKey.toLowerCase()] || '');

              return {
                type: 'text',
                parameter_name: variableKey,
                text: value
              };
            });
          }
        }

        components.push({
          ...component,
          parameters: updatedParameters
        });
      } else {
        // Agregar otros componentes sin modificar
        components.push(component);
      }
    });
  } else if (template.variables) {
    // Si no hay json_to_send, construir desde las variables
    Object.keys(template.variables).forEach(componentType => {
      const componentVars = template.variables[componentType];
      
      if (componentType === 'BODY' && componentVars.variables) {
        const bodyParameters: any[] = [];
        
        componentVars.variables.forEach((variableKey: string) => {
          // Buscar el valor en los datos del destinatario
          let value = '';
          const isPositionalVariable = /^\d+$/.test(variableKey);
          const isNamedVariable = !isPositionalVariable;
          
          // Si tenemos mapeos de variables específicos, usarlos
          if (variableMappings && variableMappings[variableKey]) {
            const mappedColumn = variableMappings[variableKey];
            if (isNamedVariable) {
              value = recipientData[mappedColumn] || '';
            } else {
              value = recipientData[mappedColumn] || `{{${variableKey}}}`;
            }
          } else {
            // Lógica original: buscar por nombre o posición
            if (isPositionalVariable) {
              // Mapear variable posicional a columna del CSV (excluyendo teléfono)
              const columnNames = Object.keys(recipientData).filter(key => 
                !phoneFields.includes(key.toLowerCase())
              );
              const variableIndex = parseInt(variableKey) - 1;
              if (variableIndex < columnNames.length) {
                const columnName = columnNames[variableIndex];
                value = recipientData[columnName] || `{{${variableKey}}}`;
              }
            } else {
              // Variable named: si no se encuentra, enviar texto vacío
              value = recipientData[variableKey] || recipientData[variableKey.toLowerCase()] || '';
            }
          }

          if (isNamedVariable) {
            bodyParameters.push({
              type: 'text',
              parameter_name: variableKey,
              text: value
            });
          } else {
            bodyParameters.push({
              type: 'text',
              text: value
            });
          }
        });

        if (bodyParameters.length > 0) {
          components.push({
            type: "BODY",
            parameters: bodyParameters
          });
        }
      }
    });
  }

  // Construir el payload final
  const payload = {
    meta_body: {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: finalPhone,
      type: "template",
      template: {
        name: template.name,
        language: templateJson.language,
        components: components
      }
    },
    agent_provider_id: agentProviderId,
    phone: finalPhone,
    organization_id: organizationId
  };

  return payload;
}

export function validateCSVForPhone(csvData: any[]): {
  isValid: boolean;
  errors: string[];
  phoneField?: string;
  validRows: any[];
} {
  const phoneFields = ['telefono', 'phone', 'celular', 'movil', 'numero', 'whatsapp'];
  const errors: string[] = [];
  const validRows: any[] = [];
  
  if (!csvData || csvData.length === 0) {
    return {
      isValid: false,
      errors: ['El CSV está vacío'],
      validRows: []
    };
  }
  
  // Buscar campo de teléfono
  const firstRow = csvData[0];
  let phoneField = '';
  
  for (const field of phoneFields) {
    if (firstRow.hasOwnProperty(field) || 
        firstRow.hasOwnProperty(field.toLowerCase()) || 
        firstRow.hasOwnProperty(field.toUpperCase())) {
      phoneField = Object.keys(firstRow).find(key => 
        key.toLowerCase() === field.toLowerCase()
      ) || '';
      break;
    }
  }
  
  if (!phoneField) {
    // Buscar cualquier campo que parezca teléfono
    for (const key of Object.keys(firstRow)) {
      const value = firstRow[key];
      if (typeof value === 'string') {
        const cleanValue = value.replace(/\D/g, '');
        if (cleanValue.length >= 10 && cleanValue.length <= 15) {
          phoneField = key;
          break;
        }
      }
    }
  }
  
  if (!phoneField) {
    return {
      isValid: false,
      errors: ['No se encontró columna de teléfono. Asegúrate de incluir una columna llamada: telefono, phone, celular, movil, numero o whatsapp'],
      validRows: []
    };
  }
  
  // Validar cada fila
  csvData.forEach((row, index) => {
    const phoneValue = row[phoneField];
    
    if (!phoneValue || typeof phoneValue !== 'string') {
      errors.push(`Fila ${index + 1}: Teléfono vacío o inválido`);
      return;
    }
    
    const cleanPhone = phoneValue.replace(/\D/g, '');
    
    if (cleanPhone.length < 10) {
      errors.push(`Fila ${index + 1}: Teléfono '${phoneValue}' debe tener al menos 10 dígitos`);
      return;
    }
    
    if (cleanPhone.length > 15) {
      errors.push(`Fila ${index + 1}: Teléfono '${phoneValue}' demasiado largo (máximo 15 dígitos)`);
      return;
    }
    
    validRows.push(row);
  });
  
  return {
    isValid: validRows.length > 0,
    errors,
    phoneField,
    validRows
  };
}
