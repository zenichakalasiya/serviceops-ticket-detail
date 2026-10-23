import {
  IconDashboard,
  IconRequest,
  IconProblem,
  IconChange,
  IconRelease,
  IconAssets,
  IconCMDB,
  IconVulnerability,
  IconPatch,
  IconPackage,
  IconProject,
  IconKnowledge,
  IconReport,
  IconMyApproval,
  IconTask,
  IconMyTeam,
  IconBom,
} from './SidebarIcons';
import { ChartColumn, Shapes, ShieldCheck, LayoutTemplate, Cpu, AppWindow, Boxes, Recycle, KeyRound, Gauge, FileText, ShoppingCart, Rocket, Monitor, ClipboardCheck, Settings } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from './ui/tooltip';

// Asset sub-modules surfaced in the hover flyout (grouped with dividers).
const ASSET_GROUPS: { icon: React.ReactNode; label: string }[][] = [
  [
    { icon: <Cpu size={16} />, label: 'Hardware Assets' },
    { icon: <AppWindow size={16} />, label: 'Software Assets' },
    { icon: <Boxes size={16} />, label: 'Non-IT Assets' },
    { icon: <Recycle size={16} />, label: 'Consumable Assets' },
  ],
  [
    { icon: <KeyRound size={16} />, label: 'Software Licenses' },
    { icon: <Gauge size={16} />, label: 'Software Meter' },
  ],
  [
    { icon: <FileText size={16} />, label: 'Contracts' },
    { icon: <ShoppingCart size={16} />, label: 'Purchases' },
  ],
];

/** Assets nav item with a hover flyout listing the asset sub-modules. */
function AssetsNavItem({ activePage, onNavigate }: { activePage?: string; onNavigate?: (page: string) => void }) {
  // Map flyout labels to a navigable page.
  const pageFor = (label: string): string | undefined =>
    label === 'Hardware Assets' ? 'hardware-assets'
      : label === 'Software Assets' ? 'software-assets'
      : label === 'Non-IT Assets' ? 'non-it-assets'
      : label === 'Consumable Assets' ? 'consumable-assets'
      : label === 'Software Licenses' ? 'software-licenses'
      : label === 'Software Meter' ? 'software-meter'
      : label === 'Contracts' ? 'contracts'
      : label === 'Purchases' ? 'purchases'
      : undefined;
  const sectionActive = activePage === 'hardware-assets' || activePage === 'software-assets' || activePage === 'non-it-assets' || activePage === 'consumable-assets' || activePage === 'software-licenses' || activePage === 'software-meter' || activePage === 'contracts' || activePage === 'purchases';
  return (
    <div className="relative group">
      <NavItem icon={<IconAssets size={20} />} active={sectionActive} title="Assets" disableTooltip />
      {/* Flyout — pl-2 keeps a visual gap while bridging the hover area */}
      <div className="absolute left-full top-0 z-[9999] hidden group-hover:block pl-2">
        <div className="app-menu w-[210px] bg-white rounded-lg shadow-lg border border-[#DFE5ED] py-1">
          {ASSET_GROUPS.map((group, gi) => (
            <div key={gi}>
              {gi > 0 && <div className="my-1 border-t border-[#F0F2F5]" />}
              {group.map((item) => {
                const page = pageFor(item.label);
                const isActive = !!page && page === activePage;
                return (
                  <button
                    key={item.label}
                    onClick={() => page && onNavigate?.(page)}
                    className={`w-full px-3 py-2 text-[13px] text-left transition-colors flex items-center gap-2.5 ${
                      isActive ? 'bg-[#3D8BD0] text-white' : 'hover:bg-[#F5F7FA] text-[#364658]'
                    }`}
                  >
                    <span className={`flex-shrink-0 ${isActive ? 'text-white' : 'text-[#6B7280]'}`}>{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Vulnerability sub-modules surfaced in the hover flyout. All three navigate; Endpoint reuses the
// Patch module's Endpoints listing + detail page (same 'endpoints' route).
const VULNERABILITY_ITEMS: { icon: React.ReactNode; label: string; page?: string }[] = [
  { icon: <IconPatch size={16} />, label: 'Vulnerabilities', page: 'vulnerabilities' },
  { icon: <IconVulnerability size={16} />, label: 'Detected CVEs', page: 'detected-cves' },
  { icon: <Monitor size={16} />, label: 'Endpoint', page: 'endpoints' },
];

/** Vulnerability nav item with a hover flyout listing its sub-modules (mirrors PatchNavItem). */
function VulnerabilityNavItem({ activePage, onNavigate }: { activePage?: string; onNavigate?: (page: string) => void }) {
  const sectionActive = activePage === 'vulnerabilities' || activePage === 'detected-cves';
  return (
    <div className="relative group">
      <NavItem icon={<IconVulnerability size={20} />} active={sectionActive} title="Vulnerability" disableTooltip />
      {/* Flyout — pl-2 keeps a visual gap while bridging the hover area */}
      <div className="absolute left-full top-0 z-[9999] hidden group-hover:block pl-2">
        <div className="app-menu w-[210px] bg-white rounded-lg shadow-lg border border-[#DFE5ED] py-1">
          {VULNERABILITY_ITEMS.map((item) => {
            const isActive = !!item.page && item.page === activePage;
            return (
              <button
                key={item.label}
                onClick={() => item.page && onNavigate?.(item.page)}
                className={`w-full px-3 py-2 text-[13px] text-left transition-colors flex items-center gap-2.5 whitespace-nowrap ${
                  isActive ? 'bg-[#3D8BD0] text-white' : 'hover:bg-[#F5F7FA] text-[#364658]'
                }`}
              >
                <span className={`flex-shrink-0 ${isActive ? 'text-white' : 'text-[#6B7280]'}`}>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Patch sub-modules surfaced in the hover flyout. Patches + Patch Deployment navigate; the
// rest are prototype placeholders (no navigation yet).
const PATCH_ITEMS: { icon: React.ReactNode; label: string; page?: string }[] = [
  { icon: <IconPatch size={16} />, label: 'Patches', page: 'patches' },
  { icon: <Rocket size={16} />, label: 'Patch Deployment', page: 'patch-deployments' },
  { icon: <Monitor size={16} />, label: 'Endpoint', page: 'endpoints' },
  { icon: <ClipboardCheck size={16} />, label: 'Automatic Patch Test', page: 'automatic-patch-tests' },
  { icon: <Settings size={16} />, label: 'Automatic Patch Deployment', page: 'automatic-patch-deployments' },
];

/** Patch nav item with a hover flyout listing the patch sub-modules (mirrors AssetsNavItem). */
function PatchNavItem({ activePage, onNavigate }: { activePage?: string; onNavigate?: (page: string) => void }) {
  const sectionActive = activePage === 'patches' || activePage === 'patch-deployments' || activePage === 'endpoints';
  return (
    <div className="relative group">
      <NavItem icon={<IconPatch size={20} />} active={sectionActive} title="Patch" disableTooltip />
      {/* Flyout — pl-2 keeps a visual gap while bridging the hover area */}
      <div className="absolute left-full top-0 z-[9999] hidden group-hover:block pl-2">
        <div className="app-menu w-[250px] bg-white rounded-lg shadow-lg border border-[#DFE5ED] py-1">
          {PATCH_ITEMS.map((item) => {
            const isActive = !!item.page && item.page === activePage;
            return (
              <button
                key={item.label}
                onClick={() => item.page && onNavigate?.(item.page)}
                className={`w-full px-3 py-2 text-[13px] text-left transition-colors flex items-center gap-2.5 whitespace-nowrap ${
                  isActive ? 'bg-[#3D8BD0] text-white' : 'hover:bg-[#F5F7FA] text-[#364658]'
                }`}
              >
                <span className={`flex-shrink-0 ${isActive ? 'text-white' : 'text-[#6B7280]'}`}>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Package sub-modules surfaced in the hover flyout. Endpoint reuses the shared Endpoints
// listing (same as the Patch / Vulnerability flyouts); the two deployment items are
// prototype placeholders until those pages exist.
const PACKAGE_ITEMS: { icon: React.ReactNode; label: string; page?: string }[] = [
  { icon: <IconPackage size={16} />, label: 'Package Deployments', page: 'package-deployments' },
  { icon: <ClipboardCheck size={16} />, label: 'Registry Deployments', page: 'registry-deployments' },
  { icon: <Monitor size={16} />, label: 'Endpoint', page: 'endpoints' },
];

/** Package nav item with a hover flyout listing its sub-modules (mirrors PatchNavItem). */
function PackageNavItem({ activePage, onNavigate }: { activePage?: string; onNavigate?: (page: string) => void }) {
  const sectionActive = activePage === 'package-deployments' || activePage === 'registry-deployments';
  return (
    <div className="relative group">
      <NavItem icon={<IconPackage size={20} />} active={sectionActive} title="Package" disableTooltip />
      {/* Flyout — pl-2 keeps a visual gap while bridging the hover area */}
      <div className="absolute left-full top-0 z-[9999] hidden group-hover:block pl-2">
        <div className="app-menu w-[250px] bg-white rounded-lg shadow-lg border border-[#DFE5ED] py-1">
          {PACKAGE_ITEMS.map((item) => {
            const isActive = !!item.page && item.page === activePage;
            return (
              <button
                key={item.label}
                onClick={() => item.page && onNavigate?.(item.page)}
                className={`w-full px-3 py-2 text-[13px] text-left transition-colors flex items-center gap-2.5 whitespace-nowrap ${
                  isActive ? 'bg-[#3D8BD0] text-white' : 'hover:bg-[#F5F7FA] text-[#364658]'
                }`}
              >
                <span className={`flex-shrink-0 ${isActive ? 'text-white' : 'text-[#6B7280]'}`}>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Compliance sub-modules surfaced in the hover flyout: the policies themselves, and the
// visualisation of what their scans found (Overview · Policies · Explorer).
const COMPLIANCE_ITEMS: { icon: React.ReactNode; label: string; page: string }[] = [
  { icon: <ShieldCheck size={16} />, label: 'Compliance Policy', page: 'compliance-policies' },
  { icon: <ChartColumn size={16} />, label: 'Compliance Visualization', page: 'compliance-visualization' },
];

/** Compliance nav item with a hover flyout listing its sub-modules (mirrors PackageNavItem). */
function ComplianceNavItem({ activePage, onNavigate }: { activePage?: string; onNavigate?: (page: string) => void }) {
  const sectionActive = COMPLIANCE_ITEMS.some((i) => i.page === activePage);
  return (
    <div className="relative group">
      <NavItem icon={<ShieldCheck size={20} />} active={sectionActive} title="Compliance" disableTooltip />
      <div className="absolute left-full top-0 z-[9999] hidden group-hover:block pl-2">
        <div className="app-menu w-[250px] bg-white rounded-lg shadow-lg border border-[#DFE5ED] py-1">
          {COMPLIANCE_ITEMS.map((item) => {
            const isActive = item.page === activePage;
            return (
              <button
                key={item.label}
                onClick={() => onNavigate?.(item.page)}
                className={`w-full px-3 py-2 text-[13px] text-left transition-colors flex items-center gap-2.5 whitespace-nowrap ${
                  isActive ? 'bg-[#3D8BD0] text-white' : 'hover:bg-[#F5F7FA] text-[#364658]'
                }`}
              >
                <span className={`flex-shrink-0 ${isActive ? 'text-white' : 'text-[#6B7280]'}`}>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

interface NavItemProps {
  icon: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  title?: string;
  // The Assets item shows its own hover flyout, so it opts out of the tooltip.
  disableTooltip?: boolean;
}

function NavItem({ icon, active, onClick, title, disableTooltip }: NavItemProps) {
  const button = (
    <button
      onClick={onClick}
      className={`flex h-[40px] w-full items-center justify-center transition-colors relative ${
        active
          ? 'bg-[#3D8BD0]'
          : 'bg-transparent hover:bg-[#e9ebef]'
      }`}
    >
      {active && <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#2d6ca0]" />}
      <div className={`flex items-center justify-center size-[20px] ${active ? 'text-white' : 'text-[#364658]'}`}>
        {icon}
      </div>
    </button>
  );

  if (!title || disableTooltip) return button;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent side="right">{title}</TooltipContent>
    </Tooltip>
  );
}

interface SidebarProps {
  activePage?: string;
  onNavigate?: (page: string) => void;
}

export function Sidebar({ activePage, onNavigate }: SidebarProps) {
  return (
    <aside className="flex h-full w-[54px] flex-col border-r border-[#e5e7eb] bg-[#f9fafb]">
      <div className="flex flex-col">
        <NavItem
          icon={<IconDashboard size={20} />}
          active={activePage === 'dashboard' || activePage === 'dashboards'}
          title="Dashboard"
          onClick={() => onNavigate?.('dashboard')}
        />
        <NavItem
          icon={<IconRequest size={20} />}
          active={activePage === 'request'}
          title="Request"
          onClick={() => onNavigate?.('request')}
        />
        <NavItem
          icon={<IconProblem size={20} />}
          active={activePage === 'problem'}
          title="Problem"
          onClick={() => onNavigate?.('problem')}
        />
        <NavItem
          icon={<IconChange size={20} />}
          active={activePage === 'change'}
          title="Change"
          onClick={() => onNavigate?.('change')}
        />
        <NavItem
          icon={<IconRelease size={20} />}
          active={activePage === 'release'}
          title="Release"
          onClick={() => onNavigate?.('release')}
        />
        <AssetsNavItem activePage={activePage} onNavigate={onNavigate} />
        <NavItem
          icon={<IconCMDB size={20} />}
          active={activePage === 'cmdb'}
          title="CMDB"
          onClick={() => onNavigate?.('cmdb')}
        />
        <VulnerabilityNavItem activePage={activePage} onNavigate={onNavigate} />
        {/* BOM — sits directly under Vulnerability; opens the BOM Inventory listing of the fleet. */}
        <NavItem
          icon={<IconBom size={20} />}
          active={activePage === 'bom'}
          title="BOM"
          onClick={() => onNavigate?.('bom')}
        />
        <PatchNavItem activePage={activePage} onNavigate={onNavigate} />
        <PackageNavItem activePage={activePage} onNavigate={onNavigate} />
        {/* Compliance — sits directly below Package: Compliance Policy + Compliance Visualization. */}
        <ComplianceNavItem activePage={activePage} onNavigate={onNavigate} />
        <NavItem icon={<IconProject size={20} />} title="Project" active={activePage === 'projects'} onClick={() => onNavigate?.('projects')} />
        <NavItem icon={<IconKnowledge size={20} />} title="Knowledge" active={activePage === 'knowledge'} onClick={() => onNavigate('knowledge')} />
        <NavItem icon={<IconReport size={20} />} title="Report" active={activePage === 'reports'} onClick={() => onNavigate?.('reports')} />
        <NavItem icon={<IconMyApproval size={20} />} title="My Approval" active={activePage === 'my-approvals'} onClick={() => onNavigate?.('my-approvals')} />
        <NavItem icon={<IconTask size={20} />} title="Task" active={activePage === 'tasks'} onClick={() => onNavigate?.('tasks')} />
        <NavItem icon={<IconMyTeam size={20} />} title="My Team" active={activePage === 'my-team'} onClick={() => onNavigate?.('my-team')} />
      </div>

      {/* Pinned to the BOTTOM — the team's two reference pages: the listing-view bench
          and the icon library. Neither is a product module, hence the divider. */}
      <div className="mt-auto flex flex-col border-t border-[#e5e7eb] py-1">
        <NavItem
          icon={<LayoutTemplate size={20} />}
          title="Views Lab"
          active={activePage === 'views-lab'}
          onClick={() => onNavigate?.('views-lab')}
        />
        <NavItem
          icon={<Shapes size={20} />}
          title="Icon Library"
          active={activePage === 'icons'}
          onClick={() => onNavigate?.('icons')}
        />
      </div>
    </aside>
  );
}
