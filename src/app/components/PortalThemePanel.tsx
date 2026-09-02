import { useState } from 'react';
import { PORTAL_FONTS } from './portalPageModel';
import { Check, ChevronDown, Moon, Sun } from 'lucide-react';
import { toast } from 'sonner';
import { ColorDot } from './PortalColorPicker';
import { Segmented, UploadZone } from './PortalControls';

/* Theme — the portal's own style system.
 *
 * ⚠️ ONE scrolling panel, not a menu of screens. It was four cards that each opened a sub-screen,
 * which meant comparing a font against a palette cost two navigations and you never saw them
 * together — and they only make sense together. Everything is on one surface now: the two choices
 * that reshape the page (style, font) collapse into dropdowns, and the palette, which is the thing
 * an admin actually returns to, stays open underneath them.
 *
 * ⚠️ Mode is LIGHT or DARK, no "auto". A portal is designed and looked at; a mode that follows the
 * visitor's OS is a page its designer never sees. Every colour below carries both values, so the
 * switch re-tints rather than asking anyone to pick twice. */

export interface PortalTheme {
  mode: 'light' | 'dark';
  paletteId: string;
  packId: string;
  /** Per-role overrides on top of the pack — see FONT_FACES. */
  headingFont?: string;
  bodyFont?: string;
  buttonId: string;
  /** Overrides on top of the palette — the Custom section and any hand-edited swatch. */
  custom?: Record<string, string>;
}

export const DEFAULT_THEME: PortalTheme = { mode: 'light', paletteId: 'blue', packId: 'inter', buttonId: 'solid' };

/* ── Colour ──────────────────────────────────────────────────────────────────
 *
 * ⚠️ Only PRIMARY varies by theme. Secondary is the status language — green means healthy, red
 * means broken — and a theme that re-tinted it would be changing what a colour MEANS, not how the
 * page looks. Neutral is the greyscale every surface and border is built from; re-tinting that per
 * theme is how a design system loses its floor. So a theme owns four colours and the product owns
 * the other thirteen. That is also why the three sit behind tabs rather than in one long list: they
 * answer to different owners, and mixing them invites edits to the two that are not yours. */
export interface Swatch { key: string; label: string; light: string; dark: string }

export interface Palette {
  id: string; name: string;
  primary: Swatch[];
}

const prim = (
  color: string, alt: string, text: string, bg: string,
  dColor: string, dAlt: string, dText: string, dBg: string,
): Swatch[] => [
  { key: 'primary', label: 'Primary', light: color, dark: dColor },
  { key: 'primaryAlt', label: 'Primary alt', light: alt, dark: dAlt },
  { key: 'pageText', label: 'Page text', light: text, dark: dText },
  { key: 'pageBg', label: 'Page background', light: bg, dark: dBg },
];

export const PALETTES: Palette[] = [
  { id: 'blueMagenta', name: 'Blue Magenta', primary: prim('#69568C', '#3E5277', '#2F4858', '#FFFFFF', '#A48FD1', '#6E86B8', '#E8EEF6', '#141021') },
  { id: 'green', name: 'Green', primary: prim('#4C9A5B', '#2F6B45', '#1B3A28', '#FFFFFF', '#68C77C', '#3E8F5C', '#EAF6EE', '#0E1A13') },
  { id: 'red', name: 'Red', primary: prim('#D6274B', '#96162F', '#3A0E18', '#FFFFFF', '#FF5C7A', '#C23050', '#FDECEF', '#1A0A0E') },
  { id: 'orange', name: 'Orange', primary: prim('#F0842A', '#B85C12', '#40230A', '#FFFFFF', '#FFA35A', '#D97A28', '#FFF3E8', '#1C1108') },
  { id: 'blue', name: 'Blue', primary: prim('#3D8BD0', '#2D6CA0', '#0F172A', '#FFFFFF', '#5AA7E5', '#3D8BD0', '#E8EEF6', '#0F172A') },
  { id: 'slate', name: 'Slate', primary: prim('#475467', '#334155', '#0F172A', '#FFFFFF', '#94A3B8', '#64748B', '#F8FAFC', '#0B1220') },
  { id: 'stone', name: 'Stone', primary: prim('#6B5B4A', '#4A3E32', '#2A211A', '#FFFFFF', '#C4A98C', '#8A7460', '#F5EFE8', '#1A1512') },
  { id: 'teal', name: 'Teal', primary: prim('#0E7C86', '#0A5A61', '#0B2E31', '#FFFFFF', '#3FBFC9', '#12909B', '#E6F6F7', '#08191B') },
];

/* Shared across every theme — see the note above. */
export const SECONDARY: Swatch[] = [
  { key: 'green', label: 'Green', light: '#14B053', dark: '#3ED27A' },
  { key: 'yellow', label: 'Yellow', light: '#E8B407', dark: '#F5C93B' },
  { key: 'orange', label: 'Orange', light: '#F47C22', dark: '#FF9A4D' },
  { key: 'red', label: 'Red', light: '#EC5B5B', dark: '#FF7B7B' },
  { key: 'redDark', label: 'Red dark', light: '#C84235', dark: '#E05C4E' },
  { key: 'redLight', label: 'Red light', light: '#F17A73', dark: '#FF9A93' },
];

export const NEUTRAL: Swatch[] = [
  { key: 'darkest', label: 'Darkest', light: '#05122C', dark: '#F8FAFC' },
  { key: 'darker', label: 'Darker', light: '#374256', dark: '#E2E8F0' },
  { key: 'dark', label: 'Dark', light: '#677387', dark: '#CBD5E1' },
  { key: 'regular', label: 'Regular', light: '#94A3BE', dark: '#94A3B8' },
  { key: 'light', label: 'Light', light: '#B6C2D5', dark: '#475569' },
  { key: 'lighter', label: 'Lighter', light: '#D1DBEC', dark: '#2C384B' },
  { key: 'lightest', label: 'Lightest', light: '#E6EDFB', dark: '#151E2E' },
];

/* Heading + body PAIRINGS, not a flat font list. ⚠️ Choosing two faces that work together is the
   hard part of typography and the part an admin should not have to do. */
export const FONT_PACKS = [
  { id: 'inter', name: 'Inter', heading: 'Inter, sans-serif', body: 'Inter, sans-serif', note: 'The product default. Neutral and highly legible.' },
  { id: 'poppins', name: 'Poppins & Inter', heading: 'Poppins, sans-serif', body: 'Inter, sans-serif', note: 'Geometric headings over a neutral body.' },
  { id: 'source', name: 'Source Sans 3', heading: '"Source Sans 3", sans-serif', body: '"Source Sans 3", sans-serif', note: 'Humanist. Reads well at small sizes.' },
  { id: 'merri', name: 'Merriweather & Inter', heading: 'Merriweather, serif', body: 'Inter, sans-serif', note: 'Serif headings for a more editorial portal.' },
  { id: 'roboto', name: 'Roboto', heading: 'Roboto, sans-serif', body: 'Roboto, sans-serif', note: 'Tight and compact. Good for dense pages.' },
  { id: 'plex', name: 'IBM Plex', heading: '"IBM Plex Sans", sans-serif', body: '"IBM Plex Sans", sans-serif', note: 'Technical, with a strong mono companion.' },
];

/* ⚠️ The two faces are chosen SEPARATELY. A pairing list made the easy half of the decision for you
   and took the other half away — "Merriweather & Inter" was the only route to a serif heading, and
   it brought Inter along whether or not that was the body you wanted. A pack still SEEDS both, so
   picking a theme style still sets a sensible pair; from there each is its own field. */
/* ⚠️ ONE list, defined in `portalPageModel` because the canvas text toolbar reads it too. Kept
   exported under this name so every call site below is unchanged. */
export const FONT_FACES = PORTAL_FONTS;

/** The face a theme is using for each role — its own choice if it has one, else the pack's. */
export const faceOf = (t: PortalTheme, role: 'heading' | 'body') => {
  const own = role === 'heading' ? t.headingFont : t.bodyFont;
  const found = own && FONT_FACES.find((f) => f.id === own);
  if (found) return found;
  const pack = FONT_PACKS.find((f) => f.id === t.packId) ?? FONT_PACKS[0];
  const css = role === 'heading' ? pack.heading : pack.body;
  return FONT_FACES.find((f) => f.css === css) ?? FONT_FACES[0];
};

export const BUTTON_STYLES = [
  { id: 'solid', name: 'Solid', radius: 6, cls: 'text-white' },
  { id: 'rounded', name: 'Rounded', radius: 999, cls: 'text-white' },
  { id: 'square', name: 'Square', radius: 0, cls: 'text-white' },
  { id: 'outline', name: 'Outline', radius: 6, cls: 'bg-transparent border-2' },
  { id: 'soft', name: 'Soft', radius: 8, cls: '' },
];

/* ⚠️ A theme style carries a palette, a font pairing and a button shape — and shows NO swatches of
   its own in its card. The palette section below is the colour authority; a style card that also
   painted a swatch strip would give two answers to "what colour is this portal", and the one you
   edited would be the one silently overruled the next time you tried a style. */
export const THEME_STYLES = [
  { id: 'clarity', name: 'Clarity', paletteId: 'blue', packId: 'inter', buttonId: 'solid', note: 'The product default — neutral type and lightly rounded buttons.' },
  { id: 'editorial', name: 'Editorial', paletteId: 'stone', packId: 'merri', buttonId: 'outline', note: 'Serif headings and outlined buttons. Reads like a written page.' },
  { id: 'friendly', name: 'Friendly', paletteId: 'green', packId: 'poppins', buttonId: 'rounded', note: 'Geometric type and fully rounded buttons. Approachable.' },
  { id: 'technical', name: 'Technical', paletteId: 'slate', packId: 'plex', buttonId: 'square', note: 'Flat greys and hard corners. Utilitarian by design.' },
  { id: 'warmth', name: 'Warmth', paletteId: 'orange', packId: 'source', buttonId: 'soft', note: 'Amber accents on soft-filled buttons. Inviting without shouting.' },
  { id: 'focus', name: 'Focus', paletteId: 'blueMagenta', packId: 'roboto', buttonId: 'solid', note: 'Compact type and a muted violet accent. The page carries the emphasis.' },
  { id: 'alert', name: 'Alert', paletteId: 'red', packId: 'inter', buttonId: 'solid', note: 'For a status or incident portal, where urgency is the point.' },
  { id: 'calm', name: 'Calm', paletteId: 'teal', packId: 'source', buttonId: 'soft', note: 'Cool teal and humanist type. Quiet under heavy use.' },
];

export const paletteOf = (t: PortalTheme) => PALETTES.find((p) => p.id === t.paletteId) ?? PALETTES[4];
export const packOf = (t: PortalTheme) => FONT_PACKS.find((f) => f.id === t.packId) ?? FONT_PACKS[0];
export const buttonOf = (t: PortalTheme) => BUTTON_STYLES.find((b) => b.id === t.buttonId) ?? BUTTON_STYLES[0];
export const styleOfTheme = (t: PortalTheme) =>
  THEME_STYLES.find((s) => s.paletteId === t.paletteId && s.packId === t.packId && s.buttonId === t.buttonId) ?? null;

/* An override is stored PER MODE — `light:primary1`, `dark:primary1`.
 *
 * ⚠️ It used to be one value per swatch, which meant a colour edited for the light portal silently
 * became the dark portal's colour too. Every swatch in this palette ships with two values precisely
 * because the two modes want different ones; a single override threw that away the first time
 * anybody touched a dot.
 * ⚠️ The bare key is still read as a FALLBACK, so a theme carrying overrides from before this change
 * keeps them rather than snapping back to the palette. */
export const customKey = (mode: 'light' | 'dark', key: string) => `${mode}:${key}`;

/** One swatch's value for a given mode, with any override applied. */
export const colorIn = (t: PortalTheme, s: Swatch, mode: 'light' | 'dark') =>
  t.custom?.[customKey(mode, s.key)] ?? t.custom?.[s.key] ?? (mode === 'dark' ? s.dark : s.light);

/** One swatch's value for the mode that is on. */
export const colorOf = (t: PortalTheme, s: Swatch) => colorIn(t, s, t.mode);

/** page · surface · muted · accent · ink — what the canvas paints with. */
export const swatchesOf = (t: PortalTheme): [string, string, string, string, string] => {
  const p = paletteOf(t).primary;
  const pick = (k: string) => colorOf(t, p.find((x) => x.key === k)!);
  const n = (k: string) => colorOf(t, NEUTRAL.find((x) => x.key === k)!);
  return [pick('pageBg'), n('lightest'), n('lighter'), pick('primary'), pick('pageText')];
};

/* ── panel chrome ─────────────────────────────────────────────────────────── */

/** A closed row that opens its list beneath it. Used for both of the big choices. */
/* ⚠️ The product's own field chrome — a labelled row over a 36px control with the light chevron,
   the same shape every select in the ticket detail page and the BOM tab uses. It was a bordered
   pill with the label inside it, which is a control this product does not otherwise have.
   ⚠️ And it opens as an INSTANT POPUP layered over the panel, not as an inline expansion. Expanding
   in place pushed the colour section 330px down the panel, so choosing a font moved the thing you
   were comparing it against off screen — and closing it moved everything back, which is the sort of
   jump that makes a panel feel unstable. */
function Dropdown({ label, value, children, open, onToggle }: {
  label: string; value: string; children: React.ReactNode; open: boolean; onToggle: () => void;
}) {
  return (
    <div className="mb-3">
      <p className="mb-1 text-[12px] text-[#7B8FA5]">{label}</p>
      <div className="relative">
        <button
          onClick={onToggle}
          className={`flex h-9 w-full items-center gap-2 rounded border bg-white px-2.5 text-left transition-colors ${
            open ? 'border-[#3D8BD0] ring-1 ring-[#3D8BD0]' : 'border-[#d1d5db] hover:border-[#3D8BD0]'
          }`}
        >
          <span className="min-w-0 flex-1 truncate text-[13px] text-[#364658]">{value}</span>
          <ChevronDown size={14} className={`flex-shrink-0 text-[#9CA3AF] transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
        {open && (
          <>
            {/* Click anywhere else to dismiss — a popover that only closes from its own trigger is
                a modal pretending not to be one. */}
            <span className="fixed inset-0 z-[70]" onClick={onToggle} />
            {/* ⚠️ As tall as the panel allows. At 330px the list showed two and a half cards, so
                comparing eight styles meant scrolling a window smaller than the thing being
                compared — and the card you were judging against had already scrolled away. */}
            <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-[71] max-h-[calc(100vh-220px)] overflow-y-auto rounded-lg border border-[#E5E7EB] bg-white p-2 shadow-[0_12px_24px_-6px_rgba(16,24,40,0.18)]">
              {children}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const Row = ({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button
    onClick={onClick}
    className={`mb-2.5 block w-full rounded-md border-2 p-3 text-left transition-colors last:mb-0 ${
      on ? 'border-[#3D8BD0] bg-[#F5F9FD]' : 'border-transparent bg-[#F7F9FC] hover:bg-[#F1F5F9]'
    }`}
  >{children}</button>
);

/** The two things a style actually decides — the type and the button. No colour. */
function StylePreview({ packId, buttonId, accent }: { packId: string; buttonId: string; accent: string }) {
  const f = FONT_PACKS.find((x) => x.id === packId)!;
  const b = BUTTON_STYLES.find((x) => x.id === buttonId)!;
  const bare = b.id === 'outline';
  const soft = b.id === 'soft';
  return (
    <span className="flex items-center gap-2.5 rounded-md px-3 py-2.5" style={{ background: `${accent}1F` }}>
      <span className="min-w-0 flex-1">
        <span style={{ fontFamily: f.heading }} className="block truncate text-[15px] font-bold text-[#0F172A]">Heading</span>
        <span style={{ fontFamily: f.body }} className="block truncate text-[12px] text-[#7B8FA5]">Paragraph text</span>
      </span>
      <span
        style={{
          borderRadius: b.radius,
          background: bare ? 'transparent' : soft ? `${accent}26` : accent,
          borderColor: accent,
          color: bare || soft ? accent : '#FFFFFF',
        }}
        className={`inline-flex h-7 flex-shrink-0 items-center px-3 text-[12px] font-medium ${b.cls}`}
      >Button</span>
    </span>
  );
}

/** Light / dark, as one control. Exported because it renders on the panel's TITLE row — it governs
 *  every field below it, so it cannot belong to any one of them. */
export function ThemeModeToggle({ mode, onChange }: { mode: 'light' | 'dark'; onChange: (m: 'light' | 'dark') => void }) {
  /* ⚠️ ICONS ONLY — a sun and a moon need no caption. The words were added when this control was
     two grey glyphs nobody could find on a busy title row; what actually fixed that was the ACCENT
     FILL on the active side, which is the one weight on this panel that reads as "this is on", and
     it does that job whether or not the word is beside it.
     ⚠️ The `title` and the `aria-label` are therefore the only things left naming the two modes —
     the button has no text node any more, so removing either would leave a control a screen reader
     announces as nothing at all. */
  return (
    <span className="flex flex-shrink-0 items-center gap-0.5 rounded bg-[#F1F5F9] p-0.5">
      {([['light', Sun], ['dark', Moon]] as const).map(([m, Ic]) => (
        <button
          key={m}
          onClick={() => onChange(m)}
          title={m === 'light' ? 'Light mode' : 'Dark mode'}
          aria-label={m === 'light' ? 'Light mode' : 'Dark mode'}
          aria-pressed={mode === m}
          className={`flex size-7 items-center justify-center rounded transition-colors ${
            mode === m
              ? 'bg-[#3D8BD0] text-white shadow-[0_1px_2px_rgba(16,24,40,0.10)]'
              : 'text-[#7B8FA5] hover:text-[#364658]'
          }`}
        ><Ic size={14} /></button>
      ))}
    </span>
  );
}

/* ── the panel ────────────────────────────────────────────────────────────── */

type Tab = 'primary' | 'secondary' | 'neutral';

export function PortalThemePanel({ theme, onChange }: { theme: PortalTheme; onChange: (patch: Partial<PortalTheme>) => void }) {
  const [openList, setOpenList] = useState<'style' | 'heading' | 'body' | null>(null);
  const [tab, setTab] = useState<Tab>('primary');
  const style = styleOfTheme(theme);
  const pack = packOf(theme);
  const palette = paletteOf(theme);

  const swatches: Record<Tab, Swatch[]> = { primary: palette.primary, secondary: SECONDARY, neutral: NEUTRAL };

  /* One write, several values. ⚠️ Applying a style's parts one at a time would render impossible
     intermediate themes on the way — a green palette briefly wearing Merriweather — which reads as
     a glitch rather than a change. Overrides clear with it: picking a style means "give me this
     one", not "this one, still wearing the four colours I hand-edited an hour ago". */
  const applyStyle = (st: (typeof THEME_STYLES)[number]) => {
    /* ⚠️ The two face overrides clear WITH the style, for the same reason the colour overrides do:
       picking a style means "give me this one", not "this one still wearing the heading face I
       hand-picked an hour ago". */
    onChange({
      paletteId: st.paletteId, packId: st.packId, buttonId: st.buttonId, custom: {},
      headingFont: undefined, bodyFont: undefined,
    });
    setOpenList(null);
    toast.success(`${st.name} applied`);
  };

  const setCustom = (key: string, value: string, mode: 'light' | 'dark' = theme.mode) =>
    onChange({ custom: { ...(theme.custom ?? {}), [customKey(mode, key)]: value } });

  /* ⚠️ UNSCOPED, unlike `setCustom`. Every colour in this panel is a light/dark PAIR, so its writer
     stamps the mode into the key — but a background PHOTOGRAPH is one artwork, and asking an admin
     to upload it twice would be asking them to answer a question that has one answer. The kind
     (colour or image) goes the same way for the same reason: it is which of the two you are using,
     not a property of the mode you are using it in. */
  const setFlat = (key: string, value: string) =>
    onChange({ custom: { ...(theme.custom ?? {}), [key]: value } });

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6">
            <Dropdown
        label="Theme style"
        value={style?.name ?? 'Custom'}
        open={openList === 'style'}
        onToggle={() => setOpenList((o) => (o === 'style' ? null : 'style'))}
      >
        {THEME_STYLES.map((st) => {
          const p = PALETTES.find((x) => x.id === st.paletteId)!;
          const acc = theme.mode === 'dark' ? p.primary[0].dark : p.primary[0].light;
          return (
            <Row key={st.id} on={style?.id === st.id} onClick={() => applyStyle(st)}>
              {/* Name, then what it looks like, then why you would pick it — the order the question
                  is actually asked in. */}
              <span className="mb-1.5 flex items-center gap-1.5">
                <span className="text-[13px] font-semibold text-[#364658]">{st.name}</span>
                {style?.id === st.id && <Check size={13} className="text-[#3D8BD0]" />}
              </span>
              <StylePreview packId={st.packId} buttonId={st.buttonId} accent={acc} />
              <span className="mt-1.5 block text-[11px] leading-[1.5] text-[#9CA3AF]">{st.note}</span>
            </Row>
          );
        })}
      </Dropdown>

      {/* ── Font family ──────────────────────────────────────────────────────────
          ONE field where there were two, "Heading font" and "Body font".

          ⚠️ This reverses an earlier split, and the reason that split existed is worth keeping in
          view: two fields let you take a serif heading without also taking its body face. The cost
          was that the panel asked twice for what is nearly always one answer, and the two rows
          looked identical while meaning different things — a portal typeset in two families is the
          exception, not the thing the control should be shaped around. One field, one answer.

          ⚠️ Each row is a CARD showing the face doing BOTH jobs — a heading over a real sentence,
          both set in that family — with the family's NAME outside the card to its right. The name
          is the label and the card is the evidence, so keeping them apart means the sample is never
          interrupted by a word set in the UI's own font. A list of fonts rendered in one font is a
          list of words.

          ⚠️ The trigger names BOTH faces when a theme style has paired two. A style may still set a
          pairing, and a field claiming a single family while the page is set in two would be the
          panel lying about the thing it exists to report. */}
      {(() => {
        const hf = faceOf(theme, 'heading');
        const bf = faceOf(theme, 'body');
        const paired = hf.id !== bf.id;
        return (
          <Dropdown
            label="Font family"
            value={paired ? `${hf.name} · ${bf.name}` : hf.name}
            open={openList === 'font'}
            onToggle={() => setOpenList((o) => (o === 'font' ? null : 'font'))}
          >
            {FONT_FACES.map((f) => {
              /* Lit only when the family is doing BOTH jobs — a row ticked while the body is set in
                 something else would be reporting half the truth. */
              const on = !paired && f.id === hf.id;
              return (
                <Row
                  key={f.id}
                  on={on}
                  onClick={() => {
                    /* ONE write for both roles. Two writes would render an impossible intermediate
                       state where the heading had changed and the body had not. */
                    onChange({ headingFont: f.id, bodyFont: f.id });
                    setOpenList(null);
                    toast.success(`${f.name} applied`);
                  }}
                >
                  <span className="flex items-center gap-2.5">
                    <span className="min-w-0 flex-1 rounded-md border border-[#E5E7EB] bg-white px-3 py-2.5">
                      <span
                        style={{ fontFamily: f.css }}
                        className="block truncate text-[16px] font-semibold leading-tight text-[#0F172A]"
                      >Heading</span>
                      <span
                        style={{ fontFamily: f.css }}
                        className="mt-1 block truncate text-[12px] leading-tight text-[#7B8FA5]"
                      >{f.note}</span>
                    </span>
                    <span className="flex flex-shrink-0 items-center gap-1 text-[11px] font-medium text-[#7B8FA5]">
                      {f.name}
                      {on && <Check size={12} className="text-[#3D8BD0]" />}
                    </span>
                  </span>
                </Row>
              );
            })}
          </Dropdown>
        );
      })()}

      {/* ── Colours ── */}
      <div className="mt-5 flex items-center gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#7B8FA5]">Colours</span>
      </div>

      {/* ⚠️ mt-3.5, not mt-2. The tabs sat almost on the heading, so the two read as one control and
          "COLOURS" looked like a label for the tab strip rather than the section head above it. */}
      <div className="mt-3.5 flex gap-1 rounded bg-[#F1F5F9] p-0.5">
        {(['primary', 'secondary', 'neutral'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded py-1 text-[12px] font-medium capitalize transition-colors ${
              tab === t ? 'bg-white text-[#364658] shadow-[0_1px_2px_rgba(16,24,40,0.06)]' : 'text-[#7B8FA5] hover:text-[#364658]'
            }`}
          >{t}</button>
        ))}
      </div>

      {/* NOTE: no explanatory line under the tabs. It changed with the tab, so a caption sat between
          a control and the rows it governs and rewrote itself every time you moved — three sentences
          of theory in the one gap where the eye is travelling from the tab it just pressed to the
          swatches that answered it. What each group is for is a thing you read once; the swatch
          names say the rest. */}
      <div className="mt-2">
        {swatches[tab].map((sw) => (
          /* ⚠️ A name and a circle, no hex. The value is what the picker is for; printing it beside
             every row turns a palette into a spreadsheet, and nobody recognises a colour by its code. */
          <div key={sw.key} className="flex items-center gap-3 border-b border-dashed border-[#E5E7EB] py-2 last:border-b-0">
            <span className="flex-1 truncate text-[13px] text-[#364658]">{sw.label}</span>
            <ColorDot
              value={colorOf(theme, sw)}
              onChange={(v) => setCustom(sw.key, v)}
              title={sw.label}
              modes={{
                mode: theme.mode,
                light: colorIn(theme, sw, 'light'),
                dark: colorIn(theme, sw, 'dark'),
                onChange: (m, v) => setCustom(sw.key, v, m),
              }}
            />
          </div>
        ))}
      </div>

      {/* ── Home page background ──
          ⚠️ This REPLACES the Custom section. Custom offered three loose overrides — page
          background, heading text, body text — sitting on top of whichever style was chosen, which
          is a second colour authority beside the palette above it: two places to answer "what colour
          is the heading", and the one you were not looking at won. Heading and body text belong to
          the palette; the page's own backdrop is the one of the three that is genuinely a decision
          about THIS page, so it is what stays, and it gets a picture as well as a colour. */}
      <p className="mt-6 text-[11px] font-semibold uppercase tracking-wider text-[#7B8FA5]">Home page background</p>
      <p className="mt-1.5 text-[11px] leading-[1.5] text-[#9CA3AF]">
        A colour or an image behind the whole page.
      </p>
      <div className="mt-2.5">
        <Segmented
          value={String(theme.custom?.pageBgKind ?? 'color')}
          onChange={(v) => setFlat('pageBgKind', v)}
          options={[{ value: 'color', label: 'Colour' }, { value: 'image', label: 'Image' }]}
        />
      </div>
      {String(theme.custom?.pageBgKind ?? 'color') === 'color' ? (
        <div className="mt-2 flex items-center gap-3 py-2">
          <span className="flex-1 truncate text-[13px] text-[#364658]">Page background</span>
          {/* The colour DOES carry a light/dark pair, so it keeps the mode tabs every other swatch
              in this panel has — the page's backdrop is the one most worth checking in both. */}
          {(() => {
            const sw = palette.primary.find((x) => x.key === 'pageBg')!;
            return (
              <ColorDot
                value={colorOf(theme, sw)}
                onChange={(v) => setCustom('pageBg', v)}
                title="Page background"
                modes={{
                  mode: theme.mode,
                  light: colorIn(theme, sw, 'light'),
                  dark: colorIn(theme, sw, 'dark'),
                  onChange: (m, v) => setCustom('pageBg', v, m),
                }}
              />
            );
          })()}
        </div>
      ) : (
        <div className="mt-2">
          {/* ⚠️ The suggested size is stated in the EMPTY state, before a file is chosen — the same
              rule the banner and the logo follow. A size printed after the upload is a verdict on a
              decision already made. */}
          <UploadZone
            value={theme.custom?.pageBgImage}
            onChange={(v) => setFlat('pageBgImage', v ?? '')}
            suggested="1920 × 1080"
          />
          {/* ⚠️ A full-page picture and a banner picture are two artworks fighting for the same
              screen, and the banner is on top — so a page background nobody can see reads as an
              upload that failed. Saying it here is the difference between a rule and a surprise. */}
          {theme.custom?.pageBgImage ? (
            <p className="mt-2 rounded border border-[#FDE68A] bg-[#FFFBEB] px-2.5 py-2 text-[11px] leading-[1.55] text-[#92400E]">
              The banner's own image is hidden while this is set, so the page background is what shows.
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
