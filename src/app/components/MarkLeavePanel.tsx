/* ── Mark Leave ──────────────────────────────────────────────────────────────
   The side panel behind the My Team roster's calendar action: record someone's
   leave, and optionally hand their work to a colleague while they are away.

   Built from the project's own parts — the AddMembersPanel side-drawer chrome, the
   shared `DateField` picker, the app-menu dropdown, the audit-download toggle and the
   standard footer buttons — rather than a new set of form controls.

   The technician is shown, not picked: the panel is opened from one person's row, so a
   dropdown there could only ever hold the value it already has. */
import { useMemo, useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CalendarOff, Check, ChevronDown, Search, X } from 'lucide-react';
import { DateField } from './DateField';
import type { LeaveRecord, TeamMember } from './teamRoster';

/* The leave types a service desk actually books. Work From Home sits in the same list
   because it answers the same question for a supervisor — where is this person today —
   even though it is not strictly leave. */
export const LEAVE_TYPES = [
  'Planned Leave',
  'Sick Leave',
  'Casual Leave',
  'Work From Home',
  'Compensatory Off',
  'Maternity / Paternity Leave',
  'Unpaid Leave',
];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const parse = (v: string) => {
  if (!v) return null;
  const [y, m, d] = v.split('-').map(Number);
  return y && m && d ? new Date(y, m - 1, d) : null;
};
export const fmtLeaveDate = (v: string) => {
  const d = parse(v);
  return d ? `${String(d.getDate()).padStart(2, '0')} ${MONTHS[d.getMonth()]} ${d.getFullYear()}` : '';
};
/** Calendar days across the range, inclusive — what a leave balance is counted in. */
const daysBetween = (a: string, b: string) => {
  const s = parse(a);
  const e = parse(b);
  if (!s || !e) return 0;
  return Math.round((e.getTime() - s.getTime()) / 86400000) + 1;
};
/** The same range, minus weekends — the number a supervisor is really asking about. */
const workingDays = (a: string, b: string) => {
  const s = parse(a);
  const e = parse(b);
  if (!s || !e || e < s) return 0;
  let n = 0;
  for (const d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
    const wd = d.getDay();
    if (wd !== 0 && wd !== 6) n += 1;
  }
  return n;
};

/** One line of the saved leave, for the roster's chip tooltip. */
export const leaveSummary = (l: LeaveRecord) =>
  `${l.type} · ${fmtLeaveDate(l.start)} – ${fmtLeaveDate(l.end)}`;

/** What the Delegated Work trigger reads: everything, a short list, or a count. */
const workSummary = (picked: string[]) => {
  if (!picked.length) return '';
  if (picked.length === DELEGATED_WORK_TYPES.length) return 'All work';
  if (picked.length <= 2) return picked.join(', ');
  return `${picked.length} of ${DELEGATED_WORK_TYPES.length} selected`;
};

/* The record types a handover can cover. A supervisor rarely moves everything — "my
   requests and tasks, not my approvals" is the normal shape of it — so this is a
   multi-select rather than one bucket. */
export const DELEGATED_WORK_TYPES = ['Requests', 'Problems', 'Changes', 'Releases', 'Tasks', 'Approvals'];
/** The Technician Group field's "no filter" row — it narrows the assignee list, nothing more. */
const ANY_GROUP = 'All groups';

const LABEL = 'mb-1.5 block text-[12px] text-[#64748B]';
const REQ = <span className="text-[#E74C3C]"> *</span>;

/* One dropdown for every value list on the form. Search appears only once a list is long
   enough to need it, so the seven leave types stay a plain menu while the 30-person
   assignee list gets a filter. `multi` keeps the menu open and ticks several rows — what
   Delegated Work needs, since a handover is usually "my requests and tasks", not one
   record type. */
function PickerField({
  value,
  values,
  multi = false,
  placeholder,
  options,
  onPick,
  onToggle,
  searchable = false,
  searchPlaceholder = 'Search...',
  renderRow,
  invalid = false,
  summary,
}: {
  value?: string;
  values?: string[];
  multi?: boolean;
  placeholder: string;
  options: string[];
  onPick?: (v: string) => void;
  onToggle?: (v: string) => void;
  searchable?: boolean;
  searchPlaceholder?: string;
  renderRow?: (v: string) => React.ReactNode;
  invalid?: boolean;
  /** What the trigger reads in multi mode ("All work", "Requests, Tasks"). */
  summary?: string;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);
  const shown = q.trim() ? options.filter((o) => o.toLowerCase().includes(q.trim().toLowerCase())) : options;
  const picked = (o: string) => (multi ? !!values?.includes(o) : o === value);
  const shownValue = multi ? summary : value;
  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => { setOpen((o) => !o); setQ(''); }}
        className={`flex w-full items-center justify-between gap-2 rounded border bg-white px-3 py-2 text-left text-[13px] transition-colors hover:border-[#3D8BD0] focus:border-[#3D8BD0] focus:outline-none ${invalid ? 'border-[#E74C3C]' : 'border-[#DFE5ED]'}`}
      >
        <span className={`min-w-0 truncate ${shownValue ? 'text-[#364658]' : 'text-[#9CA3AF]'}`}>{shownValue || placeholder}</span>
        <ChevronDown size={14} className="flex-shrink-0 text-[#7B8FA5]" />
      </button>
      {open && (
        <div className="app-menu absolute left-0 top-full z-50 mt-1 w-full overflow-hidden rounded-lg border border-[#DFE5ED] bg-white py-1 shadow-lg">
          {searchable && (
            <div className="px-2 pb-1 pt-1">
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                <input
                  autoFocus
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full rounded border border-[#DFE5ED] py-1.5 pl-7 pr-2 text-[12px] text-[#364658] placeholder:text-[#9CA3AF] focus:border-[#3D8BD0] focus:outline-none"
                />
              </div>
            </div>
          )}
          <div className="max-h-[240px] overflow-y-auto">
            {shown.length === 0 && (
              <p className="px-3 py-3 text-center text-[12px] text-[#9CA3AF]">No match</p>
            )}
            {shown.map((o) => (
              <button
                key={o}
                type="button"
                /* Multi keeps the menu OPEN — ticking three record types should not cost
                   three trips back into the dropdown. */
                onClick={() => { if (multi) onToggle?.(o); else { onPick?.(o); setOpen(false); } }}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-[#F9FAFB] ${picked(o) ? 'bg-[#EBF5FF]' : ''}`}
              >
                {multi && (
                  <span className={`flex size-4 flex-shrink-0 items-center justify-center rounded border ${picked(o) ? 'border-[#3D8BD0] bg-[#3D8BD0]' : 'border-[#CBD5E1] bg-white'}`}>
                    <Check size={11} strokeWidth={3} className={`text-white ${picked(o) ? '' : 'invisible'}`} />
                  </span>
                )}
                <span className="min-w-0 flex-1">{renderRow ? renderRow(o) : <span className="truncate text-[13px] text-[#364658]">{o}</span>}</span>
                {!multi && <Check size={14} className={`flex-shrink-0 text-[#3D8BD0] ${picked(o) ? '' : 'invisible'}`} />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function MarkLeavePanel({
  member,
  colleagues,
  onClose,
  onSave,
  onClear,
}: {
  /** Whose leave this is. Already on leave ⇒ the panel opens on their saved record. */
  member: TeamMember;
  /** Who their work can be delegated to — the rest of the team, minus anyone away. */
  colleagues: TeamMember[];
  onClose: () => void;
  onSave: (leave: LeaveRecord) => void;
  /** Offered only when there is a leave to cancel. */
  onClear?: () => void;
}) {
  const existing = member.leave;
  const [type, setType] = useState(existing?.type ?? '');
  const [start, setStart] = useState(existing?.start ?? '');
  const [end, setEnd] = useState(existing?.end ?? '');
  const [remarks, setRemarks] = useState(existing?.remarks ?? '');
  /* Off by default — a leave is a leave; handing the queue over is a separate decision. */
  const [delegate, setDelegate] = useState(!!existing?.delegateTo);
  const [delegateTo, setDelegateTo] = useState(existing?.delegateTo ?? '');
  const [delGroup, setDelGroup] = useState(existing?.delegateGroup ?? '');
  const [delStart, setDelStart] = useState(existing?.delegateStart ?? '');
  const [delEnd, setDelEnd] = useState(existing?.delegateEnd ?? '');
  const [delWork, setDelWork] = useState<string[]>(existing?.delegatedWork ?? []);
  /* Errors appear only after a Save attempt — a form that is red before it has been
     filled in is scolding the reader for not having finished yet. */
  const [tried, setTried] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const byName = useMemo(() => new Map(colleagues.map((c) => [c.name, c])), [colleagues]);
  const groupOptions = useMemo(
    () => [ANY_GROUP, ...[...new Set(colleagues.map((c) => c.group))]],
    [colleagues],
  );
  /* The group narrows the assignee list rather than answering a second question — which is
     the only reason to offer it beside a 30-name picker. */
  const assigneeOptions = useMemo(
    () => colleagues.filter((c) => !delGroup || delGroup === ANY_GROUP || c.group === delGroup).map((c) => c.name),
    [colleagues, delGroup],
  );

  /* Switching the group out from under a chosen assignee would otherwise leave a name in
     the field that is no longer in its own list. */
  useEffect(() => {
    if (delegateTo && !assigneeOptions.includes(delegateTo)) setDelegateTo('');
  }, [assigneeOptions, delegateTo]);

  /* Turning delegation ON seeds its window from the leave — a handover almost always runs
     for exactly as long as the absence, and re-typing the same two dates is busywork. The
     fields stay editable for the cases where it does not. */
  const enableDelegation = () => {
    setDelegate((on) => {
      if (!on) {
        if (!delStart && start) setDelStart(start);
        if (!delEnd && end) setDelEnd(end);
      }
      return !on;
    });
  };

  const orderBad = !!start && !!end && daysBetween(start, end) <= 0;
  const delOrderBad = delegate && !!delStart && !!delEnd && daysBetween(delStart, delEnd) <= 0;
  const missing =
    !type || !start || !end || (delegate && (!delegateTo || !delStart || !delEnd || delWork.length === 0));
  const canSave = !missing && !orderBad && !delOrderBad;

  const submit = () => {
    setTried(true);
    if (!canSave) return;
    onSave({
      type,
      start,
      end,
      remarks: remarks.trim(),
      delegateTo: delegate ? delegateTo : '',
      ...(delegate
        ? {
            delegateGroup: delGroup === ANY_GROUP ? '' : delGroup,
            delegateStart: delStart,
            delegateEnd: delEnd,
            delegatedWork: delWork,
          }
        : {}),
    });
  };

  const span = start && end && !orderBad
    ? `${workingDays(start, end)} working day${workingDays(start, end) === 1 ? '' : 's'} · ${daysBetween(start, end)} calendar day${daysBetween(start, end) === 1 ? '' : 's'}`
    : null;

  return createPortal(
    <>
      <div className="fixed inset-0 z-[10000] bg-black/30" onClick={onClose} />
      <div className="fixed right-0 top-0 z-[10001] flex h-full w-[560px] max-w-[95vw] flex-col bg-white shadow-2xl">
        {/* Header */}
        <div className="flex flex-shrink-0 items-start justify-between border-b border-[#E5E7EB] px-6 py-4">
          <div>
            <h2 className="text-[18px] font-semibold text-[#111827]">{existing ? 'Edit Leave' : 'Mark Leave'}</h2>
            <p className="mt-0.5 text-[12px] text-[#7B8FA5]">
              Record time away so new work routes to the rest of the group.
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex size-8 flex-shrink-0 items-center justify-center rounded text-[#6B7280] transition-colors hover:bg-[#F3F4F6] hover:text-[#111827]"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <div className="space-y-5">
            {/* Who. Read-only by design — the row this was opened from IS the answer, so
                this states it rather than asking for it again. */}
            <div>
              <label className={LABEL}>Technician{REQ}</label>
              <div className="flex items-center gap-3 rounded border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-2.5">
                <span className="flex size-8 flex-shrink-0 items-center justify-center rounded bg-[#3D8BD0] text-[11px] font-semibold text-white">
                  {member.initials}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-medium text-[#364658]">{member.name}</span>
                  <span className="block truncate text-[12px] text-[#7B8FA5]">
                    {member.email} · {member.group}
                  </span>
                </span>
              </div>
            </div>

            <div>
              <label className={LABEL}>Leave Type{REQ}</label>
              <PickerField
                value={type}
                placeholder="Select"
                options={LEAVE_TYPES}
                onPick={setType}
                invalid={tried && !type}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={LABEL}>Start Date{REQ}</label>
                <DateField value={start} onChange={setStart} placeholder="Select" />
              </div>
              <div>
                <label className={LABEL}>End Date{REQ}</label>
                <DateField value={end} onChange={setEnd} placeholder="Select" />
              </div>
            </div>

            {/* What those two dates actually MEAN — the arithmetic a supervisor would
                otherwise do in their head before approving it — or what is still missing. */}
            {(span || orderBad || (tried && (!start || !end))) && (
              <p className={`-mt-2 text-[12px] ${orderBad || (tried && (!start || !end)) ? 'text-[#B42318]' : 'text-[#64748B]'}`}>
                {orderBad
                  ? 'End date must be on or after the start date.'
                  : tried && (!start || !end)
                    ? 'Select both a start and an end date.'
                    : span}
              </p>
            )}

            <div>
              <label className={LABEL}>Remarks</label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={4}
                placeholder="Anything the team should know while they are away"
                className="w-full resize-none rounded border border-[#DFE5ED] px-3 py-2 text-[13px] text-[#364658] placeholder:text-[#9CA3AF] transition-colors focus:border-[#3D8BD0] focus:outline-none"
              />
            </div>

            {/* Delegation. The toggle is the switch the audit download uses, and the
                picker only appears once it is on — an empty required field under an off
                switch is a trap. */}
            <div className="rounded border border-[#E5E7EB] p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-[#364658]">Enable Work Delegation</p>
                  <p className="mt-0.5 text-[12px] text-[#7B8FA5]">
                    Hand {member.name.split(' ')[0]}&apos;s open work to a colleague for the length of the leave.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={delegate}
                  onClick={enableDelegation}
                  className={`relative mt-0.5 inline-flex h-[22px] w-10 flex-shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${delegate ? 'bg-[#22C55E]' : 'bg-[#D1D5DB] hover:bg-[#C4C9D0]'}`}
                >
                  <span className={`inline-block size-[18px] rounded-full bg-white shadow-sm ring-1 ring-black/[0.04] transition-transform duration-200 ease-in-out ${delegate ? 'translate-x-[20px]' : 'translate-x-[2px]'}`} />
                </button>
              </div>

              {delegate && (
                <div className="mt-4 border-t border-[#F1F5F9] pt-4">
                  {/* The product's subsection heading — uppercase, small, quiet — so the
                      handover reads as a block inside the leave rather than a second form. */}
                  <p className="mb-3 text-[12px] font-semibold uppercase tracking-wide text-[#64748B]">Delegates To</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={LABEL}>Technician Group</label>
                      <PickerField
                        value={delGroup}
                        placeholder="All groups"
                        options={groupOptions}
                        onPick={(g) => setDelGroup(g === ANY_GROUP ? '' : g)}
                      />
                    </div>
                    <div>
                      <label className={LABEL}>Assignee{REQ}</label>
                      <PickerField
                        value={delegateTo}
                        placeholder="Select Technician"
                        options={assigneeOptions}
                        onPick={setDelegateTo}
                        searchable
                        searchPlaceholder="Search the team..."
                        invalid={tried && !delegateTo}
                        renderRow={(name) => {
                          const c = byName.get(name);
                          return (
                            <span className="flex min-w-0 items-center gap-2">
                              <span className="flex size-5 flex-shrink-0 items-center justify-center rounded bg-[#3D8BD0] text-[9px] font-medium text-white">
                                {c?.initials ?? ''}
                              </span>
                              <span className="truncate text-[13px] text-[#364658]">{name}</span>
                              <span className="truncate text-[12px] text-[#9CA3AF]">{c?.group ?? ''}</span>
                            </span>
                          );
                        }}
                      />
                    </div>
                    <div>
                      <label className={LABEL}>Delegation Start Date{REQ}</label>
                      <DateField value={delStart} onChange={setDelStart} placeholder="Select" />
                    </div>
                    <div>
                      <label className={LABEL}>Delegation End Date{REQ}</label>
                      <DateField value={delEnd} onChange={setDelEnd} placeholder="Select" />
                    </div>
                  </div>

                  {/* Seeded from the leave when the switch went on — say so, or the two
                      dates look like they filled themselves in. The note is skipped when
                      there was no leave period to copy, where it would be describing
                      something that did not happen. */}
                  {delOrderBad || (tried && (!delStart || !delEnd)) ? (
                    <p className="mt-2 text-[12px] text-[#B42318]">
                      {delOrderBad
                        ? 'Delegation end date must be on or after its start date.'
                        : 'Set the period the handover covers.'}
                    </p>
                  ) : start && end ? (
                    <p className="mt-2 text-[12px] text-[#94A3B8]">Defaults to the leave period — change it if the handover runs longer.</p>
                  ) : null}

                  <div className="mt-4">
                    <label className={LABEL}>Delegated Work{REQ}</label>
                    <PickerField
                      multi
                      values={delWork}
                      summary={workSummary(delWork)}
                      placeholder="Select"
                      options={DELEGATED_WORK_TYPES}
                      onToggle={(w) =>
                        setDelWork((prev) => (prev.includes(w) ? prev.filter((x) => x !== w) : [...prev, w]))
                      }
                      invalid={tried && delWork.length === 0}
                    />
                    {tried && delWork.length === 0 && (
                      <p className="mt-1.5 text-[12px] text-[#B42318]">Choose at least one kind of work to hand over.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-shrink-0 items-center justify-between border-t border-[#E5E7EB] px-6 py-4">
          {/* Cancelling the leave belongs with the leave, not in a row menu — but it is
              destructive, so it sits away from Save in the quiet red the grid uses. */}
          {existing && onClear ? (
            <button
              onClick={onClear}
              className="inline-flex h-9 items-center gap-1.5 rounded px-2.5 text-[13px] font-medium text-[#B42318] transition-colors hover:bg-[#FEE4E2]"
            >
              <CalendarOff size={15} />
              Clear leave
            </button>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="h-9 rounded border border-[#DFE5ED] bg-white px-4 text-[13px] font-medium text-[#364658] transition-colors hover:bg-[#F5F7FA]"
            >
              Cancel
            </button>
            {/* Deliberately never disabled: a greyed-out Save that will not say WHY is the
                most common dead end in a form. Clicking it with something missing points
                at the fields instead. */}
            <button
              onClick={submit}
              className="h-9 rounded bg-[#3D8BD0] px-5 text-[13px] font-medium text-white transition-colors hover:bg-[#2F7AB8]"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}
