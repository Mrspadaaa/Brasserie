/**
 * RL-5 (15.11) : l'alcalinité est déjà dans le repère des malts, et pourtant l'acide est dosé.
 * C'est le profil de style (la cible d'ions HCO₃⁻ du style) qui le commande, pas l'alcalinité.
 * L'écran doit le dire en une phrase, sans la formule « sous le repère des malts » qui contredit
 * un pH estimé correct. Le calcul de la dose ne change pas.
 *
 * Retourne `null` quand ce cas ne se présente pas : l'écran garde alors ses phrases habituelles.
 */
export interface AcideProfilInput {
  /** Alcalinité résiduelle de l'empâtage avant l'acide (ppm CaCO₃). */
  ra: number;
  /** Repère d'alcalinité des malts. */
  raBand: { min: number; max: number };
  /** Où l'acide amène l'alcalinité : dans le repère, au-dessus ou en dessous. */
  placeAcide: "haut" | "juste" | "bas";
  /** Dose d'acide à l'empâtage (mL ou g, selon l'acide). */
  acidAmount: number;
  /** Dose posée à la main : ce n'est plus le profil qui la commande. */
  manual: boolean;
  /** Estimation du pH d'empâtage SANS acide ; `null` si elle n'est pas connue. */
  phSansAcide: { known: boolean; position: -1 | 0 | 1 } | null;
  /** Nom du style ou de la cible qui impose le profil ; absent ou « — » : aucun profil. */
  profil: { code?: string; name: string };
}

export function noteAcideProfil(input: AcideProfilInput): string | null {
  const { ra, raBand, acidAmount, manual, phSansAcide, profil } = input;
  if (manual || !(acidAmount > 0)) return null;
  if (!profil.name || profil.code === "—") return null;
  if (!Number.isFinite(ra) || ra < raBand.min || ra > raBand.max) return null;
  if (phSansAcide?.known && phSansAcide.position === 0) {
    return `pH déjà dans la cible sans acide ; acide dosé pour le profil ${profil.name}.`;
  }
  return `Alcalinité déjà dans le repère ; acide dosé pour le profil ${profil.name}.`;
}
