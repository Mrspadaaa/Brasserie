// « Un doute ? Relire plus finement » : la relecture ne remplace la lecture d'avant que si elle ne fait pas moins bien.
// Décision du pilote (14.11) : si la relecture rend MOINS de lignes, ou un statut de revue PLUS MAUVAIS que la lecture actuelle, on garde l'ancienne
// et on le dit. Surtout utile sur une longue pièce lue en morceaux, que la relecture lit en entier et peut couper.
// Un statut absent est inconnu, jamais « bon » : il ne compte pas contre la relecture, ni pour elle.
import type { ScannedInvoiceResult } from '../../services/geminiScanner';

export const MESSAGE_RELECTURE_PAS_MIEUX = 'La relecture n’a pas fait mieux : lecture d’avant gardée.';

/** Du meilleur au pire : vérifié, corrigé, contesté, indisponible. */
const RANG_STATUT: Record<string, number> = { checked: 0, corrected: 1, disputed: 2, unavailable: 3 };

const nbLignes = (r: Pick<ScannedInvoiceResult, 'items'>) => Array.isArray(r.items) ? r.items.length : 0;
const rangStatut = (r: Pick<ScannedInvoiceResult, 'review'>): number | null => {
  const s = r.review?.status;
  return s !== undefined && s in RANG_STATUT ? RANG_STATUT[s] : null;
};

/** `true` : la relecture est à garder. `false` : moins de lignes ou statut plus mauvais, on garde la lecture d'avant. */
export function relectureGardee(avant: ScannedInvoiceResult, apres: ScannedInvoiceResult): boolean {
  if (nbLignes(apres) < nbLignes(avant)) return false;
  const a = rangStatut(avant), b = rangStatut(apres);
  if (a !== null && b !== null && b > a) return false;
  return true;
}
