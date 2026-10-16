/**
 * Le modèle Gemini de la brasserie, et ses deux réglages.
 *
 * Un seul modèle pour toute l'application : `gemini-3.8-flash` (décision du
 * 12 octobre 2026). Aucun repli vers un autre modèle : si 3.8 échoue, une
 * nouvelle tentative part sur 3.8, puis l'utilisateur reçoit une erreur claire.
 *
 * ⚡ RAPIDE  — le geste courant : lire une facture, compter des bouteilles sur
 *              une photo, proposer une liste de courses. Réflexion basse, pour
 *              répondre avant que Gaëtan ait reposé son téléphone.
 * 🎯 MAX     — le geste rare et sérieux : diagnostiquer une fermentation
 *              bloquée, préparer une déclaration, chercher une anomalie dans
 *              les comptes. Réflexion haute : là on accepte d'attendre.
 *
 * Les anciens modèles (3.5 Flash-Lite, 3.1 Pro…) gardent leur prix dans
 * `geminiCosts.ts` pour relire les historiques ; ils ne sont plus jamais appelés.
 */

/** `gemini-3.8-flash` : sorti le 2 septembre 2026, 1 M de contexte, 64 k de sortie. */
export const GEMINI_MODEL = 'gemini-3.8-flash';
export type GeminiModel = typeof GEMINI_MODEL;

/** Une première tentative, puis une seule nouvelle tentative sur le même modèle. */
export const GEMINI_ATTEMPTS = 2;

export type AiTier = 'fast' | 'max';
export type GeminiThinkingLevel = 'low' | 'medium' | 'high';

export interface TierConfig {
  /** Toujours `GEMINI_MODEL` : un niveau règle le modèle, il ne le choisit pas. */
  primary: GeminiModel;
  /** Température : 0 pour tout ce qui extrait des chiffres. */
  temperature: number;
  thinkingLevel: GeminiThinkingLevel;
  label: string;
}

export const TIERS: Record<AiTier, TierConfig> = {
  fast: { primary: GEMINI_MODEL, temperature: 0, thinkingLevel: 'low', label: 'Rapide' },
  max: { primary: GEMINI_MODEL, temperature: 0.2, thinkingLevel: 'high', label: 'Max' }
};

/** Un niveau venu du client ou d'un réglage enregistré : toute autre valeur redevient Rapide. */
export function aiTier(value: unknown): AiTier {
  return value === 'max' ? 'max' : 'fast';
}

/** Ordre d'essai : le même modèle, au plus `GEMINI_ATTEMPTS` fois, quel que soit le niveau. */
export function modelChain(_tier?: AiTier): GeminiModel[] {
  return Array.from({ length: GEMINI_ATTEMPTS }, () => GEMINI_MODEL);
}

/** Dernier verrou avant l'envoi : aucune requête ne part vers un autre modèle. */
export function assertGeminiModel(model: unknown): asserts model is GeminiModel {
  if (model !== GEMINI_MODEL)
    throw new Error(`Modèle Gemini refusé : seul ${GEMINI_MODEL} est autorisé. Aucune requête n’est envoyée.`);
}
