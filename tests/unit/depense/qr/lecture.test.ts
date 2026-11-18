// @vitest-environment jsdom
/**
 * Voie qr-app : la lecture du QR-facture dans le téléphone (`src/services/qrLecture.ts`). zxing-wasm et pdf.js sont SIMULÉS (aucun wasm, aucun réseau, aucune pièce réelle) ;
 * le décodage réel se joue dans Chrome (captures de la voie). Charges d'après les exemples PUBLICS des Guidelines (aide.ts).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { charge, S1_EXEMPLE } from './aide';

const zx = vi.hoisted(() => ({ readBarcodes: vi.fn(), prepareZXingModule: vi.fn() }));
const pdf = vi.hoisted(() => ({ getDocument: vi.fn(), options: {} as { workerSrc?: string }, pages: [] as number[], destroyed: vi.fn() }));
vi.mock('zxing-wasm/reader', () => ({ readBarcodes: zx.readBarcodes, prepareZXingModule: zx.prepareZXingModule }));
vi.mock('zxing-wasm/reader/zxing_reader.wasm?url', () => ({ default: '/assets/zxing_reader-test.wasm' }));
vi.mock('pdfjs-dist', () => ({ GlobalWorkerOptions: pdf.options, getDocument: pdf.getDocument }));
vi.mock('pdfjs-dist/build/pdf.worker.min.mjs?url', () => ({ default: '/assets/pdf.worker.min-test.mjs' }));

import { classer, lireQrDuFichier, type MoteursQr, type CodeLu } from '../../../../src/services/qrLecture';

const spc = (o = {}): CodeLu => ({ texte: charge({ s1: S1_EXEMPLE, ...o }), decode: true });
const image = new File([new Uint8Array([1, 2, 3])], 'photo.jpg', { type: 'image/jpeg' });
const fichierPdf = (nom = 'facture.pdf') => new File([new Uint8Array([37, 80, 68, 70])], nom, { type: 'application/pdf' });
const pixels = (n: number) => ({ width: n, height: n, data: new Uint8ClampedArray(4), colorSpace: 'srgb' }) as unknown as ImageData;

/** Des moteurs simulés : `lireCodes` rend les réponses dans l'ordre ; `pagesPdf` rend n pages. */
function moteurs(reponses: CodeLu[][], pages = 2, grande: ImageData | null = pixels(9)): MoteursQr & { appels: unknown[] } {
  const appels: unknown[] = [];
  let i = 0;
  return {
    appels,
    lireCodes: async entree => { appels.push(entree); return reponses[i++] ?? []; },
    pagesPdf: async function* (_donnees, n) { for (let p = 0; p < Math.min(n, pages); p++) yield pixels(100 + p); },
    agrandir: async () => grande,
  };
}

describe('classer : ce que le décodeur rend', () => {
  it('prend le premier QR-facture décodé, même après un autre QR (une adresse web)', () => {
    const r = classer([{ texte: 'https://exemple.test', decode: true }, spc()]);
    expect(r.qr?.valid).toBe(true);
    expect(r.qr?.s1?.numero).toBe('10201409');
  });
  it('un QR vu mais pas décodé est signalé, sans QR-facture', () => {
    expect(classer([{ texte: '', decode: false }])).toEqual({ qr: null, vuNonDecode: true });
  });
  it('un autre QR décodé (pas un SPC) n’est pas un QR-facture, et rien n’est « illisible »', () => {
    expect(classer([{ texte: 'https://exemple.test', decode: true }])).toEqual({ qr: null, vuNonDecode: false });
  });
  it('un QR-facture non conforme est rendu tel quel (valid: false) : il ne confirmera rien', () => {
    const r = classer([spc({ iban: 'CH0000000000000000000' })]);
    expect(r.qr?.valid).toBe(false);
  });
});

describe('une image', () => {
  it('lit le QR-facture à la première passe, sans agrandir', async () => {
    const m = moteurs([[spc()]]);
    const r = await lireQrDuFichier(image, m);
    expect(r.statut).toBe('lu');
    expect(m.appels).toHaveLength(1);
  });
  it('si rien à la première passe, une seconde passe sur l’image agrandie', async () => {
    const m = moteurs([[], [spc()]]);
    const r = await lireQrDuFichier(image, m);
    expect(r.statut).toBe('lu');
    expect(m.appels).toHaveLength(2);
    expect((m.appels[1] as ImageData).width).toBe(9);
  });
  it('rien aux deux passes : « sans » (aucun QR-facture), jamais « illisible »', async () => {
    expect(await lireQrDuFichier(image, moteurs([[], []]))).toEqual({ statut: 'sans' });
  });
  it('un QR vu mais pas décodé aux deux passes : « illisible »', async () => {
    expect(await lireQrDuFichier(image, moteurs([[{ texte: '', decode: false }], [{ texte: '', decode: false }]]))).toEqual({ statut: 'illisible' });
  });
  it('vu à la première passe, décodé à la seconde : « lu »', async () => {
    const r = await lireQrDuFichier(image, moteurs([[{ texte: '', decode: false }], [spc()]]));
    expect(r.statut).toBe('lu');
  });
  it('l’agrandissement impossible : une seule passe, le résultat de la première', async () => {
    const m = moteurs([[]], 2, null);
    expect(await lireQrDuFichier(image, m)).toEqual({ statut: 'sans' });
    expect(m.appels).toHaveLength(1);
  });
});

describe('un PDF', () => {
  it('rend les deux dernières pages, la dernière d’abord, et s’arrête au premier QR-facture', async () => {
    const m = moteurs([[spc()]], 2);
    const r = await lireQrDuFichier(fichierPdf(), m);
    expect(r.statut).toBe('lu');
    expect(m.appels).toHaveLength(1);
    expect((m.appels[0] as ImageData).width).toBe(100);
  });
  it('le QR sur l’avant-dernière page est lu à la seconde page rendue', async () => {
    const m = moteurs([[], [spc()]], 2);
    expect((await lireQrDuFichier(fichierPdf(), m)).statut).toBe('lu');
    expect(m.appels).toHaveLength(2);
  });
  it('aucun QR sur les deux pages : « sans »', async () => {
    expect(await lireQrDuFichier(fichierPdf(), moteurs([[], []], 2))).toEqual({ statut: 'sans' });
  });
  it('un QR vu et pas décodé sur une page, rien sur l’autre : « illisible »', async () => {
    expect(await lireQrDuFichier(fichierPdf(), moteurs([[{ texte: '', decode: false }], []], 2))).toEqual({ statut: 'illisible' });
  });
  it('un PDF reconnu à son nom quand le type manque', async () => {
    const m = moteurs([[spc()]]);
    const r = await lireQrDuFichier(new File([new Uint8Array([1])], 'facture.PDF', { type: '' }), m);
    expect(r.statut).toBe('lu');
    expect(m.appels[0]).toHaveProperty('height');
  });
});

describe('jamais d’exception, jamais de faux « sans »', () => {
  it('une erreur du décodeur : « non vérifié », pas une exception', async () => {
    const m = moteurs([]);
    m.lireCodes = async () => { throw new Error('wasm introuvable (hors ligne)'); };
    expect(await lireQrDuFichier(image, m)).toEqual({ statut: 'non-verifie', motif: 'wasm introuvable (hors ligne)' });
  });
  it('un type de fichier que l’on ne lit pas : « non vérifié », et pas « sans QR »', async () => {
    const r = await lireQrDuFichier(new File(['x'], 'note.txt', { type: 'text/plain' }), moteurs([]));
    expect(r.statut).toBe('non-verifie');
  });
  it('un délai dépassé : « non vérifié », la lecture ne retient jamais la dépense', async () => {
    const m = moteurs([]);
    m.lireCodes = () => new Promise(() => undefined);
    const r = await lireQrDuFichier(image, m, 30);
    expect(r).toEqual({ statut: 'non-verifie', motif: 'délai dépassé' });
  });
});

describe('les moteurs réels (zxing-wasm et pdf.js simulés)', () => {
  // Le module est rechargé à chaque test : les moteurs chargés à la demande sont gardés en mémoire, et chaque test doit voir leur chargement.
  const lire = async (fichier: File) => (await import('../../../../src/services/qrLecture')).lireQrDuFichier(fichier);
  beforeEach(() => {
    vi.resetModules();
    zx.readBarcodes.mockReset(); zx.prepareZXingModule.mockReset(); pdf.getDocument.mockReset(); pdf.destroyed.mockReset(); pdf.pages.length = 0;
    // jsdom n'a pas de canevas : un contexte minimal, qui rend des pixels.
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation((() => ({
      fillRect: () => undefined, drawImage: () => undefined, getImageData: (_x: number, _y: number, w: number, h: number) => ({ width: w, height: h, data: new Uint8ClampedArray(4), colorSpace: 'srgb' }),
    })) as never);
    pdf.getDocument.mockImplementation(() => ({
      promise: Promise.resolve({
        numPages: 5, destroy: pdf.destroyed,
        getPage: async (numero: number) => { pdf.pages.push(numero); return { getViewport: ({ scale }: { scale: number }) => ({ width: 100 * scale, height: 140 * scale }), render: () => ({ promise: Promise.resolve() }), cleanup: () => undefined }; },
      }),
    }));
  });

  it('PDF : ne passe PAS standardFontDataUrl (il effaçait le QR d’un PDF), garde isEvalSupported: false', async () => {
    zx.readBarcodes.mockResolvedValue([]);
    await lire(fichierPdf());
    expect(pdf.getDocument).toHaveBeenCalledTimes(1);
    const options = pdf.getDocument.mock.calls[0][0];
    expect(options).not.toHaveProperty('standardFontDataUrl');
    expect(options.isEvalSupported).toBe(false);
    expect(options.data).toBeInstanceOf(Uint8Array);
  });
  it('PDF : le worker de pdf.js est un fichier de l’app (adresse `?url`), jamais un CDN', async () => {
    zx.readBarcodes.mockResolvedValue([]);
    await lire(fichierPdf());
    expect(pdf.options.workerSrc).toBe('/assets/pdf.worker.min-test.mjs');
    expect(pdf.options.workerSrc).not.toMatch(/^https?:/);
  });
  it('PDF de cinq pages : seules les pages 5 puis 4 sont rendues (échelle 3), le document est libéré', async () => {
    zx.readBarcodes.mockResolvedValue([]);
    const r = await lire(fichierPdf());
    expect(r).toEqual({ statut: 'sans' });
    expect(pdf.pages).toEqual([5, 4]);
    expect(pdf.destroyed).toHaveBeenCalled();
  });
  it('PDF : arrêt au premier QR-facture, la page 4 n’est pas rendue', async () => {
    zx.readBarcodes.mockResolvedValue([{ format: 'QRCode', text: spc().texte, isValid: true }]);
    const r = await lire(fichierPdf());
    expect(r.statut).toBe('lu');
    expect(pdf.pages).toEqual([5]);
  });
  it('le wasm de zxing est servi par l’app (locateFile), les QR seuls sont lus, les erreurs rendues', async () => {
    zx.readBarcodes.mockResolvedValue([{ format: 'QRCode', text: '', isValid: false }, { format: 'EAN13', text: '123', isValid: true }]);
    const r = await lire(image);
    expect(r).toEqual({ statut: 'illisible' });
    const { overrides } = zx.prepareZXingModule.mock.calls[0][0];
    expect(overrides.locateFile('zxing_reader.wasm', 'https://cdn.jsdelivr.net/')).toBe('/assets/zxing_reader-test.wasm');
    const options = zx.readBarcodes.mock.calls[0][1];
    expect(options).toMatchObject({ formats: ['QRCode'], returnErrors: true, tryHarder: true });
  });
});
