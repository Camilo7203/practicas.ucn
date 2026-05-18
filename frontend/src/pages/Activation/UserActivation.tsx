import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, AlertCircle, CheckCircle } from 'lucide-react';

const UserActivation: React.FC = () => {
    const [formData, setFormData] = useState({
        email: '',
        temp_password: '',
        new_password: '',
        confirm_password: ''
    });
    const [showTempPassword, setShowTempPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        setError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Validación del lado del cliente
        if (formData.new_password !== formData.confirm_password) {
            setError('Las contraseñas no coinciden');
            setLoading(false);
            return;
        }

        if (formData.new_password.length < 8) {
            setError('La contraseña debe tener al menos 8 caracteres');
            setLoading(false);
            return;
        }

        try {
            const response = await fetch('/api/activate/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                // Guardar tokens y redirigir
                localStorage.setItem('access_token', data.access);
                localStorage.setItem('refresh_token', data.refresh);
                setSuccess(true);
                setTimeout(() => {
                    window.location.href = '/dashboard/';
                }, 2000);
            } else {
                setError(data.error || 'Error al activar la cuenta');
            }
        } catch (error) {
            setError('Error de conexión. Inténtalo de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-primary via-secondary to-accent flex items-center justify-center p-4">
                <div className="bg-surface rounded-lg shadow-lg p-8 w-full max-w-md text-center">
                    <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-textPrimary mb-2">
                        ¡Cuenta Activada!
                    </h2>
                    <p className="text-textSecondary mb-4">
                        Tu cuenta ha sido activada exitosamente. 
                        Serás redirigido al dashboard en unos segundos.
                    </p>
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent mx-auto"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary via-secondary to-accent flex items-center justify-center p-4">
            <div className="bg-surface rounded-lg shadow-lg w-full max-w-md">
                {/* Header */}
                <div className="p-6 text-center border-b border-muted/20">
                    <h1 className="text-2xl font-bold text-primary mb-2">Activar Cuenta</h1>
                    <p className="text-textSecondary">
                        Configura tu contraseña para completar el registro
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
                            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <span className="text-red-700 text-sm">{error}</span>
                        </div>
                    )}

                    <div className="space-y-4">
                        {/* Email Field */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-textPrimary mb-2">
                                Correo electrónico
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-textSecondary" />
                                </div>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="block w-full pl-10 pr-3 py-3 border border-muted/30 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-surface text-textPrimary placeholder-textSecondary"
                                    placeholder="tu@email.com"
                                />
                            </div>
                        </div>

                        {/* Temporary Password Field */}
                        <div>
                            <label htmlFor="temp_password" className="block text-sm font-medium text-textPrimary mb-2">
                                Contraseña temporal
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-textSecondary" />
                                </div>
                                <input
                                    id="temp_password"
                                    name="temp_password"
                                    type={showTempPassword ? "text" : "password"}
                                    required
                                    value={formData.temp_password}
                                    onChange={handleChange}
                                    className="block w-full pl-10 pr-10 py-3 border border-muted/30 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-surface text-textPrimary placeholder-textSecondary"
                                    placeholder="Contraseña del email"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowTempPassword(!showTempPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                >
                                    {showTempPassword ? (
                                        <EyeOff className="h-5 w-5 text-textSecondary" />
                                    ) : (
                                        <Eye className="h-5 w-5 text-textSecondary" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* New Password Field */}
                        <div>
                            <label htmlFor="new_password" className="block text-sm font-medium text-textPrimary mb-2">
                                Nueva contraseña
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-textSecondary" />
                                </div>
                                <input
                                    id="new_password"
                                    name="new_password"
                                    type={showNewPassword ? "text" : "password"}
                                    required
                                    value={formData.new_password}
                                    onChange={handleChange}
                                    className="block w-full pl-10 pr-10 py-3 border border-muted/30 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-surface text-textPrimary placeholder-textSecondary"
                                    placeholder="Mínimo 8 caracteres"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                >
                                    {showNewPassword ? (
                                        <EyeOff className="h-5 w-5 text-textSecondary" />
                                    ) : (
                                        <Eye className="h-5 w-5 text-textSecondary" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Confirm Password Field */}
                        <div>
                            <label htmlFor="confirm_password" className="block text-sm font-medium text-textPrimary mb-2">
                                Confirmar contraseña
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-textSecondary" />
                                </div>
                                <input
                                    id="confirm_password"
                                    name="confirm_password"
                                    type={showConfirmPassword ? "text" : "password"}
                                    required
                                    value={formData.confirm_password}
                                    onChange={handleChange}
                                    className="block w-full pl-10 pr-10 py-3 border border-muted/30 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-surface text-textPrimary placeholder-textSecondary"
                                    placeholder="Repite tu contraseña"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                >
                                    {showConfirmPassword ? (
                                        <EyeOff className="h-5 w-5 text-textSecondary" />
                                    ) : (
                                        <Eye className="h-5 w-5 text-textSecondary" />
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-6 bg-primary text-white px-4 py-3 rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                    >
                        {loading ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                                Activando cuenta...
                            </>
                        ) : (
                            'Activar Cuenta'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default UserActivation;