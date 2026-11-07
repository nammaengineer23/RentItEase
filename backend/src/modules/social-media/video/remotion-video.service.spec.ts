import { RemotionVideoService } from './remotion-video.service';

describe('RemotionVideoService private property media', () => {
  const prisma: any = { property: { findUnique: jest.fn() } };
  const template: any = {
    buildCaption: jest.fn(() => 'caption'),
    buildTitle: jest.fn(() => 'title'),
  };
  const storage: any = { getPublicMediaDownloadUrl: jest.fn() };
  const service = new RemotionVideoService(prisma, template, storage);

  const originalRenderUrl = process.env.REMOTION_RENDER_URL;
  const originalRenderToken = process.env.REMOTION_RENDER_TOKEN;
  let fetchSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.REMOTION_RENDER_URL = 'https://renderer.example/render';
    delete process.env.REMOTION_RENDER_TOKEN;
    prisma.property.findUnique.mockResolvedValue({
      id: 'property-1',
      title: 'Test home',
      description: 'Description',
      price: { toString: () => '15000' },
      city: 'Bengaluru',
      state: 'Karnataka',
      bedrooms: 2,
      bathrooms: 2,
      area: 1000,
      propertyType: 'APARTMENT',
      furnishing: 'FURNISHED',
      parking: true,
      petFriendly: false,
      address: 'Whitefield',
      images: [{
        publicId: 'properties/cover.jpg',
        imageUrl: 'https://expired.example/cover.jpg',
      }],
      videoPublicId: 'property-videos/tour.mp4',
      videoUrl: 'https://expired.example/tour.mp4',
    });
    storage.getPublicMediaDownloadUrl
      .mockResolvedValueOnce('https://signed.example/cover.jpg')
      .mockResolvedValueOnce('https://signed.example/tour.mp4');
    fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ videoUrl: 'https://renderer.example/output.mp4', durationSeconds: 30 }),
    } as Response);
  });

  afterEach(() => {
    fetchSpy.mockRestore();
    if (originalRenderUrl === undefined) delete process.env.REMOTION_RENDER_URL;
    else process.env.REMOTION_RENDER_URL = originalRenderUrl;
    if (originalRenderToken === undefined) delete process.env.REMOTION_RENDER_TOKEN;
    else process.env.REMOTION_RENDER_TOKEN = originalRenderToken;
  });

  it('passes fresh signed property image and video URLs to the renderer', async () => {
    await service.generate('property-1');

    expect(storage.getPublicMediaDownloadUrl).toHaveBeenNthCalledWith(1, 'properties/cover.jpg');
    expect(storage.getPublicMediaDownloadUrl).toHaveBeenNthCalledWith(2, 'property-videos/tour.mp4');
    const payload = JSON.parse(fetchSpy.mock.calls[0][1]?.body as string);
    expect(payload.inputProps.imageUrls).toEqual(['https://signed.example/cover.jpg']);
    expect(payload.inputProps.propertyVideoUrl).toBe('https://signed.example/tour.mp4');
  });
});
