/* The Consumable Assets listing's filter catalogue — the product's own consumable
   attributes, in the product's own order. It feeds BOTH the filter builder and the
   Manage-columns list (minus whatever the grid already shows), like the hardware,
   software and non-IT catalogues.

   A consumable is stock, not an individual machine: it has no serial, no warranty and
   no lifecycle status — what matters is what it is, whose budget it sits under and how
   many are left. Keys point at a REAL row field wherever the mock carries one (id /
   subject / x_assetType / x_assetGroup / x_department / x_location / x_availableQty /
   assignedTo / createdBy); the rest get the shared per-record stand-in so a filter
   narrows the list instead of emptying it. */
import { AlignLeft, Boxes, Building2, CalendarDays, Hash, Layers, MapPin, Package, Tag, UserRound } from 'lucide-react';
import type { Attr } from './TicketFilterBar';

const o = (labels: string[]) => labels.map((label) => ({ label }));
const TECHS = ['Sarah Johnson', 'Vikram Sethi', 'Farah Sheikh', 'Imran Qureshi', 'Rohan Mehta', 'Tabrez Khan', 'Neha Raje'];

export const CONSUMABLE_FILTER_ATTRS: Attr[] = [
  { key: 'id', label: 'ID', icon: Hash, type: 'text' },
  { key: 'company', label: 'Company', icon: Building2, type: 'select', options: o(['Motadata', 'Motadata US', 'Motadata EMEA', 'Subsidiary — Logistics']) },
  { key: 'subject', label: 'Name', icon: AlignLeft, type: 'text' },
  { key: 'product', label: 'Product', icon: Package, type: 'select', options: o(['Logitech', 'Dell', 'HP', 'Kingston', 'SanDisk', 'Duracell', 'Pantum', 'Generic']) },
  { key: 'createdByUser', label: 'Created By', icon: UserRound, type: 'select', people: 'technician', options: o(TECHS) },
  { key: 'lastUpdatedBy', label: 'Last Updated By', icon: UserRound, type: 'select', people: 'technician', options: o(TECHS) },
  { key: 'assignedTo', label: 'Managed By', icon: UserRound, type: 'select', people: 'technician', options: o(TECHS) },
  { key: 'managedByGroup', label: 'Managed By Group', icon: Boxes, type: 'select', options: o(['IT Operations', 'End User Computing', 'Admin', 'Facilities', 'Service Desk']) },
  { key: 'x_assetGroup', label: 'Asset Group', icon: Boxes, type: 'select', options: o(['Peripherals', 'Printer Supplies', 'Network Supplies', 'Office Supplies', 'Pantry Supplies', 'Spare Parts']) },
  { key: 'category', label: 'Category', icon: Layers, type: 'select', options: o(['IT Consumable', 'Office Consumable', 'Pantry', 'Spare Part']) },
  { key: 'origin', label: 'Origin', icon: Boxes, type: 'select', options: o(['Purchased', 'Donated', 'Manually Added', 'Imported']) },
  { key: 'tags', label: 'Tags', icon: Tag, type: 'select', options: o(['stock', 'critical', 'reorder', 'bulk', 'shared']) },
  { key: 'x_assetType', label: 'Asset Type', icon: Package, type: 'select', options: o(['Adapter', 'Batteries', 'Cable', 'Cameras', 'Hand Sanitizer', 'Headset', 'Keyboard', 'Mouse', 'RAM', 'Tissue Paper', 'Toner Cartridge', 'USB Drive']) },
  { key: 'x_department', label: 'Department', icon: Building2, type: 'select', options: o(['IT', 'Finance', 'HR', 'Sales', 'Presales', 'Admin']) },
  { key: 'x_location', label: 'Location', icon: MapPin, type: 'select', options: o(['India', 'Delhi', 'Asia']) },
  { key: 'createdBy', label: 'Created Date', icon: CalendarDays, type: 'date' },
  { key: 'lastUpdatedDate', label: 'Last Updated Date', icon: CalendarDays, type: 'date' },
  /* Stock reads as BANDS — nobody filters on an exact count, they filter on "running
     out". The column still shows the true number; `QTY_BANDS` below is what the filter
     buckets that number into, and TicketFilterBar applies it. */
  { key: 'x_availableQty', label: 'Available Quantity', icon: Boxes, type: 'select', options: o(['Out of stock', '1 - 10', '11 - 50', '51 - 200', '200+']) },
];

/** The band a consumable's remaining quantity falls into — shared by the filter. */
export const qtyBandOf = (qty: number) =>
  qty <= 0 ? 'Out of stock' : qty <= 10 ? '1 - 10' : qty <= 50 ? '11 - 50' : qty <= 200 ? '51 - 200' : '200+';
