import { Check, Plus } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui';
import { ROLES } from '@/constants/roles';
import { ROUTES } from '@/constants/routes';
import { useSession } from '@/features/auth';

import { useToggleFollow } from '../hooks/useVendors';

/** Follow a vendor to see their new dishes. Signed-out visitors log in first. */
export function FollowButton({ vendor, size = 'md' }) {
  const { user } = useSession();
  const toggle = useToggleFollow();
  const navigate = useNavigate();
  const location = useLocation();
  if (user && user.role !== ROLES.CUSTOMER) return null;

  const onClick = () => {
    if (!user) {
      navigate(`${ROUTES.login}?next=${encodeURIComponent(location.pathname)}`);
      return;
    }
    toggle.mutate({ id: vendor.id, isFollowing: vendor.isFollowing });
  };

  return (
    <Button
      size={size}
      variant={vendor.isFollowing ? 'outline' : 'primary'}
      aria-pressed={Boolean(vendor.isFollowing)}
      leftIcon={vendor.isFollowing ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
      onClick={onClick}
    >
      {vendor.isFollowing ? 'Following' : 'Follow'}
    </Button>
  );
}
