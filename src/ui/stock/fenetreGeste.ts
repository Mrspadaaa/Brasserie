import { POSITION_SEUIL, type Fenetre } from '../../domain/stock/horizon';

/**
 * Le geste de la fenêtre réglable de l'histogramme (maquette « pastille », corrigée le 16.11) : pure géométrie, sans DOM.
 *  - les deux bords sont des poignées aimantées aux colonnes, saisies à 18 px de chaque côté (cible de 36 px, au moins 24) ;
 *  - dedans, glisser déplace la fenêtre entière, d'une colonne à la fois ;
 *  - toucher une colonne la prend seule (la colonne seuil aussi) ; dehors, glisser trace une nouvelle fenêtre.
 * Les colonnes sont celles de la grille CSS `.cac-his` : 7 colonnes égales, écart de 6 px, marge de 2 px.
 */

export const NB_COLONNES = POSITION_SEUIL + 1;
export const ECART = 6;
export const MARGE = 2;
/** Les 4 px dont le cadre dépasse les colonnes. */
export const DEBORD = 4;
/** Rayon de saisie d'une poignée : 18 px de part et d'autre du bord, soit une cible de 36 px. */
export const RAYON_POIGNEE = 18;
/** En dessous de ce déplacement, c'est un toucher, pas un glissé. */
export const SEUIL_GLISSE = 6;

export interface Colonne { l: number; r: number }

/** Les colonnes (abscisses relatives au bord gauche de l'histogramme) pour une largeur donnée. */
export function colonnesDeLargeur(largeur: number): Colonne[] {
  const w = (largeur - 2 * MARGE - (NB_COLONNES - 1) * ECART) / NB_COLONNES;
  return Array.from({ length: NB_COLONNES }, (_, i) => {
    const l = MARGE + i * (w + ECART);
    return { l, r: l + w };
  });
}

export type ModeGeste = 'g' | 'd' | 'in' | 'out';
export interface Geste {
  mode: ModeGeste;
  x0: number;
  a0: number;
  b0: number;
  /** La colonne sous le doigt au départ. */
  c0: number;
  moved: boolean;
}

const limite = (a: number, b: number): Fenetre => {
  const x = Math.max(0, Math.min(POSITION_SEUIL, a));
  return { a: x, b: Math.max(x, Math.min(POSITION_SEUIL, b)) };
};
const procheBord = (cols: Colonne[], x: number, cote: 'l' | 'r') =>
  cols.reduce((m, o, i) => (Math.abs(x - o[cote]) < Math.abs(x - cols[m][cote]) ? i : m), 0);
/** La colonne dont le centre est le plus près de x (l'aimant). */
export const colonneSous = (cols: Colonne[], x: number): number =>
  cols.reduce((m, o, i) => (Math.abs(x - (o.l + o.r) / 2) < Math.abs(x - (cols[m].l + cols[m].r) / 2) ? i : m), 0);

export function debutGeste(f: Fenetre, x: number, largeur: number): Geste {
  const cols = colonnesDeLargeur(largeur);
  const l = cols[f.a].l - DEBORD;
  const r = cols[f.b].r + DEBORD;
  const dg = Math.abs(x - l);
  const dd = Math.abs(x - r);
  const mode: ModeGeste = dg <= RAYON_POIGNEE || dd <= RAYON_POIGNEE ? (dg < dd ? 'g' : 'd') : x > l && x < r ? 'in' : 'out';
  return { mode, x0: x, a0: f.a, b0: f.b, c0: colonneSous(cols, x), moved: false };
}

/** Pendant le glissé : la fenêtre sous le doigt, ou `null` tant que ce n'est qu'un toucher. */
export function deplacerGeste(g: Geste, x: number, largeur: number, courante: Fenetre): { geste: Geste; fenetre: Fenetre | null } {
  const geste = Math.abs(x - g.x0) > SEUIL_GLISSE && !g.moved ? { ...g, moved: true } : g;
  if (!geste.moved) return { geste, fenetre: null };
  const cols = colonnesDeLargeur(largeur);
  if (geste.mode === 'g') return { geste, fenetre: limite(Math.min(procheBord(cols, x, 'l'), courante.b), courante.b) };
  if (geste.mode === 'd') return { geste, fenetre: limite(courante.a, Math.max(procheBord(cols, x, 'r'), courante.a)) };
  if (geste.mode === 'in') {
    const pas = cols[1].l - cols[0].l;
    const largeurFenetre = geste.b0 - geste.a0;
    const k = Math.max(-geste.a0, Math.min(POSITION_SEUIL - geste.b0, Math.round((x - geste.x0) / pas)));
    return { geste, fenetre: limite(geste.a0 + k, geste.a0 + k + largeurFenetre) };
  }
  const i = colonneSous(cols, x);
  return { geste, fenetre: limite(Math.min(geste.c0, i), Math.max(geste.c0, i)) };
}

/** À la levée : un toucher (sans glissé, hors poignée) prend la colonne seule. Une poignée lâchée sans bouger ne change rien. */
export function finGeste(g: Geste): Fenetre | null {
  return !g.moved && (g.mode === 'in' || g.mode === 'out') ? { a: g.c0, b: g.c0 } : null;
}

/** Les touches du clavier sur une poignée (flèches : une colonne ; Début/Fin : les extrémités). */
export function pousserPoignee(f: Fenetre, cote: 'g' | 'd', delta: number): Fenetre {
  return cote === 'g' ? limite(Math.min(f.a + delta, f.b), f.b) : limite(f.a, Math.max(f.b + delta, f.a));
}
