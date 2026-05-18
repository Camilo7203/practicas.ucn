import React, { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, Loader2, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuthContext } from '../../contexts/AuthContext';

interface LoginFormProps {
    onLogin: () => void;
    onSwitchToRegister: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLogin }) => {
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const { login } = useAuthContext();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await login({
                email,
                password,
            });
            onLogin();
        } catch (err: any) {
            setError(err.message || t('auth.loginError'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    {error}
                </div>
            )}

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
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="block w-full pl-10 pr-3 py-3 border border-muted/30 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent bg-surface text-textPrimary placeholder-textSecondary"
                        placeholder={t('auth.emailPlaceholder')}
                    />
                </div>
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
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="block w-full pl-10 pr-12 py-3 border border-muted/30 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent bg-surface text-textPrimary placeholder-textSecondary"
                        placeholder={t('auth.passwordPlaceholder')}
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
            {/* Botón de Login */}
            <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-accent to-highlight hover:from-accent/90 hover:to-highlight/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
                {isLoading ? (
                    <>
                        <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5" />
                        {t('auth.signingIn')}
                    </>
                ) : (
                    t('auth.login')
                )}
            </button>
        </form>
    );
};

export default LoginForm;