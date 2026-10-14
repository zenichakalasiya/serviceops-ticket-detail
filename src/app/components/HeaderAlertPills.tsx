import { AlertTriangle, Clock, CheckCircle, Hourglass, UserCheck } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from './ui/tooltip';
import type { HeaderKpiItem } from './upstream/HeaderKpiRow';
import { getSlaPenaltyAmount } from './TicketDrawerUtils';

/* Header alert pills — the tinted "what needs attention" chips that sit at the end of the KPI row
 * on the Request / Problem / Change / Release detail pages. They replaced the plain "SLA · Overdue"
 * KPI chip: a breach is a call to action, not a statistic, so it reads as a pill rather than a
 * label:value pair. Everything here is derived from what the page already shows (the SLA Status
 * card's own rules, the approval count, the status) so the header can never contradict the panel. */

export type AlertTone = 'danger' | 'warning' | 'info' | 'success';

const TONE: Record<AlertTone, { bg: string; text: string }> = {
  danger: { bg: '#FDECEA', text: '#C0392B' },
  warning: { bg: '#FEF6E7', text: '#B4690E' },
  info: { bg: '#EAF3FB', text: '#2E6FA8' },
  success: { bg: '#E8F5EE', text: '#1B7A54' },
};

type AlertIcon = 'breach' | 'clock' | 'check' | 'approval' | 'waiting';

const ICONS = {
  breach: AlertTriangle,
  clock: Clock,
  check: CheckCircle,
  approval: UserCheck,
  waiting: Hourglass,
};

export interface HeaderAlert {
  key: string;
  label: string;
  tone: AlertTone;
  icon: AlertIcon;
  /** "Label: Value" — shown on hover AND parsed by the KPI row's overflow popover. */
  tip: string;
}

export function AlertPill({ alert }: { alert: HeaderAlert }) {
  const tone = TONE[alert.tone];
  const Icon = ICONS[alert.icon];
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className="inline-flex flex-shrink-0 cursor-default items-center gap-1 rounded px-1.5 py-px text-[11px] font-medium"
          style={{ backgroundColor: tone.bg, color: tone.text }}
        >
          <Icon size={11} className="flex-shrink-0" />
          {alert.label}
        </span>
      </TooltipTrigger>
      <TooltipContent>{alert.tip}</TooltipContent>
    </Tooltip>
  );
}

/** Wrap alerts as KPI-row items so they overflow into the "+N" popover like every other chip.
 *  Only the first pill keeps the hairline separator — consecutive pills sit flush together. */
export function alertKpiItems(alerts: HeaderAlert[]): HeaderKpiItem[] {
  return alerts.map((a, i) => ({
    key: 'alert-' + a.key,
    tip: a.tip,
    noSep: i > 0,
    node: <AlertPill alert={a} />,
  }));
}

const hash = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 17 + s.charCodeAt(i)) >>> 0;
  return h;
};

/** Resolution SLA is breached — the same rule the right-panel SLA Status card uses. */
export const isResolutionBreached = (id?: string) => getSlaPenaltyAmount(id) > 0;

/** First response was missed. Only ever true on a record whose resolution is also breached —
 *  a late first response is what puts resolution at risk in the first place. */
export const isFirstResponseBreached = (id?: string) =>
  !!id && isResolutionBreached(id) && hash(id) % 3 === 2;

const isClosed = (status?: string) => /closed|resolved|completed|cancelled|canceled/i.test(status ?? '');

/**
 * The alert set for one record, ordered most-urgent-first so red always leads.
 * `approvalsPending` is the page's own pending-approval count.
 */
export function getHeaderAlerts(opts: {
  id?: string;
  status?: string;
  approvalsPending?: number;
}): HeaderAlert[] {
  const { id, status, approvalsPending = 0 } = opts;
  const closed = isClosed(status);
  const breached = isResolutionBreached(id);
  const alerts: HeaderAlert[] = [];

  /* --- danger --- */
  if (!closed && breached) {
    /* The pills state the CONDITION only — how long it has been overdue is detail, and it belongs
       in the hover tooltip and the SLA Status card, not in a header chip. */
    alerts.push({ key: 'sla', label: 'SLA Overdue', tone: 'danger', icon: 'breach', tip: 'Resolution SLA: Overdue by 1w 4d' });
  }
  if (!closed && isFirstResponseBreached(id)) {
    alerts.push({ key: 'first-response', label: 'First Response Overdue', tone: 'danger', icon: 'breach', tip: 'First response SLA: Overdue' });
  }
  if (closed && breached) {
    alerts.push({ key: 'sla-closed', label: 'SLA Breached', tone: 'danger', icon: 'breach', tip: 'Resolution SLA: Breached before close' });
  }

  /* --- warning --- */
  if (approvalsPending > 0 && !closed) {
    alerts.push({
      key: 'approval',
      label: approvalsPending > 1 ? `Approval: ${approvalsPending} Pending` : 'Approval: Pending',
      tone: 'warning',
      icon: 'approval',
      tip: `Approval: ${approvalsPending > 1 ? `${approvalsPending} waiting for a decision` : 'Waiting for a decision'}`,
    });
  }
  if (!closed && /pending/i.test(status ?? '')) {
    alerts.push({ key: 'awaiting', label: 'Awaiting Requester', tone: 'warning', icon: 'waiting', tip: 'Requester: Awaiting a reply' });
  }

  /* --- info / success --- */
  if (!closed && !breached) {
    alerts.push({ key: 'sla-due', label: 'SLA Due', tone: 'info', icon: 'clock', tip: 'Resolution SLA: Due in 4d 5h' });
  }
  if (closed && !breached) {
    alerts.push({ key: 'sla-met', label: 'SLA Met', tone: 'success', icon: 'check', tip: 'Resolution SLA: Met' });
  }

  return alerts;
}
