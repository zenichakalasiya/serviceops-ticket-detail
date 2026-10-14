import { RefreshCw } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from './ui/tooltip';

/**
 * The "summary is out of date" line on an AI Summary card.
 *
 * Two states, because they answer different questions:
 *  - STALE — conversations have landed since the summary was written. The message is highlighted
 *    (blue, medium weight, live dot) so it reads as something to act on rather than the timestamp
 *    it used to look like in grey. It is also clickable, so the obvious thing to click works.
 *  - FRESH — after regenerating there is nothing to report, so the message goes away and only the
 *    refresh icon remains, for anyone who wants to regenerate again anyway.
 */
export function SummaryStaleNotice({
  stale,
  regenerating = false,
  onRegenerate,
}: {
  /** New conversations have arrived since the summary was generated. */
  stale: boolean;
  regenerating?: boolean;
  onRegenerate: () => void;
}) {
  const handle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!regenerating) onRegenerate();
  };

  return (
    <div className="flex items-center gap-2">
      {/* A label, not a control — the refresh icon beside it is the only thing that regenerates. */}
      {stale && !regenerating && (
        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium">
          <span className="relative flex size-1.5 flex-shrink-0">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#8B5CF6] opacity-75" />
            <span className="relative inline-flex size-1.5 rounded-full bg-[#8B5CF6]" />
          </span>
          <span
            className="whitespace-nowrap bg-clip-text text-transparent"
            style={{ backgroundImage: 'linear-gradient(90deg, #4CB1FE 0%, #731EFB 55%, #F911E3 100%)' }}
          >
            New conversations added — Regenerate
          </span>
        </span>
      )}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={handle}
            disabled={regenerating}
            className="rounded p-1 transition-colors hover:bg-[#E5E7EB] disabled:opacity-60"
          >
            <RefreshCw
              size={14}
              className={`transition-colors ${regenerating ? 'animate-spin text-[#8B5CF6]' : stale ? 'text-[#8B5CF6]' : 'text-[#7B8FA5]'}`}
            />
          </button>
        </TooltipTrigger>
        <TooltipContent>{stale ? 'Regenerate to include the new conversations' : 'Regenerate summary'}</TooltipContent>
      </Tooltip>
    </div>
  );
}
