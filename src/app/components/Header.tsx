import { Plus, Calendar, Bell, Settings, Keyboard, Info } from 'lucide-react';
import { useEffect, useState } from 'react';
import svgPaths from "../../imports/svg-vmnsig04gh";
import { GlobalSearchButton } from './GlobalSearch';
import { openGlobalShortcuts } from './shortcutContext';

/** Exported so the Support Portal preview renders the same mark the product header does. */
export function MotadataLogo() {
  return (
    <div className="h-[28.577px] w-[99.563px]">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 99.5625 28.5767">
        <g id="motadata logo">
          <path d={svgPaths.p2f2fe400} fill="url(#paint0_linear_1_3107)" id="Ellipse 1" />
          <path d={svgPaths.p2faf4780} fill="url(#paint1_linear_1_3107)" id="Path 1" />
          <path d={svgPaths.p47c1f00} fill="url(#paint2_linear_1_3107)" id="Path 2" />
          <path d={svgPaths.p3f5b3100} fill="url(#paint3_linear_1_3107)" id="Path 3" />
          <path d={svgPaths.p30a56e00} fill="url(#paint4_linear_1_3107)" id="Path 4" />
          <path d={svgPaths.p11a07200} fill="var(--fill-0, #363E50)" id="Path 5" />
          <path d={svgPaths.p1d114600} fill="var(--fill-0, #363E50)" id="Path 6" />
          <path d={svgPaths.p23a21000} fill="var(--fill-0, #363E50)" id="Path 7" />
          <path d={svgPaths.pff61c00} fill="var(--fill-0, #363E50)" id="Path 8" />
          <path d={svgPaths.p3a9a9100} fill="var(--fill-0, #363E50)" id="Path 9" />
          <path d={svgPaths.p310a3f00} fill="var(--fill-0, #363E50)" id="Path 10" />
          <path d={svgPaths.p1bbe2500} fill="var(--fill-0, #363E50)" id="Path 11" />
          <path d={svgPaths.p1d63eb80} fill="url(#paint5_linear_1_3107)" id="Path 12" />
          <path d={svgPaths.p2e79a972} fill="url(#paint6_linear_1_3107)" id="Ellipse 2" />
          <g id="Final">
            <path d={svgPaths.p3d83bd80} fill="var(--fill-0, #0F4F81)" id="Path 13" />
            <path d={svgPaths.pa18dc00} fill="var(--fill-0, #31BADA)" id="Path 14" />
            <path d={svgPaths.p69ff70} fill="var(--fill-0, #5FBD6C)" id="Path 15" />
          </g>
          <g id="Final-2">
            <path d={svgPaths.p10194350} fill="var(--fill-0, #0F4F81)" id="Path 16" />
          </g>
          <g id="Final-3">
            <path d={svgPaths.p272c60b2} fill="var(--fill-0, #0F4F81)" id="Path 17" />
            <path d={svgPaths.p3cd4aec0} fill="var(--fill-0, #1A81C4)" id="Path 18" />
          </g>
        </g>
        <defs>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_1_3107" x1="34.7424" x2="88.3066" y1="24.9025" y2="26.1903">
            <stop stopColor="#10122A" />
            <stop offset="0.03" stopColor="#112849" />
            <stop offset="0.09" stopColor="#14578B" />
            <stop offset="0.14" stopColor="#1575B4" />
            <stop offset="0.16" stopColor="#1680C4" />
            <stop offset="0.35" stopColor="#1885C6" />
            <stop offset="0.56" stopColor="#1F92CB" />
            <stop offset="0.79" stopColor="#29A9D4" />
            <stop offset="0.92" stopColor="#31BADA" />
          </linearGradient>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint1_linear_1_3107" x1="34.8391" x2="88.3674" y1="25.0435" y2="26.3329">
            <stop stopColor="#10122A" />
            <stop offset="0.06" stopColor="#112240" />
            <stop offset="0.2" stopColor="#134A79" />
            <stop offset="0.35" stopColor="#1680C4" />
            <stop offset="0.46" stopColor="#1C8DC9" />
            <stop offset="0.65" stopColor="#2CB0D6" />
            <stop offset="0.7" stopColor="#31BADA" />
            <stop offset="0.84" stopColor="#43BBAA" />
            <stop offset="1" stopColor="#59BC6E" />
          </linearGradient>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint2_linear_1_3107" x1="34.3742" x2="87.916" y1="23.6192" y2="24.9146">
            <stop stopColor="#10122A" />
            <stop offset="0.06" stopColor="#112240" />
            <stop offset="0.2" stopColor="#134A79" />
            <stop offset="0.35" stopColor="#1680C4" />
            <stop offset="0.46" stopColor="#1C8DC9" />
            <stop offset="0.65" stopColor="#2CB0D6" />
            <stop offset="0.7" stopColor="#31BADA" />
            <stop offset="0.84" stopColor="#43BBAA" />
            <stop offset="1" stopColor="#59BC6E" />
          </linearGradient>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint3_linear_1_3107" x1="33.0731" x2="86.9829" y1="20.4169" y2="21.715">
            <stop stopColor="#10122A" />
            <stop offset="0.06" stopColor="#112240" />
            <stop offset="0.2" stopColor="#134A79" />
            <stop offset="0.35" stopColor="#1680C4" />
            <stop offset="0.46" stopColor="#1C8DC9" />
            <stop offset="0.65" stopColor="#2CB0D6" />
            <stop offset="0.7" stopColor="#31BADA" />
            <stop offset="0.84" stopColor="#43BBAA" />
            <stop offset="1" stopColor="#59BC6E" />
          </linearGradient>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint4_linear_1_3107" x1="25.4342" x2="79.3255" y1="15.0733" y2="16.3623">
            <stop stopColor="#10122A" />
            <stop offset="0.06" stopColor="#112240" />
            <stop offset="0.2" stopColor="#134A79" />
            <stop offset="0.35" stopColor="#1680C4" />
            <stop offset="0.46" stopColor="#1C8DC9" />
            <stop offset="0.65" stopColor="#2CB0D6" />
            <stop offset="0.7" stopColor="#31BADA" />
            <stop offset="0.84" stopColor="#43BBAA" />
            <stop offset="1" stopColor="#59BC6E" />
          </linearGradient>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint5_linear_1_3107" x1="-15.7663" x2="105.969" y1="11.326" y2="28.979">
            <stop stopColor="#10122A" />
            <stop offset="0.64" stopColor="#1680C4" />
            <stop offset="0.77" stopColor="#1782C5" />
            <stop offset="0.83" stopColor="#1B8AC8" />
            <stop offset="0.88" stopColor="#2197CD" />
            <stop offset="0.92" stopColor="#29AAD4" />
            <stop offset="0.95" stopColor="#31BADA" />
          </linearGradient>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint6_linear_1_3107" x1="-16.1904" x2="105.383" y1="14.6839" y2="32.3007">
            <stop stopColor="#10122A" />
            <stop offset="0.09" stopColor="#112849" />
            <stop offset="0.31" stopColor="#14578B" />
            <stop offset="0.47" stopColor="#1575B4" />
            <stop offset="0.55" stopColor="#1680C4" />
            <stop offset="0.64" stopColor="#1885C6" />
            <stop offset="0.75" stopColor="#1F92CB" />
            <stop offset="0.86" stopColor="#29A9D4" />
            <stop offset="0.92" stopColor="#31BADA" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

/** V1 / V2 of the form-rule editor, beside the logo. Shown only on the form-rule screens. */
function FormRuleUiSwitch() {
  const [hash, setHash] = useState(() => location.hash);
  const [v, setV] = useState(() => { try { const s = localStorage.getItem('formRuleUi'); return s === 'v2' || s === 'v3' ? s : 'v1'; } catch { return 'v1'; } });
  useEffect(() => {
    const on = () => setHash(location.hash);
    window.addEventListener('hashchange', on);
    const t = window.setInterval(on, 500); // replaceState does not fire hashchange
    return () => { window.removeEventListener('hashchange', on); window.clearInterval(t); };
  }, []);
  if (!hash.startsWith('#/admin/request-form')) return null;
  const pick = (x: 'v1' | 'v2' | 'v3') => {
    setV(x);
    try { localStorage.setItem('formRuleUi', x); } catch { /* private mode */ }
    window.dispatchEvent(new Event('form-rule-ui'));
  };
  return (
    <div className="pill-track" title="Form rule editor version">
      <button type="button" aria-pressed={v === 'v1'} onClick={() => pick('v1')}>V1</button>
      <button type="button" aria-pressed={v === 'v2'} onClick={() => pick('v2')}>V2</button>
      <button type="button" aria-pressed={v === 'v3'} onClick={() => pick('v3')}>V3</button>
    </div>
  );
}

interface HeaderProps {
  selectedCount: number;
  /** Opens the Admin hub. Passed only where the gear should navigate. */
  onOpenAdmin?: () => void;
}

export function Header({ selectedCount, onOpenAdmin }: HeaderProps) {
  return (
    <header className="flex h-[56px] items-center justify-between border-b border-[#e5e7eb] bg-white px-6">
      <div className="flex items-center gap-4">
        <MotadataLogo />
        <FormRuleUiSwitch />
      </div>
      
      <div className="flex items-center gap-2">
        <button className="flex h-[32px] w-[32px] items-center justify-center rounded bg-[#3D8BD0] text-white hover:bg-[#2d6ca0]">
          <Plus size={18} strokeWidth={2} />
        </button>

        {/* Global Search — before Calendar. Hides itself for a role with nothing to search. */}
        <GlobalSearchButton />

        <button className="flex h-[32px] w-[32px] items-center justify-center rounded text-[#6b7280] hover:bg-[#f3f4f6]">
          <Calendar size={18} strokeWidth={2} />
        </button>
        
        <button className="flex h-[32px] w-[32px] items-center justify-center rounded text-[#6b7280] hover:bg-[#f3f4f6]">
          <Bell size={18} strokeWidth={2} />
        </button>
        
        <button
          onClick={onOpenAdmin}
          title={onOpenAdmin ? 'Admin' : undefined}
          className="flex h-[32px] w-[32px] items-center justify-center rounded text-[#6b7280] hover:bg-[#f3f4f6]"
        >
          <Settings size={18} strokeWidth={2} />
        </button>
        
        {/* The GLOBAL Keyboard shortcuts panel — every module's keys, opened on the page you are on. */}
        <button onClick={openGlobalShortcuts} title="Keyboard shortcuts (?)" aria-label="Keyboard shortcuts" className="flex h-[32px] w-[32px] items-center justify-center rounded text-[#6b7280] hover:bg-[#f3f4f6]">
          <Keyboard size={18} strokeWidth={2} />
        </button>
        
        {/* The GLOBAL Help guide — opens on the guide for the module you are on. */}
        <button onClick={() => window.dispatchEvent(new CustomEvent('open-global-help'))} title="Help guide" aria-label="Help guide" className="flex h-[32px] w-[32px] items-center justify-center rounded text-[#6b7280] hover:bg-[#f3f4f6]">
          <Info size={18} strokeWidth={2} />
        </button>
        
        <button className="flex h-[32px] w-[32px] items-center justify-center rounded bg-[#3D8BD0] text-[11px] font-semibold text-white hover:bg-[#2d6ca0]">
          AS
        </button>
      </div>
    </header>
  );
}