import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import {
  ChevronDown, Copy, ExternalLink, LayoutTemplate, MonitorSmartphone, Pencil, PenLine, Plus,
  Eye, Settings, SlidersHorizontal, Star, Trash2, X,
} from 'lucide-react';
import { toast } from 'sonner';
import { portalSlug } from '../routes';
import { CreateSupportPortalModal, EditPortalDetailsModal } from './CreateSupportPortalModal';
import { AdminSupportPortalSettings } from './AdminSupportPortalSettings';
import type { PortalDetails } from './CreateSupportPortalModal';
import { Pagination } from './Pagination';
import { SupportPortalBuilder } from './SupportPortalBuilder';
import { SupportPortalTemplateGallery } from './SupportPortalTemplateGallery';
import {
  DEFAULT_PORTAL_PAGE, SECOND_PORTAL_PAGE, PORTAL_TEMPLATES, VISIBLE_TEMPLATES, formatPortalStamp, nextPageId, relPortalStamp, uniquePageName,
} from './supportPortalData';
import type { PortalPage, PortalTemplate } from './supportPortalData';

/* One portal, as a CARD — the listing's only shape (25 Sep 2026).
 *
 * ⚠️ A tenant keeps THREE OR FOUR portals, not hundreds, so a full-width table spent its whole width
 * on one row and read as an empty page with a line in it. The card is the Patch module's card view
 * (`PatchInstallationTab`): icon badge · pill over a blue name · hairline · a two-column label/value
 * grid — so a portal is read the way an endpoint is, not as a new pattern to learn.
 *
 * ⚠️ ONE primary action per card, and it is the reason anybody opens this page: Customise portal.
 * The rest are icons beside it, in the order they are reached for — details, preview, settings, copy,
 * default — with Delete last and red. Enabled is the switch in the header because it is a STATE you
 * read at a glance, not an action you take.
 * ⚠️ Disabled controls carry their REASON: the default portal cannot be switched off or deleted
 * (requesters have to land somewhere), and a Draft cannot become the default (they would land on a
 * page nobody has published). */
function PortalCard({ p, url, href, isDefault, on, onToggle, onCustomize, onEditDetails, onPreview, onSettings, onCopy, onMakeDefault, onDelete }: {
  p: PortalPage; url: string; href: string; isDefault: boolean; on: boolean;
  onToggle: () => void; onCustomize: () => void; onEditDetails: () => void; onPreview: () => void;
  onSettings: () => void; onCopy: () => void; onMakeDefault: () => void; onDelete: () => void;
}) {
  const icon = 'flex size-8 items-center justify-center rounded border border-[#DFE5ED] bg-white text-[#64748B] transition-colors hover:border-[#C3CBD6] hover:text-[#3D8BD0] disabled:cursor-not-allowed disabled:text-[#D7DDE5] disabled:hover:border-[#DFE5ED]';
  const label = 'text-[11px] text-[#9CA3AF]';
  const value = 'truncate text-[12px] text-[#364658]';
  const published = p.status === 'Published';
  return (
    <div className="flex flex-col rounded-xl border border-[#E5E7EB] bg-white p-4 transition-all hover:border-[#3D8BD0] hover:shadow-sm">
      {/* ONE row: a small badge, the NAME, then its pills straight after it, the switch at the far end.
          ⚠️ The badge is size-7 so its centre sits on the name's line; at size-10 it was taller than the
          text beside it and the row read as two lines. The name truncates before the pills do. */}
      <div className="flex items-center gap-2">
        <span className="flex size-7 flex-shrink-0 items-center justify-center rounded-md bg-[#EAF3FB] text-[#3D8BD0]">
          <MonitorSmartphone size={15} />
        </span>
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          <button
            onClick={onCustomize}
            title={`Customise ${p.name}`}
            className="min-w-0 truncate text-left text-[13px] font-semibold text-[#3D8BD0] hover:underline"
          >{p.name}</button>
          <span className={`flex-shrink-0 rounded-sm px-1.5 py-0.5 text-[11px] font-semibold ${published ? 'bg-[#ECFDF3] text-[#22A06B]' : 'bg-[#F1F5F9] text-[#64748B]'}`}>{p.status}</span>
          {/* ⚠️ A PUBLISHED portal saved as a draft stays live — Save as draft never unpublishes (see
              `onSaveDraft`) — so it gains a second label rather than losing its first: Published says
              what requesters see, Draft says there is saved work on top that is not live yet. A portal
              that was never published is simply "Draft" in the pill before this one. */}
          {published && p.dirty && (
            <span
              title="Saved as a draft — requesters still see the published version until you publish again"
              className="flex-shrink-0 cursor-help rounded-sm bg-[#FEF6E7] px-1.5 py-0.5 text-[11px] font-semibold text-[#B54708]"
            >Draft</span>
          )}
          {isDefault && <span className="flex-shrink-0 rounded-sm bg-[#e8f4fd] px-1.5 py-0.5 text-[11px] font-semibold text-[#3D8BD0]">Default</span>}
        </div>
        <button
          role="switch"
          aria-checked={on}
          disabled={isDefault}
          title={isDefault ? 'The default portal is always on — requesters have to land somewhere' : on ? 'Enabled — switch this portal off' : 'Disabled — switch this portal on'}
          onClick={onToggle}
          className={`relative inline-flex h-[18px] w-[34px] flex-shrink-0 items-center rounded-full transition-colors ${on ? 'bg-[#3D8BD0]' : 'bg-[#CBD5E1]'} ${isDefault ? 'cursor-not-allowed opacity-60' : ''}`}
        >
          <span className={`inline-block size-[14px] rounded-full bg-white transition-transform ${on ? 'translate-x-[18px]' : 'translate-x-[2px]'}`} />
        </button>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2.5 border-t border-[#F0F2F5] pt-3">
        <div className="col-span-2 min-w-0">
          <div className={label}>URL</div>
          <a href={href} title={`Open ${p.name}`} className="block truncate text-[12px] text-[#3D8BD0] hover:underline">{url}</a>
        </div>
        {/* ⚠️ No "Live version" field (removed 25 Sep 2026, Zeni's call) — the card says what state the
            portal is in with its Published / Draft pill, and a second status line under it was noise. */}
        <div className="col-span-2 min-w-0">
          <div className={label}>Last modified</div>
          <div className={value} title={`${relPortalStamp(p.modifiedAt)} by ${p.modifiedBy}`}>{relPortalStamp(p.modifiedAt)} by {p.modifiedBy}</div>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-1.5">
        <button
          onClick={onCustomize}
          className="h-8 flex-1 rounded bg-[#e8f4fd] px-3 text-[12px] font-medium text-[#3D8BD0] transition-colors hover:bg-[#d0e8f9]"
        >Customise portal</button>
        <button onClick={onEditDetails} title="Edit details" aria-label="Edit details" className={icon}><SlidersHorizontal size={14} /></button>
        <button onClick={onPreview} title="Preview" aria-label="Preview" className={icon}><Eye size={14} /></button>
        <button onClick={onSettings} title="Settings" aria-label="Settings" className={icon}><Settings size={14} /></button>
        <button onClick={onCopy} title="Copy" aria-label="Copy" className={icon}><Copy size={14} /></button>
        {!isDefault && (
          <button
            onClick={onMakeDefault}
            /* ⚠️ Enabled on a DRAFT too: one portal is live at a time and it is the default, so making a
               portal the default IS publishing it — the star opens the same publish-and-make-default
               question the builder's Publish does. */
            title="Publish and make default — requesters land here"
            aria-label="Set as default"
            className={icon}
          ><Star size={14} /></button>
        )}
        <button
          onClick={onDelete}
          disabled={isDefault}
          title={isDefault ? 'The default portal cannot be deleted — requesters have to land somewhere' : 'Delete'}
          aria-label="Delete"
          className={`${icon} ${isDefault ? '' : 'hover:!border-[#FECACA] !text-[#DC2626]'}`}
        ><Trash2 size={14} /></button>
      </div>
    </div>
  );
}

/* Support Portal — Admin › Support Channels.
 *
 * The listing owns the pages; the builder edits one of them. A page is created the moment a route
 * out of "New page" is chosen — as a Draft — so leaving the builder never loses work and the
 * builder's saved-state indicator is telling the truth. Publish is the only thing that flips a
 * draft live. */

const CURRENT_USER = 'Aarti Shah';

const inputCls = 'h-9 w-full rounded border border-[#d1d5db] bg-white pl-9 pr-8 text-[13px] text-[#364658] placeholder:text-[#9ca3af] focus:border-[#3D8BD0] focus:outline-none focus:ring-1 focus:ring-[#3D8BD0]';

const accentFor = (page: PortalPage) => PORTAL_TEMPLATES.find((t) => t.name === page.source)?.accent;

/* ── New page dropdown ───────────────────────────────────────────────────── */

function NewPageMenu({ onScratch, onTemplate, size = 'default' }: {
  onScratch: () => void;
  onTemplate: () => void;
  size?: 'default' | 'large';
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', away);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', away); document.removeEventListener('keydown', esc); };
  }, [open]);

  const options = [
    {
      key: 'scratch',
      title: 'Create Support Portal',
      desc: 'Start with a blank page and build it block by block.',
      Icon: PenLine,
      run: onScratch,
    },
    {
      key: 'template',
      title: 'Use Template',
      desc: 'Start from a ready-made layout and change what you need.',
      Icon: LayoutTemplate,
      run: onTemplate,
    },
  ];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={`inline-flex items-center gap-1.5 rounded bg-[#3D8BD0] font-medium text-white transition-colors hover:bg-[#2d6ca0] ${
          size === 'large' ? 'h-10 px-4 text-[14px]' : 'h-9 px-3.5 text-[13px]'
        }`}
      >
        <Plus size={size === 'large' ? 17 : 15} />
        New page
        <ChevronDown size={size === 'large' ? 16 : 14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        /* Centred under a centred CTA, right-aligned under a toolbar one. */
        <div className={`absolute z-50 mt-1.5 w-[320px] overflow-hidden rounded-lg border border-[#E5E7EB] bg-white py-1 shadow-[0_4px_6px_-2px_rgba(16,24,40,0.03),0_12px_16px_-4px_rgba(16,24,40,0.08)] ${
          size === 'large' ? 'left-1/2 -translate-x-1/2' : 'right-0'
        }`}>
          {options.map((o) => (
            <button
              key={o.key}
              onClick={() => { setOpen(false); o.run(); }}
              className="group flex w-full items-start gap-3 px-3 py-2.5 text-left transition-colors hover:bg-[#F5F7FA]"
            >
              <span className="mt-px flex size-8 flex-shrink-0 items-center justify-center rounded bg-[#F1F5F9] text-[#7B8FA5] transition-colors group-hover:bg-[#EBF5FF] group-hover:text-[#3D8BD0]">
                <o.Icon size={16} />
              </span>
              <span className="min-w-0">
                <span className="block text-[13px] font-medium text-[#364658]">{o.title}</span>
                <span className="mt-0.5 block text-[12px] leading-[1.5] text-[#7B8FA5]">{o.desc}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Delete confirm ──────────────────────────────────────────────────────── */

function ConfirmDelete({ page, onCancel, onConfirm }: { page: PortalPage; onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-6">
      <div className="w-[440px] max-w-full rounded-lg bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 px-5 pb-2 pt-4">
          <h2 className="text-[16px] font-semibold text-[#364658]">Delete “{page.name}”?</h2>
          <button onClick={onCancel} className="flex size-8 flex-shrink-0 items-center justify-center rounded text-[#64748B] transition-colors hover:bg-[#F3F4F6]"><X size={18} /></button>
        </div>
        <p className="px-5 pb-5 text-[13px] leading-[1.6] text-[#64748B]">
          {page.status === 'Published'
            ? 'This page is live. Requesters who open it will get a not-found page until you publish another one in its place.'
            : 'This draft has never been published, so nothing changes for requesters.'}
        </p>
        <div className="flex justify-end gap-2 border-t border-[#e5e7eb] px-5 py-3">
          <button onClick={onCancel} className="inline-flex h-8 items-center rounded border border-[#DFE5ED] bg-white px-3.5 text-[13px] font-medium text-[#364658] transition-colors hover:bg-[#F5F7FA]">Cancel</button>
          <button onClick={onConfirm} className="inline-flex h-8 items-center rounded bg-[#DC2626] px-3.5 text-[13px] font-medium text-white transition-colors hover:bg-[#B91C1C]">Delete page</button>
        </div>
      </div>
    </div>
  );
}

/* ── Publishing a portal that is not the default ─────────────────────────────
 *
 * ⚠️ ONE portal is live at a time, and it is the default. Two published portals means two answers to
 * "where does a requester land", which is the conflict this dialog exists to prevent: publishing any
 * portal other than the default makes it the default AND moves whichever portal was live back to
 * Draft. That is a change to what every requester sees, so it is ASKED, never done quietly — and it
 * names the portal that will be taken down, because that is the part an admin would not expect. */
function ConfirmPublish({ page, live, onCancel, onConfirm }: { page: PortalPage; live: PortalPage[]; onCancel: () => void; onConfirm: () => void }) {
  const names = live.map((p) => `“${p.name}”`).join(', ');
  return (
    <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/40 p-6">
      <div className="w-[460px] max-w-full rounded-lg bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 px-5 pb-2 pt-4">
          <h2 className="text-[16px] font-semibold text-[#364658]">Publish “{page.name}” and make it the default?</h2>
          <button onClick={onCancel} className="flex size-8 flex-shrink-0 items-center justify-center rounded text-[#64748B] transition-colors hover:bg-[#F3F4F6]"><X size={18} /></button>
        </div>
        <div className="space-y-2 px-5 pb-5 text-[13px] leading-[1.6] text-[#64748B]">
          <p>Only one portal can be live at a time. “{page.name}” will become the default portal — the one requesters land on.</p>
          {live.length > 0 && (
            <p className="rounded border border-[#FDE7C2] bg-[#FFFAF0] px-3 py-2 text-[#8A4A0C]">
              {names} {live.length === 1 ? 'is' : 'are'} published now and will be moved to <span className="font-semibold">Draft</span>. Nothing in {live.length === 1 ? 'it' : 'them'} is lost — publish {live.length === 1 ? 'it' : 'one'} again any time.
            </p>
          )}
        </div>
        <div className="flex justify-end gap-2 border-t border-[#e5e7eb] px-5 py-3">
          <button onClick={onCancel} className="inline-flex h-8 items-center rounded border border-[#DFE5ED] bg-white px-3.5 text-[13px] font-medium text-[#364658] transition-colors hover:bg-[#F5F7FA]">Cancel</button>
          <button onClick={onConfirm} className="inline-flex h-8 items-center rounded bg-[#3D8BD0] px-3.5 text-[13px] font-medium text-white transition-colors hover:bg-[#2d6ca0]">Publish and make default</button>
        </div>
      </div>
    </div>
  );
}

/* ── Module ──────────────────────────────────────────────────────────────── */

type Scope = 'All' | 'Published' | 'Draft';

/* Support Portal — one destination, two things you can do there.
 *
 * ⚠️ TABS, not two nav rows. Customization decides what the portal LOOKS like; Settings decides what
 * a requester may DO on it. They are the same subject, so splitting them across the sidebar would
 * make an admin remember which of two identically-named rows holds the switch they want. */
export function AdminSupportPortalModule({ onBuilder, openPortal, onOpenPortalChange }: {
  onBuilder?: (open: boolean) => void;
  /** A portal named in the URL — opened on arrival, so a shared link lands ON that portal. */
  openPortal?: string;
  /** Reports which portal is open, so the address bar names it. */
  onOpenPortalChange?: (slug: string | undefined) => void;
}) {
  /* ⚠️ Starts with ONE page, not empty. Every tenant already has a support portal — the requester
     is landing somewhere today — so an empty state here would claim the portal does not exist and
     invite the admin to "create" the thing they are actually editing. The default page is a System
     page: it can be customised and duplicated, and the delete action refuses it (see `canDelete`),
     because a portal with no landing page is not a state the product can be in. */
  /* ⚠️ "Support Portal - 2" is WITHHELD from the listing, not deleted: `SECOND_PORTAL_PAGE` still
     exists, so putting it back is adding it to this list again. */
  const [pages, setPages] = useState<PortalPage[]>([DEFAULT_PORTAL_PAGE]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [gallery, setGallery] = useState(false);
  const [creating, setCreating] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  /* Set when the row menu asked for settings rather than the canvas — the builder opens on that
     panel instead of the widget library. Cleared as soon as it has been handed over, so returning
     to the same portal later opens where a portal normally opens. */
  const [openSettings, setOpenSettings] = useState(false);
  /* Which portals are switched on. Absent means ON — a portal you have never touched is live. */
  const [enabled, setEnabled] = useState<Record<string, boolean>>({});
  /* Which portal requesters land on. State, not the seed's id: it can be moved to any PUBLISHED portal. */
  const [defaultId, setDefaultId] = useState(DEFAULT_PORTAL_PAGE.id);
  const isOn = (p: PortalPage) => p.id === defaultId || enabled[p.id] !== false;
  /* The portal waiting on the publish-and-make-default question, while its dialog is open. */
  const [publishAsk, setPublishAsk] = useState<string | null>(null);
  /* Publishes `id` as THE live portal: it becomes the default, and every other published portal goes
     back to Draft — one portal live at a time. */
  const publishAsDefault = (id: string) => {
    setPages((prev) => prev.map((p) => (
      p.id === id ? { ...p, status: 'Published', dirty: false }
        : p.status === 'Published' ? { ...p, status: 'Draft', dirty: false } : p
    )));
    setDefaultId(id);
    setEnabled((e) => ({ ...e, [id]: true }));
  };
  /* ONE dialog for both routes to it — Publish inside the builder and Set as default on a card —
     rendered by whichever of the two screens is showing. */
  const publishDialog = () => {
    const asking = publishAsk ? pages.find((p) => p.id === publishAsk) : null;
    if (!asking) return null;
    const others = pages.filter((p) => p.id !== asking.id && p.status === 'Published');
    return (
      <ConfirmPublish
        page={asking}
        live={others}
        onCancel={() => setPublishAsk(null)}
        onConfirm={() => {
          publishAsDefault(asking.id);
          setPublishAsk(null);
          setEditingId(null);
          toast.success(others.length
            ? `“${asking.name}” is live and now the default — ${others.map((p) => `“${p.name}”`).join(', ')} moved to Draft`
            : `“${asking.name}” is live and now the default portal`);
        }}
      />
    );
  };
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const editing = pages.find((p) => p.id === editingId) ?? null;

  // The admin shell collapses its sidebar while the canvas is open.
  useEffect(() => { onBuilder?.(!!editing); }, [editing, onBuilder]);

  /* ⚠️ Matched on the SLUG first and the id second. The slug is what a shared link carries because
     it is readable, but a portal that has since been renamed would strand every link built from its
     old name — so the id keeps working as a fallback that can never change. */
  const findPortal = useCallback(
    (key: string) => pages.find((p) => portalSlug(p.name, p.id) === key || p.id.toLowerCase() === key.toLowerCase()),
    [pages],
  );

  /* The URL opens a portal — but only when the URL CHANGES.
     ⚠️ The obvious guard, "open it unless it is already open", is what made the back arrow dead:
     closing sets `editingId` to null, this effect then sees a URL still naming the portal and an
     editingId that no longer matches, and re-opens it on the very next render. Consuming each slug
     once means the URL drives state on ARRIVAL, and state drives the URL from then on — one
     direction each, which is the only arrangement where the two cannot fight. */
  const consumed = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (openPortal === consumed.current) return;
    consumed.current = openPortal;
    if (!openPortal) { setEditingId(null); return; }
    const hit = findPortal(openPortal);
    if (hit) setEditingId(hit.id);
  }, [openPortal, findPortal]);

  /* …and the open portal names the URL. One direction each, so they cannot fight. */
  useEffect(() => {
    const open = pages.find((p) => p.id === editingId);
    onOpenPortalChange?.(open ? portalSlug(open.name, open.id) : undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingId, pages]);

  const create = (name: string, source: string, extra: Partial<PortalPage> = {}) => {
    const now = formatPortalStamp(new Date());
    const created: PortalPage = {
      id: nextPageId(pages),
      name: uniquePageName(pages, name),
      type: 'Custom',
      status: 'Draft',
      source,
      audience: 'All requesters',
      modifiedAt: now,
      modifiedBy: CURRENT_USER,
      ...extra,
    };
    setPages((prev) => [created, ...prev]);
    return created;
  };

  /* Step 1 → the portal exists. It is NOT opened yet: step 2 is still on screen asking what goes
     on it, and swapping the canvas in underneath that question would answer it for them. */
  const [draftId, setDraftId] = useState<string | null>(null);
  /* ⚠️ The FIRST save creates the draft; every later one EDITS it. Step 1 stays reachable from step
     2 — the details are editable until you leave — and this used to call `create` every time, so
     going back to fix a typo and pressing Save left TWO portals in the listing: one carrying the
     typo and one carrying the correction, with nothing on screen saying a second had appeared.
     The button relabels to "Save changes" once the draft exists, so it never reads as one thing and
     does another. */
  const saveDetails = (dt: PortalDetails) => {
    if (draftId) {
      setPages((prev) => prev.map((p) => (p.id === draftId
        ? { ...p, name: dt.name, company: dt.company, url: dt.url, idp: dt.idp, ssoOnly: dt.ssoOnly }
        : p)));
      toast.success('Details updated');
      return;
    }
    const created = create(dt.name, 'Blank layout', {
      company: dt.company, url: dt.url, idp: dt.idp, ssoOnly: dt.ssoOnly,
    });
    setDraftId(created.id);
    toast.success(`${created.name} created — choose how to start it`);
  };

  /** Step 2 → what the new portal starts with, then open it. */
  const startWith = (start: 'blank' | 'template', source: string) => {
    if (!draftId) return;
    setPages((prev) => prev.map((p) => (p.id === draftId ? { ...p, start, source } : p)));
    setCreating(false);
    setEditingId(draftId);
    setDraftId(null);
  };

  const patch = (id: string, changes: Partial<PortalPage>) =>
    setPages((prev) => prev.map((p) => (p.id === id
      ? { ...p, ...changes, modifiedAt: formatPortalStamp(new Date()), modifiedBy: CURRENT_USER }
      : p)));

  /* ⚠️ The DEFAULT template is `null`, and it is the only one that produces a non-blank page today:
     it IS the standard portal, which is what the builder renders when `start` is not 'blank'. The
     seven designed templates still record their own name in `source`, so the listing can say where
     a page came from even while they share one starting layout. */
  const startBlank = () => startWith('blank', 'Blank layout');
  const useTemplate = (t: PortalTemplate | null) => startWith('template', t ? t.name : 'Default portal');

  /* ── Template PREVIEW ──
     ⚠️ The preview IS the builder, opened in its full-page preview. "Use template" then only flips that
     same instance out of preview — no remount, no second render of a different page — so the page you
     looked at is exactly the page you start editing. Back unmounts it and the popup comes back on
     step 2 with the category you had, because the draft portal still exists. */
  const [previewing, setPreviewing] = useState(false);
  /* The gallery’s industry filter, held here so Back from a template preview lands on the same one. */
  const [templateIndustry, setTemplateIndustry] = useState<string[]>([]);
  const previewTemplate = (t: PortalTemplate | null) => {
    if (!draftId) return;
    setPages((prev) => prev.map((p) => (p.id === draftId ? { ...p, start: 'template', source: t ? t.name : 'Default portal' } : p)));
    setPreviewing(true);
    setEditingId(draftId);
  };
  const backToTemplates = () => { setEditingId(null); setPreviewing(false); };
  const useFromPreview = () => { setPreviewing(false); setCreating(false); setDraftId(null); };

  const duplicate = (src: PortalPage) => {
    const now = formatPortalStamp(new Date());
    const copy: PortalPage = {
      ...src,
      id: nextPageId(pages),
      /* ⚠️ Seeded as close to the original as the uniqueness rule allows — the admin asked for the
         same details, and the popup that opens next is where a different name is chosen. */
      name: uniquePageName(pages, src.name),
      // A copy is never live until it is published on its own merit.
      status: 'Draft',
      modifiedAt: now,
      modifiedBy: CURRENT_USER,
    };
    setPages((prev) => [copy, ...prev]);
    return copy;
  };

  /* Which portal's details are being asked for. `null` while nothing is open. */
  const [detailsId, setDetailsId] = useState<string | null>(null);
  /** Which portal's settings drawer is open. */
  const [settingsId, setSettingsId] = useState<string | null>(null);
  /* ⚠️ SEPARATE from `settingsId`, not a sentinel value in it. A row's settings are about one
     portal and name it in the subtitle; these are about the support-portal channel as a whole. A
     magic id would make every reader of `settingsId` have to know which strings are not ids. */

  /* Copy → the whole portal, then immediately ask for the details that cannot be shared.
   *
   * ⚠️ The copy inherits EVERYTHING, address included, and two portals cannot answer on one URL.
   * Rather than minting a quiet conflict and waiting for somebody to trip over it, the copy opens
   * its own details straight away — the one moment the admin already knows a change is needed. */
  const copyPortal = (src: PortalPage) => {
    const copy = duplicate(src);
    setDetailsId(copy.id);
    toast.success(`“${src.name}” copied — give the copy its own name and address`);
  };

  // ── builder ───────────────────────────────────────────────────────────────
  if (editing) {
    /* ⚠️ KEYED BY PAGE ID, so opening a different portal REMOUNTS the builder.
       Every layout decision in there is a `useState` initialiser — the seed, the band order, the
       row order, the hero config — because, as its own note says, "a seed is a fact about how this
       session STARTED". React reuses a component in the same tree position when only its props
       change, so switching portals swapped the page prop while every one of those initialisers
       kept the PREVIOUS portal’s answer: opening Spotlight and then going back to the default
       painted the default portal in Spotlight’s layout. The key is what makes "started" mean
       "started on THIS portal".
       ⚠️ A JS comment ABOVE the return, not a JSX one inside it: `return (` takes ONE expression,
       and a JSX comment placed before the element is a second one.
       ⚠️ And it cannot describe that JSX comment by writing one — the closing marker inside a block
       comment ENDS the block there, and everything after it becomes code. */
    return (
      <>
      {publishDialog()}
      <SupportPortalBuilder
          key={editing.id}
          templatePreview={previewing ? { name: editing.source ?? '', onBack: backToTemplates, onUse: useFromPreview } : undefined}
          openOn={openSettings ? 'settings' : undefined}
          onOpenConsumed={() => setOpenSettings(false)}
        page={editing}
        accent={accentFor(editing)}
        onRename={(name) => patch(editing.id, { name: uniquePageName(pages.filter((p) => p.id !== editing.id), name) })}
        onPublish={() => {
          /* ⚠️ Publishing a portal that is NOT the default asks first — see `ConfirmPublish`. */
          if (editing.id !== defaultId) { setPublishAsk(editing.id); return; }
          /* ⚠️ `dirty` is cleared here. It is the listing's "Unpublished changes" chip, and a page
             that has just gone live has none by definition — leaving it set would have the row
             warning about work that is already published. */
          patch(editing.id, { status: 'Published', dirty: false });
          setEditingId(null);
          toast.success(`“${editing.name}” is live on the support portal`);
        }}
        /* ── Save as draft ────────────────────────────────────────────────────────────────────
           ⚠️ It does NOT unpublish a live portal. Saving your work and taking the portal away from
           every requester using it are two entirely different acts, and one of them is not
           something a Save button may do quietly. So a published page KEEPS its status and gains
           the `dirty` flag — which is exactly what the listing's amber "Unpublished changes" chip
           was built to report — while a page that has never been published stays a Draft.
           ⚠️ It also does not leave the builder, unlike Publish. Publishing is the end of a piece
           of work; saving a draft is a pause in the middle of one, and closing the page you are
           still working on would be the wrong answer to "keep this for later". */
        onSaveDraft={() => {
          patch(editing.id, editing.status === 'Published' ? { dirty: true } : { status: 'Draft', dirty: false });
          toast.success(
            editing.status === 'Published'
              ? `Saved. “${editing.name}” keeps showing the published version until you publish again`
              : `“${editing.name}” saved as a draft`,
          );
        }}
        onExit={() => setEditingId(null)}
      />
      </>
    );
  }


  /* ⚠️ A portal is a PATH on the tenant's domain, not a domain of its own. The first pass built
     'support.<slug>.com', which reads like every portal owns a hostname somebody would have to
     register. The default page is the site root; everything else hangs off it. */
  const portalUrl = (p: PortalPage) => {
    /* ⚠️ The ADDRESS the admin typed wins. Deriving it from the name is only a suggestion for a
       portal nobody has addressed yet — once Edit details has been saved, a listing that keeps
       showing a name-derived path is telling them the field they filled in did nothing. */
    if (p.url) return p.url;
    if (p.id === defaultId) return 'support.acme.com';
    const slug = p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    return 'support.acme.com/' + (slug || p.id.toLowerCase());
  };

  const overlays = (
    <>
      {publishDialog()}
      {creating && (
        <CreateSupportPortalModal
          /* ⚠️ Nothing to reset here. The gallery's filter is the MODAL's own state and the modal
             unmounts on close, so the three `setTemplateCategory('All')` calls that used to sit on
             these three paths were left pointing at a state this module no longer holds — a
             ReferenceError that esbuild cannot see and that fired the moment anyone closed the
             dialog or started a page from scratch. */
          onClose={() => { setCreating(false); setDraftId(null); }}
          onSaveDetails={saveDetails}
          onScratch={startBlank}
          onTemplate={useTemplate}
          onPreview={previewTemplate}
          initialStep={draftId ? 2 : 1}
          industry={templateIndustry}
          onIndustry={setTemplateIndustry}
        />
      )}
      {gallery && (
        <SupportPortalTemplateGallery
          onClose={() => setGallery(false)}
          onUse={useTemplate}
          onStartBlank={startBlank}
        />
      )}
      {/* ── the settings drawer ──
          ⚠️ A SIDE DRAWER, not a route and not a modal. These settings belong to the portal in the
          row you pressed, so leaving the listing to read them would lose the one piece of context
          that says which portal they are about — and a centred modal over a table reads as "confirm
          something", which nine accordions of permissions are not.
          ⚠️ `compact`, the variant `AdminSupportPortalSettings` already had for the builder's 340px
          rail. Only the CHROME differs — the settings themselves are the same rows in the same
          order, because they are the same settings. */}
      {settingsId && (() => {
        /* One caller now. It was shared with a Global Setting gear beside the page's CTA, which is
           why the title and subtitle used to be conditional; with the gear gone this drawer is
           always about one portal, and saying so unconditionally is the honest shape. */
        const target = pages.find((s) => s.id === settingsId);
        if (!target) return null;
        const close = () => setSettingsId(null);
        return createPortal(
          <div className="fixed inset-0 z-[10000] flex justify-end bg-[#0F172A]/40" onMouseDown={close}>
            <div
              className="flex h-full w-[560px] max-w-[92vw] flex-col bg-white shadow-[0_0_40px_rgba(16,24,40,0.18)]"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div className="flex flex-shrink-0 items-start gap-3 border-b border-[#E5E7EB] px-5 py-3.5">
                <div className="min-w-0 flex-1">
                  <h2 className="text-[15px] font-semibold text-[#364658]">Settings</h2>
                  {/* ⚠️ The portal's NAME under the title. A drawer opened from one row among
                      several has to say which row, or every portal's settings look identical. */}
                  <p className="mt-0.5 truncate text-[12px] text-[#7B8FA5]">{target.name}</p>
                </div>
                <button
                  onClick={close}
                  className="flex size-8 items-center justify-center rounded transition-colors hover:bg-[#F3F4F6]"
                ><X size={16} /></button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto">
                <AdminSupportPortalSettings compact />
              </div>
            </div>
          </div>,
          document.body,
        );
      })()}

      {detailsId && (() => {
        const target = pages.find((p) => p.id === detailsId);
        if (!target) return null;
        return (
          <EditPortalDetailsModal
            title={`Edit details — ${target.name}`}
            initial={{
              name: target.name,
              company: target.company ?? '',
              url: target.url ?? portalUrl(target),
              idp: target.idp ?? 'None — use ServiceOps login',
              ssoOnly: target.ssoOnly ?? false,
            }}
            onClose={() => setDetailsId(null)}
            onSave={(d) => {
              patch(target.id, {
                name: uniquePageName(pages.filter((p) => p.id !== target.id), d.name),
                company: d.company, url: d.url, idp: d.idp, ssoOnly: d.ssoOnly,
              });
              setDetailsId(null);
              toast.success(`“${d.name}” details saved`);
            }}
          />
        );
      })()}
      {confirmId && (() => {
        const target = pages.find((p) => p.id === confirmId);
        if (!target) return null;
        return (
          <ConfirmDelete
            page={target}
            onCancel={() => setConfirmId(null)}
            onConfirm={() => {
              setPages((prev) => prev.filter((p) => p.id !== target.id));
              setConfirmId(null);
              toast.success(`“${target.name}” deleted`);
            }}
          />
        );
      })()}
    </>
  );

  const head = (
    <div className="mb-4 flex items-start gap-4">
      <div className="min-w-0 flex-1">
      {/* ⚠️ "Support Portal", not "Support Portal Customization". The name is a leftover from when
          this page had two tabs and Customization was one of them; the tab strip went when the page
          became ONE destination showing the portals you have, so the head was still naming a mode
          the page no longer has. It also disagreed with every other name for this screen — the
          sidebar row, the Overview card and the route all say Support Portal. */}
      <h1 className="text-[20px] font-semibold text-[#364658]">Support Portal</h1>
      <p className="mt-1 text-[13px] leading-[1.6] text-[#7B8FA5]">
        Customize the layout and experience of your Support Portal.{' '}
        <button
          onClick={() => toast.success('Opening the Support Portal documentation')}
          className="inline-flex items-center gap-1 text-[13px] font-medium text-[#3D8BD0] hover:underline"
        >View Docs <ExternalLink size={12} /></button>
      </p>
      </div>
      {/* ⚠️ Aligned to the TITLE's line, not centred against the two-line block. Centred it floated
          between the heading and the sentence under it, belonging to neither. */}
      {/* ⚠️ The Global Setting gear was REMOVED from beside this CTA. Every setting it opened is
          the same list the Settings TAB on this page already holds, and a portal's own settings are
          on its row — so the gear was a third door onto one of two rooms, unlabelled, sitting
          against the page's primary action where an unlabelled glyph reads as a modifier of the
          button beside it rather than a place of its own. */}
      <div className="flex flex-shrink-0 items-center pt-0.5">
        <button
          onClick={() => setCreating(true)}
          className="inline-flex h-9 items-center gap-1.5 rounded bg-[#3D8BD0] px-3.5 text-[13px] font-medium text-white transition-colors hover:bg-[#2d6ca0]"
        ><Plus size={15} /> Create support portal</button>
      </div>
    </div>
  );

  /* ⚠️ No tab strip. Support Portal is ONE destination showing ONE thing — the portals you have —
     and a portal's own settings live inside it, on the builder's rail beside Theme and Branding.
     The two used to sit as sibling tabs, which put a list of portals and one portal's behaviour on
     the same nav row at two different scopes. */
  const shell = (body: ReactNode) => (
    <>
      <div className="px-4 pt-6">{head}</div>
      {body}
    </>
  );

  // ── empty state ── no page has been built yet, so there is nothing to search or filter.
  if (pages.length === 0) {
    return (
      <>
        {shell(
        <div className="px-4 py-6">
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[#D9E0EA] bg-[#FCFDFE] px-6 py-20 text-center">
            <span className="flex size-16 items-center justify-center rounded-full bg-[#EBF5FF] text-[#3D8BD0]">
              <MonitorSmartphone size={30} strokeWidth={1.6} />
            </span>
            <h2 className="mt-4 text-[16px] font-semibold text-[#364658]">No portal pages yet</h2>
            <p className="mt-1.5 max-w-[440px] text-[13px] leading-[1.6] text-[#7B8FA5]">
              Requesters currently see the default ServiceOps portal. Build a page to change what
              they land on — start blank, or pick a template and edit it.
            </p>
            <div className="mt-5">
              <button
                onClick={() => setCreating(true)}
                className="inline-flex h-9 items-center gap-1.5 rounded bg-[#3D8BD0] px-3.5 text-[13px] font-medium text-white transition-colors hover:bg-[#2d6ca0]"
              ><Plus size={15} /> Create support portal</button>
            </div>
            <button
              onClick={() => setGallery(true)}
              className="mt-3 text-[13px] font-medium text-[#3D8BD0] hover:underline"
            >Browse {VISIBLE_TEMPLATES().length} templates</button>
          </div>
        </div>)}
        {overlays}
      </>
    );
  }

  // ── listing ── cards, three to a row at most; a tenant keeps a handful of portals.
  /* The default comes first — it is the one requesters land on, so it is the one read first. */
  const rows = [...pages].sort((a, b) => Number(b.id === defaultId) - Number(a.id === defaultId));

  return (
    <>
      {shell(
      <div className="px-4 pb-6 pt-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((p) => (
            <PortalCard
              key={p.id}
              p={p}
              url={portalUrl(p)}
              href={`#/admin/support-portal/${portalSlug(p.name, p.id)}`}
              isDefault={p.id === defaultId}
              on={isOn(p)}
              onToggle={() => setEnabled((e) => ({ ...e, [p.id]: !isOn(p) }))}
              onCustomize={() => setEditingId(p.id)}
              onEditDetails={() => setDetailsId(p.id)}
              onPreview={() => toast.success(`Opening ${p.name} in preview`)}
              onSettings={() => setSettingsId(p.id)}
              onCopy={() => copyPortal(p)}
              onMakeDefault={() => setPublishAsk(p.id)}
              onDelete={() => setConfirmId(p.id)}
            />
          ))}
        </div>
      </div>)}
      {overlays}
    </>
  );
}
