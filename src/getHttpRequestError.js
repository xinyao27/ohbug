/**
 * getHTTPRequestError
 * 捕获 HTTP 请求错误
 */

import {
  AJAX_ERROR,
  FETCH_ERROR,
} from './constant';
import getBaseInfo from './getBaseInfo';
import handleError from './handleError';

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

export default getHttpRequestError;
