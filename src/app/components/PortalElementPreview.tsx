import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';

/* Element preview — what this thing looks like on a page, what it puts there, and what it is for.
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
   ⚠️ TWO lines, not one, and they answer different questions. `what` says what the element PUTS on
   the page — the sentence you need to decide whether this is the row you were looking for. `helps`
   says what it is FOR, which is the sentence you need once you have found it and are wondering
   whether it fits your case. Merged into one line they compete, and the half a reader needs is
   whichever half they are not reading.
   ⚠️ `note` is a CONDITION, not more description — "available when AD Self Service is enabled" is
   the kind of thing that turns a working element into a dead one, so it sits under a rule of its own
   rather than tucked into the end of a sentence. */
interface Preview { what: string; helps: string; note?: string; art: (icon: ReactNode) => ReactNode }

const PREVIEWS: Record<string, Preview> = {
  /* ── Data ─────────────────────────────────────────────────────────────
     One card shape, six different row shapes — because that IS the difference between them on the
     page. The count and "view all" are on every one of them, so they stay in the shared header. */
  'c-requests': {
    what: 'View your currently open requests in one place.',
    helps: 'Helps requesters quickly track requests that still need attention.',
    art: (icon) => listCard(icon, stack(
      <>
        {stack(<>{row(<>{tag('26px', 'bg-[#5B8DEF]/35')}{bar('48%')}{spacer}{tag('30px', 'bg-[#5C4A2E]')}</>)}{bar('40%', 5, DIM)}</>, 'gap-1')}
        {stack(<>{row(<>{tag('26px', 'bg-[#5B8DEF]/35')}{bar('40%')}{spacer}{tag('34px', 'bg-[#2E4257]')}</>)}{bar('44%', 5, DIM)}</>, 'gap-1')}
      </>,
      'gap-2.5',
    )),
  },
  'c-approvals': {
    what: 'View requests and items waiting for your approval.',
    helps: 'Helps requesters quickly review and take action on pending approvals.',
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
    what: 'View the assets assigned or associated with you.',
    helps: 'Helps requesters quickly find and review their assigned devices and other assets.',
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
    what: 'View configuration items associated with you.',
    helps: 'Helps requesters quickly access the systems or CIs related to them.',
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
    what: 'Display important announcements and updates for requesters.',
    helps: 'Helps keep users informed about company or IT service updates.',
    art: (icon) => listCard(icon, stack(
      <>
        {stack(<>{bar('92%')}{bar('30%', 5, DIM)}</>, 'gap-1')}
        {stack(<>{bar('74%')}{bar('30%', 5, DIM)}</>, 'gap-1')}
      </>,
      'gap-2.5',
    ), { count: false }),
  },
  'c-knowledge': {
    what: 'Show the knowledge articles viewed most frequently by users.',
    helps: 'Helps requesters quickly find popular solutions and helpful information.',
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
    what: 'Give requesters a quick way to report an issue.',
    helps: 'Opens the incident creation form directly from the portal.',
    art: (icon) => actionCard(icon),
  },
  'act-service': {
    what: 'Give requesters quick access to the Service Catalog.',
    helps: 'Helps users browse and request the services available to them.',
    art: (icon) => actionCard(icon),
  },
  'act-ad': {
    what: 'Let users reset their password or unlock their Active Directory account.',
    helps: 'Provides self-service access without requiring a support request.',
    note: 'Available when AD Self Service is enabled.',
    art: (icon) => actionCard(icon),
  },
  'act-knowledge': {
    what: 'Give requesters quick access to the Knowledge Base.',
    helps: 'Helps users find solutions and answers before raising a request.',
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
    what: 'Add text content anywhere on the portal page.',
    helps: 'Use it for instructions, descriptions, notices, policies, or other information.',
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
    what: 'Add a clickable button to the portal.',
    helps: 'Use it to provide a prominent entry point to a supported portal action or destination.',
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
    what: 'Display structured information in rows and columns.',
    helps: 'Useful for presenting information that is easier to compare in a tabular format.',
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
    what: 'Organize expandable content into collapsible sections.',
    helps: 'Useful for FAQs, instructions, policies, or other content that should remain compact.',
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
    what: 'Add a visual content container to the portal.',
    helps: 'Use it to group related information, text, images, or supported content in a distinct section.',
    art: () => card(
      <>
        {row(<>{badge(<span className="block size-2.5 rounded-sm bg-[#8FB4F5]" />, 'lg')}{bar('54%', 8, LOUD)}</>, 'gap-2.5')}
        {stack(<>{bar('100%', 6, DIM)}{bar('88%', 6, DIM)}{bar('62%', 6, DIM)}</>, 'gap-1.5')}
      </>,
    ),
  },

  'b-text-image': {
    what: 'Add a block of text beside an image.',
    helps: 'Use it for an introduction, a policy note, or any explanation that reads better with a picture.',
    art: () => (
      <span className="block">
        {/* The picture FLOATS, so the text wraps under it — which is the element, and the one thing
            a side-by-side flex sketch would get wrong. */}
        <span className="float-left mr-2.5 block size-[52px] rounded-md border border-white/[0.13] bg-[#33333A]" />
        {stack(<>{bar('100%', 7, LOUD)}{bar('96%', 6, DIM)}{bar('88%', 6, DIM)}{bar('100%', 6, DIM)}{bar('64%', 6, DIM)}</>, 'gap-1.5')}
      </span>
    ),
  },
  'l-tabs': {
    what: 'Group related content into tabs on the portal page.',
    helps: 'Use it to keep several sections available without making the page longer.',
    art: () => stack(
      <>
        {row(
          <>
            <span className="flex flex-col gap-1.5 pb-1.5">{bar('42px', 7, LOUD)}<span className="block h-0.5 w-full rounded-full" style={{ background: ACCENT }} /></span>
            <span className="pb-1.5">{bar('34px', 7)}</span>
            <span className="pb-1.5">{bar('38px', 7)}</span>
          </>,
          'gap-3 border-b border-white/[0.12]',
        )}
        {stack(<>{bar('100%', 6, DIM)}{bar('84%', 6, DIM)}{bar('92%', 6, DIM)}</>, 'gap-1.5')}
      </>,
      'gap-2.5',
    ),
  },
  'l-divider': {
    /* Content either side of it, because a line on its own is not a sketch of anything. */
    what: 'Add a horizontal line between sections.',
    helps: 'Use it to separate content visually without adding space or text.',
    art: () => stack(
      <>
        {stack(<>{bar('72%', 7, LOUD)}{bar('92%', 6, DIM)}</>, 'gap-1.5')}
        <span className="block h-px w-full bg-[#6A6A72]" />
        {stack(<>{bar('58%', 7, LOUD)}{bar('86%', 6, DIM)}</>, 'gap-1.5')}
      </>,
      'gap-3',
    ),
  },
  'b-spacer': {
    what: 'Add adjustable empty space between blocks.',
    helps: 'Use it to control the gap between sections without changing their content.',
    art: () => stack(
      <>
        {stack(<>{bar('68%', 7, LOUD)}{bar('90%', 6, DIM)}</>, 'gap-1.5')}
        {/* The GAP is the element, so it is the only part of this sketch that is drawn. */}
        <span className="flex h-7 w-full items-center justify-center rounded border border-dashed border-[#5B8DEF]/40 bg-[#5B8DEF]/[0.06]" />
        {stack(<>{bar('54%', 7, LOUD)}{bar('82%', 6, DIM)}</>, 'gap-1.5')}
      </>,
      'gap-2',
    ),
  },

  /* ── Visual ────────────────────────────────────────────────────────────────
     A frame with a picture in it and a caption under — the two parts of the element, and nothing
     else in the palette makes that shape. */
  'v-image': {
    what: 'Add an image to the portal page.',
    helps: 'Use it for banners, instructions, announcements, promotional content, or other visual information.',
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

  'v-video': {
    what: 'Add a video to the portal page.',
    helps: 'Use it to provide visual instructions, tutorials, announcements, or other helpful content.',
    art: () => stack(
      <>
        <span className="relative flex h-[74px] w-full items-center justify-center overflow-hidden rounded-md border border-white/[0.13] bg-[#26262B]">
          {/* A play triangle in a ring — the one mark that reads as "video" at any size. */}
          <span className="flex size-8 items-center justify-center rounded-full bg-[#5B8DEF]/20">
            <span className="ml-0.5 block size-0 border-y-[6px] border-l-[10px] border-y-transparent border-l-[#8FB4F5]" />
          </span>
          <span className="absolute bottom-2 left-2.5 right-2.5 block h-1 rounded-full bg-white/[0.14]">
            <span className="block h-full w-1/3 rounded-full bg-[#8FB4F5]/70" />
          </span>
        </span>
        {bar('52%', 5, DIM)}
      </>,
      'gap-2',
    ),
  },
  'v-slider': {
    what: 'Add a rotating set of images to the portal page.',
    helps: 'Use it to show several banners or announcements in the space of one.',
    art: () => stack(
      <>
        <span className="relative flex h-[74px] w-full overflow-hidden rounded-md border border-white/[0.13] bg-[#26262B]">
          {/* Two slides half in frame, which is what says "these rotate" rather than "this is one
              picture with dots under it". */}
          <span className="block h-full w-[78%] flex-shrink-0 bg-[#3A3A42]" />
          <span className="block h-full w-[22%] flex-shrink-0 bg-[#2F2F36]" />
        </span>
        {row(
          <>
            {dot(5, 'bg-[#8FB4F5]')}{dot(5, 'bg-[#4A4A50]')}{dot(5, 'bg-[#4A4A50]')}
          </>,
          'justify-center gap-1.5',
        )}
      </>,
      'gap-2',
    ),
  },

  /* ── Custom ────────────────────────────────────────────────────────────────
     Cards, like Data — but each one's interior is unlike anything else in the palette, which
     is what stops the group reading as six copies of one sketch. */
  'c-contact': {
    what: 'Display support contact information directly on the portal.',
    helps: 'Use it to provide details such as support email, phone number, and working hours.',
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
  /* ⚠️ The SAME tile grid as Most Used Services, deliberately. They make the identical shape on the
     page and differ only in where the tiles come from — so a sketch that invented a difference
     would be describing something the requester never sees. The star is the whole distinction. */
  'c-favourites': {
    what: 'Show the services marked as favorites by the requester.',
    helps: 'Helps users quickly access the services they use or need most often.',
    art: (icon) => card(
      <>
        {row(<>{badge(icon)}{bar('46%', 8, LOUD)}{spacer}{bar('34px', 6, 'bg-[#5B8DEF]')}</>)}
        <span className="grid grid-cols-2 gap-1.5">
          {[58, 46, 52, 40].map((w, i) => (
            <span key={i} className="flex items-center gap-1.5 rounded border border-white/[0.11] px-1.5 py-1.5">
              <span className="block size-2 flex-shrink-0 rotate-45 bg-[#5B8DEF]/60" />{bar(`${w}%`, 6)}
            </span>
          ))}
        </span>
      </>,
    ),
  },
  'c-services': {
    what: 'Show the services requested most frequently by users.',
    helps: 'Helps requesters quickly discover commonly requested services.',
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
    what: 'Display frequently asked questions and their answers on the portal.',
    helps: 'Helps requesters quickly find answers to common questions without raising a request.',
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
    what: 'Add a card that points at any page or link you choose.',
    helps: 'Use it when a destination you need is not one of the built-in action cards.',
    art: (icon) => actionCard(icon, true),
  },
  'x-kpi': {
    what: 'Display an important number or metric prominently on the portal.',
    helps: 'Use it to show a count such as open requests, pending approvals, or other supported ServiceOps information.',
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

  /* ⚠️ The only sketch with a FILTER CHIP in it, because that is the element: the same list shape
     as the six live-data cards, over a module and a condition you chose. Without the chip it draws
     My Open Requests, and the row above it would already have said that. */
  'c-records': {
    what: 'Create a data-driven widget using ServiceOps information that is not covered by the available OOB widgets.',
    helps: 'Select the module, define the required filters or conditions, and choose how the information should be displayed.',
    art: (icon) => card(
      <>
        {row(<>{badge(icon)}{bar('40%', 8, LOUD)}{spacer}{bar('26px', 6, 'bg-[#5B8DEF]')}</>)}
        {row(
          <>
            <span className="flex items-center gap-1 rounded-sm border border-dashed border-[#5B8DEF]/50 px-1.5 py-1">{bar('26px', 5, 'bg-[#5B8DEF]/60')}</span>
            <span className="flex items-center gap-1 rounded-sm border border-dashed border-white/[0.16] px-1.5 py-1">{bar('20px', 5, DIM)}</span>
          </>,
          'gap-1.5',
        )}
        <span className="block h-px w-full bg-white/[0.08]" />
        {stack(<>{row(<>{bar('52%')}{spacer}{tag('28px', 'bg-[#2E4257]')}</>)}{row(<>{bar('44%')}{spacer}{tag('24px', 'bg-[#5C4A2E]')}</>)}</>, 'gap-2')}
      </>,
    ),
  },
};

/* Everything without an entry still gets a card — a generic block sketch and its group's reason.
   ⚠️ Falling back to NOTHING would make the hover feel broken on exactly the rows people are least
   sure about; a plain sketch is honest and still says "this is a block on your page". */
const FALLBACK: Preview = {
  what: 'Add this block to the portal page.',
  helps: 'Select it once added to set its content and style.',
  art: (icon) => card(
    <>
      {row(<>{badge(icon)}{bar('50%', 8, LOUD)}</>)}
      {stack(<>{bar('100%', 6, DIM)}{bar('82%', 6, DIM)}</>, 'gap-1.5')}
    </>,
  ),
};

const CARD_W = 320;

export function PortalElementPreview({ elementId, name, icon, anchor }: {
  elementId: string;
  /** The element's own name, so the card names the thing it is sketching. */
  name: string;
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

      {/* ⚠️ The NAME is repeated here even though the row it came from is still on screen. By the
          time the card has opened the pointer is on the card, and a description with no subject at
          the top of it reads as a caption for the sketch rather than for the element. */}
      <div className="px-4 pb-3.5 pt-3">
        <p className="text-[12px] font-semibold leading-[1.5] text-white/90">{name}</p>
        <p className="mt-1 text-[12px] leading-[1.5] text-white/70">{preview.what}</p>
        <p className="mt-1 text-[12px] leading-[1.5] text-white/45">{preview.helps}</p>
        {/* A rule above it, so a condition never reads as a third sentence of description. */}
        {preview.note && (
          <p className="mt-2 border-t border-white/[0.10] pt-2 text-[11px] leading-[1.45] text-white/40">{preview.note}</p>
        )}
      </div>
    </div>,
    document.body,
  );
}
