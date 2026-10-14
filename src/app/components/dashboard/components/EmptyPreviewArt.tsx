/**
 * EmptyPreviewArt — the widget builder's live preview before any condition is set:
 * "add a condition, and the chart draws here".
 *
 * The drawing lives in data/previewArt.js (one source for this, the /preview-states page
 * and its SVG/PNG downloads). The scene is fixed — preview frame, Conditions panel, the arc
 * between them — and the ghost chart inside the frame follows `kind`, the chart type being
 * built. Static: no motion (the user's call, 2026-09-29).
 */
import { previewArtMarkup } from '../data/previewArt.js';
import './EmptyPreviewArt.css';

export function EmptyPreviewArt({ kind = 'column', width = 180, className = '' }: any) {
  const markup = previewArtMarkup(kind);
  return (
    // our own generated markup, not user content
    <svg className={`epa dc-EmptyPreviewArt ${className}`.trim()} width={width} height={(width * 84) / 132} viewBox="0 0 132 84" fill="none"
      aria-hidden="true" focusable="false" dangerouslySetInnerHTML={{ __html: markup }} />
  );
}
