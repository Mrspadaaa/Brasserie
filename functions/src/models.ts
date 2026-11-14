/**
 * Les modèles Gemini de la brasserie, choisis par le serveur, usage par usage.
 *
 * Trois modèles autorisés (correction humaine du 16 octobre 2026, décision 68 :
 * « si 3.5 est plus rapide sans perdre en qualité, go ») : `gemini-3.8-flash`
 * partout, `gemini-3.5-flash-lite` seulement pour les usages où le banc réel
 * #91 l'a mesuré plus rapide sans perte (`LITE_ROUTES`), et, depuis le 14
 * novembre, `gemini-4-hydrogen` pour la seule 3ᵉ lecture des justificatifs
 * (`INVOICE_STRONG_MODEL`) et, depuis la voie h3, pour l'analyse du compagnon
 * hors mode Approfondi (`brewerAnalysisAttempts`). Le client ne choisit jamais le modèle. Le repli
 * reste sur 3.8 : une réponse lite ou Hydrogen inutilisable, ou une panne,
 * passe une fois sur 3.8, puis l'utilisateur reçoit une erreur claire.
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
/**
 * `gemini-4-hydrogen` : la 3ᵉ lecture des justificatifs (voie h1, 14.11 : « pas beaucoup plus long et pas mal mieux »). Banc g1, moitié impaire,
 * réflexion basse : 93 lignes justes sur 108 contre 78 pour la 3.8, 3ᵉ lecture p50 19,8 s contre 14,0 s, même tarif (1,50 $ / 7,50 $ le million).
 * Autres usages : seulement l'analyse du compagnon (`brewerAnalysisAttempts`, voie h3) ; les imports, les fiches, la relecture et la recherche du compagnon gardent la 3.8.
 */
export const INVOICE_STRONG_MODEL = 'gemini-4-hydrogen';
/** La réflexion de la 3ᵉ lecture : basse (medium et high n'ont rien apporté à Hydrogen au banc g1 : 92 lignes justes dans les deux cas). */
export const INVOICE_STRONG_THINKING = 'LOW';
/**
 * Plafond de sortie de la 3ᵉ lecture : la réflexion compte dans `maxOutputTokens`, et 12 000 est le maximum que le garde-fou de coût accepte
 * (`quoteGeminiCost`). Le même que le banc (`FORT_MAX_OUT`).
 */
export const INVOICE_STRONG_MAX_OUTPUT = 12_000;
/**
 * Délai d'un appel Hydrogen. Mesuré au banc g1 en réflexion basse : p50 19,8 s, p90 23,4 s ; 60 s laisse plus du double du p90 et, sur le délai
 * global de 100 s de la lecture, de quoi tenter le repli sur la 3.8 (le banc, lui, tolère 90 s pour les réflexions hautes qu'il compare).
 */
export const INVOICE_STRONG_TIMEOUT_MS = 60_000;
/**
 * `gemini-4-argon` : la 3ᵉ lecture quand l'utilisateur doute et demande « Relire plus finement » (voie h1, 14.11 : « Argon, réflexion basse 108 / 108 est
 * aussi bon, ajoute un bouton pour l'appeler explicitement en fallback », « pour les users s'ils ont un doute »). Banc g1, moitié impaire : 108 lignes
 * justes sur 108 en réflexion basse. Jamais appelé sans cette demande ; le client ne dit que `relecture: 'argon'`, jamais un nom de modèle.
 * Tarif : 2 $ / 10 $ le million jusqu'au 30.11.2026, 4 $ / 20 $ dès le 1.12 (`geminiCosts.ts`, `RATE_CHANGES`).
 */
export const INVOICE_ARGON_MODEL = 'gemini-4-argon';
/** Les relectures qu'un client peut demander, par leur mot : la seule valeur admise est `'argon'`. */
export type InvoiceRelecture = 'argon';
/** Ce que le client a envoyé comme `relecture` : exactement `'argon'`, sinon rien (un nom de modèle, un texte, un nombre : ignoré, jamais transmis ni deviné). */
export function invoiceRelecture(value: unknown): InvoiceRelecture | undefined {
  return value === 'argon' ? 'argon' : undefined;
}
/** Liste blanche du serveur : aucune requête ne part vers un autre modèle. */
export const GEMINI_MODELS = [GEMINI_MODEL, GEMINI_LITE_MODEL, INVOICE_STRONG_MODEL, INVOICE_ARGON_MODEL] as const;
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
 * relecture du compagnon, recherche de fournisseurs (l'analyse du compagnon
 * passe à Hydrogen : `brewerAnalysisAttempts`). Les justificatifs
 * ont leur propre vote (`invoiceScanVote.ts`, D247) : deux Flash-Lite, puis une
 * 3ᵉ lecture sur désaccord ou lecture manquante (Hydrogen en réflexion basse
 * depuis le 14.11, la 3.8 en repli ; mesuré aux bancs du 1er et du 14 novembre 2026).
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

/**
 * Le compagnon, rôle « analyse » (la décision et les appels d'outils de chaque tour), hors mode Approfondi : Hydrogen en réflexion basse, puis
 * UNE nouvelle tentative sur 3.8 si Hydrogen flanche ou rend une réponse inutilisable (voie h3, 14.11 : « surtout regarde pour l'aide au
 * brasseur »). Banc g2 sur 12 cas, un tirage : note du juge 0,93 contre 0,87 pour 3.8, 2,8 appels contre 3,6, 0,056 contre 0,076 CHF la question,
 * 0 réponse inutilisable ; Argon et Carbon écrivent 150 à 280 mots et spéculent (ton hors cadre). Relecture et recherche restent sur 3.8 (la
 * relecture n'a pas été mesurée seule ; en recherche, 1 cas : Hydrogen ne nomme aucun fournisseur). Même tarif que 3.8 (`geminiCosts.ts`).
 */
export function brewerAnalysisAttempts(): GeminiAttempt[] {
  return [{ model: INVOICE_STRONG_MODEL, thinkingLevel: 'low' }, { model: GEMINI_MODEL, thinkingLevel: 'low' }];
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
