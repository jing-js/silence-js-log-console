'use strict';

const SilenceJS = require('silence-js');
const BaseLogger = SilenceJS.BaseLogger;

class ConsoleLogger extends BaseLogger {
  constructor(config) {
    super(config);
    this._resolve('ready');
  }
  _write(level, section, args) {
    if (args.length > 1 && _.isString(args[0])) {
      console.log(TIPS[level] + ':', util.format.apply(null, args));
    } else if (_.isString(args[0])) {
      console.log(TIPS[level] + ':', args[0]);
    } else {
      console.log.apply(console, args);
    }
  }
}

module.exports = ConsoleLogger;
