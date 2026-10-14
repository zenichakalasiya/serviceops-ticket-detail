/* Shared primitives for the Dashboard module — the React port of the prototype's
 * components/ui/{Icon,Dropdown,ConfirmDialog,Hint}.vue, plus DashPortal.
 *
 * Rule (Zeni, Oct 2026): form fields and CTAs are the PRODUCT's. So:
 *   · Dropdown keeps the prototype's API (modelValue / options / multiple / size / disabled) but
 *     renders the product's RuleSelect — the same select the Form Rules and User Surveys use.
 *   · ConfirmDialog's buttons are the product's (secondary + blue primary, red for destructive). */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { ICON_MAP, FILLED } from '../data/icons.js';
import { RuleSelect, type SelectOption } from '../../FormRuleControls';
import { store } from '../store.js';
import { useDashStore } from '../reactivity.js';

/* ── Icon ─────────────────────────────────────────────────────────────────── */
/** `<Icon name="…" size={…} />` — names are the product vocabulary in data/icons.js, drawn by lucide.
 *  Small sizes step the stroke down, as the prototype did. */
export function Icon({ name, size = 18, className = '', style }: { name: string; size?: number | string; className?: string; style?: React.CSSProperties; strokeWidth?: number }) {
  const Cmp = (ICON_MAP as any)[name];
  if (!Cmp) return null;
  const px = typeof size === 'number' ? size : parseFloat(size) || 18;
  return (
    <Cmp
      className={`ico ${className}`.trim()}
      style={{ display: 'block', flex: 'none', ...style }}
      size={px}
      strokeWidth={px <= 14 ? 1.75 : 2}
      fill={(FILLED as Set<string>).has(name) ? 'currentColor' : 'none'}
      aria-hidden="true"
    />
  );
}

/* ── DashPortal ───────────────────────────────────────────────────────────── */
/** Vue's <teleport to="body">, but INTO a body-level `.dash-root` host, so a popover rendered
 *  outside the board still reads the Dashboard's tokens (--surface, --ink …) and its theme. */
let host: HTMLDivElement | null = null;
function portalHost() {
  if (!host) {
    host = document.createElement('div');
    host.className = 'dash-root dash-portal-host';
    host.style.cssText = 'position:fixed;inset:0;height:0;width:0;z-index:9500;background:transparent';
    document.body.appendChild(host);
  }
  host.dataset.theme = store.ui.theme === 'dark' ? 'dark' : 'light';
  return host;
}
export function DashPortal({ children }: { children: ReactNode }) {
  useDashStore();
  return createPortal(children, portalHost());
}

/* ── Dropdown ─────────────────────────────────────────────────────────────── */
type Opt = string | number | { value: any; label: string; swatch?: string };
/** The prototype's custom select, drawn as the PRODUCT's select (RuleSelect, 4px corners). Values
 *  may be numbers; they round-trip through strings. A `swatch` option shows its colour as a dot. */
export function Dropdown({
  modelValue, onUpdateModelValue, options = [], placeholder = 'Select', size = 'md', multiple = false, disabled = false, className = '',
}: {
  modelValue: any; onUpdateModelValue?: (v: any) => void; options?: Opt[]; placeholder?: string;
  size?: 'md' | 'sm'; multiple?: boolean; disabled?: boolean; className?: string;
}) {
  const norm = options.map((o) => (typeof o === 'object' ? o : { value: o, label: String(o) }));
  const back = new Map(norm.map((o) => [String(o.value), o.value]));
  const opts: SelectOption[] = norm.map((o) => ({
    value: String(o.value),
    label: o.label,
    ...(o.swatch ? { avatar: { initials: '', color: o.swatch } } : {}),
  }));
  const value = multiple ? (Array.isArray(modelValue) ? modelValue.map(String) : []) : modelValue === '' || modelValue == null ? [] : [String(modelValue)];
  return (
    <RuleSelect
      value={value}
      options={opts}
      multi={multiple}
      disabled={disabled}
      placeholder={placeholder}
      compact={size === 'sm'}
      className={`!rounded ${className}`}
      onChange={(v) => onUpdateModelValue?.(multiple ? v.map((x) => back.get(x) ?? x) : back.get(v[0]) ?? v[0])}
    />
  );
}

/* ── ConfirmDialog ────────────────────────────────────────────────────────── */
/** "Are you sure?" for destructive actions — names the thing, Esc cancels, Enter confirms. */
export function ConfirmDialog({
  title = 'Are you sure?', message = '', target = '', confirmLabel = 'Delete', danger = true, onConfirm, onCancel,
}: { title?: string; message?: string; target?: string; confirmLabel?: string; danger?: boolean; onConfirm: () => void; onCancel: () => void }) {
  const btn = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); onCancel(); }
      if (e.key === 'Enter') { e.preventDefault(); onConfirm(); }
    };
    addEventListener('keydown', onKey, true);
    btn.current?.focus();
    return () => removeEventListener('keydown', onKey, true);
  }, [onCancel, onConfirm]);
  return (
    <DashPortal>
      <div onClick={(e) => e.target === e.currentTarget && onCancel()} style={{ position: 'fixed', inset: 0, zIndex: 10040, background: 'rgba(27,28,46,.38)', display: 'grid', placeItems: 'center', padding: 20 }}>
        <div role="alertdialog" aria-modal="true" className="w-[340px] max-w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-[18px] py-4 shadow-[var(--sh-lg)]">
          <div className="mb-2 flex items-center gap-2.5">
            <span className={`grid size-[30px] flex-none place-items-center rounded ${danger ? 'bg-[var(--red-soft)] text-[var(--red)]' : 'bg-[var(--surface-2)] text-[var(--muted)]'}`}>
              <Icon name={danger ? 'alert' : 'info'} size={18} />
            </span>
            <b className="text-[14px] text-[var(--ink)]">{title}</b>
          </div>
          <p className="mb-4 text-[13px] leading-[1.55] text-[var(--ink-2)]">
            {target && <b className="font-semibold text-[var(--ink)]">“{target}”</b>}{target ? ' ' : ''}{message}
          </p>
          <div className="flex justify-end gap-2">
            <button className="btn btn-sm" onClick={onCancel}>Cancel</button>
            <button
              ref={btn}
              className={`btn btn-sm ${danger ? '' : 'btn-primary'}`}
              style={danger ? { background: 'var(--red)', borderColor: 'var(--red)', color: '#fff', fontWeight: 600 } : undefined}
              onClick={onConfirm}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </DashPortal>
  );
}

/* ── Hint ─────────────────────────────────────────────────────────────────── */
/** The ⓘ beside a field label carrying the sentence that used to sit under the field. */
export function Hint({ text }: { text: string }) {
  const el = useRef<HTMLSpanElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number; flip: boolean } | null>(null);
  const W = 260;
  const show = () => {
    const r = el.current?.getBoundingClientRect(); if (!r) return;
    const below = r.bottom + 8;
    const flip = below + 90 > window.innerHeight;
    setPos({ top: flip ? r.top - 8 : below, left: Math.max(8, Math.min(r.left + r.width / 2 - W / 2, window.innerWidth - W - 8)), flip });
  };
  return (
    <>
      <span
        ref={el} tabIndex={0} onMouseEnter={show} onMouseLeave={() => setPos(null)} onFocus={show} onBlur={() => setPos(null)}
        style={{ display: 'inline-grid', placeItems: 'center', marginLeft: 5, color: 'var(--muted)', cursor: 'help', verticalAlign: -2 }}
      >
        <Icon name="info" size={13} />
      </span>
      {pos && (
        <DashPortal>
          <span className="tt" style={{ position: 'fixed', zIndex: 10200, width: W, top: pos.top, left: pos.left, transform: pos.flip ? 'translateY(-100%)' : undefined }}>{text}</span>
        </DashPortal>
      )}
    </>
  );
}
