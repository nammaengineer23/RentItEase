import { AuthService } from './auth.service';

describe('AuthService', () => {
  it('constructs with its security dependencies', () => {
    const service = new AuthService(
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    );
    expect(service).toBeDefined();
  });
});
