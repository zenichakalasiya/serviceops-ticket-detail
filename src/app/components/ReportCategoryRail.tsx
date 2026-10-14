/* ── Report category rail ────────────────────────────────────────────────────
   The report catalog is navigated by MODULE — requests, problems, assets, patches —
   so the modules sit where the CMDB puts its CI classes and Knowledge puts its folders:
   left of the grid, in the same chrome. Same title row, same search, same row recipe and
   selected fill, because three navigators that behave alike should look alike.

   Flat with one exception: Asset's four sub-registers are indented under it, as in the
   product. Each row carries its module's OWN sidebar glyph, so a category is recognised
   by the same mark it has everywhere else in the app. */
import { useState } from 'react';
import { PanelLeftClose, PanelLeftOpen, Search, X } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

export interface ReportCategory {
  id: string;
  label: string;
  icon: React.ReactNode;
  /** Indented under the Asset group. */
  child?: boolean;
}

const SHELL = 'group/rc flex items-center gap-1 rounded px-1.5 transition-colors';
const LABEL = 'flex min-w-0 flex-1 items-center gap-2 py-2 text-left text-[13px] transition-colors';

export function ReportCategoryRail({
  categories,
  active,
  onSelect,
  forceCollapsed = false,
  onExpand,
}: {
  categories: ReportCategory[];
  active: string;
  onSelect: (id: string) => void;
  /** The page needs the slot for another panel — show the strip instead. */
  forceCollapsed?: boolean;
  onExpand?: () => void;
}) {
  const [collapsedLocal, setCollapsed] = useState(false);
  const collapsed = collapsedLocal || forceCollapsed;
  const [q, setQ] = useState('');

  const query = q.trim().toLowerCase();
  /* A search keeps a child whose PARENT matches too, so looking for "asset" still shows the
     four registers that live under it. */
  const shown = query
    ? categories.filter((c, i) => {
        if (c.label.toLowerCase().includes(query)) return true;
        if (!c.child) return false;
        for (let j = i - 1; j >= 0; j -= 1) if (!categories[j].child) return categories[j].label.toLowerCase().includes(query);
        return false;
      })
    : categories;

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => { setCollapsed(false); onExpand?.(); }}
            className="group/strip flex w-[48px] flex-shrink-0 flex-col items-center border-r border-[#E5E7EB] bg-white py-3 text-left transition-colors hover:bg-[#F7F9FC]"
          >
            <span className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded border border-[#DFE5ED] bg-white text-[#6b7280] transition-colors group-hover/strip:border-[#3D8BD0] group-hover/strip:bg-[#EBF5FF] group-hover/strip:text-[#3D8BD0]">
              <PanelLeftOpen size={16} />
            </span>
            <span className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-[#7B8FA5] [writing-mode:vertical-rl]">
              {categories.find((c) => c.id === active)?.label ?? 'Categories'}
            </span>
          </button>
        </TooltipTrigger>
        <TooltipContent side="right">Show categories</TooltipContent>
      </Tooltip>
    );
  }

  return (
    /* The same 344px the CMDB and Knowledge rails use — three navigators in the same slot
       should not shift the grid's left edge as you move between modules. */
    <div className="flex w-[344px] flex-shrink-0 flex-col border-r border-[#E5E7EB] bg-white">
      {/* Built to the same recipe as the grid's title row, so the two sit on one line. */}
      <div className="flex items-center gap-2 px-4 py-3">
        <h2 className="min-w-0 flex-1 truncate text-[17px] font-semibold text-[#1E293B]">Reports</h2>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setCollapsed(true)}
              className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded border border-[#DFE5ED] bg-white text-[#6b7280] transition-colors hover:bg-[#F5F7FA] hover:text-[#364658]"
            >
              <PanelLeftClose size={16} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">Hide categories</TooltipContent>
        </Tooltip>
      </div>

      <div className="px-4 pb-2">
        <div className="relative">
          <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search categories"
            className="h-8 w-full rounded border border-[#DFE5ED] bg-white pl-8 pr-7 text-[13px] text-[#364658] outline-none transition-colors placeholder:text-[#9CA3AF] focus:border-[#3D8BD0]"
          />
          {q && (
            <button
              onClick={() => setQ('')}
              className="absolute right-1.5 top-1/2 flex size-5 -translate-y-1/2 items-center justify-center rounded text-[#9CA3AF] transition-colors hover:bg-[#F3F4F6] hover:text-[#364658]"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
        {shown.map((c) => {
          const on = active === c.id;
          return (
            <div key={c.id} className={`${SHELL} ${c.child ? 'ml-5' : ''} ${on ? 'bg-[#EBF5FF]' : 'hover:bg-[#F5F7FA]'}`}>
              <button onClick={() => onSelect(c.id)} className={`${LABEL} ${on ? 'font-medium text-[#3D8BD0]' : 'text-[#364658]'}`}>
                <span className={`flex-shrink-0 ${on ? 'text-[#3D8BD0]' : 'text-[#7B8FA5]'}`}>{c.icon}</span>
                <span className="truncate">{c.label}</span>
              </button>
            </div>
          );
        })}
        {query && !shown.length && (
          <div className="px-3 py-6 text-center text-[12px] text-[#94A3B8]">No category matches “{q}”.</div>
        )}
      </div>
    </div>
  );
}
