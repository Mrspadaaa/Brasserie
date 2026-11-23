// Saisie à la main v01s (D426, « Le genre d'abord », simplifiée) : le modèle, sans React.
// Le genre pose le sens, la nature (`FinanceKind`), la catégorie, la sous-catégorie et le rythme par défaut ; rien de neuf dans le schéma :
// Loyer, Abonnement, Salaire = `expense` + `chargesFixes` (sous-catégorie) ; Apport et Pour moi = `contribution` / `withdrawal` + `apports`
// (hors Mon mois, `periodeSynthese`) ; un rythme = un `FinancialPlan` `recurring`, la pièce du jour liée à sa première échéance.
// Pas de TVA à l'AFC (D428, le brasseur : ni champ neuf ni option) : « Impôts » propose l'impôt sur la bière (charge, `divers`) et les impôts privés (Pour moi).
import type { FinanceCategory } from '../../types';
import type { FinanceKind, FinanceTransaction, FinancialPayment, FinancialPlan } from '../../domain/finance/types';
import { isActiveTransaction, transactionAmount, transactionDirection, transactionKind, ventilationAvoir } from '../../domain/finance/ledger';
import { planOccurrences } from '../../domain/finance/forecast';
import { planSoldeParDepense } from '../../domain/venteSuites';
import { lireDecimal } from '../numericInput';

export type GenreId = 'achat' | 'loyer' | 'abo' | 'salaire' | 'impot' | 'prel' | 'autreo' | 'vente' | 'apport' | 'autrei' | 'rembt';
export type Rythme = 'une' | 'monthly' | 'quarterly' | 'yearly';
export type Fin = 'sans' | '6m' | '1an' | 'date';
export type Methode = FinancialPayment['method'];

export interface Genre {
  id: GenreId; nom: string; sous?: string; sens: 'out' | 'in'; kind: FinanceKind; category: FinanceCategory; subcategory: string;
  /** Le rythme posé au toucher du genre ; `null` : pas de « Revient ? » (apport, prélèvement, impôt, remboursement). */
  rythme: Rythme | null;
  /** L'étiquette de la rangée des derniers noms (« Chez », « Client »…) ; absente : pas de rangée. */
  qui?: string;
  /** Le nom gris par défaut ; `jjmm` = « 22.11 ». */
  nomDefaut: (jjmm: string) => string;
  /** Le pli facultatif. */
  pli: string;
}

export const GENRES: Record<GenreId, Genre> = {
  achat: { id: 'achat', nom: 'Achat', sens: 'out', kind: 'expense', category: 'brassage', subcategory: 'Achat', rythme: 'une', qui: 'Chez', nomDefaut: (d) => `Achat du ${d}`, pli: 'TVA, référence' },
  loyer: { id: 'loyer', nom: 'Loyer', sens: 'out', kind: 'expense', category: 'chargesFixes', subcategory: 'Loyer', rythme: 'monthly', qui: 'Bailleur', nomDefaut: () => 'Loyer', pli: 'Référence, note' },
  abo: { id: 'abo', nom: 'Abonnement', sens: 'out', kind: 'expense', category: 'chargesFixes', subcategory: 'Abonnement', rythme: 'monthly', qui: 'Service', nomDefaut: (d) => `Abonnement du ${d}`, pli: 'Référence, note' },
  salaire: { id: 'salaire', nom: 'Salaire', sous: 'employé', sens: 'out', kind: 'expense', category: 'chargesFixes', subcategory: 'Salaire', rythme: 'monthly', qui: 'Employé', nomDefaut: (d) => `Salaire du ${d}`, pli: 'Référence, note' },
  impot: { id: 'impot', nom: 'Impôts', sens: 'out', kind: 'expense', category: 'divers', subcategory: 'Impôt sur la bière', rythme: null, nomDefaut: (d) => `Impôt sur la bière du ${d}`, pli: 'Période, référence' },
  prel: { id: 'prel', nom: 'Pour moi', sous: 'ta paie', sens: 'out', kind: 'withdrawal', category: 'apports', subcategory: 'Prélèvement privé', rythme: null, nomDefaut: (d) => `Pour moi du ${d}`, pli: 'Note' },
  autreo: { id: 'autreo', nom: 'Autre', sens: 'out', kind: 'expense', category: 'divers', subcategory: 'Autre', rythme: 'une', nomDefaut: (d) => `Autre du ${d}`, pli: 'TVA, référence' },
  vente: { id: 'vente', nom: 'Vente', sens: 'in', kind: 'income', category: 'recettes', subcategory: 'Vente', rythme: 'une', qui: 'Client', nomDefaut: (d) => `Vente du ${d}`, pli: 'TVA, référence' },
  apport: { id: 'apport', nom: 'Apport', sous: 'de ma poche', sens: 'in', kind: 'contribution', category: 'apports', subcategory: 'Apport privé', rythme: null, nomDefaut: () => 'De ma poche', pli: 'Note' },
  autrei: { id: 'autrei', nom: 'Autre', sous: 'pas un prêt', sens: 'in', kind: 'income', category: 'recettes', subcategory: 'Autre recette', rythme: 'une', nomDefaut: (d) => `Autre entrée du ${d}`, pli: 'TVA, référence' },
  rembt: { id: 'rembt', nom: 'Remboursement', sens: 'in', kind: 'refund', category: 'divers', subcategory: 'Avoir', rythme: null, nomDefaut: () => 'Remboursement', pli: 'Note' }
};
export const SORT: GenreId[] = ['achat', 'loyer', 'abo', 'salaire', 'impot', 'prel', 'autreo'];
export const RENTRE: GenreId[] = ['vente', 'apport', 'autrei'];
/** Catégories d'un achat (`FinanceCategory`, toutes des charges : AM-62, le sens ne change pas). */
export const CATEGORIES_ACHAT: Array<{ id: FinanceCategory; nom: string }> = [
  { id: 'brassage', nom: 'Brassage' }, { id: 'materiel', nom: 'Matériel' }, { id: 'nettoyage', nom: 'Nettoyage' }, { id: 'renovation', nom: 'Rénovation' }];

/** Hors résultat : un apport ou un prélèvement n'entre jamais dans Mon mois (`periodeSynthese`). */
export const horsResultat = (g: GenreId) => GENRES[g].kind === 'contribution' || GENRES[g].kind === 'withdrawal';

/* ---------- montants et dates ---------- */
/** « 2 000,5 », « 29.90 », « 400 » → centimes ; `undefined` si illisible ou nul (l'inconnu n'est jamais 0). */
/* Lot 11 (hors lot du lot 6) : la lecture commune de toute saisie de nombre (lireDecimal : « 12,50 », « 1'234.50 », « 1.234,50 ») ;
   un montant est positif, à deux décimales au plus. */
export function lireMontant(brut: string): number | undefined {
  const l = lireDecimal(brut);
  if (!l || l.decimales > 2 || !(l.valeur > 0)) return undefined;
  const c = Math.round(l.valeur * 100);
  return Number.isSafeInteger(c) && c > 0 ? c : undefined;
}
/** 40100 → « 401,00 » ; 200000 → « 2 000,00 » (espace fine insécable des milliers). */
export function chf(cents: number): string {
  const a = Math.abs(cents), e = Math.floor(a / 100).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${e},${String(a % 100).padStart(2, '0')}`;
}
/** La frappe du clavier Gboard (« , » et « . ») mise en forme suisse : « 2000.5 » → « 2 000,5 » ; deux décimales au plus. */
export function grouper(v: string): string {
  const m = /^(\d*)([.,]\d{0,2})?/.exec(v.replace(/[^\d,.]/g, ''));
  const ent = (m?.[1] ?? '').replace(/^0+(?=\d)/, '');
  const dec = (m?.[2] ?? '').replace('.', ',');
  return ent.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + dec;
}
export const signe = (sens: 'in' | 'out', cents: number) => `${sens === 'out' ? '−' : '+'}${chf(cents)}`;
/** `2026-11-22` → « 22.11 » ; avec l'année : « 22.11.26 ». */
export const jjmm = (iso: string, an = false) => `${iso.slice(8, 10)}.${iso.slice(5, 7)}${an ? `.${iso.slice(2, 4)}` : ''}`;
/** Le même jour, n mois plus tard, ramené au dernier jour du mois s'il n'existe pas (31 → 30, 29 févr.). */
export function plusMois(iso: string, n: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const t = (m - 1) + n, an = y + Math.floor(t / 12), mois = ((t % 12) + 12) % 12;
  const dernier = new Date(Date.UTC(an, mois + 1, 0)).getUTCDate();
  return `${an}-${String(mois + 1).padStart(2, '0')}-${String(Math.min(d, dernier)).padStart(2, '0')}`;
}
export const plusJours = (iso: string, n: number) => new Date(Date.parse(`${iso}T12:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);
export const PAS: Record<Exclude<Rythme, 'une'>, number> = { monthly: 1, quarterly: 3, yearly: 12 };

/** La dernière échéance, selon la fin choisie ; `undefined` = sans fin. */
export function dateDeFin(debut: string, rythme: Rythme, fin: Fin, finDate?: string): string | undefined {
  if (rythme === 'une' || fin === 'sans') return undefined;
  const pas = PAS[rythme];
  if (fin === 'date') return finDate && finDate >= debut ? finDate : undefined;
  const mois = fin === '6m' ? 6 : 12;
  return plusMois(debut, Math.max(0, mois - pas));
}
/** Libellés des fins préréglées selon le rythme (« 1 an · 12 fois », « 1 an · 4 fois ») ; l'annuel n'a que « sans fin » et « date ». */
export function finsProposees(rythme: Rythme): Array<{ id: Fin; nom: string }> {
  if (rythme === 'une') return [];
  if (rythme === 'yearly') return [{ id: 'sans', nom: 'sans fin' }, { id: 'date', nom: 'date' }];
  const pas = PAS[rythme];
  return [{ id: 'sans', nom: 'sans fin' }, { id: '6m', nom: pas === 1 ? '6 mois' : `6 mois · ${6 / pas} fois` }, { id: '1an', nom: `1 an · ${12 / pas} fois` }, { id: 'date', nom: 'date' }];
}

/* ---------- le brouillon ---------- */
export interface Brouillon {
  genre: GenreId;
  cents?: number;
  /** Nom tapé ou choisi ; vide = le nom gris par défaut, écrit à l'enregistrement. */
  nom: string;
  vendor?: string;
  date: string;
  reglement: 'paye' | 'apayer';
  echeance: string;
  methode: Methode;
  rythme: Rythme;
  fin: Fin;
  finDate?: string;
  categorie: FinanceCategory;
  reference: string;
  note: string;
  /** « Sans justificatif, c'est normal » (18.11) : la même coche que la fiche et la dépense avec document ; absente = on ne sait pas, la pièce reste signalée. */
  sansJustificatif?: boolean;
  tvaRate: number;
  /** Remboursement : la pièce d'origine. */
  pieceId?: string;
  /** Habituel récurrent : l'échéance que ce paiement solde. */
  solde?: { planId: string; occurrenceId: string; date: string };
  /** WFA-15 : l'achat prévu (non récurrent) que cette sortie solde ; posé à l'enregistrement seulement, depuis la ligne « ✓ Solde l'achat prévu ». */
  prevu?: string;
}
export function brouillonNeuf(aujourdhui: string): Brouillon {
  return { genre: 'achat', nom: '', date: aujourdhui, reglement: 'paye', echeance: plusJours(aujourdhui, 30), methode: 'bank', rythme: 'une', fin: 'sans', categorie: 'brassage', reference: '', note: '', tvaRate: 0 };
}
/** Poser un genre : sens, catégorie et rythme suivent ; le montant, la date et le règlement restent. */
export function avecGenre(b: Brouillon, g: GenreId): Brouillon {
  const G = GENRES[g];
  return { ...b, genre: g, rythme: G.rythme ?? 'une', fin: 'sans', finDate: undefined, categorie: G.category, nom: '', vendor: undefined, pieceId: undefined, solde: undefined };
}
/** Le jour tiré au doigt dans une frise ouverte (`cle` : la pastille qui l'a ouverte). */
export interface DateTiree { cle: string; iso: string }
/** Ce que dit la pastille `cle` : le jour que le doigt tient en ce moment, sinon la valeur écrite. Un jour tiré illisible n'écrase rien. */
export function dateMontree(cle: string, valeur: string, tiree: DateTiree | null): string {
  return tiree && tiree.cle === cle && /^\d{4}-\d{2}-\d{2}$/.test(tiree.iso) ? tiree.iso : valeur;
}
/**
 * Ce que dit le bouton d'enregistrement (E35-7) : le sens se lit sur la carte de fin, le bouton dit la même chose.
 * Réglé : « Payé » (sortie), « Reçu » (entrée), « Retiré » (prélèvement) ; pas encore réglé : « À payer » (sortie) ou « À recevoir » (entrée).
 */
export function verbeEnregistrer(apayer: boolean, sens: 'in' | 'out' | null, genre: GenreId): string {
  if (apayer) return sens === 'in' ? 'À recevoir' : 'À payer';
  return genre === 'prel' ? 'Retiré' : sens === 'out' ? 'Payé' : 'Reçu';
}
export const METHODES: Array<{ id: Methode; nom: string }> = [{ id: 'bank', nom: 'Banque' }, { id: 'cash', nom: 'Espèces' }, { id: 'twint', nom: 'TWINT' }, { id: 'other', nom: 'Autre' }];
export const nomFinal = (b: Brouillon) => b.nom.trim() || GENRES[b.genre].nomDefaut(jjmm(b.date));

/** Le sens réel : celui du genre, ou l'inverse de la pièce d'un remboursement. */
export function sensDe(b: Brouillon, transactions: FinanceTransaction[]): 'in' | 'out' {
  if (b.genre !== 'rembt') return GENRES[b.genre].sens;
  const o = transactions.find((t) => t.id === b.pieceId);
  return o && transactionDirection(o, transactions) === 'in' ? 'out' : 'in';
}

/* ---------- écrire ---------- */
export interface Ecriture { transaction: FinanceTransaction; paiement?: FinancialPayment; plan?: FinancialPlan }
export function preparer(b: Brouillon, ctx: { id: string; maintenant: string; transactions: FinanceTransaction[]; tvaInscrit: boolean }): Ecriture {
  const G = GENRES[b.genre];
  const cents = b.cents;
  if (!cents) throw new Error('Tape un montant.');
  const nom = nomFinal(b);
  const sens = sensDe(b, ctx.transactions);
  const ttc = cents / 100;
  const paye = b.reglement === 'paye';
  const notes = [b.note.trim()].filter(Boolean).join(' ') || undefined;
  let tx: FinanceTransaction;
  if (b.genre === 'rembt') {
    const o = ctx.transactions.find((t) => t.id === b.pieceId);
    if (!o) throw new Error('Choisis la pièce remboursée.');
    const v = ventilationAvoir(o, cents);
    tx = { id: ctx.id, date: b.date, description: b.nom.trim() || `Remboursement ${o.finance?.vendor || o.description}`, category: o.category, subcategory: 'Avoir', ...v, amountTTC: ttc,
      finance: { version: 1, kind: 'refund', amountCents: cents, lines: [], refundOfId: o.id, refundDirection: sens, refundApplication: 'cash', paymentStatus: paye ? 'paid' : 'unpaid', recordedAt: ctx.maintenant, vendor: o.finance?.vendor, notes } };
  } else {
    const taux = ctx.tvaInscrit && !horsResultat(b.genre) ? b.tvaRate : 0;
    const tva = taux ? Math.round((ttc - ttc / (1 + taux)) * 100) / 100 : 0;
    tx = { id: ctx.id, date: b.date, description: nom, category: b.genre === 'achat' ? b.categorie : G.category, subcategory: G.subcategory,
      amountHT: Math.round((ttc - tva) * 100) / 100, amountTTC: ttc, tvaRate: taux, tvaAmount: tva,
      finance: { version: 1, kind: G.kind, amountCents: cents, lines: [], paymentStatus: paye ? 'paid' : 'unpaid', recordedAt: ctx.maintenant,
        ...(b.vendor?.trim() ? { vendor: b.vendor.trim() } : {}), ...(b.reference.trim() ? { invoiceNumber: b.reference.trim() } : {}),
        ...(!paye ? { dueDate: b.echeance } : {}), ...(notes ? { notes } : {}), ...(b.sansJustificatif ? { proofNotNeeded: true } : {}) } };
  }
  const paiement: FinancialPayment | undefined = paye ? { id: `PAI-${ctx.id}`, transactionId: ctx.id, date: b.date, amountCents: cents, direction: sens, method: b.methode, recordedAt: ctx.maintenant } : undefined;
  let plan: FinancialPlan | undefined;
  if (b.solde) {
    tx.finance = { ...tx.finance!, planId: b.solde.planId, occurrenceId: b.solde.occurrenceId };
  } else if (b.rythme !== 'une' && G.rythme) {
    const fin = dateDeFin(b.date, b.rythme, b.fin, b.finDate);
    if (b.fin === 'date' && !fin) throw new Error('La fin tombe avant le début : choisis une date plus tardive.');
    plan = { id: `PLAN-${ctx.id}`, title: nom, date: b.date, amountCents: cents, direction: sens, category: tx.category, source: 'recurring', status: 'active',
      recurrence: { frequency: b.rythme, ...(fin ? { endDate: fin } : {}) }, ...(tx.finance?.vendor ? { vendor: tx.finance.vendor } : {}), createdAt: ctx.maintenant };
    tx.finance = { ...tx.finance!, planId: plan.id, occurrenceId: `${plan.id}:${b.date}` };
  } else if (b.prevu) {
    tx.finance = { ...tx.finance!, planId: b.prevu };
  }
  return { transaction: tx, paiement, plan };
}

/**
 * WFA-15 : l'achat prévu que cette sortie solde, par la règle de la feuille de facture (`planSoldeParDepense` : même fournisseur, montant à 10 % près ;
 * sans fournisseur au plan, la catégorie). Ici le fournisseur est la puce « Chez » choisie, sinon le nom tapé (« ZZ TEST malt » solde le prévu de « ZZ TEST »).
 * Jamais pour une écriture qui revient (elle crée sa propre prévision), un habituel (il solde déjà son échéance), un remboursement ni un prélèvement privé.
 */
export function achatPrevu(b: Brouillon, cents: number | undefined, plans: FinancialPlan[]): FinancialPlan | null {
  const G = GENRES[b.genre];
  if (!cents || G.sens !== 'out' || b.genre === 'prel' || b.solde || b.rythme !== 'une') return null;
  const d = { category: b.genre === 'achat' ? b.categorie : G.category, amountCents: cents, dateIso: b.date };
  return (b.vendor?.trim() ? planSoldeParDepense(plans, { ...d, vendor: b.vendor }) : null)
    ?? planSoldeParDepense(plans, { ...d, vendor: b.nom.trim() || undefined });
}

/* ---------- lire l'existant ---------- */
/** Le genre d'une pièce existante (habituels, derniers noms). */
export function genreDe(tx: FinanceTransaction): GenreId {
  const k = transactionKind(tx);
  if (k === 'contribution') return 'apport';
  if (k === 'withdrawal') return 'prel';
  if (k === 'refund') return 'rembt';
  if (k === 'income') return tx.subcategory === 'Autre recette' ? 'autrei' : 'vente';
  const s = (tx.subcategory || '').toLowerCase();
  if (s === 'loyer' || /\bloyer\b/i.test(tx.description)) return 'loyer';
  if (s === 'abonnement') return 'abo';
  if (s === 'salaire') return 'salaire';
  if (s.startsWith('impôt')) return 'impot';
  if (tx.category === 'divers') return 'autreo';
  return 'achat';
}
const parDateDesc = (a: FinanceTransaction, b: FinanceTransaction) => (b.date || '').localeCompare(a.date || '') || (b.finance?.recordedAt ?? '').localeCompare(a.finance?.recordedAt ?? '');
const actives = (txs: FinanceTransaction[]) => txs.filter((t) => isActiveTransaction(t) && /^\d{4}-\d{2}-\d{2}$/.test(t.date));

export interface Habituel { cle: string; genre: GenreId; nom: string; sous: string; cents: number; sens: 'in' | 'out'; vendor?: string; solde?: Brouillon['solde'] }
/**
 * Les habituels (v01s, en tête du repos) : d'abord la prochaine échéance non soldée de chaque prévision récurrente active (« prévu le 22.12 · le solde »),
 * puis les derniers mouvements uniques, un par nom. Trois au plus. Rien d'inventé : sans historique, la liste est vide.
 */
export function habituels(transactions: FinanceTransaction[], plans: FinancialPlan[], aujourdhui: string, max = 3): Habituel[] {
  const txs = actives(transactions).sort(parDateDesc);
  const out: Habituel[] = [];
  for (const p of plans) {
    if (p.status !== 'active' || p.source !== 'recurring' || !p.recurrence) continue;
    const liees = txs.filter((t) => t.finance?.planId === p.id);
    const prochaine = planOccurrences(p, `${aujourdhui.slice(0, 7)}-01`, plusMois(aujourdhui, 3)).find((o) => !liees.some((t) => t.finance?.occurrenceId === o.id));
    if (!prochaine) continue;
    const g = liees[0] ? genreDe(liees[0]) : p.direction === 'in' ? 'vente' : /loyer/i.test(p.title) ? 'loyer' : 'abo';
    out.push({ cle: `plan:${p.id}`, genre: g, nom: p.title, sous: `prévu le ${jjmm(prochaine.date)} · le solde`, cents: p.amountCents, sens: p.direction, vendor: p.vendor,
      solde: { planId: p.id, occurrenceId: prochaine.id, date: prochaine.date } });
  }
  const vus = new Set(out.map((h) => h.nom.toLowerCase()));
  for (const t of txs) {
    if (out.length >= max) break;
    const g = genreDe(t);
    if (g === 'rembt' || t.finance?.planId) continue;
    const cle = t.description.trim().toLowerCase();
    if (!cle || vus.has(cle)) continue;
    vus.add(cle);
    const sens = transactionDirection(t, transactions);
    out.push({ cle: `tx:${t.id}`, genre: g, nom: t.description.trim(), sous: `${GENRES[g].nom.toLowerCase()} · dernier le ${jjmm(t.date)}`, cents: transactionAmount(t), sens, vendor: t.finance?.vendor });
  }
  return out.slice(0, max);
}

/** Les derniers noms de contrepartie du genre (fournisseur, client, bailleur…), du plus récent au plus ancien, sans doublon. */
export function derniersNoms(transactions: FinanceTransaction[], g: GenreId, max = 2): string[] {
  const noms: string[] = [];
  for (const t of actives(transactions).sort(parDateDesc)) {
    if (genreDe(t) !== g) continue;
    const n = (t.finance?.vendor || '').trim();
    if (n && !noms.some((x) => x.toLowerCase() === n.toLowerCase())) noms.push(n);
    if (noms.length >= max) break;
  }
  return noms;
}

/** Un client de l'onglet Clients, réduit à ce que la saisie lit. */
export interface ClientConnu { name: string; favorite?: boolean; archivedAt?: string | null }
const sansAccent = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
/**
 * E35-5 : les noms que « + autre » propose pour la contrepartie du genre, qu'on tape ou non (la saisie filtre, « ZZ » ne trouve rien et « Créer » apparaît).
 * Vente et autre recette : les clients de l'onglet Clients (épinglés d'abord, archivés exclus), puis les clients déjà écrits sur des ventes.
 * Les autres genres : les fournisseurs, bailleurs, services déjà écrits sur des pièces du même genre. Sans doublon (casse et accents ignorés).
 * Rien d'inventé : sans historique ni client, la liste est vide et seul « Créer » reste.
 */
export function propositionsTiers(g: GenreId, saisie: string, src: { clients: ClientConnu[]; transactions: FinanceTransaction[] }, max = 8): string[] {
  const out: string[] = [], vus = new Set<string>();
  const ajouter = (n: string) => { const c = sansAccent(n); if (c && !vus.has(c)) { vus.add(c); out.push(n.trim()); } };
  if (GENRES[g].qui === 'Client') {
    const actifs = src.clients.filter((c) => !c.archivedAt && c.name?.trim());
    [...actifs.filter((c) => c.favorite), ...actifs.filter((c) => !c.favorite).sort((a, b) => a.name.localeCompare(b.name, 'fr'))].forEach((c) => ajouter(c.name));
  }
  derniersNoms(src.transactions, g, 60).forEach(ajouter);
  const q = sansAccent(saisie);
  return (q ? out.filter((n) => sansAccent(n).includes(q)) : out).slice(0, max);
}
/** Le nom tapé existe-t-il déjà tel quel dans la liste (le bouton « Créer » ne s'affiche alors pas) ? */
export const tiersExiste = (saisie: string, noms: string[]) => noms.some((n) => sansAccent(n) === sansAccent(saisie));

/**
 * Le règlement d'une écriture déjà posée, en mots (la fiche Modifier le montre comme la saisie : Payé / À payer, le moyen, l'échéance).
 * Les paiements annulés (contre-passations) ne comptent pas ; sans paiement ni statut, rien n'est affirmé (l'inconnu n'est pas « payé »).
 */
export function resumeReglement(tx: FinanceTransaction, paiements: FinancialPayment[]): { etat: 'paye' | 'apayer' | 'partiel' | 'inconnu'; moyen?: Methode; date?: string; echeance?: string } {
  const f = tx.finance;
  const annules = new Set(paiements.filter((p) => p.reversalOfId).map((p) => p.reversalOfId as string));
  const siens = paiements.filter((p) => p.transactionId === tx.id && !p.reversalOfId && !annules.has(p.id)).sort((a, b) => b.date.localeCompare(a.date));
  const dernier = siens[0];
  const statut = f?.paymentStatus;
  if (statut === 'paid' || (!statut && dernier)) return { etat: 'paye', moyen: dernier?.method, date: dernier?.date };
  if (statut === 'partial') return { etat: 'partiel', moyen: dernier?.method, date: dernier?.date, echeance: f?.dueDate };
  if (statut === 'unpaid') return { etat: 'apayer', echeance: f?.dueDate };
  return { etat: 'inconnu' };
}

export interface PieceRemboursable { id: string; nom: string; sous: string; date: string; cents: number; reste: number; sens: 'in' | 'out'; category: FinanceCategory }
/** Les pièces qu'un remboursement peut viser (achats et ventes actifs), de la plus récente à la plus ancienne ; « reste » = montant moins ses avoirs. */
export function piecesRemboursables(transactions: FinanceTransaction[], recherche = '', max = 30): PieceRemboursable[] {
  const q = recherche.trim().toLowerCase();
  const avoirs = new Map<string, number>();
  for (const t of actives(transactions)) if (transactionKind(t) === 'refund' && t.finance?.refundOfId) avoirs.set(t.finance.refundOfId, (avoirs.get(t.finance.refundOfId) ?? 0) + transactionAmount(t));
  const out: PieceRemboursable[] = [];
  for (const t of actives(transactions).sort(parDateDesc)) {
    const k = transactionKind(t);
    if (k !== 'expense' && k !== 'income') continue;
    const cents = transactionAmount(t), reste = cents - (avoirs.get(t.id) ?? 0);
    if (reste <= 0) continue;
    const nom = t.finance?.vendor || t.description;
    if (q && !`${nom} ${t.description} ${chf(cents)}`.toLowerCase().includes(q)) continue;
    out.push({ id: t.id, nom, sous: `${jjmm(t.date)} · ${t.description}`, date: t.date, cents, reste, sens: transactionDirection(t, transactions), category: t.category });
    if (out.length >= max) break;
  }
  return out;
}

/** Les échéances d'un rythme dès `debut` (la première = la pièce du jour), au plus `n`, bornées par la fin ; et leur somme sur 12 mois. */
export function echeances(debut: string, rythme: Rythme, fin: string | undefined, n = 4): string[] {
  if (rythme === 'une') return [debut];
  const out: string[] = [];
  for (let i = 0; out.length < n; i += PAS[rythme]) { const d = plusMois(debut, i); if (fin && d > fin) break; out.push(d); }
  return out;
}
export function sommeDouzeMois(cents: number, debut: string, rythme: Rythme, fin: string | undefined): number {
  if (rythme === 'une') return cents;
  const limite = plusJours(plusMois(debut, 12), -1);
  return echeances(debut, rythme, fin && fin < limite ? fin : limite, 13).length * cents;
}
