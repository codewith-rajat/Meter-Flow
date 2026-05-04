// Form validation rules
export const validationRules = {
  email: {
    required: 'Email is required',
    pattern: {
      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: 'Please enter a valid email'
    }
  },
  password: {
    required: 'Password is required',
    minLength: {
      value: 6,
      message: 'Password must be at least 6 characters'
    }
  },
  confirmPassword: {
    required: 'Please confirm your password',
    validate: (value, watch) => value === watch('password') || 'Passwords do not match'
  },
  name: {
    required: 'Name is required',
    minLength: {
      value: 2,
      message: 'Name must be at least 2 characters'
    }
  },
  apiName: {
    required: 'API name is required',
    minLength: {
      value: 2,
      message: 'API name must be at least 2 characters'
    }
  },
  baseUrl: {
    required: 'Base URL is required',
    pattern: {
      value: /^https?:\/\/.+/,
      message: 'Please enter a valid URL (http:// or https://)'
    }
  }
};

// Custom validators
export const validators = {
  isValidEmail: (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  },

  isValidUrl: (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  isValidPassword: (password) => {
    return password && password.length >= 6;
  },

  isStrongPassword: (password) => {
    const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return strongRegex.test(password);
  }
};
