import { Request } from 'express';

export interface UserPayload {
  id: string;
  email: string;
  role: 'admin' | 'user';
}

export interface AuthenticatedRequest extends Request {
  user?: UserPayload;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export class ApiError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}
