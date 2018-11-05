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

  console.log(`%c${LOG_ERROR.msg}`, LOG_ERROR.style, info);// eslint-disable-line
}

export {
  debounce,
  print,
};
