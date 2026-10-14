/* VENDORED from the upstream prototype (ronak-patel-motadata/ServiceOps-Ticket-Detail-, Oct 2026 sync).
   Used ONLY by the detail pages and listings brought in from upstream — this project's own detail
   pages keep their own version in ../. Do not edit to change our pages; edit ../ instead. */
import { X, Maximize2, Sparkles, ChevronDown, ChevronRight, Paperclip, Image as ImageIcon, Link2, Smile, Type, Bold, Italic, Underline, List, ListOrdered, Code, CheckCircle, FileText, Mail, XCircle, RefreshCw, TextCursorInput, Minimize2, Wand2, Briefcase, Heart, Zap, SmilePlus, Plus } from 'lucide-react';
import { AiSparkle } from './AiSparkle';
import { EditorQuickActions, EditorFormattingRow, EditorSendActions, selectPlainRange } from './EditorToolbar';
import { useRef, useEffect, useState } from 'react';

/* Chip-input recipients (same pattern as SendEmailModal): type + Enter/comma → pill with ×,
   Backspace on an empty input removes the last pill. */
function EmailChips({ label, emails, setEmails }: { label: string; emails: string[]; setEmails: (e: string[]) => void }) {
  const [input, setInput] = useState('');
  const commit = () => {
    const v = input.trim().replace(/,+$/, '');
    if (v && v.includes('@') && !emails.includes(v)) setEmails([...emails, v]);
    setInput('');
  };
  return (
    <div className="flex flex-1 flex-wrap items-center gap-1.5">
      <label className="text-xs text-[#7B8FA5]">{label}</label>
      {emails.map((em, i) => (
        <span key={em} className="inline-flex items-center gap-1 rounded bg-[#EFF3F8] py-1 pl-2 pr-1 text-[12px] text-[#364658]">
          {em}
          <button onClick={() => setEmails(emails.filter((_, idx) => idx !== i))} className="text-[#7B8FA5] hover:text-[#DC2626]" title="Remove">
            <X size={12} />
          </button>
        </span>
      ))}
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); commit(); }
          else if (e.key === 'Backspace' && !input && emails.length) setEmails(emails.slice(0, -1));
        }}
        onBlur={commit}
        placeholder={emails.length ? '' : 'Add recipients'}
        className="min-w-[140px] flex-1 bg-transparent py-0.5 text-sm text-[#364658] focus:outline-none"
      />
    </div>
  );
}

interface ReplyEditorProps {
  replyFormRef: React.RefObject<HTMLDivElement>;
  onClose: () => void;
  onSend: () => void;
  onSaveDraft?: () => void;
  showCc: boolean;
  setShowCc: (value: boolean) => void;
  isAiTyping: boolean;
  aiTypingText: string;
  setAiTypingText: (value: string) => void;
  replyContent: string;
  setReplyContent: (value: string) => void;
  replyContentRef: React.RefObject<HTMLDivElement>;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  setShowAIAssist: (value: boolean) => void;
  showAIAssistMenu: boolean;
  setShowAIAssistMenu: (value: boolean) => void;
  aiAssistMenuRef: React.RefObject<HTMLDivElement>;
  handleReplyWithAI: (type: string) => void;
  showToneSubmenu: boolean;
  setShowToneSubmenu: (value: boolean) => void;
  showFormattingMenu: boolean;
  setShowFormattingMenu: (value: boolean) => void;
  formattingMenuRef: React.RefObject<HTMLDivElement>;
  requesterEmail?: string;
  showKbArticles: boolean;
  kbArticles: Array<{
    id: string;
    title: string;
    url: string;
  }>;
  setKbArticles: (articles: Array<{
    id: string;
    title: string;
    url: string;
  }>) => void;
}

export function ReplyEditor({
  replyFormRef,
  onClose,
  onSend,
  onSaveDraft,
  showCc,
  setShowCc,
  isAiTyping,
  aiTypingText,
  setAiTypingText,
  replyContent,
  setReplyContent,
  replyContentRef,
  textareaRef,
  setShowAIAssist,
  showAIAssistMenu,
  setShowAIAssistMenu,
  aiAssistMenuRef,
  handleReplyWithAI,
  showToneSubmenu,
  setShowToneSubmenu,
  showFormattingMenu,
  setShowFormattingMenu,
  formattingMenuRef,
  requesterEmail,
  showKbArticles,
  kbArticles,
  setKbArticles
}: ReplyEditorProps) {
  // Recipient chips (To / Cc).
  const [toEmails, setToEmails] = useState<string[]>(['arnav.desai@motadata.com']);
  const [ccEmails, setCcEmails] = useState<string[]>([]);
  const [showAddKbForm, setShowAddKbForm] = useState(false);

  // Selecting text in the rich editor auto-opens the formatting row (no T-toggle click needed);
  // deselecting (collapsed selection / click elsewhere) hides it again — but ONLY when it was
  // auto-opened. A row opened manually via the T toggle stays until toggled off.
  const autoOpenedRef = useRef(false);
  const showFormattingRef = useRef(showFormattingMenu);
  showFormattingRef.current = showFormattingMenu;
  useEffect(() => {
    const onSelectionChange = () => {
      const sel = document.getSelection();
      const el = replyContentRef.current;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [newKbId, setNewKbId] = useState('');
  const [newKbTitle, setNewKbTitle] = useState('');
  const [newKbUrl, setNewKbUrl] = useState('');

  const handleAddKbArticle = () => {
    if (newKbId.trim() && newKbTitle.trim() && newKbUrl.trim()) {
      setKbArticles([...kbArticles, {
        id: newKbId.trim(),
        title: newKbTitle.trim(),
        url: newKbUrl.trim()
      }]);
      setNewKbId('');
      setNewKbTitle('');
      setNewKbUrl('');
      setShowAddKbForm(false);
    }
  };

  return (
    <div 
      className="mt-4 mb-3 border-2 border-[#3D8BD0] rounded-lg overflow-hidden bg-white shadow-sm cursor-pointer" 
      ref={replyFormRef}
      onClick={onClose}
    >
      {/* Reply Header */}
      <div className="bg-[#F9FAFB] px-4 py-3 border-b border-[#DFE5ED] flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-sm font-semibold text-[#364658]">Reply</h3>
        <div className="flex items-center gap-2">
          <button className="text-[#7B8FA5] hover:text-[#364658]">
            <Maximize2 size={16} />
          </button>
          <button className="text-[#7B8FA5] hover:text-[#364658]" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Reply Form Content — formattingMenuRef spans the WHOLE body so selecting text in the
          editor never counts as an "outside click" that would hide the formatting row */}
      <div className="p-4" ref={formattingMenuRef} onClick={(e) => e.stopPropagation()}>
        {/* To Field — chip input (Enter/comma → pill with ×) */}
        <div className="pb-3 border-b border-[#DFE5ED]">
          <div className="flex items-start justify-between gap-2">
            <EmailChips label="To" emails={toEmails} setEmails={setToEmails} />
            <button
              onClick={() => setShowCc(!showCc)}
              className="mt-1 text-xs text-[#7B8FA5] hover:text-[#3D8BD0]"
            >
              Cc
            </button>
          </div>
        </div>

        {/* Cc Field — same chip input */}
        {showCc && (
          <div className="pt-3 pb-3 border-b border-[#DFE5ED]">
            <EmailChips label="Cc" emails={ccEmails} setEmails={setCcEmails} />
          </div>
        )}

        {/* Text Area */}
        <div className="mb-4 mt-4 relative">
          {isAiTyping && aiTypingText === '' && !replyContent && (
            <div className="absolute top-4 left-2 flex items-center gap-2 text-[#3D8BD0] animate-in fade-in duration-300">
              <Sparkles size={16} className="animate-pulse" />
              <span className="text-sm font-medium bg-gradient-to-r from-[#3D8BD0] via-[#6CE5E8] to-[#3D8BD0] bg-[length:200%_100%] animate-[shimmer_2s_ease-in-out_infinite] bg-clip-text text-transparent">
                AI is thinking
              </span>
              <span className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-[#3D8BD0] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-1.5 h-1.5 bg-[#3D8BD0] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-1.5 h-1.5 bg-[#3D8BD0] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </span>
            </div>
          )}
          {replyContent ? (
            <div
              ref={replyContentRef}
              contentEditable
              dir="ltr"
              onInput={(e) => setReplyContent(e.currentTarget.innerHTML)}
              className={`w-full min-h-[256px] cursor-text text-sm text-[#364658] focus:outline-none bg-transparent ${showFormattingMenu ? 'pb-14' : ''}`}
              style={{
                wordBreak: 'break-word',
                whiteSpace: 'pre-wrap'
              }}
            />
          ) : (
            <textarea
              ref={textareaRef}
              value={aiTypingText}
              onChange={(e) => setAiTypingText(e.target.value)}
              placeholder="Press Space to reply using AI assist or Start Typing..."
              className={`w-full ${showKbArticles ? 'h-32' : 'h-64'} text-sm text-[#364658] focus:outline-none bg-transparent resize-none ${showFormattingMenu ? 'pb-14' : ''}`}
              dir="ltr"
              onKeyDown={(e) => {
                if (e.key === ' ' && textareaRef.current?.value === '') {
                  e.preventDefault();
                  setShowAIAssist(true);
                }
              }}
              onSelect={(e) => {
                // Selecting text auto-opens formatting — convert to the rich surface and
                // restore the exact selection so formatting can be applied immediately.
                const t = e.currentTarget;
                if (t.selectionStart === t.selectionEnd || !t.value) return;
                const { selectionStart: s, selectionEnd: en, value } = t;
                const html = value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');
                setReplyContent(html);
                autoOpenedRef.current = true;
                setShowFormattingMenu(true);
                setTimeout(() => {
                  const el = replyContentRef.current;
                  if (el) { el.innerHTML = html; el.focus(); selectPlainRange(el, s, en); }
                }, 0);
              }}
            />
          )}
        </div>

        {/* KB Articles Section */}
        {showKbArticles && aiTypingText && (
          <div className="mb-4 p-3 bg-[#F0F8FF] border border-[#B8DCFF] rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-[#3D8BD0]">Suggested KB Articles</h4>
              {!showAddKbForm && (
                <button
                  onClick={() => setShowAddKbForm(true)}
                  className="flex items-center gap-1 text-xs text-[#3D8BD0] hover:text-[#2E6BA4] font-medium hidden"
                  title="Add KB article"
                >
                  <Plus size={12} />
                  Add
                </button>
              )}
            </div>
            <div className="space-y-1.5">
              {kbArticles.map((article) => (
                <div key={article.id} className="flex items-center gap-2 group">
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs text-[#3D8BD0] hover:text-[#2E6BA4] hover:underline flex-1"
                  >
                    <FileText size={12} className="flex-shrink-0" />
                    <span>{article.title}</span>
                  </a>
                  <button
                    onClick={() => {
                      setKbArticles(kbArticles.filter(kb => kb.id !== article.id));
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-[#B8DCFF] rounded"
                    title="Remove KB article"
                  >
                    <XCircle size={14} className="text-[#3D8BD0]" />
                  </button>
                </div>
              ))}
              {showAddKbForm && (
                <div className="mt-2 p-2 bg-white border border-[#B8DCFF] rounded space-y-2">
                  <input
                    type="text"
                    placeholder="KB ID (e.g., KB-1234)"
                    value={newKbId}
                    onChange={(e) => setNewKbId(e.target.value)}
                    className="w-full px-2 py-1 text-xs border border-[#DFE5ED] rounded focus:outline-none focus:border-[#3D8BD0]"
                  />
                  <input
                    type="text"
                    placeholder="Title (e.g., KB-1234: Troubleshooting Guide)"
                    value={newKbTitle}
                    onChange={(e) => setNewKbTitle(e.target.value)}
                    className="w-full px-2 py-1 text-xs border border-[#DFE5ED] rounded focus:outline-none focus:border-[#3D8BD0]"
                  />
                  <input
                    type="text"
                    placeholder="URL (e.g., https://kb.motadata.com/article/1234)"
                    value={newKbUrl}
                    onChange={(e) => setNewKbUrl(e.target.value)}
                    className="w-full px-2 py-1 text-xs border border-[#DFE5ED] rounded focus:outline-none focus:border-[#3D8BD0]"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddKbArticle}
                      className="flex-1 px-2 py-1 text-xs bg-[#3D8BD0] text-white rounded hover:bg-[#2E6BA4]"
                    >
                      Add Article
                    </button>
                    <button
                      onClick={() => {
                        setShowAddKbForm(false);
                        setNewKbId('');
                        setNewKbTitle('');
                        setNewKbUrl('');
                      }}
                      className="flex-1 px-2 py-1 text-xs bg-[#F3F4F6] text-[#364658] rounded hover:bg-[#E5E7EB]"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Formatting row — revealed by the Text-formatting toggle; FLOATS above the toolbar
            (absolute within this relative wrapper) so the editor height never jumps */}
        <div className="relative">
        {showFormattingMenu && <EditorFormattingRow />}

        {/* Bottom Toolbar */}
        <div className="flex items-center justify-between relative">
          {/* Left Side - AI Assist and Formatting Tools */}
          <div className="flex items-center gap-1">
            {/* AI Assist Button with Dropdown */}
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

              {/* AI Assist Dropdown - Reply Editor */}
              {showAIAssistMenu && (
                <div className="app-menu absolute left-0 bottom-full mb-2 w-[240px] bg-white border border-[#DFE5ED] rounded-lg shadow-lg z-50">
                  <div className="py-2">
                    {/* Generate a reply section */}
                    <div className="px-2 py-1.5 text-[11px] font-medium text-[#7B8FA5]">
                      Generate a reply
                    </div>
                    
                    {/* Acknowledge */}
                    <button 
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#F9FAFB] transition-colors text-left"
                      onClick={() => {
                        setShowAIAssistMenu(false);
                        handleReplyWithAI('Acknowledge');
                      }}
                    >
                      <CheckCircle size={14} className="text-[#364658]" />
                      <span className="text-xs text-[#364658]">Acknowledge</span>
                    </button>
                    
                    {/* Request Additional Details */}
                    <button 
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#F9FAFB] transition-colors text-left"
                      onClick={() => {
                        setShowAIAssistMenu(false);
                        handleReplyWithAI('Request Additional Details');
                      }}
                    >
                      <FileText size={14} className="text-[#364658]" />
                      <span className="text-xs text-[#364658]">Request Additional Details</span>
                    </button>
                    
                    {/* Follow up */}
                    <button 
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#F9FAFB] transition-colors text-left"
                      onClick={() => {
                        setShowAIAssistMenu(false);
                        handleReplyWithAI('Follow up');
                      }}
                    >
                      <Mail size={14} className="text-[#364658]" />
                      <span className="text-xs text-[#364658]">Follow up</span>
                    </button>
                    
                    {/* Request Closure Confirmation */}
                    <button 
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#F9FAFB] transition-colors text-left"
                      onClick={() => {
                        setShowAIAssistMenu(false);
                        handleReplyWithAI('Request Closure\nConfirmation');
                      }}
                    >
                      <XCircle size={14} className="text-[#364658]" />
                      <span className="text-xs text-[#364658]">Request Closure Confirmation</span>
                    </button>

                    {/* Divider */}
                    <div className="my-2 border-t border-[#DFE5ED]"></div>

                    {/* Refine section */}
                    <div className="px-2 py-1.5 text-[11px] font-medium text-[#7B8FA5]">
                      Refine
                    </div>
                    
                    {/* Rephrase */}
                    <button 
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#F9FAFB] transition-colors text-left"
                      onClick={() => setShowAIAssistMenu(false)}
                    >
                      <RefreshCw size={14} className="text-[#364658]" />
                      <span className="text-xs text-[#364658]">Rephrase</span>
                    </button>
                    
                    {/* Make longer */}
                    <button 
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#F9FAFB] transition-colors text-left"
                      onClick={() => setShowAIAssistMenu(false)}
                    >
                      <TextCursorInput size={14} className="text-[#364658]" />
                      <span className="text-xs text-[#364658]">Make longer</span>
                    </button>
                    
                    {/* Make shorter */}
                    <button 
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#F9FAFB] transition-colors text-left"
                      onClick={() => setShowAIAssistMenu(false)}
                    >
                      <Minimize2 size={14} className="text-[#364658]" />
                      <span className="text-xs text-[#364658]">Make shorter</span>
                    </button>
                    
                    {/* Change tone - with submenu */}
                    <div className="relative">
                      <button 
                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#F9FAFB] transition-colors text-left justify-between"
                        onClick={() => setShowToneSubmenu(!showToneSubmenu)}
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

            {/* Quick actions: Template · Knowledge · Attachment · Image · Link · Emoji · Formatting toggle */}
            <EditorQuickActions
              formattingOpen={showFormattingMenu}
              onToggleFormatting={() => {
                // Formatting works on the rich (contentEditable) surface — migrate any plain-textarea
                // text into it the first time the formatting row is opened.
                if (!replyContent) {
                  const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');
                  const html = aiTypingText ? esc(aiTypingText) : '<br>';
                  setReplyContent(html);
                  setTimeout(() => { const el = replyContentRef.current; if (el) { el.innerHTML = html; el.focus(); } }, 0);
                }
                autoOpenedRef.current = false; // manual toggle — selection changes won't auto-hide it
                setShowFormattingMenu(!showFormattingMenu);
              }}
            />
          </div>

          {/* Right Side - Save as Draft + Send (icon-only) */}
          <EditorSendActions onSend={onSend} onSaveDraft={onSaveDraft} />
        </div>
        </div>
      </div>
    </div>
  );
}