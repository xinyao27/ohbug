/**
 * request
 * 上报错误
 *
 * @param {Array} data
 * @private
 */
function report(data) {
  if (window.$OhbugConfig && window.$OhbugConfig.report) window.$OhbugConfig.report(data);
}

export default report;
