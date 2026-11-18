/**
 * Alcool en % vol. depuis la densité initiale et la densité finale (contre-calcul du 08.11, CF-6).
 *
 * Méthode officielle ASBC Beer-4 (Balling), valable de la bière légère à l'imperial stout :
 *   extrait réel RE = 0,1808 · OE + 0,8192 · AE         (OE, AE : °Plato de l'OG et de la FG)
 *   alcool en masse ABW = (OE − RE) / (2,0665 − 0,010665 · OE)
 *   ABV = ABW · FG / 0,7907
 * La formule (OG − FG) × 131,25 sous-estimait les bières fortes (1,102 → 1,026 : 10,0 % pour 10,4) ; sous 1,070, les deux restent
 * à 0,2 % vol l'une de l'autre. Le °Plato est celui de l'ASBC (polynôme de Lincoln), le même que `BrewingMath.sgToPlato`.
 *
 * Module sans import : la taxe, la projection de levure et le brassin mesuré l'appellent sans cycle.
 * Renvoie 0 quand une densité manque ou que la FG ne descend pas sous l'OG : jamais un alcool inventé.
 */
const plato = (sg: number) => -616.868 + 1111.14 * sg - 630.272 * sg ** 2 + 135.997 * sg ** 3;

export function alcoholByVolume(og: number, fg: number): number {
  if (!Number.isFinite(og) || !Number.isFinite(fg) || !(og > fg) || fg <= 0) return 0;
  const originalExtract = plato(og);
  const apparentExtract = plato(fg);
  const realExtract = 0.1808 * originalExtract + 0.8192 * apparentExtract;
  const byWeight = (originalExtract - realExtract) / (2.0665 - 0.010665 * originalExtract);
  const abv = (byWeight * fg) / 0.7907;
  return Number.isFinite(abv) && abv > 0 ? abv : 0;
}
