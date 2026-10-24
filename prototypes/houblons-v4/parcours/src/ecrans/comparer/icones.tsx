// Icônes de Comparer : grille de 24 px comme lucide ; trait rendu de 1,33 px à toute taille, celui des icônes de
// l'app à 16 px (D83, S4 : une seule épaisseur de trait rendue). Celles du dock reprennent les dessins de r6n2.
import type { ReactNode } from 'react';

const TRAIT_ICONE = 4 / 3;
export const Ic = ({ children, taille = 14, label }: { children: ReactNode; taille?: number; label?: string }) => (
  <svg width={taille} height={taille} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={(TRAIT_ICONE * 24) / taille} strokeLinecap="round" strokeLinejoin="round"
    {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })} className="pq-comparer-ic">{children}</svg>
);
export const IconeStock = () => <Ic label="en stock"><path d="M21 8 12 3 3 8v8l9 5 9-5z" /><path d="M3 8l9 5 9-5M12 13v8" /></Ic>;
export const IconeLivre = () => <Ic taille={12}><path d="M2 4h7a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H2zM22 4h-7a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h8z" /></Ic>;
export const IconeOk = ({ taille = 13 }: { taille?: number }) => <Ic taille={taille}><circle cx="12" cy="12" r="9" /><path d="m8 12 3 3 5-6" /></Ic>;
export const IconeRisque = ({ taille = 13 }: { taille?: number }) => <Ic taille={taille}><path d="M12 3 2 20h20z" /><path d="M12 10v4M12 17v.5" /></Ic>;
export const IconeAucune = ({ taille = 13 }: { taille?: number }) => <Ic taille={taille}><circle cx="12" cy="12" r="9" /><path d="m5.6 18.4 12.8-12.8" /></Ic>;
export const IconeApproche = ({ taille = 13 }: { taille?: number }) => <Ic taille={taille}><path d="M3 12h13M11 7l5 5-5 5M20 5v14" /></Ic>;
export const IconeFiole = ({ taille = 16 }: { taille?: number }) => <Ic taille={taille}><path d="M9 3h6M10 3v6L4 20h16L14 9V3" /></Ic>;
export const IconeGoutte = ({ taille = 16 }: { taille?: number }) => <Ic taille={taille}><path d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z" /></Ic>;
export const IconePanel = ({ taille = 16 }: { taille?: number }) => <Ic taille={taille}><circle cx="9" cy="8" r="3" /><path d="M3 20c0-3 3-5 6-5s6 2 6 5M16 5a3 3 0 0 1 0 6M18 15c2 .5 3 2 3 5" /></Ic>;
export const Chevron = ({ ouvert }: { ouvert: boolean }) => <Ic taille={14}><path d={ouvert ? 'm6 15 6-6 6 6' : 'm6 9 6 6 6-6'} /></Ic>;
/** « = » de r6a (« dose égale 4 g/L ») : la même dose pour chaque houblon, dit sans mot. */
export const IconeEgal = ({ taille = 12, label = 'dose égale' }: { taille?: number; label?: string }) => <Ic taille={taille} label={label || undefined}><path d="M5 9h14M5 15h14" /></Ic>;
/** Défi (r6n2) : la cible. */
export const IconeCible = ({ taille = 20 }: { taille?: number }) => <Ic taille={taille}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.2" /></Ic>;
/** Frise (r6n2) : la ligne des moments, ses crans. */
export const IconeFrise = ({ taille = 20 }: { taille?: number }) => <Ic taille={taille}><path d="M2 16h20M5 13v6M9 14v4M12 8v11M15 14v4M19 13v6" /><circle cx="12" cy="6" r="2" /></Ic>;
/** Souche (r6n2) : deux cellules de levure. */
export const IconeSouche = ({ taille = 20 }: { taille?: number }) => <Ic taille={taille}><circle cx="9" cy="14" r="6" /><circle cx="17" cy="7" r="4" /><path d="M7 13.5h.01M10.5 16h.01" /></Ic>;
export const IconeFleche = ({ taille = 16 }: { taille?: number }) => <Ic taille={taille}><path d="M4 12h15M13 6l6 6-6 6" /></Ic>;
export const IconeAmpoule = ({ taille = 16 }: { taille?: number }) => <Ic taille={taille}><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z" /></Ic>;
/** « ~ simulé » de r6n2 : des curseurs (réglé par le moteur, pas mesuré). */
export const IconeSimule = ({ taille = 14 }: { taille?: number }) => <Ic taille={taille}><path d="M4 7h10M18 7h2M4 17h4M12 17h8" /><circle cx="16" cy="7" r="2" /><circle cx="10" cy="17" r="2" /></Ic>;
export const IconeTirer = ({ taille = 14 }: { taille?: number }) => <Ic taille={taille}><path d="M4 12a8 8 0 1 0 2.3-5.7L4 8.6M4 4v4.6h4.6" /></Ic>;
export const IconeEchanger = ({ taille = 16 }: { taille?: number }) => <Ic taille={taille}><path d="M16 3l4 4-4 4M20 7H8M8 21l-4-4 4-4M4 17h12" /></Ic>;
export const IconeSigma = ({ taille = 12 }: { taille?: number }) => <Ic taille={taille}><path d="M18 5H6l6 7-6 7h12" /></Ic>;
export const IconeCroix = () => <Ic taille={20}><path d="M6 6l12 12M18 6 6 18" /></Ic>;
export const IconePanier = () => <Ic label="à acheter, pas en stock"><circle cx="9" cy="20" r="1.4" /><circle cx="18" cy="20" r="1.4" /><path d="M2 3h3l2.6 12.4a2 2 0 0 0 2 1.6h8.6a2 2 0 0 0 2-1.6L22 7H6" /></Ic>;
