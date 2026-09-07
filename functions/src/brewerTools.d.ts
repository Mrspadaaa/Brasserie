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
export declare function refreshCompanionRecipe(recipe: any): any;
