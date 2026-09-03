# Combination grid — Support Portal layouts

Phase 1 of `layout-variants`. **Assignments only** — no names, no wireframes, no design work.
Edit this before anything is designed; a bad grid produces twelve bad layouts.

`B` is composite, written `containment / height / alignment / search / payload`.

---

## The grid

| # | A · banner treatment | B · banner structure | C · actions | D · widgets | E · services | F · archetype | Ban | Seed (outside ITSM) |
|---|---|---|---|---|---|---|---|---|
| R01 | **A18** none | — / none / — / **promoted to top chrome** / — | **C6** segmented pill bar | **D6** counter tiles → one detail panel | **folded into quick actions** | **F5** dashboard-first | ⛔ **no banner** | macOS menu bar + Spotlight |
| R02 | **A15** split image ÷ colour | full-bleed / mid / split / below banner / copy+search | **C7** one hero action + secondary links | **D4** announcements + contact merged | list rows with usage counts | **F3** two-column act ÷ know | — | Airbnb host dashboard |
| R03 | **A12** seamless pattern | inset card / compact / left / inside / copy+search | **C9** horizontal scroll strip | **D8** chronological feed, everything merged | carousel | **F7** single ranked feed | ⛔ **no grid of equal cards** | Instagram Stories · Duolingo path |
| R04 | **A3** mesh / radial gradient | full-bleed / hero / centred / straddling edge / copy+search | **C3** straddling the banner edge | **D1** one card per widget | grid | **F1** classic top-down | — | Stripe Docs home *(control row)* |
| R05 | **A7** line-art topology | contained / bar / left / **command-palette only** / copy only | **C10** collapsed behind one New menu | **D9** full merge — one container, four tabs | one merged section, category tabs | **F8** tabbed workspace | — | Linear |
| R06 | **A14** duotone photo | inset card / mid / centred / inside / copy+search+actions | **C8** bento, one large + three small | **D2** asset widgets → one tabbed card | icon-only tiles | **F4** bento mosaic | — | Apple TV app · Notion gallery |
| R07 | **A10** flat geometric | full-bleed / compact / left / below banner / copy+search | **C5** vertical rail beside content | **D3** requests + approvals + drafts → tabbed work card | chip cloud | **F9** left sub-rail anchored | — | Windows 11 Start panel |
| R08 | **A5** flat 2D illustration | contained / mid / split / inside / copy+search | **C1** single equal row | **D7** accordion stack, one open | **none — no services section** | **F2** content + persistent right rail | — | GOV.UK service start pages |
| R09 | **A16** subtle animated loop | full-bleed / mid / centred / inside / copy+search+counters | **C2** two-row grid | **D5** knowledge widgets → help cluster | grid | **F5** dashboard-first | ⛔ **invert the order** — data first, banner last | Strava feed · Spotify Home |
| R10 | **A4** photographic full-bleed | full-bleed / hero / left / straddling edge / copy+search+actions | **C4** inside the banner, under search | **D2** asset widgets → one tabbed card | list rows with usage counts | **F2** content + persistent right rail | — | Booking.com property page |
| R11 | **A9** abstract 3D shapes | inset card / compact / split / below banner / copy+search | **C1** single equal row | **D6** counter tiles → one detail panel | carousel | **F6** search-first minimal | — | Kindle library · Netflix rows |
| R12 | **A1** solid brand colour | contained / bar / centred / **none** / copy only | **C3** straddling the banner edge | **D1** one card per widget | chip cloud | **F5** dashboard-first | ⛔ **half the vertical space** (≈450px) | Airline departure board · checkout kiosk |

---

## Constraint check

| Rule | Result |
|---|---|
| No two rows share more than 2 of 6 axis values | **Pass.** A is unique on every row, so no pair can share it. One pair reaches the limit: **R04 ↔ R12** share `C3` and `D1`. Every other pair shares 0 or 1. |
| Each axis uses ≥60% of its options | **A** 12/18 = 67% · **C** 10/10 = 100% · **D** 9/9 = 100% · **E** 8/8 = 100% · **F** 9/9 = 100% |
| B sub-variables ≥60% each | Containment 4/4 · Height 5/5 · Alignment 3/3 · Search 6/6 · Payload 4/4 |
| ≥3 rows carry an unexpected or absent option | **4.** R01 no banner at all · R05 command-palette-only search · R08 no services section · R12 no search anywhere |
| ≥2 rows built from a ban rather than a choice | **R01** (started from "no banner") and **R03** (started from "no equal-card grid") |
| ≥4 forced negatives | **4** — R01, R03, R09, R12 |

### The four bans, and what each one tests

| Row | Ban | The question it answers |
|---|---|---|
| R01 | No banner | Was the banner ever load-bearing, or is it habit? |
| R03 | No grid of equal cards | Is the card grid the only way to show seven widgets? |
| R09 | Invert the order — data before actions, banner last | Does a returning requester need the door before the desk? |
| R12 | Half the vertical space (≈450px) | What survives when there is no room to be generous? |

---

## Two things to settle before Phase 2

1. **R04 is a deliberate control** — mesh gradient, straddling search, one card per widget, classic top-down. It is the closest row to what ships today. Keep it as the baseline the other eleven are measured against, or replace it with a twelfth genuinely different row?

2. **Output format is now "wireframe sheet"** rather than the earlier markdown spec. Phase 2 spawns twelve isolated subagents; each returns the output contract as text, and I assemble the sheet afterwards. Confirm the sheet should match the published layout gallery's visual language, or be true greyscale.

---

## Not yet explored — what a second round would cover

**A** — A2 linear gradient · A6 isometric · A8 3D logo forms · A11 photo + shape mask · A13 glassmorphic · A17 live data motif.
A17 is the notable omission: a banner whose artwork *is* the tenant's live open-ticket count.
