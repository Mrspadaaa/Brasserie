// LO-2 : `decouperPiece` avec le calcul du plan dans un Worker (voir `decoupeTravail.ts`). Chargé à la demande par `geminiScanner` : c'est lui qui branche le client
// du Worker sur `decoupe.ts`, jamais l'inverse (le Worker charge `decoupe.ts` ; s'il importait le client, il recréerait un Worker dans le Worker).
import { brancherPlanificateur, decouperPiece } from './decoupe';
import { planifierHorsFil } from './decoupeTravail';

brancherPlanificateur(planifierHorsFil);

export { decouperPiece };
