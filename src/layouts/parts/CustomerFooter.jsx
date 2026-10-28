import { Link } from 'react-router-dom';

import { ROUTES } from '@/constants/routes';

const LINKS = [
  {
    title: 'For customers',
    items: [
      ['Find food', ROUTES.search],
      ['Your orders', ROUTES.account.orders],
      ['Help and support', ROUTES.account.support],
    ],
  },
  {
    title: 'Work with us',
    items: [
      ['Sell on KJT Foodie', ROUTES.signup('vendor')],
      ['Ride with KJT Foodie', ROUTES.signup('rider')],
      ['Log in', ROUTES.login],
    ],
  },
];

/** Light grey footer with a navy bottom bar (UI kit). */
export function CustomerFooter() {
  return (
    <footer className="mt-12 bg-surface-muted">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3 md:px-6">
        <div className="space-y-3">
          <img src="/logo.webp" alt="KJT Foodie" width="80" height="80" className="h-20 w-20" />
          <p className="max-w-xs text-sm text-ink-muted">
            Good food, delivered fast. Order from restaurants and home cooks across Nigeria, and
            track your rider live.
          </p>
        </div>
        {LINKS.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h2 className="mb-3 text-sm font-semibold">{col.title}</h2>
            <ul className="space-y-2 text-sm">
              {col.items.map(([label, to]) => (
                <li key={to}>
                  <Link to={to} className="text-ink-muted hover:text-ink hover:underline">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="bg-ink text-white">
        <p className="mx-auto max-w-6xl px-4 py-4 text-xs md:px-6">
          © {new Date().getFullYear()} KJT Foodie. All rights reserved. Payments by Paystack.
        </p>
      </div>
    </footer>
  );
}
