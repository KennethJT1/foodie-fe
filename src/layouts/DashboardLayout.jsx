import { Menu } from 'lucide-react';
import { useMemo } from 'react';
import { Outlet } from 'react-router-dom';

import { Drawer, IconButton } from '@/components/ui';
import { NotificationBell } from '@/features/notifications';
import { useAuthStore } from '@/stores/auth-store';
import { useUiStore } from '@/stores/ui-store';

import { filterNav } from './nav/filter-nav';
import { BottomTabs } from './parts/BottomTabs';
import { Logo } from './parts/Logo';
import { SidebarNav } from './parts/Sidebar';
import { UserMenu } from './parts/UserMenu';

/**
 * Sidebar + header for vendor, rider and admin. `nav` is the role's menu config;
 * `tabs` adds a phone bottom bar (riders). `banner` renders above the page (e.g. plan warnings).
 */
export default function DashboardLayout({
  nav,
  tabs,
  subtitle,
  home = '/',
  notificationsTo,
  profileTo,
  banner: Banner,
  badges,
}) {
  const user = useAuthStore((s) => s.user);
  const isOpen = useUiStore((s) => s.isMobileNavOpen);
  const setOpen = useUiStore((s) => s.setMobileNavOpen);
  const sections = useMemo(() => filterNav(nav, user), [nav, user]);

  return (
    <div className="min-h-screen bg-surface-page lg:pl-64">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-surface-border bg-surface lg:flex">
        <div className="flex h-16 items-center px-5">
          <Logo to={home} subtitle={subtitle} />
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <SidebarNav sections={sections} badges={badges} />
        </div>
      </aside>

      <Drawer open={isOpen} onClose={() => setOpen(false)} title="Menu" side="left">
        <div className="px-3 py-4">
          <SidebarNav sections={sections} badges={badges} onNavigate={() => setOpen(false)} />
        </div>
      </Drawer>

      <header className="sticky top-0 z-20 flex h-16 items-center gap-2 border-b border-surface-border bg-surface/95 px-2 backdrop-blur md:px-4">
        <IconButton
          icon={Menu}
          label="Open menu"
          className="lg:hidden"
          onClick={() => setOpen(true)}
        />
        <Logo to={home} subtitle={subtitle} className="lg:hidden" showText={false} />
        <span className="font-heading text-sm font-semibold lg:hidden">{subtitle}</span>
        <div className="ml-auto flex items-center gap-1">
          {notificationsTo && <NotificationBell to={notificationsTo} />}
          <UserMenu profileTo={profileTo} />
        </div>
      </header>

      {Banner && <Banner />}
      <main id="main" className={tabs ? 'pb-[72px] md:pb-0' : undefined}>
        <div className="mx-auto max-w-7xl">
          <Outlet />
        </div>
      </main>
      {tabs && <BottomTabs tabs={tabs} label="Rider" />}
    </div>
  );
}
