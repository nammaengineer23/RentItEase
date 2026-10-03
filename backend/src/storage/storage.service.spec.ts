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
  } as unknown as FirebaseService;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uses Firebase as the sole authoritative upload provider', async () => {
    const service = new StorageService(firebaseService);

    await service.uploadImage(file, 'profiles');

    expect(firebaseService.uploadImage).toHaveBeenCalledWith(file, 'profiles');
  });

  it('uses Firebase for deletion', async () => {
    const service = new StorageService(firebaseService);

    await service.deleteImage('properties/legacy.jpg');

    expect(firebaseService.deleteImage).toHaveBeenCalledWith(
      'properties/legacy.jpg',
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
    );
  });
});
