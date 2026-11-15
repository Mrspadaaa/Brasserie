import type { Batch, StockItem } from '../../types';
import type { FinanceTransaction, FinancialAsset, FinancialPayment, FinancialPlan, FinancialProfile } from './types';
import { ajouterJours, estimerBrassinsPlanifies, planBrewBatchId } from './brewForecast';
import { planOccurrences } from './forecast';
import { isActiveTransaction, isoDate, paymentState, transactionAmount, transactionKind, transactionVendor, validPayment } from './ledger';
import { periodeSynthese, dansPeriode } from './periodeSynthese';
import { isUpgradePlan } from './upgrades';

/**
 * Outil d'analyse (a2a, choisi le 10.11) : les nombres de l'escalier de caisse, de la cascade des sources, du budget et du filtre.
 * Fonctions pures, centimes entiers, aucune horloge (`aujourdhui` est un paramètre), aucune écriture. L'inconnu est `null`, jamais 0 :
 * pas de solde confirmé → pas de caisse (on parle d'écart) ; pas de plan → pas de « prévu » ; pas de pièce l'an dernier → « rien noté ».
 * UNE définition de « dépensé » : `periodeSynthese` (matériel à part). La caisse, elle, suit les paiements réels (`FinancialPayment`).
 * État de l'art (MISSION.md) : graduations de Heckbert (`graduations`), placement d'étiquettes glouton par rectangles (`placerEtiquettes`).
 */

export interface EntreeAnalyse {
  transactions: FinanceTransaction[]; payments: FinancialPayment[]; plans: FinancialPlan[]; profile: FinancialProfile;
  assets?: FinancialAsset[]; batches?: Batch[]; stockItems?: StockItem[]; aujourdhui: string;
}

/* ---------- sources ---------- */
export type SourceCle = 'ventes' | 'chargesFixes' | 'brassage' | 'nettoyage' | 'autres' | 'materiel' | 'prive';
/** Les sources de dépense, dans l'ordre de la cascade a1e. */
export const SOURCES_DEPENSE: SourceCle[] = ['chargesFixes', 'brassage', 'nettoyage', 'autres'];
export const NOMS_SOURCE: Record<SourceCle, string> = { ventes: 'Ventes', chargesFixes: 'Charges fixes', brassage: 'Brassage', nettoyage: 'Nettoyage', autres: 'Autres', materiel: 'Matériel', prive: 'Apports et retraits' };
/** Une catégorie de pièce → sa source. Le matériel « passé en charge » (divers, travaux) retombe dans « Autres » : le capital est « à part ». */
export function sourceDeCategorie(categorie: string): SourceCle {
  return categorie === 'recettes' ? 'ventes' : categorie === 'chargesFixes' ? 'chargesFixes' : categorie === 'brassage' ? 'brassage' : categorie === 'nettoyage' ? 'nettoyage' : 'autres';
}
const estCapital = (categorie: string) => categorie === 'materiel' || categorie === 'renovation';

/* ---------- dates ---------- */
export const decalerAn = (iso: string, n: number): string => {
  const a = Number(iso.slice(0, 4)) + n, m = iso.slice(5, 7), j = iso.slice(8, 10);
  return m === '02' && j === '29' ? `${a}-02-28` : `${a}-${m}-${j}`;
};
export const decalerMois = (mois: string, n: number): string => {
  const d = new Date(Date.UTC(Number(mois.slice(0, 4)), Number(mois.slice(5, 7)) - 1 + n, 1));
  return d.toISOString().slice(0, 7);
};
export const finDuMois = (mois: string): string => ajouterJours(`${decalerMois(mois, 1)}-01`, -1);
export const moisEntre = (du: string, au: string): string[] => { const sortie: string[] = []; for (let m = du; m <= au && sortie.length < 60; m = decalerMois(m, 1)) sortie.push(m); return sortie; };

export type ChoixPeriode = '30j' | '90j' | '12mois';
export interface Fenetre { du: string; au: string }
/** 30 j et 90 j finissent aujourd'hui (jour compris) ; 12 mois commence le 1er du mois d'il y a 11 mois. */
export function fenetreDe(choix: ChoixPeriode, aujourdhui: string): Fenetre {
  if (choix === '30j') return { du: ajouterJours(aujourdhui, -29), au: aujourdhui };
  if (choix === '90j') return { du: ajouterJours(aujourdhui, -89), au: aujourdhui };
  return { du: `${decalerMois(aujourdhui.slice(0, 7), -11)}-01`, au: aujourdhui };
}
export interface PlageMois { du: string; au: string }
export const plageDeFenetre = (f: Fenetre): PlageMois => ({ du: f.du.slice(0, 7), au: f.au.slice(0, 7) });

/* ---------- paiements, solde ---------- */
interface Paiement { p: FinancialPayment; date: string; cents: number; tx?: FinanceTransaction; source: SourceCle }
function paiementsDe(e: EntreeAnalyse): Paiement[] {
  const parId = new Map(e.transactions.map(t => [t.id, t]));
  const sortie: Paiement[] = [];
  for (const p of e.payments) {
    if (!validPayment(p)) continue;
    const date = isoDate(p.date)!;
    const tx = p.transactionId ? parId.get(p.transactionId) : undefined;
    if (tx && !isActiveTransaction(tx)) continue;
    const signe = p.direction === 'in' ? 1 : -1;
    let source: SourceCle = 'prive';
    if (tx) {
      const k = transactionKind(tx);
      source = k === 'contribution' || k === 'withdrawal' ? 'prive' : estCapital(tx.category) ? 'materiel' : sourceDeCategorie(tx.category);
    }
    sortie.push({ p, date, cents: signe * p.amountCents, tx, source });
  }
  return sortie.sort((a, b) => a.date.localeCompare(b.date) || a.p.recordedAt.localeCompare(b.p.recordedAt) || a.p.id.localeCompare(b.p.id));
}
const ouverture = (e: EntreeAnalyse) => {
  const o = e.profile.openingCash, d = o ? isoDate(o.date) : null;
  return o && o.confirmed && d && Number.isSafeInteger(o.amountCents) ? { date: d, cents: o.amountCents } : null;
};
/** Solde au début du jour `date` (avant ses paiements) ; `null` sans solde de départ confirmé ou s'il est daté après `date`. */
export function soldeAvant(e: EntreeAnalyse, date: string): number | null {
  const o = ouverture(e);
  if (!o || o.date > date) return null;
  return o.cents + paiementsDe(e).filter(x => x.date >= o.date && x.date < date).reduce((n, x) => n + x.cents, 0);
}
export const soldeFinJour = (e: EntreeAnalyse, date: string): number | null => soldeAvant(e, ajouterJours(date, 1));
/** Première écriture connue (paiement ou pièce datée) : au-delà, « depuis le … ». */
function premiereDate(e: EntreeAnalyse): string | null {
  const dates = [...paiementsDe(e).map(x => x.date), ...e.transactions.filter(isActiveTransaction).map(t => isoDate(t.date)).filter((d): d is string => !!d)];
  return dates.length ? dates.reduce((a, b) => a < b ? a : b) : null;
}

/* ---------- prévu ---------- */
export interface FluxPrevu { id: string; date: string; cents: number; categorie: string; source: SourceCle; libelle: string; planId?: string; batchId?: string; vendor?: string }
/**
 * Le prévu d'une fenêtre : les occurrences des plans actifs ou déjà payés (le prévu d'une période passée ; ni brouillon ni annulé ; hors projets de matériel : une intention, pas un flux) et les sorties dérivées
 * des brassins planifiés (`estimerBrassinsPlanifies`, qui remplace le plan « Prévoir » du même brassin). `jours` : bornes ISO incluses.
 */
export function fluxPrevus(e: EntreeAnalyse, du: string, au: string): FluxPrevu[] {
  const derive = e.batches?.length ? estimerBrassinsPlanifies({ batches: e.batches, stockItems: e.stockItems ?? [], transactions: e.transactions, plans: e.plans, profile: e.profile, assets: e.assets, asOf: e.aujourdhui, fin: au }) : null;
  const flux: FluxPrevu[] = [];
  for (const plan of e.plans) {
    if (!(plan.status === 'active' || plan.status === 'completed') || isUpgradePlan(plan) || estCapital(plan.category) || !(plan.amountCents > 0)) continue;
    if (plan.source === 'brew') { const b = planBrewBatchId(plan); if (b && derive?.remplaces.has(b)) continue; }
    const dates = plan.recurrence ? planOccurrences(plan, du, au) : (() => { const d = isoDate(plan.date); return d && d >= du && d <= au ? [{ id: `${plan.id}:${d}`, date: d }] : []; })();
    for (const o of dates) flux.push({ id: o.id, date: o.date, cents: (plan.direction === 'in' ? 1 : -1) * plan.amountCents, categorie: plan.category, source: sourceDeCategorie(plan.category), libelle: plan.title, planId: plan.id, batchId: planBrewBatchId(plan), vendor: plan.vendor });
  }
  for (const it of derive?.items ?? []) {
    if (it.date < du || it.date > au || estCapital(it.category)) continue;
    flux.push({ id: it.id, date: it.date, cents: (it.direction === 'in' ? 1 : -1) * it.amountCents, categorie: it.category, source: sourceDeCategorie(it.category), libelle: it.label, batchId: it.batchId });
  }
  return flux.sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
}

/* ---------- Caisse : l'escalier ---------- */
export interface Marche { id: string; date: string; cents: number; apres: number; source: SourceCle; libelle: string; txId?: string; prevuCents: number | null; pasPrevu: boolean }
export interface PointCourbe { date: string; apres: number }
export interface EscalierCaisse {
  du: string; au: string;
  /** Date de la première écriture si la fenêtre a été rognée (« Depuis le 8 janv. »). */
  depuis: string | null;
  /** Solde de départ confirmé et daté avant la fenêtre : la caisse est connue, sinon on parle d'écart. */
  connu: boolean;
  debutCents: number | null; finCents: number | null; ecartCents: number;
  marches: Marche[];
  /** Prévu : le solde suivi par les plans et les brassins (null s'il n'y a aucun plan dans la fenêtre : « rien de prévu »). */
  prevu: { finCents: number | null; ecartCents: number; points: PointCourbe[]; flux: FluxPrevu[] } | null;
  anDernier: { finCents: number | null; ecartCents: number | null; nombre: number; points: PointCourbe[] };
  pireBaisse: Marche | null; pasPrevu: Marche[];
  /** Pièces datées de la fenêtre dont le paiement est inconnu : le solde peut être plus bas (« ≤ »). */
  incertains: string[];
}
export function escalierCaisse(e: EntreeAnalyse, f: Fenetre): EscalierCaisse {
  const o = ouverture(e), premiere = premiereDate(e);
  const plancher = o ? o.date : premiere;
  const du = plancher && plancher > f.du ? plancher : f.du;
  const depuis = du > f.du ? du : null;
  const connu = !!o && o.date <= du;
  const debut = connu ? soldeAvant(e, du) : null;
  const tous = paiementsDe(e);
  const flux = fluxPrevus(e, du, f.au);
  const planParId = new Map(e.plans.map(p => [p.id, p]));
  const aPrevu = flux.length > 0;
  let cumul = debut ?? 0;
  const marches: Marche[] = tous.filter(x => x.date >= du && x.date <= f.au && (!o || x.date >= o.date)).map(x => {
    cumul += x.cents;
    const plan = x.tx?.finance?.planId ? planParId.get(x.tx.finance.planId) : undefined;
    const prevuCents = plan ? (plan.direction === 'in' ? 1 : -1) * plan.amountCents : null;
    const libelle = x.tx?.description || x.p.note || NOMS_SOURCE[x.source];
    return { id: x.p.id, date: x.date, cents: x.cents, apres: cumul, source: x.source, libelle, txId: x.tx?.id, prevuCents, pasPrevu: aPrevu && !plan && x.source !== 'prive' };
  });
  const ecartCents = marches.reduce((n, m) => n + m.cents, 0);
  const finCents = connu ? (debut as number) + ecartCents : null;
  let prevu: EscalierCaisse['prevu'] = null;
  if (aPrevu) {
    let c = debut ?? 0;
    const points = flux.map(x => { c += x.cents; return { date: x.date, apres: c }; });
    prevu = { finCents: connu ? c : null, ecartCents: flux.reduce((n, x) => n + x.cents, 0), points, flux };
  }
  // 2025 : la même fenêtre un an plus tôt, sur les mêmes paiements.
  const duAn = decalerAn(du, -1), auAn = decalerAn(f.au, -1);
  const oAn = o && o.date <= duAn;
  const mAn = tous.filter(x => x.date >= duAn && x.date <= auAn && (!o || x.date >= o.date));
  let cAn = oAn ? soldeAvant(e, duAn) ?? 0 : 0;
  const pointsAn = mAn.map(x => { cAn += x.cents; return { date: decalerAn(x.date, 1), apres: cAn }; });
  const anDernier = { finCents: oAn ? cAn : null, ecartCents: mAn.length ? mAn.reduce((n, x) => n + x.cents, 0) : null, nombre: mAn.length, points: pointsAn };
  const baisses = marches.filter(m => m.cents < 0).sort((a, b) => a.cents - b.cents || a.date.localeCompare(b.date));
  const incertains = e.transactions.filter(isActiveTransaction).filter(t => { const d = isoDate(t.date); return d && d >= du && d <= f.au && paymentState(t, e.payments, e.transactions, e.aujourdhui).state === 'unknown'; }).map(t => t.id);
  return { du, au: f.au, depuis, connu, debutCents: debut, finCents, ecartCents, marches, prevu, anDernier, pireBaisse: baisses[0] ?? null, pasPrevu: marches.filter(m => m.pasPrevu), incertains };
}

/* ---------- Sources : la cascade ---------- */
export interface LigneSource { source: SourceCle; reelCents: number; prevuCents: number | null; anCents: number | null; depasseCents: number }
export interface Cascade {
  plage: PlageMois; depuis: string | null; debutCents: number | null; finCents: number | null;
  ventesCents: number; ventesPrevuCents: number | null; ventesAnCents: number | null;
  lignes: LigneSource[]; materielCents: number; materielAnCents: number | null;
  /** Ce qui rattache la caisse de fin à celle du début quand les pièces et les paiements ne coïncident pas (à payer, apports, retraits) ; `null` si caisse inconnue. */
  autresMouvementsCents: number | null;
  /** Ce même écart, dit en deux choses (fx1) : les apports privés (paiements d'apport − retraits de la période, exacts) et le reste (`autresMouvementsCents` − apports) : l'argent des pièces du mois pas encore sorti. `null` si caisse inconnue. */
  apportsCents: number | null; resteCents: number | null;
  /** Sans caisse connue : ce qui a été gagné sur la période (entré − dépensé, matériel à part). */
  gagneCents: number; nombrePieces: number; incertains: string[]; aPrevu: boolean; plusGrosDepassement: LigneSource | null;
}
const prevuParSource = (flux: FluxPrevu[]) => { const m = new Map<SourceCle, number>(); for (const x of flux) m.set(x.source, (m.get(x.source) ?? 0) + Math.abs(x.cents)); return m; };
const periodeAn = (e: EntreeAnalyse, plage: PlageMois, transactions = e.transactions) => periodeSynthese({ transactions, payments: e.payments, mois: decalerMois(plage.du, -12), jusqua: decalerMois(plage.au, -12), aujourdhui: e.aujourdhui, assets: e.assets });
const depenseSource = (p: ReturnType<typeof periodeSynthese>, s: SourceCle) => p.postes.filter(x => sourceDeCategorie(x.categorie) === s).reduce((n, x) => n + x.cents, 0);

export function cascade(e: EntreeAnalyse, plage: PlageMois): Cascade {
  const p = periodeSynthese({ transactions: e.transactions, payments: e.payments, mois: plage.du, jusqua: plage.au, aujourdhui: e.aujourdhui, assets: e.assets });
  const an = periodeAn(e, plage);
  const flux = fluxPrevus(e, `${plage.du}-01`, finDuMois(plage.au)), prevu = prevuParSource(flux);
  const sortieAn = an.lignes > 0;
  const lignes: LigneSource[] = SOURCES_DEPENSE.map(source => {
    const reelCents = depenseSource(p, source), prevuCents = prevu.has(source) ? prevu.get(source)! : null;
    return { source, reelCents, prevuCents, anCents: sortieAn ? depenseSource(an, source) : null, depasseCents: prevuCents !== null && reelCents > prevuCents ? reelCents - prevuCents : 0 };
  }).filter(l => l.reelCents > 0 || l.prevuCents !== null);
  const o = ouverture(e), premiere = premiereDate(e);
  const debutJour = `${plage.du}-01`, plancher = o ? o.date : premiere;
  const du = plancher && plancher > debutJour ? plancher : debutJour;
  const connu = !!o && o.date <= du;
  const fin = [e.aujourdhui, finDuMois(plage.au)].reduce((a, b) => a < b ? a : b);
  const debutCents = connu ? soldeAvant(e, du) : null, finCents = connu ? soldeFinJour(e, fin) : null;
  const apportsCents = debutCents !== null && finCents !== null ? paiementsDe(e).filter(x => x.source === 'prive' && x.date >= du && x.date <= fin).reduce((n, x) => n + x.cents, 0) : null;
  const gros = [...lignes].sort((a, b) => b.depasseCents - a.depasseCents)[0];
  const sorties = lignes.reduce((n, l) => n + l.reelCents, 0);
  return {
    plage, depuis: du > debutJour ? du : null, debutCents, finCents,
    ventesCents: p.entreCents, ventesPrevuCents: prevu.has('ventes') ? prevu.get('ventes')! : null, ventesAnCents: sortieAn ? an.entreCents : null,
    lignes, materielCents: p.materielCents, materielAnCents: sortieAn ? an.materielCents : null,
    autresMouvementsCents: debutCents !== null && finCents !== null ? finCents - (debutCents + p.entreCents - sorties - p.materielCents) : null,
    apportsCents, resteCents: debutCents !== null && finCents !== null ? finCents - (debutCents + p.entreCents - sorties - p.materielCents) - apportsCents! : null,
    gagneCents: p.entreCents - p.depenseCents, nombrePieces: p.lignes, incertains: p.aVerifier.paiementsAConfirmer,
    aPrevu: flux.length > 0, plusGrosDepassement: gros && gros.depasseCents > 0 ? gros : null,
  };
}

/* ---------- Budget : une règle par source ---------- */
export interface RegleBudget { source: SourceCle; reelCents: number; prevuCents: number | null; anCents: number | null; ecartCents: number | null; depasse: boolean }
export interface LigneBrassin { batchId: string; nom: string; mois: string; prevuCents: number | null; reelCents: number | null; ecartCents: number | null; depasse: boolean }
export interface BudgetAnalyse {
  plage: PlageMois; regles: RegleBudget[]; depenseCents: number; /** Dépensé des seules sources qui ont un prévu : celui qu'on compare à `prevuDepenseCents`. */ depenseComparableCents: number; prevuDepenseCents: number | null; moisAuDela: number; moisComptes: number; brassins: LigneBrassin[]; aPrevu: boolean; nombrePieces: number;
}
export function budgetAnalyse(e: EntreeAnalyse, plage: PlageMois): BudgetAnalyse {
  const c = cascade(e, plage);
  const regles: RegleBudget[] = [];
  if (c.ventesCents > 0 || c.ventesPrevuCents !== null) regles.push({ source: 'ventes', reelCents: c.ventesCents, prevuCents: c.ventesPrevuCents, anCents: c.ventesAnCents, ecartCents: c.ventesPrevuCents === null ? null : c.ventesCents - c.ventesPrevuCents, depasse: false });
  for (const l of c.lignes) regles.push({ source: l.source, reelCents: l.reelCents, prevuCents: l.prevuCents, anCents: l.anCents, ecartCents: l.prevuCents === null ? null : l.reelCents - l.prevuCents, depasse: l.depasseCents > 0 });
  const avecPrevu = c.lignes.filter(l => l.prevuCents !== null);
  const prevuDepenseCents = avecPrevu.length ? avecPrevu.reduce((n, l) => n + (l.prevuCents as number), 0) : null;
  // Mois comparés : ceux qui ont un prévu de dépense ; « au-delà » : le dépensé du mois dépasse ce prévu.
  let moisComptes = 0, moisAuDela = 0;
  for (const m of moisEntre(plage.du, plage.au)) {
    const prevuM = prevuParSource(fluxPrevus(e, `${m}-01`, finDuMois(m)).filter(x => x.cents < 0));
    const total = [...prevuM.values()].reduce((n, v) => n + v, 0);
    if (!total) continue;
    moisComptes++;
    const pm = periodeSynthese({ transactions: e.transactions, payments: e.payments, mois: m, aujourdhui: e.aujourdhui, assets: e.assets });
    if ([...prevuM.keys()].reduce((n, s) => n + depenseSource(pm, s), 0) > total) moisAuDela++;
  }
  const planBrew = new Map<string, FinancialPlan>();
  for (const pl of e.plans) { const b = pl.source === 'brew' && (pl.status === 'active' || pl.status === 'completed') ? planBrewBatchId(pl) : undefined; if (b) planBrew.set(b, pl); }
  const brassins: LigneBrassin[] = [];
  for (const b of e.batches ?? []) {
    const date = isoDate((b as { brewDate?: string }).brewDate);
    if (!date || !dansPeriode(date, plage.du, plage.au)) continue;
    const prevuCents = planBrew.get(b.id)?.amountCents ?? null;
    const pieces = e.transactions.filter(t => isActiveTransaction(t) && t.finance?.batchId === b.id && transactionKind(t) === 'expense');
    const reelCents = pieces.length ? pieces.reduce((n, t) => n + transactionAmount(t), 0) : null;
    if (prevuCents === null && reelCents === null) continue;
    const ecartCents = prevuCents !== null && reelCents !== null ? reelCents - prevuCents : null;
    brassins.push({ batchId: b.id, nom: b.name, mois: date.slice(0, 7), prevuCents, reelCents, ecartCents, depasse: ecartCents !== null && ecartCents > 0 });
  }
  return { plage, regles, depenseCents: c.lignes.reduce((n, l) => n + l.reelCents, 0), depenseComparableCents: avecPrevu.reduce((n, l) => n + l.reelCents, 0), prevuDepenseCents, moisAuDela, moisComptes, brassins: brassins.sort((a, b) => a.mois.localeCompare(b.mois) || a.batchId.localeCompare(b.batchId)), aPrevu: c.aPrevu, nombrePieces: c.nombrePieces };
}

/* ---------- Filtrer : les tuiles et la série ---------- */
export interface TuileMois { mois: string; futur: boolean; gainCents: number | null; depenseCents: number; prevuCents: number | null; anGainCents: number | null }
/** Les douze mois de l'année : gagné ou perdu (entré − dépensé), règle du budget (prévu de dépense) au pied, l'an dernier au coin. `null` : rien noté. */
export function tuilesAnnee(e: EntreeAnalyse, annee: string): TuileMois[] {
  const courant = e.aujourdhui.slice(0, 7);
  return moisEntre(`${annee}-01`, `${annee}-12`).map(mois => {
    const futur = mois > courant;
    const p = periodeSynthese({ transactions: e.transactions, payments: e.payments, mois, aujourdhui: e.aujourdhui, assets: e.assets });
    const an = periodeSynthese({ transactions: e.transactions, payments: e.payments, mois: decalerMois(mois, -12), aujourdhui: e.aujourdhui, assets: e.assets });
    const prevu = fluxPrevus(e, `${mois}-01`, finDuMois(mois)).filter(x => x.cents < 0).reduce((n, x) => n - x.cents, 0);
    return { mois, futur, gainCents: futur || p.lignes === 0 ? null : p.gainCents, depenseCents: p.depenseCents, prevuCents: prevu > 0 ? prevu : null, anGainCents: an.lignes === 0 ? null : an.gainCents };
  });
}
export interface Filtre { plage: PlageMois; source?: SourceCle | null; fournisseur?: string | null; brassinId?: string | null }
export interface PointMois { mois: string; cents: number; cumulCents: number; prevuCumulCents: number | null; anCumulCents: number | null }
export interface SerieFiltre {
  points: PointMois[]; totalCents: number; prevuTotalCents: number | null; anTotalCents: number | null; nombrePieces: number;
  plusLourd: { mois: string; cents: number } | null; depasseCents: number | null; txIds: string[];
}
/** Les pièces qui passent le filtre (fournisseur, brassin) ; la source se lit dans la ventilation de `periodeSynthese`. */
export function pieces(e: EntreeAnalyse, f: Filtre): FinanceTransaction[] {
  return e.transactions.filter(t => (!f.fournisseur || transactionVendor(t) === f.fournisseur) && (!f.brassinId || t.finance?.batchId === f.brassinId));
}
export function serieFiltre(e: EntreeAnalyse, f: Filtre): SerieFiltre {
  const tx = pieces(e, f), source = f.source ?? null;
  const valeur = (p: ReturnType<typeof periodeSynthese>) => source === 'ventes' ? p.entreCents : source ? -depenseSource(p, source) : p.entreCents - p.depenseCents;
  let cumul = 0, cumulAn = 0, cumulPrevu = 0, nombre = 0, aPrevu = false, aAn = false;
  const ids = new Set<string>();
  const brut = moisEntre(f.plage.du, f.plage.au).map(mois => {
    const p = periodeSynthese({ transactions: tx, payments: e.payments, mois, aujourdhui: e.aujourdhui, assets: e.assets });
    const an = periodeSynthese({ transactions: tx, payments: e.payments, mois: decalerMois(mois, -12), aujourdhui: e.aujourdhui, assets: e.assets });
    const cents = valeur(p); cumul += cents; nombre += p.lignes;
    if (an.lignes) aAn = true; cumulAn += valeur(an);
    const prevuM = fluxPrevus(e, `${mois}-01`, finDuMois(mois)).filter(x => (!source || x.source === source) && (!f.brassinId || x.batchId === f.brassinId) && (!f.fournisseur || x.vendor === f.fournisseur));
    if (prevuM.length) aPrevu = true;
    cumulPrevu += prevuM.reduce((n, x) => n + x.cents, 0);
    for (const t of tx) if (isActiveTransaction(t) && isoDate(t.date)?.startsWith(mois) && (!source || sourceDeTx(t) === source)) ids.add(t.id);
    return { mois, cents, cumulCents: cumul, prevu: cumulPrevu, an: cumulAn };
  });
  const points: PointMois[] = brut.map(x => ({ mois: x.mois, cents: x.cents, cumulCents: x.cumulCents, prevuCumulCents: aPrevu ? x.prevu : null, anCumulCents: aAn ? x.an : null }));
  const lourds = points.filter(x => x.cents < 0).sort((a, b) => a.cents - b.cents);
  const prevuTotal = aPrevu ? cumulPrevu : null;
  return { points, totalCents: cumul, prevuTotalCents: prevuTotal, anTotalCents: aAn ? cumulAn : null, nombrePieces: nombre, plusLourd: lourds[0] ? { mois: lourds[0].mois, cents: lourds[0].cents } : null,
    depasseCents: prevuTotal !== null && source && source !== 'ventes' && -cumul > -prevuTotal ? -cumul + prevuTotal : null, txIds: [...ids] };
}
const sourceDeTx = (t: FinanceTransaction): SourceCle => transactionKind(t) === 'income' ? 'ventes' : sourceDeCategorie(t.category);
export const fournisseursDe = (e: EntreeAnalyse, plage: PlageMois): string[] =>
  [...new Set(e.transactions.filter(t => isActiveTransaction(t) && isoDate(t.date) && dansPeriode(isoDate(t.date)!, plage.du, plage.au)).map(transactionVendor).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'fr'));

/* ---------- ✦ Pourquoi ? (gabarit sourcé, aucune IA) ---------- */
export interface HorsPrevu { id: string; libelle: string; cents: number; date: string }
export interface Pourquoi { source: SourceCle; depasseCents: number; horsPrevu: HorsPrevu[]; horsPrevuCents: number; nombrePieces: number; brassinsDepasses: LigneBrassin[] }
/** Pourquoi une source dépasse le prévu : ses pièces qui ne se rattachent à aucun plan (les plus grosses d'abord) et ses brassins dépassés. `null` si rien ne dépasse. */
export function pourquoiDepasse(e: EntreeAnalyse, plage: PlageMois): Pourquoi | null {
  const c = cascade(e, plage);
  if (!c.plusGrosDepassement) return null;
  const { source, depasseCents } = c.plusGrosDepassement;
  const pieces = e.transactions.filter(t => isActiveTransaction(t) && transactionKind(t) === 'expense' && isoDate(t.date) && dansPeriode(isoDate(t.date)!, plage.du, plage.au) && sourceDeCategorie(t.category) === source && !estCapital(t.category));
  const hors = pieces.filter(t => !t.finance?.planId).map(t => ({ id: t.id, libelle: t.description || t.id, cents: transactionAmount(t), date: isoDate(t.date)! })).sort((a, b) => b.cents - a.cents || a.id.localeCompare(b.id));
  return { source, depasseCents, horsPrevu: hors.slice(0, 3), horsPrevuCents: hors.reduce((n, x) => n + x.cents, 0), nombrePieces: pieces.length, brassinsDepasses: budgetAnalyse(e, plage).brassins.filter(b => b.depasse) };
}

/* ---------- graduations (Heckbert 1990) ---------- */
const joli = (x: number, arrondi: boolean): number => {
  const exp = Math.floor(Math.log10(x)), f = x / 10 ** exp;
  const n = arrondi ? (f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10) : (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10);
  return n * 10 ** exp;
};
/** Graduations « jolies » (pas 1, 2 ou 5 × 10^k) couvrant [min, max], environ `n` repères. Valeurs entières pour des centimes arrondis par l'appelant. */
export function graduations(min: number, max: number, n = 5): { valeurs: number[]; pas: number; bas: number; haut: number } {
  if (!(max > min)) { const v = min; return { valeurs: [v], pas: 1, bas: v, haut: v }; }
  const pas = joli((max - min) / Math.max(1, n - 1), true);
  const bas = Math.floor(min / pas) * pas, haut = Math.ceil(max / pas) * pas, valeurs: number[] = [];
  for (let v = bas; v <= haut + pas / 2; v += pas) valeurs.push(Math.round(v / pas) * pas);
  return { valeurs, pas, bas, haut };
}

/* ---------- placement d'étiquettes (glouton, rectangles) ---------- */
export interface EtiquetteEntree { id: string; x: number; y: number; w: number; h: number; priorite: number }
export interface Rect { x: number; y: number; w: number; h: number }
export interface EtiquettePlacee extends Rect { id: string; position: 'droite' | 'dessous' | 'gauche' | 'dessus' | 'dessous-droite' | 'dessus-droite' }
const chevauche = (a: Rect, b: Rect, marge = 2) => a.x < b.x + b.w + marge && b.x < a.x + a.w + marge && a.y < b.y + b.h + marge && b.y < a.y + a.h + marge;
/**
 * Pour chaque étiquette (ancre = le point de la marche), six positions (droite, dessous, gauche, dessus, et les deux diagonales à droite), prises dans le cadre ; la
 * première qui ne recouvre ni une étiquette déjà posée ni un obstacle est retenue. Priorité forte d'abord (projet testé, brassin, plus gros montant, date :
 * c'est l'appelant qui la fixe). Au-delà de `max` ou sans place : l'id va dans `reste` (« + N »), jamais de recouvrement.
 */
export function placerEtiquettes(entrees: EtiquetteEntree[], cadre: { w: number; h: number }, obstacles: Rect[] = [], max = 12): { placees: EtiquettePlacee[]; reste: string[] } {
  const placees: EtiquettePlacee[] = [], reste: string[] = [];
  const ordre = [...entrees].sort((a, b) => b.priorite - a.priorite || a.id.localeCompare(b.id));
  const dans = (r: Rect): Rect => ({ ...r, x: Math.min(Math.max(0, r.x), Math.max(0, cadre.w - r.w)), y: Math.min(Math.max(0, r.y), Math.max(0, cadre.h - r.h)) });
  for (const en of ordre) {
    if (placees.length >= max) { reste.push(en.id); continue; }
    const candidats: Array<[EtiquettePlacee['position'], Rect]> = [
      ['droite', { x: en.x + 8, y: en.y - en.h / 2, w: en.w, h: en.h }], ['dessous', { x: en.x - en.w / 2, y: en.y + 8, w: en.w, h: en.h }],
      ['gauche', { x: en.x - en.w - 8, y: en.y - en.h / 2, w: en.w, h: en.h }], ['dessus', { x: en.x - en.w / 2, y: en.y - en.h - 8, w: en.w, h: en.h }],
      ['dessous-droite', { x: en.x + 8, y: en.y + 8, w: en.w, h: en.h }], ['dessus-droite', { x: en.x + 8, y: en.y - en.h - 8, w: en.w, h: en.h }],
    ];
    const choix = candidats.map(([position, r]) => ({ position, r: dans(r) })).find(({ r }) => !placees.some(p => chevauche(p, r)) && !obstacles.some(o => chevauche(o, r)));
    if (choix) placees.push({ id: en.id, position: choix.position, ...choix.r }); else reste.push(en.id);
  }
  return { placees, reste };
}
