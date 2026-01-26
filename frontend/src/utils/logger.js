/**
 * Professional Logging Service for Frontend
 * 
 * Provides structured logging with different levels (debug, info, warn, error)
 * and environment-aware behavior (development vs production).
 */

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  NONE: 4,
};

class Logger {
  constructor(context = 'App') {
    this.context = context;
    this.level = this.getLogLevel();
  }

  /**
   * Determine log level based on environment
   */
  getLogLevel() {
    const env = import.meta.env.MODE || 'development';
    
    // In production, only show warnings and errors
    if (env === 'production') {
      return LOG_LEVELS.WARN;
    }
    
    // In development, show everything
    return LOG_LEVELS.DEBUG;
  }

  /**
   * Format log message with timestamp and context
   */
  formatMessage(level, message, ...args) {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level}] [${this.context}]`;
    return [prefix, message, ...args];
  }

  /**
   * Check if log level should be displayed
   */
  shouldLog(level) {
    return LOG_LEVELS[level] >= this.level;
  }

  /**
   * Debug level logging - detailed information for debugging
   */
  debug(message, ...args) {
    if (this.shouldLog('DEBUG')) {
      console.log(...this.formatMessage('DEBUG', message, ...args));
    }
  }

  /**
   * Info level logging - general informational messages
   */
  info(message, ...args) {
    if (this.shouldLog('INFO')) {
      console.log(...this.formatMessage('INFO', message, ...args));
    }
  }

  /**
   * Warning level logging - warning messages
   */
  warn(message, ...args) {
    if (this.shouldLog('WARN')) {
      console.warn(...this.formatMessage('WARN', message, ...args));
    }
  }

  /**
   * Error level logging - error messages
   */
  error(message, ...args) {
    if (this.shouldLog('ERROR')) {
      console.error(...this.formatMessage('ERROR', message, ...args));
    }
  }

  /**
   * Create a child logger with a specific context
   */
  child(childContext) {
    return new Logger(`${this.context}:${childContext}`);
  }
}

/**
 * Create a logger instance for a specific module
 * @param {string} context - The context/module name (e.g., 'ChatService', 'CaseDetail')
 * @returns {Logger} Logger instance
 */
export function createLogger(context) {
  return new Logger(context);
}

// Default logger instance
export const logger = new Logger('App');

export default logger;

