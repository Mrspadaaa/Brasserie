import React from 'react';
import { teinte } from './modele';

// Les dessins de la maquette s1 (traits de 1,75 à 2 px, comme le reste de l'app).
const base = { fill: 'none', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true } as const;

export const Plus = ({ taille = 14 }: { taille?: number }) => (
  <svg viewBox="0 0 24 24" width={taille} height={taille} strokeWidth={2} {...base}><path d="M12 5v14M5 12h14" /></svg>
);
export const Moins = () => <svg viewBox="0 0 24 24" width={16} height={16} strokeWidth={1.75} {...base}><path d="M5 12h14" /></svg>;
export const Plus16 = () => <svg viewBox="0 0 24 24" width={16} height={16} strokeWidth={1.75} {...base}><path d="M12 5v14M5 12h14" /></svg>;
export const Croix = () => <svg viewBox="0 0 24 24" width={14} height={14} strokeWidth={1.75} {...base}><path d="M7 7l10 10M17 7 7 17" /></svg>;
export const Corbeille = () => (
  <svg viewBox="0 0 24 24" width={16} height={16} strokeWidth={1.75} {...base}><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" /></svg>
);
export const Chevron = ({ taille = 12 }: { taille?: number }) => (
  <svg viewBox="0 0 24 24" width={taille} height={taille} strokeWidth={2.33} {...base}><path d="m6 9 6 6 6-6" /></svg>
);
export const Cube = () => (
  <svg viewBox="0 0 24 24" width={14} height={14} strokeWidth={2} {...base}><path d="M12 3 20 7.5v9L12 21 4 16.5v-9Z" /><path d="M4 7.5 12 12l8-4.5M12 12v9" /></svg>
);
export const Entree = () => (
  <svg viewBox="0 0 24 24" width={14} height={14} strokeWidth={2} {...base}><path d="M20 4v7a4 4 0 0 1-4 4H4" /><path d="m9 10-5 5 5 5" /></svg>
);
export const Tour = () => (
  <svg className="fer-tour" viewBox="0 0 24 24" width={12} height={12} strokeWidth={2.33} {...base}>
    <path d="M17 2l4 4-4 4" /><path d="M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4" /><path d="M21 13v2a3 3 0 0 1-3 3H3" />
  </svg>
);
export const Bascule = () => (
  <svg viewBox="0 0 24 24" width={14} height={14} strokeWidth={2} {...base}>
    <path d="M17 2l4 4-4 4" /><path d="M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4" /><path d="M21 13v2a3 3 0 0 1-3 3H3" />
  </svg>
);
export const Rendement = () => (
  <svg viewBox="0 0 24 24" width={16} height={16} strokeWidth={1.75} {...base}><path d="M10 2h4M11 2v6.5a4 4 0 1 0 2 0V2" /><path d="M10 15h4" /></svg>
);
export const Verre = () => (
  <svg viewBox="0 0 24 24" width={16} height={16} strokeWidth={1.75} {...base}><path d="M6 3h12l-1.5 17a1 1 0 0 1-1 1h-7a1 1 0 0 1-1-1Z" /><path d="M6.6 9h10.8" /></svg>
);

/** L'étoile de l'article épinglé. */
export const Etoile = () => (
  <svg className="fer-et" viewBox="0 0 24 24" width={14} height={14} role="img" aria-label="épinglé">
    <path d="m12 2.8 2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.2l-5.6 3 1.1-6.3-4.6-4.4 6.3-.9Z" fill="#E0A02E" stroke="#9C7020" strokeWidth={1.2} strokeLinejoin="round" />
  </svg>
);

/** Un sac de grain dessiné : sa toile reste blanche tant que sa couleur n'est pas connue. */
export const Sac = ({ famille, ebc }: { famille: string; ebc: number | null | undefined }) => {
  if (famille !== 'grain') return <span className="fer-sac fer-sac-cube"><Cube /></span>;
  return (
    <svg className="fer-sac" viewBox="0 0 22 24" aria-hidden="true">
      <path d="M6 3h10l-1.5 3.2c3.3 1.8 5 5.6 5 9.6 0 4-2.6 5.7-8.5 5.7S2.5 19.8 2.5 15.8c0-4 1.7-7.8 5-9.6Z" fill={ebc == null ? '#fff' : teinte(ebc)} stroke="#666" strokeWidth={1.2} strokeLinejoin="round" />
      <path d="M7.4 6.2h7.2" stroke="#666" strokeWidth={1.2} strokeLinecap="round" />
    </svg>
  );
};
