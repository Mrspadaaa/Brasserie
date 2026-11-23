import type { Batch } from '../types';

/**
 * Occupation du fermenteur (AM-46, 08.11) : l'installation n'a qu'un fermenteur de 30 L, et rien n'empêchait deux brassins d'y fermenter ensemble.
 * L'app ne modélise qu'une capacité de fermenteur par installation ; un brasseur qui en possède un second ignorera l'avertissement. C'est donc
 * une alerte, jamais un refus. Sans capacité connue, rien n'est dit (l'inconnu n'est pas 0).
 */
export interface FermenterConflict {
  capacityL: number;
  totalL: number;
  others: Batch[];
}

const volumeOf = (b: Batch): number | undefined => {
  const v = b.volumeBrewedL ?? b.volumeL;
  return typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : undefined;
};

/** Les autres brassins en fermentation qui, ajoutés à celui-ci, dépassent la capacité du fermenteur ; `null` s'il n'y a pas de conflit. */
export function fermenterConflict(batch: Batch, all: Batch[]): FermenterConflict | null {
  const capacityL = batch.recipeSnapshot?.brewhouse?.equipment?.fermenterCapacityL;
  if (typeof capacityL !== 'number' || !Number.isFinite(capacityL) || capacityL <= 0) return null;
  const mine = volumeOf(batch);
  if (mine === undefined) return null;
  const others = all.filter((b) => b.id !== batch.id && b.status === 'fermentation' && volumeOf(b) !== undefined);
  if (!others.length) return null;
  const totalL = mine + others.reduce((sum, b) => sum + volumeOf(b)!, 0);
  return totalL > capacityL ? { capacityL, totalL, others } : null;
}

export function fermenterConflictMessage(c: FermenterConflict): string {
  const fr = (n: number) => String(Math.round(n * 10) / 10).replace('.', ',');
  const names = c.others.map((b) => `${b.name} (${b.id})`).join(', ');
  return `Fermenteur occupé : ${names} fermente déjà. Ensemble : ${fr(c.totalL)} L pour un fermenteur de ${fr(c.capacityL)} L. Libère-le ou vérifie qu’un second fermenteur existe.`;
}
