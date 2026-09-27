# Handoff — 2026-09-27 22:27

## Read first
All work is in the **Support Portal** (Admin › Support Channels) — the builder and its listing page.
In `CLAUDE.md` › Key context, read these bullets (dated 25–27 Sep 2026):

1. *"the card's switch IS the status"* — the current publish model. It supersedes several earlier
   notes about an "Enabled" flag, an always-on default and a second Draft pill.
2. *"the LISTING is CARDS, and the default can be moved"* — the `PortalCard` layout and the
   publish-and-make-default rules (`ConfirmPublish`, `publishAsDefault`, `defaultId`).
3. *"EVERY widget has Replace, predefined ones included, and it swaps IN PLACE"*.
4. *"Solid / Gradient are CHIP tabs"* and *"ONE tab strip everywhere: the Figma pill"*.

## What we worked on this session
Replace on every widget; the Support Portal listing rebuilt as cards; a clear one-live-portal publish
model; and more control polish (chip tabs, pill sizing, the light/dark toggle icons).

## Completed
- **Replace on every widget** — the built-in blocks (My Open Requests, Approvals, Assets, CIs,
  Announcements, Most Read, Contact Us, Favourite / Most Used Services) get "Replace this widget". A
  predefined widget swaps for ANY widget; the replacement takes the original's exact slot.
- **Portal listing = cards** (`PortalCard`): one header row (small icon · name · Published/Draft ·
  Default · switch), URL + Last modified, and a footer with **Customise portal** plus icon actions.
- **One portal live at a time, and it is the default.** Publishing (or starring, or switching on) a
  non-default portal asks "Publish and make it the default?"; confirming moves the previously live
  portal to Draft. **Save as draft unpublishes.** The card's **switch is the status** (on = Published).
- **Builder's main button always says Publish** (it used to relabel itself "Save as draft").
- **Solid / Gradient** in the colour popups are outlined chip tabs with a blue check.
- **Pill tabs size to their labels** ("Default" no longer overflows); **light/dark icons** full size.
- All committed and pushed to `main`.

## In progress
Nothing mid-flight.

## Next steps
1. **Contact Us: "remove this"** — Zeni asked to remove something from the Contact Us card but the
   screenshot never came through. Ask which part (heading, phone, email, icons, divider).
2. Zeni to confirm the publish model feels right on `:5200` (hard refresh first).
3. Figma pill sizes were measured from a screenshot — re-read node `296:14588` once the file is shared
   with the Figma MCP account as an EDITOR.
4. Carried over: the *Remove sections* list naming ("Custom Card" vs "Quick links");
   `useRestingSpacing` reading Announcements as 0; the `support-portal-templates` repo items.

## Decisions made
- **A predefined widget can be replaced by ANY widget** (Zeni) — the same-class rule left the picker
  empty on the default page. Ordinary widgets still swap only for their own kind.
- **Quick Actions cards are not replaceable** — their row is locked to the product's four actions.
- **A portal is Published OR Draft, never both; Save as draft unpublishes** (Zeni). So the default
  portal can be a Draft, and then no portal is live until one is published.
- **One live portal = the default.** Making a portal default IS publishing it, which is why the star
  and the switch both open the same publish dialog.
- **Set as default** was added because the brief mentioned it and nothing supported it.

## Gotchas & notes
- **Replacement in place** needs `PlacedElement.replaces`: appending a replacement to a built-in row
  (the old `dropInRow` route) squeezed the work band's cards to slivers.
- **A hidden BAND hides everything anchored under it** (`band()`), so a replacement for Favourite /
  Most Used Services is anchored to the nearest visible band above.
- **Check an icon's COMPUTED width** when it looks small — a flex item was squeezing a 16px svg to 8px.
- **The dev server can take >60s to serve the first page** after start; wait on `curl` before tests.
- **`node -e '…'` breaks on an apostrophe or backtick** in the text — write scripts to files.
- Commit named files only — never `git add -A`. Pre-existing typecheck noise listed in the previous
  handoff still applies (`splitNode`/`splitInfo`, the `portalWidgetSpec.ts` TS1117, and a few others).
