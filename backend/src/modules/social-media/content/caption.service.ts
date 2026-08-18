import { Injectable } from '@nestjs/common';

export interface PropertyMarketingInput { title?: string; propertyType?: string; bhk?: number; rent?: number; city?: string; locality?: string; furnishing?: string; amenities?: string[]; }

@Injectable()
export class CaptionService {
  generate(input: PropertyMarketingInput) {
    const title = input.title || `${input.bhk ?? ''} ${input.propertyType || 'Property'}`.trim();
    const location = [input.locality, input.city].filter(Boolean).join(', ');
    const rent = input.rent != null ? `₹${input.rent.toLocaleString('en-IN')}/month` : 'Contact RentItEase';
    const features = (input.amenities || []).slice(0, 5).join(' • ');
    return { caption: [`🏠 ${title}`, location ? `📍 ${location}` : '', `💰 ${rent}`, input.furnishing ? `🛋️ ${input.furnishing}` : '', features ? `✨ ${features}` : '', '', 'Find this property on RentItEase and schedule a visit.'].filter(Boolean).join('\n'), cta: 'View Property • Schedule a Visit' };
  }
}
