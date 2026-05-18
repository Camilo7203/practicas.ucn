import React, { useState, useEffect } from 'react';
import { Upload, FileText, ArrowRight, Eye, Download, RefreshCw, Send, AlertCircle, CheckCircle, User } from 'lucide-react';
import { ITemplate } from '@/interfaces/templates/templateInterface';
import CampaignPreview from './CampaignPreview';
import { listApprovedTemplates, listBlackLists, sendBulkCampaign } from '@/services/whatsappTemplates';
import type { BulkCampaignResponse, BulkCampaignRecipientDetail } from '@/services/whatsappTemplates/sendTemplateService';
import { useOrganization } from '../../hooks/useOrganization';
import { agentsService, type AgentData } from '../../services/agentsService';
import { useTranslation } from 'react-i18next';

export interface CSVColumn {
  name: string;
  sampleData: string[];
}

interface VariableMapping {
  [key: string]: string;
}

const SendTab: React.FC = () => {
  const { t } = useTranslation();

  const getStatusBadge = (status: BulkCampaignRecipientDetail['status']) => {
    if (status === 'sent') {
      return 'bg-green-100 text-green-800';
    }

    if (status === 'skipped') {
      return 'bg-amber-100 text-amber-800';
    }

    return 'bg-red-100 text-red-800';
  };

  const getStatusLabel = (status: BulkCampaignRecipientDetail['status']) => {
    if (status === 'sent') {
      return t('shipments.sent');
    }

    if (status === 'skipped') {
      return t('shipments.skipped');
    }

    return t('shipments.failed');
  };

  const escapeCSVValue = (value: unknown): string => {
    const text = String(value ?? '');
    if (text.includes(',') || text.includes('"') || text.includes('\n')) {
      return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
  };

  const getAllTemplateVariableKeys = (
    details: BulkCampaignRecipientDetail[]
  ): string[] => {
    const keys = new Set<string>();
    details.forEach((detail) => {
      Object.keys(detail.templateVariables || {}).forEach((key) => keys.add(key));
    });
    return Array.from(keys);
  };

  const downloadRecipientDetailsCSV = () => {
    const details = sendingResults?.results?.recipientDetails || [];
    if (details.length === 0) {
      return;
    }

    const variableKeys = getAllTemplateVariableKeys(details);
    const headers = [
      'fila',
      'persona',
      'telefono',
      'estado',
      'motivo_error',
      'message_id',
      ...variableKeys.map((key) => `var_${key}`),
    ];

    const rows = details.map((detail) => [
      detail.row,
      detail.name || '',
      detail.phone || '',
      detail.status,
      detail.errorReason || '',
      detail.messageId || '',
      ...variableKeys.map((key) => detail.templateVariables?.[key] || ''),
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => escapeCSVValue(cell)).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analitica_templates_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadRecipientDetailsExcel = () => {
    const details = sendingResults?.results?.recipientDetails || [];
    if (details.length === 0) {
      return;
    }

    const variableKeys = getAllTemplateVariableKeys(details);

    const headers = [
      'Fila',
      'Persona',
      'Teléfono',
      'Estado',
      'Motivo / Error',
      'Message ID',
      ...variableKeys.map((key) => `Variable: ${key}`),
    ];

    const headerHtml = headers.map((header) => `<th>${String(header)}</th>`).join('');
    const rowsHtml = details
      .map((detail) => {
        const values = [
          detail.row,
          detail.name || '',
          detail.phone || '',
          detail.status,
          detail.errorReason || '',
          detail.messageId || '',
          ...variableKeys.map((key) => detail.templateVariables?.[key] || ''),
        ];

        const cells = values
          .map((value) => `<td>${String(value).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td>`)
          .join('');

        return `<tr>${cells}</tr>`;
      })
      .join('');

    const html = `
      <html>
        <head><meta charset="UTF-8" /></head>
        <body>
          <table border="1">
            <thead><tr>${headerHtml}</tr></thead>
            <tbody>${rowsHtml}</tbody>
          </table>
        </body>
      </html>
    `;

    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analitica_templates_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.xls`;
    link.click();
    URL.revokeObjectURL(url);
  };
  
  // Estados principales
  const [selectedAgent, setSelectedAgent] = useState<AgentData | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<ITemplate | null>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvColumns, setCsvColumns] = useState<CSVColumn[]>([]);
  const [variableMappings, setVariableMappings] = useState<VariableMapping>({});
  const [phoneColumnMapping, setPhoneColumnMapping] = useState<string>(''); // Nueva columna para teléfonos
  const [showPreview, setShowPreview] = useState(false);
  const [currentStep, setCurrentStep] = useState<0 | 1 | 2 | 3 | 4>(0); // 0 = Seleccionar Agente

  // Estados para agentes
  const [agents, setAgents] = useState<AgentData[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(false);
  
  // Estados para templates
  const [templates, setTemplates] = useState<ITemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [templatesError, setTemplatesError] = useState<string | null>(null);
  
  // Estados para el envío de campañas
  const [isSending, setIsSending] = useState(false);
  const [sendingProgress, setSendingProgress] = useState({ sent: 0, total: 0, errors: [] as string[], skipped: 0 });
  const [sendingComplete, setSendingComplete] = useState(false);
  const [sendingResults, setSendingResults] = useState<BulkCampaignResponse | null>(null);
  const [blacklistNumbers, setBlacklistNumbers] = useState<string[]>([]);

  // Obtener organización del usuario autenticado
  const { organizationId } = useOrganization();

  // Cargar agentes cuando se monte el componente
  useEffect(() => {
    const loadAgents = async () => {
      setLoadingAgents(true);
      try {
        const response = await agentsService.getAgents();
        if (response.data && response.data.agents) {
          setAgents(response.data.agents);
        }
      } catch (error) {
        console.error('Error cargando agentes:', error);
      } finally {
        setLoadingAgents(false);
      }
    };

    loadAgents();
  }, []);

  // Cargar plantillas cuando se seleccione un agente
  useEffect(() => {
    if (selectedAgent && organizationId) {
      loadApprovedTemplates();
      loadBlacklistForAgent();
    }
  }, [selectedAgent, organizationId]);

  const loadBlacklistForAgent = async () => {
    if (!selectedAgent) {
      setBlacklistNumbers([]);
      return;
    }

    try {
      const agentId = selectedAgent.id || selectedAgent._id;
      const response = await listBlackLists(agentId, true);

      if (response.success && Array.isArray(response.data)) {
        const allNumbers = response.data.flatMap((item) => item.numbers || []);
        const normalized = Array.from(new Set(allNumbers.map((number) => number.replace(/\D/g, ''))));
        setBlacklistNumbers(normalized);
      } else {
        setBlacklistNumbers([]);
      }
    } catch (error) {
      console.error('Error cargando blacklist para envío:', error);
      setBlacklistNumbers([]);
    }
  };

  const loadApprovedTemplates = async () => {
    // Solo cargar si tenemos organization ID y agente seleccionado
    if (!organizationId) {
      setTemplatesError('No se pudo obtener la organización del usuario');
      setTemplates(mockTemplates); // Usar fallback
      return;
    }

    if (!selectedAgent) {
      setTemplatesError(t('shipments.mustSelectAgentFirst'));
      setTemplates([]);
      return;
    }

    setLoadingTemplates(true);
    setTemplatesError(null);
    
    try {
      const agentId = selectedAgent.id || selectedAgent._id;
      const response = await listApprovedTemplates(organizationId, agentId);
      
      if (response.success && response.data) {
        setTemplates(response.data);
      } else {
        setTemplatesError(response.error || 'Error al cargar plantillas');
        // Fallback a plantillas de ejemplo si no se pueden cargar desde MongoDB
        setTemplates(mockTemplates);
      }
    } catch (err) {
      console.error('Error loading approved templates:', err);
      setTemplatesError('Error de conexión al cargar plantillas');
      // Fallback a plantillas de ejemplo
      setTemplates(mockTemplates);
    } finally {
      setLoadingTemplates(false);
    }
  };

  // Plantillas de ejemplo (fallback)
  const mockTemplates: ITemplate[] = [
    {
      name: 'bienvenida_cliente',
      category: 'MARKETING',
      language: 'es',
      status: 'APPROVED',
      components: [
        {
          type: "BODY",
          text: 'Hola {{1}}, bienvenido a {{2}}! Estamos felices de tenerte con nosotros.',
        }
      ],
      createdAt: new Date().toISOString(),
    }
  ];

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setCsvFile(file);
      parseCSV(file);
    }
  };

  const parseCSV = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      
      const columns: CSVColumn[] = headers.map((header) => {
        const sampleData = lines.slice(1, 4).map(line => {
          const values = line.split(',');
          const index = headers.indexOf(header);
          return values[index]?.trim() || '';
        }).filter(v => v);
        
        return {
          name: header,
          sampleData,
        };
      });

      setCsvColumns(columns);
      // Limpiar mapeos cuando se carga un nuevo CSV
      setVariableMappings({});
      setPhoneColumnMapping('');
      setCurrentStep(2);
    };
    reader.readAsText(file);
  };

  const getTemplateVariables = (template: ITemplate): string[] => {
    const variables: string[] = [];

    const addVariable = (variable: string) => {
      if (!variable) {
        return;
      }

      const normalized = variable.trim();
      if (normalized && !variables.includes(normalized)) {
        variables.push(normalized);
      }
    };
    
    // Si la plantilla tiene el campo 'variables' de MongoDB
    if ((template as any).variables) {
      const mongoVariables = (template as any).variables;
      if (Array.isArray(mongoVariables)) {
        mongoVariables.forEach((variable: string) => addVariable(variable));
      } else {
        Object.keys(mongoVariables).forEach(componentType => {
          const componentVars = mongoVariables[componentType];
          if (componentVars && componentVars.variables) {
            componentVars.variables.forEach((variable: string) => addVariable(variable));
          }
        });
      }
    }
    
    return variables;
  };


  const handleMappingChange = (variable: string, column: string) => {
    setVariableMappings({
      ...variableMappings,
      [variable]: column,
    });
  };

  const handleSendCampaign = async () => {
    if (!selectedAgent) {
      alert('⚠️ ' + t('shipments.mustSelectAgentFirst'));
      return;
    }

    if (!selectedTemplate || !csvFile) {
      alert('⚠️ Selecciona una plantilla y carga un archivo CSV');
      return;
    }

    if (!organizationId) {
      alert('⚠️ No se pudo obtener la organización del usuario');
      return;
    }

    setIsSending(true);
    setSendingComplete(false);
    setSendingProgress({ sent: 0, total: 0, errors: [], skipped: 0 });

    try {
      const agentProviderId = selectedAgent.provider_id || selectedAgent.id || selectedAgent._id;
      
      // Parsear CSV
      const csvData = await parseCSVData(csvFile);

      // Enviar campaña masiva
      console.log('Enviando campaña con los siguientes datos:', {
        template: selectedTemplate,
        csvData,
        agentProviderId,
        organizationId,
        variableMappings,
        phoneColumnMapping,
      });
      const result = await sendBulkCampaign(
        selectedTemplate,
        csvData,
        agentProviderId,
        organizationId,
        variableMappings,
        phoneColumnMapping,
        (progress) => {
          setSendingProgress(progress);
        },
        blacklistNumbers
      );

      setSendingResults(result);
      setSendingComplete(true);

      if (result.success) {
        alert(`✅ Campaña enviada exitosamente!\n\n📊 Resultados:\n• Enviados: ${result.results.sent}\n• Omitidos (blacklist): ${result.results.skipped}\n• Fallidos: ${result.results.failed}\n• Total: ${result.results.total}`);
      } else {
        alert(`❌ La campaña completó con errores:\n\n📊 Resultados:\n• Enviados: ${result.results.sent}\n• Omitidos (blacklist): ${result.results.skipped}\n• Fallidos: ${result.results.failed}\n• Total: ${result.results.total}\n\n⚠️ Revisa la consola para más detalles.`);
      }
    } catch (error) {
      console.error('Error en envío de campaña:', error);
      alert(`❌ Error inesperado: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setIsSending(false);
    }
  };

  // Función auxiliar para parsear CSV
  const parseCSVData = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const lines = text.split('\n').filter(line => line.trim());
          const headers = lines[0].split(',').map(h => h.trim());
          
          const data = lines.slice(1).map(line => {
            const values = line.split(',').map(v => v.trim());
            const row: any = {};
            headers.forEach((header, index) => {
              row[header] = values[index] || '';
            });
            return row;
          });

          resolve(data);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const canProceedToMapping = selectedTemplate && csvFile && csvColumns.length > 0;
  
  // Verificar si la template tiene variables
  const templateHasVariables = selectedTemplate ? getTemplateVariables(selectedTemplate).length > 0 : false;
  
  // Para templates con variables: requiere mapeo de variables
  // Para templates sin variables: requiere selección de columna de teléfono
  const canProceedToPreview = canProceedToMapping && (
    templateHasVariables 
      ? Object.keys(variableMappings).length > 0 
      : phoneColumnMapping !== ''
  );

  const downloadSampleCSV = () => {
    if (!selectedTemplate) {
      // CSV genérico si no hay plantilla seleccionada
      const csv = 'nombre,apellido,empresa\nJuan,Pérez,Acme Corp\nMaría,González,Tech Solutions\nCarlos,Rodríguez,Digital Agency';
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'ejemplo.csv';
      a.click();
      return;
    }

    // Obtener variables de la plantilla seleccionada
    const variables = getTemplateVariables(selectedTemplate);
    
    if (variables.length === 0) {
      // Si no hay variables, crear un CSV básico
      const csv = 'nombre,telefono\nJuan Pérez,573001234567\nMaría González,573007654321\nCarlos Rodríguez,573009876543';
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ejemplo_${selectedTemplate.name}.csv`;
      a.click();
      return;
    }

    // Generar nombres de columnas basados en las variables
    const columnNames = variables.map(variable => {
      // Convertir variables posicionales a nombres más descriptivos
      if (/^\d+$/.test(variable)) {
        switch (variable) {
          case '1': return 'nombre';
          case '2': return 'empresa';
          case '3': return 'cargo';
          case '4': return 'ciudad';
          case '5': return 'telefono';
          case '6': return 'email';
          case '7': return 'apellido';
          case '8': return 'direccion';
          case '9': return 'fecha';
          case '10': return 'producto';
          default: return `variable_${variable}`;
        }
      }
      // Para variables con nombre, usar el nombre directamente pero limpiarlo
      return variable.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    });

    // Usar ejemplos de la plantilla si están disponibles
    let sampleData = [
      ['Juan Pérez', 'Acme Corp', 'Gerente', 'Bogotá', '573001234567', 'juan@acme.com', 'Pérez', 'Calle 123 #45-67', '2024-01-15', 'Producto A'],
      ['María González', 'Tech Solutions', 'Desarrolladora', 'Medellín', '573007654321', 'maria@tech.com', 'González', 'Carrera 50 #30-20', '2024-01-16', 'Producto B'],
      ['Carlos Rodríguez', 'Digital Agency', 'Diseñador', 'Cali', '573009876543', 'carlos@digital.com', 'Rodríguez', 'Avenida 6 #15-30', '2024-01-17', 'Producto C']
    ];

    // Si la plantilla de MongoDB tiene ejemplos, usarlos
    if ((selectedTemplate as any).variables) {
      const mongoVariables = (selectedTemplate as any).variables;
      Object.keys(mongoVariables).forEach(componentType => {
        const componentVars = mongoVariables[componentType];
        if (componentVars && componentVars.examples && componentVars.examples.length > 0) {
          // Reemplazar los primeros valores con los ejemplos de MongoDB
          componentVars.examples.forEach((example: string, index: number) => {
            if (index < variables.length) {
              sampleData.forEach(row => {
                if (row.length > index) {
                  row[index] = example;
                }
              });
            }
          });
        }
      });
    }

    // Agregar columna de teléfono si no existe
    if (!columnNames.includes('telefono') && !columnNames.includes('phone')) {
      columnNames.push('telefono');
    }

    // Crear el contenido CSV
    const headers = columnNames.join(',');
    const rows = sampleData.map(row => {
      // Ajustar los datos al número de columnas necesarias
      const adjustedRow = [];
      for (let i = 0; i < columnNames.length; i++) {
        if (i < row.length) {
          adjustedRow.push(row[i]);
        } else {
          // Generar datos adicionales si es necesario
          adjustedRow.push(`valor_${i + 1}`);
        }
      }
      return adjustedRow.join(',');
    }).join('\n');

    const csv = `${headers}\n${rows}`;
    
    // Descargar el archivo
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ejemplo_${selectedTemplate.name}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Indicador de pasos */}
      <div className="bg-surface rounded-xl border border-border p-6">
        <div className="flex items-center justify-between">
          <div className={`flex-1 text-center ${currentStep >= 0 ? 'text-accent' : 'text-textMuted'}`}>
            <div className={`w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center ${
              currentStep >= 0 ? 'bg-accent text-white' : 'bg-muted text-textMuted'
            }`}>
              1
            </div>
            <p className="text-sm font-medium">{t('shipments.selectAgent')}</p>
          </div>
          <ArrowRight className="w-5 h-5 text-textMuted" />
          <div className={`flex-1 text-center ${currentStep >= 1 ? 'text-accent' : 'text-textMuted'}`}>
            <div className={`w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center ${
              currentStep >= 1 ? 'bg-accent text-white' : 'bg-muted text-textMuted'
            }`}>
              2
            </div>
            <p className="text-sm font-medium">{t('shipments.selectTemplate')}</p>
          </div>
          <ArrowRight className="w-5 h-5 text-textMuted" />
          <div className={`flex-1 text-center ${currentStep >= 2 ? 'text-accent' : 'text-textMuted'}`}>
            <div className={`w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center ${
              currentStep >= 2 ? 'bg-accent text-white' : 'bg-muted text-textMuted'
            }`}>
              3
            </div>
            <p className="text-sm font-medium">{t('shipments.uploadCSV')}</p>
          </div>
          <ArrowRight className="w-5 h-5 text-textMuted" />
          <div className={`flex-1 text-center ${currentStep >= 3 ? 'text-accent' : 'text-textMuted'}`}>
            <div className={`w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center ${
              currentStep >= 3 ? 'bg-accent text-white' : 'bg-muted text-textMuted'
            }`}>
              4
            </div>
            <p className="text-sm font-medium">{t('shipments.mapVariables')}</p>
          </div>
          <ArrowRight className="w-5 h-5 text-textMuted" />
          <div className={`flex-1 text-center ${currentStep >= 4 ? 'text-accent' : 'text-textMuted'}`}>
            <div className={`w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center ${
              currentStep >= 4 ? 'bg-accent text-white' : 'bg-muted text-textMuted'
            }`}>
              5
            </div>
            <p className="text-sm font-medium">{t('shipments.previewAndSend')}</p>
          </div>
        </div>
      </div>

      {/* Paso 0: Selección de agente */}
      <div className="bg-surface rounded-xl border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-textPrimary">1. {t('shipments.selectAgent')}</h3>
          <div className="flex items-center space-x-2 text-sm text-textMuted">
            <User className="w-4 h-4" />
            <span>Agentes de tu organización</span>
          </div>
        </div>
        
        {loadingAgents ? (
          <div className="text-center py-8">
            <RefreshCw className="w-8 h-8 text-textMuted mx-auto mb-3 animate-spin" />
            <p className="text-textMuted">{t('shipments.loadingAgents')}</p>
          </div>
        ) : agents.length === 0 ? (
          <div className="text-center py-8">
            <User className="w-12 h-12 text-textMuted mx-auto mb-3" />
            <p className="text-textMuted">{t('shipments.noAgentsAvailable')}</p>
            <p className="text-sm text-textMuted mt-1">{t('shipments.noAgentsHint')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents.map((agent) => (
              <button
                key={agent.id || agent._id}
                onClick={() => {
                  setSelectedAgent(agent);
                  setCurrentStep(1);
                  // Limpiar templates y estado relacionado cuando se cambia de agente
                  setSelectedTemplate(null);
                  setTemplates([]);
                  setCsvFile(null);
                  setCsvColumns([]);
                  setVariableMappings({});
                  setPhoneColumnMapping('');
                }}
                className={`text-left p-4 border rounded-lg transition-all ${
                  selectedAgent?.id === agent.id || selectedAgent?._id === agent._id
                    ? 'border-accent bg-accent/5 shadow-sm'
                    : 'border-border hover:border-accent/50'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-textPrimary">{agent.name}</h4>
                  {(selectedAgent?.id === agent.id || selectedAgent?._id === agent._id) && (
                    <div className="w-5 h-5 bg-accent rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-textMuted">{t('shipments.provider')}</span>
                    <span className="font-medium text-textPrimary capitalize">{agent.provider}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-textMuted">{t('shipments.providerId')}</span>
                    <span className="font-medium text-textPrimary text-xs">
                      {agent.provider_id ? `${agent.provider_id.substring(0, 12)}...` : t('common.notAvailable')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-textMuted">{t('shipments.state')}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      agent.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {agent.is_active ? t('common.active') : t('common.inactive')}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Paso 1: Selección de plantilla */}
      {selectedAgent && (
        <div className="bg-surface rounded-xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-textPrimary">
              2. {t('shipments.selectTemplate')} 
              <span className="text-sm text-textMuted font-normal ml-2">
                ({t('common.for')} {selectedAgent.name})
              </span>
            </h3>
            <button
              onClick={loadApprovedTemplates}
              disabled={loadingTemplates}
              className="text-sm text-accent hover:text-highlight transition-colors flex items-center space-x-1 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loadingTemplates ? 'animate-spin' : ''}`} />
              <span>Actualizar</span>
            </button>
          </div>
        
        {templatesError && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700 text-sm">
            {templatesError} - Se muestran plantillas de ejemplo.
          </div>
        )}
        
        {loadingTemplates ? (
          <div className="text-center py-8">
            <RefreshCw className="w-8 h-8 text-textMuted mx-auto mb-3 animate-spin" />
            <p className="text-textMuted">{t('shipments.loadingApprovedTemplates')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <button
                key={template.name}
                onClick={() => {
                  setSelectedTemplate(template);
                  setCurrentStep(2);
                  // Limpiar mapeos cuando se selecciona una nueva plantilla
                  setVariableMappings({});
                  setPhoneColumnMapping('');
                }}
                className={`text-left p-4 border rounded-lg transition-all ${
                  selectedTemplate?.name === template.name
                    ? 'border-accent bg-accent/5 shadow-sm'
                    : 'border-border hover:border-accent/50'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-textPrimary">{template.name}</h4>
                  {selectedTemplate?.name === template.name && (
                    <div className="w-5 h-5 bg-accent rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 mb-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    template.category === 'MARKETING' ? 'bg-blue-50 text-blue-600' :
                    template.category === 'UTILITY' ? 'bg-green-50 text-green-600' :
                    'bg-purple-50 text-purple-600'
                  }`}>
                    {template.category}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    template.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                    template.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {template.status}
                  </span>
                </div>
                <div className="text-xs text-textMuted">
                  Variables: {(template as any).variable_count || 0} | Idioma: {template.language}
                </div>
              </button>
            ))}
          </div>
        )}

        {!loadingTemplates && templates.length === 0 && (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-textMuted mx-auto mb-3" />
            <p className="text-textMuted">{t('shipments.noApprovedTemplates')}</p>
            <p className="text-sm text-textMuted mt-1">{t('shipments.noApprovedTemplatesHint')}</p>
          </div>
        )}
        </div>
      )}

      {/* Paso 2: Upload CSV */}
      {selectedTemplate && (
        <div className="bg-surface rounded-xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-textPrimary">3. {t('shipments.uploadYourCSV')}</h3>
            <button
              onClick={downloadSampleCSV}
              className="flex items-center space-x-2 text-sm text-accent hover:text-highlight transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>{t('shipments.downloadSampleCSV')}</span>
            </button>
          </div>

          {/* Mostrar variables detectadas en la plantilla */}
          {(() => {
            const variables = getTemplateVariables(selectedTemplate);
            if (variables.length > 0) {
              return (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-medium text-blue-800 mb-2">
                    {t('shipments.variablesDetectedInTemplate', { templateName: selectedTemplate.name })}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {variables.map((variable) => (
                      <code key={variable} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                        {`{{${variable}}}`}
                      </code>
                    ))}
                  </div>
                  <p className="text-xs text-blue-600 mt-2">
                    {t('shipments.sampleCSVWillIncludeColumns')}
                  </p>
                </div>
              );
            }
            return null;
          })()}

          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-accent/50 transition-colors">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
              id="csv-upload"
            />
            <label htmlFor="csv-upload" className="cursor-pointer">
              <Upload className="w-12 h-12 text-textMuted mx-auto mb-3" />
              <p className="text-textPrimary font-medium mb-1">
                {csvFile ? csvFile.name : t('shipments.clickToUploadOrDrag')}
              </p>
              <p className="text-sm text-textMuted">
                {t('shipments.fileMustContainColumns')}
              </p>
            </label>
          </div>

          {csvFile && csvColumns.length > 0 && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <p className="text-sm text-textSecondary mb-2">
                <strong>{t('shipments.fileLoaded')}</strong> {csvFile.name}
              </p>
              <p className="text-sm text-textMuted">
                <strong>{t('shipments.columnsDetected')}</strong> {csvColumns.map(c => c.name).join(', ')}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Paso 3: Mapeo de variables */}
      {canProceedToMapping && (
        <div className="bg-surface rounded-xl border border-border p-6">
          <h3 className="font-semibold text-textPrimary mb-4">4. {t('shipments.mapTheVariables')}</h3>
          
          {(() => {
            const variables = getTemplateVariables(selectedTemplate);
            
            if (variables.length === 0) {
              return (
                <div className="space-y-4">
                  <div className="text-center py-2 text-textMuted mb-4">
                    {t('shipments.noVariablesToMap')}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center p-4 border border-border rounded-lg">
                    <div>
                      <label className="text-sm font-medium text-textPrimary">
                        {t('shipments.phoneColumnLabel')}
                      </label>
                    </div>
                    <div className="md:col-span-2">
                      <select
                        value={phoneColumnMapping}
                        onChange={(e) => setPhoneColumnMapping(e.target.value)}
                        className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50 bg-background text-textPrimary"
                      >
                        <option value="">{t('shipments.selectPhoneColumn')}</option>
                        {csvColumns.map((column) => (
                          <option key={column.name} value={column.name}>
                            {column.name} ({t('common.example')}: {column.sampleData[0]})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div className="space-y-4">
                {variables.map((variable) => (
                  <div key={variable} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center p-4 border border-border rounded-lg">
                    <div>
                      <label className="text-sm font-medium text-textPrimary">
                        {t('shipments.variable')} <code className="px-2 py-1 bg-muted rounded text-accent">{`{{${variable}}}`}</code>
                      </label>
                    </div>
                    <div className="md:col-span-2">
                      <select
                        value={variableMappings[variable] || ''}
                        onChange={(e) => handleMappingChange(variable, e.target.value)}
                        className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50 bg-background text-textPrimary"
                      >
                        <option value="">{t('shipments.selectColumn')}</option>
                        {csvColumns.map((column) => (
                          <option key={column.name} value={column.name}>
                            {column.name} ({t('common.example')}: {column.sampleData[0]})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}

          {canProceedToPreview && (
            <div className="mt-6 space-y-4">
              {/* Progreso del envío */}
              {isSending && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
                    <span className="text-sm font-medium text-blue-800">
                      {t('shipments.sendingCampaign')}
                    </span>
                  </div>
                  <div className="text-sm text-blue-600">
                    {t('shipments.sent')} {sendingProgress.sent} {t('shipments.of')} {sendingProgress.total}
                  </div>
                  {sendingProgress.skipped > 0 && (
                    <div className="mt-1 text-xs text-amber-700">
                      {t('shipments.skipped')} {sendingProgress.skipped}
                    </div>
                  )}
                  {sendingProgress.errors.length > 0 && (
                    <div className="mt-2 text-xs text-red-600">
                      {t('shipments.errors')} {sendingProgress.errors.length}
                    </div>
                  )}
                </div>
              )}

              {/* Resultados del envío */}
              {sendingComplete && sendingResults && (
                <div className={`p-4 border rounded-lg ${
                  sendingResults.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center space-x-2 mb-2">
                    {sendingResults.success ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-600" />
                    )}
                    <span className={`text-sm font-medium ${
                      sendingResults.success ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {sendingResults.success ? t('shipments.campaignCompleted') : t('shipments.campaignWithErrors')}
                    </span>
                  </div>
                  <div className={`text-sm ${
                    sendingResults.success ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {t('shipments.sent')} {sendingResults.results.sent} | 
                    {t('shipments.skipped')} {sendingResults.results.skipped} |
                    {t('shipments.failed')} {sendingResults.results.failed} | 
                    {t('shipments.total')} {sendingResults.results.total}
                  </div>
                  {sendingResults.results.skippedRows?.length > 0 && (
                    <details className="mt-2">
                      <summary className="text-xs cursor-pointer text-amber-700">
                        {t('shipments.viewSkipped')} ({sendingResults.results.skippedRows.length})
                      </summary>
                      <div className="mt-1 text-xs text-amber-700 max-h-32 overflow-y-auto">
                        {sendingResults.results.skippedRows.map((item: {row: number; phone: string; reason: string}, index: number) => (
                          <div key={index}>Fila {item.row}: {item.phone} - {item.reason}</div>
                        ))}
                      </div>
                    </details>
                  )}
                  {sendingResults.results.errors.length > 0 && (
                    <details className="mt-2">
                      <summary className="text-xs cursor-pointer text-red-600">
                        {t('shipments.viewErrors')} ({sendingResults.results.errors.length})
                      </summary>
                      <div className="mt-1 text-xs text-red-500 max-h-32 overflow-y-auto">
                        {sendingResults.results.errors.map((error: string, index: number) => (
                          <div key={index}>{error}</div>
                        ))}
                      </div>
                    </details>
                  )}

                  {sendingResults.results.recipientDetails?.length > 0 && (
                    <details className="mt-3" open>
                      <summary className="text-xs cursor-pointer text-textPrimary font-medium">
                        Analítica detallada por destinatario ({sendingResults.results.recipientDetails.length})
                      </summary>
                      <div className="mt-2 flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={downloadRecipientDetailsCSV}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded border border-border text-textSecondary hover:text-textPrimary hover:bg-muted transition-colors"
                        >
                          <Download className="w-3 h-3" />
                          CSV
                        </button>
                        <button
                          type="button"
                          onClick={downloadRecipientDetailsExcel}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded border border-border text-textSecondary hover:text-textPrimary hover:bg-muted transition-colors"
                        >
                          <Download className="w-3 h-3" />
                          Excel
                        </button>
                      </div>
                      <div className="mt-2 max-h-96 overflow-auto border border-border rounded-lg bg-surface">
                        <table className="w-full text-xs">
                          <thead className="bg-muted sticky top-0 z-10">
                            <tr className="text-left text-textSecondary">
                              <th className="px-3 py-2">Fila</th>
                              <th className="px-3 py-2">Persona</th>
                              <th className="px-3 py-2">Teléfono</th>
                              <th className="px-3 py-2">Estado</th>
                              <th className="px-3 py-2">Motivo / Error</th>
                              <th className="px-3 py-2">Variables enviadas</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sendingResults.results.recipientDetails.map((detail: BulkCampaignRecipientDetail) => {
                              const variableEntries = Object.entries(detail.templateVariables || {});
                              return (
                                <tr key={`${detail.row}-${detail.phone}-${detail.status}`} className="border-t border-border align-top">
                                  <td className="px-3 py-2 text-textSecondary">{detail.row}</td>
                                  <td className="px-3 py-2 text-textPrimary">{detail.name || '—'}</td>
                                  <td className="px-3 py-2 text-textPrimary">{detail.phone || '—'}</td>
                                  <td className="px-3 py-2">
                                    <span className={`px-2 py-1 rounded-full text-[11px] font-medium ${getStatusBadge(detail.status)}`}>
                                      {getStatusLabel(detail.status)}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2 text-textSecondary">{detail.errorReason || '—'}</td>
                                  <td className="px-3 py-2">
                                    {variableEntries.length === 0 ? (
                                      <span className="text-textMuted">—</span>
                                    ) : (
                                      <div className="flex flex-wrap gap-1">
                                        {variableEntries.map(([key, value]) => (
                                          <span
                                            key={`${detail.row}-${key}`}
                                            className="px-2 py-1 rounded bg-muted text-textPrimary"
                                            title={`${key}: ${value}`}
                                          >
                                            {key}: {value || '""'}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </details>
                  )}
                </div>
              )}

              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setShowPreview(true)}
                  disabled={isSending}
                  className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  <Eye className="w-4 h-4" />
                  <span>{t('shipments.preview')}</span>
                </button>
                
                <button
                  onClick={handleSendCampaign}
                  disabled={isSending}
                  className="flex-1 bg-accent text-white px-6 py-3 rounded-lg hover:bg-highlight transition-colors flex items-center justify-center space-x-2 shadow-sm font-medium disabled:opacity-50"
                >
                  {isSending ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>{t('shipments.sending')}</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>{t('shipments.sendCampaign')}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal de Vista Previa */}
      {showPreview && selectedTemplate && csvColumns.length > 0 && (
        <CampaignPreview
          template={selectedTemplate}
          csvColumns={csvColumns}
          variableMappings={variableMappings}
          onClose={() => setShowPreview(false)}
          onSend={handleSendCampaign}
          isSending={isSending}
        />
      )}
    </div>
  );
};

export default SendTab;
