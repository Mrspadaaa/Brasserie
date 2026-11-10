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

/** Où se saisit une donnée manquante : la fiche du brassin (Mesures), le coût du brassin, le tarif d'un format, le profil financier. */
export type CibleManque = 'fiche' | 'cout' | 'tarif' | 'profil';
export interface ManquePrix {
  cle: string;
  cible: CibleManque;
  /** Ce qui manque, nommé (avec le brassin ou le format). */
  titre: string;
  /** Son effet, en une ligne. */
  effet: string;
  /** Pour la cible « tarif » : le format du tarif à créer (prix absent) ; sans lui, le tarif existant du format. */
  formatId?: FormatId;
  tarifExistant?: boolean;
}
export interface FormatManque { id: FormatId; label: string; present: boolean; prixConnu: boolean; emballageManque: boolean; tarifExiste: boolean }
const uniteDe = (id: FormatId) => (id === 'fut' ? 'fût' : 'bouteille');
const deUnite = (id: FormatId) => (id === 'fut' ? 'du fût' : 'de la bouteille');
const nomsCourts = (noms: string[]) => (noms.length <= 3 ? noms.join(', ') : `${noms.slice(0, 3).join(', ')} et ${noms.length - 3} autre${noms.length - 3 > 1 ? 's' : ''}`);

/**
 * Les données qui manquent pour savoir « ce qu'il te reste », dans l'ordre du calcul (litres → coût du brassin → densité → prix → emballage → volume annuel).
 * Rien n'est inventé : chaque ligne vient d'un trou réel (`notions.manque`, litres nuls, °P inconnu, tarif absent) ; un inconnu n'est jamais compté 0.
 */
export function manquesPrix(input: { chiffrage: Chiffrage | null; formats: FormatManque[]; volumeAnnuelManque: boolean }): ManquePrix[] {
  const { chiffrage: c, formats, volumeAnnuelManque } = input;
  const m: ManquePrix[] = [];
  if (c) {
    const nom = c.batch.name;
    const nomsManque = c.notions?.manque ?? [];
    const ingredients = nomsManque.filter(n => n !== 'litres nets');
    if (c.litres === null || nomsManque.includes('litres nets')) {
      const fait = c.batch.status !== 'planifie';
      m.push({ cle: 'litres', cible: 'fiche', titre: `Litres conditionnés de « ${nom} »`,
        effet: fait ? 'Sans eux, pas de coût du litre.' : 'Brassin pas encore fait : les litres se notent après la mise en bouteille.' });
    }
    if (!c.notions) m.push({ cle: 'cout', cible: 'cout', titre: `Coût du brassin « ${nom} »`, effet: 'Pas encore chiffré : sans lui, pas de coût du litre.' });
    else if (ingredients.length) m.push({ cle: 'ingredients', cible: 'cout', titre: `Prix de ${ingredients.length} ingrédient${ingredients.length > 1 ? 's' : ''} : ${nomsCourts(ingredients)}`,
      effet: `Sans ${ingredients.length > 1 ? 'eux' : 'lui'}, le coût du brassin reste incomplet.` });
    else if (!c.notions.complet && !nomsManque.length) m.push({ cle: 'cout', cible: 'cout', titre: `Coût du brassin « ${nom} » à compléter`, effet: 'Une ligne du coût est encore ouverte : sans elle, pas de coût du litre.' });
    if (c.plato === null) m.push({ cle: 'densite', cible: 'fiche', titre: `Densité de « ${nom} »`, effet: 'Sans elle, l’impôt bière de chaque unité reste inconnu : le reste est un maximum.' });
  }
  for (const f of formats) {
    if (f.prixConnu) continue;
    m.push({ cle: `prix-${f.id}`, cible: 'tarif', formatId: f.id, tarifExistant: f.tarifExiste, titre: `Prix du ${f.label}`,
      effet: `Sans prix, pas de reste par ${uniteDe(f.id)}${f.present ? '.' : ' (ce brassin n’en a pas : seulement si tu en vends).'}` });
  }
  for (const f of formats) {
    if (!f.prixConnu || !f.emballageManque) continue;
    m.push({ cle: `emballage-${f.id}`, cible: 'tarif', formatId: f.id, tarifExistant: true, titre: `Emballage du ${f.label}`,
      effet: `Sans lui, le coût ${deUnite(f.id)} est un minimum et le reste un maximum.` });
  }
  if (volumeAnnuelManque) m.push({ cle: 'volume-annuel', cible: 'profil', titre: 'Volume annuel',
    effet: 'Sans lui, pas de reste par an. Se note dans « Paramètres des prévisions et des brassins ».' });
  return m;
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
