/* The option lists the create forms on the product (172.16.15.185) offer, read 29 Oct 2026 — so the
 * new create pages and the old-vs-new comparison show the same values. Test data on that server is
 * left out (accounts like "DUMMY" / "ZZ-ESM-TEST-*", groups like "newgrup-1…9", values like "nnn",
 * "alert", "56"). Lists that server left empty (Change Reason, Target Environment, Release Type…)
 * are not here; the specs keep their own for those. */

export interface Person185 { name: string; email: string; initials: string }

const person = (label: string): Person185 => {
  const m = label.match(/^(.*?)\s*\((.*)\)$/);
  const name = (m ? m[1] : label).trim();
  const words = name.split(/\s+/);
  const initials = (words.length > 1 ? words[0][0] + words[1][0] : name.slice(0, 2)).toUpperCase();
  return { name, email: m ? m[2] : '', initials };
};

/** Technicians and requesters — "Name (email)" as the product lists them. */
export const PEOPLE_185: Person185[] = [
  'Yash Gaudani (yash.gaudani@motadata.com)', 'Nirali Kevlani (nirali.kevlani@motadata.com)', 'Julig (juli.gopani@motadata.com)',
  'Sakshi Asudhani (sakshi)', 'Ahmedraza Ansari (ahmedraza)', 'Stuti (rosy.cordeiro@motadata.com)', 'Keya (keya.desai@motadata.com)',
  'Jerry (jerry@motadata.com)', 'Saahil (saahil.pandya@motadata.com)', 'Adam (adam@motadata.com)', 'james (james.wilson@motadata.com)',
  'Stuti (stuti.sanghvi@motadata.com)', 'Riya Vhora (riya.vhora@motadata.com)', 'kamalesh (srikamalesh.divakaruni@motadata.com)',
  'John (john@motadata.com)', 'amelia (amelia.king@motadata.com)', 'benjamin (benjamin.young@motadata.com)',
  'charlotte (charlotte.walker@motadata.com)', 'daniel (daniel.clark@motadata.com)', 'david (david.thompson@motadata.com)',
  'emily (emily.carter@motadata.com)',
].map(person);
/** The value a person field stores and shows: the name, or "Name (email)" when two share a name. */
export const personLabel = (p: Person185) => (PEOPLE_185.filter((x) => x.name === p.name).length > 1 ? `${p.name} (${p.email})` : p.name);

export const GROUPS_185 = ['Network Operations Group', 'IT Support Group', 'General Support', 'Change Advisory Board (CAB)', 'HR Support Group', 'Emergency Change Advisory Board (ECAB)', 'Other', 'HR', 'Software', 'Hardware'];
export const DEPARTMENTS_185 = ['HR', 'IT', 'Finance', 'Marketing'];
export const LOCATIONS_185 = ['USA', 'Asia', 'Mumbai Branch', 'Bangalore Office', 'India'];
export const VENDORS_185 = ['Imagine Marketing Limited (boAt)', 'NVIDIA', 'Zoom Video', 'SAP', 'Veeam Software', 'Adobe', 'Fortinet', 'VMware', 'Lenovo', 'HP Inc.', 'Cisco Systems', 'Dell Technologies', 'Microsoft'];

export const REQUEST_STATUS_185 = ['Open', 'In Progress', 'Pending', 'On Hold', 'Waiting on Customer', 'Resolved and validated', 'Closed'];
export const LEVELS_185 = ['Low', 'Medium', 'High', 'Urgent'];
export const IMPACT_185 = ['Low', 'On Users', 'On Department', 'On Business'];
export const REQUEST_CATEGORY_185 = ['Software Installation', 'Software', 'Hardware', 'Network', 'HR', 'Other', 'Documentation', 'Server Issue', 'Software Bug', 'User Support', 'Authentication Failure'];
export const CHANGE_CATEGORY_185 = ['General', 'Hardware', 'Software', 'Network', 'IT Administration'];
export const SERVICES_185 = ['Production Environment'];

export const PROBLEM_TEMPLATES_185 = ['Frequent Network Latency', 'Server Overheating', 'Printer Queues Frequently Jammed', 'VPN Connection Drops', 'Disk Utilization Alerts'];
export const RELEASE_TEMPLATES_185 = ['Major Release', 'Minor Release', 'Emergency Release'];
export const TRANSITION_MODELS_185 = ['Change Model'];
export const CHANGE_RISK_185 = ['Low', 'Medium', 'High', 'Critical'];
export const CHANGE_TYPE_185 = ['Standard', 'Emergency', 'Normal'];

export const ASSET_STATUS_185 = ['In Use', 'In Stock', 'Missing', 'Retired', 'In Repair', 'Disposed', 'Expired', 'Decommission', 'Allocated'];
export const ASSET_CATEGORY_185 = ['Public', 'Internal', 'Confidential', 'Restricted', 'Secret'];
export const CI_STATUS_185 = ['Operational', 'Non-Operational', 'In Maintenance', 'Retired', 'Archived'];

export const CURRENCIES_185 = ['INR', 'USD'];
export const PRINT_TEMPLATES_185 = ['custom template', 'Standard'];
export const PROJECT_TYPES_185 = ['Infrastructure', 'Maintenance', 'Business', 'Management'];
export const PROJECT_RISK_185 = ['Low', 'Medium', 'High'];

export const PATCH_CATEGORIES_185 = ['Tools', 'Feature Packs', 'Service Packs', 'Update Rollups', 'Definition Updates', 'Critical Updates', 'Updates', 'Hotfix', 'Security Updates'];
export const PATCH_SEVERITY_185 = ['Critical', 'Important', 'Moderate', 'Low', 'Unspecified'];
export const REBOOT_185 = ['Yes', 'No', 'May be'];
export const OS_PLATFORMS_185 = ['Windows', 'MAC', 'Linux Ubuntu', 'Linux Mint', 'Linux Centos', 'Linux Redhat', 'Linux Opensuse', 'Linux Suse', 'Linux Debian', 'Linux Pardus', 'Linux Oracle', 'Linux Rocky', 'Linux Alma'];
export const DEPLOYMENT_POLICIES_185 = ['24x7 Deployment Policy – Startup Triggered', '24x7 Deployment Policy – User Intervention Allowed', 'Business Hours Deployment – No Reboot', 'Now'];

export const REPORT_MODULES_185 = ['Request', 'Service Catalog', 'Problem', 'Change', 'Release', 'Hardware Asset', 'Software Asset', 'Non-IT Asset', 'Consumable Asset', 'CMDB', 'Contract', 'Purchase', 'Patch', 'Deployment', 'Vulnerability', 'OS Deployment', 'Task', 'Software License', 'Agent', 'Project'];
export const REPORT_TYPES_185 = ['Tabular', 'Matrix', 'Summary', 'Plugin', 'Query'];
export const REPORT_ACCESS_185 = ['Private', 'Public', 'Restricted'];
export const TASK_STATUS_185 = ['Open', 'In Progress', 'Pending', 'Rejected', 'On Hold', 'Resolved', 'Closed'];
export const KNOWLEDGE_FOLDERS_185 = ['Guideline Documents', 'FAQs', 'Troubleshooting Articles', 'HR policy'];

/** What each template fills on the product — picking one sets these fields (Fill From Template). */
export const TEMPLATE_FILLS_185: Record<string, Record<string, Record<string, string>>> = {
  problem: {
    "Frequent Network Latency": {
      subject: "Frequent Network Latency in Office Floors",
      description: "Multiple incidents logged due to slow network performance across several floors. Requires root cause analysis to identify infrastructure or bandwidth issues.",
      nature: "Reactive",
      priority: "Medium",
      urgency: "Medium",
      impact: "On Business",
      category: "Network",
      techGroup: "Network Operations Group",
      assignee: ""
    },
    "Server Overheating": {
      subject: "Server Overheating Alerts in Data Center",
      description: "Multiple alerts from monitoring systems indicate servers exceeding recommended temperature thresholds. Requires investigation into cooling efficiency, airflow, or hardware faults.",
      priority: "Medium",
      urgency: "Medium",
      impact: "On Business",
      category: "IT Administration",
      techGroup: "IT Support Group",
      assignee: ""
    },
    "Printer Queues Frequently Jammed": {
      subject: "Recurring Printer Paper Jams",
      description: "Same printer model across departments frequently jams or shows error codes. Potential design flaw or consumable quality issue. Needs investigation.",
      nature: "Reactive",
      techGroup: "",
      assignee: ""
    },
    "VPN Connection Drops": {
      subject: "Intermittent VPN Disconnections",
      description: "Recurring complaints about VPN sessions dropping unexpectedly, disrupting remote work. Requires analysis of VPN gateway stability and endpoint configurations.",
      nature: "Reactive",
      priority: "Medium",
      urgency: "Medium",
      impact: "On Department",
      category: "Network",
      techGroup: "Network Operations Group",
      assignee: ""
    },
    "Disk Utilization Alerts": {
      subject: "Repeated High Disk Usage Alerts",
      description: "Monitoring tools raise frequent alerts about high disk space utilization on critical servers. Requires analysis to prevent outages.",
      priority: "Medium",
      urgency: "Medium",
      impact: "On Business",
      techGroup: "",
      assignee: ""
    }
  },
  release: {
    "Major Release": {
      transitionModel: "Major Release Lifecycle",
      priority: "Medium",
      urgency: "Medium",
      impact: "On Business",
      risk: "Medium",
      releaseType: "Major",
      techGroup: "",
      assignee: ""
    },
    "Minor Release": {
      transitionModel: "Minor Release Lifecycle",
      releaseType: "Minor",
      techGroup: "",
      assignee: ""
    },
    "Emergency Release": {
      transitionModel: "Emergency Release Lifecycle",
      priority: "Urgent",
      urgency: "Urgent",
      impact: "On Business",
      risk: "High",
      releaseType: "Emergency",
      techGroup: "",
      assignee: ""
    }
  }
};

export const RELEASE_TRANSITION_MODELS_185 = ['Major Release Lifecycle', 'Minor Release Lifecycle', 'Emergency Release Lifecycle'];
export const RELEASE_TYPES_185 = ['Major', 'Minor', 'Emergency'];

/* ── The rows the product's Add / Link sidebars list (read 29 Oct 2026, test rows left out). ── */
export const ASSETS_185 = [
 {
  "id": "AST-54",
  "name": "motadata",
  "assetType": "Linux Desktop",
  "status": "In Use",
  "hostName": "motadata",
  "ipAddress": "172.16.14.75",
  "usedBy": "---"
 },
 {
  "id": "AST-53",
  "name": "motadata",
  "assetType": "Linux Desktop",
  "status": "In Use",
  "hostName": "motadata",
  "ipAddress": "172.16.13.93",
  "usedBy": "---"
 },
 {
  "id": "AST-52",
  "name": "motadata",
  "assetType": "Linux Desktop",
  "status": "In Use",
  "hostName": "motadata",
  "ipAddress": "172.16.14.60",
  "usedBy": "---"
 },
 {
  "id": "AST-51",
  "name": "zeel-patel-Latitude-5420",
  "assetType": "Linux Laptop",
  "status": "In Use",
  "hostName": "zeel-patel-Latitude-5420",
  "ipAddress": "10.20.40.217",
  "usedBy": "---"
 },
 {
  "id": "AST-50",
  "name": "D-Link",
  "assetType": "SNMP Devices",
  "status": "In Use",
  "hostName": "---",
  "ipAddress": "---",
  "usedBy": "---"
 },
 {
  "id": "AST-49",
  "name": "ol-10-1",
  "assetType": "Linux Desktop",
  "status": "In Use",
  "hostName": "ol-10-1",
  "ipAddress": "172.16.14.153",
  "usedBy": "---"
 },
 {
  "id": "AST-48",
  "name": "ol-9-7",
  "assetType": "Linux Desktop",
  "status": "In Use",
  "hostName": "ol-9-7",
  "ipAddress": "172.16.14.151",
  "usedBy": "---"
 },
 {
  "id": "AST-47",
  "name": "motadata14.15",
  "assetType": "Linux Desktop",
  "status": "In Use",
  "hostName": "motadata14.15",
  "ipAddress": "172.16.14.15",
  "usedBy": "---"
 },
 {
  "id": "AST-46",
  "name": "limus",
  "assetType": "Linux Desktop",
  "status": "In Use",
  "hostName": "---",
  "ipAddress": "---",
  "usedBy": "---"
 },
 {
  "id": "AST-44",
  "name": "332test",
  "assetType": "Hardware",
  "status": "In Use",
  "hostName": "---",
  "ipAddress": "---",
  "usedBy": "---"
 },
 {
  "id": "AST-42",
  "name": "custom",
  "assetType": "Hardware",
  "status": "In Use",
  "hostName": "---",
  "ipAddress": "---",
  "usedBy": "---"
 },
 {
  "id": "AST-41",
  "name": "debian",
  "assetType": "Linux Desktop",
  "status": "In Use",
  "hostName": "debian",
  "ipAddress": "172.16.12.57",
  "usedBy": "---"
 },
 {
  "id": "AST-40",
  "name": "e",
  "assetType": "Hardware",
  "status": "In Use",
  "hostName": "---",
  "ipAddress": "---",
  "usedBy": "---"
 },
 {
  "id": "AST-35",
  "name": "flotomate",
  "assetType": "Linux Desktop",
  "status": "In Use",
  "hostName": "flotomate",
  "ipAddress": "172.16.15.185",
  "usedBy": "---"
 }
];
export const CIS_185 = [
 {
  "id": "CI-223",
  "name": "DESKTOP-33GFPJ9",
  "ciType": "Windows Desktop",
  "status": "Operational",
  "hostName": "DESKTOP-33GFPJ9",
  "ipAddress": "172.20.21.31",
  "createdDate": "Fri, Oct 23, 2026 11:29 AM"
 },
 {
  "id": "CI-222",
  "name": "win25dc",
  "ciType": "Windows Server",
  "status": "Operational",
  "hostName": "win25dc",
  "ipAddress": "172.16.14.181",
  "createdDate": "Thu, Oct 22, 2026 05:26 PM"
 },
 {
  "id": "CI-221",
  "name": "win22dc",
  "ciType": "Windows Server",
  "status": "Operational",
  "hostName": "win22dc",
  "ipAddress": "172.16.14.178",
  "createdDate": "Thu, Oct 22, 2026 05:26 PM"
 },
 {
  "id": "CI-220",
  "name": "win22mem",
  "ciType": "Windows Server",
  "status": "Operational",
  "hostName": "win22mem",
  "ipAddress": "172.16.14.179",
  "createdDate": "Thu, Oct 22, 2026 05:26 PM"
 },
 {
  "id": "CI-219",
  "name": "win22stand",
  "ciType": "Windows Server",
  "status": "Operational",
  "hostName": "win22stand",
  "ipAddress": "172.16.14.180",
  "createdDate": "Thu, Oct 22, 2026 05:26 PM"
 },
 {
  "id": "CI-218",
  "name": "win19standalone",
  "ciType": "Windows Server",
  "status": "Operational",
  "hostName": "win19standalone",
  "ipAddress": "172.16.14.174",
  "createdDate": "Thu, Oct 22, 2026 05:11 PM"
 },
 {
  "id": "CI-216",
  "name": "motadata",
  "ciType": "Linux Desktop",
  "status": "Operational",
  "hostName": "motadata",
  "ipAddress": "172.16.14.75",
  "createdDate": "Thu, Oct 22, 2026 01:05 PM"
 },
 {
  "id": "CI-215",
  "name": "motadata",
  "ciType": "Linux Desktop",
  "status": "Operational",
  "hostName": "motadata",
  "ipAddress": "172.16.13.93",
  "createdDate": "Wed, Oct 21, 2026 01:09 PM"
 },
 {
  "id": "CI-214",
  "name": "motadata",
  "ciType": "Linux Desktop",
  "status": "Operational",
  "hostName": "motadata",
  "ipAddress": "172.16.14.60",
  "createdDate": "Wed, Oct 21, 2026 12:30 PM"
 },
 {
  "id": "CI-213",
  "name": "zeel-patel-Latitude-5420",
  "ciType": "Linux Laptop",
  "status": "Operational",
  "hostName": "zeel-patel-Latitude-5420",
  "ipAddress": "10.20.40.217",
  "createdDate": "Wed, Oct 21, 2026 10:30 AM"
 },
 {
  "id": "CI-212",
  "name": "DESKTOP-29IHL0P",
  "ciType": "Windows Laptop",
  "status": "Operational",
  "hostName": "DESKTOP-29IHL0P",
  "ipAddress": "10.20.40.161",
  "createdDate": "Mon, Oct 19, 2026 02:30 PM"
 },
 {
  "id": "CI-211",
  "name": "win19mem",
  "ciType": "Windows Server",
  "status": "Operational",
  "hostName": "win19mem",
  "ipAddress": "172.16.14.168",
  "createdDate": "Thu, Oct 15, 2026 05:18 PM"
 },
 {
  "id": "CI-210",
  "name": "win19dc",
  "ciType": "Windows Server",
  "status": "Operational",
  "hostName": "win19dc",
  "ipAddress": "172.16.14.165",
  "createdDate": "Thu, Oct 15, 2026 05:18 PM"
 },
 {
  "id": "CI-209",
  "name": "win16dc",
  "ciType": "Windows Server",
  "status": "Operational",
  "hostName": "win16dc",
  "ipAddress": "172.16.14.161",
  "createdDate": "Thu, Oct 15, 2026 05:18 PM"
 }
];
export const PATCHES_185 = [
 {
  "id": "PCH-7806",
  "name": "Update for Microsoft Defender Antivirus antimalware platform - KB4052623 (Version 4.18.26100.4) - Current Channel (Broad)",
  "category": "Definition Updates",
  "severity": "Unspecified",
  "approval": "Approved",
  "application": "[Microsoft Defender Antivirus]",
  "releaseDate": "Wed, Oct 28, 2026 01:09 AM",
  "kb": "4052623",
  "size": "96.86 MB",
  "uuid": "384C1FF3-D753-4745-9BAE-0A94011CE5A5"
 },
 {
  "id": "PCH-7803",
  "name": "Security Intelligence Update for Microsoft Defender Antivirus - KB2267602 (Version 1.463.1.0) - Current Channel (Broad)",
  "category": "Definition Updates",
  "severity": "Unspecified",
  "approval": "Approved",
  "application": "[Microsoft Defender Antivirus]",
  "releaseDate": "Wed, Oct 28, 2026 12:35 AM",
  "kb": "2267602",
  "size": "946.24 MB",
  "uuid": "341024D9-939C-4406-B4A1-C4E46C452B51"
 },
 {
  "id": "PCH-7786",
  "name": "Security Intelligence Update for Microsoft Defender Antivirus - KB2267602 (Version 1.461.217.0) - Current Channel (Broad)",
  "category": "Definition Updates",
  "severity": "Unspecified",
  "approval": "Approved",
  "application": "[Microsoft Defender Antivirus]",
  "releaseDate": "Tue, Oct 27, 2026 01:05 AM",
  "kb": "2267602",
  "size": "957.39 MB",
  "uuid": "D4F5A75F-EBC8-44F8-95CC-6C59595C0777"
 },
 {
  "id": "PCH-7542",
  "name": "Update for Microsoft Defender Antivirus antimalware platform - KB4052623 (Version 4.18.26100.4) - Current Channel (Staged)",
  "category": "Definition Updates",
  "severity": "Unspecified",
  "approval": "Approved",
  "application": "[Microsoft Defender Antivirus]",
  "releaseDate": "Wed, Oct 21, 2026 05:32 PM",
  "kb": "4052623",
  "size": "96.86 MB",
  "uuid": "DFD914F2-4EE9-4C8C-B4DB-3A1BA29550EF"
 },
 {
  "id": "PCH-7535",
  "name": "2026-09 Cumulative Update for Microsoft server operating system version 21H2 for x64-based Systems (KB5129237)",
  "category": "Updates",
  "severity": "Unspecified",
  "approval": "Approved",
  "application": "[Microsoft Server operating system-21H2]",
  "releaseDate": "Mon, Sep 14, 2026 05:00 PM",
  "kb": "5129237",
  "size": "587.19 MB",
  "uuid": "5E84B275-7092-42F6-99BD-F74A4E33F113"
 },
 {
  "id": "PCH-7534",
  "name": "2026-09 Cumulative Update for .NET Framework 3.5 and 4.8.1 for Microsoft server operating system version 21H2 for x64 (KB5126422)",
  "category": "Security Updates",
  "severity": "Important",
  "approval": "Approved",
  "application": "[Microsoft Server operating system-21H2]",
  "releaseDate": "Tue, Sep 08, 2026 05:00 PM",
  "kb": "5126422",
  "size": "79.94 MB",
  "uuid": "E0A03ED1-C84E-47CA-BB72-7882BD4795B6"
 },
 {
  "id": "PCH-7533",
  "name": "2026-09 Cumulative Update for .NET Framework 3.5, 4.8 and 4.8.1 for Microsoft server operating system version 21H2 for x64 (KB5126149)",
  "category": "Security Updates",
  "severity": "Important",
  "approval": "Approved",
  "application": "[Microsoft Server operating system-21H2]",
  "releaseDate": "Tue, Sep 08, 2026 05:00 PM",
  "kb": "5126149",
  "size": "159.92 MB",
  "uuid": "D283E96A-5C3F-4381-B9FD-9C591C5AE0F2"
 },
 {
  "id": "PCH-7525",
  "name": "2023-10 Servicing Stack Update for Windows 10 Version 22H2 for x64-based Systems (KB5031539)",
  "category": "Security Updates",
  "severity": "Critical",
  "approval": "Approved",
  "application": "[Windows 10, version 1903 and later]",
  "releaseDate": "Tue, Oct 10, 2023 05:00 PM",
  "kb": "5031539",
  "size": "16.14 MB",
  "uuid": "F4FCE270-A397-467F-B121-AA24991DA4E5"
 },
 {
  "id": "PCH-7524",
  "name": "2023-03 Update for Windows 10 Version 22H2 for x64-based Systems (KB5019180)",
  "category": "Updates",
  "severity": "Unspecified",
  "approval": "Approved",
  "application": "[Windows 10, version 1903 and later]",
  "releaseDate": "Thu, Mar 02, 2023 10:00 PM",
  "kb": "5019180",
  "size": "4.11 MB",
  "uuid": "7862196A-3287-4053-A137-63DCA1E78217"
 },
 {
  "id": "PCH-2654",
  "name": "Security Intelligence Update for Microsoft Defender Antivirus - KB2267602 (Version 1.459.268.0) - Current Channel (Broad)",
  "category": "Definition Updates",
  "severity": "Unspecified",
  "approval": "Approved",
  "application": "[Microsoft Defender Antivirus]",
  "releaseDate": "Fri, Sep 18, 2026 08:28 AM",
  "kb": "2267602",
  "size": "945.26 MB",
  "uuid": "2AFF5810-38D3-4B65-8E7F-63CCD3AD870D"
 },
 {
  "id": "PCH-2653",
  "name": "Update for Microsoft Defender Antivirus antimalware platform - KB4052623 (Version 4.18.26090.7) - Beta Channel - Prerelease",
  "category": "Definition Updates",
  "severity": "Unspecified",
  "approval": "Approved",
  "application": "[Microsoft Defender Antivirus]",
  "releaseDate": "Thu, Sep 17, 2026 11:45 PM",
  "kb": "4052623",
  "size": "95.76 MB",
  "uuid": "21AFB99C-062A-4041-AC4B-9B259B8E004E"
 },
 {
  "id": "PCH-2285",
  "name": "Opera Browser Update x64 exe (135.0.5973.92)",
  "category": "Updates",
  "severity": "Low",
  "approval": "Approved",
  "application": "[OPERA]",
  "releaseDate": "Fri, Sep 04, 2026 04:49 PM",
  "kb": "---",
  "size": "139.96 MB",
  "uuid": "opera-windows-x64-exe-135.0.5973.92"
 },
 {
  "id": "PCH-2019",
  "name": "WinRAR Update x64 exe (7.23)",
  "category": "Updates",
  "severity": "Low",
  "approval": "Approved",
  "application": "[WIN_RAR]",
  "releaseDate": "Sat, Jun 27, 2026 05:04 PM",
  "kb": "---",
  "size": "3.78 MB",
  "uuid": "win_rar-windows-x64-exe-7.23"
 },
 {
  "id": "PCH-174",
  "name": "Windows Malicious Software Removal Tool x64 - v5.143 (KB890830)",
  "category": "Update Rollups",
  "severity": "Unspecified",
  "approval": "Approved",
  "application": "[Windows Server 2012, Windows Server 2012 R2, Windows Server 2016, Windows 10 LTSB, Windows Server, version 1903 and later, Windows 10, version 1903 and later, Windows Server 2019, Windows 8.1, Windows 11]",
  "releaseDate": "Tue, Jul 14, 2026 05:00 PM",
  "kb": "890830",
  "size": "89.81 MB",
  "uuid": "14229217-FD17-4213-B2BC-6FE2BE68033B"
 },
 {
  "id": "PCH-168",
  "name": "demo1",
  "category": "Feature Packs",
  "severity": "Critical",
  "approval": "Approved",
  "application": "[Microsoft Windows 11 Pro, Microsoft Windows Server 2022 Standard Evaluation]",
  "releaseDate": "Wed, Aug 05, 2026 06:19 PM",
  "kb": "---",
  "size": "---",
  "uuid": "cf818fbe-c0e7-4c9f-918a-fc9133df7a33"
 }
];
export const PACKAGES_185 = [
 {
  "id": "PKG-10",
  "name": "docker latest",
  "arch": "64 BIT",
  "type": "Application"
 },
 {
  "id": "PKG-9",
  "name": "docker",
  "arch": "64 BIT",
  "type": "Application"
 },
 {
  "id": "PKG-8",
  "name": "Kubernetes Linux Latest",
  "arch": "---",
  "type": "Script"
 },
 {
  "id": "PKG-7",
  "name": "Kubernetes old Linux",
  "arch": "---",
  "type": "Script"
 },
 {
  "id": "PKG-6",
  "name": "Kubernetes Latest",
  "arch": "---",
  "type": "Script"
 },
 {
  "id": "PKG-5",
  "name": "Kubernetes old",
  "arch": "64 BIT",
  "type": "Script"
 },
 {
  "id": "PKG-4",
  "name": "Putty",
  "arch": "64 BIT",
  "type": "MSI/MSP"
 },
 {
  "id": "PKG-3",
  "name": "AnyDesk",
  "arch": "64 BIT",
  "type": "EXE"
 },
 {
  "id": "PKG-2",
  "name": "Zoho Assists",
  "arch": "64 BIT",
  "type": "EXE"
 },
 {
  "id": "PKG-1",
  "name": "Spotify",
  "arch": "64 BIT",
  "type": "EXE"
 }
];
export const REGISTRY_TEMPLATES_185 = [
 {
  "id": "REG-1",
  "name": "Disables Microsoft Reboot Notification",
  "description": "Disables the Microsoft reboot notification after installation of a patch"
 },
 {
  "id": "REG-2",
  "name": "Disable Winzip Updater",
  "description": "Disables the automatic updates of Winzip"
 },
 {
  "id": "REG-3",
  "name": "Disable Windows OS Upgrade",
  "description": "Disables the upgrade to the latest version of Windows through Windows Update"
 },
 {
  "id": "REG-4",
  "name": "Disable Windows Error Reporting",
  "description": "Disables the Windows Error Reporting"
 },
 {
  "id": "REG-5",
  "name": "Disable Windows 10 Peer to Peer Update",
  "description": "Disables peer to peer patch updates for Windows 10"
 },
 {
  "id": "REG-6",
  "name": "Disable Windows 10 Notification",
  "description": "Disables Windows 10 Upgrade Notification"
 },
 {
  "id": "REG-7",
  "name": "Disable Skype Updater",
  "description": "Disables the automatic updates of Skype"
 },
 {
  "id": "REG-8",
  "name": "Disable Office 365 Updates",
  "description": "Disables the automatic updates of Office 365"
 },
 {
  "id": "REG-9",
  "name": "Disable CCleaner Updater",
  "description": "Disables the automatic updates of CCleaner"
 },
 {
  "id": "REG-10",
  "name": "Disable Automatic Updates",
  "description": "Disables the Windows automatic updates"
 },
 {
  "id": "REG-11",
  "name": "Disable Automatic Java Updates",
  "description": "Disables the automatic updates of Java"
 },
 {
  "id": "REG-12",
  "name": "Disable Automatic Delivery of IE 11",
  "description": "Disables Internet Explorer from upgrading to version 11 through Windows (updates"
 },
 {
  "id": "REG-13",
  "name": "Disable Automatic Delivery of IE 10",
  "description": "Disables Internet Explorer from upgrading to version 10 through Windows updates"
 },
 {
  "id": "REG-14",
  "name": "Disable Automatic App Updates",
  "description": "Disables automatic updates of windows apps."
 },
 {
  "id": "REG-15",
  "name": "Disable Auto Update of Google Chrome",
  "description": "Disables automatic update of Google Chrome"
 }
];
export const OFFICES_185 = [
 {
  "id": "12th floor left",
  "comm": "---",
  "dsIp": "---",
  "port": "---",
  "managed": 4
 },
 {
  "id": "Local Office",
  "comm": "---",
  "dsIp": "---",
  "port": "---",
  "managed": 17
 }
];
export const ENDPOINTS_185 = [
 {
  "id": "EP-22",
  "hostName": "DESKTOP-29IHL0P",
  "ipAddress": "10.20.40.161",
  "poller": "---",
  "credentialProfile": "Default",
  "osName": "Microsoft Windows 10 Pro",
  "version": "8.7.800",
  "servicePack": "None",
  "architecture": "64 BIT",
  "reboot": "No",
  "office": "Local Office"
 },
 {
  "id": "EP-18",
  "hostName": "Nirali-Kevlani",
  "ipAddress": "10.20.41.216",
  "poller": "---",
  "credentialProfile": "Default",
  "osName": "Microsoft Windows 11 Pro",
  "version": "8.7.500",
  "servicePack": "None",
  "architecture": "64 BIT",
  "reboot": "Yes",
  "office": "12th floor left"
 },
 {
  "id": "EP-15",
  "hostName": "Nirali-Kevlani",
  "ipAddress": "172.20.10.2",
  "poller": "---",
  "credentialProfile": "Default",
  "osName": "Microsoft Windows 11 Pro",
  "version": "8.7.500",
  "servicePack": "None",
  "architecture": "64 BIT",
  "reboot": "No",
  "office": "12th floor left"
 },
 {
  "id": "EP-6",
  "hostName": "WIN-400A8KHMR82",
  "ipAddress": "172.16.14.111",
  "poller": "---",
  "credentialProfile": "Default",
  "osName": "Microsoft Windows Server 2022 Standard Evaluation",
  "version": "8.7.800",
  "servicePack": "None",
  "architecture": "64 BIT",
  "reboot": "No",
  "office": "12th floor left"
 },
 {
  "id": "EP-2",
  "hostName": "DESKTOP-PMG",
  "ipAddress": "10.20.40.72",
  "poller": "---",
  "credentialProfile": "Default",
  "osName": "Microsoft Windows 11 Pro",
  "version": "8.7.700",
  "servicePack": "None",
  "architecture": "64 BIT",
  "reboot": "No",
  "office": "Local Office"
 },
 {
  "id": "EP-1",
  "hostName": "DESKTOP-5JPPI6F",
  "ipAddress": "192.168.29.100",
  "poller": "---",
  "credentialProfile": "Default",
  "osName": "Microsoft Windows 11 Pro",
  "version": "8.7.406",
  "servicePack": "None",
  "architecture": "64 BIT",
  "reboot": "Yes",
  "office": "Local Office"
 }
];
