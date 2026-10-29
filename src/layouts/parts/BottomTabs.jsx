import { NavLink } from 'react-router-dom';

import { cn } from '@/lib/cn';

/** Fixed tab bar on phones. */
export function BottomTabs({ tabs, label = 'Main' }) {
  return (
    <nav
      aria-label={label}
      className="fixed inset-x-0 bottom-0 z-30 border-t border-surface-border bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <ul
        className="grid"
        style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
      >
        {tabs.map(({ label: text, icon: Icon, to, end, badge }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'relative flex min-h-[56px] flex-col items-center justify-center gap-0.5 text-[11px] font-medium',
                  isActive
                    ? 'font-semibold text-ink [&>span:first-child]:bg-primary'
                    : 'text-ink-muted',
                )
              }
            >
              <span className="flex h-7 w-12 items-center justify-center rounded-full transition-colors">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              {text}
              {badge > 0 && (
                <span className="absolute right-[calc(50%-20px)] top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-ink">
                  {badge}
                </span>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
