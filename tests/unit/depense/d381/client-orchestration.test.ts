// D381, voie c-decoupe : la lecture en morceaux (lectureMorceaux.ts) et son branchement dans `scanDocument`. Aucun appel réel : `run` est simulé.
// « On peut pas se permettre de perdre ou "gagner" de l'information » : un morceau non lu ne donne jamais une lecture partielle ; une pièce ordinaire
// garde EXACTEMENT la lecture d'aujourd'hui (un seul appel, le même).
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createHash } from 'node:crypto';
import { AiClient, type AiRequest, type AiResponse } from '../../../../src/services/aiClient';
import { lireEnMorceaux, MORCEAUX_PARALLELES } from '../../../../src/services/lectureMorceaux';
import { GeminiScannerService, lectureIncomplete } from '../../../../src/services/geminiScanner';
import type { Decoupe, Partie } from '../../../../src/services/decoupe';

const octets = (k: number) => Uint8Array.from([255, 216, 255, k, 1, 7, 255, 217]);
const base64 = (b: Uint8Array) => Buffer.from(b).toString('base64');
const parties = (n: number, forcees: number[] = []): Partie[] =>
  Array.from({ length: n }, (_, i) => ({ file: { data: base64(octets(i + 1)), mimeType: 'image/jpeg' }, morceau: { k: i + 1, n }, coupeForcee: forcees.includes(i + 1) }));
/** Une découpe : n morceaux, une bande de contrôle par coupe intérieure (octets 100 + k). */
const bandes = (n: number): Array<{ file: { data: string; mimeType: string }; jonction: { k: number; n: number } }> =>
  Array.from({ length: n - 1 }, (_, i) => ({ file: { data: base64(octets(100 + i + 1)), mimeType: 'image/jpeg' }, jonction: { k: i + 1, n } }));
const decoupe = (n: number): Decoupe => ({ parties: parties(n), jonctions: bandes(n) });
const lecture = (k: number) => ({ vendor: k === 1 ? 'Fictif SA' : '', items: [{ name: `Article ${k}`, amountTTC: k, kind: 'stock', quantity: 1, unit: 'Stk' }] });
const pause = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/** Un `run` simulé : lit le numéro k du morceau dans l'octet 4 du JPEG, mesure la concurrence, journalise les appels. */
function simule(options: { echecs?: Record<number, number>; delai?: (k: number) => number } = {}) {
  const appels: AiRequest[] = [], essais: Record<number, number> = {};
  let enCours = 0, maxEnCours = 0;
  const run = vi.fn(async (req: AiRequest): Promise<AiResponse> => {
    appels.push(req);
    if (req.task === 'assemblerLecture') return { ok: true, data: { items: [{ name: 'assemblé' }], morceaux: (req.context as any).parties.length }, model: 'assemblage' };
    if (req.jonction) {
      const kj = 1000 + req.jonction.k;
      essais[kj] = (essais[kj] ?? 0) + 1;
      enCours++; maxEnCours = Math.max(maxEnCours, enCours);
      await pause(options.delai?.(kj) ?? 2);
      enCours--;
      if (essais[kj] <= (options.echecs?.[kj] ?? 0)) return { ok: false, error: 'délai' };
      return { ok: true, data: { items: [{ name: `bande ${req.jonction.k}` }] } };
    }
    const k = req.morceau!.k;
    essais[k] = (essais[k] ?? 0) + 1;
    enCours++; maxEnCours = Math.max(maxEnCours, enCours);
    await pause(options.delai?.(k) ?? 2);
    enCours--;
    if (essais[k] <= (options.echecs?.[k] ?? 0)) return { ok: false, error: 'délai' };
    return { ok: true, data: lecture(k), model: 'flash-lite', elapsedMs: 5 };
  });
  return { run, appels, essais, maxEnCours: () => maxEnCours };
}

afterEach(() => vi.restoreAllMocks());

describe('lireEnMorceaux', () => {
  it('12 parties : 12 lectures avec leur rang, jamais plus de 10 en même temps, puis l’assemblage dans l’ordre', async () => {
    // Les lectures finissent dans le désordre : l'assemblage garde l'ordre du document.
    const s = simule({ delai: k => 30 - k * 2 });
    const r = await lireEnMorceaux(parties(12, [3, 7]), s.run);
    const lectures = s.appels.filter(a => a.task === 'scanInvoice');
    expect(lectures).toHaveLength(12);
    expect(lectures.map(a => a.morceau!.k).sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    for (const a of lectures) { expect(a.morceau!.n).toBe(12); expect(a.tier).toBe('fast'); expect(a.file).toBeInstanceOf(Blob); expect((a.file as Blob).type).toBe('image/jpeg'); }
    expect(MORCEAUX_PARALLELES).toBe(10);
    expect(s.maxEnCours()).toBeLessThanOrEqual(MORCEAUX_PARALLELES);
    expect(s.maxEnCours()).toBeGreaterThan(1);
    const dernier = s.appels[s.appels.length - 1];
    expect(dernier.task).toBe('assemblerLecture');
    const envoyees = (dernier.context as any).parties;
    expect(envoyees.map((p: any) => p.morceau)).toEqual(Array.from({ length: 12 }, (_, i) => ({ k: i + 1, n: 12 })));
    expect(envoyees.map((p: any) => p.items[0].name)).toEqual(Array.from({ length: 12 }, (_, i) => `Article ${i + 1}`));
    expect(envoyees.map((p: any) => p.coupeForcee)).toEqual(Array.from({ length: 12 }, (_, i) => i + 1 === 3 || i + 1 === 7));
    expect(r.ok).toBe(true);
    expect(r.data.morceaux).toBe(12);
    expect(typeof r.elapsedMs).toBe('number');
  });

  it('l’image envoyée est exactement celle du morceau (octets recopiés, rien d’autre)', async () => {
    const s = simule();
    await lireEnMorceaux(parties(3), s.run);
    const premiers = s.appels.filter(a => a.task === 'scanInvoice').sort((a, b) => a.morceau!.k - b.morceau!.k);
    for (const [i, a] of premiers.entries()) expect(Array.from(new Uint8Array(await (a.file as Blob).arrayBuffer()))).toEqual(Array.from(octets(i + 1)));
  });

  it('un morceau en échec est réessayé UNE fois, puis la lecture continue', async () => {
    const s = simule({ echecs: { 5: 1 } });
    const r = await lireEnMorceaux(parties(12), s.run);
    expect(s.essais[5]).toBe(2);
    expect(s.appels.filter(a => a.task === 'scanInvoice')).toHaveLength(13);
    expect(r.ok).toBe(true);
  });

  it('un morceau qui lève est aussi réessayé', async () => {
    let n = 0;
    const run = vi.fn(async (req: AiRequest): Promise<AiResponse> => {
      if (req.task === 'assemblerLecture') return { ok: true, data: { items: [] } };
      if (req.morceau!.k === 2 && n++ === 0) throw new Error('réseau');
      return { ok: true, data: lecture(req.morceau!.k) };
    });
    await expect(lireEnMorceaux(parties(3), run)).resolves.toMatchObject({ ok: true });
  });

  it('un double échec lève sans assembler : jamais une lecture partielle', async () => {
    const s = simule({ echecs: { 4: 2 } });
    await expect(lireEnMorceaux(parties(12), s.run)).rejects.toThrow('Lecture en morceaux incomplète : la partie 4 sur 12 n\'a pas été lue. Réessaie.');
    expect(s.appels.some(a => a.task === 'assemblerLecture')).toBe(false);
    expect(s.essais[4]).toBe(2);
  });

  it('une lecture vide (ok sans données) compte comme un échec', async () => {
    const run = vi.fn(async (req: AiRequest): Promise<AiResponse> => (req.task === 'assemblerLecture' ? { ok: true, data: {} } : { ok: true }));
    await expect(lireEnMorceaux(parties(2), run)).rejects.toThrow(/partie 1 sur 2/);
    expect(run.mock.calls.some(([r]) => r.task === 'assemblerLecture')).toBe(false);
  });

  it('un assemblage refusé par le serveur rend son erreur (ok:false), sans rien inventer', async () => {
    const run = vi.fn(async (req: AiRequest): Promise<AiResponse> => (req.task === 'assemblerLecture' ? { ok: false, error: 'Assemblage : le morceau 2 sur 2 manque.' } : { ok: true, data: lecture(req.morceau!.k) }));
    const r = await lireEnMorceaux(parties(2), run);
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/manque/);
    expect(r.data).toBeUndefined();
  });

  it('bandes de contrôle : dans la même file, 10 appels au plus à la fois, leurs lignes transmises à l’assemblage avec leur rang', async () => {
    const s = simule({ delai: k => 4 + (k % 7) });
    const d = decoupe(12);
    await lireEnMorceaux(d.parties, s.run, { jonctions: d.jonctions });
    const lectures = s.appels.filter(a => a.task === 'scanInvoice');
    expect(lectures).toHaveLength(12 + 11);
    const bandesLues = lectures.filter(a => a.jonction);
    expect(bandesLues.map(a => a.jonction)).toEqual(Array.from({ length: 11 }, (_, i) => ({ k: i + 1, n: 12 })));
    for (const a of bandesLues) { expect(a.morceau).toBeUndefined(); expect(a.tier).toBe('fast'); expect(a.file).toBeInstanceOf(Blob); }
    expect(s.maxEnCours()).toBeLessThanOrEqual(MORCEAUX_PARALLELES);
    expect(s.maxEnCours()).toBe(MORCEAUX_PARALLELES);
    const contexte = s.appels[s.appels.length - 1].context as any;
    expect(s.appels[s.appels.length - 1].task).toBe('assemblerLecture');
    expect(contexte.jonctions).toEqual(Array.from({ length: 11 }, (_, i) => ({ k: i + 1, items: [{ name: `bande ${i + 1}` }] })));
    expect(contexte.parties).toHaveLength(12);
  });

  it('une bande en échec (deux fois) est absente : l’assemblage part quand même, jamais bloqué', async () => {
    const s = simule({ echecs: { 1003: 2, 1005: 1 } });
    const d = decoupe(6);
    const r = await lireEnMorceaux(d.parties, s.run, { jonctions: d.jonctions });
    expect(r.ok).toBe(true);
    expect(s.essais[1003]).toBe(2);
    expect(s.essais[1005]).toBe(2); // échec puis réussite : présente
    expect((s.appels[s.appels.length - 1].context as any).jonctions.map((j: any) => j.k)).toEqual([1, 2, 4, 5]);
  });

  it('un saut de page est transmis tel quel, sans appel ; il se mêle aux bandes dans l’ordre des coupes', async () => {
    const s = simule();
    const d = decoupe(4);
    const jonctions = [d.jonctions[0], { k: 2, sautDePage: true as const }, d.jonctions[2]];
    await lireEnMorceaux(d.parties, s.run, { jonctions });
    expect(s.appels.filter(a => a.jonction)).toHaveLength(2);
    expect((s.appels[s.appels.length - 1].context as any).jonctions).toEqual([
      { k: 1, items: [{ name: 'bande 1' }] }, { k: 2, sautDePage: true }, { k: 3, items: [{ name: 'bande 3' }] },
    ]);
  });

  it('un morceau en échec avec des bandes : l’erreur est la même, aucun assemblage', async () => {
    const s = simule({ echecs: { 2: 2 } });
    const d = decoupe(5);
    await expect(lireEnMorceaux(d.parties, s.run, { jonctions: d.jonctions })).rejects.toThrow(/la partie 2 sur 5/);
    expect(s.appels.some(a => a.task === 'assemblerLecture')).toBe(false);
  });

  it('sans bande ni saut : `context.jonctions` est une liste vide', async () => {
    const s = simule();
    await lireEnMorceaux(parties(2), s.run);
    expect((s.appels[s.appels.length - 1].context as any).jonctions).toEqual([]);
  });

  it('progression et interruption de la feuille', async () => {
    const vus: number[] = [];
    await lireEnMorceaux(parties(4), simule().run, { onProgres: lus => vus.push(lus) });
    expect(vus).toEqual([1, 2, 3, 4]);
    const stop = new AbortController(); stop.abort();
    const s = simule();
    await expect(lireEnMorceaux(parties(4), s.run, { signal: stop.signal })).rejects.toThrow('Lecture interrompue.');
    expect(s.appels).toHaveLength(0);
  });
});

describe('scanDocument : le déclencheur « après »', () => {
  it('lectureIncomplete : point lecture-coupee, ou plus de 2 lignes imprimées non rendues', () => {
    expect(lectureIncomplete({ points: [{ code: 'lecture-coupee' }], items: [] })).toBe(true);
    expect(lectureIncomplete({ printedLineCount: 13, items: new Array(10).fill({}) })).toBe(true);
    expect(lectureIncomplete({ printedLineCount: 12, items: new Array(10).fill({}) })).toBe(false);
    expect(lectureIncomplete({ printedLineCount: null, items: [] })).toBe(false);
    expect(lectureIncomplete({ points: [{ code: 'somme-ecart' }], items: [{}] })).toBe(false);
    expect(lectureIncomplete(undefined)).toBe(false);
  });
});

describe('scanDocument : branchement', () => {
  const fichier = () => new File([octets(9)], 'ticket.jpg', { type: 'image/jpeg' });
  const preparer = () => {
    vi.spyOn(GeminiScannerService, 'fileToDataUrl').mockResolvedValue('data:image/jpeg;base64,AAAA');
    return vi.spyOn(AiClient, 'run');
  };

  it('pièce ordinaire : un seul appel, celui d’aujourd’hui, rien d’autre', async () => {
    const run = preparer().mockResolvedValue({ ok: true, data: { vendor: 'Coop', items: [{ name: 'Pain', amountTTC: 3 }], printedLineCount: 1 }, model: 'm', elapsedMs: 7, documentHash: 'hash', cached: false });
    const decouper = vi.spyOn(GeminiScannerService, 'decouper').mockResolvedValue(null);
    const f = fichier();
    const r = await GeminiScannerService.scanDocument(f);
    expect(run).toHaveBeenCalledTimes(1);
    expect(run.mock.calls[0][0]).toEqual({ task: 'scanInvoice', tier: 'fast', file: f });
    expect(run.mock.calls[0][0].file).toBe(f);
    expect(decouper).toHaveBeenCalledTimes(1);
    expect(decouper).toHaveBeenCalledWith(f, false);
    expect(r).toMatchObject({ ok: true, model: 'm', elapsedMs: 7, documentHash: 'hash', cached: false });
    expect(r.result?.vendor).toBe('Coop');
  });

  it('pièce ordinaire, 2 lignes imprimées non rendues seulement (la limite est « plus de 2 ») : pas de relecture', async () => {
    const run = preparer().mockResolvedValue({ ok: true, data: { items: [{ name: 'A', amountTTC: 1 }], printedLineCount: 3 } });
    const decouper = vi.spyOn(GeminiScannerService, 'decouper').mockResolvedValue(null);
    await GeminiScannerService.scanDocument(fichier());
    expect(run).toHaveBeenCalledTimes(1);
    expect(decouper).toHaveBeenCalledTimes(1);
  });

  it('une découpe qui échoue (image illisible, pdf.js absent) garde la lecture d’aujourd’hui', async () => {
    const run = preparer().mockResolvedValue({ ok: true, data: { items: [] } });
    const r = await GeminiScannerService.scanDocument(fichier());
    expect(r.ok).toBe(true);
    expect(run).toHaveBeenCalledTimes(1);
  });

  it('déclencheur « avant » : les morceaux sont lus et recollés, l’empreinte est celle du fichier d’origine', async () => {
    const run = preparer().mockImplementation(async req => (req.task === 'assemblerLecture'
      ? { ok: true, data: { vendor: 'Fictif SA', items: [{ name: 'Article 1', amountTTC: 1 }, { name: 'Article 2', amountTTC: 2 }], morceaux: 2 }, model: 'assemblage' }
      : req.jonction ? { ok: true, data: { items: [{ name: 'Article 1' }, { name: 'Article 2' }] } } : { ok: true, data: lecture(req.morceau!.k), model: 'flash-lite' }));
    vi.spyOn(GeminiScannerService, 'decouper').mockResolvedValue(decoupe(2));
    const f = fichier();
    const r = await GeminiScannerService.scanDocument(f);
    // 2 morceaux, la bande de contrôle de leur coupe, puis l'assemblage.
    expect(run.mock.calls.map(([q]) => q.task)).toEqual(['scanInvoice', 'scanInvoice', 'scanInvoice', 'assemblerLecture']);
    expect((run.mock.calls[3][0].context as any).jonctions).toEqual([{ k: 1, items: [{ name: 'Article 1' }, { name: 'Article 2' }] }]);
    expect(r.ok).toBe(true);
    expect(r.result?.items.map(i => i.name)).toEqual(['Article 1', 'Article 2']);
    expect(r.model).toBe('flash-lite');
    expect(r.documentHash).toBe(createHash('sha256').update(Buffer.from(await f.arrayBuffer())).digest('hex'));
    expect(r.proofDataUrl).toBe('data:image/jpeg;base64,AAAA');
  });

  it('déclencheur « avant » : un morceau non lu → une erreur claire, aucune lecture partielle', async () => {
    const run = preparer().mockImplementation(async req => (req.task === 'assemblerLecture' ? { ok: true, data: { items: [] } } : req.jonction ? { ok: true, data: { items: [] } } : req.morceau!.k === 2 ? { ok: false, error: 'délai' } : { ok: true, data: lecture(req.morceau!.k) }));
    vi.spyOn(GeminiScannerService, 'decouper').mockResolvedValue(decoupe(3));
    const r = await GeminiScannerService.scanDocument(fichier());
    expect(r.ok).toBe(false);
    expect(r.result).toBeUndefined();
    expect(r.error).toBe('Lecture en morceaux incomplète : la partie 2 sur 3 n\'a pas été lue. Réessaie.');
    expect(run.mock.calls.some(([q]) => q.task === 'assemblerLecture')).toBe(false);
  });

  it('déclencheur « après » : lecture coupée → relue en morceaux (découpe forcée), sans geste', async () => {
    const run = preparer().mockImplementation(async req => {
      if (req.task === 'assemblerLecture') return { ok: true, data: { items: [{ name: 'Article 1', amountTTC: 1 }, { name: 'Article 2', amountTTC: 2 }], morceaux: 2 } };
      if (req.jonction) return { ok: true, data: { items: [] } };
      if (req.morceau) return { ok: true, data: lecture(req.morceau.k), model: 'flash-lite' };
      return { ok: true, data: { items: [{ name: 'Article 1', amountTTC: 1 }], points: [{ code: 'lecture-coupee' }] }, model: 'flash-lite' };
    });
    const decouper = vi.spyOn(GeminiScannerService, 'decouper').mockImplementation(async (_f, force) => (force ? decoupe(2) : null));
    const r = await GeminiScannerService.scanDocument(fichier());
    expect(decouper.mock.calls.map(([, force]) => force)).toEqual([false, true]);
    // La bande de contrôle de la coupe 1/2 est lue aussi (même file), puis l'assemblage.
    expect(run.mock.calls.map(([q]) => q.task)).toEqual(['scanInvoice', 'scanInvoice', 'scanInvoice', 'scanInvoice', 'assemblerLecture']);
    expect(run.mock.calls.filter(([q]) => q.jonction).map(([q]) => q.jonction)).toEqual([{ k: 1, n: 2 }]);
    expect(r.result?.items).toHaveLength(2);
  });

  it('déclencheur « après » : lignes imprimées non rendues (plus de 2) → relue ; la découpe ne donne rien (null) → la première lecture reste', async () => {
    const run = preparer().mockResolvedValue({ ok: true, data: { items: [{ name: 'A', amountTTC: 1 }], printedLineCount: 9 } });
    const decouper = vi.spyOn(GeminiScannerService, 'decouper').mockResolvedValue(null);
    const r = await GeminiScannerService.scanDocument(fichier());
    expect(decouper.mock.calls.map(([, force]) => force)).toEqual([false, true]);
    expect(run).toHaveBeenCalledTimes(1);
    expect(r.ok).toBe(true);
    expect(r.result?.printedLineCount).toBe(9);
  });

  it('déclencheur « après » : la relecture en morceaux échoue → la première lecture reste (ses points disent ce qui manque)', async () => {
    const run = preparer().mockImplementation(async req => (req.morceau ? { ok: false, error: 'délai' } : { ok: true, data: { items: [{ name: 'A', amountTTC: 1 }], printedLineCount: 20 } }));
    vi.spyOn(GeminiScannerService, 'decouper').mockImplementation(async (_f, force) => (force ? decoupe(2) : null));
    const r = await GeminiScannerService.scanDocument(fichier());
    expect(r.ok).toBe(true);
    expect(r.result?.items).toHaveLength(1);
    expect(r.result?.printedLineCount).toBe(20);
    expect(run.mock.calls.some(([q]) => q.task === 'assemblerLecture')).toBe(false);
  });

  it('le refus de type ou de taille ne parle plus de « 4 pages »', async () => {
    const r = await GeminiScannerService.scanDocument(new File(['x'], 'a.txt', { type: 'text/plain' }));
    expect(r.ok).toBe(false);
    expect(r.error).toBe('Choisis une image JPG, PNG, WebP ou un PDF de 4 Mo maximum.');
  });
});
