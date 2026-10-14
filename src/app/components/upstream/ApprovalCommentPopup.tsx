/* VENDORED from the upstream prototype (ronak-patel-motadata/ServiceOps-Ticket-Detail-, Oct 2026 sync).
   Used ONLY by the detail pages and listings brought in from upstream — this project's own detail
   pages keep their own version in ../. Do not edit to change our pages; edit ../ instead. */
import { X, Lock, ChevronDown, RefreshCw, TextCursorInput, Minimize2, Wand2, ChevronRight, Briefcase, Heart, Zap, FileText, SmilePlus, MessageSquare, Search, ArrowUpDown , Trash2 , SquarePen, ChevronsUpDown } from 'lucide-react';
import { AiSparkle } from './AiSparkle';
import { EditorQuickActions, EditorFormattingRow, EditorSendActions } from './EditorToolbar';
import { useState, useRef, useEffect, Fragment } from 'react';
import { Tooltip, TooltipTrigger, TooltipContent } from '../ui/tooltip';

export interface ApprovalComment { id: number; author: string; initials: string; color: string; content: string; time: string }

interface ApprovalCommentPopupProps {
  isOpen: boolean;
  onClose: () => void;
  approvalId: string;
  approvalSubject: string;
  comments: ApprovalComment[];
  onAddComment: (comment: ApprovalComment) => void;
  /** Optional — enables the hover edit / delete actions on each comment. */
  onUpdateComment?: (id: number, content: string) => void;
  onDeleteComment?: (id: number) => void;
}

export function ApprovalCommentPopup({ isOpen, onClose, approvalSubject, comments, onAddComment, onUpdateComment, onDeleteComment }: ApprovalCommentPopupProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-end">
      <div className="flex h-full w-[600px] max-w-[95vw] flex-col bg-white shadow-xl">
        {/* Header */}
        <div className="px-4 py-3 border-b border-[#DFE5ED] flex items-center justify-between">
          <div className="min-w-0">
            <h3 className="text-[18px] font-semibold text-[#364658]">Comments</h3>
            <p className="truncate text-[14px] text-[#7B8FA5]" title={approvalSubject}>{approvalSubject}</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="text-[#7B8FA5] hover:text-[#364658]" onClick={onClose}>
              <X size={16} />
            </button>
          </div>
        </div>
        <CommentThreadPanel comments={comments} onAddComment={onAddComment} onUpdateComment={onUpdateComment} onDeleteComment={onDeleteComment} collapsibleComposer />
      </div>
    </div>
  );
}

/* The comment thread + composer WITHOUT the popup shell, so the same experience can be hosted
   by the approval side popup AND as a page tab (Task detail). The parent must be a flex
   column: the thread takes the leftover height, the composer stays pinned at the bottom. */
export function CommentThreadPanel({ comments, onAddComment, onUpdateComment, onDeleteComment, toolbarBorder = true, collapsibleComposer = false, boxed = false, inlineThread = false, showInternalTag = true }: {
  comments: ApprovalComment[];
  onAddComment: (comment: ApprovalComment) => void;
  onUpdateComment?: (id: number, content: string) => void;
  onDeleteComment?: (id: number) => void;
  /** The rule under the toolbar. Off in the Comments TAB, where the tab strip already draws one. */
  toolbarBorder?: boolean;
  /** The Internal lock pill. Off on the Task page — tasks are technician-only, so saying
   *  "Internal" on every comment states the obvious. */
  showInternalTag?: boolean;
  /** Task pages: the thread flows with the page (no internal scroll) — the drawer provides
   *  the single top-to-bottom scroll and the sticky tab strip. */
  inlineThread?: boolean;
  /** Wraps the toolbar + thread in ONE bordered card (Task option 2); the composer stays
   *  outside the card so it can stick to the viewport bottom. */
  boxed?: boolean;
  /** Comments-TAB mode: the composer sticks to the bottom of the viewport and rests as a
   *  one-line prompt — clicking expands the full editor, sending collapses it again. */
  collapsibleComposer?: boolean;
}) {
  // Which comment the composer is currently editing (null = writing a new one).
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [commentContent, setCommentContent] = useState('');
  const [commentSearch, setCommentSearch] = useState('');
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [showOldComments, setShowOldComments] = useState(false);
  const [composerExpanded, setComposerExpanded] = useState(!collapsibleComposer);
  const composerExpandedRef = useRef(composerExpanded);
  composerExpandedRef.current = composerExpanded;
  const [sortNewestFirst, setSortNewestFirst] = useState(false);
  const [showAIAssistMenu, setShowAIAssistMenu] = useState(false);
  const [showToneSubmenu, setShowToneSubmenu] = useState(false);
  const [showFormattingMenu, setShowFormattingMenu] = useState(false);

  const commentFormRef = useRef<HTMLDivElement>(null);

  // Tab mode: clicking anywhere outside the editor card minimises it (the draft survives).
  useEffect(() => {
    if (!collapsibleComposer) return;
    const onDown = (e: MouseEvent) => {
      if (!composerExpandedRef.current) return;
      if (commentFormRef.current?.contains(e.target as Node)) return;
      setComposerExpanded(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collapsibleComposer]);
  const commentContentRef = useRef<HTMLDivElement>(null);
  const aiAssistMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (aiAssistMenuRef.current && !aiAssistMenuRef.current.contains(event.target as Node)) {
        setShowAIAssistMenu(false);
        setShowToneSubmenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Selecting text in the comment editor auto-opens the formatting row (Reply-editor pattern);
  // deselecting hides it again — but ONLY when it was auto-opened. A manual T toggle sticks.
  const autoOpenedRef = useRef(false);
  const showFormattingRef = useRef(showFormattingMenu);
  showFormattingRef.current = showFormattingMenu;
  useEffect(() => {
    const onSelectionChange = () => {
      const sel = document.getSelection();
      const el = commentContentRef.current;
      const insideSelection = !!(sel && !sel.isCollapsed && el && sel.anchorNode && el.contains(sel.anchorNode));
      if (insideSelection) {
        if (!showFormattingRef.current) {
          autoOpenedRef.current = true;
          setShowFormattingMenu(true);
        }
      } else if (autoOpenedRef.current && showFormattingRef.current) {
        autoOpenedRef.current = false;
        setShowFormattingMenu(false);
      }
    };
    document.addEventListener('selectionchange', onSelectionChange);
    return () => document.removeEventListener('selectionchange', onSelectionChange);
  }, []);

  const handleSend = () => {
    const text = commentContent.replace(/<[^>]*>/g, '').trim();
    if (!text) return; // don't add empty comments
    // Editing an existing comment updates it in place instead of appending a new one.
    if (editingCommentId !== null && onUpdateComment) {
      onUpdateComment(editingCommentId, commentContent);
      setEditingCommentId(null);
      setCommentContent('');
      if (commentContentRef.current) commentContentRef.current.innerHTML = '';
      if (collapsibleComposer) setComposerExpanded(false);
      return;
    }
    const now = new Date();
    onAddComment({
      id: now.getTime(),
      author: 'Rakesh Rathod',
      initials: 'RR',
      color: '#3D8BD0',
      content: commentContent,
      time: now.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }),
    });
    setCommentContent('');
    if (commentContentRef.current) {
      commentContentRef.current.innerHTML = '';
    }
    if (collapsibleComposer) setComposerExpanded(false);
    // keep the popup open so the user sees their comment appear
  };

  // Search + sort (newest-first toggle) applied to the comment thread.
  const strip = (html: string) => html.replace(/<[^>]*>/g, ' ');
  const q = commentSearch.trim().toLowerCase();
  const filteredComments = q ? comments.filter((c) => strip(c.content).toLowerCase().includes(q)) : comments;
  /* Long threads open on the recent tail — the older comments fold behind a centred pill,
     the conversation-tab pattern. Searching or sorting newest-first shows everything. */
  const canCollapse = !q && !sortNewestFirst && filteredComments.length > 3;
  const hiddenCount = canCollapse && !showOldComments ? filteredComments.length - 3 : 0;
  const shownChrono = hiddenCount ? filteredComments.slice(hiddenCount) : filteredComments;
  const visibleComments = sortNewestFirst ? [...shownChrono].reverse() : shownChrono;
  /* 'Aug 12, 4:10 PM' → Today / Yesterday / 'Aug 12' (conversation-tab day groups). */
  const dayLabel = (time: string) => {
    const datePart = time.split(',')[0];
    const now = new Date();
    const d = new Date(`${datePart}, ${now.getFullYear()}`);
    if (isNaN(d.getTime())) return datePart;
    const diff = Math.round((new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() - new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()) / 86400000);
    return diff === 0 ? 'Today' : diff === 1 ? 'Yesterday' : datePart;
  };

  const threadBody = (
    <>
        {/* Search + sort toolbar (shown once there are comments) */}
        {/* Toolbar — the Conversation/Tasks-tab recipe: bordered icon buttons; the search
            expands into a field on click and collapses (clearing itself) on ✕. */}
        {comments.length > 0 && (
          <div className={`px-4 py-2.5 ${toolbarBorder ? 'border-b border-[#DFE5ED]' : ''} flex items-center gap-2 flex-shrink-0`}>
            {!searchExpanded ? (
              <button
                className="size-8 flex items-center justify-center border border-[#DFE5ED] rounded text-[#7B8FA5] hover:bg-[#F5F7FA] hover:text-[#364658] transition-colors flex-shrink-0"
                title="Search"
                onClick={() => setSearchExpanded(true)}
              >
                <Search size={16} />
              </button>
            ) : (
              <div className="flex items-center gap-2 h-9 px-3 border border-[#DFE5ED] rounded bg-white flex-1 min-w-0">
                <Search size={16} className="text-[#7B8FA5] flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Search comments..."
                  value={commentSearch}
                  onChange={(e) => setCommentSearch(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); setSearchExpanded(false); setCommentSearch(''); } }}
                  className="outline-none text-sm bg-transparent placeholder:text-[#9CA3AF] text-[#364658] flex-1 min-w-0"
                  autoFocus
                />
                <button
                  className="p-0.5 hover:bg-[#F5F7FA] rounded transition-colors flex-shrink-0"
                  onClick={() => { setSearchExpanded(false); setCommentSearch(''); }}
                >
                  <X size={14} className="text-[#7B8FA5]" />
                </button>
              </div>
            )}
            <button
              onClick={() => setSortNewestFirst((s) => !s)}
              title={sortNewestFirst ? 'Newest first' : 'Oldest first'}
              className="size-8 flex items-center justify-center border border-[#DFE5ED] rounded text-[#7B8FA5] hover:bg-[#F5F7FA] hover:text-[#364658] transition-colors flex-shrink-0"
            >
              <ArrowUpDown size={16} />
            </button>
            {/* How much the search kept — quiet, right-aligned, so filtering is never silent. */}
            <span className="ml-auto flex-shrink-0 text-[12px] text-[#7B8FA5]">
              {commentSearch.trim()
                ? `${filteredComments.length} of ${comments.length}`
                : `${comments.length} ${comments.length === 1 ? 'comment' : 'comments'}`}
            </span>
          </div>
        )}

        {/* Comment Form Content */}
        <div className={boxed ? 'p-4' : inlineThread ? 'flex-1 p-4' : 'flex-1 overflow-y-auto p-4'}>
          {comments.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="inline-flex items-center justify-center size-14 rounded-full bg-[#F5F7FA] mb-3">
                <MessageSquare className="size-6 text-[#9CA3AF]" />
              </div>
              <p className="text-[13px] text-[#7B8FA5]">No comments yet. Start the conversation below.</p>
            </div>
          ) : visibleComments.length === 0 ? (
            <div className="text-center py-10 text-[13px] text-[#7B8FA5]">No comments match your search.</div>
          ) : (
            <div className="space-y-5">
              {canCollapse && !showOldComments && (
                <div className="flex justify-center">
                  <button
                    onClick={() => setShowOldComments(true)}
                    className="inline-flex items-center gap-1.5 rounded border border-[#DFE5ED] bg-white px-3 py-1.5 text-[12px] font-medium text-[#364658] transition-colors hover:border-[#3D8BD0] hover:text-[#3D8BD0]"
                  >
                    {`${filteredComments.length - 3} older ${filteredComments.length - 3 === 1 ? 'comment' : 'comments'}`}
                    <ChevronsUpDown size={13} className="text-[#7B8FA5]" />
                  </button>
                </div>
              )}
              {visibleComments.map((c, i) => (
                <Fragment key={c.id}>
                {/* Day separator — the conversation tab's gradient hairline + centred label */}
                {(i === 0 || dayLabel(visibleComments[i - 1].time) !== dayLabel(c.time)) && (
                  <div className="flex items-center gap-3 pt-1 pb-1">
                    <div className="h-px flex-1 rounded-sm" style={{ background: 'linear-gradient(90deg, rgba(223, 229, 237, 0.00) 0%, rgba(223, 229, 237, 0.60) 100%)' }} />
                    <span className="text-xs font-medium text-[#7B8FA5]">{dayLabel(c.time)}</span>
                    <div className="h-px flex-1 rounded-sm" style={{ background: 'linear-gradient(90deg, rgba(223, 229, 237, 0.60) 0%, rgba(223, 229, 237, 0.00) 100%)' }} />
                  </div>
                )}
                <div className="group/cmt flex gap-3">
                  <div className="size-[26px] rounded flex items-center justify-center text-white text-xs font-semibold flex-shrink-0" style={{ backgroundColor: c.color }}>
                    {c.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-[#364658]">{c.author}</span>
                      <span className="text-xs text-[#7B8FA5]">{c.time}</span>
                      {showInternalTag && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="flex items-center gap-1 px-2 py-0.5 bg-[#F5F7FA] text-[#7B8FA5] text-xs rounded font-medium cursor-help">
                            <Lock className="size-3" />
                            Internal
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          Not Visible to Requester
                        </TooltipContent>
                      </Tooltip>
                      )}
                      {(onUpdateComment || onDeleteComment) && (
                        <span className="ml-auto flex flex-shrink-0 items-center gap-2 opacity-0 transition-opacity group-hover/cmt:opacity-100">
                          {onUpdateComment && (
                            <button
                              className="rounded p-1.5 hover:bg-[#F3F4F6]"
                              title="Edit"
                              onClick={() => {
                                setComposerExpanded(true);
                                setEditingCommentId(c.id);
                                if (commentContentRef.current) commentContentRef.current.innerHTML = c.content;
                                setCommentContent(c.content);
                                setTimeout(() => commentContentRef.current?.focus(), 50);
                              }}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M10.8619 1.52925C11.1223 1.2689 11.5444 1.2689 11.8047 1.52925L14.4714 4.19591C14.7318 4.45626 14.7318 4.87837 14.4714 5.13872L5.80474 13.8054C5.67971 13.9304 5.51014 14.0007 5.33333 14.0007H2.66667C2.29848 14.0007 2 13.7022 2 13.334V10.6673C2 10.4905 2.07024 10.3209 2.19526 10.1959L8.86179 3.52939L10.8619 1.52925ZM9.33333 4.94346L3.33333 10.9435V12.6673H5.05719L11.0572 6.66732L9.33333 4.94346ZM12 5.72451L13.0572 4.66732L11.3333 2.94346L10.2761 4.00065L12 5.72451Z" fill="#7B8FA5"/>
                              </svg>
                            </button>
                          )}
                          {onDeleteComment && (
                            <button
                              className="rounded p-1.5 hover:bg-[#F3F4F6]"
                              title="Delete"
                              onClick={() => {
                                onDeleteComment(c.id);
                                if (editingCommentId === c.id) {
                                  setEditingCommentId(null);
                                  if (commentContentRef.current) commentContentRef.current.innerHTML = '';
                                  setCommentContent('');
                                }
                              }}
                            >
                              <Trash2 className="size-4 text-[#EF4444]" />
                            </button>
                          )}
                        </span>
                      )}
                    </div>
                    <div
                      className="bg-[rgba(245,133,24,0.10)] rounded-lg border-l-2 border-[#F58518] p-4 mt-1 text-sm text-[#364658] leading-relaxed break-words"
                      dangerouslySetInnerHTML={{ __html: c.content }}
                    />
                  </div>
                </div>
                </Fragment>
              ))}
            </div>
          )}
        </div>

    </>
  );
  return (
    <>
      {boxed ? (
        <div className="mx-2 mb-4 flex-1">{threadBody}</div>
      ) : (
        threadBody
      )}
        {/* Comment Input Form - Fixed at Bottom */}
        <div className={collapsibleComposer ? 'sticky bottom-0 z-20 border-t border-[#DFE5ED] bg-white p-4' : 'p-4 border-t border-[#DFE5ED]'}>
          {/* Editing indicator — makes the mode obvious and gives a way back out */}
          {editingCommentId !== null && (
            <div className="mb-2 flex items-center gap-2 text-[12px] text-[#7B8FA5]">
              <SquarePen size={12} />
              Editing comment
              <button
                onClick={() => {
                  setEditingCommentId(null);
                  setCommentContent('');
                  if (commentContentRef.current) commentContentRef.current.innerHTML = '';
                }}
                className="text-[#3D8BD0] hover:underline"
              >Cancel</button>
            </div>
          )}
          {!composerExpanded && (
            <button
              onClick={() => {
                setComposerExpanded(true);
                setTimeout(() => commentContentRef.current?.focus(), 50);
              }}
              className="w-full rounded-lg border border-[#DFE5ED] bg-white px-4 py-2.5 text-left text-sm text-[#9CA3AF] transition-colors hover:border-[#3D8BD0] hover:bg-[#F9FBFD]"
            >
              {commentContent.replace(/<[^>]*>/g, ' ').trim()
                ? <span className="block truncate text-[#364658]">{commentContent.replace(/<[^>]*>/g, ' ').trim()}</span>
                : 'Start typing your comment...'}
            </button>
          )}
          <div className={`border-2 border-[#3D8BD0] rounded-lg bg-white shadow-sm ${composerExpanded ? '' : 'hidden'}`} ref={commentFormRef}>
            {/* Comment Form */}
            <div className="p-4">
              {/* Text Area — uncontrolled contentEditable (never re-write its HTML while typing,
                  or the caret jumps to the start and text appears reversed) */}
              <div className="mb-4">
                <div
                  ref={commentContentRef}
                  contentEditable
                  suppressContentEditableWarning
                  dir="ltr"
                  onInput={(e) => setCommentContent(e.currentTarget.innerHTML)}
                  className={`w-full min-h-[100px] text-sm text-[#364658] text-left focus:outline-none bg-transparent empty:before:content-[attr(data-placeholder)] empty:before:text-[#9CA3AF] ${showFormattingMenu ? 'pb-14' : ''}`}
                  data-placeholder="Start typing your comment..."
                  style={{
                    wordBreak: 'break-word',
                    whiteSpace: 'pre-wrap'
                  }}
                />
              </div>

              {/* Formatting row — revealed by the Text-formatting toggle; FLOATS above the toolbar
                  (absolute within this relative wrapper) so the editor height never jumps */}
              <div className="relative">
              {showFormattingMenu && <EditorFormattingRow />}

              {/* Bottom Toolbar */}
              <div className="flex items-center justify-between">
                {/* Left Side - AI Assist and Formatting Tools */}
                <div className="flex items-center gap-1">
                  <div className="relative" ref={aiAssistMenuRef}>
                    <button 
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded hover:bg-[#F0F8FF] text-xs font-medium text-[#364658]"
                      style={{ background: 'linear-gradient(90deg, rgba(76, 177, 254, 0.12) 0%, rgba(115, 30, 251, 0.12) 41.49%, rgba(249, 17, 227, 0.12) 100%), var(--Core-White, #FFF)' }}
                      onClick={() => setShowAIAssistMenu(!showAIAssistMenu)}
                    >
                      <AiSparkle size={14} />
                      <span>AI Assist</span>
                      <ChevronDown size={12} className="text-[#7B8FA5]" />
                    </button>

                    {/* AI Assist Dropdown Menu */}
                    {showAIAssistMenu && (
                      <div className="app-menu absolute left-0 bottom-full mb-2 w-[220px] bg-white border border-[#DFE5ED] rounded-lg shadow-lg z-50">
                        <div className="py-2">
                          {/* Refine section header */}
                          <div className="px-2 py-1.5 text-[11px] font-medium text-[#7B8FA5]">
                            Refine
                          </div>
                          
                          {/* Rephrase */}
                          <button 
                            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#F9FAFB] transition-colors text-left"
                            onClick={() => {
                              setShowAIAssistMenu(false);
                              // Handle rephrase action
                            }}
                          >
                            <RefreshCw size={14} className="text-[#364658]" />
                            <span className="text-xs text-[#364658]">Rephrase</span>
                          </button>
                          
                          {/* Make longer */}
                          <button 
                            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#F9FAFB] transition-colors text-left"
                            onClick={() => {
                              setShowAIAssistMenu(false);
                              // Handle make longer action
                            }}
                          >
                            <TextCursorInput size={14} className="text-[#364658]" />
                            <span className="text-xs text-[#364658]">Make longer</span>
                          </button>
                          
                          {/* Make shorter */}
                          <button 
                            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#F9FAFB] transition-colors text-left"
                            onClick={() => {
                              setShowAIAssistMenu(false);
                              // Handle make shorter action
                            }}
                          >
                            <Minimize2 size={14} className="text-[#364658]" />
                            <span className="text-xs text-[#364658]">Make shorter</span>
                          </button>
                          
                          {/* Change tone */}
                          <div className="relative">
                            <button 
                              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#F9FAFB] transition-colors text-left justify-between"
                              onClick={() => {
                                setShowToneSubmenu(!showToneSubmenu);
                              }}
                            >
                              <div className="flex items-center gap-2">
                                <Wand2 size={14} className="text-[#364658]" />
                                <span className="text-xs text-[#364658]">Change tone</span>
                              </div>
                              <ChevronRight size={14} className="text-[#7B8FA5]" />
                            </button>

                            {/* Tone Submenu */}
                            {showToneSubmenu && (
                              <div className="app-menu absolute left-full bottom-0 ml-1 w-[160px] bg-white border border-[#DFE5ED] rounded-lg shadow-lg z-50">
                                <div className="py-2">
                                  <button 
                                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#F9FAFB] transition-colors text-left"
                                    onClick={() => {
                                      setShowToneSubmenu(false);
                                      setShowAIAssistMenu(false);
                                    }}
                                  >
                                    <Briefcase size={14} className="text-[#364658]" />
                                    <span className="text-xs text-[#364658]">Professional</span>
                                  </button>
                                  
                                  <button 
                                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#F9FAFB] transition-colors text-left"
                                    onClick={() => {
                                      setShowToneSubmenu(false);
                                      setShowAIAssistMenu(false);
                                    }}
                                  >
                                    <Heart size={14} className="text-[#364658]" />
                                    <span className="text-xs text-[#364658]">Empathetic</span>
                                  </button>
                                  
                                  <button 
                                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#F9FAFB] transition-colors text-left"
                                    onClick={() => {
                                      setShowToneSubmenu(false);
                                      setShowAIAssistMenu(false);
                                    }}
                                  >
                                    <Zap size={14} className="text-[#364658]" />
                                    <span className="text-xs text-[#364658]">Concise</span>
                                  </button>
                                  
                                  <button 
                                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#F9FAFB] transition-colors text-left"
                                    onClick={() => {
                                      setShowToneSubmenu(false);
                                      setShowAIAssistMenu(false);
                                    }}
                                  >
                                    <FileText size={14} className="text-[#364658]" />
                                    <span className="text-xs text-[#364658]">Formal</span>
                                  </button>
                                  
                                  <button 
                                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#F9FAFB] transition-colors text-left"
                                    onClick={() => {
                                      setShowToneSubmenu(false);
                                      setShowAIAssistMenu(false);
                                    }}
                                  >
                                    <SmilePlus size={14} className="text-[#364658]" />
                                    <span className="text-xs text-[#364658]">Friendly</span>
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Shared conversation-editor quick actions (Template · Knowledge · Attach ·
                      Image · Link · Emoji · Text-formatting toggle · Undo/Redo) */}
                  <EditorQuickActions
                    formattingOpen={showFormattingMenu}
                    onToggleFormatting={() => {
                      autoOpenedRef.current = false; // manual toggle — selection changes won't auto-hide it
                      setShowFormattingMenu(!showFormattingMenu);
                    }}
                  />
                </div>

                {/* Right Side - Send Button (icon-only, internal comment → no draft) */}
                <EditorSendActions onSend={handleSend} showSaveDraft={false} />
              </div>
              </div>
            </div>
          </div>
        </div>
    </>
  );
}