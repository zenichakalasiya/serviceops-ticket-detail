import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, Search, X } from 'lucide-react';

/* One search box that also filters by column — taken from the BOM Components drawer's search.
 *
 *   • Typing straight into the box searches every column at once.
 *   • Clicking the box opens FILTER BY FIELD: pick a column → an operator → a value, and the
 *     condition lands in the box as a blue chip ("Result is Fail"). Chips AND together.
 *   • "is" / "is not" offer the column's real values to pick from; "contains" takes free text.
 *
 * The caller keeps the state (`useColumnFilter`) so it can filter its own rows and reset them. */

export type ColumnOp = 'is' | 'is not' | 'contains' | 'does not contain';
const OPERATORS: ColumnOp[] = ['is', 'is not', 'contains', 'does not contain'];
const isListOp = (op: ColumnOp) => op === 'is' || op === 'is not';

export interface ColumnField<T> {
  label: string;
  /** The cell's text. An array is a multi-valued cell (a row's policies): "is" matches any of them. */
  get: (row: T) => string | string[];
}
export interface ColumnCondition { field: string; op: ColumnOp; value: string }

const asList = (v: string | string[]) => (Array.isArray(v) ? v : [v]);

function test(cell: string | string[], c: ColumnCondition) {
  const vals = asList(cell).map((x) => x.toLowerCase());
  const b = c.value.toLowerCase();
  switch (c.op) {
    case 'is': return vals.includes(b);
    case 'is not': return !vals.includes(b);
    case 'contains': return vals.some((a) => a.includes(b));
    case 'does not contain': return !vals.some((a) => a.includes(b));
  }
}

/** The search text and the chips, and the rows they leave. */
export function useColumnFilter<T>(rows: T[], fields: ColumnField<T>[]) {
  const [query, setQuery] = useState('');
  const [conditions, setConditions] = useState<ColumnCondition[]>([]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) =>
      conditions.every((c) => { const f = fields.find((x) => x.label === c.field); return !f || test(f.get(r), c); })
      && (!q || fields.some((f) => asList(f.get(r)).some((v) => v.toLowerCase().includes(q)))));
  }, [rows, fields, query, conditions]);
  const active = !!query.trim() || conditions.length > 0;
  const reset = () => { setQuery(''); setConditions([]); };
  return { query, setQuery, conditions, setConditions, filtered, active, reset };
}

type Step = { field?: string; op?: ColumnOp } | null;

export function ColumnFilterSearch<T>({ rows, fields, query, onQuery, conditions, onConditions, placeholder = 'Search or filter by column', className = '' }: {
  rows: T[];
  fields: ColumnField<T>[];
  query: string;
  onQuery: (q: string) => void;
  conditions: ColumnCondition[];
  onConditions: (c: ColumnCondition[]) => void;
  placeholder?: string;
  className?: string;
}) {
  const [step, setStep] = useState<Step>(null);
  const [valueQ, setValueQ] = useState('');
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const valueRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);

  /* The menu is portalled to the body — these boxes sit inside scrolling drawers that would clip it. */
  useEffect(() => {
    if (!step) return;
    const place = () => { const r = boxRef.current?.getBoundingClientRect(); if (r) setPos({ left: r.left, top: r.bottom + 4 }); };
    place();
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (boxRef.current?.contains(t) || menuRef.current?.contains(t)) return;
      setStep(null); setValueQ('');
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopImmediatePropagation(); setStep(null); setValueQ(''); } };
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    document.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
      document.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKey, true);
    };
  }, [step]);

  const add = (value: string) => {
    if (!step?.field || !step.op || !value.trim()) return;
    onConditions([...conditions, { field: step.field, op: step.op, value: value.trim() }]);
    setStep(null); setValueQ('');
    inputRef.current?.focus();
  };

  const valuesFor = (label: string) => {
    const f = fields.find((x) => x.label === label);
    if (!f) return [];
    return [...new Set(rows.flatMap((r) => asList(f.get(r))).filter(Boolean))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  };
  const vq = valueQ.trim().toLowerCase();
  const values = step?.field ? valuesFor(step.field).filter((v) => !vq || v.toLowerCase().includes(vq)) : [];

  const head = 'px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-[#7B8FA5]';
  const item = 'flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-[13px] text-[#364658] transition-colors hover:bg-[#F9FAFB]';
  const back = (to: Step) => (
    <button type="button" onClick={() => setStep(to)} className="flex size-5 items-center justify-center rounded text-[#7B8FA5] hover:bg-[#EEF2F6] hover:text-[#364658]" title="Back"><ChevronLeft size={14} /></button>
  );

  return (
    <div className={`relative ${className}`}>
      <div
        ref={boxRef}
        onClick={() => { inputRef.current?.focus(); if (!step && !query) setStep({}); }}
        className={`flex min-h-8 w-full cursor-text flex-wrap items-center gap-1.5 rounded border bg-white px-2.5 py-1 transition-colors ${step ? 'border-[#3D8BD0] ring-1 ring-[#3D8BD0]' : 'border-[#d1d5db]'}`}
      >
        <Search size={14} className="flex-shrink-0 text-[#9ca3af]" />
        {conditions.map((c, i) => (
          <span key={i} className="inline-flex items-center gap-1 rounded-sm bg-[#EBF5FF] px-1.5 py-0.5 text-[12px] text-[#3D8BD0]">
            <span className="font-medium">{c.field}</span>
            <span className="text-[#7B8FA5]">{c.op}</span>
            <span className="font-medium">{c.value}</span>
            <button type="button" title="Remove" onClick={(e) => { e.stopPropagation(); onConditions(conditions.filter((_, j) => j !== i)); }} className="text-[#3D8BD0]/70 hover:text-[#DC2626]"><X size={12} /></button>
          </span>
        ))}
        {step?.field && (
          <span className="inline-flex items-center gap-1 text-[13px] text-[#364658]">
            <span className="font-medium">{step.field}</span>
            <ChevronRight size={13} className="text-[#9CA3AF]" />
            {step.op && <><span className="text-[#7B8FA5]">{step.op}</span><ChevronRight size={13} className="text-[#9CA3AF]" /></>}
          </span>
        )}
        <input
          ref={inputRef}
          data-column-search=""
          value={query}
          onChange={(e) => { onQuery(e.target.value); if (e.target.value) { setStep(null); setValueQ(''); } }}
          onKeyDown={(e) => { if (e.key === 'Backspace' && !query && conditions.length) onConditions(conditions.slice(0, -1)); }}
          placeholder={conditions.length || step?.field ? '' : placeholder}
          className="min-w-[80px] flex-1 bg-transparent text-[13px] text-[#364658] outline-none placeholder:text-[#9ca3af]"
        />
        {(query || conditions.length > 0) && (
          <button type="button" title="Clear all" onClick={(e) => { e.stopPropagation(); onQuery(''); onConditions([]); setStep(null); }} className="ml-auto flex size-5 flex-shrink-0 items-center justify-center rounded text-[#9ca3af] hover:bg-[#EEF2F6] hover:text-[#364658]"><X size={13} /></button>
        )}
      </div>

      {step && pos && createPortal(
        <div ref={menuRef} style={{ left: pos.left, top: pos.top }} className="fixed z-[10070] w-[300px] rounded-lg border border-[#DFE5ED] bg-white py-1 shadow-lg">
          {!step.field && (
            <>
              <div className={head}>Filter by field</div>
              <div className="max-h-[320px] overflow-y-auto">
                {fields.map((f) => (
                  <button key={f.label} type="button" onClick={() => setStep({ field: f.label })} className={item}>{f.label}<ChevronRight size={14} className="text-[#9CA3AF]" /></button>
                ))}
              </div>
            </>
          )}
          {step.field && !step.op && (
            <>
              <div className={`${head} flex items-center gap-1`}>{back({})}{step.field}</div>
              {OPERATORS.map((op) => (
                <button key={op} type="button" onClick={() => { setStep({ ...step, op }); setValueQ(''); setTimeout(() => valueRef.current?.focus(), 0); }} className={item}>{op}<ChevronRight size={14} className="text-[#9CA3AF]" /></button>
              ))}
            </>
          )}
          {step.field && step.op && (
            <>
              <div className={`${head} flex items-center gap-1`}>{back({ field: step.field })}{step.field} {step.op}</div>
              <div className="px-3 pb-2">
                <input
                  ref={valueRef}
                  value={valueQ}
                  onChange={(e) => setValueQ(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') add(isListOp(step.op!) && values.length === 1 ? values[0] : valueQ); }}
                  placeholder={isListOp(step.op) ? 'Search values...' : 'Type a value, then Enter'}
                  className="h-8 w-full rounded border border-[#E5E7EB] bg-[#F9FAFB] px-3 text-[13px] text-[#364658] placeholder:text-[#9CA3AF] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#3D8BD0]"
                />
              </div>
              {isListOp(step.op) && (
                <div className="max-h-[240px] overflow-y-auto">
                  {values.map((v) => <button key={v} type="button" onClick={() => add(v)} className={item}><span className="truncate">{v}</span></button>)}
                  {values.length === 0 && <div className="px-3 py-3 text-center text-[13px] text-[#9CA3AF]">No matching values</div>}
                </div>
              )}
            </>
          )}
        </div>,
        document.body,
      )}
    </div>
  );
}
