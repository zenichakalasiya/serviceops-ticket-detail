/* VENDORED from the upstream prototype (ronak-patel-motadata/ServiceOps-Ticket-Detail-, Oct 2026 sync).
   Used ONLY by the detail pages and listings brought in from upstream — this project's own detail
   pages keep their own version in ../. Do not edit to change our pages; edit ../ instead. */
import { Plus, Link2, X, ChevronDown, Search, MoreVertical, Filter, Check } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface Relation {
  id: string;
  type: string;
  ticketId: string;
  subject: string;
  status: string;
  assignedTo: {
    name: string;
    avatar?: string;
  };
  priority: string;
}

interface TicketItem {
  id: string;
  ticketId: string;
  subject: string;
  status: string;
  priority: string;
}

interface RelationsTabContentProps {
  ticketId?: string;
  externalRelations?: Relation[];
  initialTypeFilter?: string | null;
  onClearTypeFilter?: () => void;
  /** Open a related item as a new tab in the same drawer. */
  onOpenRelation?: (rel: Relation) => void;
  /** Hide the "Create And Relate" / "Add Relation" controls (read-only relations). */
  hideAddRelation?: boolean;
}

export function RelationsTabContent({ ticketId, externalRelations = [], initialTypeFilter = null, onClearTypeFilter, onOpenRelation, hideAddRelation = false }: RelationsTabContentProps = {}) {
  // Empty state for blank ticket (INC-32)
  const isBlankTicket = ticketId === 'INC-32';
  
  // Determine initial relations
  const getInitialRelations = (): Relation[] => {
    if (externalRelations.length > 0) {
      return externalRelations;
    }

    // Return empty array by default - relations should only show when users add them
    return [];
  };
  
  const [relations, setRelations] = useState<Relation[]>(getInitialRelations());

  const [showAddRelation, setShowAddRelation] = useState(false);
  const [showAddRelationDropdown, setShowAddRelationDropdown] = useState(false);
  const [showTicketSelectionModal, setShowTicketSelectionModal] = useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showStatusFilterDropdown, setShowStatusFilterDropdown] = useState(false);
  const [showTaskSortMenu, setShowTaskSortMenu] = useState(false);
  const [selectedType, setSelectedType] = useState('');
  const [searchTicket, setSearchTicket] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTickets, setSelectedTickets] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState('All Open Requests');
  const [activeFilters, setActiveFilters] = useState<string[]>(['Status Not In Closed']);
  // Filter the list by relation type (e.g. Request / Asset) — set from the "Affected Items" pills
  const [typeFilter, setTypeFilter] = useState<string | null>(initialTypeFilter);
  useEffect(() => { setTypeFilter(initialTypeFilter); }, [initialTypeFilter]);
  const typeDropdownRef = useRef<HTMLDivElement>(null);
  const addRelationDropdownRef = useRef<HTMLDivElement>(null);
  const statusFilterDropdownRef = useRef<HTMLDivElement>(null);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  const relationTypes = [
    'Request',
    'Problem',
    'Change',
    'Release',
    'Asset',
    'CI',
    'Contract',
    'Knowledge',
    'Purchase',
    'Project'
  ];

  // Sync external relations when they change
  useEffect(() => {
    if (externalRelations.length > 0) {
      setRelations(externalRelations);
    }
  }, [externalRelations]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(event.target as Node)) {
        setShowTypeDropdown(false);
      }
      if (addRelationDropdownRef.current && !addRelationDropdownRef.current.contains(event.target as Node)) {
        setShowAddRelationDropdown(false);
      }
      if (statusFilterDropdownRef.current && !statusFilterDropdownRef.current.contains(event.target as Node)) {
        setShowStatusFilterDropdown(false);
      }
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
        setShowTaskSortMenu(false);
      }
    };

    if (showTypeDropdown || showAddRelationDropdown || showStatusFilterDropdown || showTaskSortMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showTypeDropdown, showAddRelationDropdown, showStatusFilterDropdown, showTaskSortMenu]);

  const handleSelectRelationType = (type: string) => {
    setSelectedType(type);
    setShowAddRelationDropdown(false);
    setShowTicketSelectionModal(true);
    setSelectedTickets([]);
    setSearchQuery('');
  };

  const handleAddRelation = () => {
    if (selectedType && searchTicket) {
      const newRelation: Relation = {
        id: String(relations.length + 1),
        type: selectedType,
        ticketId: searchTicket,
        subject: 'Sample request subject',
        status: 'Open',
        assignedTo: {
          name: 'John Doe',
          avatar: 'https://via.placeholder.com/30'
        },
        priority: 'High'
      };
      setRelations([...relations, newRelation]);
      setShowAddRelation(false);
      setSelectedType('');
      setSearchTicket('');
    }
  };

  const handleRemoveRelation = (id: string) => {
    setRelations(relations.filter(r => r.id !== id));
  };

  const getStatusDotColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open':
        return 'bg-[#1E40AF]';
      case 'in progress':
        return 'bg-[#92400E]';
      case 'pending':
        return 'bg-[#D97706]';
      case 'resolved':
        return 'bg-[#065F46]';
      case 'closed':
        return 'bg-[#374151]';
      default:
        return 'bg-[#6B7280]';
    }
  };

  const getPriorityDotColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
      case 'urgent':
        return 'bg-[#DC2626]';
      case 'medium':
        return 'bg-[#D97706]';
      case 'low':
        return 'bg-[#2563EB]';
      default:
        return 'bg-[#6B7280]';
    }
  };

  // Mock ticket data generator
  const getMockTickets = (type: string): TicketItem[] => {
    const prefix = type === 'Request' ? 'REQ' : 
                   type === 'Problem' ? 'PRB' :
                   type === 'Change' ? 'CHG' :
                   type === 'Release' ? 'REL' :
                   type === 'Asset' ? 'AST' :
                   type === 'CI' ? 'CI' :
                   type === 'Contract' ? 'CNT' :
                   type === 'Knowledge' ? 'KB' :
                   type === 'Purchase' ? 'PO' : 'PRJ';
    
    const statuses = ['Open', 'In Progress', 'Pending', 'Resolved'];
    const priorities = ['Low', 'Medium', 'High', 'Urgent'];
    
    const subjects = [
      'Access request for new employee',
      'Network connectivity issue affecting multiple users',
      'Software installation request for team',
      'Hardware replacement needed urgently',
      'Password reset for user account',
      'Email configuration problem',
      'VPN connection not working',
      'Printer setup assistance required',
      'New laptop provisioning',
      'Database access permission needed'
    ];
    
    return Array.from({ length: 10 }, (_, i) => ({
      id: `${type}-${i + 1}`,
      ticketId: `${prefix}-${(1000 + i).toString()}`,
      subject: subjects[i],
      status: statuses[i % statuses.length],
      priority: priorities[i % priorities.length]
    }));
  };

  const availableTickets = getMockTickets(selectedType);

  const filteredTickets = availableTickets.filter(ticket => {
    const matchesSearch = searchQuery === '' || 
      ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.ticketId.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = !activeFilters.includes('Status Not In Closed') || 
      ticket.status.toLowerCase() !== 'closed';
    
    return matchesSearch && matchesFilter;
  });

  const handleToggleTicket = (ticketId: string) => {
    setSelectedTickets(prev =>
      prev.includes(ticketId)
        ? prev.filter(id => id !== ticketId)
        : [...prev, ticketId]
    );
  };

  const handleToggleAll = () => {
    if (selectedTickets.length === filteredTickets.length) {
      setSelectedTickets([]);
    } else {
      setSelectedTickets(filteredTickets.map(t => t.id));
    }
  };

  const handleAddSelectedRelations = () => {
    const newRelations = availableTickets
      .filter(ticket => selectedTickets.includes(ticket.id))
      .map(ticket => ({
        id: String(relations.length + selectedTickets.indexOf(ticket.id) + 1),
        type: selectedType,
        ticketId: ticket.ticketId,
        subject: ticket.subject,
        status: ticket.status,
        assignedTo: {
          name: 'John Doe',
          avatar: 'https://via.placeholder.com/30'
        },
        priority: ticket.priority
      }));
    
    setRelations([...relations, ...newRelations]);
    setShowTicketSelectionModal(false);
    setSelectedTickets([]);
    setSelectedType('');
  };

  const handleRemoveFilter = (filter: string) => {
    setActiveFilters(prev => prev.filter(f => f !== filter));
  };

  // Count relations by type for the filter pills (only types with data are shown).
  const typeCounts = relations.reduce((acc, r) => {
    acc[r.type] = (acc[r.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const presentTypes = relationTypes.filter((t) => (typeCounts[t] || 0) > 0);

  /* With the "All" pill gone the pills read as sub-tabs, so one is always selected: fall back to
     the first type that has data. Runs whenever the current selection stops being valid — a new
     record, or relations that no longer include the selected type. */
  useEffect(() => {
    if (!presentTypes.length) return;
    if (!typeFilter || !presentTypes.includes(typeFilter)) setTypeFilter(presentTypes[0]);
  }, [presentTypes.join('|'), typeFilter]);

  return (
    <div className="px-6 pb-6 pt-3">
      {/* Add Relation Button - Show at top only when there are relations */}
      {relations.length > 0 && (
        <div className="mb-4 relative @container">
          <div className="flex items-center gap-2 justify-between">
            {/* Narrow view: All + filter dropdown */}
            <div className="relative @2xl:hidden" ref={sortDropdownRef}>
              <button
                onClick={() => setShowTaskSortMenu(!showTaskSortMenu)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-[#DFE5ED] rounded hover:bg-[#F5F7FA] hover:border-[#3D8BD0] transition-colors text-[13px] font-medium text-[#364658]"
                title="Filter by type"
              >
                <Filter size={14} className="text-[#6b7280]" />
                <span>{typeFilter || 'All'}</span>
                <ChevronDown size={14} className="text-[#7B8FA5]" />
              </button>

              {showTaskSortMenu && (
                <div className="app-menu absolute top-full left-0 mt-1 bg-white border border-[#E5E7EB] rounded-lg shadow-lg py-1 z-50 max-h-[280px] overflow-y-auto w-[180px]">
                  <button
                    onClick={() => { setTypeFilter(null); onClearTypeFilter?.(); setShowTaskSortMenu(false); }}
                    className="w-full flex items-center justify-between px-3 py-2 text-[13px] text-left hover:bg-[#F9FAFB] text-[#364658] transition-colors"
                  >
                    All
                    {!typeFilter && <Check size={14} className="text-[#3D8BD0]" />}
                  </button>
                  {relationTypes.map((type) => (
                    <button
                      key={type}
                      onClick={() => {
                        setTypeFilter(type);
                        setShowTaskSortMenu(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 text-[13px] text-left hover:bg-[#F9FAFB] text-[#364658] transition-colors"
                    >
                      {type}
                      {typeFilter === type && <Check size={14} className="text-[#3D8BD0]" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {/* Wide view: one pill per type with data. No "All" pill — with nothing selected the
                list already shows everything, and an active pill clears on a second click. */}
            <div className="hidden @2xl:flex items-center gap-2 flex-wrap min-w-0">
              {presentTypes.map((type) => (
                <button
                  key={type}
                  // Sub-tab behaviour: selecting switches, it never deselects to an empty state.
                  onClick={() => setTypeFilter(type)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded border text-[13px] font-medium transition-colors ${typeFilter === type ? 'bg-[#EBF5FF] border-[#3D8BD0] text-[#3D8BD0]' : 'bg-white border-[#DFE5ED] text-[#364658] hover:bg-[#F5F7FA] hover:border-[#3D8BD0]'}`}
                >
                  {type}
                  <span className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[11px] font-semibold ${typeFilter === type ? 'bg-[#3D8BD0] text-white' : 'bg-[#EEF2F6] text-[#64748B]'}`}>
                    {typeCounts[type]}
                  </span>
                </button>
              ))}
            </div>
            {!hideAddRelation && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {/* TODO: Implement create and relate functionality */}}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white border border-[#DFE5ED] text-[#364658] text-[13px] font-medium rounded hover:bg-[#F5F7FA] hover:border-[#3D8BD0] transition-colors whitespace-nowrap"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M10.8619 1.52925C11.1223 1.2689 11.5444 1.2689 11.8047 1.52925L14.4714 4.19591C14.7318 4.45626 14.7318 4.87837 14.4714 5.13872L5.80474 13.8054C5.67971 13.9304 5.51014 14.0007 5.33333 14.0007H2.66667C2.29848 14.0007 2 13.7022 2 13.334V10.6673C2 10.4905 2.07024 10.3209 2.19526 10.1959L8.86179 3.52939L10.8619 1.52925ZM9.33333 4.94346L3.33333 10.9435V12.6673H5.05719L11.0572 6.66732L9.33333 4.94346ZM12 5.72451L13.0572 4.66732L11.3333 2.94346L10.2761 4.00065L12 5.72451Z" fill="#7B8FA5"/>
                </svg>
                Create And Relate
              </button>
              <button
                onClick={() => setShowAddRelationDropdown(!showAddRelationDropdown)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white border border-[#DFE5ED] text-[#364658] text-[13px] font-medium rounded hover:bg-[#F5F7FA] hover:border-[#3D8BD0] transition-colors whitespace-nowrap"
              >
                <Plus size={16} />
                Add Relation
              </button>
            </div>
            )}
          </div>

          {showAddRelationDropdown && (
            <div
              className="app-menu absolute top-full right-0 mt-1 bg-white border border-[#E5E7EB] rounded-lg shadow-lg py-1 z-50 max-h-[240px] overflow-y-auto w-[160px]"
              ref={addRelationDropdownRef}
            >
              {relationTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => handleSelectRelationType(type)}
                  className="w-full px-3 py-2 text-[13px] text-left hover:bg-[#F9FAFB] text-[#364658] transition-colors"
                >
                  {type}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Relation Form */}
      {showAddRelation && (
        <div className="mb-6 p-4 bg-[#F9FAFB] rounded-lg border border-[#E5E7EB]">
          <div className="space-y-4">
            <div>
              <label className="block text-[13px] font-medium text-[#364658] mb-2">
                Relation Type
              </label>
              <div className="relative" ref={typeDropdownRef}>
                <button
                  onClick={() => setShowTypeDropdown(!showTypeDropdown)}
                  className="w-full px-3 py-2 bg-white border border-[#DFE5ED] rounded-lg text-[13px] text-left flex items-center justify-between hover:border-[#3D8BD0] transition-colors"
                >
                  <span className={selectedType ? 'text-[#364658]' : 'text-[#9CA3AF]'}>
                    {selectedType || 'Select type...'}
                  </span>
                  <ChevronDown size={16} className="text-[#9CA3AF]" />
                </button>

                {showTypeDropdown && (
                  <div className="app-menu absolute top-full left-0 right-0 mt-1 bg-white border border-[#E5E7EB] rounded-lg shadow-lg py-1 z-50 max-h-[240px] overflow-y-auto">
                    {relationTypes.map((type) => (
                      <button
                        key={type}
                        onClick={() => {
                          setSelectedType(type);
                          setShowTypeDropdown(false);
                        }}
                        className="w-full px-3 py-2 text-[13px] text-left hover:bg-[#F9FAFB] text-[#364658] transition-colors"
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-medium text-[#364658] mb-2">
                Ticket ID or Search
              </label>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                <input
                  type="text"
                  value={searchTicket}
                  onChange={(e) => setSearchTicket(e.target.value)}
                  placeholder="Enter request ID or search..."
                  className="w-full pl-10 pr-3 py-2 bg-white border border-[#DFE5ED] rounded text-[13px] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#3D8BD0] transition-colors"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 justify-end">
              <button
                onClick={() => {
                  setShowAddRelation(false);
                  setSelectedType('');
                  setSearchTicket('');
                }}
                className="px-4 py-2 bg-white border border-[#DFE5ED] text-[#364658] text-[13px] font-medium rounded hover:bg-[#F5F7FA] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddRelation}
                disabled={!selectedType || !searchTicket}
                className="px-4 py-2 bg-[#3D8BD0] text-white text-[13px] font-medium rounded hover:bg-[#2E6BA4] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Relations List */}
      {relations.length === 0 ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="text-center">
            <div className="inline-flex items-center justify-center size-16 rounded-full bg-[#F5F7FA] mb-4">
              <Link2 className="size-8 text-[#7B8FA5]" />
            </div>
            <h3 className="text-[16px] font-semibold text-[#364658] mb-2">No Relations</h3>
            <p className="text-[13px] text-[#7B8FA5] mb-4">
              Link this ticket to related requests, problems, changes, or other items
            </p>
            {/* Add Relation Buttons - Show in empty state */}
            {!hideAddRelation && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => {/* TODO: Implement create and relate functionality */}}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white border border-[#DFE5ED] text-[#364658] text-[13px] font-medium rounded hover:bg-[#F5F7FA] hover:border-[#3D8BD0] transition-colors whitespace-nowrap"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M10.8619 1.52925C11.1223 1.2689 11.5444 1.2689 11.8047 1.52925L14.4714 4.19591C14.7318 4.45626 14.7318 4.87837 14.4714 5.13872L5.80474 13.8054C5.67971 13.9304 5.51014 14.0007 5.33333 14.0007H2.66667C2.29848 14.0007 2 13.7022 2 13.334V10.6673C2 10.4905 2.07024 10.3209 2.19526 10.1959L8.86179 3.52939L10.8619 1.52925ZM9.33333 4.94346L3.33333 10.9435V12.6673H5.05719L11.0572 6.66732L9.33333 4.94346ZM12 5.72451L13.0572 4.66732L11.3333 2.94346L10.2761 4.00065L12 5.72451Z" fill="#7B8FA5"/>
                </svg>
                Create And Relate
              </button>
              <div className="relative inline-block">
                <button
                  onClick={() => setShowAddRelationDropdown(!showAddRelationDropdown)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white border border-[#DFE5ED] text-[#364658] text-[13px] font-medium rounded hover:bg-[#F5F7FA] hover:border-[#3D8BD0] transition-colors whitespace-nowrap"
                >
                  <Plus size={16} />
                  Add Relation
                </button>

                {showAddRelationDropdown && (
                  <div
                    className="app-menu absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-white border border-[#E5E7EB] rounded-lg shadow-lg py-1 z-50 max-h-[240px] overflow-y-auto min-w-[200px]"
                    ref={addRelationDropdownRef}
                  >
                    {relationTypes.map((type) => (
                      <button
                        key={type}
                        onClick={() => handleSelectRelationType(type)}
                        className="w-full px-3 py-2 text-[13px] text-left hover:bg-[#F9FAFB] text-[#364658] transition-colors"
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {relations.filter((relation) => !typeFilter || relation.type === typeFilter).map((relation) => (
            <div
              key={relation.id}
              className="p-3 bg-white border border-[#E5E7EB] rounded-lg hover:border-[#3D8BD0] transition-colors group"
            >
              <div className="space-y-2">
                {/* First Row: ID & Name (left) and Delete Icon (right) */}
                <div className="flex items-start justify-between gap-3">
                  <div
                    className={`flex items-center gap-2 min-w-0 flex-1 ${onOpenRelation ? 'cursor-pointer' : ''}`}
                    onClick={() => onOpenRelation?.(relation)}
                    title={onOpenRelation ? `Open ${relation.ticketId} in this drawer` : undefined}
                  >
                    {/* Same id pill as the drawer headers and every other record reference:
                        tinted background, primary blue text. */}
                    <span className="flex-shrink-0 rounded bg-[#e8f4fd] px-2 py-0.5 text-[13px] font-semibold text-[#3D8BD0]">
                      {relation.ticketId}
                    </span>
                    <span className="font-semibold text-[#364658] truncate text-[14px] group-hover:text-[#3D8BD0] transition-colors">
                      {relation.subject}
                    </span>
                  </div>
                  <button
                    onClick={() => handleRemoveRelation(relation.id)}
                    className="p-1.5 hover:bg-[#FEE2E2] rounded transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                    title="Remove relation"
                  >
                    <X size={16} className="text-[#EF4444]" />
                  </button>
                </div>

                {/* Second Row: Requester, Status, Priority — inline label: value */}
                <div className="flex items-center flex-wrap gap-x-8 gap-y-1.5">
                  {/* Assigned To */}
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-[#7B8FA5] font-medium text-[12px] flex-shrink-0">Assignee:</span>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div className="flex-shrink-0 w-[18px] h-[18px] rounded bg-[#3D8BD0] flex items-center justify-center text-white text-[8px] font-medium">
                        {relation.assignedTo.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className="text-[13px] font-medium text-[#364658] truncate">
                        {relation.assignedTo.name}
                      </span>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#7B8FA5] font-medium text-[12px] flex-shrink-0">Status:</span>
                    <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#364658]">
                      <span className={`size-2 rounded-full ${getStatusDotColor(relation.status)}`}></span>
                      {relation.status}
                    </span>
                  </div>

                  {/* Priority */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#7B8FA5] font-medium text-[12px] flex-shrink-0">Priority:</span>
                    <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#364658]">
                      <span className={`size-2 rounded-full ${getPriorityDotColor(relation.priority)}`}></span>
                      {relation.priority}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Ticket Selection Modal */}
      {showTicketSelectionModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex justify-end">
          <div className="bg-white shadow-2xl w-[70vw] max-w-[900px] h-full flex flex-col animate-slide-in-right">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
              <h2 className="text-[18px] font-semibold text-[#364658]">
                Add {selectedType} Relation
              </h2>
              <button
                onClick={() => {
                  setShowTicketSelectionModal(false);
                  setSelectedTickets([]);
                  setSelectedType('');
                }}
                className="p-1 hover:bg-[#F3F4F6] rounded transition-colors"
              >
                <X size={20} className="text-[#6B7280]" />
              </button>
            </div>

            {/* Search and Filters */}
            <div className="px-6 py-4 border-b border-[#E5E7EB] space-y-3">
              {/* Search Bar */}
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search requests..."
                  className="w-full pl-10 pr-3 py-2 bg-white border border-[#DFE5ED] rounded text-[13px] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#3D8BD0] transition-colors"
                />
              </div>

              {/* Filter Row */}
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto">
              <table className="w-full">
                <thead className="bg-[#F9FAFB] sticky top-0">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedTickets.length === filteredTickets.length && filteredTickets.length > 0}
                        onChange={handleToggleAll}
                        className="size-4 rounded border-[#DFE5ED] text-[#3D8BD0] focus:ring-[#3D8BD0] cursor-pointer"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-[12px] font-semibold text-[#6B7280] uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-[12px] font-semibold text-[#6B7280] uppercase tracking-wider">
                      Subject
                    </th>
                    <th className="px-6 py-3 text-left text-[12px] font-semibold text-[#6B7280] uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-[12px] font-semibold text-[#6B7280] uppercase tracking-wider">
                      Priority
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-[#E5E7EB]">
                  {filteredTickets.map((ticket) => (
                    <tr
                      key={ticket.id}
                      className="hover:bg-[#F9FAFB] cursor-pointer transition-colors"
                      onClick={() => handleToggleTicket(ticket.id)}
                    >
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedTickets.includes(ticket.id)}
                          onChange={() => handleToggleTicket(ticket.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="size-4 rounded border-[#DFE5ED] text-[#3D8BD0] focus:ring-[#3D8BD0] cursor-pointer"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-1 bg-[#EFF6FF] text-[#3D8BD0] text-[13px] font-medium rounded">
                          {ticket.ticketId}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-[13px] text-[#364658]">
                          {ticket.subject}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-2 text-[13px] font-medium text-[#364658]">
                          <span className={`size-2 rounded-full ${getStatusDotColor(ticket.status)}`}></span>
                          {ticket.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-2 text-[13px] font-medium text-[#364658]">
                          <span className={`size-2 rounded-full ${getPriorityDotColor(ticket.priority)}`}></span>
                          {ticket.priority}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-[#E5E7EB] flex items-center justify-between">
              <div className="text-[13px] text-[#6B7280]">
                {selectedTickets.length} ticket{selectedTickets.length !== 1 ? 's' : ''} selected
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setShowTicketSelectionModal(false);
                    setSelectedTickets([]);
                    setSelectedType('');
                  }}
                  className="px-4 py-2 bg-white border border-[#DFE5ED] text-[#364658] text-[13px] font-medium rounded hover:bg-[#F5F7FA] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddSelectedRelations}
                  disabled={selectedTickets.length === 0}
                  className="px-4 py-2 bg-[#3D8BD0] text-white text-[13px] font-medium rounded hover:bg-[#2E6BA4] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Relations
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}