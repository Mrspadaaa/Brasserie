/**
 * L'échelle de la frise des prix (kxc, 15.11) : prix de vente en CHF le litre, sur un axe logarithmique.
 *
 * Problème d'école : une échelle logarithmique continue (d3 `scaleLog`), x = x0 + (ln v − ln lo) / (ln hi − ln lo) · (x1 − x0).
 * Le log donne la même place à un même écart en % : 140 → 142 CHF le fût (+1,4 %) et 3,40 → 3,50 la bouteille (+2,9 %) se lisent
 * à la même mesure, quel que soit le format. Les graduations suivent la série 1 · 1,2 · 1,5 · 2 · 2,5 · 3 · 4 · 5 · 6 · 7 · 8 (× 10ⁿ),
 * gardées de gauche à droite tant qu'elles ne se touchent pas : sur 4,5 – 23, cela rend exactement celles de kxc (5 · 6 · 7 · 8 · 10 · 12 · 15 · 20).
 *
 * Deux domaines, comparés à la mesure (RESULTAT de la voie port-kxc) :
 * - `domaineKxc` : celui de la maquette, 4,5 à 23 CHF le litre, élargi seulement si un prix réel en sort (jamais un point hors du cadre) ;
 * - `domaineReel` : la plage réelle des prix (min et max réels), une petite marge de part et d'autre.
 * Pur : aucun accès aux données ni au DOM.
 */

/** Le domaine de la maquette kxc, en CHF le litre. */
export const KXC_DOMAINE: readonly [number, number] = [4.5, 23];
/** Les graduations de la maquette kxc. */
export const KXC_GRADUATIONS: readonly number[] = [5, 6, 7, 8, 10, 12, 15, 20];
/** Écart minimal entre deux graduations, en px (le chiffre de 12 px garde son air). */
export const ECART_GRADUATIONS_PX = 20;
/** Marge de `domaineReel`, en part du log de la plage (4 % de chaque côté). */
export const MARGE_REELLE = 0.04;

const MANTISSES = [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 7, 8];
const positifs = (valeurs: readonly (number | null | undefined)[]): number[] =>
  valeurs.filter((v): v is number => typeof v === 'number' && Number.isFinite(v) && v > 0);

export interface EchelleLog {
  lo: number;
  hi: number;
  /** Bornes du tracé, en px. */
  x0: number;
  x1: number;
  /** CHF le litre → px. */
  x: (v: number) => number;
  graduations: number[];
}

/** L'échelle log de [lo, hi] sur [x0, x1]. lo et hi doivent être > 0 et distincts. */
export function echelleLog(lo: number, hi: number, x0: number, x1: number): EchelleLog {
  if (!(lo > 0) || !(hi > lo)) throw new Error(`Domaine log invalide : ${lo} – ${hi}`);
  const k = (x1 - x0) / Math.log(hi / lo);
  const x = (v: number) => x0 + Math.log(v / lo) * k;
  return { lo, hi, x0, x1, x, graduations: graduationsLog(lo, hi, x) };
}

/** Les graduations de la série 1-1,2-1,5-2-2,5-3-4-5-6-7-8, de gauche à droite, à `ecartMin` px au moins l'une de l'autre. */
export function graduationsLog(lo: number, hi: number, x: (v: number) => number, ecartMin = ECART_GRADUATIONS_PX): number[] {
  const out: number[] = [];
  for (let e = Math.floor(Math.log10(lo)); e <= Math.ceil(Math.log10(hi)); e++) {
    for (const m of MANTISSES) {
      const v = Number((m * 10 ** e).toPrecision(6));
      if (v < lo || v > hi) continue;
      if (out.length && x(v) - x(out[out.length - 1]) < ecartMin) continue;
      out.push(v);
    }
  }
  if (out.length >= 2) return out;
  // Plage étroite (moins d'une marche de la série) : pas linéaire 1 · 2 · 5 × 10ⁿ, environ quatre graduations.
  const brut = (hi - lo) / 4, p = 10 ** Math.floor(Math.log10(brut)), m = brut / p;
  const pas = (m < 1.5 ? 1 : m < 3 ? 2 : m < 7 ? 5 : 10) * p;
  const fin: number[] = [];
  for (let i = Math.ceil(lo / pas - 1e-9); i * pas <= hi + 1e-9; i++) {
    const v = Number((i * pas).toPrecision(6));
    if (fin.length && x(v) - x(fin[fin.length - 1]) < ecartMin) continue;
    fin.push(v);
  }
  return fin.length > out.length ? fin : out;
}

/** Le domaine de kxc (4,5 à 23), élargi d'une marge si un prix en sort. */
export function domaineKxc(valeurs: readonly (number | null | undefined)[]): [number, number] {
  const v = positifs(valeurs);
  let [lo, hi] = KXC_DOMAINE;
  if (!v.length) return [lo, hi];
  const min = Math.min(...v), max = Math.max(...v);
  const marge = Math.log(hi / lo) * MARGE_REELLE;
  if (min < lo) lo = min / Math.exp(marge);
  if (max > hi) hi = max * Math.exp(marge);
  return [lo, hi];
}

/** La plage réelle des prix, avec une petite marge en log ; un seul prix : ±10 %. */
export function domaineReel(valeurs: readonly (number | null | undefined)[], marge = MARGE_REELLE): [number, number] {
  const v = positifs(valeurs);
  if (!v.length) return [...KXC_DOMAINE] as [number, number];
  const min = Math.min(...v), max = Math.max(...v);
  if (max / min < 1.2) return [min / 1.1, max * 1.1];
  const m = Math.log(max / min) * marge;
  return [min / Math.exp(m), max * Math.exp(m)];
}

/** L'écart en px entre deux prix au litre sur une échelle. */
export const ecartPx = (e: Pick<EchelleLog, 'x'>, a: number, b: number): number => Math.abs(e.x(b) - e.x(a));
