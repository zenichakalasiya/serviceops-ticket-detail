/**
 * The spotlight tour's pictures.
 *
 * ⚠️ ONE MINIATURE OF THE EDITOR, FOUR BEATS. Every step draws the SAME editor — top bar, canvas,
 * panel, rail, at the same geometry (`R`) — and lights the region it is about, so a reader who has
 * seen step one has seen the layout of all four. A spotlight card points at WHERE things are, which
 * is what a map of the screen is for. The dock's video is a different job — what DOING something
 * looks like — and lives in `PortalTourScenes.tsx` as illustrated scenes instead.
 *
 * ⚠️ NOT A VIDEO. SVG, driven by data, with CSS doing the motion: nothing to load, nothing to buffer,
 * crisp at any zoom, and it cannot go stale the way a screen recording does the next time the
 * builder's chrome changes. Keyframes live in `theme.css`, prefixed `pt-`, and honour
 * `prefers-reduced-motion`.
 *
 * ⚠️ The media panel is LIGHT on a dark card, because the thing it is a picture of is light.
 *
 * ⚠️ Every class name here is written out in full — a class built by interpolation never appears in
 * the source Tailwind scans, so it is never generated.
 */

import type { ReactNode } from 'react';

const ACCENT = '#3D8BD0';
const INK = '#CBD5E1';
const INK_SOFT = '#E2E8F0';
const PAPER = '#FFFFFF';
const MUTE = '#94A3B8';
/** How long the placed card takes to change shape or colour. */
const T = 'all 340ms cubic-bezier(0.4,0,0.2,1)';

export type TourBeat = 'rail' | 'panel' | 'canvas' | 'publish';

/* The miniature's geometry, in its own 288×160 space. */
const R = {
  bar: { x: 10, y: 10, w: 268, h: 18 },
  canvas: { x: 10, y: 32, w: 196, h: 118 },
  panel: { x: 210, y: 32, w: 44, h: 118 },
  rail: { x: 258, y: 32, w: 20, h: 118 },
};

const rect = (g: { x: number; y: number; w: number; h: number }) => ({ x: g.x, y: g.y, width: g.w, height: g.h });

/** A widget as it sits on the page: a white card, a heading bar, two lines of content. Drawn ONCE,
 *  so the card the spotlight step lands and the card the story builds on are the same card. */
function WidgetCard({ x, y, w, h, fill = PAPER, pad = 0 }: { x: number; y: number; w: number; h: number; fill?: string; pad?: number }) {
  const ix = x + 6 + pad;
  const iw = Math.max(8, w - 12 - pad * 2);
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="3" fill={fill} stroke="#E2E8F0" strokeWidth="0.75" style={{ transition: T }} />
      <rect x={ix} y={y + 6 + pad} width={Math.min(iw, 34)} height="4" rx="2" fill={ACCENT} opacity="0.85" style={{ transition: T }} />
      <rect x={ix} y={y + 15 + pad} width={iw} height="3" rx="1.5" fill={INK} style={{ transition: T }} />
      <rect x={ix} y={y + 22 + pad} width={iw * 0.7} height="3" rx="1.5" fill={INK} style={{ transition: T }} />
    </g>
  );
}

/** The frame both pictures share: the page, the bar, the panel and the rail, all at rest. */
function Chrome({ children, railLit, panel }: { children?: ReactNode; railLit?: boolean; panel?: ReactNode }) {
  return (
    <>
      <rect x="0" y="0" width="288" height="160" rx="8" fill="#F1F5F9" />
      <rect {...rect(R.canvas)} rx="4" fill={PAPER} />
      <rect {...rect(R.panel)} rx="4" fill={PAPER} />
      {panel}
      <rect {...rect(R.rail)} rx="4" fill={railLit ? '#EEF5FC' : PAPER} />
      <rect {...rect(R.bar)} rx="4" fill={PAPER} />
      <rect x="16" y="16" width="34" height="6" rx="3" fill={INK} opacity="0.8" />
      {children}
    </>
  );
}

/* ═════════════════════════════════════ THE FOUR SPOTLIGHT STEPS ═════════════════════════════════ */

function lit(beat: TourBeat, region: TourBeat) {
  return beat === region;
}

export function TourArt({ beat }: { beat: TourBeat }) {
  return (
    <svg viewBox="0 0 288 160" className="h-full w-full" role="img" aria-hidden="true">
      <Chrome
        railLit={lit(beat, 'rail')}
        panel={
          <>
            <rect x="214" y="38" width="28" height="5" rx="2.5" fill={INK} opacity="0.7" />
            {[50, 66, 82, 98].map((y, i) => (
              <g key={y}>
                <rect x="214" y={y} width="36" height="12" rx="2.5" fill={lit(beat, 'panel') ? '#EEF5FC' : '#F5F7FA'} />
                <rect x="217" y={y + 3} width="6" height="6" rx="1.5" fill={lit(beat, 'panel') ? ACCENT : INK} opacity={lit(beat, 'panel') ? 0.9 : 0.55} />
                <rect x="227" y={y + 4.5} width={i % 2 ? 14 : 19} height="3" rx="1.5" fill={INK} opacity="0.7" />
              </g>
            ))}
          </>
        }
      >
        {/* banner */}
        <rect x="16" y="38" width="184" height="40" rx="3" fill={lit(beat, 'canvas') ? '#DCEAF7' : INK_SOFT} className={lit(beat, 'canvas') ? 'pt-tint' : undefined} />
        <rect x="24" y="48" width="74" height="6" rx="3" fill={lit(beat, 'canvas') ? ACCENT : INK} opacity="0.75" />
        <rect x="24" y="60" width="50" height="4" rx="2" fill={INK} opacity="0.6" />
        {[16, 78, 140].map((x) => <rect key={x} x={x} y="84" width="56" height="26" rx="3" fill={INK_SOFT} />)}

        {/* ⚠️ The wide slot at the foot of the canvas. On every beat but the panel one it is a plain
            block; on the panel beat it is where the dragged widget LANDS, as a real card. */}
        {!lit(beat, 'panel') && <rect x="16" y="116" width="184" height="28" rx="3" fill={INK_SOFT} />}
        {lit(beat, 'panel') && (
          <>
            {/* the drop target, dashed, until the widget arrives */}
            <rect x="16" y="116" width="184" height="28" rx="3" fill="none" stroke={ACCENT} strokeWidth="1" strokeDasharray="3 2.5" className="pt-target" />
            {/* ⚠️ The landed widget is DRAWN as a card, never a library row scaled up. Scaling the
                row 4× stretched its stroke and its insides into a smeared pill — the picture was of a
                row that had been zoomed, not of a widget that had been placed. */}
            <g className="pt-land"><WidgetCard x={16} y={116} w={184} h={28} /></g>
            {/* ⚠️ The ghost only TRANSLATES. It keeps the size of the row it came from all the way
                across and disappears as the card appears, so nothing is ever drawn stretched. */}
            <g className="pt-ghost">
              <rect x="214" y="66" width="36" height="12" rx="2.5" fill={PAPER} stroke={ACCENT} strokeWidth="1" />
              <rect x="217" y="69" width="6" height="6" rx="1.5" fill={ACCENT} />
              <rect x="227" y="70.5" width="14" height="3" rx="1.5" fill={INK} />
            </g>
          </>
        )}

        {lit(beat, 'canvas') && (
          <g className="pt-fade">
            <rect x="16" y="38" width="184" height="40" rx="3" fill="none" stroke={ACCENT} strokeWidth="1.5" />
            <rect x="56" y="30" width="104" height="14" rx="3" fill={PAPER} stroke="#E5E7EB" strokeWidth="0.75" />
            {[63, 76, 89, 102, 115, 128, 141].map((cx, i) => (
              <circle key={cx} cx={cx} cy="37" r="2.4" fill={i === 3 ? ACCENT : MUTE} className={i === 3 ? 'pt-pulse' : undefined} />
            ))}
          </g>
        )}

        {[46, 68, 90, 112].map((cy, i) => (
          <circle
            key={cy} cx="268" cy={cy} r="4.5"
            fill={lit(beat, 'rail') ? ACCENT : MUTE}
            opacity={lit(beat, 'rail') ? 1 : 0.55}
            className={lit(beat, 'rail') ? 'pt-step' : undefined}
            style={lit(beat, 'rail') ? { animationDelay: `${i * 0.45}s` } : undefined}
          />
        ))}

        <rect x="196" y="14" width="20" height="10" rx="5" fill={lit(beat, 'publish') ? ACCENT : '#E2E8F0'} className={lit(beat, 'publish') ? 'pt-flip' : undefined} />
        <circle cx={lit(beat, 'publish') ? 206 : 201} cy="19" r="3.5" fill={PAPER} className={lit(beat, 'publish') ? 'pt-knob' : undefined} />
        <rect x="222" y="14" width="24" height="10" rx="2.5" fill="none" stroke="#DFE5ED" strokeWidth="1" />
        <rect x="250" y="14" width="22" height="10" rx="2.5" fill={ACCENT} className={lit(beat, 'publish') ? 'pt-pulse' : undefined} opacity={lit(beat, 'publish') ? 1 : 0.35} />
      </Chrome>
    </svg>
  );
}
