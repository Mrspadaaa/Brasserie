// D380, D381 : découper une longue pièce (photo haute, PDF de plusieurs pages ou très dense) en morceaux, DANS L'APP.
// « Ça reste un processus de facturation, c'est ultra critique. On peut pas se permettre de perdre ou "gagner" de l'information. »
//
// Deux parties :
//  1. PURE (testable sous Node, aucun canvas) : `encreLocale` (où est l'encre, ligne par ligne), `trouverPapier`, `estimerAngle`, `analyser`,
//     `normaliser`. Un `Bitmap` est un gris `Uint8Array` (0 noir, 255 blanc).
//  2. NAVIGATEUR : `decouperPiece(file, { force })` → les morceaux en JPEG, ou `null` (la pièce garde alors la lecture d'aujourd'hui, EXACTEMENT).
//
// Convention de rotation (une seule, pour `normaliser`, `estimerAngle` et le dessin des morceaux) : l'angle est en degrés, positif quand les lignes du
// texte DESCENDENT vers la droite (y croît avec x : le papier est tourné dans le sens des aiguilles d'une montre à l'écran). `normaliser` remet les lignes
// à l'horizontale : le pixel de sortie (u, v), relatif au centre du recadrage (du, dv), lit la source en
//   (cx + du·cosθ − dv·sinθ , cy + du·sinθ + dv·cosθ)      avec (cx, cy) le centre du recadrage dans la source.
// Les coordonnées sont celles des CENTRES de pixels ; la rotation se fait autour du centre du recadrage.
import { BAND_MAX_LINES, EMPTY_ROW_MAX, linePitch, planJonctions, planMorceaux, type Bitmap, type Morceau } from '../../functions/src/invoiceMorceaux';
import { chargerPdfjs } from './pdfjs';
import type { Perspective } from './decoupePerspective';

export type { Bitmap, Morceau };
export interface Rect { x: number; y: number; w: number; h: number }
/** Un morceau prêt pour `scanInvoice` : son image JPEG, son rang, et si la coupe BASSE (avec le morceau suivant) traverse une ligne. */
export interface Partie { file: { data: string; mimeType: string }; morceau: { k: number; n: number }; coupeForcee: boolean }

/** Une image plus haute que 3 × sa largeur (après recadrage du papier) est découpée sans qu'on le demande. */
export const RAPPORT_DECOUPE = 3;
/** Un PDF de plus de 4 pages, ou de plus de 90 rangées de texte, est découpé sans qu'on le demande. */
export const PDF_PAGES_MAX = 4;
export const PDF_RANGEES_MAX = 90;
export const LARGEUR_MAX = 1600;
export const QUALITE_JPEG = 0.85;
/** Le contraste d'encre ne descend jamais sous ce plancher (niveaux de gris), quel que soit le seuil d'Otsu. */
export const PLANCHER_ENCRE = 25;
const ANGLE_MAX = 5;
const ANGLE_PAS = 0.25;
/** Affinage de l'angle : ±0,4° autour de l'estimation grossière, par pas de 0,05°. */
const ANGLE_AFFINE = 0.4;
const ANGLE_PAS_FIN = 0.05;
/** Un papier posé de travers : l'angle du texte se cherche aussi autour de sa pente, jusqu'à ±30°. */
const ANGLE_PAPIER_MAX = 30;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

// ---------------------------------------------------------------------------------------------------------------------
// 1. PURE : où est l'encre
// ---------------------------------------------------------------------------------------------------------------------

/** Maximum glissant sur [i − demi, i + demi] (bords tronqués), file monotone en O(n). `file` : au moins n cases. */
function maxGlissant(entree: Uint8Array, sortie: Uint8Array, n: number, demi: number, file: Int32Array): void {
  let tete = 0, queue = 0, suivant = 0;
  for (let i = 0; i < n; i++) {
    const limite = Math.min(n - 1, i + demi);
    while (suivant <= limite) {
      const v = entree[suivant];
      while (queue > tete && entree[file[queue - 1]] <= v) queue--;
      file[queue++] = suivant++;
    }
    while (file[tete] < i - demi) tete++;
    sortie[i] = entree[file[tete]];
  }
}

/** Le fond local de chaque pixel : le plus clair de son voisinage carré de (2·demi + 1) pixels (filtre séparable). */
function fondLocal(gris: Uint8Array, w: number, h: number, demi: number): Uint8Array {
  const file = new Int32Array(Math.max(w, h));
  const horizontal = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) maxGlissant(gris.subarray(y * w, (y + 1) * w), horizontal.subarray(y * w, (y + 1) * w), w, demi, file);
  const sortie = new Uint8Array(w * h), colonne = new Uint8Array(h), maxColonne = new Uint8Array(h);
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) colonne[y] = horizontal[y * w + x];
    maxGlissant(colonne, maxColonne, h, demi, file);
    for (let y = 0; y < h; y++) sortie[y * w + x] = maxColonne[y];
  }
  return sortie;
}

/**
 * Otsu sur un histogramme de 256 cases : `seuil` est la plus petite valeur qui sépare au mieux deux classes (la classe basse va jusqu'à `seuil` compris),
 * `bas` et `haut` les moyennes des deux classes. Sans deux classes (histogramme d'une seule valeur) : seuil 0, moyennes égales.
 */
export function otsu(histogramme: ArrayLike<number>): { seuil: number; bas: number; haut: number } {
  let total = 0, somme = 0;
  for (let t = 0; t < 256; t++) { total += histogramme[t]; somme += t * histogramme[t]; }
  let poidsBas = 0, sommeBas = 0, meilleur = -1, seuil = 0, bas = 0, haut = 0;
  for (let t = 0; t < 255; t++) {
    poidsBas += histogramme[t]; sommeBas += t * histogramme[t];
    const poidsHaut = total - poidsBas;
    if (poidsBas === 0 || poidsHaut === 0) continue;
    const moyBas = sommeBas / poidsBas, moyHaut = (somme - sommeBas) / poidsHaut;
    const entre = poidsBas * poidsHaut * (moyBas - moyHaut) ** 2;
    if (entre > meilleur * (1 + 1e-9)) { meilleur = entre; seuil = t; bas = moyBas; haut = moyHaut; }
  }
  if (meilleur < 0) { const m = total ? somme / total : 0; return { seuil: 0, bas: m, haut: m }; }
  return { seuil, bas, haut };
}

/**
 * Le contraste local de chaque pixel (fond local − pixel) et le seuil adaptatif (Otsu, jamais sous le plancher). `dedans` : le seuil se choisit sur ces
 * pixels seulement (l'intérieur du papier), s'ils sont assez nombreux ; tous les pixels gardent leur contraste. Le bord d'une table sombre (contraste
 * ≈ 180 tout le long du papier) haussait le seuil au-dessus d'un texte flou (≈ 70) : plus d'encre, plus d'angle (pièges h0040, h0053, h0066).
 */
function contrasteLocal(gris: Uint8Array, w: number, h: number, demi: number, dedans: Uint8Array | null = null): { contraste: Uint8Array; seuil: number } {
  const fond = fondLocal(gris, w, h, demi);
  const contraste = new Uint8Array(w * h), histogramme = new Uint32Array(256), interieur = new Uint32Array(256);
  let n = 0;
  for (let i = 0; i < contraste.length; i++) {
    const c = fond[i] - gris[i]; contraste[i] = c; histogramme[c]++;
    if (dedans && dedans[i]) { interieur[c]++; n++; }
  }
  return { contraste, seuil: Math.max(PLANCHER_ENCRE, otsu(n >= 0.05 * w * h ? interieur : histogramme).seuil) };
}

/** L'encre de chaque pixel (0 ou 1) : contraste au-delà du seuil, sans point isolé (bruit de capteur). */
function binariser(contraste: Uint8Array, w: number, h: number, seuil: number): Uint8Array {
  const brut = new Uint8Array(w * h);
  for (let i = 0; i < brut.length; i++) brut[i] = contraste[i] > seuil ? 1 : 0;
  const net = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0, i = y * w; x < w; x++, i++) {
      if (brut[i] && ((x > 0 && brut[i - 1]) || (x < w - 1 && brut[i + 1]) || (y > 0 && brut[i - w]) || (y < h - 1 && brut[i + w]))) net[i] = 1;
    }
  }
  return net;
}

/** Sans les traits horizontaux plus longs que `longueur` : un mot ne court jamais sur la moitié de la page sans espace. */
export function sansTraitsHorizontaux(ink: Uint8Array, w: number, h: number, longueur: number): Uint8Array {
  const sortie = ink.slice();
  for (let y = 0; y < h; y++) {
    const ligne = y * w;
    for (let x = 0; x < w;) {
      if (!ink[ligne + x]) { x++; continue; }
      let fin = x;
      while (fin < w && ink[ligne + fin]) fin++;
      if (fin - x >= longueur) sortie.fill(0, ligne + x, ligne + fin);
      x = fin;
    }
  }
  return sortie;
}

/**
 * Sans les traits verticaux plus longs que `longueur` (bord du papier sur la table, ombre du bord, filet de tableau) : ils ne portent aucune ligne de
 * texte, mais encreraient toutes les rangées et empêcheraient toute coupe propre. Un trait de lettre ne dépasse jamais la hauteur d'une ligne.
 */
export function sansTraitsVerticaux(ink: Uint8Array, w: number, h: number, longueur: number): Uint8Array {
  const sortie = ink.slice();
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h;) {
      if (!ink[y * w + x]) { y++; continue; }
      let fin = y;
      while (fin < h && ink[fin * w + x]) fin++;
      if (fin - y >= longueur) for (let t = y; t < fin; t++) sortie[t * w + x] = 0;
      y = fin;
    }
  }
  return sortie;
}

/** La part d'encre de chaque rangée, mesurée sur les colonnes [x0, x1) seulement (par défaut toute la largeur). */
function partParRangee(ink: Uint8Array, w: number, h: number, x0 = 0, x1 = w): number[] {
  const rangees: number[] = [], large = Math.max(1, x1 - x0);
  for (let y = 0; y < h; y++) {
    let n = 0;
    for (let x = x0, i = y * w + x0; x < x1; x++, i++) n += ink[i];
    rangees.push(n / large);
  }
  return rangees;
}

/**
 * `ink` : l'encre nette (seuil adaptatif), pour l'angle et le recadrage. `coupe` : l'encre SENSIBLE (moitié du seuil : un texte pâli, sous une tache
 * ou flou compte), pour décider où couper ; `rangees` est sa part par rangée. Les deux sont sans traits verticaux.
 */
export interface Encre { ink: Uint8Array; coupe: Uint8Array; rangees: number[]; pas: number | null; seuil: number }

/**
 * L'encre d'une image par CONTRASTE LOCAL. Le fond d'un pixel est le plus clair de son voisinage (fenêtre ≈ 2 pas de ligne) : un papier gris, un dégradé
 * d'ombre, une tache lisse ne sont pas de l'encre, un texte sur la tache l'est. Le pas des lignes est d'abord estimé avec une fenêtre large, puis la
 * fenêtre est resserrée à 2 pas. Un thème sombre (moyenne < 70) est inversé d'abord, sauf `clair` (un papier est connu) : le papier est la région claire, et
 * le fond sombre autour n'est que la table (ses tickets du 03.11 sur un tissu sombre : inversés, le papier devenait de l'encre et le texte du blanc).
 * Avec un papier, le seuil se choisit sur son intérieur (voir `contrasteLocal`) ; `(dx, dy)` : la position de l'image dans le repère du papier. Aucun
 * masque : rien de la pièce n'est caché à l'analyse.
 */
export function encreDetaillee(bitmap: Bitmap, papier: Papier | null = null, dx = 0, dy = 0, clair = papier !== null): Encre {
  const { width: w, height: h } = bitmap;
  let gris = bitmap.gray;
  let somme = 0;
  for (let i = 0; i < gris.length; i++) somme += gris[i];
  if (!clair && gris.length && somme / gris.length < 70) gris = gris.map(v => 255 - v);
  const longueur = Math.max(48, Math.round(w / 8)), dedans = papier ? dedansDuPapier(papier, w, h, dx, dy) : null;
  const marquer = (demi: number) => {
    const { contraste, seuil } = contrasteLocal(gris, w, h, demi, dedans);
    // L'encre de l'angle perd aussi les longs traits horizontaux (pli, filet, bord haut du papier) : un pli penché de 0,65° tirait l'angle à lui
    // (piège h0145). La carte des coupes les garde : une coupe les évite.
    const ink = sansTraitsHorizontaux(sansTraitsVerticaux(binariser(contraste, w, h, seuil), w, h, longueur), w, h, Math.max(64, Math.round(w / 2)));
    // La carte des coupes : la moitié du seuil net (jamais sous le plancher). Plus bas, le grain d'un vrai papier photographié (reflets, JPEG) encre
    // 10 à 23 % des rangées blanches (ses tickets du 03.11) ; à la moitié, une ligne pâlie au tiers de son contraste compte encore.
    const seuilCoupe = Math.max(PLANCHER_ENCRE, Math.round(seuil / 2));
    return { ink, seuil, coupe: seuilCoupe < seuil ? sansTraitsVerticaux(binariser(contraste, w, h, seuilCoupe), w, h, longueur) : ink };
  };
  const demi1 = Math.max(3, Math.round(w / 40));
  let m = marquer(demi1);
  let pas = linePitch(partParRangee(m.ink, w, h));
  if (pas) {
    const demi2 = clamp(Math.round(pas), 3, 300);
    if (Math.abs(demi2 - demi1) > 0.2 * demi1) {
      m = marquer(demi2);
      pas = linePitch(partParRangee(m.ink, w, h)) ?? pas;
    }
  }
  return { ...m, rangees: partParRangee(m.coupe, w, h), pas };
}

/** La part d'encre de chaque rangée, par contraste local (voir `encreDetaillee`). Remplace `inkRows` (fond global) pour une photo. */
export function encreLocale(bitmap: Bitmap): number[] {
  return encreDetaillee(bitmap).rangees;
}

// ---------------------------------------------------------------------------------------------------------------------
// 1. PURE : le papier, l'angle, la normalisation
// ---------------------------------------------------------------------------------------------------------------------

export interface Papier {
  /** La boîte du papier, en pixels de l'image (sans marge). */
  boite: Rect;
  /** Par rangée de blocs : [gauche, droite] du papier, en blocs (gauche > droite : rien). Les trous (texte) sont comblés. */
  intervalles: Int32Array;
  /** Côté d'un bloc, en pixels. */
  f: number;
  bw: number;
  bh: number;
  /** Long côté / court côté du papier, quelle que soit sa pente (moments de la région claire : un rectangle penché garde sa forme). */
  rapport: number;
  /** La pente du papier en degrés (convention en tête de fichier), ou `null` s'il est presque carré : une piste pour l'angle du texte. */
  angle: number | null;
}

/**
 * Le papier d'une photo prise sur un fond sombre (table, tissu) : la plus grande région claire (blocs, seuil d'Otsu), sa boîte et, par rangée,
 * l'intervalle qu'elle couvre. PRUDENT : au moindre doute (pas de fond sombre net, du texte hors de la région claire, autre objet clair) la réponse est
 * `null` et l'image n'est ni recadrée ni masquée : on ne perd jamais une partie de la pièce pour la découper mieux.
 */
export function trouverPapierDetaille(bitmap: Bitmap): { papier: Papier | null; raison: string } {
  const refus = (raison: string) => ({ papier: null, raison });
  const { width: W, height: H, gray } = bitmap;
  if (W < 8 || H < 8) return refus('image trop petite');
  const f = Math.max(2, Math.round(Math.min(W, H) / 150));
  const bw = Math.ceil(W / f), bh = Math.ceil(H / f), nb = bw * bh;
  const moyenne = new Uint8Array(nb), ecart = new Uint8Array(nb), histogramme = new Uint32Array(256);
  for (let by = 0; by < bh; by++) {
    for (let bx = 0; bx < bw; bx++) {
      let somme = 0, n = 0, min = 255, max = 0;
      for (let y = by * f; y < Math.min(H, (by + 1) * f); y++) {
        for (let x = bx * f, i = y * W + bx * f; x < Math.min(W, (bx + 1) * f); x++, i++) { const v = gray[i]; somme += v; n++; if (v < min) min = v; if (v > max) max = v; }
      }
      const m = Math.round(somme / n);
      moyenne[by * bw + bx] = m; ecart[by * bw + bx] = max - min; histogramme[m]++;
    }
  }
  const { seuil, bas, haut } = otsu(histogramme);
  if (haut - bas < 60) return refus(`pas de fond sombre net (${Math.round(bas)} / ${Math.round(haut)})`);
  // La plus grande région claire (4-connexe).
  const etiquette = new Int32Array(nb), file = new Int32Array(nb);
  let meilleurId = 0, meilleureAire = 0, id = 0;
  for (let depart = 0; depart < nb; depart++) {
    if (etiquette[depart] || moyenne[depart] <= seuil) continue;
    id++;
    let tete = 0, queue = 0, aire = 0;
    file[queue++] = depart; etiquette[depart] = id;
    while (tete < queue) {
      const b = file[tete++]; aire++;
      const bx = b % bw, by = (b - bx) / bw;
      const voisins = [bx > 0 ? b - 1 : -1, bx < bw - 1 ? b + 1 : -1, by > 0 ? b - bw : -1, by < bh - 1 ? b + bw : -1];
      for (const v of voisins) if (v >= 0 && !etiquette[v] && moyenne[v] > seuil) { etiquette[v] = id; file[queue++] = v; }
    }
    if (aire > meilleureAire) { meilleureAire = aire; meilleurId = id; }
  }
  if (!meilleurId) return refus('aucune région claire');
  const intervalles = new Int32Array(2 * bh).fill(0);
  let gauche = bw, droite = -1, haute = bh, basse = -1, couvert = 0;
  for (let by = 0; by < bh; by++) {
    let l = bw, r = -1;
    for (let bx = 0; bx < bw; bx++) if (etiquette[by * bw + bx] === meilleurId) { if (bx < l) l = bx; r = bx; }
    intervalles[2 * by] = l; intervalles[2 * by + 1] = r;
    if (r >= l) { couvert += r - l + 1; gauche = Math.min(gauche, l); droite = Math.max(droite, r); haute = Math.min(haute, by); basse = by; }
  }
  // Un ticket étroit sur une grande table ne couvre que quelques pour cent de la photo (ses tickets du 03.11 : 19 %).
  if (couvert < 0.03 * nb) return refus(`papier trop petit (${Math.round(100 * couvert / nb)} % de l'image)`);
  if (couvert < 0.45 * (droite - gauche + 1) * (basse - haute + 1)) return refus('région claire trop creuse');
  // Hors du papier : un vrai fond (assez de blocs, sombre, sans texte, sans autre objet clair).
  let dehors = 0, textes = 0, clairs = 0;
  const ecartTexte = Math.max(70, 0.45 * (haut - bas));
  for (let by = 0; by < bh; by++) {
    const l = intervalles[2 * by], r = intervalles[2 * by + 1];
    for (let bx = 0; bx < bw; bx++) {
      if (r >= l && bx >= l && bx <= r) continue;
      dehors++;
      if (ecart[by * bw + bx] > ecartTexte) textes++;
      if (moyenne[by * bw + bx] > seuil) clairs++;
    }
  }
  if (dehors < 0.03 * nb) return refus('presque pas de fond');
  if (clairs > 0.25 * dehors) return refus(`autre objet clair (${Math.round(100 * clairs / dehors)} % du fond)`);
  // La forme et la pente du papier : moments d'ordre 2 de la région claire (un rectangle de côtés a ≥ b : variances a²/12 et b²/12).
  let n = 0, mx = 0, my = 0;
  for (let b = 0; b < nb; b++) if (etiquette[b] === meilleurId) { n++; mx += b % bw; my += Math.floor(b / bw); }
  mx /= n; my /= n;
  let sxx = 0, syy = 0, sxy = 0;
  for (let b = 0; b < nb; b++) if (etiquette[b] === meilleurId) { const dx = b % bw - mx, dy = Math.floor(b / bw) - my; sxx += dx * dx; syy += dy * dy; sxy += dx * dy; }
  const demiTrace = (sxx + syy) / 2, racine = Math.sqrt(((sxx - syy) / 2) ** 2 + sxy * sxy);
  const rapport = Math.sqrt((demiTrace + racine) / Math.max(1e-9, demiTrace - racine));
  // L'axe long (y vers le bas) : 90° + pente pour un papier haut, la pente elle-même pour un papier large ; ramenée dans [−90°, 90°).
  const axe = 0.5 * Math.atan2(2 * sxy, sxx - syy) * 180 / Math.PI;
  const pente = (((syy >= sxx ? axe - 90 : axe) % 180) + 270) % 180 - 90;
  const x = gauche * f, y = haute * f;
  return {
    papier: { boite: { x, y, w: Math.min(W, (droite + 1) * f) - x, h: Math.min(H, (basse + 1) * f) - y }, intervalles, f, bw, bh, rapport, angle: rapport >= 1.3 && Math.abs(pente) <= 45 ? Number(pente.toFixed(2)) : null },
    raison: 'papier trouvé',
  };
}
/** Le papier, ou `null` (voir `trouverPapierDetaille`, qui dit pourquoi). */
export function trouverPapier(bitmap: Bitmap): Papier | null {
  return trouverPapierDetaille(bitmap).papier;
}

/** Le papier d'une image redressée par ses coins : le rectangle `r` lui-même, en blocs comme `trouverPapier` (une image w × h). */
export function papierDuCadre(r: Rect, w: number, h: number): Papier {
  const f = Math.max(2, Math.round(Math.min(w, h) / 150)), bw = Math.ceil(w / f), bh = Math.ceil(h / f), intervalles = new Int32Array(2 * bh);
  const l = Math.ceil(r.x / f), d = Math.floor((r.x + r.w) / f) - 1;
  for (let by = 0; by < bh; by++) {
    const dedans = by * f >= r.y && (by + 1) * f <= r.y + r.h;
    intervalles[2 * by] = dedans ? l : bw; intervalles[2 * by + 1] = dedans ? d : -1;
  }
  return { boite: r, intervalles, f, bw, bh, rapport: Math.max(r.w, r.h) / Math.max(1, Math.min(r.w, r.h)), angle: null };
}

/** L'intérieur du papier (un bloc retiré de chaque bord, rangées de blocs pleines entre deux pleines) sur une image w × h placée en (dx, dy) de son repère. */
function dedansDuPapier(papier: Papier, w: number, h: number, dx: number, dy: number): Uint8Array {
  const dedans = new Uint8Array(w * h), f = papier.f, plein = (by: number) => by >= 0 && by < papier.bh && papier.intervalles[2 * by + 1] >= papier.intervalles[2 * by];
  for (let by = 1; by < papier.bh - 1; by++) {
    if (!plein(by - 1) || !plein(by) || !plein(by + 1)) continue;
    const a = (papier.intervalles[2 * by] + 1) * f - dx, b = papier.intervalles[2 * by + 1] * f - dx;
    if (b <= a) continue;
    for (let y = Math.max(0, by * f - dy); y < Math.min(h, (by + 1) * f - dy); y++) dedans.fill(1, y * w + clamp(a, 0, w), y * w + clamp(b, 0, w));
  }
  return dedans;
}


/** Le recadrage autour du papier (boîte + marge de 1,5 %), ou l'image entière si elle n'enlève pas au moins 8 % de la surface. */
export function recadrageDe(papier: Papier | null, width: number, height: number): Rect {
  const entier = { x: 0, y: 0, w: width, h: height };
  if (!papier) return entier;
  const marge = Math.round(0.015 * Math.max(width, height));
  const x = Math.max(0, papier.boite.x - marge), y = Math.max(0, papier.boite.y - marge);
  const w = Math.min(width, papier.boite.x + papier.boite.w + marge) - x, h = Math.min(height, papier.boite.y + papier.boite.h + marge) - y;
  return w * h <= 0.92 * width * height ? { x, y, w, h } : entier;
}

/** Une copie du gris où tout ce qui est hors du papier est blanc : le fond (table, ombre du bord) n'est ainsi jamais de l'encre. */
export function remplirHorsPapier(bitmap: Bitmap, papier: Papier): Uint8Array {
  const { width: W, height: H } = bitmap, sortie = bitmap.gray.slice();
  for (let y = 0; y < H; y++) {
    const by = Math.min(papier.bh - 1, Math.floor(y / papier.f)), l = papier.intervalles[2 * by], r = papier.intervalles[2 * by + 1];
    const ligne = y * W;
    if (r < l) { sortie.fill(255, ligne, ligne + W); continue; }
    // Un bloc de moins de chaque côté : le bord du papier (un bloc à cheval sur la table) ne doit pas laisser un liseré d'encre sur toute la hauteur.
    const gauche = r - l >= 2 ? l + 1 : l, droite = r - l >= 2 ? r - 1 : r;
    sortie.fill(255, ligne, ligne + Math.min(W, gauche * papier.f));
    sortie.fill(255, ligne + Math.min(W, (droite + 1) * papier.f), ligne + W);
  }
  return sortie;
}

/** Largeur d'une colonne de l'estimation de l'angle, en pixels. */
const COLONNE_ANGLE = 250;

/**
 * L'angle du texte, en degrés dans [−5, 5], au 0,05° : d'abord, par pas de 0,25, celui qui rend le plus contrasté le profil d'encre des rangées, calculé COLONNE PAR
 * COLONNE (≈ 250 px) puis sommé. Un profil global alignerait à tort deux colonnes du document décalées d'une ligne (le nom sur une ligne, les montants
 * sur la suivante : facture droite vue « penchée », pièges du 03.11) ; dans une colonne, seule la pente des lignes elles-mêmes compte. Image réduite
 * (blocs) pour rester rapide. Puis l'affinage sur toute la largeur (voir plus bas). Sans encre, ou sans gain sur 0°, rend 0 : jamais un redressement sans preuve.
 */
export function estimerAngle(ink: Uint8Array, w: number, h: number, autour: number | null = null): number {
  const r = Math.max(1, Math.floor(w / 400));
  const bw = Math.ceil(w / r), bh = Math.ceil(h / r), colonnes = Math.max(1, Math.round(w / COLONNE_ANGLE));
  const xs: number[] = [], ys: number[] = [], ps: number[] = [], cs: number[] = [];
  for (let by = 0; by < bh; by++) {
    for (let bx = 0; bx < bw; bx++) {
      let n = 0;
      for (let y = by * r; y < Math.min(h, (by + 1) * r); y++) for (let x = bx * r, i = y * w + bx * r; x < Math.min(w, (bx + 1) * r); x++, i++) n += ink[i];
      if (n) { xs.push(bx * r + r / 2 - w / 2); ys.push(by * r + r / 2 - h / 2); ps.push(n); cs.push(Math.min(colonnes - 1, Math.floor((bx * r * colonnes) / w))); }
    }
  }
  if (xs.length < 20) return 0;
  const bacs = Math.ceil(Math.hypot(w, h) / r) + 4, decalage = Math.hypot(w, h) / 2;
  const score = (degres: number, parColonne: boolean) => {
    const k = parColonne ? colonnes : 1, rad = degres * Math.PI / 180, s = Math.sin(rad), c = Math.cos(rad), profil = new Float64Array(bacs * k);
    for (let i = 0; i < xs.length; i++) profil[Math.floor((-xs[i] * s + ys[i] * c + decalage) / r) * k + (parColonne ? cs[i] : 0)] += ps[i];
    let total = 0;
    for (let i = 0; i < profil.length; i++) total += profil[i] * profil[i];
    return total;
  };
  // 1. Grossier, par colonnes, sur ±5° et, si le papier lui-même penche davantage (`autour`, sa pente), sur ±5° autour de sa pente (ticket posé de
  // travers, jusqu'à ±30° : ses photos du 03.11) : aucune fausse pente entre colonnes décalées.
  const plages: Array<[number, number]> = [[-ANGLE_MAX, ANGLE_MAX]];
  if (autour !== null && Math.abs(autour) > ANGLE_MAX - 1 && Math.abs(autour) <= ANGLE_PAPIER_MAX) plages.push([Math.round(autour / ANGLE_PAS) * ANGLE_PAS - ANGLE_MAX, Math.round(autour / ANGLE_PAS) * ANGLE_PAS + ANGLE_MAX]);
  const limite = Math.max(...plages.map(([a, b]) => Math.max(Math.abs(a), Math.abs(b))));
  let grossier = 0, meilleurGrossier = score(0, true);
  for (const [debut, fin] of plages) for (let a = debut; a <= fin + 1e-9; a += ANGLE_PAS) {
    const s = score(a, true);
    if (s > meilleurGrossier * (1 + 1e-9)) { grossier = a; meilleurGrossier = s; }
  }
  // 2. Fin, au 0,05°, sur toute la largeur mais à ±0,4° du grossier seulement : la largeur entière mesure les petites pentes (0,5° sur 1 100 px
  // décalent la ligne de 10 px : pièges du 03.11, une ligne coupée à chaque coupe), et une fausse pente entre colonnes (≥ 0,6° pour un pas de 12 px
  // sur 1 200 px) reste hors de portée.
  let fin = grossier, meilleurFin = score(grossier, false);
  for (let a = grossier - ANGLE_AFFINE; a <= grossier + ANGLE_AFFINE + 1e-9; a += ANGLE_PAS_FIN) {
    if (Math.abs(a) > limite + 1e-9) continue;
    const s = score(a, false);
    if (s > meilleurFin * (1 + 1e-9)) { fin = a; meilleurFin = s; }
  }
  const arrondi = Math.round(fin / ANGLE_PAS_FIN) * ANGLE_PAS_FIN;
  return Math.abs(arrondi) < ANGLE_PAS_FIN / 2 || meilleurFin <= score(0, false) ? 0 : Number(arrondi.toFixed(2));
}
/**
 * Applique à un canal (gris, ou masque) la même transformation que le dessin des morceaux : recadrage `crop` puis rotation de `angle` autour de son centre
 * (convention en tête de fichier). Sortie de taille crop.w × crop.h. Hors de l'image : le BORD ÉTENDU (le pixel de bord le plus proche), comme le dessin ;
 * `vide` donné (0 pour un masque) : cette valeur. Un remplissage uni ferait de faux bords de papier ou d'encre là où le cadre redressé déborde (piège
 * h0005 : des coins blancs sur la table, le seuil d'encre de 27 à 77, le texte pâle perdu). `plusProche` : plus proche voisin (masques, jamais de valeur
 * intermédiaire) ; sinon interpolation bilinéaire.
 */
export function normaliser(canal: Uint8Array, w: number, h: number, analyse: { crop: Rect; angle: number }, options: { plusProche?: boolean; vide?: number } = {}): Uint8Array {
  const { crop, angle } = analyse, cw = crop.w, ch = crop.h, vide = options.vide;
  const sortie = new Uint8Array(cw * ch);
  const hors = (x: number, y: number) => (vide !== undefined ? vide : canal[clamp(y, 0, h - 1) * w + clamp(x, 0, w - 1)]);
  if (angle === 0) {
    for (let v = 0; v < ch; v++) {
      const y = crop.y + v;
      for (let u = 0; u < cw; u++) { const x = crop.x + u; sortie[v * cw + u] = x >= 0 && x < w && y >= 0 && y < h ? canal[y * w + x] : hors(x, y); }
    }
    return sortie;
  }
  const rad = angle * Math.PI / 180, c = Math.cos(rad), s = Math.sin(rad);
  const ox = (cw - 1) / 2, oy = (ch - 1) / 2, cx = crop.x + ox, cy = crop.y + oy;
  for (let v = 0; v < ch; v++) {
    const dv = v - oy;
    for (let u = 0; u < cw; u++) {
      const du = u - ox, x = cx + du * c - dv * s, y = cy + du * s + dv * c, i = v * cw + u;
      if (options.plusProche) {
        const xi = Math.round(x), yi = Math.round(y);
        sortie[i] = xi >= 0 && xi < w && yi >= 0 && yi < h ? canal[yi * w + xi] : hors(xi, yi);
        continue;
      }
      if (vide !== undefined && (x < -0.5 || x > w - 0.5 || y < -0.5 || y > h - 0.5)) { sortie[i] = vide; continue; }
      const xc = clamp(x, 0, w - 1), yc = clamp(y, 0, h - 1), x0 = Math.floor(xc), y0 = Math.floor(yc), x1 = Math.min(w - 1, x0 + 1), y1 = Math.min(h - 1, y0 + 1), fx = xc - x0, fy = yc - y0;
      const haut = canal[y0 * w + x0] * (1 - fx) + canal[y0 * w + x1] * fx, bas = canal[y1 * w + x0] * (1 - fx) + canal[y1 * w + x1] * fx;
      sortie[i] = Math.round(haut * (1 - fy) + bas * fy);
    }
  }
  return sortie;
}

export interface Analyse {
  /** Le recadrage (pixels de la source) : le papier + marge, ou l'image entière. */
  crop: Rect;
  /** Degrés, voir la convention en tête de fichier. */
  angle: number;
  /** Les morceaux, en rangées de l'image NORMALISÉE (recadrée, tournée). */
  morceaux: Morceau[];
  /** La part d'encre de chaque rangée de l'image normalisée. */
  rangees: number[];
  largeur: number;
  hauteur: number;
  /** Vrai si un fond sombre autour du papier a été reconnu. */
  papier: boolean;
  /** Les colonnes [x0, x1) où les rangées blanches ont été mesurées (la largeur du papier), ou `null` : toute la largeur. */
  colonnes: [number, number] | null;
  /** Passe finale avec un papier : sa boîte grandie de tout texte voisin (`boiteGrandie`), ou `null`. */
  boiteTexte: Rect | null;
}
export interface OptionsAnalyse {
  /** Chercher le papier sur un fond sombre (défaut : oui) ; ou le papier déjà connu (`papierDuCadre` : l'image redressée par ses coins). */
  papier?: boolean | Papier;
  /** Recadrer sur le papier (défaut : oui) ; non : le fond est masqué pour l'analyse, mais l'image garde ses dimensions. */
  recadrer?: boolean;
  /** Chercher l'angle (défaut : oui). */
  redresser?: boolean;
  maxLines?: number;
}

/**
 * Le recadrage SÛR : la boîte du papier, puis, côté par côté, chaque bande voisine (2 pas de ligne) où l'encre nette est aussi dense qu'un texte (au
 * moins le quart de la densité du papier) rejoint le cadre, jusqu'à ce qu'aucun côté ne grandisse ; puis la marge (voir `recadrageDe`). Une ombre forte
 * prise pour la table, un coin de la pièce hors de la région claire : leur texte continue celui du papier et reste dans le cadre (pièges du 03.11 : 15
 * à 45 lignes perdues). La texture d'un tissu ou d'une table, clairsemée, reste dehors (ses tickets du 03.11, posés sur un tissu sombre).
 */
export function recadrageSur(papier: Papier | null, ink: Uint8Array, width: number, height: number, pas: number | null = null, coupe: Uint8Array = ink): Rect {
  if (!papier) return { x: 0, y: 0, w: width, h: height };
  return recadrageDe({ ...papier, boite: boiteGrandie(papier, ink, width, height, pas, coupe) }, width, height);
}

/** La boîte du papier grandie, côté par côté, des bandes voisines d'encre dense comme un texte (voir `recadrageSur`), sans marge. */
/** L'image intégrale d'une carte d'encre (0/1) et la densité d'un rectangle en O(1). */
function densites(carte: Uint8Array, width: number, height: number): (ax: number, ay: number, bx: number, by: number) => number {
  const W1 = width + 1, integrale = new Uint32Array(W1 * (height + 1));
  for (let y = 0; y < height; y++) {
    let ligne = 0;
    for (let x = 0; x < width; x++) { ligne += carte[y * width + x]; integrale[(y + 1) * W1 + x + 1] = integrale[y * W1 + x + 1] + ligne; }
  }
  return (ax, ay, bx, by) => {
    ax = clamp(Math.round(ax), 0, width); bx = clamp(Math.round(bx), 0, width); ay = clamp(Math.round(ay), 0, height); by = clamp(Math.round(by), 0, height);
    const aire = (bx - ax) * (by - ay);
    return aire > 0 ? (integrale[by * W1 + bx] - integrale[ay * W1 + bx] - integrale[by * W1 + ax] + integrale[ay * W1 + ax]) / aire : 0;
  };
}

/** La densité d'une carte sur le papier lui-même (ses intervalles par rangée de blocs), jamais sur le fond de sa boîte (papier penché). */
function densiteDuPapier(papier: Papier, densite: (ax: number, ay: number, bx: number, by: number) => number): number {
  let encre = 0, aire = 0;
  for (let by = 0; by < papier.bh; by++) {
    const l = papier.intervalles[2 * by], r = papier.intervalles[2 * by + 1];
    if (r < l) continue;
    const a = (r + 1 - l) * papier.f * papier.f;
    encre += densite(l * papier.f, by * papier.f, (r + 1) * papier.f, (by + 1) * papier.f) * a; aire += a;
  }
  return aire ? encre / aire : 0;
}

export function boiteGrandie(papier: Papier, ink: Uint8Array, width: number, height: number, pas: number | null = null, coupe: Uint8Array = ink): Rect {
  const nette = densites(ink, width, height), sensible = coupe === ink ? nette : densites(coupe, width, height);
  // Le profil des rangées [ay, by) de l'encre SENSIBLE sur les colonnes [ax, bx) : une ombre baisse le contraste sous le seuil net, pas sa forme.
  const profil = (ax: number, ay: number, bx: number, by: number) => {
    ax = clamp(Math.round(ax), 0, width); bx = clamp(Math.round(bx), 0, width); ay = clamp(Math.round(ay), 0, height); by = clamp(Math.round(by), 0, height);
    const p: number[] = [];
    for (let y = ay; y < by; y++) { let n = 0; for (let x = ax, i = y * width + ax; x < bx; x++, i++) n += coupe[i]; p.push(bx > ax ? n / (bx - ax) : 0); }
    return p;
  };
  const correlation = (a: number[], b: number[]) => {
    const n = Math.min(a.length, b.length);
    if (n < 4) return 0;
    let ma = 0, mb = 0;
    for (let i = 0; i < n; i++) { ma += a[i]; mb += b[i]; }
    ma /= n; mb /= n;
    let sab = 0, saa = 0, sbb = 0;
    for (let i = 0; i < n; i++) { const da = a[i] - ma, db = b[i] - mb; sab += da * db; saa += da * da; sbb += db * db; }
    return saa > 1e-12 && sbb > 1e-12 ? sab / Math.sqrt(saa * sbb) : 0;
  };
  // Des lignes de texte, vues de haut en bas : des rangées encrées ET des rangées blanches qui alternent (un tissu, une table : tout encré ; une marge :
  // tout blanc).
  const desLignes = (p: number[]) => {
    if (!p.length) return false;
    const encrees = p.filter(v => v > EMPTY_ROW_MAX).length / p.length;
    return encrees >= 0.25 && encrees <= 0.85;
  };
  let x0 = papier.boite.x, y0 = papier.boite.y, x1 = x0 + papier.boite.w, y1 = y0 + papier.boite.h;
  const d = Math.max(8, Math.round(2 * (pas ?? Math.max(width, height) / 60)));
  // Les densités du texte du papier : une bande voisine doit en approcher (le quart au moins) ; des grains de tissu clairsemés, jamais.
  const seuilNet = Math.max(0.008, 0.25 * densiteDuPapier(papier, nette)), seuilSensible = Math.max(0.008, 0.25 * densiteDuPapier(papier, sensible));
  // Un côté grandit si la bande voisine a la densité d'un texte (encre nette), ou si, assez dense en encre sensible, elle continue les lignes du papier :
  // sur un côté, mêmes rangées encrées que la bande intérieure ; en haut ou en bas, des lignes qui alternent avec des blancs.
  const lateral = (dehors: [number, number], dedans: [number, number]) =>
    nette(dehors[0], y0, dehors[1], y1) >= seuilNet
    || (sensible(dehors[0], y0, dehors[1], y1) >= seuilSensible && correlation(profil(dehors[0], y0, dehors[1], y1), profil(dedans[0], y0, dedans[1], y1)) >= 0.5);
  const vertical = (ay: number, by: number) => nette(x0, ay, x1, by) >= seuilNet || (sensible(x0, ay, x1, by) >= seuilSensible && desLignes(profil(x0, ay, x1, by)));
  for (let tour = 0; tour < 400; tour++) {
    let grandi = false;
    if (x0 > 0 && lateral([x0 - d, x0], [x0, x0 + d])) { x0 = Math.max(0, x0 - d); grandi = true; }
    if (x1 < width && lateral([x1, x1 + d], [x1 - d, x1])) { x1 = Math.min(width, x1 + d); grandi = true; }
    if (y0 > 0 && vertical(y0 - d, y0)) { y0 = Math.max(0, y0 - d); grandi = true; }
    if (y1 < height && vertical(y1, y1 + d)) { y1 = Math.min(height, y1 + d); grandi = true; }
    if (!grandi) break;
  }
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}


/**
 * Le cadre (largeur, hauteur, au moins w × h) qui garde TOUTE l'encre `ink` (image w × h) une fois tournée de `angle` autour du centre : redresser ne
 * rogne jamais un coin de texte (pièges du 03.11 : 61 lignes rognées par un faux angle de 5°).
 */
export function cadrePourAngle(ink: Uint8Array, w: number, h: number, angle: number): { w: number; h: number } {
  const rad = angle * Math.PI / 180, c = Math.cos(rad), s = Math.sin(rad), ox = (w - 1) / 2, oy = (h - 1) / 2;
  let du = 0, dv = 0;
  for (let y = 0; y < h; y++) {
    const dy = y - oy;
    for (let x = 0, i = y * w; x < w; x++, i++) {
      if (!ink[i]) continue;
      const dx = x - ox;
      du = Math.max(du, Math.abs(dx * c + dy * s)); dv = Math.max(dv, Math.abs(-dx * s + dy * c));
    }
  }
  // Deux pixels de plus quand le cadre grandit : l'interpolation du dessin déborde d'un pixel.
  const besoin = (d: number, n: number) => (Math.ceil(2 * d + 1) > n ? Math.ceil(2 * d + 1) + 2 : n);
  return { w: besoin(du, w), h: besoin(dv, h) };
}

/** Le cadre (pixels de la source) du rectangle `sous` de la vue redressée `crop` (tournée de `angle`) : même centre de rotation que `normaliser`. */
export function sousCadre(crop: Rect, angle: number, sous: Rect): Rect {
  const rad = angle * Math.PI / 180, c = Math.cos(rad), s = Math.sin(rad);
  const du = sous.x + (sous.w - 1) / 2 - (crop.w - 1) / 2, dv = sous.y + (sous.h - 1) / 2 - (crop.h - 1) / 2;
  const cx = crop.x + (crop.w - 1) / 2 + du * c - dv * s, cy = crop.y + (crop.h - 1) / 2 + du * s + dv * c;
  return { x: cx - (sous.w - 1) / 2, y: cy - (sous.h - 1) / 2, w: sous.w, h: sous.h };
}

/** Examine une image : papier (recadrage seulement, jamais de masque), angle, puis les morceaux (`planMorceaux` sur l'encre de l'image normalisée). */
export function analyser(bitmap: Bitmap, options: OptionsAnalyse = {}): Analyse {
  const { width: W, height: H } = bitmap;
  const papier = typeof options.papier === 'object' ? options.papier : options.papier === false ? null : trouverPapier(bitmap), clair = papier !== null || options.papier === true;
  const vue = (c: Rect, angle: number): Bitmap => ({ width: c.w, height: c.h, gray: normaliser(bitmap.gray, W, H, { crop: c, angle }) });
  const entiere = encreDetaillee(bitmap, papier, 0, 0, clair);
  let crop = options.recadrer === false ? { x: 0, y: 0, w: W, h: H } : recadrageSur(papier, entiere.ink, W, H, entiere.pas, entiere.coupe);
  let encre = crop.w === W && crop.h === H ? entiere : encreDetaillee(vue(crop, 0), papier, crop.x, crop.y, clair), angle = 0;
  if (options.redresser !== false) {
    angle = estimerAngle(encre.ink, crop.w, crop.h, papier?.angle ?? null);
    if (angle !== 0) {
      const cadre = cadrePourAngle(encre.coupe, crop.w, crop.h, angle);
      crop = { x: crop.x - Math.floor((cadre.w - crop.w) / 2), y: crop.y - Math.floor((cadre.h - crop.h) / 2), w: cadre.w, h: cadre.h };
      // Redressée, la pièce se recadre comme une pièce droite : son papier y est cherché de nouveau, et la boîte grandit sur des lignes de texte enfin
      // horizontales. Penchée, sa boîte droite contenait le tissu des coins, et le cadre l'avalait (ses tickets du 03.11 : 1 600 px de large pour un
      // ticket de 560, le texte réduit à 0,69).
      const droite = vue(crop, angle), papierDroit = papier ? trouverPapier(droite) : null;
      encre = encreDetaillee(droite, papierDroit, 0, 0, clair);
      if (papierDroit && options.recadrer !== false) {
        const sous = recadrageSur(papierDroit, encre.ink, crop.w, crop.h, encre.pas, encre.coupe);
        if (sous.w < crop.w || sous.h < crop.h) {
          crop = sousCadre(crop, angle, sous);
          encre = encreDetaillee(vue(crop, angle), papierDroit, sous.x, sous.y, clair);
        }
      }
    }
  }
  // Sans recadrage (la passe finale, sur l'image déjà droite) : les rangées blanches se mesurent sur la largeur du papier seulement (bord intérieur d'un
  // bloc retiré), jamais sur la table ou le tissu autour, dont la texture encrerait toutes les rangées (ses tickets du 03.11).
  // Le pas des lignes, pour la taille des morceaux : celui de l'encre nette, dont les interlignes restent blancs. Sur la carte des coupes, plus sensible,
  // des interlignes serrés s'encrent et le pas double (ses tickets du 03.11 : 42 à 46 px pour 25 à 28), donc des morceaux de 40 lignes et plus.
  let rangees = encre.rangees, colonnes: [number, number] | null = null, pas = encre.pas, boiteTexte: Rect | null = null;
  if (papier && options.recadrer === false) {
    // Toute la largeur de la boîte grandie, bord retiré : jamais l'intervalle du papier rangée par rangée, qui laisse dehors le texte à l'ombre (le
    // papier y est trop sombre pour la région claire : pièges h0016, h0062… coupés en silence).
    const b = boiteGrandie(papier, encre.ink, crop.w, crop.h, encre.pas, encre.coupe), retrait = papier.f + 2;
    boiteTexte = b;
    const x0 = Math.max(0, b.x + retrait), x1 = Math.min(crop.w, b.x + b.w - retrait);
    if (x1 - x0 >= 0.2 * crop.w) {
      rangees = partParRangee(encre.coupe, crop.w, crop.h, x0, x1); colonnes = [x0, x1];
      pas = linePitch(partParRangee(encre.ink, crop.w, crop.h, x0, x1)) ?? pas;
    }
  }
  const morceaux = planMorceaux(rangees, crop.w, { maxLines: options.maxLines ?? BAND_MAX_LINES, pitch: pas });
  return { crop, angle, morceaux, rangees, largeur: crop.w, hauteur: crop.h, papier: papier !== null, colonnes, boiteTexte };
}

/** Le nombre de rangées de texte d'une page PDF : les ordonnées distinctes des morceaux de texte (écart de plus de `tolerance` points = autre rangée). */
export function compterRangees(ordonnees: number[], tolerance = 2): number {
  const tri = ordonnees.filter(Number.isFinite).sort((a, b) => a - b);
  let n = 0, dernier = -Infinity;
  for (const y of tri) { if (y - dernier > tolerance) n++; dernier = y; }
  return n;
}

/** La coupe basse du morceau `m` (avec le suivant) traverse-t-elle une ligne ? Faux pour le dernier : il n'a pas de voisin. */
export function coupeBasseForcee(m: Morceau, rangees: number[], dernier: boolean): boolean {
  return !dernier && (rangees[m.bottom - 1] ?? 0) > EMPTY_ROW_MAX;
}

// ---------------------------------------------------------------------------------------------------------------------
// 2. NAVIGATEUR : canvas, pdf.js
// ---------------------------------------------------------------------------------------------------------------------

/** Où est l'image normalisée dans la source : centre du recadrage, angle, échelle, taille de sortie. */
export interface Geometrie { cx: number; cy: number; angle: number; echelle: number; largeur: number; hauteur: number }

const creerCanevas = (w: number, h: number): HTMLCanvasElement => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const contexte2d = (c: HTMLCanvasElement, lecture = false): CanvasRenderingContext2D => {
  const ctx = c.getContext('2d', lecture ? { willReadFrequently: true } : undefined);
  if (!ctx) throw new Error('canevas indisponible');
  return ctx;
};
function grisDe(pixels: ImageData): Uint8Array {
  const rgba = pixels.data, gris = new Uint8Array(pixels.width * pixels.height);
  for (let i = 0, j = 0; i < gris.length; i++, j += 4) gris[i] = (rgba[j] * 77 + rgba[j + 1] * 150 + rgba[j + 2] * 29) >> 8;
  return gris;
}

/**
 * Dessine les rangées [y0, y0 + hauteur du canevas) de l'image normalisée : même transformation que `normaliser`, bord étendu hors de l'image (ses
 * pixels de bord, étirés, puis l'image par-dessus : aucune couture). `lisser` faux : plus proche
 * voisin (le banc D381 y dessine le masque des pièges, couleurs exactes).
 */
export function dessinerNormalise(canevas: HTMLCanvasElement, source: ImageBitmap | HTMLCanvasElement, g: Geometrie, y0: number, lisser = true): CanvasRenderingContext2D {
  const ctx = contexte2d(canevas, true);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canevas.width, canevas.height);
  ctx.imageSmoothingEnabled = lisser; if (lisser) ctx.imageSmoothingQuality = 'high';
  ctx.translate(g.largeur / 2, g.hauteur / 2 - y0);
  ctx.scale(g.echelle, g.echelle);
  ctx.rotate(-g.angle * Math.PI / 180);
  ctx.translate(-g.cx, -g.cy);
  // Le bord étendu : les colonnes et rangées de bord, puis les coins, étirés au loin (même transformation) ; l'image par-dessus, sans couture.
  const W = source.width, H = source.height, L = 4 * Math.max(W, H);
  ctx.drawImage(source, 0, 0, 1, H, -L, 0, L, H); ctx.drawImage(source, W - 1, 0, 1, H, W, 0, L, H);
  ctx.drawImage(source, 0, 0, W, 1, 0, -L, W, L); ctx.drawImage(source, 0, H - 1, W, 1, 0, H, W, L);
  ctx.drawImage(source, 0, 0, 1, 1, -L, -L, L, L); ctx.drawImage(source, W - 1, 0, 1, 1, W, -L, L, L);
  ctx.drawImage(source, 0, H - 1, 1, 1, -L, H, L, L); ctx.drawImage(source, W - 1, H - 1, 1, 1, W, H, L, L);
  ctx.drawImage(source, 0, 0);
  return ctx;
}

/** Le gris de toute l'image normalisée, par bandes (jamais un canevas de la hauteur d'un ticket entier : limite mémoire des téléphones). */
function grisNormalise(source: ImageBitmap | HTMLCanvasElement, g: Geometrie): Bitmap {
  const gris = new Uint8Array(g.largeur * g.hauteur), bande = 1024;
  const canevas = creerCanevas(g.largeur, Math.min(bande, g.hauteur));
  for (let y0 = 0; y0 < g.hauteur; y0 += bande) {
    const h = Math.min(bande, g.hauteur - y0);
    if (canevas.height !== h) canevas.height = h;
    const ctx = dessinerNormalise(canevas, source, g, y0);
    gris.set(grisDe(ctx.getImageData(0, 0, g.largeur, h)), y0 * g.largeur);
  }
  canevas.width = 0; canevas.height = 0;
  return { width: g.largeur, height: g.hauteur, gray: gris };
}

/**
 * Un morceau : sa zone propre [top, bottom) de l'image normalisée, seule (pilote, 03.11 : l'IA ne marque pas fiablement la zone des voisins, donc ni
 * voisins, ni teinte, ni trait). Les coupes tombent sur des rangées blanches ; une coupe qui traverse une ligne est signalée par `coupeForcee`.
 */
function dessinerZone(source: ImageBitmap | HTMLCanvasElement, g: Geometrie, top: number, bottom: number): string {
  const canevas = creerCanevas(g.largeur, Math.max(1, bottom - top));
  dessinerNormalise(canevas, source, g, top);
  const url = canevas.toDataURL('image/jpeg', QUALITE_JPEG);
  canevas.width = 0; canevas.height = 0;
  return url.slice(url.indexOf(',') + 1);
}

/** Une bande de contrôle brute : `k` est le rang LOCAL (dans l'image ou la page) de la coupe sous le morceau k ; `data` seul (le rang global vient après). */
type JonctionBrute = { k: number; data: string };
/** Dessine des zones [top, bottom) de l'image normalisée en JPEG (base64), dans l'ordre : par le canevas, ou par OpenCV (image redressée par ses coins). */
type Dessinateur = (zones: Array<[number, number]>) => Promise<string[]>;
const parCanevas = (source: ImageBitmap | HTMLCanvasElement, g: Geometrie): Dessinateur => async zones => zones.map(([t, b]) => dessinerZone(source, g, t, b));
/** Les parties d'une image normalisée (rang à compléter par l'appelant : plusieurs pages se suivent) et ses bandes de contrôle (D381 : une par coupe intérieure). */
async function partiesDe(a: Analyse, dessiner: Dessinateur): Promise<{ parties: Array<Omit<Partie, 'morceau'>>; jonctions: JonctionBrute[] }> {
  const bandes = planJonctions(a.morceaux, a.rangees).filter(j => j.bottom > j.top);
  const images = await dessiner([...a.morceaux.map((m): [number, number] => [m.top, m.bottom]), ...bandes.map((j): [number, number] => [j.top, j.bottom])]);
  return {
    parties: a.morceaux.map((m, i) => ({ file: { data: images[i], mimeType: 'image/jpeg' }, coupeForcee: coupeBasseForcee(m, a.rangees, i === a.morceaux.length - 1) })),
    jonctions: bandes.map((j, i) => ({ k: j.k, data: images[a.morceaux.length + i] })),
  };
}

/** Ce que `decouperPiece` rend : les morceaux, et par coupe intérieure sa bande de contrôle (lue à part) ou le saut de page d'un PDF (rien à recouper). */
export interface Decoupe { parties: Partie[]; jonctions: JonctionPiece[] }
export type JonctionPiece = { file: { data: string; mimeType: string }; jonction: { k: number; n: number } } | { k: number; sautDePage: true };

/**
 * Le plan d'une image : sa géométrie normalisée et l'analyse finale, faite sur les pixels mêmes qui seront dessinés. Deux voies :
 *  - `perspective` (OpenCV, `decoupePerspective.ts`) : le papier trouvé par ses 4 coins, redressé avec une marge ; la voie d'école, essayée d'abord ;
 *  - `g` (ce fichier) : recadrage sûr et angle du texte, quand la photo n'a pas de papier à 4 coins (capture, papier plein cadre), qu'OpenCV ne se
 *    charge pas, ou qu'un garde-fou refuse ses coins (`raison`).
 * `null` : rien à découper (pas assez haute sans `force`, ou un seul morceau). Exporté pour le banc D381 (masques des pièges).
 */
/** `opencv` : essayer la voie des coins (banc D381) ; `sansOmbre` : son image d'analyse divisée par le fond (normalisation d'éclairage). */
export interface OptionsPlan { opencv?: boolean; sansOmbre?: boolean }
export interface PlanImage { finale: Analyse; g: Geometrie | null; perspective: Perspective | null; raison: string }
export async function planifierImage(image: ImageBitmap, force: boolean, options: OptionsPlan = {}): Promise<PlanImage | null> {
  const plan = await planifierImageDetaille(image, force, options);
  return plan && plan.finale.morceaux.length >= 2 ? plan : null;
}
/** Comme `planifierImage`, même avec un seul morceau (`null` : le déclencheur ne part pas) : pour le banc. */
export async function planifierImageDetaille(image: ImageBitmap, force: boolean, options: OptionsPlan = {}): Promise<PlanImage | null> {
  const W = image.width, H = image.height;
  // Coup d'œil : l'image réduite (côté court ≈ 1 200 px) suffit au papier et à l'angle.
  const s = Math.min(1, 1200 / Math.min(W, H)), pw = Math.max(1, Math.round(W * s)), ph = Math.max(1, Math.round(H * s));
  const petit = creerCanevas(pw, ph);
  contexte2d(petit, true).drawImage(image, 0, 0, pw, ph);
  const reduit: Bitmap = { width: pw, height: ph, gray: grisDe(contexte2d(petit, true).getImageData(0, 0, pw, ph)) };
  petit.width = 0; petit.height = 0;
  if (!force) {
    // Haute : l'image recadrée, ou le papier lui-même (sa forme, même posé de travers : ses tickets penchés du 03.11).
    const papier = trouverPapier(reduit), r = recadrageDe(papier, pw, ph);
    if (Math.max(r.h / r.w, papier?.rapport ?? 0) <= RAPPORT_DECOUPE) return null;
  }
  // OpenCV seulement sur demande (le banc D381) : au 03.11, il ne bat pas encore cette voie sur le banc des 200 (97 coupes silencieuses contre 82).
  let raison = 'OpenCV non essayé';
  if (options.opencv === true) {
    try {
      const { planPerspective } = await import('./decoupePerspective');
      const r = await planPerspective(image, BAND_MAX_LINES, { sansOmbre: options.sansOmbre === true });
      if ('p' in r) return { finale: r.finale, g: null, perspective: r.p, raison: r.p.methode };
      raison = r.raison;
    } catch (e) { raison = `OpenCV indisponible : ${e instanceof Error ? e.message : String(e)}`; }
  }
  const coup = analyser(reduit, { maxLines: BAND_MAX_LINES });
  // Le cadre peut déborder de l'image (redressement sans rognure, `cadrePourAngle`) : le dessin y étend le bord (voir `normaliser`).
  const crop: Rect = { x: coup.crop.x / s, y: coup.crop.y / s, w: coup.crop.w / s, h: coup.crop.h / s };
  const echelle = Math.min(1, LARGEUR_MAX / crop.w);
  const g: Geometrie = { cx: crop.x + crop.w / 2, cy: crop.y + crop.h / 2, angle: coup.angle, echelle, largeur: Math.max(1, Math.round(crop.w * echelle)), hauteur: Math.max(1, Math.round(crop.h * echelle)) };
  // Le papier est cherché de nouveau dans l'image normalisée, pour mesurer les rangées blanches sur sa seule largeur.
  const finale = analyser(grisNormalise(image, g), { papier: coup.papier, redresser: false, recadrer: false, maxLines: BAND_MAX_LINES });
  return { finale, g, perspective: null, raison };
}

async function decouperImage(file: File | Blob, force: boolean): Promise<Decoupe | null> {
  const image = await createImageBitmap(file);
  let opencv = false;
  try {
    const plan = await planifierImage(image, force);
    if (!plan) return null;
    const { g, perspective, finale } = plan;
    let dessiner: Dessinateur;
    if (perspective) {
      const { zonesPerspective } = await import('./decoupePerspective');
      opencv = true;
      dessiner = zones => zonesPerspective(perspective, zones, QUALITE_JPEG);
    } else dessiner = parCanevas(image, g!);
    const dessin = await partiesDe(finale, dessiner), n = dessin.parties.length;
    return {
      parties: dessin.parties.map((p, i) => ({ ...p, morceau: { k: i + 1, n } })),
      jonctions: dessin.jonctions.map(j => ({ file: { data: j.data, mimeType: 'image/jpeg' }, jonction: { k: j.k, n } })),
    };
  } finally {
    image.close();
    if (opencv) void import('./decoupePerspective').then(m => m.libererPerspective());
  }
}

async function decouperPdf(file: File | Blob, force: boolean): Promise<Decoupe | null> {
  const pdfjs = await chargerPdfjs();
  const pdf = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()), isEvalSupported: false }).promise;
  try {
    const pages: number = pdf.numPages;
    if (!force && pages <= PDF_PAGES_MAX) {
      let rangees = 0;
      for (let p = 1; p <= pages; p++) {
        const page = await pdf.getPage(p);
        const texte = await page.getTextContent();
        rangees += compterRangees(texte.items.filter((i: any) => typeof i.str === 'string' && i.str.trim() !== '' && Array.isArray(i.transform)).map((i: any) => i.transform[5]));
        page.cleanup();
      }
      if (rangees <= PDF_RANGEES_MAX) return null;
    }
    const toutes: Array<Omit<Partie, 'morceau'>> = [];
    // Les coupes intérieures, au rang GLOBAL du morceau qui les précède : une bande de contrôle (coupe dans une page) ou un saut de page (rien à recouper).
    const coupes: Array<{ k: number; data: string } | { k: number; sautDePage: true }> = [];
    for (let p = 1; p <= pages; p++) {
      const page = await pdf.getPage(p);
      const vue = page.getViewport({ scale: 2 });
      const canevas = creerCanevas(Math.ceil(vue.width), Math.ceil(vue.height));
      const ctx = contexte2d(canevas, true);
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canevas.width, canevas.height);
      await page.render({ canvasContext: ctx, viewport: vue }).promise;
      page.cleanup();
      const echelle = Math.min(1, LARGEUR_MAX / canevas.width);
      const g: Geometrie = { cx: canevas.width / 2, cy: canevas.height / 2, angle: 0, echelle, largeur: Math.max(1, Math.round(canevas.width * echelle)), hauteur: Math.max(1, Math.round(canevas.height * echelle)) };
      // Une page rendue est blanche et droite : ni papier à chercher, ni redressement. Aucun voisin d'une page à l'autre.
      const a = analyser(grisNormalise(canevas, g), { papier: false, redresser: false, recadrer: false, maxLines: BAND_MAX_LINES });
      const dessin = await partiesDe(a, parCanevas(canevas, g)), decalage = toutes.length;
      toutes.push(...dessin.parties);
      coupes.push(...dessin.jonctions.map(j => ({ k: decalage + j.k, data: j.data })));
      if (p < pages) coupes.push({ k: toutes.length, sautDePage: true });
      canevas.width = 0; canevas.height = 0;
    }
    if (force && toutes.length < 2) return null;
    const n = toutes.length;
    return {
      parties: toutes.map((t, i) => ({ ...t, morceau: { k: i + 1, n } })),
      jonctions: coupes.map(c => ('sautDePage' in c ? c : { file: { data: c.data, mimeType: 'image/jpeg' }, jonction: { k: c.k, n } })),
    };
  } finally { void pdf.destroy(); }
}

const estPdf = (f: File | Blob) => f.type === 'application/pdf' || /\.pdf$/i.test((f as File).name ?? '');

/**
 * Les morceaux d'une pièce, ou `null` : la pièce se lit alors EXACTEMENT comme aujourd'hui (même appel).
 *  - sans `force` : une image plus de 3 × plus haute que large après recadrage du papier ; un PDF de plus de 4 pages ou de plus de 90 rangées de texte ;
 *  - avec `force` (la première lecture a été coupée ou a laissé des lignes imprimées) : dès que `planMorceaux` rend au moins 2 morceaux.
 * Peut lever (image illisible, canevas absent, pdf.js indisponible) : l'appelant garde alors la lecture d'aujourd'hui.
 */
export async function decouperPiece(file: File | Blob, options: { force?: boolean } = {}): Promise<Decoupe | null> {
  return estPdf(file) ? decouperPdf(file, options.force === true) : decouperImage(file, options.force === true);
}
