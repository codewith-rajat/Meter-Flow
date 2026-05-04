export const config = {
  app: {
    name: process.env.APP_NAME || "MeterFlow",
    env: process.env.NODE_ENV || "development",
    port: process.env.PORT || 5000,
    url: process.env.APP_URL || "http://localhost:5000"
  },

  database: {
    mongoUri: process.env.MONGO_URI || "mongodb://localhost:27017/meterflow"
  },

  jwt: {
    secret: process.env.JWT_SECRET || "your_jwt_secret_key_change_in_production",
    refreshSecret: process.env.JWT_REFRESH_SECRET || "your_refresh_secret_key_change_in_production",
    expiresIn: "7d",
    refreshExpiresIn: "30d"
  },

  redis: {
    host: process.env.REDIS_HOST || "localhost",
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD,
    enabled: process.env.REDIS_ENABLED !== "false"
  },

  gateway: {
    defaultTargetUrl: process.env.DEFAULT_TARGET_URL || "https://jsonplaceholder.typicode.com",
    timeout: 30000,
    maxRedirects: 5
  },

  billing: {
    freeTierRequests: 1000,
    pricePerRequestPro: 0.0005,
    pricePerRequestEnterprise: 0.0001,
    billingCycleDays: 30
  },

  rateLimit: {
    requestsPerMinute: 100,
    requestsPerDay: 10000
  },

  logging: {
    level: process.env.LOG_LEVEL || "info",
    debug: process.env.DEBUG === "true"
  },

  email: {
    service: process.env.EMAIL_SERVICE,
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASSWORD
  },

  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY
  },

  webhook: {
    url: process.env.WEBHOOK_URL
  }
};

export default config;
