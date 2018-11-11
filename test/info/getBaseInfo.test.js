import getBaseInfo from '../../src/info/getBaseInfo';

describe('have $OhbugAuth and $OhbugConfig', () => {
  it('init', () => {
    const baseInfo = getBaseInfo();
    expect(baseInfo).toHaveProperty('time');
    expect(baseInfo).toHaveProperty('userAgent');
    expect(baseInfo).toHaveProperty('url');
    expect(baseInfo).toHaveProperty('title');
    expect(baseInfo).toHaveProperty('preUrl');
  });
});
