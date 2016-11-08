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
  _format(level, section, args) {
    let prefix = this._cluster + `[${util.formatDate()}] ${TIPS[level]} [${section}] `;
    return prefix + format(...args);
  }
  debug(...args) {
    if (LEVELS.DEBUG < this._level) {
      return;
    }
    this._write(LEVELS.DEBUG, args);
  }
  error(...args) {
    if (LEVELS.ERROR < this._level) {
      return;
    }
    if (args.length === 1 && typeof args[0] === 'string') {
      this._write(LEVELS.ERROR, [new Error(args[0])]);
    } else {
      this._write(LEVELS.ERROR, args);
    }
  }
  info(...args) {
    if (LEVELS.INFO < this._level) {
      return;
    }
    this._write(LEVELS.INFO, args);
  }
  warn(...args) {
    if (LEVELS.WARN < this._level) {
      return;
    }
    this._write(LEVELS.WARN, args);
  }
  sdebug(section, ...args) {
    if (LEVELS.DEBUG < this._level) {
      return;
    }
    this._swrite(LEVELS.DEBUG, section, args)
  }
  sinfo(section, ...args) {
    if (LEVELS.INFO < this._level) {
      return;
    }
    this._swrite(LEVELS.INFO, section, args)
  }
  serror(section, ...args) {
    if (LEVELS.ERROR < this._level) {
      return;
    }
    if (args.length === 1 && typeof args[0] === 'string') {
      this._swrite(LEVELS.ERROR, section, [new Error(args[0])]);
    } else {
      this._swrite(LEVELS.ERROR, section, args);
    }
  }
  swarn(section, ...args) {
    if (LEVELS.WARN < this._level) {
      return;
    }
    this._swrite(LEVELS.WARN, section, args)
  }
  _write(level, args) {
    this._swrite(level, 'all', args);
  }
  _swrite(level, section, args) {
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
