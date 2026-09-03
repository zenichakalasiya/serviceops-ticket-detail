# Custom Data Widget — panel content, read off the reference build

Source: `https://juligopani.github.io/-serviceops-ticket-detail/#/admin/support-portal`
Read from the **live DOM** on 3 Sep 2026 by driving the builder, not from a bundle —
an earlier pass in this project compared against a stale bundle and got a wrong answer.

## Panel shape

| Part | Value |
|---|---|
| Widget title (drawer heading) | **Custom Data Widget** |
| Description under the title | **none** — the drawer goes straight from the title row to `CONTENT` |
| Sections | `CONTENT` → `DESIGN` (Style, Spacing) |

⚠️ There is **no description line** on this widget's drawer. The title row carries only the
name and the reset control.

## CONTENT fields, in order

| # | Label | Control | Default |
|---|---|---|---|
| 1 | **Title** | text | `My records` |
| 2 | **Module** | select | `Requests` |
| 3 | **Filter** | select (filter icon) | `All My Requests` |

## Module options (6)

```
Requests
Changes
Assets
Configuration Items
Approvals
Knowledge
```

## Filter options — per module

⚠️ The Filter list is **dependent on Module**, and every list opens with the same
`No filter — every record` and closes with `Custom filter`.

### Requests
```
No filter — every record
All My Requests
My Open Requests
My Pending Requests
My Resolved Requests
My Closed Requests
My Overdue Requests
My High Priority Requests
Custom filter
```

### Changes
```
No filter — every record
My Changes
My Active Changes
My Completed Changes
Custom filter
```

### Assets
```
No filter — every record
My Assets
My Active Assets
Custom filter
```

### Configuration Items
```
No filter — every record
My CIs
My Active CIs
Custom filter
```

### Approvals
```
No filter — every record
My Approvals
Pending Approvals
Completed Approvals
Custom filter
```

### Knowledge
```
No filter — every record
Most Read Knowledge
Recently Published
Recently Updated
Custom filter
```

## DESIGN section

Two groups, both from the shared packs — nothing bespoke:

- **Style** — Fill (`None` / `Colour`), Border (slider + `1` `px` + swatch), Corner radius (slider + `8` `px`)
- **Spacing** — collapsed

`Expand all` sits on the DESIGN heading.

## Notes for the port

- ⚠️ **Filter must clear when Module changes.** A filter holding the previous module's words
  (`My Open Requests` on a Changes widget) matches nothing and empties the card for a reason
  nobody can see. This is the `consequence` mechanism the Record List widget already uses.
- The default Filter shown on arrival is `All My Requests`, which is the Requests list's second
  entry — not `No filter — every record`. So the seeded default is a real filter, and
  `No filter` is an option you pick rather than the resting state.
