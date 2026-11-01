import { ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppCheckGuard } from './app-check.guard';
import { FirebaseService } from './firebase.service';

describe('AppCheckGuard', () => {
  const contextFor = (headers: Record<string, string> = {}, path = '/api/v1/properties') => ({
    switchToHttp: () => ({
      getRequest: () => ({ method: 'GET', path, headers }),
    }),
  }) as any;

  const createGuard = (mode: string, verifyAppCheckToken = jest.fn().mockResolvedValue(true)) =>
    new AppCheckGuard(
      { get: jest.fn().mockReturnValue(mode) } as unknown as ConfigService,
      { verifyAppCheckToken } as unknown as FirebaseService,
    );

  it('allows requests without a token in monitor mode', async () => {
    const guard = createGuard('monitor');
    await expect(guard.canActivate(contextFor())).resolves.toBe(true);
  });

  it('allows invalid tokens in monitor mode while recording verification', async () => {
    const verify = jest.fn().mockResolvedValue(false);
    const guard = createGuard('monitor', verify);
    await expect(
      guard.canActivate(contextFor({ 'x-firebase-appcheck': 'invalid-token' })),
    ).resolves.toBe(true);
    expect(verify).toHaveBeenCalledWith('invalid-token');
  });

  it('rejects missing tokens only in enforce mode', async () => {
    const guard = createGuard('enforce');
    await expect(guard.canActivate(contextFor())).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('rejects invalid tokens only in enforce mode', async () => {
    const guard = createGuard('enforce', jest.fn().mockResolvedValue(false));
    await expect(
      guard.canActivate(contextFor({ 'x-firebase-appcheck': 'invalid-token' })),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('bypasses health checks and disabled mode', async () => {
    const verify = jest.fn();
    const healthGuard = createGuard('enforce', verify);
    await expect(healthGuard.canActivate(contextFor({}, '/api/v1/health'))).resolves.toBe(true);
    expect(verify).not.toHaveBeenCalled();

    const disabledGuard = createGuard('disabled', verify);
    await expect(disabledGuard.canActivate(contextFor())).resolves.toBe(true);
    expect(verify).not.toHaveBeenCalled();
  });
});
