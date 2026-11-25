/**
 * C79-fix (EXA-6, EXA-2) : la feuille ⋯ d'une BULLE du fil qui n'a pas une note unique : sa phrase est rangée en critère, en façon, en article, en
 * plusieurs notes, ou chez un autre carnet. Même feuille que celle d'une note (`FeuilleNote`, mêmes classes) : Modifier (une note), Changer en note
 * (un critère, une façon), Supprimer (rouge), Fermer. Elle dit ce que Supprimer touche : ce carnet seulement, jamais la note d'un autre carnet.
 */
import { FileText, Pencil, Trash2, X } from 'lucide-react';
import type { LigneBulle } from '../../domain/carnets/bulle';

const coupe = (t: string, n: number) => (t.length > n ? `${t.slice(0, n - 1).trimEnd()}…` : t);

export interface FeuilleBulleProps {
  /** Ce que la bulle a rangé dans ce carnet. */
  lignes: readonly LigneBulle[];
  /** Les titres des autres carnets où le message a rangé quelque chose (il y reste). */
  ailleurs: readonly string[];
  onModifier: (noteId: string) => void;
  onChangerEnNote: (ligne: LigneBulle) => void;
  onSupprimer: () => void;
  onFermer: () => void;
}

const SORTE: Record<LigneBulle['cible'], string> = { note: 'note', critere: 'critère', facon: 'façon', article: 'article' };

export function FeuilleBulle(p: FeuilleBulleProps) {
  const notes = p.lignes.filter(l => l.cible === 'note');
  const changeables = p.lignes.filter(l => l.cible === 'critere' || l.cible === 'facon');
  const nbSorte = p.lignes.length;
  return (
    <div className="cn-feuille-ancre">
      <div className="cn-feuille" role="menu" aria-label="Message du fil">
        {notes.map(l => (
          <button key={`m${l.id}`} type="button" role="menuitem" className="cn-feuille-item" onClick={() => p.onModifier(l.id)}>
            <Pencil size={18} aria-hidden /> Modifier{nbSorte > 1 ? <> <span className="cn-mut">« {coupe(l.texte, 28)} »</span></> : null}
          </button>
        ))}
        {changeables.map(l => (
          <button key={`c${l.id}`} type="button" role="menuitem" className="cn-feuille-item" onClick={() => p.onChangerEnNote(l)}>
            <FileText size={18} aria-hidden /> Changer en note{nbSorte > 1 ? <> <span className="cn-mut">le {SORTE[l.cible]} « {coupe(l.texte, 24)} »</span></> : null}
          </button>
        ))}
        <button type="button" role="menuitem" className="cn-feuille-item cn-rouge" onClick={p.onSupprimer}><Trash2 size={18} aria-hidden /> Supprimer</button>
        {p.ailleurs.length > 0 && <p className="cn-mut cn-aide" role="note">Reste dans {p.ailleurs.map(t => `« ${t} »`).join(', ')} : seul ce fil perd la bulle.</p>}
        <button type="button" className="cn-feuille-item cn-mut" onClick={p.onFermer}><X size={18} aria-hidden /> Fermer</button>
      </div>
    </div>
  );
}
