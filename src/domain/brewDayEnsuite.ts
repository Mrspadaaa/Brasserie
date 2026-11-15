/**
 * K6 n° 18 (p2c e2 : « Magnum 10 g · 60′ au premier bouillon ») : le moment d'un houblon dit dans « Ensuite », pour tout houblon qui n'est pas du whirlpool
 * (celui-là a sa ligne « à 80 °C, après la coupure du feu »). Il vient du plan de la recette (`stepId`, `beforeEndMin`) ; sans moment connu, rien n'est inventé.
 */
export interface HoublonEnsuite {
  stepId: string;
  beforeEndMin?: number;
}

export function momentHoublonEnsuite(h: HoublonEnsuite, dureeEbullitionMin: number): string | null {
  if (h.stepId === 'fwh') return 'au premier moût';
  if (h.stepId === 'whirlpool') return null;
  const m = h.beforeEndMin;
  if (typeof m !== 'number' || !Number.isFinite(m) || m < 0) return null;
  if (m === 0) return 'coupure du feu';
  if (dureeEbullitionMin > 0 && m >= dureeEbullitionMin) return `${m}′ · au premier bouillon`;
  return `${m}′ avant la fin`;
}
