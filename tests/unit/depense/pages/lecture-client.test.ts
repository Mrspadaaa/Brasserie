// @vitest-environment jsdom
/**
 * Voie n2-pages, P3 : le client envoie N images et ne présente jamais une lecture d'une seule page comme complète.
 * T-L1 la charge `files` · T-L2 la charge `file` d'avant · T-L3 `ok:true` sans `pages` · T-L4 `pages:1`
 * T-L5 le refus du vieux serveur · T-L6 toute autre erreur passe telle quelle · T-L7 le cas nominal.
 * Gemini et `httpsCallable` simulés.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocked = vi.hoisted(() => ({ call: vi.fn() }));
vi.mock('firebase/functions', () => ({ httpsCallable: () => mocked.call }));
vi.mock('../../../../src/services/firebase', () => ({ functions: {} }));
import { AiClient } from '../../../../src/services/aiClient';
import { GeminiScannerService } from '../../../../src/services/geminiScanner';

const image = (nom: string, contenu = nom) => new File([contenu], nom, { type: 'image/jpeg' });
const [f1, f2, f3] = [image('a.jpg'), image('b.jpg'), image('c.jpg')];
const resultat = { vendor: 'Malzhaus Nord', currency: 'CHF', amountTTC: 48.7, items: [] };
const PAS_DISPONIBLE = /pas encore disponible/;
const MESSAGE_VIEUX_SERVEUR = 'Choisis une photo JPG, PNG, WebP ou un PDF de 4 pages maximum.';
beforeEach(() => mocked.call.mockReset());

describe('T-L1 / T-L2 la charge envoyée à aiTask', () => {
  it('T-L1 : plusieurs fichiers → `files` (3 entrées {data,mimeType}), jamais `file`', async () => {
    mocked.call.mockResolvedValue({ data: { ok: true, data: resultat, pages: 3 } });
    await AiClient.run({ task: 'scanInvoice', tier: 'fast', files: [f1, f2, f3] });
    const charge = mocked.call.mock.calls[0][0];
    expect(charge.files).toHaveLength(3);
    expect(charge.files.map((f: any) => Object.keys(f).sort())).toEqual([['data', 'mimeType'], ['data', 'mimeType'], ['data', 'mimeType']]);
    expect(charge.files.map((f: any) => Buffer.from(f.data, 'base64').toString())).toEqual(['a.jpg', 'b.jpg', 'c.jpg']);
    expect(charge.file).toBeUndefined();
  });
  it('T-L2 : un fichier → `file`, sans `files` (la charge d\'avant)', async () => {
    mocked.call.mockResolvedValue({ data: { ok: true, data: resultat } });
    await AiClient.run({ task: 'scanInvoice', tier: 'fast', file: f1 });
    const charge = mocked.call.mock.calls[0][0];
    expect(charge.file).toMatchObject({ mimeType: 'image/jpeg' });
    expect(charge.files).toBeUndefined();
  });
});

describe('T-L8 scanPages refuse au-delà de la borne unique (12 000 000 octets, base64 compris), sans appel', () => {
  const gros = (nom: string, taille: number) => { const f = image(nom); Object.defineProperty(f, 'size', { value: taille }); return f; };
  it('12 000 000 octets en tout dans la limite du serveur passent ; au-delà, ok:false « 12 Mo en tout » avant tout appel', async () => {
    mocked.call.mockResolvedValue({ data: { ok: true, data: resultat, pages: 3 } });
    const accepte = await GeminiScannerService.scanPages([gros('a.jpg', 3_900_000), gros('b.jpg', 3_900_000), gros('c.jpg', 4_000_000 - 100_000)]);
    expect(accepte.ok).toBe(true);
    mocked.call.mockClear();
    for (const tailles of [[4_000_000, 4_000_000, 4_000_001], [4 * 1024 * 1024, 4 * 1024 * 1024, 3_611_389], [4_000_000, 4_000_000, 4_000_000]]) {
      const sortie = await GeminiScannerService.scanPages(tailles.map((t, i) => gros(`p${i}.jpg`, t)));
      expect(sortie.ok).toBe(false);
      expect(sortie.error).toMatch(/12 Mo en tout/);
    }
    expect(mocked.call).not.toHaveBeenCalled();
  });
});

describe('scanPages : la signature exacte du vieux serveur, et rien d\'autre', () => {
  it('T-L3 : ok:true sans `pages` → ok:false « pas encore disponible », aucun résultat', async () => {
    mocked.call.mockResolvedValue({ data: { ok: true, data: resultat, model: 'm' } });
    const sortie = await GeminiScannerService.scanPages([f1, f2, f3]);
    expect(sortie.ok).toBe(false);
    expect(sortie.result).toBeUndefined();
    expect(sortie.error).toMatch(PAS_DISPONIBLE);
  });
  it('T-L4 : pages:1 pour 3 envoyées → idem', async () => {
    mocked.call.mockResolvedValue({ data: { ok: true, data: resultat, pages: 1 } });
    const sortie = await GeminiScannerService.scanPages([f1, f2, f3]);
    expect(sortie.ok).toBe(false);
    expect(sortie.result).toBeUndefined();
    expect(sortie.error).toMatch(PAS_DISPONIBLE);
  });
  it('T-L5 : l\'erreur exacte de validateInvoiceFile (le vieux serveur sans fichier) → « pas encore disponible »', async () => {
    mocked.call.mockResolvedValue({ data: { ok: false, error: MESSAGE_VIEUX_SERVEUR } });
    const sortie = await GeminiScannerService.scanPages([f1, f2]);
    expect(sortie.ok).toBe(false);
    expect(sortie.error).toMatch(PAS_DISPONIBLE);
  });
  it('T-L6 : budget, déjà en cours, sans résultat, quota, délai → leur message, jamais réécrit', async () => {
    for (const error of ['Plafond quotidien IA atteint. Complète le justificatif manuellement.', 'Ce justificatif est déjà en cours d’analyse. Patiente avant de le rouvrir.', 'Ce justificatif a déjà été analysé sans résultat exploitable. Complète-le manuellement.']) {
      mocked.call.mockResolvedValueOnce({ data: { ok: false, error } });
      const sortie = await GeminiScannerService.scanPages([f1, f2]);
      expect(sortie.error).toBe(error);
    }
    mocked.call.mockRejectedValueOnce({ code: 'functions/resource-exhausted' });
    expect((await GeminiScannerService.scanPages([f1, f2])).error).toBe('Quota IA atteint. Réessaie plus tard.');
    mocked.call.mockRejectedValueOnce({ code: 'functions/deadline-exceeded' });
    expect((await GeminiScannerService.scanPages([f1, f2])).error).toMatch(/n’a pas répondu à temps/);
  });
  it('T-L7 : pages:3 → le résultat et pagesLues:3', async () => {
    mocked.call.mockResolvedValue({ data: { ok: true, data: resultat, pages: 3, model: 'm' } });
    const sortie = await GeminiScannerService.scanPages([f1, f2, f3]);
    expect(sortie.ok).toBe(true);
    expect(sortie.pagesLues).toBe(3);
    expect(sortie.result?.vendor).toBe('Malzhaus Nord');
  });
});
