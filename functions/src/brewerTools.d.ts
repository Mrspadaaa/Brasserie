import type { BrewerContext, BrewerEvidence } from './companionTypes.js';
export declare const brewerToolDeclarations: Array<{
  name: string;
  description: string;
  parameters: unknown;
}>;
export declare function runBrewerTool(
  name: string,
  args: Record<string, unknown>,
  context: BrewerContext
): Omit<BrewerEvidence, 'id'>;
export declare function normalizeRecipe(recipe: any): any;
export declare function refreshCompanionRecipe(recipe: any, options?: { changedPaths?: string[]; knowledge?: any[] }): any;
export declare function reconcileRecipeWater(recipe: any, paths: string[], sources?: any[]): any;
export declare function waterRelatedPath(path: string): boolean;
export declare function loadBrewingCatalogueReferences(): Promise<{
  varieties: import('./hopIndexSchema.js').HopVariety[];
  knowledge: import('./hopPredictionSchema.js').HopKnowledge[];
}>;
/** Canonical server/browser scenario preparation; it performs no write or network access. */
export declare function prepareBrewingScenarioContext(
  context: BrewerContext,
  options?: { culture?: import('./brewerHopAdviceContextBinding.js').BrewerHopAdvicePreparedCultureV1 }
): import('./brewerHopAdviceContextBinding.js').BrewerHopAdvicePreparedContextV1;
/** The deployed JSON boundary uses the very same validated browser reducers. */
export declare const brewingScenarioDossierApi: {
  createBrewingScenarioDossier(input: any): { dossier: any; event: any };
  createBrewingScenarioResultRevisionEvent(input: any): any;
  createBrewingScenarioBranchPreferenceEvent(input: any): any;
  createBrewingScenarioObservationEvent(input: any): any;
  applyBrewingScenarioEvent(dossier: any, event: any, previousEvents: readonly any[]): any;
  readBrewingScenarioDossier(value: unknown): any;
  readBrewingScenarioEvent(value: unknown): any;
  readBrewingScenarioRecord(dossier: unknown, events: readonly unknown[]): any;
  assertBrewingScenarioSizeLimit(value: unknown, maxBytes: number): number;
};
export declare const brewingScenarioArchiveApi: {
  encodeBrewingScenarioArchive(value: unknown): any;
  decodeBrewingScenarioArchive(value: unknown): any;
  compactBrewingScenarioEvidence(value: any, detail?: 'summary' | 'chemistry' | 'additions' | 'full'): any;
  readBrewingScenarioEvidence(value: unknown, resolveEvidence?: (id: string) => unknown): any;
  scenarioEvidenceForModel<T>(value: T): T;
};
