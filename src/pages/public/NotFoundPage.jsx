import { MapPinOff } from 'lucide-react';
import { Link } from 'react-router-dom';

import { EmptyState } from '@/components/feedback';
import { Button } from '@/components/ui';
import { getRoleHome } from '@/constants/roles';
import { useAuthStore } from '@/stores/auth-store';

export default function NotFoundPage() {
  const user = useAuthStore((s) => s.user);
  return (
    <EmptyState
      icon={MapPinOff}
      title="We couldn't find that page"
      message="The link may be old, or the page has moved."
      action={
        <Button asChild>
          <Link to={getRoleHome(user)}>Go home</Link>
        </Button>
      }
    />
  );
}
