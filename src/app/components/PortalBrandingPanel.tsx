import { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Field, SelectField, Segmented, TextField, ToggleRow } from './PortalControls';

/* Branding — what this portal calls itself and who a requester contacts.
 *
 * ⚠️ Only the settings that belong to THIS portal. It used to carry the technician portal's title
 * and help block, the login-screen choice, the setup-guide image and five asset uploaders — org-wide
 * surfaces an admin reaches from Admin › Branding. Showing them here made the builder look like it
 * edited the whole product, and put settings in front of you that nothing on this canvas could ever
 * reflect. The footer note says where those live instead, so the removal reads as a signpost rather
 * than a gap.
 *
 * ⚠️ And the LOGO is not here any more. It is edited by selecting the logo on the page, where its
 * upload sits in the element's own Content section — an image you can see is an image you should be
 * able to click.
 *
 * ⚠️ NO IMAGE UPLOADS AT ALL now — the help icon was the last one, and it went for the same reason
 * the logo did. An image is a thing you look at; a panel is where you edit the thing you cannot see.
 * Everything left here is a word, an address or a switch, which is what makes the panel one kind of
 * surface rather than a settings list with a file picker halfway down it. */

/* A read-only row: the value is a fact about the tenant, not a setting.
 *
 * ⚠️ It renders inside `Field`, like every other row here. It used to carry its own `mb-4` while
 * `Field` spaces with `mt-4 first:mt-0` — bottom margin against top margin, so the very first pair
 * on the panel (Portal name → Company) had NO gap at all while a Field following a hand-spaced row
 * got a double one. One wrapper owning the rhythm is the only way that cannot come back. */
function ReadOnly({ label, value }: { label: string; value: string }) {
  return (
    <Field label={label}>
      {/* ⚠️ Shown, not hidden. Which company and which URL this portal answers on is the first thing
          anyone needs to confirm they are editing the right one — and a disabled field says "this is
          decided elsewhere" far better than an absence does. */}
      <div className="flex h-9 w-full items-center rounded border border-[#E5E7EB] bg-[#F7F9FC] px-2.5 text-[13px] text-[#7B8FA5]">
        {value}
      </div>
    </Field>
  );
}

/* ⚠️ NO rule under a section head. A heading and the fields beneath it are one block, and a hairline
   between them cuts the title away from what it is titling — the line lands where the relationship
   is strongest instead of where the sections actually divide. The space above (`mt-7`) is what
   separates one section from the last. */
const Head = ({ children }: { children: React.ReactNode }) => (
  <p className="mb-1 mt-7 text-[13px] font-semibold text-[#364658]">{children}</p>
);

export function PortalBrandingPanel() {
  const [v, setV] = useState<Record<string, string>>({
    name: 'Acme Support',
    title: '',
    landing: 'home',
    idp: 'None — use ServiceOps login',
    email: '',
    phone: '',
  });
  const set = (k: string, x: string) => setV((p) => ({ ...p, [k]: x }));

  /* Help for the requester — its own state rather than another string in `v`, because it is a
     switch, a file, a choice and a URL rather than one more text field. */
  const [help, setHelp] = useState(true);
  const [helpKind, setHelpKind] = useState<'url' | 'file'>('url');
  const [helpUrl, setHelpUrl] = useState('https://docs.motadata.com/serviceops-docs/');
  const [helpDoc, setHelpDoc] = useState('');
  const docRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-3">
        <Field label="Portal name">
          <TextField value={v.name} onChange={(x) => set('name', x)} />
        </Field>

        <ReadOnly
          label="Company"
          value="Acme Corporation"
        />
        <ReadOnly
          label="Portal URL"
          value="https://support.acme.com"
        />

        {/* ⚠️ No "Inherited" badge. It marked a row whose value still came from the org-wide
            setting, but it appeared and vanished as you typed — a label that moves while you use the
            field, on a panel where the placeholder already shows what the value falls back to. */}
        <Field label="Support Portal Title">
          <TextField value={v.title} onChange={(x) => set('title', x)} placeholder="Support Portal" />
        </Field>

        <Field label="Landing Page for Guest Users">
          <Segmented
            value={v.landing}
            onChange={(x) => set('landing', x)}
            options={[{ value: 'home', label: 'Home Page' }, { value: 'login', label: 'Login Page' }]}
          />
        </Field>

        <Head>Help</Head>
        {/* Everything below hangs off this switch, so it is the first thing asked. */}
        <ToggleRow
          label="Enable Help For Support Portal"
          on={help}
          onChange={setHelp}
        />
        {/* ⚠️ The rest is REMOVED when help is off, not greyed. A disabled field under a switch you
            have just turned off is a control explaining a state you can already see. */}
        {help && (
          <div className="mt-5">
            {/* ⚠️ Where help GOES is a different question from what it looks like, and the two
                answers are mutually exclusive — a link out to docs, or a file you host. The segment
                swaps the field rather than showing both, so there is never a filled URL sitting
                under an attachment that overrides it. */}
            <div>
              <Segmented
                value={helpKind}
                onChange={(x) => setHelpKind(x as 'url' | 'file')}
                options={[{ value: 'url', label: 'URL' }, { value: 'file', label: 'Attachment' }]}
              />
            </div>

            {helpKind === 'url' ? (
              <div className="mt-4">
                <p className="mb-1 text-[12px] text-[#7B8FA5]">URL <span className="text-[#EF4444]">*</span></p>
                <TextField
                  value={helpUrl}
                  onChange={setHelpUrl}
                  placeholder="https://docs.motadata.com/serviceops-docs/"
                />
                {/* Required, and said so BEFORE you save rather than after. */}
                {!helpUrl.trim() && (
                  <p className="mt-1.5 text-[11px] leading-[1.5] text-[#B54708]">
                    Help is on but has nowhere to go — requesters will see the icon and nothing will happen.
                  </p>
                )}
              </div>
            ) : (
              <div className="mt-4">
                <p className="mb-1 text-[12px] text-[#7B8FA5]">Attachment <span className="text-[#EF4444]">*</span></p>
                <button
                  onClick={() => docRef.current?.click()}
                  className="inline-flex h-9 w-full items-center justify-center gap-2 rounded border border-dashed border-[#D9E0EA] bg-white px-3 text-[13px] font-medium text-[#364658] transition-colors hover:border-[#3D8BD0] hover:text-[#3D8BD0]"
                ><Upload size={14} /> {helpDoc || 'Upload a help document'}</button>
                <input
                  ref={docRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.html"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    setHelpDoc(f.name);
                    toast.success(`${f.name} uploaded`);
                  }}
                />
              </div>
            )}
          </div>
        )}

        <Head>Sign-on</Head>
        <Field label="Identity Provider">
          <SelectField
            value={v.idp}
            onChange={(x) => set('idp', x)}
            options={['None — use ServiceOps login', 'Azure AD', 'Okta', 'Google Workspace', 'SAML 2.0']}
          />
        </Field>
        <Head>Contact shown on the portal</Head>
        <Field label="Support Email">
          <TextField value={v.email} onChange={(x) => set('email', x)} placeholder="servicedesk@acme.com" />
        </Field>
        <Field label="Support Contact No.">
          <TextField value={v.phone} onChange={(x) => set('phone', x)} placeholder="+91 79 4040 0000" />
        </Field>
      </div>

      {/* ⚠️ A STICKY footer, unlike the rest of the builder. Everything else on this canvas applies
          live, but branding reaches every login screen and every other portal — so it takes a
          deliberate Save rather than changing the product under someone who was only looking. */}
      <div className="flex flex-shrink-0 justify-end gap-2 border-t border-[#E5E7EB] px-4 py-3">
        <button className="inline-flex h-8 items-center rounded border border-[#DFE5ED] bg-white px-3.5 text-[13px] font-medium text-[#364658] transition-colors hover:bg-[#F5F7FA]">Cancel</button>
        <button
          onClick={() => toast.success('Branding saved')}
          className="inline-flex h-8 items-center rounded bg-[#3D8BD0] px-3.5 text-[13px] font-medium text-white transition-colors hover:bg-[#2d6ca0]"
        >Save</button>
      </div>
    </div>
  );
}
