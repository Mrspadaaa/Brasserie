import type { StockItem } from '../../../types';
import type { AnnualReport, DepreciationRow, FinanceTransaction, FinancialAsset, FinancialClosing, FinancialPayment, FinancialPlan, FinancialProfile, FribourgTaxReport, TaxReviewKey } from '../../../domain/finance/types';
import { depreciationForYear } from '../../../domain/finance/annual';
import { isActiveTransaction, isoDate, transactionAmount } from '../../../domain/finance/ledger';
import { planOccurrences } from '../../../domain/finance/forecast';
import { ordrePile, periodeSynthese, regrouperPetits, type Poste } from '../../../domain/finance/periodeSynthese';

/* Annuel (g6) : calculs purs. Centimes entiers, aucune horloge (`today` est un paramètre), aucune règle fiscale réécrite :
   les nombres viennent de `annual.ts`, `fribourgTax.ts` et `periodeSynthese.ts` ; ici on ne fait que les ranger. */

export const NOMS_ETAPES = ['Opérations', 'Solde d’ouverture', 'Inventaires', 'Matériel et usure', 'Dettes et créances', 'Parts privées', 'Vérifications', 'Montants à reporter', 'Dossier'] as const;

/** Fragments des messages de `annual.ts` qui disent qu'une pièce de capital n'est pas classée (un test les fige contre le domaine). */
export const MESSAGES_NON_CLASSES = ['confirmer charge ou immobilisation', 'avoir sur immobilisation', 'une ligne passée en charge'] as const;
export const piecesNonClassees = (report: AnnualReport): string[] => (report.missing ?? []).filter(m => MESSAGES_NON_CLASSES.some(f => m.includes(f)));

/* ---------- tête ---------- */
export interface Colonnes {
  entreCents: number; depenseCents: number; usureCents: number; totalDepenseCents: number;
  /** Ventes − dépensé − usure ± ajustements, SANS la variation de stock (inconnue tant que les inventaires ne sont pas confirmés). Jamais le montant à reporter. */
  perteAvantStockCents: number;
  postes: Poste[];
}
export function perteAvantStock(report: AnnualReport): number {
  return report.revenueCents - report.operatingExpensesCents - report.depreciationCents + (report.adjustmentCents ?? 0) + (report.disposalResultCents ?? 0);
}
export function colonnesAnnee(report: AnnualReport): Colonnes {
  const postes = (report.categories ?? []).filter(c => c.amountCents > 0).map(c => ({ categorie: c.category, cents: c.amountCents, payeCents: c.amountCents, aPayerCents: 0 }));
  return {
    entreCents: report.revenueCents, depenseCents: report.operatingExpensesCents, usureCents: report.depreciationCents,
    totalDepenseCents: report.operatingExpensesCents + report.depreciationCents,
    perteAvantStockCents: perteAvantStock(report),
    postes: regrouperPetits(ordrePile(postes), report.operatingExpensesCents)
  };
}

/* ---------- piste ---------- */
export interface EtapeEtat { n: number; nom: string; prete: boolean }
export interface CtxPiste { report: AnnualReport; tax: FribourgTaxReport; closing?: FinancialClosing; profile: FinancialProfile; assets: FinancialAsset[] }
const reviewOk = (tax: FribourgTaxReport, key: TaxReviewKey) => !!tax.reviews?.[key];
export function materielPret(c: CtxPiste): boolean {
  return c.assets.length > 0 && c.assets.every(a => a.openingConfirmed) && !(c.report.depreciation ?? []).some(r => r.missing.length > 0) && piecesNonClassees(c.report).length === 0;
}
export function etapesPiste(c: CtxPiste): EtapeEtat[] {
  const prets = [
    reviewOk(c.tax, 'journal'),
    !!c.profile.openingCash?.confirmed,
    !!c.closing?.inventoriesConfirmed,
    materielPret(c),
    reviewOk(c.tax, 'balance'),
    reviewOk(c.tax, 'privateUse'),
    (['journal', 'privateUse', 'social', 'assets', 'balance', 'specialCases'] as TaxReviewKey[]).every(k => reviewOk(c.tax, k)) && !!c.tax.activity,
    c.tax.ready,
    !!c.closing?.report
  ];
  return prets.map((prete, i) => ({ n: i + 1, nom: NOMS_ETAPES[i], prete }));
}
export const premiereNonPrete = (etapes: EtapeEtat[]): EtapeEtat | undefined => etapes.find(e => !e.prete);
/** Vrai quand des relectures ont été posées sur d'autres comptes que les comptes actuels (le domaine les ignore alors). */
export const relecturesPerimees = (closing: FinancialClosing | undefined, baseCourante: string): boolean => !!closing?.tax?.reviewedBasis && closing.tax.reviewedBasis !== baseCourante;

/* ---------- étape 1 ---------- */
export interface CaseMois { mois: number; n: number; etat: 'notes' | 'vide' | 'avenir' }
export function moisNotes(documents: Array<{ date: string }>, year: number, today: string): CaseMois[] {
  const ty = Number(today.slice(0, 4)), courant = ty === year ? Number(today.slice(5, 7)) : ty > year ? 12 : 0;
  const n = new Array<number>(12).fill(0);
  for (const d of documents) { const iso = isoDate(d.date); if (iso && Number(iso.slice(0, 4)) === year) n[Number(iso.slice(5, 7)) - 1]++; }
  return n.map((c, i) => ({ mois: i + 1, n: c, etat: c > 0 ? 'notes' as const : i + 1 <= courant ? 'vide' as const : 'avenir' as const }));
}
export const justificatifs = (documents: Array<{ required?: boolean; hasProof: boolean }>) => {
  const requis = documents.filter(d => d.required);
  return { avec: requis.filter(d => d.hasProof).length, requis: requis.length };
};
export interface PlanManquant { planId: string; titre: string; amountCents: number; attendus: number; notes: number; manquants: string[] }
/** Plans mensuels qui DÉMARRENT avant le mois courant : mois échus sans pièce liée au plan (avec ou sans occurrenceId). Rien pour un mois futur. */
export function plansManquants(plans: FinancialPlan[], transactions: FinanceTransaction[], year: number, today: string): PlanManquant[] {
  const ty = Number(today.slice(0, 4)), dernier = ty === year ? Number(today.slice(5, 7)) - 1 : ty > year ? 12 : 0;
  if (dernier < 1) return [];
  const resultat: PlanManquant[] = [];
  for (const plan of plans) {
    if (plan.status !== 'active' || plan.direction !== 'out' || plan.recurrence?.frequency !== 'monthly') continue;
    const attendus = planOccurrences(plan, `${year}-01-01`, `${year}-12-31`).filter(o => Number(o.date.slice(5, 7)) <= dernier);
    if (!attendus.length) continue;
    const liees = transactions.filter(t => isActiveTransaction(t) && t.finance?.planId === plan.id).map(t => isoDate(t.date)).filter((d): d is string => !!d);
    const manquants = attendus.filter(o => !liees.some(d => d.slice(0, 7) === o.date.slice(0, 7))).map(o => o.date.slice(0, 7));
    if (manquants.length) resultat.push({ planId: plan.id, titre: plan.title, amountCents: plan.amountCents, attendus: attendus.length, notes: attendus.length - manquants.length, manquants });
  }
  return resultat;
}

/* ---------- étape 2 ---------- */
export interface Pont { ouvertureCents: number; recuCents: number; payeCents: number; finCents: number; ouvertureLe1er: boolean; coherent: boolean }
export function pontCaisse(profile: FinancialProfile, report: AnnualReport, year: number): Pont | null {
  const o = profile.openingCash;
  if (!o || report.cashCents == null) return null;
  const ouvertureLe1er = isoDate(o.date) === `${year}-01-01`;
  return { ouvertureCents: o.amountCents, recuCents: report.receivedCents, payeCents: report.paidCents, finCents: report.cashCents, ouvertureLe1er,
    coherent: ouvertureLe1er && o.amountCents + report.receivedCents - report.paidCents === report.cashCents };
}

/* ---------- étape 3 ---------- */
export type NatureInventaire = 'malt' | 'houblons' | 'emballages' | 'biere' | 'autres';
export const LIBELLE_NATURE: Record<NatureInventaire, string> = { malt: 'Malt', houblons: 'Houblons', emballages: 'Emballages', biere: 'Bière en cave', autres: 'Autres matières' };
export const natureDeLigne = (ligne: { kind: string; stockItemRef?: string }, stocks: StockItem[]): NatureInventaire => {
  if (ligne.kind === 'packaging') return 'emballages';
  if (ligne.kind === 'work-in-progress' || ligne.kind === 'finished') return 'biere';
  const categorie = (stocks.find(s => s.ref === ligne.stockItemRef)?.category ?? '').toLowerCase();
  return categorie.includes('malt') ? 'malt' : categorie.includes('houblon') ? 'houblons' : 'autres';
};
export interface CelluleInventaire { cents: number | null; aucuneLigne: boolean }
/** Non confirmé et rien saisi : « ? » (null). Confirmé et nature sans ligne : 0 dit « aucune ligne ». */
export function inventairesParNature(closing: FinancialClosing | undefined, stocks: StockItem[]) {
  const natures: NatureInventaire[] = ['malt', 'houblons', 'emballages', 'biere'];
  const lignes = [...(closing?.openingInventory ?? []), ...(closing?.closingInventory ?? [])];
  if (lignes.some(l => natureDeLigne(l, stocks) === 'autres')) natures.push('autres');
  const confirme = !!closing?.inventoriesConfirmed;
  const cellule = (cote: 'openingInventory' | 'closingInventory', nature: NatureInventaire): CelluleInventaire => {
    const l = (closing?.[cote] ?? []).filter(x => natureDeLigne(x, stocks) === nature);
    if (l.length) return { cents: l.reduce((n, x) => n + x.valueCents, 0), aucuneLigne: false };
    return confirme ? { cents: 0, aucuneLigne: true } : { cents: null, aucuneLigne: true };
  };
  return natures.map(nature => ({ nature, libelle: LIBELLE_NATURE[nature], ouverture: cellule('openingInventory', nature), cloture: cellule('closingInventory', nature) }));
}
export interface Estimation { cents: number; source: string }
/** Dernière facture de la matière × stock courant. Seulement pour l'exercice en cours (le stock d'aujourd'hui n'est pas celui d'une clôture passée). Jamais 0 inventé. */
export function valeurEstimee(item: StockItem, transactions: FinanceTransaction[], year: number, today: string): Estimation | null {
  if (Number(today.slice(0, 4)) !== year || !(item.currentStock > 0)) return null;
  const candidates = transactions.filter(isActiveTransaction).flatMap(t => (t.finance?.lines ?? []).filter(l => l.stockItemRef === item.ref && (l.quantity ?? 0) > 0 && l.amountCents > 0).map(l => ({ t, l })))
    .sort((a, b) => (isoDate(b.t.date) ?? '').localeCompare(isoDate(a.t.date) ?? ''));
  const dernier = candidates[0];
  if (!dernier) return null;
  return { cents: Math.round(dernier.l.amountCents / dernier.l.quantity! * item.currentStock), source: `${dernier.t.description} · ${isoDate(dernier.t.date)}` };
}

/* ---------- étape 4 ---------- */
export interface Escalier { nom: string; achatCents: number; partPro: number; ouvertureCents: number; usureCents: number; clotureCents: number; prevuCents: number; acquisition: string }
export function escalierMateriel(row: DepreciationRow, asset: FinancialAsset, year: number): Escalier {
  return { nom: asset.name, achatCents: Math.round(asset.acquisitionCents * asset.businessUsePct / 100), partPro: asset.businessUsePct, ouvertureCents: row.openingCents, usureCents: row.depreciationCents,
    clotureCents: row.closingCents, prevuCents: depreciationForYear(asset, year + 1).closingCents, acquisition: isoDate(asset.acquisitionDate) ?? '' };
}

/* ---------- étape 5 ---------- */
export interface Plateaux { tuDois: AnnualReport['outstanding'] & object; onTeDoit: AnnualReport['outstanding'] & object; prevues: Array<{ id: string; titre: string; date: string; amountCents: number }> }
export function plateaux(report: AnnualReport, plans: FinancialPlan[], year: number, today: string): Plateaux {
  const ouvertes = report.outstanding ?? [];
  const prevues: Plateaux['prevues'] = [];
  if (Number(today.slice(0, 4)) === year) {
    for (const plan of plans) {
      if (plan.direction !== 'out' || plan.status !== 'active' || !plan.recurrence) continue;
      const demain = new Date(`${today}T12:00:00Z`); demain.setUTCDate(demain.getUTCDate() + 1);
      for (const o of planOccurrences(plan, demain.toISOString().slice(0, 10), `${year}-12-31`)) prevues.push({ id: o.id, titre: plan.title, date: o.date, amountCents: plan.amountCents });
    }
  }
  return { tuDois: ouvertes.filter(r => r.direction === 'out'), onTeDoit: ouvertes.filter(r => r.direction === 'in'), prevues: prevues.sort((a, b) => a.date.localeCompare(b.date)) };
}

/* ---------- étape 6 ---------- */
export const TUILES_PRIVEES = [
  { id: 'biere', libelle: 'Bière bue, offerte', mots: [] as string[] },
  { id: 'electricite', libelle: 'Électricité', mots: ['électricité', 'electricite', 'énergie', 'energie'] },
  { id: 'local', libelle: 'Local', mots: ['loyer', 'local'] },
  { id: 'telephone', libelle: 'Téléphone', mots: ['téléphone', 'telephone', 'mobile'] },
  { id: 'vehicule', libelle: 'Véhicule', mots: ['véhicule', 'vehicule', 'essence', 'voiture'] }
] as const;
/** Base proposée : charges de l'année dont la description porte un mot de la tuile, à 100 % pro (une pièce déjà réduite ne se corrige pas une deuxième fois). Toujours à confirmer. */
export function baseProposee(transactions: FinanceTransaction[], year: number, mots: readonly string[]): { cents: number; pieces: string[] } | null {
  if (!mots.length) return null;
  const pieces = transactions.filter(isActiveTransaction).filter(t => {
    const d = isoDate(t.date), pct = t.finance?.businessUsePct;
    return d && Number(d.slice(0, 4)) === year && t.finance?.kind === 'expense' && (pct == null || pct === 100) && mots.some(m => t.description.toLowerCase().includes(m));
  });
  return pieces.length ? { cents: pieces.reduce((n, t) => n + transactionAmount(t), 0), pieces: pieces.map(t => t.description) } : null;
}

/* ---------- étape 8 ---------- */
export interface TicketRevenu { aReporterCents: number | null; avantStockCents: number; pret: boolean; code?: string }
export function ticketRevenu(report: AnnualReport, tax: FribourgTaxReport): TicketRevenu {
  const f = tax.fields.find(x => x.id === 'income');
  return { aReporterCents: f?.amountCents ?? null, avantStockCents: perteAvantStock(report) + tax.correctionCents, pret: !!f?.ready, code: f?.code };
}
export interface TicketFortune { aReporterCents: number | null; pret: boolean; aideCaisseCents: number | null; aideMaterielCents: number; aideDettesCents: number; aideNetteCents: number | null; code?: string }
export function ticketFortune(report: AnnualReport, tax: FribourgTaxReport): TicketFortune {
  const f = tax.fields.find(x => x.id === 'wealth');
  return { aReporterCents: f?.amountCents ?? null, pret: !!f?.ready, aideCaisseCents: report.cashCents, aideMaterielCents: (report.depreciation ?? []).reduce((n, r) => n + r.closingCents, 0), aideDettesCents: tax.totalLiabilitiesCents, aideNetteCents: tax.netAssetsCents, code: f?.code };
}

/* ---------- Mois par mois ---------- */
export interface MoisSynthese { mois: number; entreCents: number; depenseCents: number; gainCents: number; materielCents: number; etat: 'notes' | 'vide' | 'avenir' }
/** Base Synthèse (matériel à part), transactions filtrées sur l'année : jamais `mois: null`. */
export function moisDeLAnnee(transactions: FinanceTransaction[], payments: FinancialPayment[], year: number, today: string): MoisSynthese[] {
  const txs = transactions.filter(t => { const d = isoDate(t.date); return d && Number(d.slice(0, 4)) === year; });
  const cases = moisNotes(txs, year, today);
  return cases.map(c => {
    const p = periodeSynthese({ transactions: txs, payments, mois: `${year}-${String(c.mois).padStart(2, '0')}`, aujourdhui: today });
    return { mois: c.mois, entreCents: p.entreCents, depenseCents: p.depenseCents, gainCents: p.gainCents, materielCents: p.materielCents, etat: c.etat };
  });
}
