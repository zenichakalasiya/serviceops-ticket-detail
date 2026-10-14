/* VENDORED from the upstream prototype (ronak-patel-motadata/ServiceOps-Ticket-Detail-, Oct 2026 sync).
   Used ONLY by the detail pages and listings brought in from upstream — this project's own detail
   pages keep their own version in ../. Do not edit to change our pages; edit ../ instead. */
import { ChevronDown, ChevronRight, CornerUpLeft, Mail, X, Clock, MoreVertical, Edit2, Plus, MessageSquare, Check, Lock } from 'lucide-react';
import { useState } from 'react';
import { CreateApprovalPopup } from './CreateApprovalPopup';
import { ApprovalCommentPopup, ApprovalComment } from './ApprovalCommentPopup';
import { CURRENT_USER } from '../technicianRoster';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';

interface Approver {
  id: string;
  name: string;
  email: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Ignored' | 'Referred Back';
  statusChangedAt?: string;
}

/* The decision an approver can take on their own row, as icon buttons in the same
   tinted palette the My Approvals grid uses — so a decision looks the same wherever
   it is taken. Icon-only keeps the row compact; each carries its name in a tooltip. */
const ROW_ACTIONS: { status: Approver['status']; label: string; Icon: typeof Check; cls: string }[] = [
  { status: 'Approved', label: 'Approve', Icon: Check, cls: 'border-[#BBF7D0] bg-[#F0FDF4] text-[#15803D] hover:bg-[#DCFCE7]' },
  { status: 'Rejected', label: 'Reject', Icon: X, cls: 'border-[#FECACA] bg-[#FEF2F2] text-[#B42318] hover:bg-[#FEE2E2]' },
  { status: 'Referred Back', label: 'Refer back', Icon: CornerUpLeft, cls: 'border-[#FDE68A] bg-[#FFFBEB] text-[#B45309] hover:bg-[#FEF3C7]' },
];

interface ApprovalLevel {
  level: number;
  approvers: Approver[];
}

interface Approval {
  id: string;
  subject: string;
  createdBy: string;
  createdAt: string;
  type: 'Unanimous' | 'Majority' | 'Anyone' | 'First Approval';
  status: 'Pending' | 'Approved' | 'Rejected';
  levels: ApprovalLevel[];
}

interface ApprovalsTabContentProps {
  ticketId?: string;
  approvalSubjects?: [string, string];
  showCreateApprovalPopup?: boolean;
  onCloseApprovalPopup?: () => void;
  onOpenApprovalPopup?: () => void;
  onApprove?: () => void;
}

export function ApprovalsTabContent({
  ticketId,
  approvalSubjects,
  showCreateApprovalPopup: externalShowPopup,
  onCloseApprovalPopup,
  onOpenApprovalPopup,
  onApprove
}: ApprovalsTabContentProps = {}) {
  // Empty state for blank ticket (INC-32)
  const isBlankTicket = ticketId === 'INC-32';
  
  // Multiple approval accordions can be open at once; each keeps its own selected level.
  const [expandedApprovalIds, setExpandedApprovalIds] = useState<Set<string>>(new Set());
  const [selectedLevels, setSelectedLevels] = useState<Record<string, number>>({});
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [internalShowPopup, setInternalShowPopup] = useState(false);
  const [editingApproval, setEditingApproval] = useState<Approval | null>(null);
  const [showCommentPopup, setShowCommentPopup] = useState(false);
  const [selectedApprovalId, setSelectedApprovalId] = useState<string | null>(null);
  // Comments per approval (lifted here so the accordion header can show a count).
  const [approvalComments, setApprovalComments] = useState<Record<string, ApprovalComment[]>>({
    '1': [
      { id: 1, author: 'Rakesh Rathod', initials: 'RR', color: '#3D8BD0', content: 'Please prioritise this — the requester needs the device for a client demo next week.', time: 'Mar 11, 7:02 PM' },
      { id: 2, author: 'Sarah Johnson', initials: 'SJ', color: '#8B5CF6', content: 'Confirmed the budget is available under the Q1 hardware allocation.', time: 'Mar 12, 9:15 AM' },
    ],
  });

  // Use external popup state if provided, otherwise use internal state
  const showCreateApprovalPopup = externalShowPopup !== undefined ? externalShowPopup : internalShowPopup;
  const handleOpenPopup = onOpenApprovalPopup || (() => setInternalShowPopup(true));
  const handleClosePopup = onCloseApprovalPopup || (() => setInternalShowPopup(false));

  // Mock current logged-in user
  const currentUserEmail = 'jane.smith@company.com';

  // Problem records (PBM-xxx) get problem-management-relevant approvals
  const isProblem = ticketId?.startsWith('PBM');

  const problemApprovals: Approval[] = [
    {
      id: '1',
      subject: approvalSubjects?.[0] ?? 'Approval Required: Restore MX Records & DNS Rollback',
      createdBy: 'Rakesh Rathod',
      createdAt: 'Mar 11, 6:34 PM',
      type: 'Anyone',
      status: 'Pending',
      levels: [
        {
          level: 1,
          approvers: [
            { id: '1', name: 'John Doe', email: 'john.doe@company.com', status: 'Approved', statusChangedAt: 'Wed, 11 Mar 11:06 PM' },
            { id: '2', name: 'Jane Smith', email: 'jane.smith@company.com', status: 'Pending', statusChangedAt: 'Wed, 11 Mar 6:34 PM' },
            { id: '3', name: 'Mike Johnson', email: 'mike.johnson@company.com', status: 'Pending', statusChangedAt: 'Wed, 11 Mar 6:34 PM' },
          ]
        },
        {
          level: 2,
          approvers: [
            { id: '4', name: 'Sarah Johnson', email: 'sarah.johnson@company.com', status: 'Pending', statusChangedAt: 'Wed, 11 Mar 6:34 PM' },
            { id: '5', name: 'Tom Brown', email: 'tom.brown@company.com', status: 'Pending', statusChangedAt: 'Wed, 11 Mar 6:34 PM' },
          ]
        }
      ]
    },
    {
      id: '2',
      subject: approvalSubjects?.[1] ?? 'Emergency Change Approval: Mail Server Configuration Fix',
      createdBy: 'Admin User',
      createdAt: 'Mar 10, 2:15 PM',
      type: 'Majority',
      status: 'Approved',
      levels: [
        {
          level: 1,
          approvers: [
            { id: '6', name: 'Alice Cooper', email: 'alice.cooper@company.com', status: 'Approved', statusChangedAt: 'Tue, 10 Mar 2:45 PM' },
            { id: '7', name: 'Bob Martin', email: 'bob.martin@company.com', status: 'Approved', statusChangedAt: 'Tue, 10 Mar 3:12 PM' },
            { id: '8', name: 'Carol White', email: 'carol.white@company.com', status: 'Rejected', statusChangedAt: 'Tue, 10 Mar 3:30 PM' },
          ]
        }
      ]
    }
  ];

  const defaultApprovals: Approval[] = [
    {
      id: '1',
      subject: 'Approval Required: Apple MacBook Pro',
      createdBy: 'Rakesh Rathod',
      createdAt: 'Mar 11, 6:34 PM',
      type: 'Anyone',
      status: 'Pending',
      levels: [
        {
          level: 1,
          approvers: [
            { id: '1', name: 'John Doe', email: 'john.doe@company.com', status: 'Approved', statusChangedAt: 'Wed, 11 Mar 11:06 PM' },
            { id: '2', name: 'Jane Smith', email: 'jane.smith@company.com', status: 'Approved', statusChangedAt: 'Wed, 11 Mar 11:20 PM' },
            { id: '3', name: 'Mike Johnson', email: 'mike.johnson@company.com', status: 'Approved', statusChangedAt: 'Wed, 11 Mar 11:34 PM' },
          ]
        },
        {
          level: 2,
          approvers: [
            { id: '4', name: 'Sarah Johnson', email: 'sarah.johnson@company.com', status: 'Pending', statusChangedAt: 'Wed, 11 Mar 6:34 PM' },
            { id: '5', name: 'Tom Brown', email: 'tom.brown@company.com', status: 'Approved', statusChangedAt: 'Thu, 12 Mar 9:10 AM' },
          ]
        },
        {
          level: 3,
          approvers: [
            { id: '9', name: 'David Miller', email: 'david.miller@company.com', status: 'Pending', statusChangedAt: 'Wed, 11 Mar 6:34 PM' },
            { id: '10', name: 'Nina Patel', email: 'nina.patel@company.com', status: 'Approved', statusChangedAt: 'Thu, 12 Mar 10:02 AM' },
          ]
        }
      ]
    },
    {
      id: '2',
      subject: 'Software License Approval',
      createdBy: 'Admin User',
      createdAt: 'Mar 10, 2:15 PM',
      type: 'Majority',
      status: 'Approved',
      levels: [
        {
          level: 1,
          approvers: [
            { id: '6', name: 'Alice Cooper', email: 'alice.cooper@company.com', status: 'Approved', statusChangedAt: 'Tue, 10 Mar 2:45 PM' },
            { id: '7', name: 'Bob Martin', email: 'bob.martin@company.com', status: 'Approved', statusChangedAt: 'Tue, 10 Mar 3:12 PM' },
            { id: '8', name: 'Carol White', email: 'carol.white@company.com', status: 'Rejected', statusChangedAt: 'Tue, 10 Mar 3:30 PM' },
          ]
        }
      ]
    }
  ];

  // Mock data
  // Records that pass approvalSubjects (Problem, Change) get the contextual two-approval set; others keep the default.
  const initialApprovals: Approval[] = isBlankTicket ? [] : ((isProblem || approvalSubjects) ? problemApprovals : defaultApprovals);

  // State for approvals
  const [approvals, setApprovals] = useState<Approval[]>(initialApprovals);

  // Filter out second approval for INC-35
  const filteredApprovals = ticketId === 'INC-35' ? approvals.filter(a => a.id === '1') : approvals;

  // Function to update approver status
  const updateApproverStatus = (approvalId: string, approverId: string, newStatus: 'Approved' | 'Rejected' | 'Referred Back') => {
    setApprovals(prevApprovals =>
      prevApprovals.map(approval => {
        if (approval.id === approvalId) {
          return {
            ...approval,
            /* Referring back asks the requester for more detail — the approval itself
               is still waiting, so only a real decision moves the overall status. */
            status: newStatus === 'Referred Back' ? approval.status : newStatus,
            levels: approval.levels.map(level => ({
              ...level,
              approvers: level.approvers.map(approver => {
                if (approver.id === approverId) {
                  const now = new Date();
                  const formattedDate = now.toLocaleDateString('en-US', { 
                    weekday: 'short', 
                    day: 'numeric', 
                    month: 'short',
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                  });
                  return {
                    ...approver,
                    status: newStatus,
                    statusChangedAt: formattedDate
                  };
                }
                return approver;
              })
            }))
          };
        }
        return approval;
      })
    );
    
    // Call onApprove callback when user approves
    if (newStatus === 'Approved' && onApprove) {
      onApprove();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved':
        return 'bg-[#D1FAE5] text-[#065F46] border-[#A7F3D0]';
      case 'Rejected':
        return 'bg-[#FEE2E2] text-[#991B1B] border-[#FECACA]';
      case 'Pending':
        return 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]';
      case 'Referred Back':
        return 'bg-[#FFEDD5] text-[#9A3412] border-[#FED7AA]';
      case 'Ignored':
        return 'bg-[#E5E7EB] text-[#374151] border-[#D1D5DB]';
      default:
        return 'bg-[#E5E7EB] text-[#374151] border-[#D1D5DB]';
    }
  };

  const getTypeColor = (type: string) => {
    return 'bg-[#EFF6FF] text-[#1E40AF] border-[#BFDBFE]';
  };

  const toggleAccordion = (approvalId: string) => {
    setExpandedApprovalIds((prev) => {
      const next = new Set(prev);
      if (next.has(approvalId)) {
        next.delete(approvalId);
      } else {
        next.add(approvalId);
        // Land on the first not-yet-complete level (its earlier levels are all approved,
        // so it is unlocked); if every level is complete, land on the last one.
        const appr = approvals.find((a) => a.id === approvalId);
        const firstOpen = appr?.levels.find((l) => !(l.approvers.length > 0 && l.approvers.every((a) => a.status === 'Approved')));
        setSelectedLevels((p) => ({ ...p, [approvalId]: firstOpen ? firstOpen.level : (appr?.levels[appr.levels.length - 1]?.level ?? 1) }));
      }
      return next;
    });
  };

  if (filteredApprovals.length === 0) {
    return (
      <div className="px-6 pb-6 pt-3">
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="text-center">
            <div className="inline-flex items-center justify-center size-16 rounded-full bg-[#F5F7FA] mb-4">
              <Mail className="size-8 text-[#7B8FA5]" />
            </div>
            <h3 className="text-[16px] font-semibold text-[#364658] mb-2">No Approvals</h3>
            <p className="text-[13px] text-[#7B8FA5]">
              There are no approval requests for this ticket
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 pb-6 pt-3">
      <div className="space-y-3">
        {filteredApprovals.map((approval) => {
          const isExpanded = expandedApprovalIds.has(approval.id);
          const approvalSelectedLevel = selectedLevels[approval.id] ?? 1;
          const currentLevel = approval.levels.find(l => l.level === approvalSelectedLevel);
          /* You can only decide YOUR OWN approval — never another approver's — so exactly
             one row in a level carries the action buttons. It is the signed-in approver's
             row when the level lists them; otherwise the first row still waiting stands in,
             because the mock approver names vary per record and every accordion should
             still have one actionable row. */
          const myApproverId = (() => {
            const waiting = (currentLevel?.approvers ?? []).filter(a => a.status === 'Pending');
            return (waiting.find(a => a.name === CURRENT_USER || a.email === currentUserEmail) ?? waiting[0])?.id;
          })();

          return (
            <div
              key={approval.id}
              className="bg-white border border-[#E5E7EB] rounded-lg hover:border-[#3D8BD0] transition-colors"
            >
              {/* Collapsed Header */}
              <div 
                onClick={() => toggleAccordion(approval.id)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-[#F9FAFB] transition-colors rounded-lg cursor-pointer"
              >
                <div className="flex-1 flex flex-col items-start gap-1">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleAccordion(approval.id);
                      }}
                      className="text-left"
                    >
                      <h3 className="text-[14px] font-semibold text-[#364658]">
                        {approval.subject}
                      </h3>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingApproval(approval);
                        handleOpenPopup();
                      }}
                      className="p-1 hover:bg-[#E5E7EB] rounded transition-colors flex-shrink-0"
                      title="Edit Approval"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 16 16" fill="none">
                        <path d="M10.8619 1.52925C11.1223 1.2689 11.5444 1.2689 11.8047 1.52925L14.4714 4.19591C14.7318 4.45626 14.7318 4.87837 14.4714 5.13872L5.80474 13.8054C5.67971 13.9304 5.51014 14.0007 5.33333 14.0007H2.66667C2.29848 14.0007 2 13.7022 2 13.334V10.6673C2 10.4905 2.07024 10.3209 2.19526 10.1959L8.86179 3.52939L10.8619 1.52925ZM9.33333 4.94346L3.33333 10.9435V12.6673H5.05719L11.0572 6.66732L9.33333 4.94346ZM12 5.72451L13.0572 4.66732L11.3333 2.94346L10.2761 4.00065L12 5.72451Z" fill="#7B8FA5" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Handle chat functionality
                        setSelectedApprovalId(approval.id);
                        setShowCommentPopup(true);
                      }}
                      className="relative p-1 hover:bg-[#E5E7EB] rounded transition-colors flex-shrink-0"
                      title={`Approval Comment${(approvalComments[approval.id]?.length || 0) > 0 ? ` (${approvalComments[approval.id].length})` : ''}`}
                    >
                      <MessageSquare size={14} className="text-[#7B8FA5]" />
                      {(approvalComments[approval.id]?.length || 0) > 0 && (
                        <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] px-1 rounded-full bg-[#3D8BD0] text-white text-[9px] font-semibold flex items-center justify-center leading-none">
                          {approvalComments[approval.id].length}
                        </span>
                      )}
                    </button>
                  </div>
                  <p className="text-[12px] text-[#7B8FA5]">
                    Created by {approval.createdBy} • {approval.createdAt}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 text-[12px] font-medium rounded ${getTypeColor(approval.type)}`}>
                    {approval.type}
                  </span>
                  <span className={`px-2.5 py-1 text-[12px] font-medium rounded ${getStatusColor(approval.status)}`}>
                    {approval.status}
                  </span>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleAccordion(approval.id);
                    }} 
                    className="p-1"
                  >
                    {isExpanded ? (
                      <ChevronDown size={16} className="text-[#6B7280]" />
                    ) : (
                      <ChevronRight size={16} className="text-[#6B7280]" />
                    )}
                  </button>
                </div>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="border-t border-[#E5E7EB]">
                  {/* Level Tabs — folder tabs matching the Task Summary stage stepper: the
                      active level is a white tab that merges into the approvers table below;
                      a fully-approved level turns green with a check. */}
                  {approval.levels.length > 1 && (
                    <div className="px-4 pt-3 bg-gradient-to-b from-[#F9FBFD] to-[#F4F7FA] border-b border-[#E5E7EB]">
                      <div className="flex flex-wrap items-end gap-1">
                        <span className="text-[13px] font-semibold text-[#6B7280] mr-3 flex-shrink-0 self-center pb-3">
                          Approval Level
                        </span>
                        {approval.levels.map((level, idx) => {
                          const active = approvalSelectedLevel === level.level;
                          const complete = level.approvers.length > 0 && level.approvers.every((a) => a.status === 'Approved');
                          // Sequential approval — a level unlocks only once every earlier level is fully approved.
                          const locked = !approval.levels.slice(0, idx).every((l) => l.approvers.length > 0 && l.approvers.every((a) => a.status === 'Approved'));
                          return (
                            <button
                              key={level.level}
                              onClick={() => { if (!locked) setSelectedLevels((p) => ({ ...p, [approval.id]: level.level })); }}
                              disabled={locked}
                              title={locked ? 'Complete the previous level to unlock this level' : undefined}
                              className={`relative inline-flex items-center gap-2 px-3.5 pt-2 pb-2.5 -mb-px rounded-t-lg text-[12px] font-medium border border-b-0 transition-colors flex-shrink-0 ${locked ? 'border-transparent opacity-50 cursor-not-allowed' : active ? 'bg-white border-[#E5E7EB] shadow-[0_-2px_6px_rgba(31,42,61,0.05)] z-10' : 'border-transparent hover:bg-white/60'}`}
                            >
                              <span className={`size-5 rounded-md flex items-center justify-center text-[10px] font-bold ${complete ? 'bg-[#16A34A] text-white' : active && !locked ? 'bg-gradient-to-br from-[#4F93FF] to-[#2F6FED] text-white' : 'bg-white border border-[#CBD5E1] text-[#475569]'}`}>
                                {complete ? <Check size={11} /> : level.level}
                              </span>
                              <span className={`flex items-center gap-1 ${complete ? 'text-[#16A34A]' : active && !locked ? 'text-[#2F6FED]' : 'text-[#5A6A82]'}`}>
                                Level {level.level}
                                {locked && <Lock size={11} className="text-[#9CA3AF]" />}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Approvers Table */}
                  {currentLevel && (
                    <div className="p-4">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-[#E5E7EB]">
                            <th className="pb-2 text-left text-[12px] font-semibold text-[#364658] tracking-wider">
                              Approver
                            </th>
                            <th className="pb-2 text-left text-[12px] font-semibold text-[#364658] tracking-wider">
                              Status
                            </th>
                            <th className="pb-2 text-right text-[12px] font-semibold text-[#364658] tracking-wider">
                              Action
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentLevel.approvers.map((approver) => (
                            <tr key={approver.id} className="border-b border-[#E5E7EB] last:border-0">
                              <td className="py-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-[24px] h-[24px] rounded bg-[#3D8BD0] flex items-center justify-center text-white text-[10px] font-medium">
                                    {approver.name.split(' ').map(n => n[0]).join('')}
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="flex items-center gap-1.5 text-[13px] text-[#364658] font-medium">
                                      {approver.name}
                                      {/* Names the one row you can act on, so the empty Action
                                          cells on the others read as deliberate. */}
                                      {approver.id === myApproverId && (
                                        <span className="rounded-sm bg-[#EBF5FF] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#3D8BD0]">
                                          You
                                        </span>
                                      )}
                                    </span>
                                    <span className="text-[12px] text-[#7B8FA5]">
                                      {approver.email}
                                    </span>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3">
                                <div className="group relative inline-block">
                                  <span className={`inline-flex items-center px-2.5 py-1 text-[12px] font-medium rounded ${getStatusColor(approver.status)}`}>
                                    {approver.status}
                                  </span>
                                  {approver.statusChangedAt && (
                                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-3 py-1.5 bg-[#1F2937] text-white text-[11px] rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                                      {approver.status === 'Pending' ? 'Pending since' : `${approver.status} on`} {approver.statusChangedAt}
                                      <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-[#1F2937]"></div>
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="py-3">
                                <div className="flex items-center justify-end gap-2">
                                  {approver.id === myApproverId && (
                                    <div className="flex items-center gap-1.5">
                                      {ROW_ACTIONS.map(({ status, label, Icon, cls }) => (
                                        <Tooltip key={status} delayDuration={300}>
                                          <TooltipTrigger asChild>
                                            <button
                                              onClick={() => updateApproverStatus(approval.id, approver.id, status)}
                                              className={`flex size-7 flex-shrink-0 items-center justify-center rounded border transition-colors ${cls}`}
                                            >
                                              <Icon size={14} />
                                            </button>
                                          </TooltipTrigger>
                                          <TooltipContent>{label}</TooltipContent>
                                        </Tooltip>
                                      ))}
                                    </div>
                                  )}
                                  {approver.status === 'Pending' && (
                                    <div className="relative">
                                      <button
                                        onClick={() => setOpenDropdownId(openDropdownId === approver.id ? null : approver.id)}
                                        className="p-1.5 hover:bg-[#F3F4F6] rounded transition-colors"
                                      >
                                        <MoreVertical size={16} className="text-[#6B7280]" />
                                      </button>
                                      {openDropdownId === approver.id && (
                                        <div className="app-menu absolute right-0 top-full mt-1 w-[140px] bg-white border border-[#E5E7EB] rounded-lg shadow-lg py-1 z-10">
                                          {/* Refer back moved out to the row's own icon buttons. */}
                                          <button
                                            className="w-full px-3 py-2 text-left text-[13px] text-[#364658] hover:bg-[#F3F4F6] transition-colors"
                                            onClick={() => setOpenDropdownId(null)}
                                          >
                                            Ignore
                                          </button>
                                          <button
                                            className="w-full px-3 py-2 text-left text-[13px] text-[#364658] hover:bg-[#F3F4F6] transition-colors"
                                            onClick={() => setOpenDropdownId(null)}
                                          >
                                            Remind
                                          </button>
                                          <button
                                            className="w-full px-3 py-2 text-left text-[13px] text-[#EF4444] hover:bg-[#FEE2E2] transition-colors"
                                            onClick={() => setOpenDropdownId(null)}
                                          >
                                            Delete
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <button
        className="mt-4 inline-flex items-center gap-1 px-2.5 py-1.5 bg-white border border-[#DFE5ED] text-[#364658] text-[13px] font-medium rounded hover:bg-[#F5F7FA] hover:border-[#3D8BD0] transition-colors whitespace-nowrap"
        onClick={handleOpenPopup}
      >
        <Plus size={16} />
        Create Approval
      </button>
      {showCreateApprovalPopup && (
        <CreateApprovalPopup
          isOpen={showCreateApprovalPopup}
          onClose={() => {
            handleClosePopup();
            setEditingApproval(null);
          }}
          approval={editingApproval}
        />
      )}
      {showCommentPopup && selectedApprovalId && (
        <ApprovalCommentPopup
          isOpen={showCommentPopup}
          onClose={() => setShowCommentPopup(false)}
          approvalId={selectedApprovalId}
          approvalSubject={approvals.find(a => a.id === selectedApprovalId)?.subject || ''}
          comments={approvalComments[selectedApprovalId] || []}
          onAddComment={(comment) => setApprovalComments((prev) => ({ ...prev, [selectedApprovalId]: [...(prev[selectedApprovalId] || []), comment] }))}
          onUpdateComment={(id, content) => setApprovalComments((prev) => ({
            ...prev,
            [selectedApprovalId]: (prev[selectedApprovalId] || []).map((c) => (c.id === id ? { ...c, content } : c)),
          }))}
          onDeleteComment={(id) => setApprovalComments((prev) => ({
            ...prev,
            [selectedApprovalId]: (prev[selectedApprovalId] || []).filter((c) => c.id !== id),
          }))}
        />
      )}
    </div>
  );
}