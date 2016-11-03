'use strict';

const format = require('util').format;
const util = require('silence-js-util');
const LEVELS = {
  NONE: 5,
  ACCESS: 4,
  ERROR: 3,
  WARN: 2,
  INFO: 1,
  DEBUG: 0
};
const TIPS = ['[DEBUG]', '[INFO ]', '[WARN ]', '[ERROR]', '[ACCES]'];
const LEVEL_NAMES = ['DEBUG', 'INFO', 'WARN', 'ERROR', 'ACCESS', 'NONE'];

const consoleFnMap = {
  [LEVELS.INFO]: console.log,
  [LEVELS.WARN]: console.warn,
  [LEVELS.ERROR]: console.error,
  [LEVELS.DEBUG]: console.log
}
class ConsoleLogger {
  constructor(config) {
    this._level = LEVELS[(config.level || 'ERROR').toUpperCase()];
    this._cluster = config.cluster > -2 ? `[${config.cluster === -1 ? 'MASTER' : 'W_' + config.cluster}] ` : '';
  }
  get level() {
    return LEVEL_NAMES[this._level];
  }

  get isReady() {
    return true;
  }

  get isClosed() {
    return false;
  }

  init() {
    return Promise.resolve();
  }
  close() {
    return Promise.resolve();
  }
  _log(level, section, args) {
    if (level < this._level) {
      return;
    }
    this._write(level, section.toUpperCase(), args);
  }
  _format(level, section, args) {
    let prefix = this._cluster + `[${util.formatDate()}] ${TIPS[level]} [${section}] `;
    return prefix + format.apply(null, args);
  }
  debug(...args) {
    this._log(LEVELS.DEBUG, 'all', args);
  }
  error(...args) {
    this._log(LEVELS.ERROR, 'all', args);
  }
  info(...args) {
    this._log(LEVELS.INFO, 'all', args);
  }
  warn(...args) {
    this._log(LEVELS.WARN, 'all', args);
  }
  sdebug(section, ...args) {
    this._log(LEVELS.DEBUG, section, args)
  }
  sinfo(section, ...args) {
    this._log(LEVELS.INFO, section, args)
  }
  serror(section, ...args) {
    this._log(LEVELS.ERROR, section, args)
  }
  swarn(section, ...args) {
    this._log(LEVELS.WARN, section, args)
  }
  _write(level, section, args) {
    if (args.length === 0) {
      return;
    }
    consoleFnMap[level].call(console, this._format(level, section, args));
  }
  access(method, code, duration, bytesRead, bytesWritten, user, clientIp, remoteIp, userAgent, url) {
    if (this._level === LEVELS.NONE) {
      return;
    }
    let ds = duration < 2000 ? duration + 'ms' : (duration / 1000 | 0) + 's';
    if (userAgent && userAgent.indexOf('"') >= 0) {
      userAgent = userAgent.replace(/\"/g, '\\"')
    }
    console.log(this._cluster + `[${util.formatDate()}] ${TIPS[LEVELS.ACCESS]} [${code !== 0 && code < 1000 ? code : 200}] [${method}] [${ds}] [${bytesRead}] [${bytesWritten}] [${user ? user : '-'}] [${clientIp || '-'}] [${remoteIp || '-'}] "${userAgent || '-'}" ${url}`);
  }
}

module.exports = ConsoleLogger;
