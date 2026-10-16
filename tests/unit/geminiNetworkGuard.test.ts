import { afterEach, describe, expect, it, vi } from 'vitest';
import { geminiTransport } from '../../functions/src/brewerHarness';
import { GeminiRequestNotSentError, isGeminiRequestUncharged } from '../../functions/src/geminiErrors';
import http from 'node:http';
import https, { request as httpsNamedRequest } from 'node:https';
import { guardWebSocket, guardXMLHttpRequest, isGeminiModelHost } from '../setup.gemini-guard';

// The normal suite (`npm test`) must never reach Gemini: real calls only run in dedicated, explicitly launched tests.
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent';
const VERTEX_URL = 'https://europe-west1-aiplatform.googleapis.com/v1/projects/p/locations/l/publishers/google/models/m:generateContent';
const REFUSED = /Appel Gemini réel interdit pendant Vitest/u;
const GUARD = Symbol.for('laffinee.geminiNetworkGuard');

/** Checked before any real fetch call: without the guard, the test fails here instead of reaching the network. */
function expectGuardInstalled() {
  expect((globalThis.fetch as unknown as Record<symbol, unknown>)[GUARD]).toBe(true);
}

function stubNetwork() {
  const network = vi.fn(async () => new Response(JSON.stringify({ candidates: [] }), { status: 200 }));
  vi.stubGlobal('fetch', network);
  return network;
}

async function sendFailure(key: string, body: Record<string, unknown>): Promise<unknown> {
  return geminiTransport(key)('gemini-3.8-flash', body, new AbortController().signal).then(
    () => { throw new Error('La requête aurait dû être refusée avant envoi.'); },
    (error: unknown) => error,
  );
}

afterEach(() => vi.unstubAllGlobals());

describe('garde Gemini de la suite normale', () => {
  it('vide GEMINI_API_KEY dans les workers de test', () => {
    expect(process.env.GEMINI_API_KEY ?? '').toBe('');
  });

  it('retire aussi les clés Google génériques héritées du shell', () => {
    expect(process.env.GOOGLE_API_KEY).toBeUndefined();
    expect(process.env.GOOGLE_GENAI_API_KEY).toBeUndefined();
  });

  it('reconnaît les hôtes modèles globaux et régionaux, sans réseau', () => {
    for (const host of ['generativelanguage.googleapis.com', 'GENERATIVELANGUAGE.googleapis.com', 'aiplatform.googleapis.com',
      'europe-west1-aiplatform.googleapis.com', 'us-central1-aiplatform.googleapis.com', 'generativelanguage.googleapis.com.',
      'firebasevertexai.googleapis.com']) {
      expect(isGeminiModelHost(host), host).toBe(true);
    }
    for (const host of ['127.0.0.1', 'localhost', 'firestore.googleapis.com', 'googleapis.com',
      'xgenerativelanguage.googleapis.com', 'generativelanguage.googleapis.com.example.test']) {
      expect(isGeminiModelHost(host), host).toBe(false);
    }
  });

  it('refuse tout fetch vers Gemini ou Vertex, quelle que soit la forme de la requête', async () => {
    // Asserted before any call: a host the guard would miss fails here, not on the network.
    for (const url of [GEMINI_URL, VERTEX_URL]) expect(isGeminiModelHost(new URL(url).hostname), url).toBe(true);
    expectGuardInstalled();
    await expect(fetch(GEMINI_URL, { method: 'POST', body: '{}' })).rejects.toThrow(REFUSED);
    await expect(fetch(new URL(GEMINI_URL))).rejects.toThrow(REFUSED);
    await expect(fetch(new Request(GEMINI_URL, { method: 'POST', body: '{}' }))).rejects.toThrow(REFUSED);
    await expect(fetch(VERTEX_URL)).rejects.toThrow(REFUSED);
  });

  it('retrouve la garde après un stub de fixture', async () => {
    stubNetwork();
    vi.unstubAllGlobals();
    expectGuardInstalled();
    await expect(fetch(GEMINI_URL)).rejects.toThrow(REFUSED);
  });
});

describe('geminiTransport refuse avant envoi ce qui ne peut pas partir', () => {
  it.each(['', '   '])('sans clé (%j) : requête non envoyée et non facturée', async key => {
    const network = stubNetwork();
    const error = await sendFailure(key, { contents: [] });
    expect(error).toBeInstanceOf(GeminiRequestNotSentError);
    expect(isGeminiRequestUncharged(error)).toBe(true);
    expect(network).not.toHaveBeenCalled();
  });

  it('avec un schéma d’outil non convertible : requête non envoyée et non facturée', async () => {
    const network = stubNetwork();
    const error = await sendFailure('fixture-key-not-a-real-secret', { contents: [],
      tools: [{ functionDeclarations: [{ name: 'fixture_bad', description: 'Racine non OBJECT.', parameters: { type: 'STRING' } }] }] });
    expect(error).toBeInstanceOf(GeminiRequestNotSentError);
    expect((error as Error).message).toMatch(/non convertible/u);
    expect(isGeminiRequestUncharged(error)).toBe(true);
    expect(network).not.toHaveBeenCalled();
  });

  it('envoie toujours une requête valide au transport injecté', async () => {
    const network = stubNetwork();
    await geminiTransport('fixture-key-not-a-real-secret')('gemini-3.8-flash', { contents: [] }, new AbortController().signal);
    expect(network).toHaveBeenCalledTimes(1);
  });
});

describe('garde Gemini hors de fetch', () => {
  const marked = (value: unknown) => (value as Record<symbol, unknown> | undefined)?.[GUARD] === true;

  it('node:http et node:https refusent les hôtes modèles avant toute connexion', () => {
    // Asserted before any call: an unguarded module fails here, not on the network.
    for (const fn of [https.request, https.get, http.request, http.get, httpsNamedRequest]) expect(marked(fn)).toBe(true);
    expect(() => https.request(GEMINI_URL)).toThrow(REFUSED);
    expect(() => httpsNamedRequest(new URL(VERTEX_URL))).toThrow(REFUSED);
    expect(() => https.get({ hostname: 'europe-west1-aiplatform.googleapis.com', path: '/' })).toThrow(REFUSED);
    expect(() => https.request('https://127.0.0.1:9/', { hostname: 'generativelanguage.googleapis.com' })).toThrow(REFUSED);
    expect(() => http.request({ host: 'firebasevertexai.googleapis.com:80', path: '/' })).toThrow(REFUSED);
  });

  it('XMLHttpRequest refuse un hôte modèle à l’ouverture et laisse passer les autres', () => {
    class FakeXhr { opened: unknown[][] = []; open(...args: unknown[]) { this.opened.push(args); } }
    guardXMLHttpRequest(FakeXhr);
    const xhr = new FakeXhr();
    expect(() => xhr.open('POST', GEMINI_URL)).toThrow(REFUSED);
    xhr.open('GET', 'http://127.0.0.1:9/fixture');
    expect(xhr.opened).toEqual([['GET', 'http://127.0.0.1:9/fixture']]);
    if (typeof XMLHttpRequest !== 'undefined') expect(marked(XMLHttpRequest.prototype.open)).toBe(true);
  });

  it('WebSocket refuse un hôte modèle à la construction et laisse passer les autres', () => {
    class FakeSocket { constructor(readonly url: string) {} }
    const Guarded = guardWebSocket(FakeSocket)!;
    expect(() => new Guarded('wss://generativelanguage.googleapis.com/ws/live')).toThrow(REFUSED);
    expect(new Guarded('ws://127.0.0.1:9/fixture')).toBeInstanceOf(FakeSocket);
    if (typeof WebSocket !== 'undefined') expect(marked(WebSocket)).toBe(true);
  });
});
