import type { Transaction } from '../../../types';
import type { FinancialPayment } from '../../../domain/finance/types';
import type { EtapeCorrection } from '../../../domain/finance/correctionMontant';
import { isoDate } from '../../../domain/finance/ledger';

/** Pur (aucun service) : l'émulateur de la voie q5 l'empaquette tel quel. L'identifiant, la date et l'instant viennent de l'appelant. */
export interface ContexteCreance { aujourdhui: string; maintenant: string }

/**
 * FN-10 (t2, point 1) : « j'ai bien payé le montant d'avant ». L'argent est sorti, il reste sorti : les règles interdisent un réglé au-dessus du montant de la pièce,
 * donc la pièce vaut son nouveau montant et l'excédent est une pièce à part, la créance « À récupérer », payée par une vraie sortie du même jour et du même moyen.
 * Ce n'est ni un avoir (un `refund` retirerait l'excédent une seconde fois de la dépense et n'aurait aucune sortie derrière lui) ni un paiement de trop sur la pièce.
 * Quand le fournisseur rend l'argent, le brasseur note un avoir sur cette créance (service existant) : la dépense retombe à zéro et l'encaissement se pointe.
 * Pour une recette sur-encaissée, la même pièce se lit à l'envers : « À rembourser », une recette encaissée, que remboursera un avoir sortant.
 * Pure : l'identifiant, la date et l'instant viennent de l'appelant. `date` : le jour du virement inversé (la correction ne le déplace pas).
 */
export function creanceDeTropPaye(pieceCorrigee: Transaction, etape: Extract<EtapeCorrection, { type: 'avoir' }>, ctx: ContexteCreance, id: string, date: string = ctx.aujourdhui): Transaction {
  const aRecuperer = etape.direction === 'in';
  const motif = `${aRecuperer ? 'À récupérer' : 'À rembourser'} : trop ${aRecuperer ? 'payé' : 'encaissé'} sur « ${pieceCorrigee.description} »`;
  return {
    id, date, description: motif, category: pieceCorrigee.category, subcategory: aRecuperer ? 'À récupérer' : 'À rembourser',
    amountHT: etape.cents / 100, tvaRate: 0, tvaAmount: 0, amountTTC: etape.cents / 100, proofNotes: '',
    finance: {
      version: 1, kind: aRecuperer ? 'expense' : 'income', amountCents: etape.cents, lines: [], paymentStatus: 'unpaid', recordedAt: ctx.maintenant, notes: motif,
      ...(pieceCorrigee.finance?.vendor ? { vendor: pieceCorrigee.finance.vendor } : {})
    }
  };
}

/** La sortie (ou l'entrée) qui porte la créance : même sens que la pièce d'origine, jour et moyen du dernier paiement inversé. */
export function paiementDeCreance(creance: Transaction, etape: Extract<EtapeCorrection, { type: 'avoir' }>, inverses: FinancialPayment[], ctx: ContexteCreance, id: string): FinancialPayment {
  const dernier = [...inverses].sort((a, b) => (isoDate(a.date) ?? '').localeCompare(isoDate(b.date) ?? '') || a.recordedAt.localeCompare(b.recordedAt)).at(-1);
  return { id, transactionId: creance.id, date: dernier ? (isoDate(dernier.date) ?? ctx.aujourdhui) : ctx.aujourdhui, amountCents: etape.cents, direction: etape.direction === 'in' ? 'out' : 'in', method: dernier?.method ?? 'bank',
    note: 'Trop payé : l’argent sorti reste sorti, il est à récupérer', recordedAt: ctx.maintenant };
}

