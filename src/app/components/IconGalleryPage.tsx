import { useMemo, useState } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Activity, AlertCircle, AlertTriangle, AlignCenter, AlignJustify, AlignLeft, AlignRight, AppWindow, Archive, Armchair, ArrowDown, ArrowLeft, ArrowRight, ArrowRightLeft, ArrowUp, ArrowUpDown, ArrowUpRight, BadgeCheck, Ban, Barcode, Baseline, BatteryFull, Bell, Blocks, Bold, BookOpen, Bookmark, Bot, Box, Boxes, Brain, Briefcase, Building2, Cable, Calendar, CalendarDays, Camera, Car, Check, CheckCheck, CheckCircle, CheckCircle2, CheckIcon, CheckSquare, ChevronDown, ChevronDownIcon, ChevronLeft, ChevronLeftIcon, ChevronRight, ChevronRightIcon, ChevronUp, ChevronUpIcon, ChevronsDownUp, ChevronsLeft, ChevronsRight, ChevronsUpDown, Circle, CircleDollarSign, CircleIcon, CircuitBoard, ClipboardCheck, ClipboardList, Clock, Code, Columns3, Copy, CornerUpLeft, CornerUpRight, Cpu, Database, Disc, DollarSign, Download, Droplet, Edit, Edit2, ExternalLink, Eye, EyeOff, FileCheck, FileCog, FileDown, FileOutput, FileText, Files, Filter, FlaskConical, Folder, FolderOpen, Forward, Gauge, Globe, GripVertical, GripVerticalIcon, HardDrive, Heading1, Heading2, Heading3, Headphones, Heart, Highlighter, History, Image, Info, Italic, KeyRound, Keyboard, Laptop, Layers, LayoutGrid, Library, Lightbulb, Link, Link2, List, ListOrdered, Loader2, Lock, LogIn, Mail, Map, MapPin, Maximize, Maximize2, MemoryStick, MessageSquare, Minimize2, Minus, MinusIcon, MinusSquare, Monitor, Moon, MoreHorizontal, MoreHorizontalIcon, MoreVertical, Mouse, MoveHorizontal, MoveVertical, Network, Orbit, Package, PackageCheck, PackagePlus, PaintBucket, PanelLeftIcon, Paperclip, Pause, Pencil, Pilcrow, Pin, PinOff, Play, Plug, Plus, PlusCircle, Power, Printer, QrCode, ReceiptText, Recycle, Redo, Redo2, RefreshCw, Repeat, Reply, Rocket, RotateCcw, Router, Save, ScanLine, ScanSearch, Search, SearchIcon, Send, SendHorizontal, Server, ServerCog, Settings, Settings2, Share2, Shield, ShieldAlert, ShieldCheck, ShieldX, ShoppingCart, Smartphone, Smile, SmilePlus, Sparkles, Square, SquareCheckBig, SquarePen, Star, Stethoscope, StickyNote, Strikethrough, Sunrise, Table, Tag, TextCursorInput, ThumbsDown, ThumbsUp, Ticket, Trash2, Truck, Type, Underline, Undo, Undo2, Unlink, Upload, Usb, User, UserCheck, Users, Video, Wand2, Workflow, Wrench, X, XCircle, XIcon, Zap, ArrowLeftRight, ArrowLeftToLine, ArrowRightToLine, BarChart3, BarChartHorizontal, CalendarClock, CircleDot, CopyPlus, Crown, Flag, GitMerge, Hash, Hourglass, KeySquare, LayoutList, LineChart, ListChecks, PieChart, Shapes, SquareKanban, TrendingDown, TrendingUp, TriangleAlert, UserRound } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  IconDashboard,
  IconRequest,
  IconProblem,
  IconChange,
  IconRelease,
  IconAssets,
  IconCMDB,
  IconPatch,
  IconPackage,
  IconProject,
  IconKnowledge,
  IconReport,
  IconMyApproval,
  IconTask,
  IconMyTeam,
  IconVulnerability,
} from './SidebarIcons';
import { AiSparkle } from './upstream/AiSparkle';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { toast } from 'sonner';

/* Icon Gallery — every icon used anywhere in this prototype, in one place, so the frontend team
 * has a single reference. AUTO-COLLECTED from the codebase's lucide-react imports plus the custom
 * sidebar SVGs. Click any tile to copy its full SVG markup at the selected size.
 *
 * To refresh after adding icons: re-run the collector, or just add the new name to the right
 * group below — the page renders whatever it is given. */

const ICON_GROUPS: { label: string; icons: [string, LucideIcon][] }[] = [
  { label: "Navigation & layout", icons: [['ChevronDown', ChevronDown], ['ChevronUp', ChevronUp], ['ChevronLeft', ChevronLeft], ['ChevronRight', ChevronRight], ['ChevronsUpDown', ChevronsUpDown], ['ChevronsDownUp', ChevronsDownUp], ['ChevronsLeft', ChevronsLeft], ['ChevronsRight', ChevronsRight], ['ArrowUp', ArrowUp], ['ArrowDown', ArrowDown], ['ArrowLeft', ArrowLeft], ['ArrowRight', ArrowRight], ['ArrowUpDown', ArrowUpDown], ['ArrowUpRight', ArrowUpRight], ['ArrowRightLeft', ArrowRightLeft], ['CornerUpLeft', CornerUpLeft], ['CornerUpRight', CornerUpRight], ['LayoutGrid', LayoutGrid], ['List', List], ['Columns3', Columns3], ['Table', Table], ['Maximize', Maximize], ['Maximize2', Maximize2], ['Minimize2', Minimize2], ['MoveHorizontal', MoveHorizontal], ['MoveVertical', MoveVertical], ['GripVertical', GripVertical], ['MoreVertical', MoreVertical], ['MoreHorizontal', MoreHorizontal], ['ExternalLink', ExternalLink], ['Keyboard', Keyboard], ['ArrowLeftRight', ArrowLeftRight], ['ArrowLeftToLine', ArrowLeftToLine], ['ArrowRightToLine', ArrowRightToLine], ['LayoutList', LayoutList], ['SquareKanban', SquareKanban]] as [string, LucideIcon][] },
  { label: "Actions", icons: [['Plus', Plus], ['PlusCircle', PlusCircle], ['Minus', Minus], ['MinusSquare', MinusSquare], ['X', X], ['XCircle', XCircle], ['Check', Check], ['CheckCheck', CheckCheck], ['CheckCircle', CheckCircle], ['CheckCircle2', CheckCircle2], ['CheckSquare', CheckSquare], ['SquareCheckBig', SquareCheckBig], ['Edit', Edit], ['Edit2', Edit2], ['SquarePen', SquarePen], ['Pencil', Pencil], ['Trash2', Trash2], ['Copy', Copy], ['Save', Save], ['Download', Download], ['Upload', Upload], ['Share2', Share2], ['Send', Send], ['SendHorizontal', SendHorizontal], ['Reply', Reply], ['Forward', Forward], ['RefreshCw', RefreshCw], ['RotateCcw', RotateCcw], ['Undo', Undo], ['Undo2', Undo2], ['Redo', Redo], ['Redo2', Redo2], ['Search', Search], ['ScanSearch', ScanSearch], ['Filter', Filter], ['Settings', Settings], ['Settings2', Settings2], ['Printer', Printer], ['Play', Play], ['Pause', Pause], ['Power', Power], ['Repeat', Repeat], ['Wand2', Wand2], ['Link', Link], ['Link2', Link2], ['Unlink', Unlink], ['Pin', Pin], ['PinOff', PinOff], ['Bookmark', Bookmark], ['Star', Star], ['Heart', Heart], ['ThumbsUp', ThumbsUp], ['ThumbsDown', ThumbsDown], ['Eye', Eye], ['EyeOff', EyeOff], ['Lock', Lock], ['LogIn', LogIn], ['Ban', Ban], ['Archive', Archive], ['Recycle', Recycle], ['CopyPlus', CopyPlus], ['GitMerge', GitMerge]] as [string, LucideIcon][] },
  { label: "Status & feedback", icons: [['AlertCircle', AlertCircle], ['AlertTriangle', AlertTriangle], ['Info', Info], ['Loader2', Loader2], ['Clock', Clock], ['History', History], ['BadgeCheck', BadgeCheck], ['Shield', Shield], ['ShieldAlert', ShieldAlert], ['ShieldCheck', ShieldCheck], ['ShieldX', ShieldX], ['Sparkles', Sparkles], ['Zap', Zap], ['Activity', Activity], ['Gauge', Gauge], ['Bell', Bell], ['Circle', Circle], ['Square', Square], ['CircleDot', CircleDot], ['Flag', Flag], ['Hourglass', Hourglass], ['TrendingUp', TrendingUp], ['TrendingDown', TrendingDown], ['TriangleAlert', TriangleAlert], ['Crown', Crown], ['ListChecks', ListChecks]] as [string, LucideIcon][] },
  { label: "Files & documents", icons: [['FileText', FileText], ['FileCheck', FileCheck], ['FileCog', FileCog], ['FileDown', FileDown], ['FileOutput', FileOutput], ['Files', Files], ['Folder', Folder], ['FolderOpen', FolderOpen], ['Paperclip', Paperclip], ['ClipboardCheck', ClipboardCheck], ['ClipboardList', ClipboardList], ['BookOpen', BookOpen], ['Library', Library], ['StickyNote', StickyNote], ['ReceiptText', ReceiptText], ['Barcode', Barcode], ['QrCode', QrCode], ['Image', Image], ['Camera', Camera], ['Video', Video]] as [string, LucideIcon][] },
  { label: "People & communication", icons: [['User', User], ['UserCheck', UserCheck], ['Users', Users], ['Mail', Mail], ['MessageSquare', MessageSquare], ['Headphones', Headphones], ['Bot', Bot], ['Brain', Brain], ['Smile', Smile], ['SmilePlus', SmilePlus], ['Briefcase', Briefcase], ['UserRound', UserRound]] as [string, LucideIcon][] },
  { label: "Assets, hardware & network", icons: [['Monitor', Monitor], ['Laptop', Laptop], ['Smartphone', Smartphone], ['Server', Server], ['Database', Database], ['HardDrive', HardDrive], ['Cpu', Cpu], ['MemoryStick', MemoryStick], ['CircuitBoard', CircuitBoard], ['Router', Router], ['Network', Network], ['Cable', Cable], ['Plug', Plug], ['Usb', Usb], ['Mouse', Mouse], ['BatteryFull', BatteryFull], ['Disc', Disc], ['Globe', Globe], ['Building2', Building2], ['MapPin', MapPin], ['Map', Map], ['Car', Car], ['Truck', Truck], ['Armchair', Armchair], ['Box', Box], ['Boxes', Boxes], ['Package', Package], ['PackageCheck', PackageCheck], ['PackagePlus', PackagePlus], ['AppWindow', AppWindow], ['Workflow', Workflow], ['Orbit', Orbit], ['Wrench', Wrench], ['Stethoscope', Stethoscope], ['FlaskConical', FlaskConical], ['ScanLine', ScanLine], ['Droplet', Droplet], ['Sunrise', Sunrise], ['Moon', Moon], ['KeyRound', KeyRound], ['Rocket', Rocket], ['Tag', Tag], ['Ticket', Ticket], ['ShoppingCart', ShoppingCart], ['CircleDollarSign', CircleDollarSign], ['DollarSign', DollarSign], ['Calendar', Calendar], ['CalendarDays', CalendarDays], ['Layers', Layers], ['Blocks', Blocks], ['Lightbulb', Lightbulb], ['Code', Code], ['CalendarClock', CalendarClock], ['KeySquare', KeySquare]] as [string, LucideIcon][] },
  { label: "Text editor", icons: [['Bold', Bold], ['Italic', Italic], ['Underline', Underline], ['Strikethrough', Strikethrough], ['Highlighter', Highlighter], ['PaintBucket', PaintBucket], ['Type', Type], ['Baseline', Baseline], ['Pilcrow', Pilcrow], ['Heading1', Heading1], ['Heading2', Heading2], ['Heading3', Heading3], ['AlignLeft', AlignLeft], ['AlignCenter', AlignCenter], ['AlignRight', AlignRight], ['AlignJustify', AlignJustify], ['ListOrdered', ListOrdered], ['TextCursorInput', TextCursorInput]] as [string, LucideIcon][] },
  { label: "Charts & reports", icons: [['BarChart3', BarChart3], ['BarChartHorizontal', BarChartHorizontal], ['LineChart', LineChart], ['PieChart', PieChart], ['Hash', Hash], ['Shapes', Shapes]] as [string, LucideIcon][] },
  { label: "General", icons: [['CheckIcon', CheckIcon], ['ChevronDownIcon', ChevronDownIcon], ['ChevronLeftIcon', ChevronLeftIcon], ['ChevronRightIcon', ChevronRightIcon], ['ChevronUpIcon', ChevronUpIcon], ['CircleIcon', CircleIcon], ['GripVerticalIcon', GripVerticalIcon], ['MinusIcon', MinusIcon], ['MoreHorizontalIcon', MoreHorizontalIcon], ['PanelLeftIcon', PanelLeftIcon], ['SearchIcon', SearchIcon], ['ServerCog', ServerCog], ['XIcon', XIcon]] as [string, LucideIcon][] },
];

const CUSTOM_ICONS: { name: string; use: string; Comp: (p: { size?: number; className?: string }) => JSX.Element }[] = [
  { name: 'IconDashboard', use: "Dashboard", Comp: IconDashboard },
  { name: 'IconRequest', use: "Requests / Tickets", Comp: IconRequest },
  { name: 'IconProblem', use: "Problems", Comp: IconProblem },
  { name: 'IconChange', use: "Changes", Comp: IconChange },
  { name: 'IconRelease', use: "Releases", Comp: IconRelease },
  { name: 'IconAssets', use: "Assets (flyout)", Comp: IconAssets },
  { name: 'IconCMDB', use: "CMDB / Base CI", Comp: IconCMDB },
  { name: 'IconPatch', use: "Patch Management (flyout)", Comp: IconPatch },
  { name: 'IconPackage', use: "Package Management (flyout)", Comp: IconPackage },
  { name: 'IconProject', use: "Projects", Comp: IconProject },
  { name: 'IconKnowledge', use: "Knowledge", Comp: IconKnowledge },
  { name: 'IconReport', use: "Reports", Comp: IconReport },
  { name: 'IconMyApproval', use: "My Approvals", Comp: IconMyApproval },
  { name: 'IconTask', use: "Tasks", Comp: IconTask },
  { name: 'IconMyTeam', use: "My Team", Comp: IconMyTeam },
  { name: 'IconVulnerability', use: "Vulnerability (flyout)", Comp: IconVulnerability },
  { name: 'AiSparkle', use: 'AI accents (buttons, banners, suggestions)', Comp: AiSparkle },
  { name: 'SlaHourglass', use: 'SLA pills (listing, kanban, detail)', Comp: SlaHourglass },
];

/* The SLA pill's hourglass — 12×16 artwork, so it scales by HEIGHT to keep its aspect. */
function SlaHourglass({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path
        fill="currentColor"
        transform="matrix(2.5 0 0 2.5 9 4)"
        d="M5.59375 6.29063C5.6875 6.42188 5.8375 6.5 6 6.5C6.1625 6.5 6.34062 6.42188 6.43437 6.29063L8.90688 2.79063C9.01563 2.63813 9.03031 2.43781 8.94469 2.27125C8.85938 2.10469 8.6875 2 8.52813 2L3.5 2C3.34062 2 3.14062 2.10469 3.05625 2.27125C2.99688 2.43781 2.98438 2.63813 3.09375 2.79063L5.59375 6.29063ZM11.5 15L11 15L11 13.6031C11 12.6156 10.6747 11.6281 10.0747 10.8719L7.87813 8L10.0747 5.12813C10.6747 4.34375 11 3.38438 11 2.39594L11 1L11.5 1C11.7761 1 12 0.77625 12 0.5C12 0.223875 11.7761 1.95718e-08 11.5 4.37114e-08L0.5 1.00536e-06C0.224999 1.0294e-06 1.95718e-08 0.223876 4.37114e-08 0.500001C6.78619e-08 0.776251 0.225 1 0.5 1L1 1L1 2.39594C1 3.38438 1.325 4.34375 1.925 5.12813L4.12188 8L1.925 10.8719C1.325 11.6281 1 12.6156 1 13.6031L1 15L0.500001 15C0.225001 15 1.33101e-06 15.225 1.35505e-06 15.5C1.37909e-06 15.775 0.225001 16 0.500001 16L11.5 16C11.7761 16 12 15.775 12 15.5C12 15.225 11.7761 15 11.5 15ZM10 15L2 15L2 13.6031C2 12.8344 2.25313 12.0875 2.74687 11.4781L5.14688 8.30313C5.28438 8.09688 5.28438 7.875 5.14688 7.69688L2.74687 4.52188C2.25312 3.9125 2 3.16563 2 2.39594L2 1L10 1L10 2.39594C10 3.16563 9.74719 3.9125 9.28031 4.52188L6.85313 7.69688C6.71563 7.875 6.71563 8.09688 6.85313 8.30313L9.28031 11.4781C9.74719 12.0875 10 12.8344 10 13.6031L10 15Z"
      />
    </svg>
  );
}

const SIZES = [14, 16, 20, 24, 48];

/* Convert any SVG primitive to equivalent path data. */
const num = (el: Element, name: string) => parseFloat(el.getAttribute(name) ?? '0') || 0;
function shapeToPathD(el: Element): string {
  switch (el.tagName.toLowerCase()) {
    case 'path': {
      const d = el.getAttribute('d') ?? '';
      const m = /^\s*m\s*(-?[\d.]+)[\s,]+(-?[\d.]+)\s*/.exec(d);
      if (!m) return d;
      const rest = d.slice(m[0].length);
      return `M${m[1]} ${m[2]}${/^[-\d.]/.test(rest) ? 'l' : ''}${rest}`;
    }
    case 'line': {
      return `M${num(el, 'x1')} ${num(el, 'y1')}L${num(el, 'x2')} ${num(el, 'y2')}`;
    }
    case 'polyline':
    case 'polygon': {
      const pts = (el.getAttribute('points') ?? '').trim().split(/[\s,]+/).map(Number);
      if (pts.length < 4) return '';
      let d = `M${pts[0]} ${pts[1]}`;
      for (let i = 2; i < pts.length; i += 2) d += `L${pts[i]} ${pts[i + 1]}`;
      return el.tagName.toLowerCase() === 'polygon' ? d + 'Z' : d;
    }
    case 'circle': {
      const cx = num(el, 'cx'), cy = num(el, 'cy'), r = num(el, 'r');
      return `M${cx - r} ${cy}A${r} ${r} 0 1 0 ${cx + r} ${cy}A${r} ${r} 0 1 0 ${cx - r} ${cy}Z`;
    }
    case 'ellipse': {
      const cx = num(el, 'cx'), cy = num(el, 'cy'), rx = num(el, 'rx'), ry = num(el, 'ry');
      return `M${cx - rx} ${cy}A${rx} ${ry} 0 1 0 ${cx + rx} ${cy}A${rx} ${ry} 0 1 0 ${cx - rx} ${cy}Z`;
    }
    case 'rect': {
      const x = num(el, 'x'), y = num(el, 'y'), w = num(el, 'width'), h = num(el, 'height');
      const r = Math.min(num(el, 'rx') || num(el, 'ry'), w / 2, h / 2);
      if (!r) return `M${x} ${y}H${x + w}V${y + h}H${x}Z`;
      return (
        `M${x + r} ${y}H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${y + r}V${y + h - r}` +
        `A${r} ${r} 0 0 1 ${x + w - r} ${y + h}H${x + r}A${r} ${r} 0 0 1 ${x} ${y + h - r}` +
        `V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`
      );
    }
    default:
      return '';
  }
}

/** Serialize an icon as a SINGLE-path SVG on the product-standard viewBox="0 0 48 48":
 *  the glyph is measured live (getBBox, stroke included), then scaled + centred into a
 *  40-unit content area — 4 units of breathing room per side, like the dev icon set.
 *  One matrix on the single <path> does the mapping, so stroke weight scales with the
 *  glyph and a developer recolours with a single rule. Defs (gradients) are preserved. */
function toSinglePathSvg(svg: SVGSVGElement): string {
  const KEEP = ['xmlns', 'width', 'height', 'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'class'];
  const attrs = KEEP
    .map((a) => {
      const v = a === 'xmlns' ? 'http://www.w3.org/2000/svg' : svg.getAttribute(a);
      return v ? `${a}="${v}"` : '';
    })
    .filter(Boolean)
    .join(' ');
  let defs = '';
  let d = '';
  let pathAttrs = '';
  let shapeT = '';
  svg.querySelectorAll('defs').forEach((el) => (defs += el.outerHTML));
  svg.querySelectorAll('path, line, polyline, polygon, circle, ellipse, rect').forEach((el) => {
    d += shapeToPathD(el);
    // A fill on the shape itself (custom icons, the gradient sparkle) rides along once.
    if (!pathAttrs && el.getAttribute('fill')) pathAttrs = ` fill="${el.getAttribute('fill')}"`;
    if (!shapeT && el.getAttribute('transform')) shapeT = el.getAttribute('transform') ?? '';
  });
  // Map each icon's own DESIGN BOX 1:1 onto the standard 48-box — every library keeps
  // its canonical proportions (a chevron stays small, stroke weights stay uniform), and
  // icons drawn on the 48 grid keep their designed margins. The merged d carries raw
  // geometry, so a shape-level matrix (a component's own standardisation) is composed in.
  const vb = (svg.getAttribute('viewBox') ?? '0 0 24 24').trim().split(/[\s,]+/).map(Number);
  const vbX = vb[0] || 0;
  const vbY = vb[1] || 0;
  const vbW = vb[2] || 24;
  const vbH = vb[3] || 24;
  const k = 48 / Math.max(vbW, vbH);
  let sa = 1;
  let se = 0;
  let sf = 0;
  const tm = /matrix\(([^)]+)\)/.exec(shapeT);
  if (tm) {
    const p = tm[1].trim().split(/[\s,]+/).map(Number);
    sa = p[0] || 1;
    se = p[4] || 0;
    sf = p[5] || 0;
  }
  const r4 = (n: number) => Math.round(n * 10000) / 10000;
  const S = r4(k * sa);
  const TX = r4(k * se + (48 - vbW * k) / 2 - vbX * k);
  const TY = r4(k * sf + (48 - vbH * k) / 2 - vbY * k);
  const transform = S === 1 && TX === 0 && TY === 0 ? '' : ` transform="matrix(${S} 0 0 ${S} ${TX} ${TY})"`;
  return `<svg ${attrs} viewBox="0 0 48 48">${defs}<path${pathAttrs}${transform} d="${d}"/></svg>`;
}

/* One gallery tile. Clicking it copies the icon's REAL SVG markup — read straight off the
 * rendered DOM node — so what the developer pastes is exactly what the app draws, at whatever
 * size the picker is on. Module-scope (not defined inside the page) so typing in the search box
 * does not remount all 239 tiles. */
function IconTile({ name, sub, size, children }: { name: string; sub?: string; size: number; children: React.ReactNode }) {
  // Serialize → merge primitives → one <path>. Memoised per size; search re-renders reuse it.
  const singleHtml = useMemo(() => {
    try {
      const raw = renderToStaticMarkup(children as React.ReactElement);
      const doc = new DOMParser().parseFromString(`<div>${raw}</div>`, 'text/html');
      const svg = doc.body.querySelector('svg');
      if (svg) {
        svg.setAttribute('width', String(size));
        svg.setAttribute('height', String(size));
      }
      return svg ? toSinglePathSvg(svg as SVGSVGElement) : raw;
    } catch {
      return '';
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size, name]);
  const copySvg = () => {
    if (!singleHtml) { toast.error('Could not read this icon'); return; }
    navigator.clipboard.writeText(singleHtml).then(
      () => toast.success(`Copied ${name} SVG (${size}px)`),
      () => toast.error('Could not copy to clipboard'),
    );
  };
  return (
    <button
      onClick={copySvg}
      title="Click to copy SVG code"
      className="group flex flex-col items-center justify-start gap-2 rounded-lg border border-[#E5E7EB] bg-white px-2 py-3.5 transition-all hover:border-[#3D8BD0] hover:shadow-sm"
    >
      <span className="flex items-center justify-center text-[#364658] transition-colors group-hover:text-[#3D8BD0]" style={{ height: Math.max(32, size) }} dangerouslySetInnerHTML={{ __html: singleHtml }} />
      <span className="w-full truncate px-1 text-center text-[11px] text-[#64748B] transition-colors group-hover:text-[#3D8BD0]" title={name}>{name}</span>
      {sub && <span className="w-full truncate px-1 text-center text-[10px] text-[#9CA3AF]">{sub}</span>}
    </button>
  );
}

export function IconGalleryPage({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [search, setSearch] = useState('');
  const [size, setSize] = useState(20);
  const q = search.trim().toLowerCase();

  const customMatches = CUSTOM_ICONS.filter((c) => !q || c.name.toLowerCase().includes(q) || c.use.toLowerCase().includes(q));
  const groupMatches = ICON_GROUPS
    .map((g) => ({ ...g, icons: g.icons.filter(([n]) => !q || n.toLowerCase().includes(q) || g.label.toLowerCase().includes(q)) }))
    .filter((g) => g.icons.length > 0);
  const total = ICON_GROUPS.reduce((a, g) => a + g.icons.length, 0) + CUSTOM_ICONS.length;
  const shown = groupMatches.reduce((a, g) => a + g.icons.length, 0) + customMatches.length;

  return (
    <div className="flex h-screen bg-[#f9fafb]">
      <Sidebar activePage="icons" onNavigate={onNavigate} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header selectedCount={0} />

        {/* Toolbar */}
        <div className="flex-shrink-0 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3">
            <div className="min-w-0">
              <h1 className="text-[16px] font-semibold text-[#364658]">Icon Library</h1>
              <p className="mt-0.5 text-[12px] text-[#7B8FA5]">
                Every icon used across the product · <span className="font-medium text-[#364658]">{total}</span> total
                {q && <> · showing <span className="font-medium text-[#364658]">{shown}</span></>}
              </p>
            </div>
            <div className="flex flex-shrink-0 items-center gap-2">
              <div className="flex overflow-hidden rounded border border-[#DFE5ED]">
                {SIZES.map((s, i) => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    className={`h-8 px-2.5 text-[12px] font-medium transition-colors ${i > 0 ? 'border-l border-[#DFE5ED]' : ''} ${size === s ? 'bg-[#EBF5FF] text-[#3D8BD0]' : 'bg-white text-[#364658] hover:bg-[#F3F4F6]'}`}
                  >{s}px</button>
                ))}
              </div>
            </div>
          </div>
          <div className="px-6 pb-3">
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search icons by name or category..."
                className="h-[36px] w-full rounded border border-[#d1d5db] bg-white pl-3 pr-10 text-[13px] text-[#364658] placeholder:text-[#9ca3af] focus:border-[#3D8BD0] focus:outline-none focus:ring-1 focus:ring-[#3D8BD0]"
              />
              {search ? (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#364658]"><X size={16} /></button>
              ) : (
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" size={16} />
              )}
            </div>
          </div>
        </div>

        {/* Gallery */}
        <main className="min-h-0 flex-1 overflow-y-auto bg-white px-6 pb-10">
          {/* How to use — the handoff note for the dev team */}
          {!q && (
            <div className="mb-5 rounded-lg border border-[#E5E7EB] bg-[#F8FAFC] px-4 py-3">
              <div className="text-[13px] font-semibold text-[#364658]">How to use</div>
              <p className="mt-1 text-[12px] leading-relaxed text-[#64748B]">
                All icons below come from <span className="font-mono text-[#364658]">lucide-react</span>, except the
                Product Navigation set, which are custom SVGs in <span className="font-mono text-[#364658]">SidebarIcons.tsx</span>.
                Click any tile to copy its full SVG markup at the selected size. Standard sizes in this product: <strong>14px</strong> inside chips and table cells,
                <strong> 15-16px</strong> for buttons and toolbars, <strong>20px</strong> for sidebar navigation.
              </p>
            </div>
          )}

          {/* Custom product icons */}
          {customMatches.length > 0 && (
            <section className="mb-8">
              <h2 className="mb-1 text-[13px] font-semibold uppercase tracking-wide text-[#364658]">Product Navigation <span className="font-normal normal-case text-[#9CA3AF]">— custom SVG, SidebarIcons.tsx</span></h2>
              <div className="mb-3 h-px bg-[#E5E7EB]" />
              <div className="grid gap-2.5" style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${Math.max(112, size + 68)}px, 1fr))` }}>
                {customMatches.map(({ name, use, Comp }) => (
                  <IconTile key={name} name={name} sub={use} size={size}>
                    <Comp size={size} />
                  </IconTile>
                ))}
              </div>
            </section>
          )}

          {/* Lucide icons by purpose */}
          {groupMatches.map((g) => (
            <section key={g.label} className="mb-8">
              <h2 className="mb-1 text-[13px] font-semibold uppercase tracking-wide text-[#364658]">
                {g.label} <span className="font-normal normal-case text-[#9CA3AF]">— {g.icons.length}</span>
              </h2>
              <div className="mb-3 h-px bg-[#E5E7EB]" />
              <div className="grid gap-2.5" style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${Math.max(112, size + 68)}px, 1fr))` }}>
                {g.icons.map(([name, Comp]) => (
                  <IconTile key={name} name={name} size={size}>
                    <Comp size={size} />
                  </IconTile>
                ))}
              </div>
            </section>
          ))}

          {shown === 0 && (
            <div className="py-20 text-center text-[13px] text-[#9CA3AF]">No icons match "{search}".</div>
          )}
        </main>
      </div>
    </div>
  );
}
