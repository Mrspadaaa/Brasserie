import { onCall, HttpsError, CallableRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { logger } from 'firebase-functions';
import { AiTier, TIERS, modelChain } from './models.js';
import { TASKS, TaskId } from './prompts.js';

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
 * ⚠️ L'adresse réelle vit dans la configuration de la Function, pas dans le
 * code : le dépôt est public. À poser au déploiement —
 * `firebase functions:secrets:set AUTHORIZED_ACCOUNTS`, ou une variable
 * d'environnement. Le repli n'autorise personne de réel.
 */
const AUTHORIZED = (process.env.AUTHORIZED_ACCOUNTS || 'proprietaire@exemple.ch')
  .split(',')
  .map((a) => a.trim().toLowerCase())
  .filter(Boolean);

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

  const res = await fetch(`${GEMINI_ENDPOINT}/${model}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: 'user', parts }],
      ...(grounded ? { tools: [{ googleSearch: {} }] } : {}),
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: schema,
        temperature
      }
    })
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status} ${detail.slice(0, 300)}`);
  }

  const json = (await res.json()) as any;
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
