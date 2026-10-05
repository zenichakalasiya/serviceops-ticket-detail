import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, List, Plus, Search, X } from 'lucide-react';

/* The controls the Request Form Management screens share. Their look is the ticket detail page's
 * own: the field dropdown menu (white card, #DFE5ED border, search box on #F9FAFB, rows that tint
 * #F9FAFB, a blue check on the chosen one), the 4px-radius 36px form input, the tag chips of the
 * Request Fields accordion and the switch on the portal cards. */

/* Sizes and colours from the Form-rule Figma (node 1663:17995): 32px form fields at 12px on a
   #DFE5ED border with a 6px radius, grey #7B8FA5 labels, a #F25C4E required star. */
export const inputCls =
  'h-8 w-full rounded-md border border-[#DFE5ED] bg-white px-3 text-[12px] text-[#364658] placeholder:text-[#364658]/60 focus:border-[#3D8BD0] focus:outline-none focus:ring-1 focus:ring-[#3D8BD0]';
/** The 30px controls inside a condition or action row. */
export const rowInputCls =
  'h-[30px] w-full rounded-md border border-[#DFE5ED] bg-white px-2 text-[12px] font-medium text-[#364658] placeholder:font-normal placeholder:text-[#364658]/60 focus:border-[#3D8BD0] focus:outline-none focus:ring-1 focus:ring-[#3D8BD0]';
export const labelCls = 'mb-1.5 block text-[12px] text-[#7B8FA5]';

export const Required = () => <span className="text-[#F25C4E]">*</span>;

export function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return <label className={labelCls}>{children}{required && <> <Required /></>}</label>;
}

export function ErrorText({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return <p data-form-error className="mt-1 text-[11px] text-[#F25C4E]">{children}</p>;
}

export interface SelectOption {
  value: string;
  label: string;
  hint?: string;
  /** An avatar in front of the label — people pickers. */
  avatar?: { initials: string; color: string };
  /** A group heading the option sits under. */
  group?: string;
  /** Shown in a dark card beside the menu while the option is hovered — instead of a sub-line. */
  tip?: { desc: string; example?: string };
}

/** A dropdown with the ticket page's menu. `multi` keeps the menu open and shows the first choice
 *  plus a "+N" chip, the shape the rule rows need ("Category +4"). The menu is portalled to the
 *  body with fixed positioning: the editor scrolls, and a menu inside a scroll box is clipped. */
export function RuleSelect({
  value, options, onChange, placeholder = 'Select', multi = false, invalid = false, searchable,
  compact = false, disabled = false, className = '', menuWidth, chip = false, token, wavy = false,
}: {
  /** Render as an inline sentence word tinted in this colour, instead of a boxed field. */
  token?: string;
  /** A red wavy underline — the token is part of a conflict. */
  wavy?: boolean;
  value: string[];
  options: SelectOption[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  multi?: boolean;
  invalid?: boolean;
  searchable?: boolean;
  /** 32px, for the rows inside a condition group. */
  compact?: boolean;
  disabled?: boolean;
  className?: string;
  menuWidth?: number;
  /** Show the first choice as a tinted tag chip — the Tags field's values. */
  chip?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const btn = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ left: number; top: number; width: number; up: boolean } | null>(null);
  /** The hovered option's tip, placed beside the menu at that row's height. */
  const [tip, setTip] = useState<{ o: SelectOption; y: number } | null>(null);
  const showSearch = searchable ?? options.length > 7;

  const place = () => {
    const r = btn.current?.getBoundingClientRect();
    if (!r) return;
    const width = Math.max(r.width, menuWidth ?? 220);
    const room = window.innerHeight - r.bottom;
    const up = room < 300 && r.top > room;
    setPos({ left: Math.min(r.left, window.innerWidth - width - 8), top: up ? r.top - 4 : r.bottom + 4, width, up });
  };

  useLayoutEffect(() => { if (open) place(); }, [open]);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (menu.current?.contains(e.target as Node) || btn.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    const move = () => place();
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', key);
    window.addEventListener('scroll', move, true);
    window.addEventListener('resize', move);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', key);
      window.removeEventListener('scroll', move, true);
      window.removeEventListener('resize', move);
    };
  }, [open]);
  useEffect(() => { if (!open) { setQ(''); setTip(null); } }, [open]);

  const chosen = options.filter((o) => value.includes(o.value));
  const first = chosen[0];
  const shown = options.filter((o) => !q || o.label.toLowerCase().includes(q.toLowerCase()));

  const pick = (v: string) => {
    if (multi) onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
    else { onChange([v]); setOpen(false); }
  };

  let lastGroup: string | undefined;

  /* Token mode — the sentence builder's inline word. It reads as part of the sentence (no box),
     tinted in its step's colour; unset it is a dashed prompt, invalid it goes red, and a clash is
     a red wavy underline, the spell-check signal everybody already reads as "look here". */
  const tokenLabel = first
    ? (chosen.length > 2 ? `${chosen.slice(0, 2).map((c) => c.label).join(', ')} +${chosen.length - 2}` : chosen.map((c) => c.label).join(multi ? ', ' : ''))
    : placeholder;
  const tokenBtn = token && (
    <button
      ref={btn}
      type="button"
      disabled={disabled}
      onClick={() => setOpen((o) => !o)}
      style={open && !invalid ? { borderColor: token, color: token } : undefined}
      /* Text, not a chip (the linear-workflow-builder reference): a value is a word in the
         sentence with a dashed underline that says "click me"; unset it is a grey prompt. */
      className={`inline-flex max-w-full items-baseline border-b border-dashed align-baseline text-[15px] leading-7 transition-colors ${first ? 'border-[#A5BAD0] font-medium text-[#1D2A3E] hover:border-solid' : 'border-[#CBD5E1] font-normal text-[#98A2B3] hover:text-[#64748B]'} ${invalid ? '!border-[#F25C4E] !text-[#DC2626]' : ''} ${wavy ? '!border-transparent underline decoration-[#DC2626] decoration-wavy decoration-[1.5px] underline-offset-[5px]' : ''} ${className}`}
    >
      <span className="truncate">{tokenLabel}</span>
    </button>
  );

  return (
    <>
      {tokenBtn || (
      <button
        ref={btn}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={`flex w-full min-w-0 items-center gap-1 rounded-md border bg-white text-left text-[12px] transition-colors disabled:cursor-not-allowed disabled:bg-[#F9FAFB] disabled:opacity-60 ${compact ? 'h-[30px] px-2 font-medium' : 'h-8 pl-3 pr-2.5'} ${invalid ? 'border-[#F25C4E]' : open ? 'border-[#3D8BD0] ring-1 ring-[#3D8BD0]' : 'border-[#DFE5ED] hover:border-[#CBD5E1]'} ${className}`}
      >
        {first ? (
          <span className="flex min-w-0 flex-1 items-center gap-2">
            {chip ? (
              <span className="flex min-w-0 items-center gap-1 rounded bg-[rgba(141,58,188,0.12)] py-0 pl-1 pr-2 font-medium text-[#8D3ABC]">
                <List size={12} className="flex-shrink-0 opacity-60" />
                <span className="truncate">{first.label}</span>
              </span>
            ) : (
              <span className="flex min-w-0 items-center gap-1">
                {first.avatar && (
                  <span className="flex size-[18px] flex-shrink-0 items-center justify-center rounded text-[9px] font-semibold text-white" style={{ backgroundColor: first.avatar.color }}>{first.avatar.initials}</span>
                )}
                <span className="truncate text-[#364658]">{first.label}</span>
              </span>
            )}
            {chosen.length > 1 && (
              <span className="flex-shrink-0 rounded bg-[#EEF2F6] px-1 font-medium text-[#7B8FA5]">+{chosen.length - 1}</span>
            )}
          </span>
        ) : (
          <span className="flex-1 truncate font-normal text-[#364658]/60">{placeholder}</span>
        )}
        <ChevronDown size={compact ? 16 : 18} strokeWidth={1.75} className={`flex-shrink-0 text-[#7B8FA5] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      )}
      {open && pos && createPortal(
        <div
          ref={menu}
          style={{ left: pos.left, width: pos.width, ...(pos.up ? { bottom: window.innerHeight - pos.top } : { top: pos.top }) }}
          className="fixed z-[10060] max-h-[300px] overflow-y-auto rounded-lg border border-[#DFE5ED] bg-white py-2 shadow-lg"
        >
          {showSearch && (
            <div className="px-3 pb-2">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                <input
                  autoFocus
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search..."
                  className="w-full rounded border border-[#E5E7EB] bg-[#F9FAFB] py-2 pl-9 pr-3 text-[13px] text-[#364658] placeholder:text-[#9CA3AF] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#3D8BD0]"
                />
              </div>
            </div>
          )}
          {shown.length === 0 && <div className="px-4 py-3 text-[13px] text-[#9CA3AF]">No matches</div>}
          {shown.map((o) => {
            const head = o.group && o.group !== lastGroup ? o.group : null;
            lastGroup = o.group;
            const on = value.includes(o.value);
            return (
              <div key={o.value}>
                {head && <div className="px-4 pb-1 pt-2 text-[11px] font-medium uppercase tracking-wide text-[#7B8FA5]">{head}</div>}
                <button
                  type="button"
                  onClick={() => pick(o.value)}
                  onMouseEnter={(e) => setTip(o.tip ? { o, y: e.currentTarget.getBoundingClientRect().top } : null)}
                  onMouseLeave={() => setTip(null)}
                  className={`flex w-full items-center gap-3 px-4 py-2 text-left transition-colors hover:bg-[#F9FAFB] ${on ? 'bg-[#F8FAFC]' : ''}`}
                >
                  {multi && (
                    <span className={`flex size-4 flex-shrink-0 items-center justify-center rounded border ${on ? 'border-[#3D8BD0] bg-[#3D8BD0]' : 'border-[#CBD5E1]'}`}>
                      {on && <Check size={11} className="text-white" strokeWidth={3} />}
                    </span>
                  )}
                  {o.avatar && (
                    <span className="flex size-6 flex-shrink-0 items-center justify-center rounded text-[10px] font-semibold text-white" style={{ backgroundColor: o.avatar.color }}>{o.avatar.initials}</span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] text-[#364658]">{o.label}</span>
                    {o.hint && !o.tip && <span className="block truncate text-[11px] text-[#7B8FA5]">{o.hint}</span>}
                  </span>
                  {!multi && on && <Check size={14} className="flex-shrink-0 text-[#3D8BD0]" />}
                </button>
              </div>
            );
          })}
        </div>,
        document.body,
      )}
      {open && pos && tip && tip.o.tip && createPortal(<OptionTipCard o={tip.o} y={tip.y} menuLeft={pos.left} menuWidth={pos.width} />, document.body)}
    </>
  );
}

/** The hovered option's tip: a dark card beside the menu — the option's name, what it means in bold
 *  white, and an Example set off by a rule. Left of the menu when there is room, otherwise right. */
function OptionTipCard({ o, y, menuLeft, menuWidth }: { o: SelectOption; y: number; menuLeft: number; menuWidth: number }) {
  const W = 340;
  const left = menuLeft - W - 10 >= 8;
  const x = left ? menuLeft - W - 10 : menuLeft + menuWidth + 10;
  return (
    <div style={{ left: x, top: Math.max(8, y - 6), width: W }}
      className="pointer-events-none fixed z-[10070] rounded-lg bg-[#364658] px-3.5 py-3 text-white shadow-[0_8px_24px_rgba(15,23,42,0.22)]">
      <span className={'absolute top-[18px] size-2.5 rotate-45 bg-[#364658] ' + (left ? '-right-[5px]' : '-left-[5px]')} />
      <div className="text-[12px] text-[#C3CEDB]">{o.label}</div>
      <div className="mt-0.5 text-[13px] font-semibold leading-[1.45]">{o.tip!.desc}</div>
      {o.tip!.example && (
        <div className="mt-2.5 border-l border-white/25 pl-2.5">
          <div className="text-[12px] text-[#C3CEDB]">Example</div>
          <div className="mt-0.5 text-[12px] leading-[1.45] text-white/90">{o.tip!.example}</div>
        </div>
      )}
    </div>
  );
}

/** The switch from the Support Portal cards. */
export function ToggleSwitch({ on, onChange, title, disabled }: { on: boolean; onChange: (v: boolean) => void; title?: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      title={title}
      disabled={disabled}
      onClick={() => onChange(!on)}
      className={`relative inline-flex h-[18px] w-[34px] flex-shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${on ? 'bg-[#3D8BD0]' : 'bg-[#CBD5E1]'}`}
    >
      <span className={`inline-block size-[14px] rounded-full bg-white shadow transition-transform ${on ? 'translate-x-[18px]' : 'translate-x-[2px]'}`} />
    </button>
  );
}

/** The Request Fields accordion's tag row: gray chips, a "+ Add tag" button that turns into an
 *  input, Enter or comma to commit. */
export function TagEditor({ tags, onChange, invalid }: { tags: string[]; onChange: (t: string[]) => void; invalid?: boolean }) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');
  const commit = () => {
    const t = draft.trim().replace(/,$/, '');
    if (t && !tags.includes(t)) onChange([...tags, t]);
    setDraft('');
  };
  return (
    <div className="flex flex-wrap items-center gap-2">
      {tags.map((t) => (
        <span key={t} className="inline-flex items-center gap-1 rounded-md bg-[#F3F4F6] px-2 py-0.5 text-[12px] text-[#364658]">
          {t}
          <button type="button" onClick={() => onChange(tags.filter((x) => x !== t))} className="text-[#7B8FA5] hover:text-[#2563EB]"><X size={12} /></button>
        </span>
      ))}
      {adding ? (
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); commit(); }
            if (e.key === 'Escape') { setDraft(''); setAdding(false); }
          }}
          onBlur={() => { commit(); setAdding(false); }}
          placeholder="Type and press Enter"
          className="h-7 w-[180px] rounded border border-[#d1d5db] px-2 text-[12px] text-[#364658] placeholder:text-[#9ca3af] focus:border-[#3D8BD0] focus:outline-none focus:ring-1 focus:ring-[#3D8BD0]"
        />
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className={`inline-flex h-6 items-center gap-1 rounded-md bg-[#E9EDF3] pl-1.5 pr-2 text-[12px] font-medium transition-colors hover:bg-[#DFE5ED] ${invalid ? 'text-[#F25C4E] ring-1 ring-[#F25C4E]' : 'text-[#18181B]'}`}
        >
          <Plus size={14} /> Add tag
        </button>
      )}
    </div>
  );
}

/** The ON/OFF pill from the Figma's "Status" component — used for block-level behaviour switches. */
export function StatusToggle({ on, onChange, disabled, title }: { on: boolean; onChange: (v: boolean) => void; disabled?: boolean; title?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={disabled}
      title={title}
      onClick={() => onChange(!on)}
      className="relative h-5 w-[47px] flex-shrink-0 rounded-full border border-[#DEE5ED] bg-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span className={`absolute top-1/2 -translate-y-1/2 text-[10px] leading-none text-[#A5BAD0] ${on ? 'left-[7px]' : 'right-[6px]'}`}>{on ? 'ON' : 'OFF'}</span>
      <span className={`absolute top-[2px] size-[14px] rounded-full shadow-[0_2px_2px_rgba(0,0,0,0.1)] transition-all ${on ? 'left-[29px] bg-[#89C540]' : 'left-[3px] bg-[#A5BAD0]'}`} />
    </button>
  );
}
