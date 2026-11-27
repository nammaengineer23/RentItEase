import { BadRequestException } from '@nestjs/common';
import { FirebaseService } from './firebase.service';

describe('FirebaseService storage key safety', () => {
  const service = Object.create(FirebaseService.prototype) as FirebaseService;

  it('uses opaque object names rather than client filenames', () => {
    const key = (service as any).buildStorageObjectName(
      {
        originalname: '../../private/customer-photo.png',
        mimetype: 'image/png',
      },
      'properties',
    ) as string;

    expect(key).toMatch(/^properties\/[0-9a-f-]{36}\.png$/i);
    expect(key).not.toContain('customer-photo');
    expect(key).not.toContain('..');
  });

  it('rejects unsupported public storage folders', () => {
    expect(() =>
      (service as any).buildStorageObjectName(
        {
          originalname: 'photo.jpg',
          mimetype: 'image/jpeg',
        },
        'r2',
      ),
    ).toThrow(BadRequestException);
  });

  it('creates V4 signed URLs only for supported property media namespaces', async () => {
    const getSignedUrl = jest
      .fn()
      .mockResolvedValue(['https://signed.example/media']);
    (service as any).getStorage = () => ({
      bucket: () => ({ file: () => ({ getSignedUrl }) }),
    });

    await expect(
      service.getPublicMediaDownloadUrl('properties/photo.jpg'),
    ).resolves.toBe('https://signed.example/media');

    expect(getSignedUrl).toHaveBeenCalledWith(
      expect.objectContaining({
        version: 'v4',
        action: 'read',
        expires: expect.any(Number),
      }),
    );
  });

  it('rejects public media keys outside the supported namespaces before storage access', async () => {
    const getStorage = jest.fn();
    (service as any).getStorage = getStorage;

    await expect(
      service.getPublicMediaDownloadUrl('../chat/private.pdf'),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.getPublicMediaDownloadUrl('social-videos/clip.mp4'),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(getStorage).not.toHaveBeenCalled();
  });

  it('rejects private download keys outside the chat namespace before storage access', async () => {
    await expect(
      service.getPrivateDownloadUrl('../properties/private.jpg'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects delete keys outside the Firebase property namespaces', async () => {
    await expect(
      service.deleteImage('r2:legacy-object'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  describe('profile image storage isolation', () => {
    const validFile = {
      originalname: '../../customer-photo.png',
      mimetype: 'image/png',
      buffer: Buffer.from('test-image'),
    } as Express.Multer.File;

    it('generates an opaque profile key scoped to the supplied user', async () => {
      const save = jest.fn().mockResolvedValue(undefined);
      (service as any).getStorage = () => ({
        bucket: () => ({
          file: (key: string) => {
            expect(key).toMatch(
              /^profile-images\/user_123\/[0-9a-f-]{36}\.png$/i,
            );
            expect(key).not.toContain('customer-photo');
            return { save };
          },
        }),
      });

      const result = await service.uploadProfileImage('user_123', validFile);

      expect(result.publicId).toMatch(
        /^profile-images\/user_123\/[0-9a-f-]{36}\.png$/i,
      );
      expect(save).toHaveBeenCalledWith(
        validFile.buffer,
        expect.objectContaining({
          metadata: {
            contentType: 'image/png',
            cacheControl: 'private, no-store, max-age=0',
          },
        }),
      );
    });

    it('rejects invalid user IDs before accessing storage', async () => {
      const getStorage = jest.fn();
      (service as any).getStorage = getStorage;

      await expect(
        service.uploadProfileImage('../other-user', validFile),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(getStorage).not.toHaveBeenCalled();
    });

    it.each(['image/gif', 'image/svg+xml', 'application/pdf', 'video/mp4'])(
      'rejects unsupported profile MIME type %s',
      async (mimetype) => {
        const getStorage = jest.fn();
        (service as any).getStorage = getStorage;

        await expect(
          service.uploadProfileImage('user_123', {
            ...validFile,
            mimetype,
          } as Express.Multer.File),
        ).rejects.toBeInstanceOf(BadRequestException);

        expect(getStorage).not.toHaveBeenCalled();
      },
    );

    it('signs a profile image only within the supplied user namespace', async () => {
      const getSignedUrl = jest
        .fn()
        .mockResolvedValue(['https://signed.example/profile']);

      (service as any).getStorage = () => ({
        bucket: () => ({
          file: (key: string) => {
            expect(key).toBe('profile-images/user_123/photo.png');
            return { getSignedUrl };
          },
        }),
      });

      await expect(
        service.getProfileImageDownloadUrl(
          'user_123',
          'profile-images/user_123/photo.png',
        ),
      ).resolves.toBe('https://signed.example/profile');

      expect(getSignedUrl).toHaveBeenCalledWith(
        expect.objectContaining({
          version: 'v4',
          action: 'read',
          expires: expect.any(Number),
        }),
      );
    });

    it.each([
      ['user_123', 'profile-images/another-user/photo.png'],
      ['user_123', 'properties/photo.png'],
      ['user_123', 'chat/conversation/photo.png'],
      ['user_123', 'profile-images/user_123/../photo.png'],
      ['../user', 'profile-images/../photo.png'],
    ])(
      'rejects profile signing outside the requested owner namespace',
      async (userId, objectKey) => {
        const getStorage = jest.fn();
        (service as any).getStorage = getStorage;

        await expect(
          service.getProfileImageDownloadUrl(userId, objectKey),
        ).rejects.toBeInstanceOf(BadRequestException);

        expect(getStorage).not.toHaveBeenCalled();
      },
    );
  });
});
