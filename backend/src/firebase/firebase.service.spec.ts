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


describe('FirebaseService.verifyAppCheckToken', () => {
  const createService = (verifyToken: jest.Mock) => {
    const service = Object.create(FirebaseService.prototype) as FirebaseService;
    (service as any).getAppCheck = jest.fn().mockResolvedValue({ verifyToken });
    (service as any).withTimeout = (operation: Promise<unknown>) => operation;
    return service;
  };

  it('accepts a token verified by Firebase Admin', async () => {
    const verifyToken = jest.fn().mockResolvedValue({ appId: 'app-id' });
    const service = createService(verifyToken);

    await expect(service.verifyAppCheckToken('valid-app-check-token')).resolves.toBe(true);
    expect(verifyToken).toHaveBeenCalledWith('valid-app-check-token');
  });

  it('returns false for invalid or expired App Check tokens', async () => {
    const verifyToken = jest.fn().mockRejectedValue(new Error('app-check/token-invalid'));
    const service = createService(verifyToken);

    await expect(service.verifyAppCheckToken('invalid-app-check-token')).resolves.toBe(false);
  });
});


describe('FirebaseService.buildFirebaseDownloadUrl', () => {
  const createService = () => Object.create(FirebaseService.prototype) as FirebaseService;

  it('encodes the object path and token using the configured bucket', () => {
    const service = createService();

    const url = (service as any).buildFirebaseDownloadUrl(
      'rentitease-staging.firebasestorage.app',
      'properties/front door #1.png',
      'token/value+with=special',
    );

    expect(url).toBe(
      'https://firebasestorage.googleapis.com/v0/b/rentitease-staging.firebasestorage.app/o/properties%2Ffront%20door%20%231.png?alt=media&token=token%2Fvalue%2Bwith%3Dspecial',
    );
  });

  it('rejects a missing bucket name', () => {
    const service = createService();

    expect(() => (service as any).buildFirebaseDownloadUrl('', 'properties/test.png', 'token'))
      .toThrow('Firebase Storage bucket name is missing.');
  });

  it('rejects a missing download token', () => {
    const service = createService();

    expect(() => (service as any).buildFirebaseDownloadUrl(
      'rentitease-staging.firebasestorage.app',
      'properties/test.png',
      ' ',
    )).toThrow('Firebase Storage download token is missing.');
  });
});
