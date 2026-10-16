/**
 * Garde-fous du test spécial Gemini 3.8 réel (scripts/gemini-38-live.ts).
 *
 * Aucun effet de bord à l'import : le test unitaire les vérifie avec un
 * fournisseur simulé, le script les branche sur le vrai `fetch`.
 * La clé ne passe jamais par ces fonctions : seuls l'URL et le corps sont lus.
 *
 * Ordre : modèle résolu et compteur contrôlés avant l'opt-in payant
 * (`livePreflight`), puis chaque appel réservé dans le compteur, sous verrou,
 * avant son envoi (`reserveLiveCall`) : un arrêt brutal ou une session
 * concurrente ne peut pas dépasser les 10 appels.
 */
import { mkdirSync, readFileSync, rmdirSync, writeFileSync } from 'node:fs';
import { GEMINI_MODEL } from '../functions/src/models';
import { observedGeminiCostDetails, quoteGeminiCost } from '../functions/src/geminiCosts';

export const LIVE_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
export const LIVE_LAUNCH_CAP = 3;
export const LIVE_TOTAL_CAP = 10;
const COUNTER = /\*\*Compteur : (\d+) \/ (\d+)\*\*/;

export interface LiveCall {
  n: number;
  at: Date;
  latencyMs: number;
  status?: number;
  modelVersion?: string;
  inputTokens?: number;
  outputTokens?: number;
  costMicroChf?: number | null;
  /** Réflexion demandée dans le corps envoyé, telle que le routage de production l'a réglée. */
  thinkingLevel?: string;
  /** Fin de la réponse : `MAX_TOKENS` signale une réponse coupée malgré un HTTP 200. */
  finishReason?: string;
  error?: string;
}

export function readLiveCounter(journal: string): { used: number; total: number } {
  const match = COUNTER.exec(journal);
  if (!match) throw new Error('Compteur introuvable dans gemini-journal.md : aucun appel.');
  const used = Number(match[1]), total = Number(match[2]);
  if (!Number.isSafeInteger(used) || used < 0 || total !== LIVE_TOTAL_CAP)
    throw new Error('Compteur de gemini-journal.md illisible : aucun appel.');
  return { used, total };
}

/** Appels permis pour ce lancement : 3 au plus, dans le reste des 10. */
export function liveCallBudget(journal: string): number {
  const { used } = readLiveCounter(journal);
  return Math.max(0, Math.min(LIVE_LAUNCH_CAP, LIVE_TOTAL_CAP - used));
}

export function withLiveCounter(journal: string, used: number): string {
  readLiveCounter(journal);
  return journal.replace(COUNTER, `**Compteur : ${used} / ${LIVE_TOTAL_CAP}**`);
}

/**
 * Sans réseau ni coût, avant l'opt-in payant : chaque modèle résolu doit être 3.8,
 * puis le compteur doit laisser au moins un appel. Un refus n'appelle jamais `optIn`.
 */
export function livePreflight(resolvedModels: readonly string[], journal: string, optIn: () => void): { used: number; cap: number } {
  if (!resolvedModels.length || resolvedModels.some(model => model !== 'gemini-3.8-flash')
    || !LIVE_ENDPOINT.endsWith('/models/gemini-3.8-flash:generateContent'))
    throw new Error('Le modèle résolu n’est pas gemini-3.8-flash. Aucun appel.');
  const { used } = readLiveCounter(journal);
  const cap = liveCallBudget(journal);
  if (cap < 1) throw new Error(`Compteur global atteint (${used} / ${LIVE_TOTAL_CAP}). Aucun appel.`);
  optIn();
  return { used, cap };
}

const sleepSync = (ms: number) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

/** Verrou par création de dossier, comme `locks/` ; même dossier que le banc #91 pour le même journal. */
export function withJournalLock<T>(lockDir: string, action: () => T, { timeoutMs = 5000 } = {}): T {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    try {
      mkdirSync(lockDir);
      break;
    } catch (error) {
      if ((error as NodeJS.ErrnoException)?.code !== 'EEXIST') throw error;
      if (Date.now() >= deadline) throw new Error(`Verrou ${lockDir} occupé : requête refusée avant l’envoi.`);
      sleepSync(50);
    }
  }
  try {
    return action();
  } finally {
    rmdirSync(lockDir);
  }
}

/**
 * Réserve un appel avant son envoi : sous verrou, le compteur est relu, borné à 10,
 * puis incrémenté et réécrit. Renvoie le numéro de l'appel pour sa ligne du journal.
 */
export function reserveLiveCall(journalPath: string, lockDir: string, options?: { timeoutMs?: number }): number {
  return withJournalLock(lockDir, () => {
    const journal = readFileSync(journalPath, 'utf8');
    const next = readLiveCounter(journal).used + 1;
    if (next > LIVE_TOTAL_CAP)
      throw new Error(`Compteur global atteint (${LIVE_TOTAL_CAP} / ${LIVE_TOTAL_CAP}) : requête refusée avant l’envoi.`);
    writeFileSync(journalPath, withLiveCounter(journal, next));
    return next;
  }, options);
}

/** Ajoute la ligne d'un appel déjà réservé, sous le même verrou ; le compteur ne bouge plus. */
export function appendLiveRow(journalPath: string, lockDir: string, row: string): void {
  withJournalLock(lockDir, () => {
    const journal = readFileSync(journalPath, 'utf8');
    writeFileSync(journalPath, `${journal.replace(/\n*$/, '\n')}${row}\n`);
  });
}

const chf = (micro: number | null | undefined) => micro == null ? 'inconnu' : `${(micro / 1_000_000).toFixed(4)} CHF`;

export function liveJournalRow(call: LiveCall, issue: string, test: string, result: string): string {
  const time = call.at.toLocaleTimeString('fr-CH', { timeZone: 'Europe/Zurich', hour: '2-digit', minute: '2-digit' });
  const date = call.at.toLocaleDateString('fr-CH', { timeZone: 'Europe/Zurich', day: '2-digit', month: '2-digit' });
  const tokens = call.inputTokens == null ? 'inconnus' : `${call.inputTokens} / ${call.outputTokens}`;
  return `| ${call.n} | ${date} ${time} | ${issue} | ${test} | ${call.modelVersion ?? 'non fourni'} | ${tokens} | ${chf(call.costMicroChf)} | ${result.replace(/\|/g, '/')} |`;
}

/**
 * Enveloppe `fetch` : seul l'appel 3.8 part vers Google, dans la limite du lancement.
 * Le trafic local (émulateurs) passe ; tout autre hôte est refusé avant l'envoi.
 * `reserve` réserve l'appel dans le compteur global juste avant l'envoi et renvoie son
 * numéro ; s'il lève, rien ne part. `onCall` est appelé juste après chaque appel parti,
 * réussi ou non.
 */
export function guardLiveFetch(
  realFetch: typeof fetch,
  options: { cap: number; reserve: () => number; onCall: (call: LiveCall) => void; now?: () => number }
): { fetch: typeof fetch; calls: LiveCall[] } {
  const calls: LiveCall[] = [];
  const now = options.now ?? (() => performance.now());
  const guarded = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const host = new URL(url).hostname;
    if (host === '127.0.0.1' || host === 'localhost' || host === '::1') return realFetch(input, init);
    if (url !== LIVE_ENDPOINT) throw new Error(`Requête refusée avant l’envoi : seul ${GEMINI_MODEL} est autorisé.`);
    if (calls.length >= options.cap) throw new Error('Plafond d’appels Gemini réels atteint : requête refusée avant l’envoi.');
    const body = JSON.parse(String(init?.body ?? '{}'));
    const quote = quoteGeminiCost(GEMINI_MODEL, body);
    const thinkingLevel = body?.generationConfig?.thinkingConfig?.thinkingLevel;
    const call: LiveCall = { n: options.reserve(), at: new Date(), latencyMs: 0, ...(typeof thinkingLevel === 'string' ? { thinkingLevel } : {}) };
    calls.push(call);
    const started = now();
    try {
      const response = await realFetch(input, init);
      call.latencyMs = Math.round(now() - started);
      call.status = response.status;
      const json = await response.clone().json().catch(() => undefined);
      call.modelVersion = typeof json?.modelVersion === 'string' ? json.modelVersion : undefined;
      const finishReason = json?.candidates?.[0]?.finishReason;
      if (typeof finishReason === 'string') call.finishReason = finishReason;
      const usage = json?.usageMetadata;
      if (usage) {
        call.inputTokens = usage.promptTokenCount;
        call.outputTokens = (usage.candidatesTokenCount ?? 0) + (usage.thoughtsTokenCount ?? 0);
      }
      call.costMicroChf = response.ok ? observedGeminiCostDetails(quote, json)?.chargedMicroChf ?? null : null;
      return response;
    } catch (error) {
      call.latencyMs = Math.round(now() - started);
      call.error = error instanceof Error ? error.name : 'Erreur';
      throw error;
    } finally {
      options.onCall(call);
    }
  }) as typeof fetch;
  return { fetch: guarded, calls };
}
