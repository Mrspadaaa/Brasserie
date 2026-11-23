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
import { estLienSeul } from '../../domain/carnets/modele';

export interface LigneRangeeProps {
  /** `article` : en-tête d'article (G19 si `faconNom`). */
  sorte?: 'ligne' | 'article';
  faconNom?: string;
  /** Critique 6, n° 12 (R26, G20) : le rang de l'article rangé (« 1re de sa façon, devant Hotte inox 120 cm »), dit dans le bandeau. */
  rang?: string;
  /** Sa phrase telle qu'il l'a tapée (R25). */
  phrase?: string;
  /** « fond de bac, 38 cm au moins » : ce que le dépôt change pour comparer (R26). */
  rangeSur?: string;
  onAnnuler: () => void;
  onVotreTexte?: () => void;
  onDeplacer?: () => void;
  onChangerEnNote?: () => void;
  /** BL-1 : le carnet existant que l'IA voyait pour ce lien, resté ici ; « Déplacer vers … ? ». */
  versSuggere?: { titre: string; onDeplacer: () => void };
  children: React.ReactNode;
}

export function LigneRangee(p: LigneRangeeProps) {
  const corrections = [
    p.onVotreTexte && { cle: 'texte', libelle: 'Votre texte', fn: p.onVotreTexte },
    p.onDeplacer && { cle: 'deplacer', libelle: 'Déplacer', fn: p.onDeplacer },
    p.onChangerEnNote && { cle: 'note', libelle: 'Changer en note', fn: p.onChangerEnNote },
    p.versSuggere && { cle: 'vers', libelle: `Déplacer vers ${p.versSuggere.titre} ?`, fn: p.versSuggere.onDeplacer },
  ].filter(Boolean) as { cle: string; libelle: string; fn: () => void }[];
  return (
    <div className="cn-rangee" data-sorte={p.sorte ?? 'ligne'}>
      <Bandeau bandeau={p.sorte === 'article' ? { sorte: 'article', faconNom: p.faconNom, ...(p.rang ? { rang: p.rang } : {}) } : { sorte: 'range' }} onAnnuler={p.onAnnuler} />
      <div className="cn-rangee-corps">
        {p.children}
        {p.rangeSur && <p className="cn-mut"><Provenance origine="locale" /> articles rangés sur : {p.rangeSur}</p>}
        {/* tour 3, f5d n° 11 : un lien collé seul est « votre lien » ; l'URL reste citée, c'est le seul nom de l'article rangé */}
        {p.phrase && <p className="cn-cite">{estLienSeul(p.phrase) ? 'votre lien' : 'votre phrase'} : « {p.phrase} »</p>}
      </div>
      {corrections.length > 0 && (
        <div className="cn-corrections" role="group" aria-label="Corriger">
          {corrections.map(c => <button key={c.cle} type="button" className="cn-puce" onClick={c.fn}>{c.libelle}</button>)}
        </div>
      )}
    </div>
  );
}
