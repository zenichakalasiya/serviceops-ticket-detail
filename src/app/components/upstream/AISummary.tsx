/* VENDORED from the upstream prototype (ronak-patel-motadata/ServiceOps-Ticket-Detail-, Oct 2026 sync).
   Used ONLY by the detail pages and listings brought in from upstream — this project's own detail
   pages keep their own version in ../. Do not edit to change our pages; edit ../ instead. */
import { Sparkles, MoreVertical, StickyNote, Users, Reply, Forward, Edit, Trash2, ChevronDown, ChevronUp, Check, X, Plus, Bold, Italic, Underline, List, ListOrdered, Link2, Image, Type } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

import { RichTextEditor } from '../RichTextEditor';
import { SummaryStaleNotice } from '../SummaryStaleNotice';

interface AISummaryProps {
  onRegenerate?: () => void;
  onAddAsNote?: (content: string) => void;
  onCollaborate?: (content: string) => void;
  onReply?: (content: string) => void;
  onForward?: (content: string) => void;
  onEdit?: () => void;
  onDelete?: () => void;
  defaultExpanded?: boolean;
}

export function AISummary({
  onRegenerate,
  onAddAsNote,
  onCollaborate,
  onReply,
  onForward,
  onEdit,
  onDelete,
  defaultExpanded = true,
}: AISummaryProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [showMenu, setShowMenu] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  // Conversations have landed since the summary was written; cleared by regenerating.
  const [hasNewConversations, setHasNewConversations] = useState(true);
  const [currentSummaryIndex, setCurrentSummaryIndex] = useState(0);
  const [generatedAt, setGeneratedAt] = useState(new Date());
  const [generatedBy, setGeneratedBy] = useState('Rakesh Rathod');
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  // Different summary variations
  const summaryVariations = [
    {
      text: "The user is experiencing network connectivity issues on their laptop. The ticket describes implementing a remote workflow to refresh network settings, including DNS cache clearing, DHCP lease renewal, and IP stack reset. This is a critical issue affecting the user's ability to access corporate resources.",
      keyPoints: [
        "Network connectivity issue preventing access to corporate resources",
        "Requires DNS cache clearing and DHCP renewal",
        "Remote workflow automation suggested for resolution"
      ]
    },
    {
      text: "This ticket reports intermittent network disconnections affecting the user's laptop. Analysis suggests potential issues with network adapter configuration or DHCP server communication. Recommended actions include network diagnostics, driver updates, and configuration verification.",
      keyPoints: [
        "Intermittent network disconnections observed",
        "Potential network adapter or DHCP configuration issue",
        "Driver updates and diagnostics recommended"
      ]
    },
    {
      text: "User reports inability to connect to corporate network resources. The issue appears to be related to DNS resolution failures and expired DHCP leases. Immediate action required to restore network connectivity through automated workflow or manual intervention.",
      keyPoints: [
        "DNS resolution failures detected",
        "Expired DHCP leases causing connectivity loss",
        "Urgent resolution required for business continuity"
      ]
    }
  ];

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showMenu && menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  const handleRegenerate = () => {
    setIsRegenerating(true);
    if (onRegenerate) {
      onRegenerate();
    }
    // Cycle to next summary variation
    setTimeout(() => {
      setCurrentSummaryIndex((prev) => (prev + 1) % summaryVariations.length);
      setIsRegenerating(false);
      setGeneratedAt(new Date());
      setHasNewConversations(false); // summary now covers the new conversations
    }, 2000);
  };

  const getSummaryContent = () => {
    const summary = summaryVariations[currentSummaryIndex];
    return `<div>${summary.text}</div><div style="margin-top: 12px;"><strong>Key Points:</strong></div><ul style="margin-top: 4px; margin-bottom: 0; padding-left: 20px;">${summary.keyPoints.map(point => `<li style="margin-bottom: 2px;">${point}</li>`).join('')}</ul>`;
  };

  const menuOptions = [
    { 
      icon: StickyNote, 
      label: 'Add as Note', 
      onClick: () => {
        if (onAddAsNote) onAddAsNote(getSummaryContent());
      }
    },
    { 
      icon: Users, 
      label: 'Add as Collaborate', 
      onClick: () => {
        if (onCollaborate) onCollaborate(getSummaryContent());
      }
    },
    { 
      icon: Reply, 
      label: 'Reply', 
      onClick: () => {
        if (onReply) onReply(getSummaryContent());
      }
    },
    { 
      icon: Forward, 
      label: 'Forward', 
      onClick: () => {
        if (onForward) onForward(getSummaryContent());
      }
    },
    { 
      icon: Edit, 
      label: 'Edit', 
      onClick: () => {
        // Combine text and key points into HTML format for editing
        const fullContent = `
          ${summaryVariations[currentSummaryIndex].text}
          <ul>
            ${summaryVariations[currentSummaryIndex].keyPoints.map(point => `<li>- ${point}</li>`).join('')}
          </ul>
        `;
        setEditedContent(fullContent);
        setIsEditing(true);
        if (onEdit) onEdit();
      }
    },
    { icon: Trash2, label: 'Delete', onClick: onDelete, className: 'text-red-600' },
  ];

  const handleSaveEdit = () => {
    // Update the current summary variation with edited content
    summaryVariations[currentSummaryIndex].text = editedContent;
    setIsEditing(false);
    setGeneratedAt(new Date());
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedContent('');
  };

  const suggestedActions = [
    { label: 'Assign to Network Team', icon: Users, color: 'text-[#3D8BD0]' },
    { label: 'Set Priority to High', icon: Sparkles, color: 'text-[#F59E0B]' },
    { label: 'Add Related Article', icon: StickyNote, color: 'text-[#10B981]' },
    { label: 'Schedule Follow-up', icon: Reply, color: 'text-[#8B5CF6]' },
  ];

  // Format date as DD/MM/YYYY HH:MM
  const formatDateTime = (date: Date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  return (
    <div 
      className="px-6 py-3 border-b border-[#E5E7EB] relative z-[1]"
      style={{
        background: 'linear-gradient(265deg, rgba(61, 139, 208, 0.03) 49.27%, rgba(108, 229, 232, 0.03) 55.93%, rgba(28, 229, 177, 0.03) 59.45%)'
      }}
    >
      {/* Header */}
      <div 
        className={`flex items-center justify-between ${isExpanded ? 'mb-3' : ''} cursor-pointer`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <div className="size-6 flex items-center justify-center">
            <Sparkles size={20} className="text-[#3D8BD0] flex-shrink-0" />
          </div>
          <h3 className="text-[14px] font-semibold text-[#364658]">
            {isRegenerating ? 'Generating Summary...' : 'AI Summary'}
          </h3>
        </div>
        <div className="flex items-center gap-1">
          <SummaryStaleNotice
            stale={hasNewConversations}
            regenerating={isRegenerating}
            onRegenerate={() => {
              if (!isExpanded) setIsExpanded(true);
              handleRegenerate();
            }}
          />
          <div className="relative" ref={menuRef}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="p-1.5 hover:bg-white rounded transition-colors"
              title="More options"
            >
              <MoreVertical size={14} className="text-[#7B8FA5]" />
            </button>
            
            {/* Dropdown Menu */}
            {showMenu && (
              <div className="app-menu absolute right-0 top-full mt-1 w-56 bg-white rounded-lg shadow-lg border border-[#DFE5ED] py-1 z-50">
                {menuOptions.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      if (option.onClick) option.onClick();
                      setShowMenu(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-1.5 hover:bg-[#F9FAFB] text-left transition-colors ${option.className || ''}`}
                  >
                    <option.icon size={16} className={option.className || 'text-[#7B8FA5]'} />
                    <span className="text-[13px] text-[#364658]">{option.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="p-1.5 hover:bg-white rounded transition-colors"
          >
            {isExpanded ? (
              <ChevronUp size={16} className="text-[#7B8FA5]" />
            ) : (
              <ChevronDown size={16} className="text-[#7B8FA5]" />
            )}
          </button>
        </div>
      </div>

      {/* Summary Content */}
      {isExpanded && (
        <div className="space-y-3">
          {isRegenerating ? (
            /* Loading State */
            <div className="p-1">
              {/* Animated gradient lines */}
              <div className="space-y-3">
                <div className="h-2 rounded-full overflow-hidden relative" style={{ background: 'linear-gradient(90deg, rgba(61,139,208,0.1) 0%, rgba(108,229,232,0.2) 50%, rgba(28,229,177,0.1) 100%)' }}>
                  <div 
                    className="absolute inset-0"
                    style={{
                      background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)',
                      backgroundSize: '200% 100%',
                      animation: 'shimmer 2s infinite',
                    }}
                  />
                </div>
                <div className="h-2 rounded-full overflow-hidden relative w-3/4" style={{ background: 'linear-gradient(90deg, rgba(61,139,208,0.1) 0%, rgba(108,229,232,0.2) 50%, rgba(28,229,177,0.1) 100%)' }}>
                  <div 
                    className="absolute inset-0"
                    style={{
                      background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)',
                      backgroundSize: '200% 100%',
                      animation: 'shimmer 2s infinite 0.3s',
                    }}
                  />
                </div>
              </div>
            </div>
          ) : (
            /* Summary Text */
            <div className="p-1">
              {isEditing ? (
                <RichTextEditor
                  content={editedContent}
                  onChange={(value) => setEditedContent(value)}
                  onSave={handleSaveEdit}
                  onCancel={handleCancelEdit}
                />
              ) : (
                <div>
                  <p className="text-[13px] text-[#364658] leading-relaxed mb-3">
                    {summaryVariations[currentSummaryIndex].text}
                  </p>

                  {/* Key Points */}
                  <div className="space-y-2">
                    <h4 className="text-[12px] font-semibold text-[#7B8FA5] uppercase tracking-wide">
                      Key Points
                    </h4>
                    <ul className="space-y-1.5">
                      {summaryVariations[currentSummaryIndex].keyPoints.map((point, index) => (
                        <li key={index} className="flex items-start gap-2 text-[13px] text-[#364658]">
                          <span className="size-1.5 rounded-full bg-[#3D8BD0] mt-1.5 flex-shrink-0"></span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}

                   {/* Footer */}
          {!isRegenerating && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-[#9CA3AF] text-[11px]">
                Generated by <span className="text-[#3D8BD0]">{generatedBy}</span> at {formatDateTime(generatedAt)}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}