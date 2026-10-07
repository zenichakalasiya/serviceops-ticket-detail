# Handoff — 2026-10-07 17:06

## Read first
CLAUDE.md → **Structure › Request Form Management** bullet, especially the part headed
**"Help guide + Rule builder basics (7 Oct 2026, Zeni, V1 only)"**. It covers everything built this
session. The "How to run" typecheck command is how the touched files were checked.

## What we worked on this session
This session added two things to the Form Rule editor's V1 (layout A).

1. **A Help guide tab.** It is the first tab in the Rule check rail and holds plain-language steps for ITSM admins.
2. **The "Rule builder basics" video.** It is an Editor-basics-style card that plays on first visit. The real builder form fills in on the left, and a vertical "How it works" flow, marked as reference only, sits on the right.

## Completed
- **Similar rules footer:** the line now sits on one line (truncated).
- **Help guide tab** (`FormRuleHelpGuide` in `src/app/components/FormRuleGuide.tsx`):
  - an outlined secondary "Watch guide" card with a one-line subtext;
  - six foldable steps, numbered only, with no icons and no colours (steps 1–3 open);
  - a grey EXAMPLE box.
- **Video dock** (`FormRuleGuideDock`):
  - Behaviour:
    - auto-plays until the user drives it;
    - has dots, Previous / Next, Watch again, and full screen (Esc exits);
    - opens by itself once (localStorage `formRuleGuideSeen`) and reopens from Watch guide;
    - has six chapters: When · Check if · Then · Similar · Conflicts · Save.
  - Scene and animation:
    - The scene is SVG with frames as data, and it never remounts between frames.
    - The cursor is smooth: it moves first, then clicks in the next frame, along a curved path.
    - There are no connector lines; the step being filled is highlighted instead.
    - Equal action field widths: Description shrinks only to make room for the ⚠.
    - The Open rule CTA sits in the accordion header.
    - The Similar and Conflicts rail drawings match the real rail.
  - Node highlight:
    - a thin static ring with an even 2-unit gap;
    - the **blink (`fg-ping`) restored**, growing evenly on all four sides via CSS-variable x/y/width/height.
- **`src/app/components/FormRuleEditor.tsx`:** opens A on the guide tab and wires the dock.
- **`src/app/components/FormRuleInsights.tsx`:** adds the `guide` tab and prop.
- **`src/styles/theme.css`:** adds the `fg-*` keyframes.
- **Checks:**
  - The typecheck is clean for the touched files.
  - `npm run build` passes.
  - Verified with Playwright probes (`D:/Motadata/tour-shots/formrule/g1–g6.mjs`).

## In progress
Nothing mid-flight.

## Next steps
- Get Zeni's review of the video pacing and copy in the browser.
- **V2 (B3)** has no Help guide. Ask before adding one.

## Decisions made
- Only V1 has the guide. The video has no Name chapter.
- The right-hand flow is a picture for reference, not a preview. It says so with the "For reference only" chip and the Help guide copy.
- There are no lines from the form to the flow. Highlighting the node shows the link.
- The pulse must stay. Zeni asked for it back after it was dropped by mistake.

## Gotchas & notes
- Git Bash strips backslashes in heredocs, so patch scripts are written to files.
- `FormRuleConflictReview.tsx` and some other files have CRLF line endings. Normalise line endings when matching multi-line anchors.
- The dev server runs at http://localhost:5200/serviceops-ticket-detail/. To see the video, go to Admin › Request Form Rule → Create Rule. Clear `formRuleGuideSeen` to see it auto-open again.
