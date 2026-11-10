/**
 * Le catalogue des levures pour f4 (`yeastReferences`, `yeastCatalogueLibrary.json` 1,4 Mo, `localIngredientFacts`) : importé SEULEMENT par
 * `import()` depuis `enrichissementCatalogues.ts`, et seulement pour un travail de levure (REVUE-code D2).
 */
import type { YeastSpec } from '../types';
import { yeastReferences } from '../domain/yeastReferences';
import { localYeastFacts } from '../domain/localIngredientFacts';
import { factsForStock } from '../domain/ingredientFacts';
import type { ReferenceLevure } from '../domain/stock/ficheLevure';
import { champsLevure, urlDe, type ValeursTrouvees } from './enrichissementCatalogues';

export const referencesLevures = (): ReferenceLevure[] => yeastReferences() as unknown as ReferenceLevure[];

/**
 * Les valeurs du catalogue pour une référence de levure SÛRE : `localYeastFacts` avec `hopIndexId` (la référence est retrouvée par son id, pas
 * par son nom ; aucun `localDocumentary`), puis `factsForStock('levure')`. `undefined` si le catalogue ne rend rien.
 */
export function valeursDeCatalogueLevure(ref: { id: string; name: string }): ValeursTrouvees | undefined {
  const facts = localYeastFacts({ name: ref.name, hopIndexId: ref.id } as YeastSpec, []);
  if (!facts) return undefined;
  const valeurs = champsLevure(factsForStock('levure', facts));
  const source = (facts.source || `Catalogue des levures du dépôt — ${ref.name}`).trim();
  valeurs.technicalSource = `Catalogue des levures du dépôt — ${ref.name}`;
  const url = urlDe(facts.source);
  return { valeurs, source, ...(url ? { url } : {}), deduit: {}, nom: ref.name };
}
