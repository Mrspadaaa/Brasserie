import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeftRight, Pen } from 'lucide-react';
import { Feuille } from './Feuille';
import type { Personne } from './regles';

const lettre = (p: Personne) => (p === 'Gaëtan' ? 'G' : 'A');
/** « d’Aricia », « de Gaëtan » : l'élision se dit comme on la lit. */
export const auNomDe = (p: Personne) => (p === 'Aricia' ? 'd’Aricia' : 'de Gaëtan');

interface Props {
  open: boolean;
  /** Qui signe maintenant. */
  courant: Personne;
  onConfirmer: (cible: Personne) => void;
  onAnnuler: () => void;
}

/**
 * « Saisir au nom de » (d3p2) : la bascule moitié eau, moitié cuivre. Changer de signataire signe toutes les écritures
 * suivantes : on le dit avant le geste (TE-61), annulable. La cible est d'abord l'autre personne ; le rond central la
 * ramène à la personne actuelle, et le bouton dit alors « Garder … » (aucun bouton muet).
 * Posée sous <body> : l'en-tête qui l'appelle porte un flou qui deviendrait son bloc conteneur (VI-12).
 */
export const SaisirAuNom: React.FC<Props> = ({ open, courant, onConfirmer, onAnnuler }) => {
  const autre: Personne = courant === 'Gaëtan' ? 'Aricia' : 'Gaëtan';
  const [cible, setCible] = useState<Personne>(autre);
  useEffect(() => { if (open) setCible(autre); }, [open, autre]);
  if (!open) return null;
  const change = cible !== courant;
  const moitie = (p: Personne, etat: string, droite: boolean) => (
    <span data-p={lettre(p)} data-sel={cible === p} data-droite={droite} role="presentation">
      {!droite && <i className="fe-av" data-p={lettre(p)} aria-hidden="true">{lettre(p)}</i>}
      <span>{p}<small>{etat}</small></span>
      {droite && <i className="fe-av" data-p={lettre(p)} aria-hidden="true">{lettre(p)}</i>}
    </span>
  );
  return createPortal(
    <Feuille open onClose={onAnnuler} teinte="cop" icone={<Pen size={16} />} titre="Qui signe les écritures ?"
      bande={
        <button type="button" className="fe-sw" aria-label={`Signataire : ${cible}. Toucher pour changer.`} onClick={() => setCible(c => (c === courant ? autre : courant))}>
          {moitie(courant, cible === courant ? 'signera' : 'signe maintenant', false)}
          <u aria-hidden="true"><ArrowLeftRight size={16} /></u>
          {moitie(autre, cible === autre ? 'touchée' : 'à toucher', true)}
        </button>
      }
      pied={<>
        <span className="fe-sp" />
        <button type="button" className="fe-b2" onClick={onAnnuler}>Annuler</button>
        <button type="button" className="fe-btn" onClick={() => (change ? onConfirmer(cible) : onAnnuler())}>
          <ArrowLeftRight size={15} aria-hidden="true" />{change ? `Saisir au nom ${auNomDe(cible)}` : `Garder ${courant}`}
        </button>
      </>}>
      <p className="fe-says" aria-live="polite">
        {change
          ? <>Les prochaines écritures seront signées <b>{cible}</b>, plus {courant}. Tu peux revenir en arrière depuis ce menu.</>
          : <>Les prochaines écritures restent signées <b>{courant}</b>.</>}
      </p>
      <div className="fe-prev"><i className="fe-av" data-p={lettre(cible)} aria-hidden="true">{lettre(cible)}</i><span>Prochaine écriture · signée {cible}</span><Pen size={14} aria-hidden="true" /></div>
    </Feuille>,
    document.body
  );
};
