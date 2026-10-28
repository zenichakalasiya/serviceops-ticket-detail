import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, ExternalLink } from 'lucide-react';

/* The Compliance module's version menu — "Version 2 ▾" on the title line of every Compliance page.
 *
 * The live app IS the current version (v2). Older versions are frozen builds served from the
 * versions site (versions/versions.json → /versions/compliance/<v>/), so picking one opens that
 * build in a NEW tab on the same screen (the hash travels with it). A frozen build cannot carry
 * this menu back, which is why it opens beside the live app rather than replacing it. */

const LIVE = 'https://zenichakalasiya.github.io/serviceops-ticket-detail/';

const VERSIONS = [
  { id: 'v2', label: 'Version 2', note: 'Current · MITRE ATT&CK tab, endpoint tabs' },
  { id: 'v1', label: 'Version 1', note: 'Saved 28 Oct 2026 · opens in a new tab' },
] as const;

const CURRENT = 'v2';

export function ComplianceVersionMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const down = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', down);
    document.addEventListener('keydown', key);
    return () => { document.removeEventListener('mousedown', down); document.removeEventListener('keydown', key); };
  }, [open]);

  const current = VERSIONS.find((v) => v.id === CURRENT)!;

  const pick = (id: string) => {
    setOpen(false);
    if (id === CURRENT) return;
    window.open(`${LIVE}versions/compliance/${id}/${window.location.hash}`, '_blank', 'noopener');
  };

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded border border-[#DFE5ED] bg-white px-3 text-[13px] font-medium text-[#364658] transition-colors hover:bg-[#F9FAFB]"
      >
        {current.label}
        <ChevronDown size={14} className={`text-[#7B8FA5] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-[60] mt-1 w-[260px] rounded-lg border border-[#DFE5ED] bg-white py-1 shadow-lg">
          <div className="px-3 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#7B8FA5]">Compliance versions</div>
          {VERSIONS.map((v) => {
            const on = v.id === CURRENT;
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => pick(v.id)}
                className={`flex w-full items-start gap-2 px-3 py-2 text-left transition-colors ${on ? 'bg-[#F8FAFC]' : 'hover:bg-[#F9FAFB]'}`}
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-medium text-[#364658]">{v.label}</span>
                  <span className="block text-[12px] text-[#7B8FA5]">{v.note}</span>
                </span>
                {on ? <Check size={15} className="mt-0.5 flex-shrink-0 text-[#3D8BD0]" /> : <ExternalLink size={14} className="mt-0.5 flex-shrink-0 text-[#9CA3AF]" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
