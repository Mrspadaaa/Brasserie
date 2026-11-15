// RC-2 (BUGS.md, mission recette 14.11) : une recette dont le style est écrit en CODE BJCP seul (« 21A » : fixture, import, ancienne recette)
// n'atteignait ni l'eau (cible « Équilibré », SO₄ 50–120 au lieu de 175–300) ni la levure (« Style non reconnu »), parce que
// `matchBrewingStyles` compare le nom et les alias, jamais le code. Le style choisi dans Identité porte déjà son nom et passe.
// Ici : le code seul devient le nom du style qu'il désigne, à condition qu'il le désigne sans ambiguïté. Rien d'autre ne change.
import { matchBrewingStyles, type ListedStyle } from '../../domain/brewingStyles';

/**
 * Le nom du style quand `style` est un code seul ; sinon `style` tel quel.
 * - un nom ou un alias connu : inchangé ;
 * - un code désignant un seul style sélectionnable (hors historique), casse et espaces ignorés : le nom de ce style ;
 * - un code inconnu ou ambigu : inchangé (jamais deviné).
 */
export function styleNomme(style: string, styles: ListedStyle[]): string {
  const brut = style.trim();
  if (!brut) return style;
  if (matchBrewingStyles(brut, styles).length > 0) return style;
  const code = brut.toUpperCase();
  const trouves = styles.filter(s => s.selectable !== false && !s.historical && typeof s.code === 'string' && s.code.trim().toUpperCase() === code);
  return trouves.length === 1 ? trouves[0].name : style;
}
