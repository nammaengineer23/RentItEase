import {
  BadGatewayException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { VideoTemplateService } from './video-template.service';

type RemotionRenderResponse = {
  videoUrl?: string;
  durationSeconds?: number;
  renderId?: string;
  error?: string;
};

@Injectable()
export class RemotionVideoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly template: VideoTemplateService,
  ) {}

  async generate(propertyId: string) {
    const renderUrl = process.env.REMOTION_RENDER_URL?.trim();
    if (!renderUrl) {
      throw new ServiceUnavailableException(
        'Remotion renderer is not configured. Set REMOTION_RENDER_URL.',
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
      .slice(0, 8);
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

    let response: Response;
    try {
      response = await fetch(renderUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(process.env.REMOTION_RENDER_TOKEN
            ? { Authorization: `Bearer ${process.env.REMOTION_RENDER_TOKEN}` }
            : {}),
        },
        body: JSON.stringify({
          propertyId,
          composition: 'RentItEasePropertyReel',
          width: 1080,
          height: 1920,
          fps: 30,
          inputProps: {
            title: property.title,
            price: property.price.toString(),
            location: [property.city, property.state].filter(Boolean).join(', '),
            bedrooms: property.bedrooms,
            bathrooms: property.bathrooms,
            area: property.area,
            propertyType: property.propertyType,
            imageUrls,
            propertyVideoUrl: property.videoUrl || null,
            cta: 'Find your next home on RentItEase • rentitease.com',
          },
        }),
      });
    } catch {
      throw new ServiceUnavailableException('Could not connect to the Remotion renderer.');
    }

    let result: RemotionRenderResponse;
    try {
      result = (await response.json()) as RemotionRenderResponse;
    } catch {
      throw new BadGatewayException('Remotion renderer returned an invalid response.');
    }
    if (!response.ok || !result.videoUrl) {
      throw new BadGatewayException(
        result.error || `Remotion rendering failed with HTTP ${response.status}.`,
      );
    }

    return {
      propertyId,
      title: property.title,
      videoUrl: result.videoUrl,
      durationSeconds: result.durationSeconds ?? 0,
      caption: this.template.buildCaption(data),
      videoTitle: this.template.buildTitle(data),
      renderId: result.renderId,
      source: 'REMOTION',
    };
  }
}
