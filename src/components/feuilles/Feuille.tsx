import React, { useId } from 'react';
import { X } from 'lucide-react';
import { ModalShell } from '../../ui/ModalShell';
import './feuilles.css';

export type Teinte = 'age' | 'wat' | 'cop' | 'hop' | 'fin';

interface FeuilleProps {
  open: boolean;
  onClose: () => void;
  teinte: Teinte;
  icone: React.ReactNode;
  titre: string;
  /** Le dessin-réponse, dans la bande de couleur sous le titre. */
  bande?: React.ReactNode;
  children?: React.ReactNode;
  pied?: React.ReactNode;
  dismissible?: boolean;
  size?: 'md' | 'lg' | 'xl';
}

/**
 * La feuille de d3p2 : une bande de la couleur de la rubrique (pastille, titre, même croix à la même place) qui porte un
 * dessin-réponse, un corps de lignes compactes, un pied d'actions. Dialogue de l'app (`ModalShell`) : piège de focus,
 * Échap, clavier virtuel, ancrage au pouce restent ceux de la coque.
 */
export const Feuille: React.FC<FeuilleProps> = ({ open, onClose, teinte, icone, titre, bande, children, pied, dismissible = true, size = 'lg' }) => {
  const id = useId();
  return (
    <ModalShell open={open} onClose={onClose} size={size} dismissible={dismissible} labelledBy={id}>
      <div className="fe" data-c={teinte}>
        <div className="fe-band">
          <div className="fe-hd">
            <span className="fe-hi" aria-hidden="true">{icone}</span>
            <h2 id={id}>{titre}</h2>
            <button type="button" className="fe-x" aria-label="Fermer" disabled={!dismissible} onClick={onClose}><X size={18} aria-hidden="true" /></button>
          </div>
          {bande}
        </div>
        <div className="fe-bd">{children}</div>
        {pied ? <div className="fe-ft">{pied}</div> : null}
      </div>
    </ModalShell>
  );
};
