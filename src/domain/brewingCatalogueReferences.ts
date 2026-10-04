import { loadGuideVarieties } from './hopIndex/referenceVarieties';
import { proposedBrewingPredictionKnowledge, storedPredictionKnowledge } from './hopIndex/predictionReferences';
import { yeastReferences } from './yeastReferences';
import { brewingStyleGuides } from './brewingStyles';
import type { HopVariety } from '../../functions/src/hopIndexSchema';
import type { HopKnowledge } from '../../functions/src/hopPredictionSchema';

/** Reference identities are read-only until an explicit catalogue command
 * saves an enriched canonical record with the same ID. */
export async function loadBrewingCatalogueReferences(): Promise<{ varieties: HopVariety[]; knowledge: HopKnowledge[] }> {
  const data = await (references ??= loadGuideVarieties().then(varieties => ({ varieties,
    knowledge: [...new Map([
      ...proposedBrewingPredictionKnowledge(), ...yeastReferences([]).map(storedPredictionKnowledge), ...brewingStyleGuides([])
    ].map(row => [row.id, row])).values()]
  })).catch(error => { references = undefined; throw error; }));
  return structuredClone(data);
}
let references: Promise<{ varieties: HopVariety[]; knowledge: HopKnowledge[] }> | undefined;
