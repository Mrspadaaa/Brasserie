// Pictos des 12 familles, au trait et au ton de la famille : les symboles p-<famille> de la planche standard
// (fils17-standard/v3/planche.html) ; « épicé » y est f1, cannelle et clou croisés (23.10). Le jeu de symboles est un
// fichier SVG versionné (src/data/hopV4/pictos-familles.svg), extrait tel quel de la planche par src/data/hopV4/copies-de-work.mjs (B8) :
// plus de découpage de chaîne à l'exécution.
import SYMBOLES from '../../data/hopV4/pictos-familles.svg?raw';
import type { FamilyId } from '../../domain/hopIndex/v4/families';
import { COURT } from './familyTokens';

/** À poser une fois dans la coquille : les symboles que <Picto> référence. */
export function JeuPictos() {
  return <div aria-hidden="true" style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }} dangerouslySetInnerHTML={{ __html: SYMBOLES }} />;
}

export function Picto({ famille, taille = 16, nomme = true }: { famille: FamilyId; taille?: number; nomme?: boolean }) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 24 24" data-famille={famille} className="shrink-0"
      role={nomme ? 'img' : undefined} aria-label={nomme ? COURT[famille] : undefined} aria-hidden={nomme ? undefined : true}>
      <use href={`#p-${famille}`} />
    </svg>
  );
}
