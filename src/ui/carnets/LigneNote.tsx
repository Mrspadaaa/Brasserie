/** Une note du carnet ouvert : son genre et son picto (G22, P11), sortie de CarnetOuvert.tsx. */
import type React from 'react';
import { Ellipsis, FileText, Lightbulb, ListTodo, ShoppingBasket } from 'lucide-react';
import { dateCourte, GENRE_LIBELLE, Provenance, type GenreNote, type NoteV } from './EtatIA';

const PICTO_GENRE: Record<GenreNote, React.ReactNode> = {
  'a-acheter': <ShoppingBasket size={18} />,
  'a-faire': <ListTodo size={18} />,
  question: <span className="cn-picto-question">?</span>,
  conseil: <Lightbulb size={18} />,
  note: <FileText size={18} />
};

export function LigneNote({ note, doublon, onNote, fait }: { note: NoteV; doublon: boolean; onNote: (id: string) => void; fait?: boolean }) {
  const d = dateCourte(note.modifieeLe ?? note.le);
  /* CRN-8 : dans un carnet archivé, ce qui était « à faire » est fait */
  const genreMot = fait && note.genre === 'a-faire' ? 'fait' : null;
  return (
    <div className="cn-note" data-genre={note.genre}>
      <span className={`cn-note-picto cn-genre-${note.genre}`} aria-hidden>{PICTO_GENRE[note.genre] ?? PICTO_GENRE.note}</span>
      <span className="cn-sp cn-note-tx">
        <span>{note.texte}</span>
        <span className="cn-mut">
          <b className={`cn-genre-mot cn-genre-${genreMot ? 'fait' : note.genre}`}>{genreMot ?? GENRE_LIBELLE[note.genre]}</b>{note.modifieeLe ? ' · modifiée' : ''}{d ? ` · ${d}` : ''}{note.groupe ? ` · ${note.groupe.libelle}` : ''}
          {doublon && <span className="cn-doublon"> · <Provenance origine="ia" /> doublon ?</span>}
        </span>
      </span>
      <button type="button" className="cn-ico" aria-label={`Note : ${note.texte}, actions`} onClick={() => onNote(note.id)}><Ellipsis size={22} aria-hidden /></button>
    </div>
  );
}
