import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Building2, 
  CheckCircle, 
  XCircle, 
  Loader,
  UserPlus,
  Shield,
  User as UserIcon,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle
} from 'lucide-react';
import OrganizationService from '../../services/organizationService';
import { useAuthContext } from '../../contexts/AuthContext';

interface InviteDetails {
  organizationName: string;
  organizationLogo?: string;
  inviterName: string;
  inviterEmail: string;
  role: 'admin' | 'member' | 'viewer';
  expiresAt: string;
  isExpired: boolean;
}

const InvitePage: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { user, is_authenticated } = useAuthContext();
  
  const [inviteDetails, setInviteDetails] = useState<InviteDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  
  // Estados para el formulario de registro
  const [registrationData, setRegistrationData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [registrationLoading, setRegistrationLoading] = useState(false);
  const [registrationError, setRegistrationError] = useState('');

  useEffect(() => {
    if (code) {
      fetchInviteDetails();
    } else {
      setError('Código de invitación inválido');
      setLoading(false);
    }
  }, [code]);

  const fetchInviteDetails = async () => {
    try {
      const response = await OrganizationService.getInviteDetails(code!);
      const inviteData = response.data as any;
      
      setInviteDetails({
        organizationName: inviteData.organization?.name || 'Organización',
        organizationLogo: inviteData.organization?.logo,
        inviterName: inviteData.inviter?.name || 'Usuario',
        inviterEmail: inviteData.inviter?.email || 'usuario@example.com',
        role: inviteData.role || 'member',
        expiresAt: inviteData.expires_at || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        isExpired: new Date(inviteData.expires_at) < new Date()
      });
    } catch (error: any) {
      console.error('Error fetching invite details:', error);
      
      if (error.response?.status === 404) {
        setError('La invitación no existe o ha expirado');
      } else if (error.response?.status === 410) {
        setError('Esta invitación ha expirado');
      } else {
        setError('Error al cargar la invitación. Inténtalo de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvite = async () => {
    if (!is_authenticated) {
      // Mostrar formulario de registro en lugar de redirigir
      setShowRegistrationForm(true);
      return;
    }

    setAccepting(true);
    try {
      await OrganizationService.acceptInvitation(code!);
      
      console.log('Invitación aceptada exitosamente:', {
        code,
        userId: user?.userId,
        organizationName: inviteDetails?.organizationName
      });
      
      setAccepted(true);
      
      // Redirigir a la organización después de un breve delay
      setTimeout(() => {
        navigate('/app/organization');
      }, 2000);
    } catch (error: any) {
      console.error('Error accepting invitation:', error);
      
      if (error.response?.status === 404) {
        setError('La invitación no existe o ha expirado');
      } else if (error.response?.status === 410) {
        setError('Esta invitación ha expirado');
      } else if (error.response?.status === 409) {
        setError('Ya eres miembro de esta organización');
      } else {
        setError('Error al aceptar la invitación. Inténtalo de nuevo.');
      }
    } finally {
      setAccepting(false);
    }
  };

  const handleRegistrationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setRegistrationData(prev => ({
      ...prev,
      [name]: value
    }));
    setRegistrationError('');
  };

  const handleRegisterAndAccept = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (registrationData.password !== registrationData.confirmPassword) {
      setRegistrationError('Las contraseñas no coinciden');
      return;
    }

    if (registrationData.password.length < 8) {
      setRegistrationError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    setRegistrationLoading(true);
    setRegistrationError('');

    try {
      // Call the invitation acceptance endpoint directly with user data
      await OrganizationService.acceptInvitation(code!, {
        name: registrationData.name,
        email: registrationData.email,
        password: registrationData.password,
      });
      
      setAccepted(true);
      
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      
    } catch (error: any) {
      console.error('Error en registro o aceptación:', error);
      setRegistrationError(
        error.response?.data?.error || 
        error.response?.data?.detail || 
        error.message || 
        'Error al registrarse y aceptar la invitación'
      );
    } finally {
      setRegistrationLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Verificando invitación...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-lg text-center">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Invitación no válida
            </h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => navigate('/app/dashboard')}
              className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors duration-200"
            >
              Volver al Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (accepted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-lg text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              ¡Bienvenido a {inviteDetails?.organizationName}!
            </h1>
            <p className="text-gray-600 mb-6">
              Te has unido exitosamente como {inviteDetails?.role === 'admin' ? 'Administrador' : inviteDetails?.role === 'viewer' ? 'Visualizador' : 'Miembro'}.
            </p>
            <div className="flex items-center justify-center space-x-2 text-purple-600">
              <Loader className="w-4 h-4 animate-spin" />
              <span className="text-sm">Redirigiendo...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Formulario de registro inline
  if (showRegistrationForm && !is_authenticated) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-lg">
            {/* Organization Header */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
                {inviteDetails?.organizationLogo ? (
                  <img
                    src={inviteDetails.organizationLogo}
                    alt={`${inviteDetails.organizationName} logo`}
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <Building2 className="w-8 h-8 text-white" />
                )}
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-1">
                Únete a {inviteDetails?.organizationName}
              </h1>
              <p className="text-gray-600 text-sm">
                Crea tu cuenta para aceptar la invitación
              </p>
            </div>

            {registrationError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <span className="text-red-700 text-sm">{registrationError}</span>
              </div>
            )}

            <form onSubmit={handleRegisterAndAccept} className="space-y-4">
              {/* Campo Nombre */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre completo
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserIcon className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={registrationData.name}
                    onChange={handleRegistrationChange}
                    className="block w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                    placeholder="Tu nombre completo"
                  />
                </div>
              </div>

              {/* Campo Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Correo electrónico
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={registrationData.email}
                    onChange={handleRegistrationChange}
                    className="block w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                    placeholder="correo@ejemplo.com"
                  />
                </div>
              </div>

              {/* Campo Contraseña */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Contraseña
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={registrationData.password}
                    onChange={handleRegistrationChange}
                    className="block w-full pl-9 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                    placeholder="Mínimo 8 caracteres"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
              </div>

              {/* Campo Confirmar Contraseña */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmar contraseña
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    required
                    value={registrationData.confirmPassword}
                    onChange={handleRegistrationChange}
                    className="block w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                    placeholder="Repite tu contraseña"
                  />
                </div>
              </div>

              {/* Botones */}
              <div className="space-y-3 pt-2">
                <button
                  type="submit"
                  disabled={registrationLoading}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors duration-200 font-medium"
                >
                  {registrationLoading ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      <span>Creando cuenta...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Crear cuenta y unirse</span>
                    </>
                  )}
                </button>
                
                <button
                  type="button"
                  onClick={() => setShowRegistrationForm(false)}
                  className="w-full px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg transition-colors duration-200"
                >
                  Volver
                </button>
              </div>
            </form>

            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                Al crear una cuenta, aceptas automáticamente esta invitación.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-lg">
          {/* Organization Header */}
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              {inviteDetails?.organizationLogo ? (
                <img
                  src={inviteDetails.organizationLogo}
                  alt={`${inviteDetails.organizationName} logo`}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <Building2 className="w-10 h-10 text-white" />
              )}
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Invitación a {inviteDetails?.organizationName}
            </h1>
            <p className="text-gray-600">
              {inviteDetails?.inviterName} te ha invitado a unirte
            </p>
          </div>

          {/* Invite Details */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Rol asignado:</span>
                <div className="flex items-center space-x-1">
                  {inviteDetails?.role === 'admin' ? (
                    <>
                      <Shield className="w-4 h-4 text-purple-600" />
                      <span className="font-medium text-purple-700">Administrador</span>
                    </>
                  ) : inviteDetails?.role === 'viewer' ? (
                    <>
                      <UserIcon className="w-4 h-4 text-gray-600" />
                      <span className="font-medium text-gray-700">Visualizador</span>
                    </>
                  ) : (
                    <>
                      <UserIcon className="w-4 h-4 text-blue-600" />
                      <span className="font-medium text-blue-700">Miembro</span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Invitado por:</span>
                <span className="font-medium text-gray-900">{inviteDetails?.inviterEmail}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Expira:</span>
                <span className="font-medium text-gray-900">
                  {inviteDetails?.expiresAt && new Date(inviteDetails.expiresAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* User Status */}
          {!is_authenticated ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-blue-700 text-sm">
                <strong>¡Genial!</strong> Puedes crear una cuenta directamente aquí para unirte.
              </p>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-green-700 text-sm">
                <strong>Conectado como:</strong> {user?.email}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={handleAcceptInvite}
              disabled={accepting || inviteDetails?.isExpired}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors duration-200 font-medium"
            >
              {accepting ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Aceptando invitación...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  <span>
                    {is_authenticated ? 'Aceptar invitación' : 'Crear cuenta y unirse'}
                  </span>
                </>
              )}
            </button>
            
            <button
              onClick={() => navigate('/app/dashboard')}
              className="w-full px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg transition-colors duration-200"
            >
              Rechazar
            </button>

            {/* Botón adicional para login si no está autenticado */}
            {!is_authenticated && (
              <button
                onClick={() => navigate(`/login?invite=${code}`)}
                className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors duration-200 text-sm"
              >
                ¿Ya tienes cuenta? Inicia sesión
              </button>
            )}
          </div>

          {/* Footer */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              Si no esperabas esta invitación, puedes ignorarla de forma segura.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvitePage;
