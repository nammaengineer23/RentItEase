import { Injectable } from '@nestjs/common';
import { createReadStream } from 'node:fs';
import { google } from 'googleapis';

@Injectable()
export class YouTubeService {
  async publish(params: {
    filePath: string;
    title: string;
    description: string;
  }): Promise<{ externalId: string; url?: string }> {
    const clientId = process.env.YOUTUBE_CLIENT_ID;
    const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
    const refreshToken = process.env.YOUTUBE_REFRESH_TOKEN;

    if (!clientId || !clientSecret || !refreshToken) {
      throw new Error('YouTube publishing is not configured. Set YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET and YOUTUBE_REFRESH_TOKEN.');
    }

    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, process.env.YOUTUBE_REDIRECT_URI);
    oauth2Client.setCredentials({ refresh_token: refreshToken });

    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
    const response = await youtube.videos.insert({
      part: ['snippet', 'status'],
      requestBody: {
        snippet: {
          title: params.title.slice(0, 100),
          description: params.description,
          categoryId: '22',
        },
        status: {
          privacyStatus: process.env.YOUTUBE_DEFAULT_PRIVACY || 'private',
        },
      },
      media: {
        body: createReadStream(params.filePath),
      },
    });

    const id = response.data.id;
    if (!id) throw new Error('YouTube did not return a video ID.');

    return { externalId: id, url: `https://www.youtube.com/watch?v=${id}` };
  }
}
