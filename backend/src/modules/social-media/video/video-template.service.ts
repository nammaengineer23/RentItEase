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
      '',
      'Schedule a property visit with RentItEase.',
      '#RentItEase #RentalProperty #HouseForRent #ApartmentForRent #BangaloreRentals',
    ].filter(Boolean).join('\n');
  }

  buildTitle(property: PropertyVideoData): string {
    return `${property.bedrooms} BHK ${property.propertyType.toLowerCase()} | ${property.city} | RentItEase`;
  }

  buildTextLines(property: PropertyVideoData): string[] {
    return [
      property.title,
      `${property.bedrooms} BHK • ${property.bathrooms} Bath • ${property.area} sq.ft`,
      `₹${property.price}/month`,
      [property.locality, property.city].filter(Boolean).join(', '),
      'Schedule a Visit • RentItEase',
    ];
  }
}
