// Le moteur v4 tel que les écrans le lisent (#165, report de T5) : chaque fonction appelle le moteur des DONNÉES
// INJECTÉES (moteur() de donnees.ts, créé par la fabrique), jamais le moteur par défaut des fixtures. Un écran importe
// d'ici, ou de l'adaptateur (index.ts) ; du moteur lui-même (src/domain/hopIndex/v4), seulement des types.
// Sur les fixtures (défaut), moteur() partage le contexte du moteur par défaut : mêmes résultats, mêmes caches.
// Les calculs lourds (proposeVoies, substitutes…) passent par le client asynchrone (client.ts, useCalcul.ts) ; ceux
// d'ici sont légers, appelés au rendu comme avant.
import type { Moteur } from '../../../../../src/domain/hopIndex/v4';
import { moteur } from './donnees';

/** La fonction `nom` du moteur courant, relue à chaque appel (configurerDonnees peut le remplacer). */
const lie = <K extends keyof Moteur>(nom: K): Moteur[K] =>
  ((...a: unknown[]) => (moteur()[nom] as (...x: unknown[]) => unknown)(...a)) as Moteur[K];

// Constantes du moteur : règles et connaissances communes à tous les moteurs (familles, données de pouvoir V5.5,
// relevé des levures), pas des données du brasseur.
export { FAMILIES, FAMILY_NAMES, DONNEES_POUVOIR, nombreFr } from '../../../../../src/domain/hopIndex/v4';
export { EXTRAPOLATION } from '../../../../../src/domain/hopIndex/v4/data';

export const hopRef = lie('hopRef');
export const hopRole = lie('hopRole');
export const describeFamilies = lie('describeFamilies');
/** Les mots des fiches d'une variété, rangés par famille (pur : fiches du moteur courant et étiquettes données). Gardés par
 * moteur (#171) : Suggérer les relit pour chaque paire de houblons montrés (hors16d.ts, « lui seul »), 400 appels environ
 * à son ouverture. Un moteur neuf (données changées) repart d'un cache vide. Lecture seule pour les appelants. */
const MOTS = new WeakMap<Moteur, Map<string, ReturnType<Moteur['familyWords']>>>();
export const familyWords: Moteur['familyWords'] = (varietyId, tags) => {
  const m = moteur();
  let c = MOTS.get(m);
  if (!c) MOTS.set(m, (c = new Map()));
  const k = JSON.stringify([varietyId, tags?.tags ?? null, tags?.tagsFr ?? null]);
  let w = c.get(k);
  if (!w) { w = m.familyWords(varietyId, tags); c.set(k, w); }
  return w;
};
export const additionEffect = lie('additionEffect');
export const yeastSignals = lie('yeastSignals');
export const biotransfoLevure = lie('biotransfoLevure');
export const simulerCas = lie('simulerCas');
export const verifications = lie('verifications');
export const ibuByMoment = lie('ibuByMoment');
export const buildFromEmpty = lie('buildFromEmpty');
export const quickAdds = lie('quickAdds');
export const offModelLeads = lie('offModelLeads');
export const voiesSummary = lie('voiesSummary');
export const applyVoie = lie('applyVoie');

/** Les fiches des variétés que le moteur courant connaît (catalogue injecté des fiches ; défaut : la fixture, 318). */
export const fiches = () => moteur().catalogue;
