/* Filter catalogues for the two Package-module listings — Package Deployments and Registry
   Deployments. One file because they are siblings in the same module and share a vocabulary
   (the run lifecycle, the deployment window, who set it up).

   Each feeds its listing's filter builder, Manage-columns list, the grid's own dropdowns and
   the quick filters, so every surface reads ONE list.

   ⚠️ There is no product screenshot for these two. The attribute sets MIRROR the Patch
   Deployment list the product did give us — the three run lists are the same kind of record —
   with each module's own fields swapped in (a registry run has a Configuration Type and an
   installation count, no policy). Replace with the product's own list when one turns up. */
import {
  AlignLeft, CalendarDays, CircleDot, FileText, Hash, Layers, Monitor, Timer, User,
} from 'lucide-react';
import { IconStatusCheck } from './SidebarIcons';
import { DEPLOY_EXPIRING_OPTIONS, DEPLOY_STATUS_OPTIONS, DEPLOY_WINDOW_OPTIONS } from './patchFilterAttrs';
import type { Attr, QuickFilterDef } from './TicketFilterBar';

const o = (labels: string[]) => labels.map((label) => ({ label }));

/* Both modules run the same lifecycle as a patch deployment, so they reuse its ladder and
   its window bands rather than declaring a third and fourth copy. */
export { DEPLOY_STATUS_OPTIONS, DEPLOY_WINDOW_OPTIONS };

const LAPSED_OPTIONS = [
  { label: 'Yes', color: '#DC2626' },
  { label: 'No', color: '#94A3B8' },
];

/* ── Package Deployments ───────────────────────────────────────────────────── */

/* The product names this the same thing on both lists — a run either installs the package or
   removes it — so the two modules share the key `x_configType` and one vocabulary rather than
   calling it "Task Type" here and "Configuration Type" next door. */
export const PACKAGE_CONFIG_TYPE_OPTIONS = o(['Install', 'Uninstall']);

/* The product's own eleven, in its own order. */
export const PACKAGE_DEPLOY_FILTER_ATTRS: Attr[] = [
  { key: 'id', label: 'ID', icon: Hash, type: 'text' },
  { key: 'subject', label: 'Name', icon: AlignLeft, type: 'text' },
  { key: 'x_createdBy', label: 'Created By', icon: User, type: 'text' },
  { key: 'x_updatedBy', label: 'Last Updated By', icon: User, type: 'text' },
  { key: 'status', label: 'Status', icon: CircleDot, type: 'select', options: DEPLOY_STATUS_OPTIONS },
  { key: 'x_policy', label: 'Deployment Policy', icon: FileText, type: 'text' },
  { key: 'x_configType', label: 'Configuration Type', icon: Layers, type: 'select', options: PACKAGE_CONFIG_TYPE_OPTIONS },
  { key: 'x_createdDate', label: 'Created Date', icon: CalendarDays, type: 'date' },
  { key: 'x_lastUpdatedDate', label: 'Last Updated Date', icon: CalendarDays, type: 'date' },
  { key: 'x_installAfter', label: 'Install After', icon: CalendarDays, type: 'date' },
  { key: 'x_expiry', label: 'Expiry Date', icon: Timer, type: 'date' },

  /* Derived — they back the KPI cards, the dashboard and the saved views, but are not part
     of the product's attribute list, so `hidden` keeps them out of the picker. */
  { key: 'x_packageCount', label: 'Package Count', icon: Layers, type: 'text', hidden: true },
  { key: 'x_endpointCount', label: 'Endpoint Count', icon: Monitor, type: 'text', hidden: true },
  { key: 'x_window', label: 'Deployment Window', icon: Timer, type: 'select', hidden: true, options: DEPLOY_WINDOW_OPTIONS },
  { key: 'x_lapsed', label: 'Missed its window', icon: Timer, type: 'select', hidden: true, options: LAPSED_OPTIONS },
  { key: 'x_expiring', label: 'Expiring in 48h', icon: Timer, type: 'select', hidden: true, options: DEPLOY_EXPIRING_OPTIONS },
];

export const PACKAGE_DEPLOY_QUICK_FILTERS: QuickFilterDef[] = [
  { field: 'status', icon: IconStatusCheck, tip: 'Filter by status', title: 'Status is', width: 210, row: 'dot', options: DEPLOY_STATUS_OPTIONS },
];

/* ── Registry Deployments ──────────────────────────────────────────────────── */

/** The product's own name for it — a registry run either applies a key or removes it. */
export const REGISTRY_CONFIG_TYPE_OPTIONS = o(['Install', 'Uninstall']);

/* The product's own nine, in its own order. Note it offers FEWER attributes than the package
   list — no Deployment Policy (a registry run has none) and, unlike the grid the module used
   to ship, no Configuration Type or Total Installations either. */
export const REGISTRY_DEPLOY_FILTER_ATTRS: Attr[] = [
  { key: 'id', label: 'ID', icon: Hash, type: 'text' },
  { key: 'subject', label: 'Name', icon: AlignLeft, type: 'text' },
  { key: 'x_createdBy', label: 'Created By', icon: User, type: 'text' },
  { key: 'x_updatedBy', label: 'Last Updated By', icon: User, type: 'text' },
  { key: 'status', label: 'Status', icon: CircleDot, type: 'select', options: DEPLOY_STATUS_OPTIONS },
  { key: 'x_createdDate', label: 'Created Date', icon: CalendarDays, type: 'date' },
  { key: 'x_lastUpdatedDate', label: 'Last Updated Date', icon: CalendarDays, type: 'date' },
  { key: 'x_installAfter', label: 'Install After', icon: CalendarDays, type: 'date' },
  { key: 'x_expiry', label: 'Expiry Date', icon: Timer, type: 'date' },

  /* ⚠️ These two ARE real fields on the record and still drive the page — `x_configType` the
     dashboard's Configuration-type stack, `x_installations` the "Endpoints configured" KPI
     and the Widest-rollouts chart — but the product does not list them as filter attributes,
     so `hidden` keeps them out of the picker AND Manage columns. Drop the flag if they should
     be addable as columns again. */
  { key: 'x_configType', label: 'Configuration Type', icon: Layers, type: 'select', hidden: true, options: REGISTRY_CONFIG_TYPE_OPTIONS },
  { key: 'x_installations', label: 'Total Installations', icon: Monitor, type: 'text', hidden: true },
  { key: 'x_window', label: 'Deployment Window', icon: Timer, type: 'select', hidden: true, options: DEPLOY_WINDOW_OPTIONS },
  { key: 'x_lapsed', label: 'Missed its window', icon: Timer, type: 'select', hidden: true, options: LAPSED_OPTIONS },
  { key: 'x_expiring', label: 'Expiring in 48h', icon: Timer, type: 'select', hidden: true, options: DEPLOY_EXPIRING_OPTIONS },
];

export const REGISTRY_DEPLOY_QUICK_FILTERS: QuickFilterDef[] = [
  { field: 'status', icon: IconStatusCheck, tip: 'Filter by status', title: 'Status is', width: 210, row: 'dot', options: DEPLOY_STATUS_OPTIONS },
];
