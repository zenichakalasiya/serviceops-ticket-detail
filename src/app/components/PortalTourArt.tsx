/**
 * The tour's moving pictures.
 *
 * ⚠️ ONE MINIATURE OF THE EDITOR, TWO USES. Every picture here draws the SAME editor — top bar,
 * canvas, panel, rail, at the same geometry (`R`) — so a reader who has seen one has seen the layout
 * of all of them. The four spotlight steps (`TourArt`) each light one region; the dock's story
 * (`TourStory`) walks the same editor through building a page. Two unrelated illustrations would ask
 * the reader to learn the layout twice.
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

/* ═════════════════════════════════════ THE DOCK'S STORY ═════════════════════════════════════════
 *
 * ⚠️ FRAMES ARE DATA, the picture is one renderer. Each frame is a STATE of the editor — where the
 * card is, whether it is selected, which toolbar button is lit, which popup is open — and CSS
 * transitions carry the motion from one state to the next. Writing each scene as its own keyframe
 * animation would be thirteen animations to keep in step; this is thirteen rows of a table.
 *
 * ⚠️ IT STARTS FROM A BLANK PAGE, on purpose. The default page is already full, so a widget dropped
 * onto it is one more card among a dozen and the eye cannot find what just happened. On an empty
 * canvas the one widget IS the page, and every action after it is unmistakably about that widget.
 *
 * ⚠️ Every toolbar action shown is one the product really has, in the order the bar really has them:
 * add a column beside it, drag the shared edge, background colour, shadow — and spacing in the
 * PANEL, not on the bar, because that is where it lives. A tour that invents a gesture teaches
 * somebody to look for a button that is not there. */

export type StoryPanel = 'library' | 'config' | 'spacing';

export interface StoryFrame {
  /** Which chapter chip this frame belongs to. */
  ch: number;
  /** How long it holds, in ms. */
  ms: number;
  /** The narration under the picture. */
  cap: string;
  card?: 'none' | 'ghost' | 'placed';
  /** Where the dragged ghost is, as an offset from its start in the panel. */
  ghost?: [number, number];
  /** The pointer, in the picture's own coordinates. Absent = no pointer drawn. */
  cursor?: [number, number];
  /** Press the pointer — draws the small ring a click leaves. */
  click?: boolean;
  sel?: boolean;
  bar?: boolean;
  /** The lit toolbar button, by index. */
  barLit?: number;
  pop?: 'colour' | 'shadow';
  adders?: boolean;
  /** A second column shares the row. */
  split?: boolean;
  /** The first card's width while split — the shared edge being dragged. */
  w?: number;
  handles?: boolean;
  fill?: string;
  shadow?: boolean;
  pad?: boolean;
  panel?: StoryPanel;
  /** The seam under the section, with its "+ Add section" pill. */
  seam?: boolean;
  /** A second section below the first. */
  section2?: boolean;
  publish?: boolean;
}

export const STORY_CHAPTERS = ['Add', 'Select', 'Arrange', 'Style', 'Publish'] as const;

/* Where the placed widget lives, and how wide it is alone and when sharing the row. */
const CARD = { x: 22, y: 60, h: 46, full: 172, split: 104 };
const GHOST_START: [number, number] = [214, 66];

const STORY_AT_REST: StoryFrame[] = [
  /* ── Add ─────────────────────────────────────────────────────────────────────────────── */
  { ch: 0, ms: 1600, cap: 'Start from a blank page.', card: 'none', panel: 'library', cursor: [232, 72] },
  { ch: 0, ms: 1500, cap: 'Drag a widget in from the library…', card: 'ghost', ghost: [0, 0], panel: 'library', cursor: [232, 72], click: true },
  { ch: 0, ms: 1700, cap: 'Drag a widget in from the library…', card: 'ghost', ghost: [-150, 10], panel: 'library', cursor: [82, 82] },
  { ch: 0, ms: 1700, cap: '…and drop it on the page.', card: 'placed', panel: 'library', cursor: [82, 82] },

  /* ── Select ──────────────────────────────────────────────────────────────────────────── */
  { ch: 1, ms: 1500, cap: 'Click it to select it.', card: 'placed', sel: true, panel: 'library', cursor: [70, 86], click: true },
  { ch: 1, ms: 2400, cap: 'A toolbar appears, and the panel becomes its settings.', card: 'placed', sel: true, bar: true, panel: 'config' },

  /* ── Arrange ─────────────────────────────────────────────────────────────────────────── */
  { ch: 2, ms: 1900, cap: 'Add a column beside it, or a row below.', card: 'placed', sel: true, bar: true, adders: true, panel: 'config', cursor: [196, 84] },
  { ch: 2, ms: 1600, cap: 'Add a column beside it, or a row below.', card: 'placed', sel: true, bar: true, split: true, w: CARD.split, panel: 'config', cursor: [196, 84], click: true },
  { ch: 2, ms: 2200, cap: 'Drag the edge to resize — the neighbour gives way.', card: 'placed', sel: true, bar: true, split: true, w: CARD.split, handles: true, panel: 'config', cursor: [127, 84] },
  { ch: 2, ms: 1900, cap: 'Drag the edge to resize — the neighbour gives way.', card: 'placed', sel: true, bar: true, split: true, w: 128, handles: true, panel: 'config', cursor: [151, 84] },

  /* ── Style ───────────────────────────────────────────────────────────────────────────── */
  { ch: 3, ms: 2400, cap: 'Pick a background from the colour picker.', card: 'placed', sel: true, bar: true, split: true, w: 128, barLit: 4, pop: 'colour', panel: 'config' },
  { ch: 3, ms: 1800, cap: 'Pick a background from the colour picker.', card: 'placed', sel: true, bar: true, split: true, w: 128, barLit: 4, pop: 'colour', fill: '#EAF3FB', panel: 'config' },
  { ch: 3, ms: 2400, cap: 'Give it a shadow.', card: 'placed', sel: true, bar: true, split: true, w: 128, barLit: 5, pop: 'shadow', fill: '#EAF3FB', shadow: true, panel: 'config' },
  { ch: 3, ms: 2600, cap: 'Set padding and margin in the panel’s Spacing.', card: 'placed', sel: true, bar: true, split: true, w: 128, fill: '#EAF3FB', shadow: true, pad: true, panel: 'spacing' },

  /* ── Publish ─────────────────────────────────────────────────────────────────────────── */
  { ch: 4, ms: 1900, cap: 'Add a section for the next row of the page.', card: 'placed', split: true, w: 128, fill: '#EAF3FB', shadow: true, pad: true, seam: true, panel: 'library', cursor: [108, 116] },
  { ch: 4, ms: 1700, cap: 'Add a section for the next row of the page.', card: 'placed', split: true, w: 128, fill: '#EAF3FB', shadow: true, pad: true, section2: true, panel: 'library' },
  { ch: 4, ms: 2600, cap: 'Publish when it’s ready — requesters see it straight away.', card: 'placed', split: true, w: 128, fill: '#EAF3FB', shadow: true, pad: true, section2: true, publish: true, panel: 'library', cursor: [261, 19], click: true },
];

/* ⚠️ ONE PACE for the whole story (28 Sep 2026, Zeni: "too slow, I got frustrated watching it").
   The frames above are written at a readable-but-slow rest pace; the story plays them at PACE of that,
   so the rhythm between scenes is kept and the whole thing is sped up by changing one number rather
   than seventeen. The glides below (`GLIDE`, `T`) are cut by the same factor so a move still finishes
   inside the frame that makes it. */
const PACE = 0.55;
export const STORY: StoryFrame[] = STORY_AT_REST.map((f) => ({ ...f, ms: Math.round(f.ms * PACE) }));

export const chapterStart = (ch: number) => STORY.findIndex((f) => f.ch === ch);
export const chapterMs = (ch: number) => STORY.filter((f) => f.ch === ch).reduce((s, f) => s + f.ms, 0);

const T = 'all 340ms cubic-bezier(0.4,0,0.2,1)';
/** How long the ghost and the pointer take to travel — shorter than the shortest frame that moves them. */
const GLIDE = 'transform 700ms cubic-bezier(0.4,0,0.2,1)';

function StoryPanelBody({ kind }: { kind: StoryPanel }) {
  if (kind === 'library') {
    return (
      <>
        <rect x="214" y="38" width="22" height="4" rx="2" fill={INK} opacity="0.7" />
        {[48, 62, 76, 90, 104].map((y, i) => (
          <g key={y}>
            <rect x="214" y={y} width="36" height="11" rx="2.5" fill="#F5F7FA" />
            <rect x="217" y={y + 2.5} width="6" height="6" rx="1.5" fill={i === 1 ? ACCENT : INK} opacity={i === 1 ? 0.9 : 0.55} />
            <rect x="227" y={y + 4} width={i % 2 ? 14 : 19} height="3" rx="1.5" fill={INK} opacity="0.7" />
          </g>
        ))}
      </>
    );
  }
  if (kind === 'config') {
    return (
      <>
        <rect x="214" y="38" width="26" height="4" rx="2" fill="#364658" opacity="0.7" />
        {[50, 70, 90].map((y) => (
          <g key={y}>
            <rect x="214" y={y} width="16" height="3" rx="1.5" fill={INK} />
            <rect x="214" y={y + 6} width="36" height="9" rx="2" fill="none" stroke="#DFE5ED" strokeWidth="0.75" />
          </g>
        ))}
      </>
    );
  }
  /* spacing: the Spacing section's two rings, the field row lit and changing */
  return (
    <>
      <rect x="214" y="38" width="22" height="4" rx="2" fill="#364658" opacity="0.7" />
      <rect x="213" y="48" width="38" height="46" rx="3" fill="#EEF5FC" stroke={ACCENT} strokeWidth="0.75" />
      <rect x="216" y="52" width="14" height="3" rx="1.5" fill={ACCENT} opacity="0.8" />
      {/* margin ring outside, padding ring inside, the element in the middle */}
      <rect x="218" y="59" width="28" height="30" rx="2" fill="none" stroke={MUTE} strokeWidth="0.6" strokeDasharray="1.5 1.2" />
      <rect x="222" y="64" width="20" height="20" rx="1.5" fill="#FFF" stroke={ACCENT} strokeWidth="0.75" className="pt-pulse" />
      <rect x="227" y="70" width="10" height="8" rx="1" fill={INK} />
      <rect x="214" y="100" width="17" height="8" rx="2" fill="#FFF" stroke="#DFE5ED" strokeWidth="0.6" />
      <rect x="233" y="100" width="17" height="8" rx="2" fill="#FFF" stroke="#DFE5ED" strokeWidth="0.6" />
    </>
  );
}

export function TourStory({ frame }: { frame: StoryFrame }) {
  const f = frame;
  const w = f.split ? (f.w ?? CARD.split) : CARD.full;
  const sibX = CARD.x + w + 4;
  const sibW = CARD.x + CARD.full - sibX;
  const barX = CARD.x + 4;
  const barY = CARD.y - 18;

  return (
    <svg viewBox="0 0 288 160" className="h-full w-full" role="img" aria-hidden="true">
      <Chrome panel={<StoryPanelBody kind={f.panel ?? 'library'} />}>
        <defs>
          <filter id="pt-story-shadow" x="-20%" y="-20%" width="140%" height="160%">
            <feDropShadow dx="0" dy="2.5" stdDeviation="2.5" floodColor="#101828" floodOpacity="0.18" />
          </filter>
        </defs>

        {/* ── the blank page ─────────────────────────────────────────────────────────────
            ⚠️ Only while nothing is on it. An empty-state invitation drawn under a placed card
            would be the page contradicting itself. */}
        {f.card === 'none' && (
          <g className="pt-fade">
            <rect x="46" y="66" width="124" height="34" rx="4" fill="none" stroke={INK} strokeWidth="1" strokeDasharray="3 2.5" />
            <rect x="93" y="76" width="30" height="4" rx="2" fill={INK} />
            <rect x="85" y="85" width="46" height="3" rx="1.5" fill={INK_SOFT} />
          </g>
        )}

        {/* ── the placed widget, and the column that joins it ──────────────────────────── */}
        {f.card === 'placed' && (
          <g className="pt-fade" filter={f.shadow ? 'url(#pt-story-shadow)' : undefined}>
            <WidgetCard x={CARD.x} y={CARD.y} w={w} h={CARD.h} fill={f.fill ?? PAPER} pad={f.pad ? 4 : 0} />
          </g>
        )}
        {f.card === 'placed' && f.split && (
          <g className="pt-fade">
            <rect x={sibX} y={CARD.y} width={sibW} height={CARD.h} rx="3" fill="none" stroke={INK} strokeWidth="1" strokeDasharray="3 2.5" style={{ transition: T }} />
            <text x={sibX + sibW / 2} y={CARD.y + CARD.h / 2 + 3} textAnchor="middle" fontSize="9" fill={MUTE} style={{ transition: T }}>+</text>
          </g>
        )}

        {/* ── selection: the outline, and the handles once there is an edge to drag ──────── */}
        {f.sel && (
          <rect x={CARD.x - 1.5} y={CARD.y - 1.5} width={w + 3} height={CARD.h + 3} rx="4" fill="none" stroke={ACCENT} strokeWidth="1.5" style={{ transition: T }} />
        )}
        {f.handles && (
          <g>
            {[[CARD.x, CARD.y], [CARD.x + w, CARD.y], [CARD.x, CARD.y + CARD.h], [CARD.x + w, CARD.y + CARD.h]].map(([x, y], i) => (
              <rect key={i} x={x - 2.5} y={y - 2.5} width="5" height="5" rx="1" fill={PAPER} stroke={ACCENT} strokeWidth="1" style={{ transition: T }} />
            ))}
            {/* the edge actually being dragged, lit */}
            <rect x={CARD.x + w - 2} y={CARD.y + CARD.h / 2 - 6} width="4" height="12" rx="2" fill={ACCENT} className="pt-pulse" style={{ transition: T }} />
          </g>
        )}

        {/* ── the + adders ─────────────────────────────────────────────────────────────── */}
        {f.adders && (
          <g className="pt-fade">
            {[[CARD.x + CARD.full + 4, CARD.y + CARD.h / 2, true], [CARD.x - 4, CARD.y + CARD.h / 2, false], [CARD.x + CARD.full / 2, CARD.y + CARD.h + 5, false]].map(([cx, cy, hot], i) => (
              <g key={i}>
                <circle cx={cx as number} cy={cy as number} r="5" fill={hot ? ACCENT : PAPER} stroke={ACCENT} strokeWidth="1" className={hot ? 'pt-pulse' : undefined} />
                <path d={`M${(cx as number) - 2.5} ${cy} h5 M${cx} ${(cy as number) - 2.5} v5`} stroke={hot ? PAPER : ACCENT} strokeWidth="1.2" strokeLinecap="round" />
              </g>
            ))}
          </g>
        )}

        {/* ── the floating toolbar ─────────────────────────────────────────────────────────
            Seven glyphs, grouped the way the real bar groups them: move · place · style · remove. */}
        {f.bar && (
          <g className="pt-fade">
            <rect x={barX} y={barY} width="90" height="13" rx="3" fill={PAPER} stroke="#E5E7EB" strokeWidth="0.75" filter="url(#pt-story-shadow)" />
            {[0, 1, 2, 3, 4, 5, 6].map((i) => {
              const cx = barX + 9 + i * 12;
              const on = f.barLit === i;
              return (
                <g key={i}>
                  {on && <rect x={cx - 5} y={barY + 1.5} width="10" height="10" rx="2" fill="#EAF3FB" />}
                  <circle cx={cx} cy={barY + 6.5} r="2.2" fill={on ? ACCENT : i === 6 ? '#EF4444' : MUTE} />
                </g>
              );
            })}
          </g>
        )}

        {/* ── the colour picker, opened off its button ───────────────────────────────────── */}
        {f.pop === 'colour' && f.barLit !== undefined && (
          <g className="pt-fade">
            <rect x={barX + 9 + f.barLit * 12 - 20} y={barY + 16} width="42" height="36" rx="3" fill={PAPER} stroke="#E5E7EB" strokeWidth="0.75" filter="url(#pt-story-shadow)" />
            {/* the spectrum */}
            <rect x={barX + 9 + f.barLit * 12 - 17} y={barY + 19} width="36" height="16" rx="2" fill="url(#pt-spectrum)" />
            <defs>
              <linearGradient id="pt-spectrum" x1="0" x2="1">
                <stop offset="0" stopColor="#EF4444" /><stop offset="0.35" stopColor="#F59E0B" />
                <stop offset="0.6" stopColor="#10B981" /><stop offset="1" stopColor={ACCENT} />
              </linearGradient>
            </defs>
            {['#EAF3FB', '#FEF3C7', '#DCFCE7', '#FCE7F3', '#F1F5F9'].map((c, i) => (
              <rect key={c} x={barX + 9 + f.barLit! * 12 - 17 + i * 7.4} y={barY + 38} width="6" height="6" rx="1.5" fill={c} stroke={i === 0 && f.fill ? ACCENT : '#E2E8F0'} strokeWidth={i === 0 && f.fill ? 1.2 : 0.5} />
            ))}
          </g>
        )}

        {/* ── the shadow presets ─────────────────────────────────────────────────────────── */}
        {f.pop === 'shadow' && f.barLit !== undefined && (
          <g className="pt-fade">
            <rect x={barX + 9 + f.barLit * 12 - 24} y={barY + 16} width="50" height="20" rx="3" fill={PAPER} stroke="#E5E7EB" strokeWidth="0.75" filter="url(#pt-story-shadow)" />
            {[0, 1, 2, 3].map((i) => (
              <rect
                key={i}
                x={barX + 9 + f.barLit! * 12 - 21 + i * 11.5} y={barY + 19} width="9.5" height="14" rx="1.5"
                fill={i === 2 ? '#EAF3FB' : '#F8FAFC'} stroke={i === 2 ? ACCENT : '#E2E8F0'} strokeWidth={i === 2 ? 1 : 0.5}
              />
            ))}
          </g>
        )}

        {/* ── Add section: the seam, then the new section below ────────────────────────── */}
        {f.seam && (
          <g className="pt-fade">
            <line x1="16" x2="200" y1="116" y2="116" stroke={ACCENT} strokeWidth="1.2" />
            <rect x="84" y="110" width="48" height="12" rx="6" fill={ACCENT} className="pt-pulse" />
            <path d="M92 116 h4 M94 114 v4" stroke={PAPER} strokeWidth="1" strokeLinecap="round" />
            <rect x="100" y="114.5" width="26" height="3" rx="1.5" fill={PAPER} opacity="0.9" />
          </g>
        )}
        {f.section2 && (
          <g className="pt-fade">
            <rect x="22" y="116" width="172" height="28" rx="3" fill="none" stroke={INK} strokeWidth="1" strokeDasharray="3 2.5" />
            <text x="108" y="133" textAnchor="middle" fontSize="9" fill={MUTE}>+</text>
          </g>
        )}

        {/* ── the top bar's right end: light/dark, Preview, Publish ─────────────────────── */}
        <rect x="196" y="14" width="20" height="10" rx="5" fill="#E2E8F0" />
        <circle cx="201" cy="19" r="3.5" fill={PAPER} />
        <rect x="222" y="14" width="24" height="10" rx="2.5" fill="none" stroke="#DFE5ED" strokeWidth="1" />
        <rect x="250" y="14" width="22" height="10" rx="2.5" fill={ACCENT} opacity={f.publish ? 1 : 0.35} className={f.publish ? 'pt-pulse' : undefined} />
        {f.publish && (
          <g className="pt-fade">
            <circle cx="261" cy="38" r="7" fill="#16A34A" />
            <path d="M257.5 38 l2.3 2.3 l4.2 -4.6" stroke={PAPER} strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        )}

        {/* ── the dragged ghost: it only ever TRANSLATES, so it never draws stretched ─────── */}
        {f.card === 'ghost' && (
          <g style={{ transform: `translate(${f.ghost?.[0] ?? 0}px, ${f.ghost?.[1] ?? 0}px)`, transition: GLIDE }}>
            <rect x={GHOST_START[0]} y={GHOST_START[1]} width="36" height="11" rx="2.5" fill={PAPER} stroke={ACCENT} strokeWidth="1" filter="url(#pt-story-shadow)" />
            <rect x={GHOST_START[0] + 3} y={GHOST_START[1] + 2.5} width="6" height="6" rx="1.5" fill={ACCENT} />
            <rect x={GHOST_START[0] + 13} y={GHOST_START[1] + 4} width="16" height="3" rx="1.5" fill={INK} />
          </g>
        )}

        {/* ── the pointer, last, so it sits over everything it is doing ──────────────────── */}
        {f.cursor && (
          <g style={{ transform: `translate(${f.cursor[0]}px, ${f.cursor[1]}px)`, transition: GLIDE }}>
            {f.click && <circle cx="0" cy="0" r="6" fill="none" stroke={ACCENT} strokeWidth="1" className="pt-click" />}
            <path d="M0 0 L0 11 L3 8.2 L5.2 12.8 L7 12 L4.9 7.6 L9 7.4 Z" fill="#0F172A" stroke={PAPER} strokeWidth="0.9" strokeLinejoin="round" />
          </g>
        )}
      </Chrome>
    </svg>
  );
}
