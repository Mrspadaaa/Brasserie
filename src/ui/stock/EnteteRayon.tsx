import React, { useState } from 'react';
import { ECHELLES, xBarre, type Echelle, type TriListe } from '../../domain/stock/liste';
import { legendeRayon, LIRE_ECHELLE, familleTeinteGroupe, rayonDuGroupe } from '../../domain/stock/ligne';
import { PuceTri } from './OutilsStock';
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

/** La règle de la barre : dessous le titre sur mobile, dans l'en-tête de tableau (colonne « échelle ») à partir de 900 px. */
const Regle: React.FC<{ e: Echelle; rayon: string; classe: string }> = ({ e, rayon, classe }) => (
  <div className={`l1-ech ${classe}`} aria-hidden="true" data-echelle={rayon}>
    <em className="l1-g">{e.gauche}</em>
    {e.droite && <em>{e.droite}</em>}
    {e.graduations.map((g) => <i key={g.q} className={g.coude ? 'l1-c' : ''} style={{ left: `calc(var(--l1-x0) + var(--l1-tw) * ${xBarre(g.q, e).toFixed(4)})` }}>{g.texte}</i>)}
  </div>
);

/** Le repère de la ligne par rayon (EBC, α, DDM) : le tri « par défaut » de la liste le range (couleur, amertume, date). */
const REPERE: Record<string, string> = { Malts: 'EBC', Houblons: 'α', Levures: 'DDM' };

/** Un titre de colonne qui trie vraiment : ↑ quand c'est l'ordre en cours, ↕ sinon (une flèche ne s'affiche que sur les tris que la liste sait faire). */
const Titre: React.FC<{ texte: string; tri: TriListe; actuel?: TriListe; onTri?: (t: TriListe) => void; aria: string }> = ({ texte, tri, actuel, onTri, aria }) => (
  <button type="button" className="l1-thb" aria-label={aria} aria-pressed={actuel === tri} onClick={() => onTri?.(tri)}>{texte} <span aria-hidden="true">{actuel === tri ? '↑' : '↕'}</span></button>
);

/**
 * L'en-tête d'un groupe de la liste : l'icône de la famille (teinte c3b), son nom et son nombre ; pour les trois rayons, la légende de l'ordre,
 * le bouton ⓘ « Lire l'échelle » et la règle de la barre, dite sur elle-même (« à l'échelle », « ⫽ resserrée au-delà de 5 kg »).
 */
export const EnteteRayon: React.FC<{ nom: string; compte: number; sur?: number; tri?: TriListe; onTri?: (t: TriListe) => void; plie?: boolean; onPli?: () => void; resume?: string; onCatalogue?: () => void }> = ({ nom, compte, sur, tri, onTri, plie = false, onPli, resume, onCatalogue }) => {
  const [dit, setDit] = useState(false);
  const rayon = rayonDuGroupe(nom);
  const fam = familleTeinteGroupe(nom);
  const e = rayon ? ECHELLES[rayon] : null;
  const affiche = rayon && /^(malt|houblon|levure)/i.test(nom) ? NOM_AFFICHE[rayon] : nom;
  return (
    <div className="stock-liste l1-eh-bloc" data-sec={fam} data-rayon={rayon ?? undefined}>
      {/* Toute la ligne plie et déplie le rayon (le <summary> de la maquette g6) ; le chevron est le bouton du clavier et des lecteurs d'écran. */}
      <div className="l1-eh" onClick={onPli}>
        <span className="l1-ei" aria-hidden="true">
          {fam === 2
            ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="10" r="4" /><circle cx="16" cy="15" r="3" /><circle cx="16.5" cy="7.5" r="1.6" /></svg>
            : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={ICONES[fam]} /></svg>}
        </span>
        <h2>{rayon === 'Houblons' && onCatalogue
          ? <button type="button" className="l1-cat" aria-label="Ouvrir le catalogue des houblons" onClick={(ev) => { ev.stopPropagation(); onCatalogue(); }}>{affiche}</button>
          : affiche} <span className="l1-en">{sur !== undefined && sur !== compte ? `${compte} sur ${sur}` : compte}</span></h2>
        {rayon && onTri && <PuceTri tri={tri ?? 'defaut'} rayon={rayon} onTri={onTri} />}
        {rayon && <span className="l1-ec">{legendeRayon(rayon, tri)}</span>}
        {rayon && <button type="button" className="l1-ib" aria-label="Lire l'échelle" aria-expanded={dit} onClick={(e) => { e.stopPropagation(); setDit((v) => !v); }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9.5" /><path d="M12 11v6" /><circle cx="12" cy="7.6" r=".6" fill="currentColor" /></svg>
        </button>}
        {onPli && <button type="button" className="l1-chev" data-plie={plie ? '' : undefined} aria-label={`${plie ? 'Déplier' : 'Replier'} ${affiche}`} aria-expanded={!plie} onClick={(ev) => { ev.stopPropagation(); onPli(); }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 15 6-6 6 6" /></svg>
        </button>}
      </div>
      {plie && resume && <p className="l1-res" data-resume>{resume}</p>}
      {!plie && e && rayon && <Regle e={e} rayon={rayon} classe="l1-ech-bas" />}
      {/* L'en-tête de tableau (≥ 900 px) : mêmes colonnes que les lignes (maquette sy/fA g6) ; le chevron de repli de la maquette n'est pas porté. */}
      {!plie && <div className="l1-th">
        <span />
        <Titre texte="Article" tri="nom" actuel={tri} onTri={onTri} aria="Trier par nom" />
        {rayon ? <Titre texte={REPERE[rayon]} tri="defaut" actuel={tri} onTri={onTri} aria={`Trier par défaut : ${REPERE[rayon]}`} /> : <span />}
        <Titre texte="En stock" tri="quantite" actuel={tri} onTri={onTri} aria="Trier par quantité" />
        {e && rayon ? <Regle e={e} rayon={rayon} classe="l1-ech-th" /> : <span />}
        <span className="l1-thl">Dernier mouvement</span>
        <span className="l1-thl">Fournisseur</span>
      </div>}
      {!plie && dit && rayon && <p className="l1-dit" data-dit>{LIRE_ECHELLE[rayon]}</p>}
    </div>
  );
};
