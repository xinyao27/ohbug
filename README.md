# Ohbug

> js caught and report error

## 简介

通过监听/主动捕获 `error`，获取异常相关信息后执行特定操作(数据上传记录等)

## 功能

可捕获的异常类型包括：

1. JavaScript执行错误
2. 资源加载错误
3. HTTP请求错误
4. 未catch处理的Promise错误

## Todo
1. 捕获websocket错误
2. 设置采集率
3. sourcemap定位压缩代码具体错误位置

## 原理

- 通过 `window.addEventListener`，可捕获 `JavaScript` 执行错误，资源加载错误，未catch处理的Promise错误
- 通过改写 `XMLHttpRequest` / `fetch` 实现监听 `HTTP` 请求错误

## 使用

#### script mode

```html
<script src="./ohbug.js"></script>

<script>
  Ohbug.init({
    report(errorList) {
      // 上传错误至服务端
    }
  })
</script>
```

#### module mode

1.安装

```sh
npm install ohbug --save
```
如果想用 `yarn`
```sh
yarn add ohbug
```

2.在文件中添加

```javascript
import Ohbug from 'ohbug'

Ohbug.init({
  report(errorList) {
    // 上传错误至服务端
  }
})
```

## 主动捕获上报

针对一些特殊需求的错误 使用主动捕获(使用装饰器)

例如在 `react` 中

```javascript
import { caughtError } from 'ohbug';

class Test extends React.Component {
  @caughtError // success
  send() {
    // ...
  }
}
```

请注意箭头函数使用 `caughtError` 捕获不到错误信息，例如

```javascript
import { caughtError } from 'ohbug';

class Test extends React.Component {
  @caughtError // fail
  send = () => {
    // ...
  }
}
```

针对一些不能使用装饰器或自定义信息使用 `reportError`

```javascript
import { reportError } from 'ohbug';

class Test extends React.Component {
  send() {
    try {
      // ...
    } catch(e) {
      reportError(e)
    }
  }
}
```

```javascript
import { reportError } from 'ohbug';

class Test extends React.Component {
  hello() {
    reportError('hello')
  }
}
```

## 配置

使用方式
```javascript
const others = {
  id: window.sessionStorage.getItem('XXX_ID'),
  nick: window.sessionStorage.getItem('XXX_NICK'),
};
function report(data) {
  ajax('url', JSON.stringify(data))
}
Ohbug.init({
  delay: 2000,
  report,
  others,
});
```

| key | description | type | default |
| :------: | :------: | :------: | :------: |
| delay | 错误处理间隔时间 | number | 2000 |
| report | 上传错误函数 | function | null |
| others | 自定义信息 | object | null |
| enabledDev | 开发环境下上传错误 | boolean | false |
| maxError | 发送日志请求连续出错的最大次数 超过则不再发送请求 | number | 10 | 
| mode | 短信发送模式 ('immediately': 立即发送 'beforeunload': 页面注销前发送) | string | 'immediately' |

## 错误类型

| type | description |
| :------: | :------: |
| caughtError | 调用 caughtError 装饰器主动捕获的错误 |
| uncaughtError | 意料之外的错误 |
| resourceError | 资源加载错误 |
| grammarError | 语法错误 |
| promiseError | promise 错误 |
| ajaxError | ajax 错误 |
| fetchError | fetch 错误 |
| reportError | 主动上报的错误 |
