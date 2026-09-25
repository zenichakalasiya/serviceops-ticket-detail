# Handoff — 2026-09-25 18:20

## Read first
All work is in the **Support Portal builder**. In `CLAUDE.md` › Key context, read the bullets dated
**25 Sep 2026**, especially these (newest last):

1. *"ONE slim slider, `MiniRange`"* — every builder slider now shares one component.
2. *"the banner BACKGROUND popup is the colour picker's width"* — the opt-in `dense` prop.
3. *"NO alignment in any sidebar, and no divider that fences nothing"* — `withoutAlignment()` and the
   `.tb-rule` CSS.
4. *"theme and font rows: NO outline, name top-right"*.
5. *"ONE tab strip everywhere: the Figma pill (`.pill-track`)"* — how every tab strip is now styled,
   and the `aria-pressed` rule that paints it.

## What we worked on this session
A run of visual-polish requests on the builder's controls: slimmer sliders, compact popups, alignment
removed from sidebars, cleaner theme/font rows, and one shared tab-strip style taken from a Figma pill.

## Completed
- **Slim slider** (`PortalRange.tsx` `MiniRange` + `.portal-range` in `theme.css`): 3px track, blue fill
  to the value, 9px white thumb. Used by every border / corner-radius slider (toolbar popups and panel)
  and the panel's generic `SliderRow`.
- **Banner background popup** is 224px wide like the colour picker; its editors take `dense`, the panel
  copies stay full size.
- **Alignment removed from every sidebar** — stripped once at the drawer entry (`withoutAlignment` in
  `PortalWidgetDrawer`); it lives only on the floating toolbar.
- **Toolbar dividers** never lead, trail or double up (`.tb-rule` CSS). Swept all 52 default-page nodes.
- **Theme / font rows**: no outline, smaller rows, name + accent dot small at the top right, selected =
  deeper fill + tick.
- **Figma pill tab strips** (`.pill-track`) on all 14 tab strips — sidebar and popups — including the
  two Solid/Gradient switches that used to be blue.
- **Earlier today (other terminal, finished here):** move-left/right arrows are lucide
  `ArrowLeftToLine` / `ArrowRightToLine`; the colour picker is 224×332 (was ~286×470).
- Everything is committed and pushed to `main`.

## In progress
Nothing mid-flight.

## Next steps
1. Zeni to check the new pills, sliders and theme rows on `:5200` (hard refresh).
2. **Get the Figma file shared as EDITOR** with the account the Figma MCP signed in as — then re-read
   node `296:14588` and fine-tune the pill's exact sizes (they were measured from a screenshot).
3. Decide whether the *Remove sections* list should say "Quick links" instead of "Custom Card".
4. `useRestingSpacing` reads Announcements' spacing as 0 on every side — needs a real fix.
5. Still open in `D:\Motadata\support-portal-templates`: `layouts/3h.html` (Concierge) card work and
   the Most Read icon colour (`2b`).

## Decisions made
- **One shared style per control**, applied centrally rather than per call site: `MiniRange` for
  sliders, `.pill-track` for tab strips, `withoutAlignment()` for the sidebar. That way a new spec
  or strip can't drift from the rest.
- **The selected pill is painted by `aria-pressed="true"`**, so the visual state and the accessible
  state are the same thing.
- **The sidebar slider restyle applies to ALL panel sliders**, not only border/radius, so one panel
  never shows two slider styles. Zeni can ask to narrow it.
- **The theme dot moved beside the name** (top right) rather than being dropped — reading of "title
  with dot on the right side, remove the dot from the card". One-line change if the dot should go.

## Gotchas & notes
- **Figma MCP is installed** (`claude mcp add … figma`, stored in the `.claude-pro` profile) but the
  Nodebase Workflow file returns *"you don't have edit access"* — Figma's MCP needs editor access.
- **A second terminal's transcript** lives under `~/.claude/projects/…` (not `.claude-pro`); read big
  ones with `tail -c`.
- **Never quote an apostrophe inside a `node -e '…'` in Bash** — it ends the shell string. Write the
  script to a file with the Write tool instead (the heredoc/backslash gotchas in CLAUDE.md are related).
- **`.pill-track` is unlayered CSS**, so a plain `hidden` on the track won't hide it — use `!hidden`.
- Commit named files only — never `git add -A` (untracked design sources live in the tree).
- Pre-existing typecheck noise to ignore: `splitNode`/`splitInfo` on `CanvasCtx` (PortalCanvas),
  the TS1117 duplicate key in `portalWidgetSpec.ts`, a `ToggleRow` prop error in `PortalWidgetDrawer`,
  and a couple in `PortalControls` / `PortalBoxControls`.
