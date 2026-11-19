import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, BookOpen, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, ClipboardList, Lightbulb, ListChecks, TextCursorInput } from 'lucide-react';
import { setCreateGuideHidden, useCreateGuideHidden } from './createFormUi';
import { FORM_HELP, type FormHelp } from './createFormGuides';

/**
 * The help guide pinned to the right of every create form (Zeni, 30 Oct 2026). Built after the Form
 * Rules guide (FormRuleHelpCard, the final "Soft" look): a title with a dark accent bar, two sections
 * headed by a dark icon tile, and grey accordions that fold on their own.
 *
 * It follows the form: the step whose section is in view is lit, and clicking a step's number scrolls
 * the form to that section. It finds the form through `[data-create-scroll]` and
 * `[data-section-title]`, which CreatePageShell and Section put on the page.
 */

const tile = 'flex size-6 flex-shrink-0 items-center justify-center rounded bg-[#1D2A3E] text-white';

function Accordion({ icon, title, open, onToggle, lit, lead, children }: {
  icon?: React.ReactNode; title: string; open: boolean; onToggle: () => void; lit?: boolean;
  /** A numbered badge in place of the icon (steps). */
  lead?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div data-step-lit={lit || undefined} className={'scroll-mt-12 rounded-lg transition-colors ' + (lit ? 'bg-[#EBF5FF]' : open ? 'bg-[#F4F6FA]' : 'bg-[#F7F9FC] hover:bg-[#F1F4F9]')}>
      <div className="flex items-center gap-2 px-3 py-2.5">
        {lead ?? <span className="flex size-4 flex-shrink-0 items-center justify-center text-[#64748B]">{icon}</span>}
        <button type="button" onClick={onToggle} aria-expanded={open} className="group flex min-w-0 flex-1 items-center gap-2 text-left">
          <span className={'min-w-0 flex-1 text-[13px] text-[#1D2A3E] ' + (open ? 'font-semibold' : 'font-medium')}>{title}</span>
          <ChevronDown size={15} className={'flex-shrink-0 text-[#94A3B8] transition-transform duration-200 group-hover:text-[#475569] ' + (open ? 'rotate-180' : '')} />
        </button>
      </div>
      <div className="grid transition-[grid-template-rows] duration-200 ease-out" style={{ gridTemplateRows: open ? '1fr' : '0fr' }}>
        <div className="min-h-0 overflow-hidden">
          <div className="pb-3.5 pl-[36px] pr-3 text-[12.5px] leading-[1.6] text-[#475569]">{children}</div>
        </div>
      </div>
    </div>
  );
}

const Points = ({ items }: { items: string[] }) => (
  <ul className="mt-2 flex flex-col gap-1.5">
    {items.map((t) => (
      <li key={t} className="flex gap-2"><span className="mt-[8px] size-1 flex-shrink-0 rounded-full bg-[#94A3B8]" /><span className="min-w-0 flex-1">{t}</span></li>
    ))}
  </ul>
);

/** Which step's section is at the top of the form right now. */
function useActiveSection(): { active?: string; present: string[] } {
  const [state, setState] = useState<{ active?: string; present: string[] }>({ present: [] });
  useEffect(() => {
    const box = document.querySelector<HTMLElement>('[data-create-scroll]');
    if (!box) return;
    const read = () => {
      const top = box.getBoundingClientRect().top + 96;
      const secs = [...box.querySelectorAll<HTMLElement>('[data-section-title]')];
      let cur = secs[0]?.dataset.sectionTitle;
      for (const s of secs) if (s.getBoundingClientRect().top <= top) cur = s.dataset.sectionTitle;
      /* scrolled to the foot: the last section is the one being read */
      if (box.scrollTop > 0 && box.scrollTop + box.clientHeight >= box.scrollHeight - 4) cur = secs[secs.length - 1]?.dataset.sectionTitle;
      /* A step clicked in the guide, or a field focused in the form, says where you are better than the
         scroll position does — a short form can never scroll its middle section to the top. */
      if (pinned.title && secs.some((s) => s.dataset.sectionTitle === pinned.title)) cur = pinned.title;
      /* A marker may name several sections, '|'-separated — a merged step or part (V2–V4). */
      const present = secs.flatMap((x) => (x.dataset.sectionTitle ?? '').split('|'));
      setState((p) => (p.active === cur && p.present.join('|') === present.join('|') ? p : { active: cur, present }));
    };
    const onFocus = (e: FocusEvent) => {
      const sec = (e.target as HTMLElement).closest<HTMLElement>('[data-section-title]');
      if (sec) { pinned.title = sec.dataset.sectionTitle; read(); }
    };
    /* Scrolling by hand hands the choice back to the scroll position. */
    const unpin = () => { if (pinned.title) { pinned.title = undefined; read(); } };
    pinned.read = read;
    pinned.title = undefined;
    read();
    box.addEventListener('scroll', read, { passive: true });
    box.addEventListener('focusin', onFocus);
    box.addEventListener('wheel', unpin, { passive: true });
    box.addEventListener('touchmove', unpin, { passive: true });
    const mo = new MutationObserver(read);
    mo.observe(box, { childList: true, subtree: true });
    return () => {
      box.removeEventListener('scroll', read); box.removeEventListener('focusin', onFocus);
      box.removeEventListener('wheel', unpin); box.removeEventListener('touchmove', unpin);
      mo.disconnect(); pinned.read = undefined;
    };
  }, []);
  return state;
}
const pinned: { title?: string; read?: () => void } = {};

const findMarker = (titles: string[]) => {
  const box = document.querySelector<HTMLElement>('[data-create-scroll]');
  const el = [...(box?.querySelectorAll<HTMLElement>('[data-section-title]') ?? [])].find((s) => (s.dataset.sectionTitle ?? '').split('|').some((t) => titles.includes(t)));
  return { box, el };
};
/** Scroll the form to a guide step's section. When it is not on screen (another step in V2/V3, a folded
 *  part in V4) the form is asked to open it first, then the scroll follows once it has rendered. */
const goTo = (titles: string[], onOpen?: (titles: string[]) => void) => {
  let { box, el } = findMarker(titles);
  if (!el && onOpen) {
    onOpen(titles);
    window.setTimeout(() => { const r = findMarker(titles); if (r.box && r.el) scrollToMarker(r.box, r.el); }, 120);
    return;
  }
  if (box && el) scrollToMarker(box, el);
};
const scrollToMarker = (box: HTMLElement, el: HTMLElement) => {
  pinned.title = el.dataset.sectionTitle; pinned.read?.();
  box.scrollTo({ top: box.scrollTop + el.getBoundingClientRect().top - box.getBoundingClientRect().top - 16, behavior: 'smooth' });
};

export function CreateFormHelpPanel({ help, onOpen, available, bare }: {
  help: FormHelp;
  /** Opens a section that is not on screen (switches step / unfolds a part). */
  onOpen?: (titles: string[]) => void;
  /** Every section the form can reach right now, on screen or not. Defaults to what is on screen. */
  available?: string[];
  /** No left border — the host draws its own divider. */
  bare?: boolean;
}) {
  const { active, present } = useActiveSection();
  /* The lit step follows you down the form: bring it into view in the guide when it changes. */
  const asideRef = useRef<HTMLElement>(null);
  useEffect(() => {
    asideRef.current?.querySelector('[data-step-lit]')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [active]);
  /* Steps start open; the reference topics start folded so the steps lead. */
  const [shut, setShut] = useState<string[]>(['fields', 'example', 'mistakes']);
  const toggle = (id: string) => setShut((x) => (x.includes(id) ? x.filter((i) => i !== id) : [...x, id]));

  /* Hide / show (Zeni, 16 Nov 2026): a round arrow on the line between the form and the guide. Hidden, the
     guide's column closes (the host spots [data-guide-rail] and, in the drawer, narrows the drawer too) and the
     arrow stays on that edge, flipped, so the same spot brings the guide back. */
  const hidden = useCreateGuideHidden();
  const handle = (
    <button type="button" onClick={() => setCreateGuideHidden(!hidden)} title={hidden ? 'Show guide' : 'Hide guide'} aria-label={hidden ? 'Show guide' : 'Hide guide'} aria-expanded={!hidden}
      className={'absolute top-[16px] z-20 flex size-5 items-center justify-center rounded-full border border-[#CBD5E1] bg-white text-[#475569] shadow-[0_1px_3px_rgba(15,23,42,0.12)] transition-colors hover:border-[#3D8BD0] hover:bg-[#EBF5FF] hover:text-[#3D8BD0] ' + (hidden ? '-left-8' : '-left-2.5')}>
      {hidden ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
    </button>
  );
  /* Hidden (Zeni, 17 Nov 2026): the arrow becomes a floating "Help guide" button in the same corner. */
  if (hidden) return (
    <aside data-guide-rail className="relative h-full w-0" aria-label={`${help.noun} guide, hidden`}>
      <button type="button" onClick={() => setCreateGuideHidden(false)} aria-expanded={false}
        className="absolute right-3 top-[12px] z-20 inline-flex h-7 items-center gap-1.5 whitespace-nowrap rounded-full border border-[#3D8BD0] bg-white pl-2.5 pr-3 text-[12px] font-medium text-[#3D8BD0] shadow-[0_1px_3px_rgba(15,23,42,0.12)] transition-colors hover:bg-[#EBF5FF]">
        <BookOpen size={13} />Help guide
      </button>
    </aside>
  );

  return (
    <aside ref={asideRef} className={'relative flex h-full min-h-0 flex-col bg-white ' + (bare ? '' : 'border-l border-[#DFE5ED]')} aria-label={`${help.noun} guide`}>
      {handle}
      <div className="flex flex-shrink-0 items-center gap-2 px-4 pb-3 pt-3.5">
        <span className="h-[18px] w-[3px] flex-shrink-0 rounded-full bg-[#1D2A3E]" />
        <h2 className="min-w-0 flex-1 text-[16px] font-medium text-[#1D2A3E]">{help.noun} Guide</h2>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6">
        <p className="text-[12.5px] leading-[1.6] text-[#64748B]">{help.intro}</p>
        {help.introMore && <p className="mt-2 text-[12.5px] leading-[1.6] text-[#64748B]">{help.introMore}</p>}

        {help.before.length > 0 && (
          <div className="mt-3 rounded-lg border border-[#D6E6F5] bg-[#F3F8FD] px-3 py-2.5">
            <div className="flex items-center gap-1.5 text-[12px] font-semibold text-[#1D2A3E]"><ClipboardList size={13} className="text-[#3D8BD0]" />Before you start</div>
            <ul className="mt-1.5 flex flex-col gap-1">
              {help.before.map((b) => (
                <li key={b} className="flex gap-2 text-[12.5px] leading-[1.55] text-[#475569]"><CheckCircle2 size={13} className="mt-[3px] flex-shrink-0 text-[#3D8BD0]" />{b}</li>
              ))}
            </ul>
          </div>
        )}

        <section className="mt-4">
          <div className="sticky top-0 z-10 -mx-4 flex items-center gap-2 bg-white px-4 py-2">
            <span className={tile}><ListChecks size={13} /></span>
            <h3 className="min-w-0 flex-1 text-[15px] font-semibold text-[#1D2A3E]">How to create it</h3>
          </div>
          {help.howHint !== null && <p className="text-[12.5px] leading-[1.55] text-[#64748B]">{help.howHint ?? 'Fill the form top to bottom. The step you are on is highlighted.'}</p>}
          <div className="mt-3 flex flex-col gap-1.5">
            {help.steps.map((s, i) => {
              const id = 'step-' + i;
              const lit = !!active && active.split('|').some((t) => s.section.includes(t));
              const shown = s.section.some((t) => (available ?? present).includes(t));
              return (
                <Accordion key={id} title={s.title} open={!shut.includes(id)} onToggle={() => toggle(id)} lit={lit}
                  lead={(
                    <button type="button" onClick={() => goTo(s.section, onOpen)} disabled={!shown}
                      title={shown ? `Go to ${s.section[0]} in the form` : `${s.section[0]} appears once the fields above it are filled`}
                      className={'flex size-5 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-semibold transition-colors ' + (lit ? 'bg-[#3D8BD0] text-white' : 'bg-white text-[#475569] hover:bg-[#3D8BD0] hover:text-white disabled:hover:bg-white disabled:hover:text-[#475569]')}>
                      {i + 1}
                    </button>
                  )}>
                  {!s.blocks && <div className="mb-1 text-[10.5px] font-semibold uppercase tracking-wider text-[#94A3B8]">{s.section.join(' / ')}</div>}
                  <p>{s.text}</p>
                  {s.tips && <Points items={s.tips} />}
                  {s.blocks?.map((b) => (
                    <div key={b.title} className="mt-3">
                      <div className="text-[12.5px] font-semibold text-[#1D2A3E]">{b.title}</div>
                      {b.text && <p className="mt-0.5">{b.text}</p>}
                      {b.items && (
                        <ul className="mt-1 flex flex-col gap-1">
                          {b.items.map(([k, v]) => (
                            <li key={k} className="flex gap-2"><span className="mt-[8px] size-1 flex-shrink-0 rounded-full bg-[#94A3B8]" /><span className="min-w-0 flex-1"><span className="font-medium text-[#1D2A3E]">{k}:</span> {v}</span></li>
                          ))}
                        </ul>
                      )}
                      {b.note && <p className="mt-1.5"><span className="font-medium text-[#1D2A3E]">Note:</span> {b.note}</p>}
                    </div>
                  ))}
                </Accordion>
              );
            })}
          </div>
        </section>

        <GoodToKnow help={help} shut={shut} toggle={toggle} />
      </div>
    </aside>
  );
}

/** The guide for a module's create form, or nothing when that form has none. */
export function CreateFormHelp({ moduleId, ...rest }: { moduleId: string; onOpen?: (titles: string[]) => void; available?: string[]; bare?: boolean }) {
  const help = FORM_HELP[moduleId];
  return help ? <CreateFormHelpPanel key={moduleId} help={help} {...rest} /> : null;
}
export const hasFormHelp = (moduleId: string) => !!FORM_HELP[moduleId];

/* Every version (V1–V5) shows this ONE guide for a form — the same full guide on every step
   (Zeni, 30 Oct 2026); only the lit step changes. There is no per-step guide. */
function GoodToKnow({ help, shut, toggle }: { help: FormHelp; shut: string[]; toggle: (id: string) => void }) {
  /* A guide written as steps only (Compliance Audit) has nothing to put here. */
  if (!help.fields.length && !help.example && !help.mistakes.length) return null;
  return (
    <section className="mt-5 border-t border-[#E5E9F0] pt-3">
      <div className="sticky top-0 z-10 -mx-4 flex items-center gap-2 bg-white px-4 py-2">
        <span className={tile}><BookOpen size={13} /></span>
        <h3 className="min-w-0 flex-1 text-[15px] font-semibold text-[#1D2A3E]">Good to know</h3>
      </div>
      <div className="mt-2 flex flex-col gap-1.5">
        {help.fields.length > 0 && <Accordion icon={<TextCursorInput size={14} />} title="Fields explained" open={!shut.includes('fields')} onToggle={() => toggle('fields')}>
          <dl className="flex flex-col gap-2">{help.fields.map(([k, t]) => <div key={k}><dt className="font-semibold text-[#1D2A3E]">{k}</dt><dd>{t}</dd></div>)}</dl>
        </Accordion>}
        {help.example && <Accordion icon={<Lightbulb size={14} />} title="Example" open={!shut.includes('example')} onToggle={() => toggle('example')}>
          <div className="rounded-md bg-white px-3 py-2">
            <div className="text-[12.5px] font-semibold text-[#1D2A3E]">{help.example!.title}</div>
            <dl className="mt-1.5 grid grid-cols-[minmax(0,40%)_1fr] gap-x-3 gap-y-1">
              {help.example!.rows.map(([k, t]) => [<dt key={k + 'k'} className="text-[#94A3B8]">{k}</dt>, <dd key={k + 'v'} className="text-[#1D2A3E]">{t}</dd>])}
            </dl>
          </div>
        </Accordion>}
        {help.mistakes.length > 0 && <Accordion icon={<AlertTriangle size={14} />} title="Common mistakes" open={!shut.includes('mistakes')} onToggle={() => toggle('mistakes')}>
          <Points items={help.mistakes} />
        </Accordion>}
      </div>
    </section>
  );
}
