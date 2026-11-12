import { useEffect, useRef, useState } from 'react';
import { ConciergeBell, FileText, Plus, ShoppingCart } from 'lucide-react';
import { IconAssets, IconChange, IconCMDB, IconProblem, IconProject, IconRelease, IconRequest } from './SidebarIcons';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { openCreatePage } from './createFormStore';
import { CREATE_MENU, type CreateMenuIcon } from './createMenu';
import { parseHash } from '../routes';

/* The header's blue + : the product's create menu (see createMenu.ts). Each row opens that
 * module's full create page; the record lands in its listing. Same rows, same order as the
 * product, with the module icons the sidebar uses so a row reads as the module it creates. */

const ICONS: Record<CreateMenuIcon, React.ReactNode> = {
  request: <IconRequest size={16} />,
  service: <ConciergeBell size={16} />,
  problem: <IconProblem size={16} />,
  change: <IconChange size={16} />,
  release: <IconRelease size={16} />,
  asset: <IconAssets size={16} />,
  ci: <IconCMDB size={16} />,
  purchase: <ShoppingCart size={16} />,
  project: <IconProject size={16} />,
  contract: <FileText size={16} />,
};

export function CreateMenuButton() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        title="Create"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={`flex h-[32px] w-[32px] items-center justify-center rounded text-white transition-colors ${open ? 'bg-[#2d6ca0]' : 'bg-[#3D8BD0] hover:bg-[#2d6ca0]'}`}
      >
        <Plus size={18} strokeWidth={2} />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-full z-[10050] mt-1.5 w-[220px] rounded-lg border border-[#DFE5ED] bg-white py-1 shadow-lg">
          {CREATE_MENU.map((item) => {
            const row = (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                disabled={!!item.unavailable}
                onClick={() => {
                  if (!item.open) return;
                  setOpen(false);
                  openCreatePage(item.open(parseHash(window.location.hash).page));
                }}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] text-[#364658] transition-colors hover:bg-[#F9FAFB] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
              >
                <span className="flex size-4 flex-shrink-0 items-center justify-center text-[#7B8FA5]">{ICONS[item.icon]}</span>
                {item.label}
              </button>
            );
            return item.unavailable ? (
              <Tooltip key={item.label} delayDuration={0}>
                {/* A disabled button gets no pointer events, so the wrapper carries the hover. */}
                <TooltipTrigger asChild><span className="block">{row}</span></TooltipTrigger>
                <TooltipContent side="left" className="text-wrap max-w-[220px]">{item.unavailable}</TooltipContent>
              </Tooltip>
            ) : row;
          })}
        </div>
      )}
    </div>
  );
}
