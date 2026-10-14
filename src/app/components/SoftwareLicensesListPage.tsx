import { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { AssetsToolbar } from './AssetsToolbar';
import { SoftwareLicensesTable } from './SoftwareLicensesTable';
import { Pagination } from './Pagination';
import { useDrawerStack } from './DrawerStack';
import { SoftwareLicenseDrawer } from './SoftwareLicenseDrawer';

export interface SoftwareLicense {
  id: string;
  name: string;
  product: string;
  licenseType: string;
  purchaseCount: number | null;
  allocationCount: number | null;
  installationCount: number | null;
  /** DD/MM/YYYY or null */
  expiryDate: string | null;
}

export const mockLicenses: SoftwareLicense[] = [
  { id: 'LIC-86', name: 'Microsoft 365 E3', product: 'Microsoft 365 Enterprise', licenseType: 'Volume Users', purchaseCount: 250, allocationCount: 212, installationCount: 198, expiryDate: '24/07/2026' },
  { id: 'LIC-85', name: 'Adobe Creative Cloud', product: 'Adobe CC All Apps', licenseType: 'Volume Users', purchaseCount: 60, allocationCount: 54, installationCount: 49, expiryDate: '15/09/2026' },
  { id: 'LIC-84', name: 'Autodesk AutoCAD 2025', product: 'AutoCAD LT', licenseType: 'Single Machine', purchaseCount: 40, allocationCount: 32, installationCount: 30, expiryDate: '31/05/2027' },
  { id: 'LIC-83', name: 'Atlassian Jira Software', product: 'Jira Cloud', licenseType: 'Enterprise Subscription', purchaseCount: 150, allocationCount: 138, installationCount: 0, expiryDate: '12/11/2026' },
  { id: 'LIC-82', name: 'Slack Business+', product: 'Slack Workspace', licenseType: 'Volume Users', purchaseCount: 200, allocationCount: 176, installationCount: null, expiryDate: '28/02/2027' },
  { id: 'LIC-81', name: 'Zoom Workplace Pro', product: 'Zoom Meetings', licenseType: 'Volume Users', purchaseCount: 120, allocationCount: 95, installationCount: 88, expiryDate: '26/07/2026' },
  { id: 'LIC-80', name: 'JetBrains IntelliJ IDEA', product: 'IntelliJ IDEA Ultimate', licenseType: 'Single User', purchaseCount: 25, allocationCount: 22, installationCount: 21, expiryDate: '20/03/2027' },
  { id: 'LIC-79', name: 'VMware vSphere Standard', product: 'vSphere ESXi', licenseType: 'Multiple Machines', purchaseCount: 16, allocationCount: 12, installationCount: 12, expiryDate: '06/05/2028' },
  { id: 'LIC-78', name: 'Tableau Creator', product: 'Tableau Desktop', licenseType: 'Single User', purchaseCount: 30, allocationCount: 24, installationCount: 19, expiryDate: null },
  { id: 'LIC-77', name: 'Microsoft SQL Server 2022', product: 'SQL Server Standard', licenseType: 'Multiple Machines', purchaseCount: 8, allocationCount: 6, installationCount: 6, expiryDate: '02/02/2027' },
  { id: 'LIC-76', name: 'CrowdStrike Falcon', product: 'Falcon Endpoint Protection', licenseType: 'Volume Users', purchaseCount: 500, allocationCount: 478, installationCount: 465, expiryDate: '30/09/2026' },
  { id: 'LIC-75', name: 'Notion Team', product: 'Notion Workspace', licenseType: 'Volume Users', purchaseCount: 90, allocationCount: 71, installationCount: null, expiryDate: '14/07/2026' },
  { id: 'LIC-74', name: 'Figma Organization', product: 'Figma Design', licenseType: 'Volume Users', purchaseCount: 45, allocationCount: 40, installationCount: 38, expiryDate: '21/10/2026' },
  { id: 'LIC-73', name: 'GitHub Enterprise', product: 'GitHub Cloud', licenseType: 'Enterprise Subscription', purchaseCount: 180, allocationCount: 165, installationCount: 0, expiryDate: '03/12/2026' },
  { id: 'LIC-72', name: '7-Zip', product: '7-Zip Archiver', licenseType: 'Free License', purchaseCount: null, allocationCount: null, installationCount: 240, expiryDate: null },
  { id: 'LIC-71', name: 'Mozilla Firefox', product: 'Firefox ESR', licenseType: 'Free License', purchaseCount: null, allocationCount: null, installationCount: 132, expiryDate: null },
  { id: 'LIC-70', name: 'Salesforce Sales Cloud', product: 'Sales Cloud Enterprise', licenseType: 'Enterprise Subscription', purchaseCount: 75, allocationCount: 68, installationCount: 0, expiryDate: '18/06/2027' },
  { id: 'LIC-69', name: 'SAP Concur', product: 'Concur Expense', licenseType: 'Volume Users', purchaseCount: 110, allocationCount: 94, installationCount: null, expiryDate: '25/01/2027' },
  { id: 'LIC-68', name: 'Veeam Backup & Replication', product: 'Veeam B&R', licenseType: 'Multiple Machines', purchaseCount: 10, allocationCount: 8, installationCount: 8, expiryDate: '11/04/2027' },
  { id: 'LIC-67', name: 'Citrix Virtual Apps', product: 'Citrix DaaS', licenseType: 'Volume Users', purchaseCount: 60, allocationCount: 52, installationCount: 48, expiryDate: '07/03/2027' },
  { id: 'LIC-66', name: 'Power BI Pro', product: 'Microsoft Power BI', licenseType: 'Enterprise Subscription', purchaseCount: 130, allocationCount: 118, installationCount: 102, expiryDate: '30/11/2026' },
  { id: 'LIC-65', name: 'Dell SupportAssist', product: 'SupportAssist Enterprise', licenseType: 'Single Machine', purchaseCount: 5, allocationCount: 4, installationCount: null, expiryDate: '09/07/2026' },
  { id: 'LIC-64', name: 'Sophos Intercept X', product: 'Sophos Endpoint', licenseType: 'Volume Users', purchaseCount: 300, allocationCount: 286, installationCount: 271, expiryDate: '16/05/2027' },
  { id: 'LIC-63', name: 'Grammarly Business', product: 'Grammarly Workspace', licenseType: 'Volume Users', purchaseCount: 50, allocationCount: 38, installationCount: null, expiryDate: '19/07/2026' },
  { id: 'LIC-62', name: 'Microsoft Visio Plan 2', product: 'Microsoft Visio', licenseType: 'Volume Users', purchaseCount: 35, allocationCount: 29, installationCount: 26, expiryDate: '31/07/2026' },
  { id: 'LIC-61', name: 'Postman Enterprise', product: 'Postman API Platform', licenseType: 'Enterprise Subscription', purchaseCount: 40, allocationCount: 33, installationCount: 0, expiryDate: '13/02/2027' },
  { id: 'LIC-60', name: 'TeamViewer Tensor', product: 'TeamViewer Remote', licenseType: 'Volume Users', purchaseCount: 20, allocationCount: 15, installationCount: 14, expiryDate: '05/10/2026' },
  { id: 'LIC-59', name: 'Adobe Acrobat Pro', product: 'Adobe Acrobat DC', licenseType: 'Single User', purchaseCount: 70, allocationCount: 61, installationCount: 57, expiryDate: '19/12/2026' },
];

export function SoftwareLicensesListPage({ onNavigate, onOpenSoftwareAsset }: { onNavigate: (page: string) => void; onOpenSoftwareAsset?: (id: string) => void }) {
  const [licenses] = useState<SoftwareLicense[]>(mockLicenses);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [sortColumn, setSortColumn] = useState<keyof SoftwareLicense | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [searchQuery, setSearchQuery] = useState('');
  const [openLicenses, setOpenLicenses] = useState<SoftwareLicense[]>([]);
  const [activeLicenseId, setActiveLicenseId] = useState<string | null>(null);

  useEffect(() => { setCurrentPage(1); }, [searchQuery]);

  const { open: openInStack } = useDrawerStack();

  const handleOpenLicense = (license: SoftwareLicense) => {
    openInStack('software-licenses', license.id, license.name, license);
  };

  const handleOpenRelation = (rel: { ticketId: string; subject: string }) => {
    handleOpenLicense({ ...mockLicenses[Math.abs([...rel.ticketId].reduce((a, c) => a + c.charCodeAt(0), 0)) % mockLicenses.length], id: rel.ticketId, name: rel.subject });
  };

  const handleCloseDrawer = () => { setOpenLicenses([]); setActiveLicenseId(null); };

  const handleCloseTab = (licenseId: string) => {
    const updated = openLicenses.filter(l => l.id !== licenseId);
    setOpenLicenses(updated);
    if (activeLicenseId === licenseId) {
      setActiveLicenseId(updated.length > 0 ? updated[updated.length - 1].id : null);
    }
  };

  const handleTabChange = (licenseId: string) => setActiveLicenseId(licenseId);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const ids = new Set(licenses.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(l => l.id));
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

  const handleSort = (column: keyof SoftwareLicense) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  let filtered = licenses;
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filtered = licenses.filter(l =>
      l.id.toLowerCase().includes(q) ||
      l.name.toLowerCase().includes(q) ||
      l.product.toLowerCase().includes(q) ||
      l.licenseType.toLowerCase().includes(q)
    );
  }

  let sorted = [...filtered];
  if (sortColumn) {
    sorted.sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }
      const aStr = String(aVal ?? '');
      const bStr = String(bVal ?? '');
      return sortDirection === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
    });
  }

  const totalPages = Math.ceil(sorted.length / itemsPerPage) || 1;
  const paginated = sorted.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const currentPageIds = paginated.map(l => l.id);
  const allCurrentSelected = currentPageIds.every(id => selected.has(id)) && currentPageIds.length > 0;

  return (
    <div className="flex h-screen bg-[#f9fafb]">
      <Sidebar activePage="software-licenses" onNavigate={onNavigate} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header selectedCount={selected.size} />
        <AssetsToolbar searchQuery={searchQuery} setSearchQuery={setSearchQuery} title="Software Licenses" viewLabel="All Software Licenses" />
        <main className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-auto bg-white min-h-0">
            <SoftwareLicensesTable
              licenses={paginated}
              selected={selected}
              allSelected={allCurrentSelected}
              onSelectAll={handleSelectAll}
              onSelect={handleSelect}
              onSort={handleSort}
              sortColumn={sortColumn}
              sortDirection={sortDirection}
              onLicenseClick={handleOpenLicense}
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
      <SoftwareLicenseDrawer
        openAssets={openLicenses}
        activeAssetId={activeLicenseId}
        onClose={handleCloseDrawer}
        onCloseTab={handleCloseTab}
        onTabChange={handleTabChange}
        onOpenRelation={handleOpenRelation}
        onOpenSoftwareAsset={onOpenSoftwareAsset}
      />
    </div>
  );
}
