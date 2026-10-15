/**
 * WidgetBuilderModal — the centred widget builder: a live preview on the left, the
 * ServiceOps "Create Widget" configuration on the right.
 *
 * Props: d (the dashboard), type ({ id, label, type, kind }), existing (a board tile being
 * edited), libItem (a library tile being cloned / edited), duplicate (a board tile being
 * duplicated). Callbacks: onClose, onCreated(id), onSaved({ id, place }),
 * onLibrarySaved({...}), onSavedToLibrary({...}), onDuplicated({ tile, afterId }).
 *
 * Port note — the product's controls replace the prototype's (Zeni's rule): every segmented
 * track (family switch, chart category, access level, Measurement, Manage Legend, the demo
 * switch) is the product's `.pill-track`, every select is `Dropdown` (RuleSelect), every
 * switch is `ToggleSwitch`, and the CTAs are the product-blue `.btn-primary`.
 */
import { useEffect, useRef, useState } from 'react';
import { Icon, Dropdown, Hint, DashPortal } from '../ui/primitives';
import { ChartIcon } from './ChartIcon';
import { DateRangePicker } from './DateRangePicker';
import { ChartTile } from './ChartTile';
import { MeasureConditions } from './MeasureConditions';
import { FreeTextTile } from './FreeTextTile';
import { EmptyPreviewArt } from './EmptyPreviewArt';
import { RichTextEditor } from './RichTextEditor';
import { DataModeSwitch } from './DataModeSwitch';
import { ToggleSwitch } from '../../FormRuleControls';
import { previewKind, previewTitle } from '../data/previewArt.js';
import { noteTitle, noteIsEmpty, FT_DEFAULTS, FT_PRESETS, ftPresetOf } from '../data/freeText.js';
import { store } from '../store.js';
import { useDashStore, useReactive, useRefState } from '../reactivity.js';
import { chart as mkChart, kpi as mkKpi, shortcut as mkShortcut, text as mkText, ACCESS } from '../data/mock.js';
import { CONDITION_FIELD_LABELS, NUMERIC_FIELD_LABELS, AGG_FNS, MAP_FNS } from '../data/records.js';
import { NEW_KINDS } from '../data/chartOptions.js';
import { CHART_TYPES, FAMILIES as FAMILY_META, familyMembers, familyOf, frozenReason, whyDisabled, groupPickerTypes } from '../data/chartTypes.js';
import './WidgetBuilderModal.css';

// Switchable tile types — tabs above the live preview
const TYPES: any[] = [
  { id: 'line', label: 'Line', icon: 'chart-line', type: 'chart', kind: 'line' },
  { id: 'bar', label: 'Bar', icon: 'chart-bar', type: 'chart', kind: 'hbar' },
  { id: 'column', label: 'Column', icon: 'chart-bar', type: 'chart', kind: 'bar' },
  { id: 'pie', label: 'Pie', icon: 'chart-pie', type: 'chart', kind: 'pie' },
  { id: 'donut', label: 'Donut', icon: 'chart-donut', type: 'chart', kind: 'donut' },
  // PMG-ACT-01 additional chart kinds (each carries its own config + engine spec)
  { id: 'stack', label: 'Stacked', icon: 'chart-stack', type: 'chart', kind: 'stack' },
  { id: 'grouped', label: 'Grouped', icon: 'chart-grouped', type: 'chart', kind: 'grouped' },
  { id: 'multiline', label: 'Multi-line', icon: 'chart-multiline', type: 'chart', kind: 'multiline' },
  { id: 'combo', label: 'Combo', icon: 'chart-combo', type: 'chart', kind: 'combo' },
  { id: 'hist', label: 'Histogram', icon: 'chart-hist', type: 'chart', kind: 'hist' },
  { id: 'funnel', label: 'Funnel', icon: 'chart-funnel', type: 'chart', kind: 'funnel' },
  { id: 'heatmap', label: 'Heatmap', icon: 'chart-heatmap', type: 'chart', kind: 'heatmap' },
  { id: 'gauge', label: 'Gauge', icon: 'chart-gauge', type: 'chart', kind: 'gauge' },
  // Map Bubble withdrawn — see AddWidgetModal. Renderer retained for existing tiles.
  { id: 'kpi', label: 'KPI', icon: 'kpi', type: 'kpi', kind: null },
  { id: 'shortcut', label: 'Shortcut', icon: 'table', type: 'shortcut', kind: null },
  { id: 'text', label: 'Free Text', icon: 'chart-text', type: 'text', kind: null },
];

/* ---- what the row above the preview offers ------------------------------------
 * Creating, you pick a FAMILY — Widget, KPI or Shortcut. The chart kind is not a
 * family: it's a property of the Widget family, so it lives in the config panel
 * beside everything else that configures the widget.
 *
 * Editing, the row is only worth showing when something can actually be switched:
 * Bar / Column / Line, which share a data shape. A Pie, KPI, Shortcut or clone gets
 * NO row — a line of disabled tabs is a menu of things you can't have, and it only
 * invites the question "why not". The note in the config panel answers that instead.
 */
const FAMILIES = [
  { id: 'widget', label: 'Widget', icon: 'chart-bar', type: 'chart' },
  { id: 'kpi', label: 'KPI', icon: 'kpi', type: 'kpi' },
  { id: 'shortcut', label: 'Shortcut', icon: 'table', type: 'shortcut' },
  { id: 'text', label: 'Free Text', icon: 'chart-text', type: 'text' },
];
const CHART_KINDS = TYPES.filter((t) => t.type === 'chart');
// same buckets, same order as the Create Widget grid — one list, two renderers
const kindGroups: any[] = (groupPickerTypes as any)(CHART_KINDS);

// Placeholder shown in the Query field — greyed (placeholder color), per attached spec.
const SQL_PLACEHOLDER = "SELECT id, subject, priority, status\nFROM requests\nWHERE priority = 'P1' AND status = 'open'";

// dropdown option lists
const GROUP_OPTS = ['Service Desk', 'Network Team', 'NOC Viewers'];
/* Wording mirrors the dashboard panel's, changed only where "dashboard" would be wrong.
 * Same ACCESS source, so a Restricted widget and a Restricted board mean the same thing. */
const ACC_DESC: any = {
  public: 'Everyone with portal access can see this widget.',
  private: 'Only you can see and manage this widget.',
  restricted: 'Only the technicians / groups you pick below can see it.',
};
const XAXIS_OPTS = ['Priority', 'Status', 'Team', 'Created date'];
const YFUNC_OPTS = ['Count Of', 'Sum Of', 'Average Of', 'Distinct Count'];
const YCOL_OPTS = ['Requests', 'Effort hours', 'Resolution time'];
const DATEF_OPTS = ['Created date', 'Updated date', 'Resolved date', 'Due date'];
/* Date Filter picks WHICH date column to filter on; Date Range picks the WINDOW. The
 * range field is a DateRangePicker, which reads the same QUICK list the topbar and the
 * tile calendar do — a range that exists in one picker and not another is how you end up
 * with a widget nobody can reproduce. */

/* Which kinds actually HAVE a legend to manage. A histogram is one bar per bucket and a
 * gauge is a single needle — there is no set of named entries to rank, so offering them a
 * rank window would be offering a control that does nothing. */
const LEGEND_KINDS = ['line', 'bar', 'hbar', 'pie', 'donut', 'stack', 'multiline', 'combo', 'funnel'];
const ASSET_TYPES = ['Hardware', 'Software', 'Non-IT', 'Consumable'];

/** A labelled on/off row: the name + its one-liner, the product switch beside them. */
function TglRow({ title, sub, on, onChange, style }: any) {
  return (
    <label className="tgl-row" style={style}>
      <span className="tgl-txt"><b>{title}</b><em>{sub}</em></span>
      <ToggleSwitch on={!!on} onChange={onChange} />
    </label>
  );
}

export function WidgetBuilderModal({
  d, type, existing = null, libItem = null, duplicate = false,
  onClose, onCreated, onSaved, onLibrarySaved, onSavedToLibrary, onDuplicated,
}: any) {
  useDashStore();
  const ex = existing;
  // "duplicate" opens the builder pre-filled from a board tile, but saving creates a NEW copy
  // (unlike edit, which mutates the original in place).
  const editing = !!existing && !duplicate;
  const libMode = !!libItem;   // duplicate/edit a library tile → returns to listing
  const prefix = libMode ? 'Clone' : duplicate ? 'Duplicate' : editing ? 'Update' : 'Create';
  const [spinning, setSpinning] = useState(false);
  const refreshPreview = () => { setSpinning(true); setTimeout(() => setSpinning(false), 650); };

  /* Start on the tile's own tab, but keep the tile's REAL kind. The six tabs don't
   * cover every kind the ⋯ menu can produce (area, funnel, pyramid all fold into a
   * tab), and merely *opening* the builder must not silently convert an area chart
   * into a plain line. Switching type replaces the kind with the tab's canonical one. */
  const curTypeRef: any = useRefState(() => {
    const baseType = TYPES.find((t) => t.id === type.id) || type;
    return { ...baseType, kind: type.kind ?? baseType.kind };
  });
  const curType = curTypeRef.value;
  // Editing a predefined widget is restricted: Highlights only (plus the type swap below).
  const predefinedEdit = editing && ex?.prov === 'predefined';

  const isChart = curType.type === 'chart';
  const isKpi = curType.type === 'kpi';
  const isShortcut = curType.type === 'shortcut';
  const isText = curType.type === 'text';
  const ctaLabel = isChart ? 'Widget' : curType.label;

  // ServiceOps "Create Widget" fields. Prefilled from the existing tile when editing.
  const initCfg = () => ({
    name: duplicate ? `Copy of ${ex.title}` : ex?.title || libItem?.title || `New ${curTypeRef.value.label}`,
    module: 'Request',
    // read back off the tile, so re-opening a restricted widget shows who it reaches
    techAccess: ex?.techAccess || [store.currentUser], groupAccess: ex?.groupAccess || '',
    mode: ex?.sql ? 'query' : 'manual',   // Manual | Query Based
    xAxis: 'Priority', yFunc: 'Count Of', yColumn: 'Requests',
    assetType: '', dateFilter: 'Created date', description: ex?.info || '',
    // an existing tile already carrying its own `dateFilter` range IS a sticky widget —
    // read the switch back off the tile so editing one doesn't silently un-stick it
    // empty by default so the field shows its prompt — the range is required (*) and
    // there is no sensible range to guess on the user's behalf
    stickyDate: !!ex?.dateFilter, dateRange: ex?.dateFilter || '',
    // Output shaping is a rank WINDOW, not a sort direction: "Top 10" / "Bottom 10".
    /* A tile with no rankN plots everything, which IS "All" — read it back that way so
     * reopening an unbounded chart does not silently show "Top 10" selected. */
    rank: ex ? (ex.rank || (ex.rankN ? 'top' : 'all')) : 'top', rankN: ex?.rankN ?? 10,
    excludeZero: false, sqlQuery: ex?.sql || '',
    access: ex?.access || 'public',   // Public / Private / Restricted — as a dashboard has
    // display properties, saved on the widget. undefined = on / off respectively.
    // ON by default — a chart with no key is unreadable until you already know it
    legend: ex?.legend !== false,
    dataLabels: ex?.dataLabels === true,
    // ── PMG-ACT-01 additional-kind config (prefilled from the tile's saved spec) ──
    // a spec-driven kind keeps its conditions in the spec; a classic chart or KPI on the tile
    conds: (ex?.chart?.spec?.conds || ex?.chart?.spec?.measure?.conds || ex?.conds || []).map((c: any) => ({ ...c })),
    stackXDim: ex?.chart?.spec?.xDim || 'Priority',
    stackSplit: ex?.chart?.spec?.splitDim || 'Status',
    mlXDim: ex?.chart?.spec?.xDim || 'Priority',
    mlSplit: ex?.chart?.spec?.splitDim || 'Status',
    comboXDim: ex?.chart?.spec?.xDim || 'Priority',
    comboFn: ex?.chart?.spec?.comboFn || 'Average',
    comboField: ex?.chart?.spec?.comboField || 'Resolution time',
    histField: ex?.chart?.spec?.histField || 'Resolution time',
    histBucket: ex?.chart?.spec?.histBucket || 4,
    stageField: ex?.chart?.spec?.stageField || 'Status',
    // map bubble (§4.6) — geographic dimension is fixed to Site
    mapFn: ex?.chart?.spec?.mapFn || 'Count',
    mapField: ex?.chart?.spec?.mapField || 'Resolution time',
    // heatmap (§4.5)
    heatX: ex?.chart?.spec?.heatX || 'Priority',
    heatY: ex?.chart?.spec?.heatY || 'Team',
    heatFn: ex?.chart?.spec?.heatFn || 'Count',
    heatField: ex?.chart?.spec?.heatField || 'Resolution time',
    // gauge (§4.8) — its own base + numerator condition sets
    gaugeMode: ex?.chart?.spec?.measure?.mode || 'count',
    gaugeFn: ex?.chart?.spec?.measure?.fn || 'Average',
    gaugeField: ex?.chart?.spec?.measure?.field || 'CSAT score',
    gaugeNumConds: ex?.chart?.spec?.measure?.numConds ? ex.chart.spec.measure.numConds.map((c: any) => ({ ...c })) : [],
    gaugeMax: ex?.chart?.spec?.gaugeMax || '',
    gaugeHigherBetter: ex?.chart?.spec?.invert === true,
    gaugeWarnAt: ex?.chart?.spec?.warnAt ?? 70,
    gaugeBadAt: ex?.chart?.spec?.badAt ?? 90,
    // Free Text (§4) — the tile's markdown-lite content
    content: ex?.content || '',
    /* A Free Text widget's own presentation. Spread over the defaults rather than read
       straight off the tile: a note saved before these options existed carries none of
       them, and a half-filled config would render with `undefined` where a size or an
       alignment should be. */
    ft: { ...FT_DEFAULTS, ...(ex?.ft || {}) },
    // the width a preset asks for; only applied when one is actually picked
    ftSpan: ex?.w || null,
  });
  const cfg: any = useReactive(initCfg);
  const reset = () => { Object.assign(cfg, initCfg()); };

  /* ---- Which types can this widget become? --------------------------------------
   * Editing offers this widget's FAMILY — the types that read the same configuration
   * (data/chartTypes.js). Membership is by data shape, not by provenance, which is why
   * a predefined Pie can now become a Doughnut: nothing but the inner radius changes.
   * Within a family a member can still be unavailable if THIS widget lacks what it
   * needs (Stacked with no split field) — that comes back as a reason, not a gap.
   * Creating a new widget is unconstrained — you're choosing what to build. */
  const familyKinds = new Set((familyMembers as any)(curType.kind).map((m: any) => m.id));
  const familyIds = TYPES.filter((t) => familyKinds.has(t.kind)).map((t) => t.id);
  const frozenType = editing && familyIds.length < 2;

  /* The Chart Type field shows ONE category at a time (2026-09-29, user's pick — it was all
     four stacked, ~330px of sidebar). A segmented track names the four categories; it opens
     on the family of the chart being built, and only that family's tiles sit under it. A
     category tab only BROWSES — the type changes when a tile is clicked. Picking a type from
     anywhere snaps the view to that type's own category. */
  const [kindCatPick, setKindCatPick] = useState<string | null>(null);
  const curKindCat = kindGroups.find((g) => g.types.some((t: any) => t.id === curType.id))?.cat || kindGroups[0].cat;
  const kindCat = kindCatPick || curKindCat;
  const kindCatTypes = kindGroups.find((g) => g.cat === kindCat)?.types || [];
  useEffect(() => { setKindCatPick(null); }, [curType.id]);
  // remembers which chart you were on, so leaving the Widget family and coming back
  // returns you to it rather than resetting to a default
  const lastChartId = useRef(type.type === 'chart' ? type.id : 'column');
  const editTabs = (libMode || duplicate || !editing) ? [] : familyIds.length > 1 ? TYPES.filter((t) => familyIds.includes(t.id)) : [];
  const showFamilies = !editing && !libMode && !duplicate;
  const familyOn = (f: any) => (f.type === 'chart' ? isChart : curType.type === f.type);

  const isPie = curType.kind === 'pie' || curType.kind === 'donut';
  // additional PMG-ACT-01 kinds render from a chartSpec through the records.js engine
  const isNewKind = (NEW_KINDS as Set<string>).has(curType.kind);
  const chartSpec = (() => {
    const k = curType.kind;
    // Stacked and Grouped share every field; the KIND is what decides how it draws, so
    // the spec carries no stackMode of its own to contradict it.
    if (k === 'stack' || k === 'grouped') return { kind: k, xDim: cfg.stackXDim, splitDim: cfg.stackSplit, conds: cfg.conds };
    if (k === 'multiline') return { kind: 'multiline', xDim: cfg.mlXDim, splitDim: cfg.mlSplit, conds: cfg.conds };
    if (k === 'combo') return { kind: 'combo', xDim: cfg.comboXDim, comboFn: cfg.comboFn, comboField: cfg.comboField, conds: cfg.conds };
    if (k === 'hist') return { kind: 'hist', histField: cfg.histField, histBucket: cfg.histBucket, conds: cfg.conds };
    if (k === 'funnel') return { kind: 'funnel', stageField: cfg.stageField, conds: cfg.conds };
    if (k === 'mapbubble') return { kind: 'mapbubble', mapFn: cfg.mapFn, mapField: cfg.mapField, conds: cfg.conds };
    if (k === 'heatmap') return { kind: 'heatmap', heatX: cfg.heatX, heatY: cfg.heatY, heatFn: cfg.heatFn, heatField: cfg.heatField, conds: cfg.conds };
    if (k === 'gauge') return {
      kind: 'gauge',
      measure: { mode: cfg.gaugeMode, fn: cfg.gaugeFn, field: cfg.gaugeField, conds: cfg.conds, numConds: cfg.gaugeNumConds },
      warnAt: cfg.gaugeWarnAt, badAt: cfg.gaugeBadAt, invert: cfg.gaugeHigherBetter, gaugeMax: cfg.gaugeMax,
    };
    return null;
  })();
  // heatmap and gauge carry no legend / Top-N — their Display section is suppressed
  const noDisplay = ['heatmap', 'gauge', 'mapbubble'].includes(curType.kind);
  const hasLegend = LEGEND_KINDS.includes(curType.kind);
  // keep it a number and never let it reach 0 — a chart of nothing is not a view
  const setRankN = (v: any) => { const n = parseInt(String(v).replace(/\D/g, ''), 10); cfg.rankN = Number.isFinite(n) && n > 0 ? n : ''; };

  /* What the rank window actually does to the chart, stated for the setting currently in
     force. On the info icon it is there for whoever wants it and invisible to everyone else. */
  const legendHint = (() => {
    if (cfg.rank === 'all') return 'Every entry in the legend is drawn on the chart.';
    const n = Number(cfg.rankN) || '—';
    const which = cfg.rank === 'bottom' ? 'lowest' : 'highest';
    return `Out of every entry in the legend, only the ${n} with the ${which} values are drawn. The rest are left off the chart.`;
  })();

  // Manual vs Query-Based: the SQL Query field (with Tap Preview) shows for Shortcuts
  // and for any Widget/KPI once the user switches to the Query Based tab.
  const queryMode = isShortcut || (!isShortcut && cfg.mode === 'query');
  const manualMode = !isShortcut && cfg.mode === 'manual';

  /* Free Text layout — Default (body text) or Header (a centred banner across the row). It is
   * chosen INSIDE the rich-text editor (2026-09-30, user's call) and writes the same fields
   * the old Preset row did: the presentation config plus the tile's width. */
  const noteLayout = (ftPresetOf as any)(cfg.ft);
  const setNoteLayout = (id: string) => {
    const p = (FT_PRESETS as any[]).find((x) => x.id === id); if (!p) return;
    Object.assign(cfg.ft, p.cfg);
    cfg.ftSpan = p.span;
  };

  /* A note has no Name field, so its title is derived from its own first line — the way
   * every notes app files an untitled note. Everything downstream (the library, the
   * listings, the duplicate check) still gets a real title; the person writing just never
   * has to invent one before they can start writing. */
  const derivedNoteTitle = (noteTitle as any)(cfg.content);
  /* The title this widget will actually be saved under. Read this, never `cfg.name`
   * directly — for a note `cfg.name` is empty and always will be. */
  const effectiveName = isText ? derivedNoteTitle : (cfg.name || '').trim();

  /* The header names the ACTION and the THING it acts on — "Create Bar", "Edit Shortcut".
     curType is reactive, so switching the family or the chart kind retitles the panel — the
     title tracks the choice rather than describing how you arrived. */
  const headTitle = `${duplicate ? 'Duplicate' : (editing || libMode) ? 'Edit' : 'Create'} ${curType.label}`;

  /* Widget names must be unique across every dashboard. This fires on UPDATE as well as
   * create. The tile being edited is excluded by id (otherwise a widget would collide with
   * itself), and the current board is checked too: two widgets with the same name on the
   * SAME dashboard is the worst case, not an exemption. */
  const dupBoards = (() => {
    const n = effectiveName.toLowerCase();
    if (!n) return [];
    const selfId = duplicate ? null : existing?.id;
    const names = new Set<string>();
    store.dashboards.forEach((dash: any) => {
      if (dash.archived) return;
      const hit = (dash.tiles || []).some((t: any) => t.id !== selfId && (t.title || '').toLowerCase() === n);
      if (hit) names.add(dash.id === d?.id ? `${dash.name} (this dashboard)` : dash.name);
    });
    return [...names];
  })();
  // a duplicate name BLOCKS the save — "must be unique" is a rule, not a suggestion
  const nameTaken = dupBoards.length > 0;
  // what a note needs before it can be saved is WRITING, not a name
  const noteEmpty = isText && (noteIsEmpty as any)(cfg.content);
  const canSave = !!effectiveName && !nameTaken && !noteEmpty;
  const ctaHint =
    noteEmpty ? 'Write something in the note first'
      : !effectiveName ? (isText ? 'Write something in the note first' : 'Give this widget a name')
        : nameTaken
          ? (isText
            ? 'Another widget is already filed under this note’s first line — change the opening line'
            : 'That name is already taken — widget names must be unique')
          : '';

  const previewTile: any = (() => {
    const title = effectiveName || `New ${curType.label}`;
    if (isText) {
      const t: any = mkText(title, cfg.content, cfg.description);
      t.ft = { ...cfg.ft };
      // a Header preset is a BANNER, so it also claims the row — see FT_PRESETS.span
      if (cfg.ftSpan) t.w = cfg.ftSpan;
      return t;
    }
    if (isKpi) {
      return ex
        ? mkKpi(title, ex.value, ex.unit, ex.delta, ex.status, cfg.description)
        : mkKpi(title, 128, '', { dir: 'up', pct: 5.2 }, 'good', cfg.description);
    }
    if (isChart) {
      // additional kinds carry a chartSpec; ChartTile computes the display from it
      if (isNewKind) {
        const t: any = mkChart(title, { kind: curType.kind, spec: chartSpec }, cfg.description);
        t.legend = cfg.legend;
        return t;
      }
      let labels: any[], series: any[];
      if (ex?.chart) {
        labels = ex.chart.labels;
        series = ex.chart.series.map((s: any) => ({ ...s, values: [...s.values] }));
      } else {
        const donut = isPie;
        labels = donut ? ['P1', 'P2', 'P3', 'P4'] : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
        series = [{ name: cfg.yFunc, values: donut ? [18, 64, 120, 46] : [42, 51, 38, 60, 55] }];
      }
      /* Apply the rank window. Single-series charts rank their *categories* (a pie
       * ranks slices), so labels and values must be reordered together — sorting the
       * values alone silently detached each bar from its label. Multi-series charts are
       * left alone: there is no single ranking. */
      // 'all' plots every category regardless of what the (disabled) N box still holds
      const n = cfg.rank === 'all' ? 0 : Number(cfg.rankN) || 0;
      if (series.length === 1 && n > 0 && n < labels.length) {
        const pairs = labels.map((l, i) => ({ l, v: series[0].values[i] }));
        pairs.sort((a, b) => (cfg.rank === 'bottom' ? a.v - b.v : b.v - a.v));
        const win = pairs.slice(0, n);
        labels = win.map((p) => p.l);
        series = [{ ...series[0], values: win.map((p) => p.v) }];
      }
      const t: any = mkChart(title, { kind: curType.kind, labels, series }, cfg.description);
      t.legend = cfg.legend;          // so the live preview reflects the toggle
      t.dataLabels = cfg.dataLabels;
      t.rank = cfg.rank; t.rankN = cfg.rank === 'all' ? undefined : cfg.rankN;
      if (isPie) t.chart.donut = curType.kind === 'donut';   // the type IS the ring
      return t;
    }
    return ex
      ? mkShortcut(title, ex.columns, ex.rows.map((r: any) => [...r]), cfg.description)
      : mkShortcut(title, ['ID', 'Subject', 'Priority', 'Status'],
        [['INC-2041', 'VPN down for finance team', 'P1', 'In Progress'], ['INC-2038', 'Email delivery delayed', 'P1', 'Open']], cfg.description);
  })();

  function typeBlock(t: any) {
    if (t.id === curType.id) return null;                    // the current type is never blocked
    if (libMode || duplicate) return 'The type is fixed when cloning or duplicating';
    if (!editing) return null;                               // creating: pick anything
    if (frozenType) return (frozenReason as any)({ type: 'chart', chart: { kind: curType.kind } });
    if (!familyIds.includes(t.id)) {
      const fam = (FAMILY_META as any)[(familyOf as any)(curType.kind)];
      return `${t.label} reads a different configuration — this widget can only become another type that ${fam ? fam.why : 'reads the same one'}`;
    }
    // in-family, but does this widget have what the target needs?
    const target = (CHART_TYPES as any[]).find((m) => m.id === t.kind);
    return target ? (whyDisabled as any)(target, previewTile?.chart) : null;
  }
  function switchType(t: any) {
    if (typeBlock(t)) return;
    // a note is filed under its own first line, so it never carries a placeholder name —
    // and switching INTO one must not leave "New Free Text" behind as its title
    if (t.type === 'text') cfg.name = '';
    else if (!cfg.name || cfg.name === `New ${curTypeRef.value.label}`) cfg.name = `New ${t.label}`;
    curTypeRef.value = t;
  }
  const pickFamily = (f: any) => switchType(TYPES.find((t) => t.id === (f.type === 'chart' ? lastChartId.current : f.id)));
  const pickKind = (t: any) => { lastChartId.current = t.id; switchType(t); };

  /* The live preview's EMPTY STATE (2026-09-29, user's call). While BUILDING a new widget,
     the preview waits for a condition: until the first one is added in the panel on the
     right, it shows EmptyPreviewArt and says what to do, instead of drawing sample data the
     person never asked for. Editing, duplicating or cloning an existing widget always
     previews its real chart. Manual charts and KPIs only. */
  const building = !existing && !libItem;
  const needsCond = building && manualMode && !isText
    && (isChart || isKpi) && !cfg.conds.length && !(cfg.gaugeNumConds || []).length;
  // the art, title and line follow the chart type being built (data/previewArt.js)
  const emptyKind = isKpi ? 'kpi' : curType.id;

  /* The sticky switch and `tile.dateFilter` are the same fact: a tile carrying a range is
   * one that ignores the dashboard filter. Switching sticky off clears it, so the tile falls
   * back to the board's filter and its calendar disappears. */
  const applySticky = (t: any) => { t.dateFilter = cfg.stickyDate ? cfg.dateRange : null; };
  // a classic chart or KPI keeps its conditions on the tile (a spec-driven kind has them in its spec)
  const applyConds = (t: any) => {
    const keep = manualMode && !isNewKind && (isChart || isKpi) && cfg.conds.length;
    t.conds = keep ? cfg.conds.map((c: any) => ({ ...c })) : undefined;
  };
  /* Access is THREE fields, not one. "Restricted" only means something alongside the
   * technicians and groups it is restricted TO. Cleared when the level isn't restricted, so
   * a widget switched back to Public doesn't carry a stale audience underneath. */
  const applyAccess = (t: any) => {
    const restricted = cfg.access === 'restricted';
    t.access = cfg.access;
    t.techAccess = restricted ? [...(cfg.techAccess || [])] : undefined;
    t.groupAccess = restricted ? cfg.groupAccess : undefined;
  };

  // place = true  → "{prefix} & Add Widget" (put it on the canvas, redirect)
  // place = false → "{prefix} Widget"        (save the definition, don't place)
  function save(place: boolean) {
    const pv = previewTile;
    // --- duplicate a board tile: build a NEW copy from the (re)configured data ---
    if (duplicate) {
      pv.w = ex.w; pv.h = ex.h;
      if (ex.group != null) pv.group = ex.group;
      if (queryMode) pv.sql = cfg.sqlQuery;
      applyAccess(pv); applySticky(pv); applyConds(pv);
      onDuplicated?.({ tile: pv, afterId: ex.id });
      return;
    }
    // --- library duplicate/edit: hand the config back to the listing ---
    if (libItem) {
      onLibrarySaved?.({ title: effectiveName, module: cfg.module, type: curType.type, access: cfg.access, desc: cfg.description, kind: curType.id, place });
      return;
    }
    // --- edit an existing board tile in place (type may change for a predefined edit) ---
    if (existing) {
      const t = existing;
      t.title = effectiveName || t.title;
      t.info = cfg.description;
      t.type = curType.type;
      if (isChart) {
        t.chart = pv.chart;
        t.legend = cfg.legend; t.dataLabels = cfg.dataLabels; t.rank = cfg.rank; t.rankN = cfg.rank === 'all' ? undefined : cfg.rankN;
        t.columns = undefined; t.rows = undefined; t.value = undefined;
      }
      else if (isShortcut) { t.columns = pv.columns; t.rows = pv.rows; t.sql = cfg.sqlQuery; t.chart = undefined; }
      else if (isKpi) { t.value = pv.value; t.unit = pv.unit; t.chart = undefined; t.columns = undefined; t.rows = undefined; }
      else if (isText) {
        t.content = cfg.content;
        t.ft = { ...cfg.ft };
        if (cfg.ftSpan) t.w = cfg.ftSpan;
        t.chart = undefined; t.columns = undefined; t.rows = undefined; t.value = undefined;
      }
      if (!isShortcut && !isText) t.sql = cfg.mode === 'query' ? cfg.sqlQuery : undefined;
      applyAccess(t); applySticky(t); applyConds(t);
      d.updated = new Date().toISOString();
      onSaved?.({ id: t.id, place });
      return;
    }
    // --- create new ---
    if (place) {
      // a Header note is a banner across the row (its layout's span); a Default note is 4 wide
      if (isText) { pv.w = cfg.ftSpan || 4; pv.h = 1; }
      else { pv.w = isChart ? 6 : isShortcut ? 6 : 3; pv.h = isKpi ? 1 : 2; }
      if (queryMode) pv.sql = cfg.sqlQuery;
      applyAccess(pv); applySticky(pv); applyConds(pv);
      d.tiles.push(pv);
      d.updated = new Date().toISOString();
      onCreated?.(pv.id);
    } else {
      onSavedToLibrary?.({ title: effectiveName, module: cfg.module, type: curType.type, access: cfg.access, desc: cfg.description, kind: curType.id });
    }
  }

  /* Data source is the product's pill-track — the same control as Public / Private / Restricted
     (Zeni, 15 Oct 2026). The prototype's "Demo · switch UI" bar (A · Cards / D · Banner / Pill) is
     gone; the cards and banner variants stay built in DataModeSwitch, unused. */
  const modeVariant = 'pill';
  const dataSource = (headCls: string) => (
    <>
      <div className={headCls}>Data source</div>
      <DataModeSwitch modelValue={cfg.mode} onUpdateModelValue={(v: string) => { cfg.mode = v; }} variant={modeVariant} subject={isKpi ? 'KPI' : 'chart'} />
    </>
  );
  const dd = (key: string, options: any, extra: any = {}) => (
    <Dropdown modelValue={cfg[key]} options={options} onUpdateModelValue={(v) => { cfg[key] = v; }} {...extra} />
  );
  const mc = (key: string) => <MeasureConditions modelValue={cfg[key]} onUpdateModelValue={(v: any) => { cfg[key] = v; }} emptyText="" />;

  return (
    <DashPortal>
      <div className="dc-WidgetBuilderModal overlay" onClick={(e) => e.target === e.currentTarget && onClose?.()}>
        <div className="builder">
          {/* Header (ClickUp-style) */}
          <header className="bhead">
            <h3 className="btitle">{headTitle}</h3>
            {/* Reset, not Refresh. Refresh acts on the PREVIEW, so it lives beside the preview;
                what belongs up here next to Close is the action that operates on the whole form. */}
            <div className="hacts">
              <button className="ic" data-itip="Reset every field to how this widget opened" aria-label="Reset every field to how this widget opened" onClick={reset}><Icon name="reset" size={16} /></button>
              <button className="ic" onClick={() => onClose?.()} title="Close"><Icon name="x" size={18} /></button>
            </div>
          </header>

          <div className="bbody">
            {/* LEFT: live preview (ServiceOps) */}
            <section className="preview">
              {/* creating: pick a family. editing: only the swaps that are actually possible.
                  Neither renders a disabled tab. */}
              {showFamilies && (
                <div className="pv-top">
                  <div className="pill-track">
                    {FAMILIES.map((f) => (
                      <button key={f.id} aria-pressed={familyOn(f)} title={`Build a ${f.label}`} onClick={() => pickFamily(f)}>
                        <Icon name={f.icon} size={14} /> {f.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="pv-card">
                <button className="pv-refresh" data-itip="Refresh the live preview" aria-label="Refresh the live preview" onClick={refreshPreview}>
                  <Icon name="refresh" size={16} className={spinning ? 'spin' : ''} />
                </button>
                <div className="pv-canvas">
                  {/* no condition yet: say what to do, instead of drawing sample data */}
                  {needsCond ? (
                    <div className="pv-empty">
                      <EmptyPreviewArt className="pv-empty-art" kind={emptyKind} width={176} />
                      <b className="pv-empty-t">{(previewTitle as any)(emptyKind)}</b>
                      <p className="pv-empty-s">{(previewKind as any)(emptyKind).desc}</p>
                    </div>
                  ) : isKpi ? (
                    <div className="pv-kpi">{previewTile.value}{previewTile.unit && <span className="u">{previewTile.unit}</span>}</div>
                  ) : isChart ? (
                    <ChartTile chart={previewTile.chart} legend={cfg.legend} dataLabels={cfg.dataLabels} height={320} />
                  ) : isText ? (
                    <div className="pv-text"><FreeTextTile content={cfg.content} ft={cfg.ft} /></div>
                  ) : (
                    <table className="pv-tbl">
                      <thead><tr>{previewTile.columns.map((c: any) => <th key={c}>{c}</th>)}</tr></thead>
                      <tbody>{previewTile.rows.map((r: any[], i: number) => <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody>
                    </table>
                  )}
                </div>
              </div>
            </section>

            {/* RIGHT: scrollable config (ServiceOps fields) */}
            <aside className="config">
              <div className="cfg-scroll">
                {/* predefined widget: an info line, then ONLY what can change */}
                {predefinedEdit && (
                  <div className="pe-note">
                    <Icon name="info" size={14} />
                    {frozenType
                      ? <span>This is a <b>predefined {curType.label}</b> — it can’t be changed here.</span>
                      : <span>This is a <b>predefined {curType.label}</b> — only its <b>Chart Type</b> can be switched.</span>}
                  </div>
                )}
                {/* Editing a switchable chart: the type switch lives here as tiles in the config
                    panel, never as tabs above the preview. */}
                {editTabs.length > 0 && (
                  <div className="sec">
                    <div className="sec-h">Chart Type</div>
                    <p className="hint">Pick how the data should be visualized.</p>
                    <div className="kinds">
                      {editTabs.map((t) => (
                        <button key={t.id} className={`kind ${curType.id === t.id ? 'on' : ''}`} title={`Show as ${t.label}`} aria-label={t.label} onClick={() => pickKind(t)}>
                          <ChartIcon name={t.id} size={40} />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {/* Everything from here DESCRIBES the widget rather than the way it is drawn. */}
                {!predefinedEdit && (
                  <fieldset className="ro-fs">
                    {/* Basic Details — every family but a note (filed under its own first line). */}
                    {!isText && (
                      <div className="sec">
                        <div className="sec-h">{isShortcut ? 'Basic Shortcut Details' : 'Basic Widget Details'}</div>
                        <div className="grid2">
                          <div className="fld"><label>Name <i>*</i></label><input className={`input ${nameTaken ? 'bad' : ''}`} value={cfg.name} onChange={(e) => { cfg.name = e.target.value; }} placeholder="Name" /></div>
                          <div className="fld"><label>Module <i>*</i></label>{dd('module', store.modules)}</div>
                        </div>
                        {dupBoards.length > 0 && (
                          <p className="dup-warn"><Icon name="alert" size={13} /> <span>A widget named “{effectiveName}” already exists on {dupBoards.slice(0, 2).join(', ')}{dupBoards.length > 2 && <span> +{dupBoards.length - 2} more</span>}. <b>Widget names must be unique</b> — pick another.</span></p>
                        )}
                        {isShortcut && <div className="fld" style={{ marginTop: 12 }}><label>Description</label><textarea className="input" rows={2} value={cfg.description} onChange={(e) => { cfg.description = e.target.value; }} placeholder="Description" /></div>}
                        {cfg.module === 'Asset' && manualMode && (
                          <div className="fld"><label>Asset type</label>
                            <div className="pill-track asset-seg">
                              {ASSET_TYPES.map((a) => <button key={a} aria-pressed={cfg.assetType === a} onClick={() => { cfg.assetType = a; }}>{a}</button>)}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Visibility & Sharing — the same three-way choice a dashboard has, from the
                        same ACCESS source. The technician / group pickers belong to Restricted. */}
                    <div className="sec">
                      <div className="sec-h">Visibility &amp; sharing</div>
                      <label className="acc-lbl">Widget Access Level <i>*</i></label>
                      <div className="pill-track acc-seg">
                        {Object.entries(ACCESS as any).map(([k, a]: any) => (
                          <button key={k} aria-pressed={cfg.access === k} onClick={() => { cfg.access = k; }}>{a.label}</button>
                        ))}
                      </div>
                      <p className="acc-note"><Icon name="info" size={14} /> {ACC_DESC[cfg.access]}</p>
                      {cfg.access === 'restricted' && (
                        <div className="grid2" style={{ marginTop: 12 }}>
                          <div className="fld"><label>Technician Access Level <i>*</i></label>{dd('techAccess', store.owners, { multiple: true, placeholder: 'Select technicians' })}</div>
                          <div className="fld"><label>Technician Group Access Level <i>*</i></label>{dd('groupAccess', GROUP_OPTS, { placeholder: 'Select' })}</div>
                        </div>
                      )}
                    </div>

                    {/* Chart Type is its own section AFTER visibility. Icon-only squares; the label
                        lives in the tooltip. One category at a time: the track browses, a tile picks. */}
                    {showFamilies && isChart ? (
                      <div className="sec sec-mode">
                        <div className="sec-h">Chart Type</div>
                        <p className="hint">Pick how the data should be visualized.</p>
                        <div className="pill-track kind-cats" role="tablist" aria-label="Chart category">
                          {kindGroups.map((g) => (
                            <button key={g.cat} role="tab" aria-pressed={kindCat === g.cat} aria-selected={kindCat === g.cat} onClick={() => setKindCatPick(g.cat)}>{g.cat}</button>
                          ))}
                        </div>
                        <div className="kinds">
                          {kindCatTypes.map((k: any) => (
                            <button key={k.id} className={`kind ${curType.id === k.id ? 'on' : ''}`} title={k.label} aria-label={k.label} onClick={() => pickKind(k)}>
                              <ChartIcon name={k.id} size={40} />
                            </button>
                          ))}
                        </div>
                        {!isShortcut && !isText && dataSource('sec-h dm-head dm-title')}
                      </div>
                    ) : (!isShortcut && !isText) ? (
                      /* families without a chart type still need the Manual / Query switch */
                      <div className="sec">{dataSource('sec-h dm-title')}</div>
                    ) : null}

                    {/* Query — Shortcuts always; Widget/KPI when "Query Based" is active */}
                    {queryMode && (
                      <div className="sec">
                        <div className="q-head">
                          <div className="sec-h" style={{ margin: 0 }}>Query <i className="req">*</i></div>
                          <button className="btn btn-sm btn-primary" onClick={refreshPreview}>Run Preview</button>
                        </div>
                        <p className="hint">{isShortcut ? 'Write a query to return the records this Shortcut lists.' : 'Write a query to return the data this widget plots.'}</p>
                        <textarea className="input sql" rows={6} value={cfg.sqlQuery} onChange={(e) => { cfg.sqlQuery = e.target.value; }} placeholder={SQL_PLACEHOLDER} spellCheck={false} />
                      </div>
                    )}

                    {/* Axes (classic charts, Manual mode only) */}
                    {isChart && manualMode && !isNewKind && (
                      <div className="sec">
                        <div className="sec-h">Axes</div>
                        <div className="fld"><label>X-Axis <i>*</i></label>{dd('xAxis', XAXIS_OPTS)}</div>
                        <div className="grid2">
                          <div className="fld"><label>Y-Axis Function <i>*</i></label>{dd('yFunc', YFUNC_OPTS)}</div>
                          <div className="fld"><label>Y-Axis Column <i>*</i></label>{dd('yColumn', YCOL_OPTS)}</div>
                        </div>
                      </div>
                    )}

                    {/* Series / Buckets / Stages / Matrix — the additional PMG-ACT-01 kinds (§4). */}
                    {isChart && manualMode && isNewKind && curType.kind !== 'gauge' && (
                      <div className="sec">
                        <div className="sec-h">{curType.kind === 'hist' ? 'Buckets' : curType.kind === 'funnel' ? 'Stages' : curType.kind === 'heatmap' ? 'Matrix' : curType.kind === 'mapbubble' ? 'Bubbles' : 'Series'}</div>
                        {/* Stacked / Grouped (§4.1) — one form, two types. */}
                        {(curType.kind === 'stack' || curType.kind === 'grouped') ? (
                          <div className="grid2">
                            <div className="fld"><label>X-Axis <i>*</i></label>{dd('stackXDim', CONDITION_FIELD_LABELS)}</div>
                            <div className="fld"><label>Split by <i>*</i></label>{dd('stackSplit', CONDITION_FIELD_LABELS)}</div>
                          </div>
                        ) : curType.kind === 'multiline' ? (
                          /* Multi-line (§4.2) */
                          <div className="grid2">
                            <div className="fld"><label>X-Axis <i>*</i></label>{dd('mlXDim', CONDITION_FIELD_LABELS)}</div>
                            <div className="fld"><label>Split by <i>*</i></label>{dd('mlSplit', CONDITION_FIELD_LABELS)}</div>
                          </div>
                        ) : curType.kind === 'combo' ? (
                          /* Combo (§4.3) — count bars + an aggregate line on a second axis */
                          <>
                            <div className="fld"><label>X-Axis <i>*</i></label>{dd('comboXDim', CONDITION_FIELD_LABELS)}</div>
                            <div className="grid2">
                              <div className="fld"><label>Line Function <i>*</i></label>{dd('comboFn', AGG_FNS)}</div>
                              <div className="fld"><label>Line Field <i>*</i></label>{dd('comboField', NUMERIC_FIELD_LABELS)}</div>
                            </div>
                          </>
                        ) : curType.kind === 'hist' ? (
                          /* Histogram (§4.4) — gap-free equal-width bands over a numeric field */
                          <div className="grid2">
                            <div className="fld"><label>Field <i>*</i></label>{dd('histField', NUMERIC_FIELD_LABELS)}</div>
                            <div className="fld"><label>Bucket size <i>*</i></label><input className="input" type="number" min={0.5} step={0.5} value={cfg.histBucket} onChange={(e) => { cfg.histBucket = e.target.value === '' ? '' : Number(e.target.value); }} /></div>
                          </div>
                        ) : curType.kind === 'funnel' ? (
                          /* Funnel (§4.7) — cumulative stage counts in the field's defined order */
                          <div className="fld"><label>Stage field <i>*</i><Hint text="Stages keep the field’s defined order — never alphabetical. Each band counts records that reached that stage or beyond, shown as a share of the first." /></label>{dd('stageField', CONDITION_FIELD_LABELS)}</div>
                        ) : curType.kind === 'heatmap' ? (
                          /* Heatmap (§4.5) — Columns × Rows grid, cell = count or an aggregate */
                          <>
                            <div className="grid2">
                              <div className="fld"><label>Columns <i>*</i></label>{dd('heatX', CONDITION_FIELD_LABELS)}</div>
                              <div className="fld"><label>Rows <i>*</i></label>{dd('heatY', CONDITION_FIELD_LABELS)}</div>
                            </div>
                            <div className="grid2">
                              <div className="fld"><label>Cell value <i>*</i></label>{dd('heatFn', MAP_FNS)}</div>
                              {cfg.heatFn !== 'Count' && <div className="fld"><label>Field <i>*</i></label>{dd('heatField', NUMERIC_FIELD_LABELS)}</div>}
                            </div>
                            <p className="hint">{cfg.heatFn === 'Count'
                              ? 'Record count per cell, colour-scaled across the grid.'
                              : `${cfg.heatFn} of ${cfg.heatField} per cell, colour-scaled across the grid. A cell with no matching value reads as 0.`}</p>
                          </>
                        ) : curType.kind === 'mapbubble' ? (
                          /* Map Bubble (§4.6) — one bubble per Site, sized by the value */
                          <>
                            <div className="grid2">
                              <div className="fld"><label>Bubble value <i>*</i></label>{dd('mapFn', MAP_FNS)}</div>
                              {cfg.mapFn !== 'Count' && <div className="fld"><label>Field <i>*</i></label>{dd('mapField', NUMERIC_FIELD_LABELS)}</div>}
                            </div>
                            <p className="hint">One bubble per Site (the geographic dimension is fixed to Site), positioned by its coordinates and sized by {cfg.mapFn === 'Count' ? 'the record count' : `${cfg.mapFn} of ${cfg.mapField}`}. Sites with no matching records get no bubble.</p>
                          </>
                        ) : null}
                      </div>
                    )}

                    {/* Gauge (§4.8) — Measurement + Gauge Range, with its own condition editors */}
                    {curType.kind === 'gauge' && manualMode && (
                      <>
                        <div className="sec">
                          <div className="sec-h">Measurement</div>
                          <div className="pill-track gauge-seg">
                            <button aria-pressed={cfg.gaugeMode === 'count'} onClick={() => { cfg.gaugeMode = 'count'; }}>Count</button>
                            <button aria-pressed={cfg.gaugeMode === 'aggregate'} onClick={() => { cfg.gaugeMode = 'aggregate'; }}>Aggregate</button>
                            <button aria-pressed={cfg.gaugeMode === 'percentage'} onClick={() => { cfg.gaugeMode = 'percentage'; }}>Percentage</button>
                          </div>
                          {cfg.gaugeMode === 'aggregate' && (
                            <div className="grid2">
                              <div className="fld"><label>Function</label>{dd('gaugeFn', AGG_FNS)}</div>
                              <div className="fld"><label>Field</label>{dd('gaugeField', NUMERIC_FIELD_LABELS)}</div>
                            </div>
                          )}
                          {cfg.gaugeMode === 'percentage' && (
                            <>
                              <div className="fld" style={{ marginTop: 12 }}>
                                <label>Base conditions</label>
                                <p className="hint" style={{ margin: '0 0 8px' }}>The base set — the denominator. Leave empty to measure against every record.</p>
                                {mc('conds')}
                              </div>
                              <div className="fld" style={{ marginTop: 12 }}>
                                <label>Numerator</label>
                                <p className="hint" style={{ margin: '0 0 8px' }}>The share of the base that also meets these — the numerator.</p>
                                {mc('gaugeNumConds')}
                              </div>
                            </>
                          )}
                        </div>
                        {/* Conditions is its own section here, titled exactly as on every other chart. */}
                        {cfg.gaugeMode !== 'percentage' && (
                          <div className="sec">
                            <div className="sec-h">Conditions</div>
                            {mc('conds')}
                          </div>
                        )}
                        <div className="sec">
                          <div className="sec-h">Gauge Range</div>
                          <div className="grid2">
                            <div className="fld"><label>Max</label><input className="input" type="number" min={0} value={cfg.gaugeMax} onChange={(e) => { cfg.gaugeMax = e.target.value; }} placeholder="Auto" /></div>
                          </div>
                          <TglRow style={{ marginTop: 12 }} title="Higher is better" sub="Flip the bands so the top of the range is green, not red."
                            on={cfg.gaugeHigherBetter} onChange={(v: boolean) => { cfg.gaugeHigherBetter = v; }} />
                          <div className="grid2">
                            <div className="fld"><label>Amber from</label><input className="input" type="number" value={cfg.gaugeWarnAt} onChange={(e) => { cfg.gaugeWarnAt = e.target.value === '' ? '' : Number(e.target.value); }} /></div>
                            <div className="fld"><label>{cfg.gaugeHigherBetter ? 'Green from' : 'Red from'}</label><input className="input" type="number" value={cfg.gaugeBadAt} onChange={(e) => { cfg.gaugeBadAt = e.target.value === '' ? '' : Number(e.target.value); }} /></div>
                          </div>
                          <p className="hint">The bands come from these thresholds — the meter analog of KPI Highlights.</p>
                        </div>
                      </>
                    )}

                    {/* Free Text (2026-09-30, user's call): ONE rich-text field and nothing else —
                        the editor's own toolbar formats the text itself. */}
                    {isText && (
                      <div className="sec">
                        <div className="sec-h">Text to display <i className="req">*</i></div>
                        <RichTextEditor modelValue={cfg.content} onUpdateModelValue={(v: string) => { cfg.content = v; }} layout={noteLayout} onUpdateLayout={setNoteLayout} max={600} />
                      </div>
                    )}

                    {/* Data Configuration */}
                    {manualMode && !isText && (
                      <div className="sec">
                        <div className="sec-h">Data Configuration</div>
                        <div className="fld"><label>Date Filter <i>*</i></label>{dd('dateFilter', DATEF_OPTS)}</div>
                        {/* Opt out of the dashboard's shared time filter for this one widget. The
                            Date Range field is hidden until the switch is on. */}
                        <TglRow style={{ marginTop: 14 }} title="Restrict Date Overrides"
                          sub="Keep this widget on its own dates. Changing the dashboard’s time filter won’t affect it."
                          on={cfg.stickyDate} onChange={(v: boolean) => { cfg.stickyDate = v; }} />
                        {/* a calendar field, not a dropdown: a range can be a named preset OR an
                            absolute From→To, and a <select> can only ever offer the first */}
                        {cfg.stickyDate && <div className="fld"><label>Date Range <i>*</i></label><DateRangePicker modelValue={cfg.dateRange} onUpdateModelValue={(v: string) => { cfg.dateRange = v; }} /></div>}
                        <div className="fld"><label>Description</label><textarea className="input" rows={3} value={cfg.description} onChange={(e) => { cfg.description = e.target.value; }} placeholder="Description" /></div>
                      </div>
                    )}

                    {/* Conditions — a real editor on the classic kinds and the additional kinds (§5);
                        the preview's empty state waits for the first condition added here */}
                    {manualMode && !isNewKind && !isText && (
                      <div className="sec">
                        <div className="sec-h">Conditions</div>
                        {mc('conds')}
                      </div>
                    )}
                    {isChart && manualMode && isNewKind && curType.kind !== 'gauge' && (
                      <div className="sec">
                        <div className="sec-h">Conditions</div>
                        {mc('conds')}
                      </div>
                    )}

                    {/* Display — custom widgets only. */}
                    {isChart && !predefinedEdit && !noDisplay && (
                      <div className="sec">
                        <div className="sec-h">Display</div>
                        {/* Manage Legend — the same rank window the tile's legend pill offers.
                            Highest / Lowest says "Top N" / "Bottom N" in words. */}
                        {manualMode && hasLegend && (
                          <div className="fld">
                            <label>Manage Legend <Hint text={legendHint} /></label>
                            <div className="rank-row">
                              <div className="pill-track rank-seg">
                                <button aria-pressed={cfg.rank === 'all'} onClick={() => { cfg.rank = 'all'; }}>All</button>
                                <button aria-pressed={cfg.rank === 'top'} onClick={() => { cfg.rank = 'top'; }}>Highest</button>
                                <button aria-pressed={cfg.rank === 'bottom'} onClick={() => { cfg.rank = 'bottom'; }}>Lowest</button>
                              </div>
                              <input className="input rank-n" type="text" inputMode="numeric" value={cfg.rankN} onChange={(e) => setRankN(e.target.value)} disabled={cfg.rank === 'all'} placeholder={cfg.rank === 'all' ? 'All shown' : 'Select value'} />
                            </div>
                          </div>
                        )}
                        {/* Legend on/off — on by default; a chart with no key is unreadable. */}
                        {hasLegend && <TglRow title="Legend" sub="Print the key beside the chart, naming each colour." on={cfg.legend} onChange={(v: boolean) => { cfg.legend = v; }} />}
                        {/* The Donut switch is gone: Pie and Doughnut are two chart TYPES now. */}
                        {isPie && <TglRow title="Data labels" sub="Print each slice’s value on the chart itself." on={cfg.dataLabels} onChange={(v: boolean) => { cfg.dataLabels = v; }} />}
                        {manualMode && !predefinedEdit && (
                          <TglRow title="Exclude Zero Count Values" sub="Drop categories that matched no records, so the chart shows only what actually occurred."
                            on={cfg.excludeZero} onChange={(v: boolean) => { cfg.excludeZero = v; }} />
                        )}
                      </div>
                    )}
                    {/* The Highlights section was removed from the sidebar (2026-09-29, user's call). */}
                  </fieldset>
                )}
              </div>

              <footer className="cfg-foot dlg-foot">
                {/* Canvas duplicate → single Duplicate · Canvas edit → single Update ·
                    Library edit/clone + new create → both {prefix} and {prefix} & Add.
                    Every save path is blocked while the name collides. */}
                {duplicate ? (
                  <button className="btn btn-primary" disabled={!canSave} title={ctaHint} onClick={() => save(true)}><Icon name="copy" size={16} /> Duplicate {ctaLabel}</button>
                ) : editing ? (
                  <button className="btn btn-primary" disabled={!canSave} title={ctaHint} onClick={() => save(false)}>Update</button>
                ) : (
                  <>
                    {/* the place-it action leads — placing is the common case */}
                    <button className="btn btn-primary" disabled={!canSave} title={ctaHint} onClick={() => save(true)}>{prefix} &amp; Add to Dashboard</button>
                    <button className="btn btn-primary" disabled={!canSave} title={ctaHint} onClick={() => save(false)}>{prefix}</button>
                  </>
                )}
                <button className="btn" onClick={() => onClose?.()}>Cancel</button>
              </footer>
            </aside>
          </div>
        </div>
      </div>
    </DashPortal>
  );
}
