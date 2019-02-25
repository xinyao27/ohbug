# Ohbug

[![Build Status](https://travis-ci.org/chenyueban/ohbug.svg?branch=master)](https://travis-ci.org/chenyueban/ohbug)
[![codecov](https://codecov.io/gh/chenyueban/ohbug/branch/master/graph/badge.svg)](https://codecov.io/gh/chenyueban/ohbug)
[![npm](https://img.shields.io/npm/v/ohbug.svg)](https://www.npmjs.com/package/ohbug)
[![GitHub](https://img.shields.io/github/license/mashape/apistatus.svg)](https://github.com/chenyueban/ohbug/blob/master/LICENSE)

## 简介

通过监听/主动捕获 `error` 以及性能信息，获取相关信息后执行特定操作(数据上传记录等)。

## 功能

### 错误捕获

可捕获的异常类型包括：

1. JavaScript执行错误
2. 资源加载错误
3. HTTP请求错误
4. 未catch处理的Promise错误

### 性能监控

可监控页面加载各个阶段所用时间、页面资源加载时间。

信息将于页面 `load` 事件时上报

### 错误上报

上报方法可自定义，上报时机分为：

1. 发生错误时立即上报错误
2. 页面卸载前上报。

### 性能信息上报

页面加载完成后上报

## Todo
- [x] 捕获websocket错误
- [ ] 设置采集率
- [ ] sourcemap定位压缩代码具体错误位置
- [x] 页面性能监控
- [ ] 页面HTTP请求性能监控
- [x] 页面资源加载性能监控

## 原理

- 通过 `window.addEventListener`，可捕获 `JavaScript` 执行错误，资源加载错误，未catch处理的Promise错误
- 通过改写 `XMLHttpRequest` / `fetch` 实现监听 `HTTP` 请求错误
- 页面性能时间
![image](https://segmentfault.com/img/remote/1460000010209590)

## 使用

#### script mode

```html
<script src="https://unpkg.com/ohbug"></script>

<script>
  Ohbug.init({
    report(errorList) {
      // 上传错误至服务端
    }
  })
</script>
```

#### module mode (React)

1.安装

```sh
npm install ohbug --save
```
如果想用 `yarn`
```sh
yarn add ohbug
```

2.在 根组件文件中添加

```javascript
import Ohbug from 'ohbug'

class Root extends React.Component {
  componentDidMount() {
    Ohbug.init({
      report(errorList) {
        // 上传错误至服务端
      }
    })
  }
}
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

针对一些不能使用装饰器或自定义信息使用 `reportInfo`

```javascript
import { reportInfo } from 'ohbug';

class Test extends React.Component {
  send() {
    try {
      // ...
    } catch(e) {
      reportInfo(e)
    }
  }
}
```

```javascript
import { reportInfo } from 'ohbug';

class Test extends React.Component {
  hello() {
    reportInfo('hello')
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
  report,
  others,
});
```

| key | description | type | default |
| :------: | :------: | :------: | :------: |
| report | 上传函数 | function | null |
| others | 自定义信息 | object | null |
| enabledDev | 开发环境下上传 (默认查看当前 url 中是否含有 `127.0.0.1` / `localhost` ，若传入数组则会遍历数组内每一项 url 与当前 url 是否匹配，匹配则是开发环境) | boolean / string[] | false |
| | 以下为错误信息上报相关配置 | | |
| error | 是否上报错误信息 | boolean | true |
| maxError | 发送日志请求连续出错的最大次数 超过则不再发送请求 | number | 10 | 
| mode | 短信发送模式 ('immediately': 立即发送 'beforeunload': 页面注销前发送) | string | 'immediately' |
| delay | 错误处理间隔时间 | number | 2000 |
| ignore | 忽略指定错误 目前只支持忽略 HTTP 请求错误 | array | [] |
| | 以下为性能信息上报相关配置 | | |
| performance | 是否上报性能信息 | boolean | false |
| include |  收集指定用户的特定信息 | function | null |
## 注意

### `mode` 属性
设置为 `immediately` 时，`delay` 时间内发生的错误将会统一收集并上报

设置为 `beforeunload` 时，会在卸载当前页面时上报，可能存在用户关闭或切换页面导致漏报问题。

常见的解决方案为发送同步 `ajax` 请求(会导致页面卡顿) 或 使用 `navigator.sendBeacon()` 异步上报(不支持 GET)，两种情况都存在弊端 实际生产环境视情况而定。
```javascript
function report(data) {
  var xhr = new XMLHttpRequest();
  xhr.open("POST", "/log", false); // false 表示同步
  xhr.send(data);
}
Ohbug.init({
  report,
});
```
```javascript
function report(data) {
  navigator.sendBeacon("/log", data); // 默认发送 POST 请求
}
Ohbug.init({
  report,
});
```

### `ignore` 属性
Ohbug 在捕获错误时会忽略 `ignore` 数组内的 url。

使用场景: 
1. 可能频繁出错或不需上报的api。
2. 由于上报请求完全自定义，一旦上报请求发生错误，Ohbug无法判断错误来源，会导致无限循环上报，此时将上报的 url 添加入 `ignore` 数组内，忽略上报请求的错误。

### `include` 属性
Ohbug 会调用传入函数, 当使用 `reportInfo` 时只捕获指定的信息.

配置:
```js
function include() {
  if (window.user === 'frank') return true
  return false
}
Ohbug.init({
  include,
})
```
使用 `reportInfo` :
```js
import { reportInfo } from 'ohbug';

class Test extends React.Component {
  hello() {
    reportInfo('hello', true) // 只有当前用户为 `frank` 时, 才会上报信息 'hello'
  }
}
```

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
| websocketError | websocket 错误 |
| reportInfo | 主动上报的信息 |

## 性能信息类型

| type | description |
| :------: | :------: |
| redirect | 重定向耗时 |
| cache | 应用缓存耗时 |
| dns | DNS解析耗时 |
| tcp | TCP链接耗时 |
| secureConnection | 安全链接耗时 |
| request | request耗时 |
| first | 白屏/首屏渲染(跳转到response之间)耗时 |
| unload | unload耗时 |
| network | 总体网络交互(开始跳转到服务器资源下载完成)耗时 |
| domInteractive | DOM结构解析(未加载图片 样式 等)耗时 |
| script | 脚本执行耗时 |
| dom | DOM加载(不包括结构解析)耗时 |
| onload | onload耗时 |
| total | 合计耗时 |

## License

[MIT](https://opensource.org/licenses/MIT)

Copyright (c) 2018 陈月半