import { Injectable } from '@nestjs/common';
import { FacebookService } from './facebook.service';
import { InstagramService } from './instagram.service';
import { YouTubeService } from './youtube.service';

export type PublishPlatform = 'INSTAGRAM' | 'FACEBOOK' | 'YOUTUBE';

@Injectable()
export class PublishingService {
  constructor(
    private readonly instagram: InstagramService,
    private readonly facebook: FacebookService,
    private readonly youtube: YouTubeService,
  ) {}

  async publish(platform: PublishPlatform, params: {
    videoUrl?: string;
    filePath?: string;
    caption: string;
    title: string;
  }) {
    switch (platform) {
      case 'INSTAGRAM':
        if (!params.videoUrl) throw new Error('Instagram requires a public video URL.');
        return this.instagram.publish({ videoUrl: params.videoUrl, caption: params.caption });
      case 'FACEBOOK':
        if (!params.videoUrl) throw new Error('Facebook requires a public video URL.');
        return this.facebook.publish({ videoUrl: params.videoUrl, caption: params.caption });
      case 'YOUTUBE':
        if (!params.filePath) throw new Error('YouTube requires the generated local video file.');
        return this.youtube.publish({
          filePath: params.filePath,
          title: params.title,
          description: params.caption,
        });
    }
  }
}
