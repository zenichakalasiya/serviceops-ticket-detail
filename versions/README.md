# Module versions

Every module in this project keeps its own versions (Support Portal v1, v2… and Form Rules v1, v2… count
separately). A version is **proof of a flow we proposed**: the app exactly as it was at one commit, kept
at a permanent link so "before" and "after" a discussion with dev / backend can be opened side by side.

- **All versions:** https://zenichakalasiya.github.io/serviceops-ticket-detail/versions/
- **One version:** `…/versions/<module id>/<version>/`, e.g. `…/versions/support-portal/v1/` — it lands
  on that module's own screen.

## The rule

**Never make or change a version without asking Zeni first:** a NEW version, or UPDATE the current one?

- **New version** → add an entry to that module's `versions` in `versions.json`.
- **Update the current one** → change the latest entry's `commit` (and its `changes`) in place.

## Adding a version

1. The work must be **committed** — a version freezes a commit, never uncommitted files.
2. Add the entry in `versions.json`:
   ```json
   { "version": "v2", "date": "2026-11-02", "commit": "<short sha>",
     "changes": ["What changed and why, one line per major change."] }
   ```
   `changes` = the major changes in this version (what was proposed, what changed after the discussion).
3. Push to `main`. The deploy builds any commit that has no build yet (once, ~2 min extra) and the new
   link goes live with the site.

A new module = a new entry in `modules` with an `id` (used in the URL), `name`, `area` (the heading it
sits under on the versions page) and `route` (the screen the link opens, e.g. `#/admin/support-portal`).
Work from another folder in `D:\Motadata` is versioned here once it has been moved into this project.

## How it works

`scripts/build-versions.mjs` runs in CI after the main build. Each pinned commit is built once with its
own base path (`/serviceops-ticket-detail/versions/builds/<sha>/`) and stored on the **`versions-builds`**
branch, so `main` stays light. Several module versions pinned to the same commit share one build. The
deploy copies only the builds still referenced, writes the short links and the index page.

Local preview of the index page only: `node scripts/build-versions.mjs --page-only` → `dist/versions/`.

⚠️ Each build is ~19 MB and GitHub Pages allows 1 GB per site, so roughly 40 distinct commits can be live
at once. Pinning several modules' versions to the same commit costs one build.
