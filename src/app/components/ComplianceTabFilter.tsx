/* Search + Filter for the lists inside the Compliance detail pages' tabs (Policy › Endpoints,
 * Rules, Run History · Benchmark › Rules, Endpoints, Policies · Endpoint › Policies).
 *
 * It is the Patch Deployment page's Deployment tab toolbar (PatchInstallationTab), lifted out so
 * seven tabs share one copy: a full-width "Select field to search…" field, then ONE Filter button
 * whose popup holds the selected values as chips, a tab per filter (a blue dot marks a tab with a
 * value set), an "All" row per tab, and Clear all / Done. Values are OR'd within a filter and
 * AND'd across filters, like every other filter in the product. A count card above a list sets
 * the same value (cardToggle), so card and popup are one filter. */
import { useState } from 'react';
import { Check, ChevronDown, Filter, Search, X } from 'lucide-react';

export interface FilterOption { value: string; label?: string; dot?: string }
export interface FilterGroup { key: string; label: string; options: FilterOption[] }
export type FilterValue = Record<string, string[]>;

/** Every set filter must hold for the row (AND); any of its values will do (OR). */
export const matchesFilter = (value: FilterValue, get: (key: string) => string | string[] | null | undefined) =>
  Object.entries(value).every(([k, vs]) => {
    if (!vs.length) return true;
    const v = get(k);
    const arr = Array.isArray(v) ? v : v == null ? [] : [v];
    return arr.some((x) => vs.includes(x));
  });

export const matchesSearch = (q: string, fields: (string | number | null | undefined)[]) => {
  const s = q.trim().toLowerCase();
  return !s || fields.some((f) => f != null && String(f).toLowerCase().includes(s));
};

/** A count card: lights when its value is the ONLY value of that filter; a click sets / clears it. */
export const cardActive = (value: FilterValue, key: string) => (value[key]?.length === 1 ? value[key][0] : null);
export const cardToggle = (value: FilterValue, key: string, v: string): FilterValue =>
  ({ ...value, [key]: cardActive(value, key) === v ? [] : [v] });

export const anyFilter = (q: string, value: FilterValue) => !!q.trim() || Object.values(value).some((v) => v.length);

/** The empty line under a list whose search / filters matched nothing. */
export function NoMatch({ what, onClear }: { what: string; onClear: () => void }) {
  return (
    <p className="py-10 text-center text-[13px] text-[#9CA3AF]">
      No {what} match your search or filters. <button type="button" onClick={onClear} className="text-[13px] font-medium text-[#3D8BD0] hover:underline">Clear</button>
    </p>
  );
}

export function TabListToolbar({ search, onSearch, groups, value, onChange, placeholder = 'Select field to search...', className = 'mb-3' }: {
  search: string;
  onSearch: (s: string) => void;
  groups: FilterGroup[];
  value: FilterValue;
  onChange: (v: FilterValue) => void;
  placeholder?: string;
  className?: string;
}) {
  const shown = groups.filter((g) => g.options.length);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState(shown[0]?.key ?? '');
  const sel = (k: string) => value[k] ?? [];
  const labelOf = (g: FilterGroup, v: string) => g.options.find((o) => o.value === v)?.label ?? v;
  const picked = shown.flatMap((g) => sel(g.key).map((v) => ({ g, v })));
  const active = picked.length > 0;
  const buttonLabel = !active ? 'All' : `${labelOf(picked[0].g, picked[0].v)}${picked.length > 1 ? ` +${picked.length - 1}` : ''}`;
  const toggle = (k: string, v: string) => onChange({ ...value, [k]: sel(k).includes(v) ? sel(k).filter((x) => x !== v) : [...sel(k), v] });
  const current = shown.find((g) => g.key === tab) ?? shown[0];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative flex-1">
        <input
          type="text"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder={placeholder}
          className="h-8 w-full rounded border border-[#d1d5db] bg-white pl-3 pr-10 text-[13px] text-[#364658] placeholder:text-[#9ca3af] focus:border-[#3D8BD0] focus:outline-none focus:ring-1 focus:ring-[#3D8BD0]"
        />
        {search ? (
          <button type="button" onClick={() => onSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#364658]"><X size={16} /></button>
        ) : (
          <Search className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" size={16} />
        )}
      </div>
      {shown.length > 0 && (
        <div className="relative flex-shrink-0">
          <button
            type="button"
            onClick={() => {
              /* Opens on the first filter that has a value, so what is set is what you see. */
              if (!open) setTab((shown.find((g) => sel(g.key).length) ?? shown[0]).key);
              setOpen((v) => !v);
            }}
            title="Filter"
            className={`inline-flex h-8 items-center gap-1.5 rounded border px-3 text-[13px] font-medium transition-colors ${active ? 'border-[#3D8BD0] bg-[#F0F8FF] text-[#3D8BD0]' : 'border-[#DFE5ED] text-[#364658] hover:bg-[#F3F4F6]'}`}
          >
            <Filter size={15} className={active ? 'text-[#3D8BD0]' : 'text-[#7B8FA5]'} />
            <span className="max-w-[160px] truncate">{buttonLabel}</span>
            <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''} ${active ? 'text-[#3D8BD0]' : 'text-[#7B8FA5]'}`} />
          </button>
          {open && current && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
              <div className={`absolute right-0 top-full z-50 mt-1.5 ${shown.length > 1 ? 'w-[340px]' : 'w-[260px]'} rounded-lg border border-[#DFE5ED] bg-white shadow-lg`}>
                {active && (
                  <div className="flex flex-wrap gap-1.5 border-b border-[#F0F2F5] p-2.5">
                    {picked.map(({ g, v }) => (
                      <span key={`${g.key}:${v}`} className="inline-flex items-center gap-1 rounded bg-[#F1F5F9] px-2 py-0.5 text-[12px] text-[#364658]">
                        {labelOf(g, v)}
                        <button type="button" onClick={() => toggle(g.key, v)} className="text-[#7B8FA5] hover:text-[#364658]"><X size={12} /></button>
                      </span>
                    ))}
                  </div>
                )}
                {shown.length > 1 && (
                  <div className="flex border-b border-[#EEF1F4]">
                    {shown.map((g) => (
                      <button
                        key={g.key}
                        type="button"
                        onClick={() => setTab(g.key)}
                        className={`-mb-px flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap border-b-2 px-1 py-2.5 text-[13px] font-medium transition-colors ${current.key === g.key ? 'border-[#3D8BD0] text-[#3D8BD0]' : 'border-transparent text-[#64748B] hover:text-[#364658]'}`}
                      >
                        {g.label}
                        {sel(g.key).length > 0 && <span className="size-1.5 rounded-full bg-[#3D8BD0]" />}
                      </button>
                    ))}
                  </div>
                )}
                <div className="max-h-[340px] overflow-y-auto py-1">
                  <button
                    type="button"
                    onClick={() => onChange({ ...value, [current.key]: [] })}
                    className={`flex w-full items-center justify-between px-3 py-2 text-left text-[13px] transition-colors ${sel(current.key).length === 0 ? 'bg-[#F1F5F9]' : 'hover:bg-[#F9FAFB]'}`}
                  >
                    <span className="text-[#364658]">All</span>
                    {sel(current.key).length === 0 && <Check size={15} className="flex-shrink-0 text-[#3D8BD0]" />}
                  </button>
                  {current.options.map((o) => {
                    const on = sel(current.key).includes(o.value);
                    return (
                      <button
                        key={o.value}
                        type="button"
                        onClick={() => toggle(current.key, o.value)}
                        className={`flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] transition-colors ${on ? 'bg-[#F1F5F9]' : 'hover:bg-[#F9FAFB]'}`}
                      >
                        {o.dot && <span className="size-2 flex-shrink-0 rounded-full" style={{ backgroundColor: o.dot }} />}
                        <span className="min-w-0 flex-1 truncate text-[#364658]" title={o.label ?? o.value}>{o.label ?? o.value}</span>
                        {on && <Check size={15} className="flex-shrink-0 text-[#3D8BD0]" />}
                      </button>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between border-t border-[#F0F2F5] px-3 py-2">
                  <button type="button" onClick={() => onChange({})} className="text-[13px] font-medium text-[#3D8BD0] hover:underline">Clear all</button>
                  <button type="button" onClick={() => setOpen(false)} className="rounded bg-[#3D8BD0] px-3 py-1.5 text-[13px] font-medium text-white hover:bg-[#2d6ca0]">Done</button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/** Distinct values in first-seen order, as filter options. */
export const optionsFrom = (values: (string | null | undefined)[], dot?: (v: string) => string | undefined): FilterOption[] =>
  [...new Set(values.filter((v): v is string => !!v))].sort((a, b) => a.localeCompare(b)).map((v) => ({ value: v, dot: dot?.(v) }));
