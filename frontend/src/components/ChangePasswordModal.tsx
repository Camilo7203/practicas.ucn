import React, { useState } from 'react';
import { Lock, Eye, EyeOff, Check, X, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { authService } from '@/services/authService';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PasswordValidation {
  minLength: boolean;
  hasUpperCase: boolean;
  hasLowerCase: boolean;
  hasSpecialChar: boolean;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [validation, setValidation] = useState<PasswordValidation>({
    minLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasSpecialChar: false,
  });

  const validatePassword = (password: string): PasswordValidation => {
    return {
      minLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasSpecialChar: /[-*?!@#$/(){}\=.,;:]/.test(password),
    };
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    if (name === 'newPassword') {
      setValidation(validatePassword(value));
    }

    setError(null);
  };

  const isFormValid = (): boolean => {
    const allValidationsPassed = Object.values(validation).every(v => v);
    return (
      formData.currentPassword !== '' &&
      formData.newPassword !== '' &&
      formData.confirmPassword !== '' &&
      formData.newPassword === formData.confirmPassword &&
      allValidationsPassed
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Validar que las contraseñas coincidan
    if (formData.newPassword !== formData.confirmPassword) {
      setError(t('auth.passwordsNoMatch'));
      return;
    }

    // Validar que la contraseña cumpla con los requisitos
    if (!isFormValid()) {
      setError('La nueva contraseña no cumple con los requisitos de seguridad');
      return;
    }

    setIsLoading(true);

    try {
      const data = await authService.changePassword({
        current_password: formData.currentPassword,
        new_password: formData.newPassword,
        confirm_password: formData.confirmPassword,
      });

      if (data.success) {
        setSuccess(true);
        setFormData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        
        // Cerrar el modal después de 2 segundos
        setTimeout(() => {
          onClose();
          setSuccess(false);
        }, 2000);
      }
    } catch (err: any) {
      // Manejar errores del servidor
      if (err.errors) {
        const errorMessages = Object.values(err.errors)
          .flat()
          .join(', ');
        setError(errorMessages);
      } else {
        setError(err.error || 'Error al cambiar la contraseña');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setError(null);
    setSuccess(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-surface rounded-xl shadow-2xl w-full max-w-md mx-4 border border-muted/30">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-muted/30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-highlight to-accent rounded-lg">
              <Lock className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-textPrimary">
              {t('profile.changePassword')}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="text-textSecondary hover:text-textPrimary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Current Password */}
          <div>
            <label className="block text-sm font-medium text-textPrimary mb-2">
              {t('profile.currentPassword')}
            </label>
            <div className="relative">
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleInputChange}
                className="w-full px-4 py-3 pr-12 border border-muted rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-textSecondary hover:text-textPrimary"
              >
                {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-sm font-medium text-textPrimary mb-2">
              {t('profile.newPassword')}
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                name="newPassword"
                value={formData.newPassword}
                onChange={handleInputChange}
                className="w-full px-4 py-3 pr-12 border border-muted rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-textSecondary hover:text-textPrimary"
              >
                {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {/* Password Requirements */}
            {formData.newPassword && (
              <div className="mt-3 space-y-2">
                <p className="text-xs font-medium text-textSecondary">Requisitos de contraseña:</p>
                <div className="space-y-1">
                  <div className={`flex items-center gap-2 text-xs ${validation.minLength ? 'text-green-600' : 'text-textSecondary'}`}>
                    {validation.minLength ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                    <span>Mínimo 8 caracteres</span>
                  </div>
                  <div className={`flex items-center gap-2 text-xs ${validation.hasUpperCase ? 'text-green-600' : 'text-textSecondary'}`}>
                    {validation.hasUpperCase ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                    <span>Al menos una letra mayúscula</span>
                  </div>
                  <div className={`flex items-center gap-2 text-xs ${validation.hasLowerCase ? 'text-green-600' : 'text-textSecondary'}`}>
                    {validation.hasLowerCase ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                    <span>Al menos una letra minúscula</span>
                  </div>
                  <div className={`flex items-center gap-2 text-xs ${validation.hasSpecialChar ? 'text-green-600' : 'text-textSecondary'}`}>
                    {validation.hasSpecialChar ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                    <span>Al menos un carácter especial (- * ? ! @ # $ / () {} = . , ; :)</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-textPrimary mb-2">
              {t('profile.confirmNewPassword')}
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="w-full px-4 py-3 pr-12 border border-muted rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-textSecondary hover:text-textPrimary"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {formData.confirmPassword && formData.newPassword !== formData.confirmPassword && (
              <p className="mt-2 text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {t('auth.passwordsNoMatch')}
              </p>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {error}
              </p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-600 flex items-center gap-2">
                <Check className="w-4 h-4" />
                Contraseña cambiada exitosamente
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-3 border border-muted text-textPrimary rounded-lg font-medium hover:bg-muted/20 transition-colors"
              disabled={isLoading}
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={!isFormValid() || isLoading}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-highlight to-accent text-white rounded-lg font-medium hover:from-accent hover:to-highlight transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Cambiando...' : t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
