/* #/portal — the Support Portal as a REQUESTER sees it, reached from the profile popup's
 * "Switch to Support Portal" (Zeni, 15 Oct 2026: the default portal, requester view).
 *
 * The prototype stores no published portal anywhere — admin portal pages live in the Support Portal
 * module's memory — so this renders the DEFAULT portal design, the same one the admin listing's
 * thumbnail and a new portal's starting point use. It is the read-only render (the canvas context's
 * default is READONLY_CANVAS), so nothing on it is selectable or editable.
 * One floating button (bottom-LEFT — the portal keeps its own floating button bottom-right) leads back
 * to the technician app; it is the only chrome this page adds. */
import { ArrowLeftRight } from 'lucide-react';
import { SupportPortalPreview } from './SupportPortalPreview';
import { DEFAULT_THEME, swatchesOf } from './PortalThemePanel';

const ACCENT = swatchesOf(DEFAULT_THEME)[3];

export function RequesterPortalPage({ onBack }: { onBack: () => void }) {
  return (
    <div className="h-screen overflow-y-auto bg-[#F4F6FA]">
      <SupportPortalPreview accent={ACCENT} />
      <button
        onClick={onBack}
        className="fixed bottom-5 left-5 z-50 inline-flex h-9 items-center gap-2 rounded bg-[#3D8BD0] px-4 text-[13px] font-medium text-white shadow-[0_6px_18px_rgba(16,24,40,0.18)] transition-colors hover:bg-[#2F7AB8]"
      >
        <ArrowLeftRight size={15} /> Switch to Technician Portal
      </button>
    </div>
  );
}
