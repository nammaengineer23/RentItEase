import { BadRequestException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { ImageFileValidator } from '../../common/validators/image-file.validator';

describe('AuthController profile photo upload', () => {
  const authService: any = {
    updateProfilePhoto: jest.fn(),
    isProfilePhotoStored: jest.fn(),
  };
  const storageService: any = {
    uploadProfileImage: jest.fn(),
    getProfileImageDownloadUrl: jest.fn(),
    deleteProfileImage: jest.fn(),
  };

  let controller: AuthController;

  beforeEach(() => {
    jest.resetAllMocks();
    controller = new AuthController(authService, storageService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('uploads for the authenticated user, persists the object key and returns a signed URL', async () => {
    const objectKey = 'profile-images/user-1/generated.png';
    const signedUrl = 'https://signed.example.com/generated.png';
    const file = {
      originalname: 'avatar.png',
      mimetype: 'image/png',
      size: 128,
      buffer: Buffer.from('image bytes'),
    } as Express.Multer.File;

    jest.spyOn(ImageFileValidator.prototype, 'isValid').mockReturnValue(true);
    jest
      .spyOn(ImageFileValidator.prototype, 'hasValidContent')
      .mockResolvedValue(true);

    storageService.uploadProfileImage.mockResolvedValue({
      publicId: objectKey,
    });
    authService.updateProfilePhoto.mockResolvedValue({
      id: 'user-1',
      fullName: 'Test User',
      photoUrl: objectKey,
    });
    storageService.getProfileImageDownloadUrl.mockResolvedValue(signedUrl);

    const result = await controller.uploadCurrentUserPhoto(
      { user: { id: 'user-1' } },
      file,
    );

    expect(storageService.uploadProfileImage).toHaveBeenCalledWith(
      'user-1',
      file,
    );
    expect(authService.updateProfilePhoto).toHaveBeenCalledWith(
      'user-1',
      objectKey,
    );
    expect(storageService.getProfileImageDownloadUrl).toHaveBeenCalledWith(
      'user-1',
      objectKey,
    );
    expect(result).toMatchObject({
      id: 'user-1',
      photoUrl: signedUrl,
      imageUrl: signedUrl,
    });
  });

  it('rejects an invalid image before calling storage', async () => {
    const file = {
      originalname: 'avatar.png',
      mimetype: 'image/png',
      size: 128,
      buffer: Buffer.from('not an image'),
    } as Express.Multer.File;

    jest.spyOn(ImageFileValidator.prototype, 'isValid').mockReturnValue(false);
    const contentSpy = jest
      .spyOn(ImageFileValidator.prototype, 'hasValidContent')
      .mockResolvedValue(false);

    await expect(
      controller.uploadCurrentUserPhoto({ user: { id: 'user-1' } }, file),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(contentSpy).not.toHaveBeenCalled();
    expect(storageService.uploadProfileImage).not.toHaveBeenCalled();
    expect(authService.updateProfilePhoto).not.toHaveBeenCalled();
  });

  it('deletes the newly uploaded object when profile persistence fails', async () => {
    const objectKey = 'profile-images/user-1/generated.png';
    const persistenceError = new Error('Database update failed');
    const file = {
      originalname: 'avatar.png',
      mimetype: 'image/png',
      size: 128,
      buffer: Buffer.from('image bytes'),
    } as Express.Multer.File;

    jest.spyOn(ImageFileValidator.prototype, 'isValid').mockReturnValue(true);
    jest
      .spyOn(ImageFileValidator.prototype, 'hasValidContent')
      .mockResolvedValue(true);

    storageService.uploadProfileImage.mockResolvedValue({
      publicId: objectKey,
    });
    authService.updateProfilePhoto.mockRejectedValue(persistenceError);
    authService.isProfilePhotoStored.mockResolvedValue(false);
    storageService.deleteProfileImage.mockResolvedValue(true);

    await expect(
      controller.uploadCurrentUserPhoto({ user: { id: 'user-1' } }, file),
    ).rejects.toBe(persistenceError);

    expect(storageService.deleteProfileImage).toHaveBeenCalledWith(
      'user-1',
      objectKey,
    );
    expect(storageService.getProfileImageDownloadUrl).not.toHaveBeenCalled();
  });

  it('preserves the persistence error when profile image cleanup also fails', async () => {
    const objectKey = 'profile-images/user-1/generated.png';
    const persistenceError = new Error('Database update failed');
    const cleanupError = new Error('Storage cleanup failed');
    const file = {
      originalname: 'avatar.png',
      mimetype: 'image/png',
      size: 128,
      buffer: Buffer.from('image bytes'),
    } as Express.Multer.File;

    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    jest.spyOn(ImageFileValidator.prototype, 'isValid').mockReturnValue(true);
    jest
      .spyOn(ImageFileValidator.prototype, 'hasValidContent')
      .mockResolvedValue(true);

    storageService.uploadProfileImage.mockResolvedValue({
      publicId: objectKey,
    });
    authService.updateProfilePhoto.mockRejectedValue(persistenceError);
    authService.isProfilePhotoStored.mockResolvedValue(false);
    storageService.deleteProfileImage.mockRejectedValue(cleanupError);

    await expect(
      controller.uploadCurrentUserPhoto({ user: { id: 'user-1' } }, file),
    ).rejects.toBe(persistenceError);

    expect(storageService.deleteProfileImage).toHaveBeenCalledWith(
      'user-1',
      objectKey,
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to clean up an unpersisted profile image:',
      cleanupError,
    );
    expect(storageService.getProfileImageDownloadUrl).not.toHaveBeenCalled();
  });

  it('preserves the uploaded object when the database confirms it was stored', async () => {
    const objectKey = 'profile-images/user-1/generated.png';
    const persistenceError = new Error('Database acknowledgement failed');
    const file = {
      originalname: 'avatar.png',
      mimetype: 'image/png',
      size: 128,
      buffer: Buffer.from('image bytes'),
    } as Express.Multer.File;

    jest.spyOn(ImageFileValidator.prototype, 'isValid').mockReturnValue(true);
    jest
      .spyOn(ImageFileValidator.prototype, 'hasValidContent')
      .mockResolvedValue(true);

    storageService.uploadProfileImage.mockResolvedValue({
      publicId: objectKey,
    });
    authService.updateProfilePhoto.mockRejectedValue(persistenceError);
    authService.isProfilePhotoStored.mockResolvedValue(true);

    await expect(
      controller.uploadCurrentUserPhoto({ user: { id: 'user-1' } }, file),
    ).rejects.toBe(persistenceError);

    expect(storageService.deleteProfileImage).not.toHaveBeenCalled();
  });

  it('preserves the uploaded object when persistence verification fails', async () => {
    const objectKey = 'profile-images/user-1/generated.png';
    const persistenceError = new Error('Database update failed');
    const verificationError = new Error('Database read failed');
    const file = {
      originalname: 'avatar.png',
      mimetype: 'image/png',
      size: 128,
      buffer: Buffer.from('image bytes'),
    } as Express.Multer.File;

    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    jest.spyOn(ImageFileValidator.prototype, 'isValid').mockReturnValue(true);
    jest
      .spyOn(ImageFileValidator.prototype, 'hasValidContent')
      .mockResolvedValue(true);

    storageService.uploadProfileImage.mockResolvedValue({
      publicId: objectKey,
    });
    authService.updateProfilePhoto.mockRejectedValue(persistenceError);
    authService.isProfilePhotoStored.mockRejectedValue(verificationError);

    await expect(
      controller.uploadCurrentUserPhoto({ user: { id: 'user-1' } }, file),
    ).rejects.toBe(persistenceError);

    expect(storageService.deleteProfileImage).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Could not verify profile image persistence; preserving uploaded object:',
      verificationError,
    );
  });
});
