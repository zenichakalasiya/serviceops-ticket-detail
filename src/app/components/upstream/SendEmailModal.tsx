/* VENDORED from the upstream prototype (ronak-patel-motadata/ServiceOps-Ticket-Detail-, Oct 2026 sync).
   Used ONLY by the detail pages and listings brought in from upstream — this project's own detail
   pages keep their own version in ../. Do not edit to change our pages; edit ../ instead. */
import { useState, useEffect, useRef } from 'react';
import {
  X, Upload, ChevronDown, Bold, Italic, Underline, Pilcrow, Heading1, Heading2, Heading3,
  Type, AlignLeft, AlignCenter, AlignRight, AlignJustify, List, ListOrdered, Link2, Image, Table,
  Code, Minus, PaintBucket, Baseline, Maximize2, Sparkles, Undo2, Redo2, FileText,
} from 'lucide-react';
import { toast } from 'sonner';

export interface EmailAttachment {
  name: string;
  size: string;
}

export interface EmailNotification {
  id: string;
  sender: string;
  initials: string;
  color: string;
  time: string;
  to: string[];
  technicianGroup: string;
  requesterGroup: string;
  subject: string;
  content: string;
  attachments: EmailAttachment[];
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface SendEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  recordId?: string;
  onSend: (email: EmailNotification) => void;
}

const TECH_GROUPS = ['IT Support Team', 'Network Team', 'Hardware Team', 'Software Team'];
const REQ_GROUPS = ['All Requesters', 'Finance Department', 'HR Department', 'Operations'];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const pad = (n: number) => String(n).padStart(2, '0');
function nowLabel() {
  const d = new Date();
  let h = d.getHours();
  const ap = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${pad(d.getDate())} ${MONTHS[d.getMonth()]} ${d.getFullYear()}, ${pad(h)}:${pad(d.getMinutes())} ${ap}`;
}

export function SendEmailModal({ isOpen, onClose, recordId, onSend }: SendEmailModalProps) {
  const [recipients, setRecipients] = useState<string[]>([]);
  const [recipientInput, setRecipientInput] = useState('');
  const [techGroup, setTechGroup] = useState('');
  const [reqGroup, setReqGroup] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<EmailAttachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setRecipients([]);
      setRecipientInput('');
      setTechGroup('');
      setReqGroup('');
      setSubject(recordId ? `[${recordId}]: ` : '');
      setContent('');
      setAttachments([]);
    }
  }, [isOpen, recordId]);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const picked = Array.from(files).map((f) => ({ name: f.name, size: formatSize(f.size) }));
    setAttachments((prev) => [...prev, ...picked]);
  };

  if (!isOpen) return null;

  const handleSend = () => {
    if (!subject.trim() || !content.trim()) {
      toast.error('Subject and email content are required');
      return;
    }
    const allRecipients = recipientInput.trim() ? [...recipients, recipientInput.trim()] : recipients;
    onSend({
      id: `mail-${Date.now()}`,
      sender: 'Rakesh Rathod',
      initials: 'RR',
      color: '#3D8BD0',
      time: nowLabel(),
      to: allRecipients.map((r) => r.trim()).filter(Boolean),
      technicianGroup: techGroup,
      requesterGroup: reqGroup,
      subject: subject.trim(),
      content: content.trim(),
      attachments,
    });
    toast.success('Email sent');
    onClose();
  };

  const tb = 'size-[30px] flex items-center justify-center hover:bg-[#F1F5F9] rounded text-[#7B8FA5] transition-colors';

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-[10003]" onClick={onClose} />
      <div className="fixed top-0 right-0 h-full w-[920px] max-w-[96vw] bg-white shadow-2xl z-[10004] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB] flex-shrink-0">
          <h2 className="text-[18px] font-semibold text-[#111827]">Send Email</h2>
          <button onClick={onClose} className="flex size-8 flex-shrink-0 items-center justify-center rounded transition-colors hover:bg-[#F3F4F6] text-[#6B7280] hover:text-[#111827]">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto px-6 py-5 space-y-5">
          {/* Send Email To — type an email and press Enter or comma to add (multiple supported) */}
          <div>
            <label className="block text-[13px] text-[#4A5568] mb-1.5">Send Email To</label>
            <div className="flex flex-wrap items-center gap-1.5 rounded border border-[#DFE5ED] px-2 py-1.5 focus-within:border-[#3D8BD0] transition-colors">
              {recipients.map((em, i) => (
                <span key={i} className="inline-flex items-center gap-1 rounded bg-[#EFF3F8] text-[#364658] text-[12px] pl-2 pr-1 py-1">
                  {em}
                  <button
                    onClick={() => setRecipients((prev) => prev.filter((_, idx) => idx !== i))}
                    className="text-[#7B8FA5] hover:text-[#DC2626]"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
              <input
                type="email"
                value={recipientInput}
                onChange={(e) => setRecipientInput(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.key === 'Enter' || e.key === ',') && recipientInput.trim()) {
                    e.preventDefault();
                    setRecipients((prev) => [...prev, recipientInput.trim()]);
                    setRecipientInput('');
                  } else if (e.key === 'Backspace' && !recipientInput && recipients.length) {
                    setRecipients((prev) => prev.slice(0, -1));
                  }
                }}
                onBlur={() => { if (recipientInput.trim()) { setRecipients((prev) => [...prev, recipientInput.trim()]); setRecipientInput(''); } }}
                placeholder={recipients.length ? '' : 'name@company.com'}
                className="flex-1 min-w-[160px] bg-transparent text-[13px] text-[#364658] placeholder:text-[#9ca3af] outline-none py-1"
              />
            </div>
          </div>

          {/* Groups */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-[13px] text-[#4A5568] mb-1.5">Send Email To Technician Group</label>
              <div className="relative">
                <select
                  value={techGroup}
                  onChange={(e) => setTechGroup(e.target.value)}
                  className="w-full appearance-none px-3 py-2 border border-[#DFE5ED] rounded text-[13px] text-[#364658] focus:outline-none focus:border-[#3D8BD0] bg-white"
                >
                  <option value="">Select</option>
                  {TECH_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7B8FA5] pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-[13px] text-[#4A5568] mb-1.5">Send Email To Requester Group</label>
              <div className="relative">
                <select
                  value={reqGroup}
                  onChange={(e) => setReqGroup(e.target.value)}
                  className="w-full appearance-none px-3 py-2 border border-[#DFE5ED] rounded text-[13px] text-[#364658] focus:outline-none focus:border-[#3D8BD0] bg-white"
                >
                  <option value="">Select</option>
                  {REQ_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7B8FA5] pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-[13px] text-[#4A5568] mb-1.5">
              Subject <span className="text-[#EF4444]">*</span>
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 border border-[#DFE5ED] rounded text-[13px] text-[#364658] focus:outline-none focus:border-[#3D8BD0]"
            />
          </div>

          {/* Email content + toolbar */}
          <div>
            <label className="block text-[13px] text-[#4A5568] mb-1.5">
              Email content <span className="text-[#EF4444]">*</span>
            </label>
            <div className="border border-[#DFE5ED] rounded-lg overflow-hidden focus-within:border-[#3D8BD0]">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Email content"
                dir="ltr"
                className="w-full min-h-[170px] px-3 py-2 text-[13px] text-[#364658] focus:outline-none resize-none placeholder:text-[#9CA3AF]"
                style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}
              />
              <div className="border-t border-[#EEF1F5] px-2 py-1.5">
                <div className="flex items-center gap-0.5 flex-wrap">
                  <button className={tb} title="Bold"><Bold size={16} /></button>
                  <button className={tb} title="Italic"><Italic size={16} /></button>
                  <button className={tb} title="Underline"><Underline size={16} /></button>
                  <button className={tb} title="Paragraph"><Pilcrow size={16} /></button>
                  <button className={tb} title="Heading 1"><Heading1 size={16} /></button>
                  <button className={tb} title="Heading 2"><Heading2 size={16} /></button>
                  <button className={tb} title="Heading 3"><Heading3 size={16} /></button>
                  <button className={tb} title="Font"><Type size={16} /></button>
                  <button className={tb} title="Align Left"><AlignLeft size={16} /></button>
                  <button className={tb} title="Align Center"><AlignCenter size={16} /></button>
                  <button className={tb} title="Align Right"><AlignRight size={16} /></button>
                  <button className={tb} title="Align Justify"><AlignJustify size={16} /></button>
                  <button className={tb} title="Bulleted List"><List size={16} /></button>
                  <button className={tb} title="Numbered List"><ListOrdered size={16} /></button>
                  <button className={tb} title="Link"><Link2 size={16} /></button>
                  <button className={tb} title="Image"><Image size={16} /></button>
                  <button className={tb} title="Table"><Table size={16} /></button>
                  <button className={tb} title="Code"><Code size={16} /></button>
                  <button className={tb} title="Divider"><Minus size={16} /></button>
                  <button className={tb} title="Background Color"><PaintBucket size={16} /></button>
                  <button className={tb} title="Text Color"><Baseline size={16} /></button>
                  <button className={tb} title="Fullscreen"><Maximize2 size={16} /></button>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <button
                    className="flex items-center gap-1.5 px-2 py-1 rounded text-[12px] font-medium text-[#3D8BD0] hover:bg-[#EBF5FF]"
                    title="Enhance with AI"
                  >
                    <Sparkles size={14} />
                    Enhance
                  </button>
                  <button className={tb} title="Undo"><Undo2 size={16} /></button>
                  <button className={tb} title="Redo"><Redo2 size={16} /></button>
                </div>
              </div>
            </div>
          </div>

          {/* Attachment */}
          <div>
            <label className="block text-[13px] text-[#4A5568] mb-1.5">Attachment</label>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => { handleFiles(e.target.files); e.target.value = ''; }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#3D8BD0] text-white text-[13px] font-medium rounded hover:bg-[#2C6B9F] transition-colors"
            >
              <Upload size={15} />
              Attach Files
            </button>
            {attachments.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {attachments.map((a, i) => (
                  <div key={i} className="flex items-center gap-2 pl-2 pr-1.5 py-1.5 rounded border border-[#DFE5ED] bg-[#F8FAFC]">
                    <FileText size={14} className="text-[#3D8BD0] flex-shrink-0" />
                    <div className="flex flex-col leading-tight">
                      <span className="text-[12px] text-[#364658] max-w-[200px] truncate">{a.name}</span>
                      <span className="text-[10px] text-[#9CA3AF]">{a.size}</span>
                    </div>
                    <button
                      onClick={() => setAttachments((prev) => prev.filter((_, idx) => idx !== i))}
                      className="p-1 rounded text-[#E74C3C] hover:bg-[#FEF2F2]"
                      title="Remove"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#E5E7EB] flex-shrink-0">
          <button
            onClick={handleSend}
            className="px-5 py-2 bg-[#3D8BD0] text-white text-[14px] font-medium rounded hover:bg-[#2C6B9F] transition-colors"
          >
            Send
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 border border-[#DFE5ED] text-[#364658] text-[14px] font-medium rounded hover:bg-[#F3F4F6] transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </>
  );
}
