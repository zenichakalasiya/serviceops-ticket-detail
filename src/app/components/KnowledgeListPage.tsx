import { useState, useEffect } from 'react';
import { ChevronDown, X, Search, Plus, Folder, FolderOpen, Trash2 } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { KnowledgeTable } from './KnowledgeTable';
import { Pagination } from './Pagination';
import { useDrawerStack } from './DrawerStack';
import type { Patch } from './PatchesListPage';

/* Knowledge module — article listing, opened from the Knowledge (lightbulb) sidebar icon.
 * Layout: folder rail on the left (All Folders / custom folders / Trash) + the article grid on
 * the right (Name · Author · Status · Approval Status · Feedback). Built from the shared
 * Sidebar / Header / Pagination chrome so it matches every other list page. */

export interface KnowledgeArticle {
  id: string;
  name: string;
  author: string;
  status: 'Published' | 'Draft' | 'In Review' | 'Expired';
  approvalStatus: 'Not Requested' | 'Pending Approval' | 'Approved' | 'Rejected';
  likes: number;
  dislikes: number;
  /** Publication datetime (drives the Created KPI + its relative age). */
  created: string;
  /** How many times the article has been read (Total Read KPI). */
  totalRead: number;
  /** Folder the article lives in — matches a KNOWLEDGE_FOLDERS id. */
  folder: string;
}

/* Each folder carries who may READ it and who may WRITE to it — the two permissions the
   admin sets when the folder is created, and the ones a technician needs to know before
   filing an article here. Public = every requester can read it in the portal. */
export const KNOWLEDGE_FOLDERS = [
  { id: 'guideline', label: 'Guideline Documents', read: 'Public', write: 'All Technicians' },
  { id: 'faqs', label: 'FAQs', read: 'Public', write: 'All Technicians' },
  { id: 'troubleshooting', label: 'Troubleshooting Articles', read: 'All Technicians', write: 'Service Desk Group' },
  { id: 'policies', label: 'IT Policies', read: 'Public', write: 'IT Security Group' },
];

/* Trash is a folder in the rail but not in the list above — it needs its own pair. */
export const TRASH_PERMISSIONS = { read: 'Public', write: 'All Technicians' };

// Realistic service-desk knowledge base.
export const mockKnowledgeArticles: KnowledgeArticle[] = [
  { id: 'KB-1', name: 'Connecting to the Company VPN', author: 'Juli Mathew', status: 'Published', approvalStatus: 'Not Requested', likes: 24, dislikes: 1, created: 'Sun, Jul 19, 2026 10:58 PM', totalRead: 448, folder: 'guideline' },
  { id: 'KB-2', name: 'Unlocking a Locked Active Directory Account', author: 'Rosy Fernandes', status: 'Published', approvalStatus: 'Not Requested', likes: 18, dislikes: 0, created: 'Tue, Jun 30, 2026 04:12 PM', totalRead: 359, folder: 'troubleshooting' },
  { id: 'KB-3', name: 'Navigating the Support Portal', author: 'Rosy Fernandes', status: 'Published', approvalStatus: 'Approved', likes: 31, dislikes: 2, created: 'Mon, May 18, 2026 11:05 AM', totalRead: 593, folder: 'guideline' },
  { id: 'KB-4', name: 'How to Reset Your Password', author: 'Rosy Fernandes', status: 'Published', approvalStatus: 'Not Requested', likes: 47, dislikes: 3, created: 'Thu, Apr 09, 2026 09:41 AM', totalRead: 878, folder: 'faqs' },
  { id: 'KB-5', name: 'Requesting New Hardware for a New Joiner', author: 'Priya Nair', status: 'Published', approvalStatus: 'Approved', likes: 12, dislikes: 0, created: 'Wed, Jul 01, 2026 03:26 PM', totalRead: 296, folder: 'guideline' },
  { id: 'KB-6', name: 'Setting Up Multi-Factor Authentication', author: 'Karan Malhotra', status: 'Published', approvalStatus: 'Approved', likes: 39, dislikes: 1, created: 'Fri, Mar 13, 2026 05:50 PM', totalRead: 768, folder: 'guideline' },
  { id: 'KB-7', name: 'Outlook Keeps Asking for Credentials', author: 'Rahul Verma', status: 'Published', approvalStatus: 'Not Requested', likes: 22, dislikes: 4, created: 'Tue, Jun 16, 2026 12:18 PM', totalRead: 492, folder: 'troubleshooting' },
  { id: 'KB-8', name: 'Printer Not Responding on the Office Network', author: 'Neha Raje', status: 'Published', approvalStatus: 'Not Requested', likes: 15, dislikes: 2, created: 'Mon, Feb 23, 2026 10:07 AM', totalRead: 386, folder: 'troubleshooting' },
  { id: 'KB-9', name: 'Acceptable Use Policy for Company Devices', author: 'Farah Sheikh', status: 'Published', approvalStatus: 'Approved', likes: 8, dislikes: 0, created: 'Thu, Jan 15, 2026 02:33 PM', totalRead: 280, folder: 'policies' },
  { id: 'KB-10', name: 'Software Installation Request Process', author: 'Vikram Sethi', status: 'Published', approvalStatus: 'Not Requested', likes: 26, dislikes: 1, created: 'Sat, May 30, 2026 06:45 PM', totalRead: 599, folder: 'faqs' },
  { id: 'KB-11', name: 'Recovering Files from OneDrive Version History', author: 'Diya Kapoor', status: 'Published', approvalStatus: 'Not Requested', likes: 19, dislikes: 0, created: 'Wed, Apr 22, 2026 08:20 AM', totalRead: 493, folder: 'troubleshooting' },
  { id: 'KB-12', name: 'Data Classification and Handling Standard', author: 'Farah Sheikh', status: 'In Review', approvalStatus: 'Pending Approval', likes: 3, dislikes: 0, created: 'Fri, Jul 31, 2026 01:15 PM', totalRead: 234, folder: 'policies' },
  { id: 'KB-13', name: 'Configuring Email on a Mobile Device', author: 'Rohan Mehta', status: 'Published', approvalStatus: 'Not Requested', likes: 33, dislikes: 2, created: 'Tue, Dec 09, 2025 04:02 PM', totalRead: 757, folder: 'guideline' },
  { id: 'KB-14', name: 'Wi-Fi Drops on Meeting Room Floors', author: 'Siddharth Rao', status: 'Draft', approvalStatus: 'Not Requested', likes: 0, dislikes: 0, created: 'Mon, Aug 03, 2026 09:55 AM', totalRead: 209, folder: 'troubleshooting' },
  { id: 'KB-15', name: 'How Do I Track My Service Request?', author: 'Ananya Iyer', status: 'Published', approvalStatus: 'Not Requested', likes: 41, dislikes: 1, created: 'Thu, Mar 26, 2026 11:48 AM', totalRead: 919, folder: 'faqs' },
  { id: 'KB-16', name: 'Remote Work Security Guidelines', author: 'Karan Malhotra', status: 'Published', approvalStatus: 'Approved', likes: 17, dislikes: 0, created: 'Sun, Jun 07, 2026 07:30 PM', totalRead: 524, folder: 'policies' },
  { id: 'KB-17', name: 'BitLocker Recovery Key Retrieval', author: 'Priya Nair', status: 'Published', approvalStatus: 'Not Requested', likes: 14, dislikes: 1, created: 'Wed, Feb 11, 2026 03:05 PM', totalRead: 486, folder: 'troubleshooting' },
  { id: 'KB-18', name: 'Onboarding Checklist for New Employees', author: 'Juli Mathew', status: 'Published', approvalStatus: 'Approved', likes: 29, dislikes: 0, created: 'Fri, Nov 21, 2025 10:22 AM', totalRead: 754, folder: 'guideline' },
  { id: 'KB-19', name: 'What Is Covered by the IT Service Desk?', author: 'Ananya Iyer', status: 'Published', approvalStatus: 'Not Requested', likes: 11, dislikes: 2, created: 'Tue, May 05, 2026 05:14 PM', totalRead: 461, folder: 'faqs' },
  { id: 'KB-20', name: 'Legacy Windows 7 Migration Steps', author: 'Rahul Verma', status: 'Expired', approvalStatus: 'Rejected', likes: 5, dislikes: 6, created: 'Mon, Oct 13, 2025 08:38 AM', totalRead: 372, folder: 'guideline' },
];

/** Adapt a knowledge article onto the Patch shape the cloned KnowledgeDrawer body expects
 *  (same pattern as the other XToShape adapters in the drawer clone chain). */
export const knowledgeToPatchShape = (a: KnowledgeArticle): Patch => ({
  id: a.id,
  name: a.name,
  severity: 'Unspecified',
  releaseDate: '---',
  missingSystem: null,
  installedSystem: null,
  rebootRequired: 'No',
  approvalStatus: a.approvalStatus === 'Approved' ? 'Approved' : 'Not Approved',
  category: 'Knowledge Article',
  knowledge: {
    author: a.author,
    created: a.created,
    folder: KNOWLEDGE_FOLDERS.find((f) => f.id === a.folder)?.label ?? 'Uncategorised',
    totalRead: a.totalRead,
  },
});

// Articles the user moved to Trash (kept separate so folder counts stay honest).
export const TRASHED_IDS = new Set<string>();

export function KnowledgeListPage({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [articles] = useState<KnowledgeArticle[]>(mockKnowledgeArticles);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [activeFolder, setActiveFolder] = useState<string>('all');
  const [folderSearch, setFolderSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  useEffect(() => { setCurrentPage(1); setSelected(new Set()); }, [searchQuery, activeFolder]);

  const { open: openInStack } = useDrawerStack();
  const handleOpenArticle = (a: KnowledgeArticle) => {
    openInStack('knowledge', a.id, a.name, knowledgeToPatchShape(a));
  };

  const countFor = (id: string) => articles.filter((a) => a.folder === id && !TRASHED_IDS.has(a.id)).length;
  const visibleFolders = KNOWLEDGE_FOLDERS.filter((f) => !folderSearch.trim() || f.label.toLowerCase().includes(folderSearch.toLowerCase()));

  let filtered = articles.filter((a) => (activeFolder === 'trash' ? TRASHED_IDS.has(a.id) : !TRASHED_IDS.has(a.id)));
  if (activeFolder !== 'all' && activeFolder !== 'trash') filtered = filtered.filter((a) => a.folder === activeFolder);
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter((a) =>
      a.id.toLowerCase().includes(q) || a.name.toLowerCase().includes(q) ||
      a.author.toLowerCase().includes(q) || a.status.toLowerCase().includes(q) ||
      a.approvalStatus.toLowerCase().includes(q)
    );
  }

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const pageIds = paginated.map((a) => a.id);
  const allCurrentSelected = pageIds.length > 0 && pageIds.every((id) => selected.has(id));

  const handleSelectAll = (checked: boolean) => setSelected(checked ? new Set(pageIds) : new Set());
  const handleSelect = (id: string, checked: boolean) => {
    const next = new Set(selected);
    checked ? next.add(id) : next.delete(id);
    setSelected(next);
  };

  // Folder rail row — shared by the real folders and the All / Trash entries.
  const FolderRow = ({ id, label, icon, count }: { id: string; label: string; icon: React.ReactNode; count?: number }) => {
    const active = activeFolder === id;
    return (
      <button
        onClick={() => setActiveFolder(id)}
        className={`flex w-full items-center gap-2 rounded px-3 py-2 text-left text-[13px] transition-colors ${
          active ? 'bg-[#EBF5FF] font-medium text-[#3D8BD0]' : 'text-[#364658] hover:bg-[#F5F7FA]'
        }`}
      >
        <span className={`flex-shrink-0 ${active ? 'text-[#3D8BD0]' : 'text-[#7B8FA5]'}`}>{icon}</span>
        <span className="min-w-0 flex-1 truncate" title={label}>{label}</span>
        {count !== undefined && (
          <span className={`inline-flex h-[18px] min-w-[18px] flex-shrink-0 items-center justify-center rounded-full px-1 text-[11px] font-semibold ${
            active ? 'bg-[#3D8BD0] text-white' : 'bg-[#EEF2F6] text-[#64748B]'
          }`}>{count}</span>
        )}
      </button>
    );
  };

  return (
    <div className="flex h-screen bg-[#f9fafb]">
      <Sidebar activePage="knowledge" onNavigate={onNavigate} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header selectedCount={selected.size} />

        {/* Toolbar: title + full-width search + view dropdown + Create */}
        <div className="bg-white">
          <div className="px-6 py-3">
            <h1 className="text-[16px] font-semibold text-[#364658]">Knowledge</h1>
          </div>
          <div className="flex items-center gap-3 px-6 pb-3">
            <div className="relative min-w-0 flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Select field or enter a keyword to search..."
                className="h-[36px] w-full rounded border border-[#d1d5db] bg-white pl-3 pr-10 text-[13px] text-[#364658] placeholder:text-[#9ca3af] focus:border-[#3D8BD0] focus:outline-none focus:ring-1 focus:ring-[#3D8BD0]"
              />
              {searchQuery ? (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] transition-colors hover:text-[#364658]"><X size={16} /></button>
              ) : (
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" size={16} />
              )}
            </div>
            <button className="flex h-[36px] flex-shrink-0 items-center gap-1.5 rounded border border-[#DFE5ED] bg-white px-3 text-[13px] font-medium text-[#364658] hover:bg-[#F5F7FA]">
              All
              <ChevronDown size={15} className="text-[#6b7280]" />
            </button>
            <button className="flex h-[36px] flex-shrink-0 items-center gap-1.5 rounded bg-[#3D8BD0] px-3.5 text-[13px] font-medium text-white hover:bg-[#2d6ca0]">
              <Plus size={15} />
              Create
            </button>
          </div>
        </div>

        {/* Full-bleed like every other list page: no cards, just a single vertical rule
            between the folder rail and the grid. */}
        <main className="flex min-h-0 flex-1 overflow-hidden bg-white">
          {/* Folder rail */}
          <aside className="flex w-[260px] flex-shrink-0 flex-col overflow-hidden border-r border-[#e5e7eb]">
            <div className="flex flex-shrink-0 items-center justify-between px-4 py-3">
              <h2 className="text-[14px] font-semibold text-[#364658]">Folders</h2>
              <button title="New folder" className="flex size-7 items-center justify-center rounded text-[#3D8BD0] transition-colors hover:bg-[#EBF5FF]">
                <Plus size={16} />
              </button>
            </div>
            <div className="flex-shrink-0 px-3 pb-2">
              <div className="relative">
                <input
                  type="text"
                  value={folderSearch}
                  onChange={(e) => setFolderSearch(e.target.value)}
                  placeholder="Search"
                  className="h-8 w-full rounded border border-[#DFE5ED] bg-white pl-3 pr-8 text-[13px] text-[#364658] outline-none placeholder:text-[#9CA3AF] focus:border-[#3D8BD0] focus:ring-1 focus:ring-[#3D8BD0]"
                />
                <Search size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
              </div>
            </div>
            <div className="min-h-0 flex-1 space-y-0.5 overflow-y-auto px-3 pb-3">
              <FolderRow id="all" label="All Folders" icon={<FolderOpen size={15} />} />
              {visibleFolders.map((f) => (
                <FolderRow key={f.id} id={f.id} label={f.label} icon={<Folder size={15} />} count={countFor(f.id)} />
              ))}
              <div className="my-2 border-t border-[#F0F2F5]" />
              <FolderRow id="trash" label="Trash" icon={<Trash2 size={15} />} count={TRASHED_IDS.size} />
            </div>
          </aside>

          {/* Article grid */}
          <section className="flex min-w-0 flex-1 flex-col overflow-hidden">
            <div className="min-h-0 flex-1 overflow-auto">
              <KnowledgeTable
                articles={paginated}
                selected={selected}
                allSelected={allCurrentSelected}
                onSelectAll={handleSelectAll}
                onSelect={handleSelect}
                onArticleClick={handleOpenArticle}
              />
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              itemsPerPage={itemsPerPage}
              totalItems={filtered.length}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={(v) => { setItemsPerPage(v); setCurrentPage(1); }}
            />
          </section>
        </main>
      </div>
    </div>
  );
}
