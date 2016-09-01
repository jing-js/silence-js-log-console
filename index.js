'use strict';

const format = require('util').format;
const util = require('silence-js-util');
const cluster = require('cluster');

const LEVELS = {
  NONE: 4,
  ERROR: 3,
  WARN: 2,
  INFO: 1,
  DEBUG: 0
};
const TIPS = ['[DEBUG]', '[INFO ]', '[WARN ]', '[ERROR]', '[NONE ]'];

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
    let prefix = (cluster.isWorker ? `[${cluster.worker.id}] ` : '') + `[${util.formatDate()}] ${TIPS[level]} `;
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
      consoleFnMap[level].call(console, (cluster.isWorker ? `[${cluster.worker.id}] ` : '') + `[${util.formatDate()}] ${TIPS[level]}`, ...args);
    } else {
      consoleFnMap[level].call(console, this._format(level, ...args));      
    }
  }
  access(method, code, duration, bytesRead, bytesWritten, user, ip, userAgent, url) {
    let ds = duration < 2000 ? duration + 'ms' : (duration / 1000 | 0) + 's';
    if (userAgent && userAgent.indexOf('"') >= 0) {
      userAgent = userAgent.replace(/\"/g, '\\"')
    }
    console.log((cluster.isWorker ? `[${cluster.worker.id}] ` : '') + `[${util.formatDate()}] [${code !== 0 && code < 1000 ? code : 200}] [${method}] [${ds}] [${bytesRead}] [${bytesWritten}] [${user ? user : '-'}] [${ip}] "${userAgent || ''}" ${url}`);
  }
}

module.exports = ConsoleLogger;
