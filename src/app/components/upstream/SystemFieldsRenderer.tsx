/* VENDORED from the upstream prototype (ronak-patel-motadata/ServiceOps-Ticket-Detail-, Oct 2026 sync).
   Used ONLY by the detail pages and listings brought in from upstream — this project's own detail
   pages keep their own version in ../. Do not edit to change our pages; edit ../ instead. */
import { Pin as PinIcon } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from '../ui/tooltip';

interface SystemFieldsRendererProps {
  fields: string[];
  showMore: boolean;
  onToggleShowMore: () => void;
  pinnedFields: string[];
  onTogglePin: (field: string) => void;
  assetMode?: boolean;
  purchaseMode?: boolean;
  // When the parent accordion's single "View more" already governs visibility,
  // render every field and drop this component's own show-more toggle.
  hideShowMore?: boolean;
  // Lay the ticket system fields out in a 2-column grid (V2 Incident Details tab)
  // instead of the right panel's single-column list. Opt-in; default unchanged.
  twoColumn?: boolean;
  // Drop the hover pin affordance (V2 Incident Details tab — pinning belongs to the
  // right panel, where the pinned fields actually surface). Opt-in; default unchanged.
  hidePin?: boolean;
}

/** Field rows shown in the Hardware Asset "System Fields" tab. */
const ASSET_SYSTEM_FIELDS: { label: string; value: string; sub?: string; tone?: 'plain' | 'link' }[] = [
  { label: 'Last Barcode / QR Code Scan By', value: '---' },
  { label: 'Last Barcode / QR Code Scan Date', value: '---' },
  { label: 'Created Date', value: 'Mon, May 18, 2026 09:29 AM', sub: '(a month ago)' },
  { label: 'Last Updated Date', value: 'Sun, Jun 21, 2026 01:28 AM', sub: '(a few seconds ago)' },
  { label: 'Created By', value: 'System', tone: 'plain' },
  { label: 'Last Updated By', value: 'Rakesh Rathod', tone: 'link' },
];

/** Field rows shown in the Purchase Order "System Fields" tab. */
const PURCHASE_SYSTEM_FIELDS: { label: string; value: string; sub?: string; tone?: 'plain' | 'link' }[] = [
  { label: 'Last Updated Date', value: 'Tue, Apr 28, 2026 05:44 PM', sub: '(2 months ago)' },
  { label: 'Received Date', value: '---' },
  { label: 'Purchase Close Date', value: '---' },
  { label: 'Created By', value: 'Dharti', tone: 'link' },
  { label: 'Last Updated By', value: 'Dharti', tone: 'link' },
];

export function SystemFieldsRenderer({
  fields,
  showMore,
  onToggleShowMore,
  pinnedFields,
  onTogglePin,
  assetMode = false,
  purchaseMode = false,
  hideShowMore = false,
  twoColumn = false,
  hidePin = false
}: SystemFieldsRendererProps) {
  const PinButton = ({ field }: { field: string }) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <button onClick={(e) => { e.stopPropagation(); onTogglePin(field); }} className="flex items-center">
          <PinIcon size={14} className={`transition-opacity ${pinnedFields.includes(field) ? 'text-[#3D8BD0] opacity-100' : 'text-[#7B8FA5] opacity-0 group-hover/label:opacity-100'}`} />
        </button>
      </TooltipTrigger>
      <TooltipContent>{pinnedFields.includes(field) ? 'Unpin this field' : 'Pin this field on top'}</TooltipContent>
    </Tooltip>
  );

  if (purchaseMode) {
    return (
      <div className="space-y-3">
        {PURCHASE_SYSTEM_FIELDS.filter((f) => !pinnedFields.includes(f.label)).map((f) => (
          <div key={f.label} className="flex items-center justify-between gap-3">
            <div className="text-[12px] text-[#4A5568] flex-shrink-0 w-[120px] group/label flex items-center gap-1">
              <span>{f.label}</span>
              <PinButton field={f.label} />
            </div>
            <div className="flex-1 py-2 min-w-0">
              <div className={`text-[13px] font-medium ${f.tone === 'link' ? 'text-[#3D8BD0] cursor-pointer hover:underline' : 'text-[#364658]'}`}>{f.value}</div>
              {f.sub && <div className="text-[12px] text-[#7B8FA5] mt-0.5">{f.sub}</div>}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (assetMode) {
    return (
      <div className="space-y-3">
        {ASSET_SYSTEM_FIELDS.filter((f) => !pinnedFields.includes(f.label)).map((f) => (
          <div key={f.label} className="flex items-center justify-between gap-3">
            <div className="text-[12px] text-[#4A5568] flex-shrink-0 w-[120px] group/label flex items-center gap-1">
              <span>{f.label}</span>
              <PinButton field={f.label} />
            </div>
            <div className="flex-1 py-2 min-w-0">
              <div className={`text-[13px] font-medium ${f.tone === 'link' ? 'text-[#3D8BD0] cursor-pointer hover:underline' : 'text-[#364658]'}`}>{f.value}</div>
              {f.sub && <div className="text-[12px] text-[#7B8FA5] mt-0.5">{f.sub}</div>}
            </div>
          </div>
        ))}
      </div>
    );
  }

  const displayedFields = (showMore || hideShowMore) ? fields : fields.slice(0, 8);

  const getFieldValue = (field: string): string => {
    const fieldValues: { [key: string]: string } = {
      'Current SLA': 'Urgent Priority SLA',
      'Resolution Escalation Level': 'Not Violated',
      'Response Escalation Level': 'Not Violated',
      'First Response Due By': 'February 15, 2026 07:54',
      'First Response Date': '---',
      'Request Type': 'Incident',
      'Request Age': '17 hours 31 minutes 13 seconds',
      'Last Updated Date': 'February 16, 2026 00:34 (an hour ago)',
      'Last Approved Date': '---',
      'Created By': 'Sakshi',
      'Last Updated By': 'Sakshi',
      'Created Date': 'Apr 24, 2025 10:37 AM',
      'Modified By': 'Sarah Johnson',
      'Modified Date': 'Apr 28, 2025 2:15 PM'
    };
    return fieldValues[field] || '---';
  };

  const isUserField = (field: string): boolean => {
    return ['Created By', 'Last Updated By', 'Modified By'].includes(field);
  };

  const getUserInitials = (field: string): string => {
    if (field === 'Created By' || field === 'Last Updated By') return 'S';
    if (field === 'Modified By') return 'SJ';
    return 'U';
  };

  const isHighlightedField = (field: string): boolean => {
    return field === 'Current SLA';
  };

  return (
    // Stacked (narrow) mode needs real breathing room between fields — each cell is two lines
    // (label over value), so the tight wide-view gap reads as clutter there.
    <div className={twoColumn ? 'grid grid-cols-2 gap-x-8 gap-y-4 @4xl:gap-y-1' : 'space-y-3'}>
      {displayedFields.map((field) => (
        // 2-col mode is container-query responsive (the tab root is a @container): side-by-side
        // label/value in the wide drawer, value stacked UNDER the label in small view.
        <div key={field} className={twoColumn ? 'flex flex-col items-start @4xl:flex-row @4xl:items-center @4xl:justify-between gap-0 @4xl:gap-3' : 'flex items-center justify-between gap-3'}>
          {/* 2-col mode gets a wider, non-wrapping label column — the narrow right panel
              needs the 120px wrap, but in the tab a wrapped label reads as clutter. */}
          <div className={`text-[12px] text-[#4A5568] flex-shrink-0 group/label flex items-center gap-1 ${twoColumn ? 'w-auto @4xl:w-[190px] whitespace-nowrap' : 'w-[120px]'}`}>
            <span>{field}</span>
            {!hidePin && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={(e) => { e.stopPropagation(); onTogglePin(field); }}
                  className="flex items-center"
                >
                  <PinIcon
                    size={14}
                    className={`transition-opacity ${pinnedFields.includes(field) ? 'text-[#3D8BD0] opacity-100' : 'text-[#7B8FA5] opacity-0 group-hover/label:opacity-100'}`}
                  />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                {pinnedFields.includes(field) ? 'Unpin this field' : 'Pin this field on top'}
              </TooltipContent>
            </Tooltip>
            )}
          </div>
          <div className={`flex-1 ${twoColumn ? 'py-1 @4xl:py-2' : 'py-2'} text-[13px] font-medium ${
            isUserField(field)
              ? 'text-[#3D8BD0] flex items-center gap-2'
              : isHighlightedField(field)
              ? 'text-[#3D8BD0]'
              : 'text-[#364658]'
          }`}>
            {isUserField(field) && (
              <div className="w-5 h-5 rounded bg-[#3B82F6] flex items-center justify-center text-white text-[10px] font-medium flex-shrink-0">
                {getUserInitials(field)}
              </div>
            )}
            <span className={field === 'Last Updated Date' ? 'flex items-center gap-1' : ''}>
              {field === 'Last Updated Date' ? (
                <>
                  February 16, 2026 00:34 <span className="text-[#7B8FA5]">(an hour ago)</span>
                </>
              ) : (
                getFieldValue(field)
              )}
            </span>
          </div>
        </div>
      ))}
      
      {!hideShowMore && fields.length > 8 && (
        <div className={`mt-3 pt-3 border-t border-[#F0F1F3] ${twoColumn ? 'col-span-2' : ''}`}>
          <button
            onClick={onToggleShowMore}
            className="text-[13px] text-[#3D8BD0] hover:text-[#2A6BA8] font-medium transition-colors"
          >
            {showMore ? 'Show less' : `Show more (${fields.length - 8} more fields)`}
          </button>
        </div>
      )}
    </div>
  );
}
