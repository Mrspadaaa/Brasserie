// Opérations pures sur une recette : chacune rend une nouvelle recette, l'ancienne reste intacte.
import { doseRemplacement } from '../moteur';
import { placer } from './quand';
import type { AjoutParcours, Quand, RecetteParcours } from './types';

export { classeEbullition, placer, quandDe } from './quand';

const avec = (r: RecetteParcours, additions: AjoutParcours[]): RecetteParcours => ({ ...r, additions });
export const trouver = (r: RecetteParcours, id: string) => r.additions.find((a) => a.id === id) ?? null;

export const ajouter = (r: RecetteParcours, a: AjoutParcours) => avec(r, [...r.additions.filter((x) => x.id !== a.id), { ...a }]);
export const retirer = (r: RecetteParcours, id: string) => avec(r, r.additions.filter((a) => a.id !== id));
export const changerDose = (r: RecetteParcours, id: string, grams: number) =>
  avec(r, r.additions.map((a) => (a.id === id ? { ...a, grams: Math.max(0, grams) } : a)));
export const changerMoment = (r: RecetteParcours, id: string, q: Quand) =>
  avec(r, r.additions.map((a) => (a.id === id ? placer(a, q, r) : a)));
export const choisirLevure = (r: RecetteParcours, yeastId: string): RecetteParcours => ({ ...r, yeastId });

/** Remplace le houblon d'un ajout, au même moment : à IBU égal à chaud (amérisant), à masse égale à froid
 * (règle de dose de la substitution du moteur, substitution.ts). Dose inconnue (α inconnu) : masse égale, signalé
 * par doseRemplacement. */
export function remplacer(r: RecetteParcours, id: string, hopKey: string): RecetteParcours {
  const a = trouver(r, id);
  if (!a) return r;
  const d = doseRemplacement(r, a, hopKey);
  return avec(r, r.additions.map((x) => (x.id === id ? { ...x, hopKey, grams: d.grams } : x)));
}

/** Identifiant neuf d'un ajout (stable pour les routes #/dryhopper/<ajout>). */
export function nouvelId(r: RecetteParcours, hopKey: string): string {
  const base = hopKey.replace(/^beermaverick-/, '').replace(/:cryo$/, '-cryo');
  let i = 1;
  while (r.additions.some((a) => a.id === `${base}-${i}`)) i += 1;
  return `${base}-${i}`;
}
