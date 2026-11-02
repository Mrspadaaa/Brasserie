// @vitest-environment jsdom
/**
 * Voie c-client de la lenteur D (PLAN.md § 5 « C, client » et § 4 quater) : le client lit le flux d'`aiTask`.
 * Témoins : 1 le morceau provisoire puis le final · 1b un final seul n'appelle jamais `onProvisoire` · 1c le `signal` de l'écran coupe
 * · 2 un flux fermé sans résultat est une erreur · 3 le délai de 150 s · 4 aucun morceau = le final seul · 5 `ok:false` après un
 * provisoire · 6 `rangProvisoire` traverse `normalizeResult` · 7 la règle `pages === N` s'applique au final.
 * Le callable est simulé, avec un `.stream` qui rend une Promise de `{ stream, data }` (comme @firebase/functions 0.12.9). Aucun appel Gemini.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const mocked = vi.hoisted(() => ({ call: Object.assign(vi.fn(), { stream: vi.fn() }) }));
vi.mock('firebase/functions', () => ({ httpsCallable: () => mocked.call }));
vi.mock('../../../../src/services/firebase', () => ({ functions: {} }));
import { AiClient } from '../../../../src/services/aiClient';
import { GeminiScannerService, PLUSIEURS_PAGES_INDISPONIBLE, type ScanOutcome } from '../../../../src/services/geminiScanner';
import { AI_CLIENT_TIMEOUT_MS } from '../../../../functions/src/aiTaskDeadline';

const image = (nom: string) => new File([nom], nom, { type: 'image/jpeg' });
const [p1, p2] = [image('a.jpg'), image('b.jpg')];

// Une lecture fictive de la forme de celles des tests existants : aucune valeur de pièce réelle.
const ligne = (name: string, extra: Record<string, unknown> = {}) => ({ name, kind: 'stock', quantity: 2, unit: 'kg', price: 10, amountTTC: 20, ...extra });
const lecture = (items: unknown[], extra: Record<string, unknown> = {}) => ({ vendor: 'Malzhaus Fictif', date: '2026-09-09', currency: 'CHF', amountTTC: 20, items, review: { status: 'checked', findings: [], readers: 2 }, ...extra });
const PROVISOIRE = lecture([ligne('Malt Pilsner'), ligne('Houblon Cascade', { quantity: 1 })]);
const FINAL = lecture([ligne('Malt Pilsner', { rangProvisoire: 0, quantity: 3 }), ligne('Houblon Cascade', { rangProvisoire: 1 }), ligne('Levure US-05', { rangProvisoire: null })], {
  provisoireJeton: 'j1', review: { status: 'corrected', findings: [], readers: 3 }
});

type Porte = { promise: Promise<void>; ouvrir: () => void };
const porte = (): Porte => { let ouvrir!: () => void; const promise = new Promise<void>(r => { ouvrir = r; }); return { promise, ouvrir }; };
/** Seul le minuteur du client est faux : le FileReader de jsdom (setImmediate) doit continuer de tourner. */
const FAUX_TEMPS = { toFake: ['setTimeout', 'clearTimeout'] as Array<'setTimeout' | 'clearTimeout'> };
const jamais = () =>new Promise<never>(() => {});

interface Scenario {
  messages?: unknown[];
  /** Ce que rend `data` ; `undefined` = ne se résout jamais (flux fermé sans résultat). */
  resultat?: unknown;
  /** Si fourni, `data` attend cette porte : le test lit alors le morceau avant que le final n'existe. */
  attente?: Porte;
  /** Le flux ne rend rien et ne se ferme pas (3.8 qui ne vient pas, réseau mort). */
  suspendu?: boolean;
}
/** Installe un faux `.stream` ; rend les signaux reçus pour que le test voie qu'ils ont été levés. */
function installer(s: Scenario) {
  const signaux: AbortSignal[] = [];
  mocked.call.stream.mockImplementation(async (_charge: unknown, options?: { signal?: AbortSignal }) => {
    if (options?.signal) signaux.push(options.signal);
    async function* flux() {
      for (const m of s.messages ?? []) yield m;
      if (s.suspendu) await jamais();
      // Le vrai flux reste ouvert tant que le serveur n'a pas envoyé le résultat : il ne se ferme qu'après lui.
      if (s.attente) await s.attente.promise;
    }
    const data = s.resultat === undefined ? jamais() : (s.attente ? s.attente.promise.then(() => s.resultat) : Promise.resolve(s.resultat));
    return { stream: flux(), data };
  });
  return signaux;
}
const morceau = (extra: Record<string, unknown> = {}) => ({ etape: 'provisoire', jeton: 'j1', data: PROVISOIRE, model: 'flash-lite-fictif', elapsedMs: 6300, ...extra });
const final = (data: unknown, extra: Record<string, unknown> = {}) => ({ ok: true, data, model: 'modele-fictif', elapsedMs: 18500, documentHash: 'h1', ...extra });

beforeEach(() => { mocked.call.mockReset(); mocked.call.stream.mockReset(); });
afterEach(() => { vi.useRealTimers(); });

describe('1 — le morceau provisoire arrive avant le final', () => {
  it('onProvisoire reçoit un ScanOutcome provisoire qui porte le jeton, puis le final est rendu', async () => {
    const attente = porte();
    installer({ messages: [morceau()], resultat: final(FINAL), attente });
    const ordre: string[] = [];
    const recu: ScanOutcome[] = [];
    const lecturePromise = GeminiScannerService.scanDocument(p1, 'fast', { onProvisoire: o => { recu.push(o); ordre.push('provisoire'); } })
      .then(o => { ordre.push('final'); return o; });
    await vi.waitFor(() => expect(recu).toHaveLength(1));
    // Le final n'existe pas encore : le provisoire est bien arrivé seul.
    expect(ordre).toEqual(['provisoire']);
    expect(recu[0]).toMatchObject({ ok: true, jeton: 'j1', model: 'flash-lite-fictif', elapsedMs: 6300, fileName: 'a.jpg', mimeType: 'image/jpeg' });
    expect(recu[0].result!.items.map(i => i.name)).toEqual(['Malt Pilsner', 'Houblon Cascade']);
    // Le provisoire passe par normalizeResult : ids line-N, date au format suisse.
    expect(recu[0].result!.items.map(i => i.id)).toEqual(['line-1', 'line-2']);
    expect(recu[0].result!.date).toBe('09.09.2026');
    expect(recu[0].proofDataUrl).toMatch(/^data:image\/jpeg;base64,/);
    attente.ouvrir();
    const sortie = await lecturePromise;
    expect(ordre).toEqual(['provisoire', 'final']);
    expect(sortie).toMatchObject({ ok: true, model: 'modele-fictif', elapsedMs: 18500, documentHash: 'h1' });
    expect(sortie.result!.provisoireJeton).toBe('j1');
    expect(sortie.result!.items.map(i => i.rangProvisoire)).toEqual([0, 1, null]);
    expect(sortie.result!.items.map(i => i.id)).toEqual(['line-1', 'line-2', 'line-3']);
  });

  it('la charge envoyée est celle d\'aujourd\'hui (file, tier fast), et le flux est demandé avec un signal', async () => {
    const signaux = installer({ resultat: final(FINAL) });
    await GeminiScannerService.scanDocument(p1, 'fast', { onProvisoire: () => {} });
    const charge = mocked.call.stream.mock.calls[0][0];
    expect(charge).toMatchObject({ task: 'scanInvoice', tier: 'fast' });
    expect(charge.file).toMatchObject({ mimeType: 'image/jpeg' });
    expect(Buffer.from(charge.file.data, 'base64').toString()).toBe('a.jpg');
    expect(charge.files).toBeUndefined();
    expect(signaux).toHaveLength(1);
    expect(mocked.call).not.toHaveBeenCalled();
  });

  it('un onProvisoire qui lève ne change pas le final', async () => {
    installer({ messages: [morceau()], resultat: final(FINAL) });
    const sortie = await GeminiScannerService.scanDocument(p1, 'fast', { onProvisoire: () => { throw new Error('écran démonté'); } });
    expect(sortie).toMatchObject({ ok: true, documentHash: 'h1' });
    expect(sortie.result!.items).toHaveLength(3);
  });

  it('un morceau mal formé ou d\'une autre étape est ignoré, sans erreur', async () => {
    installer({ messages: [{ etape: 'autre', jeton: 'j', data: PROVISOIRE }, { etape: 'provisoire', data: PROVISOIRE }, { etape: 'provisoire', jeton: 'j9' }, 'texte', null], resultat: final(FINAL) });
    const onProvisoire = vi.fn();
    const sortie = await GeminiScannerService.scanDocument(p1, 'fast', { onProvisoire });
    expect(onProvisoire).not.toHaveBeenCalled();
    expect(sortie.ok).toBe(true);
  });
});

describe('1b (C5) — un final seul n\'appelle jamais onProvisoire', () => {
  it('rangProvisoire et provisoireJeton, sans morceau : le final est rendu tel quel', async () => {
    installer({ messages: [], resultat: final(FINAL) });
    const onProvisoire = vi.fn();
    const sortie = await GeminiScannerService.scanDocument(p1, 'fast', { onProvisoire });
    expect(onProvisoire).not.toHaveBeenCalled();
    expect(sortie.ok).toBe(true);
    expect(sortie.result!.provisoireJeton).toBe('j1');
    expect(sortie.result!.items.map(i => i.rangProvisoire)).toEqual([0, 1, null]);
  });
});

describe('1c — le signal de l\'écran coupe le flux', () => {
  it('un signal levé pendant l\'attente rend ok:false, sans exception, et lève le signal du flux', async () => {
    const signaux = installer({ messages: [morceau()], suspendu: true, resultat: undefined });
    const ecran = new AbortController();
    const onProvisoire = vi.fn();
    const attente = GeminiScannerService.scanDocument(p1, 'fast', { onProvisoire, signal: ecran.signal });
    await vi.waitFor(() => expect(onProvisoire).toHaveBeenCalledTimes(1));
    ecran.abort();
    const sortie = await attente;
    expect(sortie.ok).toBe(false);
    expect(sortie.error).toBeTruthy();
    expect(signaux[0].aborted).toBe(true);
  });

  it('un signal déjà levé avant l\'envoi ne lance aucun flux', async () => {
    installer({ resultat: final(FINAL) });
    const ecran = new AbortController();
    ecran.abort();
    const sortie = await GeminiScannerService.scanDocument(p1, 'fast', { signal: ecran.signal });
    expect(sortie.ok).toBe(false);
    expect(mocked.call.stream).not.toHaveBeenCalled();
  });
});

describe('2 — un flux fermé sans résultat rend ok:false', () => {
  it('le flux se ferme, `data` ne se résout jamais (401, 429, 503 sans corps SSE) : une erreur, pas une attente sans fin', async () => {
    installer({ messages: [], resultat: undefined });
    const sortie = await GeminiScannerService.scanDocument(p1, 'fast', { onProvisoire: () => {} });
    expect(sortie.ok).toBe(false);
    expect(sortie.error).toMatch(/sans réponse/);
    expect(sortie.result).toBeUndefined();
  });

  it('même après un provisoire : l\'écran garde ses valeurs et reçoit une erreur', async () => {
    installer({ messages: [morceau()], resultat: undefined });
    const onProvisoire = vi.fn();
    const sortie = await GeminiScannerService.scanDocument(p1, 'fast', { onProvisoire });
    expect(onProvisoire).toHaveBeenCalledTimes(1);
    expect(sortie.ok).toBe(false);
    expect(sortie.error).toMatch(/sans réponse/);
  });

  it('une erreur du flux (message « error » du serveur, réseau tombé) passe par humanize', async () => {
    mocked.call.stream.mockImplementation(async () => {
      const erreur = Object.assign(new Error('internal'), { code: 'functions/internal' });
      const data = Promise.reject(erreur);
      return { stream: { [Symbol.asyncIterator]() { return { next: () => Promise.reject(erreur) }; } }, data };
    });
    const sortie = await GeminiScannerService.scanDocument(p1, 'fast', { onProvisoire: () => {} });
    expect(sortie).toMatchObject({ ok: false, error: 'Service IA momentanément indisponible.' });
  });

  it('`stream()` lui-même qui échoue (jeton, réseau) rend ok:false', async () => {
    mocked.call.stream.mockRejectedValue(Object.assign(new Error('x'), { code: 'functions/unauthenticated' }));
    const sortie = await GeminiScannerService.scanDocument(p1, 'fast', { onProvisoire: () => {} });
    expect(sortie.ok).toBe(false);
    expect(sortie.error).toMatch(/Session expirée/);
  });
});

describe('3 — le délai du client', () => {
  it('abandonne à AI_CLIENT_TIMEOUT_MS (150 s) quand rien n\'arrive, et lève le signal du flux', async () => {
    vi.useFakeTimers(FAUX_TEMPS);
    const signaux = installer({ messages: [morceau()], suspendu: true, resultat: undefined });
    const onProvisoire = vi.fn();
    const attente = GeminiScannerService.scanDocument(p1, 'fast', { onProvisoire });
    // Le minuteur s'arme à l'entrée du flux : on attend le morceau (la lecture du fichier est réelle) avant de compter le temps.
    await vi.waitFor(() => expect(onProvisoire).toHaveBeenCalledTimes(1));
    await vi.advanceTimersByTimeAsync(AI_CLIENT_TIMEOUT_MS - 2_000);
    expect(signaux[0]?.aborted).toBe(false);
    let fini = false;
    void attente.then(() => { fini = true; });
    await vi.advanceTimersByTimeAsync(0);
    expect(fini).toBe(false);
    await vi.advanceTimersByTimeAsync(2_000);
    const sortie = await attente;
    expect(AI_CLIENT_TIMEOUT_MS).toBe(150_000);
    expect(sortie.ok).toBe(false);
    expect(sortie.error).toMatch(/n’a pas répondu à temps/);
    expect(signaux[0].aborted).toBe(true);
    expect(onProvisoire).toHaveBeenCalledTimes(1);
  });

  it('un final arrivé à temps n\'arme plus aucun minuteur', async () => {
    vi.useFakeTimers(FAUX_TEMPS);
    installer({ resultat: final(FINAL) });
    const sortie = await GeminiScannerService.scanDocument(p1, 'fast', { onProvisoire: () => {} });
    expect(sortie.ok).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe('4 — un serveur qui n\'envoie aucun morceau rend le final seul, comme A', () => {
  it('le final est le même que celui de `run` : mêmes champs, onProvisoire jamais appelé', async () => {
    const reponse = final(lecture([ligne('Malt Pilsner')]));
    mocked.call.mockResolvedValue({ data: reponse });
    const comme = await GeminiScannerService.scanDocument(p1);
    installer({ messages: [], resultat: reponse });
    const onProvisoire = vi.fn();
    const flux = await GeminiScannerService.scanDocument(p1, 'fast', { onProvisoire });
    expect(onProvisoire).not.toHaveBeenCalled();
    expect(flux).toEqual(comme);
  });

  it('sans option, scanDocument garde l\'appel d\'aujourd\'hui (callable simple), aucun flux', async () => {
    mocked.call.mockResolvedValue({ data: final(FINAL) });
    const sortie = await GeminiScannerService.scanDocument(p1);
    expect(sortie.ok).toBe(true);
    expect(mocked.call).toHaveBeenCalledTimes(1);
    expect(mocked.call.stream).not.toHaveBeenCalled();
  });

  it('un callable sans `.stream` (SDK ancien) retombe sur l\'appel simple', async () => {
    const stream = mocked.call.stream;
    // @ts-expect-error — on retire `.stream` le temps du test
    mocked.call.stream = undefined;
    try {
      mocked.call.mockResolvedValue({ data: final(FINAL) });
      const sortie = await AiClient.runFlux({ task: 'scanInvoice', tier: 'fast', file: p1 }, () => {});
      expect(sortie.ok).toBe(true);
      expect(mocked.call).toHaveBeenCalledTimes(1);
    } finally { mocked.call.stream = stream; }
  });
});

describe('5 — ok:false après un provisoire est rendu tel quel', () => {
  it('le serveur répond ok:false (IA en pause, budget) : le message du serveur, et le provisoire a bien été délivré', async () => {
    installer({ messages: [morceau()], resultat: { ok: false, error: 'IA mise en pause.' } });
    const onProvisoire = vi.fn();
    const sortie = await GeminiScannerService.scanDocument(p1, 'fast', { onProvisoire });
    expect(onProvisoire).toHaveBeenCalledTimes(1);
    expect(sortie.ok).toBe(false);
    expect(sortie.error).toBe('IA mise en pause.');
    expect(sortie.result).toBeUndefined();
  });

  it('une réponse sans `data` mais ok:true est une lecture indisponible, pas une lecture vide', async () => {
    installer({ resultat: { ok: true } });
    const sortie = await GeminiScannerService.scanDocument(p1, 'fast', { onProvisoire: () => {} });
    expect(sortie.ok).toBe(false);
    expect(sortie.error).toMatch(/Lecture indisponible/);
  });
});

describe('6 — rangProvisoire et provisoireJeton traversent normalizeResult', () => {
  it('un rang entier, null (ligne ajoutée par la 3.8) et le jeton sont gardés', () => {
    const r = GeminiScannerService.normalizeResult(FINAL);
    expect(r.items.map(i => i.rangProvisoire)).toEqual([0, 1, null]);
    expect(r.provisoireJeton).toBe('j1');
  });
  it('un rang absent ou invalide n\'est jamais fabriqué : la clé n\'existe pas, et null reste null', () => {
    const r = GeminiScannerService.normalizeResult({ items: [ligne('A'), ligne('B', { rangProvisoire: -1 }), ligne('C', { rangProvisoire: 'x' }), ligne('D', { rangProvisoire: 1.5 }), ligne('E', { rangProvisoire: null }), ligne('F', { rangProvisoire: 7 })], provisoireJeton: 12 });
    expect(r.items.map(i => 'rangProvisoire' in i)).toEqual([false, false, false, false, true, true]);
    expect(r.items.map(i => i.rangProvisoire)).toEqual([undefined, undefined, undefined, undefined, null, 7]);
    expect('provisoireJeton' in r).toBe(false);
  });
  it('un ancien résultat sort sans aucune des deux clés', () => {
    const r = GeminiScannerService.normalizeResult(lecture([ligne('A')]));
    expect('provisoireJeton' in r).toBe(false);
    expect('rangProvisoire' in r.items[0]).toBe(false);
  });
});

describe('7 — plusieurs pages : la règle pages === N s\'applique au final', () => {
  it('le final porte pages === N : lecture admise, pagesLues posé ; la charge est `files`', async () => {
    installer({ messages: [morceau({ pages: 2 })], resultat: final(FINAL, { pages: 2 }) });
    const recu: ScanOutcome[] = [];
    const sortie = await GeminiScannerService.scanPages([p1, p2], { onProvisoire: o => recu.push(o) });
    expect(sortie).toMatchObject({ ok: true, pagesLues: 2, fileName: '2 pages' });
    expect(recu).toHaveLength(1);
    expect(recu[0]).toMatchObject({ ok: true, jeton: 'j1', pagesLues: 2, fileName: '2 pages' });
    const charge = mocked.call.stream.mock.calls[0][0];
    expect(charge.files).toHaveLength(2);
    expect(charge.file).toBeUndefined();
  });

  it('un final sans pages (ou pages différent de N) reste « pas encore disponible », même après un morceau', async () => {
    installer({ messages: [morceau()], resultat: final(FINAL) });
    const sortie = await GeminiScannerService.scanPages([p1, p2], { onProvisoire: () => {} });
    expect(sortie).toMatchObject({ ok: false, error: PLUSIEURS_PAGES_INDISPONIBLE });
    installer({ resultat: final(FINAL, { pages: 1 }) });
    expect((await GeminiScannerService.scanPages([p1, p2], { onProvisoire: () => {} })).error).toBe(PLUSIEURS_PAGES_INDISPONIBLE);
  });

  it('un morceau qui dit un autre nombre de pages ne pose pas pagesLues', async () => {
    installer({ messages: [morceau({ pages: 1 })], resultat: final(FINAL, { pages: 2 }) });
    const recu: ScanOutcome[] = [];
    await GeminiScannerService.scanPages([p1, p2], { onProvisoire: o => recu.push(o) });
    expect(recu[0].pagesLues).toBeUndefined();
  });

  it('sans option, scanPages garde l\'appel d\'aujourd\'hui', async () => {
    mocked.call.mockResolvedValue({ data: final(FINAL, { pages: 2 }) });
    expect((await GeminiScannerService.scanPages([p1, p2])).ok).toBe(true);
    expect(mocked.call.stream).not.toHaveBeenCalled();
  });
});
