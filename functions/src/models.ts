/**
 * Les modèles Gemini de la brasserie, choisis par le serveur, usage par usage.
 *
 * Deux modèles autorisés (correction humaine du 16 octobre 2026, décision 68 :
 * « si 3.5 est plus rapide sans perdre en qualité, go ») : `gemini-3.8-flash`
 * partout, et `gemini-3.5-flash-lite` seulement pour les usages où le banc réel
 * #91 l'a mesuré plus rapide sans perte (`LITE_ROUTES`). Le client ne choisit
 * jamais le modèle. Aucun repli vers un troisième modèle : une réponse lite
 * inutilisable ou une panne passe une fois sur 3.8, puis l'utilisateur reçoit
 * une erreur claire.
 *
 * ⚡ RAPIDE  — le geste courant : lire une facture, compter des bouteilles sur
 *              une photo, proposer une liste de courses. Réflexion basse, pour
 *              répondre avant que Gaëtan ait reposé son téléphone.
 * 🎯 MAX     — le geste rare et sérieux : diagnostiquer une fermentation
 *              bloquée, préparer une déclaration, chercher une anomalie dans
 *              les comptes. Réflexion haute : là on accepte d'attendre.
 *
 * Les anciens modèles (3.1 Flash-Lite, 3.1 Pro…) gardent leur prix dans
 * `geminiCosts.ts` pour relire les historiques ; ils ne sont plus jamais appelés.
 */

/** `gemini-3.8-flash` : sorti le 2 septembre 2026, 1 M de contexte, 64 k de sortie. */
export const GEMINI_MODEL = 'gemini-3.8-flash';
/** `gemini-3.5-flash-lite` : seulement pour les usages de `LITE_ROUTES`. */
export const GEMINI_LITE_MODEL = 'gemini-3.5-flash-lite';
/** Liste blanche du serveur : aucune requête ne part vers un autre modèle. */
export const GEMINI_MODELS = [GEMINI_MODEL, GEMINI_LITE_MODEL] as const;
export type GeminiModel = (typeof GEMINI_MODELS)[number];

/** Une première tentative, puis une seule nouvelle tentative, sur 3.8. */
export const GEMINI_ATTEMPTS = 2;

export type AiTier = 'fast' | 'max';
/** `minimal` ne sert qu'à 3.5 Flash-Lite, là où le banc #91 l'a mesuré. */
export type GeminiThinkingLevel = 'minimal' | 'low' | 'medium' | 'high';

export interface TierConfig {
  /** Toujours `GEMINI_MODEL` : un niveau règle le modèle, il ne le choisit pas. */
  primary: typeof GEMINI_MODEL;
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

/**
 * Usages servis d'abord par 3.5 Flash-Lite, à la réflexion mesurée par le banc #91
 * (13 octobre 2026, `AI07-B/resultat.md` §1, même corps que l'app, température 0) :
 * - `readHopCoa`, lecture d'un COA de houblon : `minimal`, 3/3, p95 2,3 s contre 6,5 s ;
 * - `diagnoseBatch`, diagnostic de brassin : `low`, 2/2, p95 1,6 s contre 4,6 s ;
 * - `lookup_brewing_reference`, recherche d'une référence par le compagnon :
 *   `minimal`, 2/2, p95 3,5 s contre 7,6 s.
 * En Rapide seulement : Max (température 0,2, réflexion haute) n'a pas été mesuré
 * ainsi. Tout le reste garde 3.8 tant qu'un banc ne prouve pas l'égalité : import et
 * relecture (lite y omettait des paliers ou un alpha), fiches documentaires,
 * justificatifs, analyse et relecture du compagnon, recherche de fournisseurs.
 */
export const LITE_ROUTES: Readonly<Record<string, GeminiThinkingLevel>> = Object.freeze({
  readHopCoa: 'minimal',
  diagnoseBatch: 'low',
  lookup_brewing_reference: 'minimal'
});

/** Une tentative : le modèle et sa réflexion. */
export interface GeminiAttempt {
  model: GeminiModel;
  thinkingLevel: GeminiThinkingLevel;
}

/**
 * Ordre d'essai d'un usage. Un usage de `LITE_ROUTES`, en Rapide : 3.5 Flash-Lite,
 * puis 3.8 à la réflexion du niveau, si la réponse lite est inutilisable ou si le
 * service flanche. Tout autre usage : 3.8, au plus `GEMINI_ATTEMPTS` fois.
 */
export function geminiAttempts(usage: string, tier: AiTier = 'fast'): GeminiAttempt[] {
  const main: GeminiAttempt = { model: GEMINI_MODEL, thinkingLevel: TIERS[tier].thinkingLevel };
  const lite = tier === 'fast' && Object.hasOwn(LITE_ROUTES, usage) ? LITE_ROUTES[usage] : undefined;
  return lite ? [{ model: GEMINI_LITE_MODEL, thinkingLevel: lite }, main] : Array.from({ length: GEMINI_ATTEMPTS }, () => main);
}

/** Ordre d'essai d'un usage resté sur 3.8 : le même modèle, au plus `GEMINI_ATTEMPTS` fois, quel que soit le niveau. */
export function modelChain(_tier?: AiTier): GeminiModel[] {
  return Array.from({ length: GEMINI_ATTEMPTS }, () => GEMINI_MODEL);
}

/** Dernier verrou avant l'envoi : aucune requête ne part vers un modèle hors de la liste blanche. */
export function assertGeminiModel(model: unknown): asserts model is GeminiModel {
  if (!(GEMINI_MODELS as readonly unknown[]).includes(model))
    throw new Error(`Modèle Gemini refusé : seuls ${GEMINI_MODELS.join(' et ')} sont autorisés. Aucune requête n’est envoyée.`);
}
