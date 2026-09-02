# Support Portal templates — the design brief

The prompt a senior product designer would be given before touching this, and the one I work from.

---

## 1. The reader

Not an admin. Not a technician. **A person with a problem, on the worst five minutes of their
working day.** Their printer is dead, they cannot get into a system, or they need a laptop for
somebody starting Monday. They did not choose to be here and they will not explore.

Everything below follows from that:

- **They arrive with a question, not a task.** So a field beats a menu.
- **They cannot name their problem in your vocabulary.** They will not type "incident" or
  "service request". They type "wifi not working".
- **They will not read a second screen.** Whatever the page does not answer, it must hand off in
  one click.
- **They are not coming back.** Nothing may rely on learned behaviour.

## 2. What makes this ITSM and not a marketing site

The reference board is Apple, Zendesk, Discord, Atlassian — consumer help centres. They are right
about the *shape* and wrong about the *substance*, and the difference is the whole job:

| Consumer help centre | An ITSM portal |
|---|---|
| Anonymous visitor | A **signed-in** requester with a history |
| Nothing to show them | **Their own open work**, waiting |
| One outcome: read an article | Four: read · raise · approve · check |
| Content is the product | Content is **deflection**; the queue is the product |

⚠️ **This is the line every template must hold.** A portal that only searches is a help centre with
a logo on it. The requester's own records — open requests, pending approvals, assigned assets — are
the thing no consumer site can show and the reason they log in rather than Google it. A template may
push that below the fold; it may never remove it.

## 3. Design philosophy

**One decision per screen height.** The first viewport asks one question. Everything else is the
answer to a question they have not asked yet, and belongs underneath.

**Deflection is a kindness, not a cost saving.** An answer now beats a ticket resolved on Thursday.
So knowledge sits *above* the ticket form wherever the portal's traffic allows it — but never
*instead of* it, because the person whose laptop will not boot cannot read their way out.

**Status is content.** "Pending approval, 2 days" is the most valuable string on the page. It is
the answer to the question that would otherwise become a phone call.

**Quiet is a feature.** This page is read under stress. Every gradient, shadow and accent competes
with the one thing that matters, which is the first field or the first row. Restraint here is not
minimalism as a style — it is legibility under load.

**Templates differ by FIRST SCREEN, not by colour.** Five recolours is one template five times.
What separates them is what the requester is asked to do first.

## 4. Constraints this build imposes

- **Same data.** Every template renders the real ServiceOps records the portal already carries.
  No invented content, no lorem, no placeholder counts.
- **A template is a PRESET, not a renderer.** The page is already fully data-driven: block order,
  row order, column counts, hero height/colour/alignment/search width, per-node styles and theme
  are all config. ⚠️ A template that needed its own rendering path would be a second page to
  maintain, and the two would drift the first time a widget changed. This is the codebase's own
  rule — see the note on `BLOCK_ORDER_V2`: *"Seeds, not a second renderer."*
- **Every block stays reachable.** A template that hides a widget must leave it addable from the
  palette. Hiding is an opinion; deleting is a decision the admin has not made.
- **Accessibility is not a pass at the end.** Hero text over a colour must clear 4.5:1 — the
  builder already measures it (`portalContrast.ts`), so there is no excuse for shipping a banner
  that fails.

## 5. The five, and the job each does

| # | Template | Traffic it is for | First screen |
|---|---|---|---|
| 1 | **Classic Service Desk** | Mixed | Search · four actions · my work |
| 2 | **Search Spotlight** | Mostly "how do I…" | One field, nothing else |
| 3 | **Service Catalog First** | Mostly requests | Browsable categories |
| 4 | **Knowledge Hub** | Reference-heavy | Curated collections |
| 5 | **People & HR Desk** | Non-IT | HR services · policy documents |

## 6. Template 1 built: Search Spotlight

**The question it asks:** *"What are you trying to do?"* — and nothing else, until it is answered.

- **A flat indigo field, not a gradient.** The default hero is a blue gradient with line artwork.
  Beautiful, and it competes with the search bar sitting on top of it. Flat colour makes the input
  the only bright object in the first viewport.
- **Taller, and the search is wider and fully rounded.** 340px band, 52% search, pill radius. The
  field should read as the subject of the page, not a control on a banner.
- **Most Read Knowledge moves to the FIRST card position**, ahead of My Open Requests. That single
  reorder is the whole thesis: this portal answers before it files.
- **The action cards KEEP their overlap.** This brief first said to drop it — that the 62px rise
  would crowd the field. Built and looked at, the opposite is true: the cards anchor the bottom of a
  340px band that would otherwise end on nothing, and they sit well clear of the search. Recorded as
  a reversal rather than quietly deleted, because the reasoning was wrong, not the rule.
- **Favourite Services and Most Used Services are dropped from the page**, not deleted from the
  product. A spotlight page is short; two browse rows above the fold is the opposite of one
  question.
- **My Assets and My CIs come off the first screen** for the same reason, and stay one click away.

**What is deliberately NOT changed:** the cards, the rows, the type stack, the icon set and every
record on the page. A template that changed those would be a different product, not a different
template — and the manager reviewing this needs to see the same ServiceOps underneath.
