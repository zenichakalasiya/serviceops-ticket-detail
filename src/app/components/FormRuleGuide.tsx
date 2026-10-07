import { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle, ChevronDown, ChevronLeft, ChevronRight, CirclePlay, Copy, History, Info, Lightbulb, Maximize2, Minimize2, Plus, Search,
  RotateCcw, Save, Split, Workflow, X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/**
 * The Form Rule guide — two surfaces that teach the same thing:
 *
 *  - `FormRuleGuideDock`: the "Rule builder basics" video card. It opens by itself the FIRST time
 *    somebody opens Create / Edit Rule (V1 only), in the corner beside the Rule check rail, and comes
 *    back from the Help guide tab's "Watch guide". Same shape as the Support Portal's Editor basics:
 *    an illustrated scene that moves, dots, a title and a line, Previous / Next: ‹name›, and a
 *    full-screen button.
 *  - `FormRuleHelpGuide`: the Help guide TAB of the Rule check rail — the same six steps written out
 *    as points, for somebody who would rather read than watch.
 *
 * ⚠️ The scene draws the rule as the FLOW view does (E · Flow, Zeni's pick, 7 Oct 2026): When → Check
 * if → a THEN hub → action nodes, left to right, with the builder's own step colours (blue / orange /
 * green). A similar rule arrives as an amber card above the nodes it shares; a conflict as a red card
 * under the action it fights.
 *
 * ⚠️ FRAMES ARE DATA and the scene NEVER remounts between them, so every change is a CSS transition.
 * This file imports nothing from the other form-rule views — the rail and the editor both import it,
 * and neither can get an import cycle out of that.
 */

export const FORM_RULE_GUIDE_SEEN = 'formRuleGuideSeen';

const BLUE = '#3D8BD0';
const ORANGE = '#F58518';
const GREEN = '#5E9E1E';
const AMBER = '#D97706';
const RED = '#DC2626';
const INK = '#1E293B';
const MUTED = '#64748B';
const LINE = '#DFE5ED';
const PAPER = '#FFFFFF';
const YOU = '#7C3AED';
const FONT = 'Inter, system-ui, -apple-system, sans-serif';

export interface GuideChapter { name: string; title: string; desc: string; ground: string; blob: string }

export const GUIDE_CHAPTERS: GuideChapter[] = [
  { name: 'When', title: 'When — pick when the rule runs',
    desc: 'Choose the event, new or existing requests, and who it’s for. It shows up in the flow as WHEN.',
    ground: '#EFF6FF', blob: '#DBEAFE' },
  { name: 'Check if', title: 'Check if — add conditions',
    desc: 'Add checks like “Priority is High”, joined with AND or OR. Each one joins the CHECK IF step.',
    ground: '#FFF7ED', blob: '#FFEDD5' },
  { name: 'Then', title: 'Then — choose what happens',
    desc: 'Pick an action and the field it changes. Every action becomes a step after THEN.',
    ground: '#F0FDF4', blob: '#DCFCE7' },
  { name: 'Similar', title: 'Similar rules',
    desc: 'Another rule with the same trigger and conditions shows in Similar rules — add your actions there.',
    ground: '#FEFCE8', blob: '#FEF3C7' },
  { name: 'Conflicts', title: 'Conflicts',
    desc: 'If another rule changes the same field the opposite way, the row turns red. Click ⚠ to see which.',
    ground: '#FEF2F2', blob: '#FEE2E2' },
  { name: 'Save', title: 'Save the rule',
    desc: 'Check the rule reads the way you want, then click Save Rule. It starts working right away.',
    ground: '#EEF2FF', blob: '#E0E7FF' },
];

/**
 * ⚠️ THE SCENE IS THE BUILDER AND ITS FLOW, SIDE BY SIDE (Zeni, 7 Oct 2026): the real form fills in on
 * the left — the When fields, a condition row, an action row — and every answer appears at once as a
 * step in the flow on the right, the two joined by a dashed link in the step's colour. In Similar and
 * Conflicts the right side becomes the Rule check panel, as it is in the product.
 *
 * ⚠️ MOVE, THEN CLICK. A frame that moves the cursor changes nothing else; the click — and whatever it
 * does — is the NEXT frame, so a field never fills in before the cursor has reached it. That was the
 * "delay" of the first version: the change landed while the pointer was still on its way.
 */
interface GFrame {
  ch: number;
  ms: number;
  cur: [number, number];
  /** A click lands on this frame (the ring plays once). */
  press?: boolean;
  /** 0 empty · 1 event menu open · 2 event set · 3 + execute on · 4 + applicable for. */
  when?: 0 | 1 | 2 | 3 | 4;
  cond?: 0 | 1 | 2;
  act?: 0 | 1 | 2;
  /** What the right side shows. */
  right?: 'flow' | 'similar' | 'conflicts';
  /** The trigger and conditions ring amber — they are what the similar rule shares. */
  sim?: boolean;
  /** The Hide · Description row is in conflict. */
  clash?: boolean;
  /** The step that has just appeared — its node and its link light up. */
  flash?: 'when' | 'if' | 'a1' | 'a2';
  save?: 'press' | 'done';
}

const DONE = { when: 4, cond: 2, act: 2 } as const;
const REST: [number, number] = [150, 168];

/* Form geometry — one place, so every frame agrees about where the fields are. */
const F = { x: 8, w: 190, top: 26 };
const SEL_Y = 47;
const EV = { x: 14, w: 60 };
const EX = { x: 78, w: 52 };
const AP = { x: 134, w: 58 };
const R1 = 80;
const R2 = 94;
const A1 = 128;
const A2 = 142;
const mid = (b: { x: number; w: number }, y = SEL_Y + 5): [number, number] => [b.x + b.w / 2, y];

/* ⚠️ Written at the pace it should PLAY. A move frame is long enough for the glide to finish. */
const FRAMES: GFrame[] = [
  /* When — open Rule Event, pick the first option, then Execute on and Applicable for */
  { ch: 0, ms: 600, cur: REST },
  { ch: 0, ms: 800, cur: mid(EV) },
  { ch: 0, ms: 500, cur: mid(EV), press: true, when: 1 },
  { ch: 0, ms: 750, cur: [46, 65], when: 1 },
  { ch: 0, ms: 600, cur: [46, 65], press: true, when: 2, flash: 'when' },
  { ch: 0, ms: 750, cur: mid(EX), when: 2 },
  { ch: 0, ms: 500, cur: mid(EX), press: true, when: 3, flash: 'when' },
  { ch: 0, ms: 750, cur: mid(AP), when: 3 },
  { ch: 0, ms: 1600, cur: mid(AP), press: true, when: 4, flash: 'when' },
  /* Check if — add a condition, then a second joined by AND */
  { ch: 1, ms: 850, cur: [96, R1 + 5], when: 4 },
  { ch: 1, ms: 900, cur: [96, R1 + 5], press: true, when: 4, cond: 1, flash: 'if' },
  { ch: 1, ms: 750, cur: [40, R2 + 5], when: 4, cond: 1 },
  { ch: 1, ms: 1600, cur: [40, R2 + 5], press: true, when: 4, cond: 2, flash: 'if' },
  /* Then — two actions */
  { ch: 2, ms: 850, cur: [96, A1 + 5], when: 4, cond: 2 },
  { ch: 2, ms: 900, cur: [96, A1 + 5], press: true, when: 4, cond: 2, act: 1, flash: 'a1' },
  { ch: 2, ms: 750, cur: [40, A2 + 5], when: 4, cond: 2, act: 1 },
  { ch: 2, ms: 1600, cur: [40, A2 + 5], press: true, ...DONE, flash: 'a2' },
  /* Similar — the right side becomes the Rule check panel on Similar rules */
  { ch: 3, ms: 800, cur: REST, ...DONE },
  { ch: 3, ms: 900, cur: REST, ...DONE, right: 'similar', sim: true },
  { ch: 3, ms: 850, cur: [287, 73], ...DONE, right: 'similar', sim: true },
  { ch: 3, ms: 2000, cur: [287, 73], ...DONE, right: 'similar', sim: true },
  /* Conflicts — the row turns red; its ⚠ opens Conflicts */
  { ch: 4, ms: 900, cur: REST, ...DONE, clash: true },
  { ch: 4, ms: 850, cur: [184, A2 + 5], ...DONE, clash: true },
  { ch: 4, ms: 2300, cur: [184, A2 + 5], press: true, ...DONE, clash: true, right: 'conflicts' },
  /* Save */
  { ch: 5, ms: 900, cur: [285, 15], ...DONE },
  { ch: 5, ms: 500, cur: [285, 15], press: true, ...DONE, save: 'press' },
  { ch: 5, ms: 2200, cur: [285, 15], ...DONE, save: 'done' },
];

const chStart = (ch: number) => FRAMES.findIndex((f) => f.ch === ch);
const chEnd = (ch: number) => { let l = -1; FRAMES.forEach((f, i) => { if (f.ch === ch) l = i; }); return l; };

const T = 'all 380ms cubic-bezier(0.4,0,0.2,1)';

/* ── drawing ──────────────────────────────────────────────────────────────────────────────────── */

const Txt = ({ x, y, s = 4.6, w = 400, c = INK, children, anchor }: {
  x: number; y: number; s?: number; w?: number; c?: string; children: React.ReactNode; anchor?: 'start' | 'middle' | 'end';
}) => <text x={x} y={y} fontSize={s} fontWeight={w} fill={c} fontFamily={FONT} textAnchor={anchor}>{children}</text>;

function Ico({ I, cx, cy, s = 5, c = MUTED, w = 1.8 }: { I: LucideIcon; cx: number; cy: number; s?: number; c?: string; w?: number }) {
  return <I x={cx - s / 2} y={cy - s / 2} size={s} color={c} strokeWidth={w} />;
}

/**
 * ⚠️ The cursor travels on a CURVE: x and y are two nested transforms with different easings, so the
 * path bows instead of running a straight line — the way a hand moves a mouse.
 */
function Cursor({ at, press, n }: { at: [number, number]; press?: boolean; n: number }) {
  return (
    <g style={{ transform: `translateX(${at[0]}px)`, transition: 'transform 720ms cubic-bezier(0.45,0,0.25,1)' }}>
      <g style={{ transform: `translateY(${at[1]}px)`, transition: 'transform 720ms cubic-bezier(0.2,0.75,0.3,1)' }}>
        {press && <circle key={n} cx="0" cy="0" r="6" fill="none" stroke={YOU} strokeWidth="1.2" className="fg-click" />}
        <path d="M0 0 L0 12 L3.3 9 L5.7 14 L7.6 13.1 L5.3 8.3 L9.8 8 Z" fill={YOU} stroke={PAPER} strokeWidth="1" strokeLinejoin="round" />
        <rect x="9" y="12" width="20" height="10" rx="5" fill={YOU} />
        <Txt x={19} y={19.2} s={6} w={600} c={PAPER} anchor="middle">You</Txt>
      </g>
    </g>
  );
}

/** A builder select: a bordered box with its value (or a grey placeholder) and a chevron. */
function Sel({ x, y, w, v, ph, tone, fill = PAPER, lit }: { x: number; y: number; w: number; v?: string; ph?: string; tone?: string; fill?: string; lit?: boolean }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height="10" rx="2" fill={fill} stroke={lit ? BLUE : '#D5DEE8'} strokeWidth={lit ? 0.9 : 0.6} style={{ transition: T }} />
      <Txt x={x + 3.5} y={y + 6.7} s={4.4} w={v ? 500 : 400} c={v ? (tone ?? INK) : '#98A2B3'}>{v ?? ph}</Txt>
      <path d={`M${x + w - 6} ${y + 4.2} l1.6 1.6 l1.6 -1.6`} fill="none" stroke="#98A2B3" strokeWidth="0.6" strokeLinecap="round" />
    </g>
  );
}

/** A section heading in the form: the step's badge and its words — the builder's own. */
function Head({ y, I, tone, lead, rest, rotate }: { y: number; I: LucideIcon; tone: string; lead: string; rest: string; rotate?: boolean }) {
  return (
    <g>
      <circle cx={18} cy={y} r="4.2" fill={tone} opacity="0.13" />
      <g style={rotate ? { transform: 'rotate(180deg)', transformOrigin: `18px ${y}px` } : undefined}><Ico I={I} cx={18} cy={y} s={4.8} c={tone} /></g>
      <Txt x={25} y={y + 1.7} s={5} w={600} c={tone}>{lead}<tspan fill={MUTED} fontWeight={400}> {rest}</tspan></Txt>
    </g>
  );
}

/** A dashed "add" row, the way an empty list starts in the builder. */
function AddRow({ y, text }: { y: number; text: string }) {
  return (
    <g className="pt-fade">
      <rect x="18" y={y} width="170" height="10" rx="2" fill={PAPER} fillOpacity="0.6" stroke="#B6C3D1" strokeWidth="0.6" strokeDasharray="2.6 2" />
      <Ico I={Plus} cx={86} cy={y + 5} s={4.4} c={MUTED} />
      <Txt x={90} y={y + 6.7} s={4.4} w={500} c={MUTED}>{text}</Txt>
    </g>
  );
}

/* Flow geometry (vertical — the right side is narrow). */
const RX = 204;
const RW = 108;
const WN = { x: 213, y: 45, w: 90, h: 20 };
const IN = { x: 213, y: 75, w: 90, h: 26 };
const HUB = { cx: 258, cy: 113, r: 6.5 };
const AN1 = { x: 207, y: 128, w: 48, h: 22 };
const AN2 = { x: 261, y: 128, w: 48, h: 22 };

/** A flow node: badge, step name, its lines. `ping` plays the "just added" ring once. */
function FNode({ b, tone, I, label, lines, ring, ping, rotate, active }: {
  b: { x: number; y: number; w: number; h: number }; tone: string; I: LucideIcon; label: string;
  lines: React.ReactNode[]; ring?: string; ping?: boolean; rotate?: boolean;
  /** The step the form is filling right now — ringed and tinted in its colour. */
  active?: boolean;
}) {
  return (
    <g className="pt-pop">
      {/* ⚠️ The "just added" pulse GROWS the same amount on all four sides (its x / y / width / height animate from CSS variables) — a scaled ring opened wider at the sides than top and bottom. */}
      {active && !ring && <rect x={b.x - 2} y={b.y - 2} width={b.w + 4} height={b.h + 4} rx="5.5" fill="none" stroke={tone} strokeWidth="0.6" opacity="0.45" />}
      {ping && <rect rx="5.5" fill="none" stroke={tone} strokeWidth="0.8" className="fg-ping"
        style={{ '--x0': `${b.x}px`, '--y0': `${b.y}px`, '--w0': `${b.w}px`, '--h0': `${b.h}px`, '--x1': `${b.x - 5}px`, '--y1': `${b.y - 5}px`, '--w1': `${b.w + 10}px`, '--h1': `${b.h + 10}px` } as React.CSSProperties} />}
      <rect x={b.x} y={b.y} width={b.w} height={b.h} rx="4" fill={PAPER} stroke={ring ?? (active ? tone : LINE)} strokeWidth={ring ? 0.7 : 0.6} filter="url(#fg-card)" style={{ transition: T }} />
      <rect x={b.x} y={b.y} width={b.w} height={b.h} rx="4" fill={tone} opacity={active && !ring ? 0.07 : 0} style={{ transition: T }} />
      <circle cx={b.x + 6} cy={b.y + 6} r="3.4" fill={tone} opacity="0.13" />
      <g style={rotate ? { transform: 'rotate(180deg)', transformOrigin: `${b.x + 6}px ${b.y + 6}px` } : undefined}><Ico I={I} cx={b.x + 6} cy={b.y + 6} s={4} c={tone} /></g>
      <Txt x={b.x + 11.5} y={b.y + 7.4} s={3.8} w={700} c={tone}>{label}</Txt>
      {lines.map((l, i) => <g key={i}>{typeof l === 'string' ? <Txt x={b.x + 4} y={b.y + 14.6 + i * 6.4} s={4.2}>{l}</Txt> : l}</g>)}
    </g>
  );
}

/** An empty step slot in the flow — dashed and dim until its chapter fills it. */
const Slot = ({ b, tone }: { b: { x: number; y: number; w: number; h: number }; tone?: string }) => (
  <rect x={b.x} y={b.y} width={b.w} height={b.h} rx="4" fill={tone ?? 'none'} fillOpacity={tone ? 0.06 : 0} stroke={tone ?? '#C5D0DC'} strokeWidth="0.6" strokeDasharray="2.4 2" opacity={tone ? 1 : 0.7} style={{ transition: T }} />
);

/** A connector that DRAWS ITSELF in when it first appears, then carries a slow running dash. */
function Wire({ d, tone = '#A5BAD0' }: { d: string; tone?: string }) {
  return (
    <g>
      <path d={d} fill="none" stroke={tone} strokeWidth="0.9" pathLength={1} strokeDasharray="1" className="fg-draw" />
      <path d={d} fill="none" stroke={PAPER} strokeWidth="0.9" strokeDasharray="1.4 6" className="fg-flow" />
    </g>
  );
}


function GuideScene({ f, n }: { f: GFrame; n: number }) {
  const c = GUIDE_CHAPTERS[f.ch];
  const when = f.when ?? 0;
  const cond = f.cond ?? 0;
  const act = f.act ?? 0;
  const right = f.right ?? 'flow';
  const amber = f.sim ? AMBER : undefined;
  /* The flow step the form is filling right now: lit in its colour, so the eye goes from the field to the step. */
  const focus = f.ch === 0 ? 'when' : f.ch === 1 ? 'if' : f.ch === 2 ? (act === 2 || (act === 1 && f.cur[1] > A1 + 8) ? 'a2' : 'a1') : null;
  return (
    <svg viewBox="0 0 320 180" className="h-full w-full" role="img" aria-label={c.title}>
      <defs>
        <filter id="fg-card" x="-10%" y="-10%" width="120%" height="140%">
          <feDropShadow dx="0" dy="1.4" stdDeviation="1.8" floodColor="#101828" floodOpacity="0.09" />
        </filter>
        <filter id="fg-lift" x="-20%" y="-20%" width="140%" height="170%">
          <feDropShadow dx="0" dy="4" stdDeviation="4.5" floodColor="#101828" floodOpacity="0.2" />
        </filter>
        <pattern id="fg-dots" width="7" height="7" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="0.5" fill="#D5DEE8" /></pattern>
      </defs>
      <rect x="0" y="0" width="320" height="180" fill={c.ground} style={{ transition: T }} />
      <circle cx="296" cy="6" r="60" fill={c.blob} style={{ transition: T }} />
      <circle cx="14" cy="178" r="42" fill={c.blob} style={{ transition: T }} />

      {/* the editor's header: title, Cancel, Save Rule */}
      <g filter="url(#fg-card)">
        <rect x="8" y="5" width="304" height="17" rx="4.5" fill={PAPER} />
        <Txt x={15} y={16} s={6} w={600}>Add Rule</Txt>
        <rect x="230" y="8.5" width="28" height="10" rx="2.2" fill={PAPER} stroke={LINE} strokeWidth="0.6" />
        <Txt x={244} y={15.1} s={4.6} w={500} c={MUTED} anchor="middle">Cancel</Txt>
        <rect x="262" y="8.5" width="46" height="10" rx="2.2" fill={f.save === 'press' ? '#2D6CA0' : BLUE} style={{ transition: T }} />
        <Txt x={285} y={15.1} s={4.6} w={600} c={PAPER} anchor="middle">Save Rule</Txt>
      </g>

      {/* ── the form ───────────────────────────────────────────────────────────────────────── */}
      <rect x={F.x} y={F.top} width={F.w} height="148" rx="5" fill={PAPER} filter="url(#fg-card)" />

      <rect x="12" y="30" width="182" height="31" rx="3.5" fill="none" stroke={amber ?? 'transparent'} strokeWidth="0.9" style={{ transition: T }} />
      <Head y={36} I={History} tone={BLUE} lead="When" rest="this rule should run" />
      <Txt x={EV.x} y={45} s={3.6} c={MUTED}>Rule Event</Txt>
      <Txt x={EX.x} y={45} s={3.6} c={MUTED}>Execute on</Txt>
      <Txt x={AP.x} y={45} s={3.6} c={MUTED}>Applicable for</Txt>
      <Sel x={EV.x} y={SEL_Y} w={EV.w} v={when >= 2 ? 'Form is filled in' : undefined} ph="Choose an event" lit={when === 1} />
      <Sel x={EX.x} y={SEL_Y} w={EX.w} v={when >= 3 ? 'On Create' : undefined} ph="Create or edit" />
      <Sel x={AP.x} y={SEL_Y} w={AP.w} v={when >= 4 ? 'Everyone' : undefined} ph="Choose people" />

      <rect x="12" y="66" width="182" height="48" rx="3.5" fill="none" stroke={amber ?? 'transparent'} strokeWidth="0.9" style={{ transition: T }} />
      <Head y={72} I={Split} tone={ORANGE} lead="Check if" rest="these conditions match" rotate />
      <rect x="14" y="77" width="178" height="33" rx="3" fill="#F8FAFC" />
      {cond === 0 ? <AddRow y={R1} text="Add condition" /> : (
        <g className="pt-fade">
          <Txt x={18} y={R1 + 6.7} s={4.2} c={MUTED}>Where</Txt>
          <Sel x={36} y={R1} w={44} v="Priority" />
          <Sel x={83} y={R1} w={22} v="is" />
          <Sel x={108} y={R1} w={80} v="High" />
        </g>
      )}
      {cond === 1 && <g className="pt-fade"><Ico I={Plus} cx={21} cy={R2 + 5} s={4.2} c={BLUE} /><Txt x={25} y={R2 + 6.6} s={4.4} w={500} c={BLUE}>Add condition</Txt></g>}
      {cond === 2 && (
        <g className="pt-fade">
          <Txt x={18} y={R2 + 6.7} s={4.2} w={600} c={ORANGE}>And</Txt>
          <Sel x={36} y={R2} w={44} v="Category" />
          <Sel x={83} y={R2} w={22} v="is" />
          <Sel x={108} y={R2} w={80} v="Network" />
        </g>
      )}

      <Head y={120} I={Workflow} tone="#89C540" lead="Then" rest="choose what the rule should do" />
      <rect x="14" y="125" width="178" height="33" rx="3" fill="#F8FAFC" />
      {act === 0 ? <AddRow y={A1} text="Add action" /> : (
        <g className="pt-fade">
          <Sel x={18} y={A1} w={46} v="Mandate" />
          <Sel x={67} y={A1} w={121} v="Urgency" />
        </g>
      )}
      {act === 1 && <g className="pt-fade"><Ico I={Plus} cx={21} cy={A2 + 5} s={4.2} c={BLUE} /><Txt x={25} y={A2 + 6.6} s={4.4} w={500} c={BLUE}>Add action</Txt></g>}
      {act === 2 && (
        <g className="pt-fade">
          <rect x="15" y={A2 - 2} width="176" height="14" rx="2.5" fill={f.clash ? '#FEF3F2' : 'transparent'} style={{ transition: T }} />
          <Sel x={18} y={A2} w={46} v="Hide" fill={f.clash ? '#FFF8F7' : PAPER} />
          <Sel x={67} y={A2} w={f.clash ? 108 : 121} v="Description" fill={f.clash ? '#FFF8F7' : PAPER} />
          {f.clash && (
            <g className="pt-pop">
              <circle cx={184} cy={A2 + 5} r="4.4" fill="#FEE2E2" />
              <Ico I={AlertTriangle} cx={184} cy={A2 + 4.8} s={5} c={RED} />
            </g>
          )}
        </g>
      )}

      {/* the Rule Event menu */}
      {when === 1 && (
        <g className="pt-fade" filter="url(#fg-lift)">
          <rect x={EV.x} y="58" width="96" height="33" rx="3" fill={PAPER} />
          {['While the form is being filled', 'When the form opens', 'When the form is submitted'].map((t, i) => (
            <g key={t}>
              {i === 0 && <rect x={EV.x + 2} y={61 + i * 9.6} width="92" height="8.6" rx="2" fill="#EAF3FB" />}
              <Txt x={EV.x + 5} y={66.6 + i * 9.6} s={4.3} w={i === 0 ? 600 : 400} c={i === 0 ? BLUE : INK}>{t}</Txt>
            </g>
          ))}
        </g>
      )}

      {/* ── the right side: the flow, or the Rule check panel ─────────────────────────────────── */}
      <rect x={RX} y={F.top} width={RW} height="148" rx="5" fill={PAPER} filter="url(#fg-card)" />
      {right === 'flow' ? (
        <g key="flow" className="pt-fade">
          <rect x={RX} y={F.top + 12} width={RW} height="136" fill="url(#fg-dots)" />
          <Txt x={RX + 6} y={F.top + 8.4} s={4.6} w={600} c={MUTED}>How it works</Txt>
          {/* ⚠️ The flow is a PICTURE of the rule for this guide, not a preview the builder has — said on it. */}
          <rect x={RX + 62} y={F.top + 3.6} width="41" height="7" rx="3.5" fill="#F1F5F9" />
          <Txt x={RX + 82.5} y={F.top + 8.4} s={3.6} w={600} c={MUTED} anchor="middle">For reference only</Txt>

          {/* connectors */}
          {cond > 0 && <Wire key="w1" d={`M258 ${WN.y + WN.h} L258 ${IN.y}`} />}
          {act > 0 && <Wire key="w2" d={`M258 ${IN.y + IN.h} L258 ${HUB.cy - HUB.r}`} />}
          {act > 0 && <Wire key="w3" d={`M253 ${HUB.cy + 4} C240 ${HUB.cy + 8} 231 ${HUB.cy + 9} 231 ${AN1.y}`} />}
          {act > 1 && <Wire key="w4" d={`M263 ${HUB.cy + 4} C276 ${HUB.cy + 8} 285 ${HUB.cy + 9} 285 ${AN2.y}`} />}

          {when >= 2
            ? <FNode key="wn" b={WN} tone={BLUE} I={History} label="WHEN" ping={f.flash === 'when'} active={focus === 'when'}
                lines={[<Txt key="l" x={WN.x + 4} y={WN.y + 15} s={4.2}>{['Form is filled in', 'Form filled · On Create', 'Filled · Create · Everyone'][when - 2]}</Txt>]} />
            : <Slot b={WN} tone={focus === 'when' ? BLUE : undefined} />}
          {cond > 0
            ? <FNode key="in" b={IN} tone={ORANGE} I={Split} label="CHECK IF" rotate ping={f.flash === 'if'} active={focus === 'if'}
                lines={['Priority is High', ...(cond > 1 ? [<Txt key="2" x={IN.x + 4} y={IN.y + 21} s={4.2}><tspan fill={ORANGE} fontWeight={600}>and </tspan>Category is Network</Txt>] : [])]} />
            : <Slot b={IN} tone={focus === 'if' ? ORANGE : undefined} />}
          <g style={{ opacity: act > 0 ? 1 : 0.5, transition: T }}>
            <circle cx={HUB.cx} cy={HUB.cy} r={HUB.r} fill={PAPER} stroke={act > 0 ? '#C5E1A5' : '#C5D0DC'} strokeWidth="0.6" strokeDasharray={act > 0 ? undefined : '2 1.6'} />
            <Txt x={HUB.cx} y={HUB.cy + 1.4} s={3.4} w={700} c={act > 0 ? GREEN : '#98A2B3'} anchor="middle">THEN</Txt>
          </g>
          {act > 0
            ? <FNode key="a1" b={AN1} tone="#89C540" I={Workflow} label="ACTION" ping={f.flash === 'a1'} active={focus === 'a1'} lines={[<Txt key="l" x={AN1.x + 4} y={AN1.y + 15.6} s={4.2}><tspan fontWeight={600}>Mandate</tspan> Urgency</Txt>]} />
            : <Slot b={AN1} tone={focus === 'a1' ? '#89C540' : undefined} />}
          {act > 1
            ? <FNode key="a2" b={AN2} tone="#89C540" I={Workflow} label="ACTION" ping={f.flash === 'a2'} active={focus === 'a2'} ring={f.clash ? RED : undefined}
                lines={[<Txt key="l" x={AN2.x + 4} y={AN2.y + 15.6} s={4.2}><tspan fontWeight={600}>Hide</tspan> Description</Txt>]} />
            : <Slot b={AN2} tone={focus === 'a2' ? '#89C540' : undefined} />}
        </g>
      ) : (
        /* the Rule check panel, on the tab the story is about */
        <g key={right} className="fg-slide">
          {(['Conflicts', 'Similar rules'] as const).map((t, i) => {
            const on = (right === 'conflicts') === (i === 0);
            const x = RX + 6 + i * 44;
            return (
              <g key={t}>
                <Txt x={x} y={F.top + 9} s={4.6} w={on ? 600 : 500} c={on ? BLUE : MUTED}>{t}</Txt>
                <rect x={x + (i ? 29 : 23)} y={F.top + 4.6} width="7" height="5.6" rx="1.2" fill={i ? '#FFF4E5' : '#FEF2F2'} />
                <Txt x={x + (i ? 32.5 : 26.5)} y={F.top + 8.8} s={3.8} w={700} c={i ? '#B45309' : RED} anchor="middle">1</Txt>
                {on && <rect x={x} y={F.top + 12} width={i ? 37 : 31} height="1.2" fill={BLUE} />}
              </g>
            );
          })}
          <line x1={RX} x2={RX + RW} y1={F.top + 13.2} y2={F.top + 13.2} stroke="#EEF2F6" strokeWidth="0.6" />
          {/* ⚠️ The two tabs below are drawn after the REAL rail (FormRuleInsights): the Similar tab's common
              card + accordion card with Open rule in its header and the blue footer; the Conflicts tab's
              By rule / By field + search, the open field accordion with its pair cards, and the help bar. */}
          {right === 'similar' ? (
            <g>
              {/* Common trigger, conditions & actions — folded */}
              <rect x={RX + 5} y="43" width={RW - 10} height="16" rx="3" fill={PAPER} stroke="#E8EDF3" strokeWidth="0.6" />
              <Ico I={ChevronRight} cx={RX + 10} cy={48} s={4} c="#7B8FA5" />
              <Txt x={RX + 14} y={49.4} s={4} w={600}>Common trigger, conditions &amp; actions</Txt>
              <Txt x={RX + 14} y={55.4} s={3.5} c="#98A2B3">shared by your rule and 1 similar rule</Txt>
              {/* the similar rule's own card */}
              <rect x={RX + 5} y="63" width={RW - 10} height="52" rx="3" fill={PAPER} stroke="#E8EDF3" strokeWidth="0.6" />
              <path d={`M${RX + 8} 63 h${RW - 16} a3 3 0 0 1 3 3 v10 h-${RW - 10} v-10 a3 3 0 0 1 3 -3 z`} fill="#F6F9FC" />
              <line x1={RX + 5} x2={RX + RW - 5} y1="76" y2="76" stroke="#E8EDF3" strokeWidth="0.6" />
              <Ico I={ChevronDown} cx={RX + 10} cy={69.6} s={4} c="#7B8FA5" />
              <Txt x={RX + 14} y={71.2} s={4.4} w={600}>Major Incident Rule</Txt>
              <Txt x={RX + RW - 8} y={71.2} s={3.8} w={500} c={BLUE} anchor="end">Open rule ↗</Txt>
              <Txt x={RX + 9} y={84} s={3.5} c="#7B8FA5">Matches your rule</Txt>
              <path d={`M${RX + 9.5} 88.6 l1.2 1.2 l2.2 -2.4`} fill="none" stroke="#16A34A" strokeWidth="0.8" strokeLinecap="round" />
              <Txt x={RX + 15} y={90.4} s={4.1}>Mandates Urgency</Txt>
              <Txt x={RX + 9} y={99} s={3.5} c="#7B8FA5">Its other actions</Txt>
              <circle cx={RX + 11} cy={104} r="0.9" fill="#98A2B3" />
              <Txt x={RX + 15} y={105.4} s={4.1}>Shows Category</Txt>
              {/* the advice, one line, pinned at the foot */}
              <rect x={RX} y="157" width={RW} height="17" fill="#EFF6FD" />
              <Ico I={Info} cx={RX + 7} cy={165.5} s={4} c={BLUE} />
              <Txt x={RX + 12} y={166.9} s={3.6} c="#1D3A5C">Add your actions to one of these rules…</Txt>
              <Ico I={Info} cx={RX + RW - 6} cy={165.5} s={4} c="#7B8FA5" />
            </g>
          ) : (
            <g>
              {/* By rule / By field + search */}
              <rect x={RX + 5} y="42" width="50" height="10" rx="2" fill="#EEF2F6" />
              <Txt x={RX + 16} y={48.6} s={3.8} w={500} c={MUTED} anchor="middle">By rule</Txt>
              <rect x={RX + 30.5} y="43" width="23.5" height="8" rx="1.6" fill={PAPER} />
              <Txt x={RX + 42.2} y={48.6} s={3.8} w={600} anchor="middle">By field</Txt>
              <rect x={RX + 60} y="42" width={RW - 65} height="10" rx="2" fill={PAPER} stroke="#DFE5ED" strokeWidth="0.5" />
              <Ico I={Search} cx={RX + 64.5} cy={47} s={3.6} c="#98A2B3" />
              <Txt x={RX + 68} y={48.4} s={3.6} c="#98A2B3">Search fields…</Txt>
              {/* the open field, tinted red, with its pair of cards */}
              <rect x={RX + 5} y="56" width={RW - 10} height="66" rx="3" fill={PAPER} stroke="#FCA5A5" strokeWidth="0.6" />
              <path d={`M${RX + 8} 56 h${RW - 16} a3 3 0 0 1 3 3 v10 h-${RW - 10} v-10 a3 3 0 0 1 3 -3 z`} fill="#FEF3F2" />
              <line x1={RX + 5} x2={RX + RW - 5} y1="69" y2="69" stroke="#FCA5A5" strokeWidth="0.6" />
              <Ico I={ChevronDown} cx={RX + 10} cy={62.6} s={4} c="#7B8FA5" />
              <Txt x={RX + 14} y={64.2} s={4.4} w={600}>Description</Txt>
              <Txt x={RX + 9} y={77.6} s={4} w={600}>Status Visibility Rule</Txt>
              {([['Current Rule', BLUE, 'Hides the', 'On Create'], ['Conflicting Rule', RED, 'Shows the', 'On Create and Edit']] as const).map(([k, tone, verb, ex], i) => {
                const x = RX + 8 + i * 47;
                return (
                  <g key={k}>
                    <rect x={x} y="81" width="45" height="37" rx="2.5" fill="#F6F9FC" />
                    <Txt x={x + 3.5} y={87.6} s={3.6} c={tone}>{k}</Txt>
                    <Txt x={x + 3.5} y={95} s={4.4}>{verb}</Txt>
                    <Txt x={x + 3.5} y={100.6} s={4.4}>description</Txt>
                    <Txt x={x + 3.5} y={111.6} s={3.4} c="#98A2B3">{ex}</Txt>
                  </g>
                );
              })}
              {/* another clashing field, folded */}
              <rect x={RX + 5} y="126" width={RW - 10} height="13" rx="3" fill="#F6F9FC" stroke="#E8EDF3" strokeWidth="0.6" />
              <Ico I={ChevronRight} cx={RX + 10} cy={132.6} s={4} c="#7B8FA5" />
              <Txt x={RX + 14} y={134.2} s={4.4} w={600}>Status</Txt>
              {/* the help bar */}
              <line x1={RX} x2={RX + RW} y1="157" y2="157" stroke="#EEF2F6" strokeWidth="0.6" />
              <Ico I={Lightbulb} cx={RX + 7} cy={165.5} s={4} c="#F59E0B" />
              <Txt x={RX + 12} y={166.9} s={3.8} w={500} c="#364658">How do I resolve these conflicts? ›</Txt>
              <Ico I={Info} cx={RX + RW - 6} cy={165.5} s={4} c="#7B8FA5" />
            </g>
          )}
        </g>
      )}

      {/* Saved */}
      {f.save === 'done' && (
        <g className="pt-pop">
          <rect x="44" y="150" width="112" height="20" rx="6" fill={INK} filter="url(#fg-lift)" />
          <circle cx="57" cy="160" r="5" fill="#16A34A" />
          <path d="M54.8 160 l1.6 1.6 l3 -3.2" stroke={PAPER} strokeWidth="1.1" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <Txt x={67} y={162.2} s={6} w={600} c={PAPER}>Rule saved</Txt>
          {[[-8, -6], [6, -9], [16, -2], [-14, 3]].map(([dx, dy], i) => (
            <circle key={i} cx={285 + dx} cy={13 + dy} r="1.5" fill={['#F59E0B', '#10B981', YOU, BLUE][i]} className="pt-burst" style={{ animationDelay: `${i * 70}ms` }} />
          ))}
        </g>
      )}

      <Cursor at={f.cur} press={f.press} n={n} />
    </svg>
  );
}


/* ── the dock ─────────────────────────────────────────────────────────────────────────────────── */

/**
 * ⚠️ It AUTO-PLAYS until you take over: unattended it runs chapter to chapter; once you press
 * Previous, Next or a dot, that chapter loops until you move on (the Editor basics rule).
 * ⚠️ `right` is passed in — the card sits in the corner of the FORM, clear of the Rule check rail.
 */
export function FormRuleGuideDock({ onClose, right = 20 }: { onClose: () => void; right?: number }) {
  const [at, setAt] = useState(0);
  const [driven, setDriven] = useState(false);
  const [big, setBig] = useState(false);
  const elapsed = useRef(0);
  useEffect(() => {
    if (!big) return;
    const on = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); setBig(false); } };
    window.addEventListener('keydown', on, true);
    return () => window.removeEventListener('keydown', on, true);
  }, [big]);

  const frame = FRAMES[at];
  const ch = frame.ch;
  const last = GUIDE_CHAPTERS.length - 1;
  const chapter = GUIDE_CHAPTERS[ch];

  useEffect(() => {
    let raf = 0;
    let prev = performance.now();
    const tick = (now: number) => {
      elapsed.current += now - prev;
      prev = now;
      if (elapsed.current >= frame.ms) {
        elapsed.current = 0;
        if (at < chEnd(ch)) { setAt(at + 1); return; }
        setAt(driven ? chStart(ch) : chStart(ch === last ? 0 : ch + 1));
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [at, driven]); // eslint-disable-line react-hooks/exhaustive-deps

  const go = (c: number) => {
    elapsed.current = 0;
    setDriven(true);
    setAt(chStart(Math.max(0, Math.min(last, c))));
  };

  const card = (
    <div
      data-form-rule-guide
      onClick={(e) => e.stopPropagation()}
      style={big ? undefined : { right }}
      className={`overflow-hidden rounded-2xl bg-[#1F2937] shadow-[0_24px_48px_-12px_rgba(0,0,0,0.55)] ${big ? 'w-[min(960px,calc(100vw-64px))]' : 'fixed bottom-5 z-[9000] w-[360px]'}`}
    >
      <div className="flex items-center gap-2 px-4 pb-2 pt-3">
        <span className="flex flex-1 items-center gap-1.5 text-[12px] font-medium text-white/55"><CirclePlay size={14} />Rule builder basics</span>
        <button type="button" onClick={() => setBig((v) => !v)} title={big ? 'Exit full screen' : 'Full screen'} aria-label={big ? 'Exit full screen' : 'Full screen'}
          className="inline-flex size-6 items-center justify-center rounded text-white/60 transition-colors hover:bg-white/10 hover:text-white">
          {big ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
        </button>
        <button type="button" onClick={onClose} title="Close — replay it any time from the Help guide tab" aria-label="Close"
          className="inline-flex size-6 items-center justify-center rounded text-white/60 transition-colors hover:bg-white/10 hover:text-white">
          <X size={14} />
        </button>
      </div>

      <div className="px-3">
        <div className="aspect-[320/180] overflow-hidden rounded-xl"><GuideScene f={frame} n={at} /></div>
      </div>

      <div className="flex justify-center gap-1.5 pt-3">
        {GUIDE_CHAPTERS.map((c, n) => (
          <button key={c.name} type="button" onClick={() => go(n)} aria-label={`Go to ${c.name}`}
            className={`h-1.5 rounded-full transition-all ${n === ch ? 'w-4 bg-white' : 'w-1.5 bg-white/30 hover:bg-white/55'}`} />
        ))}
      </div>

      <div className="px-4 pt-2.5">
        <h3 className="text-[15px] font-semibold leading-tight text-white">{chapter.title}</h3>
        {/* A floor for two lines, so the buttons under it never jump between chapters. */}
        <p className="mt-1 min-h-[38px] text-[12.5px] leading-[1.5] text-white/70">{chapter.desc}</p>
      </div>

      <div className="flex items-center justify-between gap-2 px-4 pb-4 pt-3">
        <button type="button" onClick={() => go(ch - 1)} disabled={ch === 0}
          className="inline-flex h-8 items-center gap-1 rounded border border-white/20 px-3 text-[12.5px] font-medium text-white/85 transition-colors hover:bg-white/10 disabled:cursor-default disabled:opacity-35 disabled:hover:bg-transparent">
          <ChevronLeft size={14} /> Previous
        </button>
        {ch < last ? (
          <button type="button" onClick={() => go(ch + 1)}
            className="inline-flex h-8 items-center gap-1 rounded bg-[#3D8BD0] px-3.5 text-[12.5px] font-semibold text-white transition-colors hover:bg-[#2D6CA0]">
            Next: {GUIDE_CHAPTERS[ch + 1].name} <ChevronRight size={14} />
          </button>
        ) : (
          <button type="button" onClick={() => go(0)}
            className="inline-flex h-8 items-center gap-1.5 rounded bg-[#3D8BD0] px-3.5 text-[12.5px] font-semibold text-white transition-colors hover:bg-[#2D6CA0]">
            <RotateCcw size={13} /> Watch again
          </button>
        )}
      </div>
    </div>
  );
  return big
    ? <div className="fixed inset-0 z-[10100] flex items-center justify-center bg-black/55 p-8" onClick={() => setBig(false)}>{card}</div>
    : card;
}

/* ── the Help guide tab ───────────────────────────────────────────────────────────────────────── */

interface GuideStep { I: LucideIcon; tone: string; tint: string; title: string; points: React.ReactNode[]; example?: React.ReactNode; rotate?: boolean }

const STEPS: GuideStep[] = [
  {
    I: History, tone: BLUE, tint: '#E2EDF5', title: 'When — decide when the rule runs',
    points: [
      <><b>Select Rule Event</b> — when the form is checked: while it is being filled, when it opens, or when it is submitted.</>,
      <><b>Execute on</b> — new requests (On Create), existing requests (On Edit), or both.</>,
      <><b>Select Rule Applicable for</b> — who the rule works for: requesters, technicians, or everyone.</>,
    ],
  },
  {
    I: Split, tone: ORANGE, tint: 'rgba(245,133,24,0.1)', title: 'Check if — add conditions', rotate: true,
    points: [
      <>A condition is a simple check on a field, like <b>Priority is High</b>.</>,
      <>Add more checks with <b>AND</b> (all must be true) or <b>OR</b> (any one is enough).</>,
      <>Use a <b>condition group</b> to keep checks that belong together in one place.</>,
      <>No conditions? The rule runs every time its event happens.</>,
    ],
  },
  {
    I: Workflow, tone: '#89C540', tint: '#F3F9EC', title: 'Then — choose what happens',
    points: [
      <>Pick an action: <b>Hide</b>, <b>Show</b>, <b>Mandate</b>, <b>Make optional</b>, <b>Disable</b>, <b>Enable</b>, <b>Set value</b> or <b>Clear value</b>.</>,
      <>Pick the field or fields it changes. <b>Set value</b> also asks for the value.</>,
      <>Add as many actions as you need — they all run together.</>,
    ],
    example: <>When the form is being filled, <b>if</b> Priority is High, <b>then</b> make Urgency mandatory.</>,
  },
  {
    I: Copy, tone: AMBER, tint: '#FFF4E5', title: 'Similar rules — reuse before you add',
    points: [
      <>A rule is <b>similar</b> when it already uses the same event and the same conditions as yours.</>,
      <>Instead of creating another rule, open it and add your actions there — fewer rules are easier to look after.</>,
      <>You will find them in the <b>Similar rules</b> tab.</>,
    ],
  },
  {
    I: AlertTriangle, tone: RED, tint: '#FEF2F2', title: 'Conflicts — fix them before saving',
    points: [
      <>A <b>conflict</b> means another rule changes the same field the opposite way — for example one hides Status and another shows it.</>,
      <>The action row turns red. Click its <b>⚠</b> to see which rule it clashes with.</>,
      <>Fix it by changing your action, editing the other rule, or changing the conditions so both never run at the same time.</>,
    ],
  },
  {
    I: Save, tone: MUTED, tint: '#EEF2F6', title: 'Save the rule',
    points: [
      <>Give the rule a clear name, so others know what it does from the list.</>,
      <>Click <b>Save Rule</b>. It starts working on the form right away.</>,
      <>Rules run in the order of the Form Rules list — drag a rule there to change its turn.</>,
    ],
  },
];

export function FormRuleHelpGuide({ onWatch }: { onWatch: () => void }) {
  const [open, setOpen] = useState<number[]>([0, 1, 2]);
  const toggle = (i: number) => setOpen((o) => (o.includes(i) ? o.filter((x) => x !== i) : [...o, i]));
  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Watch first — the video says in one minute what the steps below say in words. */}
      <div className="flex items-center gap-3 rounded-lg border border-[#D6E6F5] bg-[#F3F8FD] p-3">
        <span className="flex size-9 flex-shrink-0 items-center justify-center rounded-full bg-white text-[#3D8BD0] shadow-sm"><CirclePlay size={18} /></span>
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-semibold text-[#1D2A3E]">New to form rules?</div>
          <div className="truncate text-[12px] text-[#64748B]">See how a rule is built in one minute.</div>
        </div>
        <button type="button" onClick={onWatch}
          className="inline-flex h-8 flex-shrink-0 items-center gap-1.5 rounded border border-[#3D8BD0] bg-white px-3 text-[12px] font-medium text-[#3D8BD0] transition-colors hover:bg-[#EBF5FF]">
          <CirclePlay size={14} /> Watch guide
        </button>
      </div>

      <div>
        <div className="text-[14px] font-semibold text-[#1D2A3E]">How to build a form rule</div>
        <p className="mt-0.5 text-[12px] text-[#64748B]">A rule changes the request form on its own: <b className="font-medium text-[#364658]">when</b> something happens, <b className="font-medium text-[#364658]">check if</b> it matches, <b className="font-medium text-[#364658]">then</b> do something to a field.</p>
      </div>

      <ol className="flex flex-col">
        {STEPS.map((s, i) => {
          const on = open.includes(i);
          const lastStep = i === STEPS.length - 1;
          return (
            <li key={s.title} className="relative flex gap-3">
              {/* the rail between the step badges */}
              {!lastStep && <span className="absolute bottom-0 left-[13px] top-8 w-px bg-[#E2E8F0]" />}
              <span className="relative z-[1] mt-0.5 flex size-[27px] flex-shrink-0 items-center justify-center rounded-full border border-[#DFE5ED] bg-white text-[#364658]">
                <span className="text-[12px] font-semibold">{i + 1}</span>
              </span>
              <div className={'min-w-0 flex-1 ' + (lastStep ? '' : 'pb-4')}>
                <button type="button" onClick={() => toggle(i)} aria-expanded={on}
                  className="flex w-full items-center gap-2 rounded py-1 text-left">
                  <span className="min-w-0 flex-1 text-[13px] font-semibold text-[#1D2A3E]">{s.title}</span>
                  <ChevronDown size={15} className={'flex-shrink-0 text-[#98A2B3] transition-transform ' + (on ? 'rotate-180' : '')} />
                </button>
                {on && (
                  <div className="mt-1.5">
                    <ul className="space-y-1.5">
                      {s.points.map((p, k) => (
                        <li key={k} className="flex gap-2 text-[12.5px] leading-[1.55] text-[#475569] [&_b]:font-semibold [&_b]:text-[#1D2A3E]">
                          <span className="mt-[7px] size-1.5 flex-shrink-0 rounded-full" style={{ backgroundColor: "#98A2B3" }} />
                          <span className="min-w-0">{p}</span>
                        </li>
                      ))}
                    </ul>
                    {s.example && (
                      <div className="mt-2.5 rounded-md bg-[#F8FAFC] px-3 py-2 text-[12px] leading-[1.55] text-[#475569] [&_b]:font-semibold [&_b]:text-[#1D2A3E]">
                        <div className="mb-0.5 text-[10.5px] font-semibold uppercase tracking-wide text-[#7B8FA5]">Example</div>
                        {s.example}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
