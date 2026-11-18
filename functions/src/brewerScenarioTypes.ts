// Types partagés entre le magasin serveur et le front. Ce module n'importe jamais firebase-admin :
// le front le lit, et ce paquet n'est installé que dans functions/node_modules.

export type BrewerScenarioCommand = {
  operationId: string; scenarioId: string; expectedRevision: number;
} & (
  | { kind: 'saveResult'; result: unknown; previousSnapshotReference?: string; reason?: string }
  | { kind: 'observe'; snapshotReference: string; branchId?: string; observationId: string; observedAt: string; observation: unknown }
  | { kind: 'preferBranch'; snapshotReference: string; branchId: string; branchReference: string; preferenceId: string; reason: string; interpretation?: string }
);

export interface BrewerScenarioReceipt {
  scope: 'serverConfirmed'; scenarioId: string; operationId: string;
  revision: number; reference: string; committedAt: string;
}
