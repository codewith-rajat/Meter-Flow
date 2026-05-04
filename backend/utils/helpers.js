// Response formatter utility
export const successResponse = (data, message = "Success") => {
  return {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  };
};

export const errorResponse = (message, code = "ERROR", statusCode = 500) => {
  return {
    success: false,
    error: message,
    code,
    statusCode,
    timestamp: new Date().toISOString()
  };
};

// Pagination helper
export const getPaginationParams = (page = 1, limit = 10) => {
  const skip = (Math.max(1, page) - 1) * limit;
  return { skip, limit: Math.min(limit, 100) };
};

// Date utilities
export const getDateRange = (period = "month") => {
  const end = new Date();
  const start = new Date();

  switch (period) {
    case "day":
      start.setDate(start.getDate() - 1);
      break;
    case "week":
      start.setDate(start.getDate() - 7);
      break;
    case "month":
      start.setMonth(start.getMonth() - 1);
      break;
    case "year":
      start.setFullYear(start.getFullYear() - 1);
      break;
    default:
      start.setMonth(start.getMonth() - 1);
  }

  return { start, end };
};

export const getMonthRange = (year, month) => {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  return { start, end };
};

// Validation helpers
export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validateUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const validateApiKey = (key) => {
  return typeof key === "string" && key.length >= 32;
};

// HTTP response helpers
export const handleResponse = (res, message, data = null, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    statusCode
  });
};

export const handleError = (res, message, statusCode = 500, code = "ERROR") => {
  return res.status(statusCode).json({
    success: false,
    message,
    code,
    statusCode
  });
};

