import { useState } from 'react';
import {
  ChevronRight, Lock, Server, Boxes, CalendarClock, SlidersHorizontal, Search, Filter, Plus,
  Play, MoreVertical, Check, X, Trash2, ChevronDown, ListFilter,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  ADMIN_CIS, UNENROLLED_CIS, AUTO_ENROL_RULES, SCHEDULE_POLICIES, RETENTION_EXCEPTIONS,
  RETENTION_DEFAULT, LICENSE_SEATS_TOTAL, VERSION_OPTIONS, DAY_OPTIONS, SCHEDULE_TYPES,
  FREQUENCIES, TIMEZONES,
  seatsAvailable, inactiveCount, agentScanned, manuallyIngested, byRule, byHand,
} from './bomAdminData';
import type { AdminCi } from './bomAdminData';
import { TargetingCards, targetedCis, emptyTargeting, targetingSummary } from './AdminBomTargeting';
import type { Targeting } from './AdminBomTargeting';

/* BOM Management — the admin surface that gates everything Component Intelligence can show.
 *
 * Licensing decides which CIs take part, Scheduler decides when they are scanned, Retention
 * decides how long their versions survive. Same flow and hierarchy as the source prototype,
 * rebuilt on the ServiceOps design system. */

export type BomAdminScreen = 'landing' | 'licensing' | 'scheduler' | 'retention';

const btnSecondary = 'inline-flex h-8 items-center gap-1.5 rounded border border-[#DFE5ED] bg-white px-3 text-[13px] font-medium text-[#364658] transition-colors hover:bg-[#F5F7FA]';
const btnPrimary = 'inline-flex h-8 items-center gap-1.5 rounded bg-[#3D8BD0] px-3 text-[13px] font-medium text-white transition-colors hover:bg-[#3479b5]';
const inputCls = 'h-9 w-full rounded border border-[#d1d5db] bg-white px-3 text-[13px] text-[#364658] placeholder:text-[#9ca3af] focus:border-[#3D8BD0] focus:outline-none focus:ring-1 focus:ring-[#3D8BD0]';

/** "Daily" → "day", so the helper line reads "Run every day", not "Run every dai". */
const FREQ_NOUN: Record<string, string> = { Daily: 'day', Weekly: 'week', Monthly: 'month' };

/** Breadcrumb + title + subtitle, identical on every screen in the module. */
function PageHead({ crumbs, onCrumb, title, subtitle }: {
  crumbs: { label: string; to?: BomAdminScreen }[];
  onCrumb: (s: BomAdminScreen) => void;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-1.5 text-[13px]">
        {crumbs.map((c, i) => (
          <span key={c.label} className="inline-flex items-center gap-1.5">
            {c.to ? (
              <button onClick={() => onCrumb(c.to!)} className="text-[#3D8BD0] transition-colors hover:underline">{c.label}</button>
            ) : (
              <span className="text-[#64748B]">{c.label}</span>
            )}
            {i < crumbs.length - 1 && <ChevronRight size={14} className="text-[#9CA3AF]" />}
          </span>
        ))}
      </div>
      <h1 className="mt-1.5 text-[16px] font-semibold text-[#364658]">{title}</h1>
      <p className="mt-1 max-w-[760px] text-[13px] leading-[1.6] text-[#7B8FA5]">{subtitle}</p>
    </div>
  );
}

/** The bordered stat strip used at the top of Scheduler and Retention. */
function StatStrip({ cells }: { cells: { label: string; value: React.ReactNode; sub?: React.ReactNode }[] }) {
  return (
    <div className="mb-4 flex flex-wrap overflow-hidden rounded-xl border border-[#E5E7EB] bg-white">
      {cells.map((c, i) => (
        <div key={c.label} className={`min-w-[200px] flex-1 px-5 py-3.5 ${i > 0 ? 'border-l border-[#E5E7EB]' : ''}`}>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-[#7B8FA5]">{c.label}</div>
          <div className="mt-1 text-[15px] text-[#364658]">
            <span className="text-[18px] font-semibold">{c.value}</span>
            {c.sub && <span className="ml-1.5 text-[13px] text-[#7B8FA5]">{c.sub}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  // Anchored — an unanchored /active/ also matches "Inactive".
  const on = /^(active|enabled)$/i.test(status);
  return (
    <span className="inline-flex items-center gap-1.5" style={{ color: on ? '#22A06B' : '#64748B' }}>
      <span className="size-2 rounded-full" style={{ backgroundColor: on ? '#22C55E' : '#94A3B8' }} />
      {status}
    </span>
  );
}

function Select({ value, options, onChange, width = 'w-[150px]' }: { value: string; options: string[]; onChange: (v: string) => void; width?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`relative ${width} flex-shrink-0`}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-9 w-full items-center justify-between gap-2 rounded border border-[#DFE5ED] bg-white px-3 text-left text-[13px] text-[#364658] transition-colors hover:border-[#3D8BD0]"
      >
        <span className="truncate">{value}</span>
        <ChevronDown size={15} className={`flex-shrink-0 text-[#7B8FA5] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-50 mt-1 max-h-[240px] w-full overflow-y-auto rounded-lg border border-[#DFE5ED] bg-white py-1 shadow-lg">
            {options.map((o) => (
              <button
                key={o}
                onClick={() => { onChange(o); setOpen(false); }}
                className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-[13px] transition-colors ${
                  o === value ? 'bg-[#F5FAFF] font-medium text-[#3D8BD0]' : 'text-[#364658] hover:bg-[#F9FAFB]'
                }`}
              >
                <span className="truncate">{o}</span>
                {o === value && <Check size={15} className="flex-shrink-0 text-[#3D8BD0]" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ══ Landing ════════════════════════════════════════════════════════════════

function Landing({ go }: { go: (s: BomAdminScreen) => void }) {
  const CARDS: { screen: BomAdminScreen; icon: React.ReactNode; title: string; desc: string }[] = [
    { screen: 'licensing', icon: <Lock size={18} />, title: 'BOM Licensing', desc: 'Enrol CIs for BOM generation — start here; decide participation by usage.' },
    { screen: 'scheduler', icon: <CalendarClock size={18} />, title: 'BOM Scheduler', desc: 'Auto-generate SBOMs for enrolled CIs on a schedule.' },
    { screen: 'retention', icon: <SlidersHorizontal size={18} />, title: 'BOM Retention', desc: 'How many living-SBOM versions to keep per CI, and for how long.' },
  ];
  return (
    <>
      <PageHead
        crumbs={[{ label: 'BOM' }, { label: 'Admin' }]}
        onCrumb={go}
        title="BOM Administration"
        subtitle="Decide which configuration items take part in BOM generation, when they are scanned, and how long their versions are kept. Everything Component Intelligence can show is gated here."
      />
      <div className="rounded-xl border border-[#E5E7EB] bg-white">
        <div className="flex items-center gap-3 px-4 py-3.5">
          <span className="flex size-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#EBF5FF] text-[#3D8BD0]"><Boxes size={18} /></span>
          <div>
            <div className="text-[15px] font-semibold text-[#364658]">BOM Management</div>
            <div className="mt-0.5 text-[13px] text-[#7B8FA5]">Schedule automatic BOM generation and manage BOM policies for connected devices.</div>
          </div>
        </div>
        <div className="border-t border-[#F0F2F5] p-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {CARDS.map((c) => (
              <button
                key={c.title}
                onClick={() => go(c.screen)}
                /* flex-col so a one-line description doesn't get centred against a taller
                   neighbour — Chrome vertically centres button content by default. */
                className="group flex flex-col items-start rounded-lg border border-[#E5E7EB] bg-white p-3.5 text-left transition-all hover:border-[#3D8BD0] hover:shadow-[0_1px_2px_rgba(16,24,40,0.04),0_2px_8px_rgba(16,24,40,0.06)]"
              >
                <span className="flex items-center gap-2.5">
                  <span className="flex size-8 flex-shrink-0 items-center justify-center rounded bg-[#F1F5F9] text-[#7B8FA5] transition-colors group-hover:bg-[#EBF5FF] group-hover:text-[#3D8BD0]">{c.icon}</span>
                  <span className="text-[14px] font-medium text-[#364658]">{c.title}</span>
                </span>
                <span className="mt-2 block text-[12px] leading-[1.5] text-[#7B8FA5]">{c.desc}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

// ══ Licensing ══════════════════════════════════════════════════════════════

function Licensing({ go }: { go: (s: BomAdminScreen) => void }) {
  const [tab, setTab] = useState<'manual' | 'auto'>('manual');
  const [cis, setCis] = useState<AdminCi[]>(ADMIN_CIS);
  const [q, setQ] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [rules, setRules] = useState(AUTO_ENROL_RULES);

  const manual = cis.filter((c) => c.enrolment === 'manual');
  const auto = cis.filter((c) => c.enrolment === 'auto');
  const rows = (tab === 'manual' ? manual : auto).filter((c) =>
    !q.trim() || [c.id, c.hostName, c.osName, c.ciType, c.ipAddress].some((f) => f.toLowerCase().includes(q.trim().toLowerCase())));

  const seats = seatsAvailable(cis);
  const pct = Math.min(100, (cis.length / LICENSE_SEATS_TOTAL) * 100);
  const low = seats <= 2;

  const remove = (id: string) => {
    setCis((p) => p.filter((c) => c.id !== id));
    toast.error(`${id} removed from BOM licensing — its seat is released`);
  };

  return (
    <>
      <PageHead
        crumbs={[{ label: 'BOM' }, { label: 'Admin', to: 'landing' }, { label: 'Licensing' }]}
        onCrumb={go}
        title="BOM Licensing"
        subtitle="Enrol CIs to generate SBOM, CBOM and AI BOM. Each enrolled CI — whether agent-scanned or manually ingested — consumes one license seat."
      />

      {/* Three KPI cards */}
      <div className="mb-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-4">
          <div className="flex items-center gap-2 text-[13px] font-medium text-[#364658]"><Lock size={15} className="text-[#7B8FA5]" /> Seat pressure</div>
          <div className={`mt-2 text-[32px] font-semibold leading-none ${low ? 'text-[#D97706]' : 'text-[#364658]'}`}>{seats}</div>
          <div className="mt-1 text-[13px] text-[#7B8FA5]">seats available</div>
          <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-[#E5E7EB]">
            <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: low ? '#F59E0B' : '#22C55E' }} />
          </div>
          <div className="mt-2 text-[12px] text-[#7B8FA5]">{cis.length} consumed of {LICENSE_SEATS_TOTAL} total{low ? ' · running low' : ''}</div>
        </div>

        <div className="rounded-xl border border-[#E5E7EB] bg-white p-4">
          <div className="flex items-center gap-2 text-[13px] font-medium text-[#364658]"><Server size={15} className="text-[#7B8FA5]" /> Enrolled CIs</div>
          <div className="mt-2 text-[32px] font-semibold leading-none text-[#364658]">{cis.length}</div>
          <div className="mt-1 text-[13px] text-[#7B8FA5]">consuming a seat</div>
          <div className="mt-2.5 text-[13px] text-[#7B8FA5]">
            <span className="font-semibold text-[#364658]">{agentScanned(cis)}</span> agent-scanned
            <span className="mx-1.5">·</span>
            <span className="font-semibold text-[#364658]">{manuallyIngested(cis)}</span> manually ingested
          </div>
          {inactiveCount(cis) > 0 && (
            <div className="mt-1.5 text-[12px] text-[#D97706]">{inactiveCount(cis)} inactive — still holding a seat</div>
          )}
        </div>

        <div className="rounded-xl border border-[#E5E7EB] bg-white p-4">
          <div className="flex items-center gap-2 text-[13px] font-medium text-[#364658]"><Boxes size={15} className="text-[#7B8FA5]" /> Source mix</div>
          <div className="mt-2 text-[32px] font-semibold leading-none text-[#364658]">{cis.length}</div>
          <div className="mt-1 text-[13px] text-[#7B8FA5]">how they got enrolled</div>
          <div className="mt-2.5 text-[13px] text-[#7B8FA5]">
            <span className="font-semibold text-[#364658]">{byRule(cis)}</span> by rule
            <span className="mx-1.5">·</span>
            <span className="font-semibold text-[#364658]">{byHand(cis)}</span> by hand
          </div>
          <div className="mt-1.5 text-[12px] text-[#7B8FA5]">{rules.filter((r) => r.enabled).length} of {rules.length} rules enabled</div>
        </div>
      </div>

      {/* Tabs + table */}
      <div className="rounded-xl border border-[#E5E7EB] bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e5e7eb] px-4">
          <div className="flex items-center gap-2.5">
            {([['manual', 'Manual Enrolment', manual.length], ['auto', 'Auto-enrol', auto.length]] as const).map(([id, label, n]) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex items-center gap-1.5 whitespace-nowrap border-b-2 px-2 py-3 text-[14px] font-medium transition-colors ${
                  tab === id ? 'border-[#3D8BD0] text-[#3D8BD0]' : 'border-transparent text-[#6b7280] hover:border-[#CBD5E1] hover:text-[#364658]'
                }`}
              >
                {label}
                <span className={`rounded px-1 py-0.5 text-[12px] font-medium ${tab === id ? 'bg-[#E8F4FD] text-[#3D8BD0]' : 'bg-[#E5E7EB] text-[#364658]'}`}>{n}</span>
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2 py-2">
            <div className="relative w-[220px]">
              <input type="text" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search CIs..." className="h-8 w-full rounded border border-[#d1d5db] bg-white pl-8 pr-3 text-[13px] text-[#364658] placeholder:text-[#9ca3af] focus:border-[#3D8BD0] focus:outline-none focus:ring-1 focus:ring-[#3D8BD0]" />
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9ca3af]" size={15} />
            </div>
            <button className={btnSecondary}><Filter size={15} className="text-[#7B8FA5]" /> Filter</button>
            {tab === 'auto' && (
              <button onClick={() => setShowRules(true)} className={btnSecondary}>
                <ListFilter size={15} className="text-[#7B8FA5]" /> View Rules
                <span className="rounded bg-[#E5E7EB] px-1 py-0.5 text-[12px] font-medium text-[#364658]">{rules.length}</span>
              </button>
            )}
            <button onClick={() => setShowAdd(true)} className={btnPrimary}>
              <Plus size={15} /> {tab === 'manual' ? 'Add manually' : 'New Rule'}
            </button>
          </div>
        </div>

        {tab === 'auto' && (
          <div className="flex flex-wrap border-b border-[#F0F2F5]">
            {[
              { label: 'Auto-enrolled CIs', value: auto.length, sub: `of ${cis.length} enrolled` },
              { label: 'Rules', value: rules.length, sub: `${rules.filter((r) => r.enabled).length} active · ${rules.filter((r) => !r.enabled).length} disabled` },
              { label: 'Waiting to enrol', value: 0, sub: '' },
            ].map((c, i) => (
              <div key={c.label} className={`min-w-[200px] flex-1 px-5 py-3 ${i > 0 ? 'border-l border-[#F0F2F5]' : ''}`}>
                <div className="text-[11px] font-semibold uppercase tracking-wide text-[#7B8FA5]">{c.label}</div>
                <div className="mt-0.5 text-[15px] text-[#364658]">
                  <span className="text-[17px] font-semibold">{c.value}</span>
                  {c.sub && <span className="ml-1.5 text-[13px] text-[#7B8FA5]">{c.sub}</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px]">
            <thead className="border-b border-[#e5e7eb]">
              <tr>
                <th className="w-[40px] px-4 py-2.5 text-left">
                  <input type="checkbox" className="h-3.5 w-3.5 cursor-pointer rounded border-[#d1d5db] text-[#3D8BD0] focus:ring-[#3D8BD0] focus:ring-offset-0" />
                </th>
                {['CI ID', 'Host Name', 'CI Type', 'IP Address', 'Origin', 'Status', 'Last seen', 'Actions'].map((h) => (
                  <th key={h} className="whitespace-nowrap px-4 py-2.5 text-left text-[12px] font-semibold tracking-wider text-[#364658]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e7eb]">
              {rows.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-12 text-center text-[13px] text-[#9CA3AF]">No CIs in this list.</td></tr>
              ) : rows.map((c) => (
                <tr key={c.id} className="transition-colors hover:bg-[#f9fafb]">
                  <td className="px-4 py-3">
                    <input type="checkbox" className="h-3.5 w-3.5 cursor-pointer rounded border-[#d1d5db] text-[#3D8BD0] focus:ring-[#3D8BD0] focus:ring-offset-0" />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-[13px] font-medium text-[#364658]">{c.id}</td>
                  <td className="px-4 py-3">
                    <div className="text-[13px] text-[#364658]">{c.hostName}</div>
                    <div className="text-[12px] text-[#7B8FA5]">{c.osName}</div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3"><span className="rounded-sm bg-[#F1F5F9] px-2 py-0.5 text-[12px] text-[#475467]">{c.ciType}</span></td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-[13px] text-[#364658]">{c.ipAddress}</td>
                  <td className="whitespace-nowrap px-4 py-3"><span className="rounded-sm bg-[#F1F5F9] px-2 py-0.5 text-[12px] text-[#475467]">{c.origin}</span></td>
                  <td className="whitespace-nowrap px-4 py-3 text-[13px]"><StatusDot status={c.status} /></td>
                  <td className="whitespace-nowrap px-4 py-3 text-[13px] text-[#7B8FA5]">{c.lastSeen}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <button onClick={() => remove(c.id)} className={btnSecondary}>Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AddCisDrawer
        isOpen={showAdd && tab === 'manual'}
        onClose={() => setShowAdd(false)}
        seats={seats}
        onAdd={(picked) => {
          setCis((p) => [...p, ...UNENROLLED_CIS.filter((c) => picked.includes(c.id))]);
          setShowAdd(false);
          toast.success(`${picked.length} CI${picked.length === 1 ? '' : 's'} enrolled`);
        }}
      />
      <NewRuleDrawer
        isOpen={showAdd && tab === 'auto'}
        onClose={() => setShowAdd(false)}
        onSave={(name, summary, matches) => {
          setRules((p) => [...p, { id: `AR-${p.length + 1}`, name, enabled: true, matches, summary }]);
          setShowAdd(false);
          toast.success(`Rule "${name}" created`);
        }}
      />
      <ViewRulesDrawer
        isOpen={showRules}
        onClose={() => setShowRules(false)}
        rules={rules}
        onToggle={(id) => setRules((p) => p.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)))}
      />
    </>
  );
}

function AddCisDrawer({ isOpen, onClose, seats, onAdd }: { isOpen: boolean; onClose: () => void; seats: number; onAdd: (ids: string[]) => void }) {
  const [picked, setPicked] = useState<string[]>([]);
  if (!isOpen) return null;
  const over = picked.length > seats;
  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-end bg-black/40">
      <div className="flex h-full w-[720px] max-w-[95vw] flex-col bg-white shadow-xl">
        <div className="flex items-center justify-between gap-3 border-b border-[#DFE5ED] px-5 py-3">
          <div>
            <h3 className="text-[16px] font-semibold text-[#364658]">Add CIs manually</h3>
            <p className="mt-0.5 text-[13px] text-[#7B8FA5]">Each CI you enrol consumes one license seat.</p>
          </div>
          <button onClick={onClose} className="flex size-8 items-center justify-center rounded text-[#7B8FA5] transition-colors hover:bg-[#F3F4F6] hover:text-[#364658]"><X size={18} /></button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {over && (
            <div className="mb-3 rounded border border-[#FEE4E2] bg-[#FFFBFA] px-3 py-2 text-[13px] text-[#DC2626]">
              {picked.length} selected but only {seats} seat{seats === 1 ? '' : 's'} available — remove some, or free seats first.
            </div>
          )}
          <table className="w-full">
            <thead className="border-b border-[#e5e7eb]">
              <tr>
                <th className="w-[40px] px-3 py-2.5" />
                {['CI ID', 'Host Name', 'CI Type', 'IP Address'].map((h) => (
                  <th key={h} className="whitespace-nowrap px-3 py-2.5 text-left text-[12px] font-semibold tracking-wider text-[#364658]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e7eb]">
              {UNENROLLED_CIS.map((c) => (
                <tr key={c.id} className="cursor-pointer transition-colors hover:bg-[#f9fafb]" onClick={() => setPicked((p) => p.includes(c.id) ? p.filter((x) => x !== c.id) : [...p, c.id])}>
                  <td className="px-3 py-3">
                    <input type="checkbox" checked={picked.includes(c.id)} onChange={() => {}} className="h-3.5 w-3.5 cursor-pointer rounded border-[#d1d5db] text-[#3D8BD0] focus:ring-[#3D8BD0] focus:ring-offset-0" />
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-[13px] font-medium text-[#364658]">{c.id}</td>
                  <td className="px-3 py-3">
                    <div className="text-[13px] text-[#364658]">{c.hostName}</div>
                    <div className="text-[12px] text-[#7B8FA5]">{c.osName}</div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3"><span className="rounded-sm bg-[#F1F5F9] px-2 py-0.5 text-[12px] text-[#475467]">{c.ciType}</span></td>
                  <td className="whitespace-nowrap px-3 py-3 font-mono text-[13px] text-[#364658]">{c.ipAddress}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-[#DFE5ED] px-5 py-3">
          <span className="text-[13px] text-[#7B8FA5]"><span className="font-semibold text-[#364658]">{picked.length}</span> selected · {seats} seat{seats === 1 ? '' : 's'} available</span>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className={btnSecondary}>Cancel</button>
            <button onClick={() => onAdd(picked)} disabled={!picked.length || over} className={`${btnPrimary} disabled:cursor-not-allowed disabled:bg-[#CBD5E1]`}>
              <Check size={15} /> Enrol {picked.length || ''}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function NewRuleDrawer({ isOpen, onClose, onSave }: {
  isOpen: boolean; onClose: () => void; onSave: (name: string, summary: string, matches: number) => void;
}) {
  const [name, setName] = useState('');
  const [t, setT] = useState<Targeting>(emptyTargeting());
  if (!isOpen) return null;
  const matched = targetedCis(t);
  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-end bg-black/40">
      <div className="flex h-full w-[820px] max-w-[95vw] flex-col bg-white shadow-xl">
        <div className="flex items-center justify-between gap-3 border-b border-[#DFE5ED] px-5 py-3">
          <div>
            <h3 className="text-[16px] font-semibold text-[#364658]">New auto-enrol rule</h3>
            <p className="mt-0.5 text-[13px] text-[#7B8FA5]">CIs matching this rule are enrolled automatically as they appear.</p>
          </div>
          <button onClick={onClose} className="flex size-8 items-center justify-center rounded text-[#7B8FA5] transition-colors hover:bg-[#F3F4F6] hover:text-[#364658]"><X size={18} /></button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <label className="mb-1.5 block text-[13px] font-medium text-[#364658]">Rule name <span className="text-[#DC2626]">*</span></label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. All Windows Servers" className={inputCls} />
          <div className="mb-2 mt-5 text-[13px] font-medium text-[#364658]">Which CIs should this rule enrol? <span className="font-normal text-[#7B8FA5]">— by hand, by rule, or both</span></div>
          <TargetingCards value={t} onChange={setT} dynamicCopy="Every CI matching your conditions is enrolled automatically — and stays enrolled as new CIs appear." />
        </div>
        <div className="flex items-center justify-between border-t border-[#DFE5ED] px-5 py-3">
          <span className="text-[13px] text-[#7B8FA5]">Enrols <span className="font-semibold text-[#364658]">{matched.length}</span> of {ADMIN_CIS.length} CIs</span>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className={btnSecondary}>Cancel</button>
            <button
              onClick={() => name.trim() && onSave(name.trim(), targetingSummary(t), matched.length)}
              disabled={!name.trim()}
              className={`${btnPrimary} disabled:cursor-not-allowed disabled:bg-[#CBD5E1]`}
            >
              <Check size={15} /> Create rule
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ViewRulesDrawer({ isOpen, onClose, rules, onToggle }: {
  isOpen: boolean; onClose: () => void; rules: typeof AUTO_ENROL_RULES; onToggle: (id: string) => void;
}) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-end bg-black/40">
      <div className="flex h-full w-[720px] max-w-[95vw] flex-col bg-white shadow-xl">
        <div className="flex items-center justify-between gap-3 border-b border-[#DFE5ED] px-5 py-3">
          <div>
            <h3 className="text-[16px] font-semibold text-[#364658]">Auto-enrol rules</h3>
            <p className="mt-0.5 text-[13px] text-[#7B8FA5]">Rules run continuously — a disabled rule stops enrolling but keeps what it already enrolled.</p>
          </div>
          <button onClick={onClose} className="flex size-8 items-center justify-center rounded text-[#7B8FA5] transition-colors hover:bg-[#F3F4F6] hover:text-[#364658]"><X size={18} /></button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <div className="space-y-2">
            {rules.map((r) => (
              <div key={r.id} className="flex items-center gap-3 rounded-lg border border-[#E5E7EB] bg-white px-3.5 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold text-[#364658]">{r.name}</span>
                    <span className="font-mono text-[11px] text-[#9CA3AF]">{r.id}</span>
                  </div>
                  <div className="mt-0.5 text-[12px] text-[#7B8FA5]">{r.summary} · enrolled {r.matches} CI{r.matches === 1 ? '' : 's'}</div>
                </div>
                <StatusDot status={r.enabled ? 'Active' : 'Disabled'} />
                <button onClick={() => onToggle(r.id)} className={btnSecondary}>{r.enabled ? 'Disable' : 'Enable'}</button>
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-end border-t border-[#DFE5ED] px-5 py-3">
          <button onClick={onClose} className={btnSecondary}>Close</button>
        </div>
      </div>
    </div>
  );
}

// ══ Scheduler ══════════════════════════════════════════════════════════════

function Scheduler({ go }: { go: (s: BomAdminScreen) => void }) {
  const [autoOn, setAutoOn] = useState(true);
  const [policies, setPolicies] = useState(SCHEDULE_POLICIES);
  const [q, setQ] = useState('');
  const [showNew, setShowNew] = useState(false);

  const rows = policies.filter((p) => !q.trim() || p.name.toLowerCase().includes(q.trim().toLowerCase()));
  const active = policies.filter((p) => p.status === 'Active').length;

  return (
    <>
      <PageHead
        crumbs={[{ label: 'BOM' }, { label: 'Admin', to: 'landing' }, { label: 'Scheduler' }]}
        onCrumb={go}
        title="BOM Scheduler"
        subtitle="Automatically generate SBOMs and CBOMs for enrolled Configuration Items based on scheduled policies."
      />

      <StatStrip cells={[
        { label: 'Active', value: active, sub: `of ${policies.length} policies` },
        { label: 'Disabled', value: policies.length - active, sub: 'not running' },
        { label: 'Next run', value: 'Tomorrow', sub: '02:00' },
        { label: 'Coverage', value: ADMIN_CIS.length, sub: `of ${ADMIN_CIS.length} enrolled CIs` },
      ]} />

      {/* Master switch */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#E5E7EB] bg-white px-4 py-3.5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setAutoOn((v) => !v)}
            className={`flex h-6 w-11 flex-shrink-0 items-center rounded-full px-0.5 transition-colors ${autoOn ? 'bg-[#3D8BD0]' : 'bg-[#CBD5E1]'}`}
          >
            <span className={`size-5 rounded-full bg-white transition-transform ${autoOn ? 'translate-x-5' : ''}`} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-semibold text-[#364658]">Automatic BOM Generation</span>
              <span className={`rounded-sm px-2 py-0.5 text-[12px] font-medium ${autoOn ? 'bg-[#ECFDF3] text-[#22A06B]' : 'bg-[#F1F5F9] text-[#64748B]'}`}>
                {autoOn ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <div className="mt-0.5 text-[13px] text-[#7B8FA5]">Policies below run at their set times for the CIs they cover.</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[12px] text-[#7B8FA5]">Last scheduler execution</div>
          <div className="text-[13px] font-medium text-[#364658]">Today · 02:00 IST</div>
        </div>
      </div>

      {/* Policies */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-[15px] font-semibold text-[#364658]">Schedule Policies</h2>
          <span className="inline-flex h-[20px] min-w-[20px] items-center justify-center rounded-full bg-[#EEF2F6] px-1.5 text-[12px] font-semibold text-[#64748B]">{policies.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-[220px]">
            <input type="text" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search policies..." className="h-8 w-full rounded border border-[#d1d5db] bg-white pl-8 pr-3 text-[13px] text-[#364658] placeholder:text-[#9ca3af] focus:border-[#3D8BD0] focus:outline-none focus:ring-1 focus:ring-[#3D8BD0]" />
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9ca3af]" size={15} />
          </div>
          <button className={btnSecondary}><Filter size={15} className="text-[#7B8FA5]" /> Filter</button>
          <button onClick={() => setShowNew(true)} className={btnPrimary}><Plus size={15} /> New schedule</button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#E5E7EB] bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className="border-b border-[#e5e7eb]">
              <tr>
                {['Policy', 'Coverage', 'Trigger', 'Next Run', 'Status', ''].map((h) => (
                  <th key={h} className="whitespace-nowrap px-4 py-2.5 text-left text-[12px] font-semibold tracking-wider text-[#364658]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e7eb]">
              {rows.map((p) => (
                <tr key={p.id} className="transition-colors hover:bg-[#f9fafb]">
                  <td className="px-4 py-3">
                    <div className={`text-[13px] font-medium ${p.status === 'Disabled' ? 'text-[#7B8FA5]' : 'text-[#364658]'}`}>{p.name}</div>
                    <div className="font-mono text-[11px] text-[#9CA3AF]">{p.id}</div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <button className="text-[13px] font-medium text-[#3D8BD0] hover:underline">{p.coverage} Enrolled CI{p.coverage === 1 ? '' : 's'}</button>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <div className="text-[13px] text-[#364658]">{p.trigger}</div>
                    <div className="text-[12px] text-[#7B8FA5]">{p.triggerTime}</div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <div className="text-[13px] font-medium text-[#364658]">{p.nextRun}</div>
                    <div className="text-[12px] text-[#7B8FA5]">{p.nextRunTime}</div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-[13px]"><StatusDot status={p.status} /></td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <button onClick={() => toast.success(`${p.name} — run started`)} className={btnSecondary}><Play size={13} /> Run Now</button>
                      <button onClick={() => toast.success(`Editing ${p.name}`)} className={btnSecondary}>Edit</button>
                      <button
                        onClick={() => setPolicies((ps) => ps.map((x) => (x.id === p.id ? { ...x, status: x.status === 'Active' ? 'Disabled' : 'Active' } : x)))}
                        className="flex size-8 items-center justify-center rounded border border-[#DFE5ED] bg-white text-[#7B8FA5] transition-colors hover:bg-[#F5F7FA] hover:text-[#364658]"
                        title={p.status === 'Active' ? 'Disable' : 'Enable'}
                      ><MoreVertical size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <NewScheduleDrawer
        isOpen={showNew}
        onClose={() => setShowNew(false)}
        onSave={(name, trigger, time) => {
          setPolicies((ps) => [...ps, {
            id: `BS-${ps.length + 1}`, name: name || `Schedule ${ps.length + 1}`, coverage: 0,
            trigger, triggerTime: time, nextRun: 'Tomorrow', nextRunTime: time, status: 'Active',
          }]);
          setShowNew(false);
          toast.success('Schedule created');
        }}
      />
    </>
  );
}

function NewScheduleDrawer({ isOpen, onClose, onSave }: {
  isOpen: boolean; onClose: () => void; onSave: (name: string, trigger: string, time: string) => void;
}) {
  const [type, setType] = useState(SCHEDULE_TYPES[0]);
  const [freq, setFreq] = useState(FREQUENCIES[0]);
  const [time, setTime] = useState('23:00');
  const [tz, setTz] = useState(TIMEZONES[0]);
  const [name, setName] = useState('');
  const [t, setT] = useState<Targeting>(emptyTargeting());
  if (!isOpen) return null;
  const scanned = targetedCis(t);
  const tzShort = tz.match(/\(([^)]+)\)/)?.[1] ?? '';

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-end bg-black/40">
      <div className="flex h-full w-[860px] max-w-[95vw] flex-col bg-white shadow-xl">
        <div className="flex items-center justify-between gap-3 border-b border-[#DFE5ED] px-5 py-3">
          <div className="min-w-0">
            <h3 className="text-[16px] font-semibold text-[#364658]">Schedule Scan</h3>
            <p className="mt-0.5 text-[13px] text-[#7B8FA5]">Choose when BOM scans should run and which CIs should be included — pick CIs manually or let rules include them automatically.</p>
          </div>
          <button onClick={onClose} className="flex size-8 flex-shrink-0 items-center justify-center rounded text-[#7B8FA5] transition-colors hover:bg-[#F3F4F6] hover:text-[#364658]"><X size={18} /></button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <div className="mb-3 text-[13px] font-semibold text-[#364658]">Schedule setup</div>
          <div className="rounded-lg border border-[#E5E7EB] bg-[#FAFBFC] p-3.5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-[12px] font-medium text-[#7B8FA5]">Schedule Type <span className="text-[#DC2626]">*</span></label>
                <Select value={type} options={SCHEDULE_TYPES} onChange={setType} width="w-full" />
              </div>
              <div>
                <label className="mb-1.5 block text-[12px] font-medium text-[#7B8FA5]">Frequency <span className="text-[#DC2626]">*</span></label>
                <Select value={freq} options={FREQUENCIES} onChange={setFreq} width="w-full" />
                <p className="mt-1 text-[12px] text-[#7B8FA5]">Run every {FREQ_NOUN[freq] ?? 'day'} at the selected time.</p>
              </div>
              <div>
                <label className="mb-1.5 block text-[12px] font-medium text-[#7B8FA5]">Start At <span className="text-[#DC2626]">*</span></label>
                <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className={inputCls} />
                <p className="mt-1 text-[12px] text-[#7B8FA5]">This time sets when each run starts.</p>
              </div>
              <div>
                <label className="mb-1.5 block text-[12px] font-medium text-[#7B8FA5]">Timezone</label>
                <Select value={tz} options={TIMEZONES} onChange={setTz} width="w-full" />
              </div>
            </div>
            <div className="mt-3 border-t border-[#E5E7EB] pt-2.5 text-[13px] text-[#364658]">
              Runs {freq.toLowerCase()} at <span className="font-semibold">{time} {tzShort}</span>
            </div>
          </div>

          <div className="mb-2 mt-5 text-[13px] font-semibold text-[#364658]">
            Apply to CIs <span className="font-normal text-[#7B8FA5]">— by hand or by rule</span>
          </div>
          <TargetingCards value={t} onChange={setT} dynamicCopy="Every enrolled CI that matches your rules is included automatically and stays included as new CIs are added." />

          <div className="mt-5">
            <label className="mb-1.5 block text-[12px] font-medium text-[#7B8FA5]">Schedule name — optional</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Nightly — all servers" className={inputCls} />
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-[#DFE5ED] px-5 py-3">
          <span className="text-[13px] text-[#7B8FA5]">Scans <span className="font-semibold text-[#364658]">{scanned.length}</span> of {ADMIN_CIS.length} enrolled CIs</span>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className={btnSecondary}>Cancel</button>
            <button onClick={() => onSave(name.trim(), freq, `${time} ${tzShort}`)} className={btnPrimary}><Check size={15} /> Create schedule</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ══ Retention ══════════════════════════════════════════════════════════════

function Retention({ go }: { go: (s: BomAdminScreen) => void }) {
  const [keep, setKeep] = useState(`${RETENTION_DEFAULT.keepVersions} versions`);
  const [older, setOlder] = useState(`${RETENTION_DEFAULT.deleteAfterDays} days`);
  const [exceptions, setExceptions] = useState(RETENTION_EXCEPTIONS);
  const [showNew, setShowNew] = useState(false);

  const affected = exceptions.filter((e) => e.status === 'Active').reduce((n, e) => n + e.appliesTo, 0);

  return (
    <>
      <PageHead
        crumbs={[{ label: 'BOM' }, { label: 'Admin', to: 'landing' }, { label: 'Retention' }]}
        onCrumb={go}
        title="BOM Retention"
        subtitle="Control how long generated BOM versions are stored. Every enrolled CI follows the default policy unless an exception rule overrides it."
      />

      <StatStrip cells={[
        { label: 'Default policy', value: keep, sub: `/ ${older}` },
        { label: 'Retention exceptions', value: exceptions.length, sub: `${exceptions.filter((e) => e.status === 'Active').length} active` },
        { label: 'Affected CIs', value: affected, sub: `of ${ADMIN_CIS.length} enrolled · the rest follow the default` },
      ]} />

      {/* Default policy */}
      <div className="mb-5 rounded-xl border border-[#E5E7EB] bg-white p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-[#7B8FA5]">Default policy</div>
          <div className="text-[12px] text-[#7B8FA5]">Applies to every enrolled CI</div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <span className="text-[14px] text-[#364658]">Keep the latest</span>
          <Select value={keep} options={VERSION_OPTIONS} onChange={setKeep} width="w-[170px]" />
          <span className="text-[14px] text-[#364658]">or automatically delete versions older than</span>
          <Select value={older} options={DAY_OPTIONS} onChange={setOlder} width="w-[150px]" />
        </div>
        <p className="mt-2.5 text-[13px] text-[#7B8FA5]">
          Whichever limit is reached first. Each limit is set on its own — change one without touching the other.
        </p>
      </div>

      {/* Exceptions */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-[15px] font-semibold text-[#364658]">Retention Exceptions</h2>
          <span className="inline-flex h-[20px] min-w-[20px] items-center justify-center rounded-full bg-[#EEF2F6] px-1.5 text-[12px] font-semibold text-[#64748B]">{exceptions.length}</span>
        </div>
        <button onClick={() => setShowNew(true)} className={btnPrimary}><Plus size={15} /> New Exception</button>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#E5E7EB] bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className="border-b border-[#e5e7eb]">
              <tr>
                {['Policy', 'Applies To', 'Retention Policy', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="whitespace-nowrap px-4 py-2.5 text-left text-[12px] font-semibold tracking-wider text-[#364658]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e7eb]">
              {exceptions.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-[13px] text-[#9CA3AF]">No exceptions — every CI follows the default policy.</td></tr>
              ) : exceptions.map((e) => (
                <tr key={e.id} className="transition-colors hover:bg-[#f9fafb]">
                  <td className="px-4 py-3">
                    <div className="text-[13px] font-medium text-[#364658]">{e.name}</div>
                    <div className="font-mono text-[11px] text-[#9CA3AF]">{e.id} · overrides default</div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <div className="text-[13px] text-[#364658]">{e.appliesTo} CI{e.appliesTo === 1 ? '' : 's'}</div>
                    <span className="mt-0.5 inline-block rounded-sm bg-[#F1F5F9] px-2 py-0.5 text-[12px] text-[#475467]">{e.appliesToKind}</span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <div className="text-[13px] text-[#364658]">Keep last {e.keepVersions} versions</div>
                    <div className="text-[12px] text-[#7B8FA5]">Delete after {e.deleteAfterDays} days</div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-[13px]"><StatusDot status={e.status} /></td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setExceptions((xs) => xs.map((x) => (x.id === e.id ? { ...x, status: x.status === 'Active' ? 'Disabled' : 'Active' } : x)))}
                        className={btnSecondary}
                      >{e.status === 'Active' ? 'Disable' : 'Enable'}</button>
                      <button onClick={() => toast.success(`Editing ${e.name}`)} className={btnSecondary}>Edit</button>
                      <button
                        onClick={() => { setExceptions((xs) => xs.filter((x) => x.id !== e.id)); toast.error(`${e.name} deleted`); }}
                        className="flex size-8 items-center justify-center rounded border border-[#DFE5ED] bg-white text-[#DC2626] transition-colors hover:bg-[#FEF3F2]"
                        title="Delete"
                      ><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <NewExceptionDrawer
        isOpen={showNew}
        onClose={() => setShowNew(false)}
        onSave={(name, k, d, count, kind) => {
          setExceptions((xs) => [...xs, {
            id: `RR-${xs.length + 1}`, name, appliesTo: count, appliesToKind: kind,
            keepVersions: k, deleteAfterDays: d, status: 'Active',
          }]);
          setShowNew(false);
          toast.success(`Exception "${name}" created`);
        }}
      />
    </>
  );
}

function NewExceptionDrawer({ isOpen, onClose, onSave }: {
  isOpen: boolean; onClose: () => void;
  onSave: (name: string, keep: number, days: number, count: number, kind: 'Fixed List' | 'Dynamic') => void;
}) {
  const [name, setName] = useState('');
  const [keep, setKeep] = useState('10 versions');
  const [older, setOlder] = useState('90 days');
  const [t, setT] = useState<Targeting>(emptyTargeting());
  if (!isOpen) return null;
  const affected = targetedCis(t);

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-end bg-black/40">
      <div className="flex h-full w-[860px] max-w-[95vw] flex-col bg-white shadow-xl">
        <div className="flex items-center justify-between gap-3 border-b border-[#DFE5ED] px-5 py-3">
          <div>
            <h3 className="text-[16px] font-semibold text-[#364658]">New retention rule</h3>
            <p className="mt-0.5 text-[13px] text-[#7B8FA5]">Overrides the default retention policy for the CIs you target.</p>
          </div>
          <button onClick={onClose} className="flex size-8 items-center justify-center rounded text-[#7B8FA5] transition-colors hover:bg-[#F3F4F6] hover:text-[#364658]"><X size={18} /></button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <label className="mb-1.5 block text-[13px] font-medium text-[#364658]">Exception name <span className="text-[#DC2626]">*</span></label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Payments host" className={inputCls} />

          <div className="mb-2 mt-5 text-[13px] font-semibold text-[#364658]">Retention policy</div>
          <div className="rounded-lg border border-[#E5E7EB] bg-[#FAFBFC] p-3.5">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-[13px] text-[#364658]">Keep last</span>
              <Select value={keep} options={VERSION_OPTIONS} onChange={setKeep} width="w-[170px]" />
              <span className="text-[13px] text-[#364658]">or delete after</span>
              <Select value={older} options={DAY_OPTIONS} onChange={setOlder} width="w-[150px]" />
            </div>
          </div>
          <p className="mt-2 text-[12px] text-[#7B8FA5]">Whichever limit is reached first.</p>

          <div className="mb-2 mt-5 text-[13px] font-semibold text-[#364658]">
            Applies to CIs <span className="font-normal text-[#7B8FA5]">— by hand, by rule, or both</span>
          </div>
          <TargetingCards value={t} onChange={setT} dynamicCopy="Every enrolled CI matching your conditions is targeted — and stays targeted as new CIs are enrolled." />

          <div className="mb-2 mt-5 text-[13px] font-semibold text-[#364658]">Impact</div>
          <div className="flex items-start gap-3 rounded-lg border border-[#E5E7EB] bg-[#F7F9FC] p-3.5">
            <span className="text-[20px] font-semibold text-[#364658]">{affected.length}</span>
            <div>
              <div className="text-[13px] font-medium text-[#364658]">
                {affected.length === 0 ? 'This exception affects no CIs yet' : `This exception overrides the default for ${affected.length} CI${affected.length === 1 ? '' : 's'}`}
              </div>
              <p className="mt-0.5 text-[12px] text-[#7B8FA5]">
                {affected.length === 0
                  ? 'Choose CIs by hand or build a condition above — until then, it overrides nothing.'
                  : 'Those CIs stop following the default policy as soon as this is created.'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-[#DFE5ED] px-5 py-3">
          <span className="text-[13px] text-[#7B8FA5]">Applies to <span className="font-semibold text-[#364658]">{affected.length}</span> of {ADMIN_CIS.length} enrolled CIs</span>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className={btnSecondary}>Cancel</button>
            <button
              onClick={() => name.trim() && onSave(name.trim(), parseInt(keep, 10), parseInt(older, 10), affected.length, t.groups.length ? 'Dynamic' : 'Fixed List')}
              disabled={!name.trim()}
              className={`${btnPrimary} disabled:cursor-not-allowed disabled:bg-[#CBD5E1]`}
            ><Check size={15} /> Create exception</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ══ Module shell ═══════════════════════════════════════════════════════════

export function AdminBomModule({ screen, onScreen }: { screen: BomAdminScreen; onScreen: (s: BomAdminScreen) => void }) {
  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6">
      {screen === 'landing' && <Landing go={onScreen} />}
      {screen === 'licensing' && <Licensing go={onScreen} />}
      {screen === 'scheduler' && <Scheduler go={onScreen} />}
      {screen === 'retention' && <Retention go={onScreen} />}
    </div>
  );
}
