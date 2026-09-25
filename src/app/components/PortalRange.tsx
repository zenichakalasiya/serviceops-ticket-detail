/* Support Portal builder — the one slider.
 *
 * A thin track, the travelled part filled in the accent, and a small white thumb. It replaced the
 * browser's own range input (`accent-[#3D8BD0]`), whose 16px thumb and heavy track made a border
 * weight or a corner radius look like the most important control in the popup — and which Chrome
 * and Firefox draw differently, so the same row looked like two controls on two machines.
 *
 * ⚠️ The filled part is a CSS variable (`--fill`), set here from the value. A range input has no
 * cross-browser "progress" pseudo-element, so the track paints a hard-stop gradient at that point.
 * The look itself lives in `theme.css` under `.portal-range`. */

import type { CSSProperties } from 'react';

export function MiniRange({ value, onChange, min = 0, max = 100, step = 1, className = '', label }: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  label?: string;
}) {
  const span = max - min || 1;
  const pct = Math.max(0, Math.min(100, ((value - min) / span) * 100));
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      aria-label={label}
      onChange={(e) => onChange(Number(e.target.value))}
      className={`portal-range min-w-0 flex-1 ${className}`}
      style={{ '--fill': `${pct}%` } as CSSProperties}
    />
  );
}
