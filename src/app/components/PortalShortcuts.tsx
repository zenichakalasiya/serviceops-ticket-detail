import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Keyboard, X } from 'lucide-react';
import { useCanvas } from './PortalCanvas';
import { nodePath } from './portalPageModel';
import { TOOLBAR_KEYS, chromeKeys, tipsOf } from './portalShortcutKeys';
import type { ChromeAction, ToolbarAction } from './portalShortcutKeys';

/* Support Portal builder — keyboard shortcuts, and the sheet that lists them.
 *
 * ⚠️ ONE MODIFIER, ONE CLASS OF ACTION. That is the whole scheme, and it is what lets somebody guess
 * a key they have never pressed:
 *   bare letter   → a button on THIS widget's floating toolbar
 *   bare arrow    → move it (reorder among its siblings)
 *   Shift + arrow → resize it
 *   Alt   + arrow → change what is SELECTED
 *   Alt   + digit → the builder's own chrome (rail, panel)
 *   Ctrl/Cmd      → document verbs the OS already taught them
 * The letters are ordered the way the toolbar's own fences group its buttons — move it · place it ·
 * style it · remove it — so the sheet reads in the same order as the bar it describes.
 *
 * ⚠️ ALT IS FREE HERE, and that is not an accident worth forgetting: `DrawerShortcuts` owns the whole
 * Alt range across the product, but its handler opens with `if (!props.active) return` — a detail
 * drawer has to exist — and none does inside the Admin builder. If a drawer is ever rendered over
 * this surface, every Alt binding below collides.
 *
 * ⚠️ `/` AND `Ctrl+K` ARE NOT FREE and are deliberately unbound. `GlobalSearch` is mounted once by
 * `App` and answers on every page, this one included. `Alt+1` opens the Widgets panel and focuses
 * its own search instead.
 *
 * ⚠️ THERE IS NO SHORTCUT FOR PUBLISH. It changes what requesters see and can demote another portal
 * to Draft — the one action on this screen whose consequence is outside the page — so it keeps its
 * button. `Ctrl+S` (Save as draft) covers the reflex that reaches for a key. */

/* ── Reaching the toolbar ────────────────────────────────────────────────────────────────────────
 *
 * Every widget action is a CLICK on the real floating toolbar, found by its `data-tip`, rather than a
 * second call into the canvas context. Three reasons, and the middle one is the important one:
 *   · the bar is rendered for the selected node already, so there is nothing to look up;
 *   · a button EXISTS only when its action is legal — a move arrow is absent at the end of a row and
 *     on the wrong axis, Replace is absent where nothing can be swapped — so pressing a key that
 *     cannot apply is a no-op for free, with no second copy of the rules to keep in step;
 *   · it is the pattern `DrawerShortcuts` already uses, for the same reason.
 * A label that carries a live value (`Horizontal alignment — centre`) is matched on its prefix. */
const bar = () => document.querySelector('[data-portal-toolbar]');

/** The first toolbar button whose tip starts with any of these. */
function press(...tips: string[]): boolean {
  const t = bar();
  if (!t) return false;
  const btns = [...t.querySelectorAll<HTMLElement>('[data-tip]')];
  for (const tip of tips) {
    const hit = btns.find((b) => (b.getAttribute('data-tip') || '').startsWith(tip));
    if (hit && !(hit as HTMLButtonElement).disabled) { hit.click(); return true; }
  }
  return false;
}

/** Press the button for a named action, reading its prefixes from the shared map. */
const act = (a: ToolbarAction) => press(...tipsOf(a));

/* ⚠️ "Add a widget beside this one" and "Add a question" both begin "Add a ", and they are opposite
   actions — beside it, versus inside it. The inside one is whatever `Add a …` is left once the beside
   one is EXCLUDED, which is the one case a plain prefix scan cannot express, so it is spelled out
   here rather than in the map. `addBeside`'s own prefixes are what it excludes, so a change there
   still reaches this. */
function pressAddInside(): boolean {
  const t = bar();
  if (!t) return false;
  const beside = tipsOf('addBeside');
  const hit = [...t.querySelectorAll<HTMLElement>('[data-tip]')].find((b) => {
    const tip = b.getAttribute('data-tip') || '';
    return tipsOf('addInside').some((k) => tip.startsWith(k)) && !beside.some((k) => tip.startsWith(k));
  });
  if (!hit) return false;
  hit.click();
  return true;
}

/* The Spacing matrix is the one control that never moved to the bar — it lives in the design panel.
   Opening its accordion and scrolling it into view is the honest equivalent of pressing it. */
function openSpacing(): boolean {
  const heads = [...document.querySelectorAll<HTMLElement>('button')]
    .filter((b) => (b.textContent || '').trim() === 'Spacing' && !b.closest('[data-portal-toolbar]'));
  const h = heads[heads.length - 1];
  if (!h) return false;
  h.scrollIntoView({ block: 'center', behavior: 'smooth' });
  if (h.getAttribute('aria-expanded') !== 'true') h.click();
  return true;
}

/** Click into the selected node's own words. */
function editWords(id: string): boolean {
  const el = document.querySelector<HTMLElement>(`[data-node="${CSS.escape(id)}"]`);
  const w = el?.querySelector<HTMLElement>('[contenteditable]') ?? (el?.isContentEditable ? el : null);
  if (!w) return false;
  w.focus();
  return true;
}

const isTyping = (t: EventTarget | null) =>
  t instanceof HTMLElement && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable);

export interface PortalShortcutProps {
  /** Opens a rail panel — Widgets · Theme · Branding · Banners. */
  onRail: (i: number) => void;
  /** Hides the design panel (Alt+0). */
  onHidePanel: () => void;
  /** Enters preview; called only from the editable canvas. */
  onPreview: () => void;
  /** Leaves preview; called only from the read-only one. */
  onExitPreview: () => void;
  onSaveDraft: () => void;
  /** N — a new one-column section, after the section holding the selection, or at the foot of the
   *  page when nothing is selected. The builder owns where "after" is; the key only asks. */
  onAddSection: (fromId: string | null) => void;
  /** Alt+L — flips the canvas between light and dark. */
  onToggleMode: () => void;
  /** The sheet is opened from the top bar's Help menu as well as from `?`. */
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function PortalShortcuts(props: PortalShortcutProps) {
  const { enabled, selectedId, select, styles, setStyle } = useCanvas();
  const { open, onOpenChange } = props;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      /* `?` is Shift+/ — it works from a field too, because it cannot be typed by accident into one
         that is expecting words without Shift, and somebody reaching for help is usually stuck. */
      if (e.key === '?') { e.preventDefault(); onOpenChange(!open); return; }
      if (open && e.key === 'Escape') { e.preventDefault(); onOpenChange(false); return; }
      if (isTyping(e.target)) return;

      /* PREVIEW is the one surface where almost nothing applies — there is no selection and no bar.
         Leaving it is the only thing to offer. */
      if (!enabled) {
        if (e.key === 'Escape' || (e.altKey && e.code === 'KeyP')) { e.preventDefault(); props.onExitPreview(); }
        /* ⚠️ Light/dark answers in Preview as well — seeing the page as a requester sees it, in both
           themes, is exactly what Preview is for, and leaving it to flip the theme defeats that. */
        else if (e.altKey && e.code === 'KeyL') { e.preventDefault(); props.onToggleMode(); }
        return;
      }

      const mod = e.ctrlKey || e.metaKey;

      /* ── The builder's own chrome ── */
      if (e.altKey && !mod) {
        if (e.code === 'KeyP') { e.preventDefault(); props.onPreview(); return; }
        if (e.code === 'Digit0') { e.preventDefault(); props.onHidePanel(); return; }
        /* CHROME_KEYS.mode */
        if (e.code === 'KeyL') { e.preventDefault(); props.onToggleMode(); return; }
        const rail = ['Digit1', 'Digit2', 'Digit3', 'Digit4'].indexOf(e.code);
        if (rail >= 0) { e.preventDefault(); props.onRail(rail); return; }
      }

      /* ── Document verbs ── */
      if (mod && e.code === 'KeyS') { e.preventDefault(); props.onSaveDraft(); return; }
      /* ⚠️ Ctrl+D, not a bare D — that is Drop shadow, and the two would have been one key apart
         with no way to tell which you meant. Ctrl+D is the browser's bookmark, so it has to be
         prevented; every design tool takes it for the same reason. It presses the bar's own Copy,
         which is absent on a widget that has no instance to clone, so the limit needs no restating. */
      if (mod && e.code === 'KeyD') { e.preventDefault(); if (selectedId) act('duplicate'); return; }
      /* Undo/redo already have their own handler in the builder — left alone here so there is one
         owner of the history stack rather than two listeners racing on the same keystroke. */
      if (mod) return;

      /* CHROME_KEYS.newSection — N, BEFORE the selection gate. It is the first step of building a
         page, so it has to work on an empty one: with nothing selected it lands at the page's foot. */
      if (e.code === 'KeyN' && !e.altKey && !e.shiftKey) { e.preventDefault(); props.onAddSection(selectedId); return; }

      if (!selectedId) return;
      const id = selectedId;

      /* ── Select: Alt + arrow ─────────────────────────────────────────────────────────────────
         The path is the same one the breadcrumb reads, so "up" means exactly what the chip's own
         step-up meant. Siblings go through the toolbar's move buttons in reverse — there is no
         "select next" on the bar, so this walks the DOM instead. */
      if (e.altKey) {
        const path = nodePath(id);
        if (e.code === 'ArrowUp' && path.length > 1) { e.preventDefault(); select(path[path.length - 2].id); return; }
        if (e.code === 'ArrowDown') {
          const el = document.querySelector<HTMLElement>(`[data-node="${CSS.escape(id)}"]`);
          const kid = el?.querySelector<HTMLElement>('[data-node]');
          if (kid) { e.preventDefault(); select(kid.getAttribute('data-node')!); }
          return;
        }
        if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
          const el = document.querySelector<HTMLElement>(`[data-node="${CSS.escape(id)}"]`);
          const parent = el?.parentElement?.closest<HTMLElement>('[data-node]') ?? null;
          const kin = [...(parent ?? document).querySelectorAll<HTMLElement>('[data-node]')]
            .filter((n) => n.parentElement?.closest('[data-node]') === parent);
          const i = kin.findIndex((n) => n.getAttribute('data-node') === id);
          const next = kin[i + (e.code === 'ArrowRight' ? 1 : -1)];
          if (next) { e.preventDefault(); select(next.getAttribute('data-node')!); }
          return;
        }
        return;
      }

      /* ── Size: Shift + arrow ──────────────────────────────────────────────────────────────────
         ⚠️ Width is a PERCENTAGE of the parent and height is real pixels — the two units the drag
         handles already write. An unset height has to be MEASURED before it can be stepped, or the
         first press would jump the element to whatever number we invented. */
      if (e.shiftKey) {
        const st = styles[id] ?? {};
        if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
          e.preventDefault();
          const w = Number(st.widthPct ?? 100) + (e.code === 'ArrowRight' ? 1 : -1);
          setStyle(id, { widthPct: Math.max(5, Math.min(100, Math.round(w))) });
          return;
        }
        if (e.code === 'ArrowUp' || e.code === 'ArrowDown') {
          e.preventDefault();
          const el = document.querySelector<HTMLElement>(`[data-node="${CSS.escape(id)}"]`);
          const now = Number(st.height ?? Math.round(el?.getBoundingClientRect().height ?? 0));
          setStyle(id, { height: Math.max(24, now + (e.code === 'ArrowDown' ? 8 : -8)) });
          return;
        }
        return;
      }

      /* ── Move: bare arrow ─────────────────────────────────────────────────────────────────────
         Zeni's call, and it is what Figma, Webflow and Framer all train. Only the parent's own axis
         answers, because only that axis has a button on the bar — the same two arrows the toolbar
         shows. The cost is stated in the sheet: with something selected, Esc first to arrow-scroll. */
      const ARROWS: Record<string, ToolbarAction> = {
        ArrowLeft: 'moveLeft', ArrowRight: 'moveRight', ArrowUp: 'moveUp', ArrowDown: 'moveDown',
      };
      if (ARROWS[e.code]) { if (act(ARROWS[e.code])) e.preventDefault(); return; }

      /* ── Everything else is a letter on the bar ── */
      switch (e.code) {
        /* place */
        case 'KeyA': e.preventDefault(); (e.shiftKey ? pressAddInside() : act('addBeside')); break;
        case 'KeyR': e.preventDefault(); act('replace'); break;
        case 'KeyS': e.preventDefault(); act('split'); break;
        case 'Enter': if (editWords(id)) e.preventDefault(); break;
        case 'Delete': case 'Backspace': e.preventDefault(); act('remove'); break;
        /* style */
        case 'KeyB': e.preventDefault(); act('background'); break;
        /* ⚠️ O, C, D and I are gone: Border, Corner radius, Shadow and Icon left the floating toolbar
           for the sidebar (29 Sep 2026), and these keys only ever pressed the toolbar's own buttons. */
        case 'KeyH': e.preventDefault(); act('alignH'); break;
        case 'KeyV': e.preventDefault(); act('alignV'); break;
        case 'KeyG': e.preventDefault(); act('presets'); break;
        case 'KeyP': e.preventDefault(); openSpacing(); break;
        /* remove the selection itself — this also closes any popup the bar has open, because the
           bar is unmounted with it. One press, one meaning. */
        case 'Escape': e.preventDefault(); select(null); break;
        default: break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [enabled, selectedId, select, styles, setStyle, open, onOpenChange, props]);

  if (!open) return null;
  return <Sheet onClose={() => onOpenChange(false)} />;
}

/* ── The sheet ───────────────────────────────────────────────────────────────────────────────────
 *
 * Two columns in two rows, ordered by PRIORITY — see `LAYOUT`. Each group still keeps to one modifier,
 * so a reader who learns a group has learned what its modifier means everywhere. Ctrl is written as
 * Ctrl because this product's users are on Windows; the handler answers to Cmd as well. */
/* ⚠️ The keys come from the SAME map the handler presses through and the tooltip prints, so the
   sheet cannot end up advertising a key that was changed in one of the other two. Rows the toolbar
   has no button for — the Alt traversal, the Shift resize, the rail — are written out here, because
   there is no button for them to drift from. */
const k = (a: ToolbarAction) => [...TOOLBAR_KEYS[a].keys];
const ck = (a: ChromeAction) => chromeKeys(a);
/** A combination — every key pressed together — written with `+` between them. */
const combo = (keys: string[]) => keys.flatMap((x, i) => (i ? ['+', x] : [x]));

type Row = { keys: string[]; label: string; lead?: boolean };
type Group = { title: string; note?: string; rows: Row[] };

/* ── The sheet's content, in PRIORITY order ──────────────────────────────────────────────────────
 *
 * ⚠️ ORDERED BY THE JOURNEY, not by modifier (Zeni's call, 28 Sep 2026). It used to read the scheme
 * back — Select, Move, Place, Style, Builder, Document — which is tidy to whoever wrote it and not the
 * order anybody builds a page in. Row 1 is what you reach for FIRST and MOST: the builder's own keys
 * (Preview above all) beside Place, whose rows run in the order a page is built — new section → split
 * it → put a widget in → around it. Row 2 is what you reach for once something is on the page:
 * selecting and moving it, then styling it, then the document verbs. */
const BUILDER: Group = { title: 'The builder', rows: [
  /* ⚠️ Preview FIRST and set in the label's strongest weight — the most-used key on this screen and
     the one Zeni named as the most important, so it should be the first thing the eye lands on. */
  { keys: combo(ck('preview')), label: 'Preview — and back', lead: true },
  { keys: ck('exitPreview'), label: 'Leave preview' },
  { keys: combo(ck('mode')), label: 'Light / dark' },
  { keys: combo(ck('widgets')), label: 'Widgets' },
  { keys: combo(ck('theme')), label: 'Theme' },
  { keys: combo(ck('branding')), label: 'Branding' },
  { keys: combo(ck('banners')), label: 'Banners' },
  { keys: combo(ck('hidePanel')), label: 'Hide the design panel' },
] };

const PLACE: Group = { title: 'Place', note: 'In the order a page is built', rows: [
  { keys: ck('newSection'), label: 'New section', lead: true },
  { keys: k('split'), label: 'Split into columns or rows' },
  { keys: k('addBeside'), label: 'Add a widget beside this one' },
  { keys: combo(k('addInside')), label: 'Add an item inside it' },
  { keys: k('replace'), label: 'Replace this widget' },
  { keys: combo(k('duplicate')), label: 'Duplicate' },
  { keys: ['Enter'], label: 'Edit the words' },
  { keys: k('remove'), label: 'Delete' },
] };

const SELECT: Group = { title: 'Select', note: 'Alt changes what is selected', rows: [
  /* Short enough to fit — "Select the parent — the column, row or section" truncated at "or s…". */
  { keys: combo(k('selectRow')), label: 'Select the parent' },
  { keys: ['Alt', '+', '↓'], label: 'Select the first thing inside' },
  { keys: ['Alt', '+', '←', '/', '→'], label: 'Previous / next sibling' },
  { keys: ['Esc'], label: 'Deselect, and close anything open' },
] };

const MOVE: Group = { title: 'Move and size', note: 'Only the parent’s own axis answers', rows: [
  { keys: [...k('moveLeft'), ...k('moveRight'), ...k('moveUp'), ...k('moveDown')], label: 'Move one place' },
  { keys: ['Shift', '+', '←', '/', '→'], label: 'Narrower / wider' },
  { keys: ['Shift', '+', '↑', '/', '↓'], label: 'Shorter / taller' },
] };

const STYLE: Group = { title: 'Style', note: 'Each opens its popup — arrows walk it', rows: [
  { keys: k('background'), label: 'Background colour' },
  { keys: k('alignH'), label: 'Horizontal alignment' },
  { keys: k('alignV'), label: 'Vertical alignment' },
  { keys: k('presets'), label: 'Arrangement and presets' },
  { keys: ['P'], label: 'Spacing' },
] };

const DOCUMENT: Group = { title: 'Document', rows: [
  { keys: combo(ck('undo')), label: 'Undo' },
  { keys: combo(ck('redo')), label: 'Redo' },
  { keys: combo(ck('saveDraft')), label: 'Save as draft' },
  { keys: ck('help'), label: 'This sheet' },
] };

/** Rows of the sheet, top to bottom; each row is two columns, each column a stack of groups. */
const LAYOUT: Group[][][] = [
  [[BUILDER], [PLACE]],
  [[SELECT, MOVE], [STYLE, DOCUMENT]],
];

/* `TipKeys` lives in `PortalTipKeys.tsx` so the canvas can use it without an import cycle; re-exported
   here so every existing `import { TipKeys } from './PortalShortcuts'` keeps working. */
export { TipKeys } from './PortalTipKeys';

/* The ticket page's key cap, deliberately the same — one product, one way of drawing a key. */
function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-[20px] min-w-[20px] items-center justify-center rounded border border-[#DFE5ED] bg-[#F8FAFC] px-1.5 text-[10px] font-semibold text-[#364658] shadow-[0_1px_0_#DFE5ED]">
      {children}
    </kbd>
  );
}

function ShortcutRow({ keys, label, lead }: Row) {
  return (
    /* ⚠️ The LABEL leads and the KEYS close the row (Zeni's call, 28 Sep 2026). A reader scans a sheet
       for the THING they want to do, then reads off its key — so the words go where the eye starts, and
       the caps line up down the right edge where they can be compared column by column. */
    <div className="flex items-center justify-between gap-3 py-[3px]">
      <span className={`min-w-0 flex-1 truncate text-[12px] ${lead ? 'font-semibold text-[#1E293B]' : 'text-[#64748B]'}`}>{label}</span>
      <span className="flex flex-shrink-0 items-center gap-1">
        {keys.map((x, i) => (x === '+' || x === '/'
          ? <span key={i} className="text-[10px] text-[#9CA3AF]">{x}</span>
          : <Kbd key={i}>{x}</Kbd>))}
      </span>
    </div>
  );
}

function GroupBlock({ g, first }: { g: Group; first: boolean }) {
  return (
    <div className={first ? '' : 'mt-3 border-t border-[#F0F1F3] pt-2.5'}>
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF]">{g.title}</span>
        {g.note && <span className="truncate text-[10.5px] text-[#B0BAC6]">{g.note}</span>}
      </div>
      {g.rows.map((r) => <ShortcutRow key={r.label} {...r} />)}
    </div>
  );
}

function Sheet({ onClose }: { onClose: () => void }) {
  return createPortal(
    <>
      <div className="fixed inset-0 z-[10050] bg-black/30" onClick={onClose} />
      {/* ⚠️ The TICKET page's popup, widened to two columns — same title row with the keyboard glyph,
          same small uppercase section heads, same caps joined by `+`. The builder has three times as
          many keys, so one column would scroll for a screen and a half. */}
      <div className="fixed left-1/2 top-1/2 z-[10051] flex max-h-[88vh] w-[760px] max-w-[94vw] -translate-x-1/2 -translate-y-1/2 flex-col rounded-xl border border-[#E5E7EB] bg-white shadow-2xl">
        <div className="flex flex-shrink-0 items-start justify-between gap-3 border-b border-[#E5E7EB] px-5 py-3.5">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[15px] font-semibold text-[#111827]">
              <Keyboard size={17} className="text-[#3D8BD0]" /> Keyboard Shortcuts
            </div>
            {/* The one sentence that makes the rest guessable. */}
            <p className="mt-1 text-[11.5px] text-[#7B8FA5]">
              Alt is the builder, a letter acts on what is selected, arrows move it, Shift resizes it, Ctrl is the document.
            </p>
          </div>
          <button onClick={onClose} aria-label="Close" className="flex size-8 flex-shrink-0 items-center justify-center rounded text-[#6B7280] transition-colors hover:bg-[#F3F4F6] hover:text-[#111827]">
            <X size={18} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5">
          {LAYOUT.map((row, ri) => (
            <div key={ri} className={`grid grid-cols-2 gap-x-8 py-3.5 ${ri ? 'border-t border-[#E5E7EB]' : ''}`}>
              {row.map((col, ci) => (
                <div key={ci} className="min-w-0">
                  {col.map((g, gi) => <GroupBlock key={g.title} g={g} first={gi === 0} />)}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* ⚠️ Stated, not silently true. Both are real limits somebody will otherwise hit and report
            as a bug: the canvas cannot be arrow-scrolled while a widget is selected, and Publish has
            no key on purpose. */}
        <p className="flex-shrink-0 border-t border-[#EEF1F5] px-5 py-2.5 text-[11px] text-[#9CA3AF]">
          Press <span className="font-medium text-[#64748B]">Esc</span> to deselect before arrow-scrolling the canvas.
          Publish has no shortcut — it changes what requesters see, so it keeps its button.
        </p>
      </div>
    </>,
    document.body,
  );
}
