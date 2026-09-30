import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { createReadStream } from 'node:fs';
import { google } from 'googleapis';
@Injectable()
export class YouTubeService {
  async publish(params: { filePath: string; title: string; description: string }): Promise<{ externalId: string; url?: string }> {
    const clientId = process.env.YOUTUBE_CLIENT_ID;
    const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
    const refreshToken = process.env.YOUTUBE_REFRESH_TOKEN;
    if (!clientId || !clientSecret || !refreshToken) throw new ServiceUnavailableException('YouTube publishing is not configured.');
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, process.env.YOUTUBE_REDIRECT_URI);
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
    for (let attempt = 1; attempt <= 2; attempt += 1) {
      try {
        const response = await youtube.videos.insert({ part: ['snippet', 'status'], requestBody: { snippet: { title: params.title.slice(0, 100), description: params.description.slice(0, 5000), categoryId: '22' }, status: { privacyStatus: process.env.YOUTUBE_DEFAULT_PRIVACY || 'private' } }, media: { body: createReadStream(params.filePath) } });
        const id = response.data.id;
        if (!id) throw new Error('YouTube did not return a video ID.');
        return { externalId: id, url: 'https://www.youtube.com/watch?v=' + id };
      } catch (error) {
        const status = (error as { response?: { status?: number } })?.response?.status;
        if (attempt === 2 || (status !== 429 && (!status || status < 500))) throw new Error('YouTube provider rejected the upload.');
        await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
      }
    }
    throw new Error('YouTube provider unavailable.');
  }
}