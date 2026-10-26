import { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle, ArrowUpRight, BookOpen, ChevronDown, ChevronLeft, ChevronRight, CirclePlay, Copy, History, Maximize2, Minimize2, Plus,
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
 * ⚠️ The scene is the builder beside a SKELETON of the Help guide panel (Zeni, 26 Oct 2026 — the flow
 * picture was removed). Similar rules and Conflicts arrive as the panel's summary cards, in the real order.
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
    desc: 'Choose the rule event, whether it runs on new or existing requests, and who it applies to.',
    ground: '#EFF6FF', blob: '#DBEAFE' },
  { name: 'Check if', title: 'Check if — add conditions',
    desc: 'Add checks like “Priority is High”. Once one is set, rules with the same trigger show as Similar rules.',
    ground: '#FFF7ED', blob: '#FFEDD5' },
  { name: 'Then', title: 'Then — choose what happens',
    desc: 'Pick an action and its field. If another rule does the opposite to that field, Conflicts appear.',
    ground: '#F0FDF4', blob: '#DCFCE7' },
  { name: 'Similar', title: 'Similar rules',
    desc: 'These rules already use your trigger and conditions — add your actions to one of them instead.',
    ground: '#FEFCE8', blob: '#FEF3C7' },
  { name: 'Conflicts', title: 'Conflicts',
    desc: 'Another rule changes this field the opposite way, so the row turns red. Resolve it before saving.',
    ground: '#FEF2F2', blob: '#FEE2E2' },
  { name: 'Save', title: 'Save the rule',
    desc: 'Check the rule reads the way you want, then click Save Rule. It starts working right away.',
    ground: '#EEF2FF', blob: '#E0E7FF' },
];

/**
 * ⚠️ THE SCENE IS THE BUILDER BESIDE THE HELP GUIDE (Zeni, 26 Oct 2026 — the flow picture was removed):
 * the form fills in on the left, larger; on the right a SKELETON of the V3 Help guide panel. The
 * Similar rules card arrives the moment a trigger and a condition are filled, and the Conflicts card the
 * moment a clashing action is — the real editor's order — each pushing the guide down, as in the product.
 * The Similar and Conflicts chapters only RING their card; no drawer opens.
 *
 * ⚠️ MOVE, THEN CLICK. A frame that moves the cursor changes nothing else; the click — and whatever it
 * does — is the NEXT frame, so a field never fills in before the cursor has reached it.
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
  /** The trigger and conditions ring amber — they are what the similar rules share. */
  sim?: boolean;
  /** Which summary card is ringed (the Similar / Conflicts chapters). */
  hl?: 'similar' | 'conflicts';
  save?: 'press' | 'done';
}

const DONE = { when: 4, cond: 2, act: 2 } as const;
const REST: [number, number] = [150, 168];

/* Form geometry, drawn at its old size and SCALED up by K about (FX, FY) so the form fills more of the
   frame. `fm` puts a point drawn in form space where it lands on screen — every cursor target uses it. */
const K = 1.12;
const FX = 8;
const FY = 24;
const fm = ([x, y]: [number, number]): [number, number] => [FX + (x - FX) * K, FY + (y - FY) * K];

const F = { x: 8, w: 190, top: 26, h: 136 };
const SEL_Y = 47;
const EV = { x: 14, w: 60 };
const EX = { x: 78, w: 52 };
const AP = { x: 134, w: 58 };
const R1 = 80;
const R2 = 94;
const A1 = 128;
const A2 = 142;
const mid = (b: { x: number; w: number }, y = SEL_Y + 5): [number, number] => fm([b.x + b.w / 2, y]);

/* The Help guide panel on the right — narrower than the form. */
const P = { x: 226, y: 26, w: 88, h: 152 };
const CARD_Y = P.y + 5;
const CARD_H = 24;
const GAP = 3;
const halfW = (P.w - 8 - GAP) / 2;
const SIM_C: [number, number] = [P.x + 4 + halfW / 2, CARD_Y + CARD_H / 2 + 2];
const CON_C: [number, number] = [P.x + 4 + halfW + GAP + halfW / 2, CARD_Y + CARD_H / 2 + 2];

/* ⚠️ Written at the pace it should PLAY. A move frame is long enough for the glide to finish. */
const FRAMES: GFrame[] = [
  /* When — all three: Rule Event, Execute on, Applicable for */
  { ch: 0, ms: 600, cur: REST },
  { ch: 0, ms: 800, cur: mid(EV) },
  { ch: 0, ms: 500, cur: mid(EV), press: true, when: 1 },
  { ch: 0, ms: 750, cur: fm([46, 65]), when: 1 },
  { ch: 0, ms: 600, cur: fm([46, 65]), press: true, when: 2 },
  { ch: 0, ms: 750, cur: mid(EX), when: 2 },
  { ch: 0, ms: 500, cur: mid(EX), press: true, when: 3 },
  { ch: 0, ms: 750, cur: mid(AP), when: 3 },
  { ch: 0, ms: 1600, cur: mid(AP), press: true, when: 4 },
  /* Check if — the first condition completes the trigger + condition, so Similar rules arrives */
  { ch: 1, ms: 850, cur: fm([96, R1 + 5]), when: 4 },
  { ch: 1, ms: 1300, cur: fm([96, R1 + 5]), press: true, when: 4, cond: 1 },
  { ch: 1, ms: 750, cur: fm([40, R2 + 5]), when: 4, cond: 1 },
  { ch: 1, ms: 1600, cur: fm([40, R2 + 5]), press: true, when: 4, cond: 2 },
  /* Then — the second action clashes with another rule, so Conflicts arrives */
  { ch: 2, ms: 850, cur: fm([96, A1 + 5]), when: 4, cond: 2 },
  { ch: 2, ms: 900, cur: fm([96, A1 + 5]), press: true, when: 4, cond: 2, act: 1 },
  { ch: 2, ms: 750, cur: fm([40, A2 + 5]), when: 4, cond: 2, act: 1 },
  { ch: 2, ms: 1900, cur: fm([40, A2 + 5]), press: true, ...DONE },
  /* Similar — the card is ringed, and so is what it shares */
  { ch: 3, ms: 800, cur: REST, ...DONE },
  { ch: 3, ms: 900, cur: SIM_C, ...DONE, sim: true, hl: 'similar' },
  { ch: 3, ms: 2200, cur: SIM_C, ...DONE, sim: true, hl: 'similar' },
  /* Conflicts — the card is ringed beside the red row */
  { ch: 4, ms: 800, cur: REST, ...DONE },
  { ch: 4, ms: 900, cur: CON_C, ...DONE, hl: 'conflicts' },
  { ch: 4, ms: 2200, cur: CON_C, ...DONE, hl: 'conflicts' },
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

/** A grey skeleton bar. */
const Bar = ({ x, y, w, h = 2.2, c = '#E2E8F0' }: { x: number; y: number; w: number; h?: number; c?: string }) =>
  <rect x={x} y={y} width={w} height={h} rx={h / 2} fill={c} />;

/** One summary card at the top of the guide panel, drawn after RelatedSummaryCards. */
function SummaryCard({ x, w, kind, ring }: { x: number; w: number; kind: 'similar' | 'conflicts'; ring?: boolean }) {
  const sim = kind === 'similar';
  const tone = sim ? '#B45309' : RED;
  const b = { x, y: CARD_Y, w, h: CARD_H };
  return (
    <g className="pt-pop">
      <rect x={b.x} y={b.y} width={b.w} height={b.h} rx="3" fill={sim ? '#FFFBEB' : '#FEF2F2'} stroke={sim ? '#E9A23B' : '#F87171'} strokeWidth={ring ? 1 : 0.6} style={{ transition: T }} />
      {ring && <rect x={b.x - 2} y={b.y - 2} width={b.w + 4} height={b.h + 4} rx="4.5" fill="none" stroke={sim ? AMBER : RED} strokeWidth="0.8" opacity="0.5" />}
      <rect rx="4" fill="none" stroke={sim ? AMBER : RED} strokeWidth="0.7" className="fg-ping"
        style={{ '--x0': `${b.x}px`, '--y0': `${b.y}px`, '--w0': `${b.w}px`, '--h0': `${b.h}px`, '--x1': `${b.x - 4}px`, '--y1': `${b.y - 4}px`, '--w1': `${b.w + 8}px`, '--h1': `${b.h + 8}px` } as React.CSSProperties} />
      <Txt x={b.x + 3.5} y={b.y + 9.6} s={7.4} w={700} c={tone}>2</Txt>
      <Txt x={b.x + 9} y={b.y + 9} s={3.9} w={600} c={tone}>{sim ? 'Similar rules' : 'Conflicts'}</Txt>
      <Ico I={ArrowUpRight} cx={b.x + b.w - 4} cy={b.y + 4.5} s={3.6} c={tone} />
      <Bar x={b.x + 3.5} y={b.y + 14} w={b.w - 9} h={1.8} c={sim ? '#F5D9A8' : '#FBC6C6'} />
      <Bar x={b.x + 3.5} y={b.y + 18} w={(b.w - 9) * 0.65} h={1.8} c={sim ? '#F5D9A8' : '#FBC6C6'} />
    </g>
  );
}

/** The Help guide panel, as a skeleton: watch card, title, a section and its topic rows. */
function GuideSkeleton({ top }: { top: number }) {
  const x = P.x + 4;
  const w = P.w - 8;
  return (
    <g style={{ transform: `translateY(${top}px)`, transition: 'transform 420ms cubic-bezier(0.4,0,0.2,1)' }}>
      {/* the Watch video card */}
      <rect x={x} y="0" width={w} height="15" rx="2.5" fill="#F3F8FD" stroke="#D6E6F5" strokeWidth="0.5" />
      <circle cx={x + 7} cy="7.5" r="4" fill={PAPER} />
      <Ico I={CirclePlay} cx={x + 7} cy={7.5} s={4.4} c={BLUE} />
      <Bar x={x + 13} y={4.4} w={30} c="#9FB3C8" />
      <Bar x={x + 13} y={8.8} w={40} c="#CBD5E1" />
      <rect x={x + w - 19} y="4" width="16" height="7" rx="1.5" fill={PAPER} stroke={BLUE} strokeWidth="0.45" />
      <Txt x={x + w - 11} y={8.6} s={3.1} w={600} c={BLUE} anchor="middle">Watch</Txt>
      {/* Form Rules Guide */}
      <rect x={x} y="20.5" width="1.2" height="6" rx="0.6" fill="#1D2A3E" />
      <Txt x={x + 3.5} y={25.6} s={4.6} w={600} c="#1D2A3E">Form Rules Guide</Txt>
      {/* How Form Rules Work */}
      <rect x={x} y="31" width="6" height="6" rx="1.2" fill="#1D2A3E" />
      <Ico I={BookOpen} cx={x + 3} cy={34} s={3.6} c={PAPER} />
      <Bar x={x + 9} y={32.9} w={40} h={2.4} c="#64748B" />
      <Bar x={x} y={41} w={w} />
      <Bar x={x} y={45} w={w * 0.72} />
      {[0, 1, 2, 3, 4].map((i) => {
        const y = 51 + i * 20.5;
        return (
          <g key={i}>
            <rect x={x} y={y} width={w} height="18" rx="2.5" fill="#F4F6FA" />
            <circle cx={x + 5} cy={y + 5} r="1.8" fill="#CBD5E1" />
            <Bar x={x + 9} y={y + 3.9} w={28 - (i % 2) * 6} h={2.2} c="#94A3B8" />
            <Bar x={x + 9} y={y + 9} w={w - 14} h={1.8} />
            <Bar x={x + 9} y={y + 12.6} w={(w - 14) * 0.6} h={1.8} />
          </g>
        );
      })}
    </g>
  );
}

function GuideScene({ f, n }: { f: GFrame; n: number }) {
  const c = GUIDE_CHAPTERS[f.ch];
  const when = f.when ?? 0;
  const cond = f.cond ?? 0;
  const act = f.act ?? 0;
  const amber = f.sim ? AMBER : undefined;
  /* The real editor's order: a trigger and one complete condition → Similar rules; the clashing action → Conflicts. */
  const showSim = when >= 4 && cond >= 1;
  const showCon = act >= 2;
  const clash = showCon;
  const both = showSim && showCon;
  const cardW = both ? halfW : P.w - 8;
  return (
    <svg viewBox="0 0 320 180" className="h-full w-full" role="img" aria-label={c.title}>
      <defs>
        <filter id="fg-card" x="-10%" y="-10%" width="120%" height="140%">
          <feDropShadow dx="0" dy="1.4" stdDeviation="1.8" floodColor="#101828" floodOpacity="0.09" />
        </filter>
        <filter id="fg-lift" x="-20%" y="-20%" width="140%" height="170%">
          <feDropShadow dx="0" dy="4" stdDeviation="4.5" floodColor="#101828" floodOpacity="0.2" />
        </filter>
        <clipPath id="fg-panel"><rect x={P.x} y={P.y} width={P.w} height={P.h} rx="5" /></clipPath>
      </defs>
      <rect x="0" y="0" width="320" height="180" fill={c.ground} style={{ transition: T }} />
      <circle cx="296" cy="6" r="60" fill={c.blob} style={{ transition: T }} />
      <circle cx="14" cy="178" r="42" fill={c.blob} style={{ transition: T }} />

      {/* the editor's header: title, Cancel, Save Rule */}
      <g filter="url(#fg-card)">
        <rect x="8" y="4" width="304" height="16" rx="4.5" fill={PAPER} />
        <Txt x={15} y={14.6} s={6} w={600}>Add Rule</Txt>
        <rect x="230" y="7" width="28" height="10" rx="2.2" fill={PAPER} stroke={LINE} strokeWidth="0.6" />
        <Txt x={244} y={13.6} s={4.6} w={500} c={MUTED} anchor="middle">Cancel</Txt>
        <rect x="262" y="7" width="46" height="10" rx="2.2" fill={f.save === 'press' ? '#2D6CA0' : BLUE} style={{ transition: T }} />
        <Txt x={285} y={13.6} s={4.6} w={600} c={PAPER} anchor="middle">Save Rule</Txt>
      </g>

      {/* ── the form, drawn at its old size and scaled up ──────────────────────────────────────── */}
      <g transform={`translate(${FX} ${FY}) scale(${K}) translate(${-FX} ${-FY})`}>
        <rect x={F.x} y={F.top} width={F.w} height={F.h} rx="5" fill={PAPER} filter="url(#fg-card)" />

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
            <rect x="15" y={A2 - 2} width="176" height="14" rx="2.5" fill={clash ? '#FEF3F2' : 'transparent'} style={{ transition: T }} />
            <Sel x={18} y={A2} w={46} v="Hide" fill={clash ? '#FFF8F7' : PAPER} />
            <Sel x={67} y={A2} w={clash ? 108 : 121} v="Description" fill={clash ? '#FFF8F7' : PAPER} />
            {clash && (
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
      </g>

      {/* ── the right side: the Help guide panel, with the summary cards on top once found ────────── */}
      <rect x={P.x} y={P.y} width={P.w} height={P.h} rx="5" fill={PAPER} filter="url(#fg-card)" />
      <g clipPath="url(#fg-panel)">
        {showSim && <SummaryCard key="sim" kind="similar" x={P.x + 4} w={cardW} ring={f.hl === 'similar'} />}
        {showCon && <SummaryCard key="con" kind="conflicts" x={both ? P.x + 4 + halfW + GAP : P.x + 4} w={cardW} ring={f.hl === 'conflicts'} />}
        {(showSim || showCon) && <line x1={P.x} x2={P.x + P.w} y1={CARD_Y + CARD_H + 4} y2={CARD_Y + CARD_H + 4} stroke="#EEF2F6" strokeWidth="0.6" />}
        <GuideSkeleton top={showSim || showCon ? CARD_Y + CARD_H + 8 : P.y + 5} />
      </g>

      {/* Saved */}
      {f.save === 'done' && (
        <g className="pt-pop">
          <rect x="44" y="150" width="112" height="20" rx="6" fill={INK} filter="url(#fg-lift)" />
          <circle cx="57" cy="160" r="5" fill="#16A34A" />
          <path d="M54.8 160 l1.6 1.6 l3 -3.2" stroke={PAPER} strokeWidth="1.1" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <Txt x={67} y={162.2} s={6} w={600} c={PAPER}>Rule saved</Txt>
          {[[-8, -6], [6, -9], [16, -2], [-14, 3]].map(([dx, dy], i) => (
            <circle key={i} cx={285 + dx} cy={12 + dy} r="1.5" fill={['#F59E0B', '#10B981', YOU, BLUE][i]} className="pt-burst" style={{ animationDelay: `${i * 70}ms` }} />
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
        <button type="button" onClick={onClose} title="Close — replay it any time from Watch video in the Help guide" aria-label="Close"
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
