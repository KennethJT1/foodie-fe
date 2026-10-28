// Development-only page that shows every design token (build plan phase 2).
const COLOURS = [
  ['primary', 'bg-primary'],
  ['primary-50', 'bg-primary-50'],
  ['primary-100', 'bg-primary-100'],
  ['primary-600', 'bg-primary-600'],
  ['primary-700', 'bg-primary-700'],
  ['secondary', 'bg-secondary'],
  ['secondary-50', 'bg-secondary-50'],
  ['secondary-600', 'bg-secondary-600'],
  ['accent', 'bg-accent'],
  ['accent-50', 'bg-accent-50'],
  ['ink', 'bg-ink'],
  ['ink-muted', 'bg-ink-muted'],
  ['surface', 'bg-surface'],
  ['surface-page', 'bg-surface-page'],
  ['surface-border', 'bg-surface-border'],
  ['danger', 'bg-danger'],
  ['warning', 'bg-warning'],
  ['info', 'bg-info'],
];

const HEADINGS = [
  ['text-3xl', 'Good food, delivered fast'],
  ['text-2xl', 'Popular near you'],
  ['text-xl', 'Mama Put Kitchen'],
  ['text-lg', 'Party jollof rice'],
];

const SPACING = [
  ['p-1', '4 px'],
  ['p-2', '8 px'],
  ['p-3', '12 px'],
  ['p-4', '16 px'],
  ['p-6', '24 px'],
  ['p-8', '32 px'],
];

export default function TokensPage() {
  return (
    <main className="mx-auto max-w-5xl space-y-8 px-4 py-6 md:px-6">
      <header className="flex items-center gap-3">
        <img src="/logo-mark.svg" alt="" width="40" height="40" />
        <h1 className="text-2xl font-semibold">KJT Foodie design tokens</h1>
      </header>

      <section aria-labelledby="colours" className="space-y-3">
        <h2 id="colours" className="text-lg font-semibold">
          Colours
        </h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
          {COLOURS.map(([name, cls]) => (
            <li key={name} className="overflow-hidden rounded-card bg-surface shadow-card">
              <div className={`h-14 border-b border-surface-border ${cls}`} />
              <p className="p-2 text-xs text-ink-muted">{name}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="type" className="space-y-3">
        <h2 id="type" className="text-lg font-semibold">
          Type
        </h2>
        {HEADINGS.map(([cls, text]) => (
          <p key={cls} className={`font-heading font-semibold ${cls}`}>
            {text} <span className="text-xs font-normal text-ink-muted">{cls}</span>
          </p>
        ))}
        <p className="text-base">Body text (Inter, text-base) in ink.</p>
        <p className="text-sm text-ink-muted">Secondary text (text-sm) in ink-muted.</p>
      </section>

      <section aria-labelledby="spacing" className="space-y-3">
        <h2 id="spacing" className="text-lg font-semibold">
          Spacing, radius and shadow
        </h2>
        <div className="flex flex-wrap items-end gap-3">
          {SPACING.map(([cls, label]) => (
            <div key={cls} className="rounded-card bg-surface text-center shadow-card">
              <div className={`${cls} bg-primary-100`}>
                <div className="h-4 w-4 bg-primary" />
              </div>
              <p className="p-1 text-xs text-ink-muted">
                {cls} · {label}
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
