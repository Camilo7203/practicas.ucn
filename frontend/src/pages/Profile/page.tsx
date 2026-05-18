import React, { useState } from 'react';
import { User, Camera, Save, X, Lock, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { authService } from '@/services/authService';
import ChangePasswordModal from '@/components/ChangePasswordModal';
import { useNavigate } from 'react-router-dom';

const Profile: React.FC = () => {
  const { t } = useTranslation();
  const { user, refreshUserData, logout } = useAuthContext();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    role: user?.role || 'member',
    is_active: user?.is_active !== undefined ? user.is_active : true,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));
    setError(null);
  };

  const handleSave = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Preparar datos a enviar (solo campos que cambiaron)
      const updateData: any = {};
      if (formData.name !== user?.name) updateData.name = formData.name;
      if (formData.email !== user?.email) updateData.email = formData.email;
      
      // Solo admin puede cambiar role e is_active
      if (user?.role === 'admin') {
        if (formData.role !== user?.role) updateData.role = formData.role;
        if (formData.is_active !== user?.is_active) updateData.is_active = formData.is_active;
      }

      if (Object.keys(updateData).length === 0) {
        setError('No hay cambios para guardar');
        setIsLoading(false);
        return;
      }

      const response = await authService.updateProfile(updateData);

      if (response.success) {
        setSuccess(response.message);
        setIsEditing(false);

        // Si cambió role o is_active, forzar logout
        if (response.force_logout) {
          setTimeout(() => {
            logout();
            navigate('/login', { 
              state: { 
                message: 'Su perfil ha sido actualizado. Por favor, inicie sesión nuevamente.' 
              } 
            });
          }, 2000);
        } else {
          // Refrescar auth context con datos actualizados
          await refreshUserData();
        }
      }
    } catch (err: any) {
      console.error('Error updating profile:', err);
      if (err.errors) {
        const errorMessages = Object.entries(err.errors)
          .map(([field, messages]: [string, any]) => `${field}: ${messages.join(', ')}`)
          .join('\n');
        setError(errorMessages);
      } else {
        setError(err.error || 'Error al actualizar el perfil');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      role: user?.role || 'member',
      is_active: user?.is_active !== undefined ? user.is_active : true,
    });
    setIsEditing(false);
    setError(null);
    setSuccess(null);
  };

  const isAdmin = user?.role === 'admin';

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-surface to-muted p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-textPrimary mb-2">
            {t('profile.title')}
          </h1>
          <p className="text-textSecondary">
            {t('profile.subtitle')}
          </p>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1 whitespace-pre-line">{error}</div>
          </div>
        )}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-start gap-3">
            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1">{success}</div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-surface rounded-xl p-6 shadow-sm border border-muted/30 text-center">
              <div className="relative inline-block mb-4">
                <div className="w-24 h-24 bg-gradient-to-br from-highlight to-accent rounded-full flex items-center justify-center mx-auto">
                  <User className="w-12 h-12 text-white" />
                </div>
                <button className="absolute bottom-0 right-0 bg-surface border border-muted rounded-full p-2 hover:bg-muted/20 transition-colors">
                  <Camera className="w-4 h-4 text-textSecondary" />
                </button>
              </div>
              
              <h2 className="text-xl font-semibold text-textPrimary mb-1">
                {user?.name || t('profile.userDefault')}
              </h2>
              <p className="text-textSecondary mb-2">{user?.role || t('auth.member')}</p>
              <p className="text-sm text-textSecondary">{user?.email}</p>

              {/* Password Change Button */}
              <button
                onClick={() => setShowPasswordModal(true)}
                className="mt-6 w-full bg-gradient-to-r from-highlight to-accent text-white px-4 py-2 rounded-lg font-semibold hover:from-accent hover:to-highlight transition-all duration-200 flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" />
                {t('profile.changePassword') || 'Cambiar Contraseña'}
              </button>
            </div>
          </div>

          {/* Profile Form */}
          <div className="lg:col-span-2">
            <div className="bg-surface rounded-xl p-6 shadow-sm border border-muted/30">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-textPrimary">
                  {t('profile.personalInfo')}
                </h3>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="bg-gradient-to-r from-highlight to-accent text-white px-4 py-2 rounded-lg font-semibold hover:from-accent hover:to-highlight transition-all duration-200"
                  >
                    {t('profile.editProfile')}
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={handleSave}
                      disabled={isLoading}
                      className="bg-gradient-to-r from-highlight to-accent text-white px-4 py-2 rounded-lg font-semibold hover:from-accent hover:to-highlight transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Save className="w-4 h-4" />
                      {isLoading ? 'Guardando...' : t('common.save')}
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={isLoading}
                      className="border border-muted text-textPrimary px-4 py-2 rounded-lg font-semibold hover:bg-muted/20 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <X className="w-4 h-4" />
                      {t('common.cancel')}
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-textPrimary mb-2">
                    {t('profile.fullName')}
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-muted rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent disabled:bg-muted/20 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-textPrimary mb-2">
                    {t('auth.email')}
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-muted rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent disabled:bg-muted/20 disabled:cursor-not-allowed"
                  />
                </div>

                {/* Admin-only fields */}
                {isAdmin && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-textPrimary mb-2">
                        {t('auth.role') || 'Rol'}
                      </label>
                      <select
                        name="role"
                        value={formData.role}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="w-full px-4 py-3 border border-muted rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent disabled:bg-muted/20 disabled:cursor-not-allowed"
                      >
                        <option value="admin">Admin</option>
                        <option value="member">Member</option>
                        <option value="viewer">Viewer</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-textPrimary mb-2">
                        {t('profile.accountStatus') || 'Estado de la cuenta'}
                      </label>
                      <div className="flex items-center gap-3 h-full">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            name="is_active"
                            checked={formData.is_active}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-accent/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"></div>
                          <span className="ml-3 text-sm font-medium text-textPrimary">
                            {formData.is_active ? (t('profile.active') || 'Activo') : (t('profile.inactive') || 'Inactivo')}
                          </span>
                        </label>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Password Change Modal */}
      <ChangePasswordModal 
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />
    </div>
  );
};

export default Profile;
