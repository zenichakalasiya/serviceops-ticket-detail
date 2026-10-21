import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, CirclePlus, Trash2, X, Search, Check } from 'lucide-react';
import { toast } from 'sonner';
import { DEPLOYED_PATCHES } from './PatchDeploymentPatchesTab';
import type { DeployedPatch } from './PatchDeploymentPatchesTab';
import { INITIAL_COMPUTERS, REMOTE_OFFICES } from './PatchComputersTab';
import { OS_IMAGES } from './osUpgradeData';
import type { OsImage } from './osUpgradeData';
import type { DeploymentType, PatchDeployment } from './PatchDeploymentsListPage';

/* Create Patch Deployment — the form behind the listing's CTA.
 *
 * The one field that changes the shape of everything else is Deployment Category. A patch run
 * pushes KB/app patches; an OS Upgrade run pushes an uploaded ISO, so choosing it swaps the
 * payload picker to the OS image catalogue. */

const btnPrimary = 'inline-flex h-8 items-center gap-1.5 rounded bg-[#3D8BD0] px-3.5 text-[13px] font-medium text-white transition-colors hover:bg-[#2d6ca0] disabled:cursor-not-allowed disabled:bg-[#CBD5E1]';
const btnSecondary = 'inline-flex h-8 items-center gap-1.5 rounded border border-[#DFE5ED] bg-white px-3.5 text-[13px] font-medium text-[#364658] transition-colors hover:bg-[#F5F7FA]';
const inputCls = 'h-9 w-full rounded border border-[#d1d5db] bg-white px-3 text-[13px] text-[#364658] placeholder:text-[#9ca3af] focus:border-[#3D8BD0] focus:outline-none focus:ring-1 focus:ring-[#3D8BD0]';
const labelCls = 'mb-1.5 block text-[13px] text-[#64748B]';
const addLinkCls = 'inline-flex items-center gap-1.5 text-[13px] font-medium text-[#3D8BD0] transition-colors hover:underline';
const thCls = 'whitespace-nowrap px-4 py-2.5 text-left text-[12px] font-semibold tracking-wider text-[#364658]';

const DEPLOYMENT_POLICIES = [
  'Production Servers — Staged Rollout',
  'Workstations — Business Hours Safe',
  'Critical Security — Immediate',
  'Pilot Ring — Early Validation',
  'App Servers — Maintenance Window',
  'Remote Offices — Bandwidth Throttled',
  'Kiosk Devices — Overnight Only',
];
const NOTIFY_GROUPS = ['IT Operations', 'Service Desk', 'Security Team', 'Endpoint Engineering'];

const Required = () => <span className="text-[#DC2626]">*</span>;

/** Section heading + hairline, the rhythm the reference form uses between blocks. */
function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-[16px] font-semibold text-[#364658]">{title}</h2>
      <div className="mt-2 border-t border-[#E5E7EB] pt-4">{children}</div>
    </section>
  );
}

/** An empty grid still needs its header — the columns tell you what "Add" will collect. */
function EmptyRow({ colSpan, text }: { colSpan: number; text: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-8 text-center text-[13px] text-[#9CA3AF]">{text}</td>
    </tr>
  );
}

export interface PickerColumn<T> {
  header: string;
  cell: (row: T) => React.ReactNode;
}

/** One picker for every "Add …" on this form — patches, OS upgrade patches, offices, endpoints. */
export function PickerDrawer<T extends { id: string }>({ isOpen, title, subtitle, rows, columns, selected, searchOf, onClose, onApply, single = false, filterBar }: {
  isOpen: boolean;
  title: string;
  subtitle: string;
  rows: T[];
  columns: PickerColumn<T>[];
  selected: string[];
  searchOf: (row: T) => string;
  onClose: () => void;
  onApply: (ids: string[]) => void;
  /** Radio behaviour — picking replaces rather than adds. A run installs ONE OS upgrade patch. */
  single?: boolean;
  /** Optional filters beside the search — the caller filters `rows` itself (e.g. the listing filter bar). */
  filterBar?: React.ReactNode;
}) {
  const [picked, setPicked] = useState<string[]>(selected);
  const [q, setQ] = useState('');
  // Reopening after a change must start from what is on the form, not the last session's picks.
  useEffect(() => { if (isOpen) { setPicked(selected); setQ(''); } }, [isOpen, selected]);
  if (!isOpen) return null;

  const query = q.trim().toLowerCase();
  const visible = query ? rows.filter((r) => searchOf(r).toLowerCase().includes(query)) : rows;
  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  /* Single mode locks the rest of the list once something is chosen, rather than silently swapping
     the pick. The chosen row stays live so it can be unselected, which re-opens the whole list —
     so the limit is enforced by the control and there is no state holding two. */
  const lockedOut = (id: string) => single && picked.length > 0 && !picked.includes(id);

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-end bg-black/40">
      <div className="flex h-full w-[860px] max-w-[95vw] flex-col bg-white shadow-xl">
        <div className="flex items-center justify-between gap-3 border-b border-[#DFE5ED] px-5 py-3">
          <div className="min-w-0">
            <h3 className="text-[16px] font-semibold text-[#364658]">{title}</h3>
            <p className="mt-0.5 text-[13px] text-[#7B8FA5]">{subtitle}</p>
          </div>
          <button onClick={onClose} className="flex size-8 flex-shrink-0 items-center justify-center rounded text-[#7B8FA5] transition-colors hover:bg-[#F3F4F6] hover:text-[#364658]"><X size={18} /></button>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-b border-[#F0F2F5] px-5 py-3">
          <div className={`relative ${filterBar ? 'w-[280px]' : 'w-full'}`}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" size={15} />
            <input type="text" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" className={`${inputCls} pl-9`} />
          </div>
          {filterBar}
        </div>

        <div className="min-h-0 flex-1 overflow-auto">
          <table className="w-full">
            <thead className="border-b border-[#e5e7eb]">
              <tr>
                <th className="w-[40px] px-4 py-2.5 text-left">
                  {/* Select all acts on the VISIBLE rows, so it follows the search; a partial pick shows the dash. */}
                  {!single && visible.length > 0 && (() => {
                    const on = visible.filter((r) => picked.includes(r.id)).length;
                    const all = on === visible.length;
                    return (
                      <input
                        type="checkbox"
                        aria-label="Select all"
                        title={all ? 'Unselect all' : 'Select all'}
                        checked={all}
                        ref={(el) => { if (el) el.indeterminate = on > 0 && !all; }}
                        onChange={() => {
                          const ids = visible.map((r) => r.id);
                          setPicked((p) => (all ? p.filter((x) => !ids.includes(x)) : [...p, ...ids.filter((x) => !p.includes(x))]));
                        }}
                        className="h-3.5 w-3.5 cursor-pointer rounded border-[#d1d5db] text-[#3D8BD0] focus:ring-[#3D8BD0] focus:ring-offset-0"
                      />
                    );
                  })()}
                </th>
                {columns.map((c) => <th key={c.header} className={thCls}>{c.header}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e7eb]">
              {visible.length === 0 ? (
                <EmptyRow colSpan={columns.length + 1} text={`Nothing matches “${q}”.`} />
              ) : visible.map((r) => {
                const locked = lockedOut(r.id);
                return (
                  <tr
                    key={r.id}
                    onClick={() => { if (!locked) toggle(r.id); }}
                    title={locked ? 'Unselect the chosen image to pick a different one' : undefined}
                    className={`transition-colors ${locked ? 'cursor-not-allowed opacity-45' : 'cursor-pointer hover:bg-[#f9fafb]'}`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={picked.includes(r.id)}
                        disabled={locked}
                        onChange={() => {}}
                        className="h-3.5 w-3.5 cursor-pointer rounded border-[#d1d5db] text-[#3D8BD0] focus:ring-[#3D8BD0] focus:ring-offset-0 disabled:cursor-not-allowed"
                      />
                    </td>
                    {columns.map((c) => <td key={c.header} className="px-4 py-3 text-[12px] text-[#364658]">{c.cell(r)}</td>)}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-[#DFE5ED] px-5 py-3">
          {/* Says why the rest is greyed out — otherwise a locked row just looks broken. */}
          <span className="text-[13px] text-[#7B8FA5]">
            {single
              ? (picked.length
                ? <>One OS upgrade patch selected · <span className="text-[#64748B]">unselect it to choose a different one</span></>
                : 'Select one OS upgrade patch')
              : <><span className="font-semibold text-[#364658]">{picked.length}</span> selected</>}
          </span>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className={btnSecondary}>Cancel</button>
            <button
              onClick={() => onApply(picked)}
              disabled={single && picked.length === 0}
              className={btnPrimary}
            ><Check size={15} /> {single ? 'Add' : `Add ${picked.length || ''}`}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

const severityDot = (s: DeployedPatch['severity']) =>
  s === 'Critical' ? '#EF4444' : s === 'Important' ? '#F59E0B' : s === 'Moderate' ? '#EAB308' : '#111827';

interface CreatePatchDeploymentProps {
  onCancel: () => void;
  onCreate: (deployment: PatchDeployment) => void;
}

export function CreatePatchDeployment({ onCancel, onCreate }: CreatePatchDeploymentProps) {
  const [name, setName] = useState('');
  const [deploymentType, setDeploymentType] = useState<DeploymentType>('Patch');
  const [installAfter, setInstallAfter] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [patchIds, setPatchIds] = useState<string[]>([]);
  const [imageIds, setImageIds] = useState<string[]>([]);
  const [officeNames, setOfficeNames] = useState<string[]>([]);
  const [endpointIds, setEndpointIds] = useState<string[]>([]);
  const [policy, setPolicy] = useState('');
  const [notifyTo, setNotifyTo] = useState('');
  const [retryFailed, setRetryFailed] = useState(false);
  const [picker, setPicker] = useState<null | 'payload' | 'offices' | 'endpoints'>(null);

  const isOsUpgrade = deploymentType === 'OS Upgrade';

  // Only an uploaded ISO can be deployed — offering the rest would build a run that cannot run.
  const deployableImages = useMemo(() => OS_IMAGES.filter((i) => i.status === 'Uploaded'), []);
  const chosenPatches = DEPLOYED_PATCHES.filter((p) => patchIds.includes(p.id));
  const chosenImages = deployableImages.filter((i) => imageIds.includes(i.id));
  const chosenEndpoints = INITIAL_COMPUTERS.filter((c) => endpointIds.includes(c.id));

  const payloadCount = isOsUpgrade ? imageIds.length : patchIds.length;
  const canPublish = !!name.trim() && !!policy && payloadCount > 0;

  const build = (status: PatchDeployment['status']): PatchDeployment => ({
    id: `PDR-${1438 + Math.floor(Date.now() / 1000) % 60}`,
    name: name.trim(),
    status,
    deploymentType,
    deploymentPolicy: policy || '---',
    installAfter: installAfter ? new Date(installAfter).toLocaleString('en-US', { weekday: 'short', month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).replace(',', ',') : null,
    expiryDate: expiryDate ? new Date(expiryDate).toLocaleString('en-US', { weekday: 'short', month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : null,
  });

  const publish = () => {
    const d = build('Ready to Deploy');
    onCreate(d);
    const unit = isOsUpgrade
      ? `OS upgrade patch${payloadCount === 1 ? '' : 'es'}`
      : `patch${payloadCount === 1 ? '' : 'es'}`;
    toast.success(`${d.id} published — ${payloadCount} ${unit} queued`);
  };
  const saveDraft = () => {
    if (!name.trim()) { toast.error('Give the deployment a name before saving it'); return; }
    const d = build('Draft');
    onCreate(d);
    toast.success(`${d.id} saved as draft`);
  };

  // Expiry helper line, exactly the affordance the reference form shows under the field.
  const expiresIn = (() => {
    if (!expiryDate) return null;
    const days = Math.ceil((new Date(expiryDate).getTime() - Date.now()) / 86_400_000);
    if (Number.isNaN(days)) return null;
    return days < 0 ? 'Already expired' : days === 0 ? 'Expires today' : `Expires in ${days} day${days === 1 ? '' : 's'}`;
  })();

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-white">
      {/* Header — back + title on the left, the three exits on the right */}
      <div className="flex flex-shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[#e5e7eb] px-6 py-3">
        <div className="flex items-center gap-2">
          <button
            onClick={onCancel}
            title="Back to Patch Deployments"
            className="flex size-8 items-center justify-center rounded text-[#64748B] transition-colors hover:bg-[#F3F4F6] hover:text-[#364658]"
          ><ChevronLeft size={18} /></button>
          <h1 className="text-[16px] font-semibold text-[#364658]">Create Patch Deployment</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={publish} disabled={!canPublish} className={btnPrimary}>Publish</button>
          <button onClick={saveDraft} className={btnSecondary}>Save as Draft</button>
          <button onClick={onCancel} className={btnSecondary}>Cancel</button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[1400px] px-6 py-5">
          {/* ── Basics ── */}
          <div>
            <label className={labelCls}>Name <Required /></label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className={inputCls} />
          </div>

          {/* Three across: Deployment Category sits beside Expiry Date rather than alone on its
              own row, which had left half the line empty. */}
          <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className={labelCls}>Install After</label>
              <input type="datetime-local" value={installAfter} onChange={(e) => setInstallAfter(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Expiry Date</label>
              <input type="datetime-local" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} className={inputCls} />
              {expiresIn && <p className="mt-1 text-[12px] text-[#7B8FA5]">{expiresIn}</p>}
            </div>
            <div>
              <label className={labelCls}>Deployment Category <Required /></label>
              <select
                value={deploymentType}
                onChange={(e) => setDeploymentType(e.target.value as DeploymentType)}
                className={`app-select ${inputCls} cursor-pointer`}
              >
                <option value="Patch">Patch</option>
                <option value="OS Upgrade">OS Upgrade</option>
              </select>
              <p className="mt-1 text-[12px] text-[#7B8FA5]">
                {isOsUpgrade
                  ? 'Deploys an uploaded ISO from Admin › Patch Management › OS Upgrade.'
                  : 'Deploys approved patches to the endpoints you target below.'}
              </p>
            </div>
          </div>

          {/* ── Payload: patches, or the OS image when this is an upgrade ── */}
          <FormSection title={isOsUpgrade ? 'OS Upgrade Patches' : 'Patches'}>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <span className="text-[13px] text-[#64748B]">{isOsUpgrade ? 'OS Upgrade Patches' : 'Patches'} <Required /></span>
              {/* Once an image is on, the action is to CHANGE it — "Add" would promise a second. */}
              <button onClick={() => setPicker('payload')} className={addLinkCls}>
                <CirclePlus size={15} />
                {isOsUpgrade ? (imageIds.length ? 'Change OS Upgrade Patch' : 'Add OS Upgrade Patch') : 'Add Patches'}
              </button>
            </div>
            <div className="overflow-x-auto">
              {isOsUpgrade ? (
                <table className="w-full min-w-[900px]">
                  <thead className="border-b border-[#e5e7eb]">
                    <tr>
                      {['ID', 'Name', 'Platform', 'Edition', 'Architecture', 'Language', 'Size', 'End-of-Support', 'Actions'].map((h) => <th key={h} className={thCls}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e5e7eb]">
                    {chosenImages.length === 0 ? (
                      <EmptyRow colSpan={9} text="No OS upgrade patch selected yet — add the one this run should install." />
                    ) : chosenImages.map((i) => (
                      <tr key={i.id} className="transition-colors hover:bg-[#f9fafb]">
                        <td className="whitespace-nowrap px-4 py-3"><span className="rounded bg-[#e8f4fd] px-2 py-0.5 text-[12px] font-semibold text-[#3D8BD0]">{i.id}</span></td>
                        <td className="px-4 py-3 text-[12px] text-[#364658]"><span className="block max-w-[320px] truncate" title={i.title}>{i.title}</span></td>
                        <td className="whitespace-nowrap px-4 py-3 text-[12px] text-[#364658]">{i.platform}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-[12px] text-[#364658]">{i.edition}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-[12px] text-[#364658]">{i.architecture}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-[12px] text-[#364658]">{i.language}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-[12px] tabular-nums text-[#364658]">{i.size}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-[12px] text-[#364658]">{i.eosDate}</td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <button onClick={() => setImageIds((p) => p.filter((x) => x !== i.id))} title="Remove" className="text-[#EF4444] transition-colors hover:text-[#DC2626]"><Trash2 size={15} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <table className="w-full min-w-[1200px]">
                  <thead className="border-b border-[#e5e7eb]">
                    <tr>
                      {['ID', 'Name', 'Patch Category', 'Severity', 'Approval Status', 'Application', 'Release Date', 'KB Number', 'Download Size', 'UUID', 'Actions'].map((h) => <th key={h} className={thCls}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e5e7eb]">
                    {chosenPatches.length === 0 ? (
                      <EmptyRow colSpan={11} text="No patches selected yet — add the patches this run should deploy." />
                    ) : chosenPatches.map((p) => (
                      <tr key={p.id} className="transition-colors hover:bg-[#f9fafb]">
                        <td className="whitespace-nowrap px-4 py-3"><span className="rounded bg-[#EEF2F6] px-2 py-0.5 text-[12px] font-semibold text-[#364658]">{p.id}</span></td>
                        <td className="px-4 py-3 text-[12px] text-[#364658]"><span className="block max-w-[280px] truncate" title={p.name}>{p.name}</span></td>
                        <td className="whitespace-nowrap px-4 py-3 text-[12px] text-[#364658]">{p.category}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-[12px]">
                          <span className="inline-flex items-center gap-1.5 text-[#364658]">
                            <span className="size-2 flex-shrink-0 rounded-full" style={{ backgroundColor: severityDot(p.severity) }} />{p.severity}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-[12px]">
                          <span className="inline-flex items-center gap-1.5 text-[#364658]">
                            <span className="size-2 flex-shrink-0 rounded-full" style={{ backgroundColor: p.approvalStatus === 'Approved' ? '#22C55E' : '#94A3B8' }} />{p.approvalStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[12px] text-[#364658]"><span className="block max-w-[180px] truncate" title={p.application}>{p.application}</span></td>
                        <td className="whitespace-nowrap px-4 py-3 text-[12px] text-[#364658]">{p.releaseDate}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-[12px] text-[#364658]">{p.kbNumber}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-[12px] text-[#364658]">{p.downloadSize}</td>
                        <td className="px-4 py-3 text-[12px] text-[#364658]"><span className="block max-w-[140px] truncate" title={p.uuid}>{p.uuid}</span></td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <button onClick={() => setPatchIds((x) => x.filter((y) => y !== p.id))} title="Remove" className="text-[#EF4444] transition-colors hover:text-[#DC2626]"><Trash2 size={15} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </FormSection>

          {/* ── Targets ── */}
          <FormSection title="Target Endpoints">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <span className="text-[13px] text-[#64748B]">Remote Offices</span>
              <button onClick={() => setPicker('offices')} className={addLinkCls}><CirclePlus size={15} /> Add Remote Office</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead className="border-b border-[#e5e7eb]">
                  <tr>{['Remote Office', 'Filter Applied', 'Action'].map((h) => <th key={h} className={thCls}>{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-[#e5e7eb]">
                  {officeNames.length === 0 ? (
                    <EmptyRow colSpan={3} text="No remote offices added." />
                  ) : officeNames.map((o) => (
                    <tr key={o} className="transition-colors hover:bg-[#f9fafb]">
                      <td className="px-4 py-3 text-[12px] text-[#364658]">{o}</td>
                      <td className="px-4 py-3 text-[12px] text-[#9ca3af]">---</td>
                      <td className="px-4 py-3">
                        <button onClick={() => setOfficeNames((p) => p.filter((x) => x !== o))} title="Remove" className="text-[#EF4444] transition-colors hover:text-[#DC2626]"><Trash2 size={15} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mb-2 mt-6 flex flex-wrap items-center justify-between gap-2">
              <span className="text-[13px] text-[#64748B]">Endpoints</span>
              <button onClick={() => setPicker('endpoints')} className={addLinkCls}><CirclePlus size={15} /> Add Endpoints</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1200px]">
                <thead className="border-b border-[#e5e7eb]">
                  <tr>
                    {['Endpoint ID', 'Host Name', 'IP Address', 'Poller', 'Agent Created By', 'OS Name', 'Version', 'Service Pack', 'Architecture', 'Remote Office', 'Actions'].map((h) => <th key={h} className={thCls}>{h}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e5e7eb]">
                  {chosenEndpoints.length === 0 ? (
                    <EmptyRow colSpan={11} text="No endpoints added — target them directly, or by remote office above." />
                  ) : chosenEndpoints.map((c) => (
                    <tr key={c.id} className="transition-colors hover:bg-[#f9fafb]">
                      <td className="whitespace-nowrap px-4 py-3"><span className="rounded bg-[#e8f4fd] px-2 py-0.5 text-[12px] font-semibold text-[#3D8BD0]">{c.id}</span></td>
                      <td className="whitespace-nowrap px-4 py-3 text-[12px] text-[#364658]">{c.hostName}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-[12px] text-[#364658]">{c.ipAddress}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-[12px] text-[#364658]">{c.poller}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-[12px] text-[#364658]">{c.createdBy}</td>
                      <td className="px-4 py-3 text-[12px] text-[#364658]"><span className="block max-w-[180px] truncate" title={c.osName}>{c.osName}</span></td>
                      <td className="whitespace-nowrap px-4 py-3 text-[12px] text-[#364658]">{c.version}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-[12px] text-[#364658]">{c.servicePack}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-[12px] text-[#364658]">{c.architecture}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-[12px] text-[#364658]">{c.remoteOffice ?? '---'}</td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <button onClick={() => setEndpointIds((p) => p.filter((x) => x !== c.id))} title="Remove" className="text-[#EF4444] transition-colors hover:text-[#DC2626]"><Trash2 size={15} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </FormSection>

          {/* ── Settings ── */}
          <FormSection title="Configuration Settings">
            <div className="grid grid-cols-1 gap-x-6 gap-y-4 lg:grid-cols-2">
              <div>
                <label className={labelCls}>Deployment Policy <Required /></label>
                <select value={policy} onChange={(e) => setPolicy(e.target.value)} className={`app-select ${inputCls} cursor-pointer`}>
                  <option value="">Select</option>
                  {DEPLOYMENT_POLICIES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Notify to</label>
                <select value={notifyTo} onChange={(e) => setNotifyTo(e.target.value)} className={`app-select ${inputCls} cursor-pointer`}>
                  <option value="">Select</option>
                  {NOTIFY_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            </div>

            <div className="mt-5">
              <label className={labelCls}>Retry Failed Configuration</label>
              <button
                onClick={() => setRetryFailed((v) => !v)}
                className={`flex h-6 w-11 flex-shrink-0 items-center rounded-full px-0.5 transition-colors ${retryFailed ? 'bg-[#3D8BD0]' : 'bg-[#CBD5E1]'}`}
              >
                <span className={`size-5 rounded-full bg-white transition-transform ${retryFailed ? 'translate-x-5' : ''}`} />
              </button>
            </div>
          </FormSection>
        </div>
      </div>

      {/* Pickers */}
      <PickerDrawer
        isOpen={picker === 'payload' && !isOsUpgrade}
        title="Add Patches"
        subtitle="Only approved patches can be deployed."
        rows={DEPLOYED_PATCHES}
        selected={patchIds}
        searchOf={(p) => `${p.id} ${p.name} ${p.category} ${p.application} ${p.kbNumber}`}
        columns={[
          { header: 'ID', cell: (p) => <span className="rounded bg-[#EEF2F6] px-2 py-0.5 text-[12px] font-semibold text-[#364658]">{p.id}</span> },
          { header: 'Name', cell: (p) => <span className="block max-w-[380px] truncate" title={p.name}>{p.name}</span> },
          { header: 'Severity', cell: (p) => <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full" style={{ backgroundColor: severityDot(p.severity) }} />{p.severity}</span> },
          { header: 'KB Number', cell: (p) => p.kbNumber },
        ]}
        onClose={() => setPicker(null)}
        onApply={(ids) => { setPatchIds(ids); setPicker(null); }}
      />

      <PickerDrawer
        isOpen={picker === 'payload' && isOsUpgrade}
        single
        title={imageIds.length ? 'Change OS Upgrade Patch' : 'Add OS Upgrade Patch'}
        subtitle="One image per run. Only images whose ISO has finished uploading can be deployed."
        rows={deployableImages}
        selected={imageIds}
        searchOf={(i: OsImage) => `${i.id} ${i.title} ${i.platform} ${i.edition} ${i.architecture}`}
        columns={[
          { header: 'ID', cell: (i: OsImage) => <span className="rounded bg-[#e8f4fd] px-2 py-0.5 text-[12px] font-semibold text-[#3D8BD0]">{i.id}</span> },
          { header: 'Name', cell: (i: OsImage) => <span className="block max-w-[380px] truncate" title={i.title}>{i.title}</span> },
          { header: 'Platform', cell: (i: OsImage) => i.platform },
          { header: 'Size', cell: (i: OsImage) => i.size },
        ]}
        onClose={() => setPicker(null)}
        onApply={(ids) => { setImageIds(ids); setPicker(null); }}
      />

      <PickerDrawer
        isOpen={picker === 'offices'}
        title="Add Remote Office"
        subtitle="Every endpoint in the office is targeted."
        rows={REMOTE_OFFICES.map((o) => ({ id: o, name: o }))}
        selected={officeNames}
        searchOf={(o) => o.name}
        columns={[{ header: 'Remote Office', cell: (o) => o.name }]}
        onClose={() => setPicker(null)}
        onApply={(ids) => { setOfficeNames(ids); setPicker(null); }}
      />

      <PickerDrawer
        isOpen={picker === 'endpoints'}
        title="Add Endpoints"
        subtitle="Target individual machines on top of any offices you picked."
        rows={INITIAL_COMPUTERS}
        selected={endpointIds}
        searchOf={(c) => `${c.id} ${c.hostName} ${c.ipAddress} ${c.osName}`}
        columns={[
          { header: 'Endpoint ID', cell: (c) => <span className="rounded bg-[#e8f4fd] px-2 py-0.5 text-[12px] font-semibold text-[#3D8BD0]">{c.id}</span> },
          { header: 'Host Name', cell: (c) => c.hostName },
          { header: 'IP Address', cell: (c) => c.ipAddress },
          { header: 'OS Name', cell: (c) => <span className="block max-w-[220px] truncate" title={c.osName}>{c.osName}</span> },
          { header: 'Remote Office', cell: (c) => c.remoteOffice ?? '---' },
        ]}
        onClose={() => setPicker(null)}
        onApply={(ids) => { setEndpointIds(ids); setPicker(null); }}
      />
    </div>
  );
}
