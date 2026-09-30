import { useMemo, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import type { ActionType, FormField, FormRule } from './formRuleData';
import { effectsOf, findConflicts } from './formRuleEngine';
import type { RuleConflict } from './formRuleEngine';
import { ToggleSwitch } from './FormRuleControls';

/* J · Field matrix — the audit view of every rule at once. Fields down the side, rules across the
 * top (in run order), and in each cell what that rule does to that field. A cell is red when that
 * rule clashes with another rule on that field, so a mess across many rules reads as a red column
 * or row rather than as twenty separate warnings. Clicking a rule's header opens it. */

const WORD: Record<ActionType, { text: string; tone: string }> = {
  Mandate: { text: 'Mandatory', tone: '#3D8BD0' },
  'Make optional': { text: 'Optional', tone: '#64748B' },
  Hide: { text: 'Hide', tone: '#7B8FA5' },
  Show: { text: 'Show', tone: '#4D8A1A' },
  Disable: { text: 'Read-only', tone: '#8B5CF6' },
  Enable: { text: 'Editable', tone: '#0E9384' },
  'Set value': { text: 'Set', tone: '#C2410C' },
  'Clear value': { text: 'Clear', tone: '#C2410C' },
};

export function AdminFormRuleMatrix({ rules, fields, onEditRule }: {
  rules: FormRule[];
  fields: FormField[];
  onEditRule: (id: string) => void;
}) {
  const [onlyClashes, setOnlyClashes] = useState(false);
  const [showDisabled, setShowDisabled] = useState(false);

  const cols = rules.map((r, i) => ({ r, order: i + 1 })).filter((x) => showDisabled || x.r.enabled);

  /** Conflicts keyed by "ruleId|fieldId", from BOTH sides so each rule's cell lights up. */
  const clashes = useMemo(() => {
    const m = new Map<string, RuleConflict[]>();
    rules.forEach((r, i) => {
      if (!r.enabled) return;
      findConflicts(r, rules, fields, i).forEach((c) => {
        const k = `${r.id}|${c.fieldId}`;
        m.set(k, [...(m.get(k) ?? []), c]);
      });
    });
    return m;
  }, [rules, fields]);

  const cell = (r: FormRule, fid: string) => effectsOf(r, fields).filter((e) => e.fieldId === fid);
  const touched = fields.filter((f) => rules.some((r) => cell(r, f.id).length > 0));
  const rows = touched.filter((f) => !onlyClashes || cols.some(({ r }) => clashes.has(`${r.id}|${f.id}`)));
  const clashCells = [...clashes.keys()].filter((k) => cols.some(({ r }) => k.startsWith(`${r.id}|`))).length;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-4">
        <p className="text-[13px] text-[#64748B]">
          <span className="font-medium text-[#364658]">{touched.length}</span> fields changed by <span className="font-medium text-[#364658]">{cols.length}</span> rules ·{' '}
          <span className={clashCells ? 'font-medium text-[#DC2626]' : 'font-medium text-[#4D8A1A]'}>{clashCells} conflicting cell{clashCells === 1 ? '' : 's'}</span>
        </p>
        <label className="ml-auto flex items-center gap-2 text-[12px] text-[#364658]"><ToggleSwitch on={onlyClashes} onChange={setOnlyClashes} /> Only fields with conflicts</label>
        <label className="flex items-center gap-2 text-[12px] text-[#364658]"><ToggleSwitch on={showDisabled} onChange={setShowDisabled} /> Include disabled rules</label>
      </div>

      <div className="-mx-4 max-h-[calc(100vh-290px)] overflow-auto border-y border-[#E5E7EB]">
        <table className="border-separate border-spacing-0 text-[12px]">
          <thead>
            <tr>
              <th className="sticky left-0 top-0 z-30 min-w-[180px] border-b border-r border-[#E5E7EB] bg-white px-4 py-2.5 text-left text-[12px] font-semibold tracking-wider text-[#364658]">Field \ Rule</th>
              {cols.map(({ r, order }) => (
                <th key={r.id} className="sticky top-0 z-20 w-[132px] min-w-[132px] border-b border-r border-[#E5E7EB] bg-white px-2.5 py-2 text-left align-bottom font-normal">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button type="button" onClick={() => onEditRule(r.id)} className={`block w-full text-left ${r.enabled ? '' : 'opacity-50'}`}>
                        <span className="block text-[10px] tabular-nums text-[#7B8FA5]">#{order}{r.enabled ? '' : ' · off'}</span>
                        <span className="line-clamp-2 text-[12px] font-medium leading-4 text-[#364658] hover:text-[#3D8BD0]">{r.name}</span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[280px] text-wrap">{r.name} — {r.applies} · {r.execution} · {r.event}. Click to open.</TooltipContent>
                  </Tooltip>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={cols.length + 1} className="px-4 py-12 text-center text-[13px] text-[#7B8FA5]">{onlyClashes ? 'No field has a conflict — every rule agrees.' : 'No rule changes any field yet.'}</td></tr>
            )}
            {rows.map((f) => (
              <tr key={f.id} className="group">
                <td className="sticky left-0 z-10 border-b border-r border-[#E5E7EB] bg-white px-4 py-2 font-medium text-[#364658] group-hover:bg-[#F9FAFB]">{f.label}</td>
                {cols.map(({ r }) => {
                  const eff = cell(r, f.id);
                  const cs = clashes.get(`${r.id}|${f.id}`);
                  const content = (
                    <div className="flex flex-wrap gap-1">
                      {eff.map((e) => {
                        const w = WORD[e.action.type as ActionType];
                        return (
                          <span key={e.action.id + e.dim} className="rounded-sm px-1.5 text-[11px] font-medium leading-5" style={{ color: w.tone, backgroundColor: `${w.tone}14` }}>
                            {w.text}{e.action.type === 'Set value' && e.v ? ` ${e.v}` : ''}
                          </span>
                        );
                      })}
                    </div>
                  );
                  return (
                    <td key={r.id} className={`border-b border-r border-[#E5E7EB] px-2 py-1.5 align-middle ${cs ? 'bg-[#FEF6F6]' : 'group-hover:bg-[#F9FAFB]'}`}>
                      {eff.length === 0 ? <span className="text-[#E2E8F0]">·</span> : cs ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex cursor-help items-start gap-1">
                              <AlertTriangle size={11} className="mt-1 flex-shrink-0 text-[#DC2626]" />
                              {content}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-[300px] text-wrap">
                            {cs.map((x) => `${x.kind} with ${x.other.name}: ${x.theirs}.`).join(' ')}
                          </TooltipContent>
                        </Tooltip>
                      ) : content}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
