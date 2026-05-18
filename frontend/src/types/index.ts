// Auth types
export interface User {
  id: string;
  mongoId?: string;
  email: string;
  firstName: string;
  lastName: string;
  organization?: string;
  role?: string;
  avatar?: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  is_authenticated: boolean;
  isLoading: boolean;
  error?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  organization?: string;
}

// Navigation types
export type NavigationPage = 'dashboard' | 'loop-builder' | 'ai-agents' | 'conversations' | 'campaigns' | 'shipments' | 'gamification' | 'tags' | 'profile' | 'organization';

export type ViewType = 'login' | 'register' | 'dashboard' | 'activate';

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Campaign types
export interface Campaign {
  id: string;
  name: string;
  description?: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// Component props types
export interface ComponentWithChildren {
  children: React.ReactNode;
}

export interface ComponentWithClassName {
  className?: string;
}

// Form types
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'textarea' | 'select' | 'checkbox';
  required?: boolean;
  placeholder?: string;
  options?: Array<{ label: string; value: string }>;
}

// Error types
export interface ErrorInfo {
  message: string;
  code?: string;
  field?: string;
}

// Session types
export interface SessionConfig {
  warningTime: number; // in seconds
  autoLogoutTime: number; // in seconds
  onWarning: () => void;
  onExpiry: () => void;
}

// Chat/Messages types
export interface ChatMessage {
  id: string;
  sessionID: string;
  type: 'Human' | 'AI' | 'System';
  content: string;
  timestamp: string | Date;
}

export interface ChatSession {
  sessionID: string;
  lastMessage: string;
  messageCount: number;
  lastActivity: string | Date;
}

export interface ChatMessagesResponse {
  sessionID?: string;
  messages?: ChatMessage[];
  sessions?: ChatSession[];
  total: number;
}
