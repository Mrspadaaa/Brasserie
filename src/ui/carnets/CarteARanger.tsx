/**
 * D451, voie « afaire » : la carte des imprévus (maquettes3/v01, écran `epreuve`) : une photo seule, sans texte, ou un texte qui ne dit rien
 * (« truc à voir »). Option B de la décision « photo seule » : la carte propose le problème ouvert touché en dernier, avec sa raison, sans
 * décrire la photo ; « Oui » rattache, « Nouveau problème » en crée un, « Laisser » ne fait rien.
 *
 * Contrôlée par props (la proposition vient de `propositionARanger`, afaireRegles.ts) : aucun magasin lu. La provenance suit la règle Q19 : une
 * proposition calculée sur place porte le picto du calcul local, jamais le ✻ de l'IA (`origine="ia"` le rend, le jour où l'IA lira la photo).
 */
import React from 'react';
import { Camera } from 'lucide-react';
import { Provenance } from './EtatIA';
import { Photo } from './pictos';
import { motsDeLaCarte, type ElementARanger, type PropositionARanger } from './afaireRegles';
import './afaire.css';

export interface CarteARangerProps {
  element: ElementARanger;
  proposition: PropositionARanger;
  /** Qui propose : `locale` (le calcul de `propositionARanger`) ou `ia`. */
  origine?: 'locale' | 'ia';
  /** « Oui » : rattacher l'élément au problème proposé. */
  onRattacher: (carnetId: string) => void;
  /** « Nouveau problème » : en ouvrir un avec cet élément. */
  onNouveau: () => void;
  /** « Laisser » : rien, l'élément reste dans « À ranger ». */
  onLaisser: () => void;
}

export function CarteARanger({ element, proposition: p, origine = 'locale', onRattacher, onNouveau, onLaisser }: CarteARangerProps) {
  const { tete, corps } = motsDeLaCarte(element, p);
  const laisser = <button key="laisser" type="button" className="af-btn" onClick={onLaisser}>Laisser</button>;
  const nouveau = <button key="nouveau" type="button" className="af-btn" onClick={onNouveau}>Nouveau problème</button>;
  /* « rien d'autre écrit » : Laisser d'abord ; sans problème à proposer : Nouveau problème d'abord ; sinon Oui, Nouveau problème, Laisser (maquette) */
  const boutons = p.sorte === 'rattacher'
    ? [<button key="oui" type="button" className="af-btn af-oui" onClick={() => onRattacher(p.carnetId)}>Oui</button>, nouveau, laisser]
    : p.sorte === 'rien-d-autre' ? [laisser, nouveau] : [nouveau, laisser];
  return (
    <div className="cn-page af-hote">
    <section className="af-carte" data-proposition={p.sorte} aria-label={`À ranger : ${tete}`}>
      <div className="af-carte-tete"><Provenance origine={origine} titre={origine === 'ia' ? 'proposé par l’IA' : 'calculé sur place, sans lire la photo'} /> <span>{tete}</span></div>
      <div className="af-carte-corps">
        {element.photo && <Photo src={element.photo} className="af-photo" alt="Photo à ranger" repli={<span className="af-photo af-photo-vide" aria-hidden><Camera size={20} /></span>} />}
        <p className="af-carte-texte">
          {p.sorte === 'rattacher'
            ? <>Rattacher à <b>{p.titre}</b> ? <span className="cn-mut">· {p.raison}</span></>
            : corps}
        </p>
      </div>
      <div className="af-boutons">{boutons}</div>
    </section>
    </div>
  );
}
