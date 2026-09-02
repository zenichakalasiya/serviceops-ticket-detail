import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import {
  ChevronDown, Copy, ExternalLink, LayoutTemplate, MonitorSmartphone, Pencil, PenLine, Plus,
  Eye, Settings, SlidersHorizontal, Trash2, X,
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
  DEFAULT_PORTAL_PAGE, SECOND_PORTAL_PAGE, PORTAL_TEMPLATES, formatPortalStamp, nextPageId, relPortalStamp, uniquePageName,
} from './supportPortalData';
import type { PortalPage, PortalTemplate } from './supportPortalData';

/* One row's actions, as an icon rail — the same Action column every other listing in this product
   uses (see `SoftwareLicensesTable`).
 *
 * ⚠️ Edit is TWO things, so it is one icon with a menu rather than two icons. "Edit details" changes
 * what the portal IS — its name, its address, how people sign in — and "Customise portal" changes
 * what is ON it. They are both editing, they are never done at the same moment, and no pair of
 * glyphs tells those apart; a chevron on the pencil says there is a choice without spending a
 * second slot in the rail on it.
 *
 * ⚠️ Three kebab items did NOT survive the move, deliberately: Portal settings and Reset layout are
 * both reachable inside the builder (the rail's Settings item, and the theme panel's reset), and
 * Copy link duplicates the URL column, which is already a working link to the same place. An icon
 * for each would have been three glyphs standing for phrases no glyph says. */
function RowActions({ isDefault, onEditDetails, onCustomize, onPreview, onSettings, onCopy, onDelete }: {
  isDefault: boolean;
  onEditDetails: () => void; onCustomize: () => void;
  onPreview: () => void; onSettings: () => void; onCopy: () => void; onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  /* ⚠️ PORTALLED to the body with fixed positioning. The table sits in an `overflow-x-auto`
     wrapper, so an absolutely-positioned menu inside it is clipped to the row — the first
     build showed a 6px sliver of white under the button and nothing else. Measured on open and
     re-measured on scroll/resize so it stays with its trigger. */
  const [at, setAt] = useState<{ top: number; left: number } | null>(null);
  const place = () => {
    const r = btnRef.current?.getBoundingClientRect();
    if (!r) return;
    const W = 184;
    setAt({ top: r.bottom + 4, left: Math.max(8, Math.min(r.left, window.innerWidth - W - 8)) });
  };
  useEffect(() => {
    if (!open) return;
    place();
    const away = (e: MouseEvent) => {
      if (ref.current?.contains(e.target as Node) || btnRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', away);
    document.addEventListener('keydown', key);
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    return () => {
      document.removeEventListener('mousedown', away);
      document.removeEventListener('keydown', key);
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
    };
  }, [open]);

  const item = 'flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-[#364658] transition-colors hover:bg-[#F5F7FA]';
  const run = (fn: () => void) => () => { setOpen(false); fn(); };
  const icon = 'text-[#6B7280] transition-colors hover:text-[#3D8BD0]';

  return (
    /* gap-4, not the gap-3 the two-icon listings use: four targets in a row need more air between
       them than two do, and the chevron on Edit already sits tight against its pencil. */
    <div className="flex items-center gap-4">
      <button
        ref={btnRef}
        onClick={() => setOpen((o) => !o)}
        title="Edit"
        className={`flex items-center gap-0.5 ${icon} ${open ? 'text-[#3D8BD0]' : ''}`}
      ><Pencil size={15} /><ChevronDown size={11} /></button>
      <button onClick={onPreview} title="Preview" className={icon}><Eye size={15} /></button>
      {/* ⚠️ PER PORTAL, which is the whole reason it belongs on a row rather than anywhere else.
          Settings used to sit on the builder's rail below Branding, and the rail is where you go
          while ARRANGING a page — a nine-accordion permissions screen is not something you reach
          for mid-layout. But what a requester may DO is a property of ONE portal, so a row is
          exactly where it can say which portal it is about. */}
      <button onClick={onSettings} title="Settings" className={icon}><Settings size={15} /></button>
      {/* ⚠️ "Copy", not "Duplicate layout" — it copies the whole portal, details included, and then
          asks for the details that cannot be shared (see the handler). */}
      <button onClick={onCopy} title="Copy" className={icon}><Copy size={15} /></button>
      <button
        onClick={onDelete}
        disabled={isDefault}
        title={isDefault ? 'The default portal cannot be deleted — requesters have to land somewhere' : 'Delete'}
        className={isDefault ? 'cursor-not-allowed text-[#D7DDE5]' : 'text-[#DC2626] transition-colors hover:text-[#b91c1c]'}
      ><Trash2 size={15} /></button>

      {open && at && createPortal(
        <div
          ref={ref}
          style={{ position: 'fixed', top: at.top, left: at.left }}
          className="z-[10000] w-[184px] overflow-hidden rounded-md border border-[#E5E7EB] bg-white py-1 shadow-lg"
        >
          <button onClick={run(onEditDetails)} className={item}><SlidersHorizontal size={14} /> Edit details</button>
          <button onClick={run(onCustomize)} className={item}><PenLine size={14} /> Customise portal</button>
        </div>,
        document.body,
      )}
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
  const [pages, setPages] = useState<PortalPage[]>([DEFAULT_PORTAL_PAGE, SECOND_PORTAL_PAGE]);
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
  const isOn = (p: PortalPage) => p.id === DEFAULT_PORTAL_PAGE.id || enabled[p.id] !== false;
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
    return (
      <SupportPortalBuilder
          openOn={openSettings ? 'settings' : undefined}
          onOpenConsumed={() => setOpenSettings(false)}
        page={editing}
        accent={accentFor(editing)}
        onRename={(name) => patch(editing.id, { name: uniquePageName(pages.filter((p) => p.id !== editing.id), name) })}
        onPublish={() => {
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
    if (p.id === DEFAULT_PORTAL_PAGE.id) return 'support.acme.com';
    const slug = p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    return 'support.acme.com/' + (slug || p.id.toLowerCase());
  };

  const overlays = (
    <>
      {creating && (
        <CreateSupportPortalModal
          onClose={() => { setCreating(false); setDraftId(null); }}
          onSaveDetails={saveDetails}
          onScratch={startBlank}
          onTemplate={useTemplate}
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
        Design the pages your requesters land on — build one from scratch or start from a template.{' '}
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
            >Browse {PORTAL_TEMPLATES.length} templates</button>
          </div>
        </div>)}
        {overlays}
      </>
    );
  }

  // ── listing ───────────────────────────────────────────────────────────────
  const rows = pages;
  const totalPages = Math.ceil(rows.length / perPage) || 1;
  const pageRows = rows.slice((page - 1) * perPage, page * perPage);



  return (
    <>
      {shell(
      <div className="px-4 pb-6">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px]">
            <thead className="border-b border-[#e5e7eb]">
              <tr>
                {['Portal name', 'URL', 'Status', 'Enabled', 'Action'].map((h, i) => (
                  <th key={h || i} className="whitespace-nowrap px-4 py-2.5 text-left text-[12px] font-semibold tracking-wider text-[#364658]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e7eb] bg-white">
              {pageRows.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-[13px] text-[#9CA3AF]">
                  No portals yet.
                </td></tr>
              ) : pageRows.map((p) => (
                <tr key={p.id} className="transition-colors hover:bg-[#f9fafb]">
                  {/* The NAME is the way in. The SPP-# pill was a handle nobody refers to a portal by. */}
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setEditingId(p.id)}
                      className="inline-flex max-w-full items-center gap-2 text-left text-[13px] font-medium text-[#3D8BD0] hover:underline"
                      title={p.name}
                    >
                      <span className="truncate">{p.name}</span>
                      {p.id === DEFAULT_PORTAL_PAGE.id && (
                        <span className="shrink-0 rounded bg-[#E8F1FB] px-1.5 py-0.5 text-[11px] font-medium text-[#3D8BD0]">Default</span>
                      )}
                    </button>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <a
                      href={`#/admin/support-portal/${portalSlug(p.name, p.id)}`}
                      title={`Open ${p.name}`}
                      className="text-[13px] text-[#7B8FA5] hover:text-[#3D8BD0] hover:underline"
                    >{portalUrl(p)}</a>
                  </td>
                  {/* ⚠️ Status is a SENTENCE, not a word: the pill says what state the portal is in,
                      the line under it says who left it that way and when, and the amber chip warns
                      that what is live is not what is saved. Split across three columns those stop
                      being one story and the admin has to reassemble it. */}
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-sm px-2 py-0.5 text-[12px] font-medium ${
                        p.status === 'Published' ? 'bg-[#ECFDF3] text-[#22A06B]' : 'bg-[#F1F5F9] text-[#64748B]'
                      }`}>{p.status}</span>
                      <span className="whitespace-nowrap text-[12px] text-[#7B8FA5]">{relPortalStamp(p.modifiedAt)} by {p.modifiedBy}</span>
                      {p.status === 'Published' && p.dirty && (
                        <span className="whitespace-nowrap rounded-sm bg-[#FEF6E7] px-2 py-0.5 text-[12px] font-medium text-[#B54708]">Unpublished changes</span>
                      )}
                    </div>
                  </td>
                  {/* ⚠️ The DEFAULT portal cannot be switched off — a requester has to land somewhere.
                      Disabled with the reason on it rather than hidden, so the rule is legible. */}
                  <td className="px-4 py-3">
                    <button
                      role="switch"
                      aria-checked={isOn(p)}
                      disabled={p.id === DEFAULT_PORTAL_PAGE.id}
                      title={p.id === DEFAULT_PORTAL_PAGE.id
                        ? 'The default portal is always on — requesters have to land somewhere'
                        : isOn(p) ? 'Switch this portal off' : 'Switch this portal on'}
                      onClick={() => setEnabled((e) => ({ ...e, [p.id]: !isOn(p) }))}
                      className={`relative inline-flex h-[18px] w-[34px] items-center rounded-full transition-colors ${
                        isOn(p) ? 'bg-[#3D8BD0]' : 'bg-[#CBD5E1]'
                      } ${p.id === DEFAULT_PORTAL_PAGE.id ? 'cursor-not-allowed opacity-60' : ''}`}
                    >
                      <span className={`inline-block size-[14px] rounded-full bg-white transition-transform ${
                        isOn(p) ? 'translate-x-[18px]' : 'translate-x-[2px]'
                      }`} />
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <RowActions
                      isDefault={p.id === DEFAULT_PORTAL_PAGE.id}
                      onEditDetails={() => setDetailsId(p.id)}
                      onCustomize={() => setEditingId(p.id)}
                      onPreview={() => toast.success(`Opening ${p.name} in preview`)}
                      onSettings={() => setSettingsId(p.id)}
                      onCopy={() => copyPortal(p)}
                      onDelete={() => setConfirmId(p.id)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={page}
          totalPages={totalPages}
          itemsPerPage={perPage}
          totalItems={rows.length}
          onPageChange={setPage}
          onItemsPerPageChange={(n) => { setPerPage(n); setPage(1); }}
        />
      </div>)}
      {overlays}
    </>
  );
}
