const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m"
};

export class Logger {
  static log(message, data = null) {
    const timestamp = new Date().toISOString();
    console.log(`${colors.cyan}[${timestamp}]${colors.reset} ${message}`);
    if (data) console.log(data);
  }

  static info(message, data = null) {
    const timestamp = new Date().toISOString();
    console.log(`${colors.blue}ℹ [${timestamp}]${colors.reset} ${message}`);
    if (data) console.log(data);
  }

  static success(message, data = null) {
    const timestamp = new Date().toISOString();
    console.log(`${colors.green}✓ [${timestamp}]${colors.reset} ${message}`);
    if (data) console.log(data);
  }

  static warn(message, data = null) {
    const timestamp = new Date().toISOString();
    console.warn(`${colors.yellow}⚠ [${timestamp}]${colors.reset} ${message}`);
    if (data) console.warn(data);
  }

  static error(message, error = null) {
    const timestamp = new Date().toISOString();
    console.error(`${colors.red}✗ [${timestamp}]${colors.reset} ${message}`);
    if (error) console.error(error);
  }

  static debug(message, data = null) {
    if (process.env.DEBUG === "true") {
      const timestamp = new Date().toISOString();
      console.log(`${colors.cyan}🐛 [${timestamp}]${colors.reset} ${message}`);
      if (data) console.log(data);
    }
  }
}

// Create a new logger instance (for module-based logging)
export function createLogger(module) {
  return {
    log: (msg, data) => { console.log(`[${module}] ${msg}`); if (data) console.log(data); },
    info: (msg, data) => Logger.info(`[${module}] ${msg}`, data),
    success: (msg, data) => Logger.success(`[${module}] ${msg}`, data),
    warn: (msg, data) => Logger.warn(`[${module}] ${msg}`, data),
    error: (msg, data) => Logger.error(`[${module}] ${msg}`, data),
    debug: (msg, data) => Logger.debug(`[${module}] ${msg}`, data),
    http: (method, url, status) => console.log(`[HTTP] ${method} ${url} -> ${status}`)
  };
}

export default Logger;
