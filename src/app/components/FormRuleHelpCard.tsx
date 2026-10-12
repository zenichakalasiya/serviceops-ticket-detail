import { useState } from 'react';
import { ArrowUpRight, ChevronDown, CirclePlay } from 'lucide-react';

/**
 * V3's right panel — the module's HELP CARD (Zeni's Figma "Help guide Card UI Inspiration",
 * file ZfMxIUAltqGMXlpW0dVmkP node 1719-23285, 9 Oct 2026): light-grey section cards that fold. The copy is
 * Zeni's FINAL text (two sections: How Form Rules Work · Conflicts and Similar Rules); only the FIRST
 * section starts open.
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
const Term = ({ name, children, example }: { name: string; children: string; example?: string }) => (
  /* a bullet point with a BOLD title (Zeni, 12 Oct 2026); the text hangs under the title, clear of the dot */
  <div className="mt-3 flex gap-2 first:mt-1">
    <span className="mt-[7px] size-[5px] flex-shrink-0 rounded-full bg-[#1D2A3E]" />
    <div className="min-w-0 flex-1">
      <div className="text-[13px] font-bold text-[#1D2A3E]">{name}</div>
      <P className="!mt-0.5">{children}</P>
      {example && <p className="mt-1 pl-4 text-[#6B7A99]">Example: {example}</p>}
    </div>
  </div>
);

/** The Help guide copy itself — shared by V3's Help Card and V4's Help guide tab. Only the FIRST
 *  section starts open. */
export function FormRuleHelpSections({ onWatch }: { onWatch: () => void }) {
  const [open, setOpen] = useState<string[]>(['how']);
  const sec = (id: string) => ({ open: open.includes(id), onToggle: () => setOpen((o) => (o.includes(id) ? o.filter((x) => x !== id) : [...o, id])) });
  return (
    <>
    <div className="flex flex-col gap-3">
      {/* Final copy (Zeni, 9 Oct 2026). Only the FIRST section starts open. */}
      <Section title="How Form Rules Work" {...sec('how')}>
        <P className="!mt-0">Form Rules dynamically control how fields behave based on conditions.</P>
        <Term name="When to Run & Execution">Choose when the rule is triggered and whether it applies during record creation, editing, or both.</Term>
        <Term name="Conditions">Define when the rule should apply. Use **Match All** to require every condition or **Match Any** to require at least one.</Term>
        <Term name="Actions">Choose what happens when conditions match, such as showing, hiding, requiring, or disabling fields.</Term>
      </Section>

      <Section title="Conflicts and Similar Rules" {...sec('checks')}>
        <Term name="Conflict" example="One rule hides Status while another shows it.">Two rules perform opposite actions on the same field under overlapping conditions.</Term>
        <Term name="Similar Rule">Another rule already uses the same event and conditions. Consider adding your actions to the existing rule instead.</Term>
        <Term name="How to Resolve Conflicts">Review the rule event, execution settings, reverse action, conditions, and conflicting actions. Select the detected rule to review its details and adjust the rules as needed.</Term>
      </Section>
    </div>

    <div className="mt-4 flex items-center gap-4 px-1 text-[12.5px]">
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

export function FormRuleHelpCard({ ruleCheck, onWatch }: {
  /** The Rule check block — the conflicts / similar summary cards, or the "All clear so far" card
   *  while nothing is found. It sits UPFRONT, above the Help guide, and does not scroll away. */
  ruleCheck: (compact: boolean) => React.ReactNode;
  onWatch: () => void;
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
      <div className="flex min-h-[52px] flex-shrink-0 items-center gap-2 px-4 py-3">
        {/* The reference's title: a dark accent bar before the words. */}
        <span className="h-[18px] w-[3px] flex-shrink-0 rounded-full bg-[#1D2A3E]" />
        <h2 className="min-w-0 flex-1 text-[16px] font-medium text-[#1D2A3E]">Help guide</h2>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-5"
        onScroll={(e) => setCompact(e.currentTarget.scrollTop > 4)}
        onWheel={(e) => { if (e.deltaY > 0) setCompact(true); else if (e.deltaY < 0 && e.currentTarget.scrollTop <= 0) setCompact(false); }}>
        <FormRuleHelpSections onWatch={onWatch} />
      </div>
      </div>
    </div>
  );
}
