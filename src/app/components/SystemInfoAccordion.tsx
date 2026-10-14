import { useState } from 'react';
import { ChevronDown, ChevronUp, Info } from 'lucide-react';
import { SystemFieldsRenderer } from './upstream/SystemFieldsRenderer';

/**
 * "System Information" — the read-only, system-generated fields (SLA levels, ages, created/modified
 * stamps).
 *
 * These used to sit inside the Key Info card, behind its "View more", which mixed the fields a
 * technician edits with the ones the platform writes. They are their own accordion now, pinned
 * last in the panel: nothing here is actionable, so it belongs below everything that is.
 *
 * Collapsed by default — that matches how it behaved before (hidden until "View more") and keeps
 * the panel short — but a field search forces it open so a match is never hidden behind a chevron.
 */
export function SystemInfoAccordion({
  fields,
  pinnedFields,
  onTogglePin,
  assetMode = false,
  purchaseMode = false,
  searchQuery = '',
}: {
  fields: string[];
  pinnedFields?: string[];
  onTogglePin?: (field: string) => void;
  assetMode?: boolean;
  purchaseMode?: boolean;
  /** While searching, the accordion opens so a matching field is visible. */
  searchQuery?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  if (!fields.length) return null;
  const open = expanded || !!searchQuery.trim();

  return (
    <div className="rounded-lg border border-[#DFE5ED] bg-white">
      {/* Pins under the panel's sticky search header, like the other accordions. */}
      <div className="sticky z-40 rounded-t-lg bg-white" style={{ top: 'var(--panel-header-h, 86px)' }}>
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex w-full items-center gap-2 rounded-lg p-4 text-left transition-colors hover:bg-[#F9FAFB]"
        >
          <Info size={16} className="flex-shrink-0 text-[#4A5568]" />
          <span className="text-[13px] font-semibold text-[#364658]">System Information</span>
          <span className="ml-auto flex-shrink-0">
            {open ? <ChevronUp size={16} className="text-[#7B8FA5]" /> : <ChevronDown size={16} className="text-[#7B8FA5]" />}
          </span>
        </button>
      </div>
      {open && (
        <div className="px-4 pb-4">
          <SystemFieldsRenderer
            fields={fields}
            showMore
            hideShowMore
            pinnedFields={pinnedFields}
            onTogglePin={onTogglePin}
            assetMode={assetMode}
            purchaseMode={purchaseMode}
          />
        </div>
      )}
    </div>
  );
}
