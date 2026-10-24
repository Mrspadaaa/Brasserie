import protoData from '../../data/proto-data.json';
import { FAMILIES, type FamilyId } from './families';
import { temoinNegatif } from './temoin';
import { getStyleScale, SCALE_PARAMETERS, type FamilyStatus, type StyleScale } from '../style/scale';

/**
 * Tolérance par style et a priori du brasseur (D54, 18.10.2026, soir).
 * Le brasseur : « un peu plus résineux pour une stout est pas très problématique, pour une lager
 * kolsch très » ; « certains style ou même mon apprioi est important et une petite différence peut
 * en fait faire complément changé dechelle ». Constat : une famille que le BJCP ne nomme pas recevait
 * la même bande neutre (0–30) en 16D, 5B et 3B.
 * Règle du prototype, à valider par le brasseur ; elle s'ajoute aux bandes (getStyleScale) sans les
 * changer : les vues l'adoptent quand il l'a choisie.
 */
export const TOLERANCE_RULE = [
  'Masquage m (0 à 1) : moyenne de trois indices pris au milieu des statistiques BJCP du style : couleur (SRM 5 → 0, 35 → 1), densité initiale (1,040 → 0, 1,080 → 1), amertume (IBU 15 → 0, 60 → 1). Une bière sombre, forte et amère couvre davantage un caractère houblon étranger au style qu’une bière pâle et légère.',
  'Facteur f = 0,35 + 0,65 × m (0,35 pour la bière la plus nue, 1 pour la plus couvrante).',
  'Famille neutre (que le style ne nomme pas) : bande [0, plafond × f] ; famille attendue ou indésirable : bande du BJCP inchangée.',
  'Unité de tolérance T = largeur de la bande (plancher 15 points, comme la piste) / 3, × f pour une famille attendue ou indésirable (la bande d’une neutre est déjà réduite par f) ; au moins 5 points ; en points 0–100.',
  'A priori du brasseur, par famille : strict ×0,5, normal ×1, libre ×2 sur le haut de la bande et sur T ; banni : bande [0, 0], T au plancher (5 points).',
  'Écart en tolérances : (valeur − haut) / T au-dessus de la bande, (bas − valeur) / T en dessous (bande qui ne part pas de 0), 0 dedans ; à 2 décimales. 1 = nettement hors du style pour ce style et cet a priori.',
];

export type Apriori = 'strict' | 'normal' | 'libre' | 'banni';
const MULT: Record<Exclude<Apriori, 'banni'>, number> = { strict: 0.5, normal: 1, libre: 2 };
const T_MIN = 5;

type StyleStat = { code: string; id: string; name: string; ibu: [number, number] | null; og: [number, number] | null; srm: [number, number] | null };
const STATS = protoData.styles as unknown as StyleStat[];
const r2 = (x: number) => Math.round(x * 100) / 100;
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const mid = (r: [number, number] | null) => (r ? (r[0] + r[1]) / 2 : null);

export interface Masking { m: number | null; facteur: number; indices: { couleur: number | null; densite: number | null; amertume: number | null }; stats: { srm: [number, number] | null; og: [number, number] | null; ibu: [number, number] | null } }

/** Masquage d'un style par sa bière de base ; style sans statistiques : m null, facteur 1 (bandes inchangées). */
export function styleMasking(code: string): Masking {
  const s = STATS.find((x) => x.code === code || x.id === code) ?? null;
  const srm = s?.srm ?? null, og = s?.og ?? null, ibu = s?.ibu ?? null;
  const couleur = srm ? clamp01((mid(srm)! - 5) / 30) : null;
  const densite = og ? clamp01((mid(og)! - 1.04) / 0.04) : null;
  const amertume = ibu ? clamp01((mid(ibu)! - 15) / 45) : null;
  const known = [couleur, densite, amertume].filter((x): x is number => x !== null);
  // Témoin négatif : V4_TEMOIN_NEGATIF=tolerance rend l'ancien comportement (aucun masquage, f = 1).
  const m = temoinNegatif() === 'tolerance' ? null : known.length ? r2(known.reduce((a, b) => a + b, 0) / known.length) : null;
  return { m, facteur: m === null ? 1 : r2(0.35 + 0.65 * m), indices: { couleur: couleur === null ? null : r2(couleur), densite: densite === null ? null : r2(densite), amertume: amertume === null ? null : r2(amertume) }, stats: { srm, og, ibu } };
}

export interface FamilyTolerance { family: FamilyId; status: FamilyStatus; apriori: Apriori; bandeStyle: [number, number] | null; bande: [number, number] | null; T: number | null; depuis: string[] }
export interface ToleranceScale { code: string; name: string; masquage: Masking; familles: FamilyTolerance[] }

/** Tolérances d'un style, avec l'a priori du brasseur par famille (normal par défaut). */
export function toleranceScale(code: string, apriori: Partial<Record<FamilyId, Apriori>> = {}, scale: StyleScale = getStyleScale(code)): ToleranceScale {
  const mk = styleMasking(scale.code), f = mk.facteur;
  const familles = FAMILIES.map((fam): FamilyTolerance => {
    const fs = scale.families[fam], a = apriori[fam] ?? 'normal';
    if (!fs.band) return { family: fam, status: fs.status, apriori: a, bandeStyle: null, bande: null, T: null, depuis: ['style non documenté : échelle absolue'] };
    const [lo, hi] = fs.band;
    const depuis = [fs.status === 'neutre' ? 'BJCP : famille non nommée' : 'BJCP : ' + (fs.status === 'attendue' ? 'nommée' : 'exclue')];
    if (a === 'banni') return { family: fam, status: fs.status, apriori: a, bandeStyle: [lo, hi], bande: [0, 0], T: T_MIN, depuis: [...depuis, 'mon a priori : banni'] };
    const k = MULT[a];
    let haut = fs.status === 'neutre' ? lo + (hi - lo) * f : hi;
    if (fs.status === 'neutre' && mk.m !== null) depuis.push(`masquage ${String(mk.m).replace('.', ',')} : haut × ${String(f).replace('.', ',')}`);
    haut = Math.min(100, lo + (haut - lo) * k);
    const largeur = Math.max(SCALE_PARAMETERS.minWidth, haut - lo);
    // La largeur porte déjà l'a priori (et, pour une neutre, le masquage) : f ne s'applique qu'une fois.
    const T = Math.max(T_MIN, (largeur / 3) * (fs.status === 'neutre' ? 1 : f));
    if (a !== 'normal') depuis.push('mon a priori : ' + a);
    return { family: fam, status: fs.status, apriori: a, bandeStyle: [lo, hi], bande: [r2(lo), r2(haut)], T: r2(T), depuis };
  });
  return { code: scale.code, name: scale.name, masquage: mk, familles };
}

/** Écart d'une valeur 0–100 en tolérances : 0 dans la bande ; null si la famille ou la valeur n'est pas située. */
export function ecartTolerances(t: FamilyTolerance, value: number | null): number | null {
  if (value === null || !t.bande || t.T === null) return null;
  const [lo, hi] = t.bande;
  if (value > hi) return r2((value - hi) / t.T);
  if (lo > 0 && value < lo) return r2(-(lo - value) / t.T);
  return 0;
}
