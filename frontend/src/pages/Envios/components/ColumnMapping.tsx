import React, { useState, useEffect } from 'react';
import { ArrowRight, Phone, User, Check } from 'lucide-react';

interface Template {
  id: string;
  name: string;
  components: {
    header?: {
      text?: string;
    };
    body: {
      text: string;
    };
    footer?: {
      text: string;
    };
  };
}

interface ColumnMappingProps {
  template: Template;
  csvHeaders: string[];
  onMappingComplete: (mapping: Record<string, string>) => void;
}

const ColumnMapping: React.FC<ColumnMappingProps> = ({
  template,
  csvHeaders,
  onMappingComplete
}) => {
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [phoneColumn, setPhoneColumn] = useState<string>('');

  // Extract variables from template
  const extractVariables = (): string[] => {
    const allText = [
      template.components.header?.text || '',
      template.components.body.text,
      template.components.footer?.text || ''
    ].join(' ');
    
    const variables = Array.from(new Set(
      allText.match(/\{\{(\d+)\}\}/g) || []
    )).sort();
    
    return variables;
  };

  const variables = extractVariables();

  // Auto-detect phone column
  useEffect(() => {
    const phonePatterns = ['telefono', 'phone', 'celular', 'movil', 'numero'];
    const detectedPhone = csvHeaders.find(header => 
      phonePatterns.some(pattern => 
        header.toLowerCase().includes(pattern)
      )
    );
    if (detectedPhone) {
      setPhoneColumn(detectedPhone);
    }
  }, [csvHeaders]);

  // Auto-detect variable mappings
  useEffect(() => {
    const autoMapping: Record<string, string> = {};
    
    variables.forEach(variable => {
      const variableNum = variable.replace(/[{}]/g, '');
      
      // Common mappings
      const mappings: Record<string, string[]> = {
        '1': ['nombre', 'name', 'first_name', 'firstname'],
        '2': ['apellido', 'last_name', 'lastname', 'codigo', 'code'],
        '3': ['empresa', 'company', 'organizacion', 'organization'],
        '4': ['descuento', 'discount', 'porcentaje', 'percentage'],
        '5': ['fecha', 'date', 'deadline', 'vencimiento']
      };
      
      if (mappings[variableNum]) {
        const detectedColumn = csvHeaders.find(header => 
          mappings[variableNum].some(pattern => 
            header.toLowerCase().includes(pattern)
          )
        );
        if (detectedColumn) {
          autoMapping[variable] = detectedColumn;
        }
      }
    });
    
    setMapping(autoMapping);
  }, [variables, csvHeaders]);

  const handleMappingChange = (variable: string, column: string) => {
    setMapping(prev => ({
      ...prev,
      [variable]: column
    }));
  };

  const isComplete = () => {
    return phoneColumn && variables.every(variable => mapping[variable]);
  };

  const handleComplete = () => {
    if (isComplete()) {
      onMappingComplete({
        ...mapping,
        phone: phoneColumn
      });
    }
  };

  const getVariableDescription = (variable: string) => {
    const descriptions: Record<string, string> = {
      '{{1}}': 'Primera variable (ej: nombre)',
      '{{2}}': 'Segunda variable (ej: código, descuento)',
      '{{3}}': 'Tercera variable (ej: empresa, fecha)',
      '{{4}}': 'Cuarta variable',
      '{{5}}': 'Quinta variable'
    };
    return descriptions[variable] || `Variable ${variable}`;
  };

  return (
    <div className="space-y-6">
      {/* Phone Number Mapping */}
      <div className="bg-white/5 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-3">
          <Phone className="w-5 h-5 text-accent" />
          <h3 className="text-white font-medium">Columna de teléfono (Obligatorio)</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          <div className="text-white/70 text-sm">
            Los números de teléfono son necesarios para enviar los mensajes
          </div>
          <ArrowRight className="w-5 h-5 text-white/40 mx-auto" />
          <select
            value={phoneColumn}
            onChange={(e) => setPhoneColumn(e.target.value)}
            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:border-accent focus:outline-none"
          >
            <option value="">Selecciona una columna</option>
            {csvHeaders.map(header => (
              <option key={header} value={header} className="bg-gray-800">
                {header}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Template Variables Mapping */}
      {variables.length > 0 && (
        <div className="bg-white/5 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-4">
            <User className="w-5 h-5 text-accent" />
            <h3 className="text-white font-medium">Variables de la plantilla</h3>
          </div>

          <div className="space-y-4">
            {variables.map(variable => (
              <div key={variable} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center p-3 bg-white/5 rounded-lg">
                <div>
                  <div className="text-accent font-medium text-sm mb-1">
                    {variable}
                  </div>
                  <div className="text-white/60 text-xs">
                    {getVariableDescription(variable)}
                  </div>
                </div>
                
                <ArrowRight className="w-5 h-5 text-white/40 mx-auto" />
                
                <select
                  value={mapping[variable] || ''}
                  onChange={(e) => handleMappingChange(variable, e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:border-accent focus:outline-none"
                >
                  <option value="">Selecciona una columna</option>
                  {csvHeaders.map(header => (
                    <option key={header} value={header} className="bg-gray-800">
                      {header}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preview Section */}
      <div className="bg-white/5 rounded-lg p-4">
        <h3 className="text-white font-medium mb-3">Vista previa del mapeo</h3>
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between items-center p-2 bg-white/5 rounded">
            <span className="text-white/70">Teléfono:</span>
            <span className="text-white">
              {phoneColumn || 'No seleccionado'}
            </span>
          </div>
          
          {variables.map(variable => (
            <div key={variable} className="flex justify-between items-center p-2 bg-white/5 rounded">
              <span className="text-white/70">{variable}:</span>
              <span className="text-white">
                {mapping[variable] || 'No seleccionado'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Example Message Preview */}
      <div className="bg-white/5 rounded-lg p-4">
        <h3 className="text-white font-medium mb-3">Ejemplo de mensaje resultante</h3>
        
        <div className="bg-[#075e54] rounded-lg p-4 max-w-sm">
          <div className="bg-white rounded-lg p-3 shadow-md">
            <div className="text-sm text-gray-800">
              {template.components.body.text.replace(/\{\{(\d+)\}\}/g, (match, num) => {
                const variable = `{{${num}}}`;
                const column = mapping[variable];
                return column ? `[${column}]` : match;
              })}
            </div>
            {template.components.footer?.text && (
              <div className="text-xs text-gray-500 mt-2">
                {template.components.footer.text}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Complete Button */}
      <div className="flex justify-center">
        <button
          onClick={handleComplete}
          disabled={!isComplete()}
          className={`px-6 py-3 rounded-lg transition-all duration-200 flex items-center space-x-2 ${
            isComplete()
              ? 'bg-accent hover:bg-accent/80 text-white'
              : 'bg-white/10 text-white/50 cursor-not-allowed'
          }`}
        >
          <Check className="w-5 h-5" />
          <span>Continuar con la vista previa</span>
        </button>
      </div>

      {/* Status Messages */}
      {!phoneColumn && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
          <p className="text-yellow-400 text-sm">
            ⚠️ Debes seleccionar una columna de teléfono para continuar
          </p>
        </div>
      )}

      {variables.some(v => !mapping[v]) && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
          <p className="text-yellow-400 text-sm">
            ⚠️ Debes mapear todas las variables de la plantilla
          </p>
        </div>
      )}

      {isComplete() && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
          <p className="text-green-400 text-sm">
            ✅ Mapeo completado. Puedes continuar a la vista previa.
          </p>
        </div>
      )}
    </div>
  );
};

export default ColumnMapping;