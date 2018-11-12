import getBaseInfo from '../src/info/getBaseInfo';

describe('getBaseInfo', () => {
  test('has attr time userAgent url title preUrl', () => {
    const baseInfo = getBaseInfo();
    expect(baseInfo).toHaveProperty('time');
    expect(baseInfo).toHaveProperty('userAgent');
    expect(baseInfo).toHaveProperty('url');
    expect(baseInfo).toHaveProperty('title');
    expect(baseInfo).toHaveProperty('preUrl');
  });
});
