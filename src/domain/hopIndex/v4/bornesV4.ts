// Le chemin v4 des houblons lit les MÊMES bornes métier que l'étape Fermentescibles et la recette : la table unique
// `src/domain/bornesMetier.ts` (houblon par litre, α au-delà de 30 % non confirmé, OG), jamais une copie. Critique du 08.11 (build 0c3f4d41) :
// 99 999 g de Lotus dans 24 L donnaient « IBU 49067 » à l'étape Houblons alors que Fermentescibles refusait déjà ; 9 000 kg de grain, « IBU 0 ».
//
// Règle (celle de `hotBitterness`, domain/hopBitterness.ts) : un ajout à chaud dont une donnée sort des bornes est INCALCULABLE, avec sa
// raison ; il entre dans `inconnus`, le total s'écrit « — ». Ni un nombre absurde, ni un 0 (inconnu ≠ 0).
import { alphaAConfirmer, alphaProbable } from '../../hopAlpha';
import { BORNES, frBorne, messageHoublonParLitre, ogHorsBornes } from '../../bornesMetier';
import { kettleHopGrams } from '../../../services/brewingMath';
import { nombreFr } from '../../../domain/nombreAffiche';

/** Ce que la règle lit d'un ajout du parcours. */
export interface AjoutBorne { grams: number; alphaLot?: number | null; alphaConfirme?: number }
/** Ce que la règle lit de la recette du parcours. */
export interface RecetteBornee { og: number; volumeL: number; additions: ReadonlyArray<{ grams: number }> }

/** Le houblon de TOUTE la recette (ébullition, whirlpool, à cru) en grammes : la borne par litre porte sur le total, comme `hotBitterness`. */
export const houblonTotalG = (additions: ReadonlyArray<{ grams: number }>): number =>
  additions.reduce((s, a) => s + (Number.isFinite(a.grams) && a.grams > 0 ? a.grams : 0), 0);

/** Pourquoi l'IBU d'un ajout à chaud ne se calcule pas faute de bornes tenues ; `null` si les bornes sont tenues. */
export function raisonBornesAjout(a: AjoutBorne, recette: RecetteBornee): string | null {
  const exces = messageHoublonParLitre(houblonTotalG(recette.additions), recette.volumeL);
  if (exces) return exces;
  if (typeof a.alphaLot === 'number' && alphaAConfirmer({ alpha: a.alphaLot, alphaConfirme: a.alphaConfirme })) {
    return `alpha de ${String(a.alphaLot).replace('.', ',')} % à confirmer (${alphaProbable(a.alphaLot)} % ?), au-delà de ${nombreFr(BORNES.alphaPct.max, 1)} %`;
  }
  if (ogHorsBornes(recette.og)) return `densité initiale ${frBorne(recette.og, 3)} au-delà de ${frBorne(BORNES.og.max, 3)} : IBU incalculable`;
  return null;
}

/** L'OG que les repères peuvent écrire : `null` si elle est inconnue, ≤ 1 ou au-delà des bornes (l'en-tête la refuse, les repères aussi). */
export const ogAffichable = (og: number | null | undefined): number | null =>
  typeof og === 'number' && Number.isFinite(og) && og > 1 && !ogHorsBornes(og) ? og : null;

/**
 * Les grammes de houblon que la cuve boit dans le plan d'eau (tout sauf le dry hop). Au-delà de la borne par litre, l'erreur de saisie ne
 * fabrique pas d'eau : 99 999 g annonçaient 634 L pour 24 L de bière (0,6 L pour 100 g). La borne est dite ailleurs (en-tête, ligne, récap).
 */
export function kettleHopGrammesBornes(hops: Array<{ weightG?: number; stage?: string }> | undefined, volumeL: number): number {
  const total = houblonTotalG((hops ?? []).map((h) => ({ grams: h.weightG ?? 0 })));
  return messageHoublonParLitre(total, volumeL) ? 0 : kettleHopGrams(hops as never);
}
