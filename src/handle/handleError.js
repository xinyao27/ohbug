import { isEqual } from 'lodash';
import getBaseInfo from '../info/getBaseInfo';
import { debounce, print } from '../util';
import report from './report';

// 储存所有报错信息
export const errorList = [];

// 发生错误一段时间后发送请求 防抖控制指定时间内只发送一次请求
const request = delay => debounce(() => {
  print(errorList);
  report(errorList);
}, delay).call();

/**
 * handleError
 * 错误处理
 *
 * @param {Object} error
 * @private
 */
function handleError(error) {
  print(error);

  if (errorList.length) {
    // 防止重复上报
    errorList.forEach((e) => {
      if (!(isEqual(error.desc, e.desc))) {
        errorList.push({
          ...getBaseInfo(),
          ...error,
        });
      }
    });
  } else {
    errorList.push({
      ...getBaseInfo(),
      ...error,
    });
  }

  // 控制错误数量在指定条数以内
  const config = window.$OhbugConfig;
  if (
    config
    && config.error
    && (config.mode === 'immediately' || !config.mode)
    && errorList.length && errorList.length <= config.maxError
  ) {
    request((config && config.delay) || 2000);
  }
}

export default handleError;
