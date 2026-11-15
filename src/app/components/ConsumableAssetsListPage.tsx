import { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { AssetsToolbar } from './AssetsToolbar';
import { ConsumableAssetsTable } from './ConsumableAssetsTable';
import { Pagination } from './Pagination';
import { useDrawerStack } from './DrawerStack';
import { ConsumableAssetDrawer } from './lazyDrawers';

export interface ConsumableAsset {
  id: string;
  name: string;
  assetType: string;
  managedBy: { name: string; initials?: string; color?: string };
  managedByGroup: string;
  department: string;
  location: string;
  assetGroup: string;
  tags: string[];
  createdDate: string;
  lastUpdatedDate: string;
  availableQuantity: number;
}

const U = { name: 'Unassigned' };

export const mockAssets: ConsumableAsset[] = [
  { id: 'CON-000007033', name: 'Logitech K120 Keyboard', assetType: 'Keyboard', managedBy: U, managedByGroup: 'IT Operations', department: 'IT', location: 'India', assetGroup: 'Peripherals', tags: ['IT Stock'], createdDate: 'Wed, May 27, 2026', lastUpdatedDate: 'Wed, May 27, 2026', availableQuantity: 51 },
  { id: 'CON-000007032', name: 'Logitech M90 Wired Mouse', assetType: 'Mouse', managedBy: U, managedByGroup: 'IT Operations', department: 'IT', location: 'India', assetGroup: 'Peripherals', tags: [], createdDate: 'Tue, May 12, 2026', lastUpdatedDate: 'Fri, May 22, 2026', availableQuantity: 7 },
  { id: 'CON-000007031', name: 'Dell KB216 Multimedia Keyboard', assetType: 'Keyboard', managedBy: U, managedByGroup: 'Unassigned', department: 'Select', location: '---', assetGroup: 'Peripherals', tags: [], createdDate: 'Tue, May 12, 2026', lastUpdatedDate: 'Wed, May 13, 2026', availableQuantity: 9 },
  { id: 'CON-000007030', name: 'Logitech C270 HD Webcam', assetType: 'Cameras', managedBy: U, managedByGroup: 'Unassigned', department: 'Select', location: '---', assetGroup: 'Unassigned', tags: [], createdDate: 'Tue, May 05, 2026', lastUpdatedDate: 'Tue, May 19, 2026', availableQuantity: 34 },
  { id: 'CON-000007029', name: 'Kingston 8GB DDR4 3200MHz RAM', assetType: 'RAM', managedBy: { name: 'Kavit Gohel', initials: 'KG', color: '#10B981' }, managedByGroup: 'Datacenter Team', department: 'IT', location: 'India', assetGroup: 'Spare Parts', tags: ['Spare'], createdDate: 'Fri, Feb 06, 2026', lastUpdatedDate: 'Tue, May 05, 2026', availableQuantity: 96 },
  { id: 'CON-000007028', name: 'HP 26A Black Toner Cartridge', assetType: 'Toner Cartridge', managedBy: U, managedByGroup: 'Unassigned', department: 'Admin', location: 'India', assetGroup: 'Printer Supplies', tags: [], createdDate: 'Fri, Jan 30, 2026', lastUpdatedDate: 'Thu, May 07, 2026', availableQuantity: 65 },
  { id: 'CON-000007027', name: 'Dell 65W USB-C Power Adapter', assetType: 'Adapter', managedBy: U, managedByGroup: 'IT Operations', department: 'IT', location: 'Asia', assetGroup: 'Peripherals', tags: ['Charger'], createdDate: 'Fri, Jan 16, 2026', lastUpdatedDate: 'Thu, May 07, 2026', availableQuantity: 526 },
  { id: 'CON-000007026', name: 'Crucial 16GB DDR4 Laptop RAM', assetType: 'RAM', managedBy: U, managedByGroup: 'Unassigned', department: 'Select', location: '---', assetGroup: 'Spare Parts', tags: [], createdDate: 'Tue, Dec 23, 2025', lastUpdatedDate: 'Wed, Jan 28, 2026', availableQuantity: 48 },
  { id: 'CON-000007025', name: 'HDMI 2.1 Cable 2m', assetType: 'Cable', managedBy: U, managedByGroup: 'Unassigned', department: 'Select', location: '---', assetGroup: 'Peripherals', tags: [], createdDate: 'Wed, Dec 10, 2025', lastUpdatedDate: 'Mon, Dec 15, 2025', availableQuantity: 0 },
  { id: 'CON-000007024', name: 'SanDisk Ultra 64GB USB 3.0 Drive', assetType: 'USB Drive', managedBy: { name: 'Darshan Dabgar', initials: 'DD', color: '#6366F1' }, managedByGroup: 'IT Operations', department: 'Sales', location: 'Delhi', assetGroup: 'Peripherals', tags: ['Distributed'], createdDate: 'Thu, Nov 27, 2025', lastUpdatedDate: 'Mon, Jan 12, 2026', availableQuantity: 409 },
  { id: 'CON-000007023', name: 'TP-Link USB to Ethernet Adapter', assetType: 'Adapter', managedBy: U, managedByGroup: 'Unassigned', department: 'Select', location: '---', assetGroup: 'Peripherals', tags: [], createdDate: 'Thu, Nov 27, 2025', lastUpdatedDate: 'Thu, Nov 27, 2025', availableQuantity: 9 },
  { id: 'CON-000007022', name: 'Logitech H340 USB Headset', assetType: 'Headset', managedBy: U, managedByGroup: 'Unassigned', department: 'Select', location: '---', assetGroup: 'Peripherals', tags: [], createdDate: 'Sun, Nov 16, 2025', lastUpdatedDate: 'Fri, Nov 21, 2025', availableQuantity: 6 },
  { id: 'CON-000007021', name: 'Logitech B100 Optical Mouse', assetType: 'Mouse', managedBy: U, managedByGroup: 'Unassigned', department: 'HR', location: 'India', assetGroup: 'Peripherals', tags: ['Bulk'], createdDate: 'Thu, Nov 13, 2025', lastUpdatedDate: 'Wed, Jan 28, 2026', availableQuantity: 49 },
  { id: 'CON-000007020', name: 'Samsung 16GB DDR5 RAM Module', assetType: 'RAM', managedBy: U, managedByGroup: 'Unassigned', department: 'Select', location: '---', assetGroup: 'Spare Parts', tags: [], createdDate: 'Thu, Oct 16, 2025', lastUpdatedDate: 'Thu, Nov 13, 2025', availableQuantity: 2 },
  { id: 'CON-000007019', name: 'AA Alkaline Batteries (Pack of 40)', assetType: 'Batteries', managedBy: U, managedByGroup: 'Unassigned', department: 'Admin', location: 'India', assetGroup: 'Office Supplies', tags: [], createdDate: 'Tue, Oct 07, 2025', lastUpdatedDate: 'Mon, Nov 17, 2025', availableQuantity: 4 },
  { id: 'CON-000007018', name: 'Facial Tissue Box (2 Ply)', assetType: 'Tissue Paper', managedBy: U, managedByGroup: 'Unassigned', department: 'Admin', location: 'India', assetGroup: 'Pantry Supplies', tags: ['Pantry'], createdDate: 'Tue, Oct 07, 2025', lastUpdatedDate: 'Thu, Nov 13, 2025', availableQuantity: 910 },
  { id: 'CON-000007017', name: 'Logitech C920 Pro Webcam', assetType: 'Cameras', managedBy: U, managedByGroup: 'Unassigned', department: 'Select', location: '---', assetGroup: 'Peripherals', tags: [], createdDate: 'Mon, Oct 06, 2025', lastUpdatedDate: 'Wed, Nov 05, 2025', availableQuantity: 0 },
  { id: 'CON-000007016', name: 'Ethernet Cat6 Patch Cable 1m', assetType: 'Cable', managedBy: U, managedByGroup: 'Unassigned', department: 'HR', location: 'India', assetGroup: 'Network Supplies', tags: [], createdDate: 'Wed, Aug 27, 2025', lastUpdatedDate: 'Thu, Nov 13, 2025', availableQuantity: 100 },
  { id: 'CON-000007015', name: 'Dettol Hand Sanitizer 500ml', assetType: 'Hand Sanitizer', managedBy: U, managedByGroup: 'Unassigned', department: 'Presales', location: 'India', assetGroup: 'Pantry Supplies', tags: ['Hygiene'], createdDate: 'Fri, Aug 22, 2025', lastUpdatedDate: 'Fri, Aug 22, 2025', availableQuantity: 1 },
  { id: 'CON-000007014', name: 'Kleenex Tissue Roll (Pack of 12)', assetType: 'Tissue Paper', managedBy: U, managedByGroup: 'Unassigned', department: 'IT', location: 'India', assetGroup: 'Pantry Supplies', tags: [], createdDate: 'Wed, Aug 20, 2025', lastUpdatedDate: 'Tue, Sep 23, 2025', availableQuantity: 110 },
  { id: 'CON-000007013', name: 'Brother TN-2400 Toner Cartridge', assetType: 'Toner Cartridge', managedBy: U, managedByGroup: 'Unassigned', department: 'Select', location: '---', assetGroup: 'Printer Supplies', tags: [], createdDate: 'Mon, Jun 30, 2025', lastUpdatedDate: 'Wed, Aug 20, 2025', availableQuantity: 8 },
  { id: 'CON-000007012', name: 'Logitech MK270 Wireless Combo', assetType: 'Keyboard', managedBy: { name: 'Kavit Gohel', initials: 'KG', color: '#10B981' }, managedByGroup: 'IT Operations', department: 'Sales', location: 'India', assetGroup: 'Peripherals', tags: ['Wireless'], createdDate: 'Fri, Jun 20, 2025', lastUpdatedDate: 'Mon, Jul 14, 2025', availableQuantity: 23 },
  { id: 'CON-000007011', name: 'USB-C to HDMI Adapter', assetType: 'Adapter', managedBy: U, managedByGroup: 'Unassigned', department: 'Select', location: '---', assetGroup: 'Peripherals', tags: [], createdDate: 'Tue, Jun 10, 2025', lastUpdatedDate: 'Thu, Jul 03, 2025', availableQuantity: 15 },
  { id: 'CON-000007010', name: 'WD 1TB Portable HDD', assetType: 'USB Drive', managedBy: U, managedByGroup: 'Datacenter Team', department: 'IT', location: 'Asia', assetGroup: 'Storage', tags: ['Backup'], createdDate: 'Mon, May 26, 2025', lastUpdatedDate: 'Fri, Jun 27, 2025', availableQuantity: 12 },
  { id: 'CON-000007009', name: 'Jabra Evolve 20 Headset', assetType: 'Headset', managedBy: U, managedByGroup: 'Unassigned', department: 'Presales', location: 'India', assetGroup: 'Peripherals', tags: [], createdDate: 'Thu, May 08, 2025', lastUpdatedDate: 'Mon, Jun 16, 2025', availableQuantity: 31 },
  { id: 'CON-000007008', name: 'Logitech B170 Wireless Mouse', assetType: 'Mouse', managedBy: U, managedByGroup: 'Unassigned', department: 'Select', location: '---', assetGroup: 'Peripherals', tags: [], createdDate: 'Wed, Apr 23, 2025', lastUpdatedDate: 'Tue, May 20, 2025', availableQuantity: 58 },
  { id: 'CON-000007007', name: 'AAA Rechargeable Batteries (Pack of 8)', assetType: 'Batteries', managedBy: U, managedByGroup: 'Unassigned', department: 'Admin', location: 'India', assetGroup: 'Office Supplies', tags: [], createdDate: 'Fri, Apr 11, 2025', lastUpdatedDate: 'Wed, May 07, 2025', availableQuantity: 40 },
  { id: 'CON-000007006', name: 'HP 678 Tri-color Ink Cartridge', assetType: 'Toner Cartridge', managedBy: U, managedByGroup: 'Unassigned', department: 'Finance', location: 'India', assetGroup: 'Printer Supplies', tags: [], createdDate: 'Mon, Mar 31, 2025', lastUpdatedDate: 'Thu, Apr 24, 2025', availableQuantity: 17 },
  { id: 'CON-000007005', name: 'DisplayPort to DVI Adapter', assetType: 'Adapter', managedBy: U, managedByGroup: 'Unassigned', department: 'Select', location: '---', assetGroup: 'Peripherals', tags: [], createdDate: 'Tue, Mar 18, 2025', lastUpdatedDate: 'Fri, Apr 11, 2025', availableQuantity: 21 },
  { id: 'CON-000007004', name: 'Logitech C310 HD Webcam', assetType: 'Cameras', managedBy: U, managedByGroup: 'Unassigned', department: 'HR', location: 'India', assetGroup: 'Peripherals', tags: [], createdDate: 'Thu, Feb 27, 2025', lastUpdatedDate: 'Mon, Mar 24, 2025', availableQuantity: 13 },
  { id: 'CON-000007003', name: 'Cat6 Ethernet Cable 5m', assetType: 'Cable', managedBy: U, managedByGroup: 'Network Team', department: 'IT', location: 'Asia', assetGroup: 'Network Supplies', tags: ['Network'], createdDate: 'Wed, Feb 12, 2025', lastUpdatedDate: 'Fri, Mar 14, 2025', availableQuantity: 75 },
];

export function ConsumableAssetsListPage({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [assets] = useState<ConsumableAsset[]>(mockAssets);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [sortColumn, setSortColumn] = useState<keyof ConsumableAsset | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [searchQuery, setSearchQuery] = useState('');
  const [openAssets, setOpenAssets] = useState<ConsumableAsset[]>([]);
  const [activeAssetId, setActiveAssetId] = useState<string | null>(null);

  useEffect(() => { setCurrentPage(1); }, [searchQuery]);

  const { open: openInStack } = useDrawerStack();

  const handleOpenAsset = (asset: ConsumableAsset) => {
    openInStack('consumable-assets', asset.id, asset.name, asset);
  };

  const handleOpenRelation = (rel: { ticketId: string; subject: string }) => {
    handleOpenAsset({ ...mockAssets[Math.abs([...rel.ticketId].reduce((a, c) => a + c.charCodeAt(0), 0)) % mockAssets.length], id: rel.ticketId, name: rel.subject });
  };

  const handleCloseDrawer = () => { setOpenAssets([]); setActiveAssetId(null); };

  const handleCloseTab = (assetId: string) => {
    const updated = openAssets.filter(a => a.id !== assetId);
    setOpenAssets(updated);
    if (activeAssetId === assetId) {
      setActiveAssetId(updated.length > 0 ? updated[updated.length - 1].id : null);
    }
  };

  const handleTabChange = (assetId: string) => setActiveAssetId(assetId);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const ids = new Set(assets.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(a => a.id));
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

  const handleSort = (column: keyof ConsumableAsset) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  let filtered = assets;
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filtered = assets.filter(a =>
      a.id.toLowerCase().includes(q) ||
      a.name.toLowerCase().includes(q) ||
      a.assetType.toLowerCase().includes(q) ||
      a.department.toLowerCase().includes(q) ||
      a.location.toLowerCase().includes(q) ||
      a.assetGroup.toLowerCase().includes(q) ||
      a.managedByGroup.toLowerCase().includes(q)
    );
  }

  let sorted = [...filtered];
  if (sortColumn) {
    sorted.sort((a, b) => {
      const aRaw = a[sortColumn];
      const bRaw = b[sortColumn];
      if (typeof aRaw === 'number' && typeof bRaw === 'number') {
        return sortDirection === 'asc' ? aRaw - bRaw : bRaw - aRaw;
      }
      const aVal = String(aRaw ?? '');
      const bVal = String(bRaw ?? '');
      return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });
  }

  const totalPages = Math.ceil(sorted.length / itemsPerPage) || 1;
  const paginated = sorted.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const currentPageIds = paginated.map(a => a.id);
  const allCurrentSelected = currentPageIds.every(id => selected.has(id)) && currentPageIds.length > 0;

  return (
    <div className="flex h-screen bg-[#f9fafb]">
      <Sidebar activePage="consumable-assets" onNavigate={onNavigate} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header selectedCount={selected.size} />
        <AssetsToolbar searchQuery={searchQuery} setSearchQuery={setSearchQuery} title="Consumable Assets" viewLabel="All Consumable Assets" />
        <main className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-auto bg-white min-h-0">
            <ConsumableAssetsTable
              assets={paginated}
              selected={selected}
              allSelected={allCurrentSelected}
              onSelectAll={handleSelectAll}
              onSelect={handleSelect}
              onSort={handleSort}
              sortColumn={sortColumn}
              sortDirection={sortDirection}
              onAssetClick={handleOpenAsset}
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
      <ConsumableAssetDrawer
        openAssets={openAssets}
        activeAssetId={activeAssetId}
        onClose={handleCloseDrawer}
        onCloseTab={handleCloseTab}
        onTabChange={handleTabChange}
        onOpenRelation={handleOpenRelation}
      />
    </div>
  );
}
