import { AuthController } from './auth.controller';

describe('AuthController', () => {
  it('constructs with its service dependency', () => {
    const controller = new AuthController({} as any);
    expect(controller).toBeDefined();
  });
});
