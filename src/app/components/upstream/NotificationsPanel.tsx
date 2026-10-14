/* VENDORED from the upstream prototype (ronak-patel-motadata/ServiceOps-Ticket-Detail-, Oct 2026 sync).
   Used ONLY by the detail pages and listings brought in from upstream — this project's own detail
   pages keep their own version in ../. Do not edit to change our pages; edit ../ instead. */
import { useState } from 'react';
import { Mail, FileText, Download, Eye, ChevronDown, ChevronRight } from 'lucide-react';
import { SendEmailModal, type EmailNotification, type EmailAttachment } from './SendEmailModal';
import { Tooltip, TooltipTrigger, TooltipContent } from '../ui/tooltip';
import { AttachmentPreviewModal } from '../AttachmentPreviewModal';

interface NotificationsPanelProps {
  recordId?: string;
  notifications: EmailNotification[];
  onSend: (email: EmailNotification) => void;
  showSendEmail: boolean;
  setShowSendEmail: (open: boolean) => void;
}

// Notifications tab in the right rail — lists emails sent for this record. Empty
// state mirrors the Tasks tab (icon + copy + a primary action button). Sent
// emails render as the SAME accordion cards the hardware Users group uses
// (grey rounded card, avatar + name + sub-line, hairline-topped detail rows).
export function NotificationsPanel({ recordId, notifications, onSend, showSendEmail, setShowSendEmail }: NotificationsPanelProps) {
  const [previewAttachment, setPreviewAttachment] = useState<EmailAttachment | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const toggleExpand = (id: string) =>
    setExpandedIds((prev) => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });

  // Users-group row recipe: 11px muted label column, 12px value.
  const Row = ({ label, value }: { label: string; value: string }) => (
    <div className="flex items-start gap-3">
      <span className="text-[11px] text-[#7B8FA5] flex-shrink-0 w-[90px]">{label}</span>
      <span className={`text-[12px] flex-1 min-w-0 break-words ${value ? 'text-[#364658]' : 'text-[#9CA3AF]'}`}>{value || '—'}</span>
    </div>
  );

  return (
    <div>
      {notifications.length === 0 ? (
        <div className="flex items-center justify-center min-h-[320px]">
          <div className="text-center">
            <div className="inline-flex items-center justify-center size-14 rounded-full bg-[#F1F5F9] mb-4">
              <Mail className="size-7 text-[#7B8FA5]" />
            </div>
            <h3 className="text-[15px] font-semibold text-[#364658] mb-1.5">No Notifications Yet</h3>
            <p className="text-[13px] text-[#7B8FA5] max-w-[260px] mb-4">
              Get started by sending your first email notification for this record.
            </p>
            <button
              onClick={() => setShowSendEmail(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-[#DFE5ED] text-[#364658] text-[13px] font-medium rounded hover:bg-[#F5F7FA] hover:border-[#3D8BD0] transition-colors"
            >
              <Mail size={15} />
              Send Email
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2 pt-1">
          {notifications.map((n) => {
            const expanded = expandedIds.has(n.id);
            return (
              <div key={n.id} className="group relative rounded-[10px] bg-[#F9FAFB]">
                {/* Collapsed row — avatar · sender · subject sub-line, time + chevron right */}
                <div
                  onClick={() => toggleExpand(n.id)}
                  className="w-full text-left px-3 py-2.5 flex items-center gap-3 cursor-pointer"
                >
                  <span
                    className="flex size-6 items-center justify-center rounded-sm text-[10px] font-semibold text-white flex-shrink-0"
                    style={{ backgroundColor: n.color }}
                  >
                    {n.initials}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-medium text-[#364658] truncate">{n.sender}</span>
                      <div className="ml-auto flex items-center gap-2 flex-shrink-0">
                        <span className="text-[11px] text-[#9CA3AF]">{n.time}</span>
                        <span className="text-[#9CA3AF]">{expanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}</span>
                      </div>
                    </div>
                    <div className="text-[12px] text-[#7B8FA5] truncate">{n.subject || '—'}</div>
                  </div>
                </div>

                {/* Expanded details — Users-group body recipe */}
                {expanded && (
                  <div className="px-3 pb-3 space-y-2 border-t border-[#EEF1F4] pt-2.5">
                    <div className="flex items-start gap-3">
                      <span className="text-[11px] text-[#7B8FA5] flex-shrink-0 w-[90px]">To</span>
                      <span className="text-[12px] flex-1 min-w-0 break-words text-[#364658]">
                        {n.to.length === 0 ? '—' : (
                          <>
                            {n.to.slice(0, 2).join(', ')}
                            {n.to.length > 2 && (
                              <>
                                {' '}
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-[#EFF3F8] text-[#3D8BD0] text-[11px] font-medium cursor-default align-middle">
                                      +{n.to.length - 2}
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <div className="flex flex-col gap-0.5">
                                      {n.to.slice(2).map((e, i) => <span key={i}>{e}</span>)}
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              </>
                            )}
                          </>
                        )}
                      </span>
                    </div>
                    <Row label="Subject" value={n.subject} />
                    <Row label="Technician Group" value={n.technicianGroup} />
                    <Row label="Requester Group" value={n.requesterGroup} />
                    <div className="pt-1.5 mt-1.5 border-t border-[#F0F2F5]">
                      <div className="text-[11px] text-[#7B8FA5] mb-1">Content</div>
                      <div className="text-[12px] text-[#364658] whitespace-pre-wrap break-words leading-relaxed">
                        {n.content || '—'}
                      </div>
                    </div>
                    {n.attachments.length > 0 && (
                      <div className="pt-1.5 mt-1.5 border-t border-[#F0F2F5]">
                        <div className="text-[11px] text-[#7B8FA5] mb-1.5">Attachment</div>
                        <div className="flex flex-col gap-1.5">
                          {n.attachments.map((a, i) => (
                            <div key={i} className="group/att flex items-center gap-2 px-2 py-1.5 rounded border border-[#DFE5ED] bg-white">
                              <FileText size={14} className="text-[#3D8BD0] flex-shrink-0" />
                              <div className="min-w-0 flex-1 leading-tight">
                                <div className="text-[12px] text-[#364658] truncate">{a.name}</div>
                                <div className="text-[10px] text-[#9CA3AF]">{a.size}</div>
                              </div>
                              <button
                                onClick={() => setPreviewAttachment(a)}
                                className="p-1 rounded text-[#64748B] opacity-0 group-hover/att:opacity-100 hover:bg-[#EBF5FF] transition-opacity"
                                title="Preview"
                              >
                                <Eye size={13} />
                              </button>
                              <button className="p-1 rounded text-[#3D8BD0] opacity-0 group-hover/att:opacity-100 hover:bg-[#EBF5FF] transition-opacity" title="Download">
                                <Download size={13} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <SendEmailModal
        isOpen={showSendEmail}
        onClose={() => setShowSendEmail(false)}
        recordId={recordId}
        onSend={onSend}
      />

      <AttachmentPreviewModal attachment={previewAttachment} onClose={() => setPreviewAttachment(null)} />
    </div>
  );
}
