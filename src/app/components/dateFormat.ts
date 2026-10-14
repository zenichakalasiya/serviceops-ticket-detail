/* ── One date format for every listing ───────────────────────────────────────
   The grids used to print dates four different ways — "Tue, 19/Apr/2022 03:30 AM" in the
   Created column, "Tue, 19/04/2022 03:30 AM" for optional date columns, "02 Mar 2026" for
   the newer ones, and raw "24/07/2026" strings straight out of the licence, contract and
   purchase mocks. Two of those are AMBIGUOUS: a reader cannot tell 24/07 from 07/24
   without knowing which locale wrote it, and an ITSM grid is read by people in several.

   The house format fixes that:

       19 Apr 2026, 03:30 AM     a moment  (created, last updated, last login…)
       19 Apr 2026               a day     (start/end, expiry, required by…)

   Why this shape:
   • A THREE-LETTER MONTH can never be misread as a day — the single most common cause of
     a misread date in a multi-region service desk.
   • Day-first matches how the rest of the product writes dates and how most of its users
     read them, while the month name makes the order irrelevant anyway.
   • NO WEEKDAY. "Tue," is noise in a dense grid — nobody triages by which day of the week
     a ticket was raised — and it cost ~40px of column on every date in the product.
   • A 12-HOUR clock with a measured AM/PM, because that is what the detail pages show.
   • Time only where a field IS a moment. A contract's end date has no meaningful 00:00,
     and printing one invites the reader to believe it.

   Anything written as a SENTENCE (an SLA tooltip's "Due by Thursday, October 1, 2026")
   keeps its long prose form — these are the GRID's formats. */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const pad = (n: number) => String(n).padStart(2, '0');

/** "19 Apr 2026" — a day, with no time to imply a precision the value does not have. */
export const fmtGridDate = (d: Date) => `${pad(d.getDate())} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;

/** "19 Apr 2026, 03:30 AM" — a moment. */
export const fmtGridDateTime = (d: Date) => {
  const h24 = d.getHours();
  /* The half of the day is MEASURED, not assumed — this used to print the 24-hour hour
     beside a hard-coded "PM", so 09:22 read "09:22 PM" on every row of every listing. */
  return `${fmtGridDate(d)}, ${pad(h24 % 12 || 12)}:${pad(d.getMinutes())} ${h24 >= 12 ? 'PM' : 'AM'}`;
};

/** Parses the "DD/MM/YYYY" strings the licence / contract / purchase mocks store, so those
 *  columns can carry a real Date — which formats like every other date AND sorts
 *  chronologically instead of alphabetically ("24/07/2026" sorted before "30/06/2026"). */
export const parseLooseDate = (v: string | null | undefined): Date | null => {
  if (!v) return null;
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(v.trim());
  if (!m) {
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
};

/** The "Sat, Jul 25, 2026 10:00 PM" stamp the patch / package / registry run mocks store,
 *  stated RELATIVE to today. Only the handful of runs that are still Ready to Deploy or
 *  In Progress use it — their window has to sit against the real clock to mean anything (a
 *  run that is "live" with a window that closed months ago contradicts its own status, and
 *  the listings' "Expiring in 48h" card reads these dates against now). Finished runs keep
 *  their fixed history. */
export const relativeStamp = (daysFromNow: number, hour: number, minute = 0): string => {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(hour, minute, 0, 0);
  const h24 = d.getHours();
  return `${WEEKDAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${pad(d.getDate())}, ${d.getFullYear()} ${pad(h24 % 12 || 12)}:${pad(minute)} ${h24 >= 12 ? 'PM' : 'AM'}`;
};
