import {
  BadGatewayException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { VideoTemplateService } from './video-template.service';

type CreatomateRender = {
  id?: string;
  status?: string;
  url?: string;
  error_message?: string;
  duration?: number;
};

@Injectable()
export class CreatomateVideoService {
  private readonly apiBase = 'https://api.creatomate.com/v2';

  constructor(
    private readonly prisma: PrismaService,
    private readonly template: VideoTemplateService,
  ) {}

  async generate(propertyId: string) {
    const apiKey = process.env.CREATOMATE_API_KEY?.trim();
    const templateId = process.env.CREATOMATE_TEMPLATE_ID?.trim();
    if (!apiKey || !templateId) {
      throw new ServiceUnavailableException(
        'Creatomate is not configured. Set CREATOMATE_API_KEY and CREATOMATE_TEMPLATE_ID.',
      );
    }

    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      include: {
        images: { orderBy: { displayOrder: 'asc' } },
        amenities: { include: { amenity: true } },
      },
    });
    if (!property) throw new NotFoundException('Property not found.');

    const imageUrls = property.images
      .map((image) => image.imageUrl)
      .filter((url): url is string => Boolean(url))
      .slice(0, 6);
    if (imageUrls.length === 0 && !property.videoUrl) {
      throw new ServiceUnavailableException(
        'Add at least one property photo or video before generating a reel.',
      );
    }

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
      imageUrls,
    };

    const modifications: Record<string, unknown> = {
      [process.env.CREATOMATE_TITLE_ELEMENT || 'Title']: property.title,
      [process.env.CREATOMATE_PRICE_ELEMENT || 'Price']: `₹${property.price}/month`,
      [process.env.CREATOMATE_LOCATION_ELEMENT || 'Location']:
        [property.locality, property.city].filter(Boolean).join(', '),
      [process.env.CREATOMATE_CTA_ELEMENT || 'CTA']:
        'Find your next home on RentItEase • rentitease.com',
    };

    imageUrls.forEach((url, index) => {
      modifications[`${process.env.CREATOMATE_IMAGE_PREFIX || 'Image-'}${index + 1}`] = url;
    });

    // A template may optionally expose a Video element. When present, this lets
    // Creatomate handle scaling/compositing instead of Railway/FFmpeg.
    if (property.videoUrl) {
      modifications[process.env.CREATOMATE_VIDEO_ELEMENT || 'Video'] = property.videoUrl;
    }

    const created = await this.request<CreatomateRender | CreatomateRender[]>(
      '/renders',
      apiKey,
      {
        method: 'POST',
        body: JSON.stringify({
          template_id: templateId,
          modifications,
          max_width: 1080,
          max_height: 1920,
          metadata: JSON.stringify({ propertyId }),
        }),
      },
    );
    const render = Array.isArray(created) ? created[0] : created;
    if (!render?.id) {
      throw new BadGatewayException('Creatomate did not return a render ID.');
    }

    const completed = await this.waitForRender(render.id, apiKey);
    if (completed.status !== 'succeeded' || !completed.url) {
      throw new BadGatewayException(
        completed.error_message || 'Creatomate reel generation failed.',
      );
    }

    return {
      propertyId,
      title: property.title,
      videoUrl: completed.url,
      durationSeconds: completed.duration ?? 0,
      caption: this.template.buildCaption(data),
      videoTitle: this.template.buildTitle(data),
      renderId: completed.id,
      source: 'CREATOMATE',
    };
  }

  private async waitForRender(renderId: string, apiKey: string) {
    const deadline = Date.now() + 5 * 60_000;
    while (Date.now() < deadline) {
      const render = await this.request<CreatomateRender>(
        `/renders/${encodeURIComponent(renderId)}`,
        apiKey,
      );
      if (render.status === 'succeeded' || render.status === 'failed') return render;
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
    throw new ServiceUnavailableException(
      'Creatomate is still rendering the reel. Please try again shortly.',
    );
  }

  private async request<T>(
    path: string,
    apiKey: string,
    init: RequestInit = {},
  ): Promise<T> {
    let response: Response;
    try {
      response = await fetch(`${this.apiBase}${path}`, {
        ...init,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          ...(init.headers || {}),
        },
      });
    } catch {
      throw new ServiceUnavailableException('Could not connect to Creatomate.');
    }

    const raw = await response.text();
    let payload: any;
    try {
      payload = raw ? JSON.parse(raw) : {};
    } catch {
      payload = { message: raw };
    }

    if (!response.ok) {
      const message =
        payload?.error_message ||
        payload?.message ||
        payload?.error ||
        `Creatomate request failed with HTTP ${response.status}.`;
      throw new BadGatewayException(String(message));
    }
    if (!payload) {
      throw new InternalServerErrorException('Creatomate returned an empty response.');
    }
    return payload as T;
  }
}
