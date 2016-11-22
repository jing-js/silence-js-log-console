'use strict';

const util = require('silence-js-util');
const LEVELS = {
  NONE: 6,
  ACTION: 5,
  ACCESS: 4,
  ERROR: 3,
  WARN: 2,
  INFO: 1,
  DEBUG: 0
};
const TIPS = ['[DEBUG]', '[INFO ]', '[WARN ]', '[ERROR]', '[ACCES]', '[ACT  ]'];
const LEVEL_NAMES = ['DEBUG', 'INFO', 'WARN', 'ERROR', 'ACCESS', 'ACTION', 'NONE'];


class ConsoleLogger {
  constructor(config) {
    this._level = LEVELS[(config.level || 'ERROR').toUpperCase()];
    this._cluster = config.cluster > -2 ? `[${config.cluster === -1 ? 'MASTER' : 'W_' + config.cluster}] ` : '';
    this._stat = config.stat !== false;
    this._counts = LEVEL_NAMES.map(n => 0);
    this._scounts = LEVEL_NAMES.map(n => new Map());
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

  __collectStatus() {
    return {
      type: 'console',
      counts: this._counts,
      scounts: this._scounts.map(m => {
        let it = m.entries();
        let n = it.next();
        let s = {};
        while(!n.done && n.value && n.value.length === 2) {
          s[n.value[0]] = n.value[1];
          n = it.next();
        }
        return s;
      })
    };
  }

  init() {
    return Promise.resolve();
  }
  close() {
    return Promise.resolve();
  }
  _format(level, section, args, ts) {
    let prefix = this._cluster + `[${util.formatDate(ts ? new Date(ts) : undefined)}] ${TIPS[level]} [${section}] `;
    return prefix + (level === LEVELS.ERROR ? util.formatError(args) : util.formatArray(args));
  }
  debug(...args) {
    if (LEVELS.DEBUG < this._level) {
      return;
    }
    this._write(LEVELS.DEBUG, args);
  }
  error(err) {
    if (LEVELS.ERROR < this._level) {
      return;
    }
    this._write(LEVELS.ERROR, err);
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
  action(userId, act, params) {
    if (LEVELS.ACTION < this._level || !userId) {
      return;
    }
    this._stat && this._counts[LEVELS.ACTION]++;
    let msg = `[${util.formatDate()}] ${TIPS[LEVELS.ACTION]} [${userId}] [${act}] ` + (params ? JSON.stringify(params) : '');
    console.log(msg);
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
  serror(section, err) {
    if (LEVELS.ERROR < this._level) {
      return;
    }
    this._swrite(LEVELS.ERROR, section, err);
  }
  swarn(section, ...args) {
    if (LEVELS.WARN < this._level) {
      return;
    }
    this._swrite(LEVELS.WARN, section, args)
  }
  _write(level, args, ts) {
    this._stat && this._counts[level]++;
    console.log(this._format(level, 'all', args, ts));
  }
  _swrite(level, section, args, ts) {
    if (this._stat) {
      let mp = this._scounts[level];
      if (mp.has(section)) {
        mp.set(section, mp.get(section) + 1);
      } else {
        mp.set(section, 1);
      }
    }
    console.log(this._format(level, section, args, ts));
  }
  access(method, code, duration, bytesRead, bytesWritten, user, clientIp, remoteIp, userAgent, url) {
    if (this._level === LEVELS.NONE) {
      return;
    }
    let ds = duration < 2000 ? duration + 'ms' : (duration / 1000 | 0) + 's';
    if (userAgent && userAgent.indexOf('"') >= 0) {
      userAgent = userAgent.replace(/\"/g, '\\"')
    }
    this._stat && this._counts[LEVELS.ACCESS]++;
    console.log(this._cluster + `[${util.formatDate()}] ${TIPS[LEVELS.ACCESS]} [${code !== 0 && code < 1000 ? code : 200}] [${method}] [${ds}] [${bytesRead}] [${bytesWritten}] [${user ? user : '-'}] [${clientIp || '-'}] [${remoteIp || '-'}] "${userAgent || '-'}" ${url}`);
  }
}

module.exports = ConsoleLogger;
