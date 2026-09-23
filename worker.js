const effectiveDate = 'August 31, 2026';
const siteUrl = 'https://rentitease.com';
const apiUrl = 'https://api.rentitease.com/api/v1';
const androidDownloadUrl = 'https://github.com/nammaengineer23/RentItEase/releases/latest/download/RentItEase-release.apk';

const legalContent = {
  '/contact': {
    title: 'Contact and Support',
    description: 'Contact RentItEase for help with accounts, rental properties, visits, bookings, payments, and privacy requests.',
    body: `<p>RentItEase support is here to help with account access, property listings, visits, bookings, payments, and privacy requests.</p><h2>Contact support</h2><p>Email <a href="mailto:support@rentitease.com">support@rentitease.com</a>. For faster help, include your registered email address or mobile number and a short description of the issue.</p><h2>Account and privacy requests</h2><p>For account deletion or personal-data requests, email support from your registered email address. See our <a href="/delete-account">Account and Data Deletion Policy</a>.</p>`,
  },
  '/about': {
    title: 'About RentItEase',
    description: 'Learn how RentItEase helps tenants discover verified rental homes and helps owners manage property listings and visits.',
    body: `<p>RentItEase is a property rental platform that helps tenants discover suitable homes and helps property owners list, manage, and rent properties with confidence.</p><h2>What we do</h2><p>Users can browse property listings, save favourites, communicate with owners, arrange visits, manage bookings, and access rental-related services.</p><h2>Our purpose</h2><p>We make finding, renting, and managing properties simpler, more transparent, and easier to access.</p><h2>Contact</h2><p>For support, contact <a href="mailto:support@rentitease.com">support@rentitease.com</a>.</p>`,
  },
  '/privacy': {
    title: 'Privacy Policy',
    description: 'Read the RentItEase Privacy Policy and learn how account, property, visit, booking, payment, and device information is handled.',
    body: `<p>Effective date: ${effectiveDate}</p><p>RentItEase helps tenants discover rental properties and lets verified property owners manage listings, visits, bookings, and communications.</p><h2>Information we collect</h2><p>We collect account information such as your name, email address, mobile number, profile photo when supplied, property and booking information, messages, reviews, and device or usage data needed to operate the service.</p><h2>How we use information</h2><p>We use this information to create and secure accounts, verify phone numbers, show and manage listings, arrange visits and bookings, process payments, provide support, prevent fraud, and improve RentItEase.</p><h2>Sharing and service providers</h2><p>We share information only as needed to provide the service, including with property users you interact with and trusted providers for authentication, maps, storage, notifications, and payment processing. We do not sell personal information.</p><h2>Location, photos, and permissions</h2><p>Location is used only for property maps, search, and location selection when you allow it. Photos and documents you upload are used to display and manage your listing. You can decline optional device permissions.</p><h2>Retention and security</h2><p>We retain information for as long as needed to provide the service, meet legal obligations, resolve disputes, and enforce agreements. We use reasonable safeguards, but no internet service can guarantee absolute security.</p><h2>Your choices</h2><p>You may update your profile, request access to or deletion of personal data where applicable, and opt out of non-essential marketing communications. See our <a href="/delete-account">Account and Data Deletion Policy</a> for deletion instructions.</p><h2>Contact</h2><p>For privacy questions or requests, contact <a href="mailto:support@rentitease.com">support@rentitease.com</a>.</p>`,
  },
  '/terms': {
    title: 'Terms of Service',
    description: 'Read the terms that apply when using RentItEase property listings, visits, bookings, payments, and premium services.',
    body: `<p>Effective date: ${effectiveDate}</p><p>By using RentItEase, you agree to these Terms of Service.</p><h2>Using RentItEase</h2><p>You must provide accurate account details, keep your credentials secure, and use the service lawfully. You may not misuse the platform, interfere with its operation, impersonate others, or submit deceptive property information.</p><h2>Listings and rental decisions</h2><p>Property owners are responsible for the accuracy, legality, availability, pricing, and suitability of their listings. Tenants are responsible for independently verifying property details and entering rental arrangements. RentItEase is a marketplace platform and is not a party to an agreement between a tenant and owner unless expressly stated otherwise.</p><h2>Payments and premium services</h2><p>Where paid services are offered, prices and applicable terms are shown before confirmation. Payments are processed by supported payment providers. Premium access and promotional trial periods are subject to the terms displayed in the app.</p><h2>Content and communication</h2><p>You retain ownership of content you submit, while granting RentItEase permission to host, display, and process it to operate the service. Do not post unlawful, infringing, abusive, or misleading content.</p><h2>Suspension and termination</h2><p>We may suspend or terminate accounts that breach these Terms, compromise security, or create risk for users or the service.</p><h2>Disclaimer and liability</h2><p>The service is provided on an “as available” basis. To the extent allowed by law, RentItEase is not liable for disputes, losses, damage, or conduct arising from property listings, visits, communications, or agreements between users.</p><h2>Contact</h2><p>Questions about these terms can be sent to <a href="mailto:support@rentitease.com">support@rentitease.com</a>.</p>`,
  },
  '/delete-account': {
    title: 'Account and Data Deletion Policy',
    description: 'Request deletion of a RentItEase account and learn which personal information is deleted, anonymized, or legally retained.',
    body: `<p>Effective date: ${effectiveDate}</p><h2>Request account deletion</h2><p>To request deletion of your RentItEase account, email <a href="mailto:support@rentitease.com?subject=RentItEase%20account%20deletion%20request">support@rentitease.com</a> from your registered email address. Include the email address or mobile number linked to your account so we can verify the request.</p><h2>What we delete</h2><p>Once the request is verified, we delete or anonymize account and profile data, saved preferences and favorites, and personal data associated with content and activity where legally and technically appropriate.</p><h2>What may be retained</h2><p>We may retain limited records where required for legal, tax, accounting, fraud prevention, dispute resolution, security, or regulatory reasons. We retain only what is necessary for those purposes.</p><h2>Timing</h2><p>We will acknowledge your request and process it after identity verification. Some related data may take additional time to be removed from backups or third-party systems.</p><h2>Need help?</h2><p>If you cannot access your account, contact <a href="mailto:support@rentitease.com">support@rentitease.com</a>.</p>`,
  },
};

const escapeHtml = (value) => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
const firstString = (...values) => values.find((value) => typeof value === 'string' && value.trim())?.trim() || '';

function analyticsHead(env) {
  const id = firstString(env?.GA_MEASUREMENT_ID);
  if (!/^G-[A-Z0-9]+$/.test(id)) return '';
  return `<script async src="https://www.googletagmanager.com/gtag/js?id=${id}"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${id}');</script>`;
}

function socialLinks(env) {
  return [
    ['Facebook', env?.FACEBOOK_PAGE_URL],
    ['Instagram', env?.INSTAGRAM_PROFILE_URL],
    ['YouTube', env?.YOUTUBE_CHANNEL_URL],
  ].filter(([, url]) => /^https:\/\//.test(url || ''))
    .map(([label, url]) => `<a href="${escapeHtml(url)}" rel="me noopener">${label}</a>`)
    .join(' · ');
}

function footer(env) {
  const social = socialLinks(env);
  return `<footer><a href="/">Home</a> · <a href="/admin-panel/login">Admin</a> · <a href="/rental-app">Rental App</a> · <a href="/houses-for-rent">Houses for Rent</a> · <a href="/rentals/bangalore">Bangalore Rentals</a> · <a href="/about">About</a> · <a href="/contact">Contact</a> · <a href="/privacy">Privacy Policy</a> · <a href="/terms">Terms of Service</a> · <a href="/delete-account">Delete Account</a> · <a href="/download">Download App</a>${social ? ` · ${social}` : ''}</footer>`;
}

function staticPage({ path, title, description, body, env, schema }) {
  const canonical = `${siteUrl}${path}`;
  const jsonLd = schema ? `<script type="application/ld+json">${JSON.stringify(schema).replaceAll('<', '\\u003c')}</script>` : '';
  return `<!doctype html><html lang="en-IN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtml(title)} | RentItEase</title><meta name="description" content="${escapeHtml(description)}"><meta name="robots" content="index, follow, max-image-preview:large"><link rel="canonical" href="${canonical}"><meta property="og:type" content="website"><meta property="og:site_name" content="RentItEase"><meta property="og:title" content="${escapeHtml(title)} | RentItEase"><meta property="og:description" content="${escapeHtml(description)}"><meta property="og:url" content="${canonical}"><meta property="og:image" content="${siteUrl}/social-share.png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta name="twitter:card" content="summary_large_image">${jsonLd}${analyticsHead(env)}<style>body{margin:0;background:#f7faf8;color:#15221b;font:16px/1.6 Arial,sans-serif}main{max-width:920px;margin:48px auto;padding:0 24px}h1{color:#087a45;font-size:clamp(32px,5vw,48px);line-height:1.15}h2{margin-top:28px;font-size:22px}a{color:#087a45}.button{display:inline-block;padding:13px 20px;border-radius:10px;background:#087a45;color:#fff;text-decoration:none;font-weight:700}.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:18px;margin:28px 0}.card{padding:20px;border:1px solid #d5e2da;border-radius:14px;background:#fff}.card img{width:100%;height:160px;object-fit:cover;border-radius:10px}.muted{color:#597067}footer{margin-top:48px;padding:22px 0;border-top:1px solid #d5e2da}</style></head><body><main><h1>${escapeHtml(title)}</h1>${body}${footer(env)}</main></body></html>`;
}

function htmlResponse(html, cacheControl = 'public, max-age=300') {
  return new Response(html, { headers: { 'content-type': 'text/html; charset=UTF-8', 'cache-control': cacheControl, 'x-robots-tag': 'index, follow' } });
}

async function apiJson(path) {
  const response = await fetch(`${apiUrl}${path}`, { headers: { accept: 'application/json' }, signal: AbortSignal.timeout(5000) });
  if (!response.ok) throw new Error(`API returned ${response.status}`);
  return response.json();
}

function propertyFromPayload(payload) {
  return payload?.data?.property || payload?.property || payload?.data?.data?.property;
}

function propertiesFromPayload(payload) {
  return [payload?.data?.data, payload?.data, payload?.properties].find(Array.isArray) || [];
}

function paginationFromPayload(payload) {
  return payload?.data?.pagination || payload?.pagination || {};
}

function propertyImage(property) {
  const image = Array.isArray(property?.images) ? property.images[0] : null;
  return firstString(image?.imageUrl, image?.url, property?.imageUrls?.[0], `${siteUrl}/social-share.png`);
}

function formatRent(property) {
  const rent = Number(property?.price ?? property?.rent);
  if (!Number.isFinite(rent)) return 'Rent available in app';
  return `₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(rent)} per month`;
}

async function cityPage(env) {
  let properties = [];
  try {
    properties = propertiesFromPayload(await apiJson('/properties?search=Bangalore&isAvailable=true&limit=12&order=desc'));
  } catch (_) {
    // The landing page stays available during a temporary API outage.
  }
  const cards = properties.filter((property) => property?.id).map((property) => {
    const title = firstString(property.title, 'Rental property');
    const location = [property.locality, property.city].filter(Boolean).join(', ');
    return `<article class="card"><img src="${escapeHtml(propertyImage(property))}" alt="${escapeHtml(title)} in ${escapeHtml(location)}" loading="lazy"><h2>${escapeHtml(title)}</h2><p>${escapeHtml(location)}</p><p><strong>${escapeHtml(formatRent(property))}</strong></p><a href="/property/${encodeURIComponent(property.id)}">View property</a></article>`;
  }).join('');
  const description = 'Explore verified houses and apartments for rent in Bangalore. Compare locations, rent, amenities, and schedule property visits with RentItEase.';
  const body = `<p>${description}</p><p><a class="button" href="/auth">Open RentItEase search</a></p>${cards ? `<section class="cards">${cards}</section>` : '<p class="muted">Open RentItEase to see the latest available properties near your location.</p>'}`;
  const listedProperties = properties.filter((property) => property?.id);
  return staticPage({ path: '/rentals/bangalore', title: 'Rental Properties in Bangalore', description, body, env, schema: { '@context': 'https://schema.org', '@type': 'ItemList', name: 'Rental properties in Bangalore', itemListElement: listedProperties.map((property, index) => ({ '@type': 'ListItem', position: index + 1, url: `${siteUrl}/property/${encodeURIComponent(property.id)}`, name: firstString(property.title, 'Rental property') })) } });
}

async function landingPage(env) {
  let proof = { visitorCount: 0, downloadCount: 0, averageRating: 0, ratingCount: 0, reviews: [] };
  try { proof = { ...proof, ...(await apiJson('/app-feedback/public-summary')) }; } catch (_) {}
  const description = 'Discover verified rental homes, connect with owners, schedule visits, and manage your rental journey with RentItEase.';
  const body = `
    <section class="landing-hero">
      <p class="eyebrow">RENTAL HOMES, MADE SIMPLE</p>
      <h1>Find a place<br>that feels right.</h1>
      <p class="lead">Browse verified rental homes, compare clear property details, book visits and manage your rental journey in one place.</p>
      <div class="landing-actions">
        <a class="button" href="/auth">Open RentItEase</a>
        <a class="button secondary" href="/download">Download Android App</a>
      </div>
    </section>
    <section class="social-proof" aria-label="RentItEase community activity">
      <div><strong>${Number(proof.averageRating || 0).toFixed(1)}</strong><span>Average rating · ${Number(proof.ratingCount || 0).toLocaleString('en-IN')} ratings</span></div>
      <div><strong>${Number(proof.visitorCount || 0).toLocaleString('en-IN')}</strong><span>Website visitors</span></div>
      <div><strong>${Number(proof.downloadCount || 0).toLocaleString('en-IN')}</strong><span>App downloads from website</span></div>
    </section>
    ${Array.isArray(proof.reviews) && proof.reviews.length ? `<section class="review-grid" aria-label="Recent RentItEase reviews">${proof.reviews.map((review) => `<blockquote><div class="review-stars">★ ${escapeHtml(review.rating)}</div><p>${escapeHtml(review.comment || '')}</p><cite>— ${escapeHtml(review.reviewer || 'RentItEase user')}</cite></blockquote>`).join('')}</section>` : ''}
    <section class="quick-grid">
      <article><strong>1</strong><h2>Explore homes</h2><p>Search available properties and compare rent, location, photos and amenities.</p></article>
      <article><strong>2</strong><h2>Book a visit</h2><p>Request a property visit and stay updated as the owner responds.</p></article>
      <article><strong>3</strong><h2>Manage your rental</h2><p>Keep bookings, chats, payments and invoices together.</p></article>
    </section>`;
  return staticPage({
    path: '/',
    title: 'Verified Rental Homes and Properties in India',
    description,
    body,
    env,
    schema: {
      '@context': 'https://schema.org',
      '@graph': [
        { '@type': 'Organization', '@id': siteUrl + '/#organization', name: 'RentItEase', url: siteUrl + '/', email: 'support@rentitease.com' },
        { '@type': 'WebSite', '@id': siteUrl + '/#website', name: 'RentItEase', url: siteUrl + '/', publisher: { '@id': siteUrl + '/#organization' } },
      ],
    },
  }).replace(
    '</style>',
    '.landing-hero{padding:64px 0 52px;max-width:760px}.eyebrow{color:#087a45;font-size:13px;font-weight:800;letter-spacing:.12em}.landing-hero h1{margin:10px 0 18px;color:#10251b;font-size:clamp(44px,8vw,72px);line-height:.98;letter-spacing:-.045em}.lead{font-size:18px;color:#52655b;max-width:650px}.landing-actions{display:flex;flex-wrap:wrap;gap:12px;margin-top:26px}.button.secondary{background:#fff;color:#123b2a;border:1px solid #b9d6c5}.social-proof{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin:0 0 20px}.social-proof div{padding:20px;border:1px solid #d9e4dd;border-radius:18px;background:#f7fffa}.social-proof strong{display:block;font-size:30px;color:#087a45}.social-proof span{color:#597067}.review-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin:0 0 26px}.review-grid blockquote{margin:0;padding:20px;border:1px solid #d9e4dd;border-radius:18px;background:#fff}.review-stars{color:#087a45;font-weight:800}.review-grid cite{color:#597067}.quick-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin:10px 0 42px}.quick-grid article{padding:22px;border:1px solid #d9e4dd;border-radius:18px;background:#fff}.quick-grid strong{display:grid;place-items:center;width:34px;height:34px;border-radius:50%;background:#d9f7e7;color:#123b2a}.quick-grid h2{margin:14px 0 6px}.quick-grid p{margin:0;color:#597067}@media(max-width:700px){main{margin-top:24px}.landing-hero{padding-top:28px}.quick-grid,.social-proof,.review-grid{grid-template-columns:1fr}}' +
    '</style>',
  ).replace(
    '<body><main>',
    '<body><main><header style="display:flex;align-items:center;justify-content:space-between;gap:16px"><a href="/" style="font-size:22px;font-weight:800;text-decoration:none;color:#123b2a">RentItEase</a><nav style="display:flex;flex-wrap:wrap;gap:16px"><a href="/about">About</a><a href="/contact">Contact</a><a href="/admin-panel/login">Admin</a></nav></header>',
  );
}

function rentalAppPage(env) {
  const description = 'Find houses, flats and apartments for rent with RentItEase, a rental property app for tenants and property owners in India.';
  const body = `<p>${description}</p><h2>Search homes for rent</h2><p>Browse verified rental property listings, compare rent and amenities, view property locations, save favourites, contact owners and schedule visits.</p><h2>Rental app for tenants</h2><p>RentItEase keeps property search, visits, bookings, payments and invoices together so you can manage your rental journey from one place.</p><h2>Property rental app for owners</h2><p>Owners can list houses, flats and apartments for rent, add photos and property details, manage visit requests and track rental activity.</p><p><a class="button" href="/auth">Search rental properties</a> <a class="button" href="/download">Download RentItEase</a></p>`;
  return staticPage({ path: '/rental-app', title: 'Rental App for Houses, Flats & Apartments for Rent in India', description, body, env, schema: { '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'RentItEase', operatingSystem: 'Android, Web', applicationCategory: 'LifestyleApplication', url: `${siteUrl}/rental-app`, downloadUrl: androidDownloadUrl, description } });
}

function housesForRentPage(env) {
  const description = 'Search verified houses, flats and apartments for rent in India with RentItEase. Connect with owners and schedule property visits online.';
  const body = `<p>${description}</p><h2>Find rental properties</h2><p>Search available homes by location and review rent, photos, amenities and property information before arranging a visit.</p><h2>Rent directly with useful property details</h2><p>RentItEase helps tenants discover rental homes and communicate with property owners while keeping visits and bookings organised.</p><p><a class="button" href="/auth">Find a home for rent</a></p>`;
  return staticPage({ path: '/houses-for-rent', title: 'Houses, Flats & Apartments for Rent in India', description, body, env });
}

function downloadPage(env) {
  const description = 'Download the latest signed RentItEase Android APK and start searching verified rental properties.';
  const body = `<p>${description}</p><h2>Install RentItEase for Android</h2><p>Download the current signed APK directly from the RentItEase website. Android may ask you to allow installation from your browser or file manager.</p><p><a class="button" href="/download/latest" onclick="window.gtag?.('event','apk_download',{method:'rentitease_website'})">Download latest Android APK</a></p><p class="muted">For your security, install RentItEase only from rentitease.com.</p>`;
  return staticPage({ path: '/download', title: 'Download RentItEase for Android', description, body, env, schema: { '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'RentItEase', operatingSystem: 'Android', applicationCategory: 'LifestyleApplication', downloadUrl: androidDownloadUrl, offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' } } });
}

function replaceTag(html, expression, replacement) {
  return expression.test(html) ? html.replace(expression, replacement) : html;
}

function personalizePropertyShell(html, property, env) {
  const title = firstString(property.title, 'Rental Property');
  const location = [property.locality, property.city].filter(Boolean).join(', ');
  const description = `${title}${location ? ` in ${location}` : ''}. ${formatRent(property)}. View photos, amenities, availability, and schedule a visit with RentItEase.`;
  const canonical = `${siteUrl}/property/${encodeURIComponent(property.id)}`;
  const image = propertyImage(property);
  const schema = { '@context': 'https://schema.org', '@type': 'Accommodation', name: title, description: firstString(property.description, description), url: canonical, image: [image], address: { '@type': 'PostalAddress', streetAddress: firstString(property.address, property.locality), addressLocality: firstString(property.city, property.locality), addressCountry: 'IN' } };
  let output = replaceTag(html, /<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}${location ? ` in ${escapeHtml(location)}` : ''} | RentItEase</title>`);
  output = replaceTag(output, /<meta\s+name="description"[\s\S]*?>/i, `<meta name="description" content="${escapeHtml(description)}">`);
  output = replaceTag(output, /<link\s+rel="canonical"[^>]*>/i, `<link rel="canonical" href="${canonical}">`);
  output = replaceTag(output, /<meta\s+property="og:title"[^>]*>/i, `<meta property="og:title" content="${escapeHtml(title)} | RentItEase">`);
  output = replaceTag(output, /<meta\s+property="og:description"[\s\S]*?>/i, `<meta property="og:description" content="${escapeHtml(description)}">`);
  output = replaceTag(output, /<meta\s+property="og:url"[^>]*>/i, `<meta property="og:url" content="${canonical}">`);
  output = replaceTag(output, /<meta\s+property="og:image"[^>]*>/i, `<meta property="og:image" content="${escapeHtml(image)}">`);
  output = replaceTag(output, /<meta\s+name="twitter:title"[^>]*>/i, `<meta name="twitter:title" content="${escapeHtml(title)} | RentItEase">`);
  output = replaceTag(output, /<meta\s+name="twitter:description"[\s\S]*?>/i, `<meta name="twitter:description" content="${escapeHtml(description)}">`);
  output = replaceTag(output, /<meta\s+name="twitter:image"[^>]*>/i, `<meta name="twitter:image" content="${escapeHtml(image)}">`);
  return output.replace('</head>', `<script type="application/ld+json">${JSON.stringify(schema).replaceAll('<', '\\u003c')}</script>${analyticsHead(env)}</head>`);
}

async function propertyPage(request, env, propertyId) {
  const assetResponse = await env.ASSETS.fetch(request);
  if (!assetResponse.headers.get('content-type')?.includes('text/html')) return assetResponse;
  try {
    const property = propertyFromPayload(await apiJson(`/properties/${encodeURIComponent(propertyId)}`));
    if (!property || property.isVerified !== true || property.isAvailable === false) return assetResponse;
    const headers = new Headers(assetResponse.headers);
    headers.set('content-type', 'text/html; charset=UTF-8');
    headers.set('cache-control', 'public, max-age=300');
    headers.set('x-robots-tag', 'index, follow');
    return new Response(personalizePropertyShell(await assetResponse.text(), property, env), { status: assetResponse.status, headers });
  } catch (_) {
    return assetResponse;
  }
}

async function appShell(request, env) {
  const response = await env.ASSETS.fetch(request);
  const analytics = analyticsHead(env);
  const sameAs = [env?.FACEBOOK_PAGE_URL, env?.INSTAGRAM_PROFILE_URL, env?.YOUTUBE_CHANNEL_URL]
    .filter((url) => /^https:\/\//.test(url || ''));
  const organization = sameAs.length
    ? `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'Organization', '@id': `${siteUrl}/#organization`, name: 'RentItEase', url: `${siteUrl}/`, sameAs }).replaceAll('<', '\\u003c')}</script>`
    : '';
  const social = socialLinks(env);
  if ((!analytics && !organization && !social) || !response.headers.get('content-type')?.includes('text/html')) return response;
  const headers = new Headers(response.headers);
  let html = (await response.text()).replace('</head>', `${organization}${analytics}</head>`);
  if (social) html = html.replace('</footer>', `<span class="seo-social"> · ${social}</span></footer>`);
  return new Response(html, { status: response.status, headers });
}

const escapeXml = (value) => escapeHtml(value).replaceAll('&#39;', '&apos;');

async function propertySitemap() {
  let properties = [];
  try {
    const firstPage = await apiJson('/properties?isAvailable=true&limit=100&page=1&sortBy=updatedAt&order=desc');
    properties = propertiesFromPayload(firstPage);
    const reportedPages = Number(paginationFromPayload(firstPage).totalPages) || 1;
    const totalPages = Math.min(Math.max(reportedPages, 1), 50);
    for (let page = 2; page <= totalPages; page += 5) {
      const pageNumbers = Array.from(
        { length: Math.min(5, totalPages - page + 1) },
        (_, index) => page + index,
      );
      const payloads = await Promise.all(pageNumbers.map((pageNumber) =>
        apiJson(`/properties?isAvailable=true&limit=100&page=${pageNumber}&sortBy=updatedAt&order=desc`)));
      properties.push(...payloads.flatMap(propertiesFromPayload));
    }
  } catch (_) {
    // Return all successfully loaded pages so crawlers can retry the rest.
  }
  const urls = properties
    .filter((property) => property?.id && property?.isVerified === true && property?.isAvailable !== false)
    .map((property) => {
      const modified = firstString(property.updatedAt, property.createdAt).slice(0, 10);
      return `<url><loc>${siteUrl}/property/${escapeXml(encodeURIComponent(property.id))}</loc>${/^\d{4}-\d{2}-\d{2}$/.test(modified) ? `<lastmod>${modified}</lastmod>` : ''}<changefreq>weekly</changefreq><priority>0.7</priority></url>`;
    })
    .join('');
  const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;
  return new Response(xml, {
    headers: {
      'content-type': 'application/xml; charset=UTF-8',
      'cache-control': 'public, max-age=3600',
      'x-robots-tag': 'noindex',
    },
  });
}

export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname.replace(/\/$/, '') || '/';
    if (path === '/') {
      const visitorId = request.headers.get('cookie')?.match(/(?:^|; )rie_visitor=([^;]+)/)?.[1] || crypto.randomUUID();
      try { await fetch(`${apiUrl}/app-feedback/visit`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ visitorId }) }); } catch (_) {}
      const response = htmlResponse(await landingPage(env), 'no-cache, max-age=0, must-revalidate');
      response.headers.append('set-cookie', `rie_visitor=${encodeURIComponent(visitorId)}; Path=/; Max-Age=31536000; SameSite=Lax; Secure`);
      return response;
    }
    // Keep /admin reserved for the Flutter admin console. A direct browser
    // reopen of /admin (or a stale pre-release admin URL) must bootstrap the
    // Flutter SPA instead of falling through to the public landing response.
    if (path === '/admin' || path.startsWith('/admin/')) {
      let response = await env.ASSETS.fetch(
        new Request(new URL('/index.html', request.url), request),
      );
      const headers = new Headers(response.headers);
      headers.set('cache-control', 'no-cache, max-age=0, must-revalidate');
      headers.set('x-robots-tag', 'noindex, nofollow');
      return new Response(response.body, { status: response.status, headers });
    }
    if (path === '/admin-panel' || path.startsWith('/admin-panel/')) {
      const assetPath = path === '/admin-panel'
        ? '/admin-panel/index.html'
        : path;
      let response = await env.ASSETS.fetch(new Request(new URL(assetPath, request.url), request));
      if (response.status === 404 || (response.headers.get('content-type') || '').includes('text/html') && !assetPath.endsWith('.html')) {
        response = await env.ASSETS.fetch(
          new Request(new URL('/admin-panel/index.html', request.url), request),
        );
      }
      const headers = new Headers(response.headers);
      headers.set('x-robots-tag', 'noindex, nofollow');
      return new Response(response.body, { status: response.status, headers });
    }
    if (path === '/privacy-policy') return Response.redirect(`${siteUrl}/privacy`, 301);
    if (path === '/terms-of-service') return Response.redirect(`${siteUrl}/terms`, 301);
    if (path === '/rentals/bengaluru') return Response.redirect(`${siteUrl}/rentals/bangalore`, 301);
    if (path === '/download/latest') {
      if (request.method === 'GET') {
        try {
          await fetch(`${apiUrl}/app-feedback/download`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ source: 'website' }),
          });
        } catch (_) {}
      }
      return Response.redirect(androidDownloadUrl, 302);
    }
    if (path === '/download') return htmlResponse(downloadPage(env));
    if (path === '/rental-app') return htmlResponse(rentalAppPage(env));
    if (path === '/houses-for-rent') return htmlResponse(housesForRentPage(env));
    if (path === '/rentals/bangalore') return htmlResponse(await cityPage(env));
    if (path === '/robots.txt') {
      return new Response('User-agent: *\\nAllow: /\\nDisallow: /admin-panel/\\nDisallow: /auth\\n\\nSitemap: https://rentitease.com/sitemap.xml\\n', {
        headers: { 'content-type': 'text/plain; charset=UTF-8', 'cache-control': 'public, max-age=3600' },
      });
    }
    if (path === '/sitemap.xml' || path === '/sitemap-pages.xml') {
      return env.ASSETS.fetch(request);
    }
    if (path === '/sitemap-properties.xml') return propertySitemap();
    const propertyMatch = path.match(/^\/property\/([^/]+)$/);
    if (propertyMatch) return propertyPage(request, env, decodeURIComponent(propertyMatch[1]));
    const document = legalContent[path];
    if (document) return htmlResponse(staticPage({ path, title: document.title, description: document.description, body: document.body, env }), 'no-store, max-age=0');
    const response = await appShell(request, env);
    const headers = new Headers(response.headers);
    headers.set('x-robots-tag', 'noindex, follow');
    return new Response(response.body, { status: response.status, headers });
  },
};
