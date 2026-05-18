import { API_CONFIG } from '@/config';
import { STORAGE_KEYS, HTTP_STATUS, ERROR_CODES } from '@/lib/constants';
import { storage, getErrorMessage } from '@/utils';
import type { ApiResponse } from '@/types';

interface RequestConfig {
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
}

class ApiClient {
  private baseURL: string;
  private timeout: number;
  private retryAttempts: number;

  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.timeout = API_CONFIG.TIMEOUT;
    this.retryAttempts = API_CONFIG.RETRY_ATTEMPTS;
  }

  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');
    
    let data: any;
    if (isJson) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (response.ok) {
      return {
        success: true,
        data: data,
      };
    } else {
      // Handle authentication errors
      if (response.status === HTTP_STATUS.UNAUTHORIZED) {
        this.handleAuthError();
      }

      return {
        success: false,
        error: data?.message || data?.error || `Error ${response.status}`,
        data: data,
      };
    }
  }

  private handleAuthError(): void {
    // Clear stored tokens
    storage.remove(STORAGE_KEYS.ACCESS_TOKEN);
    storage.remove(STORAGE_KEYS.REFRESH_TOKEN);
    storage.remove(STORAGE_KEYS.USER_DATA);
    
    // Redirect to login if not already there
    if (!window.location.pathname.includes('/login')) {
      window.location.href = '/login';
    }
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...this.getAuthHeaders(),
      ...config.headers,
    };

    const requestConfig: RequestInit = {
      ...options,
      headers,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeout || this.timeout);

    let lastError: Error | null = null;
    const maxRetries = config.retries ?? this.retryAttempts;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(url, {
          ...requestConfig,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        return await this.handleResponse<T>(response);
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on abort (timeout) or on last attempt
        if (error instanceof Error && error.name === 'AbortError') {
          return {
            success: false,
            error: ERROR_CODES.TIMEOUT_ERROR,
          };
        }

        if (attempt === maxRetries) {
          break;
        }

        // Wait before retrying (exponential backoff)
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    clearTimeout(timeoutId);
    return {
      success: false,
      error: lastError ? getErrorMessage(lastError) : ERROR_CODES.NETWORK_ERROR,
    };
  }

  // HTTP Methods
  async get<T>(endpoint: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { method: 'GET' }, config);
  }

  async post<T>(
    endpoint: string,
    data?: any,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(
      endpoint,
      {
        method: 'POST',
        body: data ? JSON.stringify(data) : undefined,
      },
      config
    );
  }

  async put<T>(
    endpoint: string,
    data?: any,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(
      endpoint,
      {
        method: 'PUT',
        body: data ? JSON.stringify(data) : undefined,
      },
      config
    );
  }

  async patch<T>(
    endpoint: string,
    data?: any,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(
      endpoint,
      {
        method: 'PATCH',
        body: data ? JSON.stringify(data) : undefined,
      },
      config
    );
  }

  async delete<T>(endpoint: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { method: 'DELETE' }, config);
  }

  // File upload method
  async upload<T>(
    endpoint: string,
    file: File,
    additionalData?: Record<string, string>,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    return this.makeRequest<T>(
      endpoint,
      {
        method: 'POST',
        body: formData,
      },
      {
        ...config,
        headers: {
          // Don't set Content-Type for FormData - let browser set it with boundary
          ...this.getAuthHeaders(),
          ...config?.headers,
        },
      }
    );
  }

  // Utility methods
  setBaseURL(url: string): void {
    this.baseURL = url;
  }

  setTimeout(timeout: number): void {
    this.timeout = timeout;
  }

  setRetryAttempts(attempts: number): void {
    this.retryAttempts = attempts;
  }
}

// Create singleton instance
export const apiClient = new ApiClient();

export default apiClient;
