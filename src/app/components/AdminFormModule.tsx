import { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { FormStudio } from './FormStudio';
import { AdminFormBuilder } from './AdminFormBuilder';
import { useFormStudioUi } from './formStudioUi';
import type { FormModule } from './formStudioData';
import type { FormField } from './formRuleData';

/* One admin form submodule (Problem Form, Vendor Custom Fields…). Each module has ONE form, so the
 * page opens straight into its builder — no listing of one row (Zeni, 2 Nov 2026). Edits live for the
 * session in a module-level store, so leaving the page and coming back keeps them. */

/** Every form leads with its first five fields OUTSIDE any section, then the sections (Zeni, 19 Nov 2026).
 *  Lifts the first five fields to the top in order; a section left with nothing under it is dropped. */
export function leadWithFive(list: FormField[], n = 5): FormField[] {
  const lead = list.filter((f) => f.kind !== 'section').slice(0, n);
  if (!lead.length || list[0]?.kind !== 'section') return list;
  const rest = list.filter((f) => !lead.includes(f));
  const kept = rest.filter((f, i) => f.kind !== 'section' || (rest[i + 1] && rest[i + 1].kind !== 'section'));
  return [...lead, ...kept];
}

const store: Record<string, FormField[]> = ((globalThis as unknown as { __formStudioStore?: Record<string, FormField[]> }).__formStudioStore ??= {});

export function AdminFormModule({ mod }: { mod: FormModule }) {
  const [fields, setFields] = useState<FormField[]>(() => (store[mod.slug] ??= leadWithFive(mod.seed())));
  const onFields = (next: FormField[]) => { store[mod.slug] = next; setFields(next); };
  const ui = useFormStudioUi();
  /** Builder V2 puts its Build / Preview / Save draft / Publish here, beside the heading. */
  const [slot, setSlot] = useState<HTMLDivElement | null>(null);
  /** …and its Draft / Published chip here, right after the title. */
  const [statusSlot, setStatusSlot] = useState<HTMLSpanElement | null>(null);
  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <div className="flex flex-shrink-0 items-start gap-4 px-4 pb-3 pt-4">
        <div className="min-w-0 flex-1">
        <h1 className="flex items-center gap-2 text-[16px] font-semibold text-[#1D2A3E]">{mod.title}<span ref={setStatusSlot} className="inline-flex font-normal" /></h1>
        <p className="mt-0.5 text-[12px] text-[#7B8FA5]">
          {mod.sub}{' '}
          <button type="button" onClick={() => toast('Docs open in the product')} className="inline-flex items-center gap-1 text-[12px] font-medium text-[#3D8BD0] hover:underline">View Docs <ExternalLink size={11} /></button>
        </p>
        </div>
        <div ref={setSlot} className="flex-shrink-0" />
      </div>
      <div className="min-h-0 flex-1 border-t border-[#EEF2F6]">
        {/* Builder V1 = the old product builder; V2–V4 are Form Studio. */}
        {ui === 'v1'
          ? <div className="h-full overflow-y-auto px-4 py-4"><AdminFormBuilder title={mod.title} fields={fields} onFields={onFields} /></div>
          : <FormStudio title={mod.title} noun={mod.noun} fields={fields} onFields={onFields} toolbarSlot={slot} statusSlot={statusSlot} />}
      </div>
    </div>
  );
}
