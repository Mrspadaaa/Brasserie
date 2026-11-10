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
// D380 : le pur (encre, plan de bandes, consignes, recollage) vit dans functions/src/invoiceMorceaux.ts, partagé par l'app et le serveur ; le banc l'importe.
import { TALL_RATIO, BAND_MAX_RATIO, BAND_OVERLAP_RATIO, BAND_MAX_LINES, EMPTY_ROW_MAX, INK_DIFF, isTall, inkRows, linePitch, pickCut, planBands, inkedCuts, estimateBandCount, pageNote, bandNote, itemKey, OVERLAP_WINDOW, dedupeOverlap, overlapDrops, mergeDecoded, type Bitmap, type Band, type BandOptions } from '../functions/src/invoiceMorceaux';
export { TALL_RATIO, BAND_MAX_RATIO, BAND_OVERLAP_RATIO, BAND_MAX_LINES, EMPTY_ROW_MAX, INK_DIFF, isTall, inkRows, linePitch, pickCut, planBands, inkedCuts, estimateBandCount, pageNote, bandNote, itemKey, OVERLAP_WINDOW, dedupeOverlap, overlapDrops, mergeDecoded };
export type { Bitmap, Band, BandOptions };

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
