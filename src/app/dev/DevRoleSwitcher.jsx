import { useQueryClient } from '@tanstack/react-query';
import { UserCog } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { toast } from '@/components/feedback';
import { Button, Modal } from '@/components/ui';
import { getRoleHome } from '@/constants/roles';
import { authApi } from '@/features/auth';
import { useAuthStore } from '@/stores/auth-store';

/** Development-only: sign in as any demo account in one tap (mock mode). */
const DEMO_ACCOUNTS = [
  ['Customer — Ada Okafor', 'customer@kjtfoodie.test'],
  ['Vendor — Mama Put Kitchen (Pro)', 'vendor@kjtfoodie.test'],
  ['Vendor — plan expired', 'expired.vendor@kjtfoodie.test'],
  ['Vendor — new, not onboarded', 'new.vendor@kjtfoodie.test'],
  ['Rider — Tunde Bakare', 'rider@kjtfoodie.test'],
  ['Rider — new, not onboarded', 'new.rider@kjtfoodie.test'],
  ['Admin — Super admin', 'super@kjtfoodie.test'],
  ['Admin — Support', 'support@kjtfoodie.test'],
  ['Admin — Finance', 'finance@kjtfoodie.test'],
  ['Admin — Dispatch', 'dispatch@kjtfoodie.test'],
  ['Admin — Onboarding', 'onboarding@kjtfoodie.test'],
];

export default function DevRoleSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const [busy, setBusy] = useState(null);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const current = useAuthStore((s) => s.user);

  const switchTo = async (email) => {
    setBusy(email);
    try {
      const session = await authApi.login({ email, password: 'password123' });
      qc.clear();
      useAuthStore.getState().setSession(session);
      setIsOpen(false);
      navigate(getRoleHome(session.user));
    } catch (e) {
      toast.error(e);
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-3 z-40 flex h-11 items-center gap-2 rounded-full bg-ink px-4 text-xs font-medium text-white shadow-lg md:bottom-4"
      >
        <UserCog className="h-4 w-4" aria-hidden="true" />
        Demo accounts
      </button>
      <Modal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        title="Switch demo account"
        description="Mock mode only. Password password123, OTP 123456."
      >
        <ul className="space-y-2">
          {DEMO_ACCOUNTS.map(([label, email]) => (
            <li key={email}>
              <Button
                fullWidth
                variant={current?.email === email ? 'secondary' : 'outline'}
                className="justify-start"
                loading={busy === email}
                onClick={() => switchTo(email)}
              >
                {label}
              </Button>
            </li>
          ))}
        </ul>
      </Modal>
    </>
  );
}
