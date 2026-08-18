import { Injectable } from '@nestjs/common';
@Injectable()
export class ContentValidatorService {
  validate(input: { propertyStatus?: string; ownerMarketingConsent?: boolean; photos?: Array<{ url?: string }>; rent?: number; city?: string }) {
    const errors: string[] = [];
    if (input.propertyStatus && input.propertyStatus !== 'AVAILABLE') errors.push('Property is not available for social promotion.');
    if (input.ownerMarketingConsent !== true) errors.push('Owner marketing consent is required.');
    if (!input.photos?.length) errors.push('At least one property photo is required.');
    if (!input.city) errors.push('Property city is required.');
    if (input.rent == null) errors.push('Property rent is required.');
    return { valid: errors.length === 0, errors };
  }
}
