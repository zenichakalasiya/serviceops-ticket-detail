/* Every detail drawer, loaded ON DEMAND.

   The drawers are the heaviest files in the app (several are 6k+ lines), and two places used to
   import all of them statically: the cross-module host (`DrawerStack`) and the old list pages that
   still own the mock data. That pulled every drawer of every module into the first download, so a
   link to ANY screen paid for all of them before it showed anything.

   Each export here has the same name and props as the real drawer, so a call site only swaps its
   import line. Each one carries its own <Suspense fallback={null}>: a drawer is an overlay, so while
   its file arrives the page underneath simply stays as it is — never a full-page blank. */
import { lazy, Suspense, type ComponentType } from 'react';

function lazyNamed<P>(load: () => Promise<Record<string, any>>, name: string): ComponentType<P> {
  const Lazy = lazy(() => load().then((m) => ({ default: m[name] as ComponentType<any> })));
  const Wrapped = (props: P) => (
    <Suspense fallback={null}>
      <Lazy {...(props as any)} />
    </Suspense>
  );
  Wrapped.displayName = `Lazy(${name})`;
  return Wrapped as ComponentType<P>;
}

export const TicketDrawer = lazyNamed<any>(() => import('./TicketDrawer'), 'TicketDrawer');
export const TicketDrawerV2 = lazyNamed<any>(() => import('./TicketDrawerV2'), 'TicketDrawerV2');
export const ProblemDrawer = lazyNamed<any>(() => import('./ProblemDrawer'), 'ProblemDrawer');
export const ChangeDrawer = lazyNamed<any>(() => import('./ChangeDrawer'), 'ChangeDrawer');
export const ReleaseDrawer = lazyNamed<any>(() => import('./ReleaseDrawer'), 'ReleaseDrawer');
export const HardwareAssetDrawer = lazyNamed<any>(() => import('./HardwareAssetDrawer'), 'HardwareAssetDrawer');
export const SoftwareAssetDrawer = lazyNamed<any>(() => import('./SoftwareAssetDrawer'), 'SoftwareAssetDrawer');
export const NonItAssetDrawer = lazyNamed<any>(() => import('./NonItAssetDrawer'), 'NonItAssetDrawer');
export const ConsumableAssetDrawer = lazyNamed<any>(() => import('./ConsumableAssetDrawer'), 'ConsumableAssetDrawer');
export const SoftwareLicenseDrawer = lazyNamed<any>(() => import('./SoftwareLicenseDrawer'), 'SoftwareLicenseDrawer');
export const ContractDrawer = lazyNamed<any>(() => import('./ContractDrawer'), 'ContractDrawer');
export const PurchaseDrawer = lazyNamed<any>(() => import('./PurchaseDrawer'), 'PurchaseDrawer');
export const CmdbDrawer = lazyNamed<any>(() => import('./CmdbDrawer'), 'CmdbDrawer');
export const PatchDrawer = lazyNamed<any>(() => import('./PatchDrawer'), 'PatchDrawer');
export const PatchDeploymentDrawer = lazyNamed<any>(() => import('./PatchDeploymentDrawer'), 'PatchDeploymentDrawer');
export const PackageDeploymentDrawer = lazyNamed<any>(() => import('./PackageDeploymentDrawer'), 'PackageDeploymentDrawer');
export const RegistryDeploymentDrawer = lazyNamed<any>(() => import('./RegistryDeploymentDrawer'), 'RegistryDeploymentDrawer');
export const KnowledgeDrawer = lazyNamed<any>(() => import('./KnowledgeDrawer'), 'KnowledgeDrawer');
export const ReportDrawer = lazyNamed<any>(() => import('./ReportDrawer'), 'ReportDrawer');
export const EndpointDrawer = lazyNamed<any>(() => import('./EndpointDrawer'), 'EndpointDrawer');
export const VulnerabilityDrawer = lazyNamed<any>(() => import('./VulnerabilityDrawer'), 'VulnerabilityDrawer');
export const DetectedCveDrawer = lazyNamed<any>(() => import('./DetectedCveDrawer'), 'DetectedCveDrawer');
export const ApprovalDrawer = lazyNamed<any>(() => import('./ApprovalDrawer'), 'ApprovalDrawer');
export const TaskDrawer = lazyNamed<any>(() => import('./TaskDrawer'), 'TaskDrawer');
export const CompliancePolicyDrawer = lazyNamed<any>(() => import('./CompliancePolicyDrawer'), 'CompliancePolicyDrawer');
export const ComplianceEndpointDrawer = lazyNamed<any>(() => import('./ComplianceEndpointDrawer'), 'ComplianceEndpointDrawer');
export const ComplianceBenchmarkDrawer = lazyNamed<any>(() => import('./ComplianceBenchmarkDrawer'), 'ComplianceBenchmarkDrawer');

/* The project drawer is the problem drawer fed through an adapter that lives in the same file —
   so the adapter is applied INSIDE the lazy boundary, or importing it would pull the drawer back in. */
export const ProjectStackDrawer = lazyNamed<any>(
  () => import('./ProjectDrawer').then((m) => ({
    ProjectStackDrawer: ({ project, ...rest }: any) => (
      <m.ProjectDrawer openProblems={[m.projectToProblemShape(project)]} {...rest} />
    ),
  })),
  'ProjectStackDrawer',
);
