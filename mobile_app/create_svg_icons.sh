#!/usr/bin/env bash
set -e

mkdir -p assets/images/icons/feature
mkdir -p assets/images/icons/utility

cat > assets/images/icons/feature/home.svg <<'SVG'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
<path d="m3 10 9-7 9 7"/>
<path d="M5 9v11h14V9"/>
<path d="M9 20v-6h6v6"/>
</svg>
SVG

cat > assets/images/icons/feature/search.svg <<'SVG'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
<circle cx="11" cy="11" r="7"/>
<path d="m20 20-4-4"/>
</svg>
SVG

cat > assets/images/icons/feature/favorites.svg <<'SVG'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
<path d="M20.8 8.6c0 5.5-8.8 10.4-8.8 10.4S3.2 14.1 3.2 8.6A5.1 5.1 0 0 1 12 5.5a5.1 5.1 0 0 1 8.8 3.1Z"/>
</svg>
SVG

cat > assets/images/icons/feature/bookings.svg <<'SVG'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
<rect x="3" y="4" width="18" height="17" rx="2"/>
<path d="M16 2v4M8 2v4M3 10h18"/>
<path d="m8 15 2 2 5-5"/>
</svg>
SVG

cat > assets/images/icons/feature/chat.svg <<'SVG'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
<path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H7l-4 3v-10a7.5 7.5 0 1 1 17 0Z"/>
</svg>
SVG

cat > assets/images/icons/feature/profile.svg <<'SVG'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
<circle cx="12" cy="8" r="4"/>
<path d="M4 21a8 8 0 0 1 16 0"/>
</svg>
SVG

cat > assets/images/icons/feature/notifications.svg <<'SVG'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/>
<path d="M10 21h4"/>
</svg>
SVG

cat > assets/images/icons/feature/properties.svg <<'SVG'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round">
<path d="M3 21V8l9-5 9 5v13"/>
<path d="M7 21v-6h10v6"/>
<path d="M8 10h2M14 10h2M8 13h2M14 13h2"/>
</svg>
SVG

cat > assets/images/icons/feature/my_properties.svg <<'SVG'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round">
<path d="m3 10 9-7 9 7v11H3Z"/>
<path d="M8 21v-6h8v6"/>
<path d="M9 11h6"/>
</svg>
SVG

cat > assets/images/icons/feature/add_property.svg <<'SVG'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
<path d="M3 21V8l9-5 9 5v13"/>
<path d="M12 10v7M8.5 13.5h7"/>
</svg>
SVG

cat > assets/images/icons/feature/lease.svg <<'SVG'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
<path d="M6 3h12v18H6z"/>
<path d="M9 7h6M9 11h6M9 15h4"/>
</svg>
SVG

cat > assets/images/icons/feature/payments.svg <<'SVG'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
<rect x="3" y="5" width="18" height="14" rx="2"/>
<path d="M3 10h18"/>
<path d="M7 15h4"/>
</svg>
SVG

cat > assets/images/icons/feature/membership.svg <<'SVG'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round">
<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-2.9-5.6 2.9 1.1-6.2L3 9.6l6.2-.9Z"/>
</svg>
SVG

cat > assets/images/icons/feature/reviews.svg <<'SVG'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round">
<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-2.9-5.6 2.9 1.1-6.2L3 9.6l6.2-.9Z"/>
</svg>
SVG

cat > assets/images/icons/feature/visits.svg <<'SVG'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
<rect x="3" y="4" width="18" height="17" rx="2"/>
<path d="M16 2v4M8 2v4M3 10h18"/>
<circle cx="12" cy="15" r="3"/>
<path d="M12 13v2l1.5 1"/>
</svg>
SVG

cat > assets/images/icons/feature/logout.svg <<'SVG'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
<path d="M10 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h5"/>
<path d="M14 8l5 4-5 4"/>
<path d="M19 12H9"/>
</svg>
SVG

cat > assets/images/icons/utility/delete.svg <<'SVG'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
<path d="M4 7h16M10 11v6M14 11v6M6 7l1 14h10l1-14M9 7V4h6v3"/>
</svg>
SVG

cat > assets/images/icons/utility/edit.svg <<'SVG'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
<path d="M12 20h9"/>
<path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/>
</svg>
SVG

cat > assets/images/icons/utility/email.svg <<'SVG'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round">
<rect x="3" y="5" width="18" height="14" rx="2"/>
<path d="m3 7 9 6 9-6"/>
</svg>
SVG

cat > assets/images/icons/utility/filter.svg <<'SVG'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
<path d="M4 6h16M7 12h10M10 18h4"/>
</svg>
SVG

cat > assets/images/icons/utility/info.svg <<'SVG'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
<circle cx="12" cy="12" r="9"/>
<path d="M12 11v6M12 7h.01"/>
</svg>
SVG

cat > assets/images/icons/utility/location.svg <<'SVG'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round">
<path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/>
<circle cx="12" cy="10" r="2.5"/>
</svg>
SVG

cat > assets/images/icons/utility/map.svg <<'SVG'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round">
<path d="m9 18-6 3V6l6-3 6 3 6-3v15l-6 3Z"/>
<path d="M9 3v15M15 6v15"/>
</svg>
SVG

cat > assets/images/icons/utility/phone.svg <<'SVG'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
<path d="M5 4h4l2 5-2.5 1.5a15 15 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2C9 20 4 15 3 6a2 2 0 0 1 2-2Z"/>
</svg>
SVG

cat > assets/images/icons/utility/share.svg <<'SVG'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
<circle cx="18" cy="5" r="2.5"/>
<circle cx="6" cy="12" r="2.5"/>
<circle cx="18" cy="19" r="2.5"/>
<path d="m8.2 10.8 7.6-4.4M8.2 13.2l7.6 4.4"/>
</svg>
SVG

cat > assets/images/icons/utility/sort.svg <<'SVG'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
<path d="M8 5v14M5 8l3-3 3 3M16 19V5M13 16l3 3 3-3"/>
</svg>
SVG

cat > assets/images/icons/utility/success.svg <<'SVG'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
<circle cx="12" cy="12" r="9"/>
<path d="m8 12 3 3 5-6"/>
</svg>
SVG

cat > assets/images/icons/utility/warning.svg <<'SVG'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
<path d="m12 3 10 18H2Z"/>
<path d="M12 9v5M12 17h.01"/>
</svg>
SVG

# Remove the old blurry generated icon PNGs.
rm -f assets/images/icons/feature/*_512x512.png
rm -f assets/images/icons/utility/*_512x512.png

echo "SVG icon set created successfully."
