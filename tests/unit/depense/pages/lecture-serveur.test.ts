/**
 * Voie n2-pages, P3 : la lecture de plusieurs pages côté serveur (`functions/src/ai.ts`), Gemini et le budget simulés.
 * T-S1 `pagesDeLecture` · T-S2 le corps à N parts · T-S3 un fichier seul identique à aujourd'hui · T-S4 la clé de cache et l'ordre
 * T-S5 `chargeDeLecture` (file / files) · T-S6 la taille · T-S7 la phrase du banc.
 * C'est ici que P3 se prouve : le banc de bout en bout intercepte `aiTask` dans la page, il ne joue pas ce fichier.
 */
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import { createHash } from 'node:crypto';

const budget = vi.hoisted(() => ({ keys: [] as any[] }));
vi.mock('../../../../functions/src/invoiceScanBudget', () => ({
  runBudgetedInvoiceScan: async (_uid: any, key: any, work: any, provider: any) => { budget.keys.push(key); return { result: await work(provider), cached: false, documentHash: 'document-hash' }; }
}));
import * as ai from '../../../../functions/src/ai';
import { invoiceDocumentHash, invoiceScanId } from '../../../../functions/src/invoiceScanCore';
import { INVOICE_SCAN_PROMPTS } from '../../../../functions/src/invoiceScanPrompts';
import { GEMINI_LITE_MODEL } from '../../../../functions/src/models';
import { buildReadBody, multiCaptureNote } from '../../../../scripts/banc-lecture-facture';
import { refuserPage, TOTAL_OCTETS_MAX } from '../../../../src/services/pagesJustificatif';

const { scanInvoiceSafely, pagesDeLecture, cleDePages, chargeDeLecture, MULTI_PAGE_NOTE, MAX_PAGES_B64 } = ai as any;
const jpeg = (n: number, octets = 6) => ({ mimeType: 'image/jpeg', data: Buffer.from([255, 216, 255, 217, n, ...new Array(octets - 5).fill(7)]).toString('base64') });
const gros = (caracteres: number) => ({ mimeType: 'image/jpeg', data: Buffer.concat([Buffer.from([255, 216, 255]), Buffer.alloc((caracteres / 4) * 3 - 3, 1)]).toString('base64') });
const [A, B, C] = [jpeg(1), jpeg(2), jpeg(3)];
const invoice = () => ({ vendor: 'Fournisseur', currency: 'CHF', date: '09.09.2026', invoiceNumber: 'F-42', amountHT: 100, tvaAmount: 8.1, amountTTC: 108.1, tvaRate: .081, items: [{ name: 'Article', kind: 'stock', quantity: 2, unit: 'pièce', price: 54.05, amountTTC: 108.1 }] });
const reponse = (data: any) => ({ ok: true, json: async () => ({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: JSON.stringify(data) }] } }], usageMetadata: { totalTokenCount: 10 } }) });
const fetchMock = vi.fn();
beforeEach(() => { fetchMock.mockReset(); budget.keys = []; vi.stubGlobal('fetch', fetchMock); fetchMock.mockImplementation(async () => reponse(invoice())); });
afterEach(() => vi.unstubAllGlobals());
const corps = () => fetchMock.mock.calls.map(([, options]) => JSON.parse(options.body));

describe('T-S1 pagesDeLecture : 2 à 4 images valides', () => {
  it('refuse 1, 5, un PDF, une page de plus de 4 Mo ; accepte 2 à 4 images', () => {
    expect(() => pagesDeLecture([A])).toThrow();
    expect(() => pagesDeLecture([A, B, C, jpeg(4), jpeg(5)])).toThrow();
    const pdf = { mimeType: 'application/pdf', data: Buffer.from('%PDF-1.4\n/Type /Page\n').toString('base64') };
    expect(() => pagesDeLecture([A, pdf])).toThrow();
    expect(() => pagesDeLecture([A, gros(5_592_412)])).toThrow();
    expect(() => pagesDeLecture('pas un tableau')).toThrow();
    expect(pagesDeLecture([A, B])).toHaveLength(2);
    expect(pagesDeLecture([A, B, C, jpeg(4)])).toHaveLength(4);
  });
});

describe('T-S2 une lecture de N pages : N parts d\'image, dans l\'ordre, comme le banc', () => {
  it('les deux Flash-Lite envoient [texte avec la note, a, b, c] ; le retour dit pages:3 ; la clé de cache est celle des pages', async () => {
    const result: any = await scanInvoiceSafely('u', [A, B, C], 'clé-factice');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    for (const [url] of fetchMock.mock.calls) expect(url).toContain(`${GEMINI_LITE_MODEL}:generateContent`);
    const lectures = corps();
    lectures.forEach((body, i) => {
      const parts = body.contents[0].parts;
      expect(parts).toHaveLength(4);
      expect(parts.slice(1)).toEqual([{ inlineData: A }, { inlineData: B }, { inlineData: C }]);
      expect(body.contents).toEqual((buildReadBody([A, B, C], INVOICE_SCAN_PROMPTS[i], 8192) as any).contents);
    });
    expect(result).toMatchObject({ ok: true, pages: 3 });
    expect(budget.keys[0]).toEqual(cleDePages([A, B, C]));
  });
});

describe('T-S3 un fichier seul (ou un tableau d\'un) : le corps d\'aujourd\'hui, aucune clé pages', () => {
  it.each([['le fichier', A], ['un tableau de 1', [A]]])('%s', async (_nom, entree) => {
    const result: any = await scanInvoiceSafely('u', entree, 'clé-factice');
    for (const [i, body] of corps().entries()) {
      expect(body.contents[0].parts).toEqual([{ text: INVOICE_SCAN_PROMPTS[i] }, { inlineData: A }]);
      expect(body.contents).toEqual((buildReadBody(A, INVOICE_SCAN_PROMPTS[i], 8192) as any).contents);
    }
    expect(result.pages).toBeUndefined();
    expect(budget.keys[0]).toEqual(A);
  });
});

describe('T-S4 la clé de cache d\'une lecture à pages dépend de l\'ordre', () => {
  it('autre ordre = autre clé et autre identifiant ; une clé de pages n\'est jamais celle d\'un fichier seul', () => {
    expect(cleDePages([A, B, C])).not.toEqual(cleDePages([C, B, A]));
    expect(invoiceScanId('u', cleDePages([A, B, C]))).not.toBe(invoiceScanId('u', cleDePages([C, B, A])));
    expect(invoiceScanId('u', cleDePages([A, B]))).not.toBe(invoiceScanId('u', A));
    const attendu = createHash('sha256').update(Buffer.concat([A, B].map(p => createHash('sha256').update(Buffer.from(p.data, 'base64')).digest()))).digest('hex');
    expect(invoiceDocumentHash(cleDePages([A, B]))).toBe(attendu);
  });
});

describe('T-S5 chargeDeLecture : file, files, jamais les deux, files seulement pour scanInvoice', () => {
  const def = { acceptsFile: true };
  it('files seul → pages ; file seul → fichier ; rien → aucune', () => {
    expect(chargeDeLecture({ task: 'scanInvoice', files: [A, B] }, def)).toEqual({ kind: 'pages', files: [A, B] });
    expect(chargeDeLecture({ task: 'scanInvoice', file: A }, def)).toEqual({ kind: 'fichier', file: A });
    expect(chargeDeLecture({ task: 'scanInvoice' }, def)).toEqual({ kind: 'aucune' });
  });
  it('refuse file et files ensemble, files hors scanInvoice, files qui n\'est pas un tableau', () => {
    const code = (f: () => unknown) => { try { f(); } catch (e: any) { return e.code; } return 'aucune erreur'; };
    expect(code(() => chargeDeLecture({ task: 'scanInvoice', file: A, files: [A, B] }, def))).toBe('invalid-argument');
    expect(code(() => chargeDeLecture({ task: 'importRecipe', files: [A, B] }, def))).toBe('invalid-argument');
    expect(code(() => chargeDeLecture({ task: 'scanInvoice', files: 'x' }, def))).toBe('invalid-argument');
    expect(code(() => chargeDeLecture({ task: 'scanInvoice', file: A }, { acceptsFile: false }))).toBe('invalid-argument');
  });
});

describe('T-S6 la taille d\'une requête de pages', () => {
  it('16 000 000 caractères de base64 passent, 16 000 004 sont refusés', () => {
    expect(MAX_PAGES_B64).toBe(16_000_000);
    const quatre = [gros(4_000_000), gros(4_000_000), gros(4_000_000), gros(4_000_000)];
    expect(pagesDeLecture(quatre)).toHaveLength(4);
    expect(() => pagesDeLecture([quatre[0], quatre[1], quatre[2], gros(4_000_004)])).toThrow();
  });
});

describe('T-S8 une seule borne : ce que la rangée accepte, le serveur le lit', () => {
  const MO = 1024 * 1024;
  const fichier = (size: number) => ({ name: 'p.jpg', type: 'image/jpeg', size }) as unknown as File;
  /** Les pages de la rangée, dans l'ordre d'ajout, comme `refuserPage` les voit. */
  const poser = (tailles: number[]) => { const deja: Array<{ file: File; empreinte: string }> = []; for (const [i, t] of tailles.entries()) deja.push({ file: fichier(t), empreinte: `e${i}` }); return deja; };
  /** De vrais octets, passés en base64 page par page (le rembourrage « = » de chaque page compte) : ce que le client envoie. */
  const reelles = (tailles: number[]) => tailles.map((t, i) => ({ mimeType: 'image/jpeg', data: Buffer.concat([Buffer.from([255, 216, 255]), Buffer.alloc(t - 3, i + 1)]).toString('base64') }));
  const plusGrosAccepte = (deja: number[]) => { let [bas, haut] = [1, 4 * MO]; while (bas < haut) { const milieu = Math.ceil((bas + haut) / 2); if (refuserPage(fichier(milieu), poser(deja)) === null) bas = milieu; else haut = milieu - 1; } return bas; };

  it('le total maximal qu\'accepte refuserPage (4 Mo, 4 Mo, puis la plus grosse page admise) passe pagesDeLecture ; un octet de plus est refusé par la rangée', () => {
    const troisieme = plusGrosAccepte([4 * MO, 4 * MO]);
    expect(troisieme).toBeGreaterThan(3_000_000);
    const tailles = [4 * MO, 4 * MO, troisieme];
    expect(refuserPage(fichier(troisieme), poser([4 * MO, 4 * MO]))).toBeNull();
    expect(refuserPage(fichier(troisieme + 1), poser([4 * MO, 4 * MO]))).toMatch(/12 Mo au plus/);
    expect(pagesDeLecture(reelles(tailles))).toHaveLength(3);
    expect(() => pagesDeLecture(reelles([4 * MO, 4 * MO, troisieme + 1]))).toThrow(/12 Mo/);
  });
  it('quatre pages : la même chose, jusqu\'au dernier octet', () => {
    const quatrieme = plusGrosAccepte([3 * MO, 3 * MO, 3 * MO]);
    expect(refuserPage(fichier(quatrieme + 1), poser([3 * MO, 3 * MO, 3 * MO]))).toMatch(/12 Mo au plus/);
    expect(pagesDeLecture(reelles([3 * MO, 3 * MO, 3 * MO, quatrieme]))).toHaveLength(4);
    expect(() => pagesDeLecture(reelles([3 * MO, 3 * MO, 3 * MO, quatrieme + 1]))).toThrow(/12 Mo/);
  });
  it('le client n\'accepte jamais plus de 12 000 000 octets en tout, le serveur garde ses 16 000 000 caractères', () => {
    expect(TOTAL_OCTETS_MAX).toBe(12_000_000);
    expect(MAX_PAGES_B64).toBe(16_000_000);
    expect(refuserPage(fichier(1), poser([4_000_000, 4_000_000, 4_000_000]))).toBe('Les pages pèsent 12,1 Mo : 12 Mo au plus.');
  });
});

describe('T-S7 la phrase des plusieurs captures est celle du banc', () => {
  it('mot pour mot', () => { expect(MULTI_PAGE_NOTE(3)).toBe(multiCaptureNote(3)); });
});
