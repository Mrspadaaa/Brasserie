/**
 * Chargement paresseux de la bibliothèque de levures (1,4 Mo ; voie l3, 10.11).
 *
 * Méthode standard : `import()` dynamique + promesse mémorisée (un seul chargement, partagé), remise à zéro si le réseau échoue pour
 * qu'un nouvel essai reparte. L'évaluation de `yeastReferences` enregistre la bibliothèque dans la porte de `yeastReferencesCore`
 * (`yeastLibraryPorte`, `enregistrerBibliothequeLevures`) : les calculs synchrones (`guidePredictionKnowledge`, `prepareBrewingScenarioContext`) la lisent ensuite.
 * Ce module est minuscule : il se charge avec l'écran qui en a besoin, sans la bibliothèque.
 */
import { bibliothequeLevuresChargee } from './yeastLibraryPorte';

let promesse: Promise<void> | undefined;

export function chargerBibliothequeLevures(): Promise<void> {
  if (bibliothequeLevuresChargee()) return Promise.resolve();
  return promesse ??= import('./yeastReferences').then(() => undefined, error => { promesse = undefined; throw error; });
}
