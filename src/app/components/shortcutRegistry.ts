/* ── Every keyboard shortcut in ServiceOps, by module ──────────────────────────────────────────────
 *
 * The ONE list the global Keyboard shortcuts panel reads (Zeni, 30 Sep 2026). A module is a place in
 * the product; its groups are the headings inside it. SHORTCUTS.md is the prose reference and should
 * agree with this file.
 *
 * ⚠️ The detail drawer's and the portal builder's rows are IMPORTED from the components that bind
 * them, never copied — a copy is how a panel ends up advertising a key that was changed in the
 * handler. The three canvases keep their keys in their own components with no exported list, so
 * they are written out here, from SHORTCUTS.md §2–§4.
 *
 * Key tokens: every entry is a key cap, except `+` (pressed together) and `/` (either one).
 */
import { DRAWER_SHORTCUT_SECTIONS } from './DrawerShortcuts';
import { PORTAL_SHORTCUT_GROUPS } from './PortalShortcuts';

export type ShortcutRow = { keys: string[]; label: string; lead?: boolean };
export type ShortcutGroup = { title: string; note?: string; rows: ShortcutRow[] };
export interface ShortcutModule {
  id: string;
  name: string;
  /** Where it lives, in the words the nav uses — the "All modules" tab is grouped by this. */
  area: string;
  /** One line on where these keys work. */
  where?: string;
  groups: ShortcutGroup[];
}

export const GLOBAL_ID = 'global';

const canvasGroups = (extra: ShortcutRow[]): ShortcutGroup[] => [
  { title: 'Canvas', note: 'Click the canvas once so it has focus', rows: [
    { keys: ['↑', '↓', '←', '→'], label: 'Pan' },
    { keys: ['+', '/', '−'], label: 'Zoom in / out' },
    { keys: ['F'], label: 'Fit and centre everything' },
    ...extra,
  ] },
];

const MODULES: ShortcutModule[] = [
  { id: GLOBAL_ID, name: 'Global', area: 'General', where: 'Work on every page', groups: [
    { title: 'Everywhere', rows: [
      { keys: ['Ctrl', '+', 'K'], label: 'Search ServiceOps', lead: true },
      { keys: ['/'], label: 'Search ServiceOps (when not typing)' },
      { keys: ['?'], label: 'Keyboard shortcuts' },
      { keys: ['Esc'], label: 'Close what is open' },
    ] },
  ] },

  /* ── Detail pages ── */
  { id: 'drawer', name: 'Detail pages', area: 'Detail pages',
    where: 'Any record opened in the drawer — Requests, Assets, CMDB and the rest',
    groups: DRAWER_SHORTCUT_SECTIONS.filter((s) => s.title !== 'Help') },
  { id: 'relationship-map', name: 'Relationship map', area: 'Detail pages',
    where: 'The Relationship tab, and the CMDB Dependency Map',
    groups: [
      ...canvasGroups([
        { keys: ['1', '/', '2', '/', '3'], label: 'Full / Tree / Grid view' },
        { keys: ['M'], label: 'Minimap' },
        { keys: ['L'], label: 'Type legend' },
        { keys: ['R'], label: 'Reset layout' },
      ]),
      { title: 'Map', rows: [
        { keys: ['Ctrl', '+', 'F'], label: 'Search nodes' },
        { keys: ['Ctrl', '+', 'Shift', '+', 'F'], label: 'Full screen' },
        { keys: ['Esc'], label: 'Clear search / deselect' },
      ] },
    ] },
  { id: 'superseded-map', name: 'Superseded map', area: 'Detail pages', where: 'The Superseded tab of a patch',
    groups: [
      ...canvasGroups([
        { keys: ['E'], label: 'Expand / collapse all versions' },
        { keys: ['R'], label: 'Reset layout' },
      ]),
      { title: 'Map', rows: [
        { keys: ['Ctrl', '+', 'F'], label: 'Search nodes' },
        { keys: ['Ctrl', '+', 'Shift', '+', 'F'], label: 'Full screen' },
        { keys: ['Esc'], label: 'Clear search' },
      ] },
    ] },
  { id: 'deployment-topology', name: 'Deployment topology', area: 'Detail pages',
    where: 'The Topology view of a Deployment tab',
    groups: [
      ...canvasGroups([{ keys: ['R'], label: 'Reset view' }]),
      { title: 'Map', rows: [
        { keys: ['Ctrl', '+', 'F'], label: 'Search nodes' },
        { keys: ['Esc'], label: 'Clear search' },
      ] },
    ] },

  /* ── List pages — shown even without keys of their own, so the map of the product is complete ── */
  { id: 'request', name: 'Requests', area: 'Service desk', groups: [] },
  { id: 'problem', name: 'Problems', area: 'Service desk', groups: [] },
  { id: 'change', name: 'Changes', area: 'Service desk', groups: [] },
  { id: 'release', name: 'Releases', area: 'Service desk', groups: [] },
  { id: 'hardware-assets', name: 'Hardware Assets', area: 'Assets', groups: [] },
  { id: 'software-assets', name: 'Software Assets', area: 'Assets', groups: [] },
  { id: 'non-it-assets', name: 'Non-IT Assets', area: 'Assets', groups: [] },
  { id: 'consumable-assets', name: 'Consumable Assets', area: 'Assets', groups: [] },
  { id: 'software-licenses', name: 'Software Licenses', area: 'Assets', groups: [] },
  { id: 'contracts', name: 'Contracts', area: 'Assets', groups: [] },
  { id: 'purchases', name: 'Purchases', area: 'Assets', groups: [] },
  { id: 'cmdb', name: 'CMDB', area: 'Configuration', groups: [] },
  { id: 'bom', name: 'BOM Inventory', area: 'Configuration', groups: [] },
  { id: 'patches', name: 'Patches', area: 'Patch & vulnerability', groups: [] },
  { id: 'patch-deployments', name: 'Patch Deployments', area: 'Patch & vulnerability', groups: [] },
  { id: 'endpoints', name: 'Endpoints', area: 'Patch & vulnerability', groups: [] },
  { id: 'vulnerabilities', name: 'Vulnerabilities', area: 'Patch & vulnerability', groups: [] },
  { id: 'detected-cves', name: 'Detected CVEs', area: 'Patch & vulnerability', groups: [] },

  /* ── Admin ── */
  { id: 'admin', name: 'Admin', area: 'Admin', groups: [] },
  { id: 'portal-builder', name: 'Support Portal builder', area: 'Admin',
    where: 'Admin › Support Channels › Support Portal › Customise portal',
    groups: PORTAL_SHORTCUT_GROUPS },
];

/** Areas in the order the "All modules" tab lists them. */
export const SHORTCUT_AREAS = ['General', 'Detail pages', 'Service desk', 'Assets', 'Configuration', 'Patch & vulnerability', 'Admin'];

export const shortcutModules = (): ShortcutModule[] => MODULES;
export const shortcutModule = (id: string): ShortcutModule | undefined => MODULES.find((m) => m.id === id);
export const rowCount = (m: ShortcutModule) => m.groups.reduce((n, g) => n + g.rows.length, 0);
