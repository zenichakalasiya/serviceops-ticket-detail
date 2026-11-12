import { CreateFormHelp, hasFormHelp } from './CreateFormHelp';
import { SteppedDrawerShell, SteppedPageShell } from './CreateFormStepped';
import { SummaryAside } from './CreateFormOneScreen';
import type { SummaryGroup } from './CreateFormOneScreen';
import { FORM_HELP } from './createFormGuides';
import type { StepItem } from './CreateFormStepped';
import { FORM_STEPS } from './createFormSteps';
import { useCreateFormUi } from './createFormUi';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ArrowDown, ArrowUp, Building2, ChevronDown, Info, Plus, RotateCcw, X } from 'lucide-react';
import { RuleSelect, ToggleSwitch } from './FormRuleControls';
import type { SelectOption } from './FormRuleControls';
import { PickerDrawer } from './CreatePatchDeployment';
import type { PickerColumn } from './CreatePatchDeployment';
import { Paginated } from './Paginated';
import { MultiPickField } from './MultiPickField';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import {
  AgentSplit, CreatePageShell, EmptyAssetsArt, EmptyCisArt, EmptyColumnsArt, EmptyConditionsArt, EmptyEndpointsArt, EmptyItemsArt,
  EmptyOfficesArt, EmptyPackagesArt, EmptyPatchesArt, EmptyRegistryArt, FilesField, FormField, Pills, RemoveBtn, RichTextField,
  Section, TargetBox, inputCls, thCls,
} from './CreateFormKit';
import type { PickedFile } from './CreateFormKit';
import { addCreatedRecord, openCreatePage, useOpenCreatePage } from './createFormStore';
import { ASSET_TARGETS } from './createMenu';
import type { CreateTarget } from './createFormStore';
import { CONDITION_OPERATORS, MODULE_SPECS, REPORT_COLUMNS, TAG_SUGGESTIONS, assetOptions, ciStatuses } from './createFormSpecs';
import type { AssetKind, BlockKind, FieldSpec, ModuleSpec, SectionSpec, Values } from './createFormSpecs';
import { mockAssets as softwareAssets } from './SoftwareAssetsListPage';
import { mockAssets as nonItAssets } from './NonItAssetsListPage';
import { mockAssets as consumableAssets } from './ConsumableAssetsListPage';
import { OS_IMAGES } from './osUpgradeData';
import { ASSETS_185, CIS_185, ENDPOINTS_185, OFFICES_185, PEOPLE_185, PACKAGES_185, PATCHES_185, REGISTRY_TEMPLATES_185 } from './data185';

/* Every module's Create page — one renderer over the specs in createFormSpecs.
 *
 * Mounted ONCE by App (ModuleCreatePageHost) and opened with `openCreatePage`, the same way the
 * Compliance Policy editor is. Plain fields come from the spec; a section with a `block` collects
 * RECORDS and is drawn as a TargetBox — the Compliance Policy endpoint box: an illustrated empty
 * state with its Add CTA, a side picker, then the chosen rows with the CTA in the box header.
 * Saving stores the record in createFormStore under the listing it belongs to. */

export function ModuleCreatePageHost() {
  const open = useOpenCreatePage();
  /* Going to another page (sidebar, Back, a pasted link) leaves the create page — it belongs to
     the listing it was opened from, and staying open over a different module reads as a bug. */
  useEffect(() => {
    if (!open) return;
    const onHash = () => openCreatePage(null);
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, [open]);
  if (!open) return null;
  const spec = MODULE_SPECS[open.spec];
  if (!spec) return null;
  return <ModuleCreatePage key={open.spec + open.target} spec={spec} target={open} onClose={() => openCreatePage(null)} />;
}

const resolve = <T,>(x: T | ((v: Values) => T), v: Values): T => (typeof x === 'function' ? (x as (v: Values) => T)(v) : x);
const isEmpty = (x: unknown) => x == null || x === '' || (Array.isArray(x) && x.length === 0) || (typeof x === 'string' && !x.trim());
const visible = (f: { when?: (v: Values) => boolean }, v: Values) => !f.when || f.when(v);

function initialValues(spec: ModuleSpec, preset?: Record<string, unknown>): Values {
  const v: Values = { ...preset };
  for (const s of spec.sections) for (const f of s.fields ?? []) {
    if (v[f.key] !== undefined || f.def === undefined) continue;
    v[f.key] = typeof f.def === 'function' ? (f.def as () => unknown)() : f.def;
  }
  return v;
}

/* ── Records the blocks pick from ── */
interface Item { id: string; name: string; qty: string; price: string; tax: string }
/* Purchase Order › Add Item — the product's "Products" sidebar: ID · Name · Product Type ·
   Manufacturer · Price · Tax Rate (%) · Warranty Period. (185 lists none for its test vendors, so these
   rows are ours.) */
const CATALOG: { id: string; name: string; type: string; maker: string; price: number; tax: number; warranty: string }[] = [
  { id: 'PRD-101', name: 'Dell Latitude 7440 Laptop', type: 'Hardware', maker: 'Dell Technologies', price: 98500, tax: 18, warranty: '3 Years' },
  { id: 'PRD-102', name: 'Dell P2423D 24" Monitor', type: 'Hardware', maker: 'Dell Technologies', price: 21800, tax: 18, warranty: '3 Years' },
  { id: 'PRD-103', name: 'HP LaserJet Pro M404dn Printer', type: 'Hardware', maker: 'HP Inc.', price: 27400, tax: 18, warranty: '1 Year' },
  { id: 'PRD-104', name: 'Lenovo ThinkPad T14 Gen 4', type: 'Hardware', maker: 'Lenovo', price: 112000, tax: 18, warranty: '3 Years' },
  { id: 'PRD-105', name: 'Cisco Catalyst 9200 24-port Switch', type: 'Hardware', maker: 'Cisco Systems', price: 245000, tax: 18, warranty: '5 Years' },
  { id: 'PRD-106', name: 'Microsoft 365 Business Standard (1 user, 1 year)', type: 'Software', maker: 'Microsoft', price: 9360, tax: 18, warranty: '---' },
  { id: 'PRD-107', name: 'Adobe Acrobat Pro (1 user, 1 year)', type: 'Software', maker: 'Adobe', price: 23500, tax: 18, warranty: '---' },
  { id: 'PRD-108', name: 'VMware vSphere Standard (per CPU)', type: 'Software', maker: 'VMware', price: 118000, tax: 18, warranty: '---' },
];
const money = (n: number) => n.toLocaleString('en-IN', { maximumFractionDigits: 2 });

const pill = (id: string) => <span className="flex-shrink-0 whitespace-nowrap rounded bg-[#e8f4fd] px-1.5 py-0.5 text-[11px] font-medium text-[#3D8BD0]">{id}</span>;
const greyPill = (id: string) => <span className="flex-shrink-0 whitespace-nowrap rounded bg-[#EEF2F6] px-1.5 py-0.5 text-[11px] font-medium text-[#364658]">{id}</span>;
const sevDot = (s: string) => ({ Critical: '#DC2626', Important: '#F97316', Moderate: '#EAB308', Low: '#22C55E' } as Record<string, string>)[s] ?? '#94A3B8';
const agentDot = () => <span className="size-2 flex-shrink-0 rounded-full bg-[#F5C518]" />;

/** A borderless table inside a TargetBox. */
function BoxTable({ heads, widths, minW = 620, children }: { heads: string[]; widths?: string[]; minW?: number; children: React.ReactNode }) {
  return (
    <table className="w-full table-fixed" style={{ minWidth: minW }}>
      {widths && <colgroup>{widths.map((w, i) => <col key={i} style={w ? { width: w } : undefined} />)}</colgroup>}
      <thead><tr className="border-b border-[#EEF1F4]">{heads.map((h, i) => <th key={i} className={thCls}>{h}</th>)}</tr></thead>
      <tbody className="divide-y divide-[#EEF1F4]">{children}</tbody>
    </table>
  );
}
const td = 'px-4 py-2.5 text-[13px] text-[#64748B]';

/* ── What the record boxes pick from, with the columns 172.16.15.185 shows (read 29 Oct 2026).
      ONE column set per record kind, used by the box on the form AND by its side drawer, so the
      two cannot disagree. Values the mocks do not carry (KB, download size, UUID, reboot…) are
      worked out from the record id, so a record reads the same every time. ── */
interface Col<T> { h: string; w?: string; c: (r: T) => React.ReactNode }
const seed = (s: string) => [...s].reduce((h, ch) => (Math.imul(h, 31) + ch.charCodeAt(0)) >>> 0, 7);
const dash = (x: unknown) => (x == null || x === '' ? '---' : String(x));
const nowrap = (x: React.ReactNode) => <span className="whitespace-nowrap">{x}</span>;
const clip = (x: string, w = 240) => <span className="block truncate" style={{ maxWidth: w }} title={x}>{x}</span>;

/* Patch › Applications — 185's "Add Os Component Applications" drawer: Name · Type. */
const OS_APPLICATIONS = [
  { id: 'APP-1', name: 'Microsoft Windows 11 Enterprise', type: 'OS' },
  { id: 'APP-2', name: 'Microsoft Windows 10 Pro', type: 'OS' },
  { id: 'APP-3', name: 'Microsoft Windows Server 2022 Standard Evaluation', type: 'OS' },
  { id: 'APP-4', name: 'Microsoft Windows 11 Pro', type: 'OS' },
];
/* Automatic Patch Test / Deployment › Include or Exclude applications — the same drawer, holding
   operating systems AND applications (185's first twelve of 33). */
const AUTO_APPLICATIONS = [
  { id: 'APP-1', name: 'Microsoft Windows 11 Enterprise', type: 'OS' },
  { id: 'APP-2', name: 'Microsoft Windows 10 Pro', type: 'OS' },
  { id: 'APP-5', name: 'OPERA', type: 'Application' },
  { id: 'APP-6', name: 'THUNDERBIRD', type: 'Application' },
  { id: 'APP-7', name: 'VLC', type: 'Application' },
  { id: 'APP-8', name: 'WIN_RAR', type: 'Application' },
  { id: 'APP-9', name: 'PUTTY', type: 'Application' },
  { id: 'APP-10', name: 'SEVEN_Z', type: 'Application' },
  { id: 'APP-3', name: 'Microsoft Windows Server 2022 Standard Evaluation', type: 'OS' },
  { id: 'APP-4', name: 'Microsoft Windows 11 Pro', type: 'OS' },
  { id: 'APP-11', name: 'Microsoft Server Operating System-24H2', type: 'Application' },
  { id: 'APP-12', name: 'Windows 11 GDR-DU', type: 'OS' },
];
const APP_COLS: Col<(typeof OS_APPLICATIONS)[number]>[] = [
  { h: 'Name', c: (a) => <span className="text-[13px] text-[#364658]">{a.name}</span> },
  { h: 'Type', w: '24%', c: (a) => a.type },
];

/* Package Deployment › Packages — 185: Packages ID · Name · Architecture · Packages Type
   (the box adds User Type, chosen per package). */
const PACKAGES = PACKAGES_185;
const PKG_COLS: Col<(typeof PACKAGES)[number]>[] = [
  { h: 'Packages ID', w: '16%', c: (p) => greyPill(p.id) },
  { h: 'Name', c: (p) => <span className="text-[13px] text-[#364658]">{p.name}</span> },
  { h: 'Architecture', w: '16%', c: (p) => p.arch },
  { h: 'Packages Type', w: '17%', c: (p) => p.type },
];

/* Registry Deployment › Registry Templates — 185: Name · Description. */
const REGISTRY_TEMPLATES = REGISTRY_TEMPLATES_185;
const REG_COLS: Col<(typeof REGISTRY_TEMPLATES)[number]>[] = [
  { h: 'Name', w: '38%', c: (r) => <span className="text-[13px] text-[#364658]">{r.name}</span> },
  { h: 'Description', c: (r) => r.description },
];

/* Patches — 185: ID · Name · Patch Category · Severity · Approval Status · Application ·
   Release Date · KB Number · Download Size · UUID. */
type PatchRow = (typeof PATCHES_185)[number];
const PATCH_COLS: Col<PatchRow>[] = [
  { h: 'ID', w: '96px', c: (p) => greyPill(p.id) },
  { h: 'Name', w: '300px', c: (p) => <span className="text-[13px] text-[#364658]">{clip(p.name, 290)}</span> },
  { h: 'Patch Category', w: '140px', c: (p) => nowrap(p.category) },
  { h: 'Severity', w: '110px', c: (p) => <span className="inline-flex items-center gap-1.5 whitespace-nowrap"><span className="size-2 rounded-full" style={{ backgroundColor: sevDot(p.severity) }} />{p.severity}</span> },
  { h: 'Approval Status', w: '130px', c: (p) => <span className="inline-flex items-center gap-1.5 whitespace-nowrap"><span className="size-2 rounded-full" style={{ backgroundColor: p.approval === 'Approved' ? '#22C55E' : '#94A3B8' }} />{p.approval}</span> },
  { h: 'Application', w: '190px', c: (p) => clip(p.application, 180) },
  { h: 'Release Date', w: '190px', c: (p) => nowrap(p.releaseDate) },
  { h: 'KB Number', w: '100px', c: (p) => <span className="tabular-nums">{p.kb}</span> },
  { h: 'Download Size', w: '120px', c: (p) => <span className="whitespace-nowrap tabular-nums">{p.size}</span> },
  { h: 'UUID', w: '160px', c: (p) => clip(p.uuid, 150) },
];
const patchKb = (p: PatchRow) => p.kb;

/* Remote offices — 185's picker: Name · Communication Type · Distribution Server IP · Port ·
   Managed Endpoint; the box on the form: Remote Office · Filter Applied. */
const officeRow = (o: string) => OFFICES_185.find((x) => x.id === o) ?? { id: o, comm: '---', dsIp: '---', port: '---', managed: 0 };
type OfficeRow = ReturnType<typeof officeRow>;
const OFFICE_PICK_COLS: Col<OfficeRow>[] = [
  { h: 'Name', c: (o) => <span className="flex items-center gap-2"><Building2 size={15} className="flex-shrink-0 text-[#7B8FA5]" /><span className="whitespace-nowrap text-[13px] text-[#364658]">{o.id}</span></span> },
  { h: 'Communication Type', w: '18%', c: (o) => nowrap(o.comm) },
  { h: 'Distribution Server IP', w: '19%', c: (o) => <span className="tabular-nums">{o.dsIp}</span> },
  { h: 'Port', w: '9%', c: (o) => o.port },
  { h: 'Managed Endpoint', w: '15%', c: (o) => <span className="tabular-nums">{o.managed}</span> },
];
const OFFICE_BOX_COLS: Col<OfficeRow>[] = [
  { h: 'Remote Office', c: OFFICE_PICK_COLS[0].c },
  { h: 'Filter Applied', w: '40%', c: () => 'No' },
];

/* Endpoints — 185: Endpoint ID · Host Name · IP Address · Poller · Agent Created By · OS Name ·
   Version · Service Pack · Architecture · Reboot Required · Remote Office. */
type EndpointRow = (typeof ENDPOINTS_185)[number];
const EP_COLS: Col<EndpointRow>[] = [
  { h: 'Endpoint ID', w: '110px', c: (c) => <span className="flex items-center gap-2">{agentDot()}{greyPill(c.id)}</span> },
  { h: 'Host Name', w: '160px', c: (c) => clip(c.hostName, 150) },
  { h: 'IP Address', w: '120px', c: (c) => <span className="tabular-nums">{c.ipAddress}</span> },
  { h: 'Poller', w: '80px', c: (c) => dash(c.poller) },
  { h: 'Agent Credential Profile', w: '160px', c: (c) => c.credentialProfile },
  { h: 'OS Name', w: '230px', c: (c) => clip(c.osName, 220) },
  { h: 'Version', w: '90px', c: (c) => c.version },
  { h: 'Service Pack', w: '100px', c: (c) => c.servicePack },
  { h: 'Architecture', w: '100px', c: (c) => nowrap(c.architecture) },
  { h: 'Reboot Required', w: '120px', c: (c) => c.reboot },
  { h: 'Remote Office', w: '140px', c: (c) => <span className="whitespace-nowrap rounded-sm bg-[#EEF2F6] px-1.5 py-0.5 text-[12px] text-[#364658]">{c.office}</span> },
];

/* Link Assets — 185's drawer: an Asset Type choice, then Name · Asset Type · Status · Host Name ·
   IP Address · Used By. One shape for all four kinds. */
interface AssetRow { id: string; name: string; assetType: string; status: string; hostName: string; ipAddress: string; usedBy: string; kind: AssetKind }
const assetPool = (): AssetRow[] => [
  ...ASSETS_185.map((a) => ({ ...a, kind: 'Hardware' as AssetKind })),
  ...softwareAssets.map((a) => ({ id: a.id, name: a.name, assetType: a.assetType, status: a.status, hostName: '---', ipAddress: '---', usedBy: '---', kind: 'Software' as AssetKind })),
  ...nonItAssets.map((a) => ({ id: a.id, name: a.name, assetType: a.assetType, status: a.status, hostName: '---', ipAddress: '---', usedBy: a.usedBy ?? '---', kind: 'Non-IT' as AssetKind })),
  ...consumableAssets.map((a) => ({ id: a.id, name: a.name, assetType: a.assetType, status: 'In Stock', hostName: '---', ipAddress: '---', usedBy: '---', kind: 'Consumable' as AssetKind })),
];
const ASSET_COLS: Col<AssetRow>[] = [
  { h: 'Name', w: '280px', c: (a) => <span className="flex min-w-0 items-center gap-2">{greyPill(a.id)}{clip(a.name, 190)}</span> },
  { h: 'Asset Type', w: '140px', c: (a) => nowrap(a.assetType) },
  { h: 'Status', w: '110px', c: (a) => <span className="inline-flex items-center gap-1.5 whitespace-nowrap"><span className="size-2 rounded-full bg-[#22C55E]" />{a.status}</span> },
  { h: 'Host Name', w: '150px', c: (a) => clip(dash(a.hostName), 140) },
  { h: 'IP Address', w: '120px', c: (a) => <span className="tabular-nums">{dash(a.ipAddress)}</span> },
  { h: 'Used By', w: '160px', c: (a) => clip(dash(a.usedBy), 150) },
];

/* Link CI — 185: Name · CI Type · Status · Host Name · IP Address. */
type CiRow = (typeof CIS_185)[number];
const CI_COLS: Col<CiRow>[] = [
  { h: 'Name', w: '260px', c: (c) => <span className="flex min-w-0 items-center gap-2">{greyPill(c.id)}{clip(c.name, 170)}</span> },
  { h: 'CI Type', w: '150px', c: (c) => nowrap(c.ciType) },
  { h: 'Status', w: '130px', c: (c) => <span className="inline-flex items-center gap-1.5 whitespace-nowrap"><span className="size-2 rounded-full bg-[#64748B]" />{c.status}</span> },
  { h: 'Host Name', w: '160px', c: (c) => clip(dash(c.hostName), 150) },
  { h: 'IP Address', w: '120px', c: (c) => <span className="tabular-nums">{dash(c.ipAddress)}</span> },
  { h: 'Created Date', w: '190px', c: (c) => nowrap(c.createdDate) },
];

/* Software License › Managed Software — 185's "Add Asset" drawer (Software Assets) and the box it
   fills share these columns: Name · Asset Type · Status · Version · Software Type · Managed By Group ·
   Managed By · Created Date · Category · Software Category · Vendor. Our software assets carry no
   created date, category or vendor, so those read ---. */
type SwRow = (typeof softwareAssets)[number];
const SW_COLS: Col<SwRow>[] = [
  { h: 'Name', w: '280px', c: (a) => <span className="flex min-w-0 items-center gap-2">{greyPill(a.id)}{clip(a.name, 190)}</span> },
  { h: 'Asset Type', w: '120px', c: (a) => nowrap(a.assetType) },
  { h: 'Status', w: '100px', c: (a) => <span className="inline-flex items-center gap-1.5 whitespace-nowrap"><span className="size-2 rounded-full bg-[#22C55E]" />{a.status}</span> },
  { h: 'Version', w: '130px', c: (a) => clip(a.version, 120) },
  { h: 'Software Type', w: '120px', c: (a) => nowrap(a.softwareType) },
  { h: 'Managed By Group', w: '160px', c: (a) => clip(a.managedByGroup, 150) },
  { h: 'Managed By', w: '140px', c: (a) => clip(a.managedBy.name, 130) },
  { h: 'Created Date', w: '120px', c: () => '---' },
  { h: 'Category', w: '110px', c: () => '---' },
  { h: 'Software Category', w: '150px', c: (a) => clip(dash(a.softwareCategory), 140) },
  { h: 'Vendor', w: '110px', c: () => '---' },
];

/* The email fields suggest the people list — the value is the address, the row reads "Name (email)". */
const EMAIL_PEOPLE = PEOPLE_185.filter((p) => p.email.includes('@')).map((p) => ({ value: p.email, label: p.name, sub: p.email, kind: 'person' as const, initials: p.initials }));

const toPicker = <T,>(cols: Col<T>[]): PickerColumn<T & { id: string }>[] => cols.map((c) => ({ header: c.h, cell: (r) => <span className="text-[13px] text-[#364658]">{c.c(r)}</span> }));

/** The chosen records in a box: the drawer's columns, plus Actions (remove). Columns given in px
 *  set the table's minimum width, so a wide set scrolls sideways inside the box. */
function RecordTable<T extends { id: string }>({ cols, rows, onRemove }: { cols: Col<T>[]; rows: T[]; onRemove: (id: string) => void }) {
  const fixed = cols.every((c) => c.w?.endsWith('px'));
  const minW = fixed ? cols.reduce((s, c) => s + parseInt(c.w!, 10), 0) + 72 : 620;
  return (
    <BoxTable heads={[...cols.map((c) => c.h), 'Actions']} widths={[...cols.map((c) => c.w ?? ''), '72px']} minW={minW}>
      {rows.map((r) => (
        <tr key={r.id} className="group/row">
          {cols.map((c, i) => <td key={i} className={td}>{c.c(r)}</td>)}
          <td className="px-2 py-1.5"><RemoveBtn onClick={() => onRemove(r.id)} /></td>
        </tr>
      ))}
    </BoxTable>
  );
}

export function ModuleCreatePage({ spec, target, onClose, embedded }: { spec: ModuleSpec; target: CreateTarget; onClose: () => void; embedded?: boolean }) {
  const [v, setV] = useState<Values>(() => initialValues(spec, target.preset));
  const [tried, setTried] = useState<null | 'primary' | 'secondary'>(null);
  const [picker, setPicker] = useState<null | string>(null);
  /* Link Assets shows one asset kind at a time, like the product's Asset Type choice. */
  const [linkKind, setLinkKind] = useState<AssetKind>('Hardware');
  /* V2 / V3 show the form one STEP at a time (createFormUi.ts); V1 and the comparison page do not. */
  const ui = useCreateFormUi();
  const stepDefs = !embedded && (ui === 'v2' || ui === 'v3') ? FORM_STEPS[spec.id] : undefined;
  /* V4 / V5 show the SAME merged groups on ONE screen — no step to click between. */
  const groupDefs = !embedded && (ui === 'v4' || ui === 'v5') ? FORM_STEPS[spec.id] : undefined;
  /** V4: groups whose optional fields are showing ("More options"), or an optional group added from its chip. */
  const [moreOpen, setMoreOpen] = useState<string[]>([]);
  const [step, setStep] = useState(0);
  /** Steps whose errors are shown — the ones Next was pressed on. Jumping around the stepper only browses. */
  const [checked, setChecked] = useState<number[]>([]);

  const set = (key: string, value: unknown) => setV((x) => {
    const next = { ...x, [key]: value };
    /* An OS upgrade only installs, and its payload is an image, not patches. */
    if (key === 'category' && value === 'OS Upgrade') next.configType = 'Install';
    if (key === 'appScope' && value === 'All applications') next.applications = [];
    const tf = spec.sections.flatMap((s) => s.fields ?? []).find((f) => f.key === key && f.fills);
    if (tf && typeof value === 'string' && tf.fills![value]) Object.assign(next, tf.fills![value]);
    if (key === 'category' && value !== x.category) { next.patches = []; next.osImage = []; }
    /* Add Asset from the header + menu: the type picked decides the kind, and a status the new
       kind does not have falls back to its first one. */
    if (key === 'assetType' && freeKind && typeof value === 'string' && value.includes('|')) {
      const [k, t] = value.split('|');
      next.assetType = t;
      next.assetKind = k;
      const statuses = assetOptions.statuses(k as AssetKind).map((o) => o.value);
      if (!statuses.includes(String(x.status))) next.status = statuses.includes('In Use') ? 'In Use' : statuses[0];
    }
    return next;
  });
  const arr = (key: string) => (Array.isArray(v[key]) ? (v[key] as string[]) : []);

  const kind = (v.assetKind as AssetKind) ?? 'Hardware';
  /* Opened without a kind (the header + menu, away from an asset listing): Asset Type offers every
     kind's types, grouped, and its value carries the kind. */
  const freeKind = spec.id === 'asset' && !target.preset?.assetKind;
  /* Asset Type and Status are declared without options in the spec — they follow the asset kind. */
  const optionsFor = (f: FieldSpec): SelectOption[] => {
    if (freeKind && f.key === 'assetType') return assetOptions.allTypes();
    if (spec.id === 'asset' && f.key === 'assetType') return assetOptions.types(kind);
    if (spec.id === 'asset' && f.key === 'status') return assetOptions.statuses(kind);
    if (spec.id === 'ci' && f.key === 'status') return ciStatuses();
    return f.options ? f.options(v) : [];
  };

  /* ── Validation: the first missing thing, per field, in page order. ── */
  const blockCount = (b: BlockKind): number => {
    if (b === 'targets') return arr('offices').length + arr('endpoints').length;
    if (b === 'patchPayload') return v.category === 'OS Upgrade' ? arr('osImage').length : arr('patches').length;
    if (b === 'linked') return arr('assets').length + arr('cis').length;
    if (b === 'scopedApps') return arr('applications').length;
    if (b === 'poItems') return ((v.items as Item[]) ?? []).length;
    if (b === 'conditions') return ((v.conditions as unknown[]) ?? []).length;
    return arr(b).length;
  };
  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    const order: string[] = [];
    for (const s of spec.sections) {
      if (!visible(s, v)) continue;
      for (const f of s.fields ?? []) {
        if (!visible(f, v) || !f.required || f.kind === 'switch') continue;
        if (isEmpty(v[f.key])) { e[f.key] = ['select', 'multi', 'person', 'requester', 'pills'].includes(f.kind) ? `Choose the ${f.label.toLowerCase()}` : f.kind === 'date' || f.kind === 'datetime' || f.kind === 'time' ? `Pick the ${f.label.toLowerCase()}` : `Enter the ${f.label.toLowerCase()}`; order.push(f.key); }
      }
      if (s.block && s.blockRequired && (!s.blockWhen || s.blockWhen(v)) && blockCount(s.block) === 0) {
        const t = resolve(s.title, v);
        e[`block:${s.block}`] = `Add at least one to ${t.toLowerCase()}`; order.push(`block:${s.block}`);
      }
    }
    const c = spec.check?.(v);
    if (c && !e[c.key]) { e[c.key] = c.msg; order.push(c.key); }
    return { e, first: order[0] };
  }, [v, spec]);
  /* ── Steps (V2 / V3): each merges the spec sections it lists. A step whose sections are not open
     yet (Target endpoints before anything is deployed) STAYS in the stepper — a step count that jumps
     reads as a bug — and says what opens it. ── */
  const steps = (stepDefs ?? [])
    .map((d) => ({ ...d, secs: spec.sections.filter((s) => visible(s, v) && d.sections.includes(resolve(s.title, v))) }))
    .filter((d) => d.secs.length > 0 || spec.sections.some((s) => d.sections.includes(resolve(s.title, v))));
  const stepped = steps.length > 0;
  const keysOf = (secs: SectionSpec[]) => secs.flatMap((s) => [...(s.fields ?? []).map((f) => f.key), ...(s.block ? ['block:' + s.block] : [])]);
  const stepErrs = steps.map((d) => keysOf(d.secs).filter((k) => errors.e[k]));
  const cur = Math.min(step, Math.max(steps.length - 1, 0));
  const stepOf = (key: string) => Math.max(0, steps.findIndex((d) => keysOf(d.secs).includes(key)));
  const markChecked = (i: number) => setChecked((x) => (x.includes(i) ? x : [...x, i]));
  const goStep = (i: number) => setStep(i);
  const nextStep = () => {
    if (stepErrs[cur]?.length) { markChecked(cur); requestAnimationFrame(() => document.querySelector('[data-form-error]')?.scrollIntoView({ behavior: 'smooth', block: 'center' })); return; }
    markChecked(cur); setStep(cur + 1);
  };
  useEffect(() => { document.querySelector('[data-create-scroll]')?.scrollTo({ top: 0 }); }, [cur]);

  /* Save as Draft needs only a name; everything else can be finished later. */
  const draftError = isEmpty(v[spec.nameKey]) ? { [spec.nameKey]: 'Enter a name to save a draft' } : {};
  const shownErrors: Record<string, string> = tried === 'primary' ? errors.e : tried === 'secondary' ? draftError
    : stepped ? Object.fromEntries(checked.flatMap((i) => (stepErrs[i] ?? []).map((k) => [k, errors.e[k]]))) : {};
  const headerError = tried === 'primary' && errors.first ? errors.e[errors.first] : tried === 'secondary' && draftError[spec.nameKey] ? 'Give it a name before saving a draft' : undefined;

  const save = (via: 'primary' | 'secondary') => {
    setTried(via);
    const bad = via === 'primary' ? !!errors.first : !!draftError[spec.nameKey];
    if (bad) {
      /* Stepped: open the step holding the first problem. */
      if (stepped) setStep(stepOf(via === 'primary' ? errors.first! : spec.nameKey));
      requestAnimationFrame(() => document.querySelector('[data-form-error]')?.closest('section')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
      return;
    }
    /* An asset whose kind was picked on the form lands in that kind's listing, in its id format. */
    const dest = freeKind ? { ...target, ...ASSET_TARGETS[kind] } : target;
    const rec = addCreatedRecord(dest.target, { ...v }, via, dest.idOf ?? spec.idOf, dest.seqStart ?? spec.seqStart);
    const name = String(v[spec.nameKey] ?? '').trim();
    const verb = via === 'secondary' ? 'saved as draft' : spec.cta === 'Publish' ? 'published' : 'created';
    toast.success(`${rec.id} ${verb} — “${name}”`);
    onClose();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); save('primary'); }
      if (e.key === 'Escape' && !picker && !document.querySelector('[data-rule-menu]')) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  /* ── One field ── */
  const renderField = (f: FieldSpec) => {
    const err = shownErrors[f.key];
    const bad = !!err;
    const val = v[f.key];
    const locked = f.lockedBy?.(v);
    const hint = locked ?? f.hint?.(v);
    /* A template's fills can be undone: a small icon at the label's right end, not a link under the field. */
    const action = f.fills && val ? (
      <Tooltip><TooltipTrigger asChild>
        <button type="button" aria-label="Reset to default" onClick={() => setV(initialValues(spec, target.preset))} className="flex size-6 items-center justify-center rounded text-[#7B8FA5] transition-colors hover:bg-[#EEF2F6] hover:text-[#3D8BD0]"><RotateCcw size={13} /></button>
      </TooltipTrigger><TooltipContent side="top">Reset to default</TooltipContent></Tooltip>
    ) : undefined;
    const wide = f.wide || f.kind === 'rich' || f.kind === 'files' || f.kind === 'tags' || f.kind === 'emails' || f.kind === 'textarea';
    let control: React.ReactNode;
    switch (f.kind) {
      /* A switch is a field like any other: its label above it, in its own section, half width —
         not a full-width row with the switch pushed to the far edge. */
      case 'switch':
        control = <div className="flex h-8 items-center"><ToggleSwitch on={!!val} onChange={(on) => set(f.key, on)} title={f.label} /></div>;
        break;
      case 'text':
        control = <input value={(val as string) ?? ''} onChange={(e) => set(f.key, e.target.value)} placeholder={f.placeholder ?? f.label} className={`${inputCls} ${bad ? '!border-[#F25C4E]' : ''}`} />;
        break;
      case 'number':
        control = <input type="number" min={0} value={(val as string) ?? ''} onChange={(e) => set(f.key, e.target.value)} placeholder={f.placeholder ?? '0'} className={`${inputCls} ${bad ? '!border-[#F25C4E]' : ''}`} />;
        break;
      case 'list': {
        /* 185's License Key: one input per key and a + under them for another. */
        const items = arr(f.key).length ? arr(f.key) : [''];
        const put = (i: number, s: string) => set(f.key, items.map((x, j) => (j === i ? s : x)));
        control = (
          <div className="space-y-2">
            {items.map((x, i) => (
              <div key={i} className="flex items-center gap-2">
                <input value={x} onChange={(e) => put(i, e.target.value)} placeholder={f.placeholder} className={`${inputCls} min-w-0 flex-1`} />
                {items.length > 1 && <RemoveBtn onClick={() => set(f.key, items.filter((_, j) => j !== i))} />}
              </div>
            ))}
            <button type="button" onClick={() => set(f.key, [...items, ''])} className="inline-flex items-center gap-1 text-[12px] font-medium text-[#3D8BD0] hover:underline"><Plus size={13} /> Add another key</button>
          </div>
        );
        break;
      }
      case 'textarea':
        control = <textarea value={(val as string) ?? ''} onChange={(e) => set(f.key, e.target.value)} placeholder={f.placeholder ?? `Write ${f.label.toLowerCase()}`} rows={3} className={`${inputCls} h-auto resize-y py-2 leading-[18px] ${bad ? '!border-[#F25C4E]' : ''}`} />;
        break;
      case 'rich':
        control = <RichTextField value={(val as string) ?? ''} onChange={(t) => set(f.key, t)} tall={f.key === 'content'} invalid={bad} placeholder={f.key === 'content' ? 'Write the article' : undefined} />;
        break;
      case 'date':
      case 'datetime':
      case 'time':
        control = <input type={f.kind === 'date' ? 'date' : f.kind === 'time' ? 'time' : 'datetime-local'} value={(val as string) ?? ''} onChange={(e) => set(f.key, e.target.value)} className={`${inputCls} ${bad ? '!border-[#F25C4E]' : ''}`} />;
        break;
      case 'select':
      case 'person':
      case 'requester': {
        const o = optionsFor(f);
        control = <RuleSelect className="!rounded" searchable={o.length > 6} value={val ? [freeKind && f.key === 'assetType' ? `${kind}|${val}` : String(val)] : []} options={o} onChange={(x) => set(f.key, x[0] ?? '')} invalid={bad} placeholder={f.kind === 'select' ? 'Select' : 'Search people'} />;
        break;
      }
      case 'multi': {
        const o = optionsFor(f);
        const po = o.map((x) => ({ value: x.value, label: x.label, sub: x.hint, group: x.group, kind: x.avatar ? 'person' as const : undefined, initials: x.avatar?.initials }));
        control = <MultiPickField value={arr(f.key)} options={po} onChange={(x) => set(f.key, x)} invalid={bad} placeholder="Select" />;
        break;
      }
      case 'people': {
        const o = optionsFor(f).map((x) => ({ value: x.value, label: x.label, sub: x.hint, group: x.group, kind: x.avatar ? 'person' as const : 'group' as const, initials: x.avatar?.initials }));
        control = <MultiPickField value={arr(f.key)} options={o} onChange={(x) => set(f.key, x)} invalid={bad} placeholder="Select" />;
        break;
      }
      case 'multipick': {
        const o = optionsFor(f).map((x) => ({ value: x.value, label: x.label }));
        control = <MultiPickField value={arr(f.key).filter((x) => o.some((y) => y.value === x))} options={o} onChange={(x) => set(f.key, x)} invalid={bad} placeholder={'Select ' + f.label.toLowerCase()} />;
        break;
      }
      case 'pills':
        control = <div className="pt-px"><Pills value={(val as string) ?? ''} options={optionsFor(f).map((o) => ({ value: o.value, label: o.label }))} onChange={(x) => set(f.key, x)} disabled={!!locked} /></div>;
        break;
      case 'amount':
        control = (
          <div className="flex gap-2">
            <input type="number" min={0} value={(val as string) ?? ''} onChange={(e) => set(f.key, e.target.value)} placeholder="0.00" className={`${inputCls} min-w-0 flex-1`} />
            <div className="w-[96px] flex-shrink-0"><RuleSelect className="!rounded" value={[String(v[`${f.key}Currency`] ?? 'INR')]} options={['INR', 'USD', 'EUR', 'GBP'].map((c) => ({ value: c, label: c }))} onChange={(x) => set(`${f.key}Currency`, x[0])} /></div>
          </div>
        );
        break;
      case 'tags':
        control = <MultiPickField mode="tag" value={arr(f.key)} options={(TAG_SUGGESTIONS[spec.id] ?? []).map((t) => ({ value: t, label: t }))} onChange={(x) => set(f.key, x)} invalid={bad} placeholder="Add tags" />;
        break;
      case 'emails':
        control = <MultiPickField mode="email" value={arr(f.key)} options={EMAIL_PEOPLE} onChange={(x) => set(f.key, x)} invalid={bad} placeholder="Add emails" />;
        break;
      case 'files':
        control = <FilesField files={(val as PickedFile[]) ?? []} onChange={(x) => set(f.key, x)} invalid={bad} />;
        break;
    }
    return <FormField key={f.key} label={f.label} required={f.required} error={err} hint={hint} wide={wide} action={action}>{control}</FormField>;
  };

  /* ── Record blocks ── */
  const blockErr = (b: BlockKind) => shownErrors[`block:${b}`];
  const remove = (key: string, id: string) => set(key, arr(key).filter((x) => x !== id));

  const renderBlock = (s: SectionSpec, b: BlockKind) => {
    const invalid = !!blockErr(b);
    const req = !!s.blockRequired;
    switch (b) {
      case 'applications': {
        const apps = OS_APPLICATIONS.filter((x) => arr('applications').includes(x.id));
        return (
          <TargetBox title="Applications" count={apps.length} addLabel="Add Applications" onAdd={() => setPicker('applications')} emptyArt={<EmptyPatchesArt />} emptyText="No applications yet — add the operating systems and applications this patch is for.">
            <RecordTable cols={APP_COLS} rows={apps} onRemove={(id) => remove('applications', id)} />
          </TargetBox>
        );
      }
      case 'scopedApps': {
        const include = v.appScope === 'Include applications';
        const apps = AUTO_APPLICATIONS.filter((x) => arr('applications').includes(x.id));
        return (
          <TargetBox title="Applications" required count={apps.length} addLabel="Add Applications" onAdd={() => setPicker('scopedApps')} invalid={invalid} emptyArt={<EmptyPatchesArt />}
            emptyText={include ? 'No applications yet — only patches for the applications you add are picked up.' : 'No applications yet — patches for the applications you add are skipped; everything else is picked up.'}>
            <RecordTable cols={APP_COLS} rows={apps} onRemove={(id) => remove('applications', id)} />
          </TargetBox>
        );
      }
      case 'linked': {
        const assets = assetPool().filter((a) => arr('assets').includes(a.id));
        const cis = CIS_185.filter((c) => arr('cis').includes(c.id));
        return (
          <div className="space-y-4">
            <TargetBox title="Assets" count={assets.length} addLabel="Link Assets" onAdd={() => setPicker('assets')} emptyArt={<EmptyAssetsArt />} emptyText="No assets linked — link the laptops, servers or devices this affects, so their history shows it.">
              <RecordTable cols={ASSET_COLS} rows={assets} onRemove={(id) => remove('assets', id)} />
            </TargetBox>
            <TargetBox title="Configuration Items" count={cis.length} addLabel="Link CI" onAdd={() => setPicker('cis')} emptyArt={<EmptyCisArt />} emptyText="No configuration items linked — link the services, servers or applications this touches, so its impact shows on the dependency map.">
              <RecordTable cols={CI_COLS} rows={cis} onRemove={(id) => remove('cis', id)} />
            </TargetBox>
          </div>
        );
      }
      case 'targets': {
        const offices = arr('offices');
        const eps = ENDPOINTS_185.filter((c) => arr('endpoints').includes(c.id));
        const resolved = new Set([...ENDPOINTS_185.filter((c) => offices.includes(c.office)).map((c) => c.id), ...eps.map((c) => c.id)]);
        return (
          <div className="space-y-4">
            <TargetBox title="Remote Offices" required={req} count={offices.length} addLabel="Add Remote Office" onAdd={() => setPicker('offices')} invalid={invalid} emptyArt={<EmptyOfficesArt />} emptyText="No remote offices yet — every endpoint in an office you add is targeted, including machines that join it later.">
              <RecordTable cols={OFFICE_BOX_COLS} rows={offices.map(officeRow)} onRemove={(id) => remove('offices', id)} />
            </TargetBox>
            <TargetBox title="Endpoints" required={req} count={eps.length} addLabel="Add Endpoints" onAdd={() => setPicker('endpoints')} invalid={invalid} emptyArt={<EmptyEndpointsArt />} emptyText="No endpoints added one by one — add single machines on top of any offices above, wherever they sit.">
              <Paginated rows={eps} perPage={10}>
                {(rows) => <RecordTable cols={EP_COLS} rows={rows} onRemove={(id) => remove('endpoints', id)} />}
              </Paginated>
            </TargetBox>
            {resolved.size > 0 && (
              <p className="flex items-center gap-1.5 text-[12px] text-[#64748B]"><Info size={13} className="flex-shrink-0 text-[#7B8FA5]" /><span><span className="font-semibold text-[#364658]">{resolved.size}</span> endpoint{resolved.size === 1 ? '' : 's'} will be targeted</span></p>
            )}
          </div>
        );
      }
      case 'patchPayload': {
        if (v.category === 'OS Upgrade') {
          const imgs = OS_IMAGES.filter((i) => arr('osImage').includes(i.id));
          return (
            <TargetBox title="OS Upgrade Patch" required count={imgs.length} addLabel={imgs.length ? 'Change OS Upgrade Patch' : 'Add OS Upgrade Patch'} onAdd={() => setPicker('osImage')} invalid={invalid} emptyArt={<EmptyPatchesArt />} emptyText="No OS upgrade patch yet — choose the one image this run installs. Only images whose ISO has finished uploading are offered.">
              <BoxTable heads={['OS Image', 'Platform', 'Architecture', 'Size', '']} widths={['', '16%', '16%', '12%', '48px']}>
                {imgs.map((i) => (
                  <tr key={i.id} className="group/row">
                    <td className="px-4 py-2.5"><span className="flex min-w-0 items-center gap-2">{pill(i.id)}<span className="truncate text-[13px] text-[#364658]">{i.title}</span></span></td>
                    <td className={td}>{i.platform}</td><td className={td}>{i.architecture}</td><td className={`${td} tabular-nums`}>{i.size}</td>
                    <td className="px-2 py-1.5 text-right"><RemoveBtn onClick={() => remove('osImage', i.id)} /></td>
                  </tr>
                ))}
              </BoxTable>
            </TargetBox>
          );
        }
        const ps = PATCHES_185.filter((p) => arr('patches').includes(p.id));
        return (
          <TargetBox title="Patches" required count={ps.length} addLabel="Add Patches" onAdd={() => setPicker('patches')} invalid={invalid} emptyArt={<EmptyPatchesArt />} emptyText="No patches yet — add the approved patches this run should install.">
            <RecordTable cols={PATCH_COLS} rows={ps} onRemove={(id) => remove('patches', id)} />
          </TargetBox>
        );
      }
      case 'packages': {
        const rows = PACKAGES.filter((x) => arr('packages').includes(x.id));
        const userType = (v.packageUserType as Record<string, string>) ?? {};
        const userCol: Col<(typeof PACKAGES)[number]> = {
          h: 'User Type', w: '17%',
          c: (p) => <div className="w-[120px]"><RuleSelect className="!rounded" compact value={[userType[p.id] ?? 'System']} options={['System', 'User'].map((x) => ({ value: x, label: x }))} onChange={(x) => set('packageUserType', { ...userType, [p.id]: x[0] ?? 'System' })} /></div>,
        };
        return (
          <TargetBox title="Packages" required={req} count={rows.length} addLabel="Add Packages" onAdd={() => setPicker('packages')} invalid={invalid} emptyArt={<EmptyPackagesArt />} emptyText="No packages yet — add the software this run installs or removes.">
            <RecordTable cols={[...PKG_COLS, userCol]} rows={rows} onRemove={(id) => remove('packages', id)} />
          </TargetBox>
        );
      }
      case 'registry': {
        const rows = REGISTRY_TEMPLATES.filter((x) => arr('registry').includes(x.id));
        return (
          <TargetBox title="Registry Templates" required={req} count={rows.length} addLabel="Add Templates" onAdd={() => setPicker('registry')} invalid={invalid} emptyArt={<EmptyRegistryArt />} emptyText="No registry templates yet — add the registry changes this run applies.">
            <RecordTable cols={REG_COLS} rows={rows} onRemove={(id) => remove('registry', id)} />
          </TargetBox>
        );
      }
      case 'poItems': {
        const items = (v.items as Item[]) ?? [];
        const setItem = (id: string, patch: Partial<Item>) => set('items', items.map((it) => (it.id === id ? { ...it, ...patch } : it)));
        const net = items.reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.price) || 0), 0);
        const tax = items.reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.price) || 0) * ((Number(it.tax) || 0) / 100), 0);
        const cur = String(v.currency ?? 'INR');
        const cell = 'h-8 w-full rounded border border-[#DFE5ED] bg-white px-2 text-right text-[12px] tabular-nums text-[#364658] focus:border-[#3D8BD0] focus:outline-none focus:ring-1 focus:ring-[#3D8BD0]';
        return (
          <TargetBox title="Items" count={items.length} addLabel="Add Items" onAdd={() => setPicker('items')} addReason={!v.vendor || !v.currency ? 'Choose the vendor and currency first' : undefined} emptyArt={<EmptyItemsArt />} emptyText={!v.vendor || !v.currency ? 'Choose the vendor and currency above first — the products listed are that vendor’s.' : 'No items yet — add what you are buying. Quantity, price and tax can be changed on each line.'}>
            <BoxTable heads={['Product', 'Quantity', `Price (${cur})`, 'Tax (%)', `Amount (${cur})`, '']} widths={['', '11%', '17%', '11%', '17%', '48px']} minW={760}>
              {items.map((it) => (
                <tr key={it.id} className="group/row">
                  <td className="px-4 py-2"><span className="block truncate text-[13px] text-[#364658]" title={it.name}>{it.name}</span></td>
                  <td className="px-2 py-2"><input type="number" min={1} value={it.qty} onChange={(e) => setItem(it.id, { qty: e.target.value })} className={cell} /></td>
                  <td className="px-2 py-2"><input type="number" min={0} value={it.price} onChange={(e) => setItem(it.id, { price: e.target.value })} className={cell} /></td>
                  <td className="px-2 py-2"><input type="number" min={0} value={it.tax} onChange={(e) => setItem(it.id, { tax: e.target.value })} className={cell} /></td>
                  <td className="px-4 py-2 text-right text-[13px] font-medium tabular-nums text-[#364658]">{money((Number(it.qty) || 0) * (Number(it.price) || 0) * (1 + (Number(it.tax) || 0) / 100))}</td>
                  <td className="px-2 py-1.5 text-right"><RemoveBtn onClick={() => set('items', items.filter((x) => x.id !== it.id))} /></td>
                </tr>
              ))}
              <tr className="bg-[#F9FAFB]">
                <td colSpan={4} className="px-4 py-2.5 text-right text-[12px] text-[#64748B]">Sub total {money(net)} · Tax {money(tax)}</td>
                <td className="px-4 py-2.5 text-right text-[13px] font-semibold tabular-nums text-[#364658]">{money(net + tax)}</td>
                <td />
              </tr>
            </BoxTable>
          </TargetBox>
        );
      }
      case 'managedSoftware': {
        const rows = softwareAssets.filter((a) => arr('managedSoftware').includes(a.id));
        return (
          <TargetBox title="Managed Software" required count={rows.length} addLabel="Add Asset" onAdd={() => setPicker('managedSoftware')} invalid={invalid} emptyArt={<EmptyAssetsArt />} emptyText="No software yet — add the software assets this license covers, so its installations are counted against it.">
            <RecordTable cols={SW_COLS} rows={rows} onRemove={(id) => remove('managedSoftware', id)} />
          </TargetBox>
        );
      }
      case 'conditions': {
        const conds = (v.conditions as { id: string; field: string; op: string; value: string }[]) ?? [];
        const fields = REPORT_COLUMNS[String(v.module).includes('asset') ? 'asset' : v.module === 'patch' ? 'patch' : 'default'];
        const setC = (id: string, patch: Record<string, string>) => set('conditions', conds.map((c) => (c.id === id ? { ...c, ...patch } : c)));
        const add = () => set('conditions', [...conds, { id: `c${Date.now()}`, field: '', op: 'is', value: '' }]);
        return (
          <TargetBox title="Conditions" count={conds.length} addLabel="Add Condition" onAdd={add} emptyArt={<EmptyConditionsArt />} emptyText="No conditions — the report counts every record in the date range. Add one to narrow it, e.g. Priority is High.">
            <div className="space-y-2 p-4">
              {conds.map((c, i) => (
                <div key={c.id} className="group/row flex items-center gap-2">
                  <span className="w-[44px] flex-shrink-0 text-[12px] font-medium text-[#7B8FA5]">{i === 0 ? 'Where' : 'And'}</span>
                  <div className="w-[34%] min-w-0"><RuleSelect className="!rounded" searchable value={c.field ? [c.field] : []} options={fields.map((x) => ({ value: x, label: x }))} onChange={(x) => setC(c.id, { field: x[0] ?? '' })} placeholder="Field" /></div>
                  <div className="w-[22%] min-w-0"><RuleSelect className="!rounded" value={[c.op]} options={CONDITION_OPERATORS.map((x) => ({ value: x, label: x }))} onChange={(x) => setC(c.id, { op: x[0] ?? 'is' })} /></div>
                  <input value={c.value} disabled={c.op.includes('empty')} onChange={(e) => setC(c.id, { value: e.target.value })} placeholder="Value" className={`${inputCls} min-w-0 flex-1 disabled:bg-[#F9FAFB]`} />
                  <RemoveBtn onClick={() => set('conditions', conds.filter((x) => x.id !== c.id))} />
                </div>
              ))}
            </div>
          </TargetBox>
        );
      }
      case 'columns': {
        const cols = arr('columns');
        const move = (i: number, d: number) => { const n = [...cols]; [n[i], n[i + d]] = [n[i + d], n[i]]; set('columns', n); };
        return (
          <TargetBox title="Columns" required={req} count={cols.length} addLabel="Select Columns" onAdd={() => setPicker('columns')} invalid={invalid} emptyArt={<EmptyColumnsArt />} emptyText="No columns yet — choose what each row of the report shows. The order here is the order in the report.">
            <BoxTable heads={['#', 'Column', '']} widths={['56px', '', '120px']} minW={420}>
              {cols.map((c, i) => (
                <tr key={c} className="group/row">
                  <td className={`${td} tabular-nums`}>{i + 1}</td>
                  <td className="px-4 py-2.5 text-[13px] text-[#364658]">{c}</td>
                  <td className="px-2 py-1.5">
                    <span className="flex items-center justify-end gap-0.5">
                      <button type="button" title="Move up" disabled={i === 0} onClick={() => move(i, -1)} className="inline-flex size-7 items-center justify-center rounded text-[#7B8FA5] hover:bg-[#EEF2F6] disabled:opacity-30"><ArrowUp size={14} /></button>
                      <button type="button" title="Move down" disabled={i === cols.length - 1} onClick={() => move(i, 1)} className="inline-flex size-7 items-center justify-center rounded text-[#7B8FA5] hover:bg-[#EEF2F6] disabled:opacity-30"><ArrowDown size={14} /></button>
                      <RemoveBtn onClick={() => remove('columns', c)} />
                    </span>
                  </td>
                </tr>
              ))}
            </BoxTable>
          </TargetBox>
        );
      }
    }
  };

  /* ── Pickers, one open at a time ── */
  const close = () => setPicker(null);
  const pickTo = (key: string) => (ids: string[]) => { set(key, ids); close(); };
  const reportFields = REPORT_COLUMNS[String(v.module).includes('asset') ? 'asset' : v.module === 'patch' ? 'patch' : 'default'];
  const overlays = (
    <>
      <PickerDrawer isOpen={picker === 'applications'} title="Add Os Component Applications" subtitle="The operating systems and applications this patch applies to." rows={OS_APPLICATIONS} selected={arr('applications')} searchOf={(x) => x.name}
        columns={toPicker(APP_COLS)} onClose={close} onApply={pickTo('applications')} />
      <PickerDrawer isOpen={picker === 'scopedApps'} title="Add Os Component Applications" subtitle={v.appScope === 'Include applications' ? 'Only patches for these are picked up.' : 'Patches for these are skipped.'} rows={AUTO_APPLICATIONS} selected={arr('applications')} searchOf={(x) => `${x.name} ${x.type}`}
        columns={toPicker(APP_COLS)} onClose={close} onApply={pickTo('applications')} />
      <PickerDrawer isOpen={picker === 'assets'} title="Link Assets" subtitle="The assets this record affects." rows={assetPool().filter((a) => a.kind === linkKind)} selected={arr('assets')} searchOf={(a) => `${a.id} ${a.name} ${a.assetType} ${a.hostName} ${a.ipAddress}`}
        filterBar={<div className="w-[200px]"><RuleSelect className="!rounded" value={[linkKind]} options={(['Hardware', 'Software', 'Non-IT', 'Consumable'] as AssetKind[]).map((k) => ({ value: k, label: `${k} Asset` }))} onChange={(x) => x[0] && setLinkKind(x[0] as AssetKind)} /></div>}
        columns={toPicker(ASSET_COLS)} onClose={close} onApply={(ids) => { set('assets', [...arr('assets').filter((id) => !assetPool().some((a) => a.id === id && a.kind === linkKind)), ...ids]); close(); }} />
      <PickerDrawer isOpen={picker === 'managedSoftware'} title="Add Asset" subtitle="Software Assets" rows={softwareAssets} selected={arr('managedSoftware')} searchOf={(a) => `${a.id} ${a.name} ${a.assetType} ${a.version} ${a.softwareType} ${a.managedByGroup} ${a.managedBy.name} ${a.softwareCategory}`}
        columns={toPicker(SW_COLS)} onClose={close} onApply={pickTo('managedSoftware')} />
      <PickerDrawer isOpen={picker === 'cis'} title="Link CI" subtitle="The configuration items this record touches." rows={CIS_185} selected={arr('cis')} searchOf={(c) => `${c.id} ${c.name} ${c.ciType} ${c.hostName} ${c.ipAddress}`}
        columns={toPicker(CI_COLS)} onClose={close} onApply={pickTo('cis')} />
      <PickerDrawer isOpen={picker === 'offices'} title="Add Remote Office" subtitle="Every endpoint in an office is targeted, including machines that join it later." rows={OFFICES_185} selected={arr('offices')} searchOf={(o) => o.id}
        columns={toPicker(OFFICE_PICK_COLS)} onClose={close} onApply={pickTo('offices')} />
      <PickerDrawer isOpen={picker === 'endpoints'} title="Add Endpoints" subtitle="Single machines, on top of any offices you picked." rows={ENDPOINTS_185} selected={arr('endpoints')} searchOf={(c) => `${c.id} ${c.hostName} ${c.ipAddress} ${c.osName} ${c.office}`}
        columns={toPicker(EP_COLS)} onClose={close} onApply={pickTo('endpoints')} />
      <PickerDrawer isOpen={picker === 'patches'} title="Add Patches" subtitle="Only approved patches can be deployed." rows={PATCHES_185} selected={arr('patches')} searchOf={(p) => `${p.id} ${p.name} ${p.severity} ${patchKb(p)}`}
        columns={toPicker(PATCH_COLS)} onClose={close} onApply={pickTo('patches')} />
      <PickerDrawer isOpen={picker === 'osImage'} single title="Choose OS Upgrade Patch" subtitle="One image per run. Only images whose ISO has finished uploading can be deployed." rows={OS_IMAGES.filter((i) => i.status === 'Uploaded')} selected={arr('osImage')} searchOf={(i) => `${i.id} ${i.title} ${i.platform}`}
        columns={[{ header: 'OS Image', cell: (i) => <span className="flex items-center gap-2">{pill(i.id)}<span className="block max-w-[420px] truncate text-[13px] font-medium" title={i.title}>{i.title}</span></span> }, { header: 'Platform', cell: (i) => i.platform }, { header: 'Size', cell: (i) => i.size }]}
        onClose={close} onApply={pickTo('osImage')} />
      <PickerDrawer isOpen={picker === 'packages'} title="Add Packages" subtitle="Packages in the package repository." rows={PACKAGES} selected={arr('packages')} searchOf={(x) => `${x.id} ${x.name} ${x.type}`}
        columns={toPicker(PKG_COLS)} onClose={close} onApply={pickTo('packages')} />
      <PickerDrawer isOpen={picker === 'registry'} title="Add Templates" subtitle="Registry templates set up for this tenant." rows={REGISTRY_TEMPLATES} selected={arr('registry')} searchOf={(x) => `${x.name} ${x.description}`}
        columns={toPicker(REG_COLS)} onClose={close} onApply={pickTo('registry')} />
      <PickerDrawer isOpen={picker === 'items'} title="Products" subtitle="Each product is added as a line of 1 — change the quantity on the order." rows={CATALOG} selected={((v.items as Item[]) ?? []).map((i) => i.id)} searchOf={(x) => `${x.id} ${x.name} ${x.type} ${x.maker}`}
        columns={[
          { header: 'ID', cell: (x) => greyPill(x.id) },
          { header: 'Name', cell: (x) => <span className="text-[13px] font-medium">{x.name}</span> },
          { header: 'Product Type', cell: (x) => x.type },
          { header: 'Manufacturer', cell: (x) => <span className="whitespace-nowrap">{x.maker}</span> },
          { header: 'Price', cell: (x) => <span className="tabular-nums">{money(x.price)}</span> },
          { header: 'Tax Rate (%)', cell: (x) => <span className="tabular-nums">{x.tax}</span> },
          { header: 'Warranty Period', cell: (x) => <span className="whitespace-nowrap">{x.warranty}</span> },
        ]}
        onClose={close}
        onApply={(ids) => {
          const items = (v.items as Item[]) ?? [];
          set('items', ids.map((id) => items.find((i) => i.id === id) ?? { id, name: CATALOG.find((c) => c.id === id)!.name, qty: '1', price: String(CATALOG.find((c) => c.id === id)!.price), tax: String(CATALOG.find((c) => c.id === id)!.tax) }));
          close();
        }} />
      <PickerDrawer isOpen={picker === 'columns'} title="Select Columns" subtitle="Columns are added in the order you tick them; reorder them on the form." rows={reportFields.map((c) => ({ id: c }))} selected={arr('columns')} searchOf={(x) => x.id}
        columns={[{ header: 'Column', cell: (x) => <span className="text-[13px] font-medium">{x.id}</span> }]}
        onClose={close}
        onApply={(ids) => { const kept = arr('columns').filter((c) => ids.includes(c)); set('columns', [...kept, ...ids.filter((c) => !kept.includes(c))]); close(); }} />
    </>
  );

  const actions = [
    ...(spec.secondary ? [{ label: spec.secondary, onClick: () => save('secondary') }] : []),
    { label: spec.cta, primary: true, onClick: () => save('primary') },
  ];

  /* ── V4 / V5: one screen, the merged groups of createFormSteps.ts, no stepping ── */
  if (groupDefs) {
    const groups = groupDefs
      .map((d) => ({ ...d, secs: spec.sections.filter((s) => visible(s, v) && d.sections.includes(resolve(s.title, v))) }))
      .filter((d) => d.secs.length > 0);
    const isReq = (f: FieldSpec) => !!f.required && f.kind !== 'switch';
    const fieldsOf = (g: (typeof groups)[number]) => g.secs.flatMap((s) => (s.fields ?? []).filter((f) => visible(f, v)));
    const blocksOf = (g: (typeof groups)[number]) => g.secs.filter((s) => s.block && (!s.blockWhen || s.blockWhen(v)));
    const blockEl = (s: SectionSpec, first: boolean) => (
      <div key={s.block} className={first ? '' : 'mt-4'}>
        {renderBlock(s, s.block!)}
        {blockErr(s.block!) && <p data-form-error className="mt-1.5 text-[11px] text-[#F25C4E]">{blockErr(s.block!)}</p>}
      </div>
    );
    const body = (fields: FieldSpec[], blocks: SectionSpec[]) => (
      <>
        {fields.length > 0 && <div className="grid grid-cols-2 gap-x-2 gap-y-4">{fields.map(renderField)}</div>}
        {blocks.map((s, i) => blockEl(s, !fields.length && i === 0))}
      </>
    );
    const toggle = (t: string) => setMoreOpen((x) => (x.includes(t) ? x.filter((y) => y !== t) : [...x, t]));

    if (ui === 'v4') {
      /* Essentials first: each part shows what is REQUIRED; its optional fields wait behind "More
         options"; a part that requires nothing is a "+ Add" chip at the foot. A field with an error
         is always shown, so a failed save never points at something hidden. */
      const parts = groups.map((g) => {
        const fields = fieldsOf(g); const blocks = blocksOf(g);
        const essF = fields.filter((f) => isReq(f) || shownErrors[f.key]);
        const essB = blocks.filter((s) => s.blockRequired || blockErr(s.block!));
        return { g, essF, essB, optF: fields.filter((f) => !essF.includes(f)), optB: blocks.filter((s) => !essB.includes(s)) };
      });
      const core = parts.filter((p) => p.essF.length || p.essB.length);
      const extra = parts.filter((p) => !p.essF.length && !p.essB.length);
      const secTitles = (g: (typeof groups)[number]) => g.secs.map((s) => resolve(s.title, v)).join('|');
      /* The guide's step numbers: a part folded to a chip is opened first. */
      const openFor = (titles: string[]) => {
        const p = extra.find((x) => x.g.secs.some((s) => titles.includes(resolve(s.title, v))));
        if (p && !moreOpen.includes(p.g.title)) toggle(p.g.title);
      };
      const names = (p: (typeof parts)[number]) => [...p.optF.map((f) => f.label), ...p.optB.map((s) => resolve(s.title, v))];
      return (
        <CreatePageShell title={spec.title(v)} onBack={onClose} error={headerError} actions={actions} overlays={overlays}
          aside={hasFormHelp(spec.id) ? <CreateFormHelp moduleId={spec.id} onOpen={openFor} available={groups.flatMap((g) => g.secs.map((s) => resolve(s.title, v)))} /> : undefined}>
          <p className="!mb-6 flex items-center gap-1.5 text-[12px] text-[#7B8FA5]"><Info size={13} className="flex-shrink-0" />Only what is needed is shown. Everything else is one click away under each part.</p>
          {core.map((p) => {
            const open = moreOpen.includes(p.g.title);
            const n = p.optF.length + p.optB.length;
            return (
              <section key={p.g.title} data-section-title={secTitles(p.g)}>
                <div className="mb-4">
                  <h2 className="text-[15px] font-semibold text-[#364658]">{p.g.title}</h2>
                  <p className="mt-px text-[12px] text-[#7B8FA5]">{p.g.sub}</p>
                </div>
                {body(p.essF, p.essB)}
                {n > 0 && (open ? (
                  <div className="mt-4 rounded-lg bg-[#F7F9FC] p-3">
                    <div className="mb-3 flex items-center">
                      <span className="text-[12px] font-semibold uppercase tracking-wider text-[#7B8FA5]">More options</span>
                      <button type="button" onClick={() => toggle(p.g.title)} className="ml-auto text-[12px] font-medium text-[#3D8BD0] hover:underline">Hide</button>
                    </div>
                    {body(p.optF, p.optB)}
                  </div>
                ) : (
                  <button type="button" onClick={() => toggle(p.g.title)} className="mt-3 flex max-w-full items-center gap-1.5 rounded px-1 py-0.5 text-left text-[12px] text-[#3D8BD0] hover:bg-[#EBF5FF]">
                    <ChevronDown size={14} className="flex-shrink-0" />
                    <span className="flex-shrink-0 font-medium">More options ({n})</span>
                    <span className="truncate text-[#7B8FA5]">· {names(p).slice(0, 4).join(', ')}{n > 4 ? '…' : ''}</span>
                  </button>
                ))}
              </section>
            );
          })}
          {extra.filter((p) => moreOpen.includes(p.g.title)).map((p) => (
            <section key={p.g.title} data-section-title={secTitles(p.g)}>
              <div className="mb-4 flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <h2 className="text-[15px] font-semibold text-[#364658]">{p.g.title} <span className="text-[12px] font-normal text-[#94A3B8]">· Optional</span></h2>
                  <p className="mt-px text-[12px] text-[#7B8FA5]">{p.g.sub}</p>
                </div>
                <button type="button" title="Hide" onClick={() => toggle(p.g.title)} className="flex size-7 items-center justify-center rounded text-[#7B8FA5] hover:bg-[#F3F4F6]"><X size={14} /></button>
              </div>
              {body(p.optF, p.optB)}
            </section>
          ))}
          {extra.some((p) => !moreOpen.includes(p.g.title)) && (
            <section>
              <p className="mb-2 text-[12px] font-semibold uppercase tracking-wider text-[#7B8FA5]">Optional — add only if you need it</p>
              <div className="flex flex-wrap gap-2">
                {extra.filter((p) => !moreOpen.includes(p.g.title)).map((p) => (
                  <button key={p.g.title} type="button" onClick={() => toggle(p.g.title)} title={p.g.sub}
                    className="flex h-8 items-center gap-1.5 rounded border border-dashed border-[#CBD5E1] px-3 text-[12px] font-medium text-[#364658] transition-colors hover:border-[#3D8BD0] hover:text-[#3D8BD0]">
                    <Plus size={13} />{p.g.title}
                  </button>
                ))}
              </div>
            </section>
          )}
        </CreatePageShell>
      );
    }

    /* V5: every part open; the summary on the right reads the record back live and holds Create. */
    const optLabel = (f: FieldSpec, x: unknown) => optionsFor(f).find((o) => o.value === x)?.label ?? String(x);
    const fmt = (f: FieldSpec, x: unknown): string | undefined => {
      if (isEmpty(x) || x === false) return undefined;
      if (x === true) return 'On';
      if (Array.isArray(x)) {
        if (f.kind === 'files') return `${x.length} file${x.length === 1 ? '' : 's'}`;
        const ls = x.map((y) => (typeof y === 'object' && y ? String((y as { name?: string; label?: string }).name ?? (y as { label?: string }).label ?? '') : optLabel(f, y))).filter(Boolean);
        return ls.length > 2 ? `${ls.slice(0, 2).join(', ')} +${ls.length - 2}` : ls.join(', ');
      }
      if (typeof x === 'object') return String((x as { name?: string }).name ?? '') || undefined;
      if ((f.kind === 'date' || f.kind === 'datetime') && typeof x === 'string') {
        const d = new Date(x);
        if (!isNaN(+d)) return d.toLocaleString('en-US', f.kind === 'date' ? { month: 'short', day: 'numeric', year: 'numeric' } : { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
      }
      const t = optLabel(f, x).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      return t || undefined;
    };
    const summary: SummaryGroup[] = groups.map((g) => {
      const fields = fieldsOf(g); const blocks = blocksOf(g);
      const lines = [
        ...fields.flatMap((f) => { const t = fmt(f, v[f.key]); return t ? [{ label: f.label, value: t }] : []; }),
        ...blocks.flatMap((s) => { const n = blockCount(s.block!); return n ? [{ label: resolve(s.title, v), value: `${n} added` }] : []; }),
      ];
      const missing = [
        ...fields.filter((f) => errors.e[f.key]).map((f) => f.label),
        ...blocks.filter((s) => errors.e[`block:${s.block}`]).map((s) => resolve(s.title, v)),
      ];
      return { title: g.title, lines, missing, optional: !fields.some(isReq) && !blocks.some((s) => s.blockRequired) };
    });
    const jump = (i: number) => {
      const el = document.getElementById(`cf-group-${i}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      window.setTimeout(() => [...(el?.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input:not([type=hidden]):not([type=checkbox]), textarea') ?? [])].find((x) => !x.value)?.focus({ preventScroll: true }), 400);
    };
    return (
      <CreatePageShell title={spec.title(v)} onBack={onClose} error={headerError} actions={[]} overlays={overlays}
        aside={<SummaryAside groups={summary} onJump={jump} cta={spec.cta} onCreate={() => save('primary')}
          secondary={spec.secondary} onSecondary={() => save('secondary')}
          guide={hasFormHelp(spec.id) ? <CreateFormHelp moduleId={spec.id} bare /> : undefined}
          noun={FORM_HELP[spec.id]?.noun ?? 'Record'} />}>
        {groups.map((g, i) => (
          <section key={g.title} id={`cf-group-${i}`} className="scroll-mt-4">
            <div className="mb-4 flex items-start gap-2.5">
              <span className="mt-px flex size-6 flex-shrink-0 items-center justify-center rounded-full bg-[#EEF2F6] text-[11.5px] font-semibold tabular-nums text-[#64748B]">{i + 1}</span>
              <div className="min-w-0">
                <h2 className="text-[15px] font-semibold text-[#364658]">{g.title}{summary[i].optional && <span className="text-[12px] font-normal text-[#94A3B8]"> · Optional</span>}</h2>
                <p className="mt-px text-[12px] text-[#7B8FA5]">{g.sub}</p>
              </div>
            </div>
            <div className="pl-[34px]">
              {g.secs.map((s, j) => {
                const fields = (s.fields ?? []).filter((f) => visible(f, v));
                const blocks = s.block && (!s.blockWhen || s.blockWhen(v)) ? [s] : [];
                return <div key={j} data-section-title={resolve(s.title, v)} className={j ? 'mt-4' : ''}>{body(fields, blocks)}</div>;
              })}
            </div>
          </section>
        ))}
      </CreatePageShell>
    );
  }

  if (stepped) {
    const d = steps[cur];
    const fields = d.secs.flatMap((s) => (s.fields ?? []).filter((f) => visible(f, v)));
    const items: StepItem[] = steps.map((x, i) => ({
      title: x.title, sub: x.sub,
      state: !x.secs.length ? 'todo' : stepErrs[i].length && (tried === 'primary' || checked.includes(i)) ? 'error' : !stepErrs[i].length && (i < cur || checked.includes(i)) ? 'done' : 'todo',
    }));
    const Shell = ui === 'v3' ? SteppedDrawerShell : SteppedPageShell;
    return (
      <Shell title={spec.title(v)} onBack={onClose} error={headerError} overlays={overlays}
        secondary={spec.secondary ? { label: spec.secondary, onClick: () => save('secondary') } : undefined}
        final={{ label: spec.cta, onClick: () => save('primary') }}
        steps={items} current={cur} onStep={goStep} onNext={nextStep}
        help={<CreateFormHelp moduleId={spec.id} bare={ui === 'v3'}
          available={steps.flatMap((x) => x.secs.map((s) => resolve(s.title, v)))}
          onOpen={(titles) => { const i = steps.findIndex((x) => x.secs.some((s) => titles.includes(resolve(s.title, v)))); if (i >= 0) setStep(i); }} />}>
        <Section title={d.title} sub={d.sub} marker={(d.secs.length ? d.secs.map((s) => resolve(s.title, v)) : d.sections).join('|')}>
          {!d.secs.length && (
            <p className="flex items-center gap-1.5 rounded-lg bg-[#F7F9FC] px-3 py-3 text-[12.5px] text-[#64748B]"><Info size={14} className="flex-shrink-0 text-[#7B8FA5]" />This step opens once the step before it has something added.</p>
          )}
          {fields.length > 0 && <div className="grid grid-cols-2 gap-x-2 gap-y-4">{fields.map(renderField)}</div>}
          {d.secs.filter((s) => s.block && (!s.blockWhen || s.blockWhen(v))).map((s) => (
            <div key={s.block} className={fields.length ? 'mt-4' : ''}>
              {renderBlock(s, s.block!)}
              {blockErr(s.block!) && <p data-form-error className="mt-1.5 text-[11px] text-[#F25C4E]">{blockErr(s.block!)}</p>}
            </div>
          ))}
        </Section>
      </Shell>
    );
  }

  return (
    <CreatePageShell title={spec.title(v)} onBack={onClose} error={headerError} actions={actions} overlays={overlays} embedded={embedded}
      aside={hasFormHelp(spec.id) ? <CreateFormHelp moduleId={spec.id} /> : undefined}>
      {spec.sections.filter((s) => visible(s, v)).map((s, i) => {
        const fields = (s.fields ?? []).filter((f) => visible(f, v));
        return (
          <Section key={i} title={resolve(s.title, v)} sub={s.sub ? resolve(s.sub, v) : undefined}>
            {fields.length > 0 && <div className="grid grid-cols-2 gap-x-2 gap-y-4">{fields.map(renderField)}</div>}
            {s.block && (!s.blockWhen || s.blockWhen(v)) && (
              <div className={fields.length ? 'mt-4' : ''}>
                {renderBlock(s, s.block)}
                {blockErr(s.block) && <p data-form-error className="mt-1.5 text-[11px] text-[#F25C4E]">{blockErr(s.block)}</p>}
              </div>
            )}
          </Section>
        );
      })}
      {spec.id === 'asset' && (
        <p className="-mt-6 flex items-center gap-1.5 text-[12px] text-[#7B8FA5]"><Info size={13} className="flex-shrink-0" />Host name, IP address and serial number are filled in by the agent once the asset is discovered.</p>
      )}
    </CreatePageShell>
  );
}

