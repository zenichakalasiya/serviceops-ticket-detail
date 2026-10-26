import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { TicketDrawer } from './TicketDrawer';
import { TicketDrawerV2 } from './TicketDrawerV2';
import { ProblemDrawer } from './ProblemDrawer';
import { ChangeDrawer } from './ChangeDrawer';
import { ReleaseDrawer } from './ReleaseDrawer';
import { HardwareAssetDrawer } from './HardwareAssetDrawer';
import { SoftwareAssetDrawer } from './SoftwareAssetDrawer';
import { NonItAssetDrawer } from './NonItAssetDrawer';
import { ConsumableAssetDrawer } from './ConsumableAssetDrawer';
import { SoftwareLicenseDrawer } from './SoftwareLicenseDrawer';
import { ContractDrawer } from './ContractDrawer';
import { PurchaseDrawer } from './PurchaseDrawer';
import { CmdbDrawer } from './CmdbDrawer';
import { PatchDrawer } from './PatchDrawer';
import { PatchDeploymentDrawer } from './PatchDeploymentDrawer';
import { PackageDeploymentDrawer } from './PackageDeploymentDrawer';
import { RegistryDeploymentDrawer } from './RegistryDeploymentDrawer';
import { KnowledgeDrawer } from './KnowledgeDrawer';
import { ReportDrawer } from './ReportDrawer';
import { EndpointDrawer } from './EndpointDrawer';
import { VulnerabilityDrawer } from './VulnerabilityDrawer';
import { DetectedCveDrawer } from './DetectedCveDrawer';
import { MOCK_TICKETS } from './TicketListPage';
import { mockProblems } from './ProblemListPage';
import { mockChanges } from './ChangeListPage';
import { mockReleases } from './ReleaseListPage';
import { mockAssets as mockHardware } from './HardwareAssetsListPage';
import { mockContracts } from './ContractsListPage';
import { mockPurchases } from './PurchasesListPage';
import { mockCis } from './CmdbListPage';
import { DrawerShortcuts } from './DrawerShortcuts';
import { ApprovalDrawer } from './ApprovalDrawer';
import { TaskDrawer } from './TaskDrawer';
import { ProjectDrawer, projectToProblemShape } from './ProjectDrawer';
import { mockProjects } from './ProjectsListPage';
import { CompliancePolicyDrawer } from './CompliancePolicyDrawer';
import { ComplianceEndpointDrawer } from './ComplianceEndpointDrawer';
import { ComplianceBenchmarkDrawer } from './ComplianceBenchmarkDrawer';

export type StackModule =
  | 'request' | 'request-v2' | 'problem' | 'change' | 'release'
  | 'hardware-assets' | 'software-assets' | 'non-it-assets' | 'consumable-assets'
  | 'software-licenses' | 'contracts' | 'purchases' | 'cmdb' | 'patches' | 'patch-deployments' | 'endpoints' | 'vulnerabilities' | 'detected-cves' | 'package-deployments' | 'registry-deployments' | 'knowledge' | 'tasks' | 'report' | 'projects' | 'compliance-policies' | 'compliance-endpoints' | 'compliance-benchmarks'
  /* Not a module of its own — an approval opens the record it points at, through
     the approvals' own detail page (`ApprovalDrawer`) so it can diverge. */
  | 'approval';

export interface StackItem { key: string; module: StackModule; id: string; subject: string; data: any }
export interface Relation { ticketId: string; subject: string; type: string; status: string; priority: string; assignedTo: { name: string } }

// Relation type -> which module drawer to open it in + which mock pool to source realistic data from.
// Pools are lazy getters to avoid circular-import initialization issues (list pages import this module too).
const REL_MAP: Record<string, { module: StackModule; pool: () => any[]; disp: string }> = {
  Request: { module: 'request', pool: () => MOCK_TICKETS, disp: 'subject' },
  Problem: { module: 'problem', pool: () => mockProblems, disp: 'subject' },
  Change: { module: 'change', pool: () => mockChanges, disp: 'subject' },
  Release: { module: 'release', pool: () => mockReleases, disp: 'subject' },
  Asset: { module: 'hardware-assets', pool: () => mockHardware, disp: 'name' },
  CI: { module: 'cmdb', pool: () => mockCis, disp: 'name' },
  Contract: { module: 'contracts', pool: () => mockContracts, disp: 'name' },
  Purchase: { module: 'purchases', pool: () => mockPurchases, disp: 'name' },
  Project: { module: 'projects', pool: () => mockProjects, disp: 'name' },
};

interface DrawerStackApi {
  open: (module: StackModule, id: string, subject: string, data: any) => void;
  openRelation: (rel: Relation) => void;
}
const Ctx = createContext<DrawerStackApi>({ open: () => {}, openRelation: () => {} });
export const useDrawerStack = () => useContext(Ctx);

export function DrawerStackProvider({ children, activePage }: { children: ReactNode; activePage?: string }) {
  const [stack, setStack] = useState<StackItem[]>([]);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  // Shared full/small view width, persisted across tab switches & closes so the
  // view mode survives when the host swaps in a different module's drawer instance.
  const [stackWidth, setStackWidth] = useState<number | undefined>(undefined);
  // Shared minimized state so navigating to another module's list page collapses
  // the open drawer to its rail (revealing the list), and opening an item restores it.
  const [minimized, setMinimized] = useState(false);
  // Remember each open item's active detail tab (keyed by `module:id`), so returning to a
  // tab restores the tab the user left it on — even though the host remounts a fresh drawer
  // instance when switching between modules.
  const [tabByKey, setTabByKey] = useState<Record<string, string>>({});
  // Shared right-panel group (Properties / Activity / Suggestions / …). Persisted across drawer
  // instances so opening a related record (e.g. a Similar Ticket) keeps the same group open
  // instead of resetting to Properties. `undefined` → each drawer falls back to its own default.
  const [activeGroup, setActiveGroup] = useState<string | undefined>(undefined);

  // When the user navigates to a different module's list page, minimize any open
  // drawer so the list underneath is visible (the rail stays for quick restore).
  useEffect(() => {
    setMinimized((m) => (stack.length ? true : m));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePage]);

  // Drag-to-reorder open-item tabs: `DrawerTabStrip` broadcasts the new tab order (by id) and we
  // reorder the stack to match — so the order persists even when the host swaps drawer instances.
  useEffect(() => {
    const onReorder = (e: Event) => {
      const order = (e as CustomEvent).detail?.order as string[] | undefined;
      if (!order) return;
      setStack((prev) => {
        const used = new Set<number>();
        const next: StackItem[] = [];
        order.forEach((id) => {
          const idx = prev.findIndex((s, i) => s.id === id && !used.has(i));
          if (idx >= 0) { used.add(idx); next.push(prev[idx]); }
        });
        prev.forEach((s, i) => { if (!used.has(i)) next.push(s); }); // safety: keep any unmatched
        return next.length === prev.length ? next : prev;
      });
    };
    window.addEventListener('reorder-drawer-tabs', onReorder as EventListener);
    return () => window.removeEventListener('reorder-drawer-tabs', onReorder as EventListener);
  }, []);

  /* A drawer marks its conversation read (TicketDrawer does it a beat after the
     Conversation tab opens) → clear that open item's unread dot on the tab strip.
     An event keeps it out of every drawer's prop list. */
  useEffect(() => {
    const onRead = (e: Event) => {
      const id = (e as CustomEvent).detail?.id as string | undefined;
      if (!id) return;
      setStack((prev) =>
        prev.some((s) => s.id === id && s.data?.unread)
          ? prev.map((s) => (s.id === id ? { ...s, data: { ...s.data, unread: 0 } } : s))
          : prev,
      );
    };
    window.addEventListener('drawer-item-read', onRead as EventListener);
    return () => window.removeEventListener('drawer-item-read', onRead as EventListener);
  }, []);

  const open: DrawerStackApi['open'] = (module, id, subject, data) => {
    const key = `${module}:${id}`;
    setStack((prev) => (prev.some((s) => s.key === key) ? prev : [...prev, { key, module, id, subject, data }]));
    setActiveKey(key);
    setMinimized(false); // opening/selecting an item always restores the drawer
  };
  const openRelation: DrawerStackApi['openRelation'] = (rel) => {
    const m = REL_MAP[rel.type];
    if (!m) return;
    const pool = m.pool();
    if (!pool.length) return;
    const idx = Math.abs([...rel.ticketId].reduce((a, c) => a + c.charCodeAt(0), 0)) % pool.length;
    open(m.module, rel.ticketId, rel.subject, { ...pool[idx], id: rel.ticketId, [m.disp]: rel.subject });
  };
  const closeByStackId = (id: string) => {
    setStack((prev) => {
      const next = prev.filter((s) => s.id !== id);
      setActiveKey((ak) => {
        const closed = prev.find((s) => s.id === id);
        return closed && ak === closed.key ? (next.length ? next[next.length - 1].key : null) : ak;
      });
      return next;
    });
  };
  const selectByStackId = (id: string) => {
    setStack((prev) => { const it = prev.find((s) => s.id === id); if (it) setActiveKey(it.key); return prev; });
  };
  const closeAll = () => { setStack([]); setActiveKey(null); };

  const active = stack.find((s) => s.key === activeKey) || null;
  // Enrich each tab with status/priority/technician (field names vary by module) for the tab hover card.
  /* Tab hover-card KPIs — module-aware so EVERY open item shows 2-3 useful chips, not just
     the ticket family. Each chip: optional dot colour, optional grey label, a value, and
     `user` for the person icon. Unknown shapes fall back to the generic field sniff. */
  const sevDot = (v?: string) => ({ critical: '#EF4444', important: '#F59E0B', high: '#EF4444', moderate: '#EAB308', medium: '#F59E0B', low: '#22A06B', unspecified: '#6B7280' } as Record<string, string>)[(v ?? '').toLowerCase()] ?? '#6B7280';
  const stDot = (v?: string) => {
    const s = (v ?? '').toLowerCase();
    if (s === 'open' || s === 'pending' || s === 'not started' || s === 'sent for approval' || s === 'generated' || s === 'draft') return '#D97706';
    if (s === 'in progress' || s === 'ordered' || s === 'partially received' || s === 'on hold') return '#3D8BD0';
    if (s.includes('resolv') || s.includes('close') || s === 'in use' || s === 'completed' || s === 'operational' || s === 'approved' || s === 'received' || s === 'active' || s === 'published') return '#22A06B';
    if (s === 'expired' || s === 'missing' || s === 'declined' || s === 'rejected') return '#EF4444';
    return '#9CA3AF';
  };
  /* Our tab strip (DrawerTabStrip) reads status / priority / technician for its hover card — the
     upstream module-aware KPI chips belong to upstream's strip, which this project does not use. */
  const tabMeta = (data: any) => {
    if (!data) return {};
    const status = typeof data.status === 'string' ? data.status : undefined;
    const priority = typeof data.priority === 'string' ? data.priority : undefined;
    const tech = data.assignedTo?.name ?? data.assignee ?? data.managedBy ?? data.owner ?? data.technician ?? (typeof data.usedBy === 'string' ? data.usedBy : data.usedBy?.name);
    const technician = typeof tech === 'string' && tech.trim() ? tech : undefined;
    return { status, priority, technician };
  };
  const stackTabs = stack.map((s) => ({
    id: s.id,
    // A record opened from BOM is addressed by its CI id, so the tab agrees with the header and
    // with the listing it was opened from. Selection and closing still key off the real id.
    displayId: s.data?.bomMode ? s.id.replace(/^EP-/, 'CI-')
      // An endpoint opened within a policy ("EP-512@CP-101") reads as the pair.
      : s.module === 'compliance-endpoints' && s.id.includes('@') ? s.id.replace('@', ' · ') : undefined,
    subject: s.subject,
    ...tabMeta(s.data),
  }));

  let drawer: ReactNode = null;
  if (active) {
    const shared = {
      stackTabs,
      onCloseTab: closeByStackId,
      onTabChange: selectByStackId,
      onClose: closeAll,
      onOpenRelation: openRelation,
      stackWidth,
      onStackWidthChange: setStackWidth,
      stackMinimized: minimized,
      onStackMinimizedChange: setMinimized,
      stackActiveTab: active ? tabByKey[active.key] : undefined,
      onStackActiveTabChange: (t: string) => { if (active) setTabByKey((p) => (p[active.key] === t ? p : { ...p, [active.key]: t })); },
      stackActiveGroup: activeGroup,
      onStackActiveGroupChange: setActiveGroup,
    } as any;
    switch (active.module) {
      // My Approvals — the approval's own detail page resolves the referenced record.
      case 'approval': drawer = <ApprovalDrawer approval={active.data} {...shared} />; break;
      case 'request': drawer = <TicketDrawer openTickets={[active.data]} activeTicketId={active.id} {...shared} />; break;
      // V2 design option of the Ticket detail page — INC-33 routes here from the listing page.
      case 'request-v2': drawer = <TicketDrawerV2 openTickets={[active.data]} activeTicketId={active.id} {...shared} />; break;
      case 'problem': drawer = <ProblemDrawer openProblems={[active.data]} activeProblemId={active.id} {...shared} />; break;
      case 'projects': drawer = <ProjectDrawer openProblems={[projectToProblemShape(active.data)]} activeProblemId={active.id} {...shared} />; break;
      case 'change': drawer = <ChangeDrawer openChanges={[active.data]} activeChangeId={active.id} {...shared} />; break;
      case 'release': drawer = <ReleaseDrawer openReleases={[active.data]} activeReleaseId={active.id} {...shared} />; break;
      case 'hardware-assets': drawer = <HardwareAssetDrawer openAssets={[active.data]} activeAssetId={active.id} {...shared} />; break;
      case 'software-assets': drawer = <SoftwareAssetDrawer openAssets={[active.data]} activeAssetId={active.id} {...shared} />; break;
      case 'non-it-assets': drawer = <NonItAssetDrawer openAssets={[active.data]} activeAssetId={active.id} {...shared} />; break;
      case 'consumable-assets': drawer = <ConsumableAssetDrawer openAssets={[active.data]} activeAssetId={active.id} {...shared} />; break;
      case 'software-licenses': drawer = <SoftwareLicenseDrawer openAssets={[active.data]} activeAssetId={active.id} {...shared} />; break;
      case 'contracts': drawer = <ContractDrawer openAssets={[active.data]} activeAssetId={active.id} {...shared} />; break;
      case 'purchases': drawer = <PurchaseDrawer openAssets={[active.data]} activeAssetId={active.id} {...shared} />; break;
      case 'cmdb': drawer = <CmdbDrawer openAssets={[active.data]} activeAssetId={active.id} {...shared} />; break;
      case 'patches': drawer = <PatchDrawer openAssets={[active.data]} activeAssetId={active.id} {...shared} />; break;
      // Patch Deployment detail page — clone of the Patch detail page; the list page adapts the
      // deployment record onto the Patch shape before opening.
      case 'patch-deployments': drawer = <PatchDeploymentDrawer openAssets={[active.data]} activeAssetId={active.id} {...shared} />; break;
      case 'package-deployments': drawer = <PackageDeploymentDrawer openAssets={[active.data]} activeAssetId={active.id} {...shared} />; break;
      case 'registry-deployments': drawer = <RegistryDeploymentDrawer openAssets={[active.data]} activeAssetId={active.id} {...shared} />; break;
      // Compliance Policy detail page — reads the policy live from its store by id.
      case 'compliance-policies': drawer = <CompliancePolicyDrawer activeAssetId={active.id} {...shared} />; break;
      // Compliance Endpoint detail page — reads the endpoint and its policies live; `data.fromPolicy`
      // lands it on Rules for the policy it was opened from.
      // Compliance Benchmark detail page — reads the benchmark and the policies using it live.
      case 'compliance-benchmarks': drawer = <ComplianceBenchmarkDrawer activeAssetId={active.id} {...shared} />; break;
      case 'compliance-endpoints': drawer = <ComplianceEndpointDrawer activeAssetId={active.id} data={active.data} {...shared} />; break;
      case 'knowledge': drawer = <KnowledgeDrawer openAssets={[active.data]} activeAssetId={active.id} {...shared} />; break;
      case 'report': drawer = <ReportDrawer openAssets={[active.data]} activeAssetId={active.id} {...shared} />; break;
      // Task detail page — clone of the Patch detail page; the list adapts the task record.
      case 'tasks': drawer = <TaskDrawer openAssets={[active.data]} activeAssetId={active.id} {...shared} />; break;
      // Endpoint detail page — clone of the Patch detail page; the list adapts the endpoint record.
      case 'endpoints': drawer = <EndpointDrawer openAssets={[active.data]} activeAssetId={active.id} {...shared} />; break;
      // Vulnerability detail page — clone of the Patch detail page; the list adapts the record.
      case 'vulnerabilities': drawer = <VulnerabilityDrawer openAssets={[active.data]} activeAssetId={active.id} {...shared} />; break;
      // Detected CVE detail page — clone of the Patch Deployment detail page; the list adapts the record.
      case 'detected-cves': drawer = <DetectedCveDrawer openAssets={[active.data]} activeAssetId={active.id} {...shared} />; break;
    }
  }

  // Cycle the open records (also serves "next/prev tab" since open items ARE the records here).
  const cycleRecord = (dir: 1 | -1) => {
    if (!active || stack.length < 2) return;
    const i = stack.findIndex((s) => s.key === active.key);
    setActiveKey(stack[(i + dir + stack.length) % stack.length].key);
  };

  return (
    <Ctx.Provider value={{ open, openRelation }}>
      {children}
      {drawer}
      <DrawerShortcuts
        active={!!active}
        minimized={minimized}
        toggleMinimize={() => setMinimized((m) => !m)}
        closeActive={() => active && closeByStackId(active.id)}
        closeAll={closeAll}
        nextRecord={() => cycleRecord(1)}
        prevRecord={() => cycleRecord(-1)}
        activeId={active?.id}
      />
    </Ctx.Provider>
  );
}
