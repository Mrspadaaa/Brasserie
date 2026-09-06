


// --- Le houblonnage penche la balance ----------------------------------------

/**
 * Où poser le curseur SO₄ ⇄ Cl DANS la fourchette du style, d'après le
 * houblonnage.
 *
 * ⚠️ Le houblon ne fixe pas la cible — le style le fait. Une stout est amère et
 * veut pourtant du chlorure ; une NEIPA porte trois cents grammes de houblon et
 * veut du chlorure aussi. Prendre l'amertume seule pour boussole envoyait donc
 * une milk stout vers le sulfate.
 *
 * Ce que le houblonnage dit vraiment, c'est **pour quoi** il est là. Deux
 * signaux, et rien d'autre :
 *
 *   BU:GU        — l'amertume rapportée à la densité. Une bière sèche et
 *                  tranchante la porte haut ; une bière ronde la porte bas.
 *   part amère   — la masse versée pour amériser (premier moût, ébullition
 *                  longue) face à celle versée pour le parfum (whirlpool, à
 *                  cru). C'est elle qui sépare une West Coast d'une NEIPA, que
 *                  le BU:GU seul confond.
 *
 * Le résultat ne sort JAMAIS de la fourchette du style : il ne fait qu'y
 * choisir une place. Le brasseur, lui, garde la main — le curseur passe outre.
 */
export function hopBalanceHint(
  hops: Array<{ weightG?: number; stage?: string; timeMin?: number }> | undefined,
  ibu: number | null,
  og: number | null,
  range: { min: number; max: number }
): { ratio: number; position: number; note: string } | null {
  if (!range || !Number.isFinite(range.min) || !Number.isFinite(range.max) || range.min > range.max) return null;
  if (!ibu || !Number.isFinite(ibu) || ibu <= 0) return null;
  if (!og || !Number.isFinite(og) || og <= 1) return null;

  const list = (hops ?? []).filter((h) => Number.isFinite(h.weightG) && (h.weightG ?? 0) > 0);
  const gravityPoints = (og - 1) * 1000;
  if (list.length === 0 || gravityPoints <= 0) return null;

  const totalG = list.reduce((s, h) => s + (h.weightG ?? 0), 0);
  if (!Number.isFinite(totalG) || totalG <= 0) return null;

  /*
   * « Versé pour amériser » : le premier moût, et l'ébullition tenue au moins
   * un quart d'heure. Un ajout à 0 minute ne participe pas à l'amertume, il
   * participe à l'arôme — le compter parmi les amérisants faisait passer une
   * NEIPA pour une bière d'amertume.
   */
  const bitterG = list.reduce(
    (s, h) =>
      h.stage === 'firstWort' || (h.stage === 'boil' && Number.isFinite(h.timeMin) && (h.timeMin ?? 0) >= 15)
        ? s + (h.weightG ?? 0)
        : s,
    0
  );

  const clamp01 = (n: number) => (Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 0);
  const buGu = ibu / gravityPoints;
  const bitterShare = bitterG / totalG;

  // 0.2 à 0.9 de BU:GU couvre tout ce qui se brasse ; 10 à 70 % de part amère
  // sépare l'aromatique pur du houblonnage d'amertume classique.
  const position =
    0.5 * clamp01((buGu - 0.2) / 0.7) + 0.5 * clamp01((bitterShare - 0.1) / 0.6);

  const ratio = Math.round((range.min + position * (range.max - range.min)) * 10) / 10;
  if (!Number.isFinite(ratio) || !Number.isFinite(position)) return null;

  /* Une seule ligne : elle vit sous la toile, où la place est comptée. */
  const chiffres = `BU:GU ${buGu.toFixed(2)}, ${Math.round(bitterShare * 100)} % amérisant`;
  const note =
    position >= 0.66
      ? `Houblonnage d’amertume — ${chiffres} : le sulfate tranche.`
      : position <= 0.33
        ? `Houblonnage d’arôme — ${chiffres} : le chlorure arrondit.`
        : `Houblonnage mixte — ${chiffres}.`;

  return { ratio, position, note };
}

