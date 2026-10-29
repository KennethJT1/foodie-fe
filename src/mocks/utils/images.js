/**
 * Real photographs for the mock app (Wikimedia Commons, listed in docs/backend/seed-images.json).
 * Helpers return URLs; `photoCredit(url)` gives the attribution.
 */
import SEED_IMAGES from '../../../docs/backend/seed-images.json';

const CREDITS = new Map(
  [
    ...Object.values(SEED_IMAGES.dishes).flat(),
    ...SEED_IMAGES.vendorCovers,
    ...SEED_IMAGES.documentSample,
  ].map((p) => [p.url, p.credit]),
);

const DISH_NAMES = Object.keys(SEED_IMAGES.dishes);

const pick = (list, variant) => list[variant % list.length].url;

/** Photo of a seeded dish, rotated by `variant`; any dish photo when the name is unknown. */
export function foodPhoto(dishName, variant = 0) {
  const photos = SEED_IMAGES.dishes[dishName] ?? Object.values(SEED_IMAGES.dishes).flat();
  return pick(photos, variant);
}

/** All photos of a dish starting at `variant`, so vendors selling the same dish differ. */
export function foodPhotos(dishName, count, variant = 0) {
  const photos = SEED_IMAGES.dishes[dishName] ?? [];
  return Array.from({ length: Math.min(count, photos.length) }, (_, i) =>
    pick(photos, variant + i),
  );
}

/** Wide cover: a real Nigerian food stall, suya spot or kitchen. */
export function vendorCover(variant = 0) {
  return pick(SEED_IMAGES.vendorCovers, variant);
}

/** Square logo: a real photo (rendered with object-cover, so it crops to the centre). */
export function vendorLogo(variant = 0) {
  return foodPhoto(DISH_NAMES[variant % DISH_NAMES.length], 0);
}

/** Sample paperwork photo used for every uploaded document. */
export function documentImage() {
  return SEED_IMAGES.documentSample[0].url;
}

/** `{ author, license, source }` for a photo URL, or null for uploads. */
export function photoCredit(url) {
  return CREDITS.get(url) ?? null;
}
