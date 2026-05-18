/**
 * Application constants
 */

// Route paths
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  ACTIVATE: '/activate',
  CAMPAIGNS: '/campaigns',
  ANALYTICS: '/analytics',
  AI_AGENTS: '/ai-agents',
  CONVERSATIONS: '/conversations',
  PROFILE: '/profile',
  SETTINGS: '/settings',
} as const;

// HTTP Status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// Local storage keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user',
  THEME: 'loophack_theme',
  LANGUAGE: 'loophack_language',
  PREFERENCES: 'loophack_preferences',
} as const;

// Event names
export const EVENTS = {
  AUTH_LOGIN: 'auth:login',
  AUTH_LOGOUT: 'auth:logout',
  SESSION_WARNING: 'session:warning',
  SESSION_EXPIRED: 'session:expired',
  THEME_CHANGED: 'theme:changed',
  LANGUAGE_CHANGED: 'language:changed',
} as const;

// Message types
export const MESSAGE_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
} as const;

// Form validation messages
export const VALIDATION_MESSAGES = {
  REQUIRED: 'Este campo es obligatorio',
  INVALID_EMAIL: 'Por favor, introduce un email válido',
  WEAK_PASSWORD: 'La contraseña debe tener al menos 8 caracteres, incluir mayúsculas, minúsculas, números y símbolos',
  PASSWORDS_DONT_MATCH: 'Las contraseñas no coinciden',
  MIN_LENGTH: (min: number) => `Debe tener al menos ${min} caracteres`,
  MAX_LENGTH: (max: number) => `No puede exceder ${max} caracteres`,
} as const;

// User roles
export const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  MODERATOR: 'moderator',
} as const;

// Campaign statuses
export const CAMPAIGN_STATUS = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

// File upload constraints
export const FILE_UPLOAD = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
} as const;

// Animation durations (in milliseconds)
export const ANIMATION_DURATION = {
  FAST: 150,
  NORMAL: 200,
  SLOW: 300,
  VERY_SLOW: 500,
} as const;

// Breakpoint values
export const BREAKPOINTS = {
  XS: 0,
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  XXL: 1536,
} as const;

// API endpoints base paths
export const API_ENDPOINTS = {
  AUTH: '/auth',
  USERS: '/users',
  CAMPAIGNS: '/campaigns',
  ANALYTICS: '/analytics',
  UPLOADS: '/uploads',
} as const;

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const;

// Date formats
export const DATE_FORMATS = {
  SHORT: 'dd/MM/yyyy',
  LONG: 'dd/MM/yyyy HH:mm',
  TIME_ONLY: 'HH:mm',
  ISO: 'yyyy-MM-dd',
} as const;

// Error codes
export const ERROR_CODES = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
} as const;

// Feature flags
export const FEATURE_FLAGS = {
  ENABLE_ANALYTICS: true,
  ENABLE_AI_AGENTS: true,
  ENABLE_DARK_MODE: true,
  ENABLE_NOTIFICATIONS: true,
} as const;

export default {
  ROUTES,
  HTTP_STATUS,
  STORAGE_KEYS,
  EVENTS,
  MESSAGE_TYPES,
  VALIDATION_MESSAGES,
  USER_ROLES,
  CAMPAIGN_STATUS,
  FILE_UPLOAD,
  ANIMATION_DURATION,
  BREAKPOINTS,
  API_ENDPOINTS,
  PAGINATION,
  DATE_FORMATS,
  ERROR_CODES,
  FEATURE_FLAGS,
};
