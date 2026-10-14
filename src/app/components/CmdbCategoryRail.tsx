/* ── CMDB CI-class rail ──────────────────────────────────────────────────────
   The CMDB's own navigation: a CI is an instance of a CLASS, and the class tree is
   how anyone actually works a configuration database ("show me the switches", "show
   me everything virtual"). Picking a node filters the grid; picking a parent
   includes everything beneath it, because a CI recorded against the parent class is
   still one of those things.

   The chrome is the product's, not a new invention: the same white rail, hairline
   border and 13px rows as the views rail beside it, the standard `rounded` controls,
   and the light-blue active fill used for a selected row everywhere else. */
import { useMemo, useState } from 'react';
import {
  AppWindow, Battery, Boxes, Building2, ChevronRight, Cloud, Columns3, Cpu, Database,
  HardDrive, Laptop, Layers, MapPin, Monitor, Network, PanelLeftClose, PanelLeftOpen, Printer,
  Radio, Router, Scale, Search, Server, Shield, Smartphone, Tablet, X,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

export interface CiClassNode {
  label: string;
  /** The ciType values this node matches DIRECTLY — a parent class has its own instances
      (a CI recorded as "Server" rather than as "Windows Server"). */
  types?: string[];
  children?: CiClassNode[];
}

/* The product's CI class tree, as defined by the CMDB admin. Leaves match the ciType of
   the same name; a parent also carries the generic value the product writes when a CI is
   recorded against the parent class itself. */
/** The root every CI hangs off. Selecting it is how you get back to the whole database. */
export const CI_ROOT = 'Base CI';

export const CI_CLASS_TREE: CiClassNode[] = [{
  label: CI_ROOT,
  children: [
  {
    label: 'Hardware',
    types: ['Hardware'],
    children: [
      {
        label: 'Server',
        types: ['Server'],
        children: [
          { label: 'UNIX Server' },
          { label: 'AIX Server' },
          { label: 'VIOS Server' },
          { label: 'VMWARE Server' },
          { label: 'Solaris Server' },
          { label: 'Windows Server' },
        ],
      },
      {
        label: 'Desktops',
        children: [
          { label: 'Windows Desktop' },
          { label: 'Linux Desktop' },
          { label: 'Mac Desktop' },
        ],
      },
      {
        label: 'Laptops',
        children: [
          { label: 'Windows Laptop' },
          { label: 'Linux Laptop' },
          { label: 'Mac Laptop' },
          { label: 'Chromebook Laptop' },
        ],
      },
      {
        label: 'Network Devices',
        children: [
          { label: 'Router' },
          { label: 'Switch' },
          { label: 'Firewall' },
          { label: 'Load Balancer' },
          { label: 'IP Address' },
          { label: 'Access Points' },
        ],
      },
      {
        label: 'Storage Devices',
        children: [
          { label: 'Storage Area Network (SAN)' },
          { label: 'Disk Array' },
        ],
      },
      { label: 'Printers', types: ['Printer'] },
      {
        label: 'Mobile Devices',
        types: ['Mobile Devices'],
        children: [
          { label: 'Mobile', children: [{ label: 'Android Mobile' }, { label: 'Ios Mobile' }] },
          { label: 'Tablet', children: [{ label: 'Android Tablet' }, { label: 'IOS Tablet' }] },
        ],
      },
      { label: 'UPS' },
      { label: 'Chassis' },
      { label: 'Rack' },
    ],
  },
  {
    label: 'Infrastructure',
    children: [
      { label: 'Data Centres' },
      { label: 'Server Rooms' },
      { label: 'Remote Sites' },
    ],
  },
  {
    /* The root Base CI class is where the product files a service record. */
    label: 'Services',
    types: ['Base CI'],
    children: [
      { label: 'Application Service' },
      { label: 'Business Service' },
      { label: 'Business Applications' },
      { label: 'Technical Service' },
      { label: 'Infrastructure Service' },
    ],
  },
  {
    label: 'Virtualization',
    children: [
      { label: 'Virtual Machines' },
      { label: 'Hypervisors' },
      { label: 'VMware vCenter' },
      { label: 'VMware ESXi' },
      { label: 'Hyper-V Server' },
    ],
  },
  {
    label: 'Public Cloud Services',
    types: ['Public Cloud Service'],
    children: [
      {
        label: 'AWS',
        children: [
          { label: 'EC2', children: [{ label: 'Aws Windows' }, { label: 'Aws Linux' }] },
          { label: 'S3' },
          { label: 'RDS' },
        ],
      },
      {
        label: 'Azure',
        children: [
          { label: 'VM', children: [{ label: 'Azure Windows' }, { label: 'Azure Linux' }] },
          { label: 'Azure Storage' },
          { label: 'Azure Database' },
        ],
      },
      { label: 'GCP' },
    ],
  },
  {
    label: 'Private Cloud Services',
    types: ['Private Cloud Service'],
    children: [
      {
        label: 'Nutanix Cloud',
        children: [
          { label: 'Nutanix Prism' },
          { label: 'Nutanix Cluster' },
          { label: 'Nutanix Host' },
          { label: 'Nutanix VM' },
          { label: 'Nutanix Storage Pool' },
          { label: 'Nutanix Storage Container' },
        ],
      },
    ],
  },
  {
    label: 'Application',
    types: ['Application'],
    children: [
      {
        label: 'Web Server',
        children: [
          { label: 'Apache Web Server' },
          { label: 'IIS Web Server' },
          { label: 'Nginx Web Server' },
        ],
      },
      { label: 'Application Server', children: [{ label: 'Tomcat Server' }] },
      {
        label: 'Database',
        children: [
          { label: 'MySQL' },
          { label: 'SQL Server' },
          { label: 'Oracle' },
          { label: 'PostgreSQL' },
        ],
      },
    ],
  },
  ],
}];

/** The ciTypes filed against THIS class and no other. A class names its own where the
    product's value differs from the label ("Printers" holds `Printer`); otherwise the
    label is the value. A parent class is a class in its own right, so its own CIs are the
    ones recorded at that level — not the ones recorded against its children. */
export const ownTypes = (n: CiClassNode): string[] => n.types ?? [n.label];

/** Every ciType in a node's subtree — used where the whole vocabulary is wanted (the CI
    Type filter's option list), NOT for what a class shows when you pick it. */
export const typesUnder = (n: CiClassNode): string[] =>
  n.children?.length
    ? [...(n.types ?? []), ...n.children.flatMap(typesUnder)]
    : ownTypes(n);

/** The tree flattened into a MENU of assignable CI types, indented by depth. A class whose
    stored value differs from its label ("Printers" files CIs as `Printer`) offers the
    value, because that is what the grid's CI Type column shows and what a filter matches.
    Deduped, so the root's `Base CI` is not offered twice. */
export const CI_TYPE_MENU: { label: string; depth: number }[] = (() => {
  const seen = new Set<string>();
  const out: { label: string; depth: number }[] = [];
  const walk = (nodes: CiClassNode[], depth: number) =>
    nodes.forEach((n) => {
      ownTypes(n).forEach((t) => {
        if (seen.has(t)) return;
        seen.add(t);
        out.push({ label: t, depth });
      });
      if (n.children?.length) walk(n.children, depth + 1);
    });
  walk(CI_CLASS_TREE, 0);
  return out;
})();

/** The path of labels from the root down to `label`, or null. */
const pathTo = (label: string, nodes = CI_CLASS_TREE, trail: string[] = []): string[] | null => {
  for (const n of nodes) {
    if (n.label === label) return [...trail, n.label];
    const hit = n.children && pathTo(label, n.children, [...trail, n.label]);
    if (hit) return hit;
  }
  return null;
};

const findNode = (label: string, nodes = CI_CLASS_TREE): CiClassNode | undefined => {
  for (const n of nodes) {
    if (n.label === label) return n;
    const hit = n.children && findNode(label, n.children);
    if (hit) return hit;
  }
  return undefined;
};

/** The ciType values a selected rail node should show: its OWN, since a parent class is a
    class in its own right and its children are different classes. `null` = the whole
    database, which is what the root means. */
export const typesForClass = (label: string | null): string[] | null => {
  if (!label || label === CI_ROOT) return null;
  const node = findNode(label);
  return node ? ownTypes(node) : null;
};

/* One glyph per class — the same vocabulary the CI Type column uses, so a switch looks
   like a switch in the rail and in the grid. Matched on the words in the label, so a new
   leaf ("Solaris Server", "Azure Linux") is covered the day it is added. */
export const ciTypeIcon = (type?: string, size = 15) => {
  const t = (type ?? '').toLowerCase();
  const is = (...w: string[]) => w.some((x) => t.includes(x));
  if (is('laptop', 'chromebook', 'macbook')) return <Laptop size={size} />;
  if (is('desktop')) return <Monitor size={size} />;
  if (is('mobile', 'ios', 'android')) return t.includes('tablet') ? <Tablet size={size} /> : <Smartphone size={size} />;
  if (is('tablet')) return <Tablet size={size} />;
  if (is('router')) return <Router size={size} />;
  if (is('firewall')) return <Shield size={size} />;
  if (is('load balancer')) return <Scale size={size} />;
  if (is('access point')) return <Radio size={size} />;
  if (is('switch', 'network', 'ip address')) return <Network size={size} />;
  if (is('storage', 'san', 'disk', 's3')) return <HardDrive size={size} />;
  if (is('printer')) return <Printer size={size} />;
  if (is('ups')) return <Battery size={size} />;
  if (is('rack')) return <Columns3 size={size} />;
  if (is('chassis')) return <Boxes size={size} />;
  if (is('database', 'mysql', 'sql', 'oracle', 'postgres', 'rds')) return <Database size={size} />;
  if (is('web server', 'apache', 'nginx', 'iis', 'tomcat', 'application server')) return <Server size={size} />;
  if (is('cloud', 'aws', 'azure', 'gcp', 'ec2', 'nutanix')) return <Cloud size={size} />;
  if (is('virtual', 'hypervisor', 'vmware', 'hyper-v', 'vcenter', 'esxi', 'vm')) return <Cpu size={size} />;
  if (is('server')) return <Server size={size} />;
  if (is('data centre', 'server room', 'remote site', 'infrastructure')) return <MapPin size={size} />;
  if (is('service')) return <Layers size={size} />;
  if (is('application')) return <AppWindow size={size} />;
  if (is('hardware')) return <HardDrive size={size} />;
  if (is('building', 'company')) return <Building2 size={size} />;
  return <Database size={size} />;
};

/* A row is ONE block: the twisty and the label share a single rounded surface with equal
   padding on both sides, so the selected state reads as a clean pill rather than a fill
   with a marker bolted to its edge. */
const SHELL = 'group/ci flex items-center gap-1 rounded px-1.5 transition-colors';
const LABEL = 'flex min-w-0 flex-1 items-center gap-2 text-left text-[13px] transition-colors';

export function CmdbCategoryRail({
  counts,
  active,
  onSelect,
  forceCollapsed = false,
  onExpand,
}: {
  /** ciType → number of CIs, so every node can show what it holds. Base CI's own count
      falls out of the tree: it is the sum of everything beneath it. */
  counts: Record<string, number>;
  active: string | null;
  onSelect: (label: string | null) => void;
  /** The page needs the slot for something else (the views rail) — show the strip, which
      keeps the classes on screen and one click away instead of vanishing them. */
  forceCollapsed?: boolean;
  /** Asks the page for the slot back, so expanding from the strip also closes whatever
      took it. */
  onExpand?: () => void;
}) {
  const [collapsedLocal, setCollapsed] = useState(false);
  const collapsed = collapsedLocal || forceCollapsed;
  const [q, setQ] = useState('');
  /* The tree is 80-odd classes deep in places, so only the ROOT starts open: its seven
     classes read as a menu, where forty rows read as a wall. Selecting a node opens its
     branch, and a search opens whatever it matches. */
  const [open, setOpen] = useState<Set<string>>(new Set([CI_ROOT]));

  /* Counts are no longer PRINTED on the rows — the tree is a place to navigate, not a
     report — but they still decide which classes are dead ends and get dimmed. What is
     counted is what the class will actually SHOW; the root is the whole database. */
  const total = Object.values(counts).reduce((s, n) => s + n, 0);
  const countOf = (n: CiClassNode) =>
    n.label === CI_ROOT ? total : ownTypes(n).reduce((s, t) => s + (counts[t] ?? 0), 0);
  const query = q.trim().toLowerCase();

  /* A search keeps any branch containing a match, pruned to the matching path — so a hit
     on "Nutanix VM" still shows which class it belongs to. */
  const prune = (nodes: CiClassNode[]): CiClassNode[] =>
    nodes
      .map((n) => {
        if (n.label.toLowerCase().includes(query)) return n;
        const kids = n.children ? prune(n.children) : [];
        return kids.length ? { ...n, children: kids } : null;
      })
      .filter(Boolean) as CiClassNode[];
  const tree = useMemo(() => (query ? prune(CI_CLASS_TREE) : CI_CLASS_TREE), [query]);

  /* The ANCESTORS of the selected class stay open, so a deep selection is never hidden —
     but the selected node itself is not forced open, or its own twisty would do nothing
     (which is exactly what Base CI's did, since it is selected by default). */
  const activePath = useMemo(() => new Set((active ? pathTo(active) ?? [] : []).slice(0, -1)), [active]);
  const isOpen = (label: string) => !!query || open.has(label) || activePath.has(label);

  const toggle = (label: string) =>
    setOpen((s) => {
      const next = new Set(s);
      next.has(label) ? next.delete(label) : next.add(label);
      return next;
    });

  const renderNode = (n: CiClassNode, depth: number) => {
    const kids = n.children ?? [];
    const isActive = active === n.label;
    const opened = isOpen(n.label);
    const count = countOf(n);
    /* A DEAD END is dimmed — a class with nothing of its own and nothing beneath it. A
       parent that holds none of its own CIs is not dimmed: its children are the content,
       and greying the way in would hide half the tree. */
    const bare = count === 0 && kids.length === 0 && !isActive;
    /* Base CI and the seven classes under it are the page's landmarks, so they carry the
       weight; everything deeper reads as detail. */
    const top = depth === 0;
    const strong = depth <= 1;
    return (
      <div key={`${depth}-${n.label}`} className={top ? 'mt-0.5 first:mt-0' : ''}>
        <div
          className={`${SHELL} ${
            isActive ? 'bg-[#EBF5FF]' : 'hover:bg-[#F5F7FA]'
          }`}
        >
          {/* The twisty toggles the branch and NOTHING else; the row selects the class and
              opens it. Two targets, each doing one obvious thing — and both live inside
              the row's own surface, so the highlight stays a single clean shape. */}
          {kids.length > 0 ? (
            <button
              onClick={() => toggle(n.label)}
              aria-label={opened ? `Collapse ${n.label}` : `Expand ${n.label}`}
              className={`flex size-5 flex-shrink-0 items-center justify-center rounded transition-colors hover:bg-[#DCE4ED] ${isActive ? 'text-[#3D8BD0]' : 'text-[#9CA3AF] hover:text-[#364658]'}`}
            >
              <ChevronRight size={14} className={`transition-transform duration-150 ${opened ? 'rotate-90' : ''}`} />
            </button>
          ) : (
            <span className="size-5 flex-shrink-0" />
          )}
          <button
            /* Selecting a class ONLY selects it — the branch stays exactly as the reader
               left it. Opening and closing belongs to the twisty, and nothing else. */
            onClick={() => onSelect(n.label)}
            className={`${LABEL} ${strong ? 'py-2' : 'py-1.5'} ${
              isActive
                ? 'font-medium text-[#3D8BD0]'
                : bare
                  ? 'text-[#9AA7B5]'
                  : strong
                    ? 'font-medium text-[#364658]'
                    : 'text-[#4A5568]'
            }`}
          >
            <span className={`flex-shrink-0 ${isActive ? 'text-[#3D8BD0]' : bare ? 'text-[#C2CCD8]' : strong ? 'text-[#7B8FA5]' : 'text-[#94A3B8]'}`}>
              {ciTypeIcon(n.label, top ? 16 : 15)}
            </span>
            <span className="truncate">{n.label}</span>
          </button>
        </div>
        {/* Children hang off a hairline spine, so three levels of nesting read without
            three levels of chevrons. The 16px margin puts that spine directly under the
            PARENT's twisty — the row's 6px padding plus half of the 20px twisty — so the
            line drops out of the chevron it belongs to instead of beside it. Every level
            measures the same, because a row's twisty always centres 16px from its own
            left edge. */}
        {opened && kids.length > 0 && (
          <div className="ml-4 border-l border-[#E8EDF3]">
            {kids.map((c) => renderNode(c, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (collapsed) {
    return (
      /* The WHOLE strip is the target, not the icon on it: a 44px column that only responds
         on a 32px square is a target the reader has to aim at. */
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => { setCollapsed(false); onExpand?.(); }}
            className="group/strip flex w-[48px] flex-shrink-0 flex-col items-center border-r border-[#E5E7EB] bg-white py-3 text-left transition-colors hover:bg-[#F7F9FC]"
          >
            {/* Boxed like the panel button it restores, and sitting at the same height as
                the title row beside it. */}
            <span className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded border border-[#DFE5ED] bg-white text-[#6b7280] transition-colors group-hover/strip:border-[#3D8BD0] group-hover/strip:bg-[#EBF5FF] group-hover/strip:text-[#3D8BD0]">
              <PanelLeftOpen size={16} />
            </span>
            {/* The active class stays legible while the rail is folded away. */}
            <span className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-[#7B8FA5] transition-colors group-hover/strip:text-[#3D8BD0] [writing-mode:vertical-rl]">
              {active ?? CI_ROOT}
            </span>
          </button>
        </TooltipTrigger>
        <TooltipContent side="right">Show CMDB</TooltipContent>
      </Tooltip>
    );
  }

  return (
    /* 344px, measured rather than guessed: the longest label in the tree, "Storage Area
       Network (SAN)", paints 201px at the row's type settings, and two levels of indent
       plus the chevron and icon spend another 90. Anything narrower puts an ellipsis on a
       class name, which is exactly what a navigator must not do. */
    <div className="flex w-[344px] flex-shrink-0 flex-col border-r border-[#E5E7EB] bg-white">
      {/* The rail's header is built to the SAME recipe as the grid's title row beside it —
          px-4/py-3, a 17px semibold title and a boxed 32px panel button — so the two sit on
          one line across the page instead of two headers at two heights.
          No collapse-all button: Base CI's own twisty folds the entire tree. */}
      <div className="flex items-center gap-3 px-4 py-3">
        <h2 className="min-w-0 flex-1 truncate text-[17px] font-semibold text-[#1E293B]">CMDB</h2>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setCollapsed(true)}
              className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded border border-[#DFE5ED] bg-white text-[#6b7280] transition-colors hover:bg-[#F5F7FA] hover:text-[#364658]"
            >
              <PanelLeftClose size={16} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">Hide CMDB</TooltipContent>
        </Tooltip>
      </div>
      <div className="px-4 pb-2">
        <div className="relative">
          <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search classes"
            className="h-8 w-full rounded border border-[#DFE5ED] bg-white pl-8 pr-7 text-[13px] text-[#364658] outline-none transition-colors placeholder:text-[#9CA3AF] focus:border-[#3D8BD0]"
          />
          {q && (
            <button
              onClick={() => setQ('')}
              className="absolute right-1.5 top-1/2 flex size-5 -translate-y-1/2 items-center justify-center rounded text-[#9CA3AF] transition-colors hover:bg-[#F3F4F6] hover:text-[#364658]"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
        {/* Base CI is the root of the class tree AND the way back to the whole database —
            one row doing one job, rather than an "All" row sitting beside the hierarchy it
            duplicates. */}
        {tree.map((n) => renderNode(n, 0))}
        {query && tree.length === 0 && (
          <div className="px-3 py-6 text-center text-[12px] text-[#94A3B8]">No class matches “{q}”.</div>
        )}
      </div>
    </div>
  );
}
