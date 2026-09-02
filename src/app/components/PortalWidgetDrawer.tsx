/* Support Portal builder — the drawer shell (spec §2), and the renderer for any widget spec.
 *
 * One shell, every layer. Header → breadcrumb → title → Content/Styling tabs → collapsible groups →
 * an optional sticky footer for layers whose job is adding children. A widget is DATA (see
 * portalWidgetSpec.ts); this file is the only thing that knows how to draw one.
 *
 * The rules that make it trustworthy, all from §2.2 and §8.4:
 *   • A field that does not apply is REMOVED, not disabled — absent and disabled mean different
 *     things and must look different.
 *   • A GROUP with no visible fields is not rendered at all, never rendered empty.
 *   • Every change applies to the canvas immediately. There is no Save in here; publishing is a
 *     page-level action.
 */

import { useEffect, Fragment, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import {
  ChevronLeft, ChevronRight, Copy, EyeOff, Layers, List, MoreVertical, PanelLeft, RotateCcw,
  Info, Link2, Rows3, Search as SearchIcon, Square, Table as TableIcon, Trash2, Type as TypeIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  REQUEST_STATUSES, itemNodeId, nodeById, nodePath, parseItemId, registerItemName, subNodeId,
} from './portalPageModel';
import type { NodeStyle, PortalStyles } from './portalPageModel';
import { PAGE_ID, hasOwn, portalColorMode, resolve } from './portalStyleResolver';
import { ContrastMeter, useBackdrop } from './PortalContrastMeter';
import type { BackdropSpec } from './PortalContrastMeter';
import { ALL_PACKS, packBadge } from './PortalStylePacks';
import {
  ALIGN_OPTIONS, Badge, ChipEditor, Chips, Field, GridPicker, Group, Note, NumberField, RichText,
  SelectField, Segmented, SliderRow, TextField, ToggleRow, UploadZone, VideoSource,
  MultiSelect,
} from './PortalControls';
import { PortalItemList } from './PortalItemList';
import { RecordFilterField } from './PortalRecordFilter';
import type { RecordFilter } from './portalRecordFilters';
import { recordModule } from './supportPortalData';
import { TemplatePicker } from './PortalSectionControls';
import { ACROSS_ROW, ACROSS_STACK, DOWN_ROW, DOWN_STACK, SectionPresets } from './PortalSectionLayout';
import type { PresetId } from './PortalSectionLayout';
import { BorderRow, RadiusRow, ShadowBlock, SizeRow } from './PortalBoxControls';
import { PortalTableContent } from './PortalTableContent';
import { LineStylePicker } from './PortalLineStyles';
import { IconFramePicker } from './PortalIconFrame';
import type { IconFrame } from './PortalIconFrame';
import type { LineStyle } from './PortalLineStyles';
import { SpacingMatrix } from './SpacingMatrix';
import { PortalBannerPicker } from './PortalBannerPicker';
import { ColorField } from './PortalColorPicker';
import { IconField } from './PortalIconPicker';
import type { IconChoice } from './PortalIconPicker';
import { GATE_COPY, gateOpen, specById } from './portalWidgetSpec';
import type { Cfg, WidgetField, WidgetSpec } from './portalWidgetSpec';
import { applyGrid, columnCount, gridOf, resizeTable, tableFrom } from './portalTableModel';
import { TableGridPicker } from './PortalTable';

/* Which groups are open is remembered per widget TYPE for the session: someone styling five cards
   in a row should not have to re-open the same drawer each time. Module-level on purpose — it is
   session state about a KIND of thing, not about one node. */
const GROUP_MEMORY: Record<string, string[]> = {};

/* Which banner slot has its gallery open, and how to fall back to the file picker from inside it. */
type BannerPick = { anchor: DOMRect; chooseFile: () => void; key: string } | null;

/* §7.19 — one item per file, appended in selection order. Adding 12 photos one at a time is not a
   workflow anybody completes. */
function BulkAdd({ onFiles }: { onFiles: (srcs: string[]) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <button
        onClick={() => ref.current?.click()}
        className="mt-1.5 w-full text-[12px] font-medium text-[#3D8BD0] hover:underline"
      >or add several files at once</button>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          const files = [...(e.target.files ?? [])];
          if (!files.length) return;
          Promise.all(files.map((f) => new Promise<string>((res) => {
            const fr = new FileReader();
            fr.onload = () => res(String(fr.result));
            fr.readAsDataURL(f);
          }))).then(onFiles);
        }}
      />
    </>
  );
}

/* ── Alignment, as joined icon buttons ────────────────────────────────────────
 *
 * One bordered group with shared edges — not five separate buttons, because it is one question with
 * one answer. Icon-only: the glyph shows where the content lands, which the words "Left / Centre"
 * describe more slowly. `stretch` and `justify` share a glyph family with the three placements so
 * the row still reads as one set. */
/* ⚠️ BOX-alignment glyphs, not text-align glyphs. `AlignLeft`/`AlignCenter` draw ragged lines of
   type, which say "how the words are set" — but almost every alignment row in this builder positions
   a BLOCK inside its container. A rule with bars against it reads as "put the thing here", which is
   the actual question, and the four of them read as one family. */
/* ⚠️ AXIS matters as much as the value. Both alignment rows offer start / center / end, so drawn
   from the value alone the two rows came out IDENTICAL — the same three horizontal glyphs stacked
   above each other, one row claiming to place things sideways and the other vertically. Rotating
   the same family a quarter turn keeps them one set while making the second row say "up and down",
   which is the only thing that ever distinguished the two questions. */
const AlignGlyph = ({ kind, axis = 'x' }: {
  kind: 'start' | 'center' | 'end' | 'stretch' | 'between' | 'around'; axis?: 'x' | 'y';
}) => {
  const rule = '#64748B';
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden style={axis === 'y' ? { transform: 'rotate(90deg)' } : undefined}>
      {kind === 'start' && (
        <>
          <path d="M2 2v12" stroke={rule} strokeWidth="1.6" strokeLinecap="round" />
          <rect x="4.5" y="4" width="8" height="2.6" rx="1" fill={rule} />
          <rect x="4.5" y="9.4" width="5" height="2.6" rx="1" fill={rule} />
        </>
      )}
      {kind === 'center' && (
        <>
          <path d="M8 1.5v13" stroke={rule} strokeWidth="1.6" strokeLinecap="round" />
          <rect x="2.5" y="4" width="11" height="2.6" rx="1" fill={rule} />
          <rect x="4.5" y="9.4" width="7" height="2.6" rx="1" fill={rule} />
        </>
      )}
      {kind === 'end' && (
        <>
          <path d="M14 2v12" stroke={rule} strokeWidth="1.6" strokeLinecap="round" />
          <rect x="3.5" y="4" width="8" height="2.6" rx="1" fill={rule} />
          <rect x="6.5" y="9.4" width="5" height="2.6" rx="1" fill={rule} />
        </>
      )}
      {kind === 'between' && (
        <>
          <path d="M2 2v12M14 2v12" stroke={rule} strokeWidth="1.6" strokeLinecap="round" />
          <rect x="4" y="4" width="2.6" height="8" rx="1" fill={rule} />
          <rect x="9.4" y="4" width="2.6" height="8" rx="1" fill={rule} />
        </>
      )}
      {kind === 'around' && (
        <>
          <path d="M2 2v12M14 2v12" stroke={rule} strokeWidth="1.6" strokeLinecap="round" />
          <rect x="5.2" y="4" width="2.6" height="8" rx="1" fill={rule} />
          <rect x="8.2" y="4" width="2.6" height="8" rx="1" fill={rule} />
        </>
      )}
      {kind === 'stretch' && (
        <>
          <path d="M2 2v12M14 2v12" stroke={rule} strokeWidth="1.6" strokeLinecap="round" />
          <rect x="4.5" y="4" width="7" height="2.6" rx="1" fill={rule} />
          <rect x="4.5" y="9.4" width="7" height="2.6" rx="1" fill={rule} />
        </>
      )}
    </svg>
  );
};

const ALIGN_KIND: Record<string, 'start' | 'center' | 'end' | 'stretch' | 'between' | 'around'> = {
  left: 'start', start: 'start', center: 'center', right: 'end', end: 'end',
  justify: 'stretch', between: 'between', around: 'around', stretch: 'stretch',
};
const ALIGN_ICON: Record<string, ReactNode> = {
  left: <AlignGlyph kind="start" />,
  start: <AlignGlyph kind="start" />,
  center: <AlignGlyph kind="center" />,
  right: <AlignGlyph kind="end" />,
  end: <AlignGlyph kind="end" />,
  justify: <AlignGlyph kind="stretch" />,
  between: <AlignGlyph kind="between" />,
  around: <AlignGlyph kind="around" />,
  stretch: <AlignGlyph kind="stretch" />,
};

function AlignRow({ value, options, onChange, axis = 'x' }: {
  value: string; options: { value: string; label: string }[]; onChange: (v: string) => void; axis?: 'x' | 'y';
}) {
  return (
    <div className="inline-flex overflow-hidden rounded border border-[#DFE5ED]">
      {options.map((o, i) => {
        const on = value === o.value;
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            title={o.label}
            className={`flex h-8 w-9 items-center justify-center transition-colors ${
              i > 0 ? 'border-l border-[#DFE5ED]' : ''
            } ${on ? 'bg-[#EBF5FF] text-[#3D8BD0]' : 'bg-white text-[#64748B] hover:bg-[#F5F7FA]'}`}
          ><AlignGlyph kind={ALIGN_KIND[o.value] ?? 'start'} axis={axis} /></button>
        );
      })}
    </div>
  );
}

/* The Table's content CTA. The sheet is a MODAL rather than an inline grid: a spreadsheet inside a
   340px panel is a spreadsheet nobody can read, and content this shape deserves the room. */
function TableContentField({ rows, onChange }: { rows: string[][]; onChange: (g: string[][]) => void }) {
  const [open, setOpen] = useState(false);
  const filled = rows.filter((r) => r.some((c) => String(c ?? '').trim())).length;
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex h-9 w-full items-center justify-between rounded border border-[#d1d5db] bg-white px-3 text-left text-[13px] text-[#364658] transition-colors hover:border-[#3D8BD0]"
      >
        <span>Manage table content</span>
        <span className="text-[12px] text-[#9CA3AF]">{filled ? `${filled} rows` : 'Empty'}</span>
      </button>
      {open && <PortalTableContent value={rows} onApply={onChange} onClose={() => setOpen(false)} />}
    </>
  );
}

/** 9-point placement (§7.20 Banner content, §7.18 slide content). */
const NINE = ['top left', 'top', 'top right', 'left', 'center', 'right', 'bottom left', 'bottom', 'bottom right'];

/* A collection group that can render WITHOUT its accordion. A panel whose entire content is one
   list should show the list — the header and chevron above it only offered to hide everything the
   panel had. */
function FlatOrGroup({ flat, title, open, onToggle, badge, children }: {
  flat?: boolean; title: string; open: boolean; onToggle: () => void; badge?: ReactNode; children: ReactNode;
}) {
  if (!flat) return <Group title={title} open={open} onToggle={onToggle} badge={badge}>{children}</Group>;
  return <div className="mt-4 first:mt-0">{children}</div>;
}

function NinePoint({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="grid w-[84px] grid-cols-3 gap-1">
      {NINE.map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          title={p}
          className={`size-6 rounded border transition-colors ${
            value === p ? 'border-[#3D8BD0] bg-[#3D8BD0]' : 'border-[#DFE5ED] bg-white hover:border-[#3D8BD0]'
          }`}
        />
      ))}
    </div>
  );
}

const THEME_PRESETS = [
  { name: 'ServiceOps', primary: '#3D8BD0', secondary: '#0F172A', neutral: '#64748B' },
  { name: 'Forest', primary: '#22A06B', secondary: '#14342A', neutral: '#5F6B62' },
  { name: 'Ember', primary: '#F58518', secondary: '#3A2410', neutral: '#77675A' },
  { name: 'Violet', primary: '#7C3AED', secondary: '#241548', neutral: '#6B6480' },
];

/** The contrast guard as a field — it samples real artwork, so it needs its own hook. */
function ContrastField({ spec, textColor, onFix }: {
  spec: BackdropSpec; textColor: string; onFix: (n: { color: string; overlay: number }) => void;
}) {
  const backdrop = useBackdrop(spec);
  return <ContrastMeter textColor={textColor} backdrop={backdrop} overlay={spec.overlay} onFix={onFix} />;
}

/* ── §7.17 the column list ───────────────────────────────────────────────────
 *
 * A column is not a thing you can store on its own: it is the Nth cell of every row. So every
 * operation here rewrites EVERY row in lockstep with the widths and alignments — reorder, duplicate
 * and delete all have to move three arrays at once or the table silently desynchronises.
 *
 * ⚠️ Widths are normalised to 100 on every change. A per-column width that does not add up is a
 * table that renders at some other shape than the numbers claim, which is worse than no control.
 */
const clampW = (w: number) => Math.max(5, Math.min(80, Math.round(w)));

/** Forces the set to total exactly 100, absorbing rounding on the last column. */
function normaliseWidths(ws: number[]): number[] {
  const sum = ws.reduce((a, b) => a + b, 0) || 1;
  const out = ws.map((v) => Math.max(5, Math.round((v / sum) * 100)));
  out[out.length - 1] += 100 - out.reduce((a, b) => a + b, 0);
  return out;
}

const equalWidths = (n: number) => normaliseWidths(Array.from({ length: n }, () => Math.round(100 / n)));

function ColumnsEditor({ cfg, onChange }: { cfg: Cfg; onChange: (patch: Cfg) => void }) {
  const rows = (cfg.rows as (Cfg & { cells: string[] })[]) ?? [];
  const count = Number(cfg.cols ?? rows[0]?.cells?.length ?? 3);
  const widths = ((cfg.widths as number[]) ?? equalWidths(count)).slice(0, count);
  const aligns = ((cfg.aligns as string[]) ?? Array.from({ length: count }, () => 'left')).slice(0, count);
  const headerCells = (cfg.headerRow !== false ? rows[0]?.cells : undefined) ?? [];

  /** Every row, plus widths and aligns, transformed by one column-level operation. */
  const apply = (fn: <T>(arr: T[]) => T[]) => onChange({
    rows: rows.map((r) => ({ ...r, cells: fn(r.cells ?? []) })),
    widths: normaliseWidths(fn(widths) as number[]),
    aligns: fn(aligns),
    cols: fn(Array.from({ length: count }, (_, i) => i)).length,
  });

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= count) return;
    apply((arr) => { const n = [...arr]; [n[i], n[j]] = [n[j], n[i]]; return n; });
  };
  const duplicate = (i: number) => apply((arr) => { const n = [...arr]; n.splice(i + 1, 0, arr[i]); return n; });
  const remove = (i: number) => {
    // A table with no columns is not a table — the last one refuses rather than emptying.
    if (count <= 1) { toast.error('A table needs at least one column'); return; }
    apply((arr) => arr.filter((_, j) => j !== i));
  };

  /* Setting one width squeezes the others proportionally, so the total stays 100 without the
     editor having to do the arithmetic. */
  const setWidth = (i: number, w: number) => {
    const target = clampW(w);
    const rest = widths.map((v, j) => (j === i ? 0 : v));
    const restSum = rest.reduce((a, b) => a + b, 0) || 1;
    const remain = Math.max((count - 1) * 5, 100 - target);
    const next = widths.map((v, j) => (j === i ? target : Math.max(5, Math.round((v / restSum) * remain))));
    onChange({ widths: normaliseWidths(next) });
  };

  const iconBtn = 'flex size-6 items-center justify-center rounded text-[#9CA3AF] transition-colors hover:bg-[#F1F5F9] hover:text-[#364658]';
  const total = widths.reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded border border-[#E5E7EB] p-2">
          <div className="flex items-center gap-1.5">
            <span className="min-w-0 flex-1 truncate text-[12px] font-medium text-[#364658]">
              {headerCells[i]?.trim() || `Column ${i + 1}`}
            </span>
            <button onClick={() => move(i, -1)} disabled={i === 0} title="Move left" className={`${iconBtn} disabled:opacity-30`}><ChevronLeft size={13} /></button>
            <button onClick={() => move(i, 1)} disabled={i === count - 1} title="Move right" className={`${iconBtn} disabled:opacity-30`}><ChevronRight size={13} /></button>
            <button onClick={() => duplicate(i)} title="Duplicate column" className={iconBtn}><Copy size={13} /></button>
            <button onClick={() => remove(i)} title="Delete column" className={`${iconBtn} hover:bg-[#FEF3F2] hover:text-[#EF4444]`}><Trash2 size={13} /></button>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <SliderRow value={widths[i] ?? 0} onChange={(v) => setWidth(i, v)} min={5} max={80} unit="%" />
          </div>
          <div className="mt-2">
            <Segmented
              value={aligns[i] ?? 'left'}
              onChange={(v) => onChange({ aligns: aligns.map((a, j) => (j === i ? v : a)) })}
              options={ALIGN_OPTIONS}
            />
          </div>
        </div>
      ))}
      <div className="flex items-center justify-between pt-0.5">
        <span className="text-[11px] text-[#9CA3AF]">Widths total {total}%</span>
        <button onClick={() => onChange({ widths: equalWidths(count) })} className="text-[11px] font-medium text-[#3D8BD0] hover:underline">
          Make equal
        </button>
      </div>
    </div>
  );
}

/* ── the NEW-ELEMENT accordion panel (NEW-ELEMENT-PANELS-SPEC §1.1–§1.2) ──── */

const ACCORDION_TITLE: Record<string, string> = {
  layout: 'Layout', style: 'Style', spacing: 'Spacing', size: 'Size', alignment: 'Alignment',
};

/* §1.3 — the accordion header carries a dot when anything inside it is set away from default, so a
   collapsed panel still shows where the overrides are. */
const OverrideDot = () => (
  <span title="Something in here is set away from the default" className="size-1.5 flex-shrink-0 rounded-full bg-[#F58518]" />
);

function PanelBody({ spec, nodeId, cfg, renderField, openGroups, toggleGroup, styles, setStyle, replaceStyle, collectionSlot, hasCollection }: {
  spec: WidgetSpec; nodeId: string; cfg: Cfg;
  renderField: (f: WidgetField) => ReactNode;
  openGroups: string[]; toggleGroup: (g: string) => void;
  styles: PortalStyles;
  setStyle: (id: string, patch: Partial<NodeStyle>) => void;
  replaceStyle: (id: string, next: NodeStyle) => void;
  /* §1.4 — the item list sits INSIDE the Content section, so it is passed in rather than rebuilt. */
  collectionSlot?: ReactNode;
  /* ⚠️ Whether that slot actually HAS anything. `collectionSlot` is a JSX fragment and is therefore
     always truthy, empty or not, so it can never answer this on its own. */
  hasCollection?: boolean;
}) {
  const panel = spec.panel!;
  const packProps = { styles, id: nodeId, setStyle, replaceStyle };
  const visible = (fs?: WidgetField[]) => (fs ?? []).filter((f) => !f.when || f.when(cfg));

  /** Everything that can appear under the CONTENT eyebrow, in one test. */
  const hasContentSection = visible(panel.content).length > 0 || !!panel.contentNote || !!hasCollection;

  /* ⚠️ The same rule for DESIGN, and this is the THIRD time one of these has had to be written
     twice: two panel models means every "hide the heading when it introduces nothing" rule needs
     a copy in each, and the second copy only surfaces when a widget of that flavour first hits
     the edge. The logo is that widget — with its accordions gone it rendered a bare DESIGN
     eyebrow with nothing beneath it.
     ⚠️ `size` is filtered out of the render, so it is filtered out of the test too — counting it
     would keep the eyebrow for a widget whose only accordion is one the panel never draws. */
  const hasDesignSection = panel.accordions
    .filter((a) => a.id !== 'size')
    .some((a) => !a.when || a.when(cfg));

  /** Has anything in this accordion moved off its default? Drives the orange dot. */
  const touched = (a: typeof panel.accordions[number]) => {
    const own = visible(a.fields).some((f) => cfg[f.key] !== undefined && cfg[f.key] !== spec.defaults[f.key]);
    if (own) return true;
    if (a.groups?.includes('G1')) return hasOwn(styles, nodeId, ALL_PACKS.P1.keys);
    if (a.spacing) return hasOwn(styles, nodeId, ['padding', 'margin']);
    return false;
  };

  return (
    <>
      {/* Content is a SECTION, not a tab.
          ⚠️ An element with nothing to author gets NO Content section — heading included. The
          heading used to render whatever was beneath it, so a Section with no cards (its only
          remaining content field is Card templates, gated on `hasCards`) showed "CONTENT" with the
          "DESIGN" eyebrow directly under it: a heading introducing nothing, which reads as a panel
          that failed to load rather than as a layer that simply has nothing to author. Same rule
          Design already follows. */}
      {hasContentSection && (
        <>
          <SectionLabel>Content</SectionLabel>
          {panel.content?.length ? visible(panel.content).map(renderField) : null}
          {panel.contentNote && (
            <p className="mt-1 text-[12px] leading-[1.55] text-[#7B8FA5]">{panel.contentNote}</p>
          )}
          {/* ⚠️ Air between the last content FIELD and the collection group beneath it — measured at
              ZERO before this, so on the FAQ panel the Title input's bottom edge sat exactly on the
              "Questions" row. `Group` is a full-bleed row carrying only a bottom rule, so nothing
              separated the two and the field read as part of the row's header.
              16px is `Field`'s own `mt-4`, deliberately: a collection is one more thing you author
              in this section, so it should sit off the field above it by the same step one field
              sits off another.
              ⚠️ Only when fields PRECEDE it. A group that is the first thing under the CONTENT label
              already has that label's rhythm above it, and a margin there would push it away from
              the heading that introduces it. */}
          {collectionSlot && (panel.content?.length || panel.contentNote)
            ? <div className="mt-4">{collectionSlot}</div>
            : collectionSlot}
        </>
      )}

      {panel.action?.length ? (
        <>
          <SectionLabel>Action</SectionLabel>
          {visible(panel.action).map(renderField)}
        </>
      ) : null}

      {hasDesignSection && (
      <>
      <SectionLabel>Design</SectionLabel>
      <div>
        {/* ⚠️ `size` is dropped here as well. Size already left as a field group (DROP_GROUPS) and as
            the P2 pack, but the panel model declares it a THIRD way — as an accordion — so it kept
            appearing on exactly the widgets that use that model. The eight drag handles set size;
            a slider that does the same thing is the second control this builder keeps growing. */}
        {panel.accordions.filter((a) => a.id !== 'size').filter((a) => !a.when || a.when(cfg)).map((a) => {
          const key = `acc:${a.id}`;
          const open = !openGroups.includes(`shut:${a.id}`);
          return (
            <Group
              key={a.id}
              title={ACCORDION_TITLE[a.id]}
              open={!!open}
              onToggle={() => toggleGroup(`shut:${a.id}`)}
              badge={(
                <>
                  {a.info && <span title={a.info} className="cursor-help text-[#9CA3AF]"><Info size={12} /></span>}
                  {touched(a) && <OverrideDot />}
                </>
              )}
            >
              {visible(a.fields).map(renderField)}
              {a.groups?.includes('G1') && <ALL_PACKS.P1.Render {...packProps} />}
              {a.groups?.includes('G3') && <ALL_PACKS.P3.Render {...packProps} roles={a.roles} />}
              {/* ⚠️ The spacing accordion shows only the boxes this element HAS. A divider gets a
                  margin box and no padding box, because a line has no inside. */}
              {a.spacing && (
                <SpacingMatrix
                  style={styles[nodeId] ?? {}}
                  onChange={(p) => setStyle(nodeId, p)}
                  only={a.spacing === 'both' ? undefined : a.spacing}
                />
              )}
            </Group>
          );
        })}
      </div>
      </>
      )}
    </>
  );
}

/** The two headed sections of the one scroll — the only separation Content and Design need. */
/* The label carries an optional ACTION on its right — Expand all / Collapse all for the accordions
   under it. ⚠️ Per SECTION, not one control for the whole panel: Content and Design are separate
   questions, and expanding everything to reach one styling group means scrolling back past every
   content group to get there. */
const SectionLabel = ({ children, action }: { children: ReactNode; action?: ReactNode }) => (
  /* ⚠️ The gap BELOW the label is deliberately much smaller than the one above it. A label sits
     with the fields it heads, so mt-6 separates one section from the next and mb-1 keeps CONTENT
     attached to the first thing it labels — equal margins made every eyebrow float between two
     sections without saying which one it belonged to. */
  <div className="mb-1 mt-6 flex items-center justify-between gap-2 first:mt-2">
    <span className="text-[11px] font-semibold uppercase tracking-wider text-[#7B8FA5]">{children}</span>
    {action}
  </div>
);

/** Expand all / Collapse all for one section's accordions. Says which it will do, not which it did. */
function ExpandAll({ keys, openGroups, setOpen }: {
  keys: string[]; openGroups: string[]; setOpen: (next: string[]) => void;
}) {
  if (keys.length < 2) return null;
  const allOpen = keys.every((k) => openGroups.includes(k));
  return (
    <button
      onClick={() => setOpen(allOpen
        ? openGroups.filter((k) => !keys.includes(k))
        : [...new Set([...openGroups, ...keys])])}
      className="text-[11px] font-medium normal-case tracking-normal text-[#3D8BD0] hover:underline"
    >{allOpen ? 'Collapse all' : 'Expand all'}</button>
  );
}

const NODE_ICON: Record<string, ReactNode> = {
  section: <Rows3 size={16} />, card: <Square size={16} />, text: <TypeIcon size={16} />,
  list: <List size={16} />, search: <SearchIcon size={16} />, rail: <PanelLeft size={16} />,
};

/* Groups the Design section never draws, whatever a spec declares.
 * ⚠️ MODULE scope, not inside the component. They are constants, and the open-state seed below runs
 * far above where they used to be declared — a `const` read before its declaration in the same
 * scope is a temporal dead zone, which in this file arrives as a blank page rather than an error. */
const DROP_GROUPS = new Set(['Layout', 'Size', 'Arrangement']);
/* The one group that always sinks to the foot of Design. It describes what a widget does when it
   has nothing to show — a rare, conditional state — so it must not sit between the fill and the
   spacing you are actually reading, and it can never be the FIRST accordion. */
const EMPTY_STATE_GROUP = 'Empty state';
/* Packs the drawer never draws as their own accordion. P2 is Size in pack form and P4 is
   Arrangement; P8 renders after Spacing rather than in sequence. */
const SKIP_PACKS = new Set(['P2', 'P4', 'P8']);

/** The open-key of the FIRST accordion the Design section will render for this spec, or null.
 *
 * ⚠️ The render keys three different kinds of accordion three different ways — a field group by its
 * NAME, a pack by its ID, and Spacing by the literal `__spacing` — so this has to answer in the
 * same currency the open-state list is written in, not with an index. */
function firstDesignKey(spec: WidgetSpec, cfg: Cfg): string | null {
  const groups: string[] = [];
  (spec.fields ?? []).forEach((f) => {
    if ((f.tab ?? 'content') !== 'style') return;
    const g = f.group ?? 'Content';
    if (g === 'Action' || g === EMPTY_STATE_GROUP || DROP_GROUPS.has(g)) return;
    if (f.when && !f.when(cfg)) return;
    if (!groups.includes(g)) groups.push(g);
  });
  if (groups.length) return groups[0];
  /* A pack whose title matches a field group is drawn INSIDE that group, so it is not its own
     accordion and cannot be the first one. */
  const pk = (spec.packs ?? []).find((p) => ALL_PACKS[p] && !SKIP_PACKS.has(p) && !groups.includes(ALL_PACKS[p].title));
  if (pk) return pk;
  /* Every widget gets Spacing, so there is always something to open. */
  return '__spacing';
}

/** The Table's size field: a button that says the current shape, and the 10 × 10 grid behind it.
 *
 * ⚠️ The popover is PORTALLED and positioned from the trigger. The design panel scrolls, so a
 * popover living inside it is clipped the moment it is taller than the room below its field — the
 * same trap the colour and icon pickers already document. */
function TableSizeField({ rows, cols, onPick }: { rows: number; cols: number; onPick: (r: number, c: number) => void }) {
  const [open, setOpen] = useState(false);
  const [at, setAt] = useState<DOMRect | null>(null);
  return (
    <>
      <button
        type="button"
        onClick={(e) => { setAt((e.currentTarget as HTMLElement).getBoundingClientRect()); setOpen(true); }}
        className="flex h-9 w-full items-center gap-2 rounded border border-[#d1d5db] bg-white px-3 text-left text-[13px] text-[#364658] transition-colors hover:border-[#3D8BD0]"
      >
        <TableIcon size={15} className="flex-shrink-0 text-[#7B8FA5]" />
        <span className="flex-1">{rows} × {cols}</span>
        <ChevronRight size={14} className="flex-shrink-0 text-[#9CA3AF]" />
      </button>
      {open && at && createPortal(
        <>
          <span className="fixed inset-0 z-[10000]" onClick={() => setOpen(false)} />
          <div
            className="fixed z-[10001]"
            style={{
              left: Math.max(8, Math.min(at.left, window.innerWidth - 244)),
              top: Math.min(at.bottom + 6, window.innerHeight - 250),
            }}
          >
            <TableGridPicker onPick={(r, c) => { onPick(r, c); setOpen(false); }} onCancel={() => setOpen(false)} />
          </div>
        </>,
        document.body,
      )}
    </>
  );
}

export interface WidgetDrawerProps {
  nodeId: string;
  spec: WidgetSpec;
  cfg: Cfg;
  setCfg: (patch: Cfg) => void;
  styles: PortalStyles;
  setStyle: (id: string, patch: Partial<NodeStyle>) => void;
  replaceStyle: (id: string, next: NodeStyle) => void;
  onSelect: (id: string | null) => void;
  /** Clears this element's own config and style. Rendered beside its name, not above the panel. */
  onReset?: () => void;
  /** Rewrites a section's shape and reflows what is inside it. */
  applyPreset?: (sectionId: string, preset: PresetId) => void;
  icon?: IconChoice;
  setIcon: (c?: IconChoice) => void;
  /** Layer-level structural actions — never in the tab body (§2.1). */
  onDuplicate?: () => void;
  onDelete?: () => void;
  canDuplicate?: boolean;
  /** Opens an admin destination, for the "where this value actually lives" links. */
  onOpenSetting?: (section: string, card?: string) => void;
  /** Appends the Quick Actions row's one external-link card. */
  onAddLinkCard?: () => void;
}

export function PortalWidgetDrawer(props: WidgetDrawerProps) {
  const { nodeId, spec, cfg, setCfg, styles, setStyle, replaceStyle, onSelect, onReset, applyPreset, icon, setIcon, onAddLinkCard } = props;
  const node = nodeById(nodeId);
  const path = nodePath(nodeId);
  /* What arrives OPEN. ⚠️ CONTENT only — every DESIGN accordion starts collapsed.
     Content is what you came to edit and it is a handful of rows; Design is the long tail — six to
     nine accordions of fill, border, radius, typography, spacing and size, which expanded at once
     turn the panel into a page you scroll past to reach anything. Collapsed, Design is a legible
     index of what CAN be styled, and the one you want is one click away.
     ⚠️ The two panel models use OPPOSITE polarity, so both have to be seeded. The packs panel treats
     a name in this list as open; `PanelBody`'s accordions are open UNLESS `shut:<id>` is present —
     so leaving one out does nothing there, and the `shut:` keys have to be put IN. Miss that and
     half the widgets keep arriving fully expanded.
     The per-widget memory still wins, so anything you deliberately open stays open for that type. */
  /* ⚠️ The FIRST Design accordion arrives OPEN; every one below it stays shut. All-collapsed made
     Design read as a section that failed to load — a heading over a stack of closed bars with no
     sign that any of them holds anything — and opening all of them turns the panel into a page you
     scroll past to reach anything. One open shows what a Design row looks like while the rest stay
     a legible index.
     ⚠️ Written TWICE because the two panel models have opposite polarity: the packs panel treats a
     key in this list as OPEN, while `PanelBody`'s accordions are open UNLESS `shut:<id>` is present.
     So one gets the first key added and the other gets the first key left OUT. Miss either half and
     that flavour of widget keeps its old behaviour, which is exactly how the last three rules of
     this shape shipped half-done. */
  const firstPanelAccordion = (spec.panel?.accordions ?? [])
    .filter((a) => a.id !== 'size')
    .filter((a) => !a.when || a.when(cfg))[0]?.id;

  const DEFAULT_OPEN = [
    ...new Set([
      'Content',
      ...(spec.fields ?? []).filter((f) => (f.tab ?? 'content') === 'content').map((f) => f.group).filter(Boolean) as string[],
      ...(spec.collection ? [spec.collection.group] : []),
      ...(spec.panel ? [] : [firstDesignKey(spec, cfg)].filter(Boolean) as string[]),
      ...(spec.panel?.accordions ?? []).filter((a) => a.id !== firstPanelAccordion).map((a) => `shut:${a.id}`),
    ]),
  ];
  /* The banner gallery is opened FROM a field and rendered at the drawer's root — a popover mounted
     inside a scrolling panel is clipped the moment it is taller than the space below its trigger. */
  const [bannerPick, setBannerPick] = useState<BannerPick>(null);
  const [openGroups, setOpenGroupsState] = useState<string[]>(GROUP_MEMORY[spec.id] ?? DEFAULT_OPEN);
  /* ⚠️ RE-SEEDED when the selected widget changes. This drawer is ONE component instance that
     swaps its spec as you click around the page, and `useState` only ever reads its initial value —
     so `openGroups` kept the group names of whatever you selected FIRST. Every later widget's
     groups were absent from that list, which reads as "all collapsed": select a card, then an
     accordion, and the accordion arrives shut with no way to tell why. Keyed on `spec.id` so a
     widget you deliberately tidied still opens the way you left it. */
  useEffect(() => {
    setOpenGroupsState(GROUP_MEMORY[spec.id] ?? DEFAULT_OPEN);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spec.id]);
  const setOpenGroups = (next: string[]) => { GROUP_MEMORY[spec.id] = next; setOpenGroupsState(next); };
  const toggleGroup = (g: string) =>
    setOpenGroups(openGroups.includes(g) ? openGroups.filter((x) => x !== g) : [...openGroups, g]);

  if (!node) return null;

  /* ── which LAYER is selected (spec §4) ───────────────────────────────────
   *
   * The same shell serves the widget (L3), one of its items (L5) and an item's sub-element (L6).
   * `nodeId` carries the lineage, so the only thing that changes is which fields are shown and
   * which slice of config they read and write. Styles always key off the FULL node id, which is
   * what lets an item's override resolve up through the widget to the section and the page. */
  const collection = spec.collection;
  const allItems = (collection ? ((cfg[collection.key] as Cfg[]) ?? []) : []) as (Cfg & { id: string })[];
  const parsed = parseItemId(nodeId);
  const selItem = parsed && collection ? allItems.find((x) => x.id === parsed.item) : undefined;

  const patchItem = (patch: Cfg) => {
    if (!collection || !selItem) return;
    setCfg({ [collection.key]: allItems.map((x) => (x.id === selItem.id ? { ...x, ...patch } : x)) });
  };

  /* What this layer edits. A sub-element edits exactly ONE field of its item — the Answer drawer
     holds the answer, nothing else — which is the whole reason it is its own layer. */
  const subField = parsed?.part && collection
    ? collection.fields.find((f) => f.key === parsed.part)
    : undefined;
  const viewCfg: Cfg = selItem ?? cfg;
  const viewSet = selItem ? patchItem : setCfg;

  /* ⚠️ §7.15 — a card CHILD is an ordinary widget. It opens the same fields its type opens out on
     the page, so there is one way to edit a Button whether it sits in a card or on the canvas.
     Without this the child drawer had no fields at all: `collection.fields` is empty for Card,
     because a child's fields belong to its own type, not to the card. */
  const childSpec = selItem && collection?.childTypes ? specById(String(selItem.type)) : undefined;

  const viewFields: WidgetField[] = subField ? [subField]
    : childSpec ? childSpec.fields
      : selItem ? (collection?.fields ?? [])
        : spec.fields;
  /* A child takes the CARD's width — its geometry is the card's job — so P2 is removed rather than
     shown doing nothing. */
  const viewPacks0 = childSpec ? childSpec.packs.filter((p) => p !== 'P2')
    : selItem ? (collection?.packs ?? [])
      : spec.packs;
  /* ⚠️ P2 IS the Size accordion in pack form — dropping the group without dropping the pack would
     leave the same fields on screen under a different title. */
  /* ⚠️ P4 goes when the widget has no records. Gap between items and a rule between items are both
     statements ABOUT items — offered on an empty widget they are controls whose effect cannot be
     seen, which is the same fault as a control that writes to nothing. The Empty-state group stays,
     because that IS the setting that matters when there is nothing to show. */
  /* P2 IS the Size accordion in pack form and P4 IS Arrangement — dropping the groups without the
     packs would leave the same fields under a different title. */
  const viewPacks = (viewPacks0 ?? []).filter((id) => id !== 'P2' && id !== 'P4');
  const viewRoles = childSpec ? childSpec.roles : subField
    ? (collection?.subElements?.find((s) => s.key === subField.key)?.role
      ? [collection!.subElements!.find((s) => s.key === subField.key)!.role!] : ['body' as const])
    : selItem ? collection?.roles : spec.roles;

  /* ── field rendering ── */

  /* A field writes cfg by default, or the STYLE store when it is the same value a pack owns —
     that is what lets Columns sit on both tabs and stay one setting rather than two that drift. */
  const readField = (f: WidgetField) =>
    (f.store === 'style' ? resolve(styles, nodeId, f.key as keyof NodeStyle).value : viewCfg[f.key]);

  /* ⚠️ Segmented options carry strings, but a style key like `columns` holds a NUMBER — writing '2'
     where the pack reads 2 meant the two controls silently stopped agreeing, which is the exact
     failure binding them was meant to prevent. Coerce on the way into the style store. */
  const writeField = (f: WidgetField, v: unknown) => {
    if (f.store === 'style') {
      const numeric = typeof v === 'string' && v !== '' && !Number.isNaN(Number(v));
      setStyle(nodeId, { [f.key]: numeric ? Number(v) : v } as Partial<NodeStyle>);
      return;
    }
    /* §2.2 — a change that invalidates another field repairs it in the SAME write and says so.
       Two writes would render an impossible intermediate state; a silent repair would lose a
       setting nobody saw change. */
    const fallout = f.consequence?.(v, viewCfg);
    viewSet({ [f.key]: v, ...(fallout?.patch ?? {}) });
    if (fallout) toast.success(fallout.say);
  };

  /** Options that depend on state — resolved per render, never cached. */
  const optionsOf = (f: WidgetField) =>
    (typeof f.options === 'function' ? f.options(viewCfg) : f.options);

  const set = (key: string, v: unknown) => viewSet({ [key]: v });

  const renderControl = (f: WidgetField) => {
    const v = readField(f);
    const set = (_k: string, val: unknown) => writeField(f, val);
    switch (f.control) {
      case 'text':
        return <TextField value={(v as string) ?? ''} onChange={(x) => set(f.key, x)} />;
      case 'textarea':
        return <textarea rows={3} value={(v as string) ?? ''} onChange={(e) => set(f.key, e.target.value)}
          className="h-auto w-full rounded border border-[#d1d5db] px-3 py-2 text-[13px] leading-[1.5] text-[#364658] focus:border-[#3D8BD0] focus:outline-none focus:ring-1 focus:ring-[#3D8BD0]" />;
      case 'rich':
        return <RichText value={(v as string) ?? ''} onChange={(x) => set(f.key, x)} placeholder="Write something…" />;
      case 'number':
        return <NumberField value={(v as number) ?? f.min ?? 0} onChange={(x) => set(f.key, x)} min={f.min} max={f.max} />;
      case 'slider':
        return <SliderRow value={(v as number) ?? f.min ?? 0} onChange={(x) => set(f.key, x)} min={f.min} max={f.max} step={f.step} unit={f.unit} />;
      case 'toggle':
        return null; // toggles render as their own row, below
      case 'chips':
        /* ⚠️ A dropdown, not chips. Five statuses laid out as buttons take four lines of the panel
           and still cannot say how many are on without you counting fills. */
        /* ⚠️ The empty text is DERIVED from the field, not hardcoded. It said "No statuses — the
           list will be empty" for every chips field in the builder, so a Font format control sat
           under a Table telling you about statuses it has nothing to do with. A field may still
           name its own via `placeholder`. */
        return <MultiSelect value={(v as string[]) ?? []} options={(optionsOf(f) as string[]) ?? REQUEST_STATUSES} onChange={(x) => set(f.key, x)} placeholder={f.placeholder ?? `No ${(f.label ?? "options").toLowerCase()} selected`} />;
      case 'select':
        /* ⚠️ NOT cast to `string[]`. SelectField already accepts {value,label} pairs, and a field
           whose stored token should differ from its wording (`fixed` → "Fixed items") has no other
           way to say so — the cast was quietly promising every select was a list of bare words. */
        return <SelectField value={(v as string) ?? ''} options={optionsOf(f) as string[] | { value: string; label: string }[]} onChange={(x) => set(f.key, x)} />;
      case 'segmented': {
        const opts = optionsOf(f) as { value: string; label: string }[];
        /* ⚠️ An ALIGNMENT segmented renders as joined icon buttons, everywhere, detected by its
           option VALUES rather than by its label or its key. Alignment fields are declared in a
           dozen specs under half a dozen key names (`align`, `textAlign`, `contentAlign`,
           `cellAlign`…), so keying off the name would leave some of them as word buttons — and a
           control that looks different in two panels reads as two different controls. */
        if (opts.length && opts.every((o) => ALIGN_ICON[o.value])) {
          return <AlignRow value={v === undefined ? '' : String(v)} options={opts} onChange={(x) => set(f.key, x)} />;
        }
        // Compared as strings so a numeric style value still lights its option.
        return <Segmented value={v === undefined ? '' : String(v)} options={opts} onChange={(x) => set(f.key, x)} />;
      }
      case 'color': {
        /* ⚠️ Light is the BARE key, dark is `dark:<key>` — the convention the theme panel and the
           style resolver both use, so all three colour surfaces store a pair the same way.
           `cfgFor` promotes the dark value onto the base key while the portal is dark and stashes
           the original under `light:<key>`, which is why the light tab reads that first: without it
           it would fall back to the base key it had just been overwritten by, and both tabs would
           show the dark colour. */
        const light = (viewCfg[`light:${f.key}`] as string) ?? (v as string) ?? '#3D8BD0';
        const dark = (viewCfg[`dark:${f.key}`] as string) ?? light;
        return (
          <ColorField
            value={(v as string) ?? '#3D8BD0'}
            onChange={(x) => set(f.key, x)}
            modes={{
              mode: portalColorMode(),
              light,
              dark,
              /* ⚠️ The DARK half goes through `viewSet`, NOT through `set`. The `set` in scope here
                 is `renderControl`'s own — `(_k, val) => writeField(f, val)` — which DISCARDS the key
                 it is given and always writes `f.key`, because every other control only ever writes
                 its own field. Handing it `dark:bg` therefore wrote `bg`, and both tabs edited the
                 light colour: the picker looked right, the value went to the wrong key, and nothing
                 anywhere said so.
                 The LIGHT half keeps using `set` so a field's `consequence` and any mirroring still
                 run — those belong to the field, and the dark variant is the same field. */
              onChange: (m, x) => (m === 'dark' ? viewSet({ [`dark:${f.key}`]: x }) : set(f.key, x)),
            }}
          />
        );
      }
      case 'upload':
        return <UploadZone value={v as string} onChange={(x) => set(f.key, x ?? '')} suggested={f.suggested} noun={f.noun} />;
      case 'videoSource':
        return <VideoSource value={v as string} onChange={(x) => set(f.key, x)} />;
      /* The Record List's filter — the named presets and a condition builder, in one popover.
         ⚠️ Both halves are per module, so the control is handed the CHOSEN module rather than
         reading one itself: the fields it offers and the statuses behind its Status field have to
         be the ones that module actually has. */
      case 'recordFilter': {
        const mk = String(viewCfg.module ?? 'request');
        return (
          <RecordFilterField
            value={v as RecordFilter | undefined}
            moduleKey={mk}
            statuses={recordModule(mk).statuses}
            onChange={(x) => set(f.key, x)}
          />
        );
      }
      /* The Quick Actions row's one addable card.
         ⚠️ At the limit the CTA stays VISIBLE and disabled with the reason on it — the same rule
         every other cap in this builder follows. A CTA that vanished once used would leave an admin
         wondering whether they had imagined it. */
      case 'addLinkCard': {
        const has = cfg.__hasLink === true;
        /* ⚠️ A ROW, not a poster. It was a centred block — a 36px circular icon over a title over a
           description over a full-width button — which made the one optional extra on this panel the
           largest thing on it, and taller than the four cards it is offering to join. Laid out as an
           icon, two lines of text and a button on one line it says exactly the same thing in a third
           of the height, and it now matches the shape of every other row in this builder. */
        return (
          <div className="flex items-center gap-2.5 rounded border border-dashed border-[#D9E0EA] bg-white px-2.5 py-2">
            <span className="flex size-7 flex-shrink-0 items-center justify-center rounded bg-[#F1F5F9] text-[#3D8BD0]">
              <Link2 size={14} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[12px] font-medium text-[#364658]">External link card</span>
              <span className="block truncate text-[11px] text-[#9CA3AF]">
                {has ? 'Select the card to edit its link.' : 'Opens a link of your choosing.'}
              </span>
            </span>
            <button
              type="button"
              disabled={has}
              title={has ? 'This row already has its external-link card' : undefined}
              onClick={() => onAddLinkCard?.()}
              className={`flex-shrink-0 rounded px-2.5 py-1 text-[12px] font-medium transition-colors ${
                has
                  ? 'cursor-not-allowed border border-[#EDF0F4] text-[#C3CBD6]'
                  : 'bg-[#3D8BD0] text-white hover:bg-[#2d6ca0]'
              }`}
            >{has ? 'Added' : 'Add'}</button>
          </div>
        );
      }
      /* The banner's slot: the same zone, plus the gallery route. */
      case 'bannerUpload':
        return (
          <UploadZone
            value={v as string}
            onChange={(x) => set(f.key, x ?? '')}
            suggested={f.suggested}
            gallery={(anchor, chooseFile) => setBannerPick({ anchor, chooseFile, key: f.key })}
          />
        );
      case 'icon':
        return <IconField value={icon} onChange={setIcon} />;
      case 'chipEditor':
        return <ChipEditor value={(v as string[]) ?? []} onChange={(x) => set(f.key, x)} />;
      case 'nine':
        return <NinePoint value={String(v ?? 'center')} onChange={(x) => set(f.key, x)} />;
      case 'columns':
        return <ColumnsEditor cfg={viewCfg} onChange={(patch) => viewSet(patch)} />;
      case 'sliderUnit':
        // §1.3 — slider, numeric readout and the unit beside it, as one row.
        return <SliderRow value={Number(v ?? f.min ?? 0)} onChange={(x) => set(f.key, x)} min={f.min} max={f.max} step={f.step} unit={f.unit ?? 'px'} />;
      case 'radius':
        return (
          <RadiusRow
            value={Number(v ?? 8)}
            onChange={(x) => set(f.key, x)}
            corners={viewCfg.corners as never}
            onCorners={(c) => set('corners', c)}
          />
        );
      case 'borderRow':
        return (
          <BorderRow
            width={Number(viewCfg.borderWidth ?? 0)}
            color={String(viewCfg.borderColor ?? '#E5E7EB')}
            sides={viewCfg.borderSides as never}
            onSides={(x) => set('borderSides', x)}
            onWidth={(x) => set('borderWidth', x)}
            onColor={(x) => set('borderColor', x)}
          />
        );
      case 'iconFrame':
        return (
          <IconFramePicker
            value={(viewCfg.frame as IconFrame) ?? 'none'}
            onChange={(v) => set('frame', v)}
          />
        );
      /* ⚠️ The shapes are DRAWN, not named. 'Circle' and 'Square' are words for pictures, and the
         picture is both faster to read and impossible to misread. Same rule as the divider's line
         picker and the icon frames. */
      case 'shape': {
        const opts = optionsOf(f) as { value: string; label: string }[];
        const mark = (v: string) => (
          <span className={`inline-block bg-[#94A3B8] ${v === 'circle' ? 'size-4 rounded-full' : v === 'wide' ? 'h-2.5 w-6 rounded-[2px]' : 'size-4 rounded-[3px]'}`} />
        );
        return (
          <span className="inline-flex overflow-hidden rounded border border-[#DFE5ED]">
            {opts.map((o, i) => (
              <button
                key={o.value}
                onClick={() => set(f.key, o.value)}
                title={o.label}
                className={`flex h-8 w-10 items-center justify-center transition-colors ${i > 0 ? 'border-l border-[#DFE5ED]' : ''} ${String(v) === o.value ? 'bg-[#EBF5FF]' : 'bg-white hover:bg-[#F5F7FA]'}`}
              >{mark(o.value)}</button>
            ))}
          </span>
        );
      }
      /* The 10 × 10 grid picker, reached from the panel rather than only on a fresh drop.
         ⚠️ It RESIZES rather than rebuilding: choosing a size on a table you have already filled in
         must not empty it. Growing adds blank cells, shrinking drops only what falls outside the new
         shape, and everything inside keeps its text, colour and alignment. */
      case 'tableSize': {
        const model = tableFrom(viewCfg);
        return (
          <TableSizeField
            rows={model.rows.length}
            cols={columnCount(model)}
            onPick={(r, c) => set(f.key, resizeTable(model, r, c))}
          />
        );
      }
      case 'tableContent': {
        /* ⚠️ Reads and writes THE MODEL, not a parallel `rows` array. The sheet used to own
           `cfg.rows` while the canvas owns `cfg.table`, so once a table had been touched on the
           canvas every edit typed here was stored and silently ignored — two editors for one grid,
           and the one you were not looking at won. `applyGrid` keeps each cell's identity and
           styling where the shape still has a cell for it, so bulk entry is not destructive. */
        const model = tableFrom(viewCfg);
        return <TableContentField rows={gridOf(model)} onChange={(g) => set(f.key, applyGrid(model, g))} />;
      }
      case 'lineStyle':
        return (
          <LineStylePicker
            value={(viewCfg.lineStyle as LineStyle) ?? 'solid'}
            color={String(viewCfg.lineColor ?? '#94A3B8')}
            thickness={Number(viewCfg.thickness ?? 2)}
            onChange={(v) => set('lineStyle', v)}
          />
        );
      case 'shadow':
        return (
          <ShadowBlock
            value={{
              on: viewCfg.shadowOn === true,
              color: String(viewCfg.shadowColor ?? '#0F172A'),
              type: (viewCfg.shadowType as 'outer' | 'inner') ?? 'outer',
              pos: String(viewCfg.shadowPos ?? 'bottom'),
            }}
            onChange={(x) => viewSet({ shadowOn: x.on, shadowColor: x.color, shadowType: x.type, shadowPos: x.pos })}
          />
        );
      case 'size':
        return (
          <SizeRow
            width={Number(viewCfg.boxWidth ?? 240)}
            height={viewCfg.boxHeight === undefined ? null : Number(viewCfg.boxHeight)}
            keep={viewCfg.keepRatio !== false}
            onChange={(x) => viewSet({
              ...(x.width !== undefined ? { boxWidth: x.width } : {}),
              ...(x.height !== undefined ? { boxHeight: x.height } : {}),
              ...(x.keep !== undefined ? { keepRatio: x.keep } : {}),
            })}
          />
        );
      case 'templates':
        /* A `templates` field may declare `options` to narrow the row — see TemplatePicker. */
        return (
          <TemplatePicker
            value={String(v ?? 'left')}
            onChange={(x) => set(f.key, x)}
            only={optionsOf(f) as readonly string[] | undefined}
          />
        );
      /* ⚠️ Both render as the SAME joined icon group every other alignment row uses. They used to be
         a recessed pill track, so "Alignment" looked like one control in a text element and a
         different one in an action card — and the difference carried no meaning, since both answer
         "where does this sit". Distribute keeps its five options and valign its four; only the
         chrome is shared. */
      case 'sectionPreset':
        return (
          <SectionPresets
            count={Number(cfg.__count ?? 0)}
            current={(cfg.__preset as PresetId) ?? 'cols'}
            onPick={(x) => applyPreset?.(nodeId, x)}
          />
        );
      /* ⚠️ The option SET follows the axis. On a row of columns "centre" means the columns sit in
         the middle of the band; on a stack it means each block is centred across the width — two
         different questions, and offering one list for both is what made half the options inert. */
      /* ⚠️ The fallback is the value the CANVAS actually uses when nothing is set, not a tidy
         'start' for both. Flex fills its cross axis by default, so an untouched row of columns is
         stretched — lighting "Top" there made the panel state a fact the page disagreed with. Every
         one of these rows opens with a button already lit, precisely so you can read what you have
         before you change it. The pair swaps with the axis for the same reason. */
      case 'distribute':
        return (
          <AlignRow
            axis="x"
            value={String(v ?? (cfg.__rowAxis ? 'start' : 'stretch'))}
            options={cfg.__rowAxis ? ACROSS_ROW : ACROSS_STACK}
            onChange={(x) => set(f.key, x)}
          />
        );
      case 'valign':
        return (
          <AlignRow
            axis="y"
            value={String(v ?? (cfg.__rowAxis ? 'stretch' : 'start'))}
            options={cfg.__rowAxis ? DOWN_ROW : DOWN_STACK}
            onChange={(x) => set(f.key, x)}
          />
        );
      case 'pills':
        return (
          <div className="flex flex-wrap gap-1.5">
            {(optionsOf(f) as { value: string; label: string }[]).map((o) => (
              <button
                key={o.value}
                onClick={() => set(f.key, o.value)}
                className={`h-7 rounded-full px-3 text-[12px] font-medium transition-colors ${
                  String(v) === o.value ? 'bg-[#3D8BD0] text-white' : 'border border-[#DFE5ED] bg-white text-[#64748B] hover:bg-[#F5F7FA]'
                }`}
              >{o.label}</button>
            ))}
          </div>
        );
      case 'preset':
        return (
          <div className="grid grid-cols-4 gap-2">
            {THEME_PRESETS.map((p) => (
              <button
                key={p.name}
                /* ⚠️ Replaces every colour and KEEPS the typeface — trying palettes must never
                   silently lose the font someone chose (§7.22). */
                onClick={() => viewSet({ primary: p.primary, secondary: p.secondary, neutral: p.neutral })}
                title={p.name}
                className="flex h-9 items-center justify-center gap-1 rounded border border-[#DFE5ED] transition-colors hover:border-[#3D8BD0]"
              >
                {[p.primary, p.secondary, p.neutral].map((c) => (
                  <span key={c} className="size-3.5 rounded-full" style={{ background: c }} />
                ))}
              </button>
            ))}
          </div>
        );
      case 'contrast': {
        /* The REAL backdrop: this band's own fill, or the page's when the background was pushed
           there. Anything else measures a colour nobody is looking at. */
        const scope = resolve(styles, nodeId, 'bgScope').value;
        const ownFill = resolve(styles, nodeId, 'bgFill').value;
        const pageBg = String(styles[PAGE_ID]?.bg ?? '#0F172A');
        const usePage = scope === 'page' || ownFill === 'none';
        return (
          <ContrastField
            spec={{
              fill: usePage ? 'color' : (ownFill as 'color' | 'image'),
              color: usePage ? pageBg : String(resolve(styles, nodeId, 'bg').value),
              image: String(resolve(styles, nodeId, 'bgImage').value ?? ''),
              overlay: Number(resolve(styles, nodeId, 'bgOverlay').value ?? 0),
              pageColor: pageBg,
            }}
            textColor={String(viewCfg.headingColor ?? '#FFFFFF')}
            onFix={(next) => {
              viewSet({ headingColor: next.color });
              if (next.overlay !== Number(resolve(styles, nodeId, 'bgOverlay').value ?? 0)) {
                setStyle(nodeId, { bgOverlay: next.overlay });
              }
              toast.success('Heading colour adjusted for readability');
            }}
          />
        );
      }
      case 'lockedToggle':
        // The §8.5 floor: shown as a locked-on row with a reason, never hidden.
        return null;
      case 'grid': {
        const rows = ((cfg.rows as Cfg[]) ?? []).length || 3;
        const cols = Number(cfg.cols ?? 3);
        return (
          <GridPicker
            rows={rows}
            cols={cols}
            max={f.max ?? 10}
            onChange={(r, c) => {
              /* Growing pads with blanks, shrinking truncates — and existing text KEEPS its cell,
                 so resizing never scrambles what is already typed. */
              const cur = ((cfg.rows as Cfg[]) ?? []);
              const next = Array.from({ length: r }, (_, i) => {
                const old = cur[i];
                const cells = Array.from({ length: c }, (_, j) => (old?.cells as string[])?.[j] ?? '');
                return { id: old?.id ?? `r${Date.now().toString(36)}${i}`, cells };
              });
              setCfg({ rows: next, cols: c });
            }}
          />
        );
      }
      default:
        return null;
    }
  };

  /* Spacing is decided by what a field SITS NEXT TO, so it is computed here rather than declared per
     field — the lists are already filtered by `when`, so the previous entry is the one actually
     rendered above, not the one that would have been. */
  const renderField = (f: WidgetField, i?: number, arr?: WidgetField[]) => {
    const prev = i != null && arr ? arr[i - 1] : undefined;
    const afterToggle = prev?.control === 'toggle' || prev?.control === 'lockedToggle';
    if (f.control === 'lockedToggle') {
      return <ToggleRow key={f.key} label={f.label} on locked onChange={() => {}} lockNote={f.help} />;
    }
    if (f.control === 'toggle') {
      return (
        <ToggleRow
          key={f.key}
          label={f.label}
          on={cfg[f.key] !== false}
          help={f.help} info={f.info}
          onChange={(x) => set(f.key, x)}
        />
      );
    }
    const blank = f.warnWhenBlank && !String(readField(f) ?? '').trim();
    /* ⚠️ ShadowBlock draws its own "Shadow" row — the toggle IS the label. Letting Field add a
       second one printed "Shadow / Shadow" on every widget that has a shadow. The other box
       controls (radius, border, size) rely on Field's label, so only this one opts out. */
    /* ⚠️ `borderRow` and `radius` join `shadow` here. Both draw their own heading — with the
       advanced per-side toggle beside it — so wrapped in a Field they printed "Border / Border" and
       "Corner radius / Corner radius", one under the other, which is what made the Colour tab twice
       the height of every other panel and read as two controls per row. */
    const selfLabelled = f.control === 'shadow' || f.control === 'borderRow' || f.control === 'radius';
    /* ⚠️ A self-labelled block IS a switch row, so it gets NO Field wrapper at all — it owns its own
       spacing exactly like ToggleRow does. Wrapped, it inherited the wrapper's margin and its own
       `first:mt-0` zeroed out, which is how the Shadow block ended up 6px under the Divider switch,
       reading as that switch's setting rather than its own question. The Fragment keeps it a real
       sibling of the other rows so `first:` still resolves against them. */
    if (selfLabelled) return <Fragment key={f.key}>{renderControl(f)}</Fragment>;
    return (
      <Field
        key={f.key}
        label={f.label}
        help={f.help} info={f.info}
        divider={f.divider}
        tight={afterToggle}
      >
        {renderControl(f)}
        {/* Warns, never blocks — a hard stop teaches people to type a space. */}
        {blank && <Note tone="warn">{f.warnWhenBlank}</Note>}
      </Field>
    );
  };

  /* Fields for a tab, already filtered by their `when` predicate, then grouped. ⚠️ A group whose
     every field was filtered out is dropped here rather than rendering an empty accordion. */
  /* ⚠️ Layout and Size are dropped from EVERY widget, filtered here rather than deleted from thirty
     specs one at a time. Both had become questions the canvas answers better: layout is the template
     picker and the column adders you can see acting on the page, and size is the eight drag handles
     on the element itself. A panel field for either meant two controls for one value, and whichever
     you were not looking at won the last write.
     ⚠️ This is the WIDGET drawer's filter. Structure keeps its own — a section's Columns and a
     spacer's height have no handle to drag — which is why it lives here and not in the accordion
     renderer that structure specs share. */
  /* ⚠️ Arrangement joins Layout and Size. Its two controls were gap and a divider between items —
     one duplicated the Spacing the section already owns, the other could not apply to half the
     widgets that declared it. Dropped at the drawer rather than deleted from thirty specs, the same
     way Layout and Size were. */


  const emptyStateFields = () => viewFields.filter((f) => f.group === EMPTY_STATE_GROUP && (f.tab ?? 'content') === 'style' && (!f.when || f.when(viewCfg)));
  const groupsFor = (which: 'content' | 'style' | 'action') => {
    /* ⚠️ 'action' is a SECTION, not a tab: its fields still declare `tab: 'content'` because that
       is which half of the drawer they belong to — Content and Action are both authored, Design is
       styled. The section is chosen by the field's GROUP being "Action", which is why Content has
       to exclude that group or the same fields would render twice. */
    const wantAction = which === 'action';
    const visible = viewFields.filter((f) => (f.tab ?? 'content') === (wantAction ? 'content' : which)
      && ((f.group === 'Action') === wantAction)
      && !DROP_GROUPS.has(f.group ?? '')
      && !(cfg.__noData === true && f.group === 'Arrangement')
      && (!f.when || f.when(viewCfg)));
    const order: string[] = [];
    const byGroup: Record<string, WidgetField[]> = {};
    visible.forEach((f) => {
      const g = f.group ?? 'Content';
      if (!byGroup[g]) { byGroup[g] = []; order.push(g); }
      byGroup[g].push(f);
    });
    /* ⚠️ Empty state is EXCLUDED here and rendered after the Spacing block instead — see the
       Design section. Sorting it last within this list was not enough: Spacing is not a field group,
       it renders separately afterwards, so "last among the field groups" still left Empty state in
       the middle of the panel. */
    return order.filter((g) => g !== EMPTY_STATE_GROUP).map((g) => ({ group: g, fields: byGroup[g] }));
  };

  /* Widget-level notes belong to the WIDGET. Repeating "these questions are authored, not fetched"
     on every question and every answer is noise, not guidance — hence the `parsed` gate, which is
     what excludes an item and a sub-element layer.
     ⚠️ WARN only. The grey ⓘ note cards were removed from every panel on request and thirteen
     `info` notes are still declared across the specs, so rendering notes wholesale would put all
     thirteen back. A warn says something the canvas cannot show you — Favourite Services draws four
     example tiles in the builder and nothing at all for a requester who has pinned none — and there
     is exactly one in the catalogue, which is the right number for a caution. */
  const notesFor = (which: 'content' | 'style') =>
    (parsed ? [] : (spec.notes ?? [])).filter((n) => n.tone === 'warn' && (n.tab ?? 'content') === which && (!n.when || n.when(cfg)));

  const noteBlock = (which: 'content' | 'style') => notesFor(which).map((n) => (
    <p
      key={n.text}
      className="mb-3 rounded border border-[#FDE68A] bg-[#FFFBEB] px-2.5 py-2 text-[12px] leading-[1.55] text-[#92400E]"
    >{n.text}</p>
  ));

  const packProps = { styles, id: nodeId, setStyle, replaceStyle, roles: viewRoles as never };
  const open = gateOpen(spec);

  /* ── the collection (§4) ── */
  // Only the WIDGET layer shows the item list; an item does not contain itself.
  const col = selItem ? undefined : collection;
  const items = allItems;

  /* ⚠️ A new item is appended, SELECTED and its drawer OPENED (§4.1) — you type into the new thing
     rather than hunting for it — and it arrives with realistic copy, never `Untitled`. */
  const addItem = (extra?: Cfg) => {
    if (!col) return;
    const id = `${Date.now().toString(36)}${items.length}`;
    /* ⚠️ A blank row where the collection asked for one — every declared field emptied, so the
       inline editor opens waiting for YOUR words rather than carrying an example you now have to
       select and delete. The seeds still fill the DEFAULT items, which is what they are for. */
    const seeded = col.blankOnAdd
      ? Object.fromEntries(col.fields.map((f) => [f.key, '']))
      : col.seed(items.length);
    const item = { id, ...seeded, ...extra };
    setCfg({ [col.key]: [...items, item] });
    /* ⚠️ No redirect when the row has an inline editor. Selecting the item swapped the whole sidebar
       for its drawer — you asked for one more row and the panel you were working in disappeared.
       The list opens the new row in place instead. A collection with no inline editor still needs
       somewhere to go, so it keeps the old behaviour. */
    const inlineEditable = !col.noOpen && col.fields.length >= 2;
    if (!inlineEditable) onSelect(itemNodeId(nodeId, id));
  };

  const bulkAdd = (srcs: string[]) => {
    if (!col) return;
    const room = col.max ? Math.max(0, col.max - items.length) : srcs.length;
    const take = srcs.slice(0, room);
    const added = take.map((src, i) => ({ id: `${Date.now().toString(36)}b${i}`, ...col.seed(items.length + i), src }));
    setCfg({ [col.key]: [...items, ...added] });
    if (take.length < srcs.length) toast.error(`Added ${take.length} — this gallery holds ${col.max}`);
  };

  /* Item names come from the item's own text (§2.1), registered so the canvas chip and the
     breadcrumb say "How do I reset my password?" rather than "Item 2". */
  /* ⚠️ The WIDGET's node, not the selected one. While an item or a sub-element is selected `nodeId`
     is that deeper node, and building item ids off it produces `el-1~i0~a~i…` — a node that does
     not exist. Item ids always hang off the widget. */
  const widgetNode = parsed?.widget ?? nodeId;

  if (collection) {
    allItems.forEach((it, i) => {
      const inode = itemNodeId(widgetNode, it.id);
      registerItemName(inode, collection.label(it, i) || `Item ${i + 1}`);
      // ⚠️ Sub-elements too, or the Answer drawer is titled `a` — the raw config key, which names
      // nothing an editor recognises.
      collection.subElements?.forEach((se) => registerItemName(subNodeId(inode, se.key), se.name));
    });
  }

  /* §1.4 — the item list belongs INSIDE Content, in both panel models. Built once here so the
     accordion panel and the packs panel cannot drift into two different lists. */
  const collectionBlock = (
    <>
              {col && (!col.when || col.when(cfg)) && (
                <FlatOrGroup
                  flat={col.flat === true}
                  title={col.group}
                  open={openGroups.includes(col.group)}
                  onToggle={() => toggleGroup(col.group)}
                  badge={<span className="text-[11px] text-[#9CA3AF]">{items.length}{col.max ? ` / ${col.max}` : ''}</span>}
                >
                  {/* Child blocks are ordinary widgets, so the Add action asks WHICH — a card can hold
                      a Text, an Image or a Button, and they are genuinely different things. */}
                  {col.childTypes && (
                    <div className="mb-1 flex gap-1.5">
                      {col.childTypes.map((ct) => (
                        <button
                          key={ct.type}
                          onClick={() => addItem({ type: ct.type })}
                          className="h-7 flex-1 rounded border border-[#DFE5ED] bg-white text-[12px] font-medium text-[#364658] transition-colors hover:border-[#3D8BD0] hover:text-[#3D8BD0]"
                        >+ {ct.label}</button>
                      ))}
                    </div>
                  )}
                  <PortalItemList
                    items={items as never}
                    label={(it, i) => col.label(it as Cfg, i)}
                    meta={col.meta ? (it, i) => col.meta!(it as Cfg, i) : undefined}
                    /* Derived, not declared: the item's first two fields ARE its title and its
                       description, so a collection gets inline editing without restating them. */
                    noOpen={col.noOpen}
                    inlineKeys={col.noOpen || col.fields.length < 2 ? undefined : [col.fields[0].key, col.fields[1].key]}
                    inlineCta={col.inlineCta}
                    inlinePlaceholders={col.fields.length >= 2 ? [col.fields[0].placeholder, col.fields[1].placeholder] : undefined}
                    inlineLabels={col.fields.length >= 2 ? [col.fields[0].label, col.fields[1].label] : undefined}
                    /* An accordion item is a title and a body — both are inline, so the chevron
                       would open a drawer showing the two fields already in front of you. */
                    /* ⚠️ The right arrow is HIDDEN wherever the row has an inline editor, not only
                       where that editor happens to cover every field. It opened the item's own
                       drawer, which replaced the whole panel you were working in — the same swap the
                       Add-item fix removed, reached by a different button. What the inline editor
                       does not cover is reachable another way: the "+ Add link" CTA at its foot, and
                       the item's own text nodes by clicking them on the canvas.
                       ⚠️ A collection with NO inline editor keeps the arrow. It is the only way into
                       those items, and removing it would strand them. */
                    inlineCoversAll={!col.noOpen && col.fields.length >= 2}
                    hideable={col.hideable}
                    noAdd={col.noAdd}
                    /* §7.24 — the logo cannot be hidden, and the action is DISABLED with the reason
                       rather than removed: absent would leave someone hunting for it. */
                    lockedHide={(it) => (it.fixedVisible ? `The ${String(it.name)} always shows — a bar without it is not the product’s bar` : undefined)}
                    max={col.max}
                    addLabel={col.addLabel}
                    emptyHint={col.emptyHint}
                    onOpen={(it) => onSelect(itemNodeId(nodeId, it.id))}
                    onChange={(next) => setCfg({ [col.key]: next })}
                    onAdd={() => addItem()}
                  />
                  {col.bulkAdd && <BulkAdd onFiles={(srcs) => bulkAdd(srcs)} />}
                </FlatOrGroup>
              )}
    </>
  );

  /* Everything that can appear under the CONTENT eyebrow in the PACKS model, in one test — the
     spec's own content groups, a table row's Cells block, and the §4 collection.
     ⚠️ NOT `!!collectionBlock`: that const is a JSX fragment and is therefore always truthy,
     empty or not. The real test is the same condition the fragment wraps its own contents in. */
  const hasPacksContent = groupsFor('content').length > 0
    || !!(col && (!col.when || col.when(cfg)))
    || !!(selItem && collection?.isTableRow);

  return (
    <div className="flex h-full flex-col">
      {/* ── header ── */}
      <div className="flex-shrink-0 border-b border-[#F0F2F5] px-4 pb-0 pt-3">
        {/* ⚠️ No breadcrumb trail above the title. Stepping up to the parent survives as the back
            arrow ON the title row — one control instead of a row of ancestors that mostly repeated
            what the canvas already shows selected. */}
        {/* ⚠️ No back arrow, at any depth. Stepping up is what clicking the parent on the CANVAS
            already does, and the arrow only ever appeared on nested selections — so the header
            shifted position depending on how deep you were, which is the one thing a header should
            not do. Icon and title, left-aligned, always in the same place. */}
        <div className="mb-3 mt-0.5 flex items-center gap-2">
          <span className="flex size-8 flex-shrink-0 items-center justify-center rounded bg-[#EBF5FF] text-[#3D8BD0]">
            {NODE_ICON[node.kind] ?? <Layers size={16} />}
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-1.5">
              <span className="truncate text-[14px] font-semibold text-[#364658]">{node.name}</span>
              {cfg.hidden === true && <Badge>Hidden</Badge>}
              {!open && <Badge>Locked</Badge>}
            </span>
            {/* ⚠️ Only when it ADDS something. "Contact Us / Contact Us" is the same words twice,
                the second greyed as if it were a description. */}
            {spec.name.trim().toLowerCase() !== node.name.trim().toLowerCase() && (
              <span className="block text-[12px] text-[#7B8FA5]">{spec.name}</span>
            )}
          </span>
          {/* ⚠️ Reset sits with the NAME of what it resets. Above the header it read as a panel
              control — "reset the sidebar" — when it has always been about this one element. */}
          {/* ⚠️ Plain `title`, not the Radix Tooltip — this file never imported it, and a missing
              component in JSX is a runtime ReferenceError that builds clean and blanks the page. */}
          {onReset && (
            <button
              onClick={onReset}
              title="Reset this element to default"
              className="flex size-8 flex-shrink-0 items-center justify-center rounded text-[#64748B] transition-colors hover:bg-[#F3F4F6] hover:text-[#364658]"
            ><RotateCcw size={15} /></button>
          )}
        </div>

      </div>

      {/* ── body ── */}
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-10 pt-1">
        {/* §8.1 — the drawer must say WHICH kind of gate, because only one of them is the editor's
            to fix. A permission gets a link; a licence deliberately does not. */}
        {!open && spec.gate && (
          <Note
            tone="warn"
            action={spec.gate.kind === 'permission' && spec.gate.section
              ? { label: 'Open that setting', onClick: () => props.onOpenSetting?.(spec.gate!.section!) }
              : undefined}
          >{GATE_COPY[spec.gate.kind](spec.gate.setting)}</Note>
        )}
        {cfg.hidden === true && (
          <Note tone="warn">This widget is hidden from requesters. It stays on the page so you can put it back — nothing was removed.</Note>
        )}

        {/* ⚠️ Spec notes are NOT rendered at all. A standing explanation on every widget stops
            being read after the second time and pushes the first real control below the fold.
            What survives is only what is CONDITIONAL and carries a consequence: a closed gate
            and a hidden widget, both above, and the per-field blank-alt-text warning. */}

        {/* ⚠️ ONE scroll, not two tabs. Content and styling are the same job — you write a title and
            then you decide how it looks — and putting them behind tabs made the second half feel
            like a different screen you had to remember to visit. The section headers below are the
            only separation they need. */}
        {/* ── the NEW-ELEMENT accordion model ──────────────────────────────
            Content first and always open, then only the accordions this element needs, in panel
            order, with one opening by default. Blank in the coverage matrix means ABSENT. */}
        {spec.panel && !parsed ? (
          <PanelBody
            spec={spec}
            nodeId={nodeId}
            cfg={viewCfg}
            renderField={renderField}
            openGroups={openGroups}
            toggleGroup={toggleGroup}
            styles={styles}
            setStyle={setStyle}
            replaceStyle={replaceStyle}
            collectionSlot={collectionBlock}
            hasCollection={!!(col && (!col.when || col.when(cfg)))}
          />
        ) : (
        <>
        {hasPacksContent && (
          <SectionLabel action={<ExpandAll keys={groupsFor('content').map((g) => g.group)} openGroups={openGroups} setOpen={setOpenGroups} />}>Content</SectionLabel>
        )}
        {hasPacksContent && noteBlock('content')}
        {hasPacksContent && (
          <>
            {groupsFor('content').map(({ group, fields }) => (
              /* ⚠️ A lone group named after its section renders BARE. "CONTENT" above "Content"
                 said the same word twice, and the chevron beneath the eyebrow offered to collapse
                 the whole section it had just introduced. Only when it is the ONLY group: with two
                 or more, the names are telling you which is which and have to stay. */
              groupsFor('content').length === 1 && /^content$/i.test(group) ? (
                <div key={group}>{fields.map(renderField)}</div>
              ) : (
                <Group key={group} title={group} open={openGroups.includes(group)} onToggle={() => toggleGroup(group)}>
                  {fields.map(renderField)}
                </Group>
              )
            ))}
            {/* The §4 collection, when this widget has one and the state calls for it. */}
            {/* ⚠️ No Parts list. Every part is already reachable by CLICKING it on the canvas —
                that is what `subElements` wrap themselves in `<Sel>` for — so the list was a second
                route to the same place, taking a whole section to say what pointing at the words
                says faster. */}
            {/* Table rows edit their cells rather than a field list. */}
            {selItem && collection?.isTableRow && (
              <Group title="Cells" open={openGroups.includes('Cells')} onToggle={() => toggleGroup('Cells')}>
                {((selItem.cells as string[]) ?? []).map((cell, ci) => (
                  <Field key={ci} label={`Column ${ci + 1}`}>
                    <TextField
                      value={cell}
                      onChange={(v) => patchItem({ cells: ((selItem.cells as string[]) ?? []).map((c, j) => (j === ci ? v : c)) })}
                    />
                  </Field>
                ))}
              </Group>
            )}

            {/* ⚠️ The SECOND place the collection is rendered — the packs path, and the one FAQ and
                every other spec-with-packs actually takes. The same gap was fixed in `PanelBody`
                first and nothing moved on screen, because that branch serves a different set of
                widgets. Worth remembering: `collectionBlock` has two call sites, so a change to one
                is a change to half the panels.
                ⚠️ Air ONLY when the fields above rendered BARE. A lone group named "Content" renders
                as a plain field list (see the note above), so the collection follows an INPUT and
                needs the same 16px one field takes from another. When those fields rendered as
                `Group` rows instead, the collection is one more full-bleed row in a list of rows,
                and a gap there would break the run of rules rather than separate two things. */}
            {(() => {
              const cg = groupsFor('content');
              /* Air unless a run of NAMED `Group` rows sits directly above — the one case where the
                 collection is another row in that run rather than a thing after something else.
                 Two ways in: bare fields above it (FAQ — a lone group named "Content" renders as a
                 plain field list), or nothing above it at all (Accordion — `fields: []`, so the
                 group landed 4px under the CONTENT eyebrow and read as jammed against it). */
              const bare = cg.length === 1 && /^content$/i.test(cg[0].group);
              return cg.length === 0 || bare
                ? <div className="mt-4">{collectionBlock}</div>
                : collectionBlock;
            })()}
          </>
        )}

        {/* Design owns the spec groups AND every pack, plus the shared Spacing block. */}
        {/* ⚠️ The whole Design section is DROPPED when a widget has nothing to put in it. An empty
            heading over a Spacing block is a section that exists to hold a label. */}
        {/* ⚠️ ACTION sits between Content and Design — what the thing SAYS, then where it GOES,
            then how it LOOKS. It is dropped entirely when a widget has no destination, so the
            heading never appears over nothing. Rendered bare when it is one group named "Action",
            for the same reason Content is. */}
        {groupsFor('action').length > 0 && (
          <>
            <SectionLabel>Action</SectionLabel>
            {groupsFor('action').map(({ group, fields }) => (
              groupsFor('action').length === 1 && /^action$/i.test(group) ? (
                <div key={group}>{fields.map(renderField)}</div>
              ) : (
                <Group key={group} title={group} open={openGroups.includes(group)} onToggle={() => toggleGroup(group)}>
                  {fields.map(renderField)}
                </Group>
              )
            ))}
          </>
        )}

        {/* ⚠️ Design is dropped ENTIRELY — heading and body — when a widget has nothing to style.
            Gating only the heading left the shared Spacing block floating under Content, which reads
            as a content setting and is the one thing it is not. */}
        {(groupsFor('style').length > 0 || (viewPacks ?? []).length > 0) && (
          <SectionLabel action={<ExpandAll keys={[...groupsFor('style').map((g) => g.group), ...(viewPacks ?? []), '__spacing']} openGroups={openGroups} setOpen={setOpenGroups} />}>Design</SectionLabel>
        )}
        {(groupsFor('style').length > 0 || (viewPacks ?? []).length > 0) && (
          <>
            {/* Widget-specific styling first — it is what this widget is, before the generic packs. */}
            {/* ⚠️ A pack whose TITLE matches a spec group is rendered INSIDE that group rather than
                beside it. Row layout is a content-config field but belongs under Arrangement with
                the gap and the dividers; without this merge the panel showed two sections both
                called "Arrangement", which is worse than either placement. */}
            {groupsFor('style').map(({ group, fields }) => {
              const merged = (viewPacks ?? []).filter((pk) => ALL_PACKS[pk]?.title === group);
              return (
                <Group key={group} title={group} open={openGroups.includes(group)} onToggle={() => toggleGroup(group)}>
                  {fields.map(renderField)}
                  {merged.map((pk) => {
                    const P = ALL_PACKS[pk];
                    return <P.Render key={pk} {...packProps} />;
                  })}
                </Group>
              );
            })}
            {(viewPacks ?? []).map((pk) => {
              const pack = ALL_PACKS[pk];
              // Already drawn inside the spec group that shares its title.
              if (!pack || groupsFor('style').some((g) => g.group === pack.title)) return null;
              /* ⚠️ P8 (Empty state) is drawn AFTER Spacing instead — see below. */
              if (pk === 'P8') return null;
              return (
                <Group
                  key={pk}
                  title={pack.title}
                  open={openGroups.includes(pk)}
                  onToggle={() => toggleGroup(pk)}
                >
                  <pack.Render {...packProps} />
                </Group>
              );
            })}
            {/* ⚠️ Every widget gets the SAME Spacing section, whichever styling model it uses. The
                packs-model widgets had padding buried inside the Style pack as a lone slider, so
                "spacing" meant two different controls depending on which element you had selected.
                One nested-box matrix, one place, everywhere. */}
            <Group
              title="Spacing"
              open={openGroups.includes('__spacing')}
              onToggle={() => toggleGroup('__spacing')}
            >
              <SpacingMatrix style={styles[nodeId] ?? {}} onChange={(p) => setStyle(nodeId, p)} />
            </Group>
            {/* ⚠️ Empty state renders AFTER Spacing, which is why it is filtered out of groupsFor.
                It is the answer to "what does this show when there is nothing to show" — a state the
                admin visits once, not while they are laying the widget out. */}
            {(viewPacks ?? []).includes('P8') && ALL_PACKS.P8 && (
              <Group
                title={ALL_PACKS.P8.title}
                open={openGroups.includes('P8')}
                onToggle={() => toggleGroup('P8')}
              >
                <ALL_PACKS.P8.Render {...packProps} />
              </Group>
            )}
          </>
        )}
        </>
        )}
      </div>
      {bannerPick && (
        <PortalBannerPicker
          anchor={bannerPick.anchor}
          value={cfg[bannerPick.key] as string | undefined}
          onPick={(b) => setCfg({ [bannerPick.key]: b.src })}
          onUpload={bannerPick.chooseFile}
          onClose={() => setBannerPick(null)}
        />
      )}
    </div>
  );
}
