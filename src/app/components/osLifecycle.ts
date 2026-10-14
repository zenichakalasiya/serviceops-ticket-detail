/* ── OS lifecycle catalogue ──────────────────────────────────────────────────
   Every operating system in the fleet has a published support calendar: the day it
   shipped, the day active (mainstream) support ends, and the day security fixes stop.
   An endpoint is risky long before it breaks — it is risky the moment it stops getting
   fixes — so the Endpoint Overview reads these dates off the machine's OWN reported OS
   and build rather than quoting a generic "supported / unsupported" flag.

   The dates are the vendors' published ones. They are static facts about a RELEASE, not
   about the endpoint, which is why they live in a catalogue here rather than on the
   mock record — two machines on Windows 10 22H2 must never show two different end dates.

   ⚠️ A feature release is identified by BUILD, not by the OS name: "Microsoft Windows 11
   Pro" is 23H2, 24H2 or 25H2 depending on 10.0.22631 / 26100 / 26200, and those have
   different end dates. `osLifecycleOf` takes both. */

export type LifecyclePhase = 'active' | 'security-only' | 'eol' | 'unpublished' | 'unknown';

export interface OsLifecycle {
  /** Who publishes the calendar — named in the card's "… hasn't published" sentence. */
  vendor: string;
  /** "Windows 10", "Ubuntu Linux" — the product, without the edition. */
  family: string;
  /** "22H2", "24.04 LTS", "Sonoma" — the feature release this build belongs to. */
  release: string;
  released: Date;
  /** Mainstream/active support ends — after this, security fixes only.
      `null` = the vendor has not announced one, which is a STATE, not a gap: Apple
      publishes no end dates for a macOS release while it is still being updated. */
  activeEnd: Date | null;
  /** The last day it gets ANY fix. Equal to `activeEnd` where a vendor runs no extended
      phase (the card then shows one milestone, not two saying the same thing), and `null`
      where the extended phase exists but its end has not been announced. */
  securityEnd: Date | null;
  /** What the extended phase is called by this vendor, for the milestone label. */
  extendedLabel: string;
}

type Entry = Omit<OsLifecycle, 'release'> & { release: string };

const d = (s: string) => new Date(`${s}T00:00:00`);

/* Keyed by the Windows build's FEATURE number (10.0.<feature>.<revision>) — the only part
   that identifies a release. Editions differ: Home/Pro get 24 months of servicing,
   Enterprise/Education 36, so the Windows 11 rows are resolved per edition below. */
const WINDOWS_BUILDS: Record<string, { family: string; release: string }> = {
  '19045': { family: 'Windows 10', release: '22H2' },
  '19044': { family: 'Windows 10', release: '21H2' },
  '22631': { family: 'Windows 11', release: '23H2' },
  '26100': { family: 'Windows 11', release: '24H2' },
  '26200': { family: 'Windows 11', release: '25H2' },
  '17763': { family: 'Windows Server 2019', release: '1809' },
  '20348': { family: 'Windows Server 2022', release: '21H2' },
  '26100s': { family: 'Windows Server 2025', release: '24H2' },
};

/* Published end-of-servicing dates. Windows client rows carry both edition tracks because
   the same build is supported for a different length on Pro and on Enterprise. */
const WINDOWS_LIFECYCLE: Record<string, { released: string; consumer: string; enterprise: string }> = {
  'Windows 10 21H2': { released: '2021-11-16', consumer: '2023-06-13', enterprise: '2024-06-11' },
  /* The final Windows 10 release. Active support ended Oct 2025; paid Extended Security
     Updates carry commercial fleets to 2028. */
  'Windows 10 22H2': { released: '2022-10-18', consumer: '2025-10-14', enterprise: '2025-10-14' },
  'Windows 11 23H2': { released: '2023-10-31', consumer: '2025-11-11', enterprise: '2026-11-10' },
  'Windows 11 24H2': { released: '2024-10-01', consumer: '2026-10-13', enterprise: '2027-10-12' },
  'Windows 11 25H2': { released: '2025-09-30', consumer: '2027-10-12', enterprise: '2028-10-10' },
};

/** The one Windows 10 fact that is not a servicing date: the last ESU year. Commercial
    fleets can buy three; the consumer programme covers a single year. */
const WIN10_ESU_END = '2028-10-10';
const WIN10_CONSUMER_ESU_END = '2026-10-13';

export const osLifecycleOf = (osName?: string | null, build?: string | null): OsLifecycle | null => {
  const name = (osName ?? '').trim();
  if (!name) return null;

  /* ── Windows ─────────────────────────────────────────────────────────────── */
  if (/windows/i.test(name)) {
    const feature = /^10\.0\.(\d+)\./.exec(build ?? '')?.[1];
    const isServer = /server/i.test(name);

    if (isServer) {
      /* Server runs the classic 5 + 5 model, and the edition does not change it. */
      const map: Record<string, Entry> = {
        'Windows Server 2019': { vendor: 'Microsoft', family: 'Windows Server 2019', release: 'LTSC', released: d('2018-11-13'), activeEnd: d('2024-01-09'), securityEnd: d('2029-01-09'), extendedLabel: 'End of extended support' },
        'Windows Server 2022': { vendor: 'Microsoft', family: 'Windows Server 2022', release: 'LTSC', released: d('2021-08-18'), activeEnd: d('2026-10-13'), securityEnd: d('2031-10-14'), extendedLabel: 'End of extended support' },
        'Windows Server 2025': { vendor: 'Microsoft', family: 'Windows Server 2025', release: 'LTSC', released: d('2024-11-01'), activeEnd: d('2029-10-09'), securityEnd: d('2034-10-10'), extendedLabel: 'End of extended support' },
      };
      const key = Object.keys(map).find((k) => name.includes(k.replace('Windows Server ', '')) && /server/i.test(name));
      return key ? map[key] : null;
    }

    const id = feature ? WINDOWS_BUILDS[feature] : undefined;
    if (!id) return null;
    const row = WINDOWS_LIFECYCLE[`${id.family} ${id.release}`];
    if (!row) return null;
    /* Enterprise and Education are serviced a year longer than Home and Pro. */
    const enterprise = /enterprise|education/i.test(name);
    const end = enterprise ? row.enterprise : row.consumer;
    /* Windows 10's extended phase is ESU, which is a purchase rather than a right — so it
       is named as such rather than implying the machine is still covered by default. */
    const isWin10 = id.family === 'Windows 10';
    return {
      vendor: 'Microsoft',
      family: id.family,
      release: id.release,
      released: d(row.released),
      activeEnd: d(end),
      /* Windows 10's ESU tail depends on the track: commercial fleets (Enterprise) have
         three published years, consumer Pro machines have the one. */
      securityEnd: isWin10 ? d(enterprise ? WIN10_ESU_END : WIN10_CONSUMER_ESU_END) : d(end),
      extendedLabel: isWin10 ? 'End of ESU coverage' : 'End of servicing',
    };
  }

  /* ── macOS ───────────────────────────────────────────────────────────────────
     ⚠️ Apple publishes NO end-of-support dates. A release's window is only knowable
     once it is over: Sonoma is superseded twice and has observably stopped getting
     fixes, so its dates are real history — while Sequoia is still being updated and
     has no announced end at all. That is the `null` case, not missing data. */
  const mac = /macos\s+(\d+)/i.exec(name);
  if (mac) {
    const MAC: Record<string, Entry> = {
      '14': { vendor: 'Apple', family: 'macOS', release: '14 Sonoma', released: d('2023-09-26'), activeEnd: d('2024-09-16'), securityEnd: d('2026-09-15'), extendedLabel: 'End of security updates' },
      '15': { vendor: 'Apple', family: 'macOS', release: '15 Sequoia', released: d('2024-09-16'), activeEnd: null, securityEnd: null, extendedLabel: 'End of security updates' },
      '26': { vendor: 'Apple', family: 'macOS', release: '26 Tahoe', released: d('2025-09-15'), activeEnd: null, securityEnd: null, extendedLabel: 'End of security updates' },
    };
    return MAC[mac[1]] ?? null;
  }

  /* ── Linux ───────────────────────────────────────────────────────────────── */
  if (/ubuntu/i.test(name)) {
    const v = /(\d{2}\.\d{2})/.exec(name)?.[1];
    const UBUNTU: Record<string, Entry> = {
      '22.04': { vendor: 'Canonical', family: 'Ubuntu Linux', release: '22.04 LTS', released: d('2022-04-21'), activeEnd: d('2027-04-01'), securityEnd: d('2032-04-01'), extendedLabel: 'End of ESM' },
      '24.04': { vendor: 'Canonical', family: 'Ubuntu Linux', release: '24.04 LTS', released: d('2024-04-25'), activeEnd: d('2029-04-01'), securityEnd: d('2034-04-01'), extendedLabel: 'End of ESM' },
    };
    return (v && UBUNTU[v]) ?? null;
  }
  if (/red hat|rhel/i.test(name)) {
    const v = /(\d+)/.exec(name.replace(/red hat enterprise linux/i, ''))?.[1];
    const RHEL: Record<string, Entry> = {
      '8': { vendor: 'Red Hat', family: 'Red Hat Enterprise Linux 8', release: 'RHEL 8', released: d('2019-05-07'), activeEnd: d('2024-05-31'), securityEnd: d('2029-05-31'), extendedLabel: 'End of maintenance support' },
      '9': { vendor: 'Red Hat', family: 'Red Hat Enterprise Linux 9', release: 'RHEL 9', released: d('2022-05-17'), activeEnd: d('2027-05-31'), securityEnd: d('2032-05-31'), extendedLabel: 'End of maintenance support' },
    };
    return (v && RHEL[v]) ?? null;
  }
  return null;
};

/* ── Reading the calendar against today ──────────────────────────────────────── */

export const lifecyclePhaseOf = (l: OsLifecycle | null, now = new Date()): LifecyclePhase => {
  if (!l) return 'unknown';
  /* Nothing announced at all — still supported today, but with no cliff to plan against.
     Deliberately NOT 'active': "fully supported until <date>" would be a promise the
     vendor has not made. */
  if (!l.activeEnd) return 'unpublished';
  if (now < l.activeEnd) return 'active';
  /* Past active support. With no announced end, it is on security fixes indefinitely as
     far as anyone can prove — so it is security-only, not end-of-life. */
  if (!l.securityEnd) return 'security-only';
  return now >= l.securityEnd ? 'eol' : 'security-only';
};

/** Does this release have a distinct extended phase, or does everything stop at once? */
export const hasExtendedPhase = (l: OsLifecycle) =>
  !l.activeEnd || !l.securityEnd || l.securityEnd.getTime() !== l.activeEnd.getTime();

export const PHASE_TONE: Record<LifecyclePhase, { label: string; dot: string; text: string; bg: string; bar: string }> = {
  active: { label: 'Fully supported', dot: '#22C55E', text: '#15803D', bg: '#F0FDF4', bar: '#22C55E' },
  'security-only': { label: 'Security updates only', dot: '#F59E0B', text: '#B45309', bg: '#FFFBEB', bar: '#F59E0B' },
  eol: { label: 'End of life', dot: '#DC2626', text: '#B42318', bg: '#FEF2F2', bar: '#DC2626' },
  /* Slate, not amber: an unannounced date is an unknown, not a warning. Colouring it as
     risk would tell the reader to act on something no vendor has said. */
  unpublished: { label: 'Dates not published', dot: '#94A3B8', text: '#475569', bg: '#F8FAFC', bar: '#64748B' },
  unknown: { label: 'Not reported', dot: '#94A3B8', text: '#64748B', bg: '#F8FAFC', bar: '#94A3B8' },
};

const DAY = 864e5;
/** "in 2 years" / "3 years ago" / "today" — the distance that makes a date mean something. */
export const relativeDay = (target: Date, now = new Date()): string => {
  const days = Math.round((target.getTime() - now.getTime()) / DAY);
  const a = Math.abs(days);
  if (a === 0) return 'today';
  /* Months are rounded FIRST and promoted at twelve, so 358 days reads "1 year" rather
     than "12 months" — a cutoff on raw days alone produced exactly that. */
  const months = Math.round(a / 30.44);
  const [n, unit] = months >= 12
    ? [Math.max(1, Math.round(a / 365.25)), 'year']
    : months >= 1 ? [months, 'month'] : [a, 'day'];
  const phrase = `${n} ${unit}${n === 1 ? '' : 's'}`;
  return days > 0 ? `in ${phrase}` : `${phrase} ago`;
};
