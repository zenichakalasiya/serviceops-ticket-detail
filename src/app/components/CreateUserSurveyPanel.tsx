import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import { Plus, Search, Upload, X } from 'lucide-react';
import { ErrorText, FieldLabel, RuleSelect, TagEditor, inputCls } from './FormRuleControls';
import type { SelectOption } from './FormRuleControls';
import { AUDIENCE_LIMIT, ImportEmailsPanel } from './ImportEmailsPanel';

/* Create User Survey — the side panel behind the listing's primary CTA.
 *
 * The old product's form, on this product's own fields (FormRuleControls: 32px inputs, RuleSelect,
 * TagEditor). The one new control is the Emails field: the field itself is a read-out — chips for
 * the newest few and a "+N" for the rest — and clicking it opens a popup where emails are added,
 * searched and removed. A popup, because an audience runs to hundreds and a field cannot hold that. */

export interface NewSurvey {
  name: string;
  start: string;
  validityDays: number;
  owner?: string;
  catalog?: string;
}

const opts = (xs: string[]): SelectOption[] => xs.map((x) => ({ value: x, label: x }));
const CATALOGS = opts(['HR Services', 'IT Support', 'Hardware Requests', 'Software Requests', 'Network Access', 'Facilities', 'Travel Order', 'Customer Support']);
const DEPARTMENTS = opts(['Engineering', 'Finance', 'Human Resources', 'IT Operations', 'Marketing', 'Sales', 'Customer Success']);
const LOCATIONS = opts(['Ahmedabad HQ', 'Bengaluru', 'Mumbai', 'Dubai', 'London', 'Singapore', 'Austin']);
const AVATARS = ['#3D8BD0', '#8B5CF6', '#0EA5A4', '#F58518', '#DB2777', '#16A34A'];
const OWNERS: SelectOption[] = ['Kavit Gohel', 'Dharti Patel', 'Neha Shah', 'Vaibhav Prajapati', 'Darshan Mehta', 'Vasu Hirpara', 'Joshua A. Bejarano'].map((n, i) => ({
  value: n, label: n, avatar: { initials: n.split(' ').slice(0, 2).map((w) => w[0]).join(''), color: AVATARS[i % AVATARS.length] },
}));
/** Requester groups carry their size, so the audience total can count them. */
const GROUPS: { name: string; size: number }[] = [
  { name: 'All Requesters', size: 240 },
  { name: 'New Joiners — Q4', size: 38 },
  { name: 'Remote Employees', size: 86 },
  { name: 'Finance Team', size: 24 },
  { name: 'Sales — APAC', size: 52 },
];
const GROUP_OPTIONS: SelectOption[] = GROUPS.map((g) => ({ value: g.name, label: g.name, hint: `${g.size} requesters` }));

const EMAIL_RE = /^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/;
const btnPrimary = 'inline-flex h-8 items-center gap-1.5 rounded bg-[#3D8BD0] px-3.5 text-[13px] font-medium text-white transition-colors hover:bg-[#3478B5] disabled:cursor-not-allowed disabled:bg-[#CBD5E1]';
const btnSecondary = 'inline-flex h-8 items-center gap-1.5 rounded border border-[#d1d5db] bg-white px-3.5 text-[13px] font-medium text-[#364658] transition-colors hover:bg-[#F9FAFB]';
const iconBtn = 'flex size-8 items-center justify-center rounded text-[#64748B] transition-colors hover:bg-[#F3F4F6] hover:text-[#364658]';

/* ── Emails field ─────────────────────────────────────────────────────────────────────────────── */

const POP_H = 344;

function EmailsPopup({ anchor, emails, onChange, onClose }: {
  anchor: HTMLElement;
  emails: string[];
  onChange: (next: string[]) => void;
  onClose: () => void;
}) {
  /** One row, two controls, and only one of them is ever wide: adding, or searching. */
  const [mode, setMode] = useState<'add' | 'search'>('add');
  const [draft, setDraft] = useState('');
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [pos, setPos] = useState<{ left: number; width: number; top?: number; bottom?: number } | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const addInput = useRef<HTMLInputElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);

  useLayoutEffect(() => {
    const place = () => {
      const r = anchor.getBoundingClientRect();
      const below = window.innerHeight - r.bottom;
      // The field sits at the foot of the form, so the popup usually has to open upward.
      // Upward it is pinned by its BOTTOM edge: its height follows the list, and a popup placed for
      // its tallest size floats away from the field while the list is short.
      setPos(below >= POP_H + 12 || below >= r.top
        ? { left: r.left, width: r.width, top: r.bottom + 4 }
        : { left: r.left, width: r.width, bottom: window.innerHeight - r.top + 4 });
    };
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => { window.removeEventListener('resize', place); window.removeEventListener('scroll', place, true); };
  }, [anchor]);

  useEffect(() => {
    const down = (e: MouseEvent) => {
      const t = e.target as Node;
      if (root.current?.contains(t) || anchor.contains(t)) return;
      onClose();
    };
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); onClose(); } };
    document.addEventListener('mousedown', down);
    window.addEventListener('keydown', key, true);
    return () => { document.removeEventListener('mousedown', down); window.removeEventListener('keydown', key, true); };
  }, [anchor, onClose]);

  useEffect(() => { (mode === 'add' ? addInput : searchInput).current?.focus(); }, [mode]);

  const full = emails.length >= AUDIENCE_LIMIT;
  const typed = draft.trim();

  /** Several addresses can be pasted at once; each new one goes to the TOP of the list. */
  const add = () => {
    const parts = typed.split(/[\s,;]+/).filter(Boolean);
    if (!parts.length) return;
    const bad = parts.find((p) => !EMAIL_RE.test(p));
    if (bad) { setError(`“${bad}” isn’t a valid email address.`); return; }
    const have = new Set(emails.map((e) => e.toLowerCase()));
    const fresh: string[] = [];
    for (const p of parts) { if (!have.has(p.toLowerCase())) { have.add(p.toLowerCase()); fresh.push(p); } }
    if (!fresh.length) { setError(parts.length > 1 ? 'All of these emails are already added.' : 'This email is already added.'); return; }
    const room = AUDIENCE_LIMIT - emails.length;
    if (fresh.length > room) { setError(`Only ${room} more can be added — the audience holds ${AUDIENCE_LIMIT} emails.`); return; }
    onChange([...fresh.reverse(), ...emails]);
    setDraft('');
    setError('');
    addInput.current?.focus();
  };

  const q = query.trim().toLowerCase();
  const shown = mode === 'search' && q ? emails.filter((e) => e.toLowerCase().includes(q)) : emails;

  /* Collapsing is animated (the email field folds away as the search opens); coming back is not —
     you pressed + to type an address, so the field is simply there. */
  const ease = mode === 'search' ? 'transition-[flex-grow,flex-basis] duration-300 ease-out' : '';
  const wide = 'min-w-0 flex-[1_1_0%]';
  const narrow = 'flex-[0_0_32px]';

  if (!pos) return null;
  return createPortal(
    <div
      ref={root}
      data-emails-popup
      style={{ left: pos.left, top: pos.top, bottom: pos.bottom, width: pos.width }}
      className="fixed z-[10050] flex flex-col rounded-lg border border-[#DFE5ED] bg-white shadow-lg"
    >
      <div className={emails.length ? 'p-3 pb-2' : 'p-3'}>
        <div className="flex items-center gap-2">
          {/* Add — the email field, or (while searching) the + that brings it back */}
          <div className={`${mode === 'add' ? wide : narrow} ${ease}`}>
            {mode === 'add' ? (
              <input
                ref={addInput}
                value={draft}
                disabled={full}
                onChange={(e) => { setDraft(e.target.value); setError(''); }}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
                placeholder={full ? `Audience is full (${AUDIENCE_LIMIT} emails)` : 'Add email'}
                className={`${inputCls} ${error ? '!border-[#F25C4E] focus:!ring-[#F25C4E]' : ''}`}
              />
            ) : (
              <button
                type="button"
                /* A full audience has nowhere to put another address, so the way back to the
                   email field is off until one is removed. */
                disabled={full}
                title={full ? `Audience is full (${AUDIENCE_LIMIT} emails) — remove one to add another` : 'Add email'}
                onClick={() => { setMode('add'); setQuery(''); }}
                className="flex size-8 items-center justify-center rounded-md bg-[#3D8BD0] text-white transition-colors hover:bg-[#3478B5] disabled:cursor-not-allowed disabled:bg-[#CBD5E1] disabled:hover:bg-[#CBD5E1]"
              ><Plus size={16} /></button>
            )}
          </div>

          {/* Search — an icon beside the email field, or the whole row once opened */}
          <div className={`${mode === 'search' ? wide : narrow} ${ease}`}>
            {mode === 'search' ? (
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                <input
                  ref={searchInput}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search added emails"
                  className={`${inputCls} !pl-8 !pr-7`}
                />
                {query && (
                  <button type="button" onClick={() => { setQuery(''); searchInput.current?.focus(); }} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#364658]"><X size={14} /></button>
                )}
              </div>
            ) : (
              <button
                type="button"
                title="Search added emails"
                disabled={emails.length === 0}
                onClick={() => { setMode('search'); setError(''); }}
                className="flex size-8 items-center justify-center rounded-md border border-[#DFE5ED] text-[#64748B] transition-colors hover:bg-[#F3F4F6] hover:text-[#364658] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
              ><Search size={15} /></button>
            )}
          </div>
        </div>

        {/* No Add button: Enter adds. One quiet line says so, and gives way to the error when there is one. */}
        {mode === 'add' && (error
          ? <ErrorText>{error}</ErrorText>
          : !full && <p className="mt-1.5 text-[11px] leading-4 text-[#7B8FA5]">Press <span className="rounded border border-[#DFE5ED] bg-[#F8FAFC] px-1 text-[10px] font-medium text-[#64748B]">Enter</span> to add · separate several with commas</p>)}
      </div>

      {/* Nothing added yet = just the field. A count of zero and an empty list are white space. */}
      {emails.length > 0 && <>
      <div className="flex items-center justify-between px-3 pb-1 pt-2 text-[11px] text-[#7B8FA5]">
        <span className="text-[14px] font-bold text-[#364658]">Emails</span>
        {emails.length > 0 && !(mode === 'search' && q) && (
          <button type="button" onClick={() => onChange([])} className="text-[11px] font-medium text-[#64748B] hover:text-[#DC2626]">Clear all</button>
        )}
      </div>

      <div className="max-h-[176px] overflow-y-auto">
        {shown.length === 0 ? (
          <div className="px-3 py-6 text-center text-[12px] text-[#9CA3AF]">
            {emails.length === 0 ? 'No emails yet — type one above and press Add.' : `No added email matches “${query}”.`}
          </div>
        ) : shown.map((e) => (
          <div key={e} className="group flex h-8 items-center gap-2 px-3 transition-colors hover:bg-[#F9FAFB]">
            <span className="min-w-0 flex-1 truncate text-[12px] text-[#364658]" title={e}>{e}</span>
            <button
              type="button"
              title="Remove"
              onClick={() => onChange(emails.filter((x) => x !== e))}
              className="flex size-6 flex-shrink-0 items-center justify-center rounded text-[#9CA3AF] opacity-0 transition-colors hover:bg-[#FEF2F2] hover:text-[#DC2626] group-hover:opacity-100 focus:opacity-100"
            ><X size={13} /></button>
          </div>
        ))}
      </div>
      {/* The count sits OUTSIDE the scroll box, so it stays in view however long the list is. */}
      <div className="px-3 pb-2.5 pt-2 text-[11px] text-[#7B8FA5]">
        {mode === 'search' && q ? `${shown.length} of ${emails.length} emails match` : `${emails.length} of ${AUDIENCE_LIMIT} emails added`}
      </div>
      </>}
    </div>,
    document.body,
  );
}

/** The field: the newest few emails as chips, "+N" for the rest, "Add email" when there are none. */
function EmailsField({ emails, onChange, invalid }: { emails: string[]; onChange: (next: string[]) => void; invalid?: boolean }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const SHOW = 3;
  const rest = emails.length - SHOW;
  return (
    <>
      <div
        ref={box}
        role="button"
        tabIndex={0}
        onClick={() => setOpen(true)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(true); } }}
        style={{ cursor: 'text' }}
        className={`flex h-8 w-full items-center gap-1.5 overflow-hidden rounded-md border bg-white px-1.5 text-[12px] outline-none transition-colors ${
          open ? 'border-[#3D8BD0] ring-1 ring-[#3D8BD0]' : invalid ? 'border-[#F25C4E]' : 'border-[#DFE5ED] hover:border-[#CBD5E1] focus:border-[#3D8BD0]'
        }`}
      >
        {emails.length === 0 ? (
          <span className="px-1.5 text-[#364658]/60">Add email</span>
        ) : (
          <>
            {emails.slice(0, SHOW).map((e) => (
              <span key={e} className="inline-flex min-w-0 max-w-[190px] flex-shrink items-center gap-1 rounded bg-[#F1F5F9] py-0.5 pl-2 pr-1 text-[12px] text-[#364658]">
                <span className="truncate" title={e}>{e}</span>
                <button
                  type="button"
                  title="Remove"
                  onClick={(ev) => { ev.stopPropagation(); onChange(emails.filter((x) => x !== e)); }}
                  className="flex size-4 flex-shrink-0 items-center justify-center rounded-full text-[#7B8FA5] hover:bg-white hover:text-[#364658]"
                ><X size={11} /></button>
              </span>
            ))}
            {rest > 0 && <span className="flex-shrink-0 rounded bg-[#EBF5FF] px-1.5 py-0.5 text-[12px] font-medium text-[#3D8BD0]">+{rest}</span>}
          </>
        )}
      </div>
      {open && box.current && <EmailsPopup anchor={box.current} emails={emails} onChange={onChange} onClose={() => setOpen(false)} />}
    </>
  );
}

/* ── The panel ────────────────────────────────────────────────────────────────────────────────── */

export function CreateUserSurveyPanel({ onClose, onCreate }: { onClose: () => void; onCreate: (s: NewSurvey) => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [start, setStart] = useState('');
  const [validity, setValidity] = useState('');
  const [catalog, setCatalog] = useState<string[]>([]);
  const [owner, setOwner] = useState<string[]>([]);
  const [department, setDepartment] = useState<string[]>([]);
  const [location, setLocation] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [emails, setEmails] = useState<string[]>([]);
  const [groups, setGroups] = useState<string[]>([]);
  const [excludeTech, setExcludeTech] = useState(false);
  const [tried, setTried] = useState(false);
  const [importing, setImporting] = useState(false);

  /** Imported rows join the audience on top, skipping any address that is already in it. */
  const importEmails = (rows: string[]) => {
    const have = new Set(emails.map((e) => e.toLowerCase()));
    const fresh: string[] = [];
    for (const r of rows) { const k = r.toLowerCase(); if (!have.has(k)) { have.add(k); fresh.push(r); } }
    const room = Math.max(0, AUDIENCE_LIMIT - emails.length);
    const added = fresh.slice(0, room);
    setEmails([...added, ...emails]);
    const dupes = rows.length - fresh.length;
    toast.success(`${added.length} emails imported${dupes ? ` · ${dupes} already added, skipped` : ''}`);
  };

  const total = useMemo(
    () => emails.length + groups.reduce((n, g) => n + (GROUPS.find((x) => x.name === g)?.size ?? 0), 0),
    [emails, groups],
  );

  const errors = {
    name: name.trim() ? '' : 'Give the survey a name.',
    start: start ? '' : 'Pick when the survey starts.',
    validity: Number(validity) > 0 ? '' : 'Enter how many days the survey stays open.',
    audience: total > 0 ? '' : 'Add at least one email or requester group.',
  };
  const show = (k: keyof typeof errors) => (tried ? errors[k] : '');

  useEffect(() => {
    // While the import panel is up, Escape is its to answer.
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape' && !importing) onClose(); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose, importing]);

  const create = () => {
    setTried(true);
    if (Object.values(errors).some(Boolean)) {
      requestAnimationFrame(() => document.querySelector('[data-form-error]')?.scrollIntoView({ block: 'center', behavior: 'smooth' }));
      return;
    }
    onCreate({ name: name.trim(), start, validityDays: Number(validity), owner: owner[0], catalog: catalog[0] });
    toast.success(`“${name.trim()}” created`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[10000] flex justify-end bg-black/30" onClick={onClose}>
      <div className="flex h-full w-[720px] max-w-full flex-col bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[#E5E7EB] px-5 py-4">
          <h2 className="text-[16px] font-semibold text-[#364658]">Create User Survey</h2>
          <button type="button" onClick={onClose} className={iconBtn}><X size={16} /></button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5">
          <div>
            <FieldLabel required>Name</FieldLabel>
            <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className={`${inputCls} ${show('name') ? '!border-[#F25C4E]' : ''}`} />
            <ErrorText>{show('name')}</ErrorText>
          </div>

          <div>
            <FieldLabel>Description</FieldLabel>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description"
              rows={4}
              className={`${inputCls} !h-auto resize-y py-2 leading-[18px]`}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <FieldLabel required>Survey Start Date</FieldLabel>
              <input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} className={`${inputCls} ${start ? '' : '!text-[#364658]/60'} ${show('start') ? '!border-[#F25C4E]' : ''}`} />
              <ErrorText>{show('start')}</ErrorText>
            </div>
            <div>
              <FieldLabel required>Validity Days</FieldLabel>
              <input
                type="number"
                min={1}
                value={validity}
                onChange={(e) => setValidity(e.target.value)}
                placeholder="0"
                className={`${inputCls} [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none ${show('validity') ? '!border-[#F25C4E]' : ''}`}
              />
              <ErrorText>{show('validity')}</ErrorText>
            </div>
            <div>
              <FieldLabel>Service Catalog</FieldLabel>
              <RuleSelect value={catalog} options={CATALOGS} onChange={setCatalog} />
            </div>
            <div>
              <FieldLabel>Owner</FieldLabel>
              <RuleSelect value={owner} options={OWNERS} onChange={setOwner} placeholder="Select Technician" />
            </div>
            <div>
              <FieldLabel>Department</FieldLabel>
              <RuleSelect value={department} options={DEPARTMENTS} onChange={setDepartment} />
            </div>
            <div>
              <FieldLabel>Location</FieldLabel>
              <RuleSelect value={location} options={LOCATIONS} onChange={setLocation} />
            </div>
          </div>

          <div>
            <FieldLabel>Tags</FieldLabel>
            <TagEditor tags={tags} onChange={setTags} />
          </div>

          <div>
            <div className="mb-2 text-[13px] font-semibold text-[#364658]">
              Survey Audience <span className="font-normal text-[#7B8FA5]">(Total: {total})</span> <span className="text-[#F25C4E]">*</span>
            </div>
            <div className="space-y-4 rounded-lg bg-[#F9FAFB] p-4">
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-[12px] text-[#7B8FA5]">Emails</label>
                  <button
                    type="button"
                    disabled={emails.length >= AUDIENCE_LIMIT}
                    title={emails.length >= AUDIENCE_LIMIT ? `The audience already holds ${AUDIENCE_LIMIT} emails` : `Add up to ${AUDIENCE_LIMIT - emails.length} emails from a CSV file`}
                    onClick={() => setImporting(true)}
                    className="inline-flex h-6 items-center gap-1 rounded border border-[#d1d5db] bg-white px-2 text-[12px] font-medium text-[#364658] transition-colors hover:bg-[#F3F4F6] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white"
                  >
                    <Upload size={12} /> Import values
                  </button>
                </div>
                <EmailsField emails={emails} onChange={setEmails} invalid={!!show('audience')} />
              </div>
              <div className="flex items-end gap-4">
                <div className="min-w-0 flex-1">
                  <FieldLabel>Requester Group</FieldLabel>
                  <RuleSelect value={groups} options={GROUP_OPTIONS} onChange={setGroups} multi />
                </div>
                <label className="flex h-8 flex-shrink-0 cursor-pointer items-center gap-2 text-[12px] text-[#364658]">
                  <input type="checkbox" checked={excludeTech} onChange={(e) => setExcludeTech(e.target.checked)} className="size-3.5 accent-[#3D8BD0]" />
                  Exclude Technician
                </label>
              </div>
            </div>
            <ErrorText>{show('audience')}</ErrorText>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-[#E5E7EB] px-5 py-3">
          <button type="button" onClick={onClose} className={btnSecondary}>Cancel</button>
          <button type="button" onClick={create} className={btnPrimary}>Create</button>
        </div>
        {importing && <ImportEmailsPanel manualCount={emails.length} onClose={() => setImporting(false)} onImport={importEmails} />}
      </div>
    </div>
  );
}
