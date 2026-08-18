import { Injectable } from '@nestjs/common';
@Injectable()
export class HashtagService {
  generate(input: { city?: string; locality?: string; propertyType?: string; bhk?: number }) {
    const clean = (v?: string) => v?.replace(/[^a-zA-Z0-9]/g, '') || undefined;
    const tags = new Set(['RentItEase', 'PropertyRental', 'HomeForRent']);
    [clean(input.city), clean(input.locality), clean(input.propertyType)].filter(Boolean).forEach(v => tags.add(v!));
    if (input.bhk) tags.add(`${input.bhk}BHK`);
    return [...tags].slice(0, 12).map(tag => `#${tag}`);
  }
}
