# RentItEase SEO and Marketing Launch

## Repository variables

Configure these public values in **GitHub → RentItEase → Settings → Secrets and variables → Actions → Variables**. They are intentionally not secrets.

| Variable | Example format | Purpose |
| --- | --- | --- |
| `GA_MEASUREMENT_ID` | `G-XXXXXXXXXX` | Enables GA4 page views and APK-download events |
| `FACEBOOK_PAGE_URL` | `https://www.facebook.com/...` | Adds the verified Facebook page to the website and organization schema |
| `INSTAGRAM_PROFILE_URL` | `https://www.instagram.com/.../` | Adds the verified Instagram profile |
| `YOUTUBE_CHANNEL_URL` | `https://www.youtube.com/@...` | Adds the verified YouTube channel |

The deployment workflow passes these values to the Flutter landing page and Cloudflare Worker. Empty or invalid values are omitted instead of producing broken public links.

## Search launch checklist

1. Merge and deploy the SEO update.
2. Verify these URLs return `200`: `/`, `/about`, `/contact`, `/privacy`, `/terms`, `/delete-account`, `/download`, and `/rentals/bangalore`.
3. Add and verify the `https://rentitease.com/` domain property in Google Search Console.
4. Submit `https://rentitease.com/sitemap.xml`.
5. Use URL Inspection to test and request indexing for `/`, `/download`, and `/rentals/bangalore`.
6. Confirm the old `/privacy-policy` and `/terms-of-service` URLs redirect to their canonical URLs.
7. Check the Page indexing and Core Web Vitals reports after Google recrawls the site.

## Analytics conversions

GA4 automatically receives page views after `GA_MEASUREMENT_ID` is configured. The download page also emits:

- Event: `apk_download`
- Parameter: `method=rentitease_website`

Mark `apk_download` as a key event in GA4. Registration, chat, visit, booking, and payment conversions require consent-aware analytics inside the authenticated Flutter application and should be introduced separately from public website analytics.

## Google Business Profile

Create or claim the profile only with RentItEase's real business name, verified phone, website, address or eligible service area, category, and operating hours. Do not create duplicate profiles or use an address that cannot receive verification.

## Launch campaign

Use the public property URL (`https://rentitease.com/property/PROPERTY_ID`) when promoting an approved listing. It produces property-specific titles, descriptions, images, canonical metadata, and structured data while still opening the Flutter property page for users.

### Launch post

> Finding a rental home should feel simpler. RentItEase helps you discover verified properties, connect with owners, schedule visits, and manage your rental journey in one place. Explore at https://rentitease.com or download the Android app: https://rentitease.com/download

### Property post template

> New rental available in {locality}, {city}: {title}. Monthly rent: ₹{rent}. View photos, amenities, availability, and request a visit: https://rentitease.com/property/{propertyId}

### Short-video CTA

> Looking for a rental home? Discover verified properties and book a visit with RentItEase. Visit rentitease.com.

Publish only properties with recorded owner marketing consent. Use the existing administrator-controlled social-media workflow and review the generated media before publishing.

## Sustainable backlink work

- Link to `rentitease.com` from the verified Facebook, Instagram, and YouTube profiles.
- Add the website to legitimate local-business and rental directories whose profiles RentItEase controls.
- Ask participating property owners and partners to link to their public RentItEase property pages.
- Publish useful, original local rental guides before requesting links from community sites.
- Avoid paid link schemes, bulk directory submissions, copied city pages, and keyword-stuffed posts.

Review Search Console queries, indexed pages, GA4 traffic, APK downloads, registrations, chats, visit requests, and bookings every week. Expand city landing pages only when RentItEase has real verified inventory and unique local content for that city.
