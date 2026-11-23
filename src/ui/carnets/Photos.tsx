/**
 * La rubrique Photos du carnet (§ Points ouverts 8 ; repère g4:v02-7). Masquée tant qu'elle est vide (MISSION « Rangé derrière ») ;
 * le carnet tout juste créé dit « Photos · aucune » lui-même (g5:v04-4). Chaque photo rangée montre sa vignette ; tant que l'IA ne l'a
 * pas lue (sans son accord, elle ne la lit pas), la vignette dit « non lue » et rien n'en est tiré (P21).
 * L-24 : la vignette n'est plus inerte. Un toucher ouvre la photo en grand dans la feuille de l'app, avec son état dit en clair ;
 * `onOuvrir` reste prévenu (le conteneur peut y brancher la lecture quand elle existera).
 */
import React from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { Sheet } from '../Sheet';
import { dateCourte, type PhotoV } from './EtatIA';
import './photos.css';

/** Une photo est lue seulement si le document le dit (`lue: true`) ; absent ou faux : « non lue ». */
export const photoLue = (ph: PhotoV): boolean => (ph as PhotoV & { lue?: boolean }).lue === true;

export function Photos({ photos, onOuvrir }: { photos: PhotoV[]; onOuvrir?: (id: string) => void }) {
  const [ouverte, setOuverte] = React.useState<string | null>(null);
  if (!photos.length) return null;
  const grande = photos.find(ph => ph.id === ouverte) ?? null;
  const leGrande = grande ? dateCourte(grande.le) : null;
  return (
    <section className="cn-rubrique" aria-label="Photos">
      <h3 className="cn-rubrique-tete"><ImageIcon size={18} aria-hidden /> Photos <span className="cn-mut cn-mono">{photos.length}</span></h3>
      <ul className="cn-photos">
        {photos.map(ph => {
          const lue = photoLue(ph);
          const le = dateCourte(ph.le);
          return (
            <li key={ph.id}>
              <button type="button" className="cn-photo" onClick={() => { setOuverte(ph.id); onOuvrir?.(ph.id); }} aria-label={`Photo${le ? ` du ${le}` : ''}${lue ? '' : ', non lue'}`}>
                <span className="cn-photo-cadre">
                  <img src={ph.jpeg} alt="" loading="lazy" />
                  {!lue && <span className="cn-photo-etat">non lue</span>}
                </span>
                {le && <span className="cn-mut">{le}</span>}
              </button>
            </li>
          );
        })}
      </ul>
      {grande && (
        <Sheet open onClose={() => setOuverte(null)} title={`Photo${leGrande ? ` du ${leGrande}` : ''}`} className="cn-photo-feuille">
          <img className="cn-photo-grande" src={grande.jpeg} alt={`Photo${leGrande ? ` du ${leGrande}` : ''}`} />
          <p className="cn-mut cn-photo-dit">{photoLue(grande) ? 'Lue : ce qu’elle montre est rangé dans le carnet.' : 'Pas lue : rien n’en est tiré. Pour ranger ce qu’elle montre (nom, prix), écrivez-le ou collez son lien dans le champ.'}</p>
        </Sheet>
      )}
    </section>
  );
}
