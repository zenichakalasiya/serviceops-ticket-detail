# Prompt — nine industry portals, by widget order

> Paste everything below this line into Claude Design, with
> `Support Portal Layout System.dc.html` attached.

---

## What I want

Nine **industry variants** of the ServiceOps Support Portal. Every one is built from the **same nine
data cards and the same four action cards** — the set every customer gets out of the box. What
changes between them is only three things:

1. **The order** the widgets appear in, top to bottom.
2. **What the four action cards are called.**
3. **Which cards are dropped**, because they are dead weight for that industry's requester.

This is deliberately the opposite of the earlier content-pass prompt. There I asked you to change
only the words and never the shape. **Here the shape is the whole point** — the widget order *is*
the deliverable.

---

## The vocabulary — use these exact names

Do not invent a widget. If a layout needs something not on this list, say so rather than drawing it.

**Chrome**
`Banner` · `Search`

**Action cards** — the row of four fixed destinations
`New Incident` · `Request Service` · `AD Self Service` · `Knowledge`

**Data cards** — the nine out-of-the-box cards
`My Open Requests` · `Pending Approvals` · `My Assets` · `My CIs` · `Announcements` ·
`Most Read Knowledge` · `Contact Us` · `Favourite Services` · `Most Used Services`

---

## How to read each block

```
1. Widget                      one full-width row
2. Widget | Widget             ONE row, two columns, in that left-to-right order
3. Widget | Widget | Widget    ONE row, three columns
RAIL: Widget, Widget           a narrow right-hand column beside the row above it
```

**Banner** names one of the twenty-one artboards already in the file, by name and id — reuse that
banner's shape rather than designing a new one.

**RENAME** changes a card's visible label only. The destination behind it does not move: a card
renamed "Report a Breakdown" still opens the incident form.

**DROP** means the card is not on the page. It is not deleted from the product — the customer can
still add it back — so do not remove it from any palette or catalogue you find.

---

## The nine

---

### 1 · IT / ITES — "Service Desk"

The reference. Build this one first; the other eight are measured against it.
**Requester:** ITES shift lead, eight visits a month, knows exactly what he wants.
**Banner:** Rails (`4i`) — greeting + three counters, no search band.

```
1. Banner
2. New Incident | Request Service | AD Self Service | Knowledge
3. My Open Requests | Pending Approvals | Most Read Knowledge
4. My Assets | My CIs
   RAIL: Announcements, Contact Us
```

**RENAME:** none.
**DROP:** none. `Favourite Services` and `Most Used Services` are optional here — include only if the
customer runs a large catalogue.

**Why:** this user navigates by their own queue, not by searching, so the banner answers "how many
are open" before they scroll and the search band comes out. Announcements goes to the rail because
IT organisations post news to Teams and Slack, not to the portal.

---

### 2 · Healthcare — "Ward" (clinical staff)

**Requester:** ward nurse, night shift, gloved, on a shared workstation-on-wheels. Thirty seconds.
**Banner:** Broadsheet (`4b`) — compact masthead, no search competing for the fold.

```
1. Banner
2. Announcements                          ← full width, immediately under the banner
3. New Incident                           ← DOUBLE WIDTH, the only large tile on the page
4. AD Self Service | Knowledge            ← small
5. My Open Requests                       ← 3 rows maximum
6. Contact Us                             ← ward extension, 24×7, visible without scrolling
```

**RENAME:**
- `New Incident` → **"Report a Fault"**
- `Knowledge` → **"Clinical IT how-to"**
- `AD Self Service` → **"Reset my Password"**

**DROP:** `Pending Approvals` · `My CIs` · `My Assets` · `Favourite Services` · `Most Used Services`

**Why:** clinicians do not approve IT requests and have no concept of a configuration item — an
empty card at the top of a thirty-second page is worse than no card. Announcements sits second
because in a hospital it carries **EMR downtime**, which is the one thing that must be read before
anything else.

**Constraint:** ward PCs are commonly **1366 × 768**. Everything above `My Open Requests` must clear
that fold.

---

### 3 · Pharma — "Lab & GxP" (regulated / validated systems)

**Requester:** QA analyst. Approvals are the work, and every one is audit evidence.
**Banner:** Ledger (`2b`) — date + greeting + four counters.

```
1. Banner
2. Request Service | New Incident | Knowledge | AD Self Service
3. Pending Approvals                      ← full width, FIRST among the data cards
4. My Open Requests | Most Read Knowledge
5. My Assets                              ← qualified instruments; show asset id
   RAIL: Announcements, Contact Us
```

**RENAME:**
- `Request Service` → **"Request a Change"** — in a validated estate almost nothing is a plain
  service request, it is a controlled change
- `Knowledge` → **"SOPs & Work Instructions"**

**DROP:** `My CIs` · `Favourite Services` · `Most Used Services`

**Why:** the date in the Ledger banner is not decoration in a regulated environment — it frames
everything under it, and the counters are the compliance posture at a glance. Approvals go above
requests because an unactioned approval is an audit finding.

**Wanted but not in the OOB set:** a **My Change Requests** list, between rows 3 and 4. Leave a
placeholder row for it.

---

### 4 · Manufacturing — "Plant Floor"

**Requester:** line supervisor at a wall-mounted kiosk shared by the whole line, often signed in as
nobody. Gloved, poor light. Downtime costs money per minute.
**Banner:** Counter (`3c`) — big brand band, large tiles, high contrast.

```
1. Banner
2. New Incident                           ← KIOSK SCALE. The largest thing on the page.
3. Knowledge | Request Service            ← small
4. Announcements                          ← shift and safety notices
5. Most Read Knowledge
6. Contact Us                             ← maintenance extension, large
```

**RENAME:**
- `New Incident` → **"Report a Breakdown"**
- `Knowledge` → **"Work Instructions"**

**DROP:** `AD Self Service` · `My Open Requests` · `Pending Approvals` · `My Assets` · `My CIs` ·
`Favourite Services` · `Most Used Services`

**Why the long drop list:** every one of those cards is scoped to a *person*, and this page is used
by a *station*. AD Self Service goes because shared terminals frequently have no individual
directory account — the card would fail for most of the people who pressed it.

**Design for:** gloves and poor lighting. Larger touch targets than any other template here, and the
highest contrast.

**Wanted but not in the OOB set:** **Open Breakdowns on this Line** — the same list as
`My Open Requests` but scoped to the line rather than the person. Put it at row 3 and mark it.

---

### 5 · Manufacturing — "Plant Office" (engineering & plant IT)

**Requester:** plant systems engineer. Desk-based. Plans changeovers; owns the MES integration.
**Banner:** Rails (`4i`).

```
1. Banner
2. Request Service | New Incident | AD Self Service | Knowledge
3. My Open Requests | Pending Approvals
4. My Assets | My CIs                     ← both earn their place; the CI *is* the machine
   RAIL: Most Read Knowledge, Contact Us
```

**RENAME:** `Request Service` → **"Request a Change"**, moved to first position.

**DROP:** `Favourite Services` · `Most Used Services` · `Announcements` (to the rail if kept).

**Why this is not just Service Desk:** `My CIs`. Nowhere else in these nine does a requester
genuinely think in configuration items — here they do, because the CI is a PLC or an HMI.

**Wanted but not in the OOB set:** **My Change Requests**, between rows 3 and 4.

---

### 6 · Government — "Civil Service"

**Requester:** department clerk. Six visits a year, low confidence with new interfaces. Nine times
out of ten he wants the *circular* and the *steps*, not a form.
**Banner:** Bulletin (`3j`) — tall, search-led, large heading.

```
1. Banner                                 ← the search is the primary control on this page
2. Announcements                          ← full width. Circulars and notices.
3. Most Read Knowledge                    ← large
4. Knowledge | Request Service | New Incident | AD Self Service
5. My Open Requests | Pending Approvals
6. Contact Us                             ← helpdesk number AND the hours it is answered
```

**RENAME:**
- `Knowledge` → **"Find a Procedure"** — and it leads the action row. This inverts every other
  template here, and it is correct: this sector reads far more than it raises.
- `New Incident` → **"Raise a Grievance"** — "incident" is not the vocabulary of a government
  office, and a card nobody recognises is a card nobody presses.
- `Request Service` → **"Apply for a Service"**
- `AD Self Service` → **"Reset my Password"**
- `Announcements` → **"Circulars & Notices"**

**DROP:** `My Assets` · `My CIs` · `Favourite Services` · `Most Used Services`

**Non-negotiable:** this template is bought on **accessibility**. Larger base type than the other
eight, WCAG AA contrast throughout, and every control reachable by keyboard. Assume it will be
tested at procurement.

---

### 7 · Education — "Campus" (students)

**Requester:** undergraduate on a phone, at 11pm, on mobile data. Ten seconds of patience.
**Banner:** Help Desk (`4a2`) — one big centred question and a large search field.

```
1. Banner
2. AD Self Service | New Incident | Request Service | Knowledge
3. Most Read Knowledge                    ← the same ten answers every September
4. Announcements                          ← term dates, exam schedules, outages
5. My Open Requests                       ← 3 rows maximum
```

**RENAME:**
- `AD Self Service` → **"Reset my Password"** — first, and the largest of the four. It is the
  single highest-volume student request in any campus service desk, and it is fully self-served.
- `New Incident` → **"Wi-Fi & Network Help"** — name the problem, not the process.
- `Request Service` → **"Labs, Software & Access"**

**DROP:** `My Assets` · `My CIs` · `Pending Approvals` · `Favourite Services` · `Most Used Services`
(keep `My Assets` only where the institution runs a laptop-loan scheme.)

**Design for:** **375px first.** This is the only one of the nine where the phone is the primary
device rather than a fallback — check it at 375 before you check it at 1440.

---

### 8 · Education — "Faculty & Staff"

**Requester:** senior lecturer and department IT liaison. Owns kit, approves purchases, needs
research computing before a deadline.
**Banner:** Wayfinder (`3i`) — search-led on a pale ground, counters in a side column.

```
1. Banner
2. Request Service | New Incident | AD Self Service | Knowledge
3. My Open Requests | Pending Approvals | Most Read Knowledge
4. My Assets | My CIs
5. Most Used Services                     ← full width
   RAIL: Announcements, Contact Us
```

**RENAME:** `Request Service` → **"Request a Service or Access"** — "access" is the word staff
search for.

**DROP:** `Favourite Services` (Most Used covers it).

**Why this is not Campus:** `Most Used Services` earns a full band here and nowhere else. A
university runs a genuinely large, genuinely browsed catalogue — teaching software, lab bookings,
research storage — and staff return to the same four or five items every term.

---

### 9 · BFSI — "Branch & Operations"

**Requester:** branch operations officer, locked out at 09:05, branch opens at 09:30. Every minute
is queue time in the lobby.
**Banner:** Dispatch (`3d`) — dark strip, greeting + counters + search on one line.

```
1. Banner
2. AD Self Service | Request Service | New Incident | Knowledge
3. Pending Approvals                      ← full width, ABOVE requests
4. My Open Requests                       ← show the SLA / due time on every row
5. Announcements                          ← maintenance windows, compliance deadlines
6. My Assets                              ← issued laptop, token, card reader
```

**RENAME:**
- `AD Self Service` → **"Unlock my Access"** — first and largest. Access and entitlement dominate
  BFSI ticket volume more than any other category.
- `Request Service` → **"Request Access"**

**DROP:** `My CIs` · `Favourite Services` · `Most Used Services` · `Contact Us` (branch staff call a
known internal extension, not the portal).

**Why approvals sit above requests:** segregation of duties means almost nothing is self-served end
to end — it is requested by one person and approved by another, and the approval is the audited
artefact.

**Wanted but not in the OOB set:** a fifth action card, **"Report a Phishing Email"**. This is the
highest-value sector-specific action in the whole set — every bank runs the campaign and staff look
for the button here. Add it to row 2 and mark it.

---

## Summary table

| # | Template | Industry | Leads with | Banner |
|---|---|---|---|---|
| 1 | Service Desk | IT / ITES | My Open Requests | Rails `4i` |
| 2 | Ward | Healthcare — clinical | Announcements (downtime) | Broadsheet `4b` |
| 3 | Lab & GxP | Pharma — regulated | Pending Approvals | Ledger `2b` |
| 4 | Plant Floor | Manufacturing — floor | Report a Breakdown | Counter `3c` |
| 5 | Plant Office | Manufacturing — office | My Open Requests | Rails `4i` |
| 6 | Civil Service | Government | Circulars & Notices | Bulletin `3j` |
| 7 | Campus | Education — student | Search | Help Desk `4a2` |
| 8 | Faculty & Staff | Education — staff | My Open Requests | Wayfinder `3i` |
| 9 | Branch & Operations | BFSI | Access & lockout | Dispatch `3d` |

---

## Four rules that keep the set coherent

1. **One dataset.** Every template shows the same ServiceOps data. These are nine arrangements of
   one portal, not nine products — the same request ids, the same asset names, the same articles.
2. **Renames are labels, never destinations.** "Report a Breakdown" opens the incident form.
   "Find a Procedure" opens knowledge. Nothing behind a card moves.
3. **A dropped card is dropped from the page, not from the product.** Leave it in any palette.
4. **Do not invent a widget.** Where a template wants something outside the OOB set — the three
   marked above — draw a labelled placeholder and list it back to me rather than designing it in.
