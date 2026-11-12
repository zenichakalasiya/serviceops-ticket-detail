import type { CreateTarget } from './createFormStore';

/* The header's + menu — the product's ONE way to create a request, problem, change, release,
 * asset, CI, purchase order, project or contract. On the product (172.16.15.185) those listings
 * carry no Create button of their own; this menu is the entry, in this order.
 *
 * Each row names the create page and the listing the record lands in, with that listing's own
 * id format so a new record reads like its neighbours. */

export type AssetKindKey = 'Hardware' | 'Software' | 'Non-IT' | 'Consumable';

/** Where a new asset lands, by kind — the kind is picked on the form through Asset Type. */
export const ASSET_TARGETS: Record<AssetKindKey, Pick<CreateTarget, 'target' | 'idOf' | 'seqStart'>> = {
  Hardware: { target: 'hardware-assets', idOf: (n) => `AST-${String(n).padStart(3, '0')}`, seqStart: 100 },
  Software: { target: 'software-assets', idOf: (n) => `SWAST-${n}`, seqStart: 27000 },
  'Non-IT': { target: 'non-it-assets', idOf: (n) => `NON-${n}`, seqStart: 6000 },
  Consumable: { target: 'consumable-assets', idOf: (n) => `CON-${String(n).padStart(9, '0')}`, seqStart: 7100 },
};

/** The asset listing a page id belongs to, if any — Add Asset opened there starts on that kind. */
export const ASSET_KIND_OF_PAGE: Record<string, AssetKindKey> = {
  'hardware-assets': 'Hardware', 'software-assets': 'Software', 'non-it-assets': 'Non-IT', 'consumable-assets': 'Consumable',
};

export type CreateMenuIcon = 'request' | 'service' | 'problem' | 'change' | 'release' | 'asset' | 'ci' | 'purchase' | 'project' | 'contract';

export interface CreateMenuItem {
  label: string;
  icon: CreateMenuIcon;
  /** The page to open; `page` is the module in the URL, so Add Asset can start on that kind. */
  open?: (page: string) => CreateTarget;
  /** Shown disabled with this reason — the row exists on the product but has no screen here yet. */
  unavailable?: string;
}

export const CREATE_MENU: CreateMenuItem[] = [
  { label: 'Create Incident', icon: 'request', open: () => ({ spec: 'request', target: 'request' }) },
  { label: 'Request Service', icon: 'service', unavailable: 'Opens the service catalog, which this prototype does not have yet.' },
  { label: 'Create Problem', icon: 'problem', open: () => ({ spec: 'problem', target: 'problem', idOf: (n) => `PBM-${n}`, seqStart: 627 }) },
  { label: 'Create Change', icon: 'change', open: () => ({ spec: 'change', target: 'change', seqStart: 993 }) },
  { label: 'Create Release', icon: 'release', open: () => ({ spec: 'release', target: 'release', seqStart: 100 }) },
  {
    label: 'Add Asset', icon: 'asset',
    open: (page) => {
      const kind = ASSET_KIND_OF_PAGE[page];
      /* From an asset listing the form starts on that kind; anywhere else Asset Type offers all
         four and the type picked decides the kind (ModuleCreatePage routes the save by it). */
      return kind ? { spec: 'asset', preset: { assetKind: kind }, ...ASSET_TARGETS[kind] } : { spec: 'asset', target: 'hardware-assets' };
    },
  },
  { label: 'Add CI', icon: 'ci', open: () => ({ spec: 'ci', target: 'cmdb', idOf: (n) => `CI-${n}`, seqStart: 1000 }) },
  { label: 'Create Purchase Order', icon: 'purchase', open: () => ({ spec: 'purchase', target: 'purchases', idOf: (n) => `PO-2611-${String(n).padStart(3, '0')}`, seqStart: 100 }) },
  { label: 'Create Project', icon: 'project', open: () => ({ spec: 'project', target: 'projects', idOf: (n) => `PRJ-${n}`, seqStart: 200 }) },
  { label: 'Create Contract', icon: 'contract', open: () => ({ spec: 'contract', target: 'contracts' }) },
];
