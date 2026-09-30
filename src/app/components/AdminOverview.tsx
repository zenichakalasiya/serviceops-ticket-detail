import { ChevronDown, ExternalLink, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import { ADMIN_SECTIONS, ADMIN_TOTAL_CARDS } from './adminData';
import { adminIcon } from './AdminIcons';

/* Admin Overview — every settings area as a collapsible section of module cards.
 *
 * Sections are independently collapsible (a Set, not a single open key) because an admin
 * comparing two areas should not have one close when the other opens. */

interface AdminOverviewProps {
  openKeys: Set<string>;
  onToggle: (key: string) => void;
  query: string;
  onQuery: (q: string) => void;
  /** Registers each section's node so the sidebar can scroll to it. */
  registerSection: (key: string, el: HTMLDivElement | null) => void;
  /** Opens a card's real module. Returns false when there isn't one, so the card falls back to
   *  the href toast. */
  onOpenCard?: (sectionTitle: string, cardTitle: string) => boolean;
}

export function AdminOverview({ openKeys, onToggle, query, onQuery, registerSection, onOpenCard }: AdminOverviewProps) {
  const q = query.trim().toLowerCase();

  // A section survives search if its own name matches or any card does; when it survives on a
  // card match, only the matching cards are shown.
  const sections = ADMIN_SECTIONS
    .map((s) => {
      if (!q) return { ...s, visibleCards: s.cards };
      const nameHit = s.title.toLowerCase().includes(q) || s.desc.toLowerCase().includes(q);
      const cardHits = s.cards.filter((c) => c.title.toLowerCase().includes(q) || c.desc.toLowerCase().includes(q));
      if (nameHit) return { ...s, visibleCards: cardHits.length ? cardHits : s.cards };
      return cardHits.length ? { ...s, visibleCards: cardHits } : null;
    })
    .filter(Boolean) as (typeof ADMIN_SECTIONS[number] & { visibleCards: typeof ADMIN_SECTIONS[number]['cards'] })[];

  const hits = sections.reduce((n, s) => n + s.visibleCards.length, 0);

  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-[#F7F9FC]">
      <div className="mx-auto max-w-[1400px] px-4 py-6">
        {/* Page head */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-[16px] font-semibold text-[#364658]">Overview</h1>
            <p className="mt-1 text-[13px] text-[#7B8FA5]">
              Centralized hub to manage and configure all ITSM settings and modules.{' '}
              <button
                onClick={() => toast.success('Opening the admin documentation')}
                className="inline-flex items-center gap-1 font-medium text-[#3D8BD0] hover:underline"
              >
                View Docs <ExternalLink size={12} />
              </button>
            </p>
          </div>

          <div className="relative w-[320px] max-w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" size={15} />
            <input
              type="text"
              value={query}
              onChange={(e) => onQuery(e.target.value)}
              placeholder={`Search ${ADMIN_TOTAL_CARDS} settings...`}
              className="h-9 w-full rounded border border-[#d1d5db] bg-white pl-9 pr-8 text-[13px] text-[#364658] placeholder:text-[#9ca3af] focus:border-[#3D8BD0] focus:outline-none focus:ring-1 focus:ring-[#3D8BD0]"
            />
            {query && (
              <button
                onClick={() => onQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9ca3af] transition-colors hover:text-[#364658]"
              ><X size={15} /></button>
            )}
          </div>
        </div>

        {q && (
          <p className="mt-3 text-[13px] text-[#7B8FA5]">
            {hits} setting{hits === 1 ? '' : 's'} across {sections.length} area{sections.length === 1 ? '' : 's'}
          </p>
        )}

        {/* Sections */}
        <div className="mt-5 space-y-3">
          {sections.map((s) => {
            const SectionIcon = adminIcon(s.icon);
            // A search always reveals its hits — collapsed state only applies when not searching.
            const open = q ? true : openKeys.has(s.key);
            return (
              <div
                key={s.key}
                ref={(el) => registerSection(s.key, el)}
                className="scroll-mt-4 overflow-hidden rounded-xl border border-[#E5E7EB] bg-white"
              >
                <button
                  onClick={() => onToggle(s.key)}
                  className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-[#F9FAFB]"
                >
                  <span className="flex size-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#F1F5F9] text-[#364658]">
                    <SectionIcon size={18} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="text-[15px] font-semibold text-[#364658]">{s.title}</span>
                      <span className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#EEF2F6] px-1.5 text-[11px] font-semibold text-[#64748B]">
                        {s.visibleCards.length}
                      </span>
                    </span>
                    <span className="mt-0.5 block truncate text-[13px] text-[#7B8FA5]">{s.desc}</span>
                  </span>
                  <ChevronDown
                    size={18}
                    className={`flex-shrink-0 text-[#7B8FA5] transition-transform ${open ? 'rotate-180' : ''}`}
                  />
                </button>

                {open && (
                  <div className="border-t border-[#F0F2F5] p-4">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                      {s.visibleCards.map((c) => {
                        const CardIcon = adminIcon(c.icon);
                        return (
                          <button
                            key={c.title}
                            onClick={() => {
                              if (onOpenCard?.(s.title, c.title)) return;
                              toast.success(`${c.title} — ${c.href}`);
                            }}
                            /* flex-col so a one-line description doesn't get centred against a
                               taller neighbour — Chrome centres button content vertically. */
                            className="group flex flex-col items-start rounded-lg border border-[#E5E7EB] bg-white p-3.5 text-left transition-all hover:border-[#3D8BD0] hover:shadow-[0_1px_2px_rgba(16,24,40,0.04),0_2px_8px_rgba(16,24,40,0.06)]"
                          >
                            <span className="flex items-center gap-2.5">
                              <span className="flex size-8 flex-shrink-0 items-center justify-center rounded bg-[#F1F5F9] text-[#7B8FA5] transition-colors group-hover:bg-[#EBF5FF] group-hover:text-[#3D8BD0]">
                                <CardIcon size={16} />
                              </span>
                              <span className="truncate text-[14px] font-medium text-[#364658]">{c.title}</span>
                            </span>
                            <span className="mt-2 block text-[12px] leading-[1.5] text-[#7B8FA5]">{c.desc}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {sections.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-3 inline-flex size-14 items-center justify-center rounded-full bg-[#F5F7FA]">
              <Search className="size-6 text-[#9CA3AF]" />
            </div>
            <p className="text-[14px] font-medium text-[#364658]">No settings found</p>
            <p className="mt-1 max-w-[420px] text-[13px] text-[#7B8FA5]">
              Nothing matches “{query}”. Try a module name like “SLA”, “barcode” or “branding”.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
