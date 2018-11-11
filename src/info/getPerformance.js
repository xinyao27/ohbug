import { print } from '../util';

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

export {
  getPerformance,
  getResource,
};
