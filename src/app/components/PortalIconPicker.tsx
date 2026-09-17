import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import {
  AppWindow, Baseline, Bell, BookOpen, Boxes, Building2, Calendar, ChevronDown, ClipboardList,
  Cloud, Cpu, CreditCard, Database, FileText, Fingerprint, Globe, HardDrive, Headphones, Key,
  Laptop, LifeBuoy, Lock, Mail, MapPin, Monitor, Network, Package, Phone, Plug, Printer, Router,
  Search, Server, Settings2, Shield, ShieldCheck, ShoppingCart, Smartphone, Ticket, Upload,
  UserPlus, Users, Wifi, Wrench, X, Zap,
} from 'lucide-react';
import { toast } from 'sonner';

/* Icon picker for a service.
 *
 * The grid is ITSM-shaped on purpose — a portal admin adding "VPN access" or "New laptop" should
 * find the icon by recognising it, not by knowing what it is called in a 2,000-icon library. The
 * search is there for when they do. Upload covers the rest, because every service desk eventually
 * has a service no stock set has a glyph for. */

import { ImageUploadZone, UploadZone } from './PortalControls';

export interface IconChoice {
  /** Registry key, `upload` for a custom glyph, or `image` for a picture filling the slot. */
  key: string;
  /** Data URL, for uploads and images. */
  src?: string;
}

/* ⚠️ An IMAGE is not a big icon, and that is the whole distinction. An icon is a glyph that sits
   INSIDE the badge and takes the card's icon colour; an image is artwork that BECOMES the badge and
   is cropped to fill it. Same slot on the card, two different renderings — so the choice is made
   once, in the picker, rather than by uploading a file and hoping it lands the way you meant. */
export const isImageChoice = (c?: IconChoice) => c?.key === 'image' && !!c.src;

/* Grouped the way a service catalogue is, so scanning matches how the admin is thinking. */
const ICON_GROUPS: { group: string; icons: Record<string, React.ReactNode> }[] = [
  {
    group: 'Requests & tickets',
    icons: {
      ticket: <Ticket />, clipboard: <ClipboardList />, file: <FileText />, mail: <Mail />,
      phone: <Phone />, headset: <Headphones />, lifebuoy: <LifeBuoy />, bell: <Bell />,
    },
  },
  {
    group: 'Hardware',
    icons: {
      laptop: <Laptop />, monitor: <Monitor />, smartphone: <Smartphone />, printer: <Printer />,
      server: <Server />, harddrive: <HardDrive />, cpu: <Cpu />, package: <Package />,
    },
  },
  {
    group: 'Network & access',
    icons: {
      wifi: <Wifi />, network: <Network />, router: <Router />, globe: <Globe />,
      key: <Key />, lock: <Lock />, fingerprint: <Fingerprint />, shield: <Shield />,
    },
  },
  {
    group: 'Software & data',
    icons: {
      appwindow: <AppWindow />, database: <Database />, cloud: <Cloud />, plug: <Plug />,
      boxes: <Boxes />, settings: <Settings2 />, wrench: <Wrench />, zap: <Zap />,
    },
  },
  {
    group: 'People & places',
    icons: {
      users: <Users />, userplus: <UserPlus />, building: <Building2 />, mappin: <MapPin />,
      calendar: <Calendar />, book: <BookOpen />, cart: <ShoppingCart />, card: <CreditCard />,
      shieldcheck: <ShieldCheck />, search: <Search />, baseline: <Baseline />,
    },
  },
];

const ALL = ICON_GROUPS.flatMap((g) => Object.entries(g.icons));

export const iconNode = (choice?: IconChoice, size = 22) => {
  if (!choice) return null;
  if (choice.key === 'upload' && choice.src) {
    return <img src={choice.src} alt="" style={{ width: size, height: size, objectFit: 'contain' }} />;
  }
  const found = ALL.find(([k]) => k === choice.key);
  return found ? <span style={{ display: 'flex' }}>{found[1]}</span> : null;
};

/* ⚠️ Exported so the CANVAS can open the very same grid the panel field opens. Two icon pickers for
   one setting is how the two end up offering different icons. */
export function IconPopover({ value, onPick, onClose, anchor }: {
  value?: IconChoice; onPick: (c: IconChoice) => void; onClose: () => void; anchor: DOMRect;
}) {
  const [q, setQ] = useState('');
  /* Opens on whichever kind is already set, so returning to change a picture does not land you in
     the glyph grid you did not choose. */
  const [mode, setMode] = useState<'icon' | 'image'>(isImageChoice(value) ? 'image' : 'icon');
  const ref = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const away = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', away);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', away); document.removeEventListener('keydown', esc); };
  }, [onClose]);

  const query = q.trim().toLowerCase();
  const groups = ICON_GROUPS
    .map((g) => ({ ...g, hits: Object.entries(g.icons).filter(([k]) => !query || k.includes(query) || g.group.toLowerCase().includes(query)) }))
    .filter((g) => g.hits.length);

  /* ⚠️ A bigger ceiling than the glyph uploader's 512 KB — a photograph that fills a card is a
     different kind of file from an SVG mark, and holding it to the icon budget would reject almost
     every real image someone tries. */
  const uploadImage = (file?: File) => {
    if (!file) return;
    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) { toast.error('Use a PNG, JPG or WebP file'); return; }
    if (file.size > 3 * 1024 * 1024) { toast.error('Image must be under 3 MB'); return; }
    const reader = new FileReader();
    reader.onload = () => { onPick({ key: 'image', src: String(reader.result) }); onClose(); };
    reader.readAsDataURL(file);
  };

  const upload = (file?: File) => {
    if (!file) return;
    if (!/^image\/(svg\+xml|png|jpeg|webp)$/.test(file.type)) {
      toast.error('Use an SVG, PNG, JPG or WebP file');
      return;
    }
    if (file.size > 512 * 1024) { toast.error('Icon must be under 512 KB'); return; }
    const reader = new FileReader();
    reader.onload = () => { onPick({ key: 'upload', src: String(reader.result) }); onClose(); };
    reader.readAsDataURL(file);
  };

  /* ⚠️ It opens BESIDE the icon, never on top of it — the whole point of picking an icon is
     watching the one you click land on the page. The old placement pinned it under the anchor and
     then CLAMPED that into the viewport, so on anything in the lower half of the screen the clamp
     dragged it back up over the icon: you chose a glyph blind and only saw it after the popover
     closed.
     ⚠️ The side with more ROOM wins, and the popover is capped to that room rather than to a flat
     420 — a fixed height is what made the clamp necessary in the first place. Below is preferred on
     a tie, because a list that grows downward from the thing it belongs to is the direction every
     menu in this product opens.
     ⚠️ Placed from the BOTTOM edge when it goes above, so the gap above the icon is exact without
     measuring the popover first: its height depends on how many groups the search leaves. */
  const GAP = 8;
  const W = 300;
  const below = window.innerHeight - anchor.bottom - GAP * 2;
  const above = anchor.top - GAP * 2;
  const placeBelow = below >= above;
  const maxHeight = Math.max(220, Math.min(420, placeBelow ? below : above));
  const pos: CSSProperties = placeBelow
    ? { top: anchor.bottom + GAP }
    : { bottom: window.innerHeight - anchor.top + GAP };
  const left = Math.max(8, Math.min(anchor.left, window.innerWidth - W - 8));

  return createPortal(
    <div ref={ref} style={{ ...pos, left, maxHeight }} className="fixed z-[10000] flex w-[300px] flex-col rounded-lg border border-[#E5E7EB] bg-white shadow-[0_12px_24px_-6px_rgba(16,24,40,0.18)]">
      {/* ⚠️ No rule under the tabs. A tab strip and the panel it switches ARE one block — a line
          between them cuts the control from the thing it controls, which is the same reason the
          Branding panel's section heads lost theirs. */}
      <div className="flex-shrink-0 p-3">
        {/* Two ways to fill one slot, named up front. */}
        <div className="mb-2.5 flex gap-1 rounded bg-[#F1F5F9] p-0.5">
          {(['icon', 'image'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 rounded py-1 text-[12px] font-medium capitalize transition-colors ${
                mode === m ? 'bg-white text-[#364658] shadow-[0_1px_2px_rgba(16,24,40,0.06)]' : 'text-[#7B8FA5] hover:text-[#364658]'
              }`}
            >{m}</button>
          ))}
        </div>
        <div className={`relative ${mode === 'image' ? 'hidden' : ''}`}>
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9ca3af]" size={14} />
          <input
            autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search icons"
            className="h-8 w-full rounded border border-[#d1d5db] bg-white pl-8 pr-2 text-[13px] text-[#364658] placeholder:text-[#9ca3af] focus:border-[#3D8BD0] focus:outline-none focus:ring-1 focus:ring-[#3D8BD0]"
          />
        </div>
      </div>

      {mode === 'image' ? (
        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          {/* ⚠️ FILLED shows the preview and ONE action: Replace.
              It used to show a red "Remove image" link AND a second dashed "Choose a different
              image" box below the picture — three things where there is one move. This slot is
              filled because a card needs an icon, so swapping is what people come here to do, and
              the destructive verb was sitting on top of the common one. Removing is still possible
              from the Icon tab, where "none" is a real choice rather than an undo. */}
          {isImageChoice(value) ? (
            <>
              {/* Shown CROPPED the way the card will crop it, not letterboxed — a preview that
                  fits the whole picture in tells you nothing about what the card will show. */}
              <span
                className="block h-[92px] w-full rounded border border-[#E5E7EB] bg-cover bg-center"
                style={{ backgroundImage: `url(${value!.src})` }}
              />
              <button
                onClick={() => imgRef.current?.click()}
                className="mt-2 inline-flex h-8 w-full items-center justify-center gap-1.5 rounded border border-[#DFE5ED] bg-white text-[12px] font-medium text-[#364658] transition-colors hover:border-[#3D8BD0] hover:text-[#3D8BD0]"
              ><Upload size={13} /> Replace image</button>
            </>
          ) : (
            <ImageUploadZone
              /* ⚠️ 128 SQUARE. The slot renders at 44px and CROPS to it, so a square asset is the only
                 shape that survives the crop with nothing lost off its sides. */
              onFile={(src) => { onPick({ key: 'image', src }); onClose(); }}
              accept="image/png,image/jpeg,image/webp"
              label="Upload an image for this icon slot"
              suggested="128 × 128"
            />
          )}
          <p className="mt-2 text-[11px] leading-[1.5] text-[#9CA3AF]">
            Fills the icon slot and is cropped to it.
          </p>
          <input
            ref={imgRef} type="file" accept="image/png,image/jpeg,image/webp"
            onChange={(e) => uploadImage(e.target.files?.[0])} className="hidden"
          />
        </div>
      ) : (
      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {groups.length === 0 ? (
          <p className="py-8 text-center text-[13px] text-[#9CA3AF]">No icons match “{q}”.</p>
        ) : groups.map((g) => (
          <div key={g.group} className="mb-3 last:mb-0">
            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#7B8FA5]">{g.group}</div>
            <div className="grid grid-cols-6 gap-1.5">
              {g.hits.map(([key, node]) => (
                <button
                  key={key}
                  onClick={() => { onPick({ key }); onClose(); }}
                  title={key}
                  className={`flex aspect-square items-center justify-center rounded border transition-colors ${
                    value?.key === key ? 'border-[#3D8BD0] bg-[#EBF5FF] text-[#3D8BD0]' : 'border-transparent text-[#64748B] hover:border-[#DFE5ED] hover:bg-[#F5F7FA]'
                  }`}
                >
                  <span className="[&>svg]:size-[18px]">{node}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      )}

      <div className={`flex-shrink-0 border-t border-[#F0F2F5] p-3 ${mode === 'image' ? 'hidden' : ''}`}>
        {/* ⚠️ A PRIMARY button, not a dashed outline. Bringing your own mark is the one thing the
            43-icon grid above cannot do for you, so it is the most important action in this popover
            and it was styled as the least — a dotted rectangle reads as a drop zone you are meant to
            ignore until nothing else fits.
            ⚠️ And it names the formats it takes. "Upload SVG or image" made you find out by being
            rejected which of your files counted as "image". */}
        <button
          onClick={() => fileRef.current?.click()}
          className="flex h-9 w-full items-center justify-center gap-1.5 rounded bg-[#3D8BD0] text-[13px] font-medium text-white transition-colors hover:bg-[#2d6ca0]"
        ><Upload size={14} /> Upload SVG or PNG</button>
        <input
          ref={fileRef} type="file" accept=".svg,image/svg+xml,image/png,image/jpeg,image/webp"
          onChange={(e) => upload(e.target.files?.[0])} className="hidden"
        />
      </div>
    </div>,
    document.body,
  );
}

/* ⚠️ TABS, not a single "Icon" row. The slot has always accepted two different things — a glyph
   that sits inside the badge, and a picture that becomes it — and one field called "Icon" made the
   second one undiscoverable: you had to know that uploading a particular kind of file would be
   treated differently. Naming the two choices is what makes both reachable, and it is the same
   distinction isImageChoice already draws in the data.
   ⚠️ The tab OPENS on whatever the slot currently holds, so the field always shows you what is
   there rather than a default that hides it. */
export function IconField({ value, onChange }: { value?: IconChoice; onChange: (c?: IconChoice) => void }) {
  const [tab, setTab] = useState<'image' | 'icon'>(isImageChoice(value) ? 'image' : 'icon');
  const tabBtn = (id: 'image' | 'icon', label: string) => (
    <button
      key={id}
      onClick={() => setTab(id)}
      className={`h-7 flex-1 rounded text-[12px] font-medium transition-colors ${
        tab === id ? 'bg-white text-[#364658] shadow-[0_1px_2px_rgba(16,24,40,0.06)]' : 'text-[#64748B] hover:text-[#364658]'
      }`}
    >{label}</button>
  );
  return (
    <div>
      <div className="mb-2 flex items-center gap-1 rounded bg-[#F1F5F9] p-0.5">
        {tabBtn('image', 'Image')}
        {tabBtn('icon', 'Icon')}
      </div>
      {/* ⚠️ UploadZone already draws the preview and says "Replace image" once one is set — the
          swap is the common move on a slot that is always filled, so it must not read "Remove". */}
      {tab === 'image'
        ? <UploadZone
            value={isImageChoice(value) ? value?.src : undefined}
            onChange={(src) => onChange(src ? { key: 'image', src } : undefined)}
            /* ⚠️ The SAME 128 square the popover suggests. Two ways into one slot must not disagree
               about what fits it — an admin who reached it from the panel would otherwise be given a
               different answer from one who clicked the icon on the canvas. */
            suggested="128 × 128"
          />
        : <IconOnlyField value={isImageChoice(value) ? undefined : value} onChange={onChange} />}
    </div>
  );
}

/** The icon half: the current glyph, its name, and the picker. */
function IconOnlyField({ value, onChange }: { value?: IconChoice; onChange: (c?: IconChoice) => void }) {
  const [anchor, setAnchor] = useState<DOMRect | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  return (
    <div className="flex items-center gap-2">
      <span className="flex size-9 flex-shrink-0 items-center justify-center rounded border border-[#DFE5ED] bg-[#F7F9FC] text-[#364658] [&>span>svg]:size-[18px]">
        {iconNode(value) ?? <span className="text-[11px] text-[#9CA3AF]">None</span>}
      </span>
      <button
        ref={btnRef}
        onClick={() => setAnchor(anchor ? null : btnRef.current!.getBoundingClientRect())}
        className="flex h-9 min-w-0 flex-1 items-center justify-between gap-2 rounded border border-[#d1d5db] bg-white px-2.5 text-left text-[13px] text-[#364658] transition-colors hover:border-[#3D8BD0]"
      >
        <span className="truncate">{value ? (value.key === 'upload' ? 'Custom icon' : value.key) : 'Choose an icon'}</span>
        <ChevronDown size={14} className="flex-shrink-0 text-[#9CA3AF]" />
      </button>
      {value && (
        <button
          onClick={() => onChange(undefined)}
          title="Remove icon"
          className="flex size-9 flex-shrink-0 items-center justify-center rounded text-[#64748B] transition-colors hover:bg-[#F3F4F6] hover:text-[#364658]"
        ><X size={15} /></button>
      )}
      {anchor && <IconPopover value={value} anchor={anchor} onPick={onChange} onClose={() => setAnchor(null)} />}
    </div>
  );
}
