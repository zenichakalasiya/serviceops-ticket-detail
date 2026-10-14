/* VENDORED from the upstream prototype (ronak-patel-motadata/ServiceOps-Ticket-Detail-, Oct 2026 sync).
   Used ONLY by the detail pages and listings brought in from upstream — this project's own detail
   pages keep their own version in ../. Do not edit to change our pages; edit ../ instead. */
import { useEffect, useRef, useState } from 'react';
import { Bookmark, ChevronDown, RotateCcw, Save, Star, Trash2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import type { RelViewSnapshot } from './RelationshipGraph';

/** A user-saved Relationship/Dependency-map view: toolbar state + canvas snapshot. */
export interface SavedRelView {
  id: string;
  name: string;
  /** Toolbar view mode ('graph' | 'tree' | 'grid'). */
  mode: string;
  /** Toolbar type filter(s) — array since multi-select; older saved views may hold a single string (null/[] = All). */
  filter: string[] | string | null;
  /** Toolbar connection-type filter(s) — array since multi-select; older saved views may hold a single string (null/[] = All). */
  connFilter?: string[] | string | null;
  /** Canvas state (expansions / pins / viewport) — null when saved from grid view. */
  graph: RelViewSnapshot | null;
}

/**
 * Stable fingerprint of the meaningful view state — toolbar mode + both filters +
 * expanded nodes + pinned node positions. Used to tell whether the applied saved
 * view has been edited (so the "Update" button only shows on real changes).
 * Raw pan/zoom (viewport) is intentionally excluded — it jitters sub-pixel and
 * the user's "changes" are filters, expansions, and node positions (pins).
 */
function viewFingerprint(v: { mode: string; filter?: string[] | string | null; connFilter?: string[] | string | null; graph: RelViewSnapshot | null }): string {
  const arr = (x?: string[] | string | null) => (Array.isArray(x) ? [...x] : x ? [x] : []).map(String).sort();
  const g = v.graph;
  const manual = g?.manual
    ? Object.keys(g.manual).sort().map((k) => `${k}:${Math.round(g.manual[k].x)},${Math.round(g.manual[k].y)}`)
    : [];
  return JSON.stringify({
    mode: v.mode,
    filter: arr(v.filter),
    conn: arr(v.connFilter),
    expanded: [...(g?.expanded ?? [])].map(String).sort(),
    manual,
  });
}

interface RelSavedViewsProps {
  /** localStorage key (per module) so saved views persist across sessions. */
  storageKey: string;
  /** Snapshot the CURRENT toolbar + canvas state (called when the user saves). */
  capture: () => Omit<SavedRelView, 'id' | 'name'>;
  /** Re-apply a saved view to the toolbar + canvas. */
  apply: (view: SavedRelView) => void;
  /** Return to the DEFAULT view (no saved view applied): clear filters + reset the canvas. */
  reset?: () => void;
}

/**
 * Toolbar "Saved Views" button + popup for the Relationship / Dependency map.
 * Lets the user name-and-save the current canvas state (view mode, filter, expanded
 * nodes, manual pins, viewport) and re-apply any saved view with one click.
 */
export function RelSavedViews({ storageKey, capture, apply, reset }: RelSavedViewsProps) {
  const [open, setOpen] = useState(false);
  const [views, setViews] = useState<SavedRelView[]>(() => {
    try { return JSON.parse(localStorage.getItem(storageKey) ?? '[]'); } catch { return []; }
  });
  const [name, setName] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);
  // Whether the applied saved view has been edited since it was applied — drives
  // whether the "Update" button shows. Recomputed each time the popup opens
  // (all canvas edits happen while the popup is closed, behind its overlay).
  const [dirty, setDirty] = useState(false);
  // The view marked "default" — auto-applied every time the map screen opens.
  const [defaultId, setDefaultId] = useState<string | null>(() => {
    try { return localStorage.getItem(`${storageKey}:default`); } catch { return null; }
  });

  // Persist on every change.
  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify(views)); } catch { /* storage full/blocked — view list just won't persist */ }
  }, [storageKey, views]);
  useEffect(() => {
    try {
      if (defaultId) localStorage.setItem(`${storageKey}:default`, defaultId);
      else localStorage.removeItem(`${storageKey}:default`);
    } catch { /* ignore */ }
  }, [storageKey, defaultId]);

  // Auto-apply the default view when the map screen mounts (i.e. the user comes back to it).
  const autoAppliedRef = useRef(false);
  useEffect(() => {
    if (autoAppliedRef.current) return;
    autoAppliedRef.current = true;
    if (!defaultId) return;
    const v = views.find((x) => x.id === defaultId);
    if (v) { apply(v); setActiveId(v.id); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When the popup opens with a view applied, compare the current canvas state
  // against that view — the "Update" button shows only if something changed.
  useEffect(() => {
    if (!open || !activeId) { setDirty(false); return; }
    const view = views.find((v) => v.id === activeId);
    if (!view) { setDirty(false); return; }
    try { setDirty(viewFingerprint(capture()) !== viewFingerprint(view)); }
    catch { setDirty(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, activeId]);

  const saveCurrent = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const view: SavedRelView = { id: `v-${Date.now()}`, name: trimmed, ...capture() };
    setViews((prev) => [...prev, view]);
    setActiveId(view.id);
    setName('');
  };

  // Overwrite the active saved view with the CURRENT toolbar + canvas state
  // (after the user tweaks a filter, expands nodes, re-pins, etc.).
  const updateCurrent = () => {
    if (!activeId) return;
    const snap = capture();
    setViews((prev) => prev.map((v) => (v.id === activeId ? { ...v, ...snap } : v)));
    setOpen(false);
  };

  // Pill label: the applied view's name (highlighted blue), else a neutral "Views".
  const activeView = views.find((v) => v.id === activeId) ?? null;
  return (
    <div className="relative">
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => setOpen((v) => !v)}
            className={`inline-flex h-8 items-center gap-1.5 rounded border px-2.5 text-[13px] font-medium transition-colors ${activeView ? 'border-[#3D8BD0] bg-[#EAF2FB] text-[#3D8BD0]' : 'bg-white border-[#DFE5ED] text-[#364658] hover:bg-[#F5F7FA] hover:border-[#3D8BD0]'}`}
          >
            <Bookmark size={14} className={activeView ? 'text-[#3D8BD0]' : 'text-[#6b7280]'} />
            <span className="max-w-[140px] truncate">{activeView?.name ?? 'Views'}</span>
            <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''} ${activeView ? 'text-[#3D8BD0]' : 'text-[#7B8FA5]'}`} />
          </button>
        </TooltipTrigger>
        <TooltipContent>Saved views</TooltipContent>
      </Tooltip>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="app-menu absolute left-0 top-full mt-2 w-[300px] bg-white border border-[#E5E7EB] rounded-lg shadow-lg p-4 z-50">
            <h4 className="text-[15px] font-semibold text-[#3D8BD0] mb-3">Saved Views</h4>
            {views.length === 0 ? (
              <p className="text-[12px] text-[#9CA3AF] mb-3">No saved views yet — expand nodes or apply a filter, then save it below.</p>
            ) : (
              <div className="mb-3 max-h-[220px] overflow-y-auto -mx-1 px-1">
                {/* Default view — deselects the applied saved view and resets the canvas */}
                <button
                  onClick={() => { setActiveId(null); reset?.(); setOpen(false); }}
                  className={`w-full flex items-center gap-2 px-2 py-2 rounded-md text-left transition-colors ${!activeId ? 'bg-[#EAF2FB]' : 'hover:bg-[#F5F7FA]'}`}
                >
                  <RotateCcw size={13} className={!activeId ? 'text-[#3D8BD0] flex-shrink-0' : 'text-[#9CA3AF] flex-shrink-0'} />
                  <span className={`text-[13px] truncate ${!activeId ? 'text-[#3D8BD0] font-medium' : 'text-[#364658]'}`}>Default view</span>
                </button>
                {views.map((v) => (
                  /* Selected row = filled active background (like the filter dropdowns). The action
                     rail keeps FIXED size-6 slots (Star · Delete) — hidden icons stay `invisible`
                     (space reserved) so nothing shifts on hover. */
                  <div key={v.id} className={`group flex items-center rounded-md transition-colors ${activeId === v.id ? 'bg-[#EAF2FB]' : 'hover:bg-[#F5F7FA]'}`}>
                    <button
                      onClick={() => { if (activeId === v.id) { setActiveId(null); reset?.(); } else { apply(v); setActiveId(v.id); } setOpen(false); }}
                      className="flex-1 min-w-0 flex items-center gap-2 px-2 py-2 text-left"
                    >
                      <Bookmark size={13} className={activeId === v.id ? 'text-[#3D8BD0] flex-shrink-0' : 'text-[#9CA3AF] flex-shrink-0'} />
                      <span className={`text-[13px] truncate ${activeId === v.id ? 'text-[#3D8BD0] font-medium' : 'text-[#364658]'}`}>{v.name}</span>
                    </button>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => setDefaultId((p) => (p === v.id ? null : v.id))}
                          className={`flex size-6 flex-shrink-0 items-center justify-center rounded transition-colors ${defaultId === v.id ? 'text-[#F59E0B] hover:bg-[#FEF3E2]' : 'invisible group-hover:visible text-[#7B8FA5] hover:text-[#F59E0B] hover:bg-[#FEF3E2]'}`}
                        >
                          <Star size={13} fill={defaultId === v.id ? 'currentColor' : 'none'} />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>{defaultId === v.id ? 'Default view — opens automatically. Click to unset.' : 'Set as default view'}</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => { setViews((prev) => prev.filter((x) => x.id !== v.id)); if (activeId === v.id) setActiveId(null); if (defaultId === v.id) setDefaultId(null); }}
                          className="mr-1 invisible group-hover:visible flex size-6 flex-shrink-0 items-center justify-center rounded text-[#7B8FA5] hover:text-[#DC2626] hover:bg-[#FDECEC] transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>Delete view</TooltipContent>
                    </Tooltip>
                  </div>
                ))}
              </div>
            )}
            <div className="border-t border-[#EEF1F4] pt-3 space-y-3">
              {/* Update the applied view — only when it has actually been edited */}
              {activeView && dirty && (
                <div>
                  <button
                    onClick={updateCurrent}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md border border-[#3D8BD0] text-[#3D8BD0] text-[13px] font-medium hover:bg-[#EAF2FB] transition-colors"
                  >
                    <Save size={13} />
                    <span className="truncate">Update “{activeView.name}”</span>
                  </button>
                  <p className="text-[11px] text-[#9CA3AF] mt-1.5">Save the current filters &amp; canvas changes to this view.</p>
                </div>
              )}
              <div>
                <label className="text-[13px] text-[#7B8FA5] mb-1.5 block">{activeView ? 'Save as new view' : 'Save current view'}</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') saveCurrent(); }}
                    placeholder="View name..."
                    className="flex-1 min-w-0 px-2.5 py-1.5 text-[13px] text-[#364658] border border-[#DFE5ED] rounded placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#3D8BD0]"
                  />
                  <button
                    onClick={saveCurrent}
                    disabled={!name.trim()}
                    className="px-3 py-1.5 rounded bg-[#3D8BD0] text-white text-[13px] font-medium hover:bg-[#2F7AB8] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
