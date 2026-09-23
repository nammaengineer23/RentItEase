import worker from '../worker.js';

const shell = `<!doctype html><html><head>
<meta name="description" content="old">
<link rel="canonical" href="https://rentitease.com/">
<meta property="og:title" content="old">
<meta property="og:description" content="old">
<meta property="og:url" content="https://rentitease.com/">
<meta property="og:image" content="old">
<meta name="twitter:title" content="old">
<meta name="twitter:description" content="old">
<meta name="twitter:image" content="old">
<title>Old</title></head><body><footer>Footer</footer></body></html>`;

const property = {
  id: 'property-1',
  title: 'Green View Home',
  description: 'A verified two bedroom home.',
  price: 25000,
  city: 'Bangalore',
  locality: 'HSR Layout',
  address: 'HSR Layout',
  isVerified: true,
  isAvailable: true,
  updatedAt: '2026-09-14T10:00:00Z',
  images: [{ imageUrl: 'https://images.example/property.jpg' }],
};

globalThis.fetch = async (url) => {
  if (String(url).includes('/downloads/RentItEase.apk')) {
    return new Response('signed-apk', {
      headers: {
        'content-type': 'application/vnd.android.package-archive',
        'content-length': '10',
        'accept-ranges': 'bytes',
        'content-disposition': 'attachment; filename="RentItEase.apk"',
      },
    });
  }
  if (String(url).includes('/properties/property-1')) {
    return Response.json({ data: { property } });
  }
  if (String(url).includes('/properties?')) {
    const page = Number(new URL(String(url)).searchParams.get('page')) || 1;
    return Response.json({
      data: {
        data: [{ ...property, id: `property-${page}` }],
        pagination: { totalPages: 2 },
      },
    });
  }
  throw new Error(`Unexpected API URL: ${url}`);
};

const env = {
  GA_MEASUREMENT_ID: 'G-ABC123',
  FACEBOOK_PAGE_URL: 'https://facebook.com/rentitease',
  INSTAGRAM_PROFILE_URL: 'https://instagram.com/rentitease',
  YOUTUBE_CHANNEL_URL: 'https://youtube.com/@RentItEase',
  ASSETS: {
    fetch: async (request) => {
      if (new URL(request.url).pathname === '/downloads/RentItEase.apk') {
        return new Response('signed-apk', {
          headers: {
            'content-type': 'application/vnd.android.package-archive',
            'content-length': '10',
            'accept-ranges': 'bytes',
            'content-disposition': 'attachment; filename="RentItEase.apk"',
          },
        });
      }
      return new Response(shell, {
        headers: { 'content-type': 'text/html' },
      });
    },
  },
};

const checks = [
  ['/about', 200, 'About RentItEase'],
  ['/privacy', 200, 'Privacy Policy'],
  ['/download', 200, 'apk_download'],
  ['/rentals/bangalore', 200, 'Green View Home'],
  ['/property/property-1', 200, 'Green View Home in HSR Layout, Bangalore'],
  ['/sitemap-properties.xml', 200, '/property/property-2'],
  ['/robots.txt', 200, 'Sitemap: https://rentitease.com/sitemap.xml'],
  ['/sitemap.xml', 200, 'Old'],
  ['/privacy-policy', 301, '/privacy'],
  ['/rentals/bengaluru', 301, '/rentals/bangalore'],
  ['/', 200, 'facebook.com/rentitease'],
];

for (const [path, status, expected] of checks) {
  const response = await worker.fetch(
    new Request(`https://rentitease.com${path}`),
    env,
  );
  const output = status === 301
    ? response.headers.get('location')
    : await response.text();
  if (response.status !== status || !output.includes(expected)) {
    throw new Error(`${path}: expected status ${status} and ${expected}`);
  }
}

console.log('Cloudflare SEO route checks passed.');
