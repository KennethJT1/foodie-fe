import { NavLink } from 'react-router-dom';

import { cn } from '@/lib/cn';

/** Renders whatever the role's nav config contains. */
export function SidebarNav({ sections, badges = {}, onNavigate }) {
  return (
    <nav aria-label="Main" className="space-y-6">
      {sections.map((section, i) => (
        <div key={section.title ?? i}>
          {section.title && (
            <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">
              {section.title}
            </p>
          )}
          <ul className="space-y-0.5">
            {section.items.map(({ label, icon: Icon, to, end, badgeKey }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={end}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cn(
                      'flex min-h-[40px] items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors',
                      isActive ? 'bg-primary-50 text-primary-700' : 'text-ink hover:bg-gray-100',
                    )
                  }
                >
                  <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
                  <span className="flex-1">{label}</span>
                  {badgeKey && badges[badgeKey] > 0 && (
                    <span className="rounded-full bg-primary-600 px-2 text-xs text-white">
                      {badges[badgeKey]}
                    </span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
