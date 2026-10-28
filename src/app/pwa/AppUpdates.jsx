import { Download, RefreshCw, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

import { Button, IconButton } from '@/components/ui';

const DISMISSED_KEY = 'kjt-install-dismissed';

function readDismissed() {
  try {
    return window.localStorage.getItem(DISMISSED_KEY) === '1';
  } catch {
    return false;
  }
}

function Bar({ children, onClose }) {
  return (
    <div
      role="status"
      className="fixed inset-x-2 bottom-2 z-[60] mx-auto flex max-w-md items-center gap-3 rounded-card bg-ink p-3 text-sm text-white shadow-pop sm:bottom-4"
    >
      {children}
      {onClose && (
        <IconButton
          icon={X}
          label="Dismiss"
          onClick={onClose}
          className="text-white hover:bg-white/10"
        />
      )}
    </div>
  );
}

/**
 * Service worker registration (production without mocks): "new version" prompt, plus an
 * "Add to home screen" offer when the browser allows installing.
 */
export default function AppUpdates() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();
  const [installEvent, setInstallEvent] = useState(null);
  const [isDismissed, setDismissed] = useState(readDismissed);

  useEffect(() => {
    const onPrompt = (e) => {
      e.preventDefault();
      setInstallEvent(e);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  if (needRefresh)
    return (
      <Bar onClose={() => setNeedRefresh(false)}>
        <RefreshCw className="h-5 w-5 shrink-0" aria-hidden="true" />
        <span className="flex-1">A new version of KJT Foodie is ready.</span>
        <Button size="sm" onClick={() => updateServiceWorker(true)}>
          Update
        </Button>
      </Bar>
    );
  if (installEvent && !isDismissed)
    return (
      <Bar
        onClose={() => {
          setDismissed(true);
          try {
            window.localStorage.setItem(DISMISSED_KEY, '1');
          } catch {
            // private mode: show it again next time
          }
        }}
      >
        <Download className="h-5 w-5 shrink-0" aria-hidden="true" />
        <span className="flex-1">Add KJT Foodie to your home screen for faster ordering.</span>
        <Button
          size="sm"
          onClick={async () => {
            installEvent.prompt();
            await installEvent.userChoice.catch(() => null);
            setInstallEvent(null);
          }}
        >
          Install
        </Button>
      </Bar>
    );
  return null;
}
