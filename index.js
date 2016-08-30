'use strict';

const format = require('util').format;

const LEVELS = {
  NONE: 4,
  ERROR: 3,
  WARN: 2,
  INFO: 1,
  DEBUG: 0
};
const TIPS = ['[DEBUG]', '[INFO ]', '[WARN ]', '[ERROR]', '[NONE ]'];

function formatDate(date) {
  function fn(n) {
    return n < 10 ? '0' + n : n.toString()
  }
  function fm(n) {
    return n < 10 ? '00' + n : (n < 100 ? '0' + n : n.toString());
  }
  date = date ? date : new Date();
  return `${date.getFullYear()}/${fn(date.getMonth()+1)}/${fn(date.getDate())} ${fn(date.getHours())}:${fn(date.getMinutes())}:${fn(date.getSeconds())}.${fm(date.getMilliseconds())}`;
}

const consoleFnMap = {
  [LEVELS.INFO]: console.log,
  [LEVELS.WARN]: console.warn,
  [LEVELS.ERROR]: console.error,
  [LEVELS.DEBUG]: console.log
}
class ConsoleLogger {
  constructor(config) {
    this.level = LEVELS[(config.level || 'ERROR').toUpperCase()];
  }
  init() {
    return Promise.resolve();
  }
  close() {
    return Promise.resolve();
  }
  _log(level, ...args) {
    if (level < this.level) {
      return;
    }
    this._write(level, ...args);
  }
  _format(level, ...args) {
    let prefix = `[${formatDate()}] ${TIPS[level]} `;
    return prefix + format(...args);
  }
  log(...args) {
    this._log(LEVELS.INFO, ...args);
  }
  debug(...args) {
    this._log(LEVELS.DEBUG, ...args);
  }
  error(...args) {
    this._log(LEVELS.ERROR, ...args);
  }
  info(...args) {
    this._log(LEVELS.INFO, ...args);
  }
  warn(...args) {
    this._log(LEVELS.WARN, ...args);
  }
  _write(level, ...args) {
    if (args.length === 0) {
      return;
    }
    if (typeof args[0] !== 'string') {
      consoleFnMap[level].call(console, `[${formatDate()}] [${TIPS[level]}]`, ...args); 
    } else {
      consoleFnMap[level].call(console, this._format(level, ...args));      
    }
  }
  access(method, code, duration, ip, url) {
    console.log(`[${formatDate()}] [${code !== 0 && code < 1000 ? code : 200}] [${method}] [${duration}ms] [${ip}] ${url}\n`);
  }
}

module.exports = ConsoleLogger;
