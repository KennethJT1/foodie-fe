import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { CHART_COLORS } from '@/components/data';
import { formatNaira } from '@/lib/format';

/** "2026-10-28" (a Lagos day) → "28 Oct" */
export const shortDay = (date) =>
  new Date(`${date}T12:00:00Z`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    timeZone: 'Africa/Lagos',
  });

const compactNaira = (kobo) => {
  const n = kobo / 100;
  return n >= 1000 ? `₦${Math.round(n / 1000)}k` : `₦${n}`;
};

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg bg-surface px-3 py-2 text-xs shadow-pop">
      <p className="font-medium text-ink">{shortDay(d.date)}</p>
      <p className="text-ink">{formatNaira(d.sales)}</p>
      <p className="text-ink-muted">
        {d.orders} order{d.orders === 1 ? '' : 's'}
      </p>
    </div>
  );
}

/** Daily food sales: one series, so the card title names it and there is no legend. */
export function SalesChart({ series }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={series} margin={{ top: 4, right: 4, bottom: 0, left: 0 }} barCategoryGap={2}>
        <CartesianGrid vertical={false} stroke={CHART_COLORS.grid} />
        <XAxis
          dataKey="date"
          tickFormatter={shortDay}
          tick={{ fontSize: 11, fill: CHART_COLORS.inkMuted }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
          minTickGap={16}
        />
        <YAxis
          tickFormatter={compactNaira}
          tick={{ fontSize: 11, fill: CHART_COLORS.inkMuted }}
          tickLine={false}
          axisLine={false}
          width={48}
        />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: CHART_COLORS.grid, opacity: 0.5 }} />
        <Bar
          dataKey="sales"
          name="Sales"
          fill={CHART_COLORS.primary}
          radius={[4, 4, 0, 0]}
          maxBarSize={28}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
