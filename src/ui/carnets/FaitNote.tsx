/**
 * NOTE-EXPLOITEE (N2, 25.11) : ce que ses notes disent d'un article : « dispo douteuse · ta note, 24 nov. », sur la carte, la fiche et Comparer, à côté de ce que la page dit
 * (« en stock »), jamais à sa place. Sa phrase est montrée telle qu'il l'a écrite (jamais la réécriture de l'IA) ; aucun score de confiance ; le fait se détache d'un toucher
 * (la note reste dans le carnet). Le mot et l'endroit exacts restent à lui (mini maquettes) : ce composant n'en fige aucun rang.
 */
import React from 'react';
import { StickyNote } from 'lucide-react';
import type { NoteSurArticle } from '../../domain/carnets/modele';
import { libelleFait } from '../../domain/carnets/noteSurArticle';
import { dateCourte } from './EtatIA';
import './fait-note.css';

/** « dispo douteuse · ta note, 24 nov. » */
export const texteFait = (f: NoteSurArticle): string => {
  const jour = dateCourte(f.le);
  return `${libelleFait(f)} · ta note${jour ? `, ${jour}` : ''}`;
};

/** Le fait le plus récent, en une ligne (carte, colonne de Comparer). Aucun fait : rien. */
export function FaitNote({ faits, classe }: { faits?: readonly NoteSurArticle[]; classe?: string }) {
  const f = faits?.[faits.length - 1];
  if (!f) return null;
  return <span className={`cn-fait-note${classe ? ` ${classe}` : ''}`} data-fait-note={f.sujet ?? 'note'}><StickyNote size={14} aria-hidden /> {texteFait(f)}</span>;
}

/** Sur la fiche : chaque fait, sa phrase telle quelle, et « Détacher ma note » (la note reste dans le carnet). */
export function FaitsNoteFiche({ faits, onDetacher }: { faits?: readonly NoteSurArticle[]; onDetacher?: (messageId: string) => void }) {
  if (!faits?.length) return null;
  return (
    <section className="cn-fait-note-fiche" aria-label="Ta note sur cet article">
      {faits.map(f => (
        <div key={f.messageId} data-fait-note={f.sujet ?? 'note'}>
          <span className="cn-fait-note"><StickyNote size={14} aria-hidden /> {texteFait(f)}</span>
          <p className="cn-mut">« {f.mots} »</p>
          {onDetacher && !f.derive && <button type="button" className="cn-lien" onClick={() => onDetacher(f.messageId)}>Détacher ma note</button>}
        </div>
      ))}
    </section>
  );
}
