import { Heart } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

import { ROLES } from '@/constants/roles';
import { ROUTES } from '@/constants/routes';
import { useSession } from '@/features/auth';
import { cn } from '@/lib/cn';
import { formatCount } from '@/lib/format';

import { useToggleLike } from '../hooks/useFeed';

/** Heart with like count. Signed-out visitors are sent to log in first. */
export function LikeButton({ item, className }) {
  const { user } = useSession();
  const toggle = useToggleLike();
  const navigate = useNavigate();
  const location = useLocation();
  const canLike = !user || user.role === ROLES.CUSTOMER;

  const onClick = () => {
    if (!user) {
      const next = encodeURIComponent(location.pathname + location.search);
      navigate(`${ROUTES.login}?next=${next}`);
      return;
    }
    toggle.mutate({ id: item.id, isLiked: item.isLiked });
  };

  const count = (
    <span className="tabular-nums" aria-hidden="true">
      {formatCount(item.likesCount)}
    </span>
  );

  if (!canLike) {
    return (
      <span className={cn('inline-flex items-center gap-1.5 text-sm text-ink-muted', className)}>
        <Heart className="h-5 w-5" aria-hidden="true" />
        {count}
        <span className="sr-only">{`${item.likesCount} likes`}</span>
      </span>
    );
  }

  return (
    <button
      type="button"
      aria-pressed={Boolean(item.isLiked)}
      aria-label={`Like ${item.name}, ${item.likesCount} likes`}
      onClick={onClick}
      className={cn(
        'inline-flex min-h-tap items-center gap-1.5 rounded-full px-2 text-sm font-medium transition-colors hover:bg-primary-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600',
        item.isLiked ? 'text-danger' : 'text-ink-muted',
        className,
      )}
    >
      <Heart className={cn('h-5 w-5', item.isLiked && 'fill-current')} aria-hidden="true" />
      {count}
    </button>
  );
}
