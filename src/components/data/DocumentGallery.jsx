import { FileText } from 'lucide-react';
import { useState } from 'react';

import { EmptyState } from '@/components/feedback/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { formatDate } from '@/lib/format';

/** Thumbnails of uploaded documents; tap one to see it full size. `documents`: [{ id, label, url, uploadedAt }]. */
export function DocumentGallery({ documents = [], required = [] }) {
  const [open, setOpen] = useState(null);
  const missing = required.filter((r) => !documents.some((d) => d.type === r.type));
  if (!documents.length && !missing.length)
    return <EmptyState compact icon={FileText} title="No documents uploaded" />;
  return (
    <>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {documents.map((d) => (
          <li key={d.id}>
            <button
              type="button"
              onClick={() => setOpen(d)}
              className="block w-full space-y-1 rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
            >
              <img
                src={d.url}
                alt={d.label}
                loading="lazy"
                className="aspect-[3/2] w-full rounded-lg border border-surface-border object-cover"
              />
              <span className="block text-xs font-medium">{d.label}</span>
              <span className="block text-xs text-ink-muted">
                Uploaded {formatDate(d.uploadedAt)}
              </span>
            </button>
          </li>
        ))}
        {missing.map((r) => (
          <li
            key={r.type}
            className="flex aspect-[3/2] items-center justify-center rounded-lg border border-dashed border-danger p-2 text-center text-xs text-danger"
          >
            {r.label} missing
          </li>
        ))}
      </ul>
      <Modal open={Boolean(open)} onClose={() => setOpen(null)} title={open?.label ?? ''} size="lg">
        {open && (
          <img
            src={open.url}
            alt={open.label}
            className="max-h-[70vh] w-full rounded-lg object-contain"
          />
        )}
      </Modal>
    </>
  );
}
