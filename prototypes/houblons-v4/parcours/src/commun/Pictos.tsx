// Pictos des 12 familles, au trait et au ton de la famille : les symboles p-<famille> de la planche standard
// (fils17-standard/v3/planche.html), IMPORTÉS tels quels ; « épicé » y est f1, cannelle et clou croisés (23.10).
import planche from '../../../../../work/refonte-frontend/v4/ecran-1/fils17-standard/v3/planche.html?raw';
import type { FamilyId } from '../../../src/engine';
import { COURT } from './familles';

const debut = planche.indexOf('<svg width="0" height="0"');
const fin = planche.indexOf('</svg>', debut);
if (debut < 0 || fin < 0) throw new Error('Planche des pictos : jeu de symboles introuvable.');
/** Le jeu de symboles, tel que la planche le définit (symboles <symbol id="p-…">). */
const SYMBOLES = planche.slice(debut, fin + '</svg>'.length);

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
