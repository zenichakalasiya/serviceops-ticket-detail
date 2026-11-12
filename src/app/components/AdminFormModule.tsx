import { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { FormStudio } from './FormStudio';
import type { FormModule } from './formStudioData';
import type { FormField } from './formRuleData';

/* One admin form submodule (Problem Form, Vendor Custom Fields…). Each module has ONE form, so the
 * page opens straight into its builder — no listing of one row (Zeni, 2 Nov 2026). Edits live for the
 * session in a module-level store, so leaving the page and coming back keeps them. */

const store: Record<string, FormField[]> = ((globalThis as unknown as { __formStudioStore?: Record<string, FormField[]> }).__formStudioStore ??= {});

export function AdminFormModule({ mod }: { mod: FormModule }) {
  const [fields, setFields] = useState<FormField[]>(() => (store[mod.slug] ??= mod.seed()));
  const onFields = (next: FormField[]) => { store[mod.slug] = next; setFields(next); };
  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <div className="flex-shrink-0 px-4 pb-3 pt-4">
        <h1 className="text-[16px] font-semibold text-[#1D2A3E]">{mod.title}</h1>
        <p className="mt-0.5 text-[12px] text-[#7B8FA5]">
          {mod.sub}{' '}
          <button type="button" onClick={() => toast('Docs open in the product')} className="inline-flex items-center gap-1 text-[12px] font-medium text-[#3D8BD0] hover:underline">View Docs <ExternalLink size={11} /></button>
        </p>
      </div>
      <div className="min-h-0 flex-1 border-t border-[#EEF2F6]">
        <FormStudio title={mod.title} noun={mod.noun} fields={fields} onFields={onFields} />
      </div>
    </div>
  );
}
