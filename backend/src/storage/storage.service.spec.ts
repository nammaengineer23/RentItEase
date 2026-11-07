import { FirebaseService } from '../firebase/firebase.service';
import { StorageService } from './storage.service';

describe('StorageService', () => {
  const file = {
    originalname: 'photo.jpg',
  } as Express.Multer.File;

  const firebaseService = {
    uploadImage: jest.fn(),
    uploadPrivateFile: jest.fn(),
    deleteImage: jest.fn(),
    getPrivateDownloadUrl: jest.fn(),
    getPublicMediaDownloadUrl: jest.fn(),
  } as unknown as FirebaseService;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uses Firebase as the sole authoritative upload provider', async () => {
    const service = new StorageService(firebaseService);

    await service.uploadImage(file, 'properties');

    expect(firebaseService.uploadImage).toHaveBeenCalledWith(file, 'properties');
  });

  it('uses Firebase for deletion', async () => {
    const service = new StorageService(firebaseService);

    await service.deleteImage('properties/legacy.jpg');

    expect(firebaseService.deleteImage).toHaveBeenCalledWith(
      'properties/legacy.jpg',
    );
  });

  it('exposes short-lived signed URLs for public property media objects', async () => {
    const service = new StorageService(firebaseService);

    await service.getPublicMediaDownloadUrl('properties/photo.jpg');

    expect(firebaseService.getPublicMediaDownloadUrl).toHaveBeenCalledWith(
      'properties/photo.jpg',
      60 * 60 * 1000,
    );
  });

  it('supports private Firebase uploads and short-lived private URLs', async () => {
    const service = new StorageService(firebaseService);

    await service.uploadPrivateFile(file, 'chat/conversation-1');
    await service.getPrivateDownloadUrl('chat/conversation-1/file.pdf');

    expect(firebaseService.uploadPrivateFile).toHaveBeenCalledWith(
      file,
      'chat/conversation-1',
    );
    expect(firebaseService.getPrivateDownloadUrl).toHaveBeenCalledWith(
      'chat/conversation-1/file.pdf',
      15 * 60 * 1000,
    );
  });
});
