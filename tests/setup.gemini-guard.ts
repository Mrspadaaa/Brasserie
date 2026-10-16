/**
 * Garde Gemini de la suite normale (`npm test`).
 *
 * Aucun test courant ne doit pouvoir atteindre Gemini : le fournisseur y est
 * toujours simulé par fixture. Les appels réels vivent dans des tests spéciaux,
 * hors de cette sélection, lancés explicitement et journalisés.
 *
 * - Les clés héritées du shell (GEMINI_API_KEY, GOOGLE_API_KEY,
 *   GOOGLE_GENAI_API_KEY) sont retirées des workers (`vitest.config.ts` vide
 *   aussi GEMINI_API_KEY dans `test.env`).
 * - Toute requête vers un hôte Gemini, Vertex AI ou Firebase Vertex AI est
 *   refusée avant le réseau, par chacun des chemins disponibles dans un worker :
 *   `fetch`, `node:http`/`node:https` (`request`, `get`), `XMLHttpRequest`
 *   (environnement jsdom) et `WebSocket`. Aucun SDK Gemini n'est installé
 *   (`package.json`, `functions/package.json`) ; un SDK passerait de toute façon
 *   par l'un de ces chemins.
 * - Un `vi.stubGlobal('fetch', …)` de fixture reste possible ;
 *   `vi.unstubAllGlobals()` rend cette garde, pas le `fetch` réel.
 */
import http from 'node:http';
import https from 'node:https';
import { syncBuiltinESMExports } from 'node:module';

const GUARD = Symbol.for('laffinee.geminiNetworkGuard');
// Global and regional endpoints, e.g. generativelanguage.googleapis.com, europe-west1-aiplatform.googleapis.com.
const MODEL_HOSTS = /(^|[.-])(generativelanguage|aiplatform|firebasevertexai)\.googleapis\.com$/iu;

/** True for a Gemini or Vertex AI model host; checked before any request leaves a test worker. */
export function isGeminiModelHost(host: string): boolean {
  return MODEL_HOSTS.test(host.replace(/\.$/u, ''));
}

delete process.env.GEMINI_API_KEY;
delete process.env.GOOGLE_API_KEY;
delete process.env.GOOGLE_GENAI_API_KEY;

/** Host of a string, URL (any realm), Request, or Node request options; undefined when unreadable. */
function hostOf(target: unknown, base?: string): string | undefined {
  try {
    if (typeof target === 'string') return new URL(target, base).hostname;
    if (target && typeof target === 'object') {
      const row = target as { href?: unknown; url?: unknown; hostname?: unknown; host?: unknown };
      if (typeof row.href === 'string') return new URL(row.href).hostname;
      if (typeof row.url === 'string') return new URL(row.url, base).hostname;
      if (typeof row.hostname === 'string') return row.hostname;
      if (typeof row.host === 'string') return row.host.replace(/:\d+$/u, '');
    }
  } catch {
    // An unreadable target is left to the real API, which rejects it on its own.
  }
  return undefined;
}

function refuse(host: string | undefined): void {
  if (host && isGeminiModelHost(host)) throw new Error(`Appel Gemini réel interdit pendant Vitest : ${host}`);
}

const isGuarded = (value: unknown) => (value as Record<symbol, unknown> | undefined)?.[GUARD] === true;
const mark = <T extends object>(value: T): T => Object.defineProperty(value, GUARD, { value: true });
const baseUrl = () => (globalThis as { location?: { href?: string } }).location?.href;

const unguardedFetch = globalThis.fetch;
if (!isGuarded(unguardedFetch)) {
  globalThis.fetch = mark(async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    refuse(hostOf(input));
    if (typeof unguardedFetch !== 'function') throw new TypeError('fetch indisponible dans cet environnement de test.');
    return unguardedFetch(input, init);
  }) as typeof fetch;
}

// `get` does not go through the exported `request`, so both are wrapped; the ESM named exports are then resynced.
for (const module of [http, https] as Array<Record<'request' | 'get', (...args: unknown[]) => unknown>>) {
  for (const method of ['request', 'get'] as const) {
    const original = module[method];
    if (isGuarded(original)) continue;
    module[method] = mark(function guardedNodeRequest(this: unknown, ...args: unknown[]) {
      refuse(hostOf(args[0]));
      if (args[1] && typeof args[1] === 'object') refuse(hostOf(args[1]));
      return original.apply(this, args);
    });
  }
}
syncBuiltinESMExports();

/** Wraps `open` so a model host is refused before the request exists (jsdom provides XMLHttpRequest). */
export function guardXMLHttpRequest(ctor: { prototype: { open: (...args: any[]) => unknown } } | undefined): void {
  if (!ctor || isGuarded(ctor.prototype.open)) return;
  const original = ctor.prototype.open;
  ctor.prototype.open = mark(function guardedOpen(this: unknown, method: unknown, url: unknown, ...rest: unknown[]) {
    refuse(hostOf(url, baseUrl()));
    return original.call(this, method, url, ...rest);
  });
}
guardXMLHttpRequest((globalThis as { XMLHttpRequest?: { prototype: { open: (...args: any[]) => unknown } } }).XMLHttpRequest);

/** Constructor proxy refusing a model host before the socket opens; static members stay those of the original. */
export function guardWebSocket<T extends new (...args: any[]) => object>(ctor: T | undefined): T | undefined {
  if (!ctor || isGuarded(ctor)) return ctor;
  return new Proxy(ctor, {
    construct(target, args, newTarget) {
      refuse(hostOf(args[0], baseUrl()));
      return Reflect.construct(target, args, newTarget);
    },
    get(target, property, receiver) {
      return property === GUARD ? true : Reflect.get(target, property, receiver);
    },
  });
}
const socket = (globalThis as { WebSocket?: new (...args: any[]) => object }).WebSocket;
if (socket) (globalThis as { WebSocket?: unknown }).WebSocket = guardWebSocket(socket);
