/* VENDORED from the upstream prototype (ronak-patel-motadata/ServiceOps-Ticket-Detail-, Oct 2026 sync).
   Used ONLY by the detail pages and listings brought in from upstream — this project's own detail
   pages keep their own version in ../. Do not edit to change our pages; edit ../ instead. */
import { useState, useRef, useEffect } from 'react';
import { MoreVertical } from 'lucide-react';
import { toast } from 'sonner';

interface TicketActionsMenuProps {
  onOpenApprovalPopup?: () => void;
  onRestartOnboarding?: () => void;
  onOpenTicketTransition?: () => void;
  ticketId?: string;
}

export function TicketActionsMenu({ onOpenApprovalPopup, onRestartOnboarding, onOpenTicketTransition }: TicketActionsMenuProps) {
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [convertLabel, setConvertLabel] = useState<'Convert to Service Request' | 'Convert to Incident'>('Convert to Service Request');
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
      <span className="flex-1 whitespace-nowrap">{label}</span>
      {badge}
    </button>
  );

  const Divider = () => <div className="my-1 border-t border-[#F0F2F5]" />;

  const Section = ({ label }: { label: string }) => (
    <div className="px-4 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF]">{label}</div>
  );

  return (
    <div className="relative" ref={actionsMenuRef}>
      <button
        onClick={() => setShowActionsMenu(!showActionsMenu)}
        className="inline-flex items-center justify-center h-8 w-8 bg-white border border-[#DFE5ED] rounded hover:bg-[#F5F7FA]"
      >
        <MoreVertical size={16} className="text-[#6b7280]" />
      </button>

      {showActionsMenu && (
        <div className="app-menu absolute right-0 top-full mt-1 w-[248px] bg-white rounded-lg shadow-lg border border-[#DFE5ED] py-1 z-[9999]">

          <Section label="Actions" />
          <Item
            onClick={onOpenApprovalPopup}
            label="Ask for Approval"
            icon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <polyline points="16 11 18 13 22 9" />
              </svg>
            }
          />
          <Item
            label="Merge"
            icon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 21v-3a4 4 0 0 0-4-4H6" />
                <path d="M6 3v18" />
                <polyline points="11 8 6 3 1 8" />
                <polyline points="13 16 18 21 23 16" />
              </svg>
            }
          />
          <Item
            label="Split Request"
            icon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 3h5v5" />
                <path d="M8 3H3v5" />
                <path d="M12 22v-8.3a4 4 0 0 0-1.172-2.872L3 3" />
                <path d="m15 9 6-6" />
                <path d="M12 22v-8.3a4 4 0 0 1 1.172-2.872L21 3" />
              </svg>
            }
          />

          <Divider />

          <Section label="Collaboration" />
          <Item
            label="Mark as Spam"
            icon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
              </svg>
            }
          />
          <Item
            label="Add Watcher"
            icon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <line x1="19" y1="8" x2="19" y2="14" />
                <line x1="22" y1="11" x2="16" y2="11" />
              </svg>
            }
          />
          <Item
            label="Ask for Feedback"
            icon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                <path d="M12 7v.01M12 11v.01" />
              </svg>
            }
          />

          <Divider />

          <Section label="Workflow" />
          <Item
            label="Scenario"
            icon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                <path d="m15 5 4 4" />
              </svg>
            }
          />
          <Item
            label="Request Transition"
            onClick={onOpenTicketTransition}
            icon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                <path d="M21 3v5h-5" />
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                <path d="M8 16H3v5" />
              </svg>
            }
          />

          <Divider />

          <Section label="Record" />
          <Item
            label={convertLabel}
            onClick={() => {
              const next = convertLabel === 'Convert to Service Request' ? 'Convert to Incident' : 'Convert to Service Request';
              const msg = convertLabel === 'Convert to Service Request' ? 'Successfully converted to Service Request' : 'Successfully converted to Incident';
              toast.success(msg, { style: { color: '#16a34a' } });
              setConvertLabel(next);
            }}
            icon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="12" y1="18" x2="12" y2="12" />
                <line x1="9" y1="15" x2="15" y2="15" />
              </svg>
            }
          />
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

          <Divider />

          <Section label="Help" />
          <Item
            onClick={onRestartOnboarding}
            label="In-App User Guide"
            icon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
              </svg>
            }
            badge={<span className="w-2 h-2 rounded-full bg-[#3D8BD0] flex-shrink-0" />}
          />

        </div>
      )}
    </div>
  );
}
