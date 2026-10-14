/* VENDORED from the upstream prototype (ronak-patel-motadata/ServiceOps-Ticket-Detail-, Oct 2026 sync).
   Used ONLY by the detail pages and listings brought in from upstream — this project's own detail
   pages keep their own version in ../. Do not edit to change our pages; edit ../ instead. */
import { Sparkles } from 'lucide-react';

export interface AiSummaryAction {
  label: string;
  /** Prompt shown in the AI chat as the user question (defaults to label). */
  question?: string;
  /** Tailored AI answer opened in the chat. */
  answer?: string;
}

interface AssetAiSummaryProps {
  summary: string;
  points?: string[];
  /** Suggested fix/resolve actions derived from the issues in the summary. */
  actions?: AiSummaryAction[];
  /** Invoked when a suggested action is clicked (wire to the AI chat handler). */
  onAction?: (question: string, answer: string) => void;
}

// Compact AI summary shown at the top of an asset's Overview tab — just the AI
// (Sparkles) icon, a one/two line summary and a few asset-related points. No
// "AI Summary" heading, unlike the larger conversation summary on tickets.
// When `actions` are provided, suggested-fix buttons render below the points.
export function AssetAiSummary({ summary, points = [], actions = [], onAction }: AssetAiSummaryProps) {
  return (
    <div
      className="rounded-xl border border-[#E7E1F7] p-4"
      style={{ background: 'linear-gradient(118deg, #FCFBFF 0%, #F6F3FE 55%, #FCF3FA 100%)' }}
    >
      <div className="flex items-start gap-2.5">
        <Sparkles size={18} className="text-[#8B5CF6] flex-shrink-0 mt-0.5" />
        <div className="min-w-0">
          <p className="text-[13px] text-[#364658] leading-relaxed">{summary}</p>
          {points.length > 0 && (
            <ul className="mt-2 space-y-1.5">
              {points.map((p, i) => (
                <li key={i} className="flex items-start gap-2 text-[13px] text-[#364658] leading-relaxed">
                  <span className="mt-[7px] size-1 rounded-full bg-[#8B5CF6] flex-shrink-0" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          )}
          {actions.length > 0 && (
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              {actions.map((a, i) => (
                <button
                  key={i}
                  onClick={() => onAction?.(a.question ?? a.label, a.answer ?? '')}
                  style={i === 0 ? {
                    background: 'linear-gradient(white, white) padding-box, linear-gradient(90deg, rgba(76, 177, 254, 0.80) 0%, rgba(115, 30, 251, 0.80) 41.49%, rgba(249, 17, 227, 0.80) 100%) border-box',
                    border: '1px solid transparent',
                  } : {
                    background: 'linear-gradient(90deg, rgba(76, 177, 254, 0.12) 0%, rgba(115, 30, 251, 0.12) 41.49%, rgba(249, 17, 227, 0.12) 100%), var(--Core-White, #FFF)',
                  }}
                  className="group flex items-center gap-1.5 px-3 py-2 rounded text-[#364658] text-xs font-medium whitespace-nowrap hover:text-[#3D8BD0] hover:shadow-sm transition-all duration-200"
                >
                  <span>{a.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
