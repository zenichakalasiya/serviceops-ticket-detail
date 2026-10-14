/* VENDORED from the upstream prototype (ronak-patel-motadata/ServiceOps-Ticket-Detail-, Oct 2026 sync).
   Used ONLY by the detail pages and listings brought in from upstream — this project's own detail
   pages keep their own version in ../. Do not edit to change our pages; edit ../ instead. */
import { useState, useRef, useEffect } from 'react';
import { X, ChevronDown, ExternalLink, User } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from '../ui/tooltip';
import { IconMyApproval } from '../SidebarIcons';

interface TabKpi { label?: string; value: string; dot?: string; user?: boolean }
interface TabItem {
  id: string; subject?: string; status?: string; priority?: string; technician?: string;
  kpis?: TabKpi[]; noIdPill?: boolean; page?: string;
  /** Unread replies waiting on this open item — drives the pulsing dot on the tab. */
  unread?: number;
  /** Who sent them, and the colour that says which side they came from. */
  unreadFrom?: string;
  unreadColor?: string;
  /** Patch-family records only: nobody has approved or declined this one yet, so it is
      waiting on the reader. Drives the amber dot on the tab. */
  pendingApproval?: boolean;
  /** This tab is the APPROVAL view of a record, not the record itself. The two carry the
      same id by design (the approval is about PBM-625), so without a mark the two tabs
      are indistinguishable. */
  approval?: boolean;
}

/* The listing's unread dot, reused verbatim: ring + halo take the dot's own hue at
   low alpha, and `.unread-dot` (theme.css) pulses them. */
const unreadStyle = (color: string) =>
  ({ backgroundColor: color, ['--dot-ring' as string]: `${color}33`, ['--dot-pulse' as string]: `${color}66` } as React.CSSProperties);

const TAB_W = 170;   // fixed tab width (matches the tab styling below)
const MORE_W = 96;   // approx width reserved for the "More (N)" button

// Colored dots for the tab hover card (matches the relation/impact popups).
const statusDotColor = (st?: string) => {
  const s = (st || '').toLowerCase();
  if (s === 'open' || s === 'pending' || s === 'sent for approval' || s === 'generated') return '#D97706';
  if (s === 'in progress' || s === 'ordered' || s === 'partially received') return '#3D8BD0';
  if (s.includes('resolv') || s.includes('close') || s === 'in use' || s === 'completed' || s === 'operational' || s === 'approved' || s === 'received' || s === 'active') return '#22A06B';
  return '#9CA3AF';
};
const priorityDotColor = (pr?: string) => {
  const p = (pr || '').toLowerCase();
  if (p === 'high' || p === 'p1' || p === 'urgent') return '#DC2626';
  if (p === 'medium' || p === 'p2') return '#D97706';
  if (p === 'low' || p === 'p3' || p === 'p4') return '#22A06B';
  return '#9CA3AF';
};

/**
 * Open-item tab strip for the detail drawers. Measures its own width and shows as
 * many fixed-width tabs as fit; the rest collapse behind a "More (N) ▾" dropdown
 * (floating, absolutely positioned) that sits at the end of the strip. The active
 * item is always kept visible.
 */
export function DrawerTabStrip({
  items,
  activeId,
  onSelect,
  onClose,
}: {
  items: TabItem[];
  activeId?: string | null;
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
  maxVisible?: number;
}) {
  const [showMore, setShowMore] = useState(false);
  const [maxFit, setMaxFit] = useState(items.length);
  // Drag-to-reorder: the tab being dragged + the tab it's hovering over (drop indicator).
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);

  // Drop the dragged tab before the target tab, then broadcast the new full order. The host
  // (DrawerStackProvider) listens for `reorder-drawer-tabs` and reorders the open-item stack, so
  // the order survives drawer swaps without threading a prop through all 14 drawers.
  const handleDrop = (targetId: string) => {
    if (!dragId || dragId === targetId) { setDragId(null); setDragOverId(null); return; }
    const ids = items.map((i) => i.id).filter((id) => id !== dragId);
    const at = ids.indexOf(targetId);
    if (at < 0) { setDragId(null); setDragOverId(null); return; }
    ids.splice(at, 0, dragId);
    window.dispatchEvent(new CustomEvent('reorder-drawer-tabs', { detail: { order: ids } }));
    setDragId(null);
    setDragOverId(null);
  };

  // Measure available width → how many tabs fit before we need a "More" dropdown.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const compute = () => {
      const w = el.clientWidth;
      if (w <= 0) return;
      if (items.length * TAB_W <= w) setMaxFit(items.length);
      else setMaxFit(Math.max(1, Math.floor((w - MORE_W) / TAB_W)));
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    return () => ro.disconnect();
  }, [items.length]);

  // Close the dropdown on outside click.
  useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (moreRef.current && !moreRef.current.contains(e.target as Node)) setShowMore(false); };
    if (showMore) {
      document.addEventListener('mousedown', onDoc);
      return () => document.removeEventListener('mousedown', onDoc);
    }
  }, [showMore]);

  let visible = items.slice(0, maxFit);
  let overflow = items.slice(maxFit);
  // Keep the active item visible: if it's hidden, swap it into the last visible slot.
  if (activeId && overflow.some((i) => i.id === activeId) && visible.length > 0) {
    const act = overflow.find((i) => i.id === activeId)!;
    const bumped = visible[visible.length - 1];
    visible = [...visible.slice(0, -1), act];
    overflow = [bumped, ...overflow.filter((i) => i.id !== activeId)];
  }
  const activeInOverflow = overflow.some((i) => i.id === activeId);

  return (
    <div ref={rootRef} className="flex items-center flex-1 min-w-0">
      {visible.map((t) => {
        const active = t.id === activeId;
        return (
          <Tooltip key={t.id}>
            <TooltipTrigger asChild>
              <div
                draggable
                onDragStart={(e) => { setDragId(t.id); e.dataTransfer.effectAllowed = 'move'; }}
                onDragOver={(e) => { e.preventDefault(); if (dragId && dragId !== t.id) setDragOverId(t.id); }}
                onDragLeave={() => setDragOverId((cur) => (cur === t.id ? null : cur))}
                onDrop={(e) => { e.preventDefault(); handleDrop(t.id); }}
                onDragEnd={() => { setDragId(null); setDragOverId(null); }}
                className={`relative flex items-center gap-2 px-4 py-2 border-r border-[#e5e7eb] cursor-pointer flex-shrink-0 w-[170px] transition-opacity ${active ? 'bg-white border-b-2 border-b-[#3D8BD0]' : 'hover:bg-white/50'} ${dragId === t.id ? 'opacity-40' : ''} ${dragOverId === t.id ? 'before:absolute before:inset-y-1 before:left-0 before:w-0.5 before:bg-[#3D8BD0] before:rounded-full' : ''}`}
                onClick={() => onSelect(t.id)}
              >
                {/* Unread replies, in the listing's language: a pulsing dot leading the
                    id, coloured by WHO replied. No tooltip of its own — the tab already
                    has a hover card, and a nested Radix tip flickers it closed; the card
                    spells the count out instead. */}
                {!!t.unread && (
                  <span className="unread-dot size-[7px] flex-shrink-0 rounded-full" style={unreadStyle(t.unreadColor || '#E67E22')} />
                )}
                {/* Waiting on a decision. A ringed amber dot in the same leading slot as
                    the unread one — a tab is 170px, so there is no room for the words, and
                    the hover card says them. It does NOT pulse: unread is new activity
                    arriving, this is a job sitting still. Only drawn when there is no
                    unread dot, so the two can never crowd the id. */}
                {t.pendingApproval && !t.unread && (
                  <span
                    className="size-[7px] flex-shrink-0 rounded-full bg-[#F59E0B]"
                    style={{ boxShadow: '0 0 0 2px #F59E0B33' }}
                  />
                )}
                {/* The My Approvals nav glyph, so the tab points back at the place it was
                    opened from. An approval and the record it is about share an id, so the
                    icon is the only thing separating "PBM-625" from "PBM-625". It takes
                    the id's own colour rather than a hue of its own — this says WHICH VIEW
                    you are on, not that anything is wrong. */}
                {t.approval && (
                  <span className={`flex flex-shrink-0 items-center ${active ? 'text-[#3D8BD0]' : 'text-[#6b7280]'}`}>
                    <IconMyApproval size={13} />
                  </span>
                )}
                <span className={`text-[12px] font-semibold whitespace-nowrap ${active ? 'text-[#3D8BD0]' : 'text-[#6b7280]'}`}>{t.noIdPill ? '' : t.id}</span>
                <span className={`text-[12px] truncate flex-1 ${t.unread ? 'font-semibold text-[#1E293B]' : 'text-[#364658]'}`}>{t.subject}</span>
                <button onClick={(e) => { e.stopPropagation(); onClose(t.id); }} className="p-0.5 hover:bg-[#e5e7eb] rounded">
                  <X size={14} className="text-[#6b7280]" />
                </button>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" align="start" sideOffset={4} hideArrow className="p-0 bg-white text-[#364658] border border-[#E5E7EB] shadow-lg max-w-[280px]">
              <div className="px-3 py-2">
                <div className="flex items-center gap-2 mb-1.5">
                  {/* Named in full here, because the 13px glyph on the tab can only hint
                      at it: this card is where "which of my two PBM-625 tabs is this?"
                      gets a sentence. */}
                  {t.approval && (
                    <span className="inline-flex flex-shrink-0 items-center gap-1 rounded-sm bg-[#F1F5F9] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#475569]">
                      <IconMyApproval size={11} />
                      Approval
                    </span>
                  )}
                  {!t.noIdPill && <span className="rounded bg-[#e8f4fd] px-1.5 py-0.5 text-[11px] font-semibold text-[#3D8BD0] flex-shrink-0">{t.id}</span>}
                  <span className="text-[12px] font-medium text-[#364658] truncate">{t.subject}</span>
                  {/* Read this record on its own, away from the stack: a real link, so
                      ctrl-click and "open link in new tab" behave natively too. */}
                  {t.page && (
                    <a
                      href={`?page=${t.page}&open=${encodeURIComponent(t.id)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Open in a new browser tab"
                      onClick={(e) => e.stopPropagation()}
                      className="ml-auto flex size-5 flex-shrink-0 items-center justify-center rounded text-[#7B8FA5] transition-colors hover:bg-[#EAF2FB] hover:text-[#3D8BD0]"
                    >
                      <ExternalLink size={12} />
                    </a>
                  )}
                </div>
                {!!t.unread && (
                  <div className="mb-1 flex items-center gap-1.5 text-[11px] font-medium" style={{ color: t.unreadColor || '#E67E22' }}>
                    <span className="size-1.5 flex-shrink-0 rounded-full" style={{ backgroundColor: t.unreadColor || '#E67E22' }} />
                    {t.unread} new message{t.unread === 1 ? '' : 's'}
                    {t.unreadFrom ? ` from ${t.unreadFrom}` : ''}
                  </div>
                )}
                {/* The dot on the tab cannot say what it means in 7px, so the card does. */}
                {t.pendingApproval && (
                  <div className="mb-1 flex items-center gap-1.5 text-[11px] font-medium text-[#B45309]">
                    <span className="size-1.5 flex-shrink-0 rounded-full bg-[#F59E0B]" />
                    Approval pending — not yet approved or declined
                  </div>
                )}
                {t.kpis && t.kpis.length > 0 ? (
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#64748B]">
                    {t.kpis.map((k, i) => (
                      <span key={i} className="inline-flex min-w-0 items-center gap-1">
                        {k.user && <User size={11} className="flex-shrink-0" />}
                        {k.dot && <span className="size-1.5 flex-shrink-0 rounded-full" style={{ backgroundColor: k.dot }} />}
                        {k.label && <span className="flex-shrink-0 text-[#94A3B8]">{k.label}</span>}
                        <span className="truncate font-medium text-[#475569]">{k.value}</span>
                      </span>
                    ))}
                  </div>
                ) : (t.technician || t.status || t.priority) && (
                  <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-[11px] text-[#7B8FA5]">
                    {t.technician && <span className="inline-flex items-center gap-1"><User size={11} />{t.technician}</span>}
                    {t.status && <span className="inline-flex items-center gap-1"><span className="size-1.5 rounded-full" style={{ backgroundColor: statusDotColor(t.status) }} />{t.status}</span>}
                    {t.priority && <span className="inline-flex items-center gap-1"><span className="size-1.5 rounded-full" style={{ backgroundColor: priorityDotColor(t.priority) }} />{t.priority}</span>}
                  </div>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        );
      })}

      {overflow.length > 0 && (
        <div className="relative flex-shrink-0 border-r border-[#e5e7eb]" ref={moreRef}>
          <button
            onClick={() => setShowMore((s) => !s)}
            className={`flex items-center gap-1 px-3 py-2 text-[13px] font-medium whitespace-nowrap transition-colors ${activeInOverflow ? 'text-[#3D8BD0]' : 'text-[#6b7280] hover:text-[#364658]'}`}
          >
            More ({overflow.length})
            <ChevronDown size={14} className={`transition-transform ${showMore ? 'rotate-180' : ''}`} />
          </button>
          {showMore && (
            <div className="app-menu absolute top-full right-0 mt-1 bg-white border border-[#e5e7eb] rounded-lg shadow-lg py-1 min-w-[260px] max-h-[340px] overflow-y-auto z-[9999]">
              {overflow.map((t) => {
                const active = t.id === activeId;
                return (
                  <div
                    key={t.id}
                    onClick={() => { onSelect(t.id); setShowMore(false); }}
                    className={`group/mt flex items-center gap-2 px-3 py-2 cursor-pointer ${active ? 'bg-[#EAF2FB]' : 'hover:bg-[#f9fafb]'}`}
                  >
                    {!!t.unread && (
                      <span className="unread-dot size-[7px] flex-shrink-0 rounded-full" style={unreadStyle(t.unreadColor || '#E67E22')} />
                    )}
                    {/* Same marker in the overflow list — a tab pushed behind "More" must
                        not go silent about a decision still owed. */}
                    {t.pendingApproval && !t.unread && (
                      <span className="size-[7px] flex-shrink-0 rounded-full bg-[#F59E0B]" style={{ boxShadow: '0 0 0 2px #F59E0B33' }} />
                    )}
                    {t.approval && (
                      <span className={`flex flex-shrink-0 items-center ${active ? 'text-[#3D8BD0]' : 'text-[#6b7280]'}`}>
                        <IconMyApproval size={13} />
                      </span>
                    )}
                    <span className={`text-[12px] font-semibold whitespace-nowrap ${active ? 'text-[#3D8BD0]' : 'text-[#6b7280]'}`}>{t.noIdPill ? '' : t.id}</span>
                    <span className={`text-[12px] truncate flex-1 ${t.unread ? 'font-semibold text-[#1E293B]' : 'text-[#364658]'}`}>{t.subject}</span>
                    <button onClick={(e) => { e.stopPropagation(); onClose(t.id); }} className="p-0.5 hover:bg-[#e5e7eb] rounded opacity-0 group-hover/mt:opacity-100 transition-opacity">
                      <X size={13} className="text-[#6b7280]" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
