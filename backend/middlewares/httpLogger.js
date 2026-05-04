import { createLogger } from '../utils/logger.js';

const logger = createLogger('HTTPLogger');

// Middleware to log incoming requests
export const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log request
  logger.http(
    req.method,
    `${req.protocol}://${req.get('host')}${req.originalUrl}`,
    null
  );

  // Intercept response to log it
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;
    
    // Color code based on status
    let statusLabel = '';
    if (statusCode >= 500) {
      statusLabel = '❌ ERROR';
    } else if (statusCode >= 400) {
      statusLabel = '⚠️  CLIENT_ERROR';
    } else if (statusCode >= 300) {
      statusLabel = '↪️  REDIRECT';
    } else {
      statusLabel = '✓ SUCCESS';
    }

    logger.debug(
      `${statusLabel} ${req.method} ${req.path} - ${statusCode} (${duration}ms)`,
      {
        method: req.method,
        path: req.path,
        statusCode,
        duration: `${duration}ms`,
        userId: req.user?.userId || 'anonymous'
      }
    );

    // Log request body (for POST/PUT/PATCH)
    if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
      logger.debug('Request Body:', sanitizeData(req.body));
    }

    // Call original send
    return originalSend.call(this, data);
  };

  next();
};

// Sanitize sensitive data from logs
const sanitizeData = (data) => {
  if (!data || typeof data !== 'object') return data;

  const sensitiveFields = ['password', 'token', 'refreshToken', 'key', 'secret', 'apiKey'];
  const sanitized = JSON.parse(JSON.stringify(data));

  const sanitizeObject = (obj) => {
    for (const key in obj) {
      if (sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
        obj[key] = '***REDACTED***';
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitizeObject(obj[key]);
      }
    }
  };

  sanitizeObject(sanitized);
  return sanitized;
};

// Middleware for error logging
export const errorLogger = (err, req, res, next) => {
  logger.error(`[${req.method}] ${req.path}`, {
    error: err.message,
    stack: err.stack,
    statusCode: err.statusCode || 500,
    userId: req.user?.userId || 'anonymous'
  });

  next(err);
};

// Performance monitoring middleware
export const performanceLogger = (req, res, next) => {
  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const end = process.hrtime.bigint();
    const duration = Number(end - start) / 1000000; // Convert to milliseconds

    if (duration > 1000) {
      logger.warn(`Slow request detected`, {
        method: req.method,
        path: req.path,
        duration: `${duration.toFixed(2)}ms`,
        statusCode: res.statusCode
      });
    }
  });

  next();
};

export default {
  requestLogger,
  errorLogger,
  performanceLogger
};
