import { useRef, useState } from 'react';
import { ArrowLeft, Check, ChevronDown, FileText, Paperclip, Plus, Trash2, Upload, X } from 'lucide-react';
import { ErrorText, FieldLabel, inputCls as formInputCls } from './FormRuleControls';
import { EditorFormattingRow, RichComposerArea } from './EditorToolbar';

/* The pieces every module's create page is built from — first written for the Compliance Policy
 * page and moved here so all create pages read the same way:
 *
 *   CreatePageShell  the full page: back arrow + title, the first missing field in red, Cancel and
 *                    the main action at the top right, the form in one centred 840px column.
 *   Section          a section's name and one line; the gap between sections separates them.
 *   FormField        label (+ required star), the control, its error.
 *   TargetBox        a field that collects RECORDS (endpoints, patches, items…): a titled box with
 *                    a count, an illustrated empty state with the Add CTA, and once it holds
 *                    something its rows with the Add CTA moved to the header.
 *   Pills · RichTextField · FilesField · RemoveBtn · AgentSplit, and the empty-state pictures. */

/** The product's 32px input at the 4px radius the detail pages use. */
export const inputCls = formInputCls.replace('rounded-md', 'rounded');
export const thCls = 'whitespace-nowrap px-4 py-2 text-left text-[12px] font-semibold tracking-wider text-[#364658]';

export interface ShellAction { label: string; onClick: () => void; primary?: boolean }

/** ONE primary CTA with a dropdown arrow (Zeni, 12 Nov 2026): the face runs the option it shows
 *  (the first, e.g. Publish, until another is picked); the arrow switches it to another option,
 *  e.g. Save as Draft. Picking only changes the face — the click on the face is what saves. */
export function SplitCta({ options, up, full }: { options: ShellAction[]; /** Open the menu upward (a footer). */ up?: boolean; /** Fill the width. */ full?: boolean }) {
  const [pick, setPick] = useState(0);
  const [open, setOpen] = useState(false);
  const cur = options[Math.min(pick, options.length - 1)];
  return (
    <div className={'relative flex ' + (full ? 'w-full' : '')}>
      <button type="button" onClick={cur.onClick}
        className={'h-8 rounded-l bg-[#3D8BD0] px-3 text-[12px] font-medium text-white transition-colors hover:bg-[#3478B5] ' + (full ? 'flex-1' : '')}>{cur.label}</button>
      <button type="button" aria-label="More save options" aria-expanded={open} onClick={() => setOpen((o) => !o)}
        className="flex h-8 w-8 items-center justify-center rounded-r border-l border-white/30 bg-[#3D8BD0] text-white transition-colors hover:bg-[#3478B5]">
        <ChevronDown size={14} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-[9998]" onClick={() => setOpen(false)} />
          <div className={'absolute right-0 z-[9999] w-[200px] rounded-lg border border-[#DFE5ED] bg-white py-1 shadow-lg ' + (up ? 'bottom-full mb-1' : 'top-full mt-1')}>
            {options.map((o, i) => (
              <button key={o.label} type="button" onClick={() => { setPick(i); setOpen(false); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-[#364658] hover:bg-[#F5F7FA]">
                <span className="min-w-0 flex-1">{o.label}</span>
                {i === pick && <Check size={14} className="text-[#3D8BD0]" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/** The full create page. It sits under the product header, over the module, like the Form Rule
 *  and Compliance Policy editors. */
export function CreatePageShell({ title, onBack, error, actions, split, children, overlays, embedded, aside }: {
  title: string;
  /** One primary CTA with a dropdown, drawn after `actions`. */
  split?: ShellAction[];
  /** The form's help guide, pinned to the right. Its presence left-aligns the form. */
  aside?: React.ReactNode;
  onBack: () => void;
  /** The first thing stopping the save, shown once a save has been tried. */
  error?: string;
  actions: ShellAction[];
  children: React.ReactNode;
  /** Side drawers the page opens (pickers, previews) — rendered outside the scroll box. */
  overlays?: React.ReactNode;
  /** Inside a panel instead of over the whole screen — the old-vs-new comparison page. */
  embedded?: boolean;
}) {
  return (
    <div className={embedded ? 'relative flex h-full flex-col bg-white' : 'fixed inset-x-0 bottom-0 top-[56px] z-[9000] flex flex-col bg-white'}>
      <div className="flex flex-shrink-0 items-center gap-2 border-b border-[#DFE5ED] px-4 py-3">
        <button type="button" onClick={onBack} title="Back" className="-ml-1.5 flex size-[30px] flex-shrink-0 items-center justify-center rounded text-[#7B8FA5] transition-colors hover:bg-[#EEF2F6] hover:text-[#364658]">
          <ArrowLeft size={16} />
        </button>
        <h1 className="truncate text-[16px] font-medium text-[#364658]">{title}</h1>
        <div className="ml-auto flex flex-shrink-0 items-center gap-2.5">
          {error && <span className="text-[12px] text-[#F25C4E]">{error}</span>}
          <button type="button" onClick={onBack} className="rounded border border-[#DFE5ED] bg-white px-3 py-1.5 text-[12px] font-medium text-[#7B8FA5] transition-colors hover:bg-[#F9FAFB] hover:text-[#364658]">Cancel</button>
          {actions.map((a) => (
            <button
              key={a.label}
              type="button"
              onClick={a.onClick}
              className={a.primary
                ? 'rounded bg-[#3D8BD0] px-3 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-[#3478B5]'
                : 'rounded border border-[#DFE5ED] bg-white px-3 py-1.5 text-[12px] font-medium text-[#364658] transition-colors hover:bg-[#F9FAFB]'}
            >{a.label}</button>
          ))}
          {split && <SplitCta options={split} />}
        </div>
      </div>
      {aside && !embedded ? (
        /* With a guide (Zeni, 30 Oct 2026): the form is LEFT-aligned at the header's edge and the guide is
           pinned to the right edge; the room the form does not need sits between them. Each scrolls on its own. */
        <div className="flex min-h-0 flex-1">
          <div data-create-scroll className="min-h-0 min-w-0 flex-1 overflow-y-auto">
            <div className="max-w-[840px] space-y-10 px-4 py-6">{children}</div>
          </div>
          <div className="w-[360px] flex-shrink-0 xl:w-[420px]">{aside}</div>
        </div>
      ) : (
        <div data-create-scroll className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[840px] space-y-10 px-4 py-6">{children}</div>
        </div>
      )}
      {overlays}
    </div>
  );
}

/** A section of the form: its name and one line, then its fields. No icon and no divider —
 *  the gap between sections (space-y-10 on the column) is what separates them. */
export function Section({ title, sub, marker, children }: { title: string; sub?: string; /** What the help guide reads this section as ('|'-separated); defaults to the title. */ marker?: string; children: React.ReactNode }) {
  return (
    <section data-section-title={marker ?? title}>
      <div className="mb-4">
        <h2 className="text-[15px] font-semibold text-[#364658]">{title}</h2>
        {sub && <p className="mt-px text-[12px] text-[#7B8FA5]">{sub}</p>}
      </div>
      {children}
    </section>
  );
}

/** Label, control, error. `wide` spans both columns of the section's two-up grid. */
export function FormField({ label, required, error, hint, wide, action, children }: {
  label: string; required?: boolean; error?: string; hint?: React.ReactNode; wide?: boolean;
  /** A small control at the label row's right end (e.g. Reset to Default as an icon). */
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className={`min-w-0 ${wide ? 'col-span-2' : ''}`}>
      {action
        ? <div className="flex items-start justify-between gap-2"><FieldLabel required={required}>{label}</FieldLabel><div className="-mt-1 flex-shrink-0">{action}</div></div>
        : <FieldLabel required={required}>{label}</FieldLabel>}
      {children}
      {hint && !error && <p className="mt-1 text-[12px] text-[#7B8FA5]">{hint}</p>}
      <ErrorText>{error}</ErrorText>
    </div>
  );
}

/** The product's segmented choice (pill-track). */
export function Pills<T extends string>({ value, options, onChange, disabled }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; disabled?: boolean }) {
  return (
    <div className={`pill-track !inline-flex w-fit [&>button]:!flex-none [&>button]:!px-4 ${disabled ? 'pointer-events-none opacity-50' : ''}`}>
      {options.map((o) => (
        <button key={o.value} type="button" aria-pressed={value === o.value} onClick={() => onChange(o.value)}>{o.label}</button>
      ))}
    </div>
  );
}

/** Description-style text: the composer's own formatting row over its rich typing surface. */
export function RichTextField({ value, onChange, placeholder, tall, invalid }: { value: string; onChange: (v: string) => void; placeholder?: string; tall?: boolean; invalid?: boolean }) {
  return (
    <div className={`rounded border bg-white focus-within:border-[#3D8BD0] focus-within:ring-1 focus-within:ring-[#3D8BD0] ${invalid ? 'border-[#F25C4E]' : 'border-[#DFE5ED]'}`}>
      <EditorFormattingRow className="relative flex flex-wrap items-center gap-0.5 rounded-t border-b border-[#EEF1F4] bg-[#F9FAFB] px-2 py-1" />
      <div className={`px-3 py-2 ${tall ? '[&>div]:!min-h-[320px]' : '[&>div]:!min-h-[96px]'}`}>
        <RichComposerArea value={value} onChange={onChange} placeholder={placeholder ?? 'Write a description'} />
      </div>
    </div>
  );
}

export interface PickedFile { name: string; size: number }
const fmtSize = (b: number) => (b >= 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

/** Attachments: a drop zone that is also a browse button, then the chosen files as chips. */
export function FilesField({ files, onChange, invalid }: { files: PickedFile[]; onChange: (f: PickedFile[]) => void; invalid?: boolean }) {
  const ref = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const add = (list: FileList | null) => {
    if (!list) return;
    const next = [...files];
    Array.from(list).forEach((f) => { if (!next.some((x) => x.name === f.name)) next.push({ name: f.name, size: f.size }); });
    onChange(next);
  };
  return (
    <div>
      <button
        type="button"
        onClick={() => ref.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); add(e.dataTransfer.files); }}
        className={`flex w-full items-center justify-center gap-2 rounded border border-dashed px-3 py-3 text-[12px] transition-colors ${over ? 'border-[#3D8BD0] bg-[#EBF5FF] text-[#3D8BD0]' : invalid ? 'border-[#F25C4E] text-[#64748B]' : 'border-[#CBD5E1] text-[#64748B] hover:border-[#3D8BD0] hover:bg-[#F8FBFE]'}`}
      >
        <Upload size={15} className="text-[#7B8FA5]" />
        Drop files here or <span className="font-medium text-[#3D8BD0]">browse</span>
      </button>
      <input ref={ref} type="file" multiple className="hidden" onChange={(e) => { add(e.target.files); e.target.value = ''; }} />
      {files.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {files.map((f) => (
            <span key={f.name} className="inline-flex max-w-full items-center gap-1.5 rounded border border-[#DFE5ED] bg-[#F9FAFB] py-1 pl-2 pr-1 text-[12px] text-[#364658]">
              <Paperclip size={12} className="flex-shrink-0 text-[#7B8FA5]" />
              <span className="truncate">{f.name}</span>
              <span className="flex-shrink-0 text-[#7B8FA5]">{fmtSize(f.size)}</span>
              <button type="button" title="Remove" onClick={() => onChange(files.filter((x) => x.name !== f.name))} className="flex size-5 flex-shrink-0 items-center justify-center rounded text-[#7B8FA5] hover:bg-[#EEF2F6] hover:text-[#364658]"><X size={12} /></button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/** One way of choosing records: a titled box with its count, an empty state that says what the
 *  box is for, and — once it holds something — its rows with the Add CTA moved to the header. */
export function TargetBox({ title, count, addLabel, onAdd, addReason, invalid, emptyArt, emptyText, children, required }: {
  title: string; count: number; addLabel: string; onAdd: () => void; addReason?: string; invalid?: boolean;
  emptyArt: React.ReactNode; emptyText: React.ReactNode; children: React.ReactNode; required?: boolean;
}) {
  return (
    <div className={`overflow-hidden rounded-lg border ${invalid ? 'border-[#F25C4E]' : 'border-[#E5E7EB]'}`}>
      <div className="flex min-h-[48px] items-center gap-3 border-b border-[#EEF1F4] bg-[#F6F9FC] px-4 py-2">
        <span className="text-[13px] font-semibold text-[#364658]">{title}{required && <span className="text-[#F25C4E]"> *</span>} <span className="ml-1 rounded-sm bg-[#EEF2F6] px-1.5 py-0.5 text-[11px] font-medium text-[#64748B]">{count}</span></span>
        {count > 0 && (
          <button type="button" onClick={onAdd} className="ml-auto inline-flex h-8 items-center gap-1.5 rounded border border-[#DFE5ED] bg-white px-3 text-[13px] font-medium text-[#364658] transition-colors hover:bg-[#F5F7FA]"><Plus size={14} /> {addLabel}</button>
        )}
      </div>
      {count === 0 ? (
        <div className="flex flex-col items-center px-4 pb-6 pt-4 text-center">
          {emptyArt}
          <p className="mt-2 max-w-[560px] text-[13px] leading-[1.55] text-[#64748B]">{emptyText}</p>
          <button
            type="button"
            disabled={!!addReason}
            onClick={onAdd}
            className="mt-4 inline-flex h-8 items-center gap-1.5 rounded bg-[#3D8BD0] px-3.5 text-[13px] font-medium text-white transition-colors hover:bg-[#3478B5] disabled:cursor-not-allowed disabled:opacity-50"
          ><Plus size={14} /> {addLabel}</button>
        </div>
      ) : <div className="overflow-x-auto">{children}</div>}
    </div>
  );
}

/** "12 online · 2 offline" — the agent dots the endpoint rows use. */
export function AgentSplit({ online, offline }: { online: number; offline: number }) {
  return (
    <span className="flex items-center gap-3 text-[13px] text-[#64748B]">
      <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-[#22C55E]" />{online} online</span>
      {offline > 0 && <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-[#F59E0B]" />{offline} offline</span>}
    </span>
  );
}

/** The Actions column's delete — always visible on every added row, as the product shows it, red on hover. */
export function RemoveBtn({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" title="Remove" aria-label="Remove" onClick={onClick} className="inline-flex size-7 items-center justify-center rounded text-[#7B8FA5] transition-colors hover:bg-[#FEF2F2] hover:text-[#DC2626]"><Trash2 size={15} /></button>
  );
}

/* ── Empty-state pictures. Same family: a soft #F3F7FC ground, grey outlines for what is not
      there yet, one blue mark for the action. 148×104 so every box holds the same height. ── */

function Art({ children }: { children: React.ReactNode }) {
  return (
    <svg width="148" height="104" viewBox="0 0 148 104" fill="none" aria-hidden="true" focusable="false">
      <ellipse cx="74" cy="56" rx="64" ry="42" fill="#F3F7FC" />
      {children}
    </svg>
  );
}
/** The blue "+" badge the add-something pictures share. */
const PlusBadge = ({ x, y }: { x: number; y: number }) => (
  <>
    <circle cx={x} cy={y} r="11" fill="#FFFFFF" stroke="#3D8BD0" strokeWidth="2.25" />
    <path d={`M${x} ${y - 5} V${y + 5} M${x - 5} ${y} H${x + 5}`} stroke="#3D8BD0" strokeWidth="2.25" strokeLinecap="round" />
  </>
);

/** "No endpoints yet": a monitor with an empty, dashed screen and a magnifier that found nothing. */
export function EmptyEndpointsArt() {
  return (
    <Art>
      <rect x="22" y="22" width="52" height="36" rx="4" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1.25" />
      <path d="M40 64 H56 M48 58 V64" stroke="#E2E8F0" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="44" y="30" width="62" height="44" rx="5" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.25" />
      <rect x="50" y="36" width="50" height="30" rx="2.5" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1" strokeDasharray="3 2.5" />
      <path d="M66 81 H84 M75 74 V81" stroke="#CBD5E1" strokeWidth="1.75" strokeLinecap="round" />
      <rect x="56" y="44" width="20" height="2.4" rx="1.2" fill="#E2E8F0" />
      <rect x="56" y="50" width="30" height="2.4" rx="1.2" fill="#EEF2F6" />
      <circle cx="108" cy="62" r="13" fill="#FFFFFF" stroke="#3D8BD0" strokeWidth="2.25" />
      <path d="M117.5 71.5 L126 80" stroke="#3D8BD0" strokeWidth="3" strokeLinecap="round" />
      <path d="M103.5 57.5 L112.5 66.5 M112.5 57.5 L103.5 66.5" stroke="#9DC3E8" strokeWidth="2" strokeLinecap="round" />
    </Art>
  );
}

/** "No remote offices yet": two office buildings. */
export function EmptyOfficesArt() {
  return (
    <Art>
      <rect x="30" y="38" width="34" height="44" rx="3" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1.25" />
      {[46, 56, 66].map((y) => <path key={y} d={`M38 ${y} H44 M50 ${y} H56`} stroke="#E2E8F0" strokeWidth="2" strokeLinecap="round" />)}
      <rect x="56" y="22" width="44" height="60" rx="4" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.25" />
      {[32, 43, 54].map((y) => <path key={y} d={`M65 ${y} H72 M84 ${y} H91`} stroke="#CBD5E1" strokeWidth="2.25" strokeLinecap="round" />)}
      <rect x="72" y="66" width="12" height="16" rx="1.5" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1.25" />
      <path d="M22 82 H126" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" />
      <PlusBadge x={108} y={36} />
    </Art>
  );
}

/** "No patches yet": a stack of update cards, the front one with a dashed, empty body. */
export function EmptyPatchesArt() {
  return (
    <Art>
      <rect x="34" y="20" width="58" height="66" rx="5" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1.25" />
      <rect x="44" y="28" width="58" height="66" rx="5" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.25" />
      <path d="M58 40 l4 -4 h12 l4 4 v8 c0 6 -6 10 -10 12 c-4 -2 -10 -6 -10 -12 z" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1.25" strokeLinejoin="round" />
      <rect x="54" y="66" width="38" height="2.4" rx="1.2" fill="#E2E8F0" />
      <rect x="54" y="73" width="26" height="2.4" rx="1.2" fill="#EEF2F6" />
      <PlusBadge x={106} y={30} />
    </Art>
  );
}

/** "No packages yet": an open, empty carton. */
export function EmptyPackagesArt() {
  return (
    <Art>
      <path d="M44 44 L74 32 L104 44 L74 56 Z" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1.25" strokeLinejoin="round" />
      <path d="M44 44 V74 L74 86 V56 Z" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.25" strokeLinejoin="round" />
      <path d="M104 44 V74 L74 86 V56 Z" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1.25" strokeLinejoin="round" />
      <path d="M44 44 L34 34 L64 22 L74 32 M104 44 L114 34 L84 22 L74 32" stroke="#E2E8F0" strokeWidth="1.25" strokeLinejoin="round" />
      <path d="M52 62 L60 65.5" stroke="#E2E8F0" strokeWidth="2" strokeLinecap="round" />
      <PlusBadge x={112} y={70} />
    </Art>
  );
}

/** "No registry templates yet": a key tree with empty values. */
export function EmptyRegistryArt() {
  return (
    <Art>
      <rect x="32" y="22" width="84" height="64" rx="5" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.25" />
      <path d="M32 33 H116" stroke="#E2E8F0" strokeWidth="1.25" />
      {[44, 56, 68].map((y, i) => (
        <g key={y}>
          <path d={`M${44 + i * 8} ${y} h6`} stroke="#CBD5E1" strokeWidth="1.25" strokeLinecap="round" />
          <rect x={52 + i * 8} y={y - 3} width="8" height="6" rx="1" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1" />
          <rect x={64 + i * 8} y={y - 1.2} width={28 - i * 6} height="2.4" rx="1.2" fill="#E2E8F0" />
        </g>
      ))}
      <path d="M44 38 V56 M52 50 V68" stroke="#E2E8F0" strokeWidth="1.25" />
      <PlusBadge x={112} y={78} />
    </Art>
  );
}

/** "No assets linked": a laptop with an empty screen and a link mark. */
export function EmptyAssetsArt() {
  return (
    <Art>
      <rect x="40" y="26" width="64" height="42" rx="4" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.25" />
      <rect x="46" y="32" width="52" height="30" rx="2" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1" strokeDasharray="3 2.5" />
      <path d="M32 74 H112 L106 80 H38 Z" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1.25" strokeLinejoin="round" />
      <PlusBadge x={110} y={32} />
    </Art>
  );
}

/** "No configuration items linked": three nodes, the third one still dashed. */
export function EmptyCisArt() {
  return (
    <Art>
      <path d="M52 40 L74 66 M96 40 L74 66" stroke="#CBD5E1" strokeWidth="1.5" />
      <rect x="38" y="28" width="28" height="22" rx="4" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.25" />
      <rect x="82" y="28" width="28" height="22" rx="4" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.25" />
      <rect x="60" y="60" width="28" height="22" rx="4" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1.25" strokeDasharray="3 2.5" />
      <rect x="44" y="36" width="14" height="2.4" rx="1.2" fill="#E2E8F0" />
      <rect x="88" y="36" width="14" height="2.4" rx="1.2" fill="#E2E8F0" />
      <PlusBadge x={112} y={70} />
    </Art>
  );
}

/** "No items yet": an order sheet with empty rows. */
export function EmptyItemsArt() {
  return (
    <Art>
      <rect x="38" y="20" width="62" height="70" rx="5" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.25" />
      <rect x="46" y="30" width="30" height="3" rx="1.5" fill="#CBD5E1" />
      {[44, 54, 64].map((y) => (
        <g key={y}>
          <rect x="46" y={y - 3} width="6" height="6" rx="1" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1" />
          <rect x="56" y={y - 1.2} width="22" height="2.4" rx="1.2" fill="#E2E8F0" />
          <rect x="82" y={y - 1.2} width="10" height="2.4" rx="1.2" fill="#EEF2F6" />
        </g>
      ))}
      <path d="M46 76 H92" stroke="#E2E8F0" strokeWidth="1.25" strokeDasharray="3 2.5" />
      <PlusBadge x={106} y={74} />
    </Art>
  );
}

/** "No conditions": a condition row as it will look, and the next one still empty. */
export function EmptyConditionsArt() {
  return (
    <Art>
      {/* The thing being added, drawn as itself: one filled condition row (Where · Priority · is · High)
          and the next one still dashed — the same row the Add Condition button produces. */}
      <rect x="14" y="24" width="120" height="58" rx="5" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.25" />
      <g fontFamily="Inter, system-ui, sans-serif" fontSize="7" fontWeight="500">
        <text x="21" y="42" fill="#7B8FA5">Where</text>
        <rect x="47" y="34" width="34" height="12" rx="2.5" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1" />
        <text x="51" y="42.5" fill="#364658">Priority</text>
        <rect x="84" y="34" width="15" height="12" rx="2.5" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1" />
        <text x="88.5" y="42.5" fill="#364658">is</text>
        <rect x="102" y="34" width="26" height="12" rx="2.5" fill="#EBF5FF" stroke="#9DC3E8" strokeWidth="1" />
        <text x="106" y="42.5" fill="#3D8BD0">High</text>
        <text x="21" y="66" fill="#B6C2D1">And</text>
      </g>
      <rect x="47" y="58" width="34" height="12" rx="2.5" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1" strokeDasharray="3 2.5" />
      <rect x="84" y="58" width="15" height="12" rx="2.5" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1" strokeDasharray="3 2.5" />
      <rect x="102" y="58" width="26" height="12" rx="2.5" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1" strokeDasharray="3 2.5" />
      <PlusBadge x={128} y={84} />
    </Art>
  );
}

/** "No columns chosen": a table header with empty columns. */
export function EmptyColumnsArt() {
  return (
    <Art>
      <rect x="30" y="26" width="88" height="56" rx="5" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.25" />
      <path d="M30 38 H118" stroke="#CBD5E1" strokeWidth="1.25" />
      {[52, 74, 96].map((x) => <path key={x} d={`M${x} 26 V82`} stroke="#E2E8F0" strokeWidth="1.25" strokeDasharray="3 2.5" />)}
      <rect x="36" y="31" width="10" height="2.4" rx="1.2" fill="#CBD5E1" />
      <PlusBadge x={112} y={78} />
    </Art>
  );
}

/** A plain document glyph for file-like rows. */
export const DocGlyph = () => <FileText size={15} className="flex-shrink-0 text-[#7B8FA5]" />;
