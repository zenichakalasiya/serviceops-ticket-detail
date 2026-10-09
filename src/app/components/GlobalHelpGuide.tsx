import { useEffect, useState } from 'react';
import { BookOpen, ChevronRight, X } from 'lucide-react';
import { HelpDocGuide } from './FormRuleHelpPanel';

/**
 * The GLOBAL Help guide (Zeni, 9 Oct 2026): opened from the header's ⓘ beside the Keyboard
 * shortcuts button, or by `open-global-help` from anywhere. It is a floating card over the page —
 * no backdrop, so the module behind stays usable while you read — and it opens on the guide for the
 * MODULE YOU ARE ON, read from the URL.
 *
 * ⚠️ Each module's guide is one row in GUIDES (`match` on the hash). A page with no guide yet says
 * so and lists the guides that exist, rather than opening empty.
 * The lighter per-module Help Card lives in the module itself (e.g. the Form Rule editor's panel).
 */

interface Guide { id: string; title: string; match: (hash: string) => boolean; render: () => React.ReactNode }

const watchFormRuleVideo = () => window.dispatchEvent(new CustomEvent('form-rule-watch-guide'));

const GUIDES: Guide[] = [
  { id: 'form-rules', title: 'Request Form Rules', match: (h) => h.startsWith('#/admin/request-form'), render: () => <HelpDocGuide onWatch={watchFormRuleVideo} /> },
];

export function GlobalHelpGuide() {
  const [open, setOpen] = useState(false);
  const [guideId, setGuideId] = useState<string | null>(null);

  useEffect(() => {
    const onOpen = () => {
      setGuideId(GUIDES.find((g) => g.match(location.hash))?.id ?? null);
      setOpen(true);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('open-global-help', onOpen);
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('open-global-help', onOpen); window.removeEventListener('keydown', onKey); };
  }, []);

  if (!open) return null;
  const guide = GUIDES.find((g) => g.id === guideId) ?? null;
  const pageName = document.title.split(' · ')[0] || 'this page';

  return (
    <div role="dialog" aria-label="Help guide"
      className="fixed right-4 top-[60px] z-[10060] flex h-[min(720px,calc(100vh-76px))] w-[480px] max-w-[calc(100vw-32px)] flex-col overflow-hidden rounded-xl border border-[#DFE5ED] bg-white shadow-[0_16px_48px_rgba(15,23,42,0.18)]">
      <div className="flex flex-shrink-0 items-center gap-3 border-b border-[#EEF2F6] px-4 py-3">
        <span className="flex size-8 flex-shrink-0 items-center justify-center rounded-lg bg-[#EBF5FF] text-[#3D8BD0]"><BookOpen size={16} /></span>
        <div className="min-w-0 flex-1">
          <div className="text-[15px] font-semibold text-[#1D2A3E]">Help guide</div>
          <div className="truncate text-[12px] text-[#7B8FA5]">{guide ? guide.title : pageName}</div>
        </div>
        <button type="button" onClick={() => setOpen(false)} title="Close (Esc)" aria-label="Close"
          className="flex size-8 items-center justify-center rounded transition-colors hover:bg-[#F3F4F6]"><X size={16} className="text-[#64748B]" /></button>
      </div>
      <div className="min-h-0 flex-1">
        {guide ? guide.render() : (
          <div className="flex h-full flex-col items-center justify-center px-8 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-[#F1F5F9] text-[#7B8FA5]"><BookOpen size={22} /></span>
            <div className="mt-3 text-[14px] font-semibold text-[#1D2A3E]">No guide for {pageName} yet</div>
            <p className="mt-1 text-[12.5px] text-[#64748B]">Guides are being written module by module. These are ready:</p>
            <div className="mt-4 flex w-full flex-col gap-2">
              {GUIDES.map((g) => (
                <button key={g.id} type="button" onClick={() => setGuideId(g.id)}
                  className="flex items-center gap-2 rounded-lg border border-[#E8EDF3] px-3 py-2.5 text-left text-[13px] font-medium text-[#1D2A3E] transition-colors hover:border-[#9FC3E6]">
                  <span className="min-w-0 flex-1">{g.title}</span><ChevronRight size={15} className="text-[#98A2B3]" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
