import React, { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, User, Loader2, AlertCircle } from 'lucide-react';
import { useAuthContext } from '../../contexts/AuthContext';
import { useTranslation } from '../../hooks/useTranslation';

interface RegisterFormProps {
    onLogin: () => void;
    onSwitchToLogin: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onLogin, onSwitchToLogin }) => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'member' as 'admin' | 'member' | 'viewer'
    });
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const { register } = useAuthContext();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validaciones básicas
        if (formData.password !== formData.confirmPassword) {
            setError(t('auth.passwordsNoMatch'));
            return;
        }

        if (formData.password.length < 8) {
            setError(t('auth.passwordTooShort'));
            return;
        }

        setIsLoading(true);

        try {
            await register({
                name: formData.name,
                email: formData.email,
                password: formData.password,
                role: formData.role
            });
            onLogin();
        } catch (err: any) {
            setError(err.message || t('auth.registerError'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-surface/95 backdrop-blur-sm border border-muted/30 rounded-xl p-8 shadow-xl">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-textPrimary mb-2">{t('auth.createAccount')}</h2>
                <p className="text-textSecondary">{t('auth.joinLoophack')}</p>
            </div>

            {/* Mensaje de Error */}
            {error && (
                <div className="mb-4 p-3 bg-error border border-red-300 rounded-lg flex items-center space-x-2">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <span className="text-red-700 text-sm">{error}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Campo Nombre */}
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-textPrimary mb-2">
                        {t('auth.fullName')}
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <User className="h-5 w-5 text-textSecondary" />
                        </div>
                        <input
                            id="name"
                            name="name"
                            type="text"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            className="block w-full pl-10 pr-3 py-3 border border-muted/30 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent bg-surface text-textPrimary placeholder-textSecondary"
                            placeholder={t('auth.fullNamePlaceholder')}
                        />
                    </div>
                </div>

                {/* Campo Email */}
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-textPrimary mb-2">
                        {t('auth.email')}
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Mail className="h-5 w-5 text-textSecondary" />
                        </div>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            className="block w-full pl-10 pr-3 py-3 border border-muted/30 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent bg-surface text-textPrimary placeholder-textSecondary"
                            placeholder={t('auth.emailPlaceholder')}
                        />
                    </div>
                </div>

                {/* Campo Rol */}
                <div>
                    <label htmlFor="role" className="block text-sm font-medium text-textPrimary mb-2">
                        {t('auth.role')}
                    </label>
                    <select
                        id="role"
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                        className="block w-full py-3 px-3 border border-muted/30 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent bg-surface text-textPrimary"
                    >
                        <option value="member">{t('auth.member')}</option>
                        <option value="admin">{t('auth.admin')}</option>
                        <option value="viewer">{t('auth.viewer')}</option>
                    </select>
                </div>

                {/* Campo Contraseña */}
                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-textPrimary mb-2">
                        {t('auth.password')}
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Lock className="h-5 w-5 text-textSecondary" />
                        </div>
                        <input
                            id="password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            value={formData.password}
                            onChange={handleChange}
                            required
                            className="block w-full pl-10 pr-12 py-3 border border-muted/30 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent bg-surface text-textPrimary placeholder-textSecondary"
                            placeholder={t('auth.minCharacters')}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                            {showPassword ? (
                                <EyeOff className="h-5 w-5 text-textSecondary hover:text-textPrimary" />
                            ) : (
                                <Eye className="h-5 w-5 text-textSecondary hover:text-textPrimary" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Campo Confirmar Contraseña */}
                <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-textPrimary mb-2">
                        {t('auth.confirmPassword')}
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Lock className="h-5 w-5 text-textSecondary" />
                        </div>
                        <input
                            id="confirmPassword"
                            name="confirmPassword"
                            type={showPassword ? "text" : "password"}
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                            className="block w-full pl-10 pr-3 py-3 border border-muted/30 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent bg-surface text-textPrimary placeholder-textSecondary"
                            placeholder={t('auth.confirmPasswordPlaceholder')}
                        />
                    </div>
                </div>

                {/* Botón de Registro */}
                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-accent to-highlight hover:from-accent/90 hover:to-highlight/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5" />
                            {t('auth.registering')}
                        </>
                    ) : (
                        t('auth.createAccount')
                    )}
                </button>

                {/* Enlace para login */}
                <div className="text-center">
                    <p className="text-sm text-textSecondary">
                        {t('auth.haveAccount')}{' '}
                        <button
                            type="button"
                            onClick={onSwitchToLogin}
                            className="font-medium text-accent hover:text-highlight transition-colors duration-200"
                        >
                            {t('auth.loginHere')}
                        </button>
                    </p>
                </div>
            </form>
        </div>
    );
};

export default RegisterForm;
