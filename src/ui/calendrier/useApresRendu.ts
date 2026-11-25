import { useEffect, useRef } from 'react';

/**
 * CAL-74 (K73-3, « lenteur mesurée »). Profil Chrome (processeur ×6, build non minifié) : le premier coût du Calendrier est la mise en page FORCÉE
 * dans la phase de rendu : `useRentree` (Frise, En-tête) et `taireSousPoignees` (Courbe) lisaient `getBoundingClientRect` / `innerWidth` dans un
 * `useLayoutEffect` sans dépendances, donc après CHAQUE rendu, DOM déjà modifié : 138 à 190 ms (ouvrir, relâcher), 170 ms pour 2 s d'une barre tenue
 * au bord (une mise en page complète par image, avant même la peinture).
 * Problème d'école : lectures de mise en page entrelacées avec des écritures (« layout thrashing »). Méthode standard : lire après la peinture
 * (`requestAnimationFrame` puis `setTimeout`, ce que fait déjà un `useEffect`), regrouper (une lecture par rafale de rendus) et espacer
 * (au plus une lecture tous les `espaceMs`, la dernière rafale toujours servie).
 *
 * `faire` est appelée après le rendu, jamais pendant : ce qu'elle pose (une marge de toucher, un nom tu sous une poignée) n'est pas dessiné au
 * même instant que le rendu, mais au plus `espaceMs` plus tard. À l'arrêt de la rafale, la dernière valeur est toujours posée. Sans mise en page
 * (rendu serveur, essais jsdom) la fonction part quand même, après le rendu.
 */
export const ESPACE_LECTURE_MS = 250;

export interface Planificateur { planifier: (faire: () => void) => void; annuler: () => void }

/** Le planificateur sans React (testable) : rafale regroupée, lecture espacée de `espaceMs`, dernière demande toujours servie. */
export function creerPlanificateur(espaceMs = ESPACE_LECTURE_MS, maintenant: () => number = () => performance.now()): Planificateur {
  let minuterie: ReturnType<typeof setTimeout> | null = null;
  let image = 0;
  let derniere = -Infinity;
  let voulu: (() => void) | null = null;
  const annuler = () => {
    if (minuterie !== null) { clearTimeout(minuterie); minuterie = null; }
    if (image && typeof cancelAnimationFrame === 'function') { cancelAnimationFrame(image); }
    image = 0;
    voulu = null;
  };
  const lancer = () => {
    minuterie = null;
    const f = voulu; voulu = null;
    if (!f) return;
    derniere = maintenant();
    f();
  };
  const planifier = (faire: () => void) => {
    voulu = faire;
    /* une demande déjà en attente est remplacée (la dernière gagne) ; son échéance reste : une rafale continue ne repousse pas indéfiniment */
    if (minuterie !== null || image) return;
    const attente = Math.max(0, espaceMs - (maintenant() - derniere));
    const apresImage = () => { image = 0; minuterie = setTimeout(lancer, attente); };
    if (typeof requestAnimationFrame === 'function') image = requestAnimationFrame(apresImage);
    else minuterie = setTimeout(lancer, attente);
  };
  return { planifier, annuler };
}

/** Lit la mise en page après le rendu, regroupée et espacée. `faire` voit toujours le dernier rendu (référence mise à jour à chaque rendu). */
export function useApresRendu(faire: () => void, espaceMs = ESPACE_LECTURE_MS): void {
  const ref = useRef(faire);
  ref.current = faire;
  const plan = useRef<Planificateur | null>(null);
  if (plan.current === null) plan.current = creerPlanificateur(espaceMs);
  /* après chaque rendu : une demande ; la lecture elle-même part hors de la phase de validation */
  useEffect(() => { plan.current?.planifier(() => ref.current()); });
  useEffect(() => () => plan.current?.annuler(), []);
}
