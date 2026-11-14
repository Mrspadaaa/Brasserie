import React, { useState } from 'react';
import { ECHELLES, xBarre } from '../../domain/stock/liste';
import { LEGENDE_RAYON, LIRE_ECHELLE, familleTeinteGroupe, rayonDuGroupe } from '../../domain/stock/ligne';
import './liste.css';

/** Icônes des familles, celles de la maquette sy/fA (traits de 2, 24 px). */
const ICONES: Record<number, string> = {
  0: 'M12 3c2 2.5 2 5 0 7.5C10 8 10 5.5 12 3Zm-5 5c2.6.3 4.3 2 4.6 4.6C9 12.3 7.3 10.6 7 8Zm10 0c-.3 2.6-2 4.3-4.6 4.6.3-2.6 2-4.3 4.6-4.6ZM7 13c2.6.3 4.3 2 4.6 4.6C9 17.3 7.3 15.6 7 13Zm10 0c-.3 2.6-2 4.3-4.6 4.6.3-2.6 2-4.3 4.6-4.6ZM12 11v10',
  1: 'M12 3c3 2 4 5 3 8-1 3-2 5-3 7-1-2-2-4-3-7-1-3 0-6 3-8Zm0 0v18M9 9l3 2 3-2M9.5 14l2.5 1.5 2.5-1.5',
  3: 'M8 4h8M9 4v4l-4 10a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3L15 8V4M7 15h10',
  4: 'M10 3h4v4l2 3v10a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V10l2-3V3ZM8 13h8',
  5: 'M9 3h6M12 3v4M7 10a5 5 0 0 1 10 0v10a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V10Zm3 5h4',
};
const NOM_AFFICHE: Record<string, string> = { Malts: 'Malts', Houblons: 'Houblons', Levures: 'Levures' };

/**
 * L'en-tête d'un groupe de la liste : l'icône de la famille (teinte c3b), son nom et son nombre ; pour les trois rayons, la légende de l'ordre,
 * le bouton ⓘ « Lire l'échelle » et la règle de la barre, dite sur elle-même (« à l'échelle », « ⫽ resserrée au-delà de 5 kg »).
 */
export const EnteteRayon: React.FC<{ nom: string; compte: number; sur?: number }> = ({ nom, compte, sur }) => {
  const [dit, setDit] = useState(false);
  const rayon = rayonDuGroupe(nom);
  const fam = familleTeinteGroupe(nom);
  const e = rayon ? ECHELLES[rayon] : null;
  const affiche = rayon && /^(malt|houblon|levure)/i.test(nom) ? NOM_AFFICHE[rayon] : nom;
  return (
    <div className="stock-liste l1-eh-bloc" data-sec={fam} data-rayon={rayon ?? undefined}>
      <div className="l1-eh">
        <span className="l1-ei" aria-hidden="true">
          {fam === 2
            ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="10" r="4" /><circle cx="16" cy="15" r="3" /><circle cx="16.5" cy="7.5" r="1.6" /></svg>
            : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={ICONES[fam]} /></svg>}
        </span>
        <h2>{affiche} <span className="l1-en">{sur !== undefined && sur !== compte ? `${compte} sur ${sur}` : compte}</span></h2>
        {rayon && <span className="l1-ec">{LEGENDE_RAYON[rayon]}</span>}
        {rayon && <button type="button" className="l1-ib" aria-label="Lire l'échelle" aria-expanded={dit} onClick={() => setDit((v) => !v)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9.5" /><path d="M12 11v6" /><circle cx="12" cy="7.6" r=".6" fill="currentColor" /></svg>
        </button>}
      </div>
      {e && rayon && <div className="l1-ech" aria-hidden="true" data-echelle={rayon}>
        <em className="l1-g">{e.gauche}</em>
        {e.droite && <em>{e.droite}</em>}
        {e.graduations.map((g) => <i key={g.q} className={g.coude ? 'l1-c' : ''} style={{ left: `calc(var(--l1-x0) + var(--l1-tw) * ${xBarre(g.q, e).toFixed(4)})` }}>{g.texte}</i>)}
      </div>}
      {dit && rayon && <p className="l1-dit" data-dit>{LIRE_ECHELLE[rayon]}</p>}
    </div>
  );
};
