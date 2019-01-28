/**
 * constant
 * 管理错误类型
 */

export const CAUGHT_ERROR = 'caughtError'; // 调用 caughtError 装饰器主动捕获的错误
export const UNCAUGHT_ERROR = 'uncaughtError'; // 意料之外的错误
export const RESOURCE_ERROR = 'resourceError'; // 资源加载错误
export const GRAMMAR_ERROR = 'grammarError'; // 语法错误
export const PROMISE_ERROR = 'promiseError'; // promise 错误，可能包含 render 等错误
export const AJAX_ERROR = 'ajaxError'; // ajax 错误
export const FETCH_ERROR = 'fetchError'; // fetch 错误
export const WEBSOCKET_ERROR = 'websocketError'; // websocket 错误
export const REPORT_INFO = 'reportInfo'; // 主动上报的信息
export const UNKNOWN_ERROR = 'unknownError'; // 未知错误
