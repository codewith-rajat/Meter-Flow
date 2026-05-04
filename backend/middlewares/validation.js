import { ValidationError } from "../utils/errors.js";

// Validate request body
export const validateBody = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body);
    if (error) {
      return next(new ValidationError(error.details[0].message));
    }
    req.body = value;
    next();
  };
};

// Validate request query
export const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query);
    if (error) {
      return next(new ValidationError(error.details[0].message));
    }
    req.query = value;
    next();
  };
};

// Validate request params
export const validateParams = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.params);
    if (error) {
      return next(new ValidationError(error.details[0].message));
    }
    req.params = value;
    next();
  };
};

// Check authorization
export const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AuthenticationError());
    }

    if (roles.length > 0 && !roles.includes(req.user.role)) {
      return next(new AuthorizationError());
    }

    next();
  };
};

// Async error wrapper
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
