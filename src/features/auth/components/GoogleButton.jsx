import { useEffect, useRef, useState } from 'react';

import { Spinner, toast } from '@/components/feedback';
import { Button } from '@/components/ui';
import { env } from '@/lib/env';

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

const GSI_SRC = 'https://accounts.google.com/gsi/client';
let gsiPromise;

/** Loads Google Identity Services once and resolves with `window.google.accounts.id`. */
function loadGsi() {
  if (window.google?.accounts?.id) return Promise.resolve(window.google.accounts.id);
  gsiPromise ??= new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = GSI_SRC;
    script.async = true;
    script.onload = () => resolve(window.google.accounts.id);
    script.onerror = () => {
      gsiPromise = undefined;
      reject(new Error("Couldn't load Google sign-in. Check your connection and try again."));
    };
    document.head.appendChild(script);
  });
  return gsiPromise;
}

/**
 * Sign in with Google (FR-ACC-05). On mocks it signs in a demo Google account; with the real
 * backend it renders Google's own button (Google Identity Services) and sends its ID token.
 */
export function GoogleButton(props) {
  return env.useMocks ? <MockGoogleButton {...props} /> : <RealGoogleButton {...props} />;
}

function MockGoogleButton({ onSignedIn, label = 'Continue with Google' }) {
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

function RealGoogleButton({ onSignedIn, label = 'Continue with Google' }) {
  const google = useGoogleSignIn();
  const container = useRef(null);
  const [failed, setFailed] = useState(!env.googleClientId);
  // Google calls back long after render; keep the latest handlers without re-rendering its button.
  const latest = useRef({ google, onSignedIn });
  latest.current = { google, onSignedIn };

  useEffect(() => {
    if (!env.googleClientId) return undefined;
    let cancelled = false;
    loadGsi()
      .then((gsi) => {
        if (cancelled || !container.current) return;
        gsi.initialize({
          client_id: env.googleClientId,
          callback: ({ credential }) =>
            latest.current.google.mutate(
              { credential },
              {
                onSuccess: (...args) => latest.current.onSignedIn?.(...args),
                onError: (e) => toast.error(e),
              },
            ),
        });
        gsi.renderButton(container.current, {
          theme: 'outline',
          size: 'large',
          shape: 'pill',
          text: label.toLowerCase().startsWith('sign up') ? 'signup_with' : 'continue_with',
          width: Math.min(container.current.offsetWidth || 400, 400),
        });
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [label]);

  if (failed) {
    return (
      <Button
        variant="outline"
        fullWidth
        leftIcon={<GoogleIcon />}
        onClick={() =>
          toast.error(
            env.googleClientId
              ? "Couldn't load Google sign-in. Check your connection and try again."
              : "Google sign-in isn't set up yet.",
          )
        }
      >
        {label}
      </Button>
    );
  }

  return (
    <div className="relative flex min-h-10 w-full justify-center">
      <div ref={container} className="w-full max-w-[400px] [&>div]:mx-auto" />
      {google.isPending && (
        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-surface/80">
          <Spinner />
        </div>
      )}
    </div>
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
