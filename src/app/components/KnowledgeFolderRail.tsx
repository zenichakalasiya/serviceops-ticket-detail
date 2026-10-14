/* ── Knowledge folder rail ───────────────────────────────────────────────────
   The knowledge base is navigated by FOLDER, so the folders sit where the CMDB puts
   its class tree: left of the grid, sharing that slot with the views rail. Same
   chrome as the CMDB rail — title row built to the grid's own header recipe, a
   search, rows with count chips and the light-blue selected fill — because two
   navigators that behave alike should look alike.

   Flat rather than a tree: a folder holds articles, not other folders.

   Three zones, separated by hairlines: TOP ARTICLES (the curated digest) · the folders,
   led by All Folders · Trash. The digest is not a folder, so it sits above the tree and
   carries no count — it is always the same short list. */
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, Folder, FolderOpen, PanelLeftClose, PanelLeftOpen, Plus, Search, SquarePen, Trash2, TrendingUp, X } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { toast } from 'sonner';

export interface FolderRow {
  id: string;
  label: string;
  count: number;
}

const SHELL = 'group/fr flex items-center gap-1 rounded px-1.5 transition-colors';
const LABEL = 'flex min-w-0 flex-1 items-center gap-2 py-2 text-left text-[13px] transition-colors';
const COUNT = 'min-w-[26px] flex-shrink-0 rounded px-1.5 py-0.5 text-center text-[11px] font-medium tabular-nums transition-colors';
/* Edit and Delete share ONE fixed-width slot with the count, stacked on top of each other:
   the count fades out, the actions fade in, and the row never changes width or nudges the
   folder name. Two size-6 buttons + their gap measure 50px. */
const ACTION_SLOT = 'relative ml-auto flex h-6 w-[52px] flex-shrink-0 items-center justify-end';
const ACTION_BTN = 'flex size-6 items-center justify-center rounded transition-colors';

export function KnowledgeFolderRail({
  folders,
  total,
  trash,
  active,
  onSelect,
  onDelete,
  forceCollapsed = false,
  onExpand,
}: {
  folders: FolderRow[];
  total: number;
  trash: number;
  active: string;
  onSelect: (id: string) => void;
  /** Confirmed delete. Only real folders offer it. */
  onDelete?: (id: string) => void;
  /** The page needs the slot for the views rail — show the strip instead. */
  forceCollapsed?: boolean;
  onExpand?: () => void;
}) {
  const [collapsedLocal, setCollapsed] = useState(false);
  const collapsed = collapsedLocal || forceCollapsed;
  const [q, setQ] = useState('');
  /* Delete asks first — it destroys drafts outright. The confirm is a body PORTAL because
     the folder list scrolls, and a scroll container clips anything absolutely positioned
     inside it. `at` is where the card opens: under the icon that was clicked. */
  const [confirm, setConfirm] = useState<{ id: string; label: string; top: number; left: number } | null>(null);
  useEffect(() => {
    if (!confirm) return;
    const close = () => setConfirm(null);
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    /* A click inside the card must not count as "outside" — the card stops its own. */
    window.addEventListener('mousedown', close);
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('mousedown', close); window.removeEventListener('keydown', onKey); };
  }, [confirm]);

  const askDelete = (e: React.MouseEvent, id: string, label: string) => {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const W = 360;
    setConfirm({ id, label, top: r.bottom + 6, left: Math.min(Math.max(r.right - W, 8), window.innerWidth - W - 8) });
  };

  const query = q.trim().toLowerCase();
  const shown = query ? folders.filter((f) => f.label.toLowerCase().includes(query)) : folders;

  /* `count` is optional: Top Articles is a fixed digest, not a bucket with a size.
     `edit` / `del` say which actions the row offers — Trash can be configured but never
     deleted, and the standing rows (Top Articles, All Folders) offer neither.
     ⚠️ The reveal is HOVER only, never focus-within: clicking a row leaves its button
     focused, which would pin the icons open on the selected folder long after the pointer
     has gone. Keyboard users reach the buttons by tabbing to them, and `:focus-visible` on
     the button itself brings them back. */
  const row = (id: string, label: string, icon: React.ReactNode, count?: number, edit = false, del = false) => {
    const on = active === id;
    const acts = edit || del;
    return (
      <div key={id} className={`${SHELL} ${on ? 'bg-[#EBF5FF]' : 'hover:bg-[#F5F7FA]'}`}>
        <button onClick={() => onSelect(id)} className={`${LABEL} ${on ? 'font-medium text-[#3D8BD0]' : 'text-[#364658]'}`}>
          <span className={`flex-shrink-0 ${on ? 'text-[#3D8BD0]' : 'text-[#7B8FA5]'}`}>{icon}</span>
          <span className="truncate">{label}</span>
        </button>
        {(count !== undefined || acts) && (
          <span className={ACTION_SLOT}>
            {count !== undefined && (
              <span
                className={`${COUNT} ${on ? 'bg-[#DBEAFE] text-[#3D8BD0]' : 'bg-[#F1F5F9] text-[#64748B]'} ${
                  acts ? 'group-hover/fr:opacity-0' : ''
                }`}
              >
                {count}
              </span>
            )}
            {acts && (
              /* Absolute, so the actions cost the row no width of their own — they simply
                 take the count's place while the pointer is here. */
              <span className="absolute inset-y-0 right-0 flex items-center gap-0.5 opacity-0 transition-opacity group-hover/fr:opacity-100 focus-within:opacity-100">
                {edit && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      {/* Editing a folder happens elsewhere; the icon is here as the
                          affordance only. */}
                      <button className={`${ACTION_BTN} text-[#7B8FA5] hover:bg-[#DCE4ED] hover:text-[#364658]`}>
                        <SquarePen size={14} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>Edit folder</TooltipContent>
                  </Tooltip>
                )}
                {del && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={(e) => askDelete(e, id, label)}
                        className={`${ACTION_BTN} text-[#9CA3AF] hover:bg-[#FEE4E2] hover:text-[#B42318]`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>Delete folder</TooltipContent>
                  </Tooltip>
                )}
              </span>
            )}
          </span>
        )}
      </div>
    );
  };

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => { setCollapsed(false); onExpand?.(); }}
            className="group/strip flex w-[48px] flex-shrink-0 flex-col items-center border-r border-[#E5E7EB] bg-white py-3 text-left transition-colors hover:bg-[#F7F9FC]"
          >
            <span className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded border border-[#DFE5ED] bg-white text-[#6b7280] transition-colors group-hover/strip:border-[#3D8BD0] group-hover/strip:bg-[#EBF5FF] group-hover/strip:text-[#3D8BD0]">
              <PanelLeftOpen size={16} />
            </span>
            <span className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-[#7B8FA5] [writing-mode:vertical-rl]">
              {active === 'top' ? 'Top Articles' : active === 'all' ? 'All Folders' : active === 'trash' ? 'Trash' : folders.find((f) => f.id === active)?.label ?? 'Folders'}
            </span>
          </button>
        </TooltipTrigger>
        <TooltipContent side="right">Show folders</TooltipContent>
      </Tooltip>
    );
  }

  return (
    /* The same 344px the CMDB's class rail uses — two navigators in the same slot should
       not shift the grid's left edge when you move between modules. */
    <div className="flex w-[344px] flex-shrink-0 flex-col border-r border-[#E5E7EB] bg-white">
      {/* Built to the same recipe as the grid's title row, so the two sit on one line. */}
      <div className="flex items-center gap-2 px-4 py-3">
        <h2 className="min-w-0 flex-1 truncate text-[17px] font-semibold text-[#1E293B]">Folders</h2>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => toast('New folder — coming soon')}
              className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded border border-[#DFE5ED] bg-white text-[#6b7280] transition-colors hover:bg-[#F5F7FA] hover:text-[#364658]"
            >
              <Plus size={16} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">New folder</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setCollapsed(true)}
              className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded border border-[#DFE5ED] bg-white text-[#6b7280] transition-colors hover:bg-[#F5F7FA] hover:text-[#364658]"
            >
              <PanelLeftClose size={16} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">Hide folders</TooltipContent>
        </Tooltip>
      </div>

      <div className="px-4 pb-2">
        <div className="relative">
          <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search folders"
            className="h-8 w-full rounded border border-[#DFE5ED] bg-white pl-8 pr-7 text-[13px] text-[#364658] outline-none transition-colors placeholder:text-[#9CA3AF] focus:border-[#3D8BD0]"
          />
          {q && (
            <button
              onClick={() => setQ('')}
              className="absolute right-1.5 top-1/2 flex size-5 -translate-y-1/2 items-center justify-center rounded text-[#9CA3AF] transition-colors hover:bg-[#F3F4F6] hover:text-[#364658]"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
        {/* A folder search is looking for a FOLDER, so the three standing rows step aside
            and leave only the matches — nothing to read past. */}
        {!query && (
          <>
            {row('top', 'Top Articles', <TrendingUp size={15} />)}
            <div className="my-1.5 border-t border-[#F0F2F5]" />
            {row('all', 'All Folders', <FolderOpen size={15} />, total)}
            <div className="my-1.5 border-t border-[#F0F2F5]" />
          </>
        )}
        {shown.map((f) => row(f.id, f.label, <Folder size={15} />, f.count, true, true))}
        {query && !shown.length && (
          <div className="px-3 py-6 text-center text-[12px] text-[#94A3B8]">No folder matches “{q}”.</div>
        )}
        {!query && (
          <>
            <div className="my-1.5 border-t border-[#F0F2F5]" />
            {/* Trash can be configured, but it is part of the product — there is no
                deleting the bin. */}
            {row('trash', 'Trash', <Trash2 size={15} />, trash, true, false)}
          </>
        )}
      </div>

      {/* Delete confirm. It states the CONSEQUENCE — drafts go for good, published articles
          only move — because that is the part a reader cannot undo or guess. */}
      {confirm &&
        createPortal(
          <div
            style={{ top: confirm.top, left: confirm.left }}
            onMouseDown={(e) => e.stopPropagation()}
            className="fixed z-[9999] w-[360px] rounded-lg border border-[#DFE5ED] bg-white p-4 shadow-xl"
          >
            <div className="flex gap-3">
              <AlertCircle size={18} className="mt-px flex-shrink-0 text-[#F58518]" />
              <p className="text-[13px] leading-[1.55] text-[#364658]">
                This will delete all draft articles forever and move published articles to Trash folder. Do you want to continue?
              </p>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setConfirm(null)}
                className="h-8 rounded border border-[#DFE5ED] bg-white px-3 text-[13px] font-medium text-[#364658] transition-colors hover:bg-[#F5F7FA]"
              >
                Cancel
              </button>
              <button
                onClick={() => { onDelete?.(confirm.id); setConfirm(null); }}
                className="h-8 rounded bg-[#B42318] px-4 text-[13px] font-medium text-white transition-colors hover:bg-[#9A1D14]"
              >
                Yes
              </button>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
