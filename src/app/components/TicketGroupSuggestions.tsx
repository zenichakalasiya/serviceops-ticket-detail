import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlignLeft, AppWindow, ChevronDown, ChevronLeft, ChevronUp, Clock, GitMerge, Info, Laptop, Layers, Plus, Server, Shield, Target, TicketCheck, TriangleAlert, User, X } from 'lucide-react';
import { toast } from 'sonner';
import { AiSparkle } from './upstream/AiSparkle';
import { Tooltip, TooltipTrigger, TooltipContent } from './ui/tooltip';

/* ─── ServiceOps AI: suggested request groups ─────────────────────────────────
   When many users raise requests about the same underlying issue (Wi-Fi down,
   a stalled onboarding step, a bad hardware batch), the AI clusters them so a
   technician can merge them or raise one Problem instead of solving 15 tickets
   one by one. Banner above the listing grid → side popup (group list → group
   detail with merge / create-problem / ignore). All mock, local state. */

interface GroupTicket {
  id: string;
  subject: string;
  status: string;
  priority: string;
  assignee: string;
  requester: string;
  /** Request (default) | Asset | CI | Problem | Change — a MIXED group gets Relations-style type pills. */
  itemType?: string;
  /** Asset/CI rows only — the type shown where requests show their assignee. */
  assetType?: string;
}

interface SuggestedGroup {
  id: string;
  name: string;
  window: string;
  age: string;
  /** Detected since the user last reviewed — renders under "New suggestions". */
  isNew?: boolean;
  confidence: { level: 'High' | 'Medium' | 'Low'; pct: number };
  /** One-line evidence shown on the list card. */
  summary: string;
  /** Fuller context shown on the detail view. */
  description: string;
  /** Why the AI clustered these — the signals it matched on. */
  reason: string;
  tickets: GroupTicket[];
}

/** Cluster a request belongs to, for the grid's "Similarity" grouping — the SAME
    clusters this panel suggests, so the banner and the grid can never disagree. */
export interface SimilarityCluster {
  key: string;
  name: string;
  summary: string;
  ticketIds: string[];
}
export const similarityClusters = (): SimilarityCluster[] =>
  GROUP_SEEDS.map((g) => ({ key: g.name, name: g.name, summary: g.summary, ticketIds: g.tickets.map((t) => t.id) }));

const GROUP_SEEDS: SuggestedGroup[] = [
  {
    id: 'grp-1',
    name: 'Wi-Fi drops on Floor 3 — Ahmedabad HO',
    window: 'all within 96 min',
    age: '2h ago',
    isNew: true,
    confidence: { level: 'High', pct: 92 },
    summary:
      'Five requests raised between 13:30 and 15:06, all from Ahmedabad HO Floor 3, all describing loss of wireless connectivity.',
    description:
      'A burst of connectivity requests from the same floor of Ahmedabad HO. All five requesters report Wi-Fi dropping or fully unavailable, starting around 13:30. No other floor or office has raised a connectivity request in the same window. Network monitoring shows access point AP-AMD-3F-04 restarted its radio six times between 13:25 and 15:00, and the two neighbouring APs on Floor 3 absorbed roughly 60 extra clients in the same period — consistent with a single flapping AP rather than a building-wide outage. The switch port feeding that AP (SW-AMD-3F-01, port 14) has been logging CRC errors since the morning, which points at a cabling or SFP fault rather than a controller misconfiguration. Impact is contained to Floor 3, but that floor hosts the Finance and HR bays, and two of the affected requesters are processing month-end payroll today.',
    reason:
      'Same floor, same symptom, one 96-minute window — four of the five requests name AP-AMD-3F-04, which reset 6 times in that period.',
    tickets: [
      { id: 'INC-32', subject: 'My Internet Down', status: 'Open', priority: 'High', assignee: 'Shreyak Dalal', requester: 'Darshak Modi' },
      { id: 'INC-33', subject: 'WiFi is not working', status: 'Pending', priority: 'Urgent', assignee: 'Kaison Potai', requester: 'Meera Iyer' },
      { id: 'INC-40', subject: 'WiFi is not working', status: 'Open', priority: 'High', assignee: 'Shreyak Dalal', requester: 'Nandini Patel' },
      { id: 'INC-41', subject: 'Internet dropping every few minutes', status: 'In Progress', priority: 'Urgent', assignee: 'Kaison Potai', requester: 'Darshak Modi' },
      { id: 'INC-43', subject: 'Cannot open shared drive from Floor 3', status: 'Pending', priority: 'Medium', assignee: 'Rahul Shukla', requester: 'Samuel Githugu' },
    ],
  },
  {
    id: 'grp-2',
    name: 'Onboarding requests stalled at AD account creation',
    window: 'stalled 2+ days',
    age: '5h ago',
    isNew: true,
    confidence: { level: 'Medium', pct: 78 },
    summary:
      'Five Employee Onboarding requests are all sitting on the same workflow task — Create AD account — for more than two days.',
    description:
      'Five onboarding requests share the same catalog workflow and every one of them is parked on the "Create AD account" task. The approver queue is identical across all five, and no task in that queue has closed since 20/Apr. The identity technician who normally clears AD-account tasks is on leave this week, and the backup approver was never added to the queue — so all five tasks are waiting on a person who will not action them. Each stalled request is a new joiner with a confirmed start date; two of them start on Monday, and their laptops cannot be imaged until the AD account exists. Reassigning the approver once would release all five workflows in a single step.',
    reason:
      'Same catalog workflow, all parked on the same "Create AD account" task and approver — clearing that one step releases all five.',
    tickets: [
      { id: 'INC-31', subject: 'Employee Onboarding', status: 'In Progress', priority: 'Medium', assignee: 'Keetion Dale', requester: 'Nandini Patel' },
      { id: 'INC-34', subject: 'Employee Onboarding', status: 'Open', priority: 'Low', assignee: 'Novak Potai', requester: 'Samuel Githugu' },
      { id: 'INC-36', subject: 'Employee Onboarding', status: 'In Progress', priority: 'High', assignee: 'Keetion Dale', requester: 'Hetal Mori' },
      { id: 'INC-38', subject: 'Employee Onboarding', status: 'Pending', priority: 'Low', assignee: 'Amou Desai', requester: 'Ersin Sevinç' },
      { id: 'INC-45', subject: 'Employee Onboarding', status: 'Open', priority: 'Urgent', assignee: 'Pratik Patial', requester: 'Hetal Mori' },
      { id: 'AST-4102', subject: 'Dell Latitude 5440 — staged for new joiners', status: 'In Stock', priority: '', assignee: 'Keetion Dale', requester: 'Nandini Patel', itemType: 'Asset', assetType: 'Windows Laptop' },
      { id: 'CI-214', subject: 'AD-DC-01 — Primary Domain Controller', status: 'Operational', priority: '', assignee: 'Rahul Shukla', requester: 'Nandini Patel', itemType: 'CI', assetType: 'Server' },
    ],
  },
  {
    id: 'grp-3',
    name: 'Power adapter failures — Dell 65W batch DLC-2231',
    window: 'across 4 days',
    age: '1d ago',
    confidence: { level: 'Medium', pct: 64 },
    summary:
      'Three charger failures in four days. All three assets are Dell 65W adapters from procurement batch DLC-2231, issued in January.',
    description:
      'Three hardware requests describe the same failure mode — the laptop charger stops charging or overheats. Asset records tie all three adapters to purchase batch DLC-2231, issued in January. The baseline failure rate for this model is one per quarter, so three failures inside four days is roughly twelve times the expected rate. All three adapters shipped in the same procurement order of 40 units, meaning around 37 potentially faulty units are still in circulation across the Ahmedabad and Pune offices. One requester also reported a burnt smell, which raises this from an inconvenience to a potential safety issue worth flagging to the vendor alongside a batch recall.',
    reason:
      'Same adapter model, same procurement batch, same failure — at 12× the normal failure rate, a batch fault is the likely cause.',
    tickets: [
      { id: 'INC-39', subject: 'Laptop charger not working', status: 'Closed', priority: 'Medium', assignee: 'Keetion Dale', requester: 'Jainam Shah' },
      { id: 'INC-42', subject: 'Charger stopped charging the laptop', status: 'Open', priority: 'Low', assignee: 'Novak Potai', requester: 'Meera Iyer' },
      { id: 'INC-46', subject: 'Burnt smell from power adapter', status: 'Open', priority: 'High', assignee: 'Pratik Patial', requester: 'Rohit Kulkarni' },
    ],
  },
  {
    id: 'grp-4',
    name: 'VPN drops after firewall firmware update',
    window: 'since 06:00 today',
    age: '3h ago',
    isNew: true,
    confidence: { level: 'High', pct: 88 },
    summary:
      'Four remote-access complaints started within an hour of the FortiGate firmware update on the Ahmedabad VPN gateway.',
    description:
      'Four requests describe the same remote-access failure — the VPN client connects, then drops after a few minutes, or refuses to re-authenticate. Every affected user routes through the Ahmedabad VPN gateway, which was updated to FortiOS 7.4.4 during the 05:30 maintenance window. The first request arrived at 06:12, roughly forty minutes after the update completed, and no similar request was raised in the preceding two weeks. Session logs on the gateway show IKE re-key failures against the RADIUS host, which is consistent with a known regression in this firmware build. Rolling back the gateway (or applying the vendor hotfix) would clear all four requests at once.',
    reason:
      'Same gateway, same failure mode — all four requests began within an hour of the firmware change on that device.',
    tickets: [
      { id: 'INC-51', subject: 'VPN disconnects every few minutes', status: 'Open', priority: 'Urgent', assignee: 'Shreyak Dalal', requester: 'Darshak Modi' },
      { id: 'INC-52', subject: 'Cannot reconnect to VPN after drop', status: 'In Progress', priority: 'High', assignee: 'Kaison Potai', requester: 'Meera Iyer' },
      { id: 'INC-53', subject: 'Remote access keeps asking for credentials', status: 'Open', priority: 'High', assignee: 'Shreyak Dalal', requester: 'Samuel Githugu' },
      { id: 'INC-54', subject: 'VPN client times out from home', status: 'Pending', priority: 'Medium', assignee: 'Rahul Shukla', requester: 'Rohit Kulkarni' },
      { id: 'INC-55', subject: 'VPN asks for credentials in a loop', status: 'Open', priority: 'High', assignee: 'Keetion Dale', requester: 'Nandini Patel' },
      { id: 'INC-56', subject: 'Remote session drops during file transfer', status: 'Open', priority: 'Medium', assignee: 'Novak Potai', requester: 'Hetal Mori' },
      { id: 'INC-57', subject: 'VPN tunnel unstable since this morning', status: 'In Progress', priority: 'High', assignee: 'Shreyak Dalal', requester: 'Samuel Githugu' },
      { id: 'INC-58', subject: 'Cannot reach intranet over VPN', status: 'Pending', priority: 'Low', assignee: 'Rahul Shukla', requester: 'Ersin Sevinç' },
      { id: 'CI-176', subject: 'FW-AMD-01 — Ahmedabad VPN Gateway', status: 'Operational', priority: '', assignee: 'Shreyak Dalal', requester: 'Darshak Modi', itemType: 'CI', assetType: 'Server' },
      { id: 'CI-289', subject: 'RADIUS Authentication Service', status: 'Operational', priority: '', assignee: 'Rahul Shukla', requester: 'Meera Iyer', itemType: 'CI', assetType: 'Application' },
      { id: 'CI-301', subject: 'RADIUS-02 — Secondary Auth Node', status: 'Operational', priority: '', assignee: 'Rahul Shukla', requester: 'Meera Iyer', itemType: 'CI', assetType: 'Server' },
      { id: 'CI-118', subject: 'SW-AMD-CORE-01 — Ahmedabad Core Switch', status: 'Operational', priority: '', assignee: 'Shreyak Dalal', requester: 'Darshak Modi', itemType: 'CI', assetType: 'Switch' },
      { id: 'AST-2210', subject: 'FortiGate 100F — spare unit (Ahmedabad DC)', status: 'In Stock', priority: '', assignee: 'Keetion Dale', requester: 'Darshak Modi', itemType: 'Asset', assetType: 'Hardware' },
    ],
  },
];

/* Requests OUTSIDE every suggested group — the manual "Add request" picker
   draws from these. */
const CANDIDATE_POOL: GroupTicket[] = [
  { id: 'INC-35', subject: 'Request for Apple MacBook Pro Allocation', status: 'Open', priority: 'Medium', assignee: 'Rahul Shukla', requester: 'Kavit Gohel' },
  { id: 'INC-37', subject: 'help', status: 'Completed', priority: 'Urgent', assignee: 'Pratik Patial', requester: 'Rohit Kulkarni' },
  { id: 'INC-44', subject: 'My Internet Down', status: 'Closed', priority: 'High', assignee: 'Keetion Dale', requester: 'Kavit Gohel' },
  { id: 'INC-47', subject: 'VPN keeps disconnecting', status: 'Open', priority: 'Medium', assignee: 'Shreyak Dalal', requester: 'Meera Iyer' },
  { id: 'INC-48', subject: 'Cannot connect to office Wi-Fi', status: 'Open', priority: 'Low', assignee: 'Kaison Potai', requester: 'Jainam Shah' },
  { id: 'INC-49', subject: 'New joiner laptop setup', status: 'In Progress', priority: 'Medium', assignee: 'Keetion Dale', requester: 'Nandini Patel' },
  { id: 'INC-50', subject: 'Docking station not detected', status: 'Open', priority: 'Low', assignee: 'Novak Potai', requester: 'Darshak Modi' },
  { id: 'AST-4106', subject: 'Dell Latitude 5440 — hot spare', status: 'In Stock', priority: '', assignee: 'Keetion Dale', requester: 'Nandini Patel', itemType: 'Asset', assetType: 'Windows Laptop' },
  { id: 'AST-3988', subject: 'HP EliteBook 840 G9 — imaging bench', status: 'In Use', priority: '', assignee: 'Novak Potai', requester: 'Hetal Mori', itemType: 'Asset', assetType: 'Windows Laptop' },
  { id: 'CI-208', subject: 'AD-DC-02 — Secondary Domain Controller', status: 'Operational', priority: '', assignee: 'Rahul Shukla', requester: 'Nandini Patel', itemType: 'CI', assetType: 'Server' },
  { id: 'CI-341', subject: 'Okta Identity Gateway', status: 'Operational', priority: '', assignee: 'Shreyak Dalal', requester: 'Meera Iyer', itemType: 'CI', assetType: 'Application' },
];

/** What the AI recommends doing about each group — the closing step of the timeline. */
const GROUP_SOLUTIONS: Record<string, string> = {
  'grp-4':
    'One fault, not four tickets: the FortiOS 7.4.4 update broke IKE re-key. Raise a Problem, apply the vendor hotfix (or roll back) tonight, and all four requests close together.',
};

/* The Create Problem card one-liner, per cluster. */
const CREATE_BLURBS: Record<string, string> = {
  'grp-4': 'Raise one Problem to fix the shared root cause — a firmware regression on the VPN gateway.',
};
const CREATE_BLURB_FALLBACK = 'Raise one Problem to own the shared root cause — every linked request closes with it.';

const SOLUTION_FALLBACK =
  'The evidence points to one underlying fault. Raise a Problem to own the fix and link these requests \u2014 resolving it closes them together.';

const STATUS_DOT: Record<string, string> = {
  Open: '#3D8BD0',
  'In Progress': '#3B82F6',
  Pending: '#F59E0B',
  Completed: '#22C55E',
  Closed: '#94A3B8',
  'In Stock': '#22C55E',
  'In Use': '#3D8BD0',
  Operational: '#94A3B8',
};

const PRIORITY_DOT: Record<string, string> = {
  Low: '#22C55E',
  Medium: '#F59E0B',
  High: '#EF4444',
  Urgent: '#DC2626',
};

/** CMDB-style type icons for the Affected Items rows. */
const ASSET_TYPE_ICON: Record<string, typeof Laptop> = {
  'Windows Laptop': Laptop,
  Server: Server,
  Application: AppWindow,
};

const CONFIDENCE_TINT: Record<string, string> = {
  High: 'bg-[#DCFCE7] text-[#15803D]',
  Medium: 'bg-[#FEF3C7] text-[#B45309]',
  Low: 'bg-[#F1F5F9] text-[#64748B]',
};

const initialsOf = (name: string) => {
  const parts = name.split(' ').filter(Boolean);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase();
};

/** Rows that are actual requests — assets/CIs in mixed groups do not count. */
const requestItems = (g: SuggestedGroup) => g.tickets.filter((t) => !t.itemType || t.itemType === 'Request');

const uniqueRequesters = (g: SuggestedGroup) => new Set(requestItems(g).map((t) => t.requester)).size;

/** One step of the option-4 timeline: rail + icon, blue title, body below. */
function TimelineStep({
  icon: Icon,
  title,
  action,
  last,
  ai,
  sparkle,
  noWash,
  children,
}: {
  icon: typeof Layers;
  title: string;
  action?: React.ReactNode;
  last?: boolean;
  /** AI-authored step — gradient title + gradient rail. */
  ai?: boolean;
  /** Render the gradient AI sparkle as this step’s rail icon. */
  sparkle?: boolean;
  /** Drop the gradient wash behind an AI step (kept elsewhere). */
  noWash?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`relative pl-10 last:pb-0 ${ai ? 'pb-9' : 'pb-8'}`}>
      {/* Connector runs from under the icon to the next step. */}
      {!last && (
        <span
          className="absolute bottom-0 left-[11px] top-7 w-px"
          style={{
            background: ai
              ? 'linear-gradient(180deg, rgba(115, 30, 251, 0.45) 0%, #E5E9F0 100%)'
              : '#E5E9F0',
          }}
        />
      )}
      <span className="absolute -left-0.5 top-px flex size-[26px] items-center justify-center bg-white text-[#64748B]">
        {sparkle ? <AiSparkle size={17} /> : <Icon size={17} />}
      </span>
      {/* Gradient wash (AI Summary recipe): tint only, no border. */}
      {ai && !noWash && (
        <span
          className={`pointer-events-none absolute -left-3 -top-3 right-0 rounded-lg ${last ? '-bottom-4' : 'bottom-4'}`}
          style={{
            opacity: 0.045,
            background: 'linear-gradient(90deg, #4CB1FE 0%, #731EFB 24.52%, #F911E3 100%)',
          }}
        />
      )}
      <div className="relative flex min-h-[22px] items-center justify-between gap-2">
        <h3 className="text-[13px] font-semibold text-[#1E293B]">{title}</h3>
        {action}
      </div>
      <div className={ai ? 'relative mt-2.5' : 'mt-2.5'}>{children}</div>
    </div>
  );
}

/** Assignee · status · priority for a group-detail row — quiet, tooltip-named. */
function RowMeta({ t }: { t: GroupTicket }) {
  const sc = STATUS_DOT[t.status] ?? '#94A3B8';
  const pc = PRIORITY_DOT[t.priority] ?? '#94A3B8';
  return (
    <div className="flex flex-shrink-0 items-center gap-2">
      {!t.itemType || t.itemType === 'Request' ? (
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <span className="inline-flex w-[128px] items-center gap-1.5">
            <span className="flex size-[18px] flex-shrink-0 items-center justify-center rounded bg-[#3D8BD0] text-[8px] font-medium text-white">
              {initialsOf(t.assignee)}
            </span>
            <span className="min-w-0 truncate text-[12px] text-[#64748B]">{t.assignee}</span>
          </span>
        </TooltipTrigger>
        <TooltipContent className="z-[10000]">Assigned to {t.assignee}</TooltipContent>
      </Tooltip>
      ) : (
        <Tooltip delayDuration={200}>
          <TooltipTrigger asChild>
            <span className="inline-flex w-[128px] items-center gap-1.5">
              {(() => {
                const Icon = ASSET_TYPE_ICON[t.assetType ?? ''] ?? AppWindow;
                return <Icon size={13} className="flex-shrink-0 text-[#7B8FA5]" />;
              })()}
              <span className="min-w-0 truncate text-[12px] text-[#64748B]">{t.assetType ?? t.itemType}</span>
            </span>
          </TooltipTrigger>
          <TooltipContent className="z-[10000]">Asset Type: {t.assetType ?? t.itemType}</TooltipContent>
        </Tooltip>
      )}
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <span className="flex w-[92px]">
            <span
              className="inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-[11px] font-medium"
              style={{ background: `${sc}1A`, color: sc }}
            >
              <span className="size-1.5 rounded-full" style={{ background: sc }} />
              {t.status}
            </span>
          </span>
        </TooltipTrigger>
        <TooltipContent className="z-[10000]">Status: {t.status}</TooltipContent>
      </Tooltip>
      {t.priority ? (
        <Tooltip delayDuration={200}>
          <TooltipTrigger asChild>
            <span className="flex w-[72px]">
              <span
                className="inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-[11px] font-medium"
                style={{ background: `${pc}1A`, color: pc }}
              >
                <span className="size-1.5 rounded-full" style={{ background: pc }} />
                {t.priority}
              </span>
            </span>
          </TooltipTrigger>
          <TooltipContent className="z-[10000]">Priority: {t.priority}</TooltipContent>
        </Tooltip>
      ) : (
        <span className="w-[72px]" />
      )}
    </div>
  );
}

function ConfidencePill({ confidence }: { confidence: SuggestedGroup['confidence'] }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={`inline-flex flex-shrink-0 cursor-default items-center rounded-sm px-1.5 py-0.5 text-[11px] font-semibold ${CONFIDENCE_TINT[confidence.level]}`}>
          {confidence.level} · {confidence.pct}%
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="z-[10000]">Confidence</TooltipContent>
    </Tooltip>
  );
}

/** Add-record button + searchable picker — the Add-request recipe, reusable per section. */
function AddRecordButton({
  label,
  placeholder,
  candidates,
  exclude,
  onAdd,
}: {
  label: string;
  placeholder: string;
  candidates: GroupTicket[];
  exclude: Set<string>;
  onAdd: (t: GroupTicket) => void;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [openUp, setOpenUp] = useState(false);
  const query = q.trim().toLowerCase();
  const rows = candidates.filter(
    (t) => !exclude.has(t.id) && (!query || t.id.toLowerCase().includes(query) || t.subject.toLowerCase().includes(query)),
  );
  return (
    <div className="relative flex-shrink-0">
      <button
        onClick={(e) => {
          // Flip upward when the popup would run past the viewport bottom.
          setOpenUp(window.innerHeight - e.currentTarget.getBoundingClientRect().bottom < 340);
          setOpen((v) => !v);
          setQ('');
        }}
        className="inline-flex items-center gap-1 whitespace-nowrap rounded px-1 py-0.5 text-[12px] font-medium text-[#3D8BD0] transition-colors hover:bg-[#EBF5FF] hover:text-[#2F7AB8]"
      >
        <Plus size={13} />
        {label}
      </button>
      {open && (
        <div className={`app-menu absolute right-0 z-50 w-[460px] overflow-hidden rounded-lg border border-[#DFE5ED] bg-white shadow-lg ${openUp ? 'bottom-full mb-1' : 'top-full mt-1'}`}>
          <div className="p-2">
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  e.stopPropagation();
                  setOpen(false);
                }
              }}
              onBlur={() => setOpen(false)}
              placeholder={placeholder}
              className="h-9 w-full rounded border border-[#E5E7EB] bg-[#F9FAFB] px-3 text-[13px] text-[#364658] placeholder:text-[#9CA3AF] focus:border-[#3D8BD0] focus:bg-white focus:outline-none"
            />
          </div>
          {/* onMouseDown beats the input blur, so the picker stays open for multi-add. */}
          <div className="max-h-[240px] overflow-y-auto pb-1">
            {rows.length ? (
              rows.map((t) => (
                <button
                  key={t.id}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onAdd(t);
                  }}
                  className="group/cand flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-[#F9FAFB]"
                >
                  <span className="flex-shrink-0 rounded bg-[#e8f4fd] px-1.5 py-0.5 text-[11px] font-semibold text-[#3D8BD0]">{t.id}</span>
                  <span className="min-w-0 flex-1 truncate text-[13px] text-[#364658]">{t.subject}</span>
                  <span className="flex flex-shrink-0 items-center gap-1.5">
                    <span className="size-2 rounded-full" style={{ background: STATUS_DOT[t.status] ?? '#94A3B8' }} />
                    <span className="text-[12px] text-[#64748B]">{t.status}</span>
                  </span>
                  <span className="flex size-5 flex-shrink-0 items-center justify-center rounded bg-[#F1F5F9] transition-colors group-hover/cand:bg-[#E8EEF5]">
                    <Plus size={12} className="text-[#64748B]" />
                  </span>
                </button>
              ))
            ) : (
              <div className="px-3 py-3 text-[12px] text-[#94A3B8]">No matching records</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function TicketGroupSuggestions({
  panelOnly = false,
  soloMode = false,
  onGroupConsumed,
}: {
  panelOnly?: boolean;
  /** Host opens ONE group: resolving it closes the panel instead of showing the list. */
  soloMode?: boolean;
  /** Fired when a group is merged / created / ignored, so the host can clear its entry point. */
  onGroupConsumed?: (id: string) => void;
} = {}) {
  const [groups, setGroups] = useState<SuggestedGroup[]>(GROUP_SEEDS);
  const [dismissed, setDismissed] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [openGroupId, setOpenGroupId] = useState<string | null>(null);
  /* Long clusters open folded: 4 items / 6 requests, then a one-way load-more. */
  const [showAllAssets, setShowAllAssets] = useState(false);
  const [showAllRequests, setShowAllRequests] = useState(false);
  useEffect(() => {
    setShowAllAssets(false);
    setShowAllRequests(false);
  }, [openGroupId]);
  const [itemTypeFilter, setItemTypeFilter] = useState('All');

  const openGroup = groups.find((g) => g.id === openGroupId) ?? null;
  const coveredRequests = groups.reduce((n, g) => n + requestItems(g).length, 0);
  const triagePct = coveredRequests > 0 ? Math.round((1 - groups.length / coveredRequests) * 100) : 0;

  const typeOfItem = (t: GroupTicket) => t.itemType ?? 'Request';
  const groupTypes = openGroup ? Array.from(new Set(openGroup.tickets.map(typeOfItem))) : [];
  const mixedTypes = groupTypes.length > 1;
  const visibleTickets = openGroup
    ? mixedTypes && itemTypeFilter !== 'All'
      ? openGroup.tickets.filter((t) => typeOfItem(t) === itemTypeFilter)
      : openGroup.tickets
    : [];
  // Option-2 layout (group 2, and group 4 which clones it): Why band leads and carries the actions.
  // Clusters 1 & 2 keep their ORIGINAL design options as review backups; 3 & 4 use the final layout.
  const detailV4 = openGroup?.id === 'grp-3' || openGroup?.id === 'grp-4';
  const detailV2 = openGroup?.id === 'grp-2' || detailV4;
  // Option-3 layout demo (group 3): the footer actions become self-explaining choice cards.
  const detailV3 = openGroup?.id === 'grp-3';
  const v2Assets = openGroup ? openGroup.tickets.filter((t) => t.itemType && t.itemType !== 'Request') : [];
  const v2Requests = openGroup ? openGroup.tickets.filter((t) => !t.itemType || t.itemType === 'Request') : [];

  // Esc steps back: detail → list → closed.
  useEffect(() => {
    if (!panelOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (openGroupId) setOpenGroupId(null);
      else setPanelOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [panelOpen, openGroupId]);

  // The toolbar shows a compact reopen button while the banner is dismissed.
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('suggested-groups-state', { detail: { hidden: dismissed, count: groups.length } }));
  }, [dismissed, groups.length]);
  useEffect(() => {
    const onOpen = () => {
      if (groups.length) setPanelOpen(true);
    };
    window.addEventListener('open-suggested-groups', onOpen);
    return () => window.removeEventListener('open-suggested-groups', onOpen);
  }, [groups.length]);

  // Other pages (e.g. the AI-suggested row on the Problem listing) open a group directly.
  useEffect(() => {
    const onOpen = (e: Event) => {
      const id = String((e as CustomEvent).detail ?? '');
      if (!groups.some((g) => g.id === id)) return;
      setOpenGroupId(id);
      setPanelOpen(true);
    };
    window.addEventListener('open-suggested-group', onOpen as EventListener);
    return () => window.removeEventListener('open-suggested-group', onOpen as EventListener);
  }, [groups]);

  // Fresh picker per group.
  useEffect(() => {
    setItemTypeFilter(() => {
      const g = groups.find((gr) => gr.id === openGroupId);
      if (!g) return 'All';
      const types = Array.from(new Set(g.tickets.map((t) => t.itemType ?? 'Request')));
      return types.length > 1 ? types[0] : 'All';
    });
  }, [openGroupId]);

  /** A group leaves the list after merge / create-problem / ignore. */
  const consumeGroup = (id: string) => {
    setGroups((prev) => {
      const next = prev.filter((g) => g.id !== id);
      if (next.length === 0 || soloMode) setPanelOpen(false);
      return next;
    });
    setOpenGroupId(null);
    onGroupConsumed?.(id);
  };

  const removeTicket = (groupId: string, ticketId: string) => {
    setGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, tickets: g.tickets.filter((t) => t.id !== ticketId) } : g)),
    );
  };

  const addTicket = (groupId: string, ticket: GroupTicket) => {
    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId && !g.tickets.some((t) => t.id === ticket.id) ? { ...g, tickets: [...g.tickets, ticket] } : g,
      ),
    );
  };

  const panel = panelOpen
    ? createPortal(
        <div className="fixed inset-0 z-[9998]">
          <div className="absolute inset-0 bg-black/20" onClick={() => setPanelOpen(false)} />
          <div className="absolute right-0 top-0 flex h-full w-[760px] max-w-full flex-col bg-white shadow-2xl">
            {/* Header */}
            <div className="flex items-center gap-2 border-b border-[#E5E7EB] px-5 py-3.5">
              {openGroup ? (
                <>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setOpenGroupId(null)}
                        className="-ml-1 flex size-6 flex-shrink-0 items-center justify-center rounded text-[#64748B] transition-colors hover:bg-[#F3F4F6] hover:text-[#364658]"
                        title="Back to groups"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <h2 className="truncate text-[15px] font-semibold text-[#1E293B]">{openGroup.name}</h2>
                    </div>
                    {/* pl aligns the KPI row under the title text (chevron 24 − ml 4 + gap 6). */}
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 pl-[26px]">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="text-[11px] text-[#7B8FA5]">Requests</span>
                        <span className="text-[12px] font-medium text-[#364658]">{requestItems(openGroup).length}</span>
                      </span>
                      <span className="h-3 w-px bg-[#E5E7EB]" />
                      <span className="inline-flex items-center gap-1.5">
                        <span className="text-[11px] text-[#7B8FA5]">Requesters</span>
                        <span className="text-[12px] font-medium text-[#364658]">{uniqueRequesters(openGroup)}</span>
                      </span>
                      <span className="h-3 w-px bg-[#E5E7EB]" />
                      <span className="inline-flex items-center gap-1.5">
                        <span className="text-[11px] text-[#7B8FA5]">Detected</span>
                        <span className="text-[12px] font-medium text-[#364658]">{openGroup.age}</span>
                      </span>
                      <span className="h-3 w-px bg-[#E5E7EB]" />
                      <span className="inline-flex items-center gap-1.5">
                        <span className="text-[11px] text-[#7B8FA5]">Confidence</span>
                        <ConfidencePill confidence={openGroup.confidence} />
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <AiSparkle size={16} className="flex-shrink-0" />
                  <h2 className="flex-1 text-[15px] font-semibold text-[#1E293B]">Suggested Clusters</h2>
                  <span className="rounded-sm bg-[#F1F5F9] px-1.5 py-0.5 text-[11px] font-semibold text-[#64748B]">{groups.length}</span>
                </>
              )}
              {openGroup && (detailV2 || detailV3) && (
                <button
                  onClick={() => {
                    toast(`Group "${openGroup.name}" ignored`);
                    consumeGroup(openGroup.id);
                  }}
                  className="flex-shrink-0 rounded px-2.5 py-1.5 text-[12px] font-medium text-[#64748B] transition-colors hover:bg-[#F3F4F6] hover:text-[#364658]"
                >
                  Ignore
                </button>
              )}
              <button
                onClick={() => setPanelOpen(false)}
                className="flex size-8 flex-shrink-0 items-center justify-center rounded transition-colors hover:bg-[#F3F4F6]"
              >
                <X size={18} className="text-[#64748B]" />
              </button>
            </div>

            {openGroup ? (
              <>
                {/* ── Group detail ── */}
                <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
                  {(() => {
                    const whyBand = (
                      <div
                        className={detailV4 ? '' : 'rounded-lg border border-[#EFE9FA] px-3.5 py-3'}
                        style={detailV4 ? undefined : { background: 'linear-gradient(90deg, rgba(76, 177, 254, 0.05) 0%, rgba(115, 30, 251, 0.05) 41.49%, rgba(249, 17, 227, 0.05) 100%), #FFF' }}
                      >
                        <div className="flex items-center gap-1.5 pb-1">
                          <AiSparkle size={12} />
                          <span className="text-[11px] font-semibold uppercase tracking-wide text-[#7B8FA5]">Why ServiceOps grouped these</span>
                        </div>
                        <p className="pl-[20px] text-[13px] leading-relaxed text-[#475569]">{openGroup.reason}</p>
                        {/* V2: the suggested actions live right on the AI reasoning card. */}
                        {detailV2 && !detailV4 && (
                          <div className="mt-3 flex flex-wrap items-center gap-2 pl-[20px]">
                            <button
                              onClick={() => {
                                toast.success(`Problem PRB-2119 created from "${openGroup.name}"`);
                                consumeGroup(openGroup.id);
                              }}
                              style={{
                                background: 'linear-gradient(rgba(255, 255, 255, 0.14), rgba(255, 255, 255, 0.14)), linear-gradient(90deg, #4CB1FE 0%, #731EFB 41.49%, #F911E3 100%)',
                              }}
                              className="h-8 rounded px-3 text-[12px] font-medium text-white transition-all duration-200 hover:brightness-[0.92] hover:shadow-md"
                            >
                              Create Problem
                            </button>
                            {!panelOnly && (
                              <button
                                onClick={() => {
                                  toast.success(`${openGroup.tickets.length} requests merged into ${openGroup.tickets[0]?.id ?? 'one request'}`);
                                  consumeGroup(openGroup.id);
                                }}
                                style={{
                                  background: 'linear-gradient(white, white) padding-box, linear-gradient(90deg, #4CB1FE 0%, #731EFB 41.49%, #F911E3 100%) border-box',
                                  border: '1px solid transparent',
                                }}
                                className="h-8 rounded px-3 text-[12px] font-medium text-[#364658] transition-all duration-200 hover:text-[#3D8BD0] hover:shadow-sm"
                              >
                                Merge Requests
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                    return detailV4 ? null : whyBand;
                  })()}

                  <div className={detailV4 ? '' : 'mt-5'}>
                    {detailV2 && (() => {
                      {/* Same row recipe as the filtered list — labelled, hover-remove. */}
                      const renderAssetCard = (t: GroupTicket) => {
                        const Icon = ASSET_TYPE_ICON[t.assetType ?? ''] ?? AppWindow;
                        return (
                          <div key={t.id} className="group relative flex items-center gap-3 rounded-lg border border-[#D8E6F3] bg-white p-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all hover:border-[#A9C8E4] hover:shadow-md">
                            <span className="flex size-9 flex-shrink-0 items-center justify-center rounded border border-[#EEF2F7] bg-[#F8FAFC]">
                              <Icon size={16} className="text-[#64748B]" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="flex items-center gap-1.5 pr-5">
                                <span className="rounded bg-[#e8f4fd] px-1.5 py-0.5 text-[11px] font-semibold text-[#3D8BD0]">{t.id}</span>
                                <span className="text-[12px] text-[#9CA3AF]">·</span>
                                <span className="truncate text-[12px] text-[#64748B]">{t.assetType ?? t.itemType}</span>
                              </span>
                              <span className="mt-1 block truncate text-[13px] font-semibold text-[#364658]">{t.subject}</span>
                            </span>
                            <button
                              onClick={() => removeTicket(openGroup.id, t.id)}
                              className="absolute right-1.5 top-1.5 flex size-6 items-center justify-center rounded opacity-0 transition-all hover:bg-[#FEE2E2] group-hover:opacity-100"
                              title="Remove from group"
                            >
                              <X size={14} className="text-[#EF4444]" />
                            </button>
                          </div>
                        );
                      };
                      const renderItem = (t: GroupTicket) => (
                        <div key={t.id} className="group flex items-center gap-3 border-b border-[#F1F5F9] py-3 last:border-0">
                          <span className="flex-shrink-0 rounded bg-[#e8f4fd] px-1.5 py-0.5 text-[11px] font-semibold text-[#3D8BD0]">{t.id}</span>
                          <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-[#364658]">{t.subject}</span>
                          <RowMeta t={t} />
                          <button
                            onClick={() => removeTicket(openGroup.id, t.id)}
                            className="flex-shrink-0 rounded p-1.5 opacity-0 transition-colors hover:bg-[#FEE2E2] group-hover:opacity-100"
                            title="Remove from group"
                          >
                            <X size={16} className="text-[#EF4444]" />
                          </button>
                        </div>
                      );
                      const addItemsBtn = (
                        <AddRecordButton
                          label="Add Items"
                          placeholder="Search assets and CIs by ID or subject..."
                          candidates={CANDIDATE_POOL.filter((t) => t.itemType && t.itemType !== 'Request')}
                          exclude={new Set(openGroup.tickets.map((t) => t.id))}
                          onAdd={(t) => addTicket(openGroup.id, t)}
                        />
                      );
                      const addRequestBtn = (
                        <AddRecordButton
                          label="Add request"
                          placeholder="Search requests by ID or subject..."
                          candidates={CANDIDATE_POOL.filter((t) => !t.itemType || t.itemType === 'Request')}
                          exclude={new Set(openGroup.tickets.map((t) => t.id))}
                          onAdd={(t) => addTicket(openGroup.id, t)}
                        />
                      );
                      const assetGrid = (
                        <div>
                          <div className="grid grid-cols-2 gap-2.5">{(showAllAssets ? v2Assets : v2Assets.slice(0, 4)).map(renderAssetCard)}</div>
                          {v2Assets.length > 4 && (
                            <button
                              onClick={() => setShowAllAssets((v) => !v)}
                              className="mt-2.5 flex items-center gap-1 text-[12px] font-medium text-[#3D8BD0] transition-colors hover:text-[#2F7AB8]"
                            >
                              {showAllAssets ? 'Show less' : 'Show all'}
                              {showAllAssets ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                          )}
                        </div>
                      );
                      const requestList = (
                        <div className="-mt-2">
                          {(showAllRequests ? v2Requests : v2Requests.slice(0, 6)).map(renderItem)}
                          {v2Requests.length > 6 && (
                            <button
                              onClick={() => setShowAllRequests((v) => !v)}
                              className="mt-2 flex items-center gap-1 px-1.5 text-[12px] font-medium text-[#3D8BD0] transition-colors hover:text-[#2F7AB8]"
                            >
                              {showAllRequests ? 'Show less' : 'Show all'}
                              {showAllRequests ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                          )}
                        </div>
                      );

                      /* ── Option 4: one AI narrative read top to bottom ── */
                      if (detailV4) {
                        const altActions = openGroup.id === 'grp-3';
                        return (
                          <div className="pt-1">
                            <TimelineStep icon={Target} title="AI analysis & recommendation" ai sparkle noWash={altActions}>
                              <p className="text-[13px] leading-relaxed text-[#475569]">{openGroup.reason}</p>
                              <p className="mt-2.5 text-[13px] leading-relaxed text-[#475569]">{GROUP_SOLUTIONS[openGroup.id] ?? SOLUTION_FALLBACK}</p>
                              {/* The whole page builds to this decision, so it closes on the
                                  self-explaining choice cards rather than bare buttons. */}
                              <div className="mt-3.5 flex gap-3">
                                <button
                                  onClick={() => {
                                    toast.success(`Problem PRB-2119 created from "${openGroup.name}"`);
                                    consumeGroup(openGroup.id);
                                  }}
                                  className={`flex flex-1 flex-col items-start gap-2 rounded-lg p-3.5 text-left transition-all ${altActions ? 'duration-200 hover:shadow-[0_2px_10px_rgba(115,30,251,0.14)]' : 'hover:brightness-[0.95] hover:shadow-[0_2px_10px_rgba(115,30,251,0.25)]'} ${panelOnly ? 'max-w-[calc(50%-6px)]' : ''}`}
                                  style={
                                    altActions
                                      ? {
                                          background: 'linear-gradient(white, white) padding-box, linear-gradient(90deg, #4CB1FE 0%, #731EFB 41.49%, #F911E3 100%) border-box',
                                          border: '1px solid transparent',
                                        }
                                      : {
                                          background: 'linear-gradient(rgba(255, 255, 255, 0.14), rgba(255, 255, 255, 0.14)), linear-gradient(90deg, #4CB1FE 0%, #731EFB 41.49%, #F911E3 100%)',
                                        }
                                  }
                                >
                                  <span className={`flex w-full items-center gap-2 text-[13px] font-semibold leading-none ${altActions ? 'text-[#1E293B]' : 'text-white'}`}>
                                    <TriangleAlert size={15} className={altActions ? 'text-[#1E293B]' : 'text-white'} />
                                    Create Problem
                                  </span>
                                  <span className={`pl-[23px] text-[12px] leading-snug ${altActions ? 'text-[#64748B]' : 'text-white/90'}`}>
                                    {CREATE_BLURBS[openGroup.id] ?? CREATE_BLURB_FALLBACK}
                                  </span>
                                </button>
                                {!panelOnly && (
                                  <button
                                    onClick={() => {
                                      toast.success(`${v2Requests.length} requests merged into ${v2Requests[0]?.id ?? 'one request'}`);
                                      consumeGroup(openGroup.id);
                                    }}
                                    style={
                                      altActions
                                        ? {
                                            background:
                                              'linear-gradient(90deg, rgba(76, 177, 254, 0.12) 0%, rgba(115, 30, 251, 0.12) 41.49%, rgba(249, 17, 227, 0.12) 100%), #FFF',
                                          }
                                        : {
                                            background: 'linear-gradient(white, white) padding-box, linear-gradient(90deg, #4CB1FE 0%, #731EFB 41.49%, #F911E3 100%) border-box',
                                            border: '1px solid transparent',
                                          }
                                    }
                                    className="flex flex-1 flex-col items-start gap-2 rounded-lg p-3.5 text-left transition-all duration-200 hover:shadow-[0_2px_10px_rgba(115,30,251,0.14)]"
                                  >
                                    <span className="flex items-center gap-2 text-[13px] font-semibold leading-none text-[#1E293B]">
                                      <GitMerge size={15} className="text-[#1E293B]" />
                                      Merge Requests
                                    </span>
                                    <span className="pl-[23px] text-[12px] leading-snug text-[#64748B]">
                                      Combine all {v2Requests.length} requests into one and resolve them together.
                                    </span>
                                  </button>
                                )}
                              </div>
                            </TimelineStep>
                            <TimelineStep icon={Layers} title={`Affected items (${v2Assets.length})`} action={addItemsBtn}>
                              {assetGrid}
                            </TimelineStep>
                            <TimelineStep icon={TicketCheck} title={`Impacted requests (${v2Requests.length})`} action={addRequestBtn} last>
                              {requestList}
                            </TimelineStep>
                          </div>
                        );
                      }

                      return (
                        <>
                          <div className="relative overflow-hidden rounded-lg border border-[#D8E6F3] bg-[#F6FAFE] px-4 pb-1 pt-3">
                          <div className="flex items-center justify-between pb-1.5">
                            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#475569]">
                              Affected Items
                              <span className="rounded-full bg-[#3D8BD0]/10 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-[#3D8BD0]">{v2Assets.length}</span>
                            </div>
                            {addItemsBtn}
                          </div>
                          <div className="grid grid-cols-2 gap-2.5 pb-2.5 pt-1">{v2Assets.map(renderAssetCard)}</div>
                          </div>
                          <div className="mt-5 flex items-center justify-between pb-1.5">
                            <div className="text-[11px] font-semibold uppercase tracking-wide text-[#7B8FA5]">
                              Impacted requests ({v2Requests.length})
                            </div>
                            {addRequestBtn}
                          </div>
                          <div>{v2Requests.map(renderItem)}</div>
                        </>
                      );
                    })()}
                    {!detailV2 && (<>
                    <div className="pb-1">
                      <div className="flex items-center justify-between">
                        <div className="text-[11px] font-semibold uppercase tracking-wide text-[#7B8FA5]">
                          {mixedTypes ? 'Relation' : 'Similar requests'} ({openGroup.tickets.length})
                        </div>
                        <AddRecordButton
                          label="Add request"
                          placeholder="Search requests by ID or subject..."
                          candidates={CANDIDATE_POOL.filter((t) => !t.itemType || t.itemType === 'Request')}
                          exclude={new Set(openGroup.tickets.map((t) => t.id))}
                          onAdd={(t) => addTicket(openGroup.id, t)}
                        />
                      </div>
                      {/* Mixed groups: the Relations-tab pill recipe, live counts. */}
                      {mixedTypes && (
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          {groupTypes.map((fl) => {
                            const count = openGroup.tickets.filter((t) => typeOfItem(t) === fl).length;
                            return (
                              <button
                                key={fl}
                                onClick={() => setItemTypeFilter(fl)}
                                className={`inline-flex items-center gap-1 rounded border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                                  itemTypeFilter === fl
                                    ? 'border-[#3D8BD0] bg-[#EBF5FF] text-[#3D8BD0]'
                                    : 'border-[#DFE5ED] bg-white text-[#7B8FA5] hover:bg-[#F5F7FA]'
                                }`}
                              >
                                {fl}
                                <span className={`text-[10px] ${itemTypeFilter === fl ? 'text-[#3D8BD0]' : 'text-[#9CA3AF]'}`}>{count}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    <div>
                      {visibleTickets.map((t) => (
                        <div key={t.id} className="group flex items-center gap-3 border-b border-[#F1F5F9] py-3 last:border-0">
                          <span className="flex-shrink-0 rounded bg-[#e8f4fd] px-1.5 py-0.5 text-[11px] font-semibold text-[#3D8BD0]">{t.id}</span>
                          <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-[#364658]">{t.subject}</span>
                          <RowMeta t={t} />
                          <button
                            onClick={() => removeTicket(openGroup.id, t.id)}
                            className="flex-shrink-0 rounded p-1.5 opacity-0 transition-colors hover:bg-[#FEE2E2] group-hover:opacity-100"
                            title="Remove from group"
                          >
                            <X size={16} className="text-[#EF4444]" />
                          </button>
                        </div>
                      ))}
                    </div>
                    </>)}
                  </div>
                </div>

                {/* Footer actions */}
                {!detailV2 && (
                <div className="border-t border-[#E5E7EB] px-5 py-3">
                  {!detailV2 && !detailV3 && <div className="pb-2 text-[11px] font-semibold uppercase tracking-wide text-[#7B8FA5]">Suggested action</div>}
                  {detailV3 ? (
                    /* Decision cards: each action explains WHAT it does, and the AI marks
                       the one its reasoning points to — no more "which button?" moment. */
                    <div className="flex gap-3">
                      {!panelOnly && (
                        <button
                          onClick={() => {
                            toast.success(`${openGroup.tickets.length} requests merged into ${openGroup.tickets[0]?.id ?? 'one request'}`);
                            consumeGroup(openGroup.id);
                          }}
                          style={{
                            background: 'linear-gradient(white, white) padding-box, linear-gradient(90deg, #4CB1FE 0%, #731EFB 41.49%, #F911E3 100%) border-box',
                            border: '1px solid transparent',
                          }}
                          className="order-2 flex flex-1 flex-col items-start gap-2 rounded-lg p-3.5 text-left transition-all duration-200 hover:shadow-[0_2px_10px_rgba(115,30,251,0.14)]"
                        >
                          <span className="flex items-center gap-2 text-[13px] font-semibold leading-none text-[#1E293B]">
                            <GitMerge size={15} className="text-[#1E293B]" />
                            Merge Requests
                          </span>
                          <span className="pl-[23px] text-[12px] leading-snug text-[#64748B]">
                            Combine all {openGroup.tickets.length} requests into one and resolve them together.
                          </span>
                        </button>
                      )}
                      <button
                        onClick={() => {
                          toast.success(`Problem PRB-2119 created from "${openGroup.name}"`);
                          consumeGroup(openGroup.id);
                        }}
                        className="order-1 flex flex-1 flex-col items-start gap-2 rounded-lg p-3.5 text-left transition-all hover:brightness-[0.95] hover:shadow-[0_2px_10px_rgba(115,30,251,0.25)]"
                        style={{
                          background: 'linear-gradient(rgba(255, 255, 255, 0.14), rgba(255, 255, 255, 0.14)), linear-gradient(90deg, #4CB1FE 0%, #731EFB 41.49%, #F911E3 100%)',
                        }}
                      >
                        <span className="flex w-full items-center gap-2 text-[13px] font-semibold leading-none text-white">
                          <TriangleAlert size={15} className="text-white" />
                          Create Problem
                          <span className="ml-auto inline-flex items-center gap-1 rounded-sm bg-white px-1.5 py-1 text-[10px] font-semibold leading-none text-[#731EFB]">
                            Recommended
                          </span>
                        </span>
                        <span className="pl-[23px] text-[12px] leading-snug text-white/90">
                          Raise one Problem to investigate the shared root cause — a batch-level hardware fault.
                        </span>
                      </button>
                    </div>
                  ) : (
                  <div className="flex items-center gap-2">
                  {!panelOnly && !detailV2 && (
                  <button
                    onClick={() => {
                      toast.success(`${openGroup.tickets.length} requests merged into ${openGroup.tickets[0]?.id ?? 'one request'}`);
                      consumeGroup(openGroup.id);
                    }}
                    style={{
                      background: 'linear-gradient(rgba(255, 255, 255, 0.14), rgba(255, 255, 255, 0.14)), linear-gradient(90deg, #4CB1FE 0%, #731EFB 41.49%, #F911E3 100%)',
                    }}
                    className="h-9 rounded px-4 text-[13px] font-medium text-white transition-all duration-200 hover:brightness-[0.92] hover:shadow-md"
                  >
                    Merge Requests
                  </button>
                  )}
                  {!detailV2 && (
                  <button
                    onClick={() => {
                      toast.success(`Problem PRB-2119 created from "${openGroup.name}"`);
                      consumeGroup(openGroup.id);
                    }}
                    style={{
                      background: 'linear-gradient(white, white) padding-box, linear-gradient(90deg, #4CB1FE 0%, #731EFB 41.49%, #F911E3 100%) border-box',
                      border: '1px solid transparent',
                    }}
                    className="h-9 rounded px-4 text-[13px] font-medium text-[#364658] transition-all duration-200 hover:text-[#3D8BD0] hover:shadow-sm"
                  >
                    Create Problem
                  </button>
                  )}
                  <button
                    onClick={() => {
                      toast(`Group "${openGroup.name}" ignored`);
                      consumeGroup(openGroup.id);
                    }}
                    className="ml-auto h-9 rounded px-3 text-[13px] font-medium text-[#64748B] transition-colors hover:bg-[#F3F4F6] hover:text-[#364658]"
                  >
                    Ignore
                  </button>
                  </div>
                  )}
                </div>
                )}
              </>
            ) : (
              /* ── Group list ── */
              <div className="min-h-0 flex-1 overflow-y-auto p-4">
                {(() => {
                  const renderCard = (g: SuggestedGroup) => (
                  <div
                    key={g.id}
                    onClick={() => setOpenGroupId(g.id)}
                    className="cursor-pointer rounded-lg border border-[#DFE5ED] bg-white p-4 transition-all hover:border-[#C9D4E0] hover:shadow-sm"
                  >
                    <div className="flex items-center gap-2">
                      <div className="min-w-0 flex-1 truncate text-[14px] font-semibold text-[#1E293B]">{g.name}</div>
                      <ConfidencePill confidence={g.confidence} />
                    </div>
                    <div className="mt-1 text-[12px] text-[#64748B]">
                      {requestItems(g).length} requests · {uniqueRequesters(g)} requesters · {g.age}
                    </div>
                    <p className="mt-2 border-l-2 border-[#DFE5ED] pl-2.5 text-[12px] leading-relaxed text-[#64748B]">{g.summary}</p>
                  </div>
                  );
                  const fresh = groups.filter((g) => g.isNew);
                  const older = groups.filter((g) => !g.isNew);
                  return (
                    <>
                      {fresh.length > 0 && (
                        <>
                          <div className="pb-2 text-[11px] font-semibold uppercase tracking-wide text-[#7B8FA5]">
                            New suggestions ({fresh.length})
                          </div>
                          <div className="space-y-3">{fresh.map(renderCard)}</div>
                        </>
                      )}
                      {older.length > 0 && (
                        <>
                          <div className={`pb-2 text-[11px] font-semibold uppercase tracking-wide text-[#7B8FA5] ${fresh.length > 0 ? 'pt-5' : ''}`}>
                            Awaiting review ({older.length})
                          </div>
                          <div className="space-y-3">{older.map(renderCard)}</div>
                        </>
                      )}
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        </div>,
        document.body,
      )
    : null;

  if (panelOnly) return <>{panel}</>;
  if (dismissed || groups.length === 0) return <>{panel}</>;

  return (
    <div className="pb-3 pl-6 pr-4">
      {/* Banner — bare gradient sparkle + title row; description, triage stat and actions share row 2. */}
      <div
        className="rounded-lg border border-[#DFE5ED] px-4 py-3"
        style={{ background: 'linear-gradient(90deg, rgba(76, 177, 254, 0.04) 0%, rgba(115, 30, 251, 0.04) 41.49%, rgba(249, 17, 227, 0.04) 100%), #FFF' }}
      >
        <div className="flex items-center gap-2">
          <AiSparkle size={16} className="flex-shrink-0" />
          <span className="text-[14px] font-semibold text-[#1E293B]">
            Clustered by AI: {groups.length} {groups.length === 1 ? 'cluster' : 'clusters'} ready to review
          </span>
          <span
            className="rounded-sm px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#731EFB]"
            style={{ background: 'linear-gradient(90deg, rgba(76, 177, 254, 0.12) 0%, rgba(115, 30, 251, 0.12) 41.49%, rgba(249, 17, 227, 0.12) 100%), #FFF' }}
          >
            Beta
          </span>
          {/* How-it-works explainer — white tooltip card (DrawerTabStrip recipe). */}
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="flex size-5 cursor-default items-center justify-center rounded text-[#9CA3AF] transition-colors hover:bg-white/70 hover:text-[#64748B]">
                <Info size={13} />
              </span>
            </TooltipTrigger>
            <TooltipContent
              side="bottom"
              align="start"
              sideOffset={6}
              hideArrow
              className="z-[10000] max-w-none border border-[#E5E7EB] bg-white p-0 text-[#364658] shadow-xl"
            >
              <div className="w-[360px] px-4 py-3.5">
                <div className="text-[13px] font-semibold text-[#1E293B]">How ServiceOps makes clusters</div>
                <p className="mt-1 text-[12px] leading-relaxed text-[#64748B]">
                  Open requests are compared on five signals. A cluster forms when enough of them line up.
                </p>
                <div className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-1.5">
                  {['Symptom text', 'Site', 'Workflow step', 'Affected asset', 'Time window'].map((sig) => (
                    <span key={sig} className="inline-flex items-center gap-2 text-[12px] font-medium text-[#364658]">
                      <span className="size-1.5 flex-shrink-0 rounded-full bg-[#731EFB]" />
                      {sig}
                    </span>
                  ))}
                </div>
                <div className="mt-3 space-y-1.5 border-t border-[#F1F5F9] pt-2.5">
                  <div className="flex items-start gap-2 text-[12px] leading-relaxed text-[#64748B]">
                    <Clock size={13} className="mt-0.5 flex-shrink-0 text-[#9CA3AF]" />
                    Runs every 15 minutes on open requests.
                  </div>
                  <div className="flex items-start gap-2 text-[12px] leading-relaxed text-[#64748B]">
                    <Shield size={13} className="mt-0.5 flex-shrink-0 text-[#9CA3AF]" />
                    Nothing is merged or closed until you confirm it.
                  </div>
                  <div className="flex items-start gap-2 text-[12px] leading-relaxed text-[#64748B]">
                    <User size={13} className="mt-0.5 flex-shrink-0 text-[#9CA3AF]" />
                    You only see clusters containing requests you have access to.
                  </div>
                </div>
                <div className="mt-2.5 text-[12px] font-medium text-[#3D8BD0]">How clustering works →</div>
              </div>
            </TooltipContent>
          </Tooltip>
        </div>
        {/* pl-6 = icon (16) + gap (8): row 2 aligns under the title text. */}
        <div className="mt-1 flex items-center gap-4 pl-6">
          <p className="min-w-0 max-w-[680px] text-[12px] leading-relaxed text-[#64748B]">
            ServiceOps watches your open requests for repeats and clusters the ones that share a cause, so you triage the pattern
            instead of the tickets.
          </p>
          <span className="h-8 w-px flex-shrink-0 bg-[#E5E7EB]" />
          <div className="flex-shrink-0">
            <div className="text-[16px] font-semibold leading-5 text-[#3D8BD0]">{triagePct}%</div>
            <div className="text-[11px] text-[#7B8FA5]">Fewer items to triage</div>
          </div>
          <div className="ml-auto flex flex-shrink-0 items-center gap-2">
            <button
              onClick={() => setDismissed(true)}
              className="h-8 rounded px-2.5 text-[12px] font-medium text-[#64748B] transition-colors hover:bg-white/70 hover:text-[#364658]"
            >
              Not now
            </button>
            <button
              onClick={() => setPanelOpen(true)}
              className="h-8 rounded bg-[#3D8BD0] px-3 text-[12px] font-medium text-white transition-colors hover:bg-[#2F7AB8]"
            >
              Review clusters ({groups.length})
            </button>
          </div>
        </div>
      </div>
      {panel}
    </div>
  );
}
