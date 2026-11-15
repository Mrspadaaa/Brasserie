import { buildFinanceAssistantContext, type FinanceAssistantInput } from '../../../domain/finance/assistantContext';
import { isUpgradePlan } from '../../../domain/finance/upgrades';
import { isoDate } from '../../../domain/finance/ledger';
import { moisDit } from './vue';

/**
 * m4ia-c (choix du 15.11) : « ce qu'il va lire », en pastilles cochées. Le contexte est celui du domaine (`buildFinanceAssistantContext`),
 * construit sur les seules données cochées : une pastille décochée n'y entre pas. Gemini n'est jamais appelé ici.
 * LIMITE (à lire avant de promettre) : en ligne, `functions/src/brewerFinanceContext.ts` lit tout le registre ; tant qu'il n'accepte pas ces
 * réglages, la restriction passe par la consigne écrite dans la question (`consigne`), pas par le serveur.
 */
export interface ReglagesContexte {
  /** Les opérations du mois affiché. */ periode: boolean;
  /** Toutes les opérations, sans limite de période. */ toutHistorique: boolean;
  /** Une opération hors des sous-ensembles ci-dessous. */ operations: boolean;
  /** Les pièces encore à payer. */ aPayer: boolean;
  /** Les pièces sans justificatif. */ sansPiece: boolean;
  /** Le profil financier (statut TVA compris). */ profil: boolean;
  archives: boolean; projets: boolean;
}
export const REGLAGES_DEFAUT: ReglagesContexte = { periode: true, toutHistorique: false, operations: true, aPayer: true, sansPiece: true, profil: true, archives: false, projets: false };

export interface DonneesContexte extends Omit<FinanceAssistantInput, 'coverage' | 'recipes' | 'batches' | 'stock' | 'equipment'> {
  /** AAAA-MM du mois affiché. */ mois: string;
  aPayerIds: string[]; sansPieceIds: string[];
}

export function contexteCompagnon(r: ReglagesContexte, d: DonneesContexte) {
  const aPayer = new Set(d.aPayerIds), sansPiece = new Set(d.sansPieceIds);
  const transactions = d.transactions.filter(tx => {
    if (!r.operations) return false;
    if (!r.aPayer && aPayer.has(tx.id)) return false;
    if (!r.sansPiece && sansPiece.has(tx.id)) return false;
    if (r.toutHistorique) return true;
    return r.periode && (isoDate(tx.date) ?? '').startsWith(d.mois);
  });
  const ids = new Set(transactions.map(t => t.id));
  const payments = d.payments.filter(p => ids.has(p.transactionId));
  const plans = r.projets ? d.plans : d.plans.filter(p => !isUpgradePlan(p));
  const archives = r.archives ? d.archives : [];
  const n = (k: number) => ({ loaded: k, limit: 1500, complete: true, totalAtLeast: k, order: 'document-id' as const });
  const contexte = buildFinanceAssistantContext({
    ...d, transactions, payments, plans, archives, profile: r.profil ? d.profile : undefined, creativeItems: r.projets ? d.creativeItems : [],
    recipes: [], batches: [], stock: [], equipment: [],
    coverage: { transactions: n(transactions.length), financialPayments: n(payments.length), financialPlans: n(plans.length), financialAssets: n(d.assets.length), financialClosings: n(d.closings.length),
      creativeItems: n(0), stockItems: n(0), batches: n(0), recipes: n(0), equipment: n(0) } });
  const non = [!r.archives && 'les archives', !r.projets && 'les projets de matériel', !r.profil && 'le profil financier', !r.aPayer && 'les pièces à payer', !r.sansPiece && 'les pièces sans justificatif'].filter(Boolean);
  const quoi = r.toutHistorique ? 'tout l’historique' : r.periode ? `le mois ${moisDit(d.mois)}` : 'aucune période';
  const consigne = `Contexte choisi par le brasseur : ${r.operations ? quoi : 'aucune opération'}${non.length ? `. N’utilise pas : ${non.join(', ')}.` : '.'}`;
  return { contexte, consigne, transactionIds: [...ids] };
}
