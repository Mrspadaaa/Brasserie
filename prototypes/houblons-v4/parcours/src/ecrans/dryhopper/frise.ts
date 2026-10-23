// La frise de Dryhopper, calculée en direct : chaque cran (ébullition par 5′, whirlpool, dry hop actif et après,
// en jours) passe par l'adaptateur du moteur (simulerMoment → simulerCas), sans grille précalculée.
// - L'IBU est calculée à chaque minute (BrewingMath.hopIbu) ; à cru, elle n'est pas modélisée : null, jamais 0.
// - L'arôme n'est simulé qu'à 60′, 10′, au whirlpool et en dry hop. Entre deux crans simulés, il est INTERPOLÉ
//   (marqué « ≈ ») entre ses deux voisins calculés, comme y1b et a1 ; l'IBU, elle, reste calculée.
// Place future dans l'app : src/ui/hops/hopTiming.ts (le calcul de la frise ira dans un Web Worker, ARCHITECTURE.md).
import { FAMILIES } from '../../commun';
import { cransFrise, simulerMoment, type FamilleLue, type ProfilLu } from '../../moteur';
import type { AjoutParcours, Quand, RecetteParcours } from '../../etat/types';
import type { FamilyId } from '../../../../src/engine';

/** Étape du brassin : 0 ébullition, 1 whirlpool, 2 dry hop actif, 3 dry hop après fermentation. */
export type Seg = 0 | 1 | 2 | 3;
export interface Point {
  k: number;
  q: Quand;
  seg: Seg;
  /** Libellé complet (« 20′ », « whirlpool », « actif · 2 j ») et court, pour la loupe (« 20′ », « WP », « 2 j »). */
  lib: string;
  court: string;
  /** IBU de l'ajout seul (null à cru : non modélisée) et de la bière avec l'ajout (à cru : sans sa part). */
  ibuAjout: number | null;
  ibu: number;
  cru: boolean;
  /** La bière avec l'ajout à ce cran, famille par famille, et l'écart au style face à ma bière (null : inconnu). */
  profil: ProfilLu;
  ecart: Record<FamilyId, number | null>;
  /** Arôme interpolé entre deux crans simulés (≈). */
  interp: boolean;
}

export const segDe = (q: Quand): Seg => (q.type === 'ebullition' || q.type === 'premierMout' ? 0 : q.type === 'whirlpool' ? 1 : q.phase === 'actif' ? 2 : 3);
export const libMoment = (q: Quand) =>
  q.type === 'ebullition' ? `${q.minutes}′` : q.type === 'whirlpool' ? 'whirlpool' : q.type === 'premierMout' ? 'premier moût' : `${q.phase === 'actif' ? 'actif' : 'après'} · ${q.jours} j`;
export const courtMoment = (q: Quand) =>
  q.type === 'ebullition' ? `${q.minutes}′` : q.type === 'whirlpool' ? 'WP' : q.type === 'premierMout' ? 'PM' : `${q.jours} j`;
export const memeQuand = (a: Quand, b: Quand) => JSON.stringify(a) === JSON.stringify(b);

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const fam = <T>(fn: (f: FamilyId) => T) => Object.fromEntries(FAMILIES.map((f) => [f, fn(f)])) as Record<FamilyId, T>;

function lerpFamille(a: FamilleLue, b: FamilleLue, t: number): FamilleLue {
  if (!a.valeur || !b.valeur) return { ...a, valeur: null, crans: null, horsStyle: null, raison: a.raison ?? b.raison ?? 'inconnu à l’un des deux crans voisins' };
  const v = { bas: lerp(a.valeur.bas, b.valeur.bas, t), centre: lerp(a.valeur.centre, b.valeur.centre, t), haut: lerp(a.valeur.haut, b.valeur.haut, t) };
  return { ...a, valeur: v, crans: null, horsStyle: a.bande && v.centre > a.bande[1] ? 'au-dessus' : null };
}

/** Tous les crans de la frise pour un ajout posé sur `base` (la recette sans cet ajout). */
export function calculerFrise(base: RecetteParcours, ajout: AjoutParcours): Point[] {
  const crans = cransFrise(base);
  const lus = crans.map((q) => simulerMoment(base, ajout, q));
  const simules = lus.map((l, k) => (l.simule ? k : -1)).filter((k) => k >= 0);
  return crans.map((q, k) => {
    const l = lus[k];
    const commun = {
      k, q, seg: segDe(q), lib: libMoment(q), court: courtMoment(q),
      ibuAjout: l.ibu.ibu ? l.ibu.ibu.valeur : null, ibu: l.apres.ibu.valeur, cru: q.type === 'dryhop',
    };
    if (l.simule) return { ...commun, profil: l.apres.profil, ecart: fam((f) => l.ecart[f]?.centre ?? null), interp: false };
    const a = [...simules].reverse().find((s) => s < k);
    const b = simules.find((s) => s > k);
    if (a == null || b == null) return { ...commun, profil: l.apres.profil, ecart: fam(() => null), interp: false };
    const t = (k - a) / (b - a);
    const la = lus[a], lb = lus[b];
    return {
      ...commun,
      profil: fam((f) => lerpFamille(la.apres.profil[f], lb.apres.profil[f], t)),
      ecart: fam((f) => {
        const ea = la.ecart[f]?.centre, eb = lb.ecart[f]?.centre;
        return ea == null || eb == null ? null : lerp(ea, eb, t);
      }),
      interp: true,
    };
  });
}

/** ★ : le meilleur cran pour sa demande du 18.10 (« trop résineuse, je la veux plus florale ») : floral gagné moins
 * résineux gagné, l'amertume restant dans la bande du style ; à 0,05 près, le plus tôt (a1). Seulement parmi les crans
 * calculés : un cran interpolé (≈) ne peut pas être « le meilleur ». */
export function meilleur(points: Point[], bandeIbu: [number, number] | null): number {
  let best = -1, sb = -Infinity;
  for (const p of points) {
    if (p.interp || (bandeIbu && p.ibu > bandeIbu[1])) continue;
    const fl = p.ecart.floral, rs = p.ecart.resin;
    if (fl == null || rs == null) continue;
    const s = fl - rs;
    if (best < 0 || s > sb + 0.05) { best = p.k; sb = s; }
  }
  return best;
}

/** Position de chaque cran sur le rail, en % : ébullition 0–44, whirlpool 44–52, actif 52–76, après 76–100 (a1). */
const SEG: [number, number][] = [[0, 44], [44, 52], [52, 76], [76, 100]];
export function positions(points: Point[]): number[] {
  return points.map((p) => {
    const du = points.filter((x) => x.seg === p.seg);
    const [a, b] = SEG[p.seg];
    if (du.length === 1) return (a + b) / 2;
    return a + (b - a) * (0.06 + (0.88 * du.indexOf(p)) / (du.length - 1));
  });
}
export const BORNES_SEG = SEG;

/** Loupe sous le doigt (y1b, D47, L12) : distorsion « œil de poisson » de Sarkar et Brown autour du cran tenu `f`
 * (en %), dans les bornes [lo, hi] de son étape : « quand on focus sur un type on affiche mieux l'échelle ».
 * Près du doigt, l'écart entre deux crans est multiplié par m + 1 ; au bord de l'étape, divisé par m + 1. */
export function loupe(x: number, f: number, lo = 0, hi = 100, m = 6): number {
  const d = x - f;
  const D = d >= 0 ? hi - f : f - lo;
  if (D <= 0) return x;
  const t = Math.abs(d) / D;
  return f + Math.sign(d) * D * (((m + 1) * t) / (m * t + 1));
}
