// Préchauffage du moteur au repos (performance, voie p8 ; t2 « Optimisations » n° 1 et 8). Pendant que le brasseur lit
// Ma bière, les calculs des écrans qu'il ouvrira d'un toucher (Suggérer, Substituer) se font par petites tâches, une
// par moment de repos du navigateur (requestIdleCallback). Le toucher trouve alors le résultat dans les caches de
// l'adaptateur. Rien ne change à l'écran : mêmes fonctions, mêmes arguments, mêmes résultats.
// Les appels sont journalisés sous « prechauffage:<nom> » (mesure.ts), hors des recalculs que comptent les contrôles.
// Les voies de Suggérer (voiesDe sans calculs) passent par le client asynchrone (client.ts, #165) : servi par un worker,
// le client garde la réponse préchauffée, et l'écran ouvert d'un toucher la lit sans attendre (aucun état d'attente).
import { enPrechauffage } from './mesure';

export type Tache = () => unknown;
type Poignee = { annuler: () => void };

const auRepos = (f: () => void): Poignee => {
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    const id = window.requestIdleCallback(f, { timeout: 3000 });
    return { annuler: () => window.cancelIdleCallback(id) };
  }
  const id = setTimeout(f, 60);
  return { annuler: () => clearTimeout(id) };
};

let file: Tache[] = [];
let attente: Poignee | null = null;

function suivante() {
  attente = null;
  const t = file.shift();
  if (!t) return;
  // Un échec de préchauffage ne doit rien casser : l'écran refera le calcul et dira son erreur lui-même.
  try { enPrechauffage(t); } catch { /* rien */ }
  if (file.length) attente = auRepos(suivante);
}

/** Remplace la file de préchauffage par `taches` (une par moment de repos). Rend la fonction qui l'annule. */
export function prechauffer(taches: Tache[]): () => void {
  annulerPrechauffage();
  file = [...taches];
  if (file.length) attente = auRepos(suivante);
  return annulerPrechauffage;
}

export function annulerPrechauffage(): void {
  attente?.annuler();
  attente = null;
  file = [];
}
