import { JwtSecretService } from '../src/common/auth/jwt-secret.service';

describe('JwtSecretService', () => {
  const config = {
    JWT_ACCESS_SECRET: 'current-access-secret-12345678901234567890',
    JWT_ACCESS_SECRET_PREVIOUS: 'previous-access-secret-123456789012345678',
    JWT_ACCESS_KEY_ID: 'v2',
    JWT_ACCESS_KEY_PREVIOUS_ID: 'v1',
    JWT_REFRESH_SECRET: 'current-refresh-secret-123456789012345678',
    JWT_REFRESH_SECRET_PREVIOUS: 'previous-refresh-secret-12345678901234567',
    JWT_REFRESH_KEY_ID: 'v2',
    JWT_REFRESH_KEY_PREVIOUS_ID: 'v1',
  };

  const service = new JwtSecretService({
    get: (name: string) => config[name as keyof typeof config],
  } as any);

  it('selects the current access secret by current key id', () => {
    expect(service.selectAccessSecret('v2')).toBe(config.JWT_ACCESS_SECRET);
  });

  it('selects the previous access secret during rotation', () => {
    expect(service.selectAccessSecret('v1')).toBe(config.JWT_ACCESS_SECRET_PREVIOUS);
  });

  it('treats legacy tokens without a key id as previous during rotation', () => {
    expect(service.selectAccessSecret()).toBe(config.JWT_ACCESS_SECRET_PREVIOUS);
  });

  it('rejects an unknown access key id', () => {
    expect(() => service.selectAccessSecret('unknown')).toThrow('Unknown JWT key id.');
  });

  it('selects the current and previous refresh secrets by key id', () => {
    expect(service.selectRefreshSecret('v2')).toBe(config.JWT_REFRESH_SECRET);
    expect(service.selectRefreshSecret('v1')).toBe(config.JWT_REFRESH_SECRET_PREVIOUS);
  });
});
