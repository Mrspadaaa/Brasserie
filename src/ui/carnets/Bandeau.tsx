/**
 * Les retours « après », avec Annuler dans la page (Q18, règle J23) : jamais de boîte de confirmation.
 * R11 « ✓ Carnet créé, en tête des Carnets · ↺ Annuler » et « « phrase » · votre phrase en titre » (g5:v04-4) ;
 * R14 « ✓ Rangé ici, à l'instant · Annuler » (g5:v03-8, cadre tenu par LigneRangee) ;
 * G20 « <nom> rangé, 2e · Annuler » (g5:v06-11) ; G21 « Rangé dans <carnet>, à l'instant · Annuler », raison, Déplacer (g5:v06-14) ;
 * R19 « ✓ 3 lignes rangées dans 2 carnets · Annuler » (g5:v01-16, cadre tenu par NoteEnVrac) ;
 * R20 « ✓ Note modifiée, à l'instant · Annuler » ; G30 « ✓ Renommé · avant : <titre> · Annuler » ; G32 « Note supprimée · Annuler » ;
 * G37 « Carnet supprimé · <titre> · Annuler » ; G26 conséquence pour comparer, au picto local, si `aides.consequence`.
 * Le temps d'affichage (5 s au moins) est tenu par le conteneur ; ce composant ne disparaît pas seul.
 */
import React from 'react';
import { Check, Undo2 } from 'lucide-react';
import { PictoLocal } from './EtatIA';

export type BandeauV =
  | { sorte: 'cree'; phrase: string }
  | { sorte: 'range' }
  | { sorte: 'article'; faconNom?: string }
  | { sorte: 'deuxieme'; nom: string; rang: number; faconsNees?: number }
  | { sorte: 'ailleurs'; carnet: string; raison?: string; onDeplacer: () => void }
  | { sorte: 'vrac'; lignes: number; carnets: number }
  | { sorte: 'modifiee' }
  | { sorte: 'renomme'; avant: string }
  | { sorte: 'note-supprimee' }
  | { sorte: 'carnet-supprime'; titre: string };

/** G26 : ce que le changement fait à la comparaison (différence calculée par `comparer.ts`, jamais inventée). */
export interface ConsequenceV { texte: string; onPasserCritere?: () => void }

export function texteBandeau(b: BandeauV): string {
  switch (b.sorte) {
    case 'cree': return '✓ Carnet créé, en tête des Carnets';
    case 'range': return '✓ Rangé ici, à l\'instant';
    case 'article': return b.faconNom ? `✓ Article rangé ici, dans ${b.faconNom}` : '✓ Article rangé ici, à l\'instant';
    case 'deuxieme': return `${b.nom} rangé, ${b.rang === 1 ? '1er' : `${b.rang}e`}`;
    case 'ailleurs': return `Rangé dans ${b.carnet}, à l'instant`;
    case 'vrac': return `✓ ${b.lignes} ligne${b.lignes > 1 ? 's' : ''} rangée${b.lignes > 1 ? 's' : ''} dans ${b.carnets} carnet${b.carnets > 1 ? 's' : ''}`;
    case 'modifiee': return '✓ Note modifiée, à l\'instant';
    case 'renomme': return '✓ Renommé';
    case 'note-supprimee': return 'Note supprimée';
    case 'carnet-supprime': return 'Carnet supprimé';
  }
}

export function Bandeau({ bandeau, onAnnuler, consequence, aideConsequence, enLigne }: {
  bandeau: BandeauV;
  onAnnuler: () => void;
  consequence?: ConsequenceV | null;
  /** `aides.consequence` : G26 ne paraît que s'il est vrai. */
  aideConsequence?: boolean;
  /** Rendu à la place de l'élément (note supprimée, carnet supprimé) : sans cadre vert. */
  enLigne?: boolean;
}) {
  const b = bandeau;
  const avecCoche = b.sorte !== 'note-supprimee' && b.sorte !== 'carnet-supprime' && b.sorte !== 'deuxieme' && b.sorte !== 'ailleurs';
  const texte = texteBandeau(b).replace(/^✓ /, '');
  return (
    <div className={`cn-bandeau${enLigne ? ' cn-bandeau-ligne' : ''}`} role="status" data-sorte={b.sorte}>
      <div className="cn-bandeau-tete">
        {avecCoche && <Check size={18} aria-hidden className="cn-ok" />}
        <span className="cn-sp">
          {avecCoche && <span className="cn-cache">✓ </span>}
          {texte}
          {b.sorte === 'renomme' && <span className="cn-mut"> · avant : {b.avant}</span>}
          {b.sorte === 'carnet-supprime' && <span> · <b>{b.titre}</b></span>}
        </span>
        <button type="button" className="cn-lien" onClick={onAnnuler}>
          {b.sorte === 'cree' && <Undo2 size={16} aria-hidden />} Annuler
        </button>
      </div>
      {b.sorte === 'cree' && <p className="cn-cite">« {b.phrase} » · votre phrase en titre</p>}
      {b.sorte === 'deuxieme' && b.faconsNees ? <p className="cn-mut">{b.faconsNees} façons nées des {b.faconsNees} articles</p> : null}
      {b.sorte === 'ailleurs' && (
        <div className="cn-bandeau-pied">
          {b.raison && <span className="cn-mut cn-sp">{b.raison}</span>}
          <button type="button" className="cn-puce" onClick={b.onDeplacer}>Déplacer</button>
        </div>
      )}
      {aideConsequence && consequence && (
        <div className="cn-consequence">
          <PictoLocal />
          <span className="cn-sp">{consequence.texte}</span>
          {consequence.onPasserCritere && <button type="button" className="cn-puce" onClick={consequence.onPasserCritere}>Passer en Ce qui compte</button>}
        </div>
      )}
    </div>
  );
}
