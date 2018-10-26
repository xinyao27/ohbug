/**
 * getBaseInfo
 * 获取用户名、ID、时间戳、其他自定义信息等
 *
 * @returns {Object}
 * @private
 */
function getBaseInfo() {
  const date = new Date();
  const time = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日${date.getHours()}时${date.getMinutes()}分${date.getSeconds()}秒`;
  let result = {
    time,
    userAgent: window.navigator.userAgent,
    url: window.location.href,
    title: document.title,
  };
  if (window.$OhbugConfig && window.$OhbugConfig.others) {
    result = {
      ...result,
      ...window.$OhbugConfig.others,
    };
  }
  return result;
}

export default getBaseInfo;
