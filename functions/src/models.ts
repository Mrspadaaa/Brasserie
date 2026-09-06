/**
 * Les deux niveaux d'IA de la brasserie.
 *
 * ⚡ RAPIDE  — le geste courant : lire une facture, compter des bouteilles sur
 *              une photo, proposer une liste de courses. On veut une réponse
 *              avant que Gaëtan ait reposé son téléphone.
 * 🎯 MAX     — le geste rare et sérieux : diagnostiquer une fermentation
 *              bloquée, préparer une déclaration, chercher une anomalie dans
 *              les comptes. Là on accepte d'attendre.
 *
 * ⚠️ Ne JAMAIS remettre `gemini-2.5-flash` ni `gemini-1.5-flash` dans les replis :
 * la 1.5 renvoie déjà 404 et la 2.5 s'éteint en octobre 2026. C'est exactement
 * la chaîne périmée qui a été retirée du client.
 */

export type AiTier = 'fast' | 'max';

export interface TierConfig {
  /** Modèle privilégié. */
  primary: string;
  /** Replis, essayés dans l'ordre si le principal est indisponible. */
  fallbacks: string[];
  /** Température : 0 pour tout ce qui extrait des chiffres. */
  temperature: number;
  label: string;
}

export const TIERS: Record<AiTier, TierConfig> = {
  /**
   * `gemini-3.5-flash-lite` : le multimodal le plus rapide du catalogue
   * (~350 jetons/s en sortie), explicitement optimisé pour la lecture de
   * documents et de tickets. Accepte image, PDF, audio et vidéo, 1 M de
   * contexte. C'est le modèle choisi après que 3.7 Flash a été jugé trop lent.
   */
  fast: {
    primary: 'gemini-3.5-flash-lite',
    fallbacks: ['gemini-3.1-flash-lite', 'gemini-3.6-flash'],
    temperature: 0,
    label: 'Rapide'
  },

  /**
   * `gemini-3.8-flash` : sorti le 2 septembre 2026, 1 M de contexte,
   * 64 k de sortie.
   */
  max: {
    primary: 'gemini-3.8-flash',
    fallbacks: ['gemini-3.7-flash', 'gemini-3.6-flash'],
    temperature: 0.2,
    label: 'Max'
  }
};

/** Ordre d'essai complet pour un niveau donné. */
export function modelChain(tier: AiTier): string[] {
  const cfg = TIERS[tier] ?? TIERS.fast;
  return [cfg.primary, ...cfg.fallbacks];
}
