import { useState } from 'react';
import { Check, LayoutTemplate, Search, Sparkles, X } from 'lucide-react';
import { TEMPLATE_CATEGORIES, VISIBLE_TEMPLATES } from './supportPortalData';
import type { PortalTemplate, TemplateLayout } from './supportPortalData';

/* "Use Template" — the gallery behind the New page dropdown.
 *
 * A template is a layout decision, so the card shows the layout: each thumbnail is a wireframe of
 * the page it produces, not a stock image. Selecting one fills the rail on the right with exactly
 * what will land on the canvas, so "Use template" is never a leap of faith. */

interface GalleryProps {
  onClose: () => void;
  onUse: (template: PortalTemplate) => void;
  /** The blank-page route, offered from the footer so the gallery is never a dead end. */
  onStartBlank: () => void;
}

/* ── Wireframe thumbnails ────────────────────────────────────────────────── */

const R = ({ x, y, w, h, fill, o = 1, r = 1.5 }: { x: number; y: number; w: number; h: number; fill: string; o?: number; r?: number }) => (
  <rect x={x} y={y} width={w} height={h} rx={r} fill={fill} opacity={o} />
);

export function TemplateArt({ layout, accent }: { layout: TemplateLayout; accent: string }) {
  const g = '#D8DEE7';
  const g2 = '#EAEEF3';
  return (
    <svg viewBox="0 0 160 96" className="block size-full" preserveAspectRatio="none" aria-hidden>
      <R x={0} y={0} w={160} h={96} fill="#F7F9FC" r={0} />
      <R x={0} y={0} w={160} h={7} fill="#FFFFFF" r={0} />
      <R x={0} y={7} w={9} h={89} fill="#FFFFFF" r={0} />
      {/* ── THIS portal, drawn from what it actually renders ──
          Banner + search, four action cards riding up into its lower edge, Favourite Services and
          Most Used Services as two tile rows, then the work cards. Anyone who has seen the page
          recognises it; that is the whole job of this one tile. */}
      {layout === 'portal' && (<>
        <R x={9} y={7} w={151} h={28} fill={accent} r={0} />
        <R x={54} y={12} w={61} h={3} fill="#FFFFFF" o={0.55} />
        <R x={40} y={19} w={89} h={7} fill="#FFFFFF" />
        {/* the four action cards, overlapping the banner exactly as they do on the page */}
        {[0, 1, 2, 3].map((i) => <R key={`q${i}`} x={13 + i * 35} y={30} w={31} h={13} fill="#FFFFFF" />)}
        {[0, 1, 2, 3].map((i) => <R key={`qi${i}`} x={16 + i * 35} y={33} w={6} h={6} fill={g2} r={1.5} />)}
        {[0, 1, 2, 3].map((i) => <R key={`qt${i}`} x={24 + i * 35} y={34} w={16} h={2.5} fill={g} />)}
        {/* Favourite Services */}
        <R x={13} y={48} w={26} h={2.5} fill={g} />
        {[0, 1, 2, 3].map((i) => <R key={`f${i}`} x={13 + i * 35} y={53} w={31} h={14} fill="#FFFFFF" />)}
        {[0, 1, 2, 3].map((i) => <R key={`fi${i}`} x={25 + i * 35} y={56} w={6} h={6} fill={g2} r={1.5} />)}
        {/* the work row */}
        {[0, 1, 2].map((i) => <R key={`w${i}`} x={13 + i * 47} y={72} w={43} h={19} fill="#FFFFFF" />)}
        {[0, 1, 2].map((i) => <R key={`wt${i}`} x={17 + i * 47} y={76} w={20} h={2.5} fill={g} />)}
        {[0, 1, 2].map((i) => <R key={`wr${i}`} x={17 + i * 47} y={82} w={35} h={2} fill={g2} />)}
        {[0, 1, 2].map((i) => <R key={`wr2${i}`} x={17 + i * 47} y={86} w={28} h={2} fill={g2} />)}
      </>)}
      {/* ── Verdant ── the one tile whose banner is PALE, so its bars are dark. Every other layout
          draws white text on `accent`; doing that here would have drawn white on light green and
          shown an empty band, which is the opposite of what the template is recognised by. */}
      {layout === 'verdant' && (<>
        <R x={9} y={7} w={151} h={30} fill="#D5E9DE" r={0} />
        <R x={16} y={12} w={54} h={4} fill="#0F3327" o={0.8} />
        <R x={16} y={19} w={38} h={2.5} fill="#0F3327" o={0.4} />
        <R x={16} y={25} w={52} h={7} fill="#FFFFFF" />
        {/* a hint of the artwork on the right */}
        <R x={104} y={13} w={34} h={20} fill="#FFFFFF" />
        <R x={142} y={11} w={9} h={9} fill="#1B3A2E" r={1} />
        <R x={98} y={26} w={8} h={8} fill="#3D8BD0" r={1} />
        {/* actions in their OWN band — no overlap, which is half the template */}
        {[0, 1, 2, 3].map((i) => <R key={`vq${i}`} x={13 + i * 35} y={41} w={31} h={15} fill="#FFFFFF" />)}
        {[0, 1, 2, 3].map((i) => <R key={`vqi${i}`} x={25 + i * 35} y={44} w={7} h={7} fill="#DFEEE6" r={1.5} />)}
        {[0, 1, 2, 3].map((i) => <R key={`vqt${i}`} x={22 + i * 35} y={53} w={13} h={2} fill={g} />)}
        {/* services panel, with the rail beside it rather than beside the work cards */}
        <R x={13} y={60} w={92} h={31} fill="#EFF4F8" />
        {[0, 1].map((i) => [0, 1].map((j) => <R key={`vs${i}${j}`} x={17 + j * 45} y={64 + i * 14} w={41} h={12} fill="#FFFFFF" />))}
        <R x={109} y={60} w={38} h={14} fill="#FFFFFF" />
        <R x={109} y={77} w={38} h={14} fill="#16233A" />
      </>)}
      {layout === 'classic' && (<>
        <R x={9} y={7} w={151} h={34} fill={accent} r={0} />
        <R x={52} y={16} w={64} h={4} fill="#FFFFFF" o={0.5} />
        <R x={44} y={24} w={80} h={7} fill="#FFFFFF" />
        {[15, 60, 105].map((x) => <R key={x} x={x} y={36} w={40} h={13} fill="#FFFFFF" />)}
        {[15, 60, 105].map((x) => <R key={x} x={x} y={53} w={40} h={36} fill="#FFFFFF" />)}
        {[15, 60, 105].map((x) => <R key={`i${x}`} x={x + 3} y={56} w={20} h={3} fill={g} />)}
      </>)}
      {layout === 'spotlight' && (<>
        <R x={9} y={7} w={151} h={48} fill={accent} r={0} />
        <R x={44} y={20} w={80} h={5} fill="#FFFFFF" o={0.5} />
        <R x={34} y={30} w={100} h={9} fill="#FFFFFF" />
        {[15, 60, 105].map((x) => <R key={x} x={x} y={44} w={40} h={7} fill="#FFFFFF" o={0.85} />)}
        <R x={15} y={60} w={130} h={4} fill={g} />
        {[68, 76, 84].map((y) => <R key={y} x={15} y={y} w={130} h={5} fill="#FFFFFF" />)}
      </>)}
      {layout === 'catalog' && (<>
        <R x={9} y={7} w={151} h={20} fill={accent} r={0} />
        <R x={48} y={13} w={72} h={7} fill="#FFFFFF" />
        {[0, 1, 2, 3].map((i) => <R key={i} x={15 + i * 34} y={32} w={28} h={26} fill="#FFFFFF" />)}
        {[0, 1, 2, 3].map((i) => <R key={`c${i}`} x={22 + i * 34} y={38} w={14} h={8} fill={g2} r={4} />)}
        <R x={15} y={63} w={130} h={26} fill="#FFFFFF" />
        {[68, 76, 83].map((y) => <R key={y} x={19} y={y} w={90} h={3} fill={g} />)}
      </>)}
      {layout === 'knowledge' && (<>
        <R x={9} y={7} w={151} h={26} fill={accent} r={0} />
        <R x={44} y={15} w={80} h={8} fill="#FFFFFF" />
        {[0, 1, 2].map((i) => <R key={i} x={15 + i * 45} y={38} w={38} h={22} fill="#FFFFFF" />)}
        {[0, 1, 2].map((i) => <R key={`k${i}`} x={19 + i * 45} y={42} w={14} h={4} fill={g} />)}
        <R x={15} y={65} w={130} h={24} fill="#FFFFFF" />
        {[70, 77, 84].map((y) => <R key={y} x={19} y={y} w={110} h={3} fill={g} />)}
      </>)}
      {layout === 'minimal' && (<>
        <R x={9} y={7} w={151} h={44} fill="#FFFFFF" r={0} />
        <R x={52} y={18} w={64} h={5} fill={g} />
        <R x={44} y={28} w={80} h={9} fill={accent} o={0.14} />
        {[15, 60, 105].map((x) => <R key={x} x={x} y={56} w={40} h={20} fill="#FFFFFF" />)}
        <R x={15} y={81} w={130} h={8} fill="#FFFFFF" />
      </>)}
      {layout === 'status' && (<>
        <R x={9} y={7} w={151} h={8} fill={accent} o={0.85} r={0} />
        <R x={15} y={19} w={130} h={16} fill="#FFFFFF" />
        {[0, 1, 2, 3].map((i) => <R key={i} x={19 + i * 32} y={23} w={26} h={8} fill={g2} />)}
        <R x={9} y={39} w={151} h={26} fill={accent} r={0} />
        <R x={44} y={48} w={80} h={8} fill="#FFFFFF" />
        <R x={15} y={69} w={130} h={20} fill="#FFFFFF" />
      </>)}
    </svg>
  );
}

/* ── Gallery ─────────────────────────────────────────────────────────────── */

export function SupportPortalTemplateGallery({ onClose, onUse, onStartBlank }: GalleryProps) {
  const [category, setCategory] = useState<string>('All');
  const [query, setQuery] = useState('');
  /* ⚠️ The first VISIBLE template, not the first in the file. `PORTAL_TEMPLATES[0]` is withheld,
     so the gallery opened with a selection nothing on screen was showing — the detail rail
     described a tile that was not there and the confirm button would have used it. */
  const [selectedId, setSelectedId] = useState(VISIBLE_TEMPLATES()[0]?.id ?? '');

  const q = query.trim().toLowerCase();
  const templates = VISIBLE_TEMPLATES().filter((t) =>
    (category === 'All' || t.category === category)
    && (!q || t.name.toLowerCase().includes(q) || t.desc.toLowerCase().includes(q) || t.blocks.some((b) => b.toLowerCase().includes(q))));

  // The rail always describes something real: a filtered-out selection falls back to the first hit.
  const selected = templates.find((t) => t.id === selectedId) ?? templates[0];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-6">
      <div className="flex h-[660px] max-h-full w-[1080px] max-w-full flex-col overflow-hidden rounded-lg bg-white shadow-2xl">
        {/* Head */}
        <div className="flex items-start justify-between gap-4 border-b border-[#e5e7eb] px-5 py-4">
          <div>
            <h2 className="text-[16px] font-semibold text-[#364658]">Choose a template</h2>
            <p className="mt-0.5 text-[13px] text-[#7B8FA5]">Start from a ready-made portal layout. You can change anything after.</p>
          </div>
          <button
            onClick={onClose}
            className="flex size-8 flex-shrink-0 items-center justify-center rounded text-[#64748B] transition-colors hover:bg-[#F3F4F6]"
          ><X size={18} /></button>
        </div>

        <div className="flex min-h-0 flex-1">
          {/* Browse */}
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex flex-wrap items-center gap-2 px-5 py-3">
              <div className="relative w-[240px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" size={15} />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search templates"
                  className="h-8 w-full rounded border border-[#d1d5db] bg-white pl-9 pr-8 text-[13px] text-[#364658] placeholder:text-[#9ca3af] focus:border-[#3D8BD0] focus:outline-none focus:ring-1 focus:ring-[#3D8BD0]"
                />
                {query && (
                  <button onClick={() => setQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#364658]"><X size={14} /></button>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {TEMPLATE_CATEGORIES.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCategory(c)}
                    className={`h-8 rounded px-3 text-[13px] font-medium transition-colors ${
                      category === c ? 'bg-[#3D8BD0] text-white' : 'border border-[#DFE5ED] bg-white text-[#364658] hover:bg-[#F5F7FA]'
                    }`}
                  >{c}</button>
                ))}
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">
              {templates.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <span className="mb-3 flex size-14 items-center justify-center rounded-full bg-[#F5F7FA]"><Search className="size-6 text-[#9CA3AF]" /></span>
                  <p className="text-[14px] font-medium text-[#364658]">No templates found</p>
                  <p className="mt-1 max-w-[320px] text-[13px] text-[#7B8FA5]">Nothing matches this filter. Clear it, or start from a blank page instead.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {templates.map((t) => {
                    const on = selected?.id === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => setSelectedId(t.id)}
                        onDoubleClick={() => onUse(t)}
                        className={`group flex flex-col overflow-hidden rounded-lg border text-left transition-all ${
                          on ? 'border-[#3D8BD0] shadow-[0_0_0_1px_#3D8BD0]' : 'border-[#E5E7EB] hover:border-[#3D8BD0]'
                        }`}
                      >
                        <span className="relative block h-[150px] w-full overflow-hidden border-b border-[#E5E7EB] bg-[#F7F9FC]">
                          <TemplateArt layout={t.layout} accent={t.accent} />
                          {on && (
                            <span className="absolute right-2 top-2 flex size-5 items-center justify-center rounded-full bg-[#3D8BD0] text-white"><Check size={13} /></span>
                          )}
                          {t.badge && (
                            <span className="absolute left-2 top-2 rounded-sm bg-white/95 px-1.5 py-0.5 text-[11px] font-semibold text-[#3D8BD0]">{t.badge}</span>
                          )}
                        </span>
                        <span className="block bg-white px-3.5 py-2.5">
                          <span className="block text-[14px] font-medium text-[#364658]">{t.name}</span>
                          <span className="mt-0.5 block text-[12px] leading-[1.5] text-[#7B8FA5]">{t.category}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Detail rail — what lands on the canvas if this one is used. */}
          {selected && (
            <aside className="flex w-[300px] flex-shrink-0 flex-col border-l border-[#e5e7eb] bg-[#FCFDFE]">
              <div className="min-h-0 flex-1 overflow-y-auto p-5">
                <div className="h-[124px] w-full overflow-hidden rounded border border-[#E5E7EB]">
                  <TemplateArt layout={selected.layout} accent={selected.accent} />
                </div>
                <h3 className="mt-3.5 text-[15px] font-semibold text-[#364658]">{selected.name}</h3>
                <p className="mt-1.5 text-[13px] leading-[1.6] text-[#64748B]">{selected.desc}</p>

                <div className="mt-5 text-[12px] font-semibold uppercase tracking-wider text-[#7B8FA5]">What’s included</div>
                <ul className="mt-2 space-y-1.5">
                  {selected.blocks.map((b) => (
                    <li key={b} className="flex items-start gap-2 text-[13px] text-[#364658]">
                      <Check size={14} className="mt-[3px] flex-shrink-0 text-[#22A06B]" />
                      {b}
                    </li>
                  ))}
                </ul>

                <div className="mt-5 flex items-start gap-2 rounded border border-[#E5E7EB] bg-white px-3 py-2.5">
                  <Sparkles size={14} className="mt-[2px] flex-shrink-0 text-[#7C3AED]" />
                  <p className="text-[12px] leading-[1.55] text-[#64748B]">
                    A template only decides what the page starts with — every block stays editable.
                  </p>
                </div>
              </div>
            </aside>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t border-[#e5e7eb] px-5 py-3">
          <button
            onClick={onStartBlank}
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#3D8BD0] hover:underline"
          ><LayoutTemplate size={14} /> Start from a blank page instead</button>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="inline-flex h-8 items-center rounded border border-[#DFE5ED] bg-white px-3.5 text-[13px] font-medium text-[#364658] transition-colors hover:bg-[#F5F7FA]"
            >Cancel</button>
            <button
              onClick={() => selected && onUse(selected)}
              disabled={!selected}
              className="inline-flex h-8 items-center rounded bg-[#3D8BD0] px-3.5 text-[13px] font-medium text-white transition-colors hover:bg-[#2d6ca0] disabled:cursor-not-allowed disabled:opacity-50"
            >Use template</button>
          </div>
        </div>
      </div>
    </div>
  );
}
