/* Admin › Compliance — Rules and Benchmark data.
 *
 * Model (from the ObserveOps Compliance Settings reference, docs/COMPLIANCE-SETTINGS-SPEC.md):
 *   Rule        one check — what to read, what it must equal, how to fix it. PREDEFINED ONLY:
 *               the catalogue ships with the product and an admin reads it, never writes it.
 *   Benchmark   a named set of rules of ONE Type. Default (CIS, read-only, Clone only) or
 *               Custom (built here from the predefined rules; Edit · Clone · Delete).
 *   (Compliance Policy — a benchmark bound to targets and a schedule — is the technician-side
 *    module and is not built yet. `usedBy` stands in for the policies that reference a benchmark.)
 *
 * Rules are generated from a small set of CHECKS × the platforms each check runs on, so the
 * Debian, RHEL and Ubuntu copies of one control share their content and differ only by Platform
 * and Version — exactly how the CIS catalogue reads. Everything is deterministic. */

export type ComplianceType = 'Linux' | 'Windows' | 'Router' | 'Switch' | 'Firewall';
export type Severity = 'Critical' | 'High' | 'Medium' | 'Low' | 'Info';
export type CheckIn = 'CLI' | 'Config File';

export const COMPLIANCE_TYPES: ComplianceType[] = ['Linux', 'Windows', 'Router', 'Switch', 'Firewall'];
export const SEVERITIES: Severity[] = ['Critical', 'High', 'Medium', 'Low', 'Info'];

/** Tinted pill — the same tones the Detected CVEs listing uses, plus Info. */
export const SEVERITY_PILL: Record<Severity, { bg: string; text: string; bar: string }> = {
  Critical: { bg: '#FEF3F2', text: '#B42318', bar: '#EF4444' },
  High: { bg: '#FFF4ED', text: '#C4320A', bar: '#F97316' },
  Medium: { bg: '#FFFAEB', text: '#B54708', bar: '#EAB308' },
  Low: { bg: '#F2F4F7', text: '#475467', bar: '#22C55E' },
  Info: { bg: '#EFF8FF', text: '#175CD3', bar: '#3D8BD0' },
};

export interface RuleCondition {
  pattern: string;
  occurrence: 'Any occurrence' | 'All occurrences' | 'First occurrence';
  condition: 'Contains' | 'Equals' | 'Does not contain' | 'Matches regex';
}

export interface ControlMapping {
  version: 'v8' | 'v7';
  /** e.g. "4.8 Uninstall or Disable Unnecessary Services" — or null = Explicitly Not Mapped. */
  safeguard: string | null;
  text?: string;
}

export interface ComplianceRule {
  id: string;
  name: string;
  description: string;
  rationale: string;
  severity: Severity;
  type: ComplianceType;
  platform: string;
  version: string;
  checkIn: CheckIn;
  audit: string;
  command: string;
  conditions: RuleCondition[];
  remediation: string;
  remediationValue: string;
  references: string[];
  controls: ControlMapping[];
  /** CIS profile level: L1 = must have (practical, low impact); L2 = good to have (defence in
   *  depth, may cost some function). An L2 benchmark includes L1 rules; an L1 one never takes L2. */
  profile: Profile;
  /** CIS assessment status: Automated = the agent checks it; Manual = a person has to review it. */
  assessment: Assessment;
  /** The CIS section the check lives under — Default benchmarks group their rules by it. */
  section: [string, string];
  subsection?: [string, string];
}

export type Profile = 'L1' | 'L2';
export type Assessment = 'Automated' | 'Manual';
/** A benchmark's profile: Level 1 rules only, Level 2 rules only, or both. A rule is L1 or L2. */
export type BenchmarkProfile = 'L1' | 'L2' | 'L1+L2';
export const PROFILES: { value: Profile; label: string; tip: string }[] = [
  { value: 'L1', label: 'Level 1', tip: 'Must have — practical, low-impact rules' },
  { value: 'L2', label: 'Level 2', tip: 'Good to have — defence in depth, may cost some function' },
];
/** The levels a benchmark profile is made of, and back. */
export const profileLevels = (p: BenchmarkProfile): Profile[] => (p === 'L1+L2' ? ['L1', 'L2'] : [p]);
export const profileOf = (levels: Profile[]): BenchmarkProfile => (levels.includes('L1') && levels.includes('L2') ? 'L1+L2' : levels.includes('L2') ? 'L2' : 'L1');
export const profileLabel = (p: BenchmarkProfile) => (p === 'L1+L2' ? 'L1 + L2' : p);
/** Which rule profiles a benchmark of this profile may hold. */
export const profileAllows = (benchmark: BenchmarkProfile, rule: Profile) => profileLevels(benchmark).includes(rule);

/* ── Platforms ─────────────────────────────────────────────────────────────────────────── */

interface Platform { type: ComplianceType; platform: string; version: string; key: string }

const P = {
  debian: { type: 'Linux', platform: 'Debian Linux', version: '11', key: 'debian' },
  rhel: { type: 'Linux', platform: 'Red Hat Enterprise Linux', version: '9', key: 'rhel' },
  ubuntu: { type: 'Linux', platform: 'Ubuntu Linux', version: '22.04 LTS', key: 'ubuntu' },
  win2019: { type: 'Windows', platform: 'Windows Server', version: '2019', key: 'win2019' },
  win2022: { type: 'Windows', platform: 'Windows Server', version: '2022', key: 'win2022' },
  iosRouter: { type: 'Router', platform: 'Cisco IOS XE', version: '17.x', key: 'ios-r' },
  junos: { type: 'Router', platform: 'Junos OS', version: '21.x', key: 'junos' },
  iosSwitch: { type: 'Switch', platform: 'Cisco IOS XE', version: '17.x', key: 'ios-s' },
  nxos: { type: 'Switch', platform: 'Cisco NX-OS', version: '10.x', key: 'nxos' },
  forti: { type: 'Firewall', platform: 'FortiOS', version: '7.4', key: 'forti' },
  panos: { type: 'Firewall', platform: 'PAN-OS', version: '11.x', key: 'panos' },
} satisfies Record<string, Platform>;

/* ── Checks ────────────────────────────────────────────────────────────────────────────── */

interface Check {
  key: string;
  name: string;
  description: string;
  rationale: string;
  severity: Severity;
  checkIn: CheckIn;
  audit: string;
  command: string;
  conditions: RuleCondition[];
  remediation: string;
  remediationValue: string;
  references: string[];
  controls: ControlMapping[];
  section: [string, string];
  subsection?: [string, string];
  platforms: Platform[];
}

const LINUX = [P.debian, P.rhel, P.ubuntu];
const WIN = [P.win2019, P.win2022];

const CHECKS: Check[] = [
  {
    key: 'cramfs', name: 'Ensure cramfs kernel module is not available',
    description: 'The cramfs filesystem type is a compressed read-only Linux filesystem embedded in small footprint systems.',
    rationale: 'Removing support for unneeded filesystem types reduces the local attack surface of the system. If this filesystem type is not needed, disable it.',
    severity: 'Medium', checkIn: 'CLI',
    audit: 'Run the following to verify the cramfs module is not loadable:', command: '# modprobe -n -v cramfs',
    conditions: [{ pattern: 'install /bin/false', occurrence: 'Any occurrence', condition: 'Contains' }],
    remediation: 'Create a file ending in .conf in /etc/modprobe.d/ that blacklists cramfs and unloads the module.',
    remediationValue: 'install cramfs /bin/false\nblacklist cramfs',
    references: ['NIST SP 800-53 Rev. 5: CM-7'],
    controls: [{ version: 'v8', safeguard: '4.8 Uninstall or Disable Unnecessary Services on Enterprise Assets and Software', text: 'Uninstall or disable unnecessary services on enterprise assets and software, such as an unused file sharing service.' }, { version: 'v7', safeguard: '5.1 Establish Secure Configurations', text: 'Maintain documented, standard security configuration standards for all authorized operating systems and software.' }],
    section: ['1', 'Initial Setup'], subsection: ['1.1', 'Filesystem Configuration'],
    platforms: LINUX,
  },
  {
    key: 'tmp', name: 'Ensure separate partition exists for /tmp',
    description: 'The /tmp directory is a world-writable directory used for temporary storage by all users and some applications.',
    rationale: 'Making /tmp its own file system allows an administrator to set additional mount options such as noexec, and stops a user filling the root filesystem.',
    severity: 'Medium', checkIn: 'CLI',
    audit: 'Run the following to verify /tmp is mounted:', command: '# findmnt -kn /tmp',
    conditions: [{ pattern: '/tmp', occurrence: 'First occurrence', condition: 'Contains' }],
    remediation: 'Create or update an entry for /tmp in /etc/fstab, or enable the systemd tmp.mount unit.',
    remediationValue: 'tmpfs /tmp tmpfs defaults,rw,nosuid,nodev,noexec,relatime 0 0',
    references: ['NIST SP 800-53 Rev. 5: CM-7'],
    controls: [{ version: 'v8', safeguard: '3.3 Configure Data Access Control Lists', text: 'Configure data access control lists based on a user’s need to know.' }, { version: 'v7', safeguard: null }],
    section: ['1', 'Initial Setup'], subsection: ['1.1', 'Filesystem Configuration'],
    platforms: LINUX,
  },
  {
    key: 'gpgcheck', name: 'Ensure gpgcheck is globally activated',
    description: 'The gpgcheck option verifies the package signature before it is installed.',
    rationale: 'It is important to ensure that a package’s signature is always checked prior to installation to make sure the software is obtained from a trusted source.',
    severity: 'High', checkIn: 'Config File',
    audit: 'Run the following to verify gpgcheck is set to 1 in the global configuration:', command: '# grep ^gpgcheck /etc/dnf/dnf.conf',
    conditions: [{ pattern: 'gpgcheck=1', occurrence: 'All occurrences', condition: 'Equals' }],
    remediation: 'Edit /etc/dnf/dnf.conf and set gpgcheck=1 in the [main] section.',
    remediationValue: 'gpgcheck=1',
    references: ['NIST SP 800-53 Rev. 5: SI-7'],
    controls: [{ version: 'v8', safeguard: '7.3 Perform Automated Operating System Patch Management', text: 'Perform operating system updates on enterprise assets through automated patch management on a monthly, or more frequent, basis.' }, { version: 'v7', safeguard: '3.4 Deploy Automated Operating System Patch Management Tools', text: 'Deploy automated software update tools to ensure the operating systems run the most recent updates.' }],
    section: ['1', 'Initial Setup'], subsection: ['1.2', 'Configure Software Updates'],
    platforms: LINUX,
  },
  {
    key: 'aslr', name: 'Ensure address space layout randomization is enabled',
    description: 'ASLR makes it more difficult for an attacker to predict memory addresses.',
    rationale: 'Randomly placing virtual memory regions makes it difficult to write memory page exploits, as the memory placement will be consistently shifting.',
    severity: 'High', checkIn: 'CLI',
    audit: 'Run the following to verify the kernel parameter:', command: '# sysctl kernel.randomize_va_space',
    conditions: [{ pattern: 'kernel.randomize_va_space = 2', occurrence: 'Any occurrence', condition: 'Equals' }],
    remediation: 'Set the parameter in a file ending in .conf in /etc/sysctl.d/ and load it.',
    remediationValue: 'kernel.randomize_va_space = 2',
    references: ['NIST SP 800-53 Rev. 5: CM-6'],
    controls: [{ version: 'v8', safeguard: '10.5 Enable Anti-Exploitation Features', text: 'Enable anti-exploitation features on enterprise assets and software, where possible.' }, { version: 'v7', safeguard: '8.3 Enable Operating System Anti-Exploitation Features', text: 'Enable anti-exploitation features such as DEP or ASLR that are available in an operating system.' }],
    section: ['1', 'Initial Setup'], subsection: ['1.5', 'Additional Process Hardening'],
    platforms: LINUX,
  },
  {
    key: 'coredump', name: 'Ensure core dumps are restricted',
    description: 'A core dump is the memory of an executable program written to disk when it terminates abnormally.',
    rationale: 'Setting a hard limit on core dumps prevents users from overriding the soft variable, so sensitive memory cannot be written to disk.',
    severity: 'Medium', checkIn: 'Config File',
    audit: 'Run the following to verify the hard limit is set:', command: '# grep -Es \'^(\\*|\\s).*hard.*core.*\' /etc/security/limits.conf',
    conditions: [{ pattern: '* hard core 0', occurrence: 'Any occurrence', condition: 'Contains' }, { pattern: 'fs.suid_dumpable = 0', occurrence: 'Any occurrence', condition: 'Contains' }],
    remediation: 'Add the hard limit to /etc/security/limits.conf and set fs.suid_dumpable in /etc/sysctl.d/.',
    remediationValue: '* hard core 0\nfs.suid_dumpable = 0',
    references: ['NIST SP 800-53 Rev. 5: CM-6'],
    controls: [{ version: 'v8', safeguard: null }, { version: 'v7', safeguard: null }],
    section: ['1', 'Initial Setup'], subsection: ['1.5', 'Additional Process Hardening'],
    platforms: LINUX,
  },
  {
    key: 'firewalld', name: 'Ensure firewalld is running',
    description: 'A firewall utility should be running to filter network traffic arriving at the host.',
    rationale: 'Without a running host firewall, any service bound to a network interface is reachable from the whole network.',
    severity: 'High', checkIn: 'CLI',
    audit: 'Run the following to verify firewalld is enabled and active:', command: '# systemctl is-enabled firewalld; systemctl is-active firewalld',
    conditions: [{ pattern: 'enabled', occurrence: 'First occurrence', condition: 'Equals' }, { pattern: 'active', occurrence: 'Any occurrence', condition: 'Equals' }],
    remediation: 'Unmask, enable and start the firewalld service.',
    remediationValue: '# systemctl --now enable firewalld',
    references: ['NIST SP 800-53 Rev. 5: SC-7'],
    controls: [{ version: 'v8', safeguard: '4.4 Implement and Manage a Firewall on Servers', text: 'Implement and manage a firewall on servers, where supported.' }, { version: 'v7', safeguard: '9.4 Apply Host-based Firewalls or Port Filtering', text: 'Apply host-based firewalls or port filtering tools on end systems.' }],
    section: ['3', 'Network Configuration'], subsection: ['3.4', 'Configure Host Based Firewall'],
    platforms: LINUX,
  },
  {
    key: 'auditd', name: 'Ensure auditd is installed',
    description: 'auditd is the userspace component to the Linux Auditing System. It’s responsible for writing audit records to the disk.',
    rationale: 'The capturing of system events provides system administrators with information to allow them to determine if unauthorized access to their system is occurring.',
    severity: 'High', checkIn: 'CLI',
    audit: 'Run the following to verify the audit package is installed:', command: '# rpm -q audit audit-libs',
    conditions: [{ pattern: 'is not installed', occurrence: 'Any occurrence', condition: 'Does not contain' }],
    remediation: 'Install the audit package with the system package manager.',
    remediationValue: '# dnf install audit audit-libs',
    references: ['NIST SP 800-53 Rev. 5: AU-2, AU-12'],
    controls: [{ version: 'v8', safeguard: '8.2 Collect Audit Logs', text: 'Collect audit logs. Ensure that logging, per the enterprise’s audit log management process, has been enabled across enterprise assets.' }, { version: 'v7', safeguard: '6.2 Activate audit logging', text: 'Ensure that local logging has been enabled on all systems and networking devices.' }],
    section: ['4', 'Logging and Auditing'], subsection: ['4.1', 'Configure System Accounting (auditd)'],
    platforms: LINUX,
  },
  {
    key: 'sshroot', name: 'Ensure SSH root login is disabled',
    description: 'The PermitRootLogin parameter specifies whether the root user can log in directly over SSH.',
    rationale: 'Disallowing root logins over SSH requires administrators to authenticate using their own account, then escalate, which provides a clear audit trail.',
    severity: 'Critical', checkIn: 'Config File',
    audit: 'Run the following to verify PermitRootLogin is set to no:', command: '# sshd -T | grep permitrootlogin',
    conditions: [{ pattern: 'permitrootlogin no', occurrence: 'Any occurrence', condition: 'Equals' }],
    remediation: 'Edit /etc/ssh/sshd_config and set the parameter, then reload sshd.',
    remediationValue: 'PermitRootLogin no',
    references: ['NIST SP 800-53 Rev. 5: AC-6(2), AC-6(5)'],
    controls: [{ version: 'v8', safeguard: '5.4 Restrict Administrator Privileges to Dedicated Administrator Accounts', text: 'Restrict administrator privileges to dedicated administrator accounts on enterprise assets.' }, { version: 'v7', safeguard: '4.3 Ensure the Use of Dedicated Administrative Accounts', text: 'Ensure that all users with administrative account access use a dedicated or secondary account for elevated activities.' }],
    section: ['5', 'Access, Authentication and Authorization'], subsection: ['5.2', 'Configure SSH Server'],
    platforms: LINUX,
  },
  {
    key: 'sshtries', name: 'Ensure SSH MaxAuthTries is set to 4 or less',
    description: 'The MaxAuthTries parameter specifies the maximum number of authentication attempts permitted per connection.',
    rationale: 'Setting MaxAuthTries to a low number minimizes the risk of successful brute force attacks against the SSH server.',
    severity: 'High', checkIn: 'Config File',
    audit: 'Run the following to verify MaxAuthTries is 4 or less:', command: '# sshd -T | grep maxauthtries',
    conditions: [{ pattern: 'maxauthtries [1-4]$', occurrence: 'Any occurrence', condition: 'Matches regex' }],
    remediation: 'Edit /etc/ssh/sshd_config and set MaxAuthTries, then reload sshd.',
    remediationValue: 'MaxAuthTries 4',
    references: ['NIST SP 800-53 Rev. 5: AU-3'],
    controls: [{ version: 'v8', safeguard: '8.5 Collect Detailed Audit Logs', text: 'Configure detailed audit logging for enterprise assets containing sensitive data.' }, { version: 'v7', safeguard: '16.13 Alert on Account Login Behavior Deviation', text: 'Alert when users deviate from normal login behavior, such as time-of-day or workstation location.' }],
    section: ['5', 'Access, Authentication and Authorization'], subsection: ['5.2', 'Configure SSH Server'],
    platforms: LINUX,
  },
  {
    key: 'passwd', name: 'Ensure permissions on /etc/passwd are configured',
    description: 'The /etc/passwd file contains user account information that is used by many system utilities.',
    rationale: 'It is critical to ensure that /etc/passwd is protected from unauthorized write access, though it must remain readable.',
    severity: 'High', checkIn: 'CLI',
    audit: 'Run the following to verify the file mode and owner:', command: '# stat -Lc \'%#a %U %G\' /etc/passwd',
    conditions: [{ pattern: '0644 root root', occurrence: 'First occurrence', condition: 'Equals' }],
    remediation: 'Set owner, group and permissions on /etc/passwd.',
    remediationValue: '# chmod u-x,go-wx /etc/passwd\n# chown root:root /etc/passwd',
    references: ['NIST SP 800-53 Rev. 5: AC-3, MP-2'],
    controls: [{ version: 'v8', safeguard: '3.3 Configure Data Access Control Lists', text: 'Configure data access control lists based on a user’s need to know.' }, { version: 'v7', safeguard: '14.6 Protect Information through Access Control Lists', text: 'Protect all information stored on systems with file system, network share, claims, application, or database specific access control lists.' }],
    section: ['6', 'System Maintenance'], subsection: ['6.1', 'System File Permissions'],
    platforms: LINUX,
  },
  /* ── Windows ── */
  {
    key: 'pwhistory', name: "Ensure 'Enforce password history' is set to '24 or more password(s)'",
    description: 'This policy setting determines the number of renewed, unique passwords that have to be associated with a user account before an old password can be reused.',
    rationale: 'The longer a user uses the same password, the greater the chance that an attacker can determine the password through brute force attacks.',
    severity: 'High', checkIn: 'CLI',
    audit: 'Navigate to the UI path and verify the value, or run:', command: 'PS> net accounts | Select-String "password history"',
    conditions: [{ pattern: 'Length of password history maintained: 24', occurrence: 'Any occurrence', condition: 'Contains' }],
    remediation: 'Computer Configuration\\Policies\\Windows Settings\\Security Settings\\Account Policies\\Password Policy\\Enforce password history',
    remediationValue: '24 or more password(s)',
    references: ['NIST SP 800-53 Rev. 5: IA-5(1)'],
    controls: [{ version: 'v8', safeguard: '5.2 Use Unique Passwords', text: 'Use unique passwords for all enterprise assets.' }, { version: 'v7', safeguard: '4.4 Use Unique Passwords', text: 'Where multi-factor authentication is not supported, user accounts shall be required to use long passwords on the system.' }],
    section: ['1', 'Account Policies'], subsection: ['1.1', 'Password Policy'],
    platforms: WIN,
  },
  {
    key: 'pwlength', name: "Ensure 'Minimum password length' is set to '14 or more character(s)'",
    description: 'This policy setting determines the least number of characters that make up a password for a user account.',
    rationale: 'Long passwords are much harder to brute force, and a minimum length enforces it for every account.',
    severity: 'Critical', checkIn: 'CLI',
    audit: 'Run the following and verify the minimum length:', command: 'PS> net accounts | Select-String "Minimum password length"',
    conditions: [{ pattern: 'Minimum password length: 14', occurrence: 'Any occurrence', condition: 'Contains' }],
    remediation: 'Computer Configuration\\Policies\\Windows Settings\\Security Settings\\Account Policies\\Password Policy\\Minimum password length',
    remediationValue: '14 or more character(s)',
    references: ['NIST SP 800-53 Rev. 5: IA-5(1)'],
    controls: [{ version: 'v8', safeguard: '5.2 Use Unique Passwords', text: 'Use unique passwords for all enterprise assets.' }, { version: 'v7', safeguard: '4.4 Use Unique Passwords' }],
    section: ['1', 'Account Policies'], subsection: ['1.1', 'Password Policy'],
    platforms: WIN,
  },
  {
    key: 'lockout', name: "Ensure 'Account lockout threshold' is set to '5 or fewer invalid logon attempt(s), but not 0'",
    description: 'This policy setting determines the number of failed logon attempts before the account is locked.',
    rationale: 'Setting an account lockout threshold reduces the likelihood that an online password brute force attack will be successful.',
    severity: 'High', checkIn: 'CLI',
    audit: 'Run the following and verify the threshold:', command: 'PS> net accounts | Select-String "Lockout threshold"',
    conditions: [{ pattern: 'Lockout threshold:\\s+[1-5]$', occurrence: 'Any occurrence', condition: 'Matches regex' }],
    remediation: 'Computer Configuration\\Policies\\Windows Settings\\Security Settings\\Account Policies\\Account Lockout Policy\\Account lockout threshold',
    remediationValue: '5 or fewer invalid login attempt(s), but not 0',
    references: ['NIST SP 800-53 Rev. 5: AC-7'],
    controls: [{ version: 'v8', safeguard: '4.10 Enforce Automatic Device Lockout on Portable End-User Devices' }, { version: 'v7', safeguard: '16.7 Establish Process for Revoking Access' }],
    section: ['1', 'Account Policies'], subsection: ['1.2', 'Account Lockout Policy'],
    platforms: WIN,
  },
  {
    key: 'spooler', name: "Ensure 'Print Spooler (Spooler)' is set to 'Disabled' (DC only)",
    description: 'This service spools print jobs and handles interaction with printers.',
    rationale: 'Disabling the Print Spooler on domain controllers removes the attack surface used by PrintNightmare-class exploits.',
    severity: 'Critical', checkIn: 'CLI',
    audit: 'Run the following and verify the start type:', command: 'PS> Get-Service Spooler | Select StartType',
    conditions: [{ pattern: 'Disabled', occurrence: 'First occurrence', condition: 'Equals' }],
    remediation: 'Computer Configuration\\Policies\\Windows Settings\\Security Settings\\System Services\\Print Spooler',
    remediationValue: 'Disabled',
    references: ['NIST SP 800-53 Rev. 5: CM-7'],
    controls: [{ version: 'v8', safeguard: '4.8 Uninstall or Disable Unnecessary Services on Enterprise Assets and Software' }, { version: 'v7', safeguard: '9.2 Ensure Only Approved Ports, Protocols and Services Are Running' }],
    section: ['5', 'System Services'],
    platforms: WIN,
  },
  {
    key: 'smb1', name: "Ensure 'Configure SMB v1 server' is set to 'Disabled'",
    description: 'This setting configures the server-side processing of the Server Message Block version 1 (SMBv1) protocol.',
    rationale: 'SMBv1 is a legacy protocol that uses an outdated encryption algorithm and was the vector for WannaCry.',
    severity: 'High', checkIn: 'CLI',
    audit: 'Run the following and verify SMB1 is off:', command: 'PS> Get-SmbServerConfiguration | Select EnableSMB1Protocol',
    conditions: [{ pattern: 'False', occurrence: 'Any occurrence', condition: 'Equals' }],
    remediation: 'Computer Configuration\\Policies\\Administrative Templates\\MS Security Guide\\Configure SMB v1 server',
    remediationValue: 'Disabled',
    references: ['NIST SP 800-53 Rev. 5: CM-7'],
    controls: [{ version: 'v8', safeguard: '4.8 Uninstall or Disable Unnecessary Services on Enterprise Assets and Software' }, { version: 'v7', safeguard: '9.2 Ensure Only Approved Ports, Protocols and Services Are Running' }],
    section: ['18', 'Administrative Templates (Computer)'], subsection: ['18.4', 'MS Security Guide'],
    platforms: WIN,
  },
  /* ── Network ── */
  {
    key: 'aaa', name: "Enable 'aaa new-model'",
    description: 'This command enables the AAA access control system.',
    rationale: 'Authentication, authorization and accounting (AAA) services provide an authoritative source for managing and monitoring access for devices.',
    severity: 'Critical', checkIn: 'Config File',
    audit: 'Perform the following to determine if AAA services are enabled:', command: 'hostname# show running-config | inc aaa new-model',
    conditions: [{ pattern: 'aaa new-model', occurrence: 'Any occurrence', condition: 'Contains' }],
    remediation: 'Globally enable authentication, authorization and accounting (AAA) using the new-model command.',
    remediationValue: 'hostname(config)# aaa new-model',
    references: ['NIST SP 800-53 Rev. 5: AC-2, IA-2'],
    controls: [{ version: 'v8', safeguard: '6.7 Centralize Access Control', text: 'Centralize access control for all enterprise assets through a directory service or SSO provider.' }, { version: 'v7', safeguard: '16.2 Configure Centralized Point of Authentication' }],
    section: ['1', 'Management Plane'], subsection: ['1.1', 'Local Authentication, Authorization and Accounting (AAA) Rules'],
    platforms: [P.iosRouter, P.iosSwitch, P.junos, P.nxos],
  },
  {
    key: 'telnet', name: "Set 'transport input ssh' for 'line vty' connections",
    description: 'Selects the Secure Shell (SSH) protocol as the only transport for remote access.',
    rationale: 'Telnet sends credentials in clear text. Restricting VTY lines to SSH protects administrative sessions from interception.',
    severity: 'Critical', checkIn: 'Config File',
    audit: 'Verify every VTY line only accepts SSH:', command: 'hostname# show running-config | sec vty',
    conditions: [{ pattern: 'transport input ssh', occurrence: 'All occurrences', condition: 'Contains' }, { pattern: 'transport input telnet', occurrence: 'Any occurrence', condition: 'Does not contain' }],
    remediation: 'Apply SSH-only transport to every VTY line.',
    remediationValue: 'hostname(config)# line vty 0 4\nhostname(config-line)# transport input ssh',
    references: ['NIST SP 800-53 Rev. 5: AC-17(2)'],
    controls: [{ version: 'v8', safeguard: '12.6 Use of Secure Network Management and Communication Protocols' }, { version: 'v7', safeguard: '11.5 Use Automated Tools to Verify Standard Device Configurations and Detect Changes' }],
    section: ['1', 'Management Plane'], subsection: ['1.2', 'Access Rules'],
    platforms: [P.iosRouter, P.iosSwitch, P.junos, P.nxos],
  },
  {
    key: 'banner', name: "Set the 'banner-text' for 'banner login'",
    description: 'This command sets the text shown before a user logs in.',
    rationale: 'Network banners are electronic messages that provide notice of legal rights to users of computer networks.',
    severity: 'Low', checkIn: 'Config File',
    audit: 'Verify a login banner is configured:', command: 'hostname# show running-config | beg banner login',
    conditions: [{ pattern: 'banner login', occurrence: 'First occurrence', condition: 'Contains' }],
    remediation: 'Configure the login banner text.',
    remediationValue: 'hostname(config)# banner login c Authorized access only c',
    references: ['NIST SP 800-53 Rev. 5: AC-8'],
    controls: [{ version: 'v8', safeguard: null }, { version: 'v7', safeguard: null }],
    section: ['1', 'Management Plane'], subsection: ['1.3', 'Banner Rules'],
    platforms: [P.iosRouter, P.iosSwitch],
  },
  {
    key: 'snmp', name: "Unset 'private' for 'snmp-server community'",
    description: 'An SNMP community string permits read-write access to the device.',
    rationale: 'The default community string "private" is well known; using easy-to-guess strings poses a risk that attackers can change device configuration.',
    severity: 'High', checkIn: 'Config File',
    audit: 'Verify the private community string is not set:', command: 'hostname# show snmp community',
    conditions: [{ pattern: 'private', occurrence: 'Any occurrence', condition: 'Does not contain' }],
    remediation: 'Remove the private community string.',
    remediationValue: 'hostname(config)# no snmp-server community private',
    references: ['NIST SP 800-53 Rev. 5: CM-6'],
    controls: [{ version: 'v8', safeguard: '4.7 Manage Default Accounts on Enterprise Assets and Software' }, { version: 'v7', safeguard: '11.1 Maintain Standard Security Configurations for Network Devices' }],
    section: ['1', 'Management Plane'], subsection: ['1.5', 'SNMP Rules'],
    platforms: [P.iosRouter, P.iosSwitch, P.nxos],
  },
  {
    key: 'logbuffer', name: "Set 'logging buffered'",
    description: 'Enables system message logging to a local buffer.',
    rationale: 'The device’s logging buffer holds recent messages for troubleshooting when the syslog server is unreachable.',
    severity: 'Medium', checkIn: 'Config File',
    audit: 'Verify local logging is enabled:', command: 'hostname# show running-config | inc logging buffered',
    conditions: [{ pattern: 'logging buffered', occurrence: 'Any occurrence', condition: 'Contains' }],
    remediation: 'Configure buffered logging with a size and severity.',
    remediationValue: 'hostname(config)# logging buffered 64000 informational',
    references: ['NIST SP 800-53 Rev. 5: AU-4'],
    controls: [{ version: 'v8', safeguard: '8.3 Ensure Adequate Audit Log Storage' }, { version: 'v7', safeguard: '6.4 Ensure adequate storage for logs' }],
    section: ['2', 'Control Plane'], subsection: ['2.2', 'Logging Rules'],
    platforms: [P.iosRouter, P.iosSwitch, P.junos],
  },
  {
    key: 'ntp', name: "Set 'ntp authenticate'",
    description: 'Enables NTP authentication.',
    rationale: 'Using authenticated NTP ensures the device only synchronises its clock against trusted servers, keeping log timestamps reliable.',
    severity: 'Medium', checkIn: 'Config File',
    audit: 'Verify NTP authentication is enabled:', command: 'hostname# show run | include ntp authenticate',
    conditions: [{ pattern: 'ntp authenticate', occurrence: 'Any occurrence', condition: 'Contains' }],
    remediation: 'Enable NTP authentication and trust a key.',
    remediationValue: 'hostname(config)# ntp authenticate',
    references: ['NIST SP 800-53 Rev. 5: AU-8'],
    controls: [{ version: 'v8', safeguard: '8.4 Standardize Time Synchronization' }, { version: 'v7', safeguard: '6.1 Utilize Three Synchronized Time Sources' }],
    section: ['2', 'Control Plane'], subsection: ['2.3', 'NTP Rules'],
    platforms: [P.iosRouter, P.iosSwitch, P.junos],
  },
  /* ── Firewall ── */
  {
    key: 'fortiadmin', name: 'Ensure default admin account is renamed or disabled',
    description: 'The built-in "admin" account is the first one any attacker tries.',
    rationale: 'Renaming or disabling the default administrator removes a known username from brute-force attempts.',
    severity: 'Critical', checkIn: 'Config File',
    audit: 'Verify no account named admin is active:', command: '# show system admin',
    conditions: [{ pattern: 'edit "admin"', occurrence: 'Any occurrence', condition: 'Does not contain' }],
    remediation: 'Create a named administrator, then delete the default admin account.',
    remediationValue: 'config system admin\n  delete admin\nend',
    references: ['NIST SP 800-53 Rev. 5: AC-2'],
    controls: [{ version: 'v8', safeguard: '4.7 Manage Default Accounts on Enterprise Assets and Software' }, { version: 'v7', safeguard: '4.2 Change Default Passwords' }],
    section: ['2', 'System Settings'], subsection: ['2.4', 'Administrators and Admin Profiles'],
    platforms: [P.forti, P.panos],
  },
  {
    key: 'fortitimeout', name: 'Ensure idle timeout time is configured',
    description: 'Sets how long an idle administrative session stays open.',
    rationale: 'An unattended, logged-in admin session can be used by anyone with access to that workstation.',
    severity: 'Medium', checkIn: 'Config File',
    audit: 'Verify the admin timeout is 5 minutes or less:', command: '# show system global | grep admintimeout',
    conditions: [{ pattern: 'set admintimeout [1-5]$', occurrence: 'Any occurrence', condition: 'Matches regex' }],
    remediation: 'Set the global admin timeout.',
    remediationValue: 'config system global\n  set admintimeout 5\nend',
    references: ['NIST SP 800-53 Rev. 5: AC-12'],
    controls: [{ version: 'v8', safeguard: '4.3 Configure Automatic Session Locking on Enterprise Assets' }, { version: 'v7', safeguard: '16.11 Lock Workstation Sessions After Inactivity' }],
    section: ['2', 'System Settings'], subsection: ['2.4', 'Administrators and Admin Profiles'],
    platforms: [P.forti, P.panos],
  },
  {
    key: 'fortianyany', name: 'Ensure that unused or "any-any" policies are reviewed and removed',
    description: 'Firewall policies that allow any source to any destination on any service defeat the purpose of the firewall.',
    rationale: 'Over-permissive policies silently allow traffic that should have been inspected or denied.',
    severity: 'High', checkIn: 'Config File',
    audit: 'Verify no policy allows all sources, destinations and services:', command: '# show firewall policy',
    conditions: [{ pattern: 'set srcaddr "all".*set dstaddr "all".*set service "ALL"', occurrence: 'Any occurrence', condition: 'Matches regex' }],
    remediation: 'Narrow or remove any policy matching all/all/ALL.',
    remediationValue: 'Review in Policy & Objects › Firewall Policy',
    references: ['NIST SP 800-53 Rev. 5: SC-7(5)'],
    controls: [{ version: 'v8', safeguard: '4.5 Implement and Manage a Firewall on End-User Devices' }, { version: 'v7', safeguard: '9.4 Apply Host-based Firewalls or Port Filtering' }],
    section: ['3', 'Policy and Objects'],
    platforms: [P.forti, P.panos],
  },
];

/* The checks CIS puts at Level 2 — defence in depth that can cost some function. */
const L2_CHECKS = new Set(['auditd', 'spooler', 'snmp', 'logbuffer', 'fortitimeout']);
/** Checks a person has to review — CIS marks these "Manual"; everything else the agent assesses. */
const MANUAL_CHECKS = new Set(['tmp', 'banner', 'fortianyany']);

/* ── Expand checks into rules ───────────────────────────────────────────────────────────── */

export const RULES: ComplianceRule[] = CHECKS.flatMap((c) =>
  c.platforms.map((p, i) => ({
    id: `${c.key}-${p.key}`,
    name: c.name,
    description: c.description,
    rationale: c.rationale,
    severity: c.severity,
    type: p.type,
    platform: p.platform,
    version: p.version,
    checkIn: c.checkIn,
    audit: c.audit,
    command: c.command,
    conditions: c.conditions,
    remediation: c.remediation,
    remediationValue: c.remediationValue,
    references: c.references,
    controls: c.controls,
    profile: (L2_CHECKS.has(c.key) ? 'L2' : 'L1') as Profile,
    assessment: (MANUAL_CHECKS.has(c.key) ? 'Manual' : 'Automated') as Assessment,
    section: c.section,
    subsection: c.subsection,
  })),
).sort((a, b) =>
  COMPLIANCE_TYPES.indexOf(a.type) - COMPLIANCE_TYPES.indexOf(b.type)
  || a.platform.localeCompare(b.platform)
  || CHECKS.findIndex((c) => a.id.startsWith(`${c.key}-`)) - CHECKS.findIndex((c) => b.id.startsWith(`${c.key}-`)));

export const ruleById = (id: string) => RULES.find((r) => r.id === id);

/** A rule's OS version as an admin names it — platform + build, e.g. "Debian Linux 11". */
export const osVersionOf = (r: Pick<ComplianceRule, 'platform' | 'version'>) => `${r.platform} ${r.version}`;

/** The OS versions a Type's rules are written for, in catalogue order. A benchmark targets ONE. */
export const OS_VERSIONS: { type: ComplianceType; label: string }[] = (Object.values(P) as Platform[])
  .map((p) => ({ type: p.type, label: osVersionOf(p) }));
export const osVersionsFor = (type: ComplianceType | '') => OS_VERSIONS.filter((v) => v.type === type).map((v) => v.label);

/* ── Benchmarks ────────────────────────────────────────────────────────────────────────── */

export interface RuleGroup {
  id: string;
  name: string;
  /** Rules attached straight to the group — numbered 1.1, 1.2 … */
  ruleIds: string[];
  /** Sub-groups, nesting up to 7 levels in all. They number on after the group's own rules
   *  (1.3) and their rules take the next level (1.3.1); the same again below. */
  children?: RuleGroup[];
}

/** Every rule a group holds, its sub-groups' included. */
export const groupRuleIds = (g: RuleGroup): string[] => [...g.ruleIds, ...(g.children ?? []).flatMap(groupRuleIds)];

export interface Benchmark {
  id: string;
  name: string;
  description: string;
  type: ComplianceType;
  /** The ONE OS version the benchmark is written for ("Debian Linux 11"); its rules are that version's. */
  osVersion: string;
  /** L1 = Level 1 rules only; L2 = Level 2 rules only; L1+L2 = both. */
  profile: BenchmarkProfile;
  /** Default = ships with the product (CIS), read-only; Custom = built here. */
  origin: 'Default' | 'Custom';
  /** Custom benchmarks are authored as one level of named groups. Default ones are not stored
   *  as groups at all — they read as the CIS tree, built from each rule's section. */
  groups: RuleGroup[];
  /** Compliance policies using it. Stands in until the policy module exists; > 0 blocks Delete. */
  usedBy: number;
  createdBy: string;
  updatedAt: string;
}

const CIS_DESC = 'This document provides prescriptive guidance for establishing a secure configuration posture. Please see the CIS website for the latest version.';

/* The CIS defaults are all "Level 1" benchmarks, so they carry their version's L1 rules only. */
const rulesFor = (key: string) => RULES.filter((r) => r.id.endsWith(`-${key}`) && r.profile === 'L1').map((r) => r.id);
const pick = (key: string, checks: string[]) => checks.map((c) => `${c}-${key}`).filter((id) => ruleById(id));

const SEED: Omit<Benchmark, 'osVersion' | 'profile'>[] = [
  { id: 'BM-1', name: 'CIS Debian Linux 11 Benchmark v2.0.0 - Level 1 Server', description: CIS_DESC, type: 'Linux', origin: 'Default', groups: [{ id: 'g', name: '', ruleIds: rulesFor('debian') }], usedBy: 2, createdBy: 'System', updatedAt: '2026-08-12T10:20' },
  { id: 'BM-2', name: 'CIS Red Hat Enterprise Linux 9 Benchmark v2.0.0 - Level 1 Server', description: CIS_DESC, type: 'Linux', origin: 'Default', groups: [{ id: 'g', name: '', ruleIds: rulesFor('rhel') }], usedBy: 0, createdBy: 'System', updatedAt: '2026-08-12T10:20' },
  { id: 'BM-3', name: 'CIS Ubuntu Linux 22.04 LTS Benchmark v2.0.0 - Level 1 Server', description: CIS_DESC, type: 'Linux', origin: 'Default', groups: [{ id: 'g', name: '', ruleIds: rulesFor('ubuntu') }], usedBy: 1, createdBy: 'System', updatedAt: '2026-08-12T10:20' },
  { id: 'BM-4', name: 'CIS Microsoft Windows Server 2019 Benchmark v3.0.0 - Level 1 Member Server', description: CIS_DESC, type: 'Windows', origin: 'Default', groups: [{ id: 'g', name: '', ruleIds: rulesFor('win2019') }], usedBy: 3, createdBy: 'System', updatedAt: '2026-08-12T10:20' },
  { id: 'BM-5', name: 'CIS Microsoft Windows Server 2022 Benchmark v3.0.0 - Level 1 Member Server', description: CIS_DESC, type: 'Windows', origin: 'Default', groups: [{ id: 'g', name: '', ruleIds: rulesFor('win2022') }], usedBy: 0, createdBy: 'System', updatedAt: '2026-08-12T10:20' },
  { id: 'BM-6', name: 'CIS Cisco IOS XE 17.x Benchmark v2.1.0 - Router', description: CIS_DESC, type: 'Router', origin: 'Default', groups: [{ id: 'g', name: '', ruleIds: rulesFor('ios-r') }], usedBy: 1, createdBy: 'System', updatedAt: '2026-08-12T10:20' },
  { id: 'BM-7', name: 'CIS Juniper OS Benchmark v2.1.0', description: CIS_DESC, type: 'Router', origin: 'Default', groups: [{ id: 'g', name: '', ruleIds: rulesFor('junos') }], usedBy: 0, createdBy: 'System', updatedAt: '2026-08-12T10:20' },
  { id: 'BM-8', name: 'CIS Cisco IOS XE 17.x Benchmark v2.1.0 - Switch', description: CIS_DESC, type: 'Switch', origin: 'Default', groups: [{ id: 'g', name: '', ruleIds: rulesFor('ios-s') }], usedBy: 0, createdBy: 'System', updatedAt: '2026-08-12T10:20' },
  { id: 'BM-9', name: 'CIS Fortigate 7.4.x Benchmark v1.0.0', description: CIS_DESC, type: 'Firewall', origin: 'Default', groups: [{ id: 'g', name: '', ruleIds: rulesFor('forti') }], usedBy: 2, createdBy: 'System', updatedAt: '2026-08-12T10:20' },
  {
    id: 'BM-10', name: 'Motadata Corporate Baseline', description: 'The minimum hardening every Linux server must pass before it joins production.', type: 'Linux', origin: 'Custom',
    groups: [
      { id: 'g1', name: 'Access Control', ruleIds: pick('debian', ['sshroot', 'sshtries']), children: [{ id: 'g1s1', name: 'File Permissions', ruleIds: pick('debian', ['passwd']) }] },
      { id: 'g2', name: 'Logging', ruleIds: pick('debian', ['auditd']) },
      { id: 'g3', name: 'Network', ruleIds: pick('debian', ['firewalld']) },
    ],
    usedBy: 3, createdBy: 'Kavit Gohel', updatedAt: '2026-10-08T15:42',
  },
  {
    id: 'BM-11', name: 'BFSI Network Hardening', description: 'Top rules essential for BFSI branch routers.', type: 'Router', origin: 'Custom',
    groups: [
      { id: 'g1', name: 'Device Access', ruleIds: pick('ios-r', ['aaa', 'telnet', 'banner']) },
      { id: 'g2', name: 'Monitoring', ruleIds: pick('ios-r', ['snmp', 'logbuffer']) },
    ],
    usedBy: 1, createdBy: 'Dharti Patel', updatedAt: '2026-10-02T11:05',
  },
  {
    id: 'BM-12', name: 'PCI DSS Windows Servers', description: 'Password and service controls required for servers in the cardholder data environment.', type: 'Windows', origin: 'Custom',
    groups: [
      { id: 'g1', name: 'Password Policy', ruleIds: pick('win2022', ['pwhistory', 'pwlength', 'lockout']) },
      { id: 'g2', name: 'Services', ruleIds: pick('win2022', ['spooler', 'smb1']) },
    ],
    usedBy: 0, createdBy: 'Neha Shah', updatedAt: '2026-09-27T09:30',
  },
  {
    id: 'BM-13', name: 'Perimeter Firewall Review', description: '', type: 'Firewall', origin: 'Custom',
    groups: [{ id: 'g1', name: 'Firewall Policies', ruleIds: pick('forti', ['fortiadmin', 'fortianyany']) }],
    usedBy: 0, createdBy: 'Vasu Hirpara', updatedAt: '2026-09-18T17:12',
  },
];

/** Every seed's OS version is read off its own rules, so the two can never disagree. */
export const BENCHMARKS_SEED: Benchmark[] = SEED.map((b) => {
  const ids = b.groups.flatMap(groupRuleIds);
  const first = ruleById(ids[0] ?? '');
  // The profile is read off its rules, like its OS version: the levels it actually holds.
  const profile = profileOf([...new Set(ids.map((id) => ruleById(id)?.profile).filter(Boolean))] as Profile[]);
  return { ...b, osVersion: first ? osVersionOf(first) : '', profile };
});

export const benchmarkRuleIds = (b: Benchmark) => b.groups.flatMap(groupRuleIds);

/** How many benchmarks reference a rule — the reference is shared, not copied. */
export const benchmarksUsingRule = (benchmarks: Benchmark[], ruleId: string) =>
  benchmarks.filter((b) => benchmarkRuleIds(b).includes(ruleId));

/* ── The read-only tree a benchmark is shown as ────────────────────────────────────────── */

export interface TreeNode {
  key: string;
  number: string;
  name: string;
  children: TreeNode[];
  ruleIds: string[];
}

/** Default benchmarks read as the CIS document: section › subsection › rule (two levels).
 *  Custom ones read one level deep: group › rule. A rule's number is its position in its section
 *  IN THAT BENCHMARK, derived here — nothing is stored. */
export function benchmarkTree(b: Benchmark): TreeNode[] {
  if (b.origin === 'Custom') {
    return b.groups.map((g, i) => ({ key: g.id, number: String(i + 1), name: g.name || 'Untitled group', children: [], ruleIds: groupRuleIds(g) }));
  }
  const rules = benchmarkRuleIds(b).map(ruleById).filter(Boolean) as ComplianceRule[];
  const sections = new Map<string, TreeNode>();
  for (const r of rules) {
    const [sn, sname] = r.section;
    if (!sections.has(sn)) sections.set(sn, { key: sn, number: sn, name: sname, children: [], ruleIds: [] });
    const sec = sections.get(sn)!;
    if (r.subsection) {
      const [un, uname] = r.subsection;
      let sub = sec.children.find((c) => c.number === un);
      if (!sub) { sub = { key: un, number: un, name: uname, children: [], ruleIds: [] }; sec.children.push(sub); }
      sub.ruleIds.push(r.id);
    } else {
      sec.ruleIds.push(r.id);
    }
  }
  const byNum = (a: TreeNode, z: TreeNode) => a.number.localeCompare(z.number, undefined, { numeric: true });
  return [...sections.values()].sort(byNum).map((s) => ({ ...s, children: s.children.sort(byNum) }));
}

/** A benchmark as rule groups. Custom = its own groups; Default = its CIS tree, each section a
 *  group and each subsection a sub-group — so both read the same three levels. The admin
 *  Benchmark page and every technician page read groups through here. */
export function benchmarkGroups(b: Benchmark): RuleGroup[] {
  if (b.origin === 'Custom') return b.groups;
  return benchmarkTree(b).map((s) => ({
    id: `${b.id}-${s.key}`,
    name: s.name,
    ruleIds: s.ruleIds,
    children: s.children.map((c) => ({ id: `${b.id}-${s.key}-${c.key}`, name: c.name, ruleIds: c.ruleIds })),
  }));
}

/* ── The hierarchy numbers every page shows ───────────────────────────────────────────────
 * The admin's scheme, in ONE place: groups 1, 2, 3 … ; a group's own rules number 1.1, 1.2 … ;
 * a sub-group takes the next number after them (1.3) and its rules take the third level
 * (1.3.1, 1.3.2 …). Derived from the benchmark's order — nothing is stored. */
export interface NumberedRule { id: string; number: string }
export interface NumberedGroup {
  key: string;
  number: string;
  name: string;
  rules: NumberedRule[];
  children: { key: string; number: string; name: string; rules: NumberedRule[] }[];
}
export function numberedGroups(b: Benchmark): NumberedGroup[] {
  return benchmarkGroups(b).map((g, i) => {
    const n = String(i + 1);
    return {
      key: g.id,
      number: n,
      name: g.name || 'Untitled group',
      rules: g.ruleIds.map((id, j) => ({ id, number: `${n}.${j + 1}` })),
      children: (g.children ?? []).map((s, k) => {
        const sn = `${n}.${g.ruleIds.length + k + 1}`;
        return { key: s.id, number: sn, name: s.name || 'Untitled sub-group', rules: s.ruleIds.map((id, j) => ({ id, number: `${sn}.${j + 1}` })) };
      }),
    };
  });
}
/** Rule id → its number in this benchmark (e.g. "1.3.2"). */
export function ruleNumbers(b: Benchmark): Map<string, string> {
  const m = new Map<string, string>();
  // Any depth: rules 1.1, 1.2 …, then sub-groups take the next numbers and recurse.
  const walk = (g: RuleGroup, n: string) => {
    g.ruleIds.forEach((id, j) => m.set(id, `${n}.${j + 1}`));
    (g.children ?? []).forEach((c, k) => walk(c, `${n}.${g.ruleIds.length + k + 1}`));
  };
  benchmarkGroups(b).forEach((g, i) => walk(g, String(i + 1)));
  return m;
}
/** Sorts "1.10" after "1.9". */
export const byRuleNumber = (a: string, z: string) => a.localeCompare(z, undefined, { numeric: true });

/* ── Formatting ────────────────────────────────────────────────────────────────────────── */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export function fmtDate(iso: string) {
  const d = new Date(iso);
  const h = d.getHours();
  return `${String(d.getDate()).padStart(2, '0')} ${MONTHS[d.getMonth()]} ${d.getFullYear()}, ${String(((h + 11) % 12) + 1).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
}
