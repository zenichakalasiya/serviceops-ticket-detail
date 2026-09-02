import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';

/* Element preview — what this thing looks like on a page, and why you would reach for it.
 *
 * ⚠️ Each sketch is the SHAPE THAT ELEMENT ACTUALLY MAKES, not a generic block. The library is a
 * list of names, and a name is the worst possible description of a visual element — "Card" and
 * "Action Card" and "KPI" all sound equally plausible for the same job. The sketch answers "what
 * will this leave on my page" in the time it takes to hover, which is the real question.
 *
 * ⚠️ ONE sketch per element, never a stack of variants. Four wireframes stacked made the card twice
 * the height of the row it belonged to, and the reader had to scan a column to find the one they
 * meant. Where an element genuinely has a range — Button's four styles — the range is laid out
 * INSIDE the one sketch (a 2×2 grid) rather than down the card.
 *
 * ⚠️ The groups are told apart by SHAPE, and the elements within a group by their ICON:
 *   · Data  — a full card with a header: icon, title, count, "view all", then its own row shape
 *   · Actions    — a small icon-and-two-lines card; all four are identical by design, so the icon
 *                  in the badge is the only thing that distinguishes them, exactly as on the page
 *   · Basic      — content sitting DIRECTLY on the page ground, with no card of its own (this is
 *                  literally how they render: `renderSpec()` marks them `bare`)
 *   · Visual     — a framed picture with its caption
 *   · Custom     — cards, each with an interior nothing else has
 * The icon is the element's OWN palette icon, passed in as a prop. Same glyph in the row and in the
 * sketch, and no second registry to drift — and a prop rather than an import because the panel
 * imports this file, so reaching back for the registry would be a cycle.
 *
 * ⚠️ The dark surface is deliberate. This floats over a white panel on a white canvas; a light card
 * would read as part of the page it is describing. Dark is the one value that says "this is a note
 * about the thing, not the thing". */

/* ── Wireframe primitives ─────────────────────────────────────────────────────
   Every sketch is built from these, so no two previews can drift into different
   visual languages. Widths are fractions of the card, never pixels. */
const INK = 'bg-[#54545A]';       // a line of content
const DIM = 'bg-[#3C3C42]';       // secondary content — a date, a description
const LOUD = 'bg-[#77777E]';      // a heading, a column header
/* ⚠️ Only ever used in an inline `style`. A Tailwind class must appear in this file as LITERAL
   text — one built by interpolation is never scanned, so the utility is never generated and the
   element silently renders unstyled. Every accent CLASS below is written out as 'bg-[#5B8DEF]'. */
const ACCENT = '#5B8DEF';

const bar = (w: string, h = 7, cls = INK) => (
  <span className={`block flex-shrink-0 rounded-full ${cls}`} style={{ width: w, height: h }} />
);
const dot = (size = 10, cls = INK) => (
  <span className={`block flex-shrink-0 rounded-full ${cls}`} style={{ width: size, height: size }} />
);
/** A status/tag pill — the small rounded rectangle these cards are full of. */
const tag = (w: string, cls = 'bg-[#4A4A50]') => (
  <span className={`block h-3 flex-shrink-0 rounded-sm ${cls}`} style={{ width: w }} />
);
const stack = (children: ReactNode, cls = 'gap-2') => (
  <span className={`flex w-full min-w-0 flex-col ${cls}`}>{children}</span>
);
const row = (children: ReactNode, cls = 'gap-2') => (
  <span className={`flex w-full min-w-0 items-center ${cls}`}>{children}</span>
);
const spacer = <span className="ml-auto" />;

/** The widget's own surface. What makes a card-making element read as one. */
const card = (children: ReactNode, cls = '') => (
  <span className={`flex flex-col gap-2 rounded-md border border-white/[0.13] bg-[#2B2B30] p-2.5 ${cls}`}>{children}</span>
);

/** The element's icon in the tinted badge the product paints it in. */
const badge = (icon: ReactNode, size: 'sm' | 'lg' = 'sm') => (
  <span
    className={`flex flex-shrink-0 items-center justify-center rounded text-[#8FB4F5] ${
      size === 'lg' ? 'size-7 [&>svg]:size-4' : 'size-5 [&>svg]:size-3'
    }`}
    style={{ background: 'rgba(91,141,239,0.16)' }}
  >{icon}</span>
);

/* ── Group shapes ─────────────────────────────────────────────────────────────
   The three repeated layouts live here once, so every card in a group is the same
   card — which is what lets the icon be the thing that tells them apart. */

/** Data: header (icon · title · count · view all) over rows. */
const listCard = (icon: ReactNode, rows: ReactNode, opts: { count?: boolean } = {}) => card(
  <>
    <span className="flex w-full items-center gap-2">
      {badge(icon)}
      {bar('42%', 8, LOUD)}
      {spacer}
      {opts.count !== false && tag('16px', 'h-3.5 w-4 rounded bg-[#4A4A50]')}
      {bar('26px', 6, 'bg-[#5B8DEF]')}
    </span>
    <span className="block h-px w-full bg-white/[0.08]" />
    {rows}
  </>,
);

/** Actions: the icon-and-two-lines card all four share. */
const actionCard = (icon: ReactNode, dashed = false) => card(
  row(
    <>
      {dashed
        ? <span className="flex size-7 flex-shrink-0 items-center justify-center rounded border border-dashed border-[#5B8DEF]/60 text-[#8FB4F5] [&>svg]:size-4">{icon}</span>
        : badge(icon, 'lg')}
      {stack(<>{bar('58%', 8, LOUD)}{bar('82%', 6, DIM)}</>, 'gap-1.5')}
    </>,
    'gap-2.5',
  ),
);

/* ── The catalogue ────────────────────────────────────────────────────────────
   ⚠️ `why` answers "why this one rather than the one above it", not "what is a button". A
   description that restates the name is the thing people learn to skip. */
interface Preview { why: string; art: (icon: ReactNode) => ReactNode }

const PREVIEWS: Record<string, Preview> = {
  /* ── Data ─────────────────────────────────────────────────────────────
     One card shape, six different row shapes — because that IS the difference between them on the
     page. The count and "view all" are on every one of them, so they stay in the shared header. */
  'c-requests': {
    why: 'The requester’s own open tickets. The single most common reason anyone opens the portal at all.',
    art: (icon) => listCard(icon, stack(
      <>
        {stack(<>{row(<>{tag('26px', 'bg-[#5B8DEF]/35')}{bar('48%')}{spacer}{tag('30px', 'bg-[#5C4A2E]')}</>)}{bar('40%', 5, DIM)}</>, 'gap-1')}
        {stack(<>{row(<>{tag('26px', 'bg-[#5B8DEF]/35')}{bar('40%')}{spacer}{tag('34px', 'bg-[#2E4257]')}</>)}{bar('44%', 5, DIM)}</>, 'gap-1')}
      </>,
      'gap-2.5',
    )),
  },
  'c-approvals': {
    why: 'Things waiting on this person. It belongs high on the page because it is work only they can unblock.',
    art: (icon) => listCard(icon, row(
      <>
        {stack(<>{bar('72%')}{bar('50%', 5, DIM)}{row(<>{dot(9, 'bg-[#5B8DEF]/50')}{bar('30%', 5, DIM)}</>, 'gap-1.5')}</>, 'gap-1.5')}
        {spacer}
        <span className="flex flex-shrink-0 gap-1">
          <span className="block size-4 rounded-sm bg-[#2F5741]" />
          <span className="block size-4 rounded-sm bg-[#5A3234]" />
          <span className="block size-4 rounded-sm bg-[#5C4A2E]" />
        </span>
      </>,
      'items-start gap-2',
    )),
  },
  'c-assets': {
    why: 'The hardware and software already assigned to this person — so “what am I holding?” never becomes a ticket.',
    art: (icon) => listCard(icon, stack(
      <>
        {row(<>{tag('24px', 'bg-[#5B8DEF]/35')}{bar('46%')}{spacer}{bar('16%', 6, DIM)}</>)}
        {row(<>{tag('24px', 'bg-[#5B8DEF]/35')}{bar('54%')}{spacer}{bar('20%', 6, DIM)}</>)}
        {row(<>{tag('24px', 'bg-[#5B8DEF]/35')}{bar('38%')}{spacer}{bar('14%', 6, DIM)}</>)}
      </>,
      'gap-2',
    )),
  },
  'c-cis': {
    why: 'The configuration items this person is responsible for. Same shape as My Assets, a different register — services and systems rather than kit.',
    art: (icon) => listCard(icon, stack(
      <>
        {row(<>{dot(6, 'bg-[#4E8A63]')}{bar('50%')}{spacer}{bar('18%', 6, DIM)}</>)}
        {row(<>{dot(6, 'bg-[#4E8A63]')}{bar('42%')}{spacer}{bar('22%', 6, DIM)}</>)}
        {row(<>{dot(6, 'bg-[#8A7A45]')}{bar('56%')}{spacer}{bar('16%', 6, DIM)}</>)}
      </>,
      'gap-2',
    )),
  },
  'c-announcements': {
    why: 'One message everybody needs before they do anything else — an outage, a maintenance window, a deadline.',
    art: (icon) => listCard(icon, stack(
      <>
        {stack(<>{bar('92%')}{bar('30%', 5, DIM)}</>, 'gap-1')}
        {stack(<>{bar('74%')}{bar('30%', 5, DIM)}</>, 'gap-1')}
      </>,
      'gap-2.5',
    ), { count: false }),
  },
  'c-knowledge': {
    why: 'Articles that answer the questions people were about to raise a ticket about. Deflection, without saying no to anyone.',
    art: (icon) => listCard(icon, stack(
      <>
        {row(<>{badge(<span className="block size-2.5 rounded-full bg-[#8FB4F5]" />)}{stack(<>{bar('68%')}{row(<>{bar('34%', 5, DIM)}{tag('40px', 'bg-[#3A3A42]')}</>, 'gap-1.5')}</>, 'gap-1.5')}</>, 'items-start gap-2')}
        {row(<>{badge(<span className="block size-2.5 rounded-full bg-[#8FB4F5]" />)}{stack(<>{bar('56%')}{row(<>{bar('34%', 5, DIM)}{tag('28px', 'bg-[#3A3A42]')}</>, 'gap-1.5')}</>, 'gap-1.5')}</>, 'items-start gap-2')}
      </>,
      'gap-2.5',
    )),
  },

  /* ── Actions ───────────────────────────────────────────────────────────────
     ⚠️ Identical on purpose. These four ARE the same card on the page — the icon and the words are
     the whole difference, so a sketch that invented four shapes would be lying to make itself more
     interesting. The badge carries each one's own glyph, which is exactly how a requester tells
     them apart at a glance. */
  'act-incident': {
    why: 'The way in for “something is broken”. A card rather than a link, because it is the page’s main job.',
    art: (icon) => actionCard(icon),
  },
  'act-service': {
    why: 'The way in for “I need something”. Same card as New Incident — the icon and the words are what tell a requester which is which.',
    art: (icon) => actionCard(icon),
  },
  'act-ad': {
    why: 'Password and account self-service, so the single most common call never becomes one.',
    art: (icon) => actionCard(icon),
  },
  'act-knowledge': {
    why: 'Straight into the articles. The one action card that answers a question instead of opening a ticket.',
    art: (icon) => actionCard(icon),
  },

  /* ── Basic ─────────────────────────────────────────────────────────────────
     ⚠️ NO card around these. They land on the section's own surface — that is what `bare` means in
     `renderSpec()` — and it is the clearest possible signal of the difference between "this adds a
     block to your page" and "this puts content on it". */
  'b-text': {
    /* ⚠️ REAL WORDS, not grey bars. Text is the one element whose whole substance is the words, so a
       bar sketch of it says nothing a bar sketch of anything else does not. One sample carries the
       range — heading, body, caption — in the height the four stacked variants used to need. */
    why: 'Any words that are not a heading — a paragraph, a note, a caption. One element that becomes whichever of those you set it to.',
    art: () => (
      <span className="block">
        <span className="mb-1.5 block text-[13px] font-semibold leading-[1.35] text-white/85">How do I reset my password?</span>
        <span className="block text-[11.5px] leading-[1.55] text-white/50">
          Go to the self-service portal and choose Forgot password. You’ll get a reset link by email.
        </span>
        <span className="mt-2 block text-[10px] leading-none text-white/30">Updated 12 Aug 2026</span>
      </span>
    ),
  },
  'b-button': {
    /* ⚠️ A 2×2 GRID at the sketch's full width, not four stacked rows. Four buttons down a column
       tripled the card's height and read as a list of buttons on a page, which is not what this
       element makes — it makes ONE button, in one of four styles, and a grid says "pick a style"
       where a stack said "here are four buttons". */
    why: 'One clear next step. Use the filled style for the action you want taken, and the quieter ones for everything beside it.',
    art: () => (
      <span className="grid grid-cols-2 gap-2">
        <span className="flex h-7 items-center justify-center rounded-md text-[10.5px] font-medium text-white" style={{ background: ACCENT }}>Submit</span>
        <span className="flex h-7 items-center justify-center rounded-md bg-[#43434A] text-[10.5px] font-medium text-white/75">Cancel</span>
        <span className="flex h-7 items-center justify-center rounded-md border text-[10.5px] font-medium" style={{ borderColor: ACCENT, color: '#8FB4F5' }}>Details</span>
        <span className="flex h-7 items-center justify-center text-[10.5px] font-medium underline underline-offset-2" style={{ color: '#8FB4F5' }}>Learn more</span>
      </span>
    ),
  },
  'b-table': {
    why: 'Values that are compared across rows. If the reader needs to scan one column, this is the only layout that lets them.',
    art: () => (
      <span className="block overflow-hidden rounded-md border border-white/[0.13]">
        <span className="flex items-center gap-3 bg-white/[0.05] px-2.5 py-2">
          {bar('28%', 6, LOUD)}{bar('30%', 6, LOUD)}{bar('22%', 6, LOUD)}
        </span>
        <span className="block h-px w-full bg-white/[0.09]" />
        <span className="flex items-center gap-3 px-2.5 py-2">{bar('28%')}{bar('34%')}{bar('18%')}</span>
        <span className="block h-px w-full bg-white/[0.06]" />
        <span className="flex items-center gap-3 px-2.5 py-2">{bar('24%')}{bar('30%')}{bar('20%')}</span>
      </span>
    ),
  },
  'b-accordion': {
    why: 'Long answers that most people will not read. Collapsed, the page stays short; open, nobody had to leave it.',
    art: () => stack(
      <>
        {/* One open, so the sketch shows both halves of what this element does at once. */}
        {stack(
          <>
            {row(<>{bar('62%', 8, LOUD)}{spacer}<span className="block size-2 rotate-45 border-b-2 border-r-2 border-[#8FB4F5]" /></>)}
            {stack(<>{bar('100%', 5, DIM)}{bar('78%', 5, DIM)}</>, 'gap-1')}
          </>,
          'gap-2',
        )}
        <span className="block h-px w-full bg-white/[0.09]" />
        {row(<>{bar('52%', 8, LOUD)}{spacer}<span className="block size-2 -rotate-45 border-b-2 border-r-2 border-[#54545A]" /></>)}
        <span className="block h-px w-full bg-white/[0.09]" />
        {row(<>{bar('58%', 8, LOUD)}{spacer}<span className="block size-2 -rotate-45 border-b-2 border-r-2 border-[#54545A]" /></>)}
      </>,
      'gap-2.5',
    ),
  },
  'b-card': {
    /* The only Basic element that DOES draw a surface — which is the whole reason it exists beside
       Text, and why its sketch is the one with a border round it. */
    why: 'A bordered surface that holds a heading and a few lines together. Reach for it when a block needs to read as one thing rather than as page content.',
    art: () => card(
      <>
        {row(<>{badge(<span className="block size-2.5 rounded-sm bg-[#8FB4F5]" />, 'lg')}{bar('54%', 8, LOUD)}</>, 'gap-2.5')}
        {stack(<>{bar('100%', 6, DIM)}{bar('88%', 6, DIM)}{bar('62%', 6, DIM)}</>, 'gap-1.5')}
      </>,
    ),
  },

  /* ── Visual ────────────────────────────────────────────────────────────────
     A frame with a picture in it and a caption under — the two parts of the element, and nothing
     else in the palette makes that shape. */
  'v-image': {
    why: 'A picture in its own right — a screenshot, a photo, a diagram. Placed as an element so it can be sized, cropped and captioned.',
    art: () => stack(
      <>
        <span className="flex h-[74px] w-full items-end justify-center overflow-hidden rounded-md border border-white/[0.13] bg-[#26262B]">
          {/* A horizon and a sun: the one sketch everybody reads as "picture" at this size. */}
          <span className="relative block h-full w-full">
            <span className="absolute right-4 top-3 block size-3.5 rounded-full bg-[#8FB4F5]/60" />
            <span className="absolute bottom-0 left-0 block h-8 w-full bg-[#3A3A42]" style={{ clipPath: 'polygon(0 100%, 22% 34%, 44% 100%, 60% 52%, 82% 100%)' }} />
            <span className="absolute bottom-0 left-0 block h-6 w-full bg-[#4A4A52]" style={{ clipPath: 'polygon(0 100%, 34% 30%, 68% 100%)' }} />
          </span>
        </span>
        {bar('58%', 5, DIM)}
      </>,
      'gap-2',
    ),
  },

  /* ── Custom ────────────────────────────────────────────────────────────────
     Cards, like Data — but each one's interior is unlike anything else in the palette, which
     is what stops the group reading as six copies of one sketch. */
  'c-contact': {
    why: 'Where to reach a human when the portal cannot help. Label-over-value rows, so an email and a phone number are never mistaken for each other.',
    art: (icon) => card(
      <>
        {row(<>{badge(icon)}{bar('40%', 8, LOUD)}</>)}
        <span className="block h-px w-full bg-white/[0.08]" />
        {stack(<>{bar('22%', 5, DIM)}{bar('64%')}</>, 'gap-1')}
        {stack(<>{bar('18%', 5, DIM)}{bar('48%')}</>, 'gap-1')}
        {stack(<>{bar('20%', 5, DIM)}{bar('56%')}</>, 'gap-1')}
      </>,
    ),
  },
  'c-services': {
    why: 'The catalogue items people actually ask for, as a grid of one-click tiles. Skips the search everybody was going to do anyway.',
    art: (icon) => card(
      <>
        {row(<>{badge(icon)}{bar('44%', 8, LOUD)}{spacer}{bar('34px', 6, 'bg-[#5B8DEF]')}</>)}
        <span className="grid grid-cols-2 gap-1.5">
          {[62, 50, 56, 44].map((w, i) => (
            <span key={i} className="flex items-center gap-1.5 rounded border border-white/[0.11] px-1.5 py-1.5">
              {dot(8, 'bg-[#5B8DEF]/45')}{bar(`${w}%`, 6)}
            </span>
          ))}
        </span>
      </>,
    ),
  },
  'c-faq': {
    /* No header and no card of its own — it is a run of full-width question rows, which is exactly
       what it looks like on the page and what tells it apart from every other Custom block. */
    why: 'The questions people ask before they raise anything. Each row opens in place, so the page never sends anyone away.',
    art: () => stack(
      <>
        {[74, 88, 62].map((w, i) => (
          <span key={i} className="flex items-center gap-2 rounded-md border border-white/[0.13] bg-[#2B2B30] px-2.5 py-2">
            {bar(`${w}%`, 7)}{spacer}<span className="block size-2 -rotate-45 border-b-2 border-r-2 border-[#54545A]" />
          </span>
        ))}
      </>,
      'gap-1.5',
    ),
  },
  'x-action-card': {
    /* ⚠️ The dashed badge is the only difference from the four fixed action cards, and it is the
       right one: this is the same card with the destination still to be chosen. */
    why: 'The same card as the four above, but pointed wherever you like — a form, a page, an external link. The one to reach for when the destination is yours.',
    art: (icon) => actionCard(icon, true),
  },
  'x-kpi': {
    why: 'One number that matters, big enough to read from across the room. A count, a total, a days-open figure.',
    art: (icon) => card(
      row(
        <>
          {badge(icon, 'lg')}
          {stack(
            <>
              <span className="block text-[20px] font-semibold leading-none text-white/85">12</span>
              {bar('58%', 6, DIM)}
            </>,
            'gap-1.5',
          )}
        </>,
        'gap-2.5',
      ),
    ),
  },
};

/* Everything without an entry still gets a card — a generic block sketch and its group's reason.
   ⚠️ Falling back to NOTHING would make the hover feel broken on exactly the rows people are least
   sure about; a plain sketch is honest and still says "this is a block on your page". */
const FALLBACK: Preview = {
  why: 'Drops onto the page as its own block. Select it to set its content and style.',
  art: (icon) => card(
    <>
      {row(<>{badge(icon)}{bar('50%', 8, LOUD)}</>)}
      {stack(<>{bar('100%', 6, DIM)}{bar('82%', 6, DIM)}</>, 'gap-1.5')}
    </>,
  ),
};

const CARD_W = 320;

export function PortalElementPreview({ elementId, icon, anchor }: {
  elementId: string;
  /** The element's own palette glyph. A prop, not an import — the panel imports this file. */
  icon: ReactNode;
  anchor: DOMRect;
}) {
  const preview = PREVIEWS[elementId] ?? FALLBACK;
  const ref = useRef<HTMLDivElement>(null);
  const [top, setTop] = useState(anchor.top);

  /* ⚠️ Measured AFTER render and clamped to the viewport. The card's height depends on which sketch
     it holds and how long the reason is, so a fixed estimate puts short ones too low and clips tall
     ones off the bottom. */
  useEffect(() => {
    const h = ref.current?.offsetHeight ?? 200;
    const wanted = anchor.top + anchor.height / 2 - h / 2;
    setTop(Math.max(12, Math.min(wanted, window.innerHeight - h - 12)));
  }, [anchor.top, anchor.height, elementId]);

  return createPortal(
    /* Portalled to the body: the library scrolls, so a popover inside it is clipped the moment it is
       taller than the space beside its row. `pointer-events-none` keeps the card from stealing the
       hover that is keeping it open. */
    <div
      ref={ref}
      style={{ top, left: Math.max(12, anchor.left - CARD_W - 12), width: CARD_W }}
      className="pointer-events-none fixed z-[10002] overflow-hidden rounded-xl bg-[#1C1C1F] shadow-[0_24px_48px_-12px_rgba(0,0,0,0.45)]"
    >
      {/* The stage — a dotted ground so the sketch reads as "on a page", and one frame around it the
          way the canvas frames a selection. Elements that draw their own card draw it INSIDE this
          frame; the Basic ones sit straight on it, which is the difference the page itself makes. */}
      <div
        className="px-4 py-4"
        style={{
          backgroundImage: 'radial-gradient(circle, #3A3A3E 1px, transparent 1px)',
          backgroundSize: '10px 10px',
        }}
      >
        <div className="w-full rounded-lg border border-white/[0.10] bg-[#232326] px-3.5 py-3">
          {preview.art(icon)}
        </div>
      </div>

      <div className="px-4 pb-3.5 pt-3">
        <p className="text-[12px] leading-[1.5] text-white/55">{preview.why}</p>
      </div>
    </div>,
    document.body,
  );
}
