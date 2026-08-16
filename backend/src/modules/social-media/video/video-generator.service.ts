import { Injectable, Logger } from '@nestjs/common';
import { execFile } from 'node:child_process';
import { createWriteStream } from 'node:fs';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

@Injectable()
export class VideoGeneratorService {
  private readonly logger = new Logger(VideoGeneratorService.name);
  private readonly outputRoot = join(process.cwd(), 'tmp', 'social-media');

  private fontFile(): string | undefined {
    const configured = process.env.FFMPEG_FONT_FILE;
    if (configured) return configured;
    if (process.platform === 'win32') return 'C:\\Windows\\Fonts\\arial.ttf';
    return '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf';
  }

  async generate(params: {
    imageUrls: string[];
    lines: string[];
    slug: string;
    secondsPerPhoto?: number;
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
      if (font && escapedLines.length) {
        escapedLines.forEach((line, index) => {
          filters.push(
            `drawtext=fontfile='${font.replace(/\\/g, '/').replace(/:/g, '\\:')}':text='${line}':fontcolor=white:fontsize=${index === 0 ? 48 : 36}:x=(w-text_w)/2:y=${120 + index * 62}:box=1:boxcolor=black@0.45:boxborderw=18`,
          );
        });
      }

      const vf = filters.length ? filters.join(',') : 'format=yuv420p';
      await execFileAsync(process.env.FFMPEG_PATH || 'ffmpeg', [
        '-y',
        '-i', rawVideo,
        '-vf', vf,
        '-r', '30',
        '-c:v', 'libx264',
        '-preset', 'veryfast',
        '-pix_fmt', 'yuv420p',
        '-movflags', '+faststart',
        finalVideo,
      ]);

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
