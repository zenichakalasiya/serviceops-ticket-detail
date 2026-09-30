/* Admin module — information architecture.
 *
 * Mirrors the Admin hub of the live ServiceOps build: a grouped left nav, and an Overview that
 * lists every settings area as a collapsible section of module cards. Section titles, card
 * titles, descriptions and routes are the real ones; icons are mapped from the card title so the
 * set stays meaningful without hand-picking 161 of them.
 *
 * Card counts by section are the source of truth for the Overview — the sidebar renders the same
 * sections, so the two can never drift.
 */

export interface AdminCard {
  title: string;
  desc: string;
  /** lucide-react icon name, resolved through ADMIN_ICONS. */
  icon: string;
  /** Route on the real product — kept so the prototype's links stay truthful. */
  href: string;
  /** Level-3 submodules. Rendered WITHOUT icons, grouped by a left rail — see SIDEBAR_TREE. */
  children?: { title: string; href: string }[];
}

/* ── Sidebar depth ─────────────────────────────────────────────────────────
 *
 * The admin nav is three levels deep, and each level looks different on purpose:
 *
 *   Level 1  section        icon + chevron   e.g. Automation, BOM Management
 *   Level 2  module         icon             e.g. Workflow, SLA, BOM Licensing
 *   Level 3  submodule      NO icon, left rail joining the group
 *
 * Only sections listed here expand in the nav; every other section stays a single row that
 * scrolls the Overview, exactly as before. Expansion is opt-in per section rather than automatic
 * for all 24, because a section only earns its own nav branch once its modules are real screens.
 */
export const SIDEBAR_TREE: string[] = ['Request Management', 'BOM Management', 'Patch Management', 'Organization', 'Support Channels'];

export const isTreeSection = (title: string) => SIDEBAR_TREE.includes(title);

export interface AdminSection {
  key: string;
  title: string;
  desc: string;
  icon: string;
  cards: AdminCard[];
}

/** Sidebar grouping, in the order the live admin shows it. */
export const ADMIN_NAV: { group: string; items: string[] }[] = [
  { group: 'Intelligent Automation', items: ['Automation', 'AI'] },
  { group: 'Platform Configuration', items: ['Users', 'Organization', 'Support Channels', 'User Survey'] },
  { group: 'Service Desk', items: ['Request Management', 'Service Catalog', 'Problem Management', 'Change Management', 'Release Management', 'Knowledge Management', 'Task Management'] },
  { group: 'IT Operations', items: ['CMDB', 'Discovery And Agents', 'Patch Management', 'Asset Management', 'Vulnerability Management', 'BOM Management', 'OS Deployment'] },
  { group: 'Vendor & Procurement', items: ['Supplier Management', 'Contract Management', 'Purchase Management'] },
  { group: 'Project Delivery', items: ['Project Management'] },
];

export const ADMIN_SECTIONS: AdminSection[] = [
  {
    key: 'automation',
    title: 'Automation',
    desc: 'Configure rules, workflows, and schedules that automate service operations.',
    icon: 'Cog',
    cards: [
    { title: 'Workflow', desc: 'Build rule-based flows that route and act on requests.', icon: 'Workflow', href: '/admin/workflow' },
    { title: 'SLA', desc: 'Set response and resolution targets with breach actions.', icon: 'Timer', href: '/admin/sla' },
    { title: 'Approval Workflow', desc: 'Define multi-stage approvals across any module.', icon: 'Workflow', href: '/admin/approval-workflow' },
    { title: 'Event Notifications', desc: 'Send alerts when system events trigger.', icon: 'Bell', href: '/admin/event-notifications?type=emailNotification' },
    { title: 'Auto Assignment', desc: 'Route work using round-robin or load-balanced logic.', icon: 'UserCheck', href: '/admin/auto-assignment' },
    { title: 'Scenario', desc: 'Run multiple actions on a request in one click.', icon: 'Zap', href: '/admin/scenario' },
    { title: 'Incident Schedules', desc: 'Schedule recurring incidents for planned maintenance.', icon: 'CalendarClock', href: '/admin/auto-ticket-create' },
    { title: 'Task Schedule', desc: 'Schedule recurring tasks for automatic creation.', icon: 'CalendarClock', href: '/admin/auto-task-create' },
    { title: 'Integrations', desc: 'Connect third-party tools via API and plugins.', icon: 'Plug', href: '/admin/integration?tab=rest_integration' },
    { title: 'Custom Script', desc: 'Add scripts to extend form behavior.', icon: 'Code', href: '/admin/form-rules/custom-script' },
    ],
  },
  {
    key: 'users',
    title: 'Users',
    desc: 'Manage technicians, requesters, groups, roles, and authentication.',
    icon: 'Users',
    cards: [
    { title: 'Technicians', desc: 'Create and manage technician profiles, roles, and access.', icon: 'Users', href: '/admin/users/technician' },
    { title: 'Requesters', desc: 'Create and manage requester profiles and access.', icon: 'Users', href: '/admin/users/requester' },
    { title: 'User Form', desc: 'Customize user profile fields and form layout.', icon: 'FileText', href: '/admin/form/user' },
    { title: 'Technician Groups', desc: 'Organize technicians into teams for routing and assignment.', icon: 'UsersRound', href: '/admin/user-groups/technician' },
    { title: 'Requester Groups', desc: 'Group requesters to control portal visibility and access.', icon: 'UsersRound', href: '/admin/user-groups/requester' },
    { title: 'Roles', desc: 'Define granular permissions for technician operations.', icon: 'KeyRound', href: '/admin/roles' },
    { title: 'LDAP Configurations', desc: 'Sync users and credentials from LDAP or Active Directory.', icon: 'Fingerprint', href: '/admin/support-channels/ldap-configurations' },
    { title: 'SSO Configuration', desc: 'Enable single sign-on with standard enterprise identity providers.', icon: 'Fingerprint', href: '/admin/support-channels/sso-configuration?tab=identity_provider' },
    { title: 'SCIM Provisioning', desc: 'Automate user provisioning and de-provisioning via identity providers.', icon: 'Fingerprint', href: '/admin/support-channels/scim-provisioning' },
    { title: 'Custom SSO Configuration', desc: 'Configure SSO for custom authentication tools and proprietary login systems.', icon: 'Fingerprint', href: '/admin/support-channels/custom-sso-configuration?tab=login_provider' },
    { title: 'Custom Scope Configuration', desc: 'Customize the scope of the end-user portal.', icon: 'Settings2', href: '/admin/custom-scope-configuration?tab=request' },
    ],
  },
  {
    key: 'organization',
    title: 'Organization',
    desc: 'Set up account details, branding, business hours, and global preferences.',
    icon: 'Building2',
    cards: [
    { title: 'Account', desc: 'Edit core account details for your ServiceOps instance.', icon: 'Settings2', href: '/admin/organization/account' },
    { title: 'Branding', desc: 'Customize portal logo, colors, and theme to match your brand.', icon: 'Palette', href: '/admin/organization/branding?tab=details' },
    { title: 'Departments', desc: 'Define departments for reporting, routing, and access control.', icon: 'Building2', href: '/admin/organization/department' },
    { title: 'Locations', desc: 'Define physical locations referenced across ServiceOps.', icon: 'MapPin', href: '/admin/organization/location' },
    { title: 'Business Hours', desc: 'Set operating hours used to calculate SLAs and schedules.', icon: 'Clock', href: '/admin/business-hours' },
    { title: 'Announcements', desc: 'Broadcast news and alerts on the user dashboard.', icon: 'Megaphone', href: '/admin/organization/announcements' },
    { title: 'Business Service', desc: 'Map IT services to business functions for impact analysis.', icon: 'Layers', href: '/admin/business-service' },
    { title: 'Leave Management', desc: 'Track technician time-off to balance workload and routing.', icon: 'Clock', href: '/admin/organization/leave-management?tab=leave_type' },
    { title: 'System Preference', desc: 'Configure global system settings and default behaviors.', icon: 'Settings2', href: '/admin/organization/system-preference?tab=user_preference' },
    { title: 'Security', desc: 'Enforce password policies and review security audit logs.', icon: 'Lock', href: '/admin/organization/security?tab=configuration_activity' },
    { title: 'Priority', desc: 'Define priority levels for triaging incoming requests.', icon: 'SlidersHorizontal', href: '/admin/organization/priority' },
    { title: 'Impact', desc: 'Define impact levels representing business effect.', icon: 'SlidersHorizontal', href: '/admin/organization/impact' },
    { title: 'Urgency', desc: 'Define urgency levels representing required resolution speed.', icon: 'SlidersHorizontal', href: '/admin/organization/urgency' },
    { title: 'Application Maintenance', desc: 'Configure data archiving policies and network diagnostics.', icon: 'Database', href: '/admin/support-console?tab=dataindexing' },
    { title: 'Proxy Server Configuration', desc: 'Configure proxy settings for secure outbound traffic.', icon: 'Router', href: '/admin/organization/proxy-server-config' },
    { title: 'Managed Services Provider', desc: 'Run multiple companies and their support portals from one console.', icon: 'Layers', href: '/admin/organization/msp' },
    { title: 'Privacy Settings', desc: 'Configure consent workflows and data privacy controls (e.g., GDPR, POPIA).', icon: 'Lock', href: '/admin/organization/privacy-setting?tab=privacy_regulations' },
    { title: 'Digital Signature', desc: 'Configure digital signature providers and templates.', icon: 'Lock', href: '/admin/organization/digital-signature?tab=provider' },
    ],
  },
  {
    key: 'ai',
    title: 'AI',
    desc: 'Configure AI agents, suggestions, and governance across the service desk.',
    icon: 'Sparkles',
    cards: [
    { title: 'Governance', desc: 'Enforce policies and guardrails for responsible AI usage.', icon: 'Scale', href: '/admin/governance?tab=analytics' },
    { title: 'AI Studio', desc: 'Configure AI agents and teams with role-based goals and behavior.', icon: 'Sparkles', href: '/admin/ai-studio' },
    { title: 'Text Intelligence', desc: 'Analyze sentiment, summarize threads, and generate AI replies.', icon: 'Sparkles', href: '/admin/ai-text-intelligence' },
    { title: 'Knowledge Collections', desc: 'Train AI on files, websites, and internal knowledge sources.', icon: 'Lightbulb', href: '/admin/knowledge' },
    { title: 'Smart Suggestions', desc: 'Configure AI-driven recommendations across request workflows.', icon: 'Sparkles', href: '/admin/smart-suggestions?type=request' },
    ],
  },
  {
    key: 'support-channels',
    title: 'Support Channels',
    desc: 'Set up email, portal, chat, and virtual agent channels for user requests.',
    icon: 'Radio',
    cards: [
    { title: 'Emails', desc: 'Configure email servers and inbound mail rules.', icon: 'Mail', href: '/admin/support-channels/emails?tab=outgoing' },
    { title: 'Support Portal', desc: 'Customize the self-service portal for requesters.', icon: 'Globe', href: '/admin/support-channels/support-portal?tab=support_portals' },
    { title: 'Chat', desc: 'Enable live chat for real-time technician support.', icon: 'MessagesSquare', href: '/admin/support-channels/chat' },
    { title: 'Virtual Agent', desc: 'Design conversational flows for the AI virtual agent.', icon: 'Bot', href: '/admin/support-channels/ai-bot?tab=chat_flow' },
    ],
  },
  {
    key: 'request-management',
    title: 'Request Management',
    desc: 'Customize forms, statuses, templates, and rules for the request lifecycle.',
    icon: 'Ticket',
    cards: [
    { title: 'Request Form', desc: 'Customize form fields and layout for requests.', icon: 'FileText', href: '/admin/form/request' },
    { title: 'Request Status', desc: 'Define statuses to track the request lifecycle.', icon: 'CircleDot', href: '/admin/status?type=request' },
    { title: 'Priority Matrix', desc: 'Auto-set priority based on impact and urgency.', icon: 'SlidersHorizontal', href: '/admin/request-management/priority/matrix' },
    { title: 'Request Feedback Setting', desc: 'Configure when and how feedback is collected after closure.', icon: 'ClipboardList', href: '/admin/request-management/feedback-setting' },
    { title: 'Response Templates', desc: 'Create canned responses for faster technician replies.', icon: 'LayoutTemplate', href: '/admin/response-template' },
    { title: 'Email Command Settings', desc: 'Enable request updates through email commands.', icon: 'Mail', href: '/admin/request-management/email-command-settings' },
    { title: 'Request Categories', desc: 'Classify requests for routing and reporting.', icon: 'FolderTree', href: '/admin/category?type=request' },
    { title: 'Request Templates', desc: 'Pre-fill forms for common recurring requests.', icon: 'LayoutTemplate', href: '/admin/templates?type=request' },
    { title: 'Feedback Form', desc: 'Configure feedback forms used at request closure.', icon: 'FileText', href: '/admin/form/feedback' },
    { title: 'Incident Custom Rules', desc: 'Trigger field updates, notifications, and assignments on incidents.', icon: 'GitBranch', href: '/admin/custom-rules?type=request&subType=resolved' },
    { title: 'Service Request Custom Rules', desc: 'Trigger field updates, notifications, and assignments on service requests.', icon: 'GitBranch', href: '/admin/custom-rules?type=service_catalog&subType=resolved' },
    { title: 'Request Form Rule', desc: 'Show, hide, or require fields on request forms based on conditions.', icon: 'GitBranch', href: '/admin/form-rules/request' },
    { title: 'Source', desc: 'Define the channels through which requests originate.', icon: 'Inbox', href: '/admin/request-management/source' },
    { title: 'Request Model', desc: 'Configure automatic status transitions for requests.', icon: 'Workflow', href: '/admin/change-model/request' },
    { title: 'Print Template', desc: 'Design print layouts for request details and exports.', icon: 'LayoutTemplate', href: '/admin/print-template?type=request' },
    ],
  },
  {
    key: 'service-catalog',
    title: 'Service Catalog',
    desc: 'Build a catalog of requestable services with categories and access controls.',
    icon: 'BookOpen',
    cards: [
    { title: 'Service Catalog', desc: 'Build a catalog of requestable services with categories and access controls.', icon: 'Layers', href: '/service-catalog' },
    ],
  },
  {
    key: 'problem-management',
    title: 'Problem Management',
    desc: 'Configure forms, categories, and rules to manage recurring issues.',
    icon: 'AlertOctagon',
    cards: [
    { title: 'Problem Form', desc: 'Customize form fields to capture problem details.', icon: 'FileText', href: '/admin/form/problem' },
    { title: 'Problem Category', desc: 'Classify problems for trend analysis and reporting.', icon: 'FolderTree', href: '/admin/category?type=problem' },
    { title: 'Problem Status', desc: 'Define statuses for the problem lifecycle.', icon: 'CircleDot', href: '/admin/status?type=problem' },
    { title: 'Problem Form Rule', desc: 'Show, hide, or require fields on problem forms based on conditions.', icon: 'GitBranch', href: '/admin/form-rules/problem' },
    { title: 'Problem Template', desc: 'Pre-fill forms for common recurring problems.', icon: 'LayoutTemplate', href: '/admin/templates?type=problem' },
    { title: 'Problem Custom Rules', desc: 'Trigger field updates, notifications, and assignments on problems.', icon: 'GitBranch', href: '/admin/custom-rules?type=problem&subType=resolved' },
    { title: 'Problem Model', desc: 'Configure automatic status transitions for problems.', icon: 'Workflow', href: '/admin/change-model/problem' },
    ],
  },
  {
    key: 'change-management',
    title: 'Change Management',
    desc: 'Define forms, risks, and approvals to govern controlled deployments.',
    icon: 'RefreshCcw',
    cards: [
    { title: 'Change Form', desc: 'Customize form fields to capture change details.', icon: 'FileText', href: '/admin/form/change' },
    { title: 'Change Status', desc: 'Define statuses for the change lifecycle.', icon: 'CircleDot', href: '/admin/status?type=change' },
    { title: 'Change Custom Rules', desc: 'Trigger field updates, notifications, and assignments on changes.', icon: 'GitBranch', href: '/admin/custom-rules?type=change&subType=submitted' },
    { title: 'Change Form Rule', desc: 'Show, hide, or require fields on change forms based on conditions.', icon: 'GitBranch', href: '/admin/form-rules/change' },
    { title: 'Change Types', desc: 'Define change classifications (standard, normal, emergency).', icon: 'Shapes', href: '/admin/change-management/change-type' },
    { title: 'Target Environment', desc: 'Define environments where changes are deployed.', icon: 'Settings2', href: '/admin/change-management/target-environment' },
    { title: 'Change Category', desc: 'Classify changes for routing and reporting.', icon: 'FolderTree', href: '/admin/category?type=change' },
    { title: 'Change Template', desc: 'Pre-fill forms for common recurring changes.', icon: 'LayoutTemplate', href: '/admin/templates?type=change' },
    { title: 'Change Risk', desc: 'Define risk levels for change impact assessment.', icon: 'TriangleAlert', href: '/admin/change-management/risk-type' },
    { title: 'Change Reason', desc: 'Standardize justifications for proposed changes.', icon: 'MessageSquareQuote', href: '/admin/change-management/reason-type' },
    { title: 'Change Model', desc: 'Configure automatic status transitions for changes.', icon: 'Workflow', href: '/admin/change-model/change' },
    { title: 'Print Template', desc: 'Design print layouts for change details and exports.', icon: 'LayoutTemplate', href: '/admin/print-template?type=change' },
    ],
  },
  {
    key: 'release-management',
    title: 'Release Management',
    desc: 'Set up release types, risks, and templates for planned deployments.',
    icon: 'Rocket',
    cards: [
    { title: 'Release Form', desc: 'Customize form fields to capture release details.', icon: 'FileText', href: '/admin/form/release' },
    { title: 'Release Status', desc: 'Define statuses for the release lifecycle.', icon: 'CircleDot', href: '/admin/status?type=release' },
    { title: 'Release Category', desc: 'Classify releases for tracking and reporting.', icon: 'FolderTree', href: '/admin/category?type=release' },
    { title: 'Release Types', desc: 'Define release classifications (major, minor, patch).', icon: 'Shapes', href: '/admin/release-management/release-type' },
    { title: 'Release Risk', desc: 'Define risk levels for release impact assessment.', icon: 'TriangleAlert', href: '/admin/release-management/risk-type' },
    { title: 'Release Reason', desc: 'Standardize justifications for planned releases.', icon: 'MessageSquareQuote', href: '/admin/release-management/reason-type' },
    { title: 'Release Template', desc: 'Pre-fill forms for common recurring releases.', icon: 'LayoutTemplate', href: '/admin/templates?type=release' },
    { title: 'Release Custom Rules', desc: 'Trigger field updates, notifications, and assignments on releases.', icon: 'GitBranch', href: '/admin/custom-rules?type=release&subType=submitted' },
    { title: 'Release Model', desc: 'Configure automatic status transitions for releases.', icon: 'Workflow', href: '/admin/change-model/release' },
    ],
  },
  {
    key: 'asset-management',
    title: 'Asset Management',
    desc: 'Configure asset types, statuses, groups, and discovery for lifecycle tracking.',
    icon: 'Boxes',
    cards: [
    { title: 'Asset Types', desc: 'Define and classify hardware asset types.', icon: 'Shapes', href: '/admin/asset-management/asset-types?moduleName=asset&type=assettype' },
    { title: 'Asset Status', desc: 'Define statuses for the asset lifecycle.', icon: 'CircleDot', href: '/admin/status?type=asset' },
    { title: 'Asset Custom Rules', desc: 'Trigger field updates, notifications, and assignments on assets.', icon: 'GitBranch', href: '/admin/custom-rules?type=asset' },
    { title: 'Asset Form Rule', desc: 'Show, hide, or require fields on asset forms based on conditions.', icon: 'GitBranch', href: '/admin/form-rules/asset' },
    { title: 'Asset Group', desc: 'Organize assets into logical groups for management.', icon: 'UsersRound', href: '/admin/asset-management/asset-group?moduleName=asset' },
    { title: 'Software Category', desc: 'Group software assets into categories and subcategories.', icon: 'FolderTree', href: '/admin/asset-management/software-category' },
    { title: 'Software Types', desc: 'Define and classify software asset types.', icon: 'Shapes', href: '/admin/asset-management/software-type' },
    { title: 'Software Rules', desc: 'Set rules to restrict and normalize software assets.', icon: 'GitBranch', href: '/admin/asset-management/software-rules?tab=software_type_settings' },
    { title: 'Software License Custom Fields', desc: 'Add custom fields to capture software license details.', icon: 'BadgeCheck', href: '/admin/form/software_license' },
    { title: 'RDP Configurations', desc: 'Set up remote desktop access for managed assets.', icon: 'MonitorSmartphone', href: '/admin/asset-management/rdp-configuration' },
    { title: 'Barcode', desc: 'Configure barcode generation for asset identification.', icon: 'ScanLine', href: '/admin/asset-management/barcode' },
    { title: 'QR Code', desc: 'Configure QR code generation for asset scanning.', icon: 'ScanLine', href: '/admin/asset-management/qrcode?tab=qr_code_preference' },
    { title: 'Asset Movement', desc: 'Track physical location changes for assets.', icon: 'Boxes', href: '/admin/asset-management/asset-movement' },
    { title: 'Asset Movement Custom Fields', desc: 'Add custom fields to capture asset movement details.', icon: 'Boxes', href: '/admin/form/asset_movement' },
    { title: 'Manage Baselines', desc: 'Define configuration baselines and detect deviations.', icon: 'GitCompare', href: '/admin/asset-management/manage-baseline' },
    { title: 'Wake On LAN', desc: 'Remotely power on devices for scheduled maintenance.', icon: 'MonitorSmartphone', href: '/admin/asset-management/wake-on-lan' },
    { title: 'Asset Configuration', desc: 'Manage USB configurations across managed devices.', icon: 'Boxes', href: '/admin/asset-management/asset-configuration?tab=usb_configuration' },
    { title: 'Geolocation', desc: 'Track current and last known location of assets on a map.', icon: 'MapPin', href: '/admin/asset-management/geolocation?tab=geolocation_preference' },
    { title: 'Print Template', desc: 'Design print layouts for asset details and exports.', icon: 'LayoutTemplate', href: '/admin/print-template?type=asset' },
    { title: 'Asset Category', desc: 'Group assets into categories for reporting.', icon: 'FolderTree', href: '/admin/category?type=asset' },
    ],
  },
  {
    key: 'supplier-management',
    title: 'Supplier Management',
    desc: 'Maintain vendors, manufacturers, product catalogs, and warranty data.',
    icon: 'Truck',
    cards: [
    { title: 'Manufacturer Catalog', desc: 'Maintain a list of approved hardware manufacturers.', icon: 'Truck', href: '/admin/asset-management/manufacturer-catalog' },
    { title: 'Product Types', desc: 'Classify products for catalog and asset records.', icon: 'Shapes', href: '/admin/asset-management/product-type' },
    { title: 'Product Catalog', desc: 'Maintain the catalog of standard products.', icon: 'Package', href: '/admin/asset-management/product-catalog' },
    { title: 'Product Custom Fields', desc: 'Add custom fields to capture product details.', icon: 'Package', href: '/admin/form/product' },
    { title: 'Vendor Catalog', desc: 'Maintain profiles of external vendors and suppliers.', icon: 'Truck', href: '/admin/asset-management/vendor-catalog' },
    { title: 'Vendor Custom Fields', desc: 'Add custom fields to capture vendor details.', icon: 'Truck', href: '/admin/form/vendor' },
    { title: 'Warranty Sync', desc: 'Auto-fetch warranty details from vendor portals and databases.', icon: 'BadgeCheck', href: '/admin/asset-management/warranty-sync' },
    { title: 'EOSL Sync Setting', desc: 'Sync end-of-service-life data for assets.', icon: 'BadgeCheck', href: '/admin/asset-management/eosl-sync-setting?tab=update_eosl_db' },
    ],
  },
  {
    key: 'bom-management',
    title: 'BOM Management',
    desc: 'Schedule automatic BOM generation and manage BOM policies for connected devices.',
    icon: 'Boxes',
    cards: [
    { title: 'BOM Licensing', desc: 'Enrol CIs for BOM generation — start here; decide participation by usage.', icon: 'Lock', href: '/admin/bom-licensing' },
    { title: 'BOM Scheduler', desc: 'Auto-generate SBOMs for enrolled CIs on a schedule.', icon: 'CalendarClock', href: '/admin/bom-scheduler' },
    { title: 'BOM Retention', desc: 'How many living-SBOM versions to keep per CI, and for how long.', icon: 'SlidersHorizontal', href: '/admin/bom-retention' },
    ],
  },
  {
    key: 'cmdb',
    title: 'CMDB',
    desc: 'Define CI types, statuses, groups, and relationships for dependency mapping.',
    icon: 'Network',
    cards: [
    { title: 'CI Type', desc: 'Define types of configuration items.', icon: 'Shapes', href: '/admin/asset-management/ci-types?moduleName=cmdb&type=citype' },
    { title: 'CI Status', desc: 'Track lifecycle stages of configuration items.', icon: 'CircleDot', href: '/admin/status?type=cmdb' },
    { title: 'CI Group', desc: 'Group CIs for management and reporting.', icon: 'UsersRound', href: '/admin/asset-management/ci-group?moduleName=cmdb' },
    { title: 'CI Custom Rules', desc: 'Trigger field updates and notifications on configuration items.', icon: 'GitBranch', href: '/admin/custom-rules?type=asset&from=cmdb' },
    ],
  },
  {
    key: 'discovery-and-agents',
    title: 'Discovery And Agents',
    desc: 'Configure discovery scans, agents, credentials, and IP-range patterns.',
    icon: 'Radar',
    cards: [
    { title: 'Discovery', desc: 'Configure network scans to discover assets and CIs.', icon: 'Radar', href: '/admin/asset-management/discovery?tab=discovery_service' },
    { title: 'Agent', desc: 'Configure settings for installed discovery agents.', icon: 'Bot', href: '/admin/asset-management/agent?tab=agent_installation' },
    { title: 'Endpoint Management', desc: 'Manage and monitor endpoint devices.', icon: 'MonitorSmartphone', href: '/admin/asset-management/endpoint-management?tab=endpoint_scopes' },
    { title: 'Credentials', desc: 'Store and manage credentials used for network scanning.', icon: 'KeyRound', href: '/admin/asset-management/credentials' },
    { title: 'Discovery Pattern', desc: 'Define patterns to identify and classify network devices.', icon: 'Radar', href: '/admin/workflow-definition' },
    { title: 'SNMP Custom Properties', desc: 'Configure SNMP properties to capture device data.', icon: 'Router', href: '/admin/asset-management/snmp-custom-properties' },
    { title: 'IP Range Location', desc: 'Map IP address ranges to physical locations.', icon: 'MapPin', href: '/admin/asset-management/ip-range-location' },
    { title: 'Relationship Types', desc: 'Define dependency relationships between assets and CIs.', icon: 'Shapes', href: '/admin/asset-management/asset-relationship-types' },
    ],
  },
  {
    key: 'contract-management',
    title: 'Contract Management',
    desc: 'Define contract types and custom fields to track vendor agreements.',
    icon: 'FileSignature',
    cards: [
    { title: 'Contract Types', desc: 'Categorize contracts (lease, maintenance, subscription).', icon: 'Shapes', href: '/admin/contract-management/contract-types' },
    { title: 'Contract Custom Fields', desc: 'Add custom fields to capture contract details.', icon: 'FileSignature', href: '/admin/form/contract' },
    ],
  },
  {
    key: 'purchase-management',
    title: 'Purchase Management',
    desc: 'Configure purchase fields, pricing components, and approval rules.',
    icon: 'ShoppingCart',
    cards: [
    { title: 'Purchase Custom Fields', desc: 'Add custom fields to capture purchase order details.', icon: 'ShoppingCart', href: '/admin/form/purchase' },
    { title: 'Purchase Price Fields', desc: 'Configure pricing components like tax, shipping, and discounts.', icon: 'ShoppingCart', href: '/admin/form/purchase?fieldType=price' },
    { title: 'GL Code', desc: 'Maintain General Ledger codes for accounting alignment.', icon: 'ShoppingCart', href: '/admin/purchase-management/gl-code' },
    { title: 'Cost Center', desc: 'Track expenses against departments and cost centers.', icon: 'ShoppingCart', href: '/admin/purchase-management/cost-center' },
    { title: 'Purchase Custom Rules', desc: 'Trigger field updates and notifications on purchase orders.', icon: 'GitBranch', href: '/admin/custom-rules?type=purchase&subType=sent_for_approval' },
    { title: 'Print Template', desc: 'Design print layouts for purchase order details and exports.', icon: 'LayoutTemplate', href: '/admin/print-template?type=purchase' },
    { title: 'Address', desc: 'Maintain billing and shipping addresses.', icon: 'MapPin', href: '/admin/purchase-management/address' },
    ],
  },
  {
    key: 'vulnerability-management',
    title: 'Vulnerability Management',
    desc: 'Manage vulnerability database sync, scheduling, proxy, notifications, and audit trails.',
    icon: 'ShieldAlert',
    cards: [
    { title: 'Vulnerability Settings', desc: 'Configure database update schedules, proxy, notifications, and review update audit history.', icon: 'ShieldAlert', href: '/admin/vulnerability-management/vulnerability-settings?tab=vulnerability_database' },
    ],
  },
  {
    key: 'patch-management',
    title: 'Patch Management',
    desc: 'Set up patch sources, deployment policies, and endpoint health rules.',
    icon: 'ShieldCheck',
    cards: [
    { title: 'Patch Administration', desc: 'Configure patch sources, approvals, and distribution settings.', icon: 'ShieldCheck', href: '/admin/patch-management/patch-settings?tab=patch_repository' },
    { title: 'Deployment Management', desc: 'Control how and where patches are deployed to endpoints.', icon: 'MonitorDown', href: '/admin/patch-management/deployment-management?tab=deployment_policy' },
    { title: 'System Health Settings', desc: 'Define criteria to assess and tag endpoint health.', icon: 'Settings2', href: '/admin/patch-management/system-health-settings' },
    { title: 'Packages', desc: 'Build and deploy custom software packages to managed endpoints.', icon: 'Package', href: '/admin/packages' },
    { title: 'OS Upgrade', desc: 'Configure and schedule operating system upgrade deployments.', icon: 'MonitorUp', href: '/admin/patch-management/os-upgrade' },
    { title: 'Registry Templates', desc: 'Define registry configurations applied to endpoints.', icon: 'LayoutTemplate', href: '/admin/registry-template' },
    ],
  },
  {
    key: 'os-deployment',
    title: 'OS Deployment',
    desc: 'Deploy operating system images across your devices.',
    icon: 'MonitorDown',
    cards: [
    { title: 'Image', desc: 'View and manage existing OS images added to the system for deployment tasks.', icon: 'MonitorDown', href: '/admin/os-deployment/images' },
    { title: 'Deployment', desc: 'Define deployment  by selecting the OS image and target machine.', icon: 'MonitorDown', href: '/admin/os-deployment/deployment' },
    ],
  },
  {
    key: 'project-management',
    title: 'Project Management',
    desc: 'Configure project types, forms, risks, and roles for IT initiatives.',
    icon: 'FolderKanban',
    cards: [
    { title: 'Project Role', desc: 'Define roles and permissions for project members.', icon: 'KeyRound', href: '/admin/roles?moduleName=project' },
    { title: 'Project Form', desc: 'Customize form fields to capture project details.', icon: 'FileText', href: '/admin/form/project' },
    { title: 'Project Risk', desc: 'Define risk levels for project impact assessment.', icon: 'TriangleAlert', href: '/admin/project-management/risk-type' },
    { title: 'Project Types', desc: 'Define classifications for different project initiatives.', icon: 'Shapes', href: '/admin/project-management/project-type' },
    { title: 'Project Custom Rules', desc: 'Trigger field updates, notifications, and assignments on projects.', icon: 'GitBranch', href: '/admin/custom-rules?type=project&subType=planning' },
    ],
  },
  {
    key: 'knowledge-management',
    title: 'Knowledge Management',
    desc: 'Define rules and workflows for authoring and governing knowledge articles.',
    icon: 'Lightbulb',
    cards: [
    { title: 'Knowledge Custom Rules', desc: 'Trigger validations and actions on knowledge articles.', icon: 'GitBranch', href: '/admin/custom-rules?type=knowledge&subType=publish' },
    ],
  },
  {
    key: 'user-survey',
    title: 'User Survey',
    desc: 'Build and schedule feedback surveys to measure user satisfaction.',
    icon: 'ClipboardList',
    cards: [
    { title: 'User Surveys', desc: 'Build surveys to measure user satisfaction and feedback.', icon: 'ClipboardList', href: '/admin/user-survey' },
    { title: 'Schedule Survey', desc: 'Automate the delivery of recurring surveys.', icon: 'CalendarClock', href: '/admin/user-survey/schedule-survey' },
    ],
  },
  {
    key: 'task-management',
    title: 'Task Management',
    desc: 'Configure task types, forms, statuses, and rules for operational work.',
    icon: 'ListChecks',
    cards: [
    { title: 'Task Types', desc: 'Classify tasks for organization and reporting.', icon: 'Shapes', href: '/admin/organization/task-type' },
    { title: 'Task Form', desc: 'Customize form fields to capture task details.', icon: 'FileText', href: '/admin/form/task' },
    { title: 'Task Form Rule', desc: 'Show, hide, or require fields on task forms based on conditions.', icon: 'GitBranch', href: '/admin/form-rules/task' },
    { title: 'Task Status', desc: 'Define statuses to track the task lifecycle.', icon: 'CircleDot', href: '/admin/status?type=task' },
    ],
  },
];

/** Section lookup by title — the sidebar uses it to jump to a section on the Overview. */
export const sectionByTitle = (title: string) => ADMIN_SECTIONS.find((s) => s.title === title);

export const ADMIN_TOTAL_CARDS = ADMIN_SECTIONS.reduce((n, s) => n + s.cards.length, 0);
