import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, Check, ChevronDown, ChevronRight, Eye, Filter, PenLine, X } from 'lucide-react';
import { PORTAL_INDUSTRIES, VISIBLE_TEMPLATES, industriesOf, industryChip, industryName } from './supportPortalData';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import type { PortalTemplate } from './supportPortalData';
import { TemplateArt } from './SupportPortalTemplateGallery';
import { SupportPortalPreview } from './SupportPortalPreview';
import { DEFAULT_THEME, swatchesOf } from './PortalThemePanel';

/* ── the Default tile's picture ──────────────────────────────────────────────
 *
 * ⚠️ THE REAL PAGE, rendered small — not a drawing of it. Every other tile is a wireframe because
 * every other tile is a template nobody has built yet; there is nothing to photograph. This one is
 * different: the portal it offers EXISTS, so the tile can simply show it, and the one starting
 * point an admin might actually recognise stops being the one they have to take on trust.
 *
 * ⚠️ Live, never a screenshot. A PNG committed today is a picture of the portal as it was today —
 * it would keep promising the old layout after the first person edited the page, and nothing would
 * ever tell us it had gone stale. This mounts the same `SupportPortalPreview` the builder draws,
 * with no props, which IS the page a new portal starts from.
 *
 * ⚠️ Rendered at a full page width and SCALED DOWN, rather than rendered narrow. The portal is
 * responsive: at 267px it would reflow to its one-column phone layout, and the tile would show a
 * truthful picture of the wrong thing. Scaling keeps the desktop composition the admin is being
 * asked to recognise.
 *
 * The canvas context has a default with `enabled: false`, so no outline, hint or handle comes with
 * it; `pointer-events-none` and `aria-hidden` finish the job of making it a picture. */
const THUMB_SRC_W = 1180;
/* ⚠️ The accent is READ from the theme, exactly as the builder reads it (`swatchesOf(theme)[3]`),
   never left to `SupportPortalPreview`'s own `accent` default. That default is a near-black, so the
   tile promising "the portal your requesters see today" was painting its banner a colour the page
   does not use — a picture wrong in the one way a picture is meant to be right. */
const THUMB_ACCENT = swatchesOf(DEFAULT_THEME)[3];

function PortalThumb() {
  const box = useRef<HTMLSpanElement>(null);
  const [scale, setScale] = useState(0);
  /* Measured, because the tile's width is the grid's to decide and it changes with the dialog. A
     hard-coded scale would be right at exactly one dialog width. */
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const read = () => setScale(el.clientWidth / THUMB_SRC_W);
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <span ref={box} className="relative block size-full overflow-hidden bg-white">
      <span
        aria-hidden
        className="pointer-events-none absolute left-0 top-0 block origin-top-left select-none"
        /* Hidden until measured — at scale 0 it would flash full size for a frame. */
        style={{ width: THUMB_SRC_W, transform: `scale(${scale})`, visibility: scale ? 'visible' : 'hidden' }}
      >
        <SupportPortalPreview accent={THUMB_ACCENT} />
      </span>
    </span>
  );
}

/* Create Support Portal — two steps, one dialog.
 *
 * ⚠️ The steps are ORDERED because the second genuinely depends on the first. You cannot choose a
 * layout for a portal that does not exist yet: step 1 creates the record — name, address, who signs
 * in — and step 2 decides what is on it. That is why step 2 is unreachable until step 1 is saved,
 * and why the step marker is a real state rather than decoration.
 *
 * ⚠️ Saving step 1 CREATES the portal, as a Draft, before step 2 is answered. Closing the dialog
 * from step 2 therefore leaves a real portal in the listing rather than throwing the details away —
 * the same rule the old New-page routes followed, for the same reason: nothing an admin has typed
 * should disappear because they stopped to think about the next question.
 */

export interface PortalDetails {
  name: string;
  company: string;
  url: string;
  idp: string;
  ssoOnly: boolean;
}

/* Mock, like every other list in this prototype. Company is required, so it has to have options. */
const COMPANIES = ['Acme Corporation', 'Acme EMEA', 'Acme Manufacturing', 'Northwind Logistics'];
const IDPS = ['None — use ServiceOps login', 'Azure AD', 'Okta', 'Google Workspace', 'SAML 2.0'];

const label = 'mb-1 block text-[13px] text-[#7B8FA5]';
const input = 'h-9 w-full rounded border border-[#d1d5db] px-2.5 text-[13px] text-[#364658] outline-none transition-colors focus:border-[#3D8BD0]';

const Req = () => <span className="text-[#EF4444]"> *</span>;

/** The five things a portal is, asked once and reused by Create and by Edit details. */
export function PortalDetailsFields({ value, onChange }: {
  value: PortalDetails; onChange: (next: PortalDetails) => void;
}) {
  const set = (k: keyof PortalDetails, v: string | boolean) => onChange({ ...value, [k]: v });
  return (
    <>
      {/* Two columns, as in the product: what the portal IS on the left, who it belongs to and how
          people sign in on the right. */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-4">
        <div>
          <label className={label}>Support Portal Name<Req /></label>
          <input className={input} value={value.name} onChange={(e) => set('name', e.target.value)} placeholder="Support Portal Name" />
        </div>
        <div>
          <label className={label}>Company<Req /></label>
          <select className={`${input} app-select`} value={value.company} onChange={(e) => set('company', e.target.value)}>
            <option value="">Select</option>
            {COMPANIES.map((x) => <option key={x} value={x}>{x}</option>)}
          </select>
        </div>
        <div>
          <label className={label}>Support Portal URL<Req /></label>
          <input className={input} value={value.url} onChange={(e) => set('url', e.target.value)} placeholder="Support Portal URL" />
        </div>
        <div>
          <label className={label}>Identity Provider</label>
          <select className={`${input} app-select`} value={value.idp} onChange={(e) => set('idp', e.target.value)}>
            {IDPS.map((x) => <option key={x} value={x}>{x}</option>)}
          </select>
        </div>
      </div>

      {/* ⚠️ Removed, not greyed, until a provider is chosen — enforcing SSO with no SSO configured
          is a switch with nothing behind it, and the same rule the Branding panel follows. */}
      {value.idp !== IDPS[0] && (
        <div className="mt-6">
          <label className={label}>Enforce to authenticate with Single Sign-On Only</label>
          <button
            role="switch"
            aria-checked={value.ssoOnly}
            onClick={() => set('ssoOnly', !value.ssoOnly)}
            className={`relative mt-1 inline-flex h-[18px] w-[34px] items-center rounded-full transition-colors ${value.ssoOnly ? 'bg-[#3D8BD0]' : 'bg-[#CBD5E1]'}`}
          >
            <span className={`inline-block size-[14px] rounded-full bg-white transition-transform ${value.ssoOnly ? 'translate-x-[18px]' : 'translate-x-[2px]'}`} />
          </button>
        </div>
      )}
    </>
  );
}

/** Name, Company and URL are required — see the note on Create's Save. */
export const detailsReady = (d: PortalDetails) => !!(d.name.trim() && d.company.trim() && d.url.trim());

/* Edit details — the same five questions, on a portal that already exists.
 *
 * ⚠️ It opens IMMEDIATELY after a Copy. A duplicate inherits everything including the URL, and two
 * portals cannot answer on one address — so rather than creating a quiet conflict and waiting for
 * someone to find it, the copy asks for the details that have to differ at the moment it is made. */
export function EditPortalDetailsModal({ title, initial, onClose, onSave }: {
  title: string;
  initial: PortalDetails;
  onClose: () => void;
  onSave: (d: PortalDetails) => void;
}) {
  const [d, setD] = useState<PortalDetails>(initial);
  const ready = detailsReady(d);
  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-start justify-center bg-[#0F172A]/40 p-6 pt-[10vh]">
      {/* ⚠️ The SAME width as the create dialog — `min(1240px, 100vw-48px)`. They ask the identical five
          questions, so a narrower box made Edit details read as a different, smaller form: the fields
          moved, the two columns changed width, and the same five answers wrapped differently in each.
          Height is NOT shared: create is two steps and reserves room for the template grid, while this
          is one short form and would be mostly empty at 980px. */}
      <div className="flex w-[min(1240px,calc(100vw-48px))] flex-col overflow-hidden rounded-lg bg-white shadow-[0_24px_48px_-12px_rgba(16,24,40,0.25)]">
        <div className="flex items-center gap-3 border-b border-[#E5E7EB] px-5 py-3.5">
          <h2 className="flex-1 text-[16px] font-semibold text-[#364658]">{title}</h2>
          <button onClick={onClose} className="flex size-8 items-center justify-center rounded text-[#64748B] transition-colors hover:bg-[#F3F4F6]"><X size={18} /></button>
        </div>
        <div className="px-5 py-5"><PortalDetailsFields value={d} onChange={setD} /></div>
        <div className="flex justify-end gap-2 border-t border-[#E5E7EB] px-5 py-3">
          <button onClick={onClose} className="inline-flex h-9 items-center rounded border border-[#DFE5ED] bg-white px-4 text-[13px] font-medium text-[#364658] transition-colors hover:bg-[#F5F7FA]">Cancel</button>
          <button
            onClick={() => ready && onSave(d)}
            disabled={!ready}
            title={ready ? undefined : 'Name, Company and URL are required'}
            className={`inline-flex h-9 items-center rounded px-4 text-[13px] font-medium text-white transition-colors ${
              ready ? 'bg-[#3D8BD0] hover:bg-[#2d6ca0]' : 'cursor-not-allowed bg-[#B6C2D5]'
            }`}
          >Save</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/** The two-dot progress marker. Says which step you are on and whether the other is reachable. */
function Steps({ step, canGoBack, onBack }: { step: 1 | 2; canGoBack: boolean; onBack: () => void }) {
  const rows: { n: 1 | 2; title: string }[] = [
    { n: 1, title: 'Support portal details' },
    { n: 2, title: 'Support portal customization' },
  ];
  /* ⚠️ A BREADCRUMB, not numbered circles on a filled band. The numbers were answering a question
     nobody asks of a two-step dialog — you can see there are two, and which one you are on is the
     only thing worth saying. What is left says exactly that: the step behind you is grey and
     pressable, the one you are on is the product's blue, and a chevron points between them.
     ⚠️ The band's fill went with the circles. A tinted strip under the title made the steps read as
     a toolbar belonging to the dialog rather than as a position within it. */
  return (
    <div className="flex flex-shrink-0 items-center gap-1.5 border-b border-[#E5E7EB] bg-white px-5 py-2.5">
      {rows.map((r, i) => {
        const on = step === r.n;
        /* ⚠️ Step 1 stays clickable from step 2 — the details are editable until you leave, and a
           marker you cannot press is a picture of progress rather than a way through it. Step 2 is
           NOT clickable from step 1: it has nothing to show until the portal exists. */
        const clickable = r.n === 1 && canGoBack && !on;
        return (
          <div key={r.n} className="flex items-center gap-1.5">
            <button
              onClick={clickable ? onBack : undefined}
              disabled={!clickable}
              className={`rounded px-1.5 py-0.5 text-[13px] transition-colors ${
                on ? 'font-semibold text-[#3D8BD0]'
                  : clickable ? 'cursor-pointer text-[#7B8FA5] hover:bg-[#F5F7FA] hover:text-[#364658]'
                    : 'cursor-default text-[#C3CBD6]'
              }`}
            >{r.title}</button>
            {i === 0 && <ChevronRight size={13} className="flex-shrink-0 text-[#C3CBD6]" />}
          </div>
        );
      })}
    </div>
  );
}

/* The industries a template is built for, on its card.
 *
 * ⚠️ TWO upfront and the rest behind a count. A template can serve up to six, and six chips in a
 * card footer is a list nobody reads sitting where the card's name should be — at this width they
 * would wrap to three lines and push the grid ragged. Two is enough to say what the layout is FOR;
 * the count says there is more, and the tooltip says what, which is the one question a "+2" leaves.
 * ⚠️ OUTLINE chips, where the category is a filled one. They are two different kinds of label —
 * whose desk this is, and whose business — and drawn identically they read as one row of five tags
 * with no way to tell which is which.
 * ⚠️ On the NAME'S OWN ROW, at its right end — not on a line of their own. A second line grows
 * every card by 30px to carry two words, and a grid of templates is read by its pictures: paying a
 * tenth of every tile's height for a label is the wrong trade. It also means the card's height is
 * the same whether a template has industries or not, so the grid stays even.
 * ⚠️ Which is what made room for them: the CATEGORY chip moved up onto the thumbnail. Measured, a
 * name plus two industries plus a count plus a category is 371-401px inside a 351px row — the two
 * could not share it, and the category is the one already answered by the filter chips directly
 * above the grid, where every template on screen reads "IT Support".
 * ⚠️ The chips never shrink and the NAME truncates, because a half-shown tag is unreadable while a
 * clipped name is still recognisable next to its own picture. */
function IndustryTags({ ids }: { ids: string[] }) {
  if (!ids.length) return null;
  const rest = ids.slice(2);
  const chip = 'inline-flex flex-shrink-0 items-center rounded-md bg-[#F1F5F9] px-1.5 py-0.5 text-[11px] font-medium text-[#64748B]';
  /* ⚠️ `delayDuration={0}` — INSTANT, against the product's 700ms default. That default is right for
     a tooltip that repeats a label you can already read: waiting is what stops it flashing at
     everything the pointer crosses. This one is the opposite — the chip says "+2" and NOTHING else
     on screen says which two, so the wait is three quarters of a second of a control that looks
     broken. A tooltip carrying information you cannot get anywhere else should not be rationed.
     ⚠️ `text-wrap` overrides the shared content's `text-balance`, which splits short text into
     equal-length lines and leaves a ragged half-empty box. */
  /* ⚠️ The key goes on the Tooltip ITSELF, never on a wrapper. Wrapping it in a keyed `<span>` put
     an inline box around the chip whose line height is taller than the chip is, and the one card
     with a shortened tag came out 3px taller than the rest — which stretched its whole grid row. */
  const tip = (key: string, label: ReactNode, lines: string[]) => (
    <Tooltip key={key} delayDuration={0}>
      <TooltipTrigger asChild>
        {/* ⚠️ `cursor-help`, not a pointer: this is not a button and pressing it does nothing.
            A pointer on a thing that only answers on hover is a promise the chip cannot keep. */}
        <span className={`${chip} cursor-help`}>{label}</span>
      </TooltipTrigger>
      {/* ⚠️ The PRODUCT's tooltip, not a card of its own. Every other hover in this app answers in
          the same small dark pill, and a bespoke one here — a caps heading over a list — made the
          one hover on this screen look like a different kind of object. The names, separated the way
          the chips are. `text-wrap` still overrides the shared `text-balance`, which splits short text
          into equal lines and leaves a ragged half-empty box. */}
      <TooltipContent side="top" sideOffset={6} className="max-w-[240px] text-wrap">
        {lines.join(' · ')}
      </TooltipContent>
    </Tooltip>
  );
  return (
    <span className="flex flex-shrink-0 items-center gap-1">
      {ids.slice(0, 2).map((id) => (
        /* ⚠️ The SAME tooltip for a shortened chip, not a native `title`. One chip in the row
           answering in the browser's own grey box a second later, while the one beside it answers
           instantly in the product's, reads as two different controls. Only a chip whose label was
           cut gets one — a tooltip repeating a word already in full is noise. */
        industryChip(id) !== industryName(id)
          ? tip(id, industryChip(id), [industryName(id)])
          : <span key={id} className={chip}>{industryChip(id)}</span>
      ))}
      {rest.length > 0 && tip('more', `+${rest.length}`, rest.map(industryName))}
    </span>
  );
}

/* The gallery's filter: which INDUSTRIES a template has to be built for to be shown.
 *
 * ⚠️ The product's own Filter PILL and popup — the funnel, the label that reads "All" or
 * "Government +2", the chips for what is on, the checked rows, and Clear all / Done — the same
 * control the Deployment tab and the CMDB map already use. A second filter language on the one
 * screen that is choosing a starting point would be the thing an admin has to learn twice.
 * ⚠️ It REPLACED the category pills. Category is department scope, every visible template says
 * "IT Support", and a row of five pills where four return nothing is a control that teaches you not
 * to touch it. Industry is the axis these templates actually differ on.
 * ⚠️ MULTI-SELECT, matching OR: an admin shopping for a layout is usually in one vertical but will
 * happily look at a neighbouring one, and a single-select would make comparing two a round trip.
 * ⚠️ The DEFAULT tile ignores it — see the note on the grid. */
function IndustryFilter({ value, onChange }: { value: string[]; onChange: (next: string[]) => void }) {
  const [open, setOpen] = useState(false);
  const on = value.length > 0;
  const label = !on ? 'All industries'
    : `${industryName(value[0])}${value.length > 1 ? ` +${value.length - 1}` : ''}`;
  const toggle = (id: string) => onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        title="Filter templates by industry"
        className={`inline-flex h-8 items-center gap-1.5 rounded border px-3 text-[13px] font-medium transition-colors ${on ? 'border-[#3D8BD0] bg-[#F0F8FF] text-[#3D8BD0]' : 'border-[#DFE5ED] text-[#364658] hover:bg-[#F3F4F6]'}`}
      >
        <Filter size={15} className={on ? 'text-[#3D8BD0]' : 'text-[#7B8FA5]'} />
        <span className="max-w-[180px] truncate">{label}</span>
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''} ${on ? 'text-[#3D8BD0]' : 'text-[#7B8FA5]'}`} />
      </button>
      {open && (
        <>
          {/* The click-away sheet the product's other filter popups use. */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-1.5 w-[260px] rounded-lg border border-[#DFE5ED] bg-white shadow-lg">
            {on && (
              <div className="flex flex-wrap gap-1.5 border-b border-[#F0F2F5] p-2.5">
                {value.map((id) => (
                  <span key={id} className="inline-flex items-center gap-1 rounded bg-[#F1F5F9] px-2 py-0.5 text-[12px] text-[#364658]">
                    {industryName(id)}
                    <button onClick={() => toggle(id)} className="text-[#7B8FA5] hover:text-[#364658]"><X size={12} /></button>
                  </span>
                ))}
              </div>
            )}
            <div className="max-h-[300px] overflow-y-auto py-1">
              <button
                onClick={() => onChange([])}
                className={`flex w-full items-center justify-between px-3 py-2 text-left text-[13px] transition-colors ${!on ? 'bg-[#F1F5F9]' : 'hover:bg-[#F9FAFB]'}`}
              >
                <span className="text-[#364658]">All industries</span>
                {!on && <Check size={15} className="flex-shrink-0 text-[#3D8BD0]" />}
              </button>
              {PORTAL_INDUSTRIES.map((i) => {
                const lit = value.includes(i.id);
                return (
                  <button
                    key={i.id}
                    onClick={() => toggle(i.id)}
                    className={`flex w-full items-center justify-between px-3 py-2 text-left text-[13px] transition-colors ${lit ? 'bg-[#F1F5F9]' : 'hover:bg-[#F9FAFB]'}`}
                  >
                    <span className="text-[#364658]">{i.name}</span>
                    {lit && <Check size={15} className="flex-shrink-0 text-[#3D8BD0]" />}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center justify-between border-t border-[#F0F2F5] px-3 py-2">
              <button onClick={() => onChange([])} className="text-[13px] font-medium text-[#3D8BD0] hover:underline">Clear all</button>
              <button onClick={() => setOpen(false)} className="rounded bg-[#3D8BD0] px-3 py-1.5 text-[13px] font-medium text-white hover:bg-[#2d6ca0]">Done</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* One template card: the drawn thumbnail, name and category — and on hover (or keyboard focus) a
   dimmed scrim over the thumbnail carrying the two things you can do with it. ⚠️ No click-anywhere
   action on the card: "look first" and "use it" are different intentions, and a whole-card click
   would have to pick one of them for you. */
function TemplateCard({ art, name, meta, badge, industries = [], onPreview, onUse }: {
  art: ReactNode; name: string; meta: string; badge?: string; industries?: string[];
  onPreview: () => void; onUse: () => void;
}) {
  /* Hover is QUIET: the border darkens one step and a light scrim carries the two actions — no lift, no shadow, no zoom. */
  return (
    <div className="group/tpl flex flex-col overflow-hidden rounded-xl border border-[#E5E7EB] bg-white transition-colors duration-150 hover:border-[#CBD5E1] focus-within:border-[#CBD5E1]">
      <div className="relative h-[220px] w-full flex-shrink-0 overflow-hidden bg-[linear-gradient(180deg,#F7F9FC_0%,#EEF2F7_100%)] p-4">
        <div className="size-full">{art}</div>
        {badge && (
          <span className="absolute left-3 top-3 rounded-md bg-white/95 px-2 py-0.5 text-[10.5px] font-semibold tracking-wide text-[#3D8BD0] shadow-[0_1px_2px_rgba(16,24,40,0.08)]">{badge}</span>
        )}
        {/* ⚠️ NO category on the tile. It said "IT Support" on every template in the gallery — a
            label that never varies is not information, it is a word you learn to stop reading — and
            with the filter above the grid now asking about INDUSTRY, a category stamped on the
            picture answers a question nobody is being asked. The value is still on the record. */}
        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-[#0F172A]/[0.12] opacity-0 transition-opacity duration-150 group-hover/tpl:opacity-100 group-focus-within/tpl:opacity-100">
          <button
            onClick={onPreview}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#DFE5ED] bg-white px-3.5 text-[13px] font-medium text-[#1E293B] transition-colors hover:bg-[#F5F7FA]"
          ><Eye size={15} /> Preview</button>
          <button
            onClick={onUse}
            className="inline-flex h-9 items-center rounded-lg bg-[#3D8BD0] px-3.5 text-[13px] font-medium text-white transition-colors hover:bg-[#2F77B8]"
          >Use template</button>
        </div>
      </div>
      <div className="flex items-center gap-2 border-t border-[#F0F2F5] px-4 py-3">
        <span className="min-w-0 flex-1 truncate text-[14px] font-semibold text-[#1E293B]">{name}</span>
        <IndustryTags ids={industries} />
      </div>
    </div>
  );
}

export function CreateSupportPortalModal({ onClose, onSaveDetails, onScratch, onTemplate, onPreview, initialStep = 1, hidden, industry: industryProp, onIndustry }: {
  onClose: () => void;
  /** Step 2 → look at this template full-page before choosing it. `null` = the Default portal. */
  onPreview?: (t: PortalTemplate | null) => void;
  /** Reopen on step 2 — coming BACK from a template preview, the portal already exists. */
  initialStep?: 1 | 2;
  /** Kept mounted but out of sight while a preview covers the screen. */
  hidden?: boolean;
  /** The chosen industries, owned by the caller so Back from a preview lands on the same filter. */
  industry?: string[];
  onIndustry?: (next: string[]) => void;
  /** Step 1 → creates the portal as a Draft and unlocks step 2. */
  onSaveDetails: (d: PortalDetails) => void;
  /** Step 2 → a blank canvas. */
  onScratch: () => void;
  /** Step 2 → this template. `null` means the Default, which IS the standard portal page. */
  onTemplate: (t: PortalTemplate | null) => void;
}) {
  const [step, setStep] = useState<1 | 2>(initialStep);
  const [saved, setSaved] = useState(initialStep === 2);
  const [d, setD] = useState<PortalDetails>({
    name: '', company: '', url: '', idp: IDPS[0], ssoOnly: false,
  });
  const [industryLocal, setIndustryLocal] = useState<string[]>([]);
  const industry = industryProp ?? industryLocal;
  const setIndustry = (next: string[]) => (onIndustry ? onIndustry(next) : setIndustryLocal(next));

  /* ⚠️ Save is DISABLED until the three required fields are filled, rather than validating after
     the click. A button that can only tell you what is wrong once you press it makes you press it
     to find out. */
  const ready = detailsReady(d);

  const save = () => {
    if (!ready) return;
    onSaveDetails(d);
    setSaved(true);
    setStep(2);
  };

  /* ⚠️ OR, not AND: a template shown for "Healthcare" and "Education" matches either. Requiring
     both would ask for a layout built for two verticals at once, which is not a thing anyone is
     shopping for — and with six industries and five templates it would nearly always return
     nothing. Empty selection means every template, the same rule the Record List's statuses follow. */
  const templates = VISIBLE_TEMPLATES().filter((t) => industry.length === 0 || industriesOf(t).some((i) => industry.includes(i)));

  return createPortal(
    <div hidden={hidden} className="fixed inset-0 z-[10000] flex items-center justify-center bg-[#0F172A]/40 p-6">
      {/* ⚠️ ONE size for both steps: 1240×980 (height reduced 60px), shrinking to fit a smaller screen,
          so the dialog never changes size between step 1 and step 2. */}
      <div className={`flex h-[min(980px,calc(100vh-108px))] w-[min(1240px,calc(100vw-48px))] flex-col overflow-hidden rounded-xl bg-white shadow-[0_24px_48px_-12px_rgba(16,24,40,0.25)]`}>
        <div className="flex flex-shrink-0 items-center gap-3 border-b border-[#E5E7EB] px-5 py-3.5">
          <h2 className="flex-1 text-[16px] font-semibold text-[#364658]">Create Support Portal</h2>
          <button onClick={onClose} className="flex size-8 items-center justify-center rounded text-[#64748B] transition-colors hover:bg-[#F3F4F6]"><X size={18} /></button>
        </div>

        <Steps step={step} canGoBack={saved} onBack={() => setStep(1)} />

        {step === 1 ? (
          <>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
              <PortalDetailsFields value={d} onChange={setD} />
            </div>

            <div className="flex flex-shrink-0 justify-end gap-2 border-t border-[#E5E7EB] px-5 py-3">
              <button onClick={onClose} className="inline-flex h-9 items-center rounded border border-[#DFE5ED] bg-white px-4 text-[13px] font-medium text-[#364658] transition-colors hover:bg-[#F5F7FA]">Cancel</button>
              {/* ⚠️ The label CHANGES once the portal exists. The first Save creates a Draft; every
                  later one edits that same record — so a button still reading "Save" would be doing
                  something different from what it says, and the old behaviour (a second Save made a
                  SECOND portal) was exactly that difference going unannounced. */}
              <button
                onClick={save}
                disabled={!ready}
                title={ready ? undefined : 'Name, Company and URL are required'}
                className={`inline-flex h-9 items-center rounded px-4 text-[13px] font-medium text-white transition-colors ${
                  ready ? 'bg-[#3D8BD0] hover:bg-[#2d6ca0]' : 'cursor-not-allowed bg-[#B6C2D5]'
                }`}
              >{saved ? 'Save changes' : 'Save'}</button>
            </div>
          </>
        ) : (
          <>
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
              {/* ⚠️ ONE screen, not a fork. Step 2 used to open on two big cards — "Create from
                  scratch" and "Use Template" — which asked you to choose a KIND of start before you
                  could see any of the starts. From-scratch is one card and the templates are a
                  grid: they fit together, so the question was costing a click to answer something
                  the screen could simply show.
                  ⚠️ From-scratch is an IMMEDIATE action, exactly like a template tile. Every
                  starting point here is one click, so there is no selected state to carry and no
                  Create button to press afterwards.
                  ⚠️ Both halves carry a SECTION HEADING now. Without them the wide card at the top
                  read as a banner about the grid under it rather than as a choice beside it —
                  naming the two makes them two answers to one question. */}
              <h3 className="text-[15px] font-semibold text-[#364658]">Create your own portal</h3>
              <button
                onClick={onScratch}
                className="mt-3 flex w-full items-center gap-3.5 rounded-lg border border-[#E5E7EB] bg-white p-4 text-left transition-all hover:border-[#3D8BD0] hover:shadow-[0_4px_12px_rgba(16,24,40,0.06)]"
              >
                <span className="flex size-11 flex-shrink-0 items-center justify-center rounded-lg bg-[#EBF5FF] text-[#3D8BD0]"><PenLine size={20} /></span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[14px] font-semibold text-[#364658]">Start from scratch</span>
                  <span className="mt-0.5 block text-[12.5px] leading-[1.5] text-[#7B8FA5]">Begin with a blank page and choose your own blocks</span>
                </span>
                <ChevronRight size={18} className="flex-shrink-0 text-[#C3CBD6]" />
              </button>

              <div className="mt-6 flex items-center gap-3">
                <h3 className="text-[15px] font-semibold text-[#364658]">Start from a template</h3>
                <span className="ml-auto flex-shrink-0"><IndustryFilter value={industry} onChange={setIndustry} /></span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4 min-[1000px]:grid-cols-3">
                {/* ⚠️ The DEFAULT is the grid's FIRST TILE, in every category. It used to sit in a
                    band of its own above the templates, on the reasoning that a tile eighth in a row
                    of eight cannot say "this is the one your requesters see today". The badge says
                    it instead — and pinning it first means the one starting point that always
                    applies is always in the same place.
                    ⚠️ It ignores the category chips, because it HAS no category: it is not an IT or
                    an HR layout, it is the portal that already exists.
                    ⚠️ The art needs a BOX of its own — without one it was `height: 100%` of the tile,
                    took the whole button, and pushed the caption out through `overflow-hidden`. */}
                <TemplateCard
                  art={<PortalThumb />}
                  badge="DEFAULT"
                  name="Support Portal"
                  meta="Default"
                  onPreview={() => (onPreview ? onPreview(null) : onTemplate(null))}
                  onUse={() => onTemplate(null)}
                />
                {templates.map((t) => (
                  <TemplateCard
                    key={t.id}
                    art={<TemplateArt layout={t.layout} accent={t.accent} />}
                    name={t.name}
                    meta={t.category}
                    industries={industriesOf(t)}
                    onPreview={() => (onPreview ? onPreview(t) : onTemplate(t))}
                    onUse={() => onTemplate(t)}
                  />
                ))}
              </div>
            </div>

            {/* ⚠️ BACK is a footer of its own, on the left. Step 2 has no primary action to sit
                opposite it — every tile on the screen IS the action — so a right-aligned pair would
                leave a button with nothing to be beside. The breadcrumb above can also go back; this
                is the one that is where a dialog's controls are looked for. */}
            <div className="flex flex-shrink-0 items-center border-t border-[#E5E7EB] px-6 py-3">
              <button
                onClick={() => setStep(1)}
                className="inline-flex h-9 items-center gap-1.5 rounded border border-[#DFE5ED] bg-white px-3.5 text-[13px] font-medium text-[#364658] transition-colors hover:bg-[#F5F7FA]"
              ><ArrowLeft size={15} /> Back</button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
