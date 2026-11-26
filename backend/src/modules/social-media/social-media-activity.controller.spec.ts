import { SocialMediaActivityController } from './social-media-activity.controller';

describe('SocialMediaActivityController private reel URL responses', () => {
  const prisma: any = {
    socialMediaPost: { findMany: jest.fn() },
  };
  const storage: any = {
    getVideoDownloadUrl: jest.fn(),
  };
  const controller = new SocialMediaActivityController(prisma, storage);

  beforeEach(() => jest.clearAllMocks());

  it('resolves stored GCS references to signed URLs in the activity API', async () => {
    prisma.socialMediaPost.findMany.mockResolvedValue([{
      id: 'post-1',
      videoUrl: 'gcs://bucket/social-videos/property-1/reel.mp4',
      platform: 'INSTAGRAM',
    }]);
    storage.getVideoDownloadUrl.mockResolvedValue('https://signed.example/reel.mp4');

    const result = await controller.list();

    expect(result[0].videoUrl).toBe('https://signed.example/reel.mp4');
    expect(storage.getVideoDownloadUrl).toHaveBeenCalledWith(
      'gcs://bucket/social-videos/property-1/reel.mp4',
    );
  });
});
