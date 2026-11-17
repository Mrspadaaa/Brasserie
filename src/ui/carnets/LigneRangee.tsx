/**
 * La ligne qui vient d'être rangée, à sa place dans sa rubrique (R14, g5:v03-8) : « ✓ Rangé ici, à l'instant · Annuler »,
 * ce qu'elle change pour comparer (« articles rangés sur : fond de bac, 38 cm au moins », calcul local), puis sa phrase citée
 * en italique : son message reste visible, comme dans un chat (R25). Trois corrections d'un toucher (G12, g5:v08-7) :
 * « Votre texte · Déplacer · Changer en note ». Pour un article (R17, g5:v06-10, G19), l'en-tête dit « Article rangé ici »,
 * ou « dans <façon> », et la carte complète est l'enfant.
 * G13 (la ligne du carnet visé qui s'éclaire quand il écrit depuis la liste) est rendu par `ListeCarnets.tsx`.
 */
import React from 'react';
import { Bandeau } from './Bandeau';
import { Provenance } from './EtatIA';

export interface LigneRangeeProps {
  /** `article` : en-tête d'article (G19 si `faconNom`). */
  sorte?: 'ligne' | 'article';
  faconNom?: string;
  /** Sa phrase telle qu'il l'a tapée (R25). */
  phrase?: string;
  /** « fond de bac, 38 cm au moins » : ce que le dépôt change pour comparer (R26). */
  rangeSur?: string;
  onAnnuler: () => void;
  onVotreTexte?: () => void;
  onDeplacer?: () => void;
  onChangerEnNote?: () => void;
  children: React.ReactNode;
}

export function LigneRangee(p: LigneRangeeProps) {
  const corrections = [
    p.onVotreTexte && { cle: 'texte', libelle: 'Votre texte', fn: p.onVotreTexte },
    p.onDeplacer && { cle: 'deplacer', libelle: 'Déplacer', fn: p.onDeplacer },
    p.onChangerEnNote && { cle: 'note', libelle: 'Changer en note', fn: p.onChangerEnNote },
  ].filter(Boolean) as { cle: string; libelle: string; fn: () => void }[];
  return (
    <div className="cn-rangee" data-sorte={p.sorte ?? 'ligne'}>
      <Bandeau bandeau={p.sorte === 'article' ? { sorte: 'article', faconNom: p.faconNom } : { sorte: 'range' }} onAnnuler={p.onAnnuler} />
      <div className="cn-rangee-corps">
        {p.children}
        {p.rangeSur && <p className="cn-mut"><Provenance origine="locale" /> articles rangés sur : {p.rangeSur}</p>}
        {p.phrase && <p className="cn-cite">votre phrase : « {p.phrase} »</p>}
      </div>
      {corrections.length > 0 && (
        <div className="cn-corrections" role="group" aria-label="Corriger">
          {corrections.map(c => <button key={c.cle} type="button" className="cn-puce" onClick={c.fn}>{c.libelle}</button>)}
        </div>
      )}
    </div>
  );
}
