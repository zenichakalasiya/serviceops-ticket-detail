/* VENDORED from the upstream prototype (ronak-patel-motadata/ServiceOps-Ticket-Detail-, Oct 2026 sync).
   Used ONLY by the detail pages and listings brought in from upstream — this project's own detail
   pages keep their own version in ../. Do not edit to change our pages; edit ../ instead. */
import { useState, useRef, useEffect } from 'react';
import { MoreVertical } from 'lucide-react';

interface ReleaseActionsMenuProps {
  onOpenApprovalPopup?: () => void;
  onRestartOnboarding?: () => void;
  ticketId?: string;
}

export function ReleaseActionsMenu({ onOpenApprovalPopup, onRestartOnboarding }: ReleaseActionsMenuProps) {
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const actionsMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (actionsMenuRef.current && !actionsMenuRef.current.contains(event.target as Node)) {
        setShowActionsMenu(false);
      }
    };
    if (showActionsMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showActionsMenu]);

  const close = () => setShowActionsMenu(false);

  const Item = ({
    onClick,
    icon,
    label,
    badge,
  }: {
    onClick?: () => void;
    icon: React.ReactNode;
    label: string;
    badge?: React.ReactNode;
  }) => (
    <button
      onClick={() => { onClick?.(); close(); }}
      className="w-full px-4 py-2 text-[13px] text-left hover:bg-[#F9FAFB] text-[#364658] transition-colors flex items-center gap-2"
    >
      <span className="text-[#6B7280] flex-shrink-0">{icon}</span>
      <span className="flex-1">{label}</span>
      {badge}
    </button>
  );

  const Divider = () => <div className="my-1 border-t border-[#F0F2F5]" />;

  return (
    <div className="relative" ref={actionsMenuRef}>
      <button
        onClick={() => setShowActionsMenu(!showActionsMenu)}
        className="inline-flex items-center justify-center h-8 w-8 bg-white border border-[#DFE5ED] rounded hover:bg-[#F5F7FA]"
      >
        <MoreVertical size={16} className="text-[#6b7280]" />
      </button>

      {showActionsMenu && (
        <div className="app-menu absolute right-0 top-full mt-1 w-[180px] bg-white rounded-lg shadow-lg border border-[#DFE5ED] py-1 z-[9999]">
          <Item
            label="Archive"
            icon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="21 8 21 21 3 21 3 8" />
                <rect x="1" y="3" width="22" height="5" />
                <line x1="10" y1="12" x2="14" y2="12" />
              </svg>
            }
          />
          <Item
            label="Print"
            onClick={() => window.print()}
            icon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 6 2 18 2 18 9" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
            }
          />
        </div>
      )}
    </div>
  );
}
