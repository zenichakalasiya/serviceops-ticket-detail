/**
 * freeText.js — the content layer for the Free Text tile, which is now a NOTE.
 *
 * A note stores rich HTML (written in NoteEditor.vue) rather than the markdown-lite it
 * used to store. Two things follow from that, and both live here so no component has to
 * know about either:
 *
 *   1. HTML from a contenteditable is UNTRUSTED. Anything pasted in carries whatever
 *      markup it came from — styles, scripts, event handlers, tracking pixels. It is
 *      rendered with v-html, so it goes through `sanitizeNote` first, which is an
 *      ALLOWLIST: unknown tags are unwrapped, unknown attributes dropped, and the only
 *      surviving URL schemes are http/https/mailto. A blocklist would be wrong here —
 *      the set of dangerous markup is open-ended and the set of note formatting is not.
 *
 *   2. Notes written before this existed are markdown-lite ('# ' / '- ' / [a](b)), and
 *      the AI panel can still hand us plain prose. `toNoteHtml` upgrades either into the
 *      same HTML, so there is exactly one render path and no migration step.
 */

/* ── the legacy markdown-lite parser ───────────────────────────────────────────────
 * Kept because it is what upgrades old content. Grammar (line-based, blank lines
 * dropped): '# ' → heading, '- ' → bullet, anything else → paragraph; [label](url)
 * inline. */
function parseInline(text) {
  const segments = []
  const re = /\[([^\]]+)\]\(([^)]+)\)/g
  let last = 0, m
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) segments.push({ text: text.slice(last, m.index) })
    segments.push({ text: m[1], href: m[2] })
    last = m.index + m[0].length
  }
  if (last < text.length) segments.push({ text: text.slice(last) })
  if (!segments.length) segments.push({ text: '' })
  return segments
}

export function parseFreeText(content) {
  const src = content == null ? '' : String(content)
  const blocks = []
  for (const raw of src.split('\n')) {
    const line = raw.replace(/\s+$/, '')
    if (!line.trim()) continue
    let type, text
    if (line.startsWith('# ')) { type = 'h'; text = line.slice(2) }
    else if (line.startsWith('- ')) { type = 'li'; text = line.slice(2) }
    else { type = 'p'; text = line }
    blocks.push({ type, segments: parseInline(text) })
  }
  return blocks
}

/* ── sanitising ────────────────────────────────────────────────────────────────── */

// Structure and emphasis, plus what the rich-text editor sets (2026-09-30): Heading 1–3,
// a divider, and — as a narrow STYLE allowlist, see keepStyle() — font size, text colour,
// highlight colour and alignment. Nothing else survives: no positioning, no widths, no
// fonts, no classes, no event handlers.
const ALLOWED = new Set([
  'P', 'BR', 'DIV', 'SPAN', 'HR',
  'B', 'STRONG', 'I', 'EM', 'U', 'S', 'MARK', 'CODE',
  'UL', 'OL', 'LI',
  'H1', 'H2', 'H3', 'H4', 'BLOCKQUOTE',
  'A',
  /* IMG is allowed because `![alt](url)` is part of the grammar the Formatting-help
     modal documents. It is the one tag here that makes the browser FETCH something, so
     its src runs through the same scheme test as a link's href — an `<img>` cannot run
     script, but it can point at anything, and a note is shared content. */
  'IMG',
])
// tags that mean the same as an allowed one — normalised rather than dropped, because
// execCommand and pasted markup both produce these
const ALIAS = { STRIKE: 'S', DEL: 'S', FONT: 'SPAN', H5: 'H4', H6: 'H4', PRE: 'CODE' }
const SAFE_URL = /^(https?:|mailto:)/i
// an image the editor embedded from the viewer's own disk — image types only, never
// data:text/html or data:image/svg+xml (an SVG can carry script)
const SAFE_IMG_DATA = /^data:image\/(png|jpe?g|gif|webp);base64,[a-z0-9+/=\s]+$/i

/* The ONLY inline styles a note keeps, each with a value pattern it must match. A colour
   is a literal (#hex / rgb / rgba — the editor's Custom) or one of the editor's NAMED
   colours, stored as a theme token so it follows light/dark: `var(--red)`, or a highlight
   wash `color-mix(in srgb, var(--red) 24%, transparent)`. Only these tokens pass. */
const COLOR_RE = /^(#[0-9a-f]{3,8}|rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(,\s*(0|1|0?\.\d+)\s*)?\)|var\(--(ink|muted|green|primary|amber|orange|red)\)|color-mix\(in srgb, var\(--(muted|green|primary|amber|orange|red)\) \d{1,2}%, transparent\))$/i
const INLINE_STYLE = {
  'font-size': (v) => { const m = /^(\d{1,2})px$/.exec(v); return m && +m[1] >= 8 && +m[1] <= 72 },
  color: (v) => COLOR_RE.test(v),
  'background-color': (v) => COLOR_RE.test(v),
}
const BLOCK_STYLE = { 'text-align': (v) => /^(left|center|right|justify)$/.test(v) }
const ALIGNABLE = new Set(['P', 'DIV', 'H1', 'H2', 'H3', 'H4', 'LI', 'BLOCKQUOTE'])
function keepStyle(el, font) {
  const rules = el.tagName === 'SPAN' ? INLINE_STYLE : ALIGNABLE.has(el.tagName) ? BLOCK_STYLE : null
  if (!rules) return ''
  const out = []
  // <font color> and align="" arrive as attributes from execCommand — read them as styles
  if (font?.color && rules.color) out.push(['color', font.color])
  if (font?.align && rules['text-align']) out.push(['text-align', font.align.toLowerCase()])
  for (const decl of (el.getAttribute('style') || '').split(';')) {
    const i = decl.indexOf(':'); if (i < 0) continue
    const prop = decl.slice(0, i).trim().toLowerCase(), val = decl.slice(i + 1).trim().toLowerCase()
    if (rules[prop]) out.push([prop, val])
  }
  return out.filter(([p, v]) => rules[p](v)).map(([p, v]) => `${p}: ${v}`).join('; ')
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
}

/** Strip a node's children up into its place — used for tags we don't allow but whose
 *  TEXT we want to keep (a <span>, a <table>, a pasted <section>). */
function unwrap(el) {
  const parent = el.parentNode
  while (el.firstChild) parent.insertBefore(el.firstChild, el)
  parent.removeChild(el)
}

function clean(node) {
  // iterate over a static copy: the list is live and unwrapping mutates it
  for (const child of [...node.childNodes]) {
    if (child.nodeType === 3) continue                       // text — always fine
    if (child.nodeType !== 1) { child.remove(); continue }    // comments, CDATA, …

    const tag = child.tagName
    // these carry no readable text and must never survive
    if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'IFRAME' || tag === 'OBJECT' || tag === 'EMBED' || tag === 'LINK' || tag === 'META') {
      child.remove()
      continue
    }

    let el = child
    // attributes an alias would lose: <font color="…"> and align="…"
    const legacy = { color: child.getAttribute('color'), align: child.getAttribute('align') }
    const alias = ALIAS[tag]
    if (alias) {
      // rename in place, carrying the children across
      const repl = document.createElement(alias.toLowerCase())
      while (el.firstChild) repl.appendChild(el.firstChild)
      el.parentNode.replaceChild(repl, el)
      el = repl
    }

    if (!ALLOWED.has(el.tagName)) { clean(el); unwrap(el); continue }

    /* Read the ONE attribute we intend to keep before emptying the list — reading it
     * after stripped every valid link of its href, so `<a href="https://…">` came out
     * as bare text. */
    const href = el.tagName === 'A' ? (el.getAttribute('href') || '').trim() : ''
    const src = el.tagName === 'IMG' ? (el.getAttribute('src') || '').trim() : ''
    const alt = el.tagName === 'IMG' ? (el.getAttribute('alt') || '') : ''
    const style = keepStyle(el, legacy)
    for (const attr of [...el.attributes]) el.removeAttribute(attr.name)
    // a span is only ever a carrier for a kept style — without one it is noise
    if (el.tagName === 'SPAN' && !style) { clean(el); unwrap(el); continue }
    if (style) el.setAttribute('style', style)
    if (el.tagName === 'IMG') {
      // an image we won't load is nothing at all — it has no text to keep
      if (!SAFE_URL.test(src) && !SAFE_IMG_DATA.test(src)) { el.remove(); continue }
      el.setAttribute('src', src)
      el.setAttribute('alt', alt)
      el.setAttribute('loading', 'lazy')
      continue
    }
    if (el.tagName === 'A') {
      if (SAFE_URL.test(href)) {
        el.setAttribute('href', href)
        el.setAttribute('target', '_blank')
        el.setAttribute('rel', 'noopener noreferrer')
      } else {
        // a link we won't follow is just text — keep the words, drop the link
        clean(el); unwrap(el); continue
      }
    }
    clean(el)
  }
}

/* execCommand's list commands produce `<p><ul>…</ul></p>`, which is invalid nesting.
 * The parser corrects it by closing the <p> early — leaving a stray empty <p> on each
 * side of every list. They are invisible in the editor and stack up as blank lines in
 * the placed tile, so they go here. A <p><br></p> is NOT empty: that is a blank line
 * somebody typed on purpose. */
const BLOCKS = new Set(['P', 'H1', 'H2', 'H3', 'H4', 'BLOCKQUOTE'])
function dropEmptyBlocks(root) {
  for (const el of [...root.querySelectorAll('p, h1, h2, h3, h4, blockquote')]) {
    if (!BLOCKS.has(el.tagName)) continue
    if (!el.childNodes.length && !el.textContent.trim()) el.remove()
  }
}

/** Sanitise note HTML down to the allowlist. Safe to call on anything, including ''. */
export function sanitizeNote(html) {
  if (!html) return ''
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html')
  clean(doc.body)
  dropEmptyBlocks(doc.body)
  return doc.body.innerHTML
}

/* ── upgrading ─────────────────────────────────────────────────────────────────── */

/* Content is HTML if it CONTAINS a tag anywhere — not if it starts with one.
 *
 * This tested `^\s*<p…` at first, which is wrong for the commonest case there is: an
 * empty contenteditable puts the first line you type in a bare text node and only wraps
 * later lines, so a two-line note reads `Line one<p>Line two</p>` and fails a
 * starts-with test. It then went down the markdown path, which ESCAPES its input — so
 * the note rendered its own tags as visible text. Markdown-lite and plain prose contain
 * no tags at all, so "has a tag" separates them cleanly wherever the tag sits. */
/* The list covers what our own editor emits AND what the common paste sources produce —
 * a table pasted from Confluence or Excel has to be recognised as HTML so the sanitiser
 * can unwrap it down to its text, rather than fall to the markdown path and render its
 * tags as visible characters. It is a NAMED list rather than a generic `<[a-z]…>`
 * because prose like "if x<y and a>b" would match a generic one and get mangled. */
const HTML_RE = /<(p|div|span|ul|ol|li|h[1-6]|blockquote|b|strong|i|em|u|s|strike|del|mark|code|pre|a|br|hr|font|center|table|thead|tbody|tr|td|th|section|article|header|footer|figure|img)\b[^>]*>/i
export const isNoteHtml = (s) => HTML_RE.test(s || '')

/* ── the markdown a Free Text widget is written in ─────────────────────────────────
 * The grammar is exactly what the Formatting-help modal documents, and that is not a
 * coincidence: the help is generated from FT_SYNTAX below, so a mark this renderer
 * gains or loses cannot quietly disagree with the list that teaches it.
 *
 * Output still goes through `sanitizeNote` — this function builds a string, and a string
 * built from user text is exactly the thing that must not be trusted on the way out. */

/** Inline marks, applied to ONE line. */
function inlineMd(raw) {
  let s = escapeHtml(raw)

  /* Code spans are lifted out FIRST and put back LAST. Whatever is inside one is meant
     to be read literally — `**not bold**` inside backticks is the example that breaks if
     the marks are applied in place. \u0000 is the placeholder because it cannot survive
     escapeHtml and so cannot be typed into a note to forge one. */
  const code = []
  s = s.replace(/`([^`]+)`/g, (_, t) => `\u0000${code.push(t) - 1}\u0000`)

  // image BEFORE link: the two syntaxes differ only by the leading '!', so a link rule
  // run first would match the `[alt](url)` inside an image and leave a stray '!'
  s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (m, alt, url) =>
    SAFE_URL.test(url) ? `<img src="${url}" alt="${alt}">` : m)
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, label, url) =>
    SAFE_URL.test(url) ? `<a href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>` : label)

  /* A bare URL becomes a link too. The leading `(^|[\s(])` is what keeps it from eating
     the URLs in the href/src just written above: those are preceded by a quote, which is
     not whitespace, so an already-linked URL cannot be linked twice. */
  s = s.replace(/(^|[\s(])(https?:\/\/[^\s<>()]+)/g,
    (_, pre, url) => `${pre}<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`)

  s = s.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')          // bold before italic: ** is two *
  s = s.replace(/(^|[^*])\*([^*]+)\*/g, '$1<i>$2</i>')
  return s.replace(/\u0000(\d+)\u0000/g, (_, i) => `<code>${escapeHtml(code[+i])}</code>`)
}

/** Markdown (or plain prose) → the HTML a note renders. */
function mdToHtml(md) {
  const out = []
  let list = null   // 'ul' | 'ol' | null
  const closeList = () => { if (list) { out.push(`</${list}>`); list = null } }
  const openList = (t) => { if (list !== t) { closeList(); out.push(`<${t}>`); list = t } }

  for (const rawLine of String(md).split('\n')) {
    const line = rawLine.replace(/\s+$/, '')
    if (!line.trim()) { closeList(); continue }

    const bullet = line.match(/^\s*[-*]\s+(.*)$/)
    if (bullet) { openList('ul'); out.push(`<li>${inlineMd(bullet[1])}</li>`); continue }

    const numbered = line.match(/^\s*\d+[.)]\s+(.*)$/)
    if (numbered) { openList('ol'); out.push(`<li>${inlineMd(numbered[1])}</li>`); continue }

    closeList()
    const h = line.match(/^(#{1,2})\s+(.*)$/)
    // '#' is the bigger heading and '##' the smaller, which maps onto the two heading
    // levels the note allowlist carries — a note has no business holding an h1.
    if (h) { out.push(h[1].length === 1 ? `<h3>${inlineMd(h[2])}</h3>` : `<h4>${inlineMd(h[2])}</h4>`); continue }
    out.push(`<p>${inlineMd(line)}</p>`)
  }
  closeList()
  return out.join('')
}

/* What the Formatting-help modal lists, and the only place that list exists. */
export const FT_SYNTAX = [
  { md: '# sample text', note: 'a heading' },
  { md: '## sample text', note: 'a smaller heading' },
  { md: '**sample text**', note: 'bold' },
  { md: '*sample text*', note: 'italic' },
  { md: '`sample text`', note: 'inline code' },
  { md: '- apple\n- pear\n- mango', note: 'a bulleted list' },
  { md: '1. apple\n2. pear\n3. mango', note: 'a numbered list' },
  { md: '[a link](https://example.com)', note: 'a link' },
  { md: 'https://example.com', note: 'a bare URL becomes a link too' },
  { md: '![alt text](https://example.com/logo.png)', note: 'an image' },
]

/** The one entry point a renderer needs: any stored content → safe note HTML. */
export function toNoteHtml(content) {
  const src = content == null ? '' : String(content)
  if (!src.trim()) return ''
  return sanitizeNote(isNoteHtml(src) ? src : mdToHtml(src))
}

/* ── reading a note ────────────────────────────────────────────────────────────── */

/**
 * The note's text, with no markup, ONE LINE PER BLOCK.
 *
 * `textContent` alone is not enough: it concatenates without separators, so two
 * paragraphs come back as "…starts FridayNo production changes…" and the first line —
 * which is the note's title — runs into the second. Every block gets an explicit
 * newline after it before the text is read.
 */
export function noteText(content) {
  const doc = new DOMParser().parseFromString(`<body>${toNoteHtml(content)}</body>`, 'text/html')
  doc.body.querySelectorAll('p, h3, h4, li, blockquote, ul, ol, br').forEach((el) => el.after('\n'))
  return (doc.body.textContent || '')
    .replace(/[ \t ]+/g, ' ')
    .split('\n').map((s) => s.trim()).filter(Boolean).join('\n')
}

export const noteIsEmpty = (content) => !noteText(content)

/**
 * A note has no Name field — a sticky note doesn't carry a title, and asking for one
 * before you can write anything is the friction this tile exists to avoid. But the
 * library, the duplicate-name check and every listing still need something to call it,
 * so the title is DERIVED from the first line, the way every notes app does it.
 */
export function noteTitle(content, fallback = 'Note') {
  const first = (noteText(content).split('\n')[0] || '').replace(/[.,;:]+$/, '').trim()
  if (!first) return fallback
  return first.length > 48 ? first.slice(0, 47).trimEnd() + '…' : first
}

/* ── presentation ──────────────────────────────────────────────────────────────────
 * A Free Text widget carries its own look, which no other tile does. Everything below
 * is that model: the option lists the builder offers, the defaults a new one starts on,
 * and the one function that turns a saved config into styles the tile can wear.
 *
 * Colours are named, not hex. A note saying "Red" keeps meaning red when the theme
 * flips; a note saying "#dc2626" becomes unreadable on the dark card. `Custom` is the
 * escape hatch and is the only value stored as a literal — see `ftValue`.
 */

/** Font size. `Auto` means "inherit the note's own type scale", which is why it is 0. */
export const FT_SIZES = [
  { id: 'Auto', px: 0 },
  { id: '16px', px: 16 },
  { id: '24px', px: 24 },
  { id: '36px', px: 36 },
  { id: '56px', px: 56 },
  { id: '72px', px: 72 },
  { id: '88px', px: 88 },
]

export const FT_COLORS = [
  { id: 'Default', css: 'var(--ink)' },
  { id: 'Gray', css: 'var(--muted)' },
  { id: 'Green', css: 'var(--green)' },
  { id: 'Blue', css: 'var(--primary)' },
  { id: 'Yellow', css: 'var(--amber)' },
  { id: 'Orange', css: 'var(--orange)' },
  { id: 'Red', css: 'var(--red)' },
]

/* Each background is a WASH of its colour over the card, not the colour itself: a note
   is something you read, and solid green behind body text is not readable in either
   theme. `Default` is the warm paper this tile has always worn. */
export const FT_BGS = [
  /* WHITE, the same surface every other widget sits on — a note is a widget on this
     board, not a sticky note pinned to it. The warm paper (--note-bg) is still one
     choice away under 'Paper'. */
  { id: 'Default', css: 'var(--surface)' },
  { id: 'Paper', css: 'var(--note-bg)' },
  { id: 'Transparent', css: 'transparent' },
  { id: 'Gray', css: 'var(--surface-2)' },
  { id: 'Green', css: 'color-mix(in srgb, var(--green) 14%, var(--surface))' },
  { id: 'Blue', css: 'color-mix(in srgb, var(--primary) 14%, var(--surface))' },
  { id: 'Yellow', css: 'color-mix(in srgb, var(--amber) 16%, var(--surface))' },
  { id: 'Orange', css: 'color-mix(in srgb, var(--orange) 14%, var(--surface))' },
  { id: 'Red', css: 'color-mix(in srgb, var(--red) 12%, var(--surface))' },
]

/* The rich-text editor's HIGHLIGHT (background) colours — a wash of each colour over
   whatever the note wears, so text on it stays readable in both themes. Default removes
   the highlight; its chip is the plain surface. Text colours are FT_COLORS above. */
export const NOTE_HL = [
  { id: 'Default', css: '', swatch: 'var(--surface)' },
  { id: 'Gray', css: 'color-mix(in srgb, var(--muted) 22%, transparent)' },
  { id: 'Green', css: 'color-mix(in srgb, var(--green) 24%, transparent)' },
  { id: 'Blue', css: 'color-mix(in srgb, var(--primary) 22%, transparent)' },
  { id: 'Yellow', css: 'color-mix(in srgb, var(--amber) 30%, transparent)' },
  { id: 'Orange', css: 'color-mix(in srgb, var(--orange) 24%, transparent)' },
  { id: 'Red', css: 'color-mix(in srgb, var(--red) 20%, transparent)' },
]

export const FT_ALIGNS = ['left', 'center', 'right']
export const FT_VALIGNS = ['top', 'middle', 'bottom']

/** What a brand-new Free Text widget starts as — the `Default` preset, spelled out. */
export const FT_DEFAULTS = {
  size: '16px', align: 'left', valign: 'top', color: 'Default', bg: 'Default', pad: true,
}

/* Two starting points, not two modes: a preset writes the same fields the controls
   write, so every option stays editable afterwards. `span` is part of the preset because
   a Header is a BANNER — a centred title in a 4-column tile is not the same object. */
export const FT_PRESETS = [
  { id: 'Default', label: 'Default', cfg: { size: '16px', align: 'left', valign: 'top', bg: 'Default', pad: true }, span: 4 },
  { id: 'Header', label: 'Header', cfg: { size: '24px', align: 'center', valign: 'middle', bg: 'Transparent', pad: true }, span: 12 },
]

const isHex = (v) => /^#[0-9a-f]{3,8}$/i.test(String(v || ''))
/** A named option resolves through its list; anything else is a Custom literal. */
function ftValue(list, key, fallback) {
  if (isHex(key)) return key
  const hit = list.find((x) => x.id === key)
  return hit ? hit.css : fallback
}

/**
 * A stored config → the styles the placed tile wears.
 *
 * Returns two objects because they sit on two elements: the BOX owns the alignment, the
 * background and the padding; the TEXT owns the size and the colour. Putting the colour
 * on the box would leak it into the tile's own chrome, and putting the alignment on the
 * text would stop `align-items` from working at all.
 */
export function ftStyle(ft = {}) {
  const size = FT_SIZES.find((s) => s.id === (ft.size || 'Auto'))
  const px = size ? size.px : 0
  return {
    box: {
      textAlign: ft.align || 'left',
      alignItems: { top: 'flex-start', middle: 'center', bottom: 'flex-end' }[ft.valign || 'top'] || 'flex-start',
      background: ftValue(FT_BGS, ft.bg || 'Default', 'var(--note-bg)'),
      /* 12 on EVERY side, top included (2026-09-24). The 32px top lane was for the grip,
         which is gone; the note's drag lane is now just this 12px inset, and the ⋯ floats
         in the top-right corner on hover over the end of the first line, as in a notes app. */
      padding: ft.pad === false ? '0' : '12px',
    },
    text: {
      ...(px ? { fontSize: px + 'px', lineHeight: 1.25 } : {}),
      color: ftValue(FT_COLORS, ft.color || 'Default', 'var(--ink)'),
    },
  }
}

/** Which preset a config currently matches, for the builder's pill row. */
export function ftPresetOf(ft = {}) {
  const hit = FT_PRESETS.find((p) => Object.keys(p.cfg).every((k) => ft[k] === p.cfg[k]))
  return hit ? hit.id : null
}
