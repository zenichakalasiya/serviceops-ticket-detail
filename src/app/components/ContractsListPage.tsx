import { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { AssetsToolbar } from './AssetsToolbar';
import { ContractsTable } from './ContractsTable';
import { Pagination } from './Pagination';
import { useDrawerStack } from './DrawerStack';
import { ContractDrawer } from './ContractDrawer';

export type ContractStatus = 'Active' | 'Not Started' | 'Expired';

export interface Contract {
  id: string;
  name: string;
  contractType: string;
  contractNumber: string | null;
  /** DD/MM/YYYY */
  startDate: string;
  endDate: string;
  status: ContractStatus;
  vendor: string;
  /** formatted cost or null */
  cost: string | null;
}

export const mockContracts: Contract[] = [
  { id: 'CON-106', name: 'Datacenter Storage Lease', contractType: 'Lease', contractNumber: null, startDate: '01/06/2027', endDate: '01/06/2028', status: 'Not Started', vendor: 'VEN-12: Hitachi Vantara', cost: '3,600,000.00 INR' },
  { id: 'CON-105', name: 'Datacenter Storage Lease', contractType: 'Lease', contractNumber: '342-HD', startDate: '01/06/2026', endDate: '01/07/2027', status: 'Active', vendor: 'VEN-12: Hitachi Vantara', cost: '3,250,000.00 INR' },
  { id: 'CON-104', name: 'Core Switch AMC', contractType: 'Maintenance', contractNumber: '123456789', startDate: '16/05/2026', endDate: '29/07/2026', status: 'Active', vendor: 'VEN-61: Cisco Systems', cost: '500,000.00 INR' },
  { id: 'CON-103', name: 'Office Printer Lease', contractType: 'Lease', contractNumber: null, startDate: '08/05/2026', endDate: '30/04/2027', status: 'Active', vendor: 'VEN-12: Hitachi Vantara', cost: '420,000.00 INR' },
  { id: 'CON-97', name: 'Firewall Support', contractType: 'Support', contractNumber: null, startDate: '27/05/2026', endDate: '24/07/2026', status: 'Active', vendor: 'VEN-22: Hewlett Packard', cost: '185,000.00 INR' },
  { id: 'CON-94', name: 'Imperva DAM License', contractType: 'Support', contractNumber: null, startDate: '26/03/2026', endDate: '27/03/2027', status: 'Active', vendor: 'VEN-61: Imperva', cost: '1,750,000.00 INR' },
  { id: 'CON-89', name: 'Microsoft Enterprise Agreement', contractType: 'Maintenance', contractNumber: null, startDate: '05/02/2026', endDate: '05/02/2027', status: 'Active', vendor: 'VEN-15: Microsoft', cost: '4,200,000.00 INR' },
  { id: 'CON-88', name: 'Server Hardware Warranty', contractType: 'Warranty', contractNumber: null, startDate: '01/01/2026', endDate: '03/01/2027', status: 'Active', vendor: 'VEN-56: Dell Technologies', cost: '850,000.00 INR' },
  { id: 'CON-87', name: 'Backup Appliance Warranty', contractType: 'Warranty', contractNumber: 'ABX-771', startDate: '02/01/2026', endDate: '02/01/2027', status: 'Active', vendor: 'VEN-56: Dell Technologies', cost: '1,000,000.00 INR' },
  { id: 'CON-78', name: 'Storage Maintenance', contractType: 'Maintenance', contractNumber: null, startDate: '10/10/2025', endDate: '16/07/2026', status: 'Active', vendor: 'VEN-12: Hitachi Vantara', cost: '675,000.00 INR' },
  { id: 'CON-77', name: 'ServiceOps Support', contractType: 'Support', contractNumber: 'SUP-123', startDate: '01/10/2025', endDate: '02/10/2026', status: 'Active', vendor: 'VEN-12: Hitachi Vantara', cost: '1,200,000.00 INR' },
  { id: 'CON-76', name: 'UPS Lease', contractType: 'Lease', contractNumber: null, startDate: '01/10/2025', endDate: '01/10/2026', status: 'Active', vendor: 'VEN-53: Schneider Electric', cost: '2,000,000.00 INR' },
  { id: 'CON-74', name: 'Motadata SaaS Subscription', contractType: 'Support', contractNumber: null, startDate: '21/08/2025', endDate: '09/07/2026', status: 'Active', vendor: 'VEN-49: Motadata', cost: '2,400,000.00 INR' },
  { id: 'CON-72', name: 'Motadata SaaS Subscription', contractType: 'Support', contractNumber: null, startDate: '22/08/2025', endDate: '21/08/2026', status: 'Active', vendor: 'VEN-49: Motadata', cost: '2,400,000.00 INR' },
  { id: 'CON-63', name: 'Laptop Fleet Warranty', contractType: 'Warranty', contractNumber: null, startDate: '17/04/2025', endDate: '17/04/2028', status: 'Active', vendor: 'VEN-25: HP Inc.', cost: '1,450,000.00 INR' },
  { id: 'CON-59', name: 'VPN Appliance Warranty', contractType: 'Warranty', contractNumber: '654321', startDate: '05/08/2026', endDate: '25/02/2028', status: 'Not Started', vendor: 'VEN-25: HP Inc.', cost: '320,000.00 INR' },
  { id: 'CON-57', name: 'AMC for Laptops (2022+)', contractType: 'Maintenance', contractNumber: null, startDate: '06/01/2025', endDate: '22/01/2027', status: 'Active', vendor: 'VEN-44: Lenovo', cost: '980,000.00 INR' },
];

export function ContractsListPage({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [contracts] = useState<Contract[]>(mockContracts);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [sortColumn, setSortColumn] = useState<keyof Contract | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [searchQuery, setSearchQuery] = useState('');
  const [openContracts, setOpenContracts] = useState<Contract[]>([]);
  const [activeContractId, setActiveContractId] = useState<string | null>(null);

  useEffect(() => { setCurrentPage(1); }, [searchQuery]);

  const { open: openInStack } = useDrawerStack();

  const handleOpenContract = (contract: Contract) => {
    openInStack('contracts', contract.id, contract.name, contract);
  };

  const handleOpenRelation = (rel: { ticketId: string; subject: string }) => {
    handleOpenContract({ ...mockContracts[Math.abs([...rel.ticketId].reduce((a, c) => a + c.charCodeAt(0), 0)) % mockContracts.length], id: rel.ticketId, name: rel.subject });
  };

  const handleCloseDrawer = () => { setOpenContracts([]); setActiveContractId(null); };

  const handleCloseTab = (contractId: string) => {
    const updated = openContracts.filter(c => c.id !== contractId);
    setOpenContracts(updated);
    if (activeContractId === contractId) {
      setActiveContractId(updated.length > 0 ? updated[updated.length - 1].id : null);
    }
  };

  const handleTabChange = (contractId: string) => setActiveContractId(contractId);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const ids = new Set(contracts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(c => c.id));
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

  const handleSort = (column: keyof Contract) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  let filtered = contracts;
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filtered = contracts.filter(c =>
      c.id.toLowerCase().includes(q) ||
      c.name.toLowerCase().includes(q) ||
      c.contractType.toLowerCase().includes(q) ||
      (c.contractNumber ?? '').toLowerCase().includes(q) ||
      c.status.toLowerCase().includes(q) ||
      c.vendor.toLowerCase().includes(q)
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
  const currentPageIds = paginated.map(c => c.id);
  const allCurrentSelected = currentPageIds.every(id => selected.has(id)) && currentPageIds.length > 0;

  return (
    <div className="flex h-screen bg-[#f9fafb]">
      <Sidebar activePage="contracts" onNavigate={onNavigate} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header selectedCount={selected.size} />
        <AssetsToolbar searchQuery={searchQuery} setSearchQuery={setSearchQuery} title="Contracts" viewLabel="All Open Contracts" />
        <main className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-auto bg-white min-h-0">
            <ContractsTable
              contracts={paginated}
              selected={selected}
              allSelected={allCurrentSelected}
              onSelectAll={handleSelectAll}
              onSelect={handleSelect}
              onSort={handleSort}
              sortColumn={sortColumn}
              sortDirection={sortDirection}
              onContractClick={handleOpenContract}
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
      <ContractDrawer
        openAssets={openContracts}
        activeAssetId={activeContractId}
        onClose={handleCloseDrawer}
        onCloseTab={handleCloseTab}
        onTabChange={handleTabChange}
        onOpenRelation={handleOpenRelation}
      />
    </div>
  );
}
