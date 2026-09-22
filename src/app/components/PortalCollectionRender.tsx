/* Support Portal builder — how the six collection widgets DRAW (spec §7.9, §7.15–7.19).
 *
 * Every switch in their drawers lands here. A control that looks right and changes nothing teaches
 * people to distrust the panel (§8.4), so each renderer reads the same config keys the registry
 * declares — nothing is decorative.
 *
 * Items and their sub-elements wrap in <Sel>, which is what makes §4.3 true: you reach a slide's
 * Heading by clicking the heading, not by hunting through a list.
 */

import { useRef, useState } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import type { ReactNode } from 'react';
import { ArrowUpRight, ChevronDown, ChevronLeft, LayoutList, ChevronRight, ChevronsRight, ImageIcon, ImageOff, Mail, Phone, Plus, ShoppingCart, Star } from 'lucide-react';
import { Sel, useCanvas } from './PortalCanvas';
import { ImageUploadZone } from './PortalControls';
/* The Table is a module of its own — a spreadsheet-grade editor is a different kind of thing from
   the read-only renderers in this file, and it owns its data model, its handles and its menus. */
import { PortalTable } from './PortalTable';
import { hasFixedTitle, hasFixedViewAll, itemNodeId, registerItemName, subNodeId } from './portalPageModel';
import { CarouselArrows, CarouselDots, CarouselNav, CarouselTrack, useCarousel } from './PortalCarousel';
import { LineMark } from './PortalLineStyles';
import type { LineStyle } from './PortalLineStyles';
import type { CarouselType } from './PortalCarousel';
import type { PortalStyles } from './portalPageModel';
import { chosen, containerCss, iconBoxCss, resolveType, roleStyle } from './portalStyleResolver';
import { IconFrameBox } from './PortalIconFrame';
import { iconNode } from './PortalIconPicker';
import type { IconChoice } from './PortalIconPicker';
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
function WidgetTitle({ nodeId, text, icon, action, count, flush }: {
  nodeId: string; text?: unknown;
  /* Drops the heading's own bottom margin — for a heading sitting ABOVE its card, where the space
     below it is the Gap field's to set and two sources for one distance is one too many. */
  flush?: boolean;
  /* The count badge `CardShell` puts beside every other data card's title. Absent unless passed. */
  count?: number;
  /* Something the heading row carries on its RIGHT — a card-level link. Absent unless a caller
     passes it, so every widget drawing its heading through here renders exactly as before. */
  action?: ReactNode;
  /* ⚠️ The SAME tinted badge `CardShell` draws, because a page turns these on for every card at
     once or for none — and a widget that paints its own heading instead of going through the
     shell must not become the one card on the row without one. Absent unless a caller passes it,
     so no existing page moves. */
  icon?: ReactNode;
}) {
  const { styles } = useCanvas();
  if (!text) return null;
  const head = (
    <div className={(flush ? '' : 'mb-3 ') + 'flex items-center gap-2'}>
      {icon && (
        <span className="flex size-7 flex-shrink-0 items-center justify-center rounded-md bg-[#EAF3FB] text-[#2F6FB5]">{icon}</span>
      )}
      <h3 style={roleStyle(styles, nodeId, 'title')} className="text-[16px] font-semibold text-[#364658]">
        {String(text)}
      </h3>
      {count !== undefined && (
        <span className="inline-flex h-[18px] min-w-[18px] flex-shrink-0 items-center justify-center rounded bg-[#EEF2F6] px-1.5 text-[11px] font-semibold text-[#64748B]">
          {count}
        </span>
      )}
    </div>
  );
  /* ⚠️ A product-owned heading renders BARE — no Sel, so it is not selectable and not typeable.
     Every widget that draws its heading through here inherits the rule at once; the two that draw
     their own are handled at their own call sites below. */
  if (!action) {
    if (hasFixedTitle(nodeId)) return head;
    return <Sel id={`${nodeId}-title`}>{head}</Sel>;
  }
  /* ⚠️ With an action the row is split, and the action sits OUTSIDE the heading's `Sel`. Inside it,
     clicking the link would select the title and put a caret in it — the link would be a second
     way into the heading rather than a link. */
  const words = (
    <div className="flex min-w-0 items-center gap-2">
      {icon && (
        <span className="flex size-7 flex-shrink-0 items-center justify-center rounded-md bg-[#EAF3FB] text-[#2F6FB5]">{icon}</span>
      )}
      <h3 style={roleStyle(styles, nodeId, 'title')} className="truncate text-[16px] font-semibold text-[#364658]">
        {String(text)}
      </h3>
      {count !== undefined && (
        <span className="inline-flex h-[18px] min-w-[18px] flex-shrink-0 items-center justify-center rounded bg-[#EEF2F6] px-1.5 text-[11px] font-semibold text-[#64748B]">
          {count}
        </span>
      )}
    </div>
  );
  return (
    <div className="mb-3 flex items-center gap-3">
      <div className="min-w-0 flex-1">{hasFixedTitle(nodeId) ? words : <Sel id={`${nodeId}-title`}>{words}</Sel>}</div>
      <div className="flex-shrink-0">{action}</div>
    </div>
  );
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
function ChildBlock({ item, nodeId }: { item: Item; nodeId?: string }) {
  const { enabled, fillChildBlock } = useCanvas();
  /* The empty slot a Split leaves: pick what goes in it. On the live portal it draws nothing. */
  if (item.type === 'empty') {
    if (!enabled) return null;
    return (
      <span className="flex min-h-9 w-full flex-wrap items-center justify-center gap-1.5 rounded border border-dashed border-[#C3CBD6] px-2 py-1.5">
        {[['button', 'Button'], ['text', 'Text'], ['icon_child', 'Icon']].map(([t, l]) => (
          <button
            key={t}
            type="button"
            onClick={(e) => { e.stopPropagation(); if (nodeId) fillChildBlock?.(nodeId, t); }}
            className="inline-flex h-7 items-center gap-1 rounded px-2 text-[12px] font-medium text-[#3D8BD0] transition-colors hover:bg-[#EBF5FF]"
          ><Plus size={12} />{l}</button>
        ))}
      </span>
    );
  }
  if (item.type === 'button') {
    return (
      <span className="inline-flex h-9 items-center justify-center gap-2 rounded bg-[#3D8BD0] px-4 text-[13px] font-medium text-white">
        {iconNode(item.icon as IconChoice | undefined, 16)}
        {String(item.label ?? 'Button')}
      </span>
    );
  }
  if (item.type === 'icon_child') {
    const size = Number(item.iconSize ?? 22);
    return (
      <span style={{ color: String(item.iconColor ?? '#475467') }} className="inline-flex">
        {iconNode(item.icon as IconChoice | undefined, size) ?? <Star size={size} strokeWidth={1.7} />}
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
  /* ⚠️ ALWAYS automatic, always swipeable, always looping. Auto-advance runs in Preview and on the
     published portal only (`live: !enabled`) — a band moving under the pointer while you select a
     slide cannot be worked on. */
  const car = useCarousel({ count: slides.length, type: 'auto', interval: 5, pauseOnHover: true, loop: true, live: !enabled });
  const overlay = Number(cfg.slideOverlay ?? 30) / 100;
  /* Data only: ONE background image and only the text slides. Data + image: every slide its own image. */
  const dataOnly = cfg.slideMode === 'data';
  /* The standard carousel gap — not a setting. */
  const GAP = 16;

  if (!slides.length) {
    return <p className="py-10 text-center text-[13px] text-[#9CA3AF]">No slides yet — add one in the panel.</p>;
  }

  /* The words of one slide. ⚠️ Heading and caption stay their own `Sel`s so §4.3 holds — you reach a
     slide's heading by clicking the heading, in either mode. */
  const words = (s: Item, inode: string) => (
    <div className="p-5" style={{ maxWidth: `${Number(cfg.slideMaxWidth ?? 60)}%` }}>
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
  );

  const media = (src: unknown, alt: unknown) => (src
    ? <img src={String(src)} alt={String(alt ?? '')} draggable={false} className="size-full select-none object-cover" />
    : <span className="flex size-full items-center justify-center text-[#64748B]"><ImageOff size={26} /></span>);

  const dots = slides.length > 1 && <CarouselDots car={car} count={slides.length} over />;

  if (dataOnly) {
    return (
      <div>
        <WidgetTitle nodeId={nodeId} text={cfg.title} />
        {/* The image is FIXED; only the text band slides across it.
            ⚠️ `car.bind` carries its own `style` (touch-action, cursor), so it is spread FIRST and the two
            styles are merged: spread after, it replaced the aspect ratio and the whole slider collapsed to
            the height of its dots — a thin dark bar. */}
        <div
          {...car.bind}
          className="relative overflow-hidden rounded-lg bg-[#1E293B]"
          style={{ ...car.bind.style, aspectRatio: '16 / 9', minHeight: 220 }}
        >
          {cfg.bgImage ? media(cfg.bgImage, '') : (
            /* Before an image is uploaded the slider still reads as an image with words over it — a
               placeholder picture, not an empty band — so the admin sees what they added. */
            <span className="flex size-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-[#334155] to-[#1E293B] pb-16 text-white/45">
              <ImageIcon size={40} strokeWidth={1.5} />
              <span className="text-[12px] font-medium">Background image</span>
            </span>
          )}
          <span className="absolute inset-0" style={{ background: `rgba(0,0,0,${overlay})` }} />
          <div className="absolute inset-x-0 bottom-6">
            <CarouselTrack car={car} gap={GAP}>
              {slides.map((s) => {
                const inode = itemNodeId(nodeId, s.id);
                return <Sel key={s.id} id={inode} className="block">{words(s, inode)}</Sel>;
              })}
            </CarouselTrack>
          </div>
          {dots}
        </div>
      </div>
    );
  }

  return (
    <div>
      <WidgetTitle nodeId={nodeId} text={cfg.title} />
      {/* ⚠️ The drag surface is the WRAPPER, not each slide — bound to a slide it would be torn off the
          moment the track moved under the pointer. */}
      <div className="relative" {...car.bind}>
        <CarouselTrack car={car} gap={GAP}>
          {slides.map((s) => {
            const inode = itemNodeId(nodeId, s.id);
            return (
              <Sel key={s.id} id={inode} className="block">
                <div className="relative overflow-hidden rounded-lg bg-[#1E293B]" style={{ aspectRatio: '16 / 9' }}>
                  {media(s.src, s.alt)}
                  <span className="absolute inset-0" style={{ background: `rgba(0,0,0,${overlay})` }} />
                  <div className="absolute inset-x-0 bottom-6">{words(s, inode)}</div>
                </div>
              </Sel>
            );
          })}
        </CarouselTrack>
        {dots}
      </div>
    </div>
  );
}
/* ⚠️ The private `Dots` that used to live here is GONE — `CarouselDots` in PortalCarousel.tsx is
   the one readout, shared with the Announcements carousel. Two dot rows over one mechanism is two
   places for the active-dot colour to drift. */

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
/* ⚠️ `cv0` is the EMAIL value and `cv1` the PHONE value — the stored keys — whatever order the lines
   are drawn in, so a portal that already set them keeps its numbers against the right icon. */
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
  const { styles, enabled } = useCanvas();
  /* Blocks the admin added with the toolbar's + — Button, Text or Icon. */
  const blocks = visible(cfg.children as Item[], enabled);
  /* ⚠️ Phone first, then email — an ICON and the value. The icon says what each line is, so the
     words "Phone" and "Email" were a label restating the glyph. Nothing here is a `Sel`: the lines
     are the product's, and their two values are edited in the panel (`cv1` phone, `cv0` email). */
  const lines = [
    { key: 'cv1', label: 'Phone', icon: <Phone size={17} strokeWidth={1.6} />, value: CONTACT_LINES[1].value },
    { key: 'cv0', label: 'Email', icon: <Mail size={17} strokeWidth={1.6} />, value: CONTACT_LINES[0].value },
  ];
  /* Two short values side by side, or a row each. See the panel field for why one line has no icons. */
  const inline = String(cfg.lineLayout ?? 'stacked') === 'inline';
  return (
    <div className="@container min-w-0">
      <WidgetTitle nodeId={nodeId} text={cfg.title} />
      {inline ? (
        /* ⚠️ It WRAPS rather than truncating the pair. The two values are the whole content of the
           card, so a narrow column dropping the email onto a second line still says both things,
           where one clipped line says neither properly. The middot travels with the value BEFORE
           it, so a wrapped line never opens on a separator. */
        <div className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1 border-t border-[#F0F2F5] pt-3.5">
          {lines.map((l, i) => (
            <span key={l.key} className="inline-flex min-w-0 items-center gap-1.5">
              <span title={l.label} style={roleStyle(styles, nodeId, 'body')} className="min-w-0 truncate text-[14px] text-[#1E293B]">
                {String(cfg[l.key] ?? l.value)}
              </span>
              {i < lines.length - 1 && <span aria-hidden className="text-[#98A6B6]">·</span>}
            </span>
          ))}
        </div>
      ) : (
      <div className="flex flex-col gap-3.5 border-t border-[#F0F2F5] pt-3.5">
        {lines.map((l) => (
          <div key={l.key} className="flex min-w-0 items-center gap-3">
            <span title={l.label} className="flex flex-shrink-0 text-[#475467]">{l.icon}</span>
            <span style={roleStyle(styles, nodeId, 'body')} className="min-w-0 truncate text-[14px] text-[#1E293B]">
              {String(cfg[l.key] ?? l.value)}
            </span>
          </div>
        ))}
      </div>
      )}
      {blocks.length > 0 && (
        <div className="mt-3 flex flex-col gap-2.5">
          {/* A block marked `beside` shares the line of the one before it — that is what Split makes. */}
          {blocks.reduce<Item[][]>((lines, b) => {
            if (b.beside && lines.length) lines[lines.length - 1].push(b); else lines.push([b]);
            return lines;
          }, []).map((line) => (
            <div key={line[0].id} className="flex min-w-0 items-stretch gap-3">
              {line.map((b) => {
                const bid = itemNodeId(nodeId, b.id);
                /* The toolbar's alignment places the block's CONTENT inside its column. */
                const h = String(styles[bid]?.align ?? 'left');
                const v = String(styles[bid]?.alignY ?? 'start');
                return (
                  <Sel
                    key={b.id}
                    id={bid}
                    className="flex min-w-0 flex-1 flex-col"
                    style={{
                      alignItems: h === 'center' ? 'center' : h === 'right' ? 'flex-end' : h === 'stretch' ? 'stretch' : 'flex-start',
                      justifyContent: v === 'center' ? 'center' : v === 'end' ? 'flex-end' : 'flex-start',
                      textAlign: h === 'center' ? 'center' : h === 'right' ? 'right' : 'left',
                    }}
                  >
                    <ChildBlock item={b} nodeId={bid} />
                  </Sel>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── §7.5 Announcements ──────────────────────────────────────────────────── */

/* ⚠️ `desc` is read by the CAROUSEL only. A regular card lists headlines — a paragraph under each of
   three rows would turn a glanceable list into a page of reading — while a carousel shows ONE
   notice at a time and has the room to say what it actually means for the reader. */
const ANNOUNCEMENTS = [
  { id: 'a1', title: 'Planned network maintenance — Sat 16 Aug, 02:00–05:00', at: '11 Aug 2026', desc: 'VPN, the intranet and payroll submission are unavailable for the full window.' },
  { id: 'a2', title: 'New VPN client rollout begins next week', at: '08 Aug 2026', desc: 'Check whether your laptop is on the first wave, and what to back up first.' },
  { id: 'a3', title: 'Service desk hours extended to 20:00 IST', at: '04 Aug 2026', desc: 'Walk-in support at the Block B desk now runs through the evening shift.' },
  { id: 'a4', title: 'Office 365 licence renewal — action needed by 30 Aug', at: '01 Aug 2026', desc: 'Confirm your licence in the self-service portal, or it will be reassigned.' },
  { id: 'a5', title: 'Phishing awareness training is now mandatory', at: '28 Jul 2026', desc: 'The 20-minute module is assigned to everyone and is due by the end of the month.' },
];

/** One line of text that truncates, and shows the whole of itself on hover — but ONLY when it was
 *  actually cut. A tooltip repeating words already fully on screen is noise, so whether it opens is
 *  decided at the moment of hover by measuring the rendered line, not by guessing from its length. */
function OneLine({ text, className = '', style }: { text: string; className?: string; style?: React.CSSProperties }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  return (
    <Tooltip
      delayDuration={300}
      open={open}
      onOpenChange={(o) => setOpen(o && !!ref.current && ref.current.scrollWidth > ref.current.clientWidth)}
    >
      <TooltipTrigger asChild>
        <span ref={ref} style={style} className={`block min-w-0 truncate ${className}`}>{text}</span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[320px] text-wrap">{text}</TooltipContent>
    </Tooltip>
  );
}

/** `11 Aug 2026` → `Tue,` + `Aug 11` — the two lines of an announcement's date tile. */
/* ⚠️ The MONTH over the DAY, not the weekday over the date. A notice is located by when it
   landed, and a calendar tile is the shape everyone already reads that from — where "Tue," above
   "Aug 11" spent the tile's larger half on the one part of a date nobody navigates by. */
function postedParts(at: string): { month: string; date: string } {
  const d = new Date(at);
  if (Number.isNaN(d.getTime())) return { month: '', date: at };
  return {
    month: d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
    date: String(d.getDate()).padStart(2, '0'),
  };
}

export function AnnouncementsRender({ nodeId, cfg, headIcon }: { nodeId: string; cfg: Cfg; headIcon?: ReactNode }) {
  const { styles, enabled } = useCanvas();
  const rows = ANNOUNCEMENTS.slice(0, Number(cfg.show ?? 3));
  const { gap, dividers } = arrange(styles, nodeId);

  /* ⚠️ CAROUSEL is a DISPLAY of the same card, never a second widget. The rows, their words, their
     dates and their styling all come from exactly where they already came from — the only thing
     that changes is how many are on screen at once. */
  const carousel = cfg.display === 'carousel' && rows.length > 0;
  /* ⚠️ The carousel moves through EVERY announcement, two to a page. The count badge beside the
     heading says how many there are, so the carousel is the way to reach all of them — capping it at
     the regular card's `show` would leave the badge promising rows nothing could get to. */
  /* With the header on, a page is two rows under it. With it OFF the card is a one-line STRIP, so a
     page is one notice with its controls beside it (see the strip branch below). */
  /* The header is the REGULAR card's — the two carousel types never carry one (Card type decides). */
  const headerOn = (cfg.display ?? 'regular') !== 'carousel' && cfg.display !== 'image';
  /* Only the REGULAR card has a heading, so only it can put one above itself — the same gate the
     panel's Title field carries. */
  const titleOutside = headerOn && String(cfg.titlePlace ?? 'inside') === 'outside';
  const imageDisplay = cfg.display === 'image' && rows.length > 0;
  /* The image carousel shows ONE notice in its band, header or not. */
  const PER_PAGE = headerOn && !imageDisplay ? 2 : 1;
  const pages: (typeof ANNOUNCEMENTS)[] = [];
  /* ⚠️ The carousels show the latest THREE — three dots, three notices. A carousel is for what is
     current; the last dot offers View all. */
  const CAROUSEL_ITEMS = ANNOUNCEMENTS.slice(0, 3);
  for (let i = 0; i < CAROUSEL_ITEMS.length; i += PER_PAGE) pages.push(CAROUSEL_ITEMS.slice(i, i + PER_PAGE));
  /* ⚠️ Called UNCONDITIONALLY — a hook behind an `if` changes the hook count the moment Display is
     switched. ⚠️ Always MANUAL: nothing left in the panel could turn an automatic one off. */
  /* ⚠️ AUTO-ADVANCES every 5s and loops: on the last notice Next reads "View all ›", then it returns to
     the first. Paused while the pointer is over it, and still on the editing canvas (`live`). */
  const car = useCarousel({
    count: pages.length,
    type: 'auto',
    interval: 5,
    loop: true,
    live: !enabled && (carousel || imageDisplay),
  });

  /* ⚠️ `roleStyle` hands back `fontWeight` and `lineHeight` UNCONDITIONALLY, and `undefined` for
     every value nobody chose. Spread as it comes, the `undefined` colour DELETES the colour a line
     set and the hard 400 flattens its semibold. So only the values a human actually set are kept. */
  const chosenRole = (role: 'body' | 'meta') => {
    const { fontWeight: _w, lineHeight: _lh, ...rest } = roleStyle(styles, nodeId, role) as Record<string, unknown>;
    return Object.fromEntries(Object.entries(rest).filter(([, val]) => val !== undefined)) as React.CSSProperties;
  };

  /* ONE announcement row, shared by BOTH displays so a notice cannot look like two different things
     depending on the mode: date tile · headline · detail.
     ⚠️ Headline and detail are ONE line each, cut with an ellipsis and read in full on hover — equal
     row heights are what let the list be scanned.
     ⚠️ The tile is the weekday and the date, no "Posted": the card is headed Announcements, so the
     word restated what the whole card already says. */
  const row = (a: (typeof ANNOUNCEMENTS)[number]) => {
    const p = postedParts(a.at);
    return (
      <div key={a.id} className="flex items-stretch gap-3.5 py-3">
        {cfg.showDate !== false && (
          <div style={chosenRole('meta')} className="flex w-[54px] flex-shrink-0 flex-col items-center justify-center rounded-lg bg-[#F1F4F8] px-1.5 py-1.5 text-center">
            {p.month && <span className="whitespace-nowrap text-[10px] font-semibold uppercase leading-[13px] tracking-wide text-[#98A6B6]">{p.month}</span>}
            <span className="whitespace-nowrap text-[18px] font-semibold leading-[22px] text-[#364658]">{p.date}</span>
          </div>
        )}
        <div className="flex min-w-0 flex-1 flex-col justify-center">
          <OneLine text={a.title} style={{ fontWeight: 600, lineHeight: 1.4, ...chosenRole('body') }} className="text-[14px] text-[#1E293B]" />
          <OneLine text={a.desc} style={{ lineHeight: 1.5, ...chosenRole('meta') }} className="mt-1 text-[13px] text-[#7B8FA5]" />
        </div>
      </div>
    );
  };

  /* The REGULAR card's "View all ›". The two carousels do NOT carry one — their last dot already
     turns Next into "View all", so a second copy of the same link would sit one line above it.
     ⚠️ Drawn exactly as `CardShell` draws every other card's: the words, then the product's chevron.
     Announcements is in `FIXED_VIEWALL_NODES`, so the label is the product's and renders BARE — no
     `Sel` around it, or the one link on the card would be a second way to type in the heading row. */
  const viewAll = cfg.showViewAll === false ? undefined : (
    <span style={roleStyle(styles, nodeId, 'link')} className="flex flex-shrink-0 items-center gap-1 text-[#7B8FA5]">
      <span className="text-[12px] font-medium">{String(cfg.viewAllLabel ?? 'View all')}</span>
      <ChevronsRight size={16} />
    </span>
  );

  /* ── IMAGE CAROUSEL ── one photo the admin uploads, a colour band beneath it, and the notices
     paging inside the band: date tile · headline · detail, controls top right.
     ⚠️ `-m-4` lets the photo reach the card's edges — the card gives every widget 16px of padding,
     and a photo inset inside a white frame is a picture ON a card rather than the card's face.
     ⚠️ The band's text colour is a CHOICE (Light / Dark), never guessed from the band colour: a
     light band with white text is the unreadable card this setting exists to prevent. */
  if (imageDisplay) {
    /* The band text colour is the admin's pick. The description, the date tile and the tile's wash are
       all DERIVED from it (a softer share of the same colour), so one pick keeps the band consistent.
       ⚠️ An older card stored `bandText: 'dark'` — honoured as the fallback so it does not turn white. */
    const ink = String(cfg.bandTextColor ?? (cfg.bandText === 'dark' ? '#1E293B' : '#FFFFFF'));
    const sub = `color-mix(in srgb, ${ink} 72%, transparent)`;
    /* Whether the text is LIGHT, for the arrows and dots — white controls on a band whose text is light. */
    const light = (() => {
      const m = /^#([0-9a-f]{6})/i.exec(ink) ?? null;
      const rgb = m ? [0, 2, 4].map((k) => parseInt(m[1].slice(k, k + 2), 16))
        : (/rgba?\((\d+),\s*(\d+),\s*(\d+)/i.exec(ink)?.slice(1, 4).map(Number) ?? [255, 255, 255]);
      return (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) > 150;
    })();
    const src = String(cfg.coverImage ?? '');
    const bandRow = (a: (typeof ANNOUNCEMENTS)[number]) => {
      const p = postedParts(a.at);
      return (
        <div key={a.id} className="flex items-stretch gap-3.5">
          {cfg.showDate !== false && (
            <div
              style={{ background: `color-mix(in srgb, ${ink} 12%, transparent)`, color: ink }}
              className="flex w-[54px] flex-shrink-0 flex-col items-center justify-center rounded-lg px-1.5 py-1.5 text-center"
            >
              {p.month && <span className="whitespace-nowrap text-[10px] font-semibold uppercase leading-[13px] tracking-wide opacity-70">{p.month}</span>}
              <span className="whitespace-nowrap text-[18px] font-semibold leading-[22px]">{p.date}</span>
            </div>
          )}
          <div className="flex min-w-0 flex-1 flex-col justify-center">
            <OneLine text={a.title} style={{ color: ink, fontWeight: 600, lineHeight: 1.4 }} className="text-[16px]" />
            <OneLine text={a.desc} style={{ color: sub, lineHeight: 1.5 }} className="mt-1 text-[13px]" />
          </div>
        </div>
      );
    };
    return (
      /* ⚠️ The corner radius is the CARD's own — the SAME value the Style pack's Corner radius writes and
         the card's surface paints (`chosen`, own-only, exactly as `containerCss` reads it) — defaulting to
         0. It used to be a hard-coded `rounded-xl`, so the one card whose face reaches its own edges was
         the one card whose corners the admin could not change: the slider wrote a number the root painted
         over, and there was no way down from the rounding it arrived with.
         ⚠️ `flex-1` with `min-h-0`: `Surface` is a full-height flex column, so the root takes whatever
         height the widget was dragged to and hands it to the PICTURE below — the band keeps its own. */
      <div
        style={{ borderRadius: Number(chosen(styles ?? {}, nodeId, 'radius') ?? 0) || undefined }}
        /* ⚠️ NO negative margin. It existed to escape the 16px padding of the generic white card this
           widget used to sit in — and that card is gone now (it paints its own face), so the same -16px
           pulled the picture and the band OUT of their own node on every side: the selection outline and
           the drag handles sat 16px inside the card you can see, which is the misalignment in the
           screenshot. The parent's padding is dropped instead, so the face fills its node exactly. */
        className="portal-ann-image-root @container flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
      >
        {headerOn && (
          <div className="px-4 pt-4">
            <WidgetTitle nodeId={nodeId} text={cfg.title} icon={headIcon} count={ANNOUNCEMENTS.length} />
          </div>
        )}
        {/* ⚠️ A FLOOR plus `flex-1`, never a fixed height. At rest the column is content-tall and the
            picture is its 200px; dragged taller, the picture takes every pixel the band does not — which is
            what "stretch the image, keep the text band" means. A fixed height left the extra space empty
            UNDER the band, which is the gap in the screenshot. */}
        <div className="portal-ann-image relative min-h-[200px] w-full flex-1 bg-[#E5E7EB]">
          {src
            ? <img src={src} alt="" className="size-full object-cover" />
            : (
              <AnnouncementImageSlot nodeId={nodeId} />
            )}
        </div>
        {/* ⚠️ `@container` on the band: wide, the controls sit beside the notice at the top right; narrow,
            they drop UNDER it at the left edge with a 12px gap, lined up with the date tile. */}
        <div style={{ background: String(cfg.bandColor ?? '#2F3033') }} className="@container px-5 py-4">
          <div className="flex flex-col gap-3 @[520px]:flex-row @[520px]:items-start @[520px]:gap-4">
            <div {...car.bind} className="min-w-0 flex-1">
              <CarouselTrack car={car}>{pages.map((pg, i) => <div key={i}>{pg.map(bandRow)}</div>)}</CarouselTrack>
            </div>
            {pages.length > 1 && (
              <div className="flex-shrink-0"><CarouselNav car={car} count={pages.length} onDark={light} endLabel="View all" /></div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (carousel && !headerOn) {
    /* The STRIP: one announcement, then the controls and the link on the same line, at the right.
       ⚠️ `flex-wrap` so a narrow column drops the controls under the notice instead of squeezing the
       headline to nothing. */
    /* ⚠️ A CONTAINER query, not flex-wrap. Wrapping pushed the controls onto a second line wherever
       they happened to fall — indented, with `ml-auto` still pulling them right — so a narrow card
       showed them floating mid-card. Wide: one line, controls at the right. Narrow: a column, controls
       at the BOTTOM LEFT (`mt-auto`), lined up with the date tile; the row's own 12px bottom padding is
       the gap between the notice and the controls. */
    return (
      <div className="@container flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="flex min-h-0 flex-1 flex-col @[520px]:flex-row @[520px]:items-center @[520px]:gap-6">
          <div {...car.bind} className="min-w-0 @[520px]:flex-1">
            <CarouselTrack car={car}>
              {pages.map((pg, i) => <div key={i}>{pg.map(row)}</div>)}
            </CarouselTrack>
          </div>
          {pages.length > 1 && (
            <div className="mt-auto flex-shrink-0 @[520px]:mt-0">
              <CarouselNav car={car} count={pages.length} endLabel="View all" />
            </div>
          )}
        </div>
      </div>
    );
  }

  if (carousel) {
    /* ⚠️ A flex COLUMN that fills its card, so the controls take `mt-auto` and sit on the card's
       bottom edge — the card is often taller than a page (it stretches to its row). */
    return (
      <div className="@container flex min-h-0 min-w-0 flex-1 flex-col">
        {/* The SAME heading as the regular card — title and count — so switching Display never
            changes what the card is called or how many notices it says it holds. */}
        <WidgetTitle nodeId={nodeId} text={cfg.title} icon={headIcon} count={ANNOUNCEMENTS.length} />
        <div {...car.bind}>
          <CarouselTrack car={car}>
            {pages.map((pg, i) => (
              /* Each page is the regular card's stack — the same rows, the same rules between them. */
              <div key={i} {...stackProps(gap, dividers)}>{pg.map(row)}</div>
            ))}
          </CarouselTrack>
        </div>
        {/* Bottom LEFT of the CARD, and only when there is a second page to go to. */}
        {pages.length > 1 && (
          <div className="mt-auto flex justify-start pt-3">
            <CarouselNav car={car} count={pages.length} />
          </div>
        )}
      </div>
    );
  }

  /* ⚠️ The rule ABOVE the first row belongs to the heading — it is the line UNDER the header, which
     `stackProps` draws as a top border on the stack. With no header inside the card (either because the
     card has none at all, or because its heading has moved out onto the page) it would be a line under
     nothing, one pixel below the card's own top border. The rules BETWEEN rows stay either way. */
  const stack = (
    <div {...stackProps(gap, dividers)} className={headerOn && !titleOutside ? stackProps(gap, dividers).className : (dividers ? '[&>*+*]:border-t [&>*+*]:border-t-[#F0F2F5]' : '')}>{rows.map(row)}</div>
  );
  /* ⚠️ OUTSIDE: this card draws its own heading rather than going through `CardShell`, so it needs its
     own copy of that shape — the heading on the page, and the SAME white card, border and padding around
     the notices. Without it "Above the card" simply took the card away: `Sel` withholds the surface for
     any widget whose title is outside, on the promise that the widget paints it back, and this one never
     had the code to. Same box, same insets and the same Gap as every other card. */
  if (titleOutside) {
    return (
      <div className="@container flex min-w-0 flex-1 flex-col" style={{ gap: Number(cfg.titleGap ?? 12) }}>
        <div className="px-1">
          <WidgetTitle nodeId={nodeId} text={cfg.title} icon={headIcon} count={ANNOUNCEMENTS.length} action={viewAll} flush />
        </div>
        {/* The card's own fill, border, corners and shadow — this box is the card now. `Sel` is told
            to stop painting them (`surfaceOff`), so they land here once and only here. */}
        <div className="min-h-0 min-w-0 flex-1 rounded-xl border border-[#E5E7EB] bg-white px-4 pb-3 pt-3.5" style={containerCss(styles, nodeId)}>{stack}</div>
      </div>
    );
  }
  return (
    <div className="@container min-w-0">
      {headerOn && <WidgetTitle nodeId={nodeId} text={cfg.title} icon={headIcon} count={ANNOUNCEMENTS.length} action={viewAll} />}
      {stack}
    </div>
  );
}


/* ── Custom Card ───────────────────────────────────────────────────────
 *
 * Five shapes of one card. ⚠️ The SLOTS are the same in every shape — heading, subtext, picture, button,
 * links — so changing the layout rearranges what is there rather than asking for it again; a shape that
 * cannot draw a slot simply does not, and the value stays stored for the shape that can. */

/** The picture's empty state — a real drop zone on the canvas, a quiet placeholder in Preview. */
function CardImageSlot({ nodeId }: { nodeId: string }) {
  const { enabled, setCfg } = useCanvas();
  if (!enabled) {
    return <span className="flex size-full items-center justify-center text-[#9CA3AF]"><ImageOff size={22} /></span>;
  }
  return (
    <div className="size-full [&>button]:size-full [&>button]:rounded-none [&>button]:border-0" onClick={(e) => e.stopPropagation()}>
      <ImageUploadZone size="sm" label="Drop an image or browse" suggested="800 × 600" onFile={(src) => setCfg?.(nodeId, { image: src })} />
    </div>
  );
}

export function CustomCardRender({ nodeId, cfg }: { nodeId: string; cfg: Cfg }) {
  const { styles, enabled, select, pickIcon } = useCanvas();
  const layout = String(cfg.layout ?? 'imageRight');
  const links = visible((cfg.links as Item[]) ?? [], enabled);
  const side = layout === 'imageRight' || layout === 'imageLeft';
  /* One number for the space between this card's own parts: its words and its picture, or one link row
     and the next. Halved on a row, because a row's padding meets its neighbour's. */
  const gap = Number(cfg.cardGap ?? 16);

  const heading = cfg.title ? (
    <Sel id={`${nodeId}-title`}>
      <div style={roleStyle(styles, `${nodeId}-title`, 'title')} className="text-[16px] font-semibold text-[#364658]">{String(cfg.title)}</div>
    </Sel>
  ) : null;
  const sub = cfg.sub ? (
    <Sel id={`${nodeId}-sub`}>
      <div style={roleStyle(styles, `${nodeId}-sub`, 'body')} className="mt-1.5 text-[13px] leading-[1.6] text-[#7B8FA5]">{String(cfg.sub)}</div>
    </Sel>
  ) : null;
  /* ⚠️ An empty label draws NOTHING. A button is the one slot most of these cards will not use, and a
     blank one on the canvas is a control the admin has to work out how to remove. */
  const cta = cfg.ctaLabel ? (
    <span
      className="mt-4 inline-flex h-9 flex-shrink-0 items-center self-start px-4 text-[13px] font-medium text-white"
      style={{ background: 'var(--portal-accent, #3D8BD0)', borderRadius: 'var(--portal-btn-radius, 4px)' }}
    >{String(cfg.ctaLabel)}</span>
  ) : null;
  const picture = (
    <div className={`relative overflow-hidden rounded-lg bg-[#E9EDF2] ${side ? 'min-h-[150px] w-full flex-1' : 'h-[170px] w-full'}`}>
      {cfg.image ? <img src={String(cfg.image)} alt="" className="size-full object-cover" /> : <CardImageSlot nodeId={nodeId} />}
    </div>
  );
  /* ⚠️ A rule BETWEEN rows, not around them, and the icon sits in the accent — a link list reads as one
     stack of destinations rather than as a set of boxes. The arrow on the right belongs to the product: it
     is what says the row goes somewhere, and it is true of every link, so it is not a per-row setting.
     ⚠️ Each row's glyph comes from the ITEM (`l.icon`), through the same `iconNode` the whole builder
     draws icons with, so an uploaded SVG works here exactly as it does on an action card. */
  const linkRows = (
    /* ⚠️ The rule is declared on the STACK, not on each row: every row is wrapped in its own `Sel`
       now, so a `first:border-t-0` on the inner span would look at the span's position inside its
       wrapper — where every one of them is the first child — and no rule would ever draw. */
    <div className="flex min-w-0 flex-col [&>*+*]:border-t [&>*+*]:border-t-[#E5E7EB]" style={{ marginTop: gap }}>
      {links.length === 0 && enabled && <span className="py-2 text-[13px] text-[#9CA3AF]">No links yet — add one in the panel.</span>}
      {links.map((l, i) => {
        /* ⚠️ `String(l.id ?? i)` — the same key every other collection uses. Seeded items carry no id,
           so the INDEX is the identity, and on the canvas `visible()` keeps every item (hidden ones
           included) so that index is the stored one. */
        const key = String(l.id ?? i);
        const inode = itemNodeId(nodeId, key);
        /* So the drawer is headed by the link rather than by the word "Item" — the panel list
           registers these names, and a link selected on the CANVAS never went through it. */
        registerItemName(inode, String(l.label ?? '') || `Link ${i + 1}`);
        /* ⚠️ The Icon group (P6) writes to the LINK's own node, so every one of these is read per
           item: one link can carry a bigger, red, circled glyph while the one under it does not.
           Own-only (`chosen`), because a link's icon is about that link — resolving up the chain
           would have a value set on the card silently restyle every row that had never been touched. */
        const isize = Number(chosen(styles, inode, 'iconSize') ?? 18);
        const icolor = String(chosen(styles, inode, 'iconColor') ?? '') || 'var(--portal-accent, #3D8BD0)';
        const ishape = String(chosen(styles, inode, 'iconShape') ?? 'none');
        const ifill = String(chosen(styles, inode, 'iconFill') ?? '') || 'rgba(61,139,208,0.10)';
        const ipos = String(chosen(styles, inode, 'iconPos') ?? 'left');
        /* An EMPTY slot on the canvas, so a link with no icon yet still has something to click.
           In Preview it draws nothing — a requester must not see a gap where an unset icon would be. */
        const glyph = l.icon ? iconNode(l.icon as IconChoice, isize) : null;
        return (
          <Sel key={key} id={inode}>
            <span
              /* ⚠️ `iconPos` is honoured on all three of its values, not just the two that suit a
                 row. A control offering Top and then laying out Left is worse than one that does
                 something surprising: the surprise can be undone by looking.
                 ⚠️ ORDER, not `flex-row-reverse`. Reversing the row carried the ARROW with it and
                 put the product's "this goes somewhere" glyph on the LEFT — icon-right is a choice
                 about the icon, not permission to rearrange the row. With explicit orders the arrow
                 is last whatever the icon does. And TOP is a wrap, not a column: `basis-full` gives
                 the glyph its own line and lets the label and the arrow stay on one line under it,
                 where a column would have stranded the arrow on a third line of its own. */
              className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5 text-[14px] text-[#364658]"
              style={{ paddingTop: gap / 2, paddingBottom: gap / 2 }}
            >
              {(glyph || enabled) ? (
                <span
                  onClick={enabled ? (ev) => {
                    ev.stopPropagation();
                    /* The picker is told the ICON's node (that is where the glyph is stored); the
                       SELECTION lands on the link, which is the thing you clicked. */
                    select(inode);
                    pickIcon(subNodeId(inode, 'icon'), (ev.currentTarget as HTMLElement).getBoundingClientRect());
                  } : undefined}
                  className={`flex flex-shrink-0 items-center justify-center${ipos === 'top' ? ' basis-full' : ''}${enabled ? ' cursor-pointer hover:outline hover:outline-1 hover:outline-offset-2 hover:outline-[#3D8BD0]' : ''}`}
                  style={{
                    order: ipos === 'right' ? 2 : 0,
                    color: icolor,
                    /* A container only when one was asked for — the resting link is a bare glyph. */
                    ...(ishape === 'none'
                      ? { width: isize, height: isize }
                      : { background: ifill, borderRadius: ishape === 'circle' ? 9999 : 6, padding: Math.round(isize / 3) }),
                  }}
                  title={enabled ? 'Change icon' : undefined}
                >
                  {glyph ?? <span className="block rounded-sm border border-dashed border-[#C3CDD9]" style={{ width: isize - 4, height: isize - 4 }} />}
                </span>
              ) : null}
              {/* The words are the item's — typed here, stored on the link, the same edit the panel makes. */}
              <Sel id={subNodeId(inode, 'label')} className="min-w-0 flex-1" style={{ order: 1 }}>
                <span className="block truncate">{String(l.label ?? '')}</span>
              </Sel>
              {/* The product's, on every row: it is what says the row goes somewhere — so it is
                  ordered LAST and stays there whichever side the admin puts their own icon on. */}
              <ArrowUpRight size={16} className="flex-shrink-0" style={{ order: 3, color: 'var(--portal-accent, #3D8BD0)' }} />
            </span>
          </Sel>
        );
      })}
    </div>
  );

  const words = (
    <div className="flex min-w-0 flex-col">
      {heading}
      {sub}
      {cta}
    </div>
  );

  if (layout === 'links') {
    return <div className="@container flex min-w-0 flex-col">{heading}{sub}{linkRows}</div>;
  }
  if (layout === 'text') {
    return <div className="@container flex min-w-0 flex-col">{words}</div>;
  }
  if (layout === 'imageTop') {
    return (
      <div className="@container flex min-w-0 flex-col" style={{ gap }}>
        {picture}
        {words}
      </div>
    );
  }
  /* Side by side, and it STACKS on a narrow card — a picture and a paragraph in half a column each is
     two things too narrow to read. The query is the CARD's own width, not the window's.
     ⚠️ The container and the query are on DIFFERENT elements: an element cannot answer a container query
     it declares itself, so with both on one div the row never fired and every image card came out
     stacked however wide it was. */
  return (
    <div className="@container min-w-0">
      <div className={`flex min-w-0 flex-col @[420px]:flex-row @[420px]:items-center ${layout === 'imageLeft' ? '@[420px]:flex-row-reverse' : ''}`} style={{ gap }}>
        <div className="flex min-w-0 flex-1 flex-col">{words}</div>
        <div className="flex min-w-0 flex-1 flex-col">{picture}</div>
      </div>
    </div>
  );
}

/* ── §7.8 Featured Services ───────────────────────────────────────── */

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

/* Tile content alignment from the toolbar — undefined keys leave the template's own arrangement. */
const tileAlign = (s: { align?: string; alignY?: string } | undefined, stacked: boolean): React.CSSProperties => {
  if (!s || (s.align === undefined && s.alignY === undefined)) return {};
  const h = s.align === 'left' ? 'flex-start' : s.align === 'right' ? 'flex-end' : s.align === 'stretch' ? 'stretch' : 'center';
  const v = s.alignY === 'center' ? 'center' : s.alignY === 'end' ? 'flex-end' : 'flex-start';
  const css: React.CSSProperties = stacked
    ? { alignItems: s.align !== undefined ? h : undefined, justifyContent: s.alignY !== undefined ? v : undefined }
    : { justifyContent: s.align !== undefined ? h : undefined, alignItems: s.alignY !== undefined ? v : undefined };
  if (s.align !== undefined) css.textAlign = s.align === 'right' ? 'right' : s.align === 'left' || s.align === 'stretch' ? 'left' : 'center';
  return css;
};

function ServiceTiles({ nodeId, items, showDesc, tpl = 'top', cols, chips, look, gap }: {
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
  /* ⚠️ The card's TREATMENT, kept separate from `tpl`, which is its ARRANGEMENT. 'action' paints
     the tile the way this product's four action cards are painted — accent badge, and the category
     as an uppercase label rather than a sentence — because at two columns a service tile is the
     same object as an action card and a second treatment for it would make one row look like two.
     Opt-in: the grey badge stays the default, so no other template's tiles move. */
  look?: string;
  /* The gap between the tiles, in px — the band's own `colGap` / `rowGap`. ⚠️ It used to be a hard
     `gap-3`, which is why the two service rows were the only bands whose spacing could not be changed
     from either the panel or the canvas. */
  gap?: { x: number; y: number };
}) {
  const { styles } = useCanvas();
  const top = tpl === 'top';
  const noIcon = tpl === 'none';
  const action = look === 'action';
  /* ⚠️ `roleStyle` emits `fontWeight` UNCONDITIONALLY — unlike `fontSize`, `color` and
     `textAlign` beside it, each of which is gated on a human having chosen it. So an inline
     `fontWeight: 400` (the body role's theme value) lands on the element and beats its own
     `font-semibold` class, and the name rendered regular however it was written. Measured: 400.
     ⚠️ Repaired HERE rather than in `roleStyle`, deliberately. The general fix is right and the
     resolver's own comments argue for it three times — but the title role's theme weight is
     `bold`, so gating it would drop every heading in every portal from 700 to the 600 its class
     asks for. That is a page-wide change nobody asked for, on every template.
     ⚠️ Only while the weight is still the THEME's: the moment an admin picks one, theirs wins. */
  const themeWeight = resolveType(styles, nodeId, 'body', 'weight').source === 'theme';
  const nameWeight = action && themeWeight ? { fontWeight: 600 } : null;
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
      className="grid min-w-0"
      data-gap-parent={nodeId}
      style={{
        columnGap: gap?.x ?? 12,
        rowGap: gap?.y ?? gap?.x ?? 12,
        gridTemplateColumns: `repeat(${Math.max(1, cols ?? Math.min(items.length, MAX_SERVICE_TILES))}, minmax(0,1fr))`,
      }}
    >
      {items.slice(0, MAX_SERVICE_TILES).map((s, i, arr) => (
        /* One node for every tile in the row — selecting a service card styles all of them. */
        <Sel
          key={s.id}
          id={`${nodeId}-tile`}
          /* A lone last tile spans the row — what the Three-across preset tile draws. */
          style={{ ...((cols ?? 0) > 1 && i === arr.length - 1 && arr.length % (cols ?? 1) === 1 ? { gridColumn: '1 / -1' } : {}), ...tileAlign(styles[nodeId + '-tile'], top) }}
          className={`flex min-w-0 rounded-lg border border-[#E5E7EB] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)] ${
            action ? 'gap-3 px-3.5 py-3' : 'gap-2 px-3 py-4'
          } ${
            top ? 'flex-col items-center text-center' : tpl === 'right' ? 'flex-row-reverse items-center' : 'items-center'
          }`}
          /* ⚠️ The toolbar's H/V alignment, applied INSIDE every tile (all tiles are one node). Stacked, H
             moves the icon and words across and V moves them down the tile; side by side the two swap. */

        >
          {/* ⚠️ 'Text only' hides the badge, exactly as it does on an action card — where the icon
              sits and whether there IS one are one question with four answers, which is why they
              share a control rather than needing a separate switch. */}
          {!noIcon && (
            <span style={iconBoxCss(styles, `${nodeId}-tile`)} className={`flex size-9 flex-shrink-0 items-center justify-center rounded-lg ${
              action ? 'bg-[#EAF3FB] text-[#2F6FB5]' : 'bg-[#F1F5F9] text-[#475467]'
            }`}>
              <ShoppingCart size={18} strokeWidth={1.7} />
            </span>
          )}
          <span className={`min-w-0 ${top ? '' : 'flex-1'}`}>
            <span style={{ ...roleStyle(styles, nodeId, 'body'), ...nameWeight }} className={`block truncate ${
              action ? 'text-[13.5px] text-[#1E293B]' : 'text-[13px] font-medium text-[#364658]'
            }`}>{s.name}</span>
            {showDesc && (
              /* ⚠️ UPPERCASE and tracked in the action look — the second line stops being a
                 description of the service and becomes a LABEL for which catalogue it came from,
                 which is what a one-word value like "Hardware" or "Software" actually is. */
              <span style={roleStyle(styles, nodeId, 'meta')} className={`block truncate ${
                action
                  ? 'mt-1 text-[11px] font-medium uppercase tracking-[0.06em] text-[#98A6B6]'
                  : 'mt-0.5 text-[12px] text-[#7B8FA5]'
              }`}>{s.desc}</span>
            )}
          </span>
        </Sel>
      ))}
    </div>
  );
}

/** §7.8's sibling — the requester's own pinned services. Same tile, different list. */
export function FavouriteServicesRender({ nodeId, cfg }: { nodeId: string; cfg: Cfg }) {
  const { styles } = useCanvas();
  /* ⚠️ These two rows are the ONLY ones whose heading has always been on the page rather than in a card,
     which is exactly the difference the Title control now lets an admin settle either way — so their
     default is `outside` (today's look) where every other card defaults to `inside`. */
  const inside = String(cfg.titlePlace ?? 'outside') === 'inside';
  return (
    <div className={`@container min-w-0${inside ? ' rounded-xl border border-[#E5E7EB] bg-white p-4' : ''}`}>
      <WidgetTitle nodeId={nodeId} text={cfg.title ?? 'Favourite Services'} />
      <ServiceTiles nodeId={nodeId} items={FAVOURITE_SERVICES} showDesc={cfg.showDesc !== false} tpl={String(cfg.cardTemplate ?? 'top')} cols={Number(chosen(styles, nodeId, 'columns') ?? cfg.columns) || undefined} chips={cfg.tileLook === 'chips'} look={String(cfg.tileLook ?? '')} gap={{ x: Number(cfg.colGap ?? 12), y: Number(cfg.rowGap ?? cfg.colGap ?? 12) }} />
    </div>
  );
}

export function FeaturedServicesRender({ nodeId, cfg }: { nodeId: string; cfg: Cfg }) {
  const { styles } = useCanvas();
  const items = FEATURED_SERVICES.slice(0, Number(cfg.show ?? 6));
  /* Columns lives in the STYLE store, because the Content tab and the Arrangement pack are two
     controls for one value (§7.8) — read it back from the same place both of them write. */
  /* ⚠️ No fallback of 3. With nothing chosen the grid gives each service its own column — the same
     default Favourite Services uses — because four services in three columns left the fourth alone
     on a second row, directly under a Favourite row that reads as one clean line. */
  const cols = Number(chosen(styles, nodeId, 'columns') ?? cfg.columns) || undefined;
  /* ⚠️ One value decides icon position AND whether there is an icon — 'none' is the Text-only tile.
     The old `showIcon` toggle is gone with the Icon group it belonged to; two controls answering
     one question is how a card ends up with a position set for an icon it does not have. */
  const tpl = String(cfg.cardTemplate ?? 'left');

  const inside = String(cfg.titlePlace ?? 'outside') === 'inside';
  return (
    <div className={`@container min-w-0${inside ? ' rounded-xl border border-[#E5E7EB] bg-white p-4' : ''}`}>
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
        {/* ⚠️ Ungated until now — the browse link was typeable on both service rows while the
            heading beside it was not, so one row had two rules for its two pieces of text. */}
        {cfg.showBrowse !== false && (
          hasFixedViewAll(nodeId) ? (
            <span style={roleStyle(styles, nodeId, 'link')} className="flex-shrink-0 text-[12px] font-medium text-[#3D8BD0]">
              {String(cfg.browseLabel ?? 'Browse catalog')}
            </span>
          ) : (
            <Sel id={`${nodeId}-viewall`} className="flex-shrink-0">
              <span style={roleStyle(styles, nodeId, 'link')} className="text-[12px] font-medium text-[#3D8BD0]">
                {String(cfg.browseLabel ?? 'Browse catalog')}
              </span>
            </Sel>
          )
        )}
      </div>
      {/* ⚠️ The SAME tiles as Favourite Services. These two sit on one page and list the same kind
          of thing, so two grid languages would be a difference that means nothing. */}
      <ServiceTiles nodeId={nodeId} items={FEATURED_SERVICES} showDesc={cfg.showDesc !== false} tpl={String(cfg.cardTemplate ?? 'top')} cols={cols} chips={cfg.tileLook === 'chips'} look={String(cfg.tileLook ?? '')} gap={{ x: Number(cfg.colGap ?? 12), y: Number(cfg.rowGap ?? cfg.colGap ?? 12) }} />
    </div>
  );
}

/* ── the six new-element panels (NEW-ELEMENT-PANELS-SPEC §3, step 4) ─────── */

/** §3.6 — a rule, optionally with a label sitting on it. */
export function DividerRender({ nodeId, cfg }: { nodeId: string; cfg: Cfg }) {
  const { styles } = useCanvas();
  /* ⚠️ Drawn with `LineMark`, NOT with `borderTopStyle`. The panel's picker offers six styles —
     solid, dashed, dotted, zigzag, wavy, gradient — and the last three are not CSS border keywords,
     so assigning them to `borderTopStyle` made the browser drop the declaration and the divider
     rendered as nothing at all. Three of the six swatches were a promise the canvas could not keep.
     `LineMark` is the same component the picker draws its swatches with, so what you pick and what
     you get are now one implementation rather than two that agree on half their values. */
  const vertical = cfg.orientation === 'vertical';
  const rule = (
    <LineMark
      style={(cfg.lineStyle as LineStyle) ?? 'solid'}
      color={String(cfg.lineColor ?? '#E5E7EB')}
      thickness={Number(cfg.thickness ?? 1)}
      vertical={vertical}
    />
  );

  /* ⚠️ A vertical rule needs a height from somewhere, and a column that has not been given one is
     zero tall — so `100%` alone renders nothing at all on arrival. `minHeight` is the floor that
     makes it visible the moment it lands; where it sits beside real content the `100%` takes over
     and it matches its neighbour. Centred horizontally because a rule between two columns belongs
     in the gap, not against one edge. */
  if (vertical) {
    return (
      <div className="flex h-full justify-center" style={{ minHeight: 120 }}>{rule}</div>
    );
  }
  const label = String(cfg.label ?? '');
  const width = `${Number(cfg.width ?? 100)}%`;
  const justify = cfg.align === 'center' ? 'center' : cfg.align === 'right' ? 'flex-end' : 'flex-start';
  const box = {
    width,
    marginLeft: justify === 'flex-start' ? 0 : 'auto',
    marginRight: justify === 'flex-end' ? 0 : 'auto',
  };

  if (!label) return <div style={box}>{rule}</div>;

  /* A label splits the rule into two segments — each one a LineMark of its own, so a zigzag with a
     label is a zigzag either side of the words rather than a zigzag and a plain rule. */
  const pos = String(cfg.labelPos ?? 'center');
  return (
    <div style={box} className="flex items-center gap-3">
      {pos !== 'left' && <span className="min-w-0 flex-1">{rule}</span>}
      <span style={roleStyle(styles, nodeId, 'meta')} className="flex-shrink-0 text-[12px] text-[#7B8FA5]">{label}</span>
      {pos !== 'right' && <span className="min-w-0 flex-1">{rule}</span>}
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
function LiveCard({ nodeId, cfg, title, count, rows, icon }: {
  nodeId: string; cfg: Cfg; title: string; count: number; rows: ReactNode;
  /* A badge before the title — the same tinted badge every card head uses. Absent unless passed. */
  icon?: ReactNode;
}) {
  const { styles } = useCanvas();
  const plain = cfg.countStyle === 'plain';
  /* ⚠️ This card draws its own heading rather than going through `CardShell`, so it needs its own copy
     of the Title-placement shape — the same reason the announcement card has one. Without it "Above
     the card" took the surface off (`Sel` withholds it on the promise the widget paints it back) and
     put nothing in its place. */
  const outside = String(cfg.titlePlace ?? 'inside') === 'outside';
  const head = (
      <div className={outside ? 'flex items-center gap-2 px-1' : 'flex items-center gap-2 pb-2.5'}>
        {icon && (
          <span className="flex size-7 flex-shrink-0 items-center justify-center rounded-md bg-[#EAF3FB] text-[#2F6FB5] [&_svg]:size-4">{icon}</span>
        )}
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
            {/* Same rule as CardShell's copy of this link — see `hasFixedViewAll`. */}
            {hasFixedViewAll(nodeId) ? (
              <span className="hidden px-0.5 text-[12px] font-medium @min-[240px]:inline-block">{String(cfg.viewAllLabel ?? 'View all')}</span>
            ) : (
              <Sel id={`${nodeId}-viewall`} className="hidden px-0.5 @min-[240px]:inline-block">
                <span className="text-[12px] font-medium">{String(cfg.viewAllLabel ?? 'View all')}</span>
              </Sel>
            )}
            <ChevronsRight size={16} />
          </span>
        )}
      </div>
  );
  if (outside) {
    return (
      <div className="@container flex min-w-0 flex-1 flex-col" style={{ gap: Number(cfg.titleGap ?? 12) }}>
        {head}
        {/* The same box and the same insets as `CardShell`'s: the card keeps the padding it had with its
            heading inside it, and any rule a row stack draws under a header goes with the header. */}
        <div className="min-h-0 min-w-0 flex-1 rounded-xl border border-[#E5E7EB] bg-white px-4 pb-3 pt-3.5 [&>:first-child]:border-t-0">{rows}</div>
      </div>
    );
  }
  return (
    <div className="@container flex min-w-0 flex-col">
      {head}
      <div className="min-h-0 min-w-0 flex-1">{rows}</div>
    </div>
  );
}

/* ⚠️ Every row is `min-w-0` with a truncating subject and non-shrinking chips. Narrowed, a row
   whose longest unbreakable word set a min-content floor pushed the whole card wider than the
   column it was in — so the card stopped obeying the width its section asked for. */
/* ⚠️ `-mx-4` out and `px-4` back, the same treatment `ListBody` gives every card the page
   draws: the rule runs the CARD's full width while the words keep their inset. Inside the padding
   it stopped 16px short at both ends, so a list read as a stack of separate blocks rather than as
   one list — and it read differently from every built-in card beside it. */
const liveRow = '-mx-4 border-t border-[#F0F2F5] px-4 py-2.5 first:border-t-0';
const livePill = 'max-w-full flex-shrink truncate whitespace-nowrap rounded-sm bg-[#F1F5F9] px-1.5 py-0.5 text-[12px] font-medium text-[#475467]';

/* ⚠️ THE FIVE LIVE CARDS ARE DRAWN BY THE PAGE, not here — see `PlacedBlockRenderers` in
 * `SupportPortalPreview`, which hands `PortalPlacedElement` a renderer for c-requests,
 * c-approvals, c-knowledge, c-assets and c-cis.
 *
 * There used to be a second, simpler implementation of each in this file, and it is what a
 * from-scratch page got. The two drifted exactly as far as you would expect: My Assets came out as
 * a list of grey pills where the real card is a 2x2 tile grid, Pending Approvals lost its id pill,
 * its three actions and its requester line, Most Read lost its category tags, every divider stopped
 * 16px short of the card's edges instead of running its full width, and each badge counted the rows
 * on screen rather than the records behind them. The same widget rendered differently depending on
 * which page it was on, which means it was not the same widget.
 *
 * ⚠️ Do NOT add a copy back here. A placed card resolves to the SAME widget spec as the page's own
 * block (`WIDGET_FOR_TYPE` and `WIDGET_FOR_NODE` both point at 'my_requests' and friends), so it
 * already arrives with the same defaults; what it needed was the same renderer, and it has one. */

/* A Record List: the live card, with the query left to the admin.
 *
 * ⚠️ The rows are the module's DUMMY data and the filter runs over them, so the card behaves here
 * exactly as it will on the portal — narrow the statuses and rows drop out, narrow too far and you
 * get the empty state. A card that ignored its own filters on the canvas would teach the admin that
 * the controls do nothing, which is the one thing a builder must never do.
 * ⚠️ The empty state is the SAME one My CIs draws, not a copy — asked for by name, and the state a
 * requester genuinely lands on when their filter matches nothing. */
function RecordListRender({ nodeId, cfg, glyph }: { nodeId: string; cfg: Cfg; glyph?: ReactNode }) {
  const { styles } = useCanvas();
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
    /* ⚠️ NO ICON — a KPI is its number and what the number counts. The layout comes from Card
       templates (stacked, stacked centred, side by side) and the toolbar's H/V alignment places the
       pair inside the card; an explicit alignment wins over the template's own. */
    const layout = String(cfg.kpiLayout ?? 'stack');
    const own = styles[nodeId] ?? {};
    const h = String(own.align ?? (layout === 'centred' ? 'center' : 'left'));
    const v = String(own.alignY ?? 'start');
    const inline = layout === 'inline';
    const hFlex = h === 'center' ? 'center' : h === 'right' ? 'flex-end' : 'flex-start';
    const vFlex = v === 'center' ? 'center' : v === 'end' ? 'flex-end' : 'flex-start';
    return (
      <div
        className={`flex h-full min-w-0 ${inline ? 'flex-row gap-2.5' : 'flex-col gap-1.5'}`}
        style={inline
          ? { justifyContent: hFlex, alignItems: v === 'center' ? 'center' : v === 'end' ? 'flex-end' : 'baseline', alignContent: vFlex }
          : { alignItems: hFlex, justifyContent: vFlex, textAlign: h === 'center' ? 'center' : h === 'right' ? 'right' : 'left' }}
      >
        <span className="block text-[30px] font-semibold leading-none text-[#364658]">{matching.length}</span>
        <span className="block min-w-0 truncate text-[13px] text-[#7B8FA5]">{String(cfg.title ?? mod.label)}</span>
      </div>
    );
  }
  return (
    <LiveCard nodeId={nodeId} cfg={cfg} title={mod.label} count={rows.length} icon={glyph} rows={
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

export const COLLECTION_RENDERERS: Record<string, (p: { nodeId: string; cfg: Cfg; glyph?: ReactNode }) => ReactNode> = {
  'c-records': RecordListRender,
  'x-card': CustomCardRender,
  /* c-requests / c-approvals / c-knowledge / c-assets / c-cis are drawn by the PAGE — see the
     note where their renderers used to be. */
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

/* The announcement picture's EMPTY state: a real drop-or-browse slot, not a note sending you to the panel.
   ⚠️ `relative z-20` — the card lays a click-catcher over itself on the canvas (z-10) so a click selects
   the card; the slot has to sit above it or the upload could never be reached. */
function AnnouncementImageSlot({ nodeId }: { nodeId: string }) {
  const { enabled, setCfg } = useCanvas();
  if (!enabled) {
    return (
      <span className="flex size-full flex-col items-center justify-center gap-1.5 text-[12px] text-[#7B8FA5]">
        <ImageOff size={20} />No image yet
      </span>
    );
  }
  /* ⚠️ FLUSH — no padding around it and no rounding of its own. The picture on this card reaches the
     card's own edges, so its empty state has to as well: inset by 16px inside a rounded dashed box it drew
     a frame the real photograph will not have, and those rounded corners read as "the image has a radius"
     on a card whose radius is zero. With the zone square, the ROOT's radius is the only one in the card,
     which is what makes the card's own Corner radius the single control over every corner in it. */
  return (
    <div className="relative z-20 size-full [&>button]:size-full [&>button]:rounded-none [&>button]:border-0" onClick={(e) => e.stopPropagation()}>
      <ImageUploadZone size="md" label="Drop an image or browse" suggested="1200 × 400" onFile={(src) => setCfg?.(nodeId, { coverImage: src })} />
    </div>
  );
}
