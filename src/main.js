import { getError, caughtError, reportError } from './getError';
import getHttpRequestError from './getHttpRequestError';
import report from './report';
import { errorList } from './handleError';

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

  /**
   * 文档卸载前执行发送日志操作
   */
  if (window.$OhbugConfig && (window.$OhbugConfig.mode === 'beforeunload')) {
    window.addEventListener && window.addEventListener('unload', () => {
      if (errorList.length && errorList.length <= window.$OhbugConfig.maxError) {
        report(errorList);
      }
    });
  }
}

function Ohbug() {
}

Ohbug.init = function (conf) {
  if (window) {
    window.$OhbugAuth = true;
    if (!window.$OhbugConfig) {
      // default config
      window.$OhbugConfig = {
        delay: 2000, // 错误处理间隔时间
        report() {}, // 上报错误的方法
        enabledDev: false, // 开发环境下上传错误
        maxError: 10, // 最大上传错误数量
        mode: 'immediately', // 短信发送模式 immediately 立即发送 beforeunload 页面注销前发送
        ignore: [], // 忽略指定错误 目前只支持忽略 HTTP 请求错误
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
