import { config } from './config';

/**
 * request
 * 上报错误
 *
 * @param {Array} data
 * @private
 */
function report(data) {
  if (config().report) config().report(data);
}

export default report;
