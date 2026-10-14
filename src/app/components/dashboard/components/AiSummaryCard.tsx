/**
 * AiSummaryCard — the board's "AI insights" card.
 *
 * Its UI is the ServiceOps ticket detail page's **AI Summary** card, measured off the real
 * thing rather than approximated:
 *
 *   shell      1px --border-control, --r-lg, a 3% gradient WASH (not a filled surface)
 *   header     24/12 padding · bare 18px gradient sparkle · 14px/600 title · 11px meta right
 *   body       24px gutters · 13px summary · "KEY POINTS" 11px/600 muted · dotted list
 *   CTA        32px · 0/12 · 4px · 12px/500 · ink text, in TWO types — the first action
 *              wears the 80% gradient ramp as its border over the surface, the rest a
 *              flat 12% gradient tint. The pair is the card's whole hierarchy.
 *
 * COLLAPSED it is the header row alone, so an unopened card costs the board ~46px.
 * EXPANDED it adds the summary, the key points and the CTAs — the same order the ticket
 * card uses, because a user who has read one should not have to re-learn the other.
 *
 * Everything shown is grounded: the summary and the key points are `facts()` from the
 * deterministic engine (data/aiTeaser.js). Nothing here invents a number.
 */
import { useState } from 'react';
import { Icon } from '../ui/primitives';
import { useDashStore } from '../reactivity.js';
import { useAiTeaser, AI_TEASER_CTAS } from '../data/aiTeaser.js';
import './AiSummaryCard.css';

// hideAddWidget: the placement lab's Variant C drops "Add a new widget" (it duplicates
// the floating action button and isn't an AI action). The real dashboard leaves it on.
export function AiSummaryCard({ board, hideAddWidget = false, onAsk }: any) {
  useDashStore();
  const [open, setOpen] = useState(false);
  const { summary, attention, count } = useAiTeaser(() => board);
  const CTAS: any[] = hideAddWidget ? AI_TEASER_CTAS.filter((c: any) => c.intent !== 'suggestwidget') : AI_TEASER_CTAS;

  /* The reference card's header carries a status line on the right ("New conversations have
   * been added"). Ours says what the engine actually found, so the line is a fact rather
   * than a decoration — and it is the one piece of information worth having while collapsed. */
  const n = count.value;
  const meta = !board?.tiles?.length ? 'No widgets yet' : n ? `${n} need${n === 1 ? 's' : ''} attention` : 'All widgets within range';

  // three is what fits without the card becoming a list; the panel has the rest
  const points: any[] = attention.value.slice(0, 3);
  const toggle = () => setOpen((o) => !o);

  return (
    <section className={`dc-AiSummaryCard ai-card aic ${open ? 'open' : ''}`}>
      <div
        className="ac-head" role="button" tabIndex={0} aria-expanded={open}
        onClick={toggle} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } }}
      >
        <span className="ac-spark"><Icon name="sparkles" size={18} /></span>
        <span className="ac-title">AI insights</span>
        <span className="ac-meta">{meta}</span>
        <span className="ac-arrow" title={open ? 'Collapse' : 'Expand'}>
          <Icon name={open ? 'chevron-up' : 'chevron-down'} size={16} />
        </span>
      </div>

      {open && (
        <div className="ac-body">
          <p className="ac-summary">{summary.value}</p>
          {points.length > 0 && (
            <>
              <div className="ac-kp">KEY POINTS</div>
              <ul className="ac-points">
                {points.map((p) => <li key={p.text}><span className="ac-dot" /><span>{p.text}</span></li>)}
              </ul>
            </>
          )}
          <div className="ac-gen">Generated from this board’s live data</div>
          <div className="ac-ctas">
            {CTAS.map((c, i) => (
              <button key={c.intent} className={`ai-cta ${i === 0 ? 'primary' : ''}`} onClick={() => onAsk?.(c.intent, c.label)}>
                <Icon name={c.icon} size={13} /><span>{c.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
