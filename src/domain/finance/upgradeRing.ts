import type { FinanceTransaction, FinancialPayment, FinancialPlan } from './types';
import { isoDate, isActiveTransaction, transactionKind } from './ledger';
import { upgradeBudget, upgradeDetails, upgradeProgress } from './upgrades';
import { repereDe } from './upgradeForecast';

/**
 * Atelier › Matériel › À venir (maquette kyh1) : l'anneau d'étape à trois tiers, Besoin · Prix ou devis · Réalisé. Fonctions pures.
 * Aucun état neuf : l'anneau se lit des étapes déjà stockées (`UPGRADE_STAGES`) et des factures liées ; rien d'autre n'est écrit.
 *
 *   Idée, À étudier            → Besoin noté, Prix ou devis à chercher       (1 tiers plein, ton neutre)
 *   Devis en cours             → Prix ou devis en cours, devis demandé        (2 tiers, ton ocre, bout arrondi)
 *   Prêt à acheter (prix connu)→ Prix trouvé                                  (2 tiers, ton houblon)
 *   facture liée et payée      → Réalisé                                      (3 tiers, ton houblon) : la ligne quitte « À venir »
 * Un « Prêt à acheter » sans prix connu ne peut pas dire « prix trouvé » : il retombe sur « à chercher » (comme `repereDe`).
 */
export type ArcEtat = 'plein' | 'cours' | 'vide';
export type TonAnneau = 'mut' | 'att' | 'hop';
export interface Anneau { etape: 1 | 2 | 3; arcs: [ArcEtat, ArcEtat, ArcEtat]; ton: TonAnneau; libelle: string; icone: 'search' | 'mail' | 'tag' | 'check' }
export const ETAPES_ANNEAU = ['Besoin', 'Prix ou devis', 'Réalisé'] as const;

export function anneauDe(plan: FinancialPlan, realise = false): Anneau {
  if (realise) return { etape: 3, arcs: ['plein', 'plein', 'plein'], ton: 'hop', libelle: 'Étape 3 sur 3 : réalisé, payé', icone: 'check' };
  const r = repereDe(plan);
  if (r === 'devis') return { etape: 2, arcs: ['plein', 'cours', 'vide'], ton: 'att', libelle: 'Étape 2 sur 3 : prix ou devis, devis demandé', icone: 'mail' };
  if (r === 'prix') return { etape: 2, arcs: ['plein', 'plein', 'vide'], ton: 'hop', libelle: 'Étape 2 sur 3 : prix ou devis, prix trouvé', icone: 'tag' };
  return { etape: 2, arcs: ['plein', 'vide', 'vide'], ton: 'mut', libelle: 'Étape 2 sur 3 : prix ou devis, à chercher', icone: 'search' };
}

/** Une dépense liée au projet, payée en entier : le besoin est réalisé (dérivé des factures, jamais stocké). Sans facture, ou paiement inconnu : non. */
export function estRealise(plan: FinancialPlan, transactions: FinanceTransaction[], payments: FinancialPayment[]): boolean {
  if (plan.status === 'cancelled') return false;
  const p = upgradeProgress(plan, transactions, payments);
  if (p.invoiceCount === 0 || !p.invoicedComplete || !p.paymentKnown) return false;
  const attendu = upgradeDetails(plan).budgetKnown ? plan.amountCents : 1;
  return p.invoicedCents >= attendu && p.paidCents >= p.invoicedCents;
}
/** La date (AAAA-MM-JJ) de la dernière facture liée au projet, ou null. */
export function dateFacture(plan: FinancialPlan, transactions: FinanceTransaction[]): string | null {
  const dates = transactions.filter(tx => isActiveTransaction(tx) && transactionKind(tx) === 'expense' && tx.finance?.planId === plan.id).map(tx => isoDate(tx.date)).filter((d): d is string => !!d).sort();
  return dates.length ? dates[dates.length - 1] : null;
}

/** « 1 234,50 », « 1'234.5 », « 900 » → centimes ; vide, nul, négatif ou illisible → null (l'inconnu n'est jamais 0). */
export function parsePrix(texte: string): number | null {
  const propre = texte.replace(/[\s'’  ]/g, '').replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(propre)) return null;
  const cents = Math.round(parseFloat(propre) * 100);
  return Number.isSafeInteger(cents) && cents > 0 ? cents : null;
}
/** Le prix trouvé (ou celui du devis) : l'achat prend ce prix, livraison et installation restent ce qu'ils étaient ; le projet passe à « Prêt à acheter ». */
export function avecPrix(plan: FinancialPlan, cents: number): FinancialPlan {
  const d = upgradeDetails(plan), parts = { purchaseCents: cents, deliveryCents: d.deliveryCents, installationCents: d.installationCents };
  const total = upgradeBudget(parts) ?? cents;
  return { ...plan, amountCents: total, upgrade: { ...d, ...parts, budgetKnown: true, stage: 'ready', estimateSource: d.stage === 'quote' ? 'quote' : d.estimateSource } };
}
/** Un devis demandé à un contact : l'étape passe à « Devis en cours », le contact est noté comme fournisseur ; le prix reste inconnu. */
export function avecDevisDemande(plan: FinancialPlan, contact: string): FinancialPlan {
  return { ...plan, vendor: contact, upgrade: { ...upgradeDetails(plan), stage: 'quote' } };
}
