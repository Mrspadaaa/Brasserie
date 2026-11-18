import type { StockItem } from '../types';
import { FirestoreRepo } from './firestoreRepo';
import { ficheRetenueDe } from '../domain/stock/ficheCle';
import { CHAMPS_ECRIVABLES, patchDeTrous, type ChampFiche } from '../domain/stock/ficheValeurs';
import { mergeYeastTechnicalFacts } from '../domain/ingredientFacts';
import { readIngredientFermentationFacts } from '../../functions/src/ingredientFermentationFacts';

/**
 * Le branchement 2 de f4 (REVUE-code M2, M3) : « Compléter avec l'IA » d'une recette (`learnIngredient`, `storage.ts`) quand aucun article n'a ce nom
 * exact. Si un article créé par f4 porte la fiche de ce produit (`ficheRetenueDe`, Malt et Levure seulement) :
 * - `meme` : ses champs VIDES reçoivent les faits, chacun avec sa trace `fiche.remplis` (`par: 'retenue'`, `repris`) : jamais une donnée lue ;
 *   jamais `alphaPct` (hors liste blanche), jamais `yeastNotes` ;
 * - `proche` : rien n'est écrit sur un article ; les faits sont gardés dans un travail f4 « à contrôler » et une ligne va au journal.
 * Rend `true` quand le cas est traité ici (l'appelant s'arrête) ; `false` : le comportement d'avant (un `FICHE-…`), seulement si RIEN n'a été
 * écrit. Ne lève jamais ; une écriture faite rend toujours `true` (un journal qui lève ne fait pas écrire en double).
 * `storage.ts` passe son journal : ce module n'importe pas `storage` (aucun cycle) ; `enrichissement` est chargé par `import()`.
 */
export function apprendreSurFicheRetenue(name: string, facts: Partial<StockItem>, stock: readonly StockItem[],
  journal: (resume: string, details?: string) => void, le = new Date().toISOString()): boolean {
  // Un journal qui lève ne change jamais la suite : sinon l'appelant reprendrait l'ancien chemin et écrirait un FICHE-… en double.
  const noter = (resume: string, details: string) => { try { journal(resume, details); } catch { /* le journal est accessoire */ } };
  let retenue: ReturnType<typeof ficheRetenueDe>;
  let faits: Partial<Record<ChampFiche, unknown>>;
  try {
    retenue = ficheRetenueDe(name, facts.category, stock);
    if (!retenue) return false;
    faits = faitsEcrivables(facts);
  } catch { return false; }
  if (retenue.cas === 'proche') {
    noter(`Faits acceptés gardés à contrôler : ${name.trim()}`, 'Produit proche d’une fiche existante : rien n’est écrit sur un article ; la fiche « à contrôler » les garde.');
    void import('./enrichissement').then(m => m.garderFaitsProches(name, facts.category, faits)).catch(() => undefined);
    return true;
  }
  const article = retenue.article;
  const source = facts.technicalSource?.trim() || 'Recette : « Compléter avec l’IA »';
  let resultat: ReturnType<typeof patchDeTrous>;
  try { resultat = patchDeTrous(article, faits, { par: 'retenue', source, niveau: 'repris' }, le); } catch { return false; }
  const { patch, remplis, ecarts } = resultat;
  if (!Object.keys(patch).length) return true;
  try { FirestoreRepo.put('stockItems', article.ref, patch, { merge: true }); } catch { return false; }
  noter(`Fiche de l’article complétée depuis une recette : ${article.name}`,
    [`Rempli : ${remplis.filter(c => c !== 'technicalSource').join(', ') || 'source'}`, ...ecarts.map(e => `Écart non écrit : ${e.champ} lu ${JSON.stringify(e.lue)}, trouvé ${JSON.stringify(e.trouvee)}`)].join(' · '));
  return true;
}

/**
 * Les seuls faits qu'f4 écrit (liste blanche) : jamais `alphaPct`, `yeastNotes`, `name`, `unit`, `category`. Les faits de levure passent par les
 * mêmes lectures que le chemin d'origine de `learnIngredient` (REVUE-code-2 D-b) : `mergeYeastTechnicalFacts` (forme validée, doublons fusionnés)
 * et `readIngredientFermentationFacts` (une forme invalide n'est pas écrite).
 */
export function faitsEcrivables(facts: Partial<StockItem>): Partial<Record<ChampFiche, unknown>> {
  const out: Partial<Record<ChampFiche, unknown>> = {};
  for (const champ of CHAMPS_ECRIVABLES) { const v = facts[champ as keyof StockItem]; if (v !== undefined && v !== null && v !== '') out[champ] = v; }
  if ('yeastTechnicalFacts' in out) {
    const technique = mergeYeastTechnicalFacts(facts.yeastTechnicalFacts);
    if (technique) out.yeastTechnicalFacts = technique; else delete out.yeastTechnicalFacts;
  }
  if ('yeastFermentationFacts' in out) {
    const fermentation = readIngredientFermentationFacts(facts.yeastFermentationFacts);
    if (fermentation) out.yeastFermentationFacts = fermentation; else delete out.yeastFermentationFacts;
  }
  return out;
}
