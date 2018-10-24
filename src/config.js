let defaultConf = {
  delay: 2000, // 错误处理间隔时间
};

function config(conf) {
  if (conf) {
    defaultConf = {
      ...defaultConf,
      ...conf,
    };
  }
  return defaultConf;
}

// 储存所有报错信息
const errorList = [];

export {
  config,
  errorList,
};
