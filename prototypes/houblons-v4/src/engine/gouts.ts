import { hopRef } from './data';
import { isFamily, type FamilyId } from './families';

/** Goûts du brasseur (« je peux goûter d'autres bières et ne pas aimer un houblon ») : vides par défaut,
 * jamais inventés. Une entrée vise une variété (id de variété) ou une famille (id V5.5). */
export interface GoutEntry { type: 'variété' | 'famille'; id: string; source: string }
export interface Gouts { aime: GoutEntry[]; exclut: GoutEntry[] }
export const NO_GOUTS: Gouts = { aime: [], exclut: [] };

export const GOUTS_RULE = [
  'Vide par défaut : aucun goût n’est supposé.',
  'Variété exclue : ses voies et ses ajouts rapides disparaissent (domaine de recherche, comme la sélection de variétés du solveur V5.5) ; les clés de classement des autres voies ne changent pas.',
  'Famille exclue : traitée comme l’exclusion V5.5 (une fiche qui la cite met la voie en conflit, checkHopExclusions sur la prédiction) ; sa cible ne bouge pas.',
  '« Aime » : informatif (étiquette), sans poids dans le classement ; aucun coefficient n’est inventé.',
];

export function goutsSets(g: Gouts | undefined) {
  const exclut = g?.exclut ?? [];
  return {
    excludedVarieties: new Set(exclut.filter((e) => e.type === 'variété').map((e) => hopRef(e.id)?.varietyId ?? e.id)),
    excludedFamilies: exclut.filter((e) => e.type === 'famille' && isFamily(e.id)).map((e) => e.id as FamilyId),
    liked: new Set((g?.aime ?? []).map((e) => e.id)),
  };
}
