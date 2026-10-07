import { useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useFirstAccordionOpen } from './PortalControls';
import {
  AlignCenter, AlignLeft, AlignRight, ChevronDown, ChevronLeft, ChevronRight, Layers, Link2, List, PanelLeft,
  Plus, RotateCcw, Rows3, Search, Square, Trash2, Type,
} from 'lucide-react';
import {
  REQUEST_SCOPES, REQUEST_STATUSES, nodeById, nodePath, placedType,
} from './portalPageModel';
import { IconField } from './PortalIconPicker';
import type { IconChoice } from './PortalIconPicker';
import type { NodeStyle, PortalPageContent, PortalStyles } from './portalPageModel';
import { SpacingMatrix } from './SpacingMatrix';
import { ColorField } from './PortalColorPicker';

/* The selected element's editor.
 *
 * One scroll, two labelled sections: CONTENT (what this element shows) then STYLE (how it looks).
 * Content fields are wired straight to the page content the canvas renders, so an edit is visible
 * immediately — a control that looks right but changes nothing teaches people to distrust the panel.
 */

interface Props {
  nodeId: string;
  content: PortalPageContent;
  setContent: (patch: (c: PortalPageContent) => PortalPageContent) => void;
  styles: PortalStyles;
  setStyle: (id: string, patch: Partial<NodeStyle>) => void;
  onSelect: (id: string | null) => void;
  /** Per-placed-element icon + text, kept by the builder so the canvas can render them. */
  icons: Record<string, IconChoice | undefined>;
  setIcon: (id: string, c?: IconChoice) => void;
  placedText: Record<string, { title?: string; desc?: string }>;
  setPlacedText: (id: string, patch: { title?: string; desc?: string }) => void;
  /** The floating toolbar's design controls for this node, drawn at the top of Style. */
  quickDesign?: (part: 'lead' | 'look') => ReactNode;
}

/* ── shared field chrome ─────────────────────────────────────────────────── */

const inputCls = 'h-9 w-full rounded border border-[#d1d5db] bg-white px-3 text-[13px] text-[#364658] placeholder:text-[#9ca3af] focus:border-[#3D8BD0] focus:outline-none focus:ring-1 focus:ring-[#3D8BD0]';

const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="mt-4 first:mt-0">
    <div className="mb-1 text-[12px] font-normal text-[#7B8FA5]">{label}</div>
    {children}
  </div>
);

const SectionHead = ({ children, action }: { children: ReactNode; action?: ReactNode }) => (
  <div className="mb-1 flex items-center justify-between gap-2">
    <span className="text-[11px] font-semibold uppercase tracking-wider text-[#7B8FA5]">{children}</span>
    {action}
  </div>
);

function Check({ label, on, onChange }: { label: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 py-1.5">
      <input
        type="checkbox"
        checked={on}
        onChange={(e) => onChange(e.target.checked)}
        className="size-4 cursor-pointer rounded border-[#d1d5db] text-[#3D8BD0] focus:ring-[#3D8BD0] focus:ring-offset-0"
      />
      <span className="text-[13px] text-[#364658]">{label}</span>
    </label>
  );
}

/* The style drawers, in panel order.
 *
 * ⚠️ They are INDEPENDENT, not a one-at-a-time accordion: styling an element means moving between
 * layout, colour and spacing on the same thought, and a drawer that shuts the one you were reading
 * to open the next makes you re-open it every time. Any number can be open at once, and the head's
 * toggle opens or shuts all three in one go. Layout starts open — the first drawer answers the
 * commonest question, and an all-collapsed panel looks like it has nothing in it. */
const DRAWERS = ['Layout', 'Style', 'Spacing'] as const;

/** Collapsible style drawer, matching Duda's Layout / Style / Spacing accordions. */
function Drawer({ title, children, open, onToggle }: { title: string; children: ReactNode; open: boolean; onToggle: () => void }) {
  return (
    <div className="border-t border-[#F0F2F5] first:border-t-0">
      <button onClick={onToggle} data-acc="" aria-expanded={open} className="flex w-full items-center justify-between py-3 text-left">
        <span className="text-[13px] font-medium text-[#364658]">{title}</span>
        <ChevronDown size={15} className={`text-[#9CA3AF] transition-transform ${open ? '' : '-rotate-90'}`} />
      </button>
      {open && <div className="pb-4">{children}</div>}
    </div>
  );
}

const NODE_ICON: Record<string, ReactNode> = {
  section: <Rows3 size={16} />, card: <Square size={16} />, text: <Type size={16} />,
  list: <List size={16} />, nav: <Link2 size={16} />, search: <Search size={16} />,
  rail: <PanelLeft size={16} />,
};

/** Which content field a text node edits. Keeps the mapping in one readable place. */
const TEXT_BINDING: Record<string, [keyof PortalPageContent, string]> = {
  'hero-title': ['hero', 'title'],
  'hero-subtitle': ['hero', 'subtitle'],
  'requests-title': ['requests', 'title'],
  'approvals-title': ['approvals', 'title'],
  'knowledge-title': ['knowledge', 'title'],
};

export function PortalElementPanel({ nodeId, content, setContent, styles, setStyle, onSelect, icons, setIcon, placedText, setPlacedText, quickDesign }: Props) {
  const node = nodeById(nodeId);
  const path = nodePath(nodeId);
  const [openDrawers, setOpenDrawers] = useState<string[]>(['Layout']);
  const toggleDrawer = (t: string) =>
    setOpenDrawers((o) => (o.includes(t) ? o.filter((x) => x !== t) : [...o, t]));

  const rootRef = useRef<HTMLDivElement>(null);
  useFirstAccordionOpen(rootRef, nodeId);

  if (!node) return null;
  const s: NodeStyle = styles[nodeId] ?? {};
  const patch = (p: Partial<NodeStyle>) => setStyle(nodeId, p);
  /** Bands that own a surface get "Background"; everything else gets "Color". */
  const isSurface = node.kind === 'section' || node.kind === 'column' || node.kind === 'card';
  /** Only things that draw a box can take a radius or a border. */
  const canHaveBox = isSurface || node.kind === 'list' || node.kind === 'search';

  /* ── content editors ── */
  const contentEditor = (() => {
    switch (node.content) {
      case 'hero':
        return (
          <>
            <Field label="Heading">
              <input className={inputCls} value={content.hero.title}
                onChange={(e) => setContent((c) => ({ ...c, hero: { ...c.hero, title: e.target.value } }))} />
            </Field>
            <Field label="Subtitle">
              <input className={inputCls} value={content.hero.subtitle}
                onChange={(e) => setContent((c) => ({ ...c, hero: { ...c.hero, subtitle: e.target.value } }))} />
            </Field>
            <Field label="Search placeholder">
              <input className={inputCls} value={content.hero.placeholder}
                onChange={(e) => setContent((c) => ({ ...c, hero: { ...c.hero, placeholder: e.target.value } }))} />
            </Field>
            <div className="mt-4">
              <Check label="Show search field" on={content.hero.showSearch}
                onChange={(v) => setContent((c) => ({ ...c, hero: { ...c.hero, showSearch: v } }))} />
            </div>
          </>
        );

      case 'search':
        return (
          <Field label="Placeholder">
            <input className={inputCls} value={content.hero.placeholder}
              onChange={(e) => setContent((c) => ({ ...c, hero: { ...c.hero, placeholder: e.target.value } }))} />
          </Field>
        );

      case 'text': {
        const bind = TEXT_BINDING[nodeId];
        if (!bind) return <p className="text-[13px] text-[#7B8FA5]">This text is set by the block it belongs to.</p>;
        const [group, key] = bind;
        const value = (content[group] as Record<string, unknown>)[key] as string;
        return (
          <Field label="Text">
            <textarea
              rows={3}
              className={`${inputCls} h-auto py-2 leading-[1.5]`}
              value={value}
              onChange={(e) => setContent((c) => ({ ...c, [group]: { ...(c[group] as object), [key]: e.target.value } }))}
            />
          </Field>
        );
      }

      case 'requests':
        return (
          <>
            <Field label="Statuses">
              <div className="rounded border border-[#E5E7EB] px-3 py-1">
                {REQUEST_STATUSES.map((st) => (
                  <Check
                    key={st}
                    label={st}
                    on={content.requests.statuses.includes(st)}
                    onChange={(v) => setContent((c) => ({
                      ...c,
                      requests: {
                        ...c.requests,
                        statuses: v ? [...c.requests.statuses, st] : c.requests.statuses.filter((x) => x !== st),
                      },
                    }))}
                  />
                ))}
              </div>
            </Field>
            <Field label="Scope">
              <select className={`${inputCls} app-select`} value={content.requests.scope}
                onChange={(e) => setContent((c) => ({ ...c, requests: { ...c.requests, scope: e.target.value } }))}>
                {REQUEST_SCOPES.map((sc) => <option key={sc}>{sc}</option>)}
              </select>
            </Field>
            <Field label="Show">
              <input type="number" min={1} max={10} className={inputCls} value={content.requests.show}
                onChange={(e) => setContent((c) => ({ ...c, requests: { ...c.requests, show: Math.max(1, Math.min(10, Number(e.target.value) || 1)) } }))} />
            </Field>
          </>
        );

      case 'approvals':
      case 'knowledge': {
        const key = node.content as 'approvals' | 'knowledge';
        const max = key === 'approvals' ? 2 : 3;
        return (
          <>
            <Field label="Title">
              <input className={inputCls} value={content[key].title}
                onChange={(e) => setContent((c) => ({ ...c, [key]: { ...c[key], title: e.target.value } }))} />
            </Field>
            <Field label="Show">
              <input type="number" min={1} max={max} className={inputCls} value={content[key].show}
                onChange={(e) => setContent((c) => ({ ...c, [key]: { ...c[key], show: Math.max(1, Math.min(max, Number(e.target.value) || 1)) } }))} />
            </Field>
          </>
        );
      }

      case 'assets':
      case 'cis': {
        const key = node.content as 'assets' | 'cis';
        return (
          <Field label="Title">
            <input className={inputCls} value={content[key].title}
              onChange={(e) => setContent((c) => ({ ...c, [key]: { ...c[key], title: e.target.value } }))} />
          </Field>
        );
      }

      case 'row':
        return (
          <>
            <ColumnsField
              value={content.cols.work}
              onChange={(n) => setContent((c) => ({ ...c, cols: { ...c.cols, work: n } }))}
            />
            <p className="mt-3 text-[12px] leading-[1.5] text-[#7B8FA5]">
              This row spans the full page width. Select a card inside it to edit that card.
            </p>
          </>
        );

      case 'quickActions':
        return (
          <>
          <ColumnsField
            value={content.cols.quick}
            onChange={(n) => setContent((c) => ({ ...c, cols: { ...c.cols, quick: n } }))}
          />
          <Field label="Cards">
            <div className="space-y-1.5">
              {content.quick.map((card) => (
                <button
                  key={card.id}
                  onClick={() => onSelect(card.id)}
                  className="flex w-full items-center justify-between rounded border border-[#E5E7EB] px-3 py-2 text-left transition-colors hover:border-[#3D8BD0]"
                >
                  <span className="truncate text-[13px] text-[#364658]">{card.title}</span>
                  <ChevronRight size={14} className="flex-shrink-0 text-[#9CA3AF]" />
                </button>
              ))}
            </div>
            <p className="mt-2 text-[12px] leading-[1.5] text-[#7B8FA5]">Select a card to edit its title and description.</p>
          </Field>
          </>
        );

      /* A dropped element starts blank — its editor is whatever that element type needs. Services
         and the action tiles carry an icon, which is the field a new service actually needs. */
      case 'placed': {
        const type = placedType(nodeId);
        const wantsIcon = type === 'c-services' || type === 'c-categories' || type === 'x-action-card'
          || type === 'x-action-icon' || type === 'v-icon' || type === 'c-contact';
        return (
          <>
            {wantsIcon && (
              <Field label="Icon">
                <IconField value={icons[nodeId]} onChange={(c) => setIcon(nodeId, c)} />
              </Field>
            )}
            <Field label="Title">
              <input className={inputCls} placeholder="Untitled" value={placedText[nodeId]?.title ?? ''}
                onChange={(e) => setPlacedText(nodeId, { title: e.target.value })} />
            </Field>
            <Field label="Description">
              <input className={inputCls} placeholder="Add a description" value={placedText[nodeId]?.desc ?? ''}
                onChange={(e) => setPlacedText(nodeId, { desc: e.target.value })} />
            </Field>
            <p className="mt-3 text-[12px] leading-[1.5] text-[#7B8FA5]">
              This element was just placed, so it has no data or styling yet — both are yours to set.
            </p>
          </>
        );
      }

      case 'actionCard': {
        const card = content.quick.find((c) => c.id === nodeId);
        if (!card) return null;
        const setCard = (p: Partial<typeof card>) => setContent((c) => ({
          ...c, quick: c.quick.map((q) => (q.id === nodeId ? { ...q, ...p } : q)),
        }));
        return (
          <>
            {/* An action card IS a service tile — the icon is the first thing you change when a
                new service is stood up, so it leads the group. */}
            <Field label="Icon">
              <IconField value={icons[nodeId]} onChange={(c) => setIcon(nodeId, c)} />
            </Field>
            <Field label="Title"><input className={inputCls} value={card.title} onChange={(e) => setCard({ title: e.target.value })} /></Field>
            <Field label="Description"><input className={inputCls} value={card.desc} onChange={(e) => setCard({ desc: e.target.value })} /></Field>
          </>
        );
      }

      default:
        return <p className="text-[13px] leading-[1.6] text-[#7B8FA5]">This element has no content of its own — style it below.</p>;
    }
  })();

  const isText = node.kind === 'text';
  /* ⚠️ Expand all must offer the drawers this element actually HAS. Text has no Style drawer, so
     including it here left the button stuck reading 'Expand all' with everything already open. */
  const myDrawers = DRAWERS.filter((d) => d !== 'Style' || !isText);
  const allOpen = myDrawers.every((d) => openDrawers.includes(d));

  return (
    <div ref={rootRef} className="flex h-full flex-col">
      {/* Element header — icon, name, and what this panel edits.
          ⚠️ No breadcrumb and no back arrow — matching the widget drawer, so the two panels do not
          head themselves differently. Stepping up is clicking the parent on the canvas. */}
      <div className="flex-shrink-0 border-b border-[#F0F2F5] px-4 pb-3 pt-4">
        <div className="flex items-center gap-2">
          <span className="flex size-8 flex-shrink-0 items-center justify-center rounded bg-[#EBF5FF] text-[#3D8BD0]">
            {NODE_ICON[node.kind] ?? <Layers size={16} />}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[14px] font-semibold text-[#364658]">{node.name}</span>
            <span className="block text-[12px] text-[#7B8FA5]">Content &amp; data</span>
          </span>
          {/* ⚠️ Reset lives BESIDE THE NAME, the same place and the same glyph as every widget
              drawer. It was a blue text link at the foot of the Spacing accordion — a different
              shape, in a different place, reading as "reset the spacing" when it clears the whole
              element. Two panels that reset differently are two panels you have to learn. */}
          <button
            onClick={() => patch({ margin: undefined, padding: undefined, radius: undefined, bg: undefined, align: undefined, color: undefined, fontSize: undefined, bold: undefined, italic: undefined, underline: undefined, heading: undefined })}
            title="Reset this element to default"
            className="flex size-8 flex-shrink-0 items-center justify-center rounded text-[#64748B] transition-colors hover:bg-[#F3F4F6] hover:text-[#364658]"
          ><RotateCcw size={15} /></button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-8 pt-4">
        <div>
          <SectionHead>Content</SectionHead>
          {contentEditor}
        </div>

        <div className="mt-7">
          <SectionHead
            action={(
              <button
                onClick={() => setOpenDrawers(allOpen ? [] : [...myDrawers])}
                className="text-[12px] font-medium normal-case tracking-normal text-[#3D8BD0] hover:underline"
              >{allOpen ? 'Collapse all' : 'Expand all'}</button>
            )}
          >Style</SectionHead>

          {/* The floating toolbar's own controls, first — the same ones the toolbar offers this node. */}
          {quickDesign?.('lead')}
          {quickDesign?.('look')}

          {/* ⚠️ The Layout drawer is gone. Its only row was Alignment, and the floating toolbar over
              the selected words carries left / centre / right where you can see them act — a second
              copy in the panel meant two controls for one value, and the one you were not looking at
              won the last write. Spacing stays: it positions the text BLOCK, which the toolbar does
              not touch. */}

          {/* ⚠️ A TEXT node gets no Style drawer at all. Its only style rows were Text style and
              Text colour, and both live on the floating toolbar over the selected words — the same
              control in two places is two places to change one thing, and they drift. Layout and
              Spacing stay: they position the text BLOCK, which the toolbar does not touch. */}
          {!isText && (
          <Drawer title="Style" open={openDrawers.includes('Style')} onToggle={() => toggleDrawer('Style')}>
            {/* A section takes a BACKGROUND; a leaf element takes a COLOUR. Same picker,
                different word, because they are different intentions. */}
            <Field label={isSurface ? 'Background colour' : 'Colour'}>
              <ColorField value={s.bg ?? '#FFFFFF'} onChange={(v) => patch({ bg: v })} />
            </Field>

            {/* Radius and border only reach elements that actually draw a box. Offering them on
                a nav row or a rail would be settings that do nothing. */}
            {canHaveBox && (
              <>
                <div className="mt-5"><RadiusControl style={s} onChange={patch} /></div>
                <div className="mt-5"><BorderControl style={s} onChange={patch} /></div>
              </>
            )}
          </Drawer>
          )}

          <Drawer title="Spacing" open={openDrawers.includes('Spacing')} onToggle={() => toggleDrawer('Spacing')}>
            <SpacingMatrix style={s} onChange={patch} />
          </Drawer>
        </div>
      </div>
    </div>
  );
}

/** A row's layout: how many columns it splits into. Rendered as the shape, not a number. */
function ColumnsField({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <Field label="Layout">
      <div className="flex gap-1.5">
        {[1, 2, 3, 4].map((n) => (
          <button
            key={n}
            onClick={() => onChange(n)}
            title={`${n} column${n > 1 ? 's' : ''}`}
            className={`flex h-9 flex-1 items-center justify-center gap-[3px] rounded border px-2 transition-colors ${
              value === n ? 'border-[#3D8BD0] bg-[#EBF5FF]' : 'border-[#DFE5ED] bg-white hover:bg-[#F5F7FA]'
            }`}
          >
            {Array.from({ length: n }).map((_, i) => (
              <span key={i} className={`h-4 flex-1 rounded-[1px] border ${value === n ? 'border-[#3D8BD0]' : 'border-[#94A3B8]'}`} />
            ))}
          </button>
        ))}
      </div>
    </Field>
  );
}

/* Corner radius — one number when the corners agree, four when they don't.
 *
 * The preview square is the control's own answer to "what will this look like": it renders the
 * radius live, so you judge the shape rather than the number. */
function RadiusControl({ style, onChange }: { style: NodeStyle; onChange: (p: Partial<NodeStyle>) => void }) {
  const all = style.radius ?? 8;
  const c = style.corners;
  const [perCorner, setPerCorner] = useState(!!c);

  const set = (key: keyof NonNullable<NodeStyle['corners']>, v: number) => {
    const next = { tl: all, tr: all, br: all, bl: all, ...(c ?? {}), [key]: Math.max(0, Math.min(48, v)) };
    onChange({ corners: next });
  };
  const val = (key: 'tl' | 'tr' | 'br' | 'bl') => c?.[key] ?? all;

  const box = 'h-8 w-full rounded border border-[#d1d5db] px-2 text-center text-[12px] text-[#364658] focus:border-[#3D8BD0] focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none';

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[12px] font-medium text-[#364658]">Corner radius</span>
        <button
          onClick={() => { setPerCorner((p) => !p); if (perCorner) onChange({ corners: undefined }); }}
          className="text-[12px] font-medium text-[#3D8BD0] hover:underline"
        >{perCorner ? 'All corners' : 'Per corner'}</button>
      </div>

      <div className="flex items-center gap-3">
        {/* Live shape preview — the point of a radius control is the silhouette. */}
        <span
          className="size-[52px] flex-shrink-0 border-2 border-[#3D8BD0] bg-[#EBF5FF]"
          style={{
            borderTopLeftRadius: val('tl'), borderTopRightRadius: val('tr'),
            borderBottomRightRadius: val('br'), borderBottomLeftRadius: val('bl'),
          }}
        />
        {perCorner ? (
          <span className="grid flex-1 grid-cols-2 gap-1.5">
            {(['tl', 'tr', 'bl', 'br'] as const).map((k) => (
              <input key={k} aria-label={`${k} radius`} type="number" min={0} max={48} value={val(k)}
                onChange={(e) => set(k, Number(e.target.value) || 0)} className={box} />
            ))}
          </span>
        ) : (
          <span className="flex flex-1 items-center gap-2">
            <input
              type="range" min={0} max={48} value={all}
              onChange={(e) => onChange({ radius: Number(e.target.value), corners: undefined })}
              className="min-w-0 flex-1 accent-[#3D8BD0]"
            />
            <input
              aria-label="Corner radius" type="number" min={0} max={48} value={all}
              onChange={(e) => onChange({ radius: Math.max(0, Math.min(48, Number(e.target.value) || 0)), corners: undefined })}
              className={`${box} w-[52px] flex-shrink-0`}
            />
          </span>
        )}
      </div>
    </div>
  );
}

/** Border — width, style and colour on one line each, so it reads as one setting. */
function BorderControl({ style, onChange }: { style: NodeStyle; onChange: (p: Partial<NodeStyle>) => void }) {
  const w = style.borderWidth ?? 0;
  return (
    <div>
      <div className="mb-2 text-[12px] font-medium text-[#364658]">Border</div>
      <div className="flex items-center gap-2">
        <input
          aria-label="Border width" type="number" min={0} max={12} value={w}
          onChange={(e) => onChange({ borderWidth: Math.max(0, Math.min(12, Number(e.target.value) || 0)) })}
          className="h-9 w-[62px] flex-shrink-0 rounded border border-[#d1d5db] px-2 text-center text-[13px] text-[#364658] focus:border-[#3D8BD0] focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
        />
        <select
          aria-label="Border style"
          value={style.borderStyle ?? 'solid'}
          onChange={(e) => onChange({ borderStyle: e.target.value })}
          className={`${inputCls} app-select w-[92px] flex-shrink-0`}
        >
          {['solid', 'dashed', 'dotted'].map((v) => <option key={v}>{v}</option>)}
        </select>
        <span className="min-w-0 flex-1">
          <ColorField value={style.borderColor ?? '#E5E7EB'} onChange={(v) => onChange({ borderColor: v })} />
        </span>
      </div>
      {w === 0 && <p className="mt-1.5 text-[11px] text-[#9CA3AF]">Width 0 — no border is drawn.</p>}
    </div>
  );
}
