import type { FinanceTransaction, FinancialPayment, FinancialPlan } from './types';
import { isoDate, isActiveTransaction, transactionKind, transactionVendor } from './ledger';
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

/** Où poser la sortie d'un achat payé dans le bandeau : le mois de sa facture, le premier mois si elle est antérieure ; -1 sans date ou après la fenêtre. */
export function indexMoisSortie(date: string | null, mois: string[]): number {
  if (!date || mois.length === 0) return -1;
  const m = date.slice(0, 7);
  return m < mois[0] ? 0 : mois.indexOf(m);
}
/** Le texte « Fin mars, il reste 4 250 » tient-il dans la partie claire de la barre (14 px ≈ 7,4 px par signe, 24 px de marges) ? Sinon il passe à droite de la barre (maquette, sortie). */
export function texteTientDansBarre(nbSignes: number, partAchat: number, largeurBarre = 340): boolean {
  return (1 - Math.min(1, Math.max(0, partAchat))) * largeurBarre >= 7.4 * nbSignes + 24;
}
export interface Fournisseur { nom: string; telephone: boolean }
const norme = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
/**
 * Les fournisseurs déjà connus pour du matériel : ceux d'un autre projet et ceux d'une dépense de matériel (ou liée à un projet).
 * Le carnet de contacts de l'app ne distingue pas fournisseurs et clients (tous des « prospects ») : on ne peut donc pas filtrer le carnet,
 * on part de ce que les achats disent. Le plus utilisé d'abord ; le téléphone vient du carnet si le nom y est (comparaison sans accent ni casse).
 */
export function fournisseursConnus(plans: FinancialPlan[], transactions: FinanceTransaction[], contacts: Array<{ title: string; contactPhone?: string }>): Fournisseur[] {
  const compte = new Map<string, { nom: string; n: number }>();
  const voir = (nom?: string) => {
    const n = nom?.trim(); if (!n) return;
    const cle = norme(n), e = compte.get(cle);
    if (e) e.n++; else compte.set(cle, { nom: n, n: 1 });
  };
  plans.filter(p => p.upgrade).forEach(p => voir(p.vendor));
  transactions.filter(tx => isActiveTransaction(tx) && transactionKind(tx) === 'expense' && (tx.category === 'materiel' || tx.finance?.planId)).forEach(tx => voir(transactionVendor(tx)));
  return [...compte.entries()].sort((a, b) => b[1].n - a[1].n || a[1].nom.localeCompare(b[1].nom, 'fr'))
    .map(([cle, { nom }]) => { const c = contacts.find(x => norme(x.title) === cle); return { nom: c?.title ?? nom, telephone: !!c?.contactPhone }; });
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
