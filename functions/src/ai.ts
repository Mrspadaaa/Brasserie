import { onCall, HttpsError, CallableRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { logger } from 'firebase-functions';
import { AiTier, TIERS, modelChain } from './models.js';
import { TASKS, TaskId } from './prompts.js';
import { validateInvoiceFile, normalizeInvoiceScan, SCAN_MODEL, type InvoiceFile } from './invoiceScanCore.js';
import { reconcileInvoiceVision, type InvoiceScanResult } from './invoiceVisionReview.js';
import { runBudgetedInvoiceScan } from './invoiceScanBudget.js';
import { runWithMonthlyAiBudget } from './monthlyAiBudget.js';
import { BrewerBudgetError } from './brewerLimits.js';
import { GeminiApiError, parseGeminiError } from './geminiErrors.js';

/**
 * Passerelle IA.
 *
 * Pourquoi une fonction serveur plutôt qu'un appel direct depuis le navigateur :
 *
 *   1. La clé Gemini ne quitte jamais le serveur. Elle vivait auparavant dans
 *      `localStorage` et partait dans chaque requête depuis le navigateur —
 *      visible dans les outils de développement, et facturable par quiconque la
 *      récupérait.
 *   2. Les consignes restent versionnées côté serveur, hors de portée du client.
 *   3. `gemini-3.8-flash` n'est pas encore au catalogue de Firebase AI Logic
 *      (sorti le 2 septembre 2026). Un relais permet d'utiliser un modèle le
 *      jour de sa sortie.
 */

/** Clé Gemini — stockée dans Secret Manager, injectée à l'exécution. */
export const GEMINI_API_KEY = defineSecret('GEMINI_API_KEY');

/**
 * Comptes autorisés.
 *
 * Troisième copie de la liste, avec `firestore.rules` et le client. Les trois
 * doivent rester synchronisées à l'ajout d'un compte — celle-ci et celle des
 * règles sont les seules qui protègent réellement quelque chose.
 */
/*
 * ⚠️ L'adresse réelle vit dans `functions/.env` — jamais committé, chargé
 * automatiquement dans l'environnement de la Function par le CLI Firebase. Le
 * dépôt est public : elle n'a rien à faire dans le code.
 *
 * ⚠️ Ici, et CONTRAIREMENT au client, la liste vide ferme la porte. Le client
 * n'affiche qu'un message ; cette passerelle-ci dépense un quota Gemini payé.
 * Une passerelle ouverte par accident, c'est une facture pour des inconnus.
 * Le refus est donc explicite, et il dit quoi faire.
 */
const AUTHORIZED = (process.env.AUTHORIZED_ACCOUNTS || '')
  .split(',')
  .map((a) => a.trim().toLowerCase())
  .filter(Boolean);

if (AUTHORIZED.length === 0) {
  console.error(
    '[IA] AUTHORIZED_ACCOUNTS est vide : la passerelle refusera tout le monde. ' +
      'Renseigne-la dans functions/.env, puis redéploie les Functions.'
  );
}

const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';

interface AiTaskPayload {
  task: TaskId;
  tier?: AiTier;
  /** Contexte métier sérialisé (écritures, stock, brassin…). */
  context?: unknown;
  /** Consigne libre de Gaëtan, ajoutée à la consigne système. */
  instruction?: string;
  /** Pièce jointe encodée en base64, sans le préfixe `data:`. */
  file?: { data: string; mimeType: string };
}

interface AiTaskResult {
  ok: boolean;
  data?: unknown;
  model?: string;
  tier?: AiTier;
  elapsedMs?: number;
  error?: string;
  cached?: boolean;
  documentHash?: string;
}

/** A separate, fixed-cost path: no model chain, no client tier/context/instruction. */
export async function scanInvoiceSafely(uid: string, suppliedFile: unknown, apiKey: string, evaluationOptions?: { maxOutputTokens: number }): Promise<AiTaskResult> {
  const started = Date.now();
  const maxOutputTokens=evaluationOptions?.maxOutputTokens??4500;
  if(!Number.isSafeInteger(maxOutputTokens)||maxOutputTokens<1||maxOutputTokens>4500)throw new Error('Plafond de sortie invalide.');
  const file: InvoiceFile = validateInvoiceFile(suppliedFile), model = SCAN_MODEL;
  const provider = async (body: Record<string, unknown>, signal: AbortSignal) => {
    const response = await fetch(`${GEMINI_ENDPOINT}/${model}:generateContent`, {
      method:'POST', headers:{ 'Content-Type':'application/json', 'x-goog-api-key':apiKey }, body:JSON.stringify(body), signal
    });
    if (!response.ok) throw parseGeminiError(response.status, model, await response.json().catch(() => ({})));
    return response.json();
  };
  const parse = (response: any) => {
    const candidate = response?.candidates?.[0];
    if (candidate?.finishReason !== 'STOP') throw new Error('Lecture incomplète. Complète le justificatif manuellement.');
    const raw = candidate.content?.parts?.filter((part: any) => part.thought !== true && typeof part.text === 'string').map((part: any) => part.text).join('');
    if (!raw || raw.length > 45000) throw new Error('Lecture non exploitable.');
    const decoded = JSON.parse(raw);
    if (!decoded || typeof decoded !== 'object' || Array.isArray(decoded) || !Array.isArray(decoded.items)) throw new Error('Lecture non exploitable.');
    return decoded;
  };
  const body = (system: string, prompt: string, schema: Record<string, unknown>) => ({
    systemInstruction:{ parts:[{ text:system }] },
    contents:[{ role:'user', parts:[{ text:prompt }, { inlineData:file }] }],
    generationConfig:{ responseMimeType:'application/json', responseSchema:schema, temperature:0, maxOutputTokens,
      mediaResolution:'MEDIA_RESOLUTION_HIGH', thinkingConfig:{ thinkingLevel:'LOW' } }
  });
  const reviewed = await runBudgetedInvoiceScan(uid, file, async generate => {
    const deadline = AbortSignal.timeout(100_000);
    const read = (prompt: string) => generate(body(TASKS.scanInvoice.system, prompt, TASKS.scanInvoice.schema),
      AbortSignal.any([deadline, AbortSignal.timeout(45_000)])).then(parse).then(normalizeInvoiceScan);
    // Both see only the original. Await every in-flight call before closing the budget ledger.
    const attempts = await Promise.allSettled([
      read('Transcris tout le justificatif joint, en-tête, totaux et chaque ligne, dans l’ordre du document. Contrôle les chiffres et les signes des remises.'),
      read('Effectue une lecture indépendante complète du justificatif joint. Vérifie en priorité fournisseur, date, référence, devise, HT, TVA, TTC puis chaque article dans l’ordre imprimé. Distingue achat durable, réparation et consommable. Ne paraphrase pas les désignations.')
    ]);
    const readings = attempts.flatMap(attempt => attempt.status === 'fulfilled' ? [attempt.value] : []);
    if (!readings.length) throw (attempts[0] as PromiseRejectedResult).reason;
    if (readings.length === 1) {
      const finding = 'La double lecture n’a pas abouti. Vérifie les informations et les montants sur le justificatif.';
      return { ...readings[0], review:{ status:'unavailable', readers:1, correctedFields:[], findings:[finding] },
        issues:[...readings[0].issues, finding] };
    }
    let reconciled = reconcileInvoiceVision(readings);
    if (reconciled.needsCorrection && !deadline.aborted) {
      try {
        // No competing amounts or classifications are disclosed: a third independent vote.
        const correction: InvoiceScanResult = await read('Troisième contrôle attentif du document original : relis les petites lignes, séparateurs décimaux, signes, totaux, quantités, unités et la nature achat durable/réparation/consommable. Transcris de nouveau TOUS les champs et lignes dans leur ordre imprimé, avec les désignations exactes. Ne calcule aucune valeur absente.');
        reconciled = reconcileInvoiceVision([...readings, correction]);
      } catch {
        const finding = 'Le contrôle complémentaire n’a pas abouti. Les divergences restent à vérifier sur le justificatif.';
        reconciled.review.findings.push(finding);
      }
    }
    return { ...reconciled.result, review:reconciled.review,
      issues:[...new Set([...reconciled.result.issues, ...reconciled.review.findings])] };
  }, provider);
  return { ok:true, data:reviewed.result, model, tier:'fast', elapsedMs:Date.now() - started, cached:reviewed.cached, documentHash:reviewed.documentHash };
}

function assertAuthorized(request: CallableRequest): string {
  const email = request.auth?.token?.email?.toLowerCase().trim();
  if (!request.auth || !email) {
    throw new HttpsError('unauthenticated', 'Connexion requise.');
  }
  if (request.auth.token.email_verified !== true) {
    throw new HttpsError('permission-denied', 'Adresse e-mail non vérifiée.');
  }
  if (!AUTHORIZED.includes(email)) {
    logger.warn('Accès IA refusé', { email });
    throw new HttpsError('permission-denied', "Ce compte n'est pas autorisé.");
  }
  return email;
}

/** Limite de taille de pièce jointe : ~8 Mo une fois décodée. */
const MAX_FILE_B64 = 11_000_000;

async function callGemini(
  model: string,
  apiKey: string,
  systemPrompt: string,
  userText: string,
  schema: Record<string, unknown>,
  temperature: number,
  file?: { data: string; mimeType: string },
  /**
   * Recherche Google ancrée. Gemini 3 l'accepte EN MÊME TEMPS que le schéma de
   * réponse — c'est ce qui permet de retrouver l'atténuation d'une SafAle US-05
   * sur la fiche Fermentis au lieu de la deviner.
   */
  grounded = false
): Promise<unknown> {
  const parts: unknown[] = [{ text: userText }];
  if (file) {
    parts.push({ inlineData: { mimeType: file.mimeType, data: file.data } });
  }

  const body = {
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: 'user', parts }],
      ...(grounded ? { tools: [{ googleSearch: {} }] } : {}),
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: schema,
        temperature,
        maxOutputTokens: 4500
      }
    };
  const json = await runWithMonthlyAiBudget(model, body, async normalized => {
    const res = await fetch(`${GEMINI_ENDPOINT}/${model}:generateContent`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify(normalized), signal: AbortSignal.timeout(100_000)
    });
    if (!res.ok) throw parseGeminiError(res.status, model, await res.json().catch(() => ({})));
    return res.json();
  }, { daily: true });
  const raw = json?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!raw) {
    const reason = json?.candidates?.[0]?.finishReason ?? 'réponse vide';
    throw new Error(`Aucun contenu renvoyé (${reason}).`);
  }

  return JSON.parse(raw.replace(/```json/g, '').replace(/```/g, '').trim());
}

export const aiTask = onCall(
  {
    region: 'europe-west6',
    secrets: [GEMINI_API_KEY],
    // Les tâches multimodales chargent des images : il leur faut de la mémoire.
    memory: '512MiB',
    // Le niveau Max sur un gros contexte peut prendre du temps.
    timeoutSeconds: 300,
    cors: true,
    // Une seule personne utilise l'app : inutile de laisser Cloud Run monter en
    // charge, et ça borne la facture en cas de boucle accidentelle.
    maxInstances: 3
  },
  async (request: CallableRequest<AiTaskPayload>): Promise<AiTaskResult> => {
    const email = assertAuthorized(request);
    const { task, tier: requestedTier, context, instruction, file } = request.data ?? {};

    const def = TASKS[task];
    if (!def) {
      throw new HttpsError('invalid-argument', `Tâche inconnue : ${task}`);
    }
    if (file && !def.acceptsFile) {
      throw new HttpsError('invalid-argument', `La tâche ${task} n'accepte pas de pièce jointe.`);
    }
    if (file && file.data.length > MAX_FILE_B64) {
      throw new HttpsError('invalid-argument', 'Fichier trop volumineux (8 Mo maximum).');
    }

    const tier: AiTier = requestedTier ?? def.defaultTier;
    const cfg = TIERS[tier] ?? TIERS.fast;
    const apiKey = GEMINI_API_KEY.value();

    if (!apiKey) {
      // On échoue franchement : l'appelant doit basculer en saisie manuelle,
      // surtout pas recevoir une réponse fabriquée.
      throw new HttpsError(
        'failed-precondition',
        "Clé Gemini absente côté serveur. Configure-la avec : firebase functions:secrets:set GEMINI_API_KEY"
      );
    }

    if (task === 'scanInvoice') {
      try {
        return await scanInvoiceSafely(request.auth!.uid, file, apiKey);
      } catch (error: any) {
        return { ok:false, tier:'fast', error:error?.message || 'Lecture indisponible. Complète le justificatif manuellement.' };
      }
    }

    const userText = [
      instruction?.trim() ? `Demande : ${instruction.trim()}` : '',
      context !== undefined && context !== null
        ? `Données :\n${typeof context === 'string' ? context : JSON.stringify(context)}`
        : ''
    ]
      .filter(Boolean)
      .join('\n\n');

    if (!userText && !file) {
      throw new HttpsError('invalid-argument', 'Ni données ni pièce jointe à traiter.');
    }

    const started = Date.now();
    const attempts: string[] = [];

    for (const model of modelChain(tier)) {
      try {
        const data = await callGemini(
          model,
          apiKey,
          def.system,
          userText,
          def.schema,
          cfg.temperature,
          file,
          def.grounded
        );
        const elapsedMs = Date.now() - started;
        logger.info('Tâche IA exécutée', { task, tier, model, elapsedMs, email });
        return { ok: true, data, model, tier, elapsedMs };
      } catch (err: any) {
        if (err instanceof BrewerBudgetError) return { ok: false, tier, elapsedMs: Date.now() - started, error: err.message };
        if (err instanceof GeminiApiError && !err.canTryAnotherModel)
          return { ok: false, tier, elapsedMs: Date.now() - started, error: err.message };
        const message = err?.message ?? String(err);
        attempts.push(`${model} : ${message}`);
        logger.warn('Modèle en échec, repli', { task, model, message });
      }
    }

    logger.error('Tâche IA en échec sur toute la chaîne', { task, tier, attempts });
    return {
      ok: false,
      tier,
      elapsedMs: Date.now() - started,
      error: `Aucun modèle n'a pu traiter la demande. ${attempts.join(' | ')}`
    };
  }
);
