import { useEffect, useMemo, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { AlertTriangle, ArrowLeftRight, ArrowUpRight, Ban, ChevronLeft, ChevronRight, CornerDownRight, Lightbulb, Search, FileText, Layers, RefreshCw, TextCursorInput } from 'lucide-react';
import type { FormRule } from './formRuleData';
import type { ConflictKind, RuleConflict } from './formRuleEngine';

/** The one "go to that rule" button, used by BOTH sidebars (Open rule here, Update this rule in
    similar rules) so the two read as the same kind of action. */
export const RULE_CTA = 'inline-flex flex-shrink-0 items-center gap-1 text-[12px] font-medium text-[#3D8BD0] transition-colors hover:text-[#2C6CA8] hover:underline';

/* G · Conflict review. A conflict is a LINK: this rule's action → a field → another rule → a kind.
 * Those links form many-to-many shapes — one rule clashing on several fields, one field fought
 * over by several rules, one rule+field pair clashing in more than one way — so the review shows
 * them two ways (by rule · by field), each cross-linked to the other.
 *
 * Visual language: every clash is a face-off — this rule's action on the left, the other rule's
 * on the right, the KIND between them as an icon medallion — with the consequence underneath as a
 * callout. Rules get a colour avatar so the same rule is recognisable across all three views. */

type Mode = 'rule' | 'field';
const KINDS: ConflictKind[] = ['Opposite', 'Override', 'Blocking'];

const KIND: Record<ConflictKind, { fg: string; bg: string; ring: string; bar: string; icon: React.ReactNode; hint: string }> = {
  Opposite: { fg: '#DC2626', bg: '#FEF2F2', ring: '#FECACA', bar: '#F87171', icon: <ArrowLeftRight size={13} />, hint: 'The two rules do the reverse to this field' },
  Override: { fg: '#C2410C', bg: '#FFF4E5', ring: '#FED7AA', bar: '#FB923C', icon: <RefreshCw size={12} />, hint: 'Both set this field — whichever runs last wins' },
  Blocking: { fg: '#9F1239', bg: '#FFE4E9', ring: '#FECDD3', bar: '#E11D48', icon: <Ban size={13} />, hint: 'Mandatory but hidden or read-only — the form can’t be submitted' },
};

const PALETTE = ['#3D8BD0', '#8B5CF6', '#0E9384', '#D97706', '#DB2777', '#4F46E5', '#059669', '#EA580C'];
const hash = (s: string) => [...s].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7);
const colourOf = (s: string) => PALETTE[hash(s) % PALETTE.length];
const initials = (s: string) => s.replace(/[^A-Za-z0-9 ]/g, ' ').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');

function RuleAvatar({ name, size = 32 }: { name: string; size?: number }) {
  const c = colourOf(name);
  return (
    <span className="flex flex-shrink-0 items-center justify-center rounded-lg font-semibold" style={{ width: size, height: size, fontSize: size * 0.36, color: c, backgroundColor: c + '1A' }}>
      {initials(name)}
    </span>
  );
}
function FieldAvatar({ size = 32 }: { size?: number }) {
  return <span className="flex flex-shrink-0 items-center justify-center rounded-lg bg-[#EEF2F6] text-[#64748B]" style={{ width: size, height: size }}><TextCursorInput size={size * 0.45} /></span>;
}

function KindChip({ kind, n }: { kind: ConflictKind; n?: number }) {
  const k = KIND[kind];
  return (
    <span title={k.hint} className="inline-flex flex-shrink-0 items-center gap-1 rounded-full px-2 text-[11px] font-medium leading-5" style={{ color: k.fg, backgroundColor: k.bg }}>
      {k.icon}{kind}{n && n > 1 ? <span className="opacity-70">×{n}</span> : null}
    </span>
  );
}

/** Proportion of each kind, as one thin bar. */
function KindBar({ cs, h = 6 }: { cs: RuleConflict[]; h?: number }) {
  return (
    <div className="flex w-full overflow-hidden rounded-full bg-[#EEF2F6]" style={{ height: h }}>
      {KINDS.map((k) => {
        const n = cs.filter((c) => c.kind === k).length;
        return n ? <span key={k} style={{ width: `${(n / cs.length) * 100}%`, backgroundColor: KIND[k].bar }} /> : null;
      })}
    </div>
  );
}

const countKinds = (cs: RuleConflict[]) => KINDS.map((k) => [k, cs.filter((c) => c.kind === k).length] as const).filter(([, n]) => n > 0);

export function FormRuleConflictReview({ conflicts, rules, fieldLabel, onJump, onOpenRule, currentExecution, accordion = false, onHelpChange, onClose, sidebar = false, initialMode, initialSel, focus }: {
  /** Bring this FIELD forward: switch to By field, open its accordion, tint it and scroll to it.
      `n` changes on every request so asking for the same field twice still works. */
  focus?: { field: string; n: number } | null;
  /** The R-family sidebar: a 'N conflicts found' banner instead of the four KPI filter cards. */
  sidebar?: boolean;
  /** Open on this view / this rule or field (an action row's warning opens a field directly). */
  initialMode?: 'rule' | 'field';
  initialSel?: string;
  /** Told when the help page opens or closes — a host can then hand its whole header to it. */
  onHelpChange?: (open: boolean) => void;
  /** When the host gives up its header, the help page carries the close button. */
  onClose?: () => void;
  /** G2: no side panel — every rule (or field) is an accordion in one scrolling list. */
  accordion?: boolean;
  /** When this rule executes — shown under its side of each pair. */
  currentExecution?: string;
  conflicts: RuleConflict[];
  rules: FormRule[];
  fieldLabel: (id: string) => string;
  onJump: (actionId: string) => void;
  onOpenRule: (id: string) => void;
}) {
  const [mode, setMode] = useState<Mode>(initialMode ?? 'rule');
  const [kinds, setKinds] = useState<ConflictKind[]>([]);
  const [sel, setSel] = useState<string | null>(initialSel ?? null);
  const [focusField, setFocusField] = useState<string | null>(null);
  const [helpOpen, setHelpOpenState] = useState(false);
  const setHelpOpen = (o: boolean) => { setHelpOpenState(o); onHelpChange?.(o); };
  const [q, setQ] = useState('');
  /** G2: which accordions are open; null = the first one, until the admin opens or closes any. */
  const [openIds, setOpenIds] = useState<string[] | null>(null);

  const list = conflicts.filter((c) => !kinds.length || kinds.includes(c.kind));
  const byRule = useMemo(() => {
    const m = new Map<string, { rule: FormRule; items: RuleConflict[] }>();
    list.forEach((c) => { const e = m.get(c.other.id) ?? { rule: c.other, items: [] }; e.items.push(c); m.set(c.other.id, e); });
    return [...m.values()].sort((a, b) => b.items.length - a.items.length);
  }, [list]);
  const byField = useMemo(() => {
    const m = new Map<string, RuleConflict[]>();
    list.forEach((c) => m.set(c.fieldId, [...(m.get(c.fieldId) ?? []), c]));
    return [...m.entries()].map(([fieldId, items]) => ({ fieldId, items })).sort((a, b) => b.items.length - a.items.length);
  }, [list]);

  const order = (id: string) => rules.findIndex((r) => r.id === id) + 1;
  const fieldsOf = (cs: RuleConflict[]) => [...new Set(cs.map((c) => c.fieldId))];
  const rulesOf = (cs: RuleConflict[]) => [...new Set(cs.map((c) => c.other.id))];

  useEffect(() => {
    const ids = mode === 'field' ? byField.map((f) => f.fieldId) : byRule.map((r) => r.rule.id);
    if (!sel || !ids.includes(sel)) setSel(ids[0] ?? null);
  }, [mode, byRule, byField]); // eslint-disable-line react-hooks/exhaustive-deps

  /** The clashes of whatever is selected — the resolution panel speaks about these first. */
  const focusItems = mode === 'rule' ? list.filter((x) => x.other.id === sel) : mode === 'field' ? list.filter((x) => x.fieldId === sel) : [];

  /** The field an action row's warning asked about — tinted light red in the list. */
  const [lit, setLit] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  /* A mode change resets which accordions are open — unless a focus request is switching the mode,
     in which case the field it asked for is the one left open. */
  const pendingOpen = useRef<string | null>(null);
  useEffect(() => { setOpenIds(pendingOpen.current ? [pendingOpen.current] : null); pendingOpen.current = null; }, [mode]);
  useEffect(() => {
    if (!focus) return;
    if (mode !== 'field') pendingOpen.current = focus.field;
    setMode('field');
    setLit(focus.field);
    setOpenIds([focus.field]);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      listRef.current?.querySelector(`[data-acc="${focus.field}"]`)?.scrollIntoView({ block: 'start', behavior: 'smooth' });
    }));
  }, [focus?.n]); // eslint-disable-line react-hooks/exhaustive-deps

  const goRule = (ruleId: string, fieldId?: string) => { setMode('rule'); setSel(ruleId); setFocusField(fieldId ?? null); };
  const goField = (fieldId: string) => { setMode('field'); setSel(fieldId); setFocusField(null); };

  /** One clash: this rule's action beside the other rule's, then what it means — as text, not boxes. */
  const faceOff = (c: RuleConflict, theirLabel: string) => {
    const k = KIND[c.kind];
    const blocked = c.kind === 'Blocking';
    return (
      <div key={c.key} className="px-4 py-3">
        <div className="grid grid-cols-2 gap-6">
          <div className="min-w-0">
            <div className="text-[11px] text-[#98A2B3]">This rule</div>
            <div className="mt-0.5 text-[13px] text-[#1D2A3E]">{c.mine}</div>
          </div>
          <div className="min-w-0 border-l border-[#EEF2F6] pl-6">
            <div className="truncate text-[11px] text-[#98A2B3]">{theirLabel}</div>
            <div className="mt-0.5 text-[13px] text-[#1D2A3E]">{c.theirs}</div>
          </div>
        </div>
        <div className="mt-2 flex items-center gap-2 text-[12px]">
          <span className="flex-shrink-0 font-medium" style={{ color: k.fg }} title={k.hint}>{c.kind}</span>
          <span className="text-[#CBD5E1]">·</span>
          <span className={'min-w-0 flex-1 truncate ' + (blocked ? 'text-[#9F1239]' : 'text-[#64748B]')} title={c.outcome}>{c.outcome}</span>
          <span className="flex-shrink-0 text-[11px] text-[#98A2B3]">{c.scope}</span>
          <button type="button" onClick={() => onJump(c.actionId)} className="inline-flex flex-shrink-0 items-center gap-1 text-[12px] font-medium text-[#3D8BD0] hover:underline">
            <CornerDownRight size={12} /> Jump to row
          </button>
        </div>
      </div>
    );
  };

  /** "Hides Category" → "Hides the category": the pair reads as a sentence about THIS field. */
  const phrase = (text: string, fid: string) => {
    const l = fieldLabel(fid);
    return text.replace(l, 'the ' + l.toLowerCase());
  };
  /** One clash, as the reference: two plain cards side by side — current rule, conflicting rule. */
  /* G2 has no grey group panel behind the pair, so each card carries its own fill + outline. */
  const card = accordion ? 'rounded-lg bg-[#F6F9FC]/80 px-3.5 py-3' : 'rounded-lg bg-white px-3.5 py-3';
  const pair = (x: RuleConflict, fid: string) => (
    <div key={x.key} className="grid grid-cols-1 gap-2.5 @[520px]:grid-cols-2">
      <div className={card}>
        <div className="text-[12px] font-medium text-[#3D8BD0]">Current Rule</div>
        <div className="mt-1 text-[15px] font-medium leading-snug text-[#1D2A3E]">{phrase(x.mine, fid)}</div>
        <div className="mt-2 text-[12px] text-[#98A2B3]">{currentExecution || x.scope}</div>
      </div>
      <div className={card}>
        <div className="text-[12px] font-medium text-[#F25C4E]">Conflicting Rule</div>
        <div className="mt-1 text-[15px] font-medium leading-snug text-[#1D2A3E]">{phrase(x.theirs, fid)}</div>
        <div className="mt-2 text-[12px] text-[#98A2B3]">{x.other.execution}</div>
      </div>
    </div>
  );

  // ── left list ─────────────────────────────────────────────────────────────
  const leftList = mode === 'rule'
    ? byRule.map(({ rule, items }) => {
      const nf = fieldsOf(items).length;
      return { id: rule.id, title: rule.name, avatar: <RuleAvatar name={rule.name} size={28} />, meta: `Runs #${order(rule.id)} · ${nf} field${nf > 1 ? 's' : ''}`, items, shape: nf > 1 ? `1 rule → ${nf} fields` : null };
    })
    : byField.map(({ fieldId, items }) => {
      const nr = rulesOf(items).length;
      return { id: fieldId, title: fieldLabel(fieldId), avatar: <FieldAvatar size={28} />, meta: `${nr} rule${nr > 1 ? 's' : ''} involved`, items, shape: nr > 1 ? `${nr} rules → 1 field` : null };
    });

  const shownList = leftList.filter((it) => !q.trim() || it.title.toLowerCase().includes(q.trim().toLowerCase()));

  // ── right detail ──────────────────────────────────────────────────────────
  let detail: React.ReactNode = null;
  if (mode === 'rule' && sel) {
    const entry = byRule.find((r) => r.rule.id === sel);
    if (entry) {
      const fields = fieldsOf(entry.items);
      detail = (
        <div className="flex flex-col gap-1">
          <div className="sticky top-0 z-20 flex items-center gap-3 bg-white pb-2">
            <h3 className="min-w-0 flex-1 truncate text-[15px] font-semibold leading-5 text-[#1D2A3E]">{entry.rule.name}</h3>
            <button type="button" onClick={() => onOpenRule(entry.rule.id)} className={RULE_CTA}>Open rule <ArrowUpRight size={13} /></button>
          </div>
          <div className="flex flex-col gap-4">{fields.map((fid) => {
            const here = entry.items.filter((x) => x.fieldId === fid);
            const alsoRules = rulesOf(byField.find((f) => f.fieldId === fid)?.items ?? []).filter((id) => id !== entry.rule.id);
            return (
              <div key={fid} className={'rounded-xl bg-[#F4F6FA] p-3 transition-shadow ' + (focusField === fid ? 'ring-2 ring-[#3D8BD0]/30' : '')}>
                <div className="sticky top-[28px] z-10 -mx-3 -mt-3 mb-0 flex items-center gap-2 rounded-t-xl bg-[#F4F6FA] px-3.5 pb-2.5 pt-3">
                  <span className="text-[14px] font-semibold text-[#1D2A3E]">{fieldLabel(fid)}</span>

                </div>
                <div className="flex flex-col gap-2.5">{here.map((x) => pair(x, fid))}</div>
              </div>
            );
          })}</div>
        </div>
      );
    }
  } else if (mode === 'field' && sel) {
    const entry = byField.find((f) => f.fieldId === sel);
    if (entry) {
      const ruleIds = rulesOf(entry.items).sort((a, b) => order(a) - order(b));
      detail = (
        <div className="flex flex-col gap-1">
          <h3 className="sticky top-0 z-20 flex items-center bg-white pb-2 text-[15px] font-semibold leading-5 text-[#1D2A3E]">{fieldLabel(entry.fieldId)}</h3>
          <div className="flex flex-col gap-4">{ruleIds.map((rid) => {
            const here = entry.items.filter((x) => x.other.id === rid);
            const rule = here[0].other;
            return (
              <div key={rid} className="group/rc rounded-xl bg-[#F4F6FA] p-3">
                <div className="sticky top-[28px] z-10 -mx-3 -mt-3 mb-0 flex items-center gap-2 rounded-t-xl bg-[#F4F6FA] px-3.5 pb-2.5 pt-3">
                  <span className="truncate text-[14px] font-semibold text-[#1D2A3E]">{rule.name}</span>
                  {/* Shown on hover of the card, top-right, so a list of rules stays quiet until you reach for one. */}
                  <button type="button" onClick={() => onOpenRule(rid)} className={RULE_CTA + ' ml-auto -my-1 opacity-0 focus:opacity-100 group-hover/rc:opacity-100'}>Open rule <ArrowUpRight size={13} /></button>
                </div>
                <div className="flex flex-col gap-2.5">{here.map((x) => pair(x, entry.fieldId))}</div>
              </div>
            );
          })}</div>
        </div>
      );
    }
  }


  // ── G2 · accordions instead of a side panel ───────────────────────────────
  /* Each rule (or field) is an outlined container with a light blue-grey header. Headers are
     sticky: an open accordion's header pins to the top while its content scrolls, and the
     sub-headers inside pin just below it, each pushed away by the next. */
  const isOpen = (id: string) => (openIds === null ? id === shownList[0]?.id : openIds.includes(id));
  const toggle = (id: string) => setOpenIds((cur) => {
    const base = cur ?? (shownList[0] ? [shownList[0].id] : []);
    return base.includes(id) ? base.filter((x) => x !== id) : [...base, id];
  });
  const subGroup = (key: string, title: React.ReactNode, right: React.ReactNode, body: React.ReactNode) => (
    <div key={key} className="group/sg">
      {/* No panel behind the group — the header is white so it still covers rows scrolling under it. */}
      <div className="sticky top-[36px] z-10 flex items-center gap-2 bg-white pb-2 pt-1">
        <span className="min-w-0 truncate text-[13px] font-semibold text-[#1D2A3E]">{title}</span>
        {right}
      </div>
      <div className="flex flex-col gap-2.5">{body}</div>
    </div>
  );
  const accordionView = (
    <div className="flex min-h-0 flex-1 flex-col px-3 pb-4">
      <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto">
        {shownList.length === 0 && <div className="py-10 text-center text-[12px] text-[#98A2B3]">Nothing matches “{q}”</div>}
        <div className="flex flex-col gap-3">
          {shownList.map((it) => {
            const open = isOpen(it.id);
            const n = it.items.length;
            let body: React.ReactNode = null;
            if (open && mode === 'rule') {
              body = fieldsOf(it.items).map((fid) => subGroup(fid, fieldLabel(fid), null,
                it.items.filter((x) => x.fieldId === fid).map((x) => pair(x, fid))));
            } else if (open) {
              body = rulesOf(it.items).sort((a, b) => order(a) - order(b)).map((rid) => {
                const here = it.items.filter((x) => x.other.id === rid);
                return subGroup(rid, here[0].other.name,
                  <button type="button" onClick={() => onOpenRule(rid)} className="ml-auto inline-flex flex-shrink-0 items-center gap-0.5 text-[12px] font-medium text-[#3D8BD0] opacity-0 transition-opacity hover:underline focus:opacity-100 group-hover/sg:opacity-100">Open rule <ArrowUpRight size={12} /></button>,
                  here.map((x) => pair(x, it.id)));
              });
            }
            return (
              /* No overflow-hidden here — it would stop the headers inside from sticking. */
              <div key={it.id} data-acc={it.id} className={'group/acc scroll-mt-0 rounded-lg border bg-white ' + (!open ? 'border-transparent' : lit === it.id ? 'border-[#F7C6C2]' : 'border-[#DFE5ED]')}>
                {/* The sticky header sits on a square WHITE band: while it is pinned, rows scroll under it,
                    and the band fills its rounded corners so nothing shows through them. The border is
                    drawn on the header itself so a pinned header still reads as a card's top edge. */}
                <div className="sticky top-0 z-20 -mx-px -mt-px bg-white">
                  <div role="button" tabIndex={0} onClick={() => toggle(it.id)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(it.id); } }}
                    className={'flex h-9 cursor-pointer items-center gap-2.5 border px-3 transition-colors '
                      + (lit === it.id ? 'border-[#F7C6C2] bg-[#FEF3F2] hover:bg-[#FDE8E6] ' : 'border-[#DFE5ED] bg-[#F6F9FC] hover:bg-[#EEF3F8] ')
                      + (open ? 'rounded-t-lg' : 'rounded-lg')}>
                  <ChevronRight size={15} className={'flex-shrink-0 text-[#64748B] transition-transform ' + (open ? 'rotate-90' : '')} />
                  <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-[#1D2A3E]">{it.title}</span>
                  {mode === 'rule' && (
                    <button type="button" onClick={(e) => { e.stopPropagation(); onOpenRule(it.id); }}
                      className="ml-2 inline-flex flex-shrink-0 items-center gap-0.5 text-[12px] font-medium text-[#3D8BD0] opacity-0 transition-opacity hover:underline focus:opacity-100 group-hover/acc:opacity-100">
                      Open rule <ArrowUpRight size={12} />
                    </button>
                  )}
                  </div>
                </div>
                {open && <div className="flex flex-col gap-3 rounded-b-lg p-3">{body}</div>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  /* "How do I resolve these conflicts?" is a page of its own: it replaces the review (with a way
     back), because reading six ways to resolve a clash beside a list of clashes leaves room for neither. */
  if (helpOpen) {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <div className={'flex flex-shrink-0 items-center gap-2 border-b border-[#EEF2F6] px-3 pb-3 ' + (onClose ? 'pt-3' : '')}>
          <button type="button" onClick={() => setHelpOpen(false)} title="Back to the conflicts"
            className="flex size-8 items-center justify-center rounded transition-colors hover:bg-[#F3F4F6]">
            <ChevronLeft size={16} className="text-[#64748B]" />
          </button>
          <h3 className="min-w-0 flex-1 text-[15px] font-semibold text-[#1D2A3E]">Resolving conflicts</h3>
          {onClose && (
            <button type="button" onClick={onClose} title="Close" className="flex size-8 items-center justify-center rounded transition-colors hover:bg-[#F3F4F6]"><X size={16} className="text-[#64748B]" /></button>
          )}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4 pt-3">
          <p className="max-w-[720px] text-[13px] leading-[1.6] text-[#64748B]">
            A conflict happens when two rules act on the same field in opposite ways and both run at the same time.
            These are the usual ways to sort one out — you rarely need more than one of them.
          </p>
          <ol className="mt-4 flex flex-col gap-3">
            {RESOLVE_STEPS.map((s, i) => (
              <li key={s.title} className="flex gap-3 rounded-lg border border-[#E8EDF3] bg-white px-4 py-3.5">
                <span className="flex size-6 flex-shrink-0 items-center justify-center rounded-full bg-[#EBF5FF] text-[12px] font-semibold text-[#3D8BD0]">{i + 1}</span>
                <span className="min-w-0">
                  <span className="block text-[14px] font-semibold text-[#1D2A3E]">{s.title}</span>
                  <span className="mt-1 block text-[13px] leading-[1.6] text-[#64748B]">{s.text}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    );
  }

  if (!conflicts.length) {
    return <div className="flex h-full items-center justify-center p-8 text-center text-[13px] text-[#7B8FA5]">No conflicts — no other rule leaves these fields in a different state.</div>;
  }


  return (
    <div className="@container flex h-full min-h-0 flex-col">
      {/* One row: the view tabs on the left, the counts on the right. Each count is a small card —
          number over its name, nothing else — and it is also the kind filter ("All" included). */}
      {sidebar && (
        <div className="mx-3 mb-3 flex flex-shrink-0 items-start gap-3 rounded-lg border border-[#FBD5D5] bg-[#FEF4F4] px-4 py-3">
          <AlertTriangle size={16} className="mt-0.5 flex-shrink-0 text-[#D92D20]" />
          <div className="min-w-0">
            <div className="text-[14px] font-semibold text-[#B42318]">{conflicts.length} conflict{conflicts.length === 1 ? '' : 's'} found</div>
            <p className="mt-0.5 text-[12px] leading-[1.5] text-[#C2413A]">A field can only end up in one state. Resolve these to avoid unexpected behaviour in the form.</p>
          </div>
        </div>
      )}
      <div className={'mx-3 mb-3 flex flex-shrink-0 flex-wrap items-center ' + (accordion ? 'gap-2' : 'gap-3')}>
        <div className="pill-track">
          <button type="button" aria-pressed={mode === 'rule'} onClick={() => setMode('rule')}><span className="inline-flex items-center gap-1.5"><FileText size={12} />By rule</span></button>
          <button type="button" aria-pressed={mode === 'field'} onClick={() => setMode('field')}><span className="inline-flex items-center gap-1.5"><Layers size={12} />By field</span></button>
        </div>
        {/* In the rail the search sits on the tabs' row — one line, not two. */}
        {accordion && (
          <div className="relative ml-auto w-[180px] flex-shrink-0">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#98A2B3]" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={mode === 'rule' ? 'Search rules...' : 'Search fields...'}
              className="h-8 w-full rounded-md border border-[#E2E8F0] bg-white pl-8 pr-2.5 text-[12px] text-[#364658] placeholder:text-[#98A2B3] focus:border-[#3D8BD0] focus:outline-none focus:ring-1 focus:ring-[#3D8BD0]" />
          </div>
        )}
        {!sidebar && !accordion && <div className="grid w-full grid-cols-4 gap-2 @[640px]:ml-auto @[640px]:flex @[640px]:w-auto">
          {([
            { id: 'all' as const, label: 'All conflicts', n: conflicts.length, fg: '#1D2A3E' },
            ...KINDS.map((k) => ({ id: k, label: k, n: conflicts.filter((x) => x.kind === k).length, fg: KIND[k].fg })),
          ]).map((t) => {
            const on = t.id === 'all' ? kinds.length === 0 : kinds.length === 1 && kinds[0] === t.id;
            const off = t.id !== 'all' && t.n === 0;
            return (
              <button key={t.id} type="button" disabled={off} aria-pressed={on} title={t.id === 'all' ? 'Show every conflict' : 'Show only ' + t.label}
                onClick={() => setKinds(t.id === 'all' ? [] : [t.id])}
                className={'min-w-0 @[640px]:w-[96px] rounded-lg border bg-white px-3 py-1.5 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-45 ' + (on ? 'border-[#3D8BD0] bg-[#F5F9FE]' : 'border-[#E8EDF3] hover:border-[#CBD5E1]')}>
                <div className="text-[17px] font-semibold leading-6 tabular-nums" style={{ color: t.n ? t.fg : '#98A2B3' }}>{t.n}</div>
                <div className="truncate text-[11px] text-[#7B8FA5]">{t.id === 'all' ? <><span className="@[640px]:hidden">All</span><span className="hidden @[640px]:inline">All conflicts</span></> : t.label}</div>
              </button>
            );
          })}
        </div>}
      </div>

      {accordion ? accordionView : (
        /* No divider lines: the list is its own soft grey panel, the detail sits beside it on white. */
        <div className="flex min-h-0 flex-1 gap-4 px-3 pb-4">
          <div className="flex w-[280px] flex-shrink-0 flex-col rounded-md bg-[#F4F6FA] p-2">
            <div className="relative mb-2 flex-shrink-0">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#98A2B3]" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={mode === 'rule' ? 'Search rules...' : 'Search fields...'}
                className="h-8 w-full rounded-md border border-[#E2E8F0] bg-white pl-8 pr-2.5 text-[12px] text-[#364658] placeholder:text-[#98A2B3] focus:border-[#3D8BD0] focus:outline-none focus:ring-1 focus:ring-[#3D8BD0]" />
            </div>
            <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto">
              {shownList.length === 0 && <div className="px-3 py-6 text-center text-[12px] text-[#98A2B3]">Nothing matches “{q}”</div>}
              {shownList.map((it) => {
                const on = sel === it.id;
                return (
                  /* The reference's list item: name, then "• N conflicts" — nothing else. */
                  <button key={it.id} type="button" onClick={() => { setSel(it.id); setFocusField(null); }}
                    className={'block w-full rounded-md px-3 py-2.5 text-left transition-colors ' + (on ? 'bg-white shadow-[0_1px_2px_rgba(15,23,42,0.06)]' : 'hover:bg-white/60')}>
                    <span className="block truncate text-[13px] font-semibold text-[#1D2A3E]">{it.title}</span>
                    <span className="mt-1 flex items-center gap-1.5 text-[12px] text-[#7B8FA5]">
                      <span className="size-1.5 rounded-full bg-[#F25C4E]" />
                      {it.items.length} conflict{it.items.length === 1 ? '' : 's'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto bg-white">{detail}</div>
        </div>
      )}

      <button type="button" onClick={() => setHelpOpen(true)}
        className="flex flex-shrink-0 items-center gap-2 border-t border-[#EEF2F6] px-3 py-3 text-left text-[13px] text-[#364658] transition-colors hover:bg-[#F7F9FB]">
        <Lightbulb size={15} className="text-[#F59E0B]" />
        How do I resolve these conflicts?
        <ChevronRight size={15} className="text-[#98A2B3]" />
      </button>
    </div>
  );
}

const RESOLVE_STEPS = [
  { title: 'Decide which rule should win', text: 'If two rules do opposite things to the same field, keep the action on the rule that matches your intent and remove it from the other. Left alone, whichever rule runs last wins — and that may not be the one you want.' },
  { title: 'Narrow the conditions so both can’t fire', text: 'A conflict only matters when both rules run on the same request. Add a condition to one of them so their conditions no longer overlap.' },
  { title: 'Separate them by when they run', text: 'Two rules can’t collide if one runs On Create and the other On Edit. Check the Execute on setting before changing anything else.' },
  { title: 'Separate them by who they apply to', text: 'A rule for Requesters only and a rule for Technicians only can safely do opposite things to the same field, because they never run for the same person.' },
  { title: 'Merge them into one rule', text: 'If both rules watch the same condition, add your action to the existing rule instead of keeping a second one. Use a block to handle each case inside a single rule.' },
  { title: 'Change the run order', text: 'For Opposite and Override conflicts the rule that runs last wins. Drag the rule you want to decide the field below the other in the Form Rules list.' },
];

