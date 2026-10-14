/* Knowledge-base content. Each article carries its own blocks AND its own AI summary, written to
 * match that article's subject so the summary reads like something generated from the text below
 * it rather than a template with the title dropped in. Kept out of KnowledgeArticleContent.tsx so
 * the renderer stays a renderer. */

export interface Block {
  /** p = paragraph · h = section heading · steps = ordered list · bullets = unordered list ·
   *  note = tinted callout · code = command block · table = two-column reference ·
   *  image = captioned screenshot (click to zoom) · video = captioned player */
  kind: 'p' | 'h' | 'steps' | 'bullets' | 'note' | 'warn' | 'code' | 'table' | 'image' | 'video';
  text?: string;
  items?: string[];
  rows?: [string, string][];
  /** image/video: caption under the figure */
  caption?: string;
  /** video: runtime badge, e.g. "2:14" */
  duration?: string;
  /** image/video: which inline mock to draw (no real assets in this prototype) */
  art?: 'client' | 'portal';
  /** video: real YouTube id. Swap this for the product's own video — everything else follows. */
  youtubeId?: string;
}

export interface KbArticle {
  /** One or two paragraphs a reader can act on WITHOUT opening the article. */
  summary: string[];
  blocks: Block[];
}

const HELP_CLOSER = 'If the steps above do not resolve it, raise a ticket with the service desk and include the exact error message, what you were doing at the time, and the time it happened. A screenshot usually removes a whole round trip of questions.';

export const KB_ARTICLES: Record<string, KbArticle> = {
  'KB-1': {
    summary: [
      'Remote access runs through the Company VPN client, installed from the Software Portal without an approval step. First-time setup is server address, company credentials, then an MFA approval on your phone; after that the client remembers everything and daily use is launch, connect, approve. Sessions expire after twelve hours or when the laptop sleeps for a long stretch, so reconnecting each morning is normal rather than a fault.',
      'Most failures come down to four things: a captive portal on hotel or café Wi-Fi that has to be accepted in a browser first, a device clock more than five minutes out which breaks certificate validation, a stale virtual adapter that clears with a restart, or an expired device certificate. Only the last one needs the service desk — a certificate error must never be bypassed.',
    ],
    blocks: [
      { kind: 'p', text: 'This article explains how to connect to the company VPN from a remote location so you can reach internal resources — file shares, line-of-business applications and the intranet — exactly as you would from the office. It covers first-time setup, day-to-day connection, and the issues our service desk sees most often.' },
      { kind: 'video', duration: '10:34', caption: 'Watch the full setup — installing the client, signing in, and approving the authentication prompt.' },
      { kind: 'h', text: 'Before you begin' },
      { kind: 'bullets', items: [
        'A company-managed laptop with the corporate device certificate installed.',
        'Your company email address and password.',
        'Multi-factor authentication enrolled on your phone (see "Setting Up Multi-Factor Authentication").',
        'A stable internet connection — a hotel or café network is fine, but avoid captive portals that block VPN traffic.',
      ] },
      { kind: 'h', text: 'Installing the VPN client' },
      { kind: 'steps', items: [
        'Open the Software Portal from your desktop shortcut, or browse to the Package Management section of the service portal.',
        'Search for "VPN Client" and click Install. The package is approved for all employees, so no additional approval is required.',
        'Wait for the installation to finish — it usually takes under two minutes. The client appears in your Start menu as "Company VPN".',
        'Restart your machine if prompted. The virtual network adapter is only registered after a restart.',
      ] },
      { kind: 'h', text: 'Connecting for the first time' },
      { kind: 'steps', items: [
        'Launch the Company VPN client from the Start menu.',
        'Enter the server address: vpn.company.com',
        'Sign in with your company email address and password.',
        'Approve the multi-factor authentication prompt on your phone.',
        'Wait for the status to change to Connected. The tray icon turns green.',
      ] },
      { kind: 'image', art: 'client', caption: 'Figure 1 — the VPN client after a successful connection. The status pill turns green and the tray icon follows.' },
      { kind: 'note', text: 'Once connected you have secure access to internal resources including file shares, internal applications and the intranet. Your internet browsing continues to use your local connection, so streaming and video calls are not slowed down by the tunnel.' },
      { kind: 'h', text: 'Reconnecting day to day' },
      { kind: 'p', text: 'After the first successful sign-in the client remembers the server address and your username. On subsequent days you only need to launch the client, click Connect, and approve the authentication prompt. Sessions expire after twelve hours or when the laptop sleeps for an extended period, so reconnecting each morning is normal and expected.' },
      { kind: 'h', text: 'Troubleshooting' },
      { kind: 'p', text: 'If the connection fails, work through these checks in order before raising a ticket. The majority of VPN issues are resolved by one of the first three.' },
      { kind: 'steps', items: [
        'Verify your internet connection is stable — open any public website in a browser.',
        'Confirm the VPN client is updated to the latest version from the Software Portal.',
        'Restart the client completely. Right-click the tray icon and choose Exit, then relaunch it.',
        'If you are on a hotel or public network, open a browser first and accept the network terms page, then retry.',
        'Check that your device clock is correct. A clock more than five minutes out will cause certificate validation to fail.',
        'Restart your machine. This clears a stale virtual adapter, which is the most common cause of a connection that hangs at "Connecting…".',
      ] },
      { kind: 'warn', text: 'If you see "Certificate validation failed", do not attempt to bypass the warning. Raise a ticket with the service desk — your device certificate may have expired and needs to be reissued.' },
      { kind: 'h', text: 'Common error messages' },
      { kind: 'table', rows: [
        ['Authentication failed', 'Your password has expired or was recently changed. Sign in to the portal to reset it, then retry.'],
        ['Server unreachable', 'The client cannot resolve vpn.company.com. Check your internet connection or switch networks.'],
        ['Certificate validation failed', 'The device certificate has expired. Raise a ticket — this cannot be fixed locally.'],
        ['Session timed out', 'Your twelve-hour session expired. Simply reconnect.'],
        ['Already connected', 'A previous session did not close cleanly. Exit the client from the tray and relaunch.'],
      ] },
      { kind: 'h', text: 'Checking your connection' },
      { kind: 'p', text: 'To confirm you are routed through the tunnel, open a command prompt and run the following. The address returned should be inside the corporate range.' },
      { kind: 'code', text: 'ipconfig /all | findstr "Company VPN"' },
      { kind: 'h', text: 'Getting further help' },
      { kind: 'p', text: HELP_CLOSER },
    ],
  },

  'KB-2': {
    summary: [
      'Active Directory locks an account after five failed sign-ins within fifteen minutes, and the lock clears by itself after thirty minutes. In most cases the password was never wrong — a phone still syncing mail with the old password, a mapped drive holding stale credentials, or a second machine left signed in will keep retrying in the background and re-lock the account moments after it is released. The fix is to find the source before unlocking, not after.',
      'Self-service unlock is available from the portal if you can still complete MFA, and takes effect in about five minutes once replication catches up. If you have genuinely forgotten the password, unlocking will not help and you need a reset instead. Repeated locks with no obvious source should go to the service desk, who can read the lockout event log and name the device responsible.',
    ],
    blocks: [
      { kind: 'p', text: 'Your Active Directory account locks automatically after five failed sign-in attempts within fifteen minutes. This protects the account from password-guessing attacks, but it also catches people out after a password change. This article explains why accounts lock, how to unlock yours, and how to stop it happening again the same afternoon.' },
      { kind: 'h', text: 'Why accounts lock' },
      { kind: 'p', text: 'The lock is rarely caused by mistyping at the sign-in screen. Far more often something else is presenting an old password on your behalf, over and over, until the threshold is reached. Work through the list below before unlocking — if you unlock without finding the source, the account will lock again within minutes.' },
      { kind: 'bullets', items: [
        'A phone or tablet still syncing company mail with the previous password.',
        'A mapped network drive or shared printer holding cached credentials.',
        'A second computer left signed in and locked at another desk.',
        'A scheduled task or script running under your account with a hard-coded password.',
        'A browser or password manager auto-filling an old entry.',
      ] },
      { kind: 'h', text: 'Unlocking your account' },
      { kind: 'steps', items: [
        'Open the service portal from any device — a phone browser is fine.',
        'Choose Account Help, then Unlock My Account.',
        'Confirm your identity by approving the multi-factor authentication prompt.',
        'Wait for the confirmation message, then allow about five minutes for the change to replicate to all domain controllers.',
        'Sign in again on your computer, then immediately update the saved password on your phone and any mapped drives.',
      ] },
      { kind: 'image', art: 'portal', caption: 'Figure 1 — Account Help in the service portal. Unlock and Reset are separate actions; pick the one that matches your situation.' },
      { kind: 'note', text: 'A locked account unlocks on its own after thirty minutes. If you are not in a hurry, and you have already dealt with whatever was retrying the old password, waiting is a perfectly good option.' },
      { kind: 'warn', text: 'Unlocking is not the same as resetting. If you have forgotten your password, unlocking will let the account retry and lock straight away — use "How to Reset Your Password" instead.' },
      { kind: 'h', text: 'If it keeps locking' },
      { kind: 'p', text: 'When an account locks repeatedly and none of the usual culprits apply, the service desk can read the lockout event on the domain controller and tell you the exact device name that submitted the bad password. That is almost always faster than guessing.' },
      { kind: 'h', text: 'Getting further help' },
      { kind: 'p', text: 'Raise a ticket and include the approximate times you were locked out and a list of every device signed in to your account. If you are locked out with a deadline in front of you, call the service desk rather than waiting on the ticket.' },
    ],
  },

  'KB-3': {
    summary: [
      'The support portal is the single front door for IT: raising requests, tracking what you have already raised, browsing the knowledge base, and finding the service catalogue. The left-hand menu is the whole of the navigation — Home for announcements and your open items, Service Catalogue for anything you want provisioned, My Requests for status, and Knowledge for self-help.',
      'The distinction that saves the most time is Incident versus Service Request: report something broken as an incident, ask for something new as a service request. Choosing the wrong one sends the ticket to the wrong queue and adds a day. Every submission returns a reference number, and that number is what the service desk will ask for on any follow-up.',
    ],
    blocks: [
      { kind: 'p', text: 'The support portal is where you raise anything you need from IT, track what you have already raised, and search the knowledge base before raising anything at all. This article walks through the areas you will use most and the one choice people most often get wrong.' },
      { kind: 'h', text: 'Signing in' },
      { kind: 'p', text: 'The portal uses your company account, so on a company-managed device you are usually signed in already. From a personal device you will be asked for your email address, password and a multi-factor approval.' },
      { kind: 'image', art: 'portal', caption: 'Figure 1 — the portal home. The left-hand menu is where each section lives.' },
      { kind: 'h', text: 'What each section does' },
      { kind: 'table', rows: [
        ['Home', 'Announcements, planned maintenance, and a summary of your open items.'],
        ['Service Catalogue', 'Anything you want provisioned — hardware, software, access, a new starter.'],
        ['My Requests', 'Everything you have raised, with current status and the full conversation.'],
        ['Knowledge', 'Self-help articles. Worth searching before you raise anything.'],
        ['Approvals', 'Items waiting on your decision, if you approve for your team.'],
      ] },
      { kind: 'h', text: 'Incident or service request?' },
      { kind: 'p', text: 'This is the choice that most affects how quickly you are helped. Raise an incident when something that used to work has stopped working — a broken laptop, an application throwing errors, no network. Raise a service request when you want something you do not have yet — new software, additional access, a replacement monitor. The two go to different queues with different targets, so a misfiled ticket typically loses a day being reassigned.' },
      { kind: 'h', text: 'Raising a request' },
      { kind: 'steps', items: [
        'Search the knowledge base first — a good number of requests are answered by an existing article.',
        'Choose Service Catalogue or Report an Incident depending on what you need.',
        'Complete the form, taking care with the department and location fields, which drive routing.',
        'Attach a screenshot if there is an error message. It is the single most useful thing you can add.',
        'Submit, then keep the reference number from the confirmation.',
      ] },
      { kind: 'note', text: 'Requests raised outside business hours are picked up on the next working day unless marked urgent. If an issue is stopping you working right now, call the service desk rather than waiting on the ticket.' },
      { kind: 'h', text: 'Getting further help' },
      { kind: 'p', text: HELP_CLOSER },
    ],
  },

  'KB-4': {
    summary: [
      'Password resets are self-service through the portal and take about five minutes to take effect. You will need a working second factor — the portal verifies you with an MFA approval before letting you set a new password, which must be at least twelve characters and cannot reuse any of your last five. If your phone is lost or replaced, self-service will not work and the service desk has to reset it manually against photo ID.',
      'The step people skip is updating everything that stored the old password: mail on your phone, mapped network drives, and any second machine left signed in. Those keep presenting the previous password in the background and will lock the account within minutes of the reset. Update them straight after changing the password, before you do anything else.',
    ],
    blocks: [
      { kind: 'p', text: 'You can reset your company password yourself from the service portal without contacting anyone. This article covers what you need before you start, the reset itself, and the follow-up step that stops your account locking immediately afterwards.' },
      { kind: 'h', text: 'Before you begin' },
      { kind: 'bullets', items: [
        'Access to the phone enrolled for multi-factor authentication — the portal will not reset a password without it.',
        'A device with a browser. Your own phone is fine; you do not need to be at your desk.',
        'A few minutes afterwards to update saved passwords on your other devices.',
      ] },
      { kind: 'h', text: 'Password requirements' },
      { kind: 'bullets', items: [
        'At least twelve characters.',
        'A mix of upper and lower case, with at least one number or symbol.',
        'Not one of your previous five passwords.',
        'No part of your name or username.',
      ] },
      { kind: 'h', text: 'Resetting your password' },
      { kind: 'steps', items: [
        'Open the service portal and choose Account Help, then Reset My Password.',
        'Enter your company email address.',
        'Approve the multi-factor authentication prompt on your phone.',
        'Enter a new password twice, following the requirements above.',
        'Wait about five minutes for the change to replicate before signing in elsewhere.',
      ] },
      { kind: 'image', art: 'portal', caption: 'Figure 1 — Account Help in the service portal. Reset changes the password; Unlock only releases a locked account.' },
      { kind: 'warn', text: 'Immediately after resetting, update the saved password on your phone mail app, any mapped network drives, and any second computer you are signed in to. These keep offering the old password in the background and will lock your account within minutes if left alone.' },
      { kind: 'h', text: 'If you cannot complete the reset' },
      { kind: 'table', rows: [
        ['No MFA prompt arrives', 'Check your phone has signal and the authenticator app is up to date. Re-send from the portal.'],
        ['Phone lost or replaced', 'Self-service cannot verify you. Contact the service desk — a manual reset needs photo ID.'],
        ['"Password does not meet requirements"', 'Usually the history rule. Choose something you have not used before.'],
        ['New password rejected at sign-in', 'Replication has not finished. Wait five minutes and try again.'],
      ] },
      { kind: 'h', text: 'Getting further help' },
      { kind: 'p', text: HELP_CLOSER },
    ],
  },

  'KB-5': {
    summary: [
      'Hardware for a new joiner is ordered through the service catalogue and needs the start date, department and a manager approval before anything is procured. Standard bundles — laptop, dock, monitor, headset, and a phone where the role calls for it — ship from stock in about three working days. Anything outside the standard build is a non-standard request that needs a business justification and an additional budget-holder approval, which typically adds a week.',
      'The single biggest cause of a new starter arriving without a machine is a late request. Raise it at least ten working days before the start date: procurement, imaging and asset registration all have to happen in sequence, and imaging alone takes a full day. The request also creates the account and access tasks, so raising it late delays far more than the laptop.',
    ],
    blocks: [
      { kind: 'p', text: 'This article covers requesting equipment for someone joining your team, so their machine is imaged, registered and waiting on their first morning. It explains what is in the standard bundle, when to raise the request, and what happens if you need something outside the standard build.' },
      { kind: 'h', text: 'Before you begin' },
      { kind: 'bullets', items: [
        'The joiner\'s full name, start date, department and office location.',
        'Their role, which determines the standard bundle they qualify for.',
        'Your cost centre — the request cannot be approved without it.',
        'Manager approval rights, or the name of the approver if you are raising it on someone else\'s behalf.',
      ] },
      { kind: 'warn', text: 'Raise the request at least ten working days before the start date. Procurement, imaging and asset registration run in sequence, and imaging alone takes a full working day. Late requests are the most common reason a new starter has no machine on day one.' },
      { kind: 'h', text: 'What the standard bundle includes' },
      { kind: 'table', rows: [
        ['Standard (office)', 'Laptop, docking station, 24" monitor, keyboard, mouse, headset.'],
        ['Standard (field)', 'Laptop, headset, mobile phone with data plan.'],
        ['Engineering', 'Higher-specification laptop, dual monitors, dock, headset.'],
        ['Non-standard', 'Anything else. Needs a business justification and budget-holder approval.'],
      ] },
      { kind: 'h', text: 'Raising the request' },
      { kind: 'steps', items: [
        'Open the Service Catalogue and choose New Joiner Equipment.',
        'Enter the joiner\'s details and start date, then select the bundle matching their role.',
        'Add any extras separately — a second monitor or a specific peripheral is a line item, not a note.',
        'Select your cost centre and submit for manager approval.',
        'Keep the reference number. Asset tags are attached to it once the equipment is allocated.',
      ] },
      { kind: 'image', art: 'portal', caption: 'Figure 1 — the New Joiner Equipment form. Bundle selection drives everything that follows.' },
      { kind: 'note', text: 'The same request creates the account, mailbox and access tasks for the new starter, so it does considerably more than order a laptop. Raising it early gives every one of those tasks room to complete.' },
      { kind: 'h', text: 'Tracking the order' },
      { kind: 'p', text: 'Follow progress under My Requests. The request moves through Approval, Procurement, Imaging and Ready for Collection. You will be notified at Ready for Collection with the desk or locker where the equipment is waiting.' },
      { kind: 'h', text: 'Getting further help' },
      { kind: 'p', text: HELP_CLOSER },
    ],
  },

  'KB-6': {
    summary: [
      'Multi-factor authentication is mandatory on every company account and is enrolled once, from the portal, using the Microsoft Authenticator app on your phone. Enrolment is a QR-code scan followed by a test approval, and takes about five minutes. Once enrolled, sign-ins from a new device or location prompt for an approval; trusted office machines will usually not prompt at all.',
      'Register a second method during enrolment — a backup phone number or the printed recovery codes. Almost every MFA support ticket is someone who enrolled a single method and then changed phone, at which point the only route back is a manual identity check with the service desk against photo ID. Approving a prompt you did not trigger is treated as a security incident and should be reported immediately.',
    ],
    blocks: [
      { kind: 'p', text: 'Multi-factor authentication adds a second check to your sign-in, so a stolen password on its own is not enough to reach your account. It is required on all company accounts. This article covers enrolling, day-to-day use, and what to do when you change phone.' },
      { kind: 'h', text: 'Before you begin' },
      { kind: 'bullets', items: [
        'A smartphone you have with you day to day.',
        'The Microsoft Authenticator app, free from the App Store or Google Play.',
        'Your company email address and current password.',
      ] },
      { kind: 'h', text: 'Enrolling' },
      { kind: 'steps', items: [
        'Install Microsoft Authenticator on your phone and open it.',
        'On your computer, open the service portal and choose Account Help, then Set Up Multi-Factor Authentication.',
        'Choose Add Account in the app, select Work or School Account, and scan the QR code shown on screen.',
        'Approve the test prompt that appears on your phone.',
        'Add a backup method — a mobile number, or download the ten single-use recovery codes and store them somewhere safe.',
      ] },
      { kind: 'video', duration: '4:12', caption: 'Enrolment start to finish — scanning the code, approving the test prompt, and saving recovery codes.' },
      { kind: 'warn', text: 'Do not skip the backup method. If you change phone with only one method registered, nobody can restore access remotely and you will need a manual identity check with the service desk, in person, with photo ID.' },
      { kind: 'h', text: 'Day to day' },
      { kind: 'p', text: 'You will be prompted when signing in from a new device, a new location, or after your session expires. Office machines you use regularly are trusted and will usually not prompt. Approvals show the app and the approximate location of the sign-in — check both before approving.' },
      { kind: 'note', text: 'If a prompt arrives when you are not signing in, choose Deny and report it to the service desk straight away. It means someone has your password.' },
      { kind: 'h', text: 'Changing your phone' },
      { kind: 'steps', items: [
        'Before wiping the old phone, open the portal and remove the old device from your registered methods.',
        'Install Authenticator on the new phone.',
        'Re-enrol using the steps above, then add the backup method again.',
      ] },
      { kind: 'h', text: 'Getting further help' },
      { kind: 'p', text: HELP_CLOSER },
    ],
  },

  'KB-7': {
    summary: [
      'A repeating Outlook credential prompt almost always means the cached token no longer matches the account — usually after a password change, but it also follows a mailbox migration or a machine that has been offline for weeks. Clearing the stored entries from Windows Credential Manager and signing in once fixes the large majority of cases, and takes about two minutes.',
      'If the prompt returns immediately after clearing, the cause is usually an old Outlook profile rather than the credentials themselves, and rebuilding the profile resolves it. Cancelling the prompt repeatedly is the one thing to avoid — each cancelled attempt counts as a failed sign-in and five within fifteen minutes will lock the account.',
    ],
    blocks: [
      { kind: 'p', text: 'Outlook prompting for your password over and over, and not accepting it, is one of the most common issues the service desk sees. This article explains why it happens and the order to work through the fixes.' },
      { kind: 'h', text: 'Why it happens' },
      { kind: 'bullets', items: [
        'Your password changed recently and Windows is still offering the old one.',
        'Your mailbox was moved to a different server during maintenance.',
        'The machine has been offline long enough for its cached token to expire.',
        'The Outlook profile itself has become corrupt.',
      ] },
      { kind: 'warn', text: 'Do not keep cancelling and re-entering at the prompt. Each rejected attempt counts as a failed sign-in, and five within fifteen minutes will lock your account — turning a small problem into a bigger one.' },
      { kind: 'h', text: 'Clear the saved credentials' },
      { kind: 'steps', items: [
        'Close Outlook completely.',
        'Open Control Panel, then Credential Manager, then Windows Credentials.',
        'Delete every entry beginning MicrosoftOffice or MS.Outlook.',
        'Reopen Outlook and sign in with your current password when prompted.',
        'Tick "Remember my credentials" so the new token is cached.',
      ] },
      { kind: 'image', art: 'client', caption: 'Figure 1 — Windows Credential Manager. Remove the Office and Outlook entries, not the whole list.' },
      { kind: 'h', text: 'If the prompt comes straight back' },
      { kind: 'p', text: 'That points at the Outlook profile rather than the stored password. Rebuilding it keeps your mail — everything is re-downloaded from the server — but it does take a few minutes to sync.' },
      { kind: 'steps', items: [
        'Close Outlook. Open Control Panel, then Mail, then Show Profiles.',
        'Choose Add, give the new profile a name, and let it detect your account automatically.',
        'Set the new profile as the default and start Outlook.',
        'Allow the mailbox to finish downloading before judging whether it is fixed.',
      ] },
      { kind: 'note', text: 'On a phone, the equivalent fix is removing the mail account and adding it again. Nothing is lost — mobile mail is a view of the server, not a copy.' },
      { kind: 'h', text: 'Getting further help' },
      { kind: 'p', text: HELP_CLOSER },
    ],
  },

  'KB-8': {
    summary: [
      'When an office printer stops responding, the cause is usually one of three things: the print queue has stalled behind a failed job, the machine is pointed at a printer that has been replaced, or the printer is genuinely offline. Clearing the queue and re-adding the printer by its network name resolves most cases without any help, and takes a few minutes.',
      'Before doing anything on your own machine, check whether a colleague nearby can print. If nobody can, it is the printer or the print server and there is nothing to fix on your laptop — raise a ticket with the printer\'s name and location from the label on the front, which is what the service desk needs to identify it.',
    ],
    blocks: [
      { kind: 'p', text: 'This article covers a printer on the office network that has stopped responding — jobs sitting in the queue, or the printer showing as offline. It works from the quickest checks to the ones that take longer.' },
      { kind: 'h', text: 'Check the scope first' },
      { kind: 'p', text: 'Ask someone nearby to send a test page to the same printer. If they cannot print either, the problem is the printer or the print server and nothing on your machine will fix it — skip to raising a ticket. If only you are affected, continue below.' },
      { kind: 'h', text: 'Check the printer itself' },
      { kind: 'bullets', items: [
        'The display shows Ready rather than an error, a paper jam or an empty tray.',
        'The network cable is seated, or the Wi-Fi indicator is lit.',
        'The name on the label matches the printer you are sending to — printers are often replaced without the name changing on old machines.',
      ] },
      { kind: 'h', text: 'Clear the print queue' },
      { kind: 'steps', items: [
        'Open Settings, then Bluetooth & devices, then Printers & scanners.',
        'Select the printer and choose Open print queue.',
        'Cancel every document in the list, including any showing Error or Deleting.',
        'If a job will not cancel, restart the machine — that releases it.',
        'Send a single test page.',
      ] },
      { kind: 'note', text: 'A single failed job blocks everything behind it. If several people report the same printer stuck at once, a stalled job at the front of the queue is the usual reason.' },
      { kind: 'h', text: 'Re-add the printer' },
      { kind: 'steps', items: [
        'In Printers & scanners, remove the printer.',
        'Choose Add device, then "The printer that I want isn\'t listed".',
        'Select "Select a shared printer by name" and enter the path shown on the printer\'s label.',
        'Allow the driver to install, then print a test page.',
      ] },
      { kind: 'image', art: 'client', caption: 'Figure 1 — adding a printer by its network path. The path is printed on the label on the front of the device.' },
      { kind: 'h', text: 'Getting further help' },
      { kind: 'p', text: 'Raise a ticket with the printer name and floor location from its label, whether colleagues can print, and any error shown on the display. Without the printer name the service desk cannot tell which of several dozen devices you mean.' },
    ],
  },

  'KB-9': {
    summary: [
      'Company devices are provided for work and remain company property. Incidental personal use — a personal email, a lunchtime browse — is accepted, provided it does not interfere with work, consume significant bandwidth, or introduce risk. Installing unapproved software, disabling security tooling, and connecting personal storage devices are all prohibited outright.',
      'Devices are monitored for security purposes: patch level, installed software and network destinations are logged, and the company may inspect a device where there is reasonable cause. Losing a device must be reported within twenty-four hours so it can be wiped remotely. Breaches are handled under the disciplinary policy, and serious breaches — sharing credentials, moving company data to personal storage — can be treated as gross misconduct.',
    ],
    blocks: [
      { kind: 'p', text: 'This standard sets out how company laptops, phones and tablets may be used. It applies to every employee and contractor issued with a company device, and forms part of your terms of employment.' },
      { kind: 'h', text: 'Acceptable use' },
      { kind: 'bullets', items: [
        'Devices are provided for company business and remain company property at all times.',
        'Incidental personal use is permitted where it does not interfere with work, consume significant bandwidth, or expose the company to risk.',
        'You are responsible for the physical security of any device issued to you, in the office and outside it.',
        'Devices must be returned on the last day of employment.',
      ] },
      { kind: 'h', text: 'Prohibited' },
      { kind: 'bullets', items: [
        'Installing software that has not been approved through the Software Portal.',
        'Disabling, uninstalling or interfering with security tooling, including antivirus and disk encryption.',
        'Connecting personal USB storage, or copying company data onto personal cloud storage.',
        'Sharing your credentials with anyone, including colleagues and IT staff.',
        'Using company devices to access, store or distribute unlawful or offensive material.',
      ] },
      { kind: 'warn', text: 'Sharing credentials and moving company data onto personal storage are treated as serious breaches and may be handled as gross misconduct. If you need someone else to access something, raise an access request rather than sharing a password.' },
      { kind: 'h', text: 'Monitoring' },
      { kind: 'p', text: 'Company devices are monitored for security purposes. Patch level, installed software and network destinations are logged and retained. The company may inspect a device where there is reasonable cause to believe this standard has been breached. Monitoring is proportionate and is not used to track individual productivity.' },
      { kind: 'h', text: 'Lost or stolen devices' },
      { kind: 'steps', items: [
        'Report the loss to the service desk within twenty-four hours — sooner if the device held sensitive data.',
        'Provide the asset tag if you have it, along with where and roughly when the device was lost.',
        'Change your password immediately from another device.',
        'The device will be wiped remotely and blocked from company services.',
      ] },
      { kind: 'note', text: 'Reporting a lost device promptly is not held against you. Delaying the report so it can be looked for is what causes harm, because an unreported device stays connected to company services.' },
      { kind: 'h', text: 'Questions' },
      { kind: 'p', text: 'Questions about this standard should go to the IT Security team through the service portal. Where this standard and a local legal requirement conflict, the legal requirement takes precedence and Security should be informed.' },
    ],
  },

  'KB-10': {
    summary: [
      'Software is requested through the Software Portal, which splits into two paths. Pre-approved titles in the catalogue install on demand with no approval and no ticket, usually within ten minutes. Anything not in the catalogue needs a request with a business justification, and passes through manager approval, a licence check and a security review before it is packaged and deployed — typically five to ten working days.',
      'Two things slow requests down more than anything else: a vague justification, and requesting a title the company already licenses under a different name. Check the catalogue for an equivalent first. Installing software yourself is blocked by policy on managed devices, so bypassing the portal is not an option even where an installer is available.',
    ],
    blocks: [
      { kind: 'p', text: 'This article explains how to get software onto a company device — what installs on demand, what needs approval, and how long each route takes.' },
      { kind: 'h', text: 'Two routes' },
      { kind: 'table', rows: [
        ['Catalogue title', 'Already licensed and packaged. Installs on demand, no approval, usually under ten minutes.'],
        ['New title', 'Not currently licensed. Needs justification, approvals, licence purchase and packaging. Five to ten working days.'],
      ] },
      { kind: 'h', text: 'Installing a catalogue title' },
      { kind: 'steps', items: [
        'Open the Software Portal from your desktop shortcut.',
        'Search for the application by name.',
        'Choose Install. No ticket is created and no approval is needed.',
        'Wait for the status to reach Installed, then launch it from the Start menu.',
      ] },
      { kind: 'image', art: 'portal', caption: 'Figure 1 — the Software Portal. Anything listed here is licensed and installs without approval.' },
      { kind: 'note', text: 'Search the catalogue before requesting something new. A good proportion of new-title requests are for software the company already licenses under a different product name.' },
      { kind: 'h', text: 'Requesting a new title' },
      { kind: 'steps', items: [
        'In the Service Catalogue, choose Software Request.',
        'Give the exact product name, edition and version.',
        'Write a business justification that says what you will do with it and why an existing catalogue title will not do. This is the field that most often sends a request back.',
        'Select your cost centre — licences are charged to it.',
        'Submit for manager approval.',
      ] },
      { kind: 'p', text: 'After approval the request goes to licensing to confirm availability or purchase, then to security for review, then to packaging. You are notified at each stage and the software is deployed to your machine once packaging completes.' },
      { kind: 'warn', text: 'Do not download and install software yourself, even where an installer is freely available. Installation is blocked by policy on managed devices, and unapproved software is removed automatically at the next compliance scan.' },
      { kind: 'h', text: 'Getting further help' },
      { kind: 'p', text: HELP_CLOSER },
    ],
  },

  'KB-11': {
    summary: [
      'OneDrive keeps previous versions of every file for thirty days, so an overwritten document or one mangled by a bad edit can be rolled back from the web interface in under a minute without involving IT. Version history is per file and shows who saved each version and when; restoring makes the old version current rather than deleting anything, so the mistake remains recoverable too.',
      'Deleted files are a different route — they sit in the OneDrive recycle bin for thirty days, then a second-stage bin for a further sixty. Files only ever saved to the local Desktop or Documents folders outside the synced location have no version history at all, which is the usual reason a recovery request cannot be met.',
    ],
    blocks: [
      { kind: 'p', text: 'If you have overwritten a document, saved over the wrong version, or a file has been mangled by a bad edit, OneDrive almost certainly has an earlier copy. This article covers restoring a previous version and recovering something deleted.' },
      { kind: 'h', text: 'What is kept, and for how long' },
      { kind: 'table', rows: [
        ['Previous versions', 'Thirty days of saved versions for every file in OneDrive.'],
        ['Deleted files', 'Thirty days in your recycle bin, then sixty in the second-stage bin.'],
        ['Files outside OneDrive', 'Not covered. Local-only folders have no version history at all.'],
      ] },
      { kind: 'h', text: 'Restoring a previous version' },
      { kind: 'steps', items: [
        'Open OneDrive in a browser and sign in with your company account.',
        'Find the file, right-click it and choose Version history.',
        'Review the list — each entry shows when it was saved and by whom.',
        'Open a version to check it is the one you want before restoring.',
        'Choose Restore. That version becomes current; nothing is deleted.',
      ] },
      { kind: 'image', art: 'portal', caption: 'Figure 1 — version history for a file. Open a version to check it before restoring.' },
      { kind: 'note', text: 'Restoring does not discard the newer version — it is kept in the history too. If you restore the wrong one, restore again from the same list.' },
      { kind: 'h', text: 'Recovering a deleted file' },
      { kind: 'steps', items: [
        'In OneDrive on the web, open Recycle bin from the left-hand menu.',
        'Select the file and choose Restore. It returns to its original folder.',
        'If it is not there, open the second-stage recycle bin at the bottom of the page.',
      ] },
      { kind: 'warn', text: 'Files saved only to a local Desktop or Documents folder outside the synced location are not backed up and have no version history. If work matters, it belongs in OneDrive.' },
      { kind: 'h', text: 'Getting further help' },
      { kind: 'p', text: 'If the version you need is older than thirty days, raise a ticket quickly — a longer-retention backup may exist, but the window for retrieving it is limited.' },
    ],
  },

  'KB-12': {
    summary: [
      'Company information falls into four classifications — Public, Internal, Confidential and Restricted — and the classification determines how it may be stored, shared and disposed of. Anything unlabelled is treated as Internal by default. The practical dividing line is Confidential: from that level upwards, data must stay in approved company systems, may not be emailed to personal addresses, and must be encrypted at rest.',
      'Restricted data — payroll, health information, cardholder data, credentials — additionally requires named access, is never permitted on removable media, and any suspected exposure must be reported to Security within one hour. This standard is in review, so check for a newer version before relying on it for a compliance decision.',
    ],
    blocks: [
      { kind: 'p', text: 'This standard defines how company information is classified and the handling each classification requires. It applies to information in any form — documents, email, databases, printouts and conversations.' },
      { kind: 'h', text: 'The four classifications' },
      { kind: 'table', rows: [
        ['Public', 'Approved for release outside the company. Marketing material, published policies.'],
        ['Internal', 'Routine business information. The default where nothing is labelled.'],
        ['Confidential', 'Would cause harm if disclosed. Contracts, roadmaps, customer lists.'],
        ['Restricted', 'Severe harm if disclosed. Payroll, health data, cardholder data, credentials.'],
      ] },
      { kind: 'h', text: 'Handling requirements' },
      { kind: 'bullets', items: [
        'Public — no restriction on storage or sharing.',
        'Internal — company systems and company accounts only. Do not post externally.',
        'Confidential — approved company systems only, encrypted at rest, never sent to a personal email address, shared only with a business need.',
        'Restricted — as Confidential, plus named individual access, no removable media under any circumstances, and access logged.',
      ] },
      { kind: 'warn', text: 'Moving Confidential or Restricted information to personal cloud storage or a personal email address is a reportable breach, whatever the intention behind it. Where you need access somewhere else, request it rather than copying the data.' },
      { kind: 'h', text: 'Labelling' },
      { kind: 'p', text: 'Documents at Confidential and above must carry their classification in the header or footer. Where a document combines classifications, the highest applies to the whole document. Unlabelled information is treated as Internal, which means it must not be assumed to be publishable.' },
      { kind: 'h', text: 'Disposal' },
      { kind: 'bullets', items: [
        'Internal — standard deletion or recycling.',
        'Confidential — secure deletion, or a confidential-waste bin for paper.',
        'Restricted — certified destruction with a disposal record retained.',
      ] },
      { kind: 'h', text: 'Reporting an exposure' },
      { kind: 'p', text: 'Suspected exposure of Confidential information must be reported to IT Security the same working day. For Restricted information the window is one hour, at any time of day, by phone rather than by ticket. Reporting quickly and being wrong carries no penalty; delaying does.' },
      { kind: 'note', text: 'This standard is currently in review. Check for a newer version before relying on it for an audit or compliance decision.' },
    ],
  },

  'KB-13': {
    summary: [
      'Company mail on a phone requires the device to be enrolled in mobile device management first — enrolment is what allows a lost phone to be wiped, and mail will not connect without it. Setup is then straightforward: add a work account with your company address, approve the MFA prompt, and mail syncs within a few minutes. A device passcode and encryption are enforced as a condition of enrolment.',
      'Enrolment gives IT control only over the company work profile, not your personal apps, photos or messages — a remote wipe removes the work container alone. The most common setup failure is choosing a plain IMAP or Exchange option instead of the work account type, which will never authenticate against a modern-auth tenant.',
    ],
    blocks: [
      { kind: 'p', text: 'This article covers setting up company email on a personal or company phone, including the device enrolment that has to happen first.' },
      { kind: 'h', text: 'Before you begin' },
      { kind: 'bullets', items: [
        'Multi-factor authentication already enrolled.',
        'The Microsoft Outlook app and the Company Portal app installed.',
        'A device passcode set — enrolment will require one.',
        'iOS 15 or later, or Android 11 or later.',
      ] },
      { kind: 'h', text: 'Enrol the device' },
      { kind: 'steps', items: [
        'Open the Company Portal app and sign in with your company email address.',
        'Approve the multi-factor authentication prompt.',
        'Follow the enrolment steps and accept the device policy when asked.',
        'Wait for the device to show as Compliant. This can take a few minutes.',
      ] },
      { kind: 'note', text: 'Enrolment gives IT control over the company work profile only. Personal apps, photos and messages are not visible and are not affected by a remote wipe, which removes only the work container.' },
      { kind: 'h', text: 'Add your mailbox' },
      { kind: 'steps', items: [
        'Open Outlook and choose Add Account.',
        'Enter your company email address. Let it detect the account type automatically.',
        'Approve the multi-factor authentication prompt.',
        'Allow a few minutes for mail and calendar to sync.',
      ] },
      { kind: 'warn', text: 'Do not choose a plain IMAP or Exchange option and enter server details manually. Company mail uses modern authentication and a manual setup will never connect.' },
      { kind: 'h', text: 'If mail will not sync' },
      { kind: 'table', rows: [
        ['Stuck at "Setting up"', 'The device is not yet compliant. Open Company Portal and check enrolment finished.'],
        ['Password rejected repeatedly', 'Remove the account and add it again rather than retrying — repeated failures lock the account.'],
        ['Mail syncs, calendar does not', 'Turn the calendar toggle on in the account settings; it is off by default on some Android builds.'],
        ['Prompted to set a passcode', 'Expected. Encryption and a passcode are conditions of enrolment.'],
      ] },
      { kind: 'h', text: 'Getting further help' },
      { kind: 'p', text: HELP_CLOSER },
    ],
  },

  'KB-14': {
    summary: [
      'Wi-Fi dropping in the meeting rooms on floors three and four is a known issue caused by access-point coverage overlapping badly in that part of the building, and it worsens when a room is full because devices compete for the same access point. A network refresh is scheduled; until it completes there is no permanent fix available to end users.',
      'The reliable workaround for a meeting that matters is the wired connection at the room\'s dock, which bypasses the wireless entirely. Failing that, forgetting and rejoining the Corp-Secure network usually pushes the device onto a less congested access point. This article is still a draft and has not been through review — treat the detail as provisional.',
    ],
    blocks: [
      { kind: 'p', text: 'Users on the third and fourth floors report Wi-Fi dropping during meetings, particularly in the larger rooms when they are full. This article records what is known so far and the workarounds that hold up in practice.' },
      { kind: 'note', text: 'This article is a draft. It has not been through review and the root-cause detail may change as the network team completes its survey.' },
      { kind: 'h', text: 'What is happening' },
      { kind: 'p', text: 'A site survey found that access-point coverage in the meeting-room corridors on floors three and four overlaps more than intended. Devices sitting between two access points repeatedly hand off between them, and each hand-off drops the connection briefly. A full room makes it worse, because more devices compete for the same access point and hand-offs become more frequent.' },
      { kind: 'h', text: 'Symptoms that match' },
      { kind: 'bullets', items: [
        'Video calls freeze for a few seconds, then recover, several times in a meeting.',
        'The Wi-Fi indicator stays connected throughout — the drop is too brief to show.',
        'It is worse in a full room than an empty one.',
        'It affects everyone in the room at slightly different moments, not all at once.',
      ] },
      { kind: 'h', text: 'Workarounds' },
      { kind: 'steps', items: [
        'For anything that matters, use the wired connection at the room dock. It bypasses the wireless completely and is the only reliable option today.',
        'If you must stay on Wi-Fi, forget the Corp-Secure network and rejoin it. This usually re-associates the device with a less congested access point.',
        'Sit closer to the room display, where coverage is strongest, rather than by the corridor wall.',
        'Avoid the guest network as a workaround — it is rate-limited and will be worse for video.',
      ] },
      { kind: 'h', text: 'What is being done' },
      { kind: 'p', text: 'A change is raised to retune the access points on both floors and add two further units in the corridor dead spots. Until that work completes, additional reports for these rooms are linked to the existing problem record rather than investigated separately.' },
      { kind: 'h', text: 'Reporting it' },
      { kind: 'p', text: 'If you hit this, note the room name and the time so the network team can correlate it with the controller logs. Reports from rooms not already known to be affected are especially useful.' },
    ],
  },

  'KB-15': {
    summary: [
      'Everything you have raised appears under My Requests in the portal, with its current status, the assigned technician and the full conversation history. Status tells you where it is: Open means not yet picked up, In Progress means someone is working on it, Pending means it is waiting on you and will stall until you reply, and Resolved starts a five-day window before it closes automatically.',
      'The most common reason a request appears to stall is a Pending status waiting on information from you — the ticket does not progress and the response clock is paused until you answer. Adding a comment on the existing request is always faster than raising a duplicate, which starts again at the back of the queue.',
    ],
    blocks: [
      { kind: 'p', text: 'This article explains where to find the requests you have raised, what each status means, and how to chase something that appears to have stalled.' },
      { kind: 'h', text: 'Finding your requests' },
      { kind: 'steps', items: [
        'Open the service portal and choose My Requests.',
        'Use the filter to switch between open and closed items.',
        'Select a request to see its full history, the assigned technician and every update.',
      ] },
      { kind: 'image', art: 'portal', caption: 'Figure 1 — My Requests. Status is the column that tells you whether anything is expected from you.' },
      { kind: 'h', text: 'What each status means' },
      { kind: 'table', rows: [
        ['Open', 'Received and queued. Not yet picked up by a technician.'],
        ['In Progress', 'A technician is actively working on it.'],
        ['Pending', 'Waiting on you. The request will not move until you reply.'],
        ['Resolved', 'A fix has been applied. Closes automatically after five days unless you reopen it.'],
        ['Closed', 'Complete. Reopening is no longer possible — raise a new request.'],
      ] },
      { kind: 'warn', text: 'Pending means the ticket is waiting on information from you, and the response clock is paused while it sits there. A request that seems to have stalled for days is very often sitting in Pending with an unanswered question.' },
      { kind: 'h', text: 'Chasing a request' },
      { kind: 'p', text: 'Add a comment to the existing request rather than raising a new one. The comment notifies the assigned technician directly and keeps the history in one place. A duplicate ticket starts again at the back of the queue and usually has to be merged, which is slower rather than faster.' },
      { kind: 'note', text: 'If something has become genuinely urgent since you raised it, say so in a comment and call the service desk. Priority can be raised on an existing ticket — it does not require a new one.' },
      { kind: 'h', text: 'Getting further help' },
      { kind: 'p', text: 'Quote the reference number on any call or email. It is the fastest way for the service desk to find your request.' },
    ],
  },

  'KB-16': {
    summary: [
      'Working outside the office does not change the security requirements, it changes what you have to do yourself. The essentials are the VPN for anything internal, a locked screen whenever you step away, home Wi-Fi secured with WPA2 or better and its default router password changed, and company data kept in company systems rather than on personal devices or storage.',
      'Public Wi-Fi is usable with the VPN connected, but never without it, and public machines — hotel business centres, internet cafés — must not be used for company systems at all. Anything suspicious, including a phishing message or an MFA prompt you did not trigger, should be reported the same day rather than at the end of the week.',
    ],
    blocks: [
      { kind: 'p', text: 'These guidelines apply whenever you work outside a company office — at home, travelling, or from a customer site. They exist because the controls the office provides automatically become your responsibility elsewhere.' },
      { kind: 'h', text: 'The essentials' },
      { kind: 'bullets', items: [
        'Connect to the VPN before reaching any internal system.',
        'Lock your screen whenever you step away, including at home.',
        'Secure home Wi-Fi with WPA2 or better, and change the router\'s default administrator password.',
        'Keep company data in company systems — not on a personal laptop, personal cloud storage or a USB drive.',
        'Install updates when prompted rather than deferring them repeatedly.',
      ] },
      { kind: 'h', text: 'Public networks' },
      { kind: 'p', text: 'Hotel, airport and café Wi-Fi may be used provided the VPN is connected first. Many of these networks use a captive portal, so open a browser and accept the terms before starting the VPN. Never work on internal systems on a public network without the VPN running.' },
      { kind: 'warn', text: 'Do not use public or shared computers — hotel business centres, internet cafés, a client\'s spare desktop — for company systems under any circumstances. You cannot know what is installed on them, and credentials entered on such a machine must be treated as compromised.' },
      { kind: 'h', text: 'Working in public' },
      { kind: 'bullets', items: [
        'Be aware of who can see your screen on a train or in a café. Use a privacy filter for sensitive work.',
        'Take calls about confidential matters somewhere you cannot be overheard.',
        'Never leave a device unattended in a public space, even briefly.',
        'Keep devices out of sight in a vehicle, and never in an unattended boot overnight.',
      ] },
      { kind: 'h', text: 'Reporting problems' },
      { kind: 'steps', items: [
        'Report a lost or stolen device to the service desk within twenty-four hours.',
        'Report a phishing message using the Report button in Outlook rather than deleting it.',
        'Report any MFA prompt you did not trigger immediately — it means someone has your password.',
        'If you think you entered credentials on a fake site, change your password at once and then report it.',
      ] },
      { kind: 'note', text: 'Reporting quickly and turning out to be wrong carries no consequence. Delay is what causes harm, because it gives an attacker time to use what they have.' },
    ],
  },

  'KB-17': {
    summary: [
      'A BitLocker recovery key is requested when Windows detects a hardware or firmware change it cannot account for — a BIOS update, a docking change, a repair — and it prompts before Windows starts, so the machine is unusable until the key is entered. The key is stored automatically against the device in Active Directory and can be retrieved from the portal on any other device using the eight-character key ID shown on the recovery screen.',
      'You cannot retrieve your own key from the locked machine, so a second device is essential — a phone browser is enough. The key is forty-eight digits and specific to that device and that event, so it will not work elsewhere. If the prompt returns at every restart, the underlying hardware change needs investigating rather than the key re-entering.',
    ],
    blocks: [
      { kind: 'p', text: 'If your laptop shows a blue BitLocker recovery screen before Windows starts, the disk encryption has detected a change it cannot verify and is asking for the recovery key. This article covers retrieving the key and what triggers the prompt.' },
      { kind: 'h', text: 'What triggers it' },
      { kind: 'bullets', items: [
        'A BIOS or firmware update, whether applied by you or automatically.',
        'A change to the boot order, or booting from a USB device.',
        'Hardware repair or replacement — particularly the system board.',
        'Docking or undocking during startup on some models.',
      ] },
      { kind: 'h', text: 'Retrieving the key' },
      { kind: 'steps', items: [
        'Note the Key ID shown on the recovery screen. It is eight characters and identifies which key you need.',
        'On another device — a phone browser is fine — open the service portal.',
        'Choose Account Help, then BitLocker Recovery Key.',
        'Enter the Key ID, or select your device from the list shown against your name.',
        'Type the forty-eight-digit key into the recovery screen exactly as shown, then press Enter.',
      ] },
      { kind: 'image', art: 'portal', caption: 'Figure 1 — BitLocker key retrieval in the portal. Match the Key ID from the recovery screen before copying the key.' },
      { kind: 'warn', text: 'You cannot retrieve the key from the locked machine itself. Have a second device to hand — this is the reason most people end up calling the service desk from a meeting room.' },
      { kind: 'note', text: 'The key is specific to that device and that recovery event. It is not a password, it will not work on another machine, and a new one is generated afterwards. There is no need to write it down for next time.' },
      { kind: 'h', text: 'If it prompts at every restart' },
      { kind: 'p', text: 'A single prompt after a firmware update is expected. A prompt at every restart means the underlying change has not been reconciled, and re-entering the key each morning is not a fix. Raise a ticket — suspending and resuming protection on the volume resolves it, but it should be done with the service desk rather than from an internet guide.' },
      { kind: 'h', text: 'Getting further help' },
      { kind: 'p', text: 'Include the device asset tag and the Key ID from the recovery screen in any ticket. Those two together let the service desk find the right key immediately.' },
    ],
  },

  'KB-18': {
    summary: [
      'Onboarding runs across four stages — before the start date, day one, the first week, and the first month — and the manager owns most of it. The critical path is the equipment and access request, which needs raising at least ten working days ahead because procurement, imaging and account creation happen in sequence rather than together.',
      'Day one is deliberately light: collect the machine, complete first sign-in and MFA enrolment, and meet the team. Access to systems is granted by role, so a joiner who cannot reach something in week one usually needs a role correction rather than an individual access request. Mandatory security training must be completed within thirty days and is tracked against the joiner\'s record.',
    ],
    blocks: [
      { kind: 'p', text: 'This checklist covers everything required to bring a new employee onto company systems, from raising the equipment request through to the end of their first month. It is written for the hiring manager, who owns most of the steps.' },
      { kind: 'h', text: 'Before the start date' },
      { kind: 'steps', items: [
        'Raise the New Joiner Equipment request at least ten working days ahead — this is the critical path and everything else follows it.',
        'Confirm the role and department, which determine the access the joiner receives automatically.',
        'Request any role-specific application access not covered by the standard role profile.',
        'Book a desk or locker, and arrange a building access card.',
        'Confirm with the service desk that the account and mailbox are ready two days before the start date.',
      ] },
      { kind: 'warn', text: 'Ten working days is the minimum, not a target. Procurement, imaging, asset registration and account creation run in sequence, and imaging alone takes a full working day.' },
      { kind: 'h', text: 'Day one' },
      { kind: 'steps', items: [
        'Collect the equipment from the service desk or the allocated locker.',
        'Complete first sign-in and set a password.',
        'Enrol multi-factor authentication — nothing else will work until this is done.',
        'Confirm mail, calendar and the company chat tool are working.',
        'Walk through the support portal and where to raise requests.',
      ] },
      { kind: 'note', text: 'Keep day one deliberately light. Sign-in, MFA and a working mailbox are enough; system access can wait until the joiner has a working machine and somewhere to sit.' },
      { kind: 'h', text: 'First week' },
      { kind: 'bullets', items: [
        'Confirm access to the systems the role needs day to day.',
        'Set up mail on a mobile device if the role requires it.',
        'Introduce the joiner to the knowledge base and how to search it.',
        'Assign mandatory security awareness training.',
      ] },
      { kind: 'h', text: 'First month' },
      { kind: 'bullets', items: [
        'Confirm security awareness training is complete — it is tracked and must be done within thirty days.',
        'Review whether the role profile granted the right access, and correct the role rather than adding individual exceptions.',
        'Confirm the asset register shows the equipment against the joiner\'s name.',
      ] },
      { kind: 'h', text: 'Getting further help' },
      { kind: 'p', text: 'If a joiner is blocked on access, check the role profile first. A joiner who cannot reach several systems at once almost always has the wrong role assigned rather than several missing permissions.' },
    ],
  },

  'KB-19': {
    summary: [
      'The service desk covers company-provided technology: devices, accounts and access, company applications, network and connectivity, and security incidents. It does not cover personal devices, personal accounts, software the company has not licensed, or training in how to use an application — those route to the relevant business team or are out of scope entirely.',
      'Hours are 8am to 6pm on working days, with an out-of-hours line for genuine emergencies such as a total outage or a suspected security incident. Response targets run from thirty minutes for a critical outage to a working day for a standard request, and the clock pauses whenever a ticket is waiting on you.',
    ],
    blocks: [
      { kind: 'p', text: 'This article sets out what the IT service desk supports, what falls outside it, and the response you can expect. It is worth a read before raising something you are unsure about.' },
      { kind: 'h', text: 'What we support' },
      { kind: 'bullets', items: [
        'Company laptops, desktops, phones and peripherals.',
        'Company accounts, passwords, multi-factor authentication and access requests.',
        'Company-licensed applications, including install, configuration and faults.',
        'Network, Wi-Fi, VPN and connectivity in company offices.',
        'Printing on company devices.',
        'Security incidents — phishing, lost devices, suspected compromise.',
      ] },
      { kind: 'h', text: 'What we do not support' },
      { kind: 'bullets', items: [
        'Personal laptops, phones and home equipment, other than enrolling a personal phone for company mail.',
        'Personal email, personal cloud storage and personal subscriptions.',
        'Software the company has not licensed.',
        'Home broadband faults — contact your provider.',
        'Training in how to use an application. We fix it; the owning team teaches it.',
      ] },
      { kind: 'note', text: 'Where something falls outside our scope, we will still point you at the right team rather than simply closing the ticket.' },
      { kind: 'h', text: 'Hours and contact' },
      { kind: 'table', rows: [
        ['Portal', 'Always available. The fastest route for anything not urgent.'],
        ['Phone', '8am to 6pm, Monday to Friday, excluding public holidays.'],
        ['Out of hours', 'Emergency line for total outages and suspected security incidents only.'],
      ] },
      { kind: 'h', text: 'Response targets' },
      { kind: 'table', rows: [
        ['Critical — total outage, multiple users', '30 minutes to respond, 4 hours to resolve.'],
        ['High — one user unable to work', '2 hours to respond, 1 working day to resolve.'],
        ['Standard request', '1 working day to respond, 3 working days to fulfil.'],
        ['Hardware request', '1 working day to respond, subject to stock.'],
      ] },
      { kind: 'warn', text: 'These targets pause whenever a ticket is waiting on information from you. A ticket sitting in Pending is not consuming its response time — and is not progressing either.' },
    ],
  },

  'KB-20': {
    summary: [
      'This article described the migration path from Windows 7 to Windows 10 and is retained only for historical reference. Windows 7 left extended support in January 2020, the migration completed in 2021, and no supported device on the estate runs it today. The tooling it refers to has been decommissioned, so the steps cannot be followed even where a machine still exists.',
      'If you have found a device still running Windows 7, do not attempt to migrate it using this article. Report it to IT Security as an unsupported device — it receives no patches and must be removed from the network rather than upgraded in place. Current build guidance lives in the Windows 11 deployment articles.',
    ],
    blocks: [
      { kind: 'warn', text: 'This article is expired and retained for historical reference only. Windows 7 left extended support in January 2020 and the migration described here completed in 2021. Do not follow these steps.' },
      { kind: 'p', text: 'The content below documented the in-place upgrade path from Windows 7 to Windows 10 during the estate migration. The deployment share, task sequences and licensing keys it refers to were decommissioned when the programme closed, so the procedure cannot be completed as written.' },
      { kind: 'h', text: 'If you have found a Windows 7 device' },
      { kind: 'steps', items: [
        'Do not connect it to the corporate network.',
        'Report it to IT Security through the service portal as an unsupported device, with its asset tag and location.',
        'Await instruction. Such devices are removed and rebuilt rather than upgraded in place.',
      ] },
      { kind: 'note', text: 'An unpatched Windows 7 machine on the network is a security risk rather than an inconvenience, which is why the route is Security rather than a standard upgrade request.' },
      { kind: 'h', text: 'What replaced this' },
      { kind: 'p', text: 'Current build and deployment guidance is held in the Windows 11 deployment articles. For a device that is simply out of date rather than out of support, raise a standard request and the machine will be brought onto the current build through the normal deployment process.' },
      { kind: 'h', text: 'Historical record' },
      { kind: 'p', text: 'The original procedure covered a compatibility assessment, a user-state backup, the in-place task sequence, and a post-upgrade application reinstall. It is retained in the archive for audit purposes and can be produced on request by the IT Asset team.' },
    ],
  },
};

/** Any article without authored content falls back to a generic walkthrough built from its title. */
export const fallbackArticle = (title: string): KbArticle => ({
  summary: [
    `Covers ${title.toLowerCase()} end to end — what to have in place before you start, the steps in the order they need to be done, and the checks to run if a step does not behave as expected.`,
    'Most problems reported against this process come from skipping a prerequisite rather than from the steps themselves, so the opening section is worth reading even if the procedure is familiar.',
  ],
  blocks: [
    { kind: 'p', text: `This article covers ${title.toLowerCase()}. It walks through what you need before you start, the steps to follow, and what to do if something does not work as expected. Follow the steps in order — most issues are caused by skipping one of the prerequisites.` },
    { kind: 'h', text: 'Before you begin' },
    { kind: 'bullets', items: [
      'A company-managed device with the latest updates applied.',
      'Your company account credentials and multi-factor authentication enrolled.',
      'The relevant application installed from the Software Portal.',
    ] },
    { kind: 'image', art: 'portal', caption: 'Figure 1 — the service portal. The left-hand menu is where each section lives.' },
    { kind: 'h', text: 'Steps to follow' },
    { kind: 'steps', items: [
      'Open the service portal and sign in with your company account.',
      'Navigate to the relevant section from the left-hand menu.',
      'Complete the required fields, taking care to select the correct option for your department.',
      'Review your entries, then submit. You will receive a confirmation by email within a few minutes.',
      'Keep the reference number from the confirmation — the service desk will ask for it if you need to follow up.',
    ] },
    { kind: 'note', text: 'Requests raised outside business hours are picked up on the next working day unless they are marked as urgent. If the issue is stopping you from working, call the service desk directly rather than waiting on the ticket.' },
    { kind: 'h', text: 'If something goes wrong' },
    { kind: 'steps', items: [
      'Refresh the page and retry the action.',
      'Sign out completely, close the browser, then sign back in.',
      'Clear your browser cache and cookies for the portal.',
      'Try a different browser to rule out an extension conflict.',
    ] },
    { kind: 'warn', text: 'Never share your credentials with a colleague to work around an access problem. Raise an access request instead — sharing accounts breaches the Acceptable Use Policy and makes issues far harder to trace.' },
    { kind: 'h', text: 'Getting further help' },
    { kind: 'p', text: HELP_CLOSER },
  ],
});
