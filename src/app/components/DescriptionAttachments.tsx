import { useState } from 'react';
import { Download, Trash2, Paperclip } from 'lucide-react';
import { toast } from 'sonner';
import { Tooltip, TooltipTrigger, TooltipContent } from './ui/tooltip';

/* Attachment strip under a request description. Built for the long case: a request that has
 * collected a dozen files must stay as readable as one with two, so the list is a fluid grid that
 * caps its height and reveals the rest on demand, rather than a single flex row that wraps into an
 * unscannable block and pushes the rest of the page down. */

export interface AttachmentFile {
  name: string;
  /** Human-readable, e.g. "674 KB" — parsed back to bytes only for the total. */
  size: string;
}

/* Colour by file family. In a list of twelve, type is what the eye sorts on first, so the badge
   carries the extension in its own tint instead of every row showing the same grey page icon. */
const TYPE_TONES: { match: string[]; bg: string; text: string }[] = [
  { match: ['pdf'], bg: '#FEF3F2', text: '#B42318' },
  { match: ['doc', 'docx', 'rtf'], bg: '#EFF8FF', text: '#175CD3' },
  { match: ['xls', 'xlsx', 'csv'], bg: '#ECFDF3', text: '#067647' },
  { match: ['ppt', 'pptx'], bg: '#FFF4ED', text: '#B93815' },
  { match: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp'], bg: '#F4F3FF', text: '#5925DC' },
  { match: ['zip', 'rar', '7z', 'tar', 'gz'], bg: '#FEF6E7', text: '#B4690E' },
  { match: ['msg', 'eml'], bg: '#FDF2FA', text: '#C11574' },
];
const DEFAULT_TONE = { bg: '#F1F5F9', text: '#475467' };

const extOf = (name: string) => (name.split('.').pop() ?? '').toLowerCase();
const toneFor = (name: string) => TYPE_TONES.find((t) => t.match.includes(extOf(name))) ?? DEFAULT_TONE;

/**
 * The file-type badge — the extension in its own tint, in place of the identical grey page icon
 * every attachment used to show. Exported so the conversation chips and the right-panel
 * Attachments list read the same as these, rather than each inventing its own file marker.
 */
export function FileTypeBadge({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' }) {
  const tone = toneFor(name);
  return (
    <span
      className={`flex flex-shrink-0 items-center justify-center rounded-sm font-bold uppercase leading-none ${
        size === 'sm' ? 'h-[18px] w-[26px] text-[8px]' : 'h-[22px] w-[30px] text-[9px]'
      }`}
      style={{ backgroundColor: tone.bg, color: tone.text }}
    >
      {extOf(name).slice(0, 4) || 'FILE'}
    </span>
  );
}

/* Sizes arrive as display strings, so the header total parses them back rather than asking every
   caller to carry byte counts it does not otherwise need. */
const toBytes = (s: string) => {
  const m = /^\s*([\d.]+)\s*(B|KB|MB|GB)\s*$/i.exec(s);
  if (!m) return 0;
  const unit = { b: 1, kb: 1024, mb: 1024 ** 2, gb: 1024 ** 3 }[m[2].toLowerCase()] ?? 1;
  return parseFloat(m[1]) * unit;
};
const formatBytes = (n: number) =>
  n >= 1024 ** 3 ? `${(n / 1024 ** 3).toFixed(1)} GB`
    : n >= 1024 ** 2 ? `${(n / 1024 ** 2).toFixed(1)} MB`
      : `${Math.max(1, Math.round(n / 1024))} KB`;

export function DescriptionAttachments({
  files,
  highlight = false,
  onPreview,
}: {
  files: AttachmentFile[];
  /** Flash the strip when the reader is sent here from elsewhere on the page. */
  highlight?: boolean;
  onPreview?: (file: AttachmentFile) => void;
}) {
  // Prototype-local removal: delete has to feel real without every caller owning a file list.
  const [removed, setRemoved] = useState<Set<string>>(new Set());

  const live = files.filter((f) => !removed.has(f.name));
  if (!live.length) return null;

  /* Two files need no chrome — the header earns its space only once the list is long enough that
     a count and a bulk download are quicker than reading every row. */
  const showHeader = live.length > 3;
  const total = live.reduce((n, f) => n + toBytes(f.size), 0);

  return (
    <div className="mt-3">
      {showHeader && (
        <div className="mb-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
          <Paperclip size={13} className="flex-shrink-0 text-[#7B8FA5]" />
          <span className="text-[12px] font-semibold text-[#364658]">Attachments</span>
          <span className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#EEF2F6] px-1 text-[11px] font-semibold text-[#64748B]">
            {live.length}
          </span>
          {total > 0 && <span className="text-[11px] text-[#94A3B8]">{formatBytes(total)}</span>}
          <button
            onClick={() => toast.success(`Downloading ${live.length} attachments`)}
            className="ml-auto inline-flex items-center gap-1.5 rounded border border-[#DFE5ED] bg-white px-2 py-1 text-[11px] font-medium text-[#364658] transition-colors hover:border-[#3D8BD0] hover:bg-[#F5F9FD] hover:text-[#3D8BD0]"
          >
            <Download size={12} />
            Download all
          </button>
        </div>
      )}

      {/* Fluid grid — columns fill whatever width the drawer happens to be, so the same markup
          reads as one row in a narrow drawer and three or four across a full-screen one. */}
      <div className="grid gap-1.5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(212px, 1fr))' }}>
        {live.map((f) => {
          return (
            <div
              key={f.name}
              className={`group/file relative flex items-center gap-2 rounded border px-2.5 py-1 transition-all ${
                highlight
                  ? 'border-[#3D8BD0] bg-[#EBF5FF] shadow-sm'
                  : 'border-[#DFE5ED] bg-[#F5F7FA] hover:border-[#CBD5E1] hover:bg-white hover:shadow-sm'
              }`}
            >
              <button
                onClick={() => onPreview?.(f)}
                className="flex min-w-0 flex-1 items-center gap-2 text-left"
              >
                <FileTypeBadge name={f.name} />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-xs font-medium text-[#364658]" title={f.name}>{f.name}</span>
                  <span className="text-[10px] leading-tight text-[#7B8FA5]">{f.size}</span>
                </span>
              </button>
              {/* Actions fade in over the row's right edge; the row keeps its full width for the
                  file name, which is the part that actually needs the space. */}
              <div className="absolute inset-y-px right-px flex items-center gap-0.5 rounded-r pl-8 pr-1.5 opacity-0 transition-opacity group-hover/file:opacity-100"
                style={{ background: `linear-gradient(to right, ${highlight ? 'rgba(235,245,255,0)' : 'rgba(255,255,255,0)'} 0%, ${highlight ? '#EBF5FF' : '#FFFFFF'} 42%)` }}
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => toast.success(`Downloading ${f.name}`)}
                      className="flex size-6 items-center justify-center rounded hover:bg-[#EEF2F6]"
                    >
                      <Download className="size-3.5 text-[#7B8FA5]" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Download</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setRemoved((prev) => new Set(prev).add(f.name))}
                      className="flex size-6 items-center justify-center rounded hover:bg-[#FEF3F2]"
                    >
                      <Trash2 className="size-3.5 text-[#EF4444]" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Delete</TooltipContent>
                </Tooltip>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
