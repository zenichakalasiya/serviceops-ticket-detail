/* VENDORED from the upstream prototype (ronak-patel-motadata/ServiceOps-Ticket-Detail-, Oct 2026 sync).
   Used ONLY by the detail pages and listings brought in from upstream — this project's own detail
   pages keep their own version in ../. Do not edit to change our pages; edit ../ instead. */
import React, { useState, useRef, useLayoutEffect } from 'react';
import { Tooltip, TooltipTrigger, TooltipContent } from '../ui/tooltip';

export interface HeaderKpiItem {
  key: string;
  /** The rendered chip (inline-flex content, WITHOUT a leading separator). */
  node: React.ReactNode;
  /** Plain-text "Label: Value" shown in the overflow "+N" hover popover. */
  tip: string;
  /** Drop the hairline separator before this chip — used to chain alert pills flush together. */
  noSep?: boolean;
}

/**
 * Single-line KPI row for detail-page headers. Measures the available width and
 * shows as many chips as fit; whatever overflows collapses into a compact "+N"
 * pill that reveals the hidden chips on hover — so the header never wraps to a
 * second line in narrow / small-view layouts.
 */
export function HeaderKpiRow({ items }: { items: HeaderKpiItem[] }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const measRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(items.length);

  const depKey = items.map((i) => i.key + i.tip).join('|');
  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    const meas = measRef.current;
    if (!wrap || !meas) return;
    const RESERVE = 48; // room for the separator + "+N" pill when overflowing
    const compute = () => {
      const avail = wrap.clientWidth;
      if (avail <= 0) return;
      const chips = Array.from(meas.querySelectorAll<HTMLElement>('[data-kpi]'));
      if (!chips.length) return;
      const last = chips[chips.length - 1];
      if (last.offsetLeft + last.offsetWidth <= avail) { setVisibleCount(items.length); return; }
      let count = 0;
      for (const c of chips) {
        if (c.offsetLeft + c.offsetWidth <= avail - RESERVE) count++; else break;
      }
      setVisibleCount(Math.max(1, count));
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(wrap);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [depKey]);

  const visible = items.slice(0, visibleCount);
  const overflow = items.slice(visibleCount);
  const sep = <span className="h-3 w-px bg-[#E5E7EB] flex-shrink-0" />;

  return (
    <div ref={wrapRef} className="relative mt-1 w-full overflow-hidden">
      {/* Hidden measurement copy — always the full list, single line. */}
      <div ref={measRef} aria-hidden className="pointer-events-none absolute -top-[9999px] left-0 flex items-center gap-x-2.5 whitespace-nowrap opacity-0">
        {items.map((it, i) => (
          <React.Fragment key={it.key}>
            {i > 0 && !it.noSep && sep}
            <span data-kpi className="inline-flex flex-shrink-0">{it.node}</span>
          </React.Fragment>
        ))}
      </div>

      {/* Visible row */}
      <div className="flex flex-nowrap items-center gap-x-2.5 whitespace-nowrap">
        {visible.map((it, i) => (
          <React.Fragment key={it.key}>
            {i > 0 && !it.noSep && sep}
            <span className="inline-flex min-w-0 flex-shrink-0">{it.node}</span>
          </React.Fragment>
        ))}
        {overflow.length > 0 && (
          <>
            {sep}
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex cursor-default items-center rounded bg-[#3D8BD0]/10 px-1.5 py-0.5 text-[11px] font-semibold text-[#3D8BD0] flex-shrink-0">
                  +{overflow.length}
                </span>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-none">
                <div className="flex flex-col gap-1">
                  {overflow.map((it) => {
                    const idx = it.tip.indexOf(': ');
                    const label = idx >= 0 ? it.tip.slice(0, idx) : it.tip;
                    const value = idx >= 0 ? it.tip.slice(idx + 2) : '';
                    return (
                      <div key={it.key} className="whitespace-nowrap text-[12px]">
                        <span className="text-white/75">{label}:</span>
                        {value && <span className="ml-1.5 font-semibold text-white">{value}</span>}
                      </div>
                    );
                  })}
                </div>
              </TooltipContent>
            </Tooltip>
          </>
        )}
      </div>
    </div>
  );
}
