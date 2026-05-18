import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Users, 
  Mail, 
  User, 
  Shield, 
  UserPlus,
  Edit3,
  Save,
  X,
  Copy,
  CheckCircle,
  Trash2,
  Clock
} from 'lucide-react';
import OrganizationService from '../../services/organizationService';
import { useAuthContext } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

interface OrganizationData {
  _id?: string;
  name: string;
  alias: string;
  description?: string;
  logo?: string;
  segments: string[];
  plan: 'free' | 'basic' | 'premium';
  is_active: boolean;
  created_at: string;
  updated_at: string;
  role?: 'admin' | 'member' | 'viewer';
}

interface OrganizationUser {
  id: string;
  userId?: string;
  name: string;
  email: string;
  role: 'admin' | 'member' | 'viewer';
  created_at: string;
}

interface PendingInvitation {
  email?: string;
  role: 'admin' | 'member' | 'viewer';
  code: string;
  created_at: string;
  expires_at: string;
}

interface InvitationData {
  email?: string; // Email opcional
  role: 'admin' | 'member' | 'viewer';
  code?: string;
}

const OrganizationPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuthContext();
  const [organization, setOrganization] = useState<OrganizationData | null>(null);
  const [organizationUsers, setOrganizationUsers] = useState<OrganizationUser[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'member' | 'viewer'>('member');
  const [inviteCode, setInviteCode] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [membersError, setMembersError] = useState('');
  const [memberActionLoadingId, setMemberActionLoadingId] = useState<string | null>(null);
  const [isCreatingInvite, setIsCreatingInvite] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    logo: ''
  });

  useEffect(() => {
    const loadData = async () => {
      await fetchOrganizationData();
      await fetchPendingInvitations();
    };
    
    loadData();
  }, [user]);

  // Llamar fetchOrganizationUsers cuando organization cambie
  useEffect(() => {
    if (organization) {
      fetchOrganizationUsers();
    }
  }, [organization, user]);

  const fetchOrganizationData = async () => {
    try {
      const response = await OrganizationService.getOrganization();
      
      if (response.data && typeof response.data === 'object') {
        const responseData = response.data as any;
        
        if (responseData.organization) {
          const orgData = responseData.organization;
          // Primero intentar obtener el rol del response, luego del usuario actual, luego fallback
          const userRole = responseData.role || responseData.user_role || orgData.user_role || orgData.role || user?.role || 'member';
          
          setOrganization({
            ...orgData,
            role: userRole
          });
          setEditForm({
            name: orgData.name || '',
            description: orgData.description || '',
            logo: orgData.logo || ''
          });
        }
      }
    } catch (error) {
      console.error('Error fetching organization:', error);
    }
  };

  const fetchOrganizationUsers = async () => {
    try {
      const response = await OrganizationService.getOrganizationUsers();
      const members = (response.data as any)?.members || [];
      setOrganizationUsers(members);
      setMembersError('');
    } catch (error) {
      console.error('Error fetching organization users:', error);
      setMembersError('No se pudieron cargar los miembros de la organización.');
      setOrganizationUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingInvitations = async () => {
    try {
      const response = await OrganizationService.getInvitations();
      const invitations = (response.data as any)?.invitations || [];
      setPendingInvitations(invitations);
    } catch (error) {
      console.error('Error fetching pending invitations:', error);
      // Si hay error, establecer array vacío
      setPendingInvitations([]);
    }
  };

  const handleSaveChanges = async () => {
    try {
      const response = await OrganizationService.updateOrganization(editForm);
      const updatedOrganization = (response.data as any)?.organization;
      if (updatedOrganization) {
        setOrganization((current) => ({
          ...(current || updatedOrganization),
          ...updatedOrganization,
          role: current?.role || user?.role || 'member'
        }));
      }
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating organization:', error);
    }
  };

  const handleInviteUser = async () => {
    // Validar email solo si se proporciona
    if (inviteEmail.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(inviteEmail)) {
        setInviteError('Por favor ingresa un email válido');
        return;
      }
    }

    setIsCreatingInvite(true);
    setInviteError('');

    try {
      // Generar código de invitación único
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 15);
      const code = `${timestamp}-${randomStr}`;
      
      // Crear la invitación en el backend
      const invitationData: InvitationData = {
        email: inviteEmail.trim() || undefined, // Enviar undefined si está vacío
        role: inviteRole,
        code: code
      };

      const invitationResponse = await OrganizationService.createInvitation(invitationData);
      const createdCode = (invitationResponse.data as any)?.invitation?.code || code;
      setInviteCode(createdCode);
      
      // Actualizar la lista de invitaciones pendientes
      await fetchPendingInvitations();
      
    } catch (error: any) {
      console.error('Error creating invitation:', error);
      
      // Manejar diferentes tipos de errores
      if (error.response?.status === 409) {
        setInviteError('Ya existe una invitación pendiente para este email');
      } else if (error.response?.status === 400) {
        setInviteError('El email ya pertenece a la organización');
      } else {
        setInviteError('Error al crear la invitación. Inténtalo de nuevo.');
      }
    } finally {
      setIsCreatingInvite(false);
    }
  };

  const getRoleLabel = (role: 'admin' | 'member' | 'viewer') => {
    if (role === 'admin') return t('organization.administrator');
    if (role === 'viewer') return t('organization.viewer');
    return t('organization.member');
  };

  const handleRoleChange = async (memberId: string, newRole: 'admin' | 'member' | 'viewer') => {
    try {
      setMemberActionLoadingId(memberId);
      await OrganizationService.updateOrganizationUserRole(memberId, newRole);
      await fetchOrganizationUsers();
    } catch (error) {
      console.error('Error updating member role:', error);
      alert('No se pudo actualizar el rol del miembro.');
    } finally {
      setMemberActionLoadingId(null);
    }
  };

  const handleRemoveMember = async (member: OrganizationUser) => {
    if (!confirm(`¿Estás seguro de que quieres remover a ${member.name} de la organización?`)) {
      return;
    }

    try {
      setMemberActionLoadingId(member.id);
      await OrganizationService.removeOrganizationUser(member.id);
      await fetchOrganizationUsers();
    } catch (error) {
      console.error('Error removing member:', error);
      alert('No se pudo remover el miembro.');
    } finally {
      setMemberActionLoadingId(null);
    }
  };

  const copyInviteCode = () => {
    navigator.clipboard.writeText(`${window.location.origin}/invite/${inviteCode}`);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleDeleteInvitation = async (code: string, email: string) => {
    if (!confirm(`¿Estás seguro de que quieres cancelar la invitación para ${email}?`)) {
      return;
    }

    try {
      await OrganizationService.deleteInvitation(code);
      // Actualizar la lista de invitaciones pendientes
      await fetchPendingInvitations();
    } catch (error) {
      console.error('Error deleting invitation:', error);
      alert('Error al cancelar la invitación. Inténtalo de nuevo.');
    }
  };

  const isAdmin = organization?.role === 'admin';
  const currentUserMongoId = user?.id || user?.mongoId;

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center border-2 border-gray-100 shadow-lg">
                {organization?.logo ? (
                  <img
                    src={organization.logo}
                    alt={`${organization.name} logo`}
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <Building2 className="w-8 h-8 text-white" />
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {organization?.name || t('organization.myOrganization')}
                </h1>
                <p className="text-gray-600">
                  {organization?.description || t('organization.noDescription')}
                </p>
                <div className="flex items-center space-x-2 mt-2">
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                    {organization?.plan || 'free'}
                  </span>
                  {isAdmin && (
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium flex items-center space-x-1">
                      <Shield className="w-3 h-3" />
                      <span>{t('organization.administrator')}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
            {isAdmin && (
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors duration-200 shadow-sm"
              >
                {isEditing ? <X className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                <span>{isEditing ? t('organization.cancel') : t('organization.edit')}</span>
              </button>
            )}
          </div>

          {/* Edit Form */}
          {isEditing && isAdmin && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Nombre de la organización
                  </label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    URL del logo
                  </label>
                  <input
                    type="url"
                    value={editForm.logo}
                    onChange={(e) => setEditForm({ ...editForm, logo: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                    placeholder="https://example.com/logo.png"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Descripción
                  </label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                    rows={3}
                    placeholder="Describe tu organización..."
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-4">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg transition-colors duration-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveChanges}
                  className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors duration-200"
                >
                  <Save className="w-4 h-4" />
                  <span>Guardar cambios</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Users Section */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-purple-600" />
              <h2 className="text-xl font-semibold text-gray-900">
                {t('organization.organizationMembers')}
              </h2>
              <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                {organizationUsers.length}
              </span>
            </div>
            {isAdmin && (
              <button
                onClick={() => setShowInviteModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors duration-200 shadow-sm"
              >
                <UserPlus className="w-4 h-4" />
                <span>{t('organization.inviteUser')}</span>
              </button>
            )}
          </div>

          {/* Pending Invitations */}
          {isAdmin && pendingInvitations.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center space-x-2">
                <Clock className="w-5 h-5 text-orange-500" />
                <span>{t('organization.pendingInvitations')}</span>
                <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                  {pendingInvitations.length}
                </span>
              </h3>
              <div className="space-y-3 mb-6">
                {pendingInvitations.map((invitation) => (
                  <div key={invitation.code} className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-200">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                        <Mail className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-gray-900 font-medium">{invitation.email || 'Invitación abierta'}</p>
                        <p className="text-gray-600 text-sm">
                          {t('organization.invitedAs')} {getRoleLabel(invitation.role)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <p className="text-orange-600 text-sm font-medium">{t('organization.pending')}</p>
                        <p className="text-gray-500 text-xs">
                          {t('organization.expires')}: {new Date(invitation.expires_at).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteInvitation(invitation.code, invitation.email || 'sin email')}
                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors duration-200"
                        title={t('organization.cancelInvitation')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active Members */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">{t('organization.activeMembers')}</h3>
            {membersError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {membersError}
              </div>
            )}
            <div className="space-y-3">
              {organizationUsers.map((orgUser) => (
                <div key={orgUser.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-gray-900 font-medium">{orgUser.name}</p>
                      <p className="text-gray-600 text-sm">{orgUser.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      orgUser.role === 'admin' 
                        ? 'bg-green-100 text-green-700' 
                        : orgUser.role === 'viewer'
                          ? 'bg-gray-100 text-gray-700'
                          : 'bg-blue-100 text-blue-700'
                    }`}>
                      {getRoleLabel(orgUser.role)}
                    </span>
                    <span className="text-gray-500 text-sm">
                      {new Date(orgUser.created_at).toLocaleDateString()}
                    </span>
                    {isAdmin && currentUserMongoId !== orgUser.id && (
                      <>
                        <select
                          value={orgUser.role}
                          disabled={memberActionLoadingId === orgUser.id}
                          onChange={(e) => handleRoleChange(orgUser.id, e.target.value as 'admin' | 'member' | 'viewer')}
                          className="px-2 py-1 border border-gray-300 rounded-lg text-sm text-gray-700"
                        >
                          <option value="member">{t('organization.member')}</option>
                          <option value="viewer">{t('organization.viewer')}</option>
                          <option value="admin">{t('organization.administrator')}</option>
                        </select>
                        <button
                          onClick={() => handleRemoveMember(orgUser)}
                          disabled={memberActionLoadingId === orgUser.id}
                          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors duration-200 disabled:opacity-50"
                          title={t('organization.removeMember')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white border border-gray-200 rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">{t('organization.inviteUser')}</h3>
              <button
                onClick={() => {
                  setShowInviteModal(false);
                  setInviteCode('');
                  setInviteEmail('');
                  setInviteError('');
                  setCopySuccess(false);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {!inviteCode ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Email del usuario (opcional)
                  </label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => {
                      setInviteEmail(e.target.value);
                      if (inviteError) setInviteError('');
                    }}
                    className={`w-full px-3 py-2 border rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-1 ${
                      inviteError 
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                        : 'border-gray-300 focus:border-purple-500 focus:ring-purple-500'
                    }`}
                    placeholder="usuario@example.com (opcional)"
                  />
                  {inviteError && (
                    <p className="text-red-600 text-sm mt-1">{inviteError}</p>
                  )}
                  <p className="text-gray-500 text-xs mt-1">
                    Deja en blanco para generar un link genérico que cualquiera puede usar
                  </p>
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Rol
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as 'admin' | 'member' | 'viewer')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                  >
                    <option value="member">{t('organization.member')}</option>
                    <option value="viewer">{t('organization.viewer')}</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowInviteModal(false);
                      setInviteEmail('');
                      setInviteError('');
                    }}
                    disabled={isCreatingInvite}
                    className="px-4 py-2 border border-gray-300 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed text-gray-700 rounded-lg transition-colors duration-200"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleInviteUser}
                    disabled={isCreatingInvite}
                    className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors duration-200"
                  >
                    {isCreatingInvite ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Generando...</span>
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4" />
                        <span>Generar invitación</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">
                    {t('organization.invitationGeneratedSuccess')}
                  </h4>
                  <p className="text-gray-600 text-sm mb-4">
                    {inviteEmail ? (
                      t('organization.shareWithEmail', { email: inviteEmail, role: getRoleLabel(inviteRole) })
                    ) : (
                      t('organization.shareWithAnyone', { role: getRoleLabel(inviteRole) })
                    )}
                  </p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={`${window.location.origin}/invite/${inviteCode}`}
                      readOnly
                      className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm"
                    />
                    <button
                      onClick={copyInviteCode}
                      className={`px-3 py-2 rounded-lg transition-colors duration-200 ${
                        copySuccess 
                          ? 'bg-green-100 text-green-600 border border-green-300' 
                          : 'bg-purple-100 hover:bg-purple-200 text-purple-700 border border-purple-300'
                      }`}
                      title={copySuccess ? t('organization.copied') : t('organization.copyLink')}
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  {copySuccess && (
                    <p className="text-green-600 text-sm text-center mt-2">
                      {t('organization.linkCopied')}
                    </p>
                  )}
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-start space-x-2">
                    <div className="w-4 h-4 bg-blue-500 rounded-full mt-0.5 flex-shrink-0"></div>
                    <div className="text-blue-700 text-sm">
                      <p className="font-medium mb-1">{t('organization.howItWorks')}</p>
                      <p>{t('organization.invitationInstructions')}</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowInviteModal(false);
                    setInviteCode('');
                    setInviteEmail('');
                    setInviteError('');
                    setCopySuccess(false);
                  }}
                  className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors duration-200"
                >
                  {t('organization.close')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizationPage;
