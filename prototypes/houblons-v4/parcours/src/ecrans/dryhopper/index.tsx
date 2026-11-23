// Dryhopper dans la maquette (p4b2f, son choix du 24.10) : l'écran vit dans l'app, une seule copie (T15c, #174) :
// src/ui/hopIndex/dryhopper/. Ce fichier n'est que son hôte maquette : le brouillon et les gestes de l'état du parcours, la
// coquille (cadre à croix, hash, pile), la fiche posée sur l'outil (./fiche-sur-outil.tsx), et le moteur avec la dégustation S1.
import Dryhopper from '@app/ui/hopIndex/dryhopper';
import { HoteMaquette } from './hote-maquette';

export { ACC } from '@app/ui/hopIndex/dryhopper';

export default function DryhopperMaquette({ ajoutId }: { ajoutId: string }) {
  return <HoteMaquette><Dryhopper ajoutId={ajoutId} /></HoteMaquette>;
}
