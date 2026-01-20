import config from '../config/config.js';

const LogLevel = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
};

class Logger {
  constructor() {
    this.currentLevel = LogLevel[config.logLevel.toUpperCase()] || LogLevel.INFO;
  }

  /**
   * Format log message with timestamp and level
   */
  format(level, context, message, data) {
    const timestamp = new Date().toISOString();
    const dataStr = data ? ` ${JSON.stringify(data)}` : '';
    return `[${timestamp}] [${level}] [${context}]${dataStr} ${message}`;
  }

  error(context, message, data) {
    if (this.currentLevel >= LogLevel.ERROR) {
      console.error(this.format('ERROR', context, message, data));
    }
  }

  warn(context, message, data) {
    if (this.currentLevel >= LogLevel.WARN) {
      console.warn(this.format('WARN', context, message, data));
    }
  }

  info(context, message, data) {
    if (this.currentLevel >= LogLevel.INFO) {
      console.log(this.format('INFO', context, message, data));
    }
  }

  debug(context, message, data) {
    if (this.currentLevel >= LogLevel.DEBUG) {
      console.log(this.format('DEBUG', context, message, data));
    }
  }
}

export default new Logger();
