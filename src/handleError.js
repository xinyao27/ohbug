/**
 * handleError
 * 收集并 print 错误
 */

import getBaseInfo from './getBaseInfo';
import { debounce, print } from './util';
import report from './report';

// 储存所有报错信息
export const errorList = [];

// 发生错误一段时间后发送请求 防抖控制指定时间内只发送一次请求
const request = debounce(() => {
  print(errorList);
  report(errorList);
}, (window.$OhbugConfig && window.$OhbugConfig.delay) || 2000);

/**
 * handleError
 * 错误处理
 *
 * @param {Object} error
 * @private
 */
function handleError(error) {
  print(error);

  errorList.push({
    ...getBaseInfo(),
    ...error,
  });

  // 控制错误数量在指定条数以内
  const config = window.$OhbugConfig;
  if (
    config
    && config.error
    && (config.mode === 'immediately' || !config.mode)
    && errorList.length && errorList.length <= config.maxError
  ) {
    request();
  }
}

export default handleError;
