import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { FirebaseAppCheckGuard } from '../src/firebase/firebase-app-check.guard';

describe('FirebaseAppCheckGuard', () => {
  const firebaseService = {
    verifyAppCheckToken: jest.fn(),
  };

  const guard = new FirebaseAppCheckGuard(firebaseService as any);

  const context = {
    switchToHttp: () => ({
      getRequest: () => ({
        headers: {},
      }),
    }),
  } as unknown as ExecutionContext;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects requests without an App Check token', async () => {
    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(firebaseService.verifyAppCheckToken).not.toHaveBeenCalled();
  });

  it('accepts a valid App Check token', async () => {
    firebaseService.verifyAppCheckToken.mockResolvedValue({ app_id: 'test-app' });
    const validContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: {
            'x-firebase-appcheck': 'valid-token',
          },
        }),
      }),
    } as unknown as ExecutionContext;

    await expect(guard.canActivate(validContext)).resolves.toBe(true);
    expect(firebaseService.verifyAppCheckToken).toHaveBeenCalledWith('valid-token');
  });

  it('rejects an invalid App Check token', async () => {
    firebaseService.verifyAppCheckToken.mockRejectedValue(new Error('invalid'));
    const invalidContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: {
            'x-firebase-appcheck': 'invalid-token',
          },
        }),
      }),
    } as unknown as ExecutionContext;

    await expect(guard.canActivate(invalidContext)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
