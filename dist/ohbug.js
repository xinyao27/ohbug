(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global.Ohbug = factory());
}(this, (function () { 'use strict';

  const CAUGHT_ERROR = 'caughtError'; // 调用 caughtError 装饰器主动捕获的错误
  const UNCAUGHT_ERROR = 'uncaughtError'; // 意料之外的错误
  const RESOURCE_ERROR = 'resourceError'; // 资源加载错误
  const GRAMMAR_ERROR = 'grammarError'; // 语法错误
  const PROMISE_ERROR = 'promiseError'; // promise 错误，可能包含 render 等错误
  const AJAX_ERROR = 'ajaxError'; // ajax 错误
  const FETCH_ERROR = 'fetchError'; // fetch 错误
  const REPORT_ERROR = 'reportError'; // 主动上报的错误

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
    if (window.$OhbugConfig && window.$OhbugConfig.others) {
      result = {
        ...result,
        ...window.$OhbugConfig.others,
      };
    }
    return result;
  }

  /**
   * debounce
   *
   * @param   {Function}  func
   * @param   {Number}    delay
   * @returns {Function}
   * @private
   */
  let timer;
  function debounce(func, delay) {
    return function () {
      const context = this;
      const args = arguments;

      timer && clearTimeout(timer);

      timer = setTimeout(() => {
        func.apply(context, args);
      }, delay);
    };
  }

  function print(info) {
    const LOG_ERROR = {
      msg: 'error',
      style: 'background: #d9634d; color: #fff; padding: 2px 4px; border-radius: 2px',
    };

    console.log(`%c${LOG_ERROR.msg}`, LOG_ERROR.style, info);
  }

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

  /**
   * getError
   * uncaughtError
   *
   * @param   {String}    type    错误类型 分为一般错误和未catch的promise错误
   * @param   {Object}    e       错误对象
   * @returns {boolean}
   * @private
   */
  function getError({ type, e }) {
    try {
      if (type === 'default') {
        const {
          message: msg, filename, lineno: row, colno: col, error,
        } = e;
        if (msg) {
          if (error) {
            // 在 react 内 一般会捕获到语法错误导致的 react-dom 渲染错误
            const message = {
              type: UNCAUGHT_ERROR,
              desc: {
                message: msg,
                filename,
                row,
                col,
                error: (error.stack || error),
              },
            };
            handleError(message);
          }
        } else {
          const immutableTarget = e.target || e.srcElement;
          let target = e.target || e.srcElement;
          if (immutableTarget) {
            // resourceError
            const { outerHTML } = immutableTarget;
            const selector = (function () {
              // 获取出错元素在同级元素的 index
              // 储存错误元素前元素
              const elements = [];
              for (
                let i = 0;
                target
                && target.nodeType === Node.ELEMENT_NODE
                && target.nodeType !== Node.DOCUMENT_TYPE_NODE;
                target = target.previousSibling
              ) {
                i && elements.push(target);
                i += 1;
              }
              return e && e.path.reverse()
                .map(node => (node.localName || '')
                  + (node.id ? `#${node.id}` : '')
                  + (node.className ? `.${node.className}` : '')
                  + (node.outerHTML === outerHTML ? `:nth-child(${elements.length})` : ''))
                .filter(v => v)
                .join(' > ');
            }());
            const message = {
              type: RESOURCE_ERROR,
              desc: {
                outerHTML,
                src: immutableTarget && immutableTarget.src,
                tagName: immutableTarget && immutableTarget.tagName,
                id: immutableTarget && immutableTarget.id,
                className: immutableTarget && immutableTarget.className,
                name: immutableTarget && immutableTarget.name,
                type: immutableTarget && immutableTarget.type,
                selector,
                timeStamp: e.timeStamp,
              },
            };
            handleError(message);
          } else if (typeof e === 'string') {
            const message = {
              type: GRAMMAR_ERROR,
              desc: e,
            };
            handleError(message);
          }
        }
      } else if (type === 'promise') {
        // 捕获没有 catch 的 Promise 错误
        const message = {
          type: PROMISE_ERROR,
          desc: {
            message: e.reason.message || e.reason,
            error: e.reason.stack || e.reason,
          },
        };
        handleError(message);
      }
      return false;
    } catch (err) {
      handleError(err);
    }
  }

  // 使用装饰器 用于单独捕获错误
  const caughtError = (target, name, descriptor) => {
    if (window.$OhbugAuth) {
      if (typeof descriptor.value === 'function') {
        /**
         * 捕获 `class` 内方法错误
         * class Math {
         *    @log  // Decorator
         *    plus(a, b) {
         *      return a + b;
         *    }
         *  }
         */
        return {
          ...descriptor,
          value() {
            try {
              return descriptor.value && descriptor.value.apply(this, arguments);
            } catch (e) {
              // 此处可捕获到方法内的错误 上报错误
              const message = {
                type: CAUGHT_ERROR,
                desc: {
                  method: name,
                  params: arguments,
                  error: e.stack || e,
                },
              };
              handleError(message);
              throw e;
            }
          },
        };
      }
      if (typeof descriptor.initializer === 'function') {
        /**
         * 捕获 `class` 内 `arrow function method` 错误
         * class Math {
         *    @log  // Decorator
         *    plus = (a, b) => {
         *      return a + b;
         *    }
         *  }
         */
        return {
          enumerable: true,
          configurable: true,
          get() {
            // `arrow function method` 由于是箭头函数没有 `arguments` 所以获取不到参数
            // 捕获不到异常 只能靠全局捕获 建议不要使用 `arrow function method`
            return descriptor.initializer && descriptor.initializer.apply(this);
          },
        };
      }
    } else {
      console.error('检测到未执行 Ohbug.init()');
    }
  };

  // 用于上报自定义错误
  const reportError = (error) => {
    if (window.$OhbugAuth) {
      const message = {
        type: REPORT_ERROR,
        desc: error,
      };
      handleError(message);
    } else {
      console.error('检测到未执行 Ohbug.init()');
    }
  };

  /**
   * getHttpRequestError
   * ajax/fetch Error
   *
   * @private
   */
  function getHttpRequestError() {
    // 通过封装原生 Ajax/Fetch 请求，捕获错误信息
    if (window.XMLHttpRequest) {
      const AJAX = {
        // 记录请求的 url
        reqUrl: '',
        // 记录请求的方法
        reqMethod: '',
        // 保存原生的 open 方法
        xhrOpen: window.XMLHttpRequest.prototype.open,
        // 保存原生的 send 方法
        xhrSend: window.XMLHttpRequest.prototype.send,
        init() {
          const that = this;

          window.XMLHttpRequest.prototype.open = function () {
            that.reqUrl = arguments[1];
            that.reqMethod = arguments[0];
            that.xhrOpen.apply(this, arguments);
          };

          window.XMLHttpRequest.prototype.send = function () {
            const message = {
              ...getErrorBaseInfo(),
              type: AJAX_ERROR,
              req: {
                url: that.reqUrl,
                method: that.reqMethod,
                data: arguments[0] || {},
              },
              res: {
                status: 0,
                statusText: '',
                response: null,
              },
            };
            this.addEventListener('readystatechange', function () {
              if (this.readyState === 4) {
                message.res.response = this.response;
                message.res.status = this.status;
                message.res.statusText = this.statusText;
                (!this.status || this.status >= 400) && handleError(message);
              }
            });

            that.xhrSend.apply(this, arguments);
          };
        },
      };
      AJAX.init();
    }

    if (window.fetch) {
      const FETCH = {
        backup: window.fetch,
        init() {
          window.fetch = function (url, conf) {
            return (
              FETCH.backup.apply(this, arguments)
                .then((res) => {
                  const message = {
                    ...getErrorBaseInfo(),
                    type: FETCH_ERROR,
                    req: {
                      url,
                      method: (conf && conf.method) || 'GET',
                      data: (conf && conf.body) || {},
                    },
                    res: {
                      status: res.status,
                      statusText: res.statusText,
                      // fetch 只能通过 res.json() 获取返回值且只能调用一次 此处不能获取返回值
                    },
                  };
                  (!res.status || res.status >= 400) && handleError(message);
                  return res;
                })
                .catch((err) => {
                  handleError(err);
                })
            );
          };
        },
      };
      FETCH.init();
    }
  }

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

  return Ohbug;

})));
