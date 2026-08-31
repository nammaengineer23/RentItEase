const effectiveDate = 'August 31, 2026';

const legalContent = {
  '/privacy-policy': {
    title: 'Privacy Policy',
    body: `<p>Effective date: ${effectiveDate}</p>
<p>RentItEase helps tenants discover rental properties and lets verified property owners manage listings, visits, bookings, and communications.</p>
<h2>Information we collect</h2><p>We collect account information such as your name, email address, mobile number, profile photo when supplied, property and booking information, messages, reviews, and device or usage data needed to operate the service.</p>
<h2>How we use information</h2><p>We use this information to create and secure accounts, verify phone numbers, show and manage listings, arrange visits and bookings, process payments, provide support, prevent fraud, and improve RentItEase.</p>
<h2>Sharing and service providers</h2><p>We share information only as needed to provide the service, including with property users you interact with and trusted providers for authentication, maps, storage, notifications, and payment processing. We do not sell personal information.</p>
<h2>Location, photos, and permissions</h2><p>Location is used only for property maps, search, and location selection when you allow it. Photos and documents you upload are used to display and manage your listing. You can decline optional device permissions.</p>
<h2>Retention and security</h2><p>We retain information for as long as needed to provide the service, meet legal obligations, resolve disputes, and enforce agreements. We use reasonable safeguards, but no internet service can guarantee absolute security.</p>
<h2>Your choices</h2><p>You may update your profile, request access to or deletion of personal data where applicable, and opt out of non-essential marketing communications. See our <a href="/delete-account">Account and Data Deletion Policy</a> for deletion instructions.</p>
<h2>Contact</h2><p>For privacy questions or requests, contact <a href="mailto:support@rentitease.com">support@rentitease.com</a>.</p>`,
  },
  '/terms': {
    title: 'Terms of Service',
    body: `<p>Effective date: ${effectiveDate}</p><p>By using RentItEase, you agree to these Terms of Service.</p>
<h2>Using RentItEase</h2><p>You must provide accurate account details, keep your credentials secure, and use the service lawfully. You may not misuse the platform, interfere with its operation, impersonate others, or submit deceptive property information.</p>
<h2>Listings and rental decisions</h2><p>Property owners are responsible for the accuracy, legality, availability, pricing, and suitability of their listings. Tenants are responsible for independently verifying property details and entering rental arrangements. RentItEase is a marketplace platform and is not a party to an agreement between a tenant and owner unless expressly stated otherwise.</p>
<h2>Payments and premium services</h2><p>Where paid services are offered, prices and applicable terms are shown before confirmation. Payments are processed by supported payment providers. Premium access and promotional trial periods are subject to the terms displayed in the app.</p>
<h2>Content and communication</h2><p>You retain ownership of content you submit, while granting RentItEase permission to host, display, and process it to operate the service. Do not post unlawful, infringing, abusive, or misleading content.</p>
<h2>Suspension and termination</h2><p>We may suspend or terminate accounts that breach these Terms, compromise security, or create risk for users or the service.</p>
<h2>Disclaimer and liability</h2><p>The service is provided on an “as available” basis. To the extent allowed by law, RentItEase is not liable for disputes, losses, damage, or conduct arising from property listings, visits, communications, or agreements between users.</p>
<h2>Contact</h2><p>Questions about these terms can be sent to <a href="mailto:support@rentitease.com">support@rentitease.com</a>.</p>`,
  },
  '/delete-account': {
    title: 'Account and Data Deletion Policy',
    body: `<p>Effective date: ${effectiveDate}</p><h2>Request account deletion</h2><p>To request deletion of your RentItEase account, email <a href="mailto:support@rentitease.com?subject=RentItEase%20account%20deletion%20request">support@rentitease.com</a> from your registered email address. Include the email address or mobile number linked to your account so we can verify the request.</p>
<h2>What we delete</h2><p>Once the request is verified, we delete or anonymize account and profile data, saved preferences and favorites, and personal data associated with content and activity where legally and technically appropriate.</p>
<h2>What may be retained</h2><p>We may retain limited records where required for legal, tax, accounting, fraud prevention, dispute resolution, security, or regulatory reasons. We retain only what is necessary for those purposes.</p>
<h2>Timing</h2><p>We will acknowledge your request and process it after identity verification. Some related data may take additional time to be removed from backups or third-party systems.</p>
<h2>Need help?</h2><p>If you cannot access your account, contact <a href="mailto:support@rentitease.com">support@rentitease.com</a>.</p>`,
  },
};

function page(title, body) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title} | RentItEase</title><style>body{margin:0;background:#f7faf8;color:#15221b;font:16px/1.6 Arial,sans-serif}main{max-width:760px;margin:48px auto;padding:0 24px}h1{color:#087a45;font-size:32px;line-height:1.2}h2{margin-top:28px;font-size:20px}a{color:#087a45}footer{margin-top:40px;padding-top:20px;border-top:1px solid #d5e2da}</style></head><body><main><h1>RentItEase ${title}</h1>${body}<footer><a href="/privacy-policy">Privacy Policy</a> · <a href="/terms">Terms of Service</a> · <a href="/delete-account">Delete Account</a></footer></main></body></html>`;
}

export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname.replace(/\/$/, '') || '/';
    const document = legalContent[path === '/terms-of-service' ? '/terms' : path];
    if (document) {
      return new Response(page(document.title, document.body), {
        headers: {
          'content-type': 'text/html; charset=UTF-8',
          'cache-control': 'public, max-age=3600',
        },
      });
    }
    return env.ASSETS.fetch(request);
  },
};
