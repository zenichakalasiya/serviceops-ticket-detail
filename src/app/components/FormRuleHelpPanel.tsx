import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle, ArrowLeft, ArrowRight, Briefcase, Check, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, CirclePlay, Clock,
  EyeOff, Filter, HelpCircle, Layers, LifeBuoy, Lightbulb, ListFilter, ListOrdered, Lock, MousePointerClick, RefreshCw, Rocket,
  Search, ThumbsDown, ThumbsUp, Users, Wrench, X, XCircle, Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { toast } from 'sonner';
import { HELP_ARTICLES, HELP_GROUPS, articleText } from './formRuleHelpContent';
import type { Block, HelpArticle, HelpOption, MockField } from './formRuleHelpContent';

/**
 * V3's right panel — the DETAILED Help guide (Zeni, 9 Oct 2026). Lots of information, kept easy to
 * read by never showing it all at once:
 *
 *  - HOME is a short topic list in five groups (Start here · Building blocks · Real scenarios ·
 *    Get it right · Troubleshooting) — a title and one line each, so it scans in seconds.
 *  - A topic opens as an ARTICLE in the same panel (back arrow, no tabs): intro, "On this page"
 *    chips, then typed blocks, each drawn the way it reads best — a before/after picture of the
 *    form for every action and event, a rule read-out in the builder's When / If / Then order,
 *    do/don't pairs, a tickable troubleshooting checklist. Previous / next at the foot.
 *  - SEARCH reads every word of every article and lists the matches with a snippet.
 *  - The rule check rides at the top: two small cards (conflicts · similar rules) that open their
 *    drawers, shown only when something is found.
 *
 * Content lives in formRuleHelpContent.ts as data.
 */

const ICONS: Record<string, LucideIcon> = {
  rocket: Rocket, layers: Layers, zap: Zap, refresh: RefreshCw, users: Users, filter: Filter, list: ListFilter,
  pointer: MousePointerClick, briefcase: Briefcase, check: CheckCircle2, order: ListOrdered, alert: AlertTriangle,
  lifebuoy: LifeBuoy, wrench: Wrench, help: HelpCircle,
};

/** `**bold**` → <b>. */
const rich = (s: string) => s.split('**').map((p, i) => (i % 2 ? <b key={i} className="font-semibold text-[#1D2A3E]">{p}</b> : p));

/**
 * The detailed doc guide for Form Rules — search, a topic list, and each topic as its own page.
 * Lives in the GLOBAL Help guide popup (header ⓘ), which opens it for the module you are on; the
 * editor's right panel carries the lighter Help Card instead (FormRuleHelpCard).
 */
export function HelpDocGuide({ onWatch, start = null }: { onWatch?: () => void; start?: string | null }) {
  const [articleId, setArticleId] = useState<string | null>(start);
  const [q, setQ] = useState('');
  const scroller = useRef<HTMLDivElement>(null);
  const article = HELP_ARTICLES.find((a) => a.id === articleId) ?? null;
  const query = q.trim().toLowerCase();

  const open = (id: string | null) => { setArticleId(id); setQ(''); };
  useEffect(() => { setArticleId(start); }, [start]);
  useEffect(() => { scroller.current?.scrollTo({ top: 0 }); }, [articleId]);

  const results = useMemo(() => (query ? HELP_ARTICLES.map((a) => {
    const text = articleText(a);
    const i = text.toLowerCase().indexOf(query);
    if (i < 0) return null;
    const from = Math.max(0, i - 40);
    return { a, snip: (from ? '…' : '') + text.slice(from, i + query.length + 70) + '…', at: i - from + (from ? 1 : 0) };
  }).filter(Boolean) as { a: HelpArticle; snip: string; at: number }[] : []), [query]);

  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <div className="flex-shrink-0 border-b border-[#EEF2F6] px-4 pb-3 pt-3">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#98A2B3]" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search help — e.g. hide, mandatory, not working"
            className="h-8 w-full rounded border border-[#DFE5ED] bg-white pl-8 pr-8 text-[12.5px] text-[#364658] placeholder:text-[#98A2B3] focus:border-[#3D8BD0] focus:outline-none focus:ring-1 focus:ring-[#3D8BD0]" />
          {q && (
            <button type="button" onClick={() => setQ('')} aria-label="Clear search"
              className="absolute right-1 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded text-[#98A2B3] hover:bg-[#F3F4F6]"><X size={13} /></button>
          )}
        </div>
      </div>
      <div ref={scroller} className="relative min-h-0 flex-1 overflow-y-auto">
        {query ? <SearchResults q={q} results={results} onOpen={open} />
          : article ? <ArticleView a={article} onBack={() => open(null)} onOpen={open} scroller={scroller} />
            : <Home onOpen={open} onWatch={onWatch} />}
      </div>
    </div>
  );
}

/* ── home ─────────────────────────────────────────────────────────────────────────────────────── */

function Home({ onOpen, onWatch }: { onOpen: (id: string) => void; onWatch?: () => void }) {
  const first = HELP_ARTICLES.find((a) => a.id === 'first')!;
  return (
    <div className="px-4 pb-6 pt-4">
      {/* The one place to start — bigger than everything else on the page. */}
      <div className="rounded-xl border border-[#D6E6F5] bg-[#F3F8FD] p-4">
        <div className="flex items-start gap-3">
          <span className="flex size-10 flex-shrink-0 items-center justify-center rounded-lg bg-white text-[#3D8BD0] shadow-sm"><Rocket size={19} /></span>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-[#3D8BD0]">Start here</div>
            <div className="mt-0.5 text-[15px] font-semibold text-[#1D2A3E]">{first.title}</div>
            <p className="mt-1 text-[12.5px] leading-[1.5] text-[#475569]">Nine short steps from a blank rule to one that works — with a real example you can copy.</p>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <button type="button" onClick={() => onOpen('first')}
            className="inline-flex h-8 items-center gap-1.5 rounded bg-[#3D8BD0] px-3 text-[12.5px] font-medium text-white transition-colors hover:bg-[#2D6CA0]">
            Read the guide <ArrowRight size={14} />
          </button>
          {onWatch && <button type="button" onClick={onWatch}
            className="inline-flex h-8 items-center gap-1.5 rounded border border-[#3D8BD0] bg-white px-3 text-[12.5px] font-medium text-[#3D8BD0] transition-colors hover:bg-[#EBF5FF]">
            <CirclePlay size={14} /> Watch in 1 min
          </button>}
          <span className="ml-auto inline-flex items-center gap-1 text-[11.5px] text-[#7B8FA5]"><Clock size={12} /> {first.mins} min read</span>
        </div>
      </div>

      {HELP_GROUPS.map((g) => {
        const items = HELP_ARTICLES.filter((a) => a.group === g && a.id !== 'first');
        if (!items.length) return null;
        return (
          <section key={g} className="mt-5">
            <div className="mb-1.5 flex items-baseline gap-2 px-1">
              <h3 className="text-[11px] font-semibold uppercase tracking-wide text-[#7B8FA5]">{g}</h3>
              <span className="text-[11px] text-[#B0BCCB]">{items.length}</span>
            </div>
            <ul className="divide-y divide-[#EEF2F6] overflow-hidden rounded-lg border border-[#E8EDF3]">
              {items.map((a) => {
                const I = ICONS[a.icon] ?? HelpCircle;
                return (
                  <li key={a.id}>
                    <button type="button" onClick={() => onOpen(a.id)}
                      className="group flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-[#F8FAFC]">
                      <span className="flex size-8 flex-shrink-0 items-center justify-center rounded-md bg-[#F1F5F9] text-[#475569] transition-colors group-hover:bg-[#EBF5FF] group-hover:text-[#3D8BD0]"><I size={15} /></span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-medium text-[#1D2A3E]">{a.title}</span>
                        <span className="block truncate text-[12px] text-[#7B8FA5]">{a.sub}</span>
                      </span>
                      <span className="flex-shrink-0 text-[11px] text-[#98A2B3]">{a.mins} min</span>
                      <ChevronRight size={15} className="flex-shrink-0 text-[#B0BCCB] transition-transform group-hover:translate-x-0.5 group-hover:text-[#3D8BD0]" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

function SearchResults({ q, results, onOpen }: { q: string; results: { a: HelpArticle; snip: string; at: number }[]; onOpen: (id: string) => void }) {
  if (!results.length) {
    return <div className="px-6 py-12 text-center text-[13px] text-[#7B8FA5]">Nothing matches “{q}”. Try <b className="font-medium text-[#364658]">hide</b>, <b className="font-medium text-[#364658]">mandatory</b> or <b className="font-medium text-[#364658]">not working</b>.</div>;
  }
  const n = q.trim().length;
  return (
    <div className="px-4 pb-6 pt-3">
      <div className="mb-2 px-1 text-[12px] text-[#7B8FA5]">{results.length} topic{results.length === 1 ? '' : 's'} mention “{q.trim()}”</div>
      <ul className="flex flex-col gap-2">
        {results.map(({ a, snip, at }) => (
          <li key={a.id}>
            <button type="button" onClick={() => onOpen(a.id)} className="w-full rounded-lg border border-[#E8EDF3] px-3 py-2.5 text-left transition-colors hover:border-[#9FC3E6] hover:bg-[#F8FAFC]">
              <div className="text-[11px] text-[#7B8FA5]">{a.group}</div>
              <div className="text-[13px] font-semibold text-[#1D2A3E]">{a.title}</div>
              <p className="mt-1 text-[12px] leading-[1.5] text-[#475569]">
                {snip.slice(0, at)}<mark className="rounded-sm bg-[#FEF3C7] px-0.5 text-[#1D2A3E]">{snip.slice(at, at + n)}</mark>{snip.slice(at + n)}
              </p>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ── an article ───────────────────────────────────────────────────────────────────────────────── */

function ArticleView({ a, onBack, onOpen, scroller }: { a: HelpArticle; onBack: () => void; onOpen: (id: string) => void; scroller: React.RefObject<HTMLDivElement | null> }) {
  const i = HELP_ARTICLES.indexOf(a);
  const prev = HELP_ARTICLES[i - 1];
  const next = HELP_ARTICLES[i + 1];
  const heads = a.blocks.filter((b) => b.t === 'h') as { t: 'h'; text: string }[];
  const [voted, setVoted] = useState<null | 'up' | 'down'>(null);
  useEffect(() => setVoted(null), [a.id]);
  const goTo = (text: string) => {
    const el = scroller.current?.querySelector('[data-h="' + CSS.escape(text) + '"]') as HTMLElement | null;
    if (el && scroller.current) scroller.current.scrollTo({ top: el.offsetTop - 12, behavior: 'smooth' });
  };
  const I = ICONS[a.icon] ?? HelpCircle;
  return (
    <article className="px-4 pb-6 pt-3">
      <button type="button" onClick={onBack} className="-ml-1 inline-flex h-7 items-center gap-1 rounded px-1 text-[12.5px] font-medium text-[#3D8BD0] hover:bg-[#EBF5FF]">
        <ArrowLeft size={14} /> All topics
      </button>
      <div className="mt-3 flex items-start gap-3">
        <span className="flex size-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#EBF5FF] text-[#3D8BD0]"><I size={17} /></span>
        <div className="min-w-0">
          <div className="text-[11px] text-[#7B8FA5]">{a.group} · {a.mins} min read</div>
          <h2 className="text-[18px] font-semibold leading-tight text-[#1D2A3E]">{a.title}</h2>
        </div>
      </div>
      <p className="mt-3 text-[13px] leading-[1.6] text-[#475569]">{rich(a.intro)}</p>

      {heads.length >= 2 && (
        <div className="mt-3 rounded-lg bg-[#F8FAFC] px-3 py-2.5">
          <div className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-[#7B8FA5]">On this page</div>
          <div className="flex flex-wrap gap-1.5">
            {heads.map((h) => (
              <button key={h.text} type="button" onClick={() => goTo(h.text)}
                className="rounded-full border border-[#E2E8F0] bg-white px-2.5 py-0.5 text-[11.5px] text-[#475569] transition-colors hover:border-[#3D8BD0] hover:text-[#3D8BD0]">{h.text}</button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-col gap-4">
        {a.blocks.map((b, k) => <BlockView key={k} b={b} />)}
      </div>

      <div className="mt-6 flex items-center gap-2 border-t border-[#EEF2F6] pt-4">
        <span className="text-[12.5px] text-[#475569]">{voted ? 'Thanks for telling us.' : 'Was this helpful?'}</span>
        {!voted && (<>
          <button type="button" onClick={() => { setVoted('up'); toast.success('Thanks — glad it helped'); }} aria-label="Yes"
            className="flex size-7 items-center justify-center rounded border border-[#DFE5ED] text-[#64748B] hover:border-[#3D8BD0] hover:text-[#3D8BD0]"><ThumbsUp size={13} /></button>
          <button type="button" onClick={() => { setVoted('down'); toast.success('Thanks — we will improve this topic'); }} aria-label="No"
            className="flex size-7 items-center justify-center rounded border border-[#DFE5ED] text-[#64748B] hover:border-[#3D8BD0] hover:text-[#3D8BD0]"><ThumbsDown size={13} /></button>
        </>)}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {prev ? (
          <button type="button" onClick={() => onOpen(prev.id)} className="rounded-lg border border-[#E8EDF3] px-3 py-2 text-left transition-colors hover:border-[#9FC3E6]">
            <div className="flex items-center gap-1 text-[11px] text-[#7B8FA5]"><ChevronLeft size={12} /> Previous</div>
            <div className="truncate text-[12.5px] font-medium text-[#1D2A3E]">{prev.title}</div>
          </button>
        ) : <span />}
        {next && (
          <button type="button" onClick={() => onOpen(next.id)} className="rounded-lg border border-[#E8EDF3] px-3 py-2 text-right transition-colors hover:border-[#9FC3E6]">
            <div className="flex items-center justify-end gap-1 text-[11px] text-[#7B8FA5]">Next <ChevronRight size={12} /></div>
            <div className="truncate text-[12.5px] font-medium text-[#1D2A3E]">{next.title}</div>
          </button>
        )}
      </div>
    </article>
  );
}

function BlockView({ b }: { b: Block }) {
  switch (b.t) {
    case 'h': return <h3 data-h={b.text} className="-mb-1 mt-1 text-[14px] font-semibold text-[#1D2A3E]">{b.text}</h3>;
    case 'p': return <p className="text-[13px] leading-[1.6] text-[#475569]">{rich(b.text)}</p>;
    case 'steps': return <Steps items={b.items} />;
    case 'options': return <div className="flex flex-col gap-2.5">{b.items.map((o) => <OptionCard key={o.name} o={o} />)}</div>;
    case 'rule': return <RuleReadout b={b} />;
    case 'form': return <FormPair caption={b.caption} trigger={b.trigger} before={b.before} after={b.after} />;
    case 'callout': return <Callout tone={b.tone} text={b.text} />;
    case 'dodont': return <DoDont dos={b.dos} donts={b.donts} />;
    case 'check': return <Checklist items={b.items} />;
    case 'table': return <OperatorTable rows={b.rows} />;
    case 'faq': return <Faq items={b.items} />;
  }
}

function Steps({ items }: { items: { title: string; text: string }[] }) {
  return (
    <ol className="flex flex-col">
      {items.map((s, i) => (
        <li key={s.title} className="relative flex gap-3">
          {i < items.length - 1 && <span className="absolute bottom-0 left-[11px] top-7 w-px bg-[#E2E8F0]" />}
          <span className="relative z-[1] mt-0.5 flex size-[23px] flex-shrink-0 items-center justify-center rounded-full border border-[#DFE5ED] bg-white text-[11.5px] font-semibold text-[#364658]">{i + 1}</span>
          <div className={'min-w-0 flex-1 ' + (i < items.length - 1 ? 'pb-3.5' : '')}>
            <div className="text-[13px] font-semibold text-[#1D2A3E]">{s.title}</div>
            <div className="mt-0.5 text-[12.5px] leading-[1.55] text-[#475569]">{rich(s.text)}</div>
          </div>
        </li>
      ))}
    </ol>
  );
}

function OptionCard({ o }: { o: HelpOption }) {
  return (
    <div className="rounded-lg border border-[#E8EDF3] p-3">
      <div className="text-[13.5px] font-semibold text-[#1D2A3E]">{o.name}</div>
      <p className="mt-0.5 text-[12.5px] leading-[1.55] text-[#475569]">{rich(o.what)}</p>
      <div className="mt-2 flex gap-2 text-[12px] leading-[1.5]">
        <span className="w-[62px] flex-shrink-0 text-[11px] font-semibold uppercase tracking-wide text-[#7B8FA5]">Use when</span>
        <span className="min-w-0 text-[#364658]">{rich(o.when)}</span>
      </div>
      {o.example && (
        <div className="mt-1 flex gap-2 text-[12px] leading-[1.5]">
          <span className="w-[62px] flex-shrink-0 text-[11px] font-semibold uppercase tracking-wide text-[#7B8FA5]">Example</span>
          <span className="min-w-0 text-[#364658]">{rich(o.example)}</span>
        </div>
      )}
      {o.before && o.after && <div className="mt-2.5"><FormPair trigger={o.trigger} before={o.before} after={o.after} /></div>}
    </div>
  );
}

/** A rule written the way the builder lays it out — When, If, Then — with the builder's step colours as dots. */
function RuleReadout({ b }: { b: Extract<Block, { t: 'rule' }> }) {
  const row = (label: string, dot: string, body: React.ReactNode) => (
    <div className="flex gap-3 px-3 py-2">
      <span className="flex w-[52px] flex-shrink-0 items-center gap-1.5 pt-px text-[10.5px] font-semibold uppercase tracking-wide text-[#7B8FA5]">
        <span className="size-1.5 rounded-full" style={{ backgroundColor: dot }} />{label}
      </span>
      <div className="min-w-0 flex-1 text-[12.5px] leading-[1.5] text-[#1D2A3E]">{body}</div>
    </div>
  );
  return (
    <div className="overflow-hidden rounded-lg border border-[#E2E8F0] bg-white">
      {b.title && <div className="border-b border-[#EEF2F6] bg-[#F8FAFC] px-3 py-1.5 text-[12px] font-semibold text-[#364658]">{b.title}</div>}
      <div className="divide-y divide-[#F1F5F9]">
        {row('When', '#3D8BD0', b.when)}
        {row('If', '#F58518', b.ifs?.length
          ? <div className="flex flex-wrap items-center gap-1.5">{b.ifs.map((c, i) => (
            <span key={c} className="inline-flex items-center gap-1.5">
              {i > 0 && <span className="rounded-sm bg-[#FFF4E5] px-1 text-[10px] font-semibold text-[#B45309]">{b.join ?? 'AND'}</span>}
              <span className="rounded border border-[#E2E8F0] bg-[#F8FAFC] px-1.5 py-px">{c}</span>
            </span>
          ))}</div>
          : <span className="text-[#7B8FA5]">No conditions — always</span>)}
        {row('Then', '#5E9E1E', <div className="flex flex-col gap-0.5">{b.then.map((t) => <span key={t}>{t}</span>)}</div>)}
      </div>
    </div>
  );
}

/** Two tiny request forms, before and after, with what changed ringed. */
function FormPair({ caption, trigger, before, after }: { caption?: string; trigger?: string; before: MockField[]; after: MockField[] }) {
  return (
    <div className="rounded-lg bg-[#F4F6FA] p-2.5">
      {(caption || trigger) && (
        <div className="mb-2 flex items-center gap-1.5 text-[11.5px] text-[#475569]">
          {caption && <span className="font-semibold text-[#364658]">{caption}</span>}
          {caption && trigger && <span className="text-[#B0BCCB]">·</span>}
          {trigger && <span className="inline-flex items-center gap-1"><Zap size={11} className="text-[#F58518]" />{trigger}</span>}
        </div>
      )}
      <div className="flex items-stretch gap-2">
        <MiniForm label="Before" fields={before} />
        <span className="flex flex-shrink-0 items-center text-[#98A2B3]"><ArrowRight size={14} /></span>
        <MiniForm label="After" fields={after} live />
      </div>
    </div>
  );
}

function MiniForm({ label, fields, live }: { label: string; fields: MockField[]; live?: boolean }) {
  return (
    <div className="min-w-0 flex-1 rounded-md border border-[#E2E8F0] bg-white p-2">
      <div className={'mb-1.5 text-[10px] font-semibold uppercase tracking-wide ' + (live ? 'text-[#3D8BD0]' : 'text-[#98A2B3]')}>{label}</div>
      <div className="flex flex-col gap-1.5">
        {fields.map((f) => {
          if (f.s === 'hidden') {
            return (
              <div key={f.l} className={'flex h-[24px] items-center gap-1.5 rounded border border-dashed px-1.5 text-[11px] ' + (f.hl ? 'border-[#3D8BD0] text-[#3D8BD0]' : 'border-[#CBD5E1] text-[#98A2B3]')}>
                <EyeOff size={11} /><span className="truncate">{f.l} — hidden</span>
              </div>
            );
          }
          return (
            <div key={f.l}>
              <div className="mb-0.5 text-[10.5px] leading-none text-[#64748B]">{f.l}{f.s === 'req' && <span className="text-[#DC2626]"> *</span>}</div>
              <div className={'flex h-[24px] items-center gap-1 rounded border px-1.5 text-[11px] '
                + (f.s === 'ro' ? 'bg-[#F1F5F9] text-[#64748B] ' : 'bg-white text-[#1D2A3E] ')
                + (f.hl ? 'border-[#3D8BD0] ring-2 ring-[#3D8BD0]/15 ' : f.s === 'req' ? 'border-[#F5A9A9] ' : 'border-[#E2E8F0] ')}>
                <span className="min-w-0 flex-1 truncate">{f.v || (f.s === 'req' ? <span className="text-[#DC2626]">Required</span> : <span className="text-[#B0BCCB]">Empty</span>)}</span>
                {f.s === 'ro' && <Lock size={10} className="flex-shrink-0" />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Callout({ tone, text }: { tone: 'tip' | 'warn'; text: string }) {
  const tip = tone === 'tip';
  return (
    <div className={'flex gap-2.5 rounded-lg border px-3 py-2.5 ' + (tip ? 'border-[#D6E6F5] bg-[#F3F8FD]' : 'border-[#FCE3B0] bg-[#FFF8EB]')}>
      {tip ? <Lightbulb size={15} className="mt-0.5 flex-shrink-0 text-[#F59E0B]" /> : <AlertTriangle size={15} className="mt-0.5 flex-shrink-0 text-[#D97706]" />}
      <div className="min-w-0">
        <div className={'text-[11px] font-semibold uppercase tracking-wide ' + (tip ? 'text-[#3D8BD0]' : 'text-[#B45309]')}>{tip ? 'Tip' : 'Watch out'}</div>
        <p className="mt-0.5 text-[12.5px] leading-[1.55] text-[#364658]">{rich(text)}</p>
      </div>
    </div>
  );
}

function DoDont({ dos, donts }: { dos: string[]; donts: string[] }) {
  const col = (title: string, items: string[], good: boolean) => (
    <div className={'rounded-lg border p-3 ' + (good ? 'border-[#CDEBD3] bg-[#F4FBF5]' : 'border-[#F7D4D4] bg-[#FEF6F6]')}>
      <div className={'mb-2 text-[12px] font-semibold ' + (good ? 'text-[#2F7D3B]' : 'text-[#B42318]')}>{title}</div>
      <ul className="flex flex-col gap-2">
        {items.map((t) => (
          <li key={t} className="flex gap-2 text-[12.5px] leading-[1.5] text-[#364658]">
            {good ? <Check size={14} className="mt-0.5 flex-shrink-0 text-[#2F9E44]" /> : <XCircle size={14} className="mt-0.5 flex-shrink-0 text-[#D92D20]" />}
            <span className="min-w-0">{rich(t)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
  return <div className="flex flex-col gap-2.5">{col('Do', dos, true)}{col('Don’t', donts, false)}</div>;
}

function Checklist({ items }: { items: { q: string; a: string }[] }) {
  const [done, setDone] = useState<number[]>([]);
  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#EEF2F6]">
          <div className="h-full rounded-full bg-[#3D8BD0] transition-all" style={{ width: (done.length / items.length) * 100 + '%' }} />
        </div>
        <span className="text-[11.5px] text-[#7B8FA5]">{done.length} of {items.length} checked</span>
      </div>
      <ol className="flex flex-col gap-1.5">
        {items.map((it, i) => {
          const on = done.includes(i);
          return (
            <li key={it.q}>
              <button type="button" onClick={() => setDone((d) => (on ? d.filter((x) => x !== i) : [...d, i]))} aria-pressed={on}
                className={'flex w-full gap-2.5 rounded-lg border px-3 py-2.5 text-left transition-colors ' + (on ? 'border-[#E8EDF3] bg-[#F8FAFC]' : 'border-[#E8EDF3] hover:border-[#9FC3E6]')}>
                <span className={'mt-0.5 flex size-4 flex-shrink-0 items-center justify-center rounded border ' + (on ? 'border-[#3D8BD0] bg-[#3D8BD0] text-white' : 'border-[#CBD5E1] bg-white')}>{on && <Check size={11} strokeWidth={3} />}</span>
                <span className="min-w-0">
                  <span className={'block text-[13px] font-semibold ' + (on ? 'text-[#7B8FA5] line-through' : 'text-[#1D2A3E]')}>{i + 1}. {it.q}</span>
                  <span className={'mt-0.5 block text-[12.5px] leading-[1.5] ' + (on ? 'text-[#98A2B3]' : 'text-[#475569]')}>{rich(it.a)}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/** A table is too wide for a 560px panel — each field type is a small card instead. */
function OperatorTable({ rows }: { rows: string[][] }) {
  return (
    <div className="flex flex-col gap-2">
      {rows.map(([type, ops, ex]) => (
        <div key={type} className="rounded-lg border border-[#E8EDF3] p-3">
          <div className="text-[13px] font-semibold text-[#1D2A3E]">{type}</div>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {ops.split(' · ').map((o) => <span key={o} className="rounded border border-[#E2E8F0] bg-[#F8FAFC] px-1.5 py-px text-[11.5px] text-[#364658]">{o}</span>)}
          </div>
          <div className="mt-1.5 text-[12px] text-[#475569]"><span className="mr-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-[#7B8FA5]">Example</span>{rich(ex)}</div>
        </div>
      ))}
    </div>
  );
}

function Faq({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="divide-y divide-[#EEF2F6] overflow-hidden rounded-lg border border-[#E8EDF3]">
      {items.map((it, i) => (
        <div key={it.q}>
          <button type="button" onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i}
            className="flex w-full items-center gap-2 px-3 py-2.5 text-left hover:bg-[#F8FAFC]">
            <span className="min-w-0 flex-1 text-[13px] font-medium text-[#1D2A3E]">{it.q}</span>
            <ChevronDown size={15} className={'flex-shrink-0 text-[#98A2B3] transition-transform ' + (open === i ? 'rotate-180' : '')} />
          </button>
          {open === i && <p className="px-3 pb-3 text-[12.5px] leading-[1.55] text-[#475569]">{rich(it.a)}</p>}
        </div>
      ))}
    </div>
  );
}

/** A compact finding chip on the title row: count · name · arrow. The detail is on hover (title). */
export function FindingCard({ tone, n, label, tip, onClick }: { tone: 'red' | 'amber'; n: number; label: string; tip: string; onClick: () => void }) {
  const red = tone === 'red';
  return (
    <button type="button" onClick={onClick} title={tip}
      className={'group inline-flex h-7 flex-shrink-0 items-center gap-1.5 rounded-md border px-2.5 text-[12.5px] font-semibold transition-colors '
        + (red ? 'border-[#FBD5D5] bg-[#FEF4F4] text-[#B42318] hover:border-[#F5A9A9] hover:bg-[#FDECEC]' : 'border-[#FCE3B0] bg-[#FFF8EB] text-[#B45309] hover:border-[#F5C770] hover:bg-[#FFF1D6]')}>
      <span className="tabular-nums">{n}</span>
      <span>{label}</span>
      <ArrowRight size={14} className={'transition-transform group-hover:translate-x-0.5 ' + (red ? 'text-[#D92D20]' : 'text-[#D97706]')} />
    </button>
  );
}
