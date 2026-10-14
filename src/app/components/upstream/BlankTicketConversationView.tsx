/* VENDORED from the upstream prototype (ronak-patel-motadata/ServiceOps-Ticket-Detail-, Oct 2026 sync).
   Used ONLY by the detail pages and listings brought in from upstream — this project's own detail
   pages keep their own version in ../. Do not edit to change our pages; edit ../ instead. */
import { Search, Filter, ArrowUpDown, X, Reply, Forward, Trash2, FileText, Lock } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';

interface Conversation {
  id: string;
  ticketId: string;
  author: string;
  authorInitials: string;
  authorColor: string;
  timestamp: Date;
  content: string;
  type?: 'reply' | 'note' | 'collaborate';
  to?: string;
  cc?: string;
  kbArticles?: Array<{
    id: string;
    title: string;
    url: string;
  }>;
}

interface BlankTicketConversationViewProps {
  conversations: Conversation[];
  activeConversationTab: 'all' | 'technician';
  setActiveConversationTab: (tab: 'all' | 'technician') => void;
  showSubTabSearch: boolean;
  setShowSubTabSearch: (show: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isSortedFromTop: boolean;
  setIsSortedFromTop: (sorted: boolean) => void;
  onDelete: (id: string) => void;
  setShowReplyEditor: (show: boolean) => void;
  setShowForwardEditor: (show: boolean) => void;
  setShowCollaborateEditor: (show: boolean) => void;
  setShowNoteEditor: (show: boolean) => void;
  getRelativeTime: (date: Date) => string;
  formatFullDate: (date: Date) => string;
}

export function BlankTicketConversationView({
  conversations,
  activeConversationTab,
  setActiveConversationTab,
  showSubTabSearch,
  setShowSubTabSearch,
  searchQuery,
  setSearchQuery,
  isSortedFromTop,
  setIsSortedFromTop,
  onDelete,
  setShowReplyEditor,
  setShowForwardEditor,
  getRelativeTime,
  formatFullDate
}: BlankTicketConversationViewProps) {
  return (
    <div className="space-y-4">
      <div className="sticky top-[48px] z-10 -mx-6 mb-6 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 bg-white px-6 py-3">
        <div className="flex gap-2 flex-shrink-0 whitespace-nowrap">
          <button 
            className={`text-[14px] font-medium px-3 py-1.5 rounded ${activeConversationTab === 'all' ? 'bg-[#f1f5f9] text-[#334155]' : 'text-[#6b7280] hover:text-[#364658]'}`}
            onClick={() => setActiveConversationTab('all')}
          >
            All Activities
          </button>
          <button 
            className={`text-[14px] font-medium px-3 py-1.5 rounded ${activeConversationTab === 'technician' ? 'bg-[#f1f5f9] text-[#334155]' : 'text-[#6b7280] hover:text-[#364658]'}`}
            onClick={() => setActiveConversationTab('technician')}
          >
            Technician
          </button>
        </div>
        <div className="flex items-center gap-2 relative">
          {!showSubTabSearch ? (
            <button 
              className="p-1.5 hover:bg-[#f9fafb] rounded"
              onClick={() => setShowSubTabSearch(true)}
            >
              <Search size={16} className="text-[#6b7280]" />
            </button>
          ) : (
            <div className="flex h-9 w-[280px] min-w-[180px] max-w-full items-center gap-2 rounded border border-[#DFE5ED] bg-white px-3">
              <Search className="w-4 h-4 text-[#7B8FA5]" />
              <input
                type="text"
                placeholder="Search Conversation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="outline-none text-xs bg-transparent placeholder:text-[#7B8FA5] text-[#364658] flex-1 min-w-0"
                autoFocus
              />
              <button 
                className="p-0.5 hover:bg-[#F5F7FA] rounded transition-colors"
                onClick={() => {
                  setShowSubTabSearch(false);
                  setSearchQuery('');
                }}
              >
                <X className="w-3.5 h-3.5 text-[#7B8FA5]" />
              </button>
            </div>
          )}
          <button className="p-1.5 hover:bg-[#f9fafb] rounded">
            <Filter size={16} className="text-[#6b7280]" />
          </button>
          <button 
            className="p-1.5 hover:bg-[#f9fafb] rounded"
            onClick={() => setIsSortedFromTop(!isSortedFromTop)}
            title={isSortedFromTop ? 'Sort from bottom' : 'Sort from top'}
          >
            <ArrowUpDown size={16} className="text-[#6b7280]" />
          </button>
        </div>
      </div>

      {/* Only show sent conversations for blank tickets */}
      <div className={`${isSortedFromTop ? 'flex flex-col-reverse' : ''}`}>
        {conversations.map((conversation) => (
          <div key={conversation.id} className="flex gap-3 group relative">
            <div className="flex flex-col items-center">
              <div
                className="size-[24px] rounded flex items-center justify-center text-white text-xs font-semibold flex-shrink-0"
                style={{ backgroundColor: conversation.authorColor }}
              >
                {conversation.authorInitials}
              </div>
            </div>
            <div className="flex-1 pb-6">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-semibold text-[#364658]">{conversation.author}</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-xs text-[#7B8FA5] cursor-help">{getRelativeTime(conversation.timestamp)}</span>
                  </TooltipTrigger>
                  <TooltipContent>
                    {formatFullDate(conversation.timestamp)}
                  </TooltipContent>
                </Tooltip>
                {conversation.type === 'note' && (
                  <>
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-[rgba(200,66,53,0.05)] text-[#C84235] text-xs rounded font-medium">
                      <FileText className="size-3" />
                      Note
                    </span>
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
                  </>
                )}
                {conversation.type === 'collaborate' && (
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
              </div>
              {conversation.type === 'reply' && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="text-xs text-[#7B8FA5] mb-1 cursor-help pr-24">
                      <div>Replied to {conversation.to}{conversation.cc ? `, Cc: ${conversation.cc},...` : ''}</div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-xs">
                      <div className="mb-2">
                        <div className="font-medium">To: {conversation.to}</div>
                      </div>
                      {conversation.cc && (
                        <div>
                          <div className="font-medium">Cc: {conversation.cc}</div>
                        </div>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              )}
              <div className={`rounded-lg p-4 mt-2 ${
                conversation.type === 'note' || conversation.type === 'collaborate'
                  ? 'bg-[rgba(245,133,24,0.10)] border-l-2 border-[#F58518]'
                  : 'bg-[rgba(223,229,237,0.20)]'
              }`}>
                <div className="text-sm text-[#364658] leading-relaxed whitespace-pre-wrap">
                  {conversation.content}
                </div>
                {conversation.kbArticles && conversation.kbArticles.length > 0 && (
                  <div className="mt-3 p-3 bg-[#F0F8FF] border border-[#B8DCFF] rounded-lg">
                    <h4 className="text-xs font-semibold text-[#3D8BD0] mb-2">Suggested KB Articles</h4>
                    <div className="space-y-1.5">
                      {conversation.kbArticles.map((article) => (
                        <a
                          key={article.id}
                          href={article.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-xs text-[#3D8BD0] hover:text-[#2E6BA4] hover:underline"
                        >
                          <FileText size={12} className="flex-shrink-0" />
                          <span>{article.title}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Hover Actions */}
            <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
              <button
                className="p-1.5 hover:bg-[#F3F4F6] rounded"
                title="Reply"
                onClick={() => {
                  setShowReplyEditor(true);
                }}
              >
                <Reply className="size-4 text-[#7B8FA5]" />
              </button>
              <button
                className="p-1.5 hover:bg-[#F3F4F6] rounded"
                title="Forward"
                onClick={() => {
                  setShowForwardEditor(true);
                }}
              >
                <Forward className="size-4 text-[#7B8FA5]" />
              </button>
              <button
                className="p-1.5 hover:bg-[#F3F4F6] rounded"
                title="Delete"
                onClick={() => onDelete(conversation.id)}
              >
                <Trash2 className="size-4 text-[#EF4444]" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
