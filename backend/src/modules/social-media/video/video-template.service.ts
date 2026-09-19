import { Injectable } from '@nestjs/common';

export interface PropertyVideoData {
  title: string;
  description: string;
  price: string;
  city: string;
  locality?: string | null;
  bedrooms: number;
  bathrooms: number;
  area: number;
  propertyType: string;
  furnishing: string;
  parking: boolean;
  petFriendly: boolean;
  address: string;
  imageUrls: string[];
}

@Injectable()
export class VideoTemplateService {
  buildCaption(property: PropertyVideoData): string {
    const location = [property.locality, property.city].filter(Boolean).join(', ');
    return [
      `🏠 ${property.title}`,
      `${property.bedrooms} BHK ${property.propertyType.toLowerCase()} for rent`,
      `💰 ₹${property.price}/month`,
      `📍 ${location}`,
      property.furnishing !== 'UNFURNISHED' ? `🛋️ ${property.furnishing.replace(/_/g, ' ')}` : '',
      property.parking ? '🚗 Parking available' : '',
      property.petFriendly ? '🐾 Pet friendly' : '',
      property.description?.trim() ? `📝 ${property.description.trim()}` : '',
      '',
      'View property details & schedule a visit:',
      'https://rentitease.com',
      '#RentItEase #RentalProperty #HouseForRent #ApartmentForRent',
    ].filter(Boolean).join('\n');
  }

  buildTitle(property: PropertyVideoData): string {
    return `${property.bedrooms} BHK ${property.propertyType.toLowerCase()} | ${property.city} | RentItEase`;
  }

  buildTextLines(property: PropertyVideoData): string[] {
    return [
      'Looking for a home to rent?',
      property.title,
      `${property.bedrooms} BHK • ${property.bathrooms} Bath • ${property.area} sq.ft`,
      `₹${property.price}/month`,
      [property.locality, property.city].filter(Boolean).join(', '),
    ];
  }

  buildPersistentCta(): string {
    return 'Find this property → rentitease.com';
  }
}
