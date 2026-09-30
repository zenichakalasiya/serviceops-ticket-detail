import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowLeftRight, ArrowUpRight, Ban, ChevronRight, CornerDownRight, Lightbulb, Search, FileText, Grid3x3, Layers, RefreshCw, TextCursorInput } from 'lucide-react';
import type { FormRule } from './formRuleData';
import type { ConflictKind, RuleConflict } from './formRuleEngine';

/* G · Conflict review. A conflict is a LINK: this rule's action → a field → another rule → a kind.
 * Those links form many-to-many shapes — one rule clashing on several fields, one field fought
 * over by several rules, one rule+field pair clashing in more than one way — so the review shows
 * them three ways (by rule · by field · matrix), each cross-linked to the others.
 *
 * Visual language: every clash is a face-off — this rule's action on the left, the other rule's
 * on the right, the KIND between them as an icon medallion — with the consequence underneath as a
 * callout. Rules get a colour avatar so the same rule is recognisable across all three views. */

type Mode = 'rule' | 'field' | 'matrix';
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

export function FormRuleConflictReview({ conflicts, rules, fieldLabel, onJump, onOpenRule, currentExecution }: {
  /** When this rule executes — shown under its side of each pair. */
  currentExecution?: string;
  conflicts: RuleConflict[];
  rules: FormRule[];
  fieldLabel: (id: string) => string;
  onJump: (actionId: string) => void;
  onOpenRule: (id: string) => void;
}) {
  const [mode, setMode] = useState<Mode>('rule');
  const [kinds, setKinds] = useState<ConflictKind[]>([]);
  const [sel, setSel] = useState<string | null>(null);
  const [focusField, setFocusField] = useState<string | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [q, setQ] = useState('');

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
  const pair = (x: RuleConflict, fid: string) => (
    <div key={x.key} className="grid grid-cols-2 gap-2.5">
      <div className="rounded-lg bg-white px-3.5 py-3">
        <div className="text-[12px] font-medium text-[#3D8BD0]">Current Rule</div>
        <div className="mt-1 text-[15px] font-medium leading-snug text-[#1D2A3E]">{phrase(x.mine, fid)}</div>
        <div className="mt-2 text-[12px] text-[#98A2B3]">{currentExecution || x.scope}</div>
      </div>
      <div className="rounded-lg bg-white px-3.5 py-3">
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
          <div className="-mt-1.5 flex h-8 items-center gap-3">
            <h3 className="min-w-0 flex-1 truncate text-[15px] font-semibold text-[#1D2A3E]">{entry.rule.name}</h3>
            <button type="button" onClick={() => onOpenRule(entry.rule.id)} className="inline-flex flex-shrink-0 items-center gap-1 rounded-md px-2 py-1 text-[12px] font-medium text-[#3D8BD0] transition-colors hover:bg-[#EBF5FF]">Open rule <ArrowUpRight size={12} /></button>
          </div>
          <div className="flex flex-col gap-4">{fields.map((fid) => {
            const here = entry.items.filter((x) => x.fieldId === fid);
            const alsoRules = rulesOf(byField.find((f) => f.fieldId === fid)?.items ?? []).filter((id) => id !== entry.rule.id);
            return (
              <div key={fid} className={'rounded-xl bg-[#F4F6FA] p-3 transition-shadow ' + (focusField === fid ? 'ring-2 ring-[#3D8BD0]/30' : '')}>
                <div className="mb-2.5 flex items-center gap-2 px-0.5">
                  <span className="text-[14px] font-semibold text-[#1D2A3E]">{fieldLabel(fid)}</span>
                  {alsoRules.length > 0 && (
                    <button type="button" onClick={() => goField(fid)} className="ml-auto text-[12px] text-[#3D8BD0] hover:underline">
                      +{alsoRules.length} more rule{alsoRules.length > 1 ? 's' : ''}
                    </button>
                  )}
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
          <h3 className="-mt-1.5 flex h-8 items-center text-[15px] font-semibold text-[#1D2A3E]">{fieldLabel(entry.fieldId)}</h3>
          <div className="flex flex-col gap-4">{ruleIds.map((rid) => {
            const here = entry.items.filter((x) => x.other.id === rid);
            const rule = here[0].other;
            return (
              <div key={rid} className="rounded-xl bg-[#F4F6FA] p-3">
                <div className="mb-2.5 flex items-center gap-2 px-0.5">
                  <span className="truncate text-[14px] font-semibold text-[#1D2A3E]">{rule.name}</span>
                  <button type="button" onClick={() => onOpenRule(rid)} className="ml-auto flex-shrink-0 text-[12px] text-[#3D8BD0] hover:underline">Open rule</button>
                </div>
                <div className="flex flex-col gap-2.5">{here.map((x) => pair(x, entry.fieldId))}</div>
              </div>
            );
          })}</div>
        </div>
      );
    }
  }

  // ── matrix ────────────────────────────────────────────────────────────────
  const matrix = (
    <div className="min-h-0 flex-1 overflow-auto px-3 pb-5">
      <div className="inline-block min-w-full overflow-hidden rounded-xl border border-[#E8EDF3] shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <table className="w-full border-separate border-spacing-0 text-[12px]">
          <thead>
            <tr>
              <th className="sticky left-0 top-0 z-20 min-w-[250px] border-b border-r border-[#EEF2F6] bg-[#FAFBFC] px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[#7B8FA5]">Rule ↓ · Field →</th>
              {byField.map(({ fieldId, items }) => (
                <th key={fieldId} className="sticky top-0 z-10 min-w-[140px] border-b border-r border-[#EEF2F6] bg-[#FAFBFC] px-3 py-2.5 text-left">
                  <button type="button" onClick={() => goField(fieldId)} className="text-[12px] font-semibold text-[#1D2A3E] hover:text-[#3D8BD0]">{fieldLabel(fieldId)}</button>
                  <div className="mt-1 w-16"><KindBar cs={items} h={4} /></div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {byRule.map(({ rule, items }) => (
              <tr key={rule.id} className="group">
                <td className="sticky left-0 z-10 border-b border-r border-[#EEF2F6] bg-white px-4 py-2.5 group-hover:bg-[#FAFBFC]">
                  <button type="button" onClick={() => goRule(rule.id)} className="flex items-center gap-2.5 text-left">
                    <RuleAvatar name={rule.name} size={26} />
                    <span className="min-w-0">
                      <span className="block truncate text-[12px] font-medium text-[#1D2A3E] hover:text-[#3D8BD0]">{rule.name}</span>
                      <span className="block text-[11px] text-[#98A2B3]">Runs #{order(rule.id)} · {items.length} conflict{items.length > 1 ? 's' : ''}</span>
                    </span>
                  </button>
                </td>
                {byField.map(({ fieldId }) => {
                  const cs = items.filter((c) => c.fieldId === fieldId);
                  const top = cs[0] ? KIND[cs[0].kind] : null;
                  return (
                    <td key={fieldId} onClick={() => cs.length && goRule(rule.id, fieldId)}
                      className={`border-b border-r border-[#EEF2F6] px-2.5 py-2 transition-colors ${cs.length ? 'cursor-pointer' : 'group-hover:bg-[#FAFBFC]'}`}
                      style={top ? { backgroundColor: top.bg } : undefined}>
                      {cs.length ? <div className="flex flex-wrap gap-1">{countKinds(cs).map(([k, n]) => <KindChip key={k} kind={k} n={n} />)}</div> : <span className="block text-center text-[#E2E8F0]">—</span>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-[12px] leading-[1.6] text-[#7B8FA5]">A row lit in several columns is one rule clashing on many fields; a column lit in several rows is one field fought over by many rules; a cell with two chips is one rule clashing two ways on one field. Click any cell for the face-off.</p>
    </div>
  );

  if (!conflicts.length) {
    return <div className="flex h-full items-center justify-center p-8 text-center text-[13px] text-[#7B8FA5]">No conflicts — no other rule leaves these fields in a different state.</div>;
  }


  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* One row: the view tabs on the left, the counts on the right. Each count is a small card —
          number over its name, nothing else — and it is also the kind filter ("All" included). */}
      <div className="mx-3 mb-3 flex flex-shrink-0 items-center gap-3">
        <div className="pill-track">
          <button type="button" aria-pressed={mode === 'rule'} onClick={() => setMode('rule')}><span className="inline-flex items-center gap-1.5"><FileText size={12} />By rule</span></button>
          <button type="button" aria-pressed={mode === 'field'} onClick={() => setMode('field')}><span className="inline-flex items-center gap-1.5"><Layers size={12} />By field</span></button>
          <button type="button" aria-pressed={mode === 'matrix'} onClick={() => setMode('matrix')}><span className="inline-flex items-center gap-1.5"><Grid3x3 size={12} />Matrix</span></button>
        </div>
        <div className="ml-auto flex gap-2">
          {([
            { id: 'all' as const, label: 'All conflicts', n: conflicts.length, fg: '#1D2A3E' },
            ...KINDS.map((k) => ({ id: k, label: k, n: conflicts.filter((x) => x.kind === k).length, fg: KIND[k].fg })),
          ]).map((t) => {
            const on = t.id === 'all' ? kinds.length === 0 : kinds.length === 1 && kinds[0] === t.id;
            const off = t.id !== 'all' && t.n === 0;
            return (
              <button key={t.id} type="button" disabled={off} aria-pressed={on} title={t.id === 'all' ? 'Show every conflict' : 'Show only ' + t.label}
                onClick={() => setKinds(t.id === 'all' ? [] : [t.id])}
                className={'w-[96px] rounded-lg border bg-white px-3 py-1.5 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-45 ' + (on ? 'border-[#3D8BD0] bg-[#F5F9FE]' : 'border-[#E8EDF3] hover:border-[#CBD5E1]')}>
                <div className="text-[17px] font-semibold leading-6 tabular-nums" style={{ color: t.n ? t.fg : '#98A2B3' }}>{t.n}</div>
                <div className="truncate text-[11px] text-[#7B8FA5]">{t.label}</div>
              </button>
            );
          })}
        </div>
      </div>

      {mode === 'matrix' ? matrix : (
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

      {/* Resolution help — collapsed to one line; opens into steps plus fixes for the kinds present. */}
      {helpOpen && (
        <div className="max-h-[48%] flex-shrink-0 overflow-y-auto border-t border-[#EEF2F6] bg-[#FAFBFC] px-3 py-4">
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-6">
            <div>
              <div className="mb-2.5 text-[13px] font-semibold text-[#1D2A3E]">Resolve a conflict in four steps</div>
              <ol className="flex flex-col gap-2.5">
                {RESOLVE_STEPS.map((s, i) => (
                  <li key={s.title} className="flex gap-2.5">
                    <span className="flex size-5 flex-shrink-0 items-center justify-center rounded-full bg-[#EBF5FF] text-[11px] font-semibold text-[#3D8BD0]">{i + 1}</span>
                    <span className="min-w-0">
                      <span className="block text-[13px] font-medium text-[#364658]">{s.title}</span>
                      <span className="block text-[12px] leading-[1.55] text-[#7B8FA5]">{s.text}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </div>
            <div>
              <div className="mb-2.5 text-[13px] font-semibold text-[#1D2A3E]">{focusItems.length ? 'For what you are looking at' : 'By kind of conflict'}</div>
              <div className="flex flex-col gap-2">
                {(focusItems.length ? focusItems : list).reduce<RuleConflict[]>((acc, x) => (acc.some((y) => y.kind === x.kind && y.fieldId === x.fieldId) ? acc : [...acc, x]), []).slice(0, 6).map((x) => (
                  <div key={x.key} className="rounded-lg bg-white px-3 py-2.5 ring-1 ring-[#EEF2F6]">
                    <div className="flex items-center gap-1.5 text-[12px]">
                      <span className="font-medium" style={{ color: KIND[x.kind].fg }}>{x.kind}</span>
                      <span className="text-[#CBD5E1]">·</span>
                      <span className="font-medium text-[#364658]">{fieldLabel(x.fieldId)}</span>
                    </div>
                    <p className="mt-1 text-[12px] leading-[1.55] text-[#64748B]">{fixFor(x)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      <button type="button" onClick={() => setHelpOpen((o) => !o)}
        className="flex flex-shrink-0 items-center gap-2 border-t border-[#EEF2F6] px-3 py-3 text-left text-[13px] text-[#364658] transition-colors hover:bg-[#F7F9FB]">
        <Lightbulb size={15} className="text-[#F59E0B]" />
        How do I resolve these conflicts?
        <ChevronRight size={15} className={'text-[#98A2B3] transition-transform ' + (helpOpen ? '-rotate-90' : '')} />
      </button>
    </div>
  );
}

const RESOLVE_STEPS = [
  { title: 'Decide who owns the field', text: 'A field can end in only one state. Pick the rule whose behaviour you actually want.' },
  { title: 'Remove the clashing action', text: 'Take the action out of the rule that should NOT decide it — here, or via Open rule.' },
  { title: 'Or keep them apart with a condition', text: 'Add a condition so the two rules never match the same request (e.g. different priorities or categories).' },
  { title: 'Or change the run order', text: 'For Opposite and Override the rule that runs last wins — drag it in the Form Rules list.' },
];

/** A concrete suggestion for one clash, in words. */
const fixFor = (x: RuleConflict) => {
  if (x.kind === 'Blocking') return `A mandatory field can't be hidden or read-only. Either drop "${x.theirs}" from ${x.other.name}, or change this rule so it doesn't block the field ("${x.mine}").`;
  if (x.kind === 'Override') return `Both rules set a value. Keep only one "Set value", or move the rule with the value you want below the other so it runs last.`;
  return `This rule says "${x.mine}", ${x.other.name} says "${x.theirs}". Keep one of them, or add a condition so both never run on the same request.`;
};
