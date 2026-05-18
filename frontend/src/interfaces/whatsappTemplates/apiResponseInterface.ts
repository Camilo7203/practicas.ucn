export interface IAPIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}