import { BadRequestException, ForbiddenException } from '@nestjs/common';

import { PropertyImagesService } from './property-images.service';

describe('PropertyImagesService video tours', () => {
  const property = {
    findUnique: jest.fn(),
    update: jest.fn(),
  };
  const prisma = { property } as any;
  const storage = {
    uploadImage: jest.fn(),
    uploadVideo: jest.fn(),
    deleteImage: jest.fn(),
  } as any;

  let service: PropertyImagesService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PropertyImagesService(prisma, storage);
  });

  function videoFile(durationSeconds: number): Express.Multer.File {
    const buffer = Buffer.alloc(64);
    buffer.write('mvhd', 4, 'ascii');
    buffer.writeUInt8(0, 8);
    buffer.writeUInt32BE(1000, 20);
    buffer.writeUInt32BE(durationSeconds * 1000, 24);

    return {
      buffer,
      mimetype: 'video/mp4',
      originalname: 'tour.mp4',
      size: buffer.length,
    } as Express.Multer.File;
  }

  it('rejects uploads from users who do not own the property', async () => {
    property.findUnique.mockResolvedValue({
      id: 'property-1',
      ownerId: 'owner-1',
    });

    await expect(
      service.uploadVideo(
        'property-1',
        videoFile(30),
        { id: 'other-user', role: 'USER' },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(storage.uploadImage).not.toHaveBeenCalled();
  });

  it('rejects videos over the 100 MB upload limit', async () => {
    property.findUnique.mockResolvedValue({
      id: 'property-1',
      ownerId: 'owner-1',
    });

    await expect(
      service.uploadVideo(
        'property-1',
        { ...videoFile(30), size: 101 * 1024 * 1024 },
        { id: 'owner-1', role: 'OWNER' },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(storage.uploadImage).not.toHaveBeenCalled();
  });

  it('stores one video and removes the replaced storage object', async () => {
    property.findUnique.mockResolvedValue({
      id: 'property-1',
      ownerId: 'owner-1',
      videoUrl: 'https://media.example/old.mp4',
      videoPublicId: 'r2:old.mp4',
    });
    storage.uploadVideo.mockResolvedValue({
      imageUrl: 'https://media.example/new.mp4',
      publicId: 'r2:new.mp4',
    });
    property.update.mockResolvedValue({
      id: 'property-1',
      videoUrl: 'https://media.example/new.mp4',
    });
    storage.deleteImage.mockResolvedValue(true);

    await service.uploadVideo(
      'property-1',
      videoFile(45),
      { id: 'owner-1', role: 'OWNER' },
    );

    expect(storage.uploadVideo).toHaveBeenCalledWith(
      expect.any(Object),
      'property-videos',
    );
    expect(property.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          videoUrl: 'https://media.example/new.mp4',
          videoPublicId: 'r2:new.mp4',
        },
      }),
    );
    expect(storage.deleteImage).toHaveBeenCalledWith('r2:old.mp4');
  });
});
