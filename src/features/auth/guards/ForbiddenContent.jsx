import { ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';

import { EmptyState } from '@/components/feedback';
import { Button } from '@/components/ui';
import { getRoleHome } from '@/constants/roles';
import { useAuthStore } from '@/stores/auth-store';

export function ForbiddenContent() {
  const user = useAuthStore((s) => s.user);
  return (
    <EmptyState
      icon={ShieldAlert}
      title="You don't have access to this page"
      message="Ask a super admin if you need it for your work."
      action={
        <Button asChild variant="outline">
          <Link to={getRoleHome(user)}>Go to your home</Link>
        </Button>
      }
    />
  );
}
