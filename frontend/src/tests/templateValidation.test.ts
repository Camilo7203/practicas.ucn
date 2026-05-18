/**
 * Test para validar el envío de templates con teléfonos obligatorios
 */

import { validateCSVForPhone, buildTemplatePayload } from '@/services/whatsappTemplates';

// Datos de prueba para CSV
const testCSVData = [
  {
    nombre: 'Juan Pérez',
    telefono: '573001234567',
    empresa: 'Acme Corp'
  },
  {
    nombre: 'María González',
    phone: '3007654321', // Sin código de país
    empresa: 'Tech Solutions'
  },
  {
    nombre: 'Carlos Rodríguez',
    celular: '57-300-987-6543', // Con formato
    empresa: 'Digital Agency'
  },
  {
    nombre: 'Ana López',
    // Sin teléfono - debe fallar
    empresa: 'StartupCo'
  }
];

// Template de prueba
const testTemplate = {
  name: 'test_template',
  language: 'es',
  json_to_send: {
    name: 'test_template',
    language: { code: 'es' },
    components: [
      {
        type: "BODY",
        parameters: [
          {
            type: 'text',
            text: 'Nombre por defecto'
          }
        ]
      }
    ]
  }
};

const namedTemplate = {
  name: 'named_template',
  language: 'es',
  variables: {
    BODY: {
      variables: ['nombre', 'empresa']
    }
  },
  json_to_send: {
    name: 'named_template',
    language: { code: 'es' },
    components: [
      {
        type: "BODY",
        parameters: [
          { type: 'text', parameter_name: 'nombre', text: '' },
          { type: 'text', parameter_name: 'empresa', text: '' }
        ]
      }
    ]
  }
};

const mixedTemplate = {
  name: 'mixed_template',
  language: 'es',
  variables: {
    BODY: {
      variables: ['1', 'nombre']
    }
  },
  json_to_send: {
    name: 'mixed_template',
    language: { code: 'es' },
    components: []
  }
};

// Test de validación de CSV
validateCSVForPhone(testCSVData);

// Test de construcción de payload
testCSVData.forEach((row) => {
  try {
    // Convertir a formato string para compatibilidad
    const stringRow: { [key: string]: string } = {};
    Object.keys(row).forEach(key => {
      stringRow[key] = String(row[key as keyof typeof row] || '');
    });
    
    buildTemplatePayload(
      testTemplate,
      stringRow,
      '839066315952659',
      '68ce063786003b3788df5a59'
    );
    
  } catch (error) {
    // Test error handling
  }
});

// Test named variables: debe incluir parameter_name y respetar mapeos
const namedPayload = buildTemplatePayload(
  namedTemplate,
  {
    telefono: '3001234567',
    first_name: 'Laura',
    company_name: 'LoopHack'
  },
  '839066315952659',
  '68ce063786003b3788df5a59',
  {
    nombre: 'first_name',
    empresa: 'company_name'
  }
);

const namedParams = namedPayload.meta_body?.template?.components?.[0]?.parameters || [];
if (namedParams.length !== 2 || namedParams[0].parameter_name !== 'nombre' || namedParams[0].text !== 'Laura') {
  throw new Error('Named variables no se construyeron correctamente en el payload');
}

// Test named con faltante: debe enviar string vacío
const namedPayloadWithMissingValue = buildTemplatePayload(
  namedTemplate,
  {
    telefono: '3001234567',
    first_name: 'Laura'
  },
  '839066315952659',
  '68ce063786003b3788df5a59',
  {
    nombre: 'first_name',
    empresa: 'missing_column'
  }
);

const missingParam = namedPayloadWithMissingValue.meta_body?.template?.components?.[0]?.parameters?.[1];
if (!missingParam || missingParam.parameter_name !== 'empresa' || missingParam.text !== '') {
  throw new Error('Las variables named faltantes deben enviarse vacías');
}

// Test mixed variables: debe fallar
let mixedFailed = false;
try {
  buildTemplatePayload(
    mixedTemplate,
    {
      telefono: '3001234567',
      nombre: 'Carlos'
    },
    '839066315952659',
    '68ce063786003b3788df5a59'
  );
} catch (_error) {
  mixedFailed = true;
}

if (!mixedFailed) {
  throw new Error('Las plantillas mixtas deben ser rechazadas');
}

export {};