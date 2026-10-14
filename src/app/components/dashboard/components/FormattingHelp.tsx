/**
 * FormattingHelp — what a Free Text widget accepts, with each mark shown rendered.
 *
 * It is generated from `FT_SYNTAX` and rendered through the SAME `toNoteHtml` the tile
 * uses, so the right-hand column is not a mock-up of the result — it IS the result. A
 * mark this help lists but the renderer does not support would show up here as literal
 * text, which is the failure being designed out: a documented mark that silently does
 * nothing is worse than an undocumented one.
 */
import { Icon, DashPortal } from '../ui/primitives';
import { FT_SYNTAX, toNoteHtml } from '../data/freeText.js';
import { toast } from '../store.js';
import './FormattingHelp.css';

export function FormattingHelp({ onClose }: any) {
  const copy = (md: string) => {
    navigator.clipboard?.writeText(md);
    toast('Copied to clipboard', 'success');
  };
  return (
    <DashPortal>
      <div className="dc-FormattingHelp fh-overlay" onClick={(e) => e.target === e.currentTarget && onClose?.()}>
        <div className="fh" role="dialog" aria-label="Formatting help">
          <header className="fh-head">
            <h4>Formatting help</h4>
            <button className="dlg-x" onClick={() => onClose?.()}><Icon name="x" size={18} /></button>
          </header>

          <div className="fh-body">
            {(FT_SYNTAX as any[]).map((s) => (
              <div key={s.md} className="fh-row">
                <div className="fh-src">
                  <pre>{s.md}</pre>
                  <button className="fh-copy" title="Copy" onClick={() => copy(s.md)}><Icon name="copy" size={14} /></button>
                </div>
                <div className="fh-out">
                  <div className="note-body" dangerouslySetInnerHTML={{ __html: toNoteHtml(s.md) }} />
                  <span className="fh-note">{s.note}</span>
                </div>
              </div>
            ))}
          </div>

          <footer className="fh-foot">
            <span className="fh-hint">Anything not listed here is shown as plain text.</span>
            <button className="btn" onClick={() => onClose?.()}>Close</button>
          </footer>
        </div>
      </div>
    </DashPortal>
  );
}
