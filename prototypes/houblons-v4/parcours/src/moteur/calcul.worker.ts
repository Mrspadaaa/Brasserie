// Point d'entrée du worker persistant des calculs lourds de la maquette (#171) : la table de calculs.ts servie par la
// boucle de src/ui/hopIndex/hopTools.worker.ts. Le worker a son propre moteur, sur les fixtures par défaut ; la page lui
// envoie ses données injectées (donneesClonables) au démarrage et à chaque changement. Ses caches et son journal
// (mesure.ts) sont les siens : les contrôles qui lisent window.__parcours.mesures ne voient que le fil principal.
import { ecouter, type PorteeWorker } from '../../../../../src/ui/hopIndex/hopTools.worker';
import { CALCULS } from './calculs';
import { configurerDonneesClonables, type DonneesClonables } from './donnees';
import { enPrechauffage } from './mesure';

ecouter(self as unknown as PorteeWorker, CALCULS, {
  alimenter: (d) => configurerDonneesClonables(d as DonneesClonables),
  prechauffage: enPrechauffage,
});
