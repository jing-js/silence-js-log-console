'use strict';

const format = require('util').format;
const cluster = require('cluster');

const LEVELS = {
  NONE: 4,
  ERROR: 3,
  WARN: 2,
  INFO: 1,
  DEBUG: 0
};
const TIPS = ['[DEBUG]', '[INFO ]', '[WARN ]', '[ERROR]', '[NONE ]'];

// 不清楚琐碎的数字到字符串格式化对性能是否有影响。反正先生成好放那儿, 也占不了多少内存。
const PAD_2_NUMS = (new Array(100).fill(0).map((n, i) => pad(i)));
const PAD_3_NUMS = (new Array(1000).fill(0).map((n, i) => pad3(i)));
const TIME_ZONE = (function () {
  let to = (new Date()).getTimezoneOffset();
  let tn = to < 0;
  to = to < 0 ? -to : to;
  let th = (to / 60) | 0;
  let tm = (to - th * 60);
  return ` GMT${tn ? '+' : '-'}${pad(th)}${pad(tm)}`
})();

function pad(n) {
  return n < 10 ? '0' + n : n.toString();
}

function pad3(n) {
  return n < 10 ? '00' + n : (n < 100 ? '0' + n : n.toString());
}

function formatDate(date) {
  date = date ? date : new Date();
  return `${date.getFullYear()}/${PAD_2_NUMS[date.getMonth()+1]}/${PAD_2_NUMS[date.getDate()]} ${PAD_2_NUMS[date.getHours()]}:${PAD_2_NUMS[date.getMinutes()]}:${PAD_2_NUMS[date.getSeconds()]}.${PAD_3_NUMS[date.getMilliseconds()]}${TIME_ZONE}`;
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
    let prefix = (cluster.isWorker ? `[${cluster.worker.id}] ` : '') + `[${formatDate()}] ${TIPS[level]} `;
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
      consoleFnMap[level].call(console, (cluster.isWorker ? `[${cluster.worker.id}] ` : '') + `[${formatDate()}] ${TIPS[level]}`, ...args);
    } else {
      consoleFnMap[level].call(console, this._format(level, ...args));      
    }
  }
  access(method, code, duration, ip, url) {
    console.log((cluster.isWorker ? `[${cluster.worker.id}] ` : '') + `[${formatDate()}] [${code !== 0 && code < 1000 ? code : 200}] [${method}] [${duration}ms] [${ip}] ${url}\n`);
  }
}

module.exports = ConsoleLogger;
