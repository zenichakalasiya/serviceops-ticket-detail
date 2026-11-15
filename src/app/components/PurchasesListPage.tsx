import { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { AssetsToolbar } from './AssetsToolbar';
import { PurchasesTable } from './PurchasesTable';
import { Pagination } from './Pagination';
import { useDrawerStack } from './DrawerStack';
import { PurchaseDrawer } from './lazyDrawers';

export type PurchaseStatus =
  | 'Generated'
  | 'Sent For Approval'
  | 'Approved'
  | 'Ordered'
  | 'Partially Received'
  | 'Received';

export interface Purchase {
  id: string;
  name: string;
  /** vendor order/reference number, or null when not yet provided */
  orderNumber: string | null;
  status: PurchaseStatus;
  /** owner display name, or null = Unassigned */
  owner: string | null;
  /** "VCAT-##: Vendor Name" */
  vendor: string;
  /** DD/MM/YYYY */
  requiredBy: string;
}

export const mockPurchases: Purchase[] = [
  { id: 'PO-2606-132', name: 'Datacenter SSD Storage Expansion', orderNumber: null, status: 'Approved', owner: null, vendor: 'VCAT-12: Hitachi Vantara', requiredBy: '24/06/2026' },
  { id: 'PO-2606-131', name: 'Conference Room AV Equipment', orderNumber: null, status: 'Partially Received', owner: null, vendor: 'VCAT-25: HP Inc.', requiredBy: '30/06/2026' },
  { id: 'PO-2605-129', name: 'Network Cabling & Patch Panels', orderNumber: 'NWK-2026-44', status: 'Partially Received', owner: null, vendor: 'VCAT-61: Cisco Systems', requiredBy: '30/05/2026' },
  { id: 'PO-2604-126', name: 'Annual Antivirus License Renewal', orderNumber: 'AV-RENEW-26', status: 'Generated', owner: null, vendor: 'VCAT-15: Microsoft', requiredBy: '30/04/2026' },
  { id: 'PO-2604-125', name: 'Standing Desks – Floor 3', orderNumber: 'FRN-778812', status: 'Partially Received', owner: null, vendor: 'VCAT-53: Schneider Electric', requiredBy: '08/05/2026' },
  { id: 'PO-2604-123', name: 'Office IT Equipment Purchase – April 2026', orderNumber: 'PO-2026-0412', status: 'Sent For Approval', owner: null, vendor: 'VCAT-3: Dell Technologies', requiredBy: '02/04/2026' },
  { id: 'PO-2603-122', name: 'Replacement Laptop Batch', orderNumber: null, status: 'Sent For Approval', owner: null, vendor: 'VCAT-44: Lenovo', requiredBy: '31/03/2026' },
  { id: 'PO-2603-121', name: 'UPS Battery Replacement', orderNumber: '1234567890', status: 'Generated', owner: null, vendor: 'VCAT-3: Dell Technologies', requiredBy: '01/04/2026' },
  { id: 'PO-2603-120', name: 'Firewall Appliance Upgrade', orderNumber: '345-FW-2026', status: 'Partially Received', owner: null, vendor: 'VCAT-61: Cisco Systems', requiredBy: '26/03/2026' },
  { id: 'PO-2603-119', name: 'Toner & Printer Consumables', orderNumber: 'CON-998001', status: 'Received', owner: null, vendor: 'VCAT-25: HP Inc.', requiredBy: '24/03/2026' },
  { id: 'PO-2603-116', name: 'Server Rack & Cooling', orderNumber: 'RACK-5521', status: 'Generated', owner: null, vendor: 'VCAT-59: APC by Schneider', requiredBy: '07/03/2026' },
  { id: 'PO-2602-115', name: 'Monitor Refresh – Support Team', orderNumber: null, status: 'Generated', owner: null, vendor: 'VCAT-3: Dell Technologies', requiredBy: '14/02/2026' },
  { id: 'PO-2602-114', name: 'Workstation GPUs', orderNumber: '5678987678', status: 'Approved', owner: 'Vaibhav Prajapati', vendor: 'VCAT-49: NVIDIA', requiredBy: '11/02/2026' },
  { id: 'PO-2602-112', name: 'Cisco Catalyst Router', orderNumber: null, status: 'Generated', owner: null, vendor: 'VCAT-3: Cisco Systems', requiredBy: '11/02/2026' },
  { id: 'PO-2602-111', name: 'Bahrain Branch Networking Kit', orderNumber: null, status: 'Generated', owner: null, vendor: 'VCAT-51: Aruba Networks', requiredBy: '03/02/2026' },
  { id: 'PO-2602-110', name: 'Backup Tape Library', orderNumber: null, status: 'Sent For Approval', owner: 'Neha Raje', vendor: 'VCAT-53: Quantum', requiredBy: '03/02/2026' },
  { id: 'PO-2601-109', name: 'Developer Laptops – New Hires', orderNumber: null, status: 'Generated', owner: 'Jainam Shah', vendor: 'VCAT-56: Apple', requiredBy: '01/02/2026' },
  { id: 'PO-2601-108', name: 'Patch Cables & SFP Modules', orderNumber: '111', status: 'Generated', owner: null, vendor: 'VCAT-3: Dell Technologies', requiredBy: '26/01/2026' },
  { id: 'PO-2601-107', name: 'VPN Concentrator Renewal', orderNumber: null, status: 'Sent For Approval', owner: null, vendor: 'VCAT-3: Dell Technologies', requiredBy: '30/01/2026' },
  { id: 'PO-2601-106', name: 'Reconditioned Servers', orderNumber: null, status: 'Approved', owner: null, vendor: 'VCAT-3: Dell Technologies', requiredBy: '06/01/2026' },
  { id: 'PO-2512-102', name: 'Year-End IT Hardware Bundle', orderNumber: null, status: 'Received', owner: 'Khushi Vaniya', vendor: 'VCAT-59: Ingram Micro', requiredBy: '04/12/2025' },
  { id: 'PO-2511-98', name: 'Wireless Access Points – Floor 2', orderNumber: 'WAP-2210', status: 'Received', owner: null, vendor: 'VCAT-51: Aruba Networks', requiredBy: '20/11/2025' },
  { id: 'PO-2510-91', name: 'Microsoft 365 Seat Top-Up', orderNumber: 'M365-2025-Q4', status: 'Received', owner: null, vendor: 'VCAT-15: Microsoft', requiredBy: '12/10/2025' },
  { id: 'PO-2509-84', name: 'Spare Hard Drives (Stock)', orderNumber: null, status: 'Received', owner: null, vendor: 'VCAT-12: Seagate', requiredBy: '28/09/2025' },
  { id: 'PO-2508-77', name: 'Meeting Room Displays', orderNumber: 'DISP-4471', status: 'Received', owner: 'Rohan Mehta', vendor: 'VCAT-22: Samsung', requiredBy: '15/08/2025' },
];

export function PurchasesListPage({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [purchases] = useState<Purchase[]>(mockPurchases);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [sortColumn, setSortColumn] = useState<keyof Purchase | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [searchQuery, setSearchQuery] = useState('');
  const [openPurchases, setOpenPurchases] = useState<Purchase[]>([]);
  const [activePurchaseId, setActivePurchaseId] = useState<string | null>(null);

  useEffect(() => { setCurrentPage(1); }, [searchQuery]);

  const { open: openInStack } = useDrawerStack();

  const handleOpenPurchase = (purchase: Purchase) => {
    openInStack('purchases', purchase.id, purchase.name, purchase);
  };

  const handleOpenRelation = (rel: { ticketId: string; subject: string }) => {
    handleOpenPurchase({ ...mockPurchases[Math.abs([...rel.ticketId].reduce((a, c) => a + c.charCodeAt(0), 0)) % mockPurchases.length], id: rel.ticketId, name: rel.subject });
  };

  const handleCloseDrawer = () => { setOpenPurchases([]); setActivePurchaseId(null); };

  const handleCloseTab = (purchaseId: string) => {
    const updated = openPurchases.filter(p => p.id !== purchaseId);
    setOpenPurchases(updated);
    if (activePurchaseId === purchaseId) {
      setActivePurchaseId(updated.length > 0 ? updated[updated.length - 1].id : null);
    }
  };

  const handleTabChange = (purchaseId: string) => setActivePurchaseId(purchaseId);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const ids = new Set(purchases.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(p => p.id));
      setSelected(ids);
    } else {
      setSelected(new Set());
    }
  };

  const handleSelect = (id: string, checked: boolean) => {
    const next = new Set(selected);
    checked ? next.add(id) : next.delete(id);
    setSelected(next);
  };

  const handleSort = (column: keyof Purchase) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  let filtered = purchases;
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filtered = purchases.filter(p =>
      p.id.toLowerCase().includes(q) ||
      p.name.toLowerCase().includes(q) ||
      (p.orderNumber ?? '').toLowerCase().includes(q) ||
      p.status.toLowerCase().includes(q) ||
      (p.owner ?? 'unassigned').toLowerCase().includes(q) ||
      p.vendor.toLowerCase().includes(q)
    );
  }

  let sorted = [...filtered];
  if (sortColumn) {
    sorted.sort((a, b) => {
      const aStr = String(a[sortColumn] ?? '');
      const bStr = String(b[sortColumn] ?? '');
      return sortDirection === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
    });
  }

  const totalPages = Math.ceil(sorted.length / itemsPerPage) || 1;
  const paginated = sorted.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const currentPageIds = paginated.map(p => p.id);
  const allCurrentSelected = currentPageIds.every(id => selected.has(id)) && currentPageIds.length > 0;

  return (
    <div className="flex h-screen bg-[#f9fafb]">
      <Sidebar activePage="purchases" onNavigate={onNavigate} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header selectedCount={selected.size} />
        <AssetsToolbar searchQuery={searchQuery} setSearchQuery={setSearchQuery} title="Purchases" viewLabel="All Open Purchase Orders" />
        <main className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-auto bg-white min-h-0">
            <PurchasesTable
              purchases={paginated}
              selected={selected}
              allSelected={allCurrentSelected}
              onSelectAll={handleSelectAll}
              onSelect={handleSelect}
              onSort={handleSort}
              sortColumn={sortColumn}
              sortDirection={sortDirection}
              onPurchaseClick={handleOpenPurchase}
            />
          </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              itemsPerPage={itemsPerPage}
              totalItems={sorted.length}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={(v) => { setItemsPerPage(v); setCurrentPage(1); }}
            />
        </main>
      </div>
      <PurchaseDrawer
        openAssets={openPurchases}
        activeAssetId={activePurchaseId}
        onClose={handleCloseDrawer}
        onCloseTab={handleCloseTab}
        onTabChange={handleTabChange}
        onOpenRelation={handleOpenRelation}
      />
    </div>
  );
}
