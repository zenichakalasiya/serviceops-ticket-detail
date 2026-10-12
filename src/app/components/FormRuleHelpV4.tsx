import { ArrowUpRight, BookOpen, ChevronRight, CirclePlay, Copy, History, Lightbulb, Split, TriangleAlert, Workflow } from 'lucide-react';
import { openGlobalHelp } from './FormRuleHelpCard';

/**
 * V4's Help guide tab (Zeni, 9 Oct 2026) — the same FINAL copy as V3's Help Card, laid out as ONE
 * scannable page instead of folding sections (references: Neon's diagram-over-steps panel, Mintlify's
 * icon cards, Xero's callout, Airtable's resource rows):
 *   How Form Rules Work — intro, the three parts as a connected timeline wearing the builder's OWN step
 *   badges (History blue · Split orange · Workflow green), then a worked example rule in those badges;
 *   Conflicts and Similar Rules — two icon cards, the conflict example drawn as Hide ⟷ Show;
 *   How to Resolve Conflicts — a blue tip callout;
 *   the 1-min video and the full guide as resource rows at the foot.
 * ⚠️ The words are Zeni's final text — change layout freely, not copy.
 */

const rich = (s: string) => s.split('**').map((p, i) => (i % 2 ? <b key={i} className="font-semibold text-[#1D2A3E]">{p}</b> : p));

const STEPS = [
  { icon: <History size={13} />, tone: '#3D8BD0', badge: '#E2EDF5', title: 'When to Run & Execution', text: 'Choose when the rule is triggered and whether it applies during record creation, editing, or both.' },
  { icon: <Split size={14} className="rotate-180" />, tone: '#F58518', badge: 'rgba(245,133,24,0.1)', title: 'Conditions', text: 'Define when the rule should apply. Use **Match All** to require every condition or **Match Any** to require at least one.' },
  { icon: <Workflow size={14} />, tone: '#89C540', badge: '#F3F9EC', title: 'Actions', text: 'Choose what happens when conditions match, such as showing, hiding, requiring, or disabling fields.' },
];

/** A worked example AFTER the three parts (Zeni, 9 Oct 2026 — the old When → Check if → Then diagram only
 *  repeated the step names): the same three badges, now holding a real rule's values, so the parts
 *  just read are seen filled in. */
function ExampleRule() {
  const line = (s: (typeof STEPS)[number], lead: string, value: React.ReactNode) => (
    <div className="flex items-center gap-2.5">
      <span className="flex size-6 flex-shrink-0 items-center justify-center rounded-md" style={{ background: s.badge, color: s.tone }}>{s.icon}</span>
      <span className="w-[58px] flex-shrink-0 text-[11.5px] font-medium" style={{ color: s.tone }}>{lead}</span>
      <span className="min-w-0 text-[12.5px] text-[#1D2A3E]">{value}</span>
    </div>
  );
  return (
    <div className="mt-4 rounded-xl border border-[#E8EDF3] bg-[#F8FAFC] p-3.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[11px] font-medium uppercase tracking-wide text-[#7B8FA5]">Example rule</span>
        <span className="truncate text-[12px] font-medium text-[#364658]">Network outages need impact</span>
      </div>
      <div className="mt-3 flex flex-col gap-2">
        {line(STEPS[0], 'When', <>While the form is being filled <span className="text-[#98A2B3]">·</span> On Create</>)}
        {line(STEPS[1], 'Check if', <><b className="font-semibold">Priority</b> is High</>)}
        {line(STEPS[2], 'Then', <>Make <b className="font-semibold">Impact</b> mandatory</>)}
      </div>
    </div>
  );
}

function SectionHead({ title, sub }: { title: string; sub?: string }) {
  return (
    <div>
      <h3 className="text-[15px] font-semibold text-[#1D2A3E]">{title}</h3>
      {sub && <p className="mt-1 text-[12.5px] leading-[1.55] text-[#64748B]">{sub}</p>}
    </div>
  );
}

/** A Learn-more card — two sit side by side: icon and arrow on top, title, one line of what it holds. */
function Resource({ icon, title, sub, onClick, external }: { icon: React.ReactNode; title: string; sub: string; onClick: () => void; external?: boolean }) {
  return (
    <button type="button" onClick={onClick}
      className="group flex min-w-0 flex-col rounded-lg border border-[#E8EDF3] p-3 text-left transition-colors hover:border-[#C9DDF1] hover:bg-[#F3F8FD]">
      <span className="flex items-center justify-between">
        <span className="flex size-8 items-center justify-center rounded-md bg-[#EBF5FF] text-[#3D8BD0]">{icon}</span>
        {external
          ? <ArrowUpRight size={15} className="text-[#98A2B3] group-hover:text-[#3D8BD0]" />
          : <ChevronRight size={15} className="text-[#98A2B3] transition-transform group-hover:translate-x-0.5 group-hover:text-[#3D8BD0]" />}
      </span>
      <span className="mt-2.5 block text-[13px] font-medium text-[#1D2A3E]">{title}</span>
      <span className="mt-0.5 block text-[12px] leading-[1.45] text-[#7B8FA5]">{sub}</span>
    </button>
  );
}

export function FormRuleHelpV4({ onWatch }: { onWatch: () => void }) {
  return (
    <div className="flex flex-col pb-2">
      {/* ── How Form Rules Work ── */}
      <SectionHead title="How Form Rules Work" sub="Form Rules dynamically control how fields behave based on conditions." />
      <ol className="mt-4 flex flex-col">
        {STEPS.map((s, i) => (
          <li key={s.title} className="relative flex gap-3 pb-4 last:pb-0">
            {/* the rail joining the three parts, as one rule reads top to bottom */}
            {i < STEPS.length - 1 && <span className="absolute left-[13.5px] top-8 bottom-1 w-px bg-[#E2E8F0]" />}
            <span className="relative flex size-7 flex-shrink-0 items-center justify-center rounded-md" style={{ background: s.badge, color: s.tone }}>{s.icon}</span>
            <span className="min-w-0 pt-0.5">
              <span className="block text-[13px] font-semibold text-[#1D2A3E]">{s.title}</span>
              <span className="mt-0.5 block text-[12.5px] leading-[1.55] text-[#475569]">{rich(s.text)}</span>
            </span>
          </li>
        ))}
      </ol>
      <ExampleRule />

      <div className="my-6 h-px bg-[#EEF2F6]" />

      {/* ── Conflicts and Similar Rules ── */}
      <SectionHead title="Conflicts and Similar Rules" />
      <div className="mt-3 flex flex-col gap-2.5">
        <div className="rounded-xl border border-[#F3D6D6] bg-[#FFFBFB] p-3.5">
          <div className="flex items-center gap-2.5">
            <span className="flex size-7 items-center justify-center rounded-md bg-[#FEE2E2] text-[#DC2626]"><TriangleAlert size={14} /></span>
            <span className="text-[13px] font-semibold text-[#1D2A3E]">Conflict</span>
          </div>
          <p className="mt-2 text-[12.5px] leading-[1.55] text-[#475569]">Two rules perform opposite actions on the same field under overlapping conditions.</p>
          {/* the example, drawn: two rules pulling one field opposite ways */}
          <div className="mt-2.5 rounded-lg bg-white p-2.5 ring-1 ring-[#F3D6D6]">
            <div className="flex items-center gap-2">
              <span className="min-w-0 flex-1 rounded-md bg-[#F8FAFC] px-2 py-1.5 text-center text-[12px] text-[#364658]"><span className="text-[#7B8FA5]">Rule A · </span><b className="font-semibold text-[#DC2626]">Hides</b> Status</span>
              <span className="flex-shrink-0 text-[13px] text-[#DC2626]">⟷</span>
              <span className="min-w-0 flex-1 rounded-md bg-[#F8FAFC] px-2 py-1.5 text-center text-[12px] text-[#364658]"><span className="text-[#7B8FA5]">Rule B · </span><b className="font-semibold text-[#16A34A]">Shows</b> Status</span>
            </div>
            <p className="mt-2 text-[11.5px] text-[#7B8FA5]">Example: One rule hides Status while another shows it.</p>
          </div>
        </div>

        <div className="rounded-xl border border-[#F5E3BD] bg-[#FFFDF7] p-3.5">
          <div className="flex items-center gap-2.5">
            <span className="flex size-7 items-center justify-center rounded-md bg-[#FEF3C7] text-[#B45309]"><Copy size={14} /></span>
            <span className="text-[13px] font-semibold text-[#1D2A3E]">Similar Rule</span>
          </div>
          <p className="mt-2 text-[12.5px] leading-[1.55] text-[#475569]">Another rule already uses the same event and conditions. Consider adding your actions to the existing rule instead.</p>
        </div>

        {/* How to resolve — a tip, so it reads as advice rather than a third kind of finding */}
        <div className="flex gap-3 rounded-xl border border-[#C9DDF1] bg-[#F3F8FD] p-3.5">
          <span className="flex size-7 flex-shrink-0 items-center justify-center rounded-md bg-white text-[#F59E0B] ring-1 ring-[#C9DDF1]"><Lightbulb size={14} /></span>
          <span className="min-w-0">
            <span className="block text-[13px] font-semibold text-[#1D2A3E]">How to Resolve Conflicts</span>
            <span className="mt-0.5 block text-[12.5px] leading-[1.55] text-[#475569]">Review the rule event, execution settings, reverse action, conditions, and conflicting actions. Select the detected rule to review its details and adjust the rules as needed.</span>
          </span>
        </div>
      </div>

      <div className="my-6 h-px bg-[#EEF2F6]" />

      {/* ── Resources ── */}
      <div className="mb-2 text-[11px] font-medium uppercase tracking-wide text-[#7B8FA5]">Learn more</div>
      <div className="grid grid-cols-2 gap-2">
        <Resource icon={<CirclePlay size={15} />} title="Watch the 1-min video" sub="See a rule built from start to finish" onClick={onWatch} />
        <Resource icon={<BookOpen size={15} />} title="Open the full guide" sub="Scenarios, examples and troubleshooting" onClick={openGlobalHelp} external />
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────────────────────────────────────
 * MINIMAL (Zeni, 9 Oct 2026): the same copy with nothing tinted. Icons stay so each topic is
 * recognised at a glance, but they are plain grey glyphs — colour is reserved for the Conflicts and
 * Similar rules tabs, where it MEANS something. Topics are separated by space and hairlines, not
 * filled cards; the two examples keep their pictures in a quiet bordered box. Used by V4 (default)
 * and V1's Help guide tab.
 * ─────────────────────────────────────────────────────────────────────────────────────────────── */

const MIN_ICON = 'mt-[2px] flex-shrink-0 text-[#64748B]';

function MinItem({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className={MIN_ICON}>{icon}</span>
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-semibold text-[#1D2A3E]">{title}</div>
        <div className="mt-0.5 text-[12.5px] leading-[1.6] text-[#475569]">{children}</div>
      </div>
    </li>
  );
}

const MinHead = ({ children }: { children: string }) => (
  <h3 className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#7B8FA5]">{children}</h3>
);

export function FormRuleHelpMinimal({ onWatch }: { onWatch: () => void }) {
  const learn: [React.ReactNode, string, () => void, boolean][] = [
    [<CirclePlay key="v" size={15} />, 'Watch the 1-min video', onWatch, false],
    [<BookOpen key="g" size={15} />, 'Open the full guide', openGlobalHelp, true],
  ];
  return (
    <div className="flex flex-col">
      <h2 className="text-[16px] font-semibold text-[#1D2A3E]">How Form Rules Work</h2>
      <p className="mt-1 text-[12.5px] leading-[1.6] text-[#64748B]">Form Rules dynamically control how fields behave based on conditions.</p>

      <ul className="mt-5 flex flex-col gap-4">
        <MinItem icon={<History size={15} />} title="When to Run & Execution">{rich(STEPS[0].text)}</MinItem>
        <MinItem icon={<Split size={15} className="rotate-180" />} title="Conditions">{rich(STEPS[1].text)}</MinItem>
        <MinItem icon={<Workflow size={15} />} title="Actions">{rich(STEPS[2].text)}</MinItem>
      </ul>


      <div className="my-6 h-px bg-[#EEF2F6]" />

      <MinHead>Conflicts and Similar Rules</MinHead>
      <ul className="mt-4 flex flex-col gap-4">
        <MinItem icon={<TriangleAlert size={15} />} title="Conflict">
          Two rules perform opposite actions on the same field under overlapping conditions.
          {/* the example, drawn — the one picture worth keeping in a minimal guide */}
          <div className="mt-2 rounded-lg border border-[#EEF2F6] p-2.5">
            <div className="flex items-center gap-2 text-[12px] text-[#364658]">
              <span className="min-w-0 flex-1 rounded-md bg-[#F8FAFC] px-2 py-1.5 text-center"><span className="text-[#98A2B3]">Rule A · </span><b className="font-semibold text-[#DC2626]">Hides</b> Status</span>
              <span className="flex-shrink-0 text-[#98A2B3]">⟷</span>
              <span className="min-w-0 flex-1 rounded-md bg-[#F8FAFC] px-2 py-1.5 text-center"><span className="text-[#98A2B3]">Rule B · </span><b className="font-semibold text-[#16A34A]">Shows</b> Status</span>
            </div>
            <p className="mt-1.5 text-[11.5px] text-[#98A2B3]">Example: One rule hides Status while another shows it.</p>
          </div>
        </MinItem>
        <MinItem icon={<Copy size={15} />} title="Similar Rule">Another rule already uses the same event and conditions. Consider adding your actions to the existing rule instead.</MinItem>
        <MinItem icon={<Lightbulb size={15} />} title="How to Resolve Conflicts">Review the rule event, execution settings, reverse action, conditions, and conflicting actions. Select the detected rule to review its details and adjust the rules as needed.</MinItem>
      </ul>

      <div className="my-6 h-px bg-[#EEF2F6]" />

      <MinHead>Learn more</MinHead>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {learn.map(([icon, label, go, ext]) => (
          <button key={label} type="button" onClick={go}
            className="group flex min-w-0 items-center gap-2 rounded-lg border border-[#EEF2F6] px-3 py-2.5 text-left transition-colors hover:border-[#DFE5ED] hover:bg-[#F8FAFC]">
            <span className="flex-shrink-0 text-[#64748B] group-hover:text-[#3D8BD0]">{icon}</span>
            <span className="min-w-0 flex-1 text-[12.5px] font-medium leading-snug text-[#1D2A3E]">{label}</span>
            {ext ? <ArrowUpRight size={14} className="flex-shrink-0 text-[#98A2B3]" /> : <ChevronRight size={14} className="flex-shrink-0 text-[#98A2B3]" />}
          </button>
        ))}
      </div>
    </div>
  );
}
