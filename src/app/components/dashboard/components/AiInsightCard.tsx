/**
 * AiInsightCard — placement B of the AI-insights entry point.
 *
 * A wide card sized to sit inside the KPI row (the parent gives it its column span). It shows
 * the AI glyph, "AI insights", the attention count, a grounded one-line summary and the three
 * CTAs. Each CTA emits `ask(intent, label)` — the board opens the real assistant.
 *
 * Zero extra chrome — it's already a tile in the row. Shared teaser + CTAs with the banner and
 * the header chip (see data/aiTeaser.js).
 */
import { Icon } from '../ui/primitives';
import { useDashStore } from '../reactivity.js';
import { useAiTeaser, AI_TEASER_CTAS } from '../data/aiTeaser.js';
import './AiInsightCard.css';

export function AiInsightCard({ board, onAsk }: any) {
  useDashStore();
  const { count, summary } = useAiTeaser(() => board);
  const CTAS: any[] = AI_TEASER_CTAS;
  const n = count.value;
  return (
    <div className="dc-AiInsightCard ai-card-b aic card">
      <div className="acb-head">
        <span className="acb-spark"><Icon name="sparkles" size={18} /></span>
        <span className="acb-title">AI insights</span>
        <span className="acb-meta">{n ? n + ' need' + (n === 1 ? 's' : '') + ' attention' : 'Within range'}</span>
      </div>
      <p className="acb-sum">{summary.value}</p>
      <div className="acb-acts ai-ctas-fill">
        {CTAS.map((c, i) => (
          <button key={c.intent} className={`ai-cta ${i === 0 ? 'primary' : ''}`} onClick={() => onAsk?.(c.intent, c.label)}>
            <Icon name={c.icon} size={13} /> <span>{c.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
