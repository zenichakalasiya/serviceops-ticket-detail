/* VENDORED from the upstream prototype (ronak-patel-motadata/ServiceOps-Ticket-Detail-, Oct 2026 sync).
   Used ONLY by the detail pages and listings brought in from upstream — this project's own detail
   pages keep their own version in ../. Do not edit to change our pages; edit ../ instead. */
import { X, Sparkles, ChevronDown, Paperclip, Image, Link2, Smile, Type, CheckCircle, FileText, Mail, XCircle, RefreshCw, TextCursorInput, Minimize2, Wand2, ChevronRight, Briefcase, Heart, Zap } from 'lucide-react';
import { AiSparkle } from './AiSparkle';
import { EditorQuickActions, EditorFormattingRow, EditorSendActions, selectPlainRange } from './EditorToolbar';
import { useState, useRef, useEffect } from 'react';

interface InlineReplyEditorProps {
  replyContent: string;
  onReplyContentChange: (content: string) => void;
  onClose: () => void;
  conversationAuthor: string;
  conversationTime: string;
  conversationText: string;
  onDeleteQuotedText: () => void;
}

export function InlineReplyEditor({
  replyContent,
  onReplyContentChange,
  onClose,
  conversationAuthor,
  conversationTime,
  conversationText,
  onDeleteQuotedText
}: InlineReplyEditorProps) {
  const [showQuotedText, setShowQuotedText] = useState(true);
  const [showFormatting, setShowFormatting] = useState(false);
  // Rich (contentEditable) surface — enabled the first time formatting is opened so the
  // formatting commands have real markup to act on; stays on afterwards.
  const [richMode, setRichMode] = useState(false);
  const richRef = useRef<HTMLDivElement>(null);
  const toggleFormatting = () => {
    if (!richMode) {
      setRichMode(true);
      const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');
      const html = replyContent ? esc(replyContent) : '<br>';
      setTimeout(() => { const el = richRef.current; if (el) { el.innerHTML = html; el.focus(); } }, 0);
    }
    autoOpenedRef.current = false; // manual toggle — selection changes won't auto-hide it
    setShowFormatting((v) => !v);
  };
  const [showAIAssistMenu, setShowAIAssistMenu] = useState(false);
  const [showToneSubmenu, setShowToneSubmenu] = useState(false);
  const [isQuotedContentExpanded, setIsQuotedContentExpanded] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [fullTextToType, setFullTextToType] = useState('');
  const [showFullQuotedMessage, setShowFullQuotedMessage] = useState(false);
  const aiAssistMenuRef = useRef<HTMLDivElement>(null);
  const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const quotedTextRef = useRef<HTMLTextAreaElement>(null);

  // AI Response Templates
  const getAIResponse = (option: string): string => {
    const responses: { [key: string]: string } = {
      'Acknowledge': "Thank you for reaching out to us. We've received your request and our team is reviewing it. We appreciate your patience and will get back to you shortly with an update.",
      'Request Additional Details': "Thank you for contacting us. To better assist you with this issue, could you please provide us with some additional information? Specifically, we would need to know more details about when this issue started occurring and any error messages you may have encountered. This will help us resolve your request more efficiently.",
      'Follow up': "I wanted to follow up on your recent request to ensure everything has been resolved to your satisfaction. If you're still experiencing any issues or have additional questions, please don't hesitate to let us know. We're here to help!",
      'Request Closure\nConfirmation': "We believe we've successfully resolved your issue. Before we close this ticket, could you please confirm that everything is working as expected on your end? If you have any remaining concerns or questions, please let us know and we'll be happy to assist you further."
    };
    return responses[option] || "Thank you for your message. We're looking into this and will get back to you soon.";
  };

  const handleReplyWithAI = (option: string) => {
    setShowAIAssistMenu(false);
    const responseText = getAIResponse(option);
    
    // Start typing animation
    setIsTyping(true);
    setFullTextToType(responseText);
    onReplyContentChange(''); // Clear current content
  };

  // Typing animation effect
  useEffect(() => {
    if (isTyping && fullTextToType) {
      let currentIndex = 0;
      const typingSpeed = 8; // milliseconds per character
      
      typingIntervalRef.current = setInterval(() => {
        currentIndex++;
        
        if (currentIndex <= fullTextToType.length) {
          onReplyContentChange(fullTextToType.substring(0, currentIndex));
        } else {
          // Typing complete
          setIsTyping(false);
          setFullTextToType('');
          
          if (typingIntervalRef.current) {
            clearInterval(typingIntervalRef.current);
            typingIntervalRef.current = null;
          }
        }
      }, typingSpeed);
      
      return () => {
        if (typingIntervalRef.current) {
          clearInterval(typingIntervalRef.current);
          typingIntervalRef.current = null;
        }
      };
    }
  }, [isTyping, fullTextToType, onReplyContentChange]);

  // Click outside handler for AI Assist menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (aiAssistMenuRef.current && !aiAssistMenuRef.current.contains(event.target as Node)) {
        setShowAIAssistMenu(false);
        setShowToneSubmenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // While the AI typing animation streams into `replyContent`, mirror it into the uncontrolled
  // rich surface (no user caret to preserve during the animation).
  useEffect(() => {
    if (richMode && isTyping && richRef.current) richRef.current.innerText = replyContent;
  }, [richMode, isTyping, replyContent]);

  // Selecting text in the rich editor auto-opens the formatting row (no T-toggle click needed);
  // deselecting hides it again — but ONLY when it was auto-opened (a manual T toggle sticks).
  const autoOpenedRef = useRef(false);
  const showFormattingRef = useRef(showFormatting);
  showFormattingRef.current = showFormatting;
  useEffect(() => {
    const onSelectionChange = () => {
      const sel = document.getSelection();
      const el = richRef.current;
      const insideSelection = !!(sel && !sel.isCollapsed && el && sel.anchorNode && el.contains(sel.anchorNode));
      if (insideSelection) {
        if (!showFormattingRef.current) {
          autoOpenedRef.current = true;
          setShowFormatting(true);
        }
      } else if (autoOpenedRef.current && showFormattingRef.current) {
        autoOpenedRef.current = false;
        setShowFormatting(false);
      }
    };
    document.addEventListener('selectionchange', onSelectionChange);
    return () => document.removeEventListener('selectionchange', onSelectionChange);
  }, []);

  // Auto-resize quoted text textarea
  useEffect(() => {
    if (quotedTextRef.current) {
      quotedTextRef.current.style.height = 'auto';
      quotedTextRef.current.style.height = quotedTextRef.current.scrollHeight + 'px';
    }
  }, [conversationText, isQuotedContentExpanded, showFullQuotedMessage]);

  // Function to get truncated or full text
  const getDisplayText = () => {
    if (showFullQuotedMessage) {
      return conversationText;
    }
    // Show only first 150 characters as preview
    const maxLength = 150;
    if (conversationText.length <= maxLength) {
      return conversationText;
    }
    return conversationText.substring(0, maxLength) + '...';
  };

  return (
    <div className="border-2 border-[#3D8BD0] rounded-lg bg-white shadow-sm overflow-visible scroll-mt-0">
      {/* Reply Header */}
      <div className="bg-[#F9FAFB] px-4 py-3 border-b border-[#DFE5ED] flex items-center justify-between rounded-t-lg">
        <h3 className="text-sm font-semibold text-[#364658]\">Reply</h3>
        <button 
          className="text-[#7B8FA5] hover:text-[#364658]" 
          onClick={onClose}
        >
          <X size={16} />
        </button>
      </div>

      {/* Reply Content */}
      <div className="p-4">
        {/* Text Area — swaps to a rich contentEditable once formatting has been used */}
        {richMode ? (
          <div
            ref={richRef}
            contentEditable
            dir="ltr"
            onInput={(e) => onReplyContentChange((e.currentTarget as HTMLElement).innerText)}
            className={`w-full min-h-[128px] cursor-text text-sm text-[#364658] focus:outline-none bg-transparent mb-4 ${showFormatting ? 'pb-14' : ''}`}
            style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}
          />
        ) : (
          <textarea
            value={replyContent}
            onChange={(e) => onReplyContentChange(e.target.value)}
            placeholder="Type your reply..."
            className="w-full h-32 text-sm text-[#364658] focus:outline-none bg-transparent resize-none mb-4"
            dir="ltr"
            onSelect={(e) => {
              // Selecting text auto-opens formatting — convert to the rich surface and
              // restore the exact selection so formatting can be applied immediately.
              const t = e.currentTarget;
              if (t.selectionStart === t.selectionEnd || !t.value) return;
              const { selectionStart: s, selectionEnd: en, value } = t;
              const html = value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');
              setRichMode(true);
              autoOpenedRef.current = true;
              setShowFormatting(true);
              setTimeout(() => {
                const el = richRef.current;
                if (el) { el.innerHTML = html; el.focus(); selectPlainRange(el, s, en); }
              }, 0);
            }}
          />
        )}

        {showQuotedText && (
          <>
            {/* Three Dots Separator */}
            <div className="relative inline-flex mb-2 items-center gap-2">
              <button 
                className="text-xs text-[#3D8BD0] hover:text-[#2E6BA4]"
                onClick={() => setIsQuotedContentExpanded(!isQuotedContentExpanded)}
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
              >
                <span>•••</span>
              </button>
              <div 
                className={`absolute left-0 top-full mt-2 px-3 py-1.5 bg-[#2C3E50] text-white text-xs rounded-md whitespace-nowrap shadow-lg z-50 ${showTooltip ? 'block' : 'hidden'}`}
                style={{ pointerEvents: 'none' }}
              >
                {isQuotedContentExpanded ? 'Hide expanded content' : 'Show trimmed content'}
                <div className="absolute left-4 bottom-full mb-[1px] w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-[#2C3E50]"></div>
              </div>
            </div>

            {/* Old Conversation Text */}
            {isQuotedContentExpanded && (
              <div className="bg-[rgba(223,229,237,0.20)] rounded-lg p-3 mb-4">
                <div className="mb-2 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-[#7B8FA5]">
                      <span className="font-medium">From:</span> {conversationAuthor}
                    </div>
                    <div className="text-xs text-[#7B8FA5]">
                      <span className="font-medium">Date:</span> {conversationTime}
                    </div>
                  </div>
                  <button className="text-[#7B8FA5] hover:text-[#EF4444]" title="Delete" onClick={() => setShowQuotedText(false)}>
                    <X size={16} />
                  </button>
                </div>
                <div 
                  className="text-sm text-[#364658] leading-relaxed overflow-y-auto"
                  style={{ maxHeight: showFullQuotedMessage ? '300px' : 'none' }}
                >
                  {getDisplayText()}{' '}
                  {conversationText.length > 150 && (
                    <button 
                      onClick={() => setShowFullQuotedMessage(!showFullQuotedMessage)}
                      className="text-xs text-[#3D8BD0] hover:text-[#2E6BA4] inline"
                    >
                      {showFullQuotedMessage ? 'View less' : 'View full message'}
                    </button>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* Bottom Toolbar */}
        <div className="flex items-center justify-between mt-4 relative">
          {/* Formatting row — floats above the toolbar so the editor height never jumps */}
          {showFormatting && <EditorFormattingRow />}
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

              {/* AI Assist Dropdown */}
              {showAIAssistMenu && (
                <div className="app-menu absolute left-0 bottom-full mb-2 w-[240px] bg-white border border-[#DFE5ED] rounded-lg shadow-lg z-50 max-h-[400px] overflow-y-auto overflow-x-hidden">
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
                              <Minimize2 size={14} className="text-[#364658]" />
                              <span className="text-xs text-[#364658]">Concise</span>
                            </button>
                            
                            <button 
                              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#F9FAFB] transition-colors text-left"
                              onClick={() => {
                                setShowToneSubmenu(false);
                                setShowAIAssistMenu(false);
                              }}
                            >
                              <Briefcase size={14} className="text-[#364658]" />
                              <span className="text-xs text-[#364658]">Formal</span>
                            </button>
                            
                            <button 
                              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#F9FAFB] transition-colors text-left"
                              onClick={() => {
                                setShowToneSubmenu(false);
                                setShowAIAssistMenu(false);
                              }}
                            >
                              <Smile size={14} className="text-[#364658]" />
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
            <EditorQuickActions formattingOpen={showFormatting} onToggleFormatting={toggleFormatting} />
          </div>

          {/* Right Side - Save as Draft + Send (icon-only) */}
          <EditorSendActions />
        </div>
      </div>
    </div>
  );
}