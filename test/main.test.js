import { init, config } from './common';

describe('have $OhbugAuth and $OhbugConfig', () => {
  it('init', () => {
    init();
    const $auth = window.$OhbugAuth;
    const $config = window.$OhbugConfig;
    expect($auth).toBe(true);
    expect($config).toMatchObject(config);
  });
});
