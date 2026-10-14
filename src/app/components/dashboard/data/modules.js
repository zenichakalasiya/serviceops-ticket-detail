/**
 * The ServiceOps module set for the two-sidebar shell, mirrored from the live product.
 *
 *   MODULES        — the leftmost "module-based sidebar" (icon rail → labels when expanded).
 *                    A module may declare `submodules` (a nested nav, shown on hover / in the
 *                    listing sidebar — Assets, CMDB, Patches, Packages) or `views` (the
 *                    filter-based saved-view listing every list module shows — Requests, etc.).
 *   Dashboard is special: its listing is the dashboards catalogue (ListingFlyout).
 *
 * Only the Dashboard module has real pages in this prototype; the rest render their listing
 * so the two-sidebar interaction can be shown, and the content area explains the stub.
 */
export const MODULES = [
  { key: 'dashboard', label: 'Dashboard', icon: 'layout', kind: 'dashboards' },

  { key: 'requests', label: 'Requests', icon: 'inbox', kind: 'views', title: 'Request views', views: [
    { group: 'My work', items: [
      { t: 'My Urgent or High Priority Requests', n: '6' },
      { t: 'My Overdue Requests', n: '12' },
      { t: 'My Unresolved Requests', n: '34' } ] },
    { group: 'My group', items: [
      { t: 'Unassigned Requests in My Group', n: '9' },
      { t: 'Urgent or High Priority Requests in my Group', n: '15' } ] },
    { group: 'All requests', items: [
      { t: 'All Open Requests', n: '128', star: true },
      { t: 'All Requests', n: '1,204' },
      { t: 'All Incidents', n: '742' },
      { t: 'All Service Requests', n: '462' },
      { t: 'All Spam Requests', n: '18' },
      { t: 'Requests Watched By Me', n: '4' },
      { t: 'All Archived Requests', n: '310' } ] },
  ] },

  { key: 'problems', label: 'Problems', icon: 'alert', kind: 'views', title: 'Problem views', views: [
    { group: 'My work', items: [ { t: 'My Open Problems', n: '3' }, { t: 'My Overdue Problems', n: '1' } ] },
    { group: 'All problems', items: [
      { t: 'All Open Problems', n: '21', star: true }, { t: 'Known Errors', n: '8' },
      { t: 'Awaiting Root Cause', n: '6' }, { t: 'All Archived Problems', n: '44' } ] },
  ] },

  { key: 'changes', label: 'Changes', icon: 'refresh', kind: 'views', title: 'Change views', views: [
    { group: 'My work', items: [ { t: 'My Open Changes', n: '5' }, { t: 'Awaiting My Approval', n: '2' } ] },
    { group: 'By stage', items: [
      { t: 'All Open Changes', n: '37', star: true }, { t: 'In Approval', n: '11' },
      { t: 'Scheduled This Week', n: '6' }, { t: 'Emergency Changes', n: '2' },
      { t: 'All Archived Changes', n: '180' } ] },
  ] },

  { key: 'releases', label: 'Releases', icon: 'package', kind: 'views', title: 'Release views', views: [
    { group: 'My work', items: [ { t: 'My Open Releases', n: '2' } ] },
    { group: 'All releases', items: [
      { t: 'All Open Releases', n: '14', star: true }, { t: 'Planned This Quarter', n: '7' },
      { t: 'All Archived Releases', n: '63' } ] },
  ] },

  { key: 'assets', label: 'Assets', icon: 'assets', kind: 'submodules', title: 'Assets', submodules: [
    { group: 'Asset types', items: [
      { t: 'Hardware Assets', ic: 'predefined-monitor', n: '4,820' }, { t: 'Software Assets', ic: 'grid', n: '1,265' },
      { t: 'Non-IT Assets', ic: 'inbox', n: '318' }, { t: 'Consumable Assets', ic: 'package', n: '540' } ] },
    { group: 'Licensing', items: [ { t: 'Software Licenses', ic: 'verified', n: '212' }, { t: 'Software Meter', ic: 'trend' } ] },
    { group: 'Commercial', items: [ { t: 'Contracts', ic: 'file-text', n: '96' }, { t: 'Purchases', ic: 'file-text', n: '148' } ] },
  ] },

  { key: 'cmdb', label: 'CMDB', icon: 'sitemap', kind: 'submodules', title: 'Configuration items', submodules: [
    { group: 'Base CI', items: [
      { t: 'Hardware', ic: 'predefined-monitor' }, { t: 'Infrastructure', ic: 'sitemap' },
      { t: 'Services', ic: 'settings' }, { t: 'Virtualization', ic: 'grid' },
      { t: 'Public Cloud Services', ic: 'globe' }, { t: 'Private Cloud Services', ic: 'lock' },
      { t: 'Application', ic: 'layout' } ] },
  ] },

  { key: 'patches', label: 'Patches', icon: 'patch', kind: 'submodules', title: 'Patch management', submodules: [
    { group: 'Patching', items: [
      { t: 'Patches', ic: 'patch', n: '1,842' }, { t: 'Patch Deployment', ic: 'packages', n: '24' },
      { t: 'Computer', ic: 'predefined-monitor', n: '612' } ] },
    { group: 'Automation', items: [
      { t: 'Automatic Patch Test', ic: 'settings' }, { t: 'Automatic Patch Deployment', ic: 'settings' } ] },
  ] },

  { key: 'packages', label: 'Packages', icon: 'packages', kind: 'submodules', title: 'Packages', submodules: [
    { group: 'Deployment', items: [
      { t: 'Package Deployments', ic: 'packages', n: '38' }, { t: 'Registry Deployments', ic: 'packages', n: '12' },
      { t: 'Computer', ic: 'predefined-monitor', n: '612' } ] },
  ] },

  { key: 'projects', label: 'Projects', icon: 'grid', kind: 'views', title: 'Project views', views: [
    { group: 'My work', items: [ { t: 'My Projects', n: '4' }, { t: 'My Milestones', n: '9' } ] },
    { group: 'All projects', items: [ { t: 'Active Projects', n: '17', star: true }, { t: 'On Hold', n: '3' }, { t: 'Completed', n: '58' } ] },
  ] },

  { key: 'knowledge', label: 'Knowledge', icon: 'bulb', kind: 'views', title: 'Knowledge base', views: [
    { group: 'My work', items: [ { t: 'My Drafts', n: '6' }, { t: 'Pending My Approval', n: '2' } ] },
    { group: 'Categories', items: [
      { t: 'Getting Started', n: '24' }, { t: 'Hardware', n: '61' }, { t: 'Software', n: '88' },
      { t: 'Network & VPN', n: '43' }, { t: 'Security', n: '37' } ] },
  ] },

  { key: 'reports', label: 'Reports', icon: 'file-text', kind: 'views', title: 'Reports', views: [
    { group: 'Favourites', items: [ { t: 'SLA Compliance — Monthly', star: true } ] },
    { group: 'Service desk', items: [ { t: 'Ticket Volume Trend' }, { t: 'SLA Compliance' }, { t: 'Technician Workload' }, { t: 'First Response Time' } ] },
    { group: 'Assets', items: [ { t: 'Asset Inventory' }, { t: 'Warranty Expiry' }, { t: 'Licence Compliance' } ] },
  ] },

  { key: 'approvals', label: 'My Approvals', icon: 'user-check', kind: 'views', title: 'My approvals', views: [
    { group: 'Awaiting me', items: [ { t: 'Pending Approval', n: '7', star: true }, { t: 'Overdue Approvals', n: '1' } ] },
    { group: 'History', items: [ { t: 'Approved by Me', n: '142' }, { t: 'Rejected by Me', n: '9' } ] },
  ] },

  { key: 'tasks', label: 'My Tasks', icon: 'clipboard', kind: 'views', title: 'My tasks', views: [
    { group: 'Open', items: [ { t: 'Due Today', n: '3', star: true }, { t: 'This Week', n: '11' }, { t: 'Overdue', n: '2' } ] },
    { group: 'All', items: [ { t: 'All My Tasks', n: '46' }, { t: 'Completed', n: '231' } ] },
  ] },

  { key: 'team', label: 'My Team', icon: 'team', kind: 'views', title: 'My team', views: [
    { group: 'Workload', items: [ { t: 'Team Queue', n: '64', star: true }, { t: 'Unassigned', n: '9' } ] },
    { group: 'Members', items: [ { t: 'Aarav Mehta', n: '12' }, { t: 'Meera Iyer', n: '8' }, { t: 'Rohan Patel', n: '15' }, { t: 'Priya Nair', n: '6' } ] },
  ] },
]

export const moduleByKey = (key) => MODULES.find((m) => m.key === key) || MODULES[0]
