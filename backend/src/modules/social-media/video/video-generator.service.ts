import { Injectable, Logger } from '@nestjs/common';
import { execFile } from 'node:child_process';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

@Injectable()
export class VideoGeneratorService {
  private readonly logger = new Logger(VideoGeneratorService.name);
  private readonly outputRoot = join(process.cwd(), 'tmp', 'social-media');

  private readonly mixkitMusicUrls = [
    'https://assets.mixkit.co/music/preview/mixkit-happy-home-801.mp3',
    'https://assets.mixkit.co/music/preview/mixkit-upbeat-jazz-644.mp3',
    'https://assets.mixkit.co/music/preview/mixkit-raising-me-higher-34.mp3',
    'https://assets.mixkit.co/music/preview/mixkit-rising-sun-523.mp3',
    'https://assets.mixkit.co/music/preview/mixkit-dance-with-me-3.mp3',
    'https://assets.mixkit.co/music/preview/mixkit-summers-here-91.mp3',
    'https://assets.mixkit.co/music/preview/mixkit-feeling-happy-5.mp3',
  ];

  private fontFile(): string | undefined {
    const configured = process.env.FFMPEG_FONT_FILE;
    if (configured) return configured;
    if (process.platform === 'win32') return 'C:\\Windows\\Fonts\\arial.ttf';
    // Let ffmpeg/fontconfig resolve the installed DejaVu font on Linux.
    // Nix/Railway store paths are not guaranteed to match Debian's /usr/share path.
    return undefined;
  }

  async generate(params: {
    imageUrls: string[];
    lines: string[];
    slug: string;
    secondsPerPhoto?: number;
    persistentCta?: string;
  }): Promise<{ filePath: string; durationSeconds: number }> {
    if (!params.imageUrls.length) {
      throw new Error('The property has no images available for video generation.');
    }

    await mkdir(this.outputRoot, { recursive: true });
    const workDir = join(this.outputRoot, `${params.slug}-${Date.now()}`);
    await mkdir(workDir, { recursive: true });

    const seconds = params.secondsPerPhoto ?? 3;
    const clipPaths: string[] = [];

    try {
      for (let index = 0; index < params.imageUrls.length; index += 1) {
        const url = params.imageUrls[index];
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Unable to download property image (${response.status}): ${url}`);
        }

        const contentType = response.headers.get('content-type') ?? 'image/jpeg';
        const extension = contentType.includes('png') ? '.png'
          : contentType.includes('webp') ? '.webp'
          : extname(new URL(url).pathname) || '.jpg';

        const imagePath = join(workDir, `image-${index}${extension}`);
        await writeFile(imagePath, Buffer.from(await response.arrayBuffer()));

        const clipPath = join(workDir, `clip-${index}.mp4`);
        await execFileAsync(process.env.FFMPEG_PATH || 'ffmpeg', [
          '-y',
          '-loop', '1',
          '-i', imagePath,
          '-t', String(seconds),
          '-vf', 'scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2,setsar=1',
          '-r', '30',
          '-an',
          '-c:v', 'libx264',
          '-preset', 'veryfast',
          '-pix_fmt', 'yuv420p',
          clipPath,
        ]);
        clipPaths.push(clipPath);
      }

      const concatFile = join(workDir, 'concat.txt');
      await writeFile(
        concatFile,
        clipPaths.map((file) => `file '${file.replace(/'/g, "'\\''")}'`).join('\n'),
        'utf8',
      );

      const rawVideo = join(workDir, 'raw.mp4');
      const finalVideo = join(workDir, 'rentease-property-reel.mp4');

      await execFileAsync(process.env.FFMPEG_PATH || 'ffmpeg', [
        '-y',
        '-f', 'concat',
        '-safe', '0',
        '-i', concatFile,
        '-c', 'copy',
        rawVideo,
      ]);

      const font = this.fontFile();
      const escapedLines = params.lines.map((line) =>
        line.replace(/\\/g, '\\\\').replace(/:/g, '\\:').replace(/'/g, "\\'"),
      );

      const filters: string[] = [];
      if (escapedLines.length) {
        escapedLines.forEach((line, index) => {
          const fontOption = font
            ? `fontfile='${font.replace(/\\/g, '/').replace(/:/g, '\\:')}':`
            : "font='DejaVu Sans':";
          filters.push(
            `drawtext=${fontOption}text='${line}':fontcolor=white:fontsize=${index === 0 ? 48 : 36}:x=(w-text_w)/2:y=${120 + index * 62}:box=1:boxcolor=black@0.45:boxborderw=18`,
          );
        });
      }

      if (params.persistentCta) {
        const cta = params.persistentCta
          .replace(/\\/g, '\\\\')
          .replace(/:/g, '\\:')
          .replace(/'/g, "\\'");
        const fontOption = font
          ? `fontfile='${font.replace(/\\/g, '/').replace(/:/g, '\\:')}':`
          : "font='DejaVu Sans':";
        filters.push(
          `drawtext=${fontOption}text='${cta}':fontcolor=white:fontsize=42:x=(w-text_w)/2:y=h-190:box=1:boxcolor=0x5B2EFF@0.90:boxborderw=24`,
        );
      }

      const vf = filters.length ? filters.join(',') : 'format=yuv420p';
      let musicFile = process.env.SOCIAL_BACKGROUND_MUSIC_FILE;
      if (!musicFile) {
        const musicUrl = this.mixkitMusicUrls[Math.floor(Math.random() * this.mixkitMusicUrls.length)];
        try {
          const musicResponse = await fetch(musicUrl);
          if (!musicResponse.ok) {
            throw new Error(`Mixkit music download returned ${musicResponse.status}`);
          }
          musicFile = join(workDir, 'background-music.mp3');
          await writeFile(musicFile, Buffer.from(await musicResponse.arrayBuffer()));
          this.logger.log(`Using Mixkit background music: ${new URL(musicUrl).pathname.split('/').pop()}`);
        } catch (error) {
          this.logger.warn(`Unable to load Mixkit background music; generating reel without music: ${String(error)}`);
        }
      }

      const args = ['-y', '-i', rawVideo];
      if (musicFile) args.push('-stream_loop', '-1', '-i', musicFile);
      args.push('-vf', vf, '-r', '30', '-c:v', 'libx264', '-preset', 'veryfast', '-pix_fmt', 'yuv420p');
      if (musicFile) {
        args.push('-filter:a', 'volume=0.16', '-c:a', 'aac', '-b:a', '128k', '-shortest');
      } else {
        args.push('-an');
      }
      args.push('-movflags', '+faststart', finalVideo);
      await execFileAsync(process.env.FFMPEG_PATH || 'ffmpeg', args);

      const durationSeconds = params.imageUrls.length * seconds;
      return { filePath: finalVideo, durationSeconds };
    } catch (error) {
      this.logger.error(`Video generation failed for ${params.slug}`, error);
      throw error;
    } finally {
      // Keep the generated file; remove only temporary source files.
      const finalVideo = join(workDir, 'rentease-property-reel.mp4');
      try {
        const exists = await readFile(finalVideo);
        if (exists.length === 0) await rm(workDir, { recursive: true, force: true });
      } catch {
        await rm(workDir, { recursive: true, force: true });
      }
    }
  }

  async read(filePath: string): Promise<Buffer> {
    return readFile(filePath);
  }
}
