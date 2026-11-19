import { applicationDefault, getApps, initializeApp } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { SocialMediaStorageService } from './social-media.storage.service';

jest.mock('firebase-admin/app', () => ({
  getApps: jest.fn(() => [{}]),
  initializeApp: jest.fn(),
  applicationDefault: jest.fn(() => ({ type: 'application-default' })),
  cert: jest.fn(() => ({ type: 'service-account' })),
}));

jest.mock('firebase-admin/storage', () => ({
  getStorage: jest.fn(),
}));

describe('SocialMediaStorageService private GCS reels', () => {
  const save = jest.fn().mockResolvedValue(undefined);
  const getSignedUrl = jest.fn().mockResolvedValue(['https://signed.example/reel.mp4']);
  const makePublic = jest.fn();
  const download = jest.fn();
  const deleteObject = jest.fn().mockResolvedValue(undefined);
  const file = { save, getSignedUrl, makePublic, download, delete: deleteObject };
  const bucket = {
    name: 'rentitease-staging.firebasestorage.app',
    file: jest.fn(() => file),
  };
  const service = new SocialMediaStorageService({} as any);

  beforeEach(() => {
    jest.clearAllMocks();
    (getStorage as jest.Mock).mockReturnValue({ bucket: () => bucket });
  });

  it('initializes Firebase with ADC when running without explicit service-account keys', async () => {
    const previousProjectId = process.env.FIREBASE_PROJECT_ID;
    const previousBucket = process.env.FIREBASE_STORAGE_BUCKET;
    const previousClientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const previousPrivateKey = process.env.FIREBASE_PRIVATE_KEY;

    process.env.FIREBASE_PROJECT_ID = 'rentitease-staging';
    process.env.FIREBASE_STORAGE_BUCKET = 'rentitease-staging.firebasestorage.app';
    delete process.env.FIREBASE_CLIENT_EMAIL;
    delete process.env.FIREBASE_PRIVATE_KEY;
    (getApps as jest.Mock).mockReturnValueOnce([]);

    try {
      await service.uploadBuffer(Buffer.from('video'), 'property-1');

      expect(applicationDefault).toHaveBeenCalledTimes(1);
      expect(initializeApp).toHaveBeenCalledWith(expect.objectContaining({
        projectId: 'rentitease-staging',
        storageBucket: 'rentitease-staging.firebasestorage.app',
        credential: { type: 'application-default' },
      }));
    } finally {
      if (previousProjectId === undefined) delete process.env.FIREBASE_PROJECT_ID;
      else process.env.FIREBASE_PROJECT_ID = previousProjectId;
      if (previousBucket === undefined) delete process.env.FIREBASE_STORAGE_BUCKET;
      else process.env.FIREBASE_STORAGE_BUCKET = previousBucket;
      if (previousClientEmail === undefined) delete process.env.FIREBASE_CLIENT_EMAIL;
      else process.env.FIREBASE_CLIENT_EMAIL = previousClientEmail;
      if (previousPrivateKey === undefined) delete process.env.FIREBASE_PRIVATE_KEY;
      else process.env.FIREBASE_PRIVATE_KEY = previousPrivateKey;
    }
  });

  it('stores reels privately and returns a stable GCS object reference', async () => {
    const result = await service.uploadBuffer(Buffer.from('video'), 'property-1');

    expect(result).toMatch(/^gcs:\/\/rentitease-staging\.firebasestorage\.app\/social-videos\/property-1\//);
    expect(save).toHaveBeenCalledWith(Buffer.from('video'), expect.objectContaining({
      metadata: { cacheControl: 'private,no-store,max-age=0' },
    }));
    expect(makePublic).not.toHaveBeenCalled();
  });

  it('creates a temporary V4 URL for a stable social-video object reference', async () => {
    const result = await service.getVideoDownloadUrl(
      'gcs://rentitease-staging.firebasestorage.app/social-videos/property-1/reel.mp4',
    );

    expect(result).toBe('https://signed.example/reel.mp4');
    expect(getSignedUrl).toHaveBeenCalledWith(expect.objectContaining({
      version: 'v4',
      action: 'read',
      expires: expect.any(Number),
    }));
  });

  it('rejects social-video references outside the expected bucket and namespace', async () => {
    await expect(service.getVideoDownloadUrl(
      'gcs://other-bucket/social-videos/property-1/reel.mp4',
    )).rejects.toThrow('Unsupported prepared video reference.');
    await expect(service.getVideoDownloadUrl(
      'gcs://rentitease-staging.firebasestorage.app/properties/private.jpg',
    )).rejects.toThrow('Invalid social video object reference.');
    expect(getSignedUrl).not.toHaveBeenCalled();
  });
});
