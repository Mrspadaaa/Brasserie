/**
 * Gestes de vision du banc, voie k5-vision (01.11) : lire une longue pièce par BANDES ou par PAGES, et recoller.
 * Repris du dépôt Anionex/dsh-vision-toolkit (couper une longue capture, lire les morceaux en parallèle, recoller), adapté à Gemini et
 * mesuré contre la production. Le banc seulement : `functions/` et `src/` n'en reçoivent rien.
 *
 * Deux parties :
 *   - du PUR, sans outil ni réseau (testé sur des bitmaps fabriqués) : l'encre par rangée, le plan de bandes, la vérification qu'aucune
 *     coupe ne traverse une rangée encrée, le recollage de lectures partielles (en-tête de la première, totaux de la dernière, ligne du
 *     recouvrement gardée une fois), les phrases de consigne par rang ;
 *   - des OUTILS hors de l'app (`jimp` pour découper, `pdfjs-dist` + `@napi-rs/canvas` pour rendre un PDF, `zxing-wasm` pour le QR), chargés
 *     par import dynamique au seul moment où une variante en a besoin. `npm test` n'en dépend jamais ; un outil absent lève `OutilManquant`
 *     et la variante est sautée avec un message clair. Dossier : `BANC_OUTILS`, sinon `<tmp>/banc-outils` (`node_modules` dedans).
 *
 * Aucune valeur d'un document ici (L20).
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import type { InvoiceFile } from '../functions/src/invoiceScanCore';

// ---------------------------------------------------------------------------------------------------------------------
// Les outils hors de l'app
// ---------------------------------------------------------------------------------------------------------------------
/** Un outil du banc n'est pas installé sur ce poste : la variante qui en a besoin est sautée, jamais remplacée par une valeur inventée. */
export class OutilManquant extends Error {
  constructor(readonly outil: string, detail = '') { super(`Outil du banc absent : ${outil}${detail ? ` (${detail})` : ''}. Variante sautée.`); this.name = 'OutilManquant'; }
}
export const outilsDir = (): string => process.env.BANC_OUTILS || path.join(tmpdir(), 'banc-outils');
/** Import dynamique d'une URL de fichier hors du dépôt (`…/node_modules/…` : vite-node l'externalise et l'importe tel quel). */
const nativeImport = (specifier: string): Promise<any> => import(/* @vite-ignore */ specifier);
async function loadFrom(outil: string, relative: string): Promise<any> {
  const full = path.join(outilsDir(), 'node_modules', relative);
  try { return await nativeImport(pathToFileURL(full).href); } catch (error: any) { throw new OutilManquant(outil, String(error?.code ?? error?.message ?? error).slice(0, 80)); }
}
/** jimp 1.x : découpe et agrandissement. */
export async function loadJimp(): Promise<any> {
  const module = await loadFrom('jimp', 'jimp/dist/esm/index.js');
  return module.Jimp ?? module.default?.Jimp ?? module.default;
}
export interface PdfRenderer { render: (pdf: Buffer, page: number, scale: number) => Promise<Buffer>; pages: (pdf: Buffer) => Promise<number> }
/**
 * Les paramètres d'ouverture d'un PDF : ceux du banc QR du 01.11 (`pdf-qr.mjs`) et `verbosity: 0` (pdf.js ne bavarde que sur ses erreurs).
 * SURTOUT PAS `standardFontDataUrl` : avec lui, pdf.js rend la page 3 de doc9 sans son QR (0 texte lu) et le recadreur de Zv perdrait du contenu (01.11).
 */
export const PDF_OPEN_OPTIONS = { isEvalSupported: false, verbosity: 0 } as const;
/** Le rendu d'une page de PDF en PNG, avec pdf.js et un canvas passés en argument (testable sans outil). */
export function makePdfjsRenderer(pdfjs: { getDocument: (params: any) => { promise: Promise<any> } }, createCanvas: (width: number, height: number) => any): PdfRenderer {
  const open = (pdf: Buffer) => pdfjs.getDocument({ data: new Uint8Array(pdf), ...PDF_OPEN_OPTIONS }).promise;
  return {
    pages: async pdf => (await open(pdf)).numPages,
    render: async (pdf, page, scale) => {
      const document = await open(pdf);
      const one = await document.getPage(page), viewport = one.getViewport({ scale });
      const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height)), context = canvas.getContext('2d');
      context.fillStyle = '#fff'; context.fillRect(0, 0, canvas.width, canvas.height);
      await one.render({ canvasContext: context, viewport }).promise;
      return canvas.toBuffer('image/png');
    }
  };
}
/** pdf.js + canvas du dossier d'outils : une page de PDF rendue en PNG (3× = 216 dpi environ, comme le banc QR du 01.11). */
export async function loadPdfRenderer(): Promise<PdfRenderer> {
  const pdfjs = await loadFrom('pdfjs-dist', 'pdfjs-dist/legacy/build/pdf.mjs');
  const canvasModule = await loadFrom('@napi-rs/canvas', '@napi-rs/canvas/index.js');
  return makePdfjsRenderer(pdfjs, canvasModule.createCanvas ?? canvasModule.default?.createCanvas);
}
/** zxing-wasm : lit les QR d'une image (octets PNG ou JPEG). */
export type QrImageReader = (bytes: Buffer) => Promise<string[]>;
export async function loadQrReader(): Promise<QrImageReader> {
  const module = await loadFrom('zxing-wasm', 'zxing-wasm/dist/es/reader/index.js');
  const { readFileSync } = await import('node:fs');
  module.prepareZXingModule({ overrides: { wasmBinary: readFileSync(path.join(outilsDir(), 'node_modules/zxing-wasm/dist/reader/zxing_reader.wasm')).buffer }, fireImmediately: true });
  return async bytes => {
    const found = await module.readBarcodes(new Blob([bytes as any]), { formats: ['QRCode'], tryHarder: true, tryRotate: true, tryInvert: true, tryDownscale: true, maxNumberOfSymbols: 8 });
    return found.filter((one: any) => one.isValid).map((one: any) => String(one.text));
  };
}

// ---------------------------------------------------------------------------------------------------------------------
// Taille d'une image sans outil : en-têtes PNG et JPEG
// ---------------------------------------------------------------------------------------------------------------------
export function imageSize(bytes: Buffer): { width: number; height: number } | null {
  if (bytes.length > 24 && bytes.readUInt32BE(0) === 0x89504e47 && bytes.toString('latin1', 12, 16) === 'IHDR') return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
  if (bytes.length > 4 && bytes[0] === 0xff && bytes[1] === 0xd8) {
    let at = 2;
    while (at + 9 < bytes.length) {
      if (bytes[at] !== 0xff) { at++; continue; }
      const marker = bytes[at + 1];
      if (marker === 0xff) { at++; continue; }
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) return { height: bytes.readUInt16BE(at + 5), width: bytes.readUInt16BE(at + 7) };
      at += 2 + bytes.readUInt16BE(at + 2);
    }
  }
  return null;
}

// ---------------------------------------------------------------------------------------------------------------------
// Bandes : encre par rangée, plan de coupe
// ---------------------------------------------------------------------------------------------------------------------
/** Une image en niveaux de gris : `gray[y * width + x]`, 0 à 255. */
export interface Bitmap { width: number; height: number; gray: Uint8Array }
/** Le rapport hauteur / largeur à partir duquel une image est coupée en bandes. */
export const TALL_RATIO = 2;
export const BAND_MAX_RATIO = 1.4;
export const BAND_OVERLAP_RATIO = 0.08;
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

export interface Band { top: number; bottom: number; forcedTop: boolean; forcedBottom: boolean }
export interface BandOptions { maxRatio?: number; overlapRatio?: number; emptyMax?: number }

/**
 * Où couper dans [from, to) : le milieu de la plus longue série de rangées presque vides (la plus proche de `target` à longueur égale).
 * Sans rangée presque vide dans la fenêtre, le milieu de la série la moins encrée, et la coupe est marquée `forced` (rien d'autre à faire :
 * le banc le déclare).
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
 * Les bandes d'une image haute : hauteur ≤ 1,4 × la largeur, recouvrement d'environ 8 % de la hauteur de bande, chaque bord
 * intérieur sur une rangée presque vide. Une image qui tient dans une bande rend une seule bande.
 */
export function planBands(rows: number[], width: number, options: BandOptions = {}): Band[] {
  const maxH = Math.max(2, Math.floor((options.maxRatio ?? BAND_MAX_RATIO) * width)), overlap = Math.max(1, Math.round((options.overlapRatio ?? BAND_OVERLAP_RATIO) * maxH));
  const emptyMax = options.emptyMax ?? EMPTY_ROW_MAX, height = rows.length;
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

/** Combien de bandes (estimation sans pixels, pour `--estimer`) : même gabarit que `planBands`, bords supposés sur des rangées vides. */
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
/** Bv : la consigne de la bande k sur N (les bandes se recouvrent : une ligne du bord peut figurer deux fois, le banc la recolle). */
export const bandNote = (k: number, n: number) =>
  `Cette image est la partie ${k} sur ${n} d’un même document, de haut en bas ; les parties voisines se recouvrent d’environ 8 % : une ligne du bord peut figurer aussi sur la partie voisine, transcris-la quand même ici. Ne transcris que les lignes d’articles visibles sur CETTE partie.${headerRule(k)}${totalsRule(k, n)}`;

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
  const tail = acc.slice(-window).map(itemKey);
  let pointer = 0;
  const drop = new Set<number>();
  for (let j = 0; j < Math.min(window, next.length); j++) {
    const at = tail.indexOf(itemKey(next[j]), pointer);
    if (at >= 0) { drop.add(j); pointer = at + 1; }
  }
  return next.filter((_, j) => !drop.has(j));
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

// ---------------------------------------------------------------------------------------------------------------------
// Bv : le découpage des pièces (outil jimp) et sa version sans outil
// ---------------------------------------------------------------------------------------------------------------------
/** Une partie à lire : une image (une bande, ou une capture entière), son rang global k sur n, et d'où elle vient. */
export interface BandPart { file: InvoiceFile; k: number; n: number; source: number; top: number; bottom: number; forced: boolean }
/** Découpe les fichiers d'un cas ; `null` si aucune image n'est assez haute (la variante n'a pas de parcours sur ce cas). */
export type Bander = (files: InvoiceFile[], caseId: string) => Promise<BandPart[] | null>;
const isImage = (file: InvoiceFile) => file.mimeType.startsWith('image/');

/** Sans outil : les dimensions viennent des en-têtes, aucune image n'est découpée (le fichier entier est répété) — simulation, estimation. */
export const sizeBander: Bander = async files => {
  const dims = files.map(file => (isImage(file) ? imageSize(Buffer.from(file.data, 'base64')) : null));
  if (!dims.some(size => size && isTall(size.width, size.height))) return null;
  const parts: Array<Omit<BandPart, 'k' | 'n'>> = [];
  files.forEach((file, source) => {
    const size = dims[source], count = size && isTall(size.width, size.height) ? estimateBandCount(size.width, size.height) : 1;
    for (let i = 0; i < count; i++) parts.push({ file, source, top: 0, bottom: size?.height ?? 0, forced: false });
  });
  return parts.map((part, index) => ({ ...part, k: index + 1, n: parts.length }));
};

/** La luminance d'un bitmap RGBA de jimp. */
export function grayOf(bitmap: { width: number; height: number; data: Uint8Array | Buffer }): Bitmap {
  const gray = new Uint8Array(bitmap.width * bitmap.height);
  for (let i = 0; i < gray.length; i++) gray[i] = Math.round(0.299 * bitmap.data[i * 4] + 0.587 * bitmap.data[i * 4 + 1] + 0.114 * bitmap.data[i * 4 + 2]);
  return { width: bitmap.width, height: bitmap.height, gray };
}

/** Avec jimp : les images hautes sont coupées sur des rangées presque vides ; les autres fichiers (captures courtes) restent entiers, dans l'ordre. */
export function jimpBander(cacheDir?: string): Bander {
  return async (files, caseId) => {
    const Jimp = await loadJimp();
    const decoded = await Promise.all(files.map(async file => (isImage(file) ? await Jimp.read(Buffer.from(file.data, 'base64')) : null)));
    if (!decoded.some(image => image && isTall(image.bitmap.width, image.bitmap.height))) return null;
    const parts: Array<Omit<BandPart, 'k' | 'n'>> = [];
    for (let source = 0; source < files.length; source++) {
      const image = decoded[source];
      if (!image || !isTall(image.bitmap.width, image.bitmap.height)) { parts.push({ file: files[source], source, top: 0, bottom: image?.bitmap.height ?? 0, forced: false }); continue; }
      const bands = planBands(inkRows(grayOf(image.bitmap)), image.bitmap.width);
      for (const band of bands) {
        const crop = image.clone().crop({ x: 0, y: band.top, w: image.bitmap.width, h: band.bottom - band.top });
        const bytes: Buffer = await crop.getBuffer('image/jpeg', { quality: 92 });
        parts.push({ file: { mimeType: 'image/jpeg', data: bytes.toString('base64') }, source, top: band.top, bottom: band.bottom, forced: band.forcedTop || band.forcedBottom });
      }
    }
    const total = parts.length;
    if (cacheDir) {
      mkdirSync(cacheDir, { recursive: true });
      parts.forEach((part, index) => writeFileSync(path.join(cacheDir, `${caseId}-partie-${index + 1}.${part.file.mimeType === 'image/png' ? 'png' : 'jpg'}`), Buffer.from(part.file.data, 'base64')));
    }
    return parts.map((part, index) => ({ ...part, k: index + 1, n: total }));
  };
}
