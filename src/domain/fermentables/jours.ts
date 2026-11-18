import { BORNES_PROCEDE } from '../bornesProcede';

/**
 * AM-5 : le jour « J+ » d'un sucre ou d'un fruit ajouté en fermentation n'avait ni plafond ni lien avec le programme de fermentation.
 * Plafond : celui d'une phase de recette (un an, `BORNES_PROCEDE.fermentationJours`). Lien : le total des jours du programme (`joursProgramme`).
 */
export function messageJourFermentable(
  f: { name: string; use?: string; dayOffset?: number },
  programmeJours: number | null | undefined,
): string | null {
  const jour = f.dayOffset;
  if (f.use !== 'fermentation' || typeof jour !== 'number' || !Number.isFinite(jour)) return null;
  const max = BORNES_PROCEDE.fermentationJours.max;
  if (jour > max) return `${f.name} : J+${jour} — au-delà d’un an, ce n’est pas un ajout de fermentation (${max} j au plus).`;
  if (typeof programmeJours === 'number' && programmeJours > 0 && jour > programmeJours) {
    return `${f.name} : J+${jour} tombe après la fin du programme de fermentation (${programmeJours} j).`;
  }
  return null;
}
