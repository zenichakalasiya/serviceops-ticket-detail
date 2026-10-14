/* VENDORED from the upstream prototype (ronak-patel-motadata/ServiceOps-Ticket-Detail-, Oct 2026 sync).
   Used ONLY by the detail pages and listings brought in from upstream — this project's own detail
   pages keep their own version in ../. Do not edit to change our pages; edit ../ instead. */
import { useState, useEffect } from 'react';
import { X, ChevronRight, Laptop, Server, AppWindow, Database, Monitor } from 'lucide-react';
import { deriveRequester } from './TicketPropertiesPanel';
import { VipPill, isVipRequester } from '../VipPill';

/* Requester profile side popup — opened from the requester name in the description header and from
 * "View more details" in the Requester Information accordion (Ticket / Problem / Change / Release).
 * Overview shows the full profile plus a short preview of the person's Requests, Assets and CIs;
 * each preview has a "View more" that jumps to the matching tab. */

type ProfileTab = 'overview' | 'requests' | 'assets' | 'ci';

const TABS: { id: ProfileTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'requests', label: 'Recent Requests' },
  { id: 'assets', label: 'Assets' },
  { id: 'ci', label: 'CI' },
];

interface RequestRow { id: string; subject: string; status: string; priority: string; created: string }
interface AssetRow { id: string; name: string; type: string; status: string }
interface CiRow { id: string; name: string; type: string; status: string }

const REQUESTS: RequestRow[] = [
  { id: 'INC-32', subject: 'My Internet Down', status: 'Open', priority: 'High', created: '26 Feb 2026' },
  { id: 'REQ-118', subject: 'Request for additional monitor', status: 'In Progress', priority: 'Medium', created: '12 Feb 2026' },
  { id: 'INC-27', subject: 'Outlook not syncing shared calendar', status: 'Resolved', priority: 'Medium', created: '02 Feb 2026' },
  { id: 'REQ-096', subject: 'VPN access for remote work', status: 'Closed', priority: 'Low', created: '18 Jan 2026' },
  { id: 'INC-19', subject: 'Laptop running slow after update', status: 'Closed', priority: 'Low', created: '04 Jan 2026' },
];

const ASSETS: AssetRow[] = [
  { id: 'AST-4021', name: 'Dell Latitude 7440', type: 'Windows Laptop', status: 'In Use' },
  { id: 'AST-3877', name: 'Dell UltraSharp U2722D 27"', type: 'Monitor', status: 'In Use' },
  { id: 'AST-3510', name: 'iPhone 14 Pro', type: 'Mobile Device', status: 'In Use' },
  { id: 'AST-2984', name: 'Logitech MX Keys Combo', type: 'Peripheral', status: 'In Use' },
];

const CIS: CiRow[] = [
  { id: 'CI-905', name: 'Email Service', type: 'Application', status: 'Operational' },
  { id: 'CI-664', name: 'FortiGate Firewall — HQ Edge', type: 'Hardware', status: 'Operational' },
  { id: 'CI-409', name: 'Salesforce CRM', type: 'Application', status: 'Operational' },
];

const statusDot = (s: string) =>
  /open/i.test(s) ? '#3D8BD0'
    : /progress/i.test(s) ? '#D97706'
      : /resolved|closed|operational|in use/i.test(s) ? '#22A06B'
        : '#6B7280';
const priorityDot = (p: string) =>
  /urgent|high/i.test(p) ? '#EF4444' : /medium/i.test(p) ? '#F59E0B' : '#22A06B';

const assetIcon = (type: string) =>
  /laptop|desktop|windows/i.test(type) ? <Laptop size={16} />
    : /monitor/i.test(type) ? <Monitor size={16} />
      : /server/i.test(type) ? <Server size={16} />
        : <AppWindow size={16} />;

interface RequesterProfilePanelProps {
  isOpen: boolean;
  onClose: () => void;
  requesterName?: string;
  /** Shown next to the email, e.g. "Requester" / "Technician". */
  role?: string;
  /** VIP is a Request-page concept — Problem/Change/Release do not surface it. */
  showVip?: boolean;
  /** The person's real address, where the caller knows it. Without this the panel derives
      one from the name, which is right for a requester the mock data never spells out and
      wrong for a colleague whose address the roster actually holds. */
  email?: string;
  /** Replaces the profile field list. Same reason: a roster knows this person's department,
      manager and site, and showing the derived stand-ins instead would print the same
      "Sales / Vikram Sethi" for all of them. */
  fields?: [string, string][];
  /** Overrides the derived avatar colour. The product reads orange as "requester" and blue
      as "technician", so a page listing staff says so rather than painting a colleague in
      the requester colour. */
  avatarColor?: string;
}

export function RequesterProfilePanel({ isOpen, onClose, requesterName, role = 'Requester', showVip = false, email, fields: fieldsProp, avatarColor }: RequesterProfilePanelProps) {
  const [tab, setTab] = useState<ProfileTab>('overview');

  // Always land on Overview when the popup is (re)opened.
  useEffect(() => { if (isOpen) setTab('overview'); }, [isOpen]);

  if (!isOpen) return null;

  const derived = deriveRequester(requesterName);
  const p = { ...derived, ...(email ? { email } : {}), ...(avatarColor ? { color: avatarColor } : {}) };
  const fields: [string, string][] = fieldsProp ?? [
    ['Name', p.name],
    ['Email', p.email],
    ['Logon Name', p.logonName],
    ['Department', 'Sales'],
    ['Manager', 'Vikram Sethi'],
    ['Location', 'India'],
    ['Time Zone', '(GMT+05:30) Kolkata'],
    ['Contact No.', '919624514391'],
    ['Authentication Source', 'Local'],
    ['Status', 'Unblocked'],
    ['other Number', '---'],
    ['Company Name', 'Motadata'],
  ];

  /* ---- row renderers, shared between the Overview previews and the full tabs ---- */
  const requestCard = (r: RequestRow) => (
    <div key={r.id} className="rounded-lg border border-[#E5E7EB] bg-white p-3 transition-all hover:border-[#3D8BD0] hover:shadow-sm">
      <div className="flex items-center gap-2">
        <span className="inline-block rounded bg-[#e8f4fd] px-2 py-0.5 text-[12px] font-semibold text-[#3D8BD0]">{r.id}</span>
        <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-[#364658]">{r.subject}</span>
      </div>
      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-[#64748B]">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-full flex-shrink-0" style={{ backgroundColor: statusDot(r.status) }} />{r.status}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-full flex-shrink-0" style={{ backgroundColor: priorityDot(r.priority) }} />{r.priority}
        </span>
        <span>{r.created}</span>
      </div>
    </div>
  );

  const assetCard = (a: AssetRow | CiRow) => (
    <div key={a.id} className="flex items-center gap-3 rounded-lg border border-[#E5E7EB] bg-white p-3 transition-all hover:border-[#3D8BD0] hover:shadow-sm">
      <span className="flex size-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#EAF3FB] text-[#3D8BD0]">
        {a.id.startsWith('CI-') ? <Database size={16} /> : assetIcon(a.type)}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="inline-block rounded bg-[#e8f4fd] px-2 py-0.5 text-[12px] font-semibold text-[#3D8BD0]">{a.id}</span>
          <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-[#364658]">{a.name}</span>
        </div>
        <div className="mt-1 flex items-center gap-x-3 text-[12px] text-[#64748B]">
          <span>{a.type}</span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full flex-shrink-0" style={{ backgroundColor: statusDot(a.status) }} />{a.status}
          </span>
        </div>
      </div>
    </div>
  );

  /** Overview preview block: title + count, up to `max` cards, and a "View more" that opens the tab. */
  const preview = (title: string, count: number, max: number, cards: React.ReactNode, goTo: ProfileTab) => (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h4 className="text-[13px] font-semibold text-[#364658]">{title}</h4>
          <span className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#EEF2F6] px-1 text-[11px] font-semibold text-[#64748B]">{count}</span>
        </div>
        {count > max && (
          <button onClick={() => setTab(goTo)} className="inline-flex items-center gap-1 text-[13px] font-medium text-[#3D8BD0] hover:underline">
            View more <ChevronRight size={14} />
          </button>
        )}
      </div>
      <div className="space-y-2">{cards}</div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-end bg-black/50">
      <div className="flex h-full w-[720px] max-w-[95vw] flex-col bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#DFE5ED] px-5 py-3">
          <h3 className="truncate text-[16px] font-semibold text-[#364658]">{p.name}</h3>
          <button onClick={onClose} className="flex size-8 flex-shrink-0 items-center justify-center rounded transition-colors hover:bg-[#F3F4F6] text-[#7B8FA5] hover:text-[#364658]"><X size={18} /></button>
        </div>

        {/* Identity */}
        <div className="flex items-start gap-4 px-5 py-4">
          <div className="flex size-16 flex-shrink-0 items-center justify-center rounded-lg text-[22px] font-semibold text-white" style={{ backgroundColor: p.color }}>
            {p.initials}
          </div>
          <div className="min-w-0 pt-1">
            <div className="flex items-center gap-2">
              <span className="text-[18px] font-semibold text-[#364658]">{p.name}</span>
              {showVip && isVipRequester(p.name) && <VipPill />}
            </div>
            <div className="mt-0.5 text-[13px]">
              <a href={`mailto:${p.email}`} className="text-[#3D8BD0] hover:underline">{p.email}</a>
              <span className="ml-1.5 text-[#7B8FA5]">( {role} )</span>
            </div>
          </div>
        </div>

        {/* Tabs — same underline treatment as the record's content tabs (Conversation / Tasks / …) */}
        <div className="border-b border-[#e5e7eb]">
          <div className="flex items-center gap-2.5 px-5">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-2 py-3 text-[14px] font-medium whitespace-nowrap flex items-center gap-1.5 border-b-2 transition-colors ${tab === t.id ? 'text-[#3D8BD0] border-[#3D8BD0]' : 'text-[#6b7280] border-transparent hover:bg-[#F5F7FA] hover:text-[#364658] hover:border-[#CBD5E1]'}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {tab === 'overview' && (
            <div className="space-y-6">
              {/* Full profile */}
              <div className="overflow-hidden rounded-lg border border-[#E5E7EB]">
                {fields.map(([label, value], i) => (
                  <div key={label} className={`flex items-start gap-4 px-4 py-2.5 ${i > 0 ? 'border-t border-[#F0F2F5]' : ''}`}>
                    <span className="w-[190px] flex-shrink-0 text-[13px] text-[#64748B]">{label}</span>
                    <span className={`min-w-0 flex-1 break-words text-[13px] ${value === '---' ? 'text-[#9CA3AF]' : 'text-[#364658]'}`}>
                      {label === 'Email' ? <a href={`mailto:${value}`} className="text-[#3D8BD0] hover:underline">{value}</a> : value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Previews */}
              {preview('Recent Requests', REQUESTS.length, 3, REQUESTS.slice(0, 3).map(requestCard), 'requests')}
              {preview('Assets', ASSETS.length, 3, ASSETS.slice(0, 3).map(assetCard), 'assets')}
              {preview('CI', CIS.length, 2, CIS.slice(0, 2).map(assetCard), 'ci')}
            </div>
          )}

          {tab === 'requests' && <div className="space-y-2">{REQUESTS.map(requestCard)}</div>}
          {tab === 'assets' && <div className="space-y-2">{ASSETS.map(assetCard)}</div>}
          {tab === 'ci' && <div className="space-y-2">{CIS.map(assetCard)}</div>}
        </div>
      </div>
    </div>
  );
}
