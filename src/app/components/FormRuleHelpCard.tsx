import { useState } from 'react';
import { AlertTriangle, ArrowRight, ArrowUpRight, ChevronDown, CirclePlay, Copy, EyeOff, History, Lightbulb, Split, Undo2, Workflow } from 'lucide-react';
import { ConflictArt } from './FormRuleRelatedView';

/**
 * V3's right panel — the module's HELP CARD (Zeni's Figma "Help guide Card UI Inspiration",
 * file ZfMxIUAltqGMXlpW0dVmkP node 1719-23285, 9 Oct 2026): light-grey section cards that fold. The copy is
 * Zeni's FINAL text (two sections: How Form Rules Work · Conflicts and Similar Rules); only the FIRST
 * section starts open.
 *
 * ⚠️ Deliberately LIGHTER than the doc guide: the full, searchable guide is the GLOBAL Help guide
 * popup (header ⓘ, `openGlobalHelp`), which this card links to at its foot.
 */

/** Opens the global Help guide popup on this module. */
export const openGlobalHelp = () => window.dispatchEvent(new CustomEvent('open-global-help'));

/** Four looks of the same accordion, compared from the tabs beside Cancel / Save Rule (Zeni, 12 Oct 2026):
 *  grouped = each group is ONE bordered card with dividers · lines = no card, hairline rows ·
 *  cards = every topic is its own card · soft = grey filled tiles, no borders.
 *  (Steps, Nested and Tabbed were tried the same day and dropped.) */
export type HelpLook = 'grouped' | 'lines' | 'cards' | 'soft';
export const HELP_LOOKS: { id: HelpLook; label: string }[] = [
  { id: 'grouped', label: 'Grouped' },
  { id: 'lines', label: 'Lines' },
  { id: 'cards', label: 'Cards' },
  { id: 'soft', label: 'Soft' },
];

type Topic = {
  id: string;
  icon: React.ReactNode;
  title: string;
  text: string;
  example?: string;
  /** A small still picture of the example, drawn above its sentence (Zeni, 12 Oct 2026). */
  art?: React.ReactNode;
  points?: [string, string][];
  closing?: string;
};
type TopicGroup = { title: string; intro: string; topics: Topic[] };

/* Final copy (Zeni, 12 Oct 2026 — do not rewrite). Only its presentation changes. */
const GROUPS: TopicGroup[] = [
  {
    title: 'How Form Rules Work',
    intro: 'Form Rules let you control how a form behaves based on specified conditions. When the conditions are met, the configured actions determine what happens on the form.',
    topics: [
      { id: 'when', icon: <History size={13} />, title: 'When to Run & Execution',
        text: 'Choose when the rule is triggered, such as while the form is being filled or when it is submitted. Select whether it applies during record creation, editing, or both, and choose who the rule applies to, such as requesters, technicians, or everyone.' },
      { id: 'conditions', icon: <Split size={13} className="rotate-180" />, title: 'Conditions',
        text: 'Define the criteria that determine when the rule should run. Add multiple conditions or condition groups when your rule needs to check more than one criterion.' },
      { id: 'actions', icon: <Workflow size={13} />, title: 'Actions',
        text: "Define what the rule should do when its conditions are met. Add one or more actions to control the form's behavior according to your requirement." },
      { id: 'reverse', icon: <Undo2 size={13} />, title: 'Reverse Action',
        text: "If reverse actions are enabled for a configured action, check how the form should behave when the rule's conditions are no longer met.",
        art: <ReverseArt />,
        example: 'Suppose you want to show specific fields only for the HR department. Create a rule that shows the HR-related fields when the department is HR and enable the reverse action. Now, if the user changes the department to any other department, those HR-specific fields will be hidden automatically.' },
    ],
  },
  {
    title: 'Rule Conflicts & Similar Rules',
    intro: 'Existing rules may be flagged when their configurations conflict with or closely match the rule you are creating. Review the detected rules before saving.',
    topics: [
      { id: 'conflict', icon: <AlertTriangle size={13} />, title: 'Conflict',
        text: 'A conflict occurs when two rules can apply under overlapping conditions but produce incompatible results, such as showing and hiding an element or enabling and disabling it.',
        art: <div className="overflow-hidden rounded-md border border-[#E5E9F0] bg-white"><ConflictArt /></div>,
        example: 'One rule shows a status field while another hides it under the same conditions.' },
      { id: 'similar', icon: <Copy size={13} />, title: 'Similar Rule',
        text: 'An existing rule already uses the same event and conditions. Consider adding the required actions to that rule instead of creating a separate one.',
        art: <SimilarArt />,
        example: 'An existing rule runs when Priority is High. If you need another action under the same conditions, consider adding it to that rule.' },
      { id: 'resolve', icon: <Lightbulb size={13} />, title: 'How to Resolve Conflicts',
        text: 'Select a detected rule to review its configuration. Check these settings to identify the cause:',
        points: [
          ['Rule Event & Execution', 'Check when each rule runs, whether it applies on create or edit, and which users it applies to.'],
          ['Reverse Action', 'Verify whether reverse actions are enabled and whether they contribute to the unexpected behavior.'],
          ['Conditions & Actions', 'Check whether the conditions overlap and whether the configured actions produce conflicting results.'],
        ],
        closing: 'Adjust the conditions or actions, or update the existing rule where appropriate. Review the changes before saving.' },
    ],
  },
];

/* ── Example pictures: mini rule cards drawn like the builder's own rows, static (Zeni, 12 Oct 2026).
      They sit above the example sentence and never replace it. Function declarations, so GROUPS above
      can use them. ── */
const ART_CARD = 'min-w-0 flex-1 rounded-md border border-[#E5E9F0] bg-white p-2';
const ART_HEAD = 'text-[10px] font-semibold text-[#7B8FA5]';
const ART_NOTE = 'mt-1.5 text-[10.5px] leading-[1.4] text-[#64748B]';

/** Similar Rule: an existing rule and yours share the SAME If line; only the Then differs. */
function SimilarArt() {
  const rule = (name: string, then: string, yours: boolean) => (
    <div className={ART_CARD}>
      <div className={ART_HEAD}>{name}</div>
      <div className="mt-1.5 flex items-center gap-1.5">
        <span className="w-7 flex-shrink-0 text-[10px] text-[#94A3B8]">If</span>
        <span className="min-w-0 truncate rounded border border-[#F2D58A] bg-[#FFF9E8] px-1.5 py-0.5 text-[10.5px] font-medium text-[#B45309]">Priority is High</span>
      </div>
      <div className="mt-1 flex items-center gap-1.5">
        <span className="w-7 flex-shrink-0 text-[10px] text-[#94A3B8]">Then</span>
        <span className={'min-w-0 truncate rounded border px-1.5 py-0.5 text-[10.5px] font-medium ' + (yours ? 'border-dashed border-[#94A3B8] bg-white text-[#475569]' : 'border-[#E5E9F0] bg-[#F7F9FC] text-[#475569]')}>{then}</span>
      </div>
    </div>
  );
  return (
    <div aria-hidden="true">
      <div className="flex items-stretch gap-2">
        {rule('Existing rule', 'Mandate Impact', false)}
        {rule('Your rule', 'Hide Category', true)}
      </div>
      <div className={ART_NOTE + ' flex items-center gap-1'}>
        <span className="size-1.5 flex-shrink-0 rounded-full bg-[#D9A441]" /> Same trigger and conditions
        <ArrowRight size={11} className="mx-0.5 flex-shrink-0 text-[#94A3B8]" /> add your action to the existing rule
      </div>
    </div>
  );
}

/** Reverse Action: the same form in two states — conditions met, then no longer met. */
function ReverseArt() {
  const field = (label: string, value?: string) => (
    <div className="mt-1 flex items-center gap-1.5">
      <span className="w-[66px] flex-shrink-0 truncate text-[10px] text-[#64748B]">{label}</span>
      <span className={'h-[18px] min-w-0 flex-1 truncate rounded border border-[#E5E9F0] px-1.5 text-[10.5px] leading-[16px] ' + (value ? 'bg-white font-medium text-[#1D2A3E]' : 'bg-[#F7F9FC]')}>{value}</span>
    </div>
  );
  const hidden = (
    <div className="mt-1 flex h-[18px] items-center justify-center gap-1 rounded border border-dashed border-[#CBD5E1] text-[10px] text-[#94A3B8]">
      <EyeOff size={10} /> Hidden
    </div>
  );
  const form = (dept: string, shown: boolean, note: string) => (
    <div className="min-w-0 flex-1">
      <div className={ART_CARD}>
        {field('Department', dept)}
        {shown ? field('Employee ID') : hidden}
        {shown ? field('Joining date') : hidden}
      </div>
      <div className={ART_NOTE}>{note}</div>
    </div>
  );
  return (
    <div className="flex items-start gap-1.5" aria-hidden="true">
      {form('HR', true, 'Conditions met: HR fields shown')}
      <ArrowRight size={13} className="mt-[30px] flex-shrink-0 text-[#94A3B8]" />
      {form('Sales', false, 'No longer met: hidden again')}
    </div>
  );
}

function TopicRow({ topic, open, onToggle, look }: { topic: Topic; open: boolean; onToggle: () => void; look: HelpLook }) {
  const flat = look === 'lines';
  const pad = flat ? 'px-0' : 'px-3';
  const shell = look === 'cards' ? 'rounded-lg border bg-white transition-colors ' + (open ? 'border-[#CBD5E1]' : 'border-[#E5E9F0] hover:border-[#CBD5E1]')
    : look === 'soft' ? 'rounded-lg transition-colors ' + (open ? 'bg-[#F4F6FA]' : 'bg-[#F7F9FC] hover:bg-[#F1F4F9]') : '';
  const badge = 'rounded text-[#64748B] ' + (look === 'lines' ? '' : look === 'soft' ? 'bg-white' : 'bg-[#F1F5F9]');
  return (
    <div className={shell}>
      <button type="button" onClick={onToggle} aria-expanded={open}
        className={'group flex w-full items-center gap-2.5 py-2.5 text-left ' + pad}>
        {/* grey for every topic (Zeni): the guide stays quiet beside the coloured builder */}
        <span className={'flex size-6 flex-shrink-0 items-center justify-center ' + badge}>{topic.icon}</span>
        <span className={'min-w-0 flex-1 text-[13px] text-[#1D2A3E] ' + (open ? 'font-semibold' : 'font-medium')}>{topic.title}</span>
        <ChevronDown size={15} className={'flex-shrink-0 text-[#94A3B8] transition-transform duration-200 group-hover:text-[#475569] ' + (open ? 'rotate-180' : '')} />
      </button>
      <div className="grid transition-[grid-template-rows] duration-200 ease-out" style={{ gridTemplateRows: open ? '1fr' : '0fr' }}>
        <div className="min-h-0 overflow-hidden">
          {/* the text hangs under the title, clear of the icon */}
          <div className={'pb-3.5 text-[12.5px] leading-[1.6] text-[#475569] ' + (flat ? 'pl-[34px]' : 'pl-[46px] pr-3')}>
            <p>{topic.text}</p>
            {topic.points && (
              <ul className="mt-2 flex flex-col gap-1.5">
                {topic.points.map(([label, text]) => (
                  <li key={label} className="flex gap-2">
                    <span className="mt-[8px] size-1 flex-shrink-0 rounded-full bg-[#94A3B8]" />
                    <span className="min-w-0 flex-1"><b className="font-semibold text-[#1D2A3E]">{label}:</b> {text}</span>
                  </li>
                ))}
              </ul>
            )}
            {topic.closing && <p className="mt-2">{topic.closing}</p>}
            {topic.example && (
              <div className={'mt-2.5 rounded-md px-3 py-2 ' + (look === 'soft' ? 'bg-white' : 'bg-[#F7F9FC]')}>
                <div className="text-[10.5px] font-semibold uppercase tracking-wider text-[#94A3B8]">Example</div>
                {topic.art && <div className="mb-2 mt-1.5">{topic.art}</div>}
                <p className="mt-0.5 text-[#475569]">{topic.example}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/** The Help guide: two groups of small accordions. EVERY topic is open on arrival and each folds on its
 *  own (Zeni, 12 Oct 2026 — it was one-at-a-time with only the first open earlier the same day). */
export function FormRuleHelpSections({ onWatch, look = 'grouped' }: { onWatch: () => void; look?: HelpLook }) {
  const [shut, setShut] = useState<string[]>([]);
  const list = look === 'grouped' ? 'divide-y divide-[#EEF2F6] rounded-lg border border-[#E5E9F0] bg-white'
    : look === 'lines' ? 'divide-y divide-[#EEF2F6] border-y border-[#EEF2F6]'
    : look === 'soft' ? 'flex flex-col gap-1.5' : 'flex flex-col gap-2';
  return (
    <>
    <div className="flex flex-col gap-6">
      {GROUPS.map((g) => (
        <section key={g.title}>
          <h3 className="mb-1 text-[13.5px] font-semibold text-[#1D2A3E]">{g.title}</h3>
          <p className="text-[12.5px] leading-[1.55] text-[#64748B]">{g.intro}</p>
          <div className={'mt-3 ' + list}>
            {g.topics.map((t) => (
              <TopicRow key={t.id} topic={t} look={look} open={!shut.includes(t.id)} onToggle={() => setShut((x) => (x.includes(t.id) ? x.filter((i) => i !== t.id) : [...x, t.id]))} />
            ))}
          </div>
        </section>
      ))}
    </div>

    <div className="mt-5 flex items-center gap-4 text-[12.5px]">
      <button type="button" onClick={openGlobalHelp} className="inline-flex items-center gap-1 text-[12.5px] font-medium text-[#3D8BD0] hover:underline">
        Open the full guide <ArrowUpRight size={13} />
      </button>
      <button type="button" onClick={onWatch} className="inline-flex items-center gap-1 text-[12.5px] font-medium text-[#3D8BD0] hover:underline">
        <CirclePlay size={13} /> Watch the 1-min video
      </button>
    </div>
    </>
  );
}

export function FormRuleHelpCard({ ruleCheck, onWatch, look = 'grouped' }: {
  /** The Rule check block — the conflicts / similar summary cards, or the "All clear so far" card
   *  while nothing is found. It sits UPFRONT, above the Help guide, and does not scroll away. */
  ruleCheck: (compact: boolean) => React.ReactNode;
  onWatch: () => void;
  look?: HelpLook;
}) {
  /* SCROLLING the Help guide folds the Rule check to count + title, so the guide slides up into the room
     (Zeni, 9 Oct 2026 — on scroll, not on hover). Scrolled back to the top, it unfolds. The wheel counts
     too, so a guide short enough not to scroll still folds the cards when someone scrolls over it. */
  const [compact, setCompact] = useState(false);

  return (
    <div className="flex h-full min-h-0 flex-col border-l border-[#DFE5ED] bg-white">
      {/* Rule check first (Zeni, 9 Oct 2026): what the editor found about THIS rule outranks how-to help. */}
      <div className="flex-shrink-0 border-b border-[#EEF2F6] p-4">
        {ruleCheck(compact)}
      </div>
      <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-shrink-0 px-4 pb-3 pt-3.5">
        {/* The reference's title: a dark accent bar before the words. */}
        <div className="flex items-center gap-2">
          <span className="h-[18px] w-[3px] flex-shrink-0 rounded-full bg-[#1D2A3E]" />
          <h2 className="min-w-0 flex-1 text-[16px] font-medium text-[#1D2A3E]">Form Rules Guide</h2>
        </div>
        <p className="mt-1 pl-[11px] text-[12.5px] text-[#64748B]">Learn how to configure rules and identify potential conflicts.</p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-5"
        onScroll={(e) => setCompact(e.currentTarget.scrollTop > 4)}
        onWheel={(e) => { if (e.deltaY > 0) setCompact(true); else if (e.deltaY < 0 && e.currentTarget.scrollTop <= 0) setCompact(false); }}>
        <FormRuleHelpSections onWatch={onWatch} look={look} />
      </div>
      </div>
    </div>
  );
}
