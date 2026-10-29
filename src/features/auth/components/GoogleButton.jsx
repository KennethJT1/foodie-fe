import { toast } from '@/components/feedback';
import { Button } from '@/components/ui';

import { useGoogleSignIn } from '../hooks/useAuth';

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.8z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24z"
    />
    <path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.3a12 12 0 0 0 0 10.8l4-3.1z" />
    <path
      fill="#EA4335"
      d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1c.9-2.9 3.6-4.9 6.7-4.9z"
    />
  </svg>
);

/**
 * Sign in with Google (FR-ACC-05). On mocks it signs in a demo Google account; with the real
 * backend the credential comes from Google Identity Services.
 */
export function GoogleButton({ onSignedIn, label = 'Continue with Google' }) {
  const google = useGoogleSignIn();
  return (
    <Button
      variant="outline"
      fullWidth
      leftIcon={<GoogleIcon />}
      loading={google.isPending}
      onClick={() =>
        google.mutate(
          {
            credential: 'mock-google-credential',
            email: 'google.user@gmail.com',
            name: 'Chioma Obi',
          },
          { onSuccess: onSignedIn, onError: (e) => toast.error(e) },
        )
      }
    >
      {label}
    </Button>
  );
}

export function OrDivider() {
  return (
    <div className="flex items-center gap-3 text-xs uppercase text-ink-muted">
      <span className="h-px flex-1 bg-surface-border" />
      or
      <span className="h-px flex-1 bg-surface-border" />
    </div>
  );
}
