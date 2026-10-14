/* The request description bodies, keyed by subject — the SINGLE source the detail page,
   the kanban cards/popup and the listing quick-peek all read, so every surface tells the
   same story for a given request. Moved out of TicketDrawer so list-side components can
   import it without pulling drawer internals (or creating an import cycle). */

export const SUBJECT_DESCRIPTIONS: { match: RegExp; short: string; more: string[] }[] = [
  {
    match: /vpn/i,
    short: 'The corporate VPN drops roughly every fifteen minutes while I am working from home, and I have to reconnect manually each time to get back into our internal tools.',
    more: [
      'The disconnects happen on both my home Wi-Fi and a mobile hotspot, so I do not think it is my broadband. The client logs show a timeout against the gateway rather than an authentication failure.',
      'Every drop signs me out of the internal portals and interrupts file transfers, which is making longer pieces of work very difficult to finish. Please advise whether my VPN profile needs to be reissued.',
    ],
  },
  {
    match: /internet|wi-?fi|network|website not loading|shared drive|connect/i,
    short: 'I am unable to get a working connection from my desk. The network shows as connected, but internal sites and cloud applications either time out or fail to load entirely.',
    more: [
      'I have already restarted the machine, toggled the wireless adapter, and rejoined the corporate network. None of these steps made a difference, and the behaviour is identical on the guest network.',
      'Colleagues sitting nearby are online without any trouble, which suggests the problem is specific to my device or profile. I am blocked from email, the CRM and our shared drives until this is fixed.',
    ],
  },
  {
    match: /charger|power adapter|battery|keyboard|monitor|projector|printer|hardware|not responding|burnt/i,
    short: 'The device is not working correctly and is affecting my ability to do everyday work. The fault is consistent rather than intermittent, and it has not improved after a restart.',
    more: [
      'I have checked the obvious things — cables reseated, a different power outlet, and a different port where that applies — and the behaviour is the same each time, so this looks like a hardware fault rather than a configuration issue.',
      'Please could someone check the warranty status and arrange a replacement or a bench repair. I am happy to drop the device at the IT desk if that is quicker than a visit.',
    ],
  },
  {
    match: /outlook|email|mailbox|mail/i,
    short: 'My mailbox is not behaving correctly. Messages are not moving as expected and the client shows errors when I try to work with them, which is holding up several conversations with customers.',
    more: [
      'I have tried restarting the client and signing out and back in. Webmail behaves the same way, so the problem does not appear to be limited to the desktop application.',
      'Could someone check the mailbox from the server side — I am concerned that either the profile or the quota is at fault. I can be available for a remote session at any point today.',
    ],
  },
  {
    match: /onboarding|offboarding|new laptop setup|enrollment|bulk user/i,
    short: 'Please set up the accounts, access and equipment required for this joiner so that everything is ready and tested before their first working day.',
    more: [
      'This covers the Active Directory account and mailbox, membership of the relevant team groups, access to the shared drives and business applications for the role, and a prepared laptop with the standard image.',
      'The start date is confirmed, so please flag early if any part of this cannot be completed in time — particularly the account creation, since the device build depends on it.',
    ],
  },
  {
    match: /log ?in|login|password|authentication|access|two-factor|2fa|account|sso|sap|salesforce/i,
    short: 'I am unable to sign in to the application and cannot get past the authentication step, so I have no access to the records I need for my current work.',
    more: [
      'The credentials are the ones I use every day and they work elsewhere, so I do not believe this is a typing error. I have cleared the browser cache and tried a private window with the same result.',
      'Please could the account be checked for a lock or an expired permission, and reset if required. This is currently blocking work that is due this week.',
    ],
  },
  {
    match: /license|upgrade|storage|request additional|request access|request for/i,
    short: 'I would like to request this for my role. My current allocation is no longer sufficient for the work I am doing, and it is starting to slow down day-to-day delivery.',
    more: [
      'The request is for standard business use and would be covered by my department budget. I have confirmed with my manager that the spend is expected and approved on their side.',
      'Please let me know if any additional justification or a cost centre code is required, and I will provide it straight away.',
    ],
  },
  {
    match: /slow|performance|blue screen|crash|freez/i,
    short: 'The machine has become unreliable — it is noticeably slower than it was and fails during normal use, which is costing me time throughout the day.',
    more: [
      'The behaviour started after the most recent round of updates. A restart helps briefly, but the problem returns within an hour or two of normal work.',
      'I have not installed anything new or changed any settings. Please could someone review the event logs and the update history to see what changed.',
    ],
  },
  {
    match: /teams|zoom|audio|meeting|conference/i,
    short: 'Audio is not working correctly during meetings. Other participants cannot hear me, or I cannot hear them, and the problem happens across different meetings and rooms.',
    more: [
      'I have checked that the correct input and output devices are selected and that nothing is muted at the operating-system level. Other applications play sound normally.',
      'This is affecting customer calls, so a quick look would be appreciated. I am free to test with someone from the service desk whenever suits.',
    ],
  },
  {
    match: /backup|restore|data/i,
    short: 'I need files restored from backup. They were removed in error and are not recoverable from the recycle bin or from local version history.',
    more: [
      'The files were last known good earlier in the week, and they sit in our team folder on the shared drive rather than on my local machine.',
      'Please restore the most recent clean version available. Let me know if you need the exact path and timestamps and I will send them over.',
    ],
  },
];

export const GENERIC_DESCRIPTION = {
  short: 'I have raised this request because the issue is affecting my normal work and I have not been able to resolve it myself.',
  more: [
    'I have tried the usual first steps — restarting the machine and signing out and back in — without any change in behaviour.',
    'Please could someone from the service desk take a look and advise on the next steps. I am available for a remote session at short notice.',
  ],
};

/** The description body for a request, chosen by its subject. */
export const describeSubject = (subject?: string) =>
  SUBJECT_DESCRIPTIONS.find((d) => d.match.test(subject ?? '')) ?? GENERIC_DESCRIPTION;

/* INC-32's bespoke long description from the detail page (text of the 12-paragraph
   Word-paste demo; descriptionImageAfter says where its inline diagram sits). */
const INC32_PARAGRAPHS = [
  `I am unable to access the internet on my work laptop since this morning. I've tried restarting my computer multiple times, but the issue persists. The network icon shows that I'm connected to the office Wi-Fi, but when I try to open any website or access company resources, nothing loads.`,
  `This is significantly impacting my ability to work as I cannot access emails, cloud applications, or collaborate with my team. I've checked with colleagues nearby and they don't seem to be experiencing any connectivity issues. I need urgent assistance to resolve this problem as I have several critical tasks and meetings scheduled today that require internet access.`,
  `The problem first appeared at approximately 8:45 AM today, right after I returned from a short meeting and unlocked my laptop. Everything was working perfectly when I left my desk around 8:15 AM, so the outage seems to have started while the machine was locked and idle.`,
  `Before raising this request I attempted the usual troubleshooting steps on my own: I rebooted the laptop three times, toggled the Wi-Fi adapter off and on, forgot and re-joined the "Corp-Secure" network, and even tried the guest network as a test. None of these restored connectivity, and the guest network behaved exactly the same way.`,
  `I also ran the built-in network diagnostics tool, and I've attached the exported report. My laptop reaches the office access point and the local gateway without any problem, but every request beyond the gateway times out — it looks like the connection is being dropped somewhere between our gateway and the internet service provider.`,
  `When I open Command Prompt, I can successfully ping the gateway (192.168.1.1) with 0% packet loss, but pinging external addresses such as 8.8.8.8 or google.com results in "Request timed out" for every packet. DNS lookups also fail with a "server could not be found" error in the browser.`,
  `The outage is blocking access to a long list of business-critical resources, including Outlook/Exchange email, the Jira and Confluence workspaces, our internal SharePoint drives, the CRM portal, Microsoft Teams, and the cloud build pipeline I use throughout the day. Essentially nothing that lives outside the local network is reachable.`,
  `I walked around to confirm the scope of the issue. Two colleagues sitting in the same row are online without any trouble on the same SSID, which suggests this is specific to my device or my network profile rather than a building-wide outage. One teammate on the far side of the floor did mention intermittent slowness, so it may be worth checking that segment as well.`,
  `As a temporary workaround I tethered my laptop to my mobile phone's hotspot, and on that connection everything works normally — email syncs, websites load, and the VPN connects. This further points to a problem with the office Wi-Fi path to the internet rather than anything wrong with the laptop's hardware or operating system.`,
  `I have not made any recent changes to my machine — no new software installs, no VPN client updates, and no firewall changes that I'm aware of. The corporate VPN client shows "disconnected" and refuses to reconnect over the office network, returning a timeout, although it connects instantly over the mobile hotspot.`,
  `This is genuinely urgent for me today. I have a customer demo at 2:00 PM that depends on the cloud environment, a release sign-off that needs to happen before 4:00 PM, and several code reviews that are blocking other engineers. Every hour without connectivity is directly delaying the team's deliverables for this sprint.`,
  `Please treat this with high priority. I'm available at my desk (Seat 4-B, 3rd floor) for the rest of the day and can stay on a call or screen-share via my phone's hotspot if the support engineer needs to run remote diagnostics. Thank you in advance for the quick help.`,
];

/** Paragraph index AFTER which the detail page shows its inline diagram (−1 = none). */
export const descriptionImageAfter = (id?: string) => (id === 'INC-32' ? 3 : -1);

/** Every paragraph of a request's description — bespoke for INC-32, subject-themed otherwise. */
export const fullDescriptionFor = (id: string | undefined, subject: string | undefined): string[] => {
  if (id === 'INC-32') return INC32_PARAGRAPHS;
  const d = describeSubject(subject);
  return [d.short, ...d.more];
};
