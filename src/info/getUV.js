/**
 * getUV
 * 获取UV
 */

import { UUID, print } from '../util';

function getUV() {
  try {
    if (window.localStorage) {
      const now = new Date();
      let UV = localStorage.getItem('$OhbugUV') || '';
      const time = localStorage.getItem('$OhbugUVTime') || '';
      if ((!UV && !time) || (now.getTime() > time * 1)) {
        UV = UUID();
        localStorage.setItem('$OhbugUV', UV);
        const today = `${now.getFullYear()}/${now.getMonth() + 1}/${now.getDate()} 23:59:59`;
        localStorage.setItem('$OhbugUVTime', new Date(today).getTime());
      }
      return UV;
    }
  } catch (e) {
    print(e);
  }
}

export default getUV;
