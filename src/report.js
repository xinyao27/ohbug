import { print } from './util';

/**
 * request
 * 上报错误
 *
 * @param {Array} data
 * @private
 */
function report(data) {
  try {
    if (window.$OhbugConfig && window.$OhbugConfig.report) window.$OhbugConfig.report(data);
  } catch (e) {
    print(`发送日志失败 errorInfo:${e}`);
  }
}

export default report;
