/**
 * FreeTextTile — renders a Free Text widget.
 *
 * The content is markdown (or, for a note written before this, rich HTML). It is injected with
 * dangerouslySetInnerHTML, so it goes through `toNoteHtml` first — an allowlist sanitiser that also
 * upgrades older content in place, so there is one render path and no migration step. See
 * data/freeText.js for why that is an allowlist, not a blocklist.
 *
 * The LOOK comes from the widget's own config — alignment, vertical alignment, size, colour,
 * background, padding — resolved by `ftStyle` so the builder's live preview and the placed tile
 * cannot disagree about what a setting means.
 *
 * The box is a flex ROW even though it holds one child: that is what makes `align-items` the
 * vertical control, leaving `text-align` free to be the horizontal one. The child then takes the
 * full width, or `text-align` would have nothing to align inside.
 *
 * Typography lives in `.note-body` (dashboard.css), shared with the builder's preview.
 */
import { toNoteHtml, ftStyle } from '../data/freeText.js';
import './FreeTextTile.css';

export function FreeTextTile({ content = '', ft = {} }: any) {
  const html = toNoteHtml(content);
  const style: any = ftStyle(ft);
  return (
    <div className="dc-FreeTextTile ftx" style={style.box}>
      <div className="ftx-in note-body" style={style.text}>
        {!html ? <p className="ftx-empty">Text to display</p> : <div dangerouslySetInnerHTML={{ __html: html }} />}
      </div>
    </div>
  );
}
