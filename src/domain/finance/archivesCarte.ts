/**
 * Atelier › Matériel › Archives (maquette ka4) : la carte de l'argent mis de côté. Une case par projet archivé, sa surface suit son prix prévu.
 *
 * Problème d'école : le treemap. Méthode standard : « squarified treemap » (Bruls, Huizing, van Wijk, 2000), les cases au plus près du carré.
 * `d3-hierarchy` n'est pas au paquet (hors de ma voie) : la méthode est écrite ici, pure, et testée sur ses invariants (aire, recouvrement, ordre).
 * Variante assumée, celle de la maquette : les rangées se posent toujours sur la LARGEUR (cases empilées sur le téléphone), au lieu du plus court côté.
 * Un projet sans prix n'a pas de surface : il reste « hors carte », jamais une case à zéro (inconnu ≠ 0).
 */
export interface Rect { x: number; y: number; w: number; h: number }
export type Sens = 'auto' | 'largeur';

/** Pire rapport largeur/hauteur d'une rangée de cases d'aires `aires` posée sur un côté de longueur `cote` (Bruls, éq. 1). */
export function pireRapport(aires: number[], cote: number): number {
  const s = aires.reduce((t, a) => t + a, 0), max = Math.max(...aires), min = Math.min(...aires);
  return Math.max(cote * cote * max / (s * s), s * s / (cote * cote * min));
}

/**
 * Pose `valeurs` (strictement positives) dans `boite`. Rend un rectangle par valeur, dans l'ordre d'entrée ; les aires sont proportionnelles aux valeurs
 * et remplissent la boîte. `sens = 'auto'` : la rangée longe le plus court côté du reste (Bruls) ; `'largeur'` : toujours sur la largeur.
 */
export function squarify(valeurs: number[], boite: Rect, sens: Sens = 'auto'): Rect[] {
  const sortis = valeurs.map((v, i) => ({ v, i })).sort((a, b) => b.v - a.v || a.i - b.i);
  const total = sortis.reduce((t, e) => t + e.v, 0), sortie: Rect[] = new Array(valeurs.length);
  if (!sortis.length || !(total > 0) || !(boite.w > 0) || !(boite.h > 0)) return valeurs.map(() => ({ x: boite.x, y: boite.y, w: 0, h: 0 }));
  const k = boite.w * boite.h / total, reste = { ...boite };
  let rangee: Array<{ v: number; i: number }> = [];
  const horizontale = () => sens === 'largeur' || reste.w < reste.h;
  const cote = () => horizontale() ? reste.w : reste.h;
  const poser = () => {
    const somme = rangee.reduce((t, e) => t + e.v * k, 0);
    if (horizontale()) {
      const h = somme / reste.w; let x = reste.x;
      for (const e of rangee) { const w = e.v * k / h; sortie[e.i] = { x, y: reste.y, w, h }; x += w; }
      reste.y += h; reste.h -= h;
    } else {
      const w = somme / reste.h; let y = reste.y;
      for (const e of rangee) { const h = e.v * k / w; sortie[e.i] = { x: reste.x, y, w, h }; y += h; }
      reste.x += w; reste.w -= w;
    }
    rangee = [];
  };
  for (const e of sortis) {
    if (!rangee.length) { rangee = [e]; continue; }
    const c = cote();
    if (pireRapport([...rangee, e].map(r => r.v * k), c) <= pireRapport(rangee.map(r => r.v * k), c)) rangee.push(e);
    else { poser(); rangee = [e]; }
  }
  if (rangee.length) poser();
  return sortie;
}

export interface EntreeCarte { id: string; /** prix prévu en centimes ; null = pas de prix. */ cents: number | null; /** déjà payé sur des achats liés (centimes) ; null = inconnu ou aucun achat. */ payeCents?: number | null }
export interface CaseCarte extends Rect { id: string; cents: number; payeCents: number | null; /** part déjà payée de la case, entre 0 et 1. */ partPayee: number }
export interface HorsCarte { id: string; /** vrai : un prix de 0, sans surface ; faux : le prix reste à estimer. */ prixNul: boolean }
export interface Carte { cases: CaseCarte[]; horsCarte: HorsCarte[]; /** somme des prix connus, centimes. */ totalCents: number; nbPrix: number; nbProjets: number; hauteur: number }

/** La carte garde le rapport de la maquette (366 × 250 px) quelle que soit la dispersion des prix : une petite case ne l'agrandit jamais (53 × d'écart = une case de 4 px, pas trois écrans). */
export const RATIO_CARTE = 250 / 366, HAUTEUR_BASE = 250;
/** Marge de chaque côté d'une case (la carte est posée avec 2 px de jour entre les cases). */
export const JOUR = 2;

const prixValide = (c: number | null | undefined): c is number => c != null && Number.isFinite(c) && c > 0;

/** Hauteur de la carte : le rapport de la maquette, jamais moins de 250 px. */
export function hauteurCarte(largeur: number): number { return Math.max(HAUTEUR_BASE, Math.round(largeur * RATIO_CARTE)); }

/**
 * Ce que la case peut porter, d'après sa taille (le jour retiré) :
 * - `grande` : nom, montant, étape et bouton « Reprendre » (200 × 110 px au moins) ;
 * - `etroite` : colonne haute, nom sur plusieurs lignes, montant au pied (100 × 100 px) ;
 * - `bande` : une ligne de nom, une ligne d'étape, le montant et le bouton en icône de 44 px, comme la maquette (240 × 46 px) ;
 * - `mini` : trop petite pour un texte et un bouton de 44 px. La case ne dit que le montant (si 48 × 20 px le permettent), le projet se lit et se reprend
 *   dans la liste « petits montants » sous la carte.
 */
export type FormeCase = 'grande' | 'etroite' | 'bande' | 'mini';
export function formeCase(r: Rect): FormeCase {
  const h = r.h - 2 * JOUR, w = r.w - 2 * JOUR;
  if (h >= 110 && w >= 200) return 'grande';
  if (h >= 100 && w >= 100 && w < 200) return 'etroite';
  if (h >= 46 && w >= 240) return 'bande';
  return 'mini';
}
/** Le montant tient-il dans une case `mini` ? Sinon la liste du dessous le porte. */
export const montantDansCase = (r: Rect) => r.h - 2 * JOUR >= 20 && r.w - 2 * JOUR >= 48;

export function carteArchives(entrees: EntreeCarte[], largeur: number): Carte {
  const avecPrix = entrees.filter(e => prixValide(e.cents)).sort((a, b) => b.cents! - a.cents!);
  const horsCarte = entrees.filter(e => !prixValide(e.cents)).map(e => ({ id: e.id, prixNul: e.cents === 0 }));
  const valeurs = avecPrix.map(e => e.cents!), hauteur = valeurs.length ? hauteurCarte(largeur) : 0;
  const rects = squarify(valeurs, { x: 0, y: 0, w: largeur, h: hauteur }, 'largeur');
  const cases = avecPrix.map((e, i) => {
    const paye = e.payeCents != null && Number.isFinite(e.payeCents) && e.payeCents > 0 ? Math.min(e.payeCents, e.cents!) : null;
    return { id: e.id, cents: e.cents!, payeCents: paye, partPayee: paye != null ? paye / e.cents! : 0, ...rects[i] };
  });
  return { cases, horsCarte, totalCents: valeurs.reduce((t, v) => t + v, 0), nbPrix: valeurs.length, nbProjets: entrees.length, hauteur };
}
