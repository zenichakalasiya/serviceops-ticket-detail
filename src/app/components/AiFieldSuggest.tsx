import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check } from 'lucide-react';
import { AiSparkle } from './upstream/AiSparkle';

/**
 * AI suggestion for a BLANK property field — the reusable pattern:
 * a quiet sparkle "Suggest" chip sits in the empty field; clicking opens a small
 * popup (standard dropdown chrome) with the suggested value(s) as toggleable
 * chips and Ignore/Add actions, mirroring the Property Suggestions popup.
 * Values never render inline in the field itself.
 */
export function AiFieldSuggest({
  field,
  values,
  hint = 'Suggested from the request description.',
  single = false,
  onApply,
}: {
  /** Field name shown in the popup header, e.g. "tags", "vendor". */
  field: string;
  values: string[];
  hint?: string;
  /** Select-style fields take exactly ONE value — chips behave as radios. */
  single?: boolean;
  onApply: (picked: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<{ right: number; bottom: number } | null>(null);
  const [picked, setPicked] = useState<Set<string>>(new Set(single ? values.slice(0, 1) : values));
  const panelRef = useRef<HTMLDivElement>(null);

  // A page scroll invalidates the anchor — close; scrolling inside the popup must not.
  useEffect(() => {
    if (!open) return;
    const onScroll = (e: Event) => {
      const t = e.target as Node | null;
      if (t && panelRef.current?.contains(t)) return;
      setOpen(false);
    };
    const close = () => setOpen(false);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', close);
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', close);
    };
  }, [open]);

  const W = 264;
  return (
    <>
      <button
        onClick={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          setRect({ right: r.right, bottom: r.bottom });
          setPicked(new Set(single ? values.slice(0, 1) : values));
          setOpen(true);
        }}
        title={`AI has suggestions for ${field}`}
        className="inline-flex size-5 items-center justify-center rounded transition-all hover:shadow-[0_1px_6px_rgba(115,30,251,0.22)]"
        style={{
          background:
            'linear-gradient(90deg, rgba(76, 177, 254, 0.10) 0%, rgba(115, 30, 251, 0.10) 41.49%, rgba(249, 17, 227, 0.10) 100%), #FFF',
        }}
      >
        <AiSparkle size={12} />
      </button>
      {open && rect && createPortal(
        <>
          <div className="fixed inset-0 z-[9998]" onClick={() => setOpen(false)} />
          <div
            ref={panelRef}
            style={{ position: 'fixed', top: rect.bottom + 6, left: Math.max(8, rect.right - W), width: W }}
            className="app-menu z-[9999] overflow-hidden rounded-lg border border-[#DFE5ED] bg-white shadow-xl"
          >
            <div className="flex items-center gap-1.5 px-3 pt-2.5 text-[11px] font-semibold uppercase tracking-wide text-[#7B8FA5]">
              <AiSparkle size={12} />
              Suggested {field}
            </div>
            <p className="px-3 pt-1 text-[12px] leading-relaxed text-[#94A3B8]">{hint}</p>
            <div className="flex flex-wrap gap-1.5 px-3 pb-3 pt-2.5">
              {values.map((v) => {
                const on = picked.has(v);
                return (
                  <button
                    key={v}
                    onClick={() =>
                      setPicked((p) => {
                        if (single) return new Set([v]);
                        const n = new Set(p);
                        if (n.has(v)) n.delete(v);
                        else n.add(v);
                        return n;
                      })
                    }
                    className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[12px] font-medium transition-colors ${
                      on
                        ? 'border-[#3D8BD0] bg-[#EBF5FF] text-[#3D8BD0]'
                        : 'border-[#E5E7EB] bg-white text-[#64748B] hover:border-[#CBD5E1]'
                    }`}
                  >
                    {on && <Check size={12} />}
                    {v}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-[#E5E7EB] px-3 py-2">
              <button
                onClick={() => setOpen(false)}
                className="h-7 rounded px-2.5 text-[12px] font-medium text-[#64748B] transition-colors hover:bg-[#F3F4F6] hover:text-[#364658]"
              >
                Ignore
              </button>
              <button
                onClick={() => {
                  onApply(values.filter((v) => picked.has(v)));
                  setOpen(false);
                }}
                disabled={picked.size === 0}
                className="h-7 rounded bg-[#3D8BD0] px-3 text-[12px] font-medium text-white transition-colors hover:bg-[#2F7AB8] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {single ? 'Apply' : `Add${picked.size > 0 ? ` (${picked.size})` : ''}`}
              </button>
            </div>
          </div>
        </>,
        document.body,
      )}
    </>
  );
}
