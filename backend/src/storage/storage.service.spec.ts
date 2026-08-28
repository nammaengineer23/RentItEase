import { ConfigService } from '@nestjs/config';

import { FirebaseService } from '../firebase/firebase.service';
import { R2StorageService } from './r2-storage.service';
import { StorageService } from './storage.service';

describe('StorageService', () => {
  const file = {
    originalname: 'photo.jpg',
  } as Express.Multer.File;

  const firebaseService = {
    uploadImage: jest.fn(),
    deleteImage: jest.fn(),
  } as unknown as FirebaseService;

  const r2StorageService = {
    uploadImage: jest.fn(),
    deleteImage: jest.fn(),
  } as unknown as R2StorageService;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uses R2 for new uploads when configured', async () => {
    const configService = {
      get: jest.fn().mockReturnValue('r2'),
    } as unknown as ConfigService;
    const service = new StorageService(
      configService,
      firebaseService,
      r2StorageService,
    );

    await service.uploadImage(file, 'profiles');

    expect(r2StorageService.uploadImage).toHaveBeenCalledWith(file, 'profiles');
    expect(firebaseService.uploadImage).not.toHaveBeenCalled();
  });

  it('keeps Firebase as the default upload provider', async () => {
    const configService = {
      get: jest.fn().mockReturnValue(undefined),
    } as unknown as ConfigService;
    const service = new StorageService(
      configService,
      firebaseService,
      r2StorageService,
    );

    await service.uploadImage(file);

    expect(firebaseService.uploadImage).toHaveBeenCalledWith(
      file,
      'properties',
    );
  });

  it('deletes legacy Firebase and new R2 objects with the correct provider', async () => {
    const configService = {
      get: jest.fn().mockReturnValue('r2'),
    } as unknown as ConfigService;
    const service = new StorageService(
      configService,
      firebaseService,
      r2StorageService,
    );

    await service.deleteImage('properties/legacy.jpg');
    await service.deleteImage('r2:properties/new.jpg');

    expect(firebaseService.deleteImage).toHaveBeenCalledWith(
      'properties/legacy.jpg',
    );
    expect(r2StorageService.deleteImage).toHaveBeenCalledWith(
      'r2:properties/new.jpg',
    );
  });
});
