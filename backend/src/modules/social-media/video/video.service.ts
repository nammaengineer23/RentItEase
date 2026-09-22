import { Injectable, NotFoundException } from '@nestjs/common';
import { extname, join } from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';
import { PrismaService } from '../../../database/prisma.service';
import { VideoGeneratorService } from './video-generator.service';
import { VideoTemplateService } from './video-template.service';

@Injectable()
export class VideoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly generator: VideoGeneratorService,
    private readonly template: VideoTemplateService,
  ) {}

  async generate(propertyId: string, secondsPerPhoto = 3) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      include: {
        images: { orderBy: { displayOrder: 'asc' } },
        amenities: { include: { amenity: true } },
      },
    });

    if (!property) throw new NotFoundException('Property not found');

    const data = {
      title: property.title,
      description: property.description,
      price: property.price.toString(),
      city: property.city,
      locality: property.locality,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      area: property.area,
      propertyType: property.propertyType,
      furnishing: property.furnishing,
      parking: property.parking,
      petFriendly: property.petFriendly,
      address: property.address,
      imageUrls: property.images.map((image) => image.imageUrl),
    };

    const generated = property.videoUrl
      ? await this.prepareUploadedPropertyVideo(propertyId, property.videoUrl)
      : await this.generator.generate({
          imageUrls: data.imageUrls,
          lines: this.template.buildTextLines(data),
          slug: propertyId,
          secondsPerPhoto,
          persistentCta: this.template.buildPersistentCta(),
        });

    return {
      propertyId,
      title: property.title,
      filePath: generated.filePath,
      durationSeconds: generated.durationSeconds,
      caption: this.template.buildCaption(data),
      videoTitle: this.template.buildTitle(data),
    };
  }

  private async prepareUploadedPropertyVideo(
    propertyId: string,
    videoUrl: string,
  ): Promise<{ filePath: string; durationSeconds: number }> {
    const response = await fetch(videoUrl);
    if (!response.ok) {
      throw new Error(`Unable to download uploaded property video (${response.status}).`);
    }

    const outputRoot = join(process.cwd(), 'tmp', 'social-media', `${propertyId}-uploaded-${Date.now()}`);
    await mkdir(outputRoot, { recursive: true });
    const extension = extname(new URL(videoUrl).pathname) || '.mp4';
    const sourcePath = join(outputRoot, `property-video${extension}`);
    await writeFile(sourcePath, Buffer.from(await response.arrayBuffer()));

    // Property videos are already validated to <=60 seconds during upload.
    // Re-encode to a platform-friendly vertical H.264/AAC MP4 so the same
    // source works reliably for Instagram, Facebook and YouTube publishing.
    const outputPath = join(outputRoot, 'rentease-property-reel.mp4');
    const { execFile } = await import('node:child_process');
    const { promisify } = await import('node:util');
    const execFileAsync = promisify(execFile);
    await execFileAsync(process.env.FFMPEG_PATH || 'ffmpeg', [
      '-y',
      '-i', sourcePath,
      '-vf', 'scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2,setsar=1',
      '-r', '30',
      '-c:v', 'libx264',
      '-preset', 'veryfast',
      '-pix_fmt', 'yuv420p',
      '-c:a', 'aac',
      '-b:a', '128k',
      '-movflags', '+faststart',
      outputPath,
    ]);

    let durationSeconds = 0;
    try {
      const { stdout } = await execFileAsync(process.env.FFPROBE_PATH || 'ffprobe', [
        '-v', 'error',
        '-show_entries', 'format=duration',
        '-of', 'default=noprint_wrappers=1:nokey=1',
        outputPath,
      ]);
      durationSeconds = Number.parseFloat(stdout.trim()) || 0;
    } catch {
      durationSeconds = 0;
    }
    return { filePath: outputPath, durationSeconds };
  }
}
