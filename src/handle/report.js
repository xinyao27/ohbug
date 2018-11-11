import { print } from '../util';

// 判断 dev prod 环境
const reg = /^(https?:\/\/)?(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(.+)?$/;
const isDev = reg.test(window.location.host) || window.location.host.indexOf('localhost') > -1;

/**
 * request
 * 上报
 *
 * @param {Array} data
 * @private
 */
function report(data) {
  try {
    const config = window.$OhbugConfig;
    if (isDev) {
      if (config && config.enabledDev && config.report) {
        config.report(data);
      }
    } else {
      config && config.report && config.report(data);
    }
  } catch (e) {
    print(`发送日志失败 errorInfo:${e}`);
  }
}

export default report;
