import { useState, type ReactNode } from 'react';
import { ThumbsUp, ThumbsDown, Play, Maximize2, X, Clock, Folder, Printer, BookOpen, MessageSquare, ChevronRight, ClipboardCheck, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { HeaderCopyButton } from './upstream/HeaderCopyButton';
import { HeaderIdPill } from './HeaderIdPill';
import { Tooltip, TooltipTrigger, TooltipContent } from './ui/tooltip';
import { KB_ARTICLES, fallbackArticle, type Block } from './knowledgeArticleData';
import { KnowledgeAiSummary } from './KnowledgeAiSummary';
import { ArticleComments, type ArticleComment } from './ArticleComments';
import { ArticleToc, type TocSection } from './ArticleToc';

/* Knowledge detail page body — the article itself. The Knowledge page has NO tabs: the full
 * article is the content, ending with the Helpful / Not Helpful feedback controls. */

/* Article content and the per-article AI summaries live in knowledgeArticleData.ts — this file
 * is the renderer for them. */


/* Stand-in video until the product's own is available — Blender's 'Big Buck Bunny', the
 * industry-standard sample clip. Replace this id (or set youtubeId on a block) to use a real one. */
const SAMPLE_VIDEO_ID = 'aqz-KE-bpKQ';

/* YouTube embed with a FACADE: the poster is just the thumbnail image until the reader clicks,
 * then the real iframe mounts with autoplay. Nothing from YouTube loads on page view, so an
 * article with several videos stays fast and no third-party player runs unasked. */
function YouTubeFigure({ id, duration, caption }: { id: string; duration?: string; caption?: string }) {
  const [playing, setPlaying] = useState(false);
  const [thumbFailed, setThumbFailed] = useState(false);
  return (
    <figure className="mb-5 mt-1">
      <div className="relative overflow-hidden rounded-lg border border-[#E5E7EB] bg-[#0F172A]">
        {playing ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`}
            title={caption ?? 'Article video'}
            className="block aspect-video w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        ) : (
          <button
            onClick={() => setPlaying(true)}
            className="group relative block w-full"
            aria-label="Play video"
          >
            {thumbFailed ? (
              /* Offline / blocked thumbnail — fall back to the drawn poster so the layout holds */
              <ScreenshotArt variant="portal" dim />
            ) : (
              <img
                src={`https://img.youtube.com/vi/${id}/maxresdefault.jpg`}
                alt=""
                loading="lazy"
                onError={() => setThumbFailed(true)}
                className="block aspect-video w-full object-cover opacity-90 transition-opacity group-hover:opacity-100"
              />
            )}
            <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <span className="flex h-11 w-16 items-center justify-center rounded-lg bg-[#0F172A]/70 backdrop-blur-sm transition-all group-hover:bg-[#FF0000]">
                <Play size={20} className="ml-0.5 fill-white text-white" />
              </span>
            </span>
            {duration && (
              <span className="pointer-events-none absolute bottom-3 right-3 inline-flex items-center gap-1 rounded bg-[#0F172A]/80 px-2 py-1 text-[11px] font-medium tabular-nums text-white backdrop-blur-sm">
                <Clock size={11} /> {duration}
              </span>
            )}
          </button>
        )}
      </div>
      {caption && <figcaption className="mt-2 text-[12px] leading-relaxed text-[#7B8FA5]">{caption}</figcaption>}
    </figure>
  );
}

/* Inline SVG stand-ins for real media. The prototype ships no binary assets, so screenshots and
 * video posters are drawn — they scale crisply at any width and keep the repo light. */
function ScreenshotArt({ variant = 'client', dim = false }: { variant?: 'client' | 'portal'; dim?: boolean }) {
  return (
    <svg viewBox="0 0 800 450" className="block h-auto w-full" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Application screenshot">
      <rect width="800" height="450" fill="#F1F5F9" />
      {/* App window */}
      <rect x="70" y="52" width="660" height="346" rx="10" fill="#FFFFFF" stroke="#DFE5ED" strokeWidth="1.5" />
      {/* Title bar */}
      <path d="M70 62a10 10 0 0 1 10-10h640a10 10 0 0 1 10 10v28H70z" fill="#F8FAFC" />
      <line x1="70" y1="90" x2="730" y2="90" stroke="#E5E7EB" strokeWidth="1.5" />
      <circle cx="94" cy="71" r="5" fill="#F04438" /><circle cx="112" cy="71" r="5" fill="#F79009" /><circle cx="130" cy="71" r="5" fill="#12B76A" />
      <rect x="152" y="65" width="150" height="12" rx="6" fill="#E2E8F0" />
      {variant === 'client' ? (
        <>
          {/* Connection form */}
          <rect x="110" y="126" width="120" height="10" rx="5" fill="#CBD5E1" />
          <rect x="110" y="146" width="580" height="38" rx="6" fill="#F8FAFC" stroke="#DFE5ED" strokeWidth="1.5" />
          <rect x="126" y="159" width="180" height="12" rx="6" fill="#94A3B8" />
          <rect x="110" y="204" width="90" height="10" rx="5" fill="#CBD5E1" />
          <rect x="110" y="224" width="580" height="38" rx="6" fill="#F8FAFC" stroke="#DFE5ED" strokeWidth="1.5" />
          <rect x="126" y="237" width="230" height="12" rx="6" fill="#94A3B8" />
          {/* Connected status */}
          <rect x="110" y="290" width="216" height="34" rx="17" fill="#ECFDF3" />
          <circle cx="132" cy="307" r="6" fill="#12B76A" />
          <rect x="148" y="301" width="160" height="12" rx="6" fill="#12B76A" opacity="0.55" />
          {/* Primary button */}
          <rect x="560" y="288" width="130" height="38" rx="6" fill="#3D8BD0" />
          <rect x="592" y="302" width="66" height="10" rx="5" fill="#FFFFFF" opacity="0.9" />
        </>
      ) : (
        <>
          {/* Portal: left nav + list rows */}
          <rect x="70" y="90" width="150" height="308" fill="#F8FAFC" />
          <line x1="220" y1="90" x2="220" y2="398" stroke="#E5E7EB" strokeWidth="1.5" />
          {[120, 152, 184, 216, 248].map((y, i) => (
            <g key={y}>
              <rect x="90" y={y} width="16" height="12" rx="3" fill={i === 1 ? '#3D8BD0' : '#CBD5E1'} />
              <rect x="114" y={y + 1} width={i === 1 ? 86 : 74} height="10" rx="5" fill={i === 1 ? '#3D8BD0' : '#CBD5E1'} opacity={i === 1 ? 0.85 : 1} />
            </g>
          ))}
          <rect x="244" y="118" width="462" height="30" rx="6" fill="#F8FAFC" stroke="#DFE5ED" strokeWidth="1.5" />
          {[172, 216, 260, 304, 348].map((y) => (
            <g key={y}>
              <rect x="244" y={y} width="60" height="18" rx="4" fill="#E8F4FD" />
              <rect x="318" y={y + 4} width="210" height="10" rx="5" fill="#CBD5E1" />
              <circle cx="566" cy={y + 9} r="5" fill="#12B76A" />
              <rect x="580" y={y + 4} width="60" height="10" rx="5" fill="#E2E8F0" />
              <line x1="244" y1={y + 32} x2="706" y2={y + 32} stroke="#F0F2F5" strokeWidth="1.5" />
            </g>
          ))}
        </>
      )}
      {dim && <rect width="800" height="450" fill="#0F172A" opacity="0.35" />}
    </svg>
  );
}

/** The authored summary for an article, or a generic one derived from its title. */
export function summarizeArticle(articleId: string, title: string): string[] {
  return (KB_ARTICLES[articleId] ?? fallbackArticle(title)).summary;
}

/** Article metadata for the requester masthead — the byline the reader sees instead of a
 *  product header bar. */
export interface ArticleMasthead {
  author: string;
  /** Already formatted, e.g. "Jul 01, 2026 03:26 PM" — the time of day is stripped for display. */
  created: string | null;
  /** Relative recency, e.g. "1 month ago". */
  ago?: string | null;
  folder?: string | null;
  /** Last edit, e.g. "Jul 30, 2026" — the freshness signal that used to live in Knowledge Properties. */
  updated?: string | null;
  /* Readership, shown as a stat group in the header. These live in the right panel's Analytics
     card today; the requester view is migrating them into the article so the panel can go. */
  totalRead?: number;
  helpful?: number;
  notHelpful?: number;
}

/** Rough reading time, the way every reading app does it: words ÷ 200 wpm, floored at 1 min. */
function readingMinutes(blocks: Block[]) {
  const words = blocks.reduce((n, b) => {
    const text = [b.text ?? '', ...(b.items ?? []), ...(b.rows ?? []).flat(), b.caption ?? ''].join(' ');
    return n + text.trim().split(/\s+/).filter(Boolean).length;
  }, 0);
  return Math.max(1, Math.round(words / 200));
}

export function KnowledgeArticleContent({ articleId, title, centered = false, masthead, showAiSummary = false, review, comments, onCommentsChange, commentsOpen, onCommentsOpenChange }: {
  articleId: string;
  title: string;
  /** Requester preview: portal-style centred reading column. */
  centered?: boolean;
  /** Requester preview: render the title + byline at the top of the column. The technician view
   *  keeps its product header instead, so this is only passed there. */
  masthead?: ArticleMasthead;
  /** Requester preview: the AI summary sits inside the reading column, under the masthead. The
   *  technician view renders its own above this component, with the operational key points the
   *  requester has no tabs for. */
  showAiSummary?: boolean;
  /** Requester preview: the review ASSIGNMENT. A review is requested of named people through the
   *  Review Schedule — it is a task, not open feedback — so this renders as a call to action at
   *  the top of the article rather than a card at the foot of it. The drawer owns the thread and
   *  opens the panel; this only needs what to say and a handler. */
  review?: {
    /** Whether this reader was named as a reviewer on the article's review schedule. */
    assigned: boolean;
    /** Reviews this reader can see — non-zero means they have already written one. */
    count: number;
    /** e.g. "Quarterly" — from the schedule. */
    scheduleType?: string;
    /** Days after the due date before the article is flagged overdue. */
    gracePeriod?: string;
    onOpen: () => void;
  };
  /* The comment thread is owned by the page when the Analytics card has to show its count and
     open the same panel; left out, the comments section manages its own. */
  comments?: ArticleComment[];
  onCommentsChange?: (next: ArticleComment[]) => void;
  commentsOpen?: boolean;
  onCommentsOpenChange?: (open: boolean) => void;
}) {
  const [vote, setVote] = useState<'up' | 'down' | null>(null);
  // Lightbox — images zoom, videos "play" full-bleed. One piece of state serves both.
  const [lightbox, setLightbox] = useState<{ caption?: string; art?: 'client' | 'portal' } | null>(null);
  const blocks: Block[] = (KB_ARTICLES[articleId] ?? fallbackArticle(title)).blocks;

  const castVote = (v: 'up' | 'down') => {
    setVote(v);
    toast.success(v === 'up' ? 'Thanks — glad this was helpful' : 'Thanks — we will review this article');
  };

  /* Reading-column typography. The technician sees the article inside a working record, so it
     keeps the product's 13px UI scale. The requester is here to READ, so the same blocks step up
     to a comfortable body size and looser leading — the single biggest thing that makes a page
     feel like an article rather than a form. */
  const body = centered ? 'text-[15px] leading-[1.75]' : 'text-[13px] leading-relaxed';
  const heading = centered ? 'mb-3 mt-10 text-[20px]' : 'mb-2.5 mt-7 text-[15px]';
  const caption = centered ? 'text-[13px]' : 'text-[12px]';

  // Section rail entries — the article's own headings, in document order, with the discussion
  // pinned at the end so a reader can drop straight into it from anywhere in the article.
  const tocSections: TocSection[] = [
    ...(blocks
      .map((b, i) => (b.kind === 'h' && b.text ? { id: `art-sec-${i}`, text: b.text } : null))
      .filter(Boolean) as TocSection[]),
    { id: 'art-comments', text: 'Comments', kind: 'comments', count: comments?.length },
  ];

  /* Technician view reserves a right gutter (pr-12) for the section rail — its column is
     left-aligned and can run the full drawer width, so in a small drawer the ticks landed on
     the text. The requester column is centered inside generous margins, so px-10 is enough. */
  return (
    <div className={`relative ${centered ? 'px-10 py-10' : 'py-6 pl-6 pr-12'}`}>
      {/* The rail rides a zero-width column spanning the article's full height, so its sticky
          child can park mid-viewport for the whole scroll without reserving any layout width. */}
      <div className="pointer-events-none absolute inset-y-0 right-4 z-20 w-0">
        <div className="pointer-events-auto sticky top-1/2 -translate-y-1/2">
          <ArticleToc sections={tocSections} />
        </div>
      </div>
      <article className={centered ? 'mx-auto max-w-[760px]' : 'max-w-[860px]'}>
        {/* Requester masthead — the article owns its own title and byline, so the reading column
            opens like a published article rather than a record behind a product chrome bar. */}
        {masthead && (() => {
          const initials = masthead.author.split(' ').map((x) => x[0]).join('').slice(0, 2).toUpperCase();
          /* A byline dates an article to the day — the minute it was saved is record-keeping, not
             something a reader needs. Read counts stay in the Analytics card rather than repeating
             here; the masthead answers "who wrote this, when, how long, where it's filed". */
          const date = masthead.created?.replace(/\s+\d{1,2}:\d{2}\s*[AP]M$/i, '') ?? null;
          const meta: ReactNode[] = [];
          if (date) {
            meta.push(
              <>
                {date}
                {masthead.ago && <span className="ml-1 text-[#94A3B8]">({masthead.ago})</span>}
              </>,
            );
          }
          // "Is this still current?" is the question a reader asks before trusting a KB article.
          if (masthead.updated) meta.push(`Updated ${masthead.updated}`);
          meta.push(`${readingMinutes(blocks)} min read`);
          if (masthead.folder) {
            meta.push(
              <span className="inline-flex items-center gap-1">
                <Folder size={12} className="text-[#94A3B8]" />
                {masthead.folder}
              </span>,
            );
          }
          return (
            <header className="mb-9">
              {/* The record id leads, the way an article leads with its section — it is the one
                  identifier a requester quotes back to the service desk, so it stays copyable. */}
              <div className="mb-3">
                <HeaderIdPill id={articleId} />
              </div>
              <h1 className="text-[30px] font-bold leading-[1.22] tracking-[-0.015em] text-[#1E293B]">{title}</h1>
              {/* At 24px the avatar reads as part of the author's NAME line rather than as a
                  block sitting beside two lines, so it pairs with the name and the meta line
                  indents to align under it. */}
              {/* Byline does ONE job: who wrote this, and when. Readership and reader actions
                  used to crowd onto this row too, which made three unrelated things compete for
                  the same line. */}
              <div className="mt-4 flex min-w-0 items-center gap-2">
                <span className="flex size-6 flex-shrink-0 items-center justify-center rounded bg-[#3D8BD0] text-[10px] font-semibold text-white">
                  {initials}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-semibold leading-tight text-[#1E293B]">{masthead.author}</span>
                  <span className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[12px] leading-tight text-[#7B8FA5]">
                    {meta.map((m, i) => (
                      <span key={i} className="inline-flex items-center gap-1.5">
                        {i > 0 && <span className="text-[#CBD5E1]">·</span>}
                        {m}
                      </span>
                    ))}
                  </span>
                </span>
              </div>

              {/* Readership on the left, reader actions on the right, in a rule-bounded strip
                  under the byline — the bar every reading site puts there, and the reason the
                  header reads as three calm rows instead of one crowded one. */}
              <div className="mt-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-y border-[#E5E7EB] py-2.5">
                <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
                  {(() => {
                    const { totalRead, helpful, notHelpful } = masthead;
                    const stats: { key: string; icon: typeof BookOpen; value: number; label: string; color: string; tip: string; onClick?: () => void }[] = [];
                    if (totalRead != null) stats.push({ key: 'read', icon: BookOpen, value: totalRead, label: 'reads', color: '#64748B', tip: `Opened ${totalRead.toLocaleString()} times` });
                    /* Comments sit with readership rather than with the actions: how much discussion
                       an article has drawn is a reading statistic. Unlike the rest it is a way IN to
                       the thread, so it is a button. */
                    if (comments) stats.push({
                      key: 'comments',
                      icon: MessageSquare,
                      value: comments.length,
                      label: comments.length === 1 ? 'comment' : 'comments',
                      color: '#64748B',
                      tip: comments.length ? 'Read the discussion' : 'No comments yet — be the first',
                      onClick: () => onCommentsOpenChange?.(true),
                    });
                    if (helpful != null) stats.push({ key: 'up', icon: ThumbsUp, value: helpful, label: 'helpful', color: '#067647', tip: `${helpful} readers found this helpful` });
                    if (notHelpful != null) stats.push({ key: 'down', icon: ThumbsDown, value: notHelpful, label: 'not helpful', color: '#B42318', tip: `${notHelpful} readers did not find this helpful` });
                    return stats.map((s) => (
                      <Tooltip key={s.key}>
                        <TooltipTrigger asChild>
                          {s.onClick ? (
                            <button
                              onClick={s.onClick}
                              className="group/stat inline-flex items-center gap-1.5 rounded transition-colors hover:text-[#3D8BD0]"
                            >
                              <s.icon size={14} className="flex-shrink-0 text-[#64748B] transition-colors group-hover/stat:text-[#3D8BD0]" />
                              <span className="text-[13px] font-semibold tabular-nums text-[#64748B] transition-colors group-hover/stat:text-[#3D8BD0]">{s.value.toLocaleString()}</span>
                              <span className="text-[12px] text-[#7B8FA5] underline-offset-4 transition-colors group-hover/stat:text-[#3D8BD0] group-hover/stat:underline">{s.label}</span>
                            </button>
                          ) : (
                            <span className="inline-flex cursor-default items-center gap-1.5">
                              <s.icon size={14} style={{ color: s.color }} className="flex-shrink-0" />
                              <span className="text-[13px] font-semibold tabular-nums" style={{ color: s.color }}>{s.value.toLocaleString()}</span>
                              <span className="text-[12px] text-[#7B8FA5]">{s.label}</span>
                            </span>
                          )}
                        </TooltipTrigger>
                        <TooltipContent>{s.tip}</TooltipContent>
                      </Tooltip>
                    ));
                  })()}
                </div>
                <div className="flex flex-shrink-0 items-center gap-2">
                  <HeaderCopyButton variant="link" value={articleId} label="Copy article link" />
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => window.print()}
                        className="inline-flex h-8 w-8 items-center justify-center rounded border border-[#DFE5ED] bg-white transition-colors hover:bg-[#F5F7FA]"
                      >
                        <Printer size={16} className="text-[#6b7280]" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>Print</TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </header>
          );
        })()}

        {/* Review assignment — the article's owner named this reader as a reviewer on its review
            schedule, so this is a task waiting on them. It sits directly under the masthead: at
            the foot of the article it needed a scroll to discover, which is no way to surface
            something somebody is being asked to do. */}
        {review?.assigned && (
          review.count === 0 ? (
            <div className="mb-8 flex flex-wrap items-center gap-3 rounded-lg border border-[#F0DDB4] bg-[#FFFBF2] px-4 py-3">
              <span className="flex size-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#FCEFD5] text-[#B4690E]">
                <ClipboardCheck size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-semibold text-[#7C4A03]">You have been asked to review this article</div>
                <div className="mt-0.5 text-[12px] text-[#A97917]">
                  {[
                    review.scheduleType ? `${review.scheduleType} review` : 'Scheduled review',
                    review.gracePeriod ? `${review.gracePeriod} ${Number(review.gracePeriod) === 1 ? 'day' : 'days'} grace after the due date` : null,
                  ].filter(Boolean).join(' · ')}
                </div>
              </div>
              <button
                onClick={review.onOpen}
                className="inline-flex flex-shrink-0 items-center gap-1.5 rounded bg-[#3D8BD0] px-3.5 py-2 text-[12px] font-medium text-white transition-colors hover:bg-[#3179B8]"
              >
                <MessageSquare size={14} />
                Write a review
              </button>
            </div>
          ) : (
            /* Done — confirm it and get out of the way, but keep a route back to the thread. */
            <button
              onClick={review.onOpen}
              className="mb-8 flex w-full flex-wrap items-center gap-3 rounded-lg border border-[#BFE3D1] bg-[#F2FBF6] px-4 py-3 text-left transition-colors hover:border-[#12B76A]"
            >
              <span className="flex size-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#DCF5E7] text-[#067647]">
                <CheckCircle size={18} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-semibold text-[#065F46]">Thanks — you have reviewed this article</span>
                <span className="mt-0.5 block text-[12px] text-[#4C8A6C]">
                  {review.count} {review.count === 1 ? 'review' : 'reviews'} on this article
                </span>
              </span>
              <ChevronRight size={16} className="flex-shrink-0 text-[#4C8A6C]" />
            </button>
          )
        )}

        {/* Requester summary — the article's own content only. There are no relations, approvals
            or review schedule in this view, so none of the operational key points the technician
            summary carries would mean anything here. */}
        {showAiSummary && (
          <div className="mb-8">
            <KnowledgeAiSummary summary={summarizeArticle(articleId, title)} onDemand />
          </div>
        )}

        {blocks.map((b, i) => {
          switch (b.kind) {
            case 'h':
              // scroll-mt keeps a jumped-to heading off the very top edge of the scroll container.
              return <h2 key={i} id={`art-sec-${i}`} className={`${heading} scroll-mt-6 font-semibold text-[#1E293B] first:mt-0`}>{b.text}</h2>;
            case 'steps':
              return (
                <ol key={i} className={centered ? 'mb-5 space-y-3' : 'mb-4 space-y-2'}>
                  {b.items!.map((it, j) => (
                    <li key={j} className={`flex gap-2.5 ${body} text-[#364658]`}>
                      <span className={`flex flex-shrink-0 items-center justify-center rounded-full bg-[#EBF5FF] font-semibold text-[#3D8BD0] ${centered ? 'mt-[3px] size-[21px] text-[12px]' : 'mt-[1px] size-[18px] text-[11px]'}`}>{j + 1}</span>
                      <span className="min-w-0">{it}</span>
                    </li>
                  ))}
                </ol>
              );
            case 'bullets':
              return (
                <ul key={i} className={centered ? 'mb-5 space-y-2.5' : 'mb-4 space-y-1.5'}>
                  {b.items!.map((it, j) => (
                    <li key={j} className={`flex gap-2.5 ${body} text-[#364658]`}>
                      <span className={`size-1.5 flex-shrink-0 rounded-full bg-[#CBD5E1] ${centered ? 'mt-[10px]' : 'mt-[7px]'}`} />
                      <span className="min-w-0">{it}</span>
                    </li>
                  ))}
                </ul>
              );
            case 'note':
              return (
                <div key={i} className={`rounded border-l-2 border-[#3D8BD0] bg-[#F5F9FD] text-[#364658] ${body} ${centered ? 'mb-5 px-4 py-3.5' : 'mb-4 px-3.5 py-3'}`}>
                  {b.text}
                </div>
              );
            case 'warn':
              return (
                <div key={i} className={`rounded border-l-2 border-[#F59E0B] bg-[#FFFBEB] text-[#7C4A03] ${body} ${centered ? 'mb-5 px-4 py-3.5' : 'mb-4 px-3.5 py-3'}`}>
                  {b.text}
                </div>
              );
            case 'code':
              return (
                <pre key={i} className="mb-4 overflow-x-auto rounded bg-[#1E293B] px-3.5 py-3 font-mono text-[12px] leading-relaxed text-[#E2E8F0]">{b.text}</pre>
              );
            case 'image':
              return (
                <figure key={i} className="mb-5 mt-1">
                  <button
                    onClick={() => setLightbox({ caption: b.caption, art: b.art })}
                    className="group relative block w-full overflow-hidden rounded-lg border border-[#E5E7EB] bg-[#F8FAFC] transition-colors hover:border-[#3D8BD0]"
                    aria-label="Open image"
                  >
                    <ScreenshotArt variant={b.art ?? 'client'} />
                    {/* Zoom affordance — appears on hover so the still stays clean at rest */}
                    <span className="pointer-events-none absolute right-3 top-3 inline-flex items-center gap-1.5 rounded bg-[#0F172A]/75 px-2 py-1 text-[11px] font-medium text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
                      <Maximize2 size={12} /> Click to enlarge
                    </span>
                  </button>
                  {b.caption && <figcaption className={`mt-2 leading-relaxed text-[#7B8FA5] ${caption}`}>{b.caption}</figcaption>}
                </figure>
              );
            case 'video':
              return <YouTubeFigure key={i} id={b.youtubeId ?? SAMPLE_VIDEO_ID} duration={b.duration} caption={b.caption} />;
            case 'table':
              return (
                <div key={i} className="mb-4 overflow-x-auto">
                  <table className="w-full min-w-[520px]">
                    <thead className="border-b border-[#e5e7eb]">
                      <tr>
                        <th className="w-[38%] px-3 py-2 text-left text-[12px] font-semibold tracking-wider text-[#364658]">Message</th>
                        <th className="px-3 py-2 text-left text-[12px] font-semibold tracking-wider text-[#364658]">What to do</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e5e7eb]">
                      {b.rows!.map(([k, v]) => (
                        <tr key={k}>
                          <td className={`px-3 py-2.5 align-top font-medium text-[#364658] ${centered ? 'text-[14px]' : 'text-[13px]'}`}>{k}</td>
                          <td className={`px-3 py-2.5 align-top leading-relaxed text-[#364658] ${centered ? 'text-[14px]' : 'text-[13px]'}`}>{v}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            default:
              return <p key={i} className={`text-[#364658] ${body} ${centered ? 'mb-5' : 'mb-4'}`}>{b.text}</p>;
          }
        })}

        {/* Feedback — closes the article, like the live Knowledge page */}
        <div className="mt-8 border-t border-[#E5E7EB] pt-5">
          <div className="mb-2.5 text-[13px] text-[#7B8FA5]">Was this article helpful?</div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => castVote('up')}
              className={`inline-flex items-center gap-1.5 rounded border px-3.5 py-2 text-[13px] font-medium transition-colors ${
                vote === 'up'
                  ? 'border-[#12B76A] bg-[#ECFDF3] text-[#067647]'
                  : 'border-[#DFE5ED] bg-white text-[#364658] hover:border-[#12B76A] hover:bg-[#ECFDF3] hover:text-[#067647]'
              }`}
            >
              <ThumbsUp size={15} />
              Helpful
            </button>
            <button
              onClick={() => castVote('down')}
              className={`inline-flex items-center gap-1.5 rounded border px-3.5 py-2 text-[13px] font-medium transition-colors ${
                vote === 'down'
                  ? 'border-[#F04438] bg-[#FEF3F2] text-[#B42318]'
                  : 'border-[#DFE5ED] bg-white text-[#364658] hover:border-[#F04438] hover:bg-[#FEF3F2] hover:text-[#B42318]'
              }`}
            >
              <ThumbsDown size={15} />
              Not Helpful
            </button>
            {vote && <span className="text-[12px] text-[#7B8FA5]">Thanks for your feedback.</span>}
          </div>

        </div>

        {/* Reader thread. Sits after the helpful vote, so the page ends: read it, rate it, discuss
            it — each step asking a little more of the reader than the last. */}
        <ArticleComments
          articleId={articleId}
          comments={comments}
          onCommentsChange={onCommentsChange}
          open={commentsOpen}
          onOpenChange={onCommentsOpenChange}
        />
      </article>

      {/* Lightbox — click the backdrop or ✕ to close; Esc-free by design (prototype). */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[10002] flex items-center justify-center bg-black/70 p-6"
          onClick={() => setLightbox(null)}
        >
          <div className="relative w-full max-w-[980px]" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setLightbox(null)}
              className="absolute -top-11 right-0 flex size-8 items-center justify-center rounded text-white/80 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Close"
            >
              <X size={18} />
            </button>
            {/* Images only — video plays inline in its own figure, not here. */}
            <div className="overflow-hidden rounded-lg bg-white shadow-2xl">
              <ScreenshotArt variant={lightbox.art ?? 'client'} />
            </div>
            {lightbox.caption && <div className="mt-3 text-center text-[12px] text-white/80">{lightbox.caption}</div>}
          </div>
        </div>
      )}
    </div>
  );
}
