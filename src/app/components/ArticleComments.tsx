import { useState } from 'react';
import { MessageSquare, X, Trash2, ChevronRight, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Tooltip, TooltipTrigger, TooltipContent } from './ui/tooltip';

/* Reader comments at the foot of a knowledge article.
 *
 * The article page already has Reviews, which are the author's internal feedback loop. These are
 * different: a public thread where readers tell each other what changed since the article was
 * written. The inline section shows the three most recent so the page ends with a conversation
 * rather than a wall, and the full thread opens in a side panel — the same panel treatment
 * Reviews uses, so the two feel like one product. */

export interface ArticleComment {
  id: string;
  author: string;
  initials: string;
  color: string;
  when: string;
  text: string;
  /** Comments the signed-in reader posted can be removed by them. */
  own?: boolean;
}

const AVATAR_COLORS = ['#3D8BD0', '#22A06B', '#F59E0B', '#8B5CF6', '#EC4899', '#0EA5E9', '#EF4444'];

/* A pool of comments that fit any procedural article — the things readers actually leave on a
   knowledge base: confirmation it worked, a step that has drifted out of date, and the missing
   detail that cost them time. */
const COMMENT_POOL: { author: string; when: string; text: string }[] = [
  { author: 'Meera Krishnan', when: '2 days ago', text: 'Followed this end to end and it worked first time. The note about waiting five minutes before signing in elsewhere saved me raising a ticket — I would have assumed it had failed.' },
  { author: 'Tom Whitfield', when: '5 days ago', text: 'Step 3 does not quite match the portal since the June update — the option has moved under Account Help rather than sitting on the landing page. Everything else is still accurate.' },
  { author: 'Ayesha Siddiqui', when: '1 week ago', text: 'Worth flagging that this also applies when you are on the guest network, which is not obvious from the prerequisites.' },
  { author: 'Daniel Okafor', when: '2 weeks ago', text: 'Clear and to the point. The troubleshooting table at the bottom is the most useful part — it answered the exact error I had without me needing to read the rest.' },
  { author: 'Lena Fischer', when: '3 weeks ago', text: 'I skipped the prerequisite at the top and spent twenty minutes on the wrong thing. Reading that section first would have saved the whole detour.' },
  { author: 'Rahul Verma', when: '1 month ago', text: 'Sent this to two people on my team this week instead of answering the same question twice. Please keep it up to date.' },
  { author: 'Sofia Marchetti', when: '1 month ago', text: 'The screenshot is from the previous portal theme, so it looks different now, though the layout is close enough to follow.' },
  { author: 'James Okonkwo', when: '2 months ago', text: 'Could this mention what to do on a Mac? The steps assume Windows and the menus are named differently.' },
];

const hash = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
};

const initialsOf = (name: string) => name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();

/** Deterministic per-article thread, so each article has its own conversation but a given article
 *  always shows the same one. */
export function seedComments(articleId: string): ArticleComment[] {
  const h = hash(articleId || 'kb');
  const count = 3 + (h % 4); // 3–6
  const start = h % COMMENT_POOL.length;
  return Array.from({ length: count }, (_, i) => {
    const src = COMMENT_POOL[(start + i) % COMMENT_POOL.length];
    return {
      id: `${articleId}-c${i}`,
      author: src.author,
      initials: initialsOf(src.author),
      color: AVATAR_COLORS[(h + i) % AVATAR_COLORS.length],
      when: src.when,
      text: src.text,
    };
  });
}

function CommentItem({ c, onDelete }: { c: ArticleComment; onDelete?: (id: string) => void }) {
  return (
    <div className="group/comment">
      <div className="flex items-center gap-2">
        <span className="flex size-6 flex-shrink-0 items-center justify-center rounded text-[10px] font-semibold text-white" style={{ backgroundColor: c.color }}>
          {c.initials}
        </span>
        <span className="text-[13px] font-semibold text-[#1E293B]">{c.author}</span>
        <span className="text-[#CBD5E1]">·</span>
        <span className="text-[12px] text-[#7B8FA5]">{c.when}</span>
        {c.own && (
          <>
            <span className="rounded-sm bg-[#EBF5FF] px-1.5 py-0.5 text-[10px] font-semibold text-[#3D8BD0]">You</span>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onDelete?.(c.id)}
                  className="ml-auto flex size-7 flex-shrink-0 items-center justify-center rounded opacity-0 transition-opacity hover:bg-[#FEF3F2] group-hover/comment:opacity-100"
                >
                  <Trash2 size={14} className="text-[#EF4444]" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Delete</TooltipContent>
            </Tooltip>
          </>
        )}
      </div>
      {/* Indented to the avatar's right edge, so the thread has one clean left margin. The tinted
          block is the same treatment the ticket Conversation tab gives a public reply, so a
          comment reads as the same kind of thing across the product. */}
      <div className="mt-1.5 pl-8">
        <div className="rounded-lg bg-[rgba(223,229,237,0.20)] px-3.5 py-3 text-[13px] leading-relaxed text-[#364658]">
          {c.text}
        </div>
      </div>
    </div>
  );
}

function Composer({ onPost }: { onPost: (text: string) => void }) {
  const [draft, setDraft] = useState('');
  const [open, setOpen] = useState(false);
  const canPost = draft.trim().length > 0;

  return (
    <div className="flex gap-2.5">
      <span className="flex size-6 flex-shrink-0 items-center justify-center rounded bg-[#22A06B] text-[10px] font-semibold text-white">SJ</span>
      <div className="min-w-0 flex-1">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onFocus={() => setOpen(true)}
          rows={open ? 3 : 1}
          placeholder="Add a comment…"
          className="w-full resize-none rounded border border-[#DFE5ED] bg-white px-3 py-2 text-[13px] leading-relaxed text-[#364658] transition-all placeholder:text-[#9CA3AF] focus:border-[#3D8BD0] focus:outline-none focus:ring-1 focus:ring-[#3D8BD0]/30"
        />
        {/* Actions appear once the field is engaged — at rest this is a single quiet line. */}
        {open && (
          <div className="mt-2 flex items-center justify-end gap-2">
            <button
              onClick={() => { setDraft(''); setOpen(false); }}
              className="rounded border border-[#DFE5ED] bg-white px-3 py-1.5 text-[12px] font-medium text-[#364658] transition-colors hover:bg-[#F5F7FA]"
            >
              Cancel
            </button>
            <button
              disabled={!canPost}
              onClick={() => { onPost(draft.trim()); setDraft(''); setOpen(false); }}
              className={`rounded px-3 py-1.5 text-[12px] font-medium text-white transition-colors ${canPost ? 'bg-[#3D8BD0] hover:bg-[#3179B8]' : 'cursor-not-allowed bg-[#C7D5E3]'}`}
            >
              Comment
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* The thread can be OWNED by the page (so the Analytics card can show its count and open the
   same panel) or left to manage itself — pass comments/open to control it. */
export function ArticleComments({ articleId, comments: controlled, onCommentsChange, open: openProp, onOpenChange }: {
  articleId: string;
  comments?: ArticleComment[];
  onCommentsChange?: (next: ArticleComment[]) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [ownComments, setOwnComments] = useState<ArticleComment[]>(() => seedComments(articleId));
  const comments = controlled ?? ownComments;
  const setComments = (update: (prev: ArticleComment[]) => ArticleComment[]) => {
    if (controlled) onCommentsChange?.(update(controlled));
    else setOwnComments(update);
  };
  const [ownShowAll, setOwnShowAll] = useState(false);
  const showAll = openProp ?? ownShowAll;
  const setShowAll = (next: boolean) => { onOpenChange?.(next); if (openProp === undefined) setOwnShowAll(next); };
  const [query, setQuery] = useState('');

  const post = (text: string) => {
    setComments((prev) => [
      { id: 'c-' + Date.now(), author: 'Sarah Johnson', initials: 'SJ', color: '#22A06B', when: 'Just now', text, own: true },
      ...prev,
    ]);
    toast.success('Comment added');
  };

  const remove = (id: string) => {
    setComments((prev) => prev.filter((c) => c.id !== id));
    toast.success('Comment deleted');
  };

  const filtered = query.trim()
    ? comments.filter((c) => (c.text + c.author).toLowerCase().includes(query.trim().toLowerCase()))
    : comments;

  return (
    <section id="art-comments" className="mt-10 scroll-mt-6 border-t border-[#E5E7EB] pt-6">
      <div className="mb-4 flex items-center gap-2">
        <MessageSquare size={16} className="text-[#4A5568]" />
        <h2 className="text-[15px] font-semibold text-[#1E293B]">Comments</h2>
        <span className="inline-flex h-[20px] min-w-[20px] items-center justify-center rounded-full bg-[#EEF2F6] px-1.5 text-[11px] font-semibold text-[#64748B]">
          {comments.length}
        </span>
      </div>

      <Composer onPost={post} />

      {comments.length > 0 && (
        <div className="mt-6 space-y-5">
          {comments.slice(0, 3).map((c) => (
            <CommentItem key={c.id} c={c} onDelete={remove} />
          ))}
        </div>
      )}

      {comments.length > 3 && (
        <button
          onClick={() => setShowAll(true)}
          className="mt-5 inline-flex items-center gap-1 rounded border border-[#DFE5ED] bg-white px-3 py-1.5 text-[12px] font-medium text-[#3D8BD0] transition-colors hover:border-[#3D8BD0] hover:bg-[#F5F9FD]"
        >
          View all {comments.length} comments
          <ChevronRight size={14} />
        </button>
      )}

      {/* Full thread — same right-panel treatment as Reviews on this page. */}
      {showAll && (
        <>
          <div className="fixed inset-0 z-[10000] bg-black/40" onClick={() => setShowAll(false)} />
          <div className="fixed inset-y-0 right-0 z-[10001] flex w-[680px] max-w-[94vw] flex-col bg-white shadow-2xl">
            <div className="flex flex-shrink-0 items-center justify-between border-b border-[#E5E7EB] px-6 py-4">
              <h2 className="text-[16px] font-semibold text-[#364658]">
                Comments <span className="font-normal text-[#7B8FA5]">— {comments.length}</span>
              </h2>
              <button onClick={() => setShowAll(false)} className="flex size-8 items-center justify-center rounded transition-colors hover:bg-[#F3F4F6]">
                <X size={16} className="text-[#64748B]" />
              </button>
            </div>

            <div className="flex-shrink-0 border-b border-[#E5E7EB] px-6 py-3">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search comments"
                  className="h-9 w-full rounded border border-[#DFE5ED] bg-white pl-9 pr-3 text-[13px] text-[#364658] placeholder:text-[#9CA3AF] focus:border-[#3D8BD0] focus:outline-none"
                />
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
              {filtered.length === 0 ? (
                <div className="flex min-h-[280px] items-center justify-center">
                  <div className="text-center">
                    <div className="mb-4 inline-flex size-14 items-center justify-center rounded-full bg-[#F1F5F9]">
                      <MessageSquare className="size-7 text-[#7B8FA5]" />
                    </div>
                    <h3 className="mb-1.5 text-[15px] font-semibold text-[#364658]">
                      {query ? 'No matching comments' : 'No comments yet'}
                    </h3>
                    <p className="mx-auto max-w-[280px] text-[13px] text-[#7B8FA5]">
                      {query ? 'Try a different search term.' : 'Be the first to comment — tell other readers what worked, or what has changed.'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  {filtered.map((c) => (
                    <CommentItem key={c.id} c={c} onDelete={remove} />
                  ))}
                </div>
              )}
            </div>

            <div className="flex-shrink-0 border-t border-[#DFE5ED] p-4">
              <Composer onPost={post} />
            </div>
          </div>
        </>
      )}
    </section>
  );
}
