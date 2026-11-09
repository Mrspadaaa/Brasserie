import type { Batch } from '../../types';
import { isoDate } from './ledger';
import { gravityProblem, plausibleAbv } from '../gravityBounds';
import { platoFromSg } from '../alcohol';

export const BEER_TAX_SOURCE = 'https://www.bazg.admin.ch/dam/fr/sd-web/Ls9uMLNtgql4/Imp%C3%B4t%20sur%20la%20bi%C3%A8re%20directives%20brasseries%20indig%C3%A8nes.pdf';
/**
 * Le barème, une seule fois. Source : OFDF, « Impôt sur la bière, directives à l'intention des brasseries indigènes » (avril 2022, lien ci-dessus),
 * qui cite la loi sur l'imposition de la bière (LIB, RS 641.411) : bière légère jusqu'à 10 °P ; normale ou spéciale de 10,1 à 14,0 °P ; forte dès 14,1 °P.
 * Tarif en CHF par hectolitre. Le réglage `beerTaxFullRatePerHl` reste stocké mais n'est jamais lu ici.
 */
export const BAREME_IMPOT_BIERE = [
  { jusquaPlato: 10, chfParHl: 16.88 },
  { jusquaPlato: 14, chfParHl: 25.32 },
  { jusquaPlato: Infinity, chfParHl: 33.76 }
] as const;
/** Taux de la bière normale : seul usage, l'affichage quand il n'y a aucun brassin. */
export const TAUX_NORMAL_PAR_HL: number = BAREME_IMPOT_BIERE[1].chfParHl;
const TAUX_MIN: number = BAREME_IMPOT_BIERE[0].chfParHl;
const TAUX_MAX: number = BAREME_IMPOT_BIERE[2].chfParHl;

export function beerTaxBracket(plato: number): number {
  return (BAREME_IMPOT_BIERE.find(tranche => plato <= tranche.jusquaPlato) ?? BAREME_IMPOT_BIERE[2]).chfParHl;
}

const toNumber = (value: unknown): number => value == null || value === '' ? Number.NaN : Number(String(value).replace(',', '.'));
const validReduction = (pct: unknown): number => typeof pct === 'number' && Number.isFinite(pct) && pct >= 0 && pct <= 40 ? pct : 0;

export interface BeerTaxInput {
  /** Densité initiale (« 1.048 » ou 1,048). Ignorée si `plato` est donné. */
  og?: string | number | null;
  plato?: number | null;
  /** Litres sur lesquels l'impôt est dû : la sortie de cave (la loi), à défaut un indicateur. */
  litres: number;
  /** Réduction petit brasseur confirmée pour l'année (0 à 40). Absente : taux plein. */
  reductionPct?: number;
  /** Alcool en % vol. : 0,5 ou moins est exonéré. */
  abv?: string | number | null;
}
export interface BeerTaxResult {
  /** °Plato retenu (arrondi au dixième) ; null si la densité manque ou est absurde. */
  plato: number | null;
  chfParHl: number | null;
  /** CHF exacts (jamais arrondis ici) ; null quand le °P ou les litres sont inconnus. 0 si exonéré. */
  montant: number | null;
  /** Sans la réduction. Plein, au tarif le plus haut quand le °P est inconnu. */
  montantPlein: number | null;
  /** Fourchette quand le °P est inconnu ; égale à `montant` sinon. */
  montantMin: number | null;
  montantMax: number | null;
  exonere: boolean;
  reductionPct: number;
}

/** Impôt d'un volume de bière : l'unique calcul (brassin, budget, année). L'inconnu reste null, jamais 0 ni un taux par défaut. */
export function beerTaxForVolume(input: BeerTaxInput): BeerTaxResult {
  const reductionPct = validReduction(input.reductionPct);
  const multiplier = 1 - reductionPct / 100;
  const sg = toNumber(input.og);
  const ogEntered = Number.isFinite(sg) && sg > 0;
  // Une OG hors 1,020–1,130 est une saisie à vérifier : elle n'ouvre ni l'exonération « sans alcool » ni un palier Plato.
  const ogPlausible = gravityProblem('og', sg) === null;
  const abv = toNumber(input.abv);
  const exonere = Number.isFinite(abv) && plausibleAbv(abv) && abv <= 0.5 && (!ogEntered || ogPlausible);
  const given = input.plato;
  const plato = typeof given === 'number' && Number.isFinite(given) && given >= 0 ? given : ogPlausible ? Math.round(platoFromSg(sg) * 10) / 10 : null;
  const chfParHl = plato == null ? null : beerTaxBracket(plato);
  if (exonere) return { plato, chfParHl, montant: 0, montantPlein: 0, montantMin: 0, montantMax: 0, exonere, reductionPct };
  if (!(input.litres > 0) || !Number.isFinite(input.litres)) return { plato, chfParHl, montant: null, montantPlein: null, montantMin: null, montantMax: null, exonere, reductionPct };
  const hl = input.litres / 100;
  const min = hl * (chfParHl ?? TAUX_MIN) * multiplier, max = hl * (chfParHl ?? TAUX_MAX) * multiplier;
  return { plato, chfParHl, montant: chfParHl == null ? null : max, montantPlein: hl * (chfParHl ?? TAUX_MAX), montantMin: min, montantMax: max, exonere, reductionPct };
}

/** Impôt d'une unité vendue (33 cl, 75 cl, fût), exact : à arrondir à l'affichage, jamais à resommer pour retrouver l'impôt du brassin. */
export function beerTaxPerFormat(input: { plato: number | null | undefined; volumeL: number; reductionPct?: number }): number | null {
  if (typeof input.plato !== 'number' || !Number.isFinite(input.plato) || !(input.volumeL > 0)) return null;
  return beerTaxForVolume({ plato: input.plato, litres: input.volumeL, reductionPct: input.reductionPct }).montant;
}

const DEFAULT_WARNING = 'Réserve indicative sur la bière conditionnée. Les sorties et consommations sur place déterminent l’impôt dû ; elles ne sont pas encore suivies dans ce calcul.';
const SORTIS_WARNING = 'Impôt calculé sur les litres sortis de cave enregistrés pour chaque brassin ; un brassin sans sortie enregistrée garde son volume conditionné comme indicateur.';

/** Packaged beer is a planning proxy only, unless `litresSortis` gives the litres that actually left the brewery (the legal base). */
export function estimateSwissBeerTax(batches: Batch[], options?: {
  annualReductionPct?: number; reductionYear?: number; year?: number; selectedMonthYear?: string;
  /** Litres sortis de cave par brassin (id) : l'assiette de la loi. Remplace le volume conditionné pour ce brassin. */
  litresSortis?: Record<string, number>;
  /** Legacy options are accepted for compatibility, but never mistaken for the official tariff. */
  ratePerHl?: number; maxSmallBrewerHl?: number; reliefTiersHl?: Array<{ upToHl: number; reductionPct: number }>;
}) {
  const year = options?.year ?? new Date().getFullYear();
  const confirmed = Number.isFinite(options?.annualReductionPct) && options!.annualReductionPct! >= 0 && options!.annualReductionPct! <= 40 && options?.reductionYear === year;
  const reductionPct = confirmed ? options!.annualReductionPct! : 0;
  const sortis = options?.litresSortis;
  const litresOf = (batch: Batch): number => { const out = Number(sortis?.[batch.id]); return out > 0 ? out : Number(batch.volumePackagedL); };
  const eligible = batches.filter(batch => {
    if (batch.status === 'annule' || !(litresOf(batch) > 0)) return false;
    const date = isoDate(batch.bottlingDate || batch.brewDate);
    if (options?.year && (!date || Number(date.slice(0, 4)) !== options.year)) return false;
    return !options?.selectedMonthYear || !!date && `${date.slice(5, 7)}.${date.slice(0, 4)}` === options.selectedMonthYear;
  });
  let totalVolumeL = 0, low = 0, high = 0, full = 0, missingPlatoCount = 0;
  for (const batch of eligible) {
    const volume = litresOf(batch);
    totalVolumeL += volume;
    const tax = beerTaxForVolume({ og: batch.og, abv: batch.abv, litres: volume, reductionPct });
    if (tax.exonere) continue;
    if (tax.plato == null) missingPlatoCount++;
    low += tax.montantMin!; high += tax.montantMax!; full += tax.montantPlein!;
  }
  totalVolumeL = Math.round(totalVolumeL * 100) / 100;
  const round = (n: number) => Math.round(n * 100) / 100;
  const multiplier = 1 - reductionPct / 100;
  return { totalVolumeL, totalHectoliters: totalVolumeL / 100, ratePerHl: totalVolumeL ? round(high * 100 / totalVolumeL) : TAUX_NORMAL_PAR_HL * multiplier,
    fullRatePerHl: totalVolumeL ? round(full * 100 / totalVolumeL) : TAUX_NORMAL_PAR_HL, reductionPct, reductionConfirmed: confirmed,
    taxDueCHF: round(high), estimateLowCHF: round(low), estimateHighCHF: round(high), missingPlatoCount,
    batchesCount: eligible.length, isSmallBrewerRate: confirmed && reductionPct > 0, estimateOnly: true as const,
    warning: sortis && Object.keys(sortis).length ? SORTIS_WARNING : DEFAULT_WARNING };
}
