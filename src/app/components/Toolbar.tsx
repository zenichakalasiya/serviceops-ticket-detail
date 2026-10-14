import { useEffect, useState } from 'react';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { AiSparkle } from './AiSparkle';

interface ToolbarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  /** Name of the applied listing view — doubles as the page title. */
  activeView: string;
  viewsOpen?: boolean;
  /** Omit to drop the views rail toggle entirely (modules with no view catalog). */
  onToggleViews?: () => void;
  /** What that toggle is called on this page. A module with its OWN navigation rail shares
      the slot with Views, so the button reads as a swap ("Back to CI classes") rather than
      as a plain hide. */
  viewsLabels?: { show: string; hide: string };
  /** Page-supplied AI pill (the "Suggested clusters" recipe) — the Problem listing
      parks its suggestion here after "Not now". */
  suggestPill?: { label: string; count: number; onClick: () => void };
  /** A control the page wants on the TITLE line rather than in the tool rail below it —
      Reports puts its Create here, so the button sits at the page's top-right corner. */
  titleAction?: React.ReactNode;
}

export function Toolbar({ searchQuery, setSearchQuery, activeView, viewsOpen, onToggleViews, viewsLabels, suggestPill, titleAction }: ToolbarProps) {
  // Mirrors the AI grouping banner: when the user hits "Not now", this compact
  // AI pill appears here so the suggestions stay one click away.
  const [aiGroups, setAiGroups] = useState<{ hidden: boolean; count: number }>({ hidden: false, count: 0 });
  useEffect(() => {
    const onState = (e: Event) => setAiGroups((e as CustomEvent).detail as { hidden: boolean; count: number });
    window.addEventListener('suggested-groups-state', onState as EventListener);
    return () => window.removeEventListener('suggested-groups-state', onState as EventListener);
  }, []);
  return (
    <div className="bg-white">
      {/* First Row: Title, Filters, and Actions */}
      <div className="flex items-center justify-between px-6 py-3">
        <div className="relative flex items-center gap-3">
          {/* Listing views — the Dashboard sidebar pattern brought to the listing.
              Omitted where a module has no view catalog of its own (My Approvals:
              its status tabs ARE the cuts). */}
          {onToggleViews && (
          <button
            onClick={onToggleViews}
            title={viewsOpen ? viewsLabels?.hide ?? 'Hide views' : viewsLabels?.show ?? 'Request views'}
            className={`inline-flex h-8 w-8 items-center justify-center rounded border transition-colors ${viewsOpen ? 'border-[#3D8BD0] bg-[#EBF5FF] text-[#3D8BD0]' : 'border-[#DFE5ED] bg-white text-[#6b7280] hover:bg-[#F5F7FA] hover:text-[#364658]'}`}
          >
            {viewsOpen ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
          </button>
          )}
          <h1 className="text-[17px] font-semibold text-[#1E293B]">{activeView}</h1>
        </div>
        
        <div className="flex items-center gap-2">
          {suggestPill && (
            <button
              onClick={suggestPill.onClick}
              className="mr-1 inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded px-3 text-[12px] font-medium text-[#364658] transition-all duration-200 hover:text-[#3D8BD0] hover:shadow-sm"
              style={{
                background: 'linear-gradient(white, white) padding-box, linear-gradient(90deg, rgba(76, 177, 254, 0.80) 0%, rgba(115, 30, 251, 0.80) 41.49%, rgba(249, 17, 227, 0.80) 100%) border-box',
                border: '1px solid transparent',
              }}
            >
              <AiSparkle size={13} />
              {suggestPill.label}
              <span
                className="rounded-full px-1.5 py-0.5 text-[11px] font-semibold leading-none tabular-nums text-[#364658]"
                style={{ background: 'linear-gradient(90deg, rgba(76, 177, 254, 0.12) 0%, rgba(115, 30, 251, 0.12) 41.49%, rgba(249, 17, 227, 0.12) 100%)' }}
              >
                {suggestPill.count}
              </span>
            </button>
          )}
          {aiGroups.hidden && aiGroups.count > 0 && (
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('open-suggested-groups'))}
              className="mr-1 inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded px-3 text-[12px] font-medium text-[#364658] transition-all duration-200 hover:text-[#3D8BD0] hover:shadow-sm"
              style={{
                background: 'linear-gradient(white, white) padding-box, linear-gradient(90deg, rgba(76, 177, 254, 0.80) 0%, rgba(115, 30, 251, 0.80) 41.49%, rgba(249, 17, 227, 0.80) 100%) border-box',
                border: '1px solid transparent',
              }}
            >
              <AiSparkle size={13} />
              Suggested clusters
              <span
                className="rounded-full px-1.5 py-0.5 text-[11px] font-semibold leading-none tabular-nums text-[#364658]"
                style={{ background: 'linear-gradient(90deg, rgba(76, 177, 254, 0.12) 0%, rgba(115, 30, 251, 0.12) 41.49%, rgba(249, 17, 227, 0.12) 100%)' }}
              >
                {aiGroups.count}
              </span>
            </button>
          )}
          {titleAction}
        </div>
      </div>

    </div>
  );
}