/* VENDORED from the upstream prototype (ronak-patel-motadata/ServiceOps-Ticket-Detail-, Oct 2026 sync).
   Used ONLY by the detail pages and listings brought in from upstream — this project's own detail
   pages keep their own version in ../. Do not edit to change our pages; edit ../ instead. */
import { Stethoscope, Lock, Trash2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';

interface DiagnosisCardProps {
  content: string;
  timestamp: string;
  onEdit: () => void;
  onDelete: () => void;
  /** The Internal lock pill. Off on the Request page, where "Diagnosis" already says it. */
  showInternalTag?: boolean;
}

export function DiagnosisCard({ content, timestamp, onEdit, onDelete, showInternalTag = true }: DiagnosisCardProps) {
  return (
    <div className="flex gap-3 group relative">
      <div className="flex flex-col items-center">
        <div className="size-[24px] rounded bg-[#3D8BD0] flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
          JC
        </div>
      </div>
      <div className="flex-1 pb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-semibold text-[#364658]">Jane Cooper</span>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-xs text-[#7B8FA5] cursor-help">Just now</span>
            </TooltipTrigger>
            <TooltipContent>
              <p>{timestamp}</p>
            </TooltipContent>
          </Tooltip>
          <span className="flex items-center gap-1 px-2 py-0.5 bg-[rgba(0,157,220,0.05)] text-[#009DDC] text-xs rounded font-medium">
            <Stethoscope className="size-3" />
            Diagnosis
          </span>
          {showInternalTag && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="flex items-center gap-1 px-2 py-0.5 bg-[#F5F7FA] text-[#7B8FA5] text-xs rounded font-medium cursor-help">
                  <Lock className="size-3" />
                  Internal
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>Not Visible to Requester</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        <div className="bg-[rgba(245,133,24,0.10)] rounded-lg border-l-2 border-[#F58518] p-4 mt-2">
          <p className="text-sm text-[#364658] leading-relaxed whitespace-pre-wrap">
            {content}
          </p>
        </div>
      </div>
      
      {/* Hover Actions */}
      <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
        <button className="p-1.5 hover:bg-[#F3F4F6] rounded" title="Edit" onClick={onEdit}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10.8619 1.52925C11.1223 1.2689 11.5444 1.2689 11.8047 1.52925L14.4714 4.19591C14.7318 4.45626 14.7318 4.87837 14.4714 5.13872L5.80474 13.8054C5.67971 13.9304 5.51014 14.0007 5.33333 14.0007H2.66667C2.29848 14.0007 2 13.7022 2 13.334V10.6673C2 10.4905 2.07024 10.3209 2.19526 10.1959L8.86179 3.52939L10.8619 1.52925ZM9.33333 4.94346L3.33333 10.9435V12.6673H5.05719L11.0572 6.66732L9.33333 4.94346ZM12 5.72451L13.0572 4.66732L11.3333 2.94346L10.2761 4.00065L12 5.72451Z" fill="#7B8FA5"/>
          </svg>
        </button>
        <button className="p-1.5 hover:bg-[#F3F4F6] rounded" title="Delete" onClick={onDelete}>
          <Trash2 className="size-4 text-[#EF4444]" />
        </button>
      </div>
    </div>
  );
}