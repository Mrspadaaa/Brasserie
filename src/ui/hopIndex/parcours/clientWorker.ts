// Le client des calculs lourds de l'APP, servi par un worker (w1, D115, option a de e6) : la préchauffe de Suggérer (~1,2 s d'un bloc à ×4 sur le fil principal, e6 point 3)
// tourne dans le worker, le toucher du brasseur n'attend plus.
// Même transport que la maquette (hopToolsTransport.ts, calcul.worker.ts, éprouvés en f6) ; ce module le branche sur les données de l'app (donneesWorker.ts : stock, dégustation,
// catalogue complet de c7). Les compléments (complements.json) ne servent à aucun calcul de la table : ils restent au fil principal, chargés à la demande.
// Règles :
// - appelé au montage de l'étape Houblons (EtapeHoublons.tsx), une fois par session ; le client est posé par `poserClient` ;
// - une PREMIÈRE ouverture sans réponse préchauffée est servie sur le fil principal (repli synchrone du transport) : la liste de Suggérer s'affiche toujours, aucun état d'attente ;
// - le repli sur le fil principal reste entier : tests (jsdom n'a pas de Worker), page `file://`, `?calcul=immediat`, worker qui ne démarre pas ou qui tombe en panne ;
// - un changement des données du brasseur vide les réponses gardées et renvoie les données au worker.
import { creerClient, servirSurFilPrincipal, type ClientCalculs } from '../../../domain/hopIndex/v4/client';
import { servirParWorker, type ServeurWorker, type WorkerOutils } from '../hopToolsTransport';
import { CALCULS, type CalculsParcours } from './calculs';
import { OPTIONS_CLIENT, clientEstPose, poserClient } from './calcul';
import { siDonneesChangent } from './donnees';
import { preparerEnvoi } from './donneesWorker';
import { enPrechauffage } from './mesure';

let transport: ServeurWorker<CalculsParcours> | null = null;
let client: ClientCalculs<CalculsParcours> | null = null;
let envoi: ReturnType<typeof preparerEnvoi> | null = null;
let abonne = false;

/** Un worker est-il possible ici ? Page servie par HTTP(S), navigateur avec Worker, et pas `?calcul=immediat` (le fil principal, pour comparer des captures). */
export function workerPossible(): boolean {
  if (typeof window === 'undefined' || typeof location === 'undefined' || typeof Worker === 'undefined') return false;
  return /^https?:$/.test(location.protocol) && !/[?&]calcul=immediat(&|$)/.test(location.search);
}

export interface OptionsWorkerApp {
  /** Crée le worker (défaut : calcul.worker.ts). Les tests y mettent un faux worker. */
  creer?: () => WorkerOutils;
  /** Prévenu au passage au repli (défaut : un avertissement en console). */
  surRepli?: (raison: string) => void;
}

/** Pose le client du worker comme client des calculs de l'app, une fois par session. Rend le transport, ou null quand le fil principal reste le client (pas de worker possible, ou un
 * client déjà posé, p. ex. celui de la maquette). Une seconde demande rend le même transport. */
export function activerWorker(o: OptionsWorkerApp = {}): ServeurWorker<CalculsParcours> | null {
  if (transport) return transport;
  if (clientEstPose() || (!o.creer && !workerPossible())) return null;
  const filPrincipal = servirSurFilPrincipal(CALCULS, { differer: false, prechauffage: enPrechauffage });
  const repli = filPrincipal as typeof filPrincipal & { servirTout: NonNullable<(typeof filPrincipal)['servirTout']> };
  envoi = preparerEnvoi();
  transport = servirParWorker<CalculsParcours>({
    creer: o.creer ?? (() => new Worker(new URL('./calcul.worker.ts', import.meta.url), { type: 'module' }) as unknown as WorkerOutils),
    repli,
    donnees: envoi,
    surRepli: o.surRepli ?? ((raison) => console.warn(`[w1] calculs sur le fil principal : ${raison}`)),
  });
  client = creerClient(transport, OPTIONS_CLIENT);
  poserClient(client, false);
  if (!abonne) {
    abonne = true;
    siDonneesChangent(() => { client?.vider(); if (transport && envoi) transport.alimenter(envoi()); });
  }
  return transport;
}

/** Ferme le worker et oublie le client posé (tests). Le défaut du fil principal revient avec `reinitialiserClient`. */
export function arreterWorker(): void {
  transport?.fermer?.();
  transport = null; client = null; envoi = null;
}
