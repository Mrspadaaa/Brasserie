import type { Transaction } from '../../types';
import type { FinancialPayment } from './types';
import type { EtapeCorrection } from './correctionMontant';
import { paiementsVivants } from './correctionMontant';
import { isoDate } from './ledger';

/** Les notes du contre-paiement et du paiement réécrit : la liste des paiements dit pourquoi (la date de la pièce a changé), pas « montant corrigé ». */
export const NOTE_CONTRE_DATE = 'Contre-écriture : date de la pièce corrigée';
export const NOTE_PAIEMENT_DATE = 'Paiement replacé au nouveau jour de la pièce';
const ISO = /^\d{4}-\d{2}-\d{2}$/;

/**
 * E41-5 (24.11) : « Modifier › date » d'un achat payé ne changeait que la date de la pièce ; Opérations (« payé 19 nov. »), le Calendrier et la liste des paiements
 * gardaient l'ancien jour. En saisie, la date choisie est celle du paiement : la corriger après coup déplace donc aussi le paiement.
 *
 * Un paiement ne se modifie pas (le registre garde chaque écriture) : on l'inverse (contre-paiement, à son jour d'origine) et on le réécrit au nouveau jour,
 * même montant, même sens, même moyen. Le plan ne s'applique que lorsque c'est sans ambiguïté :
 *  - la date change vers un jour qui n'est pas dans le futur (un paiement futur serait « à confirmer », pas payé) ;
 *  - la pièce a au moins un paiement en vigueur, et chacun est daté du jour de la pièce (celui qu'a écrit la saisie) ; un paiement fait un autre jour reste tel quel,
 *    on ne devine pas qu'il suivait la pièce.
 * Rend `[]` sinon : rien à déplacer.
 */
export function planDeplacerPaiement(piece: Transaction, paiements: FinancialPayment[], nouvelleDate: string, aujourdhui: string): EtapeCorrection[] {
  const ancienne = isoDate(piece.date);
  if (!ancienne || !ISO.test(nouvelleDate) || nouvelleDate === ancienne || nouvelleDate > aujourdhui) return [];
  const vivants = paiementsVivants(piece, paiements);
  if (!vivants.length || vivants.some(p => p.date !== ancienne)) return [];
  return vivants.flatMap((p): EtapeCorrection[] => [
    { type: 'contre', paiementId: p.id, note: NOTE_CONTRE_DATE },
    { type: 'paiement', cents: p.amountCents, direction: p.direction, method: p.method, date: nouvelleDate, note: NOTE_PAIEMENT_DATE }
  ]);
}
