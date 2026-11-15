import { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { AssetsToolbar } from './AssetsToolbar';
import { HardwareAssetsTable } from './HardwareAssetsTable';
import { Pagination } from './Pagination';
import { useDrawerStack } from './DrawerStack';
import { HardwareAssetDrawer } from './lazyDrawers';

export type AssetType = 'Hardware' | 'Mac Laptop' | 'Windows Laptop' | 'HyperV Server' | 'UNIX Server' | 'Windows Desktop';
export type AssetStatus = 'In Store' | 'Available' | 'In Use';

export interface HardwareAsset {
  id: string;
  name: string;
  /** small amber dot shown before the name (e.g. agent installed) */
  flagged?: boolean;
  assetType: AssetType;
  status: AssetStatus;
  hostName: string;
  ipAddress: string;
  usedBy: { label: string; more?: number } | null;
  managedByGroup: string;
  managedBy: { name: string; initials?: string; color?: string };
  serialNumber: string;
}

export const mockAssets: HardwareAsset[] = [
  { id: 'AST-001', name: 'MacBook Pro 16" — Design',                 flagged: true, assetType: 'Mac Laptop',      status: 'In Use',    hostName: 'DSGN-MAC-0041',  ipAddress: '10.20.18.41',  usedBy: { label: 'Aarav Sharma (aarav.sharma...)', more: 3 }, managedByGroup: 'End User Computing', managedBy: { name: 'Rohan Mehta',    initials: 'RM', color: '#6366F1' }, serialNumber: 'C02FJ1ABMD6T' },
  { id: 'AST-002', name: 'Dell Latitude 7440 — Finance',            flagged: true, assetType: 'Windows Laptop',  status: 'In Use',    hostName: 'FIN-LT-0188',    ipAddress: '10.20.22.188', usedBy: { label: 'Priya Nair (priya.nair...)', more: 5 }, managedByGroup: 'End User Computing', managedBy: { name: 'Tabrez Khan',    initials: 'TK', color: '#3D8BD0' }, serialNumber: '7HQ2X63' },
  { id: 'AST-003', name: 'Dell PowerEdge R750 — Virtualization Host',              assetType: 'HyperV Server',   status: 'In Use',    hostName: 'DC1-HV-01',      ipAddress: '10.20.40.11',  usedBy: { label: 'Datacenter Team', more: 25 },          managedByGroup: 'Datacenter Team',    managedBy: { name: 'Vikram Sethi',   initials: 'VS', color: '#10B981' }, serialNumber: 'JK9P2L3' },
  { id: 'AST-004', name: 'HPE ProLiant DL380 — Application Server',               assetType: 'UNIX Server',     status: 'In Use',    hostName: 'DC1-UX-02',      ipAddress: '10.20.40.22',  usedBy: { label: 'Datacenter Team', more: 18 },          managedByGroup: 'Datacenter Team',    managedBy: { name: 'Imran Qureshi',  initials: 'IQ', color: '#F59E0B' }, serialNumber: 'CZ29150ABC' },
  { id: 'AST-005', name: 'Lenovo ThinkPad X1 Carbon — Engineering',  flagged: true, assetType: 'Windows Laptop',  status: 'In Use',    hostName: 'ENG-LT-0312',    ipAddress: '10.20.19.112', usedBy: { label: 'Karan Malhotra (karan.malho...)', more: 4 }, managedByGroup: 'IT Operations',      managedBy: { name: 'Neha Raje',      initials: 'NR', color: '#EC4899' }, serialNumber: 'PF3X9K2' },
  { id: 'AST-006', name: 'MacBook Air 13" — Marketing',                            assetType: 'Mac Laptop',      status: 'In Use',    hostName: 'MKT-MAC-0067',   ipAddress: '10.20.18.67',  usedBy: { label: 'Diya Kapoor (diya.kapoor...)' },       managedByGroup: 'End User Computing', managedBy: { name: 'Rohan Mehta',    initials: 'RM', color: '#6366F1' }, serialNumber: 'FVFXC2P1Q6L4' },
  { id: 'AST-007', name: 'Dell OptiPlex 7010 — Reception',                         assetType: 'Windows Desktop', status: 'Available', hostName: 'REC-DT-0023',    ipAddress: '10.20.21.23',  usedBy: { label: 'Service Desk', more: 4 },              managedByGroup: 'Service Desk',       managedBy: { name: 'Farah Sheikh',   initials: 'FS', color: '#A78BFA' }, serialNumber: '9LMN4Q2' },
  { id: 'AST-008', name: 'HP EliteBook 840 G10 — Sales',            flagged: true, assetType: 'Windows Laptop',  status: 'In Use',    hostName: 'SAL-LT-0204',    ipAddress: '10.20.23.204', usedBy: { label: 'Ananya Iyer (ananya.iyer...)' },       managedByGroup: 'IT Operations',      managedBy: { name: 'Tabrez Khan',    initials: 'TK', color: '#3D8BD0' }, serialNumber: '5CD2391XYZ' },
  { id: 'AST-009', name: 'Dell PowerEdge R650 — Database Server',                  assetType: 'UNIX Server',     status: 'In Use',    hostName: 'DC1-DB-03',      ipAddress: '10.20.40.33',  usedBy: { label: 'Datacenter Team', more: 12 },          managedByGroup: 'Datacenter Team',    managedBy: { name: 'Vikram Sethi',   initials: 'VS', color: '#10B981' }, serialNumber: 'DB7723KQ' },
  { id: 'AST-010', name: 'Cisco Catalyst 9300 — Core Switch',                      assetType: 'Hardware',        status: 'In Use',    hostName: 'DC1-SW-CORE-01', ipAddress: '10.20.40.2',   usedBy: { label: 'Network Team', more: 8 },              managedByGroup: 'Network Team',       managedBy: { name: 'Imran Qureshi',  initials: 'IQ', color: '#F59E0B' }, serialNumber: 'FCW2245A1BX' },
  { id: 'AST-011', name: 'Fortinet FortiGate 200F — Firewall',                     assetType: 'Hardware',        status: 'In Use',    hostName: 'DC1-FW-EDGE-01', ipAddress: '10.20.40.1',   usedBy: { label: 'Network Team', more: 6 },              managedByGroup: 'Network Team',       managedBy: { name: 'Imran Qureshi',  initials: 'IQ', color: '#F59E0B' }, serialNumber: 'FG200F3920AK' },
  { id: 'AST-012', name: 'Dell OptiPlex 7020 — HR',                                assetType: 'Windows Desktop', status: 'In Use',    hostName: 'HR-DT-0309',     ipAddress: '10.20.21.93',  usedBy: { label: 'Meera Joshi (meera.joshi...)' },       managedByGroup: 'End User Computing', managedBy: { name: 'Farah Sheikh',   initials: 'FS', color: '#A78BFA' }, serialNumber: '3KPR8M1' },
  { id: 'AST-013', name: 'MacBook Pro 14" — Product',               flagged: true, assetType: 'Mac Laptop',      status: 'In Use',    hostName: 'PRD-MAC-0019',   ipAddress: '10.20.18.19',  usedBy: { label: 'Siddharth Rao (siddharth.r...)' },     managedByGroup: 'End User Computing', managedBy: { name: 'Rohan Mehta',    initials: 'RM', color: '#6366F1' }, serialNumber: 'C02GK3LMQ05P' },
  { id: 'AST-014', name: 'HP LaserJet Pro M404dn — Floor 2',                       assetType: 'Hardware',        status: 'Available', hostName: 'OFC-PRT-0207',   ipAddress: '10.20.30.207', usedBy: { label: 'IT Operations', more: 30 },            managedByGroup: 'IT Operations',      managedBy: { name: 'Tabrez Khan',    initials: 'TK', color: '#3D8BD0' }, serialNumber: 'VNB3K20945' },
  { id: 'AST-015', name: 'Lenovo ThinkPad T14 — Support',           flagged: true, assetType: 'Windows Laptop',  status: 'In Use',    hostName: 'SUP-LT-0108',    ipAddress: '10.20.24.108', usedBy: { label: 'Rahul Verma (rahul.verma...)' },       managedByGroup: 'IT Operations',      managedBy: { name: 'Neha Raje',      initials: 'NR', color: '#EC4899' }, serialNumber: 'R9PL44T' },
  { id: 'AST-016', name: 'Synology RS3621xs+ — Backup NAS',                        assetType: 'UNIX Server',     status: 'In Use',    hostName: 'DC1-NAS-01',     ipAddress: '10.20.40.50',  usedBy: { label: 'Datacenter Team', more: 9 },           managedByGroup: 'Datacenter Team',    managedBy: { name: 'Vikram Sethi',   initials: 'VS', color: '#10B981' }, serialNumber: 'NAS210B7744' },
  { id: 'AST-017', name: 'MacBook Air 15" — Executive',                            assetType: 'Mac Laptop',      status: 'In Use',    hostName: 'EXE-MAC-0004',   ipAddress: '10.20.18.4',   usedBy: { label: 'Kavya Menon (kavya.menon...)' },       managedByGroup: 'End User Computing', managedBy: { name: 'Rohan Mehta',    initials: 'RM', color: '#6366F1' }, serialNumber: 'FVFZ9P0KQ1H2' },
  { id: 'AST-018', name: 'HP ProDesk 600 G6 — Operations',                         assetType: 'Windows Desktop', status: 'In Use',    hostName: 'OPS-DT-0211',    ipAddress: '10.20.21.211', usedBy: { label: 'Arjun Patel (arjun.patel...)' },       managedByGroup: 'IT Operations',      managedBy: { name: 'Farah Sheikh',   initials: 'FS', color: '#A78BFA' }, serialNumber: '8MNQ2R5' },
  { id: 'AST-019', name: 'Dell Latitude 5440 — Procurement',        flagged: true, assetType: 'Windows Laptop',  status: 'Available', hostName: 'PRC-LT-0196',    ipAddress: '10.20.22.96',  usedBy: { label: 'Pooja Shah (pooja.shah...)' },         managedByGroup: 'End User Computing', managedBy: { name: 'Tabrez Khan',    initials: 'TK', color: '#3D8BD0' }, serialNumber: '6JKL2W8' },
  { id: 'AST-020', name: 'Dell PowerEdge R740 — Web Server',                       assetType: 'HyperV Server',   status: 'In Use',    hostName: 'DC1-HV-02',      ipAddress: '10.20.40.12',  usedBy: { label: 'Datacenter Team', more: 15 },          managedByGroup: 'Datacenter Team',    managedBy: { name: 'Imran Qureshi',  initials: 'IQ', color: '#F59E0B' }, serialNumber: 'WB6610FQ' },
  { id: 'AST-021', name: 'Lenovo ThinkPad P1 — Architecture',       flagged: true, assetType: 'Windows Laptop',  status: 'In Use',    hostName: 'ARC-LT-0181',    ipAddress: '10.20.19.181', usedBy: { label: 'Aditya Bose (aditya.bose...)' },       managedByGroup: 'IT Operations',      managedBy: { name: 'Neha Raje',      initials: 'NR', color: '#EC4899' }, serialNumber: 'PG7Z2M4' },
];

export function HardwareAssetsListPage({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [assets] = useState<HardwareAsset[]>(mockAssets);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [sortColumn, setSortColumn] = useState<keyof HardwareAsset | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [searchQuery, setSearchQuery] = useState('');
  const [openAssets, setOpenAssets] = useState<HardwareAsset[]>([]);
  const [activeAssetId, setActiveAssetId] = useState<string | null>(null);

  useEffect(() => { setCurrentPage(1); }, [searchQuery]);

  const { open: openInStack } = useDrawerStack();

  const handleOpenAsset = (asset: HardwareAsset) => {
    openInStack('hardware-assets', asset.id, asset.name, asset);
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

  const handleSort = (column: keyof HardwareAsset) => {
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
      a.status.toLowerCase().includes(q) ||
      a.hostName.toLowerCase().includes(q) ||
      a.ipAddress.toLowerCase().includes(q) ||
      a.serialNumber.toLowerCase().includes(q)
    );
  }

  let sorted = [...filtered];
  if (sortColumn) {
    sorted.sort((a, b) => {
      const aVal = String(a[sortColumn] ?? '');
      const bVal = String(b[sortColumn] ?? '');
      return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });
  }

  const totalPages = Math.ceil(sorted.length / itemsPerPage) || 1;
  const paginated = sorted.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const currentPageIds = paginated.map(a => a.id);
  const allCurrentSelected = currentPageIds.every(id => selected.has(id)) && currentPageIds.length > 0;

  return (
    <div className="flex h-screen bg-[#f9fafb]">
      <Sidebar activePage="hardware-assets" onNavigate={onNavigate} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header selectedCount={selected.size} />
        <AssetsToolbar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
        <main className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-auto bg-white min-h-0">
            <HardwareAssetsTable
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
      <HardwareAssetDrawer
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
