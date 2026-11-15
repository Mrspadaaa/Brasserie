// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AiClient, type AiRequest } from '../../../src/services/aiClient';
import { GeminiScannerService } from '../../../src/services/geminiScanner';

// h1 : le client dit « relecture: argon » (un mot) au serveur, jamais un nom de modèle ; une pièce relue l'est en entier (jamais en morceaux). `run` et `runFlux` sont simulés : Gemini n'est jamais appelé.
const lecture = { vendor: 'Fictif SA', items: [{ name: 'Article', amountTTC: 10, kind: 'stock', quantity: 1, unit: 'Stk' }], amountTTC: 10 };
const jpeg = () => new File([Uint8Array.from([255, 216, 255, 217])], 'piece.jpg', { type: 'image/jpeg' });
afterEach(() => vi.restoreAllMocks());

describe('Relecture plus fine : ce que le client envoie', () => {
  it('scanDocument avec l’option : la requête porte relecture "argon", rien qui ressemble à un modèle, et la pièce n’est pas découpée', async () => {
    const appels: AiRequest[] = [];
    vi.spyOn(AiClient, 'run').mockImplementation(async (req: AiRequest) => { appels.push(req); return { ok: true, data: lecture } as any; });
    const decouper = vi.spyOn(GeminiScannerService, 'decouper');
    const sortie = await GeminiScannerService.scanDocument(jpeg(), 'fast', { relecture: 'argon' });
    expect(sortie.ok).toBe(true);
    expect(appels).toHaveLength(1);
    expect(appels[0]).toMatchObject({ task: 'scanInvoice', relecture: 'argon' });
    expect(JSON.stringify({ ...appels[0], file: undefined })).not.toMatch(/gemini|hydrogen/i);
    expect(decouper).not.toHaveBeenCalled();
  });

  it('avec un signal (flux), la requête porte la même option', async () => {
    const appels: AiRequest[] = [];
    vi.spyOn(AiClient, 'runFlux').mockImplementation(async (req: AiRequest) => { appels.push(req); return { ok: true, data: lecture } as any; });
    await GeminiScannerService.scanDocument(jpeg(), 'fast', { relecture: 'argon', signal: new AbortController().signal });
    expect(appels[0].relecture).toBe('argon');
  });

  it('une lecture ordinaire ne porte aucune option de relecture', async () => {
    const appels: AiRequest[] = [];
    vi.spyOn(AiClient, 'run').mockImplementation(async (req: AiRequest) => { appels.push(req); return { ok: true, data: lecture } as any; });
    vi.spyOn(GeminiScannerService, 'decouper').mockResolvedValue(null);
    await GeminiScannerService.scanDocument(jpeg(), 'fast');
    expect('relecture' in appels[0]).toBe(false);
  });

  it('scanPages avec l’option : la requête des pages porte relecture "argon"', async () => {
    const appels: AiRequest[] = [];
    vi.spyOn(AiClient, 'run').mockImplementation(async (req: AiRequest) => { appels.push(req); return { ok: true, data: lecture, pages: 2 } as any; });
    await GeminiScannerService.scanPages([jpeg(), jpeg()], { relecture: 'argon' });
    expect(appels[0]).toMatchObject({ task: 'scanInvoice', relecture: 'argon' });
    expect(appels[0].files).toHaveLength(2);
  });
});
