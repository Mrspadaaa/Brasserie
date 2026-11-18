/**
 * La note en vrac, découpée par l'IA en lignes typées (R18, R19 ; g5:v01-15, v06-17, v02-19, v01-16 ; R35, R36).
 * - `pendant` : « ✻ L'IA découpe votre note : 3 lignes, 2 carnets », un picto par type (G22 : panier à acheter, ampoule conseil),
 *   les achats en tête ; chaque ligne avec son carnet (« → Évier inox ») ou un carnet neuf (« aucun carnet proche », G23) ; ce qui
 *   n'y est pas (« pas d'achat », G23) ; dans un carnet ouvert, « Rattaché à <carnet> · Autre carnet » (G22) ;
 * - `apres` : « ✓ 3 lignes rangées dans 2 carnets · Annuler », chaque ligne avec sa puce de type ▾ et sa puce de carnet ▾
 *   (correction d'un toucher, rangée derrière), puis « › Texte d'origine » : son message, tel quel (R25).
 */
import React from 'react';
import { CircleHelp, FileText, Lightbulb, ListTodo, ShoppingBasket } from 'lucide-react';
import { Bandeau } from './Bandeau';
import { GENRE_LIBELLE, Provenance, type GenreNote, type Origine } from './EtatIA';

export interface LigneVracV { id: string; texte: string; genre: GenreNote; carnetId?: string; carnetTitre: string; neuf?: boolean }

export interface NoteEnVracProps {
  etat: 'pendant' | 'apres';
  lignes: LigneVracV[];
  texteOrigine: string;
  origine: Origine;
  /** Dans un carnet ouvert : « Rattaché à <carnet> · Autre carnet » (G22). */
  rattacheA?: string;
  onAutreCarnet?: () => void;
  onChangerGenre?: (ligneId: string) => void;
  onChangerCarnet?: (ligneId: string) => void;
  onAnnuler: () => void;
  /** Le nombre de carnets distincts, quand l'appelant le tient du plan (pendant) ou des effets (après) ; sinon compté sur les lignes. */
  nbCarnets?: number;
}

const ORDRE: GenreNote[] = ['a-acheter', 'a-faire', 'question', 'conseil', 'note'];
const PICTO: Record<GenreNote, React.ReactNode> = {
  'a-acheter': <ShoppingBasket size={16} aria-hidden />, 'a-faire': <ListTodo size={16} aria-hidden />,
  question: <CircleHelp size={16} aria-hidden />, conseil: <Lightbulb size={16} aria-hidden />, note: <FileText size={16} aria-hidden />,
};

/** Achats en tête (D-128), puis à faire, questions, conseils, notes ; ordre stable dans chaque type. */
export function trierLignes(lignes: LigneVracV[]): LigneVracV[] {
  return lignes.map((l, i) => ({ l, i })).sort((x, y) => ORDRE.indexOf(x.l.genre) - ORDRE.indexOf(y.l.genre) || x.i - y.i).map(x => x.l);
}

/** Même texte, à la casse, aux accents et au préfixe du banc près (« ZZ TEST — », retiré à l'affichage des titres). */
const sansBanc = (t: string) => t.replace(/^ZZ TEST\s*[—–-]\s*/i, '').trim();
const pareil = (x: string, y: string) => sansBanc(x).localeCompare(sansBanc(y), 'fr', { sensitivity: 'base' }) === 0;

/**
 * Le carnet d'une ligne, dit une seule fois (vision 2, m390-2 : « la ligne 2 répète son titre »). Carnet neuf titré par la ligne même :
 * « Nouveau carnet » ; carnet neuf titré par une autre ligne : « Nouveau carnet « <titre> » » ; carnet connu : son titre.
 */
export function libelleCarnet(l: Pick<LigneVracV, 'texte' | 'carnetTitre' | 'neuf'>): string {
  if (!l.neuf) return l.carnetTitre;
  return pareil(l.carnetTitre, l.texte) ? 'Nouveau carnet' : `Nouveau carnet « ${l.carnetTitre} »`;
}

/** Le nombre de carnets distincts : un carnet connu par son id, LE carnet neuf de la note une seule fois. */
export const carnetsDistincts = (lignes: readonly LigneVracV[]): number => new Set(lignes.map(l => l.carnetId ?? (l.neuf ? '\u0000neuf' : l.carnetTitre))).size;

/** « 1 chose à faire et 1 note, pas d'achat » (G23) : ce qu'il y a, et l'absence d'achat dite. */
export function resumeVrac(lignes: LigneVracV[]): string {
  const n = (g: GenreNote) => lignes.filter(l => l.genre === g).length;
  const parts: string[] = [];
  if (n('a-acheter')) parts.push(`${n('a-acheter')} à acheter`);
  if (n('a-faire')) parts.push(`${n('a-faire')} chose${n('a-faire') > 1 ? 's' : ''} à faire`);
  if (n('question')) parts.push(`${n('question')} question${n('question') > 1 ? 's' : ''}`);
  if (n('conseil')) parts.push(`${n('conseil')} conseil${n('conseil') > 1 ? 's' : ''}`);
  if (n('note')) parts.push(`${n('note')} note${n('note') > 1 ? 's' : ''}`);
  const liste = parts.length > 1 ? `${parts.slice(0, -1).join(', ')} et ${parts[parts.length - 1]}` : parts[0] ?? '';
  return n('a-acheter') ? liste : `${liste}, pas d'achat`;
}

export function NoteEnVrac(p: NoteEnVracProps) {
  const lignes = trierLignes(p.lignes);
  const carnets = p.nbCarnets ?? carnetsDistincts(lignes);
  const tete = p.etat === 'apres'
    ? <Bandeau bandeau={{ sorte: 'vrac', lignes: lignes.length, carnets }} onAnnuler={p.onAnnuler} />
    : (
      <div className="cn-cadre-tete">
        <span className="cn-sp"><Provenance origine={p.origine} /> {p.origine === 'ia' ? "L'IA découpe votre note" : 'Votre note, découpée sur place'} : {lignes.length} ligne{lignes.length > 1 ? 's' : ''}, {carnets} carnet{carnets > 1 ? 's' : ''}</span>
      </div>
    );
  return (
    <section className={p.etat === 'apres' ? 'cn-vrac cn-vrac-apres' : 'cn-cadre cn-vrac'} aria-label="Note en vrac">
      {tete}
      {p.etat === 'pendant' && <p className="cn-mut">{resumeVrac(lignes)}</p>}
      <ul className="cn-vrac-lignes">
        {lignes.map(l => (
          <li key={l.id} className="cn-vrac-ligne">
            {p.etat === 'apres' && p.onChangerGenre
              ? <button type="button" className={`cn-genre cn-genre-${l.genre}`} onClick={() => p.onChangerGenre!(l.id)}>{PICTO[l.genre]} {GENRE_LIBELLE[l.genre]} ▾</button>
              : <span className={`cn-genre cn-genre-${l.genre}`}>{PICTO[l.genre]} {GENRE_LIBELLE[l.genre]}</span>}
            <div className="cn-sp">
              <p>{l.texte}</p>
              {p.etat === 'apres' && p.onChangerCarnet
                ? <button type="button" className="cn-puce" onClick={() => p.onChangerCarnet!(l.id)}>{libelleCarnet(l)} ▾</button>
                : !p.rattacheA && <p className="cn-mut">→ {libelleCarnet(l)}{l.neuf && p.etat === 'pendant' ? ' · aucun carnet proche' : ''}</p>}
            </div>
          </li>
        ))}
      </ul>
      {p.etat === 'pendant' && p.rattacheA && (
        <div className="cn-bandeau-pied"><span className="cn-mut cn-sp">Rattaché à {p.rattacheA}</span>{p.onAutreCarnet && <button type="button" className="cn-puce" onClick={p.onAutreCarnet}>Autre carnet</button>}</div>
      )}
      {p.etat === 'pendant' && !p.rattacheA && <p className="cn-mut">Va dans : selon chaque ligne</p>}
      <details className="cn-origine">
        <summary>Texte d'origine</summary>
        <p className="cn-cite">{p.texteOrigine}</p>
      </details>
    </section>
  );
}
