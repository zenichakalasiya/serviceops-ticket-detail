/**
 * The dock's video — five ILLUSTRATED SCENES, one per chapter (28 Sep 2026, Zeni's pick, from the Miro
 * "what's new" carousel she shared).
 *
 * ⚠️ SCENES, NOT A MINIATURE. The previous story drew the whole editor at postage-stamp size in grey
 * bars and animated one region of it; at 300px that read as a wireframe of a wireframe. Each chapter
 * is now its own COMPOSED picture on its own coloured ground — only the pieces that chapter is about,
 * drawn large enough to carry REAL WORDS ("My Open Requests", "INC-32 VPN not connecting", "Publish").
 * The words are what make it read as this product rather than as a diagram of one.
 *
 * ⚠️ A NAMED CURSOR ("You") does every action, the multiplayer-cursor language of the reference. A bare
 * arrow is a pointer; an arrow with a name is somebody doing something, and a tour is about doing.
 *
 * ⚠️ FRAMES ARE STILL DATA and there is still ONE renderer per scene: a frame is a state (where the ghost
 * is, whether the card is selected, which popup is open), and CSS transitions carry the motion between
 * states. The scene must NOT remount between frames — transitions need the same nodes changing value.
 *
 * ⚠️ Every action shown is one the builder really has: drag a widget from the library, select it for
 * its toolbar and panel, split and drag the shared edge, colour and shadow from the toolbar, spacing in
 * the PANEL, and Publish in the top bar. A tour that invents a gesture teaches somebody to look for a
 * button that is not there.
 *
 * ⚠️ Every Tailwind class is literal, and every colour is written out — nothing is built by interpolation.
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
    desc: 'Drag a widget from the library onto the page — or click one to drop it in its own row.',
    ground: '#EEF2FF', blob: '#E0E7FF' },
  { name: 'Select', title: 'Click anything to edit it',
    desc: 'A toolbar appears on whatever you select, and the panel becomes its settings.',
    ground: '#ECFDF5', blob: '#D1FAE5' },
  { name: 'Arrange', title: 'Arrange it your way',
    desc: 'Split a section into columns, then drag the shared edge — the neighbour gives way.',
    ground: '#FFF7ED', blob: '#FFEDD5' },
  { name: 'Style', title: 'Style it from the toolbar',
    desc: 'Background, border, corners and shadow sit on the toolbar. Spacing lives in the panel.',
    ground: '#FDF2F8', blob: '#FCE7F3' },
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
  // Add
  ghost?: 'off' | 'lift' | 'fly';
  placed?: boolean;
  // Select
  sel?: boolean;
  bar?: boolean;
  panel?: boolean;
  // Arrange
  split?: boolean;
  /** The first column's width while split — the shared edge being dragged. */
  w?: number;
  lit?: number;
  // Style
  pop?: 'colour' | 'shadow';
  tint?: boolean;
  shadow?: boolean;
  spacing?: boolean;
  // Publish
  pressed?: boolean;
  published?: boolean;
}

/* ⚠️ Written at the pace it should PLAY — the previous story was authored slow and scaled down, and a
   scene that is short by design is easier to tune than one that is long by accident. */
export const SCENE_FRAMES: SceneFrame[] = [
  /* Add */
  { ch: 0, ms: 800, cur: [262, 64], ghost: 'off' },
  { ch: 0, ms: 600, cur: [262, 64], ghost: 'lift', press: true },
  { ch: 0, ms: 900, cur: [118, 92], ghost: 'fly' },
  { ch: 0, ms: 1400, cur: [118, 92], placed: true },
  /* Select */
  { ch: 1, ms: 700, cur: [150, 112], placed: true },
  { ch: 1, ms: 700, cur: [150, 112], placed: true, sel: true, press: true },
  { ch: 1, ms: 1700, cur: [150, 112], placed: true, sel: true, bar: true, panel: true },
  /* Arrange */
  { ch: 2, ms: 800, cur: [63, 49], placed: true, sel: true, bar: true, lit: 2, press: true },
  { ch: 2, ms: 900, cur: [118, 100], placed: true, sel: true, bar: true, split: true, w: 84 },
  { ch: 2, ms: 1500, cur: [150, 100], placed: true, sel: true, bar: true, split: true, w: 116 },
  /* Style */
  { ch: 3, ms: 900, cur: [87, 49], placed: true, sel: true, bar: true, lit: 4, pop: 'colour', press: true },
  { ch: 3, ms: 900, cur: [82, 100], placed: true, sel: true, bar: true, lit: 4, pop: 'colour', tint: true, press: true },
  { ch: 3, ms: 1000, cur: [109, 49], placed: true, sel: true, bar: true, lit: 6, pop: 'shadow', tint: true, shadow: true, press: true },
  { ch: 3, ms: 1400, cur: [240, 84], placed: true, sel: true, tint: true, shadow: true, spacing: true, panel: true },
  /* Publish */
  { ch: 4, ms: 900, cur: [276, 31] },
  { ch: 4, ms: 500, cur: [276, 31], pressed: true, press: true },
  { ch: 4, ms: 1800, cur: [276, 31], published: true },
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
      <rect x="0" y="0" width="320" height="180" fill={c.ground} />
      <circle cx="292" cy="10" r="64" fill={c.blob} />
      <circle cx="18" cy="176" r="46" fill={c.blob} />
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
function Page({ x = 16, y = 22, w = 190, h = 138 }: { x?: number; y?: number; w?: number; h?: number }) {
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

/** The widget the story builds with — "My Open Requests" with two real rows. */
function RequestsCard({ x, y, w, tint, shadow, pad }: { x: number; y: number; w: number; tint?: boolean; shadow?: boolean; pad?: boolean }) {
  const p = pad ? 5 : 0;
  const rows: [string, string, string][] = [['INC-32', 'VPN not connecting', '#F59E0B'], ['INC-35', 'New laptop request', '#10B981']];
  return (
    <g filter={shadow ? 'url(#ts-lift)' : undefined}>
      <rect x={x} y={y} width={w} height="62" rx="6" fill={tint ? '#EEF4FF' : PAPER} stroke={LINE} strokeWidth="0.8" style={{ transition: T }} />
      <g style={{ transform: `translate(${p}px, ${p * 0.6}px)`, transition: T }}>
        <rect x={x + 7} y={y + 7} width="10" height="10" rx="2.5" fill={tint ? PAPER : '#EAF3FB'} style={{ transition: T }} />
        <rect x={x + 9.6} y={y + 10} width="4.8" height="4" rx="1" fill={BLUE} />
        <Txt x={x + 21} y={y + 14.2} s={6.6} w={600}>My Open Requests</Txt>
        <rect x={x + 83} y={y + 8.5} width="10" height="7" rx="3.5" fill={tint ? PAPER : '#F1F5F9'} style={{ transition: T }} />
        <Txt x={x + 88} y={y + 13.6} s={5} w={600} c={MUTED} anchor="middle">8</Txt>
        {rows.map(([id, sub, dot], i) => (
          <g key={id}>
            <rect x={x + 7} y={y + 24 + i * 16} width="20" height="8" rx="2" fill={tint ? PAPER : '#EAF3FB'} style={{ transition: T }} />
            <Txt x={x + 17} y={y + 29.8 + i * 16} s={4.8} w={600} c={BLUE} anchor="middle">{id}</Txt>
            <Txt x={x + 31} y={y + 30 + i * 16} s={5.6} c={INK}>{sub}</Txt>
            <circle cx={x + w - 10 - p * 2} cy={y + 28 + i * 16} r="2.2" fill={dot} style={{ transition: T }} />
          </g>
        ))}
      </g>
    </g>
  );
}

/** The floating toolbar: seven real-shaped glyphs, grouped move · place · style · remove. */
function Toolbar({ x, y, lit }: { x: number; y: number; lit?: number }) {
  const glyph = (i: number, cx: number, cy: number) => {
    const c = lit === i ? BLUE : '#64748B';
    switch (i) {
      case 0: return <g>{[[-1.6, -2], [1.6, -2], [-1.6, 0], [1.6, 0], [-1.6, 2], [1.6, 2]].map(([dx, dy], k) => <circle key={k} cx={cx + dx} cy={cy + dy} r="0.7" fill={c} />)}</g>;
      case 1: return <path d={`M${cx - 3} ${cy} h6 M${cx + 1} ${cy - 2.2} l2 2.2 l-2 2.2`} stroke={c} strokeWidth="1" fill="none" strokeLinecap="round" />;
      case 2: return <g><rect x={cx - 3.2} y={cy - 2.6} width="6.4" height="5.2" rx="0.8" stroke={c} strokeWidth="0.9" fill="none" /><line x1={cx} x2={cx} y1={cy - 2.6} y2={cy + 2.6} stroke={c} strokeWidth="0.9" /></g>;
      case 3: return <path d={`M${cx} ${cy - 3} v6 M${cx - 3} ${cy} h6`} stroke={c} strokeWidth="1" strokeLinecap="round" />;
      case 4: return <path d={`M${cx - 2.6} ${cy + 0.4} l2.2 -3 l2.6 2.4 l-2.2 3 z M${cx + 2.6} ${cy + 1.6} q0.6 1.2 0 1.8 q-0.6 -0.6 0 -1.8`} stroke={c} strokeWidth="0.9" fill="none" strokeLinejoin="round" />;
      case 5: return <rect x={cx - 3} y={cy - 3} width="6" height="6" rx="1.4" stroke={c} strokeWidth="0.9" fill="none" />;
      case 6: return <g><rect x={cx - 3.6} y={cy - 3.6} width="7.2" height="7.2" rx="1.8" fill={c} opacity="0.18" /><rect x={cx - 2.6} y={cy - 2.6} width="5.2" height="5.2" rx="1" stroke={c} strokeWidth="0.9" fill="none" /></g>;
      default: return <path d={`M${cx - 2.4} ${cy - 1.8} h4.8 M${cx - 1.8} ${cy - 1.8} l0.4 4.2 h2.8 l0.4 -4.2`} stroke="#EF4444" strokeWidth="0.9" fill="none" strokeLinecap="round" />;
    }
  };
  const xs = [9, 22, 33, 44, 57, 68, 79, 92];
  return (
    <g className="pt-fade" filter="url(#ts-card)">
      <rect x={x} y={y} width="101" height="14" rx="4" fill={PAPER} stroke={LINE} strokeWidth="0.6" />
      {[16, 51, 86].map((dx) => <line key={dx} x1={x + dx} x2={x + dx} y1={y + 3.5} y2={y + 10.5} stroke={LINE} strokeWidth="0.6" />)}
      {xs.map((dx, i) => (
        <g key={i}>
          {lit === i && <rect x={x + dx - 4.6} y={y + 2.4} width="9.2" height="9.2" rx="2" fill="#EAF3FB" />}
          {glyph(i, x + dx, y + 7)}
        </g>
      ))}
    </g>
  );
}

/* ── the five scenes ──────────────────────────────────────────────────────────────────────────── */

function AddScene({ f }: { f: SceneFrame }) {
  const lib: [string, string][] = [['My Open Requests', BLUE], ['Announcements', '#F59E0B'], ['Knowledge', '#10B981'], ['Contact Us', '#8B5CF6']];
  return (
    <>
      <Page />
      {!f.placed && (
        <g className="pt-fade">
          <rect x="30" y="56" width="162" height="60" rx="6" fill="none" stroke="#CBD5E1" strokeWidth="1" strokeDasharray="3 2.5" />
          <Txt x={111} y={90} s={6.4} w={500} c={MUTED} anchor="middle">Drop a widget here</Txt>
        </g>
      )}
      {f.placed && <g className="pt-fade"><RequestsCard x={30} y={56} w={162} /></g>}

      {/* the library */}
      <g filter="url(#ts-card)">
        <rect x="216" y="22" width="90" height="138" rx="8" fill={PAPER} />
        <Txt x={226} y={38} s={7} w={600}>Widgets</Txt>
        {lib.map(([name, c], i) => (
          <g key={name}>
            <rect x="222" y={48 + i * 22} width="78" height="17" rx="4" fill={i === 0 && f.ghost !== 'off' && !f.placed ? '#EEF2FF' : '#F8FAFC'} />
            <rect x="226" y={52 + i * 22} width="9" height="9" rx="2" fill={c} opacity="0.9" />
            <Txt x={239} y={58.6 + i * 22} s={5.4} w={500}>{name}</Txt>
          </g>
        ))}
      </g>

      {/* ⚠️ The ghost only TRANSLATES — it keeps the row's size all the way across, so nothing is ever
          drawn stretched, and it is gone the frame the card appears. */}
      {(f.ghost === 'lift' || f.ghost === 'fly') && (
        <g filter="url(#ts-lift)" style={{ transform: `translate(${f.ghost === 'fly' ? -142 : 0}px, ${f.ghost === 'fly' ? 26 : 0}px)`, transition: GLIDE }}>
          <rect x="222" y="48" width="78" height="17" rx="4" fill={PAPER} stroke={BLUE} strokeWidth="1" />
          <rect x="226" y="52" width="9" height="9" rx="2" fill={BLUE} />
          <Txt x={239} y={58.6} s={5.4} w={600}>My Open Requests</Txt>
        </g>
      )}
    </>
  );
}

function SelectScene({ f }: { f: SceneFrame }) {
  return (
    <>
      <Page />
      <RequestsCard x={30} y={62} w={162} />
      {f.sel && (
        <g className="pt-fade">
          <rect x="28.5" y="60.5" width="165" height="65" rx="7" fill="none" stroke={BLUE} strokeWidth="1.4" />
          {/* the name chip — an outline on white, as the builder draws it */}
          <rect x="30" y="129" width="56" height="10" rx="3" fill={PAPER} stroke={BLUE} strokeWidth="0.7" />
          <Txt x={58} y={135.8} s={5} w={600} c={BLUE} anchor="middle">My Open Requests</Txt>
        </g>
      )}
      {f.bar && <Toolbar x={30} y={42} />}
      {f.panel && (
        <g className="pt-slide" filter="url(#ts-card)">
          <rect x="216" y="22" width="90" height="138" rx="8" fill={PAPER} />
          <Txt x={225} y={37} s={6.6} w={600}>My Open Requests</Txt>
          <Txt x={225} y={45} s={5} c={MUTED}>Settings</Txt>
          {[['Title', 'My Open Requests'], ['Rows to show', '4']].map(([k, v], i) => (
            <g key={k}>
              <Txt x={225} y={60 + i * 26} s={5} c={MUTED}>{k}</Txt>
              <rect x="224" y={63 + i * 26} width="74" height="12" rx="2.5" fill={PAPER} stroke="#DFE5ED" strokeWidth="0.7" />
              <Txt x={228} y={71 + i * 26} s={5.4}>{v}</Txt>
            </g>
          ))}
          <Txt x={225} y={122} s={5} c={MUTED}>Show status</Txt>
          <rect x="283" y="116.5" width="15" height="8" rx="4" fill={BLUE} />
          <circle cx="294" cy="120.5" r="3" fill={PAPER} />
        </g>
      )}
    </>
  );
}

function ArrangeScene({ f }: { f: SceneFrame }) {
  const w = f.split ? (f.w ?? 84) : 162;
  const sibX = 30 + w + 6;
  const sibW = 162 - w - 6;
  return (
    <>
      <Page />
      <RequestsCard x={30} y={62} w={w} />
      <rect x="28.5" y="60.5" width={w + 3} height="65" rx="7" fill="none" stroke={BLUE} strokeWidth="1.4" style={{ transition: T }} />
      {f.split && (
        <g className="pt-fade">
          <rect x={sibX} y="62" width={sibW} height="62" rx="6" fill="none" stroke="#CBD5E1" strokeWidth="1" strokeDasharray="3 2.5" style={{ transition: T }} />
          <Txt x={sibX + sibW / 2} y={96} s={9} w={300} c="#94A3B8" anchor="middle">+</Txt>
          {/* the shared edge, lit while it is dragged */}
          <rect x={30 + w + 1} y="85" width="4" height="16" rx="2" fill={BLUE} className="pt-pulse" style={{ transition: T }} />
          {f.w && f.w > 90 && (
            <g className="pt-fade">
              <rect x={30 + w - 44} y="136" width="58" height="12" rx="6" fill={INK} />
              <Txt x={30 + w - 15} y={143.8} s={5.4} w={500} c={PAPER} anchor="middle">Drag to resize</Txt>
            </g>
          )}
        </g>
      )}
      {f.bar && <Toolbar x={30} y={42} lit={f.lit} />}
      {/* a second page element for scale, so the section reads as one of several */}
      <g filter="url(#ts-card)">
        <rect x="216" y="22" width="90" height="138" rx="8" fill={PAPER} />
        <Txt x={225} y={37} s={6.6} w={600}>Section</Txt>
        <Txt x={225} y={45} s={5} c={MUTED}>Layout</Txt>
        {[0, 1, 2].map((i) => (
          <g key={i}>
            <rect x={224 + i * 26} y="54" width="22" height="16" rx="3" fill={i === 1 && f.split ? '#EAF3FB' : '#F8FAFC'} stroke={i === 1 && f.split ? BLUE : '#E2E8F0'} strokeWidth="0.8" />
            {Array.from({ length: i + 1 }).map((_, k) => (
              <rect key={k} x={226 + i * 26 + k * (18 / (i + 1))} y="57" width={18 / (i + 1) - 1.5} height="10" rx="1" fill={i === 1 && f.split ? '#BFDBFE' : '#E2E8F0'} />
            ))}
          </g>
        ))}
      </g>
    </>
  );
}

function StyleScene({ f }: { f: SceneFrame }) {
  const swatches = ['#EEF4FF', '#FEF3C7', '#DCFCE7', '#FCE7F3', '#F1F5F9'];
  return (
    <>
      <Page />
      <RequestsCard x={30} y={62} w={162} tint={f.tint} shadow={f.shadow} pad={f.spacing} />
      {f.sel && <rect x="28.5" y="60.5" width="165" height="65" rx="7" fill="none" stroke={BLUE} strokeWidth="1.4" />}
      {f.bar && <Toolbar x={30} y={42} lit={f.lit} />}

      {f.pop === 'colour' && (
        <g className="pt-fade" filter="url(#ts-lift)">
          <rect x="72" y="60" width="68" height="54" rx="5" fill={PAPER} />
          <rect x="77" y="65" width="58" height="24" rx="3" fill="url(#ts-spectrum)" />
          {swatches.map((c, i) => (
            <rect key={c} x={77 + i * 11.8} y="95" width="9.6" height="9.6" rx="2" fill={c} stroke={i === 0 && f.tint ? BLUE : '#E2E8F0'} strokeWidth={i === 0 && f.tint ? 1.3 : 0.6} />
          ))}
        </g>
      )}
      {f.pop === 'shadow' && (
        <g className="pt-fade" filter="url(#ts-lift)">
          <rect x="86" y="60" width="88" height="34" rx="5" fill={PAPER} />
          {['None', 'Soft', 'Medium', 'Strong'].map((n, i) => (
            <g key={n}>
              <rect x={90 + i * 21} y="64" width="18" height="16" rx="2.5" fill={i === 2 ? '#EAF3FB' : '#F8FAFC'} stroke={i === 2 ? BLUE : '#E2E8F0'} strokeWidth={i === 2 ? 1 : 0.6} />
              <Txt x={99 + i * 21} y={89} s={4.4} w={500} c={i === 2 ? BLUE : MUTED} anchor="middle">{n}</Txt>
            </g>
          ))}
        </g>
      )}

      {/* ⚠️ Spacing is in the PANEL, drawn as the panel draws it — margin outside, padding inside. */}
      {f.panel && (
        <g className="pt-slide" filter="url(#ts-card)">
          <rect x="216" y="22" width="90" height="138" rx="8" fill={PAPER} />
          <Txt x={225} y={37} s={6.6} w={600}>Spacing</Txt>
          <rect x="224" y="46" width="74" height="54" rx="4" fill="none" stroke="#CBD5E1" strokeWidth="0.8" strokeDasharray="2 1.6" />
          <Txt x={228} y={53} s={4.4} c={MUTED}>MARGIN</Txt>
          <rect x="234" y="58" width="54" height="34" rx="3" fill="#EEF4FF" stroke={BLUE} strokeWidth="0.9" className="pt-pulse" />
          <Txt x={238} y={65} s={4.4} c={BLUE}>PADDING</Txt>
          <rect x="248" y="70" width="26" height="14" rx="2" fill={PAPER} stroke="#E2E8F0" strokeWidth="0.6" />
          {['16 px', '24 px'].map((v, i) => (
            <g key={v}>
              <rect x={224 + i * 38} y="110" width="36" height="13" rx="2.5" fill={PAPER} stroke="#DFE5ED" strokeWidth="0.7" />
              <Txt x={242 + i * 38} y={118.6} s={5.4} w={500} anchor="middle">{v}</Txt>
            </g>
          ))}
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
        {[['New Incident', '#EF4444'], ['Request Service', BLUE], ['Knowledge', '#10B981']].map(([n, c], i) => (
          <g key={n}>
            <rect x={20 + i * 94} y="118" width="88" height="38" rx="5" fill={PAPER} stroke={LINE} strokeWidth="0.8" />
            <rect x={26 + i * 94} y="126" width="12" height="12" rx="3" fill={c} opacity="0.14" />
            <rect x={29 + i * 94} y="129" width="6" height="6" rx="1.5" fill={c} />
            <Txt x={42 + i * 94} y={134} s={5.8} w={600}>{n}</Txt>
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

const SCENES = [AddScene, SelectScene, ArrangeScene, StyleScene, PublishScene];

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
