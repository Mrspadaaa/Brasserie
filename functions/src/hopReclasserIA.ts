import { onCall, CallableRequest } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import { GEMINI_API_KEY, assertAuthorized } from './ai.js';
import { GEMINI_LITE_MODEL, GEMINI_MODEL, assertGeminiModel } from './models.js';
import { runWithMonthlyAiBudget } from './monthlyAiBudget.js';
import { BrewerBudgetError } from './brewerLimits.js';
import { GeminiApiError, parseGeminiError } from './geminiErrors.js';
import { GeminiUnusableOutputError, geminiAnswerText, unusableGeminiOutput } from './geminiResponse.js';
import { PROMPT_VERSION, PROMPT_VERSION_SUGGERER, analyserReponse, analyserReponseSuggerer, construireInvite, construireInviteSuggerer, corpsRequete, corpsRequeteSuggerer, identifiant, lireEntree, lireEntreeSuggerer } from './hopReclassCore.js';

/**
 * Substituer : l'IA reclasse les 20 premiers du moteur (voie i2, accord D80 du 26.10 : Flash-Lite, environ 0,003 CHF par recherche).
 *
 * Le moteur reste la source de la liste et des scores ; ce callable ne rend qu'un ORDRE (les 10 premiers) et une phrase par
 * choix, ou une erreur. Jamais un ordre inventé : une réponse hors liste, en double, coupée ou incomplète est refusée.
 *
 * Choix de service :
 *  - 3.5 Flash-Lite seul, une seule tentative, sans repli sur 3.8 : à 7 s au p95, 3.8 sortirait de la fenêtre de 3 s de l'écran
 *    (mesure ia1 : Flash-Lite p95 2,2 s, 3.8 7,4 s). Le modèle est choisi ici, jamais par le client.
 *  - le compte, le budget mensuel et le plafond quotidien sont ceux des autres tâches (`assertAuthorized`, `runWithMonthlyAiBudget`).
 *  - App Check : aucun callable du dépôt ne l'exige (`enforceAppCheck` n'apparaît nulle part dans functions/src) ; celui-ci non plus,
 *    pour ne pas être le seul à échouer si la clé reCAPTCHA manque. À activer pour tous ensemble.
 */

const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';
/** Délai de l'appel au fournisseur : p95 mesuré 2,2 s, maximum 2,8 s ; au-delà de 8 s la réponse ne servirait plus à rien. */
export const DELAI_MS = 8000;
const INDISPONIBLE = 'L’IA n’a pas pu classer les remplaçants. L’ordre du moteur est gardé.';
const INVALIDE = 'La réponse de l’IA n’est pas exploitable. L’ordre du moteur est gardé.';

export interface ResultatReclassement {
  ok: boolean;
  /** Les clés des candidats, du meilleur au dixième, telles que le client les a envoyées. */
  ordre?: string[];
  /** Une phrase par clé de `ordre`. */
  phrases?: Record<string, string>;
  model?: string;
  elapsedMs?: number;
  promptVersion?: string;
  /** Mode « suggérer » : le nombre de phrases retirées parce qu'elles citaient une valeur chiffrée absente du message. */
  phrasesRetirees?: number;
  /** Parmi les retirées : celles qui nommaient un arôme absent des mots de la fiche (ia4). */
  phrasesHorsFiche?: number;
  /** Les phrases gardées qui commencent par « Réputation : » (ia4). */
  phrasesReputation?: number;
  error?: string;
  reason?: 'entree' | 'budget' | 'invalide' | 'indisponible';
}

/** Hors émulateur, l'adresse est toujours celle de Google. L'émulateur peut viser un fournisseur simulé local
 * (`HOP_RECLASS_ENDPOINT_EMULATEUR`) : c'est ainsi qu'on prouve le chemin sans clé et sans frais. */
function adresse(): { base: string; simule: boolean } {
  const o = process.env.HOP_RECLASS_ENDPOINT_EMULATEUR;
  if (o && process.env.FUNCTIONS_EMULATOR === 'true' && /^http:\/\/(127\.0\.0\.1|localhost):\d+(\/|$)/.test(o)) return { base: o.replace(/\/$/, ''), simule: true };
  return { base: ENDPOINT, simule: false };
}

/** Une réponse Flash-Lite doit finir normalement : coupée ou bouclée, elle est facturée et refusée. */
const inutilisable = (response: any) => unusableGeminiOutput(response)
  ?? (response?.candidates?.[0]?.finishReason === 'STOP' ? undefined : new GeminiUnusableOutputError('truncated'));

/** Délai du mode « suggérer » (voie ia5, D132) : Gemini 3.8 Flash en réflexion basse. Banc ia4 : médiane 4,7 s, maximum 5,6 s sur 30 cas.
 * 20 s couvrent trois fois ce maximum ; la fonction a 30 s (`timeoutSeconds`) et le client attend 25 s : le serveur coupe avant. Le brasseur a
 * touché la puce et attend : il ne subit pas une réponse perdue pour un pic de latence. */
export const DELAI_SUGGERER_MS = 20000;

/**
 * Mode « suggérer » (voie ia3) : même callable, mêmes gardes (compte, budget mensuel et quotidien réservé avant l'envoi, modèle choisi
 * ici, une tentative, jamais un ordre inventé), invite neuve `suggerer-v2`. Rend l'ordre de TOUS les candidats donnés (3 à 12 : les ex æquo du moteur) et une
 * phrase par clé quand elle ne cite aucune valeur chiffrée absente du message ni un arôme absent des mots de la fiche, sauf
 * si elle commence par « Réputation : » (`phrasesRetirees` en dit le nombre).
 */
async function suggerer(data: unknown, started: number, email: string): Promise<ResultatReclassement> {
  let entree;
  try { entree = lireEntreeSuggerer(data); } catch (e: any) {
    return { ok: false, reason: 'entree', error: `Demande de classement refusée : ${e?.message ?? 'entrée invalide'}.` };
  }
  const { base, simule } = adresse();
  const apiKey = GEMINI_API_KEY.value() || (simule ? 'cle-simulee' : '');
  if (!apiKey) return { ok: false, reason: 'indisponible', error: INDISPONIBLE };
  // Voie ia5 (D132) : 3.8 Flash, réflexion basse (`GENERATION_SUGGERER`), seulement pour ce mode ; Substituer garde Flash-Lite.
  const model = GEMINI_MODEL;
  assertGeminiModel(model);
  const ids = entree.candidats.map((_, i) => identifiant(i));
  const message = construireInviteSuggerer(entree);
  const body = corpsRequeteSuggerer(message);
  try {
    const json = await runWithMonthlyAiBudget(model, body, async (normalise) => {
      const res = await fetch(`${base}/${model}:generateContent`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey }, body: JSON.stringify(normalise), signal: AbortSignal.timeout(DELAI_SUGGERER_MS),
      });
      if (!res.ok) throw parseGeminiError(res.status, model, await res.json().catch(() => ({})));
      return res.json();
    }, { daily: true, inspect: inutilisable });
    const analyse = analyserReponseSuggerer(geminiAnswerText(json), ids, message);
    const elapsedMs = Date.now() - started;
    if (!analyse.valide) {
      logger.warn('Suggérer IA refusé', { erreurs: analyse.erreurs, elapsedMs });
      return { ok: false, reason: 'invalide', error: INVALIDE, model, elapsedMs, promptVersion: PROMPT_VERSION_SUGGERER };
    }
    const cle = (c: string) => entree.candidats[ids.indexOf(c)].id;
    const phrases: Record<string, string> = {};
    for (const c of analyse.ordre) if (analyse.phrases[c]) phrases[cle(c)] = analyse.phrases[c];
    logger.info('Suggérer IA rendu', { model, elapsedMs, email, candidats: ids.length, phrasesRetirees: analyse.retirees.length, phrasesHorsFiche: analyse.horsFiche.length, phrasesReputation: analyse.reputations.length });
    return { ok: true, ordre: analyse.ordre.map(cle), phrases, model, elapsedMs, promptVersion: PROMPT_VERSION_SUGGERER, phrasesRetirees: analyse.retirees.length, phrasesHorsFiche: analyse.horsFiche.length, phrasesReputation: analyse.reputations.length };
  } catch (err: any) {
    const elapsedMs = Date.now() - started;
    if (err instanceof BrewerBudgetError) return { ok: false, reason: 'budget', error: err.message, elapsedMs };
    if (err instanceof GeminiUnusableOutputError) return { ok: false, reason: 'invalide', error: INVALIDE, elapsedMs };
    if (err instanceof GeminiApiError) { logger.warn('Suggérer IA : Gemini en échec', { kind: err.kind, status: err.httpStatus, elapsedMs }); return { ok: false, reason: 'indisponible', error: err.publicError().message, elapsedMs }; }
    logger.warn('Suggérer IA en échec', { name: err?.name, message: err?.message, elapsedMs });
    return { ok: false, reason: 'indisponible', error: INDISPONIBLE, elapsedMs };
  }
}

export const hopReclasserIA = onCall(
  { region: 'europe-west6', secrets: [GEMINI_API_KEY], memory: '256MiB', timeoutSeconds: 30, cors: true, maxInstances: 3 },
  async (request: CallableRequest<unknown>): Promise<ResultatReclassement> => {
    const email = assertAuthorized(request);
    const started = Date.now();
    if ((request.data as { mode?: unknown } | null)?.mode === 'suggerer') return suggerer(request.data, started, email);
    let entree;
    try { entree = lireEntree(request.data); } catch (e: any) {
      return { ok: false, reason: 'entree', error: `Demande de classement refusée : ${e?.message ?? 'entrée invalide'}.` };
    }
    const { base, simule } = adresse();
    const apiKey = GEMINI_API_KEY.value() || (simule ? 'cle-simulee' : '');
    if (!apiKey) return { ok: false, reason: 'indisponible', error: INDISPONIBLE };

    const model = GEMINI_LITE_MODEL;
    assertGeminiModel(model);
    const ids = entree.candidats.map((_, i) => identifiant(i));
    const body = corpsRequete(construireInvite(entree.moment, entree.original,entree.candidats.map((c) => c.fiche)));
    try {
      const json = await runWithMonthlyAiBudget(model, body, async (normalise) => {
        const res = await fetch(`${base}/${model}:generateContent`, {
          method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey }, body: JSON.stringify(normalise), signal: AbortSignal.timeout(DELAI_MS),
        });
        if (!res.ok) throw parseGeminiError(res.status, model, await res.json().catch(() => ({})));
        return res.json();
      }, { daily: true, inspect: inutilisable });
      const analyse = analyserReponse(geminiAnswerText(json), ids);
      const elapsedMs = Date.now() - started;
      if (!analyse.valide) {
        logger.warn('Reclassement IA refusé', { erreurs: analyse.erreurs, elapsedMs });
        return { ok: false, reason: 'invalide', error: INVALIDE, model, elapsedMs };
      }
      const cle = (c: string) => entree.candidats[ids.indexOf(c)].id;
      const ordre = analyse.ordre.map(cle), phrases: Record<string, string> = {};
      for (const c of analyse.ordre) phrases[cle(c)] = analyse.phrases[c];
      logger.info('Reclassement IA rendu', { model, elapsedMs, email });
      return { ok: true, ordre, phrases, model, elapsedMs, promptVersion: PROMPT_VERSION };
    } catch (err: any) {
      const elapsedMs = Date.now() - started;
      if (err instanceof BrewerBudgetError) return { ok: false, reason: 'budget', error: err.message, elapsedMs };
      if (err instanceof GeminiUnusableOutputError) return { ok: false, reason: 'invalide', error: INVALIDE, elapsedMs };
      if (err instanceof GeminiApiError) { logger.warn('Reclassement IA : Gemini en échec', { kind: err.kind, status: err.httpStatus, elapsedMs }); return { ok: false, reason: 'indisponible', error: err.publicError().message, elapsedMs }; }
      logger.warn('Reclassement IA en échec', { name: err?.name, message: err?.message, elapsedMs });
      return { ok: false, reason: 'indisponible', error: INDISPONIBLE, elapsedMs };
    }
  }
);
