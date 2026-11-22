/**
 * Le moteur de la frise au doigt (frise B validée le 20.11 : « Très bien fait le portage du système, du mécanisme, pas du visuel... Fait le
 * partout !!! »). Règles R1 à R14 : work/missions/2026-11-20-frise/frise-interactive.html (dépôt Brasserie). Ce fichier n'a que du calcul pur ;
 * le geste (Pointer Events) vit dans `useGlisse.ts`, l'adaptateur des curseurs natifs dans `curseurNatif.ts`. Aucun dessin ici.
 *
 * Deux réglages :
 * - temps : deux bords, ouvert vers le passé et le futur ; les deux bouts restent visibles, l'échelle s'ajuste (R4, R5, R7) ;
 * - quantité : un bord ancré à 0 ; l'échelle ne s'étend que vers le haut (R6, R7), puis se recale au palier utile (R10).
 */

/** R1 : la valeur ne bouge qu'après ce déplacement horizontal (px). */
export const SEUIL_PX = 6;
/** R7 : bande de défilement au bord (px). */
export const BANDE_PX = 40;
/** R3 : zone de saisie d'un bord (px), 22 de part et d'autre du trait. */
export const CIBLE_PX = 44;
/** R4 : les deux bouts de la plage se posent à cette distance des bords de la frise (px). */
export const MARGE_BOUTS_PX = 56;
/** R7 : vitesse au bord, en largeurs d'échelle par seconde, de la lisière au fond de la bande. */
export const VITESSE_MIN = 0.15;
export const VITESSE_MAX = 1.35;
/** R10 : durée du recalage de l'échelle après le lâcher (ms). */
export const RECALAGE_MS = 200;

export const borner = (v: number, min: number, max: number): number => Math.max(min, Math.min(max, v));

/** R8 : arrondi au pas du métier (jamais d'aimant vers des valeurs « rondes »). Un pas nul ou absent laisse la valeur. */
export function arrondir(v: number, pas?: number, origine = 0): number {
  if (!pas || !(pas > 0) || !Number.isFinite(v)) return v;
  const n = Math.round((v - origine) / pas);
  // supprime les queues binaires (0,1 + 0,2) au nombre de décimales du pas
  const dec = (String(pas).split('.')[1] ?? '').length;
  return Number((origine + n * pas).toFixed(Math.min(10, dec + 2)));
}

/** R1 : le doigt a-t-il assez bougé pour que la valeur suive ? */
export const aBouge = (dx: number): boolean => Math.abs(dx) >= SEUIL_PX;

/**
 * R2 : la valeur suit le DÉPLACEMENT. `v0` est la valeur à la saisie, `dx` le déplacement depuis la saisie (px),
 * `unitesParPx` l'échelle à la saisie. Jamais la position absolue du doigt.
 */
export const suivreDeplacement = (v0: number, dx: number, unitesParPx: number): number => v0 + dx * unitesParPx;

/**
 * R7 : le doigt est-il dans la bande d'un bord, en allant vers lui ? `x` en px depuis le bord gauche de la frise, `largeur` sa largeur,
 * `arme` le sens du dernier mouvement (-1 gauche, 1 droite, 0 aucun). Rend le sens (-1, 0, 1) et la vitesse (largeurs d'échelle par seconde).
 */
export function vitesseBord(x: number, largeur: number, arme: number): { sens: -1 | 0 | 1; vitesse: number } {
  let sens: -1 | 0 | 1 = 0, prof = 0;
  if (x < BANDE_PX && arme < 0) { sens = -1; prof = Math.min(1, (BANDE_PX - x) / BANDE_PX); }
  else if (x > largeur - BANDE_PX && arme > 0) { sens = 1; prof = Math.min(1, (x - (largeur - BANDE_PX)) / BANDE_PX); }
  if (!sens) return { sens: 0, vitesse: 0 };
  return { sens, vitesse: VITESSE_MIN + (VITESSE_MAX - VITESSE_MIN) * Math.pow(prof, 1.5) };
}

/**
 * R7 : le sens du doigt, avec hystérésis (T9-1, 22.11). Un doigt tenu au bord tremble (±1 px à 120 Hz) : armé au moindre pas de 0,5 px, le
 * sens basculait sans cesse, `vitesseBord` rendait 0 et le défilement s'arrêtait au bord. Le sens ne s'inverse qu'après `SEUIL_PX` de retour
 * depuis le point le plus avancé (`pivot`) ; le premier pas de plus de 0,5 px l'arme.
 */
export function armerSens(arme: number, pivot: number, x: number): { arme: -1 | 0 | 1; pivot: number } {
  if (arme > 0) return x >= pivot ? { arme: 1, pivot: x } : x < pivot - SEUIL_PX ? { arme: -1, pivot: x } : { arme: 1, pivot };
  if (arme < 0) return x <= pivot ? { arme: -1, pivot: x } : x > pivot + SEUIL_PX ? { arme: 1, pivot: x } : { arme: -1, pivot };
  return x - pivot > 0.5 ? { arme: 1, pivot: x } : x - pivot < -0.5 ? { arme: -1, pivot: x } : { arme: 0, pivot };
}

/**
 * R4 (temps) : l'échelle qui pose le début `a` à `marge` px du bord gauche et la fin `b` à `marge` px du bord droit.
 * Rend `span` (unités visibles sur la largeur) et `v0` (unité au bord gauche).
 */
export function cadrerDeuxBouts(a: number, b: number, largeur: number, marge = MARGE_BOUTS_PX): { span: number; v0: number } {
  const W = Math.max(largeur, 3 * marge);
  const span = (b - a) * W / (W - 2 * marge);
  return { span, v0: a - marge * span / W };
}

/**
 * R3 : les zones de saisie d'une plage à deux bords (px). Chaque bord : 22 px dehors, au plus un tiers de la plage dedans ; le reste, le corps.
 * Deux zones ne se recouvrent jamais.
 */
export function zonesBords(xa: number, xb: number): { a: [number, number]; corps: [number, number]; b: [number, number] } {
  const demi = CIBLE_PX / 2, dedans = Math.min(demi, Math.max(0, (xb - xa) / 3));
  return { a: [xa - demi, xa + dedans], corps: [xa + dedans, xb - dedans], b: [xb - dedans, xb + demi] };
}

/** R3 : quel rôle tient le doigt posé en `x` (px) ? À gauche du début, le début ; à droite de la fin, la fin. */
export function roleSous(x: number, xa: number, xb: number): 'a' | 'b' | 'corps' {
  const z = zonesBords(xa, xb);
  if (x < z.a[1]) return 'a';
  if (x >= z.b[0]) return 'b';
  return 'corps';
}

/**
 * R5 / R6 (temps) : pose une plage après un déplacement `d` (unités) du rôle tenu, depuis la plage saisie [a0, b0].
 * Durée minimale `minLarg`, un bord ne passe jamais l'autre ; le corps garde la durée ; tout reste dans [min, max].
 */
export function poserPlage(role: 'a' | 'b' | 'corps', a0: number, b0: number, d: number, o: { min: number; max: number; minLarg: number; pas?: number }): { a: number; b: number } {
  const r = (v: number) => arrondir(v, o.pas);
  if (role === 'a') return { a: borner(r(a0 + d), o.min, b0 - o.minLarg), b: b0 };
  if (role === 'b') return { a: a0, b: borner(r(b0 + d), a0 + o.minLarg, o.max) };
  const dd = borner(r(d), o.min - a0, o.max - b0);
  return { a: a0 + dd, b: b0 + dd };
}

/**
 * R10 (quantité) : l'échelle après le lâcher. Valeur sous la moitié de l'échelle : plus petit palier ≥ valeur × 1,25 (jamais sous `base`) ;
 * sinon le palier rond au-dessus de l'échelle courante. Sans palier : l'échelle reste.
 */
export function palierApres(valeur: number, echelle: number, paliers: readonly number[], base: number): number {
  if (!paliers.length) return echelle;
  const plafond = paliers[paliers.length - 1];
  if (echelle > base && valeur < echelle / 2) return Math.max(base, paliers.find((q) => q >= valeur * 1.25) ?? plafond);
  return paliers.find((q) => q >= echelle - 1e-9) ?? plafond;
}

/** R7 (quantité) : l'échelle s'étend vers le haut seulement, à `vitesse` largeurs par seconde pendant `dt` secondes ; 0 reste fixe. */
export const etendreEchelle = (echelle: number, vitesse: number, dt: number, plafond: number): number =>
  Math.min(plafond, echelle * (1 + vitesse * 0.6 * dt));
