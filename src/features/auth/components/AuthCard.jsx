import { Card } from '@/components/ui';

/** Card frame shared by every auth screen. */
export function AuthCard({ title, description, children, footer }) {
  return (
    <Card className="space-y-5">
      <div className="space-y-1 text-center">
        <img src="/logo.webp" alt="" width="72" height="72" className="mx-auto h-[72px] w-[72px]" />
        <h1 className="text-xl font-semibold">{title}</h1>
        {description && <p className="text-sm text-ink-muted">{description}</p>}
      </div>
      {children}
      {footer && (
        <div className="border-t border-surface-border pt-4 text-center text-sm text-ink-muted">
          {footer}
        </div>
      )}
    </Card>
  );
}
