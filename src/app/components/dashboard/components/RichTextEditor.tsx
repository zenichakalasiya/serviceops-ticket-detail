/**
 * RichTextEditor — the Free Text widget's text field (2026-09-30, to the user's screenshots).
 *
 * A BOTTOM bar is always there with what INSERTS something — image · link — and a "T"
 * that toggles the FORMATTING bar. That bar sits directly ABOVE the bottom bar (as the
 * reference stacks them) and also appears by itself the moment text is selected: block
 * style (Paragraph / Heading 1–3) · B I U · font size · alignment · bulleted / numbered
 * list · background colour · text colour. Its menus open UPWARD.
 * Deliberately NOT here (the user's call): table, divider, attach, emoji, undo/redo,
 * templates, knowledge, AI Assist.
 *
 * A LAYOUT strip sits along the top (2026-09-30): Default (body text) or Header (a centred
 * banner). It is the old Preset, moved into the editor — `layout` + `onUpdateLayout` — and
 * the text area takes the look it picks, so what you type already sits where the tile will
 * show it.
 *
 * The text area is 400px tall and the corner handle (the same mark a widget's resize
 * handle wears) drags it taller.
 *
 * Built on contenteditable + execCommand, no dependency — ServiceOps ships on-prem, so an
 * editor library would be redistributed (the same reasoning as ECharts; see NoteEditor
 * for the longer note). Whatever the browser emits, `sanitizeNote` allowlists it on render.
 *
 * Two rules that keep it usable:
 *  · never write innerHTML back while typing — only on an EXTERNAL change — or the caret
 *    jumps to the start on every keystroke (the contenteditable is UNCONTROLLED here);
 *  · toolbar buttons act on mousedown with preventDefault, so clicking one never steals the
 *    selection it is about to format. Popovers with an input (link, image) save the range
 *    and put it back before they insert.
 */
import { useEffect, useRef, useState } from 'react';
import { Icon } from '../ui/primitives';
import { ColorPanel } from './ColorPanel';
import { toNoteHtml, noteText, FT_COLORS, NOTE_HL } from '../data/freeText.js';
import { toast } from '../store.js';
import './RichTextEditor.css';

const LAYOUTS = [
  { id: 'Default', tip: 'Body text — top-left, sized for reading' },
  { id: 'Header', tip: 'A centred banner across the whole row' },
];
/* the text area's height — 400px by default (300 until 2026-09-30, the user's "increase
   it"), dragged taller from the corner handle, never shorter than the default */
const MIN_H = 400, MAX_H = 900;
const BLOCKS = [
  { v: 'p', label: 'Paragraph' },
  { v: 'h1', label: 'Heading 1' },
  { v: 'h2', label: 'Heading 2' },
  { v: 'h3', label: 'Heading 3' },
];
const SIZES = [null, 8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 72];
const ALIGNS: any[] = [
  { v: 'Left', icon: 'align-left' },
  { v: 'Center', icon: 'align-center' },
  { v: 'Right', icon: 'align-right' },
  { v: 'Full', label: 'Justify', icon: 'align-justify' },
];
/* Text and background colour open ColorPanel (the user's screenshot): the named colours
   first — stored as theme tokens, so a red note stays red-for-this-theme — then Custom.
   The last colour chosen for each shows as the bar under its button. */
const COLORS: any = { fg: FT_COLORS, bg: NOTE_HL };
/* A literal (Custom) goes straight through execCommand. A NAMED colour can't — the browser
   rejects var() there — so a sentinel colour marks the selection first, and every marked
   span then gets the token instead (or loses the colour, for Default). */
const MARK: any = { fg: '#010203', bg: '#010204' };
const MARK_RGB: any = { fg: 'rgb(1, 2, 3)', bg: 'rgb(1, 2, 4)' };
const esc = (s: string) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' } as any)[c]);
const okUrl = (u: string) => /^(https?:|mailto:)/i.test(u.trim());

export function RichTextEditor({
  modelValue = '', placeholder = 'Enter the text to display', max = 600,
  // 'Default' | 'Header' | null (a note styled some other way before layouts existed)
  layout = null, onUpdateModelValue, onUpdateLayout,
}: any) {
  const el = useRef<HTMLDivElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const [focused, setFocused] = useState(false);
  const [fmtOn, setFmtOn] = useState(false);          // the T toggle
  const [hasSel, setHasSel] = useState(false);        // a non-empty selection inside the editor
  const [menu, setMenuS] = useState<string | null>(null); // which dropdown / popover is open
  const menuRef = useRef<string | null>(null);
  const setMenu = (m: string | null) => { menuRef.current = m; setMenuS(m); };
  const [st, setSt] = useState<any>({});              // pressed states at the caret
  const [count, setCount] = useState(0);
  const countRef = useRef(0);
  const setCnt = (n: number) => { countRef.current = n; setCount(n); };
  const [bodyH, setBodyH] = useState(MIN_H);
  const [colorSel, setColorSel] = useState<any>({ fg: 'Default', bg: 'Default' });
  const colorBtn = useRef<any>({ fg: null, bg: null });
  const emitRef = useRef(onUpdateModelValue); emitRef.current = onUpdateModelValue;

  const startResize = (e: React.MouseEvent) => {
    e.preventDefault();
    const y0 = e.clientY, h0 = bodyH;
    const move = (ev: MouseEvent) => setBodyH(Math.min(MAX_H, Math.max(MIN_H, h0 + ev.clientY - y0)));
    const up = () => { removeEventListener('mousemove', move); removeEventListener('mouseup', up); document.body.style.cursor = ''; };
    document.body.style.cursor = 'ns-resize';
    addEventListener('mousemove', move); addEventListener('mouseup', up);
  };
  const barOf = (k: string) => { const v = colorSel[k], o = COLORS[k].find((x: any) => x.id === v); return o ? (o.css || 'var(--border-strong)') : v; };

  const showFmt = fmtOn || hasSel || (!!menu && menu !== 'link' && menu !== 'image');

  /* ── the model ───────────────────────────────────────────────────────────────── */
  const textLen = () => (el.current ? noteText(el.current.innerHTML).replace(/\n/g, '').length : 0);
  const push = () => {
    if (!el.current) return;
    setCnt(textLen());
    emitRef.current?.(el.current.innerHTML);
  };

  /* ── selection + pressed states ──────────────────────────────────────────────── */
  const saved = useRef<Range | null>(null);
  const inEditor = (node: Node | null) => !!el.current && !!node && (node === el.current || el.current.contains(node));
  const sync = () => {
    const q = (c: string) => { try { return document.queryCommandState(c); } catch { return false; } };
    let block = 'p';
    try { block = (document.queryCommandValue('formatBlock') || 'p').toLowerCase(); } catch { /* */ }
    const sel = window.getSelection();
    let node: any = sel?.anchorNode; if (node && node.nodeType === 3) node = node.parentNode;
    let size: number | null = null;
    for (let n = node; n && n !== el.current; n = n.parentNode) { if (n.style?.fontSize) { size = parseInt(n.style.fontSize, 10); break; } }
    setSt({
      bold: q('bold'), italic: q('italic'), underline: q('underline'),
      ul: q('insertUnorderedList'), ol: q('insertOrderedList'),
      block: ['h1', 'h2', 'h3'].includes(block) ? block : 'p', size,
      align: q('justifyCenter') ? 'Center' : q('justifyRight') ? 'Right' : q('justifyFull') ? 'Full' : 'Left',
    });
  };
  const restore = () => {
    el.current?.focus();
    if (!saved.current) return;
    const sel = window.getSelection()!;
    sel.removeAllRanges(); sel.addRange(saved.current);
  };

  // handlers the document listeners call — kept in a ref so the listeners see current state
  const live = useRef<any>({});
  live.current.onSel = () => {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount || !inEditor(sel.anchorNode)) return;
    saved.current = sel.getRangeAt(0).cloneRange();
    setHasSel(!sel.isCollapsed);
    sync();
  };
  // the colour panel is portalled to <body>, so it is outside root — a click in it is still ours
  live.current.onDocDown = (e: MouseEvent) => {
    const t = e.target as HTMLElement;
    if (menuRef.current && root.current && !root.current.querySelector('.rte-pop')?.contains(t) && !t.closest?.('.rte-btn, .cpx')) setMenu(null);
  };

  useEffect(() => {
    // markdown-lite from an older note becomes HTML once, on the way in
    el.current!.innerHTML = toNoteHtml(modelValue);
    setCnt(textLen());
    if (el.current!.innerHTML !== modelValue) emitRef.current?.(el.current!.innerHTML);
    const onSel = () => live.current.onSel();
    const onDocDown = (e: MouseEvent) => live.current.onDocDown(e);
    document.addEventListener('selectionchange', onSel);
    document.addEventListener('mousedown', onDocDown);
    return () => {
      document.removeEventListener('selectionchange', onSel);
      document.removeEventListener('mousedown', onDocDown);
    };
  }, []);
  useEffect(() => {
    // only an EXTERNAL change (Reset, a different widget) is written back
    if (el.current && modelValue !== el.current.innerHTML) { el.current.innerHTML = toNoteHtml(modelValue); setCnt(textLen()); }
  }, [modelValue]);

  /* ── commands ────────────────────────────────────────────────────────────────── */
  const exec = (cmd: string, val: any = null, css = false) => {
    restore();
    try { document.execCommand('styleWithCSS', false, css as any); } catch { /* */ }
    // no value → no third argument: passing null made insertHorizontalRule write id="null"
    try { val == null ? document.execCommand(cmd, false) : document.execCommand(cmd, false, val); } catch { /* unsupported — no-op */ }
    sync(); push();
  };
  const setBlock = (v: string) => { exec('formatBlock', `<${v}>`); setMenu(null); };
  const setAlign = (v: string) => { exec('justify' + v); setMenu(null); };
  const setColor = (kind: string, v: string) => {
    setMenu(null);
    setColorSel((p: any) => ({ ...p, [kind]: v }));
    const cmd = kind === 'bg' ? 'hiliteColor' : 'foreColor';
    const named = COLORS[kind].find((o: any) => o.id === v);
    if (!named) { exec(cmd, v, true); return; }
    exec(cmd, MARK[kind], true);
    const prop = kind === 'bg' ? 'backgroundColor' : 'color';
    const css = v === 'Default' ? '' : named.css;
    // execCommand may still write <font color> for text colour — turn those into spans
    for (const f of [...el.current!.querySelectorAll('font[color]')] as HTMLElement[]) {
      if (f.getAttribute('color')!.toLowerCase() !== MARK.fg) continue;
      const span = document.createElement('span'); span.style.color = MARK_RGB.fg;
      while (f.firstChild) span.appendChild(f.firstChild);
      f.replaceWith(span);
    }
    for (const n of [...el.current!.querySelectorAll('[style]')] as HTMLElement[]) {
      if ((n.style as any)[prop] !== MARK_RGB[kind]) continue;
      (n.style as any)[prop] = css;
      if (!n.getAttribute('style') && n.tagName === 'SPAN') { while (n.firstChild) n.parentNode!.insertBefore(n.firstChild, n); n.remove(); }
    }
    sync(); push();
  };
  /* execCommand's fontSize only speaks 1–7, so: mark the selection with size 7, then swap
     every marker for a span carrying the real pixel size (or unwrap it for Default). */
  const setSize = (px: number | null) => {
    restore();
    try { document.execCommand('styleWithCSS', false, false as any); document.execCommand('fontSize', false, '7'); } catch { /* */ }
    for (const f of [...el.current!.querySelectorAll('font[size="7"]')] as HTMLElement[]) {
      for (const inner of f.querySelectorAll('[style]') as any) inner.style.fontSize = '';
      if (px) {
        const span = document.createElement('span'); span.style.fontSize = px + 'px';
        while (f.firstChild) span.appendChild(f.firstChild);
        f.replaceWith(span);
      } else {
        while (f.firstChild) f.parentNode!.insertBefore(f.firstChild, f);
        f.remove();
      }
    }
    setMenu(null);
    sync(); push();
  };
  // one ahead of the limit: typing beyond `max` is refused, deleting always works
  const onBeforeInput = (e: any) => {
    const ne = e.nativeEvent as InputEvent;
    if (!ne.inputType?.startsWith('insert')) return;
    const sel = window.getSelection();
    if (countRef.current >= max && sel?.isCollapsed) { e.preventDefault(); toast(`A note holds up to ${max} characters`, 'warn'); }
  };
  // paste as plain text — pasted styling from other apps is what makes notes inconsistent
  const onPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData?.getData('text/plain') || '';
    document.execCommand('insertText', false, text.slice(0, Math.max(0, max - countRef.current)));
  };

  /* link / image */
  const [linkUrl, setLinkUrl] = useState(''), [linkText, setLinkText] = useState(''), [imgUrl, setImgUrl] = useState('');
  const urlEl = useRef<HTMLInputElement>(null);
  const prepInsert = (m: string) => {
    if (m === 'link') { setLinkText(saved.current && !saved.current.collapsed ? saved.current.toString() : ''); setLinkUrl(''); }
    if (m === 'image') setImgUrl('');
    requestAnimationFrame(() => urlEl.current?.focus());
  };
  /* ── menus ───────────────────────────────────────────────────────────────────── */
  const toggle = (m: string) => { setMenu(menuRef.current === m ? null : m); if (m === 'link' || m === 'image') prepInsert(m); };

  const insertLink = () => {
    const url = linkUrl.trim();
    if (!okUrl(url)) { toast('A link needs to start with https://, http:// or mailto:', 'warn'); return; }
    restore();
    if (saved.current && !saved.current.collapsed) exec('createLink', url);
    else exec('insertHTML', `<a href="${esc(url)}">${esc(linkText.trim() || url)}</a>&nbsp;`);
    setMenu(null);
  };
  const insertImageUrl = () => {
    const url = imgUrl.trim();
    if (!/^https?:/i.test(url)) { toast('An image link needs to start with https:// or http://', 'warn'); return; }
    exec('insertImage', url); setMenu(null);
  };
  const fileEl = useRef<HTMLInputElement>(null);
  const readImage = (file: File) => {
    if (!/^image\/(png|jpe?g|gif|webp)$/.test(file.type)) { toast('Use a PNG, JPG, GIF or WebP image', 'warn'); return; }
    if (file.size > 1024 * 1024) { toast('Images up to 1 MB can go in a note', 'warn'); return; }
    const r = new FileReader();
    r.onload = () => { exec('insertImage', r.result); setMenu(null); };
    r.readAsDataURL(file);
  };
  const onImageFile = (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (f) readImage(f); e.target.value = ''; };
  const sizeLabel = st.size || '';
  const blockLabel = BLOCKS.find((b) => b.v === st.block)?.label || 'Paragraph';
  const md = (fn: () => void) => (e: React.MouseEvent) => { e.preventDefault(); fn(); };

  return (
    <div ref={root} className={`dc-RichTextEditor rte ${focused ? 'focus' : ''}`}>
      {/* layout: the two cards, as the reference draws them */}
      <div className="rte-lay" role="radiogroup" aria-label="Layout">
        {LAYOUTS.map((l) => (
          <button
            key={l.id} type="button" className={`rte-lc ${layout === l.id ? 'on' : ''}`}
            role="radio" aria-checked={layout === l.id} title={l.tip} onClick={() => onUpdateLayout?.(l.id)}
          >
            <span className={`rte-lc-art lc-${l.id.toLowerCase()}`}><i /><i /><i /></span>
            <span className="rte-lc-l">{l.id}</span>
          </button>
        ))}
      </div>
      <div className="rte-area">
        <div
          ref={el} className={`rte-body note-body ${layout === 'Header' ? 'is-hdr' : ''}`} contentEditable suppressContentEditableWarning role="textbox" aria-multiline="true"
          style={{ height: bodyH }}
          data-ph={placeholder} onInput={push} onBeforeInput={onBeforeInput} onPaste={onPaste}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} onKeyUp={sync} onMouseUp={sync}
        />
        {/* the widget's resize mark; drags the text area taller */}
        <span className="rte-resize" title="Drag to resize" onMouseDown={startResize} />
      </div>

      {/* the formatting bar: on when T is toggled, or whenever text is selected — right
          above the bottom bar, as the reference stacks them */}
      {showFmt && (
        <div className="rte-fmt" onMouseDown={(e) => e.preventDefault()}>
          <div className="rte-dd">
            <button className={`rte-btn rte-wide ${menu === 'block' ? 'open' : ''}`} title={blockLabel} onMouseDown={md(() => toggle('block'))}>
              <b className="rte-a">A</b><Icon name="pen" size={11} /><Icon name="chevron-down" size={13} />
            </button>
            {menu === 'block' && (
              <div className="rte-pop rte-menu">
                {BLOCKS.map((b) => (
                  <button key={b.v} className={`rte-mi bk-${b.v} ${st.block === b.v ? 'on' : ''}`} onMouseDown={md(() => setBlock(b.v))}>{b.label}</button>
                ))}
              </div>
            )}
          </div>
          <i className="rte-sep" />
          <button className={`rte-btn ${st.bold ? 'on' : ''}`} title="Bold" onMouseDown={md(() => exec('bold'))}><Icon name="bold" size={16} /></button>
          <button className={`rte-btn ${st.italic ? 'on' : ''}`} title="Italic" onMouseDown={md(() => exec('italic'))}><Icon name="italic" size={16} /></button>
          <button className={`rte-btn ${st.underline ? 'on' : ''}`} title="Underline" onMouseDown={md(() => exec('underline'))}><Icon name="underline" size={16} /></button>
          <i className="rte-sep" />
          <div className="rte-dd">
            <button className={`rte-btn rte-wide ${menu === 'size' ? 'open' : ''} ${st.size ? 'on' : ''}`} title="Font size" onMouseDown={md(() => toggle('size'))}>
              <Icon name="text-size" size={16} />{sizeLabel ? <span className="rte-num">{sizeLabel}</span> : null}<Icon name="chevron-down" size={13} />
            </button>
            {menu === 'size' && (
              <div className="rte-pop rte-menu rte-scroll">
                {SIZES.map((s) => (
                  <button key={s || 'd'} className={`rte-mi ${(st.size || null) === s ? 'on' : ''}`} onMouseDown={md(() => setSize(s))}>{s || 'Default'}</button>
                ))}
              </div>
            )}
          </div>
          <i className="rte-sep" />
          <div className="rte-dd">
            <button className={`rte-btn rte-wide ${menu === 'align' ? 'open' : ''}`} title="Alignment" onMouseDown={md(() => toggle('align'))}>
              <Icon name={ALIGNS.find((a) => a.v === st.align)?.icon || 'align-left'} size={16} /><Icon name="chevron-down" size={13} />
            </button>
            {menu === 'align' && (
              <div className="rte-pop rte-menu">
                {ALIGNS.map((a) => (
                  <button key={a.v} className={`rte-mi rte-mi-ic ${st.align === a.v ? 'on' : ''}`} onMouseDown={md(() => setAlign(a.v))}>
                    <Icon name={a.icon} size={15} /> {a.label || a.v}
                  </button>
                ))}
              </div>
            )}
          </div>
          <i className="rte-sep" />
          <button className={`rte-btn ${st.ul ? 'on' : ''}`} title="Bulleted list" onMouseDown={md(() => exec('insertUnorderedList'))}><Icon name="list-bullet" size={16} /></button>
          <button className={`rte-btn ${st.ol ? 'on' : ''}`} title="Numbered list" onMouseDown={md(() => exec('insertOrderedList'))}><Icon name="list-number" size={16} /></button>
          <i className="rte-sep" />
          <button
            ref={(e) => { colorBtn.current.bg = e; }} className={`rte-btn rte-col ${menu === 'bg' ? 'open' : ''}`} title="Background colour"
            onMouseDown={md(() => toggle('bg'))}
          ><Icon name="highlight" size={16} /><i className="rte-bar" style={{ background: barOf('bg') }} /></button>
          <button
            ref={(e) => { colorBtn.current.fg = e; }} className={`rte-btn rte-col ${menu === 'fg' ? 'open' : ''}`} title="Text colour"
            onMouseDown={md(() => toggle('fg'))}
          ><Icon name="text-color" size={16} /><i className="rte-bar" style={{ background: barOf('fg') }} /></button>
          {(menu === 'fg' || menu === 'bg') && (
            <ColorPanel
              key={menu} modelValue={colorSel[menu]} options={COLORS[menu]}
              anchor={colorBtn.current[menu]} onPick={(v: string) => setColor(menu, v)} onClose={() => setMenu(null)}
            />
          )}
        </div>
      )}

      {/* always there: what inserts something, and the T that shows the formatting bar */}
      <div className="rte-foot">
        <div className="rte-dd">
          <button className={`rte-btn ${menu === 'image' ? 'open' : ''}`} title="Insert image" onMouseDown={md(() => toggle('image'))}><Icon name="image" size={16} /></button>
          {menu === 'image' && (
            <div className="rte-pop rte-ins">
              <label className="rte-lbl">Image link</label>
              <input ref={urlEl} value={imgUrl} onChange={(e) => setImgUrl(e.target.value)} className="input" placeholder="https://…" onKeyUp={(e) => e.key === 'Enter' && insertImageUrl()} />
              <div className="rte-ins-row">
                <button className="btn btn-sm" onClick={() => fileEl.current?.click()}><Icon name="download" size={13} /> Upload</button>
                <span className="grow" />
                <button className="btn btn-sm" onClick={() => setMenu(null)}>Cancel</button>
                <button className="btn btn-sm btn-primary" disabled={!imgUrl.trim()} onClick={insertImageUrl}>Insert</button>
              </div>
            </div>
          )}
        </div>
        <div className="rte-dd">
          <button className={`rte-btn ${menu === 'link' ? 'open' : ''}`} title="Insert link" onMouseDown={md(() => toggle('link'))}><Icon name="link" size={16} /></button>
          {menu === 'link' && (
            <div className="rte-pop rte-ins">
              <label className="rte-lbl">Text</label>
              <input value={linkText} onChange={(e) => setLinkText(e.target.value)} className="input" placeholder="What the link says" />
              <label className="rte-lbl">Link</label>
              <input ref={urlEl} value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} className="input" placeholder="https://…" onKeyUp={(e) => e.key === 'Enter' && insertLink()} />
              <div className="rte-ins-row">
                <span className="grow" />
                <button className="btn btn-sm" onClick={() => setMenu(null)}>Cancel</button>
                <button className="btn btn-sm btn-primary" disabled={!linkUrl.trim()} onClick={insertLink}>Insert</button>
              </div>
            </div>
          )}
        </div>
        <button className={`rte-btn ${fmtOn ? 'on' : ''}`} title={fmtOn ? 'Hide formatting' : 'Show formatting'} onMouseDown={md(() => setFmtOn(!fmtOn))}><Icon name="text-type" size={16} /></button>
        <span className="grow" />
        <span className={`rte-count ${count >= max ? 'full' : ''}`}>{count} / {max}</span>
        <input ref={fileEl} type="file" accept="image/png,image/jpeg,image/gif,image/webp" hidden onChange={onImageFile} />
      </div>
    </div>
  );
}
