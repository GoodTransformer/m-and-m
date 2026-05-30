// Imported images are optimised by Astro (Sharp) at build time — WebP, sized
// to the layout, with intrinsic dimensions for zero layout shift.
import type { ImageMetadata } from 'astro';

import magdalen from './images/magdalen.jpg';
import westonManor from './images/weston-manor.jpg';
import magdalenWide from './images/magdalen-wide.jpg';
import westonGarden from './images/weston-garden.webp';
import ourStory from './images/our-story.jpg';

/** Venue card images, keyed by Venue.id. */
export const venueImages: Record<string, ImageMetadata> = {
  magdalen,
  'weston-manor': westonManor,
};

export { magdalen, westonManor, magdalenWide, westonGarden, ourStory };
