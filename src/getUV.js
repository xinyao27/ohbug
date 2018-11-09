/**
 * getUV
 * 获取UV
 */

import { UUID, print } from './util';

function getUV() {
  try {
    if (window.localStorage) {
      const now = new Date();
      let UV = localStorage.getItem('$Ohbug_UV') || '';
      const time = localStorage.getItem('$Ohbug_UV_time') || '';
      if ((!UV && !time) || (now.getTime() > time * 1)) {
        UV = UUID();
        localStorage.setItem('$Ohbug_UV', UV);
        const today = `${now.getFullYear()}/${now.getMonth() + 1}/${now.getDate()} 23:59:59`;
        localStorage.setItem('$Ohbug_UV_time', new Date(today).getTime());
      }
      return UV;
    }
  } catch (e) {
    print(e);
  }
}

export default getUV;
