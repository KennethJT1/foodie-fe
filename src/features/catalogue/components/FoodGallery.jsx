import { useState } from 'react';

import { cn } from '@/lib/cn';

import { FoodImage } from './FoodImage';

/** Main photo with tappable thumbnails and the photo credit, when it has one. */
export function FoodGallery({ photos = [], credits = [], alt, className }) {
  const [index, setIndex] = useState(0);
  const current = photos[index] ?? photos[0];
  const credit = credits.find((c) => c.url === current);
  return (
    <div className={cn('space-y-2', className)}>
      <div className="overflow-hidden rounded-card">
        <FoodImage src={current} alt={alt} eager />
      </div>
      {credit?.author && (
        <p className="text-xs text-ink-muted">
          Photo:{' '}
          <a href={credit.source} target="_blank" rel="noreferrer" className="underline">
            {credit.author}
          </a>
          , {credit.license}
        </p>
      )}
      {photos.length > 1 && (
        <div className="flex gap-2" role="group" aria-label="Photos">
          {photos.map((p, i) => (
            <button
              key={p.slice(-32) + i}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Show photo ${i + 1} of ${photos.length}`}
              aria-pressed={i === index}
              className={cn(
                'w-20 overflow-hidden rounded-lg border-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink',
                i === index ? 'border-primary' : 'border-transparent',
              )}
            >
              <FoodImage src={p} alt="" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
