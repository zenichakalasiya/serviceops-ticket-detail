/**
 * icons.js — the ONE list of every icon name this product uses.
 *
 * It was the MAP inside Icon.vue. It moved out because two things now need it:
 * Icon.vue, to draw a glyph from a name, and the Icon Library page, to enumerate
 * them. A component cannot export a binding out of <script setup>, and copying the
 * list into the library would have guaranteed the two drifted apart the first time
 * anyone added an icon.
 *
 * ICON_MAP is the product vocabulary -> the lucide component that draws it. Call
 * sites name what an icon MEANS ('predefined-monitor', 'chart-hbar'), not which
 * glyph draws it, so swapping the library again touches this file alone and
 * lucide's renames between majors stop here.
 *
 * ICON_GROUPS is only for the library page — it is how the catalogue is shelved,
 * not a fact about any icon. Every name in ICON_MAP appears in exactly one group;
 * the build script that generated this asserted that, so a new icon that nobody
 * shelved lands in General rather than disappearing from the page.
 */
import {
  Plus, Search, Star, Folder, FolderOpen, Clock, RefreshCw, Share2, Link, Copy, Pencil,
  Trash2, Archive, ArchiveRestore, EllipsisVertical, Ellipsis, Maximize, Info,
  ChevronDown, ChevronRight, ChevronLeft, ChevronUp, LayoutGrid, List, Check, X, Eye,
  ListFilter, Hash, ChartColumn, ChartLine, ChartPie, Table2, House, LayoutDashboard,
  Sparkles, User, Users, Lock, Globe, Calendar, Download, Image, FileText, ExternalLink,
  Bell, Settings, ArrowLeft, Pin, Wand2, Maximize2, Minimize2, GripVertical, Inbox, TrendingUp, FileOutput,
  Moon, Sun, CalendarDays, Rows3, LayoutTemplate, TriangleAlert, Package, Network,
  Lightbulb, UserCheck, ClipboardCheck, UsersRound, Menu, Keyboard, History,
  MonitorCog, FolderMinus, FolderPlus, BadgeCheck, Undo2, Redo2, RotateCcw, ThumbsUp, ThumbsDown, ArrowUp, ArrowDown,
  PenLine, Palette, Square, Circle, MoveUpRight, Eraser, Mail, MousePointer2, ChartArea,
  Donut, Filter, Triangle, ChartBarBig, ChartBarStacked, ChartNoAxesColumn, ChartSpline, ChartNoAxesCombined,
  ChartColumnBig, Grid3x3, Gauge, AlignLeft, Map, ArrowRight, MessageSquare,
  AlignCenter, AlignRight, AlignStartHorizontal, AlignCenterHorizontal, AlignEndHorizontal,
  ChartNoAxesColumnIncreasing, Zap, Send, Paperclip, Brain, Flag, Telescope, Crosshair,
  MonitorSmartphone, Shield, Boxes, PanelLeftOpen, PanelLeftClose, Bold, Italic, Underline,
  Strikethrough, Highlighter, Heading, Quote, Code, ListOrdered, IndentIncrease,
  IndentDecrease, RemoveFormatting, StickyNote, SlidersHorizontal, ChevronsUpDown, CircleCheck,
  Type, ALargeSmall, AlignJustify, Baseline, Minus,
} from 'lucide-react'

export const ICON_MAP = {
  // the Free Text rich-text editor's toolbar
  'text-type': Type, 'text-size': ALargeSmall, 'align-justify': AlignJustify, 'text-color': Baseline, 'hr': Minus,
  plus: Plus, search: Search, star: Star, 'star-fill': Star,
  folder: Folder, 'folder-open': FolderOpen, clock: Clock, refresh: RefreshCw,
  share: Share2, link: Link, copy: Copy, edit: Pencil, trash: Trash2,
  archive: Archive, restore: ArchiveRestore, 'dots-v': EllipsisVertical, 'dots-h': Ellipsis,
  fullscreen: Maximize, info: Info, 'chevron-down': ChevronDown,
  'chevron-right': ChevronRight, 'chevron-left': ChevronLeft, 'chevron-up': ChevronUp,
  grid: LayoutGrid, list: List, check: Check, x: X, eye: Eye, filter: ListFilter,
  kpi: Hash, 'chart-bar': ChartColumn, 'chart-line': ChartLine, 'chart-pie': ChartPie,
  table: Table2, home: House, layout: LayoutDashboard, sparkles: Sparkles,
  user: User, users: Users, lock: Lock, globe: Globe, calendar: Calendar,
  download: Download, image: Image, 'file-text': FileText,
  // Export produces a FILE and sends it somewhere — image, PDF, or PDF by email. An
  // ExternalLink arrow said "this opens another page", which is a different promise.
  export: FileOutput,
  bell: Bell, settings: Settings, 'arrow-left': ArrowLeft, pin: Pin, wand: Wand2,
  'maximize-tile': Maximize2,
  /* its own glyph, not an X: leaving full screen RESTORES the tile to the board, which
     is not the same promise as closing something. The pair reads as one toggle. */
  'minimize-tile': Minimize2,
  drag: GripVertical, inbox: Inbox, trend: TrendingUp,
  moon: Moon, sun: Sun, calendar2: CalendarDays, rows: Rows3,
  template: LayoutTemplate, alert: TriangleAlert, package: Package, sitemap: Network,
  bulb: Lightbulb, 'user-check': UserCheck, clipboard: ClipboardCheck, team: UsersRound,
  menu: Menu, keyboard: Keyboard, history: History,
  /* The admin sidebar's "System Defaults" glyph — a monitor with a GEAR. Our word for that
     state is "predefined", so the name stays ours and only the glyph is borrowed. A bare
     Monitor said "a screen"; the gear says "shipped and configured by the system". */
  'predefined-monitor': MonitorCog,
  // Ungroup pairs with New group: FolderPlus creates one, FolderMinus dissolves it.
  // lucide's own 'Ungroup' glyph is two dashed squares, which at 15px reads as a
  // smudge and shares no vocabulary with the icon that made the group.
  ungroup: FolderMinus, 'default-home': House, 'new-group': FolderPlus,
  verified: BadgeCheck, undo: Undo2, redo: Redo2,
  /* 'reset' is not 'undo': undo steps back through history, reset puts a form or a set
     of settings back to where it started. Separate names so the two can never drift onto
     the same glyph by accident. */
  reset: RotateCcw,
  'thumb-up': ThumbsUp, 'thumb-down': ThumbsDown,
  'sort-asc': ArrowUp, 'sort-desc': ArrowDown,
  rearrange: LayoutGrid, pen: PenLine, palette: Palette,
  'shape-rect': Square, 'shape-ellipse': Circle, 'shape-arrow': MoveUpRight,
  erase: Eraser, mail: Mail, cursor: MousePointer2,
  'chart-area': ChartArea,
  // its OWN glyph, not ChartPie again: Pie and Donut are two adjacent choices in the
  // Coverage group now, and two identical icons made the pair unreadable
  'chart-donut': Donut,
  'chart-funnel': Filter,
  'chart-pyramid': Triangle, 'chart-hbar': ChartBarBig,
  // PMG-ACT-01 additional chart kinds
  'chart-stack': ChartBarStacked,
  // bars standing side by side, against chart-stack's piled ones — the pair has to be
  // told apart at 22px in the builder's kind row
  'chart-grouped': ChartNoAxesColumn,
  'chart-multiline': ChartSpline,
  'chart-combo': ChartNoAxesCombined, 'chart-hist': ChartColumnBig, 'chart-heatmap': Grid3x3,
  'chart-gauge': Gauge, 'chart-text': AlignLeft, 'chart-map': Map,
  /* Text alignment, for the Free Text widget's own controls. The horizontal trio is the
     text-align set; the vertical one is the BOX set (…Horizontal names an axis the items
     are laid along, so "start horizontal" is items stacked to the top). */
  'align-left': AlignLeft, 'align-center': AlignCenter, 'align-right': AlignRight,
  'align-top': AlignStartHorizontal, 'align-middle': AlignCenterHorizontal, 'align-bottom': AlignEndHorizontal,
  'open-in': ArrowRight, chat: MessageSquare, 'auto-graph': ChartNoAxesColumnIncreasing,
  bolt: Zap, send: Send, attach: Paperclip, brain: Brain, flag: Flag, research: Telescope,
  target: Crosshair, insights: ChartNoAxesCombined,
  // module-rail glyphs
  assets: MonitorSmartphone, patch: Shield, packages: Boxes,
  'panel-left': PanelLeftOpen, 'panel-close': PanelLeftClose,
  // note editor toolbar
  bold: Bold, italic: Italic, underline: Underline, strikethrough: Strikethrough,
  highlight: Highlighter, title: Heading, quote: Quote, code: Code,
  'list-bullet': List, 'list-number': ListOrdered,
  indent: IndentIncrease, outdent: IndentDecrease,
  'clear-format': RemoveFormatting, note: StickyNote,
  // Layout appearance — sliders, because this setting TUNES the board rather than
  // recolouring it; a paint palette would promise theming it does not do.
  appearance: SlidersHorizontal,
  // a compact select's affordance (the legend filter's Value field, per the Figma)
  updown: ChevronsUpDown,
  // the chosen one of a pair of outlined chips (the builder's Manual / Query Based)
  'check-circle': CircleCheck,
  // a widget's "Move to another group" — the move, not "open in" (same glyph, other meaning)
  'arrow-right': ArrowRight,
}

/** the only filled glyph in the set — a favourited star reads as filled, not outlined */
export const FILLED = new Set(['star-fill'])

/** Shelving for the Icon Library page. Order here is the order on the page. */
export const ICON_GROUPS = {
  "Navigation & layout": ['chevron-up', 'chevron-down', 'chevron-left', 'chevron-right', 'updown','arrow-left', 'open-in', 'menu', 'panel-left', 'panel-close', 'grid', 'list', 'rows', 'layout', 'template', 'sitemap', 'drag', 'rearrange', 'fullscreen', 'maximize-tile', 'minimize-tile'],
  "Actions": ['plus', 'search', 'edit', 'pen', 'copy', 'trash', 'archive', 'restore', 'download', 'export', 'share', 'link', 'refresh', 'reset', 'undo', 'redo', 'filter', 'pin', 'check', 'check-circle', 'arrow-right','x', 'send', 'attach', 'erase', 'cursor', 'wand', 'dots-v', 'dots-h', 'sort-asc', 'sort-desc', 'ungroup', 'new-group'],
  "Status & feedback": ['info', 'alert', 'verified', 'clock', 'history', 'bell', 'flag', 'thumb-up', 'thumb-down', 'star', 'star-fill', 'eye', 'lock'],
  "Widgets & charts": ['kpi', 'table', 'chart-bar', 'chart-line', 'chart-pie', 'chart-area', 'chart-donut', 'chart-funnel', 'chart-pyramid', 'chart-hbar', 'chart-stack', 'chart-grouped', 'chart-multiline', 'chart-combo', 'chart-hist', 'chart-heatmap', 'chart-gauge', 'chart-text', 'chart-map', 'trend', 'auto-graph', 'insights'],
  "AI": ['sparkles', 'brain', 'bolt', 'research', 'target', 'chat'],
  "Files & content": ['folder', 'folder-open', 'file-text', 'image', 'note', 'clipboard', 'package', 'mail', 'inbox'],
  "People & access": ['user', 'users', 'user-check', 'team', 'globe', 'home', 'default-home', 'predefined-monitor'],
  "Text editor": ['bold', 'italic', 'underline', 'strikethrough', 'highlight', 'title', 'quote', 'code', 'list-bullet', 'list-number', 'indent', 'outdent', 'clear-format', 'palette', 'align-left', 'align-center', 'align-right', 'align-top', 'align-middle', 'align-bottom'],
  "Shapes & markup": ['shape-rect', 'shape-ellipse', 'shape-arrow'],
  "Modules": ['assets', 'patch', 'packages'],
  "Settings & display": ['settings', 'appearance', 'moon', 'sun', 'keyboard', 'calendar', 'calendar2', 'bulb'],
}
