import { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { AssetsToolbar } from './AssetsToolbar';
import { SoftwareAssetsTable } from './SoftwareAssetsTable';
import { Pagination } from './Pagination';
import { useDrawerStack } from './DrawerStack';
import { SoftwareAssetDrawer } from './SoftwareAssetDrawer';

/* The software lifecycle the listing's Status cell offers (see MODULE_STATUS_OPTS.software). */
export type SoftwareStatus = 'In Stock' | 'In Use' | 'Missing' | 'Retired' | 'In Repair' | 'Disposed' | 'Expired' | 'Decommission' | 'Allocated';

export interface SoftwareAsset {
  id: string;
  name: string;
  /** external-link badge before the name (e.g. store/sideloaded app) */
  external?: boolean;
  assetType: string;
  status: SoftwareStatus;
  version: string;
  softwareType: string;
  managedByGroup: string;
  managedBy: { name: string; initials?: string; color?: string };
  impact: string;
  softwareCategory: string;
}

const U = { name: 'Unassigned' };

export const mockAssets: SoftwareAsset[] = [
  { id: 'SWAST-26945', name: 'Microsoft Edge WebView2 Runtime', assetType: 'Application', status: 'In Use', version: '149.0.4022.80', softwareType: 'Managed', managedByGroup: 'Unassigned', managedBy: U, impact: 'On Users', softwareCategory: '---' },
  { id: 'SWAST-26944', name: 'Microsoft Edge', assetType: 'Application', status: 'In Use', version: '149.0.4022.80', softwareType: 'Managed', managedByGroup: 'End User Computing', managedBy: { name: 'Tabrez Khan', initials: 'TK', color: '#3D8BD0' }, impact: 'On Users', softwareCategory: 'Web Browser' },
  { id: 'SWAST-26943', name: 'MicrosoftCorporationII.WinAppRuntime', assetType: 'Application', status: 'In Use', version: '2.2.0.0', softwareType: 'Managed', managedByGroup: 'Unassigned', managedBy: U, impact: 'On Users', softwareCategory: '---' },
  { id: 'SWAST-26942', name: '5319275A.WhatsAppDesktop', external: true, assetType: 'Application', status: 'In Use', version: '2.2623.103.0', softwareType: 'Discovered', managedByGroup: 'Unassigned', managedBy: U, impact: 'On Users', softwareCategory: 'Communication' },
  { id: 'SWAST-26941', name: 'Microsoft.WindowsStore', assetType: 'Application', status: 'In Use', version: '22605.1401.12.0', softwareType: 'Managed', managedByGroup: 'Unassigned', managedBy: U, impact: 'On Users', softwareCategory: '---' },
  { id: 'SWAST-26940', name: 'Google Chrome', assetType: 'Application', status: 'In Use', version: '149.0.7827.116', softwareType: 'Managed', managedByGroup: 'End User Computing', managedBy: { name: 'Rohan Mehta', initials: 'RM', color: '#6366F1' }, impact: 'On Users', softwareCategory: 'Web Browser' },
  { id: 'SWAST-26939', name: 'FortiClient VPN', assetType: 'Application', status: 'In Use', version: '7.4.3.4726', softwareType: 'Managed', managedByGroup: 'Network Team', managedBy: { name: 'Imran Qureshi', initials: 'IQ', color: '#F59E0B' }, impact: 'On Organization', softwareCategory: 'Security' },
  { id: 'SWAST-26938', name: 'Microsoft OneDrive', assetType: 'Application', status: 'In Use', version: '26.098.0524.0004', softwareType: 'Managed', managedByGroup: 'Unassigned', managedBy: U, impact: 'On Users', softwareCategory: 'Productivity' },
  { id: 'SWAST-26937', name: 'Brave', assetType: 'Application', status: 'In Use', version: '149.1.91.175', softwareType: 'Discovered', managedByGroup: 'Unassigned', managedBy: U, impact: 'On Users', softwareCategory: 'Web Browser' },
  { id: 'SWAST-26936', name: 'MSTeams', assetType: 'Application', status: 'In Use', version: '26149.1205.4798.6437', softwareType: 'Managed', managedByGroup: 'End User Computing', managedBy: { name: 'Tabrez Khan', initials: 'TK', color: '#3D8BD0' }, impact: 'On Department', softwareCategory: 'Communication' },
  { id: 'SWAST-26935', name: 'GDR 1170 for SQL Server 2022 (KB5054833)', assetType: 'Application', status: 'In Use', version: '16.0.1170.5', softwareType: 'Managed', managedByGroup: 'Datacenter Team', managedBy: { name: 'Vikram Sethi', initials: 'VS', color: '#10B981' }, impact: 'On Organization', softwareCategory: 'Database' },
  { id: 'SWAST-26934', name: 'ScreenConnect Client (fb4c83399a1d2e10)', assetType: 'Application', status: 'In Use', version: '26.1.20.9571', softwareType: 'Discovered', managedByGroup: 'IT Operations', managedBy: { name: 'Neha Raje', initials: 'NR', color: '#EC4899' }, impact: 'On Users', softwareCategory: 'Remote Access' },
  { id: 'SWAST-26933', name: 'Mozilla Firefox', assetType: 'Application', status: 'In Use', version: '135.0.1', softwareType: 'Managed', managedByGroup: 'Unassigned', managedBy: U, impact: 'On Users', softwareCategory: 'Web Browser' },
  { id: 'SWAST-26932', name: 'Microsoft.MicrosoftEdge.Stable', assetType: 'Application', status: 'In Use', version: '148.0.3967.54', softwareType: 'Managed', managedByGroup: 'Unassigned', managedBy: U, impact: 'On Users', softwareCategory: '---' },
  { id: 'SWAST-26931', name: 'Microsoft SQL Server 2022 Setup (English)', assetType: 'Application', status: 'In Use', version: '16.0.1180.1', softwareType: 'Managed', managedByGroup: 'Datacenter Team', managedBy: { name: 'Vikram Sethi', initials: 'VS', color: '#10B981' }, impact: 'On Organization', softwareCategory: 'Database' },
  { id: 'SWAST-26930', name: 'MozillaThunderbird.MZLA', assetType: 'Application', status: 'In Use', version: '140.11.1.0', softwareType: 'Discovered', managedByGroup: 'Unassigned', managedBy: U, impact: 'On Users', softwareCategory: 'Communication' },
  { id: 'SWAST-26929', name: 'WPS Office', assetType: 'Application', status: 'In Use', version: '12.2.23202.0', softwareType: 'Discovered', managedByGroup: 'Unassigned', managedBy: U, impact: 'On Users', softwareCategory: 'Productivity' },
  { id: 'SWAST-26928', name: 'Microsoft.OutlookForWindows', assetType: 'Application', status: 'In Use', version: '1.2026.407.100', softwareType: 'Managed', managedByGroup: 'End User Computing', managedBy: { name: 'Rohan Mehta', initials: 'RM', color: '#6366F1' }, impact: 'On Department', softwareCategory: 'Communication' },
  { id: 'SWAST-26927', name: 'Microsoft Visual C++ 2022 X86 Minimum Runtime', assetType: 'Application', status: 'In Use', version: '14.40.33816', softwareType: 'Managed', managedByGroup: 'Unassigned', managedBy: U, impact: 'On Users', softwareCategory: 'Runtime' },
  { id: 'SWAST-26926', name: 'GDR 1165 for SQL Server 2022 (KB5052819)', assetType: 'Application', status: 'In Use', version: '16.0.1165.1', softwareType: 'Managed', managedByGroup: 'Datacenter Team', managedBy: { name: 'Vikram Sethi', initials: 'VS', color: '#10B981' }, impact: 'On Organization', softwareCategory: 'Database' },
  { id: 'SWAST-26925', name: 'Zoom Workplace', assetType: 'Application', status: 'In Use', version: '6.2.11.55001', softwareType: 'Managed', managedByGroup: 'End User Computing', managedBy: { name: 'Farah Sheikh', initials: 'FS', color: '#A78BFA' }, impact: 'On Department', softwareCategory: 'Communication' },
  { id: 'SWAST-26924', name: 'Notepad++ (64-bit)', assetType: 'Application', status: 'In Use', version: '8.7.5', softwareType: 'Discovered', managedByGroup: 'Unassigned', managedBy: U, impact: 'On Users', softwareCategory: 'Developer Tools' },
  { id: 'SWAST-26923', name: '7-Zip 24.09 (x64)', assetType: 'Application', status: 'In Use', version: '24.09', softwareType: 'Discovered', managedByGroup: 'Unassigned', managedBy: U, impact: 'On Users', softwareCategory: 'Utilities' },
  { id: 'SWAST-26922', name: 'Adobe Acrobat Reader', assetType: 'Application', status: 'In Use', version: '24.005.20320', softwareType: 'Managed', managedByGroup: 'End User Computing', managedBy: { name: 'Tabrez Khan', initials: 'TK', color: '#3D8BD0' }, impact: 'On Users', softwareCategory: 'Productivity' },
  { id: 'SWAST-26921', name: 'Slack', assetType: 'Application', status: 'In Use', version: '4.41.105', softwareType: 'Discovered', managedByGroup: 'Unassigned', managedBy: U, impact: 'On Department', softwareCategory: 'Communication' },
  { id: 'SWAST-26920', name: 'VLC media player', assetType: 'Application', status: 'In Use', version: '3.0.21', softwareType: 'Discovered', managedByGroup: 'Unassigned', managedBy: U, impact: 'On Users', softwareCategory: 'Media' },
  { id: 'SWAST-26919', name: 'Python 3.12.4 (64-bit)', assetType: 'Application', status: 'In Use', version: '3.12.4150.0', softwareType: 'Managed', managedByGroup: 'IT Operations', managedBy: { name: 'Neha Raje', initials: 'NR', color: '#EC4899' }, impact: 'On Department', softwareCategory: 'Developer Tools' },
  { id: 'SWAST-26918', name: 'Node.js', assetType: 'Application', status: 'In Use', version: '22.11.0', softwareType: 'Managed', managedByGroup: 'IT Operations', managedBy: { name: 'Neha Raje', initials: 'NR', color: '#EC4899' }, impact: 'On Department', softwareCategory: 'Developer Tools' },
  { id: 'SWAST-26917', name: 'Git', assetType: 'Application', status: 'In Use', version: '2.47.1', softwareType: 'Managed', managedByGroup: 'IT Operations', managedBy: { name: 'Imran Qureshi', initials: 'IQ', color: '#F59E0B' }, impact: 'On Department', softwareCategory: 'Developer Tools' },
  { id: 'SWAST-26916', name: 'PostgreSQL 16', assetType: 'Application', status: 'In Stock', version: '16.4', softwareType: 'Managed', managedByGroup: 'Datacenter Team', managedBy: { name: 'Vikram Sethi', initials: 'VS', color: '#10B981' }, impact: 'On Organization', softwareCategory: 'Database' },
  { id: 'SWAST-26915', name: 'Docker Desktop', assetType: 'Application', status: 'In Use', version: '4.34.2', softwareType: 'Managed', managedByGroup: 'IT Operations', managedBy: { name: 'Neha Raje', initials: 'NR', color: '#EC4899' }, impact: 'On Department', softwareCategory: 'Developer Tools' },
  { id: 'SWAST-26914', name: 'Visual Studio Code', assetType: 'Application', status: 'In Use', version: '1.96.2', softwareType: 'Managed', managedByGroup: 'End User Computing', managedBy: { name: 'Rohan Mehta', initials: 'RM', color: '#6366F1' }, impact: 'On Department', softwareCategory: 'Developer Tools' },
  { id: 'SWAST-26913', name: 'CrowdStrike Falcon Sensor', assetType: 'Application', status: 'In Use', version: '7.20.19204.0', softwareType: 'Managed', managedByGroup: 'Network Team', managedBy: { name: 'Imran Qureshi', initials: 'IQ', color: '#F59E0B' }, impact: 'On Organization', softwareCategory: 'Security' },
  { id: 'SWAST-26912', name: 'Microsoft 365 Apps for Enterprise', assetType: 'Application', status: 'In Use', version: '16.0.18324.20194', softwareType: 'Managed', managedByGroup: 'End User Computing', managedBy: { name: 'Tabrez Khan', initials: 'TK', color: '#3D8BD0' }, impact: 'On Organization', softwareCategory: 'Productivity' },
  { id: 'SWAST-26911', name: 'AnyDesk', assetType: 'Application', status: 'Retired', version: '8.1.0', softwareType: 'Discovered', managedByGroup: 'Unassigned', managedBy: U, impact: 'On Users', softwareCategory: 'Remote Access' },
];

export function SoftwareAssetsListPage({ onNavigate, initialOpenId, onInitialOpenConsumed }: { onNavigate: (page: string) => void; initialOpenId?: string | null; onInitialOpenConsumed?: () => void }) {
  const [assets] = useState<SoftwareAsset[]>(mockAssets);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [sortColumn, setSortColumn] = useState<keyof SoftwareAsset | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [searchQuery, setSearchQuery] = useState('');
  const [openAssets, setOpenAssets] = useState<SoftwareAsset[]>([]);
  const [activeAssetId, setActiveAssetId] = useState<string | null>(null);

  useEffect(() => { setCurrentPage(1); }, [searchQuery]);

  const { open: openInStack } = useDrawerStack();

  const handleOpenAsset = (asset: SoftwareAsset) => {
    openInStack('software-assets', asset.id, asset.name, asset);
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

  // Auto-open a specific asset when navigated here from elsewhere (e.g. a Software License's Managed Softwares card).
  useEffect(() => {
    if (!initialOpenId) return;
    const asset = assets.find(a => a.id === initialOpenId);
    if (asset) handleOpenAsset(asset);
    onInitialOpenConsumed?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialOpenId]);

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

  const handleSort = (column: keyof SoftwareAsset) => {
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
      a.version.toLowerCase().includes(q) ||
      a.softwareType.toLowerCase().includes(q) ||
      a.softwareCategory.toLowerCase().includes(q)
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
      <Sidebar activePage="software-assets" onNavigate={onNavigate} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header selectedCount={selected.size} />
        <AssetsToolbar searchQuery={searchQuery} setSearchQuery={setSearchQuery} title="Software Assets" viewLabel="All Software IT Assets" />
        <main className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-auto bg-white min-h-0">
            <SoftwareAssetsTable
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
      <SoftwareAssetDrawer
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
