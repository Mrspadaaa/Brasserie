import type { Batch, PricingItem, Transaction, KegItem } from '../../types';
import { StorageService } from '../../services/storage';
import { FinanceService } from '../../services/financeService';
import type { BrewBudgetSnapshot } from '../../domain/finance/brewBudget';
import { coutLitre, troisNotions, type CoutLitre, type TroisNotions } from '../../domain/finance/chaineLitre';
import { isoDate } from '../../domain/finance/ledger';
import { baseImpot } from '../production/ImpotBiereSheet';
import { decoderLigneVente } from '../vente/ligneVente';
import { formatsDuBrassin, FORMATS_VENTE, type FormatDuBrassin } from '../vente/formatsVente';
import type { FormatId } from './calculPrix';

/**
 * Ce que l'écran Prix lit, assemblé une fois (aucune règle ici : `chaineLitre`, `baseImpot` et `calculPrix` font les calculs).
 * La bière est le nom de la RECETTE, pas celui d'un lot (« Pale Ale de septembre » et « Pale Ale d'octobre » sont une seule bière).
 */
export const biereDuBrassin = (b: Batch): string => (b.recipeSnapshot?.name ?? '').trim() || (b.style ?? '').trim() || b.name;

const dateDe = (b: Batch) => isoDate(b.bottlingDate || b.brewDate || b.plannedBrewDate) ?? '';
/** Les brassins, le plus récent d'abord (sans date : à la fin). */
export const recentsDabord = (batches: Batch[]): Batch[] => [...batches].filter(b => !b.archivedAt && b.status !== 'annule').sort((a, b) => dateDe(b).localeCompare(dateDe(a)));
/** Les bières connues : une par nom de recette, dans l'ordre du brassin le plus récent. */
export const bieresDe = (batches: Batch[]): string[] => [...new Set(recentsDabord(batches).map(biereDuBrassin))];

export interface Chiffrage {
  batch: Batch;
  /** null tant que le coût du litre n'est pas complet (prix manquant, litres nets inconnus…). */
  litre: CoutLitre | null;
  notions: TroisNotions | null;
  litres: number | null;
  base: ReturnType<typeof baseImpot>;
  plato: number | null;
}
type Plans = ReadonlyArray<{ createdAt?: string; brewEstimate?: unknown }>;
export function chiffrer(batch: Batch, plans: Plans, fiscal: { beerTaxAnnualReductionPct?: number; beerTaxReductionYear?: number; beerTaxPeriod?: string }): Chiffrage {
  const dernier = plans.filter(p => (p.brewEstimate as BrewBudgetSnapshot | undefined)?.batchId === batch.id)
    .sort((a, b) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? '')))[0];
  const snapshot = dernier?.brewEstimate as BrewBudgetSnapshot | undefined;
  const base = baseImpot(batch, { plans: plans as never, fiscal: fiscal as never });
  const notions = snapshot ? troisNotions(snapshot) : null;
  const litres = base.litres?.litres ?? null;
  const plato = base.densite === 'notee' ? base.lu.plato : base.visee;
  return { batch, litre: coutLitre({ notions, litres }), notions, litres, base, plato };
}
/** Le brassin qui chiffre une bière : celui d'où l'on vient, sinon le plus récent déjà chiffré, sinon le plus récent (« ? »). */
export function brassinDuCout(batches: Batch[], plans: Plans, fiscal: Parameters<typeof chiffrer>[2], biere: string | undefined, batchId?: string): Chiffrage | null {
  if (batchId) { const b = batches.find(x => x.id === batchId); return b ? chiffrer(b, plans, fiscal) : null; }
  const lots = recentsDabord(batches).filter(b => !biere || biereDuBrassin(b) === biere);
  const chiffres = lots.map(b => chiffrer(b, plans, fiscal));
  return chiffres.find(c => c.litre !== null) ?? chiffres[0] ?? null;
}

/** Impôt d'UNE unité : la même règle que la feuille p2b (réduction confirmée de l'année, sinon taux plein). null si le °P est inconnu. */
export const impotUnite = (c: Chiffrage | null, volumeL: number): number | null =>
  c && c.plato !== null ? c.base.calcul(c.plato, volumeL).montant : null;

/** Les trois formats d'un brassin (le fût prend la capacité réelle) ; sans brassin, les formats de la caisse. */
export const formatsDe = (batch: Batch | undefined, kegs: KegItem[]): FormatDuBrassin[] =>
  batch ? formatsDuBrassin(batch, kegs) : FORMATS_VENTE.map(format => ({ format, present: true, aVerifier: false }));

/**
 * Les prix de vente réellement pratiqués pour un format (lignes `vente:` de la caisse) : les crans de la règle. Jamais un prix d'exemple.
 * Base HT ou TTC : celle de la ligne ; un assujetti ne les voit pas (la base serait ambiguë) : aucun cran plutôt qu'un faux.
 */
export function prixReels(transactions: Transaction[], formatId: FormatId, exclure: number | null, assujetti: boolean): number[] {
  if (assujetti) return [];
  const vus: number[] = [];
  const ordre = [...transactions].sort((a, b) => String(b.date).localeCompare(String(a.date)));
  for (const t of ordre) {
    if (t.finance?.kind !== 'income' || t.finance.voidedAt) continue;
    for (const l of t.finance.lines) {
      const lue = decoderLigneVente(l.sourceReference);
      if (!lue || lue.formatId !== formatId || !(Number(l.quantity) > 0) || !Number.isFinite(l.amountCents)) continue;
      const p = Math.round(l.amountCents / Number(l.quantity)) / 100;
      if (p > 0 && p !== exclure && !vus.includes(p)) vus.push(p);
      if (vus.length >= 2) return vus.sort((x, y) => x - y);
    }
  }
  return vus.sort((x, y) => x - y);
}

export interface DonneesPrix {
  tarifs: PricingItem[]; batches: Batch[]; kegs: KegItem[]; transactions: Transaction[];
  plans: ReturnType<typeof FinanceService.snapshot>['plans']; profile: ReturnType<typeof FinanceService.snapshot>['profile'];
  fiscal: ReturnType<typeof StorageService.getConfig>['fiscal'];
}
export function lireDonneesPrix(): DonneesPrix {
  const f = FinanceService.snapshot();
  return { tarifs: StorageService.getTarifs(), batches: StorageService.getBatches(), kegs: StorageService.getStocks()?.kegs ?? [], transactions: StorageService.getTransactions(), plans: f.plans, profile: f.profile, fiscal: StorageService.getConfig().fiscal };
}
