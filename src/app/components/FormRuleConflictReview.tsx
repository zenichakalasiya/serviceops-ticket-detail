import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowLeftRight, ArrowUpRight, Ban, CornerDownRight, FileText, Grid3x3, Layers, RefreshCw, TextCursorInput } from 'lucide-react';
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

export function FormRuleConflictReview({ conflicts, rules, fieldLabel, onJump, onOpenRule }: {
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

  // ── right detail ──────────────────────────────────────────────────────────
  let detail: React.ReactNode = null;
  if (mode === 'rule' && sel) {
    const entry = byRule.find((r) => r.rule.id === sel);
    if (entry) {
      const fields = fieldsOf(entry.items);
      detail = (
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3 pb-1">
            <RuleAvatar name={entry.rule.name} size={32} />
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-[14px] font-medium text-[#1D2A3E]">{entry.rule.name}</h3>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {[`Runs #${order(entry.rule.id)}`, entry.rule.applies, entry.rule.execution, entry.rule.event].map((t) => (
                  <span key={t} className="rounded-full bg-white px-2 text-[11px] leading-5 text-[#475467] ring-1 ring-[#E2E8F0]">{t}</span>
                ))}
              </div>
              <p className="mt-2 text-[12px] text-[#64748B]">Clashes with this rule on <b className="font-semibold text-[#364658]">{fields.length} field{fields.length > 1 ? 's' : ''}</b> in <b className="font-semibold text-[#364658]">{entry.items.length} way{entry.items.length > 1 ? 's' : ''}</b>.</p>
            </div>
            <button type="button" onClick={() => onOpenRule(entry.rule.id)} className="inline-flex flex-shrink-0 items-center gap-1 rounded-md px-2 py-1 text-[12px] font-medium text-[#3D8BD0] transition-colors hover:bg-[#EBF5FF]">Open rule <ArrowUpRight size={12} /></button>
          </div>
          {fields.map((fid) => {
            const here = entry.items.filter((c) => c.fieldId === fid);
            const alsoRules = rulesOf(byField.find((f) => f.fieldId === fid)?.items ?? []).filter((id) => id !== entry.rule.id);
            return (
              <div key={fid} className={`overflow-hidden rounded-xl border bg-white transition-shadow ${focusField === fid ? 'border-[#3D8BD0] ring-2 ring-[#3D8BD0]/20' : 'border-[#E8EDF3]'}`}>
                <div className="flex items-center gap-2.5 border-b border-[#F1F5F9] px-4 py-2.5">
                  <FieldAvatar size={24} />
                  <span className="text-[13px] font-medium text-[#364658]">{fieldLabel(fid)}</span>
                  {here.length > 1 && <span className="text-[11px] text-[#98A2B3]">· {here.length} ways</span>}
                  {alsoRules.length > 0 && (
                    <button type="button" onClick={() => goField(fid)} className="ml-auto inline-flex items-center gap-1 rounded-md px-2 py-1 text-[12px] font-medium text-[#3D8BD0] hover:bg-white">
                      <Layers size={12} /> +{alsoRules.length} other rule{alsoRules.length > 1 ? 's' : ''} on {fieldLabel(fid)}
                    </button>
                  )}
                </div>
                <div className="divide-y divide-[#F1F5F9]">{here.map((c) => faceOff(c, entry.rule.name))}</div>
              </div>
            );
          })}
        </div>
      );
    }
  } else if (mode === 'field' && sel) {
    const entry = byField.find((f) => f.fieldId === sel);
    if (entry) {
      const ruleIds = rulesOf(entry.items).sort((a, b) => order(a) - order(b));
      detail = (
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3 pb-1">
            <FieldAvatar size={32} />
            <div className="min-w-0 flex-1">
              <h3 className="text-[14px] font-medium text-[#1D2A3E]">{fieldLabel(entry.fieldId)}</h3>
              <p className="mt-1 text-[12px] text-[#64748B]"><b className="font-semibold text-[#364658]">{ruleIds.length} rule{ruleIds.length > 1 ? 's' : ''}</b> pull this field a different way. They run top to bottom — where values collide, the later rule wins.</p>
              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                {ruleIds.map((rid, i) => (
                  <span key={rid} className="inline-flex items-center gap-1.5">
                    {i > 0 && <span className="text-[#CBD5E1]">→</span>}
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white py-0.5 pl-0.5 pr-2 text-[11px] text-[#364658] ring-1 ring-[#E2E8F0]">
                      <RuleAvatar name={entry.items.find((c) => c.other.id === rid)!.other.name} size={18} />#{order(rid)}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          </div>
          {ruleIds.map((rid) => {
            const here = entry.items.filter((c) => c.other.id === rid);
            const rule = here[0].other;
            const otherFields = fieldsOf(byRule.find((r) => r.rule.id === rid)?.items ?? []).filter((f) => f !== entry.fieldId);
            return (
              <div key={rid} className="overflow-hidden rounded-xl border border-[#E8EDF3] bg-white">
                <div className="flex items-center gap-2.5 border-b border-[#F1F5F9] px-4 py-2.5">
                  <RuleAvatar name={rule.name} size={24} />
                  <span className="truncate text-[13px] font-medium text-[#364658]">{rule.name}</span>
                  <span className="flex-shrink-0 rounded-full bg-white px-2 text-[11px] leading-5 text-[#64748B] ring-1 ring-[#E2E8F0]">Runs #{order(rid)}</span>
                  {here.length > 1 && <span className="flex-shrink-0 text-[11px] text-[#98A2B3]">· {here.length} ways</span>}
                  <button type="button" onClick={() => onOpenRule(rid)} className="ml-auto flex size-7 flex-shrink-0 items-center justify-center rounded-md text-[#3D8BD0] hover:bg-white" title="Open rule"><ArrowUpRight size={14} /></button>
                </div>
                {otherFields.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 border-b border-[#F1F5F9] px-4 py-2 text-[11px] text-[#7B8FA5]">
                    Also clashes on
                    {otherFields.map((f) => (
                      <button key={f} type="button" onClick={() => goRule(rid, f)} className="rounded-full bg-[#F1F5F9] px-2 text-[11px] font-medium leading-5 text-[#364658] transition-colors hover:bg-[#E2E8F0]">{fieldLabel(f)}</button>
                    ))}
                  </div>
                )}
                <div className="divide-y divide-[#F1F5F9]">{here.map((c) => faceOff(c, rule.name))}</div>
              </div>
            );
          })}
        </div>
      );
    }
  }

  // ── matrix ────────────────────────────────────────────────────────────────
  const matrix = (
    <div className="min-h-0 flex-1 overflow-auto px-5 pb-5">
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

  const nRulesAll = new Set(conflicts.map((x) => x.other.id)).size;
  const nFieldsAll = new Set(conflicts.map((x) => x.fieldId)).size;

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* KPI cards double as the kind filter — one row that says how big the problem is AND lets
          you narrow it. "All" is a tab like the others, so there is always one selected. */}
      <div className="mx-5 mb-4 grid flex-shrink-0 grid-cols-4 gap-3">
        {([
          { id: 'all' as const, label: 'All conflicts', n: conflicts.length, sub: nRulesAll + ' rules · ' + nFieldsAll + ' fields', fg: '#1D2A3E', tint: '#F1F5F9', icon: <AlertTriangle size={15} /> },
          ...KINDS.map((k) => {
            const n = conflicts.filter((c) => c.kind === k).length;
            const sub = k === 'Blocking' ? (n ? 'Blocks saving the form' : 'Nothing blocks saving') : k === 'Override' ? 'Last rule to run wins' : 'Rules undo each other';
            return { id: k, label: k, n, sub, fg: KIND[k].fg, tint: KIND[k].bg, icon: KIND[k].icon };
          }),
        ]).map((t) => {
          const on = t.id === 'all' ? kinds.length === 0 : kinds.length === 1 && kinds[0] === t.id;
          const off = t.id !== 'all' && t.n === 0;
          return (
            <button key={t.id} type="button" disabled={off} aria-pressed={on}
              onClick={() => setKinds(t.id === 'all' ? [] : [t.id])}
              className={'relative rounded-xl border bg-white px-3 py-2.5 text-left transition-all disabled:cursor-not-allowed disabled:opacity-50 ' + (on ? 'border-[#3D8BD0] shadow-[0_0_0_3px_rgba(61,139,208,0.12)]' : 'border-[#E8EDF3] hover:border-[#CBD5E1]')}>
              <div className="flex items-center gap-2.5">
                <span className="flex size-8 flex-shrink-0 items-center justify-center rounded-lg" style={{ color: t.fg, backgroundColor: t.tint }}>{t.icon}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[12px] font-medium text-[#364658]">{t.label}</span>
                  <span className="block truncate text-[11px] text-[#98A2B3]">{t.sub}</span>
                </span>
                <span className="flex-shrink-0 text-[20px] font-semibold tabular-nums" style={{ color: t.n ? t.fg : '#98A2B3' }}>{t.n}</span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mx-5 mb-3 flex flex-shrink-0 items-center gap-3">
        <div className="pill-track">
          <button type="button" aria-pressed={mode === 'rule'} onClick={() => setMode('rule')}><span className="inline-flex items-center gap-1.5"><FileText size={12} />By rule</span></button>
          <button type="button" aria-pressed={mode === 'field'} onClick={() => setMode('field')}><span className="inline-flex items-center gap-1.5"><Layers size={12} />By field</span></button>
          <button type="button" aria-pressed={mode === 'matrix'} onClick={() => setMode('matrix')}><span className="inline-flex items-center gap-1.5"><Grid3x3 size={12} />Matrix</span></button>
        </div>
        <span className="text-[12px] text-[#7B8FA5]">
          {mode === 'rule' ? 'Each rule, and every field it clashes with you on' : mode === 'field' ? 'Each field, and every rule that pulls it another way' : 'All rules against all fields at once'}
        </span>
      </div>

      {mode === 'matrix' ? matrix : (
        <div className="flex min-h-0 flex-1 border-t border-[#EEF2F6]">
          <div className="w-[280px] flex-shrink-0 overflow-y-auto border-r border-[#EEF2F6] p-2">
            <div className="px-2.5 pb-1.5 pt-1 text-[11px] font-medium text-[#98A2B3]">{leftList.length} {mode === 'rule' ? 'rule' : 'field'}{leftList.length === 1 ? '' : 's'}</div>
            <div className="flex flex-col gap-0.5">
              {leftList.map((it) => {
                const on = sel === it.id;
                return (
                  <button key={it.id} type="button" onClick={() => { setSel(it.id); setFocusField(null); }}
                    className={'group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors ' + (on ? 'bg-[#EEF5FC]' : 'hover:bg-[#F5F7FA]')}>
                    {it.avatar}
                    <span className="min-w-0 flex-1">
                      <span className={'block truncate text-[13px] ' + (on ? 'font-semibold text-[#1D2A3E]' : 'font-medium text-[#364658]')}>{it.title}</span>
                      <span className="mt-0.5 flex items-center gap-2 text-[11px] text-[#98A2B3]">
                        <span className="truncate">{it.meta}</span>
                        <span className="flex flex-shrink-0 items-center gap-1">
                          {countKinds(it.items).map(([k]) => <span key={k} title={k} className="size-1.5 rounded-full" style={{ backgroundColor: KIND[k].bar }} />)}
                        </span>
                      </span>
                    </span>
                    <span className={'flex-shrink-0 text-[12px] tabular-nums ' + (on ? 'font-semibold text-[#3D8BD0]' : 'text-[#98A2B3]')}>{it.items.length}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto bg-white px-5 py-4">{detail}</div>
        </div>
      )}
    </div>
  );
}
