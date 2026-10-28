/** Small inline SVG placeholders so the mock app needs no image hosting. */

const PALETTES = [
  ['#FFE0CC', '#E85D04'],
  ['#EAF6EE', '#1B7F3B'],
  ['#FFF8E1', '#FFB703'],
  ['#FFF3EB', '#A34002'],
  ['#EFF6FF', '#2563EB'],
];

const svgUri = (svg) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

/** 4:3 food photo with a large emoji. */
export function foodPhoto(emoji, variant = 0) {
  const [bg, fg] = PALETTES[variant % PALETTES.length];
  return svgUri(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect width="400" height="300" fill="${bg}"/><circle cx="200" cy="150" r="${95 + (variant % 3) * 8}" fill="${fg}" opacity=".15"/><text x="200" y="150" font-size="120" text-anchor="middle" dominant-baseline="central">${emoji}</text></svg>`,
  );
}

/** Square logo with initials. */
export function vendorLogo(name, variant = 0) {
  const [bg, fg] = PALETTES[variant % PALETTES.length];
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
  return svgUri(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect width="120" height="120" rx="24" fill="${fg}"/><text x="60" y="62" font-family="Poppins,sans-serif" font-weight="700" font-size="44" fill="${bg}" text-anchor="middle" dominant-baseline="central">${initials}</text></svg>`,
  );
}

/** Wide cover image. */
export function vendorCover(emoji, variant = 0) {
  const [bg, fg] = PALETTES[variant % PALETTES.length];
  return svgUri(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 400"><rect width="1200" height="400" fill="${bg}"/><path d="M0 300 Q300 220 600 300 T1200 280 V400 H0Z" fill="${fg}" opacity=".18"/><text x="980" y="190" font-size="170" text-anchor="middle" dominant-baseline="central">${emoji}</text></svg>`,
  );
}

/** A grey "document" thumbnail for uploaded files. */
export function documentImage(label) {
  return svgUri(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400"><rect width="300" height="400" fill="#F9FAFB" stroke="#E5E7EB" stroke-width="4"/><rect x="40" y="60" width="220" height="16" fill="#D1D5DB"/><rect x="40" y="100" width="180" height="12" fill="#E5E7EB"/><rect x="40" y="130" width="200" height="12" fill="#E5E7EB"/><rect x="40" y="160" width="160" height="12" fill="#E5E7EB"/><text x="150" y="330" font-family="Inter,sans-serif" font-size="20" fill="#6B7280" text-anchor="middle">${label}</text></svg>`,
  );
}
