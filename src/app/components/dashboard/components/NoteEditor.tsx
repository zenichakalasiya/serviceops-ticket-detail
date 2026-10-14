/**
 * NoteEditor — the rich-text editor behind a Free Text (note) widget.
 *
 * Hand-rolled on `contenteditable` + `execCommand` rather than pulling in TipTap/Quill/
 * ProseMirror. ServiceOps ships ON-PREM, so every dependency is redistributed — the same
 * reasoning that put us on ECharts. A note needs bold, lists and links, not a document
 * model, and those three libraries all cost more bundle than the whole dashboard view.
 *
 * `execCommand` is formally deprecated and has no replacement; every browser still
 * implements it and will continue to, because the whole editable web runs on it. The
 * risk it carries is messy OUTPUT (browser-specific tags, inline styles from paste),
 * and that is handled at the other end: `sanitizeNote` allowlists the result, so
 * whatever the browser emits, what gets stored is the same small set of tags.
 *
 * Two-way binding on a contenteditable has one rule: never write `innerHTML` back while
 * the user is typing. Doing so collapses the selection to the start of the node and the
 * caret jumps to the top of the note on every keystroke. So the DOM is written only when
 * the incoming value differs from what the element already holds — i.e. an external
 * change — and `input` emits without writing back (the element is UNCONTROLLED).
 */
import { Fragment, useEffect, useRef, useState } from 'react';
import { Icon } from '../ui/primitives';
import { sanitizeNote } from '../data/freeText.js';
import './NoteEditor.css';

/* The toolbar. Grouped the way the marks group conceptually: emphasis, then block
 * shape, then lists, then the two that insert something. */
const GROUPS: any[][] = [
  [
    { id: 'bold', icon: 'bold', label: 'Bold', key: 'Ctrl+B' },
    { id: 'italic', icon: 'italic', label: 'Italic', key: 'Ctrl+I' },
    { id: 'underline', icon: 'underline', label: 'Underline', key: 'Ctrl+U' },
    { id: 'strikeThrough', icon: 'strikethrough', label: 'Strikethrough' },
    { id: 'mark', icon: 'highlight', label: 'Highlight' },
  ],
  [
    { id: 'h3', icon: 'title', label: 'Heading' },
    { id: 'blockquote', icon: 'quote', label: 'Quote' },
    { id: 'code', icon: 'code', label: 'Code' },
  ],
  [
    { id: 'insertUnorderedList', icon: 'list-bullet', label: 'Bulleted list' },
    { id: 'insertOrderedList', icon: 'list-number', label: 'Numbered list' },
    { id: 'outdent', icon: 'outdent', label: 'Outdent' },
    { id: 'indent', icon: 'indent', label: 'Indent' },
  ],
  [
    { id: 'link', icon: 'link', label: 'Link' },
    { id: 'removeFormat', icon: 'clear-format', label: 'Clear formatting' },
  ],
];

/* An EMPTY contenteditable puts the first line you type in a bare text node and only
 * starts wrapping once you press Enter — so a two-line note comes out as
 * `Line one<p>Line two</p>`, with the opening line in no block at all. Seeding one empty
 * paragraph means every line lives in a block from the first keystroke, which is what
 * lets the renderer, the sanitiser and the derived title all treat the content the same
 * way. `<br>` inside it is required: a `<p></p>` has zero height and the caret has
 * nowhere to sit. */
const EMPTY_DOC = '<p><br></p>';

export function NoteEditor({ modelValue = '', placeholder = 'Write a note…', minHeight = 200, onUpdateModelValue }: any) {
  const el = useRef<HTMLDivElement>(null);
  const [focused, setFocused] = useState(false);
  const [empty, setEmpty] = useState(true);
  // which inline marks are on at the caret — drives the toolbar's pressed state
  const [active, setActive] = useState<any>({});
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const linkEl = useRef<HTMLInputElement>(null);
  const emitRef = useRef(onUpdateModelValue); emitRef.current = onUpdateModelValue;

  const push = () => {
    if (!el.current) return;
    setEmpty(!el.current.textContent!.trim() && !el.current.querySelector('li, br + br'));
    emitRef.current?.(el.current.innerHTML);
  };

  /** The nearest ancestor of the caret with this tag, still inside the editor. */
  const closestTag = (tag: string): HTMLElement | null => {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return null;
    let n: any = sel.getRangeAt(0).startContainer;
    while (n && n !== el.current) {
      if (n.nodeType === 1 && n.tagName === tag) return n;
      n = n.parentNode;
    }
    return null;
  };

  /** Refresh the toolbar's pressed state from wherever the caret is. */
  const syncActive = () => {
    if (!el.current || !document.activeElement) return;
    if (!el.current.contains(document.activeElement) && document.activeElement !== el.current) return;
    const q = (c: string) => { try { return document.queryCommandState(c); } catch { return false; } };
    let block = '';
    try { block = (document.queryCommandValue('formatBlock') || '').toLowerCase(); } catch { /* not supported */ }
    setActive({
      bold: q('bold'), italic: q('italic'), underline: q('underline'), strikeThrough: q('strikeThrough'),
      insertUnorderedList: q('insertUnorderedList'), insertOrderedList: q('insertOrderedList'),
      h3: block === 'h3', blockquote: block === 'blockquote',
      mark: !!closestTag('MARK'), code: !!closestTag('CODE'),
    });
  };
  const syncRef = useRef(syncActive); syncRef.current = syncActive;

  const exec = (cmd: string, val: any = null) => {
    el.current?.focus();
    try { document.execCommand(cmd, false, val); } catch { /* unsupported — no-op */ }
    syncActive();
    push();
  };

  /** Wrap or unwrap the selection in a tag execCommand has no command for. */
  const toggleWrap = (tag: string) => {
    el.current?.focus();
    const existing = closestTag(tag);
    if (existing) {                       // already inside one → unwrap it
      const parent = existing.parentNode!;
      while (existing.firstChild) parent.insertBefore(existing.firstChild, existing);
      parent.removeChild(existing);
      syncActive(); push();
      return;
    }
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) return;   // nothing selected — nothing to wrap
    const range = sel.getRangeAt(0);
    const node = document.createElement(tag.toLowerCase());
    try {
      node.appendChild(range.extractContents());
      range.insertNode(node);
      // leave the caret after the new node rather than inside it
      sel.removeAllRanges();
      const after = document.createRange();
      after.setStartAfter(node); after.collapse(true);
      sel.addRange(after);
    } catch { /* selection spanned element boundaries — leave it alone */ }
    syncActive(); push();
  };

  /* ── links ──────────────────────────────────────────────────────────────────────
   * A prompt() would work but reads as a browser artefact in the middle of a product.
   * The inline field also lets an existing link be edited rather than only replaced. */
  const savedRange = useRef<Range | null>(null);
  const openLink = () => {
    const a = closestTag('A');
    const sel = window.getSelection();
    savedRange.current = sel && sel.rangeCount ? sel.getRangeAt(0).cloneRange() : null;
    if (!a && (!savedRange.current || savedRange.current.collapsed)) return;   // nothing to link
    setLinkUrl(a ? a.getAttribute('href') || '' : '');
    setLinkOpen(true);
    requestAnimationFrame(() => linkEl.current?.focus());
  };
  const applyLink = () => {
    const url = linkUrl.trim();
    el.current?.focus();
    if (savedRange.current) {
      const sel = window.getSelection()!;
      sel.removeAllRanges(); sel.addRange(savedRange.current);
    }
    if (!url) { exec('unlink'); } else {
      // a bare domain is the common typo; assume https rather than producing a dead
      // relative link the note owner won't notice until someone clicks it
      exec('createLink', /^[a-z]+:/i.test(url) ? url : `https://${url}`);
    }
    setLinkOpen(false);
    savedRange.current = null;
  };
  const cancelLink = () => { setLinkOpen(false); savedRange.current = null; el.current?.focus(); };

  const run = (item: any) => {
    if (item.id === 'link') { openLink(); return; }
    if (item.id === 'mark' || item.id === 'code') { toggleWrap(item.id.toUpperCase()); return; }
    if (item.id === 'h3' || item.id === 'blockquote') {
      // pressing an active block format returns it to a paragraph
      exec('formatBlock', active[item.id] ? '<p>' : `<${item.id}>`);
      return;
    }
    exec(item.id);
  };

  /* Paste as the note's own formatting, never the source's. Browsers paste full styled
   * HTML from Word/Confluence/a web page, which is where 90% of the junk markup comes
   * from — running it through the same allowlist at the door means the editor never holds
   * anything the renderer would strip later. */
  const onPaste = (e: React.ClipboardEvent) => {
    const html = e.clipboardData?.getData('text/html');
    const text = e.clipboardData?.getData('text/plain');
    if (!html && !text) return;
    e.preventDefault();
    const safe = html
      ? sanitizeNote(html)
      : text.split(/\n{2,}/).map((p) => `<p>${p.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' } as any)[c]).replace(/\n/g, '<br>')}</p>`).join('');
    exec('insertHTML', safe);
  };

  // Ctrl/⌘+K opens the link field
  const onKeydown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openLink(); }
  };

  useEffect(() => {
    try { document.execCommand('defaultParagraphSeparator', false, 'p'); } catch { /* Safari */ }
    if (el.current) {
      el.current.innerHTML = modelValue || EMPTY_DOC;
      setEmpty(!el.current.textContent!.trim());
    }
    const onSelectionChange = () => syncRef.current();
    document.addEventListener('selectionchange', onSelectionChange);
    return () => document.removeEventListener('selectionchange', onSelectionChange);
  }, []);

  // external changes only — see the header note on why this is guarded
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (!el.current || el.current.innerHTML === (modelValue || '')) return;
    el.current.innerHTML = modelValue || '';
    setEmpty(!el.current.textContent!.trim());
  }, [modelValue]);

  return (
    <div className={`dc-NoteEditor ne ${focused ? 'focused' : ''}`}>
      <div className="ne-bar">
        {GROUPS.map((g, gi) => (
          <Fragment key={gi}>
            {gi ? <span className="ne-sep" /> : null}
            {g.map((it) => (
              <button
                key={it.id} type="button" className={`ne-b ${active[it.id] ? 'on' : ''}`}
                title={it.key ? `${it.label} · ${it.key}` : it.label} aria-label={it.label} aria-pressed={!!active[it.id]}
                onMouseDown={(e) => e.preventDefault()} onClick={() => run(it)}
              ><Icon name={it.icon} size={16} /></button>
            ))}
          </Fragment>
        ))}
      </div>

      {/* the link field, inline rather than a prompt() */}
      {linkOpen && (
        <div className="ne-link">
          <Icon name="link" size={14} className="nel-ic" />
          <input ref={linkEl} value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} className="input" placeholder="https://…  (leave blank to remove)"
            onKeyUp={(e) => { if (e.key === 'Enter') applyLink(); if (e.key === 'Escape') cancelLink(); }} />
          <button className="btn btn-sm btn-primary" onClick={applyLink}>Apply</button>
          <button className="btn btn-sm" onClick={cancelLink}>Cancel</button>
        </div>
      )}

      <div className="ne-wrap" style={{ minHeight }}>
        <div
          ref={el} className="ne-in note-body" contentEditable suppressContentEditableWarning role="textbox" aria-multiline="true"
          aria-label={placeholder}
          onInput={push} onPaste={onPaste} onKeyDown={onKeydown}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          onKeyUp={syncActive} onMouseUp={syncActive}
        />
        {empty && <p className="ne-ph">{placeholder}</p>}
      </div>
    </div>
  );
}
