import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import loopHack from '../../assets/loophack.png';

interface LoginProps {
    onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
    const { t } = useTranslation();
    const [isLogin, setIsLogin] = useState(true);
    const location = useLocation();
    const navigate = useNavigate();
    
    // Extraer código de invitación de los parámetros de URL
    const searchParams = new URLSearchParams(location.search);
    const inviteCode = searchParams.get('invite');

    const handleSuccessfulLogin = () => {
        onLogin();
        
        // Si hay código de invitación, redirigir a la página de invitación
        if (inviteCode) {
            navigate(`/invite/${inviteCode}`);
        }
    };

    const handleSwitchToRegister = () => {
        setIsLogin(false);
    };

    const handleSwitchToLogin = () => {
        setIsLogin(true);
    };

    return (
            <div className="grid min-h-screen w-full bg-surface lg:grid-cols-2">
                <aside className="relative hidden overflow-hidden bg-gradient-to-br from-accent via-highlight to-accent p-10 text-white lg:flex lg:flex-col lg:justify-between">
                    <div className="relative z-10">
                        <div className="mb-10 inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-white/40 bg-white/10 p-3 backdrop-blur-sm">
                            <img
                                src={loopHack}
                                alt="Loophack Logo"
                                className="h-full w-full object-contain"
                            />
                        </div>

                        <h1 className="mb-4 text-5xl font-bold leading-tight">
                            {t('auth.welcome')} <br />
                            Loophack!
                        </h1>
                        <p className="max-w-sm text-lg text-white/90">
                            {inviteCode ? t('auth.loginToAccept') : t('auth.tagline')}
                        </p>
                    </div>

                    <p className="relative z-10 text-sm text-white/70">
                        © 2026 Loophack. {t('auth.allRightsReserved')}.
                    </p>

                    <div className="pointer-events-none absolute -bottom-28 -left-12 h-96 w-96 rounded-full border border-white/20" />
                    <div className="pointer-events-none absolute -bottom-24 -left-16 h-[30rem] w-[30rem] rounded-full border border-white/15" />
                    <div className="pointer-events-none absolute -bottom-20 -left-20 h-[36rem] w-[36rem] rounded-full border border-white/10" />
                </aside>

                <section className="flex min-h-screen items-center bg-surface px-6 py-10 sm:px-10 lg:px-14">
                    <div className="mx-auto w-full max-w-md">
                        <div className="mb-8">
                            <h2 className="mb-3 text-3xl font-bold text-textPrimary">Loophack</h2>
                            <p className="text-sm text-textSecondary">{t('auth.welcomeBack')}!</p>
                        </div>

                        {inviteCode && (
                            <div className="mb-6 rounded-lg border border-accent/20 bg-accent/10 p-4">
                                <p className="text-center text-sm text-textPrimary">
                                    💌 {t('auth.invitationPending')}
                                </p>
                            </div>
                        )}

                        <div className="mb-6">
                            <div className="flex rounded-lg border border-muted/20 bg-backgroundAlt p-1">
                                <button
                                    onClick={handleSwitchToLogin}
                                    className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all duration-200 ${
                                        isLogin
                                            ? 'bg-gradient-to-r from-accent to-highlight text-white shadow-lg'
                                            : 'text-textSecondary hover:bg-muted/20 hover:text-textPrimary'
                                    }`}
                                >
                                    {t('auth.login')}
                                </button>
                            </div>
                        </div>

                        {isLogin ? (
                            <LoginForm
                                onLogin={handleSuccessfulLogin}
                                onSwitchToRegister={handleSwitchToRegister}
                            />
                        ) : (
                            <RegisterForm
                                onLogin={handleSuccessfulLogin}
                                onSwitchToLogin={handleSwitchToLogin}
                            />
                        )}
                    </div>
                </section>
            </div>
    );
};

export default Login;