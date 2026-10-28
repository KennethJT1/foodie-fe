import { Bike, CheckCircle2, Search } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui';
import { ROUTES } from '@/constants/routes';

/** Hero from the UI kit: headline and search on the left, orange panel with order updates on the right. */
export function HomeHero() {
  const [text, setText] = useState('');
  const navigate = useNavigate();

  const submit = (e) => {
    e.preventDefault();
    const q = text.trim();
    navigate(q ? `${ROUTES.search}?${new URLSearchParams({ search: q })}` : ROUTES.search);
  };

  return (
    <section className="relative overflow-hidden rounded-2xl border border-surface-border bg-surface-page">
      <div className="grid items-center gap-6 p-6 md:grid-cols-2 md:p-12">
        <div className="relative z-10 space-y-5">
          <p className="text-sm text-ink-muted">
            Order jollof, suya, amala and more from vendors near you
          </p>
          <h1 className="text-3xl font-bold leading-tight md:text-5xl">
            Good food,
            <br />
            <span className="text-primary">delivered fast</span>
          </h1>
          <form
            role="search"
            onSubmit={submit}
            className="flex max-w-md items-center gap-2 rounded-full border border-surface-border bg-surface p-1.5 shadow-card"
          >
            <label htmlFor="hero-search" className="sr-only">
              Search for food or a vendor
            </label>
            <Search className="ml-3 h-5 w-5 shrink-0 text-ink-muted" aria-hidden="true" />
            <input
              id="hero-search"
              type="search"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="e.g. party jollof rice"
              className="min-w-0 flex-1 border-0 bg-transparent text-sm focus:ring-0"
            />
            <Button type="submit" className="shrink-0">
              Search
            </Button>
          </form>
        </div>

        <div className="relative hidden h-72 md:block" aria-hidden="true">
          <div className="absolute -right-12 -top-12 h-[calc(100%+6rem)] w-[115%] rounded-tl-[160px] bg-primary" />
          <img
            src="/logo.webp"
            alt=""
            className="absolute bottom-0 left-6 h-64 w-64 drop-shadow-xl"
          />
          <div className="absolute right-6 top-4 w-60 rounded-xl bg-surface p-3 shadow-pop">
            <p className="flex items-center gap-1.5 text-xs font-semibold">
              <CheckCircle2 className="h-4 w-4 text-secondary" />
              Order received
            </p>
            <p className="mt-1 text-xs text-ink-muted">
              Mama Put Kitchen is preparing your jollof.
            </p>
          </div>
          <div className="absolute bottom-6 right-0 w-56 rounded-xl bg-surface p-3 shadow-pop">
            <p className="flex items-center gap-1.5 text-xs font-semibold">
              <Bike className="h-4 w-4 text-primary-700" />
              Your rider is on the way
            </p>
            <p className="mt-1 text-xs text-ink-muted">Arriving in 12 min · track live</p>
          </div>
        </div>
      </div>
    </section>
  );
}
