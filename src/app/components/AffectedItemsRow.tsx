import { User } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from './ui/tooltip';
import { IconRequest, IconProblem, IconChange, IconRelease, IconAssets, IconCMDB } from './SidebarIcons';

/* "Affected Items :" row — the impact summary that sits under the description on the Request,
 * Problem, Change and Release detail pages. One pill per related TYPE that has records; hovering
 * a pill previews the first three records, clicking it opens the Relations tab filtered to that
 * type. Extracted from ProblemDrawer so all four pages share one implementation. */

export interface AffectedRecord {
  id: string;
  type: string;
  ticketId: string;
  subject: string;
  status: string;
  priority: string;
  assignedTo: { name: string };
}

const iconFor = (type: string) =>
  type === 'Request' ? IconRequest
    : type === 'Problem' ? IconProblem
      : type === 'Change' ? IconChange
        : type === 'Release' ? IconRelease
          : type === 'Asset' ? IconAssets
            : type === 'CI' ? IconCMDB
              : IconRequest;

const statusDot = (st: string) =>
  st === 'Open' ? '#D97706'
    : st === 'In Progress' ? '#3D8BD0'
      : (st === 'In Use' || st === 'Resolved' || st === 'Closed' || st === 'Operational') ? '#22A06B'
        : '#9CA3AF';

const prioDot = (pr: string) => (pr === 'High' || pr === 'P1') ? '#DC2626' : pr === 'Medium' ? '#D97706' : '#22A06B';

/** Build a deterministic set of affected records — realistic ids/subjects per type. */
export function makeAffectedItems(
  ownerId: string | undefined,
  specs: { type: string; prefix: string; count: number }[],
): AffectedRecord[] {
  const SUBJECTS: Record<string, string[]> = {
    Request: ['Users reporting the same symptom', 'Duplicate report from another team', 'Recurring complaint linked to this record', 'Escalated by the service desk', 'Second-line follow-up raised'],
    Problem: ['Recurring root cause under investigation', 'Known error pending permanent fix', 'Underlying defect tracked separately'],
    Change: ['Planned remediation change', 'Configuration rollback window', 'Firmware upgrade for affected hardware'],
    Release: ['Scheduled maintenance release', 'Hotfix bundle for this component'],
    Asset: ['Cisco Aironet AP — 3rd Floor East', 'Dell PowerEdge R750 — Rack B12', 'Exchange Mail Server — MX01', 'Core Switch — SW-CORE-02', 'Identity Provider — SSO01'],
    CI: ['Wireless LAN Controller — WLC01', 'Active Directory Domain Service', 'Corporate DNS Service', 'Payroll Application Service'],
  };
  const STATUS: Record<string, string[]> = {
    Asset: ['In Use'], CI: ['Operational'],
  };
  const owners = ['Diksha Patel', 'Rahul Dev', 'Hemal Joshi', 'Network Team', 'IT Operations', 'Manasvi Shah'];
  const prios = ['High', 'Medium', 'Low', 'P1'];
  const out: AffectedRecord[] = [];
  specs.forEach(({ type, prefix, count }) => {
    for (let i = 0; i < count; i++) {
      const subjects = SUBJECTS[type] ?? SUBJECTS.Request;
      out.push({
        id: `${ownerId ?? 'rec'}-${prefix}-${i}`,
        type,
        ticketId: `${prefix}-${1001 + i * 7}`,
        subject: subjects[i % subjects.length],
        status: (STATUS[type] ?? ['Open', 'In Progress', 'Open'])[i % (STATUS[type] ?? ['Open', 'In Progress', 'Open']).length],
        priority: prios[i % prios.length],
        assignedTo: { name: owners[i % owners.length] },
      });
    }
  });
  return out;
}

export function AffectedItemsRow({
  records,
  onOpenType,
  onOpenRelation,
}: {
  records: AffectedRecord[];
  /** Open the Relations tab filtered to this type. */
  onOpenType: (type: string) => void;
  onOpenRelation?: (rel: { ticketId: string; subject: string; type: string; status: string; priority: string; assignedTo: { name: string } }) => void;
}) {
  if (!records.length) return null;

  // One pill per type present — a type with no records simply never appears.
  const byType = Object.entries(
    records.reduce<Record<string, number>>((acc, r) => { acc[r.type] = (acc[r.type] || 0) + 1; return acc; }, {}),
  ).map(([type, count]) => ({ type, count, label: `${count} ${type}${count > 1 ? 's' : ''}` }));

  return (
    <div className="mx-[24px] mb-[12px] flex flex-wrap items-center gap-2">
      <span className="text-[13px] font-medium text-[#364658]">Affected Items :</span>
      {byType.map((t) => {
        const Icon = iconFor(t.type);
        const recs = records.filter((r) => r.type === t.type);
        return (
          <Tooltip key={t.type}>
            <TooltipTrigger asChild>
              <button
                onClick={() => onOpenType(t.type)}
                className="inline-flex items-center gap-1.5 rounded border border-[#DFE5ED] bg-white px-2.5 py-1 text-[12px] font-medium text-[#364658] transition-colors hover:border-[#3D8BD0] hover:bg-[#F9FBFD]"
              >
                {/* One muted grey for every type — the pills are a set, so per-type colour made
                    the row read as six unrelated badges. The icon carries the type, not the hue. */}
                <span className="flex flex-shrink-0 items-center text-[#7B8FA5]">
                  <Icon size={14} />
                </span>
                {t.label}
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" align="start" sideOffset={6} hideArrow className="w-[300px] border border-[#E5E7EB] bg-white p-0 text-[#364658] shadow-lg">
              <div className="max-h-[260px] overflow-y-auto">
                {recs.slice(0, 3).map((r) => (
                  <button
                    key={r.ticketId}
                    onClick={() => onOpenRelation?.({ ticketId: r.ticketId, subject: r.subject, type: r.type, status: r.status, priority: r.priority, assignedTo: { name: r.assignedTo.name } })}
                    className="w-full cursor-pointer border-t border-[#F0F2F5] px-3 py-2 text-left transition-colors first:border-t-0 hover:bg-[#F9FAFB]"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="flex-shrink-0 rounded bg-[#e8f4fd] px-1.5 py-0.5 text-[11px] font-semibold text-[#3D8BD0]">{r.ticketId}</span>
                      <span className="flex-1 truncate text-[12px] font-medium text-[#364658] hover:text-[#3D8BD0]">{r.subject}</span>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="flex-shrink-0 text-[#9CA3AF]"><path d="M7 17L17 7M17 7H8M17 7V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </div>
                    <div className="mt-1.5 flex items-center gap-3 text-[11px] text-[#7B8FA5]">
                      <span className="inline-flex items-center gap-1"><User size={11} />{r.assignedTo.name}</span>
                      <span className="inline-flex items-center gap-1"><span className="size-1.5 rounded-full" style={{ backgroundColor: statusDot(r.status) }} />{r.status}</span>
                      <span className="inline-flex items-center gap-1"><span className="size-1.5 rounded-full" style={{ backgroundColor: prioDot(r.priority) }} />{r.priority}</span>
                    </div>
                  </button>
                ))}
              </div>
              {t.count > 3 && (
                <button onClick={() => onOpenType(t.type)} className="w-full cursor-pointer border-t border-[#F0F2F5] px-3 py-2.5 text-left text-[12px] font-medium text-[#3D8BD0] transition-colors hover:bg-[#F9FAFB]">View all {t.count}</button>
              )}
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}
