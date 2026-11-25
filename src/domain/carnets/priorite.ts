/**
 * R91 (25.11, « pouvoir dépasser et classé en fonction de la priorité » ; sa parole : « Pas du drag and drop ») : la priorité d'un carnet dans sa liste
 * (les problèmes à plat d'un domaine, ou un sous-domaine). Trois gestes au menu ⋯ de la ligne : En tête, Monter, Descendre.
 *
 * Modèle : `carnet.priorite` (nombre, 1 = le premier). Un carnet classé passe avant tous ceux qui n'ont jamais été déplacés ; ceux-là gardent l'ordre
 * d'avant (le plus récent d'abord, `arbreDe`). Un geste n'écrit que le MINIMUM : le préfixe de la liste qui ne se retrouve pas tout seul dans l'ordre
 * « récent d'abord » ; le reste de la liste n'est pas touché (un carnet neuf s'y glisse donc à sa place, après les classés).
 * Ce n'est pas un tri à écrire à la main : un tri stable en deux paquets (classés par priorité, puis les autres dans leur ordre).
 */
import type { CarnetDoc } from './modele';
import { Brouillon, refus, type Etat, type Resultat } from './operations';

export type GestePriorite = 'tete' | 'monter' | 'descendre';

/** Classés d'abord (priorité croissante, id en départage), puis les autres dans l'ordre reçu. */
export function classerParPriorite<T extends CarnetDoc>(liste: readonly T[]): T[] {
  const classes = liste.filter(c => c.carnet.priorite !== undefined).sort((a, b) => a.carnet.priorite! - b.carnet.priorite! || a.id.localeCompare(b.id));
  return [...classes, ...liste.filter(c => c.carnet.priorite === undefined)];
}

/**
 * Le nouvel ordre COMPLET d'un groupe après un geste sur `id`. Le geste se lit sur ce qui est VU (`visibles`, sous le filtre ou la recherche) :
 * « Monter » passe devant le voisin visible ; les carnets cachés gardent leur place. `null` : rien ne change (déjà en tête, déjà au bout).
 */
export function ordreApresGeste(complet: readonly string[], visibles: readonly string[], id: string, geste: GestePriorite): string[] | null {
  const i = visibles.indexOf(id);
  if (i < 0) return null;
  const v = [...visibles];
  if (geste === 'tete') { if (i === 0) return null; v.splice(i, 1); v.unshift(id); }
  else {
    const j = geste === 'monter' ? i - 1 : i + 1;
    if (j < 0 || j >= v.length) return null;
    [v[i], v[j]] = [v[j], v[i]];
  }
  const places = new Set(visibles);
  let k = 0;
  return complet.map(x => (places.has(x) ? v[k++] : x));
}

/** `a` avant `b` dans l'ordre « récent d'abord » (`arbreDe`). */
const avant = (a: CarnetDoc, b: CarnetDoc): boolean => b.carnet.creeLe.localeCompare(a.carnet.creeLe) < 0 || (b.carnet.creeLe === a.carnet.creeLe && a.id.localeCompare(b.id) < 0);

/**
 * Les priorités à écrire pour que `ordre` (les ids du groupe) soit l'ordre affiché : le plus long suffixe sans carnet classé et déjà en ordre « récent d'abord »
 * reste tel quel ; le préfixe reçoit 1, 2, 3… Seules les valeurs qui changent sont rendues.
 */
export function prioritesPour(complet: readonly CarnetDoc[], ordre: readonly string[]): { carnetId: string; priorite: number }[] {
  const doc = new Map(complet.map(c => [c.id, c]));
  const l = ordre.map(id => doc.get(id)).filter((c): c is CarnetDoc => !!c);
  let debut = l.length;
  while (debut > 0 && l[debut - 1].carnet.priorite === undefined && (debut === l.length || avant(l[debut - 1], l[debut]))) debut -= 1;
  return l.slice(0, debut).flatMap((c, i) => (c.carnet.priorite === i + 1 ? [] : [{ carnetId: c.id, priorite: i + 1 }]));
}

/** Écrit les priorités (une seule écriture annulable). `avis` : « ✓ … » dit ce qui vient d'être fait. */
export function poserPriorites(etat: Etat, args: { priorites: readonly { carnetId: string; priorite: number }[]; avis?: string }): Resultat {
  if (!args.priorites.length) return refus('Rien à déplacer.');
  const b = new Brouillon(etat);
  for (const p of args.priorites) {
    if (!Number.isInteger(p.priorite) || p.priorite < 1) return refus('Priorité inconnue.');
    const c = b.carnet(p.carnetId);
    if (!c) return refus('Ce carnet n’existe plus.');
    c.carnet.priorite = p.priorite;
    b.ecrire(c);
  }
  return b.resultat(args.avis ?? '✓ Priorité changée');
}
