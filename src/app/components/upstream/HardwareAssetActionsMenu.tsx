/* VENDORED from the upstream prototype (ronak-patel-motadata/ServiceOps-Ticket-Detail-, Oct 2026 sync).
   Used ONLY by the detail pages and listings brought in from upstream — this project's own detail
   pages keep their own version in ../. Do not edit to change our pages; edit ../ instead. */
import { useState, useRef, useEffect } from 'react';
import {
  MoreVertical, UserCheck, RefreshCw, ScanLine, Lock, RotateCcw, Power, Moon,
  Sunrise, Ban, Monitor, History, Repeat, Archive, Printer, Trash2, Barcode, XCircle, PackageCheck, MinusSquare,
  Package, Download, X, CopyPlus,
} from 'lucide-react';

interface HardwareAssetActionsMenuProps {
  onOpenApprovalPopup?: () => void;
  onOpenAddBarcode?: () => void;
  // Reduced menu (software assets): only Add Barcode, Archive, Print
  minimal?: boolean;
  // Non-IT asset menu: Ask for Approval, Add Barcode, Used By/Location History, Archive, Print
  nonIt?: boolean;
  // Contract menu: only Cancel Contract, Archive, Print
  contract?: boolean;
  // Purchase menu: only Receive Items, Print
  purchase?: boolean;
  // CMDB / CI menu: Ask for Approval, Sync Warranty, Scan Now, Exclude From Scan, Used By/Location History
  cmdb?: boolean;
  // Patch menu: ONLY Deploy Patch + Download to File Server
  patch?: boolean;
  // Patch DEPLOYMENT menu: ONLY Update Configuration + Cancel Deployment
  patchDeploy?: boolean;
  // Knowledge article menu: Ask for Approval, Print, Delete
  knowledge?: boolean;
  /** Report detail page: Duplicate + Delete only. */
  report?: boolean;
}

export function HardwareAssetActionsMenu({ onOpenApprovalPopup, onOpenAddBarcode, minimal = false, nonIt = false, contract = false, purchase = false, cmdb = false, patch = false, patchDeploy = false, knowledge = false, report = false }: HardwareAssetActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) {
      document.addEventListener('mousedown', onClick);
      return () => document.removeEventListener('mousedown', onClick);
    }
  }, [open]);

  const close = () => setOpen(false);

  const Item = ({ onClick, icon, label, danger = false }: { onClick?: () => void; icon: React.ReactNode; label: string; danger?: boolean }) => (
    <button
      onClick={() => { onClick?.(); close(); }}
      className={`flex w-full items-center gap-2.5 px-4 py-2 text-left text-[13px] transition-colors ${danger ? 'text-[#DC2626] hover:bg-[#FEF3F2]' : 'text-[#364658] hover:bg-[#F9FAFB]'}`}
    >
      <span className={`flex-shrink-0 ${danger ? 'text-[#DC2626]' : 'text-[#6B7280]'}`}>{icon}</span>
      <span className="flex-1">{label}</span>
    </button>
  );

  const Divider = () => <div className="my-1 border-t border-[#F0F2F5]" />;
  const Section = ({ label }: { label: string }) => (
    <div className="px-4 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF]">{label}</div>
  );

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="inline-flex items-center justify-center h-8 w-8 bg-white border border-[#DFE5ED] rounded hover:bg-[#F5F7FA]">
        <MoreVertical size={16} className="text-[#6b7280]" />
      </button>

      {open && minimal && (
        <div className="app-menu absolute right-0 top-full mt-1 w-[200px] bg-white rounded-lg shadow-lg border border-[#DFE5ED] py-1 z-[9999]">
          <Item onClick={onOpenAddBarcode} label="Add Barcode" icon={<Barcode size={15} />} />
          <Item label="Archive" icon={<Archive size={15} />} />
          <Item label="Print" onClick={() => window.print()} icon={<Printer size={15} />} />
        </div>
      )}

      {open && nonIt && (
        <div className="app-menu absolute right-0 top-full mt-1 w-[210px] bg-white rounded-lg shadow-lg border border-[#DFE5ED] py-1 z-[9999]">
          <Section label="Actions" />
          <Item onClick={onOpenApprovalPopup} label="Ask for Approval" icon={<UserCheck size={15} />} />
          <Item onClick={onOpenAddBarcode} label="Add Barcode" icon={<Barcode size={15} />} />
          <Item label="Used By History" icon={<History size={15} />} />
          <Item label="Location History" icon={<History size={15} />} />
          <Divider />
          <Section label="Record" />
          <Item label="Archive" icon={<Archive size={15} />} />
          <Item label="Print" onClick={() => window.print()} icon={<Printer size={15} />} />
        </div>
      )}

      {open && contract && (
        <div className="app-menu absolute right-0 top-full mt-1 w-[200px] bg-white rounded-lg shadow-lg border border-[#DFE5ED] py-1 z-[9999]">
          <Item label="Cancel Contract" icon={<XCircle size={15} />} />
          <Item label="Archive" icon={<Archive size={15} />} />
          <Item label="Print" onClick={() => window.print()} icon={<Printer size={15} />} />
        </div>
      )}

      {open && purchase && (
        <div className="app-menu absolute right-0 top-full mt-1 w-[190px] bg-white rounded-lg shadow-lg border border-[#DFE5ED] py-1 z-[9999]">
          <Item label="Receive Items" icon={<PackageCheck size={15} />} />
          <Item label="Print" onClick={() => window.print()} icon={<Printer size={15} />} />
        </div>
      )}

      {open && patch && (
        <div className="app-menu absolute right-0 top-full mt-1 w-[220px] bg-white rounded-lg shadow-lg border border-[#DFE5ED] py-1 z-[9999]">
          <Item label="Deploy Patch" icon={<Package size={15} />} />
          <Item label="Download to File Server" icon={<Download size={15} />} />
        </div>
      )}

      {open && report && (
        <div className="app-menu absolute right-0 top-full mt-1 w-[190px] rounded-lg border border-[#DFE5ED] bg-white py-1 shadow-lg z-[9999]">
          <Item label="Duplicate" icon={<CopyPlus size={15} />} />
          <Item label="View History" icon={<History size={15} />} />
          <Divider />
          <Item label="Delete" icon={<Trash2 size={15} />} danger />
        </div>
      )}

      {open && knowledge && (
        <div className="app-menu absolute right-0 top-full mt-1 w-[210px] rounded-lg border border-[#DFE5ED] bg-white py-1 shadow-lg z-[9999]">
          <Item onClick={onOpenApprovalPopup} label="Ask for Approval" icon={<UserCheck size={15} />} />
          <Item label="Print" icon={<Printer size={15} />} />
          <Divider />
          <Item label="Delete" icon={<Trash2 size={15} />} danger />
        </div>
      )}

      {open && patchDeploy && (
        <div className="app-menu absolute right-0 top-full mt-1 w-[230px] bg-white rounded-lg shadow-lg border border-[#DFE5ED] py-1 z-[9999]">
          <Item label="Update Configuration" icon={<UserCheck size={15} />} />
          <Item label="Cancel Deployment" icon={<X size={15} />} />
        </div>
      )}

      {open && cmdb && (
        <div className="app-menu absolute right-0 top-full mt-1 w-[210px] bg-white rounded-lg shadow-lg border border-[#DFE5ED] py-1 z-[9999]">
          <Section label="Actions" />
          <Item onClick={onOpenApprovalPopup} label="Ask for Approval" icon={<UserCheck size={15} />} />
          <Item label="Sync Warranty" icon={<RefreshCw size={15} />} />
          <Item label="Scan Now" icon={<ScanLine size={15} />} />
          <Divider />
          <Section label="Remote" />
          <Item label="Exclude From Scan" icon={<MinusSquare size={15} />} />
          <Divider />
          <Section label="History" />
          <Item label="Used By History" icon={<History size={15} />} />
          <Item label="Location History" icon={<History size={15} />} />
          <Divider />
          <Section label="Record" />
          <Item label="Archive" icon={<Archive size={15} />} />
          <Item label="Print" icon={<Printer size={15} />} />
        </div>
      )}

      {open && !minimal && !nonIt && !contract && !purchase && !cmdb && !patch && !patchDeploy && !knowledge && !report && (
        <div className="app-menu absolute right-0 top-full mt-1 w-[220px] bg-white rounded-lg shadow-lg border border-[#DFE5ED] py-1 z-[9999] max-h-[70vh] overflow-y-auto">
          <Section label="Actions" />
          <Item onClick={onOpenApprovalPopup} label="Ask for Approval" icon={<UserCheck size={15} />} />
          <Item onClick={onOpenAddBarcode} label="Add Barcode" icon={<Barcode size={15} />} />
          <Item label="Sync Warranty" icon={<RefreshCw size={15} />} />
          <Item label="Scan Now" icon={<ScanLine size={15} />} />

          <Divider />

          <Section label="Power" />
          <Item label="Lock" icon={<Lock size={15} />} />
          <Item label="Restart" icon={<RotateCcw size={15} />} />
          <Item label="ShutDown" icon={<Power size={15} />} />
          <Item label="Sleep" icon={<Moon size={15} />} />
          <Item label="Wake Up Now" icon={<Sunrise size={15} />} />

          <Divider />

          <Section label="Remote" />
          <Item label="Exclude From Scan" icon={<Ban size={15} />} />
          <Item label="Remote Desktop" icon={<Monitor size={15} />} />

          <Divider />

          <Section label="History" />
          <Item label="RDP History" icon={<History size={15} />} />
          <Item label="Reconcile" icon={<Repeat size={15} />} />
          <Item label="Used By History" icon={<History size={15} />} />
          <Item label="Location History" icon={<History size={15} />} />
          <Item label="Action History" icon={<History size={15} />} />

          <Divider />

          <Section label="Record" />
          <Item label="Archive" icon={<Archive size={15} />} />
          <Item label="Print" onClick={() => window.print()} icon={<Printer size={15} />} />
        </div>
      )}
    </div>
  );
}
