/* The Purchases listing's filter catalogue — the twenty-seven attributes the product
   offers on a purchase order, in the product's own order, feeding BOTH the filter builder
   and the Manage-columns list (minus whatever the grid already shows), like the other
   register catalogues.

   A purchase order is a commitment of money against a vendor, so it carries two clocks
   (the order's own dates and the money's: invoiced, paid) on top of the usual record
   fields. Keys point at REAL row fields wherever the mock carries one (id / subject /
   status / assignedTo / x_vendor / x_orderNumber / requiredOn / createdBy, plus the money
   trio the row derives); the rest fall back to the shared per-record stand-in so a filter
   narrows the list instead of emptying it. Where the detail page already owns a picker
   (Status, Cost Center, GL Code, Invoice Received, Payment Status) the options are
   imported from it rather than retyped, so the two surfaces cannot drift apart. */
import { AlignLeft, Banknote, Building2, CalendarDays, CircleDot, FileSignature, Hash, Landmark, Paperclip, ReceiptText, ShieldCheck, Tag, UserRound, Wallet } from 'lucide-react';
import type { Attr } from './TicketFilterBar';
import { COST_CENTER_OPTIONS, GL_CODE_OPTIONS, INVOICE_RECEIVED_OPTIONS, PAYMENT_STATUS_OPTIONS, PURCHASE_STATUS_OPTIONS } from './upstream/AssetFields';

const o = (labels: string[]) => labels.map((label) => ({ label }));
/* The procurement desk in this mock — the owners the rows actually carry, plus the
   buyers who raise the orders. */
const OWNERS = ['Jainam Shah', 'Khushi Vaniya', 'Neha Raje', 'Rohan Mehta', 'Vaibhav Prajapati', 'Unassigned'];
const BUYERS = ['Sarah Johnson', 'Vikram Sethi', 'Neha Raje', 'Rohan Mehta', 'Jainam Shah', 'Khushi Vaniya'];
/* The vendor strings EXACTLY as the rows carry them (`VCAT-3: Dell Technologies`) — the
   column prints the same string, so "Vendor is …" matches on equality. */
const VENDORS = [
  'VCAT-3: Cisco Systems', 'VCAT-3: Dell Technologies', 'VCAT-12: Hitachi Vantara', 'VCAT-12: Seagate',
  'VCAT-15: Microsoft', 'VCAT-22: Samsung', 'VCAT-25: HP Inc.', 'VCAT-44: Lenovo', 'VCAT-49: NVIDIA',
  'VCAT-51: Aruba Networks', 'VCAT-53: Quantum', 'VCAT-53: Schneider Electric', 'VCAT-56: Apple',
  'VCAT-59: APC by Schneider', 'VCAT-59: Ingram Micro', 'VCAT-61: Cisco Systems',
];

export const PURCHASE_FILTER_ATTRS: Attr[] = [
  { key: 'id', label: 'ID', icon: Hash, type: 'text' },
  { key: 'subject', label: 'Name', icon: AlignLeft, type: 'text' },
  { key: 'status', label: 'Status', icon: CircleDot, type: 'select', options: PURCHASE_STATUS_OPTIONS },
  { key: 'poApprovalStatus', label: 'Approval Status', icon: ShieldCheck, type: 'select', options: o(['Pending', 'Approved', 'Rejected', 'Not Required']) },
  /* The grid derives this column from the row id; these are its three values. */
  { key: 'digitalSignature', label: 'Digital Signature Status', icon: FileSignature, type: 'select', options: o(['Signed', 'Pending', 'Not Required']) },
  { key: 'x_vendor', label: 'Vendor', icon: Building2, type: 'select', options: o(VENDORS) },
  { key: 'x_orderNumber', label: 'Order Number', icon: Hash, type: 'text' },
  { key: 'poCreatedBy', label: 'Created By', icon: UserRound, type: 'select', people: 'technician', options: o(BUYERS) },
  { key: 'poUpdatedBy', label: 'Last Updated By', icon: UserRound, type: 'select', people: 'technician', options: o(BUYERS) },
  { key: 'poRequester', label: 'Requester', icon: UserRound, type: 'select', people: 'technician', options: o(BUYERS) },
  { key: 'poTags', label: 'Tags', icon: Tag, type: 'select', options: o(['capex', 'opex', 'urgent', 'budgeted', 'renewal', 'replacement']) },
  { key: 'createdBy', label: 'Created Date', icon: CalendarDays, type: 'date' },
  /* Keyed to the parsed DATE, not the dd/mm/yyyy string the column prints — a date filter
     compares Dates, and the column and the filter dedupe on their shared label. */
  { key: 'requiredOn', label: 'Required By', icon: CalendarDays, type: 'date' },
  { key: 'poOrderedOn', label: 'Ordered Date', icon: CalendarDays, type: 'date' },
  { key: 'poReceivedOn', label: 'Received Date', icon: CalendarDays, type: 'date' },
  { key: 'poClosedOn', label: 'Closed Date', icon: CalendarDays, type: 'date' },
  { key: 'costCenter', label: 'Cost Center', icon: Landmark, type: 'select', options: o(COST_CENTER_OPTIONS) },
  { key: 'glCode', label: 'GL Code', icon: Landmark, type: 'select', options: o(GL_CODE_OPTIONS) },
  /* Invoice Received and Payment Status are DERIVED on the row from the invoiced and paid
     amounts below, so "Payment Status is Paid" and "Total Payment Amount" always agree. */
  { key: 'invoiceReceived', label: 'Invoice Received', icon: ReceiptText, type: 'select', options: o(INVOICE_RECEIVED_OPTIONS) },
  { key: 'paymentStatus', label: 'Payment Status', icon: Wallet, type: 'select', options: o(PAYMENT_STATUS_OPTIONS) },
  { key: 'x_totalCost', label: 'Total Cost', icon: Banknote, type: 'text' },
  { key: 'x_invoiceAmount', label: 'Total Invoice Amount', icon: Banknote, type: 'text' },
  { key: 'x_paymentAmount', label: 'Total Payment Amount', icon: Banknote, type: 'text' },
  { key: 'poUpdatedOn', label: 'Last Updated Date', icon: CalendarDays, type: 'date' },
  { key: 'poSignedOn', label: 'Last Signed Date', icon: CalendarDays, type: 'date' },
  { key: 'assignedTo', label: 'Owner', icon: UserRound, type: 'select', people: 'technician', options: o(OWNERS) },
  { key: 'poAttachment', label: 'Attachment', icon: Paperclip, type: 'select', options: o(['Yes', 'No']) },
];
