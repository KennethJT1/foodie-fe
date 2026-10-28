import { ImagePlus, X } from 'lucide-react';
import { useId, useRef, useState } from 'react';

import { Spinner } from '@/components/ui/Spinner';
import { cn } from '@/lib/cn';
import { compressImage } from '@/lib/image';

import { FormField } from './fields';

const defaultUpload = async (file) => (await compressImage(file)).dataUrl;

/**
 * Picks images, checks type and size, compresses to WebP and shows previews.
 * `onUpload(file) => Promise<url>` does the real upload (features pass their API function);
 * the default keeps the compressed image as a data URL.
 */
export function ImageUploadControl({
  label,
  hint,
  value = [],
  onChange,
  max = 1,
  maxSizeMb = 2,
  onUpload = defaultUpload,
  accept = 'image/jpeg,image/png,image/webp',
  error: externalError,
  aspect = 'aspect-[4/3]',
  itemLabel = 'photo',
}) {
  const id = useId();
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(0);
  const [localError, setLocalError] = useState(null);
  const urls = Array.isArray(value) ? value : value ? [value] : [];
  const single = max === 1;
  const error = externalError ?? localError;

  const emit = (next) => onChange?.(single ? (next[0] ?? null) : next);

  const onFiles = async (files) => {
    setLocalError(null);
    const room = max - urls.length;
    const picked = [...files].slice(0, single ? 1 : room);
    if (!single && files.length > room)
      setLocalError(`You can add up to ${max} ${itemLabel}s on your plan.`);
    const accepted = [];
    for (const f of picked) {
      if (!accept.split(',').includes(f.type)) {
        setLocalError('Use a JPG, PNG or WebP image.');
        continue;
      }
      if (f.size > maxSizeMb * 4 * 1024 * 1024) {
        // Allow larger originals; compression brings them under the limit
        setLocalError(`That image is too large. Keep it under ${maxSizeMb} MB.`);
        continue;
      }
      accepted.push(f);
    }
    if (!accepted.length) return;
    setBusy(accepted.length);
    try {
      const uploaded = await Promise.all(accepted.map((f) => onUpload(f)));
      emit(single ? uploaded : [...urls, ...uploaded]);
    } catch {
      setLocalError("We couldn't upload that image. Try again.");
    } finally {
      setBusy(0);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const remove = (url) => emit(urls.filter((u) => u !== url));
  const canAdd = single || urls.length < max;

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-ink">
          {label}
        </label>
      )}
      <div
        className={cn(
          'grid gap-3',
          single ? 'grid-cols-1 sm:max-w-xs' : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4',
        )}
      >
        {urls.map((url, i) => (
          <div
            key={url.slice(-40) + i}
            className={cn(
              'relative overflow-hidden rounded-lg border border-surface-border bg-gray-50',
              aspect,
            )}
          >
            <img src={url} alt={`${itemLabel} ${i + 1}`} className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => remove(url)}
              aria-label={`Remove ${itemLabel} ${i + 1}`}
              className="absolute right-1 top-1 flex h-8 w-8 items-center justify-center rounded-full bg-ink/70 text-white hover:bg-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        ))}
        {Array.from({ length: busy }, (_, i) => (
          <div
            key={`busy-${i}`}
            className={cn(
              'flex items-center justify-center rounded-lg border border-dashed border-surface-border',
              aspect,
            )}
          >
            <Spinner label="Uploading" />
          </div>
        ))}
        {canAdd && !busy && (single ? urls.length === 0 : true) && (
          <label
            htmlFor={id}
            className={cn(
              'flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed text-center text-sm text-ink-muted transition-colors focus-within:ring-2 focus-within:ring-primary-600 hover:border-primary-600 hover:text-primary-700',
              error ? 'border-danger' : 'border-surface-border',
              aspect,
            )}
          >
            <ImagePlus className="h-6 w-6" aria-hidden="true" />
            <span>Add {itemLabel}</span>
            <input
              ref={inputRef}
              id={id}
              type="file"
              accept={accept}
              multiple={!single}
              className="sr-only"
              aria-invalid={error ? true : undefined}
              onChange={(e) => onFiles(e.target.files ?? [])}
            />
          </label>
        )}
      </div>
      {error ? (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : (
        hint && <p className="text-sm text-ink-muted">{hint}</p>
      )}
    </div>
  );
}

/** Image upload bound to a Form field, or standalone with value/onChange. */
export function ImageUpload({ name, ...props }) {
  if (!name) return <ImageUploadControl {...props} />;
  return (
    <FormField name={name}>
      {(field, error) => (
        <ImageUploadControl
          value={field.value}
          onChange={field.onChange}
          error={error}
          {...props}
        />
      )}
    </FormField>
  );
}
