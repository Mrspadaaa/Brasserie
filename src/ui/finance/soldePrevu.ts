// PD-2 (21.11) — ce que l'enregistrement d'une pièce de dépense fait du prévu qu'elle solde : le même geste que la caisse après une vente
// (`appliquerSuites` : « La vente promise … est soldée »), par la même règle (`planApresVente` : soldé en entier s'il est couvert, sinon il reste actif
// et le reste à venir se lit dans la prévision). Le lien lui-même (`finance.planId`) est déjà écrit sur la pièce ; ici, seulement l'état du prévu.
import { FinanceService } from '../../services/financeService';
import { planApresVente } from '../../domain/venteSuites';

/**
 * Marque soldé le prévu lié (achat prévu, projet de matériel : il passe de « À venir » à « Réalisés »). Jamais pour un prévu récurrent (ses échéances se soldent une à une).
 * Rend la phrase à dire, ou `null` si rien n'a bougé. Ne lève jamais : la pièce est déjà écrite, le prévu soldé à la main resterait possible.
 */
export function soldeLeVuPlan(planId: string | undefined, montantChf: number | undefined, maintenant = new Date().toISOString()): string | null {
  if (!planId || !(montantChf && montantChf > 0)) return null;
  try {
    const plan = FinanceService.getPlans().find(p => p.id === planId);
    if (!plan || plan.recurrence || plan.direction !== 'out' || !(plan.status === 'active' || plan.status === 'draft')) return null;
    const apres = planApresVente(plan, Math.round(montantChf * 100), maintenant);
    if (apres === plan) return null;
    FinanceService.savePlan(apres);
    return `« ${plan.title} » est soldé.`;
  } catch { return null; }
}
