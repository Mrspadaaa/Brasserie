import React from 'react';
import { familleDuStyle } from '../BeerStyleTag';

/**
 * La pastille de style d'une note ou d'une idée (e9na n° 2) : la teinte vient de la famille du style, comme la maquette
 * (Lager jaune pâle, Ambrée forte orange, NEIPA lime), plus d'un ambre commun. Le nom reste celui que le brasseur a écrit.
 * Classes écrites en toutes lettres (Tailwind ne génère que celles qu'il trouve) ; mêmes jetons que `BeerStyleTag`.
 */
const TEINTES: Record<string, string> = {
  red: 'bg-red-400/40', orange: 'bg-orange-400/40', yellow: 'bg-yellow-400/40', lime: 'bg-lime-400/40', green: 'bg-green-400/40',
  teal: 'bg-teal-400/40', cyan: 'bg-cyan-400/40', blue: 'bg-blue-400/40', violet: 'bg-violet-400/40', fuchsia: 'bg-fuchsia-400/40', pink: 'bg-pink-400/40'
};

const sansAccent = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** La teinte de sa maquette : les ambrées en orange (le catalogue les met en rouge), le reste suit la famille du catalogue. */
const teinteDuStyle = (style: string): string | null => /amber|ambree|rousse/.test(sansAccent(style)) ? 'orange' : familleDuStyle(style);

/** Classe d'aplat selon la famille du style ; un style inconnu reçoit le gris chaud, pas une teinte au hasard. */
export const aplatDuStyle = (style: string): string => TEINTES[teinteDuStyle(style) ?? ''] ?? 'bg-cave-700';

export const PastilleStyle: React.FC<{ style: string; className?: string }> = ({ style, className = 'min-h-6 px-2.5' }) => (
  <span data-pastille="style" data-famille={teinteDuStyle(style) ?? 'inconnu'} className={`inline-flex shrink-0 items-center rounded-full text-sm font-semibold text-cave-50 ${aplatDuStyle(style)} ${className}`}>{style}</span>
);
