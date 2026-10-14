import { Crown } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

/**
 * VIP is a property of the PERSON, not of the record — so it hashes the requester's name and the
 * same person reads as VIP on every request/problem/change/release they raise. Roughly a quarter
 * of the mock requesters land in the category.
 */
export function isVipRequester(name?: string) {
  const clean = (name ?? '').trim();
  if (!clean) return false;
  let h = 0;
  for (let i = 0; i < clean.length; i++) h = (h * 17 + clean.charCodeAt(i)) >>> 0;
  return h % 5 === 0;
}

/** Amber VIP chip shown right after a requester's name. `size="sm"` suits dense right-panel rows. */
export function VipPill({ size = 'md', className = '' }: { size?: 'sm' | 'md'; className?: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={`inline-flex flex-shrink-0 cursor-default items-center gap-1 rounded border border-[#F5D9A0] bg-[#FEF6E7] font-semibold uppercase tracking-[0.04em] text-[#B4690E] ${
            size === 'sm' ? 'px-1 py-px text-[9px]' : 'px-1.5 py-0.5 text-[10px]'
          } ${className}`}
        >
          <Crown size={size === 'sm' ? 9 : 10} className="flex-shrink-0" />
          VIP
        </span>
      </TooltipTrigger>
      <TooltipContent>VIP requester — handle on priority</TooltipContent>
    </Tooltip>
  );
}
