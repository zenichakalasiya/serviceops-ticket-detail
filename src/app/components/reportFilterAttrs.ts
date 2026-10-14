/* The Reports listing's filter catalogue — the three attributes the product offers on a
   saved report, in its own order: what it is called, which engine built it, and which
   company it belongs to. It feeds the filter builder, the Manage-columns list (minus
   whatever the grid already shows), the Type cell's own dot colours and the quick filter,
   so every surface reads one list.

   `subject` and `x_type` point at REAL row fields; `company` is the shared key the asset
   registers already use, with the same four tenants, so one vocabulary covers the product. */
import { AlignLeft, Building2, LayoutList } from 'lucide-react';
import type { Attr } from './TicketFilterBar';

const o = (labels: string[]) => labels.map((label) => ({ label }));

/* Shipped with the product, or built here — the cut the quick filter makes. */
export const REPORT_ORIGIN_OPTIONS = [
  { label: 'Predefined Report', color: '#64748B' },
  { label: 'Custom Report', color: '#3D8BD0' },
];

/* The five report engines the product ships. Colours are the dot the Type cell and the
   quick filter both use — one hue per engine, so a type is recognisable before it is read. */
export const REPORT_TYPE_OPTIONS = [
  { label: 'Tabular Report', color: '#3D8BD0' },
  { label: 'Matrix Report', color: '#8B5CF6' },
  { label: 'Summary Report', color: '#0D9488' },
  { label: 'Plugin Report', color: '#F59E0B' },
  { label: 'Query Report', color: '#64748B' },
];

export const REPORT_FILTER_ATTRS: Attr[] = [
  { key: 'subject', label: 'Name', icon: AlignLeft, type: 'text' },
  { key: 'x_type', label: 'Type', icon: LayoutList, type: 'select', options: REPORT_TYPE_OPTIONS },
  { key: 'company', label: 'Company', icon: Building2, type: 'select', options: o(['Motadata', 'Motadata US', 'Motadata EMEA', 'Subsidiary — Logistics']) },
  /* Backs the quick filter only: applying it has to leave a chip you can read and remove,
     but the picker offers the three attributes above and nothing else. */
  { key: 'x_origin', label: 'Report Origin', icon: LayoutList, type: 'select', options: REPORT_ORIGIN_OPTIONS, hidden: true },
];
