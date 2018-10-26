import { getError, caughtError, reportError } from './getError';
import getHttpRequestError from './getHttpRequestError';

function privateInit() {
  /**
   * 可捕获语法错误和网络错误 无法捕获 Promise 错误
   * @param {String}  msg    错误信息
   * @param {String}  url    出错文件
   * @param {Number}  row    行号
   * @param {Number}  col    列号
   * @param {Object}  error  错误详细信息
   */
  window.addEventListener && window.addEventListener('error', (e) => {
    getError({
      type: 'default',
      e,
    });
  }, true);

  /**
   * 可捕获 Promise 错误
   * react render 内发生 `Cannot read property 'xxx' of undefined` 可从此处捕获到
   */
  window.addEventListener && window.addEventListener('unhandledrejection', (e) => {
    e.preventDefault();
    getError({
      type: 'promise',
      e,
    });
  }, true);

  // ajax/fetch Error
  getHttpRequestError();
}

function Ohbug() {
}

Ohbug.init = function (conf) {
  if (window) {
    window.$OhbugAuth = true;
    if (!window.$OhbugConfig) {
      window.$OhbugConfig = {
        delay: 2000, // 错误处理间隔时间
        enabledDev: false, // 开发环境下上传错误
      };
    }
    if (conf) {
      window.$OhbugConfig = {
        ...window.$OhbugConfig,
        ...conf,
      };
    }
    if (window.$OhbugAuth) privateInit();
  } else {
    console.error('检测到当前环境不支持 Ohbug！');
  }
};

Ohbug.caughtError = caughtError;
Ohbug.reportError = reportError;

export default Ohbug;
