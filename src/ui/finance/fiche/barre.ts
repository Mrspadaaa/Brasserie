import type { FinanceLine } from '../../../domain/finance/types';
import { accord } from '../../../services/plural';

/**
 * La facture en barre (m5fo-a, greffe de m2fo-c) : un segment par ligne, à sa part du total des lignes.
 * Calcul en centimes entiers : la barre ne passe jamais par des euros à virgule, et la somme des largeurs fait toujours 100 %.
 * Pas de bibliothèque : une somme cumulée, il n'y a pas de problème d'école derrière (L29).
 */

export type FamilleLigne = 'malt' | 'houblon' | 'levure' | 'autre';

/** Teintes de la maquette (#D2B356, #B8913A pour le malt ; #7FB24A, #5E9440 pour le houblon), prolongées quand une famille a plus de deux lignes. */
const PALETTES: Record<FamilleLigne, string[]> = {
  malt: ['#D2B356', '#B8913A', '#E3CB7E', '#9A7A2E'],
  houblon: ['#7FB24A', '#5E9440', '#9CCB6B', '#4A7A33'],
  levure: ['#C98A5E', '#A86C44', '#DDA67F', '#8A5535'],
  autre: ['#7A93B8', '#5C7399', '#9DB0CE', '#475C80'],
};
/** Une ligne sans montant positif (remise, ligne vide) ne tient pas de place dans la barre : sa rangée garde ce gris. */
export const COULEUR_SANS_PART = '#9A9A9A';

/**
 * La famille d'une ligne : la catégorie de son article au stock quand on la connaît, sinon le mot de la ligne.
 * Une ligne dont on ne sait rien reste « autre » (l'inconnu n'est pas un malt).
 */
export function familleDe(line: Pick<FinanceLine, 'description'>, categorieStock?: string): FamilleLigne {
  const cat = (categorieStock ?? '').toLowerCase();
  if (cat.startsWith('malt')) return 'malt';
  if (cat.startsWith('houblon')) return 'houblon';
  if (cat.startsWith('levure')) return 'levure';
  if (cat) return 'autre';
  const mot = line.description.toLowerCase();
  if (/\bmalt|\bpilsner|\bmunich|\bcrystal/.test(mot)) return 'malt';
  if (/\bhoublon|\bhop\b/.test(mot)) return 'houblon';
  if (/\blevure|\bus-?05\b/.test(mot)) return 'levure';
  return 'autre';
}

export interface SegmentBarre {
  id: string;
  description: string;
  amountCents: number;
  /** Position et largeur en % du total des lignes, deux décimales. */
  leftPct: number;
  widthPct: number;
  couleur: string;
  stockItemRef?: string;
}

export interface LigneColoree { line: FinanceLine; couleur: string; part: boolean }

/** Une couleur par ligne, dans l'ordre de la pièce ; chaque famille tourne dans sa palette. */
export function colorerLignes(lines: FinanceLine[], categorieDe: (line: FinanceLine) => string | undefined = () => undefined): LigneColoree[] {
  const rangs: Record<FamilleLigne, number> = { malt: 0, houblon: 0, levure: 0, autre: 0 };
  return lines.map(line => {
    const part = Number.isFinite(line.amountCents) && line.amountCents > 0;
    if (!part) return { line, couleur: COULEUR_SANS_PART, part };
    const famille = familleDe(line, categorieDe(line));
    const palette = PALETTES[famille];
    const couleur = palette[rangs[famille]++ % palette.length];
    return { line, couleur, part };
  });
}

/** Les segments, depuis les lignes de la pièce. Aucune ligne à montant positif : aucun segment, donc pas de barre. */
export function segmentsBarre(lignes: LigneColoree[]): SegmentBarre[] {
  const parts = lignes.filter(l => l.part);
  const total = parts.reduce((s, l) => s + l.line.amountCents, 0);
  if (!parts.length || total <= 0) return [];
  let cumul = 0;
  return parts.map((l, i) => {
    const left = Math.round((cumul * 10000) / total) / 100;
    cumul += l.line.amountCents;
    const fin = i === parts.length - 1 ? 100 : Math.round((cumul * 10000) / total) / 100;
    return {
      id: l.line.id, description: l.line.description, amountCents: l.line.amountCents,
      leftPct: left, widthPct: Math.round((fin - left) * 100) / 100, couleur: l.couleur,
      stockItemRef: l.line.stockItemRef,
    };
  });
}

/** « 4 lignes · au stock » (toutes les lignes mènent à un article), « 4 lignes · 2 au stock », ou « 4 lignes » seul. */
export function resumeLignes(lines: FinanceLine[], auStock: number): string {
  const n = lines.length;
  const base = `${n} ${accord(n, 'ligne')}`;
  if (!auStock) return base;
  return auStock === n ? `${base} · au stock` : `${base} · ${auStock} au stock`;
}
