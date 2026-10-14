/* VENDORED from the upstream prototype (ronak-patel-motadata/ServiceOps-Ticket-Detail-, Oct 2026 sync).
   Used ONLY by the detail pages and listings brought in from upstream — this project's own detail
   pages keep their own version in ../. Do not edit to change our pages; edit ../ instead. */
import { useState, useEffect } from 'react';
import { X, User, Monitor, Search, ChevronDown, Check, Building2 } from 'lucide-react';
import type { PatchComputer } from './PatchComputersTab';

/* Side popup listing the endpoints impacted by a single CVE — opened from the "Impacted Endpoints"
 * count in the Vulnerabilities grid. Shows the most useful subset of the Endpoint tab's columns
 * (the full grid has 13, which is far too wide for a side panel). */

const Dash = () => <span className="text-[12px] text-[#9ca3af]">---</span>;

interface PatchVulnEndpointsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  cveId?: string;
  endpoints: PatchComputer[];
}

const ALL_OFFICES = 'All Endpoints';

export function PatchVulnEndpointsPanel({ isOpen, onClose, cveId, endpoints }: PatchVulnEndpointsPanelProps) {
  const [search, setSearch] = useState('');
  const [office, setOffice] = useState<string>(ALL_OFFICES);
  const [showOffice, setShowOffice] = useState(false);

  // Reset the toolbar each time the popup opens for a different CVE.
  useEffect(() => { setSearch(''); setOffice(ALL_OFFICES); setShowOffice(false); }, [cveId, isOpen]);

  if (!isOpen) return null;

  const headers = ['Agent ID', 'Host Name', 'IP Address', 'OS Name', 'Used By', 'System Health', 'Remote Office'];

  // Group options come from the endpoints actually impacted, so the filter is never a dead end.
  const officeOptions = [ALL_OFFICES, ...Array.from(new Set(endpoints.map((e) => e.remoteOffice).filter(Boolean) as string[])).sort()];
  const q = search.trim().toLowerCase();
  const rows = endpoints
    .filter((c) => office === ALL_OFFICES || c.remoteOffice === office)
    .filter((c) =>
      !q ||
      c.id.toLowerCase().includes(q) ||
      c.hostName.toLowerCase().includes(q) ||
      c.ipAddress.toLowerCase().includes(q) ||
      c.osName.toLowerCase().includes(q) ||
      (c.usedBy ?? '').toLowerCase().includes(q)
    );

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-end bg-black/50">
      <div className="flex h-full w-[820px] max-w-[95vw] flex-col bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-[#DFE5ED] px-5 py-3">
          <div className="min-w-0">
            <h3 className="text-[16px] font-semibold text-[#364658]">Impacted Endpoints</h3>
            <p className="mt-0.5 text-[13px] text-[#7B8FA5]">
              {endpoints.length} endpoint{endpoints.length === 1 ? '' : 's'} affected by{' '}
              <span className="font-medium text-[#3D8BD0]">{cveId}</span>
            </p>
          </div>
          <button onClick={onClose} className="flex size-8 flex-shrink-0 items-center justify-center rounded transition-colors hover:bg-[#F3F4F6] text-[#7B8FA5] hover:text-[#364658]"><X size={18} /></button>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-auto px-5 py-4">
          {endpoints.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-3 inline-flex size-14 items-center justify-center rounded-full bg-[#F5F7FA]">
                <Monitor className="size-6 text-[#9CA3AF]" />
              </div>
              <p className="text-[14px] font-medium text-[#364658]">No impacted endpoints</p>
              <p className="mt-1 text-[13px] text-[#7B8FA5]">No endpoints are currently affected by this vulnerability.</p>
            </div>
          ) : (
            <>
            {/* Search + group filter */}
            <div className="mb-3 flex items-center gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Select field to search..."
                  className="h-8 w-full rounded border border-[#d1d5db] bg-white pl-3 pr-10 text-[13px] text-[#364658] placeholder:text-[#9ca3af] focus:border-[#3D8BD0] focus:outline-none focus:ring-1 focus:ring-[#3D8BD0]"
                />
                {search ? (
                  <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#364658]"><X size={16} /></button>
                ) : (
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" size={16} />
                )}
              </div>

              <div className="relative flex-shrink-0">
                <button
                  onClick={() => setShowOffice((v) => !v)}
                  title="Filter by group"
                  className={`inline-flex h-8 items-center gap-1.5 rounded border px-3 text-[13px] font-medium transition-colors ${office !== ALL_OFFICES ? 'border-[#3D8BD0] bg-[#F0F8FF] text-[#3D8BD0]' : 'border-[#DFE5ED] bg-white text-[#364658] hover:bg-[#F5F7FA]'}`}
                >
                  <Building2 size={14} className={office !== ALL_OFFICES ? 'text-[#3D8BD0]' : 'text-[#7B8FA5]'} />
                  <span className="max-w-[150px] truncate">{office}</span>
                  <ChevronDown size={14} className={`transition-transform ${showOffice ? 'rotate-180' : ''} ${office !== ALL_OFFICES ? 'text-[#3D8BD0]' : 'text-[#7B8FA5]'}`} />
                </button>
                {showOffice && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowOffice(false)} />
                    <div className="app-menu absolute right-0 top-full z-50 mt-1 w-[220px] rounded-lg border border-[#DFE5ED] bg-white py-1 shadow-lg">
                      {officeOptions.map((o) => (
                        <button
                          key={o}
                          onClick={() => { setOffice(o); setShowOffice(false); }}
                          className={`flex w-full items-center justify-between gap-2 px-4 py-2 text-left text-[13px] transition-colors ${office === o ? 'bg-[#F1F5F9] text-[#364658]' : 'text-[#364658] hover:bg-[#F9FAFB]'}`}
                        >
                          <span className="truncate">{o}</span>
                          {office === o && <Check size={15} className="flex-shrink-0 text-[#3D8BD0]" />}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px]">
                <thead className="border-b border-[#e5e7eb]">
                  <tr>
                    {headers.map((h) => (
                      <th key={h} className="px-4 py-2.5 text-left text-[12px] font-semibold tracking-wider text-[#364658] whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e5e7eb] bg-white">
                  {rows.length === 0 ? (
                    <tr><td colSpan={headers.length} className="px-4 py-12 text-center text-[13px] text-[#9CA3AF]">No endpoints match your search.</td></tr>
                  ) : rows.map((c) => (
                    <tr key={c.id} className="transition-colors hover:bg-[#f9fafb]">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-2">
                          <span className="size-2 flex-shrink-0 rounded-full bg-[#EAB308]" />
                          <button className="inline-block rounded bg-[#e8f4fd] px-2 py-0.5 text-[12px] font-semibold text-[#3D8BD0] transition-colors hover:bg-[#d0e8f9]">{c.id}</button>
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-[12px] text-[#364658]">{c.hostName}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-[12px] text-[#364658]">{c.ipAddress}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-[12px] text-[#364658]"><span className="block max-w-[190px] truncate" title={c.osName}>{c.osName}</span></td>
                      <td className="px-4 py-3 whitespace-nowrap text-[12px]">
                        {c.usedBy ? (
                          <span className="inline-flex items-center gap-1.5 text-[#3D8BD0]"><User size={12} className="text-[#9ca3af]" />{c.usedBy}</span>
                        ) : <Dash />}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-[12px]">
                        {c.systemHealth ? (
                          <span className="inline-flex items-center gap-1.5 text-[#364658]">
                            <span className="size-2 flex-shrink-0 rounded-full" style={{ backgroundColor: c.systemHealth === 'Healthy' ? '#22C55E' : '#EF4444' }} />
                            {c.systemHealth}
                          </span>
                        ) : <Dash />}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-[12px]">
                        {c.remoteOffice ? (
                          <span className="inline-block rounded bg-[#EEF2F6] px-2 py-0.5 text-[12px] text-[#364658]">{c.remoteOffice}</span>
                        ) : <Dash />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
