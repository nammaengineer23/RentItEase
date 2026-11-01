import { UnauthorizedException } from '@nestjs/common';
import { FirebaseService } from './firebase.service';

describe('FirebaseService.verifyToken', () => {
  it('asks Firebase Admin to check revocation and disabled-user status', async () => {
    const verifyIdToken = jest.fn().mockResolvedValue({ sub: 'firebase-uid' });
    const service = Object.create(FirebaseService.prototype) as FirebaseService;
    (service as any).getAuth = () => ({ verifyIdToken });
    (service as any).withTimeout = (operation: Promise<unknown>) => operation;

    await service.verifyToken('valid-id-token');

    expect(verifyIdToken).toHaveBeenCalledWith('valid-id-token', true);
  });

  it('normalizes Firebase Admin verification failures to HTTP 401', async () => {
    const verifyIdToken = jest.fn().mockRejectedValue(new Error('auth/id-token-revoked'));
    const service = Object.create(FirebaseService.prototype) as FirebaseService;
    (service as any).getAuth = () => ({ verifyIdToken });
    (service as any).withTimeout = (operation: Promise<unknown>) => operation;

    await expect(service.verifyToken('revoked-id-token')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
