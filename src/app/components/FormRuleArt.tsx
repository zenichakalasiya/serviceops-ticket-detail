/**
 * The help guide's example pictures, drawn as REAL SVG (Zeni, 19 Oct 2026). They used to be HTML
 * boxes; they were redrawn so the Form Rule illustrations page can hand developers a true vector.
 * ONE source: the guide (FormRuleHelpCard) and the illustrations page both render these, so a
 * download always matches the screen. Captions are NOT part of the drawing — the guide prints them
 * as text under it, and the downloads leave them out (Zeni's pick).
 *
 * Text widths are fixed numbers, sized for Inter (the product font). Change a label → re-check its
 * box width on the illustrations page.
 */

const LABEL = '#94A3B8';

/** Similar Rule: an existing rule and yours share the SAME If line; only the Then differs. */
export function SimilarRuleArt({ className = 'block h-auto w-full' }: { className?: string }) {
  const card = (x: number, name: string, then: string, thenW: number, yours: boolean) => (
    <g>
      <rect x={x + 0.5} y="0.5" width="215" height="77" rx="6" fill="#FFFFFF" stroke="#E5E9F0" />
      <text x={x + 9} y="18" fontSize="10" fontWeight="600" fill="#7B8FA5">{name}</text>
      <text x={x + 9} y="40.5" fontSize="10" fill={LABEL}>If</text>
      <rect x={x + 37.5} y="28.5" width="93" height="18" rx="4" fill="#FFF9E8" stroke="#F2D58A" />
      <text x={x + 43} y="41" fontSize="10.5" fontWeight="500" fill="#B45309">Priority is High</text>
      <text x={x + 9} y="63.5" fontSize="10" fill={LABEL}>Then</text>
      <rect x={x + 37.5} y="51.5" width={thenW} height="18" rx="4"
        fill={yours ? '#FFFFFF' : '#F7F9FC'} stroke={yours ? '#94A3B8' : '#E5E9F0'} strokeDasharray={yours ? '3 2' : undefined} />
      <text x={x + 43} y="64" fontSize="10.5" fontWeight="500" fill="#475569">{then}</text>
    </g>
  );
  return (
    <svg viewBox="0 0 440 78" className={className} aria-hidden="true" fontFamily="inherit">
      {card(0, 'Existing rule', 'Mandate Impact', 94, false)}
      {card(224, 'Your rule', 'Hide Category', 80, true)}
    </svg>
  );
}

/** Reverse Action: the same form in two states — conditions met, then no longer met. */
export function ReverseActionArt({ className = 'block h-auto w-full' }: { className?: string }) {
  const field = (x: number, y: number, label: string, value?: string) => (
    <g>
      <text x={x + 9} y={y + 12.5} fontSize="10" fill="#64748B">{label}</text>
      <rect x={x + 80.5} y={y + 0.5} width="115" height="17" rx="4" fill={value ? '#FFFFFF' : '#F7F9FC'} stroke="#E5E9F0" />
      {value && <text x={x + 87} y={y + 12.5} fontSize="10.5" fontWeight="500" fill="#1D2A3E">{value}</text>}
    </g>
  );
  const hidden = (x: number, y: number) => (
    <g>
      <rect x={x + 8.5} y={y + 0.5} width="187" height="17" rx="4" fill="none" stroke="#CBD5E1" strokeDasharray="3 2" />
      {/* lucide eye-off, 10px */}
      <g transform={`translate(${x + 82} ${y + 4}) scale(0.4167)`} fill="none" stroke={LABEL} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" />
        <path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" />
        <path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" />
        <path d="m2 2 20 20" />
      </g>
      <text x={x + 96} y={y + 12.5} fontSize="10" fill={LABEL}>Hidden</text>
    </g>
  );
  const form = (x: number, dept: string, shown: boolean) => (
    <g>
      <rect x={x + 0.5} y="0.5" width="204" height="77" rx="6" fill="#FFFFFF" stroke="#E5E9F0" />
      {field(x, 9, 'Department', dept)}
      {shown ? field(x, 31, 'Employee ID') : hidden(x, 31)}
      {shown ? field(x, 53, 'Joining date') : hidden(x, 53)}
    </g>
  );
  return (
    <svg viewBox="0 0 440 78" className={className} aria-hidden="true" fontFamily="inherit">
      {form(0, 'HR', true)}
      {/* lucide arrow-right, 13px */}
      <g transform="translate(213.5 26) scale(0.5417)" fill="none" stroke={LABEL} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
      </g>
      {form(235, 'Sales', false)}
    </svg>
  );
}
