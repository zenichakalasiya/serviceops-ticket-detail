/* VENDORED from the upstream prototype (ronak-patel-motadata/ServiceOps-Ticket-Detail-, Oct 2026 sync).
   Used ONLY by the detail pages and listings brought in from upstream — this project's own detail
   pages keep their own version in ../. Do not edit to change our pages; edit ../ instead. */
import { useState, useEffect } from 'react';
import { DateField } from '../DateField';
import { X, ChevronDown, Calendar as CalendarIcon } from 'lucide-react';
import { toast } from 'sonner';

interface WorkLogPayload {
  technician: { name: string; initials: string; color: string };
  start: string;
  end: string;
  description: string;
}

interface AddWorkLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd?: (log: WorkLogPayload) => void;
  /** When set, the modal opens prefilled to edit this work log. */
  editingLog?: ({ id: string } & WorkLogPayload) | null;
  onUpdate?: (id: string, log: WorkLogPayload) => void;
}

const TECHNICIANS = [
  { name: 'Rakesh Rathod', email: 'rakesh.rathod@motadata.com', initials: 'RR', color: '#3D8BD0' },
  { name: 'Sarah Johnson', email: 'sarah.johnson@motadata.com', initials: 'SJ', color: '#8B5CF6' },
  { name: 'Michael Chen', email: 'michael.chen@motadata.com', initials: 'MC', color: '#22A06B' },
  { name: 'Priya Sharma', email: 'priya.sharma@motadata.com', initials: 'PS', color: '#F59E0B' },
];

export function AddWorkLogModal({ isOpen, onClose, onAdd, editingLog, onUpdate }: AddWorkLogModalProps) {
  const [technician, setTechnician] = useState(TECHNICIANS[0]);
  const [showTechDropdown, setShowTechDropdown] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [description, setDescription] = useState('');

  // Prefill (edit) or clear (add) the form whenever the modal opens.
  useEffect(() => {
    if (!isOpen) return;
    if (editingLog) {
      setTechnician(
        TECHNICIANS.find((t) => t.name === editingLog.technician.name) ||
          { ...editingLog.technician, email: '' }
      );
      setStartDate(editingLog.start || '');
      setEndDate(editingLog.end || '');
      setDescription(editingLog.description || '');
    } else {
      setTechnician(TECHNICIANS[0]);
      setStartDate('');
      setEndDate('');
      setDescription('');
    }
    setShowTechDropdown(false);
  }, [isOpen, editingLog]);

  if (!isOpen) return null;

  const handleClose = () => {
    onClose();
  };
  const handleAdd = () => {
    if (!startDate || !endDate) {
      toast.error('Please select a start and end date');
      return;
    }
    const payload: WorkLogPayload = {
      technician: { name: technician.name, initials: technician.initials, color: technician.color },
      start: startDate,
      end: endDate,
      description,
    };
    if (editingLog) {
      onUpdate?.(editingLog.id, payload);
      toast.success('Work log updated');
    } else {
      onAdd?.(payload);
      toast.success('Work log added');
    }
    handleClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 z-[10003]" onClick={handleClose} />

      {/* Side Panel */}
      <div className="fixed top-0 right-0 h-full w-[680px] max-w-[94vw] bg-white shadow-2xl z-[10004] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB] flex-shrink-0">
          <h2 className="text-[18px] font-semibold text-[#111827]">{editingLog ? 'Edit Work Log' : 'Add Work Log'}</h2>
          <button onClick={handleClose} className="flex size-8 flex-shrink-0 items-center justify-center rounded transition-colors hover:bg-[#F3F4F6] text-[#6B7280] hover:text-[#111827]">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto px-6 py-5 space-y-5">
          {/* Technician */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-[13px] text-[#4A5568] mb-1.5">
                Technician <span className="text-[#EF4444]">*</span>
              </label>
              <div className="relative">
                <button
                  onClick={() => setShowTechDropdown((v) => !v)}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2 border border-[#DFE5ED] rounded-lg hover:border-[#3D8BD0] focus:outline-none focus:border-[#3D8BD0] transition-colors"
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <span
                      className="size-6 rounded flex items-center justify-center text-[10px] font-semibold text-white flex-shrink-0"
                      style={{ backgroundColor: technician.color }}
                    >
                      {technician.initials}
                    </span>
                    <span className="text-[13px] text-[#364658] truncate">
                      {technician.name}
                    </span>
                  </span>
                  <ChevronDown size={16} className="text-[#7B8FA5] flex-shrink-0" />
                </button>
                {showTechDropdown && (
                  <div className="app-menu absolute top-full left-0 right-0 mt-1 bg-white border border-[#DFE5ED] rounded-lg shadow-lg py-1 z-10 max-h-[240px] overflow-auto">
                    {TECHNICIANS.map((t) => (
                      <button
                        key={t.email}
                        onClick={() => {
                          setTechnician(t);
                          setShowTechDropdown(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#F9FAFB] text-left transition-colors"
                      >
                        <span
                          className="size-6 rounded flex items-center justify-center text-[10px] font-semibold text-white flex-shrink-0"
                          style={{ backgroundColor: t.color }}
                        >
                          {t.initials}
                        </span>
                        <span className="text-[13px] text-[#364658] truncate">
                          {t.name}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Start / End Date */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-[13px] text-[#4A5568] mb-1.5">
                Start Date <span className="text-[#EF4444]">*</span>
              </label>
              <DateField mode="datetime" value={startDate} onChange={setStartDate} placeholder="Select" />
            </div>
            <div>
              <label className="block text-[13px] text-[#4A5568] mb-1.5">
                End Date <span className="text-[#EF4444]">*</span>
              </label>
              <DateField mode="datetime" value={endDate} onChange={setEndDate} placeholder="Select" />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-[13px] text-[#4A5568] mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              placeholder="Description"
              className="w-full px-3 py-2 border border-[#DFE5ED] rounded text-[13px] text-[#364658] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#3D8BD0] resize-none transition-colors"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#E5E7EB] flex-shrink-0">
          <button
            onClick={handleAdd}
            className="px-5 py-2 bg-[#3D8BD0] text-white text-[14px] font-medium rounded hover:bg-[#2C6B9F] transition-colors"
          >
            {editingLog ? 'Update' : 'Add'}
          </button>
          <button
            onClick={handleClose}
            className="px-5 py-2 border border-[#DFE5ED] text-[#364658] text-[14px] font-medium rounded hover:bg-[#F3F4F6] transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </>
  );
}
