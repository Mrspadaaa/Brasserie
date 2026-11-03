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

/** L'encre de chaque pixel (0 ou 1) : fond local − pixel au-delà du seuil adaptatif, sans point isolé (bruit de capteur). */
function marquerEncre(gris: Uint8Array, w: number, h: number, demi: number): Uint8Array {
  const fond = fondLocal(gris, w, h, demi);
  const contraste = new Uint8Array(w * h), histogramme = new Uint32Array(256);
  for (let i = 0; i < contraste.length; i++) { const c = fond[i] - gris[i]; contraste[i] = c; histogramme[c]++; }
  const seuil = Math.max(PLANCHER_ENCRE, otsu(histogramme).seuil);
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

function partParRangee(ink: Uint8Array, w: number, h: number): number[] {
  const rangees: number[] = [];
  for (let y = 0; y < h; y++) {
    let n = 0;
    for (let x = 0, i = y * w; x < w; x++, i++) n += ink[i];
    rangees.push(n / w);
  }
  return rangees;
}

export interface Encre { ink: Uint8Array; rangees: number[]; pas: number | null }

/**
 * L'encre d'une image par CONTRASTE LOCAL. Le fond d'un pixel est le plus clair de son voisinage (fenêtre ≈ 2 pas de ligne) : un papier gris, un dégradé
 * d'ombre, une tache lisse ne sont pas de l'encre, un texte sur la tache l'est. Le pas des lignes est d'abord estimé avec une fenêtre large, puis la
 * fenêtre est resserrée à 2 pas. Un thème sombre (moyenne < 70) est inversé d'abord.
 */
export function encreDetaillee(bitmap: Bitmap): Encre {
  const { width: w, height: h } = bitmap;
  let gris = bitmap.gray;
  let somme = 0;
  for (let i = 0; i < gris.length; i++) somme += gris[i];
  if (gris.length && somme / gris.length < 70) gris = gris.map(v => 255 - v);
  const demi1 = Math.max(3, Math.round(w / 40));
  let ink = marquerEncre(gris, w, h, demi1);
  let rangees = partParRangee(ink, w, h);
  let pas = linePitch(rangees);
  if (pas) {
    const demi2 = clamp(Math.round(pas), 3, 300);
    if (Math.abs(demi2 - demi1) > 0.2 * demi1) {
      ink = marquerEncre(gris, w, h, demi2);
      rangees = partParRangee(ink, w, h);
      pas = linePitch(rangees) ?? pas;
    }
  }
  return { ink, rangees, pas };
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
}

/**
 * Le papier d'une photo prise sur un fond sombre (table, tissu) : la plus grande région claire (blocs, seuil d'Otsu), sa boîte et, par rangée,
 * l'intervalle qu'elle couvre. PRUDENT : au moindre doute (pas de fond sombre net, du texte hors de la région claire, autre objet clair) la réponse est
 * `null` et l'image n'est ni recadrée ni masquée : on ne perd jamais une partie de la pièce pour la découper mieux.
 */
export function trouverPapier(bitmap: Bitmap): Papier | null {
  const { width: W, height: H, gray } = bitmap;
  if (W < 8 || H < 8) return null;
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
  if (haut - bas < 60) return null;
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
  if (!meilleurId) return null;
  const intervalles = new Int32Array(2 * bh).fill(0);
  let gauche = bw, droite = -1, haute = bh, basse = -1, couvert = 0;
  for (let by = 0; by < bh; by++) {
    let l = bw, r = -1;
    for (let bx = 0; bx < bw; bx++) if (etiquette[by * bw + bx] === meilleurId) { if (bx < l) l = bx; r = bx; }
    intervalles[2 * by] = l; intervalles[2 * by + 1] = r;
    if (r >= l) { couvert += r - l + 1; gauche = Math.min(gauche, l); droite = Math.max(droite, r); haute = Math.min(haute, by); basse = by; }
  }
  if (couvert < 0.25 * nb) return null;
  if (couvert < 0.45 * (droite - gauche + 1) * (basse - haute + 1)) return null;
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
  if (dehors < 0.03 * nb || textes > 0.03 * dehors || clairs > 0.25 * dehors) return null;
  const x = gauche * f, y = haute * f;
  return { boite: { x, y, w: Math.min(W, (droite + 1) * f) - x, h: Math.min(H, (basse + 1) * f) - y }, intervalles, f, bw, bh };
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

/**
 * L'angle du texte, en degrés dans [−5, 5], par pas de 0,25 : celui qui rend le profil d'encre des rangées le plus contrasté (somme des carrés des
 * rangées). Image réduite (blocs) pour rester rapide. Sans gain net sur 0° (moins de 2 %), ou sans encre, rend 0 : jamais un redressement sans preuve.
 */
export function estimerAngle(ink: Uint8Array, w: number, h: number): number {
  const r = Math.max(1, Math.floor(w / 400));
  const bw = Math.ceil(w / r), bh = Math.ceil(h / r);
  const xs: number[] = [], ys: number[] = [], ps: number[] = [];
  for (let by = 0; by < bh; by++) {
    for (let bx = 0; bx < bw; bx++) {
      let n = 0;
      for (let y = by * r; y < Math.min(h, (by + 1) * r); y++) for (let x = bx * r, i = y * w + bx * r; x < Math.min(w, (bx + 1) * r); x++, i++) n += ink[i];
      if (n) { xs.push(bx * r + r / 2 - w / 2); ys.push(by * r + r / 2 - h / 2); ps.push(n); }
    }
  }
  if (xs.length < 20) return 0;
  const bacs = Math.ceil(Math.hypot(w, h) / r) + 4, decalage = Math.hypot(w, h) / 2;
  const score = (degres: number) => {
    const rad = degres * Math.PI / 180, s = Math.sin(rad), c = Math.cos(rad), profil = new Float64Array(bacs);
    for (let i = 0; i < xs.length; i++) profil[Math.floor((-xs[i] * s + ys[i] * c + decalage) / r)] += ps[i];
    let total = 0;
    for (let i = 0; i < bacs; i++) total += profil[i] * profil[i];
    return total;
  };
  const zero = score(0);
  let meilleur = 0, meilleurScore = zero;
  for (let a = -ANGLE_MAX; a <= ANGLE_MAX + 1e-9; a += ANGLE_PAS) {
    const s = score(a);
    if (s > meilleurScore * (1 + 1e-9)) { meilleur = a; meilleurScore = s; }
  }
  return meilleurScore > zero * 1.02 ? Math.round(meilleur / ANGLE_PAS) * ANGLE_PAS : 0;
}

/**
 * Applique à un canal (gris, ou masque) la même transformation que le dessin des morceaux : recadrage `crop` puis rotation de `angle` autour de son centre
 * (convention en tête de fichier). Sortie de taille crop.w × crop.h. Hors de l'image : `vide` (255 par défaut ; 0 pour un masque). `plusProche` : plus
 * proche voisin (masques, jamais de valeur intermédiaire) ; sinon interpolation bilinéaire.
 */
export function normaliser(canal: Uint8Array, w: number, h: number, analyse: { crop: Rect; angle: number }, options: { plusProche?: boolean; vide?: number } = {}): Uint8Array {
  const { crop, angle } = analyse, cw = crop.w, ch = crop.h, vide = options.vide ?? 255;
  const sortie = new Uint8Array(cw * ch);
  if (angle === 0) {
    for (let v = 0; v < ch; v++) {
      const y = crop.y + v;
      for (let u = 0; u < cw; u++) { const x = crop.x + u; sortie[v * cw + u] = x >= 0 && x < w && y >= 0 && y < h ? canal[y * w + x] : vide; }
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
        sortie[i] = xi >= 0 && xi < w && yi >= 0 && yi < h ? canal[yi * w + xi] : vide;
        continue;
      }
      if (x < -0.5 || x > w - 0.5 || y < -0.5 || y > h - 0.5) { sortie[i] = vide; continue; }
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
  /** Vrai si un fond sombre autour du papier a été reconnu (et masqué dans l'analyse). */
  papier: boolean;
}
export interface OptionsAnalyse {
  /** Chercher le papier sur un fond sombre et masquer ce fond (défaut : oui). */
  papier?: boolean;
  /** Recadrer sur le papier (défaut : oui) ; non : le fond est masqué pour l'analyse, mais l'image garde ses dimensions. */
  recadrer?: boolean;
  /** Chercher l'angle (défaut : oui). */
  redresser?: boolean;
  maxLines?: number;
}

/** Examine une image : papier, angle, puis les morceaux (`planMorceaux` sur l'encre locale de l'image normalisée). */
export function analyser(bitmap: Bitmap, options: OptionsAnalyse = {}): Analyse {
  const { width: W, height: H } = bitmap;
  const papier = options.papier === false ? null : trouverPapier(bitmap);
  const crop = options.recadrer === false ? { x: 0, y: 0, w: W, h: H } : recadrageDe(papier, W, H);
  const gris = papier ? remplirHorsPapier(bitmap, papier) : bitmap.gray;
  const vue = (angle: number) => ({ width: crop.w, height: crop.h, gray: normaliser(gris, W, H, { crop, angle }) });
  let normal = vue(0), encre = encreDetaillee(normal), angle = 0;
  if (options.redresser !== false) {
    angle = estimerAngle(encre.ink, crop.w, crop.h);
    if (angle !== 0) { normal = vue(angle); encre = encreDetaillee(normal); }
  }
  const morceaux = planMorceaux(encre.rangees, crop.w, { maxLines: options.maxLines ?? BAND_MAX_LINES });
  return { crop, angle, morceaux, rangees: encre.rangees, largeur: crop.w, hauteur: crop.h, papier: papier !== null };
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
 * Dessine les rangées [y0, y0 + hauteur du canevas) de l'image normalisée : même transformation que `normaliser`. Fond blanc. `lisser` faux : plus proche
 * voisin (le banc D381 y dessine le masque des pièges, couleurs exactes).
 */
export function dessinerNormalise(canevas: HTMLCanvasElement, source: CanvasImageSource, g: Geometrie, y0: number, lisser = true, fond = '#fff'): CanvasRenderingContext2D {
  const ctx = contexte2d(canevas, true);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = fond; ctx.fillRect(0, 0, canevas.width, canevas.height);
  ctx.imageSmoothingEnabled = lisser; if (lisser) ctx.imageSmoothingQuality = 'high';
  ctx.translate(g.largeur / 2, g.hauteur / 2 - y0);
  ctx.scale(g.echelle, g.echelle);
  ctx.rotate(-g.angle * Math.PI / 180);
  ctx.translate(-g.cx, -g.cy);
  ctx.drawImage(source, 0, 0);
  return ctx;
}

/** Le gris de toute l'image normalisée, par bandes (jamais un canevas de la hauteur d'un ticket entier : limite mémoire des téléphones). */
function grisNormalise(source: CanvasImageSource, g: Geometrie): Bitmap {
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
function dessinerZone(source: CanvasImageSource, g: Geometrie, top: number, bottom: number): string {
  const canevas = creerCanevas(g.largeur, Math.max(1, bottom - top));
  dessinerNormalise(canevas, source, g, top);
  const url = canevas.toDataURL('image/jpeg', QUALITE_JPEG);
  canevas.width = 0; canevas.height = 0;
  return url.slice(url.indexOf(',') + 1);
}

/** Une bande de contrôle brute : `k` est le rang LOCAL (dans l'image ou la page) de la coupe sous le morceau k ; `data` seul (le rang global vient après). */
type JonctionBrute = { k: number; data: string };
/** Les parties d'une image normalisée (rang à compléter par l'appelant : plusieurs pages se suivent) et ses bandes de contrôle (D381 : une par coupe intérieure). */
function partiesDe(source: CanvasImageSource, g: Geometrie, a: Analyse): { parties: Array<Omit<Partie, 'morceau'>>; jonctions: JonctionBrute[] } {
  return {
    parties: a.morceaux.map((m, i) => ({ file: { data: dessinerZone(source, g, m.top, m.bottom), mimeType: 'image/jpeg' }, coupeForcee: coupeBasseForcee(m, a.rangees, i === a.morceaux.length - 1) })),
    jonctions: planJonctions(a.morceaux, a.rangees).filter(j => j.bottom > j.top).map(j => ({ k: j.k, data: dessinerZone(source, g, j.top, j.bottom) })),
  };
}

/** Ce que `decouperPiece` rend : les morceaux, et par coupe intérieure sa bande de contrôle (lue à part) ou le saut de page d'un PDF (rien à recouper). */
export interface Decoupe { parties: Partie[]; jonctions: JonctionPiece[] }
export type JonctionPiece = { file: { data: string; mimeType: string }; jonction: { k: number; n: number } } | { k: number; sautDePage: true };

/**
 * Le plan d'une image : sa géométrie normalisée (papier, angle, échelle) et l'analyse finale, faite sur les pixels mêmes qui seront dessinés.
 * `null` : rien à découper (pas assez haute sans `force`, ou un seul morceau). Exporté pour le banc D381 (masques des pièges).
 */
export function planifierImage(image: ImageBitmap, force: boolean): { g: Geometrie; finale: Analyse } | null {
  const W = image.width, H = image.height;
  // Coup d'œil : l'image réduite (côté court ≈ 1 200 px) suffit au papier et à l'angle.
  const s = Math.min(1, 1200 / Math.min(W, H)), pw = Math.max(1, Math.round(W * s)), ph = Math.max(1, Math.round(H * s));
  const petit = creerCanevas(pw, ph);
  contexte2d(petit, true).drawImage(image, 0, 0, pw, ph);
  const reduit: Bitmap = { width: pw, height: ph, gray: grisDe(contexte2d(petit, true).getImageData(0, 0, pw, ph)) };
  petit.width = 0; petit.height = 0;
  if (!force) {
    const r = recadrageDe(trouverPapier(reduit), pw, ph);
    if (r.h / r.w <= RAPPORT_DECOUPE) return null;
  }
  const coup = analyser(reduit, { maxLines: BAND_MAX_LINES });
  const crop: Rect = { x: coup.crop.x / s, y: coup.crop.y / s, w: Math.min(W, coup.crop.w / s), h: Math.min(H, coup.crop.h / s) };
  const echelle = Math.min(1, LARGEUR_MAX / crop.w);
  const g: Geometrie = { cx: crop.x + crop.w / 2, cy: crop.y + crop.h / 2, angle: coup.angle, echelle, largeur: Math.max(1, Math.round(crop.w * echelle)), hauteur: Math.max(1, Math.round(crop.h * echelle)) };
  const finale = analyser(grisNormalise(image, g), { redresser: false, recadrer: false, maxLines: BAND_MAX_LINES });
  return finale.morceaux.length < 2 ? null : { g, finale };
}

async function decouperImage(file: File | Blob, force: boolean): Promise<Decoupe | null> {
  const image = await createImageBitmap(file);
  try {
    const plan = planifierImage(image, force);
    if (!plan) return null;
    const { g, finale } = plan;
    const dessin = partiesDe(image, g, finale), n = dessin.parties.length;
    return {
      parties: dessin.parties.map((p, i) => ({ ...p, morceau: { k: i + 1, n } })),
      jonctions: dessin.jonctions.map(j => ({ file: { data: j.data, mimeType: 'image/jpeg' }, jonction: { k: j.k, n } })),
    };
  } finally { image.close(); }
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
      const dessin = partiesDe(canevas, g, a), decalage = toutes.length;
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
