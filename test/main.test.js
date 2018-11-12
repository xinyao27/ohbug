import { init, config } from './init';

describe('Ohbug.init', () => {
  test('has $OhbugAuth and $OhbugConfig', () => {
    init();
    const $auth = window.$OhbugAuth;
    const $config = window.$OhbugConfig;
    expect($auth).toBe(true);
    expect($config).toMatchObject(config);
  });
});
