import { Injectable, NotFoundException } from '@nestjs/common';
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

    const generated = await this.generator.generate({
      imageUrls: data.imageUrls,
      lines: this.template.buildTextLines(data),
      slug: propertyId,
      secondsPerPhoto,
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
}
