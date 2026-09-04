/* Support Portal builder — how the six collection widgets DRAW (spec §7.9, §7.15–7.19).
 *
 * Every switch in their drawers lands here. A control that looks right and changes nothing teaches
 * people to distrust the panel (§8.4), so each renderer reads the same config keys the registry
 * declares — nothing is decorative.
 *
 * Items and their sub-elements wrap in <Sel>, which is what makes §4.3 true: you reach a slide's
 * Heading by clicking the heading, not by hunting through a list.
 */

import { useState } from 'react';
import type { ReactNode } from 'react';
import { ChevronDown, ChevronLeft, LayoutList, ChevronRight, ChevronsRight, ImageOff, ShoppingCart, Star } from 'lucide-react';
import { Sel, useCanvas } from './PortalCanvas';
/* The Table is a module of its own — a spreadsheet-grade editor is a different kind of thing from
   the read-only renderers in this file, and it owns its data model, its handles and its menus. */
import { PortalTable } from './PortalTable';
import { hasFixedTitle, itemNodeId, subNodeId } from './portalPageModel';
import type { PortalStyles } from './portalPageModel';
import { chosen, roleStyle } from './portalStyleResolver';
import { IconFrameBox } from './PortalIconFrame';
import type { IconFrame } from './PortalIconFrame';
import type { Cfg } from './portalWidgetSpec';
import { PORTAL_APPROVALS, PORTAL_ARTICLES, PORTAL_OPEN_REQUESTS, recordModule, statusTone } from './supportPortalData';
import { activeTree, matchesTree } from './portalRecordFilters';
import type { RecordFilter } from './portalRecordFilters';

type Item = Cfg & { id: string; hidden?: boolean };

const visible = (items: Item[] | undefined, live: boolean) =>
  (items ?? []).filter((i) => live || !i.hidden);

/** A widget's own heading, when it has one. Hidden when blank — a title bar with nothing in it is
 *  worse than no title bar. */
/* ⚠️ Wrapped in Sel, so the heading is a NODE. It was a plain <h3>, which meant the words at the top
   of Contact, Announcements, FAQ, Table, Slider and Gallery could be read on the canvas and changed
   only from the panel — the exact knowledge a canvas exists to make unnecessary, and the reason the
   live-data cards felt editable while every other widget did not.
   ⚠️ Nothing else was needed: nodeById already describes any `<id>-title` as a text node and
   ownerOf already strips the suffix so the value reads and writes on the WIDGET's config. One
   wrapper turns that latent machinery on for every widget that has a heading. */
function WidgetTitle({ nodeId, text, icon }: {
  nodeId: string; text?: unknown;
  /* ⚠️ The SAME tinted badge `CardShell` draws, because a page turns these on for every card at
     once or for none — and a widget that paints its own heading instead of going through the
     shell must not become the one card on the row without one. Absent unless a caller passes it,
     so no existing page moves. */
  icon?: ReactNode;
}) {
  const { styles } = useCanvas();
  if (!text) return null;
  const head = (
    <div className="mb-3 flex items-center gap-2">
      {icon && (
        <span className="flex size-7 flex-shrink-0 items-center justify-center rounded-md bg-[#EAF3FB] text-[#2F6FB5]">{icon}</span>
      )}
      <h3 style={roleStyle(styles, nodeId, 'title')} className="text-[16px] font-semibold text-[#364658]">
        {String(text)}
      </h3>
    </div>
  );
  /* ⚠️ A product-owned heading renders BARE — no Sel, so it is not selectable and not typeable.
     Every widget that draws its heading through here inherits the rule at once; the two that draw
     their own are handled at their own call sites below. */
  if (hasFixedTitle(nodeId)) return head;
  return <Sel id={`${nodeId}-title`}>{head}</Sel>;
}

/* ── §7.16 FAQ ───────────────────────────────────────────────────────────── */

export function FaqRender({ nodeId, cfg }: { nodeId: string; cfg: Cfg }) {
  const { styles, enabled } = useCanvas();
  const items = visible(cfg.items as Item[], enabled);
  const rightChevron = cfg.chevron !== 'left';
  const container = String(cfg.itemContainer ?? 'flat');
  const qPad = Number(cfg.qPad ?? 12);
  const aIndent = Number(cfg.aIndent ?? 0);
  const anim = String(cfg.animation ?? 'normal');

  /* ⚠️ Which answers are open, the ACCORDION's way — one at a time, nothing open to begin with.
     This used to be two panel toggles (`openFirst`, `allowMultiOpen`) plus a per-item override; all
     three are gone, so the FAQ behaves the same as the Accordion beside it in the palette rather
     than differently for reasons only its old panel could explain.
     `openByDefault` is still honoured on an item that already carries it — a question somebody
     deliberately opened on an existing page should not close itself because the control moved. */
  const seed = items.filter((it) => it.openByDefault === true).map((it) => it.id);
  const [open, setOpen] = useState<string[]>(seed);
  const toggle = (id: string) => setOpen((o) => (o.includes(id) ? o.filter((x) => x !== id) : [id]));

  if (!items.length) {
    return <p className="py-6 text-center text-[13px] text-[#9CA3AF]">No questions yet — add one in the panel.</p>;
  }

  return (
    <div>
      <WidgetTitle nodeId={nodeId} text={cfg.title} />
      <div className={container === 'card' ? 'space-y-2' : ''}>
        {items.map((it, i) => {
          const inode = itemNodeId(nodeId, it.id);
          const isOpen = open.includes(it.id);
          const shell = container === 'card'
            ? 'rounded-lg border border-[#E5E7EB] bg-white px-3'
            : container === 'bordered'
              ? 'border border-[#E5E7EB] px-3 -mt-px'
              : cfg.itemDivider !== false && i > 0 ? 'border-t border-[#F0F2F5]' : '';
          return (
            <Sel key={it.id} id={inode} className={shell}>
              <div style={isOpen && cfg.openBg ? { background: String(cfg.openBg) } : undefined}>
                <button
                  onClick={(e) => { e.stopPropagation(); toggle(it.id); }}
                  style={{ paddingTop: qPad, paddingBottom: qPad }}
                  className={`flex w-full items-center gap-2 text-left ${rightChevron ? '' : 'flex-row-reverse justify-end'}`}
                >
                  <Sel id={subNodeId(inode, 'q')} className="min-w-0 flex-1">
                    <span style={roleStyle(styles, subNodeId(inode, 'q'), 'subtitle')} className="block text-[14px] font-medium text-[#364658]">
                      {String(it.q ?? '')}
                    </span>
                  </Sel>
                  <ChevronDown
                    size={16}
                    className={`flex-shrink-0 text-[#7B8FA5] ${cfg.chevronRotates !== false && isOpen ? 'rotate-180' : ''} ${
                      anim === 'none' ? '' : anim === 'fast' ? 'transition-transform duration-100' : 'transition-transform duration-300'
                    }`}
                  />
                </button>
                {isOpen && (
                  <Sel id={subNodeId(inode, 'a')} className="pb-3" style={{ paddingLeft: aIndent }}>
                    <div
                      style={roleStyle(styles, subNodeId(inode, 'a'), 'body')}
                      className="text-[13px] leading-[1.65] text-[#5B7A99]"
                      dangerouslySetInnerHTML={{ __html: String(it.a ?? '') }}
                    />
                  </Sel>
                )}
              </div>
            </Sel>
          );
        })}
      </div>
    </div>
  );
}

/* ── §7.15 Card ──────────────────────────────────────────────────────────── */

export function CardRender({ nodeId, cfg }: { nodeId: string; cfg: Cfg }) {
  const { styles, enabled } = useCanvas();
  const template = String(cfg.template ?? 'left');
  const shape = String(cfg.imageShape ?? 'circle');
  /* ⚠️ Padding and border come from the shared Style pack now, not from card-only keys. The `pad`
     slider and the Line/Shadow/None preset were removed from the panel, so reading them here left
     the card hardcoded at 16px with a line border however the Style section was set. */
  const pad = Number(chosen(styles, nodeId, 'padding') ?? 16);
  const bw = Number(chosen(styles, nodeId, 'borderWidth') ?? 1);
  const bc = String(chosen(styles, nodeId, 'borderColor') ?? '#E5E7EB');
  const centre = cfg.contentAlign === 'center';
  const children = visible(cfg.children as Item[], enabled);
  const gap = chosen(styles, nodeId, 'gap') ?? 12;

  const media = template === 'none' ? null : (
    <span
      className={`flex flex-shrink-0 items-center justify-center overflow-hidden bg-[#F1F5F9] text-[#9CA3AF] ${
        shape === 'circle' ? 'size-12 rounded-full' : shape === 'wide' ? 'h-24 w-full rounded' : 'size-12 rounded'
      }`}
    >
      {cfg.image ? <img src={String(cfg.image)} alt="" className="size-full object-cover" /> : <ImageOff size={18} />}
    </span>
  );

  const row = template === 'top' ? 'flex-col' : template === 'right' ? 'flex-row-reverse' : 'flex-row';

  return (
    <div
      style={{
        padding: pad,
        ...(bw > 0 ? { border: `${bw}px solid ${bc}` } : {}),
        borderRadius: Number(chosen(styles, nodeId, 'radius') ?? 8),
      }}
      className={`bg-white ${centre ? "text-center" : ""}`}
    >
      <div className={`flex gap-3 ${row} ${centre && template === 'top' ? 'items-center' : template === 'top' ? '' : 'items-start'}`}>
        {media}
        <div className="min-w-0 flex-1">
          <div style={roleStyle(styles, nodeId, 'title')} className="text-[15px] font-semibold text-[#364658]">{String(cfg.title ?? '')}</div>
          <div style={roleStyle(styles, nodeId, 'body')} className="mt-1 text-[13px] leading-[1.6] text-[#7B8FA5]">{String(cfg.body ?? '')}</div>
        </div>
      </div>
      {children.length > 0 && (
        <div className="flex flex-col" style={{ gap: Number(gap), marginTop: Number(gap) }}>
          {children.map((ch) => (
            <Sel key={ch.id} id={itemNodeId(nodeId, ch.id)}>
              <ChildBlock item={ch} />
            </Sel>
          ))}
        </div>
      )}
    </div>
  );
}

/** A card child is an ordinary widget, drawn the way it draws on the page. */
function ChildBlock({ item }: { item: Item }) {
  if (item.type === 'button') {
    return (
      <span className="inline-flex h-9 items-center justify-center rounded bg-[#3D8BD0] px-4 text-[13px] font-medium text-white">
        {String(item.label ?? 'Button')}
      </span>
    );
  }
  if (item.type === 'image') {
    return item.src
      ? <img src={String(item.src)} alt={String(item.alt ?? '')} className="w-full rounded object-cover" />
      : <span className="flex h-20 items-center justify-center rounded bg-[#F1F5F9] text-[#9CA3AF]"><ImageOff size={18} /></span>;
  }
  return (
    <div
      className="text-[13px] leading-[1.6] text-[#5B7A99]"
      dangerouslySetInnerHTML={{ __html: String(item.html ?? 'A line of supporting copy.') }}
    />
  );
}

/* ── §7.17 Table ─────────────────────────────────────────────────────────── */

/* The Table's WIDGET wrapper. The heading is a child text node like every other widget's; the grid
 * below it is its own module — see PortalTable.tsx — because a spreadsheet-grade editor is a
 * different kind of thing from the read-only renderers around it. */
export function TableRender({ nodeId, cfg }: { nodeId: string; cfg: Cfg }) {
  return (
    <div>
      <WidgetTitle nodeId={nodeId} text={cfg.title} />
      <PortalTable nodeId={nodeId} cfg={cfg} />
    </div>
  );
}

/* ── §7.18 Media Slider ──────────────────────────────────────────────────── */

export function SliderRender({ nodeId, cfg }: { nodeId: string; cfg: Cfg }) {
  const { styles, enabled } = useCanvas();
  const slides = visible(cfg.slides as Item[], enabled);
  const [at, setAt] = useState(0);
  const i = Math.min(at, Math.max(0, slides.length - 1));
  const s = slides[i];
  const overlay = Number(cfg.slideOverlay ?? 30) / 100;

  if (!slides.length) {
    return <p className="py-10 text-center text-[13px] text-[#9CA3AF]">No slides yet — add one in the panel.</p>;
  }

  const inode = itemNodeId(nodeId, s.id);
  const step = (d: number) => setAt((n) => {
    const next = n + d;
    if (cfg.loop === false) return Math.max(0, Math.min(slides.length - 1, next));
    return (next + slides.length) % slides.length;
  });

  return (
    <div>
      <WidgetTitle nodeId={nodeId} text={cfg.title} />
      <Sel id={inode}>
        <div className="relative overflow-hidden rounded-lg bg-[#1E293B]" style={{ aspectRatio: '16 / 9' }}>
          {s.src
            ? <img src={String(s.src)} alt={String(s.alt ?? '')} className="size-full object-cover" />
            : <span className="flex size-full items-center justify-center text-[#64748B]"><ImageOff size={26} /></span>}
          <span className="absolute inset-0" style={{ background: `rgba(0,0,0,${overlay})` }} />

          <div
            className="absolute inset-x-0 bottom-0 p-5"
            style={{ maxWidth: `${Number(cfg.slideMaxWidth ?? 60)}%` }}
          >
            <Sel id={subNodeId(inode, 'heading')}>
              <div style={roleStyle(styles, subNodeId(inode, 'heading'), 'title')} className="text-[20px] font-semibold text-white">
                {String(s.heading ?? '')}
              </div>
            </Sel>
            <Sel id={subNodeId(inode, 'caption')}>
              <div style={roleStyle(styles, subNodeId(inode, 'caption'), 'body')} className="mt-1 text-[13px] leading-[1.55] text-white/80">
                {String(s.caption ?? '')}
              </div>
            </Sel>
            {s.ctaEnabled === true && (
              <span className="mt-3 inline-flex h-8 items-center rounded bg-white px-3.5 text-[13px] font-medium text-[#364658]">
                {String(s.ctaLabel ?? 'Learn more')}
              </span>
            )}
          </div>

          {cfg.arrows !== false && (
            <>
              <button onClick={(e) => { e.stopPropagation(); step(-1); }} className="absolute left-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white"><ChevronLeft size={16} /></button>
              <button onClick={(e) => { e.stopPropagation(); step(1); }} className="absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white"><ChevronRight size={16} /></button>
            </>
          )}

          {cfg.dots !== false && cfg.dotPlacement !== 'below' && (
            <Dots count={slides.length} at={i} style={String(cfg.dotStyle ?? 'dots')} onPick={setAt} over />
          )}
        </div>
      </Sel>
      {cfg.dots !== false && cfg.dotPlacement === 'below' && (
        <Dots count={slides.length} at={i} style={String(cfg.dotStyle ?? 'dots')} onPick={setAt} />
      )}
    </div>
  );
}

function Dots({ count, at, style, onPick, over }: {
  count: number; at: number; style: string; onPick: (i: number) => void; over?: boolean;
}) {
  return (
    <div className={`flex items-center justify-center gap-1.5 ${over ? 'absolute inset-x-0 bottom-2' : 'mt-2'}`}>
      {Array.from({ length: count }).map((_, i) => (
        <button
          key={i}
          onClick={(e) => { e.stopPropagation(); onPick(i); }}
          className={
            style === 'numbers'
              ? `flex size-5 items-center justify-center rounded-full text-[10px] font-semibold ${i === at ? 'bg-white text-[#364658]' : over ? 'bg-black/40 text-white' : 'bg-[#F1F5F9] text-[#64748B]'}`
              : style === 'bars'
                ? `h-1 w-5 rounded-full ${i === at ? 'bg-white' : over ? 'bg-white/40' : 'bg-[#CBD5E1]'}`
                : `size-2 rounded-full ${i === at ? 'bg-white' : over ? 'bg-white/40' : 'bg-[#CBD5E1]'}`
          }
        >{style === 'numbers' ? i + 1 : null}</button>
      ))}
    </div>
  );
}

/* ── §7.19 Photo Gallery ─────────────────────────────────────────────────── */

export function GalleryRender({ nodeId, cfg }: { nodeId: string; cfg: Cfg }) {
  const { styles, enabled } = useCanvas();
  const all = visible(cfg.photos as Item[], enabled);
  const cap = Number(cfg.showMoreAfter ?? 0);
  const photos = cap > 0 ? all.slice(0, cap) : all;
  const cols = Number(cfg.gridColumns ?? 3);
  const gap = Number(cfg.gridGap ?? 8);
  const layout = String(cfg.gridLayout ?? 'grid');
  const captionPos = chosen(styles, nodeId, 'captionPos') ?? 'below';
  const hover = String(cfg.hoverEffect ?? 'zoom');

  if (!photos.length) {
    return <p className="py-10 text-center text-[13px] text-[#9CA3AF]">No photos yet — add one, or drop several at a time.</p>;
  }

  return (
    <div>
      <WidgetTitle nodeId={nodeId} text={cfg.title} />
      <div
        style={layout === 'masonry'
          ? { columnCount: cols, columnGap: gap }
          : { display: 'grid', gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))`, gap }}
      >
        {photos.map((p) => {
          const inode = itemNodeId(nodeId, p.id);
          return (
            <Sel key={p.id} id={inode} style={layout === 'masonry' ? { breakInside: 'avoid', marginBottom: gap } : { gridColumn: `span ${Math.min(Number(p.span ?? 1), cols)}` }}>
              <div className="group/ph relative overflow-hidden rounded">
                {p.src
                  ? <img src={String(p.src)} alt={String(p.alt ?? '')} className={`w-full object-cover ${layout === 'grid' ? 'aspect-square' : ''} ${hover === 'zoom' ? 'transition-transform duration-300 group-hover/ph:scale-105' : ''} ${hover === 'dim' ? 'transition-opacity group-hover/ph:opacity-75' : ''}`} />
                  : <span className={`flex items-center justify-center bg-[#F1F5F9] text-[#9CA3AF] ${layout === 'grid' ? 'aspect-square' : 'h-28'}`}><ImageOff size={18} /></span>}
                {captionPos === 'overlay' && p.caption ? (
                  <Sel id={subNodeId(inode, 'caption')} className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                    <span style={roleStyle(styles, subNodeId(inode, 'caption'), 'meta')} className="text-[12px] text-white">{String(p.caption)}</span>
                  </Sel>
                ) : null}
              </div>
              {captionPos === 'below' && p.caption ? (
                <Sel id={subNodeId(inode, 'caption')}>
                  <span style={roleStyle(styles, subNodeId(inode, 'caption'), 'meta')} className="mt-1 block text-[12px] text-[#7B8FA5]">{String(p.caption)}</span>
                </Sel>
              ) : null}
            </Sel>
          );
        })}
      </div>
      {cap > 0 && all.length > cap && (
        <button className="mt-3 w-full rounded border border-[#DFE5ED] py-2 text-[13px] font-medium text-[#3D8BD0]">
          Show {all.length - cap} more
        </button>
      )}
    </div>
  );
}

/* ── §7.9 Feedback ───────────────────────────────────────────────────────── */

export function FeedbackRender({ nodeId, cfg }: { nodeId: string; cfg: Cfg }) {
  const { styles, enabled } = useCanvas();
  const size = Number(cfg.markSize ?? 20);
  const centre = cfg.ratingAlign === 'center';
  const questions = visible(cfg.questions as Item[], enabled);
  /* 12px keeps the `space-y-3` rhythm this stack shipped with when nobody has moved the slider. */
  const { gap: qGap, dividers: qRules } = arrange(styles, nodeId, 12);

  const marks = Array.from({ length: 5 }).map((_, i) => (
    cfg.scale === 'number'
      ? (
        <span
          key={i}
          style={{ width: size + 10, height: size + 10, borderColor: String(cfg.markEmpty ?? '#E5E7EB') }}
          className="flex items-center justify-center rounded border text-[13px] font-medium text-[#64748B]"
        >{i + 1}</span>
      )
      : <Star key={i} size={size} style={{ color: String(cfg.markEmpty ?? '#E5E7EB') }} fill="currentColor" />
  ));

  return (
    <div>
      {/* ⚠️ Both are NODES. They were the only authored words on this widget you could read on the
          canvas and change only from the panel — `prompt` takes the `-sub` suffix because that is
          what nodeById already calls a widget's second line, so no new machinery is needed. */}
      <Sel id={`${nodeId}-title`}>
        <div style={roleStyle(styles, nodeId, 'title')} className="text-[15px] font-semibold text-[#364658]">{String(cfg.title ?? '')}</div>
      </Sel>
      <Sel id={`${nodeId}-sub`}>
        <div style={roleStyle(styles, nodeId, 'subtitle')} className="mt-0.5 text-[13px] text-[#7B8FA5]">{String(cfg.sub ?? cfg.prompt ?? '')}</div>
      </Sel>
      <div className={`mt-3 flex items-center gap-1.5 ${centre ? 'justify-center' : ''}`}>{marks}</div>

      {/* Follow-ups are asked AFTER the rating, never instead of it — so the canvas shows them as
          what comes next rather than as part of the same step. */}
      {cfg.askFollowUp === true && questions.length > 0 && (
        <div className="mt-4 border-t border-[#F0F2F5] pt-3">
          <p className="mb-2 text-[11px] uppercase tracking-wider text-[#9CA3AF]">
            {cfg.askWhen === 'low' ? 'Asked when the rating is 3 or below' : 'Asked after every rating'}
          </p>
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: qGap }}
            className={qRules ? '[&>*+*]:border-t [&>*+*]:border-t-[#F0F2F5]' : ''}
          >
            {questions.map((q) => (
              <Sel key={q.id} id={itemNodeId(nodeId, q.id)}>
                <div>
                  <div style={roleStyle(styles, nodeId, 'body')} className="text-[13px] text-[#364658]">
                    {String(q.q ?? '')}{q.required === true && <span className="ml-1 text-[#EF4444]">*</span>}
                  </div>
                  {q.type === 'choice' ? (
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {((q.options as string[]) ?? []).map((o) => (
                        <span key={o} className="rounded-full border border-[#DFE5ED] px-2.5 py-1 text-[12px] text-[#64748B]">{o}</span>
                      ))}
                    </div>
                  ) : q.type === 'yesno' ? (
                    <div className="mt-1.5 flex gap-1.5">
                      {['Yes', 'No'].map((o) => (
                        <span key={o} className="rounded-full border border-[#DFE5ED] px-3 py-1 text-[12px] text-[#64748B]">{o}</span>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-1.5 h-8 rounded border border-[#DFE5ED] bg-[#FAFBFC]" />
                  )}
                </div>
              </Sel>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── §7.7 Contact Us ─────────────────────────────────────────────────────── */

/* ⚠️ These values are NOT editable here and are not stored on the widget. They come from the
   portal's own settings so every portal says the same thing — the drawer says so and links there.
   The three toggles only decide whether each line appears. */
/* ⚠️ TWO lines. Hours is gone — not hidden behind a switch, removed. Its toggle went when the panel
   was trimmed, which left a line you could neither edit nor hide: the worst of the three states.
   ⚠️ No `key` any more either. The three `show*` flags were only ever read by a filter that existed
   to serve toggles that no longer exist — dead config feeding a dead filter. */
const CONTACT_LINES = [
  { label: 'Email', value: 'servicedesk@acme.com' },
  { label: 'Phone', value: '+91 79 4040 0000' },
];

/* The P4 Arrangement pack, read back.
 *
 * ⚠️ Every one of these widgets DECLARES P4 in its packs, so the panel drew a "Gap between items"
 * slider and a "Divider between items" switch — and then three renderers out of a dozen actually
 * read the keys. The rest hard-coded their own stack, so both controls moved and nothing happened.
 * A pack in the spec is a promise the renderer has to keep, and one shared reader is what stops the
 * next widget quietly breaking it again.
 *
 * ⚠️ The gap DEFAULTS TO ZERO. These stacks already space their rows with their own padding, so a
 * non-zero default would have re-spaced every existing widget the moment the control started
 * working — the slider adds room on top of the resting rhythm rather than replacing it. */
function arrange(styles: PortalStyles, nodeId: string, fallbackGap = 0) {
  return {
    gap: Number(chosen(styles, nodeId, 'gap') ?? fallbackGap),
    dividers: chosen(styles, nodeId, 'dividers') !== false,
  };
}

/** The stack a list of rows sits in — gap between them, rule between them, both optional. */
const stackProps = (gap: number, dividers: boolean) => ({
  style: { display: 'flex', flexDirection: 'column' as const, gap },
  /* ⚠️ An explicit child rule, not `divide-y`. Tailwind's divide utilities compute their width
     through a reverse variable that resolves to 0 in this stack, so the class was present on the
     element and the border measured 0px — present-but-inert, which reads exactly like a broken
     toggle. The arbitrary variant states the rule outright and is a literal string, so it survives
     class scanning. */
  className: dividers ? '[&>*+*]:border-t [&>*+*]:border-t-[#F0F2F5] border-t border-[#F0F2F5]' : '',
});

export function ContactRender({ nodeId, cfg }: { nodeId: string; cfg: Cfg }) {
  const { styles } = useCanvas();
  const { gap, dividers } = arrange(styles, nodeId);
  return (
    <div className="@container min-w-0">
      <WidgetTitle nodeId={nodeId} text={cfg.title} />
      <div {...stackProps(gap, dividers)}>
        {CONTACT_LINES.map((l, i) => (
          <div key={l.label} className="py-2.5">
            {/* ⚠️ NOTHING here is wrapped in <Sel>, and that is the point of this pass. Both halves
                of a line used to be their own selectable text node, so clicking the word "Email" put
                you in an inline editor for a label that is the PRODUCT's word — every portal calls
                that line Email, and letting one page rename it is how two portals stop describing
                the same thing the same way. The two VALUES are still editable, in the panel, where a
                portal publishing its own address belongs.
                ⚠️ There is no empty state below either: two fixed lines cannot all be switched off,
                so the "every line is switched off" branch was describing a state the card can no
                longer reach. */}
            <div style={roleStyle(styles, nodeId, 'meta')} className="text-[12px] text-[#7B8FA5]">{l.label}</div>
            <div style={roleStyle(styles, nodeId, 'body')} className="mt-0.5 truncate text-[13px] text-[#364658]">
              {String(cfg[`cv${i}`] ?? l.value)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── §7.5 Announcements ──────────────────────────────────────────────────── */

const ANNOUNCEMENTS = [
  { id: 'a1', title: 'Planned network maintenance — Sat 16 Aug, 02:00–05:00', at: '11 Aug 2026' },
  { id: 'a2', title: 'New VPN client rollout begins next week', at: '08 Aug 2026' },
  { id: 'a3', title: 'Service desk hours extended to 20:00 IST', at: '04 Aug 2026' },
  { id: 'a4', title: 'Office 365 licence renewal — action needed by 30 Aug', at: '01 Aug 2026' },
  { id: 'a5', title: 'Phishing awareness training is now mandatory', at: '28 Jul 2026' },
];

export function AnnouncementsRender({ nodeId, cfg, headIcon }: { nodeId: string; cfg: Cfg; headIcon?: ReactNode }) {
  const { styles } = useCanvas();
  const rows = ANNOUNCEMENTS.slice(0, Number(cfg.show ?? 3));
  const { gap, dividers } = arrange(styles, nodeId);
  return (
    <div className="@container min-w-0">
      <WidgetTitle nodeId={nodeId} text={cfg.title} icon={headIcon} />
      <div {...stackProps(gap, dividers)}>
        {rows.map((a) => (
          <div key={a.id} className={cfg.bullets === true ? 'flex gap-2.5 py-2.5' : 'py-2.5'}>
            {/* ⚠️ A BULLET, and it is the leading token this card was missing — every other card on
                the page opens its rows with one (an id pill, an avatar, an icon), so without it
                Announcements was the only list whose rows started at the card's edge. */}
            {cfg.bullets === true && <span className="mt-[7px] size-1.5 flex-shrink-0 rounded-full bg-[#2F6FB5]" />}
            <div className="min-w-0 flex-1">
              {/* Stacked by default (§7.5): an announcement's headline is the thing, the date is a
                  footnote — putting them on one line would truncate the headline to fit the date. */}
              <div style={roleStyle(styles, nodeId, 'body')} className="text-[13px] leading-[1.5] text-[#364658]">{a.title}</div>
              {cfg.showDate !== false && (
                <div style={roleStyle(styles, nodeId, 'meta')} className="mt-1 text-[12px] text-[#98A6B6]">
                  {/* "Posted" turns a bare date into a fact about the announcement. Opt-in, because
                      on a card that is already headed Announcements it can also read as noise. */}
                  {cfg.datePrefix ? `${String(cfg.datePrefix)} ${a.at}` : a.at}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── §7.8 Featured Services ──────────────────────────────────────────────── */

/* ⚠️ The second line is a CATEGORY, not a sentence. The reference shows "HR", "Software",
   "Finance", "Travel" — a service's department, which is what a requester scans a favourites grid
   by. The old descriptions were half-sentences that made every tile a different height and gave the
   grid nothing to align on. */
const FAVOURITE_SERVICES = [
  { id: 'f1', name: 'Employee Off-boarding', desc: 'HR' },
  { id: 'f2', name: 'Microsoft Office 2019', desc: 'Software' },
  { id: 'f3', name: 'Payroll Setup', desc: 'Finance' },
  { id: 'f4', name: 'Flight Booking', desc: 'Travel' },
];

/* ⚠️ DIFFERENT services from the favourites above. Both grids take their shape from the same
   reference, but filling two adjacent sections with the same four rows reads as a rendering bug
   rather than as two lists that happen to look alike. */
const FEATURED_SERVICES = [
  { id: 's1', name: 'New Laptop Request', desc: 'Hardware' },
  { id: 's2', name: 'Software Installation', desc: 'Software' },
  { id: 's3', name: 'VPN Access', desc: 'Network' },
  { id: 's4', name: 'New Employee Onboarding', desc: 'HR' },
];

/* One tile, both sections.
 *
 * ⚠️ Built from the ACTION CARD's chrome — white surface, hairline border, tinted icon badge, name,
 * muted second line — because these sit on the same page as those four and a second card language
 * would make the page look like two products. The ARRANGEMENT is the reference's: icon on top,
 * everything centred, which is what lets four tiles hold a row without the names wrapping.
 * ⚠️ Fixed at FOUR. A favourites grid is a shortcut, and a shortcut that runs to eight is a
 * catalogue — at which point the requester is better served by the catalogue page itself. */
const MAX_SERVICE_TILES = 4;

function ServiceTiles({ nodeId, items, showDesc, tpl = 'top', cols, chips }: {
  nodeId: string; items: { id: string; name: string; desc: string }[]; showDesc: boolean;
  /* The resolved column count. Undefined means "one per service", which is what this grid always
     did and stays the right default — four services in four columns is the reference row. */
  cols?: number;
  /* ⚠️ PILLS instead of a grid of cards. A service is a link, and a row of links does not need
     four boxes to say so. Pills also wrap on their own, so this is the one arrangement that never
     leaves a hole at 1, 2 or 7 items — the count problem every grid variant of this has. */
  chips?: boolean;
  /* The shared card template. ⚠️ Defaults to 'top' — the reference arrangement — rather than to the
     'left' every other card family starts from, because a four-across grid of icon-left tiles puts
     the icon and the words in a 36px-wide column each and the names wrap on every one. */
  tpl?: string;
}) {
  const { styles } = useCanvas();
  const top = tpl === 'top';
  const noIcon = tpl === 'none';
  if (chips) {
    return (
      <div className="flex min-w-0 flex-wrap gap-2.5">
        {items.slice(0, MAX_SERVICE_TILES).map((s) => (
          <span
            key={s.id}
            className="inline-flex min-w-0 max-w-full items-center gap-2.5 rounded-full border border-[#E5E7EB] bg-white py-1.5 pl-1.5 pr-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)]"
          >
            {!noIcon && (
              <span className="flex size-7 flex-shrink-0 items-center justify-center rounded-full bg-[#F1F5F9] text-[#475467]">
                <ShoppingCart size={15} strokeWidth={1.7} />
              </span>
            )}
            <span style={roleStyle(styles, nodeId, 'body')} className="truncate text-[13px] font-medium text-[#364658]">{s.name}</span>
          </span>
        ))}
      </div>
    );
  }
  return (
    <div
      className="grid min-w-0 gap-3"
      style={{ gridTemplateColumns: `repeat(${Math.max(1, cols ?? Math.min(items.length, MAX_SERVICE_TILES))}, minmax(0,1fr))` }}
    >
      {items.slice(0, MAX_SERVICE_TILES).map((s) => (
        <div
          key={s.id}
          className={`flex min-w-0 gap-2 rounded-lg border border-[#E5E7EB] bg-white px-3 py-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)] ${
            top ? 'flex-col items-center text-center' : tpl === 'right' ? 'flex-row-reverse items-center' : 'items-center'
          }`}
        >
          {/* ⚠️ 'Text only' hides the badge, exactly as it does on an action card — where the icon
              sits and whether there IS one are one question with four answers, which is why they
              share a control rather than needing a separate switch. */}
          {!noIcon && (
            <span className="flex size-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#F1F5F9] text-[#475467]">
              <ShoppingCart size={18} strokeWidth={1.7} />
            </span>
          )}
          <span className={`min-w-0 ${top ? '' : 'flex-1'}`}>
            <span style={roleStyle(styles, nodeId, 'body')} className="block truncate text-[13px] font-medium text-[#364658]">{s.name}</span>
            {showDesc && (
              <span style={roleStyle(styles, nodeId, 'meta')} className="mt-0.5 block truncate text-[12px] text-[#7B8FA5]">{s.desc}</span>
            )}
          </span>
        </div>
      ))}
    </div>
  );
}

/** §7.8's sibling — the requester's own pinned services. Same tile, different list. */
export function FavouriteServicesRender({ nodeId, cfg }: { nodeId: string; cfg: Cfg }) {
  const { styles } = useCanvas();
  return (
    <div className="@container min-w-0">
      <WidgetTitle nodeId={nodeId} text={cfg.title ?? 'Favourite Services'} />
      <ServiceTiles nodeId={nodeId} items={FAVOURITE_SERVICES} showDesc={cfg.showDesc !== false} tpl={String(cfg.cardTemplate ?? 'top')} cols={Number(chosen(styles, nodeId, 'columns') ?? cfg.columns) || undefined} chips={cfg.tileLook === 'chips'} />
    </div>
  );
}

export function FeaturedServicesRender({ nodeId, cfg }: { nodeId: string; cfg: Cfg }) {
  const { styles } = useCanvas();
  const items = FEATURED_SERVICES.slice(0, Number(cfg.show ?? 6));
  /* Columns lives in the STYLE store, because the Content tab and the Arrangement pack are two
     controls for one value (§7.8) — read it back from the same place both of them write. */
  const cols = Number(chosen(styles, nodeId, 'columns') ?? cfg.columns ?? 3);
  /* ⚠️ One value decides icon position AND whether there is an icon — 'none' is the Text-only tile.
     The old `showIcon` toggle is gone with the Icon group it belonged to; two controls answering
     one question is how a card ends up with a position set for an icon it does not have. */
  const tpl = String(cfg.cardTemplate ?? 'left');

  return (
    <div className="@container min-w-0">
      <div className="mb-3 flex items-center gap-2">
        {/* ⚠️ This widget draws its own heading rather than using WidgetTitle, because the heading
            and the browse link share a row. That is also why it was missed: the one fix that gave
            every other widget an editable heading could not reach it. */}
        {/* ⚠️ Fixed like every other product heading. This widget draws its own because the heading
            and the browse link share a row — which is exactly why it was missed the last time a
            heading rule went in, and why it needs its own copy of the test. */}
        {hasFixedTitle(nodeId) ? (
          <h3 style={roleStyle(styles, nodeId, 'title')} className="min-w-0 flex-1 truncate text-[15px] font-semibold text-[#364658]">
            {String(cfg.title ?? '')}
          </h3>
        ) : (
          <Sel id={`${nodeId}-title`} className="min-w-0 flex-1">
            <h3 style={roleStyle(styles, nodeId, 'title')} className="truncate text-[15px] font-semibold text-[#364658]">
              {String(cfg.title ?? '')}
            </h3>
          </Sel>
        )}
        {cfg.showBrowse !== false && (
          <Sel id={`${nodeId}-viewall`} className="flex-shrink-0">
            <span style={roleStyle(styles, nodeId, 'link')} className="text-[12px] font-medium text-[#3D8BD0]">
              {String(cfg.browseLabel ?? 'Browse catalog')}
            </span>
          </Sel>
        )}
      </div>
      {/* ⚠️ The SAME tiles as Favourite Services. These two sit on one page and list the same kind
          of thing, so two grid languages would be a difference that means nothing. */}
      <ServiceTiles nodeId={nodeId} items={FEATURED_SERVICES} showDesc={cfg.showDesc !== false} tpl={String(cfg.cardTemplate ?? 'top')} cols={cols} chips={cfg.tileLook === 'chips'} />
    </div>
  );
}

/* ── the six new-element panels (NEW-ELEMENT-PANELS-SPEC §3, step 4) ─────── */

/** §3.6 — a rule, optionally with a label sitting on it. */
export function DividerRender({ nodeId, cfg }: { nodeId: string; cfg: Cfg }) {
  const { styles } = useCanvas();
  const line = {
    borderTopWidth: Number(cfg.thickness ?? 1),
    borderTopStyle: String(cfg.lineStyle ?? 'solid') as 'solid',
    borderTopColor: String(cfg.lineColor ?? '#E5E7EB'),
  };
  const label = String(cfg.label ?? '');
  const width = `${Number(cfg.width ?? 100)}%`;
  const justify = cfg.align === 'center' ? 'center' : cfg.align === 'right' ? 'flex-end' : 'flex-start';

  if (!label) return <div style={{ width, marginLeft: justify === 'center' ? 'auto' : justify === 'flex-end' ? 'auto' : 0, marginRight: justify === 'center' ? 'auto' : 0, ...line }} />;

  const pos = String(cfg.labelPos ?? 'center');
  return (
    <div style={{ width, marginLeft: justify === 'flex-start' ? 0 : 'auto', marginRight: justify === 'flex-end' ? 0 : 'auto' }} className="flex items-center gap-3">
      {pos !== 'left' && <span className="flex-1" style={line} />}
      <span style={roleStyle(styles, nodeId, 'meta')} className="flex-shrink-0 text-[12px] text-[#7B8FA5]">{label}</span>
      {pos !== 'right' && <span className="flex-1" style={line} />}
    </div>
  );
}

/** §3.7 — invisible on the live portal, visible here or it could not be selected. */
export function SpacerRender({ cfg }: { nodeId: string; cfg: Cfg }) {
  const { enabled } = useCanvas();
  const h = Number(cfg.height ?? 32);
  const show = enabled && cfg.showWhileEditing !== false;
  return (
    <div
      style={{ height: h }}
      className={show ? 'flex items-center justify-center rounded border border-dashed border-[#C3CBD6] bg-[#F9FAFB]' : ''}
    >
      {show && <span className="text-[11px] text-[#9CA3AF]">Spacer · {h}px</span>}
    </div>
  );
}

/** §3.8 — eyebrow, heading at its own LEVEL, sub-heading, optional rule beneath. */
export function TitleRender({ nodeId, cfg }: { nodeId: string; cfg: Cfg }) {
  const { styles } = useCanvas();
  const level = String(cfg.level ?? 'h2');
  const align = (cfg.align ?? 'left') as 'left';
  /* ⚠️ The LEVEL sets the tag — it is document structure and drives screen readers and anchors.
     The size comes from typography, so a smaller heading never silently demotes an H2. */
  const Tag = level as 'h1';
  return (
    <div id={cfg.anchor ? String(cfg.anchor) : undefined} style={{ textAlign: align }}>
      {!!cfg.eyebrow && (
        <Sel id={`${nodeId}-label`}>
          <div style={roleStyle(styles, nodeId, 'meta')} className="mb-1 text-[12px] uppercase tracking-wider text-[#7B8FA5]">{String(cfg.eyebrow)}</div>
        </Sel>
      )}
      <Tag style={roleStyle(styles, nodeId, 'title')} className={cfg.level === 'h1' || cfg.level === 'h2' ? 'text-[26px] font-semibold leading-tight text-[#364658]' : 'text-[18px] font-semibold leading-tight text-[#364658]'}>
        <Sel id={`${nodeId}-title`}>{String(cfg.text ?? '')}</Sel>
      </Tag>
      {!!cfg.sub && (
        <Sel id={`${nodeId}-sub`}>
          <div style={roleStyle(styles, nodeId, 'subtitle')} className="mt-1 text-[14px] text-[#5B7A99]">{String(cfg.sub)}</div>
        </Sel>
      )}
      {cfg.rule === true && (
        <div className="mt-3" style={{ borderTopWidth: Number(cfg.ruleThickness ?? 1), borderTopStyle: 'solid', borderTopColor: String(cfg.ruleColor ?? '#E5E7EB') }} />
      )}
    </div>
  );
}

/** §3.13 — one mark, optionally in a container, optionally captioned. */
export function IconRender({ nodeId, cfg, glyph }: { nodeId: string; cfg: Cfg; glyph?: ReactNode }) {
  const { styles } = useCanvas();
  const size = Number(cfg.iconSize ?? 24);
  /* ⚠️ Height falls back to WIDTH, not to a constant. An icon is square by nature, so an unset
     height that defaulted to something else would distort every glyph in the library. */
  const height = Number(cfg.iconHeight ?? size);
  const justify = cfg.align === 'center' ? 'center' : cfg.align === 'right' ? 'flex-end' : 'flex-start';
  /* The frame is drawn by the SAME component the picker's swatches use, so what you chose in the
     popup is literally what lands on the page. */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: justify }}>
      <IconFrameBox
        frame={(cfg.frame as IconFrame) ?? 'none'}
        size={size}
        color={String(cfg.iconColor ?? '#3D8BD0')}
        fill={String(cfg.containerFill ?? '#EBF5FF')}
        border={Number(cfg.borderWidth ?? 0)}
        borderColor={String(cfg.borderColor ?? '#E5E7EB')}
        radius={Number(cfg.radius ?? 8)}
      >
        {/* Alt text is the fallback when the glyph will not draw, and the screen-reader name. */}
        <span title={String(cfg.a11yLabel ?? '') || undefined} style={{ width: size, height, lineHeight: 0 }} className="inline-flex items-center justify-center">
          {glyph ?? <Star size={Math.min(size, height)} />}
        </span>
      </IconFrameBox>
      {!!cfg.caption && (
        <span style={roleStyle(styles, nodeId, 'meta')} className="mt-1.5 text-[12px] text-[#7B8FA5]">{String(cfg.caption)}</span>
      )}
    </div>
  );
}

/** §3.14 — a decorative form. Hidden from screen readers, hence `aria-hidden`. */
export function ShapeRender({ cfg }: { nodeId: string; cfg: Cfg }) {
  const kind = String(cfg.shape ?? 'rect');
  const fill = String(cfg.fill ?? '#3D8BD0');
  const stroke = Number(cfg.strokeWidth ?? 0);
  const common = {
    fill,
    stroke: stroke ? String(cfg.strokeColor ?? '#3D8BD0') : 'none',
    strokeWidth: stroke,
  };
  const justify = cfg.align === 'center' ? 'center' : cfg.align === 'right' ? 'flex-end' : 'flex-start';
  return (
    <div style={{ display: 'flex', justifyContent: justify }} aria-hidden>
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{
          width: `${Number(cfg.shapeWidth ?? 100)}%`,
          height: Number(cfg.shapeHeight ?? 80),
          transform: `rotate(${Number(cfg.rotation ?? 0)}deg)`,
          opacity: Number(cfg.opacity ?? 100) / 100,
        }}
      >
        {kind === 'circle' && <circle cx="50" cy="50" r="48" {...common} />}
        {kind === 'triangle' && <polygon points="50,4 96,96 4,96" {...common} />}
        {kind === 'wave' && <path d="M0,60 Q25,20 50,60 T100,60 V100 H0 Z" {...common} />}
        {kind === 'rect' && <rect x="1" y="1" width="98" height="98" rx={Number(cfg.radius ?? 8)} {...common} />}
      </svg>
    </div>
  );
}

/* ── the one map the placed-element renderer uses ────────────────────────── */

/* ── List ────────────────────────────────────────────────────────────────────
 *
 * ⚠️ Every item is drawn from the WIDGET's Item Style, never from anything per-item. A list whose
 * points don't share a face has stopped being a list, so the typography lives one level up and each
 * point simply obeys it. Items are still individually selectable — you edit the WORDS per item and
 * the LOOK per list. */
function ListRender({ nodeId, cfg }: { nodeId: string; cfg: Cfg }) {
  const items = ((cfg.items as Cfg[]) ?? []).filter((it) => it.hidden !== true);
  const marker = String(cfg.marker ?? 'disc');
  const fmt = (v: unknown) => {
    const on = Array.isArray(v) ? (v as string[]) : [];
    return {
      fontWeight: on.includes('Bold') ? 700 : undefined,
      textDecoration: on.includes('Underline') ? 'underline' : undefined,
      fontStyle: on.includes('Italic') ? 'italic' : undefined,
    };
  };
  const face = (p: 'title' | 'desc') => ({
    fontFamily: cfg[`${p}Font`] === 'Inherit from theme' ? undefined : String(cfg[`${p}Font`]),
    fontWeight: ({ Light: 300, Normal: 400, Medium: 500, Semibold: 600, Bold: 700 } as Record<string, number>)[String(cfg[`${p}Weight`] ?? 'Normal')],
    fontSize: Number(cfg[`${p}Size`] ?? (p === 'title' ? 15 : 13)),
    color: String(cfg[`${p}Color`] ?? (p === 'title' ? '#364658' : '#7B8FA5')),
    textAlign: cfg[`${p}Align`] as never,
    ...fmt(cfg[`${p}Format`]),
  });
  const rule = cfg.dividerOn === true;

  return (
    <div>
      {!!cfg.title && <div className="mb-2 text-[15px] font-semibold text-[#364658]">{String(cfg.title)}</div>}
      <ol className="m-0 list-none p-0">
        {items.map((it, i) => (
          <Sel key={String(it.id ?? i)} id={itemNodeId(nodeId, String(it.id ?? i))}>
            <li
              style={{
                paddingBottom: rule ? Number(cfg.dividerGap ?? 12) : undefined,
                marginBottom: rule ? Number(cfg.dividerGap ?? 12) : 8,
                /* The rule belongs BETWEEN points, so the last item never draws one — a line under
                   the final row reads as the start of whatever comes next. */
                borderBottomWidth: rule && i < items.length - 1 ? Number(cfg.dividerWidth ?? 1) : 0,
                borderBottomStyle: (['dashed', 'dotted'].includes(String(cfg.dividerStyle)) ? String(cfg.dividerStyle) : 'solid') as never,
                borderBottomColor: String(cfg.dividerColor ?? '#E5E7EB'),
              }}
              className="flex gap-2"
            >
              {marker !== 'none' && (
                <span style={{ color: face('title').color }} className="flex-shrink-0 pt-[2px] text-[13px]">
                  {marker === 'number' ? `${i + 1}.` : '•'}
                </span>
              )}
              <span className="min-w-0 flex-1">
                <Sel id={subNodeId(itemNodeId(nodeId, String(it.id ?? i)), 'title')}>
                  <span style={face('title')} className="block leading-[1.45]">{String(it.title ?? '')}</span>
                </Sel>
                {!!it.desc && it.descHidden !== true && (
                  <Sel id={subNodeId(itemNodeId(nodeId, String(it.id ?? i)), 'desc')}>
                    <span style={face('desc')} className="mt-0.5 block leading-[1.5]">{String(it.desc)}</span>
                  </Sel>
                )}
              </span>
            </li>
          </Sel>
        ))}
      </ol>
    </div>
  );
}

/* ── Accordion ───────────────────────────────────────────────────────────────
 *
 * Two states, styled separately: the row you always see and the panel behind it. Both faces come
 * from the WIDGET, so every row folds and unfolds looking like the others. */
function AccordionRender({ nodeId, cfg }: { nodeId: string; cfg: Cfg }) {
  /* `enabled` is what tells a per-item link to stay inert on the canvas — a click there has to mean
     "select this", not "leave the page you are building". */
  const { enabled } = useCanvas();
  const items = ((cfg.items as Cfg[]) ?? []).filter((it) => it.hidden !== true);
  const [open, setOpen] = useState<string[]>(cfg.firstOpen === true && items[0] ? [String(items[0].id ?? 0)] : []);
  const fmt = (v: unknown) => {
    const on = Array.isArray(v) ? (v as string[]) : [];
    return {
      fontWeight: on.includes('Bold') ? 700 : undefined,
      textDecoration: on.includes('Underline') ? 'underline' : undefined,
      fontStyle: on.includes('Italic') ? 'italic' : undefined,
    };
  };
  const face = (p: 'title' | 'body') => ({
    fontFamily: cfg[`${p}Font`] === 'Inherit from theme' ? undefined : String(cfg[`${p}Font`]),
    fontSize: Number(cfg[`${p}Size`] ?? (p === 'title' ? 16 : 13)),
    color: String(cfg[`${p}Color`] ?? (p === 'title' ? '#364658' : '#7B8FA5')),
    textAlign: cfg[`${p}Align`] as never,
    ...fmt(cfg[`${p}Format`]),
  });
  /* ⚠️ One-at-a-time is enforced on OPEN, not by closing others afterwards — the row you clicked has
     to be the one that ends up open, whatever was open before. */
  const toggle = (id: string) => setOpen((o) => (
    o.includes(id) ? o.filter((x) => x !== id) : cfg.oneAtATime === true ? [id] : [...o, id]
  ));

  return (
    <div style={{ textAlign: cfg.contentAlign as never }}>
      {items.map((it, i) => {
        const id = String(it.id ?? i);
        const isOpen = open.includes(id);
        return (
          <Sel key={id} id={itemNodeId(nodeId, id)}>
            <div>
              <button
                onClick={() => toggle(id)}
                style={{
                  background: String(cfg.headBg ?? '#FFFFFF'),
                  borderWidth: Number(cfg.headBorderWidth ?? 0),
                  borderStyle: 'solid',
                  borderColor: String(cfg.headBorderColor ?? '#E5E7EB'),
                }}
                className="flex w-full items-center gap-3 rounded px-3 py-2.5 text-left"
              >
                <Sel id={subNodeId(itemNodeId(nodeId, id), 'title')}>
                  <span style={face('title')} className="block flex-1 leading-[1.45]">{String(it.title ?? '')}</span>
                </Sel>
                <span
                  style={{
                    color: String(cfg.iconColor ?? '#7B8FA5'),
                    background: String(cfg.iconBg ?? 'transparent'),
                    padding: Number(cfg.iconPad ?? 4),
                    borderRadius: `${Number(cfg.iconRadius ?? 50)}%`,
                  }}
                  className="ml-auto flex flex-shrink-0 items-center justify-center"
                >
                  <ChevronDown size={Number(cfg.iconSize ?? 18)} className={`transition-transform ${isOpen ? '' : '-rotate-90'}`} />
                </span>
              </button>
              {isOpen && it.descHidden !== true && (
                <div
                  style={{
                    background: String(cfg.bodyBg ?? 'transparent'),
                    borderWidth: Number(cfg.bodyBorderWidth ?? 0),
                    borderStyle: 'solid',
                    borderColor: String(cfg.bodyBorderColor ?? '#E5E7EB'),
                  }}
                  className="rounded px-3 pb-3 pt-1"
                >
                  <Sel id={subNodeId(itemNodeId(nodeId, id), 'body')}>
                    <span
                      style={{ ...face('body'), display: 'block', lineHeight: 1.55 }}
                      dangerouslySetInnerHTML={{ __html: String(it.body ?? '') }}
                    />
                  </Sel>
                  {/* The optional per-item link, from the inline editor's "Add link" CTA.
                      ⚠️ Rendered only when the flag is on AND there is an address — the flag alone
                      would draw a link that goes nowhere, which is worse than no link. It falls back
                      to the address for its words, so a link is never a blank underline.
                      ⚠️ Inert on the canvas: a click there has to mean "select this", not "leave the
                      page you are building". */}
                  {it.hasLink === true && String(it.linkUrl ?? '') && (
                    <a
                      href={String(it.linkUrl)}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => { if (enabled) e.preventDefault(); }}
                      className="mt-2 inline-block text-[13px] font-medium text-[#3D8BD0] hover:underline"
                    >{String(it.linkLabel || it.linkUrl)}</a>
                  )}
                </div>
              )}
            </div>
          </Sel>
        );
      })}
    </div>
  );
}

/* ── Text with Image ─────────────────────────────────────────────────────────
 *
 * ⚠️ The image FLOATS. A flex row would put the text in a column beside the picture and leave a
 * ragged block of whitespace under a short image; floating is what makes the text actually wrap
 * around it, which is the whole point of this widget rather than a two-column section. */
function TextImageRender({ cfg }: { nodeId: string; cfg: Cfg }) {
  const on = Array.isArray(cfg.format) ? (cfg.format as string[]) : [];
  const right = cfg.imagePos === 'right';
  const src = String(cfg.image ?? '');
  const border = Number(cfg.imageBorderWidth ?? 0);

  return (
    <div style={{ textAlign: cfg.contentAlign as never }}>
      <div
        style={{
          float: right ? 'right' : 'left',
          width: `${Number(cfg.imageWidth ?? 40)}%`,
          // The margin sits on the side facing the text, so the picture never touches it.
          marginLeft: right ? 16 : 0,
          marginRight: right ? 0 : 16,
          marginBottom: 12,
        }}
      >
        {src ? (
          <img
            src={src}
            alt={String(cfg.alt ?? '')}
            style={{
              borderRadius: Number(cfg.imageRadius ?? 8),
              ...(border > 0 ? { border: `${border}px solid ${String(cfg.imageBorderColor ?? '#E5E7EB')}` } : {}),
            }}
            className="block w-full object-cover"
          />
        ) : (
          <span
            style={{ borderRadius: Number(cfg.imageRadius ?? 8) }}
            className="flex aspect-square w-full items-center justify-center border border-dashed border-[#C3CBD6] bg-[#FAFBFC] text-[#C3CBD6]"
          ><ImageOff size={22} /></span>
        )}
      </div>
      <div
        style={{
          fontFamily: cfg.font === 'Inherit from theme' ? undefined : (cfg.font as string),
          fontWeight: on.includes('Bold') ? 700
            : ({ Light: 300, Normal: 400, Medium: 500, Semibold: 600, Bold: 700 } as Record<string, number>)[String(cfg.weight ?? 'Normal')],
          fontSize: Number(cfg.size ?? 15),
          color: String(cfg.color ?? '#364658'),
          textDecoration: on.includes('Underline') ? 'underline' : undefined,
          fontStyle: on.includes('Italic') ? 'italic' : undefined,
          textAlign: cfg.textAlign as never,
          lineHeight: 1.6,
        }}
        dangerouslySetInnerHTML={{ __html: String(cfg.body ?? '') }}
      />
      {/* Clears the float so the next block starts below the image, not beside it. */}
      <div style={{ clear: 'both' }} />
    </div>
  );
}

/* The five live-data widgets, drawn the way the page's own blocks are drawn.
 *
 * ⚠️ NO card of its own. `Surface` (PortalPlacedElement) already gives a data widget the white box,
 * the border, the radius and the 16px — drawing another here is what made a copied My Requests
 * come out as a hard-bounded card sitting inside the real one.
 *
 * ⚠️ `@container`, matching CardShell: these are resized by dragging their own edge, so the header
 * responds to the CARD's width and never to the window. The title truncates, the count and the link
 * hold their size, and the "View all" words drop below 240px so the row stays one line.
 *
 * The heading and the View-all label are their own nodes, so a copy is editable exactly where the
 * original is — clicking the words edits the words. */
function LiveCard({ nodeId, cfg, title, count, rows }: {
  nodeId: string; cfg: Cfg; title: string; count: number; rows: ReactNode;
}) {
  const { styles } = useCanvas();
  const plain = cfg.countStyle === 'plain';
  return (
    <div className="@container flex min-w-0 flex-col">
      <div className="flex items-center gap-2 pb-2.5">
        {hasFixedTitle(nodeId) ? (
          <span style={roleStyle(styles, nodeId, 'title')} className="block min-w-0 flex-1 truncate px-0.5 text-[15px] font-semibold text-[#364658]">
            {String(cfg.title ?? title)}
          </span>
        ) : (
          <Sel id={`${nodeId}-title`} className="min-w-0 flex-1 px-0.5">
            <span style={roleStyle(styles, nodeId, 'title')} className="block truncate text-[15px] font-semibold text-[#364658]">
              {String(cfg.title ?? title)}
            </span>
          </Sel>
        )}
        {cfg.showCount !== false && (plain
          ? <span className="flex-shrink-0 text-[12px] font-medium text-[#7B8FA5]">{count}</span>
          : (
            <span className="inline-flex h-[18px] min-w-[18px] flex-shrink-0 items-center justify-center rounded bg-[#EEF2F6] px-1.5 text-[11px] font-semibold text-[#64748B]">
              {count}
            </span>
          ))}
        {cfg.showViewAll !== false && (
          <span style={roleStyle(styles, nodeId, 'link')} className="flex flex-shrink-0 items-center gap-1 text-[#7B8FA5]">
            <Sel id={`${nodeId}-viewall`} className="hidden px-0.5 @min-[240px]:inline-block">
              <span className="text-[12px] font-medium">{String(cfg.viewAllLabel ?? 'View all')}</span>
            </Sel>
            <ChevronsRight size={16} />
          </span>
        )}
      </div>
      <div className="min-h-0 min-w-0 flex-1">{rows}</div>
    </div>
  );
}

/* ⚠️ Every row is `min-w-0` with a truncating subject and non-shrinking chips. Narrowed, a row
   whose longest unbreakable word set a min-content floor pushed the whole card wider than the
   column it was in — so the card stopped obeying the width its section asked for. */
const liveRow = 'border-t border-[#F0F2F5] py-2.5 first:border-t-0';
const livePill = 'max-w-full flex-shrink truncate whitespace-nowrap rounded-sm bg-[#F1F5F9] px-1.5 py-0.5 text-[12px] font-medium text-[#475467]';

function RequestsRender({ nodeId, cfg }: { nodeId: string; cfg: Cfg }) {
  const rows = PORTAL_OPEN_REQUESTS.slice(0, Number(cfg.show ?? 5));
  return (
    <LiveCard nodeId={nodeId} cfg={cfg} title="My Open Requests" count={rows.length} rows={
      rows.map((r) => {
        /* Same mode-aware tone the built-in card uses — a copy must not glow where the original does not. */
        const tone = statusTone(r.status, typeof document !== 'undefined' && !!document.querySelector('.portal-dark'));
        return (
          <div key={r.id} className={liveRow}>
            <div className="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1">
              {cfg.showId !== false && <span className={livePill}>{r.id}</span>}
              <span className="min-w-0 flex-1 truncate text-[13px] text-[#364658]">{r.subject}</span>
              <span
                className="flex-shrink-0 whitespace-nowrap rounded-sm px-2 py-0.5 text-[12px] font-medium"
                style={{ color: tone.fg, background: tone.bg }}
              >{r.status}</span>
            </div>
            {cfg.showDate !== false && <div className="mt-1 text-[12px] text-[#7B8FA5]">{r.at}</div>}
          </div>
        );
      })
    } />
  );
}

function ApprovalsRender({ nodeId, cfg }: { nodeId: string; cfg: Cfg }) {
  const rows = PORTAL_APPROVALS.slice(0, Number(cfg.show ?? 5));
  return (
    <LiveCard nodeId={nodeId} cfg={cfg} title="Pending Approvals" count={rows.length} rows={
      rows.map((a) => (
        <div key={a.id} className={liveRow}>
          <div className="min-w-0 truncate text-[13px] text-[#364658]">{a.id}: {a.subject}</div>
          <div className="mt-0.5 min-w-0 truncate text-[12px] text-[#7B8FA5]">{a.reason}</div>
          <div className="mt-1 min-w-0 truncate text-[12px] text-[#7B8FA5]">{a.at}</div>
        </div>
      ))
    } />
  );
}

function KnowledgeRender({ nodeId, cfg }: { nodeId: string; cfg: Cfg }) {
  const rows = PORTAL_ARTICLES.slice(0, Number(cfg.show ?? 5));
  return (
    <LiveCard nodeId={nodeId} cfg={cfg} title="Most Read" count={rows.length} rows={
      rows.map((k) => (
        <div key={k.id} className={liveRow}>
          <div className="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1">
            <span className={livePill}>{k.id}</span>
            <span className="min-w-0 flex-1 truncate text-[13px] text-[#364658]">{k.title}</span>
          </div>
          <div className="mt-1 min-w-0 truncate text-[12px] text-[#7B8FA5]">{k.at}</div>
        </div>
      ))
    } />
  );
}

const PLACED_ASSETS = [
  { id: 'AST-3', name: 'Dell Latitude 5440', type: 'Laptop' },
  { id: 'AST-1', name: 'Dell UltraSharp U2723QE', type: 'Monitor' },
  { id: 'AST-7', name: 'Logitech MX Master 3S', type: 'Mouse' },
  { id: 'AST-12', name: 'Jabra Evolve2 65', type: 'Headset' },
  { id: 'AST-9', name: 'iPhone 14', type: 'Mobile' },
];

function AssetsRender({ nodeId, cfg }: { nodeId: string; cfg: Cfg }) {
  const rows = PLACED_ASSETS.slice(0, Number(cfg.show ?? 5));
  return (
    <LiveCard nodeId={nodeId} cfg={cfg} title="My Assets" count={rows.length} rows={
      rows.map((a) => (
        <div key={a.id} className={`${liveRow} flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1`}>
          <span className={livePill}>{a.id}</span>
          <span className="min-w-0 flex-1 truncate text-[13px] text-[#364658]">{a.name}</span>
          <span className="flex-shrink-0 whitespace-nowrap text-[12px] text-[#9CA3AF]">{a.type}</span>
        </div>
      ))
    } />
  );
}

/* ⚠️ My CIs is EMPTY BY DESIGN (§7.4) — it is empty on most real instances, so its empty state is
   the state most requesters see, and a truthful copy of it is empty too. */
function CisRender({ nodeId, cfg }: { nodeId: string; cfg: Cfg }) {
  return (
    <LiveCard nodeId={nodeId} cfg={cfg} title="My CIs" count={0} rows={
      <div className="flex items-center justify-center rounded border border-dashed border-[#E5E7EB] py-7 text-[13px] text-[#9CA3AF]">
        No Data Found
      </div>
    } />
  );
}

/* A Record List: the live card, with the query left to the admin.
 *
 * ⚠️ The rows are the module's DUMMY data and the filter runs over them, so the card behaves here
 * exactly as it will on the portal — narrow the statuses and rows drop out, narrow too far and you
 * get the empty state. A card that ignored its own filters on the canvas would teach the admin that
 * the controls do nothing, which is the one thing a builder must never do.
 * ⚠️ The empty state is the SAME one My CIs draws, not a copy — asked for by name, and the state a
 * requester genuinely lands on when their filter matches nothing. */
function RecordListRender({ nodeId, cfg }: { nodeId: string; cfg: Cfg }) {
  const mod = recordModule(cfg.module as string);
  /* ⚠️ ONE reader for both halves of the control. A preset and a hand-built condition list are the
     same setting shown two ways, so `activeConditions` resolves whichever is set and the renderer
     never has to know which — which is what stops the canvas and the panel disagreeing about what
     the card is showing.
     ⚠️ No conditions means EVERY record, the way the request card's empty status list does: "I have
     not narrowed this" and "I have narrowed it to nothing" are different intentions and only one of
     them should empty the card. */
  /* ⚠️ GROUPS, not the flattened list. Flattening ANDs everything, so two groups an admin built to
     mean "open OR mine" would have quietly been evaluated as "open AND mine" — a filter that reads
     one way in the builder and behaves another on the very canvas that is supposed to be showing
     it. `activeGroups` resolves a preset, a legacy flat list and real groups to the same shape. */
  /* ⚠️ The TREE, so a nested bracket is evaluated as one. `activeTree` resolves a preset, a legacy
     flat list, the older OR-of-ANDs and a real tree to the same shape, so the canvas can never read
     an old filter differently from the builder that wrote it. */
  const tree = activeTree(cfg.filter as RecordFilter | undefined, String(cfg.module ?? 'request'));
  const matching = mod.rows.filter((x) => matchesTree(x, tree));
  const rows = matching.slice(0, Number(cfg.show ?? 3));
  const dark = typeof document !== 'undefined' && !!document.querySelector('.portal-dark');

  /* ── KPI ────────────────────────────────────────────────────────────────────────────────────
   *
   * The same widget, the same module and the same filter — drawn as one number instead of a list.
   *
   * ⚠️ The number is the COUNT OF MATCHING RECORDS, not a figure of its own. It is the only single
   * number a module and a filter can honestly produce, and it is what makes the two fields above it
   * mean the same thing in both modes: change the filter and the count moves with it. A KPI that
   * carried a separate value would leave a card whose Module and Filter controls did nothing.
   * ⚠️ The TITLE is the caption. The list uses it as its heading; here it is what the number is a
   * number OF, which is the same sentence in a different position — so there is no second label
   * field to keep in step with the first.
   * ⚠️ It reads the LIVE list, not `rows`, which has already been cut to the visible few. A card
   * showing "3" while the filter matches nine is the sort of wrong that looks right. */
  if (cfg.display === 'kpi') {
    return (
      <div className="flex items-center gap-3.5">
        <span className="flex size-11 flex-shrink-0 items-center justify-center rounded-lg bg-[#F1F5F9] text-[#475467]">
          <LayoutList size={20} />
        </span>
        <span className="min-w-0">
          <span className="block text-[30px] font-semibold leading-none text-[#364658]">{matching.length}</span>
          <span className="mt-1.5 block truncate text-[13px] text-[#7B8FA5]">{String(cfg.title ?? mod.label)}</span>
        </span>
      </div>
    );
  }
  return (
    <LiveCard nodeId={nodeId} cfg={cfg} title={mod.label} count={rows.length} rows={
      rows.length === 0 ? (
        <div className="flex items-center justify-center rounded border border-dashed border-[#E5E7EB] py-7 text-[13px] text-[#9CA3AF]">
          No Data Found
        </div>
      ) : rows.map((x) => {
        const tone = statusTone(x.status, dark);
        return (
          <div key={x.id} className={liveRow}>
            <div className="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1">
              <span className={livePill}>{x.id}</span>
              <span className="min-w-0 flex-1 truncate text-[13px] text-[#364658]">{x.title}</span>
              <span
                className="flex-shrink-0 whitespace-nowrap rounded-sm px-2 py-0.5 text-[12px] font-medium"
                style={{ color: tone.fg, background: tone.bg }}
              >{x.status}</span>
            </div>
            <div className="mt-1 text-[12px] text-[#7B8FA5]">{x.meta}</div>
          </div>
        );
      })
    } />
  );
}

export const COLLECTION_RENDERERS: Record<string, (p: { nodeId: string; cfg: Cfg }) => ReactNode> = {
  'c-records': RecordListRender,
  'c-requests': RequestsRender,
  'c-approvals': ApprovalsRender,
  'c-knowledge': KnowledgeRender,
  'c-assets': AssetsRender,
  'c-cis': CisRender,
  'b-text-image': TextImageRender,
  'b-list': ListRender,
  'l-divider': DividerRender,
  'b-spacer': SpacerRender,
  'b-large-title': TitleRender,
  'b-small-title': TitleRender,
  'v-icon': IconRender,
  'v-shape': ShapeRender,
  'c-contact': ContactRender,
  'c-announcements': AnnouncementsRender,
  'c-services': FeaturedServicesRender,
  'c-favourites': FavouriteServicesRender,
  'c-faq': FaqRender,
  'b-accordion': AccordionRender,
  'b-card': CardRender,
  'b-table': TableRender,
  'v-slider': SliderRender,
  'v-gallery': GalleryRender,
  'c-feedback': FeedbackRender,
};
