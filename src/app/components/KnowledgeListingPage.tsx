/* ── Knowledge listing ───────────────────────────────────────────────────────
   The shared register chrome (AssetRegisterPage) over the REAL mockKnowledgeArticles:
   moduleCols="knowledge" columns (Name · Author · Status · Approval Status ·
   Feedback), with the module's FOLDER rail down the left where the CMDB puts its CI
   classes. Picking a folder narrows the grid; Trash is a folder like any other.

   Landing on the module shows KnowledgeHome — the top articles — rather than every
   row at once; the grid takes over as soon as a folder, a search or a filter asks
   for one.

   Clicks open the real KnowledgeDrawer via the DrawerStack, as before. */
import { useMemo, useState } from 'react';
import { AssetRegisterPage } from './AssetRegisterPage';
import { KnowledgeFolderRail } from './KnowledgeFolderRail';
import { KnowledgeHome } from './KnowledgeHome';
import { KNOWLEDGE_QUICK_FILTERS } from './TicketFilterBar';
import { KNOWLEDGE_FILTER_ATTRS } from './knowledgeFilterAttrs';
import { Eye, SquarePen } from 'lucide-react';
import { toast } from 'sonner';
import {
  KNOWLEDGE_FOLDERS,
  TRASHED_IDS,
  TRASH_PERMISSIONS,
  knowledgeToPatchShape,
  mockKnowledgeArticles,
  type KnowledgeArticle,
} from './KnowledgeListPage';
import type { Ticket } from './TicketListPage';

const initialsOf = (n: string) => n.split(' ').filter(Boolean).map((p) => p[0]).join('').slice(0, 2).toUpperCase();
const folderLabel = (id: string) => KNOWLEDGE_FOLDERS.find((f) => f.id === id)?.label ?? id;

/* Who may read this folder and who may write to it — the two things a technician needs to
   know BEFORE filing an article here, so they sit above the list rather than inside a
   settings dialog. Icon badge + label over value: the detail pages' property language. */
function FolderPermissions({ read, write }: { read: string; write: string }) {
  const item = (icon: React.ReactNode, label: string, value: string) => (
    <span className="flex min-w-0 items-center gap-2.5">
      <span className="flex size-7 flex-shrink-0 items-center justify-center rounded bg-[#3D8BD0]/10 text-[#3D8BD0]">{icon}</span>
      <span className="min-w-0">
        <span className="block text-[12px] leading-tight text-[#64748B]">{label}</span>
        <span className="block truncate text-[13px] font-medium leading-tight text-[#364658]">{value}</span>
      </span>
    </span>
  );
  return (
    /* pl-6 lines the first badge up with the grid's checkbox gutter below it. */
    <div className="flex flex-wrap items-center gap-x-10 gap-y-3 border-b border-[#F1F5F9] py-3 pl-6 pr-4">
      {item(<Eye size={15} />, 'Read Permission', read)}
      {item(<SquarePen size={15} />, 'Write Permission', write)}
    </div>
  );
}

const KB: { rows: Ticket[]; byId: Map<string, KnowledgeArticle> } = (() => {
  const byId = new Map<string, KnowledgeArticle>();
  const rows = mockKnowledgeArticles.map((a) => {
    byId.set(a.id, a);
    /* "Sun, Jul 19, 2026 10:58 PM" — drop the weekday so Date can read it. */
    const created = new Date(a.created.replace(/^[A-Za-z]{3},\s*/, ''));
    return {
      id: a.id,
      subject: a.name,
      requester: a.author,
      dueBy: created,
      createdBy: created,
      assignedTo: { name: a.author, initials: initialsOf(a.author) },
      status: a.status as Ticket['status'],
      priority: 'Medium',
      x_approvalStatus: a.approvalStatus,
      x_folder: folderLabel(a.folder),
      x_likes: a.likes,
      x_dislikes: a.dislikes,
      x_totalRead: a.totalRead,
      /* The folder id the rail filters on, and whether the article is in the bin. */
      folderId: a.folder,
      trashed: TRASHED_IDS.has(a.id),
    } as Ticket;
  });
  return { rows, byId };
})();

export function KnowledgeListingPage({ onNavigate }: { onNavigate?: (page: string) => void }) {
  /* The selected rail row — 'top' (the digest), 'all', a folder id, or 'trash'. Knowledge
     opens on the digest: a reader arriving at the knowledge base wants what is worth
     reading, not twenty rows in id order. All Folders is one click away. */
  const [folder, setFolder] = useState('top');
  /* Folders deleted from the rail. Kept here rather than in the rail because the grid, the
     counts and the title all have to agree with it. */
  const [deleted, setDeleted] = useState<string[]>([]);

  /* Deleting a folder does exactly what its confirm promises: DRAFTS go for good, and
     everything else moves to Trash. */
  const inDeleted = (r: Ticket) => deleted.includes((r as any).folderId);
  const isGone = (r: Ticket) => inDeleted(r) && (r.status as string) === 'Draft';
  const isTrashed = (r: Ticket) => !isGone(r) && ((r as any).trashed || inDeleted(r));

  /* Counts come from the whole base, not the current slice, so the rail's numbers do not
     move when you click it. Trashed articles are only ever counted in Trash. */
  const counts = useMemo(() => {
    const live = KB.rows.filter((r) => !isGone(r) && !isTrashed(r));
    return {
      total: live.length,
      trash: KB.rows.filter(isTrashed).length,
      folders: KNOWLEDGE_FOLDERS.filter((f) => !deleted.includes(f.id)).map((f) => ({
        id: f.id,
        label: f.label,
        count: live.filter((r) => (r as any).folderId === f.id).length,
      })),
    };
  }, [deleted]);

  const rows = useMemo(() => {
    if (folder === 'trash') return KB.rows.filter(isTrashed);
    const live = KB.rows.filter((r) => !isGone(r) && !isTrashed(r));
    /* The digest ranks the whole base, so it gets every live article and picks its own. */
    return folder === 'all' || folder === 'top' ? live : live.filter((r) => (r as any).folderId === folder);
  }, [folder, deleted]);

  /* The rail has already asked for confirmation by the time this runs, so it just reports
     what happened. Selecting the folder that went away would strand the reader, so the grid
     falls back to All Folders. */
  const deleteFolder = (id: string) => {
    const mine = KB.rows.filter((r) => !(r as any).trashed && (r as any).folderId === id);
    const drafts = mine.filter((r) => (r.status as string) === 'Draft').length;
    const moved = mine.length - drafts;
    setDeleted((prev) => [...prev, id]);
    if (folder === id) setFolder('all');
    const parts = [
      drafts ? `${drafts} draft${drafts === 1 ? '' : 's'} deleted` : '',
      moved ? `${moved} article${moved === 1 ? '' : 's'} moved to Trash` : '',
    ].filter(Boolean);
    toast.success(`Folder “${folderLabel(id)}” deleted`, {
      description: parts.length ? `${parts.join(' · ')}.` : undefined,
    });
  };

  /* Permissions belong to a FOLDER. Top Articles ranks the whole base and All Folders spans
     every folder at once, so neither has a single pair to show. */
  const permissions =
    folder === 'trash'
      ? TRASH_PERMISSIONS
      : KNOWLEDGE_FOLDERS.find((f) => f.id === folder);

  const title =
    folder === 'top' ? 'Top Articles'
      : folder === 'all' ? 'All Folders'
        : folder === 'trash' ? 'Trash'
          : folderLabel(folder);

  return (
    <AssetRegisterPage
      activePage="knowledge"
      stackModule="knowledge"
      viewsStore="knowledge"
      noun="article"
      moduleCols="knowledge"
      defaultViewName={title}
      resetKey={folder}
      footerNoun="articles"
      rows={rows}
      /* The drawer takes the article adapted onto the Patch shape, as the old page did. */
      recordOf={(id) => { const a = KB.byId.get(id); return a ? knowledgeToPatchShape(a) : undefined; }}
      /* List only — no Dashboard layout here, so the gear menu shows no layout picker. */
      filterAttrs={KNOWLEDGE_FILTER_ATTRS}
      /* Author is who WROTE the article, and Status moves by drafting, reviewing and
         publishing it — neither is a field you set from a list in the grid. */
      lockedCells={['assignee', 'status']}
      quickFilters={KNOWLEDGE_QUICK_FILTERS}
      searchFields={['x_approvalStatus', 'x_folder']}
      primaryAction={{ label: 'Create' }}
      /* On the title line, at the page's top-right — the rail below it narrows what you are
         looking at, which is a different job from writing a new article. */
      primaryActionInTitle
      /* An article is read and written, not exported or polled — and nothing is left for a
         ⋮ menu to hold, so it goes with them. The gear stays: grouping and columns are
         still worth having. */
      hideTools={['export', 'refresh']}
      moreActions={[]}
      /* Knowledge is navigated by FOLDER, so the saved-views rail has no job here — it
         would only compete with the folder rail for the same slot. */
      showViews={false}
      /* The digest is its own rail row now — All Folders lists every article like any other
         folder. Searching or filtering from the digest swaps it for the grid. */
      overview={folder === 'top' ? <KnowledgeHome rows={rows} /> : undefined}
      banner={permissions ? <FolderPermissions read={permissions.read} write={permissions.write} /> : undefined}
      rail={({ collapsed, expand }) => (
        <KnowledgeFolderRail
          folders={counts.folders}
          total={counts.total}
          trash={counts.trash}
          active={folder}
          onSelect={setFolder}
          onDelete={deleteFolder}
          forceCollapsed={collapsed}
          onExpand={expand}
        />
      )}
      railLabel="folders"
      onNavigate={onNavigate}
    />
  );
}
