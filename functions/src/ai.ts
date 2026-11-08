import { createHash, randomUUID } from 'node:crypto';
import { onCall, HttpsError, CallableRequest, CallableResponse } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { logger } from 'firebase-functions';
import { AiTier, GEMINI_LITE_MODEL, TIERS, aiTier, assertGeminiModel, geminiAttempts, type TierConfig } from './models.js';
import { TASKS, TaskId, ingredientLookupDefinition } from './prompts.js';
import { yeastLookupResultError } from './yeastLookupResult.js';
import { validateInvoiceFile, normalizeInvoiceScan, LITE_SCAN_MAX_OUTPUT, SCAN_MAX_OUTPUT, SCAN_MODEL, type InvoiceFile } from './invoiceScanCore.js';
import { ScanReadCutError, ligneJournalLecture, type CauseCoupure } from './invoiceVisionReview.js';
import { isoCurrency, lireCsv8 } from './invoiceScanVote.js';
import { INVOICE_SCAN_PROMPTS } from './invoiceScanPrompts.js';
import { runBudgetedInvoiceScan } from './invoiceScanBudget.js';
import { jonctionNote, morceauNote } from './invoiceMorceaux.js';
import { MORCEAUX_MAX, assemblerMorceaux, jonctionsRecues, morceauxRecus } from './invoiceAssemblage.js';
import { runWithMonthlyAiBudget } from './monthlyAiBudget.js';
import { BrewerBudgetError } from './brewerLimits.js';
import { GeminiApiError, parseGeminiError } from './geminiErrors.js';
import { GeminiUnusableOutputError, geminiAnswerText, unusableGeminiOutput } from './geminiResponse.js';
import { sanitizeRecipeImport } from './recipeImportResult.js';
import {
  AI_ATTEMPT_TIMEOUT_MS as ATTEMPT_TIMEOUT_MS, AI_OUT_OF_TIME_MESSAGE as OUT_OF_TIME, AI_TASK_DEADLINE_MS, AI_TASK_MIN_ATTEMPT_MS
} from './aiTaskDeadline.js';

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
 *   4. Le modèle se décide ici, jamais chez le client : `geminiAttempts`
 *      (`models.ts`) choisit, tâche par tâche, entre `gemini-3.8-flash` et
 *      `gemini-3.5-flash-lite`, les deux seuls modèles autorisés.
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
/** No provider name on screen (DESIGN.md). */
const UNAVAILABLE = 'L’IA n’a pas pu traiter la demande, même après une nouvelle tentative. Réessaie dans quelques instants ou complète manuellement.';

/** Aucun champ `model` : un modèle envoyé par le client est ignoré. */
interface AiTaskPayload {
  task: TaskId;
  /** Réglage (température, réflexion), pas un modèle ; une valeur inconnue redevient Rapide. */
  tier?: AiTier;
  /** Contexte métier sérialisé (écritures, stock, brassin…). */
  context?: unknown;
  /** Consigne libre de Gaëtan, ajoutée à la consigne système. */
  instruction?: string;
  /** Pièce jointe encodée en base64, sans le préfixe `data:`. */
  file?: { data: string; mimeType: string };
  /** n2-pages : les pages d'un même justificatif (2 à 4 images), lues d'un seul appel ; jamais avec `file`. */
  files?: Array<{ data: string; mimeType: string }>;
  /** D380 : ce fichier est le morceau k sur n d'une longue pièce découpée par l'app (bande ou page) ; seulement avec `file`. */
  morceau?: { k: number; n: number };
  /** D381 : ce fichier est la bande de contrôle à cheval sur la coupe entre les morceaux k et k + 1 (sur n) ; seulement avec `file`. */
  jonction?: { k: number; n: number };
}

/** D380 : un morceau valide (entiers, 1 ≤ k ≤ n ≤ MORCEAUX_MAX) ou rien ; tout autre valeur est refusée. */
export function morceauDeLecture(raw: unknown): { k: number; n: number } | undefined {
  if (raw === undefined || raw === null) return undefined;
  const { k, n } = raw as { k?: unknown; n?: unknown };
  if (!Number.isSafeInteger(k) || !Number.isSafeInteger(n) || (k as number) < 1 || (k as number) > (n as number) || (n as number) > MORCEAUX_MAX)
    throw new HttpsError('invalid-argument', 'Morceau de lecture invalide.');
  return { k: k as number, n: n as number };
}
/** D381 : une bande de jonction valide (1 ≤ k < n ≤ MORCEAUX_MAX) ou rien. */
export function jonctionDeLecture(raw: unknown): { k: number; n: number; jonction: true } | undefined {
  const m = morceauDeLecture(raw);
  if (m && m.k >= m.n) throw new HttpsError('invalid-argument', 'Morceau de lecture invalide.');
  return m ? { ...m, jonction: true } : undefined;
}

interface AiTaskResult {
  ok: boolean;
  /** n2-pages : le nombre de pages lues, seulement quand il y en a plusieurs ; le client exige qu'il soit celui des pages envoyées. */
  pages?: number;
  data?: unknown;
  model?: string;
  tier?: AiTier;
  elapsedMs?: number;
  error?: string;
  cached?: boolean;
  documentHash?: string;
}

/** n2-pages : au plus 4 pages (la règle des PDF), 4 Mo chacune (`validateInvoiceFile`), 16 000 000 caractères de base64 pour toutes (≈ 12 Mo). */
export const SCAN_MAX_PAGES = 4;
export const MAX_PAGES_B64 = 16_000_000;
/** La phrase du banc (`multiCaptureNote`, `scripts/banc-lecture-facture.ts`), mot pour mot : c'est la forme mesurée. */
export const MULTI_PAGE_NOTE = (count: number): string =>
  `Les ${count} images jointes sont des captures successives d’un même document, dans l’ordre de lecture ; elles peuvent se recouvrir. Chaque ligne imprimée ne se lit qu’une seule fois : si une ligne apparaît sur deux captures, ne la transcris qu’une fois.`;

/** Les pages d'une lecture à plusieurs fichiers : 2 à 4 images valides, dans l'ordre reçu, pas plus de `MAX_PAGES_B64` caractères en tout. */
export function pagesDeLecture(files: unknown): InvoiceFile[] {
  if (!Array.isArray(files) || files.length < 2 || files.length > SCAN_MAX_PAGES) throw new Error(`Sélectionne de 2 à ${SCAN_MAX_PAGES} pages.`);
  const pages = files.map(file => validateInvoiceFile(file));
  if (pages.some(page => !page.mimeType.startsWith('image/'))) throw new Error('Plusieurs pages : des images seulement (JPG, PNG, WebP). Un PDF se lit seul.');
  if (pages.reduce((total, page) => total + page.data.length, 0) > MAX_PAGES_B64) throw new Error('Les pages sont trop volumineuses (12 Mo au plus en tout).');
  return pages;
}

/**
 * La clé de cache et de budget d'une lecture à pages : un fichier de substitution fait de l'empreinte sha256 brute de chaque page, dans l'ordre.
 * Le même contenu dans un autre ordre est une autre lecture ; `invoiceScanId` et `invoiceDocumentHash` s'y appliquent sans autre changement,
 * et l'empreinte rendue au client (`sha256` de cette suite) est celle qu'il calcule lui-même.
 */
export function cleDePages(pages: InvoiceFile[]): InvoiceFile {
  const empreintes = pages.map(page => createHash('sha256').update(Buffer.from(page.data, 'base64')).digest());
  return { mimeType: 'application/x-pages', data: Buffer.concat(empreintes).toString('base64') };
}

/** Ce que la charge de la requête demande : rien, un fichier, ou des pages. `files` n'existe que pour `scanInvoice` et jamais avec `file`. */
export type ChargeDeLecture = { kind: 'aucune' } | { kind: 'fichier'; file: unknown } | { kind: 'pages'; files: unknown[] };
export function chargeDeLecture(data: { task?: unknown; file?: unknown; files?: unknown }, def: { acceptsFile?: boolean }): ChargeDeLecture {
  const { task, file, files } = data;
  const avecPages = files !== undefined && files !== null;
  if (avecPages && task !== 'scanInvoice') throw new HttpsError('invalid-argument', 'Plusieurs fichiers ne sont acceptés que pour la lecture d’un justificatif.');
  if (avecPages && file) throw new HttpsError('invalid-argument', 'Un fichier ou plusieurs pages, pas les deux.');
  if (avecPages && !Array.isArray(files)) throw new HttpsError('invalid-argument', 'Les pages doivent être une liste de fichiers.');
  if ((file || avecPages) && !def.acceptsFile) throw new HttpsError('invalid-argument', `La tâche ${String(task)} n'accepte pas de pièce jointe.`);
  if (avecPages) return { kind: 'pages', files: files as unknown[] };
  return file ? { kind: 'fichier', file } : { kind: 'aucune' };
}

/**
 * A separate, fixed-cost path: no model chain, no client tier/context/instruction.
 * Lecture C★v8 + N (D247) : deux Flash-Lite en parallèle (consignes 1 et 2, 8 192 jetons), la 3.8 (consigne 3, 8 192 jetons depuis le 02.11) sur désaccord
 * ou quand une Flash-Lite manque ; l'ordre des appels et le vote sont dans `invoiceScanVote.ts` (portage à l'identique du banc).
 */
/**
 * D308 (lenteur D) : le premier écran en flux. `jeton` est tiré par l'appel ; `onProvisoire` reçoit le provisoire (les deux Flash-Lite, sans la 3.8) et ce
 * qu'il faut pour le morceau (modèle, durée, pages) ; il ne doit jamais retarder la 3.8, et une levée de sa part ne change rien au final (sauf
 * qu'aucun jeton ni rang n'est posé : le morceau n'est pas parti). Absent (ancien client, appel sans SSE, test réel) : la lecture est celle d'avant.
 */
export interface FluxProvisoire {
  jeton: string;
  onProvisoire: (data: unknown, meta: { model: string; elapsedMs: number; pages?: number }) => unknown;
}

/** D381 : le schéma de lecture d'un morceau : chaque article dit s'il n'est que la suite d'un article de la partie précédente (`suite`, écrit d'abord). */
const SCHEMA_MORCEAU = (() => {
  const base: any = TASKS.scanInvoice.schema, item = base.properties.items.items;
  return { ...base, properties: { ...base.properties, items: { ...base.properties.items, items: { ...item, properties: { suite: { type: 'BOOLEAN' }, ...item.properties }, required: ['suite', ...item.required] } } } };
})();

export async function scanInvoiceSafely(uid: string, suppliedFile: unknown | unknown[], apiKey: string, evaluationOptions?: { maxOutputTokens: number }, flux?: FluxProvisoire, morceau?: { k: number; n: number; jonction?: true }): Promise<AiTaskResult> {
  const started = Date.now();
  // Un test réel peut ABAISSER le plafond de sortie de chaque appel ; il ne peut pas dépasser celui de la 3.8.
  const override = evaluationOptions?.maxOutputTokens;
  if (override !== undefined && (!Number.isSafeInteger(override) || override < 1 || override > SCAN_MAX_OUTPUT)) throw new Error('Plafond de sortie invalide.');
  // n2-pages : un fichier (ou une liste d'un seul) se lit comme toujours ; 2 à 4 images se lisent d'un seul appel, une part `inlineData` par page, dans l'ordre.
  const pages: InvoiceFile[] = !Array.isArray(suppliedFile) ? [validateInvoiceFile(suppliedFile)] : suppliedFile.length === 1 ? [validateInvoiceFile(suppliedFile[0])] : pagesDeLecture(suppliedFile);
  if (morceau && pages.length > 1) throw new Error('Un morceau est un seul fichier.');
  // D380 : un morceau a sa propre clé (le même fichier lu entier ou comme morceau k/n n'a pas la même consigne, donc pas le même résultat).
  // « t2 » (08.11) : les totaux se lisent sur chaque partie ; un morceau lu avant, sans total, n'est pas resservi.
  const cleMorceau = (file: InvoiceFile, m: { k: number; n: number; jonction?: true }): InvoiceFile =>
    ({ mimeType: 'application/x-morceau', data: Buffer.concat([createHash('sha256').update(Buffer.from(file.data, 'base64')).digest(), Buffer.from(`${m.jonction ? 'j' : 't2:'}${m.k}/${m.n}`)]).toString('base64') });
  const key: InvoiceFile = pages.length > 1 ? cleDePages(pages) : morceau ? cleMorceau(pages[0], morceau) : pages[0], model = SCAN_MODEL;
  const withNote = (prompt: string) => pages.length > 1 ? `${prompt}\n\n${MULTI_PAGE_NOTE(pages.length)}` : morceau ? `${prompt}\n\n${morceau.jonction ? jonctionNote() : morceauNote(morceau.k, morceau.n)}` : prompt;
  assertGeminiModel(model);
  assertGeminiModel(GEMINI_LITE_MODEL);
  const provider = async (body: Record<string, unknown>, signal: AbortSignal, callModel: string = model) => {
    assertGeminiModel(callModel);
    const response = await fetch(`${GEMINI_ENDPOINT}/${callModel}:generateContent`, {
      method:'POST', headers:{ 'Content-Type':'application/json', 'x-goog-api-key':apiKey }, body:JSON.stringify(body), signal
    });
    if (!response.ok) throw parseGeminiError(response.status, callModel, await response.json().catch(() => ({})));
    return response.json();
  };
  const parse = (response: any) => {
    const candidate = response?.candidates?.[0];
    if (candidate?.finishReason !== 'STOP') throw new ScanReadCutError(candidate?.finishReason ?? null);
    const raw = candidate.content?.parts?.filter((part: any) => part.thought !== true && typeof part.text === 'string').map((part: any) => part.text).join('');
    if (!raw || raw.length > 45000) throw new Error('Lecture non exploitable.');
    const decoded = JSON.parse(raw);
    if (!decoded || typeof decoded !== 'object' || Array.isArray(decoded) || !Array.isArray(decoded.items)) throw new Error('Lecture non exploitable.');
    // N : la devise en code ISO (« Fr. », « SFr. » → « CHF »), avant la normalisation et le vote ; toute autre devise reste telle quelle.
    decoded.currency = isoCurrency(decoded.currency);
    return decoded;
  };
  const body = (system: string, prompt: string, schema: Record<string, unknown>, maxOutputTokens: number) => ({
    systemInstruction:{ parts:[{ text:system }] },
    contents:[{ role:'user', parts:[{ text:withNote(prompt) }, ...pages.map(page => ({ inlineData:page }))] }],
    generationConfig:{ responseMimeType:'application/json', responseSchema:schema, temperature:0, maxOutputTokens,
      mediaResolution:'MEDIA_RESOLUTION_HIGH', thinkingConfig:{ thinkingLevel:'LOW' } }
  });
  // Vrai seulement si le morceau provisoire est parti pendant CET appel (jamais pour un résultat servi du cache ou resservi après une relecture ratée).
  let provisoireParti = false;
  const reviewed = await runBudgetedInvoiceScan(uid, key, async generate => {
    const deadline = AbortSignal.timeout(100_000);
    // LE4 : une ligne de journal par lecture (durée, jetons, finishReason, coupée ou non), écrite AVANT le parsing ; aucun contenu de facture.
    const cause = (reason: any): CauseCoupure | null => reason instanceof ScanReadCutError ? 'sortie' : reason?.name === 'AbortError' || reason?.name === 'TimeoutError' ? 'delai' : null;
    const read = (callModel: string, prompt: string, lecture: number, etape: 'parallele' | 'troisieme', maxOutputTokens: number) => {
      const started = Date.now();
      return generate(body(TASKS.scanInvoice.system, prompt, morceau ? SCHEMA_MORCEAU : TASKS.scanInvoice.schema, override ?? maxOutputTokens), AbortSignal.any([deadline, AbortSignal.timeout(45_000)]), callModel).then(
        response => { logger.info('Lecture de facture', { ...ligneJournalLecture({ lecture, etape, elapsedMs: Date.now() - started, response }), model: callModel }); return normalizeInvoiceScan(parse(response)); },
        error => { logger.warn('Lecture de facture en échec', { lecture, etape, model: callModel, elapsedMs: Date.now() - started, cause: cause(error) === 'delai' ? 'delai' : 'erreur', erreur: String(error?.message ?? error).slice(0, 120) }); throw error; });
    };
    // Both Flash-Lite see only the original. Every in-flight call is awaited before the budget ledger closes (lireCsv8).
    return lireCsv8({
      readLite: lecture => read(GEMINI_LITE_MODEL, INVOICE_SCAN_PROMPTS[lecture - 1], lecture, 'parallele', LITE_SCAN_MAX_OUTPUT),
      // No competing amounts or classifications are disclosed: a third independent reading.
      readStrong: () => read(model, INVOICE_SCAN_PROMPTS[2], 3, 'troisieme', SCAN_MAX_OUTPUT),
      causeOf: cause,
      deadlineReached: () => deadline.aborted,
      ...(flux ? { provisoire: (data: unknown) => {
        const envoye = flux.onProvisoire(data, { model, elapsedMs: Date.now() - started, ...(pages.length > 1 ? { pages: pages.length } : {}) });
        provisoireParti = true;       // une levée de `onProvisoire` passe par-dessus : le morceau n'est pas parti, ni jeton ni rang
        return envoye;
      } } : {})
    });
  }, provider, { degraded: (result: any) => result?.review?.status === 'unavailable' && Array.isArray(result?.points) && result.points.some((p: any) => p.code === 'lecture-coupee') });
  // Le jeton va sur une COPIE rendue au client : le résultat gardé par le registre (et son cache) reste sans jeton, et ne le rejoue jamais.
  const data = flux && provisoireParti && !reviewed.cached ? { ...(reviewed.result as object), provisoireJeton: flux.jeton } : reviewed.result;
  return { ok:true, data, model, tier:'fast', elapsedMs:Date.now() - started, cached:reviewed.cached, documentHash:reviewed.documentHash, ...(pages.length > 1 ? { pages:pages.length } : {}) };
}

/** Aussi lue par `hopReclasserIA` : une seule liste de comptes, une seule règle. */
export function assertAuthorized(request: CallableRequest): string {
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

/** Sortie minimale du niveau Max : la réflexion haute et la réponse se partagent ce plafond. */
const HIGH_REASONING_OUTPUT_TOKENS = 12000;

async function callGemini(
  model: string,
  apiKey: string,
  systemPrompt: string,
  userText: string,
  schema: Record<string, unknown>,
  settings: Pick<TierConfig, 'temperature' | 'thinkingLevel'>,
  file?: { data: string; mimeType: string },
  /**
   * Recherche Google ancrée. Gemini 3 l'accepte EN MÊME TEMPS que le schéma de
   * réponse — c'est ce qui permet de retrouver l'atténuation d'une SafAle US-05
   * sur la fiche Fermentis au lieu de la deviner.
   */
  grounded = false,
  maxOutputTokens = 4500,
  signal: AbortSignal = AbortSignal.timeout(ATTEMPT_TIMEOUT_MS),
  inspect: (response: any) => GeminiUnusableOutputError | undefined = unusableGeminiOutput
): Promise<unknown> {
  assertGeminiModel(model);
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
        temperature: settings.temperature,
        // High reasoning shares maxOutputTokens with the JSON answer: on 3.8, a one-page COA read
        // at Max spent 4486 of 4500 tokens and its answer was cut (real call of 13 October 2026).
        maxOutputTokens: settings.thinkingLevel === 'high' ? Math.max(maxOutputTokens, HIGH_REASONING_OUTPUT_TOKENS) : maxOutputTokens,
        thinkingConfig: { thinkingLevel: settings.thinkingLevel }
      }
    };
  // A cut or looping answer is billed, settled as unusable and never parsed (#100, geminiResponse.ts); aiTask retries only a Flash-Lite one, on 3.8.
  const json = await runWithMonthlyAiBudget(model, body, async normalized => {
    const res = await fetch(`${GEMINI_ENDPOINT}/${model}:generateContent`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify(normalized), signal
    });
    if (!res.ok) throw parseGeminiError(res.status, model, await res.json().catch(() => ({})));
    return res.json();
  }, { daily: true, inspect });
  const raw = geminiAnswerText(json);
  if (!raw) {
    const reason = json?.candidates?.[0]?.finishReason ?? 'réponse vide';
    throw new Error(`Aucun contenu renvoyé (${reason}).`);
  }

  return JSON.parse(raw.replace(/```json/g, '').replace(/```/g, '').trim());
}

/**
 * A Flash-Lite answer must also end normally: cut, looping or stopped otherwise, 3.8 takes it over (#91, décision 68).
 * Like any refused answer, it is billed and settled as unusable at the Flash-Lite rate.
 */
const liteUnusable = (response: any) => unusableGeminiOutput(response)
  ?? (response?.candidates?.[0]?.finishReason === 'STOP' ? undefined : new GeminiUnusableOutputError('truncated'));

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
  async (request: CallableRequest<AiTaskPayload>, response?: CallableResponse<unknown>): Promise<AiTaskResult> => {
    const email = assertAuthorized(request);
    const { task, tier: requestedTier, context, instruction, file, files, morceau, jonction } = request.data ?? {};

    // D380 : l'assemblage des morceaux d'une longue pièce ; aucune IA, aucun coût, aucune pièce jointe.
    if ((task as string) === 'assemblerLecture') {
      const started = Date.now();
      try { return { ok: true, data: assemblerMorceaux(morceauxRecus(context), jonctionsRecues(context)), model: 'assemblage', tier: 'fast', elapsedMs: Date.now() - started }; }
      catch (error: any) { return { ok: false, tier: 'fast', error: error?.message || 'Assemblage impossible.' }; }
    }

    const def =task === 'lookupIngredient' ? ingredientLookupDefinition((context as { kind?: unknown } | undefined)?.kind) : TASKS[task];
    if (!def) {
      throw new HttpsError('invalid-argument', `Tâche inconnue : ${task}`);
    }
    // n2-pages : `file` ou `files` (2 à 4 pages), jamais les deux ; `files` seulement pour la lecture d'un justificatif.
    const charge = chargeDeLecture({ task, file, files }, def);
    if (file && file.data.length > MAX_FILE_B64) {
      throw new HttpsError('invalid-argument', 'Fichier trop volumineux (8 Mo maximum).');
    }

    const tier = def.tier ?? aiTier(requestedTier ?? def.defaultTier);
    const cfg = TIERS[tier];
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
        // D308 : un client qui demande le flux (`Accept: text/event-stream`) reçoit le premier écran dès que les deux Flash-Lite ont lu ; les autres,
        // et l'ancien client, ne reçoivent que le final (`sendChunk` ne fait rien sans flux). `response.signal` n'arrête pas la lecture : elle finit et se met en cache.
        const jeton = randomUUID();
        const flux: FluxProvisoire | undefined = request.acceptsStreaming && response
          ? { jeton, onProvisoire: (data, meta) => response.sendChunk({ etape: 'provisoire', jeton, data, ...meta }).catch(() => false) }
          : undefined;
        const lu = morceauDeLecture(morceau), j = jonctionDeLecture(jonction);
        if (lu && j) throw new Error('Un morceau ou une jonction, pas les deux.');
        const m = lu ?? j;
        if (m && charge.kind === 'pages') throw new Error('Un morceau est un seul fichier.');
        return await scanInvoiceSafely(request.auth!.uid, charge.kind === 'pages' ? charge.files : file, apiKey, undefined, flux, m);
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

    const started = Date.now(), deadline = started + AI_TASK_DEADLINE_MS;
    const route = geminiAttempts(task, tier), failures: string[] = [];

    // The server picks each attempt (models.ts): 3.8, or Flash-Lite first where bench #91 measured it without loss.
    // A transient failure gets one new attempt on 3.8, never a third model, and only while the task deadline leaves
    // it time. The client waits longer (aiTaskDeadline.ts).
    for (const [index, { model, thinkingLevel }] of route.entries()) {
      const remaining = deadline - Date.now();
      if (failures.length && remaining < AI_TASK_MIN_ATTEMPT_MS) {
        logger.error('Tâche IA sans temps pour une nouvelle tentative', { task, tier, model, failures });
        return { ok: false, tier, elapsedMs: Date.now() - started, error: OUT_OF_TIME };
      }
      const lite = model === GEMINI_LITE_MODEL;
      try {
        // In Rapide, a fiche, the yeast one included, is capped at 4500 tokens: 12000 let a numeric loop run 69 s (#100).
        // Import and review carry their own cap (TaskDef.maxOutputTokens). Max keeps at least 12000, shared with its
        // high reasoning (callGemini): no screen asks a fiche in Max, and 4500 would cut its answer.
        let data = await callGemini(model, apiKey, def.system, userText, def.schema, { temperature: cfg.temperature, thinkingLevel }, file,
          def.grounded, def.maxOutputTokens ?? 4500, AbortSignal.timeout(Math.min(ATTEMPT_TIMEOUT_MS, remaining)),
          lite ? liteUnusable : unusableGeminiOutput);
        const elapsedMs = Date.now() - started;
        if (task === 'lookupIngredient' && (context as { kind?: unknown } | undefined)?.kind === 'levure') {
          const error = yeastLookupResultError(data);
          if (error) return { ok: false, error, model, tier, elapsedMs };
        }
        if (task === 'importRecipe') data = sanitizeRecipeImport(data);
        logger.info('Tâche IA exécutée', { task, tier, model, thinkingLevel, elapsedMs, email });
        return { ok: true, data, model, tier, elapsedMs };
      } catch (err: any) {
        const elapsedMs = Date.now() - started;
        if (err instanceof BrewerBudgetError) return { ok: false, tier, elapsedMs, error: err.message };
        // A Flash-Lite answer the brewer cannot use (cut, looping, refused schema) goes once to 3.8, without asking again.
        const liteRetry = lite && index < route.length - 1 &&
          (err instanceof GeminiUnusableOutputError || err instanceof GeminiApiError && err.kind === 'invalid-request');
        if (err instanceof GeminiApiError && !err.canTryAnotherModel && !liteRetry)
          return { ok: false, tier, elapsedMs, error: err.publicError().message };
        if (err instanceof GeminiUnusableOutputError && !liteRetry) {
          logger.warn('Réponse Gemini inutilisable, sans nouvelle tentative', { task, model, reason: err.reason, elapsedMs });
          return { ok: false, tier, elapsedMs, error: err.message };
        }
        if (err?.name === 'TimeoutError' || err?.name === 'AbortError') {
          logger.warn('Gemini hors délai, sans nouvelle tentative', { task, model, elapsedMs });
          return { ok: false, tier, elapsedMs, error: OUT_OF_TIME };
        }
        const message = err?.message ?? String(err);
        failures.push(message);
        logger.warn('Gemini en échec', { task, model, attempt: failures.length, message, ...(liteRetry ? { retryOn: route[index + 1].model } : {}) });
      }
    }

    logger.error('Tâche IA en échec après la nouvelle tentative', { task, tier, models: route.map(attempt => attempt.model), failures });
    return { ok: false, tier, elapsedMs: Date.now() - started, error: UNAVAILABLE };
  }
);
