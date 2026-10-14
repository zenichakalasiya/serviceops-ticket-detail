/**
 * AiInsightChip — placement A of the AI-insights entry point.
 *
 * A small gradient-bordered chip (sparkle + attention count) that sits in the board header,
 * left of the ⋯ menu. Clicking it opens a popover: a grounded one-line dashboard summary and
 * the three CTAs. Each CTA emits `ask(intent, label)` — the board opens the real assistant.
 *
 * Near-zero vertical cost; the chip survives a zero-insight board (it stays, just no count).
 * Shared teaser + CTAs with the banner and the KPI-row card (see data/aiTeaser.js).
 */
import { useEffect, useState } from 'react';
import { Icon } from '../ui/primitives';
import { useDashStore } from '../reactivity.js';
import { useAiTeaser, AI_TEASER_CTAS } from '../data/aiTeaser.js';
import './AiInsightChip.css';

/* Both actions, in the order the reference card uses them: the first is the primary
 * (gradient border), the rest are secondary (tint). This popover used to offer only
 * "what needs attention" on the argument that a topbar icon has no room to land a deep
 * dive — but the deep dive lands in the side panel either way, and being the one AI
 * surface in the product with a different action set cost more than the row saved. */
const CTAS: any[] = AI_TEASER_CTAS.filter((c: any) => c.intent === 'focus' || c.intent === 'deepdive');

export function AiInsightChip({ board, onAsk }: any) {
  useDashStore();
  const { summary } = useAiTeaser(() => board);
  const [open, setOpen] = useState(false);

  function pick(c: any) { setOpen(false); onAsk?.(c.intent, c.label); }
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="dc-AiInsightChip chip-wrap">
      {/* icon only, matching a widget's own AI sparkle. The label and the count were
          two labels for one button in a row of icon-only actions; the count in
          particular promised a number that nothing downstream ever refers to again. */}
      <button className={`ai-chip ${open ? 'on' : ''}`} aria-expanded={open} title="AI insights" onClick={(e) => { e.stopPropagation(); setOpen(!open); }}>
        <Icon name="sparkles" size={17} />
      </button>
      {open && <div className="pop-backdrop" onClick={() => setOpen(false)} />}
      {open && (
        <div className="ai-pop aic" onClick={(e) => e.stopPropagation()}>
          <div className="ai-pop-h"><span className="ai-pop-spark"><Icon name="sparkles" size={16} /></span> AI insights</div>
          <p className="ai-pop-sum">{summary.value}</p>
          <div className="ai-pop-acts ai-ctas-fill">
            {CTAS.map((c, i) => (
              <button key={c.intent} className={`ai-cta ${i === 0 ? 'primary' : ''}`} onClick={() => pick(c)}>
                <Icon name={c.icon} size={13} /><span>{c.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
