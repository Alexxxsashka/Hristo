import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, ApiResponse, ApiError } from '../types/index.js';

export const errorHandler = (
  err: any,
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  console.error('❌ Error:', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  const response: ApiResponse = {
    success: false,
    error: message
  };

  // Add stack trace in development mode if needed
  // if (process.env.NODE_ENV === 'development') {
  //   response.details = err.stack;
  // }

  res.status(statusCode).json(response);
};

export const notFoundHandler = (req: AuthenticatedRequest, res: Response) => {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.originalUrl}`
  });
};
