/* ── Approval detail page ─────────────────────────────────────────────────────
   Clicking an approval's id in My Approvals opens the record HERE, not in the
   module's own drawer. An approval can point at any kind of record — request,
   problem, change, release, hardware or software asset, contract, purchase —
   so this file is the ONE place the approver's detail experience is composed,
   and anything we change for approvals can never leak into the Requests /
   Change / Release / Asset pages that share those drawers.

   Today it is a faithful pass-through: it resolves the real record behind the
   approval and hands it to that module's detail page, so an approver sees the
   full record exactly as its own module renders it. Approval-specific chrome
   (banners, extra tabs, a decision footer, a trimmed-down layout…) lands in
   this file as it gets specified — at that point a module whose BODY has to
   change gets its own clone beside this file, and only the `case` below moves.  */
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ApprovalHeaderActions, type ApprovalDecision } from './ApprovalHeaderActions';
import { TicketDrawer } from './upstream/TicketDrawer';
import { ProblemDrawer } from './upstream/ProblemDrawer';
import { ChangeDrawer } from './upstream/ChangeDrawer';
import { ReleaseDrawer } from './upstream/ReleaseDrawer';
import { HardwareAssetDrawer } from './upstream/HardwareAssetDrawer';
import { SoftwareAssetDrawer } from './upstream/SoftwareAssetDrawer';
import { ContractDrawer } from './upstream/ContractDrawer';
import { PurchaseDrawer } from './upstream/PurchaseDrawer';
import { MOCK_TICKETS } from './TicketListPage';
import { mockProblems } from './ProblemListPage';
import { mockChanges } from './ChangeListPage';
import { mockReleases } from './ReleaseListPage';
import { mockAssets as mockHardware } from './HardwareAssetsListPage';
import { mockAssets as mockSoftware } from './SoftwareAssetsListPage';
import { mockContracts } from './ContractsListPage';
import { mockPurchases } from './PurchasesListPage';
import type { ApprovalRow } from './MyApprovalsListPage';

/** Which module an approval can point at — the subset of the stack this page serves. */
export type ApprovalModule = ApprovalRow['module'];

/* Mock pools are read through LAZY getters: the list pages import the drawer
   stack, which imports this file, so touching a pool at module-eval time can
   land on a binding that has not initialised yet. Reading them inside render
   (as `recordFor` does) is always safe. */
const POOLS: Partial<Record<ApprovalModule, () => any[]>> = {
  request: () => MOCK_TICKETS,
  problem: () => mockProblems,
  change: () => mockChanges,
  release: () => mockReleases,
  'hardware-assets': () => mockHardware,
  'software-assets': () => mockSoftware,
  contracts: () => mockContracts,
  purchases: () => mockPurchases,
};

/** The field each module's detail page titles the record with. */
const TITLE_FIELD: Partial<Record<ApprovalModule, string>> = {
  request: 'subject', problem: 'subject', change: 'subject', release: 'subject',
  'hardware-assets': 'name', 'software-assets': 'name', contracts: 'name', purchases: 'name',
};

/** Resolve the real record behind an approval.
 *  Approvals deliberately reference ids the mock pools do not all carry (CHG-2091,
 *  REQ-00812735…), so a miss falls back to a DETERMINISTIC record from that pool
 *  with the approval's own id and subject written over it — the same recipe
 *  `DrawerStack.openRelation` uses. The detail page is then always populated. */
export function recordFor(approval: ApprovalRow): any {
  const pool = POOLS[approval.module]?.() ?? [];
  const exact = pool.find((r) => r.id === approval.recordId);
  if (exact) return exact;
  if (!pool.length) return { id: approval.recordId, subject: approval.recordSubject, name: approval.recordSubject };
  const seed = [...approval.recordId].reduce((n, c) => n + c.charCodeAt(0), 0) % pool.length;
  const title = TITLE_FIELD[approval.module] ?? 'subject';
  return { ...pool[seed], id: approval.recordId, [title]: approval.recordSubject };
}

/** What each button does to the approval, and how it reads in the toast. */
const OUTCOME: Record<ApprovalDecision, string> = { approve: 'Approved', reject: 'Rejected', refer: 'Referred Back' };

export function ApprovalDrawer({ approval, ...rest }: { approval?: ApprovalRow } & Record<string, any>) {
  /* The decision is held here so the header answers the click immediately; the
     listing hears about it through an event and updates its own row + KPI counts. */
  const [decision, setDecision] = useState<string | undefined>(approval?.status);
  useEffect(() => setDecision(approval?.status), [approval?.id, approval?.status]);

  if (!approval) return null;
  const record = recordFor(approval);
  const id = record.id;

  const decide = (d: ApprovalDecision) => {
    const next = OUTCOME[d];
    setDecision(next);
    window.dispatchEvent(new CustomEvent('approval-decision', { detail: { approvalId: approval.id, recordId: approval.recordId, next } }));
    toast.success(`${approval.recordId} ${next === 'Referred Back' ? 'referred back' : next.toLowerCase()}`);
  };

  /* Every page opened from here collapses to the approver's three tabs
     (Conversation · Approvals · Relations) — see `approvalTabs.ts` — and its header
     carries the decision in place of the module's own actions. */
  const shared = {
    ...rest,
    approvalMode: true,
    approvalHeader: <ApprovalHeaderActions status={decision} onDecide={decide} />,
  };

  switch (approval.module) {
    case 'problem':
      return <ProblemDrawer openProblems={[record]} activeProblemId={id} {...shared} />;
    case 'change':
      return <ChangeDrawer openChanges={[record]} activeChangeId={id} {...shared} />;
    case 'release':
      return <ReleaseDrawer openReleases={[record]} activeReleaseId={id} {...shared} />;
    case 'hardware-assets':
      return <HardwareAssetDrawer openAssets={[record]} activeAssetId={id} {...shared} />;
    case 'software-assets':
      return <SoftwareAssetDrawer openAssets={[record]} activeAssetId={id} {...shared} />;
    case 'contracts':
      return <ContractDrawer openAssets={[record]} activeAssetId={id} {...shared} />;
    case 'purchases':
      return <PurchaseDrawer openAssets={[record]} activeAssetId={id} {...shared} />;
    default:
      /* Requests (incidents and service requests) are the bulk of an approver's queue. */
      return <TicketDrawer openTickets={[record]} activeTicketId={id} {...shared} />;
  }
}
