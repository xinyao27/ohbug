import { print } from '../util';

// 判断 dev prod 环境
const reg = /^(https?:\/\/)?(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(.+)?$/;

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
    if (config && config.report) {
      if (typeof config.enabledDev === 'boolean') {
        const isDev = reg.test(window.location.host) || window.location.host.indexOf('localhost') > -1 || !window.location.host;
        if (config.enabledDev && isDev) {
          config.report(data);
        }
      } else if (Array.isArray(config.enabledDev) && config.enabledDev.length) {
        const iter = config.enabledDev.find(
          v => window.location.host && (v.indexOf(window.location.host) > -1),
        );
        if (!iter) config.report(data);
      } else {
        config.report(data);
      }
    }
  } catch (e) {
    print(`发送日志失败 errorInfo:${e}`);
  }
}

export default report;
