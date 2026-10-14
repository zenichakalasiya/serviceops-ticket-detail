/* VENDORED from the upstream prototype (ronak-patel-motadata/ServiceOps-Ticket-Detail-, Oct 2026 sync).
   Used ONLY by the detail pages and listings brought in from upstream — this project's own detail
   pages keep their own version in ../. Do not edit to change our pages; edit ../ instead. */
import { useEffect, useRef, useState } from 'react';
import {
  AlignCenter, AlignJustify, AlignLeft, AlignRight, Baseline, Bold, Check, ChevronDown, Highlighter, Lightbulb,
  Image as ImageIcon, Italic, Link2, List, ListOrdered, Minus, Paperclip, Pencil, Redo2,
  Save, SendHorizontal, Smile, Table as TableIcon, Type, Underline, Undo2,
  ChevronRight, RefreshCw, TextCursorInput, Minimize2, Wand2,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { AiSparkle } from './AiSparkle';

/* Shared reply-editor toolbar pieces (Gmail/Outlook-style, decluttered):
 * - EditorQuickActions: the always-visible icon strip — Insert from Template · Insert Knowledge ·
 *   Attachment · Image · Link · Emoji · Text formatting (toggle). Sits right of the AI Assist button.
 * - EditorFormattingRow: the second row revealed by the Text-formatting toggle. Every control is
 *   FUNCTIONAL via document.execCommand; buttons preventDefault on mousedown so the selection is
 *   never lost, and B/I/U/lists/align/text-style track the CURRENT selection (Gmail-style active
 *   states) via document.queryCommandState on selectionchange. */

/** Re-select a plain-text offset range inside a contentEditable whose HTML is escaped text with
 *  <br> line breaks — used when the plain textarea converts to rich mode mid-selection. */
export function selectPlainRange(root: HTMLElement, start: number, end: number) {
  let pos = 0;
  let sNode: Node | null = null, sOff = 0, eNode: Node | null = null, eOff = 0;
  const walk = (node: Node) => {
    if (sNode && eNode) return;
    if (node.nodeType === Node.TEXT_NODE) {
      const len = node.textContent?.length ?? 0;
      if (!sNode && pos + len >= start) { sNode = node; sOff = start - pos; }
      if (!eNode && pos + len >= end) { eNode = node; eOff = end - pos; }
      pos += len;
    } else if ((node as HTMLElement).tagName === 'BR') {
      pos += 1; // a <br> stands for one "\n" character of the plain text
    } else {
      node.childNodes.forEach(walk);
    }
  };
  walk(root);
  if (sNode && eNode) {
    const r = document.createRange();
    r.setStart(sNode, sOff);
    r.setEnd(eNode, eOff);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(r);
  }
}

/** "Insert from Template" glyph (window-restore). Filled path whose frame lines are ~2px at
 *  size 16, so its weight matches the lucide stroke icons sitting next to it in the toolbar. */
function IconTemplate({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="currentColor" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">
      <path d="M29.2503 14.498C32.008 14.4982 34.2503 16.7403 34.2503 19.498V39.498C34.25 42.2555 32.0078 44.4979 29.2503 44.498H9.25031C6.49266 44.498 4.25057 42.2556 4.25031 39.498V19.498C4.25031 16.7402 6.49249 14.498 9.25031 14.498H29.2503ZM8.00031 39.498C8.00057 40.1853 8.56297 40.748 9.25031 40.748H29.2503C29.9375 40.7479 30.5 40.1852 30.5003 39.498V24.498H8.00031V39.498ZM38.0003 4.49805C41.4533 4.49821 44.2503 7.29502 44.2503 10.748V28.248C44.25 31.7008 41.4531 34.4979 38.0003 34.498H36.7503V30.748H38.0003C39.3828 30.7479 40.5 29.6305 40.5003 28.248V10.748C40.5003 9.36534 39.383 8.24821 38.0003 8.24805H20.5003C19.1175 8.24805 18.0003 9.36523 18.0003 10.748V11.998H14.2503V10.748C14.2503 7.29492 17.0472 4.49805 20.5003 4.49805H38.0003Z" />
    </svg>
  );
}

/** queryCommandValue returns rgb() strings — normalize to hex so they match the palette swatches. */
function rgbToHex(v: string): string {
  const m = v.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!m) return v.toLowerCase();
  return '#' + [1, 2, 3].map((i) => (+m[i]).toString(16).padStart(2, '0')).join('');
}

/** Run an editing command against the current selection (contentEditable). */
function exec(command: string, value?: string) {
  try {
    document.execCommand('styleWithCSS', false, 'true');
  } catch { /* ignore */ }
  document.execCommand(command, false, value);
}

function IconBtn({ label, active, onClick, children }: { label: string; active?: boolean; onClick?: () => void; children: React.ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onMouseDown={(e) => e.preventDefault()} // keep the editor selection + focus
          onClick={onClick}
          className={`size-[30px] flex items-center justify-center rounded transition-colors ${active ? 'bg-[#EAF2FB] text-[#3D8BD0]' : 'text-[#7B8FA5] hover:bg-[#F3F4F6] hover:text-[#364658]'}`}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

export function EditorQuickActions({ formattingOpen, onToggleFormatting }: { formattingOpen: boolean; onToggleFormatting: () => void }) {
  return (
    <div className="flex items-center gap-0.5">
      <IconBtn label="Insert from Template"><IconTemplate size={16} /></IconBtn>
      <IconBtn label="Insert Knowledge"><Lightbulb size={16} /></IconBtn>
      <IconBtn label="Attach file"><Paperclip size={16} /></IconBtn>
      <IconBtn label="Insert image"><ImageIcon size={16} /></IconBtn>
      <IconBtn label="Insert link"><Link2 size={16} /></IconBtn>
      <IconBtn label="Insert emoji"><Smile size={16} /></IconBtn>
      <IconBtn label="Text formatting" active={formattingOpen} onClick={onToggleFormatting}><Type size={16} /></IconBtn>
      <span className="mx-1 h-4 w-px flex-shrink-0 bg-[#E5E7EB]" />
      <IconBtn label="Undo" onClick={() => exec('undo')}><Undo2 size={16} /></IconBtn>
      <IconBtn label="Redo" onClick={() => exec('redo')}><Redo2 size={16} /></IconBtn>
    </div>
  );
}

const TEXT_STYLES = [
  { label: 'Paragraph', block: 'P' },
  { label: 'Heading 1', block: 'H1' },
  { label: 'Heading 2', block: 'H2' },
  { label: 'Heading 3', block: 'H3' },
] as const;
/** execCommand fontSize only accepts 1–7 — map the numeric px options onto the nearest step. */
const FONT_SIZES: { label: string; cmd: string }[] = [
  { label: 'Default', cmd: '3' },
  { label: '8', cmd: '1' }, { label: '10', cmd: '2' }, { label: '12', cmd: '3' }, { label: '14', cmd: '4' },
  { label: '16', cmd: '4' }, { label: '18', cmd: '5' }, { label: '20', cmd: '5' }, { label: '24', cmd: '6' },
  { label: '30', cmd: '6' }, { label: '36', cmd: '7' }, { label: '48', cmd: '7' }, { label: '60', cmd: '7' }, { label: '72', cmd: '7' },
];
const ALIGNS = [
  { key: 'Left', icon: AlignLeft, cmd: 'justifyLeft' },
  { key: 'Center', icon: AlignCenter, cmd: 'justifyCenter' },
  { key: 'Right', icon: AlignRight, cmd: 'justifyRight' },
  { key: 'Justify', icon: AlignJustify, cmd: 'justifyFull' },
] as const;

/* Gmail-style color matrix: a grayscale row, a brights row, then tint/shade rows per hue. */
const COLOR_MATRIX = [
  ['#000000', '#444444', '#666666', '#999999', '#cccccc', '#efefef', '#f3f3f3', '#ffffff'],
  ['#ff0000', '#ff9900', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#9900ff', '#ff00ff'],
  ['#f4cccc', '#fce5cd', '#fff2cc', '#d9ead3', '#d0e0e3', '#cfe2f3', '#d9d2e9', '#ead1dc'],
  ['#ea9999', '#f9cb9c', '#ffe599', '#b6d7a8', '#a2c4c9', '#9fc5e8', '#b4a7d6', '#d5a6bd'],
  ['#cc0000', '#e69138', '#f1c232', '#6aa84f', '#45818e', '#3d85c6', '#674ea7', '#a64d79'],
  ['#990000', '#b45f06', '#bf9000', '#38761d', '#134f5c', '#0b5394', '#351c75', '#741b47'],
];
const TABLE_HTML =
  '<table style="border-collapse:collapse;width:100%;margin:8px 0"><tbody>' +
  Array.from({ length: 3 }, () => '<tr>' + Array.from({ length: 3 }, () => '<td style="border:1px solid #DFE5ED;padding:6px 10px;min-width:60px"><br></td>').join('') + '</tr>').join('') +
  '</tbody></table><p><br></p>';

function ColorGrid({ title, selected, onPick }: { title: string; selected: string; onPick: (c: string) => void }) {
  return (
    <div className="w-max">
      <div className="mb-2 whitespace-nowrap text-[12px] font-medium text-[#364658]">{title}</div>
      {/* Explicit 20px columns — 1fr columns would collapse under the popup's shrink-to-fit
          width and make the fixed-size swatches overlap. */}
      <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(8, 20px)' }}>
        {COLOR_MATRIX.flat().map((c) => (
          <button
            key={c}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onPick(c)}
            className="relative size-5 rounded-[3px] border border-black/10 transition-shadow hover:ring-2 hover:ring-[#3D8BD0] hover:ring-offset-1"
            style={{ backgroundColor: c }}
            title={c}
          >
            {selected === c && (
              <Check size={13} className={`absolute inset-0 m-auto ${['#ffffff', '#f3f3f3', '#efefef', '#cccccc', '#ffff00', '#00ff00', '#00ffff', '#fff2cc', '#d9ead3', '#fce5cd', '#d0e0e3', '#cfe2f3', '#d9d2e9', '#ead1dc', '#ffe599'].includes(c) ? 'text-[#364658]' : 'text-white'}`} />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Composer footer actions — icon-only "Save as Draft" (bordered) + primary "Send" (filled),
 *  replacing the old text Send button. Radix tooltips carry the labels. */
export function EditorSendActions({ onSend, onSaveDraft, showSaveDraft = true }: { onSend?: () => void; onSaveDraft?: () => void; showSaveDraft?: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      {showSaveDraft && (
        <Tooltip>
          <TooltipTrigger asChild>
            <button onClick={onSaveDraft} className="flex size-8 items-center justify-center rounded border border-[#DFE5ED] bg-white text-[#7B8FA5] transition-colors hover:bg-[#F5F7FA] hover:text-[#364658]">
              <Save size={15} />
            </button>
          </TooltipTrigger>
          <TooltipContent>Save as Draft</TooltipContent>
        </Tooltip>
      )}
      <Tooltip>
        <TooltipTrigger asChild>
          <button onClick={onSend} className="flex size-8 items-center justify-center rounded bg-[#3D8BD0] text-white transition-colors hover:bg-[#2F7AB8]">
            <SendHorizontal size={15} />
          </button>
        </TooltipTrigger>
        <TooltipContent>Send</TooltipContent>
      </Tooltip>
    </div>
  );
}

/** Rich typing surface for the inline composers (Collaborate / Note): a contentEditable that keeps
 *  the drawer's plain value/onChange contract. External value changes (AI typing animations) are
 *  mirrored in ONLY while the user isn't focused in it — so the caret is never reset mid-typing —
 *  and being a real rich surface, text selection auto-opens the formatting row and all the
 *  formatting commands actually apply. */
export function RichComposerArea({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (el && document.activeElement !== el && el.innerText !== value) el.innerText = value;
  }, [value]);
  return (
    <div
      ref={ref}
      contentEditable
      dir="ltr"
      data-placeholder={placeholder}
      onInput={(e) => onChange((e.currentTarget as HTMLElement).innerText)}
      className="w-full min-h-[192px] cursor-text text-sm text-[#364658] focus:outline-none bg-transparent empty:before:text-[#9CA3AF] empty:before:content-[attr(data-placeholder)]"
      style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}
    />
  );
}

/** Self-contained toolbar for the inline composers (Forward / Collaborate / Note / …): owns its
 *  formatting-row toggle state and anchors the floating row to itself, so drawers can drop it in
 *  with a single tag. Mirrors the Reply editor behavior: selecting text in THIS composer's rich
 *  surface auto-opens the formatting row, and deselecting auto-hides it (a manual T toggle sticks). */
export function EditorToolbarActions({ fullWidthRow = false }: { fullWidthRow?: boolean } = {}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const openRef = useRef(open);
  openRef.current = open;
  const autoOpenedRef = useRef(false);

  useEffect(() => {
    const onSelectionChange = () => {
      // Scope to this composer's bordered container so multiple composers don't cross-trigger.
      const container = wrapRef.current?.closest('[class*="border-[#3D8BD0]"]') ?? wrapRef.current?.parentElement ?? null;
      const sel = document.getSelection();
      const node = sel?.anchorNode ?? null;
      const el = node ? (node.nodeType === 1 ? (node as HTMLElement) : node.parentElement) : null;
      const editable = el?.closest('[contenteditable]') ?? null;
      const insideSelection = !!(sel && !sel.isCollapsed && editable && container && container.contains(editable));
      if (insideSelection) {
        if (!openRef.current) {
          autoOpenedRef.current = true;
          setOpen(true);
        }
      } else if (autoOpenedRef.current && openRef.current) {
        autoOpenedRef.current = false;
        setOpen(false);
      }
    };
    document.addEventListener('selectionchange', onSelectionChange);
    return () => document.removeEventListener('selectionchange', onSelectionChange);
  }, []);

  return (
    // fullWidthRow: the wrapper drops `relative` so the row anchors to the nearest positioned
    // ancestor (the composer's footer row) and spans the FULL composer width — the same band the
    // Reply editor shows. Default keeps the compact 620px floating box for narrow composers.
    <div ref={wrapRef} className={fullWidthRow ? 'flex items-center gap-0.5' : 'relative flex items-center gap-0.5'}>
      {open && (
        <EditorFormattingRow
          className={fullWidthRow
            ? 'absolute bottom-full left-0 right-0 z-40 mb-2.5 flex flex-wrap items-center gap-0.5 border-y border-[#DFE5ED] bg-[#F9FAFB] px-4 py-1.5'
            : 'absolute bottom-full left-0 z-40 mb-3 flex w-[620px] max-w-[70vw] flex-wrap items-center gap-0.5 rounded-lg border border-[#DFE5ED] bg-[#F9FAFB] px-2 py-1'}
        />
      )}
      <EditorQuickActions
        formattingOpen={open}
        onToggleFormatting={() => { autoOpenedRef.current = false; setOpen((v) => !v); }}
      />
    </div>
  );
}

export function EditorFormattingRow({ className }: { className?: string } = {}) {
  const [openMenu, setOpenMenu] = useState<null | 'text' | 'size' | 'align' | 'highlight' | 'color'>(null);
  const [textStyle, setTextStyle] = useState('Paragraph');
  const [fontSize, setFontSize] = useState('Default');
  const [align, setAlign] = useState<(typeof ALIGNS)[number]['key']>('Left');
  const [bgColor, setBgColor] = useState('#ffff00');
  const [fgColor, setFgColor] = useState('#cc0000');
  // Gmail-style active states — reflect the formatting at the CURRENT caret/selection.
  const [cmdStates, setCmdStates] = useState<Record<string, boolean>>({});

  const refreshStates = () => {
    const q = (c: string) => { try { return document.queryCommandState(c); } catch { return false; } };
    const v = (c: string) => { try { return String(document.queryCommandValue(c) ?? ''); } catch { return ''; } };
    // Colors at the caret/selection: "active" when they differ from the editor defaults.
    const bc = v('backColor') || v('hiliteColor');
    const fc = v('foreColor');
    const bgActive = !!bc && !['rgba(0, 0, 0, 0)', 'transparent', 'rgb(255, 255, 255)', ''].includes(bc);
    const fgActive = !!fc && !['rgb(54, 70, 88)', 'rgb(0, 0, 0)', ''].includes(fc);
    setCmdStates({
      bold: q('bold'), italic: q('italic'), underline: q('underline'),
      ul: q('insertUnorderedList'), ol: q('insertOrderedList'),
      highlight: bgActive, color: fgActive,
    });
    if (bgActive) setBgColor(rgbToHex(bc));
    if (fgActive) setFgColor(rgbToHex(fc));
    if (q('justifyCenter')) setAlign('Center');
    else if (q('justifyRight')) setAlign('Right');
    else if (q('justifyFull')) setAlign('Justify');
    else setAlign('Left');
    const block = v('formatBlock').toLowerCase();
    setTextStyle(block === 'h1' ? 'Heading 1' : block === 'h2' ? 'Heading 2' : block === 'h3' ? 'Heading 3' : 'Paragraph');
    // fontSize (1–7) — sync to the canonical label per step. Steps 2–3 cover the editor's own
    // default size (~13–14px), so they read as "Default" rather than a number.
    const size = v('fontSize');
    const sizeLabel = ({ '1': '8', '2': 'Default', '3': 'Default', '4': '14', '5': '18', '6': '24', '7': '36' } as Record<string, string>)[size];
    if (sizeLabel) setFontSize(sizeLabel);
  };
  useEffect(() => {
    document.addEventListener('selectionchange', refreshStates);
    refreshStates();
    return () => document.removeEventListener('selectionchange', refreshStates);
  }, []);
  const run = (command: string, value?: string) => { exec(command, value); refreshStates(); };

  const menuBase = 'app-menu absolute left-0 bottom-full mb-1 bg-white border border-[#DFE5ED] rounded-lg shadow-lg py-1 z-50';
  const menuCls = `${menuBase} min-w-[150px]`;
  const itemCls = (sel: boolean) => `w-full flex items-center gap-2 px-3 py-1.5 text-left text-[13px] transition-colors ${sel ? 'bg-[#F1F5F9] text-[#364658] font-medium' : 'text-[#364658] hover:bg-[#F9FAFB]'}`;
  const Divider = () => <span className="mx-1 h-4 w-px flex-shrink-0 bg-[#E5E7EB]" />;
  const swallow = (e: React.MouseEvent) => e.preventDefault(); // keep the editor selection alive
  const AlignIcon = ALIGNS.find((a) => a.key === align)!.icon;

  return (
    // FLOATS above the bottom toolbar (parent must be `relative`) so toggling it never changes the
    // editor/conversation height. No overflow-x-auto — it would clip the upward dropdowns; wrap instead.
    <div className={className ?? 'absolute bottom-full -left-4 -right-4 z-40 mb-2.5 flex flex-wrap items-center gap-0.5 border-y border-[#DFE5ED] bg-[#F9FAFB] px-4 py-1.5'}>
      {/* Text style (Paragraph / H1 / H2 / H3) — compact "A✎" trigger so the row stays one line */}
      <div className="relative flex-shrink-0">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onMouseDown={swallow}
              onClick={() => setOpenMenu(openMenu === 'text' ? null : 'text')}
              className={`flex h-[30px] items-center gap-1 rounded px-2 transition-colors ${textStyle !== 'Paragraph' ? 'bg-[#EAF2FB] text-[#3D8BD0]' : openMenu === 'text' ? 'bg-[#F3F4F6] text-[#364658]' : 'text-[#364658] hover:bg-[#F3F4F6]'}`}
            >
              <span className="flex items-end gap-[2px]">
                <span className="text-[13px] font-semibold leading-none">A</span>
                <Pencil size={9} className={textStyle !== 'Paragraph' ? 'text-[#3D8BD0]' : 'text-[#7B8FA5]'} />
              </span>
              <ChevronDown size={12} className={textStyle !== 'Paragraph' ? 'text-[#3D8BD0]' : 'text-[#7B8FA5]'} />
            </button>
          </TooltipTrigger>
          <TooltipContent>Text style</TooltipContent>
        </Tooltip>
        {openMenu === 'text' && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpenMenu(null)} />
            <div className={menuCls}>
              {TEXT_STYLES.map((o) => (
                <button key={o.label} onMouseDown={swallow} onClick={() => { run('formatBlock', `<${o.block}>`); setTextStyle(o.label); setOpenMenu(null); }} className={itemCls(textStyle === o.label)}>
                  <span className={o.block === 'H1' ? 'text-[16px] font-semibold' : o.block === 'H2' ? 'text-[14px] font-semibold' : o.block === 'H3' ? 'text-[13px] font-semibold' : ''}>{o.label}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
      <Divider />
      <IconBtn label="Bold" active={cmdStates.bold} onClick={() => run('bold')}><Bold size={15} /></IconBtn>
      <IconBtn label="Italic" active={cmdStates.italic} onClick={() => run('italic')}><Italic size={15} /></IconBtn>
      <IconBtn label="Underline" active={cmdStates.underline} onClick={() => run('underline')}><Underline size={15} /></IconBtn>
      <Divider />
      {/* Font size */}
      <div className="relative flex-shrink-0">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onMouseDown={swallow}
              onClick={() => setOpenMenu(openMenu === 'size' ? null : 'size')}
              className={`flex h-[30px] items-center gap-1 rounded px-2 transition-colors ${fontSize !== 'Default' ? 'bg-[#EAF2FB] text-[#3D8BD0]' : openMenu === 'size' ? 'bg-[#F3F4F6] text-[#364658]' : 'text-[#364658] hover:bg-[#F3F4F6]'}`}
            >
              <span className="text-[13px] font-medium">tT</span>
              {fontSize !== 'Default' && <span className="text-[11px]">{fontSize}</span>}
              <ChevronDown size={12} className={fontSize !== 'Default' ? 'text-[#3D8BD0]' : 'text-[#7B8FA5]'} />
            </button>
          </TooltipTrigger>
          <TooltipContent>Font size</TooltipContent>
        </Tooltip>
        {openMenu === 'size' && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpenMenu(null)} />
            <div className={`${menuBase} w-[100px] max-h-[280px] overflow-y-auto`}>
              {FONT_SIZES.map((o) => (
                <button key={o.label} onMouseDown={swallow} onClick={() => { run('fontSize', o.cmd); setFontSize(o.label); setOpenMenu(null); }} className={itemCls(fontSize === o.label)}>
                  {o.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
      <Divider />
      {/* Align */}
      <div className="relative flex-shrink-0">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onMouseDown={swallow}
              onClick={() => setOpenMenu(openMenu === 'align' ? null : 'align')}
              className={`flex h-[30px] items-center gap-1 rounded px-2 transition-colors ${align !== 'Left' ? 'bg-[#EAF2FB] text-[#3D8BD0]' : openMenu === 'align' ? 'bg-[#F3F4F6] text-[#364658]' : 'text-[#7B8FA5] hover:bg-[#F3F4F6] hover:text-[#364658]'}`}
            >
              <AlignIcon size={15} />
              <ChevronDown size={12} className={align !== 'Left' ? 'text-[#3D8BD0]' : 'text-[#7B8FA5]'} />
            </button>
          </TooltipTrigger>
          <TooltipContent>Align</TooltipContent>
        </Tooltip>
        {openMenu === 'align' && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpenMenu(null)} />
            <div className={menuCls}>
              {ALIGNS.map(({ key, icon: Icon, cmd }) => (
                <button key={key} onMouseDown={swallow} onClick={() => { run(cmd); setAlign(key); setOpenMenu(null); }} className={itemCls(align === key)}>
                  <Icon size={14} className="text-[#7B8FA5]" />
                  {key}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
      <Divider />
      <IconBtn label="Bullet list" active={cmdStates.ul} onClick={() => run('insertUnorderedList')}><List size={15} /></IconBtn>
      <IconBtn label="Numbered list" active={cmdStates.ol} onClick={() => run('insertOrderedList')}><ListOrdered size={15} /></IconBtn>
      <Divider />
      {/* Gmail-style color palettes — each button opens its OWN grid; a color bar under the icon
          shows the current/last color, and the button lights up when the selection carries one */}
      <div className="relative flex-shrink-0">
        <IconBtn label="Text background" active={openMenu === 'highlight' || cmdStates.highlight} onClick={() => setOpenMenu(openMenu === 'highlight' ? null : 'highlight')}>
          <span className="flex flex-col items-center">
            <Highlighter size={13} />
            <span className="mt-[2px] h-[3px] w-4 rounded-sm border border-black/10" style={{ backgroundColor: bgColor }} />
          </span>
        </IconBtn>
        {openMenu === 'highlight' && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpenMenu(null)} />
            <div className={`${menuBase} p-3`}>
              <ColorGrid title="Background color" selected={bgColor} onPick={(c) => { run('hiliteColor', c); setBgColor(c); setOpenMenu(null); }} />
            </div>
          </>
        )}
      </div>
      <div className="relative flex-shrink-0">
        <IconBtn label="Text color" active={openMenu === 'color' || cmdStates.color} onClick={() => setOpenMenu(openMenu === 'color' ? null : 'color')}>
          <span className="flex flex-col items-center">
            <Baseline size={13} />
            <span className="mt-[2px] h-[3px] w-4 rounded-sm border border-black/10" style={{ backgroundColor: fgColor }} />
          </span>
        </IconBtn>
        {openMenu === 'color' && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpenMenu(null)} />
            <div className={`${menuBase} p-3`}>
              <ColorGrid title="Text color" selected={fgColor} onPick={(c) => { run('foreColor', c); setFgColor(c); setOpenMenu(null); }} />
            </div>
          </>
        )}
      </div>
      <Divider />
      <IconBtn label="Separator" onClick={() => run('insertHorizontalRule')}><Minus size={15} /></IconBtn>
      <IconBtn label="Table" onClick={() => run('insertHTML', TABLE_HTML)}><TableIcon size={15} /></IconBtn>
    </div>
  );
}


/* AI Assist — the gradient button + Refine menu used by the approval-comments composer, shared so
 * any rich editor can drop it in. Actions are visual in this prototype (the real product calls the
 * assistant); Change tone opens a submenu. */
export function EditorAiAssist() {
  const [open, setOpen] = useState(false);
  const [toneOpen, setToneOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); setToneOpen(false); }
    };
    if (open) {
      document.addEventListener('mousedown', onDown);
      return () => document.removeEventListener('mousedown', onDown);
    }
  }, [open]);

  const Item = ({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick?: () => void }) => (
    <button
      onClick={() => { onClick?.(); if (!onClick) { setOpen(false); setToneOpen(false); } }}
      className="flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-[#F9FAFB]"
    >
      {icon}
      <span className="text-xs text-[#364658]">{label}</span>
    </button>
  );

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium text-[#364658] hover:bg-[#F0F8FF]"
        style={{ background: 'linear-gradient(90deg, rgba(76, 177, 254, 0.12) 0%, rgba(115, 30, 251, 0.12) 41.49%, rgba(249, 17, 227, 0.12) 100%), #FFF' }}
      >
        <AiSparkle size={14} />
        <span>AI Assist</span>
        <ChevronDown size={12} className="text-[#7B8FA5]" />
      </button>

      {open && (
        <div className="app-menu absolute bottom-full left-0 z-50 mb-2 w-[220px] rounded-lg border border-[#DFE5ED] bg-white shadow-lg">
          <div className="py-2">
            <div className="px-2 py-1.5 text-[11px] font-medium text-[#7B8FA5]">Refine</div>
            <Item icon={<RefreshCw size={14} className="text-[#364658]" />} label="Rephrase" />
            <Item icon={<TextCursorInput size={14} className="text-[#364658]" />} label="Make longer" />
            <Item icon={<Minimize2 size={14} className="text-[#364658]" />} label="Make shorter" />

            <div className="relative">
              <button
                onClick={() => setToneOpen(!toneOpen)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-[#F9FAFB]"
              >
                <Wand2 size={14} className="text-[#364658]" />
                <span className="flex-1 text-xs text-[#364658]">Change tone</span>
                <ChevronRight size={12} className="text-[#7B8FA5]" />
              </button>
              {toneOpen && (
                <div className="app-menu absolute bottom-0 left-full ml-1 w-[160px] rounded-lg border border-[#DFE5ED] bg-white py-1 shadow-lg">
                  {['Professional', 'Empathetic', 'Concise', 'Formal', 'Friendly'].map((t) => (
                    <button
                      key={t}
                      onClick={() => { setToneOpen(false); setOpen(false); }}
                      className="w-full px-3 py-2 text-left text-xs text-[#364658] transition-colors hover:bg-[#F9FAFB]"
                    >{t}</button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
