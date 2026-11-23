/**
 * La rubrique Photos du carnet (§ Points ouverts 8 ; repère g4:v02-7). Masquée tant qu'elle est vide (MISSION « Rangé derrière ») ;
 * le carnet tout juste créé dit « Photos · aucune » lui-même (g5:v04-4). Chaque photo rangée montre sa vignette ; tant que l'IA ne l'a
 * pas lue (sans son accord, elle ne la lit pas), la vignette dit « non lue » et rien n'en est tiré (P21).
 */
import React from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { dateCourte, type PhotoV } from './EtatIA';

/** Une photo est lue seulement si le document le dit (`lue: true`) ; absent ou faux : « non lue ». */
export const photoLue = (ph: PhotoV): boolean => (ph as PhotoV & { lue?: boolean }).lue === true;

export function Photos({ photos, onOuvrir }: { photos: PhotoV[]; onOuvrir?: (id: string) => void }) {
  if (!photos.length) return null;
  return (
    <section className="cn-rubrique" aria-label="Photos">
      <h3 className="cn-rubrique-tete"><ImageIcon size={18} aria-hidden /> Photos <span className="cn-mut cn-mono">{photos.length}</span></h3>
      <ul className="cn-photos">
        {photos.map(ph => {
          const lue = photoLue(ph);
          const le = dateCourte(ph.le);
          return (
            <li key={ph.id}>
              <button type="button" className="cn-photo" onClick={() => onOuvrir?.(ph.id)} aria-label={`Photo${le ? ` du ${le}` : ''}${lue ? '' : ', non lue'}`}>
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
    </section>
  );
}
