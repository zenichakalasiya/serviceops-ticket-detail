import AppleOsIcon from '@mui/icons-material/Apple';

/* OS-type icon badge for endpoints — Windows / Linux / Mac glyph in a neutral gray square with
 * the agent-health dot on the top-right corner. Shared by the Endpoint detail header and the
 * Endpoint tabs' cards/rows so every endpoint renders the same treatment. */

export const osTypeOf = (osName?: string | null): 'windows' | 'linux' | 'mac' => {
  const n = osName ?? '';
  if (/mac|os x|darwin/i.test(n)) return 'mac';
  if (/linux|ubuntu|red hat|rhel|centos|debian|suse|fedora/i.test(n)) return 'linux';
  return 'windows';
};

export const osLabelOf = (osName?: string | null) => {
  const t = osTypeOf(osName);
  return t === 'mac' ? 'macOS' : t === 'linux' ? 'Linux' : 'Windows';
};

const TUX_PATH = 'M41.1,37.5c-0.4-0.2-0.8-0.5-1.1-0.8c-0.2-0.2,0-1,0-1.4c0.2-0.8,0.1-1.6-0.4-2.2c-0.1-0.1-0.2-0.2-0.3-0.2 c0-0.4,0-0.8,0-1.2c-0.1-4.7-1.9-9.3-5.2-12.7c-1.3-1.2-2.2-2.8-2.5-4.5V14c0-2.6,0-8.2-2.9-11.1c-1.3-1.3-3-2-4.8-1.9 c-4,0-6.7,1.9-6.7,11.5c-0.2,2.5-1,4.9-2.3,7.1c-0.5,1-1,2-1.5,3.1c-1.3,2.9-2.3,6-2.9,9.2c-0.8,0.5-1.4,1.3-1.5,2.3L9,34.8 c-0.3,0.1-0.7,0.2-1,0.3c-1.1,0.2-3.1,0.6-3.1,2.4c0,0.5,0.1,0.9,0.2,1.4c0.2,1,0.2,2.1-0.2,3.2c0,0.1,0,0.2,0,0.2 c0,2.3,3.6,2.6,5.7,2.9h0.8c0.5,0.2,1,0.4,1.5,0.6c1.3,0.7,2.8,1.2,4.3,1.3c0.6,0,1.2-0.3,1.6-0.7h0.1c1.5-0.8,3.2-1.2,5-1.2h5.9 c0.1,0.4,0.3,0.8,0.6,1.1c0.6,0.6,1.4,0.9,2.2,0.9c1.9-0.1,3.7-1,4.8-2.5l0.6-0.6c0.7-0.5,1.5-0.9,2.3-1.1c1.4-0.5,2.8-1,2.8-2.4 C43.1,38.9,42,38.2,41.1,37.5z M25.9,6.8c1.1,0,1.9,1.2,1.9,2.8s-0.6,2.6-1.6,2.8c0.4-0.3,0.6-0.8,0.6-1.3c0-0.8-0.4-1.4-0.9-1.4 S25,10.3,25,11.1c0,0.5,0.2,1,0.6,1.3C24.7,12.1,24,11,24,9.6S24.8,6.8,25.9,6.8z M26.8,14.2L26.8,14.2c-1.4,1.1-3,1.8-4.7,2.1 c-1.1-0.4-2.1-1.1-2.9-1.9c1-1.1,2.4-1.8,3.8-1.9C24.4,12.7,25.7,13.3,26.8,14.2z M20.2,6.8c1.1,0,1.9,1.2,1.9,2.8 s-0.6,2.5-1.6,2.8c0.4-0.3,0.6-0.8,0.6-1.3c0-0.8-0.4-1.4-0.9-1.4s-0.9,0.6-0.9,1.4c0,0.5,0.2,1,0.6,1.3c-0.9-0.2-1.6-1.3-1.6-2.8 C18.3,8.1,19.1,6.8,20.2,6.8z M17.8,44.5c-0.1,0.4-0.3,0.6-0.5,0.6c-1.3-0.1-2.5-0.5-3.6-1.1c-0.6-0.3-1.2-0.6-1.9-0.8h-1.1 c-2.9-0.2-3.7-0.6-3.9-0.8c0.3-1.2,0.4-2.6,0.1-3.8c-0.1-0.4-0.1-0.7-0.1-1.1c0.5-0.3,1-0.4,1.6-0.5c0.7-0.1,1.4-0.3,1.9-0.7 c0.4-0.4,0.6-1,0.7-1.6c0.2-1,0.3-1,0.5-1c0.6,0.7,1,1.4,1.3,2.3c0.6,1.7,1.6,3.1,3,4.3C17.3,41,18.1,42.8,17.8,44.5z M30,38.8 L30,38.8c-2.8,2.9-8.5,2.7-10.9,2.3c-0.5-1-1.3-1.8-2.2-2.5c-1-1-1.8-2.2-2.3-3.5c-0.4-1.1-1-2.2-1.9-3c0.6-2.9,1.5-5.8,2.7-8.6 c0.4-1,0.9-1.9,1.4-3c0.7-1.3,1.3-2.6,1.8-4c1,0.9,2.2,1.5,3.5,1.8c1.9-0.5,3.7-1.3,5.4-2.3c2.8,5.3,4.2,11.2,4.2,17.1 C30.7,34.8,30.1,36.8,30,38.8z M39.7,40.9L39.7,40.9c-1.1,0.3-2.1,0.9-3,1.6l-0.7,0.7c-0.8,1.2-2.1,1.9-3.5,1.9 c-0.3,0-0.6-0.1-0.8-0.2c-0.3-0.3-0.2-1.1-0.2-1.4c0-0.3,0-0.3,0-0.3c0-0.6,0.5-6,0.7-6.9c0.1,0.1,0.2,0.2,0.2,0.3 c0.5,0.5,1.2,0.8,1.9,0.8h0.7c1,0.1,2-0.2,2.8-0.9c0,0.6,0.2,1.1,0.6,1.5c0.4,0.4,0.9,0.8,1.4,1.1c0.7,0.5,1.2,0.8,1.2,1 C40.8,40.5,40.3,40.7,39.7,40.9z';

const SIZES = {
  sm: { box: 'size-7 rounded-md', glyph: 13, dot: 'size-2' },
  md: { box: 'size-9 rounded-lg', glyph: 17, dot: 'size-2.5' },
  lg: { box: 'size-10 rounded-lg', glyph: 18, dot: 'size-2.5' },
} as const;

export function OsBadge({ osName, dotColor, size = 'md' }: {
  osName?: string | null;
  /** Agent-health dot color (e.g. '#22C55E' online, '#EAB308' offline/unknown). */
  dotColor: string;
  size?: keyof typeof SIZES;
}) {
  const os = osTypeOf(osName);
  const s = SIZES[size];
  return (
    <span className={`relative flex ${s.box} flex-shrink-0 items-center justify-center bg-[#F1F5F9] text-[#364658]`}>
      {os === 'windows' && (
        /* Classic four-pane Windows flag */
        <svg width={s.glyph} height={s.glyph} viewBox="0 0 24 24" fill="currentColor"><path d="M3 5.55 10.6 4.5v7H3zM11.6 4.36 21 3.05v8.45h-9.4zM3 12.55h7.6v7L3 18.5zM11.6 12.55H21v8.4l-9.4-1.31z" /></svg>
      )}
      {os === 'mac' && <AppleOsIcon sx={{ fontSize: s.glyph + 3, marginTop: '-1px' }} />}
      {os === 'linux' && (
        <svg width={s.glyph + 2} height={s.glyph + 2} viewBox="0 0 48 48" fill="currentColor"><path d={TUX_PATH} /></svg>
      )}
      {/* Agent-health badge — top-right corner */}
      <span className={`absolute -right-0.5 -top-0.5 ${s.dot} rounded-full ring-2 ring-white`} style={{ backgroundColor: dotColor }} />
    </span>
  );
}
