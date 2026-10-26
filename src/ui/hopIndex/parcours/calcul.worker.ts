// Point d'entrée du worker persistant des calculs lourds de l'APP (w1, D115 : la préchauffe de Suggérer ne bloque plus le fil
// principal). La table de calculs.ts, servie par la boucle de src/ui/hopIndex/hopTools.worker.ts. Même point d'entrée que celui de la
// maquette (prototypes/houblons-v4/parcours/src/moteur/calcul.worker.ts), éprouvé en f6.
// Le worker a son propre moteur, ses caches et son journal (mesure.ts) : sur les fixtures par défaut tant que la page ne lui a rien envoyé ;
// la page lui envoie les données du brasseur (stock, dégustation, catalogue complet de c7 : donneesWorker.ts) au démarrage et à chaque changement.
import { ecouter, type PorteeWorker } from '../hopTools.worker';
import { CALCULS } from './calculs';
import { recevoirDonnees } from './donneesWorker';
import { enPrechauffage } from './mesure';

ecouter(self as unknown as PorteeWorker, CALCULS, {
  alimenter: recevoirDonnees(),
  prechauffage: enPrechauffage,
});
