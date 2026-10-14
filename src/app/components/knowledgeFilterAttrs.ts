/* The Knowledge listing's filter catalogue — the ten attributes the product offers on an
   article, in the product's own order. It feeds BOTH the filter builder and the
   Manage-columns list (minus whatever the grid already shows), and the grid's status
   dropdown reads its options from here, so the cell and the filter are one list.

   Keys point at REAL row fields wherever the mock carries one (id / subject / status /
   x_approvalStatus / assignedTo / createdBy); the rest fall back to the shared per-record
   stand-in so a filter narrows the list instead of emptying it. */
import { AlignLeft, CalendarDays, CircleDot, Hash, Paperclip, ShieldCheck, Tag, UserRound } from 'lucide-react';
import type { Attr } from './TicketFilterBar';

const o = (labels: string[]) => labels.map((label) => ({ label }));
const AUTHORS = [
  'Juli Mathew', 'Rosy Fernandes', 'Priya Nair', 'Karan Malhotra', 'Rahul Verma', 'Neha Raje',
  'Farah Sheikh', 'Vikram Sethi', 'Diya Kapoor', 'Rohan Mehta', 'Siddharth Rao', 'Ananya Iyer',
];

export const KNOWLEDGE_FILTER_ATTRS: Attr[] = [
  { key: 'id', label: 'ID', icon: Hash, type: 'text' },
  /* Separate from the status on purpose: an article can be live without ever having been
     sent for approval, and one can be rejected while still published. */
  { key: 'x_approvalStatus', label: 'Approval Status', icon: ShieldCheck, type: 'select', options: [
    { label: 'Approved', color: '#22C55E' },
    { label: 'Pending Approval', color: '#F59E0B' },
    { label: 'Not Requested', color: '#94A3B8' },
    { label: 'Rejected', color: '#DC2626' },
  ] },
  { key: 'kbUpdatedBy', label: 'Last Updated By', icon: UserRound, type: 'select', people: 'technician', options: o(AUTHORS) },
  { key: 'kbTags', label: 'Tags', icon: Tag, type: 'select', options: o(['how-to', 'policy', 'troubleshooting', 'onboarding', 'security', 'faq']) },
  { key: 'subject', label: 'Subject', icon: AlignLeft, type: 'text' },
  /* An article's own lifecycle — written, being reviewed, live, or out of date. */
  { key: 'status', label: 'Status', icon: CircleDot, type: 'select', options: [
    { label: 'Published', color: '#22C55E' },
    { label: 'In Review', color: '#F59E0B' },
    { label: 'Draft', color: '#94A3B8' },
    { label: 'Expired', color: '#DC2626' },
  ] },
  { key: 'createdBy', label: 'Created Date', icon: CalendarDays, type: 'date' },
  { key: 'kbUpdatedOn', label: 'Last Updated Date', icon: CalendarDays, type: 'date' },
  /* The author IS the creator — one fact, so the filter reads the column's own field
     rather than inventing a second person. */
  { key: 'assignedTo', label: 'Created By', icon: UserRound, type: 'select', people: 'technician', options: o(AUTHORS) },
  { key: 'kbAttachment', label: 'Attachment', icon: Paperclip, type: 'select', options: o(['Yes', 'No']) },
];
