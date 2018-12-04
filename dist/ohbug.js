(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global.Ohbug = factory());
}(this, (function () { 'use strict';

  /**
   * constant
   * 管理错误类型
   */

  const CAUGHT_ERROR = 'caughtError'; // 调用 caughtError 装饰器主动捕获的错误
  const UNCAUGHT_ERROR = 'uncaughtError'; // 意料之外的错误
  const RESOURCE_ERROR = 'resourceError'; // 资源加载错误
  const GRAMMAR_ERROR = 'grammarError'; // 语法错误
  const PROMISE_ERROR = 'promiseError'; // promise 错误，可能包含 render 等错误
  const AJAX_ERROR = 'ajaxError'; // ajax 错误
  const FETCH_ERROR = 'fetchError'; // fetch 错误
  const REPORT_INFO = 'reportInfo'; // 主动上报的信息

  /**
   * getBaseInfo
   * 获取用户名、ID、时间戳、其他自定义信息等
   *
   * @returns {Object}
   * @private
   */
  function getBaseInfo() {
    const config = window.$OhbugConfig;
    const date = new Date();
    const time = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日${date.getHours()}时${date.getMinutes()}分${date.getSeconds()}秒`;
    let result = {
      time,
      userAgent: window.navigator.userAgent,
      url: window.location.href,
      title: document.title,
      preUrl: document.referrer && document.referrer !== window.location.href ? document.referrer : '',
    };
    if (config && config.others) {
      result = {
        ...result,
        ...config.others,
      };
    }
    return result;
  }

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

  function print(info, type = 2) {
    const list = [
      {
        type: 0,
        msg: 'log',
        style: 'background: #e4f1eb; color: #fff; padding: 2px 4px; border-radius: 2px',
      },
      {
        type: 1,
        msg: 'info',
        style: 'background: #007fff; color: #fff; padding: 2px 4px; border-radius: 2px',
      },
      {
        type: 2,
        msg: 'error',
        style: 'background: #d9634d; color: #fff; padding: 2px 4px; border-radius: 2px',
      },
    ];
    list.forEach((item) => {
      type === item.type && console.log(`%c${item.msg}`, item.style, info);// eslint-disable-line
    });
  }

  function UUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0; // eslint-disable-line
      const v = c === 'x' ? r : (r & 0x3 | 0x8); // eslint-disable-line
      return v.toString(16);
    });
  }

  // 判断 dev prod 环境
  const reg = /^(https?:\/\/)?(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(.+)?$/;
  const isDev = reg.test(window.location.host) || window.location.host.indexOf('localhost') > -1;

  /**
   * request
   * 上报
   *
   * @param {Array} data
   * @private
   */
  function report(data) {
    try {
      const config = window.$OhbugConfig;
      if (isDev) {
        if (config && config.enabledDev && config.report) {
          config.report(data);
        }
      } else {
        config && config.report && config.report(data);
      }
    } catch (e) {
      print(`发送日志失败 errorInfo:${e}`);
    }
  }

  // 储存所有报错信息
  const errorList = [];

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
      console.error('Ohbug: 检测到未执行 Ohbug.init()');
    }
  };

  // 用于上报自定义信息
  const reportInfo = (info, include) => {
    if (window.$OhbugAuth) {
      const config = window.$OhbugConfig;
      const message = {
        type: REPORT_INFO,
        desc: info,
      };
      if (config.include) {
        if (typeof config.include === 'function') {
          config.include() && include && handleError(message);
        } else {
          console.error('Ohbug: 参数 include 类型必须为 function');
        }
      } else if (!config.include && include) {
        console.error('Ohbug: Ohbug.init 未传入参数 include');
      } else if (!config.include && !include) {
        handleError(message);
      }
    } else {
      console.error('Ohbug: 检测到未执行 Ohbug.init()');
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
    const { ignore } = window.$OhbugConfig;

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
              ...getBaseInfo(),
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
                const isIgnore = ignore.filter(u => that.reqUrl.indexOf(u) > -1);
                (!this.status || this.status >= 400) && !isIgnore.length && handleError(message);
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
                    ...getBaseInfo(),
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
                  const isIgnore = ignore.filter(u => url.indexOf(u) > -1);
                  (!res.status || res.status >= 400) && !isIgnore.length && handleError(message);
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

  /**
   * getPerformance
   * 获取页面性能信息
   */
  function getPerformance() {
    try {
      if (window) {
        if (!window.performance) return new Error('performance is not supported');
        const { timing } = window.performance;
        const {
          connectEnd,
          connectStart,
          domComplete,
          domContentLoadedEventEnd,
          domContentLoadedEventStart,
          domInteractive,
          domLoading,
          domainLookupEnd,
          domainLookupStart,
          fetchStart,
          loadEventEnd,
          loadEventStart,
          navigationStart,
          redirectEnd,
          redirectStart,
          requestStart,
          responseEnd,
          responseStart,
          secureConnectionStart,
          unloadEventEnd,
          unloadEventStart,
        } = timing;
        return {
          // 重定向 = redirectEnd - redirectStart
          redirect: redirectEnd - redirectStart || 0,
          // 应用缓存 = domainLookupStart - fetchStart
          cache: domainLookupStart - fetchStart || 0,
          // DNS解析 = domainLookupEnd - domainLookupStart
          dns: domainLookupEnd - domainLookupStart || 0,
          // TCP链接 = connectEnd - connectStart
          tcp: connectEnd - connectStart || 0,
          // 安全链接 = connectEnd - secureConnectionStart
          secureConnection: secureConnectionStart ? connectEnd - secureConnectionStart : 0,
          // request = responseEnd - requestStart
          request: responseEnd - requestStart || 0,
          // 白屏/首屏渲染(跳转到response之间) = responseStart - navigationStart
          first: responseStart - navigationStart || 0,
          // unload = unloadEventEnd - unloadEventStart
          unload: unloadEventEnd - unloadEventStart || 0,
          // 总体网络交互(开始跳转到服务器资源下载完成) = responseEnd - navigationStart
          network: responseEnd - navigationStart || 0,
          // DOM结构解析(未加载图片 样式 等) = domInteractive - domLoading
          domInteractive: domInteractive - domLoading || 0,
          // 脚本执行 = domContentLoadedEventEnd - domContentLoadedEventStart
          script: domContentLoadedEventEnd - domContentLoadedEventStart || 0,
          // DOM加载(不包括结构解析) = domComplete - domInteractive
          dom: domComplete - domInteractive || 0,
          // onload = loadEventEnd - loadEventStart
          onload: loadEventEnd - loadEventStart || 0,
          // 合计 = loadEventEnd - navigationStart
          total: loadEventEnd - navigationStart || 0,
        };
      }
    } catch (e) {
      print(e);
    }
  }

  function getResource() {
    try {
      if (window) {
        if (!window.performance) return new Error('performance is not supported');
        const resource = performance.getEntriesByType('resource');
        if (!resource || !resource.length) return [];
        return resource.map(item => ({
          name: item.name, // 路径
          type: item.initiatorType, // 类型
          duration: item.duration || 0, // 持续时间
          decodedBodySize: item.decodedBodySize || 0, // 返回数据大小
          nextHopProtocol: item.nextHopProtocol, // script img fetchrequest xmlhttprequest other
        }));
      }
    } catch (e) {
      print(e);
    }
  }

  function getUV() {
    try {
      if (window.localStorage) {
        const now = new Date();
        let UV = localStorage.getItem('$OhbugUV') || '';
        const time = localStorage.getItem('$OhbugUVTime') || '';
        if ((!UV && !time) || (now.getTime() > time * 1)) {
          UV = UUID();
          localStorage.setItem('$OhbugUV', UV);
          const today = `${now.getFullYear()}/${now.getMonth() + 1}/${now.getDate()} 23:59:59`;
          localStorage.setItem('$OhbugUVTime', new Date(today).getTime());
        }
        return UV;
      }
    } catch (e) {
      print(e);
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

    // 文档卸载前执行发送日志操作
    if (window.$OhbugConfig && (window.$OhbugConfig.mode === 'beforeunload')) {
      window.addEventListener && window.addEventListener('unload', () => {
        if (errorList.length && errorList.length <= window.$OhbugConfig.maxError) {
          report(errorList);
        }
      }, true);
    }

    if (window.$OhbugConfig && (window.$OhbugConfig.performance)) {
      window.addEventListener && window.addEventListener('load', () => {
        const performance = getPerformance();
        const resource = getResource();
        const UV = getUV();
        const data = {
          ...getBaseInfo(),
        };
        if (performance) data.performance = performance;
        if (resource && resource.length) data.resource = resource;
        if (UV) data.UV = UV;
        report(data);
      }, true);
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
          error: true, // 是否上报错误信息
          performance: false, // 是否上报性能信息
          include: null, // 用于收集指定用户的特定信息
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
      console.error('Ohbug: 检测到当前环境不支持 Ohbug！');
    }
  };

  Ohbug.caughtError = caughtError;
  Ohbug.reportInfo = reportInfo;

  return Ohbug;

})));
