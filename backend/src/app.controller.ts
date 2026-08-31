import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('privacy-policy')
  privacyPolicy(@Res() response: Response): void {
    response.type('html').send(legalPage('Privacy Policy', `
      <p>Effective date: August 31, 2026</p>
      <p>RentItEase helps tenants discover rental properties and lets verified property owners manage listings, visits, bookings, and communications.</p>
      <h2>Information we collect</h2>
      <p>We collect account information such as your name, email address, mobile number, profile photo (when supplied), property and booking information, messages, reviews, and device or usage data needed to operate the service.</p>
      <h2>How we use information</h2>
      <p>We use this information to create and secure accounts, verify phone numbers, show and manage listings, arrange visits and bookings, process payments, provide support, prevent fraud, and improve RentItEase.</p>
      <h2>Sharing and service providers</h2>
      <p>We share information only as needed to provide the service, including with property users you interact with and trusted providers for authentication, maps, storage, notifications, and payment processing. We do not sell personal information.</p>
      <h2>Location, photos, and permissions</h2>
      <p>Location is used only for property maps, search, and location selection when you allow it. Photos and documents you upload are used to display and manage your listing. You can decline optional device permissions.</p>
      <h2>Retention and security</h2>
      <p>We retain information for as long as needed to provide the service, meet legal obligations, resolve disputes, and enforce agreements. We use reasonable safeguards, but no internet service can guarantee absolute security.</p>
      <h2>Your choices</h2>
      <p>You may update your profile, request access to or deletion of personal data where applicable, and opt out of non-essential marketing communications.</p>
      <h2>Contact</h2>
      <p>For privacy questions or requests, contact <a href="mailto:support@rentitease.com">support@rentitease.com</a>.</p>
    `));
  }

  @Get(['terms', 'terms-of-service'])
  terms(@Res() response: Response): void {
    response.type('html').send(legalPage('Terms of Service', `
      <p>Effective date: August 31, 2026</p>
      <p>By using RentItEase, you agree to these Terms of Service.</p>
      <h2>Using RentItEase</h2>
      <p>You must provide accurate account details, keep your credentials secure, and use the service lawfully. You may not misuse the platform, interfere with its operation, impersonate others, or submit deceptive property information.</p>
      <h2>Listings and rental decisions</h2>
      <p>Property owners are responsible for the accuracy, legality, availability, pricing, and suitability of their listings. Tenants are responsible for independently verifying property details and entering rental arrangements. RentItEase is a marketplace platform and is not a party to an agreement between a tenant and owner unless expressly stated otherwise.</p>
      <h2>Payments and premium services</h2>
      <p>Where paid services are offered, prices and applicable terms are shown before confirmation. Payments are processed by supported payment providers. Premium access and promotional trial periods are subject to the terms displayed in the app.</p>
      <h2>Content and communication</h2>
      <p>You retain ownership of content you submit, while granting RentItEase permission to host, display, and process it to operate the service. Do not post unlawful, infringing, abusive, or misleading content.</p>
      <h2>Suspension and termination</h2>
      <p>We may suspend or terminate accounts that breach these Terms, compromise security, or create risk for users or the service.</p>
      <h2>Disclaimer and liability</h2>
      <p>The service is provided on an “as available” basis. To the extent allowed by law, RentItEase is not liable for disputes, losses, damage, or conduct arising from property listings, visits, communications, or agreements between users.</p>
      <h2>Contact</h2>
      <p>Questions about these terms can be sent to <a href="mailto:support@rentitease.com">support@rentitease.com</a>.</p>
    `));
  }
}

function legalPage(title: string, content: string): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title} | RentItEase</title></head><body><main><h1>RentItEase ${title}</h1>${content}<hr><p><a href="/privacy-policy">Privacy Policy</a> · <a href="/terms">Terms of Service</a></p></main></body></html>`;
}
