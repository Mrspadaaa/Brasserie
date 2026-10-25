import { SCALE_PARAMETERS, type FamilyScale, type Range } from './scale';

/** Une estimation par famille : plage (null = inconnu, jamais 0) et repère central facultatif. */
export interface EstimateLike { range: Range | null; central?: number }

export type ValueVerdict = 'au style' | 'peu' | 'trop' | 'hors style' | 'incertain' | 'inconnu' | 'sans bande';

/** Position sur la piste zoomée (0 = bord gauche du domaine, 1 = bord droit). */
export function trackPosition(value: number, scale: FamilyScale): { x: number; clipped: 'below' | 'above' | null } {
  const [d0, d1] = scale.domain;
  const x = (value - d0) / (d1 - d0);
  return { x: Math.max(0, Math.min(1, x)), clipped: x < 0 ? 'below' : x > 1 ? 'above' : null };
}
/** Part de la piste occupée par un écart absolu (points 0–100). */
export const trackShare = (gap: number, scale: FamilyScale) => gap / (scale.domain[1] - scale.domain[0]);

function classify(lo: number, hi: number, scale: FamilyScale): ValueVerdict {
  const [b0, b1] = scale.band!;
  if (lo >= b0 && hi <= b1) return 'au style';
  if (hi < b0) return 'peu';
  if (lo > b1) return scale.status === 'indésirable' ? 'hors style' : 'trop';
  return 'incertain';
}

/** Verdict d'une estimation face au style. La plage décide ; le repère central est rendu à part,
 * étiqueté, pour qu'une plage incertaine ne devienne pas un point certain. */
export function valueVerdict(e: EstimateLike, scale: FamilyScale): { verdict: ValueVerdict; byCentral: ValueVerdict | null } {
  if (!e.range) return { verdict: 'inconnu', byCentral: null };
  if (!scale.band) return { verdict: 'sans bande', byCentral: null };
  const verdict = classify(e.range.min, e.range.max, scale);
  const byCentral = e.central === undefined ? null : classify(e.central, e.central, scale);
  return { verdict, byCentral };
}

export interface GapVerdict {
  verdict: '≈' | 'écart' | 'inconnu';
  why: 'donnée absente' | 'plages recouvrantes' | 'sous le seuil' | 'au-delà du seuil';
  /** Écart retenu en points : séparation des plages si elles sont disjointes, sinon écart des repères centraux. */
  gap: number | null;
  /** Écart en largeurs de bande du style (unité du style). */
  gapInBands: number | null;
  /** Part de la piste zoomée qu'occupe l'écart. */
  share: number | null;
  /** Recouvrement des deux plages rapporté à la plus étroite (0–1). */
  overlap: number | null;
  higher: 'a' | 'b' | null;
  threshold: number;
}

/** Écart entre deux estimations sur la piste d'un style. Le recouvrement des plages passe
 * avant le zoom : deux plages qui se recouvrent assez donnent « ≈ », même si la piste les sépare. */
export function gapVerdict(a: EstimateLike, b: EstimateLike, scale: FamilyScale): GapVerdict {
  const base = { threshold: scale.threshold };
  if (!a.range || !b.range) return { ...base, verdict: 'inconnu', why: 'donnée absente', gap: null, gapInBands: null, share: null, overlap: null, higher: null };
  const wa = a.range.max - a.range.min, wb = b.range.max - b.range.min;
  const inter = Math.min(a.range.max, b.range.max) - Math.max(a.range.min, b.range.min);
  const narrow = Math.min(wa, wb);
  // Deux points identiques se recouvrent entièrement ; un point dans une plage aussi.
  const overlap = inter < 0 ? 0 : narrow > 0 ? inter / narrow : 1;
  const separation = Math.max(0, a.range.min - b.range.max, b.range.min - a.range.max);
  const result = (gap: number, verdict: GapVerdict['verdict'], why: GapVerdict['why']): GapVerdict => ({
    ...base, verdict, why, gap, gapInBands: gap / scale.width, share: gap / (scale.domain[1] - scale.domain[0]), overlap,
    higher: gap === 0 ? null : (a.central ?? a.range!.min) > (b.central ?? b.range!.min) ? 'a' : 'b',
  });
  if (overlap >= SCALE_PARAMETERS.overlapIndiscernable) {
    const g = a.central !== undefined && b.central !== undefined ? Math.abs(a.central - b.central) : 0;
    return result(g, '≈', 'plages recouvrantes');
  }
  const gap = separation > 0 ? separation : a.central !== undefined && b.central !== undefined ? Math.abs(a.central - b.central) : 0;
  return gap < scale.threshold ? result(gap, '≈', 'sous le seuil') : result(gap, 'écart', 'au-delà du seuil');
}
