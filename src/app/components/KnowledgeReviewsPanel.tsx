import { useState, useRef, useEffect } from 'react';
import { X, MessageSquare, Lock, Trash2, SquarePen } from 'lucide-react';
import { toast } from 'sonner';
import { Tooltip, TooltipTrigger, TooltipContent } from './ui/tooltip';
import { EditorQuickActions, EditorFormattingRow, EditorSendActions, EditorAiAssist } from './upstream/EditorToolbar';
import type { KnowledgeReview } from './upstream/TicketPropertiesPanel';

/* Reviews side panel for a knowledge article — the rich-editor thread.
 *
 * Extracted from TicketPropertiesPanel so BOTH views can open the same panel: the technician from
 * the properties rail, the requester from the review-assignment banner in the article. The
 * requester has no rail, so without this the two would have drifted into separate editors. */

export function KnowledgeReviewsPanel({
  open,
  onClose,
  reviews,
  onChange,
  requesterView = false,
}: {
  open: boolean;
  onClose: () => void;
  /** Already filtered for the audience — the caller decides what this reader may see. */
  reviews: KnowledgeReview[];
  onChange: React.Dispatch<React.SetStateAction<KnowledgeReview[]>>;
  /** Requester-authored reviews are public; technician ones are internal. */
  requesterView?: boolean;
}) {
  const [reviewDraft, setReviewDraft] = useState('');
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [reviewFormattingOpen, setReviewFormattingOpen] = useState(false);
  const reviewContentRef = useRef<HTMLDivElement>(null);
  const reviewAutoOpenedRef = useRef(false);
  /* The composer rests as a one-line prompt; clicking expands it, sending or clicking
     anywhere outside minimises it again. The draft survives — the editor is hidden, not
     unmounted — and the prompt previews it. (Same behaviour as the comment composers.) */
  const [composerExpanded, setComposerExpanded] = useState(false);
  const composerExpandedRef = useRef(composerExpanded);
  composerExpandedRef.current = composerExpanded;
  const reviewFormRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!composerExpandedRef.current) return;
      if (reviewFormRef.current?.contains(e.target as Node)) return;
      setComposerExpanded(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  // Reset the composer whenever the panel is closed, so it never reopens mid-edit.
  useEffect(() => {
    if (!open) {
      setComposerExpanded(false);
      setEditingReviewId(null);
      setReviewDraft('');
      if (reviewContentRef.current) reviewContentRef.current.innerHTML = '';
    }
  }, [open]);

  if (!open) return null;

  // Local aliases so the extracted markup reads unchanged.
  const knowledgeReviews = reviews;
  const setAddedReviews = onChange;
  const knowledgeRequesterView = requesterView;

  return (
        <>
          <div className="fixed inset-0 z-[10000] bg-black/40" onClick={() => onClose()} />
          <div className="fixed inset-y-0 right-0 z-[10001] flex w-[680px] max-w-[94vw] flex-col bg-white shadow-2xl">
            <div className="flex flex-shrink-0 items-center justify-between border-b border-[#E5E7EB] px-6 py-4">
              <h2 className="text-[16px] font-semibold text-[#364658]">
                Reviews <span className="font-normal text-[#7B8FA5]">— {knowledgeReviews.length}</span>
              </h2>
              <button onClick={() => onClose()} className="flex size-8 items-center justify-center rounded transition-colors hover:bg-[#F3F4F6]">
                <X size={16} className="text-[#64748B]" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
              {knowledgeReviews.length === 0 ? (
                <div className="flex min-h-[280px] items-center justify-center">
                  <div className="text-center">
                    <div className="mb-4 inline-flex size-14 items-center justify-center rounded-full bg-[#F1F5F9]">
                      <MessageSquare className="size-7 text-[#7B8FA5]" />
                    </div>
                    <h3 className="mb-1.5 text-[15px] font-semibold text-[#364658]">No Reviews Yet</h3>
                    <p className="mx-auto max-w-[260px] text-[13px] text-[#7B8FA5]">
                      Be the first to review this article — your feedback helps the author keep it accurate.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {knowledgeReviews.map((r, i) => (
                    <div key={r.id ?? i} className="group/review">
                      {/* Header row — author, time, type pill, hover actions (note-block pattern) */}
                      <div className="mb-1.5 flex items-center gap-2">
                        <span className="flex size-6 flex-shrink-0 items-center justify-center rounded text-[10px] font-semibold text-white" style={{ backgroundColor: r.color }}>{r.initials}</span>
                        <span className="text-[13px] font-semibold text-[#364658]">{r.author}</span>
                        <span className="text-[12px] text-[#9CA3AF]">{r.when}</span>
                        {r.role !== 'requester' && (
                          <Tooltip>
                            <TooltipTrigger>
                              <span className="flex cursor-help items-center gap-1 rounded bg-[#F5F7FA] px-2 py-0.5 text-xs font-medium text-[#7B8FA5]">
                                <Lock className="size-3" />
                                Internal
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>Not Visible to Requester</TooltipContent>
                          </Tooltip>
                        )}
                        <span className="ml-auto flex flex-shrink-0 items-center gap-2 opacity-0 transition-opacity group-hover/review:opacity-100">
                          <button
                            className="rounded p-1.5 hover:bg-[#F3F4F6]"
                            title="Edit"
                            onClick={() => {
                              setComposerExpanded(true);
                              setEditingReviewId(r.id);
                              if (reviewContentRef.current) reviewContentRef.current.innerHTML = r.text;
                              setReviewDraft(r.text);
                              setTimeout(() => reviewContentRef.current?.focus(), 50);
                            }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                              <path d="M10.8619 1.52925C11.1223 1.2689 11.5444 1.2689 11.8047 1.52925L14.4714 4.19591C14.7318 4.45626 14.7318 4.87837 14.4714 5.13872L5.80474 13.8054C5.67971 13.9304 5.51014 14.0007 5.33333 14.0007H2.66667C2.29848 14.0007 2 13.7022 2 13.334V10.6673C2 10.4905 2.07024 10.3209 2.19526 10.1959L8.86179 3.52939L10.8619 1.52925ZM9.33333 4.94346L3.33333 10.9435V12.6673H5.05719L11.0572 6.66732L9.33333 4.94346ZM12 5.72451L13.0572 4.66732L11.3333 2.94346L10.2761 4.00065L12 5.72451Z" fill="#7B8FA5"/>
                            </svg>
                          </button>
                          <button
                            className="rounded p-1.5 hover:bg-[#F3F4F6]"
                            title="Delete"
                            onClick={() => {
                              setAddedReviews((prev) => prev.filter((x) => x.id !== r.id));
                              if (editingReviewId === r.id) {
                                setEditingReviewId(null);
                                if (reviewContentRef.current) reviewContentRef.current.innerHTML = '';
                              }
                              toast.success('Review deleted');
                            }}
                          >
                            <Trash2 className="size-4 text-[#EF4444]" />
                          </button>
                        </span>
                      </div>
                      {/* Body — orange note block, matching internal notes on the conversation tab */}
                      {/* Technician reviews take the internal-note treatment (orange, left rule);
                          requester reviews take the public-reply treatment (plain gray) — the same
                          split the Conversation tab uses. */}
                      <div
                        className={r.role === 'requester'
                          ? 'rounded-lg bg-[rgba(223,229,237,0.20)] px-3.5 py-3 text-[13px] leading-relaxed text-[#364658]'
                          : 'rounded border-l-2 border-[#F58518] bg-[rgba(245,133,24,0.10)] px-3.5 py-3 text-[13px] leading-relaxed text-[#364658]'}
                        dangerouslySetInnerHTML={{ __html: r.text }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Composer — the SAME rich editor as the approval-comments popup */}
            <div className="flex-shrink-0 border-t border-[#DFE5ED] p-4">
              {editingReviewId && (
                <div className="mb-2 flex items-center gap-2 text-[12px] text-[#7B8FA5]">
                  <SquarePen size={12} />
                  Editing review
                  <button
                    onClick={() => {
                      setEditingReviewId(null);
                      if (reviewContentRef.current) reviewContentRef.current.innerHTML = '';
                      setReviewDraft('');
                    }}
                    className="text-[#3D8BD0] hover:underline"
                  >Cancel</button>
                </div>
              )}
              {!composerExpanded && (
                <button
                  onClick={() => {
                    setComposerExpanded(true);
                    setTimeout(() => reviewContentRef.current?.focus(), 50);
                  }}
                  className="w-full rounded-lg border border-[#DFE5ED] bg-white px-4 py-2.5 text-left text-sm text-[#9CA3AF] transition-colors hover:border-[#3D8BD0] hover:bg-[#F9FBFD]"
                >
                  {reviewDraft.replace(/<[^>]*>/g, ' ').trim()
                    ? <span className="block truncate text-[#364658]">{reviewDraft.replace(/<[^>]*>/g, ' ').trim()}</span>
                    : 'Write a review...'}
                </button>
              )}
              <div className={`rounded-lg border-2 border-[#3D8BD0] bg-white shadow-sm ${composerExpanded ? '' : 'hidden'}`} ref={reviewFormRef}>
                <div className="p-4">
                  <div className="mb-4">
                    <div
                      ref={reviewContentRef}
                      contentEditable
                      suppressContentEditableWarning
                      dir="ltr"
                      onInput={(e) => setReviewDraft(e.currentTarget.innerHTML)}
                      className={'w-full min-h-[100px] bg-transparent text-left text-sm text-[#364658] focus:outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-[#9CA3AF] ' + (reviewFormattingOpen ? 'pb-14' : '')}
                      data-placeholder="Write a review..."
                      style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}
                    />
                  </div>

                  {/* Formatting row floats above the toolbar so the editor height never jumps */}
                  <div className="relative">
                    {reviewFormattingOpen && <EditorFormattingRow />}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <EditorAiAssist />
                        <EditorQuickActions
                          formattingOpen={reviewFormattingOpen}
                          onToggleFormatting={() => {
                            reviewAutoOpenedRef.current = false; // manual toggle sticks
                            setReviewFormattingOpen(!reviewFormattingOpen);
                          }}
                        />
                      </div>
                      <EditorSendActions
                        showSaveDraft={false}
                        onSend={() => {
                          const html = reviewContentRef.current?.innerHTML ?? '';
                          const text = (reviewContentRef.current?.innerText ?? '').trim();
                          if (!text) return;
                          if (editingReviewId) {
                            setAddedReviews((prev) => prev.map((x) => (x.id === editingReviewId ? { ...x, text: html, when: 'Edited just now' } : x)));
                            setEditingReviewId(null);
                            toast.success('Review updated');
                          } else {
                            setAddedReviews((prev) => [{ id: 'r-' + Date.now(), author: 'Sarah Johnson', initials: 'SJ', color: '#22A06B', when: 'Just now', role: knowledgeRequesterView ? 'requester' : 'technician', text: html }, ...prev]);
                            toast.success('Review added');
                          }
                          if (reviewContentRef.current) reviewContentRef.current.innerHTML = '';
                          setReviewDraft('');
                          setComposerExpanded(false);
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
  );
}
