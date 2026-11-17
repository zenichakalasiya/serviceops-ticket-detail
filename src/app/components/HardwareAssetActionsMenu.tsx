import { useState, useRef, useEffect } from 'react';
import {
  MoreVertical, UserCheck, RefreshCw, ScanLine, Lock, RotateCcw, Power, Moon,
  Sunrise, Ban, Monitor, History, Repeat, Archive, Printer, Barcode, XCircle, PackageCheck, MinusSquare,
  Package, Download, X, Pause, Play,
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
  /** Patch deployment: pause / resume the run. `deployPaused` swaps the item to Resume; a reason disables Pause. */
  deployPaused?: boolean;
  onTogglePause?: () => void;
  pauseDisabledReason?: string | null;
}

export function HardwareAssetActionsMenu({ onOpenApprovalPopup, onOpenAddBarcode, minimal = false, nonIt = false, contract = false, purchase = false, cmdb = false, patch = false, patchDeploy = false, deployPaused = false, onTogglePause, pauseDisabledReason }: HardwareAssetActionsMenuProps) {
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

  const Item = ({ onClick, icon, label }: { onClick?: () => void; icon: React.ReactNode; label: string }) => (
    <button
      onClick={() => { onClick?.(); close(); }}
      className="w-full px-4 py-2 text-[13px] text-left hover:bg-[#F9FAFB] text-[#364658] transition-colors flex items-center gap-2.5"
    >
      <span className="text-[#6B7280] flex-shrink-0">{icon}</span>
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
        <div className="absolute right-0 top-full mt-1 w-[200px] bg-white rounded-lg shadow-lg border border-[#DFE5ED] py-1 z-[9999]">
          <Item onClick={onOpenAddBarcode} label="Add Barcode" icon={<Barcode size={15} />} />
          <Item label="Archive" icon={<Archive size={15} />} />
          <Item label="Print" onClick={() => window.print()} icon={<Printer size={15} />} />
        </div>
      )}

      {open && nonIt && (
        <div className="absolute right-0 top-full mt-1 w-[210px] bg-white rounded-lg shadow-lg border border-[#DFE5ED] py-1 z-[9999]">
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
        <div className="absolute right-0 top-full mt-1 w-[200px] bg-white rounded-lg shadow-lg border border-[#DFE5ED] py-1 z-[9999]">
          <Item label="Cancel Contract" icon={<XCircle size={15} />} />
          <Item label="Archive" icon={<Archive size={15} />} />
          <Item label="Print" onClick={() => window.print()} icon={<Printer size={15} />} />
        </div>
      )}

      {open && purchase && (
        <div className="absolute right-0 top-full mt-1 w-[190px] bg-white rounded-lg shadow-lg border border-[#DFE5ED] py-1 z-[9999]">
          <Item label="Receive Items" icon={<PackageCheck size={15} />} />
          <Item label="Print" onClick={() => window.print()} icon={<Printer size={15} />} />
        </div>
      )}

      {open && patch && (
        <div className="absolute right-0 top-full mt-1 w-[220px] bg-white rounded-lg shadow-lg border border-[#DFE5ED] py-1 z-[9999]">
          <Item label="Deploy Patch" icon={<Package size={15} />} />
          <Item label="Download to File Server" icon={<Download size={15} />} />
        </div>
      )}

      {open && patchDeploy && (
        <div className="absolute right-0 top-full mt-1 w-[230px] bg-white rounded-lg shadow-lg border border-[#DFE5ED] py-1 z-[9999]">
          <Item label="Update Configuration" icon={<UserCheck size={15} />} />
          {deployPaused ? (
            <Item onClick={onTogglePause} label="Resume Deployment" icon={<Play size={15} />} />
          ) : (
            /* A disabled button swallows the pointer, so its reason hangs on a wrapper. */
            <span className="block" title={pauseDisabledReason ?? undefined}>
            <button
              type="button"
              disabled={!!pauseDisabledReason}
              onClick={() => { onTogglePause?.(); close(); }}
              className="w-full px-4 py-2 text-[13px] text-left text-[#364658] transition-colors flex items-center gap-2.5 enabled:hover:bg-[#F9FAFB] disabled:pointer-events-none disabled:opacity-50"
            >
              <span className="text-[#6B7280] flex-shrink-0"><Pause size={15} /></span>
              <span className="flex-1">Pause Deployment</span>
              <span className="rounded bg-[#FEF3C7] px-1.5 py-px text-[10px] font-semibold text-[#B45309]">NEW</span>
            </button>
            </span>
          )}
          <Item label="Cancel Deployment" icon={<X size={15} />} />
        </div>
      )}

      {open && cmdb && (
        <div className="absolute right-0 top-full mt-1 w-[210px] bg-white rounded-lg shadow-lg border border-[#DFE5ED] py-1 z-[9999]">
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

      {open && !minimal && !nonIt && !contract && !purchase && !cmdb && !patch && !patchDeploy && (
        <div className="absolute right-0 top-full mt-1 w-[220px] bg-white rounded-lg shadow-lg border border-[#DFE5ED] py-1 z-[9999] max-h-[70vh] overflow-y-auto">
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
