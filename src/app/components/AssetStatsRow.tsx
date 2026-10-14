import { useEffect, useRef, useState } from 'react';
import type { Ticket } from './TicketListPage';
import type { FilterRule } from './TicketFilterBar';

/* KPI strip above the Hardware Assets listing — the numbers an asset manager scans
   before touching a row, ordered the way the asset DETAIL page tells its story:
   fleet size → lifecycle (In Use / In Stock / needs-attention) → the detail-page Overview
   KPIs rolled up fleet-wide (Warranty, Patch compliance, Antivirus, Impact). Every
   countable value derives from the SAME rows the grid renders; the health facts
   (warranty days, missing patches, AV, incidents) are seeded deterministically per
   asset id — the same recipe the detail page uses for its per-asset KPIs. */

const hx = (id: string, salt: number) => {
  let n = salt;
  for (const ch of id) n = (n * 31 + ch.charCodeAt(0)) % 997;
  return n;
};
/** The per-asset health facts, deterministic by id. */
export const assetHealthOf = (id: string) => ({
  warrantyDays: (hx(id, 3) % 330) - 25,
  patchesMissing: hx(id, 7) % 4 === 0 ? 1 + (hx(id, 11) % 9) : 0,
  avOff: hx(id, 13) % 7 === 2,
  incidents: hx(id, 17) % 5 === 0 ? 1 + (hx(id, 19) % 3) : 0,
});

/** Compliance grading for percentage KPIs — the SLA pills' thresholds. */
export const pctGrade = (pct: number) => (pct >= 90 ? '#15803D' : pct >= 75 ? '#B45309' : '#B42318');

/** One KPI card in a listing stats strip — shared by every asset-module listing.
    Every card is the same shape (label → headline value → supporting line), so a
    percentage KPI leads with its percentage rather than growing its own chart. */
export type StatCard = {
  label: string;
  value: string | number;
  sub: string;
  hint?: string;
  filter?: Omit<FilterRule, 'id'>[];
  valueColor?: string;
};

/* The strip renderer, extracted so every module's listing builds its OWN card set
   (from its detail page's KPI story) over one shared chrome: scrollable row,
   edge fades, clickable cards that apply/clear a filter. */
export function StatsCardsRow({
  cards,
  rules,
  onApplyFilter,
  activeLabel,
  onCardClick,
}: {
  cards: StatCard[];
  rules: FilterRule[];
  onApplyFilter: (rules: FilterRule[]) => void;
  /** Lit card when the page tracks its own selection instead of filter rules
      (Approvals: the cards ARE the status tabs, so they leave no filter chip). */
  activeLabel?: string | null;
  /** Takes over from `onApplyFilter` when the page owns the selection. */
  onCardClick?: (card: StatCard) => void;
}) {
  /* Edge fades: a soft white gradient at whichever side still hides cards. */
  const scrollRef = useRef<HTMLDivElement>(null);
  const [fadeL, setFadeL] = useState(false);
  const [fadeR, setFadeR] = useState(false);
  const updateFades = () => {
    const el = scrollRef.current;
    if (!el) return;
    setFadeL(el.scrollLeft > 4);
    setFadeR(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };
  useEffect(() => {
    updateFades();
    const el = scrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver(updateFades);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const isApplied = (label: string) =>
    onCardClick ? activeLabel === label : rules.some((r) => r.id.startsWith(`kpi-${label}-`));
  const clickable = (c: StatCard) => !!onCardClick || !!c.filter;
  const activate = (c: StatCard, on: boolean) => {
    if (onCardClick) return onCardClick(c);
    if (c.filter) onApplyFilter(on ? [] : c.filter.map((r, i) => ({ ...r, id: `kpi-${c.label}-${i}` })));
  };
  const label = 'text-[12px] font-medium text-[#64748B]';
  const valueCls = 'mt-1 text-[22px] font-semibold leading-7 text-[#1E293B] tabular-nums';
  const subCls = 'mt-0.5 text-[11px] text-[#94A3B8]';

  return (
    <div className="relative">
      <div ref={scrollRef} onScroll={updateFades} className="no-scrollbar-ever flex gap-3 overflow-x-auto pb-3 pl-6 pr-4">
        {cards.map((c) => {
          const on = isApplied(c.label);
          return (
            <div
              key={c.label}
              role={clickable(c) ? 'button' : undefined}
              tabIndex={clickable(c) ? 0 : undefined}
              title={
                clickable(c)
                  ? on
                    /* Tab mode always keeps one selected, so it never offers "clear". */
                    ? (onCardClick ? 'Showing these now' : 'Showing this view — click to clear')
                    : c.hint
                  : undefined
              }
              onClick={() => clickable(c) && activate(c, on)}
              onKeyDown={(e) => {
                if (clickable(c) && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  activate(c, on);
                }
              }}
              className={`flex flex-[1_0_196px] items-center justify-between gap-3 rounded-lg border px-4 py-3 transition-all ${
                on
                  ? 'border-[#3D8BD0] bg-[#F5FAFF] shadow-[0_1px_3px_rgba(61,139,208,0.15)]'
                  : 'border-[#E5E7EB] bg-white'
              } ${clickable(c) ? 'cursor-pointer hover:border-[#C9D4E0] hover:shadow-sm' : ''}`}
            >
              <div>
                <div className={label}>{c.label}</div>
                <div className={valueCls} style={c.valueColor ? { color: c.valueColor } : undefined}>
                  {c.value}
                </div>
                <div className={subCls}>{c.sub}</div>
              </div>
            </div>
          );
        })}
      </div>
      {fadeL && <div className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-white to-transparent" />}
      {fadeR && <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-white to-transparent" />}
    </div>
  );
}

export function AssetStatsRow({
  tickets,
  rules,
  onApplyFilter,
}: {
  tickets: Ticket[];
  rules: FilterRule[];
  onApplyFilter: (rules: FilterRule[]) => void;
}) {
  const total = tickets.length;
  const health = tickets.map((t) => assetHealthOf(t.id));
  const inUse = tickets.filter((t) => (t.status as string) === 'In Use').length;
  const inStock = tickets.filter((t) => (t.status as string) === 'In Stock').length;
  const ATTENTION = ['In Repair', 'Faulty', 'Missing', 'Theft'];
  const attention = tickets.filter((t) => ATTENTION.includes(t.status as string)).length;
  const types = new Set(tickets.map((t) => t.assetType).filter(Boolean)).size;
  const expSoon = health.filter((h) => h.warrantyDays > 0 && h.warrantyDays <= 30).length;
  const expired = health.filter((h) => h.warrantyDays <= 0).length;
  const missingPatch = health.filter((h) => h.patchesMissing > 0).length;
  const compliancePct = total ? Math.round(((total - missingPatch) / total) * 100) : 100;
  const unprotectedAv = health.filter((h) => h.avOff).length;
  const impacted = health.filter((h) => h.incidents > 0).length;
  const openIncidents = health.reduce((n, h) => n + h.incidents, 0);

  const statusFilter = (value: string): Omit<FilterRule, 'id'>[] => [
    { field: 'status', condition: 'is', values: [value] },
  ];

  const cards: StatCard[] = [
    {
      label: 'Total assets',
      value: total,
      sub: `across ${types} asset types`,
    },
    {
      label: 'In Use',
      value: inUse,
      sub: total ? `${Math.round((inUse / total) * 100)}% of the fleet` : '—',
      hint: 'Show assets that are in use',
      filter: statusFilter('In Use'),
    },
    {
      label: 'In Stock',
      value: inStock,
      sub: 'ready to allocate',
      hint: 'Show assets in stock',
      filter: statusFilter('In Stock'),
    },
    {
      label: 'Needs attention',
      value: attention,
      sub: 'in repair · faulty · missing · theft',
      hint: 'Show assets needing attention',
      filter: [{ field: 'status', condition: 'is', values: ATTENTION }],
      valueColor: attention > 0 ? '#B42318' : '#15803D',
    },
    {
      label: 'Warranty expiring',
      value: expSoon,
      sub: expired ? `within 30 days · ${expired} already expired` : 'within 30 days',
      valueColor: expSoon > 0 ? '#B45309' : undefined,
    },
    {
      label: 'Patch compliance',
      value: `${compliancePct}%`,
      sub: `${missingPatch} asset${missingPatch === 1 ? '' : 's'} missing patches`,
      valueColor: pctGrade(compliancePct),
    },
    {
      label: 'Unprotected',
      value: unprotectedAv,
      sub: 'no active antivirus',
      valueColor: unprotectedAv > 0 ? '#B42318' : '#15803D',
    },
    {
      label: 'Active incidents',
      value: openIncidents,
      sub: `open records on ${impacted} asset${impacted === 1 ? '' : 's'}`,
      valueColor: openIncidents > 0 ? '#B42318' : undefined,
    },
  ];

  return <StatsCardsRow cards={cards} rules={rules} onApplyFilter={onApplyFilter} />;
}
