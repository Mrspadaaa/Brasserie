// Substituer dans la maquette (u4, son choix du 19.10) : l'écran vit dans l'app, une seule copie (T15c, #174) :
// src/ui/hopIndex/substituer/. Ce fichier n'est que son hôte maquette : le brouillon et les gestes de l'état du parcours, la
// coquille (cadre à croix, hash, pile), la fiche de la maquette, et le moteur avec la dégustation S1 posée (../../moteur).
import Substituer from '@app/ui/hopIndex/substituer';
import { HoteMaquette } from '../dryhopper/hote-maquette';

export { doseExacte } from '@app/ui/hopIndex/substituer';

export default function SubstituerMaquette({ houblon }: { houblon: string }) {
  return <HoteMaquette><Substituer houblon={houblon} /></HoteMaquette>;
}
