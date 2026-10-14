/**
 * EmptyGroupArt — the empty group's illustration: "drop a widget here".
 *
 * Drawn here rather than taken from a stock library: the prototype is a public repo and
 * the product ships on-prem, so a third-party vector would be redistributed under its
 * licence, and a stock file brings its own colours, which break in dark mode.
 *
 * Same idiom as ChartIcon — one colour (`currentColor`, set by the caller) at stepped
 * opacities, plus the card surface for the widget's face — so it sits in the same family
 * as the chart artwork and flips with the theme.
 *
 * The story, left to right: a dashed drop zone with two empty slots; a widget card, tilted
 * as if carried, hovering over the right-hand slot, which is picked out as the target; a
 * soft shadow under the card where it will land; a dashed arc behind it for the motion.
 */
import './EmptyGroupArt.css';

export function EmptyGroupArt({ width = 132, className = '' }: any) {
  return (
    <svg className={`ega dc-EmptyGroupArt ${className}`.trim()} width={width} height={width * 0.64} viewBox="0 0 132 84" fill="none" aria-hidden="true" focusable="false">
      {/* the drop zone */}
      <rect x="8" y="36" width="116" height="44" rx="8" fill="currentColor" fillOpacity=".05"
        stroke="currentColor" strokeOpacity=".38" strokeWidth="1.25" strokeDasharray="4 3" />
      {/* an empty slot, and the TARGET slot the card is headed for */}
      <rect x="16" y="44" width="46" height="28" rx="5" fill="currentColor" fillOpacity=".08" />
      <rect x="70" y="44" width="46" height="28" rx="5" fill="currentColor" fillOpacity=".12"
        stroke="currentColor" strokeOpacity=".5" strokeWidth="1" strokeDasharray="3 2.5" />
      {/* where it will land */}
      <ellipse className="ega-shadow" cx="93" cy="58" rx="17" ry="3" fill="currentColor" fillOpacity=".14" />

      {/* the motion: a dashed arc coming in from the left */}
      <path d="M30 18 C 44 6, 60 6, 70 14" stroke="currentColor" strokeOpacity=".35" strokeWidth="1.25"
        strokeDasharray="2.5 3" strokeLinecap="round" />
      <path d="M67 10.5 L 71 14.4 L 66 16" stroke="currentColor" strokeOpacity=".45" strokeWidth="1.25"
        strokeLinecap="round" strokeLinejoin="round" />

      {/* the widget, carried: a card with a title stub and a small column chart */}
      <g className="ega-card">
        <g transform="translate(74 4) rotate(-8)">
          <rect x="0" y="0" width="42" height="32" rx="5" fill="var(--surface)" stroke="currentColor" strokeOpacity=".7" strokeWidth="1.25" />
          <path d="M0.6 9 H41.4" stroke="currentColor" strokeOpacity=".22" />
          <rect x="5" y="3.4" width="15" height="2.4" rx="1.2" fill="currentColor" fillOpacity=".5" />
          <rect x="7" y="19" width="5" height="9" rx="1" fill="currentColor" fillOpacity=".8" />
          <rect x="15" y="14" width="5" height="14" rx="1" fill="currentColor" fillOpacity=".55" />
          <rect x="23" y="17" width="5" height="11" rx="1" fill="currentColor" fillOpacity=".8" />
          <rect x="31" y="11" width="5" height="17" rx="1" fill="currentColor" fillOpacity=".4" />
        </g>
      </g>
    </svg>
  );
}
