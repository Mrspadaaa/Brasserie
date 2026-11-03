/**
 * D380 : lire une longue pièce en morceaux (pages, bandes), puis recoller. Pur : aucun import node, l'app le partage (découpe) et le serveur (assemblage).
 *
 * Déplacé de `scripts/banc-lecture-bandes.ts` (voie k5-vision, 01.11, mesuré sur ses pièces : Bv aussi juste que C★v, 0,005 CHF et 3,6 s la bande) :
 * le banc l'importe d'ici. Ajout D380 : une bande est aussi bornée en LIGNES (`maxLines`), car une page serrée de 75 lignes tenait dans une seule bande
 * de 1,4 × la largeur et dépassait ce qu'une réponse de 8 192 jetons peut rendre (≈ 45 lignes).
 */

/** Une image en niveaux de gris : `gray[y * width + x]`, 0 à 255. */
export interface Bitmap { width: number; height: number; gray: Uint8Array }
/** Le rapport hauteur / largeur à partir duquel une image est coupée en bandes. */
export const TALL_RATIO = 2;
export const BAND_MAX_RATIO = 1.4;
export const BAND_OVERLAP_RATIO = 0.08;
/** D380 : lignes de texte au plus par bande (« Faut pas abuser non plus... » : ≈ 4 500 jetons de sortie, loin des 8 192 d’une lecture). */
export const BAND_MAX_LINES = 25;
/** Une rangée est « presque vide » si au plus cette part de ses pixels est de l'encre (≈ 4 px sur 1 280). */
export const EMPTY_ROW_MAX = 0.003;
/** Un pixel est de l'encre s'il s'écarte du fond de plus que cela (niveaux de gris). */
export const INK_DIFF = 40;
export const isTall = (width: number, height: number) => width > 0 && height >= TALL_RATIO * width;

/** La part de pixels d'encre de chaque rangée. Le fond est le niveau le plus fréquent (page blanche ou thème sombre). */
export function inkRows(bitmap: Bitmap, diff = INK_DIFF): number[] {
  const histogram = new Array<number>(256).fill(0);
  for (let i = 0; i < bitmap.gray.length; i++) histogram[bitmap.gray[i]]++;
  const background = histogram.indexOf(Math.max(...histogram));
  const rows: number[] = [];
  for (let y = 0; y < bitmap.height; y++) {
    let ink = 0;
    const from = y * bitmap.width;
    for (let x = 0; x < bitmap.width; x++) if (Math.abs(bitmap.gray[from + x] - background) > diff) ink++;
    rows.push(ink / bitmap.width);
  }
  return rows;
}

/**
 * D380 : le pas des lignes de texte, en rangées : la médiane des écarts entre les débuts de séries encrées d'au moins `minRun` rangées (un filet de
 * tableau, plus fin, ne compte pas). `null` sans au moins trois lignes.
 */
export function linePitch(rows: number[], emptyMax = EMPTY_ROW_MAX, minRun = 3): number | null {
  const starts: number[] = [];
  for (let i = 0; i < rows.length;) {
    if (rows[i] <= emptyMax) { i++; continue; }
    let j = i;
    while (j < rows.length && rows[j] > emptyMax) j++;
    if (j - i >= minRun) starts.push(i);
    i = j;
  }
  if (starts.length < 3) return null;
  const gaps = starts.slice(1).map((s, k) => s - starts[k]).sort((a, b) => a - b);
  return gaps[Math.floor(gaps.length / 2)];
}

export interface Band { top: number; bottom: number; forcedTop: boolean; forcedBottom: boolean }
export interface BandOptions { maxRatio?: number; overlapRatio?: number; emptyMax?: number; maxLines?: number }

/**
 * Où couper dans [from, to) : le milieu de la plus longue série de rangées presque vides (la plus proche de `target` à longueur égale).
 * Sans rangée presque vide dans la fenêtre, le milieu de la série la moins encrée, et la coupe est marquée `forced` (jamais silencieux).
 */
export function pickCut(rows: number[], from: number, to: number, emptyMax: number, target: number): { row: number; forced: boolean } {
  const lo = Math.max(0, Math.min(from, rows.length - 1)), hi = Math.max(lo + 1, Math.min(to, rows.length));
  let minInk = Infinity;
  for (let i = lo; i < hi; i++) minInk = Math.min(minInk, rows[i]);
  const forced = minInk > emptyMax, limit = forced ? minInk + 0.001 : emptyMax;
  let best: { start: number; end: number } | null = null;
  const better = (a: { start: number; end: number }, b: { start: number; end: number }) =>
    (a.end - a.start) > (b.end - b.start) || ((a.end - a.start) === (b.end - b.start) && Math.abs((a.start + a.end) / 2 - target) < Math.abs((b.start + b.end) / 2 - target));
  for (let i = lo; i < hi;) {
    if (rows[i] > limit) { i++; continue; }
    let j = i;
    while (j < hi && rows[j] <= limit) j++;
    const run = { start: i, end: j };
    if (!best || better(run, best)) best = run;
    i = j;
  }
  const run = best ?? { start: lo, end: lo + 1 };
  return { row: Math.floor((run.start + run.end - 1) / 2), forced };
}

/**
 * Les bandes d'une image haute : hauteur ≤ 1,4 × la largeur et (D380) ≤ `maxLines` lignes de texte, recouvrement d'environ 8 % de la hauteur de
 * bande, chaque bord intérieur sur une rangée presque vide. Une image qui tient dans une bande rend une seule bande.
 */
export function planBands(rows: number[], width: number, options: BandOptions = {}): Band[] {
  const emptyMax = options.emptyMax ?? EMPTY_ROW_MAX, height = rows.length;
  const pitch = options.maxLines ? linePitch(rows, emptyMax) : null;
  const byRatio = Math.max(2, Math.floor((options.maxRatio ?? BAND_MAX_RATIO) * width));
  const maxH = pitch ? Math.max(2, Math.min(byRatio, Math.floor(options.maxLines! * pitch))) : byRatio;
  const overlap = Math.max(1, Math.round((options.overlapRatio ?? BAND_OVERLAP_RATIO) * maxH));
  const bands: Band[] = [];
  let top = 0, forcedTop = false;
  for (;;) {
    if (height - top <= maxH) { bands.push({ top, bottom: height, forcedTop, forcedBottom: false }); break; }
    const cut = pickCut(rows, top + Math.floor(0.6 * maxH), top + maxH, emptyMax, top + maxH);
    const bottom = cut.row + 1;
    bands.push({ top, bottom, forcedTop, forcedBottom: cut.forced });
    const next = pickCut(rows, Math.max(top + 1, bottom - 2 * overlap), bottom - Math.max(1, Math.floor(overlap / 2)), emptyMax, bottom - overlap);
    top = Math.max(top + 1, next.row);
    forcedTop = next.forced;
  }
  return bands;
}

/** Les bords intérieurs des bandes qui traversent une rangée encrée (au-delà de `emptyMax`) : [] attendu. Les bords de l'image ne comptent pas. */
export function inkedCuts(bands: Band[], rows: number[], emptyMax = EMPTY_ROW_MAX): Array<{ band: number; row: number; ink: number }> {
  const bad: Array<{ band: number; row: number; ink: number }> = [];
  bands.forEach((band, index) => {
    if (index > 0 && rows[band.top] > emptyMax) bad.push({ band: index, row: band.top, ink: rows[band.top] });
    if (index < bands.length - 1 && rows[band.bottom - 1] > emptyMax) bad.push({ band: index, row: band.bottom - 1, ink: rows[band.bottom - 1] });
  });
  return bad;
}

// ---------------------------------------------------------------------------------------------------------------------
// D381 : des morceaux sans recouvrement de propriété (« On peut pas se permettre de perdre ou "gagner" de l'information »)
// ---------------------------------------------------------------------------------------------------------------------
/** Où est la PREMIÈRE ligne d'un article par rapport aux traits du morceau : au-dessus (morceau précédent), dans sa zone, au-dessous (suivant). */
export const ZONES_MORCEAU = ['avant', 'dedans', 'apres'] as const;
export type ZoneMorceau = typeof ZONES_MORCEAU[number];
/** Lignes des voisins montrées au-dessus et au-dessous des traits, pour finir un article coupé et recouper la jonction. */
export const CONTEXT_LINES = 3;
/**
 * Un morceau : sa zone propre [top, bottom) et ce que l'image montre [viewTop, viewBottom). Les zones propres se suivent sans se recouvrir
 * (bottom du morceau k = top du k + 1) : chaque rangée de la pièce appartient à un seul morceau. Chaque bord tombe sur une rangée presque vide ;
 * sinon il est `forced` (signalé, jamais silencieux).
 */
export interface Morceau { top: number; bottom: number; viewTop: number; viewBottom: number; forced: boolean }

/** La rangée presque vide la plus proche de `from` en allant dans `step` (±1), au plus `reach` rangées ; sinon `from`. */
function blankNear(rows: number[], from: number, step: 1 | -1, reach: number, emptyMax: number): number {
  for (let y = from, n = 0; y >= 0 && y < rows.length && n <= reach; y += step, n++) if (rows[y] <= emptyMax) return y;
  return from;
}

/** Les morceaux d'une image haute : zones propres de `maxLines` lignes au plus, coupées dans le blanc, et `contextLines` lignes de voisins visibles. */
export function planMorceaux(rows: number[], width: number, options: { maxLines?: number; contextLines?: number; emptyMax?: number } = {}): Morceau[] {
  const emptyMax = options.emptyMax ?? EMPTY_ROW_MAX, height = rows.length;
  const bands = planBands(rows, width, { maxLines: options.maxLines ?? BAND_MAX_LINES, overlapRatio: 0, emptyMax });
  // Sans recouvrement, le bas d'une bande est le haut de la suivante : la coupe de `planBands` (le bas) devient la frontière.
  const cuts = bands.slice(0, -1).map(b => b.bottom);
  const edges = [0, ...cuts, height];
  const pitch = linePitch(rows, emptyMax) ?? Math.max(1, Math.round(height / 40));
  const ctx = Math.round((options.contextLines ?? CONTEXT_LINES) * pitch);
  return edges.slice(0, -1).map((top, k) => {
    const bottom = edges[k + 1];
    const viewTop = k === 0 ? 0 : blankNear(rows, Math.max(0, top - ctx), -1, pitch, emptyMax);
    const viewBottom = k === edges.length - 2 ? height : Math.min(height, blankNear(rows, Math.min(height - 1, bottom + ctx), 1, pitch, emptyMax) + 1);
    // Une frontière est propre si la rangée juste au-dessus est blanche : la ligne d'au-dessus est entière d'un côté, celle d'en dessous de l'autre.
    const forced = (k > 0 && rows[top - 1] > emptyMax) || (k < edges.length - 2 && rows[bottom - 1] > emptyMax);
    return { top, bottom, viewTop, viewBottom, forced };
  });
}

const cleNom = (value: unknown) => canon(value).replace(/[^a-z0-9]/g, '');
const memeNombre = (a: unknown, b: unknown) => (typeof a === 'number' && typeof b === 'number' ? Math.abs(a - b) < 0.005 : (a ?? null) === (b ?? null));
/** Deux lectures du MÊME article (vu par deux morceaux voisins) : même montant de ligne, et la même désignation aux espaces et ponctuation près. */
export function memeArticle(a: any, b: any): boolean {
  if (!memeNombre(a?.amountTTC, b?.amountTTC)) return false;
  const x = cleNom(a?.name), y = cleNom(b?.name);
  return x === y || (Math.min(x.length, y.length) >= 6 && (x.includes(y) || y.includes(x)));
}
/**
 * D381 : la jonction entre deux morceaux, vue des deux côtés. Les articles que le morceau du haut voit SOUS son trait (« apres ») sont les premiers
 * du morceau du bas ; ceux que le morceau du bas voit AU-DESSUS de son trait (« avant ») sont les derniers du morceau du haut. Vrai si tout concorde.
 */
export function jonctionConcorde(haut: { dedans: any[]; apres: any[] }, bas: { avant: any[]; dedans: any[] }): boolean {
  const debut = bas.dedans.slice(0, haut.apres.length), fin = haut.dedans.slice(haut.dedans.length - bas.avant.length);
  return debut.length === haut.apres.length && haut.apres.every((a, i) => memeArticle(a, debut[i]))
    && fin.length === bas.avant.length && bas.avant.every((a, i) => memeArticle(a, fin[i]));
}

/** Combien de bandes (estimation sans pixels) : même gabarit que `planBands`, bords supposés sur des rangées vides. */
export function estimateBandCount(width: number, height: number): number {
  if (!isTall(width, height)) return 1;
  const maxH = Math.floor(BAND_MAX_RATIO * width), overlap = Math.round(BAND_OVERLAP_RATIO * maxH);
  return Math.max(1, Math.ceil((height - overlap) / (maxH - overlap)));
}

// ---------------------------------------------------------------------------------------------------------------------
// Consignes par rang (génériques : aucune valeur de document)
// ---------------------------------------------------------------------------------------------------------------------
const headerRule = (k: number) => (k === 1
  ? ' Lis aussi l’en-tête (fournisseur, date, numéros, devise) de cette première partie.'
  : ' Laisse vides les champs d’en-tête (texte "", nombres null) : ils sont lus sur la première partie.');
const totalsRule = (k: number, n: number) => (k === n
  ? ' Lis aussi les totaux imprimés (HT, TVA, TTC, bloc TVA) de cette dernière partie.'
  : ' Laisse null les totaux et vide le bloc TVA : ils sont lus sur la dernière partie.');
/** Pv : la consigne de la page k sur N. */
export const pageNote = (k: number, n: number) =>
  `Ce PDF compte ${n} pages. Ne transcris que les lignes d’articles imprimées sur la page ${k}, dans leur ordre ; les lignes des autres pages sont lues à part, n’en recopie aucune.${headerRule(k)}${totalsRule(k, n)}`;
/** Bv (banc seulement, D381 : jamais en production) : la consigne de la bande k sur N, recouvrement retiré par le texte. */
export const bandNote = (k: number, n: number) =>
  `Cette image est la partie ${k} sur ${n} d’un même document, de haut en bas ; les parties voisines se recouvrent d’environ 8 % : une ligne du bord peut figurer aussi sur la partie voisine, transcris-la quand même ici. Ne transcris que les lignes d’articles visibles sur CETTE partie.${headerRule(k)}${totalsRule(k, n)}`;

/**
 * D381 : la consigne du morceau k sur N (production). Les traits rouges sont tracés par l'app dans le blanc entre deux lignes ; la zone teintée
 * au-dessus et au-dessous montre les lignes des morceaux voisins. Chaque article a un seul propriétaire : le morceau où est sa PREMIÈRE ligne.
 */
export const morceauNote = (k: number, n: number) =>
  `Cette image est la partie ${k} sur ${n} d’un même document, de haut en bas. Un trait rouge horizontal marque le haut ou le bas de TA zone ;`
  + ' sans trait, ta zone va jusqu’au bord de l’image. Au-delà d’un trait, sur fond teinté, quelques lignes des parties voisines restent visibles :'
  + ' elles servent à finir un article coupé et à recouper la jonction.'
  + ' Transcris, dans l’ordre, chaque article dont la PREMIÈRE ligne est visible sur l’image, avec zone : "avant" si cette première ligne est au-dessus du trait du haut,'
  + ' "apres" si elle est au-dessous du trait du bas, "dedans" sinon. Un article qui commence dans ta zone et se poursuit au-delà du trait du bas est "dedans" :'
  + ' complète-le avec la suite visible. Une ligne qui n’est que la suite d’un article commencé plus haut (quantité, prix, total, variante sans désignation'
  + ' propre) n’est jamais un article à part. printedLineCount compte les articles "dedans" seulement.'
  + `${headerRule(k)}${totalsRule(k, n)}`;

// ---------------------------------------------------------------------------------------------------------------------
// Recollage : lectures partielles → une lecture complète au format de production
// ---------------------------------------------------------------------------------------------------------------------
const canon = (value: unknown) => String(value ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
const isBlank = (value: unknown) => value === null || value === undefined || value === '';
/** « Même recopie et même montant » : la désignation (casse, accents, espaces ignorés) et le montant TTC de la ligne (null = null). */
export const itemKey = (item: any) => `${canon(item?.name)}|${typeof item?.amountTTC === 'number' ? item.amountTTC.toFixed(4) : 'null'}`;
/** Fenêtre du recouvrement : les lignes de bord relues deux fois sont dans les premières lignes de la partie suivante et les dernières de la précédente. */
export const OVERLAP_WINDOW = 6;
/**
 * Retire de `next` les lignes du recouvrement déjà dans `acc` : une des premières lignes de `next` qui recopie (même clé) une des dernières
 * de `acc`, dans le même ordre, n'est gardée qu'une fois. Chaque ligne de `acc` ne s'efface qu'une fois : deux lignes identiques voulues
 * (même désignation, même montant) ne s'effacent qu'à hauteur de ce que le bord a relu.
 */
export function dedupeOverlap(acc: any[], next: any[], window = OVERLAP_WINDOW): any[] {
  return next.filter((_, j) => !overlapDrops(acc, next, window).has(j));
}
/** Les rangs de `next` (0-based) que le recouvrement retire : partagé par `dedupeOverlap` et l'assemblage, qui décale les points des lignes gardées. */
export function overlapDrops(acc: any[], next: any[], window = OVERLAP_WINDOW): Set<number> {
  const tail = acc.slice(-window).map(itemKey);
  let pointer = 0;
  const drop = new Set<number>();
  for (let j = 0; j < Math.min(window, next.length); j++) {
    const at = tail.indexOf(itemKey(next[j]), pointer);
    if (at >= 0) { drop.add(j); pointer = at + 1; }
  }
  return drop;
}

const firstFilled = (list: any[], field: string) => list.map(entry => entry?.[field]).find(value => !isBlank(value));
const lastFilled = (list: any[], field: string) => [...list].reverse().map(entry => entry?.[field]).find(value => !isBlank(value));
/**
 * Les lectures partielles d'un même document (une par page ou par bande, dans l'ordre) en UNE lecture au format de production :
 *   - en-tête (fournisseur, type, date, devise, numéros) : la première valeur non vide, en partant de la première partie ;
 *   - totaux (HT, TVA, TTC, taux, bloc TVA) : la première valeur non nulle, en partant de la dernière ; un total absent reste null, jamais 0 ;
 *   - paiement : la dernière valeur autre que « unknown » ; pro-forma : l'une quelconque ;
 *   - lignes : concaténées dans l'ordre ; `dedupe` retire la ligne du recouvrement lue deux fois (bandes) ; `printedLineCount` et
 *     `linesLost` : sommés, null si aucune partie ne le donne.
 */
export function mergeDecoded(parts: any[], options: { dedupe: boolean }): any {
  const items: any[] = [];
  parts.forEach(part => {
    const list: any[] = Array.isArray(part?.items) ? part.items : [];
    items.push(...(options.dedupe ? dedupeOverlap(items, list) : list));
  });
  const first = parts[0] ?? {};
  const counted = parts.map(part => part?.printedLineCount).filter((value): value is number => typeof value === 'number');
  const warnings: any[] = [];
  parts.forEach(part => (Array.isArray(part?.fieldWarnings) ? part.fieldWarnings : []).forEach((warning: any) => {
    if (!warnings.some(old => old.field === warning.field && old.message === warning.message)) warnings.push(warning);
  }));
  const vat = [...parts].reverse().map(part => part?.vat).find(list => Array.isArray(list) && list.length) ?? [];
  const nullable = (field: string) => lastFilled(parts, field) ?? null;
  return {
    ...first,
    vendor: firstFilled(parts, 'vendor') ?? '', documentType: first.documentType ?? 'other', date: firstFilled(parts, 'date') ?? '', currency: firstFilled(parts, 'currency') ?? '',
    invoiceNumber: firstFilled(parts, 'invoiceNumber') ?? '', orderNumber: firstFilled(parts, 'orderNumber') ?? '',
    paymentEvidence: [...parts].reverse().map(part => part?.paymentEvidence).find(value => value && value !== 'unknown') ?? 'unknown',
    proForma: parts.some(part => part?.proForma === true),
    amountHT: nullable('amountHT'), tvaAmount: nullable('tvaAmount'), amountTTC: nullable('amountTTC'), tvaRate: nullable('tvaRate'), vat,
    printedLineCount: counted.length ? counted.reduce((a, b) => a + b, 0) : null,
    linesLost: parts.reduce((sum, part) => sum + (typeof part?.linesLost === 'number' ? part.linesLost : 0), 0),
    fieldWarnings: warnings, rejets: parts.flatMap(part => (Array.isArray(part?.rejets) ? part.rejets : [])), items
  };
}
