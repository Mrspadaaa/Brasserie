import type { HopKnowledge } from '../../functions/src/hopPredictionSchema';
import { yeastCatalogueLibrary } from './yeastCatalogueLibrary';
import { yeastReferencesAvec, type YeastReference } from './yeastReferencesCore';
import { enregistrerBibliothequeLevures } from './yeastLibraryPorte';

/**
 * Références de levures AVEC la bibliothèque documentaire (1,4 Mo). Ce module est le seul à importer `yeastCatalogueLibrary` ;
 * l'accueil passe par `yeastReferencesCore` (noyau) et `yeastFacts` (faits), qui ne l'importent pas (voie l2, 10.11).
 * Ses importeurs ne changent pas : les fonctions de faits et le type sont ré-exportés d'ici.
 */
export type { YeastReference };
// Évaluer ce module met la bibliothèque à la disposition des calculs synchrones du moteur (predictionReferences, scénario) : voie l3.
enregistrerBibliothequeLevures(yeastCatalogueLibrary);
export { effectiveYeastTechnicalFacts, effectiveYeastTechnicalFactSources, effectiveYeastCatalogueFacts, reviewedYeastReplacements } from './yeastFacts';
export function yeastReferences(saved?: HopKnowledge[], options: { includeCatalogue?: boolean } = {}): YeastReference[] {
  return yeastReferencesAvec(saved, options, yeastCatalogueLibrary);
}
