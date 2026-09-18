/* Support Portal builder — ADDING a banner.
 *
 * Two questions, in the order they actually depend on each other: which SHAPE the banner is, then
 * which banner. Orientation is not a style — a vertical banner turns the whole page into two
 * columns and moves every section beside it — so it cannot be a row inside a list of banners, and
 * it decides which banners there are to show.
 *
 * ⚠️ A DIALOG, against this builder's own habit of avoiding them. Adding a banner is a genuine fork
 * that reshapes the page, and the choice is made from pictures: at 340px the design panel fits two
 * thumbnails a row and turns a shelf of banners into a scroll. The rule this builder keeps is that a
 * dialog must not appear on every click of a picker — this one appears once, when there is no
 * banner at all.
 *
 * ⚠️ The tiles are the Banners panel's own (`BannerThumb`, `BannerScratchThumb`, `BannerTile`), so
 * the shelf you pick from here and the shelf you swap from later cannot drift apart.
 *
 * ⚠️ Orientation stays reachable afterwards: the Banners rail panel has both tabs, so nothing here
 * is a one-way door. */

import { useState } from 'react';
import { ArrowLeft, X } from 'lucide-react';
import { BannerScratchThumb, BannerThumb, BannerTile } from './PortalBannersPanel';
import type { BannerOrientation } from './PortalBannersPanel';
import { BANNER_INDUSTRIES, BANNER_TEMPLATES } from './portalBannerTemplates';
import type { BannerIndustry } from './portalBannerTemplates';

/** What the admin chose: an orientation, and a template — or `null` for the blank start. */
export interface BannerStart {
  orientation: BannerOrientation;
  templateId: string | null;
}

/* ── Step 1: the shape ─────────────────────────────────────────────────────────────────────── */

/* ⚠️ Drawn as PAGES, not as banners. The difference between the two is what happens to everything
   else on the page, so a picture of the band alone would be answering a different question. */
function ShapeArt({ orientation }: { orientation: BannerOrientation }) {
  const card = 'rounded-[3px] bg-white';
  const band = 'bg-gradient-to-br from-[#3D8BD0] to-[#0B2545]';
  if (orientation === 'vertical') {
    return (
      <span className="flex h-[108px] w-full overflow-hidden rounded-[6px] bg-[#EEF2F6]">
        <span className={`w-[38%] flex-none ${band}`} />
        <span className="grid flex-1 grid-cols-2 content-start gap-[4px] p-[6px]">
          {[18, 18, 26, 26, 14, 14].map((h, i) => <span key={i} className={card} style={{ height: h }} />)}
        </span>
      </span>
    );
  }
  return (
    <span className="flex h-[108px] w-full flex-col overflow-hidden rounded-[6px] bg-[#EEF2F6]">
      <span className={`h-[42px] flex-none ${band}`} />
      <span className="grid flex-1 grid-cols-3 content-start gap-[4px] p-[6px]">
        {[20, 20, 20, 28, 28, 28].map((h, i) => <span key={i} className={card} style={{ height: h }} />)}
      </span>
    </span>
  );
}

function ShapeCard({ orientation, title, blurb, onPick }: {
  orientation: BannerOrientation; title: string; blurb: string; onPick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPick}
      className="group flex flex-col gap-3 rounded-lg border-2 border-[#E5E7EB] bg-white p-3 text-left transition-colors hover:border-[#3D8BD0]"
    >
      <ShapeArt orientation={orientation} />
      <span>
        <span className="block text-[14px] font-semibold text-[#364658] group-hover:text-[#3D8BD0]">{title}</span>
        <span className="mt-1 block text-[12.5px] leading-[1.6] text-[#7B8FA5]">{blurb}</span>
      </span>
    </button>
  );
}

/* ── The dialog ────────────────────────────────────────────────────────────────────────────── */

export function BannerStartDialog({ onPick, onClose }: {
  onPick: (choice: BannerStart) => void;
  onClose: () => void;
}) {
  const [orientation, setOrientation] = useState<BannerOrientation | null>(null);
  const [industry, setIndustry] = useState<'all' | BannerIndustry>('all');
  const list = BANNER_TEMPLATES.filter(
    (t) => t.orientation === orientation && (industry === 'all' || t.industries.includes(industry)),
  );

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-6">
      <div className="flex max-h-full w-[880px] max-w-full flex-col overflow-hidden rounded-lg bg-white shadow-2xl">
        <div className="flex flex-none items-start gap-3 border-b border-[#E5E7EB] px-5 py-4">
          {/* ⚠️ Back, not a stepper. There are two steps and the first is one click — a numbered
              rail above two tiles is more chrome than the flow it describes. */}
          {orientation && (
            <button
              onClick={() => setOrientation(null)}
              title="Back to shape"
              className="-ml-1 flex size-8 flex-shrink-0 items-center justify-center rounded text-[#64748B] transition-colors hover:bg-[#F3F4F6] hover:text-[#364658]"
            ><ArrowLeft size={17} /></button>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="text-[16px] font-semibold text-[#364658]">
              {orientation === null
                ? 'Add a banner'
                : orientation === 'vertical' ? 'Vertical banners' : 'Horizontal banners'}
            </h2>
            <p className="mt-0.5 text-[12.5px] leading-[1.5] text-[#7B8FA5]">
              {orientation === null
                ? 'A banner is the first thing a requester sees. Start by choosing where it sits on the page.'
                : orientation === 'vertical'
                ? 'A column beside the page. Every section moves into the space next to it, and the column stays put while that space scrolls.'
                : 'A band across the top of the page, with every section below it.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex size-8 flex-shrink-0 items-center justify-center rounded text-[#64748B] transition-colors hover:bg-[#F3F4F6]"
          ><X size={18} /></button>
        </div>

        {orientation === null ? (
          <div className="grid flex-1 grid-cols-2 gap-4 overflow-y-auto p-5">
            <ShapeCard
              orientation="horizontal"
              title="Horizontal"
              blurb="A band across the top. The page below it is full width, so a section can hold as many widgets side by side as it has room for."
              onPick={() => setOrientation('horizontal')}
            />
            <ShapeCard
              orientation="vertical"
              title="Vertical"
              blurb="A column down one side, as tall as the screen. It stays in place while the rest of the page scrolls beside it."
              onPick={() => setOrientation('vertical')}
            />
          </div>
        ) : (
          <>
            <div className="flex flex-none items-center gap-2 px-5 pb-1 pt-3">
              <label htmlFor="banner-start-industry" className="text-[12px] text-[#7B8FA5]">Industry</label>
              <select
                id="banner-start-industry"
                value={industry}
                onChange={(e) => setIndustry(e.target.value as 'all' | BannerIndustry)}
                className="app-select h-8 w-[240px] rounded border border-[#DFE5ED] bg-white pl-2.5 text-[12.5px] text-[#364658] focus:border-[#3D8BD0] focus:outline-none"
              >
                <option value="all">All industries</option>
                {BANNER_INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-6 pt-2">
              <div className="grid grid-cols-3 gap-3">
                {/* ⚠️ FIRST, and a tile like any other. "Start from scratch" as a footer link reads as
                    the way out of a picker that failed you; as the first tile it is one more way to
                    begin, which is what it is. */}
                <BannerTile
                  active={false}
                  label="Start from scratch"
                  sub="A plain banner you design yourself"
                  onPick={() => onPick({ orientation, templateId: null })}
                >
                  <BannerScratchThumb orientation={orientation} />
                </BannerTile>
                {list.map((t) => (
                  <BannerTile
                    key={t.id}
                    active={false}
                    label={t.name}
                    sub={t.industries.join(', ')}
                    onPick={() => onPick({ orientation, templateId: t.id })}
                  >
                    <BannerThumb t={t} />
                  </BannerTile>
                ))}
              </div>
              {list.length === 0 && (
                <p className="py-6 text-center text-[12.5px] text-[#7B8FA5]">
                  No {orientation} banners for this industry — start from scratch, or choose another.
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
