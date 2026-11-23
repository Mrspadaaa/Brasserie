// Le client des calculs lourds (proposer, suggerer, remplacants, substitutes, leviers), tel que les écrans l'appellent
// (T13, #173). Une seule copie, ici ; la maquette y pose son serveur (worker persistant, fil principal différé :
// prototypes/houblons-v4/parcours/src/moteur/client.ts), l'app garde le défaut : le fil principal, tout de suite.
// - défaut (les tests, et l'app avant l'étape Houblons ou sans worker) : `servirSurFilPrincipal`, réponse immédiate, caches du moteur ;
//   aucun état d'attente ;
// - `poserClient` : la maquette y remplace le client (et dit si ses recalculs sont asynchrones, useCalcul) ; l'app y pose, au montage de
//   l'étape Houblons, le client du worker (clientWorker.ts, w1, D115) : la préchauffe de Suggérer n'est plus un bloc du fil principal.
// Un changement des données du brasseur (stock, dégustation) vide le client de l'app.
import { creerClient, servirSurFilPrincipal, type ClientCalculs } from '../../../domain/hopIndex/v4/client';
import { CALCULS, cleSubstitutes, type CalculsParcours } from './calculs';
import { siDonneesChangent } from './donnees';
import { enPrechauffage } from './mesure';

export { CALCULS, type CalculsParcours } from './calculs';

/** Les options du client des écrans : la clé de `substitutes` lit le code du style, pas son gros objet. */
export const OPTIONS_CLIENT = { cles: { substitutes: cleSubstitutes } };

let courant: ClientCalculs<CalculsParcours> | null = null;
let pose = false;
let asynchrones = false;

/** Le client courant des calculs lourds (créé à la première lecture, sur le fil principal, s'il n'a pas été posé). */
export function calcul(): ClientCalculs<CalculsParcours> {
  if (!courant) {
    courant = creerClient(servirSurFilPrincipal(CALCULS, { differer: false, prechauffage: enPrechauffage }), OPTIONS_CLIENT);
    siDonneesChangent(() => { if (!pose) courant?.vider(); });
  }
  return courant;
}

/** La maquette remplace le client (elle vide et alimente le sien elle-même). `recalculsAsynchrones` : voir useCalcul. */
export function poserClient(c: ClientCalculs<CalculsParcours>, recalculsAsynchrones: boolean): void {
  courant = c; pose = true; asynchrones = recalculsAsynchrones;
}

/** true : un client a été posé (la maquette, ou le worker de l'app : clientWorker.ts) ; le défaut du fil principal n'est plus le client courant. */
export const clientEstPose = (): boolean => pose;

/** Remet le client par défaut (fil principal), tel qu'avant tout `poserClient` (tests). */
export function reinitialiserClient(): void { courant = null; pose = false; asynchrones = false; }

/** true : les recalculs d'un écran ouvert passent au worker (useCalcul). Défaut : false. */
export const recalculsAsynchrones = (): boolean => asynchrones;
