/**
 * L-13, CA13-2 (tour 13 en ligne : 5 Retour sans effet sur un carnet ouvert depuis le Calendrier ou À venir) : l'entrée d'historique du carnet.
 * Chaque entrée porte le carnet et un jeton propre au Carnet monté qui l'a posée. Une entrée dont le Carnet n'est plus monté (onglet changé,
 * renvoi posé dessus, rechargement) est « orpheline » : y revenir rouvre ce carnet (App) ou le Carnet monté l'adopte, au lieu d'un retour
 * sans effet. Une marque n'est jamais recopiée dans l'entrée d'un autre (renvoi du Calendrier) : sinon le retour la prenait pour la sienne.
 */
export const MARQUE_HISTOIRE = 'laffinee-carnet';
export type MarqueCarnet = { id: string; jeton: string };

/** Les jetons des Carnets montés (Stocks, Atelier) ; une marque hors de cet ensemble est orpheline. */
const vivants = new Set<string>();
export const vivre = (jeton: string) => { vivants.add(jeton); };
export const mourir = (jeton: string) => { vivants.delete(jeton); };
export const nouveauJeton = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

type Etat = Record<string, unknown> | null | undefined;
export function lireMarque(etat: unknown): MarqueCarnet | null {
  const m = (etat as Etat)?.[MARQUE_HISTOIRE] as Partial<MarqueCarnet> | undefined;
  return m && typeof m === 'object' && typeof m.id === 'string' && typeof m.jeton === 'string' ? { id: m.id, jeton: m.jeton } : null;
}
/** L'état d'historique sans marque de carnet : ce qu'un autre écran recopie quand il pose sa propre entrée. */
export function sansMarque(etat: unknown): Record<string, unknown> {
  const { [MARQUE_HISTOIRE]: _m, ...reste } = ((etat ?? {}) as Record<string, unknown>); void _m;
  return reste;
}
export const avecMarque = (etat: unknown, m: MarqueCarnet) => ({ ...sansMarque(etat), [MARQUE_HISTOIRE]: m });
/** La marque orpheline de l'état (aucun Carnet monté ne la tient), ou null. */
export function marqueOrpheline(etat: unknown): MarqueCarnet | null {
  const m = lireMarque(etat);
  return m && !vivants.has(m.jeton) ? m : null;
}

/** Un `history.back()` du Carnet lui-même (quitter le carnet par son bouton, onglet changé) : App ne rouvre rien à son `popstate`.
 *  Le drapeau tient jusqu'après les écouteurs de ce `popstate` (ou 1 s, si l'événement ne vient pas). */
let reculInterne = false;
export function reculerSansRouvrir() {
  reculInterne = true;
  const fin = () => { window.removeEventListener('popstate', fin); setTimeout(() => { reculInterne = false; }, 0); };
  window.addEventListener('popstate', fin);
  setTimeout(() => { reculInterne = false; }, 1000);
  window.history.back();
}
export const reculEstInterne = () => reculInterne;
/** Le carnet à rouvrir quand le retour du téléphone tombe sur une entrée orpheline (App, au `popstate`) ; null sinon. */
export function carnetARouvrir(etat: unknown): string | null {
  if (reculEstInterne()) return null;
  return marqueOrpheline(etat)?.id ?? null;
}
