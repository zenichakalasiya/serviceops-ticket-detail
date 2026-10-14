/**
 * ChartIcon — the illustrated chart-type icons for the Create Widget picker.
 *
 * Geometry is verbatim from the supplied 64×64 contact sheet: same artboard, same
 * translate/scale group per icon, same three-step opacity ramp (0.2 / 0.4 / 0.6) that
 * gives each glyph its depth.
 *
 * The one change is the colour. The sheet hard-codes #516381 for every shape; the glyphs
 * paint from --ci-1/2/3 instead, which resolve to `currentColor` at the sheet's own
 * 1 / 0.55 / 0.3 — so the call site sets the colour and both themes work from one set
 * of values.
 *
 * `multiline` and `text` were not in the sheet — they are drawn here in the same idiom
 * (same frame, same ramp, same stroke weights) rather than borrowing another icon's
 * glyph, which would have made Line and Multi-line identical.
 */
import './ChartIcon.css';

// per-icon group transform, straight from the sheet
const T: Record<string, string> = {
  pie: 'translate(-4 -4.0) scale(1.5)',
  donut: 'translate(-4 -4.0) scale(1.5)',
  bar: 'translate(8 13)',
  /* The cartesian kinds are drawn on the reference SVGs' own 48x38 artboard and simply
     centred in the 64 box — no 1.5 scale. Redrawing them at the sheet's scale would mean
     re-deriving every coordinate, and the axis weights would stop matching the files they
     came from. */
  line: 'translate(8 13)',
  multiline: 'translate(8 13)',
  column: 'translate(8 13)',
  gauge: 'translate(-4 -4.0) scale(1.5)',
  hist: 'translate(8 13)',
  heatmap: 'translate(-4 -4.0) scale(1.5)',
  stack: 'translate(8 13)',
  grouped: 'translate(8 13)',
  combo: 'translate(8 13)',
  funnel: 'translate(0 0)',
  mapbubble: 'translate(-4 -4.0) scale(1.5)',
  kpi: 'translate(-4 -4.0) scale(1.5)',
  shortcut: 'translate(8 13)',
  text: 'translate(-4 -4.0) scale(1.5)',
  group: 'translate(-4 -4.0) scale(1.5)',
};

function Glyph({ name }: { name: string }) {
  switch (name) {
    /* Pie */
    case 'pie': return (
      <>
        <path d="M24 24L19.983 36.365A13 13 0 0 1 24 11Z" fill="var(--ci-3)" />
        <path d="M24 24L36.365 28.017A13 13 0 0 1 19.983 36.365Z" fill="var(--ci-2)" />
        <path d="M24 24L24 11A13 13 0 0 1 36.365 28.017Z" transform="translate(1.3 -0.95)" fill="var(--ci-1)" />
      </>
    );

    /* Donut */
    case 'donut': return (
      <>
        <path d="M24.563 13.265A10.75 10.75 0 0 1 30.765 32.354" fill="none" stroke="var(--ci-1)" strokeWidth="6.5" />
        <path d="M29.854 33.016A10.75 10.75 0 0 1 13.265 24.563" fill="none" stroke="var(--ci-2)" strokeWidth="6.5" />
        <path d="M13.265 23.437A10.75 10.75 0 0 1 23.437 13.265" fill="none" stroke="var(--ci-3)" strokeWidth="6.5" />
      </>
    );

    /* Bar — horizontal bars off a value axis, standing clear of it. NOT segmented: the
       reference for this slot is a STACKED horizontal bar, but our Bar chart plots one
       series and segments would promise a stack it never renders. Bars alone floated; the
       axis is what says which edge they are measured from. */
    case 'bar': return (
      <>
        <path d="M5 4V35" fill="none" stroke="var(--ci-axis)" strokeWidth="2.1" strokeLinecap="round" />
        <rect x="9" y="7" width="30" height="7" rx="1.2" fill="var(--ci-1)" />
        <rect x="9" y="17" width="20" height="7" rx="1.2" fill="var(--ci-2)" />
        <rect x="9" y="27" width="12" height="7" rx="1.2" fill="var(--ci-3)" />
      </>
    );

    /* Line — one series ON ITS AXIS. The reference set draws the baseline for every
       cartesian kind, which is what stops Line, Area and Multi-line reading as loose squiggles. */
    case 'line': return (
      <>
        <path d="M5 4V34H43" fill="none" stroke="var(--ci-axis)" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9 26L18 17L26 21L34 10L41 15" fill="none" stroke="var(--ci-1)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </>
    );

    /* Multi-line — two series, the second dropped to --ci-3 so the pair reads as two lines
       rather than as one line crossing itself; no area fill, so it never reads as Line. */
    case 'multiline': return (
      <>
        <path d="M5 4V34H43" fill="none" stroke="var(--ci-axis)" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9 23L17 13L25 17L33 7L41 12" fill="none" stroke="var(--ci-1)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9 29L17 24L25 27L33 20L41 24" fill="none" stroke="var(--ci-3)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </>
    );

    /* Column — vertical bars on a baseline — Bar turned ninety degrees, same three steps. */
    case 'column': return (
      <>
        <path d="M5 34H43" fill="none" stroke="var(--ci-axis)" strokeWidth="2.1" strokeLinecap="round" />
        <rect x="9" y="12" width="8" height="18" rx="1.2" fill="var(--ci-1)" />
        <rect x="20" y="19" width="8" height="11" rx="1.2" fill="var(--ci-2)" />
        <rect x="31" y="8" width="8" height="22" rx="1.2" fill="var(--ci-3)" />
      </>
    );

    /* Gauge */
    case 'gauge': return (
      <>
        <path d="M10 31A14 14 0 0 1 17 18.876" fill="none" stroke="var(--ci-3)" strokeWidth="5.5" />
        <path d="M17 18.876A14 14 0 0 1 31 18.876" fill="none" stroke="var(--ci-2)" strokeWidth="5.5" />
        <path d="M31 18.876A14 14 0 0 1 38 31" fill="none" stroke="var(--ci-1)" strokeWidth="5.5" />
        <path d="M24 31L18.836 21.29" fill="none" stroke="var(--ci-1)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="24" cy="31" r="2.5" fill="var(--ci-1)" />
      </>
    );

    /* Histogram — five TOUCHING columns over continuous bins. Only the modal bin is inked;
       the other four take the ground step, so the shape of the distribution is what you
       read. Still one colour family — a histogram is one series, and a ramp across the bins
       would imply several. They touch each other but stand clear of the axis — the gap is
       against the LINE, the bins themselves are continuous and must not be separated. */
    case 'hist': return (
      <>
        <path d="M5 34H43" fill="none" stroke="var(--ci-axis)" strokeWidth="2.1" strokeLinecap="round" />
        <rect x="7" y="23" width="7" height="7" fill="var(--ci-4)" />
        <rect x="14.5" y="15" width="7" height="15" fill="var(--ci-4)" />
        <rect x="22" y="19" width="7" height="11" fill="var(--ci-4)" />
        <rect x="29.5" y="8" width="7" height="22" fill="var(--ci-1)" />
        <rect x="37" y="13" width="7" height="17" fill="var(--ci-4)" />
      </>
    );

    /* Heatmap — a single hexagon holding its readings. The eight-hex honeycomb that was here
       briefly came from a Highcharts TILEMAP, which is a different chart from the one we
       draw; one hexagon reads as "a measured cell" without claiming a layout. NOTE: our Heat
       Map renders a rectangular MATRIX, so this icon and that chart disagree — chosen with
       that known and accepted. The body is the GROUND step: it is the cell, not a
       measurement, and at 0.4 it competed with the two bars it is meant to hold. */
    case 'heatmap': return (
      <>
        <path d="M24 11 35 17.5 35 30.5 24 37 13 30.5 13 17.5Z" fill="var(--ci-4)" stroke="var(--ci-1)" strokeWidth="2" strokeLinejoin="round" />
        <rect x="18.5" y="20.5" width="11" height="2.6" rx="1.3" fill="var(--ci-1)" />
        <rect x="18.5" y="25.5" width="11" height="2.6" rx="1.3" fill="var(--ci-1)" />
      </>
    );

    /* Stacked — three columns, each SEGMENTED bottom-to-top 0.8 / 0.6 / 0.4, standing on a
       baseline (which separates it from Grouped). Only the TOP segment is rounded — the joins
       inside a stack are butted, which is what makes it read as one column rather than three tiles. */
    case 'stack': return (
      <>
        <path d="M5 34H43" fill="none" stroke="var(--ci-axis)" strokeWidth="2.1" strokeLinecap="round" />
        <rect x="9" y="24" width="8" height="6" fill="var(--ci-1)" />
        <rect x="9" y="17" width="8" height="7" fill="var(--ci-2)" />
        <path d="M9 13.2A1.2 1.2 0 0 1 10.2 12H15.8A1.2 1.2 0 0 1 17 13.2V17H9Z" fill="var(--ci-3)" />
        <rect x="20" y="25" width="8" height="5" fill="var(--ci-1)" />
        <rect x="20" y="18" width="8" height="7" fill="var(--ci-2)" />
        <path d="M20 15.2A1.2 1.2 0 0 1 21.2 14H26.8A1.2 1.2 0 0 1 28 15.2V18H20Z" fill="var(--ci-3)" />
        <rect x="31" y="22" width="8" height="8" fill="var(--ci-1)" />
        <rect x="31" y="14" width="8" height="8" fill="var(--ci-2)" />
        <path d="M31 10.2A1.2 1.2 0 0 1 32.2 9H37.8A1.2 1.2 0 0 1 39 10.2V14H31Z" fill="var(--ci-3)" />
      </>
    );

    /* Combo — bars with a series line riding clear ABOVE them, and ONE path, because this is
       the icon the developers receive verbatim. Bar heights are lifted from Grouped so the two
       read as the same family. Each line point clears its own bar EVERYWHERE — a line that
       crosses the bars has to be read apart from them before it can be read at all, and at
       40px there is no room for that. The line is offset ONCE into a single outline with
       mitred corners, at the same 2.2 the Line and Multi-line data strokes use (overlapping
       per-segment quads left a notch on every bend). A single <path> carries a single fill,
       so the axis and the line are filled outlines rather than strokes — which is why Combo
       is the one FLAT icon in this set. Generated, not hand-written. */
    case 'combo': return (
      <path
        d="M5 4H7.1V34H43V36.1H5ZM9 17H16V30H9ZM18 22H25V30H18ZM27 14H34V30H27ZM36 20H43V30H36ZM12.05 9.01L21.7 13.29L30.65 5.34L38.97 9.96L40.03 8.04L30.35 2.66L21.3 10.71L12.95 6.99Z"
        fill="var(--ci-1)" fillRule="evenodd"
      />
    );

    /* Funnel — a FUNNEL, per the supplied reference, not three stacked trapezoids. The
       reference draws the object — a mouth you can see into, a cone in two tiers, and a
       spout — so every edge is an ELLIPSE arc, which puts the thing in perspective.
       Each tier below the mouth takes its top edge from a LOWER-half arc (the tier above
       blocks the view; upper-half arcs crossed and the tones bled). Each top edge is the
       tier ABOVE's bottom edge, same rx/ry, moved down 1.6 — that keeps the gap constant.
       The ramp runs light-to-dark downward: the narrow end holds the fewest records.
       Drawn on the unscaled artboard, so the arc radii mean the numbers written here. */
    case 'funnel': return (
      <>
        <path d="M8 14A24 5.5 0 0 1 56 14L45 30.5A13 3 0 0 1 19 30.5Z" fill="var(--ci-3)" />
        <path d="M14.5 14A17.5 3.2 0 1 0 49.5 14A17.5 3.2 0 1 0 14.5 14Z" fill="var(--ci-4)" />
        <path d="M19 32.1A13 3 0 0 0 45 32.1L38 42A6 1.4 0 0 1 26 42Z" fill="var(--ci-2)" />
        <path d="M26 43.6A6 1.4 0 0 0 38 43.6L38 53.5A6 1.4 0 0 1 26 53.5Z" fill="var(--ci-1)" />
      </>
    );

    /* Map Bubble */
    case 'mapbubble': return (
      <>
        <path d="M8 15L18.5 11.5V32.5L8 36Z" fill="var(--ci-3)" />
        <path d="M18.5 11.5L29.5 15V36L18.5 32.5Z" fill="var(--ci-2)" />
        <path d="M29.5 15L40 11.5V32.5L29.5 36Z" fill="var(--ci-3)" />
        <circle cx="27" cy="21" r="4.5" fill="var(--ci-1)" />
        <circle cx="14.5" cy="24" r="3.2" fill="var(--ci-2)" />
        <circle cx="35" cy="27" r="2.2" fill="var(--ci-2)" />
      </>
    );

    /* KPI — a NUMBER, because that is the whole tile: a KPI is a count of something. Digits
       cannot be read as anything else (an abstract block read as a title bar). The trend arrow
       is gone: a KPI tile renders the number ONLY, so the arrow advertised a reading the tile
       never shows. The card behind it takes the ground step so the digits are the only thing
       with weight. Monospace so the glyphs sit on an even rhythm at any size. */
    case 'kpi': return (
      <>
        <rect x="7" y="12" width="34" height="24" rx="3" fill="var(--ci-4)" />
        <text
          x="24" y="29.5" textAnchor="middle" fill="var(--ci-1)"
          fontFamily="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
          fontSize="15" fontWeight="700" letterSpacing="-0.5"
        >123</text>
      </>
    );

    /* Shortcut — a HEADED table, per the supplied reference. What says "table" is a row of
       column heads that are visibly not data, so there is a bar in every header cell and only
       in the first column below it. Five rows: a Shortcut tile is a RECORD LIST, and the
       density is part of what the icon says. The frame steps back to --ci-2 and the rules to a
       1px --ci-3, so the marks INSIDE the table are the darkest thing in it. Only the HEADER
       band is tinted: tinting the whole table collapsed the 1px rules into one grey mesh. */
    case 'shortcut': return (
      <>
        <path d="M7.5 5H40.5A2.5 2.5 0 0143 7.5V11.4H5V7.5A2.5 2.5 0 017.5 5Z" fill="var(--ci-4)" />
        <path
          d="M5 11.4H43M5 16.8H43M5 22.2H43M5 27.6H43M17.67 5V33M30.33 5V33"
          fill="none" stroke="var(--ci-3)" strokeWidth="1"
        />
        <rect x="5" y="5" width="38" height="28" rx="2.5" fill="none" stroke="var(--ci-2)" strokeWidth="2.1" />
        <rect x="7.34" y="7" width="8" height="2.4" rx="1.2" fill="var(--ci-1)" />
        <rect x="20" y="7" width="8" height="2.4" rx="1.2" fill="var(--ci-1)" />
        <rect x="32.67" y="7" width="8" height="2.4" rx="1.2" fill="var(--ci-1)" />
        <rect x="8" y="12.9" width="6.6" height="2.4" rx="1.2" fill="var(--ci-2)" />
        <rect x="8" y="18.3" width="6.6" height="2.4" rx="1.2" fill="var(--ci-2)" />
        <rect x="8" y="23.7" width="6.6" height="2.4" rx="1.2" fill="var(--ci-2)" />
        <rect x="8" y="29.1" width="6.6" height="2.4" rx="1.2" fill="var(--ci-2)" />
      </>
    );

    /* Free Text — a serif T on the note it writes. Lines-on-a-card was indistinguishable from
       Shortcut at 24px; a letterform cannot be confused with a table. The letterform is set
       smaller than the note — at full height it stopped reading as "a letter ON a page". */
    case 'text': return (
      <>
        <rect x="8" y="11" width="32" height="26" rx="3" fill="var(--ci-4)" />
        <path d="M17 18H31V22.6H29.1V20.2H25.1V29.4H27.2V31.6H20.8V29.4H22.9V20.2H18.9V22.6H17Z" fill="var(--ci-1)" />
      </>
    );

    /* Grouped — drawn to the sheet's rules: same 8→40 span and baseline as Stacked, but TWO
       PAIRS standing SIDE BY SIDE. The gap between the pairs is the entire difference from
       Column; next to Stacked it has to be the difference you notice. */
    case 'grouped': return (
      <>
        <path d="M5 34H43" fill="none" stroke="var(--ci-axis)" strokeWidth="2.1" strokeLinecap="round" />
        <rect x="8" y="11" width="7" height="19" rx="1.2" fill="var(--ci-1)" />
        <rect x="16" y="18" width="7" height="12" rx="1.2" fill="var(--ci-3)" />
        <rect x="27" y="7" width="7" height="23" rx="1.2" fill="var(--ci-1)" />
        <rect x="35" y="15" width="7" height="15" rx="1.2" fill="var(--ci-3)" />
      </>
    );

    /* Empty group — an empty folder with a plus. The WHOLE folder is the lightest step, tab
       included, so the plus has nothing but the ground behind it. The plus stays the darkest
       mark: it is the ACTION, and a mark has to be darker than the surface it sits on —
       lightening the plus itself put it below its own background and it vanished. */
    case 'group': return (
      <>
        <path d="M10 13H20.5L24 17H38A2 2 0 0 1 40 19V34A2 2 0 0 1 38 36H10A2 2 0 0 1 8 34V15A2 2 0 0 1 10 13Z" fill="var(--ci-4)" />
        <path d="M8 21H40V34A2 2 0 0 1 38 36H10A2 2 0 0 1 8 34Z" fill="var(--ci-4)" />
        <rect x="22.75" y="23.5" width="2.5" height="10" rx="1.25" fill="var(--ci-1)" />
        <rect x="19" y="27.25" width="10" height="2.5" rx="1.25" fill="var(--ci-1)" />
      </>
    );

    default: return null;
  }
}

export function ChartIcon({ name, size = 40, className = '', style }: any) {
  return (
    <svg className={`cico dc-ChartIcon ${className}`.trim()} style={style} width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true" focusable="false">
      <g transform={T[name] || T.pie}>
        <Glyph name={name} />
      </g>
    </svg>
  );
}
