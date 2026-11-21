import type { FinancialPlan } from './types';
import { formatCHF } from './ledger';

/**
 * WFA-12 : « Marquer comme réalisé » sur un projet de matériel SANS achat lié (aucune dépense reliée à son plan) retire le montant prévu de la caisse sans
 * qu'un franc ait été payé : un prévu ne quitte la prévision que soldé par un réel. Le geste reste permis (le brasseur peut avoir tout payé hors de l'app),
 * mais il est demandé d'abord, avec ce qu'il fait. `achatsLies` = `upgradeProgress(...).invoiceCount`.
 */
export const realiseSansAchat = (plan: Pick<FinancialPlan, 'amountCents'>, achatsLies: number): boolean => achatsLies === 0 && plan.amountCents > 0;

export const demandeRealiseSansAchat = (plan: Pick<FinancialPlan, 'title' | 'amountCents'>) => ({
  question: `« ${plan.title.trim() || 'Ce projet'} » : aucun achat lié`,
  detail: `Marqué réalisé sans achat, ses ${formatCHF(plan.amountCents)} prévus sortent de ta prévision sans avoir été payés. Note l’achat pour qu’il les solde ; sinon garde-le au prévu.`,
  oui: 'Réalisé, sans achat'
});
