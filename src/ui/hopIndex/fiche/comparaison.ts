// Les houblons retenus pour la comparaison dans l'app (T13, #173) : le « + » des voies de Suggérer, le bouton « Comparer » de la
// fiche. En mémoire, pour la session (la maquette les tient dans l'état de son parcours) : rien n'est écrit dans la recette.
import { useSyncExternalStore } from 'react';

let liste: string[] = [];
const ecouteurs = new Set<() => void>();
const changer = (suivante: string[]) => { liste = suivante; ecouteurs.forEach((f) => f()); };

export const lireComparaison = (): string[] => liste;
export const basculerComparaison = (cle: string): void => changer(liste.includes(cle) ? liste.filter((k) => k !== cle) : [...liste, cle]);
export const fixerComparaison = (cles: string[]): void => changer([...cles]);
/** Pour les tests : repart d'une comparaison vide. */
export const viderComparaison = (): void => changer([]);

const abonner = (f: () => void) => { ecouteurs.add(f); return () => { ecouteurs.delete(f); }; };
export const useComparaisonRetenue = (): string[] => useSyncExternalStore(abonner, lireComparaison, lireComparaison);
