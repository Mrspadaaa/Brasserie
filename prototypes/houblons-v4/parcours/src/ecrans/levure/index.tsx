// Levure dans la maquette (étape 2 de Dryhopper) : l'écran vit dans l'app, une seule copie (T15c, #174) : src/ui/hopIndex/levure/.
// Ce fichier n'est que son hôte maquette (voir ../dryhopper/hote-maquette.tsx).
import Levure from '@app/ui/hopIndex/levure';
import { HoteMaquette } from '../dryhopper/hote-maquette';

export default function LevureMaquette({ ajoutId }: { ajoutId: string }) {
  return <HoteMaquette><Levure ajoutId={ajoutId} /></HoteMaquette>;
}
