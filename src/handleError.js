import getErrorBaseInfo from './getErrorBaseInfo';
import { debounce, print } from './util';
import report from './report';

// 判断 dev prod 环境
const isDev = window.location.host.indexOf('127.0.0.1') > -1 || window.location.host.indexOf('localhost') > -1;

// 储存所有报错信息
const errorList = [];

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
    ...getErrorBaseInfo(),
    ...error,
  });

  // 短时间内多次触发 只发送最终结果
  const request = debounce(() => {
    print(errorList);
    !isDev && report(errorList);
  }, (window.$OhbugConfig && window.$OhbugConfig.delay) || 2000);
  errorList.length && request();
}

export default handleError;
