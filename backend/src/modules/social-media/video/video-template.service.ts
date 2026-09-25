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

  buildTitle(property: PropertyVideoData, platform?: string): string {
    const type = property.propertyType.replace(/_/g, ' ').toLowerCase();
    const location = property.city || property.locality || 'India';
    switch (platform?.toUpperCase()) {
      case 'YOUTUBE':
        return `${property.bedrooms} BHK ${type} for rent in ${location} | ₹${property.price}/month | RentItEase`;
      case 'FACEBOOK':
        return `${property.bedrooms} BHK ${type} for rent in ${location} | RentItEase`;
      case 'INSTAGRAM':
        return `${property.bedrooms} BHK ${type} for rent • ${location}`;
      default:
        return `${property.bedrooms} BHK ${type} for rent in ${location} | RentItEase`;
    }
  }

  buildPlatformCaption(property: PropertyVideoData, platform: string): string {
    const location = [property.locality, property.city].filter(Boolean).join(', ');
    const facts = `${property.bedrooms} BHK • ${property.bathrooms} Bath • ${property.area} sq.ft`;
    const description = property.description?.trim() || 'Explore this rental property on RentItEase.';
    const features = [
      property.furnishing !== 'UNFURNISHED' ? property.furnishing.replace(/_/g, ' ') : '',
      property.parking ? 'Parking available' : '',
      property.petFriendly ? 'Pet friendly' : '',
    ].filter(Boolean).join(' • ');

    switch (platform.toUpperCase()) {
      case 'INSTAGRAM':
        return [
          `🏠 ${property.title}`,
          `📍 ${location}`,
          `💰 ₹${property.price}/month`,
          facts,
          features,
          description,
          '',
          'Find your next home on RentItEase.',
          'rentitease.com',
          '',
          `#RentItEase #HouseForRent #RentalProperty #${property.city.replace(/\\s+/g, '')}Rentals #PropertyForRent`,
        ].filter(Boolean).join('\\n');
      case 'YOUTUBE':
        return [
          `${property.title} — ${facts}`,
          `Rent: ₹${property.price}/month | Location: ${location}`,
          features,
          description,
          '',
          'View property details and schedule a visit on RentItEase:',
          'https://rentitease.com',
          '',
          '#RentItEase #HouseForRent #RentalProperty',
        ].filter(Boolean).join('\\n');
      case 'FACEBOOK':
      default:
        return [
          `🏠 ${property.title}`,
          `${facts} • ₹${property.price}/month`,
          `📍 ${location}`,
          features,
          description,
          '',
          'View details and schedule a visit: https://rentitease.com',
          '#RentItEase #RentalProperty #HouseForRent',
        ].filter(Boolean).join('\\n');
    }
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
