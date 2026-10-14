/* VENDORED from the upstream prototype (ronak-patel-motadata/ServiceOps-Ticket-Detail-, Oct 2026 sync).
   Used ONLY by the detail pages and listings brought in from upstream — this project's own detail
   pages keep their own version in ../. Do not edit to change our pages; edit ../ instead. */
import { useState, useRef, useEffect } from 'react';
import { Check, Copy } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';

/**
 * Header "Copy ID" / "Copy URL" button with copy-to-clipboard feedback:
 * on click it copies, then briefly turns green with a Check icon and a
 * forced-open "Copied!" tooltip, reverting to the idle icon after ~1.6s.
 */
export function HeaderCopyButton({
  variant,
  value,
  label,
}: {
  variant: 'id' | 'link';
  value: string;
  label: string;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const handleCopy = () => {
    const text =
      variant === 'link'
        ? `${typeof window !== 'undefined' ? window.location.origin + window.location.pathname : ''}#${value}`
        : value;
    try {
      void navigator.clipboard?.writeText(text)?.catch(() => {});
    } catch {
      /* clipboard unavailable — prototype, ignore */
    }
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1600);
  };

  return (
    <Tooltip open={copied || undefined}>
      <TooltipTrigger asChild>
        <button
          onClick={handleCopy}
          className={`inline-flex items-center justify-center h-8 w-8 bg-white border rounded transition-colors ${copied ? 'border-[#22A06B] bg-[#E9F7EF]' : 'border-[#DFE5ED] hover:bg-[#F5F7FA]'}`}
        >
          {copied ? (
            <Check size={16} className="text-[#22A06B]" />
          ) : variant === 'id' ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-[#6b7280]"><path d="M4 8V4H8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/><path d="M16 4H20V8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/><path d="M20 16V20H16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/><path d="M8 20H4V16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/><text x="12" y="15.5" textAnchor="middle" fontSize="8" fontWeight="700" fill="currentColor" fontFamily="system-ui, sans-serif">ID</text></svg>
          ) : (
            <Copy size={16} strokeWidth={2} className="text-[#6b7280]" />
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent>{copied ? 'Copied!' : label}</TooltipContent>
    </Tooltip>
  );
}
