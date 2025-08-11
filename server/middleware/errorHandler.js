// server/middleware/errorHandler.js - Enhanced error handling with logging
const fs = require('fs').promises;
const path = require('path');

// Logs directory
const logsDir = path.join(__dirname, '../logs');

// Logger utility
class Logger {
  static log(level, message, error = null, req = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...(error && {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
          code: error.code
        }
      }),
      ...(req && {
        request: {
          method: req.method,
          url: req.url,
          ip: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent'),
          userId: req.user?.id
        }
      })
    };

    // Console output with colors
    const colors = {
      error: '\x1b[31m',   // Red
      warn: '\x1b[33m',    // Yellow
      info: '\x1b[36m',    // Cyan
      debug: '\x1b[35m',   // Magenta
      reset: '\x1b[0m'     // Reset
    };

    console.log(
      `${colors[level] || colors.info}[${timestamp}] ${level.toUpperCase()}: ${message}${colors.reset}`
    );

    if (error) {
      console.log(`${colors[level]}Stack: ${error.stack}${colors.reset}`);
    }

    // Prepare log paths and message
    const logFile = path.join(logsDir, `${level}.log`);
    const generalLogFile = path.join(logsDir, 'application.log');
    const logLine = JSON.stringify(logEntry) + '\n';

    // Ensure log directory exists and write logs asynchronously
    fs.mkdir(logsDir, { recursive: true })
      .then(() =>
        Promise.all([
          fs.appendFile(logFile, logLine),
          fs.appendFile(generalLogFile, logLine)
        ])
      )
      .catch(err => console.error('Failed to write log file:', err));
  }

  static error(message, error = null, req = null) {
    this.log('error', message, error, req);
  }

  static warn(message, error = null, req = null) {
    this.log('warn', message, error, req);
  }

  static info(message, req = null) {
    this.log('info', message, null, req);
  }

  static debug(message, req = null) {
    if (process.env.NODE_ENV === 'development') {
      this.log('debug', message, null, req);
    }
  }
}

// Error categorization
const ErrorTypes = {
  VALIDATION: 'VALIDATION_ERROR',
  AUTHENTICATION: 'AUTHENTICATION_ERROR',
  AUTHORIZATION: 'AUTHORIZATION_ERROR',
  NOT_FOUND: 'NOT_FOUND_ERROR',
  DATABASE: 'DATABASE_ERROR',
  EXTERNAL_API: 'EXTERNAL_API_ERROR',
  FILE_UPLOAD: 'FILE_UPLOAD_ERROR',
  RATE_LIMIT: 'RATE_LIMIT_ERROR',
  SERVER: 'SERVER_ERROR'
};

// Custom error classes
class AppError extends Error {
  constructor(message, statusCode, errorType = ErrorTypes.SERVER, isOperational = true) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.errorType = errorType;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();

    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, details = []) {
    super(message, 400, ErrorTypes.VALIDATION);
    this.details = details;
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, ErrorTypes.AUTHENTICATION);
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Insufficient permissions') {
    super(message, 403, ErrorTypes.AUTHORIZATION);
  }
}

class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, ErrorTypes.NOT_FOUND);
  }
}

class DatabaseError extends AppError {
  constructor(message = 'Database operation failed') {
    super(message, 500, ErrorTypes.DATABASE);
  }
}

// Error response formatter
const formatErrorResponse = (error, req) => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  const baseResponse = {
    success: false,
    error: {
      type: error.errorType || ErrorTypes.SERVER,
      message: error.message,
      timestamp: error.timestamp || new Date().toISOString(),
      requestId: req.id || Math.random().toString(36).substr(2, 9)
    }
  };

  // Add additional details in development
  if (isDevelopment) {
    baseResponse.error.stack = error.stack;
    baseResponse.error.details = error.details;
  }

  // Add validation details if available
  if (error.errorType === ErrorTypes.VALIDATION && error.details) {
    baseResponse.error.validationErrors = error.details;
  }

  return baseResponse;
};

// Get user-friendly error message
const getUserFriendlyMessage = (error) => {
  const friendlyMessages = {
    [ErrorTypes.VALIDATION]: 'Please check your input and try again.',
    [ErrorTypes.AUTHENTICATION]: 'Please log in to continue.',
    [ErrorTypes.AUTHORIZATION]: 'You don\'t have permission to access this resource.',
    [ErrorTypes.NOT_FOUND]: 'The requested resource was not found.',
    [ErrorTypes.DATABASE]: 'We\'re experiencing technical difficulties. Please try again later.',
    [ErrorTypes.EXTERNAL_API]: 'External service is temporarily unavailable.',
    [ErrorTypes.FILE_UPLOAD]: 'File upload failed. Please check file size and format.',
    [ErrorTypes.RATE_LIMIT]: 'Too many requests. Please try again later.',
    [ErrorTypes.SERVER]: 'Something went wrong. Please try again later.'
  };

  return friendlyMessages[error.errorType] || friendlyMessages[ErrorTypes.SERVER];
};

// Main error handling middleware
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log the error
  Logger.error('Error occurred', err, req);

  // Handle specific error types
  if (err.name === 'ValidationError') {
    const message = 'Validation Error';
    const details = Object.values(err.errors).map(val => ({
      field: val.path,
      message: val.message
    }));
    error = new ValidationError(message, details);
  }

  if (err.name === 'CastError') {
    const message = 'Invalid ID format';
    error = new ValidationError(message);
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `${field} already exists`;
    error = new ValidationError(message);
  }

  if (err.name === 'JsonWebTokenError') {
    error = new AuthenticationError('Invalid token');
  }

  if (err.name === 'TokenExpiredError') {
    error = new AuthenticationError('Token expired');
  }

  if (err.type === 'entity.parse.failed') {
    error = new ValidationError('Invalid JSON format');
  }

  // Handle Multer errors
  if (err.name === 'MulterError') {
    let message = 'File upload error';
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'File too large';
    } else if (err.code === 'LIMIT_FILE_COUNT') {
      message = 'Too many files';
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      message = 'Unexpected file field';
    }
    error = new AppError(message, 400, ErrorTypes.FILE_UPLOAD);
  }

  // Handle rate limiting
  if (err.status === 429) {
    error = new AppError('Too many requests', 429, ErrorTypes.RATE_LIMIT);
  }

  // Default to server error if not operational
  if (!error.isOperational) {
    error = new AppError(
      'Something went wrong',
      500,
      ErrorTypes.SERVER
    );
  }

  // Send error response
  const statusCode = error.statusCode || 500;
  const response = formatErrorResponse(error, req);
  
  // Add user-friendly message for client
  response.error.userMessage = getUserFriendlyMessage(error);

  res.status(statusCode).json(response);
};

// 404 handler
const notFoundHandler = (req, res, next) => {
  const error = new NotFoundError(`Route ${req.originalUrl}`);
  next(error);
};

// Async error wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  Logger,
  ErrorTypes,
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  DatabaseError
};