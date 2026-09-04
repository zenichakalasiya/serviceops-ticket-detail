# Prompt — put ServiceOps' real data into the layout system, and change nothing else

> Paste everything below this line into Claude Design, with
> `Support Portal Layout System.dc.html` attached.

---

## What I want

The file has **14 finished layouts** (`2a`–`4b`). Every one of them is reviewed, signed off and
**final**. I am not asking you to design anything.

What I am asking for is a **content pass**: every template must show the **same data — my product's
real Support Portal data** — because these are 14 layouts of *one* portal, not 14 different products.
Right now the templates carry invented content from five different fictional tenants (a university,
a manufacturer, a hospital trust, a transport operator, a council), which makes them read as
different products rather than as one portal arranged five different ways.

**One dataset. Fourteen layouts. Nothing about any layout moves.**

---

## The rule that matters most

> **Change only the words. Never the shape.**

Concretely — you may **not** touch any of the following, in any artboard:

- The artboard set, their order, their `id`s (`2a`, `2b`, `2c`, `3a`–`3i`, `4a`, `4b`), their names
  (Prism, Ledger, Front Door, Marquee, Sidecar, Counter, Switchboard, Ribbon, Stack, Foyer,
  Concierge, Wayfinder, Service Center, Broadsheet) or their one-line descriptions.
- Any markup structure. No element added, removed, reordered, merged, split or re-nested.
- Any CSS. No class, no inline style, no `grid-template-columns`, no `span`, no gap, padding,
  radius, shadow, font-size, weight or letter-spacing.
- The colour system — the `ink` / `brand` / `brandLite` / `accent` / `porcelain` / `hc` tokens and
  every derived value computed from them at the top of the script block.
- **The number of items in any array.** ← this is the one that silently breaks a layout. See
  *The count rule* below. A grid built for 18 tiles with 4 in it is a broken grid, and it will not
  look broken in your head — it will look broken on the page.
- Any non-text field on a data row: the icon slot `i`, the colour slots `bg` / `fg` / `ic` / `ac` /
  `hf` / `dot` / `pillBg` / `pillFg` / `iconBg` / `iconFg` / `rowBg` / `rowBd` / `rowSh` / `sb` /
  `sf` / `btnBg` / `btnFg` / `bd`, the span `sp`, the percentage `pct`, the rank `r`, the rating.
- The chrome: nav rails, top bars, `Ask AI`, the avatar, search placement, sticky behaviour.

You may **only** change human-readable strings: names, subjects, IDs, dates, categories, statuses,
counts written as text, headings, and the tenant identity.

If a change you are considering would alter how anything is positioned or sized — **stop, and leave
it alone.** Report it at the end instead (see *What to report back*).

---

## Where the data is

Almost all of it is in **one object**, in the `<script type="text/x-dc" data-dc-script>` block near
line 2905. It returns ~52 arrays which **all 14 artboards share**. Editing a value there changes
every template that uses it, and touches no markup at all. That is the intended route for this task
— do the overwhelming majority of the work here.

A **small remainder is hardcoded in the artboard markup** — card headings and the tenant line. Those
are listed explicitly in *Hardcoded strings* below. Change those in place; do not move them, do not
restyle them, do not turn them into bindings.

---

## The canonical data — this is the source of truth

Use these values **verbatim**. Same spelling, same casing, same IDs, same dates.

### Tenant identity — one tenant across all 14 artboards

| | |
|---|---|
| Company | **Acme Corporation** |
| Portal | **Support Portal** |
| Desk | **IT Service Desk** |
| Signed-in user | **Yash** (avatar initials `YG`) |
| Support email | **servicedesk@acme.com** |
| Support phone | **+91 79 4040 0000** |
| Hours | **Mon–Fri 08:00–20:00 IST** |

Every occurrence of *Northfield University · IT & Campus Services*, *Kestrel Manufacturing · Plant
Services*, *Kestrel Manufacturing · Plant 2 Service Counter*, *St. Aldwyn's Hospital Trust · Staff
Support*, *Ashfield · Staff Services* and *Transport · Employee Services* becomes
**Acme Corporation · IT Service Desk**, in the same slot, at the same length-ish. Nothing else about
those lines changes.

### Hero

| | |
|---|---|
| Title | Welcome to Support Portal |
| Subtitle | Search our support center knowledge base |
| Search placeholder | How can we help you? |

Where a layout's hero copy is part of its *character* rather than generic filler — Marquee's
"Report it once. / We'll take it from there.", Front Door's "What do you need?" — **keep the
layout's line.** It is a design decision, not data. Only replace hero copy that names a fictional
tenant or a domain that is not IT service management.

### Quick actions — exactly four, in this order

| Title | Subtitle |
|---|---|
| New Incident | Report an incident |
| Request Service | Browse the services offered |
| AD Self Service | Reset your domain password |
| Knowledge | Browse knowledge |

⚠️ These four are the product's fixed destinations. Where a layout shows fewer (Sidecar's rest-list,
`actions2`, `bannerActionsRest`), take them from the top of this list in order. Where a layout shows
**more** than four, see *The count rule*.

### My Open Requests — card title **"My Open Requests"**

| ID | Subject | When | Status |
|---|---|---|---|
| SR-201 | Request for New Laptop | Wed, Aug 12, 2026 10:09 AM | Open |
| INC-187 | Cannot Create KB Article | Mon, Aug 10, 2026 11:43 AM | In Progress |
| SR-180 | Employee On-boarding | Wed, Aug 05, 2026 03:22 PM | Open |
| INC-178 | Password Reset Required | Wed, Aug 05, 2026 12:03 PM | Pending |
| INC-170 | Laptop Slow and Lagging | Tue, Aug 04, 2026 03:51 PM | In Progress |
| SR-166 | Access to Finance Drive | Mon, Aug 03, 2026 09:14 AM | On Hold |
| INC-159 | VPN Disconnects Frequently | Fri, Jul 31, 2026 04:02 PM | Open |
| INC-151 | Monitor Flickering | Thu, Jul 30, 2026 11:20 AM | Resolved |
| SR-147 | Software License Renewal | Wed, Jul 29, 2026 02:45 PM | Closed |
| INC-142 | Printer Not Responding | Tue, Jul 28, 2026 10:33 AM | Reopened |

Ten rows, so an 8-row layout and a 4-row layout both come from the top of one list and agree with
each other. **Where a layout prints a short date** (`Aug 12, 10:09 AM`), keep its short form —
shorten from this table, do not paste the long form into a slot built for the short one.

### Pending Approvals — card title **"Pending Approvals"**

| ID | Subject | Reason | By | When | Initials |
|---|---|---|---|---|---|
| INC-192 | Wrong configuration details | Peer review requested | Rosy | Tue, Aug 11, 2026 02:14 PM | RO |
| AST-13 | DESKTOP-5JPPI6F | Approval Required for - AST-13 | Keya | Mon, Aug 10, 2026 12:57 PM | KE |

⚠️ **There are exactly two.** A layout built for three (`approvals3`) needs a third — see
*The count rule*; use the file's own existing third row (`SR-158 · Adobe Creative Cloud licence`),
which is already ITSM-generic, rather than inventing one.

### Most Read — card title **"Most Read"**

| ID | Title | When | Tag |
|---|---|---|---|
| KB-4 | How to Reset Your Password | Thu, Jul 30, 2026 11:34 AM | Guideline Documents |
| KB-1 | Connecting to Company VPN | Sun, Jul 19, 2026 10:58 PM | FAQs |
| KB-6 | Reporting a Hardware Fault | Tue, Aug 11, 2026 04:38 PM | Guideline Documents |

⚠️ **Three.** The read-counts in the file (`2.4k reads`) are not our data but they are harmless
ITSM-generic garnish — keep them where a layout's row is built to show one. For layouts needing 6 or
8 articles, keep the file's existing extras (they are already generic: *Requesting Software for a
New Starter*, *Setting Up Multi-Factor Authentication*, *Booking a Meeting Room from Outlook*, …) and
put our three at the top in the order above.

### My Assets — card title **"My Assets"**

| ID | Name | Type |
|---|---|---|
| AST-3 | Dell Latitude 5440 | Laptop |
| AST-1 | Dell UltraSharp U2723QE | Monitor |
| AST-7 | Logitech MX Master 3S | Mouse |
| AST-12 | Jabra Evolve2 65 | Headset |
| AST-9 | iPhone 14 | Mobile |

### My CIs — card title **"My CIs"**

| ID | Name | Type |
|---|---|---|
| CI-8 | hostname | Base CI |
| CI-7 | P1 | Base CI |
| CI-5 | localhost.localdomain | Linux Desktop |
| CI-3 | app-prod-01 | Server |

### Announcements — card title **"Announcements"**

| Title | Date |
|---|---|
| Planned network maintenance — Sat 16 Aug, 02:00–05:00 | 11 Aug 2026 |
| New VPN client rollout begins next week | 08 Aug 2026 |
| Service desk hours extended to 20:00 IST | 04 Aug 2026 |
| Asset refresh cycle moves from 4 years to 3 | 29 Jul 2026 |
| Security awareness module due by 30 September | 22 Jul 2026 |

The kicker field (`k`: *Maintenance*, *Rollout*, *Service desk*, *Policy*, *Training*) is the
layout's, not ours — keep it.

### Favourite Services — card title **"Favourite Services"**

| Name | Category |
|---|---|
| Employee Off-boarding | HR |
| Microsoft Office 2019 | Software |
| Payroll Setup | Finance |
| Flight Booking | Travel |

### Most Used Services — card title **"Most Used Services"**

| Name | Category |
|---|---|
| New Laptop Request | Hardware |
| Software Installation | Software |
| VPN Access | Network |
| New Employee Onboarding | HR |

### Contact Us — card title **"Contact Us"**

| Label | Value |
|---|---|
| Email | servicedesk@acme.com |
| Phone | +91 79 4040 0000 |

---

## The count rule

**Every array keeps exactly the length it has today.** The layouts are built around these counts —
`catalog18` fills an 18-cell mosaic, `deptCards12` a 12-tile keypad, `svcCards` an 8-card directory.

- **Our list is longer than the array** → take the first N, in our order. Never reorder to fit.
- **Our list is shorter than the array** → keep our rows at the top in our order, and fill the
  remainder with **the rows already in the file**, provided they are ITSM-generic. Most of them are
  (*Track a Request*, *Setting up external monitors*, *Request a work phone*, *Software & Licences*,
  *Expenses*, …) and they should simply stay.
- **A filler row carries another domain's vocabulary** → replace only that row, with something from
  the same ITSM vocabulary our data already uses. The ones to catch: *Forklift booking*, *PPE
  reissue*, *Shift swap*, *Plant*, *Ward IT*, *clinical apps*, *Campus notices*, *Rewards*,
  *Learning*, *Benefits* — and any category, topic or department tile named for a campus, a ward,
  a plant floor, a branch or a store.
- **Never** add or drop an array item to make our data fit. If our data genuinely cannot fill a
  slot honestly, leave the file's row and list it in *What to report back*.

---

## Vocabulary — keep these consistent everywhere

- **ID prefixes:** `INC-` incident · `SR-` service request · `AST-` asset · `CI-` configuration
  item · `KB-` knowledge article. Nothing else.
- **Statuses:** Open · In Progress · Pending · On Hold · Resolved · Closed · Reopened. A layout that
  uses a different word for a state (Sidecar's *Awaiting parts*, *Pending you*) is expressing its
  own design — leave it; just make sure the record it describes is one of ours.
- **People:** Rosy, Keya, Amit V., Yash. `Unassigned` where a record has no owner.
- **Dates:** the file's own format per layout. Long (`Wed, Aug 12, 2026 10:09 AM`) or short
  (`Aug 12, 10:09 AM`) — match whatever that slot already prints. Do not introduce a third format.
- **Module names, exactly:** My Open Requests · Pending Approvals · Most Read · My Assets · My CIs ·
  Announcements · Favourite Services · Most Used Services · Contact Us.
  ⚠️ Rename the layouts' variants onto these: *My Requests* → **My Open Requests**, *Waiting on you*
  → **Pending Approvals**, *Campus notices* / *Your feed* / *What's changed* → **Announcements**,
  *Popular services* / *Services you use* → **Most Used Services**, *Top articles* / *Popular
  articles* → **Most Read**. Same slot, same styling — only the words.

---

## Hardcoded strings in the markup

These are not in the data object. Change them in place, and nowhere else:

- The tenant line under the logo, in every artboard that has one.
- Card headings: *My Requests*, *Waiting on you*, *Campus notices*, *Popular services*, *Your feed*,
  *Your activity*, *Your last 3 tickets*, *Services you use*, *Most used*, *Contact us*.
- Greetings: *Welcome back, Yash* / *Good afternoon, Yash* — already correct, leave them.
- Contact blocks: already `servicedesk@acme.com` / `+91 79 4040 0000` — leave them.
- Counters printed as literals (`Requests 5`, `Approvals 2`, `All 214`, `All 412`) — make them agree
  with the data they sit above. If a layout says `All 214` over a service catalogue, keep 214; it is
  a catalogue size, not one of our rows.

---

## Do not invent

- No new services, articles, assets, CIs, requests or approvals beyond what is above and what the
  file already contains.
- No new tenant, no new person, no new department, no new domain.
- No new copy for empty states, tooltips or helper text — if a layout has one, it stays as written.
- If you are unsure whether something is our data or the layout's design, **treat it as the
  layout's design and leave it.** A layout that keeps one generic filler row is fine; a layout with
  a changed grid is not.

---

## What to report back

When you are done, give me a short list — no prose:

1. Every artboard you touched, and roughly what changed in it.
2. Any array where our data could not fill the count honestly, and what you left in place.
3. Anything you found that looked like a layout bug — **do not fix it**, just name it.
4. Confirmation that no `style`, no class, no element and no array length changed anywhere.
