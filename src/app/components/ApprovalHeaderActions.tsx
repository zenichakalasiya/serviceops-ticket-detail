import { Check, CornerUpLeft, X } from 'lucide-react';

/* The header of a record opened from My Approvals carries THE DECISION and nothing
   else — an approver is not here to edit the record, watch it or change its status.
   The three buttons wear the same tinted palette as the listing's Actions column, so
   the row and the page it opens read as one gesture.

   Once a decision is made (or the approval was already decided) the buttons give way
   to a single outcome pill — there is nothing left to press. */

export type ApprovalDecision = 'approve' | 'reject' | 'refer';

const BTN = 'inline-flex h-8 items-center gap-1.5 rounded border px-3 text-[13px] font-medium transition-colors';

const ACTIONS: { key: ApprovalDecision; label: string; Icon: typeof Check; cls: string }[] = [
  { key: 'approve', label: 'Approve', Icon: Check, cls: 'border-[#BBF7D0] bg-[#F0FDF4] text-[#15803D] hover:bg-[#DCFCE7]' },
  { key: 'reject', label: 'Reject', Icon: X, cls: 'border-[#FECACA] bg-[#FEF2F2] text-[#B42318] hover:bg-[#FEE2E2]' },
  { key: 'refer', label: 'Refer Back', Icon: CornerUpLeft, cls: 'border-[#FDE68A] bg-[#FFFBEB] text-[#B45309] hover:bg-[#FEF3C7]' },
];

/** Outcome pill for an approval that is no longer waiting on anyone. */
const DECIDED: Record<string, { label: string; cls: string; Icon: typeof Check }> = {
  Approved: { label: 'Approved', cls: 'border-[#BBF7D0] bg-[#F0FDF4] text-[#15803D]', Icon: Check },
  Rejected: { label: 'Rejected', cls: 'border-[#FECACA] bg-[#FEF2F2] text-[#B42318]', Icon: X },
  'Referred Back': { label: 'Referred back', cls: 'border-[#FDE68A] bg-[#FFFBEB] text-[#B45309]', Icon: CornerUpLeft },
  Ignored: { label: 'Ignored', cls: 'border-[#E5E7EB] bg-[#F8FAFC] text-[#64748B]', Icon: CornerUpLeft },
};

export function ApprovalHeaderActions({
  status,
  onDecide,
}: {
  /** The approval's own state — 'Pending' is the only one that still offers buttons. */
  status?: string;
  onDecide: (decision: ApprovalDecision) => void;
}) {
  const decided = status && status !== 'Pending' ? DECIDED[status] : null;

  if (decided) {
    const { label, cls, Icon } = decided;
    return (
      <div className="flex flex-shrink-0 items-center gap-2">
        <span className={`inline-flex h-8 items-center gap-1.5 rounded border px-3 text-[13px] font-medium ${cls}`}>
          <Icon size={14} />
          {label}
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-shrink-0 items-center gap-2">
      {ACTIONS.map(({ key, label, Icon, cls }) => (
        <button key={key} onClick={() => onDecide(key)} className={`${BTN} ${cls}`}>
          <Icon size={14} />
          {label}
        </button>
      ))}
    </div>
  );
}
