/**
 * The dock's video — the editor told as ONE story on illustrated scenes (29 Sep 2026, Zeni's script).
 *
 * The story: an EMPTY section · drag **Action Card** in from the sidebar → the four action cards land ·
 * select the parent SECTION (its floating toolbar + the sidebar swaps to the section's settings, Layout
 * open and the rest collapsed) · colour it from the toolbar's colour picker · select ONE card (its own
 * toolbar + the sidebar swaps again, Card templates and Alignment) and run its actions quickly — Card
 * templates, Alignment, Move · stretch the section by its side handle · Publish.
 *
 * ⚠️ THE SIDEBAR IS ALWAYS THERE, as it is in the editor: it starts on the Widgets list and REPLACES its
 * content with whatever is selected — one group expanded, the others collapsed.
 *
 * ⚠️ ONE SCENE COMPONENT for the whole editor part of the story (chapters 0–4), so React never remounts
 * it between chapters and every move — the ghost, the cursor, a card changing shape or swapping places,
 * the section stretching — is a CSS transition between two states. Publish is its own picture.
 *
 * ⚠️ The toolbar glyphs are drawn after the REAL lucide icons the bar uses (grip, …ToLine arrows,
 * LayoutGrid, LayoutTemplate, AlignStartVertical, PaintBucket, Trash), in the bar's real groups — a tour
 * that shows a button the editor does not have teaches somebody to look for it.
 *
 * ⚠️ FRAMES ARE DATA: a frame is a state, and CSS transitions carry the motion. Every colour is written
 * out and every class is literal.
 */

const BLUE = '#3D8BD0';
const INK = '#1E293B';
const MUTED = '#64748B';
const LINE = '#E5E7EB';
const PAPER = '#FFFFFF';
const YOU = '#7C3AED';
const FONT = 'Inter, system-ui, -apple-system, sans-serif';

/** One slide of the carousel: its name (for "Next: …"), its words, and the colour of its ground. */
export interface TourChapter { name: string; title: string; desc: string; ground: string; blob: string }

export const TOUR_CHAPTERS: TourChapter[] = [
  { name: 'Add', title: 'Start with a widget',
    desc: 'Drag a widget from the sidebar into a section — Action Card brings its four cards with it.',
    ground: '#EEF2FF', blob: '#E0E7FF' },
  { name: 'Section', title: 'Select the section',
    desc: 'Its toolbar appears, and the sidebar becomes the section’s settings — Layout open, the rest folded.',
    ground: '#ECFDF5', blob: '#D1FAE5' },
  { name: 'Colour', title: 'Colour it from the toolbar',
    desc: 'The paint bucket opens the colour picker — pick a swatch or drag the spectrum.',
    ground: '#FDF2F8', blob: '#FCE7F3' },
  { name: 'Card', title: 'Then shape one card',
    desc: 'Select a card for its own toolbar: change its template, align it, move it along the row.',
    ground: '#FFF7ED', blob: '#FFEDD5' },
  { name: 'Stretch', title: 'Stretch the section',
    desc: 'Drag a side handle — the cards reflow to the new width.',
    ground: '#FEFCE8', blob: '#FEF9C3' },
  { name: 'Publish', title: 'Preview, then publish',
    desc: 'Check it as a requester sees it, in light and in dark, then publish when it’s ready.',
    ground: '#EFF6FF', blob: '#DBEAFE' },
];

export interface SceneFrame {
  ch: number;
  ms: number;
  /** The pointer, in the scene's 320×180 space. */
  cur?: [number, number];
  /** A press — the ring a click leaves under the pointer. */
  press?: boolean;
  /** The Action Card row lifted out of the sidebar, and where it is on its way. */
  ghost?: 'lift' | 'fly';
  /** The four cards are on the page. */
  placed?: boolean;
  /** What the sidebar is showing. */
  panel?: 'widgets' | 'section' | 'card';
  selSec?: boolean;
  selCard?: boolean;
  /** Which floating toolbar is up. */
  bar?: 'section' | 'card';
  /** The toolbar button being pressed. */
  lit?: Glyph;
  /** A popup open off the toolbar. */
  pop?: 'colour' | 'templates' | 'align';
  /** The section's new background. */
  tint?: boolean;
  /** New Incident's template and alignment. */
  tpl?: 'left' | 'top';
  align?: 'left' | 'center' | 'right';
  /** New Incident has moved one place right. */
  swapped?: boolean;
  /** The section's width while it is stretched. */
  sw?: number;
  // Publish
  pressed?: boolean;
  published?: boolean;
}

/* The page's geometry — one place, so every frame agrees about where the section and its cards are. */
const SEC_X = 22;
const SEC_Y = 50;
const SEC_W = 178;
const SEC_H = 68;
const CARD_H = 28;
const GAP = 5;
const cardW = (sw: number) => (sw - 8 - GAP) / 2;
/** Where card slot `i` (0–3, two to a row) sits for a section `sw` wide. */
const slot = (i: number, sw: number): [number, number] => [SEC_X + 4 + (i % 2) * (cardW(sw) + GAP), SEC_Y + 4 + Math.floor(i / 2) * (CARD_H + 4)];

/* Toolbars: glyph POSITIONS computed from the bar's real groups, so the cursor can aim at a button's
   centre (aimed between glyphs, "You" looks like it missed). */
type Glyph = 'grip' | 'right' | 'down' | 'layout' | 'templates' | 'align' | 'alignC' | 'alignR' | 'bucket' | 'trash';
const SECTION_BAR: Glyph[][] = [['grip'], ['down', 'layout'], ['bucket'], ['trash']];
const CARD_BAR: Glyph[][] = [['grip'], ['right'], ['templates', 'align'], ['bucket'], ['trash']];
function barLayout(groups: Glyph[][]) {
  const at: Partial<Record<Glyph, number>> = {};
  const rules: number[] = [];
  let x = 4;
  groups.forEach((g, gi) => {
    if (gi) { rules.push(x + 3); x += 6; }
    g.forEach((k) => { at[k] = x + 5.5; x += 11; });
  });
  return { at, rules, w: x + 4 };
}
const SB = barLayout(SECTION_BAR);
const CB = barLayout(CARD_BAR);
const BAR_Y = 36;
/** A toolbar button's centre, for the cursor. */
const secBtn = (k: Glyph): [number, number] => [SEC_X + (SB.at[k] ?? 0), BAR_Y + 7];
const cardBtn = (cx: number, k: Glyph): [number, number] => [cx + (CB.at[k] ?? 0), BAR_Y + 7];

const [C0X] = slot(0, SEC_W);
const [C1X] = slot(1, SEC_W);

/* ⚠️ Written at the pace it should PLAY. */
export const SCENE_FRAMES: SceneFrame[] = [
  /* Add — the sidebar is the Widgets list; Action Card is dragged into the empty section */
  { ch: 0, ms: 800, cur: [258, 53], panel: 'widgets' },
  { ch: 0, ms: 600, cur: [258, 53], panel: 'widgets', ghost: 'lift', press: true },
  { ch: 0, ms: 900, cur: [110, 84], panel: 'widgets', ghost: 'fly' },
  { ch: 0, ms: 1500, cur: [110, 84], panel: 'widgets', placed: true },
  /* Section — select the parent row */
  { ch: 1, ms: 700, cur: [111, 52], panel: 'widgets', placed: true },
  { ch: 1, ms: 600, cur: [111, 52], panel: 'section', placed: true, selSec: true, press: true },
  { ch: 1, ms: 1700, cur: [111, 52], panel: 'section', placed: true, selSec: true, bar: 'section' },
  /* Colour — the paint bucket opens the colour picker */
  { ch: 2, ms: 800, cur: secBtn('bucket'), panel: 'section', placed: true, selSec: true, bar: 'section', lit: 'bucket', pop: 'colour', press: true },
  { ch: 2, ms: 900, cur: [76, 97], panel: 'section', placed: true, selSec: true, bar: 'section', lit: 'bucket', pop: 'colour', tint: true, press: true },
  { ch: 2, ms: 900, cur: [76, 97], panel: 'section', placed: true, selSec: true, bar: 'section', tint: true },
  /* Card — select New Incident, then its template, its alignment, and move it */
  { ch: 3, ms: 600, cur: [48, 66], panel: 'section', placed: true, tint: true },
  { ch: 3, ms: 900, cur: [48, 66], panel: 'card', placed: true, tint: true, selCard: true, bar: 'card', press: true },
  { ch: 3, ms: 800, cur: cardBtn(C0X, 'templates'), panel: 'card', placed: true, tint: true, selCard: true, bar: 'card', lit: 'templates', pop: 'templates', press: true },
  { ch: 3, ms: 900, cur: [C0X + 56.5, 63], panel: 'card', placed: true, tint: true, selCard: true, bar: 'card', lit: 'templates', pop: 'templates', tpl: 'top', press: true },
  { ch: 3, ms: 800, cur: cardBtn(C0X, 'align'), panel: 'card', placed: true, tint: true, selCard: true, bar: 'card', lit: 'align', pop: 'align', tpl: 'top', press: true },
  { ch: 3, ms: 900, cur: [C0X + 76, 62], panel: 'card', placed: true, tint: true, selCard: true, bar: 'card', lit: 'align', pop: 'align', tpl: 'top', align: 'right', press: true },
  { ch: 3, ms: 800, cur: cardBtn(C0X, 'right'), panel: 'card', placed: true, tint: true, selCard: true, bar: 'card', lit: 'right', tpl: 'top', align: 'right', press: true },
  { ch: 3, ms: 1300, cur: cardBtn(C1X, 'right'), panel: 'card', placed: true, tint: true, selCard: true, bar: 'card', tpl: 'top', align: 'right', swapped: true },
  /* Stretch — the section's side handle */
  { ch: 4, ms: 700, cur: [SEC_X + SEC_W, SEC_Y + SEC_H / 2], panel: 'section', placed: true, tint: true, selSec: true, tpl: 'top', align: 'right', swapped: true, press: true },
  { ch: 4, ms: 1300, cur: [SEC_X + 152, SEC_Y + SEC_H / 2], panel: 'section', placed: true, tint: true, selSec: true, tpl: 'top', align: 'right', swapped: true, sw: 152 },
  { ch: 4, ms: 1000, cur: [SEC_X + SEC_W, SEC_Y + SEC_H / 2], panel: 'section', placed: true, tint: true, selSec: true, tpl: 'top', align: 'right', swapped: true },
  /* Publish */
  { ch: 5, ms: 900, cur: [276, 31] },
  { ch: 5, ms: 500, cur: [276, 31], pressed: true, press: true },
  { ch: 5, ms: 1800, cur: [276, 31], published: true },
];

export const sceneStart = (ch: number) => SCENE_FRAMES.findIndex((f) => f.ch === ch);
export const sceneEnd = (ch: number) => {
  let last = -1;
  SCENE_FRAMES.forEach((f, i) => { if (f.ch === ch) last = i; });
  return last;
};

const T = 'all 360ms cubic-bezier(0.4,0,0.2,1)';
const GLIDE = 'transform 640ms cubic-bezier(0.4,0,0.2,1)';

/* ── pieces every scene draws from ─────────────────────────────────────────────────────────────── */

function Defs() {
  return (
    <defs>
      <filter id="ts-card" x="-10%" y="-10%" width="120%" height="140%">
        <feDropShadow dx="0" dy="2" stdDeviation="2.6" floodColor="#101828" floodOpacity="0.10" />
      </filter>
      <filter id="ts-lift" x="-20%" y="-20%" width="140%" height="170%">
        <feDropShadow dx="0" dy="5" stdDeviation="5" floodColor="#101828" floodOpacity="0.22" />
      </filter>
      <linearGradient id="ts-banner" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0" stopColor="#2F6FB0" /><stop offset="1" stopColor="#0B2545" />
      </linearGradient>
      <linearGradient id="ts-spectrum" x1="0" x2="1">
        <stop offset="0" stopColor="#EF4444" /><stop offset="0.35" stopColor="#F59E0B" />
        <stop offset="0.65" stopColor="#10B981" /><stop offset="1" stopColor={BLUE} />
      </linearGradient>
    </defs>
  );
}

/** The chapter's ground, with two soft blobs so it reads as a place rather than a flat fill. */
function Ground({ c }: { c: TourChapter }) {
  return (
    <>
      <rect x="0" y="0" width="320" height="180" fill={c.ground} style={{ transition: T }} />
      <circle cx="292" cy="10" r="64" fill={c.blob} style={{ transition: T }} />
      <circle cx="18" cy="176" r="46" fill={c.blob} style={{ transition: T }} />
    </>
  );
}

const Txt = ({ x, y, s = 7, w = 400, c = INK, children, anchor }: {
  x: number; y: number; s?: number; w?: number; c?: string; children: string; anchor?: 'start' | 'middle' | 'end';
}) => (
  <text x={x} y={y} fontSize={s} fontWeight={w} fill={c} fontFamily={FONT} textAnchor={anchor}>{children}</text>
);

function Cursor({ at, press }: { at?: [number, number]; press?: boolean }) {
  if (!at) return null;
  return (
    <g style={{ transform: `translate(${at[0]}px, ${at[1]}px)`, transition: GLIDE }}>
      {press && <circle cx="0" cy="0" r="6" fill="none" stroke={YOU} strokeWidth="1.2" className="pt-click" />}
      <path d="M0 0 L0 12 L3.3 9 L5.7 14 L7.6 13.1 L5.3 8.3 L9.8 8 Z" fill={YOU} stroke={PAPER} strokeWidth="1" strokeLinejoin="round" />
      {/* the name tag — what turns a pointer into somebody doing something */}
      <rect x="9" y="12" width="20" height="10" rx="5" fill={YOU} />
      <Txt x={19} y={19.2} s={6} w={600} c={PAPER} anchor="middle">You</Txt>
    </g>
  );
}

/** The page the scenes build on: a white card with a thin title strip. */
function Page({ x = 14, y = 22, w = 194, h = 138 }: { x?: number; y?: number; w?: number; h?: number }) {
  return (
    <g filter="url(#ts-card)">
      <rect x={x} y={y} width={w} height={h} rx="8" fill={PAPER} />
      <rect x={x} y={y} width={w} height="14" rx="8" fill="#F8FAFC" />
      <rect x={x} y={y + 8} width={w} height="6" fill="#F8FAFC" />
      {[0, 1, 2].map((i) => <circle key={i} cx={x + 8 + i * 6} cy={y + 7} r="1.8" fill={['#FCA5A5', '#FCD34D', '#86EFAC'][i]} />)}
      <Txt x={x + w / 2} y={y + 9.4} s={5.6} w={500} c={MUTED} anchor="middle">Support Portal</Txt>
    </g>
  );
}

/* ── the action cards ─────────────────────────────────────────────────────────────────────────── */

const CARDS: { name: string; sub: string; c: string }[] = [
  { name: 'New Incident', sub: 'Report an issue', c: '#EF4444' },
  { name: 'Request Service', sub: 'Browse services', c: BLUE },
  { name: 'AD Self Service', sub: 'Reset password', c: '#F59E0B' },
  { name: 'Knowledge', sub: 'Browse articles', c: '#10B981' },
];

/** One action card — icon LEFT, or icon TOP aligned left / centre / right, as the card's template says. */
function ActionCard({ x, y, w, card, tpl = 'left', align = 'left' }: {
  x: number; y: number; w: number; card: typeof CARDS[number]; tpl?: 'left' | 'top'; align?: 'left' | 'center' | 'right';
}) {
  const top = tpl === 'top';
  const ax = align === 'right' ? x + w - 5 : align === 'center' ? x + w / 2 : x + 5;
  const anchor = align === 'right' ? 'end' : align === 'center' ? 'middle' : 'start';
  const badgeX = top ? (align === 'right' ? ax - 9 : align === 'center' ? ax - 4.5 : ax) : x + 5;
  const badgeY = top ? y + 3.5 : y + 8;
  const badge = top ? 9 : 12;
  return (
    <g>
      <rect x={x} y={y} width={w} height={CARD_H} rx="4" fill={PAPER} stroke={LINE} strokeWidth="0.7" style={{ transition: T }} />
      <g style={{ transition: T }}>
        <rect x={badgeX} y={badgeY} width={badge} height={badge} rx="2.5" fill={card.c} opacity="0.14" style={{ transition: T }} />
        <rect x={badgeX + badge / 2 - 2.2} y={badgeY + badge / 2 - 2.2} width="4.4" height="4.4" rx="1.1" fill={card.c} style={{ transition: T }} />
      </g>
      {top ? (
        <>
          <Txt x={ax} y={y + 19} s={5} w={600} anchor={anchor}>{card.name}</Txt>
          <Txt x={ax} y={y + 25} s={3.8} c={MUTED} anchor={anchor}>{card.sub}</Txt>
        </>
      ) : (
        <>
          <Txt x={x + 21} y={y + 12.6} s={5.4} w={600}>{card.name}</Txt>
          <Txt x={x + 21} y={y + 19.6} s={4.2} c={MUTED}>{card.sub}</Txt>
        </>
      )}
    </g>
  );
}

/* ── the floating toolbar, after the real icons ───────────────────────────────────────────────── */

function glyph(k: Glyph, cx: number, cy: number, c: string) {
  const s = { stroke: c, strokeWidth: 0.9, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  switch (k) {
    case 'grip': return <g>{[[-1.6, -2.2], [1.6, -2.2], [-1.6, 0], [1.6, 0], [-1.6, 2.2], [1.6, 2.2]].map(([dx, dy], i) => <circle key={i} cx={cx + dx} cy={cy + dy} r="0.7" fill={c} />)}</g>;
    /* ArrowRightToLine */
    case 'right': return <g><path d={`M${cx - 3} ${cy} h4.6 M${cx - 0.2} ${cy - 2.2} l2.2 2.2 l-2.2 2.2`} {...s} /><path d={`M${cx + 3.2} ${cy - 3} v6`} {...s} /></g>;
    /* ArrowDownToLine */
    case 'down': return <g><path d={`M${cx} ${cy - 3} v4.6 M${cx - 2.2} ${cy - 0.2} l2.2 2.2 l2.2 -2.2`} {...s} /><path d={`M${cx - 3} ${cy + 3.2} h6`} {...s} /></g>;
    /* LayoutGrid */
    case 'layout': return <g>{[[-3.1, -3.1], [0.5, -3.1], [-3.1, 0.5], [0.5, 0.5]].map(([dx, dy], i) => <rect key={i} x={cx + dx} y={cy + dy} width="2.6" height="2.6" rx="0.5" {...s} />)}</g>;
    /* LayoutTemplate */
    case 'templates': return <g><rect x={cx - 3.2} y={cy - 3.2} width="6.4" height="2.4" rx="0.5" {...s} /><rect x={cx - 3.2} y={cy + 0.4} width="2.8" height="2.8" rx="0.5" {...s} /><path d={`M${cx + 1} ${cy + 0.9} h2.2 M${cx + 1} ${cy + 2.7} h2.2`} {...s} /></g>;
    /* AlignStartVertical */
    case 'align': return <g><path d={`M${cx - 3.2} ${cy - 3.4} v6.8`} {...s} /><rect x={cx - 1.8} y={cy - 2.6} width="4.8" height="1.9" rx="0.5" {...s} /><rect x={cx - 1.8} y={cy + 0.7} width="3" height="1.9" rx="0.5" {...s} /></g>;
    /* AlignCenterVertical */
    case 'alignC': return <g><path d={`M${cx} ${cy - 3.4} v6.8`} {...s} /><rect x={cx - 2.6} y={cy - 2.6} width="5.2" height="1.9" rx="0.5" {...s} /><rect x={cx - 1.7} y={cy + 0.7} width="3.4" height="1.9" rx="0.5" {...s} /></g>;
    /* AlignEndVertical */
    case 'alignR': return <g><path d={`M${cx + 3.2} ${cy - 3.4} v6.8`} {...s} /><rect x={cx - 3} y={cy - 2.6} width="4.8" height="1.9" rx="0.5" {...s} /><rect x={cx - 1.2} y={cy + 0.7} width="3" height="1.9" rx="0.5" {...s} /></g>;
    /* PaintBucket */
    case 'bucket': return <path d={`M${cx - 2.6} ${cy + 0.4} l2.2 -3 l2.6 2.4 l-2.2 3 z M${cx + 2.6} ${cy + 1.6} q0.6 1.2 0 1.8 q-0.6 -0.6 0 -1.8`} {...s} />;
    /* Trash2 */
    default: return <path d={`M${cx - 2.6} ${cy - 1.8} h5.2 M${cx - 1.9} ${cy - 1.8} l0.4 4.6 h3 l0.4 -4.6 M${cx - 0.9} ${cy - 1.8} v-0.9 h1.8 v0.9`} {...s} stroke="#EF4444" />;
  }
}

function Bar({ x, kind, lit, align }: { x: number; kind: 'section' | 'card'; lit?: Glyph; align?: 'left' | 'center' | 'right' }) {
  /* The alignment button shows the CURRENT alignment, as the real one does. */
  const shown = (k: Glyph): Glyph => (k === 'align' ? (align === 'center' ? 'alignC' : align === 'right' ? 'alignR' : 'align') : k);
  const L = kind === 'section' ? SB : CB;
  const groups = kind === 'section' ? SECTION_BAR : CARD_BAR;
  return (
    <g className="pt-fade" filter="url(#ts-card)" style={{ transform: `translate(${x}px, 0px)`, transition: GLIDE }}>
      <rect x="0" y={BAR_Y} width={L.w} height="14" rx="4" fill={PAPER} stroke={LINE} strokeWidth="0.6" />
      {L.rules.map((rx) => <line key={rx} x1={rx} x2={rx} y1={BAR_Y + 3.5} y2={BAR_Y + 10.5} stroke={LINE} strokeWidth="0.6" />)}
      {groups.flat().map((k) => (
        <g key={k}>
          {lit === k && <rect x={(L.at[k] ?? 0) - 4.6} y={BAR_Y + 2.4} width="9.2" height="9.2" rx="2" fill="#EAF3FB" />}
          {glyph(shown(k), L.at[k] ?? 0, BAR_Y + 7, lit === k ? BLUE : '#64748B')}
        </g>
      ))}
    </g>
  );
}

/* ── the sidebar: always there, its content follows the selection ─────────────────────────────── */

const SIDE_X = 216;
function Chevron({ x, y, open }: { x: number; y: number; open?: boolean }) {
  return <path d={open ? `M${x - 1.8} ${y - 0.8} l1.8 1.8 l1.8 -1.8` : `M${x - 0.8} ${y - 1.8} l1.8 1.8 l-1.8 1.8`} stroke="#9CA3AF" strokeWidth="0.8" fill="none" strokeLinecap="round" />;
}
/** A collapsed accordion row — the look of every folded group in the real panel. */
function Folded({ y, label }: { y: number; label: string }) {
  return (
    <g>
      <line x1={SIDE_X} x2={SIDE_X + 90} y1={y - 7} y2={y - 7} stroke="#EEF2F6" strokeWidth="0.6" />
      <Txt x={SIDE_X + 8} y={y} s={5} w={500}>{label}</Txt>
      <Chevron x={SIDE_X + 82} y={y - 1.6} />
    </g>
  );
}

function Sidebar({ f }: { f: SceneFrame }) {
  const panel = f.panel ?? 'widgets';
  const lib: [string, string][] = [['Action Card', '#EF4444'], ['My Open Requests', BLUE], ['Announcements', '#F59E0B'], ['Knowledge', '#10B981'], ['Contact Us', '#8B5CF6']];
  return (
    <g filter="url(#ts-card)">
      <rect x={SIDE_X} y="22" width="90" height="138" rx="8" fill={PAPER} />
      {panel === 'widgets' && (
        <g key="w" className="pt-fade">
          <Txt x={SIDE_X + 8} y={36} s={7} w={600}>Widgets</Txt>
          {lib.map(([name, c], i) => (
            <g key={name}>
              <rect x={SIDE_X + 5} y={44 + i * 19} width="80" height="16" rx="4" fill={i === 0 && f.ghost ? '#EEF2FF' : '#F8FAFC'} stroke={i === 0 && f.ghost ? BLUE : 'none'} strokeWidth="0.8" />
              <rect x={SIDE_X + 9} y={48 + i * 19} width="8" height="8" rx="2" fill={c} opacity="0.9" />
              <Txt x={SIDE_X + 21} y={54 + i * 19} s={5.2} w={500}>{name}</Txt>
            </g>
          ))}
        </g>
      )}
      {panel === 'section' && (
        <g key="s" className="pt-slide">
          <Txt x={SIDE_X + 8} y={35} s={6.4} w={600}>Quick Actions</Txt>
          <Txt x={SIDE_X + 8} y={42} s={4.4} c={MUTED}>Section</Txt>
          <Txt x={SIDE_X + 8} y={53} s={4} w={600} c="#7B8FA5">DESIGN</Txt>
          {/* Layout — the ONE open group */}
          <Txt x={SIDE_X + 8} y={63} s={5} w={600}>Layout</Txt>
          <Chevron x={SIDE_X + 82} y={61.4} open />
          {[0, 1, 2, 3].map((i) => {
            const on = i === 1;
            const tx = SIDE_X + 8 + i * 19;
            return (
              <g key={i}>
                <rect x={tx} y="67" width="16" height="12" rx="2" fill={on ? '#EAF3FB' : '#F8FAFC'} stroke={on ? BLUE : '#E2E8F0'} strokeWidth={on ? 0.9 : 0.6} />
                {i === 0 && [0, 1, 2, 3].map((k) => <rect key={k} x={tx + 2 + k * 3.1} y="70" width="2.4" height="6" rx="0.5" fill="#CBD5E1" />)}
                {i === 1 && [0, 1, 2, 3].map((k) => <rect key={k} x={tx + 2.5 + (k % 2) * 5.8} y={69.5 + Math.floor(k / 2) * 3.8} width="5" height="3" rx="0.5" fill={on ? '#93C5FD' : '#CBD5E1'} />)}
                {i === 2 && [0, 1, 2].map((k) => <rect key={k} x={tx + 2 + k * 4.2} y="70" width="3.4" height="6" rx="0.5" fill="#CBD5E1" />)}
                {i === 3 && [0, 1, 2].map((k) => <rect key={k} x={tx + 2.5} y={69.5 + k * 2.6} width="11" height="1.8" rx="0.4" fill="#CBD5E1" />)}
              </g>
            );
          })}
          <Folded y={94} label="Background" />
          <Folded y={107} label="Border & corners" />
          <Folded y={120} label="Shadow" />
          <Folded y={133} label="Spacing" />
        </g>
      )}
      {panel === 'card' && (
        <g key="c" className="pt-slide">
          <Txt x={SIDE_X + 8} y={35} s={6.4} w={600}>New Incident</Txt>
          <Txt x={SIDE_X + 8} y={45} s={4} w={600} c="#7B8FA5">CONTENT</Txt>
          <Txt x={SIDE_X + 8} y={52} s={4.4} c={MUTED}>Card templates</Txt>
          {[0, 1, 2, 3].map((i) => {
            const on = (f.tpl === 'top' ? 1 : 0) === i;
            const tx = SIDE_X + 8 + i * 19;
            return (
              <g key={i}>
                <rect x={tx} y="55" width="16" height="12" rx="2" fill={on ? '#EAF3FB' : '#F8FAFC'} stroke={on ? BLUE : '#E2E8F0'} strokeWidth={on ? 0.9 : 0.6} style={{ transition: T }} />
                {i === 0 && <><rect x={tx + 2.5} y="59" width="3.5" height="3.5" rx="0.8" fill="#93C5FD" /><rect x={tx + 7} y="59.5" width="6" height="1.2" rx="0.5" fill="#CBD5E1" /><rect x={tx + 7} y="61.6" width="4" height="1" rx="0.5" fill="#E2E8F0" /></>}
                {i === 1 && <><rect x={tx + 6.2} y="57.5" width="3.5" height="3.5" rx="0.8" fill="#93C5FD" /><rect x={tx + 4.5} y="62.5" width="7" height="1.2" rx="0.5" fill="#CBD5E1" /></>}
                {i === 2 && <><rect x={tx + 10} y="59" width="3.5" height="3.5" rx="0.8" fill="#93C5FD" /><rect x={tx + 2.5} y="59.5" width="6" height="1.2" rx="0.5" fill="#CBD5E1" /></>}
                {i === 3 && <rect x={tx + 3} y="60" width="10" height="1.2" rx="0.5" fill="#CBD5E1" />}
              </g>
            );
          })}
          <Txt x={SIDE_X + 8} y={78} s={4} w={600} c="#7B8FA5">DESIGN</Txt>
          {/* Alignment — the ONE open group, three boxes, horizontal only */}
          <Txt x={SIDE_X + 8} y={87} s={5} w={600}>Alignment</Txt>
          <Chevron x={SIDE_X + 82} y={85.4} open />
          {(['left', 'center', 'right'] as const).map((a, i) => {
            const on = (f.align ?? 'left') === a;
            const bx = SIDE_X + 8 + i * 25.5;
            return (
              <g key={a}>
                <rect x={bx} y="91" width="23" height="10" rx="2" fill={on ? '#EAF3FB' : PAPER} stroke={on ? BLUE : '#DFE5ED'} strokeWidth="0.7" style={{ transition: T }} />
                {glyph(a === 'center' ? 'alignC' : a === 'right' ? 'alignR' : 'align', bx + 11.5, 96, on ? BLUE : '#64748B')}
              </g>
            );
          })}
          <Folded y={115} label="Background" />
          <Folded y={127} label="Border & corners" />
          <Folded y={139} label="Shadow" />
          <Folded y={151} label="Spacing" />
        </g>
      )}
    </g>
  );
}

/* ── the editor story (chapters 0–4) ──────────────────────────────────────────────────────────── */

function EditorScene({ f }: { f: SceneFrame }) {
  const sw = f.sw ?? SEC_W;
  const cw = cardW(sw);
  /* New Incident sits in slot 1 once it has moved right; Request Service takes slot 0. */
  const order = f.swapped ? [1, 0, 2, 3] : [0, 1, 2, 3];
  const selSlot = f.swapped ? 1 : 0;
  const [selX, selY] = slot(selSlot, sw);
  const swatches = ['#EEF4FF', '#FEF3C7', '#DCFCE7', '#FCE7F3', '#F1F5F9'];
  return (
    <>
      <Page />
      {/* the section */}
      <rect
        x={SEC_X} y={SEC_Y} width={sw} height={SEC_H} rx="5"
        fill={f.placed ? (f.tint ? '#EEF4FF' : '#F8FAFC') : 'none'}
        stroke={f.placed ? 'none' : '#CBD5E1'} strokeWidth="1" strokeDasharray={f.placed ? undefined : '3 2.5'}
        style={{ transition: T }}
      />
      {!f.placed && <Txt x={SEC_X + sw / 2} y={SEC_Y + SEC_H / 2 + 2} s={6.2} w={500} c={MUTED} anchor="middle">Drop a widget here</Txt>}
      {f.placed && (
        <g className="pt-pop">
          {CARDS.map((card, ci) => {
            const i = order.indexOf(ci);
            const [x, y] = slot(i, sw);
            const mine = ci === 0;
            return (
              <g key={card.name} style={{ transform: 'translate(0px, 0px)', transition: GLIDE }}>
                <ActionCard x={x} y={y} w={cw} card={card} tpl={mine ? f.tpl : 'left'} align={mine ? f.align : 'left'} />
              </g>
            );
          })}
        </g>
      )}

      {/* selection */}
      {f.selSec && (
        <g className="pt-fade">
          <rect x={SEC_X - 1.5} y={SEC_Y - 1.5} width={sw + 3} height={SEC_H + 3} rx="6" fill="none" stroke={BLUE} strokeWidth="1.3" style={{ transition: T }} />
          <rect x={SEC_X} y={SEC_Y + SEC_H + 4} width="46" height="9" rx="3" fill={PAPER} stroke={BLUE} strokeWidth="0.7" />
          <Txt x={SEC_X + 23} y={SEC_Y + SEC_H + 10.2} s={4.6} w={600} c={BLUE} anchor="middle">Quick Actions</Txt>
          {/* the side handles — the one on the right is what the Stretch chapter drags */}
          {[SEC_X - 1.5, SEC_X + sw + 1.5].map((hx) => (
            <rect key={hx} x={hx - 2} y={SEC_Y + SEC_H / 2 - 2} width="4" height="4" rx="0.8" fill={PAPER} stroke={BLUE} strokeWidth="0.8" style={{ transition: T }} />
          ))}
        </g>
      )}
      {f.selCard && (
        <rect x={selX - 1.2} y={selY - 1.2} width={cw + 2.4} height={CARD_H + 2.4} rx="4.6" fill="none" stroke={BLUE} strokeWidth="1.3" className="pt-fade" style={{ transition: T }} />
      )}
      {f.sw && f.sw < SEC_W && (
        <g className="pt-fade">
          <rect x={SEC_X + sw - 30} y={SEC_Y + SEC_H + 16} width="58" height="11" rx="5.5" fill={INK} />
          <Txt x={SEC_X + sw - 1} y={SEC_Y + SEC_H + 23.4} s={5.2} w={500} c={PAPER} anchor="middle">Drag to resize</Txt>
        </g>
      )}

      {/* the floating toolbars */}
      {f.bar === 'section' && <Bar x={SEC_X} kind="section" lit={f.lit} />}
      {f.bar === 'card' && <Bar x={selX} kind="card" lit={f.lit} align={f.align} />}

      {/* popups off the toolbar */}
      {f.pop === 'colour' && (
        <g className="pt-fade" filter="url(#ts-lift)">
          <rect x="66" y="56" width="68" height="54" rx="5" fill={PAPER} />
          <rect x="71" y="61" width="58" height="24" rx="3" fill="url(#ts-spectrum)" />
          {swatches.map((c, i) => (
            <rect key={c} x={71 + i * 11.8} y="92" width="9.6" height="9.6" rx="2" fill={c} stroke={i === 0 && f.tint ? BLUE : '#E2E8F0'} strokeWidth={i === 0 && f.tint ? 1.3 : 0.6} />
          ))}
        </g>
      )}
      {f.pop === 'templates' && (
        <g className="pt-fade" filter="url(#ts-lift)">
          <rect x={selX + 30} y="53" width="70" height="20" rx="4" fill={PAPER} />
          {[0, 1, 2, 3].map((i) => {
            const on = (f.tpl === 'top' ? 1 : 0) === i;
            return <rect key={i} x={selX + 34 + i * 16} y="57" width="13" height="12" rx="2" fill={on ? '#EAF3FB' : '#F8FAFC'} stroke={on ? BLUE : '#E2E8F0'} strokeWidth={on ? 0.9 : 0.6} style={{ transition: T }} />;
          })}
          <rect x={selX + 38.5} y="60" width="3.5" height="3.5" rx="0.8" fill="#93C5FD" />
          <rect x={selX + 54.5} y="59" width="3.5" height="3.5" rx="0.8" fill="#93C5FD" />
        </g>
      )}
      {f.pop === 'align' && (
        <g className="pt-fade" filter="url(#ts-lift)">
          <rect x={selX + 41} y="53" width="44" height="18" rx="4" fill={PAPER} />
          {(['left', 'center', 'right'] as const).map((a, i) => {
            const on = (f.align ?? 'left') === a;
            return (
              <g key={a}>
                <rect x={selX + 44 + i * 13.3} y="56" width="11" height="12" rx="2" fill={on ? '#EAF3FB' : PAPER} style={{ transition: T }} />
                {glyph(a === 'center' ? 'alignC' : a === 'right' ? 'alignR' : 'align', selX + 49.5 + i * 13.3, 62, on ? BLUE : '#64748B')}
              </g>
            );
          })}
        </g>
      )}

      <Sidebar f={f} />

      {/* ⚠️ The ghost only TRANSLATES — it keeps the row's size all the way across, and is gone the frame
          the cards appear. */}
      {(f.ghost === 'lift' || f.ghost === 'fly') && (
        <g filter="url(#ts-lift)" style={{ transform: `translate(${f.ghost === 'fly' ? -154 : 0}px, ${f.ghost === 'fly' ? 30 : 0}px)`, transition: GLIDE }}>
          <rect x={SIDE_X + 5} y="44" width="80" height="16" rx="4" fill={PAPER} stroke={BLUE} strokeWidth="1" />
          <rect x={SIDE_X + 9} y="48" width="8" height="8" rx="2" fill="#EF4444" />
          <Txt x={SIDE_X + 21} y={54} s={5.2} w={600}>Action Card</Txt>
        </g>
      )}
    </>
  );
}

function PublishScene({ f }: { f: SceneFrame }) {
  return (
    <>
      {/* the top bar */}
      <g filter="url(#ts-card)">
        <rect x="14" y="18" width="292" height="26" rx="6" fill={PAPER} />
        <Txt x={24} y={34.2} s={7} w={600}>Support Portal</Txt>
        <rect x="80" y="26" width={f.published ? 36 : 26} height="10" rx="3" fill={f.published ? '#ECFDF3' : '#F1F5F9'} style={{ transition: T }} />
        <Txt x={f.published ? 98 : 93} y={32.8} s={5.2} w={600} c={f.published ? '#16A34A' : MUTED} anchor="middle">{f.published ? 'Published' : 'Draft'}</Txt>
        {/* light / dark */}
        <rect x="196" y="25" width="26" height="12" rx="6" fill="#F1F5F9" />
        <circle cx="203" cy="31" r="4" fill={PAPER} />
        <rect x="228" y="24.5" width="30" height="13" rx="3" fill={PAPER} stroke="#DFE5ED" strokeWidth="0.8" />
        <Txt x={243} y={33.2} s={5.6} w={500} anchor="middle">Preview</Txt>
        <rect x="262" y="24.5" width="36" height="13" rx="3" fill={f.pressed ? '#2D6CA0' : BLUE} style={{ transition: T }} />
        <Txt x={280} y={33.2} s={5.6} w={600} c={PAPER} anchor="middle">Publish</Txt>
      </g>

      {/* the portal itself — what requesters will see */}
      <g filter="url(#ts-card)">
        <rect x="14" y="52" width="292" height="112" rx="8" fill={PAPER} />
        <rect x="20" y="58" width="280" height="52" rx="5" fill="url(#ts-banner)" />
        <Txt x={160} y={78} s={9} w={700} c={PAPER} anchor="middle">Welcome to Support Portal</Txt>
        <rect x="100" y="86" width="120" height="13" rx="3" fill={PAPER} opacity="0.95" />
        <Txt x={106} y={94.4} s={5.4} c="#94A3B8">How can we help you?</Txt>
        {CARDS.map((card, i) => (
          <g key={card.name}>
            <rect x={20 + i * 70.5} y="118" width="66" height="38" rx="5" fill={PAPER} stroke={LINE} strokeWidth="0.8" />
            <rect x={25 + i * 70.5} y="126" width="11" height="11" rx="3" fill={card.c} opacity="0.14" />
            <rect x={28 + i * 70.5} y="129" width="5" height="5" rx="1.3" fill={card.c} />
            <Txt x={39 + i * 70.5} y={133.6} s={5} w={600}>{card.name}</Txt>
          </g>
        ))}
      </g>

      {f.published && (
        <g className="pt-pop">
          <rect x="96" y="140" width="128" height="22" rx="6" fill={INK} filter="url(#ts-lift)" />
          <circle cx="110" cy="151" r="5.5" fill="#16A34A" />
          <path d="M107.6 151 l1.7 1.7 l3.2 -3.4" stroke={PAPER} strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <Txt x={121} y={153.4} s={6.6} w={600} c={PAPER}>Portal published</Txt>
          {/* a little burst — the one moment in the tour that is a celebration */}
          {[[-6, -8], [6, -10], [14, -4], [-12, 2]].map(([dx, dy], i) => (
            <circle key={i} cx={280 + dx} cy={31 + dy} r="1.6" fill={['#F59E0B', '#10B981', YOU, BLUE][i]} className="pt-burst" style={{ animationDelay: `${i * 70}ms` }} />
          ))}
        </g>
      )}
    </>
  );
}

/* ⚠️ Chapters 0–4 share ONE component, so the editor never remounts between them. */
const SCENES = [EditorScene, EditorScene, EditorScene, EditorScene, EditorScene, PublishScene];

export function TourScene({ frame }: { frame: SceneFrame }) {
  const c = TOUR_CHAPTERS[frame.ch];
  const Scene = SCENES[frame.ch];
  return (
    <svg viewBox="0 0 320 180" className="h-full w-full" role="img" aria-label={c.title}>
      <Defs />
      <Ground c={c} />
      <Scene f={frame} />
      <Cursor at={frame.cur} press={frame.press} />
    </svg>
  );
}
