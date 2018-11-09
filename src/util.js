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

export {
  debounce,
  print,
};
