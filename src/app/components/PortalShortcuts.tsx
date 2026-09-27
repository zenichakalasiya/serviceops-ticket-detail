import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useCanvas } from './PortalCanvas';
import { nodePath } from './portalPageModel';

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

/* ⚠️ "Add a widget beside this one" and "Add a question" both begin "Add a ", and they are opposite
   actions — beside it, versus inside it. The inside one is whatever `Add a …` is left once the
   beside one is excluded, so a new collection's own wording needs no change here. */
function pressAddInside(): boolean {
  const t = bar();
  if (!t) return false;
  const hit = [...t.querySelectorAll<HTMLElement>('[data-tip]')].find((b) => {
    const tip = b.getAttribute('data-tip') || '';
    return (tip.startsWith('Add a ') && !tip.startsWith('Add a widget beside')) || tip === 'Add a block inside';
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
        return;
      }

      const mod = e.ctrlKey || e.metaKey;

      /* ── The builder's own chrome ── */
      if (e.altKey && !mod) {
        if (e.code === 'KeyP') { e.preventDefault(); props.onPreview(); return; }
        if (e.code === 'Digit0') { e.preventDefault(); props.onHidePanel(); return; }
        const rail = ['Digit1', 'Digit2', 'Digit3', 'Digit4'].indexOf(e.code);
        if (rail >= 0) { e.preventDefault(); props.onRail(rail); return; }
      }

      /* ── Document verbs ── */
      if (mod && e.code === 'KeyS') { e.preventDefault(); props.onSaveDraft(); return; }
      /* ⚠️ Ctrl+D, not a bare D — that is Drop shadow, and the two would have been one key apart
         with no way to tell which you meant. Ctrl+D is the browser's bookmark, so it has to be
         prevented; every design tool takes it for the same reason. It presses the bar's own Copy,
         which is absent on a widget that has no instance to clone, so the limit needs no restating. */
      if (mod && e.code === 'KeyD') { e.preventDefault(); if (selectedId) press('Copy'); return; }
      /* Undo/redo already have their own handler in the builder — left alone here so there is one
         owner of the history stack rather than two listeners racing on the same keystroke. */
      if (mod) return;

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
      const ARROWS: Record<string, string[]> = {
        ArrowLeft: ['Move left'], ArrowRight: ['Move right'],
        ArrowUp: ['Move up'], ArrowDown: ['Move down'],
      };
      if (ARROWS[e.code]) { if (press(...ARROWS[e.code])) e.preventDefault(); return; }

      /* ── Everything else is a letter on the bar ── */
      switch (e.code) {
        /* place */
        case 'KeyA': e.preventDefault(); (e.shiftKey ? pressAddInside() : press('Add a widget beside this one', 'Add widget')); break;
        case 'KeyR': e.preventDefault(); press('Replace this widget', 'Replace widget'); break;
        case 'KeyS': e.preventDefault(); press('Split into '); break;
        case 'KeyD': e.preventDefault(); press('Shadow'); break;
        case 'Enter': if (editWords(id)) e.preventDefault(); break;
        case 'Delete': case 'Backspace': e.preventDefault(); press('Delete'); break;
        /* style */
        case 'KeyB': e.preventDefault(); press('Background colour', 'Banner background'); break;
        case 'KeyO': e.preventDefault(); press('Border'); break;
        case 'KeyC': e.preventDefault(); press('Corner radius'); break;
        case 'KeyH': e.preventDefault(); press('Horizontal alignment'); break;
        case 'KeyV': e.preventDefault(); press('Vertical alignment'); break;
        case 'KeyI': e.preventDefault(); press("The glyph's colour"); break;
        case 'KeyG': e.preventDefault(); press('Presets', 'Sections, and how they are arranged'); break;
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
 * Two columns, grouped exactly as the scheme is — a reader who learns one group has learned what its
 * modifier means everywhere. Ctrl is written as Ctrl because this product's users are on Windows;
 * the handler answers to Cmd as well. */
const GROUPS: { title: string; note?: string; rows: [string[], string][] }[] = [
  { title: 'Select', note: 'Alt moves the selection', rows: [
    /* ⚠️ Short enough to fit the column. "Select the parent — the column, row or section" named the
       three things it reaches and then truncated at "or s…", which is a label that ends mid-word. */
    [['Alt', '↑'], 'Select the parent'],
    [['Alt', '↓'], 'Select the first thing inside'],
    [['Alt', '←'], 'Previous sibling'],
    [['Alt', '→'], 'Next sibling'],
    [['Esc'], 'Deselect, and close anything open'],
  ] },
  { title: 'Move and size', note: 'Only the parent’s own axis answers', rows: [
    [['←', '→', '↑', '↓'], 'Move one place'],
    [['Shift', '←', '→'], 'Narrower / wider'],
    [['Shift', '↑', '↓'], 'Shorter / taller'],
  ] },
  { title: 'Place', rows: [
    [['A'], 'Add a widget beside this one'],
    [['Shift', 'A'], 'Add an item inside it'],
    [['R'], 'Replace this widget'],
    [['Ctrl', 'D'], 'Duplicate'],
    [['S'], 'Split into columns or rows'],
    [['Enter'], 'Edit the words'],
    [['Del'], 'Delete'],
  ] },
  { title: 'Style', note: 'Each one opens its popup', rows: [
    [['B'], 'Background colour'],
    [['O'], 'Border'],
    [['C'], 'Corner radius'],
    [['D'], 'Drop shadow'],
    [['H'], 'Horizontal alignment'],
    [['V'], 'Vertical alignment'],
    [['I'], 'Icon — cards and tiles'],
    [['G'], 'Arrangement and presets'],
    [['P'], 'Spacing'],
  ] },
  { title: 'The builder', rows: [
    [['Alt', '1'], 'Widgets'],
    [['Alt', '2'], 'Theme'],
    [['Alt', '3'], 'Branding'],
    [['Alt', '4'], 'Banners'],
    [['Alt', '0'], 'Hide the design panel'],
    [['Alt', 'P'], 'Preview — and back'],
  ] },
  { title: 'Document', rows: [
    [['Ctrl', 'Z'], 'Undo'],
    [['Ctrl', 'Shift', 'Z'], 'Redo'],
    [['Ctrl', 'S'], 'Save as draft'],
    [['?'], 'This sheet'],
  ] },
];

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-[20px] min-w-[20px] items-center justify-center rounded border border-[#DFE5ED] bg-[#F8FAFC] px-1.5 text-[10px] font-semibold text-[#364658] shadow-[0_1px_0_#DFE5ED]">
      {children}
    </kbd>
  );
}

function Sheet({ onClose }: { onClose: () => void }) {
  return createPortal(
    <>
      <div className="fixed inset-0 z-[10050] bg-black/30" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 z-[10051] max-h-[88vh] w-[680px] max-w-[94vw] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-[#E5E7EB] bg-white shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-[#EEF1F5] bg-white px-4 py-3">
          <div>
            <p className="text-[14px] font-semibold text-[#1E293B]">Keyboard shortcuts</p>
            {/* The one sentence that makes the rest guessable. */}
            <p className="mt-0.5 text-[11.5px] text-[#7B8FA5]">
              A letter presses a button on the selected widget’s toolbar. Arrows move it, Shift resizes it, Alt changes what is selected.
            </p>
          </div>
          <button onClick={onClose} className="flex size-8 items-center justify-center rounded transition-colors hover:bg-[#F3F4F6]">
            <X size={16} className="text-[#64748B]" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-4 p-4">
          {GROUPS.map((g) => (
            <div key={g.title}>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#7B8FA5]">{g.title}</p>
              {g.note && <p className="mb-1.5 text-[11px] text-[#9CA3AF]">{g.note}</p>}
              {g.rows.map(([keys, label]) => (
                <div key={label} className="flex items-center justify-between gap-3 py-[3px]">
                  <span className="flex flex-shrink-0 items-center gap-1">
                    {keys.map((k, i) => <Kbd key={i}>{k}</Kbd>)}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-right text-[12px] text-[#64748B]">{label}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
        {/* ⚠️ Stated, not silently true. Both are real limits somebody will otherwise hit and report
            as a bug: the canvas cannot be arrow-scrolled while a widget is selected, and Publish
            has no key on purpose. */}
        <p className="border-t border-[#EEF1F5] px-4 py-2.5 text-[11px] text-[#9CA3AF]">
          Press <span className="font-medium text-[#64748B]">Esc</span> to deselect before arrow-scrolling the canvas.
          Publish has no shortcut — it changes what requesters see, so it keeps its button.
        </p>
      </div>
    </>,
    document.body,
  );
}
