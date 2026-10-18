// Rôle d'un houblon (amérisant, aromatique, double) et alpha retenu, pour penser comme un brasseur.
import { hopRef } from './data';
import { FAMILIES } from './families';
import { describeFamilies } from './hops';

export type HopRoleValue = 'amérisant' | 'aromatique' | 'double';
const BITTER = ['Amertume', 'Début d’ébullition', 'Milieu d’ébullition'];
const AROMA = ['Ajouts tardifs', 'Houblonnage à cru', 'Arôme', 'Whirlpool', 'Extinction de la chauffe'];

/** Règle nommée, utilisée quand aucun fournisseur du dépôt ne donne le rôle. Seuils [H], à valider. */
export const ROLE_RULE = {
  nom: 'règle rôle-α v1 (prototype, à valider)',
  texte: [
    'Rôle du fournisseur d’abord (hopStyleUsageBootstrap) : « Amertume », « Début » ou « Milieu d’ébullition » → amérisant ; « Ajouts tardifs », « Houblonnage à cru », « Arôme », « Whirlpool », « Extinction de la chauffe » → aromatique ; les deux → double.',
    'Sinon, par l’alpha retenu (lot, sinon milieu de la plage variétale) : α ≥ 10 % → double si une famille est « marquée » dans les fiches, sinon amérisant ; α ≤ 6 % → aromatique ; entre les deux → double.',
    'Alpha inconnu : rôle null, avec la raison.',
  ],
};

export interface HopAlpha { value: number; min: number; max: number; source: string }
export function hopAlpha(key: string): HopAlpha | null {
  const a = hopRef(key)?.alpha;
  return a ? { value: Math.round(a.value * 10) / 10, min: a.min, max: a.max, source: a.from } : null;
}
export function hopRole(key: string): { value: HopRoleValue | null; source: string; raison?: string } {
  const h = hopRef(key);
  if (!h) return { value: null, source: 'règle', raison: 'Houblon inconnu.' };
  const uses = h.catalogue.usage ?? [];
  const roles = uses.flatMap((u) => u.roles);
  const bitter = roles.some((r) => BITTER.includes(r)), aroma = roles.some((r) => AROMA.includes(r));
  if (bitter || aroma) {
    const src = uses.find((u) => u.roles.length)?.source ?? 'fournisseur';
    return { value: bitter && aroma ? 'double' : bitter ? 'amérisant' : 'aromatique', source: `fournisseur : ${src}` };
  }
  const a = h.alpha?.value;
  if (a === undefined) return { value: null, source: 'règle', raison: 'Alpha inconnu : rôle non déterminé.' };
  const desc = describeFamilies(h.varietyId);
  const marked = FAMILIES.some((f) => desc[f].level === 'marqué');
  const value: HopRoleValue = a >= 10 ? (marked ? 'double' : 'amérisant') : a <= 6 ? 'aromatique' : 'double';
  return { value, source: `règle : ${ROLE_RULE.nom}` };
}
