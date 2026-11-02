import { BadRequestException } from '@nestjs/common';
import { FirebaseService } from './firebase.service';

describe('FirebaseService storage key safety', () => {
  const service = Object.create(FirebaseService.prototype) as FirebaseService;

  it('uses opaque object names rather than client filenames', () => {
    const key = (service as any).buildStorageObjectName({
      originalname: '../../private/customer-photo.png',
      mimetype: 'image/png',
    }, 'properties') as string;

    expect(key).toMatch(/^properties\/[0-9a-f-]{36}\.png$/i);
    expect(key).not.toContain('customer-photo');
    expect(key).not.toContain('..');
  });

  it('rejects unsupported public storage folders', () => {
    expect(() => (service as any).buildStorageObjectName({
      originalname: 'photo.jpg',
      mimetype: 'image/jpeg',
    }, 'r2')).toThrow(BadRequestException);
  });

  it('rejects private download keys outside the chat namespace before storage access', async () => {
    await expect(service.getPrivateDownloadUrl('../properties/private.jpg'))
      .rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects delete keys outside the Firebase property namespaces', async () => {
    await expect(service.deleteImage('r2:legacy-object'))
      .rejects.toBeInstanceOf(BadRequestException);
  });
});
