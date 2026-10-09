import { useState } from 'react';
import { ArrowUpRight, ChevronDown, CirclePlay } from 'lucide-react';
import { FindingCard } from './FormRuleHelpPanel';

/**
 * V3's right panel — the module's HELP CARD (Zeni's Figma "Help guide Card UI Inspiration",
 * file ZfMxIUAltqGMXlpW0dVmkP node 1719-23285, 9 Oct 2026). One scroll of light-grey section cards
 * that fold: a definition, key terms with "E.g." lines, how a rule is evaluated (a dotted model, the
 * example rule as a FIELD / VALUE table, a worked table of requests with Runs / Skipped pills and a
 * legend), actions at a glance, conflicts, and a pre-save list.
 *
 * ⚠️ Deliberately LIGHTER than the doc guide: the full, searchable guide is the GLOBAL Help guide
 * popup (header ⓘ, `openGlobalHelp`), which this card links to at its foot.
 */

const rich = (s: string) => s.split('**').map((p, i) => (i % 2 ? <b key={i} className="font-semibold text-[#1D2A3E]">{p}</b> : p));

/** Opens the global Help guide popup on this module. */
export const openGlobalHelp = () => window.dispatchEvent(new CustomEvent('open-global-help'));

function Section({ title, open, onToggle, children }: { title: string; open: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <section className="rounded-lg bg-[#F1F4F9]">
      <button type="button" onClick={onToggle} aria-expanded={open}
        className="flex w-full items-center gap-2 px-4 pb-2 pt-3.5 text-left">
        <span className="min-w-0 flex-1 text-[15px] font-medium text-[#1D2A3E]">{title}</span>
        <ChevronDown size={16} className={'flex-shrink-0 text-[#475569] transition-transform ' + (open ? '' : '-rotate-90')} />
      </button>
      {open ? <div className="px-4 pb-4 text-[13px] leading-[1.6] text-[#364658]">{children}</div> : <div className="pb-1.5" />}
    </section>
  );
}

const P = ({ children, className = '' }: { children: string; className?: string }) => <p className={'mt-1.5 ' + className}>{rich(children)}</p>;
const Eg = ({ children }: { children: string }) => <p className="mt-1 pl-4 text-[#6B7A99] [&_b]:text-[#475569]">E.g., {rich(children)}</p>;
const Bullets = ({ items }: { items: string[] }) => (
  <ul className="mt-2 flex flex-col gap-1.5">
    {items.map((t) => <li key={t} className="flex gap-2"><span className="mt-[9px] size-1 flex-shrink-0 rounded-full bg-[#364658]" /><span className="min-w-0">{rich(t)}</span></li>)}
  </ul>
);
const Term = ({ name, children, eg }: { name: string; children: string; eg: string }) => (
  <div className="mt-3 first:mt-1">
    <div className="text-[13px] font-semibold text-[#1D2A3E]">{name}</div>
    <P className="!mt-0.5">{children}</P>
    <Eg>{eg}</Eg>
  </div>
);
/** The reference's model list: dark dots joined by a thin rail. */
const DotSteps = ({ items }: { items: string[] }) => (
  <ul className="mt-2 flex flex-col">
    {items.map((t, i) => (
      <li key={t} className="relative flex items-center gap-3 py-1">
        {i < items.length - 1 && <span className="absolute left-[3.5px] top-1/2 h-full w-px bg-[#94A3B8]" />}
        <span className="relative size-2 flex-shrink-0 rounded-full bg-[#1D2A3E]" />
        <span className="font-medium text-[#1D2A3E]">{t}</span>
      </li>
    ))}
  </ul>
);
const Table = ({ head, rows, pill }: { head: string[]; rows: string[][]; pill?: number }) => (
  <div className="mt-3 overflow-hidden rounded-md border border-[#E2E8F0] bg-white">
    <table className="w-full table-fixed border-collapse text-left text-[12px]">
      <thead>
        <tr className="border-b border-[#EEF2F6]">
          {head.map((h) => <th key={h} className="px-3 py-2 text-[10.5px] font-medium uppercase tracking-wide text-[#6B7A99]">{h}</th>)}
        </tr>
      </thead>
      <tbody className="divide-y divide-[#EEF2F6]">
        {rows.map((r) => (
          <tr key={r.join('|')}>
            {r.map((c, i) => (
              <td key={i} className="px-3 py-2 align-top text-[#364658]">
                {i === pill
                  ? <span className={'inline-flex rounded-full px-2 py-px text-[11px] font-medium ' + (c === 'Runs' ? 'bg-[#DCFCE7] text-[#15803D]' : 'bg-[#FEE2E2] text-[#B91C1C]')}>{c}</span>
                  : rich(c)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export function FormRuleHelpCard({ ready, conflicts, conflictRules, similar, onOpenConflicts, onOpenSimilar, onWatch }: {
  ready: boolean;
  conflicts: number;
  conflictRules: number;
  similar: number;
  onOpenConflicts: () => void;
  onOpenSimilar: () => void;
  onWatch: () => void;
}) {
  const [open, setOpen] = useState<string[]>(['what', 'terms', 'how']);
  const sec = (id: string) => ({ open: open.includes(id), onToggle: () => setOpen((o) => (o.includes(id) ? o.filter((x) => x !== id) : [...o, id])) });
  const found = ready && (conflicts > 0 || similar > 0);

  return (
    <div className="flex h-full min-h-0 flex-col border-l border-[#DFE5ED] bg-white">
      <div className="flex min-h-[52px] flex-shrink-0 items-center gap-2 px-4 py-3">
        {/* The reference's title: a dark accent bar before the words. */}
        <span className="h-[18px] w-[3px] flex-shrink-0 rounded-full bg-[#1D2A3E]" />
        <h2 className="min-w-0 flex-1 text-[16px] font-medium text-[#1D2A3E]">Help guide</h2>
        {found && conflicts > 0 && (
          <FindingCard tone="red" n={conflicts} label={conflicts === 1 ? 'Conflict' : 'Conflicts'}
            tip={`With ${conflictRules} rule${conflictRules === 1 ? '' : 's'} — fix before saving`} onClick={onOpenConflicts} />
        )}
        {found && similar > 0 && (
          <FindingCard tone="amber" n={similar} label={similar === 1 ? 'Similar rule' : 'Similar rules'}
            tip="Same trigger and conditions as yours" onClick={onOpenSimilar} />
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-5">
        <div className="flex flex-col gap-3">
          <Section title="What is a form rule?" {...sec('what')}>
            <P className="!mt-0">A **form rule** changes the request form by itself — it can show, hide, require, lock or fill a field when something happens on the form.</P>
            <Bullets items={[
              'Rules act while someone is **using the form** — on the self-service portal or the technician screen.',
              'Each rule has three parts: **When** it runs, **Check if** it should act, and **Then** what it changes.',
              'Rules run in the order of the Form Rules list. If two rules change the same field, the **last one wins**.',
            ]} />
          </Section>

          <Section title="Key terms" {...sec('terms')}>
            <Term name="Rule event" eg="**While the form is being filled** shows Vendor the moment Category becomes Hardware.">The moment the rule is checked — when the form **opens**, **while it is being filled**, or when it is **submitted**.</Term>
            <Term name="Execute on" eg="**On Edit** locks Category once a request has been raised.">Whether the rule works on **new** requests, **existing** ones, or both.</Term>
            <Term name="Applicable for" eg="**Requesters Only** hides Technician Group from the portal form.">Who the rule works for — **requesters**, **technicians**, or **everyone**.</Term>
            <Term name="Condition" eg="**Priority is High AND Category is Network** — both must be true.">A check on one field. Join checks with **AND** (all must pass) or **OR** (any one is enough).</Term>
            <Term name="Action" eg="**Mandate Impact** makes Impact required before the form can be saved.">What the rule does to one or more fields: hide, show, mandate, make optional, disable, enable, set or clear a value.</Term>
          </Section>

          <Section title="How a rule is evaluated" {...sec('how')}>
            <P className="!mt-0">Every rule follows the same simple model:</P>
            <DotSteps items={['Rule event', 'Execute on and Applicable for', 'Conditions (Check if)', 'Actions (Then)']} />
            <P className="!mt-3">The service desk wants every **High-priority Network** request to say how many users are affected, so it makes **Impact** mandatory for those requests only.</P>
            <P>While a requester fills a new request, the rule checks **Priority** and **Category**. If both match, **Impact** becomes mandatory. If not, the form is left as it is.</P>
            <Table head={['Field', 'Value']} rows={[
              ['Rule Name', 'Network outages need impact'],
              ['Rule Event', 'While the form is being filled'],
              ['Execute on', 'On Create'],
              ['Applicable for', 'Everyone'],
              ['Condition', 'Priority is High AND Category is Network'],
              ['Action', 'Mandate Impact'],
            ]} />
            <P className="!mt-3">Here is how it plays out on four new requests:</P>
            <Table head={['Request', 'Priority', 'Category', 'Impact', 'Result']} pill={4} rows={[
              ['REQ-101', 'High', 'Network', 'Mandatory', 'Runs'],
              ['REQ-102', 'High', 'Software', 'Optional', 'Skipped'],
              ['REQ-103', 'Low', 'Network', 'Optional', 'Skipped'],
              ['REQ-104', 'High', 'Network', 'Mandatory', 'Runs'],
            ]} />
            <Bullets items={[
              'Each row is one request being filled in.',
              '**Runs** means every condition matched, so the action was applied.',
              '**Skipped** means at least one condition did not match, so the form was left alone.',
              'With **OR** instead of AND, REQ-102 and REQ-103 would also run.',
            ]} />
          </Section>

          <Section title="Actions at a glance" {...sec('actions')}>
            <Table head={['Action', 'What happens on the form']} rows={[
              ['Mandate', 'The field must be filled before saving'],
              ['Make optional', 'A required field may be left empty'],
              ['Hide', 'The field is taken off the form (its value is kept)'],
              ['Show', 'A hidden field comes back'],
              ['Disable', 'The field is visible but read-only'],
              ['Enable', 'A read-only field can be edited again'],
              ['Set value', 'The field is filled with a value you choose'],
              ['Clear value', 'The field is emptied'],
            ]} />
            <P className="!mt-3">**Hide does not clear.** Add **Clear value** too if the old answer should not be saved.</P>
          </Section>

          <Section title="Conflicts and similar rules" {...sec('checks')}>
            <Term name="Conflict" eg="Your rule **hides Status** while “Status Always Visible” **shows** it.">Another rule changes the same field the opposite way at the same time. Fix it before saving.</Term>
            <Term name="Similar rule" eg="“Assignment Policy” already runs **while the form is being filled** when **Priority is High**.">Another rule already uses your event and conditions. Add your actions there instead of making a new rule.</Term>
            <P className="!mt-3">Both appear at the top of this panel as soon as they are found — click one to see the details.</P>
          </Section>

          <Section title="Before you save" {...sec('save')}>
            <Bullets items={[
              'The name says what the rule does, e.g. “Network outages need impact”.',
              'The event matches the moment you mean — opening, filling or submitting.',
              'Execute on and Applicable for cover the right requests and people.',
              'No conflicts are left at the top of this panel.',
            ]} />
          </Section>
        </div>

        <div className="mt-4 flex items-center gap-4 px-1 text-[12.5px]">
          <button type="button" onClick={openGlobalHelp} className="inline-flex items-center gap-1 font-medium text-[#3D8BD0] hover:underline">
            Open the full guide <ArrowUpRight size={13} />
          </button>
          <button type="button" onClick={onWatch} className="inline-flex items-center gap-1 font-medium text-[#3D8BD0] hover:underline">
            <CirclePlay size={13} /> Watch the 1-min video
          </button>
        </div>
      </div>
    </div>
  );
}
