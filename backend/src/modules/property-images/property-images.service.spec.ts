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
      videoPublicId: 'property-videos/old.mp4',
    });
    jest.spyOn(service as any, 'readVideoDurationSeconds').mockResolvedValue(45);
    storage.uploadVideo.mockResolvedValue({
      imageUrl: 'https://media.example/new.mp4',
      publicId: 'property-videos/new.mp4',
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
          videoPublicId: 'property-videos/new.mp4',
        },
      }),
    );
    expect(storage.deleteImage).toHaveBeenCalledWith('property-videos/old.mp4');
  });
  it('clears the video reference and tolerates object cleanup failure', async () => {
    property.findUnique.mockResolvedValue({
      id: 'property-1',
      ownerId: 'owner-1',
      videoUrl: 'https://media.example/old.mp4',
      videoPublicId: 'property-videos/old.mp4',
    });
    property.update.mockResolvedValue({});
    storage.deleteImage.mockRejectedValue(new Error('temporary storage outage'));

    await expect(service.deleteVideo(
      'property-1',
      { id: 'owner-1', role: 'OWNER' },
    )).resolves.toMatchObject({ success: true });

    expect(property.update).toHaveBeenCalledWith({
      where: { id: 'property-1' },
      data: { videoUrl: null, videoPublicId: null },
    });
    expect(storage.deleteImage).toHaveBeenCalledWith('property-videos/old.mp4');
    expect(property.update.mock.invocationCallOrder[0])
      .toBeLessThan(storage.deleteImage.mock.invocationCallOrder[0]);
  });

  it('blocks replacing a video with a legacy non-Firebase storage key', async () => {
    property.findUnique.mockResolvedValue({
      id: 'property-1',
      ownerId: 'owner-1',
      videoUrl: 'https://legacy.example/old.mp4',
      videoPublicId: 'r2:old.mp4',
    });

    await expect(service.uploadVideo(
      'property-1',
      videoFile(30),
      { id: 'owner-1', role: 'OWNER' },
    )).rejects.toThrow('legacy storage key');

    expect(storage.uploadVideo).not.toHaveBeenCalled();
    expect(property.update).not.toHaveBeenCalled();
  });

  it('clears the database reference before attempting video object cleanup', async () => {
    property.findUnique.mockResolvedValue({
      id: 'property-1',
      ownerId: 'owner-1',
      videoUrl: 'https://media.example/old.mp4',
      videoPublicId: 'property-videos/old.mp4',
    });
    property.update.mockResolvedValue({});
    storage.deleteImage.mockRejectedValue(new Error('storage unavailable'));
    await expect(service.deleteVideo('property-1', {
      id: 'owner-1',
      role: 'OWNER',
    })).resolves.toEqual({
      success: true,
      message: 'Property video deleted successfully.',
    });

    expect(property.update).toHaveBeenCalledWith({
      where: { id: 'property-1' },
      data: { videoUrl: null, videoPublicId: null },
    });
    expect(property.update.mock.invocationCallOrder[0])
      .toBeLessThan(storage.deleteImage.mock.invocationCallOrder[0]);
  });

  it('does not delete the storage object when clearing video metadata fails', async () => {
    property.findUnique.mockResolvedValue({
      id: 'property-1',
      ownerId: 'owner-1',
      videoUrl: 'https://media.example/old.mp4',
      videoPublicId: 'property-videos/old.mp4',
    });
    property.update.mockRejectedValue(new Error('database unavailable'));

    await expect(service.deleteVideo('property-1', {
      id: 'owner-1',
      role: 'OWNER',
    })).rejects.toThrow('database unavailable');

    expect(storage.deleteImage).not.toHaveBeenCalled();
  });

});

describe('PropertyImagesService image deletion consistency', () => {
  const property = { findUnique: jest.fn() };
  const propertyImage = {
    findFirst: jest.fn(),
    delete: jest.fn(),
    update: jest.fn(),
  };
  const tx = { propertyImage };
  const prisma = {
    property,
    propertyImage,
    $transaction: jest.fn(async (callback: (client: typeof tx) => unknown) => callback(tx)),
  } as any;
  const storage = { deleteImage: jest.fn() } as any;
  let service: PropertyImagesService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PropertyImagesService(prisma, storage);
    property.findUnique.mockResolvedValue({ id: 'property-1', ownerId: 'owner-1' });
    storage.deleteImage.mockResolvedValue(true);
  });

  it('deletes a primary image and promotes its replacement atomically before storage cleanup', async () => {
    propertyImage.findFirst
      .mockResolvedValueOnce({
        id: 'image-1',
        propertyId: 'property-1',
        publicId: 'properties/image-1.jpg',
        isPrimary: true,
      })
      .mockResolvedValueOnce({ id: 'image-2' });

    await expect(service.deleteImage(
      'property-1',
      'image-1',
      { id: 'owner-1', role: 'OWNER' },
    )).resolves.toMatchObject({ success: true });

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(propertyImage.delete).toHaveBeenCalledWith({ where: { id: 'image-1' } });
    expect(propertyImage.update).toHaveBeenCalledWith({
      where: { id: 'image-2' },
      data: { isPrimary: true },
    });
    expect(prisma.$transaction.mock.invocationCallOrder[0])
      .toBeLessThan(storage.deleteImage.mock.invocationCallOrder[0]);
  });

  it('keeps the storage object when the database transaction fails', async () => {
    propertyImage.findFirst.mockResolvedValue({
      id: 'image-1',
      propertyId: 'property-1',
      publicId: 'properties/image-1.jpg',
      isPrimary: false,
    });
    prisma.$transaction.mockRejectedValueOnce(new Error('database unavailable'));

    await expect(service.deleteImage(
      'property-1',
      'image-1',
      { id: 'owner-1', role: 'OWNER' },
    )).rejects.toThrow('database unavailable');

    expect(storage.deleteImage).not.toHaveBeenCalled();
  });

  it('does not fail the completed database deletion when object cleanup fails', async () => {
    propertyImage.findFirst.mockResolvedValue({
      id: 'image-1',
      propertyId: 'property-1',
      publicId: 'properties/image-1.jpg',
      isPrimary: false,
    });
    storage.deleteImage.mockRejectedValue(new Error('temporary storage outage'));

    await expect(service.deleteImage(
      'property-1',
      'image-1',
      { id: 'owner-1', role: 'OWNER' },
    )).resolves.toMatchObject({ success: true });

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(storage.deleteImage).toHaveBeenCalledWith('properties/image-1.jpg');
  });
});
