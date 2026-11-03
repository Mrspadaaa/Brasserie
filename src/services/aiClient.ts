import { httpsCallable, HttpsCallableResult } from 'firebase/functions';
import { functions } from './firebase';
import { yeastLookupResultError } from '../../functions/src/yeastLookupResult';
import { AI_CLIENT_TIMEOUT_MS } from '../../functions/src/aiTaskDeadline';

/**
 * Client des deux niveaux d'IA.
 *
 * Tout passe par une Cloud Function : **aucune clé d'API ne transite plus par le
 * navigateur**. Elle vivait auparavant dans `localStorage` et partait dans chaque
 * requête, visible dans les outils de développement.
 *
 * Le niveau est un choix d'usage, pas un réglage technique :
 *   ⚡ Rapide — le geste courant, on veut la réponse tout de suite.
 *   🎯 Max    — le geste rare et sérieux, on accepte d'attendre.
 */

export type AiTier = 'fast' | 'max';

export type AiTaskId =
  | 'scanInvoice'
  | 'shelfInventory'
  | 'importRecipe'
  | 'generateRecipe'
  | 'diagnoseBatch'
  | 'tastingNotes'
  | 'monthlySummary'
  | 'detectAnomalies'
  | 'shoppingList'
  | 'labelText'
  | 'draftEmail'
  | 'naturalSearch'
  /** Relecture critique d'une recette complète, eau comprise. */
  | 'reviewRecipe'
  /** Caractéristiques publiées d'un ingrédient, cherchées avec l'ancrage Google. */
  | 'lookupIngredient'
  | 'lookupHopVariety'
  | 'readHopCoa'
  /** D280 : la désignation en français des noms de base d'une facture, texte seul (`src/services/nomsFr.ts`). */
  | 'traduireNoms'
  /** D380 : recolle les lectures des morceaux d'une longue pièce (aucune IA, aucun coût). */
  | 'assemblerLecture';

export const TIER_LABEL: Record<AiTier, string> = {
  fast: '⚡ Rapide',
  max: '🎯 Max'
};

export const TIER_HINT: Record<AiTier, string> = {
  fast: 'Réponse en quelques secondes',
  max: 'Plus long, plus fouillé'
};

export interface AiRequest {
  task: AiTaskId;
  tier?: AiTier;
  /** Données métier envoyées au modèle (écritures, stock, brassin…). */
  context?: unknown;
  /** Consigne libre de l'utilisateur. */
  instruction?: string;
  /** Pièce jointe : photo ou PDF. */
  file?: File | Blob;
  /** n2-pages : les pages d'un même justificatif (2 à 4 images), lues d'un seul appel ; jamais avec `file`. */
  files?: Array<File | Blob>;
  /** D380 : ce `file` est le morceau k sur n d'une longue pièce découpée par l'app ; seulement avec `file`. */
  morceau?: { k: number; n: number };
  /** D381 : ce `file` est la bande de contrôle de la coupe entre les morceaux k et k + 1 d'une pièce en n morceaux (lue à part, seulement comparée). */
  jonction?: { k: number; n: number };
}

export interface AiResponse<T = any> {
  ok: boolean;
  data?: T;
  /** Modèle réellement utilisé — affiché pour que le résultat reste traçable. */
  model?: string;
  tier?: AiTier;
  elapsedMs?: number;
  error?: string;
  cached?: boolean;
  documentHash?: string;
  /** n2-pages : le nombre de pages que le serveur dit avoir lues ; absent d'un serveur qui ne lit qu'un fichier. */
  pages?: number;
}

/** Convertit un fichier en base64 sans le préfixe `data:`. */
async function toBase64(file: File | Blob): Promise<{ data: string; mimeType: string }> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const [header, payload] = dataUrl.split(',');
  const detected = /data:([^;]+)/.exec(header)?.[1];
  const mimeType =
    file.type ||
    detected ||
    ((file as File).name?.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg');

  return { data: payload, mimeType };
}

/**
 * Le client attend plus longtemps que le serveur (`aiTaskDeadline.ts`) : sans cette option, Firebase abandonne à
 * 70 s pendant que la Function continue, et que Google facture.
 */
const callAiTask = httpsCallable<Record<string, unknown>, AiResponse>(functions, 'aiTask', { timeout: AI_CLIENT_TIMEOUT_MS });

/**
 * Lenteur D (PLAN.md § 5) : le morceau que le serveur envoie quand les deux premières lectures sont finies et que la troisième part.
 * `data` est la lecture brute, à passer par `normalizeResult` ; `jeton` identifie cet appel (le final le reprend dans `provisoireJeton`).
 */
export interface AiFluxEtape {
  etape: 'provisoire';
  jeton: string;
  data: any;
  model?: string;
  elapsedMs?: number;
  pages?: number;
}

/** Un morceau n'est transmis que s'il a la forme du contrat : une autre étape ou un morceau mal formé est ignoré, jamais deviné. */
const estEtapeProvisoire = (m: unknown): m is AiFluxEtape =>
  m !== null && typeof m === 'object' && (m as AiFluxEtape).etape === 'provisoire' &&
  typeof (m as AiFluxEtape).jeton === 'string' && (m as AiFluxEtape).jeton !== '' &&
  (m as AiFluxEtape).data !== null && typeof (m as AiFluxEtape).data === 'object';

const MESSAGE_FLUX_FERME = 'Le serveur IA a fermé la connexion sans réponse. Réessaie dans quelques instants ; la saisie manuelle reste disponible.';
const MESSAGE_LECTURE_INTERROMPUE = 'Lecture interrompue.';

/** Laisse passer quelques micro-tâches : une réponse déjà reçue a le temps de se poser avant qu'on dise « rien reçu ». */
async function laisserPasser(): Promise<void> {
  for (let i = 0; i < 8; i++) await Promise.resolve();
}

async function chargeDe(req: AiRequest): Promise<Record<string, unknown>> {
  const payload: Record<string, unknown> = {
    task: req.task,
    tier: req.task === 'scanInvoice' ? 'fast' : req.tier,
    context: req.task === 'scanInvoice' ? undefined : req.context,
    instruction: req.task === 'scanInvoice' ? undefined : req.instruction
  };

  if (req.files?.length) {
    payload.files = await Promise.all(req.files.map(toBase64));
  } else if (req.file) {
    payload.file = await toBase64(req.file);
  }
  if (req.morceau) payload.morceau = req.morceau;
  if (req.jonction) payload.jonction = req.jonction;
  return payload;
}

/** Ce que `run` et `runFlux` font de la réponse finale du serveur (un contrôle propre à une tâche, comme la levure). */
function reponseDe<T>(req: AiRequest, result: HttpsCallableResult<AiResponse> | { data?: AiResponse }): AiResponse<T> {
  const response = result.data ?? { ok: false, error: 'Réponse vide du serveur.' };
  const yeastLookup = req.task === 'lookupIngredient' && req.context !== null &&
    typeof req.context === 'object' && 'kind' in req.context && req.context.kind === 'levure';
  if (response.ok && yeastLookup) {
    const error = yeastLookupResultError(response.data);
    if (error) return { ...response, ok: false, data: undefined, error } as AiResponse<T>;
  }
  return response as AiResponse<T>;
}

export const AiClient = {
  /**
   * Exécute une tâche IA.
   *
   * Ne lève jamais : les échecs reviennent dans `ok: false` avec un message
   * lisible. Une app de comptabilité doit pouvoir basculer proprement en saisie
   * manuelle plutôt que planter — et ne JAMAIS présenter un résultat inventé.
   */
  async run<T = any>(req: AiRequest): Promise<AiResponse<T>> {
    try {
      const payload = await chargeDe(req);
      const result: HttpsCallableResult<AiResponse> = await callAiTask(payload);
      return reponseDe<T>(req, result);
    } catch (err: any) {
      return { ok: false, error: this.humanize(err) };
    }
  },

  /**
   * Lenteur D : comme `run`, mais en flux. `onEtape` reçoit le morceau provisoire dès qu'il arrive ; la promesse rend le final, tel que
   * `run` le rendrait. Un serveur sans flux (ancien `aiTask`) ne rend que le final : `onEtape` n'est alors jamais appelé.
   *
   * Ne lève jamais, comme `run`. Deux pièges de `stream()` (@firebase/functions 0.12.9, PLAN.md § 2 (a)) sont tenus ici :
   *  - il n'a aucun délai : le client pose le sien (`AI_CLIENT_TIMEOUT_MS`), combiné au `signal` de l'écran ;
   *  - une réponse qui n'est pas en flux (401, 429, 503 de Cloud Run) ferme le flux sans jamais résoudre `data` : un flux fermé sans
   *    résultat est une erreur, jamais une attente.
   * Un `signal` levé (la feuille se ferme) coupe l'attente ; le serveur finit sa lecture et la met en cache.
   */
  async runFlux<T = any>(req: AiRequest, onEtape: (etape: AiFluxEtape) => void, signal?: AbortSignal): Promise<AiResponse<T>> {
    if (typeof callAiTask.stream !== 'function') return this.run(req) as Promise<AiResponse<T>>;
    if (signal?.aborted) return { ok: false, error: MESSAGE_LECTURE_INTERROMPUE };

    const coupe = new AbortController();
    let cause: 'delai' | 'ecran' | null = null;
    const interrompre = (c: 'delai' | 'ecran') => { if (!cause) { cause = c; coupe.abort(); } };
    const minuteur = setTimeout(() => interrompre('delai'), AI_CLIENT_TIMEOUT_MS);
    const surEcran = () => interrompre('ecran');
    signal?.addEventListener('abort', surEcran, { once: true });
    // Rejetée dès que l'attente est coupée : chaque lecture du flux et de `data` s'y mesure, car le faux flux ou le réseau peut ne jamais répondre.
    const coupee = new Promise<never>((_, rejeter) => coupe.signal.addEventListener('abort', () => rejeter(new Error('coupée')), { once: true }));
    coupee.catch(() => {});

    try {
      const payload = await chargeDe(req);
      if (coupe.signal.aborted) throw new Error('coupée');
      const { stream, data } = await Promise.race([callAiTask.stream(payload, { signal: coupe.signal }), coupee]);
      // `data` peut être rejetée en même temps que le flux (message « error ») : sans ce `catch`, la seconde rejection est « non gérée ».
      const resultat = Promise.resolve(data);
      resultat.catch(() => {});

      const lecteur = stream[Symbol.asyncIterator]();
      try {
        for (;;) {
          const pas = await Promise.race([lecteur.next(), coupee]);
          if (pas.done) break;
          if (!estEtapeProvisoire(pas.value)) continue;
          // L'écran ne doit jamais faire échouer la lecture : le final compte plus que son confort.
          try { onEtape(pas.value); } catch { /* le final arrive quand même */ }
        }
      } finally {
        // Sans attendre : sur un flux coupé, `return()` peut ne jamais rendre la main.
        void Promise.resolve(lecteur.return?.()).catch(() => {});
      }

      // Le flux est fermé. Un résultat déjà reçu se pose en quelques micro-tâches ; au-delà, rien ne viendra (piège 2).
      const final = await Promise.race([resultat, laisserPasser().then(() => null), coupee]);
      if (final === null) return { ok: false, error: MESSAGE_FLUX_FERME };
      return reponseDe<T>(req, { data: final });
    } catch (err: any) {
      if (cause === 'delai') return { ok: false, error: this.humanize({ code: 'functions/deadline-exceeded' }) };
      if (cause === 'ecran') return { ok: false, error: MESSAGE_LECTURE_INTERROMPUE };
      return { ok: false, error: this.humanize(err) };
    } finally {
      clearTimeout(minuteur);
      signal?.removeEventListener('abort', surEcran);
    }
  },

  /** Traduit les erreurs Firebase en message compréhensible. */
  humanize(err: any): string {
    const code = typeof err?.code === 'string' ? err.code : '';
    if (code.includes('unauthenticated')) {
      return 'Session expirée. Reconnecte-toi pour utiliser l’IA.';
    }
    if (code.includes('permission-denied')) {
      return "Ce compte n'est pas autorisé à utiliser l'IA.";
    }
    if (code.includes('failed-precondition')) {
      return (
        err?.message ||
        "L'IA n'est pas configurée côté serveur. Les montants sont à saisir à la main."
      );
    }
    if (code.includes('deadline-exceeded')) {
      // The server ends its own task first (aiTaskDeadline.ts): this one is a stalled network or Function.
      return 'Le serveur IA n’a pas répondu à temps. L’appel a pu être compté dans le budget IA ; réessaie plus tard.';
    }
    if (code.includes('resource-exhausted')) {
      return 'Quota IA atteint. Réessaie plus tard.';
    }
    if (code.includes('unavailable') || code.includes('internal')) {
      return 'Service IA momentanément indisponible.';
    }
    // An HTTP error without a body reaches us as its bare code (« unknown », « not-found »…).
    const bare = code.replace(/^functions\//, '');
    if (bare && (!err?.message || err.message === bare)) {
      return `Le serveur IA a répondu sans détail exploitable (code «\u00a0${bare}\u00a0»). Réessaie dans quelques instants ; la saisie manuelle reste disponible.`;
    }
    return err?.message || "L'analyse a échoué.";
  }
};
