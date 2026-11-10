/**
 * Les doutes du critique (passes 3 et 4) et les leviers de conduite : seuls ceux qu'une source documente sont rendus.
 * Un doute « non-source » n'affiche rien (src/data/levure/doutes.json).
 */
import fichier from '../../data/levure/doutes.json';
import type { IdAxe, SourceCourte } from './contrat';

export interface Doute {
  id: string; doute: string; statut: 'source' | 'partiel' | 'non-source'; constat: string;
  sources: SourceCourte[]; affiche?: string; levier?: string; axe?: IdAxe; sens?: -1 | 1; yeastIds?: string[];
  levierAxe?: 'temperature'; levierPlage?: { min: number; max: number };
}
export const DOUTES = fichier.doutes as unknown as readonly Doute[];
export const doute = (id: string): Doute | undefined => DOUTES.find((d) => d.id === id);

export interface Levier { texte: string; source: SourceCourte; axe?: 'temperature'; plage?: { min: number; max: number } }

/**
 * Le levier de conduite pour pousser `axe` dans le sens `sens` depuis la levure `idBase`, ou `undefined` si aucune source ne le documente.
 * Spécifique à la levure d'abord (3068), puis général à l'axe (°C des thiols, empâtage de l'atténuation).
 */
export function levierPour(idBase: string, axe: IdAxe, sens: -1 | 1): Levier | undefined {
  const lev = DOUTES.filter((d) => d.levier && d.axe === axe && d.statut === 'source' && (d.sens == null || d.sens === sens));
  const propre = lev.find((d) => d.yeastIds?.includes(idBase));
  const d = propre ?? lev.find((x) => !x.yeastIds);
  return d ? { texte: d.levier!, source: d.sources[0], ...(d.levierAxe ? { axe: d.levierAxe } : {}), ...(d.levierPlage ? { plage: d.levierPlage } : {}) } : undefined;
}
