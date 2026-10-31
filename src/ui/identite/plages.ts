export type PositionPlage = 'dedans' | 'sous' | 'au-dessus' | 'inconnu';

/** Où se tient la valeur de la recette par rapport à la plage du style. Valeur inconnue : « inconnu », jamais « dedans ». */
export function positionDansPlage(valeur: number | null | undefined, plage?: { min: number; max: number }): PositionPlage {
  if (!plage || typeof valeur !== 'number' || !Number.isFinite(valeur)) return 'inconnu';
  if (valeur < plage.min) return 'sous';
  if (valeur > plage.max) return 'au-dessus';
  return 'dedans';
}

/** SRM → EBC (×1,97) pour la plage de couleur du style, arrondie à l'unité. */
export function plageEbc(srm?: { min: number; max: number }): { min: number; max: number } | undefined {
  return srm ? { min: Math.round(srm.min * 1.97), max: Math.round(srm.max * 1.97) } : undefined;
}

/** Une plage en texte : « 60–100 », « 7,5–10 », avec `decimales` fixes (« 1,065–1,085 ») ou libres si absent. */
export function texteSuisse(plage: { min: number; max: number }, decimales?: number): string {
  const f = (n: number) => (decimales === undefined ? String(Math.round(n * 100) / 100) : n.toFixed(decimales)).replace('.', ',');
  return `${f(plage.min)}–${f(plage.max)}`;
}
