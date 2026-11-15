import type { PricingItem } from '../../types';
import { coutFormat } from '../../domain/finance/chaineLitre';
import { formatDepuisTarif, normaliser } from '../vente/formatsVente';

/**
 * Le Prix (c7c) : règles pures. Les nombres viennent du domaine (`chaineLitre.coutFormat`, d1) ; ici on ne fait que lire un prix contre ce coût.
 * Montants en CHF à deux décimales. L'inconnu est `null`, jamais 0. Le reste se soustrait au coût AFFICHÉ (le brasseur soustrait ce qu'il lit).
 */
export type FormatId = '33cl' | '75cl' | 'fut';
/** Nudge de 1e-9 : 2,485 s'arrondit à 2,49 quelle que soit la représentation binaire. */
export const r2 = (n: number) => Math.round(n * 100 + 1e-9) / 100;
const usable = (n: number | null | undefined): n is number => typeof n === 'number' && Number.isFinite(n) && n > 0;

/** « Mince » = moins d'un tiers du prix reste. Exemple de la maquette (« ⅓ ex. »), pas un réglage : le goût du brasseur, à lui de le fixer. */
export const PART_MINCE = 1 / 3;

export type Zone = 'perte' | 'mince' | 'ok' | 'inconnu';
export interface Seuils { perte: number; mince: number }
export const seuilsRegle = (cout: number, partMince = PART_MINCE): Seuils => ({ perte: cout, mince: r2(cout / (1 - partMince)) });
export function zoneDe(prix: number, s: Seuils): Zone {
  if (!Number.isFinite(prix)) return 'inconnu';
  return prix < s.perte ? 'perte' : prix < s.mince ? 'mince' : 'ok';
}

export interface LecturePrix {
  /** `exact` : emballage et impôt connus. Sinon `affiche` est un plancher (liquide + impôt). null : rien à lire. */
  cout: { exact: boolean; affiche: number } | null;
  /** `borne` : le coût n'est qu'un plancher, donc le reste un plafond (« ≤ »). */
  reste: { valeur: number; borne: boolean } | null;
  partPrix: number | null;
  zone: Zone;
}
export function lirePrix(input: { litreLiquide: number | null; volumeL: number; emballageUnite: number | null; impotUnite: number | null; prixHT: number | null }): LecturePrix {
  const { litreLiquide, volumeL, emballageUnite, impotUnite, prixHT } = input;
  const vide: LecturePrix = { cout: null, reste: null, partPrix: null, zone: 'inconnu' };
  if (litreLiquide === null || !usable(volumeL) || impotUnite === null) return vide;
  const c = coutFormat({ litreLiquide, format: { id: 'x', label: 'x', volumeL }, emballageUnite, impotUnite });
  if (!c) return vide;
  const exact = c.total !== null;
  const affiche = r2(c.total !== null ? c.total : c.liquide + impotUnite);
  const cout = { exact, affiche };
  if (!usable(prixHT)) return { cout, reste: null, partPrix: null, zone: 'inconnu' };
  const valeur = r2(prixHT - affiche);
  const partPrix = Math.round(valeur / prixHT * 100);
  const zone: Zone = prixHT < affiche ? 'perte' : exact ? zoneDe(prixHT, seuilsRegle(affiche)) : 'inconnu';
  return { cout, reste: { valeur, borne: !exact }, partPrix, zone };
}

/** Unités vendues par an si tout le volume annuel part dans ce format (⌊⌋). Volume annuel inconnu → null. */
export const unitesParAn = (litresAn: number | null | undefined, volumeL: number): number | null =>
  usable(litresAn) && usable(volumeL) ? Math.floor(litresAn / volumeL + 1e-9) : null;
/** Le reste AFFICHÉ × les unités : le brasseur retrouve le chiffre en multipliant ce qu'il lit (maquette : 2,52 × 3 636 = 9 162,72). */
export const resteAnnuel = (resteAffiche: number, unites: number): number => r2(resteAffiche * unites);

export interface BrassinUnites { n: number; paient: number; pourToi: number; vendu: number; resteBrassin: number; estime: boolean; couvert: boolean }
/** « 41 paient le brassin · 40 pour toi », vendu et reste du brassin dans ce format. `unitesReelles` : le conditionné noté ; sinon déduit des litres nets (estimé). */
export function brassinEnUnites(input: { coutBrassin: number | null; prixHT: number | null; litresNets: number | null; volumeL: number; unitesReelles?: number | null }): BrassinUnites | null {
  const { coutBrassin, prixHT, litresNets, volumeL, unitesReelles } = input;
  if (!usable(coutBrassin) || !usable(prixHT) || !usable(volumeL)) return null;
  const n = usable(unitesReelles) ? Math.floor(unitesReelles) : usable(litresNets) ? Math.floor(litresNets / volumeL + 1e-9) : null;
  if (n === null || n < 1) return null;
  const paient = Math.ceil(Math.round(coutBrassin * 100) / Math.round(prixHT * 100));
  const vendu = r2(n * prixHT);
  return { n, paient: Math.min(paient, n), pourToi: Math.max(0, n - paient), vendu, resteBrassin: r2(vendu - coutBrassin), estime: !usable(unitesReelles), couvert: paient <= n };
}

/** Le format d'un tarif : le champ, sinon le libellé (comportement de la caisse), sinon null (« à compléter »). */
export const formatDuTarif = (t: PricingItem): FormatId | null => t.format?.id ?? formatDepuisTarif(t.product);

/** Copie de `biereDuTarif` de formatsVente.ts (privée, uv) : la bière d'un ancien tarif sans champ `biere`. À exporter par uv. */
const biereLegacy = (product: string): string => normaliser(product).replace(/\b33\s*cl\b|\b75\s*cl\b|\bfut\b(\s*\d+\s*l\b)?|\b(bouteilles?|canettes?|cartons?|futs?)\b/g, '').replace(/\s+/g, ' ').trim();

export type TarifDuFormat =
  | { kind: 'un'; tarif: PricingItem; aCompleter: boolean }
  | { kind: 'sans-prix'; tarif: PricingItem; aCompleter: boolean }
  | { kind: 'aucun' }
  | { kind: 'plusieurs'; tarifs: PricingItem[] };
/** Aucun, un, plusieurs ou sans prix : quatre états distincts (la caisse n'en a qu'un, `null`). `aCompleter` : un ancien tarif sans bière ni format écrits. */
export function tarifsDuFormat(tarifs: PricingItem[], formatId: FormatId, biere: string | undefined): TarifDuFormat & { aCompleter?: boolean } {
  const b = normaliser(biere ?? '');
  const candidats = tarifs.filter(t => formatDuTarif(t) === formatId).filter(t => {
    const part = t.biere !== undefined ? normaliser(t.biere) : biereLegacy(t.product);
    return !part || !b || b.includes(part) || part.includes(b);
  });
  if (candidats.length === 0) return { kind: 'aucun' };
  if (candidats.length > 1) return { kind: 'plusieurs', tarifs: candidats };
  const tarif = candidats[0];
  const aCompleter = !tarif.format || tarif.biere === undefined;
  return { kind: usable(tarif.priceHT) ? 'un' : 'sans-prix', tarif, aCompleter };
}
