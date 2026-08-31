/**
 * 日志工具模块
 */

export const LogLevels = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARNING: 'WARNING',
  ERROR: 'ERROR',
  SUCCESS: 'SUCCESS'
};

const colors = {
  DEBUG: '\x1b[90m',  // 灰色
  INFO: '\x1b[36m',   // 青色
  WARNING: '\x1b[33m', // 黄色
  ERROR: '\x1b[31m',  // 红色
  SUCCESS: '\x1b[32m', // 绿色
  RESET: '\x1b[0m'
};

export function log(message, level = LogLevels.INFO) {
  const timestamp = new Date().toISOString();
  const color = colors[level] || colors.INFO;
  const reset = colors.RESET;
  const prefix = `${color}[${timestamp}] [${level}]${reset}`;
  console.log(`${prefix} ${message}`);
}

export function debug(message) {
  if (process.env.DEBUG === 'true') {
    log(message, LogLevels.DEBUG);
  }
}

export function info(message) {
  log(message, LogLevels.INFO);
}

export function warning(message) {
  log(message, LogLevels.WARNING);
}

export function error(message) {
  log(message, LogLevels.ERROR);
}

export function success(message) {
  log(message, LogLevels.SUCCESS);
}
