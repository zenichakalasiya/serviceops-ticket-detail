import { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { AssetsToolbar } from './AssetsToolbar';
import { CmdbTable } from './CmdbTable';
import { Pagination } from './Pagination';
import { useDrawerStack } from './DrawerStack';
import { CmdbDrawer } from './CmdbDrawer';

/** The four states the product records on a CI. */
export type CiStatus = 'Operational' | 'Non-Operational' | 'In Maintenance' | 'Retired';

export interface Ci {
  id: string;
  name: string;
  /** small colored dot before the name (agent health); omit for none */
  nameDot?: string;
  ciType: string;
  status: CiStatus;
  hostName: string;
  ipAddress: string;
  /** "Used By" person, or null = --- */
  usedBy: string | null;
  managedByGroup: string;
  managedBy: { name: string; initials?: string; color?: string } | null;
}

const GREEN = '#22C55E';
const YELLOW = '#EAB308';

const RM = { name: 'Rohan Mehta', initials: 'RM', color: '#6366F1' };
const TK = { name: 'Tabrez Khan', initials: 'TK', color: '#3D8BD0' };
const VS = { name: 'Vikram Sethi', initials: 'VS', color: '#10B981' };
const IQ = { name: 'Imran Qureshi', initials: 'IQ', color: '#F59E0B' };
const NR = { name: 'Neha Raje', initials: 'NR', color: '#EC4899' };
const FS = { name: 'Farah Sheikh', initials: 'FS', color: '#A78BFA' };

export const mockCis: Ci[] = [
  { id: 'CI-907', name: 'Email Service', ciType: 'Base CI', status: 'Operational', hostName: '---', ipAddress: '---', usedBy: null, managedByGroup: 'IT Operations', managedBy: null },
  { id: 'CI-906', name: 'SAP ERP — Production', ciType: 'Application', status: 'Operational', hostName: 'SAP-PRD-APP', ipAddress: '10.20.50.11', usedBy: null, managedByGroup: 'Datacenter Team', managedBy: VS },
  { id: 'CI-905', name: 'MacBook Pro 16" — Design', nameDot: GREEN, ciType: 'Mac Laptop', status: 'Operational', hostName: 'DSGN-MAC-0041', ipAddress: '10.20.18.41', usedBy: 'Aarav Sharma', managedByGroup: 'End User Computing', managedBy: RM },
  { id: 'CI-904', name: 'DC1-APP-01 — Application Server', ciType: 'Server', status: 'Operational', hostName: 'DC1-APP-01', ipAddress: '10.20.40.21', usedBy: null, managedByGroup: 'Datacenter Team', managedBy: IQ },
  { id: 'CI-891', name: 'Core Switch — DC1', ciType: 'Switch', status: 'Operational', hostName: 'DC1-SW-CORE-01', ipAddress: '10.20.40.2', usedBy: null, managedByGroup: 'Network Team', managedBy: IQ },
  { id: 'CI-890', name: 'Distribution Switch — HQ Floor 2', ciType: 'Switch', status: 'Operational', hostName: 'HQ-SW-DIST-02', ipAddress: '10.20.30.2', usedBy: null, managedByGroup: 'Network Team', managedBy: IQ },
  { id: 'CI-409', name: 'Salesforce CRM', ciType: 'Application', status: 'Operational', hostName: '---', ipAddress: '---', usedBy: null, managedByGroup: 'IT Operations', managedBy: null },
  { id: 'CI-659', name: 'MacBook Air 13" — Marketing', nameDot: GREEN, ciType: 'Mac Laptop', status: 'Operational', hostName: 'MKT-MAC-0067', ipAddress: '10.20.18.67', usedBy: 'Diya Kapoor', managedByGroup: 'End User Computing', managedBy: RM },
  { id: 'CI-888', name: 'Dell Latitude 7440 — Finance', nameDot: YELLOW, ciType: 'Windows Laptop', status: 'Operational', hostName: 'FIN-LT-0188', ipAddress: '10.20.22.188', usedBy: 'Priya Nair', managedByGroup: 'End User Computing', managedBy: TK },
  { id: 'CI-722', name: 'HP EliteBook 840 G10 — Sales', nameDot: GREEN, ciType: 'Windows Laptop', status: 'Operational', hostName: 'SAL-LT-0204', ipAddress: '10.20.23.204', usedBy: 'Ananya Iyer', managedByGroup: 'IT Operations', managedBy: TK },
  { id: 'CI-883', name: 'DC1-DB-PROD-01 — Database Server', ciType: 'Server', status: 'Operational', hostName: 'DC1-DB-01', ipAddress: '10.20.40.33', usedBy: null, managedByGroup: 'Datacenter Team', managedBy: VS },
  { id: 'CI-406', name: 'Online Banking Portal', ciType: 'Base CI', status: 'Operational', hostName: '---', ipAddress: '---', usedBy: null, managedByGroup: 'Datacenter Team', managedBy: null },
  { id: 'CI-664', name: 'FortiGate Firewall — HQ Edge', ciType: 'Hardware', status: 'Operational', hostName: 'HQ-FW-EDGE-01', ipAddress: '10.20.30.1', usedBy: null, managedByGroup: 'Network Team', managedBy: IQ },
  { id: 'CI-686', name: 'Backup NAS — DC1', ciType: 'Server', status: 'Operational', hostName: 'DC1-NAS-01', ipAddress: '10.20.40.50', usedBy: null, managedByGroup: 'Datacenter Team', managedBy: VS },
  { id: 'CI-238', name: 'Payroll Service', ciType: 'Base CI', status: 'Operational', hostName: '---', ipAddress: '---', usedBy: null, managedByGroup: 'IT Operations', managedBy: null },
  { id: 'CI-687', name: 'HP LaserJet Pro M404dn — Floor 2', ciType: 'Hardware', status: 'Non-Operational', hostName: 'OFC-PRT-0207', ipAddress: '10.20.30.207', usedBy: null, managedByGroup: 'IT Operations', managedBy: null },
  { id: 'CI-778', name: 'Lenovo ThinkPad T14 — Support', nameDot: YELLOW, ciType: 'Windows Laptop', status: 'Operational', hostName: 'SUP-LT-0108', ipAddress: '10.20.24.108', usedBy: 'Rahul Verma', managedByGroup: 'IT Operations', managedBy: NR },
  { id: 'CI-662', name: 'Dell OptiPlex 7010 — Reception', ciType: 'Windows Laptop', status: 'Retired', hostName: 'REC-DT-0023', ipAddress: '10.20.21.23', usedBy: null, managedByGroup: 'Service Desk', managedBy: FS },
  { id: 'CI-893', name: 'ThinkPad X1 Carbon — Engineering', nameDot: GREEN, ciType: 'Windows Laptop', status: 'Operational', hostName: 'ENG-LT-0312', ipAddress: '10.20.19.112', usedBy: 'Karan Malhotra', managedByGroup: 'IT Operations', managedBy: NR },
  { id: 'CI-886', name: 'MacBook Pro 14" — Product', nameDot: GREEN, ciType: 'Mac Laptop', status: 'Operational', hostName: 'PRD-MAC-0019', ipAddress: '10.20.18.19', usedBy: 'Siddharth Rao', managedByGroup: 'End User Computing', managedBy: RM },
  { id: 'CI-233', name: 'iPhone 14 Pro — Sales', ciType: 'Mobile Devices', status: 'Operational', hostName: '---', ipAddress: '---', usedBy: 'Ananya Iyer', managedByGroup: 'End User Computing', managedBy: null },
  { id: 'CI-885', name: 'Microsoft Exchange Online', ciType: 'Application', status: 'Operational', hostName: '---', ipAddress: '---', usedBy: null, managedByGroup: 'Datacenter Team', managedBy: VS },
  /* The rest of the estate, so every class in the CI tree has instances behind it —
     the network edge, the storage and power that sit under the racks, the virtualization
     layer, the cloud footprint and the application tier. */
  { id: 'CI-901', name: 'HQ-RTR-EDGE-01 — Internet Router', ciType: 'Router', status: 'Operational', hostName: 'HQ-RTR-EDGE-01', ipAddress: '10.20.30.254', usedBy: null, managedByGroup: 'Network Team', managedBy: IQ },
  { id: 'CI-899', name: 'DC1-RTR-CORE-01 — Core Router', ciType: 'Router', status: 'Operational', hostName: 'DC1-RTR-CORE-01', ipAddress: '10.20.40.254', usedBy: null, managedByGroup: 'Network Team', managedBy: IQ },
  { id: 'CI-897', name: 'Palo Alto PA-3220 — DC Edge', ciType: 'Firewall', status: 'Operational', hostName: 'DC1-FW-EDGE-01', ipAddress: '10.20.40.1', usedBy: null, managedByGroup: 'Network Team', managedBy: IQ },
  { id: 'CI-895', name: 'NetApp AFF A400 — Primary Array', ciType: 'Storage Area Network (SAN)', status: 'Operational', hostName: 'DC1-STG-A400', ipAddress: '10.20.41.10', usedBy: null, managedByGroup: 'Datacenter Team', managedBy: VS },
  { id: 'CI-894', name: 'Hitachi VSP E790 — Replication Target', ciType: 'Disk Array', status: 'Operational', hostName: 'DC2-STG-E790', ipAddress: '10.21.41.10', usedBy: null, managedByGroup: 'Datacenter Team', managedBy: VS },
  { id: 'CI-892', name: 'Dell OptiPlex 7010 — Finance Desk 4', nameDot: GREEN, ciType: 'Windows Desktop', status: 'Operational', hostName: 'FIN-DT-0044', ipAddress: '10.20.21.44', usedBy: 'Meera Joshi', managedByGroup: 'End User Computing', managedBy: TK },
  { id: 'CI-889', name: 'HP ProDesk 600 G9 — Support Desk 2', nameDot: YELLOW, ciType: 'Windows Desktop', status: 'Operational', hostName: 'SUP-DT-0012', ipAddress: '10.20.24.12', usedBy: 'Rahul Verma', managedByGroup: 'Service Desk', managedBy: FS },
  { id: 'CI-887', name: 'Lenovo ThinkCentre M70q — Reception', ciType: 'Windows Desktop', status: 'Retired', hostName: 'REC-DT-0031', ipAddress: '10.20.21.31', usedBy: null, managedByGroup: 'Service Desk', managedBy: FS },
  { id: 'CI-884', name: 'HP LaserJet M507dn — Floor 3', ciType: 'Printer', status: 'Operational', hostName: 'OFC-PRT-0311', ipAddress: '10.20.30.211', usedBy: null, managedByGroup: 'IT Operations', managedBy: null },
  { id: 'CI-882', name: 'Canon imageRUNNER 2630 — Finance', ciType: 'Printer', status: 'Operational', hostName: 'FIN-PRT-0104', ipAddress: '10.20.30.204', usedBy: null, managedByGroup: 'IT Operations', managedBy: null },
  { id: 'CI-880', name: 'APC Smart-UPS 5000VA — DC1 Row A', ciType: 'UPS', status: 'Operational', hostName: 'DC1-UPS-A01', ipAddress: '10.20.42.11', usedBy: null, managedByGroup: 'Datacenter Team', managedBy: VS },
  { id: 'CI-878', name: 'Schneider Galaxy VS — HQ Comms Room', ciType: 'UPS', status: 'Operational', hostName: 'HQ-UPS-01', ipAddress: '10.20.30.61', usedBy: null, managedByGroup: 'IT Operations', managedBy: IQ },
  { id: 'CI-875', name: 'DC1 Rack A01 — Compute', ciType: 'Rack', status: 'Operational', hostName: '---', ipAddress: '---', usedBy: null, managedByGroup: 'Datacenter Team', managedBy: VS },
  { id: 'CI-872', name: 'DC1 Rack B03 — Storage', ciType: 'Rack', status: 'Operational', hostName: '---', ipAddress: '---', usedBy: null, managedByGroup: 'Datacenter Team', managedBy: VS },
  { id: 'CI-870', name: 'Dell PowerEdge MX7000 — Blade Chassis', ciType: 'Chassis', status: 'Operational', hostName: 'DC1-CHS-MX01', ipAddress: '10.20.40.90', usedBy: null, managedByGroup: 'Datacenter Team', managedBy: VS },
  { id: 'CI-868', name: 'ESXi Host 01 — Production Cluster', ciType: 'VMware ESXi', status: 'Operational', hostName: 'DC1-ESX-01', ipAddress: '10.20.43.11', usedBy: null, managedByGroup: 'Datacenter Team', managedBy: IQ },
  { id: 'CI-865', name: 'ESXi Host 02 — Production Cluster', ciType: 'VMware ESXi', status: 'Operational', hostName: 'DC1-ESX-02', ipAddress: '10.20.43.12', usedBy: null, managedByGroup: 'Datacenter Team', managedBy: IQ },
  { id: 'CI-862', name: 'VM — SAP Application Tier', ciType: 'Virtual Machines', status: 'Operational', hostName: 'VM-SAP-APP-01', ipAddress: '10.20.44.21', usedBy: null, managedByGroup: 'Datacenter Team', managedBy: VS },
  { id: 'CI-860', name: 'VM — Jenkins Build Agent', ciType: 'Virtual Machines', status: 'Operational', hostName: 'VM-BLD-AGT-03', ipAddress: '10.20.44.33', usedBy: null, managedByGroup: 'IT Operations', managedBy: NR },
  { id: 'CI-858', name: 'VM — Legacy Reporting', ciType: 'Virtual Machines', status: 'Retired', hostName: 'VM-RPT-LEG-01', ipAddress: '10.20.44.51', usedBy: null, managedByGroup: 'IT Operations', managedBy: null },
  { id: 'CI-855', name: 'AWS Production Account — ap-south-1', ciType: 'Public Cloud Service', status: 'Operational', hostName: '---', ipAddress: '---', usedBy: null, managedByGroup: 'Datacenter Team', managedBy: VS },
  { id: 'CI-852', name: 'Azure Subscription — Corporate IT', ciType: 'Public Cloud Service', status: 'Operational', hostName: '---', ipAddress: '---', usedBy: null, managedByGroup: 'IT Operations', managedBy: NR },
  { id: 'CI-850', name: 'VMware Private Cloud — DC2', ciType: 'Private Cloud Service', status: 'Operational', hostName: '---', ipAddress: '---', usedBy: null, managedByGroup: 'Datacenter Team', managedBy: IQ },
  { id: 'CI-848', name: 'OpenStack Tenant — Engineering Lab', ciType: 'Private Cloud Service', status: 'In Maintenance', hostName: '---', ipAddress: '---', usedBy: null, managedByGroup: 'IT Operations', managedBy: null },
  { id: 'CI-845', name: 'NGINX — Customer Portal Frontend', ciType: 'Nginx Web Server', status: 'Operational', hostName: 'DC1-WEB-01', ipAddress: '10.20.45.11', usedBy: null, managedByGroup: 'Datacenter Team', managedBy: VS },
  { id: 'CI-843', name: 'Apache Tomcat — Intranet', ciType: 'Tomcat Server', status: 'Operational', hostName: 'DC1-WEB-04', ipAddress: '10.20.45.14', usedBy: null, managedByGroup: 'IT Operations', managedBy: NR },
  { id: 'CI-841', name: 'PostgreSQL 16 — Billing', ciType: 'PostgreSQL', status: 'Operational', hostName: 'DC1-DB-PG-01', ipAddress: '10.20.46.11', usedBy: null, managedByGroup: 'Datacenter Team', managedBy: FS },
  { id: 'CI-839', name: 'SQL Server 2022 — CRM Reporting', ciType: 'SQL Server', status: 'Operational', hostName: 'DC1-DB-MS-02', ipAddress: '10.20.46.22', usedBy: null, managedByGroup: 'Datacenter Team', managedBy: FS },
  { id: 'CI-836', name: 'Samsung Galaxy S24 — Field Ops', ciType: 'Android Mobile', status: 'Operational', hostName: '---', ipAddress: '---', usedBy: 'Karan Malhotra', managedByGroup: 'End User Computing', managedBy: null },
  { id: 'CI-834', name: 'HR Onboarding Service', ciType: 'Base CI', status: 'Operational', hostName: '---', ipAddress: '---', usedBy: null, managedByGroup: 'IT Operations', managedBy: null },
  /* One instance for each remaining leaf of the admin's class tree, so no branch of the
     rail reads as empty and every class can be demonstrated. */
  { id: 'CI-799', name: 'DC1-AD-01 — Domain Controller', ciType: 'Windows Server', status: 'Operational', hostName: 'DC1-AD-01', ipAddress: '10.20.40.5', usedBy: null, managedByGroup: 'Datacenter Team', managedBy: VS },
  { id: 'CI-797', name: 'DC1-FILE-01 — File Server', ciType: 'Windows Server', status: 'Operational', hostName: 'DC1-FILE-01', ipAddress: '10.20.40.15', usedBy: null, managedByGroup: 'Datacenter Team', managedBy: IQ },
  { id: 'CI-795', name: 'DC1-UX-01 — Billing Batch Host', ciType: 'UNIX Server', status: 'Operational', hostName: 'DC1-UX-01', ipAddress: '10.20.47.11', usedBy: null, managedByGroup: 'Datacenter Team', managedBy: VS },
  { id: 'CI-793', name: 'DC1-AIX-01 — Core Banking', ciType: 'AIX Server', status: 'Operational', hostName: 'DC1-AIX-01', ipAddress: '10.20.47.21', usedBy: null, managedByGroup: 'Datacenter Team', managedBy: VS },
  { id: 'CI-791', name: 'DC1-VIOS-01 — I/O Server', ciType: 'VIOS Server', status: 'Operational', hostName: 'DC1-VIOS-01', ipAddress: '10.20.47.31', usedBy: null, managedByGroup: 'Datacenter Team', managedBy: IQ },
  { id: 'CI-789', name: 'DC1-SOL-01 — Legacy Reporting', ciType: 'Solaris Server', status: 'Retired', hostName: 'DC1-SOL-01', ipAddress: '10.20.47.41', usedBy: null, managedByGroup: 'Datacenter Team', managedBy: null },
  { id: 'CI-787', name: 'DC1-VMW-01 — Virtualization Host', ciType: 'VMWARE Server', status: 'Operational', hostName: 'DC1-VMW-01', ipAddress: '10.20.43.21', usedBy: null, managedByGroup: 'Datacenter Team', managedBy: IQ },
  { id: 'CI-785', name: 'Ubuntu Workstation — Engineering Lab', nameDot: GREEN, ciType: 'Linux Desktop', status: 'Operational', hostName: 'ENG-DT-0077', ipAddress: '10.20.19.77', usedBy: 'Karan Malhotra', managedByGroup: 'IT Operations', managedBy: NR },
  { id: 'CI-783', name: 'iMac 24" — Design Studio', nameDot: GREEN, ciType: 'Mac Desktop', status: 'Operational', hostName: 'DSGN-DT-0009', ipAddress: '10.20.18.9', usedBy: 'Aarav Sharma', managedByGroup: 'End User Computing', managedBy: RM },
  { id: 'CI-781', name: 'Dell XPS 13 — Platform Engineering', nameDot: GREEN, ciType: 'Linux Laptop', status: 'Operational', hostName: 'ENG-LT-0455', ipAddress: '10.20.19.155', usedBy: 'Siddharth Rao', managedByGroup: 'IT Operations', managedBy: NR },
  { id: 'CI-779', name: 'Acer Chromebook 314 — Front Desk', ciType: 'Chromebook Laptop', status: 'Non-Operational', hostName: 'REC-CB-0002', ipAddress: '10.20.21.62', usedBy: null, managedByGroup: 'Service Desk', managedBy: FS },
  { id: 'CI-776', name: 'F5 BIG-IP — Application Delivery', ciType: 'Load Balancer', status: 'Operational', hostName: 'DC1-LB-01', ipAddress: '10.20.40.7', usedBy: null, managedByGroup: 'Network Team', managedBy: IQ },
  { id: 'CI-774', name: 'Aruba AP-535 — HQ Floor 2', ciType: 'Access Points', status: 'Operational', hostName: 'HQ-AP-0201', ipAddress: '10.20.31.21', usedBy: null, managedByGroup: 'Network Team', managedBy: IQ },
  { id: 'CI-772', name: 'Aruba AP-535 — HQ Floor 3', ciType: 'Access Points', status: 'Operational', hostName: 'HQ-AP-0301', ipAddress: '10.20.31.31', usedBy: null, managedByGroup: 'Network Team', managedBy: IQ },
  { id: 'CI-770', name: 'Server VLAN — 10.20.40.0/24', ciType: 'IP Address', status: 'Operational', hostName: '---', ipAddress: '10.20.40.0', usedBy: null, managedByGroup: 'Network Team', managedBy: TK },
  { id: 'CI-768', name: 'iPhone 15 — Field Engineering', ciType: 'Ios Mobile', status: 'Operational', hostName: '---', ipAddress: '---', usedBy: 'Rahul Verma', managedByGroup: 'End User Computing', managedBy: null },
  { id: 'CI-766', name: 'Samsung Galaxy Tab S9 — Warehouse', ciType: 'Android Tablet', status: 'Operational', hostName: '---', ipAddress: '---', usedBy: 'Meera Joshi', managedByGroup: 'End User Computing', managedBy: null },
  { id: 'CI-764', name: 'iPad Pro 11" — Executive', ciType: 'IOS Tablet', status: 'Operational', hostName: '---', ipAddress: '---', usedBy: 'Diya Kapoor', managedByGroup: 'End User Computing', managedBy: RM },
  { id: 'CI-762', name: 'Chennai Data Centre — DC1', ciType: 'Data Centres', status: 'Operational', hostName: '---', ipAddress: '---', usedBy: null, managedByGroup: 'Datacenter Team', managedBy: VS },
  { id: 'CI-760', name: 'Ahmedabad HQ — Comms Room 2F', ciType: 'Server Rooms', status: 'Operational', hostName: '---', ipAddress: '---', usedBy: null, managedByGroup: 'IT Operations', managedBy: IQ },
  { id: 'CI-758', name: 'Pune Branch Office', ciType: 'Remote Sites', status: 'Operational', hostName: '---', ipAddress: '---', usedBy: null, managedByGroup: 'IT Operations', managedBy: NR },
  { id: 'CI-756', name: 'Customer Portal — Application Service', ciType: 'Application Service', status: 'Operational', hostName: '---', ipAddress: '---', usedBy: null, managedByGroup: 'Datacenter Team', managedBy: VS },
  { id: 'CI-754', name: 'Order to Cash', ciType: 'Business Service', status: 'Operational', hostName: '---', ipAddress: '---', usedBy: null, managedByGroup: 'IT Operations', managedBy: NR },
  { id: 'CI-752', name: 'Employee Self-Service Portal', ciType: 'Business Applications', status: 'Operational', hostName: '---', ipAddress: '---', usedBy: null, managedByGroup: 'IT Operations', managedBy: null },
  { id: 'CI-750', name: 'Identity & Access Management', ciType: 'Technical Service', status: 'Operational', hostName: '---', ipAddress: '---', usedBy: null, managedByGroup: 'IT Operations', managedBy: TK },
  { id: 'CI-748', name: 'Corporate Network Connectivity', ciType: 'Infrastructure Service', status: 'Operational', hostName: '---', ipAddress: '---', usedBy: null, managedByGroup: 'Network Team', managedBy: IQ },
  { id: 'CI-746', name: 'vCenter Server — Production', ciType: 'VMware vCenter', status: 'Operational', hostName: 'DC1-VC-01', ipAddress: '10.20.43.5', usedBy: null, managedByGroup: 'Datacenter Team', managedBy: IQ },
  { id: 'CI-744', name: 'Hyper-V Host — Branch Workloads', ciType: 'Hyper-V Server', status: 'Operational', hostName: 'BR1-HV-01', ipAddress: '10.22.43.11', usedBy: null, managedByGroup: 'Datacenter Team', managedBy: VS },
  { id: 'CI-742', name: 'EC2 — Portal Web Tier (Windows)', ciType: 'Aws Windows', status: 'Operational', hostName: 'i-0a91c4e2', ipAddress: '10.30.10.21', usedBy: null, managedByGroup: 'Datacenter Team', managedBy: VS },
  { id: 'CI-740', name: 'EC2 — API Gateway Node (Linux)', ciType: 'Aws Linux', status: 'Operational', hostName: 'i-0b72d5f9', ipAddress: '10.30.10.34', usedBy: null, managedByGroup: 'Datacenter Team', managedBy: VS },
  { id: 'CI-738', name: 'S3 — Invoice Archive Bucket', ciType: 'S3', status: 'Operational', hostName: '---', ipAddress: '---', usedBy: null, managedByGroup: 'Datacenter Team', managedBy: FS },
  { id: 'CI-736', name: 'RDS — Billing Aurora Cluster', ciType: 'RDS', status: 'Operational', hostName: '---', ipAddress: '---', usedBy: null, managedByGroup: 'Datacenter Team', managedBy: FS },
  { id: 'CI-734', name: 'Azure VM — Corporate File Server', ciType: 'Azure Windows', status: 'Operational', hostName: 'AZ-FILE-01', ipAddress: '10.40.10.11', usedBy: null, managedByGroup: 'IT Operations', managedBy: NR },
  { id: 'CI-732', name: 'Azure VM — Build Runner', ciType: 'Azure Linux', status: 'Operational', hostName: 'AZ-BLD-02', ipAddress: '10.40.10.22', usedBy: null, managedByGroup: 'IT Operations', managedBy: NR },
  { id: 'CI-730', name: 'Azure Blob — Backup Vault', ciType: 'Azure Storage', status: 'Operational', hostName: '---', ipAddress: '---', usedBy: null, managedByGroup: 'Datacenter Team', managedBy: VS },
  { id: 'CI-728', name: 'Azure SQL — CRM Database', ciType: 'Azure Database', status: 'Operational', hostName: '---', ipAddress: '---', usedBy: null, managedByGroup: 'Datacenter Team', managedBy: FS },
  { id: 'CI-726', name: 'GCP Project — Analytics Sandbox', ciType: 'GCP', status: 'In Maintenance', hostName: '---', ipAddress: '---', usedBy: null, managedByGroup: 'IT Operations', managedBy: null },
  { id: 'CI-724', name: 'Nutanix Prism Central — DC2', ciType: 'Nutanix Prism', status: 'Operational', hostName: 'DC2-PRISM-01', ipAddress: '10.21.43.5', usedBy: null, managedByGroup: 'Datacenter Team', managedBy: IQ },
  { id: 'CI-720', name: 'Nutanix Cluster — DC2 Production', ciType: 'Nutanix Cluster', status: 'Operational', hostName: 'DC2-NTX-CL01', ipAddress: '10.21.43.11', usedBy: null, managedByGroup: 'Datacenter Team', managedBy: IQ },
  { id: 'CI-718', name: 'Nutanix Host — DC2 Node 1', ciType: 'Nutanix Host', status: 'Operational', hostName: 'DC2-NTX-N01', ipAddress: '10.21.43.21', usedBy: null, managedByGroup: 'Datacenter Team', managedBy: VS },
  { id: 'CI-716', name: 'Nutanix VM — Test Harness', ciType: 'Nutanix VM', status: 'Operational', hostName: 'DC2-NTX-VM07', ipAddress: '10.21.44.7', usedBy: null, managedByGroup: 'IT Operations', managedBy: NR },
  { id: 'CI-714', name: 'Nutanix Storage Pool — DC2 Default', ciType: 'Nutanix Storage Pool', status: 'Operational', hostName: '---', ipAddress: '---', usedBy: null, managedByGroup: 'Datacenter Team', managedBy: VS },
  { id: 'CI-712', name: 'Nutanix Storage Container — VM Store', ciType: 'Nutanix Storage Container', status: 'Operational', hostName: '---', ipAddress: '---', usedBy: null, managedByGroup: 'Datacenter Team', managedBy: VS },
  { id: 'CI-710', name: 'Apache HTTPD — Legacy Intranet', ciType: 'Apache Web Server', status: 'Operational', hostName: 'DC1-WEB-07', ipAddress: '10.20.45.17', usedBy: null, managedByGroup: 'IT Operations', managedBy: NR },
  { id: 'CI-708', name: 'IIS — Partner Extranet', ciType: 'IIS Web Server', status: 'Operational', hostName: 'DC1-WEB-09', ipAddress: '10.20.45.19', usedBy: null, managedByGroup: 'Datacenter Team', managedBy: VS },
  { id: 'CI-706', name: 'MySQL 8 — Employee Portal', ciType: 'MySQL', status: 'Operational', hostName: 'DC1-DB-MY-01', ipAddress: '10.20.46.31', usedBy: null, managedByGroup: 'Datacenter Team', managedBy: FS },
  { id: 'CI-704', name: 'Oracle 19c — Core Banking', ciType: 'Oracle', status: 'Operational', hostName: 'DC1-DB-OR-01', ipAddress: '10.20.46.41', usedBy: null, managedByGroup: 'Datacenter Team', managedBy: FS },
];

export function CmdbListPage({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [cis] = useState<Ci[]>(mockCis);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [sortColumn, setSortColumn] = useState<keyof Ci | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [searchQuery, setSearchQuery] = useState('');
  const [openCis, setOpenCis] = useState<Ci[]>([]);
  const [activeCiId, setActiveCiId] = useState<string | null>(null);

  useEffect(() => { setCurrentPage(1); }, [searchQuery]);

  const { open: openInStack } = useDrawerStack();

  const handleOpenCi = (ci: Ci) => {
    openInStack('cmdb', ci.id, ci.name, ci);
  };
  const handleOpenRelation = (rel: { ticketId: string; subject: string }) => {
    handleOpenCi({ ...mockCis[Math.abs([...rel.ticketId].reduce((a, c) => a + c.charCodeAt(0), 0)) % mockCis.length], id: rel.ticketId, name: rel.subject });
  };

  const handleCloseDrawer = () => { setOpenCis([]); setActiveCiId(null); };
  const handleCloseTab = (ciId: string) => {
    const updated = openCis.filter(c => c.id !== ciId);
    setOpenCis(updated);
    if (activeCiId === ciId) setActiveCiId(updated.length > 0 ? updated[updated.length - 1].id : null);
  };
  const handleTabChange = (ciId: string) => setActiveCiId(ciId);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelected(new Set(cis.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(c => c.id)));
    } else {
      setSelected(new Set());
    }
  };
  const handleSelect = (id: string, checked: boolean) => {
    const next = new Set(selected);
    checked ? next.add(id) : next.delete(id);
    setSelected(next);
  };
  const handleSort = (column: keyof Ci) => {
    if (sortColumn === column) setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    else { setSortColumn(column); setSortDirection('asc'); }
  };

  let filtered = cis;
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filtered = cis.filter(c =>
      c.id.toLowerCase().includes(q) ||
      c.name.toLowerCase().includes(q) ||
      c.ciType.toLowerCase().includes(q) ||
      c.status.toLowerCase().includes(q) ||
      c.hostName.toLowerCase().includes(q) ||
      c.ipAddress.toLowerCase().includes(q) ||
      (c.usedBy ?? '').toLowerCase().includes(q) ||
      c.managedByGroup.toLowerCase().includes(q)
    );
  }

  let sorted = [...filtered];
  if (sortColumn) {
    sorted.sort((a, b) => {
      const aStr = String(a[sortColumn] ?? '');
      const bStr = String(b[sortColumn] ?? '');
      return sortDirection === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
    });
  }

  const totalPages = Math.ceil(sorted.length / itemsPerPage) || 1;
  const paginated = sorted.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const currentPageIds = paginated.map(c => c.id);
  const allCurrentSelected = currentPageIds.every(id => selected.has(id)) && currentPageIds.length > 0;

  return (
    <div className="flex h-screen bg-[#f9fafb]">
      <Sidebar activePage="cmdb" onNavigate={onNavigate} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header selectedCount={selected.size} />
        <AssetsToolbar searchQuery={searchQuery} setSearchQuery={setSearchQuery} title="Base CI" viewLabel="All CI" />
        <main className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-auto bg-white min-h-0">
            <CmdbTable
              cis={paginated}
              selected={selected}
              allSelected={allCurrentSelected}
              onSelectAll={handleSelectAll}
              onSelect={handleSelect}
              onSort={handleSort}
              sortColumn={sortColumn}
              sortDirection={sortDirection}
              onCiClick={handleOpenCi}
            />
          </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              itemsPerPage={itemsPerPage}
              totalItems={sorted.length}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={(v) => { setItemsPerPage(v); setCurrentPage(1); }}
            />
        </main>
      </div>
      <CmdbDrawer
        openAssets={openCis}
        activeAssetId={activeCiId}
        onClose={handleCloseDrawer}
        onCloseTab={handleCloseTab}
        onTabChange={handleTabChange}
        onOpenRelation={handleOpenRelation}
      />
    </div>
  );
}
