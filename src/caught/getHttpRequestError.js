import { AJAX_ERROR, FETCH_ERROR, WEBSOCKET_ERROR } from '../constant';
import handleError from '../handle/handleError';

/**
 * getHttpRequestError
 * ajax/fetch/websocket Error
 *
 * @private
 */
function getHttpRequestError() {
  // 通过封装原生 Ajax/Fetch 请求，捕获错误信息
  const { ignore } = window.$OhbugConfig;

  if (window.XMLHttpRequest) {
    const AJAX = {
      url: '',
      method: '',
      open: window.XMLHttpRequest.prototype.open,
      send: window.XMLHttpRequest.prototype.send,
      init() {
        const that = this;

        window.XMLHttpRequest.prototype.open = function () {
          that.url = arguments[1];
          that.method = arguments[0];
          that.open.apply(this, arguments);
        };

        window.XMLHttpRequest.prototype.send = function () {
          this.addEventListener('readystatechange', function () {
            if (this.readyState === 4) {
              // 判断当前 http 请求是否在 ignore 中
              const isIgnore = ignore.filter(u => that.url.indexOf(u) > -1);
              if ((!this.status || this.status >= 400) && !isIgnore.length) {
                const message = {
                  type: AJAX_ERROR,
                  desc: {
                    req: {
                      url: that.url,
                      method: that.method,
                      data: arguments[0] || {},
                    },
                    res: {
                      status: this.status,
                      statusText: this.statusText,
                      response: this.response,
                    },
                  },
                };
                handleError(message);
              }
            }
          });

          that.send.apply(this, arguments);
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
          return FETCH.backup
            .apply(this, arguments)
            .then((res) => {
              const isIgnore = ignore.filter(u => url.indexOf(u) > -1);
              if ((!res.status || res.status >= 400) && !isIgnore.length) {
                const message = {
                  type: FETCH_ERROR,
                  desc: {
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
                  },
                };
                handleError(message);
              }
              return res;
            })
            .catch((err) => {
              const message = {
                type: FETCH_ERROR,
                desc: err,
              };
              handleError(message);
            });
        };
      },
    };
    FETCH.init();
  }

  if (window.WebSocket) {
    const WEBSOCKET = {
      url: '',
      backup: Object.getOwnPropertyDescriptor(
        window.WebSocket.prototype,
        'onerror',
      ),
      init() {
        const that = this;
        Object.defineProperty(window.WebSocket.prototype, 'onerror', {
          set() {
            try {
              const arg = arguments[0];
              that.backup.set.apply(this, [
                function (e) {
                  const message = {
                    type: WEBSOCKET_ERROR,
                    desc: {
                      url: e.target.url,
                    },
                  };
                  handleError(message);
                  arg.apply(this, arguments);
                },
              ]);
            } catch (e) {
              return that.backup.set.apply(this, arguments);
            }
          },
        });
      },
    };
    WEBSOCKET.init();
  }
}

export default getHttpRequestError;
