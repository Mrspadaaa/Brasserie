import type { HopYeast } from '../../functions/src/hopPredictionSchema';

/**
 * Porte du chargement paresseux de la bibliothèque de levures (1,4 Mo ; voie l3, 10.11). Module sans dépendance (types seuls).
 * `yeastReferences.ts`, seul importeur de la bibliothèque, s'y enregistre en s'évaluant ; `chargerBibliothequeLevures()` l'évalue par
 * `import()` quand un calcul va en avoir besoin ; `yeastReferencesChargees` (noyau) la lit. Tant qu'elle n'est pas là, le calcul avec
 * catalogue LÈVE : jamais de résultat réduit en silence.
 */
let enregistree: (() => readonly HopYeast[]) | undefined;
export function enregistrerBibliothequeLevures(bibliotheque: () => readonly HopYeast[]): void { enregistree = bibliotheque; }
export const bibliothequeLevuresChargee = (): boolean => !!enregistree;
export const bibliothequeLevuresEnregistree = (): (() => readonly HopYeast[]) | undefined => enregistree;
