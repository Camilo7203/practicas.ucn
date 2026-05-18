import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Bot,
  Search,
  Trash2,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Settings,
  Users,
  Plus,
  AlertTriangle,
  ChevronDown,
} from 'lucide-react';
import agentService from '../../services/agentService';

interface Agent {
  id: string;
  name: string;
  description?: string;
  provider?: string;
  provider_id?: string;
  is_active: boolean;
  organization?: string;
  outbound_message_limit?: number;
  message_window_start?: number;
  conversation_sent_counter?: number;
  created_at?: string;
  updated_at?: string;
  model?: {
    provider?: string;
    model?: string;
    temperature?: number;
    top_p?: number;
  };
  settings?: {
    agent_name?: string;
    has_emojies?: boolean;
    gender?: string;
    language?: string;
    energy?: string;
    mind?: string;
    nature?: string;
    tactics?: string;
    identity?: string;
  };
}

// WhatsApp Embedded Signup data structure
interface WhatsAppEmbeddedSignupData {
  phone_number_id: string;
  waba_id: string;
  business_id: string;
  code?: string; // Exchangeable token code
}

// Legacy Facebook Auth (kept for backward compatibility)
interface FacebookAuthData {
  accessToken?: string;
  userID?: string;
  signedRequest?: string;
  expiresIn?: string;
  name?: string;
  email?: string;
  // WhatsApp Embedded Signup specific
  whatsapp_data?: WhatsAppEmbeddedSignupData;
}

interface NewAgentForm {
  name: string;
  provider: 'whatsapp' | 'telegram' | 'email' | 'instagram';
  model: 'gpt-3.5-turbo' | 'gpt-4' | 'claude-2' | 'gemini-1.5';
  provider_id: string;
  description: string;
  outbound_message_limit: number;
  message_window_start: number;
  registration_type: 'standard' | 'facebook';
  facebook_data?: FacebookAuthData;
  config: {
    temperature: number;
    top_p: number;
    api_key: string;
  };
  settings: {
    agent_name: string;
    has_emojies: boolean;
    gender: 'Male' | 'Female';
    language: string;
    energy: 'Introverded' | 'Extraverted';
    mind: 'Observant' | 'Intuitive';
    nature: 'Thinking' | 'Feeling';
    tactics: 'Judging' | 'Prospecting';
    identity: 'Assertive' | 'Turbulent';
  };
}

const AgentsPage: React.FC = () => {
  const { t } = useTranslation();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFacebookModal, setShowFacebookModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [deleteConfirmStep, setDeleteConfirmStep] = useState(0); // 0: closed, 1: first warning, 2: final confirmation
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isFacebookSDKLoaded, setIsFacebookSDKLoaded] = useState(false);
  const [facebookLoginStatus, setFacebookLoginStatus] = useState<'unknown' | 'connected' | 'not_authorized' | 'not_logged_in'>('unknown');

  // Initialize Facebook SDK
  useEffect(() => {
    // Check if Facebook App ID is configured
    const facebookAppId = import.meta.env.VITE_FACEBOOK_APP_ID;
    const configId = import.meta.env.VITE_FACEBOOK_CONFIG_ID;
    
    if (!facebookAppId || facebookAppId === 'your-facebook-app-id-here') {
      console.error('Facebook App ID no está configurado. Por favor configura VITE_FACEBOOK_APP_ID en el archivo .env');
      setError('Facebook App ID no configurado. Revisa la consola para más información.');
      return;
    }

    if (!configId || configId === 'your-configuration-id-here') {
      console.warn('Facebook Configuration ID no está configurado. Por favor configura VITE_FACEBOOK_CONFIG_ID en el archivo .env');
    }

    // Message event listener for WhatsApp Embedded Signup
    const messageHandler = (event: MessageEvent) => {
      // Verify the origin is from Facebook
      if (!event.origin.endsWith('facebook.com')) return;

      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        
        if (data.type === 'WA_EMBEDDED_SIGNUP') {
          
          if (data.event === 'FINISH' || data.event === 'SUBMIT') {
            // Successful completion
            
            // Update form with WhatsApp data
            setNewAgentForm(prev => ({
              ...prev,
              provider: 'whatsapp',
              provider_id: data.data.phone_number_id,
              facebook_data: {
                ...prev.facebook_data,
                whatsapp_data: {
                  phone_number_id: data.data.phone_number_id,
                  waba_id: data.data.waba_id,
                  business_id: data.data.business_id,
                }
              }
            }));
            
            setSuccess('WhatsApp conectado exitosamente! ID: ' + data.data.phone_number_id);
            setFacebookLoginStatus('connected');
          } else if (data.event === 'CANCEL') {
            // Flow was cancelled
            setError('Proceso cancelado: ' + (data.data.current_step || 'Desconocido'));
          }
        }
      } catch (err) {
        // Ignore parsing errors
      }
    };

    window.addEventListener('message', messageHandler);

    // Create Facebook SDK script
    const script = document.createElement('script');
    script.id = 'facebook-jssdk';
    script.src = 'https://connect.facebook.net/en_US/sdk.js';
    script.async = true;
    script.defer = true;
    script.crossOrigin = 'anonymous';

    // Add fbAsyncInit function to window - WhatsApp Embedded Signup style
    (window as any).fbAsyncInit = function() {
      try {
        (window as any).FB.init({
          appId: facebookAppId,
          autoLogAppEvents: true, // Required for WhatsApp Embedded Signup
          xfbml: true,
          version: 'v24.0'
        });

        setIsFacebookSDKLoaded(true);
      } catch (error) {
        console.error('❌ Error al inicializar Facebook SDK:', error);
        setError(t('agents.errorInitializingFacebookSDK'));
      }
    };

    // Add script to document if not already present
    if (!document.getElementById('facebook-jssdk')) {
      const firstScript = document.getElementsByTagName('script')[0];
      firstScript.parentNode?.insertBefore(script, firstScript);
    } else {
      // If script already exists, check if FB is available
      if ((window as any).FB) {
        setIsFacebookSDKLoaded(true);
      }
    }

    return () => {
      // Cleanup
      window.removeEventListener('message', messageHandler);
      const existingScript = document.getElementById('facebook-jssdk');
      if (existingScript) {
        existingScript.remove();
      }
      delete (window as any).fbAsyncInit;
    };
  }, []);

  // Facebook login handler
  // WhatsApp Embedded Signup launcher
  const handleFacebookLogin = () => {
    if (!isFacebookSDKLoaded || !(window as any).FB) {
      setError(t('agents.facebookSDKNotLoaded'));
      return;
    }

    const configId = import.meta.env.VITE_FACEBOOK_CONFIG_ID;
    
    if (!configId || configId === 'your-configuration-id-here') {
      setError(t('agents.configIDNotConfigured'));
      return;
    }

    // Response callback for the exchangeable code
    const fbLoginCallback = (response: any) => {
      
      if (response.authResponse) {
        const code = response.authResponse.code;
        
        // Store the exchangeable code
        setNewAgentForm(prev => ({
          ...prev,
          registration_type: 'facebook',
          facebook_data: {
            ...prev.facebook_data,
            whatsapp_data: {
              ...prev.facebook_data?.whatsapp_data,
              code: code,
              phone_number_id: prev.facebook_data?.whatsapp_data?.phone_number_id || '',
              waba_id: prev.facebook_data?.whatsapp_data?.waba_id || '',
              business_id: prev.facebook_data?.whatsapp_data?.business_id || '',
            }
          }
        }));
        
        // Note: The actual phone_number_id, waba_id, business_id will come via the message event listener
      } else {
        setError(t('agents.errorCompletingWhatsAppRegistration'));
        setFacebookLoginStatus('not_authorized');
      }
    };

    // Launch WhatsApp Embedded Signup with FB.login
    (window as any).FB.login(fbLoginCallback, {
      config_id: configId,
      response_type: 'code', // Request an exchangeable code
      override_default_response_type: true,
      extras: {
        setup: {}, // WhatsApp Embedded Signup specific
      }
    });
  };

  // WhatsApp disconnect handler
  const handleFacebookLogout = () => {
    setFacebookLoginStatus('not_logged_in');
    setNewAgentForm(prev => ({
      ...prev,
      registration_type: 'standard',
      facebook_data: undefined,
      provider_id: ''
    }));
    setSuccess('WhatsApp desconectado');
  };

  // Form state for new agent
  const [newAgentForm, setNewAgentForm] = useState<NewAgentForm>({
    name: '',
    provider: 'whatsapp',
    model: 'gpt-3.5-turbo',
    provider_id: '',
    description: '',
    outbound_message_limit: 100,
    message_window_start: 3600,
    registration_type: 'standard',
    config: {
      temperature: 0.7,
      top_p: 1.0,
      api_key: ''
    },
    settings: {
      agent_name: '',
      has_emojies: true,
      gender: 'Male',
      language: 'Spanish',
      energy: 'Extraverted',
      mind: 'Intuitive',
      nature: 'Feeling',
      tactics: 'Judging',
      identity: 'Assertive'
    }
  });

  // Cargar agentes
  const fetchAgents = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await agentService.getAgents();
      const agentsList = (response.data as any).agents || [];
      setAgents(agentsList);
    } catch (error) {
      console.error('Error fetching agents:', error);
      setError(t('agents.errorLoadingAgents'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  // Filtrar agentes por término de búsqueda
  const filteredAgents = agents.filter(agent =>
    agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (agent.description && agent.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (agent.provider && agent.provider.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Componente para mostrar el estado del agente
  const AgentStatus: React.FC<{ isActive: boolean }> = ({ isActive }) => {
    if (isActive) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Activo
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
        <XCircle className="w-3 h-3 mr-1" />
        Inactivo
      </span>
    );
  };

  // Iniciar proceso de eliminación con doble confirmación
  const handleDeleteClick = (agent: Agent) => {
    setSelectedAgent(agent);
    setDeleteConfirmStep(1);
    setShowDeleteModal(true);
  };

  // Manejar eliminación de agente (con doble confirmación)
  const handleDeleteAgent = async () => {
    if (!selectedAgent || deleteConfirmStep !== 2) return;

    setIsDeleting(true);
    try {
      await agentService.deleteAgent(selectedAgent.id);
      await fetchAgents();
      setSuccess(`Agente "${selectedAgent.name}" eliminado correctamente`);
      setShowDeleteModal(false);
      setSelectedAgent(null);
      setDeleteConfirmStep(0);
      
      // Limpiar mensaje de éxito después de 5 segundos
      setTimeout(() => setSuccess(null), 5000);
    } catch (error) {
      console.error('Error deleting agent:', error);
      setError(t('agents.errorDeletingAgent'));
    } finally {
      setIsDeleting(false);
    }
  };

  // Manejar cambios en el formulario de nuevo agente
  const handleFormChange = (field: keyof NewAgentForm, value: any) => {
    setNewAgentForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleConfigChange = (field: keyof NewAgentForm['config'], value: any) => {
    setNewAgentForm(prev => ({
      ...prev,
      config: {
        ...prev.config,
        [field]: value
      }
    }));
  };

  const handleSettingsChange = (field: keyof NewAgentForm['settings'], value: any) => {
    setNewAgentForm(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        [field]: value
      }
    }));
  };

  // Crear nuevo agente
  const handleCreateAgent = async () => {
    setIsCreating(true);
    setError(null);
    
    try {
      // Validaciones básicas
      if (!newAgentForm.name.trim()) {
        setError('El nombre del agente es requerido');
        return;
      }
      if (!newAgentForm.provider_id.trim()) {
        setError('El ID del proveedor es requerido');
        return;
      }
      if (!newAgentForm.config.api_key.trim()) {
        setError('La API Key es requerida');
        return;
      }

      // Preparar datos para enviar
      const agentData: any = {
        name: newAgentForm.name,
        provider: newAgentForm.provider,
        model: newAgentForm.model,
        provider_id: newAgentForm.provider_id,
        description: newAgentForm.description,
        is_active: true,
        outbound_message_limit: newAgentForm.outbound_message_limit,
        message_window_start: newAgentForm.message_window_start,
        conversation_sent_counter: 0,
        registration_type: newAgentForm.registration_type,
        model_config: {
          provider: newAgentForm.provider === 'whatsapp' ? 'ChatOpenAI' : 'ChatOpenAI',
          model: newAgentForm.model,
          api_key: newAgentForm.config.api_key,
          temperature: newAgentForm.config.temperature,
          top_p: newAgentForm.config.top_p
        },
        settings: {
          ...newAgentForm.settings,
          agent_name: newAgentForm.settings.agent_name || newAgentForm.name
        },
        config: {
          api_key: newAgentForm.config.api_key,
          temperature: newAgentForm.config.temperature,
          top_p: newAgentForm.config.top_p
        }
      };

      // Add Facebook data if using Facebook registration
      if (newAgentForm.registration_type === 'facebook' && newAgentForm.facebook_data) {
        agentData.facebook_integration = {
          access_token: newAgentForm.facebook_data.accessToken,
          user_id: newAgentForm.facebook_data.userID,
          signed_request: newAgentForm.facebook_data.signedRequest,
          expires_in: newAgentForm.facebook_data.expiresIn,
          user_name: newAgentForm.facebook_data.name,
          user_email: newAgentForm.facebook_data.email
        };
      }

      await agentService.registerAgent(agentData);
      await fetchAgents();
      setSuccess(
        t('agents.agentCreatedSuccessfully', { name: newAgentForm.name }) +
        (newAgentForm.registration_type === 'facebook' ? ` ${t('agents.withFacebookIntegration')}` : '')
      );
      setShowCreateModal(false);
      
      // Resetear formulario
      setNewAgentForm({
        name: '',
        provider: 'whatsapp',
        model: 'gpt-3.5-turbo',
        provider_id: '',
        description: '',
        outbound_message_limit: 100,
        message_window_start: 3600,
        registration_type: 'standard',
        config: {
          temperature: 0.7,
          top_p: 1.0,
          api_key: ''
        },
        settings: {
          agent_name: '',
          has_emojies: true,
          gender: 'Male',
          language: 'Spanish',
          energy: 'Extraverted',
          mind: 'Intuitive',
          nature: 'Feeling',
          tactics: 'Judging',
          identity: 'Assertive'
        }
      });
      
      // Limpiar mensaje de éxito después de 5 segundos
      setTimeout(() => setSuccess(null), 5000);
    } catch (error) {
      console.error('Error creating agent:', error);
      setError(t('agents.errorCreatingAgent'));
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-surface border-b border-border">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-accent/10 p-3 rounded-xl">
                <Bot className="w-6 h-6 text-accent" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-textPrimary">{t('agents.title')}</h1>
                <p className="text-textMuted">{t('agents.subtitle')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchAgents}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-muted/30 disabled:opacity-50 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                {t('common.refresh')}
              </button>
              
              {/* Dropdown para crear agente */}
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  {t('agents.createAgent')}
                  <ChevronDown className="w-4 h-4" />
                </button>
                
                {showDropdown && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setShowDropdown(false)}
                    />
                    <div className="absolute right-0 mt-2 w-64 bg-surface border border-border rounded-lg shadow-lg z-20">
                      <div className="py-1">
                        <button
                          onClick={() => {
                            setShowCreateModal(true);
                            setShowDropdown(false);
                          }}
                          className="w-full text-left px-4 py-3 hover:bg-muted/30 transition-colors flex items-center gap-3"
                        >
                          <Bot className="w-5 h-5 text-accent" />
                          <div>
                            <div className="font-medium text-textPrimary">{t('agents.agent')}</div>
                            <div className="text-xs text-textMuted">{t('agents.basicConfiguration')}</div>
                          </div>
                        </button>
                        <button
                          onClick={() => {
                            setShowFacebookModal(true);
                            setShowDropdown(false);
                          }}
                          className="w-full text-left px-4 py-3 hover:bg-muted/30 transition-colors flex items-center gap-3 border-t border-border"
                        >
                          <div className="w-5 h-5 bg-green-600 rounded flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                            </svg>
                          </div>
                          <div>
                            <div className="font-medium text-textPrimary">Con WhatsApp Business</div>
                            <div className="text-xs text-textMuted">Embedded Signup de WhatsApp</div>
                          </div>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Mensajes de error y éxito */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
              <button 
                onClick={() => setError(null)}
                className="ml-auto text-red-600 hover:text-red-800"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle className="w-5 h-5" />
              <span>{success}</span>
              <button 
                onClick={() => setSuccess(null)}
                className="ml-auto text-green-600 hover:text-green-800"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-surface rounded-xl p-6 border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-textMuted text-sm">{t('agents.totalAgents')}</p>
                <p className="text-2xl font-bold text-textPrimary">{agents.length}</p>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <Bot className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-surface rounded-xl p-6 border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-textMuted text-sm">{t('agents.activeAgents')}</p>
                <p className="text-2xl font-bold text-textPrimary">
                  {agents.filter(agent => agent.is_active).length}
                </p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-surface rounded-xl p-6 border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-textMuted text-sm">{t('agents.inactiveAgents')}</p>
                <p className="text-2xl font-bold text-textPrimary">
                  {agents.filter(agent => !agent.is_active).length}
                </p>
              </div>
              <div className="bg-red-50 p-3 rounded-lg">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </div>
          <div className="bg-surface rounded-xl p-6 border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-textMuted text-sm">{t('agents.totalConversations')}</p>
                <p className="text-2xl font-bold text-textPrimary">
                  {agents.reduce((sum, agent) => sum + (agent.conversation_sent_counter || 0), 0)}
                </p>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Barra de búsqueda */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-textMuted w-4 h-4" />
            <input
              type="text"
              placeholder={t('agents.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-border rounded-lg bg-background text-textPrimary focus:ring-2 focus:ring-accent focus:border-accent transition-all"
            />
          </div>
        </div>

        {/* Lista de agentes */}
        <div className="bg-surface rounded-xl border border-border overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center p-12">
              <RefreshCw className="w-6 h-6 animate-spin text-textMuted" />
              <span className="ml-2 text-textMuted">{t('agents.loadingAgents')}</span>
            </div>
          ) : filteredAgents.length === 0 ? (
            <div className="text-center p-12">
              <Bot className="w-16 h-16 text-muted mx-auto mb-4" />
              <h3 className="text-lg font-medium text-textPrimary mb-2">
                {searchTerm ? t('agents.noAgentsFound') : t('agents.noAgents')}
              </h3>
              <p className="text-textMuted mb-4">
                {searchTerm
                  ? t('agents.tryOtherTerms')
                  : t('agents.noAgentsConfigured')
                }
              </p>
              {!searchTerm && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors mx-auto"
                >
                  <Plus className="w-4 h-4" />
                  {t('agents.createFirstAgent')}
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredAgents.map((agent) => (
                <div key={agent.id} className="p-6 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="bg-accent/10 p-2 rounded-lg">
                        <Bot className="w-5 h-5 text-accent" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-medium text-textPrimary">{agent.name}</h3>
                          <AgentStatus isActive={agent.is_active} />
                        </div>
                        {agent.description && (
                          <p className="text-textMuted text-sm mb-2">{agent.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-textMuted">
                          <span className="flex items-center gap-1">
                            <Settings className="w-3 h-3" />
                            {agent.provider || t('agents.noProvider')}
                          </span>
                          {agent.model?.model && (
                            <span className="flex items-center gap-1">
                              <Bot className="w-3 h-3" />
                              {agent.model.model}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {agent.conversation_sent_counter || 0} {t('agents.conversations')}
                          </span>
                          {(agent as any).facebook_integration && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Facebook
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDeleteClick(agent)}
                        className="p-2 text-textMuted hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title={t('agents.titleDeleteAgent')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal de confirmación de eliminación con doble confirmación */}
      {showDeleteModal && selectedAgent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface rounded-xl p-6 max-w-md w-full mx-4 border border-border">
            {deleteConfirmStep === 1 && (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-yellow-50 p-2 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-textPrimary">{t('agents.deleteAgent')}</h3>
                </div>
                <p className="text-textMuted mb-6">
                  {t('agents.aboutToDelete')} <strong>{selectedAgent.name}</strong>.
                  {t('agents.thisWillPermanentlyDelete')}
                </p>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setSelectedAgent(null);
                      setDeleteConfirmStep(0);
                    }}
                    className="px-4 py-2 border border-border rounded-lg hover:bg-muted/30 transition-colors"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    onClick={() => setDeleteConfirmStep(2)}
                    className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                  >
                    {t('agents.continue')}
                  </button>
                </div>
              </>
            )}

            {deleteConfirmStep === 2 && (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-red-50 p-2 rounded-lg">
                    <Trash2 className="w-5 h-5 text-red-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-textPrimary">{t('agents.finalConfirmation')}</h3>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <p className="text-red-800 font-medium">{t('agents.finalWarning')}</p>
                  <p className="text-red-700 text-sm mt-1" dangerouslySetInnerHTML={{__html: t('agents.actionIsIrreversible', { name: selectedAgent.name })}}>
                  </p>
                  <ul className="text-red-700 text-sm mt-2 ml-4 list-disc">
                    <li>{t('agents.allAgentConfigurations')}</li>
                    <li>{t('agents.associatedConversationHistory')}</li>
                    <li>{t('agents.integrationSettings')}</li>
                  </ul>
                </div>
                <p className="text-textMuted mb-6" dangerouslySetInnerHTML={{__html: t('agents.completelySure')}}>
                </p>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setSelectedAgent(null);
                      setDeleteConfirmStep(0);
                    }}
                    className="px-4 py-2 border border-border rounded-lg hover:bg-muted/30 transition-colors"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    onClick={handleDeleteAgent}
                    disabled={isDeleting}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isDeleting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        {t('agents.deleting')}
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        {t('agents.deleteAgentPermanently')}
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal para crear nuevo agente */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-surface rounded-xl p-6 max-w-4xl w-full mx-4 border border-border my-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-accent/10 p-2 rounded-lg">
                  <Bot className="w-5 h-5 text-accent" />
                </div>
                <h3 className="text-xl font-semibold text-textPrimary">{t('agents.createNewAgent')}</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 text-textMuted hover:text-textPrimary rounded-lg transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Información básica */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-textPrimary text-sm font-medium mb-2">
                    {t('agents.agentNameLabel')} *
                  </label>
                  <input
                    type="text"
                    value={newAgentForm.name}
                    onChange={(e) => handleFormChange('name', e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-textPrimary focus:ring-2 focus:ring-accent focus:border-accent transition-all"
                    placeholder={t('agents.agentNamePlaceholder')}
                  />
                </div>

                <div>
                  <label className="block text-textPrimary text-sm font-medium mb-2">
                    ID del Proveedor *
                  </label>
                  <input
                    type="text"
                    value={newAgentForm.provider_id}
                    onChange={(e) => handleFormChange('provider_id', e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-textPrimary focus:ring-2 focus:ring-accent focus:border-accent transition-all"
                    placeholder="Ej: +1234567890, bot_token, email@domain.com"
                  />
                </div>

                <div>
                  <label className="block text-textPrimary text-sm font-medium mb-2">
                    Plataforma
                  </label>
                  <select
                    value={newAgentForm.provider}
                    onChange={(e) => handleFormChange('provider', e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-textPrimary focus:ring-2 focus:ring-accent focus:border-accent transition-all"
                  >
                    <option value="whatsapp">WhatsApp</option>
                    <option value="telegram">Telegram</option>
                    <option value="email">Email</option>
                    <option value="instagram">Instagram</option>
                  </select>
                </div>

                <div>
                  <label className="block text-textPrimary text-sm font-medium mb-2">
                    Modelo de IA
                  </label>
                  <select
                    value={newAgentForm.model}
                    onChange={(e) => handleFormChange('model', e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-textPrimary focus:ring-2 focus:ring-accent focus:border-accent transition-all"
                  >
                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                    <option value="gpt-4">GPT-4</option>
                    <option value="claude-2">Claude 2</option>
                    <option value="gemini-1.5">Gemini 1.5</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-textPrimary text-sm font-medium mb-2">
                  {t('agents.descriptionLabel')}
                </label>
                <textarea
                  value={newAgentForm.description}
                  onChange={(e) => handleFormChange('description', e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-textPrimary focus:ring-2 focus:ring-accent focus:border-accent transition-all"
                  rows={3}
                  placeholder={t('agents.descriptionPlaceholder')}
                />
              </div>

              {/* Tipo de registro */}
              <div className="border-t border-border pt-6">
                <h4 className="text-lg font-medium text-textPrimary mb-4">{t('agents.registrationType')}</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-textPrimary text-sm font-medium mb-2">
                      {t('agents.registrationType')}
                    </label>
                    <select
                      value={newAgentForm.registration_type}
                      onChange={(e) => handleFormChange('registration_type', e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-textPrimary focus:ring-2 focus:ring-accent focus:border-accent transition-all"
                    >
                      <option value="standard">{t('agents.standardRegistration')}</option>
                      <option value="facebook">{t('agents.whatsappRegistration')}</option>
                    </select>
                  </div>

                  {newAgentForm.registration_type === 'facebook' && (
                    <div className="flex items-end">
                      {facebookLoginStatus === 'connected' && newAgentForm.facebook_data ? (
                        <div className="w-full">
                          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                            <div className="flex items-center gap-2 text-green-800 text-sm">
                              <CheckCircle className="w-4 h-4" />
                              <span>{t('agents.whatsappConnected')}: {newAgentForm.facebook_data.name}</span>
                            </div>
                            <button
                              type="button"
                              onClick={handleFacebookLogout}
                              className="mt-2 text-xs text-green-600 hover:text-green-800 underline"
                            >
                              {t('agents.disconnect')}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={handleFacebookLogin}
                          disabled={!isFacebookSDKLoaded}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          {!isFacebookSDKLoaded ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              {t('agents.loadingFBSDK')}
                            </>
                          ) : (
                            <>
                              <Plus className="w-4 h-4" />
                              {t('agents.connectWithFacebook')}
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {newAgentForm.registration_type === 'facebook' && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="text-blue-800 text-sm">
                        <p className="font-medium">{t('agents.whatsappRegistration')}</p>
                        <p className="mt-1">
                          {t('agents.facebookIntegrationInfo')}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Configuración técnica */}
              <div className="border-t border-border pt-6">
                <h4 className="text-lg font-medium text-textPrimary mb-4">{t('agents.modelConfigurationSection')}</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-textPrimary text-sm font-medium mb-2">
                      {t('agents.apiKeyLabel')} *
                    </label>
                    <input
                      type="password"
                      value={newAgentForm.config.api_key}
                      onChange={(e) => handleConfigChange('api_key', e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-textPrimary focus:ring-2 focus:ring-accent focus:border-accent transition-all"
                      placeholder={t('agents.apiKeyPlaceholder')}
                    />
                  </div>

                  <div>
                    <label className="block text-textPrimary text-sm font-medium mb-2">
                      {t('agents.temperatureLabel')} (0-1)
                    </label>
                    <input
                      type="number"
                      value={newAgentForm.config.temperature}
                      onChange={(e) => handleConfigChange('temperature', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-textPrimary focus:ring-2 focus:ring-accent focus:border-accent transition-all"
                      min="0"
                      max="1"
                      step="0.1"
                    />
                  </div>

                  <div>
                    <label className="block text-textPrimary text-sm font-medium mb-2">
                      Top P (0-1)
                    </label>
                    <input
                      type="number"
                      value={newAgentForm.config.top_p}
                      onChange={(e) => handleConfigChange('top_p', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-textPrimary focus:ring-2 focus:ring-accent focus:border-accent transition-all"
                      min="0"
                      max="1"
                      step="0.1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-textPrimary text-sm font-medium mb-2">
                      Límite de Mensajes
                    </label>
                    <input
                      type="number"
                      value={newAgentForm.outbound_message_limit}
                      onChange={(e) => handleFormChange('outbound_message_limit', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-textPrimary focus:ring-2 focus:ring-accent focus:border-accent transition-all"
                      min="1"
                    />
                  </div>

                  <div>
                    <label className="block text-textPrimary text-sm font-medium mb-2">
                      Ventana de Mensajes (segundos)
                    </label>
                    <input
                      type="number"
                      value={newAgentForm.message_window_start}
                      onChange={(e) => handleFormChange('message_window_start', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-textPrimary focus:ring-2 focus:ring-accent focus:border-accent transition-all"
                      min="1"
                    />
                  </div>
                </div>
              </div>

              {/* Configuración de personalidad */}
              <div className="border-t border-border pt-6">
                <h4 className="text-lg font-medium text-textPrimary mb-4">{t('agents.agentPersonalitySettings')}</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-textPrimary text-sm font-medium mb-2">
                      {t('agents.agentNameSettings')}
                    </label>
                    <input
                      type="text"
                      value={newAgentForm.settings.agent_name}
                      onChange={(e) => handleSettingsChange('agent_name', e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-textPrimary focus:ring-2 focus:ring-accent focus:border-accent transition-all"
                      placeholder={t('agents.personalityNamePlaceholder')}
                    />
                  </div>

                  <div>
                    <label className="block text-textPrimary text-sm font-medium mb-2">
                      {t('agents.languageLabel')}
                    </label>
                    <select
                      value={newAgentForm.settings.language}
                      onChange={(e) => handleSettingsChange('language', e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-textPrimary focus:ring-2 focus:ring-accent focus:border-accent transition-all"
                    >
                      <option value="Spanish">{t('agents.spanish')}</option>
                      <option value="English">{t('agents.english')}</option>
                      <option value="Portuguese">Portugués</option>
                      <option value="French">Francés</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-textPrimary text-sm font-medium mb-2">
                      {t('agents.genderLabel')}
                    </label>
                    <select
                      value={newAgentForm.settings.gender}
                      onChange={(e) => handleSettingsChange('gender', e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-textPrimary focus:ring-2 focus:ring-accent focus:border-accent transition-all"
                    >
                      <option value="Male">Masculino</option>
                      <option value="Female">Femenino</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-textPrimary text-sm font-medium mb-2">
                      Energía
                    </label>
                    <select
                      value={newAgentForm.settings.energy}
                      onChange={(e) => handleSettingsChange('energy', e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-textPrimary focus:ring-2 focus:ring-accent focus:border-accent transition-all"
                    >
                      <option value="Introverded">Introvertido</option>
                      <option value="Extraverted">Extrovertido</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-textPrimary text-sm font-medium mb-2">
                      Mente
                    </label>
                    <select
                      value={newAgentForm.settings.mind}
                      onChange={(e) => handleSettingsChange('mind', e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-textPrimary focus:ring-2 focus:ring-accent focus:border-accent transition-all"
                    >
                      <option value="Observant">Observador</option>
                      <option value="Intuitive">Intuitivo</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-textPrimary text-sm font-medium mb-2">
                      Naturaleza
                    </label>
                    <select
                      value={newAgentForm.settings.nature}
                      onChange={(e) => handleSettingsChange('nature', e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-textPrimary focus:ring-2 focus:ring-accent focus:border-accent transition-all"
                    >
                      <option value="Thinking">Pensador</option>
                      <option value="Feeling">Emocional</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-textPrimary text-sm font-medium mb-2">
                      Tácticas
                    </label>
                    <select
                      value={newAgentForm.settings.tactics}
                      onChange={(e) => handleSettingsChange('tactics', e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-textPrimary focus:ring-2 focus:ring-accent focus:border-accent transition-all"
                    >
                      <option value="Judging">Decisivo</option>
                      <option value="Prospecting">Explorador</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-textPrimary text-sm font-medium mb-2">
                      Identidad
                    </label>
                    <select
                      value={newAgentForm.settings.identity}
                      onChange={(e) => handleSettingsChange('identity', e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-textPrimary focus:ring-2 focus:ring-accent focus:border-accent transition-all"
                    >
                      <option value="Assertive">Asertivo</option>
                      <option value="Turbulent">Turbulento</option>
                    </select>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={newAgentForm.settings.has_emojies}
                      onChange={(e) => handleSettingsChange('has_emojies', e.target.checked)}
                      className="w-4 h-4 text-accent border border-border rounded focus:ring-2 focus:ring-accent"
                    />
                    <span className="text-textPrimary text-sm">Usar emojis en las respuestas</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-border">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 border border-border rounded-lg hover:bg-muted/30 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateAgent}
                disabled={isCreating}
                className="px-6 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isCreating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Creando...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Crear Agente
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para crear agente con Facebook */}
      {showFacebookModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-surface rounded-xl p-6 max-w-4xl w-full mx-4 border border-border my-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 p-2 rounded-lg">
                  <div className="w-5 h-5 text-white font-bold flex items-center justify-center text-sm">f</div>
                </div>
                <h3 className="text-xl font-semibold text-textPrimary">Crear Agente con WhatsApp Business</h3>
              </div>
              <button
                onClick={() => setShowFacebookModal(false)}
                className="p-2 text-textMuted hover:text-textPrimary rounded-lg transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Sección de WhatsApp Embedded Signup */}
              <div className="bg-green-50 border border-green-300 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="bg-green-600 p-2 rounded-lg">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-green-900 mb-2">WhatsApp Business - Embedded Signup</h4>
                    <p className="text-green-800 text-sm mb-3">
                      Conecta tu cuenta de WhatsApp Business para crear un agente con número de teléfono integrado.
                    </p>
                    
                    {facebookLoginStatus === 'connected' && newAgentForm.facebook_data?.whatsapp_data ? (
                      <div className="bg-white border border-green-300 rounded-lg p-3">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-green-800 text-sm">
                            <CheckCircle className="w-4 h-4" />
                            <span className="font-medium">WhatsApp Business conectado</span>
                          </div>
                          <div className="text-xs text-green-700 space-y-1 ml-6">
                            <div><strong>Phone ID:</strong> {newAgentForm.facebook_data.whatsapp_data.phone_number_id}</div>
                            <div><strong>WABA ID:</strong> {newAgentForm.facebook_data.whatsapp_data.waba_id}</div>
                            <div><strong>Business ID:</strong> {newAgentForm.facebook_data.whatsapp_data.business_id}</div>
                          </div>
                          <button
                            type="button"
                            onClick={handleFacebookLogout}
                            className="mt-2 text-xs text-green-600 hover:text-green-800 underline"
                          >
                            Desconectar WhatsApp
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={handleFacebookLogin}
                        disabled={!isFacebookSDKLoaded}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                      >
                        {!isFacebookSDKLoaded ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            Cargando SDK...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                            </svg>
                            Conectar WhatsApp Business
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Resto del formulario igual que el modal estándar */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-textPrimary text-sm font-medium mb-2">
                    Nombre del Agente *
                  </label>
                  <input
                    type="text"
                    value={newAgentForm.name}
                    onChange={(e) => handleFormChange('name', e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-textPrimary focus:ring-2 focus:ring-accent focus:border-accent transition-all"
                    placeholder="Ej: Asistente de Ventas"
                  />
                </div>

                <div>
                  <label className="block text-textPrimary text-sm font-medium mb-2">
                    ID del Proveedor *
                  </label>
                  <input
                    type="text"
                    value={newAgentForm.provider_id}
                    onChange={(e) => handleFormChange('provider_id', e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-textPrimary focus:ring-2 focus:ring-accent focus:border-accent transition-all"
                    placeholder="Ej: +1234567890, bot_token, email@domain.com"
                  />
                </div>

                <div>
                  <label className="block text-textPrimary text-sm font-medium mb-2">
                    Plataforma
                  </label>
                  <select
                    value={newAgentForm.provider}
                    onChange={(e) => handleFormChange('provider', e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-textPrimary focus:ring-2 focus:ring-accent focus:border-accent transition-all"
                  >
                    <option value="whatsapp">WhatsApp</option>
                    <option value="telegram">Telegram</option>
                    <option value="email">Email</option>
                    <option value="instagram">Instagram</option>
                  </select>
                </div>

                <div>
                  <label className="block text-textPrimary text-sm font-medium mb-2">
                    Modelo de IA
                  </label>
                  <select
                    value={newAgentForm.model}
                    onChange={(e) => handleFormChange('model', e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-textPrimary focus:ring-2 focus:ring-accent focus:border-accent transition-all"
                  >
                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                    <option value="gpt-4">GPT-4</option>
                    <option value="claude-2">Claude 2</option>
                    <option value="gemini-1.5">Gemini 1.5</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-textPrimary text-sm font-medium mb-2">
                  Descripción
                </label>
                <textarea
                  value={newAgentForm.description}
                  onChange={(e) => handleFormChange('description', e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-textPrimary focus:ring-2 focus:ring-accent focus:border-accent transition-all"
                  rows={3}
                  placeholder="Describe la función de este agente..."
                />
              </div>

              {/* Configuración técnica - Igual que el modal estándar */}
              <div className="border-t border-border pt-6">
                <h4 className="text-lg font-medium text-textPrimary mb-4">Configuración Técnica</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-textPrimary text-sm font-medium mb-2">
                      API Key *
                    </label>
                    <input
                      type="password"
                      value={newAgentForm.config.api_key}
                      onChange={(e) => handleConfigChange('api_key', e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-textPrimary focus:ring-2 focus:ring-accent focus:border-accent transition-all"
                      placeholder="sk-..."
                    />
                  </div>

                  <div>
                    <label className="block text-textPrimary text-sm font-medium mb-2">
                      Temperature (0-1)
                    </label>
                    <input
                      type="number"
                      value={newAgentForm.config.temperature}
                      onChange={(e) => handleConfigChange('temperature', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-textPrimary focus:ring-2 focus:ring-accent focus:border-accent transition-all"
                      min="0"
                      max="1"
                      step="0.1"
                    />
                  </div>

                  <div>
                    <label className="block text-textPrimary text-sm font-medium mb-2">
                      Top P (0-1)
                    </label>
                    <input
                      type="number"
                      value={newAgentForm.config.top_p}
                      onChange={(e) => handleConfigChange('top_p', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-textPrimary focus:ring-2 focus:ring-accent focus:border-accent transition-all"
                      min="0"
                      max="1"
                      step="0.1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-textPrimary text-sm font-medium mb-2">
                      Límite de Mensajes
                    </label>
                    <input
                      type="number"
                      value={newAgentForm.outbound_message_limit}
                      onChange={(e) => handleFormChange('outbound_message_limit', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-textPrimary focus:ring-2 focus:ring-accent focus:border-accent transition-all"
                      min="1"
                    />
                  </div>

                  <div>
                    <label className="block text-textPrimary text-sm font-medium mb-2">
                      Ventana de Mensajes (segundos)
                    </label>
                    <input
                      type="number"
                      value={newAgentForm.message_window_start}
                      onChange={(e) => handleFormChange('message_window_start', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-textPrimary focus:ring-2 focus:ring-accent focus:border-accent transition-all"
                      min="1"
                    />
                  </div>
                </div>
              </div>

              {/* Configuración de personalidad - Igual que el modal estándar */}
              <div className="border-t border-border pt-6">
                <h4 className="text-lg font-medium text-textPrimary mb-4">Personalidad del Agente</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-textPrimary text-sm font-medium mb-2">
                      Nombre del Agente
                    </label>
                    <input
                      type="text"
                      value={newAgentForm.settings.agent_name}
                      onChange={(e) => handleSettingsChange('agent_name', e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-textPrimary focus:ring-2 focus:ring-accent focus:border-accent transition-all"
                      placeholder="Nombre de personalidad del agente"
                    />
                  </div>

                  <div>
                    <label className="block text-textPrimary text-sm font-medium mb-2">
                      Idioma
                    </label>
                    <select
                      value={newAgentForm.settings.language}
                      onChange={(e) => handleSettingsChange('language', e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-textPrimary focus:ring-2 focus:ring-accent focus:border-accent transition-all"
                    >
                      <option value="Spanish">Español</option>
                      <option value="English">Inglés</option>
                      <option value="Portuguese">Portugués</option>
                      <option value="French">Francés</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-textPrimary text-sm font-medium mb-2">
                      Género
                    </label>
                    <select
                      value={newAgentForm.settings.gender}
                      onChange={(e) => handleSettingsChange('gender', e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-textPrimary focus:ring-2 focus:ring-accent focus:border-accent transition-all"
                    >
                      <option value="Male">Masculino</option>
                      <option value="Female">Femenino</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-textPrimary text-sm font-medium mb-2">
                      Energía
                    </label>
                    <select
                      value={newAgentForm.settings.energy}
                      onChange={(e) => handleSettingsChange('energy', e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-textPrimary focus:ring-2 focus:ring-accent focus:border-accent transition-all"
                    >
                      <option value="Introverded">Introvertido</option>
                      <option value="Extraverted">Extrovertido</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-textPrimary text-sm font-medium mb-2">
                      Mente
                    </label>
                    <select
                      value={newAgentForm.settings.mind}
                      onChange={(e) => handleSettingsChange('mind', e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-textPrimary focus:ring-2 focus:ring-accent focus:border-accent transition-all"
                    >
                      <option value="Observant">Observador</option>
                      <option value="Intuitive">Intuitivo</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-textPrimary text-sm font-medium mb-2">
                      Naturaleza
                    </label>
                    <select
                      value={newAgentForm.settings.nature}
                      onChange={(e) => handleSettingsChange('nature', e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-textPrimary focus:ring-2 focus:ring-accent focus:border-accent transition-all"
                    >
                      <option value="Thinking">Pensador</option>
                      <option value="Feeling">Emocional</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-textPrimary text-sm font-medium mb-2">
                      Tácticas
                    </label>
                    <select
                      value={newAgentForm.settings.tactics}
                      onChange={(e) => handleSettingsChange('tactics', e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-textPrimary focus:ring-2 focus:ring-accent focus:border-accent transition-all"
                    >
                      <option value="Judging">Decisivo</option>
                      <option value="Prospecting">Explorador</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-textPrimary text-sm font-medium mb-2">
                      Identidad
                    </label>
                    <select
                      value={newAgentForm.settings.identity}
                      onChange={(e) => handleSettingsChange('identity', e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-textPrimary focus:ring-2 focus:ring-accent focus:border-accent transition-all"
                    >
                      <option value="Assertive">Asertivo</option>
                      <option value="Turbulent">Turbulento</option>
                    </select>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={newAgentForm.settings.has_emojies}
                      onChange={(e) => handleSettingsChange('has_emojies', e.target.checked)}
                      className="w-4 h-4 text-accent border border-border rounded focus:ring-2 focus:ring-accent"
                    />
                    <span className="text-textPrimary text-sm">Usar emojis en las respuestas</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-border">
              <button
                onClick={() => setShowFacebookModal(false)}
                className="px-4 py-2 border border-border rounded-lg hover:bg-muted/30 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateAgent}
                disabled={isCreating || (facebookLoginStatus !== 'connected')}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isCreating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Creando...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    Crear Agente WhatsApp
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentsPage;
