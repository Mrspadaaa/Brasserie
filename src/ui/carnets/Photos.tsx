/**
 * La rubrique Photos du carnet (§ Points ouverts 8 ; repère g4:v02-7). Masquée tant qu'elle est vide (MISSION « Rangé derrière ») ;
 * chaque vignette dit « photo non lue » : l'IA ne lit pas la photo sans son accord, rien n'en est tiré.
 */
import React from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { dateCourte, type PhotoV } from './EtatIA';

export function Photos({ photos, onOuvrir }: { photos: PhotoV[]; onOuvrir?: (id: string) => void }) {
  if (!photos.length) return null;
  return (
    <section className="cn-rubrique" aria-label="Photos">
      <h3 className="cn-rubrique-tete"><ImageIcon size={18} aria-hidden /> Photos <span className="cn-mut cn-mono">{photos.length}</span></h3>
      <ul className="cn-photos">
        {photos.map(ph => (
          <li key={ph.id}>
            <button type="button" className="cn-photo" onClick={() => onOuvrir?.(ph.id)} aria-label={`Photo${ph.le ? ` du ${dateCourte(ph.le)}` : ''}, non lue`}>
              <img src={ph.jpeg} alt="" loading="lazy" />
              <span className="cn-mut">photo non lue</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
