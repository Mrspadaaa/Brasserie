/**
 * Étape Identité (r4-a) : ce que le premier plan dit des alertes d'installation, et ce qu'il laisse au dessin.
 *
 * Le moteur (`recipeInstallationIssues`) renvoie des phrases. r4-a dessine déjà deux d'entre elles : le fermenteur plein
 * (« +N L de trop » sous le volume, zone rouge) et la cuve qui déborde (« +N L de trop » sur la barre). Les redire en
 * phrases ambre au premier plan, c'était « tout ce texte qui revient » (verdict du critique, n° 1). Ici, rien d'autre que du
 * tri et de la mise en forme, sans DOM : l'entrée est la liste des phrases, la sortie la seule ligne du premier plan.
 *
 * Rien ne se perd : chaque phrase retirée reste dite par le dessin ou par la tuile Matériel (`alertesDeMateriel`).
 */

export type GenreAlerte = 'fermenteur' | 'cuve' | 'rincage' | 'adoption' | 'autre';

const fini = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);
const fr = (n: number) => String(Math.round(n * 10) / 10).replace('.', ',');

/** Classe une phrase du moteur par ce qu'elle dit (les phrases sont celles de `recipeInstallation.ts`). */
export function genreAlerte(phrase: string): GenreAlerte {
  if (/capacité (physique|totale) du fermenteur/i.test(phrase)) return 'fermenteur';
  if (/avant ébullition dépasse la limite utile de la cuve/i.test(phrase)) return 'cuve';
  if (/rinçage dépasse les/i.test(phrase)) return 'rincage';
  if (/matériel de cette recette n’est pas figé|capacités du matériel de cette recette/i.test(phrase)) return 'adoption';
  return 'autre';
}

/** Ce que le dessin montre déjà : fermenteur plein ou dépassé ; barre de la cuve en dépassement. */
export interface Dessine { fermenteur: boolean; cuve: boolean }

export interface Rincage {
  /** Rinçage à chaud prévu (L), du contrôle d'équipement ; undefined = inconnu. */
  chaudL?: number;
  /** Maximum exceptionnel à chaud (L) ; undefined = lu dans la phrase du moteur. */
  maxL?: number;
}

/** « Rinçage : 28 L pour 24 L à chaud » : le seul chiffre que rien ne dessine. Un chiffre inconnu n'est jamais écrit 0. */
export function phraseRincage(phrase: string, r?: Rincage): string {
  const lu = phrase.match(/dépasse les (\d+(?:[.,]\d+)?) L/);
  const max = fini(r?.maxL) ? r!.maxL : lu ? Number(lu[1].replace(',', '.')) : undefined;
  if (fini(r?.chaudL) && fini(max)) return `Rinçage : ${fr(r!.chaudL!)} L pour ${fr(max)} L à chaud`;
  if (fini(max)) return `Rinçage au-delà des ${fr(max)} L à chaud`;
  return 'Rinçage au-delà du maximum à chaud';
}

export interface LignePremierPlan {
  /** La seule phrase du premier plan ; null = rien à dire au-dessus de la tuile Matériel. */
  texte: string | null;
  /** Les autres phrases, dites dans Matériel. */
  autres: number;
}

/**
 * La ligne unique entre la tuile Volume et la tuile Ébullition. Par ordre : le rinçage (rien ne le dessine), puis les autres
 * phrases dans l'ordre du moteur. Fermenteur et cuve s'effacent quand le dessin les dit ; ils reviennent si le dessin se tait.
 * Le matériel à adopter n'est pas une alerte du premier plan : il se dit en sous-titre de la tuile Matériel.
 */
export function lignePremierPlan(phrases: string[], dessine: Dessine, rincage?: Rincage): LignePremierPlan {
  const restantes: { genre: GenreAlerte; phrase: string }[] = [];
  for (const phrase of phrases) {
    const genre = genreAlerte(phrase);
    if (genre === 'adoption') continue;
    if (genre === 'fermenteur' && dessine.fermenteur) continue;
    if (genre === 'cuve' && dessine.cuve) continue;
    restantes.push({ genre, phrase });
  }
  if (!restantes.length) return { texte: null, autres: 0 };
  restantes.sort((a, b) => Number(b.genre === 'rincage') - Number(a.genre === 'rincage'));
  const [premiere, ...reste] = restantes;
  const texte = premiere.genre === 'rincage' ? phraseRincage(premiere.phrase, rincage) : premiere.phrase;
  return { texte, autres: reste.length };
}

/** Le matériel de la recette est à adopter : le moteur ne dit alors que cela, et la tuile Matériel le porte. */
export const aAdopter = (phrases: string[]) => phrases.some((p) => genreAlerte(p) === 'adoption');

/**
 * Les phrases que le résumé « Volumes et matériel » ne redit pas lui-même (il a ses propres alertes pour la cuve, le
 * fermenteur, le rinçage, l'empâtage et le rapport eau/grain) : elles s'ajoutent dans le résumé replié de la tuile Matériel.
 */
export function alertesDeMateriel(phrases: string[]): string[] {
  return phrases.filter((p) => genreAlerte(p) === 'autre' && !/dépassent la limite utile|rapport eau\/grain/i.test(p));
}

/** La ligne du résumé replié : « Volumes · 34,7 / 35 L avant ébullition ». Sans le moût d'avant ébullition : le fermenteur. */
export function resumeVolumes(o: { avantL?: number | null; cuveL?: number; volumeL?: number; capaciteL?: number }): string {
  if (fini(o.avantL) && o.avantL > 0 && fini(o.cuveL) && o.cuveL > 0) return `Volumes · ${fr(o.avantL)} / ${fr(o.cuveL)} L avant ébullition`;
  if (fini(o.volumeL) && o.volumeL > 0 && fini(o.capaciteL) && o.capaciteL > 0) return `Volumes · ${fr(o.volumeL)} / ${fr(o.capaciteL)} L au fermenteur`;
  return 'Volumes';
}
