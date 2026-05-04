// API Roles
export const ROLES = {
  ADMIN: "admin",
  API_OWNER: "api_owner",
  CONSUMER: "consumer"
};

// User Plans
export const PLANS = {
  FREE: "free",
  PRO: "pro",
  ENTERPRISE: "enterprise"
};

// API Key Status
export const KEY_STATUS = {
  ACTIVE: "active",
  REVOKED: "revoked",
  EXPIRED: "expired"
};

// Billing Status
export const BILLING_STATUS = {
  PENDING: "pending",
  PAID: "paid",
  UNPAID: "unpaid",
  CANCELLED: "cancelled"
};

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  RATE_LIMITED: 429,
  INTERNAL_ERROR: 500
};

// Error Codes
export const ERROR_CODES = {
  MISSING_API_KEY: "MISSING_API_KEY",
  INVALID_API_KEY: "INVALID_API_KEY",
  API_KEY_NOT_ACTIVE: "API_KEY_NOT_ACTIVE",
  API_KEY_EXPIRED: "API_KEY_EXPIRED",
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
  INVALID_TOKEN: "INVALID_TOKEN",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INTERNAL_ERROR: "INTERNAL_ERROR"
};

// Rate Limiting
export const RATE_LIMIT = {
  REQUESTS_PER_MINUTE: 100,
  REQUESTS_PER_DAY: 10000,
  REQUESTS_PER_MONTH: 100000
};

// Billing
export const BILLING = {
  FREE_REQUESTS: 1000,
  PRICE_PER_REQUEST_PRO: 0.0005,
  PRICE_PER_REQUEST_ENTERPRISE: 0.0001,
  BILLING_CYCLE_DAYS: 30
};

// Time periods (in milliseconds)
export const TIME = {
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,
  MONTH: 30 * 24 * 60 * 60 * 1000,
  YEAR: 365 * 24 * 60 * 60 * 1000
};

export default {
  ROLES,
  PLANS,
  KEY_STATUS,
  BILLING_STATUS,
  HTTP_STATUS,
  ERROR_CODES,
  RATE_LIMIT,
  BILLING,
  TIME
};
