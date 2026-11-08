// Lecture du QR-facture suisse DANS LE TÉLÉPHONE (D240 : zxing-wasm ; D243 : pdf.js pour un PDF). Aucun réseau : le wasm de zxing et le worker de pdf.js sont
// des fichiers de l'app (imports `?url` de Vite), chargés à la demande (import dynamique) : jamais dans le morceau principal, jamais d'un CDN.
// Le texte décodé passe par `parseSwissQr` (module pur, `qrFacture.ts`) ; la confrontation à la lecture de la facture est faite par l'écran.
// Une lecture qui échoue ne bloque jamais la dépense : elle rend `non-verifie`, jamais une exception.
import { parseSwissQr, type QrFacture } from './qrFacture';
import { chargerPdfjs } from './pdfjs';

/**
 * Le résultat d'une lecture de QR :
 * - `lu` : un QR-facture (SPC) décodé ; `qr.valid` dit s'il est conforme (un QR non conforme ne confirme rien, voir `confronterQr`) ;
 * - `illisible` : un QR vu (repères trouvés) mais pas décodé ;
 * - `sans` : aucun QR-facture sur la pièce ;
 * - `non-verifie` : la lecture n'a pas pu se faire (bibliothèque non chargée, hors ligne, erreur, délai) : on ne sait pas.
 */
export type ResultatQr =
  | { statut: 'lu'; qr: QrFacture; ms: number; /** LP-1 : présent seulement quand la pièce porte plusieurs bulletins QR-facture ; le QR gardé est le premier. */ bulletins?: number;
      /** LO-1 : avec `bulletins`, le montant de CHAQUE bulletin dans l'ordre de lecture (`null` : sans montant, non conforme ou dans une autre devise que le premier). Sert à reconnaître un total qui n'est que leur somme. */ montantsBulletins?: Array<number | null> }
  | { statut: 'illisible' }
  | { statut: 'sans' }
  | { statut: 'non-verifie'; motif: string };

/** Ce que le décodeur rend d'un symbole : son texte et s'il a été décodé. */
export interface CodeLu { texte: string; decode: boolean }

/** Les deux moteurs, injectables (tests) : `lireCodes` décode une image (blob ou pixels), `pagesPdf` rend les dernières pages d'un PDF en pixels. */
export interface MoteursQr {
  lireCodes(entree: Blob | ImageData): Promise<CodeLu[]>;
  /** Les `n` dernières pages, la dernière d'abord, rendues à l'échelle `echelle`. */
  pagesPdf(donnees: ArrayBuffer, n: number, echelle: number): AsyncIterable<ImageData>;
  /** L'image agrandie (seconde passe) ; `null` si elle ne peut pas l'être. */
  agrandir(image: Blob): Promise<ImageData | null>;
}

/** Les deux dernières pages, à l'échelle 3 (mesuré au banc). */
export const PAGES_PDF = 2;
export const ECHELLE_PDF = 3;
/** Au-delà, la lecture est abandonnée : `non-verifie`. Elle tourne à côté de Gemini et ne le retarde jamais. */
export const DELAI_MAX_MS = 20_000;

const estPdf = (fichier: File): boolean => fichier.type === 'application/pdf' || /\.pdf$/i.test(fichier.name);
const estImage = (fichier: File): boolean => /^image\//.test(fichier.type) || /\.(jpe?g|png|webp)$/i.test(fichier.name);

/** Range les symboles lus : le premier QR-facture, sinon « vu mais pas décodé », sinon rien. */
export function classer(codes: readonly CodeLu[]): { qr: QrFacture | null; vuNonDecode: boolean; bulletins?: number; montantsBulletins?: Array<number | null> } {
  let vuNonDecode = false, premier: QrFacture | null = null;
  const montants: Array<number | null> = [], vus = new Set<string>();
  for (const code of codes) {
    if (!code.decode) { vuNonDecode = true; continue; }
    const qr = parseSwissQr(code.texte);
    if (!qr) continue;
    // Le même bulletin vu deux fois (même texte décodé) n'est qu'un bulletin.
    if (vus.has(code.texte)) continue;
    vus.add(code.texte);
    premier ??= qr;
    montants.push(qr.valid && qr.montant !== null && qr.devise === premier.devise ? qr.montant : null);
  }
  // LP-1 : plusieurs bulletins QR-facture sur une même photo : le premier est gardé, leur nombre est dit (absent s'il n'y en a qu'un).
  // LO-1 : et le montant de chacun, pour reconnaître un total de page qui n'est que leur somme (jamais imprimé).
  return { qr: premier, vuNonDecode, ...(montants.length > 1 ? { bulletins: montants.length, montantsBulletins: montants } : {}) };
}

type Trouve = ReturnType<typeof classer>;

/** Lit un QR-facture sur une image : une passe, puis (si rien) une seconde passe sur l'image agrandie. */
async function lireImage(image: Blob, moteurs: MoteursQr): Promise<Trouve> {
  const premiere = classer(await moteurs.lireCodes(image));
  if (premiere.qr) return premiere;
  const grande = await moteurs.agrandir(image);
  if (!grande) return premiere;
  const seconde = classer(await moteurs.lireCodes(grande));
  return { ...seconde, vuNonDecode: premiere.vuNonDecode || seconde.vuNonDecode };
}

/** Lit un QR-facture sur les deux dernières pages d'un PDF ; arrêt au premier QR-facture. */
async function lirePdf(fichier: File, moteurs: MoteursQr): Promise<Trouve> {
  let vuNonDecode = false;
  for await (const page of moteurs.pagesPdf(await fichier.arrayBuffer(), PAGES_PDF, ECHELLE_PDF)) {
    const trouve = classer(await moteurs.lireCodes(page));
    if (trouve.qr) return trouve;
    vuNonDecode = vuNonDecode || trouve.vuNonDecode;
  }
  return { qr: null, vuNonDecode };
}

const maintenant = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

/**
 * Lit le QR-facture du fichier choisi, dans l'appareil. Ne lève jamais : toute erreur devient `non-verifie`.
 * Un type de fichier que l'on ne sait pas lire (ni image, ni PDF) est `non-verifie`, pas `sans`.
 */
export async function lireQrDuFichier(fichier: File, moteurs?: MoteursQr, delaiMs: number = DELAI_MAX_MS): Promise<ResultatQr> {
  const debut = maintenant();
  let minuterie: ReturnType<typeof setTimeout> | undefined;
  try {
    if (!estPdf(fichier) && !estImage(fichier)) return { statut: 'non-verifie', motif: 'type de fichier non lu' };
    const travail = (async (): Promise<ResultatQr> => {
      const m = moteurs ?? await moteursParDefaut();
      const trouve = estPdf(fichier) ? await lirePdf(fichier, m) : await lireImage(fichier, m);
      if (trouve.qr) return { statut: 'lu', qr: trouve.qr, ms: Math.round(maintenant() - debut), ...(trouve.bulletins ? { bulletins: trouve.bulletins, ...(trouve.montantsBulletins ? { montantsBulletins: trouve.montantsBulletins } : {}) } : {}) };
      return trouve.vuNonDecode ? { statut: 'illisible' } : { statut: 'sans' };
    })();
    const delai = new Promise<ResultatQr>(resolve => { minuterie = setTimeout(() => resolve({ statut: 'non-verifie', motif: 'délai dépassé' }), delaiMs); });
    return await Promise.race([travail, delai]);
  } catch (erreur) {
    return { statut: 'non-verifie', motif: erreur instanceof Error ? erreur.message : 'lecture impossible' };
  } finally {
    if (minuterie !== undefined) clearTimeout(minuterie);
  }
}

// ---------------------------------------------------------------------------------------------------------------------------------
// Les moteurs réels : chargés à la demande
// ---------------------------------------------------------------------------------------------------------------------------------

let moteurs: Promise<MoteursQr> | undefined;
/** Charge zxing-wasm et pdf.js une fois (import dynamique). Un échec de chargement n'est pas gardé : le prochain fichier réessaie (réseau revenu). */
function moteursParDefaut(): Promise<MoteursQr> {
  moteurs ??= creerMoteurs().catch(erreur => { moteurs = undefined; throw erreur; });
  return moteurs;
}

async function creerMoteurs(): Promise<MoteursQr> {
  const [zxing, wasm] = await Promise.all([import('zxing-wasm/reader'), import('zxing-wasm/reader/zxing_reader.wasm?url')]);
  const adresseWasm = wasm.default;
  // Le wasm est servi par l'app : `locateFile` ne rend jamais une adresse du CDN par défaut de zxing-wasm.
  zxing.prepareZXingModule({ overrides: { locateFile: (chemin: string, prefixe: string) => (chemin.endsWith('.wasm') ? adresseWasm : prefixe + chemin) } });
  const options = { formats: ['QRCode' as const], tryHarder: true, tryRotate: true, tryInvert: true, tryDownscale: true, maxNumberOfSymbols: 4, returnErrors: true };
  return {
    async lireCodes(entree) {
      const resultats = await zxing.readBarcodes(entree, options);
      return resultats.filter(r => r.format === 'QRCode').map(r => ({ texte: r.text ?? '', decode: r.isValid }));
    },
    async *pagesPdf(donnees, n, echelle) {
      const pdfjs = await chargerPdfjs();
      // Piège mesuré au banc : ne PAS passer `standardFontDataUrl` (il effaçait le QR d'un PDF). `isEvalSupported: false` : aucune évaluation de code.
      const tache = pdfjs.getDocument({ data: new Uint8Array(donnees), isEvalSupported: false });
      const pdf = await tache.promise;
      try {
        for (let numero = pdf.numPages; numero >= Math.max(1, pdf.numPages - n + 1); numero--) {
          const page = await pdf.getPage(numero);
          const vue = page.getViewport({ scale: echelle });
          const canevas = document.createElement('canvas');
          canevas.width = Math.ceil(vue.width); canevas.height = Math.ceil(vue.height);
          const contexte = canevas.getContext('2d', { willReadFrequently: true });
          if (!contexte) throw new Error('canevas indisponible');
          contexte.fillStyle = '#fff'; contexte.fillRect(0, 0, canevas.width, canevas.height);
          await page.render({ canvasContext: contexte, viewport: vue }).promise;
          const pixels = contexte.getImageData(0, 0, canevas.width, canevas.height);
          page.cleanup();
          canevas.width = 0; canevas.height = 0;
          yield pixels;
        }
      } finally { void pdf.destroy(); }
    },
    async agrandir(image) {
      if (typeof createImageBitmap === 'undefined') return null;
      const bitmap = await createImageBitmap(image);
      try {
        // Au plus ×2, et jamais au-delà de 4 000 px de côté (mémoire d'un téléphone).
        const facteur = Math.min(2, 4000 / Math.max(bitmap.width, bitmap.height));
        if (facteur <= 1.05) return null;
        const canevas = document.createElement('canvas');
        canevas.width = Math.round(bitmap.width * facteur); canevas.height = Math.round(bitmap.height * facteur);
        const contexte = canevas.getContext('2d', { willReadFrequently: true });
        if (!contexte) return null;
        contexte.imageSmoothingEnabled = true; contexte.imageSmoothingQuality = 'high';
        contexte.drawImage(bitmap, 0, 0, canevas.width, canevas.height);
        return contexte.getImageData(0, 0, canevas.width, canevas.height);
      } finally { bitmap.close(); }
    },
  };
}
