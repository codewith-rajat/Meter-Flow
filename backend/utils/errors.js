// Custom error classes
export class AppError extends Error {
  constructor(message, statusCode = 500, code = "ERROR") {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.timestamp = new Date().toISOString();
  }
}

export class ValidationError extends AppError {
  constructor(message) {
    super(message, 400, "VALIDATION_ERROR");
  }
}

export class AuthenticationError extends AppError {
  constructor(message = "Authentication failed") {
    super(message, 401, "AUTHENTICATION_ERROR");
  }
}

export class AuthorizationError extends AppError {
  constructor(message = "Not authorized") {
    super(message, 403, "AUTHORIZATION_ERROR");
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(message, 404, "NOT_FOUND");
  }
}

export class ConflictError extends AppError {
  constructor(message) {
    super(message, 409, "CONFLICT");
  }
}

export class RateLimitError extends AppError {
  constructor(message = "Rate limit exceeded", resetAt = new Date()) {
    super(message, 429, "RATE_LIMIT_EXCEEDED");
    this.resetAt = resetAt;
  }
}

// Error handler middleware
export const errorHandler = (err, req, res, next) => {
  console.error("Error:", err);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
      code: err.code,
      timestamp: err.timestamp
    });
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      error: "Validation failed",
      code: "VALIDATION_ERROR",
      details: err.message
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      error: "Duplicate entry",
      code: "DUPLICATE_ENTRY",
      field: Object.keys(err.keyPattern)[0]
    });
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      error: "Invalid token",
      code: "INVALID_TOKEN"
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      error: "Token expired",
      code: "TOKEN_EXPIRED"
    });
  }

  // Default error
  res.status(500).json({
    success: false,
    error: err.message || "Internal server error",
    code: "INTERNAL_SERVER_ERROR"
  });
};
