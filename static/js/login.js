/**
 * Login Form Handler
 * Maneja la funcionalidad del formulario de login incluyendo validación,
 * envío de datos y manejo de respuestas
 */

class LoginForm {
    constructor() {
        this.form = document.getElementById('loginForm');
        this.emailInput = document.getElementById('email');
        this.passwordInput = document.getElementById('password');
        this.submitBtn = document.getElementById('submitBtn');
        this.btnText = document.getElementById('btn-text');
        this.loadingSpinner = document.getElementById('loading-spinner');
        this.alertContainer = document.getElementById('alert-container');
        this.togglePasswordBtn = document.getElementById('togglePassword');
        this.eyeIcon = document.getElementById('eyeIcon');
        this.eyeSlashIcon = document.getElementById('eyeSlashIcon');
        
        this.init();
    }
    
    init() {
        this.attachEventListeners();
        this.setupPasswordToggle();
        this.setupRealTimeValidation();
    }
    
    attachEventListeners() {
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        this.emailInput.addEventListener('input', () => this.validateEmail());
        this.passwordInput.addEventListener('input', () => this.validatePassword());
    }
    
    setupPasswordToggle() {
        this.togglePasswordBtn.addEventListener('click', () => {
            const isPassword = this.passwordInput.type === 'password';
            this.passwordInput.type = isPassword ? 'text' : 'password';
            
            if (isPassword) {
                this.eyeIcon.classList.add('hidden');
                this.eyeSlashIcon.classList.remove('hidden');
            } else {
                this.eyeIcon.classList.remove('hidden');
                this.eyeSlashIcon.classList.add('hidden');
            }
        });
    }
    
    setupRealTimeValidation() {
        // Validación en tiempo real para email
        this.emailInput.addEventListener('blur', () => {
            this.validateEmail();
        });
        
        // Validación en tiempo real para contraseña
        this.passwordInput.addEventListener('blur', () => {
            this.validatePassword();
        });
    }
    
    validateEmail() {
        const email = this.emailInput.value.trim();
        const emailError = document.getElementById('email-error');
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (!email) {
            this.showFieldError('email', 'El correo electrónico es obligatorio');
            return false;
        }
        
        if (!emailRegex.test(email)) {
            this.showFieldError('email', 'Ingresa un correo electrónico válido');
            return false;
        }
        
        this.hideFieldError('email');
        return true;
    }
    
    validatePassword() {
        const password = this.passwordInput.value;
        const passwordError = document.getElementById('password-error');
        
        if (!password) {
            this.showFieldError('password', 'La contraseña es obligatoria');
            return false;
        }
        
        if (password.length < 6) {
            this.showFieldError('password', 'La contraseña debe tener al menos 6 caracteres');
            return false;
        }
        
        this.hideFieldError('password');
        return true;
    }
    
    showFieldError(fieldName, message) {
        const field = document.getElementById(fieldName);
        const errorElement = document.getElementById(`${fieldName}-error`);
        
        field.classList.add('border-red-500');
        field.classList.remove('border-gray-300');
        errorElement.textContent = message;
        errorElement.classList.remove('hidden');
        errorElement.classList.add('error-message');
    }
    
    hideFieldError(fieldName) {
        const field = document.getElementById(fieldName);
        const errorElement = document.getElementById(`${fieldName}-error`);
        
        field.classList.remove('border-red-500');
        field.classList.add('border-gray-300');
        errorElement.classList.add('hidden');
        errorElement.classList.remove('error-message');
    }
    
    showAlert(message, type = 'error') {
        const alertClass = type === 'error' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-green-50 border-green-200 text-green-800';
        const iconClass = type === 'error' ? 'text-red-400' : 'text-green-400';
        const icon = type === 'error' ? 
            '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>' :
            '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>';
        
        this.alertContainer.innerHTML = `
            <div class="border rounded-lg p-4 ${alertClass} ${type === 'error' ? 'error-message' : 'success-message'}">
                <div class="flex">
                    <div class="flex-shrink-0">
                        <svg class="h-5 w-5 ${iconClass}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            ${icon}
                        </svg>
                    </div>
                    <div class="ml-3">
                        <p class="text-sm font-medium">${message}</p>
                    </div>
                </div>
            </div>
        `;
        
        this.alertContainer.classList.remove('hidden');
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            this.hideAlert();
        }, 5000);
    }
    
    hideAlert() {
        this.alertContainer.classList.add('hidden');
        this.alertContainer.innerHTML = '';
    }
    
    setLoading(isLoading) {
        if (isLoading) {
            this.submitBtn.disabled = true;
            this.btnText.classList.add('hidden');
            this.loadingSpinner.classList.remove('hidden');
        } else {
            this.submitBtn.disabled = false;
            this.btnText.classList.remove('hidden');
            this.loadingSpinner.classList.add('hidden');
        }
    }
    
    async handleSubmit(e) {
        e.preventDefault();
        
        // Limpiar alertas previas
        this.hideAlert();
        
        // Validar campos
        const isEmailValid = this.validateEmail();
        const isPasswordValid = this.validatePassword();
        
        if (!isEmailValid || !isPasswordValid) {
            this.showAlert('Por favor, corrige los errores en el formulario.');
            return;
        }
        
        // Obtener datos del formulario
        const formData = {
            email: this.emailInput.value.trim(),
            password: this.passwordInput.value
        };
        
        // Mostrar estado de carga
        this.setLoading(true);
        
        try {
            // Realizar petición al API
            const response = await fetch('/api/login/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.getCSRFToken()
                },
                body: JSON.stringify(formData)
            });
            
            const data = await response.json();
            
            if (response.ok) {
                // Login exitoso
                this.showAlert('¡Inicio de sesión exitoso! Redirigiendo...', 'success');
                
                // Guardar tokens en localStorage
                if (data.access) {
                    localStorage.setItem('access_token', data.access);
                }
                if (data.refresh) {
                    localStorage.setItem('refresh_token', data.refresh);
                }
                
                // Redirigir después de 1.5 segundos
                setTimeout(() => {
                    window.location.href = '/dashboard/';  // Cambia por la URL deseada
                }, 1500);
                
            } else {
                // Error en el login
                let errorMessage = 'Error en el inicio de sesión';
                
                if (data.error) {
                    errorMessage = data.error;
                } else if (data.email) {
                    errorMessage = data.email[0];
                } else if (data.password) {
                    errorMessage = data.password[0];
                }
                
                this.showAlert(errorMessage);
            }
            
        } catch (error) {
            console.error('Error en el login:', error);
            this.showAlert('Error de conexión. Por favor, intenta nuevamente.');
        } finally {
            this.setLoading(false);
        }
    }
    
    getCSRFToken() {
        const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]');
        return csrfToken ? csrfToken.value : '';
    }
}

// Inicializar la aplicación cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', () => {
    new LoginForm();
});

// Utility functions
window.LoginUtils = {
    // Función para obtener el token de acceso
    getAccessToken: () => {
        return localStorage.getItem('access_token');
    },
    
    // Función para obtener el token de refresh
    getRefreshToken: () => {
        return localStorage.getItem('refresh_token');
    },
    
    // Función para verificar si el usuario está autenticado
    is_authenticated: () => {
        return !!localStorage.getItem('access_token');
    },
    
    // Función para cerrar sesión
    logout: () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login/';
    }
};
