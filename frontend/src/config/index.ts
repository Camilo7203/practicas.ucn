// Environment configuration
export const ENV = {
  NODE_ENV: import.meta.env.NODE_ENV || 'development',
  VITE_API_URL: import.meta.env.VITE_API_URL || 'https://api-app.loophack.ai/api', // Ensure HTTP
  VITE_APP_NAME: import.meta.env.VITE_APP_NAME || 'LoopHack',
  VITE_APP_VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
} as const;

// API configuration
export const API_CONFIG = {
  BASE_URL: ENV.VITE_API_URL,
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/auth/login/',
      REGISTER: '/auth/register/',
      LOGOUT: '/auth/logout/',
      REFRESH: '/auth/refresh/',
      PROFILE: '/auth/profile/',
      UPDATE_PROFILE: '/auth/profile/',
      CHANGE_PASSWORD: '/auth/change-password/',
      ACTIVATE: '/auth/activate/',
      FORGOT_PASSWORD: '/auth/forgot-password/',
      RESET_PASSWORD: '/auth/reset-password/',
    },
    CAMPAIGNS: {
      LIST: '/campaigns',
      CREATE: '/campaigns',
      UPDATE: '/campaigns',
      DELETE: '/campaigns',
    },
  },
} as const;

// Session configuration
export const SESSION_CONFIG = {
  WARNING_TIME: 5 * 60, // 5 minutes in seconds
  AUTO_LOGOUT_TIME: 1 * 60, // 1 minute in seconds
  REFRESH_INTERVAL: 15 * 60 * 1000, // 15 minutes in milliseconds
} as const;

// UI configuration
export const UI_CONFIG = {
  ANIMATION_DURATION: 200,
  DEBOUNCE_DELAY: 300,
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 10,
    PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
  },
  TOAST: {
    DURATION: 4000,
    MAX_TOASTS: 5,
  },
} as const;

// Theme configuration
export const THEME_CONFIG = {
  COLORS: {
    primary: '#1a0a2e',
    secondary: '#340349',
    accent: '#da6aeeff',
    highlight: '#b430cc',
    background: '#f9f6fb',
    surface: '#ffffff',
    muted: '#d6c8e4',
    textPrimary: '#1a0a2e',
    textSecondary: '#4d3d61',
  },
  BREAKPOINTS: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
} as const;

// Development configuration
export const DEV_CONFIG = {
  ENABLE_MOCK_API: import.meta.env.VITE_ENABLE_MOCK_API === 'true',
  LOG_LEVEL: import.meta.env.VITE_LOG_LEVEL || 'info',
  REDUX_DEVTOOLS: import.meta.env.NODE_ENV === 'development',
} as const;

export default {
  ENV,
  API_CONFIG,
  SESSION_CONFIG,
  UI_CONFIG,
  THEME_CONFIG,
  DEV_CONFIG,
};
