import { httpsCallable, HttpsCallableResult } from 'firebase/functions';
import { functions } from './firebase';

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
  | 'lookupIngredient';

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
}

export interface AiResponse<T = any> {
  ok: boolean;
  data?: T;
  /** Modèle réellement utilisé — affiché pour que le résultat reste traçable. */
  model?: string;
  tier?: AiTier;
  elapsedMs?: number;
  error?: string;
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

const callAiTask = httpsCallable<Record<string, unknown>, AiResponse>(functions, 'aiTask');

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
      const payload: Record<string, unknown> = {
        task: req.task,
        tier: req.tier,
        context: req.context,
        instruction: req.instruction
      };

      if (req.file) {
        payload.file = await toBase64(req.file);
      }

      const result: HttpsCallableResult<AiResponse> = await callAiTask(payload);
      return (result.data ?? { ok: false, error: 'Réponse vide du serveur.' }) as AiResponse<T>;
    } catch (err: any) {
      return { ok: false, error: this.humanize(err) };
    }
  },

  /** Traduit les erreurs Firebase en message compréhensible. */
  humanize(err: any): string {
    const code = err?.code ?? '';
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
      return "L'analyse a dépassé le temps imparti. Réessaie en niveau Rapide.";
    }
    if (code.includes('resource-exhausted')) {
      return 'Quota Gemini atteint. Réessaie plus tard.';
    }
    if (code.includes('unavailable') || code.includes('internal')) {
      return 'Service IA momentanément indisponible.';
    }
    return err?.message || "L'analyse a échoué.";
  }
};
