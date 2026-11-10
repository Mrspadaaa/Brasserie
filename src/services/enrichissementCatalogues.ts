/**
 * Les catalogues lourds de la procédure d'enrichissement (voie f4-enrichir, PLAN § 7) : importé SEULEMENT par `import()`, dans le travail, jamais au
 * démarrage. Il porte l'adaptation des réponses de la tâche `lookupIngredient` ; le catalogue des levures (`enrichissementLevures.ts`) et le
 * catalogue plein des houblons sont chacun chargés par un second `import()`, seulement pour un travail de leur famille.
 */
import type { StockItem } from '../types';
import { adaptYeastLookupResult, deduireValeursMalt, factsForStock, sanitizeFacts, type IngredientFacts } from '../domain/ingredientFacts';
import type { CatalogueHop } from '../domain/hopIndex/v4/data';
import type { ReferenceLevure } from '../domain/stock/ficheLevure';
import type { ChampFiche } from '../domain/stock/ficheValeurs';
import type { Famille } from '../domain/stock/ficheCle';
import { floculationFrancaise } from '../domain/yeastFlocculation';

/** D2 (REVUE-code) : le catalogue des levures n'est chargé (`import()`) que quand un travail de levure le demande. */
export const referencesLevures = async (): Promise<ReferenceLevure[]> => (await import('./enrichissementLevures')).referencesLevures();
export const valeursDeCatalogueLevure = async (ref: { id: string; name: string }): Promise<ValeursTrouvees | undefined> =>
  (await import('./enrichissementLevures')).valeursDeCatalogueLevure(ref);
/** Le catalogue plein des houblons, chargé seulement pour un travail de houblon. */
export const cataloguePleinHoublons = async (): Promise<CatalogueHop[]> => (await import('../domain/hopIndex/v4/data')).chargerCataloguePlein();

export interface ValeursTrouvees { valeurs: Partial<Record<ChampFiche, unknown>>; source: string; url?: string; deduit: Partial<Record<ChampFiche, string>>; nom?: string }
export const urlDe = (s: string | undefined) => (s && /^https?:\/\//i.test(s.trim()) ? s.trim() : undefined);
/** Les champs d'un `Partial<StockItem>` de levure qu'f4 écrit (jamais `yeastNotes`, `yeastLot`, `category`). */
export function champsLevure(p: Partial<StockItem>): Partial<Record<ChampFiche, unknown>> {
  const out: Partial<Record<ChampFiche, unknown>> = {};
  const champs: ChampFiche[] = ['yeastLab', 'yeastStrain', 'yeastForm', 'yeastAttenuationPct', 'yeastTempMinC', 'yeastTempMaxC', 'yeastFlocculation',
    'yeastAlcoholTolerancePct', 'yeastTechnicalFacts', 'yeastFermentationFacts'];
  for (const c of champs) if (p[c as keyof StockItem] !== undefined) out[c] = p[c as keyof StockItem];
  return out;
}

/** Les règles de conversion que la consigne de la tâche demande (`functions/src/prompts.ts`, « CONVERSIONS ») : une valeur trouvée peut être calculée. */
export const DEDUIT_PPG = 'PPG ≈ rendement × 46 si la fiche publie un rendement (consigne de la tâche)';
export const DEDUIT_EBC = 'EBC ≈ °L × 1,97 si la fiche publie des °L (consigne de la tâche)';

/**
 * Les valeurs d'une réponse brute de `lookupIngredient` : `undefined` sans `found` ou sans `source` (rien n'est écrit). Levure : la même adaptation
 * que `lookupYeastSheet` (`adaptYeastLookupResult`, `sanitizeFacts`, identité jamais prise au modèle). Malt et sucre : EBC et potentiel seulement,
 * marqués « peut être calculé ». Houblon : jamais (une valeur typique n'est pas l'α du lot).
 */
export function valeursDeReponse(famille: Famille, brute: IngredientFacts | undefined): ValeursTrouvees | undefined {
  if (!brute || !brute.found || !brute.source?.trim() || famille === 'houblon') return undefined;
  const source = brute.source.trim();
  const url = urlDe(brute.sourceUrl);
  if (famille === 'levure') {
    const facts = sanitizeFacts(adaptYeastLookupResult(brute));
    delete facts.hopIndexId;
    const valeurs = champsLevure(factsForStock('levure', facts));
    // D378 : « Very High » s'écrit « Très élevée », comme les autres fiches ; un libellé hors catégorie reste tel que publié.
    if (typeof valeurs.yeastFlocculation === 'string') valeurs.yeastFlocculation = floculationFrancaise(valeurs.yeastFlocculation);
    if (!Object.keys(valeurs).length) return undefined;
    valeurs.technicalSource = `Trouvée en ligne — ${source}`;
    return { valeurs, source, ...(url ? { url } : {}), deduit: {}, ...(brute.name ? { nom: brute.name } : {}) };
  }
  // D302 : le malteur publie une plage et un extrait. Un point publié gagne ; sinon `sanitizeFacts` déduit (même fonction que « Compléter avec l'IA »)
  // et la valeur dit sa règle, avec la plage ou l'extrait d'origine, au lieu de passer pour lue.
  // D303 : le schéma d'un malt exige cinq nombres nullables ; un `null` (fiche muette) se lit comme absent, ici comme dans `sanitizeFacts`.
  const deduites = deduireValeursMalt(brute);
  const facts = sanitizeFacts(brute);
  const valeurs: Partial<Record<ChampFiche, unknown>> = {};
  const deduit: Partial<Record<ChampFiche, string>> = {};
  if (facts.colorEbc !== undefined) { valeurs.colorEbc = facts.colorEbc; deduit.colorEbc = deduites.deduit.colorEbc ?? DEDUIT_EBC; }
  if (facts.potentialPpg !== undefined) { valeurs.potentialPpg = facts.potentialPpg; deduit.potentialPpg = deduites.deduit.potentialPpg ?? DEDUIT_PPG; }
  if (!Object.keys(valeurs).length) return undefined;
  valeurs.technicalSource = `Trouvée en ligne — ${source}`;
  return { valeurs, source, ...(url ? { url } : {}), deduit, ...(brute.name ? { nom: brute.name } : {}) };
}
