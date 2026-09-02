# Support Portal — content inventory

Every piece of text in the Support Portal editor, in one place, so copy can be reviewed and
changed without reading the code.

- **Read from:** the build at <https://juligopani.github.io/-serviceops-ticket-detail/#/admin/support-portal>, cross-checked line by line against this repository.
- **Coverage:** the listing, the create dialog, the Settings tab, the builder top bar, the whole portal page on the canvas, every canvas toolbar and tooltip, all three right-rail menus, the element hover cards, and every field of every widget settings panel.

## How to use this file

1. Write the wording you want in the **New text** column. Leave it blank to keep what is there.
2. Send the file back. Every filled row is applied to the code mechanically — the **ID** and the **File** column are what makes that possible, so please do not edit those two columns.
3. `{name}`, `{count}` and the like are values the app fills in at runtime. Keep them in your new wording, spelled exactly the same, or the message loses the value it was reporting.
4. Rows marked **Δ** are the ones where that build and this repository do not agree — read the conflicts table below before changing them.

## ⚠️ Conflicts — please decide these first

These are the only places where the build you pointed me at and this repository differ. Every
one of them is something you asked for in the last few days, so taking that build's wording
here would undo a decision you have already made. Nothing below has been changed — tell me
which way you want each one and I will apply it.

| # | Where | That build says | This repo says | Why they differ |
|---|---|---|---|---|
| C1 | Theme panel · the line under the rail title<br>`PortalThemePanel / SupportPortalBuilder.tsx:95` | Style, type and colour for every page of this portal. | Style the support portal page. | You asked for the new line on 2 Sep (task 77). |
| C2 | Theme panel · caption under the Primary tab<br>`PortalThemePanel.tsx` | Set by the theme style. Change one to depart from it. | — removed — | You asked for it gone on 2 Sep (task 77). |
| C3 | Theme panel · caption under the Secondary tab<br>`PortalThemePanel.tsx` | Status colours — green means healthy, red means broken. Shared by every theme. | — removed — | Same change. |
| C4 | Theme panel · caption under the Neutral tab<br>`PortalThemePanel.tsx` | The greyscale every surface and border is built from. Shared by every theme. | — removed — | Same change. |
| C5 | Branding · first field<br>`PortalBrandingPanel.tsx` | Portal name | Helpdesk Name | From your handwritten note (task 80). |
| C6 | Branding · tenant rows<br>`PortalBrandingPanel.tsx` | Company · Portal URL (read-only rows) | — removed — | Not on your note (task 80). |
| C7 | Branding · section headings<br>`PortalBrandingPanel.tsx` | Help · Sign-on · Contact shown on the portal | — removed — | You asked for the headings gone (task 80). |
| C8 | Branding · help icon block<br>`PortalBrandingPanel.tsx` | Help Icon · Upload Help View Icon For Requester · Preview · Icon attached · No icon attached yet · View the icon · Nothing attached yet · Showing the help icon as a requester sees it · 16 × 16 px gives the sharpest result… | — removed — | You asked for the image fields gone (task 78). |
| C9 | Branding · new fields<br>`PortalBrandingPanel.tsx` | — not in that build — | Linkback URL · Favicon · Upload favicon · Favicon updated | From your handwritten note (task 80). |
| C10 | Palette + widget name<br>`supportPortalData.ts:474 / portalWidgetSpec.ts:792` | Record List | Custom data widget | You chose the rename in task 68 when Record List and KPI merged. NOT changed back. |
| C11 | Widget drawer · Custom data widget<br>`portalWidgetSpec.ts:802` | — not in that build — | Show as (Record list / KPI) | Part of the same merge. |
| C12 | Live-data cards · three fields<br>`portalWidgetSpec.ts:254–265` | — not in that build — | Show count badge · Show “View all” link · Row layout · Single line | Ours has these; that build does not. |
| C13 | Portal listing · the gear beside the CTA<br>`AdminSupportPortalModule.tsx` | Global Setting | — removed — | You asked for it gone (task 75). |
| C14 | Create dialog · step 2<br>`AdminSupportPortalModule.tsx:155` | Use Template / Start from a ready-made layout and change what you need. / New page | one-screen step 2 | We rebuilt the fork into one screen; that build still has the two-card fork. |
| C15 | Top bar · the tour button<br>`SupportPortalBuilder.tsx:1425` | — not in that build — | Take the tour | Ours has the ? button; that build has no tour. |
| C16 | Element hover cards · all 29<br>`PortalElementPreview.tsx` | what + helps + note (two lines and a condition) | same — already adopted | Taken from that build on 2 Sep (task 79). Already in step. |

---

## 1. Portal listing

*`AdminSupportPortalModule.tsx`* — 53 entries

### 1.1 `RowActions`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `list.edit` | title / tooltip | `AdminSupportPortalModule.tsx:78` | Edit |  |
| `list.preview` | title / tooltip | `AdminSupportPortalModule.tsx:81` | Preview |  |
| `list.settings` | title / tooltip | `AdminSupportPortalModule.tsx:87` | Settings |  |
| `list.copy` | title / tooltip | `AdminSupportPortalModule.tsx:90` | Copy |  |
| `list.the-default-portal-cannot-be-delet` | string | `AdminSupportPortalModule.tsx:94` | The default portal cannot be deleted — requesters have to land somewhere |  |
| `list.edit-details` | on-screen text | `AdminSupportPortalModule.tsx:104` | Edit details |  |
| `list.customise-portal` | on-screen text | `AdminSupportPortalModule.tsx:105` | Customise portal |  |

### 1.2 `CURRENT_USER`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `list.aarti-shah` | string | `AdminSupportPortalModule.tsx:120` | Aarti Shah |  |

### 1.3 `NewPageMenu`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `list.create-support-portal` | title / tooltip | `AdminSupportPortalModule.tsx:148` | Create Support Portal |  |
| `list.start-with-a-blank-page-and-build-` **Δ** | description | `AdminSupportPortalModule.tsx:149` | Start with a blank page and build it block by block. |  |
| `list.use-template` **Δ** | title / tooltip | `AdminSupportPortalModule.tsx:155` | Use Template |  |
| `list.start-from-a-ready-made-layout-and` **Δ** | description | `AdminSupportPortalModule.tsx:156` | Start from a ready-made layout and change what you need. |  |
| `list.new-page` **Δ** | on-screen text | `AdminSupportPortalModule.tsx:171` | New page |  |

### 1.4 `ConfirmDelete`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `list.published` | string | `AdminSupportPortalModule.tsx:213` | Published |  |
| `list.this-page-is-live-requesters-who-o` | string | `AdminSupportPortalModule.tsx:214` | This page is live. Requesters who open it will get a not-found page until you publish another one in its place. |  |
| `list.this-draft-has-never-been-publishe` | string | `AdminSupportPortalModule.tsx:215` | This draft has never been published, so nothing changes for requesters. |  |
| `list.all` | Scope | `AdminSupportPortalModule.tsx:228` | All |  |
| `list.draft` | string | `AdminSupportPortalModule.tsx:228` | Draft |  |
| `list.cancel` | on-screen text | `AdminSupportPortalModule.tsx:218` | Cancel |  |
| `list.delete-page` | on-screen text | `AdminSupportPortalModule.tsx:219` | Delete page |  |

### 1.5 `AdminSupportPortalModule`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `list.custom` | type | `AdminSupportPortalModule.tsx:298` | Custom |  |
| `list.draft-2` | status | `AdminSupportPortalModule.tsx:299` | Draft |  |
| `list.all-requesters` | audience | `AdminSupportPortalModule.tsx:301` | All requesters |  |
| `list.details-updated` | string | `AdminSupportPortalModule.tsx:324` | Details updated |  |
| `list.blank-layout` | string | `AdminSupportPortalModule.tsx:327` | Blank layout |  |
| `list.default-portal` | name | `AdminSupportPortalModule.tsx:345` | Default portal |  |
| `list.published-2` | status | `AdminSupportPortalModule.tsx:392` | Published |  |
| `list.none-use-serviceops-login` | string | `AdminSupportPortalModule.tsx:501` | None — use ServiceOps login |  |
| `list.opening-the-support-portal-documen` | string | `AdminSupportPortalModule.tsx:531` | Opening the Support Portal documentation |  |
| `list.portal-name` | string | `AdminSupportPortalModule.tsx:610` | Portal name |  |
| `list.url` | string | `AdminSupportPortalModule.tsx:610` | URL |  |
| `list.status` | string | `AdminSupportPortalModule.tsx:610` | Status |  |
| `list.enabled` | string | `AdminSupportPortalModule.tsx:610` | Enabled |  |
| `list.action` | string | `AdminSupportPortalModule.tsx:610` | Action |  |
| `list.the-default-portal-is-always-on-re` | string | `AdminSupportPortalModule.tsx:665` | The default portal is always on — requesters have to land somewhere |  |
| `list.switch-this-portal-off` | string | `AdminSupportPortalModule.tsx:666` | Switch this portal off |  |
| `list.switch-this-portal-on` | string | `AdminSupportPortalModule.tsx:666` | Switch this portal on |  |
| `list.settings-2` | on-screen text | `AdminSupportPortalModule.tsx:472` | Settings |  |
| `list.support-portal` | on-screen text | `AdminSupportPortalModule.tsx:527` | Support Portal |  |
| `list.view-docs` | on-screen text | `AdminSupportPortalModule.tsx:533` | View Docs |  |
| `list.create-support-portal-2` | on-screen text | `AdminSupportPortalModule.tsx:547` | Create support portal |  |
| `list.no-portal-pages-yet` | on-screen text | `AdminSupportPortalModule.tsx:573` | No portal pages yet |  |
| `list.requesters-currently-see-the-defau` | on-screen text | `AdminSupportPortalModule.tsx:574` | Requesters currently see the default ServiceOps portal. Build a page to change what they land on — start blank, or pick a template and edit it. |  |
| `list.no-portals-yet` | on-screen text | `AdminSupportPortalModule.tsx:617` | No portals yet. |  |
| `list.unpublished-changes` | on-screen text | `AdminSupportPortalModule.tsx:653` | Unpublished changes |  |

### 1.6 `(top level)`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `list.name-copied-give-the-copy-its-own-` | message with a value in it | `AdminSupportPortalModule.tsx:398` | “{name}” copied — give the copy its own name and address |  |
| `list.name-is-live-on-the-support-portal` | message with a value in it | `AdminSupportPortalModule.tsx:416` | “{name}” is live on the support portal |  |
| `list.saved-name-keeps-showing-the-publi` | message with a value in it | `AdminSupportPortalModule.tsx:431` | Saved. “{name}” keeps showing the published version until you publish again |  |
| `list.name-saved-as-a-draft` | message with a value in it | `AdminSupportPortalModule.tsx:432` | “{name}” saved as a draft |  |
| `list.edit-details-name` | message with a value in it | `AdminSupportPortalModule.tsx:518` | Edit details — {name} |  |
| `list.name-details-saved` | message with a value in it | `AdminSupportPortalModule.tsx:533` | “{name}” details saved |  |
| `list.name-deleted` | message with a value in it | `AdminSupportPortalModule.tsx:548` | “{name}” deleted |  |
| `list.opening-name-in-preview` | message with a value in it | `AdminSupportPortalModule.tsx:719` | Opening {name} in preview |  |

## 2. Create-a-portal dialog

*`SupportPortalTemplateGallery.tsx` · `CreateSupportPortalModal.tsx`* — 45 entries

### 2.1 `TemplateArt`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `create.0-0-160-96` | viewBox | `SupportPortalTemplateGallery.tsx:29` | 0 0 160 96 |  |

### 2.2 `SupportPortalTemplateGallery`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `create.all` | string | `SupportPortalTemplateGallery.tsx:109` | All |  |
| `create.search-templates` | placeholder | `SupportPortalTemplateGallery.tsx:145` | Search templates |  |
| `create.choose-a-template` | on-screen text | `SupportPortalTemplateGallery.tsx:127` | Choose a template |  |
| `create.start-from-a-ready-made-portal-lay` | on-screen text | `SupportPortalTemplateGallery.tsx:128` | Start from a ready-made portal layout. You can change anything after. |  |
| `create.no-templates-found` | on-screen text | `SupportPortalTemplateGallery.tsx:169` | No templates found |  |
| `create.nothing-matches-this-filter-clear-` | on-screen text | `SupportPortalTemplateGallery.tsx:170` | Nothing matches this filter. Clear it, or start from a blank page instead. |  |
| `create.what-s-included` | on-screen text | `SupportPortalTemplateGallery.tsx:216` | What’s included |  |
| `create.a-template-only-decides-what-the-p` | on-screen text | `SupportPortalTemplateGallery.tsx:228` | A template only decides what the page starts with — every block stays editable. |  |
| `create.start-from-a-blank-page-instead` | on-screen text | `SupportPortalTemplateGallery.tsx:242` | Start from a blank page instead |  |
| `create.cancel` | on-screen text | `SupportPortalTemplateGallery.tsx:247` | Cancel |  |
| `create.use-template` | on-screen text | `SupportPortalTemplateGallery.tsx:252` | Use template |  |

### 2.3 `COMPANIES`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `create.acme-corporation` | string | `CreateSupportPortalModal.tsx:73` | Acme Corporation |  |
| `create.acme-emea` | string | `CreateSupportPortalModal.tsx:73` | Acme EMEA |  |
| `create.acme-manufacturing` | string | `CreateSupportPortalModal.tsx:73` | Acme Manufacturing |  |
| `create.northwind-logistics` | string | `CreateSupportPortalModal.tsx:73` | Northwind Logistics |  |

### 2.4 `IDPS`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `create.none-use-serviceops-login` | string | `CreateSupportPortalModal.tsx:74` | None — use ServiceOps login |  |
| `create.azure-ad` | string | `CreateSupportPortalModal.tsx:74` | Azure AD |  |
| `create.okta` | string | `CreateSupportPortalModal.tsx:74` | Okta |  |
| `create.google-workspace` | string | `CreateSupportPortalModal.tsx:74` | Google Workspace |  |
| `create.saml-2-0` | string | `CreateSupportPortalModal.tsx:74` | SAML 2.0 |  |

### 2.5 `PortalDetailsFields`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `create.support-portal-name` | placeholder | `CreateSupportPortalModal.tsx:93` | Support Portal Name |  |
| `create.support-portal-url` | placeholder | `CreateSupportPortalModal.tsx:104` | Support Portal URL |  |
| `create.support-portal-name-2` | on-screen text | `CreateSupportPortalModal.tsx:92` | Support Portal Name |  |
| `create.company` | on-screen text | `CreateSupportPortalModal.tsx:96` | Company |  |
| `create.select` | on-screen text | `CreateSupportPortalModal.tsx:98` | Select |  |
| `create.support-portal-url-2` | on-screen text | `CreateSupportPortalModal.tsx:103` | Support Portal URL |  |
| `create.identity-provider` | on-screen text | `CreateSupportPortalModal.tsx:107` | Identity Provider |  |
| `create.enforce-to-authenticate-with-singl` | on-screen text | `CreateSupportPortalModal.tsx:118` | Enforce to authenticate with Single Sign-On Only |  |

### 2.6 `EditPortalDetailsModal`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `create.name-company-and-url-are-required` | undefined | `CreateSupportPortalModal.tsx:162` | Name, Company and URL are required |  |
| `create.cancel-2` | on-screen text | `CreateSupportPortalModal.tsx:158` | Cancel |  |
| `create.save` | on-screen text | `CreateSupportPortalModal.tsx:166` | Save |  |

### 2.7 `Steps`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `create.support-portal-details` | title / tooltip | `CreateSupportPortalModal.tsx:177` | Support portal details |  |
| `create.support-portal-customization` | title / tooltip | `CreateSupportPortalModal.tsx:178` | Support portal customization |  |

### 2.8 `CreateSupportPortalModal`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `create.all-2` | string | `CreateSupportPortalModal.tsx:227` | All |  |
| `create.save-changes` | string | `CreateSupportPortalModal.tsx:267` | Save changes |  |
| `create.save-2` | string | `CreateSupportPortalModal.tsx:267` | Save |  |
| `create.create-support-portal` | on-screen text | `CreateSupportPortalModal.tsx:242` | Create Support Portal |  |
| `create.create-your-own-portal` | on-screen text | `CreateSupportPortalModal.tsx:284` | Create your own portal |  |
| `create.start-from-scratch` | on-screen text | `CreateSupportPortalModal.tsx:291` | Start from scratch |  |
| `create.begin-with-a-blank-page-and-choose` | on-screen text | `CreateSupportPortalModal.tsx:292` | Begin with a blank page and choose your own blocks |  |
| `create.start-from-a-template` | on-screen text | `CreateSupportPortalModal.tsx:298` | Start from a template |  |
| `create.support-portal` | on-screen text | `CreateSupportPortalModal.tsx:334` | Support Portal |  |
| `create.the-portal-your-requesters-see-tod` | on-screen text | `CreateSupportPortalModal.tsx:335` | The portal your requesters see today |  |
| `create.back` | on-screen text | `CreateSupportPortalModal.tsx:364` | Back |  |

## 3. Settings tab

*`AdminSupportPortalSettings.tsx`* — 53 entries

### 3.1 `GROUPS`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `settings.request` | title / tooltip | `AdminSupportPortalSettings.tsx:29` | Request |  |
| `settings.allow-requester-to-create-incident` | field label | `AdminSupportPortalSettings.tsx:31` | Allow Requester to create Incident |  |
| `settings.allow-guest-requester-to-report-a-` | field label | `AdminSupportPortalSettings.tsx:32` | Allow Guest Requester to Report a Request |  |
| `settings.allow-requester-to-create-incident-2` | field label | `AdminSupportPortalSettings.tsx:33` | Allow Requester to Create Incident On Behalf Of Other Requester |  |
| `settings.allow-requester-to-view-request-du` | field label | `AdminSupportPortalSettings.tsx:34` | Allow Requester to View Request Due By |  |
| `settings.allow-requester-to-access-solution` | field label | `AdminSupportPortalSettings.tsx:35` | Allow Requester To Access Solution |  |
| `settings.allow-requester-to-close-request` | field label | `AdminSupportPortalSettings.tsx:36` | Allow Requester to Close Request |  |
| `settings.allow-requester-to-submit-feedback` | field label | `AdminSupportPortalSettings.tsx:37` | Allow Requester To Submit Feedback |  |
| `settings.mandate-comment-to-reopen-request` | field label | `AdminSupportPortalSettings.tsx:38` | Mandate comment to Reopen Request |  |
| `settings.allow-requester-to-reopen-resolved` | field label | `AdminSupportPortalSettings.tsx:39` | Allow Requester to Reopen Resolved Request |  |
| `settings.grace-period` | field label | `AdminSupportPortalSettings.tsx:43` | Grace Period |  |
| `settings.unlimited` | string | `AdminSupportPortalSettings.tsx:43` | Unlimited |  |
| `settings.days` | string | `AdminSupportPortalSettings.tsx:43` | Days |  |
| `settings.days-2` | default value | `AdminSupportPortalSettings.tsx:43` | Days |  |
| `settings.number-of-days` | field label | `AdminSupportPortalSettings.tsx:44` | Number of Days |  |
| `settings.allow-requester-to-reopen-closed-r` | field label | `AdminSupportPortalSettings.tsx:45` | Allow Requester to Reopen Closed Request |  |
| `settings.unlimited-2` | default value | `AdminSupportPortalSettings.tsx:46` | Unlimited |  |
| `settings.allow-requester-to-access-audit-tr` | field label | `AdminSupportPortalSettings.tsx:48` | Allow Requester to access Audit Trail |  |
| `settings.requester-ticket-visibility` | field label | `AdminSupportPortalSettings.tsx:50` | Requester Ticket Visibility |  |
| `settings.which-requests-a-requester-can-see` | help | `AdminSupportPortalSettings.tsx:51` | Which requests a requester can see beyond their own. |  |
| `settings.group-requests` | string | `AdminSupportPortalSettings.tsx:52` | Group Requests |  |
| `settings.department-requests` | string | `AdminSupportPortalSettings.tsx:52` | Department Requests |  |
| `settings.service-catalog` | title / tooltip | `AdminSupportPortalSettings.tsx:58` | Service Catalog |  |
| `settings.allow-requester-to-access-service-` | field label | `AdminSupportPortalSettings.tsx:60` | Allow Requester To Access Service Catalog |  |
| `settings.allow-guest-requester-to-request-f` | field label | `AdminSupportPortalSettings.tsx:61` | Allow Guest Requester to Request for Service |  |
| `settings.allow-requester-to-request-service` | field label | `AdminSupportPortalSettings.tsx:62` | Allow Requester to Request Service On Behalf Of Other Requester |  |
| `settings.change` | title / tooltip | `AdminSupportPortalSettings.tsx:65` | Change |  |
| `settings.allow-requester-to-access-my-chang` | field label | `AdminSupportPortalSettings.tsx:65` | Allow Requester To Access My Changes |  |
| `settings.asset` | title / tooltip | `AdminSupportPortalSettings.tsx:68` | Asset |  |
| `settings.allow-requester-to-access-my-asset` | field label | `AdminSupportPortalSettings.tsx:70` | Allow Requester to Access My Assets |  |
| `settings.allow-requester-to-view-barcode-qr` | field label | `AdminSupportPortalSettings.tsx:71` | Allow Requester To View Barcode / QR Code |  |
| `settings.allow-requester-to-link-asset` | field label | `AdminSupportPortalSettings.tsx:72` | Allow Requester to Link Asset |  |
| `settings.allow-requester-to-link-asset-of-o` | field label | `AdminSupportPortalSettings.tsx:73` | Allow Requester to link Asset of other Requester |  |
| `settings.auto-link-requester-s-assets` | field label | `AdminSupportPortalSettings.tsx:74` | Auto-Link Requester's Assets |  |
| `settings.allow-requester-to-access-my-ci` | field label | `AdminSupportPortalSettings.tsx:81` | Allow Requester to Access My CI |  |
| `settings.allow-requester-to-link-ci` | field label | `AdminSupportPortalSettings.tsx:82` | Allow Requester to Link CI |  |
| `settings.allow-requester-to-link-ci-of-othe` | field label | `AdminSupportPortalSettings.tsx:83` | Allow Requester to link CI of other Requester |  |
| `settings.auto-link-requester-s-ci` | field label | `AdminSupportPortalSettings.tsx:84` | Auto-Link Requester's CI |  |
| `settings.knowledge` | title / tooltip | `AdminSupportPortalSettings.tsx:89` | Knowledge |  |
| `settings.allow-requester-to-access-knowledg` | field label | `AdminSupportPortalSettings.tsx:91` | Allow Requester To Access Knowledge |  |
| `settings.show-suggested-knowledge-while-cre` | field label | `AdminSupportPortalSettings.tsx:92` | Show Suggested Knowledge while creating new Request |  |
| `settings.approval` | title / tooltip | `AdminSupportPortalSettings.tsx:97` | Approval |  |
| `settings.allow-requester-to-access-my-appro` | field label | `AdminSupportPortalSettings.tsx:99` | Allow Requester To Access My Approvals |  |
| `settings.show-approvals-tab-in-request-deta` | field label | `AdminSupportPortalSettings.tsx:100` | Show 'Approvals' tab (in Request Detailed View) in Support Portal |  |
| `settings.digital-signature` | title / tooltip | `AdminSupportPortalSettings.tsx:105` | Digital Signature |  |
| `settings.show-signature-tab-in-support-port` | field label | `AdminSupportPortalSettings.tsx:107` | Show 'Signature' tab in Support Portal |  |
| `settings.user` | title / tooltip | `AdminSupportPortalSettings.tsx:111` | User |  |
| `settings.allow-self-registration` | field label | `AdminSupportPortalSettings.tsx:113` | Allow Self Registration |  |
| `settings.registration-type` | field label | `AdminSupportPortalSettings.tsx:114` | Registration Type |  |
| `settings.allow-everyone` | string | `AdminSupportPortalSettings.tsx:114` | Allow everyone |  |
| `settings.set-of-domains` | string | `AdminSupportPortalSettings.tsx:114` | Set of Domains |  |
| `settings.allow-everyone-2` | default value | `AdminSupportPortalSettings.tsx:114` | Allow everyone |  |

### 3.2 `AdminSupportPortalSettings`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `settings.search` | placeholder | `AdminSupportPortalSettings.tsx:270` | Search |  |

## 4. Builder — top bar and shell

*`SupportPortalBuilder.tsx`* — 64 entries

### 4.1 `RAIL`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `topbar.widgets` | field label | `SupportPortalBuilder.tsx:68` | Widgets |  |
| `topbar.theme` | field label | `SupportPortalBuilder.tsx:69` | Theme |  |
| `topbar.branding` | field label | `SupportPortalBuilder.tsx:70` | Branding |  |

### 4.2 `PANEL_COPY`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `topbar.widgets-2` | title / tooltip | `SupportPortalBuilder.tsx:86` | Widgets |  |
| `topbar.everything-you-can-put-on-the-page` | body | `SupportPortalBuilder.tsx:87` | Everything you can put on the page. |  |
| `topbar.theme-2` | title / tooltip | `SupportPortalBuilder.tsx:94` | Theme |  |
| `topbar.style-the-support-portal-page` **Δ** | body | `SupportPortalBuilder.tsx:95` | Style the support portal page. |  |
| `topbar.branding-2` | title / tooltip | `SupportPortalBuilder.tsx:100` | Branding |  |
| `topbar.the-organisation-identity-shared-b` | body | `SupportPortalBuilder.tsx:101` | The organisation identity, shared by every portal. |  |
| `topbar.settings` | title / tooltip | `SupportPortalBuilder.tsx:104` | Settings |  |
| `topbar.what-a-requester-can-do-on-this-po` | body | `SupportPortalBuilder.tsx:105` | What a requester can do on this portal. |  |
| `topbar.build-with-ai` | title / tooltip | `SupportPortalBuilder.tsx:108` | Build with AI |  |
| `topbar.describe-the-portal-you-want-a-cat` | body | `SupportPortalBuilder.tsx:109` | Describe the portal you want — “a catalog-first page for HR” — and AI will lay the blocks out for you. |  |

### 4.3 `SelectElementArt`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `topbar.0-0-140-106` | viewBox | `SupportPortalBuilder.tsx:118` | 0 0 140 106 |  |

### 4.4 `SupportPortalBuilder`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `topbar.section-added` | string | `SupportPortalBuilder.tsx:504` | Section added |  |
| `topbar.element` | string | `SupportPortalBuilder.tsx:519` | Element |  |
| `topbar.quick-actions-holds-its-four-actio` | string | `SupportPortalBuilder.tsx:535` | Quick Actions holds its four action cards and nothing else |  |
| `topbar.data` | string | `SupportPortalBuilder.tsx:661` | Data |  |
| `topbar.actions` | string | `SupportPortalBuilder.tsx:661` | Actions |  |
| `topbar.page-reset-to-default` | string | `SupportPortalBuilder.tsx:713` | Page reset to default |  |
| `topbar.ad-self-service-is-already-on-the-` | string | `SupportPortalBuilder.tsx:754` | AD Self Service is already on the page |  |
| `topbar.ad-self-service` | title / tooltip | `SupportPortalBuilder.tsx:755` | AD Self Service |  |
| `topbar.reset-your-domain-password` | description | `SupportPortalBuilder.tsx:755` | Reset your domain password |  |
| `topbar.ad-self-service-added` | string | `SupportPortalBuilder.tsx:762` | AD Self Service added |  |
| `topbar.this-row-already-has-its-external-` | string | `SupportPortalBuilder.tsx:796` | This row already has its external-link card |  |
| `topbar.external-link` | title / tooltip | `SupportPortalBuilder.tsx:799` | External link |  |
| `topbar.where-this-link-goes` | description | `SupportPortalBuilder.tsx:799` | Where this link goes |  |
| `topbar.external-link-card-added` | string | `SupportPortalBuilder.tsx:803` | External link card added |  |
| `topbar.this-element-sits-on-its-own-nothi` | string | `SupportPortalBuilder.tsx:836` | This element sits on its own — nothing to swap it with |  |
| `topbar.swapped-places` | string | `SupportPortalBuilder.tsx:883` | Swapped places |  |
| `topbar.moved-into` | string | `SupportPortalBuilder.tsx:953` | moved into |  |
| `topbar.placed-in` | string | `SupportPortalBuilder.tsx:953` | placed in |  |
| `topbar.drop-it-on-a-section-a-column-or-a` | string | `SupportPortalBuilder.tsx:1024` | Drop it on a section, a column, or a seam between blocks |  |
| `topbar.moved` | string | `SupportPortalBuilder.tsx:1031` | Moved |  |
| `topbar.section-duplicated` | string | `SupportPortalBuilder.tsx:1085` | Section duplicated |  |
| `topbar.element-duplicated` | string | `SupportPortalBuilder.tsx:1120` | Element duplicated |  |
| `topbar.removed` | string | `SupportPortalBuilder.tsx:1127` | Removed |  |
| `topbar.pick-an-element-to-add-here-click-` | string | `SupportPortalBuilder.tsx:1150` | Pick an element to add here — click it, or drag it onto the page |  |
| `topbar.back-to-support-portal` | title / tooltip | `SupportPortalBuilder.tsx:1368` | Back to Support Portal |  |
| `topbar.rename-page` | title / tooltip | `SupportPortalBuilder.tsx:1390` | Rename page |  |
| `topbar.published` | string | `SupportPortalBuilder.tsx:1398` | Published |  |
| `topbar.undo-ctrl-z` | string | `SupportPortalBuilder.tsx:1410` | Undo (Ctrl+Z) |  |
| `topbar.nothing-to-undo` | string | `SupportPortalBuilder.tsx:1410` | Nothing to undo |  |
| `topbar.redo-ctrl-shift-z` | string | `SupportPortalBuilder.tsx:1417` | Redo (Ctrl+Shift+Z) |  |
| `topbar.nothing-to-redo` | string | `SupportPortalBuilder.tsx:1417` | Nothing to redo |  |
| `topbar.take-the-tour` **Δ** | screen-reader label | `SupportPortalBuilder.tsx:1425` | Take the tour |  |
| `topbar.put-every-block-style-and-setting-` | title / tooltip | `SupportPortalBuilder.tsx:1447` | Put every block, style and setting back to the page's default |  |
| `topbar.save-as-draft` | string | `SupportPortalBuilder.tsx:1481` | Save as draft |  |
| `topbar.publish` | string | `SupportPortalBuilder.tsx:1481` | Publish |  |
| `topbar.more-save-options` | title / tooltip | `SupportPortalBuilder.tsx:1484` | More save options |  |
| `topbar.more-save-options-2` | screen-reader label | `SupportPortalBuilder.tsx:1485` | More save options |  |
| `topbar.show-design-panel` | title / tooltip | `SupportPortalBuilder.tsx:1563` | Show design panel |  |
| `topbar.drag-to-resize` | title / tooltip | `SupportPortalBuilder.tsx:1573` | Drag to resize |  |
| `topbar.element-reset` | string | `SupportPortalBuilder.tsx:1632` | Element reset |  |
| `topbar.previewing` | on-screen text | `SupportPortalBuilder.tsx:1343` | Previewing |  |
| `topbar.as-a-requester-sees-it` | on-screen text | `SupportPortalBuilder.tsx:1344` | as a requester sees it |  |
| `topbar.exit-preview` | on-screen text | `SupportPortalBuilder.tsx:1349` | Exit preview |  |
| `topbar.take-the-tour-2` **Δ** | on-screen text | `SupportPortalBuilder.tsx:1428` | Take the tour |  |
| `topbar.reset-to-default` | on-screen text | `SupportPortalBuilder.tsx:1449` | Reset to default |  |
| `topbar.preview` | on-screen text | `SupportPortalBuilder.tsx:1461` | Preview |  |

### 4.5 `PanelEmptyState`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `topbar.select-an-element-to-start` | on-screen text | `SupportPortalBuilder.tsx:141` | Select an element to start |  |
| `topbar.it-ll-show-the-design-panel-with-a` | on-screen text | `SupportPortalBuilder.tsx:142` | It’ll show the design panel with all the design options for that element right here. |  |

### 4.6 `(top level)`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `topbar.replaced-with-name` | message with a value in it | `SupportPortalBuilder.tsx:1580` | Replaced with {name} |  |
| `topbar.this-lives-in-admin-section-card` | message with a value in it | `SupportPortalBuilder.tsx:2036` | This lives in Admin › {section}${card ? |  |

## 5. Builder — the portal page

*`SupportPortalPreview.tsx` · `portalPageModel.ts` · `supportPortalData.ts`* — 492 entries

### 5.1 `DropLine`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `page.insert-in-new-column` | string | `SupportPortalPreview.tsx:165` | Insert in new column |  |
| `page.insert-in-new-row` | string | `SupportPortalPreview.tsx:165` | Insert in new row |  |

### 5.2 `ColumnBody`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `page.padding-130ms-ease` | transition | `SupportPortalPreview.tsx:290` | padding 130ms ease |  |
| `page.add-an-element-here` | title / tooltip | `SupportPortalPreview.tsx:307` | Add an element here |  |

### 5.3 `HeroSearch`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `page.knowledge` | string | `SupportPortalPreview.tsx:523` | Knowledge |  |

### 5.4 `SEARCH_SUGGESTIONS`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `page.how-to-reset-your-password` | title / tooltip | `SupportPortalPreview.tsx:578` | How to Reset Your Password |  |
| `page.knowledge-2` | kind | `SupportPortalPreview.tsx:578` | Knowledge |  |
| `page.connecting-to-company-vpn` | title / tooltip | `SupportPortalPreview.tsx:579` | Connecting to Company VPN |  |
| `page.reporting-a-hardware-fault` | title / tooltip | `SupportPortalPreview.tsx:580` | Reporting a Hardware Fault |  |
| `page.request-a-new-laptop` | title / tooltip | `SupportPortalPreview.tsx:581` | Request a new laptop |  |
| `page.service` | kind | `SupportPortalPreview.tsx:581` | Service |  |
| `page.report-an-incident` | title / tooltip | `SupportPortalPreview.tsx:582` | Report an incident |  |
| `page.inc-187-cannot-create-kb-article` | title / tooltip | `SupportPortalPreview.tsx:583` | INC-187 Cannot Create KB Article |  |
| `page.request` | kind | `SupportPortalPreview.tsx:583` | Request |  |
| `page.ast-13-desktop-5jppi6f` | title / tooltip | `SupportPortalPreview.tsx:584` | AST-13 DESKTOP-5JPPI6F |  |
| `page.asset` | kind | `SupportPortalPreview.tsx:584` | Asset |  |

### 5.5 `RAIL_ITEMS`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `page.requests` | field label | `SupportPortalPreview.tsx:590` | Requests |  |
| `page.service-catalog` | field label | `SupportPortalPreview.tsx:591` | Service Catalog |  |
| `page.changes` | field label | `SupportPortalPreview.tsx:592` | Changes |  |
| `page.my-assets` | field label | `SupportPortalPreview.tsx:593` | My Assets |  |
| `page.my-cis` | field label | `SupportPortalPreview.tsx:594` | My CIs |  |
| `page.knowledge-3` | field label | `SupportPortalPreview.tsx:595` | Knowledge |  |
| `page.my-approvals` | field label | `SupportPortalPreview.tsx:596` | My Approvals |  |
| `page.my-team` | field label | `SupportPortalPreview.tsx:597` | My Team |  |
| `page.tasks` | field label | `SupportPortalPreview.tsx:598` | Tasks |  |

### 5.6 `PortalRail`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `page.0-0-24-24` | viewBox | `SupportPortalPreview.tsx:669` | 0 0 24 24 |  |

### 5.7 `PortalHeader`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `page.drag-the-logo-along-the-bar` | string | `SupportPortalPreview.tsx:758` | Drag the logo along the bar |  |
| `page.drag-to-move-drop-at-an-edge-to-sp` | string | `SupportPortalPreview.tsx:801` | Drag to move — drop at an edge to split |  |
| `page.ask-ai` | on-screen text | `SupportPortalPreview.tsx:785` | Ask AI |  |
| `page.yg` | on-screen text | `SupportPortalPreview.tsx:807` | YG |  |

### 5.8 `HeroArtwork`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `page.0-0-100-100` | viewBox | `SupportPortalPreview.tsx:860` | 0 0 100 100 |  |

### 5.9 `SupportPortalPreview`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `page.top-left` | string | `SupportPortalPreview.tsx:1070` | top left |  |
| `page.left-top` | string | `SupportPortalPreview.tsx:1070` | left top |  |
| `page.center-top` | top | `SupportPortalPreview.tsx:1070` | center top |  |
| `page.top-right` | string | `SupportPortalPreview.tsx:1070` | top right |  |
| `page.right-top` | string | `SupportPortalPreview.tsx:1070` | right top |  |
| `page.left-center` | left | `SupportPortalPreview.tsx:1071` | left center |  |
| `page.center-center` | center | `SupportPortalPreview.tsx:1071` | center center |  |
| `page.right-center` | right | `SupportPortalPreview.tsx:1071` | right center |  |
| `page.bottom-left` | string | `SupportPortalPreview.tsx:1072` | bottom left |  |
| `page.left-bottom` | string | `SupportPortalPreview.tsx:1072` | left bottom |  |
| `page.center-bottom` | bottom | `SupportPortalPreview.tsx:1072` | center bottom |  |
| `page.bottom-right` | string | `SupportPortalPreview.tsx:1072` | bottom right |  |
| `page.right-bottom` | string | `SupportPortalPreview.tsx:1072` | right bottom |  |
| `page.center-center-2` | string | `SupportPortalPreview.tsx:1089` | center center |  |
| `page.click-to-change-this-icon` | string | `SupportPortalPreview.tsx:1471` | Click to change this icon |  |
| `page.announcements` | title / tooltip | `SupportPortalPreview.tsx:1751` | Announcements |  |
| `page.contact-us` | title / tooltip | `SupportPortalPreview.tsx:1752` | Contact Us |  |
| `page.your-portal-is-empty` | on-screen text | `SupportPortalPreview.tsx:1311` | Your portal is empty |  |
| `page.add-a-section-then-drop-widgets-in` | on-screen text | `SupportPortalPreview.tsx:1312` | Add a section, then drop widgets into it — or pick one from the Widgets panel and drag it straight onto the page. |  |

### 5.10 `MY_ASSETS`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `page.ast-3` | id | `SupportPortalPreview.tsx:1819` | AST-3 |  |
| `page.dell-latitude-5440` | name | `SupportPortalPreview.tsx:1819` | Dell Latitude 5440 |  |
| `page.laptop` | type | `SupportPortalPreview.tsx:1819` | Laptop |  |
| `page.ast-1` | id | `SupportPortalPreview.tsx:1820` | AST-1 |  |
| `page.dell-ultrasharp-u2723qe` | name | `SupportPortalPreview.tsx:1820` | Dell UltraSharp U2723QE |  |
| `page.monitor` | type | `SupportPortalPreview.tsx:1820` | Monitor |  |
| `page.ast-7` | id | `SupportPortalPreview.tsx:1821` | AST-7 |  |
| `page.logitech-mx-master-3s` | name | `SupportPortalPreview.tsx:1821` | Logitech MX Master 3S |  |
| `page.mouse` | type | `SupportPortalPreview.tsx:1821` | Mouse |  |
| `page.ast-12` | id | `SupportPortalPreview.tsx:1822` | AST-12 |  |
| `page.jabra-evolve2-65` | name | `SupportPortalPreview.tsx:1822` | Jabra Evolve2 65 |  |
| `page.headset` | type | `SupportPortalPreview.tsx:1822` | Headset |  |
| `page.ast-9` | id | `SupportPortalPreview.tsx:1823` | AST-9 |  |
| `page.iphone-14` | name | `SupportPortalPreview.tsx:1823` | iPhone 14 |  |
| `page.mobile` | type | `SupportPortalPreview.tsx:1823` | Mobile |  |

### 5.11 `MY_CIS`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `page.ci-8` | id | `SupportPortalPreview.tsx:1832` | CI-8 |  |
| `page.hostname` | name | `SupportPortalPreview.tsx:1832` | hostname |  |
| `page.base-ci` | type | `SupportPortalPreview.tsx:1832` | Base CI |  |
| `page.ci-7` | id | `SupportPortalPreview.tsx:1833` | CI-7 |  |
| `page.ci-5` | id | `SupportPortalPreview.tsx:1834` | CI-5 |  |
| `page.localhost-localdomain` | name | `SupportPortalPreview.tsx:1834` | localhost.localdomain |  |
| `page.linux-desktop` | type | `SupportPortalPreview.tsx:1834` | Linux Desktop |  |
| `page.ci-3` | id | `SupportPortalPreview.tsx:1838` | CI-3 |  |
| `page.app-prod-01` | name | `SupportPortalPreview.tsx:1838` | app-prod-01 |  |
| `page.server` | type | `SupportPortalPreview.tsx:1838` | Server |  |

### 5.12 `EmptyCard`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `page.no-data-found` | string | `SupportPortalPreview.tsx:1961` | No Data Found |  |
| `page.hidden-when-empty-on-the-live-port` | on-screen text | `SupportPortalPreview.tsx:1970` | Hidden when empty on the live portal |  |

### 5.13 `PORTAL_NODES`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `page.page` | name | `portalPageModel.ts:47` | Page |  |
| `page.header` | name | `portalPageModel.ts:50` | Header |  |
| `page.logo` | name | `portalPageModel.ts:51` | Logo |  |
| `page.actions` | name | `portalPageModel.ts:52` | Actions |  |
| `page.sidebar` | name | `portalPageModel.ts:53` | Sidebar |  |
| `page.hero` | name | `portalPageModel.ts:56` | Hero |  |
| `page.heading` | name | `portalPageModel.ts:57` | Heading |  |
| `page.subtitle` | name | `portalPageModel.ts:58` | Subtitle |  |
| `page.search` | name | `portalPageModel.ts:59` | Search |  |
| `page.quick-actions` | name | `portalPageModel.ts:65` | Quick Actions |  |
| `page.new-incident` | name | `portalPageModel.ts:66` | New Incident |  |
| `page.request-service` | name | `portalPageModel.ts:67` | Request Service |  |
| `page.knowledge-4` | name | `portalPageModel.ts:68` | Knowledge |  |
| `page.ad-self-service` | name | `portalPageModel.ts:71` | AD Self Service |  |
| `page.external-link` | name | `portalPageModel.ts:77` | External link |  |
| `page.favourite-services` | name | `portalPageModel.ts:85` | Favourite Services |  |
| `page.most-used-services` | name | `portalPageModel.ts:86` | Most Used Services |  |
| `page.cards-row` | name | `portalPageModel.ts:89` | Cards Row |  |
| `page.work-cards` | name | `portalPageModel.ts:95` | Work Cards |  |
| `page.side-rail` | name | `portalPageModel.ts:96` | Side Rail |  |
| `page.my-requests` | name | `portalPageModel.ts:97` | My Requests |  |
| `page.approvals` | name | `portalPageModel.ts:107` | Approvals |  |
| `page.announcements-2` | name | `portalPageModel.ts:118` | Announcements |  |
| `page.contact-us-2` | name | `portalPageModel.ts:119` | Contact Us |  |
| `page.records-row` | name | `portalPageModel.ts:121` | Records Row |  |
| `page.my-assets-2` | name | `portalPageModel.ts:122` | My Assets |  |
| `page.my-cis-2` | name | `portalPageModel.ts:123` | My CIs |  |

### 5.14 `nodeById`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `page.item` | string | `portalPageModel.ts:185` | Item |  |
| `page.caption` | name | `portalPageModel.ts:202` | Caption |  |
| `page.label` | string | `portalPageModel.ts:207` | Label |  |
| `page.value` | string | `portalPageModel.ts:207` | Value |  |
| `page.heading-2` | title / tooltip | `portalPageModel.ts:208` | Heading |  |
| `page.subtext` | subtitle | `portalPageModel.ts:208` | Subtext |  |
| `page.label-2` | field label | `portalPageModel.ts:208` | Label |  |
| `page.icon` | name | `portalPageModel.ts:215` | Icon |  |
| `page.title` | string | `portalPageModel.ts:220` | Title |  |
| `page.subtext-2` | string | `portalPageModel.ts:220` | Subtext |  |
| `page.section` | name | `portalPageModel.ts:231` | Section |  |

### 5.15 `REQUEST_STATUSES`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `page.open` | string | `portalPageModel.ts:246` | Open |  |
| `page.in-progress` | string | `portalPageModel.ts:246` | In Progress |  |
| `page.pending` | string | `portalPageModel.ts:246` | Pending |  |
| `page.on-hold` | string | `portalPageModel.ts:246` | On Hold |  |
| `page.resolved` | string | `portalPageModel.ts:246` | Resolved |  |
| `page.closed` | string | `portalPageModel.ts:246` | Closed |  |
| `page.reopened` | string | `portalPageModel.ts:246` | Reopened |  |

### 5.16 `REQUEST_SCOPES`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `page.raised-by-me` | string | `portalPageModel.ts:247` | Raised by me |  |
| `page.raised-for-me` | string | `portalPageModel.ts:247` | Raised for me |  |
| `page.all-in-my-department` | string | `portalPageModel.ts:247` | All in my department |  |
| `page.everything-i-can-view` | string | `portalPageModel.ts:247` | Everything I can view |  |

### 5.17 `DEFAULT_CONTENT`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `page.welcome-to-support-portal` | title / tooltip | `portalPageModel.ts:338` | Welcome to Support Portal |  |
| `page.search-our-support-center-knowledg` | subtitle | `portalPageModel.ts:339` | Search our support center knowledge base |  |
| `page.how-can-we-help-you` | placeholder | `portalPageModel.ts:340` | How can we help you? |  |
| `page.new-incident-2` | title / tooltip | `portalPageModel.ts:344` | New Incident |  |
| `page.report-an-incident-2` | description | `portalPageModel.ts:344` | Report an incident |  |
| `page.request-service-2` | title / tooltip | `portalPageModel.ts:345` | Request Service |  |
| `page.browse-the-services-offered` | description | `portalPageModel.ts:345` | Browse the services offered |  |
| `page.knowledge-5` | title / tooltip | `portalPageModel.ts:346` | Knowledge |  |
| `page.browse-knowledge` | description | `portalPageModel.ts:346` | Browse knowledge |  |
| `page.ad-self-service-2` | title / tooltip | `portalPageModel.ts:351` | AD Self Service |  |
| `page.reset-your-domain-password` | description | `portalPageModel.ts:351` | Reset your domain password |  |
| `page.my-open-requests` | title / tooltip | `portalPageModel.ts:353` | My Open Requests |  |
| `page.raised-by-me-2` | scope | `portalPageModel.ts:353` | Raised by me |  |
| `page.pending-approvals` | title / tooltip | `portalPageModel.ts:354` | Pending Approvals |  |
| `page.most-read` | title / tooltip | `portalPageModel.ts:355` | Most Read |  |
| `page.my-assets-3` | title / tooltip | `portalPageModel.ts:356` | My Assets |  |
| `page.my-cis-3` | title / tooltip | `portalPageModel.ts:357` | My CIs |  |

### 5.18 `PORTAL_FONTS`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `page.inter` | name | `portalPageModel.ts:508` | Inter |  |
| `page.neutral-and-highly-legible` | note | `portalPageModel.ts:508` | Neutral and highly legible. |  |
| `page.poppins` | name | `portalPageModel.ts:509` | Poppins |  |
| `page.geometric-and-friendly` | note | `portalPageModel.ts:509` | Geometric and friendly. |  |
| `page.source-sans-3` | name | `portalPageModel.ts:510` | Source Sans 3 |  |
| `page.humanist-good-at-small-sizes` | note | `portalPageModel.ts:510` | Humanist. Good at small sizes. |  |
| `page.merriweather` | name | `portalPageModel.ts:511` | Merriweather |  |
| `page.serif-editorial-and-calm` | note | `portalPageModel.ts:511` | Serif. Editorial and calm. |  |
| `page.roboto` | name | `portalPageModel.ts:512` | Roboto |  |
| `page.tight-and-compact` | note | `portalPageModel.ts:512` | Tight and compact. |  |
| `page.ibm-plex-sans` | name | `portalPageModel.ts:513` | IBM Plex Sans |  |
| `page.technical-and-even` | note | `portalPageModel.ts:513` | Technical and even. |  |

### 5.19 `TEXT_STYLES`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `page.par` | string | `portalPageModel.ts:554` | PAR |  |

### 5.20 `(top level)`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `page.published` | PortalPageStatus | `supportPortalData.ts:12` | Published |  |
| `page.draft` | string | `supportPortalData.ts:12` | Draft |  |
| `page.system` | type | `supportPortalData.ts:18` | System |  |
| `page.custom` | string | `supportPortalData.ts:18` | Custom |  |
| `page.it-support` | category | `supportPortalData.ts:61` | IT Support |  |
| `page.hr` | string | `supportPortalData.ts:61` | HR |  |
| `page.facilities` | string | `supportPortalData.ts:61` | Facilities |  |
| `page.general` | string | `supportPortalData.ts:61` | General |  |
| `page.nested-as-deep-as-a-section-goes-m` | message with a value in it | `portalPageModel.ts:709` | Nested as deep as a section goes ({MAX_BOX_DEPTH} levels) |  |
| `page.a-row-holds-max-columns-columns-at` | message with a value in it | `portalPageModel.ts:711` | A row holds {MAX_COLUMNS} columns at most |  |
| `page.a-column-holds-max-rows-rows-at-mo` | message with a value in it | `portalPageModel.ts:714` | A column holds {MAX_ROWS} rows at most |  |

### 5.21 `PORTAL_TEMPLATES`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `page.classic-service-desk` | name | `supportPortalData.ts:75` | Classic Service Desk |  |
| `page.the-default-serviceops-portal-hero` | description | `supportPortalData.ts:76` | The default ServiceOps portal — hero search, three quick actions, and the requester’s own work below. |  |
| `page.most-used` | badge | `supportPortalData.ts:80` | Most used |  |
| `page.hero-search` | string | `supportPortalData.ts:81` | Hero search |  |
| `page.quick-actions-2` | string | `supportPortalData.ts:81` | Quick actions |  |
| `page.my-open-requests-2` | string | `supportPortalData.ts:81` | My Open Requests |  |
| `page.pending-approvals-2` | string | `supportPortalData.ts:81` | Pending Approvals |  |
| `page.most-read-2` | string | `supportPortalData.ts:81` | Most Read |  |
| `page.my-assets-4` | string | `supportPortalData.ts:81` | My Assets |  |
| `page.my-cis-4` | string | `supportPortalData.ts:81` | My CIs |  |
| `page.search-spotlight` | name | `supportPortalData.ts:85` | Search Spotlight |  |
| `page.puts-deflection-first-a-full-bleed` | description | `supportPortalData.ts:86` | Puts deflection first: a full-bleed search hero with popular articles surfaced before any form. |  |
| `page.full-bleed-search` | string | `supportPortalData.ts:90` | Full-bleed search |  |
| `page.popular-articles` | string | `supportPortalData.ts:90` | Popular articles |  |
| `page.service-catalog-first` | name | `supportPortalData.ts:94` | Service Catalog First |  |
| `page.leads-with-browsable-service-categ` | description | `supportPortalData.ts:95` | Leads with browsable service categories for portals where most traffic is a request, not an incident. |  |
| `page.general-2` | category | `supportPortalData.ts:96` | General |  |
| `page.compact-search` | string | `supportPortalData.ts:99` | Compact search |  |
| `page.category-grid` | string | `supportPortalData.ts:99` | Category grid |  |
| `page.featured-services` | string | `supportPortalData.ts:99` | Featured services |  |
| `page.knowledge-hub` | name | `supportPortalData.ts:103` | Knowledge Hub |  |
| `page.a-self-service-reading-room-curate` | description | `supportPortalData.ts:104` | A self-service reading room — curated collections, most read, and a contact-us fallback at the end. |  |
| `page.search-hero` | string | `supportPortalData.ts:108` | Search hero |  |
| `page.collections` | string | `supportPortalData.ts:108` | Collections |  |
| `page.contact-us-3` | string | `supportPortalData.ts:108` | Contact us |  |
| `page.people-hr-desk` | name | `supportPortalData.ts:112` | People & HR Desk |  |
| `page.an-hr-facing-portal-leave-payroll-` | description | `supportPortalData.ts:113` | An HR-facing portal — leave, payroll and onboarding requests up front, policy documents beside them. |  |
| `page.hr-2` | category | `supportPortalData.ts:114` | HR |  |
| `page.hr-service-categories` | string | `supportPortalData.ts:117` | HR service categories |  |
| `page.policy-documents` | string | `supportPortalData.ts:117` | Policy documents |  |
| `page.minimal-landing` | name | `supportPortalData.ts:121` | Minimal Landing |  |
| `page.one-search-field-and-three-actions` | description | `supportPortalData.ts:122` | One search field and three actions on a light canvas. Nothing else competes for the first click. |  |
| `page.new` | badge | `supportPortalData.ts:126` | New |  |
| `page.light-hero` | string | `supportPortalData.ts:127` | Light hero |  |
| `page.announcements-3` | string | `supportPortalData.ts:127` | Announcements |  |
| `page.announcements-status` | name | `supportPortalData.ts:131` | Announcements & Status |  |
| `page.opens-with-live-announcements-and-` | description | `supportPortalData.ts:132` | Opens with live announcements and service status, for portals used during major incidents. |  |
| `page.facilities-2` | category | `supportPortalData.ts:133` | Facilities |  |
| `page.announcement-banner` | string | `supportPortalData.ts:136` | Announcement banner |  |
| `page.service-status` | string | `supportPortalData.ts:136` | Service status |  |

### 5.22 `DEFAULT_PORTAL_PAGE`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `page.spp-1` | id | `supportPortalData.ts:148` | SPP-1 |  |
| `page.support-portal` | name | `supportPortalData.ts:149` | Support Portal |  |
| `page.published-2` | status | `supportPortalData.ts:152` | Published |  |
| `page.classic-service-desk-2` | source | `supportPortalData.ts:153` | Classic Service Desk |  |
| `page.all-requesters` | audience | `supportPortalData.ts:154` | All requesters |  |
| `page.mon-aug-17-2026-09-14-am` | modifiedAt | `supportPortalData.ts:155` | Mon, Aug 17, 2026 09:14 AM |  |
| `page.juli-gopani` | modifiedBy | `supportPortalData.ts:156` | Juli Gopani |  |
| `page.acme-corporation` | company | `supportPortalData.ts:161` | Acme Corporation |  |
| `page.none-use-serviceops-login` | idp | `supportPortalData.ts:163` | None — use ServiceOps login |  |

### 5.23 `SECOND_PORTAL_PAGE`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `page.spp-2` | id | `supportPortalData.ts:170` | SPP-2 |  |
| `page.support-portal-2` | name | `supportPortalData.ts:171` | Support Portal - 2 |  |

### 5.24 `relPortalStamp`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `page.days-ago` | string | `supportPortalData.ts:187` | days ago |  |
| `page.a-month-ago` | string | `supportPortalData.ts:189` | a month ago |  |
| `page.months-ago` | string | `supportPortalData.ts:189` | months ago |  |

### 5.25 `TEMPLATE_CATEGORIES`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `page.all` | string | `supportPortalData.ts:192` | All |  |
| `page.it-support-2` | string | `supportPortalData.ts:192` | IT Support |  |

### 5.26 `PORTAL_QUICK_ACTIONS`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `page.new-incident-3` | title / tooltip | `supportPortalData.ts:201` | New Incident |  |
| `page.report-an-incident-3` | description | `supportPortalData.ts:201` | Report an incident |  |
| `page.request-service-3` | title / tooltip | `supportPortalData.ts:202` | Request Service |  |
| `page.browse-the-services-offered-2` | description | `supportPortalData.ts:202` | Browse the services offered |  |
| `page.knowledge-6` | title / tooltip | `supportPortalData.ts:203` | Knowledge |  |
| `page.browse-knowledge-2` | description | `supportPortalData.ts:203` | Browse knowledge |  |

### 5.27 `PORTAL_OPEN_REQUESTS`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `page.sr-201` | id | `supportPortalData.ts:212` | SR-201 |  |
| `page.request-for-new-laptop` | subject | `supportPortalData.ts:212` | Request for New Laptop |  |
| `page.wed-aug-12-2026-10-09-am` | at | `supportPortalData.ts:212` | Wed, Aug 12, 2026 10:09 AM |  |
| `page.open-2` | status | `supportPortalData.ts:212` | Open |  |
| `page.inc-187` | id | `supportPortalData.ts:213` | INC-187 |  |
| `page.cannot-create-kb-article` | subject | `supportPortalData.ts:213` | Cannot Create KB Article |  |
| `page.mon-aug-10-2026-11-43-am` | at | `supportPortalData.ts:213` | Mon, Aug 10, 2026 11:43 AM |  |
| `page.in-progress-2` | status | `supportPortalData.ts:213` | In Progress |  |
| `page.sr-180` | id | `supportPortalData.ts:214` | SR-180 |  |
| `page.employee-on-boarding` | subject | `supportPortalData.ts:214` | Employee On-boarding |  |
| `page.wed-aug-05-2026-03-22-pm` | at | `supportPortalData.ts:214` | Wed, Aug 05, 2026 03:22 PM |  |
| `page.inc-178` | id | `supportPortalData.ts:215` | INC-178 |  |
| `page.password-reset-required` | subject | `supportPortalData.ts:215` | Password Reset Required |  |
| `page.wed-aug-05-2026-12-03-pm` | at | `supportPortalData.ts:215` | Wed, Aug 05, 2026 12:03 PM |  |
| `page.pending-2` | status | `supportPortalData.ts:215` | Pending |  |
| `page.inc-170` | id | `supportPortalData.ts:216` | INC-170 |  |
| `page.laptop-slow-and-lagging` | subject | `supportPortalData.ts:216` | Laptop Slow and Lagging |  |
| `page.tue-aug-04-2026-03-51-pm` | at | `supportPortalData.ts:216` | Tue, Aug 04, 2026 03:51 PM |  |
| `page.sr-166` | id | `supportPortalData.ts:217` | SR-166 |  |
| `page.access-to-finance-drive` | subject | `supportPortalData.ts:217` | Access to Finance Drive |  |
| `page.mon-aug-03-2026-09-14-am` | at | `supportPortalData.ts:217` | Mon, Aug 03, 2026 09:14 AM |  |
| `page.on-hold-2` | status | `supportPortalData.ts:217` | On Hold |  |
| `page.inc-159` | id | `supportPortalData.ts:218` | INC-159 |  |
| `page.vpn-disconnects-frequently` | subject | `supportPortalData.ts:218` | VPN Disconnects Frequently |  |
| `page.fri-jul-31-2026-04-02-pm` | at | `supportPortalData.ts:218` | Fri, Jul 31, 2026 04:02 PM |  |
| `page.inc-151` | id | `supportPortalData.ts:219` | INC-151 |  |
| `page.monitor-flickering` | subject | `supportPortalData.ts:219` | Monitor Flickering |  |
| `page.thu-jul-30-2026-11-20-am` | at | `supportPortalData.ts:219` | Thu, Jul 30, 2026 11:20 AM |  |
| `page.resolved-2` | status | `supportPortalData.ts:219` | Resolved |  |
| `page.sr-147` | id | `supportPortalData.ts:220` | SR-147 |  |
| `page.software-license-renewal` | subject | `supportPortalData.ts:220` | Software License Renewal |  |
| `page.wed-jul-29-2026-02-45-pm` | at | `supportPortalData.ts:220` | Wed, Jul 29, 2026 02:45 PM |  |
| `page.closed-2` | status | `supportPortalData.ts:220` | Closed |  |
| `page.inc-142` | id | `supportPortalData.ts:221` | INC-142 |  |
| `page.printer-not-responding` | subject | `supportPortalData.ts:221` | Printer Not Responding |  |
| `page.tue-jul-28-2026-10-33-am` | at | `supportPortalData.ts:221` | Tue, Jul 28, 2026 10:33 AM |  |
| `page.reopened-2` | status | `supportPortalData.ts:221` | Reopened |  |

### 5.28 `REQUEST_STATUS_TONE`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `page.open-3` | string | `supportPortalData.ts:226` | Open |  |
| `page.in-progress-3` | string | `supportPortalData.ts:227` | In Progress |  |
| `page.pending-3` | string | `supportPortalData.ts:228` | Pending |  |
| `page.on-hold-3` | string | `supportPortalData.ts:229` | On Hold |  |
| `page.resolved-3` | string | `supportPortalData.ts:230` | Resolved |  |
| `page.closed-3` | string | `supportPortalData.ts:231` | Closed |  |
| `page.reopened-3` | string | `supportPortalData.ts:232` | Reopened |  |

### 5.29 `PORTAL_APPROVALS`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `page.inc-192` | id | `supportPortalData.ts:257` | INC-192 |  |
| `page.wrong-configuration-details` | subject | `supportPortalData.ts:257` | Wrong configuration details |  |
| `page.peer-review-requested` | reason | `supportPortalData.ts:257` | Peer review requested |  |
| `page.tue-aug-11-2026-02-14-pm` | at | `supportPortalData.ts:258` | Tue, Aug 11, 2026 02:14 PM |  |
| `page.rosy` | by | `supportPortalData.ts:258` | Rosy |  |
| `page.ro` | initials | `supportPortalData.ts:258` | RO |  |
| `page.ast-13` | id | `supportPortalData.ts:261` | AST-13 |  |
| `page.desktop-5jppi6f` | subject | `supportPortalData.ts:261` | DESKTOP-5JPPI6F |  |
| `page.approval-required-for-ast-13` | reason | `supportPortalData.ts:261` | Approval Required for - AST-13 |  |
| `page.mon-aug-10-2026-12-57-pm` | at | `supportPortalData.ts:262` | Mon, Aug 10, 2026 12:57 PM |  |
| `page.keya` | by | `supportPortalData.ts:262` | Keya |  |
| `page.ke` | initials | `supportPortalData.ts:262` | KE |  |

### 5.30 `PORTAL_ARTICLES`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `page.kb-4` | id | `supportPortalData.ts:267` | KB-4 |  |
| `page.how-to-reset-your-password-2` | title / tooltip | `supportPortalData.ts:267` | How to Reset Your Password |  |
| `page.thu-jul-30-2026-11-34-am` | at | `supportPortalData.ts:267` | Thu, Jul 30, 2026 11:34 AM |  |
| `page.guideline-documents` | tag | `supportPortalData.ts:267` | Guideline Documents |  |
| `page.kb-1` | id | `supportPortalData.ts:268` | KB-1 |  |
| `page.connecting-to-company-vpn-2` | title / tooltip | `supportPortalData.ts:268` | Connecting to Company VPN |  |
| `page.sun-jul-19-2026-10-58-pm` | at | `supportPortalData.ts:268` | Sun, Jul 19, 2026 10:58 PM |  |
| `page.faqs` | tag | `supportPortalData.ts:268` | FAQs |  |
| `page.kb-6` | id | `supportPortalData.ts:269` | KB-6 |  |
| `page.reporting-a-hardware-fault-2` | title / tooltip | `supportPortalData.ts:269` | Reporting a Hardware Fault |  |
| `page.tue-aug-11-2026-04-38-pm` | at | `supportPortalData.ts:269` | Tue, Aug 11, 2026 04:38 PM |  |

### 5.31 `PORTAL_ELEMENT_GROUPS`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `page.data` | string | `supportPortalData.ts:280` | Data |  |
| `page.actions-2` | string | `supportPortalData.ts:280` | Actions |  |
| `page.basic` | string | `supportPortalData.ts:280` | Basic |  |
| `page.visual` | string | `supportPortalData.ts:280` | Visual |  |

### 5.32 `RECORD_MODULES`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `page.requests-2` | field label | `supportPortalData.ts:335` | Requests |  |
| `page.password-reset-required-2` | title / tooltip | `supportPortalData.ts:338` | Password reset required |  |
| `page.raised-05-aug-2026` | meta | `supportPortalData.ts:338` | Raised 05 Aug 2026 |  |
| `page.laptop-slow-and-lagging-2` | title / tooltip | `supportPortalData.ts:339` | Laptop slow and lagging |  |
| `page.raised-04-aug-2026` | meta | `supportPortalData.ts:339` | Raised 04 Aug 2026 |  |
| `page.employee-on-boarding-2` | title / tooltip | `supportPortalData.ts:340` | Employee on-boarding |  |
| `page.problems` | field label | `supportPortalData.ts:344` | Problems |  |
| `page.known-error` | string | `supportPortalData.ts:345` | Known Error |  |
| `page.under-investigation` | string | `supportPortalData.ts:345` | Under Investigation |  |
| `page.prb-4412` | id | `supportPortalData.ts:347` | PRB-4412 |  |
| `page.recurring-vpn-drops-on-the-pune-li` | title / tooltip | `supportPortalData.ts:347` | Recurring VPN drops on the Pune link |  |
| `page.under-investigation-2` | status | `supportPortalData.ts:347` | Under Investigation |  |
| `page.network` | meta | `supportPortalData.ts:347` | Network |  |
| `page.prb-4390` | id | `supportPortalData.ts:348` | PRB-4390 |  |
| `page.outlook-profile-corruption-after-u` | title / tooltip | `supportPortalData.ts:348` | Outlook profile corruption after update |  |
| `page.known-error-2` | status | `supportPortalData.ts:348` | Known Error |  |
| `page.end-user-computing` | meta | `supportPortalData.ts:348` | End user computing |  |
| `page.changes-2` | field label | `supportPortalData.ts:352` | Changes |  |
| `page.submitted` | string | `supportPortalData.ts:353` | Submitted |  |
| `page.approved` | string | `supportPortalData.ts:353` | Approved |  |
| `page.scheduled` | string | `supportPortalData.ts:353` | Scheduled |  |
| `page.implemented` | string | `supportPortalData.ts:353` | Implemented |  |
| `page.chg-2091` | id | `supportPortalData.ts:355` | CHG-2091 |  |
| `page.core-switch-firmware-upgrade` | title / tooltip | `supportPortalData.ts:355` | Core switch firmware upgrade |  |
| `page.scheduled-2` | status | `supportPortalData.ts:355` | Scheduled |  |
| `page.window-16-aug-02-00` | meta | `supportPortalData.ts:355` | Window 16 Aug, 02:00 |  |
| `page.chg-2088` | id | `supportPortalData.ts:356` | CHG-2088 |  |
| `page.exchange-mailbox-quota-increase` | title / tooltip | `supportPortalData.ts:356` | Exchange mailbox quota increase |  |
| `page.approved-2` | status | `supportPortalData.ts:356` | Approved |  |
| `page.standard` | meta | `supportPortalData.ts:356` | Standard |  |
| `page.releases` | field label | `supportPortalData.ts:360` | Releases |  |
| `page.planning` | string | `supportPortalData.ts:361` | Planning |  |
| `page.build` | string | `supportPortalData.ts:361` | Build |  |
| `page.testing` | string | `supportPortalData.ts:361` | Testing |  |
| `page.deployed` | string | `supportPortalData.ts:361` | Deployed |  |
| `page.rel-118` | id | `supportPortalData.ts:363` | REL-118 |  |
| `page.serviceops-8-4-rollout` | title / tooltip | `supportPortalData.ts:363` | ServiceOps 8.4 rollout |  |
| `page.testing-2` | status | `supportPortalData.ts:363` | Testing |  |
| `page.go-live-22-aug` | meta | `supportPortalData.ts:363` | Go-live 22 Aug |  |
| `page.rel-114` | id | `supportPortalData.ts:364` | REL-114 |  |
| `page.payroll-portal-refresh` | title / tooltip | `supportPortalData.ts:364` | Payroll portal refresh |  |
| `page.deployed-2` | status | `supportPortalData.ts:364` | Deployed |  |
| `page.finance` | meta | `supportPortalData.ts:364` | Finance |  |
| `page.assets` | field label | `supportPortalData.ts:368` | Assets |  |
| `page.in-use` | string | `supportPortalData.ts:369` | In Use |  |
| `page.in-stock` | string | `supportPortalData.ts:369` | In Stock |  |
| `page.in-repair` | string | `supportPortalData.ts:369` | In Repair |  |
| `page.retired` | string | `supportPortalData.ts:369` | Retired |  |
| `page.ast-3-2` | id | `supportPortalData.ts:371` | AST-3 |  |
| `page.dell-latitude-5440-2` | title / tooltip | `supportPortalData.ts:371` | Dell Latitude 5440 |  |
| `page.in-use-2` | status | `supportPortalData.ts:371` | In Use |  |
| `page.laptop-2` | meta | `supportPortalData.ts:371` | Laptop |  |
| `page.ast-12-2` | id | `supportPortalData.ts:372` | AST-12 |  |
| `page.jabra-evolve2-65-2` | title / tooltip | `supportPortalData.ts:372` | Jabra Evolve2 65 |  |
| `page.headset-2` | meta | `supportPortalData.ts:372` | Headset |  |
| `page.ast-9-2` | id | `supportPortalData.ts:373` | AST-9 |  |
| `page.iphone-14-2` | title / tooltip | `supportPortalData.ts:373` | iPhone 14 |  |
| `page.in-stock-2` | status | `supportPortalData.ts:373` | In Stock |  |
| `page.mobile-2` | meta | `supportPortalData.ts:373` | Mobile |  |
| `page.configuration-items` | field label | `supportPortalData.ts:377` | Configuration Items |  |
| `page.operational` | string | `supportPortalData.ts:378` | Operational |  |
| `page.degraded` | string | `supportPortalData.ts:378` | Degraded |  |
| `page.down` | string | `supportPortalData.ts:378` | Down |  |
| `page.ci-104` | id | `supportPortalData.ts:380` | CI-104 |  |
| `page.app-prod-01-2` | title / tooltip | `supportPortalData.ts:380` | app-prod-01 |  |
| `page.operational-2` | status | `supportPortalData.ts:380` | Operational |  |
| `page.server-2` | meta | `supportPortalData.ts:380` | Server |  |
| `page.ci-121` | id | `supportPortalData.ts:381` | CI-121 |  |
| `page.core-switch-b` | title / tooltip | `supportPortalData.ts:381` | core-switch-b |  |
| `page.degraded-2` | status | `supportPortalData.ts:381` | Degraded |  |
| `page.switch` | meta | `supportPortalData.ts:381` | Switch |  |
| `page.patches` | field label | `supportPortalData.ts:385` | Patches |  |
| `page.missing` | string | `supportPortalData.ts:386` | Missing |  |
| `page.installed` | string | `supportPortalData.ts:386` | Installed |  |
| `page.ignored` | string | `supportPortalData.ts:386` | Ignored |  |
| `page.failed` | string | `supportPortalData.ts:386` | Failed |  |
| `page.pch-4345` | id | `supportPortalData.ts:388` | PCH-4345 |  |
| `page.cumulative-update-for-windows-11` | title / tooltip | `supportPortalData.ts:388` | Cumulative update for Windows 11 |  |
| `page.missing-2` | status | `supportPortalData.ts:388` | Missing |  |
| `page.critical` | meta | `supportPortalData.ts:388` | Critical |  |
| `page.pch-4302` | id | `supportPortalData.ts:389` | PCH-4302 |  |
| `page.chrome-128-security-update` | title / tooltip | `supportPortalData.ts:389` | Chrome 128 security update |  |
| `page.installed-2` | status | `supportPortalData.ts:389` | Installed |  |
| `page.important` | meta | `supportPortalData.ts:389` | Important |  |
| `page.vulnerabilities` | field label | `supportPortalData.ts:393` | Vulnerabilities |  |
| `page.detected` | string | `supportPortalData.ts:394` | Detected |  |
| `page.exploited` | string | `supportPortalData.ts:394` | Exploited |  |
| `page.patched` | string | `supportPortalData.ts:394` | Patched |  |
| `page.accepted-risk` | string | `supportPortalData.ts:394` | Accepted Risk |  |
| `page.cve-2024-30080` | id | `supportPortalData.ts:396` | CVE-2024-30080 |  |
| `page.windows-msmq-remote-code-execution` | title / tooltip | `supportPortalData.ts:396` | Windows MSMQ remote code execution |  |
| `page.exploited-2` | status | `supportPortalData.ts:396` | Exploited |  |
| `page.cvss-9-8` | meta | `supportPortalData.ts:396` | CVSS 9.8 |  |
| `page.cve-2024-30078` | id | `supportPortalData.ts:397` | CVE-2024-30078 |  |
| `page.wi-fi-driver-remote-code-execution` | title / tooltip | `supportPortalData.ts:397` | Wi-Fi driver remote code execution |  |
| `page.detected-2` | status | `supportPortalData.ts:397` | Detected |  |
| `page.cvss-8-8` | meta | `supportPortalData.ts:397` | CVSS 8.8 |  |
| `page.approvals-2` | field label | `supportPortalData.ts:401` | Approvals |  |
| `page.rejected` | string | `supportPortalData.ts:402` | Rejected |  |
| `page.approval-required-for-desktop-5jpp` | title / tooltip | `supportPortalData.ts:404` | Approval required for DESKTOP-5JPPI6F |  |
| `page.requested-by-keya` | meta | `supportPortalData.ts:404` | Requested by Keya |  |
| `page.adobe-creative-cloud-licence` | title / tooltip | `supportPortalData.ts:405` | Adobe Creative Cloud licence |  |
| `page.software` | meta | `supportPortalData.ts:405` | Software |  |
| `page.tasks-2` | field label | `supportPortalData.ts:409` | Tasks |  |
| `page.completed` | string | `supportPortalData.ts:410` | Completed |  |
| `page.cancelled` | string | `supportPortalData.ts:410` | Cancelled |  |
| `page.ta-2201` | id | `supportPortalData.ts:412` | TA-2201 |  |
| `page.collect-the-returned-laptop` | title / tooltip | `supportPortalData.ts:412` | Collect the returned laptop |  |
| `page.due-18-aug` | meta | `supportPortalData.ts:412` | Due 18 Aug |  |
| `page.ta-2194` | id | `supportPortalData.ts:413` | TA-2194 |  |
| `page.revoke-building-access` | title / tooltip | `supportPortalData.ts:413` | Revoke building access |  |
| `page.completed-2` | status | `supportPortalData.ts:413` | Completed |  |
| `page.facilities-3` | meta | `supportPortalData.ts:413` | Facilities |  |

### 5.33 `PORTAL_ELEMENTS`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `page.my-open-requests-3` | name | `supportPortalData.ts:431` | My Open Requests |  |
| `page.data-2` | group | `supportPortalData.ts:431` | Data |  |
| `page.tickets-incidents-open` | search keywords | `supportPortalData.ts:431` | tickets incidents open |  |
| `page.pending-approvals-3` | name | `supportPortalData.ts:432` | Pending Approvals |  |
| `page.pending-approve` | search keywords | `supportPortalData.ts:432` | pending approve |  |
| `page.my-assets-5` | name | `supportPortalData.ts:433` | My Assets |  |
| `page.hardware-devices` | search keywords | `supportPortalData.ts:433` | hardware devices |  |
| `page.my-cis-5` | name | `supportPortalData.ts:434` | My CIs |  |
| `page.configuration-items-cmdb` | search keywords | `supportPortalData.ts:434` | configuration items cmdb |  |
| `page.announcements-4` | name | `supportPortalData.ts:440` | Announcements |  |
| `page.news-broadcast-banner` | search keywords | `supportPortalData.ts:440` | news broadcast banner |  |
| `page.most-read-knowledge` | name | `supportPortalData.ts:441` | Most Read Knowledge |  |
| `page.articles-kb-most-read` | search keywords | `supportPortalData.ts:441` | articles kb most read |  |
| `page.contact-us-4` | name | `supportPortalData.ts:446` | Contact Us |  |
| `page.support-escalate-raise` | search keywords | `supportPortalData.ts:446` | support escalate raise |  |
| `page.favourite-services-2` | name | `supportPortalData.ts:465` | Favourite Services |  |
| `page.pinned-starred-saved-shortcuts` | search keywords | `supportPortalData.ts:465` | pinned starred saved shortcuts |  |
| `page.most-used-services-2` | name | `supportPortalData.ts:466` | Most Used Services |  |
| `page.catalog-request-service-favourites` | search keywords | `supportPortalData.ts:466` | catalog request service favourites featured |  |
| `page.faq` | name | `supportPortalData.ts:469` | FAQ |  |
| `page.custom-2` | group | `supportPortalData.ts:469` | Custom |  |
| `page.questions-help-answers` | search keywords | `supportPortalData.ts:469` | questions help answers |  |
| `page.custom-data-widget` **Δ** | name | `supportPortalData.ts:474` | Custom data widget |  |
| `page.list-records-kpi-count-metric-requ` **Δ** | search keywords | `supportPortalData.ts:474` | list records kpi count metric requests assets cis filter module query data |  |
| `page.new-incident-4` | name | `supportPortalData.ts:484` | New Incident |  |
| `page.actions-3` | group | `supportPortalData.ts:484` | Actions |  |
| `page.report-issue-raise-ticket` | search keywords | `supportPortalData.ts:484` | report issue raise ticket |  |
| `page.request-service-4` | name | `supportPortalData.ts:485` | Request Service |  |
| `page.catalog-order` | search keywords | `supportPortalData.ts:485` | catalog order |  |
| `page.ad-self-service-3` | name | `supportPortalData.ts:486` | AD Self Service |  |
| `page.password-reset-domain-unlock` | search keywords | `supportPortalData.ts:486` | password reset domain unlock |  |
| `page.knowledge-7` | name | `supportPortalData.ts:487` | Knowledge |  |
| `page.articles-help-search` | search keywords | `supportPortalData.ts:487` | articles help search |  |
| `page.advanced-tabs` | name | `supportPortalData.ts:489` | Advanced Tabs |  |
| `page.basic-2` | group | `supportPortalData.ts:489` | Basic |  |
| `page.divider` | name | `supportPortalData.ts:490` | Divider |  |
| `page.vertical-horizontal-v-h-separator-` | search keywords | `supportPortalData.ts:490` | vertical horizontal v/h separator rule |  |
| `page.paragraph-body-copy` | search keywords | `supportPortalData.ts:503` | paragraph body copy |  |
| `page.cta-link-action` | search keywords | `supportPortalData.ts:504` | cta link action |  |
| `page.spacer` | name | `supportPortalData.ts:505` | Spacer |  |
| `page.gap-whitespace` | search keywords | `supportPortalData.ts:505` | gap whitespace |  |
| `page.table` | name | `supportPortalData.ts:506` | Table |  |
| `page.grid-rows-columns-data` | search keywords | `supportPortalData.ts:506` | grid rows columns data |  |
| `page.accordion` | name | `supportPortalData.ts:507` | Accordion |  |
| `page.collapse-faq-expand` | search keywords | `supportPortalData.ts:507` | collapse faq expand |  |
| `page.text-with-image` | name | `supportPortalData.ts:508` | Text with Image |  |
| `page.media-split` | search keywords | `supportPortalData.ts:508` | media split |  |
| `page.card` | name | `supportPortalData.ts:511` | Card |  |
| `page.tile-panel` | search keywords | `supportPortalData.ts:511` | tile panel |  |
| `page.image` | name | `supportPortalData.ts:514` | Image |  |
| `page.visual-2` | group | `supportPortalData.ts:514` | Visual |  |
| `page.picture-photo` | search keywords | `supportPortalData.ts:514` | picture photo |  |
| `page.video` | name | `supportPortalData.ts:515` | Video |  |
| `page.youtube-vimeo-mp4-embed-player-cli` | search keywords | `supportPortalData.ts:515` | youtube vimeo mp4 embed player clip |  |
| `page.media-slider` | name | `supportPortalData.ts:516` | Media Slider |  |
| `page.carousel-gallery` | search keywords | `supportPortalData.ts:516` | carousel gallery |  |
| `page.action-card` | name | `supportPortalData.ts:523` | Action Card |  |
| `page.quick-action-tile` | search keywords | `supportPortalData.ts:523` | quick action tile |  |
| `page.kpi` | name | `supportPortalData.ts:529` | KPI |  |
| `page.metric-stat-number` | search keywords | `supportPortalData.ts:529` | metric stat number |  |

### 5.34 `MONTHS`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `page.jan` | string | `supportPortalData.ts:534` | Jan |  |
| `page.mar` | string | `supportPortalData.ts:534` | Mar |  |
| `page.apr` | string | `supportPortalData.ts:534` | Apr |  |
| `page.may` | string | `supportPortalData.ts:534` | May |  |
| `page.jun` | string | `supportPortalData.ts:534` | Jun |  |
| `page.jul` | string | `supportPortalData.ts:534` | Jul |  |
| `page.aug` | string | `supportPortalData.ts:534` | Aug |  |
| `page.sep` | string | `supportPortalData.ts:534` | Sep |  |
| `page.oct` | string | `supportPortalData.ts:534` | Oct |  |
| `page.nov` | string | `supportPortalData.ts:534` | Nov |  |

### 5.35 `DAYS`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `page.sun` | string | `supportPortalData.ts:535` | Sun |  |
| `page.mon` | string | `supportPortalData.ts:535` | Mon |  |
| `page.tue` | string | `supportPortalData.ts:535` | Tue |  |
| `page.wed` | string | `supportPortalData.ts:535` | Wed |  |
| `page.thu` | string | `supportPortalData.ts:535` | Thu |  |
| `page.fri` | string | `supportPortalData.ts:535` | Fri |  |
| `page.sat` | string | `supportPortalData.ts:535` | Sat |  |

### 5.36 `formatPortalStamp`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `page.am` | string | `supportPortalData.ts:542` | AM |  |
| `page.pm` | string | `supportPortalData.ts:542` | PM |  |

## 6. Builder — canvas chrome

*`PortalCanvas.tsx`* — 76 entries

### 6.1 `sizeOf`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `canvas.0-0-auto` | flex | `PortalCanvas.tsx:162` | 0 0 auto |  |

### 6.2 `ElementPicker`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `canvas.replace-with` | string | `PortalCanvas.tsx:303` | Replace with… |  |
| `canvas.search-elements` | string | `PortalCanvas.tsx:303` | Search elements |  |

### 6.3 `BUTTON_STYLES`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `canvas.icon` | string | `PortalCanvas.tsx:431` | Icon |  |

### 6.4 `ButtonStyleMenu`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `canvas.button-style` | data-tip | `PortalCanvas.tsx:443` | Button style |  |

### 6.5 `ITEM_FIELDS`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `canvas.title` | string | `PortalCanvas.tsx:482` | Title |  |
| `canvas.description` | string | `PortalCanvas.tsx:482` | Description |  |
| `canvas.question` | string | `PortalCanvas.tsx:483` | Question |  |
| `canvas.answer` | string | `PortalCanvas.tsx:483` | Answer |  |

### 6.6 `AddItemMenu`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `canvas.item-added` | string | `PortalCanvas.tsx:500` | Item added |  |
| `canvas.add-item` | on-screen text | `PortalCanvas.tsx:508` | Add item |  |
| `canvas.cancel` | on-screen text | `PortalCanvas.tsx:534` | Cancel |  |

### 6.7 `CaptionMenu`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `canvas.the-line-of-words-under-this-pictu` | data-tip | `PortalCanvas.tsx:562` | The line of words under this picture |  |
| `canvas.edit-caption` | string | `PortalCanvas.tsx:564` | Edit caption |  |
| `canvas.add-caption` | string | `PortalCanvas.tsx:564` | Add caption |  |
| `canvas.what-this-picture-shows` | placeholder | `PortalCanvas.tsx:577` | What this picture shows |  |
| `canvas.caption` | on-screen text | `PortalCanvas.tsx:572` | Caption |  |
| `canvas.save` | on-screen text | `PortalCanvas.tsx:588` | Save |  |

### 6.8 `ElementToolbar`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `canvas.move-left` | string | `PortalCanvas.tsx:615` | Move left |  |
| `canvas.move-right` | string | `PortalCanvas.tsx:616` | Move right |  |
| `canvas.move-down` | string | `PortalCanvas.tsx:619` | Move down |  |
| `canvas.move-up` | string | `PortalCanvas.tsx:620` | Move up |  |
| `canvas.drag-to-move` | data-tip | `PortalCanvas.tsx:713` | Drag to move |  |
| `canvas.split-into-columns` | string | `PortalCanvas.tsx:738` | Split into columns |  |
| `canvas.split-into-rows` | string | `PortalCanvas.tsx:738` | Split into rows |  |
| `canvas.add-a-widget-beside-this-one` | data-tip | `PortalCanvas.tsx:751` | Add a widget beside this one |  |
| `canvas.add-a-block-inside` | string | `PortalCanvas.tsx:768` | Add a block inside |  |
| `canvas.replace-widget` | string | `PortalCanvas.tsx:768` | Replace widget |  |
| `canvas.add-widget` | string | `PortalCanvas.tsx:768` | Add widget |  |
| `canvas.add-a-card-that-opens-a-link-of-yo` | data-tip | `PortalCanvas.tsx:802` | Add a card that opens a link of your choosing |  |
| `canvas.copy` | data-tip | `PortalCanvas.tsx:808` | Copy |  |
| `canvas.external-link` | on-screen text | `PortalCanvas.tsx:804` | External link |  |

### 6.9 `SelectionHandles`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `canvas.drag-to-change-the-gap-above` | title / tooltip | `PortalCanvas.tsx:1128` | Drag to change the gap above |  |

### 6.10 `TextToolbar`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `canvas.par` | string | `PortalCanvas.tsx:1213` | PAR |  |
| `canvas.font` | title / tooltip | `PortalCanvas.tsx:1231` | Font |  |
| `canvas.text-colour` | data-tip | `PortalCanvas.tsx:1258` | Text colour |  |
| `canvas.highlight-colour` | data-tip | `PortalCanvas.tsx:1282` | Highlight colour |  |
| `canvas.clear-formatting` | data-tip | `PortalCanvas.tsx:1313` | Clear formatting |  |
| `canvas.formatting-cleared` | string | `PortalCanvas.tsx:1316` | Formatting cleared |  |
| `canvas.placeholder` | on-screen text | `PortalCanvas.tsx:1339` | Placeholder |  |

### 6.11 `LinkPopover`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `canvas.the-words-that-carry-the-link` | placeholder | `PortalCanvas.tsx:1386` | The words that carry the link |  |
| `canvas.url` | on-screen text | `PortalCanvas.tsx:1383` | URL |  |
| `canvas.open-in-new-tab` | on-screen text | `PortalCanvas.tsx:1389` | Open in new tab |  |
| `canvas.insert` | on-screen text | `PortalCanvas.tsx:1396` | Insert |  |

### 6.12 `PLACEHOLDERS`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `canvas.request` | group | `PortalCanvas.tsx:1410` | Request |  |
| `canvas.service-name` | string | `PortalCanvas.tsx:1410` | Service Name |  |
| `canvas.service-category` | string | `PortalCanvas.tsx:1410` | Service Category |  |
| `canvas.service-cost` | string | `PortalCanvas.tsx:1410` | Service Cost |  |
| `canvas.requester` | group | `PortalCanvas.tsx:1411` | Requester |  |
| `canvas.requester-name` | string | `PortalCanvas.tsx:1411` | Requester Name |  |
| `canvas.created-by-name` | string | `PortalCanvas.tsx:1411` | Created By Name |  |
| `canvas.request-custom-fields` | group | `PortalCanvas.tsx:1412` | Request Custom Fields |  |
| `canvas.new-number` | string | `PortalCanvas.tsx:1412` | New Number |  |
| `canvas.new-dropdown` | string | `PortalCanvas.tsx:1412` | New Dropdown |  |
| `canvas.assets` | string | `PortalCanvas.tsx:1412` | Assets |  |
| `canvas.ci` | string | `PortalCanvas.tsx:1412` | CI |  |
| `canvas.service` | string | `PortalCanvas.tsx:1412` | Service |  |

### 6.13 `PlaceholderPopover`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `canvas.search` | placeholder | `PortalCanvas.tsx:1431` | Search |  |
| `canvas.placeholders` | on-screen text | `PortalCanvas.tsx:1426` | Placeholders |  |
| `canvas.nothing-matches-that` | on-screen text | `PortalCanvas.tsx:1449` | Nothing matches that. |  |

### 6.14 `AddSectionSeam`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `canvas.drag-to-resize-the-section-above` | title / tooltip | `PortalCanvas.tsx:1646` | Drag to resize the section above |  |
| `canvas.drag-to-stretch-the-section-above` | data-tip | `PortalCanvas.tsx:1669` | Drag to stretch the section above |  |
| `canvas.drag-to-stretch-the-section-above-2` | title / tooltip | `PortalCanvas.tsx:1670` | Drag to stretch the section above |  |
| `canvas.add-section` | on-screen text | `PortalCanvas.tsx:1666` | + Add Section |  |
| `canvas.choose-a-layout-for-your-section` | on-screen text | `PortalCanvas.tsx:1682` | Choose a layout for your section |  |
| `canvas.add-section-2` | assembled at render time — the "+" and the words are separate nodes | `PortalCanvas.tsx:0` | + Add Section |  |

### 6.15 `ColumnAddIcon`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `canvas.0-0-24-24` | viewBox | `PortalCanvas.tsx:1712` | 0 0 24 24 |  |

### 6.16 `ColumnAdders`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `canvas.add-a-row-above` | title / tooltip | `PortalCanvas.tsx:1737` | Add a row above |  |
| `canvas.add-a-column-to-the-left` | title / tooltip | `PortalCanvas.tsx:1738` | Add a column to the left |  |
| `canvas.add-a-column-to-the-right` | title / tooltip | `PortalCanvas.tsx:1739` | Add a column to the right |  |
| `canvas.add-a-row-below` | title / tooltip | `PortalCanvas.tsx:1740` | Add a row below |  |
| `canvas.add-an-element-here` | title / tooltip | `PortalCanvas.tsx:1762` | Add an element here |  |

### 6.17 `Sel`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `canvas.translate-50-50` | transform | `PortalCanvas.tsx:1875` | translate(-50%, -50%) |  |
| `canvas.drag-to-place-this-anywhere-in-the` | title / tooltip | `PortalCanvas.tsx:1975` | Drag to place this anywhere in the banner |  |

### 6.18 `(top level)`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `canvas.add-a-tolowercase-to-this-list` | message with a value in it | `PortalCanvas.tsx:512` | Add a {toLowerCase} to this list |  |
| `canvas.linked-to-url` | message with a value in it | `PortalCanvas.tsx:1400` | Linked to {url} |  |

## 7. Right rail 1 — Widgets panel

*`SupportPortalAddPanel.tsx`* — 6 entries

### 7.1 `SupportPortalAddPanel`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `widgets.data` | string | `SupportPortalAddPanel.tsx:126` | Data |  |
| `widgets.search-for-elements` | placeholder | `SupportPortalAddPanel.tsx:202` | Search for elements |  |
| `widgets.already-on-this-page` | screen-reader label | `SupportPortalAddPanel.tsx:317` | Already on this page |  |
| `widgets.no-elements-found` | on-screen text | `SupportPortalAddPanel.tsx:251` | No elements found |  |

### 7.2 `(top level)`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `widgets.name-is-already-on-this-page-remov` | message with a value in it | `SupportPortalAddPanel.tsx:327` | “{name}” is already on this page. Remove it from the page to add it again. |  |
| `widgets.click-to-add-name-or-drag-it-where` | message with a value in it | `SupportPortalAddPanel.tsx:328` | Click to add “{name}”, or drag it where you want it |  |

## 8. Right rail 1 — element hover cards

*`PortalElementPreview.tsx`* — 71 entries

### 8.1 `PREVIEWS`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `hover.view-your-currently-open-requests-` | hover card · what it does | `PortalElementPreview.tsx:125` | View your currently open requests in one place. |  |
| `hover.helps-requesters-quickly-track-req` | hover card · what it is for | `PortalElementPreview.tsx:126` | Helps requesters quickly track requests that still need attention. |  |
| `hover.view-requests-and-items-waiting-fo` | hover card · what it does | `PortalElementPreview.tsx:136` | View requests and items waiting for your approval. |  |
| `hover.helps-requesters-quickly-review-an` | hover card · what it is for | `PortalElementPreview.tsx:137` | Helps requesters quickly review and take action on pending approvals. |  |
| `hover.view-the-assets-assigned-or-associ` | hover card · what it does | `PortalElementPreview.tsx:152` | View the assets assigned or associated with you. |  |
| `hover.helps-requesters-quickly-find-and-` | hover card · what it is for | `PortalElementPreview.tsx:153` | Helps requesters quickly find and review their assigned devices and other assets. |  |
| `hover.view-configuration-items-associate` | hover card · what it does | `PortalElementPreview.tsx:164` | View configuration items associated with you. |  |
| `hover.helps-requesters-quickly-access-th` | hover card · what it is for | `PortalElementPreview.tsx:165` | Helps requesters quickly access the systems or CIs related to them. |  |
| `hover.display-important-announcements-an` | hover card · what it does | `PortalElementPreview.tsx:176` | Display important announcements and updates for requesters. |  |
| `hover.helps-keep-users-informed-about-co` | hover card · what it is for | `PortalElementPreview.tsx:177` | Helps keep users informed about company or IT service updates. |  |
| `hover.show-the-knowledge-articles-viewed` | hover card · what it does | `PortalElementPreview.tsx:187` | Show the knowledge articles viewed most frequently by users. |  |
| `hover.helps-requesters-quickly-find-popu` | hover card · what it is for | `PortalElementPreview.tsx:188` | Helps requesters quickly find popular solutions and helpful information. |  |
| `hover.give-requesters-a-quick-way-to-rep` | hover card · what it does | `PortalElementPreview.tsx:204` | Give requesters a quick way to report an issue. |  |
| `hover.opens-the-incident-creation-form-d` | hover card · what it is for | `PortalElementPreview.tsx:205` | Opens the incident creation form directly from the portal. |  |
| `hover.give-requesters-quick-access-to-th` | hover card · what it does | `PortalElementPreview.tsx:209` | Give requesters quick access to the Service Catalog. |  |
| `hover.helps-users-browse-and-request-the` | hover card · what it is for | `PortalElementPreview.tsx:210` | Helps users browse and request the services available to them. |  |
| `hover.let-users-reset-their-password-or-` | hover card · what it does | `PortalElementPreview.tsx:214` | Let users reset their password or unlock their Active Directory account. |  |
| `hover.provides-self-service-access-witho` | hover card · what it is for | `PortalElementPreview.tsx:215` | Provides self-service access without requiring a support request. |  |
| `hover.available-when-ad-self-service-is-` | note | `PortalElementPreview.tsx:216` | Available when AD Self Service is enabled. |  |
| `hover.give-requesters-quick-access-to-th-2` | hover card · what it does | `PortalElementPreview.tsx:220` | Give requesters quick access to the Knowledge Base. |  |
| `hover.helps-users-find-solutions-and-ans` | hover card · what it is for | `PortalElementPreview.tsx:221` | Helps users find solutions and answers before raising a request. |  |
| `hover.add-text-content-anywhere-on-the-p` | hover card · what it does | `PortalElementPreview.tsx:233` | Add text content anywhere on the portal page. |  |
| `hover.use-it-for-instructions-descriptio` | hover card · what it is for | `PortalElementPreview.tsx:234` | Use it for instructions, descriptions, notices, policies, or other information. |  |
| `hover.add-a-clickable-button-to-the-port` | hover card · what it does | `PortalElementPreview.tsx:250` | Add a clickable button to the portal. |  |
| `hover.use-it-to-provide-a-prominent-entr` | hover card · what it is for | `PortalElementPreview.tsx:251` | Use it to provide a prominent entry point to a supported portal action or destination. |  |
| `hover.display-structured-information-in-` | hover card · what it does | `PortalElementPreview.tsx:262` | Display structured information in rows and columns. |  |
| `hover.useful-for-presenting-information-` | hover card · what it is for | `PortalElementPreview.tsx:263` | Useful for presenting information that is easier to compare in a tabular format. |  |
| `hover.organize-expandable-content-into-c` | hover card · what it does | `PortalElementPreview.tsx:277` | Organize expandable content into collapsible sections. |  |
| `hover.useful-for-faqs-instructions-polic` | hover card · what it is for | `PortalElementPreview.tsx:278` | Useful for FAQs, instructions, policies, or other content that should remain compact. |  |
| `hover.add-a-visual-content-container-to-` | hover card · what it does | `PortalElementPreview.tsx:300` | Add a visual content container to the portal. |  |
| `hover.use-it-to-group-related-informatio` | hover card · what it is for | `PortalElementPreview.tsx:301` | Use it to group related information, text, images, or supported content in a distinct section. |  |
| `hover.add-a-block-of-text-beside-an-imag` | hover card · what it does | `PortalElementPreview.tsx:311` | Add a block of text beside an image. |  |
| `hover.use-it-for-an-introduction-a-polic` | hover card · what it is for | `PortalElementPreview.tsx:312` | Use it for an introduction, a policy note, or any explanation that reads better with a picture. |  |
| `hover.group-related-content-into-tabs-on` | hover card · what it does | `PortalElementPreview.tsx:323` | Group related content into tabs on the portal page. |  |
| `hover.use-it-to-keep-several-sections-av` | hover card · what it is for | `PortalElementPreview.tsx:324` | Use it to keep several sections available without making the page longer. |  |
| `hover.gap-3-border-b-border-white-0-12` **Δ** | string | `PortalElementPreview.tsx:333` | gap-3 border-b border-white/[0.12] |  |
| `hover.add-a-horizontal-line-between-sect` | hover card · what it does | `PortalElementPreview.tsx:342` | Add a horizontal line between sections. |  |
| `hover.use-it-to-separate-content-visuall` | hover card · what it is for | `PortalElementPreview.tsx:343` | Use it to separate content visually without adding space or text. |  |
| `hover.add-adjustable-empty-space-between` | hover card · what it does | `PortalElementPreview.tsx:354` | Add adjustable empty space between blocks. |  |
| `hover.use-it-to-control-the-gap-between-` | hover card · what it is for | `PortalElementPreview.tsx:355` | Use it to control the gap between sections without changing their content. |  |
| `hover.add-an-image-to-the-portal-page` | hover card · what it does | `PortalElementPreview.tsx:371` | Add an image to the portal page. |  |
| `hover.use-it-for-banners-instructions-an` | hover card · what it is for | `PortalElementPreview.tsx:372` | Use it for banners, instructions, announcements, promotional content, or other visual information. |  |
| `hover.polygon-0-100-22-34-44-100-60-52-8` | clipPath | `PortalElementPreview.tsx:379` | polygon(0 100%, 22% 34%, 44% 100%, 60% 52%, 82% 100%) |  |
| `hover.polygon-0-100-34-30-68-100` | clipPath | `PortalElementPreview.tsx:380` | polygon(0 100%, 34% 30%, 68% 100%) |  |
| `hover.add-a-video-to-the-portal-page` | hover card · what it does | `PortalElementPreview.tsx:390` | Add a video to the portal page. |  |
| `hover.use-it-to-provide-visual-instructi` | hover card · what it is for | `PortalElementPreview.tsx:391` | Use it to provide visual instructions, tutorials, announcements, or other helpful content. |  |
| `hover.add-a-rotating-set-of-images-to-th` | hover card · what it does | `PortalElementPreview.tsx:409` | Add a rotating set of images to the portal page. |  |
| `hover.use-it-to-show-several-banners-or-` | hover card · what it is for | `PortalElementPreview.tsx:410` | Use it to show several banners or announcements in the space of one. |  |
| `hover.display-support-contact-informatio` | hover card · what it does | `PortalElementPreview.tsx:434` | Display support contact information directly on the portal. |  |
| `hover.use-it-to-provide-details-such-as-` | hover card · what it is for | `PortalElementPreview.tsx:435` | Use it to provide details such as support email, phone number, and working hours. |  |
| `hover.show-the-services-marked-as-favori` | hover card · what it does | `PortalElementPreview.tsx:450` | Show the services marked as favorites by the requester. |  |
| `hover.helps-users-quickly-access-the-ser` | hover card · what it is for | `PortalElementPreview.tsx:451` | Helps users quickly access the services they use or need most often. |  |
| `hover.show-the-services-requested-most-f` | hover card · what it does | `PortalElementPreview.tsx:466` | Show the services requested most frequently by users. |  |
| `hover.helps-requesters-quickly-discover-` | hover card · what it is for | `PortalElementPreview.tsx:467` | Helps requesters quickly discover commonly requested services. |  |
| `hover.display-frequently-asked-questions` | hover card · what it does | `PortalElementPreview.tsx:484` | Display frequently asked questions and their answers on the portal. |  |
| `hover.helps-requesters-quickly-find-answ` | hover card · what it is for | `PortalElementPreview.tsx:485` | Helps requesters quickly find answers to common questions without raising a request. |  |
| `hover.add-a-card-that-points-at-any-page` | hover card · what it does | `PortalElementPreview.tsx:500` | Add a card that points at any page or link you choose. |  |
| `hover.use-it-when-a-destination-you-need` | hover card · what it is for | `PortalElementPreview.tsx:501` | Use it when a destination you need is not one of the built-in action cards. |  |
| `hover.display-an-important-number-or-met` | hover card · what it does | `PortalElementPreview.tsx:505` | Display an important number or metric prominently on the portal. |  |
| `hover.use-it-to-show-a-count-such-as-ope` | hover card · what it is for | `PortalElementPreview.tsx:506` | Use it to show a count such as open requests, pending approvals, or other supported ServiceOps information. |  |
| `hover.create-a-data-driven-widget-using-` | hover card · what it does | `PortalElementPreview.tsx:528` | Create a data-driven widget using ServiceOps information that is not covered by the available OOB widgets. |  |
| `hover.select-the-module-define-the-requi` | hover card · what it is for | `PortalElementPreview.tsx:529` | Select the module, define the required filters or conditions, and choose how the information should be displayed. |  |
| `hover.how-do-i-reset-my-password` | on-screen text | `PortalElementPreview.tsx:237` | How do I reset my password? |  |
| `hover.go-to-the-self-service-portal-and-` | on-screen text | `PortalElementPreview.tsx:238` | Go to the self-service portal and choose Forgot password. You’ll get a reset link by email. |  |
| `hover.updated-12-aug-2026` | on-screen text | `PortalElementPreview.tsx:241` | Updated 12 Aug 2026 |  |
| `hover.cancel` | on-screen text | `PortalElementPreview.tsx:255` | Cancel |  |
| `hover.details` | on-screen text | `PortalElementPreview.tsx:256` | Details |  |
| `hover.learn-more` | on-screen text | `PortalElementPreview.tsx:257` | Learn more |  |

### 8.2 `FALLBACK`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `hover.add-this-block-to-the-portal-page` | hover card · what it does | `PortalElementPreview.tsx:551` | Add this block to the portal page. |  |
| `hover.select-it-once-added-to-set-its-co` | hover card · what it is for | `PortalElementPreview.tsx:552` | Select it once added to set its content and style. |  |

### 8.3 `PortalElementPreview`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `hover.10px-10px` | backgroundSize | `PortalElementPreview.tsx:600` | 10px 10px |  |

## 9. Right rail 2 — Theme panel

*`PortalThemePanel.tsx`* — 80 entries

### 9.1 `prim`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `theme.primary-alt` | field label | `PortalThemePanel.tsx:54` | Primary alt |  |
| `theme.page-text` | field label | `PortalThemePanel.tsx:55` | Page text |  |
| `theme.page-background` | field label | `PortalThemePanel.tsx:56` | Page background |  |

### 9.2 `PALETTES`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `theme.blue-magenta` | name | `PortalThemePanel.tsx:60` | Blue Magenta |  |
| `theme.green` | name | `PortalThemePanel.tsx:61` | Green |  |
| `theme.red` | name | `PortalThemePanel.tsx:62` | Red |  |
| `theme.orange` | name | `PortalThemePanel.tsx:63` | Orange |  |
| `theme.blue` | name | `PortalThemePanel.tsx:64` | Blue |  |
| `theme.slate` | name | `PortalThemePanel.tsx:65` | Slate |  |
| `theme.stone` | name | `PortalThemePanel.tsx:66` | Stone |  |
| `theme.teal` | name | `PortalThemePanel.tsx:67` | Teal |  |

### 9.3 `SECONDARY`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `theme.green-2` | field label | `PortalThemePanel.tsx:72` | Green |  |
| `theme.yellow` | field label | `PortalThemePanel.tsx:73` | Yellow |  |
| `theme.orange-2` | field label | `PortalThemePanel.tsx:74` | Orange |  |
| `theme.red-2` | field label | `PortalThemePanel.tsx:75` | Red |  |
| `theme.red-dark` | field label | `PortalThemePanel.tsx:76` | Red dark |  |
| `theme.red-light` | field label | `PortalThemePanel.tsx:77` | Red light |  |

### 9.4 `NEUTRAL`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `theme.darkest` | field label | `PortalThemePanel.tsx:81` | Darkest |  |
| `theme.darker` | field label | `PortalThemePanel.tsx:82` | Darker |  |
| `theme.regular` | field label | `PortalThemePanel.tsx:84` | Regular |  |
| `theme.lighter` | field label | `PortalThemePanel.tsx:86` | Lighter |  |
| `theme.lightest` | field label | `PortalThemePanel.tsx:87` | Lightest |  |

### 9.5 `FONT_PACKS`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `theme.inter` | name | `PortalThemePanel.tsx:93` | Inter |  |
| `theme.inter-sans-serif` | heading | `PortalThemePanel.tsx:93` | Inter, sans-serif |  |
| `theme.inter-sans-serif-2` | body | `PortalThemePanel.tsx:93` | Inter, sans-serif |  |
| `theme.the-product-default-neutral-and-hi` | note | `PortalThemePanel.tsx:93` | The product default. Neutral and highly legible. |  |
| `theme.poppins-inter` | name | `PortalThemePanel.tsx:94` | Poppins & Inter |  |
| `theme.poppins-sans-serif` | heading | `PortalThemePanel.tsx:94` | Poppins, sans-serif |  |
| `theme.geometric-headings-over-a-neutral-` | note | `PortalThemePanel.tsx:94` | Geometric headings over a neutral body. |  |
| `theme.source-sans-3` | name | `PortalThemePanel.tsx:95` | Source Sans 3 |  |
| `theme.source-sans-3-sans-serif` | heading | `PortalThemePanel.tsx:95` | "Source Sans 3", sans-serif |  |
| `theme.source-sans-3-sans-serif-2` | body | `PortalThemePanel.tsx:95` | "Source Sans 3", sans-serif |  |
| `theme.humanist-reads-well-at-small-sizes` | note | `PortalThemePanel.tsx:95` | Humanist. Reads well at small sizes. |  |
| `theme.merriweather-inter` | name | `PortalThemePanel.tsx:96` | Merriweather & Inter |  |
| `theme.merriweather-serif` | heading | `PortalThemePanel.tsx:96` | Merriweather, serif |  |
| `theme.serif-headings-for-a-more-editoria` | note | `PortalThemePanel.tsx:96` | Serif headings for a more editorial portal. |  |
| `theme.roboto` | name | `PortalThemePanel.tsx:97` | Roboto |  |
| `theme.roboto-sans-serif` | heading | `PortalThemePanel.tsx:97` | Roboto, sans-serif |  |
| `theme.roboto-sans-serif-2` | body | `PortalThemePanel.tsx:97` | Roboto, sans-serif |  |
| `theme.tight-and-compact-good-for-dense-p` | note | `PortalThemePanel.tsx:97` | Tight and compact. Good for dense pages. |  |
| `theme.ibm-plex` | name | `PortalThemePanel.tsx:98` | IBM Plex |  |
| `theme.ibm-plex-sans-sans-serif` | heading | `PortalThemePanel.tsx:98` | "IBM Plex Sans", sans-serif |  |
| `theme.ibm-plex-sans-sans-serif-2` | body | `PortalThemePanel.tsx:98` | "IBM Plex Sans", sans-serif |  |
| `theme.technical-with-a-strong-mono-compa` | note | `PortalThemePanel.tsx:98` | Technical, with a strong mono companion. |  |

### 9.6 `BUTTON_STYLES`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `theme.rounded` | name | `PortalThemePanel.tsx:121` | Rounded |  |
| `theme.square` | name | `PortalThemePanel.tsx:122` | Square |  |
| `theme.soft` | name | `PortalThemePanel.tsx:124` | Soft |  |

### 9.7 `THEME_STYLES`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `theme.clarity` | name | `PortalThemePanel.tsx:132` | Clarity |  |
| `theme.the-product-default-neutral-type-a` | note | `PortalThemePanel.tsx:132` | The product default — neutral type and lightly rounded buttons. |  |
| `theme.editorial` | name | `PortalThemePanel.tsx:133` | Editorial |  |
| `theme.serif-headings-and-outlined-button` | note | `PortalThemePanel.tsx:133` | Serif headings and outlined buttons. Reads like a written page. |  |
| `theme.friendly` | name | `PortalThemePanel.tsx:134` | Friendly |  |
| `theme.geometric-type-and-fully-rounded-b` | note | `PortalThemePanel.tsx:134` | Geometric type and fully rounded buttons. Approachable. |  |
| `theme.technical` | name | `PortalThemePanel.tsx:135` | Technical |  |
| `theme.flat-greys-and-hard-corners-utilit` | note | `PortalThemePanel.tsx:135` | Flat greys and hard corners. Utilitarian by design. |  |
| `theme.warmth` | name | `PortalThemePanel.tsx:136` | Warmth |  |
| `theme.amber-accents-on-soft-filled-butto` | note | `PortalThemePanel.tsx:136` | Amber accents on soft-filled buttons. Inviting without shouting. |  |
| `theme.focus` | name | `PortalThemePanel.tsx:137` | Focus |  |
| `theme.compact-type-and-a-muted-violet-ac` | note | `PortalThemePanel.tsx:137` | Compact type and a muted violet accent. The page carries the emphasis. |  |
| `theme.alert` | name | `PortalThemePanel.tsx:138` | Alert |  |
| `theme.for-a-status-or-incident-portal-wh` | note | `PortalThemePanel.tsx:138` | For a status or incident portal, where urgency is the point. |  |
| `theme.calm` | name | `PortalThemePanel.tsx:139` | Calm |  |
| `theme.cool-teal-and-humanist-type-quiet-` | note | `PortalThemePanel.tsx:139` | Cool teal and humanist type. Quiet under heavy use. |  |

### 9.8 `ThemeModeToggle`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `theme.light-mode` | string | `PortalThemePanel.tsx:267` | Light mode |  |
| `theme.dark-mode` | string | `PortalThemePanel.tsx:267` | Dark mode |  |

### 9.9 `PortalThemePanel`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `theme.theme-style` | field label | `PortalThemePanel.tsx:324` | Theme style |  |
| `theme.custom` | string | `PortalThemePanel.tsx:325` | Custom |  |
| `theme.font-family` | field label | `PortalThemePanel.tsx:371` | Font family |  |
| `theme.color` | default value | `PortalThemePanel.tsx:475` | color |  |
| `theme.colour` | field label | `PortalThemePanel.tsx:475` | Colour |  |
| `theme.image` | default value | `PortalThemePanel.tsx:475` | image |  |
| `theme.image-2` | field label | `PortalThemePanel.tsx:475` | Image |  |
| `theme.page-background-2` | title / tooltip | `PortalThemePanel.tsx:489` | Page background |  |
| `theme.colours` | on-screen text | `PortalThemePanel.tsx:417` | Colours |  |
| `theme.home-page-background` | on-screen text | `PortalThemePanel.tsx:467` | Home page background |  |
| `theme.a-colour-or-an-image-behind-the-wh` | on-screen text | `PortalThemePanel.tsx:468` | A colour or an image behind the whole page. |  |
| `theme.page-background-3` | on-screen text | `PortalThemePanel.tsx:480` | Page background |  |
| `theme.the-banner-s-own-image-is-hidden-w` | on-screen text | `PortalThemePanel.tsx:514` | The banner's own image is hidden while this is set, so the page background is what shows. |  |

### 9.10 `StylePreview`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `theme.heading` | on-screen text | `PortalThemePanel.tsx:235` | Heading |  |
| `theme.paragraph-text` | on-screen text | `PortalThemePanel.tsx:236` | Paragraph text |  |

## 10. Right rail 3 — Branding panel

*`PortalBrandingPanel.tsx`* — 35 entries

### 10.1 `PortalBrandingPanel`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `brand.acme-support` | name | `PortalBrandingPanel.tsx:37` | Acme Support |  |
| `brand.none-use-serviceops-login` | idp | `PortalBrandingPanel.tsx:40` | None — use ServiceOps login |  |
| `brand.helpdesk-name` **Δ** | field label | `PortalBrandingPanel.tsx:62` | Helpdesk Name |  |
| `brand.support-portal-title` | field label | `PortalBrandingPanel.tsx:69` | Support Portal Title |  |
| `brand.support-portal` | placeholder | `PortalBrandingPanel.tsx:70` | Support Portal |  |
| `brand.landing-page-for-guest-users` | field label | `PortalBrandingPanel.tsx:74` | Landing Page for Guest Users |  |
| `brand.home` | default value | `PortalBrandingPanel.tsx:78` | home |  |
| `brand.home-page` | field label | `PortalBrandingPanel.tsx:78` | Home Page |  |
| `brand.login` | default value | `PortalBrandingPanel.tsx:78` | login |  |
| `brand.login-page` | field label | `PortalBrandingPanel.tsx:78` | Login Page |  |
| `brand.enable-help-for-support-portal` | field label | `PortalBrandingPanel.tsx:84` | Enable Help For Support Portal |  |
| `brand.url` | default value | `PortalBrandingPanel.tsx:100` | url |  |
| `brand.url-2` | field label | `PortalBrandingPanel.tsx:100` | URL |  |
| `brand.attachment` | field label | `PortalBrandingPanel.tsx:100` | Attachment |  |
| `brand.upload-a-help-document` | string | `PortalBrandingPanel.tsx:125` | Upload a help document |  |
| `brand.identity-provider` | field label | `PortalBrandingPanel.tsx:143` | Identity Provider |  |
| `brand.none-use-serviceops-login-2` | string | `PortalBrandingPanel.tsx:147` | None — use ServiceOps login |  |
| `brand.azure-ad` | string | `PortalBrandingPanel.tsx:147` | Azure AD |  |
| `brand.okta` | string | `PortalBrandingPanel.tsx:147` | Okta |  |
| `brand.google-workspace` | string | `PortalBrandingPanel.tsx:147` | Google Workspace |  |
| `brand.saml-2-0` | string | `PortalBrandingPanel.tsx:147` | SAML 2.0 |  |
| `brand.support-email` | field label | `PortalBrandingPanel.tsx:150` | Support Email |  |
| `brand.servicedesk-acme-com` | placeholder | `PortalBrandingPanel.tsx:151` | servicedesk@acme.com |  |
| `brand.support-contact-no` | field label | `PortalBrandingPanel.tsx:153` | Support Contact No. |  |
| `brand.91-79-4040-0000` | placeholder | `PortalBrandingPanel.tsx:154` | +91 79 4040 0000 |  |
| `brand.linkback-url` **Δ** | field label | `PortalBrandingPanel.tsx:158` | Linkback URL |  |
| `brand.favicon` **Δ** | field label | `PortalBrandingPanel.tsx:165` | Favicon |  |
| `brand.upload-favicon` **Δ** | field label | `PortalBrandingPanel.tsx:167` | Upload favicon |  |
| `brand.favicon-updated` **Δ** | string | `PortalBrandingPanel.tsx:169` | Favicon updated |  |
| `brand.branding-saved` | string | `PortalBrandingPanel.tsx:183` | Branding saved |  |
| `brand.url-3` | on-screen text | `PortalBrandingPanel.tsx:106` | URL |  |
| `brand.help-is-on-but-has-nowhere-to-go-r` | on-screen text | `PortalBrandingPanel.tsx:114` | Help is on but has nowhere to go — requesters will see the icon and nothing will happen. |  |
| `brand.attachment-2` | on-screen text | `PortalBrandingPanel.tsx:121` | Attachment |  |
| `brand.cancel` | on-screen text | `PortalBrandingPanel.tsx:181` | Cancel |  |
| `brand.save` | on-screen text | `PortalBrandingPanel.tsx:185` | Save |  |

## 11. Widget drawer — shell

*`PortalWidgetDrawer.tsx`* — 52 entries

### 11.1 `AlignGlyph`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `drawer.0-0-16-16` | viewBox | `PortalWidgetDrawer.tsx:117` | 0 0 16 16 |  |

### 11.2 `TableContentField`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `drawer.empty` | string | `PortalWidgetDrawer.tsx:214` | Empty |  |
| `drawer.manage-table-content` | on-screen text | `PortalWidgetDrawer.tsx:213` | Manage table content |  |

### 11.3 `NINE`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `drawer.top-left` | string | `PortalWidgetDrawer.tsx:222` | top left |  |
| `drawer.top-right` | string | `PortalWidgetDrawer.tsx:222` | top right |  |
| `drawer.bottom-left` | string | `PortalWidgetDrawer.tsx:222` | bottom left |  |
| `drawer.bottom-right` | string | `PortalWidgetDrawer.tsx:222` | bottom right |  |

### 11.4 `THEME_PRESETS`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `drawer.serviceops` | name | `PortalWidgetDrawer.tsx:252` | ServiceOps |  |
| `drawer.forest` | name | `PortalWidgetDrawer.tsx:253` | Forest |  |
| `drawer.ember` | name | `PortalWidgetDrawer.tsx:254` | Ember |  |
| `drawer.violet` | name | `PortalWidgetDrawer.tsx:255` | Violet |  |

### 11.5 `ColumnsEditor`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `drawer.a-table-needs-at-least-one-column` | string | `PortalWidgetDrawer.tsx:306` | A table needs at least one column |  |
| `drawer.move-left` | title / tooltip | `PortalWidgetDrawer.tsx:325` | Move left |  |
| `drawer.move-right` | title / tooltip | `PortalWidgetDrawer.tsx:326` | Move right |  |
| `drawer.duplicate-column` | title / tooltip | `PortalWidgetDrawer.tsx:327` | Duplicate column |  |
| `drawer.delete-column` | title / tooltip | `PortalWidgetDrawer.tsx:328` | Delete column |  |
| `drawer.make-equal` | on-screen text | `PortalWidgetDrawer.tsx:344` | Make equal |  |

### 11.6 `ACCORDION_TITLE`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `drawer.layout` | layout | `PortalWidgetDrawer.tsx:355` | Layout |  |
| `drawer.style` | style | `PortalWidgetDrawer.tsx:355` | Style |  |
| `drawer.spacing` | spacing | `PortalWidgetDrawer.tsx:355` | Spacing |  |
| `drawer.size` | size | `PortalWidgetDrawer.tsx:355` | Size |  |
| `drawer.alignment` | alignment | `PortalWidgetDrawer.tsx:355` | Alignment |  |

### 11.7 `OverrideDot`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `drawer.something-in-here-is-set-away-from` | title / tooltip | `PortalWidgetDrawer.tsx:361` | Something in here is set away from the default |  |

### 11.8 `ExpandAll`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `drawer.collapse-all` | string | `PortalWidgetDrawer.tsx:517` | Collapse all |  |
| `drawer.expand-all` | string | `PortalWidgetDrawer.tsx:517` | Expand all |  |

### 11.9 `DROP_GROUPS`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `drawer.layout-2` | string | `PortalWidgetDrawer.tsx:530` | Layout |  |
| `drawer.size-2` | string | `PortalWidgetDrawer.tsx:530` | Size |  |
| `drawer.arrangement` | string | `PortalWidgetDrawer.tsx:530` | Arrangement |  |

### 11.10 `EMPTY_STATE_GROUP`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `drawer.empty-state` | string | `PortalWidgetDrawer.tsx:534` | Empty state |  |

### 11.11 `firstDesignKey`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `drawer.content` | string | `PortalWidgetDrawer.tsx:548` | Content |  |
| `drawer.action` | string | `PortalWidgetDrawer.tsx:549` | Action |  |

### 11.12 `PortalWidgetDrawer`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `drawer.write-something` | placeholder | `PortalWidgetDrawer.tsx:772` | Write something… |  |
| `drawer.select-the-card-to-edit-its-link` | string | `PortalWidgetDrawer.tsx:873` | Select the card to edit its link. |  |
| `drawer.opens-a-link-of-your-choosing` | string | `PortalWidgetDrawer.tsx:873` | Opens a link of your choosing. |  |
| `drawer.this-row-already-has-its-external-` | string | `PortalWidgetDrawer.tsx:879` | This row already has its external-link card |  |
| `drawer.heading-colour-adjusted-for-readab` | string | `PortalWidgetDrawer.tsx:1098` | Heading colour adjusted for readability |  |
| `drawer.reset-this-element-to-default` | title / tooltip | `PortalWidgetDrawer.tsx:1381` | Reset this element to default |  |
| `drawer.open-that-setting` | field label | `PortalWidgetDrawer.tsx:1397` | Open that setting |  |
| `drawer.cells` | title / tooltip | `PortalWidgetDrawer.tsx:1459` | Cells |  |
| `drawer.cells-2` | string | `PortalWidgetDrawer.tsx:1459` | Cells |  |
| `drawer.spacing-2` | title / tooltip | `PortalWidgetDrawer.tsx:1557` | Spacing |  |
| `drawer.external-link-card` | on-screen text | `PortalWidgetDrawer.tsx:871` | External link card |  |
| `drawer.locked` | on-screen text | `PortalWidgetDrawer.tsx:1366` | Locked |  |
| `drawer.this-widget-is-hidden-from-request` | on-screen text | `PortalWidgetDrawer.tsx:1402` | This widget is hidden from requesters. It stays on the page so you can put it back — nothing was removed. |  |

### 11.13 `BulkAdd`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `drawer.or-add-several-files-at-once` | on-screen text | `PortalWidgetDrawer.tsx:76` | or add several files at once |  |
| `drawer.new-promise` | on-screen text | `PortalWidgetDrawer.tsx:86` | new Promise |  |

### 11.14 `PanelBody`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `drawer.content-2` | on-screen text | `PortalWidgetDrawer.tsx:415` | Content |  |
| `drawer.action-2` | on-screen text | `PortalWidgetDrawer.tsx:438` | Action |  |
| `drawer.design` | on-screen text | `PortalWidgetDrawer.tsx:445` | Design |  |

### 11.15 `(top level)`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `drawer.no-tolowercase-selected` | message with a value in it | `PortalWidgetDrawer.tsx:800` | No {toLowerCase} selected |  |
| `drawer.added-length-this-gallery-holds-ma` | message with a value in it | `PortalWidgetDrawer.tsx:1313` | Added {length} — this gallery holds {max} |  |
| `drawer.the-name-always-shows-a-bar-withou` | message with a value in it | `PortalWidgetDrawer.tsx:1384` | The {name} always shows — a bar without it is not the product’s bar |  |

## 12. Widget settings — one row per widget

*`portalWidgetSpec.ts`* — 196 entries

### 12.1 `(top level)`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `w.data` | group | `portalWidgetSpec.ts:223` | Data |  |
| `w.actions` | string | `portalWidgetSpec.ts:223` | Actions |  |
| `w.content` | string | `portalWidgetSpec.ts:223` | Content |  |
| `w.structure` | string | `portalWidgetSpec.ts:223` | Structure |  |
| `w.chrome` | string | `portalWidgetSpec.ts:223` | Chrome |  |
| `w.components` | string | `portalWidgetSpec.ts:224` | Components |  |
| `w.layout` | string | `portalWidgetSpec.ts:224` | Layout |  |
| `w.basic` | string | `portalWidgetSpec.ts:224` | Basic |  |
| `w.visual` | string | `portalWidgetSpec.ts:224` | Visual |  |
| `w.business` | string | `portalWidgetSpec.ts:224` | Business |  |
| `w.custom` | string | `portalWidgetSpec.ts:224` | Custom |  |
| `w.requesters-can-only-see-this-while` | message with a value in it | `portalWidgetSpec.ts:1055` | Requesters can only see this while “{s}” is on. It is off right now, so this widget is hidden from them. |  |
| `w.this-needs-the-s-which-is-part-of-` | message with a value in it | `portalWidgetSpec.ts:1056` | This needs the {s}, which is part of your licence rather than a switch — there is nothing to turn on here. |  |
| `w.s-is-not-included-in-your-plan-you` | message with a value in it | `portalWidgetSpec.ts:1057` | “{s}” is not included in your plan. Your account team can add it. |  |

### 12.2 `listCardStyleFields`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `w.show-count-badge` **Δ** | field label | `portalWidgetSpec.ts:254` | Show count badge |  |
| `w.header` | group | `portalWidgetSpec.ts:254` | Header |  |
| `w.show-view-all-link` **Δ** | field label | `portalWidgetSpec.ts:257` | Show “View all” link |  |
| `w.link-label` | field label | `portalWidgetSpec.ts:259` | Link label |  |
| `w.row-layout` **Δ** | field label | `portalWidgetSpec.ts:264` | Row layout |  |
| `w.layout-2` | group | `portalWidgetSpec.ts:264` | Layout |  |
| `w.single` | default value | `portalWidgetSpec.ts:265` | single |  |
| `w.single-line` **Δ** | field label | `portalWidgetSpec.ts:265` | Single line |  |
| `w.stacked` | default value | `portalWidgetSpec.ts:265` | stacked |  |
| `w.stacked-2` | field label | `portalWidgetSpec.ts:265` | Stacked |  |

### 12.3 `LIVE_CARD_PACKS`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `w.live-card-packs.view-all` | viewAllLabel | `portalWidgetSpec.ts:280` | View all |  |

### 12.4 My Open Requests — `my_requests`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `w.my-requests.my-open-requests` | name | `portalWidgetSpec.ts:289` | My Open Requests |  |
| `w.my-requests.request-module` | setting | `portalWidgetSpec.ts:292` | Request module |  |
| `w.my-requests.my-open-requests-2` | title / tooltip | `portalWidgetSpec.ts:297` | My Open Requests |  |
| `w.my-requests.open` | string | `portalWidgetSpec.ts:297` | Open |  |
| `w.my-requests.in-progress` | string | `portalWidgetSpec.ts:297` | In Progress |  |
| `w.my-requests.pending` | string | `portalWidgetSpec.ts:297` | Pending |  |

### 12.5 Pending Approvals — `pending_approvals`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `w.pending-approvals.pending-approvals` | name | `portalWidgetSpec.ts:302` | Pending Approvals |  |
| `w.pending-approvals.allow-requester-to-access-my-appro` | setting | `portalWidgetSpec.ts:303` | Allow Requester To Access My Approvals |  |
| `w.pending-approvals.organization` | section | `portalWidgetSpec.ts:303` | Organization |  |
| `w.pending-approvals.pending-approvals-2` | title / tooltip | `portalWidgetSpec.ts:306` | Pending Approvals |  |

### 12.6 My Assets — `my_assets`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `w.my-assets.my-assets` | name | `portalWidgetSpec.ts:311` | My Assets |  |
| `w.my-assets.allow-requester-to-access-my-asset` | setting | `portalWidgetSpec.ts:312` | Allow Requester to Access My Assets |  |
| `w.my-assets.my-assets-2` | title / tooltip | `portalWidgetSpec.ts:315` | My Assets |  |

### 12.7 My CIs — `my_cis`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `w.my-cis.my-cis` | name | `portalWidgetSpec.ts:320` | My CIs |  |
| `w.my-cis.allow-requester-to-access-my-ci` | setting | `portalWidgetSpec.ts:321` | Allow Requester to Access My CI |  |
| `w.my-cis.my-cis-2` | title / tooltip | `portalWidgetSpec.ts:324` | My CIs |  |

### 12.8 Announcements — `announcements`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `w.announcements.announcements` | name | `portalWidgetSpec.ts:329` | Announcements |  |
| `w.announcements.announcements-2` | title / tooltip | `portalWidgetSpec.ts:333` | Announcements |  |

### 12.9 Most Read — `most_read`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `w.most-read.most-read` | name | `portalWidgetSpec.ts:338` | Most Read |  |
| `w.most-read.allow-requester-to-access-knowledg` | setting | `portalWidgetSpec.ts:339` | Allow Requester To Access Knowledge |  |
| `w.most-read.most-read-2` | title / tooltip | `portalWidgetSpec.ts:342` | Most Read |  |

### 12.10 Contact Us — `contact_us`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `w.contact-us.contact-us` | name | `portalWidgetSpec.ts:347` | Contact Us |  |
| `w.contact-us.these-override-what-this-portal-pu` | text | `portalWidgetSpec.ts:380` | These override what this portal publishes. The organisation record is where they are seeded from and what every other portal reads. |  |
| `w.contact-us.edit-contact-details` | field label | `portalWidgetSpec.ts:381` | Edit contact details |  |
| `w.contact-us.company-details` | card | `portalWidgetSpec.ts:381` | Company Details |  |
| `w.contact-us.contact-us-2` | title / tooltip | `portalWidgetSpec.ts:391` | Contact Us |  |
| `w.contact-us.servicedesk-acme-com` | string | `portalWidgetSpec.ts:394` | servicedesk@acme.com |  |
| `w.contact-us.91-79-4040-0000` | string | `portalWidgetSpec.ts:395` | +91 79 4040 0000 |  |

### 12.11 Favourite Services — `favourite_services`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `w.favourite-services.favourite-services` | name | `portalWidgetSpec.ts:404` | Favourite Services |  |
| `w.favourite-services.access-service-catalog` | setting | `portalWidgetSpec.ts:405` | Access Service Catalog |  |
| `w.favourite-services.show-description` | field label | `portalWidgetSpec.ts:407` | Show description |  |
| `w.favourite-services.content` | group | `portalWidgetSpec.ts:407` | Content |  |
| `w.favourite-services.card-templates` | group | `portalWidgetSpec.ts:413` | Card templates |  |
| `w.favourite-services.this-section-only-appears-once-a-r` | text | `portalWidgetSpec.ts:421` | This section only appears once a requester has added favourites. Anyone with none sees nothing here — the tiles below are examples. |  |
| `w.favourite-services.the-services-this-requester-has-pi` | text | `portalWidgetSpec.ts:422` | The services this requester has pinned. Shows up to four — a shortcut that runs longer than that is a catalogue. |  |
| `w.favourite-services.favourite-services-2` | title / tooltip | `portalWidgetSpec.ts:424` | Favourite Services |  |

### 12.12 Most Used Services — `featured_services`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `w.featured-services.most-used-services` | name | `portalWidgetSpec.ts:429` | Most Used Services |  |
| `w.featured-services.a-requester-s-favourites-not-a-bro` | text | `portalWidgetSpec.ts:455` | A requester’s favourites, not a browse-all grid — the catalogue itself is a page, not a widget. |  |
| `w.featured-services.most-used-services-2` | title / tooltip | `portalWidgetSpec.ts:460` | Most Used Services |  |
| `w.featured-services.browse-catalog` | browseLabel | `portalWidgetSpec.ts:460` | Browse catalog |  |
| `w.featured-services.ad-self-service` | string | `portalWidgetSpec.ts:468` | AD Self Service |  |
| `w.featured-services.reset-your-domain-password` | string | `portalWidgetSpec.ts:468` | Reset your domain password |  |
| `w.featured-services.allow-ad-self-service` | string | `portalWidgetSpec.ts:468` | Allow AD Self Service |  |
| `w.featured-services.new-incident` | string | `portalWidgetSpec.ts:469` | New Incident |  |
| `w.featured-services.report-an-issue-you-are-facing` | string | `portalWidgetSpec.ts:469` | Report an issue you are facing |  |
| `w.featured-services.allow-requester-to-create-incident` | string | `portalWidgetSpec.ts:469` | Allow Requester to create Incident |  |
| `w.featured-services.request-service` | string | `portalWidgetSpec.ts:470` | Request Service |  |
| `w.featured-services.browse-the-service-catalog` | string | `portalWidgetSpec.ts:470` | Browse the service catalog |  |
| `w.featured-services.access-service-catalog` | string | `portalWidgetSpec.ts:470` | Access Service Catalog |  |
| `w.featured-services.knowledge` | string | `portalWidgetSpec.ts:471` | Knowledge |  |
| `w.featured-services.search-help-articles` | string | `portalWidgetSpec.ts:471` | Search help articles |  |
| `w.featured-services.access-knowledge` | string | `portalWidgetSpec.ts:471` | Access Knowledge |  |
| `w.featured-services.action-card` | string | `portalWidgetSpec.ts:476` | Action Card |  |
| `w.featured-services.describe-what-this-card-does` | string | `portalWidgetSpec.ts:476` | Describe what this card does |  |
| `w.featured-services.external-link` | string | `portalWidgetSpec.ts:482` | External link |  |
| `w.featured-services.where-this-link-goes` | string | `portalWidgetSpec.ts:482` | Where this link goes |  |
| `w.featured-services.actions` | group | `portalWidgetSpec.ts:484` | Actions |  |
| `w.featured-services.title` | field label | `portalWidgetSpec.ts:487` | Title |  |
| `w.featured-services.subtitle` | field label | `portalWidgetSpec.ts:488` | Subtitle |  |
| `w.featured-services.icon` | field label | `portalWidgetSpec.ts:489` | Icon |  |
| `w.featured-services.icon-position` | field label | `portalWidgetSpec.ts:491` | Icon position |  |
| `w.featured-services.content-alignment` | field label | `portalWidgetSpec.ts:495` | Content alignment |  |
| `w.featured-services.card-templates` | field label | `portalWidgetSpec.ts:516` | Card templates |  |
| `w.featured-services.url` | field label | `portalWidgetSpec.ts:529` | URL |  |
| `w.featured-services.where-a-requester-lands-when-they-` | help | `portalWidgetSpec.ts:529` | Where a requester lands when they click this card. |  |
| `w.featured-services.open-in-a-new-tab` | field label | `portalWidgetSpec.ts:530` | Open in a new tab |  |
| `w.featured-services.on-click-go-to` | field label | `portalWidgetSpec.ts:536` | On click, go to |  |
| `w.featured-services.incident` | default value | `portalWidgetSpec.ts:538` | incident |  |
| `w.featured-services.report-an-incident` | field label | `portalWidgetSpec.ts:538` | Report an incident |  |
| `w.featured-services.service` | default value | `portalWidgetSpec.ts:539` | service |  |
| `w.featured-services.request-a-service` | field label | `portalWidgetSpec.ts:539` | Request a service |  |
| `w.featured-services.ad-self-service-2` | field label | `portalWidgetSpec.ts:540` | AD self service |  |
| `w.featured-services.knowledge-2` | default value | `portalWidgetSpec.ts:541` | knowledge |  |
| `w.featured-services.knowledge-3` | field label | `portalWidgetSpec.ts:541` | Knowledge |  |
| `w.featured-services.url-2` | default value | `portalWidgetSpec.ts:542` | url |  |
| `w.featured-services.external-link-2` | field label | `portalWidgetSpec.ts:542` | External link |  |
| `w.featured-services.most-used-services-3` | field label | `portalWidgetSpec.ts:556` | Most used services |  |
| `w.featured-services.when-a-requester-clicks-this-card-` | help | `portalWidgetSpec.ts:558` | When a requester clicks this card, the services people request most are shown first. |  |

### 12.13 `style`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `w.style.fill` | field label | `portalWidgetSpec.ts:573` | Fill |  |
| `w.style.color` | default value | `portalWidgetSpec.ts:574` | color |  |
| `w.style.colour` | field label | `portalWidgetSpec.ts:574` | Colour |  |
| `w.style.background-colour` | field label | `portalWidgetSpec.ts:575` | Background colour |  |
| `w.style.border` | field label | `portalWidgetSpec.ts:576` | Border |  |
| `w.style.corner-radius` | field label | `portalWidgetSpec.ts:577` | Corner radius |  |

### 12.14 `size`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `w.size.height` | field label | `portalWidgetSpec.ts:586` | Height |  |

### 12.15 Button / Link — `button`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `w.button.button-link` | name | `portalWidgetSpec.ts:612` | Button / Link |  |
| `w.button.label` | field label | `portalWidgetSpec.ts:615` | Label |  |
| `w.button.when-the-style-is-icon-this-become` | help | `portalWidgetSpec.ts:616` | When the style is Icon this becomes the tooltip and the screen-reader name. |  |
| `w.button.style` | field label | `portalWidgetSpec.ts:619` | Style |  |
| `w.button.icon` | default value | `portalWidgetSpec.ts:620` | icon |  |
| `w.button.opens` | field label | `portalWidgetSpec.ts:624` | Opens |  |
| `w.button.action` | group | `portalWidgetSpec.ts:624` | Action |  |
| `w.button.download` | default value | `portalWidgetSpec.ts:640` | download |  |
| `w.button.download-a-file` | field label | `portalWidgetSpec.ts:640` | Download a file |  |
| `w.button.shown-as` | field label | `portalWidgetSpec.ts:653` | Shown as |  |
| `w.button.leave-blank-to-use-the-uploaded-fi` | help | `portalWidgetSpec.ts:654` | Leave blank to use the uploaded file’s own name. |  |
| `w.button.send-to` | field label | `portalWidgetSpec.ts:656` | Send to |  |
| `w.button.full-width` | field label | `portalWidgetSpec.ts:670` | Full width |  |
| `w.button.fill-colour` | field label | `portalWidgetSpec.ts:672` | Fill colour |  |
| `w.button.border-colour` | field label | `portalWidgetSpec.ts:673` | Border colour |  |
| `w.button.alignment` | field label | `portalWidgetSpec.ts:676` | Alignment |  |
| `w.button.alignment-2` | group | `portalWidgetSpec.ts:676` | Alignment |  |
| `w.button.new-incident-form-and-service-cata` | text | `portalWidgetSpec.ts:685` | “New incident form” and “Service catalog” are deliberately not in this list — those are the New Incident and Request Service action cards, and two ways to make the same link is one way too many. |  |
| `w.button.contact-the-service-desk` | field label | `portalWidgetSpec.ts:692` | Contact the service desk |  |
| `w.button.my-requests` | page | `portalWidgetSpec.ts:693` | My Requests |  |
| `w.button.inherit-from-theme` | font | `portalWidgetSpec.ts:698` | Inherit from theme |  |

### 12.16 Count tile — `count_tile`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `w.count-tile.count-tile` | name | `portalWidgetSpec.ts:704` | Count tile |  |
| `w.count-tile.counts` | field label | `portalWidgetSpec.ts:708` | Counts |  |
| `w.count-tile.my-requests` | string | `portalWidgetSpec.ts:709` | My requests |  |
| `w.count-tile.my-changes` | string | `portalWidgetSpec.ts:709` | My changes |  |
| `w.count-tile.approvals-waiting-on-me` | string | `portalWidgetSpec.ts:709` | Approvals waiting on me |  |
| `w.count-tile.my-assets` | string | `portalWidgetSpec.ts:709` | My assets |  |
| `w.count-tile.my-cis` | string | `portalWidgetSpec.ts:709` | My CIs |  |
| `w.count-tile.statuses-to-count` | field label | `portalWidgetSpec.ts:714` | Statuses to count |  |
| `w.count-tile.leaving-every-chip-clear-counts-al` | help | `portalWidgetSpec.ts:716` | Leaving every chip clear counts all of them. |  |
| `w.count-tile.layout` | field label | `portalWidgetSpec.ts:720` | Layout |  |
| `w.count-tile.tile` | group | `portalWidgetSpec.ts:720` | Tile |  |
| `w.count-tile.icon-left` | field label | `portalWidgetSpec.ts:721` | Icon left |  |
| `w.count-tile.icon-top` | field label | `portalWidgetSpec.ts:721` | Icon top |  |
| `w.count-tile.no-icon` | field label | `portalWidgetSpec.ts:721` | No icon |  |
| `w.count-tile.number-size` | field label | `portalWidgetSpec.ts:723` | Number size |  |
| `w.count-tile.number-colour` | field label | `portalWidgetSpec.ts:724` | Number colour |  |
| `w.count-tile.label-colour` | field label | `portalWidgetSpec.ts:725` | Label colour |  |
| `w.count-tile.this-source-returns-a-single-total` | text | `portalWidgetSpec.ts:737` | This source returns a single total — there is no status filter to apply to it, so the status chips are not shown. |  |
| `w.count-tile.open-requests` | field label | `portalWidgetSpec.ts:740` | Open requests |  |
| `w.count-tile.my-requests-2` | source | `portalWidgetSpec.ts:740` | My requests |  |

### 12.17 `text`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `w.text.font` | field label | `portalWidgetSpec.ts:757` | Font |  |
| `w.text.text-style` | group | `portalWidgetSpec.ts:757` | Text style |  |
| `w.text.inherit-from-theme` | string | `portalWidgetSpec.ts:758` | Inherit from theme |  |
| `w.text.inter` | string | `portalWidgetSpec.ts:758` | Inter |  |
| `w.text.poppins` | string | `portalWidgetSpec.ts:758` | Poppins |  |
| `w.text.roboto` | string | `portalWidgetSpec.ts:758` | Roboto |  |
| `w.text.source-sans-3` | string | `portalWidgetSpec.ts:758` | Source Sans 3 |  |
| `w.text.merriweather` | string | `portalWidgetSpec.ts:758` | Merriweather |  |
| `w.text.ibm-plex-mono` | string | `portalWidgetSpec.ts:758` | IBM Plex Mono |  |
| `w.text.font-weight` | field label | `portalWidgetSpec.ts:759` | Font weight |  |
| `w.text.semibold` | string | `portalWidgetSpec.ts:760` | Semibold |  |
| `w.text.font-size` | field label | `portalWidgetSpec.ts:761` | Font size |  |
| `w.text.font-colour` | field label | `portalWidgetSpec.ts:762` | Font colour |  |
| `w.text.line-height` | field label | `portalWidgetSpec.ts:763` | Line height |  |
| `w.text.letter-spacing` | field label | `portalWidgetSpec.ts:764` | Letter spacing |  |
| `w.text.column-count` | field label | `portalWidgetSpec.ts:766` | Column count |  |
| `w.text.justify` | default value | `portalWidgetSpec.ts:771` | justify |  |
| `w.text.justify-2` | field label | `portalWidgetSpec.ts:771` | Justify |  |
| `w.text.double-click-to-edit-this-text` | html | `portalWidgetSpec.ts:776` | Double-click to edit this text. |  |

### 12.18 Custom data widget — `record_list`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `w.record-list.custom-data-widget` **Δ** | name | `portalWidgetSpec.ts:792` | Custom data widget |  |
| `w.record-list.show-as` **Δ** | field label | `portalWidgetSpec.ts:802` | Show as |  |
| `w.record-list.list` | default value | `portalWidgetSpec.ts:803` | list |  |
| `w.record-list.record-list` **Δ** | field label | `portalWidgetSpec.ts:803` | Record list |  |
| `w.record-list.kpi` | default value | `portalWidgetSpec.ts:803` | kpi |  |
| `w.record-list.kpi-2` | field label | `portalWidgetSpec.ts:803` | KPI |  |
| `w.record-list.module` | field label | `portalWidgetSpec.ts:813` | Module |  |
| `w.record-list.filter-cleared-it-belonged-to-the-` | say | `portalWidgetSpec.ts:820` | Filter cleared — it belonged to the module you just left |  |
| `w.record-list.filter` | field label | `portalWidgetSpec.ts:830` | Filter |  |
| `w.record-list.shows-sample-rows-here-so-you-can-` | text | `portalWidgetSpec.ts:837` | Shows sample rows here so you can see the shape, so a condition on a field the samples do not carry — a priority, an assignee, a date — is not applied in the builder. On the live portal it queries the module you chose and applies the whole filter, showing the same “No Data Found” state as My CIs when nothing matches. |  |
| `w.record-list.my-records` | title / tooltip | `portalWidgetSpec.ts:839` | My records |  |

### 12.19 Video — `video`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `w.video.video` | name | `portalWidgetSpec.ts:849` | Video |  |
| `w.video.video-2` | field label | `portalWidgetSpec.ts:851` | Video |  |

### 12.20 Image — `image`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `w.image.image` | name | `portalWidgetSpec.ts:860` | Image |  |
| `w.image.image-2` | field label | `portalWidgetSpec.ts:865` | Image |  |
| `w.image.alt-text` | field label | `portalWidgetSpec.ts:870` | Alt text |  |
| `w.image.shown-if-the-image-does-not-load-a` | help | `portalWidgetSpec.ts:871` | Shown if the image does not load, and read aloud by screen readers. |  |
| `w.image.no-alt-text-yet-screen-reader-user` | warnWhenBlank | `portalWidgetSpec.ts:872` | No alt text yet — screen-reader users will hear nothing where this image is. |  |
| `w.image.caption` | field label | `portalWidgetSpec.ts:879` | Caption |  |
| `w.image.leave-blank-to-make-the-image-deco` | help | `portalWidgetSpec.ts:890` | Leave blank to make the image decorative. |  |
| `w.image.style` | group | `portalWidgetSpec.ts:894` | Style |  |
| `w.image.request-module` | string | `portalWidgetSpec.ts:1042` | Request module |  |
| `w.image.allow-requester-to-access-my-appro` | string | `portalWidgetSpec.ts:1043` | Allow Requester To Access My Approvals |  |
| `w.image.allow-requester-to-access-my-asset` | string | `portalWidgetSpec.ts:1044` | Allow Requester to Access My Assets |  |
| `w.image.allow-requester-to-access-my-ci` | string | `portalWidgetSpec.ts:1045` | Allow Requester to Access My CI |  |
| `w.image.allow-requester-to-access-knowledg` | string | `portalWidgetSpec.ts:1046` | Allow Requester To Access Knowledge |  |

## 13. Widget settings — collections

*`portalCollectionSpecs.ts`* — 300 entries

### 13.1 `FONTS`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `coll.inherit-from-theme` | string | `portalCollectionSpecs.ts:17` | Inherit from theme |  |
| `coll.inter` | string | `portalCollectionSpecs.ts:17` | Inter |  |
| `coll.poppins` | string | `portalCollectionSpecs.ts:17` | Poppins |  |
| `coll.roboto` | string | `portalCollectionSpecs.ts:17` | Roboto |  |
| `coll.source-sans-3` | string | `portalCollectionSpecs.ts:17` | Source Sans 3 |  |
| `coll.merriweather` | string | `portalCollectionSpecs.ts:17` | Merriweather |  |

### 13.2 `WEIGHTS`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `coll.semibold` | string | `portalCollectionSpecs.ts:18` | Semibold |  |

### 13.3 `ALIGN_4`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `coll.justify` | default value | `portalCollectionSpecs.ts:22` | justify |  |
| `coll.justify-2` | field label | `portalCollectionSpecs.ts:22` | Justify |  |

### 13.4 `FAQ_SEEDS`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `coll.how-do-i-reset-my-password` | q | `portalCollectionSpecs.ts:32` | How do I reset my password? |  |
| `coll.use-ad-self-service-on-the-portal-` | a | `portalCollectionSpecs.ts:33` | Use AD Self Service on the portal home. If your account is locked, raise an incident and the service desk will unlock it. |  |
| `coll.how-long-until-someone-picks-up-my` | q | `portalCollectionSpecs.ts:36` | How long until someone picks up my ticket? |  |
| `coll.a-p3-request-is-picked-up-within-o` | a | `portalCollectionSpecs.ts:37` | A P3 request is picked up within one working day. P1 and P2 are picked up inside the hour, around the clock. |  |
| `coll.how-do-i-request-new-software` | q | `portalCollectionSpecs.ts:40` | How do I request new software? |  |
| `coll.request-it-from-the-service-catalo` | a | `portalCollectionSpecs.ts:41` | Request it from the service catalog. Anything with a licence cost goes to your line manager for approval first. |  |

### 13.5 `FAQ_NEW`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `coll.who-do-i-contact-out-of-hours` | q | `portalCollectionSpecs.ts:46` | Who do I contact out of hours? |  |
| `coll.the-on-call-service-desk-number-is` | a | `portalCollectionSpecs.ts:46` | The on-call service desk number is on the Contact Us card. |  |
| `coll.can-i-track-a-request-i-raised-for` | q | `portalCollectionSpecs.ts:47` | Can I track a request I raised for someone else? |  |
| `coll.yes-switch-my-open-requests-to-rai` | a | `portalCollectionSpecs.ts:47` | Yes — switch My Open Requests to “Raised for me”. |  |
| `coll.how-do-i-get-access-to-a-shared-ma` | q | `portalCollectionSpecs.ts:48` | How do I get access to a shared mailbox? |  |
| `coll.raise-a-service-request-the-mailbo` | a | `portalCollectionSpecs.ts:48` | Raise a service request; the mailbox owner approves it. |  |

### 13.6 FAQ — `faq`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `coll.faq.faq` | name | `portalCollectionSpecs.ts:52` | FAQ |  |
| `coll.faq.content` | group | `portalCollectionSpecs.ts:52` | Content |  |
| `coll.faq.title` | field label | `portalCollectionSpecs.ts:62` | Title |  |
| `coll.faq.these-questions-are-written-here-n` | text | `portalCollectionSpecs.ts:69` | These questions are written here, not fetched from anywhere — the platform has no FAQ records. Anything that needs review, an owner or version history belongs in a knowledge article instead. |  |
| `coll.faq.questions` | group | `portalCollectionSpecs.ts:72` | Questions |  |
| `coll.faq.add-question` | addLabel | `portalCollectionSpecs.ts:72` | Add question |  |
| `coll.faq.no-questions-yet-a-faq-with-nothin` | emptyHint | `portalCollectionSpecs.ts:73` | No questions yet. A FAQ with nothing in it is invisible on the portal. |  |
| `coll.faq.question` | field label | `portalCollectionSpecs.ts:80` | Question |  |
| `coll.faq.how-do-i-reset-my-password` | placeholder | `portalCollectionSpecs.ts:80` | How do I reset my password? |  |
| `coll.faq.answer` | field label | `portalCollectionSpecs.ts:81` | Answer |  |
| `coll.faq.answer-it-in-a-sentence-or-two` | placeholder | `portalCollectionSpecs.ts:81` | Answer it in a sentence or two. |  |
| `coll.faq.links-and-lists-matter-here` | help | `portalCollectionSpecs.ts:81` | Links and lists matter here. |  |
| `coll.faq.question-2` | name | `portalCollectionSpecs.ts:88` | Question |  |
| `coll.faq.answer-2` | name | `portalCollectionSpecs.ts:89` | Answer |  |
| `coll.faq.frequently-asked-questions` | title / tooltip | `portalCollectionSpecs.ts:97` | Frequently asked questions |  |

### 13.7 Card — `card`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `coll.card.card` | name | `portalCollectionSpecs.ts:108` | Card |  |
| `coll.card.card-templates` | field label | `portalCollectionSpecs.ts:114` | Card templates |  |
| `coll.card.card-properties` | group | `portalCollectionSpecs.ts:114` | Card properties |  |
| `coll.card.where-the-image-sits-is-the-real-q` | help | `portalCollectionSpecs.ts:115` | Where the image sits is the real question, so pick it by looking rather than by reading. |  |
| `coll.card.banner-needs-the-icon-top-layout-t` | say | `portalCollectionSpecs.ts:120` | Banner needs the Icon top layout — the shape went back to Circle |  |
| `coll.card.image` | field label | `portalCollectionSpecs.ts:123` | Image |  |
| `coll.card.shape` | field label | `portalCollectionSpecs.ts:125` | Shape |  |
| `coll.card.card-2` | group | `portalCollectionSpecs.ts:125` | Card |  |
| `coll.card.circle` | default value | `portalCollectionSpecs.ts:129` | circle |  |
| `coll.card.circle-2` | field label | `portalCollectionSpecs.ts:129` | Circle |  |
| `coll.card.square` | default value | `portalCollectionSpecs.ts:129` | square |  |
| `coll.card.square-2` | field label | `portalCollectionSpecs.ts:129` | Square |  |
| `coll.card.wide` | default value | `portalCollectionSpecs.ts:129` | wide |  |
| `coll.card.banner` | field label | `portalCollectionSpecs.ts:129` | Banner |  |
| `coll.card.card-title` | field label | `portalCollectionSpecs.ts:132` | Card title |  |
| `coll.card.description` | field label | `portalCollectionSpecs.ts:133` | Description |  |
| `coll.card.leave-blank-to-make-it-read-only` | help | `portalCollectionSpecs.ts:134` | Leave blank to make it read-only. |  |
| `coll.card.open-in-a-new-tab` | field label | `portalCollectionSpecs.ts:135` | Open in a new tab |  |
| `coll.card.alignment` | field label | `portalCollectionSpecs.ts:138` | Alignment |  |
| `coll.card.extra-content` | group | `portalCollectionSpecs.ts:146` | Extra content |  |
| `coll.card.add-a-block` | addLabel | `portalCollectionSpecs.ts:146` | Add a block |  |
| `coll.card.a-card-is-a-container-add-a-text-i` | emptyHint | `portalCollectionSpecs.ts:147` | A card is a container. Add a Text, Image or Button block to put something else inside it. |  |
| `coll.card.block` | string | `portalCollectionSpecs.ts:155` | Block |  |
| `coll.card.a-line-of-supporting-copy` | html | `portalCollectionSpecs.ts:157` | A line of supporting copy. |  |
| `coll.card.custom-card` | title / tooltip | `portalCollectionSpecs.ts:161` | Custom card |  |
| `coll.card.add-card-description` | body | `portalCollectionSpecs.ts:161` | Add card description |  |
| `coll.card.tier` | string | `portalCollectionSpecs.ts:171` | Tier |  |
| `coll.card.contact` | string | `portalCollectionSpecs.ts:171` | Contact |  |
| `coll.card.response` | string | `portalCollectionSpecs.ts:171` | Response |  |
| `coll.card.l1-service-desk` | string | `portalCollectionSpecs.ts:172` | L1 · Service Desk |  |
| `coll.card.servicedesk-acme-com` | string | `portalCollectionSpecs.ts:172` | servicedesk@acme.com |  |
| `coll.card.30-min` | string | `portalCollectionSpecs.ts:172` | 30 min |  |
| `coll.card.l2-infrastructure` | string | `portalCollectionSpecs.ts:173` | L2 · Infrastructure |  |
| `coll.card.infra-acme-com` | string | `portalCollectionSpecs.ts:173` | infra@acme.com |  |
| `coll.card.2-hrs` | string | `portalCollectionSpecs.ts:173` | 2 hrs |  |

### 13.8 Table — `table`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `coll.table.table` | name | `portalCollectionSpecs.ts:177` | Table |  |
| `coll.table.select-row-column-cells` | field label | `portalCollectionSpecs.ts:185` | Select row / column cells |  |
| `coll.table.first-row-is-a-header` | field label | `portalCollectionSpecs.ts:197` | First row is a header |  |
| `coll.table.first-column-is-a-header` | field label | `portalCollectionSpecs.ts:198` | First column is a header |  |
| `coll.table.cell-padding` | field label | `portalCollectionSpecs.ts:214` | Cell padding |  |
| `coll.table.table-2` | group | `portalCollectionSpecs.ts:214` | Table |  |
| `coll.table.this-binds-to-nothing-which-is-exa` | text | `portalCollectionSpecs.ts:229` | This binds to nothing, which is exactly when it is right: short, stable content that is not already a record. Past about ten rows it wants search and sorting — which means it wants to be a knowledge article. |  |
| `coll.table.inherit-from-theme` | headFont | `portalCollectionSpecs.ts:236` | Inherit from theme |  |
| `coll.table.semibold` | headWeight | `portalCollectionSpecs.ts:236` | Semibold |  |
| `coll.table.inherit-from-theme-2` | rowFont | `portalCollectionSpecs.ts:237` | Inherit from theme |  |

### 13.9 Media Slider — `media_slider`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `coll.media-slider.media-slider` | name | `portalCollectionSpecs.ts:257` | Media Slider |  |
| `coll.media-slider.optional-hidden-when-blank` | help | `portalCollectionSpecs.ts:259` | Optional — hidden when blank. |  |
| `coll.media-slider.autoplay` | field label | `portalCollectionSpecs.ts:260` | Autoplay |  |
| `coll.media-slider.playback` | group | `portalCollectionSpecs.ts:260` | Playback |  |
| `coll.media-slider.interval` | field label | `portalCollectionSpecs.ts:261` | Interval |  |
| `coll.media-slider.pause-on-hover` | field label | `portalCollectionSpecs.ts:262` | Pause on hover |  |
| `coll.media-slider.loop` | field label | `portalCollectionSpecs.ts:263` | Loop |  |
| `coll.media-slider.show-arrows` | field label | `portalCollectionSpecs.ts:264` | Show arrows |  |
| `coll.media-slider.navigation` | group | `portalCollectionSpecs.ts:264` | Navigation |  |
| `coll.media-slider.show-dots` | field label | `portalCollectionSpecs.ts:265` | Show dots |  |
| `coll.media-slider.allow-swipe-drag` | field label | `portalCollectionSpecs.ts:266` | Allow swipe / drag |  |
| `coll.media-slider.keyboard-navigation` | field label | `portalCollectionSpecs.ts:268` | Keyboard navigation |  |
| `coll.media-slider.always-on-a-slider-nobody-can-tab-` | help | `portalCollectionSpecs.ts:268` | Always on. A slider nobody can tab through is a slider some people cannot use. |  |
| `coll.media-slider.slides-per-view` | field label | `portalCollectionSpecs.ts:269` | Slides per view |  |
| `coll.media-slider.track` | group | `portalCollectionSpecs.ts:269` | Track |  |
| `coll.media-slider.gap-between-slides` | field label | `portalCollectionSpecs.ts:270` | Gap between slides |  |
| `coll.media-slider.transition` | field label | `portalCollectionSpecs.ts:272` | Transition |  |
| `coll.media-slider.slide` | default value | `portalCollectionSpecs.ts:273` | slide |  |
| `coll.media-slider.slide-2` | field label | `portalCollectionSpecs.ts:273` | Slide |  |
| `coll.media-slider.transition-speed` | field label | `portalCollectionSpecs.ts:276` | Transition speed |  |
| `coll.media-slider.fast` | default value | `portalCollectionSpecs.ts:277` | fast |  |
| `coll.media-slider.fast-2` | field label | `portalCollectionSpecs.ts:277` | Fast |  |
| `coll.media-slider.slow` | default value | `portalCollectionSpecs.ts:277` | slow |  |
| `coll.media-slider.slow-2` | field label | `portalCollectionSpecs.ts:277` | Slow |  |
| `coll.media-slider.content-max-width` | field label | `portalCollectionSpecs.ts:279` | Content max width |  |
| `coll.media-slider.slide-3` | group | `portalCollectionSpecs.ts:279` | Slide |  |
| `coll.media-slider.text-over-media-overlay` | field label | `portalCollectionSpecs.ts:280` | Text-over-media overlay |  |
| `coll.media-slider.arrow-placement` | field label | `portalCollectionSpecs.ts:282` | Arrow placement |  |
| `coll.media-slider.arrows` | group | `portalCollectionSpecs.ts:282` | Arrows |  |
| `coll.media-slider.inside` | default value | `portalCollectionSpecs.ts:283` | inside |  |
| `coll.media-slider.inside-2` | field label | `portalCollectionSpecs.ts:283` | Inside |  |
| `coll.media-slider.outside` | default value | `portalCollectionSpecs.ts:283` | outside |  |
| `coll.media-slider.outside-2` | field label | `portalCollectionSpecs.ts:283` | Outside |  |
| `coll.media-slider.over` | default value | `portalCollectionSpecs.ts:283` | over |  |
| `coll.media-slider.over-media` | field label | `portalCollectionSpecs.ts:283` | Over media |  |
| `coll.media-slider.dot-placement` | field label | `portalCollectionSpecs.ts:286` | Dot placement |  |
| `coll.media-slider.dots` | group | `portalCollectionSpecs.ts:286` | Dots |  |
| `coll.media-slider.below` | default value | `portalCollectionSpecs.ts:287` | below |  |
| `coll.media-slider.below-2` | field label | `portalCollectionSpecs.ts:287` | Below |  |
| `coll.media-slider.dot-style` | field label | `portalCollectionSpecs.ts:290` | Dot style |  |
| `coll.media-slider.dots-2` | default value | `portalCollectionSpecs.ts:291` | dots |  |
| `coll.media-slider.dots-3` | field label | `portalCollectionSpecs.ts:291` | Dots |  |
| `coll.media-slider.bars` | default value | `portalCollectionSpecs.ts:291` | bars |  |
| `coll.media-slider.bars-2` | field label | `portalCollectionSpecs.ts:291` | Bars |  |
| `coll.media-slider.numbers` | default value | `portalCollectionSpecs.ts:291` | numbers |  |
| `coll.media-slider.numbers-2` | field label | `portalCollectionSpecs.ts:291` | Numbers |  |
| `coll.media-slider.slides` | group | `portalCollectionSpecs.ts:296` | Slides |  |
| `coll.media-slider.add-slide` | addLabel | `portalCollectionSpecs.ts:296` | Add slide |  |
| `coll.media-slider.no-slides-yet-a-slider-with-nothin` | emptyHint | `portalCollectionSpecs.ts:297` | No slides yet. A slider with nothing in it renders as an empty band. |  |
| `coll.media-slider.image-set` | string | `portalCollectionSpecs.ts:299` | Image set |  |
| `coll.media-slider.no-media-yet` | string | `portalCollectionSpecs.ts:299` | No media yet |  |
| `coll.media-slider.a-line-about-what-this-slide-is-fo` | caption | `portalCollectionSpecs.ts:300` | A line about what this slide is for. |  |
| `coll.media-slider.media-type` | field label | `portalCollectionSpecs.ts:303` | Media type |  |
| `coll.media-slider.media` | group | `portalCollectionSpecs.ts:303` | Media |  |
| `coll.media-slider.image` | default value | `portalCollectionSpecs.ts:304` | image |  |
| `coll.media-slider.video` | default value | `portalCollectionSpecs.ts:304` | video |  |
| `coll.media-slider.video-2` | field label | `portalCollectionSpecs.ts:304` | Video |  |
| `coll.media-slider.source` | field label | `portalCollectionSpecs.ts:306` | Source |  |
| `coll.media-slider.alt-text` | field label | `portalCollectionSpecs.ts:308` | Alt text |  |
| `coll.media-slider.no-alt-text-yet-screen-reader-user` | warnWhenBlank | `portalCollectionSpecs.ts:309` | No alt text yet — screen-reader users will hear nothing where this slide’s image is. |  |
| `coll.media-slider.poster-image` | field label | `portalCollectionSpecs.ts:311` | Poster image |  |
| `coll.media-slider.heading` | field label | `portalCollectionSpecs.ts:312` | Heading |  |
| `coll.media-slider.text-style` | group | `portalCollectionSpecs.ts:312` | Text style |  |
| `coll.media-slider.caption` | field label | `portalCollectionSpecs.ts:313` | Caption |  |
| `coll.media-slider.call-to-action` | field label | `portalCollectionSpecs.ts:314` | Call to action |  |
| `coll.media-slider.action` | group | `portalCollectionSpecs.ts:314` | Action |  |
| `coll.media-slider.cta-label` | field label | `portalCollectionSpecs.ts:315` | CTA label |  |
| `coll.media-slider.cta-opens` | field label | `portalCollectionSpecs.ts:317` | CTA opens |  |
| `coll.media-slider.url` | default value | `portalCollectionSpecs.ts:319` | url |  |
| `coll.media-slider.external-link` | field label | `portalCollectionSpecs.ts:319` | External link |  |
| `coll.media-slider.page` | default value | `portalCollectionSpecs.ts:319` | page |  |
| `coll.media-slider.a-page-in-this-portal` | field label | `portalCollectionSpecs.ts:319` | A page in this portal |  |
| `coll.media-slider.download` | default value | `portalCollectionSpecs.ts:322` | download |  |
| `coll.media-slider.download-a-file` | field label | `portalCollectionSpecs.ts:322` | Download a file |  |
| `coll.media-slider.phone` | default value | `portalCollectionSpecs.ts:323` | phone |  |
| `coll.media-slider.call-a-number` | field label | `portalCollectionSpecs.ts:323` | Call a number |  |
| `coll.media-slider.url-2` | field label | `portalCollectionSpecs.ts:326` | URL |  |
| `coll.media-slider.heading-2` | name | `portalCollectionSpecs.ts:330` | Heading |  |
| `coll.media-slider.caption-2` | name | `portalCollectionSpecs.ts:331` | Caption |  |

### 13.10 `s0`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `coll.s0.tell-people-what-matters-this-week` | heading | `portalCollectionSpecs.ts:339` | Tell people what matters this week |  |
| `coll.s0.a-short-line-under-the-heading` | caption | `portalCollectionSpecs.ts:339` | A short line under the heading. |  |

### 13.11 Photo Gallery — `photo_gallery`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `coll.photo-gallery.photo-gallery` | name | `portalCollectionSpecs.ts:346` | Photo Gallery |  |
| `coll.photo-gallery.open-in-lightbox-on-click` | field label | `portalCollectionSpecs.ts:349` | Open in lightbox on click |  |
| `coll.photo-gallery.behaviour` | group | `portalCollectionSpecs.ts:349` | Behaviour |  |
| `coll.photo-gallery.show-captions-in-lightbox` | field label | `portalCollectionSpecs.ts:350` | Show captions in lightbox |  |
| `coll.photo-gallery.show-more-paginate-after` | field label | `portalCollectionSpecs.ts:352` | Show more / paginate after |  |
| `coll.photo-gallery.0-shows-every-photo` | help | `portalCollectionSpecs.ts:353` | 0 shows every photo. |  |
| `coll.photo-gallery.layout` | field label | `portalCollectionSpecs.ts:356` | Layout |  |
| `coll.photo-gallery.grid` | group | `portalCollectionSpecs.ts:356` | Grid |  |
| `coll.photo-gallery.grid-2` | default value | `portalCollectionSpecs.ts:357` | grid |  |
| `coll.photo-gallery.grid-3` | field label | `portalCollectionSpecs.ts:357` | Grid |  |
| `coll.photo-gallery.masonry` | default value | `portalCollectionSpecs.ts:357` | masonry |  |
| `coll.photo-gallery.masonry-2` | field label | `portalCollectionSpecs.ts:357` | Masonry |  |
| `coll.photo-gallery.justified` | default value | `portalCollectionSpecs.ts:357` | justified |  |
| `coll.photo-gallery.justified-2` | field label | `portalCollectionSpecs.ts:357` | Justified |  |
| `coll.photo-gallery.columns` | field label | `portalCollectionSpecs.ts:359` | Columns |  |
| `coll.photo-gallery.gap` | field label | `portalCollectionSpecs.ts:360` | Gap |  |
| `coll.photo-gallery.hover-effect` | field label | `portalCollectionSpecs.ts:362` | Hover effect |  |
| `coll.photo-gallery.hover` | group | `portalCollectionSpecs.ts:362` | Hover |  |
| `coll.photo-gallery.zoom` | default value | `portalCollectionSpecs.ts:363` | zoom |  |
| `coll.photo-gallery.zoom-2` | field label | `portalCollectionSpecs.ts:363` | Zoom |  |
| `coll.photo-gallery.dim` | default value | `portalCollectionSpecs.ts:363` | dim |  |
| `coll.photo-gallery.dim-2` | field label | `portalCollectionSpecs.ts:363` | Dim |  |
| `coll.photo-gallery.reveal` | default value | `portalCollectionSpecs.ts:363` | reveal |  |
| `coll.photo-gallery.reveal-2` | field label | `portalCollectionSpecs.ts:363` | Reveal |  |
| `coll.photo-gallery.photos` | group | `portalCollectionSpecs.ts:368` | Photos |  |
| `coll.photo-gallery.add-photo` | addLabel | `portalCollectionSpecs.ts:368` | Add photo |  |
| `coll.photo-gallery.no-photos-yet-use-add-photo-once-o` | emptyHint | `portalCollectionSpecs.ts:369` | No photos yet. Use “Add photo” once, or drop several files at a time. |  |
| `coll.photo-gallery.no-image-yet` | string | `portalCollectionSpecs.ts:371` | No image yet |  |
| `coll.photo-gallery.no-alt-text-yet-screen-reader-user` | warnWhenBlank | `portalCollectionSpecs.ts:377` | No alt text yet — screen-reader users will hear nothing where this photo is. |  |
| `coll.photo-gallery.overrides-the-lightbox-for-this-ph` | help | `portalCollectionSpecs.ts:380` | Overrides the lightbox for this photo. |  |
| `coll.photo-gallery.column-span` | field label | `portalCollectionSpecs.ts:381` | Column span |  |
| `coll.photo-gallery.tile` | group | `portalCollectionSpecs.ts:381` | Tile |  |

### 13.12 Feedback — `feedback`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `coll.feedback.feedback` | name | `portalCollectionSpecs.ts:396` | Feedback |  |
| `coll.feedback.data` | group | `portalCollectionSpecs.ts:396` | Data |  |
| `coll.feedback.allow-requester-to-submit-feedback` | setting | `portalCollectionSpecs.ts:397` | Allow Requester To Submit Feedback |  |
| `coll.feedback.organization` | section | `portalCollectionSpecs.ts:397` | Organization |  |
| `coll.feedback.prompt` | field label | `portalCollectionSpecs.ts:404` | Prompt |  |
| `coll.feedback.scale` | field label | `portalCollectionSpecs.ts:406` | Scale |  |
| `coll.feedback.stars` | default value | `portalCollectionSpecs.ts:407` | stars |  |
| `coll.feedback.stars-2` | field label | `portalCollectionSpecs.ts:407` | Stars |  |
| `coll.feedback.number` | default value | `portalCollectionSpecs.ts:407` | number |  |
| `coll.feedback.ask-follow-up-questions-after-the-` | field label | `portalCollectionSpecs.ts:409` | Ask follow-up questions after the rating |  |
| `coll.feedback.ask-when` | field label | `portalCollectionSpecs.ts:411` | Ask when |  |
| `coll.feedback.always` | default value | `portalCollectionSpecs.ts:413` | always |  |
| `coll.feedback.after-every-rating` | field label | `portalCollectionSpecs.ts:413` | After every rating |  |
| `coll.feedback.low` | default value | `portalCollectionSpecs.ts:414` | low |  |
| `coll.feedback.only-when-the-rating-is-3-or-below` | field label | `portalCollectionSpecs.ts:414` | Only when the rating is 3 or below |  |
| `coll.feedback.asking-only-on-low-scores-keeps-th` | help | `portalCollectionSpecs.ts:416` | Asking only on low scores keeps the happy path to one click. |  |
| `coll.feedback.mark-size` | field label | `portalCollectionSpecs.ts:418` | Mark size |  |
| `coll.feedback.rating` | group | `portalCollectionSpecs.ts:418` | Rating |  |
| `coll.feedback.mark-colour-filled` | field label | `portalCollectionSpecs.ts:419` | Mark colour — filled |  |
| `coll.feedback.mark-colour-empty` | field label | `portalCollectionSpecs.ts:420` | Mark colour — empty |  |
| `coll.feedback.a-requester-only-sees-this-once-th` | text | `portalCollectionSpecs.ts:429` | A requester only sees this once they have a resolved request to rate. The canvas always shows its resting state, because that is what you are composing. |  |
| `coll.feedback.no-follow-up-questions-yet-a-ratin` | emptyHint | `portalCollectionSpecs.ts:435` | No follow-up questions yet. A rating alone gives you a score and never a reason. |  |
| `coll.feedback.what-could-we-have-done-better` | q | `portalCollectionSpecs.ts:438` | What could we have done better? |  |
| `coll.feedback.answer-type` | field label | `portalCollectionSpecs.ts:442` | Answer type |  |
| `coll.feedback.free-text` | field label | `portalCollectionSpecs.ts:443` | Free text |  |
| `coll.feedback.choice` | default value | `portalCollectionSpecs.ts:443` | choice |  |
| `coll.feedback.choose-one` | field label | `portalCollectionSpecs.ts:443` | Choose one |  |
| `coll.feedback.yesno` | default value | `portalCollectionSpecs.ts:443` | yesno |  |
| `coll.feedback.yes-no` | field label | `portalCollectionSpecs.ts:443` | Yes / No |  |
| `coll.feedback.options` | field label | `portalCollectionSpecs.ts:445` | Options |  |
| `coll.feedback.required` | field label | `portalCollectionSpecs.ts:446` | Required |  |
| `coll.feedback.how-are-we-doing` | title / tooltip | `portalCollectionSpecs.ts:451` | How are we doing? |  |
| `coll.feedback.rate-your-last-resolved-request` | subtitle | `portalCollectionSpecs.ts:451` | Rate your last resolved request |  |

### 13.13 `q0`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `coll.q0.speed` | string | `portalCollectionSpecs.ts:454` | Speed |  |
| `coll.q0.clarity` | string | `portalCollectionSpecs.ts:454` | Clarity |  |
| `coll.q0.the-fix-itself` | string | `portalCollectionSpecs.ts:454` | The fix itself |  |
| `coll.q0.communication` | string | `portalCollectionSpecs.ts:454` | Communication |  |
| `coll.q0.raise-it-in-the-portal` | title / tooltip | `portalCollectionSpecs.ts:468` | Raise it in the portal |  |
| `coll.q0.requests-logged-here-reach-the-rig` | description | `portalCollectionSpecs.ts:468` | Requests logged here reach the right team straight away. |  |
| `coll.q0.add-what-you-have-already-tried` | title / tooltip | `portalCollectionSpecs.ts:469` | Add what you have already tried |  |
| `coll.q0.it-saves-the-first-round-of-questi` | description | `portalCollectionSpecs.ts:469` | It saves the first round of questions back. |  |
| `coll.q0.attach-a-screenshot` | title / tooltip | `portalCollectionSpecs.ts:470` | Attach a screenshot |  |
| `coll.q0.a-picture-of-the-error-resolves-mo` | description | `portalCollectionSpecs.ts:470` | A picture of the error resolves most tickets faster. |  |
| `coll.q0.track-it-from-my-open-requests` | title / tooltip | `portalCollectionSpecs.ts:471` | Track it from My Open Requests |  |
| `coll.q0.every-update-lands-there-and-in-yo` | description | `portalCollectionSpecs.ts:471` | Every update lands there and in your email. |  |
| `coll.q0.font` | field label | `portalCollectionSpecs.ts:476` | Font |  |
| `coll.q0.font-weight` | field label | `portalCollectionSpecs.ts:478` | Font weight |  |
| `coll.q0.font-size` | field label | `portalCollectionSpecs.ts:480` | Font size |  |
| `coll.q0.font-colour` | field label | `portalCollectionSpecs.ts:481` | Font colour |  |
| `coll.q0.font-format` | field label | `portalCollectionSpecs.ts:482` | Font format |  |

### 13.14 List — `list_el`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `coll.list-el.list` | name | `portalCollectionSpecs.ts:488` | List |  |
| `coll.list-el.basic` | group | `portalCollectionSpecs.ts:488` | Basic |  |
| `coll.list-el.list-title` | field label | `portalCollectionSpecs.ts:492` | List title |  |
| `coll.list-el.optional-leave-blank-for-a-bare-li` | help | `portalCollectionSpecs.ts:492` | Optional — leave blank for a bare list. |  |
| `coll.list-el.bullet` | field label | `portalCollectionSpecs.ts:494` | Bullet |  |
| `coll.list-el.disc` | default value | `portalCollectionSpecs.ts:495` | disc |  |
| `coll.list-el.dot` | field label | `portalCollectionSpecs.ts:495` | Dot |  |
| `coll.list-el.number` | field label | `portalCollectionSpecs.ts:495` | Number |  |
| `coll.list-el.item-title` | string | `portalCollectionSpecs.ts:497` | Item Title |  |
| `coll.list-el.item-description` | string | `portalCollectionSpecs.ts:498` | Item Description |  |
| `coll.list-el.divider-between-items` | field label | `portalCollectionSpecs.ts:501` | Divider between items |  |
| `coll.list-el.divider` | group | `portalCollectionSpecs.ts:501` | Divider |  |
| `coll.list-el.colour` | field label | `portalCollectionSpecs.ts:503` | Colour |  |
| `coll.list-el.thickness` | field label | `portalCollectionSpecs.ts:504` | Thickness |  |
| `coll.list-el.space-below` | field label | `portalCollectionSpecs.ts:505` | Space below |  |
| `coll.list-el.items` | group | `portalCollectionSpecs.ts:511` | Items |  |
| `coll.list-el.add-item` | addLabel | `portalCollectionSpecs.ts:511` | Add item |  |
| `coll.list-el.no-points-yet-a-list-with-nothing-` | emptyHint | `portalCollectionSpecs.ts:512` | No points yet. A list with nothing in it is invisible on the portal. |  |
| `coll.list-el.item` | field label | `portalCollectionSpecs.ts:518` | Item |  |
| `coll.list-el.item-description-2` | field label | `portalCollectionSpecs.ts:519` | Item description |  |
| `coll.list-el.optional-second-line` | help | `portalCollectionSpecs.ts:519` | Optional second line. |  |
| `coll.list-el.item-2` | name | `portalCollectionSpecs.ts:522` | Item |  |
| `coll.list-el.description` | name | `portalCollectionSpecs.ts:523` | Description |  |
| `coll.list-el.inherit-from-theme` | titleFont | `portalCollectionSpecs.ts:529` | Inherit from theme |  |
| `coll.list-el.inherit-from-theme-2` | descFont | `portalCollectionSpecs.ts:530` | Inherit from theme |  |
| `coll.list-el.how-do-i-reset-my-password` | title / tooltip | `portalCollectionSpecs.ts:545` | How do I reset my password? |  |
| `coll.list-el.use-ad-self-service-on-the-portal-` | body | `portalCollectionSpecs.ts:545` | Use AD Self Service on the portal home. If your account is locked, raise an incident and the service desk will unlock it. |  |
| `coll.list-el.how-long-until-someone-picks-up-my` | title / tooltip | `portalCollectionSpecs.ts:546` | How long until someone picks up my ticket? |  |
| `coll.list-el.a-p3-request-is-picked-up-within-o` | body | `portalCollectionSpecs.ts:546` | A P3 request is picked up within one working day. P1 and P2 are picked up inside the hour, around the clock. |  |
| `coll.list-el.how-do-i-request-new-software` | title / tooltip | `portalCollectionSpecs.ts:547` | How do I request new software? |  |
| `coll.list-el.request-it-from-the-service-catalo` | body | `portalCollectionSpecs.ts:547` | Request it from the service catalog. Anything with a licence cost goes to your line manager for approval first. |  |

### 13.15 Accordion — `accordion`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `coll.accordion.accordion` | name | `portalCollectionSpecs.ts:552` | Accordion |  |
| `coll.accordion.layout` | group | `portalCollectionSpecs.ts:552` | Layout |  |
| `coll.accordion.no-items-yet-an-accordion-with-not` | emptyHint | `portalCollectionSpecs.ts:565` | No items yet. An accordion with nothing in it is invisible on the portal. |  |
| `coll.accordion.title-or-question` | field label | `portalCollectionSpecs.ts:572` | Title or question |  |
| `coll.accordion.textual-content` | group | `portalCollectionSpecs.ts:572` | Textual content |  |
| `coll.accordion.bullets-bold-and-links-all-work-he` | help | `portalCollectionSpecs.ts:576` | Bullets, bold and links all work here. |  |
| `coll.accordion.link-text` | field label | `portalCollectionSpecs.ts:582` | Link text |  |
| `coll.accordion.link-address` | field label | `portalCollectionSpecs.ts:583` | Link address |  |
| `coll.accordion.add-link` | field label | `portalCollectionSpecs.ts:587` | Add link |  |
| `coll.accordion.remove-link` | removeLabel | `portalCollectionSpecs.ts:587` | Remove link |  |
| `coll.accordion.title` | name | `portalCollectionSpecs.ts:589` | Title |  |
| `coll.accordion.body-text` | name | `portalCollectionSpecs.ts:590` | Body text |  |
| `coll.accordion.inherit-from-theme` | bodyFont | `portalCollectionSpecs.ts:598` | Inherit from theme |  |

### 13.16 Text with Image — `text_image`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `coll.text-image.text-with-image` | name | `portalCollectionSpecs.ts:613` | Text with Image |  |
| `coll.text-image.image-position` | field label | `portalCollectionSpecs.ts:616` | Image position |  |
| `coll.text-image.select-image` | field label | `portalCollectionSpecs.ts:621` | Select image |  |
| `coll.text-image.without-alt-text-this-image-is-inv` | warnWhenBlank | `portalCollectionSpecs.ts:624` | Without alt text this image is invisible to a screen reader. Leave it blank only if it is decorative. |  |
| `coll.text-image.paragraph` | field label | `portalCollectionSpecs.ts:626` | Paragraph |  |
| `coll.text-image.image-size` | field label | `portalCollectionSpecs.ts:629` | Image size |  |
| `coll.text-image.image-style` | group | `portalCollectionSpecs.ts:629` | Image style |  |
| `coll.text-image.corner-radius` | field label | `portalCollectionSpecs.ts:630` | Corner radius |  |
| `coll.text-image.border` | field label | `portalCollectionSpecs.ts:631` | Border |  |
| `coll.text-image.alignment` | group | `portalCollectionSpecs.ts:641` | Alignment |  |
| `coll.text-image.pair-a-picture-with-the-words-that` | body | `portalCollectionSpecs.ts:649` | Pair a picture with the words that explain it. The text wraps around the image, so a long paragraph keeps its shape whichever side the image sits on. |  |
| `coll.text-image.inherit-from-theme` | font | `portalCollectionSpecs.ts:651` | Inherit from theme |  |

## 14. Widget settings — sections, columns, page and rails

*`portalStructureSpecs.ts`* — 85 entries

### 14.1 Search — `search`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `struct.search.search` | name | `portalStructureSpecs.ts:22` | Search |  |
| `struct.search.structure` | group | `portalStructureSpecs.ts:22` | Structure |  |
| `struct.search.placeholder` | field label | `portalStructureSpecs.ts:30` | Placeholder |  |

### 14.2 `style`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `struct.style.width` | field label | `portalStructureSpecs.ts:36` | Width |  |
| `struct.style.corner-radius` | field label | `portalStructureSpecs.ts:37` | Corner radius |  |
| `struct.style.fill` | field label | `portalStructureSpecs.ts:222` | Fill |  |
| `struct.style.background-colour` | field label | `portalStructureSpecs.ts:224` | Background colour |  |
| `struct.style.border` | field label | `portalStructureSpecs.ts:225` | Border |  |
| `struct.style.bar-height` | field label | `portalStructureSpecs.ts:460` | Bar height |  |

### 14.3 `spacing`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `struct.spacing.how-can-we-help-you` | searchPlaceholder | `portalStructureSpecs.ts:46` | How can we help you? |  |

### 14.4 Banner — `hero`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `struct.hero.banner` | name | `portalStructureSpecs.ts:50` | Banner |  |
| `struct.hero.heading` | field label | `portalStructureSpecs.ts:52` | Heading |  |
| `struct.hero.content` | group | `portalStructureSpecs.ts:52` | Content |  |
| `struct.hero.sub-heading` | field label | `portalStructureSpecs.ts:53` | Sub-heading |  |
| `struct.hero.show-the-search-bar` | field label | `portalStructureSpecs.ts:54` | Show the search bar |  |
| `struct.hero.search-placeholder` | field label | `portalStructureSpecs.ts:55` | Search placeholder |  |
| `struct.hero.height` | field label | `portalStructureSpecs.ts:63` | Height |  |
| `struct.hero.banner-2` | group | `portalStructureSpecs.ts:63` | Banner |  |
| `struct.hero.short` | field label | `portalStructureSpecs.ts:65` | Short |  |
| `struct.hero.standard` | field label | `portalStructureSpecs.ts:66` | Standard |  |
| `struct.hero.tall` | field label | `portalStructureSpecs.ts:67` | Tall |  |
| `struct.hero.full` | field label | `portalStructureSpecs.ts:68` | Full |  |
| `struct.hero.background` | field label | `portalStructureSpecs.ts:77` | Background |  |
| `struct.hero.image` | default value | `portalStructureSpecs.ts:78` | image |  |
| `struct.hero.image-2` | field label | `portalStructureSpecs.ts:78` | Image |  |
| `struct.hero.color` | default value | `portalStructureSpecs.ts:78` | color |  |
| `struct.hero.colour` | field label | `portalStructureSpecs.ts:78` | Colour |  |
| `struct.hero.banner-image` | field label | `portalStructureSpecs.ts:83` | Banner image |  |
| `struct.hero.banner-colour` | field label | `portalStructureSpecs.ts:87` | Banner colour |  |
| `struct.hero.search-width` | field label | `portalStructureSpecs.ts:104` | Search width |  |
| `struct.hero.search` | group | `portalStructureSpecs.ts:104` | Search |  |
| `struct.hero.search-corner-radius` | field label | `portalStructureSpecs.ts:105` | Search corner radius |  |
| `struct.hero.welcome-to-support-portal` | heading | `portalStructureSpecs.ts:119` | Welcome to Support Portal |  |
| `struct.hero.search-our-support-center-knowledg` | subtitle | `portalStructureSpecs.ts:120` | Search our support center knowledge base |  |

### 14.5 Section — `section`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `struct.section.section` | name | `portalStructureSpecs.ts:141` | Section |  |

### 14.6 `layout`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `struct.layout.presets` | field label | `portalStructureSpecs.ts:192` | Presets |  |
| `struct.layout.responsive-behaviour` | field label | `portalStructureSpecs.ts:202` | Responsive behaviour |  |
| `struct.layout.fill` | default value | `portalStructureSpecs.ts:204` | fill |  |
| `struct.layout.fill-items` | field label | `portalStructureSpecs.ts:204` | Fill items |  |
| `struct.layout.fixed` | default value | `portalStructureSpecs.ts:205` | fixed |  |
| `struct.layout.fixed-items` | field label | `portalStructureSpecs.ts:205` | Fixed items |  |
| `struct.layout.fill-dragging-one-column-re-flows-` | info | `portalStructureSpecs.ts:207` | Fill — dragging one column re-flows its siblings so the row always fills the section. Fixed — every column keeps its own width, and dragging one leaves the others exactly where they are. |  |
| `struct.layout.content-alignment` | field label | `portalStructureSpecs.ts:208` | Content alignment |  |

### 14.7 `column`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `struct.column.align-the-blocks-inside` | field label | `portalStructureSpecs.ts:261` | Align the blocks inside |  |
| `struct.column.a-column-owns-its-width-and-how-th` | text | `portalStructureSpecs.ts:268` | A column owns its width and how the blocks inside it sit. Everything else belongs to the section above it or the blocks within it. |  |

### 14.8 Page — `page`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `struct.page.page` | name | `portalStructureSpecs.ts:275` | Page |  |
| `struct.page.typeface-and-colours-are-set-once-` | text | `portalStructureSpecs.ts:283` | Typeface and colours are set once for the whole portal in Theme, in the right-hand rail. This page keeps its own background and spacing. |  |

### 14.9 Requests — `r1`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `struct.r1.requests` | name | `portalStructureSpecs.ts:290` | Requests |  |

### 14.10 Changes — `r2`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `struct.r2.changes` | name | `portalStructureSpecs.ts:291` | Changes |  |

### 14.11 My Assets — `r3`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `struct.r3.my-assets` | name | `portalStructureSpecs.ts:292` | My Assets |  |

### 14.12 My CIs — `r4`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `struct.r4.my-cis` | name | `portalStructureSpecs.ts:293` | My CIs |  |
| `struct.r4.allow-requester-to-access-my-ci` | perm | `portalStructureSpecs.ts:293` | Allow Requester to Access My CI |  |

### 14.13 Knowledge — `r5`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `struct.r5.knowledge` | name | `portalStructureSpecs.ts:294` | Knowledge |  |
| `struct.r5.allow-requester-to-access-knowledg` | perm | `portalStructureSpecs.ts:294` | Allow Requester To Access Knowledge |  |

### 14.14 My Approvals — `r6`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `struct.r6.my-approvals` | name | `portalStructureSpecs.ts:295` | My Approvals |  |
| `struct.r6.allow-requester-to-access-my-appro` | perm | `portalStructureSpecs.ts:295` | Allow Requester To Access My Approvals |  |

### 14.15 My Team — `r7`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `struct.r7.my-team` | name | `portalStructureSpecs.ts:296` | My Team |  |

### 14.16 Tasks — `r8`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `struct.r8.tasks` | name | `portalStructureSpecs.ts:297` | Tasks |  |

### 14.17 `type`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `struct.type.font-size` | route | `portalStructureSpecs.ts:317` | Font size |  |

### 14.18 Conversations — `chat`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `struct.chat.conversations` | name | `portalStructureSpecs.ts:318` | Conversations |  |
| `struct.chat.messages` | route | `portalStructureSpecs.ts:318` | Messages |  |

### 14.19 Notifications — `bell`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `struct.bell.notifications` | name | `portalStructureSpecs.ts:319` | Notifications |  |
| `struct.bell.alerts` | route | `portalStructureSpecs.ts:319` | Alerts |  |

### 14.20 Shortcuts — `keys`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `struct.keys.shortcuts` | name | `portalStructureSpecs.ts:320` | Shortcuts |  |
| `struct.keys.keyboard` | route | `portalStructureSpecs.ts:320` | Keyboard |  |

### 14.21 Home — `home`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `struct.home.home` | name | `portalStructureSpecs.ts:321` | Home |  |
| `struct.home.portal-home` | route | `portalStructureSpecs.ts:321` | Portal home |  |

### 14.22 Help — `info`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `struct.info.help` | name | `portalStructureSpecs.ts:322` | Help |  |
| `struct.info.support` | route | `portalStructureSpecs.ts:322` | Support |  |

### 14.23 Actions — `header_actions`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `struct.header-actions.actions` | name | `portalStructureSpecs.ts:338` | Actions |  |
| `struct.header-actions.chrome` | group | `portalStructureSpecs.ts:338` | Chrome |  |
| `struct.header-actions.these-belong-to-the-product-and-lo` | text | `portalStructureSpecs.ts:344` | These belong to the product and look the same on every portal. You can reorder them — here or by dragging them in the bar — but not add, remove or restyle them. What a requester can reach through them is set by their permissions, not here. |  |
| `struct.header-actions.actions-2` | group | `portalStructureSpecs.ts:347` | Actions |  |

### 14.24 Left rail — `rail`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `struct.rail.left-rail` | name | `portalStructureSpecs.ts:361` | Left rail |  |
| `struct.rail.these-destinations-belong-to-the-p` | text | `portalStructureSpecs.ts:375` | These destinations belong to the product — you can reorder them, but not add, remove or hide them. A destination the requester is not permitted to reach never appears, whatever the order. |  |
| `struct.rail.destinations` | group | `portalStructureSpecs.ts:378` | Destinations |  |

### 14.25 Logo — `n0`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `struct.n0.logo` | name | `portalStructureSpecs.ts:403` | Logo |  |

### 14.26 Ask AI — `n1`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `struct.n1.ask-ai` | name | `portalStructureSpecs.ts:404` | Ask AI |  |

### 14.27 Create — `n2`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `struct.n2.create` | name | `portalStructureSpecs.ts:405` | Create |  |

### 14.28 Profile — `n9`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `struct.n9.profile` | name | `portalStructureSpecs.ts:412` | Profile |  |

### 14.29 `logo`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `struct.logo.logo-image` | field label | `portalStructureSpecs.ts:428` | Logo image |  |
| `struct.logo.where-the-logo-sits-against-the-ac` | text | `portalStructureSpecs.ts:436` | Where the logo sits against the actions is set on the top bar, since it is a position relative to them. |  |

### 14.30 Top bar — `navbar`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `struct.navbar.top-bar` | name | `portalStructureSpecs.ts:442` | Top bar |  |
| `struct.navbar.logo` | field label | `portalStructureSpecs.ts:449` | Logo |  |
| `struct.navbar.logo-position` | field label | `portalStructureSpecs.ts:451` | Logo position |  |

## 15. Widget settings — child text nodes

*`portalPanelSpecs.ts`* — 72 entries

### 15.1 `alignmentFields`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `child.alignment` | field label | `portalPanelSpecs.ts:24` | Alignment |  |

### 15.2 Divider — `divider`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `child.divider.divider` | name | `portalPanelSpecs.ts:31` | Divider |  |
| `child.divider.layout` | group | `portalPanelSpecs.ts:31` | Layout |  |
| `child.divider.label` | field label | `portalPanelSpecs.ts:34` | Label |  |
| `child.divider.optional-text-sitting-on-the-line` | help | `portalPanelSpecs.ts:34` | Optional text sitting on the line. |  |
| `child.divider.label-position` | field label | `portalPanelSpecs.ts:36` | Label position |  |

### 15.3 `style`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `child.style.layout` | field label | `portalPanelSpecs.ts:47` | Layout |  |
| `child.style.colour` | field label | `portalPanelSpecs.ts:48` | Colour |  |
| `child.style.line-width` | field label | `portalPanelSpecs.ts:49` | Line width |  |
| `child.style.rule-beneath` | field label | `portalPanelSpecs.ts:120` | Rule beneath |  |
| `child.style.rule-colour` | field label | `portalPanelSpecs.ts:121` | Rule colour |  |
| `child.style.rule-thickness` | field label | `portalPanelSpecs.ts:122` | Rule thickness |  |
| `child.style.icon-colour` | field label | `portalPanelSpecs.ts:180` | Icon colour |  |
| `child.style.background-colour` | field label | `portalPanelSpecs.ts:182` | Background colour |  |
| `child.style.border` | field label | `portalPanelSpecs.ts:183` | Border |  |
| `child.style.corner-radius` | field label | `portalPanelSpecs.ts:184` | Corner radius |  |
| `child.style.fill` | field label | `portalPanelSpecs.ts:226` | Fill |  |
| `child.style.stroke-colour` | field label | `portalPanelSpecs.ts:227` | Stroke colour |  |
| `child.style.stroke-width` | field label | `portalPanelSpecs.ts:228` | Stroke width |  |
| `child.style.rotation` | field label | `portalPanelSpecs.ts:230` | Rotation |  |
| `child.style.opacity` | field label | `portalPanelSpecs.ts:231` | Opacity |  |
| `child.style.layer` | field label | `portalPanelSpecs.ts:233` | Layer |  |
| `child.style.behind` | default value | `portalPanelSpecs.ts:234` | behind |  |
| `child.style.behind-2` | field label | `portalPanelSpecs.ts:234` | Behind |  |
| `child.style.flow` | default value | `portalPanelSpecs.ts:234` | flow |  |
| `child.style.in-flow` | field label | `portalPanelSpecs.ts:234` | In flow |  |
| `child.style.front` | default value | `portalPanelSpecs.ts:234` | front |  |
| `child.style.in-front` | field label | `portalPanelSpecs.ts:234` | In front |  |

### 15.4 Spacer — `spacer`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `child.spacer.spacer` | name | `portalPanelSpecs.ts:71` | Spacer |  |
| `child.spacer.basic` | group | `portalPanelSpecs.ts:71` | Basic |  |
| `child.spacer.a-spacer-has-nothing-to-write-only` | contentNote | `portalPanelSpecs.ts:75` | A spacer has nothing to write — only a height. It adds vertical room where section padding is the wrong tool. |  |

### 15.5 `size`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `child.size.a-spacer-adds-vertical-room-where-` | info | `portalPanelSpecs.ts:78` | A spacer adds vertical room where section padding is the wrong tool. |  |
| `child.size.width` | field label | `portalPanelSpecs.ts:80` | Width |  |
| `child.size.height` | field label | `portalPanelSpecs.ts:81` | Height |  |
| `child.size.heading-level` | field label | `portalPanelSpecs.ts:99` | Heading level |  |
| `child.size.document-structure-not-size-set-th` | help | `portalPanelSpecs.ts:104` | Document structure, not size. Set the size on the text toolbar over the words themselves. |  |

### 15.6 `alignment`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `child.alignment.justify` | default value | `portalPanelSpecs.ts:130` | justify |  |
| `child.alignment.justify-2` | field label | `portalPanelSpecs.ts:130` | Justify |  |

### 15.7 `TITLE_LG_SPEC`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `child.title-lg-spec.large-title` | string | `portalPanelSpecs.ts:141` | Large Title |  |

### 15.8 `TITLE_SM_SPEC`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `child.title-sm-spec.small-title` | string | `portalPanelSpecs.ts:142` | Small Title |  |

### 15.9 Icon — `icon_el`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `child.icon-el.icon` | name | `portalPanelSpecs.ts:147` | Icon |  |
| `child.icon-el.visual` | group | `portalPanelSpecs.ts:147` | Visual |  |
| `child.icon-el.icon-2` | field label | `portalPanelSpecs.ts:151` | Icon |  |
| `child.icon-el.alt-text` | field label | `portalPanelSpecs.ts:153` | Alt text |  |
| `child.icon-el.shown-if-the-icon-does-not-load-an` | help | `portalPanelSpecs.ts:157` | Shown if the icon does not load, and read out by screen readers. Leave blank only for decoration. |  |
| `child.icon-el.not-a-link` | field label | `portalPanelSpecs.ts:162` | Not a link |  |
| `child.icon-el.url` | default value | `portalPanelSpecs.ts:162` | url |  |
| `child.icon-el.external-link` | field label | `portalPanelSpecs.ts:162` | External link |  |
| `child.icon-el.page` | default value | `portalPanelSpecs.ts:165` | page |  |
| `child.icon-el.a-page-in-this-portal` | field label | `portalPanelSpecs.ts:165` | A page in this portal |  |
| `child.icon-el.phone` | default value | `portalPanelSpecs.ts:166` | phone |  |
| `child.icon-el.call-a-number` | field label | `portalPanelSpecs.ts:166` | Call a number |  |
| `child.icon-el.url-2` | field label | `portalPanelSpecs.ts:169` | URL |  |
| `child.icon-el.caption` | field label | `portalPanelSpecs.ts:170` | Caption |  |
| `child.icon-el.optional` | help | `portalPanelSpecs.ts:170` | Optional. |  |

### 15.10 Shape — `shape_el`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `child.shape-el.shape` | name | `portalPanelSpecs.ts:213` | Shape |  |
| `child.shape-el.shape-2` | field label | `portalPanelSpecs.ts:217` | Shape |  |
| `child.shape-el.rect` | default value | `portalPanelSpecs.ts:218` | rect |  |
| `child.shape-el.rectangle` | field label | `portalPanelSpecs.ts:218` | Rectangle |  |
| `child.shape-el.circle` | default value | `portalPanelSpecs.ts:218` | circle |  |
| `child.shape-el.circle-2` | field label | `portalPanelSpecs.ts:218` | Circle |  |
| `child.shape-el.triangle` | default value | `portalPanelSpecs.ts:218` | triangle |  |
| `child.shape-el.triangle-2` | field label | `portalPanelSpecs.ts:218` | Triangle |  |
| `child.shape-el.wave` | default value | `portalPanelSpecs.ts:218` | wave |  |
| `child.shape-el.wave-2` | field label | `portalPanelSpecs.ts:218` | Wave |  |
| `child.shape-el.decorative-hidden-from-screen-read` | contentNote | `portalPanelSpecs.ts:221` | Decorative — hidden from screen readers. |  |

### 15.11 `CARD_TITLE_SPEC`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `child.card-title-spec.title` | string | `portalPanelSpecs.ts:288` | Title |  |

### 15.12 `CARD_SUB_SPEC`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `child.card-sub-spec.subtext` | string | `portalPanelSpecs.ts:289` | Subtext |  |

### 15.13 Caption — `image_caption`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `child.image-caption.caption` | name | `portalPanelSpecs.ts:320` | Caption |  |

### 15.14 `LIST_TITLE_SPEC`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `child.list-title-spec.heading` | string | `portalPanelSpecs.ts:329` | Heading |  |

### 15.15 `LIST_LABEL_SPEC`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `child.list-label-spec.label` | string | `portalPanelSpecs.ts:330` | Label |  |

### 15.16 `LIST_LINK_SPEC`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `child.list-link-spec.link-label` | string | `portalPanelSpecs.ts:331` | Link label |  |

## 16. Widget settings — shared style packs

*`PortalStylePacks.tsx`* — 89 entries

### 16.1 `P1_Container`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `pack.style` | title / tooltip | `PortalStylePacks.tsx:122` | Style |  |
| `pack.fill` | string | `PortalStylePacks.tsx:131` | Fill |  |
| `pack.color` | default value | `PortalStylePacks.tsx:139` | color |  |
| `pack.colour` | field label | `PortalStylePacks.tsx:139` | Colour |  |
| `pack.background-colour` | string | `PortalStylePacks.tsx:142` | Background colour |  |
| `pack.background-image` | string | `PortalStylePacks.tsx:143` | Background image |  |
| `pack.overlay` | string | `PortalStylePacks.tsx:144` | Overlay |  |
| `pack.darkens-the-artwork-so-text-stays-` | string | `PortalStylePacks.tsx:146` | Darkens the artwork so text stays readable over it. |  |

### 16.2 `P2_Size`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `pack.size` | title / tooltip | `PortalStylePacks.tsx:185` | Size |  |

### 16.3 `WEIGHTS`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `pack.regular` | default value | `PortalStylePacks.tsx:206` | regular |  |
| `pack.regular-2` | field label | `PortalStylePacks.tsx:206` | Regular |  |

### 16.4 `LINE_HEIGHTS`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `pack.tight` | default value | `PortalStylePacks.tsx:211` | tight |  |
| `pack.tight-2` | field label | `PortalStylePacks.tsx:211` | Tight |  |
| `pack.relaxed` | default value | `PortalStylePacks.tsx:213` | relaxed |  |
| `pack.relaxed-2` | field label | `PortalStylePacks.tsx:213` | Relaxed |  |

### 16.5 `THEME_FONTS`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `pack.inter` | string | `PortalStylePacks.tsx:217` | Inter |  |
| `pack.roboto` | string | `PortalStylePacks.tsx:217` | Roboto |  |
| `pack.source-sans-3` | string | `PortalStylePacks.tsx:217` | Source Sans 3 |  |
| `pack.merriweather` | string | `PortalStylePacks.tsx:217` | Merriweather |  |
| `pack.ibm-plex-mono` | string | `PortalStylePacks.tsx:217` | IBM Plex Mono |  |

### 16.6 `RoleEditor`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `pack.hide` | string | `PortalStylePacks.tsx:236` | Hide |  |
| `pack.edit` | string | `PortalStylePacks.tsx:236` | Edit |  |
| `pack.typeface` | string | `PortalStylePacks.tsx:243` | Typeface |  |
| `pack.inherit-from-theme` | string | `PortalStylePacks.tsx:247` | Inherit from theme |  |
| `pack.set-the-portal-wide-typeface-in-th` | string | `PortalStylePacks.tsx:249` | Set the portal-wide typeface in Theme. This is for the one line that has to differ. |  |
| `pack.size-2` | string | `PortalStylePacks.tsx:250` | Size |  |
| `pack.weight` | string | `PortalStylePacks.tsx:251` | Weight |  |
| `pack.colour-2` | string | `PortalStylePacks.tsx:252` | Colour |  |
| `pack.alignment` | string | `PortalStylePacks.tsx:253` | Alignment |  |
| `pack.line-height` | string | `PortalStylePacks.tsx:254` | Line height |  |
| `pack.max-lines` | string | `PortalStylePacks.tsx:255` | Max lines |  |
| `pack.0-no-clamp` | string | `PortalStylePacks.tsx:255` | 0 = no clamp. |  |
| `pack.revert-this-role-to-inherited` | on-screen text | `PortalStylePacks.tsx:259` | Revert this role to inherited |  |

### 16.7 `P3_Typography`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `pack.typography` | title / tooltip | `PortalStylePacks.tsx:267` | Typography |  |

### 16.8 `P4_Arrangement`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `pack.arrangement` | title / tooltip | `PortalStylePacks.tsx:280` | Arrangement |  |
| `pack.gap-between-items` | string | `PortalStylePacks.tsx:289` | Gap between items |  |
| `pack.divider-between-items` | string | `PortalStylePacks.tsx:292` | Divider between items |  |
| `pack.divider-between-items-2` | field label | `PortalStylePacks.tsx:293` | Divider between items |  |

### 16.9 `FOCAL`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `pack.top-left` | string | `PortalStylePacks.tsx:304` | top left |  |
| `pack.top-right` | string | `PortalStylePacks.tsx:304` | top right |  |
| `pack.bottom-left` | string | `PortalStylePacks.tsx:304` | bottom left |  |
| `pack.bottom-right` | string | `PortalStylePacks.tsx:304` | bottom right |  |

### 16.10 `P5_Media`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `pack.media` | title / tooltip | `PortalStylePacks.tsx:307` | Media |  |
| `pack.aspect-ratio` | string | `PortalStylePacks.tsx:312` | Aspect ratio |  |
| `pack.original` | string | `PortalStylePacks.tsx:313` | Original |  |
| `pack.fit` | string | `PortalStylePacks.tsx:315` | Fit |  |
| `pack.focal-point` | string | `PortalStylePacks.tsx:318` | Focal point |  |
| `pack.shape` | string | `PortalStylePacks.tsx:332` | Shape |  |
| `pack.rectangle` | default value | `PortalStylePacks.tsx:336` | rectangle |  |
| `pack.rect` | field label | `PortalStylePacks.tsx:336` | Rect |  |
| `pack.rounded` | default value | `PortalStylePacks.tsx:336` | rounded |  |
| `pack.rounded-2` | field label | `PortalStylePacks.tsx:336` | Rounded |  |
| `pack.circle` | default value | `PortalStylePacks.tsx:336` | circle |  |
| `pack.circle-2` | field label | `PortalStylePacks.tsx:336` | Circle |  |
| `pack.corner-radius` | string | `PortalStylePacks.tsx:339` | Corner radius |  |
| `pack.caption-position` | string | `PortalStylePacks.tsx:341` | Caption position |  |
| `pack.below` | default value | `PortalStylePacks.tsx:345` | below |  |
| `pack.below-2` | field label | `PortalStylePacks.tsx:345` | Below |  |
| `pack.overlay-2` | default value | `PortalStylePacks.tsx:345` | overlay |  |
| `pack.overlay-3` | field label | `PortalStylePacks.tsx:345` | Overlay |  |

### 16.11 `P6_Icon`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `pack.icon` | title / tooltip | `PortalStylePacks.tsx:358` | Icon |  |
| `pack.container-shape` | string | `PortalStylePacks.tsx:366` | Container shape |  |
| `pack.square` | default value | `PortalStylePacks.tsx:370` | square |  |
| `pack.square-2` | field label | `PortalStylePacks.tsx:370` | Square |  |
| `pack.container-fill` | string | `PortalStylePacks.tsx:373` | Container fill |  |
| `pack.position-relative-to-text` | string | `PortalStylePacks.tsx:374` | Position relative to text |  |

### 16.12 `P7_States`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `pack.interactive-states` | title / tooltip | `PortalStylePacks.tsx:391` | Interactive states |  |
| `pack.hover-treatment` | string | `PortalStylePacks.tsx:396` | Hover treatment |  |
| `pack.lift` | default value | `PortalStylePacks.tsx:400` | lift |  |
| `pack.lift-2` | field label | `PortalStylePacks.tsx:400` | Lift |  |
| `pack.tint` | default value | `PortalStylePacks.tsx:400` | tint |  |
| `pack.tint-2` | field label | `PortalStylePacks.tsx:400` | Tint |  |
| `pack.pressed-treatment` | string | `PortalStylePacks.tsx:403` | Pressed treatment |  |
| `pack.focus-ring` | field label | `PortalStylePacks.tsx:409` | Focus ring |  |
| `pack.always-on-keyboard-users-need-to-s` | lockNote | `PortalStylePacks.tsx:413` | Always on. Keyboard users need to see where they are — this is not configurable. |  |
| `pack.disabled-treatment` | field label | `PortalStylePacks.tsx:415` | Disabled treatment |  |
| `pack.comes-from-the-design-system` | lockNote | `PortalStylePacks.tsx:415` | Comes from the design system. |  |
| `pack.transition-speed` | string | `PortalStylePacks.tsx:416` | Transition speed |  |
| `pack.fast` | default value | `PortalStylePacks.tsx:420` | fast |  |
| `pack.fast-2` | field label | `PortalStylePacks.tsx:420` | Fast |  |

### 16.13 `P8_States`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `pack.empty-state` | title / tooltip | `PortalStylePacks.tsx:440` | Empty state |  |
| `pack.when-there-is-nothing-to-show` | string | `PortalStylePacks.tsx:445` | When there is nothing to show |  |
| `pack.show` | default value | `PortalStylePacks.tsx:449` | show |  |
| `pack.show-message` | field label | `PortalStylePacks.tsx:449` | Show message |  |
| `pack.hide-2` | default value | `PortalStylePacks.tsx:449` | hide |  |
| `pack.hide-widget` | field label | `PortalStylePacks.tsx:449` | Hide widget |  |
| `pack.message` | string | `PortalStylePacks.tsx:453` | Message |  |
| `pack.nothing-to-show-yet` | placeholder | `PortalStylePacks.tsx:454` | Nothing to show yet |  |

### 16.14 `badgeFor`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `pack.overridden` | on-screen text | `PortalStylePacks.tsx:109` | Overridden |  |

## 17. Shared controls

*`PortalControls.tsx` · `PortalItemList.tsx` · `PortalContrastMeter.tsx` · `SpacingMatrix.tsx`* — 72 entries

### 17.1 `BLOCKS`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `ctl.heading-1` | field label | `PortalControls.tsx:202` | Heading 1 |  |
| `ctl.heading-2` | field label | `PortalControls.tsx:203` | Heading 2 |  |
| `ctl.heading-3` | field label | `PortalControls.tsx:204` | Heading 3 |  |
| `ctl.heading-4` | field label | `PortalControls.tsx:205` | Heading 4 |  |
| `ctl.paragraph` | field label | `PortalControls.tsx:206` | Paragraph |  |
| `ctl.quote` | field label | `PortalControls.tsx:207` | Quote |  |
| `ctl.monospace` | field label | `PortalControls.tsx:208` | Monospace |  |

### 17.2 `BlockFormat`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `ctl.paragraph-2` | current | `PortalControls.tsx:230` | Paragraph |  |
| `ctl.paragraph-3` | string | `PortalControls.tsx:233` | Paragraph |  |

### 17.3 `RichText`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `ctl.align-left` | title / tooltip | `PortalControls.tsx:312` | Align left |  |
| `ctl.align-centre` | title / tooltip | `PortalControls.tsx:313` | Align centre |  |
| `ctl.align-right` | title / tooltip | `PortalControls.tsx:314` | Align right |  |
| `ctl.bulleted-list` | title / tooltip | `PortalControls.tsx:315` | Bulleted list |  |
| `ctl.numbered-list` | title / tooltip | `PortalControls.tsx:316` | Numbered list |  |
| `ctl.strikethrough` | title / tooltip | `PortalControls.tsx:318` | Strikethrough |  |
| `ctl.quote-2` | title / tooltip | `PortalControls.tsx:319` | Quote |  |
| `ctl.indent` | title / tooltip | `PortalControls.tsx:320` | Indent |  |
| `ctl.outdent` | title / tooltip | `PortalControls.tsx:321` | Outdent |  |
| `ctl.link-to` | string | `PortalControls.tsx:322` | Link to |  |
| `ctl.undo` | title / tooltip | `PortalControls.tsx:323` | Undo |  |
| `ctl.redo` | title / tooltip | `PortalControls.tsx:324` | Redo |  |
| `ctl.clear-formatting` | title / tooltip | `PortalControls.tsx:325` | Clear formatting |  |

### 17.4 `MultiSelect`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `ctl.none-selected` | placeholder | `PortalControls.tsx:517` | None selected |  |
| `ctl.clear-all` | string | `PortalControls.tsx:552` | Clear all |  |
| `ctl.select-all` | string | `PortalControls.tsx:552` | Select all |  |

### 17.5 `ChipEditor`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `ctl.add-an-option` | placeholder | `PortalControls.tsx:597` | Add an option |  |

### 17.6 `uploadHint`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `ctl.png-jpg-svg-or-webp` | string | `PortalControls.tsx:705` | PNG, JPG, SVG or WebP |  |
| `ctl.mp4-webm-or-mov` | string | `PortalControls.tsx:709` | MP4, WebM or MOV |  |

### 17.7 `VideoSource`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `ctl.uploaded-video` | string | `PortalControls.tsx:749` | Uploaded video |  |
| `ctl.video-link` | string | `PortalControls.tsx:749` | Video link |  |
| `ctl.stored-with-this-page` | string | `PortalControls.tsx:750` | Stored with this page |  |
| `ctl.replace-video` | on-screen text | `PortalControls.tsx:759` | Replace video |  |
| `ctl.no-video-yet` | on-screen text | `PortalControls.tsx:769` | No video yet |  |
| `ctl.select-video` | on-screen text | `PortalControls.tsx:793` | Select video |  |
| `ctl.upload-link` | on-screen text | `PortalControls.tsx:798` | Upload link |  |

### 17.8 `ImageUploadZone`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `ctl.unknown-type` | string | `PortalControls.tsx:845` | unknown type |  |
| `ctl.click-to-upload` | on-screen text | `PortalControls.tsx:890` | Click to upload |  |
| `ctl.or-drag-and-drop` | on-screen text | `PortalControls.tsx:890` | or drag and drop |  |

### 17.9 `UploadZone`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `ctl.contain-10px-10px` | backgroundSize | `PortalControls.tsx:929` | contain, 10px 10px |  |
| `ctl.upload-an-image` | string | `PortalControls.tsx:967` | Upload an image |  |
| `ctl.choose` | on-screen text | `PortalControls.tsx:938` | Choose |  |
| `ctl.replace` | on-screen text | `PortalControls.tsx:943` | Replace |  |
| `ctl.choose-a-ready-made-banner` | on-screen text | `PortalControls.tsx:962` | Choose a ready-made banner |  |
| `ctl.suggested-size-px` | assembled at render time — the unit is appended by the control | `PortalControls.tsx:907` | Suggested {size} px |  |

### 17.10 `PortalItemList`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `ctl.undo-2` | field label | `PortalItemList.tsx:105` | Undo |  |
| `ctl.duplicated` | string | `PortalItemList.tsx:122` | Duplicated |  |
| `ctl.move-up` | title / tooltip | `PortalItemList.tsx:184` | Move up |  |
| `ctl.move-down` | title / tooltip | `PortalItemList.tsx:185` | Move down |  |
| `ctl.show-on-the-portal` | string | `PortalItemList.tsx:190` | Show on the portal |  |
| `ctl.keep-it-here-but-do-not-publish-it` | string | `PortalItemList.tsx:190` | Keep it here but do not publish it |  |
| `ctl.duplicate` | title / tooltip | `PortalItemList.tsx:196` | Duplicate |  |
| `ctl.open-all-settings-for-this-item` | title / tooltip | `PortalItemList.tsx:202` | Open all settings for this item |  |
| `ctl.title` | string | `PortalItemList.tsx:210` | Title |  |
| `ctl.description` | string | `PortalItemList.tsx:218` | Description |  |
| `ctl.read-the-full-article` | placeholder | `PortalItemList.tsx:252` | Read the full article |  |
| `ctl.kept-here-not-shown-on-the-portal` | on-screen text | `PortalItemList.tsx:235` | Kept here, not shown on the portal. |  |
| `ctl.link-text` | on-screen text | `PortalItemList.tsx:248` | Link text |  |
| `ctl.link-address` | on-screen text | `PortalItemList.tsx:255` | Link address |  |

### 17.11 `ContrastMeter`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `ctl.readable-against-what-is-actually-` | string | `PortalContrastMeter.tsx:57` | Readable against what is actually behind it. |  |
| `ctl.4-5-1-is-the-floor-for-body-text-y` | string | `PortalContrastMeter.tsx:58` | 4.5:1 is the floor for body text. You can ship this anyway — but people will struggle to read it. |  |
| `ctl.fix-it` | on-screen text | `PortalContrastMeter.tsx:65` | Fix it |  |
| `ctl.sample-heading` | on-screen text | `PortalContrastMeter.tsx:73` | Sample heading |  |

### 17.12 `AxisIcon`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `ctl.0-0-18-18` | viewBox | `SpacingMatrix.tsx:45` | 0 0 18 18 |  |

### 17.13 `SpacingMatrix`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `ctl.hide-the-individual-sides` | string | `SpacingMatrix.tsx:116` | Hide the individual sides |  |
| `ctl.set-each-side-separately` | string | `SpacingMatrix.tsx:116` | Set each side separately |  |

### 17.14 `(top level)`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `ctl.up-to-maxfiles-files` | message with a value in it | `PortalControls.tsx:717` | up to {maxFiles} files |  |
| `ctl.that-file-is-a-type-this-slot-take` | message with a value in it | `PortalControls.tsx:847` | That file is a {type} — this slot takes {maxMB} |  |
| `ctl.that-file-is-1-mb-the-limit-is-max` | message with a value in it | `PortalControls.tsx:849` | That file is {1}MB — the limit is {maxMB}MB |  |
| `ctl.at-removed` | message with a value in it | `PortalItemList.tsx:112` | “{at}” removed |  |
| `ctl.show-this-tolowercase` | message with a value in it | `PortalItemList.tsx:232` | Show this {toLowerCase} |  |
| `ctl.hide-this-tolowercase-on-the-porta` | message with a value in it | `PortalItemList.tsx:232` | Hide this {toLowerCase} on the portal |  |
| `ctl.this-collection-holds-at-most-max` | message with a value in it | `PortalItemList.tsx:304` | This collection holds at most {max} |  |

## 18. Pickers

*`PortalIconPicker.tsx` · `PortalColorPicker.tsx`* — 24 entries

### 18.1 `ICON_GROUPS`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `pick.requests-tickets` | group | `PortalIconPicker.tsx:37` | Requests & tickets |  |
| `pick.hardware` | group | `PortalIconPicker.tsx:44` | Hardware |  |
| `pick.network-access` | group | `PortalIconPicker.tsx:51` | Network & access |  |
| `pick.software-data` | group | `PortalIconPicker.tsx:58` | Software & data |  |
| `pick.people-places` | group | `PortalIconPicker.tsx:65` | People & places |  |

### 18.2 `IconPopover`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `pick.use-a-png-jpg-or-webp-file` | string | `PortalIconPicker.tsx:116` | Use a PNG, JPG or WebP file |  |
| `pick.image-must-be-under-3-mb` | string | `PortalIconPicker.tsx:117` | Image must be under 3 MB |  |
| `pick.use-an-svg-png-jpg-or-webp-file` | string | `PortalIconPicker.tsx:126` | Use an SVG, PNG, JPG or WebP file |  |
| `pick.icon-must-be-under-512-kb` | string | `PortalIconPicker.tsx:129` | Icon must be under 512 KB |  |
| `pick.search-icons` | placeholder | `PortalIconPicker.tsx:160` | Search icons |  |
| `pick.upload-an-image-for-this-icon-slot` | field label | `PortalIconPicker.tsx:184` | Upload an image for this icon slot |  |
| `pick.replace-image` | on-screen text | `PortalIconPicker.tsx:176` | Replace image |  |
| `pick.fills-the-icon-slot-and-is-cropped` | on-screen text | `PortalIconPicker.tsx:188` | Fills the icon slot and is cropped to it. |  |
| `pick.upload-svg-or-png` | on-screen text | `PortalIconPicker.tsx:233` | Upload SVG or PNG |  |

### 18.3 `IconField`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `pick.image` | string | `PortalIconPicker.tsx:265` | Image |  |
| `pick.icon` | string | `PortalIconPicker.tsx:266` | Icon |  |

### 18.4 `IconOnlyField`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `pick.custom-icon` | string | `PortalIconPicker.tsx:299` | Custom icon |  |
| `pick.choose-an-icon` | string | `PortalIconPicker.tsx:299` | Choose an icon |  |
| `pick.remove-icon` | title / tooltip | `PortalIconPicker.tsx:305` | Remove icon |  |

### 18.5 `Swatch`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `pick.no-colour` | string | `PortalColorPicker.tsx:78` | No colour |  |

### 18.6 `PortalColorPicker`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `pick.auto-8px-8px` | backgroundSize | `PortalColorPicker.tsx:256` | auto, 8px 8px |  |
| `pick.hex` | string | `PortalColorPicker.tsx:275` | Hex |  |
| `pick.done` | on-screen text | `PortalColorPicker.tsx:310` | Done |  |
| `pick.cancel` | on-screen text | `PortalColorPicker.tsx:314` | Cancel |  |

## 19. Table element

*`PortalTable.tsx` · `portalTableModel.ts`* — 70 entries

### 19.1 `TableGridPicker`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `table.choose-row-and-column` | field label | `PortalTable.tsx:77` | Choose row and column |  |
| `table.insert-table` | on-screen text | `PortalTable.tsx:44` | Insert table |  |
| `table.cancel` | on-screen text | `PortalTable.tsx:80` | Cancel |  |

### 19.2 `CELL_COLORS`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `table.gray` | string | `PortalTable.tsx:110` | Gray |  |
| `table.brown` | string | `PortalTable.tsx:110` | Brown |  |
| `table.orange` | string | `PortalTable.tsx:110` | Orange |  |
| `table.yellow` | string | `PortalTable.tsx:111` | Yellow |  |
| `table.green` | string | `PortalTable.tsx:111` | Green |  |
| `table.blue` | string | `PortalTable.tsx:111` | Blue |  |
| `table.purple` | string | `PortalTable.tsx:111` | Purple |  |
| `table.pink` | string | `PortalTable.tsx:112` | Pink |  |
| `table.red` | string | `PortalTable.tsx:112` | Red |  |

### 19.3 `PortalTable`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `table.insert-row-above` | field label | `PortalTable.tsx:573` | Insert row above |  |
| `table.insert-row-below` | field label | `PortalTable.tsx:574` | Insert row below |  |
| `table.move-up` | field label | `PortalTable.tsx:575` | Move up |  |
| `table.already-the-first-row` | string | `PortalTable.tsx:575` | Already the first row |  |
| `table.move-down` | field label | `PortalTable.tsx:576` | Move down |  |
| `table.already-the-last-row` | string | `PortalTable.tsx:576` | Already the last row |  |
| `table.colour` | field label | `PortalTable.tsx:577` | Colour |  |
| `table.alignment` | field label | `PortalTable.tsx:578` | Alignment |  |
| `table.duplicate-row` | field label | `PortalTable.tsx:579` | Duplicate row |  |
| `table.remove-header-row` | string | `PortalTable.tsx:583` | Remove header row |  |
| `table.make-header-row` | string | `PortalTable.tsx:583` | Make header row |  |
| `table.only-the-first-row-can-be-the-head` | null | `PortalTable.tsx:583` | Only the first row can be the header |  |
| `table.clear-contents` | field label | `PortalTable.tsx:584` | Clear contents |  |
| `table.delete-row` | field label | `PortalTable.tsx:585` | Delete row |  |
| `table.split-cell` | field label | `PortalTable.tsx:604` | Split cell |  |
| `table.merge-cells` | field label | `PortalTable.tsx:605` | Merge cells |  |
| `table.toggle-header-cells` | string | `PortalTable.tsx:608` | Toggle header cells |  |
| `table.toggle-header-cell` | string | `PortalTable.tsx:608` | Toggle header cell |  |
| `table.insert-column-left` | field label | `PortalTable.tsx:614` | Insert column left |  |
| `table.insert-column-right` | field label | `PortalTable.tsx:615` | Insert column right |  |
| `table.move-left` | field label | `PortalTable.tsx:616` | Move left |  |
| `table.already-the-first-column` | string | `PortalTable.tsx:616` | Already the first column |  |
| `table.move-right` | field label | `PortalTable.tsx:617` | Move right |  |
| `table.already-the-last-column` | string | `PortalTable.tsx:617` | Already the last column |  |
| `table.sort-column-a-z` | field label | `PortalTable.tsx:619` | Sort column A → Z |  |
| `table.nothing-to-sort-one-row` | string | `PortalTable.tsx:619` | Nothing to sort — one row |  |
| `table.sort-column-z-a` | field label | `PortalTable.tsx:620` | Sort column Z → A |  |
| `table.duplicate-column` | field label | `PortalTable.tsx:623` | Duplicate column |  |
| `table.remove-header-column` | string | `PortalTable.tsx:624` | Remove header column |  |
| `table.make-header-column` | string | `PortalTable.tsx:624` | Make header column |  |
| `table.only-the-first-column-can-be-the-h` | null | `PortalTable.tsx:624` | Only the first column can be the header |  |
| `table.fit-columns-to-width` | field label | `PortalTable.tsx:626` | Fit columns to width |  |
| `table.delete-column` | field label | `PortalTable.tsx:627` | Delete column |  |
| `table.semibold` | string | `PortalTable.tsx:643` | Semibold |  |
| `table.select-the-whole-table` | screen-reader label | `PortalTable.tsx:813` | Select the whole table |  |
| `table.add-a-column` | screen-reader label | `PortalTable.tsx:843` | Add a column |  |
| `table.add-a-column-2` | string | `PortalTable.tsx:844` | Add a column |  |
| `table.add-a-row` | screen-reader label | `PortalTable.tsx:852` | Add a row |  |
| `table.add-a-row-2` | string | `PortalTable.tsx:853` | Add a row |  |
| `table.drag-to-change-cell-padding` | title / tooltip | `PortalTable.tsx:869` | Drag to change cell padding |  |
| `table.cell-options` | screen-reader label | `PortalTable.tsx:909` | Cell options |  |

### 19.4 `ColorFlyout`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `table.text-colour` | on-screen text | `PortalTable.tsx:123` | Text colour |  |
| `table.background` | on-screen text | `PortalTable.tsx:136` | Background |  |

### 19.5 `AlignFlyout`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `table.align-left` | on-screen text | `PortalTable.tsx:159` | Align left |  |
| `table.align-centre` | on-screen text | `PortalTable.tsx:160` | Align centre |  |
| `table.align-right` | on-screen text | `PortalTable.tsx:161` | Align right |  |
| `table.align-top` | on-screen text | `PortalTable.tsx:163` | Align top |  |
| `table.align-middle` | on-screen text | `PortalTable.tsx:164` | Align middle |  |
| `table.align-bottom` | on-screen text | `PortalTable.tsx:165` | Align bottom |  |

### 19.6 `deleteRowBlocked`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `table.a-table-needs-at-least-one-row` | string | `portalTableModel.ts:125` | A table needs at least one row |  |

### 19.7 `deleteColumnBlocked`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `table.a-table-needs-at-least-one-column` | string | `portalTableModel.ts:127` | A table needs at least one column |  |

### 19.8 `mergeBlockedBecause`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `table.merging-down-is-not-supported-yet-` | string | `portalTableModel.ts:367` | Merging down is not supported yet — merge cells across one row |  |
| `table.select-more-than-one-cell-to-merge` | string | `portalTableModel.ts:368` | Select more than one cell to merge |  |
| `table.nothing-selected` | string | `portalTableModel.ts:370` | Nothing selected |  |

### 19.9 `(top level)`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `table.column-1-options` | message with a value in it | `PortalTable.tsx:806` | Column {1} options |  |
| `table.row-1-options` | message with a value in it | `PortalTable.tsx:847` | Row {1} options |  |
| `table.a-table-holds-max-dim-rows-at-most` | message with a value in it | `portalTableModel.ts:121` | A table holds {MAX_DIM} rows at most |  |
| `table.a-table-holds-max-dim-columns-at-m` | message with a value in it | `portalTableModel.ts:123` | A table holds {MAX_DIM} columns at most |  |

## 20. Element renderers on the page

*`PortalCollectionRender.tsx` · `PortalPlacedElement.tsx`* — 84 entries

### 20.1 `ChildBlock`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `render.a-line-of-supporting-copy` | string | `PortalCollectionRender.tsx:206` | A line of supporting copy. |  |

### 20.2 `SliderRender`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `render.learn-more` | string | `PortalCollectionRender.tsx:268` | Learn more |  |
| `render.no-slides-yet-add-one-in-the-panel` | on-screen text | `PortalCollectionRender.tsx:236` | No slides yet — add one in the panel. |  |

### 20.3 `FeedbackRender`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `render.asked-when-the-rating-is-3-or-belo` | string | `PortalCollectionRender.tsx:411` | Asked when the rating is 3 or below |  |
| `render.asked-after-every-rating` | string | `PortalCollectionRender.tsx:411` | Asked after every rating |  |
| `render.yes` | string | `PortalCollectionRender.tsx:431` | Yes |  |
| `render.no` | string | `PortalCollectionRender.tsx:431` | No |  |

### 20.4 `CONTACT_LINES`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `render.email` | field label | `PortalCollectionRender.tsx:458` | Email |  |
| `render.servicedesk-acme-com` | default value | `PortalCollectionRender.tsx:458` | servicedesk@acme.com |  |
| `render.phone` | field label | `PortalCollectionRender.tsx:459` | Phone |  |
| `render.91-79-4040-0000` | default value | `PortalCollectionRender.tsx:459` | +91 79 4040 0000 |  |

### 20.5 `ANNOUNCEMENTS`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `render.planned-network-maintenance-sat-16` | title / tooltip | `PortalCollectionRender.tsx:523` | Planned network maintenance — Sat 16 Aug, 02:00–05:00 |  |
| `render.11-aug-2026` | at | `PortalCollectionRender.tsx:523` | 11 Aug 2026 |  |
| `render.new-vpn-client-rollout-begins-next` | title / tooltip | `PortalCollectionRender.tsx:524` | New VPN client rollout begins next week |  |
| `render.08-aug-2026` | at | `PortalCollectionRender.tsx:524` | 08 Aug 2026 |  |
| `render.service-desk-hours-extended-to-20-` | title / tooltip | `PortalCollectionRender.tsx:525` | Service desk hours extended to 20:00 IST |  |
| `render.04-aug-2026` | at | `PortalCollectionRender.tsx:525` | 04 Aug 2026 |  |
| `render.office-365-licence-renewal-action-` | title / tooltip | `PortalCollectionRender.tsx:526` | Office 365 licence renewal — action needed by 30 Aug |  |
| `render.01-aug-2026` | at | `PortalCollectionRender.tsx:526` | 01 Aug 2026 |  |
| `render.phishing-awareness-training-is-now` | title / tooltip | `PortalCollectionRender.tsx:527` | Phishing awareness training is now mandatory |  |
| `render.28-jul-2026` | at | `PortalCollectionRender.tsx:527` | 28 Jul 2026 |  |

### 20.6 `FAVOURITE_SERVICES`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `render.employee-off-boarding` | name | `PortalCollectionRender.tsx:560` | Employee Off-boarding |  |
| `render.hr` | description | `PortalCollectionRender.tsx:560` | HR |  |
| `render.microsoft-office-2019` | name | `PortalCollectionRender.tsx:561` | Microsoft Office 2019 |  |
| `render.software` | description | `PortalCollectionRender.tsx:561` | Software |  |
| `render.payroll-setup` | name | `PortalCollectionRender.tsx:562` | Payroll Setup |  |
| `render.finance` | description | `PortalCollectionRender.tsx:562` | Finance |  |
| `render.flight-booking` | name | `PortalCollectionRender.tsx:563` | Flight Booking |  |
| `render.travel` | description | `PortalCollectionRender.tsx:563` | Travel |  |

### 20.7 `FEATURED_SERVICES`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `render.new-laptop-request` | name | `PortalCollectionRender.tsx:570` | New Laptop Request |  |
| `render.hardware` | description | `PortalCollectionRender.tsx:570` | Hardware |  |
| `render.software-installation` | name | `PortalCollectionRender.tsx:571` | Software Installation |  |
| `render.vpn-access` | name | `PortalCollectionRender.tsx:572` | VPN Access |  |
| `render.network` | description | `PortalCollectionRender.tsx:572` | Network |  |
| `render.new-employee-onboarding` | name | `PortalCollectionRender.tsx:573` | New Employee Onboarding |  |

### 20.8 `FavouriteServicesRender`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `render.favourite-services` | string | `PortalCollectionRender.tsx:632` | Favourite Services |  |

### 20.9 `FeaturedServicesRender`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `render.browse-catalog` | string | `PortalCollectionRender.tsx:672` | Browse catalog |  |

### 20.10 `ShapeRender`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `render.0-0-100-100` | viewBox | `PortalCollectionRender.tsx:802` | 0 0 100 100 |  |

### 20.11 `TextImageRender`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `render.inherit-from-theme` | string | `PortalCollectionRender.tsx:1032` | Inherit from theme |  |

### 20.12 `LiveCard`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `render.view-all` | string | `PortalCollectionRender.tsx:1091` | View all |  |

### 20.13 `RequestsRender`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `render.my-open-requests` | title / tooltip | `PortalCollectionRender.tsx:1111` | My Open Requests |  |

### 20.14 `ApprovalsRender`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `render.pending-approvals` | title / tooltip | `PortalCollectionRender.tsx:1136` | Pending Approvals |  |

### 20.15 `KnowledgeRender`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `render.most-read` | title / tooltip | `PortalCollectionRender.tsx:1151` | Most Read |  |

### 20.16 `PLACED_ASSETS`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `render.ast-3` | id | `PortalCollectionRender.tsx:1166` | AST-3 |  |
| `render.dell-latitude-5440` | name | `PortalCollectionRender.tsx:1166` | Dell Latitude 5440 |  |
| `render.laptop` | type | `PortalCollectionRender.tsx:1166` | Laptop |  |
| `render.ast-1` | id | `PortalCollectionRender.tsx:1167` | AST-1 |  |
| `render.dell-ultrasharp-u2723qe` | name | `PortalCollectionRender.tsx:1167` | Dell UltraSharp U2723QE |  |
| `render.monitor` | type | `PortalCollectionRender.tsx:1167` | Monitor |  |
| `render.ast-7` | id | `PortalCollectionRender.tsx:1168` | AST-7 |  |
| `render.logitech-mx-master-3s` | name | `PortalCollectionRender.tsx:1168` | Logitech MX Master 3S |  |
| `render.mouse` | type | `PortalCollectionRender.tsx:1168` | Mouse |  |
| `render.ast-12` | id | `PortalCollectionRender.tsx:1169` | AST-12 |  |
| `render.jabra-evolve2-65` | name | `PortalCollectionRender.tsx:1169` | Jabra Evolve2 65 |  |
| `render.headset` | type | `PortalCollectionRender.tsx:1169` | Headset |  |
| `render.ast-9` | id | `PortalCollectionRender.tsx:1170` | AST-9 |  |
| `render.iphone-14` | name | `PortalCollectionRender.tsx:1170` | iPhone 14 |  |
| `render.mobile` | type | `PortalCollectionRender.tsx:1170` | Mobile |  |

### 20.17 `AssetsRender`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `render.my-assets` | title / tooltip | `PortalCollectionRender.tsx:1176` | My Assets |  |

### 20.18 `CisRender`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `render.my-cis` | title / tooltip | `PortalCollectionRender.tsx:1192` | My CIs |  |
| `render.no-data-found` | on-screen text | `PortalCollectionRender.tsx:1193` | No Data Found |  |

### 20.19 `FaqRender`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `render.no-questions-yet-add-one-in-the-pa` | on-screen text | `PortalCollectionRender.tsx:79` | No questions yet — add one in the panel. |  |

### 20.20 `GalleryRender`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `render.no-photos-yet-add-one-or-drop-seve` | on-screen text | `PortalCollectionRender.tsx:328` | No photos yet — add one, or drop several at a time. |  |

### 20.21 `specDrivenBody`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `render.inherit-from-theme-2` | string | `PortalPlacedElement.tsx:134` | Inherit from theme |  |
| `render.click-to-change-this-icon` | string | `PortalPlacedElement.tsx:243` | Click to change this icon |  |
| `render.action-card` | string | `PortalPlacedElement.tsx:251` | Action card |  |
| `render.add-a-subtext` | string | `PortalPlacedElement.tsx:254` | Add a subtext |  |
| `render.video` | title / tooltip | `PortalPlacedElement.tsx:353` | Video |  |
| `render.accelerometer-clipboard-write-encr` | allow | `PortalPlacedElement.tsx:354` | accelerometer; clipboard-write; encrypted-media; picture-in-picture |  |
| `render.open-requests` | string | `PortalPlacedElement.tsx:441` | Open requests |  |

### 20.22 `PlacedBody`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `render.data` | string | `PortalPlacedElement.tsx:483` | Data |  |
| `render.custom` | string | `PortalPlacedElement.tsx:483` | Custom |  |
| `render.link-one` | string | `PortalPlacedElement.tsx:577` | Link one |  |
| `render.link-two` | string | `PortalPlacedElement.tsx:577` | Link two |  |
| `render.link-three` | string | `PortalPlacedElement.tsx:577` | Link three |  |
| `render.your-text-goes-here-select-it-to-e` | on-screen text | `PortalPlacedElement.tsx:514` | Your text goes here. Select it to edit the content. |  |
| `render.large-title` | on-screen text | `PortalPlacedElement.tsx:516` | Large title |  |
| `render.small-title` | on-screen text | `PortalPlacedElement.tsx:518` | Small title |  |
| `render.choose-a-video-in-the-panel` | on-screen text | `PortalPlacedElement.tsx:536` | Choose a video in the panel |  |
| `render.search` | on-screen text | `PortalPlacedElement.tsx:558` | Search… |  |
| `render.list-item` | on-screen text | `PortalPlacedElement.tsx:568` | List item |  |
| `render.metric` | on-screen text | `PortalPlacedElement.tsx:585` | Metric |  |
| `render.no-data-configured` | on-screen text | `PortalPlacedElement.tsx:615` | No data configured |  |

### 20.23 `ImageDropSlot`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `render.upload-an-image-for-this-element` | field label | `PortalPlacedElement.tsx:644` | Upload an image for this element |  |

## 21. Legacy element panel

*`PortalElementPanel.tsx`* — 40 entries

### 21.1 `DRAWERS`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `legacy.layout` | string | `PortalElementPanel.tsx:76` | Layout |  |
| `legacy.style` | string | `PortalElementPanel.tsx:76` | Style |  |
| `legacy.spacing` | string | `PortalElementPanel.tsx:76` | Spacing |  |

### 21.2 `PortalElementPanel`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `legacy.heading` | field label | `PortalElementPanel.tsx:127` | Heading |  |
| `legacy.subtitle` | field label | `PortalElementPanel.tsx:131` | Subtitle |  |
| `legacy.search-placeholder` | field label | `PortalElementPanel.tsx:135` | Search placeholder |  |
| `legacy.show-search-field` | field label | `PortalElementPanel.tsx:140` | Show search field |  |
| `legacy.placeholder` | field label | `PortalElementPanel.tsx:148` | Placeholder |  |
| `legacy.statuses` | field label | `PortalElementPanel.tsx:174` | Statuses |  |
| `legacy.scope` | field label | `PortalElementPanel.tsx:187` | Scope |  |
| `legacy.show` | field label | `PortalElementPanel.tsx:193` | Show |  |
| `legacy.title` | field label | `PortalElementPanel.tsx:206` | Title |  |
| `legacy.cards` | field label | `PortalElementPanel.tsx:249` | Cards |  |
| `legacy.icon` | field label | `PortalElementPanel.tsx:276` | Icon |  |
| `legacy.untitled` | placeholder | `PortalElementPanel.tsx:281` | Untitled |  |
| `legacy.description` | field label | `PortalElementPanel.tsx:284` | Description |  |
| `legacy.add-a-description` | placeholder | `PortalElementPanel.tsx:285` | Add a description |  |
| `legacy.reset-this-element-to-default` | title / tooltip | `PortalElementPanel.tsx:340` | Reset this element to default |  |
| `legacy.collapse-all` | string | `PortalElementPanel.tsx:358` | Collapse all |  |
| `legacy.expand-all` | string | `PortalElementPanel.tsx:358` | Expand all |  |
| `legacy.style-2` | title / tooltip | `PortalElementPanel.tsx:373` | Style |  |
| `legacy.background-colour` | string | `PortalElementPanel.tsx:376` | Background colour |  |
| `legacy.colour` | string | `PortalElementPanel.tsx:376` | Colour |  |
| `legacy.spacing-2` | title / tooltip | `PortalElementPanel.tsx:391` | Spacing |  |
| `legacy.this-text-is-set-by-the-block-it-b` | on-screen text | `PortalElementPanel.tsx:156` | This text is set by the block it belongs to. |  |
| `legacy.this-row-spans-the-full-page-width` | on-screen text | `PortalElementPanel.tsx:236` | This row spans the full page width. Select a card inside it to edit that card. |  |
| `legacy.select-a-card-to-edit-its-title-an` | on-screen text | `PortalElementPanel.tsx:262` | Select a card to edit its title and description. |  |
| `legacy.this-element-was-just-placed-so-it` | on-screen text | `PortalElementPanel.tsx:288` | This element was just placed, so it has no data or styling yet — both are yours to set. |  |
| `legacy.this-element-has-no-content-of-its` | on-screen text | `PortalElementPanel.tsx:310` | This element has no content of its own — style it below. |  |
| `legacy.content` | on-screen text | `PortalElementPanel.tsx:348` | Content |  |
| `legacy.style-3` | on-screen text | `PortalElementPanel.tsx:360` | Style |  |

### 21.3 `ColumnsField`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `legacy.layout-2` | field label | `PortalElementPanel.tsx:403` | Layout |  |

### 21.4 `RadiusControl`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `legacy.all-corners` | string | `PortalElementPanel.tsx:448` | All corners |  |
| `legacy.per-corner` | string | `PortalElementPanel.tsx:448` | Per corner |  |
| `legacy.corner-radius` | screen-reader label | `PortalElementPanel.tsx:475` | Corner radius |  |
| `legacy.corner-radius-2` | on-screen text | `PortalElementPanel.tsx:444` | Corner radius |  |

### 21.5 `BorderControl`

| ID | What it is | File | Current text | New text |
|---|---|---|---|---|
| `legacy.border-width` | screen-reader label | `PortalElementPanel.tsx:494` | Border width |  |
| `legacy.border-style` | screen-reader label | `PortalElementPanel.tsx:499` | Border style |  |
| `legacy.border` | on-screen text | `PortalElementPanel.tsx:491` | Border |  |
| `legacy.width-0-no-border-is-drawn` | on-screen text | `PortalElementPanel.tsx:510` | Width 0 — no border is drawn. |  |

---

**2059 entries** across 21 areas.

### What is deliberately not in here

- **Code comments.** They explain the build to whoever maintains it and never reach a screen.
- **Class names, colour values and CSS.** Not language, and changing them here would change the design rather than the copy.
- **Icon names and config keys** (`showDesc`, `quick-incident`). These are the addresses the app uses internally; the words a requester reads are all listed above.

