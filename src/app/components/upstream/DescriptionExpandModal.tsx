/* VENDORED from the upstream prototype (ronak-patel-motadata/ServiceOps-Ticket-Detail-, Oct 2026 sync).
   Used ONLY by the detail pages and listings brought in from upstream — this project's own detail
   pages keep their own version in ../. Do not edit to change our pages; edit ../ instead. */
import { useState, useEffect } from 'react';
import { X, Bold, Italic, Underline, List, ListOrdered, Code, Link2, Paperclip, Image, Smile, Type } from 'lucide-react';

interface DescriptionExpandModalProps {
  isOpen: boolean;
  onClose: () => void;
  value: string;
  onChange: (value: string) => void;
}

// Expanded editor for a description field — a large textarea plus the same
// formatting / insert toolbar used by the Reply & Forward editors in the
// Conversation tab (decorative in this prototype).
export function DescriptionExpandModal({ isOpen, onClose, value, onChange }: DescriptionExpandModalProps) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    if (isOpen) setDraft(value);
  }, [isOpen, value]);

  if (!isOpen) return null;

  const save = () => {
    onChange(draft);
    onClose();
  };

  const toolBtn = 'size-[30px] flex items-center justify-center hover:bg-[#F9FAFB] rounded text-[#7B8FA5] transition-colors';

  return (
    <div className="fixed inset-0 z-[10002] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative flex max-h-[85vh] w-full max-w-[720px] flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#E5E7EB]">
          <h2 className="text-[16px] font-semibold text-[#364658]">Description</h2>
          <button onClick={onClose} className="flex size-8 flex-shrink-0 items-center justify-center rounded transition-colors hover:bg-[#F3F4F6] text-[#6B7280] hover:text-[#111827]">
            <X size={18} />
          </button>
        </div>

        {/* Textarea */}
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-4">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Write a description..."
            dir="ltr"
            className="w-full min-h-[240px] text-[13px] text-[#364658] focus:outline-none bg-transparent resize-none placeholder:text-[#9CA3AF]"
            style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}
            autoFocus
          />
        </div>

        {/* Formatting / insert toolbar */}
        <div className="px-4 py-2 border-t border-[#EEF1F5]">
          <div className="flex items-center gap-0.5 flex-wrap">
            <button className={toolBtn} title="Bold"><Bold size={16} /></button>
            <button className={toolBtn} title="Italic"><Italic size={16} /></button>
            <button className={toolBtn} title="Underline"><Underline size={16} /></button>
            <button className={toolBtn} title="Bulleted List"><List size={16} /></button>
            <button className={toolBtn} title="Numbered List"><ListOrdered size={16} /></button>
            <button className={toolBtn} title="Code"><Code size={16} /></button>
            <button className={toolBtn} title="Link"><Link2 size={16} /></button>
            <span className="w-px h-5 bg-[#E5E7EB] mx-1" />
            <button className={toolBtn} title="Attach File"><Paperclip size={16} /></button>
            <button className={toolBtn} title="Insert Image"><Image size={16} /></button>
            <button className={toolBtn} title="Insert Emoji"><Smile size={16} /></button>
            <button className={toolBtn} title="Text Options"><Type size={16} /></button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-3 border-t border-[#E5E7EB]">
          <button
            onClick={save}
            className="px-4 py-1.5 bg-[#3D8BD0] text-white text-[13px] font-medium rounded hover:bg-[#2C6B9F] transition-colors"
          >
            Save
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 border border-[#DFE5ED] text-[#364658] text-[13px] font-medium rounded hover:bg-[#F3F4F6] transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
