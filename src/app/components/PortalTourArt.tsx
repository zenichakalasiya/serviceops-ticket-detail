/**
 * The tour's moving pictures.
 *
 * ⚠️ ONE DRAWING, FOUR BEATS. Every step renders the SAME miniature of this editor — top bar,
 * canvas, panel, rail — and lights the region it is about while a small action plays inside it.
 * Four unrelated illustrations would have made the reader re-learn the layout on every card; one
 * wireframe means each step says "that part, there" about a picture they already read on step one.
 * It is also what lets the dock's recap be the same component running all four beats in sequence
 * rather than a fifth drawing that could drift from the other four.
 *
 * ⚠️ NOT A VIDEO. There is no file to load, nothing to buffer, nothing that goes stale when the
 * builder's chrome changes — it is SVG with CSS keyframes (in `theme.css`, prefixed `pt-`), so it
 * is a few kilobytes, it is crisp at any zoom, and it re-colours with the product's own tokens.
 *
 * ⚠️ The media panel is LIGHT on a dark card, because the thing it is a picture of is light. A dark
 * wireframe on a dark card would read as decoration on the card; a light one reads as a screen.
 *
 * ⚠️ Every class name here is written out in full. A class built by interpolation never appears in
 * the source Tailwind scans, so the utility is never generated and the element silently renders
 * unstyled — the trap `PortalElementPreview` already carries a note about.
 */

const ACCENT = '#3D8BD0';
const INK = '#CBD5E1';
const INK_SOFT = '#E2E8F0';
const PAPER = '#FFFFFF';

export type TourBeat = 'rail' | 'panel' | 'canvas' | 'publish';

/* The miniature's geometry, in its own 288×160 space. Named so a beat can talk about a region
   rather than repeating four numbers. */
const R = {
  bar: { x: 10, y: 10, w: 268, h: 18 },
  canvas: { x: 10, y: 32, w: 196, h: 118 },
  panel: { x: 210, y: 32, w: 44, h: 118 },
  rail: { x: 258, y: 32, w: 20, h: 118 },
};

/** A beat lights exactly one region; everything else stays quiet. */
function lit(beat: TourBeat, region: TourBeat) {
  return beat === region;
}

export function TourArt({ beat, loop }: { beat: TourBeat; loop?: boolean }) {
  return (
    <svg viewBox="0 0 288 160" className="h-full w-full" role="img" aria-hidden="true">
      {/* the page the miniature sits on */}
      <rect x="0" y="0" width="288" height="160" rx="8" fill="#F1F5F9" />

      {/* ── canvas ─────────────────────────────────────────────────────────────────────── */}
      <rect {...R.canvas} rx="4" fill={PAPER} />
      {/* banner */}
      <rect
        x="16" y="38" width="184" height="40" rx="3"
        fill={lit(beat, 'canvas') ? '#DCEAF7' : INK_SOFT}
        className={lit(beat, 'canvas') ? 'pt-tint' : undefined}
      />
      <rect x="24" y="48" width="74" height="6" rx="3" fill={lit(beat, 'canvas') ? ACCENT : INK} opacity="0.75" />
      <rect x="24" y="60" width="50" height="4" rx="2" fill={INK} opacity="0.6" />

      {/* the three action cards */}
      {[16, 78, 140].map((x) => (
        <rect key={x} x={x} y="84" width="56" height="26" rx="3" fill={INK_SOFT} />
      ))}

      {/* a wide block — also where the dropped widget lands on the panel beat */}
      <rect x="16" y="116" width="184" height="28" rx="3" fill={INK_SOFT} />

      {/* ── canvas beat: selection outline + the floating toolbar above the banner ───────── */}
      {lit(beat, 'canvas') && (
        <g className="pt-fade">
          <rect x="16" y="38" width="184" height="40" rx="3" fill="none" stroke={ACCENT} strokeWidth="1.5" />
          {/* the bar itself, drawn just inside the band's top edge the way the real one sits */}
          <rect x="56" y="30" width="104" height="14" rx="3" fill={PAPER} stroke="#E5E7EB" strokeWidth="0.75" />
          {[63, 76, 89, 102, 115, 128, 141].map((cx, i) => (
            <circle
              key={cx}
              cx={cx} cy="37" r="2.4"
              fill={i === 3 ? ACCENT : '#94A3B8'}
              className={i === 3 ? 'pt-pulse' : undefined}
            />
          ))}
        </g>
      )}

      {/* ── panel ──────────────────────────────────────────────────────────────────────── */}
      <rect {...R.panel} rx="4" fill={PAPER} />
      <rect x="214" y="38" width="28" height="5" rx="2.5" fill={INK} opacity="0.7" />
      {[50, 66, 82, 98].map((y, i) => (
        <g key={y}>
          <rect
            x="214" y={y} width="36" height="12" rx="2.5"
            fill={lit(beat, 'panel') ? '#EEF5FC' : '#F5F7FA'}
          />
          <rect x="217" y={y + 3} width="6" height="6" rx="1.5" fill={lit(beat, 'panel') ? ACCENT : INK} opacity={lit(beat, 'panel') ? 0.9 : 0.55} />
          <rect x="227" y={y + 4.5} width={i % 2 ? 14 : 19} height="3" rx="1.5" fill={INK} opacity="0.7" />
        </g>
      ))}

      {/* ── panel beat: one row lifts out and lands in the canvas ───────────────────────── */}
      {lit(beat, 'panel') && (
        <g className="pt-fly">
          <rect x="214" y="66" width="36" height="12" rx="2.5" fill={PAPER} stroke={ACCENT} strokeWidth="1" />
          <rect x="217" y="69" width="6" height="6" rx="1.5" fill={ACCENT} />
          <rect x="227" y="70.5" width="14" height="3" rx="1.5" fill={INK} />
        </g>
      )}

      {/* ── rail ───────────────────────────────────────────────────────────────────────── */}
      <rect {...R.rail} rx="4" fill={lit(beat, 'rail') ? '#EEF5FC' : PAPER} />
      {[46, 68, 90, 112].map((cy, i) => (
        <circle
          key={cy}
          cx="268" cy={cy} r="4.5"
          fill={lit(beat, 'rail') ? ACCENT : '#94A3B8'}
          opacity={lit(beat, 'rail') ? 1 : 0.55}
          className={lit(beat, 'rail') ? 'pt-step' : undefined}
          style={lit(beat, 'rail') ? { animationDelay: `${i * 0.45}s` } : undefined}
        />
      ))}

      {/* ── top bar ────────────────────────────────────────────────────────────────────── */}
      <rect {...R.bar} rx="4" fill={PAPER} />
      <rect x="16" y="16" width="34" height="6" rx="3" fill={INK} opacity="0.8" />
      {/* light / dark, then Preview, then the primary — the real bar's own right-hand order */}
      <rect
        x="196" y="14" width="20" height="10" rx="5"
        fill={lit(beat, 'publish') ? ACCENT : '#E2E8F0'}
        className={lit(beat, 'publish') ? 'pt-flip' : undefined}
      />
      <circle cx={lit(beat, 'publish') ? 206 : 201} cy="19" r="3.5" fill={PAPER} className={lit(beat, 'publish') ? 'pt-knob' : undefined} />
      <rect x="222" y="14" width="24" height="10" rx="2.5" fill="none" stroke="#DFE5ED" strokeWidth="1" />
      <rect
        x="250" y="14" width="22" height="10" rx="2.5"
        fill={ACCENT}
        className={lit(beat, 'publish') ? 'pt-pulse' : undefined}
        opacity={lit(beat, 'publish') ? 1 : 0.35}
      />

      {/* ⚠️ The recap runs every beat in turn, so it needs the whole page to darken on the publish
          beat rather than only the toggle — the mode switch is about the CANVAS, and a toggle that
          flips while nothing else changes says the opposite. */}
      {loop && <rect x="0" y="0" width="288" height="160" rx="8" fill="#0F172A" className="pt-mode" pointerEvents="none" />}
    </svg>
  );
}

/** The dock's loop: the same miniature, cycling the four beats. */
export function TourRecapArt({ beat }: { beat: TourBeat }) {
  return <TourArt beat={beat} loop />;
}
