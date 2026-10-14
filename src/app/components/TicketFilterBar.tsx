import { Fragment, useEffect, useRef, useState, type ReactElement } from 'react';
import {
  AlignLeft,
  CalendarDays,
  Check,
  CircleDot,
  Filter,
  Flag,
  Hash,
  Hourglass,
  ListChecks,
  MessageSquare,
  Monitor,
  MoreVertical,
  Plus,
  Search,
  LayoutList,
  ShieldCheck,
  Timer,
  Trash2,
  UserCheck,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import type { Ticket } from './TicketListPage';
import { consumableTypeIcon, extraValue, nonItTypeIcon, slaToneOf, softwareTypeIcon } from './TicketTable';
import { assetTypeIcon } from './upstream/AssetFields';
import { TECH_GROUPS } from './technicianRoster';
import { DEPARTMENTS } from './orgDepartments';
import { HARDWARE_FILTER_ATTRS, attrStandIn, attrStandInDate } from './assetFilterAttrs';
import { SOFTWARE_FILTER_ATTRS } from './softwareFilterAttrs';
import { NONIT_FILTER_ATTRS } from './nonItFilterAttrs';
import { CONSUMABLE_FILTER_ATTRS, qtyBandOf } from './consumableFilterAttrs';
import { LICENSE_FILTER_ATTRS } from './licenseFilterAttrs';
import { CONTRACT_FILTER_ATTRS } from './contractFilterAttrs';
import { PURCHASE_FILTER_ATTRS } from './purchaseFilterAttrs';
import { METER_FILTER_ATTRS } from './softwareMeterFilterAttrs';
import { CMDB_FILTER_ATTRS } from './cmdbFilterAttrs';
import { KNOWLEDGE_FILTER_ATTRS } from './knowledgeFilterAttrs';
import { REPORT_ORIGIN_OPTIONS } from './reportFilterAttrs';
import { TASK_FILTER_ATTRS } from './taskFilterAttrs';
import { TEAM_FILTER_ATTRS } from './teamFilterAttrs';
import { ciTypeIcon } from './CmdbCategoryRail';
import { IconStatusCheck } from './SidebarIcons';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

/* Attribute-based filter builder (Attio / DevRev pattern): pick an attribute → it becomes
   a chip reading "Attribute · condition · value", each segment independently editable.
   Beats fixed dropdowns because every column is filterable through one predictable shape. */

export interface FilterRule {
  id: string;
  field: string;
  condition: Condition;
  values: string[];
}

type Condition = 'is' | 'is not' | 'contains' | 'is before' | 'is after' | 'empty' | 'not empty';

export interface Attr {
  key: string;
  label: string;
  icon: typeof Hash;
  type: 'text' | 'select' | 'date';
  options?: { label: string; color?: string }[];
  /** Person-valued: options show an avatar in the listing's role colour. */
  people?: 'requester' | 'technician';
  /** Known to the bar but NOT offered in the attribute picker — the backing attribute for a
      quick filter, so applying one still produces a readable, removable chip. */
  hidden?: boolean;
}

const STATUS_OPTS = [
  { label: 'Open', color: '#3D8BD0' },
  { label: 'In Progress', color: '#3D8BD0' },
  { label: 'Pending', color: '#fb923c' },
  { label: 'Completed', color: '#22c55e' },
  { label: 'Closed', color: '#6b7280' },
  { label: 'Cancelled', color: '#ef4444' },
];
const PRIORITY_OPTS = [
  { label: 'Low', color: '#22c55e' },
  { label: 'Medium', color: '#fb923c' },
  { label: 'High', color: '#ef4444' },
  { label: 'Urgent', color: '#dc2626' },
];
const SLA_OPTS = [
  { label: 'Breached', color: '#ef4444' },
  { label: 'Due soon', color: '#f59e0b' },
  { label: 'On track', color: '#22c55e' },
  { label: 'Met', color: '#94a3b8' },
];
const REQUESTERS = ['Jainam Shah', 'Nandini Patel', 'Darshak Modi', 'Meera Iyer', 'Samuel Githugu', 'Kavit Gohel', 'Hetal Mori', 'Rohit Kulkarni', 'Ersin Sevinç'];
const ASSIGNEES = ['Amou Desai', 'Keetion Dale', 'Shreyak Dalal', 'Kaison Potai', 'Novak Potai', 'Rahul Shukla', 'Pratik Patial'];
export { TECH_GROUPS };
const IMPACTS = ['On Users', 'On Department', 'Low', 'On Business'];

const SOURCES = ['Email', 'Support Portal', 'Technician Portal', 'Walk-in'];
const LOCATIONS = ['Ahmedabad HQ', 'Mumbai Office', 'Bengaluru DC', 'Pune Office'];
const TAGS = ['network, vpn', 'hardware', 'onboarding, access', 'printer', 'wifi, urgent'];
const TIERS = ['Tier 1', 'Tier 2', 'Tier 3'];
const SIGNATURES = ['Not Required', 'Signed', 'Pending'];
const APPROVAL_STATES = ['Pending', 'Approved', '---'];
const opts = (list: string[]) => list.map((label) => ({ label }));
const AVATAR_BG = { requester: '#E67E22', technician: '#3D8BD0' } as const;
const initialsOf = (name: string) => {
  const p = name.split(' ').filter(Boolean);
  return ((p[0]?.[0] ?? '') + (p[1]?.[0] ?? '')).toUpperCase();
};

const DATE_OPTS = [{ label: 'Today' }, { label: 'Last 7 days' }, { label: 'Last 30 days' }, { label: 'Last 90 days' }, { label: 'Older than 90 days' }];

/** Every filterable column, in grid order — the picker is a mirror of the table. */
/* ── Backlog age ──────────────────────────────────────────────────────────────
   Bucketing lives HERE rather than on the dashboard because the aging chart and the
   `age` filter have to agree exactly: the bar that reads 25 must drill into 25 rows,
   or the chart is lying. The dashboard imports these instead of keeping its own copy.
   Declared ABOVE FILTER_ATTRS — that list reads AGE_BUCKETS while the module is still
   evaluating, so a later `const` would be in its temporal dead zone. */
const ageHash = (id: string, salt: number) => {
  let n = salt;
  for (const ch of id) n = (n * 31 + ch.charCodeAt(0)) % 997;
  return n;
};
/** Mock age in hours, stable per request id. */
export const ageHoursOf = (t: Ticket) => 2 + (ageHash(t.id, 21) % 220);
export const AGE_BUCKETS: { label: string; color: string; test: (h: number) => boolean }[] = [
  { label: '< 24 hours', color: '#22C55E', test: (h) => h < 24 },
  { label: '1 – 3 days', color: '#3D8BD0', test: (h) => h >= 24 && h < 72 },
  { label: '3 – 7 days', color: '#F59E0B', test: (h) => h >= 72 && h < 168 },
  { label: '> 7 days', color: '#EF4444', test: (h) => h >= 168 },
];
export const ageBucketOf = (t: Ticket) => {
  const h = ageHoursOf(t);
  return AGE_BUCKETS.find((b) => b.test(h))?.label ?? '';
};

/* My Approvals filters on what an APPROVAL actually has — six attributes, not the
   request catalog. `id` is the record's own id (the page's Name column) and the
   statuses are the approval outcomes, so a chip here can never offer a value the
   rows cannot hold. */
export const APPROVAL_FILTER_ATTRS: Attr[] = [
  { key: 'id', label: 'Name', icon: Hash, type: 'text' },
  { key: 'subject', label: 'Subject', icon: AlignLeft, type: 'text' },
  {
    key: 'x_type',
    label: 'Type',
    icon: CircleDot,
    type: 'select',
    options: opts(['Change', 'Release', 'Request', 'Service Request', 'Purchase Order', 'Contract', 'Hardware Asset', 'Software Asset']),
  },
  {
    key: 'requester',
    label: 'Requested By',
    icon: UserRound,
    type: 'select',
    people: 'requester',
    options: opts(['Imran Qureshi', 'Rakesh Rathod', 'Vikram Sethi', 'Kavit Gohel', 'Sarah Johnson', 'Rohan Mehta', 'Farah Sheikh', 'Jainam Shah', 'Neha Raje', 'Tabrez Khan', 'Darshak Modi', 'Priya Nair', 'Siddharth Rao', 'Hetal Mori', 'Meera Iyer', 'Ananya Iyer', 'Karan Malhotra']),
  },
  /* No Approval Status here — that is the page's tab (KPI cards + views rail),
     so offering it as a chip too would be two controls for one decision. */
  { key: 'status', label: 'Status', icon: CircleDot, type: 'select', options: STATUS_OPTS },
  { key: 'createdBy', label: 'Created Date', icon: CalendarDays, type: 'date', options: DATE_OPTS },
];

export const FILTER_ATTRS: Attr[] = [
  { key: 'id', label: 'ID', icon: Hash, type: 'text' },
  { key: 'subject', label: 'Subject', icon: AlignLeft, type: 'text' },
  { key: 'requester', label: 'Requester', icon: UserRound, type: 'select', people: 'requester', options: REQUESTERS.map((label) => ({ label })) },
  { key: 'assignedTo', label: 'Assigned to', icon: UserCheck, type: 'select', people: 'technician', options: [{ label: 'Unassigned' }, ...ASSIGNEES.map((label) => ({ label }))] },
  { key: 'sla', label: 'SLA Status', icon: Hourglass, type: 'select', options: SLA_OPTS },
  { key: 'status', label: 'Status', icon: CircleDot, type: 'select', options: STATUS_OPTS },
  { key: 'priority', label: 'Priority', icon: Flag, type: 'select', options: PRIORITY_OPTS },
  { key: 'createdBy', label: 'Created Date', icon: CalendarDays, type: 'date', options: DATE_OPTS },
  { key: 'approval', label: 'Approval', icon: UserCheck, type: 'select', options: [{ label: 'Pending approval', color: '#f59e0b' }, { label: 'No approval', color: '#94a3b8' }] },
  { key: 'unread', label: 'Unread updates', icon: MessageSquare, type: 'select', options: [{ label: 'Has unread', color: '#3D8BD0' }, { label: 'All read', color: '#94a3b8' }] },
  { key: 'openTasks', label: 'Tasks', icon: ListChecks, type: 'select', options: [{ label: 'Has open tasks', color: '#f59e0b' }, { label: 'All tasks done', color: '#22c55e' }] },
  { key: 'age', label: 'Age', icon: Timer, type: 'select', options: AGE_BUCKETS.map((b) => ({ label: b.label, color: b.color })) },
  /* The optional columns from Manage columns — same values the grid derives. */
  { key: 'createdByUser', label: 'Created By', icon: UserRound, type: 'select', people: 'technician', options: opts([...ASSIGNEES, ...REQUESTERS, 'System']) },
  { key: 'dueByDate', label: 'Due By', icon: CalendarDays, type: 'text' },
  { key: 'techGroup', label: 'Technician Group', icon: UserCheck, type: 'select', options: opts(TECH_GROUPS) },
  { key: 'urgency', label: 'Urgency', icon: Flag, type: 'select', options: PRIORITY_OPTS },
  { key: 'impact', label: 'Impact', icon: CircleDot, type: 'select', options: opts(IMPACTS) },
  { key: 'department', label: 'Department', icon: CircleDot, type: 'select', options: opts(DEPARTMENTS) },
  { key: 'source', label: 'Source', icon: CircleDot, type: 'select', options: opts(SOURCES) },
  { key: 'location', label: 'Location', icon: CircleDot, type: 'select', options: opts(LOCATIONS) },
  { key: 'tags', label: 'Tags', icon: AlignLeft, type: 'select', options: opts(TAGS) },
  { key: 'supportLevel', label: 'Support Level', icon: CircleDot, type: 'select', options: opts(TIERS) },
  { key: 'lastUpdatedDate', label: 'Last Updated Date', icon: CalendarDays, type: 'text' },
  { key: 'lastUpdatedBy', label: 'Last Updated By', icon: UserCheck, type: 'select', people: 'technician', options: opts(ASSIGNEES) },
  { key: 'firstResponseDueBy', label: 'First Response Due By', icon: CalendarDays, type: 'text' },
  { key: 'closedBy', label: 'Closed By', icon: UserCheck, type: 'select', people: 'technician', options: opts(ASSIGNEES) },
  { key: 'resolvedBy', label: 'Resolved By', icon: UserCheck, type: 'select', people: 'technician', options: opts(ASSIGNEES) },
  { key: 'requestAge', label: 'Request Age', icon: Hourglass, type: 'text' },
  { key: 'approvalStatus', label: 'Approval Status', icon: UserCheck, type: 'select', options: opts(APPROVAL_STATES) },
  { key: 'lastApprovedDate', label: 'Last Approved Date', icon: CalendarDays, type: 'text' },
  { key: 'digitalSignature', label: 'Digital Signature Status', icon: CircleDot, type: 'select', options: opts(SIGNATURES) },
  { key: 'lastSignedDate', label: 'Last Signed Date', icon: CalendarDays, type: 'text' },
  { key: 'resolutionTime', label: 'Resolution Time', icon: Hourglass, type: 'text' },
  { key: 'closedDuration', label: 'Closed Time Duration', icon: Hourglass, type: 'text' },
];

const CONDITIONS: Record<Attr['type'], Condition[]> = {
  text: ['is', 'is not', 'contains', 'empty', 'not empty'],
  select: ['is', 'is not', 'empty', 'not empty'],
  date: ['is', 'is before', 'is after', 'empty', 'not empty'],
};
const NEEDS_VALUE = (c: Condition) => c !== 'empty' && c !== 'not empty';

/* Every module catalogue is searchable here, not just the request set: applyFilters needs
   an attribute TYPE (a date filter reads a Date, not a string) and it runs on pages that
   hand the bar their own catalogue. The request set wins a shared key, so nothing moves.  */
const MODULE_ATTR_SETS: Attr[][] = [APPROVAL_FILTER_ATTRS, HARDWARE_FILTER_ATTRS, SOFTWARE_FILTER_ATTRS, NONIT_FILTER_ATTRS, CONSUMABLE_FILTER_ATTRS, LICENSE_FILTER_ATTRS, CONTRACT_FILTER_ATTRS, PURCHASE_FILTER_ATTRS, METER_FILTER_ATTRS, CMDB_FILTER_ATTRS, KNOWLEDGE_FILTER_ATTRS, TEAM_FILTER_ATTRS];
export const attrOf = (key: string): Attr | undefined =>
  FILTER_ATTRS.find((a) => a.key === key) ?? MODULE_ATTR_SETS.reduce<Attr | undefined>((hit, set) => hit ?? set.find((a) => a.key === key), undefined);

/* An attribute the mock rows do not carry — the agent-collected hardware properties —
   gets a STABLE stand-in derived from the row id, so picking one still cuts the list the
   same way every time instead of emptying it. Free-text attributes are left alone:
   inventing a serial number nobody could type would only look broken. */
const standInValue = (t: Ticket, attr?: Attr) => (attr ? attrStandIn(attr, t.id) : '');
const standInDate = (t: Ticket, key: string) => attrStandInDate(key, t.id);

/** The grid names a few columns differently from their underlying field. */
const COL_TO_ATTR: Record<string, string> = {
  assignee: 'assignedTo',
  dueStatus: 'sla',
  created: 'createdBy',
};

/* ── Evaluation ───────────────────────────────────────────────────────────── */

const DAY = 86400000;
const valueFor = (t: Ticket, field: string): string => {
  switch (field) {
    /* Remaining stock is a NUMBER on the row but a BAND in the filter — the column
       shows 12, the filter offers '11 - 50'. Bucket before comparing. */
    case 'x_availableQty':
      return qtyBandOf(Number((t as any).x_availableQty ?? 0));
    case 'assignedTo':
      return t.assignedTo.name;
    case 'sla': {
      const tone = slaToneOf(t);
      return tone === 'breached' ? 'Breached' : tone === 'due' ? 'Due soon' : tone === 'done' ? 'Met' : 'On track';
    }
    case 'approval':
      return t.approval ? 'Pending approval' : 'No approval';
    case 'unread':
      return (t.unread ?? 0) > 0 ? 'Has unread' : 'All read';
    case 'openTasks':
      return (t.tasksTotal ?? 0) - (t.tasksDone ?? 0) > 0 ? 'Has open tasks' : 'All tasks done';
    case 'age':
      return ageBucketOf(t);
    default:
      if (field in t) return String((t as any)[field] ?? '');
      return extraValue(field, t);
  }
};

/** Relative date buckets — "Last 7 days" style windows measured from now. */
const inDateBucket = (d: Date, bucket: string) => {
  const age = Date.now() - d.getTime();
  switch (bucket) {
    case 'Today':
      return age < DAY;
    case 'Last 7 days':
      return age < 7 * DAY;
    case 'Last 30 days':
      return age < 30 * DAY;
    case 'Last 90 days':
      return age < 90 * DAY;
    case 'Older than 90 days':
      return age >= 90 * DAY;
    default:
      return true;
  }
};

export function applyFilters(tickets: Ticket[], rules: FilterRule[]): Ticket[] {
  const live = rules.filter((r) => !NEEDS_VALUE(r.condition) || r.values.length > 0);
  if (!live.length) return tickets;
  return tickets.filter((t) =>
    live.every((r) => {
      const attr = attrOf(r.field);
      if (attr?.type === 'date') {
        const raw = (t as any)[r.field] as Date | undefined;
        const d = raw ?? (r.field in t ? undefined : standInDate(t, r.field));
        if (r.condition === 'empty') return !d;
        if (r.condition === 'not empty') return !!d;
        if (!d) return false;
        if (r.condition === 'is') return r.values.some((v) => inDateBucket(d, v));
        // Before/after use the bucket edge: "is before Last 7 days" = older than 7 days.
        const before = r.condition === 'is before';
        return r.values.some((v) => (before ? !inDateBucket(d, v) : inDateBucket(d, v)));
      }
      let val = valueFor(t, r.field);
      if (!val && !(r.field in t)) val = standInValue(t, attr);
      switch (r.condition) {
        case 'empty':
          return !val;
        case 'not empty':
          return !!val;
        case 'contains':
          return r.values.some((v) => val.toLowerCase().includes(v.toLowerCase()));
        case 'is not':
          return !r.values.some((v) => val.toLowerCase() === v.toLowerCase());
        default:
          return r.values.some((v) => val.toLowerCase() === v.toLowerCase());
      }
    }),
  );
}

/* ── UI ───────────────────────────────────────────────────────────────────── */

const POPUP = 'app-menu absolute z-[60] overflow-hidden rounded-lg border border-[#DFE5ED] bg-white shadow-xl';

function useOutside<T extends HTMLElement>(open: boolean, close: () => void) {
  const ref = useRef<T>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open, close]);
  return ref;
}

/** Attribute picker — the list of columns you can filter on. */
function AttrPicker({
  onPick,
  onClose,
  align = 'left',
  used = [],
  noun = 'request',
  attrs,
}: {
  onPick: (key: string) => void;
  onClose: () => void;
  align?: 'left' | 'right';
  /** Attribute keys already filtered — hidden so a column is never listed twice. */
  used?: string[];
  /** What one record is called — heads the list as "Change attributes" etc. */
  noun?: string;
  /** The module's attribute catalog (defaults to the product-wide set). */
  attrs?: Attr[];
}) {
  const [q, setQ] = useState('');
  const ref = useOutside<HTMLDivElement>(true, onClose);
  /* `hidden` attributes exist so a QUICK filter's chip can resolve its label and options —
     they are not things the reader builds a rule from, so the picker skips them. */
  const rows = (attrs ?? FILTER_ATTRS).filter((a) => !a.hidden && !used.includes(a.key) && a.label.toLowerCase().includes(q.trim().toLowerCase()));
  return (
    <div ref={ref} className={`${POPUP} top-full mt-1 w-[280px] ${align === 'left' ? 'left-0' : 'right-0'}`}>
      <div className="border-b border-[#F0F2F5] p-2">
        <div className="relative">
          <Search size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Escape' && onClose()}
            placeholder="Search attributes..."
            className="h-8 w-full rounded border border-[#E5E7EB] bg-[#F9FAFB] pl-7 pr-2 text-[13px] text-[#364658] placeholder:text-[#9CA3AF] focus:border-[#3D8BD0] focus:bg-white focus:outline-none"
          />
        </div>
      </div>
      <div className="max-h-[300px] overflow-y-auto py-1">
        <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#7B8FA5]">{`${noun.charAt(0).toUpperCase() + noun.slice(1)} attributes`}</div>
        {rows.length ? (
          rows.map((a) => (
            <button
              key={a.key}
              onClick={() => onPick(a.key)}
              className="flex w-full items-center px-3 py-2 text-left text-[13px] text-[#364658] transition-colors hover:bg-[#F9FAFB]"
            >
              {a.label}
            </button>
          ))
        ) : (
          <div className="px-3 py-2.5 text-[12px] text-[#94A3B8]">No matching attributes</div>
        )}
      </div>
    </div>
  );
}

/** One filter chip: attribute · condition · value · ⋮ */
function Chip({
  rule,
  onChange,
  onRemove,
  autoOpen,
  attrs,
}: {
  rule: FilterRule;
  onChange: (r: FilterRule) => void;
  onRemove: () => void;
  /** Added from a column header — open the value list so the next click picks a value. */
  autoOpen?: boolean;
  /** The module's attribute catalog — its labels/options win over the global set. */
  attrs?: Attr[];
}) {
  const [condOpen, setCondOpen] = useState(false);
  const [valOpen, setValOpen] = useState(!!autoOpen);
  /** Selection as of popup-open — drives the selected-first ordering for this open. */
  const openOrderRef = useRef<Set<string>>(new Set());
  const [menuOpen, setMenuOpen] = useState(false);
  const [q, setQ] = useState('');
  const condRef = useOutside<HTMLDivElement>(condOpen, () => setCondOpen(false));
  const valRef = useOutside<HTMLDivElement>(valOpen, () => setValOpen(false));
  const menuRef = useOutside<HTMLDivElement>(menuOpen, () => setMenuOpen(false));

  const attr = attrs?.find((a) => a.key === rule.field) ?? attrOf(rule.field);
  if (!attr) return null;
  const Icon = attr.icon;
  const needsValue = NEEDS_VALUE(rule.condition);
  const options = attr.options ?? [];
  const shown = [...options]
    .sort((a, b) => Number(openOrderRef.current.has(b.label)) - Number(openOrderRef.current.has(a.label)))
    .filter((o) => o.label.toLowerCase().includes(q.trim().toLowerCase()));

  const toggleValue = (v: string) =>
    onChange({ ...rule, values: rule.values.includes(v) ? rule.values.filter((x) => x !== v) : [...rule.values, v] });

  const seg = 'flex h-full items-center px-2 text-[12px] transition-colors hover:bg-[#F1F5F9]';

  return (
    <div className="relative flex h-8 items-stretch overflow-visible rounded border border-[#DFE5ED] bg-white">
      {/* Attribute — fixed; change it by removing the chip, which keeps the row honest. */}
      <span className="flex items-center border-r border-[#EEF1F4] px-2 text-[12px] font-medium text-[#364658]">
        {attr.label}
      </span>

      {/* Condition */}
      <div className="relative flex" ref={condRef}>
        <button onClick={() => setCondOpen((v) => !v)} className={`${seg} border-r border-[#EEF1F4] text-[#64748B]`}>
          {rule.condition}
        </button>
        {condOpen && (
          <div className={`${POPUP} left-0 top-full mt-1 w-[150px] py-1`}>
            {CONDITIONS[attr.type].map((c) => (
              <button
                key={c}
                onClick={() => {
                  onChange({ ...rule, condition: c, values: NEEDS_VALUE(c) ? rule.values : [] });
                  setCondOpen(false);
                }}
                className="flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-[13px] text-[#364658] transition-colors hover:bg-[#F9FAFB]"
              >
                {c}
                {rule.condition === c && <Check size={13} className="text-[#3D8BD0]" />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Value */}
      {needsValue && (
        <div className="relative flex" ref={valRef}>
          <button
            onClick={() => {
              if (!valOpen) openOrderRef.current = new Set(rule.values);
              setValOpen(!valOpen);
            }}
            className={`${seg} gap-1 border-r border-[#EEF1F4]`}
          >
            {rule.values.length === 0 ? (
              <span className="text-[#9CA3AF]">Select option...</span>
            ) : (
              <>
                <span className="rounded-sm bg-[#F1F5F9] px-1.5 py-0.5 text-[11px] font-medium text-[#364658]">{rule.values[0]}</span>
                {rule.values.length > 1 && <span className="text-[11px] text-[#64748B]">+{rule.values.length - 1}</span>}
              </>
            )}
          </button>
          {valOpen && (
            <div className={`${POPUP} left-0 top-full mt-1 w-[260px]`}>
              {attr.type === 'text' ? (
                <div className="p-2">
                  <input
                    autoFocus
                    value={rule.values[0] ?? ''}
                    onChange={(e) => onChange({ ...rule, values: e.target.value ? [e.target.value] : [] })}
                    onKeyDown={(e) => e.key === 'Enter' && setValOpen(false)}
                    placeholder={`Enter ${attr.label.toLowerCase()}...`}
                    className="h-8 w-full rounded border border-[#E5E7EB] bg-[#F9FAFB] px-2.5 text-[13px] text-[#364658] placeholder:text-[#9CA3AF] focus:border-[#3D8BD0] focus:bg-white focus:outline-none"
                  />
                </div>
              ) : (
                <>
                  <div className="border-b border-[#F0F2F5] p-2">
                    <input
                      autoFocus
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      placeholder="Search..."
                      className="h-8 w-full rounded border border-[#E5E7EB] bg-[#F9FAFB] px-2.5 text-[13px] text-[#364658] placeholder:text-[#9CA3AF] focus:border-[#3D8BD0] focus:bg-white focus:outline-none"
                    />
                  </div>
                  <div className="max-h-[260px] overflow-y-auto py-1">
                    <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#7B8FA5]">Options</div>
                    {shown.length ? (
                      shown.map((o) => {
                        const on = rule.values.includes(o.label);
                        return (
                          <button
                            key={o.label}
                            onClick={() => toggleValue(o.label)}
                            className="flex w-full items-center gap-2.5 px-3 py-1.5 text-left transition-colors hover:bg-[#F9FAFB]"
                          >
                            <input type="checkbox" readOnly checked={on} tabIndex={-1} className="pointer-events-none" />
                            {attr.people ? (
                              <span className="inline-flex min-w-0 items-center gap-2">
                                <span
                                  className="flex size-5 flex-shrink-0 items-center justify-center rounded text-[9px] font-semibold text-white"
                                  style={{ background: AVATAR_BG[attr.people] }}
                                >
                                  {initialsOf(o.label)}
                                </span>
                                <span className="truncate text-[13px] text-[#364658]">{o.label}</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-[13px] text-[#364658]">
                                {o.color && <span className="size-2 flex-shrink-0 rounded-full" style={{ background: o.color }} />}
                                {o.label}
                              </span>
                            )}
                          </button>
                        );
                      })
                    ) : (
                      <div className="px-3 py-2.5 text-[12px] text-[#94A3B8]">No matching options</div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Row menu */}
      <div className="relative flex" ref={menuRef}>
        <button onClick={() => setMenuOpen((v) => !v)} className={`${seg} px-1.5 text-[#9CA3AF]`}>
          <MoreVertical size={13} />
        </button>
        {menuOpen && (
          <div className={`${POPUP} right-0 top-full mt-1 w-[160px] py-1`}>
            <button
              onClick={() => onChange({ ...rule, values: [] })}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[13px] text-[#364658] transition-colors hover:bg-[#F9FAFB]"
            >
              <X size={13} className="text-[#7B8FA5]" />
              Clear value
            </button>
            <button
              onClick={onRemove}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[13px] text-[#EF4444] transition-colors hover:bg-[#FEF2F2]"
            >
              <Trash2 size={13} />
              Delete filter
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const YOU = 'Sarah Johnson'; // signed-in persona (kept local — TicketViewsPanel imports from this module)

/* A quick filter is one icon that drops a short value list — the two or three cuts a
   given queue is worked by, one click away from the grid. Every module names its own:
   a service desk reaches for assignee / SLA / priority, an asset register for where a
   machine is in its life and what kind of machine it is. */
export interface QuickFilterDef {
  field: string;
  /** Any lucide icon, or one of the product SVGs with the same call shape. */
  icon: (p: { size?: number; className?: string }) => ReactElement;
  /** Tooltip on the icon button. */
  tip: string;
  /** Header above the value list. */
  title: string;
  width: number;
  options: { label: string; color?: string }[];
  /** How each value row reads. */
  row?: 'dot' | 'flag' | 'avatar' | 'plain';
  /** Per-value glyph — a type filter shows the SAME icon the grid's cell shows for that
      value, so a keyboard looks like a keyboard in both places. Wins over `row`. */
  iconOf?: (label: string) => ReactElement;
  /** First option is the signed-in user: it reads "(You)" and keeps a divider under it. */
  youFirst?: boolean;
  /** Adds a leading row that CLEARS this filter ("All reports"), ticked while nothing is
      selected. For a filter whose values are two halves of one set, "unticking the one you
      picked" is not an obvious way back to everything — this is. */
  allLabel?: string;
}

const DEFAULT_QUICK: QuickFilterDef[] = [
  { field: 'assignedTo', icon: UserRound, tip: 'Filter by assignee', title: 'Assigned to', width: 232, row: 'avatar', youFirst: true, options: [YOU, ...ASSIGNEES].map((label) => ({ label })) },
  { field: 'sla', icon: Hourglass, tip: 'Filter by SLA status', title: 'SLA status', width: 196, row: 'dot', options: SLA_OPTS },
  { field: 'priority', icon: Flag, tip: 'Filter by priority', title: 'Priority is', width: 172, row: 'flag', options: [...PRIORITY_OPTS].reverse() },
];

/* The asset register's pair. Status is how an asset manager works the list — what is
   deployed, what is spare, what is in repair — and Asset Type is the next cut down.
   Both read their values from the module's own filter catalogue, so a quick filter and
   the full filter builder can never offer different options for the same field. */
const hwOptions = (key: string) => HARDWARE_FILTER_ATTRS.find((a) => a.key === key)?.options ?? [];
export const ASSET_QUICK_FILTERS: QuickFilterDef[] = [
  /* Icon-only, matching the request listing's trio. A check inside a CLOSED circle
     (`CircleCheck`, not the big open variant) at the same stroke weight as every other
     toolbar icon — it reads as a state, where the radio-button `CircleDot` it replaces
     looked like an unselected option. */
  { field: 'status', icon: IconStatusCheck, tip: 'Filter by status', title: 'Status is', width: 190, row: 'dot', options: hwOptions('status') },
  { field: 'assetType', icon: Monitor, tip: 'Filter by asset type', title: 'Asset type is', width: 214, iconOf: assetTypeIcon, options: hwOptions('assetType') },
];

/* The software register's pair, on the same "state, then kind" shape: Status is how the
   catalogue is worked, and Software Type — the product's classification tree — is the cut
   that matters next. It wears the SAME glyph as every other register's type filter: one
   icon for "what kind of thing is this", whatever the module calls the field. */
const swOptions = (key: string) => SOFTWARE_FILTER_ATTRS.find((a) => a.key === key)?.options ?? [];
export const SOFTWARE_QUICK_FILTERS: QuickFilterDef[] = [
  { field: 'status', icon: IconStatusCheck, tip: 'Filter by status', title: 'Status is', width: 180, row: 'dot', options: swOptions('status') },
  { field: 'x_softwareType', icon: Monitor, tip: 'Filter by software type', title: 'Software type is', width: 200, iconOf: softwareTypeIcon, options: swOptions('x_softwareType') },
];

/* The non-IT register's pair — same "state, then kind" shape as hardware: where a chair
   or an AC unit is in its life, then what kind of thing it is (same shared type glyph). */
const niOptions = (key: string) => NONIT_FILTER_ATTRS.find((a) => a.key === key)?.options ?? [];
export const NONIT_QUICK_FILTERS: QuickFilterDef[] = [
  { field: 'status', icon: IconStatusCheck, tip: 'Filter by status', title: 'Status is', width: 190, row: 'dot', options: niOptions('status') },
  { field: 'x_assetType', icon: Monitor, tip: 'Filter by asset type', title: 'Asset type is', width: 210, iconOf: nonItTypeIcon, options: niOptions('x_assetType') },
];

/* Licences get ONE quick filter too: a licence has no status or owner, so the only cut
   worth a click is what KIND of licence it is. Plain rows — the grid's License Type
   column carries no per-value glyph, so the menu should not invent one. */
const liOptions = (key: string) => LICENSE_FILTER_ATTRS.find((a) => a.key === key)?.options ?? [];
export const LICENSE_QUICK_FILTERS: QuickFilterDef[] = [
  { field: 'x_licenseType', icon: Monitor, tip: 'Filter by license type', title: 'License type is', width: 215, row: 'plain', options: liOptions('x_licenseType') },
];

/* Contracts get ONE quick filter: what KIND of agreement it is. Status is the next most
   obvious cut, but two of the three states are derivable from the dates the grid already
   shows — the kind of contract is what a contract manager actually works the list by.
   Plain rows, like licences: the Contract Type column carries no per-value glyph. */
const ctOptions = (key: string) => CONTRACT_FILTER_ATTRS.find((a) => a.key === key)?.options ?? [];
export const CONTRACT_QUICK_FILTERS: QuickFilterDef[] = [
  { field: 'x_contractType', icon: Monitor, tip: 'Filter by contract type', title: 'Contract type is', width: 215, row: 'plain', options: ctOptions('x_contractType') },
];

/* The CMDB's pair, on the same "state, then kind" shape as every asset register: whether
   the CI is running, and what kind of thing it is — on the SAME glyph the asset registers
   put on their type filter, with each class wearing its own icon. */
const cmOptions = (key: string) => CMDB_FILTER_ATTRS.find((a) => a.key === key)?.options ?? [];
export const CMDB_QUICK_FILTERS: QuickFilterDef[] = [
  { field: 'status', icon: IconStatusCheck, tip: 'Filter by status', title: 'Status is', width: 200, row: 'dot', options: cmOptions('status') },
  { field: 'x_ciType', icon: Monitor, tip: 'Filter by CI type', title: 'CI type is', width: 240, iconOf: ciTypeIcon, options: cmOptions('x_ciType') },
];

/* Knowledge's pair: is the article live, and is anyone waiting on it. The FOLDER is the
   rail's job, so it is deliberately not repeated here. */
const kbOptions = (key: string) => KNOWLEDGE_FILTER_ATTRS.find((a) => a.key === key)?.options ?? [];
export const KNOWLEDGE_QUICK_FILTERS: QuickFilterDef[] = [
  { field: 'status', icon: IconStatusCheck, tip: 'Filter by status', title: 'Status is', width: 190, row: 'dot', options: kbOptions('status') },
  { field: 'x_approvalStatus', icon: ShieldCheck, tip: 'Filter by approval status', title: 'Approval status is', width: 220, row: 'dot', options: kbOptions('x_approvalStatus') },
];

/* Reports get ONE quick filter, and it is the cut a reader actually makes: the ones that
   SHIPPED with the product versus the ones this organisation built. (The engine behind a
   report — tabular, matrix, query — is a build detail, and is still in the filter builder
   and the Type column.) The module it reports on is the rail's job. */
export const REPORT_QUICK_FILTERS: QuickFilterDef[] = [
  { field: 'x_origin', icon: LayoutList, tip: 'Filter by report origin', title: 'Report is', width: 210, row: 'dot', allLabel: 'All reports', options: REPORT_ORIGIN_OPTIONS },
];

/* A task queue is read for three things each morning, in this order: whose it is, where the
   work stands, how urgent it is. Assignee leads because a technician opens this page to find
   THEIR work — and reads "(You)" at the top of its list, as on the request listing. */
const tkOptions = (key: string) => TASK_FILTER_ATTRS.find((a) => a.key === key)?.options ?? [];
const TASK_PEOPLE = [{ label: YOU }, ...tkOptions('assignedTo').filter((o) => o.label !== YOU)];
export const TASK_QUICK_FILTERS: QuickFilterDef[] = [
  { field: 'assignedTo', icon: UserRound, tip: 'Filter by assignee', title: 'Assigned to', width: 232, row: 'avatar', youFirst: true, options: TASK_PEOPLE },
  { field: 'status', icon: IconStatusCheck, tip: 'Filter by status', title: 'Status is', width: 190, row: 'dot', options: tkOptions('status') },
  { field: 'priority', icon: Flag, tip: 'Filter by priority', title: 'Priority is', width: 172, row: 'flag', options: [...tkOptions('priority')].reverse() },
];

/* A team roster is worked in this order: which group, then who can actually pick work up
   right now, then how senior they are. Availability leads over Account Status because
   "on leave" and "switched off" are the same answer to the only question a supervisor is
   asking — can I give this to them today. */
const tmOptions = (key: string) => TEAM_FILTER_ATTRS.find((a) => a.key === key)?.options ?? [];
export const TEAM_QUICK_FILTERS: QuickFilterDef[] = [
  { field: 'x_group', icon: Users, tip: 'Filter by technician group', title: 'Group is', width: 220, row: 'plain', options: tmOptions('x_group') },
  { field: 'x_availability', icon: IconStatusCheck, tip: 'Filter by availability', title: 'Availability is', width: 200, row: 'dot', options: tmOptions('x_availability') },
  { field: 'x_role', icon: ShieldCheck, tip: 'Filter by role', title: 'Role is', width: 190, row: 'dot', options: tmOptions('x_role') },
];

/* Software Meter takes the software register's pair — where the application is in its
   life, then what kind of application it is, on the shared type glyph. */
const meOptions = (key: string) => METER_FILTER_ATTRS.find((a) => a.key === key)?.options ?? [];
export const METER_QUICK_FILTERS: QuickFilterDef[] = [
  { field: 'status', icon: IconStatusCheck, tip: 'Filter by status', title: 'Status is', width: 180, row: 'dot', options: meOptions('status') },
  { field: 'x_softwareType', icon: Monitor, tip: 'Filter by software type', title: 'Software type is', width: 200, iconOf: softwareTypeIcon, options: meOptions('x_softwareType') },
];

/* A purchase order has no SLA and no priority, so the request trio the bar defaults to
   was meaningless here. Its one real cut is where the order sits in the pipeline. */
const poOptions = (key: string) => PURCHASE_FILTER_ATTRS.find((a) => a.key === key)?.options ?? [];
export const PURCHASE_QUICK_FILTERS: QuickFilterDef[] = [
  { field: 'status', icon: IconStatusCheck, tip: 'Filter by status', title: 'Status is', width: 210, row: 'dot', options: poOptions('status') },
];

/* The consumable register gets ONE quick filter. There is no useful status cut — every
   row is stock in hand — so what is left is the kind of item, on the shared type glyph. */
const coOptions = (key: string) => CONSUMABLE_FILTER_ATTRS.find((a) => a.key === key)?.options ?? [];
export const CONSUMABLE_QUICK_FILTERS: QuickFilterDef[] = [
  { field: 'x_assetType', icon: Monitor, tip: 'Filter by asset type', title: 'Asset type is', width: 210, iconOf: consumableTypeIcon, options: coOptions('x_assetType') },
];

/* Past this many values a list stops being scannable, so its popup gets a search box. The
   short cuts (a handful of statuses, six asset types) stay as they are — a search field
   over four options is furniture. */
const QUICK_SEARCH_FROM = 10;

function QuickFilters({ rules, setRules, filters = DEFAULT_QUICK }: { rules: FilterRule[]; setRules: (r: FilterRule[]) => void; filters?: QuickFilterDef[] }) {
  const [open, setOpen] = useState<string | null>(null);
  /* One query, cleared whenever a different filter opens — a search left over from the
     last popup would silently hide half of this one. */
  const [q, setQ] = useState('');
  useEffect(() => { setQ(''); }, [open]);
  const wrapRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current?.contains(e.target as Node)) return;
      setOpen(null);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const valuesOf = (field: string) => rules.find((r) => r.field === field)?.values ?? [];
  const toggle = (field: string, value: string) => {
    setOpen(null); // one-click apply — the filter chip takes over from here
    const existing = rules.find((r) => r.field === field);
    if (!existing) {
      setRules([...rules, { id: `${field}-qf-${Date.now()}`, field, condition: 'is', values: [value] }]);
      return;
    }
    const values = existing.values.includes(value) ? existing.values.filter((v) => v !== value) : [...existing.values, value];
    if (!values.length) setRules(rules.filter((r) => r.id !== existing.id));
    else setRules(rules.map((r) => (r.id === existing.id ? { ...r, condition: 'is' as const, values } : r)));
  };

  const initials = (n: string) => n.split(' ').filter(Boolean).map((p) => p[0]).join('').slice(0, 2).toUpperCase();
  /* Icon-only, one shape across every module — the tooltip carries the name. */
  const iconBtn = (field: string, Icon: typeof Flag, label: string) => {
    const active = valuesOf(field).length > 0;
    if (active) return null;
    const tone = open === field
      ? 'border-[#3D8BD0] bg-[#EBF5FF] text-[#3D8BD0]'
      : 'border-[#DFE5ED] text-[#64748B] hover:bg-[#F5F7FA] hover:text-[#364658]';
    return (
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <button
            onClick={() => setOpen((v) => (v === field ? null : field))}
            className={`inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded border bg-white transition-colors ${tone}`}
          >
            <Icon size={15} />
          </button>
        </TooltipTrigger>
        <TooltipContent>{label}</TooltipContent>
      </Tooltip>
    );
  };

  return (
    <div ref={wrapRef} className="relative flex items-center gap-2">
      {filters.map((f) => (
        <Fragment key={f.field}>{iconBtn(f.field, f.icon, f.tip)}</Fragment>
      ))}

      {filters.map((f) =>
        open !== f.field ? null : (
          <div
            key={f.field}
            className="app-menu absolute left-0 top-full z-50 mt-1 rounded-lg border border-[#DFE5ED] bg-white py-1.5 shadow-xl"
            style={{ width: f.width }}
          >
            <div className="px-3 pb-1 pt-0.5 text-[11px] font-semibold uppercase tracking-wide text-[#7B8FA5]">{f.title}</div>
            {f.options.length > QUICK_SEARCH_FROM && (
              <div className="px-2.5 pb-1.5 pt-0.5">
                <div className="relative">
                  <Search size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                  <input
                    autoFocus
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    onKeyDown={(e) => e.key === 'Escape' && (q ? setQ('') : setOpen(null))}
                    placeholder="Search..."
                    className="h-8 w-full rounded border border-[#DFE5ED] bg-white pl-8 pr-2 text-[13px] text-[#364658] outline-none transition-colors placeholder:text-[#9CA3AF] focus:border-[#3D8BD0]"
                  />
                </div>
              </div>
            )}
            {/* The way back to everything, where the module asks for one. It is ticked
                while no value is set, so the popup always shows what you are looking at. */}
            {f.allLabel && !q.trim() && (() => {
              const none = valuesOf(f.field).length === 0;
              return (
                <>
                  <button
                    onClick={() => { setOpen(null); setRules(rules.filter((r) => r.field !== f.field)); }}
                    className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-[13px] transition-colors ${
                      none ? 'bg-[#EBF5FF] font-medium text-[#3D8BD0]' : 'text-[#364658] hover:bg-[#F9FAFB]'
                    }`}
                  >
                    <span className="min-w-0 flex-1 truncate">{f.allLabel}</span>
                    {none && <Check size={13} className="flex-shrink-0" />}
                  </button>
                  <div className="my-1 border-t border-[#F1F5F9]" />
                </>
              );
            })()}
            {/* A long catalogue (the CMDB's CI types) scrolls inside the popup instead of
                running off the bottom of the window; a short one is unaffected. */}
            <div className="max-h-[320px] overflow-y-auto">
            {(() => {
              const query = q.trim().toLowerCase();
              const shown = query ? f.options.filter((o) => o.label.toLowerCase().includes(query)) : f.options;
              if (!shown.length)
                return <div className="px-3 py-4 text-center text-[12px] text-[#94A3B8]">No match for “{q}”.</div>;
              return shown.map((o, i) => {
              const on = valuesOf(f.field).includes(o.label);
              return (
                <Fragment key={o.label}>
                  <button
                    onClick={() => toggle(f.field, o.label)}
                    className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-[13px] transition-colors ${
                      on ? 'bg-[#EBF5FF] font-medium text-[#3D8BD0]' : 'text-[#364658] hover:bg-[#F9FAFB]'
                    }`}
                  >
                    {f.iconOf ? (
                      <span className="flex-shrink-0 text-[#6B7280]">{f.iconOf(o.label)}</span>
                    ) : (
                      <>
                        {f.row === 'avatar' && (
                          <span className="flex size-5 flex-shrink-0 items-center justify-center rounded bg-[#3D8BD0] text-[9px] font-semibold text-white">{initials(o.label)}</span>
                        )}
                        {f.row === 'flag' && <Flag size={13} className="flex-shrink-0" fill="currentColor" style={{ color: o.color }} />}
                        {f.row !== 'avatar' && f.row !== 'flag' && f.row !== 'plain' && (
                          <span className="size-2 flex-shrink-0 rounded-full" style={{ backgroundColor: o.color }} />
                        )}
                      </>
                    )}
                    <span className="min-w-0 flex-1 truncate">{f.youFirst && i === 0 ? `${o.label} (You)` : o.label}</span>
                    {on && <Check size={13} className="flex-shrink-0" />}
                  </button>
                  {f.youFirst && i === 0 && <div className="my-1 border-t border-[#F1F5F9]" />}
                </Fragment>
              );
              });
            })()}
            </div>
          </div>
        ),
      )}

    </div>
  );
}

export function TicketFilterBar({
  rules,
  setRules,
  noun = 'request',
  showQuickFilters = true,
  showFilterBuilder = true,
  quickFilters,
  attrs,
}: {
  rules: FilterRule[];
  setRules: (r: FilterRule[]) => void;
  /** What one record is called — the Change listing renders this bar as "changes". */
  noun?: string;
  /** false drops the one-tap Assignee / SLA / Priority shortcuts — modules whose
      records carry none of those (Approvals) would offer dead filters. */
  showQuickFilters?: boolean;
  /** false drops the rule BUILDER — the "Filters" button and its attribute picker — for a
      module whose one useful cut is already a quick filter. The chips stay: a quick filter
      applies as a rule, so its chip is how you see what is on and switch it off. */
  showFilterBuilder?: boolean;
  /** The module's own quick filters (defaults to the service-desk trio). */
  quickFilters?: QuickFilterDef[];
  /** The module's attribute catalog — defaults to the product-wide request set. */
  attrs?: Attr[];
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [autoOpenId, setAutoOpenId] = useState<string | null>(null);

  /* A column header's Filter action adds that column here and opens its value list —
     the filter always lives in one place, no matter where it was created. */
  useEffect(() => {
    const onAdd = (e: Event) => {
      const colKey = String((e as CustomEvent).detail ?? '');
      const key = COL_TO_ATTR[colKey] ?? colKey;
      const attr = attrs?.find((a) => a.key === key) ?? attrOf(key);
      if (!attr) return;
      const existing = rules.find((r) => r.field === key);
      if (existing) {
        // Already filtered on this column — reopen it instead of stacking a duplicate.
        setAutoOpenId(existing.id);
        return;
      }
      const id = `${key}-${Date.now()}`;
      setRules([...rules, { id, field: key, condition: CONDITIONS[attr.type][0], values: [] }]);
      setAutoOpenId(id);
    };
    window.addEventListener('add-column-filter', onAdd as EventListener);
    return () => window.removeEventListener('add-column-filter', onAdd as EventListener);
  }, [rules, setRules]);

  const addRule = (field: string) => {
    const attr = (attrs?.find((a) => a.key === field) ?? attrOf(field))!;
    setRules([...rules, { id: `${field}-${rules.length}-${Date.now()}`, field, condition: CONDITIONS[attr.type][0], values: [] }]);
    setPickerOpen(false);
  };

  return (
    <>
      {rules.map((r) => (
        <Chip
          key={autoOpenId === r.id ? `${r.id}-open` : r.id}
          rule={r}
          onChange={(next) => setRules(rules.map((x) => (x.id === r.id ? next : x)))}
          onRemove={() => setRules(rules.filter((x) => x.id !== r.id))}
          autoOpen={autoOpenId === r.id}
          attrs={attrs}
        />
      ))}

      {/* Entry point: a labelled button while empty, a compact + once chips exist. */}
      {showFilterBuilder && (
      <div className="relative">
        {rules.length === 0 ? (
          <button
            onClick={() => setPickerOpen((v) => !v)}
            className="inline-flex h-8 items-center gap-1.5 rounded border border-[#DFE5ED] bg-white px-2.5 text-[13px] font-medium text-[#364658] transition-colors hover:bg-[#F5F7FA]"
          >
            <Filter size={14} />
            Filters
          </button>
        ) : (
          <button
            onClick={() => setPickerOpen((v) => !v)}
            className="inline-flex h-8 w-8 items-center justify-center rounded border border-dashed border-[#DFE5ED] bg-white text-[#64748B] transition-colors hover:border-[#3D8BD0] hover:text-[#3D8BD0]"
            title="Add filter"
          >
            <Plus size={15} />
          </button>
        )}
        {pickerOpen && <AttrPicker onPick={addRule} onClose={() => setPickerOpen(false)} used={rules.map((r) => r.field)} noun={noun} attrs={attrs} />}
      </div>
      )}

      {showQuickFilters && <QuickFilters rules={rules} setRules={setRules} filters={quickFilters} />}

      {rules.length > 0 && (
        <button
          onClick={() => setRules([])}
          className="rounded px-1.5 py-0.5 text-[12px] font-medium text-[#3D8BD0] transition-colors hover:bg-[#EBF5FF] hover:text-[#2F7AB8]"
        >
          Clear all
        </button>
      )}
    </>
  );
}
