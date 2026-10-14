/* The Software Licenses listing's filter catalogue — the six attributes the product
   offers on a licence, feeding BOTH the filter builder and the Manage-columns list
   (minus whatever the grid already shows), like the other register catalogues.

   A licence is a purchase, not a machine: no status, no owner, no location — what it
   has is a product, a type, and the two dates that decide whether it is still valid.
   Keys point at REAL row fields (subject / x_product / x_licenseType / expiryOn); the
   custom field and Purchase Date have no data in this mock, so they fall back to the
   shared per-record stand-in rather than emptying the grid. */
import { AlignLeft, CalendarDays, KeyRound, ListChecks, Package } from 'lucide-react';
import type { Attr } from './TicketFilterBar';
import { LICENSE_TYPE_OPTIONS } from './upstream/AssetFields';

const o = (labels: string[]) => labels.map((label) => ({ label }));

export const LICENSE_FILTER_ATTRS: Attr[] = [
  { key: 'subject', label: 'Name', icon: AlignLeft, type: 'text' },
  {
    key: 'x_product',
    label: 'Product',
    icon: Package,
    type: 'select',
    options: o([
      'Microsoft 365 Enterprise', 'Adobe CC All Apps', 'Adobe Acrobat DC', 'AutoCAD LT',
      'Falcon Endpoint Protection', 'SQL Server Standard', 'Microsoft Visio', 'Microsoft Power BI',
      'Jira Cloud', 'GitHub Cloud', 'Figma Design', 'IntelliJ IDEA Ultimate', 'Postman API Platform',
      'Citrix DaaS', 'Sales Cloud Enterprise', 'Concur Expense', 'Notion Workspace',
      'Grammarly Workspace', 'Firefox ESR', '7-Zip Archiver',
    ]),
  },
  /* The detail page's own catalogue — one list, both surfaces, so the filter can never
     offer a type the licence's own License Type field cannot be set to. */
  { key: 'x_licenseType', label: 'License Type', icon: KeyRound, type: 'select', options: o(LICENSE_TYPE_OPTIONS) },
  /* Keyed to the parsed DATE, not the dd/mm/yyyy string the column prints — a date
     filter compares Dates, and the column and filter dedupe on their shared label. */
  { key: 'expiryOn', label: 'Expiry Date', icon: CalendarDays, type: 'date' },
  /* A customer-defined field: the values below are placeholders for the demo. */
  { key: 'multiSelect', label: 'New Multi-Select Dropdown', icon: ListChecks, type: 'select', options: o(['Finance Approved', 'Audit Required', 'Renewal Pending', 'Vendor Managed']) },
  { key: 'purchaseDate', label: 'Purchase Date', icon: CalendarDays, type: 'date' },
];
