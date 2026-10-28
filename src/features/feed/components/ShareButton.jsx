import { Share2 } from 'lucide-react';

import { toast } from '@/components/feedback';
import { Button } from '@/components/ui';

/** Shares to WhatsApp and other apps with the native share sheet; copies the link otherwise. */
export function ShareButton({
  title,
  text,
  path,
  label = 'Share',
  variant = 'ghost',
  size = 'sm',
}) {
  const onShare = async () => {
    const url = new URL(path ?? window.location.pathname, window.location.origin).toString();
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch (error) {
        if (error?.name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied. Paste it anywhere to share.');
    } catch {
      toast.error("We couldn't copy the link. Copy it from the address bar instead.");
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={onShare}
      leftIcon={<Share2 className="h-4 w-4" />}
      aria-label={`${label} ${title}`}
    >
      {label}
    </Button>
  );
}
