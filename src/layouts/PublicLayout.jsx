import { Outlet } from 'react-router-dom';

import { Logo } from './parts/Logo';

/** Auth pages and error pages: centred card on the warm page background. */
export default function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="px-4 py-4 md:px-6">
        <Logo />
      </header>
      <main
        id="main"
        className="flex flex-1 items-start justify-center px-4 pb-12 pt-4 md:items-center md:pt-0"
      >
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </main>
      <footer className="px-4 py-6 text-center text-xs text-ink-muted">
        © {new Date().getFullYear()} KJT Foodie · Good food, delivered fast
      </footer>
    </div>
  );
}
