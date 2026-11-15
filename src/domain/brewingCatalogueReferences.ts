import { loadGuideVarieties } from './hopIndex/referenceVarieties';
import { proposedBrewingPredictionKnowledge, storedPredictionKnowledge } from './hopIndex/predictionReferences';
import { brewingStyleGuides } from './brewingStyles';
import type { HopVariety } from '../../functions/src/hopIndexSchema';
import type { HopKnowledge } from '../../functions/src/hopPredictionSchema';

/** Reference identities are read-only until an explicit catalogue command
 * saves an enriched canonical record with the same ID. */
export async function loadBrewingCatalogueReferences(): Promise<{ varieties: HopVariety[]; knowledge: HopKnowledge[] }> {
  // l2 (10.11) : la bibliothèque de levures (1,4 Mo) arrive par `import()` au premier appel, plus avec le module : l'atelier Houblons V5.5
  // (qui n'appelle ceci qu'à son ouverture) ne la tient plus dans ses dépendances statiques. Même résultat ; la fonction était déjà asynchrone.
  const data = await (references ??= loadGuideVarieties().then(async varieties => {
    const { yeastReferences } = await import('./yeastReferences');
    return { varieties,
      knowledge: [...new Map([
        ...proposedBrewingPredictionKnowledge(), ...yeastReferences([]).map(storedPredictionKnowledge), ...brewingStyleGuides([])
      ].map(row => [row.id, row])).values()]
    };
  }).catch(error => { references = undefined; throw error; }));
  return structuredClone(data);
}
let references: Promise<{ varieties: HopVariety[]; knowledge: HopKnowledge[] }> | undefined;
