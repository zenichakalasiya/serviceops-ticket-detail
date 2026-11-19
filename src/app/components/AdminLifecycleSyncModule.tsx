import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { CalendarClock, Check, CheckCircle2, Clock, ExternalLink, Eye, EyeOff, KeyRound, Loader2, RefreshCw, X } from 'lucide-react';
import { toast } from 'sonner';
import { ErrorText, FieldLabel, RuleSelect, ToggleSwitch, inputCls } from './FormRuleControls';
import { useLifecycleSyncUi } from './lifecycleSyncUi';

/* Admin › Supplier Management › Lifecycle Sync (19 Nov 2026, Zeni).
 *
 * Two tabs: Warranty (which manufacturers ServiceOps asks for warranty, and how that is going) and
 * EOSL Sync Schedule (when end-of-service-life data is refreshed).
 *
 * The reference put the vendors in a centred empty-state banner, which read as "nothing here yet"
 * on a page that is in fact always working. Here the page opens on what the sync has DONE (coverage
 * numbers), then one card per supported vendor showing its own share of the fleet — so the one
 * vendor that needs something from the admin (Dell, credentials) stands out by its state, not by
 * a dropdown hidden inside a chip. All data is mock. */

type VendorId = 'dell' | 'hp' | 'lenovo' | 'asus';

interface Vendor {
  id: VendorId;
  name: string;
  /** How the lookup is made — said on the card so "no setup" is a fact, not an absence. */
  source: string;
  devices: number;
  found: number;
  /** Dell's TechDirect API needs a Client ID + Secret; the others use a public lookup. */
  needsCredentials?: boolean;
  docsSteps?: string[];
}

const VENDORS: Vendor[] = [
  { id: 'dell', name: 'Dell', source: 'Dell TechDirect API', devices: 412, found: 0, needsCredentials: true,
    docsSteps: ['Sign in to Dell TechDirect', 'Open APIs → Warranty', 'Copy the Client ID and Client Secret'] },
  { id: 'hp', name: 'HP', source: 'HP public warranty lookup', devices: 386, found: 371 },
  { id: 'lenovo', name: 'Lenovo', source: 'Lenovo public warranty lookup', devices: 318, found: 309 },
  { id: 'asus', name: 'ASUS', source: 'ASUS public warranty lookup', devices: 132, found: 118 },
];

/** Brand-coloured marks. Text marks, not the vendors' artwork. */
function VendorMark({ id, size = 40 }: { id: VendorId; size?: number }) {
  const box = 'flex flex-shrink-0 items-center justify-center rounded-lg border border-[#E5E7EB] bg-white';
  const st = { width: size, height: size };
  if (id === 'dell') return <span className={box} style={st}><span className="flex size-[70%] items-center justify-center rounded-full border-2 border-[#007DB8] text-[9px] font-bold tracking-tight text-[#007DB8]">DELL</span></span>;
  if (id === 'hp') return <span className={box} style={st}><span className="flex size-[70%] items-center justify-center rounded-full bg-[#0096D6] text-[13px] font-bold italic text-white">hp</span></span>;
  if (id === 'lenovo') return <span className={box} style={st}><span className="rounded-sm bg-[#E2231A] px-1 py-0.5 text-[8px] font-semibold text-white">Lenovo</span></span>;
  return <span className={box} style={st}><span className="rounded-sm bg-[#00205B] px-1 py-0.5 text-[8px] font-bold tracking-wider text-white">ASUS</span></span>;
}

const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);

export function AdminLifecycleSyncModule() {
  const [tab, setTab] = useState<'warranty' | 'eosl'>('warranty');
  const tabs: { id: typeof tab; label: string }[] = [
    { id: 'warranty', label: 'Warranty' },
    { id: 'eosl', label: 'EOSL Sync Schedule' },
  ];
  return (
    <div className="px-4 pb-10 pt-6">
      <h1 className="text-[16px] font-semibold text-[#364658]">Lifecycle Sync</h1>
      <p className="mt-1 text-[13px] leading-[1.6] text-[#7B8FA5]">
        Keep warranty and end-of-service-life dates up to date from each manufacturer.{' '}
        <button onClick={() => toast.success('Opening the Lifecycle Sync documentation')}
          className="inline-flex items-center gap-1 text-[13px] font-medium text-[#3D8BD0] hover:underline">View Docs <ExternalLink size={12} /></button>
      </p>
      {/* The product's inline tab treatment — the one every detail page uses. */}
      <div className="mt-4 flex gap-2.5 border-b border-[#E5E7EB]">
        {tabs.map((t) => (
          <button key={t.id} type="button" onClick={() => setTab(t.id)}
            className={'-mb-px border-b-2 px-2 py-3 text-[14px] transition-colors ' + (tab === t.id
              ? 'border-[#3D8BD0] font-medium text-[#3D8BD0]'
              : 'border-transparent text-[#6b7280] hover:border-[#CBD5E1] hover:bg-[#F5F7FA]')}>{t.label}</button>
        ))}
      </div>
      {/* Both stay mounted so switching tabs never drops saved credentials or an unsaved schedule. */}
      <div className={'pt-5 ' + (tab === 'warranty' ? '' : 'hidden')}><WarrantyTab /></div>
      <div className={'pt-5 ' + (tab === 'eosl' ? '' : 'hidden')}><EoslTab /></div>
    </div>
  );
}

/* ── Warranty ─────────────────────────────────────────────────────────────── */

function WarrantyTab() {
  const [dellCreds, setDellCreds] = useState<{ id: string } | null>(null);
  const [credsOpen, setCredsOpen] = useState(false);
  /* V1 = cards with the coverage bar + setup line; V2 = one row per vendor (pill beside the logo). */
  const ui = useLifecycleSyncUi();
  const Card = ui === 'v1' ? VendorCardV1 : VendorCard;

  /* Dell's devices are only looked up once it has credentials. */
  const vendors = VENDORS.map((v) => (v.id === 'dell' && dellCreds ? { ...v, found: 389 } : v));

  return (
    <>
      {/* No summary card, no Sync now, no per-vendor switch (Zeni, 19 Nov 2026): the vendors ARE the page. */}
      <div className="mb-3">
        <h2 className="text-[14px] font-semibold text-[#364658]">Supported vendors <span className="font-normal text-[#7B8FA5]">· {VENDORS.length}</span></h2>
        <p className="mt-0.5 text-[12px] text-[#7B8FA5]">Every device with a serial number is checked with its manufacturer once a day.</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {vendors.map((v) => (
          <Card key={v.id} v={v} connected={!v.needsCredentials || !!dellCreds} onCredentials={() => setCredsOpen(true)} />
        ))}
      </div>

      {credsOpen && (
        <CredentialsPanel vendor={VENDORS[0]} initialId={dellCreds?.id} onClose={() => setCredsOpen(false)}
          onSave={(id) => { setDellCreds({ id }); setCredsOpen(false); toast.success('Dell connected. Warranty lookups start with the next sync.'); }} />
      )}
    </>
  );
}

/** V1 (Zeni, 19 Nov 2026): the card with the "Warranty found" bar and the setup line at its foot. */
function VendorCardV1({ v, connected, onCredentials }: { v: Vendor; connected: boolean; onCredentials: () => void }) {
  const waiting = !connected;
  const share = pct(v.found, v.devices);
  return (
    <div className={'flex flex-col rounded-lg border bg-white p-3.5 transition-colors ' + (waiting ? 'border-[#F5D08A]' : 'border-[#E5E7EB] hover:border-[#CBD5E1]')}>
      <div className="flex items-center gap-2.5">
        <VendorMark id={v.id} size={32} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[14px] font-semibold text-[#364658]">{v.name}</span>
            {waiting ? <Pill tone="amber">Needs credentials</Pill> : <Pill tone="green">Connected</Pill>}
          </div>
          <div className="truncate text-[12px] text-[#7B8FA5]">{v.source}</div>
        </div>
      </div>
      <div className="mt-3 flex-1">
        {waiting ? (
          <p className="text-[12px] leading-[1.5] text-[#92400E]"><span className="font-semibold">{v.devices} devices</span> waiting for API credentials.</p>
        ) : (
          <>
            <div className="flex items-baseline justify-between text-[12px]">
              <span className="text-[#7B8FA5]">Warranty found</span>
              <span className="text-[#364658]"><span className="font-semibold">{v.found}</span> / {v.devices} · {share}%</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#EEF2F6]">
              <div className="h-full rounded-full bg-[#16A34A]" style={{ width: `${share}%` }} />
            </div>
          </>
        )}
      </div>
      <div className="mt-3 flex h-8 items-center">
        {v.needsCredentials ? (
          waiting ? (
            <button type="button" onClick={onCredentials}
              className="inline-flex h-8 items-center gap-1.5 rounded bg-[#3D8BD0] px-3 text-[13px] font-medium text-white transition-colors hover:bg-[#2d6ca0]"><KeyRound size={14} /> Add credentials</button>
          ) : (
            <button type="button" onClick={onCredentials} className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#3D8BD0] hover:underline"><KeyRound size={14} /> Edit credentials</button>
          )
        ) : (
          <span className="inline-flex items-center gap-1.5 text-[12px] text-[#7B8FA5]"><CheckCircle2 size={13} className="text-[#16A34A]" /> No setup needed</span>
        )}
      </div>
    </div>
  );
}

/** V2 (the default): one short row per vendor. */
function VendorCard({ v, connected, onCredentials }: { v: Vendor; connected: boolean; onCredentials: () => void }) {
  const waiting = !connected;
  /* One row per vendor (Zeni, 19 Nov 2026): no coverage bar, no "No setup needed". Dell's credential
     action sits at the row's right, so all four cards stay the same height. */
  return (
    <div className={'flex items-center gap-2.5 rounded-lg border bg-white p-3.5 transition-colors ' + (waiting ? 'border-[#F5D08A]' : 'border-[#E5E7EB] hover:border-[#CBD5E1]')}>
      <VendorMark id={v.id} size={32} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[14px] font-semibold text-[#364658]">{v.name}</span>
          {waiting ? <Pill tone="amber">Needs credentials</Pill> : <Pill tone="green">Connected</Pill>}
        </div>
        {waiting ? (
          <button type="button" onClick={onCredentials} className="mt-0.5 inline-flex items-center gap-1 text-[12px] font-medium text-[#3D8BD0] hover:underline"><KeyRound size={12} /> Add credentials</button>
        ) : (
          <div className="truncate text-[12px] text-[#7B8FA5]">{v.source}</div>
        )}
      </div>
      {v.needsCredentials && !waiting && (
        <button type="button" onClick={onCredentials} title="Edit credentials" aria-label="Edit credentials"
          className="flex size-8 flex-shrink-0 items-center justify-center rounded border border-[#DFE5ED] text-[#64748B] transition-colors hover:border-[#3D8BD0] hover:text-[#3D8BD0]"><KeyRound size={15} /></button>
      )}
    </div>
  );
}

function Pill({ tone, children }: { tone: 'green' | 'amber' | 'grey'; children: ReactNode }) {
  const c = tone === 'green' ? 'bg-[#DCFCE7] text-[#15803D]' : tone === 'amber' ? 'bg-[#FEF3C7] text-[#B45309]' : 'bg-[#F1F5F9] text-[#64748B]';
  return <span className={'whitespace-nowrap rounded-sm px-1.5 py-0.5 text-[11px] font-medium ' + c}>{children}</span>;
}

function CredentialsPanel({ vendor, initialId, onClose, onSave }: { vendor: Vendor; initialId?: string; onClose: () => void; onSave: (id: string) => void }) {
  const [clientId, setClientId] = useState(initialId ?? '');
  const [secret, setSecret] = useState('');
  const [show, setShow] = useState(false);
  const [tried, setTried] = useState(false);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  const save = () => {
    setTried(true);
    if (!clientId.trim() || !secret.trim()) return;
    setSaving(true);
    window.setTimeout(() => onSave(clientId.trim()), 900);
  };
  return (
    <div className="fixed inset-0 z-[10000] flex justify-end bg-black/30" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="flex h-full w-[560px] max-w-full flex-col bg-white shadow-xl">
        <div className="flex items-center gap-3 border-b border-[#E5E7EB] px-5 py-4">
          <VendorMark id={vendor.id} size={32} />
          <div className="min-w-0 flex-1">
            <h2 className="text-[16px] font-semibold text-[#364658]">{vendor.name} credentials</h2>
            <p className="text-[12px] text-[#7B8FA5]">Used only to read warranty from the {vendor.source}.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="flex size-8 items-center justify-center rounded transition-colors hover:bg-[#F3F4F6]"><X size={18} className="text-[#6B7280]" /></button>
        </div>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5">
          <div>
            <FieldLabel required>Client ID</FieldLabel>
            <input value={clientId} onChange={(e) => setClientId(e.target.value)} placeholder="e.g. l7a3c0f2e9b14d" className={inputCls.replace('rounded-md', 'rounded') + ' !h-9 !text-[13px]'} />
            <ErrorText>{tried && !clientId.trim() ? 'Enter the Client ID.' : undefined}</ErrorText>
          </div>
          <div>
            <FieldLabel required>Client Secret</FieldLabel>
            <div className="relative">
              <input type={show ? 'text' : 'password'} value={secret} onChange={(e) => setSecret(e.target.value)} placeholder={initialId ? 'Enter a new secret to replace the saved one' : ''}
                className={inputCls.replace('rounded-md', 'rounded') + ' !h-9 !pr-9 !text-[13px]'} />
              <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide secret' : 'Show secret'}
                className="absolute right-1 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded text-[#7B8FA5] hover:bg-[#F3F4F6]">{show ? <EyeOff size={15} /> : <Eye size={15} />}</button>
            </div>
            <ErrorText>{tried && !secret.trim() ? 'Enter the Client Secret.' : undefined}</ErrorText>
          </div>
          <div className="rounded-lg bg-[#F7F9FC] px-4 py-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-semibold text-[#364658]">Where to find these</span>
              <button type="button" onClick={() => toast.success('Opening the Dell TechDirect guide')} className="inline-flex items-center gap-1 text-[12px] font-medium text-[#3D8BD0] hover:underline">View Docs <ExternalLink size={12} /></button>
            </div>
            <ol className="mt-2 space-y-1.5">
              {vendor.docsSteps!.map((s, i) => (
                <li key={s} className="flex gap-2.5 text-[13px] text-[#364658]">
                  <span className="flex size-5 flex-shrink-0 items-center justify-center rounded-full bg-white text-[11px] font-semibold text-[#3D8BD0] ring-1 ring-[#DFE5ED]">{i + 1}</span>{s}
                </li>
              ))}
            </ol>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-[#E5E7EB] px-5 py-3">
          <button type="button" onClick={onClose} className="h-9 rounded border border-[#DFE5ED] bg-white px-4 text-[13px] font-medium text-[#364658] hover:bg-[#F9FAFB]">Cancel</button>
          <button type="button" onClick={save} disabled={saving}
            className="inline-flex h-9 items-center gap-1.5 rounded bg-[#3D8BD0] px-4 text-[13px] font-medium text-white hover:bg-[#2d6ca0] disabled:opacity-70">
            {saving && <Loader2 size={14} className="animate-spin" />} {saving ? 'Connecting…' : 'Save & connect'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── EOSL Sync Schedule ──────────────────────────────────────────────────── */

const FREQ = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((d) => ({ value: d, label: d }));
const DATES = Array.from({ length: 28 }, (_, i) => ({ value: String(i + 1), label: `Day ${i + 1}` }));

const RUNS = [
  { at: 'Nov 17, 2026 02:00 AM', trigger: 'Scheduled', checked: 1842, updated: 26, result: 'Completed' },
  { at: 'Nov 10, 2026 02:00 AM', trigger: 'Scheduled', checked: 1838, updated: 4, result: 'Completed' },
  { at: 'Nov 06, 2026 11:24 AM', trigger: 'Manual · Amit Verma', checked: 1831, updated: 11, result: 'Completed' },
  { at: 'Nov 03, 2026 02:00 AM', trigger: 'Scheduled', checked: 0, updated: 0, result: 'Failed' },
];

function EoslTab() {
  const [on, setOn] = useState(true);
  const [freq, setFreq] = useState('weekly');
  const [day, setDay] = useState('Monday');
  const [date, setDate] = useState('1');
  const [time, setTime] = useState('02:00');
  const [dirty, setDirty] = useState(false);
  const touch = <T,>(set: (v: T) => void) => (v: T) => { set(v); setDirty(true); };

  const when = freq === 'daily' ? 'every day' : freq === 'weekly' ? `every ${day}` : `on day ${date} of every month`;
  const [h, m] = time.split(':').map(Number);
  const timeText = `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;

  return (
    <>
      <section className="rounded-lg border border-[#E5E7EB] bg-white">
        <div className="flex items-start gap-3 px-5 py-4">
          <span className="flex size-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#EBF5FF] text-[#3D8BD0]"><CalendarClock size={18} /></span>
          <div className="min-w-0 flex-1">
            <h2 className="text-[14px] font-semibold text-[#364658]">Automatic EOSL sync</h2>
            <p className="mt-0.5 text-[12px] leading-[1.5] text-[#7B8FA5]">Refreshes end-of-sale and end-of-support dates for every product in the Product Catalog.</p>
          </div>
          <ToggleSwitch size="lg" on={on} onChange={touch(setOn)} title={on ? 'Turn off automatic EOSL sync' : 'Turn on automatic EOSL sync'} />
        </div>
        {on ? (
          <div className="border-t border-[#EEF2F6] px-5 py-4">
            <div className="grid max-w-[720px] grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <FieldLabel required>Frequency</FieldLabel>
                <RuleSelect value={[freq]} options={FREQ} onChange={(v) => touch(setFreq)(v[0])} className="!rounded" />
              </div>
              {freq === 'weekly' && (
                <div><FieldLabel required>Day</FieldLabel><RuleSelect value={[day]} options={DAYS} onChange={(v) => touch(setDay)(v[0])} className="!rounded" /></div>
              )}
              {freq === 'monthly' && (
                <div><FieldLabel required>Date</FieldLabel><RuleSelect value={[date]} options={DATES} onChange={(v) => touch(setDate)(v[0])} className="!rounded" /></div>
              )}
              <div>
                <FieldLabel required>Time</FieldLabel>
                <input type="time" value={time} onChange={(e) => touch(setTime)(e.target.value)} className={inputCls.replace('rounded-md', 'rounded')} />
              </div>
            </div>
            <p className="mt-3 inline-flex items-center gap-1.5 text-[12px] text-[#364658]"><Clock size={13} className="text-[#7B8FA5]" /> Runs {when} at {timeText}. Next run: Nov 23, 2026 at {timeText}.</p>
          </div>
        ) : (
          <div className="border-t border-[#EEF2F6] px-5 py-3 text-[12px] text-[#7B8FA5]">EOSL dates stay as they are until you sync by hand or turn this back on.</div>
        )}
        <div className="flex items-center justify-end gap-2 border-t border-[#EEF2F6] px-5 py-3">
          <button type="button" onClick={() => toast.success('EOSL sync started')}
            className="inline-flex h-8 items-center gap-1.5 rounded border border-[#DFE5ED] bg-white px-3 text-[13px] font-medium text-[#364658] hover:bg-[#F9FAFB]"><RefreshCw size={14} /> Sync now</button>
          <button type="button" disabled={!dirty} onClick={() => { setDirty(false); toast.success('EOSL sync schedule saved'); }}
            className="h-8 rounded bg-[#3D8BD0] px-3.5 text-[13px] font-medium text-white hover:bg-[#2d6ca0] disabled:opacity-50">Save</button>
        </div>
      </section>

      <h2 className="mb-2 mt-7 text-[14px] font-semibold text-[#364658]">Recent runs</h2>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead className="border-b border-[#e5e7eb]">
            <tr>{['Started', 'Trigger', 'Products checked', 'Dates updated', 'Result'].map((c) => (
              <th key={c} className="px-4 py-2.5 text-left text-[12px] font-semibold tracking-wider text-[#364658]">{c}</th>
            ))}</tr>
          </thead>
          <tbody className="divide-y divide-[#e5e7eb] bg-white">
            {RUNS.map((r) => (
              <tr key={r.at} className="hover:bg-[#f9fafb]">
                <td className="px-4 py-3 text-[13px] text-[#364658]">{r.at}</td>
                <td className="px-4 py-3 text-[13px] text-[#364658]">{r.trigger}</td>
                <td className="px-4 py-3 text-[13px] text-[#364658]">{r.checked ? r.checked.toLocaleString() : '—'}</td>
                <td className="px-4 py-3 text-[13px] text-[#364658]">{r.result === 'Failed' ? '—' : r.updated}</td>
                <td className="px-4 py-3">
                  {r.result === 'Completed'
                    ? <span className="inline-flex items-center gap-1 rounded-sm bg-[#DCFCE7] px-1.5 py-0.5 text-[11px] font-medium text-[#15803D]"><Check size={11} /> Completed</span>
                    : <span title="The EOSL source did not respond. The next scheduled run retried it." className="cursor-help rounded-sm bg-[#FEE2E2] px-1.5 py-0.5 text-[11px] font-medium text-[#B91C1C]">Failed</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
