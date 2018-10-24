import { config } from './config';

/**
 * getErrorBaseInfo
 * 获取用户名、ID、时间戳、其他自定义信息等
 *
 * @returns {Object}
 * @private
 */
function getErrorBaseInfo() {
  const date = new Date();
  const time = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日${date.getHours()}时${date.getMinutes()}分${date.getSeconds()}秒`;
  let result = {
    time,
    userAgent: window.navigator.userAgent,
    url: window.location.href,
    title: document.title,
  };
  if (config().others) {
    result = {
      ...result,
      ...config().others,
    };
  }
  return result;
}

export default getErrorBaseInfo;
