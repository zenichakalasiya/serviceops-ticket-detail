# Prompt — Announcement carousel behaviour + responsiveness (for Claude Design)

Paste everything below the line into Claude Design on the Support Portal Layout System canvas.

---

Update every **Announcements carousel** in my support-portal templates so it behaves and lays out exactly as described below. Apply it to both carousel variants: the **plain strip** (no image) and the **image carousel** (a photo with a coloured band underneath). Do not change the regular list-style announcements card, and do not touch any other section.

## 1. Content

- The carousel shows the **latest 3 announcements only**, one per slide.
- Each slide is one row: a **date tile** on the left (weekday on the first line, then month + day, e.g. "Tue," / "Aug 11"; 62px wide, rounded 8px, soft tint background), then a **headline** (semibold, 16px) with a **description** below it (13px, muted).
- Headline and description are **one line each**, truncated with an ellipsis. When a line is cut off, hovering it shows the full text in a tooltip; lines that fit show no tooltip.
- There is **no "All announcements" link** anywhere on the card and **no header or title** on the carousel variants.

## 2. Controls

Show one control group: **‹ left arrow · 3 dots · right arrow ›**.

- **Arrows:** 28px circles, 1px border `#DFE5ED`, white fill, chevron icon 15px in `#475467`. On hover the border and icon turn the accent colour `#3D8BD0`. 8px gap between each arrow and the dot group.
- **Dots:** 6px circles in `#CBD5E1`, 6px apart. The **active** dot becomes a pill **20px wide × 6px tall** in the accent colour `#3D8BD0`. Width animates smoothly on change.
- Clicking a dot jumps to that slide; the arrows step one slide back or forward.
- **Last slide rule:** when the **3rd dot / 3rd announcement** is active, the **right arrow is replaced by a text button "View all ›"** (13px, medium weight, `#475467`, chevron 15px after the words, turns accent on hover). The left arrow and the 3 dots stay. On slides 1 and 2 it is the normal right arrow again.
- **On a dark band** (image carousel with light text): arrows become transparent with a `white/40%` border and white icon; idle dots `white/35%`; the active pill is solid white; "View all ›" is white.

## 3. Motion

- **Auto-advance every 5 seconds**, left to right: 1 → 2 → 3 (showing "View all ›") → after 5 more seconds it **returns to slide 1** and continues looping.
- Slides move with a horizontal slide transition (~320ms, ease-out); the photo in the image carousel stays fixed — only the band content slides.
- **Pause** auto-advance while the pointer is over the carousel or while it has keyboard focus; resume when it leaves.
- Auto-advance always runs, for every visitor — there is no reduced-motion exception — so a reader always gets back to the first announcement without clicking anything.
- Also support swipe/drag left–right (commit after ~60px) and the Left/Right arrow keys when focused.

## 4. Responsiveness — decide by the CARD's width, not the screen

Use a **container query on the card** (the same card can sit full-width in one template and in a narrow right rail in another). Breakpoint: **520px card width**.

### Plain strip (no image)
- **≥ 520px wide:** one horizontal line — date tile + headline/description on the left taking the remaining space, the control group on the **right**, vertically centred with the row, 24px gap between the text and the controls.
- **< 520px wide:** stack vertically — the announcement row first, then the control group at the **bottom-left of the card**. Its left edge lines up exactly with the left edge of the date tile (same card padding, no extra indent). If the card is taller than its content (stretched by the row it sits in), the controls stick to the card's bottom edge; there is always at least **12px** between the description and the controls. Never let the controls wrap to the middle of the card or pull to the right.

### Image carousel
- The photo spans the full card width at the top (200px tall, cover); the coloured band sits below it with 20px horizontal / 16px vertical padding.
- **≥ 520px wide:** inside the band, the announcement row on the left and the control group at the **top-right** of the band, aligned with the top of the headline.
- **< 520px wide:** inside the band, the announcement row first, then the control group directly **under** it, **left-aligned** with the date tile, with a **12px** gap between the description and the controls.

In both variants: the headline and description keep truncating to one line at every width, the date tile never shrinks, and the control group never wraps onto two lines.

## 5. Check before you finish
- Resize each carousel card from full width down to ~320px and confirm the controls switch at 520px exactly as above.
- Let it run: confirm 1 → 2 → 3 shows "View all ›" in place of the right arrow, then it loops back to 1 with the right arrow restored.
- Confirm there are exactly 3 dots and no "All announcements" link anywhere.
