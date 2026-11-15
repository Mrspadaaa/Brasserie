import type { Transaction } from '../../../types';
import type { FinancialPayment } from '../../../domain/finance/types';
import type { EtapeCorrection } from '../../../domain/finance/correctionMontant';
import { StorageService } from '../../../services/storage';
import { FinanceService } from '../../../services/financeService';
import { contrePaiement } from '../operations/calculs';
import { idFor } from '../FinanceForms';

/** La note d'un contre-paiement écrit par une correction du montant (le champ `note` d'un paiement est libre ; l'immutabilité ne le concerne pas). */
const NOTE_CONTRE = 'Contre-écriture : montant de la pièce corrigé';
const NOTE_COMPLEMENT = 'Paiement après correction du montant de la pièce';

export interface ContexteExecution {
  /** Date du jour (ISO) et instant d'écriture : fournis par l'appelant, jamais lus ici. */
  aujourdhui: string;
  maintenant: string;
  /** Un identifiant neuf de paiement par appel (`idFor('PAI')` en production). */
  idPaiement?: () => string;
}

/** Le paiement qu'écrit une étape « paiement » : même sens et même mode que le dernier paiement ; daté du paiement inversé pour une baisse (M2), d'aujourd'hui pour une hausse. */
export function paiementDeEtape(etape: Extract<EtapeCorrection, { type: 'paiement' }>, transactionId: string, ctx: ContexteExecution, id: string): FinancialPayment {
  return { id, transactionId, date: etape.date || ctx.aujourdhui, amountCents: etape.cents, direction: etape.direction, method: etape.method, note: NOTE_COMPLEMENT, recordedAt: ctx.maintenant };
}

/**
 * Ce que le plan donnerait, sans rien écrire : la pièce au nouveau montant et les paiements augmentés des contre-paiements et du paiement prévus.
 * Sert à l'aperçu « après » : il lit la même règle d'état que la liste Opérations.
 */
export function simulerPlan(piece: Transaction, paiements: FinancialPayment[], etapes: EtapeCorrection[], ctx: ContexteExecution): { piece: Transaction; paiements: FinancialPayment[] } {
  let courante = piece;
  const suite = [...paiements];
  etapes.forEach((etape, i) => {
    if (etape.type === 'montant') {
      courante = { ...courante, finance: courante.finance ? { ...courante.finance, amountCents: etape.cents } : courante.finance, amountTTC: etape.cents / 100, amountHT: courante.amountHT };
    } else if (etape.type === 'contre') {
      const p = paiements.find(x => x.id === etape.paiementId);
      if (p) suite.push({ ...contrePaiement(p, ctx.maintenant), note: NOTE_CONTRE });
    } else {
      suite.push(paiementDeEtape(etape, piece.id, ctx, `SIM-${i}`));
    }
  });
  return { piece: courante, paiements: suite };
}

/**
 * Exécute le plan par les services existants, dans l'ordre (jamais un chemin parallèle) :
 *   contre   → `FinanceService.recordPayment` d'un `CONTRE-<id>` ;
 *   montant  → `StorageService.updateTransaction` sur la pièce lue au moment même (le solde réglé et le dernier paiement viennent d'être changés
 *              par l'étape précédente : une copie ancienne les écraserait, et les règles Firestore refuseraient l'écriture) ;
 *   paiement → `FinanceService.recordPayment` du complément.
 * `ecrireMontant` reçoit la pièce vivante et rend la pièce à enregistrer (les champs du formulaire sont fusionnés par l'écran).
 * UN LOT FIRESTORE PAR ÉTAPE (B1). `FirestoreRepo` regroupe en un seul lot atomique tout ce qui s'écrit dans le même tour synchrone ; or les règles
 * n'acceptent qu'un paiement par pièce et par lot, et un paiement ne change sur la pièce que le solde et le dernier paiement. Entre deux étapes, on laisse donc
 * passer la microtâche qui envoie le lot (`queueMicrotask(flushWrites)` est déjà en file quand l'étape finit). On n'attend jamais le serveur : hors ligne, les
 * lots se rejouent dans l'ordre à la reconnexion.
 * Une étape qui échoue arrête la suite : l'erreur dit ce qui est déjà écrit.
 */
export async function executerPlan(etapes: EtapeCorrection[], pieceId: string, ctx: ContexteExecution, ecrireMontant: (vivante: Transaction) => Transaction): Promise<void> {
  const id = ctx.idPaiement ?? (() => idFor('PAI'));
  const faites: string[] = [];
  for (const etape of etapes) {
    try {
      if (etape.type === 'contre') {
        const original = FinanceService.getPayments().find(p => p.id === etape.paiementId);
        if (!original) throw new Error('Paiement à inverser introuvable.');
        FinanceService.recordPayment({ ...contrePaiement(original, ctx.maintenant), note: NOTE_CONTRE });
        faites.push('paiement inversé');
      } else if (etape.type === 'montant') {
        const vivante = StorageService.getTransactions().find(t => t.id === pieceId);
        if (!vivante) throw new Error('Opération introuvable.');
        StorageService.updateTransaction(ecrireMontant(vivante));
        faites.push('montant changé');
      } else {
        FinanceService.recordPayment(paiementDeEtape(etape, pieceId, ctx, id()));
        faites.push('paiement écrit');
      }
      await Promise.resolve(); // le lot de cette étape part ici, avant l'écriture de la suivante
    } catch (e) {
      const raison = e instanceof Error ? e.message : 'Écriture impossible.';
      throw new Error(faites.length ? `${raison} Déjà écrit : ${faites.join(', ')}. Vérifie l’opération dans la liste.` : raison);
    }
  }
}
